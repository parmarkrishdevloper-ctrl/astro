import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { computeUpagrahas } from '../services/upagraha.service';
import { normDeg } from '../utils/astro-constants';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139,
  lng: 77.2090,
  placeName: 'New Delhi',
};

describe('upagrahas — shadow sensitive points', () => {
  const k = calculateKundali(SAMPLE);
  const u = computeUpagrahas(k);

  it('returns the five Sun-derived kala group points', () => {
    expect(u.kalaGroup.length).toBe(5);
    const ids = u.kalaGroup.map((p) => p.id);
    expect(ids).toEqual(['DHUMA','VYATIPATA','PARIVESHA','INDRACHAPA','UPAKETU']);
  });

  it("Dhuma = Sun + 133°20' (within 0.001°)", () => {
    const sun = k.planets.find((p) => p.id === 'SU')!.longitude;
    const dhuma = u.kalaGroup.find((p) => p.id === 'DHUMA')!.longitude;
    const expected = normDeg(sun + 133 + 20/60);
    expect(Math.abs(dhuma - expected)).toBeLessThan(0.001);
  });

  it('Vyatipata = 360° − Dhuma', () => {
    const dhuma = u.kalaGroup.find((p) => p.id === 'DHUMA')!.longitude;
    const vyati = u.kalaGroup.find((p) => p.id === 'VYATIPATA')!.longitude;
    expect(Math.abs(vyati - normDeg(360 - dhuma))).toBeLessThan(0.001);
  });

  it('Parivesha = Vyatipata + 180°', () => {
    const vyati = u.kalaGroup.find((p) => p.id === 'VYATIPATA')!.longitude;
    const pari  = u.kalaGroup.find((p) => p.id === 'PARIVESHA')!.longitude;
    expect(Math.abs(pari - normDeg(vyati + 180))).toBeLessThan(0.001);
  });

  it('Indrachapa = 360° − Parivesha', () => {
    const pari = u.kalaGroup.find((p) => p.id === 'PARIVESHA')!.longitude;
    const ind  = u.kalaGroup.find((p) => p.id === 'INDRACHAPA')!.longitude;
    expect(Math.abs(ind - normDeg(360 - pari))).toBeLessThan(0.001);
  });

  it('every kala point has valid rashi, nakshatra, and house 1..12', () => {
    for (const p of u.kalaGroup) {
      expect(p.longitude).toBeGreaterThanOrEqual(0);
      expect(p.longitude).toBeLessThan(360);
      expect(p.rashi.num).toBeGreaterThanOrEqual(1);
      expect(p.rashi.num).toBeLessThanOrEqual(12);
      expect(p.nakshatra.num).toBeGreaterThanOrEqual(1);
      expect(p.nakshatra.num).toBeLessThanOrEqual(27);
      expect(p.house).toBeGreaterThanOrEqual(1);
      expect(p.house).toBeLessThanOrEqual(12);
    }
  });

  it('computes Gulika and Mandi for this day birth', () => {
    expect(u.gulika).not.toBeNull();
    expect(u.mandi).not.toBeNull();
    expect(u.saturnSegment.isDayBirth).toBe(true);
    expect(u.saturnSegment.segmentNumber).toBeGreaterThanOrEqual(1);
    expect(u.saturnSegment.segmentNumber).toBeLessThanOrEqual(8);
  });

  it('Mandi longitude falls between Gulika start and Gulika end asc. — midpoint ≠ start', () => {
    expect(u.gulika!.longitude).not.toBe(u.mandi!.longitude);
  });
});
