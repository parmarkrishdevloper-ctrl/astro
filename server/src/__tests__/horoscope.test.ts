import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { buildHoroscope } from '../services/horoscope.service';

initEphemeris();

const NATAL = calculateKundali({
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139, lng: 77.2090,
});

describe('Phase 15D — Personal horoscope', () => {
  it('generates a day / week / month report', () => {
    for (const scope of ['day', 'week', 'month'] as const) {
      const r = buildHoroscope(NATAL, scope, '2025-10-01T00:00:00Z');
      expect(r.scope).toBe(scope);
      expect(r.headline.length).toBeGreaterThan(5);
      expect(r.bullets.length).toBeGreaterThanOrEqual(1);
      expect(new Date(r.dateTo).getTime()).toBeGreaterThan(new Date(r.dateFrom).getTime());
    }
  });

  it('identifies running maha + antar lords for a chart old enough', () => {
    const r = buildHoroscope(NATAL, 'day', '2025-10-01T00:00:00Z');
    expect(r.currentMahaLord).not.toBeNull();
    expect(r.currentAntarLord).not.toBeNull();
  });

  it('produces panchang context + moon placement', () => {
    const r = buildHoroscope(NATAL, 'day', '2025-10-01T00:00:00Z');
    expect(r.panchang.tithi.length).toBeGreaterThan(0);
    expect(r.panchang.vara.length).toBeGreaterThan(0);
    expect(r.moon.signName.length).toBeGreaterThan(0);
  });

  it('transit focus lists Jupiter and Saturn natal houses', () => {
    const r = buildHoroscope(NATAL, 'week', '2025-10-01T00:00:00Z');
    const planets = r.transitFocus.map((f) => f.planet);
    expect(planets).toContain('JU');
    expect(planets).toContain('SA');
  });
});
