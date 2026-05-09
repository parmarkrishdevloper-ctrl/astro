// Secondary progressions.
//
// Rule: "one day after birth = one year of life". To read the chart at
// age N, advance the clock N × 24 hours from the exact birth moment and
// recompute. The ascendant advances too, because the Earth's rotation is
// now sampled at a time when the local sky looks different.
//
// We expose both the progressed planetary positions and the aspects those
// progressed points form to the natal chart (conjunction / sextile / square
// / trine / opposition with a 1° orb — tight, progression-appropriate).

import { PlanetId, RASHIS, nakshatraOf, normDeg, rashiOf } from '../utils/astro-constants';
import { computeAllGrahas, computeAscendant } from './ephemeris.service';
import { dateToJD, jdToDate } from '../utils/julian';
import { KundaliResult } from './kundali.service';

export interface ProgressedPlanet {
  id: PlanetId;
  longitude: number;
  signNum: number;
  signName: string;
  degInSign: number;
  nakshatraName: string;
  nakshatraPada: number;
  retrograde: boolean;
  natalHouseNow: number;    // whole-sign house occupied relative to natal Lagna
  delta: number;            // progressed − natal longitude (signed, mod 360)
}

export interface ProgressedAspect {
  a: PlanetId;
  b: PlanetId;
  kind: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
  exactDeg: number;         // 0 / 60 / 90 / 120 / 180
  orb: number;              // degrees off exact
}

export interface ProgressionsResult {
  ageYears: number;
  progressedDateUTC: string;   // = natalUTC + ageYears days
  progressedAscendant: number;
  progressedAscendantSign: string;
  planets: ProgressedPlanet[];
  aspectsToNatal: ProgressedAspect[];
}

const ASPECT_TABLE: { kind: ProgressedAspect['kind']; deg: number; orb: number }[] = [
  { kind: 'conjunction', deg: 0,   orb: 1.0 },
  { kind: 'sextile',     deg: 60,  orb: 1.0 },
  { kind: 'square',      deg: 90,  orb: 1.0 },
  { kind: 'trine',       deg: 120, orb: 1.0 },
  { kind: 'opposition',  deg: 180, orb: 1.0 },
];

function houseOfWS(ascLong: number, longitude: number): number {
  const lagnaIdx = Math.floor(normDeg(ascLong) / 30);
  const pIdx = Math.floor(normDeg(longitude) / 30);
  return ((pIdx - lagnaIdx + 12) % 12) + 1;
}

export function computeProgressions(natal: KundaliResult, ageYears?: number): ProgressionsResult {
  const natalJD = natal.jd;
  const age = ageYears ?? ((Date.now() / 86400000 + 2440587.5) - natalJD) / 365.2425;
  const progressedJD = natalJD + age; // 1 day = 1 year
  const progressedDate = jdToDate(progressedJD);

  // Compute planets and ascendant at progressedJD using the birth location
  const grahas = computeAllGrahas(progressedJD);
  const asc = computeAscendant(progressedJD, natal.input.lat, natal.input.lng,
    natal.houseSystem, natal.ayanamsa.mode === 'tropical');

  const planets: ProgressedPlanet[] = (Object.keys(grahas) as PlanetId[]).map((id) => {
    const g = grahas[id];
    const natalP = natal.planets.find((p) => p.id === id)!;
    const r = rashiOf(g.longitude);
    const n = nakshatraOf(g.longitude);
    let delta = g.longitude - natalP.longitude;
    while (delta > 180) delta -= 360;
    while (delta <= -180) delta += 360;
    return {
      id,
      longitude: g.longitude,
      signNum: r.num,
      signName: RASHIS[r.num - 1].name,
      degInSign: r.deg,
      nakshatraName: n.name,
      nakshatraPada: n.pada,
      retrograde: g.retrograde,
      natalHouseNow: houseOfWS(natal.ascendant.longitude, g.longitude),
      delta,
    };
  });

  // Aspects: progressed planets to natal planets
  const aspects: ProgressedAspect[] = [];
  for (const prog of planets) {
    for (const nat of natal.planets) {
      let diff = Math.abs(prog.longitude - nat.longitude);
      if (diff > 180) diff = 360 - diff;
      for (const asp of ASPECT_TABLE) {
        const off = Math.abs(diff - asp.deg);
        if (off <= asp.orb) {
          aspects.push({
            a: prog.id,
            b: nat.id,
            kind: asp.kind,
            exactDeg: asp.deg,
            orb: off,
          });
          break;
        }
      }
    }
  }
  // Sort: tightest orb first
  aspects.sort((x, y) => x.orb - y.orb);

  const ar = rashiOf(asc.ascendant);

  return {
    ageYears: age,
    progressedDateUTC: progressedDate.toISOString(),
    progressedAscendant: asc.ascendant,
    progressedAscendantSign: RASHIS[ar.num - 1].name,
    planets,
    aspectsToNatal: aspects,
  };
}
