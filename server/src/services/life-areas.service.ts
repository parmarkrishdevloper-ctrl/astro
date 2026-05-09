// Life-area focused readings. Each module picks a set of houses / karakas /
// lords relevant to a life theme and produces a focused interpretation with
// a 0-100 score, positive/negative factors, and a plain-English summary.
//
//   • Medical  — 1, 6, 8, 12  (health, disease, chronic, hospitalisation)
//   • Career   — 10, 6, 2, 11 (work, competition, income, gains)
//   • Progeny  — 5, 2, 11     (children, family expansion)
//   • Wealth   — 2, 11, 9     (income, gains, fortune; Dhana yogas)
//
// These are classical Parashara combinations distilled into a small set of
// checks per module. They are not a substitute for a full reading but
// surface the salient factors quickly.

import { KundaliResult, PlanetPosition } from './kundali.service';
import { PlanetId, RASHIS } from '../utils/astro-constants';

export interface LifeFactor {
  kind: 'positive' | 'negative';
  weight: number;           // contribution to score, positive or negative
  text: string;
}

export interface LifeAreaReport {
  area: 'medical' | 'career' | 'progeny' | 'wealth';
  label: string;
  housesConsidered: number[];
  karakas: string[];        // planet IDs / roles examined
  score: number;            // 0..100 (100 = most favourable)
  factors: LifeFactor[];
  summary: string;
}

const BENEFICS: PlanetId[] = ['JU', 'VE', 'ME', 'MO'];
const MALEFICS: PlanetId[] = ['SA', 'MA', 'RA', 'KE', 'SU'];

// Helpers ─────────────────────────────────────────────────────────────────
function planetById(k: KundaliResult, id: PlanetId): PlanetPosition | undefined {
  return k.planets.find((p) => p.id === id);
}
function lordOfHouse(k: KundaliResult, house: number): PlanetId {
  return k.houses[house - 1].lord;
}
function planetsInHouse(k: KundaliResult, house: number): PlanetPosition[] {
  return k.planets.filter((p) => p.house === house);
}
function isBenefic(id: PlanetId): boolean { return BENEFICS.includes(id); }
function isMalefic(id: PlanetId): boolean { return MALEFICS.includes(id); }

function dignityScore(p: PlanetPosition): number {
  if (p.exalted) return +15;
  if (p.debilitated) return -15;
  if (p.ownSign) return +10;
  if (p.combust) return -8;
  if (p.retrograde && !isMalefic(p.id)) return +3;
  return 0;
}

// ─── Medical ───────────────────────────────────────────────────────────────
export function analyzeMedical(k: KundaliResult): LifeAreaReport {
  const factors: LifeFactor[] = [];
  let score = 60; // neutral baseline

  // 1st lord strength
  const l1 = lordOfHouse(k, 1);
  const p1 = planetById(k, l1)!;
  const d1 = dignityScore(p1);
  score += d1;
  factors.push({ kind: d1 >= 0 ? 'positive' : 'negative', weight: d1,
    text: `1st lord ${l1} — ${p1.exalted ? 'exalted' : p1.debilitated ? 'debilitated' : p1.ownSign ? 'own sign' : p1.combust ? 'combust' : 'neutral'} in house ${p1.house}` });

  // Malefics in 1/6/8 are bad
  for (const h of [1, 6, 8]) {
    const occ = planetsInHouse(k, h);
    for (const p of occ) {
      if (isMalefic(p.id)) {
        score -= 5;
        factors.push({ kind: 'negative', weight: -5, text: `${p.id} in ${h}th (malefic in health-sensitive house)` });
      }
    }
  }

  // Jupiter / Venus in 1 is a big plus
  for (const h of [1]) {
    const occ = planetsInHouse(k, h);
    for (const p of occ) {
      if (p.id === 'JU' || p.id === 'VE') {
        score += 8;
        factors.push({ kind: 'positive', weight: +8, text: `${p.id} in the Ascendant (protective)` });
      }
    }
  }

  // Lord of 6 / 8 / 12 afflicting the Lagna
  for (const malHouse of [6, 8, 12]) {
    const ml = lordOfHouse(k, malHouse);
    const mp = planetById(k, ml)!;
    if (mp.house === 1) {
      score -= 6;
      factors.push({ kind: 'negative', weight: -6, text: `${malHouse}th lord ${ml} sits in the 1st (affliction to body)` });
    }
  }

  score = Math.max(0, Math.min(100, score));
  const summary = score >= 75 ? 'Robust vitality; strong protective factors.'
    : score >= 55 ? 'Generally healthy; watch 6/8/12 dasha periods.'
    : score >= 35 ? 'Mixed — chronic tendencies indicated; lifestyle discipline advised.'
    : 'Serious health indicators; seek medical + ritual remedies.';

  return {
    area: 'medical',
    label: 'Medical / Health',
    housesConsidered: [1, 6, 8, 12],
    karakas: ['1st lord', 'Sun (vitality)', 'Moon (mind)', '6/8/12 lords'],
    score, factors, summary,
  };
}

