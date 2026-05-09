// Phase 12 — Gemstone recommendation engine.
//
// Vedic gem prescription is not about "my sign → my stone". The classical
// method is:
//   1. Identify yogakaraka & functional benefics for the ascendant.
//   2. Identify weak functional benefics that can be boosted via their ratna.
//   3. Identify enemies / maraka planets whose stones must be AVOIDED.
//   4. Compute weight in ratti from age + body constitution (simplified).
//   5. Compute wearing muhurat (day + nakshatra + hora).
//
// This service layers over `kundali.service` + `strength.service`.

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { calculateShadbala } from './strength.service';
import { Locale, p, pf, translator } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

// ═══════════════════════════════════════════════════════════════════════════
// Static catalogue — primary + up-ratna + wearing protocol
// ═══════════════════════════════════════════════════════════════════════════

export interface GemstoneEntry {
  planet: PlanetId;
  primary: string;
  primaryHi: string;
  upRatnas: string[];                // substitute stones
  metal: 'Gold' | 'Silver' | 'Copper' | 'Panchadhatu' | 'Ashtadhatu' | 'Platinum';
  finger: 'Ring' | 'Index' | 'Middle' | 'Little';
  hand: 'right' | 'either';
  day: string;
  weekdayNum: number;                // 0=Sun..6=Sat
  nakshatrasFavor: string[];         // nakshatras favorable for wearing
  horaPlanet: PlanetId;              // ideal planetary hour
  mantraCount: number;               // japas before wearing
  colour: string;
  baseWeight: { minRatti: number; maxRatti: number };
  // 1 ratti ≈ 0.182 g ≈ 0.91 carat
  rattiToCarat: number;
}

