// Graha Yuddha — planetary war.
//
// Two non-luminary, non-nodal planets within 1° in the same sign wage a
// "war". BPHS and later writers list five determinants of the winner
// (brightness, size, northerliness, direction/speed, disc-size); we use
// the simplest consensus rule: the planet further north in ecliptic
// latitude wins. Exceptions: VE never loses (it's a conqueror); SA never
// wins against JU. The loser is weakened in predictions during the war.
//
// We scan a ±2 year window around the inspected moment, step daily, and
// emit war events with start/peak/end dates + winner/loser.

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { computeAllGrahas, computeBody } from './ephemeris.service';
import { dateToJD, jdToDate } from '../utils/julian';
import { swisseph } from '../config/ephemeris';

const WAR_PLANETS: PlanetId[] = ['MA', 'ME', 'JU', 'VE', 'SA'];
const SWE_ID: Record<PlanetId, number> = {
  SU: swisseph.SE_SUN, MO: swisseph.SE_MOON, MA: swisseph.SE_MARS,
  ME: swisseph.SE_MERCURY, JU: swisseph.SE_JUPITER, VE: swisseph.SE_VENUS,
  SA: swisseph.SE_SATURN, RA: swisseph.SE_TRUE_NODE, KE: -1,
};
const WAR_ORB_DEG = 1.0;

export interface GrahaYuddhaEvent {
  pair: [PlanetId, PlanetId];
  startUTC: string;
  peakUTC: string;
  endUTC: string;
  peakOrb: number;             // degrees at peak (closest approach)
  signName: string;            // sign both planets are in at peak
  winner: PlanetId;
  loser: PlanetId;
  verdict: string;             // one-line explanation
}

export interface GrahaYuddhaResult {
  fromUTC: string;
  toUTC: string;
  events: GrahaYuddhaEvent[];
}

function separation(a: number, b: number): number {
  let d = Math.abs(a - b);
  if (d > 180) d = 360 - d;
  return d;
}

function decideWinner(
  a: PlanetId, b: PlanetId,
  latA: number, latB: number,
): { winner: PlanetId; loser: PlanetId; reason: string } {
  // Hard rules first
  if (a === 'VE' || b === 'VE') {
    const w = 'VE' as PlanetId;
    const l = a === 'VE' ? b : a;
    return { winner: w, loser: l, reason: 'Venus is never defeated (classical exception).' };
  }
  if ((a === 'SA' && b === 'JU') || (b === 'SA' && a === 'JU')) {
    return { winner: 'JU', loser: 'SA', reason: 'Jupiter always defeats Saturn (classical).' };
  }
  // Latitude rule: more northerly wins
  if (latA > latB) return { winner: a, loser: b, reason: `${a} is further north in latitude (${latA.toFixed(2)}° vs ${latB.toFixed(2)}°).` };
  if (latB > latA) return { winner: b, loser: a, reason: `${b} is further north in latitude (${latB.toFixed(2)}° vs ${latA.toFixed(2)}°).` };
  return { winner: a, loser: b, reason: 'Equal latitudes — tiebreaker by planet order.' };
}

function sampleDay(jd: number): Record<PlanetId, { lon: number; lat: number }> {
  const out: any = {};
  for (const p of WAR_PLANETS) {
    const r = computeBody(jd, SWE_ID[p]);
    out[p] = { lon: r.longitude, lat: r.latitude };
  }
  return out;
}

export function computeGrahaYuddha(whenISO?: string, windowYears = 2): GrahaYuddhaResult {
  const now = whenISO ? new Date(whenISO) : new Date();
  const nowJD = dateToJD(now);
  const fromJD = nowJD - windowYears * 365.25;
  const toJD = nowJD + windowYears * 365.25;

  // Walk daily
  const events: GrahaYuddhaEvent[] = [];
  const openWars = new Map<string, { startJD: number; minOrb: number; peakJD: number }>();

  for (let jd = fromJD; jd <= toJD; jd += 1) {
    const snap = sampleDay(jd);
    for (let i = 0; i < WAR_PLANETS.length; i++) {
      for (let j = i + 1; j < WAR_PLANETS.length; j++) {
        const A = WAR_PLANETS[i];
        const B = WAR_PLANETS[j];
        const a = snap[A]; const b = snap[B];
        const sameSign = Math.floor(a.lon / 30) === Math.floor(b.lon / 30);
        const sep = separation(a.lon, b.lon);
        const key = `${A}-${B}`;
        if (sameSign && sep <= WAR_ORB_DEG) {
          const existing = openWars.get(key);
          if (!existing) {
            openWars.set(key, { startJD: jd, minOrb: sep, peakJD: jd });
          } else if (sep < existing.minOrb) {
            existing.minOrb = sep;
            existing.peakJD = jd;
          }
        } else {
          const existing = openWars.get(key);
          if (existing) {
            // war ended — finalize
            const peakSnap = sampleDay(existing.peakJD);
            const peakA = peakSnap[A]; const peakB = peakSnap[B];
            const { winner, loser, reason } = decideWinner(A, B, peakA.lat, peakB.lat);
            const signNum = Math.floor(peakA.lon / 30) + 1;
            events.push({
              pair: [A, B],
              startUTC: jdToDate(existing.startJD).toISOString(),
              peakUTC: jdToDate(existing.peakJD).toISOString(),
              endUTC: jdToDate(jd - 1).toISOString(),
              peakOrb: existing.minOrb,
              signName: RASHIS[signNum - 1].name,
              winner, loser, verdict: reason,
            });
            openWars.delete(key);
          }
        }
      }
    }
  }
  // Flush any wars still open at end of window
  for (const [key, state] of openWars) {
    const [A, B] = key.split('-') as [PlanetId, PlanetId];
    const peakSnap = sampleDay(state.peakJD);
    const peakA = peakSnap[A]; const peakB = peakSnap[B];
    const { winner, loser, reason } = decideWinner(A, B, peakA.lat, peakB.lat);
    const signNum = Math.floor(peakA.lon / 30) + 1;
    events.push({
      pair: [A, B],
      startUTC: jdToDate(state.startJD).toISOString(),
      peakUTC: jdToDate(state.peakJD).toISOString(),
      endUTC: jdToDate(toJD).toISOString(),
      peakOrb: state.minOrb,
      signName: RASHIS[signNum - 1].name,
      winner, loser, verdict: reason,
    });
  }

  events.sort((a, b) => a.peakUTC < b.peakUTC ? -1 : 1);
  return { fromUTC: jdToDate(fromJD).toISOString(), toUTC: jdToDate(toJD).toISOString(), events };
}
