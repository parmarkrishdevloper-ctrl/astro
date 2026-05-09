// Phase 18 — Narrative engine.
//
// Multilingual rule-based NLG. Consumes a KundaliResult and assembles a
// section-keyed narrative in the requested locale by composing phrasebook
// entries with chart context. Strictly deterministic — no LLM, no IO.
//
// API:
//   buildNarrativeReport(k, locale, opts?) → NarrativeReport
//   buildSectionNarrative(k, section, locale) → string
//
// The report is structured (sections array) so the client can render each
// chunk separately or stitch them into one page.

import type { KundaliResult, PlanetPosition } from './kundali.service';
import { currentDasha } from './dasha.service';
import { detectAllYogas, DetectedYoga } from './yoga-engine.service';
import type { Locale } from '../i18n';
import { tPlanet, tRashi } from '../i18n';
import { getPhrasebook, fill, Phrasebook } from './phrasebook';

export type NarrativeSection =
  | 'overview' | 'personality' | 'career' | 'relationships'
  | 'wealth' | 'health' | 'spirituality' | 'dasha' | 'yoga';

export const ALL_SECTIONS: NarrativeSection[] = [
  'overview', 'personality', 'career', 'relationships',
  'wealth', 'health', 'spirituality', 'dasha', 'yoga',
];

export interface NarrativeChunk {
  id: NarrativeSection;
  heading: string;
  paragraphs: string[];
}

