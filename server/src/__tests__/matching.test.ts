import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { matchKundalis } from '../services/matching.service';

initEphemeris();

const BOY  = { datetime: '1990-08-15T10:30:00+05:30', lat: 28.6139, lng: 77.2090 };
const GIRL = { datetime: '1992-03-20T14:15:00+05:30', lat: 19.0760, lng: 72.8777 };

describe('ashtakoot matching', () => {
  it('returns 8 koots with max total of 36', () => {
    const r = matchKundalis(BOY, GIRL);
    expect(r.koots).toHaveLength(8);
    expect(r.total.max).toBe(36);
    expect(r.total.obtained).toBeGreaterThanOrEqual(0);
    expect(r.total.obtained).toBeLessThanOrEqual(36);
  });

  it('koot scores never exceed their max', () => {
    const r = matchKundalis(BOY, GIRL);
    for (const k of r.koots) {
      expect(k.obtained).toBeGreaterThanOrEqual(0);
      expect(k.obtained).toBeLessThanOrEqual(k.max);
    }
  });

  it('total obtained equals sum of koot scores', () => {
    const r = matchKundalis(BOY, GIRL);
    const sum = r.koots.reduce((s, k) => s + k.obtained, 0);
    expect(r.total.obtained).toBe(sum);
  });

  it('verdict matches threshold band', () => {
    const r = matchKundalis(BOY, GIRL);
    if (r.total.obtained >= 30) expect(r.verdict).toMatch(/Excellent/);
    else if (r.total.obtained >= 24) expect(r.verdict).toMatch(/Good/);
    else if (r.total.obtained >= 18) expect(r.verdict).toMatch(/Acceptable/);
    else expect(r.verdict).toMatch(/Below threshold/);
  });
});
