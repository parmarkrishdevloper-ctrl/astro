import { PlanetId } from './astro-constants';

// ─── VARNA (1 point) — by Moon rashi ────────────────────────────────────────
// Brahmin > Kshatriya > Vaishya > Shudra. Boy's varna >= girl's varna → full point.
export type Varna = 'Brahmin' | 'Kshatriya' | 'Vaishya' | 'Shudra';
export const VARNA_RANK: Record<Varna, number> = {
  Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1,
};
// rashiNum 1..12 → varna
export const RASHI_VARNA: Record<number, Varna> = {
  1:  'Kshatriya', // Aries
  2:  'Vaishya',   // Taurus
  3:  'Shudra',    // Gemini
  4:  'Brahmin',   // Cancer
  5:  'Kshatriya', // Leo
  6:  'Vaishya',   // Virgo
  7:  'Shudra',    // Libra
  8:  'Brahmin',   // Scorpio
  9:  'Kshatriya', // Sagittarius
  10: 'Vaishya',   // Capricorn
  11: 'Shudra',    // Aquarius
  12: 'Brahmin',   // Pisces
};

// ─── VASHYA (2 points) — by Moon rashi ──────────────────────────────────────
export type Vashya = 'Chatushpada' | 'Manava' | 'Jalachara' | 'Vanachara' | 'Keeta';
// Standard categorization (some sources split half-signs; we treat each rashi atomically)
export const RASHI_VASHYA: Record<number, Vashya> = {
  1:  'Chatushpada', // Aries — ram
  2:  'Chatushpada', // Taurus — bull
  3:  'Manava',      // Gemini
  4:  'Jalachara',   // Cancer
  5:  'Vanachara',   // Leo
  6:  'Manava',      // Virgo
  7:  'Manava',      // Libra
  8:  'Keeta',       // Scorpio
  9:  'Chatushpada', // Sagittarius (mostly horse)
  10: 'Jalachara',   // Capricorn (water-elephant)
  11: 'Manava',      // Aquarius
  12: 'Jalachara',   // Pisces
};
// Compatibility matrix (rows = boy's vashya, cols = girl's vashya). Values 0..2.
export const VASHYA_POINTS: Record<Vashya, Record<Vashya, number>> = {
  Chatushpada: { Chatushpada: 2,   Manava: 1,   Jalachara: 1,   Vanachara: 0,   Keeta: 1 },
  Manava:      { Chatushpada: 1,   Manava: 2,   Jalachara: 0.5, Vanachara: 0.5, Keeta: 0.5 },
  Jalachara:   { Chatushpada: 1,   Manava: 0.5, Jalachara: 2,   Vanachara: 0.5, Keeta: 1 },
  Vanachara:   { Chatushpada: 0,   Manava: 0.5, Jalachara: 0.5, Vanachara: 2,   Keeta: 0 },
  Keeta:       { Chatushpada: 1,   Manava: 0.5, Jalachara: 1,   Vanachara: 0,   Keeta: 2 },
};

// ─── YONI (4 points) — by birth nakshatra ───────────────────────────────────
export type Yoni =
  | 'Horse' | 'Elephant' | 'Sheep' | 'Snake' | 'Dog' | 'Cat' | 'Rat'
  | 'Cow' | 'Buffalo' | 'Tiger' | 'Deer' | 'Monkey' | 'Mongoose' | 'Lion';

export const NAK_YONI: Record<number, Yoni> = {
  1:  'Horse',     // Ashwini
  2:  'Elephant',  // Bharani
  3:  'Sheep',     // Krittika
  4:  'Snake',     // Rohini
  5:  'Snake',     // Mrigashira
  6:  'Dog',       // Ardra
  7:  'Cat',       // Punarvasu
  8:  'Sheep',     // Pushya
  9:  'Cat',       // Ashlesha
  10: 'Rat',       // Magha
  11: 'Rat',       // Purva Phalguni
  12: 'Cow',       // Uttara Phalguni
  13: 'Buffalo',   // Hasta
  14: 'Tiger',     // Chitra
  15: 'Buffalo',   // Swati
  16: 'Tiger',     // Vishakha
  17: 'Deer',      // Anuradha
  18: 'Deer',      // Jyeshtha
  19: 'Dog',       // Mula
  20: 'Monkey',    // Purva Ashadha
  21: 'Mongoose',  // Uttara Ashadha
  22: 'Monkey',    // Shravana
  23: 'Lion',      // Dhanishta
  24: 'Horse',     // Shatabhisha
  25: 'Lion',      // Purva Bhadrapada
  26: 'Cow',       // Uttara Bhadrapada
  27: 'Elephant',  // Revati
};

