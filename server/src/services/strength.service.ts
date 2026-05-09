// Simplified Shadbala — six-fold planetary strength. Classical Shadbala has
// many sub-rules; here we implement the principal components in a way that
// is fast, deterministic, and gives a meaningful relative ranking:
//
//   1. Sthana Bala  — positional strength (exalted/own/friend/neutral/enemy/debil)
//   2. Dig Bala     — directional strength (each planet has a favorable house)
//   3. Kala Bala    — temporal strength (day/night, paksha)
//   4. Cheshta Bala — motional strength (retrograde / fast motion)
//   5. Naisargika   — natural strength (fixed Parashari ranking)
//   6. Drik Bala    — aspectual strength (benefic vs malefic aspects)
//
// Result is in Virupas (60 = 1 Rupa). Rupa total is then categorized.

import { KundaliResult } from './kundali.service';
import { PlanetId } from '../utils/astro-constants';

const ALL: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA'];

// Naisargika Bala — fixed natural strength (Parashari, in Virupas)
const NAISARGIKA: Record<PlanetId, number> = {
  SU: 60.00,
  MO: 51.43,
  VE: 42.85,
  JU: 34.28,
  ME: 25.70,
  MA: 17.14,
  SA: 8.57,
  RA: 0,
  KE: 0,
};

// Dig Bala — each planet's favorable house (max 60 virupas there, 0 opposite)
const DIG_HOUSE: Record<PlanetId, number> = {
  SU: 10, MA: 10,           // South (10th)
  JU: 1, ME: 1,             // East (1st)
  SA: 7,                    // West (7th)
  MO: 4, VE: 4,             // North (4th)
  RA: 0, KE: 0,
};

// Friendships (natural)
const FRIENDS: Record<PlanetId, PlanetId[]> = {
  SU: ['MO', 'MA', 'JU'],
  MO: ['SU', 'ME'],
  MA: ['SU', 'MO', 'JU'],
  ME: ['SU', 'VE'],
  JU: ['SU', 'MO', 'MA'],
  VE: ['ME', 'SA'],
  SA: ['ME', 'VE'],
  RA: [],
  KE: [],
};
const ENEMIES: Record<PlanetId, PlanetId[]> = {
  SU: ['VE', 'SA'],
  MO: [],
  MA: ['ME'],
  ME: ['MO'],
  JU: ['ME', 'VE'],
  VE: ['SU', 'MO'],
  SA: ['SU', 'MO', 'MA'],
  RA: [],
  KE: [],
};

// Sign lords for resolving who owns the rashi the planet sits in
const SIGN_LORD: PlanetId[] = [
  'MA', 'VE', 'ME', 'MO', 'SU', 'ME',
  'VE', 'MA', 'JU', 'SA', 'SA', 'JU',
];

function relation(planet: PlanetId, signLord: PlanetId): 'own' | 'friend' | 'neutral' | 'enemy' {
  if (planet === signLord) return 'own';
  if (FRIENDS[planet]?.includes(signLord)) return 'friend';
  if (ENEMIES[planet]?.includes(signLord)) return 'enemy';
  return 'neutral';
}

// ─── COMPONENT CALCULATORS ──────────────────────────────────────────────────

function sthanaBala(k: KundaliResult, pid: PlanetId): number {
  const p = k.planets.find((x) => x.id === pid)!;
  if (p.exalted) return 60;
  if (p.debilitated) return 0;
  if (p.ownSign) return 45;
  const lord = SIGN_LORD[p.rashi.num - 1];
  const rel = relation(pid, lord);
  if (rel === 'friend') return 30;
  if (rel === 'neutral') return 15;
  return 7.5; // enemy
}

function digBala(k: KundaliResult, pid: PlanetId): number {
  const p = k.planets.find((x) => x.id === pid)!;
  const fav = DIG_HOUSE[pid];
  if (!fav) return 0;
  // Distance from favorable house, 0..6 (closer = stronger)
  const dist = Math.min(
    Math.abs(p.house - fav),
    12 - Math.abs(p.house - fav),
  );
  // Linear scaling: dist 0 → 60, dist 6 → 0
  return Math.max(0, 60 - dist * 10);
}

