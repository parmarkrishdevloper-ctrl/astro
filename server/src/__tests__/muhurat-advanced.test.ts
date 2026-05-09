import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { findMuhuratAdvanced } from '../services/muhurat.service';

initEphemeris();

const REQ = {
  event: 'marriage' as const,
  startDate: new Date('2026-02-01T00:00:00Z'),
  endDate:   new Date('2026-02-03T00:00:00Z'),
  lat: 28.6139,
  lng: 77.2090,
};

describe('advanced muhurat finder', () => {
  it('returns slots with all required fields', () => {
    const r = findMuhuratAdvanced({ ...REQ, stepMinutes: 120 });
    expect(r.slots.length).toBeGreaterThan(0);
    r.slots.forEach((s) => {
      expect(s.start).toBeTruthy();
      expect(s.end).toBeTruthy();
      expect(['good', 'neutral', 'bad']).toContain(s.chaughadiaQuality);
      expect(['SA','JU','MA','SU','VE','ME','MO']).toContain(s.hora);
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(20);
    });
  });

  it('sorts slots best-first by score', () => {
    const r = findMuhuratAdvanced({ ...REQ, stepMinutes: 180 });
    for (let i = 1; i < r.slots.length; i++) {
      expect(r.slots[i - 1].score).toBeGreaterThanOrEqual(r.slots[i].score);
    }
  });

  it('Tara Bala is included when birthNakshatra provided', () => {
    const r = findMuhuratAdvanced({ ...REQ, stepMinutes: 240, birthNakshatra: 4 /* Rohini */ });
    const withTara = r.slots.filter((s) => s.tara);
    expect(withTara.length).toBeGreaterThan(0);
    withTara.forEach((s) => {
      expect(s.tara!.num).toBeGreaterThanOrEqual(1);
      expect(s.tara!.num).toBeLessThanOrEqual(9);
    });
  });

  it('higher stepMinutes yields fewer slots', () => {
    const a = findMuhuratAdvanced({ ...REQ, stepMinutes: 60 });
    const b = findMuhuratAdvanced({ ...REQ, stepMinutes: 240 });
    expect(a.slots.length).toBeGreaterThan(b.slots.length);
  });
});
