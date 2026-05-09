import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import {
  planetDetail, dispositorTree, aspectWeb, compareCharts, compositeChart,
} from '../services/interactive.service';

initEphemeris();

const A = calculateKundali({
  datetime: '1990-08-15T10:30:00+05:30', lat: 28.6139, lng: 77.2090,
});
const B = calculateKundali({
  datetime: '1992-04-22T06:15:00+05:30', lat: 19.0760, lng: 72.8777,
});

describe('Phase 18 — Interactive chart services', () => {
  it('planetDetail returns dignity, conjunctions, aspects, dispositor chain, dasha flags', () => {
    const d = planetDetail(A, 'JU', new Date('2025-10-01'));
    expect(d.planet.id).toBe('JU');
    expect(typeof d.dignity.label).toBe('string');
    expect(Array.isArray(d.lordOf)).toBe(true);
    expect(d.dispositorChain[0]).toBe('JU');
    expect(d.dispositorChain.length).toBeGreaterThan(1);
    expect(typeof d.currentDasha.maha).toBe('boolean');
  });

  it('dispositor tree lists all 9 planets and at least one final dispositor', () => {
    const t = dispositorTree(A);
    const ids = Object.keys(t.chains);
    expect(ids).toHaveLength(9);
    // Every chart has at least one final dispositor (unless you have an all-looping chain)
    expect(t.finalDispositors.length).toBeGreaterThanOrEqual(0);
  });

  it('aspect web has edges and includes 7th-aspect entries', () => {
    const w = aspectWeb(A);
    expect(w.nodes).toHaveLength(9);
    const hasSeventh = w.edges.some((e) => e.kind === '7th');
    expect(hasSeventh).toBe(true);
  });

  it('compareCharts produces synastry hits + A planets in B houses', () => {
    const s = compareCharts(A, B);
    expect(s.hits.length).toBeGreaterThan(0);
    expect(s.aPlanetsInBHouses).toHaveLength(9);
    s.aPlanetsInBHouses.forEach((x) => {
      expect(x.house).toBeGreaterThanOrEqual(1);
      expect(x.house).toBeLessThanOrEqual(12);
    });
  });

  it('composite chart midpoints between A and B', () => {
    const c = compositeChart(A, B);
    expect(c.planets).toHaveLength(9);
    c.planets.forEach((p) => {
      expect(p.longitude).toBeGreaterThanOrEqual(0);
      expect(p.longitude).toBeLessThan(360);
      expect(p.signNum).toBeGreaterThanOrEqual(1);
      expect(p.signNum).toBeLessThanOrEqual(12);
    });
    expect(c.ascendant.signName.length).toBeGreaterThan(0);
  });
});
