import { RASHIS, normDeg, PlanetId, VEDIC_PLANETS } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';

/**
 * Divisional (Shodashvarga + extended) charts.
 *
 * Each function takes a sidereal longitude (0..360°) and returns the resulting
 * *rashi number* (1..12) for that varga. Rules follow Parashari / Jagannatha
 * Hora conventions.
 *
 * Full Shodashvarga (16): D1, D2, D3, D4, D7, D9, D10, D12, D16, D20, D24,
 * D27, D30, D40, D45, D60. Extras (D5, D6, D8, D11) included for completeness.
 */

export type Varga =
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6' | 'D7' | 'D8' | 'D9'
  | 'D10' | 'D11' | 'D12' | 'D16' | 'D20' | 'D24' | 'D27' | 'D30'
  | 'D40' | 'D45' | 'D60';

export interface VargaMeta {
  varga: Varga;
  name: string;
  nameHi: string;
  segments: number;
  segmentDeg: number;
  purpose: string;
}

export const VARGA_META: Record<Varga, VargaMeta> = {
  D1:  { varga: 'D1',  name: 'Rasi',             nameHi: 'राशि',            segments: 1,  segmentDeg: 30,     purpose: 'Natal chart — overall life' },
  D2:  { varga: 'D2',  name: 'Hora',             nameHi: 'होरा',            segments: 2,  segmentDeg: 15,     purpose: 'Wealth, prosperity' },
  D3:  { varga: 'D3',  name: 'Drekkana',         nameHi: 'द्रेक्काण',        segments: 3,  segmentDeg: 10,     purpose: 'Siblings, courage, efforts' },
  D4:  { varga: 'D4',  name: 'Chaturthamsa',     nameHi: 'चतुर्थांश',        segments: 4,  segmentDeg: 7.5,    purpose: 'Fortune, property, fixed assets' },
  D5:  { varga: 'D5',  name: 'Panchamsa',        nameHi: 'पंचमांश',          segments: 5,  segmentDeg: 6,      purpose: 'Power, authority, fame' },
  D6:  { varga: 'D6',  name: 'Shashthamsa',      nameHi: 'षष्ठांश',          segments: 6,  segmentDeg: 5,      purpose: 'Enemies, disease, litigation' },
  D7:  { varga: 'D7',  name: 'Saptamsa',         nameHi: 'सप्तांश',          segments: 7,  segmentDeg: 30/7,   purpose: 'Children, progeny' },
  D8:  { varga: 'D8',  name: 'Ashtamsa',         nameHi: 'अष्टांश',          segments: 8,  segmentDeg: 3.75,   purpose: 'Longevity, sudden events, occult' },
  D9:  { varga: 'D9',  name: 'Navamsa',          nameHi: 'नवांश',            segments: 9,  segmentDeg: 30/9,   purpose: 'Spouse, dharma, second half of life' },
  D10: { varga: 'D10', name: 'Dasamsa',          nameHi: 'दशमांश',           segments: 10, segmentDeg: 3,      purpose: 'Career, status, profession' },
  D11: { varga: 'D11', name: 'Rudramsa',         nameHi: 'रुद्रांश',         segments: 11, segmentDeg: 30/11,  purpose: 'Destruction, losses, upheaval' },
  D12: { varga: 'D12', name: 'Dwadasamsa',       nameHi: 'द्वादशांश',        segments: 12, segmentDeg: 2.5,    purpose: 'Parents, lineage, ancestral karma' },
  D16: { varga: 'D16', name: 'Shodasamsa',       nameHi: 'षोडशांश',          segments: 16, segmentDeg: 30/16,  purpose: 'Vehicles, comforts, luxuries (kalatra)' },
  D20: { varga: 'D20', name: 'Vimsamsa',         nameHi: 'विंशांश',          segments: 20, segmentDeg: 1.5,    purpose: 'Spiritual practice, upasana' },
  D24: { varga: 'D24', name: 'Chaturvimsamsa',   nameHi: 'चतुर्विंशांश',     segments: 24, segmentDeg: 1.25,   purpose: 'Education, learning, siddhi' },
  D27: { varga: 'D27', name: 'Bhamsa/Nakshatramsa', nameHi: 'भांश',         segments: 27, segmentDeg: 30/27,  purpose: 'Strength, weakness, stamina' },
  D30: { varga: 'D30', name: 'Trimsamsa',        nameHi: 'त्रिंशांश',         segments: 30, segmentDeg: 1,      purpose: 'Misfortunes, evils, arishta' },
  D40: { varga: 'D40', name: 'Khavedamsa',       nameHi: 'खवेदांश',          segments: 40, segmentDeg: 0.75,   purpose: 'Auspicious/inauspicious effects (matri)' },
  D45: { varga: 'D45', name: 'Akshavedamsa',     nameHi: 'अक्षवेदांश',       segments: 45, segmentDeg: 30/45,  purpose: 'General indications (pitri)' },
  D60: { varga: 'D60', name: 'Shashtiamsa',      nameHi: 'षष्ठ्यांश',        segments: 60, segmentDeg: 0.5,    purpose: 'Past karma, most fine-tuned chart' },
};

