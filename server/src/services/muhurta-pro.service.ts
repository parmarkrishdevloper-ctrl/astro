// Phase 11 — Muhurta Pro.
//
// Extends the base muhurat finder with:
//   • Classical muhurta yogas (Sarvartha-siddhi, Amrit-siddhi, Ravi,
//     Pushkar, Guru-Pushya, Dwi-Pushkar, Tri-Pushkar) — detected by
//     weekday + nakshatra + tithi patterns
//   • 35+ named event presets (marriage/surgery/signing contracts/…)
//     each with preferred nakshatras, weekdays, tithis, yogas
//   • Chaughadia + Hora calendar — full day or week timeline of 8
//     day-segments + 24 hora-ruler slots per day
//   • Varjyam widget — the ~96-minute inauspicious window that shifts
//     daily with the moon's nakshatra

import { PlanetId, NAKSHATRAS } from '../utils/astro-constants';
import { calculatePanchang } from './panchang.service';

// ─────────────────────────────────────────────────────────────────
// A. Classical muhurta yogas
// ─────────────────────────────────────────────────────────────────

/** Sarvartha-siddhi yoga — weekday + nakshatra pairs where all goals succeed. */
const SARVARTHA_SIDDHI: Record<number, number[]> = {
  0: [1, 8, 12, 13, 19, 21, 26],        // Sunday: Ashwini, Pushya, U.Phal, Hasta, Mula, U.Ashadha, U.Bhadra
  1: [4, 5, 8, 17, 22],                  // Monday: Rohini, Mrigashira, Pushya, Anuradha, Shravana
  2: [1, 12, 14, 17, 19],                // Tuesday: Ashwini, U.Phal, Chitra, Anuradha, Mula
  3: [4, 5, 6, 13, 14, 17],              // Wed: Rohini, Mrigashira, Ardra, Hasta, Chitra, Anuradha
  4: [1, 7, 8, 17, 27],                  // Thursday: Ashwini, Punarvasu, Pushya, Anuradha, Revati
  5: [1, 7, 17, 22, 27],                 // Friday: Ashwini, Punarvasu, Anuradha, Shravana, Revati
  6: [4, 15, 22],                        // Saturday: Rohini, Svati, Shravana
};

/** Amrit-siddhi yoga — single weekday+nak pair per day, strongest. */
const AMRIT_SIDDHI: Record<number, number> = {
  0: 13, 1: 5, 2: 1, 3: 17, 4: 8, 5: 27, 6: 4,
};

/** Ravi yoga — day's nakshatra at 4,6,9,10,13,20 count from birth-day nak. */
const RAVI_OFFSETS = [4, 6, 9, 10, 13, 20];

/** Dwi-Pushkar — specific tithi+weekday+nakshatra triplets doubling results. */
const DWI_PUSHKAR_NAKS = [5, 15, 21];                            // Mrigashira, Svati, U.Ashadha
const DWI_PUSHKAR_TITHIS = [2, 7, 12];                            // Dwitiya, Saptami, Dwadashi
const DWI_PUSHKAR_DAYS = [0, 2, 6];                               // Sun, Tue, Sat

/** Tri-Pushkar — the extreme version: tripled results (good or bad). */
const TRI_PUSHKAR_NAKS = [3, 13, 23];                             // Krittika, Hasta, Dhanishta (purna-nakshatras)
const TRI_PUSHKAR_TITHIS = [2, 7, 12];
const TRI_PUSHKAR_DAYS = [0, 2, 6];

/** Pushkar-navamsa: Sun in specific navamsas of chara rashis — simplified. */
const PUSHKAR_NAV_RASHIS = [1, 4, 7, 10];                          // movable signs

export type MuhurtaYogaName =
  | 'Sarvartha-siddhi' | 'Amrit-siddhi'
  | 'Ravi' | 'Guru-Pushya' | 'Dwi-Pushkar' | 'Tri-Pushkar' | 'Pushkar-navamsa';

export interface MuhurtaYogaHit {
  name: MuhurtaYogaName;
  active: boolean;
  reason: string;
  strength: 'weak' | 'moderate' | 'strong';
}