// Yoni enmity pairs (mortal enemies). Same yoni = 4, friendly = 3, neutral = 2,
// enemy = 1, mortal enemy = 0. Below is the mortal-enemy table from classical
// texts. Anything not listed and not equal is treated as neutral (2).
const MORTAL_ENEMIES: [Yoni, Yoni][] = [
  ['Horse', 'Buffalo'],
  ['Elephant', 'Lion'],
  ['Sheep', 'Monkey'],
  ['Snake', 'Mongoose'],
  ['Dog', 'Deer'],
  ['Cat', 'Rat'],
  ['Cow', 'Tiger'],
];
const FRIENDLY: [Yoni, Yoni][] = [
  ['Horse', 'Sheep'],
  ['Elephant', 'Deer'],
  ['Cow', 'Buffalo'],
  ['Cat', 'Snake'], // partial-friendly per some texts
];

export function yoniPoints(a: Yoni, b: Yoni): number {
  if (a === b) return 4;
  const isPair = (pair: [Yoni, Yoni]) =>
    (pair[0] === a && pair[1] === b) || (pair[1] === a && pair[0] === b);
  if (MORTAL_ENEMIES.some(isPair)) return 0;
  if (FRIENDLY.some(isPair)) return 3;
  return 2; // neutral default
}

// ─── GANA (6 points) — by birth nakshatra ───────────────────────────────────
export type Gana = 'Deva' | 'Manushya' | 'Rakshasa';
export const NAK_GANA: Record<number, Gana> = {
  1:'Deva', 5:'Deva', 7:'Deva', 8:'Deva', 13:'Deva', 15:'Deva', 17:'Deva', 22:'Deva', 27:'Deva',
  2:'Manushya', 4:'Manushya', 6:'Manushya', 11:'Manushya', 12:'Manushya', 20:'Manushya', 21:'Manushya', 25:'Manushya', 26:'Manushya',
  3:'Rakshasa', 9:'Rakshasa', 10:'Rakshasa', 14:'Rakshasa', 16:'Rakshasa', 18:'Rakshasa', 19:'Rakshasa', 23:'Rakshasa', 24:'Rakshasa',
};

export function ganaPoints(a: Gana, b: Gana): number {
  if (a === b) return 6;
  const pair = [a, b].sort().join('-');
  if (pair === 'Deva-Manushya') return 5;
  if (pair === 'Deva-Rakshasa') return 1;
  if (pair === 'Manushya-Rakshasa') return 0;
  return 0;
}

// ─── NADI (8 points) — by birth nakshatra ───────────────────────────────────
export type Nadi = 'Aadi' | 'Madhya' | 'Antya';
export const NAK_NADI: Record<number, Nadi> = {
  1:'Aadi',6:'Aadi',7:'Aadi',12:'Aadi',13:'Aadi',18:'Aadi',19:'Aadi',24:'Aadi',25:'Aadi',
  2:'Madhya',5:'Madhya',8:'Madhya',11:'Madhya',14:'Madhya',17:'Madhya',20:'Madhya',23:'Madhya',26:'Madhya',
  3:'Antya',4:'Antya',9:'Antya',10:'Antya',15:'Antya',16:'Antya',21:'Antya',22:'Antya',27:'Antya',
};

// ─── GRAHA MAITRI (5 points) — friendship between Moon-sign lords ───────────
export type Friendship = 'friend' | 'neutral' | 'enemy';
// Standard Parashari natural friendships (symmetric simplification)
const FRIENDS: Record<PlanetId, PlanetId[]> = {
  SU: ['MO','MA','JU'],
  MO: ['SU','ME'],
  MA: ['SU','MO','JU'],
  ME: ['SU','VE'],
  JU: ['SU','MO','MA'],
  VE: ['ME','SA'],
  SA: ['ME','VE'],
  RA: ['VE','SA','ME'],
  KE: ['MA','VE','SA'],
};
const ENEMIES: Record<PlanetId, PlanetId[]> = {
  SU: ['VE','SA'],
  MO: [],
  MA: ['ME'],
  ME: ['MO'],
  JU: ['ME','VE'],
  VE: ['SU','MO'],
  SA: ['SU','MO','MA'],
  RA: ['SU','MO','MA'],
  KE: ['SU','MO'],
};
export function friendshipBetween(a: PlanetId, b: PlanetId): Friendship {
  if (a === b) return 'friend';
  if (FRIENDS[a]?.includes(b) && FRIENDS[b]?.includes(a)) return 'friend';
  if (ENEMIES[a]?.includes(b) || ENEMIES[b]?.includes(a)) return 'enemy';
  return 'neutral';
}
export function grahaMaitriPoints(boyLord: PlanetId, girlLord: PlanetId): number {
  if (boyLord === girlLord) return 5;
  const ab = friendshipBetween(boyLord, girlLord);
  const ba = friendshipBetween(girlLord, boyLord);
  if (ab === 'friend' && ba === 'friend') return 5;
  if (ab === 'friend' || ba === 'friend') return 4;
  if (ab === 'neutral' && ba === 'neutral') return 3;
  if ((ab === 'friend' && ba === 'enemy') || (ab === 'enemy' && ba === 'friend')) return 1;
  if (ab === 'neutral' || ba === 'neutral') return 1;
  return 0;
}
