import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import {
  expandCharaAntardashas,
  computeTimeLagnas,
  calculateJaiminiRajaYogas,
  calculateJaiminiLongevity,
  calculateJaimini,
} from '../services/jaimini.service';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139,
  lng: 77.2090,
  placeName: 'New Delhi',
};

describe('chara antardasha sub-periods', () => {
  const k = calculateKundali(SAMPLE);
  const mds = expandCharaAntardashas(k);

  it('produces 12 MDs each with 12 antardashas', () => {
    expect(mds).toHaveLength(12);
    mds.forEach((md) => expect(md.antardashas).toHaveLength(12));
  });

  it('antardashas inside an MD sum to the MD duration (within 1 day rounding)', () => {
    mds.forEach((md) => {
      const mdMs = new Date(md.endDate).getTime() - new Date(md.startDate).getTime();
      const adMs = md.antardashas.reduce((acc, a) =>
        acc + (new Date(a.endDate).getTime() - new Date(a.startDate).getTime()), 0);
      expect(Math.abs(mdMs - adMs)).toBeLessThan(24 * 3600 * 1000);
    });
  });

  it('first antardasha of an MD starts at MD start', () => {
    mds.forEach((md) => {
      expect(md.antardashas[0].startDate).toBe(md.startDate);
    });
  });

  it('first antardasha sign is the MD sign itself', () => {
    mds.forEach((md) => {
      expect(md.antardashas[0].signNum).toBe(md.signNum);
    });
  });
});

describe('time-based lagnas (Hora / Ghati / Bhava)', () => {
  const k = calculateKundali(SAMPLE);
  const res = computeTimeLagnas(k);

  it('computes sunrise and 3 lagnas', () => {
    expect(res.sunriseUTC).toBeTruthy();
    expect(res.lagnas).toHaveLength(3);
    const ids = res.lagnas.map((l) => l.id);
    expect(ids).toEqual(['BHAVA', 'HORA', 'GHATI']);
  });

  it('Hora Lagna rate is twice Bhava; Ghati is 5x Bhava', () => {
    const bhava = res.lagnas.find((l) => l.id === 'BHAVA')!.rateDegPerHour;
    const hora  = res.lagnas.find((l) => l.id === 'HORA')!.rateDegPerHour;
    const ghati = res.lagnas.find((l) => l.id === 'GHATI')!.rateDegPerHour;
    expect(bhava).toBe(15);
    expect(hora).toBe(30);
    expect(ghati).toBe(75);
  });

  it('each lagna has a valid sign 1..12 and house 1..12', () => {
    res.lagnas.forEach((l) => {
      expect(l.rashi.num).toBeGreaterThanOrEqual(1);
      expect(l.rashi.num).toBeLessThanOrEqual(12);
      expect(l.house).toBeGreaterThanOrEqual(1);
      expect(l.house).toBeLessThanOrEqual(12);
    });
  });
});

describe('Jaimini Raja Yogas', () => {
  const k = calculateKundali(SAMPLE);
  const ys = calculateJaiminiRajaYogas(k);

  it('returns all 7 classical yoga checks', () => {
    expect(ys).toHaveLength(7);
    ['AK_KENDRA','AK_TRIKONA','AMK_KENDRA','AK_AMK_ASPECT','AK_AMK_CONJ','AL_KENDRA','AK_IN_AL']
      .forEach((id) => expect(ys.some((y) => y.id === id)).toBe(true));
  });

  it('each yoga has a boolean present + description', () => {
    ys.forEach((y) => {
      expect(typeof y.present).toBe('boolean');
      expect(typeof y.details).toBe('string');
    });
  });
});

describe('Jaimini Longevity', () => {
  const k = calculateKundali(SAMPLE);
  const lon = calculateJaiminiLongevity(k);

  it('returns 3 pairs and an overall verdict', () => {
    expect(lon.pairs).toHaveLength(3);
    expect(['short', 'medium', 'long']).toContain(lon.overall);
  });

  it('overall = majority of pair spans', () => {
    const counts: Record<string, number> = { short: 0, medium: 0, long: 0 };
    lon.pairs.forEach((p) => { counts[p.span] += 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    expect(lon.overall).toBe(top);
  });
});

describe('calculateJaimini aggregate', () => {
  it('exposes every new field', () => {
    const k = calculateKundali(SAMPLE);
    const j = calculateJaimini(k);
    expect(j.charaDashaExpanded).toBeDefined();
    expect(j.timeLagnas).toBeDefined();
    expect(j.rajaYogas).toBeDefined();
    expect(j.longevity).toBeDefined();
  });
});
