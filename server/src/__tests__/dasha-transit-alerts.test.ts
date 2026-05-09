import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { computeDashaTransitAlerts } from '../services/dasha-transit-alerts.service';

initEphemeris();

const NATAL = calculateKundali({
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139, lng: 77.2090,
});

describe('Phase 15C — Dasha-transit overlap alerts', () => {
  it('produces alerts over a 3-year window at weekly sampling', () => {
    const alerts = computeDashaTransitAlerts({
      natal: NATAL, start: '2024-01-01T00:00:00Z', days: 3 * 365, stepDays: 7, minScore: 2,
    });
    expect(alerts.length).toBeGreaterThan(0);
    alerts.forEach((a) => {
      expect(a.score).toBeGreaterThanOrEqual(2);
      expect(a.score).toBeLessThanOrEqual(4);
      expect(a.dominantHouse).toBeGreaterThanOrEqual(1);
      expect(a.dominantHouse).toBeLessThanOrEqual(12);
      expect(a.topic).toBeTruthy();
    });
  });

  it('higher minScore yields fewer alerts', () => {
    const weak = computeDashaTransitAlerts({ natal: NATAL, start: '2024-01-01T00:00:00Z', days: 500, minScore: 2 });
    const strong = computeDashaTransitAlerts({ natal: NATAL, start: '2024-01-01T00:00:00Z', days: 500, minScore: 3 });
    expect(strong.length).toBeLessThanOrEqual(weak.length);
  });

  it('every alert includes dasha-lord + Jupiter/Saturn house factors', () => {
    const alerts = computeDashaTransitAlerts({ natal: NATAL, start: '2024-01-01T00:00:00Z', days: 365 });
    alerts.forEach((a) => {
      expect(a.factors.mahaHouse).toBeGreaterThanOrEqual(1);
      expect(a.factors.jupiterHouse).toBeGreaterThanOrEqual(1);
      expect(a.factors.saturnHouse).toBeGreaterThanOrEqual(1);
    });
  });
});
