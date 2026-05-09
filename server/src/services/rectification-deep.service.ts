// Deep rectification — builds on the basic rectification.service by scoring
// candidate birth times against multiple independent techniques and requiring
// convergence for high confidence.
//
// Techniques scored (each 0..100, then weighted):
//   • Vimshottari  (w=40) — maha+antar lord matches event house signif.
//   • D9 (Navamsha, w=25) — D9 lagna matches 7th/spouse karaka when marriage
//                           event present; stable across minutes within
//                           ~3.3-min steps but tell-tale when spanning.
//   • D10 (Dashamsa, w=15) — D10 lagna matches 10L / AK at career event.
//   • Tattwa (w=10) — pancha-tattwa of Lagna sign at event moment (ruling
//                    element) matches event nature; simple heuristic.
//   • Lagna (w=10) — natal lagna degree stable within event window
//                    (penalises candidates that straddle a sign boundary).
//
// Output returns all candidates sorted, top-N detailed breakdown, and a
// confidence label derived from (a) gap between 1st and 2nd + (b) agreement
// across techniques.

import { BirthInput, calculateKundali } from './kundali.service';
import { computeVimshottari, computeAntardashas } from './dasha.service';
import { buildDivisional } from './divisional.service';
import { PlanetId, RASHIS } from '../utils/astro-constants';

export interface DeepEvent {
  date: string;
  /** 'marriage' | 'career' | 'birth-child' | 'loss-parent' | 'health' | 'move' | 'other' */
  category: string;
  /** 1..12 — primary significator house. */
  house: number;
  /** Optional significator planet (karaka): Ve for marriage, Su for father, etc. */
  karaka?: PlanetId;
  weight?: number;
}

export interface DeepCandidate {
  datetimeISO: string;
  score: number;
  scores: {
    vimshottari: number;
    navamsha: number;
    dashamsa: number;
    tattwa: number;
    lagna: number;
  };
  matched: number;
}

export interface DeepRectificationResult {
  bestMatch: DeepCandidate;
  top: DeepCandidate[];
  all: DeepCandidate[];
  confidence: 'low' | 'medium' | 'high';
  commentary: string[];
}

// Element of a sign (1=fire, 2=earth, 3=air, 4=water)
function rashiElement(sign: number): 'fire' | 'earth' | 'air' | 'water' {
  const mod = ((sign - 1) % 4) + 1;
  return mod === 1 ? 'fire' : mod === 2 ? 'earth' : mod === 3 ? 'air' : 'water';
}

function lordOfHouse(ascSign: number, house: number): PlanetId {
  const sign = ((ascSign - 1 + (house - 1)) % 12) + 1;
  return RASHIS[sign - 1].lord;
}

function scoreVimshottari(birth: BirthInput, events: DeepEvent[]): { score: number; matched: number } {
  const k = calculateKundali(birth);
  const v = computeVimshottari(k);
  let score = 0, matched = 0;

  for (const ev of events) {
    const evMs = new Date(ev.date).getTime();
    const maha = v.mahadashas.find(
      (m) => new Date(m.start).getTime() <= evMs && evMs <= new Date(m.end).getTime(),
    );
    if (!maha) continue;
    const ant = computeAntardashas(maha).find(
      (a) => new Date(a.start).getTime() <= evMs && evMs <= new Date(a.end).getTime(),
    );
    if (!ant) continue;

    const hLord = lordOfHouse(k.ascendant.rashi.num, ev.house);
    const w = ev.weight ?? 1;

    if (maha.lord === hLord)               { score += 30 * w; matched++; }
    if (ant.lord === hLord)                { score += 20 * w; matched++; }
    if (ev.karaka && maha.lord === ev.karaka) { score += 10 * w; matched++; }
    if (ev.karaka && ant.lord === ev.karaka)  { score +=  8 * w; matched++; }

    const occ = k.planets.find((p) => (p.id === maha.lord || p.id === ant.lord) && p.house === ev.house);
    if (occ) { score += 6 * w; matched++; }
  }
  return { score, matched };
}

function scoreDivisional(birth: BirthInput, events: DeepEvent[], varga: 'D9' | 'D10', relevantCats: string[]): number {
  const k = calculateKundali(birth);
  const d = buildDivisional(k, varga);
  let score = 0;

  for (const ev of events) {
    if (!relevantCats.includes(ev.category)) continue;
    const w = ev.weight ?? 1;

    // D9: lagna in 7th sign from ascendant D9, OR karaka well-placed
    // D10: lagna in 10th sign from D10 asc
    const hLord = lordOfHouse(d.ascendantRashi, ev.house);
    const occ = d.positions.find((p) => p.id === hLord);
    if (occ) {
      if (occ.vargottama) score += 10 * w;
      if (occ.dignity === 'exalted' || occ.dignity === 'ownSign') score += 6 * w;
      if ([1, 4, 5, 7, 9, 10].includes(occ.house)) score += 4 * w;
    }
    if (ev.karaka) {
      const kp = d.positions.find((p) => p.id === ev.karaka);
      if (kp && [1, 4, 5, 7, 9, 10].includes(kp.house)) score += 5 * w;
    }
  }
  return score;
}

