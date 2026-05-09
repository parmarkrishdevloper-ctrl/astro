// Per-nakshatra traditional attributes used across the app.
// All 27 entries, 0-indexed; look up by (nakshatraNum - 1).

export interface NakshatraMeta {
  deity: string;
  gana: 'Deva' | 'Manushya' | 'Rakshasa';
  yoni: string;
  varna: 'Brahmin' | 'Kshatriya' | 'Vaishya' | 'Shudra';
  nadi: 'Adi' | 'Madhya' | 'Antya';
  /** Varjya-muhurta start offset, in ghatis into the nakshatra (0..60). */
  varjyaGhati: number;
}

export const NAK_META: NakshatraMeta[] = [
  { deity: 'Ashwini Kumaras', gana: 'Deva',     yoni: 'Horse',    varna: 'Vaishya',   nadi: 'Adi',    varjyaGhati: 50 },
  { deity: 'Yama',            gana: 'Manushya', yoni: 'Elephant', varna: 'Shudra',    nadi: 'Madhya', varjyaGhati: 24 },
  { deity: 'Agni',            gana: 'Rakshasa', yoni: 'Sheep',    varna: 'Brahmin',   nadi: 'Antya',  varjyaGhati: 30 },
  { deity: 'Brahma',          gana: 'Manushya', yoni: 'Serpent',  varna: 'Shudra',    nadi: 'Antya',  varjyaGhati: 40 },
  { deity: 'Soma',            gana: 'Deva',     yoni: 'Serpent',  varna: 'Vaishya',   nadi: 'Madhya', varjyaGhati: 14 },
  { deity: 'Rudra',           gana: 'Manushya', yoni: 'Dog',      varna: 'Shudra',    nadi: 'Adi',    varjyaGhati: 21 },
  { deity: 'Aditi',           gana: 'Deva',     yoni: 'Cat',      varna: 'Vaishya',   nadi: 'Adi',    varjyaGhati: 30 },
  { deity: 'Brihaspati',      gana: 'Deva',     yoni: 'Sheep',    varna: 'Kshatriya', nadi: 'Madhya', varjyaGhati: 20 },
  { deity: 'Nagas',           gana: 'Rakshasa', yoni: 'Cat',      varna: 'Shudra',    nadi: 'Antya',  varjyaGhati: 32 },
  { deity: 'Pitris',          gana: 'Rakshasa', yoni: 'Rat',      varna: 'Shudra',    nadi: 'Antya',  varjyaGhati: 30 },
  { deity: 'Bhaga',           gana: 'Manushya', yoni: 'Rat',      varna: 'Brahmin',   nadi: 'Madhya', varjyaGhati: 20 },
  { deity: 'Aryaman',         gana: 'Manushya', yoni: 'Cow',      varna: 'Kshatriya', nadi: 'Adi',    varjyaGhati: 18 },
  { deity: 'Savitr',          gana: 'Deva',     yoni: 'Buffalo',  varna: 'Vaishya',   nadi: 'Adi',    varjyaGhati: 21 },
  { deity: 'Vishvakarma',     gana: 'Rakshasa', yoni: 'Tiger',    varna: 'Shudra',    nadi: 'Madhya', varjyaGhati: 20 },
  { deity: 'Vayu',            gana: 'Deva',     yoni: 'Buffalo',  varna: 'Shudra',    nadi: 'Antya',  varjyaGhati: 14 },
  { deity: 'Indra-Agni',      gana: 'Rakshasa', yoni: 'Tiger',    varna: 'Shudra',    nadi: 'Antya',  varjyaGhati: 10 },
  { deity: 'Mitra',           gana: 'Deva',     yoni: 'Deer',     varna: 'Shudra',    nadi: 'Madhya', varjyaGhati: 10 },
  { deity: 'Indra',           gana: 'Rakshasa', yoni: 'Deer',     varna: 'Vaishya',   nadi: 'Adi',    varjyaGhati: 14 },
  { deity: 'Nirriti',         gana: 'Rakshasa', yoni: 'Dog',      varna: 'Kshatriya', nadi: 'Adi',    varjyaGhati: 20 },
  { deity: 'Apas',            gana: 'Manushya', yoni: 'Monkey',   varna: 'Brahmin',   nadi: 'Madhya', varjyaGhati: 24 },
  { deity: 'Vishvedevas',     gana: 'Manushya', yoni: 'Mongoose', varna: 'Kshatriya', nadi: 'Antya',  varjyaGhati: 20 },
  { deity: 'Vishnu',          gana: 'Deva',     yoni: 'Monkey',   varna: 'Shudra',    nadi: 'Antya',  varjyaGhati: 10 },
  { deity: 'Vasus',           gana: 'Rakshasa', yoni: 'Lion',     varna: 'Shudra',    nadi: 'Madhya', varjyaGhati: 10 },
  { deity: 'Varuna',          gana: 'Rakshasa', yoni: 'Horse',    varna: 'Shudra',    nadi: 'Adi',    varjyaGhati: 18 },
  { deity: 'Aja Ekapada',     gana: 'Manushya', yoni: 'Lion',     varna: 'Brahmin',   nadi: 'Adi',    varjyaGhati: 16 },
  { deity: 'Ahirbudhnya',     gana: 'Manushya', yoni: 'Cow',      varna: 'Kshatriya', nadi: 'Madhya', varjyaGhati: 24 },
  { deity: 'Pushan',          gana: 'Deva',     yoni: 'Elephant', varna: 'Shudra',    nadi: 'Antya',  varjyaGhati: 30 },
];

