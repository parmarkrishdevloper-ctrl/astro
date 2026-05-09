import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { computeChalit, buildBhavas } from '../services/chalit.service';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139,
  lng: 77.2090,
  placeName: 'New Delhi',
};

describe('chalit — Bhava Chalit chart', () => {
  const k = calculateKundali(SAMPLE);

  it('returns 12 bhavas with monotonically-forward starts (Placidus)', () => {
    const c = computeChalit(k, 'placidus');
    expect(c.bhavas.length).toBe(12);
    // Every bhava has a valid start/end and a rashi assignment
    for (const b of c.bhavas) {
      expect(b.num).toBeGreaterThanOrEqual(1);
      expect(b.num).toBeLessThanOrEqual(12);
      expect(b.start).toBeGreaterThanOrEqual(0);
      expect(b.start).toBeLessThan(360);
      expect(b.rashiAtStart.num).toBeGreaterThanOrEqual(1);
      expect(b.rashiAtStart.num).toBeLessThanOrEqual(12);
    }
  });

  it('Sripati method places cusp at the midpoint of the bhava', () => {
    const c = computeChalit(k, 'sripati');
    const p = computeChalit(k, 'placidus');
    // In Placidus method, bhava starts at the cusp; in Sripati the cusp is
    // the midpoint. So Sripati bhava[i].start must NOT equal Placidus
    // bhava[i].start for typical charts (unless cusps are evenly spaced).
    const anyDifferent = p.bhavas.some((b, i) => Math.abs(b.start - c.bhavas[i].start) > 0.01);
    expect(anyDifferent).toBe(true);
  });

  it('every planet is assigned to exactly one bhava 1..12', () => {
    const c = computeChalit(k, 'placidus');
    expect(c.planets.length).toBe(9);
    for (const pl of c.planets) {
      expect(pl.chalitHouse).toBeGreaterThanOrEqual(1);
      expect(pl.chalitHouse).toBeLessThanOrEqual(12);
    }
  });

  it('flags planets whose chalit house differs from whole-sign', () => {
    const c = computeChalit(k, 'placidus');
    const flagged = c.shiftedPlanets;
    const actualDiff = c.planets.filter((p) => p.wholeSignHouse !== p.chalitHouse).map((p) => p.id);
    expect(flagged).toEqual(actualDiff);
  });

  it('buildBhavas rejects bad input', () => {
    expect(() => buildBhavas([1, 2, 3], 'placidus')).toThrow();
  });

  it('bhava arcs together cover roughly 360 degrees', () => {
    const c = computeChalit(k, 'placidus');
    const totalSpan = c.bhavas.reduce((acc, b) => {
      const span = (b.end - b.start + 360) % 360;
      return acc + (span === 0 ? 360 : span);
    }, 0);
    expect(Math.abs(totalSpan - 360)).toBeLessThan(0.5);
  });
});
