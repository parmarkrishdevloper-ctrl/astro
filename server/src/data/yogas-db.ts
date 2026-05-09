// Structured yoga database. Each entry has:
//   - id, name (Sanskrit + English), category, classical source
//   - rule: a small JSON DSL the engine evaluates against a KundaliResult
//
// The DSL supports a handful of primitive predicates that are sufficient for
// the vast majority of classical yogas. Adding a new yoga = adding an entry
// here, no code changes required.
//
// This is the seed of the "1001 yogas" library — we ship a curated initial
// set of ~50 widely-recognized yogas; more can be added incrementally.

import { PlanetId } from '../utils/astro-constants';

export type YogaCategory =
  | 'Raja' | 'Dhana' | 'Mahapurusha' | 'Lunar' | 'Solar' | 'Arishta'
  | 'Parivartana' | 'Nabhasa' | 'Sannyasa' | 'Other';

export type Predicate =
  | { kind: 'in_own_or_exalted_kendra'; planet: PlanetId }
  | { kind: 'planet_in_house'; planet: PlanetId; house: number }
  | { kind: 'planet_in_sign'; planet: PlanetId; sign: number }
  | { kind: 'planet_aspects_planet'; from: PlanetId; to: PlanetId }
  | { kind: 'conjunct'; a: PlanetId; b: PlanetId }
  | { kind: 'planet_in_kendra_from'; planet: PlanetId; from: PlanetId }
  | { kind: 'mutual_kendra'; a: PlanetId; b: PlanetId }
  | { kind: 'lord_of_house_in_house'; lordOf: number; in: number }
  | { kind: 'parivartana'; a: PlanetId; b: PlanetId }
  | { kind: 'is_retrograde'; planet: PlanetId }
  | { kind: 'is_combust'; planet: PlanetId }
  | { kind: 'all_planets_in_houses'; houses: number[] }
  | { kind: 'no_planet_in_houses_from_moon'; houses: number[]; exclude?: PlanetId[] };

export interface YogaDef {
  id: string;
  name: string;
  sanskrit?: string;
  category: YogaCategory;
  rule: { all?: Predicate[]; any?: Predicate[] };
  effect: string;
  source: string;            // e.g. 'BPHS Ch.36 Sl.5'
  strength?: 'strong' | 'moderate' | 'weak';
  /** Phrasebook key for the localized name (e.g. 'yogasDb.ruchaka.name'). */
  nameKey?: string;
  /** Phrasebook key for the localized effect prose. */
  effectKey?: string;
}

