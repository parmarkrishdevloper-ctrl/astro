// Personal knowledge-base routes.
//
// Endpoints:
//   Chart library:
//     POST   /api/library/charts              create
//     GET    /api/library/charts              list (optional ?rel=family)
//     GET    /api/library/charts/:id          fetch single
//     PATCH  /api/library/charts/:id          update top-level fields
//     DELETE /api/library/charts/:id          delete
//
//   Life-event journal (auto-attaches dasha+transit snapshot):
//     POST   /api/library/charts/:id/events
//     DELETE /api/library/charts/:id/events/:eventId
//
//   Prediction log:
//     POST   /api/library/charts/:id/predictions
//     PATCH  /api/library/charts/:id/predictions/:predId       (outcome update)
//     DELETE /api/library/charts/:id/predictions/:predId
//
//   Notes (one per scope+target, upsert):
//     PUT    /api/library/charts/:id/notes                     body: { scope, target?, markdown }
//     DELETE /api/library/charts/:id/notes/:noteId
//
//   Voice memos:
//     POST   /api/library/charts/:id/voice-memos               body: { blobDataUrl, mimeType, durationSec?, transcript?, scope, target? }
//     DELETE /api/library/charts/:id/voice-memos/:memoId

import { Router } from 'express';
import { Chart, ILifeEvent } from '../models/chart.model';
import { calculateKundali } from '../services/kundali.service';
import { currentDasha } from '../services/dasha.service';
import { computeTransits } from '../services/transit.service';

const router = Router();

// ─── Chart CRUD ─────────────────────────────────────────────────────────────
router.post('/charts', async (req, res) => {
  try {
    const c = await Chart.create(req.body);
    res.json({ ok: true, chart: c });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.get('/charts', async (req, res) => {
  const q: Record<string, any> = {};
  if (req.query.rel) q.relationship = req.query.rel;
  const list = await Chart.find(q).sort({ updatedAt: -1 }).lean();
  // Return a compact list view (no voice memos / notes bodies)
  const compact = list.map((c: any) => ({
    _id: c._id,
    label: c.label,
    relationship: c.relationship,
    datetime: c.datetime,
    placeName: c.placeName,
    lat: c.lat,
    lng: c.lng,
    eventCount:       c.lifeEvents?.length ?? 0,
    predictionCount:  c.predictions?.length ?? 0,
    noteCount:        c.notes?.length ?? 0,
    voiceMemoCount:   c.voiceMemos?.length ?? 0,
    updatedAt: c.updatedAt,
  }));
  res.json({ ok: true, charts: compact });
});

router.get('/charts/:id', async (req, res) => {
  const c = await Chart.findById(req.params.id).lean();
  if (!c) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true, chart: c });
});

router.patch('/charts/:id', async (req, res) => {
  try {
    const updated = await Chart.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true }).lean();
    if (!updated) return res.status(404).json({ ok: false, error: 'not found' });
    res.json({ ok: true, chart: updated });
  } catch (e: any) { res.status(400).json({ ok: false, error: e.message }); }
});

router.delete('/charts/:id', async (req, res) => {
  const r = await Chart.findByIdAndDelete(req.params.id);
  res.json({ ok: true, deleted: !!r });
});

// ─── Life events ───────────────────────────────────────────────────────────
router.post('/charts/:id/events', async (req, res) => {
  const c = await Chart.findById(req.params.id);
  if (!c) return res.status(404).json({ ok: false, error: 'not found' });
  const { date, category, title, notes } = req.body || {};
  if (!date || !category || !title) return res.status(400).json({ ok: false, error: 'date, category, title required' });

  // Compute dasha + transit snapshot for this moment against the native chart
  let snapshot: ILifeEvent['snapshot'] | undefined;
  try {
    const natal = calculateKundali({
      datetime: c.datetime, tzOffsetHours: c.tzOffsetHours,
      lat: c.lat, lng: c.lng, placeName: c.placeName,
    });
    const dd = currentDasha(natal, new Date(date));
    const tr = computeTransits(natal, new Date(date).toISOString());
    const jupSat = tr.positions.filter((p) => p.id === 'JU' || p.id === 'SA')
      .map((p) => `${p.id} H${p.natalHouse}`).join(' · ');
    snapshot = {
      maha: dd?.maha?.lord,
      antar: dd?.antar?.lord ?? undefined,
      pratyantar: dd?.pratyantar?.lord ?? undefined,
      transitSummary: jupSat,
    };
  } catch { /* snapshot optional */ }

  c.lifeEvents.push({ date, category, title, notes, snapshot, createdAt: new Date() });
  await c.save();
  res.json({ ok: true, event: c.lifeEvents[c.lifeEvents.length - 1], snapshot });
});

