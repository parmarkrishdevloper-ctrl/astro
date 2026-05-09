// Retrograde shadow visualiser.
//
// A full retrograde cycle has four key stations for Mars/Mercury/Jupiter/
// Venus/Saturn:
//   1. Pre-shadow enters — direct motion crosses the longitude at which
//      the planet will later turn direct (i.e. the future station-direct °).
//   2. Station retrograde — direct → retrograde, at maximum longitude.
//   3. Station direct — retrograde → direct, at minimum longitude of loop.
//   4. Post-shadow ends — direct motion returns to the station-retrograde
//      longitude. The planet has now fully left the shadow zone.
//
// The shadow zone is the arc between the two stations. Transits repeat
// over a degree three times (direct → retrograde → direct) during the
// cycle, so a sensitive point in the shadow gets triple activation.

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { computeBody } from './ephemeris.service';
import { dateToJD, jdToDate } from '../utils/julian';
import { swisseph } from '../config/ephemeris';

const SWE_ID: Record<PlanetId, number> = {
  SU: swisseph.SE_SUN, MO: swisseph.SE_MOON, MA: swisseph.SE_MARS,
  ME: swisseph.SE_MERCURY, JU: swisseph.SE_JUPITER, VE: swisseph.SE_VENUS,
  SA: swisseph.SE_SATURN, RA: swisseph.SE_TRUE_NODE, KE: -1,
};

const RETRO_PLANETS: PlanetId[] = ['MA', 'ME', 'JU', 'VE', 'SA'];

export interface RetroCycle {
  planet: PlanetId;
  preShadowStartUTC: string;   // direct motion crossed stationDirectDeg
  stationRetrogradeUTC: string;
  stationDirectUTC: string;
  postShadowEndUTC: string;    // direct motion re-crossed stationRetrogradeDeg
  stationRetrogradeDeg: number;
  stationDirectDeg: number;
  shadowArcDeg: number;        // |stationR − stationD|
  retrogradeArcDeg: number;    // same magnitude, shown as positive
  signAtStationR: string;
  signAtStationD: string;
}

export interface RetroShadowResult {
  fromUTC: string;
  toUTC: string;
  cycles: RetroCycle[];
}

function lonAt(jd: number, planet: PlanetId): { lon: number; retro: boolean } {
  const r = computeBody(jd, SWE_ID[planet]);
  return { lon: r.longitude, retro: r.retrograde };
}

// Solve JD where planet longitude first crosses targetDeg within [lo,hi]
// moving forward (not during retrograde).
function findForwardCrossing(loJD: number, hiJD: number, planet: PlanetId, targetDeg: number): number | null {
  const step = 0.5;
  let prev = lonAt(loJD, planet).lon;
  for (let jd = loJD + step; jd <= hiJD; jd += step) {
    const { lon, retro } = lonAt(jd, planet);
    if (retro) { prev = lon; continue; }
    // forward crossing of targetDeg: prev < target <= lon (mod 360 unwrap)
    const a = prev; const b = lon;
    const inc = (b - a + 360) % 360; // forward delta
    const rel = (targetDeg - a + 360) % 360;
    if (rel > 0 && rel <= inc) {
      // refine
      let lo = jd - step, hi = jd;
      for (let i = 0; i < 30; i++) {
        const m = (lo + hi) / 2;
        const { lon: lm } = lonAt(m, planet);
        const dm = (targetDeg - a + 360) % 360;
        const cm = (lm - a + 360) % 360;
        if (cm < dm) lo = m; else hi = m;
        if (hi - lo < 1 / 24) break;
      }
      return (lo + hi) / 2;
    }
    prev = lon;
  }
  return null;
}

// Refine direction-change JD between lo and hi where retrograde state flips.
function refineStation(loJD: number, hiJD: number, planet: PlanetId): number {
  let a = loJD, b = hiJD;
  const ra = lonAt(a, planet).retro;
  for (let i = 0; i < 40; i++) {
    const m = (a + b) / 2;
    if (lonAt(m, planet).retro === ra) a = m; else b = m;
    if (b - a < 1 / (24 * 60)) break;
  }
  return (a + b) / 2;
}

export function computeRetroShadow(whenISO?: string, windowYears = 2): RetroShadowResult {
  const now = whenISO ? new Date(whenISO) : new Date();
  const nowJD = dateToJD(now);
  const fromJD = nowJD - windowYears * 365.25;
  const toJD = nowJD + windowYears * 365.25;

  const cycles: RetroCycle[] = [];

  for (const planet of RETRO_PLANETS) {
    // Walk daily, detect retrograde bands
    const step = 1;
    let prevRetro = lonAt(fromJD, planet).retro;
    let stationRJD: number | null = null;
    let stationRdeg = 0;

    for (let jd = fromJD + step; jd <= toJD; jd += step) {
      const { lon, retro } = lonAt(jd, planet);

      if (!prevRetro && retro) {
        // D → R station retrograde, just entered
        stationRJD = refineStation(jd - step, jd, planet);
        stationRdeg = lonAt(stationRJD, planet).lon;
      } else if (prevRetro && !retro) {
        // R → D station direct
        const stationDJD = refineStation(jd - step, jd, planet);
        const stationDdeg = lonAt(stationDJD, planet).lon;
        if (stationRJD != null) {
          // Pre-shadow entry: when direct, planet first crossed stationDdeg going forward
          // Search back from stationRJD for up to 1 year
          const pre = findForwardCrossing(stationRJD - 365, stationRJD, planet, stationDdeg);
          // Post-shadow exit: after stationDJD, planet crosses stationRdeg going forward
          const post = findForwardCrossing(stationDJD, stationDJD + 365, planet, stationRdeg);
          if (pre != null && post != null) {
            let arc = Math.abs(stationRdeg - stationDdeg);
            if (arc > 180) arc = 360 - arc;
            const signR = Math.floor(stationRdeg / 30) + 1;
            const signD = Math.floor(stationDdeg / 30) + 1;
            cycles.push({
              planet,
              preShadowStartUTC: jdToDate(pre).toISOString(),
              stationRetrogradeUTC: jdToDate(stationRJD).toISOString(),
              stationDirectUTC: jdToDate(stationDJD).toISOString(),
              postShadowEndUTC: jdToDate(post).toISOString(),
              stationRetrogradeDeg: stationRdeg,
              stationDirectDeg: stationDdeg,
              shadowArcDeg: arc,
              retrogradeArcDeg: arc,
              signAtStationR: RASHIS[signR - 1].name,
              signAtStationD: RASHIS[signD - 1].name,
            });
          }
        }
        stationRJD = null;
      }
      prevRetro = retro;
    }
  }

  cycles.sort((a, b) => a.preShadowStartUTC < b.preShadowStartUTC ? -1 : 1);
  return {
    fromUTC: jdToDate(fromJD).toISOString(),
    toUTC: jdToDate(toJD).toISOString(),
    cycles,
  };
}