export function detectMuhurtaYogas(input: {
  weekday: number;
  nakshatra: number;
  tithi: number;
  birthNak?: number;
  sunRashi?: number;
}): MuhurtaYogaHit[] {
  const { weekday, nakshatra, tithi, birthNak, sunRashi } = input;
  const hits: MuhurtaYogaHit[] = [];

  // Sarvartha-siddhi
  const ssNaks = SARVARTHA_SIDDHI[weekday] || [];
  if (ssNaks.includes(nakshatra)) {
    hits.push({
      name: 'Sarvartha-siddhi',
      active: true,
      reason: `${NAKSHATRAS[nakshatra - 1].name} on ${weekdayName(weekday)} — all undertakings succeed`,
      strength: 'strong',
    });
  }

  // Amrit-siddhi (strongest single pair)
  if (AMRIT_SIDDHI[weekday] === nakshatra) {
    hits.push({
      name: 'Amrit-siddhi',
      active: true,
      reason: `${NAKSHATRAS[nakshatra - 1].name} on ${weekdayName(weekday)} — the "immortal success" pair`,
      strength: 'strong',
    });
  }

  // Ravi yoga — needs birthNak to evaluate
  if (birthNak) {
    const diff = ((nakshatra - birthNak + 27) % 27) + 1;
    if (RAVI_OFFSETS.includes(diff)) {
      hits.push({
        name: 'Ravi',
        active: true,
        reason: `Day nakshatra is ${diff}th from birth nak — Ravi yoga (solar vitality)`,
        strength: 'moderate',
      });
    }
  }

  // Guru-Pushya yoga — Thursday + Pushya
  if (weekday === 4 && nakshatra === 8) {
    hits.push({
      name: 'Guru-Pushya',
      active: true,
      reason: 'Thursday + Pushya — the crown of muhurtas for wealth & dharma',
      strength: 'strong',
    });
  }

  // Dwi-Pushkar
  if (DWI_PUSHKAR_NAKS.includes(nakshatra) &&
      DWI_PUSHKAR_TITHIS.includes(tithi) &&
      DWI_PUSHKAR_DAYS.includes(weekday)) {
    hits.push({
      name: 'Dwi-Pushkar',
      active: true,
      reason: 'Weekday × tithi × nakshatra triplet — results double',
      strength: 'strong',
    });
  }

  // Tri-Pushkar
  if (TRI_PUSHKAR_NAKS.includes(nakshatra) &&
      TRI_PUSHKAR_TITHIS.includes(tithi) &&
      TRI_PUSHKAR_DAYS.includes(weekday)) {
    hits.push({
      name: 'Tri-Pushkar',
      active: true,
      reason: 'Triple-power triplet — results triple (watch outcome polarity)',
      strength: 'strong',
    });
  }

  // Pushkar-navamsa (simplified: Sun in movable sign)
  if (sunRashi && PUSHKAR_NAV_RASHIS.includes(sunRashi)) {
    hits.push({
      name: 'Pushkar-navamsa',
      active: true,
      reason: 'Sun in movable sign — simplified Pushkar navamsa quality',
      strength: 'moderate',
    });
  }

  return hits;
}

function weekdayName(n: number): string {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][n] || '';
}

// ─────────────────────────────────────────────────────────────────
// B. Event presets — 35+ named muhurtas
// ─────────────────────────────────────────────────────────────────

export interface PresetSpec {
  key: string;
  label: string;
  category: 'family' | 'dwelling' | 'work' | 'finance' | 'travel' | 'spiritual' | 'medical' | 'other';
  goodNakshatras: number[];
  goodWeekdays: number[];
  goodTithis: number[];
  avoidTithis?: number[];
  requiredYogas?: MuhurtaYogaName[];
  preferredHora?: PlanetId[];
  note: string;
}

