// Phase 12 routes — Remedies workbench.
//
//   GET  /api/remedies/yantras                → list all 9 yantras
//   GET  /api/remedies/yantras/:planet        → one yantra
//   GET  /api/remedies/gemstones              → list all 9 gemstone catalogue entries
//   POST /api/remedies/gemstones/recommend    → chart-aware recommendation
//   GET  /api/remedies/log                    → list remedy log entries
//   POST /api/remedies/log                    → create a new remedy log
//   PATCH /api/remedies/log/:id               → update a log (status, progress, notes)
//   DELETE /api/remedies/log/:id              → remove a log
//   POST /api/remedies/log/:id/session        → increment progress (a practice session)

import { Router } from 'express';
import { calculateKundali, BirthInput } from '../services/kundali.service';
import { listYantras, getYantra, YANTRAS } from '../services/yantras.service';
import { listGemstones, computeGemstoneReport, GemstoneReportInput } from '../services/gemstones.service';
import { RemedyLog } from '../models/remedy-log.model';
import { PlanetId } from '../utils/astro-constants';

const router = Router();

// ─── Yantras ──────────────────────────────────────────────────────────────

router.get('/yantras', (req, res) => {
  res.json({ ok: true, yantras: listYantras(req.locale) });
});

router.get('/yantras/:planet', (req, res) => {
  const planet = String(req.params.planet).toUpperCase() as PlanetId;
  if (!(planet in YANTRAS)) {
    return res.status(404).json({ ok: false, error: 'Unknown planet' });
  }
  res.json({ ok: true, yantra: getYantra(planet, req.locale) });
});

// ─── Gemstones ────────────────────────────────────────────────────────────

router.get('/gemstones', (req, res) => {
  res.json({ ok: true, gemstones: listGemstones(req.locale) });
});

router.post('/gemstones/recommend', (req, res) => {
  const body = req.body as Partial<BirthInput> & GemstoneReportInput;
  if (!body?.datetime || body.lat == null || body.lng == null) {
    return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  }
  const k = calculateKundali({
    datetime: body.datetime,
    tzOffsetHours: body.tzOffsetHours,
    lat: Number(body.lat),
    lng: Number(body.lng),
    placeName: body.placeName,
  });
  const report = computeGemstoneReport(k, {
    ageYears: body.ageYears,
    bodyFrame: body.bodyFrame,
    referenceDateISO: body.referenceDateISO,
  }, req.locale);
  res.json({ ok: true, report });
});

// ─── Remedy Log ───────────────────────────────────────────────────────────

router.get('/log', async (req, res) => {
  const filter: any = {};
  if (req.query.chartId) filter.chartId = String(req.query.chartId);
  if (req.query.status)  filter.status  = String(req.query.status);
  if (req.query.kind)    filter.kind    = String(req.query.kind);
  if (req.query.planet)  filter.planet  = String(req.query.planet).toUpperCase();
  const entries = await RemedyLog.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ ok: true, entries });
});

router.post('/log', async (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.kind) {
    return res.status(400).json({ ok: false, error: 'title and kind required' });
  }
  const entry = await RemedyLog.create({
    chartId:   b.chartId,
    planet:    b.planet ? String(b.planet).toUpperCase() : undefined,
    kind:      b.kind,
    title:     b.title,
    details:   b.details,
    startedAt: b.startedAt,
    endsAt:    b.endsAt,
    recurrence: b.recurrence,
    progress:  b.progress || { sessionsCompleted: 0, totalCount: 0 },
    status:    b.status || 'planned',
    notes:     b.notes,
  });
  res.json({ ok: true, entry });
});

router.patch('/log/:id', async (req, res) => {
  const id = req.params.id;
  const b = req.body || {};
  const entry = await RemedyLog.findByIdAndUpdate(id, b, { new: true });
  if (!entry) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true, entry });
});

router.delete('/log/:id', async (req, res) => {
  const id = req.params.id;
  const r = await RemedyLog.findByIdAndDelete(id);
  if (!r) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true });
});

router.post('/log/:id/session', async (req, res) => {
  const id = req.params.id;
  const b = req.body || {};
  const entry = await RemedyLog.findById(id);
  if (!entry) return res.status(404).json({ ok: false, error: 'not found' });
  const prev = entry.progress || { sessionsCompleted: 0, totalCount: 0 };
  const progress = {
    sessionsCompleted: (prev.sessionsCompleted || 0) + 1,
    totalCount:        (prev.totalCount || 0) + (Number(b.count) || 0),
    targetCount:       prev.targetCount,
    lastSessionAt:     b.at || new Date().toISOString(),
  };
  let status = entry.status;
  if (progress.targetCount && progress.totalCount! >= progress.targetCount) status = 'completed';
  else if (status === 'planned') status = 'active';
  const updated = await RemedyLog.findByIdAndUpdate(id, { progress, status }, { new: true });
  res.json({ ok: true, entry: updated });
});

export default router;
