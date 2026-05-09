// Ashtakavarga-weighted transit strength.
//
// For each transit planet, we look up two bindu counts in the sign the
// planet is currently transiting:
//   1. Own BAV (Bhinnashtakavarga for that planet) — 0..8
//   2. Sarvashtakavarga (SAV) — 0..56, pooling all 7 references
//
// Classical guidance (Jyotish Dipika, Phaladeepika ch. 26):
//   • Own-BAV ≥ 5 → the planet's transit gives positive results this month.
//   • SAV ≥ 28 (≈ average 337/12) → transit is carried by collective strength.
//   • Low Own-BAV + low SAV = transit effects muted or adverse.
//
// We emit both numbers plus a normalized 0..100 strength score so the UI
// can highlight which current transits actually carry weight.

import { PlanetId, normDeg } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { computeAllGrahas } from './ephemeris.service';
import { dateToJD } from '../utils/julian';
import { calculateAshtakavarga } from './ashtakavarga.service';

const TRANSIT_REF: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA'];

export interface AshtakavargaTransitRow {
  planet: PlanetId;
  transitSign: number;
  transitSignName: string;
  ownBindus: number;        // 0..8 from planet's own BAV at this sign
  sarvaBindus: number;      // 0..56 from SAV at this sign
  strengthScore: number;    // 0..100 composite
  verdict: 'very strong' | 'strong' | 'moderate' | 'weak' | 'very weak';
  interpretation: string;
}

export interface AshtakavargaTransitResult {
  whenUTC: string;
  natalSAVTotal: number;
  rows: AshtakavargaTransitRow[];
}

const RASHI_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

function planetSign(long: number): number {
  return Math.floor(normDeg(long) / 30) + 1;
}

function verdictOf(score: number): AshtakavargaTransitRow['verdict'] {
  if (score >= 75) return 'very strong';
  if (score >= 60) return 'strong';
  if (score >= 45) return 'moderate';
  if (score >= 30) return 'weak';
  return 'very weak';
}

function interpret(own: number, sav: number, pid: PlanetId, sign: string): string {
  if (own >= 5 && sav >= 30) return `${pid}'s transit through ${sign} is amply supported — classical "ishta" effects likely`;
  if (own >= 5)              return `${pid} has a strong own-BAV in ${sign}; collective SAV is modest — personal focus gains more than group outcomes`;
  if (sav >= 30)             return `${pid} rides high collective SAV in ${sign}, but its own bindus are low — indirect benefits via others`;
  if (own <= 2 && sav < 25)  return `${pid} transits a weak ${sign} with low own-bindus and low SAV — effects muted or obstructed`;
  return `${pid}'s transit through ${sign} shows moderate Ashtakavarga support`;
}

export function computeAshtakavargaTransit(
  natal: KundaliResult, whenISO?: string,
): AshtakavargaTransitResult {
  const when = whenISO ? new Date(whenISO) : new Date();
  const jd = dateToJD(when);
  const grahas = computeAllGrahas(jd);
  const ashta = calculateAshtakavarga(natal);

  const rows: AshtakavargaTransitRow[] = TRANSIT_REF.map((pid) => {
    const tSign = planetSign(grahas[pid].longitude);
    const idx = tSign - 1;
    const ownBindus = ashta.bav[pid].points[idx];
    const sarvaBindus = ashta.sav.points[idx];
    // Normalize: own contributes up to 55% of score (max 8 → 55), SAV contributes up to 45% (max 56 → 45)
    const ownScore = (ownBindus / 8) * 55;
    const savScore = (sarvaBindus / 56) * 45;
    const strengthScore = +Math.min(100, ownScore + savScore).toFixed(1);
    return {
      planet: pid,
      transitSign: tSign,
      transitSignName: RASHI_NAMES[idx],
      ownBindus,
      sarvaBindus,
      strengthScore,
      verdict: verdictOf(strengthScore),
      interpretation: interpret(ownBindus, sarvaBindus, pid, RASHI_NAMES[idx]),
    };
  });

  return {
    whenUTC: when.toISOString(),
    natalSAVTotal: ashta.sav.total,
    rows,
  };
}
