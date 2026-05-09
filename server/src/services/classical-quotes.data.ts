// Seed corpus of classical-text quotes indexed by rule conditions.
//
// Five texts: Saravali (Kalyana Varma), Jataka Parijata (Vaidyanatha Dikshita),
// Phaladeepika (Mantreshwara), Uttara Kalamrita (Kalidasa),
// Jataka Bharanam (Dhundiraja). Each quote carries a machine-readable
// `conditions` object that the auto-linker matches against a KundaliResult.
//
// Quote translations are paraphrased for clarity (the underlying shlokas are
// centuries old). A later edit can add full Sanskrit originals to the
// `sanskrit` field without changing the linker.

import { PlanetId } from '../utils/astro-constants';

export type ClassicalSource =
  | 'Saravali' | 'Jataka Parijata' | 'Phaladeepika'
  | 'Uttara Kalamrita' | 'Jataka Bharanam';

export interface QuoteConditions {
  /** Planet(s) the quote is about. Matches if *any* listed planet satisfies the location filters. */
  planet?: PlanetId;
  planets?: PlanetId[];
  /** Planet must be in this house (from lagna). */
  inHouse?: number;
  inHouses?: number[];
  /** Planet must be in this sign (1..12). */
  inSign?: number;
  inSigns?: number[];
  /** Planet is exalted / debilitated / own-sign. */
  exalted?: boolean;
  debilitated?: boolean;
  ownSign?: boolean;
  combust?: boolean;
  retrograde?: boolean;
  /** House lord: `{ lord: 7, inHouse: 6 }` → 7th lord in 6th house. */
  lord?: { of: number; inHouse?: number; inHouses?: number[] };
  /** Two planets conjunct (same house). */
  conjunction?: [PlanetId, PlanetId];
  /** Lagna in this sign. */
  lagnaInSign?: number;
  lagnaInSigns?: number[];
  /** Moon in this nakshatra (1..27). */
  moonNakshatra?: number;
}

export interface ClassicalQuote {
  id: string;
  source: ClassicalSource;
  chapter?: string;
  sanskrit?: string;
  text: string;
  conditions: QuoteConditions;
  tags: string[];
}

export const CLASSICAL_TEXTS: { source: ClassicalSource; author: string; era: string; note: string }[] = [
  { source: 'Saravali',          author: 'Kalyana Varma',        era: '8th c. CE',  note: 'Compendium of planetary effects, house-by-house and yoga-by-yoga.' },
  { source: 'Jataka Parijata',   author: 'Vaidyanatha Dikshita', era: '15th c. CE', note: 'Eighteen-chapter classical on natal results and yogas.' },
  { source: 'Phaladeepika',      author: 'Mantreshwara',         era: '14th c. CE', note: 'Practical results-oriented text; pillar of modern Vedic predictive practice.' },
  { source: 'Uttara Kalamrita',  author: 'Kalidasa',             era: '15th c. CE', note: 'Advanced classical covering sphutas, karakas, and special lagnas.' },
  { source: 'Jataka Bharanam',   author: 'Dhundiraja',           era: '15th c. CE', note: 'Structured presentation of yogas with phalita.' },
];

