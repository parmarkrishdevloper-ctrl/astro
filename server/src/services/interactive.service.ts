// Interactive chart services.
//
//   • planetDetail(k, planetId)  — full contextual drawer for one planet
//   • dispositorTree(k)          — per-planet → sign-lord chain until cycle
//   • aspectWeb(k)               — all planet-to-planet aspect edges
//   • compareCharts(A, B)        — synastry-style bi-wheel data
//   • compositeChart(A, B)       — midpoint positions

import { KundaliResult, PlanetPosition } from './kundali.service';
import { PlanetId, RASHIS, SPECIAL_ASPECTS, normDeg } from '../utils/astro-constants';
import { currentDasha } from './dasha.service';
import { REMEDIES, getRemedyEntry } from '../data/remedies';
import { Locale } from '../i18n';
import { findEntry } from '../data/encyclopedia';

// ─── Click-a-planet drawer ─────────────────────────────────────────────────
export interface PlanetAspectEdge {
  from: PlanetId; to: PlanetId; houseDiff: number; kind: '7th' | 'special';
}

export interface PlanetDrawer {
  planet: PlanetPosition;
  /** Entry from encyclopedia for this graha */
  enc: ReturnType<typeof findEntry>;
  /** Dignity summary */
  dignity: {
    exalted: boolean; debilitated: boolean; ownSign: boolean; combust: boolean; retrograde: boolean;
    label: string;
  };
  /** Houses this planet is lord of (via sign-rulership vs lagna) */
  lordOf: number[];
  /** Other planets sharing this sign */
  conjunctions: PlanetId[];
  /** Planets aspecting THIS planet; + planets THIS planet aspects */
  aspectsReceived: PlanetAspectEdge[];
  aspectsGiven:    PlanetAspectEdge[];
  /** Dispositor chain — sign-lord → sign-lord until repeat */
  dispositorChain: PlanetId[];
  /** Is this planet currently a running dasha lord? */
  currentDasha: { maha: boolean; antar: boolean; pratyantar: boolean };
  /** Remedies attached to this planet */
  remedies?: typeof REMEDIES[PlanetId];
}

function lordshipOf(k: KundaliResult, id: PlanetId): number[] {
  const out: number[] = [];
  k.houses.forEach((h) => { if (h.lord === id) out.push(h.num); });
  return out;
}

function conjunctionsFor(k: KundaliResult, id: PlanetId): PlanetId[] {
  const p = k.planets.find((x) => x.id === id);
  if (!p) return [];
  return k.planets.filter((o) => o.id !== id && o.rashi.num === p.rashi.num).map((o) => o.id);
}

function aspectRels(k: KundaliResult): PlanetAspectEdge[] {
  const edges: PlanetAspectEdge[] = [];
  for (const a of k.planets) {
    for (const b of k.planets) {
      if (a.id === b.id) continue;
      const diff = (b.rashi.num - a.rashi.num + 12) % 12;
      if (diff === 6) edges.push({ from: a.id, to: b.id, houseDiff: 7, kind: '7th' });
      for (const sp of (SPECIAL_ASPECTS[a.id] ?? [])) {
        if (diff === sp - 1) edges.push({ from: a.id, to: b.id, houseDiff: sp, kind: 'special' });
      }
    }
  }
  return edges;
}

function buildDispositorChain(k: KundaliResult, id: PlanetId): PlanetId[] {
  const chain: PlanetId[] = [id];
  let cursor: PlanetId = id;
  for (let i = 0; i < 9; i++) {
    const p = k.planets.find((pl) => pl.id === cursor);
    if (!p) break;
    const signLord = RASHIS[p.rashi.num - 1].lord;
    if (chain.includes(signLord)) { chain.push(signLord); break; }
    chain.push(signLord);
    cursor = signLord;
  }
  return chain;
}

export function planetDetail(k: KundaliResult, planetId: PlanetId, atDate: Date = new Date(), locale: Locale = 'en'): PlanetDrawer {
  const p = k.planets.find((x) => x.id === planetId);
  if (!p) throw new Error(`Unknown planet ${planetId}`);

  const edges = aspectRels(k);
  const dd = currentDasha(k, atDate);
  const label = p.exalted ? 'Exalted' : p.debilitated ? 'Debilitated'
    : p.ownSign ? 'Own sign' : p.combust ? 'Combust' : p.retrograde ? 'Retrograde' : 'Neutral';

  return {
    planet: p,
    enc: findEntry('planet', planetId, locale),
    dignity: {
      exalted: p.exalted, debilitated: p.debilitated, ownSign: p.ownSign,
      combust: p.combust, retrograde: p.retrograde,
      label,
    },
    lordOf: lordshipOf(k, planetId),
    conjunctions: conjunctionsFor(k, planetId),
    aspectsReceived: edges.filter((e) => e.to === planetId),
    aspectsGiven:    edges.filter((e) => e.from === planetId),
    dispositorChain: buildDispositorChain(k, planetId),
    currentDasha: {
      maha:       dd?.maha?.lord === planetId,
      antar:      dd?.antar?.lord === planetId,
      pratyantar: dd?.pratyantar?.lord === planetId,
    },
    remedies: getRemedyEntry(planetId, locale),
  };
}

// ─── Full dispositor tree for all 9 planets ─────────────────────────────────
export interface DispositorTree {
  chains: Record<PlanetId, PlanetId[]>;
  /** Planets that end in their own sign — final dispositors of the chart. */
  finalDispositors: PlanetId[];
}

