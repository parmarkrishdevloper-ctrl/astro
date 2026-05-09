// Phase 18 — Chart-to-chart comparison narrative.
//
// Synastry-style NLG: given two natal charts (A and B), describe how each
// person's planets sit in the other's house framework, where the Moons fall
// on each side, and the resulting compatibility signal.
//
// This is independent from the gun-milan numeric engine in matching.service —
// it consumes any two charts (not strictly bride/groom) and produces multi-
// paragraph narrative in the requested locale.

import type { KundaliResult } from './kundali.service';
import { matchKundalis } from './matching.service';
import type { Locale } from '../i18n';
import { tPlanet, tRashi } from '../i18n';
import { getPhrasebook, fill, Phrasebook } from './phrasebook';
import { normDeg } from '../utils/astro-constants';

export interface CompareNarrative {
  locale: Locale;
  /** Best-effort gun-milan score (only when the natal charts can supply Moon nakshatras). */
  gunMilanScore?: number;
  /** Five qualitative buckets the engine produces. */
  compatibility: 'excellent' | 'good' | 'moderate' | 'challenging';
  paragraphs: { heading: string; text: string }[];
  overlays: {
    /** Person A's planet, falling in Person B's house framework. */
    aOnB: { planet: string; house: number; meaning: string }[];
    bOnA: { planet: string; house: number; meaning: string }[];
  };
  moonAxis: {
    aMoonSign: string;
    bMoonSign: string;
    relativeHouse: number; // B's moon sign as house from A's moon
    note: string;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function houseFromAscendant(ascLong: number, planetLong: number): number {
  const lagnaIdx = Math.floor(normDeg(ascLong) / 30);
  const planetIdx = Math.floor(normDeg(planetLong) / 30);
  return ((planetIdx - lagnaIdx + 12) % 12) + 1;
}

function houseFromMoon(moonLong: number, otherSignNum: number): number {
  const moonIdx = Math.floor(normDeg(moonLong) / 30);
  const targetIdx = otherSignNum - 1;
  return ((targetIdx - moonIdx + 12) % 12) + 1;
}

function meaningFor(houseNum: number, pb: Phrasebook): string {
  return pb.house[houseNum] ?? '';
}

function compatibilityBucket(score: number): CompareNarrative['compatibility'] {
  if (score >= 28) return 'excellent';
  if (score >= 22) return 'good';
  if (score >= 16) return 'moderate';
  return 'challenging';
}

// ─── Section builders ───────────────────────────────────────────────────────

function bodyOverview(a: KundaliResult, b: KundaliResult, pb: Phrasebook, locale: Locale): string {
  const aMoon = a.planets.find((p) => p.id === 'MO')!;
  const bMoon = b.planets.find((p) => p.id === 'MO')!;
  const aSun = a.planets.find((p) => p.id === 'SU')!;
  const bSun = b.planets.find((p) => p.id === 'SU')!;

  if (locale === 'hi') {
    return `कुंडली A: लग्न ${tRashi(locale, a.ascendant.rashi.num)}, चंद्र ${tRashi(locale, aMoon.rashi.num)}, सूर्य ${tRashi(locale, aSun.rashi.num)}। कुंडली B: लग्न ${tRashi(locale, b.ascendant.rashi.num)}, चंद्र ${tRashi(locale, bMoon.rashi.num)}, सूर्य ${tRashi(locale, bSun.rashi.num)}।`;
  }
  if (locale === 'gu') {
    return `કુંડળી A: લગ્ન ${tRashi(locale, a.ascendant.rashi.num)}, ચંદ્ર ${tRashi(locale, aMoon.rashi.num)}. કુંડળી B: લગ્ન ${tRashi(locale, b.ascendant.rashi.num)}, ચંદ્ર ${tRashi(locale, bMoon.rashi.num)}.`;
  }
  if (locale === 'sa') {
    return `जातकः A: लग्नं ${tRashi(locale, a.ascendant.rashi.num)}, चन्द्रः ${tRashi(locale, aMoon.rashi.num)}॥ जातकः B: लग्नं ${tRashi(locale, b.ascendant.rashi.num)}, चन्द्रः ${tRashi(locale, bMoon.rashi.num)}॥`;
  }
  return `Chart A rises in ${tRashi(locale, a.ascendant.rashi.num)} with Moon in ${tRashi(locale, aMoon.rashi.num)} and Sun in ${tRashi(locale, aSun.rashi.num)}. Chart B rises in ${tRashi(locale, b.ascendant.rashi.num)} with Moon in ${tRashi(locale, bMoon.rashi.num)} and Sun in ${tRashi(locale, bSun.rashi.num)}.`;
}

function bodyOverlays(
  a: KundaliResult,
  b: KundaliResult,
  pb: Phrasebook,
  locale: Locale,
): { aOnB: CompareNarrative['overlays']['aOnB']; bOnA: CompareNarrative['overlays']['bOnA']; text: string } {
  const aOnB: CompareNarrative['overlays']['aOnB'] = a.planets.map((p) => {
    const h = houseFromAscendant(b.ascendant.longitude, p.longitude);
    return { planet: tPlanet(locale, p.id), house: h, meaning: meaningFor(h, pb) };
  });
  const bOnA: CompareNarrative['overlays']['bOnA'] = b.planets.map((p) => {
    const h = houseFromAscendant(a.ascendant.longitude, p.longitude);
    return { planet: tPlanet(locale, p.id), house: h, meaning: meaningFor(h, pb) };
  });

  // Highlight resonant overlays — Venus/Moon/Sun in partner's 1/4/5/7/10
  const resonantHouses = new Set([1, 4, 5, 7, 10]);
  const resonant = [
    ...aOnB.filter((x) => ['Sun','Moon','Venus','Jupiter','सूर्य','चंद्र','शुक्र','गुरु','સૂર્ય','ચંદ્ર','શુક્ર','ગુરુ','सूर्यः','चन्द्रः','शुक्रः','गुरुः'].includes(x.planet) && resonantHouses.has(x.house))
      .map((x) => locale === 'hi' ? `${x.planet} → B के ${pb.ordinal(x.house)} भाव में`
                : locale === 'gu' ? `${x.planet} → B ના ${pb.ordinal(x.house)} ભાવમાં`
                : locale === 'sa' ? `${x.planet} → B-स्य ${pb.ordinal(x.house)} भावे`
                : `${x.planet} → B's ${pb.ordinal(x.house)} house`),
    ...bOnA.filter((x) => ['Sun','Moon','Venus','Jupiter','सूर्य','चंद्र','शुक्र','गुरु','સૂર્ય','ચંદ્ર','શુક્ર','ગુરુ','सूर्यः','चन्द्रः','शुक्रः','गुरुः'].includes(x.planet) && resonantHouses.has(x.house))
      .map((x) => locale === 'hi' ? `${x.planet} → A के ${pb.ordinal(x.house)} भाव में`
                : locale === 'gu' ? `${x.planet} → A ના ${pb.ordinal(x.house)} ભાવમાં`
                : locale === 'sa' ? `${x.planet} → A-स्य ${pb.ordinal(x.house)} भावे`
                : `${x.planet} → A's ${pb.ordinal(x.house)} house`),
  ];

  const text = resonant.length > 0
    ? (locale === 'en'
       ? `Notable inter-chart overlays: ${resonant.slice(0, 8).join('; ')}. These tend to be the strongest threads of attraction or alignment.`
       : locale === 'hi'
       ? `महत्त्वपूर्ण अंतर-कुंडली स्थितियाँ: ${resonant.slice(0, 8).join('; ')}। यहीं आकर्षण व सहयोग की धागे सबसे प्रबल होते हैं।`
       : locale === 'gu'
       ? `નોંધપાત્ર આંતર-કુંડળી સ્થિતિઓ: ${resonant.slice(0, 8).join('; ')}.`
       : `विशिष्टाः अन्तःस्थानानि: ${resonant.slice(0, 8).join('; ')}॥`)
    : (locale === 'en'
       ? 'No standout resonant overlays in benefic houses; intimacy will rely more on dasha resonance and panchang chemistry.'
       : locale === 'hi'
       ? 'शुभ भावों में कोई प्रमुख प्रतिध्वनि नहीं — दशा-तालमेल पर निर्भर रहना होगा।'
       : locale === 'gu'
       ? 'કોઈ વિશિષ્ટ સંગતિ નથી.'
       : 'न विशिष्टा अनुकूलता॥');

  return { aOnB, bOnA, text };
}

function bodyMoonAxis(a: KundaliResult, b: KundaliResult, pb: Phrasebook, locale: Locale): CompareNarrative['moonAxis'] {
  const aMoon = a.planets.find((p) => p.id === 'MO')!;
  const bMoon = b.planets.find((p) => p.id === 'MO')!;
  const relHouse = houseFromMoon(aMoon.longitude, bMoon.rashi.num);
  // Bhakoot — 6/8 and 2/12 are inauspicious; 1, 5, 7, 9 favourable
  const favourable = [1, 5, 7, 9];
  const inauspicious = [2, 6, 8, 12];
  let note = '';
  if (locale === 'en') {
    if (favourable.includes(relHouse)) note = `Person B's Moon falls in the ${pb.ordinal(relHouse)} from A — a flowing Bhakoot signal of natural ease.`;
    else if (inauspicious.includes(relHouse)) note = `B's Moon falls in the ${pb.ordinal(relHouse)} from A — a tense Bhakoot signal that calls for conscious patience.`;
    else note = `B's Moon falls in the ${pb.ordinal(relHouse)} from A — a neutral Bhakoot signal.`;
  } else if (locale === 'hi') {
    if (favourable.includes(relHouse)) note = `B का चंद्र A से ${pb.ordinal(relHouse)} में — सहज भकूट संकेत।`;
    else if (inauspicious.includes(relHouse)) note = `B का चंद्र A से ${pb.ordinal(relHouse)} में — तनावपूर्ण भकूट, धैर्य अपेक्षित।`;
    else note = `B का चंद्र A से ${pb.ordinal(relHouse)} में — तटस्थ भकूट।`;
  } else if (locale === 'gu') {
    if (favourable.includes(relHouse)) note = `B નો ચંદ્ર A થી ${pb.ordinal(relHouse)} માં — શુભ ભકૂટ.`;
    else if (inauspicious.includes(relHouse)) note = `B નો ચંદ્ર A થી ${pb.ordinal(relHouse)} માં — તંગ ભકૂટ.`;
    else note = `B નો ચંદ્ર A થી ${pb.ordinal(relHouse)} માં — તટસ્થ.`;
  } else {
    note = `B-स्य चन्द्रः A-तः ${pb.ordinal(relHouse)} भावे॥`;
  }
  return {
    aMoonSign: tRashi(locale, aMoon.rashi.num),
    bMoonSign: tRashi(locale, bMoon.rashi.num),
    relativeHouse: relHouse,
    note,
  };
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function compareCharts(
  a: KundaliResult,
  b: KundaliResult,
  locale: Locale = 'en',
): CompareNarrative {
  const pb = getPhrasebook(locale);

  // Try gun-milan; fall back gracefully if matching fails for any reason
  let gunMilan = 0;
  try {
    const m = matchKundalis(a.input, b.input);
    gunMilan = m.total?.obtained ?? 0;
  } catch {
    gunMilan = 0;
  }
  const compatibility = compatibilityBucket(gunMilan);

  const overview = bodyOverview(a, b, pb, locale);
  const overlays = bodyOverlays(a, b, pb, locale);
  const moon = bodyMoonAxis(a, b, pb, locale);

  const compatLine = pb.compatibility[compatibility];
  const compatPara =
    locale === 'en' ? `Gun-milan score: ${gunMilan}/36. Compatibility: ${compatLine}.`
  : locale === 'hi' ? `गुण-मिलान: ${gunMilan}/36। अनुकूलता: ${compatLine}।`
  : locale === 'gu' ? `ગુણ-મિલન: ${gunMilan}/36. અનુકૂળતા: ${compatLine}.`
  : `गुणमेलनम्: ${gunMilan}/36॥ अनुकूलता: ${compatLine}॥`;

  const paragraphs = [
    { heading: pb.section.compare_intro, text: overview },
    { heading: pb.section.compare_synastry, text: overlays.text },
    { heading: pb.section.compare_compatibility, text: `${moon.note} ${compatPara}` },
  ];

  return {
    locale,
    gunMilanScore: gunMilan,
    compatibility,
    paragraphs,
    overlays: { aOnB: overlays.aOnB, bOnA: overlays.bOnA },
    moonAxis: moon,
  };
}