/** Disha-shool: direction to avoid travelling for the given weekday (0=Sun..6=Sat). */
export const DISHA_SHOOL = ['West', 'East', 'North', 'North', 'South', 'West', 'East'];

/** Chandra-bala: given Moon's rashi (1..12), the rashis where Chandra is benefic for travel/work. */
export function chandraBalaFor(moonRashi: number): number[] {
  // Benefic chandra from rashis 1, 3, 6, 7, 10, 11 counted from Moon.
  const offsets = [1, 3, 6, 7, 10, 11];
  return offsets.map((o) => ((moonRashi - 1 + o - 1) % 12) + 1);
}

/** Tara-bala: given Moon's nakshatra (1..27), return the 9 benefic starting nakshatras. */
export function taraBalaFor(moonNak: number): { favorable: number[]; inauspicious: number[] } {
  // 9-fold tara cycle: Janma, Sampat, Vipat, Kshema, Pratyari, Sadhaka, Vadha, Mitra, Parama-mitra.
  // Favorable = Sampat (2), Kshema (4), Sadhaka (6), Mitra (8), Parama-mitra (9) counted from Janma.
  // Inauspicious = Janma (1), Vipat (3), Pratyari (5), Vadha (7).
  const fav: number[] = [];
  const inaus: number[] = [];
  const favOffsets = [2, 4, 6, 8, 9];
  const badOffsets = [1, 3, 5, 7];
  for (const cycle of [0, 1, 2]) {
    for (const o of favOffsets) fav.push(((moonNak - 1 + cycle * 9 + o - 1) % 27) + 1);
    for (const o of badOffsets) inaus.push(((moonNak - 1 + cycle * 9 + o - 1) % 27) + 1);
  }
  return { favorable: fav, inauspicious: inaus };
}

/** Ritu (season) from Sun's sidereal rashi (1..12). */
export function rituFromSunRashi(sunRashi: number): string {
  // Vasanta (spring) = Mesha+Vrishabha, Grishma = Mithuna+Karka, Varsha = Simha+Kanya,
  // Sharad = Tula+Vrishchika, Hemanta = Dhanu+Makara, Shishira = Kumbha+Meena.
  const map = ['Vasanta','Vasanta','Grishma','Grishma','Varsha','Varsha',
               'Sharad','Sharad','Hemanta','Hemanta','Shishira','Shishira'];
  return map[sunRashi - 1];
}

/** Amanta lunar month names, keyed by the solar rashi containing the new moon. */
export const AMANTA_MASA = [
  'Chaitra','Vaishakha','Jyeshtha','Ashadha','Shravana','Bhadrapada',
  'Ashwin','Kartika','Margashirsha','Pausha','Magha','Phalguna',
];
