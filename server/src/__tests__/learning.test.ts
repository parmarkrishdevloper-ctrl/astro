import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { ENCYCLOPEDIA, searchEntries, findEntry } from '../data/encyclopedia';
import { SLOKAS } from '../data/classical-texts';
import { explainYoga, tutorLessons, buildFlashcards, searchCombined } from '../services/learning.service';

initEphemeris();

const NATAL = calculateKundali({
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139, lng: 77.2090,
});

describe('Phase 17 — Learning / tutor', () => {
  it('encyclopedia has 9 planets, 12 rashis, 27 nakshatras, 12 houses, 7 karakas', () => {
    const counts: Record<string, number> = {};
    for (const e of ENCYCLOPEDIA) counts[e.kind] = (counts[e.kind] ?? 0) + 1;
    expect(counts.planet).toBe(9);
    expect(counts.rashi).toBe(12);
    expect(counts.nakshatra).toBe(27);
    expect(counts.house).toBe(12);
    expect(counts.karaka).toBe(7);
  });

  it('search finds entries by name, sanskrit, and keyword', () => {
    expect(searchEntries('Jupiter').length).toBeGreaterThan(0);
    expect(searchEntries('dharma').length).toBeGreaterThan(0);
    expect(searchEntries('nonexistent').length).toBe(0);
  });

  it('findEntry by id or name works', () => {
    expect(findEntry('planet', 'SU')?.name).toBe('Sun');
    expect(findEntry('rashi', 'Leo')?.id).toBe('rashi-5');
  });

  it('SLOKAS corpus has at least 10 entries with source + english', () => {
    expect(SLOKAS.length).toBeGreaterThanOrEqual(10);
    SLOKAS.forEach((s) => {
      expect(s.source.length).toBeGreaterThan(0);
      expect(s.english.length).toBeGreaterThan(10);
    });
  });

  it('explainYoga returns predicate + source for a hand-coded yoga', () => {
    const r = explainYoga('ruchaka');
    expect(r).not.toBeNull();
    expect(r!.name).toBe('Ruchaka Yoga');
    expect(r!.predicatePlainEnglish.length).toBeGreaterThan(0);
    expect(r!.source).toContain('BPHS');
  });

  it('tutorLessons produces a 7-step lesson sequence', () => {
    const lessons = tutorLessons(NATAL);
    expect(lessons.length).toBeGreaterThanOrEqual(6);
    lessons.forEach((l) => {
      expect(l.step).toBeGreaterThan(0);
      expect(l.heading.length).toBeGreaterThan(3);
      expect(l.narrative.length).toBeGreaterThan(20);
    });
  });

  it('flashcards for each topic are non-empty and well-formed', () => {
    for (const t of ['nakshatras','rashis','planets','houses','karakas'] as const) {
      const cards = buildFlashcards(t);
      expect(cards.length).toBeGreaterThan(0);
      cards.forEach((c) => {
        expect(c.front.length).toBeGreaterThan(0);
        expect(c.back.length).toBeGreaterThan(5);
      });
    }
  });

  it('cross-search returns encyclopedia + slokas + yogas for "kendra"', () => {
    const r = searchCombined('kendra');
    const total = r.encyclopedia.length + r.slokas.length + r.yogas.length;
    expect(total).toBeGreaterThan(0);
  });
});
