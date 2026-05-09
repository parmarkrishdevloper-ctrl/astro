// Learning service — bridges the chart engine to the classical corpus.
//
//   • explainYoga(yogaName)         — predicate explanation + matching sloka
//   • tutorLessons(kundali)         — step-through lessons for this chart
//   • flashcards(topic)             — auto-generated flashcard deck
//   • searchCombined(q)             — cross-search encyclopedia + slokas

import { KundaliResult } from './kundali.service';
import { detectAllYogas } from './yoga-engine.service';
import { calculateKarakas } from './jaimini.service';
import { YOGAS } from '../data/yogas-db';
import { SLOKAS, Sloka } from '../data/classical-texts';
import { ENCYCLOPEDIA, findEntry } from '../data/encyclopedia';

// ─── Explain a yoga by name ─────────────────────────────────────────────────
export interface YogaExplanation {
  id: string;
  name: string;
  sanskrit?: string;
  category: string;
  effect: string;
  source: string;
  predicateAll?: any[];
  predicateAny?: any[];
  predicatePlainEnglish: string[];
  matchedSlokas: Sloka[];
}

function predicateToEnglish(p: any): string {
  switch (p.kind) {
    case 'in_own_or_exalted_kendra':
      return `${p.planet} is in its own sign or exalted, and occupies a kendra (1/4/7/10)`;
    case 'planet_in_house':
      return `${p.planet} is in the ${p.house}th house`;
    case 'planet_in_sign':
      return `${p.planet} is in sign #${p.sign}`;
    case 'planet_aspects_planet':
      return `${p.from} aspects ${p.to}`;
    case 'conjunct':
      return `${p.a} and ${p.b} are in the same sign`;
    case 'planet_in_kendra_from':
      return `${p.planet} is in a kendra from ${p.from}`;
    case 'mutual_kendra':
      return `${p.a} and ${p.b} are in mutual kendras`;
    case 'lord_of_house_in_house':
      return `the lord of the ${p.lordOf}th is placed in the ${p.in}th`;
    case 'parivartana':
      return `${p.a} and ${p.b} exchange signs`;
    case 'is_retrograde':
      return `${p.planet} is retrograde`;
    case 'is_combust':
      return `${p.planet} is combust the Sun`;
    case 'all_planets_in_houses':
      return `all planets occupy houses ${(p.houses as number[]).join(', ')}`;
    case 'no_planet_in_houses_from_moon':
      return `no planets (excluding ${(p.exclude as string[] ?? []).join(', ') || 'none'}) occupy houses ${(p.houses as number[]).join(', ')} from the Moon`;
    default:
      return JSON.stringify(p);
  }
}

export function explainYoga(yogaIdOrName: string): YogaExplanation | null {
  const yd = YOGAS.find((y) => y.id === yogaIdOrName || y.name === yogaIdOrName);
  if (!yd) return null;
  const allPreds = yd.rule.all ?? [];
  const anyPreds = yd.rule.any ?? [];
  const english = [
    ...allPreds.map((p) => predicateToEnglish(p)),
    ...(anyPreds.length ? [`ANY of: ${anyPreds.map((p) => predicateToEnglish(p)).join(' OR ')}`] : []),
  ];
  const q = yd.name.toLowerCase();
  const sanskriti = yd.sanskrit?.toLowerCase() ?? '';
  const matchedSlokas = SLOKAS.filter((s) =>
    s.english.toLowerCase().includes(q.split(' ')[0].replace('yoga','').trim()) ||
    s.tags.some((t) => q.includes(t) || t.includes(q.split(' ')[0])) ||
    (sanskriti && s.translit?.toLowerCase().includes(sanskriti.split(' ')[0])),
  ).slice(0, 3);
  return {
    id: yd.id,
    name: yd.name,
    sanskrit: yd.sanskrit,
    category: yd.category,
    effect: yd.effect,
    source: yd.source,
    predicateAll: allPreds.length ? allPreds : undefined,
    predicateAny: anyPreds.length ? anyPreds : undefined,
    predicatePlainEnglish: english,
    matchedSlokas,
  };
}

// ─── Tutor mode — step-through lessons for a chart ─────────────────────────
export interface TutorLesson {
  step: number;
  heading: string;
  narrative: string;
  highlight?: { kind: 'house' | 'planet' | 'nakshatra' | 'rashi' | 'karaka' | 'yoga'; id: string };
}