// ─── Career ────────────────────────────────────────────────────────────────
export function analyzeCareer(k: KundaliResult): LifeAreaReport {
  const factors: LifeFactor[] = [];
  let score = 55;

  const tenthLord = lordOfHouse(k, 10);
  const tl = planetById(k, tenthLord)!;
  const dTL = dignityScore(tl);
  score += dTL;
  factors.push({ kind: dTL >= 0 ? 'positive' : 'negative', weight: dTL,
    text: `10th lord ${tenthLord} in house ${tl.house} (${tl.exalted ? 'exalted' : tl.debilitated ? 'debilitated' : tl.ownSign ? 'own sign' : 'neutral'})` });

  // Occupants of 10th
  const tenthOcc = planetsInHouse(k, 10);
  for (const p of tenthOcc) {
    const d = dignityScore(p);
    score += 4 + Math.max(0, d);
    factors.push({ kind: 'positive', weight: 4 + Math.max(0, d),
      text: `${p.id} in the 10th` });
  }

  // Saturn strong = great worker; Saturn debilitated = career instability
  const sa = planetById(k, 'SA')!;
  if (sa.exalted || sa.ownSign) {
    score += 6;
    factors.push({ kind: 'positive', weight: +6, text: 'Saturn dignified (steady career)' });
  } else if (sa.debilitated) {
    score -= 6;
    factors.push({ kind: 'negative', weight: -6, text: 'Saturn debilitated (career struggle)' });
  }

  // Sun as karaka for government roles; if in 10th or aspecting it → boost
  const sun = planetById(k, 'SU')!;
  if (sun.house === 10) {
    score += 6;
    factors.push({ kind: 'positive', weight: +6, text: 'Sun in the 10th (authority)' });
  }

  // 11th house — gains; Jupiter/Venus there is great
  const eleventh = planetsInHouse(k, 11);
  for (const p of eleventh) {
    if (isBenefic(p.id)) {
      score += 3;
      factors.push({ kind: 'positive', weight: +3, text: `${p.id} in 11th (gain)` });
    }
  }

  score = Math.max(0, Math.min(100, score));
  const summary = score >= 75 ? 'Strong career & recognition potential.'
    : score >= 55 ? 'Solid professional prospects with effort.'
    : score >= 35 ? 'Career requires discipline; watch 10-lord dasha.'
    : 'Career indicators weak — consider specialised remedies + niche field.';

  return {
    area: 'career',
    label: 'Career / Profession',
    housesConsidered: [2, 6, 10, 11],
    karakas: ['10th lord', 'Saturn (work)', 'Sun (authority)', 'Amatyakaraka'],
    score, factors, summary,
  };
}

// ─── Progeny ───────────────────────────────────────────────────────────────
export function analyzeProgeny(k: KundaliResult): LifeAreaReport {
  const factors: LifeFactor[] = [];
  let score = 55;

  const fifthLord = lordOfHouse(k, 5);
  const fl = planetById(k, fifthLord)!;
  const d5 = dignityScore(fl);
  score += d5;
  factors.push({ kind: d5 >= 0 ? 'positive' : 'negative', weight: d5,
    text: `5th lord ${fifthLord} — ${fl.exalted ? 'exalted' : fl.debilitated ? 'debilitated' : fl.ownSign ? 'own sign' : 'neutral'} in house ${fl.house}` });

  // Jupiter = natural karaka for children. Its house and dignity matter.
  const ju = planetById(k, 'JU')!;
  const djJu = dignityScore(ju);
  score += djJu;
  factors.push({ kind: djJu >= 0 ? 'positive' : 'negative', weight: djJu,
    text: `Jupiter in house ${ju.house}` });
  if ([5, 1, 9].includes(ju.house)) {
    score += 5;
    factors.push({ kind: 'positive', weight: +5, text: 'Jupiter in dharma/trine houses (blessing for progeny)' });
  }

  // Rahu / Saturn in 5th → delay / issues
  const fifthOcc = planetsInHouse(k, 5);
  for (const p of fifthOcc) {
    if (p.id === 'RA' || p.id === 'KE' || p.id === 'SA') {
      score -= 5;
      factors.push({ kind: 'negative', weight: -5, text: `${p.id} in 5th (delays for children)` });
    }
    if (isBenefic(p.id)) {
      score += 4;
      factors.push({ kind: 'positive', weight: +4, text: `${p.id} in 5th (supportive)` });
    }
  }

  score = Math.max(0, Math.min(100, score));
  const summary = score >= 75 ? 'Strong indicators for children; natural timing.'
    : score >= 55 ? 'Children likely; Jupiter dasha favours birth.'
    : score >= 35 ? 'Delays possible; consider Santana Gopala mantra.'
    : 'Significant afflictions — medical + remedial measures advised.';

  return {
    area: 'progeny',
    label: 'Progeny / Children',
    housesConsidered: [2, 5, 11],
    karakas: ['5th lord', 'Jupiter (putra-karaka)', 'Putrakaraka (Jaimini)'],
    score, factors, summary,
  };
}

