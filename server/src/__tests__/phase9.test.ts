import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { calculateAshtakavarga } from '../services/ashtakavarga.service';
import { computeTransits, transitTimeline } from '../services/transit.service';
import { buildEphemerisTable, buildGraphicalEphemeris } from '../services/ephemeris-table.service';
import { castPrashna } from '../services/prashna.service';
import { rectifyBirthTime } from '../services/rectification.service';
import { predictEvents, buildAuspiciousnessGraph } from '../services/event-prediction.service';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139,
  lng: 77.2090,
  placeName: 'New Delhi',
};

describe('ashtakavarga', () => {
  it('every BAV chart has 12 signs and total ≤ 56', () => {
    const k = calculateKundali(SAMPLE);
    const a = calculateAshtakavarga(k);
    for (const ref of Object.keys(a.bav) as Array<keyof typeof a.bav>) {
      expect(a.bav[ref].points).toHaveLength(12);
      expect(a.bav[ref].total).toBeLessThanOrEqual(56);
    }
  });

  it('SAV total = sum of 7 BAV totals and ≤ 337', () => {
    const k = calculateKundali(SAMPLE);
    const a = calculateAshtakavarga(k);
    const sumOfBav = Object.values(a.bav).reduce((s, b) => s + b.total, 0);
    expect(a.sav.total).toBe(sumOfBav);
    expect(a.sav.total).toBeLessThanOrEqual(337);
    expect(a.sav.total).toBeGreaterThan(150);
  });

  it('reductions never produce negative point counts', () => {
    const k = calculateKundali(SAMPLE);
    const a = calculateAshtakavarga(k);
    Object.values(a.trikonaShodhita).forEach((b) =>
      b.points.forEach((p) => expect(p).toBeGreaterThanOrEqual(0)),
    );
    Object.values(a.ekadhipatyaShodhita).forEach((b) =>
      b.points.forEach((p) => expect(p).toBeGreaterThanOrEqual(0)),
    );
  });
});

describe('transits', () => {
  it('returns positions for all 9 grahas with valid natal house', () => {
    const k = calculateKundali(SAMPLE);
    const t = computeTransits(k, '2026-04-09T00:00:00Z');
    expect(t.positions.length).toBeGreaterThanOrEqual(9);
    t.positions.forEach((p) => {
      expect(p.natalHouse).toBeGreaterThanOrEqual(1);
      expect(p.natalHouse).toBeLessThanOrEqual(12);
    });
    expect(t.sadesati.saturnHouseFromMoon).toBeGreaterThanOrEqual(1);
  });

  it('transit timeline finds at least one Moon ingress per week', () => {
    const ingresses = transitTimeline('2026-04-01T00:00:00Z', 14);
    const moonChanges = ingresses.filter((i) => i.planet === 'MO');
    expect(moonChanges.length).toBeGreaterThan(0);
  });
});

describe('ephemeris', () => {
  it('builds a 7-day table with 9 planets per row', () => {
    const rows = buildEphemerisTable('2026-04-01T00:00:00Z', 7);
    expect(rows).toHaveLength(7);
    expect(Object.keys(rows[0].positions).length).toBeGreaterThanOrEqual(9);
  });
  it('graphical ephemeris returns one series per planet', () => {
    const series = buildGraphicalEphemeris('2026-04-01T00:00:00Z', 7);
    expect(series).toHaveLength(9);
    series.forEach((s) => expect(s.points).toHaveLength(7));
  });
});

describe('prashna', () => {
  it('time-based prashna casts a chart for current moment', () => {
    const p = castPrashna({ lat: 28.6, lng: 77.2, question: 'Will I get the job?' });
    expect(p.mode).toBe('time');
    expect(p.chart.planets.length).toBeGreaterThanOrEqual(9);
  });
  it('KP horary number 1..249 produces a number-based chart with sub-lord', () => {
    const p = castPrashna({ lat: 28.6, lng: 77.2, number: 137 });
    expect(p.mode).toBe('number');
    expect(p.ascendantLords?.sub).toBeDefined();
  });
});

describe('rectification', () => {
  it('returns a best match within ±5 minute window', () => {
    const result = rectifyBirthTime(
      SAMPLE,
      [{ date: '2018-06-01T00:00:00Z', house: 7 }],
      5,
    );
    expect(result.candidates.length).toBe(11); // -5..+5 inclusive
    expect(result.bestMatch).toBeDefined();
  });
});

describe('event prediction', () => {
  it('produces at least a few predicted events over 20 years', () => {
    const k = calculateKundali(SAMPLE);
    const events = predictEvents(k, 20);
    expect(events.length).toBeGreaterThan(0);
    events.forEach((e) => {
      expect(['High', 'Medium', 'Low']).toContain(e.probability);
    });
  });
  it('auspiciousness graph has one point per year, scores in [0..100]', () => {
    const k = calculateKundali(SAMPLE);
    const pts = buildAuspiciousnessGraph(k, 30);
    expect(pts).toHaveLength(30);
    pts.forEach((p) => {
      expect(p.score).toBeGreaterThanOrEqual(0);
      expect(p.score).toBeLessThanOrEqual(100);
    });
  });
});
