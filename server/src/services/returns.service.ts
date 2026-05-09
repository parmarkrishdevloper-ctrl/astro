// Planetary returns — Saturn, Jupiter, Solar, Lunar, Rahu.
//
// A "return" is the moment a transiting planet's sidereal longitude
// exactly equals its natal longitude. Returns open psychological / karmic
// chapters (Saturn return ≈ age 29/58/87; Jupiter ≈ 12yr; Solar = birthday
// refresh; Lunar = monthly emotional reset; Rahu ≈ 18.6yr nodal axis flip).
//
// Rather than raw daily scans, we bracket each return by the planet's mean
// period and binary-search the longitude-equality crossing.

import { PlanetId, RASHIS, nakshatraOf, rashiOf } from '../utils/astro-constants';
import { computeBody } from './ephemeris.service';
import { dateToJD, jdToDate } from '../utils/julian';
import { swisseph } from '../config/ephemeris';
import { KundaliResult } from './kundali.service';

type ReturnPlanet = 'SA' | 'JU' | 'SU' | 'MO' | 'RA';

const SWE_ID: Record<ReturnPlanet, number> = {
  SA: swisseph.SE_SATURN,
  JU: swisseph.SE_JUPITER,
  SU: swisseph.SE_SUN,
  MO: swisseph.SE_MOON,
  RA: swisseph.SE_TRUE_NODE,
};

// Mean synodic/sidereal periods (days) — good enough for bracketing
const MEAN_PERIOD_DAYS: Record<ReturnPlanet, number> = {
  SA: 10759,    // 29.457 years
  JU: 4332,     // 11.862 years
  SU: 365.256,  // tropical/sidereal close enough
  MO: 27.321,   // sidereal month
  RA: 6798,     // 18.613 years (retrograde)
};

export interface PlanetaryReturn {
  planet: ReturnPlanet;
  occurrence: number;         // 1-indexed, ordered by date
  returnUTC: string;
  natalLongitude: number;
  signName: string;
  degInSign: number;
  nakshatraName: string;
  nakshatraPada: number;
  ageYearsAtReturn: number;
}

export interface ReturnsResult {
  natalLongitudes: Record<ReturnPlanet, number>;
  saturn:  PlanetaryReturn[];   // 4 most-recent + upcoming
  jupiter: PlanetaryReturn[];   // 6
  solar:   PlanetaryReturn[];   // next 10 birthdays
  lunar:   PlanetaryReturn[];   // next 12 lunar months
  rahu:    PlanetaryReturn[];   // 4
}

function bodyLongAt(jd: number, sweid: number): number {
  const l = computeBody(jd, sweid).longitude;
  return ((l % 360) + 360) % 360;
}

// Signed angular difference on [-180, 180)
function signedDelta(a: number, b: number): number {
  let d = a - b;
  while (d > 180) d -= 360;
  while (d <= -180) d += 360;
  return d;
}

// Binary-search a longitude-equality crossing in [loJD, hiJD]. Caller
// guarantees the sign of (lon(lo) - target) != sign of (lon(hi) - target).
function refineCrossing(loJD: number, hiJD: number, sweid: number, target: number): number {
  let a = loJD, b = hiJD;
  const fa0 = signedDelta(bodyLongAt(a, sweid), target);
  for (let i = 0; i < 40; i++) {
    const mid = (a + b) / 2;
    const fm = signedDelta(bodyLongAt(mid, sweid), target);
    if ((fa0 <= 0 && fm <= 0) || (fa0 > 0 && fm > 0)) a = mid;
    else b = mid;
    if (b - a < 1 / (24 * 60)) break; // 1 min
  }
  return (a + b) / 2;
}

function findReturnsFromJD(
  startJD: number,
  planet: ReturnPlanet,
  target: number,
  count: number,
  forward = true,
): number[] {
  const sweid = SWE_ID[planet];
  const step = Math.max(0.5, MEAN_PERIOD_DAYS[planet] / 60); // ~60 samples per cycle
  const out: number[] = [];
  let fromJD = startJD;
  let prev = signedDelta(bodyLongAt(fromJD, sweid), target);
  let jd = fromJD;
  const maxSteps = count * 100 + 500;
  for (let i = 0; i < maxSteps && out.length < count; i++) {
    const nextJD = forward ? jd + step : jd - step;
    const cur = signedDelta(bodyLongAt(nextJD, sweid), target);
    // Zero crossing between (jd, nextJD) when prev and cur have opposite signs
    // AND the crossing is a direct (not retrograde-quick-flick) pass: Rahu
    // always retrogrades so we accept all flips. For Saturn/Jupiter within a
    // year, retrograde can cross the point thrice — still record each.
    if ((prev <= 0 && cur > 0) || (prev > 0 && cur <= 0)) {
      // take only forward-motion crossings to avoid double-counting the
      // retrograde loop. Rahu moves backward, so flip the rule.
      const motion = forward ? 1 : -1;
      const accept = planet === 'RA' ? motion * (cur - prev) < 0 : motion * (cur - prev) > 0;
      if (accept || planet === 'MO' || planet === 'SU') {
        const lo = Math.min(jd, nextJD);
        const hi = Math.max(jd, nextJD);
        out.push(refineCrossing(lo, hi, sweid, target));
      }
    }
    prev = cur;
    jd = nextJD;
  }
  return forward ? out : out.reverse();
}

function decorate(
  planet: ReturnPlanet,
  occurrence: number,
  returnJD: number,
  natalLong: number,
  natalJD: number,
): PlanetaryReturn {
  const dt = jdToDate(returnJD);
  const rashi = rashiOf(natalLong);
  const nak = nakshatraOf(natalLong);
  return {
    planet,
    occurrence,
    returnUTC: dt.toISOString(),
    natalLongitude: natalLong,
    signName: RASHIS[rashi.num - 1].name,
    degInSign: rashi.deg,
    nakshatraName: nak.name,
    nakshatraPada: nak.pada,
    ageYearsAtReturn: (returnJD - natalJD) / 365.25,
  };
}

export function computeReturns(natal: KundaliResult, whenISO?: string): ReturnsResult {
  const when = whenISO ? new Date(whenISO) : new Date();
  const nowJD = dateToJD(when);

  const natalLongs: Record<ReturnPlanet, number> = {
    SA: natal.planets.find((p) => p.id === 'SA')!.longitude,
    JU: natal.planets.find((p) => p.id === 'JU')!.longitude,
    SU: natal.planets.find((p) => p.id === 'SU')!.longitude,
    MO: natal.planets.find((p) => p.id === 'MO')!.longitude,
    RA: natal.planets.find((p) => p.id === 'RA')!.longitude,
  };

  const natalJD = natal.jd;

  function collect(planet: ReturnPlanet, pastN: number, futureN: number): PlanetaryReturn[] {
    const target = natalLongs[planet];
    // past returns from natalJD+epsilon forward up to nowJD
    const past = findReturnsFromJD(natalJD + 1, planet, target, pastN + 5, true)
      .filter((jd) => jd < nowJD);
    const pastLast = past.slice(-pastN);
    // future returns from nowJD forward
    const future = findReturnsFromJD(nowJD, planet, target, futureN, true);
    const all = [...pastLast, ...future];
    return all.map((jd, i) => decorate(planet, i + 1, jd, target, natalJD));
  }

  return {
    natalLongitudes: natalLongs,
    saturn: collect('SA', 2, 2),
    jupiter: collect('JU', 3, 3),
    solar: collect('SU', 0, 10),
    lunar: collect('MO', 0, 12),
    rahu: collect('RA', 2, 2),
  };
}
