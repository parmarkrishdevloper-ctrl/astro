// Retrograde, combustion, and stationary-point timeline.
//
// Scans a date range at daily resolution and detects the sign-flips in each
// planet's motion & angular distance from the Sun:
//
//   Retrograde        — planet.speed flips negative → positive / vice-versa
//   Combust          — planet within ±n° of Sun (per planet threshold)
//   Stationary       — |speed| ≲ 0.01°/day  (computed around the flip)
//
// Output is a chronological list of events the user can scan through.

import swisseph from 'swisseph';
import { VEDIC_PLANETS, PlanetId, COMBUSTION_DEG, normDeg } from '../utils/astro-constants';
import { dateToJD, jdToDate } from '../utils/julian';
import { computeBody, computeAllGrahas } from './ephemeris.service';

const { SE_SUN } = swisseph;

export type RxEventKind =
  | 'retrograde-start'
  | 'retrograde-end'
  | 'stationary'
  | 'combust-start'
  | 'combust-end';

export interface RxEvent {
  planet: PlanetId;
  kind: RxEventKind;
  utc: string;
  longitude: number;
  signNum: number;
}

/** Signed angular distance a−b on the shorter arc (−180..180). */
function angDist(a: number, b: number): number {
  return ((a - b + 540) % 360) - 180;
}

function signOf(lng: number): number {
  return Math.floor(normDeg(lng) / 30) + 1;
}

export interface RxCombustOptions {
  /** ISO start date (inclusive) */
  start: string;
  /** Inclusive number of days to scan (max 3000). */
  days: number;
  /** Step in days between samples. Default 1. */
  stepDays?: number;
}

export function buildRxCombustTimeline(opts: RxCombustOptions): RxEvent[] {
  const step = opts.stepDays ?? 1;
  const dayCount = Math.min(3000, Math.max(1, opts.days));
  const startJD = dateToJD(new Date(opts.start));
  const events: RxEvent[] = [];

  // For each planet, keep previous-day state so we can detect transitions.
  type State = { retro: boolean; combust: boolean; speed: number };
  const state: Partial<Record<PlanetId, State>> = {};

  for (let i = 0; i <= dayCount; i += step) {
    const jd = startJD + i;
    const grahas = computeAllGrahas(jd);
    const sunLng = grahas.SU.longitude;

    for (const def of VEDIC_PLANETS) {
      if (def.id === 'SU' || def.id === 'MO') {
        // Sun never retrogrades; Moon never combusts (it IS the lunar reference)
        continue;
      }
      if (def.id === 'RA' || def.id === 'KE') continue; // nodes handled separately

      const p = grahas[def.id];
      const combustRange = COMBUSTION_DEG[def.id];
      const separation = Math.abs(angDist(p.longitude, sunLng));
      const nowCombust = combustRange != null && separation <= combustRange;
      const nowRetro = p.retrograde;

      const prev = state[def.id];
      if (prev) {
        if (prev.retro !== nowRetro) {
          events.push({
            planet: def.id,
            kind: nowRetro ? 'retrograde-start' : 'retrograde-end',
            utc: jdToDate(jd).toISOString(),
            longitude: p.longitude,
            signNum: signOf(p.longitude),
          });
        }
        if (prev.combust !== nowCombust) {
          events.push({
            planet: def.id,
            kind: nowCombust ? 'combust-start' : 'combust-end',
            utc: jdToDate(jd).toISOString(),
            longitude: p.longitude,
            signNum: signOf(p.longitude),
          });
        }
        // Stationary: |speed| very small and sign of speed changes
        if (Math.sign(prev.speed) !== Math.sign(p.speed) && Math.abs(p.speed) < 0.05) {
          events.push({
            planet: def.id,
            kind: 'stationary',
            utc: jdToDate(jd).toISOString(),
            longitude: p.longitude,
            signNum: signOf(p.longitude),
          });
        }
      }
      state[def.id] = { retro: nowRetro, combust: nowCombust, speed: p.speed };
    }
  }
  return events;
}

/** Compact summary for a given day: which planets are Rx / combust right now. */
export interface RxSnapshot {
  whenUTC: string;
  retrograde: PlanetId[];
  combust: PlanetId[];
}

export function rxSnapshot(whenISO: string): RxSnapshot {
  const jd = dateToJD(new Date(whenISO));
  const grahas = computeAllGrahas(jd);
  const sun = grahas.SU.longitude;
  const retrograde: PlanetId[] = [];
  const combust: PlanetId[] = [];
  for (const def of VEDIC_PLANETS) {
    if (def.id === 'SU' || def.id === 'MO' || def.id === 'RA' || def.id === 'KE') continue;
    const p = grahas[def.id];
    if (p.retrograde) retrograde.push(def.id);
    const range = COMBUSTION_DEG[def.id];
    if (range != null && Math.abs(angDist(p.longitude, sun)) <= range) combust.push(def.id);
  }
  return { whenUTC: new Date(whenISO).toISOString(), retrograde, combust };
}

// Keep a named export for tree-shakers
export { computeBody, SE_SUN };
