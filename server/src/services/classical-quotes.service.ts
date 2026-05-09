// Classical-quotes auto-linker.
//
// Given a KundaliResult, walk the CLASSICAL_QUOTES index and return every
// quote whose `conditions` object is satisfied by the chart. Each returned
// entry carries:
//   • the quote itself
//   • a matchedOn: what specifically in the chart triggered the match
//     (so the UI can show "Your Sun in 10th → Saravali Ch 9")
//   • a simple score (higher = more specific match)
//
// Also exposes `searchQuotes(query)` for the library search surface.

import { PlanetId } from '../utils/astro-constants';
import { KundaliResult, PlanetPosition } from './kundali.service';
import { CLASSICAL_QUOTES, ClassicalQuote, QuoteConditions, CLASSICAL_TEXTS } from './classical-quotes.data';
import { Locale, p } from '../i18n';

/** Resolve a quote into the requested locale (text → phrasebook lookup,
 *  fallback to English; chapter / source / tags are unchanged). */
function localizeQuote(q: ClassicalQuote, locale: Locale): ClassicalQuote {
  if (locale === 'en') return q;
  return {
    ...q,
    text: p(`classicalQuote.${q.id}.text`, locale, q.text),
  };
}

export interface LinkedQuote {
  quote: ClassicalQuote;
  matchedOn: string[];  // human-readable reasons — e.g. ["Sun in 10H"]
  score: number;
}

/**
 * Return the planet that rules the given sign number (1..12).
 * Traditional (not hellenistic) rulerships.
 */
function signLord(signNum: number): PlanetId {
  const lords: PlanetId[] = ['MA','VE','ME','MO','SU','ME','VE','MA','JU','SA','SA','JU'];
  return lords[signNum - 1];
}

/** Lord of the Nth house from lagna. */
function houseLord(k: KundaliResult, houseNum: number): PlanetId {
  const h = k.houses.find((x) => x.num === houseNum);
  if (h) return h.lord;
  const lagnaSign = k.ascendant.rashi.num;
  const targetSign = ((lagnaSign - 1 + (houseNum - 1)) % 12) + 1;
  return signLord(targetSign);
}

/** Find planet in chart by id. */
function findPlanet(k: KundaliResult, id: PlanetId): PlanetPosition | undefined {
  return k.planets.find((p) => p.id === id);
}

/** Narrow list of planets implicated by conditions.planet(s) — or all 9 if none. */
function planetsFromCond(c: QuoteConditions): PlanetId[] {
  if (c.planet) return [c.planet];
  if (c.planets) return c.planets;
  return [];
}

function pos(p: PlanetPosition, filter: QuoteConditions): { ok: boolean; reason: string } | null {
  const reasons: string[] = [];
  if (filter.inHouse != null && p.house !== filter.inHouse) return null;
  if (filter.inHouse != null) reasons.push(`${p.id} in ${filter.inHouse}H`);
  if (filter.inHouses && !filter.inHouses.includes(p.house)) return null;
  if (filter.inHouses) reasons.push(`${p.id} in H${p.house} (kendra/trikona match)`);
  if (filter.inSign != null && p.rashi.num !== filter.inSign) return null;
  if (filter.inSign != null) reasons.push(`${p.id} in ${p.rashi.name}`);
  if (filter.inSigns && !filter.inSigns.includes(p.rashi.num)) return null;
  if (filter.inSigns) reasons.push(`${p.id} in ${p.rashi.name}`);
  if (filter.exalted    != null && p.exalted    !== filter.exalted) return null;
  if (filter.exalted)     reasons.push(`${p.id} exalted`);
  if (filter.debilitated != null && p.debilitated !== filter.debilitated) return null;
  if (filter.debilitated) reasons.push(`${p.id} debilitated`);
  if (filter.ownSign    != null && p.ownSign    !== filter.ownSign) return null;
  if (filter.ownSign)     reasons.push(`${p.id} in own sign`);
  if (filter.combust    != null && p.combust    !== filter.combust) return null;
  if (filter.combust)     reasons.push(`${p.id} combust`);
  if (filter.retrograde != null && p.retrograde !== filter.retrograde) return null;
  if (filter.retrograde)  reasons.push(`${p.id} retrograde`);
  return { ok: true, reason: reasons.join(', ') || `${p.id}` };
}

