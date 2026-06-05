// Advanced Prashna schools — classical horary systems layered on top of a
// horary (prashna) chart already cast via prashna.service.
//
//   • Tajika prashna   — Itthasala/Ishraaf/Muthashila on the horary chart
//                         with a verdict scoring on the querent–quesited pair.
//   • Narchintamani    — 12-bhava classification from Kerala tradition
//                         (Gopala Panikkar) with sidelong bhava-phala.
//   • Shatpanchasika   — Prithuyasas' 56-sutras distilled into a rule book
//                         producing timing + outcome signals.
//   • Swara / Breath   — nostril (ida/pingala/sushumna), direction of the
//                         querent, and prashna-moment pañca-tattva.
//   • Arudha prashna   — arudha-lagna, arudha-padas for the prashna chart
//                         with verdicts on where the quesited "appears".
//
// All functions take a PrashnaResult (from prashna.service) — no new birth
// input required. Output is plain JSON, no side effects.

import { PlanetId, RASHIS, NAKSHATRAS, NAK_SPAN, normDeg } from '../utils/astro-constants';
import { KundaliResult, PlanetPosition } from './kundali.service';
import { PrashnaResult, PrashnaCategory } from './prashna.service';

// ═══════════════════════════════════════════════════════════════════════════
// 1. Tajika Prashna
// ═══════════════════════════════════════════════════════════════════════════
// Lagna represents querent; quesited's bhava represents the matter. We scan
// for Itthasala/Ishraaf between:
//   • Lagna-lord  (querent)
//   • Quesited-house lord (matter)
//   • Moon (confirming witness)

const DEEPTAMSHA: Record<PlanetId, number> = {
  SU: 15, MO: 12, MA: 8, ME: 7, JU: 9, VE: 7, SA: 9, RA: 15, KE: 15,
};

const CATEGORY_HOUSE: Record<PrashnaCategory, number> = {
  marriage: 7, career: 10, health: 1, progeny: 5, property: 4,
  travel: 3, litigation: 6, finance: 2, education: 4,
};

type TajikaAspect = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
const ANGLES: Record<TajikaAspect, number> = {
  conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180,
};

function signedDist(a: number, b: number): number {
  return ((a - b + 540) % 360) - 180;
}

function orbBetween(a: PlanetPosition, b: PlanetPosition): number {
  return (DEEPTAMSHA[a.id] + DEEPTAMSHA[b.id]) / 2;
}

function detectPair(a: PlanetPosition, b: PlanetPosition) {
  const sep = Math.abs(signedDist(a.longitude, b.longitude));
  const orb = orbBetween(a, b);
  for (const [asp, ang] of Object.entries(ANGLES) as [TajikaAspect, number][]) {
    const diff = Math.abs(sep - ang);
    if (diff <= orb) {
      const fast = Math.abs(a.speed) >= Math.abs(b.speed) ? a : b;
      const slow = fast === a ? b : a;
      const fastTarget = (slow.longitude + ang + 360) % 360;
      const signed = signedDist(fastTarget, fast.longitude);
      const applying = signed * (fast.speed - slow.speed) > 0;
      return {
        a: a.id, b: b.id, aspect: asp,
        orb: +diff.toFixed(2),
        allowed: +orb.toFixed(2),
        relation: asp === 'conjunction' ? 'Manahu' : (applying ? 'Itthasala' : 'Ishraaf'),
        applying,
      };
    }
  }
  return null;
}

function ruler(p: PrashnaResult, planetId: PlanetId): PlanetPosition | null {
  return p.chart.planets.find((x) => x.id === planetId) || null;
}

function lordOfSign(signNum: number): PlanetId {
  return RASHIS[signNum - 1].lord;
}

function signNumForHouse(chart: KundaliResult, houseNum: number): number {
  const ascSign = Math.floor(normDeg(chart.ascendant.longitude) / 30) + 1;
  return ((ascSign - 1 + houseNum - 1) % 12) + 1;
}

export interface TajikaPrashnaResult {
  category: PrashnaCategory;
  quesitedHouse: number;
  lagnaLord: PlanetId;
  quesitedLord: PlanetId;
  moonLord: PlanetId;
  pairs: Array<{
    between: string;
    relation: string;
    aspect: TajikaAspect;
    orb: number;
    allowed: number;
    applying: boolean;
  }>;
  verdict: 'yes' | 'no' | 'mixed';
  reasoning: string;
  score: number;          // -5..+5
}

