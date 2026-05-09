// Tajika Yogas — classical annual (Varshaphala) aspect yogas.
//
// Tajika is the Indo-Persian/Mughal stream of astrology formalized by
// Neelakantha in Tajaka-Neelakanthi (~1600 CE). It uses Western-style
// angular aspects (conj, sextile, square, trine, opposition) with ORBS
// (deeptamsha — "radiant arc"), applied to the Solar Return / Varshaphala
// chart.
//
// We detect the five canonical sambandha (aspect relations):
//
//   • Itthasala   — applying aspect within orb: slower planet ahead,
//                   faster behind moving toward exactness. Carries a
//                   "promise will fulfil" quality.
//   • Ishraaf     — separating aspect within orb: faster planet has
//                   already passed the exact point. "Promise already
//                   past; diminishing effect."
//   • Muthashila  — (also Istha-sala variant) mutual reception — both
//                   planets in each other's bhava, creating exchange.
//   • Nakta       — transfer of light by a third (slower) planet that
//                   bridges two faster planets not aspecting directly.
//   • Yamaya      — transfer of light by a faster planet bridging two
//                   slower planets.
//   • Manahu      — both planets in the same sign within deeptamsha
//                   orb; considered a strong union.
//
// Input is a Varshaphala-style KundaliResult — any natal chart works too,
// but the yogas are traditionally read against the annual chart.

import { PlanetId } from '../utils/astro-constants';
import { KundaliResult, PlanetPosition } from './kundali.service';

// ─── Tajika orbs (deeptamsha) ───────────────────────────────────────────────
//
// Classical table from Tajaka-Neelakanthi ch.1. Each planet radiates an orb
// within which it accepts Tajika-style aspects.
const DEEPTAMSHA: Record<PlanetId, number> = {
  SU: 15, MO: 12, MA: 8, ME: 7, JU: 9, VE: 7, SA: 9, RA: 15, KE: 15,
};

/** Combined orb for an aspect between two planets = (orbA + orbB) / 2. */
function combinedOrb(a: PlanetId, b: PlanetId): number {
  return (DEEPTAMSHA[a] + DEEPTAMSHA[b]) / 2;
}

// ─── Aspect angles (Tajika) ─────────────────────────────────────────────────

export type TajikaAspect =
  | 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';

const ASPECT_ANGLES: Record<TajikaAspect, number> = {
  conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180,
};

/** Signed shortest angular distance from a to b, in (-180, 180]. */
function angDist(a: number, b: number): number {
  return ((a - b + 540) % 360) - 180;
}

/** Faster planet in Tajika: apparent motion in deg/day. Swisseph 'speed'. */
function speedFaster(a: PlanetPosition, b: PlanetPosition): PlanetPosition {
  return Math.abs(a.speed) >= Math.abs(b.speed) ? a : b;
}
function speedSlower(a: PlanetPosition, b: PlanetPosition): PlanetPosition {
  return Math.abs(a.speed) < Math.abs(b.speed) ? a : b;
}

// ─── Pair-level aspect detection ────────────────────────────────────────────

export interface TajikaSambandha {
  a: PlanetId;
  b: PlanetId;
  aspect: TajikaAspect;
  /** Exact angular difference from the perfect aspect angle (in degrees) */
  orb: number;
  /** Allowed combined deeptamsha orb for this pair */
  allowed: number;
  /** Which sambandha classification */
  relation: 'Itthasala' | 'Ishraaf' | 'Manahu';
  /** Applying/separating */
  applying: boolean;
  /** Faster planet id */
  faster: PlanetId;
  /** Slower planet id */
  slower: PlanetId;
}

