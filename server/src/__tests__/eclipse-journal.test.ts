import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { listIngresses, buildEclipseJournal } from '../services/eclipse-journal.service';

initEphemeris();

const NATAL = calculateKundali({
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139, lng: 77.2090,
});

describe('Phase 15B — Eclipse & ingress journal', () => {
  it('listIngresses produces major-planet sign changes', () => {
    const ing = listIngresses({ start: '2024-01-01T00:00:00Z', days: 365 * 3 });
    expect(ing.length).toBeGreaterThan(2);
    ing.forEach((e) => {
      expect(['JU','SA','RA','KE']).toContain(e.planet);
      expect(e.fromSignNum).not.toBe(e.toSignNum);
    });
  });

  it('annotates natal house when a chart is provided', () => {
    const ing = listIngresses({ start: '2024-01-01T00:00:00Z', days: 365 * 3, natal: NATAL });
    expect(ing.every((e) => typeof e.natalHouse === 'number')).toBe(true);
    ing.forEach((e) => {
      expect(e.natalHouse).toBeGreaterThanOrEqual(1);
      expect(e.natalHouse).toBeLessThanOrEqual(12);
    });
  });

  it('buildEclipseJournal combines eclipses and ingresses', () => {
    const j = buildEclipseJournal({ start: '2025-01-01T00:00:00Z', days: 365 * 2 });
    expect(Array.isArray(j.eclipses)).toBe(true);
    expect(Array.isArray(j.ingresses)).toBe(true);
    expect(j.ingresses.length).toBeGreaterThan(0);
  });

  it('fast-planet mode includes Mercury / Venus / Mars ingresses', () => {
    const fast = listIngresses({ start: '2025-01-01T00:00:00Z', days: 180, includeFast: true });
    const planets = new Set(fast.map((e) => e.planet));
    expect(planets.has('ME')).toBe(true);
    expect(planets.has('VE') || planets.has('MA')).toBe(true);
  });
});
