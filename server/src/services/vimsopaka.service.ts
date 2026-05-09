// Vimsopaka Bala — 20-point divisional strength (Parashara, BPHS ch. 6).
//
// For each of four classical Varga schemes (Shad, Sapta, Dasha, Shodasha)
// the planet scores 0..20 based on its dignity in each constituent varga,
// weighted by that scheme's per-varga weights (which always sum to 20).
//
// Dignity point values used here (simplified Parashari):
//   Exalted / Own / Vargottama: 20
//   Friend's sign:              15
//   Neutral:                    10
//   Enemy's sign:               7
//   Debilitated:                5
//
// Classical interpretation of the total:
//   15.0+ : Purna   (very strong)
//   12.5+ : Uttama  (strong)
//   10.0+ : Gopura  (moderate)
//    7.5+ : Simhasana (adequate)
//    5.0+ : Paravata (weak)
//    < 5  : Iravata (very weak)

import { PlanetId, RASHIS, EXALTATION } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { buildDivisional, Varga } from './divisional.service';
import { friendshipBetween } from '../utils/match-tables';

export type VimsopakaScheme = 'shad' | 'sapta' | 'dasha' | 'shodasha';

export interface VimsopakaSchemeMeta {
  key: VimsopakaScheme;
  name: string;
  nameHi: string;
  totalWeight: 20;
  weights: Partial<Record<Varga, number>>;
  purpose: string;
}

const SHAD: VimsopakaSchemeMeta = {
  key: 'shad',
  name: 'Shad Varga',
  nameHi: 'षड्वर्ग',
  totalWeight: 20,
  weights: { D1: 6, D2: 2, D3: 4, D9: 5, D12: 2, D30: 1 },
  purpose: '6 vargas — minimum Parashari strength scheme',
};

const SAPTA: VimsopakaSchemeMeta = {
  key: 'sapta',
  name: 'Sapta Varga',
  nameHi: 'सप्तवर्ग',
  totalWeight: 20,
  weights: { D1: 5, D2: 2, D3: 3, D7: 2.5, D9: 4.5, D12: 2, D30: 1 },
  purpose: '7 vargas — adds Saptamsa (progeny)',
};

const DASHA: VimsopakaSchemeMeta = {
  key: 'dasha',
  name: 'Dasha Varga',
  nameHi: 'दशवर्ग',
  totalWeight: 20,
  weights: { D1: 3, D2: 1.5, D3: 1.5, D7: 1.5, D9: 1.5, D10: 1.5, D12: 1.5, D16: 1.5, D30: 1.5, D60: 5 },
  purpose: '10 vargas — BPHS canonical scheme',
};

const SHODASHA: VimsopakaSchemeMeta = {
  key: 'shodasha',
  name: 'Shodasha Varga',
  nameHi: 'षोडशवर्ग',
  totalWeight: 20,
  weights: {
    D1: 3.5, D2: 1, D3: 1, D4: 0.5, D7: 0.5, D9: 3, D10: 0.5, D12: 0.5,
    D16: 2, D20: 0.5, D24: 0.5, D27: 0.5, D30: 1, D40: 0.5, D45: 0.5, D60: 4,
  },
  purpose: 'Full Shodashvarga — 16 vargas, finest Parashari scheme',
};

export const VIMSOPAKA_SCHEMES: Record<VimsopakaScheme, VimsopakaSchemeMeta> = {
  shad: SHAD, sapta: SAPTA, dasha: DASHA, shodasha: SHODASHA,
};

export type VimsopakaDignity =
  | 'Exalted' | 'Own' | 'Vargottama'
  | 'Friend' | 'Neutral' | 'Enemy' | 'Debilitated';

const DIGNITY_POINTS: Record<VimsopakaDignity, number> = {
  Exalted: 20, Own: 20, Vargottama: 20,
  Friend: 15, Neutral: 10, Enemy: 7, Debilitated: 5,
};

function rashiLord(rashiNum: number): PlanetId {
  return RASHIS[rashiNum - 1].lord;
}