export function computeTajikaPrashna(
  prashna: PrashnaResult,
  category: PrashnaCategory,
): TajikaPrashnaResult {
  const chart = prashna.chart;
  const quesitedHouse = CATEGORY_HOUSE[category];
  const ascSign = Math.floor(normDeg(chart.ascendant.longitude) / 30) + 1;
  const lagnaLord = lordOfSign(ascSign);
  const qSign = signNumForHouse(chart, quesitedHouse);
  const quesitedLord = lordOfSign(qSign);
  const moonPos = ruler(prashna, 'MO')!;
  const moonLord = NAKSHATRAS[Math.floor(normDeg(moonPos.longitude) / NAK_SPAN)].lord;

  const subjects: [PlanetId, PlanetId, string][] = [
    [lagnaLord, quesitedLord, 'Lagna lord ↔ Quesited lord'],
    [lagnaLord, 'MO',          'Lagna lord ↔ Moon'],
    ['MO',       quesitedLord, 'Moon ↔ Quesited lord'],
  ];

  const pairs: TajikaPrashnaResult['pairs'] = [];
  let score = 0;
  for (const [a, b, between] of subjects) {
    const pa = ruler(prashna, a);
    const pb = ruler(prashna, b);
    if (!pa || !pb || a === b) continue;
    const d = detectPair(pa, pb);
    if (!d) continue;
    pairs.push({ between, relation: d.relation, aspect: d.aspect, orb: d.orb, allowed: d.allowed, applying: d.applying });
    if (d.relation === 'Itthasala') score += 2;
    else if (d.relation === 'Manahu') score += 1;
    else if (d.relation === 'Ishraaf') score -= 1;
  }

  let verdict: 'yes' | 'no' | 'mixed' = 'mixed';
  if (score >= 3) verdict = 'yes';
  else if (score <= -1) verdict = 'no';

  const reasoning = pairs.length
    ? `${pairs.length} Tajika link${pairs.length === 1 ? '' : 's'}; net score ${score}. ` +
      (verdict === 'yes' ? 'Promise will materialise.' : verdict === 'no' ? 'Promise is past or broken.' : 'Mixed signals.')
    : 'No direct Tajika sambandha between querent/quesited/Moon lords — inconclusive.';

  return {
    category, quesitedHouse,
    lagnaLord, quesitedLord, moonLord,
    pairs, verdict, reasoning, score,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. Narchintamani Prashna (Kerala / Gopala Panikkar tradition)
// ═══════════════════════════════════════════════════════════════════════════
// Core tenets distilled:
//   • Lagna strength by tenancy of benefic/malefic/kendra/trikona
//   • Moon's navamsa dignity
//   • "Pancha-swaras" — 5 lords (lagna, dasha, hora, nakshatra, amsa of Moon)
//   • Kendra / trikona occupation by natural benefics
//   • Tithi classification (Purna / Siddha / Bhadra / Nanda)

const NATURAL_BENEFICS: PlanetId[] = ['JU', 'VE', 'MO', 'ME'];
const NATURAL_MALEFICS: PlanetId[] = ['SA', 'MA', 'SU', 'RA', 'KE'];

const TITHI_GROUP: Record<number, 'Nanda' | 'Bhadra' | 'Jaya' | 'Rikta' | 'Purna'> = {
  1: 'Nanda',  2: 'Bhadra', 3: 'Jaya', 4: 'Rikta', 5: 'Purna',
  6: 'Nanda',  7: 'Bhadra', 8: 'Jaya', 9: 'Rikta', 10:'Purna',
  11:'Nanda',  12:'Bhadra', 13:'Jaya', 14:'Rikta', 15:'Purna',
  16:'Nanda',  17:'Bhadra', 18:'Jaya', 19:'Rikta', 20:'Purna',
  21:'Nanda',  22:'Bhadra', 23:'Jaya', 24:'Rikta', 25:'Purna',
  26:'Nanda',  27:'Bhadra', 28:'Jaya', 29:'Rikta', 30:'Purna',
};

function housesOccupiedBy(chart: KundaliResult, ids: PlanetId[]): Set<number> {
  const s = new Set<number>();
  for (const p of chart.planets) if (ids.includes(p.id)) s.add(p.house);
  return s;
}

export interface NarchintamaniResult {
  lagnaStrength: 'strong' | 'moderate' | 'weak';
  moonStrength: 'strong' | 'moderate' | 'weak';
  kendra: { occupiedBy: string[]; beneficCount: number; maleficCount: number };
  trikona: { occupiedBy: string[]; beneficCount: number; maleficCount: number };
  tithiGroup: 'Nanda' | 'Bhadra' | 'Jaya' | 'Rikta' | 'Purna';
  panchaSwaras: { lagna: PlanetId; moon: PlanetId; hora: string; nakshatra: PlanetId; amsa: PlanetId };
  overall: 'favorable' | 'neutral' | 'unfavorable';
  notes: string[];
}

export function computeNarchintamani(
  prashna: PrashnaResult,
  tithiNum?: number,
  horaRuler?: string,
): NarchintamaniResult {
  const chart = prashna.chart;
  const ascSign = Math.floor(normDeg(chart.ascendant.longitude) / 30) + 1;
  const ascLord = RASHIS[ascSign - 1].lord;
  const moon = chart.planets.find((p) => p.id === 'MO')!;
  const moonSign = moon.rashi.num;
  const moonSignLord = RASHIS[moonSign - 1].lord;
  const moonNakLord = NAKSHATRAS[Math.floor(moon.longitude / NAK_SPAN) % 27].lord;
  // Moon's navamsa (D-9) lord:
  const navLong = (moon.longitude % 30) * 9;
  const navSign = Math.floor(navLong / 30) + 1;
  const moonNavLord = RASHIS[navSign - 1].lord;

  const beneficHouses = housesOccupiedBy(chart, NATURAL_BENEFICS);
  const maleficHouses = housesOccupiedBy(chart, NATURAL_MALEFICS);
  const kendras = [1, 4, 7, 10];
  const trikonas = [1, 5, 9];

  const kendraOcc = chart.planets.filter((p) => kendras.includes(p.house));
  const trikOcc   = chart.planets.filter((p) => trikonas.includes(p.house));

  const kendraBens = kendraOcc.filter((p) => NATURAL_BENEFICS.includes(p.id));
  const kendraMals = kendraOcc.filter((p) => NATURAL_MALEFICS.includes(p.id));
  const trikBens   = trikOcc.filter((p) => NATURAL_BENEFICS.includes(p.id));
  const trikMals   = trikOcc.filter((p) => NATURAL_MALEFICS.includes(p.id));

  const lagnaPlanet = chart.planets.find((p) => p.id === ascLord)!;
  const lagnaStrong =
    lagnaPlanet && (lagnaPlanet.exalted || lagnaPlanet.ownSign || kendras.includes(lagnaPlanet.house));
  const lagnaWeak =
    lagnaPlanet && (lagnaPlanet.debilitated || lagnaPlanet.combust || [6, 8, 12].includes(lagnaPlanet.house));
  const lagnaStrength: 'strong' | 'moderate' | 'weak' =
    lagnaStrong ? 'strong' : lagnaWeak ? 'weak' : 'moderate';

  const moonStrong =
    !moon.debilitated && !moon.combust && kendras.includes(moon.house) && beneficHouses.has(moon.house);
  const moonWeak = moon.debilitated || moon.combust || [6, 8, 12].includes(moon.house);
  const moonStrength: 'strong' | 'moderate' | 'weak' =
    moonStrong ? 'strong' : moonWeak ? 'weak' : 'moderate';

  const notes: string[] = [];
  let score = 0;
  if (lagnaStrength === 'strong') { score += 2; notes.push('लग्न स्वामी अच्छी स्थिति में'); }
  if (lagnaStrength === 'weak')   { score -= 2; notes.push('लग्न स्वामी पीड़ित'); }
  if (moonStrength === 'strong')  { score += 2; notes.push('चंद्र अच्छी स्थिति में'); }
  if (moonStrength === 'weak')    { score -= 2; notes.push('चंद्र कमज़ोर'); }
  score += kendraBens.length - kendraMals.length;
  score += trikBens.length - trikMals.length;
  if (kendraBens.length) notes.push(`${kendraBens.length} नैसर्गिक शुभ ग्रह केंद्र में`);
  if (kendraMals.length) notes.push(`${kendraMals.length} नैसर्गिक अशुभ ग्रह केंद्र में`);

  const tithiGroup = tithiNum ? TITHI_GROUP[tithiNum] ?? 'Purna' : 'Purna';
  if (['Jaya', 'Purna'].includes(tithiGroup)) { score += 1; notes.push(`तिथि समूह ${tithiGroup} सफलता के अनुकूल`); }
  if (tithiGroup === 'Rikta') { score -= 2; notes.push('रिक्ता तिथि — सावधानी बरतें'); }

  const overall: 'favorable' | 'neutral' | 'unfavorable' =
    score >= 3 ? 'favorable' : score <= -2 ? 'unfavorable' : 'neutral';

  return {
    lagnaStrength, moonStrength,
    kendra: { occupiedBy: kendraOcc.map((p) => p.id), beneficCount: kendraBens.length, maleficCount: kendraMals.length },
    trikona: { occupiedBy: trikOcc.map((p) => p.id), beneficCount: trikBens.length, maleficCount: trikMals.length },
    tithiGroup,
    panchaSwaras: { lagna: ascLord, moon: moonSignLord, hora: horaRuler || '—', nakshatra: moonNakLord, amsa: moonNavLord },
    overall,
    notes,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. Shatpanchasika (Prithuyasas — 56 sutras) — simplified rule selection
// ═══════════════════════════════════════════════════════════════════════════
// We encode ~20 of the most operational sutras (sutra 1–56 distilled) and
// return which sutras "fire" for the horary chart.

interface Sutra {
  id: number;
  text: string;
  fires(p: PrashnaResult): boolean;
  polarity: 'positive' | 'negative' | 'neutral';
}

const ANGULAR = [1, 4, 7, 10];
const DUSTHANA = [6, 8, 12];

const SUTRAS: Sutra[] = [
  { id: 1, text: 'लग्न में शुभ ग्रह — कार्य में सफलता', polarity: 'positive',
    fires: (p) => p.chart.planets.some((x) => NATURAL_BENEFICS.includes(x.id) && x.house === 1) },
  { id: 2, text: 'लग्न में अशुभ ग्रह — बाधाएँ', polarity: 'negative',
    fires: (p) => p.chart.planets.some((x) => NATURAL_MALEFICS.includes(x.id) && x.house === 1) },
  { id: 3, text: 'चंद्र केंद्र में — तीव्र परिणाम', polarity: 'positive',
    fires: (p) => { const m = p.chart.planets.find((x) => x.id === 'MO')!; return ANGULAR.includes(m.house); } },
  { id: 4, text: 'चंद्र त्रिक भाव में — विलंब या इनकार', polarity: 'negative',
    fires: (p) => { const m = p.chart.planets.find((x) => x.id === 'MO')!; return DUSTHANA.includes(m.house); } },
  { id: 5, text: 'गुरु की लग्न पर दृष्टि — रक्षात्मक और शुभ', polarity: 'positive',
    fires: (p) => {
      const j = p.chart.planets.find((x) => x.id === 'JU')!;
      return [1, 5, 7, 9].includes(((((1 - j.house) + 12) % 12) + 1));
    } },
  { id: 6, text: 'शनि 1/4/7/10 में — बाधाएँ, धीमा परिणाम', polarity: 'negative',
    fires: (p) => { const s = p.chart.planets.find((x) => x.id === 'SA')!; return ANGULAR.includes(s.house); } },
  { id: 7, text: 'लग्न स्वामी अस्त — पृच्छक की चिंता, समर्थन का अभाव', polarity: 'negative',
    fires: (p) => {
      const ascSign = Math.floor(normDeg(p.chart.ascendant.longitude) / 30) + 1;
      const l = p.chart.planets.find((x) => x.id === RASHIS[ascSign - 1].lord);
      return !!l && l.combust;
    } },
  { id: 8, text: 'लग्न स्वामी उच्च का — सम्मान के साथ अनुकूल परिणाम', polarity: 'positive',
    fires: (p) => {
      const ascSign = Math.floor(normDeg(p.chart.ascendant.longitude) / 30) + 1;
      const l = p.chart.planets.find((x) => x.id === RASHIS[ascSign - 1].lord);
      return !!l && l.exalted;
    } },
  { id: 9, text: 'चंद्र मृगशिरा / चित्रा / अनुराधा / रेवती में — शुभ चर', polarity: 'positive',
    fires: (p) => [5, 14, 17, 27].includes(p.chart.planets.find((x) => x.id === 'MO')!.nakshatra.num) },
  { id: 10, text: 'चंद्र भरणी / कृत्तिका / मूल / ज्येष्ठा में — कठोर', polarity: 'negative',
    fires: (p) => [2, 3, 19, 18].includes(p.chart.planets.find((x) => x.id === 'MO')!.nakshatra.num) },
  { id: 11, text: 'शुक्र केंद्र में — सुख, आनंद, मिलन की संभावना', polarity: 'positive',
    fires: (p) => ANGULAR.includes(p.chart.planets.find((x) => x.id === 'VE')!.house) },
  { id: 12, text: 'मंगल 7 या 8 में — संघर्ष, अलगाव', polarity: 'negative',
    fires: (p) => [7, 8].includes(p.chart.planets.find((x) => x.id === 'MA')!.house) },
  { id: 13, text: 'बुध केंद्र/त्रिकोण में — स्पष्टता, संचार, शुभ समाचार', polarity: 'positive',
    fires: (p) => [1, 4, 5, 7, 9, 10].includes(p.chart.planets.find((x) => x.id === 'ME')!.house) },
  { id: 14, text: 'राहु 6/8/12 में अशुभ ग्रह के साथ — छिपी बाधाएँ', polarity: 'negative',
    fires: (p) => {
      const r = p.chart.planets.find((x) => x.id === 'RA')!;
      if (!DUSTHANA.includes(r.house)) return false;
      return p.chart.planets.some((x) => NATURAL_MALEFICS.includes(x.id) && x.id !== 'RA' && x.house === r.house);
    } },
  { id: 15, text: 'केतु 1 में — वैराग्य, भौतिक प्रश्न की विफलता संभव', polarity: 'negative',
    fires: (p) => p.chart.planets.find((x) => x.id === 'KE')!.house === 1 },
  { id: 16, text: 'सूर्य 10 में — यश, पहचान, करियर के लिए हाँ', polarity: 'positive',
    fires: (p) => p.chart.planets.find((x) => x.id === 'SU')!.house === 10 },
  { id: 17, text: 'लग्न चर राशि में — परिवर्तन/गति/नई शुरुआत', polarity: 'neutral',
    fires: (p) => [1, 4, 7, 10].includes(Math.floor(normDeg(p.chart.ascendant.longitude) / 30) + 1) },
  { id: 18, text: 'लग्न स्थिर राशि में — स्थिरता, धीमा लेकिन निश्चित', polarity: 'neutral',
    fires: (p) => [2, 5, 8, 11].includes(Math.floor(normDeg(p.chart.ascendant.longitude) / 30) + 1) },
  { id: 19, text: 'लग्न द्विस्वभाव राशि में — दोहरे स्वभाव का परिणाम, विलंब', polarity: 'neutral',
    fires: (p) => [3, 6, 9, 12].includes(Math.floor(normDeg(p.chart.ascendant.longitude) / 30) + 1) },
  { id: 20, text: 'चंद्रमा शुक्ल पक्ष का — बढ़ती संभावनाएं', polarity: 'positive',
    fires: (p) => {
      const m = p.chart.planets.find((x) => x.id === 'MO')!;
      const s = p.chart.planets.find((x) => x.id === 'SU')!;
      const diff = normDeg(m.longitude - s.longitude);
      return diff > 0 && diff < 180;
    } },
];

export interface ShatpanchasikaResult {
  firedSutras: { id: number; text: string; polarity: 'positive' | 'negative' | 'neutral' }[];
  positive: number;
  negative: number;
  neutral: number;
  verdict: 'yes' | 'no' | 'mixed';
  score: number;
}

export function computeShatpanchasika(prashna: PrashnaResult): ShatpanchasikaResult {
  const fired: ShatpanchasikaResult['firedSutras'] = [];
  for (const s of SUTRAS) {
    try { if (s.fires(prashna)) fired.push({ id: s.id, text: s.text, polarity: s.polarity }); }
    catch { /* ignore malformed inputs */ }
  }
  const positive = fired.filter((f) => f.polarity === 'positive').length;
  const negative = fired.filter((f) => f.polarity === 'negative').length;
  const neutral  = fired.filter((f) => f.polarity === 'neutral').length;
  const score = positive - negative;
  const verdict: 'yes' | 'no' | 'mixed' =
    score >= 2 ? 'yes' : score <= -2 ? 'no' : 'mixed';
  return { firedSutras: fired, positive, negative, neutral, verdict, score };
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. Swara / Breath prashna (Shivasvarodaya tradition)
// ═══════════════════════════════════════════════════════════════════════════
// Determines the active nostril at the moment of query, based on:
//   • Day half (waxing pakṣa vs waning)
//   • Hours since sunrise (each nostril flows 2.5h, alternating 5 times/day)
//   • Questioner's direction from astrologer (encoded as E/W/N/S)
// The active swara + tattva (bhuta) + direction yields yes/no indication.

const BHUTAS = ['Prithvi', 'Jala', 'Agni', 'Vayu', 'Akasha'] as const;
type Bhuta = typeof BHUTAS[number];

const BHUTA_QUALITY: Record<Bhuta, 'auspicious' | 'mixed' | 'inauspicious'> = {
  Prithvi: 'auspicious', Jala: 'auspicious', Agni: 'inauspicious', Vayu: 'mixed', Akasha: 'inauspicious',
};

// Classical teaching: on bright-half days breath starts in Ida (left) at
// sunrise and alternates every 2.5h; on dark-half days it starts in Pingala.
function activeNostril(dayIndex: number, waxing: boolean, hoursSinceSunrise: number): 'Ida' | 'Pingala' | 'Sushumna' {
  // Sushumna windows: transitions between nostrils (~4 min each), simplified
  // to the boundary minutes within a 150-min (2.5h) period.
  const period = 2.5;
  const phase = (hoursSinceSunrise % (period * 2)) / period;      // 0..2
  const left = waxing;                                            // starts Ida if waxing
  const inLeft = phase < 1 ? left : !left;
  const fracIntoSlot = phase < 1 ? phase : phase - 1;
  if (fracIntoSlot < 0.04 || fracIntoSlot > 0.96) return 'Sushumna';
  return inLeft ? 'Ida' : 'Pingala';
}

function activeBhuta(hoursSinceSunrise: number): Bhuta {
  // Within each 2.5h nostril cycle, 5 bhutas run in order of duration:
  // Prithvi 20m, Jala 16m, Agni 12m, Vayu 8m, Akasha 4m (sums to 60m? no —
  // classical: 20+16+12+8+4 = 60, repeats 2.5× per swara cycle).
  const cycleMins = 60;
  const minsIntoCycle = ((hoursSinceSunrise * 60) % cycleMins + cycleMins) % cycleMins;
  const boundaries = [20, 36, 48, 56, 60];
  for (let i = 0; i < 5; i++) {
    if (minsIntoCycle < boundaries[i]) return BHUTAS[i];
  }
  return BHUTAS[4];
}

export type Direction = 'E' | 'W' | 'N' | 'S' | 'NE' | 'NW' | 'SE' | 'SW';
const FAVORING_DIR: Record<'Ida' | 'Pingala' | 'Sushumna', Direction[]> = {
  Ida:     ['N', 'E', 'NE'],
  Pingala: ['S', 'W', 'SW'],
  Sushumna: [],
};

export interface SwaraPrashnaInput {
  hoursSinceSunrise: number;
  waxing: boolean;
  weekdayNum: number;   // 0=Sun..6=Sat — for day-index context
  questionerDirection?: Direction;
}

export interface SwaraPrashnaResult {
  nostril: 'Ida' | 'Pingala' | 'Sushumna';
  bhuta: Bhuta;
  bhutaQuality: 'auspicious' | 'mixed' | 'inauspicious';
  directionMatch: 'favorable' | 'neutral' | 'unfavorable';
  verdict: 'yes' | 'no' | 'uncertain';
  notes: string[];
}

export function computeSwaraPrashna(input: SwaraPrashnaInput): SwaraPrashnaResult {
  const nostril = activeNostril(input.weekdayNum, input.waxing, input.hoursSinceSunrise);
  const bhuta = activeBhuta(input.hoursSinceSunrise);
  const bhutaQuality = BHUTA_QUALITY[bhuta];

  let directionMatch: SwaraPrashnaResult['directionMatch'] = 'neutral';
  if (input.questionerDirection && nostril !== 'Sushumna') {
    directionMatch = FAVORING_DIR[nostril].includes(input.questionerDirection) ? 'favorable' : 'unfavorable';
  }

  const notes: string[] = [];
  let score = 0;
  if (nostril === 'Ida') { score += 1; notes.push('इड़ा (बायां) स्वर — सौम्य, ग्रहणशील प्रश्नों के लिए अनुकूल'); }
  if (nostril === 'Pingala') { score += 1; notes.push('पिंगला (दायां) स्वर — गतिशील, क्रियाशील प्रश्नों के लिए अनुकूल'); }
  if (nostril === 'Sushumna') { score -= 1; notes.push('सुषुम्ना सक्रिय — प्रश्न टाल देना चाहिए'); }
  if (bhutaQuality === 'auspicious') { score += 1; notes.push(`${bhuta} तत्त्व प्रश्न का समर्थन करता है`); }
  if (bhutaQuality === 'inauspicious') { score -= 1; notes.push(`${bhuta} तत्त्व प्रतिकूल है`); }
  if (directionMatch === 'favorable') { score += 1; notes.push('पृच्छक अनुकूल दिशा में है'); }
  if (directionMatch === 'unfavorable') { score -= 1; notes.push('पृच्छक की दिशा प्रतिकूल है'); }

  const verdict: SwaraPrashnaResult['verdict'] =
    score >= 2 ? 'yes' : score <= -1 ? 'no' : 'uncertain';

  return { nostril, bhuta, bhutaQuality, directionMatch, verdict, notes };
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. Arudha Prashna
// ═══════════════════════════════════════════════════════════════════════════
// Arudha pada of a bhava: count from the house to its lord, then same count
// onward again. Classical rule: for house H with lord at house L, arudha-pada
// of H = house (H + 2*(L-H)) mod 12. Edge rules: if arudha = H or arudha = H+6,
// use H+10 or H+4 instead (arudha cannot be same or 7th from its own bhava).

function arudhaPada(house: number, lordHouse: number): number {
  const dist = ((lordHouse - house + 12) % 12);
  let arudha = ((house - 1 + 2 * dist) % 12) + 1;
  if (arudha === house) arudha = ((arudha - 1 + 9) % 12) + 1;
  if ((arudha + 6 - 1) % 12 + 1 === house) arudha = ((arudha - 1 + 3) % 12) + 1;
  return arudha;
}

export interface ArudhaPrashnaResult {
  arudhaLagna: number;                     // AL (house index 1..12)
  arudhaPadas: { house: number; lord: PlanetId; lordHouse: number; arudha: number }[];
  quesitedArudha?: { category: PrashnaCategory; quesitedHouse: number; arudha: number; tenants: PlanetId[] };
  notes: string[];
}

export function computeArudhaPrashna(
  prashna: PrashnaResult,
  category?: PrashnaCategory,
): ArudhaPrashnaResult {
  const chart = prashna.chart;
  const ascSign = Math.floor(normDeg(chart.ascendant.longitude) / 30) + 1;

  const padas: ArudhaPrashnaResult['arudhaPadas'] = [];
  for (let h = 1; h <= 12; h++) {
    const signOfHouse = ((ascSign - 1 + h - 1) % 12) + 1;
    const lord = RASHIS[signOfHouse - 1].lord;
    const lordPos = chart.planets.find((p) => p.id === lord);
    if (!lordPos) continue;
    padas.push({ house: h, lord, lordHouse: lordPos.house, arudha: arudhaPada(h, lordPos.house) });
  }

  const AL = padas.find((p) => p.house === 1)?.arudha || 1;

  let quesitedArudha: ArudhaPrashnaResult['quesitedArudha'];
  if (category) {
    const qHouse = CATEGORY_HOUSE[category];
    const row = padas.find((p) => p.house === qHouse);
    if (row) {
      const tenants = chart.planets.filter((pl) => pl.house === row.arudha).map((pl) => pl.id);
      quesitedArudha = { category, quesitedHouse: qHouse, arudha: row.arudha, tenants };
    }
  }

  const notes: string[] = [];
  notes.push(`अरुढ़ लग्न (AL) भाव ${AL} में है`);
  if (quesitedArudha) {
    notes.push(`${category} भाव ${quesitedArudha.arudha} में अरुढ़-पद के माध्यम से दिखता है`);
    if (quesitedArudha.tenants.length)
      notes.push(`अरुढ़-पद में ${quesitedArudha.tenants.join(', ')} स्थित हैं`);
    else
      notes.push('अरुढ़-पद खाली है — विषय को सक्रिय ऊर्जा का समर्थन नहीं है');
  }

  return { arudhaLagna: AL, arudhaPadas: padas, quesitedArudha, notes };
}