export const PRESETS: PresetSpec[] = [
  // ── Family ─────────────────────────────────────────────────
  { key: 'marriage',       label: 'Marriage',                  category: 'family',
    goodNakshatras: [4, 12, 13, 17, 21, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], avoidTithis: [4, 9, 14, 30],
    preferredHora: ['VE', 'JU'],
    note: 'Stura-dina naks + Mon/Wed/Thu/Fri; avoid Rikta tithis.' },
  { key: 'engagement',     label: 'Engagement / Sagai',        category: 'family',
    goodNakshatras: [4, 8, 12, 13, 17, 21, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['VE', 'JU'],
    note: 'Mirror marriage muhurtas with lower tithi restriction.' },
  { key: 'namakaran',      label: 'Namakaran (naming)',        category: 'family',
    goodNakshatras: [1, 4, 5, 7, 8, 12, 13, 17, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [1, 2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'ME', 'VE'],
    note: 'Usually the 11th or 12th day from birth; sunrise hora preferred.' },
  { key: 'annaprashan',    label: 'Annaprashan (first solids)',category: 'family',
    goodNakshatras: [4, 7, 8, 12, 13, 17, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'VE'],
    note: 'Performed at 6 months (boys) / 5 months (girls).' },
  { key: 'karnavedha',     label: 'Karnavedha (ear piercing)', category: 'family',
    goodNakshatras: [5, 8, 13, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [5, 10, 11, 13], preferredHora: ['JU', 'ME'],
    note: 'Odd month from birth preferred.' },
  { key: 'chudakaran',     label: 'Chudakaran (first hair)',   category: 'family',
    goodNakshatras: [8, 13, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'VE'],
    note: 'Usually before age 3.' },
  { key: 'upanayanam',     label: 'Upanayanam (sacred thread)',category: 'family',
    goodNakshatras: [1, 4, 5, 7, 8, 13, 17, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11], preferredHora: ['JU'],
    note: 'Uttarayana preferred, age 8/11/12 per tradition.' },

  // ── Dwelling / vaastu ──────────────────────────────────────
  { key: 'bhoomi-puja',    label: 'Bhoomi Puja',               category: 'dwelling',
    goodNakshatras: [4, 7, 8, 12, 13, 17, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [1, 2, 3, 5, 7, 10, 11, 13], avoidTithis: [4, 8, 9, 14, 30],
    preferredHora: ['JU', 'VE', 'ME'],
    note: 'Stable + soft naks; sunrise-to-noon window ideal.' },
  { key: 'foundation',     label: 'Foundation stone',          category: 'dwelling',
    goodNakshatras: [4, 7, 8, 12, 13, 17, 21, 22, 26, 27], goodWeekdays: [1, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'VE'],
    note: 'Lunar month preference: Margashirsha, Magha, Phalguna.' },
  { key: 'griha-pravesh',  label: 'Griha Pravesh',             category: 'dwelling',
    goodNakshatras: [4, 5, 12, 13, 17, 21, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], avoidTithis: [4, 9, 14, 30],
    preferredHora: ['JU', 'VE', 'ME'], requiredYogas: ['Sarvartha-siddhi'],
    note: 'Avoid Dakshinayana ideally; prefer Uttarayana sun months.' },
  { key: 'construction-start', label: 'Construction start',    category: 'dwelling',
    goodNakshatras: [4, 7, 8, 13, 17, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'VE'],
    note: 'Stable earthly nakshatras for longevity of structure.' },
  { key: 'well-digging',   label: 'Well / borewell digging',   category: 'dwelling',
    goodNakshatras: [6, 9, 20, 21, 22, 24, 25, 26, 27], goodWeekdays: [1, 3, 5, 6],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['MO', 'VE'],
    note: 'Water-element naks; Moon/Venus hora.' },

  // ── Work / business ────────────────────────────────────────
  { key: 'business-open',  label: 'Business opening',          category: 'work',
    goodNakshatras: [3, 7, 12, 13, 21, 22, 23, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'JU'],
    note: 'Labh Chaughadia boost; prefer Mercury/Jupiter hora.' },
  { key: 'shop-open',      label: 'New shop opening',          category: 'work',
    goodNakshatras: [3, 7, 12, 13, 21, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 5, 7, 10, 11, 13], preferredHora: ['ME', 'JU'],
    note: 'Avoid Saturday, prefer Wednesday.' },
  { key: 'office-open',    label: 'New office opening',        category: 'work',
    goodNakshatras: [7, 8, 12, 13, 17, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'ME'],
    note: 'Same as business open with Jupiter emphasis.' },
  { key: 'job-start',      label: 'Starting new job',          category: 'work',
    goodNakshatras: [1, 3, 7, 8, 12, 13, 17, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'ME', 'SU'],
    note: 'Sun hora boosts reputation on first day.' },
  { key: 'contract-signing', label: 'Signing contracts',       category: 'work',
    goodNakshatras: [3, 7, 8, 12, 13, 17, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'JU'],
    note: 'Mercury hora for airtight clauses.' },
  { key: 'interview',      label: 'Interview',                 category: 'work',
    goodNakshatras: [3, 7, 8, 13, 17, 27], goodWeekdays: [1, 3, 4],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'JU'],
    note: 'Shubha/Labh chaughadia strongly recommended.' },

  // ── Education ──────────────────────────────────────────────
  { key: 'vidyarambha',    label: 'Vidyarambha (learning start)', category: 'spiritual',
    goodNakshatras: [5, 8, 13, 17, 22, 27], goodWeekdays: [1, 3, 4],
    goodTithis: [1, 2, 3, 5, 7, 10, 11], preferredHora: ['ME', 'JU'],
    note: 'Vasant Panchami ideal; Saraswati invocation.' },
  { key: 'aksharabhyasam', label: 'Aksharabhyasam (first letter)', category: 'spiritual',
    goodNakshatras: [5, 8, 13, 17, 22, 27], goodWeekdays: [1, 3, 4],
    goodTithis: [5, 10, 11], preferredHora: ['ME', 'JU'],
    note: 'Third year or age 2-5; lagna in water/fire sign.' },
  { key: 'exam-start',     label: 'Starting an examination',   category: 'work',
    goodNakshatras: [3, 5, 8, 13, 17, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'JU'],
    note: 'Mercury hora + Shubha chaughadia.' },

  // ── Travel ─────────────────────────────────────────────────
  { key: 'travel-long',    label: 'Long-distance travel',      category: 'travel',
    goodNakshatras: [1, 5, 7, 13, 14, 15, 22, 24], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'MO', 'JU'],
    note: 'Avoid Disha-shool direction for the day.' },
  { key: 'travel-short',   label: 'Short travel',              category: 'travel',
    goodNakshatras: [1, 4, 5, 7, 13, 14, 15, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'MO'],
    note: 'Any Labh/Amrita chaughadia works.' },
  { key: 'pilgrimage',     label: 'Pilgrimage (Tirtha)',       category: 'spiritual',
    goodNakshatras: [4, 5, 7, 8, 13, 17, 22, 27], goodWeekdays: [1, 4, 5],
    goodTithis: [2, 3, 5, 10, 11, 13, 15], preferredHora: ['JU', 'MO'],
    note: 'Ekadashi or Purnima preferred.' },

  // ── Finance ────────────────────────────────────────────────
  { key: 'vehicle',        label: 'Vehicle purchase',          category: 'finance',
    goodNakshatras: [4, 5, 12, 13, 17, 21, 22, 26], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['VE', 'ME'],
    note: 'Avoid Saturn hora on vehicle registration.' },
  { key: 'property',       label: 'Property purchase',         category: 'finance',
    goodNakshatras: [4, 7, 8, 12, 13, 17, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'VE'],
    note: 'Stable nakshatras (Rohini/Uttaras) preferred.' },
  { key: 'gold-buy',       label: 'Gold / silver purchase',    category: 'finance',
    goodNakshatras: [4, 8, 12, 13, 17, 22, 27], goodWeekdays: [1, 4, 5],
    goodTithis: [3, 5, 10, 11, 13], preferredHora: ['VE', 'JU'],
    note: 'Akshaya Tritiya, Dhanteras are premium days.' },
  { key: 'investment',     label: 'Investment / stocks',       category: 'finance',
    goodNakshatras: [3, 7, 8, 12, 13, 22, 27], goodWeekdays: [1, 3, 4],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'JU'],
    note: 'Labh chaughadia, Mercury hora, Sampat/Mitra tara.' },
  { key: 'loan',           label: 'Loan disbursement',         category: 'finance',
    goodNakshatras: [4, 8, 12, 13, 17, 22, 27], goodWeekdays: [1, 3, 4],
    goodTithis: [2, 3, 5, 7, 10, 11], preferredHora: ['JU', 'ME'],
    note: 'Avoid Saturday, Tuesday, and malefic-dominant horas.' },

  // ── Medical ────────────────────────────────────────────────
  { key: 'surgery',        label: 'Surgery (elective)',        category: 'medical',
    goodNakshatras: [1, 3, 5, 6, 14, 16, 19, 24, 25], goodWeekdays: [2, 3, 6],
    goodTithis: [4, 6, 8, 9, 11, 12, 14], preferredHora: ['MA', 'ME', 'SA'],
    note: 'Mars hora sanctions cutting; waning moon preferred.' },
  { key: 'medicine-start', label: 'Starting medicine',         category: 'medical',
    goodNakshatras: [4, 7, 8, 12, 13, 17, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'ME', 'MO'],
    note: 'Jupiter hora for healing; avoid Mars hora.' },

  // ── Spiritual / religious ──────────────────────────────────
  { key: 'yajna',          label: 'Yajna / Homa',              category: 'spiritual',
    goodNakshatras: [3, 5, 7, 8, 13, 17, 22, 27], goodWeekdays: [0, 1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 12, 13, 15], preferredHora: ['JU', 'SU', 'ME'],
    note: 'Agni-elemental naks especially for fire rituals.' },
  { key: 'mantra-start',   label: 'Starting mantra jap',       category: 'spiritual',
    goodNakshatras: [3, 5, 7, 8, 13, 17, 22, 27], goodWeekdays: [1, 3, 4],
    goodTithis: [2, 5, 7, 10, 11, 13], preferredHora: ['JU', 'ME'],
    note: 'Brahma muhurta (pre-sunrise) is ideal.' },
  { key: 'meditation-start', label: 'Meditation retreat start', category: 'spiritual',
    goodNakshatras: [8, 13, 17, 22, 27], goodWeekdays: [1, 4],
    goodTithis: [5, 10, 11, 15], preferredHora: ['JU', 'MO'],
    note: 'Ekadashi + Monday + Pushya is classical.' },
  { key: 'idol-install',   label: 'Idol installation (pratishtha)', category: 'spiritual',
    goodNakshatras: [5, 7, 8, 13, 17, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 10, 11, 13], preferredHora: ['JU', 'VE'],
    note: 'Divya-naks preferred; Dev guru Jupiter hora.' },
  { key: 'dana',           label: 'Dana (gifting)',            category: 'spiritual',
    goodNakshatras: [5, 7, 8, 13, 17, 22, 26, 27], goodWeekdays: [1, 4, 5],
    goodTithis: [2, 3, 5, 10, 11, 13, 15], preferredHora: ['JU', 'MO'],
    note: 'Purnima, Amavasya, Sankranti are premium days.' },

  // ── Other ─────────────────────────────────────────────────
  { key: 'sowing',         label: 'Agricultural sowing',       category: 'other',
    goodNakshatras: [4, 5, 8, 9, 20, 21, 22, 26], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 10, 11, 13], preferredHora: ['MO', 'VE', 'JU'],
    note: 'Water/earth nakshatras; moon-watered naks boost yield.' },
  { key: 'litigation',     label: 'Filing court case',         category: 'work',
    goodNakshatras: [1, 3, 14, 16, 25], goodWeekdays: [2, 3],
    goodTithis: [4, 6, 9, 11, 14], preferredHora: ['MA', 'ME'],
    note: 'Unusual: use fiery naks, Mars hora for offensive cases.' },
];

