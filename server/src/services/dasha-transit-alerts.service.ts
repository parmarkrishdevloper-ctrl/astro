// Dasha–Transit overlap alerts.
//
// Highlights moments where multiple timing factors align on the *same*
// natal house or sign. These are the windows classical texts call "when
// the promise fructifies" — multiple timing engines pointing to the same
// indicator simultaneously.
//
// The alert score for a date is a weighted sum of:
//   A. Mahadasha lord → which natal house does it occupy?
//   B. Antardasha lord → natal house
//   C. Current Jupiter transit → natal house
//   D. Current Saturn transit → natal house
//
// When 3+ of these point at the same house, it's a major alert window.
// House "topics" mapped to plain labels so the output reads like alerts.

import { KundaliResult } from './kundali.service';
import { PlanetId, normDeg, RASHIS } from '../utils/astro-constants';
import { currentDasha } from './dasha.service';
import { computeBody } from './ephemeris.service';
import { dateToJD } from '../utils/julian';
import swisseph from 'swisseph';

const { SE_JUPITER, SE_SATURN } = swisseph;

export interface DashaTransitAlert {
  date: string;
  focusHouses: number[];          // houses with ≥2 alignments
  dominantHouse: number;          // house with highest vote
  score: number;                  // 1..4 — how many factors align on dominantHouse
  factors: {
    mahaLord: PlanetId;   mahaHouse: number;
    antarLord: PlanetId | null; antarHouse: number | null;
    jupiterHouse: number;
    saturnHouse: number;
  };
  topic: string;                  // human-readable dominant-house label
}

const HOUSE_TOPIC: Record<number, string> = {
  1:  'Self, body, identity',
  2:  'Wealth, family, speech',
  3:  'Siblings, courage, effort',
  4:  'Home, mother, property',
  5:  'Creativity, children, studies',
  6:  'Enemies, health, work',
  7:  'Partnership, marriage',
  8:  'Transformation, crises',
  9:  'Fortune, father, travel',
 10:  'Career, fame, authority',
 11:  'Gains, friends, fulfilment',
 12:  'Losses, moksha, foreign',
};

function houseOfPlanetInNatal(k: KundaliResult, planetId: PlanetId): number {
  const p = k.planets.find((x) => x.id === planetId);
  return p ? p.house : 1;
}

function houseOfSignInNatal(k: KundaliResult, signNum: number): number {
  const lagnaSign = k.ascendant.rashi.num;
  return ((signNum - lagnaSign + 12) % 12) + 1;
}

function signOf(lng: number): number {
  return Math.floor(normDeg(lng) / 30) + 1;
}

export interface AlertOptions {
  natal: KundaliResult;
  start: string;
  days: number;
  /** Probe interval in days; default 7 (weekly sampling). */
  stepDays?: number;
  /** Minimum factor alignment to report (1..4). Default 2. */
  minScore?: number;
}

export function computeDashaTransitAlerts(opts: AlertOptions): DashaTransitAlert[] {
  const step = opts.stepDays ?? 7;
  const minScore = opts.minScore ?? 2;
  const days = Math.min(3650, Math.max(1, opts.days));

  const startJD = dateToJD(new Date(opts.start));
  const alerts: DashaTransitAlert[] = [];

  for (let i = 0; i <= days; i += step) {
    const jd = startJD + i;
    const sampleDate = new Date(new Date(opts.start).getTime() + i * 86400000);

    const dasha = currentDasha(opts.natal, sampleDate);
    if (!dasha) continue;
    const mahaLord = dasha.maha.lord as PlanetId;
    const antarLord = (dasha.antar?.lord ?? null) as PlanetId | null;

    const jupiter = computeBody(jd, SE_JUPITER);
    const saturn  = computeBody(jd, SE_SATURN);

    const factors = {
      mahaLord,
      mahaHouse: houseOfPlanetInNatal(opts.natal, mahaLord),
      antarLord,
      antarHouse: antarLord ? houseOfPlanetInNatal(opts.natal, antarLord) : null,
      jupiterHouse: houseOfSignInNatal(opts.natal, signOf(jupiter.longitude)),
      saturnHouse:  houseOfSignInNatal(opts.natal, signOf(saturn.longitude)),
    };

    // Tally house hits
    const hits: Record<number, number> = {};
    const bump = (h: number | null) => { if (h != null) hits[h] = (hits[h] ?? 0) + 1; };
    bump(factors.mahaHouse);
    bump(factors.antarHouse);
    bump(factors.jupiterHouse);
    bump(factors.saturnHouse);

    const sortedHouses = Object.entries(hits)
      .map(([h, c]) => ({ h: Number(h), c }))
      .sort((a, b) => b.c - a.c);
    if (!sortedHouses.length) continue;
    const top = sortedHouses[0];
    if (top.c < minScore) continue;

    alerts.push({
      date: sampleDate.toISOString(),
      focusHouses: sortedHouses.filter((x) => x.c >= 2).map((x) => x.h),
      dominantHouse: top.h,
      score: top.c,
      factors,
      topic: HOUSE_TOPIC[top.h],
    });
  }
  return alerts;
}
