// Timeline overlay — unify dasha + transit + user-event streams into a single
// chronological band list so the UI can render parallel "swim-lanes" for
// visual correlation (e.g. "Jupiter mahadasha coincided with a Jupiter return
// and a career promotion").
//
// Lanes returned:
//   • maha    — Vimshottari mahadashas
//   • antar   — Vimshottari antardashas inside the visible window
//   • transit — slow-planet (JU/SA/RA/KE) sign ingresses within the window
//   • events  — user-supplied life events
//
// Each lane returns rectangles ({start, end}) or points ({date}) so the
// client can render bars vs. pins without extra logic.

import { KundaliResult } from './kundali.service';
import { computeVimshottari, computeAntardashas, DashaPeriod } from './dasha.service';
import { transitTimeline, TransitIngress } from './transit.service';
import { PlanetId, RASHIS } from '../utils/astro-constants';

export interface TimelineBar {
  lane: 'maha' | 'antar';
  lord: PlanetId;
  label: string;
  start: string;
  end: string;
}

export interface TimelinePoint {
  lane: 'transit' | 'event';
  date: string;
  label: string;
  tag?: string;
  planet?: PlanetId;
}

export interface TimelineEvent {
  date: string;
  title: string;
  category?: string;
}

export interface TimelineOverlayInput {
  /** ISO — window start. Defaults to today. */
  fromISO?: string;
  /** ISO — window end. Defaults to fromISO + 5 years. */
  toISO?: string;
  /** Which slow planets to render ingresses for. */
  transitPlanets?: PlanetId[];
  /** User-supplied life events to overlay. */
  events?: TimelineEvent[];
}

export interface TimelineOverlay {
  window: { from: string; to: string };
  bars: TimelineBar[];
  points: TimelinePoint[];
}

const SLOW_DEFAULT: PlanetId[] = ['JU', 'SA', 'RA', 'KE'];

function clampBar(b: TimelineBar, fromMs: number, toMs: number): TimelineBar | null {
  const s = new Date(b.start).getTime();
  const e = new Date(b.end).getTime();
  if (e < fromMs || s > toMs) return null;
  return {
    ...b,
    start: new Date(Math.max(s, fromMs)).toISOString(),
    end:   new Date(Math.min(e, toMs)).toISOString(),
  };
}

export function buildTimelineOverlay(k: KundaliResult, input: TimelineOverlayInput = {}): TimelineOverlay {
  const fromISO = input.fromISO ?? new Date().toISOString();
  const fromMs = new Date(fromISO).getTime();
  const toMs = input.toISO ? new Date(input.toISO).getTime() : fromMs + 5 * 365 * 86400_000;
  const toISO = new Date(toMs).toISOString();

  const bars: TimelineBar[] = [];
  const points: TimelinePoint[] = [];

  // Mahadashas + antardashas within window
  const vim = computeVimshottari(k);
  for (const m of vim.mahadashas) {
    const mb = clampBar(
      { lane: 'maha', lord: m.lord, label: `${m.lord} maha`, start: m.start, end: m.end },
      fromMs, toMs,
    );
    if (!mb) continue;
    bars.push(mb);
    for (const a of computeAntardashas(m)) {
      const ab = clampBar(
        { lane: 'antar', lord: a.lord, label: `${m.lord}/${a.lord}`, start: a.start, end: a.end },
        fromMs, toMs,
      );
      if (ab) bars.push(ab);
    }
  }

  // Transit ingresses — resample from window start
  const days = Math.ceil((toMs - fromMs) / 86400_000);
  const wanted = new Set<PlanetId>(input.transitPlanets ?? SLOW_DEFAULT);
  const ingresses: TransitIngress[] = transitTimeline(fromISO, days);
  for (const ing of ingresses) {
    if (!wanted.has(ing.planet)) continue;
    points.push({
      lane: 'transit',
      date: ing.date,
      planet: ing.planet,
      tag: 'ingress',
      label: `${ing.planet} → ${RASHIS[ing.toSign - 1].name}`,
    });
  }

  // User events
  for (const ev of input.events ?? []) {
    const ms = new Date(ev.date).getTime();
    if (ms < fromMs || ms > toMs) continue;
    points.push({
      lane: 'event',
      date: ev.date,
      tag: ev.category ?? 'event',
      label: ev.title,
    });
  }

  points.sort((a, b) => a.date.localeCompare(b.date));
  bars.sort((a, b) => a.start.localeCompare(b.start));

  return { window: { from: fromISO, to: toISO }, bars, points };
}
