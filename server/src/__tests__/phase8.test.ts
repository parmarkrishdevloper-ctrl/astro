import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { calculateVarshaphala, calculateMuddaDasha, computeSahams } from '../services/varshaphala.service';
import { calculateAvasthas } from '../services/avastha.service';
import { calculateSudarshana } from '../services/sudarshana.service';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139,
  lng: 77.2090,
  placeName: 'New Delhi',
};

describe('varshaphala', () => {
  it('age 0 returns the natal chart itself', () => {
    const v = calculateVarshaphala(SAMPLE, 0);
    expect(v.age).toBe(0);
    expect(v.muntha.signNum).toBeGreaterThanOrEqual(1);
  });

  it('age 35 finds a solar return where Sun matches natal Sun longitude', () => {
    const natal = calculateKundali(SAMPLE);
    const natalSun = natal.planets.find((p) => p.id === 'SU')!.longitude;
    const v = calculateVarshaphala(SAMPLE, 35);
    const varshaSun = v.chart.planets.find((p) => p.id === 'SU')!.longitude;
    // Same sidereal Sun longitude — signed shortest diff should be ~0
    const signed = ((varshaSun - natalSun + 540) % 360) - 180;
    expect(Math.abs(signed)).toBeLessThan(0.01);
  });

  it('produces at least 16 sahams (expanded Tajika set in Phase 14J)', () => {
    const v = calculateVarshaphala(SAMPLE, 35);
    const sahams = computeSahams(v.chart);
    expect(sahams.length).toBeGreaterThanOrEqual(16);
    const keys = sahams.map((s) => s.key);
    // Original 16 core sahams must still be present
    ['punya','vidya','yasas','mitra','mahatmya','asha','samartha','gnati',
     'gaurava','pitri','rajya','putra','jeeva','karma','roga','kali']
      .forEach((k) => expect(keys).toContain(k));
  });

  it('mudda dasha has 9 periods spanning ~365 days', () => {
    const v = calculateVarshaphala(SAMPLE, 35);
    const md = calculateMuddaDasha(v);
    expect(md).toHaveLength(9);
    const total = md.reduce((s, p) => s + p.days, 0);
    expect(total).toBeGreaterThan(364);
    expect(total).toBeLessThan(367);
  });

  it('muntha advances 1 sign per year', () => {
    const v0 = calculateVarshaphala(SAMPLE, 0);
    const v1 = calculateVarshaphala(SAMPLE, 1);
    const expected = (v0.muntha.signNum % 12) + 1;
    expect(v1.muntha.signNum).toBe(expected);
  });
});

describe('avasthas', () => {
  it('returns one entry per non-node planet (7 planets)', () => {
    const k = calculateKundali(SAMPLE);
    const av = calculateAvasthas(k);
    expect(av).toHaveLength(7);
    av.forEach((a) => {
      expect(['Bala','Kumara','Yuva','Vriddha','Mrita']).toContain(a.baladi);
      expect(['Jagrat','Swapna','Sushupti']).toContain(a.jagradadi);
    });
  });
});

describe('sudarshana chakra', () => {
  it('has 3 rings × 12 cells', () => {
    const k = calculateKundali(SAMPLE);
    const s = calculateSudarshana(k);
    expect(s.rings).toHaveLength(3);
    s.rings.forEach((r) => expect(r.cells).toHaveLength(12));
  });

  it('produces a 36-year sudarshana dasha', () => {
    const k = calculateKundali(SAMPLE);
    const s = calculateSudarshana(k);
    expect(s.dasha).toHaveLength(36);
    expect(s.dasha[0].ring).toBe('Lagna');
    expect(s.dasha[12].ring).toBe('Moon');
    expect(s.dasha[24].ring).toBe('Sun');
  });
});
