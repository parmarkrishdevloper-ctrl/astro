import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { globalSearch } from '../services/global-search.service';

initEphemeris();

describe('Phase 20A — global search', () => {
  it('finds encyclopedia entries by name', async () => {
    const hits = await globalSearch('Jupiter');
    expect(hits.some((h) => h.kind === 'encyclopedia' && h.title.includes('Jupiter'))).toBe(true);
  });

  it('finds yogas by name or effect', async () => {
    const hits = await globalSearch('Ruchaka');
    expect(hits.some((h) => h.kind === 'yoga')).toBe(true);
  });

  it('finds classical slokas by tag', async () => {
    const hits = await globalSearch('kendra');
    expect(hits.some((h) => h.kind === 'sloka')).toBe(true);
  });

  it('returns empty array for <2 char query', async () => {
    const hits = await globalSearch('a');
    expect(hits).toEqual([]);
  });

  it('sorts results best-first', async () => {
    const hits = await globalSearch('mahapurusha');
    for (let i = 1; i < hits.length; i++) {
      expect(hits[i - 1].score).toBeGreaterThanOrEqual(hits[i].score);
    }
  });
});