const ELEMENT_OFFSET: Record<string, number> = {
  Fire:  0,  // Aries → Aries
  Earth: 9,  // Taurus → Capricorn
  Air:   6,  // Gemini → Libra
  Water: 3,  // Cancer → Cancer
};

const QUALITY_OFFSET_AFJ: Record<string, number> = {
  Movable: 0,  // Aries
  Fixed:   4,  // Leo
  Dual:    8,  // Sagittarius
};

function rashiIndex(longitude: number): number {
  return Math.floor(normDeg(longitude) / 30); // 0..11
}
function degInRashi(longitude: number): number {
  return normDeg(longitude) - rashiIndex(longitude) * 30;
}
function isOdd(idx: number): boolean { return idx % 2 === 0; } // idx 0=Aries (odd)

// ─── D1 — Rasi ──────────────────────────────────────────────────────────────
export function d1(longitude: number): number {
  return rashiIndex(longitude) + 1;
}

// ─── D2 — Hora (wealth) ─────────────────────────────────────────────────────
export function d2(longitude: number): number {
  const idx = rashiIndex(longitude);
  const firstHalf = degInRashi(longitude) < 15;
  const sunsHora = (isOdd(idx) && firstHalf) || (!isOdd(idx) && !firstHalf);
  return sunsHora ? 5 /* Leo */ : 4 /* Cancer */;
}

// ─── D3 — Drekkana ──────────────────────────────────────────────────────────
export function d3(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / 10);
  const offset = segment === 0 ? 0 : segment === 1 ? 4 : 8;
  return ((idx + offset) % 12) + 1;
}

// ─── D4 — Chaturthamsa ─────────────────────────────────────────────────────
// 4 segments of 7°30'. Goes same-sign, 4th, 7th, 10th (kendras).
export function d4(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / 7.5);
  return ((idx + segment * 3) % 12) + 1;
}

// ─── D5 — Panchamsa ─────────────────────────────────────────────────────────
// 5 segments of 6°. Odd signs start from Aries; Even from Libra.
export function d5(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / 6);
  const start = isOdd(idx) ? 0 : 6;
  return ((start + segment) % 12) + 1;
}

// ─── D6 — Shashthamsa ───────────────────────────────────────────────────────
// 6 segments of 5°. Odd signs: same sign; Even: 7th from it.
export function d6(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / 5);
  const start = isOdd(idx) ? idx : (idx + 6) % 12;
  return ((start + segment) % 12) + 1;
}

// ─── D7 — Saptamsa ──────────────────────────────────────────────────────────
export function d7(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / (30 / 7));
  const start = isOdd(idx) ? idx : (idx + 6) % 12;
  return ((start + segment) % 12) + 1;
}

// ─── D8 — Ashtamsa ──────────────────────────────────────────────────────────
// 8 segments of 3°45'. Movable→Aries, Fixed→Leo, Dual→Sagittarius.
export function d8(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / 3.75);
  const start = QUALITY_OFFSET_AFJ[RASHIS[idx].quality];
  return ((start + segment) % 12) + 1;
}

// ─── D9 — Navamsa ───────────────────────────────────────────────────────────
export function d9(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / (30 / 9));
  const offset = ELEMENT_OFFSET[RASHIS[idx].element];
  return ((offset + segment) % 12) + 1;
}

// ─── D10 — Dasamsa ──────────────────────────────────────────────────────────
export function d10(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / 3);
  const start = isOdd(idx) ? idx : (idx + 8) % 12;
  return ((start + segment) % 12) + 1;
}

// ─── D11 — Rudramsa ─────────────────────────────────────────────────────────
// 11 segments. Forward from same sign.
export function d11(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / (30 / 11));
  return ((idx + segment) % 12) + 1;
}