function scoreTattwa(birth: BirthInput, events: DeepEvent[]): number {
  const k = calculateKundali(birth);
  const lagnaEl = rashiElement(k.ascendant.rashi.num);
  const catEl: Record<string, typeof lagnaEl | undefined> = {
    marriage: 'water',
    'birth-child': 'water',
    career: 'fire',
    health: 'earth',
    'loss-parent': 'air',
    move: 'air',
  };
  let score = 0;
  for (const ev of events) {
    const el = catEl[ev.category];
    if (el && el === lagnaEl) score += 4 * (ev.weight ?? 1);
  }
  return score;
}

function scoreLagnaStability(birth: BirthInput): number {
  // Reward candidates whose Lagna is not within 0.5° of a sign boundary.
  const k = calculateKundali(birth);
  const deg = k.ascendant.rashi.degInRashi;
  const edge = Math.min(deg, 30 - deg);
  if (edge > 3) return 8;
  if (edge > 1) return 4;
  return 1;
}

export interface DeepRectificationInput {
  birth: BirthInput;
  events: DeepEvent[];
  windowMinutes?: number;  // default 60
  stepMinutes?: number;    // default 2
}

export function deepRectify(input: DeepRectificationInput): DeepRectificationResult {
  const { birth, events } = input;
  const windowMinutes = input.windowMinutes ?? 60;
  const stepMinutes = input.stepMinutes ?? 2;
  const baseMs = new Date(birth.datetime).getTime();

  const all: DeepCandidate[] = [];
  for (let m = -windowMinutes; m <= windowMinutes; m += stepMinutes) {
    const dt = new Date(baseMs + m * 60_000).toISOString();
    const b2: BirthInput = { ...birth, datetime: dt };

    const vim = scoreVimshottari(b2, events);
    const d9  = scoreDivisional(b2, events, 'D9',  ['marriage', 'birth-child']);
    const d10 = scoreDivisional(b2, events, 'D10', ['career']);
    const tat = scoreTattwa(b2, events);
    const lag = scoreLagnaStability(b2);

    const vNorm = vim.score;
    const total = vNorm * 0.4 + d9 * 0.25 + d10 * 0.15 + tat * 0.10 + lag * 0.10;

    all.push({
      datetimeISO: dt,
      score: +total.toFixed(2),
      scores: {
        vimshottari: +vNorm.toFixed(2),
        navamsha: +d9.toFixed(2),
        dashamsa: +d10.toFixed(2),
        tattwa: +tat.toFixed(2),
        lagna: +lag.toFixed(2),
      },
      matched: vim.matched,
    });
  }

  all.sort((a, b) => b.score - a.score);
  const top = all.slice(0, 10);
  const bestMatch = all[0];
  const second = all[1];

  // Confidence = big gap between 1st and 2nd AND best has convergence
  const gap = second ? (bestMatch.score - second.score) / Math.max(bestMatch.score, 1) : 1;
  const techHit = [
    bestMatch.scores.vimshottari > 20,
    bestMatch.scores.navamsha > 8,
    bestMatch.scores.dashamsa > 6,
  ].filter(Boolean).length;

  let confidence: 'low' | 'medium' | 'high' = 'low';
  if (gap > 0.12 && techHit >= 2) confidence = 'high';
  else if (gap > 0.05 || techHit >= 2) confidence = 'medium';

  const commentary: string[] = [];
  commentary.push(`Best candidate: ${bestMatch.datetimeISO.replace('T', ' ').slice(0, 16)} UTC (score ${bestMatch.score}).`);
  commentary.push(`Gap to runner-up: ${(gap * 100).toFixed(1)}%.`);
  commentary.push(`Vimshottari: ${bestMatch.scores.vimshottari} · D9: ${bestMatch.scores.navamsha} · D10: ${bestMatch.scores.dashamsa}.`);
  if (confidence === 'high')   commentary.push('High confidence — multiple techniques converge on a narrow window.');
  if (confidence === 'medium') commentary.push('Medium confidence — add more dated events to tighten the window.');
  if (confidence === 'low')    commentary.push('Low confidence — consider widening the search or supplying karakas.');

  return { bestMatch, top, all, confidence, commentary };
}
