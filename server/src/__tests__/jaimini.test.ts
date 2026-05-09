import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import {
  calculateKarakas,
  calculateJaiminiAspects,
  calculateSpecialLagnas,
  calculateCharaDasha,
} from '../services/jaimini.service';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139,
  lng: 77.2090,
  placeName: 'New Delhi',
};

describe('jaimini karakas', () => {
  it('produces 7 karakas covering AK..DK', () => {
    const k = calculateKundali(SAMPLE);
    const ks = calculateKarakas(k);
    expect(ks).toHaveLength(7);
    expect(ks.map((x) => x.karaka)).toEqual(['AK', 'AmK', 'BK', 'MK', 'PK', 'GK', 'DK']);
  });

  it('AK has the highest degree-in-sign of all 7 (Su..Sa)', () => {
    const k = calculateKundali(SAMPLE);
    const ks = calculateKarakas(k);
    const ak = ks[0];
    const dk = ks[6];
    expect(ak.degInRashi).toBeGreaterThanOrEqual(dk.degInRashi);
  });

  it('every planet appears exactly once', () => {
    const k = calculateKundali(SAMPLE);
    const ids = calculateKarakas(k).map((x) => x.planet);
    expect(new Set(ids).size).toBe(7);
  });
});

describe('jaimini aspects', () => {
  it('returns movable-fixed and dual groups', () => {
    const k = calculateKundali(SAMPLE);
    const groups = calculateJaiminiAspects(k);
    expect(groups).toHaveLength(2);
    expect(groups[0].group).toBe('movable-fixed');
    expect(groups[1].group).toBe('dual');
  });
});

describe('special lagnas', () => {
  it('produces 12 arudha padas (A1..A12)', () => {
    const k = calculateKundali(SAMPLE);
    const sl = calculateSpecialLagnas(k);
    expect(sl.arudhaPadas).toHaveLength(12);
    expect(sl.arudhaPadas[0].house).toBe(1);
    expect(sl.arudhaPadas[11].house).toBe(12);
    // every pada is a valid sign 1..12
    sl.arudhaPadas.forEach((p) => {
      expect(p.signNum).toBeGreaterThanOrEqual(1);
      expect(p.signNum).toBeLessThanOrEqual(12);
    });
  });

  it('upapada equals A12', () => {
    const k = calculateKundali(SAMPLE);
    const sl = calculateSpecialLagnas(k);
    expect(sl.upapadaLagna.signNum).toBe(sl.arudhaPadas[11].signNum);
  });
});

describe('chara dasha', () => {
  it('produces 12 sign periods', () => {
    const k = calculateKundali(SAMPLE);
    const cd = calculateCharaDasha(k);
    expect(cd).toHaveLength(12);
    cd.forEach((p) => {
      expect(p.years).toBeGreaterThanOrEqual(1);
      expect(p.years).toBeLessThanOrEqual(12);
    });
  });

  it('first chara period starts at the lagna sign', () => {
    const k = calculateKundali(SAMPLE);
    const cd = calculateCharaDasha(k);
    expect(cd[0].signNum).toBe(k.ascendant.rashi.num);
  });
});