// ─── D12 — Dwadasamsa ───────────────────────────────────────────────────────
export function d12(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / 2.5);
  return ((idx + segment) % 12) + 1;
}

// ─── D16 — Shodasamsa ───────────────────────────────────────────────────────
// 16 segments of 1°52.5'. Movable→Aries, Fixed→Leo, Dual→Sagittarius.
export function d16(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / (30 / 16));
  const start = QUALITY_OFFSET_AFJ[RASHIS[idx].quality];
  return ((start + segment) % 12) + 1;
}

// ─── D20 — Vimsamsa ─────────────────────────────────────────────────────────
// 20 segments of 1°30'. Movable→Aries, Fixed→Sagittarius, Dual→Leo.
const QUALITY_OFFSET_D20: Record<string, number> = {
  Movable: 0, Fixed: 8, Dual: 4,
};
export function d20(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / 1.5);
  const start = QUALITY_OFFSET_D20[RASHIS[idx].quality];
  return ((start + segment) % 12) + 1;
}

// ─── D24 — Chaturvimsamsa ───────────────────────────────────────────────────
// 24 segments of 1°15'. Odd signs→Leo, Even signs→Cancer.
export function d24(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / 1.25);
  const start = isOdd(idx) ? 4 /* Leo */ : 3 /* Cancer */;
  return ((start + segment) % 12) + 1;
}

// ─── D27 — Bhamsa / Nakshatramsa ────────────────────────────────────────────
// 27 segments of ~1°6.67'. Fire→Aries, Earth→Cancer, Air→Libra, Water→Capricorn.
const ELEMENT_OFFSET_D27: Record<string, number> = {
  Fire: 0, Earth: 3, Air: 6, Water: 9,
};
export function d27(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / (30 / 27));
  const start = ELEMENT_OFFSET_D27[RASHIS[idx].element];
  return ((start + segment) % 12) + 1;
}

// ─── D30 — Trimsamsa ────────────────────────────────────────────────────────
// Non-uniform segments. Lords: Mars, Saturn, Jupiter, Mercury, Venus.
// Odd signs:  0-5 Mars→Aries(1), 5-10 Sat→Aqr(11), 10-18 Jup→Sag(9),
//             18-25 Mer→Gem(3), 25-30 Ven→Lib(7).
// Even signs: 0-5 Ven→Tau(2), 5-12 Mer→Vir(6), 12-20 Jup→Pis(12),
//             20-25 Sat→Cap(10), 25-30 Mars→Sco(8).
export function d30(longitude: number): number {
  const idx = rashiIndex(longitude);
  const deg = degInRashi(longitude);
  if (isOdd(idx)) {
    if (deg < 5)  return 1;
    if (deg < 10) return 11;
    if (deg < 18) return 9;
    if (deg < 25) return 3;
    return 7;
  } else {
    if (deg < 5)  return 2;
    if (deg < 12) return 6;
    if (deg < 20) return 12;
    if (deg < 25) return 10;
    return 8;
  }
}

// ─── D40 — Khavedamsa ───────────────────────────────────────────────────────
// 40 segments of 0°45'. Odd signs→Aries, Even signs→Libra.
export function d40(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / 0.75);
  const start = isOdd(idx) ? 0 : 6;
  return ((start + segment) % 12) + 1;
}

// ─── D45 — Akshavedamsa ─────────────────────────────────────────────────────
// 45 segments. Movable→Aries, Fixed→Leo, Dual→Sagittarius.
export function d45(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / (30 / 45));
  const start = QUALITY_OFFSET_AFJ[RASHIS[idx].quality];
  return ((start + segment) % 12) + 1;
}

// ─── D60 — Shashtiamsa ──────────────────────────────────────────────────────
// 60 segments of 0°30'. Odd signs: forward from same sign. Even: backward.
export function d60(longitude: number): number {
  const idx = rashiIndex(longitude);
  const segment = Math.floor(degInRashi(longitude) / 0.5); // 0..59
  if (isOdd(idx)) {
    return ((idx + segment) % 12) + 1;
  }
  // Even: reverse direction through zodiac
  return (((idx - segment) % 12) + 12) % 12 + 1;
}

const VARGA_FN: Record<Varga, (long: number) => number> = {
  D1: d1, D2: d2, D3: d3, D4: d4, D5: d5, D6: d6, D7: d7, D8: d8,
  D9: d9, D10: d10, D11: d11, D12: d12, D16: d16, D20: d20, D24: d24,
  D27: d27, D30: d30, D40: d40, D45: d45, D60: d60,
};

