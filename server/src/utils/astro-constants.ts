import { swisseph } from '../config/ephemeris';

// ─── PLANETS ────────────────────────────────────────────────────────────────

export type PlanetId = 'SU' | 'MO' | 'MA' | 'ME' | 'JU' | 'VE' | 'SA' | 'RA' | 'KE';

export interface VedicPlanet {
  id: PlanetId;
  name: string;
  nameHi: string;
  swephId: number;       // -1 for KE (computed)
  computed?: boolean;
}

export const VEDIC_PLANETS: VedicPlanet[] = [
  { id: 'SU', name: 'Sun',     nameHi: 'सूर्य', swephId: swisseph.SE_SUN },
  { id: 'MO', name: 'Moon',    nameHi: 'चन्द्र', swephId: swisseph.SE_MOON },
  { id: 'MA', name: 'Mars',    nameHi: 'मंगल', swephId: swisseph.SE_MARS },
  { id: 'ME', name: 'Mercury', nameHi: 'बुध', swephId: swisseph.SE_MERCURY },
  { id: 'JU', name: 'Jupiter', nameHi: 'गुरु', swephId: swisseph.SE_JUPITER },
  { id: 'VE', name: 'Venus',   nameHi: 'शुक्र', swephId: swisseph.SE_VENUS },
  { id: 'SA', name: 'Saturn',  nameHi: 'शनि', swephId: swisseph.SE_SATURN },
  { id: 'RA', name: 'Rahu',    nameHi: 'राहु', swephId: swisseph.SE_TRUE_NODE },
  { id: 'KE', name: 'Ketu',    nameHi: 'केतु', swephId: -1, computed: true },
];

// ─── RASHIS (12 zodiac signs) ───────────────────────────────────────────────

export type Element = 'Fire' | 'Earth' | 'Air' | 'Water';
export type Quality = 'Movable' | 'Fixed' | 'Dual';

export interface Rashi {
  num: number;            // 1..12
  name: string;
  nameHi: string;
  lord: PlanetId;
  element: Element;
  quality: Quality;
}

export const RASHIS: Rashi[] = [
  { num: 1,  name: 'Aries',       nameHi: 'मेष',       lord: 'MA', element: 'Fire',  quality: 'Movable' },
  { num: 2,  name: 'Taurus',      nameHi: 'वृषभ',      lord: 'VE', element: 'Earth', quality: 'Fixed'   },
  { num: 3,  name: 'Gemini',      nameHi: 'मिथुन',     lord: 'ME', element: 'Air',   quality: 'Dual'    },
  { num: 4,  name: 'Cancer',      nameHi: 'कर्क',      lord: 'MO', element: 'Water', quality: 'Movable' },
  { num: 5,  name: 'Leo',         nameHi: 'सिंह',      lord: 'SU', element: 'Fire',  quality: 'Fixed'   },
  { num: 6,  name: 'Virgo',       nameHi: 'कन्या',     lord: 'ME', element: 'Earth', quality: 'Dual'    },
  { num: 7,  name: 'Libra',       nameHi: 'तुला',      lord: 'VE', element: 'Air',   quality: 'Movable' },
  { num: 8,  name: 'Scorpio',     nameHi: 'वृश्चिक',   lord: 'MA', element: 'Water', quality: 'Fixed'   },
  { num: 9,  name: 'Sagittarius', nameHi: 'धनु',       lord: 'JU', element: 'Fire',  quality: 'Dual'    },
  { num: 10, name: 'Capricorn',   nameHi: 'मकर',       lord: 'SA', element: 'Earth', quality: 'Movable' },
  { num: 11, name: 'Aquarius',    nameHi: 'कुम्भ',     lord: 'SA', element: 'Air',   quality: 'Fixed'   },
  { num: 12, name: 'Pisces',      nameHi: 'मीन',       lord: 'JU', element: 'Water', quality: 'Dual'    },
];

// ─── NAKSHATRAS (27 lunar mansions) ─────────────────────────────────────────

export const NAK_SPAN = 360 / 27;   // 13°20'
export const PADA_SPAN = NAK_SPAN / 4; // 3°20'

export interface Nakshatra {
  num: number;            // 1..27
  name: string;
  nameHi: string;
  lord: PlanetId;         // Vimshottari dasha lord
  startDeg: number;       // sidereal starting longitude
}