// ─────────────────────────────────────────────────────────────────
// C. Chaughadia + Hora calendar
// ─────────────────────────────────────────────────────────────────

const CHAUGHADIA_DAY: Record<number, string[]> = {
  0: ['Udveg','Char','Labh','Amrita','Kaal','Shubha','Rog','Udveg'],
  1: ['Amrita','Kaal','Shubha','Rog','Udveg','Char','Labh','Amrita'],
  2: ['Rog','Udveg','Char','Labh','Amrita','Kaal','Shubha','Rog'],
  3: ['Labh','Amrita','Kaal','Shubha','Rog','Udveg','Char','Labh'],
  4: ['Shubha','Rog','Udveg','Char','Labh','Amrita','Kaal','Shubha'],
  5: ['Char','Labh','Amrita','Kaal','Shubha','Rog','Udveg','Char'],
  6: ['Kaal','Shubha','Rog','Udveg','Char','Labh','Amrita','Kaal'],
};
const CHAUGHADIA_NIGHT: Record<number, string[]> = {
  0: ['Shubha','Amrita','Char','Rog','Kaal','Labh','Udveg','Shubha'],
  1: ['Char','Rog','Kaal','Labh','Udveg','Shubha','Amrita','Char'],
  2: ['Kaal','Labh','Udveg','Shubha','Amrita','Char','Rog','Kaal'],
  3: ['Udveg','Shubha','Amrita','Char','Rog','Kaal','Labh','Udveg'],
  4: ['Amrita','Char','Rog','Kaal','Labh','Udveg','Shubha','Amrita'],
  5: ['Rog','Kaal','Labh','Udveg','Shubha','Amrita','Char','Rog'],
  6: ['Labh','Udveg','Shubha','Amrita','Char','Rog','Kaal','Labh'],
};
const CHAUGHADIA_QUALITY: Record<string, 'good' | 'neutral' | 'bad'> = {
  Amrita: 'good', Shubha: 'good', Labh: 'good',
  Char: 'neutral',
  Rog: 'bad', Kaal: 'bad', Udveg: 'bad',
};

