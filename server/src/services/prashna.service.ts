// Prashna (horary) astrology.
//
// Two flavors:
//   1. Time-based — cast a chart for the moment a question is asked.
//   2. KP number-based — user picks 1..249, which maps to a degree of the
//      ecliptic (each step = 360/249 ≈ 1.4458°). Use that as the Ascendant.

import { calculateKundali, KundaliResult } from './kundali.service';
import { lordsAt, calculateKP, computeRulingPlanets } from './kp.service';
import { PlanetId } from '../utils/astro-constants';

export interface PrashnaInput {
  /** Required for time-based prashna */
  whenISO?: string;
  lat: number;
  lng: number;
  /** Optional question text — stored verbatim, used for context only */
  question?: string;
  /** For KP horary: 1..249. If supplied, generates a number-based chart. */
  number?: number;
}

export interface PrashnaResult {
  mode: 'time' | 'number';
  question?: string;
  whenUTC: string;
  chart: KundaliResult;
  ascendantLords?: { sign: string; star: string; sub: string };
}

export function castPrashna(input: PrashnaInput): PrashnaResult {
  if (input.number != null) {
    if (input.number < 1 || input.number > 249) {
      throw new Error('KP horary number must be between 1 and 249');
    }
    // Map number→ascendant longitude. Each unit = 360/249 degrees.
    const stepDeg = 360 / 249;
    const ascLong = (input.number - 0.5) * stepDeg;
    // To produce a chart with this ascendant we cheat: use the current
    // moment (ephemeris snapshot) but override the ascendant downstream.
    // For now we cast a normal chart for "now" and replace the ascendant.
    const now = new Date().toISOString();
    const k = calculateKundali({ datetime: now, lat: input.lat, lng: input.lng });
    const lords = lordsAt(ascLong);
    return {
      mode: 'number',
      question: input.question,
      whenUTC: now,
      chart: { ...k, ascendant: { ...k.ascendant, longitude: ascLong } },
      ascendantLords: { sign: lords.sign, star: lords.star, sub: lords.sub },
    };
  }
  const when = input.whenISO || new Date().toISOString();
  const k = calculateKundali({ datetime: when, lat: input.lat, lng: input.lng });
  return {
    mode: 'time',
    question: input.question,
    whenUTC: when,
    chart: k,
  };
}

// ─── KP Cuspal Interlink Verdict ────────────────────────────────────────────
//
// KP horary predicts yes/no using three key sub-lords:
//   • Ascendant (or horary-number) sub-lord — querent's state of mind
//   • Moon sub-lord — confirmation
//   • Primary-house sub-lord — house governing the matter asked
//
// Each sub-lord "signifies" a set of houses via the four-step KP rule
// (already computed in calculateKP). The verdict logic:
//
//   YES if all three sub-lords' significator sets include at least one
//       POSITIVE house and no DESTROYER house for the question.
//   NO  if any sub-lord signifies a destroyer house while missing a
//       positive house.
//   MIXED otherwise (partial signification).

export type PrashnaCategory =
  | 'marriage' | 'career' | 'health' | 'progeny' | 'property'
  | 'travel'   | 'litigation' | 'finance' | 'education';

interface CategoryHouses { positive: number[]; destroyer: number[]; primary: number; label: string }

const CATEGORY_HOUSES: Record<PrashnaCategory, CategoryHouses> = {
  marriage:   { primary: 7,  positive: [2, 7, 11],  destroyer: [1, 6, 10],  label: 'Marriage' },
  career:     { primary: 10, positive: [2, 6, 10, 11], destroyer: [5, 8, 12], label: 'Career / Job' },
  health:     { primary: 1,  positive: [1, 5, 11],  destroyer: [6, 8, 12],  label: 'Health' },
  progeny:    { primary: 5,  positive: [2, 5, 11],  destroyer: [1, 4, 10],  label: 'Children' },
  property:   { primary: 4,  positive: [4, 11, 12], destroyer: [3, 5, 10],  label: 'Property' },
  travel:     { primary: 3,  positive: [3, 9, 12],  destroyer: [4, 8, 11],  label: 'Travel' },
  litigation: { primary: 6,  positive: [6, 11],     destroyer: [5, 8, 12],  label: 'Litigation' },
  finance:    { primary: 2,  positive: [2, 6, 11],  destroyer: [5, 8, 12],  label: 'Finance' },
  education:  { primary: 4,  positive: [4, 9, 11],  destroyer: [3, 8, 12],  label: 'Education' },
};

export type PrashnaVerdict = 'yes' | 'no' | 'mixed';

export interface PrashnaVerdictResult {
  category: PrashnaCategory;
  categoryLabel: string;
  primaryHouse: number;
  analysis: {
    source: 'Ascendant' | 'Moon' | 'Primary house';
    sublord: PlanetId;
    signifiesHouses: number[];
    positiveHit: boolean;
    destroyerHit: boolean;
  }[];
  rulingPlanets: PlanetId[];
  verdict: PrashnaVerdict;
  confidence: number;       // 0..1 — fraction of sub-lords that cleanly say YES
  reasoning: string;
}

export function computePrashnaVerdict(
  prashna: PrashnaResult,
  category: PrashnaCategory,
): PrashnaVerdictResult {
  const houses = CATEGORY_HOUSES[category];
  const kp = calculateKP(prashna.chart);

  // Sub-lord of Ascendant (use the override if number-based)
  const ascSub = prashna.ascendantLords?.sub ?? kp.cusps[0].subLord;
  const moonEntry = kp.planets.find((p) => p.id === 'MO')!;
  const moonSub = moonEntry.subLord;
  const primarySub = kp.cusps[houses.primary - 1].subLord;

  const sigsByPlanet: Record<string, number[]> =
    Object.fromEntries(kp.significators.map((s) => [s.planet, s.houses]));

  const analyzeSub = (source: 'Ascendant' | 'Moon' | 'Primary house', sub: PlanetId) => {
    const sigs = sigsByPlanet[sub] ?? [];
    const positiveHit = sigs.some((h) => houses.positive.includes(h));
    const destroyerHit = sigs.some((h) => houses.destroyer.includes(h));
    return { source, sublord: sub as PlanetId, signifiesHouses: sigs, positiveHit, destroyerHit };
  };

  const analysis = [
    analyzeSub('Ascendant',     ascSub as PlanetId),
    analyzeSub('Moon',          moonSub),
    analyzeSub('Primary house', primarySub),
  ];

  const yesCount = analysis.filter((a) => a.positiveHit && !a.destroyerHit).length;
  const noCount  = analysis.filter((a) => a.destroyerHit && !a.positiveHit).length;

  let verdict: PrashnaVerdict;
  if (yesCount >= 2 && noCount === 0) verdict = 'yes';
  else if (noCount >= 2) verdict = 'no';
  else verdict = 'mixed';

  const confidence = yesCount / 3;

  const rulingPlanets = computeRulingPlanets(prashna.whenUTC, prashna.chart.input.lat, prashna.chart.input.lng).ruling;

  const reasoning = [
    `Category: ${houses.label} · primary house ${houses.primary}.`,
    `Positive houses: ${houses.positive.join(', ')} · destroyer: ${houses.destroyer.join(', ')}.`,
    `Sub-lords — Asc: ${ascSub}, Moon: ${moonSub}, Primary: ${primarySub}.`,
    `YES signals: ${yesCount}/3. NO signals: ${noCount}/3.`,
  ].join(' ');

  return {
    category,
    categoryLabel: houses.label,
    primaryHouse: houses.primary,
    analysis,
    rulingPlanets,
    verdict,
    confidence,
    reasoning,
  };
}
