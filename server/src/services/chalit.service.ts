// Bhava Chalit chart — assigns planets to houses using actual cuspal
// boundaries (not whole-sign). Two classical methods supported:
//
//   'placidus' — Placidus cusps mark house *beginnings*. A planet at
//                longitude L sits in house i if cusps[i-1] ≤ L < cusps[i].
//                This is what KP and most modern Western software uses.
//
//   'sripati'  — Parashara's classical method. The cusp is the *middle*
//                of the bhava; house i spans from midpoint(cusp[i-1],
//                cusp[i]) to midpoint(cusp[i], cusp[i+1]).
//
// Compared to the whole-sign assignment in kundali.service, the chalit
// position can shift a planet one house forward or backward when it sits
// near a sign boundary — a very common reason predictive readings differ
// between astrologers.

import { KundaliResult, PlanetPosition } from './kundali.service';
import { normDeg, RASHIS } from '../utils/astro-constants';

export type ChalitMethod = 'placidus' | 'sripati';

export interface ChalitBhava {
  num: number;                  // 1..12
  start: number;                // sidereal longitude where bhava begins
  end: number;                  // where it ends (may wrap 360)
  midpoint: number;             // cusp (classical sense) of this bhava
  rashiAtStart: { num: number; name: string };
  rashiAtMid: { num: number; name: string };
}

export interface ChalitPlacement {
  id: string;
  longitude: number;
  wholeSignHouse: number;       // from KundaliResult (for comparison)
  chalitHouse: number;          // computed here
  shifted: boolean;             // differs from whole-sign?
  shiftDirection: 'forward' | 'backward' | 'same';
}

export interface ChalitResult {
  method: ChalitMethod;
  bhavas: ChalitBhava[];
  planets: ChalitPlacement[];
  /** planets whose chalit house differs from whole-sign house */
  shiftedPlanets: string[];
}

/** Span in degrees between two longitudes going forward (a → b), 0..360. */
function forwardSpan(a: number, b: number): number {
  const d = (b - a + 360) % 360;
  return d === 0 ? 360 : d;
}

/** Midpoint between two longitudes taking the forward (short) arc from a→b. */
function midForward(a: number, b: number): number {
  const span = forwardSpan(a, b);
  return normDeg(a + span / 2);
}

/** Does longitude x fall in the forward arc from a to b (exclusive of b)? */
function inForwardArc(x: number, a: number, b: number): boolean {
  const ax = (x - a + 360) % 360;
  const ab = forwardSpan(a, b);
  return ax < ab;
}

/** Build 12 bhava spans from 12 Placidus cusps using the chosen method. */
export function buildBhavas(cusps: number[], method: ChalitMethod = 'placidus'): ChalitBhava[] {
  if (cusps.length !== 12) throw new Error(`Expected 12 cusps, got ${cusps.length}`);
  const c = cusps.map(normDeg);

  return Array.from({ length: 12 }, (_, i) => {
    const prev = c[(i + 11) % 12];
    const curr = c[i];
    const next = c[(i + 1) % 12];

    let start: number;
    let end: number;
    let mid: number;
    if (method === 'placidus') {
      start = curr;
      end = next;
      mid = midForward(start, end);
    } else {
      // Sripati: bhava i's midpoint IS the cusp[i]; its boundaries are
      // the midpoints to the neighbouring cusps.
      start = midForward(prev, curr);
      end = midForward(curr, next);
      mid = curr;
    }

    const rStart = Math.floor(start / 30);
    const rMid = Math.floor(mid / 30);

    return {
      num: i + 1,
      start,
      end,
      midpoint: mid,
      rashiAtStart: { num: rStart + 1, name: RASHIS[rStart].name },
      rashiAtMid:   { num: rMid + 1,   name: RASHIS[rMid].name   },
    };
  });
}

/** Which bhava does a given longitude fall in? Returns 1..12. */
function bhavaOfLongitude(lng: number, bhavas: ChalitBhava[]): number {
  for (const b of bhavas) {
    if (inForwardArc(lng, b.start, b.end)) return b.num;
  }
  // Shouldn't happen — but guard anyway.
  return 1;
}

export function computeChalit(k: KundaliResult, method: ChalitMethod = 'placidus'): ChalitResult {
  const cusps = k.houses.map((h) => h.cuspLongitude);
  const bhavas = buildBhavas(cusps, method);

  const placements: ChalitPlacement[] = k.planets.map((p: PlanetPosition) => {
    const chalitHouse = bhavaOfLongitude(p.longitude, bhavas);
    const diff = ((chalitHouse - p.house + 12) % 12);
    const shiftDirection =
      diff === 0 ? 'same'
      : diff <= 6 ? 'forward'
      : 'backward';
    return {
      id: p.id,
      longitude: p.longitude,
      wholeSignHouse: p.house,
      chalitHouse,
      shifted: chalitHouse !== p.house,
      shiftDirection,
    };
  });

  const shiftedPlanets = placements.filter((p) => p.shifted).map((p) => p.id);

  return { method, bhavas, planets: placements, shiftedPlanets };
}
