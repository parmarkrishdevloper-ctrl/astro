// Phase 19 — Deep numerology.
//
// Layered on top of the basic numerology.service (Moolank / Bhagyank):
//   • Chaldean vs Pythagorean name-number (side-by-side)
//   • Destiny / Life-Path number (full DOB)
//   • Soul-urge / Heart (vowels only)
//   • Personality / Outer (consonants only)
//   • Expression / Full-name (letters)
//   • Birthday number
//   • Four Pinnacles + four Challenges (life-stage cycles)
//   • Personal year / month / day
//   • Karmic Debt (13/14/16/19) + Master numbers (11/22/33)
//   • Chaldean/Pythagorean compatibility between two names

import {
  reduceToSingle,
  chaldeanNameNumber,
} from './numerology.service';

// ─── Letter tables ─────────────────────────────────────────────────────────
const PYTHAGOREAN: Record<string, number> = {
  A:1,B:2,C:3,D:4,E:5,F:6,G:7,H:8,I:9,
  J:1,K:2,L:3,M:4,N:5,O:6,P:7,Q:8,R:9,
  S:1,T:2,U:3,V:4,W:5,X:6,Y:7,Z:8,
};

const CHALDEAN: Record<string, number> = {
  A:1,I:1,J:1,Q:1,Y:1,
  B:2,K:2,R:2,
  C:3,G:3,L:3,S:3,
  D:4,M:4,T:4,
  E:5,H:5,N:5,X:5,
  U:6,V:6,W:6,
  O:7,Z:7,
  F:8,P:8,
};

const VOWELS = new Set(['A','E','I','O','U']);
// 'Y' treated as vowel if not surrounded by vowels — simplified:
function isVowel(ch: string, prev?: string, next?: string): boolean {
  if (VOWELS.has(ch)) return true;
  if (ch === 'Y') {
    const bothVowels = prev && next && VOWELS.has(prev) && VOWELS.has(next);
    return !bothVowels;
  }
  return false;
}

// Master & karmic
const MASTERS = new Set([11, 22, 33]);
const KARMIC  = new Set([13, 14, 16, 19]);

function digitSum(n: number): number {
  let s = 0;
  for (const ch of String(Math.abs(n))) s += +ch;
  return s;
}

// Reduce keeping masters (stop at 11, 22, 33)
function reduceKeepMasters(n: number): number {
  let v = Math.abs(n);
  while (v > 9 && !MASTERS.has(v)) v = digitSum(v);
  return v || 0;
}

// ─── Core letter-number sums ───────────────────────────────────────────────

function sumBy(name: string, table: Record<string, number>, predicate?: (i: number, s: string) => boolean): number {
  let s = 0;
  const upper = name.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    if (!table[ch]) continue;
    if (predicate && !predicate(i, upper)) continue;
    s += table[ch];
  }
  return s;
}

function pythagoreanNumber(name: string): { sum: number; root: number; rootMaster: number } {
  const sum = sumBy(name, PYTHAGOREAN);
  return { sum, root: reduceToSingle(sum), rootMaster: reduceKeepMasters(sum) };
}

function pythChaldCompare(name: string) {
  const py = pythagoreanNumber(name);
  const ch = chaldeanNameNumber(name);
  return { pythagorean: py, chaldean: { ...ch, rootMaster: reduceKeepMasters(ch.sum) } };
}

function vowelNumber(name: string, table: Record<string, number>): { sum: number; root: number; rootMaster: number } {
  const sum = sumBy(name, table, (i, s) => isVowel(s[i], s[i - 1], s[i + 1]));
  return { sum, root: reduceToSingle(sum), rootMaster: reduceKeepMasters(sum) };
}

function consonantNumber(name: string, table: Record<string, number>): { sum: number; root: number; rootMaster: number } {
  const sum = sumBy(name, table, (i, s) => !isVowel(s[i], s[i - 1], s[i + 1]));
  return { sum, root: reduceToSingle(sum), rootMaster: reduceKeepMasters(sum) };
}

