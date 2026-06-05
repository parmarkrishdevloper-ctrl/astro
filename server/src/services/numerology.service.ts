// Vedic numerology — Moolank (root number from birth day), Bhagyank (destiny
// from full DOB), and Chaldean name number. Returns ruling planet, lucky
// colors/numbers/days/gems, and a short personality summary.

const RULING_PLANET: Record<number, string> = {
  1: 'सूर्य',
  2: 'चंद्र',
  3: 'गुरु',
  4: 'राहु',
  5: 'बुध',
  6: 'शुक्र',
  7: 'केतु',
  8: 'शनि',
  9: 'मंगल',
};

const LUCKY_COLORS: Record<number, string[]> = {
  1: ['सोनेहरा', 'नारंगी', 'पीला'],
  2: ['सफेद', 'क्रीम', 'चांदी'],
  3: ['पीला', 'भगवा', 'गुलाबी'],
  4: ['स्लेटी', 'खाकी', 'इलेक्ट्रिक ब्लू'],
  5: ['हरा', 'हल्का स्लेटी', 'सफेद'],
  6: ['सफेद', 'गुलाबी', 'हल्का नीला'],
  7: ['समुद्री हरा', 'हल्का पीला'],
  8: ['काला', 'गहरा नीला', 'बैंगनी'],
  9: ['लाल', 'गहरा लाल', 'मैरून'],
};

const LUCKY_DAYS: Record<number, string[]> = {
  1: ['रविवार', 'सोमवार'],
  2: ['सोमवार', 'शुक्रवार'],
  3: ['गुरुवार', 'मंगलवार', 'शुक्रवार'],
  4: ['शनिवार', 'रविवार'],
  5: ['बुधवार', 'शुक्रवार'],
  6: ['शुक्रवार', 'बुधवार'],
  7: ['रविवार', 'सोमवार'],
  8: ['शनिवार', 'शुक्रवार'],
  9: ['मंगलवार', 'गुरुवार'],
};

const LUCKY_GEMS: Record<number, string> = {
  1: 'माणिक्य (Ruby)',
  2: 'मोती (Pearl)',
  3: 'पुखराज (Yellow Sapphire)',
  4: 'गोमेद (Hessonite)',
  5: 'पन्ना (Emerald)',
  6: 'हीरा (Diamond)',
  7: 'लहसुनिया (Cat’s Eye)',
  8: 'नीलम (Blue Sapphire)',
  9: 'मूंगा (Red Coral)',
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
  1: 'स्वतंत्र, महत्वाकांक्षी, स्वाभाविक नेता; प्रभावशाली व्यक्तित्व और रचनात्मक।',
  2: 'संवेदनशील, सहजज्ञ, कूटनीतिक; सहयोग और भावनात्मक संबंधों पर पनपने वाले।',
  3: 'आशावादी, अभिव्यंजक, ज्ञान-साधक; शिक्षक, दार्शनिक, संचारक।',
  4: 'अपरंपरागत, मेहनती, प्रणाली-निर्माता; मूल विचारक जो मानदंडों को चुनौती देते हैं।',
  5: 'बहुमुखी, चतुर, अनुकूलनीय; यात्रा, सीखना और त्वरित संचार पसंद है।',
  6: 'आकर्षक, कलात्मक, परिवार-उन्मुख; सौंदर्य, आराम और सद्भाव की सराहना करते हैं।',
  7: 'रहस्यमय, आत्मनिरीक्षण करने वाले, विश्लेषणात्मक; आध्यात्मिक रूप से प्रवृत्त।',
  8: 'अनुशासित, दृढ़निश्चयी, धैर्यवान; भौतिक सफलता और अधिकार की लंबी चढ़ाई।',
  9: 'साहसी, ऊर्जावान, कार्य-उन्मुख; योद्धा भावना और मानवीय अभियान।',
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
