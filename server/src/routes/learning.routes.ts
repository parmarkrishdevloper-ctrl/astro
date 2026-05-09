// Learning / tutor routes — encyclopedia, slokas, yoga explanation,
// tutor lessons, flashcards, cross-search.

import { Router } from 'express';
import { calculateKundali, BirthInput } from '../services/kundali.service';
import { findEntry, searchEntries, listEntries, localizeEntry, ENCYCLOPEDIA } from '../data/encyclopedia';
import { SLOKAS, slokasByTopic, searchSlokas } from '../data/classical-texts';
import {
  explainYoga, tutorLessons, buildFlashcards, searchCombined,
} from '../services/learning.service';

const router = Router();

// ─── Encyclopedia ─────────────────────────────────────────────────────────
router.get('/encyclopedia', (req, res) => {
  const { kind, q } = req.query as { kind?: string; q?: string };
  if (q) {
    const hits = searchEntries(q, req.locale);
    const list = kind ? hits.filter((e) => e.kind === kind) : hits;
    return res.json({ ok: true, entries: list });
  }
  if (kind) {
    return res.json({ ok: true, entries: listEntries(kind as any, req.locale) });
  }
  // No kind, no q — return the whole corpus localized
  res.json({ ok: true, entries: ENCYCLOPEDIA.map((e) => localizeEntry(e, req.locale)) });
});

router.get('/encyclopedia/:kind/:id', (req, res) => {
  const e = findEntry(req.params.kind as any, req.params.id, req.locale);
  if (!e) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true, entry: e });
});

// ─── Classical texts ──────────────────────────────────────────────────────
router.get('/slokas', (req, res) => {
  const { topic, q } = req.query as { topic?: string; q?: string };
  let list = SLOKAS;
  if (topic) list = slokasByTopic(topic);
  if (q) {
    const hits = searchSlokas(q);
    list = list.filter((s) => hits.includes(s));
  }
  res.json({ ok: true, slokas: list });
});

// ─── Yoga explanation ─────────────────────────────────────────────────────
router.get('/explain-yoga/:id', (req, res) => {
  const e = explainYoga(req.params.id);
  if (!e) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true, explanation: e });
});

// ─── Tutor lessons (per chart) ────────────────────────────────────────────
router.post('/tutor', (req, res) => {
  const body = req.body as Partial<BirthInput>;
  if (!body?.datetime || body.lat == null || body.lng == null) {
    return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  }
  const k = calculateKundali({
    datetime: body.datetime, tzOffsetHours: body.tzOffsetHours,
    lat: Number(body.lat), lng: Number(body.lng), placeName: body.placeName,
  });
  res.json({ ok: true, lessons: tutorLessons(k) });
});

// ─── Flashcards ───────────────────────────────────────────────────────────
router.get('/flashcards/:topic', (req, res) => {
  const topic = req.params.topic as 'nakshatras' | 'rashis' | 'planets' | 'houses' | 'karakas';
  const valid = ['nakshatras', 'rashis', 'planets', 'houses', 'karakas'];
  if (!valid.includes(topic)) {
    return res.status(400).json({ ok: false, error: `topic must be one of ${valid.join(', ')}` });
  }
  res.json({ ok: true, cards: buildFlashcards(topic) });
});

// ─── Cross-search ─────────────────────────────────────────────────────────
router.get('/search', (req, res) => {
  const q = String(req.query.q ?? '');
  res.json({ ok: true, results: searchCombined(q) });
});

export default router;
