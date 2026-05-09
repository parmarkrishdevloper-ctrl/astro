// Dwadasha Avastha (Twelve-state) deep reading.
//
// Combines the four classical Avastha schemes into one per-planet row:
//
//   • Baladi      (age / stage of life, 5 states)
//   • Jagradadi   (awake / dream / sleep, 3 states)
//   • Deeptadi    (luminosity / mood, 8 states)
//   • Shad        (situational, 6 states — Lajjita/Garvita/etc.)
//
// Total distinct states across schemes: 5 + 3 + 8 + 6 = 22. The name
// "Dwadasha" (twelve) comes from the older enumeration that bundled
// Baladi and Jagradadi; we surface every scheme.
//
// Verdict rule:
//   start score = 0
//   Baladi:    Yuva +2, Kumara +1, Bala 0, Vriddha −1, Mrita −2
//   Jagradadi: Jagrat +1, Swapna 0, Sushupti −1
//   Deeptadi:  Deepta/Swastha/Mudita +1 each, Shanta 0, Deena/Vikala/Dukhita/Khala −1 each
//   Shad:      Garvita +2, Mudita +1, Trashita/Kshudhita −1, Lajjita −2, Kshobhita −3
//   verdict: score ≥ 3 → 'excellent', 1..2 → 'good', 0 → 'neutral',
//            −1..−2 → 'weak', ≤ −3 → 'afflicted'

import { PlanetId } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import {
  calculateAvasthas, BaladiState, JagradadiState, DeeptadiState,
} from './avastha.service';
import { calculateShadAvastha, ShadAvasthaKey, ShadAvasthaEntry } from './shad-avastha.service';

export type DeepVerdict = 'excellent' | 'good' | 'neutral' | 'weak' | 'afflicted';

export interface AvasthaDeepEntry {
  planet: PlanetId;
  baladi: BaladiState;
  jagradadi: JagradadiState;
  deeptadi: DeeptadiState;
  shad: {
    states: Record<ShadAvasthaKey, boolean>;
    active: ShadAvasthaKey[];
    reasons: { state: ShadAvasthaKey; reason: string }[];
  };
  score: number;
  verdict: DeepVerdict;
  /** Short English line — practical prediction based on net state. */
  reading: string;
}

const BALADI_W: Record<BaladiState, number> = {
  Bala: 0, Kumara: 1, Yuva: 2, Vriddha: -1, Mrita: -2,
};
const JAGRA_W: Record<JagradadiState, number> = {
  Jagrat: 1, Swapna: 0, Sushupti: -1,
};
const DEEP_W: Record<DeeptadiState, number> = {
  Deepta: 1, Swastha: 1, Mudita: 1, Shanta: 0,
  Deena: -1, Vikala: -1, Dukhita: -1, Khala: -1,
};
const SHAD_W: Record<ShadAvasthaKey, number> = {
  Garvita: 2, Mudita: 1, Trashita: -1, Kshudhita: -1, Lajjita: -2, Kshobhita: -3,
};

function readingFor(verdict: DeepVerdict, planet: PlanetId, baladi: BaladiState, deep: DeeptadiState, active: ShadAvasthaKey[]): string {
  const activeStr = active.length ? ` (${active.join(' + ')})` : '';
  switch (verdict) {
    case 'excellent':
      return `${planet} delivers its karakas with full strength — ${baladi}/${deep}${activeStr}.`;
    case 'good':
      return `${planet} is well-placed; its significations fructify with moderate delay.`;
    case 'neutral':
      return `${planet} gives mixed results; depends on dasha and transit support.`;
    case 'weak':
      return `${planet} is weakened${activeStr}; its karakas may be delayed or diminished.`;
    case 'afflicted':
      return `${planet} is severely afflicted${activeStr}; karakas suffer significantly.`;
  }
}

export function calculateAvasthasDeep(k: KundaliResult): AvasthaDeepEntry[] {
  const base = calculateAvasthas(k);                          // baladi+jagra+deeptadi per planet
  const shad: ShadAvasthaEntry[] = calculateShadAvastha(k);  // shad per planet
  const shadById = new Map(shad.map((s) => [s.planet, s]));

  return base.map((b) => {
    const s = shadById.get(b.planet);
    let score = BALADI_W[b.baladi] + JAGRA_W[b.jagradadi] + DEEP_W[b.deeptadi];
    if (s) for (const key of s.active) score += SHAD_W[key];
    const verdict: DeepVerdict =
      score >= 3 ? 'excellent' :
      score >= 1 ? 'good' :
      score === 0 ? 'neutral' :
      score >= -2 ? 'weak' : 'afflicted';
    return {
      planet: b.planet,
      baladi: b.baladi,
      jagradadi: b.jagradadi,
      deeptadi: b.deeptadi,
      shad: {
        states: s?.states ?? emptyShadStates(),
        active: s?.active ?? [],
        reasons: s?.reasons ?? [],
      },
      score,
      verdict,
      reading: readingFor(verdict, b.planet, b.baladi, b.deeptadi, s?.active ?? []),
    };
  });
}

function emptyShadStates(): Record<ShadAvasthaKey, boolean> {
  return { Lajjita: false, Garvita: false, Kshudhita: false, Trashita: false, Mudita: false, Kshobhita: false };
}
