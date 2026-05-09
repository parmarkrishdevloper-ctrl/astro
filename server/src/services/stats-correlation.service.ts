// Stats correlation — run a pattern against a set of charts and return
// frequency / correlation metrics. Small-sample research tool.

import { BirthInput, calculateKundali, KundaliResult } from './kundali.service';
import { searchPattern } from './pattern-search.service';
import { PlanetId } from '../utils/astro-constants';

export interface StatsSample {
  label: string;       // name of the person/chart
  birth: BirthInput;
  tag?: string;        // free-form grouping tag (e.g. "CEO", "doctor")
}

export interface StatsCorrelationInput {
  samples: StatsSample[];
  /** Pattern DSL query. */
  query: string;
  /** If set, also break down by this sample.tag grouping. */
  groupByTag?: boolean;
}

export interface StatsCorrelationResult {
  n: number;
  matchCount: number;
  matchPct: number;
  hits: { label: string; tag?: string }[];
  misses: { label: string; tag?: string }[];
  byTag?: { tag: string; n: number; matchCount: number; matchPct: number }[];
}

export function computeCorrelation(input: StatsCorrelationInput): StatsCorrelationResult {
  const hits: { label: string; tag?: string }[] = [];
  const misses: { label: string; tag?: string }[] = [];
  const perTag = new Map<string, { n: number; matches: number }>();

  for (const s of input.samples) {
    const k = calculateKundali(s.birth);
    const r = searchPattern(k, input.query);
    (r.match ? hits : misses).push({ label: s.label, tag: s.tag });
    if (input.groupByTag && s.tag) {
      const t = perTag.get(s.tag) ?? { n: 0, matches: 0 };
      t.n += 1;
      if (r.match) t.matches += 1;
      perTag.set(s.tag, t);
    }
  }

  const n = input.samples.length;
  const matchCount = hits.length;
  const out: StatsCorrelationResult = {
    n,
    matchCount,
    matchPct: n ? +(matchCount * 100 / n).toFixed(1) : 0,
    hits,
    misses,
  };
  if (input.groupByTag) {
    out.byTag = Array.from(perTag.entries()).map(([tag, v]) => ({
      tag,
      n: v.n,
      matchCount: v.matches,
      matchPct: +(v.matches * 100 / v.n).toFixed(1),
    })).sort((a, b) => b.matchPct - a.matchPct);
  }
  return out;
}

// ── Descriptive distribution helpers — useful without a pattern ─────────────

export interface DistributionSlice {
  key: string;
  n: number;
  pct: number;
}

export interface DistributionResult {
  facet: 'lagnaSign' | 'moonSign' | 'sunSign' | 'nakLord' | 'planetSign';
  planet?: PlanetId;
  n: number;
  slices: DistributionSlice[];
}

export function computeDistribution(
  samples: StatsSample[],
  facet: DistributionResult['facet'],
  planet?: PlanetId,
): DistributionResult {
  const counts = new Map<string, number>();
  const add = (key: string) => counts.set(key, (counts.get(key) ?? 0) + 1);

  for (const s of samples) {
    const k: KundaliResult = calculateKundali(s.birth);
    switch (facet) {
      case 'lagnaSign': add(k.ascendant.rashi.name); break;
      case 'moonSign':  add(k.planets.find((p) => p.id === 'MO')!.rashi.name); break;
      case 'sunSign':   add(k.planets.find((p) => p.id === 'SU')!.rashi.name); break;
      case 'nakLord':   add(k.planets.find((p) => p.id === 'MO')!.nakshatra.lord); break;
      case 'planetSign': {
        const p = k.planets.find((x) => x.id === (planet ?? 'SU'));
        if (p) add(p.rashi.name);
        break;
      }
    }
  }

  const n = samples.length;
  const slices: DistributionSlice[] = Array.from(counts.entries())
    .map(([key, cnt]) => ({ key, n: cnt, pct: n ? +(cnt * 100 / n).toFixed(1) : 0 }))
    .sort((a, b) => b.n - a.n);

  return { facet, planet, n, slices };
}