router.delete('/charts/:id/events/:eventId', async (req, res) => {
  const c = await Chart.findById(req.params.id);
  if (!c) return res.status(404).json({ ok: false, error: 'not found' });
  const before = c.lifeEvents.length;
  c.lifeEvents = c.lifeEvents.filter((e: any) => String(e._id) !== req.params.eventId) as any;
  await c.save();
  res.json({ ok: true, deleted: c.lifeEvents.length < before });
});

// ─── Predictions ────────────────────────────────────────────────────────────
router.post('/charts/:id/predictions', async (req, res) => {
  const c = await Chart.findById(req.params.id);
  if (!c) return res.status(404).json({ ok: false, error: 'not found' });
  const { forDate, forDateEnd, category, text } = req.body || {};
  if (!category || !text) return res.status(400).json({ ok: false, error: 'category, text required' });
  c.predictions.push({ forDate, forDateEnd, category, text, outcome: 'pending', createdAt: new Date() });
  await c.save();
  res.json({ ok: true, prediction: c.predictions[c.predictions.length - 1] });
});

router.patch('/charts/:id/predictions/:predId', async (req, res) => {
  const c = await Chart.findById(req.params.id);
  if (!c) return res.status(404).json({ ok: false, error: 'not found' });
  const p: any = c.predictions.find((x: any) => String(x._id) === req.params.predId);
  if (!p) return res.status(404).json({ ok: false, error: 'prediction not found' });
  const { outcome, outcomeNotes, text } = req.body || {};
  if (outcome) { p.outcome = outcome; p.outcomeAt = new Date(); }
  if (outcomeNotes != null) p.outcomeNotes = outcomeNotes;
  if (text) p.text = text;
  await c.save();
  res.json({ ok: true, prediction: p });
});

router.delete('/charts/:id/predictions/:predId', async (req, res) => {
  const c = await Chart.findById(req.params.id);
  if (!c) return res.status(404).json({ ok: false, error: 'not found' });
  c.predictions = c.predictions.filter((x: any) => String(x._id) !== req.params.predId) as any;
  await c.save();
  res.json({ ok: true });
});

// ─── Notes (upsert by scope+target) ─────────────────────────────────────────
router.put('/charts/:id/notes', async (req, res) => {
  const c = await Chart.findById(req.params.id);
  if (!c) return res.status(404).json({ ok: false, error: 'not found' });
  const { scope, target, markdown } = req.body || {};
  if (!scope || markdown == null) return res.status(400).json({ ok: false, error: 'scope, markdown required' });
  const existing: any = c.notes.find((n: any) =>
    n.scope === scope && (n.target ?? null) === (target ?? null));
  if (existing) {
    existing.markdown = markdown;
    existing.updatedAt = new Date();
  } else {
    c.notes.push({ scope, target, markdown, updatedAt: new Date() });
  }
  await c.save();
  res.json({ ok: true, notes: c.notes });
});

router.delete('/charts/:id/notes/:noteId', async (req, res) => {
  const c = await Chart.findById(req.params.id);
  if (!c) return res.status(404).json({ ok: false, error: 'not found' });
  c.notes = c.notes.filter((n: any) => String(n._id) !== req.params.noteId) as any;
  await c.save();
  res.json({ ok: true });
});

// ─── Voice memos ────────────────────────────────────────────────────────────
router.post('/charts/:id/voice-memos', async (req, res) => {
  const c = await Chart.findById(req.params.id);
  if (!c) return res.status(404).json({ ok: false, error: 'not found' });
  const { blobDataUrl, mimeType, durationSec, transcript, scope, target } = req.body || {};
  if (!blobDataUrl || !mimeType || !scope) return res.status(400).json({ ok: false, error: 'blobDataUrl, mimeType, scope required' });
  c.voiceMemos.push({ blobDataUrl, mimeType, durationSec, transcript, scope, target, createdAt: new Date() });
  await c.save();
  res.json({ ok: true, memo: c.voiceMemos[c.voiceMemos.length - 1] });
});

router.delete('/charts/:id/voice-memos/:memoId', async (req, res) => {
  const c = await Chart.findById(req.params.id);
  if (!c) return res.status(404).json({ ok: false, error: 'not found' });
  c.voiceMemos = c.voiceMemos.filter((m: any) => String(m._id) !== req.params.memoId) as any;
  await c.save();
  res.json({ ok: true });
});

export default router;