// ─── Meaning tables ────────────────────────────────────────────────────────
const MEANING: Record<number, string> = {
  1: 'Initiator — independent, ambitious, pioneering; must learn self-reliance without isolation.',
  2: 'Partner — cooperative, sensitive, diplomatic; must learn to hold your ground while staying kind.',
  3: 'Expresser — creative, communicative, joyous; must learn to finish what you start.',
  4: 'Builder — methodical, disciplined, reliable; must learn to bend without breaking.',
  5: 'Explorer — free, versatile, restless; must learn to commit without suffocating.',
  6: 'Nurturer — caring, responsible, artistic; must learn to serve without martyring.',
  7: 'Seeker — analytical, mystical, solitary; must learn to trust the world, not just your mind.',
  8: 'Executive — authoritative, strategic, material-minded; must learn to wield power with ethics.',
  9: 'Humanitarian — compassionate, idealistic, universal; must learn to let go of what is complete.',
  11:'Master Inspirer — intuitive visionary; the illumination of 2 raised to spiritual purpose. Nervous, sensitive; needs anchoring.',
  22:'Master Builder — practical visionary who can manifest large structures. Heavy responsibility; can burn out.',
  33:'Master Teacher — universal compassion; 11+22 fused. Rare and demanding; asks for selfless service.',
};

const KARMIC_DEBT: Record<number, string> = {
  13: 'Karmic debt 13 — lessons in disciplined effort. Past-life tendency to avoid hard work; this life requires persistence.',
  14: 'Karmic debt 14 — lessons in restraint. Tendency to excess in appetites; this life requires moderation.',
  16: 'Karmic debt 16 — lessons in humility. Pride toppled unexpectedly; this life asks for surrender.',
  19: 'Karmic debt 19 — lessons in dependence and service. Tendency to dominate; this life rewards collaboration.',
};

// ─── Pinnacles / Challenges ────────────────────────────────────────────────

function pinnacles(day: number, month: number, year: number): {
  pinnacles: { num: number; ends: number; meaning: string }[];
  challenges: { num: number; ends: number; meaning: string }[];
  lifePath: number;
} {
  const m = reduceToSingle(month);
  const d = reduceToSingle(day);
  const y = reduceToSingle(year);
  const lp = reduceKeepMasters(digitSum(day) + digitSum(month) + digitSum(year));

  const p1 = reduceKeepMasters(m + d);
  const p2 = reduceKeepMasters(d + y);
  const p3 = reduceKeepMasters(p1 + p2);
  const p4 = reduceKeepMasters(m + y);

  // First pinnacle ends at 36 - lifePath (if lifePath is master, use reduced)
  const lpReduced = reduceToSingle(lp);
  const end1 = 36 - lpReduced;
  const end2 = end1 + 9;
  const end3 = end2 + 9;
  const end4 = 999;

  const c1 = Math.abs(m - d);
  const c2 = Math.abs(d - y);
  const c3 = Math.abs(c1 - c2);
  const c4 = Math.abs(m - y);

  const pMean: Record<number, string> = {
    1: 'Independence and self-definition — take risks, lead.',
    2: 'Cooperation and emotional growth — partner, listen.',
    3: 'Creative expression — write, speak, create.',
    4: 'Disciplined building — systems, foundations, work.',
    5: 'Freedom and change — travel, explore, sell.',
    6: 'Responsibility and home — family, service, art.',
    7: 'Study and inner work — research, meditation.',
    8: 'Power and material achievement — business, authority.',
    9: 'Completion and generosity — let go, teach, heal.',
    11:'Visionary inspiration — mentor, illuminate.',
    22:'Building something large — manifest your vision.',
    33:'Teaching and compassionate service.',
  };
  const cMean: Record<number, string> = {
    0: 'No specific challenge — free to choose your own lessons.',
    1: 'Challenge: stand alone without competing.',
    2: 'Challenge: cooperate without losing self.',
    3: 'Challenge: finish what you start; stop scattering.',
    4: 'Challenge: discipline your work without rigidity.',
    5: 'Challenge: freedom without recklessness.',
    6: 'Challenge: serve without martyring.',
    7: 'Challenge: trust the world, not just your analysis.',
    8: 'Challenge: use power ethically.',
  };

  return {
    lifePath: lp,
    pinnacles: [
      { num: p1, ends: end1, meaning: pMean[p1] ?? '' },
      { num: p2, ends: end2, meaning: pMean[p2] ?? '' },
      { num: p3, ends: end3, meaning: pMean[p3] ?? '' },
      { num: p4, ends: end4, meaning: pMean[p4] ?? '' },
    ],
    challenges: [
      { num: c1, ends: end1, meaning: cMean[c1] ?? '' },
      { num: c2, ends: end2, meaning: cMean[c2] ?? '' },
      { num: c3, ends: end3, meaning: cMean[c3] ?? '' },
      { num: c4, ends: end4, meaning: cMean[c4] ?? '' },
    ],
  };
}

