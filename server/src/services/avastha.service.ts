// Planetary Avasthas (states).
//
// Three classical schemes:
//   - Baladi (age):     Bala / Kumara / Yuva / Vriddha / Mrita
//   - Jagradadi (sleep): Jagrat / Swapna / Sushupti
//   - Deeptadi (mood):   Deepta / Swastha / Mudita / Shanta / Deena /
//                        Vikala / Dukhita / Khala
//
// Each is computed per planet from its sign and degree-in-sign.

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { KundaliResult, PlanetPosition } from './kundali.service';

export type BaladiState = 'Bala' | 'Kumara' | 'Yuva' | 'Vriddha' | 'Mrita';
export type JagradadiState = 'Jagrat' | 'Swapna' | 'Sushupti';
export type DeeptadiState =
  | 'Deepta' | 'Swastha' | 'Mudita' | 'Shanta'
  | 'Deena'  | 'Vikala'  | 'Dukhita' | 'Khala';

/**
 * Baladi avastha — degree-in-sign maps to one of 5 age states.
 * In odd signs the order is Bala→Mrita; in even signs it's reversed.
 * Each state spans 6° of the 30° sign.
 */
export function baladiAvastha(p: PlanetPosition): BaladiState {
  const order: BaladiState[] = ['Bala', 'Kumara', 'Yuva', 'Vriddha', 'Mrita'];
  const seq = p.rashi.num % 2 === 1 ? order : [...order].reverse();
  const slot = Math.min(4, Math.floor(p.rashi.degInRashi / 6));
  return seq[slot];
}

/**
 * Jagradadi — wakeful in own/exalt sign, dreaming in friend, sleeping in
 * enemy. We approximate "friend" via the natural relations table.
 */
const FRIENDS: Record<PlanetId, PlanetId[]> = {
  SU: ['MO', 'MA', 'JU'],
  MO: ['SU', 'ME'],
  MA: ['SU', 'MO', 'JU'],
  ME: ['SU', 'VE'],
  JU: ['SU', 'MO', 'MA'],
  VE: ['ME', 'SA'],
  SA: ['ME', 'VE'],
  RA: ['VE', 'SA'],
  KE: ['MA', 'VE'],
};

export function jagradadiAvastha(p: PlanetPosition): JagradadiState {
  const signLord = RASHIS[p.rashi.num - 1].lord;
  if (p.ownSign || p.exalted) return 'Jagrat';
  if (FRIENDS[p.id]?.includes(signLord)) return 'Swapna';
  return 'Sushupti';
}

/**
 * Deeptadi — luminosity / mood. Simplified rules:
 *   exalted        → Deepta
 *   own sign       → Swastha
 *   friend sign    → Mudita
 *   debilitated    → Dukhita
 *   combust        → Vikala
 *   enemy sign     → Deena
 *   neutral        → Shanta
 */
export function deeptadiAvastha(p: PlanetPosition): DeeptadiState {
  if (p.exalted)     return 'Deepta';
  if (p.ownSign)     return 'Swastha';
  if (p.debilitated) return 'Dukhita';
  if (p.combust)     return 'Vikala';
  const lord = RASHIS[p.rashi.num - 1].lord;
  if (FRIENDS[p.id]?.includes(lord)) return 'Mudita';
  if (lord === p.id) return 'Swastha';
  return 'Shanta';
}

export interface AvasthaEntry {
  planet: PlanetId;
  baladi: BaladiState;
  jagradadi: JagradadiState;
  deeptadi: DeeptadiState;
}

export function calculateAvasthas(k: KundaliResult): AvasthaEntry[] {
  return k.planets
    .filter((p) => !['RA', 'KE'].includes(p.id))
    .map((p) => ({
      planet: p.id,
      baladi: baladiAvastha(p),
      jagradadi: jagradadiAvastha(p),
      deeptadi: deeptadiAvastha(p),
    }));
}