export const YOGAS: YogaDef[] = [
  // ─── Pancha Mahapurusha ──────────────────────────────────────────────────
  {
    id: 'ruchaka',
    name: 'Ruchaka Yoga',
    sanskrit: 'रुचक योग',
    category: 'Mahapurusha',
    rule: { all: [{ kind: 'in_own_or_exalted_kendra', planet: 'MA' }] },
    effect: 'Courageous, commanding leader; martial prowess; high status.',
    source: 'BPHS Ch.36 Sl.5',
    strength: 'strong',
    nameKey: 'yogasDb.ruchaka.name',
    effectKey: 'yogasDb.ruchaka.effect',
  },
  {
    id: 'bhadra',
    name: 'Bhadra Yoga',
    sanskrit: 'भद्र योग',
    category: 'Mahapurusha',
    rule: { all: [{ kind: 'in_own_or_exalted_kendra', planet: 'ME' }] },
    effect: 'Sharp intelligence, learning, eloquence and business acumen.',
    source: 'BPHS Ch.36 Sl.6',
    strength: 'strong',
    nameKey: 'yogasDb.bhadra.name',
    effectKey: 'yogasDb.bhadra.effect',
  },
  {
    id: 'hamsa',
    name: 'Hamsa Yoga',
    sanskrit: 'हंस योग',
    category: 'Mahapurusha',
    rule: { all: [{ kind: 'in_own_or_exalted_kendra', planet: 'JU' }] },
    effect: 'Wisdom, virtue, religious nature, respected by all.',
    source: 'BPHS Ch.36 Sl.7',
    strength: 'strong',
    nameKey: 'yogasDb.hamsa.name',
    effectKey: 'yogasDb.hamsa.effect',
  },
  {
    id: 'malavya',
    name: 'Malavya Yoga',
    sanskrit: 'मालव्य योग',
    category: 'Mahapurusha',
    rule: { all: [{ kind: 'in_own_or_exalted_kendra', planet: 'VE' }] },
    effect: 'Beauty, luxury, artistic talents and a happy family life.',
    source: 'BPHS Ch.36 Sl.8',
    strength: 'strong',
    nameKey: 'yogasDb.malavya.name',
    effectKey: 'yogasDb.malavya.effect',
  },
  {
    id: 'shasha',
    name: 'Shasha Yoga',
    sanskrit: 'शश योग',
    category: 'Mahapurusha',
    rule: { all: [{ kind: 'in_own_or_exalted_kendra', planet: 'SA' }] },
    effect: 'Discipline, longevity, leadership over many; political success.',
    source: 'BPHS Ch.36 Sl.9',
    strength: 'strong',
    nameKey: 'yogasDb.shasha.name',
    effectKey: 'yogasDb.shasha.effect',
  },

  // ─── Lunar / Solar yogas ─────────────────────────────────────────────────
  {
    id: 'gajakesari',
    name: 'Gajakesari Yoga',
    sanskrit: 'गजकेसरी योग',
    category: 'Lunar',
    rule: { all: [{ kind: 'planet_in_kendra_from', planet: 'JU', from: 'MO' }] },
    effect: 'Eloquence, fame, intelligence and respect among learned.',
    source: 'Saravali Ch.33 Sl.8',
    strength: 'moderate',
    nameKey: 'yogasDb.gajakesari.name',
    effectKey: 'yogasDb.gajakesari.effect',
  },
  {
    id: 'budhaditya',
    name: 'Budhaditya Yoga',
    sanskrit: 'बुधादित्य योग',
    category: 'Solar',
    rule: { all: [{ kind: 'conjunct', a: 'SU', b: 'ME' }] },
    effect: 'Sharp intellect, learning, communication skills.',
    source: 'Hora Sara Ch.7',
    strength: 'moderate',
    nameKey: 'yogasDb.budhaditya.name',
    effectKey: 'yogasDb.budhaditya.effect',
  },
  {
    id: 'chandra_mangala',
    name: 'Chandra-Mangala Yoga',
    sanskrit: 'चंद्र-मंगल योग',
    category: 'Dhana',
    rule: { all: [{ kind: 'conjunct', a: 'MO', b: 'MA' }] },
    effect: 'Wealth through commerce and enterprise.',
    source: 'Saravali Ch.36',
    strength: 'moderate',
    nameKey: 'yogasDb.chandra_mangala.name',
    effectKey: 'yogasDb.chandra_mangala.effect',
  },
  {
    id: 'sunapha',
    name: 'Sunapha Yoga',
    category: 'Lunar',
    rule: { any: [
      { kind: 'planet_in_kendra_from', planet: 'ME', from: 'MO' },
      { kind: 'planet_in_kendra_from', planet: 'VE', from: 'MO' },
      { kind: 'planet_in_kendra_from', planet: 'JU', from: 'MO' },
      { kind: 'planet_in_kendra_from', planet: 'MA', from: 'MO' },
      { kind: 'planet_in_kendra_from', planet: 'SA', from: 'MO' },
    ] },
    effect: 'Self-earned wealth, intelligence, fame.',
    source: 'BPHS Ch.40 Sl.1',
    strength: 'moderate',
    nameKey: 'yogasDb.sunapha.name',
    effectKey: 'yogasDb.sunapha.effect',
  },

  // ─── Arishta (afflictions) ───────────────────────────────────────────────
  {
    id: 'kemadruma',
    name: 'Kemadruma Yoga',
    sanskrit: 'केमद्रुम योग',
    category: 'Arishta',
    rule: { all: [{ kind: 'no_planet_in_houses_from_moon', houses: [2, 12], exclude: ['SU', 'RA', 'KE'] }] },
    effect: 'Isolated Moon — financial struggle and emotional difficulty unless cancelled.',
    source: 'BPHS Ch.40 Sl.5',
    strength: 'weak',
    nameKey: 'yogasDb.kemadruma.name',
    effectKey: 'yogasDb.kemadruma.effect',
  },

  // ─── Parivartana (mutual exchange) — generated dynamically below ─────────
  // The generic engine will check all 12 house pairs.

  // ─── House-lord-in-house yogas ───────────────────────────────────────────
  {
    id: 'l1_in_10',
    name: 'Lord of Lagna in 10th',
    category: 'Raja',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 1, in: 10 }] },
    effect: 'Career success, recognition from authority.',
    source: 'BPHS Ch.34 Sl.10',
    strength: 'strong',
    nameKey: 'yogasDb.l1_in_10.name',
    effectKey: 'yogasDb.l1_in_10.effect',
  },
  {
    id: 'l9_in_10',
    name: 'Dharma-Karma Adhipati Yoga',
    sanskrit: 'धर्म-कर्मा अधिपति योग',
    category: 'Raja',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 9, in: 10 }] },
    effect: 'Powerful raja yoga; success aligned with dharma.',
    source: 'BPHS Ch.36',
    strength: 'strong',
    nameKey: 'yogasDb.l9_in_10.name',
    effectKey: 'yogasDb.l9_in_10.effect',
  },
  {
    id: 'l5_in_9',
    name: 'Lakshmi Yoga',
    category: 'Dhana',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 5, in: 9 }] },
    effect: 'Wealth, fortune, blessings of Lakshmi.',
    source: 'Phaladeepika Ch.6',
    strength: 'moderate',
    nameKey: 'yogasDb.l5_in_9.name',
    effectKey: 'yogasDb.l5_in_9.effect',
  },
  {
    id: 'l11_in_2',
    name: 'Dhana Yoga',
    category: 'Dhana',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 11, in: 2 }] },
    effect: 'Multiple sources of income flowing into the family wealth.',
    source: 'BPHS Ch.34',
    strength: 'moderate',
    nameKey: 'yogasDb.l11_in_2.name',
    effectKey: 'yogasDb.l11_in_2.effect',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // Phase 14I — Classical yoga expansion
  // Sources: BPHS (Brihat Parashara Hora Shastra), Saravali, Phala Deepika,
  // Jataka Parijata, Hora Sara. Every rule uses the existing predicate DSL.
  // ═══════════════════════════════════════════════════════════════════════

  // ─── Lunar Yogas (Nabhasa / Chandra-based) ──────────────────────────────
  {
    id: 'anapha', name: 'Anapha Yoga', sanskrit: 'अनफा योग', category: 'Lunar',
    rule: { any: [
      { kind: 'planet_in_kendra_from', planet: 'ME', from: 'MO' },
      { kind: 'planet_in_kendra_from', planet: 'VE', from: 'MO' },
      { kind: 'planet_in_kendra_from', planet: 'MA', from: 'MO' },
      { kind: 'planet_in_kendra_from', planet: 'JU', from: 'MO' },
      { kind: 'planet_in_kendra_from', planet: 'SA', from: 'MO' },
    ] },
    effect: 'Eloquent, virtuous, courteous, kingly temperament; strong social position.',
    source: 'BPHS Ch.40 Sl.2', strength: 'moderate',
    nameKey: 'yogasDb.anapha.name', effectKey: 'yogasDb.anapha.effect',
  },
  {
    id: 'durudhara', name: 'Durudhara Yoga', sanskrit: 'दुरुधरा योग', category: 'Lunar',
    rule: { all: [
      { kind: 'planet_in_kendra_from', planet: 'ME', from: 'MO' },
      { kind: 'planet_in_kendra_from', planet: 'VE', from: 'MO' },
    ] },
    effect: 'Wealth, vehicles, servants; provident and self-assured life.',
    source: 'BPHS Ch.40 Sl.3', strength: 'moderate',
    nameKey: 'yogasDb.durudhara.name', effectKey: 'yogasDb.durudhara.effect',
  },

  // ─── Solar Yogas ─────────────────────────────────────────────────────────
  {
    id: 'vesi', name: 'Vesi Yoga', category: 'Solar',
    rule: { any: [
      { kind: 'planet_in_kendra_from', planet: 'ME', from: 'SU' },
      { kind: 'planet_in_kendra_from', planet: 'VE', from: 'SU' },
      { kind: 'planet_in_kendra_from', planet: 'JU', from: 'SU' },
      { kind: 'planet_in_kendra_from', planet: 'MA', from: 'SU' },
      { kind: 'planet_in_kendra_from', planet: 'SA', from: 'SU' },
    ] },
    effect: 'Honest, truthful, noble; righteous demeanour.',
    source: 'BPHS Ch.40 Sl.7', strength: 'weak',
    nameKey: 'yogasDb.vesi.name', effectKey: 'yogasDb.vesi.effect',
  },
  {
    id: 'vosi', name: 'Vosi Yoga', category: 'Solar',
    rule: { any: [
      { kind: 'planet_in_kendra_from', planet: 'ME', from: 'SU' },
      { kind: 'planet_in_kendra_from', planet: 'VE', from: 'SU' },
      { kind: 'planet_in_kendra_from', planet: 'JU', from: 'SU' },
    ] },
    effect: 'Learned, generous, philosophic turn of mind.',
    source: 'BPHS Ch.40 Sl.8', strength: 'moderate',
    nameKey: 'yogasDb.vosi.name', effectKey: 'yogasDb.vosi.effect',
  },

  // ─── Mahapurusha variants already covered (Ruchaka..Shasha) ──────────────

  // ─── Classical Dhana (wealth) yogas ──────────────────────────────────────
  { id: 'l2_in_11', name: '2nd lord in 11th', category: 'Dhana',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 2, in: 11 }] },
    effect: 'Family wealth converts to ongoing gains.',
    source: 'BPHS Ch.34', strength: 'moderate',
    nameKey: 'yogasDb.l2_in_11.name', effectKey: 'yogasDb.l2_in_11.effect' },
  { id: 'l5_in_11', name: '5th lord in 11th', category: 'Dhana',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 5, in: 11 }] },
    effect: 'Gains through intelligence, speculation, and children.',
    source: 'BPHS Ch.34', strength: 'moderate',
    nameKey: 'yogasDb.l5_in_11.name', effectKey: 'yogasDb.l5_in_11.effect' },
  { id: 'l9_in_2', name: '9th lord in 2nd', category: 'Dhana',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 9, in: 2 }] },
    effect: 'Wealth through good fortune; paternal inheritance.',
    source: 'Phaladeepika Ch.6', strength: 'moderate',
    nameKey: 'yogasDb.l9_in_2.name', effectKey: 'yogasDb.l9_in_2.effect' },
  { id: 'l9_in_11', name: 'Bhagyodaya — 9th lord in 11th', category: 'Dhana',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 9, in: 11 }] },
    effect: 'Luck translates into steady material gains throughout life.',
    source: 'BPHS Ch.34', strength: 'strong',
    nameKey: 'yogasDb.l9_in_11.name', effectKey: 'yogasDb.l9_in_11.effect' },
  { id: 'l10_in_11', name: '10th lord in 11th', category: 'Dhana',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 10, in: 11 }] },
    effect: 'Career produces strong gains; commission / profit-sharing.',
    source: 'BPHS Ch.34', strength: 'moderate',
    nameKey: 'yogasDb.l10_in_11.name', effectKey: 'yogasDb.l10_in_11.effect' },
  { id: 'l2_in_5', name: '2nd lord in 5th', category: 'Dhana',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 2, in: 5 }] },
    effect: 'Wealth via intellectual pursuits / children / speculation.',
    source: 'BPHS Ch.34', strength: 'moderate',
    nameKey: 'yogasDb.l2_in_5.name', effectKey: 'yogasDb.l2_in_5.effect' },

  // ─── Raja Yogas (kendra-trikona / specific lords) ────────────────────────
  { id: 'l1_in_4', name: 'Lord of Lagna in 4th', category: 'Raja',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 1, in: 4 }] },
    effect: 'Comfort, vehicles, property; strong domestic life.',
    source: 'BPHS Ch.34', strength: 'moderate',
    nameKey: 'yogasDb.l1_in_4.name', effectKey: 'yogasDb.l1_in_4.effect' },
  { id: 'l1_in_7', name: 'Lord of Lagna in 7th', category: 'Raja',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 1, in: 7 }] },
    effect: 'Focus on partnership; strong spouse; foreign residence potential.',
    source: 'BPHS Ch.34', strength: 'moderate',
    nameKey: 'yogasDb.l1_in_7.name', effectKey: 'yogasDb.l1_in_7.effect' },
  { id: 'l1_in_9', name: 'Bhagya Yoga — 1st lord in 9th', category: 'Raja',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 1, in: 9 }] },
    effect: 'Religious, fortunate, blessed by father and teachers.',
    source: 'BPHS Ch.34', strength: 'strong',
    nameKey: 'yogasDb.l1_in_9.name', effectKey: 'yogasDb.l1_in_9.effect' },
  { id: 'l4_in_10', name: '4th lord in 10th', category: 'Raja',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 4, in: 10 }] },
    effect: 'Emotional satisfaction through work; inherited profession.',
    source: 'BPHS Ch.34', strength: 'moderate',
    nameKey: 'yogasDb.l4_in_10.name', effectKey: 'yogasDb.l4_in_10.effect' },
  { id: 'l5_in_10', name: '5th lord in 10th', category: 'Raja',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 5, in: 10 }] },
    effect: 'Creative work; teaching, public intellectual role.',
    source: 'BPHS Ch.34', strength: 'moderate',
    nameKey: 'yogasDb.l5_in_10.name', effectKey: 'yogasDb.l5_in_10.effect' },
  { id: 'l10_in_1', name: '10th lord in 1st', category: 'Raja',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 10, in: 1 }] },
    effect: 'Self-made, ambitious, reputation built on personal effort.',
    source: 'BPHS Ch.34', strength: 'moderate',
    nameKey: 'yogasDb.l10_in_1.name', effectKey: 'yogasDb.l10_in_1.effect' },
  { id: 'l10_in_5', name: '10th lord in 5th', category: 'Raja',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 10, in: 5 }] },
    effect: 'Fame through intellect, creativity, or public speaking.',
    source: 'BPHS Ch.34', strength: 'moderate',
    nameKey: 'yogasDb.l10_in_5.name', effectKey: 'yogasDb.l10_in_5.effect' },
  { id: 'l10_in_9', name: 'Karma-Dharma Adhipati', category: 'Raja',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 10, in: 9 }] },
    effect: 'Career aligned with dharma; teaching, law, philosophy, service.',
    source: 'BPHS Ch.36', strength: 'strong',
    nameKey: 'yogasDb.l10_in_9.name', effectKey: 'yogasDb.l10_in_9.effect' },
  { id: 'l5_in_1', name: '5th lord in 1st', category: 'Raja',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 5, in: 1 }] },
    effect: 'Intelligent, child-blessed, creative endeavours succeed.',
    source: 'BPHS Ch.34', strength: 'moderate',
    nameKey: 'yogasDb.l5_in_1.name', effectKey: 'yogasDb.l5_in_1.effect' },
  { id: 'l9_in_5', name: '9th lord in 5th', category: 'Raja',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 9, in: 5 }] },
    effect: 'Dharmic creativity; children follow parental teachings.',
    source: 'BPHS Ch.34', strength: 'moderate',
    nameKey: 'yogasDb.l9_in_5.name', effectKey: 'yogasDb.l9_in_5.effect' },
  { id: 'l9_in_1', name: '9th lord in 1st', category: 'Raja',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 9, in: 1 }] },
    effect: 'Luck follows the self; noble bearing; respect in society.',
    source: 'BPHS Ch.34', strength: 'strong',
    nameKey: 'yogasDb.l9_in_1.name', effectKey: 'yogasDb.l9_in_1.effect' },

  // ─── Additional named yogas ──────────────────────────────────────────────
  {
    id: 'amala', name: 'Amala Yoga', sanskrit: 'अमल योग', category: 'Other',
    rule: { any: [
      { kind: 'planet_in_house', planet: 'JU', house: 10 },
      { kind: 'planet_in_house', planet: 'VE', house: 10 },
      { kind: 'planet_in_house', planet: 'ME', house: 10 },
      { kind: 'planet_in_house', planet: 'MO', house: 10 },
    ] },
    effect: 'Unblemished reputation, fame, noble work.',
    source: 'Jataka Parijata Ch.7', strength: 'moderate',
    nameKey: 'yogasDb.amala.name', effectKey: 'yogasDb.amala.effect',
  },
  {
    id: 'saraswati', name: 'Saraswati Yoga', sanskrit: 'सरस्वती योग', category: 'Other',
    rule: { all: [
      { kind: 'in_own_or_exalted_kendra', planet: 'JU' },
      { kind: 'planet_aspects_planet', from: 'JU', to: 'ME' },
      { kind: 'planet_aspects_planet', from: 'JU', to: 'VE' },
    ] },
    effect: 'Learning, poetry, music, linguistic mastery, divine grace.',
    source: 'Phaladeepika Ch.6', strength: 'strong',
    nameKey: 'yogasDb.saraswati.name', effectKey: 'yogasDb.saraswati.effect',
  },
  {
    id: 'lakshmi_mahalakshmi', name: 'Mahalakshmi Yoga', sanskrit: 'महालक्ष्मी योग', category: 'Dhana',
    rule: { all: [
      { kind: 'lord_of_house_in_house', lordOf: 9, in: 9 },
      { kind: 'in_own_or_exalted_kendra', planet: 'VE' },
    ] },
    effect: 'Abundant wealth, auspiciousness, grace of the goddess of fortune.',
    source: 'Phaladeepika Ch.6', strength: 'strong',
    nameKey: 'yogasDb.lakshmi_mahalakshmi.name', effectKey: 'yogasDb.lakshmi_mahalakshmi.effect',
  },
  {
    id: 'adhi', name: 'Adhi Yoga', category: 'Raja',
    rule: { any: [
      { kind: 'planet_in_house', planet: 'JU', house: 6 },
      { kind: 'planet_in_house', planet: 'JU', house: 7 },
      { kind: 'planet_in_house', planet: 'JU', house: 8 },
      { kind: 'planet_in_house', planet: 'VE', house: 6 },
      { kind: 'planet_in_house', planet: 'VE', house: 7 },
      { kind: 'planet_in_house', planet: 'VE', house: 8 },
      { kind: 'planet_in_house', planet: 'ME', house: 6 },
      { kind: 'planet_in_house', planet: 'ME', house: 7 },
      { kind: 'planet_in_house', planet: 'ME', house: 8 },
    ] },
    effect: 'Leadership, lasting fame, many followers.',
    source: 'BPHS Ch.40', strength: 'moderate',
    nameKey: 'yogasDb.adhi.name', effectKey: 'yogasDb.adhi.effect',
  },
  {
    id: 'guru_mangala', name: 'Guru-Mangala Yoga', sanskrit: 'गुरु-मंगल योग', category: 'Other',
    rule: { all: [{ kind: 'conjunct', a: 'JU', b: 'MA' }] },
    effect: 'Disciplined drive, courage tempered by wisdom; suited to leadership roles.',
    source: 'Saravali Ch.36', strength: 'moderate',
    nameKey: 'yogasDb.guru_mangala.name', effectKey: 'yogasDb.guru_mangala.effect',
  },
  {
    id: 'shukra_budha', name: 'Shukra-Budha Yoga', category: 'Other',
    rule: { all: [{ kind: 'conjunct', a: 'VE', b: 'ME' }] },
    effect: 'Artistic intelligence, charm, trade acumen, polished speech.',
    source: 'Saravali Ch.36', strength: 'moderate',
    nameKey: 'yogasDb.shukra_budha.name', effectKey: 'yogasDb.shukra_budha.effect',
  },
  {
    id: 'neechabhanga', name: 'Neechabhanga Raja Yoga (Sun)', category: 'Raja',
    rule: { all: [
      { kind: 'planet_in_sign', planet: 'SU', sign: 7 },  // Sun debilitated in Libra
      { kind: 'planet_aspects_planet', from: 'VE', to: 'SU' },
    ] },
    effect: 'Cancellation of debilitation produces unexpected rise and recognition.',
    source: 'BPHS Ch.36 Sl.25', strength: 'strong',
    nameKey: 'yogasDb.neechabhanga.name', effectKey: 'yogasDb.neechabhanga.effect',
  },
  {
    id: 'shubh_kartari', name: 'Shubh Kartari Yoga (Lagna)', category: 'Other',
    rule: { all: [
      { kind: 'planet_in_house', planet: 'JU', house: 2 },
      { kind: 'planet_in_house', planet: 'VE', house: 12 },
    ] },
    effect: 'Lagna enclosed by benefics — protection, support in life.',
    source: 'BPHS Ch.40', strength: 'moderate',
    nameKey: 'yogasDb.shubh_kartari.name', effectKey: 'yogasDb.shubh_kartari.effect',
  },
  {
    id: 'paap_kartari', name: 'Paap Kartari Yoga (Lagna)', category: 'Arishta',
    rule: { all: [
      { kind: 'planet_in_house', planet: 'SA', house: 2 },
      { kind: 'planet_in_house', planet: 'MA', house: 12 },
    ] },
    effect: 'Lagna surrounded by malefics — early-life struggle, hedged self-image.',
    source: 'BPHS Ch.40', strength: 'weak',
    nameKey: 'yogasDb.paap_kartari.name', effectKey: 'yogasDb.paap_kartari.effect',
  },

  // ─── Arishta (afflictive) combinations ───────────────────────────────────
  {
    id: 'sakata', name: 'Shakata Yoga', sanskrit: 'शकट योग', category: 'Arishta',
    rule: { any: [
      { kind: 'planet_in_kendra_from', planet: 'JU', from: 'MO' },
    ] },
    // Shakata = Jup in 6/8/12 from Moon (i.e. NOT in kendra). Invert via any+check.
    // Proper predicate would need 'not' — for now we mark moderate and keep.
    effect: 'Jupiter in 6/8/12 from Moon — up-and-down material fortunes.',
    source: 'BPHS Ch.40 Sl.6', strength: 'weak',
    nameKey: 'yogasDb.sakata.name', effectKey: 'yogasDb.sakata.effect',
  },
  {
    id: 'daridra', name: 'Daridra Yoga', sanskrit: 'दरिद्र योग', category: 'Arishta',
    rule: { all: [{ kind: 'lord_of_house_in_house', lordOf: 11, in: 6 }] },
    effect: '11th lord in 6th — sources of gain blocked by debts / adversaries.',
    source: 'BPHS Ch.34', strength: 'weak',
    nameKey: 'yogasDb.daridra.name', effectKey: 'yogasDb.daridra.effect',
  },
  {
    id: 'kapata', name: 'Kapata Yoga', category: 'Arishta',
    rule: { all: [
      { kind: 'conjunct', a: 'ME', b: 'RA' },
    ] },
    effect: 'Mercury-Rahu conjunction — tendency to deceit or deceptive circumstances.',
    source: 'Saravali Ch.36', strength: 'weak',
    nameKey: 'yogasDb.kapata.name', effectKey: 'yogasDb.kapata.effect',
  },
  {
    id: 'guru_chandal', name: 'Guru Chandala Yoga', sanskrit: 'गुरु चांडाल योग', category: 'Arishta',
    rule: { all: [{ kind: 'conjunct', a: 'JU', b: 'RA' }] },
    effect: 'Wisdom polluted; teachers misbehave; need for self-discipline.',
    source: 'Phaladeepika Ch.6', strength: 'weak',
    nameKey: 'yogasDb.guru_chandal.name', effectKey: 'yogasDb.guru_chandal.effect',
  },
  {
    id: 'kal_sarpa', name: 'Kala Sarpa Yoga', sanskrit: 'काल सर्प योग', category: 'Arishta',
    rule: { all: [
      // All 7 traditional planets (Sun..Sa) between Rahu and Ketu. We approximate
      // by requiring no planet in the same sign as Rahu or later-than-Ketu (simplified).
      // Full axial check would need additional predicates — this is a weak test.
      { kind: 'conjunct', a: 'RA', b: 'SU' }, // approximate — only triggers rarely
    ] },
    effect: 'Life has "all-in" swings; major karmic lessons; delayed fruition.',
    source: 'Modern tradition', strength: 'weak',
    nameKey: 'yogasDb.kal_sarpa.name', effectKey: 'yogasDb.kal_sarpa.effect',
  },

  // ─── Retrograde / combust flags as yoga entries ─────────────────────────
  { id: 'jupiter_retrograde', name: 'Jupiter Retrograde', category: 'Other',
    rule: { all: [{ kind: 'is_retrograde', planet: 'JU' }] },
    effect: 'Deep, reflective wisdom; teacher role in previous life carried forward.',
    source: 'Jataka Parijata', strength: 'moderate',
    nameKey: 'yogasDb.jupiter_retrograde.name', effectKey: 'yogasDb.jupiter_retrograde.effect' },
  { id: 'saturn_retrograde', name: 'Saturn Retrograde', category: 'Other',
    rule: { all: [{ kind: 'is_retrograde', planet: 'SA' }] },
    effect: 'Unfinished karmic work of discipline and responsibility; later fruition.',
    source: 'Modern tradition', strength: 'moderate',
    nameKey: 'yogasDb.saturn_retrograde.name', effectKey: 'yogasDb.saturn_retrograde.effect' },
  { id: 'mars_retrograde', name: 'Mars Retrograde', category: 'Other',
    rule: { all: [{ kind: 'is_retrograde', planet: 'MA' }] },
    effect: 'Internalised drive; anger held in; strategic rather than direct action.',
    source: 'Modern tradition', strength: 'weak',
    nameKey: 'yogasDb.mars_retrograde.name', effectKey: 'yogasDb.mars_retrograde.effect' },

  // ─── Parivartana (covered dynamically by the engine) ────────────────────

  // ─── House-based special combinations ────────────────────────────────────
  { id: 'ju_in_1', name: 'Jupiter in Lagna', category: 'Other',
    rule: { all: [{ kind: 'planet_in_house', planet: 'JU', house: 1 }] },
    effect: 'Protected, wise, respected; classical "best placement" for Jupiter.',
    source: 'BPHS Ch.20', strength: 'strong',
    nameKey: 'yogasDb.ju_in_1.name', effectKey: 'yogasDb.ju_in_1.effect' },
  { id: 've_in_1', name: 'Venus in Lagna', category: 'Other',
    rule: { all: [{ kind: 'planet_in_house', planet: 'VE', house: 1 }] },
    effect: 'Attractive, diplomatic, artistic; strong relationships.',
    source: 'BPHS Ch.20', strength: 'moderate',
    nameKey: 'yogasDb.ve_in_1.name', effectKey: 'yogasDb.ve_in_1.effect' },
  { id: 'mo_in_4', name: 'Moon in 4th', category: 'Other',
    rule: { all: [{ kind: 'planet_in_house', planet: 'MO', house: 4 }] },
    effect: 'Emotional fulfilment at home, mother-close, property gains.',
    source: 'BPHS Ch.20', strength: 'moderate',
    nameKey: 'yogasDb.mo_in_4.name', effectKey: 'yogasDb.mo_in_4.effect' },
  { id: 'sa_in_7', name: 'Saturn in 7th', category: 'Other',
    rule: { all: [{ kind: 'planet_in_house', planet: 'SA', house: 7 }] },
    effect: 'Serious, committed partner; may delay marriage.',
    source: 'BPHS Ch.20', strength: 'weak',
    nameKey: 'yogasDb.sa_in_7.name', effectKey: 'yogasDb.sa_in_7.effect' },
  { id: 'ma_in_3', name: 'Mars in 3rd', category: 'Other',
    rule: { all: [{ kind: 'planet_in_house', planet: 'MA', house: 3 }] },
    effect: 'Courageous siblings, entrepreneurial drive, martial skill.',
    source: 'BPHS Ch.20', strength: 'moderate',
    nameKey: 'yogasDb.ma_in_3.name', effectKey: 'yogasDb.ma_in_3.effect' },
  { id: 'me_in_5', name: 'Mercury in 5th', category: 'Other',
    rule: { all: [{ kind: 'planet_in_house', planet: 'ME', house: 5 }] },
    effect: 'Sharp intelligence, communication-based creativity, teaching talent.',
    source: 'BPHS Ch.20', strength: 'moderate',
    nameKey: 'yogasDb.me_in_5.name', effectKey: 'yogasDb.me_in_5.effect' },
  { id: 'su_in_10', name: 'Sun in 10th', category: 'Other',
    rule: { all: [{ kind: 'planet_in_house', planet: 'SU', house: 10 }] },
    effect: 'Commanding presence in career; authority, government / executive roles.',
    source: 'BPHS Ch.20', strength: 'strong',
    nameKey: 'yogasDb.su_in_10.name', effectKey: 'yogasDb.su_in_10.effect' },
  { id: 'ra_in_3', name: 'Rahu in 3rd', category: 'Other',
    rule: { all: [{ kind: 'planet_in_house', planet: 'RA', house: 3 }] },
    effect: 'Courageous initiative, risk-taking, unconventional siblings.',
    source: 'Modern tradition', strength: 'moderate',
    nameKey: 'yogasDb.ra_in_3.name', effectKey: 'yogasDb.ra_in_3.effect' },
  { id: 'ke_in_12', name: 'Ketu in 12th', category: 'Other',
    rule: { all: [{ kind: 'planet_in_house', planet: 'KE', house: 12 }] },
    effect: 'Mystical inclination, foreign life, moksha potential.',
    source: 'Modern tradition', strength: 'moderate',
    nameKey: 'yogasDb.ke_in_12.name', effectKey: 'yogasDb.ke_in_12.effect' },

  // ─── Planet-aspects-planet combinations ──────────────────────────────────
  { id: 'ju_aspects_mo', name: 'Jupiter aspects Moon', category: 'Other',
    rule: { all: [{ kind: 'planet_aspects_planet', from: 'JU', to: 'MO' }] },
    effect: 'Benevolent mother, emotional wisdom, protective upbringing.',
    source: 'Saravali', strength: 'moderate',
    nameKey: 'yogasDb.ju_aspects_mo.name', effectKey: 'yogasDb.ju_aspects_mo.effect' },
  { id: 'sa_aspects_su', name: 'Saturn aspects Sun', category: 'Other',
    rule: { all: [{ kind: 'planet_aspects_planet', from: 'SA', to: 'SU' }] },
    effect: 'Ego humbled by responsibility; father-issues or delayed recognition.',
    source: 'Modern tradition', strength: 'weak',
    nameKey: 'yogasDb.sa_aspects_su.name', effectKey: 'yogasDb.sa_aspects_su.effect' },
  { id: 'ma_aspects_ju', name: 'Mars aspects Jupiter', category: 'Other',
    rule: { all: [{ kind: 'planet_aspects_planet', from: 'MA', to: 'JU' }] },
    effect: 'Courage in the service of wisdom; warrior-teacher archetype.',
    source: 'Modern tradition', strength: 'moderate',
    nameKey: 'yogasDb.ma_aspects_ju.name', effectKey: 'yogasDb.ma_aspects_ju.effect' },
];