export const ALL_VARGAS: Varga[] = Object.keys(VARGA_FN) as Varga[];

// ─── Dignity inside a varga ─────────────────────────────────────────────────
// Exaltation/debilitation signs by planet (standard Parashari).
const EXALT_SIGN: Record<PlanetId, number | null> = {
  SU: 1,  MO: 2, MA: 10, ME: 6, JU: 4, VE: 12, SA: 7, RA: 3,  KE: 9,
};
const DEBIL_SIGN: Record<PlanetId, number | null> = {
  SU: 7,  MO: 8, MA: 4,  ME: 12, JU: 10, VE: 6, SA: 1, RA: 9,  KE: 3,
};
const OWN_SIGNS: Record<PlanetId, number[]> = {
  SU: [5], MO: [4], MA: [1, 8], ME: [3, 6], JU: [9, 12],
  VE: [2, 7], SA: [10, 11], RA: [], KE: [],
};

type Dignity = 'Exalted' | 'Debilitated' | 'OwnSign' | '';

function dignityIn(rashi: number, planet: PlanetId): Dignity {
  if (EXALT_SIGN[planet] === rashi) return 'Exalted';
  if (DEBIL_SIGN[planet] === rashi) return 'Debilitated';
  if (OWN_SIGNS[planet].includes(rashi)) return 'OwnSign';
  return '';
}

// ─── Build one varga chart ─────────────────────────────────────────────────
export interface DivisionalPosition {
  id: PlanetId;
  name: string;
  rashi: number;
  rashiName: string;
  rashiNameHi: string;
  house: number;
  dignity: Dignity;
  vargottama: boolean; // same rashi in this varga and D-1
}

export interface DivisionalChart {
  varga: Varga;
  meta: VargaMeta;
  ascendantRashi: number;
  ascendantRashiName: string;
  positions: DivisionalPosition[];
}

export function buildDivisional(kundali: KundaliResult, varga: Varga): DivisionalChart {
  const fn = VARGA_FN[varga];
  const ascRashi = fn(kundali.ascendant.longitude);

  const positions: DivisionalPosition[] = kundali.planets.map((p) => {
    const vrashi = fn(p.longitude);
    const natalRashi = d1(p.longitude);
    const house = ((vrashi - ascRashi + 12) % 12) + 1;
    const r = RASHIS[vrashi - 1];
    return {
      id: p.id,
      name: p.name,
      rashi: vrashi,
      rashiName: r.name,
      rashiNameHi: r.nameHi,
      house,
      dignity: dignityIn(vrashi, p.id),
      vargottama: vrashi === natalRashi,
    };
  });

  return {
    varga,
    meta: VARGA_META[varga],
    ascendantRashi: ascRashi,
    ascendantRashiName: RASHIS[ascRashi - 1].name,
    positions,
  };
}

export function buildAllDivisionals(kundali: KundaliResult): Record<Varga, DivisionalChart> {
  const out = {} as Record<Varga, DivisionalChart>;
  ALL_VARGAS.forEach((v) => {
    out[v] = buildDivisional(kundali, v);
  });
  return out;
}

// ─── Varga summary — quick strength view across all divisionals ────────────
export interface VargaSummaryRow {
  id: PlanetId;
  name: string;
  vargottamaCount: number;          // how many vargas same sign as D-1
  exaltedCount: number;
  debilitatedCount: number;
  ownSignCount: number;
  details: { varga: Varga; rashi: number; rashiName: string; dignity: Dignity; vargottama: boolean }[];
}

export function vargaSummary(kundali: KundaliResult): VargaSummaryRow[] {
  const charts = buildAllDivisionals(kundali);
  return kundali.planets.map((p) => {
    const details = ALL_VARGAS.map((v) => {
      const pos = charts[v].positions.find((x) => x.id === p.id)!;
      return {
        varga: v, rashi: pos.rashi, rashiName: pos.rashiName,
        dignity: pos.dignity, vargottama: pos.vargottama,
      };
    });
    return {
      id: p.id, name: p.name,
      vargottamaCount: details.filter((d) => d.vargottama).length,
      exaltedCount: details.filter((d) => d.dignity === 'Exalted').length,
      debilitatedCount: details.filter((d) => d.dignity === 'Debilitated').length,
      ownSignCount: details.filter((d) => d.dignity === 'OwnSign').length,
      details,
    };
  });
}

void VEDIC_PLANETS;
