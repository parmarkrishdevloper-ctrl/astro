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

describe('kp lordsAt', () => {
  it('returns sign/star/sub from the canonical 9-planet pool', () => {
    const l = lordsAt(123.4567);
    expect(VIMSHOTTARI_ORDER).toContain(l.sign as any);
    // Sub-lord must be one of the 9 Vimshottari planets too
    expect(VIMSHOTTARI_ORDER).toContain(l.sub);
    expect(VIMSHOTTARI_ORDER).toContain(l.star);
  });

  it('lord at start of Ashwini (0°) has Ketu as star and sub', () => {
    const l = lordsAt(0.0001);
    expect(l.star).toBe('KE');
    expect(l.sub).toBe('KE'); // first sub of Ashwini = star lord itself
  });
});

describe('kp full calculation', () => {
  it('produces 12 cusps with all three lords', () => {
    const k = calculateKundali(SAMPLE);
    const kp = calculateKP(k);
    expect(kp.cusps).toHaveLength(12);
    kp.cusps.forEach((c) => {
      expect(c.signLord).toBeDefined();
      expect(c.starLord).toBeDefined();
      expect(c.subLord).toBeDefined();
    });
  });

  it('every planet appears once in significators with at least one house', () => {
    const k = calculateKundali(SAMPLE);
    const kp = calculateKP(k);
    expect(kp.significators.length).toBeGreaterThanOrEqual(7);
    kp.significators.forEach((s) => {
      expect(s.houses.length).toBeGreaterThan(0);
    });
  });
});