export const NAKSHATRAS: Nakshatra[] = [
  { num: 1,  name: 'Ashwini',          nameHi: 'अश्विनी',       lord: 'KE' },
  { num: 2,  name: 'Bharani',          nameHi: 'भरणी',          lord: 'VE' },
  { num: 3,  name: 'Krittika',         nameHi: 'कृत्तिका',      lord: 'SU' },
  { num: 4,  name: 'Rohini',           nameHi: 'रोहिणी',        lord: 'MO' },
  { num: 5,  name: 'Mrigashira',       nameHi: 'मृगशिरा',       lord: 'MA' },
  { num: 6,  name: 'Ardra',            nameHi: 'आर्द्रा',       lord: 'RA' },
  { num: 7,  name: 'Punarvasu',        nameHi: 'पुनर्वसु',      lord: 'JU' },
  { num: 8,  name: 'Pushya',           nameHi: 'पुष्य',         lord: 'SA' },
  { num: 9,  name: 'Ashlesha',         nameHi: 'आश्लेषा',       lord: 'ME' },
  { num: 10, name: 'Magha',            nameHi: 'मघा',           lord: 'KE' },
  { num: 11, name: 'Purva Phalguni',   nameHi: 'पूर्व फाल्गुनी', lord: 'VE' },
  { num: 12, name: 'Uttara Phalguni',  nameHi: 'उत्तर फाल्गुनी', lord: 'SU' },
  { num: 13, name: 'Hasta',            nameHi: 'हस्त',          lord: 'MO' },
  { num: 14, name: 'Chitra',           nameHi: 'चित्रा',        lord: 'MA' },
  { num: 15, name: 'Swati',            nameHi: 'स्वाति',        lord: 'RA' },
  { num: 16, name: 'Vishakha',         nameHi: 'विशाखा',        lord: 'JU' },
  { num: 17, name: 'Anuradha',         nameHi: 'अनुराधा',       lord: 'SA' },
  { num: 18, name: 'Jyeshtha',         nameHi: 'ज्येष्ठा',      lord: 'ME' },
  { num: 19, name: 'Mula',             nameHi: 'मूल',           lord: 'KE' },
  { num: 20, name: 'Purva Ashadha',    nameHi: 'पूर्वाषाढ़ा',   lord: 'VE' },
  { num: 21, name: 'Uttara Ashadha',   nameHi: 'उत्तराषाढ़ा',   lord: 'SU' },
  { num: 22, name: 'Shravana',         nameHi: 'श्रवण',         lord: 'MO' },
  { num: 23, name: 'Dhanishta',        nameHi: 'धनिष्ठा',       lord: 'MA' },
  { num: 24, name: 'Shatabhisha',      nameHi: 'शतभिषा',        lord: 'RA' },
  { num: 25, name: 'Purva Bhadrapada', nameHi: 'पूर्वभाद्रपद',  lord: 'JU' },
  { num: 26, name: 'Uttara Bhadrapada',nameHi: 'उत्तरभाद्रपद',  lord: 'SA' },
  { num: 27, name: 'Revati',           nameHi: 'रेवती',         lord: 'ME' },
].map((n, i) => ({ ...n, startDeg: i * NAK_SPAN }));

// ─── VIMSHOTTARI DASHA ──────────────────────────────────────────────────────

export const VIMSHOTTARI_ORDER: PlanetId[] = ['KE','VE','SU','MO','MA','RA','JU','SA','ME'];
export const VIMSHOTTARI_YEARS: Record<PlanetId, number> = {
  KE: 7, VE: 20, SU: 6, MO: 10, MA: 7, RA: 18, JU: 16, SA: 19, ME: 17,
};
export const VIMSHOTTARI_TOTAL = 120; // years
export const SOLAR_YEAR_DAYS = 365.25;

// ─── EXALTATION / DEBILITATION ──────────────────────────────────────────────

// rashiNum, deg
export const EXALTATION: Partial<Record<PlanetId, { rashi: number; deg: number }>> = {
  SU: { rashi: 1,  deg: 10 },  // Aries
  MO: { rashi: 2,  deg: 3  },  // Taurus
  MA: { rashi: 10, deg: 28 },  // Capricorn
  ME: { rashi: 6,  deg: 15 },  // Virgo
  JU: { rashi: 4,  deg: 5  },  // Cancer
  VE: { rashi: 12, deg: 27 },  // Pisces
  SA: { rashi: 7,  deg: 20 },  // Libra
};

// Combustion ranges (degrees from Sun)
export const COMBUSTION_DEG: Partial<Record<PlanetId, number>> = {
  ME: 14, VE: 10, MA: 17, JU: 11, SA: 15,
};

// Vedic special aspects (in addition to the universal 7th-house aspect)
export const SPECIAL_ASPECTS: Partial<Record<PlanetId, number[]>> = {
  MA: [4, 8],
  JU: [5, 9],
  SA: [3, 10],
};

// ─── HELPERS ────────────────────────────────────────────────────────────────

export function normDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

export function rashiOf(longitude: number): { num: number; name: string; nameHi: string; deg: number } {
  const norm = normDeg(longitude);
  const num = Math.floor(norm / 30) + 1;
  const r = RASHIS[num - 1];
  return { num, name: r.name, nameHi: r.nameHi, deg: norm - (num - 1) * 30 };
}

export function nakshatraOf(longitude: number): { num: number; name: string; nameHi: string; lord: PlanetId; pada: number; degInNak: number } {
  const norm = normDeg(longitude);
  const num = Math.floor(norm / NAK_SPAN) + 1;
  const n = NAKSHATRAS[num - 1];
  const degInNak = norm - (num - 1) * NAK_SPAN;
  const pada = Math.floor(degInNak / PADA_SPAN) + 1;
  return { num, name: n.name, nameHi: n.nameHi, lord: n.lord, pada, degInNak };
}

/**
 * Whole-sign house number for a longitude given an Ascendant longitude.
 * Lagna's rashi = house 1; the next rashi = house 2; etc.
 */
export function houseOf(longitude: number, ascLongitude: number): number {
  const lagnaRashi = Math.floor(normDeg(ascLongitude) / 30);
  const planetRashi = Math.floor(normDeg(longitude) / 30);
  return ((planetRashi - lagnaRashi + 12) % 12) + 1;
}