const CHALDEAN_ORDER: PlanetId[] = ['SA','JU','MA','SU','VE','ME','MO'];
const WEEKDAY_LORD_IDX: Record<number, number> = {
  0: 3, 1: 6, 2: 2, 3: 5, 4: 1, 5: 4, 6: 0,
};

function horaRulerAt(hoursSinceSunrise: number, weekday: number): PlanetId {
  const h = ((hoursSinceSunrise % 24) + 24) % 24;
  const idx = Math.floor(h);
  const dayLordIdx = WEEKDAY_LORD_IDX[weekday] ?? 0;
  const pos = (((dayLordIdx + idx * 5) % 7) + 7) % 7;
  return CHALDEAN_ORDER[pos];
}

export interface ChaughadiaSegment {
  start: string;
  end: string;
  label: string;
  quality: 'good' | 'neutral' | 'bad';
  isDay: boolean;
}

export interface HoraSegment {
  start: string;
  end: string;
  ruler: PlanetId;
  isDay: boolean;
}

export interface DayCalendar {
  date: string;
  weekday: string;
  sunrise: string | null;
  sunset: string | null;
  chaughadia: ChaughadiaSegment[];
  hora: HoraSegment[];
  panchangYogas: MuhurtaYogaHit[];
  varjyam: { start: string; end: string } | null;
  amritKaal: { start: string; end: string } | null;
  durMuhurtam: { start: string; end: string }[];
  rahuKaal: { start: string; end: string } | null;
  gulika: { start: string; end: string } | null;
  yamaghanda: { start: string; end: string } | null;
  abhijit: { start: string; end: string } | null;
  summary: {
    tithi: string;
    nakshatra: string;
    yoga: string;
    karana: string;
  };
}

