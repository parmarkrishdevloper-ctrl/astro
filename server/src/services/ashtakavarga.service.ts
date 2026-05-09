// Ashtakavarga — the BPHS benefic-point system.
//
// For each of the 7 grahas (Su, Mo, Ma, Me, Ju, Ve, Sa) and the Ascendant
// (8 contributors), we tabulate which of the 12 signs (counted from the
// contributor's own sign) receive a "benefic point" with respect to the
// reference graha. The reference graha gets a Bhinnashtakavarga (BAV) chart:
// a 12-sign array of point counts, max 8 per sign.
//
// Sum of all 7 BAVs = Sarvashtakavarga (SAV), max 337 across the zodiac.
//
// The BPHS benefic-house tables for each graha vs each contributor are
// the canonical source. They're encoded below as constant arrays.

import { PlanetId } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';

// Reference grahas (the chart owners).
const REF: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA'];
// Contributors include the 7 grahas + Ascendant ('LG').
type Contrib = PlanetId | 'LG';
const CONTRIB: Contrib[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA', 'LG'];

// Benefic houses table per BPHS Ch.66. Indexed [reference][contributor]
// → list of houses (1..12) counted from the contributor's sign that receive
// a point in the reference graha's chart.
//
// (Verified against standard BPHS English editions.)
const BAV_TABLE: Record<PlanetId, Record<Contrib, number[]>> = {
  SU: {
    SU: [1, 2, 4, 7, 8, 9, 10, 11],
    MO: [3, 6, 10, 11],
    MA: [1, 2, 4, 7, 8, 9, 10, 11],
    ME: [3, 5, 6, 9, 10, 11, 12],
    JU: [5, 6, 9, 11],
    VE: [6, 7, 12],
    SA: [1, 2, 4, 7, 8, 9, 10, 11],
    LG: [3, 4, 6, 10, 11, 12],
  },
  MO: {
    SU: [3, 6, 7, 8, 10, 11],
    MO: [1, 3, 6, 7, 10, 11],
    MA: [2, 3, 5, 6, 9, 10, 11],
    ME: [1, 3, 4, 5, 7, 8, 10, 11],
    JU: [1, 4, 7, 8, 10, 11, 12],
    VE: [3, 4, 5, 7, 9, 10, 11],
    SA: [3, 5, 6, 11],
    LG: [3, 6, 10, 11],
  },
  MA: {
    SU: [3, 5, 6, 10, 11],
    MO: [3, 6, 11],
    MA: [1, 2, 4, 7, 8, 10, 11],
    ME: [3, 5, 6, 11],
    JU: [6, 10, 11, 12],
    VE: [6, 8, 11, 12],
    SA: [1, 4, 7, 8, 9, 10, 11],
    LG: [1, 3, 6, 10, 11],
  },
  ME: {
    SU: [5, 6, 9, 11, 12],
    MO: [2, 4, 6, 8, 10, 11],
    MA: [1, 2, 4, 7, 8, 9, 10, 11],
    ME: [1, 3, 5, 6, 9, 10, 11, 12],
    JU: [6, 8, 11, 12],
    VE: [1, 2, 3, 4, 5, 8, 9, 11],
    SA: [1, 2, 4, 7, 8, 9, 10, 11],
    LG: [1, 2, 4, 6, 8, 10, 11],
  },
  JU: {
    SU: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    MO: [2, 5, 7, 9, 11],
    MA: [1, 2, 4, 7, 8, 10, 11],
    ME: [1, 2, 4, 5, 6, 9, 10, 11],
    JU: [1, 2, 3, 4, 7, 8, 10, 11],
    VE: [2, 5, 6, 9, 10, 11],
    SA: [3, 5, 6, 12],
    LG: [1, 2, 4, 5, 6, 7, 9, 10, 11],
  },
  VE: {
    SU: [8, 11, 12],
    MO: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    MA: [3, 5, 6, 9, 11, 12],
    ME: [3, 5, 6, 9, 11],
    JU: [5, 8, 9, 10, 11],
    VE: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    SA: [3, 4, 5, 8, 9, 10, 11],
    LG: [1, 2, 3, 4, 5, 8, 9, 11],
  },
  SA: {
    SU: [1, 2, 4, 7, 8, 10, 11],
    MO: [3, 6, 11],
    MA: [3, 5, 6, 10, 11, 12],
    ME: [6, 8, 9, 10, 11, 12],
    JU: [5, 6, 11, 12],
    VE: [6, 11, 12],
    SA: [3, 5, 6, 11],
    LG: [1, 3, 4, 6, 10, 11],
  },
};

/** Sign (1..12) of a planet or 'LG' (Lagna). */
function signOf(k: KundaliResult, c: Contrib): number {
  if (c === 'LG') return k.ascendant.rashi.num;
  return k.planets.find((p) => p.id === c)!.rashi.num;
}

export interface BAV {
  reference: PlanetId;
  /** points per sign (index 0 = Aries, 11 = Pisces) */
  points: number[];
  total: number;
}

export interface SAV {
  /** points per sign (index 0 = Aries) */
  points: number[];
  total: number;
}

/** Build the BAV chart for a single reference graha. */
export function buildBAV(k: KundaliResult, ref: PlanetId): BAV {
  const points = new Array(12).fill(0);
  for (const c of CONTRIB) {
    const cSign = signOf(k, c); // 1..12
    const beneficHouses = BAV_TABLE[ref][c];
    for (const h of beneficHouses) {
      // House h counted from contributor's sign → resulting sign:
      const targetSign = ((cSign - 1 + (h - 1)) % 12); // 0..11
      points[targetSign] += 1;
    }
  }
  return {
    reference: ref,
    points,
    total: points.reduce((s, n) => s + n, 0),
  };
}

/** Build BAV charts for all 7 grahas. */
export function buildAllBAV(k: KundaliResult): Record<PlanetId, BAV> {
  const out: Partial<Record<PlanetId, BAV>> = {};
  for (const r of REF) out[r] = buildBAV(k, r);
  return out as Record<PlanetId, BAV>;
}

/** SAV = sum of all 7 BAVs per sign (max 337). */
export function buildSAV(bavs: Record<PlanetId, BAV>): SAV {
  const points = new Array(12).fill(0);
  for (const r of REF) {
    bavs[r].points.forEach((v, i) => (points[i] += v));
  }
  return { points, total: points.reduce((s, n) => s + n, 0) };
}

// ─── Reductions ─────────────────────────────────────────────────────────────
//
// Trikona Shodhana — for each set of three signs that form a trine
// (1-5-9, 2-6-10, 3-7-11, 4-8-12), keep the lowest value of the trio in
// each sign and subtract it from all three (this is one common formulation).
//
// Ekadhipatya Shodhana — for two signs ruled by the same lord, the lower
// value gets reduced or zeroed under specific conditions. We implement the
// simplified PL form: take the smaller value, subtract it from both.

export function trikonaShodhana(bav: BAV): BAV {
  const points = [...bav.points];
  const TRINES: number[][] = [
    [0, 4, 8],   // Aries / Leo / Sag
    [1, 5, 9],   // Taurus / Virgo / Cap
    [2, 6, 10],  // Gemini / Libra / Aqu
    [3, 7, 11],  // Cancer / Scorpio / Pisces
  ];
  for (const tri of TRINES) {
    const min = Math.min(...tri.map((i) => points[i]));
    if (min > 0) for (const i of tri) points[i] -= min;
  }
  return { reference: bav.reference, points, total: points.reduce((s, n) => s + n, 0) };
}

export function ekadhipatyaShodhana(bav: BAV): BAV {
  const points = [...bav.points];
  // Sign-pairs ruled by the same planet (excluding Sun & Moon which rule
  // only one sign each). Indices are 0-based.
  const PAIRS: [number, number][] = [
    [0, 7],   // Mars: Aries, Scorpio
    [1, 6],   // Venus: Taurus, Libra
    [2, 5],   // Mercury: Gemini, Virgo
    [8, 11],  // Jupiter: Sag, Pisces
    [9, 10],  // Saturn: Cap, Aquarius
  ];
  for (const [a, b] of PAIRS) {
    const min = Math.min(points[a], points[b]);
    if (min > 0) {
      points[a] -= min;
      points[b] -= min;
    }
  }
  return { reference: bav.reference, points, total: points.reduce((s, n) => s + n, 0) };
}

// ─── Kaksha (sub-divisions) ─────────────────────────────────────────────────
//
// Each sign is divided into 8 Kakshas of 3°45' each. Kaksha lords sequence
// (per sign): Sa, Ju, Ma, Su, Ve, Me, Mo, Lg. The transit planet's Kaksha
// at any moment determines its sub-period quality.

const KAKSHA_LORDS: Contrib[] = ['SA', 'JU', 'MA', 'SU', 'VE', 'ME', 'MO', 'LG'];
export const KAKSHA_WIDTH = 30 / 8; // 3.75°

export interface KakshaInfo {
  signNum: number;
  kakshaIndex: number;     // 0..7
  kakshaLord: Contrib;
  /** Whether this Kaksha contributes a benefic point in the reference's BAV. */
  beneficForReference?: boolean;
}

export function kakshaForLongitude(longitude: number, ref?: PlanetId, k?: KundaliResult): KakshaInfo {
  const norm = ((longitude % 360) + 360) % 360;
  const signNum = Math.floor(norm / 30) + 1;
  const within = norm - (signNum - 1) * 30;
  const kakshaIndex = Math.min(7, Math.floor(within / KAKSHA_WIDTH));
  const lord = KAKSHA_LORDS[kakshaIndex];

  let beneficForReference: boolean | undefined;
  if (ref && k) {
    const refSign = signOf(k, ref);
    // The "house from contributor" of this sign:
    const lordSign = signOf(k, lord);
    const houseFromLord = ((signNum - lordSign + 12) % 12) + 1;
    beneficForReference = BAV_TABLE[ref][lord].includes(houseFromLord);
  }

  return { signNum, kakshaIndex, kakshaLord: lord, beneficForReference };
}

// ─── Top-level result ───────────────────────────────────────────────────────

export interface AshtakavargaResult {
  bav: Record<PlanetId, BAV>;
  sav: SAV;
  trikonaShodhita: Record<PlanetId, BAV>;
  ekadhipatyaShodhita: Record<PlanetId, BAV>;
}

export function calculateAshtakavarga(k: KundaliResult): AshtakavargaResult {
  const bav = buildAllBAV(k);
  const sav = buildSAV(bav);
  const trikona: Partial<Record<PlanetId, BAV>> = {};
  const ekadhi: Partial<Record<PlanetId, BAV>> = {};
  for (const r of REF) {
    trikona[r] = trikonaShodhana(bav[r]);
    ekadhi[r]  = ekadhipatyaShodhana(trikona[r]!);
  }
  return {
    bav,
    sav,
    trikonaShodhita: trikona as Record<PlanetId, BAV>,
    ekadhipatyaShodhita: ekadhi as Record<PlanetId, BAV>,
  };
}
