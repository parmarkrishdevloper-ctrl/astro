// Global search — unified hit list across the entire personal knowledge base.
//
// Searches in parallel:
//   • Saved charts (label, relationship, placeName)
//   • Life events (title, notes, category) — across all charts
//   • Predictions (text, category) — across all charts
//   • Notes markdown — across all charts
//   • Encyclopedia entries (name, sanskrit, keywords, description)
//   • Classical slokas (english, source, tags)
//   • Yoga DB (name, effect, sanskrit, category)
//
// Returns a flat, scored list where every hit has a `url` the UI can route to.

import { Chart } from '../models/chart.model';
import { ENCYCLOPEDIA } from '../data/encyclopedia';
import { SLOKAS } from '../data/classical-texts';
import { YOGAS } from '../data/yogas-db';

export type HitKind =
  | 'chart' | 'event' | 'prediction' | 'note'
  | 'encyclopedia' | 'sloka' | 'yoga';

export interface GlobalHit {
  kind: HitKind;
  id: string;
  title: string;
  snippet?: string;
  tags?: string[];
  score: number;
  /** SPA route to open this hit */
  url: string;
  /** Optional data payload for previews */
  meta?: Record<string, any>;
}

function scoreMatch(text: string, q: string): number {
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 50;
  if (t.includes(q)) return 25;
  // simple substring density
  const parts = q.split(/\s+/).filter(Boolean);
  let s = 0;
  for (const p of parts) if (t.includes(p)) s += 10;
  return s;
}

function highlightSnippet(text: string, q: string, radius = 60): string {
  if (!text) return '';
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return text.slice(0, 120);
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + q.length + radius);
  return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
}

export async function globalSearch(q: string, limit = 40): Promise<GlobalHit[]> {
  const query = q.trim().toLowerCase();
  if (query.length < 2) return [];

  const hits: GlobalHit[] = [];

  // ─── Charts + nested sub-docs ─────────────────────────────────────────
  // Embedded SQLite is always ready post-init; the try/catch is a defensive
  // wrap in case of disk issues so search still returns encyclopedia hits.
  try {
    const charts = await Chart.find({}).lean();
    for (const c of charts as any[]) {
      const cid = String(c._id);
      const chartText = [c.label, c.relationship, c.placeName].filter(Boolean).join(' ');
      const chartScore = scoreMatch(chartText, query);
      if (chartScore > 0) {
        hits.push({
          kind: 'chart', id: cid,
          title: c.label,
          snippet: `${c.relationship} · ${c.placeName ?? ''} · ${new Date(c.datetime).toLocaleDateString()}`,
          score: chartScore,
          url: `/library?chart=${cid}`,
          meta: { relationship: c.relationship },
        });
      }
      for (const e of c.lifeEvents ?? []) {
        const etext = `${e.title} ${e.category} ${e.notes ?? ''}`;
        const s = scoreMatch(etext, query);
        if (s > 0) {
          hits.push({
            kind: 'event', id: String(e._id),
            title: `${e.title} (${c.label})`,
            snippet: `${e.category} · ${new Date(e.date).toLocaleDateString()} · ${highlightSnippet(e.notes ?? '', query)}`,
            score: s,
            url: `/library?chart=${cid}&tab=events`,
          });
        }
      }
      for (const p of c.predictions ?? []) {
        const ptext = `${p.text} ${p.category}`;
        const s = scoreMatch(ptext, query);
        if (s > 0) {
          hits.push({
            kind: 'prediction', id: String(p._id),
            title: `Prediction · ${c.label}`,
            snippet: `${p.category} · outcome ${p.outcome} · ${highlightSnippet(p.text, query)}`,
            score: s,
            url: `/library?chart=${cid}&tab=predictions`,
          });
        }
      }
      for (const n of c.notes ?? []) {
        const s = scoreMatch(n.markdown ?? '', query);
        if (s > 0) {
          hits.push({
            kind: 'note', id: String(n._id),
            title: `Note · ${c.label} · ${n.scope}${n.target ? ` / ${n.target}` : ''}`,
            snippet: highlightSnippet(n.markdown ?? '', query),
            score: s,
            url: `/library?chart=${cid}&tab=notes`,
          });
        }
      }
    }
  } catch { /* persistence layer issue — fall back to non-personal hits only */ }

  // ─── Encyclopedia ─────────────────────────────────────────────────────
  for (const e of ENCYCLOPEDIA) {
    const text = `${e.name} ${e.sanskrit ?? ''} ${e.oneliner} ${e.keywords.join(' ')}`;
    const s = scoreMatch(text, query);
    if (s > 0) {
      hits.push({
        kind: 'encyclopedia', id: e.id,
        title: `${e.name}${e.sanskrit ? ` · ${e.sanskrit}` : ''}`,
        snippet: e.oneliner,
        tags: e.keywords.slice(0, 4),
        score: s,
        url: `/learn#${e.kind}:${e.id}`,
        meta: { kind: e.kind },
      });
    }
  }

  // ─── Slokas ───────────────────────────────────────────────────────────
  for (const sl of SLOKAS) {
    const text = `${sl.english} ${sl.source} ${sl.tags.join(' ')}`;
    const s = scoreMatch(text, query);
    if (s > 0) {
      hits.push({
        kind: 'sloka', id: sl.id,
        title: sl.source,
        snippet: highlightSnippet(sl.english, query),
        tags: sl.tags.slice(0, 4),
        score: s,
        url: `/learn#sloka:${sl.id}`,
      });
    }
  }

  // ─── Yogas ────────────────────────────────────────────────────────────
  for (const y of YOGAS) {
    const text = `${y.name} ${y.sanskrit ?? ''} ${y.category} ${y.effect}`;
    const s = scoreMatch(text, query);
    if (s > 0) {
      hits.push({
        kind: 'yoga', id: y.id,
        title: `${y.name}${y.sanskrit ? ` · ${y.sanskrit}` : ''}`,
        snippet: y.effect,
        tags: [y.category, ...(y.strength ? [y.strength] : [])],
        score: s,
        url: `/learn#yoga:${y.id}`,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}