function detectPairSambandha(a: PlanetPosition, b: PlanetPosition): TajikaSambandha | null {
  const sep = Math.abs(angDist(a.longitude, b.longitude));
  const orbLimit = combinedOrb(a.id, b.id);

  // Check each aspect angle for a match within orb
  for (const [aspect, angle] of Object.entries(ASPECT_ANGLES) as [TajikaAspect, number][]) {
    const diff = Math.abs(sep - angle);
    if (diff <= orbLimit) {
      const fast = speedFaster(a, b);
      const slow = speedSlower(a, b);

      // Applying = faster is moving toward exactness. For conjunction/
      // opposition/square this means the signed longitude of the faster is
      // approaching the slower's at that angle. We simplify by computing the
      // signed difference and seeing if it is increasing (separating) or
      // decreasing (applying).
      const slowPos = slow.longitude;
      const fastPos = fast.longitude;
      // Position of "exact aspect target" from the slower's side:
      // For angles other than 0, there are two targets; we pick the closer.
      const targets = [
        (slowPos + angle + 360) % 360,
        (slowPos - angle + 360) % 360,
      ];
      const signedToTarget = targets.map((t) => angDist(t, fastPos));
      const nearest = signedToTarget
        .map((v) => Math.abs(v))
        .indexOf(Math.min(...signedToTarget.map((v) => Math.abs(v))));
      const signed = signedToTarget[nearest];
      // Faster's relative motion = (fast.speed - slow.speed).
      const relSpeed = fast.speed - slow.speed;
      const applying = signed * relSpeed > 0; // same sign = approaching target

      let relation: TajikaSambandha['relation'];
      if (aspect === 'conjunction' && Math.abs(sep) <= orbLimit) relation = 'Manahu';
      else relation = applying ? 'Itthasala' : 'Ishraaf';

      return {
        a: a.id, b: b.id, aspect,
        orb: Math.round(diff * 100) / 100,
        allowed: Math.round(orbLimit * 100) / 100,
        relation,
        applying,
        faster: fast.id,
        slower: slow.id,
      };
    }
  }
  return null;
}

// ─── Transfer-of-light (Nakta / Yamaya) ──────────────────────────────────────
//
// When two planets A, B don't aspect each other directly within orb, but a
// third planet C aspects BOTH within orb, C "transfers" light from one to
// the other. Named by whether C is faster than both (Nakta) or slower than
// both (Yamaya).

export interface TajikaTransfer {
  kind: 'Nakta' | 'Yamaya';
  a: PlanetId;
  b: PlanetId;
  via: PlanetId;
}

function transfers(planets: PlanetPosition[], pairs: Map<string, TajikaSambandha>): TajikaTransfer[] {
  const out: TajikaTransfer[] = [];
  const key = (x: PlanetId, y: PlanetId) => [x, y].sort().join(':');

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const a = planets[i];
      const b = planets[j];
      if (pairs.has(key(a.id, b.id))) continue; // direct aspect already

      // Find a C that aspects both A and B
      for (const c of planets) {
        if (c.id === a.id || c.id === b.id) continue;
        const sAC = pairs.get(key(a.id, c.id));
        const sBC = pairs.get(key(b.id, c.id));
        if (!sAC || !sBC) continue;

        const cSpeed = Math.abs(c.speed);
        const aSpeed = Math.abs(a.speed);
        const bSpeed = Math.abs(b.speed);
        if (cSpeed > aSpeed && cSpeed > bSpeed) {
          out.push({ kind: 'Nakta', a: a.id, b: b.id, via: c.id });
        } else if (cSpeed < aSpeed && cSpeed < bSpeed) {
          out.push({ kind: 'Yamaya', a: a.id, b: b.id, via: c.id });
        }
      }
    }
  }
  return out;
}

// ─── Aggregate ───────────────────────────────────────────────────────────────

export interface TajikaResult {
  sambandhas: TajikaSambandha[];
  transfers: TajikaTransfer[];
  summary: {
    itthasala: number;
    ishraaf: number;
    manahu: number;
    nakta: number;
    yamaya: number;
  };
}

const SEVEN: PlanetId[] = ['SU','MO','MA','ME','JU','VE','SA'];

export function computeTajikaYogas(k: KundaliResult): TajikaResult {
  const planets = k.planets.filter((p) => SEVEN.includes(p.id));
  const sambandhas: TajikaSambandha[] = [];
  const map = new Map<string, TajikaSambandha>();

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const s = detectPairSambandha(planets[i], planets[j]);
      if (s) {
        sambandhas.push(s);
        map.set([s.a, s.b].sort().join(':'), s);
      }
    }
  }

  const xfer = transfers(planets, map);

  const summary = {
    itthasala: sambandhas.filter((s) => s.relation === 'Itthasala').length,
    ishraaf:   sambandhas.filter((s) => s.relation === 'Ishraaf').length,
    manahu:    sambandhas.filter((s) => s.relation === 'Manahu').length,
    nakta:     xfer.filter((x) => x.kind === 'Nakta').length,
    yamaya:    xfer.filter((x) => x.kind === 'Yamaya').length,
  };
  return { sambandhas, transfers: xfer, summary };
}
