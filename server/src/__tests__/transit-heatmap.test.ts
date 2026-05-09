import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { buildTransitHeatmap } from '../services/transit-heatmap.service';

initEphemeris();

const NATAL = calculateKundali({
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139, lng: 77.2090,
});

describe('Phase 15E — Transit heatmap', () => {
  it('produces 30 daily entries for a 30-day window', () => {
    const h = buildTransitHeatmap(NATAL, '2025-10-01T00:00:00Z', 30);
    expect(h).toHaveLength(30);
    h.forEach((d) => {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
      expect(['excellent','good','neutral','caution','difficult']).toContain(d.category);
    });
  });

  it('dates advance one day at a time', () => {
    const h = buildTransitHeatmap(NATAL, '2025-01-01T00:00:00Z', 10);
    for (let i = 1; i < h.length; i++) {
      const delta = new Date(h[i].date).getTime() - new Date(h[i - 1].date).getTime();
      expect(delta).toBe(86400000);
    }
  });

  it('caps at 732 days (2 years)', () => {
    const h = buildTransitHeatmap(NATAL, '2025-01-01T00:00:00Z', 5000);
    expect(h.length).toBeLessThanOrEqual(732);
  });

  it('score ≠ 50 for at least some days (heatmap has variation)', () => {
    const h = buildTransitHeatmap(NATAL, '2025-01-01T00:00:00Z', 90);
    const unique = new Set(h.map((d) => d.score));
    expect(unique.size).toBeGreaterThan(1);
  });
});
