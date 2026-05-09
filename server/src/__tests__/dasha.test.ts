import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali, clearKundaliCache } from '../services/kundali.service';
import { computeVimshottari, computeAntardashas } from '../services/dasha.service';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139, lng: 77.2090,
  placeName: 'New Delhi',
};

describe('vimshottari dasha', () => {
  it('produces 9 mahadashas summing close to 120 years', () => {
    const k = calculateKundali(SAMPLE);
    const v = computeVimshottari(k);
    expect(v.mahadashas).toHaveLength(9);
    const sum = v.mahadashas.reduce((s, m) => s + m.years, 0);
    // First maha is partial, so total < 120 but > ~100
    expect(sum).toBeLessThanOrEqual(120.001);
    expect(sum).toBeGreaterThan(100);
  });

  it('first antardasha lord matches mahadasha lord', () => {
    const k = calculateKundali(SAMPLE);
    const v = computeVimshottari(k);
    const antars = computeAntardashas(v.mahadashas[0]);
    expect(antars[0].lord).toBe(v.mahadashas[0].lord);
  });

  it('antardasha years sum to mahadasha years', () => {
    const k = calculateKundali(SAMPLE);
    const v = computeVimshottari(k);
    const maha = v.mahadashas[1]; // pick a non-partial one
    const antars = computeAntardashas(maha);
    const sum = antars.reduce((s, a) => s + a.years, 0);
    expect(Math.abs(sum - maha.years)).toBeLessThan(0.01);
  });
});

describe('kundali cache', () => {
  it('returns cached result on repeat call', () => {
    clearKundaliCache();
    const a = calculateKundali(SAMPLE);
    const b = calculateKundali(SAMPLE);
    // Same object reference (cache hit returns the cached object)
    expect(a).toBe(b);
  });
});
