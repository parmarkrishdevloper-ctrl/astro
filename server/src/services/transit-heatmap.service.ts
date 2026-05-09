// Transit heatmap — per-day "auspiciousness pressure" for a given native.
//
// For each day in the requested range we sum:
//   + Jupiter transit in natal kendra/trikona (1, 4, 5, 7, 9, 10, 11) → +3
//   + Saturn transit in friendly natal houses (3, 6, 11)              → +2
//   − Saturn in 1, 8, 12                                              → −3
//   − Mars in 1, 4, 7, 8, 12                                          → −2
//   + Current dasha lord in kendra from natal Moon                    → +2
//   − Current dasha lord in 6/8/12 from natal lagna                   → −2
//   − Sade Sati active                                                → −3
// Scores range roughly −10..+10; we clamp & re-map to 0..100 for UI.
//
// Output is an array of { date, score, label, factors } — suitable for
// plugging directly into a calendar grid.

import { KundaliResult } from './kundali.service';
import { normDeg, PlanetId } from '../utils/astro-constants';
import { computeBody } from './ephemeris.service';
import { dateToJD } from '../utils/julian';
import { currentDasha } from './dasha.service';
import swisseph from 'swisseph';

const { SE_JUPITER, SE_SATURN, SE_MARS } = swisseph;

function signOf(lng: number): number { return Math.floor(normDeg(lng) / 30) + 1; }
function houseOfSignInNatal(k: KundaliResult, signNum: number): number {
  return ((signNum - k.ascendant.rashi.num + 12) % 12) + 1;
}
function houseFromMoon(k: KundaliResult, planetId: PlanetId): number {
  const p = k.planets.find((x) => x.id === planetId);
  const moon = k.planets.find((x) => x.id === 'MO')!;
  if (!p) return 0;
  return ((p.rashi.num - moon.rashi.num + 12) % 12) + 1;
}

export interface HeatmapDay {
  date: string;                 // ISO date (YYYY-MM-DD)
  rawScore: number;             // signed, roughly [-10..+10]
  score: number;                // 0..100 after clamp+remap
  category: 'excellent' | 'good' | 'neutral' | 'caution' | 'difficult';
  factors: string[];             // human-readable contributions
}

function categoryFor(score: number): HeatmapDay['category'] {
  if (score >= 75) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'neutral';
  if (score >= 25) return 'caution';
  return 'difficult';
}

export function buildTransitHeatmap(natal: KundaliResult, startISO: string, days: number): HeatmapDay[] {
  const startJD = dateToJD(new Date(startISO));
  const dayCount = Math.min(732, Math.max(1, days));   // max 2 years daily

  const KENDRA_TRIKONA = new Set([1, 4, 5, 7, 9, 10, 11]);
  const BAD_SA = new Set([1, 8, 12]);
  const BAD_MA = new Set([1, 4, 7, 8, 12]);
  const FRIENDLY_SA = new Set([3, 6, 11]);

  const natalMoonSign = natal.planets.find((p) => p.id === 'MO')!.rashi.num;

  const out: HeatmapDay[] = [];
  for (let i = 0; i < dayCount; i++) {
    const jd = startJD + i;
    const d = new Date(new Date(startISO).getTime() + i * 86400000);

    const jup = computeBody(jd, SE_JUPITER);
    const sat = computeBody(jd, SE_SATURN);
    const mar = computeBody(jd, SE_MARS);

    const jupHouse = houseOfSignInNatal(natal, signOf(jup.longitude));
    const satHouse = houseOfSignInNatal(natal, signOf(sat.longitude));
    const marHouse = houseOfSignInNatal(natal, signOf(mar.longitude));

    let raw = 0;
    const factors: string[] = [];

    if (KENDRA_TRIKONA.has(jupHouse)) { raw += 3; factors.push(`Jupiter in benefic ${jupHouse}th (+3)`); }
    if (FRIENDLY_SA.has(satHouse))    { raw += 2; factors.push(`Saturn in friendly ${satHouse}th (+2)`); }
    if (BAD_SA.has(satHouse))         { raw -= 3; factors.push(`Saturn in ${satHouse}th (−3)`); }
    if (BAD_MA.has(marHouse))         { raw -= 2; factors.push(`Mars in ${marHouse}th (−2)`); }

    // Sade Sati: Saturn in 12/1/2 from natal Moon sign
    const saSignFromMoon = ((signOf(sat.longitude) - natalMoonSign + 12) % 12) + 1;
    if (saSignFromMoon === 12 || saSignFromMoon === 1 || saSignFromMoon === 2) {
      raw -= 3; factors.push(`Sade Sati (Saturn in ${saSignFromMoon === 12 ? '12th' : saSignFromMoon === 1 ? '1st' : '2nd'} from Moon) (−3)`);
    }

    // Running dasha lord
    const dd = currentDasha(natal, d);
    if (dd?.maha) {
      const lord = dd.maha.lord as PlanetId;
      const lordHouseFromMoon = houseFromMoon(natal, lord);
      if ([1, 4, 7, 10].includes(lordHouseFromMoon)) { raw += 2; factors.push(`Maha lord ${lord} in kendra from Moon (+2)`); }
      const natalLordHouse = natal.planets.find((p) => p.id === lord)!.house;
      if ([6, 8, 12].includes(natalLordHouse)) { raw -= 2; factors.push(`Maha lord ${lord} in natal ${natalLordHouse}th (−2)`); }
    }

    const clamped = Math.max(-10, Math.min(10, raw));
    const score = Math.round(((clamped + 10) / 20) * 100);
    out.push({
      date: d.toISOString().slice(0, 10),
      rawScore: raw,
      score,
      category: categoryFor(score),
      factors,
    });
  }
  return out;
}
