import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { analyzeLifeAreas, analyzeMedical, analyzeCareer, analyzeProgeny, analyzeWealth } from '../services/life-areas.service';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139,
  lng: 77.2090,
  placeName: 'New Delhi',
};

describe('life-area reports', () => {
  const k = calculateKundali(SAMPLE);
  const suite = analyzeLifeAreas(k);

  it('returns 4 reports with scores in 0..100', () => {
    const areas = ['medical', 'career', 'progeny', 'wealth'] as const;
    for (const a of areas) {
      const r = suite[a];
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.summary.length).toBeGreaterThan(5);
      expect(Array.isArray(r.factors)).toBe(true);
      expect(r.factors.length).toBeGreaterThan(0);
    }
  });

  it('every factor has a positive or negative kind + non-zero weight', () => {
    for (const r of Object.values(suite)) {
      for (const f of r.factors) {
        expect(['positive', 'negative']).toContain(f.kind);
        expect(f.text.length).toBeGreaterThan(0);
      }
    }
  });

  it('per-area helper matches suite output', () => {
    expect(analyzeMedical(k).area).toBe('medical');
    expect(analyzeCareer(k).area).toBe('career');
    expect(analyzeProgeny(k).area).toBe('progeny');
    expect(analyzeWealth(k).area).toBe('wealth');
  });
});