export function dispositorTree(k: KundaliResult): DispositorTree {
  const chains = {} as Record<PlanetId, PlanetId[]>;
  const ids: PlanetId[] = ['SU','MO','MA','ME','JU','VE','SA','RA','KE'];
  for (const id of ids) chains[id] = buildDispositorChain(k, id);
  // A planet is a final dispositor if it's its own dispositor (sits in its own sign)
  const finalDispositors = ids.filter((id) => {
    const p = k.planets.find((x) => x.id === id);
    return p && RASHIS[p.rashi.num - 1].lord === id;
  });
  return { chains, finalDispositors };
}

// ─── Aspect web (all edges) ─────────────────────────────────────────────────
export interface AspectWeb {
  nodes: { id: PlanetId; signNum: number; longitude: number; house: number }[];
  edges: PlanetAspectEdge[];
}

export function aspectWeb(k: KundaliResult): AspectWeb {
  return {
    nodes: k.planets.map((p) => ({
      id: p.id, signNum: p.rashi.num, longitude: p.longitude, house: p.house,
    })),
    edges: aspectRels(k),
  };
}

// ─── Synastry — bi-wheel comparison ────────────────────────────────────────
// For each planet in chart A, check if it is in kendra (1/4/7/10) or trikona
// (5/9) from any planet in chart B. This is the classical sign-based synastry.

export interface SynastryHit {
  aPlanet: PlanetId; aSign: number;
  bPlanet: PlanetId; bSign: number;
  relation: 'conjunct' | 'kendra' | 'trikona' | '7th' | 'other';
  houseDiff: number;
}

export interface SynastryResult {
  /** The ashtakoota score isn't recomputed here (that lives in matching.service)
   *  — this is the visual bi-wheel overlay. */
  hits: SynastryHit[];
  aPositions: { id: PlanetId; sign: number; longitude: number }[];
  bPositions: { id: PlanetId; sign: number; longitude: number }[];
  aLagna: number;
  bLagna: number;
  /** Where A's planets fall in B's house system */
  aPlanetsInBHouses: { id: PlanetId; house: number }[];
}

function relationFor(diff: number): SynastryHit['relation'] {
  if (diff === 0) return 'conjunct';
  if ([3, 6, 9].includes(diff)) return 'kendra'; // 4th, 7th, 10th (diff is 0-indexed)
  if ([4, 8].includes(diff))    return 'trikona';
  if (diff === 6)               return '7th';
  return 'other';
}

export function compareCharts(A: KundaliResult, B: KundaliResult): SynastryResult {
  const hits: SynastryHit[] = [];
  for (const a of A.planets) {
    for (const b of B.planets) {
      const diff = (b.rashi.num - a.rashi.num + 12) % 12;
      const rel = relationFor(diff);
      if (rel !== 'other') {
        hits.push({
          aPlanet: a.id, aSign: a.rashi.num,
          bPlanet: b.id, bSign: b.rashi.num,
          relation: rel, houseDiff: diff + 1,
        });
      }
    }
  }
  const bLagnaSign = B.ascendant.rashi.num;
  const aPlanetsInBHouses = A.planets.map((p) => ({
    id: p.id, house: ((p.rashi.num - bLagnaSign + 12) % 12) + 1,
  }));
  return {
    hits,
    aPositions: A.planets.map((p) => ({ id: p.id, sign: p.rashi.num, longitude: p.longitude })),
    bPositions: B.planets.map((p) => ({ id: p.id, sign: p.rashi.num, longitude: p.longitude })),
    aLagna: A.ascendant.longitude,
    bLagna: B.ascendant.longitude,
    aPlanetsInBHouses,
  };
}

// ─── Composite chart (midpoints) ─────────────────────────────────────────────
// Composite chart = midpoint of each body on the shorter arc between the two
// natives. Traditional Western technique applied to sidereal positions.

function midpointForward(a: number, b: number): number {
  const d = (b - a + 360) % 360;
  const half = d > 180 ? (d - 360) / 2 : d / 2;
  return normDeg(a + half + (d > 180 ? 360 : 0));
}

export interface CompositePoint {
  id: PlanetId;
  longitude: number;
  signNum: number;
  signName: string;
}

export interface CompositeResult {
  ascendant: CompositePoint;
  planets: CompositePoint[];
}

export function compositeChart(A: KundaliResult, B: KundaliResult): CompositeResult {
  const makePoint = (id: PlanetId, lngA: number, lngB: number): CompositePoint => {
    const m = midpointForward(lngA, lngB);
    const s = Math.floor(m / 30) + 1;
    return { id, longitude: m, signNum: s, signName: RASHIS[s - 1].name };
  };
  const planets: CompositePoint[] = A.planets.map((pa) => {
    const pb = B.planets.find((x) => x.id === pa.id)!;
    return makePoint(pa.id, pa.longitude, pb.longitude);
  });
  const ascendant: CompositePoint = {
    id: 'SU' as PlanetId, // placeholder — we re-set below
    longitude: midpointForward(A.ascendant.longitude, B.ascendant.longitude),
    signNum: 0, signName: '',
  };
  const s = Math.floor(ascendant.longitude / 30) + 1;
  ascendant.signNum = s;
  ascendant.signName = RASHIS[s - 1].name;
  return { ascendant, planets };
}
