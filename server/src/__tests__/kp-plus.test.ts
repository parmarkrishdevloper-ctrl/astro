import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { lordsAt, calculateKP } from '../services/kp.service';
import { VIMSHOTTARI_ORDER } from '../utils/astro-constants';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139,
  lng: 77.2090,
  placeName: 'New Delhi',
};

describe('KP sub-sub lord', () => {
  it('every longitude yields a valid sub-sub lord', () => {
    const pts = [0.001, 30.1, 59.9, 90.5, 181.234, 270.77, 359.99];
    for (const x of pts) {
      const l = lordsAt(x);
      expect(VIMSHOTTARI_ORDER).toContain(l.subSub);
    }
  });

  it('at the exact start of a nakshatra, sub-sub equals star lord', () => {
    const l = lordsAt(0.0001);
    expect(l.star).toBe('KE');
    expect(l.sub).toBe('KE');
    expect(l.subSub).toBe('KE');
  });
});

describe('KP cusp significators', () => {
  const k = calculateKundali(SAMPLE);
  const kp = calculateKP(k);

  it('returns 12 entries, one per cusp', () => {
    expect(kp.cuspSignificators).toHaveLength(12);
    kp.cuspSignificators.forEach((c, i) => {
      expect(c.house).toBe(i + 1);
    });
  });

  it('A/B/C/D arrays together are non-empty for every house', () => {
    kp.cuspSignificators.forEach((c) => {
      const total = c.A.length + c.B.length + c.C.length + c.D.length;
      expect(total).toBeGreaterThan(0);
    });
  });

  it('the D (house lord) level always has exactly 1 planet', () => {
    kp.cuspSignificators.forEach((c) => {
      expect(c.D).toHaveLength(1);
    });
  });
});

describe('KP cusp + planet subSubLord fields', () => {
  it('every cusp and planet carry a sub-sub lord', () => {
    const k = calculateKundali(SAMPLE);
    const kp = calculateKP(k);
    kp.cusps.forEach((c) => expect(c.subSubLord).toBeDefined());
    kp.planets.forEach((p) => expect(p.subSubLord).toBeDefined());
  });
});
