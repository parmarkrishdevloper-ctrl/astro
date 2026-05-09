// Routes for Phase 9 features: Ashtakavarga, Transits, Ephemeris, Prashna,
// Birth time rectification.

import { Router } from 'express';
import { calculateKundali, BirthInput } from '../services/kundali.service';
import { calculateAshtakavarga } from '../services/ashtakavarga.service';
import { computeTransits, transitTimeline } from '../services/transit.service';
import { buildRxCombustTimeline, rxSnapshot } from '../services/rx-combust.service';
import { buildEclipseJournal, listEclipses, listIngresses } from '../services/eclipse-journal.service';
import { computeDashaTransitAlerts } from '../services/dasha-transit-alerts.service';
import { buildHoroscope, HoroscopeScope } from '../services/horoscope.service';
import { buildTransitHeatmap } from '../services/transit-heatmap.service';
import { buildEphemerisTable, buildGraphicalEphemeris } from '../services/ephemeris-table.service';
import { castPrashna, computePrashnaVerdict, PrashnaCategory } from '../services/prashna.service';
import { rectifyBirthTime, RectificationEvent } from '../services/rectification.service';
import { predictEvents, buildAuspiciousnessGraph } from '../services/event-prediction.service';

const router = Router();

function parseBirth(req: any) {
  const body = req.body as Partial<BirthInput>;
  if (!body?.datetime || body.lat == null || body.lng == null) return null;
  return calculateKundali({
    datetime: body.datetime,
    tzOffsetHours: body.tzOffsetHours,
    lat: Number(body.lat),
    lng: Number(body.lng),
    placeName: body.placeName,
  });
}

router.post('/ashtakavarga', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, ashtakavarga: calculateAshtakavarga(k) });
});

router.post('/transits', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const when = req.body?.when as string | undefined;
  res.json({ ok: true, transits: computeTransits(k, when) });
});

/** GET /api/rx-combust?start=2025-01-01&days=365 — retrograde/combust/station events */
router.get('/rx-combust', (req, res) => {
  const start = String(req.query.start || new Date().toISOString());
  const days = Math.min(3000, Math.max(1, Number(req.query.days || 365)));
  res.json({ ok: true, events: buildRxCombustTimeline({ start, days }) });
});

/** GET /api/rx-snapshot?when=ISO — who's currently retrograde/combust */
router.get('/rx-snapshot', (req, res) => {
  const when = String(req.query.when || new Date().toISOString());
  res.json({ ok: true, snapshot: rxSnapshot(when) });
});

/** GET /api/eclipses?start=ISO&days=N */
router.get('/eclipses', (req, res) => {
  const start = String(req.query.start || new Date().toISOString());
  const days = Math.min(3650, Math.max(1, Number(req.query.days || 365 * 3)));
  res.json({ ok: true, eclipses: listEclipses(start, days) });
});

/** POST /api/eclipse-journal — eclipses + outer-planet ingresses.
 *  Body: { start, days, includeFast?, datetime?, lat?, lng?, tzOffsetHours? }
 *  If natal (datetime/lat/lng) is supplied, each ingress is house-annotated. */
router.post('/eclipse-journal', (req, res) => {
  const { start, days, includeFast } = req.body || {};
  if (!start || days == null) return res.status(400).json({ ok: false, error: 'start, days required' });
  const natal = parseBirth(req);  // null if natal fields not provided
  res.json({ ok: true, journal: buildEclipseJournal({
    start, days: Number(days),
    includeFast: !!includeFast,
    natal: natal ?? undefined,
  }) });
});

/** POST /api/transit-heatmap — per-day 0..100 auspiciousness for a native.
 *  Body: { datetime, lat, lng, start, days } (days ≤ 732) */
router.post('/transit-heatmap', (req, res) => {
  const natal = parseBirth(req);
  if (!natal) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const { start, days } = req.body || {};
  if (!start || days == null) return res.status(400).json({ ok: false, error: 'start, days required' });
  res.json({ ok: true, heatmap: buildTransitHeatmap(natal, start, Number(days)) });
});