// ─── Personal year / month / day ───────────────────────────────────────────

function personalYearMonthDay(dob: Date, today: Date): { year: number; month: number; day: number } {
  const day = dob.getUTCDate();
  const month = dob.getUTCMonth() + 1;
  const curYear = today.getUTCFullYear();
  const py = reduceToSingle(digitSum(day) + digitSum(month) + digitSum(curYear));
  const pm = reduceToSingle(py + today.getUTCMonth() + 1);
  const pd = reduceToSingle(pm + today.getUTCDate());
  return { year: py, month: pm, day: pd };
}

// ─── Compatibility between two names/dobs ──────────────────────────────────
export function nameCompatibility(nameA: string, nameB: string): {
  chaldean: { a: number; b: number; delta: number; quality: string };
  pythagorean: { a: number; b: number; delta: number; quality: string };
} {
  const qualityOf = (delta: number) => {
    if (delta === 0) return 'identical resonance — mirror dynamic';
    if (delta <= 2)  return 'harmonious';
    if (delta <= 4)  return 'workable, needs communication';
    return 'challenging polarity';
  };
  const ca = chaldeanNameNumber(nameA);
  const cb = chaldeanNameNumber(nameB);
  const pa = pythagoreanNumber(nameA);
  const pb = pythagoreanNumber(nameB);
  return {
    chaldean:    { a: ca.root, b: cb.root, delta: Math.abs(ca.root - cb.root), quality: qualityOf(Math.abs(ca.root - cb.root)) },
    pythagorean: { a: pa.root, b: pb.root, delta: Math.abs(pa.root - pb.root), quality: qualityOf(Math.abs(pa.root - pb.root)) },
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface DeepNumerologyResult {
  dob: string;
  name?: string;
  lifePath: { num: number; master: boolean; meaning: string };
  destiny: { num: number; meaning: string };
  birthday: { num: number; meaning: string };
  expression?: { chaldean: number; pythagorean: number; meaningChaldean: string; meaningPythagorean: string };
  soulUrge?: { chaldean: number; pythagorean: number; meaningChaldean: string; meaningPythagorean: string };
  personality?: { chaldean: number; pythagorean: number; meaningChaldean: string; meaningPythagorean: string };
  chaldean?: { sum: number; root: number; rootMaster: number; meaning: string };
  pythagorean?: { sum: number; root: number; rootMaster: number; meaning: string };
  pinnacles: { num: number; ends: number; meaning: string }[];
  challenges: { num: number; ends: number; meaning: string }[];
  personalCycles: { year: number; month: number; day: number };
  karmicDebt: string[];
  masters: string[];
}

import { Locale as _Locale } from '../i18n';
// Locale parameter is reserved for future deep localization of the rule
// engine; current pass keeps the per-step prose English (see BiometricPage
// — those strings are wrapped in <span lang="en"> as a deferred i18n target).

export function deepNumerology(dob: Date, name?: string, today: Date = new Date(), _locale: _Locale = 'en'): DeepNumerologyResult {
  const day = dob.getUTCDate();
  const month = dob.getUTCMonth() + 1;
  const year = dob.getUTCFullYear();

  const pin = pinnacles(day, month, year);

  const lp = pin.lifePath;
  const destinyNum = reduceToSingle(digitSum(day) + digitSum(month) + digitSum(year));
  const bday = reduceToSingle(day);

  const result: DeepNumerologyResult = {
    dob: dob.toISOString().slice(0, 10),
    name,
    lifePath: {
      num: lp,
      master: MASTERS.has(lp),
      meaning: MEANING[lp] ?? MEANING[reduceToSingle(lp)] ?? '',
    },
    destiny: { num: destinyNum, meaning: MEANING[destinyNum] ?? '' },
    birthday: { num: bday, meaning: MEANING[bday] ?? '' },
    pinnacles: pin.pinnacles,
    challenges: pin.challenges,
    personalCycles: personalYearMonthDay(dob, today),
    karmicDebt: [],
    masters: [],
  };

  // Karmic debts — scan raw unreduced sums of the main numbers
  const rawSums = [
    day,
    digitSum(day) + digitSum(month) + digitSum(year),
  ];
  for (const n of rawSums) {
    if (KARMIC.has(n)) result.karmicDebt.push(KARMIC_DEBT[n]);
  }
  if (MASTERS.has(lp)) result.masters.push(`Life path ${lp} — ${MEANING[lp]}`);

  if (name && name.trim()) {
    const cmp = pythChaldCompare(name);
    result.pythagorean = {
      sum: cmp.pythagorean.sum,
      root: cmp.pythagorean.root,
      rootMaster: cmp.pythagorean.rootMaster,
      meaning: MEANING[cmp.pythagorean.rootMaster] ?? MEANING[cmp.pythagorean.root] ?? '',
    };
    result.chaldean = {
      sum: cmp.chaldean.sum,
      root: cmp.chaldean.root,
      rootMaster: cmp.chaldean.rootMaster,
      meaning: MEANING[cmp.chaldean.rootMaster] ?? MEANING[cmp.chaldean.root] ?? '',
    };

    // Expression = full name in each system
    result.expression = {
      chaldean: cmp.chaldean.rootMaster,
      pythagorean: cmp.pythagorean.rootMaster,
      meaningChaldean: MEANING[cmp.chaldean.rootMaster] ?? MEANING[cmp.chaldean.root] ?? '',
      meaningPythagorean: MEANING[cmp.pythagorean.rootMaster] ?? MEANING[cmp.pythagorean.root] ?? '',
    };

    const soulCh = vowelNumber(name, CHALDEAN);
    const soulPy = vowelNumber(name, PYTHAGOREAN);
    result.soulUrge = {
      chaldean: soulCh.rootMaster, pythagorean: soulPy.rootMaster,
      meaningChaldean: MEANING[soulCh.rootMaster] ?? MEANING[soulCh.root] ?? '',
      meaningPythagorean: MEANING[soulPy.rootMaster] ?? MEANING[soulPy.root] ?? '',
    };

    const perCh = consonantNumber(name, CHALDEAN);
    const perPy = consonantNumber(name, PYTHAGOREAN);
    result.personality = {
      chaldean: perCh.rootMaster, pythagorean: perPy.rootMaster,
      meaningChaldean: MEANING[perCh.rootMaster] ?? MEANING[perCh.root] ?? '',
      meaningPythagorean: MEANING[perPy.rootMaster] ?? MEANING[perPy.root] ?? '',
    };

    if (MASTERS.has(cmp.chaldean.rootMaster)) result.masters.push(`Chaldean expression ${cmp.chaldean.rootMaster}`);
    if (MASTERS.has(cmp.pythagorean.rootMaster)) result.masters.push(`Pythagorean expression ${cmp.pythagorean.rootMaster}`);
  }

  return result;
}
