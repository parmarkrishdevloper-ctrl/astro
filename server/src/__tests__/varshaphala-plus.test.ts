import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateVarshaphala, SAHAM_DEFS } from '../services/varshaphala.service';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139,
  lng: 77.2090,
  placeName: 'New Delhi',
};

describe('Phase 14J — Tajika deepening', () => {
  const v = calculateVarshaphala(SAMPLE, 35);

  it('SAHAM_DEFS has at least 50 entries (Tajika expansion)', () => {
    expect(SAHAM_DEFS.length).toBeGreaterThanOrEqual(50);
  });

  it('every saham has a valid longitude 0..360 and sign 1..12', () => {
    v.sahams.forEach((s) => {
      expect(s.longitude).toBeGreaterThanOrEqual(0);
      expect(s.longitude).toBeLessThan(360);
      expect(s.signNum).toBeGreaterThanOrEqual(1);
      expect(s.signNum).toBeLessThanOrEqual(12);
    });
  });

  it('Yogi / Avayogi are computed from Sun+Moon', () => {
    expect(v.yogi.point).toBeGreaterThanOrEqual(0);
    expect(v.yogi.point).toBeLessThan(360);
    expect(['SU','MO','MA','ME','JU','VE','SA','RA','KE']).toContain(v.yogi.nakLord);
    expect(['SU','MO','MA','ME','JU','VE','SA','RA','KE']).toContain(v.avayogi.nakLord);
    expect(['SU','MO','MA','ME','JU','VE','SA','RA','KE']).toContain(v.duplicateYogi);
  });

  it('Tripataki chakra has 28 nakshatra flag assignments', () => {
    expect(v.tripataki.nakshatras).toHaveLength(28);
    const flagSet = new Set(v.tripataki.nakshatras.map((n) => n.flag));
    expect(flagSet.has('flag1')).toBe(true);
    expect(flagSet.has('flag2')).toBe(true);
    expect(flagSet.has('flag3')).toBe(true);
  });

  it('Masa-Phala splits the year into 12 months', () => {
    expect(v.masaPhala).toHaveLength(12);
    for (let i = 1; i < 12; i++) {
      const prevEnd = new Date(v.masaPhala[i - 1].endDate).getTime();
      const currStart = new Date(v.masaPhala[i].startDate).getTime();
      // boundaries line up
      expect(Math.abs(prevEnd - currStart)).toBeLessThan(2000);
    }
  });
});
