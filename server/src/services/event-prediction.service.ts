// Event prediction engine.
//
// Walks the Vimshottari mahadasha → antardasha tree and emits "event windows"
// when the current dasha lord is connected to a particular life-theme house.
// A planet is "connected" to a house if it owns it, occupies it, or aspects
// it (Parashari). Each event has a category, probability tier, and the
// dasha period that triggers it.

import { PlanetId, RASHIS, SPECIAL_ASPECTS } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { computeVimshottari, computeAntardashas, DashaPeriod } from './dasha.service';

export interface EventCategory {
  key: string;
  label: string;
  houses: number[];   // significator houses for this event type
}

export const EVENT_CATEGORIES: EventCategory[] = [
  { key: 'marriage',    label: 'Marriage',         houses: [7, 2, 11] },
  { key: 'children',    label: 'Children',         houses: [5, 9] },
  { key: 'career',      label: 'Career growth',    houses: [10, 6, 11] },
  { key: 'property',    label: 'Property',         houses: [4, 11] },
  { key: 'travel',      label: 'Foreign travel',   houses: [9, 12, 3] },
  { key: 'health',      label: 'Health concern',   houses: [6, 8, 12] },
  { key: 'wealth',      label: 'Financial gains',  houses: [2, 11, 9] },
];

export interface EventWindow {
  start: string;
  end: string;
  category: string;
  label: string;
  probability: 'High' | 'Medium' | 'Low';
  dasha: string;        // e.g. "Ra-Me-Ve"
  reason: string;
}

function aspectingHouses(planet: PlanetId, fromHouse: number): number[] {
  const houses = new Set<number>();
  // Universal 7th aspect
  houses.add(((fromHouse - 1 + 6) % 12) + 1);
  for (const a of SPECIAL_ASPECTS[planet] || []) {
    houses.add(((fromHouse - 1 + (a - 1)) % 12) + 1);
  }
  return [...houses];
}

/** True if the planet owns / occupies / aspects the target house. */
function planetConnectedToHouse(k: KundaliResult, planet: PlanetId, targetHouse: number): {
  connected: boolean;
  reason: string;
} {
  const lagnaSign = k.ascendant.rashi.num;
  const targetSign = ((lagnaSign - 1 + (targetHouse - 1)) % 12) + 1;
  // Ownership
  const ownsTarget = RASHIS[targetSign - 1].lord === planet;
  if (ownsTarget) return { connected: true, reason: `${planet} owns ${targetHouse}H` };
  const p = k.planets.find((x) => x.id === planet);
  if (!p) return { connected: false, reason: '' };
  // Occupation
  if (p.house === targetHouse) {
    return { connected: true, reason: `${planet} occupies ${targetHouse}H` };
  }
  // Aspect
  const aspected = aspectingHouses(planet, p.house);
  if (aspected.includes(targetHouse)) {
    return { connected: true, reason: `${planet} aspects ${targetHouse}H` };
  }
  return { connected: false, reason: '' };
}

/** Score the strength of a Maha+Antar combo for a given category. */
function scoreCombo(
  k: KundaliResult,
  maha: PlanetId,
  antar: PlanetId,
  cat: EventCategory,
): { prob: EventWindow['probability']; reason: string } | null {
  let score = 0;
  const reasons: string[] = [];
  for (const h of cat.houses) {
    const m = planetConnectedToHouse(k, maha, h);
    if (m.connected) { score += 2; reasons.push('Maha:' + m.reason); }
    const a = planetConnectedToHouse(k, antar, h);
    if (a.connected) { score += 1; reasons.push('Antar:' + a.reason); }
  }
  if (score === 0) return null;
  const prob: EventWindow['probability'] = score >= 4 ? 'High' : score >= 2 ? 'Medium' : 'Low';
  return { prob, reason: reasons.slice(0, 3).join('; ') };
}

export function predictEvents(k: KundaliResult, maxYears = 30): EventWindow[] {
  const v = computeVimshottari(k);
  const cutoffMs = new Date(k.utc).getTime() + maxYears * 365.25 * 86400 * 1000;
  const events: EventWindow[] = [];

  for (const maha of v.mahadashas) {
    if (new Date(maha.start).getTime() > cutoffMs) break;
    const antars = computeAntardashas(maha);
    for (const antar of antars) {
      if (new Date(antar.start).getTime() > cutoffMs) break;
      for (const cat of EVENT_CATEGORIES) {
        const s = scoreCombo(k, maha.lord, antar.lord, cat);
        if (s) {
          events.push({
            start: antar.start,
            end: antar.end,
            category: cat.key,
            label: cat.label,
            probability: s.prob,
            dasha: `${maha.lord}-${antar.lord}`,
            reason: s.reason,
          });
        }
      }
    }
  }
  return events;
}

// ─── Auspiciousness graph ───────────────────────────────────────────────────
//
// For each year in the timeline, score 0..100 based on dasha quality
// (Maha + Antar combined). Quality = function of:
//   + dignity of dasha lords (exalted +30, own +20, friend +10, neutral 0,
//     enemy -10, debilitated -20)
//   + count of benefic events at that point (+5 each)
//   - count of malefic events at that point (-5 each)
// Result is clamped to [0, 100].

export interface AuspiciousnessPoint {
  date: string;
  score: number;
  dasha: string;
}

const DIGNITY_SCORE = (k: KundaliResult, id: PlanetId): number => {
  const p = k.planets.find((x) => x.id === id);
  if (!p) return 0;
  if (p.exalted) return 30;
  if (p.ownSign) return 20;
  if (p.debilitated) return -20;
  if (p.combust) return -10;
  return 5;
};

export function buildAuspiciousnessGraph(k: KundaliResult, years = 30): AuspiciousnessPoint[] {
  const v = computeVimshottari(k);
  const points: AuspiciousnessPoint[] = [];
  const startMs = new Date(k.utc).getTime();
  for (let y = 0; y < years; y++) {
    const ts = startMs + y * 365.25 * 86400 * 1000;
    const maha = v.mahadashas.find(
      (m) => new Date(m.start).getTime() <= ts && ts <= new Date(m.end).getTime(),
    );
    if (!maha) {
      points.push({ date: new Date(ts).toISOString(), score: 50, dasha: '-' });
      continue;
    }
    const antars = computeAntardashas(maha);
    const antar = antars.find(
      (a) => new Date(a.start).getTime() <= ts && ts <= new Date(a.end).getTime(),
    );
    const score = 50
      + DIGNITY_SCORE(k, maha.lord)
      + (antar ? DIGNITY_SCORE(k, antar.lord) / 2 : 0);
    points.push({
      date: new Date(ts).toISOString(),
      score: Math.max(0, Math.min(100, Math.round(score))),
      dasha: antar ? `${maha.lord}-${antar.lord}` : maha.lord,
    });
  }
  return points;
}