function kalaBala(k: KundaliResult, pid: PlanetId): number {
  // Without exact sunrise we approximate "day/night" by Sun's house: if Sun
  // is in houses 7-12 the chart is daytime; else night-time. Then:
  //   • Day-strong planets (Sun, Jupiter, Venus) gain in day charts
  //   • Night-strong planets (Moon, Mars, Saturn) gain in night charts
  //   • Mercury is always strong
  const sunHouse = k.planets.find((x) => x.id === 'SU')!.house;
  const isDay = sunHouse >= 7 && sunHouse <= 12;
  const dayStrong: PlanetId[] = ['SU', 'JU', 'VE'];
  const nightStrong: PlanetId[] = ['MO', 'MA', 'SA'];
  if (pid === 'ME') return 60;
  if (isDay && dayStrong.includes(pid)) return 60;
  if (!isDay && nightStrong.includes(pid)) return 60;
  return 30;
}

function cheshtaBala(k: KundaliResult, pid: PlanetId): number {
  const p = k.planets.find((x) => x.id === pid)!;
  // Sun and Moon don't go retrograde — give them moderate Cheshta from speed
  if (pid === 'SU' || pid === 'MO') return 30;
  if (pid === 'RA' || pid === 'KE') return 30; // shadow grahas
  // Retrograde planets get max Cheshta (per Parashara, retrograde = strong motion)
  if (p.retrograde) return 60;
  // Otherwise scale by speed magnitude (rough, since each planet has different mean speed)
  return 20;
}

function naisargikaBala(pid: PlanetId): number {
  return NAISARGIKA[pid] ?? 0;
}

function drikBala(k: KundaliResult, pid: PlanetId): number {
  // Count benefic vs malefic aspects on this planet's house. Benefics:
  // Jupiter, Venus, Mercury (when not with malefics), waxing Moon. Malefics:
  // Sun, Mars, Saturn, Rahu, Ketu.
  const target = k.planets.find((x) => x.id === pid)!;
  const BENEFIC: PlanetId[] = ['JU', 'VE', 'ME', 'MO'];
  const MALEFIC: PlanetId[] = ['SU', 'MA', 'SA', 'RA', 'KE'];
  let score = 30;

  for (const other of k.planets) {
    if (other.id === pid) continue;
    // Standard 7th aspect for all
    const dist = ((target.rashi.num - other.rashi.num + 12) % 12) + 1;
    const aspects: number[] = [7];
    if (other.id === 'MA') aspects.push(4, 8);
    if (other.id === 'JU') aspects.push(5, 9);
    if (other.id === 'SA') aspects.push(3, 10);
    if (aspects.includes(dist)) {
      if (BENEFIC.includes(other.id)) score += 5;
      else if (MALEFIC.includes(other.id)) score -= 5;
    }
  }
  return Math.max(0, Math.min(60, score));
}

// ─── PUBLIC ─────────────────────────────────────────────────────────────────

export interface PlanetStrength {
  planet: PlanetId;
  components: {
    sthana: number;
    dig: number;
    kala: number;
    cheshta: number;
    naisargika: number;
    drik: number;
  };
  totalVirupas: number;
  totalRupas: number;
  category: 'very strong' | 'strong' | 'moderate' | 'weak';
}

export interface ShadbalaResult {
  planets: PlanetStrength[];
  strongest: PlanetId;
  weakest: PlanetId;
}

function categorize(rupas: number): PlanetStrength['category'] {
  if (rupas >= 6) return 'very strong';
  if (rupas >= 4.5) return 'strong';
  if (rupas >= 3) return 'moderate';
  return 'weak';
}

export function calculateShadbala(k: KundaliResult): ShadbalaResult {
  const planets: PlanetStrength[] = ALL.map((pid) => {
    const components = {
      sthana: sthanaBala(k, pid),
      dig: digBala(k, pid),
      kala: kalaBala(k, pid),
      cheshta: cheshtaBala(k, pid),
      naisargika: naisargikaBala(pid),
      drik: drikBala(k, pid),
    };
    const totalVirupas = Object.values(components).reduce((a, b) => a + b, 0);
    const totalRupas = +(totalVirupas / 60).toFixed(2);
    return {
      planet: pid,
      components,
      totalVirupas: +totalVirupas.toFixed(2),
      totalRupas,
      category: categorize(totalRupas),
    };
  });

  const sorted = [...planets].sort((a, b) => b.totalVirupas - a.totalVirupas);
  return {
    planets,
    strongest: sorted[0].planet,
    weakest: sorted[sorted.length - 1].planet,
  };
}
