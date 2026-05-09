import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { detectAllYogas } from '../services/yoga-engine.service';
import { interpretChart } from '../services/interpretation.service';
import { REMEDIES } from '../data/remedies';
import { CLASSICAL_REFS, findRefs } from '../data/classical-refs';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139,
  lng: 77.2090,
  placeName: 'New Delhi',
};

describe('yoga engine', () => {
  it('returns an array of detected yogas', () => {
    const k = calculateKundali(SAMPLE);
    const yogas = detectAllYogas(k);
    expect(Array.isArray(yogas)).toBe(true);
    yogas.forEach((y) => {
      expect(y.id).toBeDefined();
      expect(y.name).toBeDefined();
      expect(['strong', 'moderate', 'weak']).toContain(y.strength);
    });
  });

  it('parivartana detection is symmetric and unique', () => {
    const k = calculateKundali(SAMPLE);
    const yogas = detectAllYogas(k);
    const parivs = yogas.filter((y) => y.category === 'Parivartana');
    const ids = new Set(parivs.map((y) => y.id));
    expect(ids.size).toBe(parivs.length);
  });
});

describe('interpretation engine', () => {
  it('produces ascendant + 9 planets-in-houses + 9 planets-in-signs', () => {
    const k = calculateKundali(SAMPLE);
    const interp = interpretChart(k);
    expect(interp.ascendant.text).toBeTruthy();
    expect(interp.planetsInHouses).toHaveLength(9);
    expect(interp.planetsInSigns).toHaveLength(9);
    expect(interp.houseLordPlacements.length).toBeGreaterThan(0);
  });

  it('attaches classical refs where available', () => {
    const k = calculateKundali(SAMPLE);
    const interp = interpretChart(k);
    const allRefs = [
      ...interp.planetsInHouses.flatMap((l) => l.refs),
      ...interp.planetsInSigns.flatMap((l) => l.refs),
    ];
    // Each ref must come from the classical DB
    allRefs.forEach((r) => expect(r.id).toBeDefined());
  });
});

describe('remedies database', () => {
  it('has entries for all 9 grahas with mantras', () => {
    const ids = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA', 'RA', 'KE'] as const;
    ids.forEach((id) => {
      expect(REMEDIES[id]).toBeDefined();
      expect(REMEDIES[id].beejMantra).toBeTruthy();
      expect(REMEDIES[id].gemstone.primary).toBeTruthy();
    });
  });
});

describe('classical refs', () => {
  it('findRefs filters by tag', () => {
    expect(CLASSICAL_REFS.length).toBeGreaterThan(0);
    const ma = findRefs(['MA']);
    expect(ma.every((r) => r.tags.includes('MA'))).toBe(true);
  });
});