// ─── Wealth ────────────────────────────────────────────────────────────────
export function analyzeWealth(k: KundaliResult): LifeAreaReport {
  const factors: LifeFactor[] = [];
  let score = 55;

  const l2 = lordOfHouse(k, 2);
  const l11 = lordOfHouse(k, 11);
  const p2 = planetById(k, l2)!;
  const p11 = planetById(k, l11)!;

  // Dhana yoga — 2nd and 11th lords connected (conjunct, aspect, or in each other's house)
  const dhanaConj = p2.rashi.num === p11.rashi.num;
  const mutualExchange = p2.house === 11 && p11.house === 2;
  if (dhanaConj) {
    score += 10;
    factors.push({ kind: 'positive', weight: +10, text: `Dhana yoga: 2nd lord ${l2} and 11th lord ${l11} conjunct` });
  } else if (mutualExchange) {
    score += 12;
    factors.push({ kind: 'positive', weight: +12, text: `Parivartana: 2nd lord ${l2} in 11th, 11th lord ${l11} in 2nd` });
  } else if (p2.house === 2 || p11.house === 11) {
    score += 5;
    factors.push({ kind: 'positive', weight: +5, text: `${l2} in own house or ${l11} in own house` });
  }

  // Dignity of 2nd and 11th lords
  score += dignityScore(p2);
  score += dignityScore(p11);

  // Jupiter = natural wealth karaka
  const ju = planetById(k, 'JU')!;
  if (ju.exalted || ju.ownSign) {
    score += 8;
    factors.push({ kind: 'positive', weight: +8, text: 'Jupiter dignified (abundance)' });
  } else if (ju.debilitated) {
    score -= 8;
    factors.push({ kind: 'negative', weight: -8, text: 'Jupiter debilitated' });
  }

  // 9th lord (bhagya/fortune) strength
  const l9 = lordOfHouse(k, 9);
  const p9 = planetById(k, l9)!;
  score += dignityScore(p9);

  // Rahu in 11th = sudden gains (benefic); Rahu in 2nd = financial turbulence
  const rahu = planetById(k, 'RA')!;
  if (rahu.house === 11) {
    score += 6;
    factors.push({ kind: 'positive', weight: +6, text: 'Rahu in 11th (unexpected windfalls)' });
  }
  if (rahu.house === 2) {
    score -= 4;
    factors.push({ kind: 'negative', weight: -4, text: 'Rahu in 2nd (financial volatility)' });
  }

  score = Math.max(0, Math.min(100, score));
  const summary = score >= 75 ? 'Strong wealth combinations — steady accumulation.'
    : score >= 55 ? 'Moderate wealth potential; discipline in savings matters.'
    : score >= 35 ? 'Wealth requires patience; avoid speculation.'
    : 'Significant financial caution; focus on stable income.';

  return {
    area: 'wealth',
    label: 'Wealth / Finance',
    housesConsidered: [2, 9, 11],
    karakas: ['2nd lord', '11th lord', '9th lord', 'Jupiter (wealth karaka)'],
    score, factors, summary,
  };
}

export interface LifeAreaSuite {
  medical: LifeAreaReport;
  career: LifeAreaReport;
  progeny: LifeAreaReport;
  wealth: LifeAreaReport;
}

export function analyzeLifeAreas(k: KundaliResult): LifeAreaSuite {
  return {
    medical: analyzeMedical(k),
    career:  analyzeCareer(k),
    progeny: analyzeProgeny(k),
    wealth:  analyzeWealth(k),
  };
}
