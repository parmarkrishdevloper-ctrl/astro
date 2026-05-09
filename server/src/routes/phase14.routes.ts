// Phase 14 — Research endpoints.
//
//   POST /api/research/pattern          → pattern-search DSL
//   GET  /api/research/pattern/presets  → built-in DSL presets
//   POST /api/research/timeline         → dasha+transit+event overlay
//   POST /api/research/stats            → correlation across sample charts
//   POST /api/research/distribution     → sign/nak distributions across samples
//   GET  /api/research/famous           → list seeded famous charts
//   POST /api/research/famous/match     → match user chart to famous top-N
//   POST /api/research/rectify-deep     → deep rectification
//   GET  /api/research/notes            → list notebook entries
//   POST /api/research/notes            → create entry
//   PATCH /api/research/notes/:id       → update entry
//   DELETE /api/research/notes/:id      → delete entry

import { Router, Request, Response } from 'express';
import { calculateKundali, BirthInput, KundaliResult } from '../services/kundali.service';
import { searchPattern, PATTERN_PRESETS } from '../services/pattern-search.service';
import { buildTimelineOverlay, TimelineEvent } from '../services/timeline-overlay.service';
import { computeCorrelation, computeDistribution, StatsSample } from '../services/stats-correlation.service';
import { listFamous, matchFamous } from '../services/famous-charts.service';
import { deepRectify, DeepEvent } from '../services/rectification-deep.service';
import { listNotes, createNote, updateNote, deleteNote } from '../services/notebook.service';

const router = Router();

function parseBirth(req: Request, res: Response): KundaliResult | null {
  const b = req.body?.birth ?? req.body;
  if (!b?.datetime || b.lat == null || b.lng == null) {
    res.status(400).json({ ok: false, error: 'birth.datetime, birth.lat, birth.lng required' });
    return null;
  }
  return calculateKundali({
    datetime:      b.datetime,
    tzOffsetHours: b.tzOffsetHours,
    lat:           Number(b.lat),
    lng:           Number(b.lng),
    placeName:     b.placeName,
  });
}

// ── Pattern search ──────────────────────────────────────────────────────────
router.get('/research/pattern/presets', (_req, res) => {
  res.json({ ok: true, presets: PATTERN_PRESETS });
});

router.post('/research/pattern', (req, res) => {
  const k = parseBirth(req, res);
  if (!k) return;
  const query = String(req.body?.query ?? '').trim();
  if (!query) return res.status(400).json({ ok: false, error: 'query required' });
  res.json({ ok: true, result: searchPattern(k, query) });
});

// ── Timeline overlay ────────────────────────────────────────────────────────
router.post('/research/timeline', (req, res) => {
  const k = parseBirth(req, res);
  if (!k) return;
  const events: TimelineEvent[] = Array.isArray(req.body?.events) ? req.body.events : [];
  const overlay = buildTimelineOverlay(k, {
    fromISO: req.body?.from,
    toISO: req.body?.to,
    transitPlanets: req.body?.transitPlanets,
    events,
  });
  res.json({ ok: true, overlay });
});

// ── Stats correlation ───────────────────────────────────────────────────────
router.post('/research/stats', (req, res) => {
  const samples: StatsSample[] = Array.isArray(req.body?.samples) ? req.body.samples : [];
  const query = String(req.body?.query ?? '').trim();
  if (!samples.length) return res.status(400).json({ ok: false, error: 'samples array required' });
  if (!query) return res.status(400).json({ ok: false, error: 'query required' });
  res.json({
    ok: true,
    result: computeCorrelation({ samples, query, groupByTag: !!req.body?.groupByTag }),
  });
});

router.post('/research/distribution', (req, res) => {
  const samples: StatsSample[] = Array.isArray(req.body?.samples) ? req.body.samples : [];
  const facet = req.body?.facet ?? 'lagnaSign';
  const planet = req.body?.planet;
  if (!samples.length) return res.status(400).json({ ok: false, error: 'samples array required' });
  res.json({ ok: true, result: computeDistribution(samples, facet, planet) });
});

// ── Famous charts ───────────────────────────────────────────────────────────
router.get('/research/famous', (_req, res) => {
  res.json({ ok: true, charts: listFamous() });
});

router.post('/research/famous/match', (req, res) => {
  const k = parseBirth(req, res);
  if (!k) return;
  const topN = Number(req.body?.topN ?? 5);
  res.json({ ok: true, matches: matchFamous(k, topN) });
});

// ── Deep rectification ──────────────────────────────────────────────────────
router.post('/research/rectify-deep', (req, res) => {
  const birth = req.body?.birth as BirthInput;
  const events = Array.isArray(req.body?.events) ? (req.body.events as DeepEvent[]) : [];
  if (!birth?.datetime || birth.lat == null || birth.lng == null) {
    return res.status(400).json({ ok: false, error: 'birth required' });
  }
  if (!events.length) return res.status(400).json({ ok: false, error: 'events array required' });
  const result = deepRectify({
    birth,
    events,
    windowMinutes: Number(req.body?.windowMinutes ?? 60),
    stepMinutes:   Number(req.body?.stepMinutes ?? 2),
  });
  res.json({ ok: true, result });
});

// ── Notebook ────────────────────────────────────────────────────────────────
router.get('/research/notes', async (req, res, next) => {
  try {
    const kind = typeof req.query.kind === 'string' ? (req.query.kind as any) : undefined;
    const tag  = typeof req.query.tag  === 'string' ? req.query.tag : undefined;
    res.json({ ok: true, notes: await listNotes(kind, tag) });
  } catch (e) { next(e); }
});

router.post('/research/notes', async (req, res, next) => {
  try {
    const n = await createNote({
      kind:    req.body?.kind,
      title:   String(req.body?.title ?? '').trim() || 'Untitled',
      body:    req.body?.body,
      payload: req.body?.payload,
      tags:    Array.isArray(req.body?.tags) ? req.body.tags : [],
      pinned:  !!req.body?.pinned,
    });
    if (!n) return res.status(503).json({ ok: false, error: 'DB not connected' });
    res.json({ ok: true, note: n });
  } catch (e) { next(e); }
});

router.patch('/research/notes/:id', async (req, res, next) => {
  try {
    const n = await updateNote(req.params.id, req.body ?? {});
    if (!n) return res.status(404).json({ ok: false, error: 'not found' });
    res.json({ ok: true, note: n });
  } catch (e) { next(e); }
});

router.delete('/research/notes/:id', async (req, res, next) => {
  try {
    const ok = await deleteNote(req.params.id);
    if (!ok) return res.status(404).json({ ok: false, error: 'not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