export interface NarrativeReport {
  locale: Locale;
  sections: NarrativeChunk[];
  meta: {
    ascendant: { sign: string; nakshatra: string };
    moonSign: string;
    sunSign: string;
    dasha?: { maha: string; antar: string };
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findPlanet(k: KundaliResult, id: string): PlanetPosition | undefined {
  return k.planets.find((p) => p.id === id);
}

function houseLordPlanet(k: KundaliResult, house: number): PlanetPosition | undefined {
  const lord = k.houses[house - 1].lord;
  return findPlanet(k, lord);
}

function describePlacement(p: PlanetPosition, pb: Phrasebook, locale: Locale): string {
  const tags: string[] = [];
  if (p.exalted) tags.push(pb.tone.exalted);
  if (p.debilitated) tags.push(pb.tone.debilitated);
  if (p.ownSign) tags.push(pb.tone.own_sign);
  if (p.retrograde) tags.push(pb.tone.retrograde);
  if (p.combust) tags.push(pb.tone.combust);
  const tagStr = tags.length ? ` (${tags.join(', ')})` : '';
  const houseStr = fill(pb.glue.in_house, { n: pb.ordinal(p.house) });
  const signStr = fill(pb.glue.in_sign, { sign: tRashi(locale, p.rashi.num) });
  return `${tPlanet(locale, p.id)} ${signStr} ${houseStr}${tagStr}`;
}

// ─── Section builders ───────────────────────────────────────────────────────

function overviewSection(k: KundaliResult, pb: Phrasebook, locale: Locale): string[] {
  const asc = k.ascendant;
  const moon = findPlanet(k, 'MO')!;
  const sun = findPlanet(k, 'SU')!;
  const ascTone = pb.rashiTone[asc.rashi.num];
  const moonTone = pb.rashiTone[moon.rashi.num];

  const p1 = locale === 'en'
    ? `The ascendant rises in ${tRashi(locale, asc.rashi.num)} — ${ascTone}. The Moon, your emotional core, sits ${pb.glue.in_sign.replace('{sign}', tRashi(locale, moon.rashi.num))} (${moonTone}), in the ${pb.ordinal(moon.house)} bhava — the realm of ${pb.house[moon.house]}. The Sun, your soul-spark, animates the ${pb.ordinal(sun.house)} bhava ${pb.glue.in_sign.replace('{sign}', tRashi(locale, sun.rashi.num))}.`
    : locale === 'hi'
    ? `लग्न ${tRashi(locale, asc.rashi.num)} राशि में उदित है — ${ascTone}। चंद्र ${tRashi(locale, moon.rashi.num)} राशि में, ${pb.ordinal(moon.house)} भाव में बैठे हैं — ${pb.house[moon.house]}। सूर्य ${pb.ordinal(sun.house)} भाव में ${tRashi(locale, sun.rashi.num)} राशि में स्थित हैं।`
    : locale === 'gu'
    ? `લગ્ન ${tRashi(locale, asc.rashi.num)} માં ઉદય થાય છે — ${ascTone}. ચંદ્ર ${tRashi(locale, moon.rashi.num)} માં, ${pb.ordinal(moon.house)} ભાવમાં છે — ${pb.house[moon.house]}. સૂર્ય ${pb.ordinal(sun.house)} ભાવમાં ${tRashi(locale, sun.rashi.num)} માં છે.`
    : `लग्नं ${tRashi(locale, asc.rashi.num)} राशौ — ${ascTone}। चन्द्रः ${tRashi(locale, moon.rashi.num)} राशौ ${pb.ordinal(moon.house)} भावे — ${pb.house[moon.house]}। सूर्यः ${pb.ordinal(sun.house)} भावे।`;

  const dignities = k.planets
    .filter((p) => p.exalted || p.debilitated || p.ownSign || p.retrograde)
    .map((p) => describePlacement(p, pb, locale))
    .slice(0, 6);

  const p2 = dignities.length > 0
    ? (locale === 'en'
        ? `Notable placements: ${dignities.join('; ')}.`
        : locale === 'hi'
        ? `महत्त्वपूर्ण योग: ${dignities.join('; ')}।`
        : locale === 'gu'
        ? `નોંધપાત્ર યોગો: ${dignities.join('; ')}.`
        : `विशिष्टस्थानानि: ${dignities.join('; ')}॥`)
    : '';

  return [p1, p2].filter(Boolean);
}

function personalitySection(k: KundaliResult, pb: Phrasebook, locale: Locale): string[] {
  const lagnaLord = houseLordPlanet(k, 1)!;
  const moon = findPlanet(k, 'MO')!;
  const sun = findPlanet(k, 'SU')!;

  const p1 = locale === 'en'
    ? `The lagna lord ${tPlanet(locale, lagnaLord.id)} (${pb.planet[lagnaLord.id]}) sits in the ${pb.ordinal(lagnaLord.house)} bhava — ${pb.house[lagnaLord.house]}. This is where your fundamental life-force tends to apply itself.`
    : locale === 'hi'
    ? `लग्नेश ${tPlanet(locale, lagnaLord.id)} (${pb.planet[lagnaLord.id]}) ${pb.ordinal(lagnaLord.house)} भाव में हैं — ${pb.house[lagnaLord.house]}। यहीं आपकी मूल जीवन-ऊर्जा प्रकट होती है।`
    : locale === 'gu'
    ? `લગ્નેશ ${tPlanet(locale, lagnaLord.id)} (${pb.planet[lagnaLord.id]}) ${pb.ordinal(lagnaLord.house)} ભાવમાં છે — ${pb.house[lagnaLord.house]}.`
    : `लग्नेशः ${tPlanet(locale, lagnaLord.id)} (${pb.planet[lagnaLord.id]}) ${pb.ordinal(lagnaLord.house)} भावे — ${pb.house[lagnaLord.house]}॥`;

  const p2 = locale === 'en'
    ? `Sun signals identity (${pb.rashiTone[sun.rashi.num]}); Moon signals mood (${pb.rashiTone[moon.rashi.num]}). The interplay of these two — ${tPlanet(locale, sun.id)} ${pb.ordinal(sun.house)} and ${tPlanet(locale, moon.id)} ${pb.ordinal(moon.house)} — colours how you meet the world.`
    : locale === 'hi'
    ? `सूर्य से पहचान (${pb.rashiTone[sun.rashi.num]}), चंद्र से मनोभाव (${pb.rashiTone[moon.rashi.num]})। इन दोनों का संयोग आपके स्वभाव की रूपरेखा देता है।`
    : locale === 'gu'
    ? `સૂર્ય પહેચાન આપે છે (${pb.rashiTone[sun.rashi.num]}); ચંદ્ર મનોભાવ (${pb.rashiTone[moon.rashi.num]}).`
    : `सूर्यः व्यक्तित्वं (${pb.rashiTone[sun.rashi.num]}), चन्द्रः मनः (${pb.rashiTone[moon.rashi.num]})॥`;

  return [p1, p2];
}

function careerSection(k: KundaliResult, pb: Phrasebook, locale: Locale): string[] {
  const tenLord = houseLordPlanet(k, 10)!;
  const sun = findPlanet(k, 'SU')!;
  const sat = findPlanet(k, 'SA')!;

  const p1 = locale === 'en'
    ? `The 10th lord ${tPlanet(locale, tenLord.id)} (${pb.planet[tenLord.id]}) lands in the ${pb.ordinal(tenLord.house)} bhava — ${pb.house[tenLord.house]}. Career energy expresses through this ground.`
    : locale === 'hi'
    ? `दशम भाव के स्वामी ${tPlanet(locale, tenLord.id)} (${pb.planet[tenLord.id]}) ${pb.ordinal(tenLord.house)} भाव में हैं — ${pb.house[tenLord.house]}। यहीं कर्म-ऊर्जा प्रकट होती है।`
    : locale === 'gu'
    ? `દશમેશ ${tPlanet(locale, tenLord.id)} ${pb.ordinal(tenLord.house)} ભાવમાં છે — ${pb.house[tenLord.house]}.`
    : `दशमेशः ${tPlanet(locale, tenLord.id)} ${pb.ordinal(tenLord.house)} भावे — ${pb.house[tenLord.house]}॥`;

  const p2 = locale === 'en'
    ? `Sun (status, ${pb.ordinal(sun.house)} bhava) and Saturn (discipline, ${pb.ordinal(sat.house)} bhava) shape the rhythm of your work — recognition where Sun is bright, sustained labour where Saturn earns it slowly.`
    : locale === 'hi'
    ? `सूर्य (यश, ${pb.ordinal(sun.house)} भाव) तथा शनि (अनुशासन, ${pb.ordinal(sat.house)} भाव) मिलकर कार्य की लय निर्धारित करते हैं।`
    : locale === 'gu'
    ? `સૂર્ય (${pb.ordinal(sun.house)} ભાવ) અને શનિ (${pb.ordinal(sat.house)} ભાવ) મળીને કાર્ય-લય નક્કી કરે છે.`
    : `सूर्यः (${pb.ordinal(sun.house)}) शनिः (${pb.ordinal(sat.house)}) कर्मक्षेत्रं निर्दिशतः॥`;

  return [p1, p2];
}

function relationshipsSection(k: KundaliResult, pb: Phrasebook, locale: Locale): string[] {
  const seventh = houseLordPlanet(k, 7)!;
  const venus = findPlanet(k, 'VE')!;
  const mars = findPlanet(k, 'MA')!;

  const p1 = locale === 'en'
    ? `The 7th lord ${tPlanet(locale, seventh.id)} sits in the ${pb.ordinal(seventh.house)} bhava — meaningful encounters tend to arise in matters of ${pb.house[seventh.house]}.`
    : locale === 'hi'
    ? `सप्तमेश ${tPlanet(locale, seventh.id)} ${pb.ordinal(seventh.house)} भाव में हैं — संबंधों के अनुभव यहीं मिलते हैं।`
    : locale === 'gu'
    ? `સપ્તમેશ ${tPlanet(locale, seventh.id)} ${pb.ordinal(seventh.house)} ભાવમાં છે.`
    : `सप्तमेशः ${tPlanet(locale, seventh.id)} ${pb.ordinal(seventh.house)} भावे॥`;

  const p2 = locale === 'en'
    ? `Venus (${pb.rashiTone[venus.rashi.num]}, ${pb.ordinal(venus.house)} bhava) governs love and aesthetics; Mars (${pb.rashiTone[mars.rashi.num]}, ${pb.ordinal(mars.house)} bhava) governs passion and protectiveness. Their balance shapes intimate life.`
    : locale === 'hi'
    ? `शुक्र (${pb.ordinal(venus.house)} भाव) प्रेम-कारक, मंगल (${pb.ordinal(mars.house)} भाव) उत्साह-कारक हैं।`
    : locale === 'gu'
    ? `શુક્ર (${pb.ordinal(venus.house)} ભાવ) અને મંગળ (${pb.ordinal(mars.house)} ભાવ).`
    : `शुक्रः (${pb.ordinal(venus.house)}) मङ्गलः (${pb.ordinal(mars.house)})॥`;

  return [p1, p2];
}

function wealthSection(k: KundaliResult, pb: Phrasebook, locale: Locale): string[] {
  const second = houseLordPlanet(k, 2)!;
  const eleventh = houseLordPlanet(k, 11)!;
  const jup = findPlanet(k, 'JU')!;

  const p1 = locale === 'en'
    ? `Wealth flow: 2nd lord ${tPlanet(locale, second.id)} in ${pb.ordinal(second.house)}, 11th lord ${tPlanet(locale, eleventh.id)} in ${pb.ordinal(eleventh.house)}. Jupiter, the karaka of fortune, is in the ${pb.ordinal(jup.house)} bhava ${pb.glue.in_sign.replace('{sign}', tRashi(locale, jup.rashi.num))}.`
    : locale === 'hi'
    ? `धन-प्रवाह: द्वितीयेश ${tPlanet(locale, second.id)} ${pb.ordinal(second.house)} भाव, एकादशेश ${tPlanet(locale, eleventh.id)} ${pb.ordinal(eleventh.house)} भाव। गुरु ${pb.ordinal(jup.house)} भाव में हैं।`
    : locale === 'gu'
    ? `દ્વિતીયેશ ${tPlanet(locale, second.id)} ${pb.ordinal(second.house)} ભાવમાં, એકાદશેશ ${tPlanet(locale, eleventh.id)} ${pb.ordinal(eleventh.house)} ભાવમાં.`
    : `द्वितीयेशः ${tPlanet(locale, second.id)} ${pb.ordinal(second.house)}, एकादशेशः ${tPlanet(locale, eleventh.id)} ${pb.ordinal(eleventh.house)}॥`;

  return [p1];
}

function healthSection(k: KundaliResult, pb: Phrasebook, locale: Locale): string[] {
  const lagnaLord = houseLordPlanet(k, 1)!;
  const sixth = houseLordPlanet(k, 6)!;
  const moon = findPlanet(k, 'MO')!;

  const p1 = locale === 'en'
    ? `Vitality: lagna lord ${tPlanet(locale, lagnaLord.id)} ${lagnaLord.exalted ? '(exalted, strong)' : lagnaLord.debilitated ? '(debilitated — needs care)' : ''} in ${pb.ordinal(lagnaLord.house)}. The 6th lord ${tPlanet(locale, sixth.id)} sits ${pb.ordinal(sixth.house)} — health themes surface around ${pb.house[sixth.house]}. Moon in ${tRashi(locale, moon.rashi.num)} colours nervous and emotional health.`
    : locale === 'hi'
    ? `लग्नेश ${tPlanet(locale, lagnaLord.id)} ${pb.ordinal(lagnaLord.house)} भाव में, षष्ठेश ${tPlanet(locale, sixth.id)} ${pb.ordinal(sixth.house)} भाव में। चंद्र की स्थिति मानसिक स्वास्थ्य को इंगित करती है।`
    : locale === 'gu'
    ? `લગ્નેશ ${tPlanet(locale, lagnaLord.id)} ${pb.ordinal(lagnaLord.house)} માં, ષષ્ઠેશ ${tPlanet(locale, sixth.id)} ${pb.ordinal(sixth.house)} માં.`
    : `लग्नेशः ${tPlanet(locale, lagnaLord.id)} ${pb.ordinal(lagnaLord.house)}, षष्ठेशः ${tPlanet(locale, sixth.id)} ${pb.ordinal(sixth.house)}॥`;

  return [p1];
}

function spiritualitySection(k: KundaliResult, pb: Phrasebook, locale: Locale): string[] {
  const ninth = houseLordPlanet(k, 9)!;
  const twelfth = houseLordPlanet(k, 12)!;
  const ke = findPlanet(k, 'KE')!;

  const p1 = locale === 'en'
    ? `Dharma signals: 9th lord ${tPlanet(locale, ninth.id)} in ${pb.ordinal(ninth.house)} (${pb.house[ninth.house]}); 12th lord ${tPlanet(locale, twelfth.id)} in ${pb.ordinal(twelfth.house)}. Ketu — the moksha-karaka — sits in the ${pb.ordinal(ke.house)} bhava, ${pb.glue.in_sign.replace('{sign}', tRashi(locale, ke.rashi.num))}, marking the area of soul-detachment.`
    : locale === 'hi'
    ? `नवमेश ${tPlanet(locale, ninth.id)} ${pb.ordinal(ninth.house)} भाव में, द्वादशेश ${tPlanet(locale, twelfth.id)} ${pb.ordinal(twelfth.house)} भाव में। केतु ${pb.ordinal(ke.house)} भाव में मोक्ष-संकेत देते हैं।`
    : locale === 'gu'
    ? `નવમેશ ${tPlanet(locale, ninth.id)} ${pb.ordinal(ninth.house)} માં; કેતુ ${pb.ordinal(ke.house)} ભાવમાં.`
    : `नवमेशः ${tPlanet(locale, ninth.id)} ${pb.ordinal(ninth.house)}; केतुः ${pb.ordinal(ke.house)} भावे मोक्षकारकः॥`;

  return [p1];
}

function dashaSection(k: KundaliResult, pb: Phrasebook, locale: Locale): string[] {
  const dd = currentDasha(k);
  if (!dd?.maha) {
    return [locale === 'en'
      ? 'No active mahadasha at this moment (the chart epoch may lie outside the computed cycle).'
      : locale === 'hi' ? 'इस क्षण कोई महादशा सक्रिय नहीं।'
      : locale === 'gu' ? 'આ ક્ષણે કોઈ મહાદશા સક્રિય નથી.'
      : 'न काचित् महादशा सक्रिया॥'];
  }
  const mahaTheme = pb.dashaTheme[dd.maha.lord] ?? '';
  const mahaPlanet = findPlanet(k, dd.maha.lord)!;
  const antar = dd.antar;

  const p1 = locale === 'en'
    ? `${pb.glue.period_now} ${tPlanet(locale, dd.maha.lord)}${antar ? `/${tPlanet(locale, antar.lord)}` : ''}. The mahadasha lord sits in your ${pb.ordinal(mahaPlanet.house)} bhava ${pb.glue.in_sign.replace('{sign}', tRashi(locale, mahaPlanet.rashi.num))} — themes of ${pb.house[mahaPlanet.house]} are emphasised. This is ${mahaTheme}.`
    : locale === 'hi'
    ? `${pb.glue.period_now} ${tPlanet(locale, dd.maha.lord)}${antar ? `/${tPlanet(locale, antar.lord)}` : ''}। महादशा-स्वामी ${pb.ordinal(mahaPlanet.house)} भाव में बैठे हैं — ${mahaTheme}।`
    : locale === 'gu'
    ? `${pb.glue.period_now} ${tPlanet(locale, dd.maha.lord)}${antar ? `/${tPlanet(locale, antar.lord)}` : ''}. મહાદશાસ્વામી ${pb.ordinal(mahaPlanet.house)} ભાવમાં — ${mahaTheme}.`
    : `${pb.glue.period_now} ${tPlanet(locale, dd.maha.lord)}${antar ? `/${tPlanet(locale, antar.lord)}` : ''}॥ महादशेशः ${pb.ordinal(mahaPlanet.house)} भावे — ${mahaTheme}॥`;

  return [p1];
}

function yogaSection(k: KundaliResult, pb: Phrasebook, locale: Locale): string[] {
  const yogas: DetectedYoga[] = detectAllYogas(k).slice(0, 6);
  if (yogas.length === 0) {
    return [locale === 'en'
      ? 'No major classical yogas surface in this chart at the configured strength threshold.'
      : locale === 'hi' ? 'इस कुंडली में कोई प्रमुख योग सक्रिय नहीं।'
      : locale === 'gu' ? 'કોઈ મુખ્ય યોગ સક્રિય નથી.'
      : 'न कश्चित् प्रमुखयोगः सक्रियः॥'];
  }
  const lines = yogas.map((y) => pb.yoga[y.name] ?? `${y.name}: ${y.effect}`);
  return lines;
}

// ─── Public API ─────────────────────────────────────────────────────────────

const BUILDERS: Record<NarrativeSection, (k: KundaliResult, pb: Phrasebook, l: Locale) => string[]> = {
  overview: overviewSection,
  personality: personalitySection,
  career: careerSection,
  relationships: relationshipsSection,
  wealth: wealthSection,
  health: healthSection,
  spirituality: spiritualitySection,
  dasha: dashaSection,
  yoga: yogaSection,
};

export function buildSectionNarrative(
  k: KundaliResult,
  section: NarrativeSection,
  locale: Locale = 'en',
): NarrativeChunk {
  const pb = getPhrasebook(locale);
  const paragraphs = BUILDERS[section](k, pb, locale);
  return { id: section, heading: pb.section[section], paragraphs };
}

export function buildNarrativeReport(
  k: KundaliResult,
  locale: Locale = 'en',
  opts: { sections?: NarrativeSection[] } = {},
): NarrativeReport {
  const sections = (opts.sections && opts.sections.length > 0) ? opts.sections : ALL_SECTIONS;
  const dd = currentDasha(k);
  const moon = findPlanet(k, 'MO')!;
  const sun = findPlanet(k, 'SU')!;
  return {
    locale,
    sections: sections.map((s) => buildSectionNarrative(k, s, locale)),
    meta: {
      ascendant: { sign: tRashi(locale, k.ascendant.rashi.num), nakshatra: k.ascendant.nakshatra.name },
      moonSign: tRashi(locale, moon.rashi.num),
      sunSign: tRashi(locale, sun.rashi.num),
      dasha: dd?.maha ? { maha: tPlanet(locale, dd.maha.lord), antar: dd.antar ? tPlanet(locale, dd.antar.lord) : '' } : undefined,
    },
  };
}
