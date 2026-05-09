import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { computeSensitivePoints } from '../services/sensitive-points.service';
import { normDeg } from '../utils/astro-constants';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139,
  lng: 77.2090,
  placeName: 'New Delhi',
};

describe('sensitive points', () => {
  const k = calculateKundali(SAMPLE);
  const sp = computeSensitivePoints(k);
  const pt = (id: string) => sp.points.find((p) => p.id === id)!;

  it('returns Fortune + Spirit + Bhrigu Bindu + Arka + Chandra (+ optional Vertex)', () => {
    const ids = sp.points.map((p) => p.id);
    expect(ids).toContain('LOT_FORTUNE');
    expect(ids).toContain('LOT_SPIRIT');
    expect(ids).toContain('BHRIGU_BINDU');
    expect(ids).toContain('ARKA_LAGNA');
    expect(ids).toContain('CHANDRA_LAGNA');
    // Vertex is best-effort, may or may not be present
    expect(sp.points.length).toBeGreaterThanOrEqual(5);
  });

  it('Fortune + Spirit longitudes are complements about Asc (classical reflection)', () => {
    const fortune = pt('LOT_FORTUNE').longitude;
    const spirit  = pt('LOT_SPIRIT').longitude;
    const asc = k.ascendant.longitude;
    // Fortune + Spirit = 2·Asc  (mod 360)
    const sum = normDeg(fortune + spirit);
    const twoAsc = normDeg(2 * asc);
    const diff = Math.min(Math.abs(sum - twoAsc), 360 - Math.abs(sum - twoAsc));
    expect(diff).toBeLessThan(0.001);
  });

  it('Bhrigu Bindu lies on the shorter arc between Moon and Rahu', () => {
    const moon = k.planets.find((p) => p.id === 'MO')!.longitude;
    const rahu = k.planets.find((p) => p.id === 'RA')!.longitude;
    const bb = pt('BHRIGU_BINDU').longitude;
    const fwd = (rahu - moon + 360) % 360;
    const mid = normDeg(moon + fwd / 2);
    expect(Math.abs(bb - mid)).toBeLessThan(0.001);
  });

  it('Arka Lagna sits at 0° of Sun sign', () => {
    expect(pt('ARKA_LAGNA').longitude % 30).toBeLessThan(0.001);
  });

  it('Chandra Lagna sits at 0° of Moon sign', () => {
    expect(pt('CHANDRA_LAGNA').longitude % 30).toBeLessThan(0.001);
  });

  it('determines day/night from Sun sect', () => {
    expect(typeof sp.isDayBirth).toBe('boolean');
  });

  it('returns pre-natal eclipses with dates before birth', () => {
    const { solar, lunar } = sp.preNatalEclipses;
    // Eclipses may not always be computable, but when they are they must
    // predate birth.
    if (solar) expect(solar.daysBeforeBirth).toBeGreaterThan(0);
    if (lunar) expect(lunar.daysBeforeBirth).toBeGreaterThan(0);
  });
});
