import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { castPrashna, computePrashnaVerdict } from '../services/prashna.service';

initEphemeris();

describe('prashna — time-based casting', () => {
  it('produces a chart and (no verdict yet) with the current moment', () => {
    const res = castPrashna({ lat: 28.6139, lng: 77.2090, question: 'test' });
    expect(res.mode).toBe('time');
    expect(res.chart).toBeDefined();
    expect(res.chart.planets.length).toBe(9);
  });

  it('KP number mode (1..249) overrides the ascendant', () => {
    const res = castPrashna({ number: 117, lat: 28.6139, lng: 77.2090 });
    expect(res.mode).toBe('number');
    expect(res.ascendantLords).toBeDefined();
    // Ascendant longitude should be roughly (117-0.5) × (360/249) ≈ 168.19°
    expect(res.chart.ascendant.longitude).toBeGreaterThan(165);
    expect(res.chart.ascendant.longitude).toBeLessThan(172);
  });

  it('rejects KP numbers outside 1..249', () => {
    expect(() => castPrashna({ number: 0, lat: 28, lng: 77 })).toThrow();
    expect(() => castPrashna({ number: 250, lat: 28, lng: 77 })).toThrow();
  });
});

describe('prashna — verdict computation', () => {
  const prashna = castPrashna({ lat: 28.6139, lng: 77.2090, whenISO: '2025-10-01T10:00:00Z' });

  it('marriage verdict returns YES/NO/MIXED with reasoning', () => {
    const v = computePrashnaVerdict(prashna, 'marriage');
    expect(['yes', 'no', 'mixed']).toContain(v.verdict);
    expect(v.category).toBe('marriage');
    expect(v.primaryHouse).toBe(7);
    expect(v.analysis).toHaveLength(3);
    expect(v.reasoning.length).toBeGreaterThan(10);
  });

  it('each sub-lord analysis identifies positive/destroyer hits', () => {
    const v = computePrashnaVerdict(prashna, 'career');
    v.analysis.forEach((a) => {
      expect(['Ascendant', 'Moon', 'Primary house']).toContain(a.source);
      expect(a.signifiesHouses).toBeDefined();
      expect(typeof a.positiveHit).toBe('boolean');
      expect(typeof a.destroyerHit).toBe('boolean');
    });
  });

  it('confidence is 0..1', () => {
    const v = computePrashnaVerdict(prashna, 'health');
    expect(v.confidence).toBeGreaterThanOrEqual(0);
    expect(v.confidence).toBeLessThanOrEqual(1);
  });
});