export function buildDayCalendar(dateISO: string, lat: number, lng: number, birthNak?: number): DayCalendar {
  const date = new Date(dateISO);
  const p = calculatePanchang(date, lat, lng);
  const weekdayIdx = new Date(p.sunrise || dateISO).getUTCDay();

  const chaughadia: ChaughadiaSegment[] = [];
  const hora: HoraSegment[] = [];

  if (p.sunrise && p.sunset) {
    const sr = new Date(p.sunrise).getTime();
    const ss = new Date(p.sunset).getTime();
    const dayLen = ss - sr;
    const nightLen = 24 * 3600000 - dayLen;
    const segDay = dayLen / 8;
    const segNight = nightLen / 8;

    // Day Chaughadia (8 segs sunrise→sunset)
    const daySeq = CHAUGHADIA_DAY[weekdayIdx];
    for (let i = 0; i < 8; i++) {
      const s = sr + i * segDay;
      const e = sr + (i + 1) * segDay;
      chaughadia.push({
        start: new Date(s).toISOString(),
        end: new Date(e).toISOString(),
        label: daySeq[i],
        quality: CHAUGHADIA_QUALITY[daySeq[i]],
        isDay: true,
      });
    }
    // Night Chaughadia (8 segs sunset→next sunrise)
    const nightSeq = CHAUGHADIA_NIGHT[weekdayIdx];
    for (let i = 0; i < 8; i++) {
      const s = ss + i * segNight;
      const e = ss + (i + 1) * segNight;
      chaughadia.push({
        start: new Date(s).toISOString(),
        end: new Date(e).toISOString(),
        label: nightSeq[i],
        quality: CHAUGHADIA_QUALITY[nightSeq[i]],
        isDay: false,
      });
    }

    // Hora — 24 hours of 1h each, day/night by sun
    for (let i = 0; i < 24; i++) {
      const s = sr + i * 3600000;
      const e = s + 3600000;
      hora.push({
        start: new Date(s).toISOString(),
        end: new Date(e).toISOString(),
        ruler: horaRulerAt(i, weekdayIdx),
        isDay: (s >= sr && s < ss),
      });
    }
  }

  const panchangYogas = detectMuhurtaYogas({
    weekday: weekdayIdx,
    nakshatra: p.nakshatra.num,
    tithi: p.tithi.num,
    birthNak,
    sunRashi: p.sun.rashiNum,
  });

  return {
    date: new Date(dateISO).toISOString().slice(0, 10),
    weekday: p.vara.name,
    sunrise: p.sunrise,
    sunset: p.sunset,
    chaughadia,
    hora,
    panchangYogas,
    varjyam: p.varjyam,
    amritKaal: p.amritKaal,
    durMuhurtam: p.durMuhurtam,
    rahuKaal: p.rahuKaal,
    gulika: p.gulika,
    yamaghanda: p.yamaghanda,
    abhijit: p.abhijitMuhurat,
    summary: {
      tithi: `${p.tithi.paksha} ${p.tithi.name}`,
      nakshatra: p.nakshatra.name,
      yoga: p.yoga.name,
      karana: p.karana.name,
    },
  };
}

