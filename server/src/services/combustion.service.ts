// Combustion windows — when a planet is swallowed by the Sun's rays.
//
// Classical orbs (BPHS / Saravali): ME 14°, VE 10°, MA 17°, JU 11°, SA 15°.
// Combustion fully burns a benefic; the planet loses its ability to
// deliver results. We scan a ±2 year window, step daily, and emit
// { planet, startUTC, exactUTC (closest), endUTC, peakSeparation } for
// every combustion cycle.

import { COMBUSTION_DEG, PlanetId, RASHIS } from '../utils/astro-constants';
import { computeBody } from './ephemeris.service';
import { dateToJD, jdToDate } from '../utils/julian';
import { swisseph } from '../config/ephemeris';

const SWE_ID: Record<PlanetId, number> = {
  SU: swisseph.SE_SUN, MO: swisseph.SE_MOON, MA: swisseph.SE_MARS,
  ME: swisseph.SE_MERCURY, JU: swisseph.SE_JUPITER, VE: swisseph.SE_VENUS,
  SA: swisseph.SE_SATURN, RA: swisseph.SE_TRUE_NODE, KE: -1,
};

const COMBUST_PLANETS: PlanetId[] = ['ME', 'VE', 'MA', 'JU', 'SA'];

export interface CombustionWindow {
  planet: PlanetId;
  orb: number;
  startUTC: string;
  exactUTC: string;           // closest approach
  endUTC: string;
  peakSeparation: number;     // smallest |planet − sun| during the window
  signName: string;           // sign at peak
  durationDays: number;
  retrogradeAtStart: boolean;
}

export interface CombustionResult {
  fromUTC: string;
  toUTC: string;
  windows: CombustionWindow[];
}

function sunLon(jd: number): number { return computeBody(jd, swisseph.SE_SUN).longitude; }

function sepAt(jd: number, planet: PlanetId): { sep: number; lon: number; retro: boolean } {
  const p = computeBody(jd, SWE_ID[planet]);
  const s = sunLon(jd);
  let d = Math.abs(p.longitude - s);
  if (d > 180) d = 360 - d;
  return { sep: d, lon: p.longitude, retro: p.retrograde };
}

export function computeCombustion(whenISO?: string, windowYears = 2): CombustionResult {
  const now = whenISO ? new Date(whenISO) : new Date();
  const nowJD = dateToJD(now);
  const fromJD = nowJD - windowYears * 365.25;
  const toJD = nowJD + windowYears * 365.25;

  const windows: CombustionWindow[] = [];

  for (const planet of COMBUST_PLANETS) {
    const orb = COMBUSTION_DEG[planet]!;
    let open: { startJD: number; minSep: number; exactJD: number; startRetro: boolean } | null = null;

    for (let jd = fromJD; jd <= toJD; jd += 1) {
      const { sep, retro } = sepAt(jd, planet);
      if (sep <= orb) {
        if (!open) open = { startJD: jd, minSep: sep, exactJD: jd, startRetro: retro };
        else if (sep < open.minSep) { open.minSep = sep; open.exactJD = jd; }
      } else if (open) {
        const peak = sepAt(open.exactJD, planet);
        const signNum = Math.floor(peak.lon / 30) + 1;
        windows.push({
          planet, orb,
          startUTC: jdToDate(open.startJD).toISOString(),
          exactUTC: jdToDate(open.exactJD).toISOString(),
          endUTC: jdToDate(jd - 1).toISOString(),
          peakSeparation: open.minSep,
          signName: RASHIS[signNum - 1].name,
          durationDays: jd - open.startJD,
          retrogradeAtStart: open.startRetro,
        });
        open = null;
      }
    }
    if (open) {
      const peak = sepAt(open.exactJD, planet);
      const signNum = Math.floor(peak.lon / 30) + 1;
      windows.push({
        planet, orb,
        startUTC: jdToDate(open.startJD).toISOString(),
        exactUTC: jdToDate(open.exactJD).toISOString(),
        endUTC: jdToDate(toJD).toISOString(),
        peakSeparation: open.minSep,
        signName: RASHIS[signNum - 1].name,
        durationDays: toJD - open.startJD,
        retrogradeAtStart: open.startRetro,
      });
    }
  }
  windows.sort((a, b) => a.startUTC < b.startUTC ? -1 : 1);
  return {
    fromUTC: jdToDate(fromJD).toISOString(),
    toUTC: jdToDate(toJD).toISOString(),
    windows,
  };
}
