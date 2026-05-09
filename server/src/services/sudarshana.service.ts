// Sudarshana Chakra — three concentric rings of houses computed from three
// reference points (Lagna, Moon, Sun). Each ring is 12 cells; cell N of ring
// X holds the planets that fall in the (N-th from X) sign.
//
// We return a JSON-friendly structure that the UI can render as an SVG ring
// chart, plus a precomputed Sudarshana Dasha sequence (each house = 1 year,
// cycling Lagna→Moon→Sun rings).

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';

export interface SudarshanaCell {
  house: number;            // 1..12
  signNum: number;          // 1..12
  signName: string;
  planets: PlanetId[];
}

export interface SudarshanaRing {
  reference: 'Lagna' | 'Moon' | 'Sun';
  refSignNum: number;
  cells: SudarshanaCell[];  // house 1..12
}

function buildRing(
  k: KundaliResult,
  refSignNum: number,
  reference: SudarshanaRing['reference'],
): SudarshanaRing {
  const cells: SudarshanaCell[] = [];
  for (let h = 1; h <= 12; h++) {
    const signNum = ((refSignNum - 1 + (h - 1)) % 12) + 1;
    const planetsInSign = k.planets
      .filter((p) => p.rashi.num === signNum)
      .map((p) => p.id);
    cells.push({
      house: h,
      signNum,
      signName: RASHIS[signNum - 1].name,
      planets: planetsInSign,
    });
  }
  return { reference, refSignNum, cells };
}

export interface SudarshanaResult {
  rings: SudarshanaRing[];
  /**
   * Sudarshana Dasha — 36-year cycle (12 years × 3 rings). Each year is the
   * same numerical house seen from a different reference. Year 1 = Lagna H1,
   * year 13 = Moon H1, year 25 = Sun H1.
   */
  dasha: { year: number; ring: SudarshanaRing['reference']; house: number; signNum: number }[];
}

export function calculateSudarshana(k: KundaliResult): SudarshanaResult {
  const lagna = k.ascendant.rashi.num;
  const moon = k.planets.find((p) => p.id === 'MO')!.rashi.num;
  const sun  = k.planets.find((p) => p.id === 'SU')!.rashi.num;

  const rings = [
    buildRing(k, lagna, 'Lagna'),
    buildRing(k, moon, 'Moon'),
    buildRing(k, sun,  'Sun'),
  ];

  const dasha: SudarshanaResult['dasha'] = [];
  rings.forEach((r) => {
    r.cells.forEach((c) => {
      dasha.push({
        year: dasha.length + 1,
        ring: r.reference,
        house: c.house,
        signNum: c.signNum,
      });
    });
  });

  return { rings, dasha };
}
