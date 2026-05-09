// Phase 16 — Calendar.
//
//   POST /api/calendar/live          → live-clock panchang with countdowns
//   POST /api/calendar/year          → full calendar year
//   POST /api/calendar/range         → arbitrary date range
//   POST /api/calendar/festivals     → festivals within range
//   GET  /api/calendar/festivals/defs → list all curated festival definitions

import { Router } from 'express';
import { calculateLivePanchang } from '../services/live-panchang.service';
import {
  buildCalendarRange,
  buildCalendarYear,
  buildSegments,
} from '../services/calendar.service';
import {
  generateFestivals,
  listFestivalDefs,
} from '../services/festivals.service';

const router = Router();

function readLatLng(body: any): { lat: number; lng: number } | null {
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

router.post('/calendar/live', (req, res) => {
  const ll = readLatLng(req.body);
  if (!ll) return res.status(400).json({ ok: false, error: 'lat, lng required' });
  const now = req.body?.now ? new Date(req.body.now) : new Date();
  if (isNaN(now.getTime())) return res.status(400).json({ ok: false, error: 'invalid now' });
  res.json({ ok: true, live: calculateLivePanchang(now, ll.lat, ll.lng) });
});

router.post('/calendar/year', (req, res) => {
  const ll = readLatLng(req.body);
  if (!ll) return res.status(400).json({ ok: false, error: 'lat, lng required' });
  const year = Number(req.body?.year);
  if (!Number.isInteger(year) || year < 1900 || year > 2200) {
    return res.status(400).json({ ok: false, error: 'year must be 1900..2200' });
  }
  const days = buildCalendarYear(year, ll.lat, ll.lng, req.locale);
  res.json({ ok: true, year, days, segments: buildSegments(days) });
});

router.post('/calendar/range', (req, res) => {
  const ll = readLatLng(req.body);
  if (!ll) return res.status(400).json({ ok: false, error: 'lat, lng required' });
  const start = new Date(String(req.body?.start ?? ''));
  const end = new Date(String(req.body?.end ?? ''));
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ ok: false, error: 'start, end must be ISO dates' });
  }
  if (end.getTime() < start.getTime()) {
    return res.status(400).json({ ok: false, error: 'end must be >= start' });
  }
  const diffDays = (end.getTime() - start.getTime()) / 86400000;
  if (diffDays > 1100) {
    return res.status(400).json({ ok: false, error: 'range too large (max ~3 years)' });
  }
  const days = buildCalendarRange(start, end, ll.lat, ll.lng, req.locale);
  res.json({ ok: true, days, segments: buildSegments(days) });
});

router.post('/calendar/festivals', (req, res) => {
  const ll = readLatLng(req.body);
  if (!ll) return res.status(400).json({ ok: false, error: 'lat, lng required' });
  const start = new Date(String(req.body?.start ?? ''));
  const end = new Date(String(req.body?.end ?? ''));
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ ok: false, error: 'start, end must be ISO dates' });
  }
  res.json({ ok: true, festivals: generateFestivals(start, end, ll.lat, ll.lng, req.locale) });
});

router.get('/calendar/festivals/defs', (_req, res) => {
  res.json({ ok: true, defs: listFestivalDefs() });
});

export default router;