export function tutorLessons(k: KundaliResult): TutorLesson[] {
  const lessons: TutorLesson[] = [];
  const ascRashi = findEntry('rashi', k.ascendant.rashi.name);
  const ascNak   = findEntry('nakshatra', k.ascendant.nakshatra.name);
  lessons.push({
    step: 1,
    heading: 'Start with the Lagna',
    narrative: `Your ascendant is ${k.ascendant.rashi.name} (${ascRashi?.sanskrit ?? ''}). `
      + (ascRashi?.description ?? '') + ' '
      + `The rising nakshatra is ${k.ascendant.nakshatra.name}, pada ${k.ascendant.nakshatra.pada} — `
      + (ascNak?.oneliner ?? ''),
    highlight: { kind: 'rashi', id: k.ascendant.rashi.name },
  });

  // Lesson 2: 1st lord placement
  const l1 = k.houses[0].lord;
  const l1p = k.planets.find((p) => p.id === l1)!;
  const l1Entry = findEntry('planet', l1);
  lessons.push({
    step: 2,
    heading: `Lagna lord: ${l1}`,
    narrative: `${l1Entry?.oneliner ?? ''} It sits in your ${l1p.house}th house — `
      + (findEntry('house', `house-${l1p.house}`)?.oneliner ?? '')
      + (l1p.exalted ? ' (exalted!)' : l1p.debilitated ? ' (debilitated — weakness to work on)' : '')
      + (l1p.ownSign ? ' (own sign — dignified)' : ''),
    highlight: { kind: 'planet', id: l1 },
  });

  // Lesson 3: Moon placement & emotional base
  const moon = k.planets.find((p) => p.id === 'MO')!;
  lessons.push({
    step: 3,
    heading: 'Moon & emotional base',
    narrative: `Moon in ${moon.rashi.name} (${moon.nakshatra.name} pada ${moon.nakshatra.pada}), house ${moon.house}. `
      + `Your Janma nakshatra is ${moon.nakshatra.name} — the Vimshottari dasha sequence begins from its lord (${moon.nakshatra.lord}).`,
    highlight: { kind: 'planet', id: 'MO' },
  });

  // Lesson 4: Atmakaraka — soul's focus
  const karakas = calculateKarakas(k);
  const ak = karakas.find((x) => x.karaka === 'AK')!;
  const akPlanet = k.planets.find((p) => p.id === ak.planet)!;
  lessons.push({
    step: 4,
    heading: `Atmakaraka: ${ak.planet} (${ak.fullName})`,
    narrative: `Out of the 7 chara planets, ${ak.planet} has progressed furthest through its sign (${akPlanet.rashi.degInRashi.toFixed(2)}° in ${akPlanet.rashi.name}). `
      + `That makes it your soul-indicator. The theme of this planet — ${findEntry('planet', ak.planet)?.oneliner} — is the central project of this incarnation.`,
    highlight: { kind: 'karaka', id: 'karaka-AK' },
  });

  // Lesson 5: A detected yoga (if any)
  const yogas = detectAllYogas(k);
  if (yogas.length > 0) {
    const y = yogas[0];
    lessons.push({
      step: 5,
      heading: `A yoga active in your chart: ${y.name}`,
      narrative: `${y.effect} — rule source: ${y.source}. Open "Explain this rule" for the matching predicate and classical sloka.`,
      highlight: { kind: 'yoga', id: y.id },
    });
  }

  // Lesson 6: 10th lord — career indicator
  const l10 = k.houses[9].lord;
  const l10p = k.planets.find((p) => p.id === l10)!;
  lessons.push({
    step: 6,
    heading: `Career signal — 10th lord ${l10}`,
    narrative: `Your 10th lord ${l10} is in the ${l10p.house}th house. `
      + `That house — ${findEntry('house', `house-${l10p.house}`)?.oneliner} — shapes where your worldly action expresses.`,
    highlight: { kind: 'planet', id: l10 },
  });

  // Lesson 7: Conclusion
  lessons.push({
    step: 7,
    heading: 'Putting it together',
    narrative: 'These are the fundamentals. From here, explore divisional charts (D-9 Navamsa for marriage, D-10 Dasamsa for career), Shadbala strength, Vimshottari dasha periods, and running transits. Each gives the chart another dimension.',
  });

  return lessons;
}

// ─── Flashcards auto-generator ──────────────────────────────────────────────
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
}

export function buildFlashcards(topic: 'nakshatras' | 'rashis' | 'planets' | 'houses' | 'karakas'): Flashcard[] {
  const kind = topic === 'nakshatras' ? 'nakshatra'
    : topic === 'rashis' ? 'rashi'
    : topic === 'planets' ? 'planet'
    : topic === 'houses' ? 'house'
    : 'karaka';
  return ENCYCLOPEDIA.filter((e) => e.kind === kind).map((e) => ({
    id: e.id,
    front: e.name + (e.sanskrit ? ` (${e.sanskrit})` : ''),
    back: e.oneliner + ' · Keywords: ' + e.keywords.join(', '),
    topic,
  }));
}

// ─── Cross-search ──────────────────────────────────────────────────────────
export interface CombinedSearchResult {
  encyclopedia: Array<{ kind: string; id: string; name: string; oneliner: string }>;
  slokas: Array<{ id: string; english: string; source: string }>;
  yogas: Array<{ id: string; name: string; effect: string }>;
}

export function searchCombined(q: string): CombinedSearchResult {
  const query = q.trim().toLowerCase();
  if (!query) return { encyclopedia: [], slokas: [], yogas: [] };

  const encyclopedia = ENCYCLOPEDIA
    .filter((e) =>
      e.name.toLowerCase().includes(query) ||
      e.sanskrit?.toLowerCase().includes(query) ||
      e.keywords.some((k) => k.toLowerCase().includes(query)) ||
      e.oneliner.toLowerCase().includes(query))
    .map((e) => ({ kind: e.kind, id: e.id, name: e.name, oneliner: e.oneliner }))
    .slice(0, 20);

  const slokas = SLOKAS
    .filter((s) =>
      s.english.toLowerCase().includes(query) ||
      s.source.toLowerCase().includes(query) ||
      s.tags.some((t) => t.toLowerCase().includes(query)))
    .map((s) => ({ id: s.id, english: s.english, source: s.source }))
    .slice(0, 20);

  const yogas = YOGAS
    .filter((y) =>
      y.name.toLowerCase().includes(query) ||
      y.category.toLowerCase().includes(query) ||
      y.sanskrit?.toLowerCase().includes(query) ||
      y.effect.toLowerCase().includes(query))
    .map((y) => ({ id: y.id, name: y.name, effect: y.effect }))
    .slice(0, 20);

  return { encyclopedia, slokas, yogas };
}
