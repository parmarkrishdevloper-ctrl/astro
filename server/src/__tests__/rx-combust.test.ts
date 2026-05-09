import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { buildRxCombustTimeline, rxSnapshot } from '../services/rx-combust.service';

initEphemeris();

describe('Phase 15A — Rx & combust timeline', () => {
  it('scans a 1-year window and produces a chronological event list', () => {
    const events = buildRxCombustTimeline({ start: '2025-01-01T00:00:00Z', days: 365 });
    expect(events.length).toBeGreaterThan(10);   // several Rx + combust events per year
    // monotonically forward
    for (let i = 1; i < events.length; i++) {
      expect(new Date(events[i].utc).getTime()).toBeGreaterThanOrEqual(
        new Date(events[i - 1].utc).getTime(),
      );
    }
  });

  it('Mercury, Jupiter, Saturn retrograde multiple times in a 3-year window', () => {
    const events = buildRxCombustTimeline({ start: '2024-01-01T00:00:00Z', days: 1095 });
    const retrogradingPlanets = new Set(events.filter((e) => e.kind === 'retrograde-start').map((e) => e.planet));
    // Mercury (~3×/year), Jupiter (~1×/year), Saturn (~1×/year) always hit in 3 years.
    expect(retrogradingPlanets.has('ME')).toBe(true);
    expect(retrogradingPlanets.has('JU')).toBe(true);
    expect(retrogradingPlanets.has('SA')).toBe(true);
  });

  it('rxSnapshot returns the current Rx/combust lists', () => {
    const s = rxSnapshot('2025-07-01T00:00:00Z');
    expect(Array.isArray(s.retrograde)).toBe(true);
    expect(Array.isArray(s.combust)).toBe(true);
  });

  it('every event has a valid sign 1..12', () => {
    const events = buildRxCombustTimeline({ start: '2025-01-01T00:00:00Z', days: 120 });
    events.forEach((e) => {
      expect(e.signNum).toBeGreaterThanOrEqual(1);
      expect(e.signNum).toBeLessThanOrEqual(12);
    });
  });
});
