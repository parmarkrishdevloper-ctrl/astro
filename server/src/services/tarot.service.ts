// Phase 19 — Tarot reading (deterministic, chart-aware).
//
// Deterministic shuffling: the same {seed, spread} produces the same draw.
// For chart-overlay spreads, the seed is derived from the natal chart so
// each chart has its own stable reading. Supports three spread modes:
//
//   • three-card (past / present / future)
//   • celtic-cross (ten cards — Waite's classical layout)
//   • chart-overlay (twelve cards, one per house)

import { TAROT_DECK, TarotCard } from './tarot-deck';
import type { KundaliResult } from './kundali.service';

export type SpreadType = 'three-card' | 'celtic-cross' | 'chart-overlay';

export interface TarotDraw {
  card: TarotCard;
  reversed: boolean;
  position: string; // e.g. "Past", "Present", "Future", or "House 1"
  reading: string;
}

export interface TarotSpread {
  spread: SpreadType;
  seed: string;
  question?: string;
  draws: TarotDraw[];
  summary: string;
}

// ─── Deterministic PRNG: mulberry32 seeded from a string hash ─────────────

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ─── Position layouts ──────────────────────────────────────────────────────

const POSITIONS: Record<SpreadType, string[]> = {
  'three-card': ['Past', 'Present', 'Future'],
  'celtic-cross': [
    'Present situation',
    'Challenge crossing you',
    'Distant past / foundation',
    'Recent past',
    'Possible future / crown',
    'Near future',
    'Self',
    'External influence',
    'Hopes & fears',
    'Final outcome',
  ],
  'chart-overlay': [
    'House 1 — Self',
    'House 2 — Wealth',
    'House 3 — Courage',
    'House 4 — Home',
    'House 5 — Creativity',
    'House 6 — Service / health',
    'House 7 — Partnership',
    'House 8 — Transformation',
    'House 9 — Dharma',
    'House 10 — Career',
    'House 11 — Gains',
    'House 12 — Moksha',
  ],
};

// ─── Reading composer ──────────────────────────────────────────────────────

function composeReading(draw: { card: TarotCard; reversed: boolean; position: string }): string {
  const { card, reversed, position } = draw;
  const meaning = reversed ? card.reversed : card.upright;
  const orient = reversed ? '(reversed)' : '(upright)';
  return `${position}: ${card.name} ${orient} — ${meaning}.`;
}

// ─── Seed builders ─────────────────────────────────────────────────────────

function seedForChart(k: KundaliResult): string {
  // Lagna + moon longitude + sun longitude → stable across reads of same chart
  const asc = k.ascendant.longitude.toFixed(3);
  const mo  = k.planets.find((p) => p.id === 'MO')?.longitude.toFixed(3) ?? '0';
  const su  = k.planets.find((p) => p.id === 'SU')?.longitude.toFixed(3) ?? '0';
  return `${asc}|${mo}|${su}`;
}

// ─── Public API ────────────────────────────────────────────────────────────

export interface TarotOptions {
  spread: SpreadType;
  question?: string;
  /** Optional explicit seed (e.g. user-supplied text question) — overrides chart seed. */
  seed?: string;
  /** If a chart is supplied and no explicit seed, the chart drives the seed. */
  chart?: KundaliResult;
}

import { Locale } from '../i18n';

export function tarotReading(opts: TarotOptions, _locale: Locale = 'en'): TarotSpread {
  const seedBase = opts.seed
    ?? (opts.chart ? seedForChart(opts.chart) : '')
    ?? '';
  const withQ = opts.question ? `${seedBase}::${opts.question}` : seedBase;
  const seed = withQ || `tarot::${Date.now()}`;
  const rng = mulberry32(hashString(seed));

  const shuffled = shuffle(TAROT_DECK, rng);
  const positions = POSITIONS[opts.spread];
  const draws: TarotDraw[] = [];

  for (let i = 0; i < positions.length; i++) {
    const card = shuffled[i];
    const reversed = rng() < 0.5;
    const reading = composeReading({ card, reversed, position: positions[i] });
    draws.push({ card, reversed, position: positions[i], reading });
  }

  const suits = new Set(draws.map((d) => d.card.suit));
  const dominantMajor = draws.filter((d) => d.card.suit === 'major').length;
  const reversedCount = draws.filter((d) => d.reversed).length;

  const summary = [
    dominantMajor >= Math.ceil(positions.length / 3)
      ? `Heavy Major arcana (${dominantMajor}/${positions.length}) — archetypal forces are active; this is a soul-level moment, not a surface event.`
      : '',
    suits.size <= 2
      ? 'Few suits represented — the question is narrowly scoped.'
      : '',
    reversedCount > positions.length / 2
      ? 'Majority reversed — energy is interior, blocked, or being reworked.'
      : reversedCount === 0
      ? 'All upright — clear forward movement, little resistance.'
      : '',
  ]
    .filter(Boolean)
    .join(' ') ||
    'Balanced spread — no single suit or direction dominates; the question is open.';

  return {
    spread: opts.spread,
    seed,
    question: opts.question,
    draws,
    summary,
  };
}
