// Ishta Phala & Kashta Phala — classical BPHS ch. 38 "desirable / undesirable effects".
//
//   Ishta  = √(Cheshta Bala × Uchcha Bala)        (in virupas, 0..60)
//   Kashta = √((60 − Cheshta) × (60 − Uchcha))    (in virupas, 0..60)
//
// Where Uchcha Bala = 60 × (180 − d) / 180, with d = shortest angular distance
// of the planet's longitude from its exaltation point (0..180°). So the
// planet earns full 60 virupas at its exaltation and 0 at its debilitation.
//
// Interpretation: high Ishta → planet gives auspicious, desirable results.
// High Kashta → planet's results are troublesome even if the planet is
// otherwise strong (e.g., a debilitated retrograde planet has high Cheshta
// but will still cause Kashta because Uchcha is poor).

import { KundaliResult } from './kundali.service';
import { PlanetId, EXALTATION } from '../utils/astro-constants';

const ISHTA_PLANETS: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA'];

function shortestArc(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

function exaltationLongitude(pid: PlanetId): number | null {
  const e = EXALTATION[pid];
  if (!e) return null;
  return (e.rashi - 1) * 30 + e.deg;
}

/** Uchcha Bala in virupas (0..60). */
export function uchchaBala(k: KundaliResult, pid: PlanetId): number {
  const p = k.planets.find((x) => x.id === pid);
  if (!p) return 0;
  const exaltLong = exaltationLongitude(pid);
  if (exaltLong == null) return 0;
  const d = shortestArc(p.longitude, exaltLong);
  return +(60 * (180 - d) / 180).toFixed(2);
}

/** Cheshta Bala (motional strength) in virupas (0..60). */
export function cheshtaBala(k: KundaliResult, pid: PlanetId): number {
  const p = k.planets.find((x) => x.id === pid);
  if (!p) return 0;
  if (pid === 'SU' || pid === 'MO') return 30;
  if (p.retrograde) return 60;
  return 20;
}

export interface IshtaKashtaRow {
  planet: PlanetId;
  uchchaBala: number;   // 0..60 virupas
  cheshtaBala: number;  // 0..60 virupas
  ishta: number;        // 0..60 virupas
  kashta: number;       // 0..60 virupas
  ishtaRupa: number;    // 0..1
  kashtaRupa: number;   // 0..1
  netResult: 'Auspicious' | 'Mixed' | 'Inauspicious';
}

export interface IshtaKashtaResult {
  rows: IshtaKashtaRow[];
  mostAuspicious: PlanetId;
  mostInauspicious: PlanetId;
}

function classify(ishta: number, kashta: number): IshtaKashtaRow['netResult'] {
  if (ishta - kashta >= 15) return 'Auspicious';
  if (kashta - ishta >= 15) return 'Inauspicious';
  return 'Mixed';
}

export function computeIshtaKashta(k: KundaliResult): IshtaKashtaResult {
  const rows: IshtaKashtaRow[] = ISHTA_PLANETS.map((pid) => {
    const u = uchchaBala(k, pid);
    const c = cheshtaBala(k, pid);
    const ishta = +Math.sqrt(u * c).toFixed(2);
    const kashta = +Math.sqrt((60 - u) * (60 - c)).toFixed(2);
    return {
      planet: pid,
      uchchaBala: u,
      cheshtaBala: c,
      ishta,
      kashta,
      ishtaRupa: +(ishta / 60).toFixed(3),
      kashtaRupa: +(kashta / 60).toFixed(3),
      netResult: classify(ishta, kashta),
    };
  });

  const sortedIshta = [...rows].sort((a, b) => b.ishta - a.ishta);
  const sortedKashta = [...rows].sort((a, b) => b.kashta - a.kashta);
  return {
    rows,
    mostAuspicious: sortedIshta[0].planet,
    mostInauspicious: sortedKashta[0].planet,
  };
}