function isOwnSign(planet: PlanetId, rashi: number): boolean {
  return rashiLord(rashi) === planet;
}

function isExaltationSign(planet: PlanetId, rashi: number): boolean {
  return EXALTATION[planet]?.rashi === rashi;
}

function isDebilitationSign(planet: PlanetId, rashi: number): boolean {
  const exalt = EXALTATION[planet];
  if (!exalt) return false;
  return rashi === ((exalt.rashi + 5) % 12) + 1;
}

/** Dignity of a single planet in a single rashi, using natural friendship. */
function dignityOf(planet: PlanetId, rashi: number, vargottama: boolean): VimsopakaDignity {
  if (vargottama) return 'Vargottama';
  if (isExaltationSign(planet, rashi)) return 'Exalted';
  if (isDebilitationSign(planet, rashi)) return 'Debilitated';
  if (isOwnSign(planet, rashi)) return 'Own';
  // Nodes don't own a sign — use the dispositor's friendship
  const disp = rashiLord(rashi);
  if (disp === planet) return 'Own';
  const fr = friendshipBetween(planet, disp);
  return fr === 'friend' ? 'Friend' : fr === 'enemy' ? 'Enemy' : 'Neutral';
}

export interface VimsopakaVargaCell {
  varga: Varga;
  rashi: number;
  rashiName: string;
  dignity: VimsopakaDignity;
  points: number;       // 0..20 before weighting
  weight: number;       // scheme's weight for this varga
  contribution: number; // points × weight / 20
  vargottama: boolean;
}

export interface VimsopakaPlanetRow {
  planet: PlanetId;
  scheme: VimsopakaScheme;
  cells: VimsopakaVargaCell[];
  total: number;        // 0..20
  category: 'Purna' | 'Uttama' | 'Gopura' | 'Simhasana' | 'Paravata' | 'Iravata';
}

export interface VimsopakaResult {
  scheme: VimsopakaScheme;
  meta: VimsopakaSchemeMeta;
  rows: VimsopakaPlanetRow[];
  strongest: PlanetId;
  weakest: PlanetId;
}

function classify(total: number): VimsopakaPlanetRow['category'] {
  if (total >= 15)   return 'Purna';
  if (total >= 12.5) return 'Uttama';
  if (total >= 10)   return 'Gopura';
  if (total >= 7.5)  return 'Simhasana';
  if (total >= 5)    return 'Paravata';
  return 'Iravata';
}

export function computeVimsopaka(
  kundali: KundaliResult, schemeKey: VimsopakaScheme = 'shodasha',
): VimsopakaResult {
  const meta = VIMSOPAKA_SCHEMES[schemeKey];
  const vargas = Object.keys(meta.weights) as Varga[];

  // Pre-compute each needed varga once
  const charts = vargas.map((v) => buildDivisional(kundali, v));

  const rows: VimsopakaPlanetRow[] = kundali.planets.map((planet) => {
    const cells: VimsopakaVargaCell[] = charts.map((chart) => {
      const pos = chart.positions.find((x) => x.id === planet.id)!;
      const dignity = dignityOf(planet.id, pos.rashi, pos.vargottama);
      const points = DIGNITY_POINTS[dignity];
      const weight = meta.weights[chart.varga] ?? 0;
      return {
        varga: chart.varga,
        rashi: pos.rashi,
        rashiName: pos.rashiName,
        dignity,
        points,
        weight,
        contribution: (points * weight) / 20,
        vargottama: pos.vargottama,
      };
    });
    const total = +cells.reduce((s, c) => s + c.contribution, 0).toFixed(3);
    return {
      planet: planet.id,
      scheme: schemeKey,
      cells,
      total,
      category: classify(total),
    };
  });

  const sorted = [...rows].sort((a, b) => b.total - a.total);
  return {
    scheme: schemeKey,
    meta,
    rows,
    strongest: sorted[0].planet,
    weakest: sorted[sorted.length - 1].planet,
  };
}