export const GEMSTONES: Record<PlanetId, GemstoneEntry> = {
  SU: {
    planet: 'SU', primary: 'Ruby', primaryHi: 'माणिक्य',
    upRatnas: ['Red Spinel', 'Red Garnet', 'Red Tourmaline', 'Rubellite'],
    metal: 'Gold', finger: 'Ring', hand: 'right',
    day: 'Sunday', weekdayNum: 0,
    nakshatrasFavor: ['Krittika', 'Uttara-phalguni', 'Uttara-ashadha'],
    horaPlanet: 'SU', mantraCount: 7000,
    colour: 'Red / pigeon-blood',
    baseWeight: { minRatti: 3, maxRatti: 6 }, rattiToCarat: 0.91,
  },
  MO: {
    planet: 'MO', primary: 'Pearl', primaryHi: 'मोती',
    upRatnas: ['Moonstone', 'White Coral', 'Cultured Pearl'],
    metal: 'Silver', finger: 'Little', hand: 'right',
    day: 'Monday', weekdayNum: 1,
    nakshatrasFavor: ['Rohini', 'Hasta', 'Shravana'],
    horaPlanet: 'MO', mantraCount: 11000,
    colour: 'Lustrous white',
    baseWeight: { minRatti: 4, maxRatti: 8 }, rattiToCarat: 0.91,
  },
  MA: {
    planet: 'MA', primary: 'Red Coral', primaryHi: 'मूंगा',
    upRatnas: ['Carnelian', 'Red Jasper', 'Sardonyx'],
    metal: 'Copper', finger: 'Ring', hand: 'right',
    day: 'Tuesday', weekdayNum: 2,
    nakshatrasFavor: ['Mrigashira', 'Chitra', 'Dhanishtha'],
    horaPlanet: 'MA', mantraCount: 10000,
    colour: 'Red / orange',
    baseWeight: { minRatti: 5, maxRatti: 10 }, rattiToCarat: 0.91,
  },
  ME: {
    planet: 'ME', primary: 'Emerald', primaryHi: 'पन्ना',
    upRatnas: ['Peridot', 'Green Tourmaline', 'Green Aventurine'],
    metal: 'Gold', finger: 'Little', hand: 'right',
    day: 'Wednesday', weekdayNum: 3,
    nakshatrasFavor: ['Ashlesha', 'Jyeshtha', 'Revati'],
    horaPlanet: 'ME', mantraCount: 9000,
    colour: 'Green',
    baseWeight: { minRatti: 3, maxRatti: 6 }, rattiToCarat: 0.91,
  },
  JU: {
    planet: 'JU', primary: 'Yellow Sapphire', primaryHi: 'पुखराज',
    upRatnas: ['Yellow Topaz', 'Yellow Citrine', 'Yellow Beryl (Heliodor)'],
    metal: 'Gold', finger: 'Index', hand: 'right',
    day: 'Thursday', weekdayNum: 4,
    nakshatrasFavor: ['Punarvasu', 'Vishakha', 'Purva-bhadrapada'],
    horaPlanet: 'JU', mantraCount: 19000,
    colour: 'Yellow / honey',
    baseWeight: { minRatti: 3, maxRatti: 6 }, rattiToCarat: 0.91,
  },
  VE: {
    planet: 'VE', primary: 'Diamond', primaryHi: 'हीरा',
    upRatnas: ['White Sapphire', 'White Topaz', 'Zircon', 'Quartz Crystal'],
    metal: 'Platinum', finger: 'Little', hand: 'right',
    day: 'Friday', weekdayNum: 5,
    nakshatrasFavor: ['Bharani', 'Purva-phalguni', 'Purva-ashadha'],
    horaPlanet: 'VE', mantraCount: 16000,
    colour: 'White / clear',
    baseWeight: { minRatti: 0.5, maxRatti: 1.5 }, rattiToCarat: 0.91,
  },
  SA: {
    planet: 'SA', primary: 'Blue Sapphire', primaryHi: 'नीलम',
    upRatnas: ['Amethyst', 'Iolite', 'Lapis Lazuli', 'Tanzanite'],
    metal: 'Panchadhatu', finger: 'Middle', hand: 'right',
    day: 'Saturday', weekdayNum: 6,
    nakshatrasFavor: ['Pushya', 'Anuradha', 'Uttara-bhadrapada'],
    horaPlanet: 'SA', mantraCount: 23000,
    colour: 'Blue / cornflower',
    baseWeight: { minRatti: 3, maxRatti: 6 }, rattiToCarat: 0.91,
  },
  RA: {
    planet: 'RA', primary: 'Hessonite Garnet (Gomed)', primaryHi: 'गोमेद',
    upRatnas: ['Orange Zircon', 'Honey-Gomedaka', 'Spessartite Garnet'],
    metal: 'Ashtadhatu', finger: 'Middle', hand: 'right',
    day: 'Saturday', weekdayNum: 6,
    nakshatrasFavor: ['Ardra', 'Swati', 'Shatabhisha'],
    horaPlanet: 'SA', mantraCount: 18000,
    colour: 'Honey-brown',
    baseWeight: { minRatti: 4, maxRatti: 8 }, rattiToCarat: 0.91,
  },
  KE: {
    planet: 'KE', primary: "Cat's Eye (Lehsuniya)", primaryHi: 'लहसुनिया',
    upRatnas: ['Chrysoberyl', 'Tiger Eye', 'Quartz Cat-eye'],
    metal: 'Ashtadhatu', finger: 'Ring', hand: 'right',
    day: 'Tuesday', weekdayNum: 2,
    nakshatrasFavor: ['Ashwini', 'Magha', 'Mula'],
    horaPlanet: 'KE', mantraCount: 17000,
    colour: 'Smoky / golden-yellow',
    baseWeight: { minRatti: 3, maxRatti: 6 }, rattiToCarat: 0.91,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// Functional benefic / malefic classification per ascendant
// ═══════════════════════════════════════════════════════════════════════════
// Simplified classical table. For each ascendant (1..12), lists which planets
// are yogakarakas (strongly benefic), functional benefics, and functional
// malefics / marakas.

interface FunctionalProfile {
  yogakaraka?: PlanetId;             // strongest functional benefic
  functionalBenefics: PlanetId[];    // prescribe their stones
  functionalMalefics: PlanetId[];    // avoid or use very cautiously
  maraka: PlanetId[];                // death-inflicting — strictly avoid gem
}

const PROFILES: Record<number, FunctionalProfile> = {
  1:  { functionalBenefics: ['SU','MA','JU'],      functionalMalefics: ['ME','VE','SA'],      maraka: ['VE','SA'] },         // Aries
  2:  { yogakaraka: 'SA',
        functionalBenefics: ['ME','SA','VE'],      functionalMalefics: ['MO','JU'],           maraka: ['JU','MA'] },         // Taurus
  3:  { functionalBenefics: ['VE','SA'],           functionalMalefics: ['MA','JU'],           maraka: ['JU','MA'] },         // Gemini
  4:  { yogakaraka: 'MA',
        functionalBenefics: ['MA','JU'],           functionalMalefics: ['ME','VE','SA'],      maraka: ['SA','VE'] },         // Cancer
  5:  { functionalBenefics: ['SU','MA','JU'],      functionalMalefics: ['ME','VE','SA'],      maraka: ['SA','VE'] },         // Leo
  6:  { functionalBenefics: ['VE','ME'],           functionalMalefics: ['MA','JU'],           maraka: ['JU','MA'] },         // Virgo
  7:  { yogakaraka: 'SA',
        functionalBenefics: ['ME','SA','VE'],      functionalMalefics: ['SU','JU'],           maraka: ['JU','SU'] },         // Libra
  8:  { functionalBenefics: ['SU','JU','MO'],      functionalMalefics: ['ME','VE'],           maraka: ['ME','VE'] },         // Scorpio
  9:  { yogakaraka: 'MA',                          // in classical, Mars is yogakaraka for Sag
        functionalBenefics: ['SU','MA','JU'],      functionalMalefics: ['VE','ME'],           maraka: ['VE','ME'] },         // Sagittarius
  10: { yogakaraka: 'VE',
        functionalBenefics: ['VE','ME','SA'],      functionalMalefics: ['MA','JU'],           maraka: ['JU','MA'] },         // Capricorn
  11: { yogakaraka: 'VE',
        functionalBenefics: ['VE','ME','SA'],      functionalMalefics: ['MA','JU','MO'],      maraka: ['MO','JU'] },         // Aquarius
  12: { functionalBenefics: ['MA','JU','MO'],      functionalMalefics: ['SU','ME','VE','SA'], maraka: ['SA','ME','VE'] },    // Pisces
};

// ═══════════════════════════════════════════════════════════════════════════
// Recommendation engine
// ═══════════════════════════════════════════════════════════════════════════

export type Verdict = 'strongly recommended' | 'recommended' | 'optional' | 'avoid' | 'strictly avoid';

export interface GemRecommendation {
  planet: PlanetId;
  gemstone: GemstoneEntry;
  verdict: Verdict;                  // localized in output
  reasons: string[];                 // localized
  weightRatti: number;               // recommended weight for this person
  weightCarat: number;
  priorityScore: number;             // sort desc — higher = more urgent
}

export interface WearingMuhurat {
  day: string;
  nextDateISO: string;               // next matching weekday from today (UTC)
  horaPlanet: PlanetId;
  bestHours: string[];               // horas of the day-ruling planet
  mantraCount: number;
  nakshatraPreference: string[];
  procedure: string[];
}

export interface GemstoneReportInput {
  ageYears?: number;                 // for weight scaling
  bodyFrame?: 'small' | 'medium' | 'large';
  referenceDateISO?: string;         // for next muhurat — defaults to today
}

export interface GemstoneReport {
  ascendant: { num: number; name: string; lord: PlanetId };
  recommendations: GemRecommendation[];
  avoid: GemRecommendation[];
  primary: GemRecommendation | null;
  upRatnaFor?: GemRecommendation;
  wearingMuhurat: WearingMuhurat | null;
  note: string;
}

function weightFor(entry: GemstoneEntry, opts: GemstoneReportInput): number {
  // Base midpoint scaled by age and frame.
  const mid = (entry.baseWeight.minRatti + entry.baseWeight.maxRatti) / 2;
  const age = opts.ageYears ?? 30;
  const frame = opts.bodyFrame ?? 'medium';
  const ageScale = age < 18 ? 0.7 : age < 35 ? 1.0 : age < 55 ? 1.1 : 0.9;
  const frameScale = frame === 'small' ? 0.85 : frame === 'large' ? 1.15 : 1.0;
  const raw = mid * ageScale * frameScale;
  const clamped = Math.max(entry.baseWeight.minRatti, Math.min(entry.baseWeight.maxRatti, raw));
  return +clamped.toFixed(2);
}

function nextWeekdayISO(weekdayNum: number, fromISO?: string): string {
  const now = fromISO ? new Date(fromISO) : new Date();
  const current = now.getUTCDay();
  let diff = (weekdayNum - current + 7) % 7;
  if (diff === 0) diff = 7;  // next occurrence, not today
  const target = new Date(now.getTime() + diff * 86400_000);
  return target.toISOString().slice(0, 10);
}

// Simplified Chaldean hora for the target day — list hours of day
// (sunrise +0h..+11h) where the gem's planet rules the hora.
const CHALDEAN = ['SA','JU','MA','SU','VE','ME','MO'] as const;
const WEEKDAY_LORD: Record<number, PlanetId> = {
  0: 'SU', 1: 'MO', 2: 'MA', 3: 'ME', 4: 'JU', 5: 'VE', 6: 'SA',
};

function hoursOfPlanet(weekdayNum: number, targetPlanet: PlanetId, locale: Locale): string[] {
  // First hora of the day = weekday lord. Then Chaldean order (reverse).
  const startLord = WEEKDAY_LORD[weekdayNum];
  const startIdx = CHALDEAN.indexOf(startLord);
  const hits: string[] = [];
  for (let h = 0; h < 12; h++) {
    const idx = (startIdx + h) % 7;
    if (CHALDEAN[idx] === targetPlanet) {
      const hStart = h;
      const hEnd = h + 1;
      hits.push(pf('gemstone.hour.fromSunrise', locale,
        { h1: String(hStart), h2: String(hEnd) },
        `Sunrise +${hStart}:00 → +${hEnd}:00`));
    }
  }
  return hits;
}

/**
 * Localize a single GemstoneEntry — closed-set fields go through the
 * translator helpers; free fields (primaryHi, weights, weekdayNum, etc.)
 * are passed through. The shape is preserved so the client doesn't have
 * to branch on locale.
 */
function localizeEntry(entry: GemstoneEntry, locale: Locale): GemstoneEntry {
  const t = translator(locale);
  const al = astroLabels(locale);
  return {
    ...entry,
    primary:        t.gemstone(entry.primary),
    upRatnas:       entry.upRatnas.map((u) => t.gemstoneSubstitute(u)),
    metal:          t.metal(entry.metal) as GemstoneEntry['metal'],
    finger:         t.finger(entry.finger) as GemstoneEntry['finger'],
    day:            al.vara(entry.day),
    colour:         t.colour(entry.colour),
    // hand stays as a closed enum — translate via a small phrasebook
    hand:           p(`gemstone.hand.${entry.hand}`, locale, entry.hand) as GemstoneEntry['hand'],
  };
}

export function computeGemstoneReport(
  k: KundaliResult,
  opts: GemstoneReportInput = {},
  locale: Locale = 'en',
): GemstoneReport {
  const t = translator(locale);
  const al = astroLabels(locale);
  const ascNum = k.ascendant.rashi.num;
  const ascLord = RASHIS[ascNum - 1].lord;
  const profile = PROFILES[ascNum] || {
    functionalBenefics: [], functionalMalefics: [], maraka: [],
  };

  const shadbala = calculateShadbala(k);
  const strengthMap = new Map(shadbala.planets.map((p) => [p.planet, p]));

  const order: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA', 'RA', 'KE'];
  const recs: GemRecommendation[] = [];

  for (const pid of order) {
    const gem = GEMSTONES[pid];
    const reasons: string[] = [];
    let score = 0;
    let verdict: Verdict = 'optional';

    const isYK = profile.yogakaraka === pid;
    const isFB = profile.functionalBenefics.includes(pid);
    const isFM = profile.functionalMalefics.includes(pid);
    const isMaraka = profile.maraka.includes(pid);
    const isAscLord = pid === ascLord;
    const planetPos = k.planets.find((p) => p.id === pid);
    const strength = strengthMap.get(pid);
    const isWeak = strength && strength.category === 'weak';
    const isVeryStrong = strength && strength.category === 'very strong';
    const isDebilitated = planetPos?.debilitated;
    const isCombust = planetPos?.combust;
    const isExalted = planetPos?.exalted;

    // Positive signals
    if (isYK) {
      score += 5;
      reasons.push(pf('gemstone.reason.yogakaraka', locale,
        { rashi: al.rashi(ascNum) },
        `Yogakaraka for ${RASHIS[ascNum - 1].name} ascendant`));
    }
    if (isAscLord)  { score += 4; reasons.push(p('gemstone.reason.ascLord',           locale, 'Ascendant lord')); }
    if (isFB)       { score += 3; reasons.push(p('gemstone.reason.functionalBenefic', locale, 'Functional benefic')); }
    if (isWeak && (isFB || isAscLord || isYK)) {
      score += 2; reasons.push(p('gemstone.reason.weakBenefic', locale, 'Weak but benefic — stone will boost'));
    }
    if (isDebilitated && (isFB || isAscLord || isYK)) {
      score += 2; reasons.push(p('gemstone.reason.debilitatedBenefic', locale, 'Debilitated benefic — urgent remedy'));
    }

    // Negative signals
    if (isMaraka)   { score -= 6; reasons.push(p('gemstone.reason.maraka', locale, 'MARAKA — maraka stones can trigger severe issues')); }
    if (isFM && !isFB) { score -= 3; reasons.push(p('gemstone.reason.functionalMalefic', locale, 'Functional malefic for this ascendant')); }
    if (pid === 'RA' || pid === 'KE') {
      score -= 2;
      reasons.push(pid === 'RA'
        ? p('gemstone.reason.rahuCaution', locale, 'Rahu stones amplify karmic extremes — use cautiously')
        : p('gemstone.reason.ketuCaution', locale, 'Ketu stones accelerate detachment — use cautiously'));
    }
    if (isVeryStrong && (isFB || isYK)) {
      score -= 1; reasons.push(p('gemstone.reason.veryStrong', locale, 'Already very strong — stone may overload'));
    }
    if (isCombust) { reasons.push(p('gemstone.reason.combust', locale, 'Combust — stone helps reclaim voice')); score += 1; }
    if (isExalted) { reasons.push(p('gemstone.reason.exalted', locale, 'Exalted — already radiant; stone optional')); score -= 1; }

    // Translate score → verdict
    if (score >= 6)        verdict = 'strongly recommended';
    else if (score >= 3)   verdict = 'recommended';
    else if (score <= -5)  verdict = 'strictly avoid';
    else if (score <= -2)  verdict = 'avoid';
    else                   verdict = 'optional';

    const ratti = weightFor(gem, opts);
    const carat = +(ratti * gem.rattiToCarat).toFixed(2);

    recs.push({
      planet: pid,
      gemstone: localizeEntry(gem, locale),
      verdict: p(`gemstone.verdict.${verdict}`, locale, verdict) as Verdict,
      reasons,
      weightRatti: ratti,
      weightCarat: carat,
      priorityScore: score,
    });
  }

  recs.sort((a, b) => b.priorityScore - a.priorityScore);

  // Match against the localized verdict strings.
  const verdictStrong   = p('gemstone.verdict.strongly recommended', locale, 'strongly recommended');
  const verdictRec      = p('gemstone.verdict.recommended',          locale, 'recommended');
  const verdictAvoid    = p('gemstone.verdict.avoid',                locale, 'avoid');
  const verdictStrictly = p('gemstone.verdict.strictly avoid',       locale, 'strictly avoid');

  const primary = recs.find((r) => r.verdict === verdictStrong || r.verdict === verdictRec) || null;
  const avoid = recs.filter((r) => r.verdict === verdictAvoid || r.verdict === verdictStrictly);
  const upRatnaFor = primary;  // up-ratnas belong to the primary recommendation

  // Source the primary's RAW (English) gem entry so we can localize muhurat
  // strings off the canonical keys (we already localized `primary.gemstone`
  // for output but keeping a raw handle keeps the procedure formatter clean).
  const primaryRaw = primary ? GEMSTONES[primary.planet] : null;

  const wearingMuhurat: WearingMuhurat | null = (primary && primaryRaw) ? {
    day: al.vara(primaryRaw.day),
    nextDateISO: nextWeekdayISO(primaryRaw.weekdayNum, opts.referenceDateISO),
    horaPlanet: primaryRaw.horaPlanet,
    bestHours: hoursOfPlanet(primaryRaw.weekdayNum, primaryRaw.horaPlanet, locale),
    mantraCount: primaryRaw.mantraCount,
    nakshatraPreference: primaryRaw.nakshatrasFavor.map((n) => al.nakshatraByName(n)),
    procedure: [
      pf('gemstone.procedure.bathe', locale,
         { colour: t.colour(primaryRaw.colour) },
         `Bathe and wear clean clothes in the gemstone's colour (${primaryRaw.colour}).`),
      p('gemstone.procedure.cleanse', locale,
        'Cleanse the ring in Gangajal / unboiled milk / honey + ghee + tulsi for 15 min.'),
      pf('gemstone.procedure.placeOnPlate', locale,
         {
           metal: t.metal(primaryRaw.metal).toLowerCase(),
           direction: t.direction(
             primaryRaw.planet === 'SA' ? 'West' : 'East',
           ),
         },
         `Place on a ${primaryRaw.metal.toLowerCase()} plate facing ${primaryRaw.planet === 'SA' ? 'west' : 'east'}.`),
      pf('gemstone.procedure.reciteMantra', locale,
         { count: String(primaryRaw.mantraCount) },
         `Recite bija mantra ${primaryRaw.mantraCount} times (or in multiples of 108).`),
      pf('gemstone.procedure.wear', locale,
         {
           finger: t.finger(primaryRaw.finger).toLowerCase(),
           hand:   p(`gemstone.hand.${primaryRaw.hand}`, locale, primaryRaw.hand),
         },
         `Wear on ${primaryRaw.finger.toLowerCase()} finger of ${primaryRaw.hand} hand during the chosen hora.`),
      p('gemstone.procedure.observe', locale,
        'Observe for 30-40 days; discontinue if discomfort appears.'),
    ],
  } : null;

  let note = '';
  if (!primary || !primaryRaw) {
    note = p('gemstone.note.noFavorable', locale,
      'No strongly favorable graha in this chart — consider spiritual remedies (mantra, charity, yantra) over gemstones.');
  } else {
    note = pf('gemstone.note.primary', locale, {
      stone:  t.gemstone(primaryRaw.primary),
      planet: al.planet(primary.planet),
      ratti:  String(primary.weightRatti),
      carat:  String(primary.weightCarat),
      metal:  t.metal(primaryRaw.metal).toLowerCase(),
      finger: t.finger(primaryRaw.finger).toLowerCase(),
    },
    `Primary recommendation: ${primaryRaw.primary} for ${primary.planet}. ` +
    `Wear ${primary.weightRatti} ratti (~${primary.weightCarat} carat) set in ${primaryRaw.metal.toLowerCase()} on the ${primaryRaw.finger.toLowerCase()} finger.`);
  }

  return {
    ascendant: { num: ascNum, name: al.rashi(ascNum), lord: ascLord },
    recommendations: recs,
    avoid,
    primary,
    upRatnaFor: upRatnaFor || undefined,
    wearingMuhurat,
    note,
  };
}

export function listGemstones(locale: Locale = 'en'): GemstoneEntry[] {
  const order: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA', 'RA', 'KE'];
  return order.map((pl) => localizeEntry(GEMSTONES[pl], locale));
}