export const CLASSICAL_QUOTES: ClassicalQuote[] = [
  // ────────── Saravali ──────────
  {
    id: 'sar.sun.01',
    source: 'Saravali', chapter: 'Ch 9 (Surya Phala)',
    text: 'The Sun in the 1st house makes one lean, short-tempered, courageous, and given to wandering; his head may pain in youth.',
    conditions: { planet: 'SU', inHouse: 1 }, tags: ['sun', 'house-1', 'health'],
  },
  {
    id: 'sar.sun.10',
    source: 'Saravali', chapter: 'Ch 9',
    text: 'When the Sun occupies the 10th, one attains royal favour, authority, wealth through one\'s own effort, and lasting reputation.',
    conditions: { planet: 'SU', inHouse: 10 }, tags: ['sun', 'house-10', 'career', 'raja-yoga'],
  },
  {
    id: 'sar.moon.04',
    source: 'Saravali', chapter: 'Ch 10 (Chandra Phala)',
    text: 'The Moon in the 4th gives vehicles, an affectionate mother, a beautiful home, and contentment of the heart.',
    conditions: { planet: 'MO', inHouse: 4 }, tags: ['moon', 'house-4', 'wealth', 'happiness'],
  },
  {
    id: 'sar.mars.exalt',
    source: 'Saravali', chapter: 'Ch 11',
    text: 'Mars exalted gives conquest of foes, distinguished courage, landed estates, and mastery over weapons or command.',
    conditions: { planet: 'MA', exalted: true }, tags: ['mars', 'exaltation', 'career'],
  },
  {
    id: 'sar.mercury.01',
    source: 'Saravali', chapter: 'Ch 12',
    text: 'Mercury in lagna makes one learned, witty, long-lived, and skilled in speech and writing.',
    conditions: { planet: 'ME', inHouse: 1 }, tags: ['mercury', 'house-1', 'intellect'],
  },
  {
    id: 'sar.jupiter.05',
    source: 'Saravali', chapter: 'Ch 13',
    text: 'Jupiter in the 5th grants excellent children, devotion to mantra and scripture, and success in knowledge-work.',
    conditions: { planet: 'JU', inHouse: 5 }, tags: ['jupiter', 'house-5', 'children', 'knowledge'],
  },
  {
    id: 'sar.venus.07',
    source: 'Saravali', chapter: 'Ch 14',
    text: 'Venus in the 7th gives a charming and devoted spouse, pleasures of the senses, and comforts in love.',
    conditions: { planet: 'VE', inHouse: 7 }, tags: ['venus', 'house-7', 'marriage', 'pleasures'],
  },
  {
    id: 'sar.saturn.03',
    source: 'Saravali', chapter: 'Ch 15',
    text: 'Saturn in the 3rd gives enduring valour, wealth through effort, disciplined siblings, and long-distance ventures.',
    conditions: { planet: 'SA', inHouse: 3 }, tags: ['saturn', 'house-3', 'siblings', 'effort'],
  },

  // ────────── Jataka Parijata ──────────
  {
    id: 'jp.lagna.lord.10',
    source: 'Jataka Parijata', chapter: 'Ch 7',
    text: 'When the lord of the lagna occupies the 10th house, the native rises through his own merit and earns a name that endures.',
    conditions: { lord: { of: 1, inHouse: 10 } }, tags: ['lagna-lord', 'career', 'raja-yoga'],
  },
  {
    id: 'jp.9.lord.10',
    source: 'Jataka Parijata', chapter: 'Ch 8 (yoga)',
    text: 'The 9th lord in the 10th forms Dharma-Karma-Adhipati yoga, giving a principled profession and government favour.',
    conditions: { lord: { of: 9, inHouse: 10 } }, tags: ['yoga', 'career', 'fortune'],
  },
  {
    id: 'jp.jupiter.lagna',
    source: 'Jataka Parijata', chapter: 'Ch 9',
    text: 'Jupiter in the lagna confers longevity, good conduct, intellect, scriptural learning, and the respect of elders.',
    conditions: { planet: 'JU', inHouse: 1 }, tags: ['jupiter', 'house-1', 'longevity', 'wisdom'],
  },
  {
    id: 'jp.moon.waxing.lagna',
    source: 'Jataka Parijata', chapter: 'Ch 9',
    text: 'The Moon in the lagna, strong in paksha-bala, gives a handsome form, emotional steadiness, and maternal blessings.',
    conditions: { planet: 'MO', inHouse: 1 }, tags: ['moon', 'house-1', 'form'],
  },
  {
    id: 'jp.saturn.debil',
    source: 'Jataka Parijata', chapter: 'Ch 9',
    text: 'Saturn debilitated in Aries makes the native obstinate, wandering, and quarrelsome unless a raja-yoga repairs the damage.',
    conditions: { planet: 'SA', debilitated: true }, tags: ['saturn', 'debilitation'],
  },
  {
    id: 'jp.venus.02',
    source: 'Jataka Parijata', chapter: 'Ch 9',
    text: 'Venus in the 2nd gives speech full of sweetness, wealth accumulated steadily, and facial beauty.',
    conditions: { planet: 'VE', inHouse: 2 }, tags: ['venus', 'house-2', 'wealth', 'speech'],
  },
  {
    id: 'jp.mars.07',
    source: 'Jataka Parijata', chapter: 'Ch 9',
    text: 'Mars in the 7th (without benefic aspect) becomes Kuja dosha — harsh temper in marriage, loss of spouse, repeated disputes.',
    conditions: { planet: 'MA', inHouse: 7 }, tags: ['mars', 'house-7', 'kuja-dosha', 'marriage'],
  },

  // ────────── Phaladeepika ──────────
  {
    id: 'phd.sun.exalt',
    source: 'Phaladeepika', chapter: 'Ch 6',
    text: 'The Sun in exaltation grants a strong constitution, royal favour, father\'s prosperity, and eminence among peers.',
    conditions: { planet: 'SU', exalted: true }, tags: ['sun', 'exaltation', 'father', 'status'],
  },
  {
    id: 'phd.moon.debil',
    source: 'Phaladeepika', chapter: 'Ch 6',
    text: 'The Moon in Scorpio (debilitation) brings mental anxiety, early struggles with the mother, and emotional volatility.',
    conditions: { planet: 'MO', debilitated: true }, tags: ['moon', 'debilitation', 'mother', 'mind'],
  },
  {
    id: 'phd.mercury.retro',
    source: 'Phaladeepika', chapter: 'Ch 7',
    text: 'Mercury retrograde bestows uncommon intellect but indirect speech; the native reconsiders before acting.',
    conditions: { planet: 'ME', retrograde: true }, tags: ['mercury', 'retrograde', 'intellect'],
  },
  {
    id: 'phd.jupiter.02',
    source: 'Phaladeepika', chapter: 'Ch 6',
    text: 'Jupiter in the 2nd gives wealth through honorable means, scholarly family, and speech that persuades.',
    conditions: { planet: 'JU', inHouse: 2 }, tags: ['jupiter', 'house-2', 'wealth', 'family'],
  },
  {
    id: 'phd.combust.sun',
    source: 'Phaladeepika', chapter: 'Ch 8',
    text: 'A planet combust by the Sun loses its power to deliver — the native puts forth effort, but the fruit is delayed.',
    conditions: { planets: ['MO','MA','ME','JU','VE','SA'], combust: true }, tags: ['combust', 'affliction'],
  },
  {
    id: 'phd.7.lord.6',
    source: 'Phaladeepika', chapter: 'Ch 15',
    text: 'The 7th lord in the 6th brings disputes in marriage, delay, or a spouse from a professional background.',
    conditions: { lord: { of: 7, inHouse: 6 } }, tags: ['7th-lord', 'marriage', 'disputes'],
  },

  // ────────── Uttara Kalamrita ──────────
  {
    id: 'uk.atmakaraka',
    source: 'Uttara Kalamrita', chapter: 'Ch 4',
    text: 'The planet of greatest longitude — the Atmakaraka — rules the soul\'s primary desires; its house and sign colour the whole life.',
    conditions: {}, tags: ['atmakaraka', 'jaimini'],
  },
  {
    id: 'uk.venus.5',
    source: 'Uttara Kalamrita', chapter: 'Ch 6',
    text: 'Venus in the 5th from lagna or Arudha brings fame in the arts, skill in poetry, and a charming first child.',
    conditions: { planet: 'VE', inHouse: 5 }, tags: ['venus', 'house-5', 'arts'],
  },
  {
    id: 'uk.rahu.lagna',
    source: 'Uttara Kalamrita', chapter: 'Ch 13',
    text: 'Rahu in the lagna causes the native to break convention — early rebellion, unusual appearance, appetite for foreign ideas.',
    conditions: { planet: 'RA', inHouse: 1 }, tags: ['rahu', 'house-1', 'unconventional'],
  },
  {
    id: 'uk.ketu.12',
    source: 'Uttara Kalamrita', chapter: 'Ch 13',
    text: 'Ketu in the 12th, without malefic affliction, gives spiritual insight, travel to distant lands, and detachment at the end of life.',
    conditions: { planet: 'KE', inHouse: 12 }, tags: ['ketu', 'house-12', 'moksha'],
  },
  {
    id: 'uk.saturn.07',
    source: 'Uttara Kalamrita', chapter: 'Ch 8',
    text: 'Saturn in the 7th delays marriage but gives a serious, enduring partnership once it finally arrives.',
    conditions: { planet: 'SA', inHouse: 7 }, tags: ['saturn', 'house-7', 'marriage', 'delay'],
  },

  // ────────── Jataka Bharanam ──────────
  {
    id: 'jb.guru.mangala',
    source: 'Jataka Bharanam', chapter: 'Ch 5 (yoga)',
    text: 'Jupiter with Mars in any house forms Guru-Mangala yoga — righteous courage, success in law, good teachers, and protection of dharma.',
    conditions: { conjunction: ['JU', 'MA'] }, tags: ['yoga', 'jupiter', 'mars', 'dharma'],
  },
  {
    id: 'jb.chandra.mangala',
    source: 'Jataka Bharanam', chapter: 'Ch 5',
    text: 'The Moon conjunct Mars (Chandra-Mangala yoga) gives wealth through real estate, trade, or mother-side inheritance — sometimes with emotional volatility.',
    conditions: { conjunction: ['MO', 'MA'] }, tags: ['yoga', 'moon', 'mars', 'wealth'],
  },
  {
    id: 'jb.budha.aditya',
    source: 'Jataka Bharanam', chapter: 'Ch 5',
    text: 'Mercury with the Sun forms Budhaditya yoga — sharp intellect, administrative skill, and recognition for one\'s writing or speech.',
    conditions: { conjunction: ['SU', 'ME'] }, tags: ['yoga', 'sun', 'mercury', 'intellect'],
  },
  {
    id: 'jb.gajakesari',
    source: 'Jataka Bharanam', chapter: 'Ch 5',
    text: 'Jupiter in a kendra from the Moon (Gaja-Kesari yoga) grants confident speech, respect in assemblies, and a commanding presence.',
    conditions: { planets: ['JU'], inHouses: [1,4,7,10] }, tags: ['yoga', 'jupiter', 'moon', 'fame'],
  },
  {
    id: 'jb.kemadruma',
    source: 'Jataka Bharanam', chapter: 'Ch 5',
    text: 'If no planet (other than the Sun or nodes) occupies the 2nd or 12th from the Moon, Kemadruma yoga is said to form — poverty and loneliness unless countered.',
    conditions: { planet: 'MO' }, tags: ['yoga', 'moon', 'affliction'],
  },
  {
    id: 'jb.panch.mahapurush.mars',
    source: 'Jataka Bharanam', chapter: 'Ch 5',
    text: 'Mars in own sign or exaltation in a kendra from the lagna forms Ruchaka Mahapurusha yoga — military or athletic distinction, commanding presence, landed wealth.',
    conditions: { planet: 'MA', inHouses: [1,4,7,10], ownSign: true },
    tags: ['yoga', 'mars', 'mahapurush'],
  },
];