export function buildWeekCalendar(startISO: string, lat: number, lng: number, birthNak?: number): DayCalendar[] {
  const start = new Date(startISO);
  const days: DayCalendar[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    days.push(buildDayCalendar(d.toISOString(), lat, lng, birthNak));
  }
  return days;
}

// ─────────────────────────────────────────────────────────────────
// D. Varjyam widget (dedicated endpoint for side-panel display)
// ─────────────────────────────────────────────────────────────────

export interface VarjyamWindow {
  date: string;
  nakshatra: string;
  varjyam: { start: string; end: string } | null;
  amritKaal: { start: string; end: string } | null;
  rahuKaal: { start: string; end: string } | null;
  note: string;
}

export function buildVarjyamWidget(
  dateISO: string, lat: number, lng: number, days = 7,
): VarjyamWindow[] {
  const out: VarjyamWindow[] = [];
  const start = new Date(dateISO);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const p = calculatePanchang(d, lat, lng);
    out.push({
      date: d.toISOString().slice(0, 10),
      nakshatra: p.nakshatra.name,
      varjyam: p.varjyam,
      amritKaal: p.amritKaal,
      rahuKaal: p.rahuKaal,
      note: p.varjyam
        ? 'Avoid initiating any new action during varjyam. Amrit-kaal (if present) is its opposite — highly auspicious.'
        : 'No active varjyam window today — broadly clear.',
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────
// E. Preset-aware muhurta suggest (thin wrapper)
// ─────────────────────────────────────────────────────────────────

export function findPresetByKey(key: string): PresetSpec | undefined {
  return PRESETS.find((p) => p.key === key);
}

export function listPresets(): { key: string; label: string; category: string; note: string }[] {
  return PRESETS.map((p) => ({ key: p.key, label: p.label, category: p.category, note: p.note }));
}