/** Try to match a quote to the chart — returns matchedOn list or null. */
function matchQuote(k: KundaliResult, q: ClassicalQuote): { matchedOn: string[]; score: number } | null {
  const c = q.conditions;
  const matchedOn: string[] = [];
  let score = 0;

  // Lagna sign gate.
  if (c.lagnaInSign != null && k.ascendant.rashi.num !== c.lagnaInSign) return null;
  if (c.lagnaInSigns && !c.lagnaInSigns.includes(k.ascendant.rashi.num)) return null;
  if (c.lagnaInSign != null || c.lagnaInSigns) { matchedOn.push(`lagna ${k.ascendant.rashi.name}`); score += 2; }

  // Moon nakshatra gate.
  if (c.moonNakshatra != null) {
    const mo = findPlanet(k, 'MO');
    if (!mo || mo.nakshatra.num !== c.moonNakshatra) return null;
    matchedOn.push(`Moon in nakshatra ${mo.nakshatra.name}`); score += 3;
  }

  // House-lord condition.
  if (c.lord) {
    const lp = findPlanet(k, houseLord(k, c.lord.of));
    if (!lp) return null;
    if (c.lord.inHouse != null && lp.house !== c.lord.inHouse) return null;
    if (c.lord.inHouses && !c.lord.inHouses.includes(lp.house)) return null;
    matchedOn.push(`${c.lord.of}L (${lp.id}) in ${lp.house}H`); score += 4;
  }

  // Conjunction — both planets must occupy the same house.
  if (c.conjunction) {
    const [a, b] = c.conjunction;
    const pa = findPlanet(k, a), pb = findPlanet(k, b);
    if (!pa || !pb || pa.house !== pb.house) return null;
    matchedOn.push(`${a}+${b} conjunction in ${pa.house}H`); score += 5;
  }

  // Per-planet filters.
  const targets = planetsFromCond(c);
  if (targets.length) {
    const hits: string[] = [];
    for (const id of targets) {
      const p = findPlanet(k, id);
      if (!p) continue;
      const r = pos(p, c);
      if (r?.ok) hits.push(r.reason);
    }
    if (!hits.length) return null;
    matchedOn.push(...hits);
    score += hits.length * 2;
    // More specific conditions score higher.
    if (c.exalted || c.debilitated || c.combust || c.retrograde) score += 2;
    if (c.inHouse != null || c.inSign != null) score += 1;
  } else if (!c.conjunction && !c.lord && !c.lagnaInSign && !c.lagnaInSigns && !c.moonNakshatra) {
    // Unconditional quote — applies universally (e.g. Atmakaraka gloss). Low score.
    matchedOn.push('applies universally');
    score = 1;
  }

  return matchedOn.length ? { matchedOn, score } : null;
}

/**
 * Auto-link all quotes whose conditions are satisfied by the given chart.
 * Optional filters let callers narrow by source or tag.
 */
export function linkQuotes(
  k: KundaliResult,
  opts?: { sources?: string[]; tags?: string[]; limit?: number },
  locale: Locale = 'en',
): LinkedQuote[] {
  const out: LinkedQuote[] = [];
  for (const q of CLASSICAL_QUOTES) {
    if (opts?.sources?.length && !opts.sources.includes(q.source)) continue;
    if (opts?.tags?.length && !q.tags.some((t) => opts.tags!.includes(t))) continue;
    const m = matchQuote(k, q);
    if (m) out.push({ quote: localizeQuote(q, locale), matchedOn: m.matchedOn, score: m.score });
  }
  out.sort((a, b) => b.score - a.score);
  if (opts?.limit && out.length > opts.limit) out.length = opts.limit;
  return out;
}

/** Free-text search across quotes (title, tags, body). */
export function searchQuotes(query: string, limit = 30, locale: Locale = 'en'): ClassicalQuote[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  return CLASSICAL_QUOTES
    .filter((x) => terms.every((t) =>
      x.text.toLowerCase().includes(t)
      || x.tags.some((tag) => tag.includes(t))
      || x.source.toLowerCase().includes(t)
      || (x.chapter?.toLowerCase().includes(t) ?? false),
    ))
    .slice(0, limit)
    .map((x) => localizeQuote(x, locale));
}

export function listTexts(locale: Locale = 'en') {
  const counts = new Map<string, number>();
  for (const q of CLASSICAL_QUOTES) counts.set(q.source, (counts.get(q.source) ?? 0) + 1);
  return CLASSICAL_TEXTS.map((t) => ({
    ...t,
    author: p(`classicalText.${t.source}.author`, locale, t.author),
    era:    p(`classicalText.${t.source}.era`,    locale, t.era),
    note:   p(`classicalText.${t.source}.note`,   locale, t.note),
    quoteCount: counts.get(t.source) ?? 0,
  }));
}