/** POST /api/horoscope — personal daily/weekly/monthly forecast for a native.
 *  Body: { datetime, lat, lng, scope: 'day'|'week'|'month', whenISO? } */
router.post('/horoscope', (req, res) => {
  const natal = parseBirth(req);
  if (!natal) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const scope = (req.body?.scope ?? 'day') as HoroscopeScope;
  if (!['day','week','month'].includes(scope)) {
    return res.status(400).json({ ok: false, error: 'scope must be day|week|month' });
  }
  const whenISO = req.body?.whenISO as string | undefined;
  res.json({ ok: true, horoscope: buildHoroscope(natal, scope, whenISO) });
});

/** POST /api/dasha-transit-alerts — natal chart + range → alignment alerts.
 *  Body: { datetime, lat, lng, start, days, stepDays?, minScore? } */
router.post('/dasha-transit-alerts', (req, res) => {
  const natal = parseBirth(req);
  if (!natal) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const { start, days, stepDays, minScore } = req.body || {};
  if (!start || days == null) return res.status(400).json({ ok: false, error: 'start, days required' });
  res.json({ ok: true, alerts: computeDashaTransitAlerts({
    natal, start, days: Number(days),
    stepDays: stepDays != null ? Number(stepDays) : undefined,
    minScore: minScore != null ? Number(minScore) : undefined,
  }) });
});

/** GET /api/ingresses?start=ISO&days=N&includeFast=1 */
router.get('/ingresses', (req, res) => {
  const start = String(req.query.start || new Date().toISOString());
  const days = Math.min(3650, Math.max(1, Number(req.query.days || 365 * 3)));
  res.json({ ok: true, ingresses: listIngresses({ start, days, includeFast: !!req.query.includeFast }) });
});

router.post('/transit-timeline', (req, res) => {
  const { startISO, days } = req.body || {};
  if (!startISO || !days) return res.status(400).json({ ok: false, error: 'startISO, days required' });
  res.json({ ok: true, ingresses: transitTimeline(startISO, Number(days)) });
});

router.get('/ephemeris', (req, res) => {
  const startISO = String(req.query.start || new Date().toISOString());
  const days = Math.min(366, Math.max(1, Number(req.query.days || 30)));
  res.json({ ok: true, ephemeris: buildEphemerisTable(startISO, days) });
});

router.get('/ephemeris/graphical', (req, res) => {
  const startISO = String(req.query.start || new Date().toISOString());
  const days = Math.min(366, Math.max(1, Number(req.query.days || 30)));
  res.json({ ok: true, series: buildGraphicalEphemeris(startISO, days) });
});

router.post('/prashna', (req, res) => {
  const { whenISO, lat, lng, question, number, category } = req.body || {};
  if (lat == null || lng == null) {
    return res.status(400).json({ ok: false, error: 'lat, lng required' });
  }
  try {
    const prashna = castPrashna({ whenISO, lat: Number(lat), lng: Number(lng), question, number });
    const verdict = category ? computePrashnaVerdict(prashna, category as PrashnaCategory) : null;
    res.json({ ok: true, prashna, verdict });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.post('/rectify', (req, res) => {
  const body = req.body || {};
  if (!body?.datetime || body.lat == null || body.lng == null || !Array.isArray(body.events)) {
    return res.status(400).json({ ok: false, error: 'datetime, lat, lng, events[] required' });
  }
  const events: RectificationEvent[] = body.events;
  const window = Number(body.windowMinutes ?? 30);
  res.json({
    ok: true,
    result: rectifyBirthTime(
      {
        datetime: body.datetime,
        tzOffsetHours: body.tzOffsetHours,
        lat: Number(body.lat),
        lng: Number(body.lng),
      },
      events,
      window,
    ),
  });
});

router.post('/predict-events', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const years = Number(req.body?.years ?? 30);
  res.json({ ok: true, events: predictEvents(k, years) });
});

router.post('/auspiciousness', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const years = Number(req.body?.years ?? 30);
  res.json({ ok: true, points: buildAuspiciousnessGraph(k, years) });
});

export default router;
