// Vedic numerology — Moolank (root number from birth day), Bhagyank (destiny
// from full DOB), and Chaldean name number. Returns ruling planet, lucky
// colors/numbers/days/gems, and a short personality summary.

const RULING_PLANET: Record<number, string> = {
  1: 'Sun',
  2: 'Moon',
  3: 'Jupiter',
  4: 'Rahu',
  5: 'Mercury',
  6: 'Venus',
  7: 'Ketu',
  8: 'Saturn',
  9: 'Mars',
};

const LUCKY_COLORS: Record<number, string[]> = {
  1: ['Gold', 'Orange', 'Yellow'],
  2: ['White', 'Cream', 'Silver'],
  3: ['Yellow', 'Saffron', 'Pink'],
  4: ['Grey', 'Khaki', 'Electric Blue'],
  5: ['Green', 'Light Grey', 'White'],
  6: ['White', 'Pink', 'Light Blue'],
  7: ['Sea Green', 'Light Yellow'],
  8: ['Black', 'Dark Blue', 'Purple'],
  9: ['Red', 'Crimson', 'Maroon'],
};

const LUCKY_DAYS: Record<number, string[]> = {
  1: ['Sunday', 'Monday'],
  2: ['Monday', 'Friday'],
  3: ['Thursday', 'Tuesday', 'Friday'],
  4: ['Saturday', 'Sunday'],
  5: ['Wednesday', 'Friday'],
  6: ['Friday', 'Wednesday'],
  7: ['Sunday', 'Monday'],
  8: ['Saturday', 'Friday'],
  9: ['Tuesday', 'Thursday'],
};

const LUCKY_GEMS: Record<number, string> = {
  1: 'Ruby',
  2: 'Pearl',
  3: 'Yellow Sapphire',
  4: 'Hessonite (Gomed)',
  5: 'Emerald',
  6: 'Diamond',
  7: 'Cat\u2019s Eye (Lehsunia)',
  8: 'Blue Sapphire',
  9: 'Red Coral',
};

const LUCKY_NUMBERS: Record<number, number[]> = {
  1: [1, 10, 19, 28],
  2: [2, 11, 20, 29],
  3: [3, 12, 21, 30],
  4: [4, 13, 22, 31],
  5: [5, 14, 23],
  6: [6, 15, 24],
  7: [7, 16, 25],
  8: [8, 17, 26],
  9: [9, 18, 27],
};

const PERSONALITY: Record<number, string> = {
  1: 'Independent, ambitious, natural leader; commanding presence and creative drive.',
  2: 'Sensitive, intuitive, diplomatic; thrives on cooperation and emotional bonds.',
  3: 'Optimistic, expressive, wisdom-seeking; teacher, philosopher, communicator.',
  4: 'Unconventional, hardworking, system-builder; original thinker who challenges norms.',
  5: 'Versatile, witty, adaptable; loves travel, learning, and quick communication.',
  6: 'Charming, artistic, family-oriented; appreciates beauty, comfort, and harmony.',
  7: 'Mystical, introspective, analytical; spiritually inclined and deeply reflective.',
  8: 'Disciplined, persistent, patient; long climb to material success and authority.',
  9: 'Courageous, energetic, action-oriented; warrior spirit and humanitarian drive.',
};

// ─── DIGIT REDUCTION ────────────────────────────────────────────────────────
function digitSum(n: number): number {
  let s = 0;
  for (const ch of String(Math.abs(n))) s += +ch;
  return s;
}

export function reduceToSingle(n: number): number {
  let v = Math.abs(n);
  while (v > 9) v = digitSum(v);
  return v || 1;
}

// ─── CHALDEAN NAME NUMBER ───────────────────────────────────────────────────
// Chaldean system: each letter mapped to a digit 1..8 (no 9 — 9 is sacred).
const CHALDEAN: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

export function chaldeanNameNumber(name: string): { sum: number; root: number } {
  let sum = 0;
  for (const ch of name.toUpperCase()) {
    if (CHALDEAN[ch] != null) sum += CHALDEAN[ch];
  }
  return { sum, root: reduceToSingle(sum) };
}

// ─── PUBLIC ─────────────────────────────────────────────────────────────────
export interface NumerologyProfile {
  number: number;
  rulingPlanet: string;
  personality: string;
  luckyColors: string[];
  luckyDays: string[];
  luckyNumbers: number[];
  luckyGem: string;
}

export interface NumerologyResult {
  moolank: NumerologyProfile;     // birth day
  bhagyank: NumerologyProfile;    // full DOB
  nameNumber?: NumerologyProfile & { rawSum: number };
}

function profile(n: number): NumerologyProfile {
  return {
    number: n,
    rulingPlanet: RULING_PLANET[n],
    personality: PERSONALITY[n],
    luckyColors: LUCKY_COLORS[n],
    luckyDays: LUCKY_DAYS[n],
    luckyNumbers: LUCKY_NUMBERS[n],
    luckyGem: LUCKY_GEMS[n],
  };
}

export function calculateNumerology(dob: Date, name?: string): NumerologyResult {
  const day = dob.getUTCDate();
  const month = dob.getUTCMonth() + 1;
  const year = dob.getUTCFullYear();

  const moolank = reduceToSingle(day);
  const bhagyank = reduceToSingle(digitSum(day) + digitSum(month) + digitSum(year));

  const result: NumerologyResult = {
    moolank: profile(moolank),
    bhagyank: profile(bhagyank),
  };

  if (name && name.trim()) {
    const { sum, root } = chaldeanNameNumber(name);
    result.nameNumber = { ...profile(root), rawSum: sum };
  }

  return result;
}
