// Phase 11 routes — Prashna schools (Tajika/Narchintamani/Shatpanchasika/
// Swara/Arudha), classical chakras, and muhurta-pro (classes + 35+ presets +
// Chaughadia/Hora calendar + Varjyam widget).

import { Router } from 'express';
import { calculateKundali, BirthInput } from '../services/kundali.service';
import { castPrashna, PrashnaCategory } from '../services/prashna.service';
import {
  computeTajikaPrashna,
  computeNarchintamani,
  computeShatpanchasika,
  computeSwaraPrashna,
  computeArudhaPrashna,
  SwaraPrashnaInput,
} from '../services/prashna-schools.service';
import {
  computeSarvatobhadra,
  computeKalanala,
  computeShoola,
  computeKota,
  computeChatushpata,
  computeAllChakras,
} from '../services/chakras.service';
import {
  detectMuhurtaYogas,
  buildDayCalendar,
  buildWeekCalendar,
  buildVarjyamWidget,
  listPresets,
  findPresetByKey,
  PRESETS,
} from '../services/muhurta-pro.service';
import { findMuhuratAdvanced, MuhuratEvent } from '../services/muhurat.service';

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

function parsePrashna(req: any) {
  const { whenISO, lat, lng, question, number } = req.body || {};
  if (lat == null || lng == null) return null;
  return castPrashna({
    whenISO, lat: Number(lat), lng: Number(lng), question, number,
  });
}

// ─── Prashna schools ─────────────────────────────────────────────────
// Body: { whenISO?, lat, lng, question?, number?, category? }

router.post('/prashna/tajika', (req, res) => {
  const p = parsePrashna(req);
  if (!p) return res.status(400).json({ ok: false, error: 'lat, lng required' });
  const category = (req.body?.category || 'general') as PrashnaCategory;
  res.json({ ok: true, tajika: computeTajikaPrashna(p, category) });
});

router.post('/prashna/narchintamani', (req, res) => {
  const p = parsePrashna(req);
  if (!p) return res.status(400).json({ ok: false, error: 'lat, lng required' });
  const tithiNum = typeof req.body?.tithiNum === 'number' ? req.body.tithiNum : undefined;
  const horaRuler = typeof req.body?.horaRuler === 'string' ? req.body.horaRuler : undefined;
  res.json({ ok: true, narchintamani: computeNarchintamani(p, tithiNum, horaRuler) });
});

router.post('/prashna/shatpanchasika', (req, res) => {
  const p = parsePrashna(req);
  if (!p) return res.status(400).json({ ok: false, error: 'lat, lng required' });
  res.json({ ok: true, shatpanchasika: computeShatpanchasika(p) });
});

router.post('/prashna/swara', (req, res) => {
  const { whenISO, dayIndex, waxing, hoursSinceSunrise, nostril, bhuta } = (req.body || {}) as SwaraPrashnaInput;
  if (dayIndex == null || hoursSinceSunrise == null) {
    return res.status(400).json({ ok: false, error: 'dayIndex, hoursSinceSunrise required' });
  }
  res.json({ ok: true, swara: computeSwaraPrashna({
    whenISO, dayIndex, waxing: !!waxing, hoursSinceSunrise, nostril, bhuta,
  }) });
});

router.post('/prashna/arudha', (req, res) => {
  const p = parsePrashna(req);
  if (!p) return res.status(400).json({ ok: false, error: 'lat, lng required' });
  const category = req.body?.category as PrashnaCategory | undefined;
  res.json({ ok: true, arudha: computeArudhaPrashna(p, category) });
});

// One-shot bundle for all prashna schools
router.post('/prashna/schools', (req, res) => {
  const p = parsePrashna(req);
  if (!p) return res.status(400).json({ ok: false, error: 'lat, lng required' });
  const category = (req.body?.category || 'general') as PrashnaCategory;
  const hoursSinceSunrise = typeof req.body?.hoursSinceSunrise === 'number' ? req.body.hoursSinceSunrise : 0;
  const dayIndex = typeof req.body?.dayIndex === 'number' ? req.body.dayIndex : new Date().getUTCDay();
  const waxing = !!req.body?.waxing;
  res.json({
    ok: true,
    schools: {
      tajika:        computeTajikaPrashna(p, category),
      narchintamani: computeNarchintamani(p, req.body?.tithiNum, req.body?.horaRuler),
      shatpanchasika: computeShatpanchasika(p),
      swara:         computeSwaraPrashna({ dayIndex, waxing, hoursSinceSunrise }),
      arudha:        computeArudhaPrashna(p, category),
    },
  });
});

// ─── Chakras ─────────────────────────────────────────────────────────
// Body: standard BirthInput

router.post('/chakras/sarvatobhadra', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, sarvatobhadra: computeSarvatobhadra(k, req.locale) });
});

router.post('/chakras/kalanala', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, kalanala: computeKalanala(k, req.locale) });
});

router.post('/chakras/shoola', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const when = typeof req.body?.when === 'string' ? req.body.when : undefined;
  res.json({ ok: true, shoola: computeShoola(k, when, req.locale) });
});

router.post('/chakras/kota', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, kota: computeKota(k, req.locale) });
});

router.post('/chakras/chatushpata', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, chatushpata: computeChatushpata(k, req.locale) });
});

// All chakras in one call
router.post('/chakras/all', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const when = typeof req.body?.when === 'string' ? req.body.when : undefined;
  res.json({ ok: true, chakras: computeAllChakras(k, when, req.locale) });
});

// ─── Muhurta Pro ─────────────────────────────────────────────────────

/** GET /api/muhurta-pro/presets — list 35+ preset events */
router.get('/muhurta-pro/presets', (_req, res) => {
  res.json({ ok: true, presets: listPresets() });
});

/** GET /api/muhurta-pro/presets/:key — preset detail */
router.get('/muhurta-pro/presets/:key', (req, res) => {
  const preset = findPresetByKey(req.params.key);
  if (!preset) return res.status(404).json({ ok: false, error: 'Preset not found' });
  res.json({ ok: true, preset });
});

/** POST /api/muhurta-pro/yogas — detect active muhurta yogas at a moment */
router.post('/muhurta-pro/yogas', (req, res) => {
  const { weekday, nakshatra, tithi, birthNak, sunRashi } = req.body || {};
  if (weekday == null || nakshatra == null || tithi == null) {
    return res.status(400).json({ ok: false, error: 'weekday, nakshatra, tithi required' });
  }
  res.json({ ok: true, yogas: detectMuhurtaYogas({
    weekday: Number(weekday), nakshatra: Number(nakshatra), tithi: Number(tithi),
    birthNak: birthNak != null ? Number(birthNak) : undefined,
    sunRashi: sunRashi != null ? Number(sunRashi) : undefined,
  }) });
});

/** POST /api/muhurta-pro/day — Chaughadia+Hora+panchang for one day */
router.post('/muhurta-pro/day', (req, res) => {
  const { date, lat, lng, birthNak } = req.body || {};
  if (lat == null || lng == null) return res.status(400).json({ ok: false, error: 'lat, lng required' });
  const dateISO = date || new Date().toISOString();
  res.json({ ok: true, day: buildDayCalendar(String(dateISO), Number(lat), Number(lng),
    birthNak != null ? Number(birthNak) : undefined) });
});

/** POST /api/muhurta-pro/week — 7-day Chaughadia+Hora+panchang */
router.post('/muhurta-pro/week', (req, res) => {
  const { start, lat, lng, birthNak } = req.body || {};
  if (lat == null || lng == null) return res.status(400).json({ ok: false, error: 'lat, lng required' });
  const startISO = start || new Date().toISOString();
  res.json({ ok: true, days: buildWeekCalendar(String(startISO), Number(lat), Number(lng),
    birthNak != null ? Number(birthNak) : undefined) });
});

/** POST /api/muhurta-pro/varjyam — varjyam widget for N days */
router.post('/muhurta-pro/varjyam', (req, res) => {
  const { date, lat, lng, days } = req.body || {};
  if (lat == null || lng == null) return res.status(400).json({ ok: false, error: 'lat, lng required' });
  const dateISO = date || new Date().toISOString();
  const n = Math.min(30, Math.max(1, Number(days ?? 7)));
  res.json({ ok: true, varjyam: buildVarjyamWidget(String(dateISO), Number(lat), Number(lng), n) });
});

/** POST /api/muhurta-pro/find — preset-aware muhurta search (thin wrapper
 *  around findMuhuratAdvanced, mapping preset nakshatras/days/tithis onto
 *  the advanced finder). */
router.post('/muhurta-pro/find', (req, res) => {
  const { presetKey, event, startDate, endDate, lat, lng, birthNakshatra, stepMinutes } = req.body || {};
  if (lat == null || lng == null || !startDate || !endDate) {
    return res.status(400).json({ ok: false, error: 'lat, lng, startDate, endDate required' });
  }

  const preset = presetKey ? findPresetByKey(String(presetKey)) : undefined;
  // Map preset → underlying advanced muhurat finder; default to 'general' event.
  const mappedEvent: MuhuratEvent = (preset ? mapPresetToEvent(preset.key) : (event as MuhuratEvent)) || 'general';

  const result = findMuhuratAdvanced({
    event: mappedEvent,
    startDate: new Date(String(startDate)),
    endDate: new Date(String(endDate)),
    lat: Number(lat),
    lng: Number(lng),
    birthNakshatra: birthNakshatra != null ? Number(birthNakshatra) : undefined,
    stepMinutes: stepMinutes != null ? Number(stepMinutes) : 60,
  });

  res.json({ ok: true, preset, result });
});

/** Coarse preset→base-event mapping so preset searches can leverage the
 *  advanced muhurat finder without duplicating its scoring engine. */
function mapPresetToEvent(presetKey: string): MuhuratEvent {
  if (presetKey === 'marriage' || presetKey === 'engagement') return 'marriage';
  if (presetKey.startsWith('griha') || presetKey === 'foundation' || presetKey === 'bhoomi-puja'
      || presetKey === 'construction-start' || presetKey === 'well-digging') return 'griha-pravesh';
  if (presetKey.startsWith('travel') || presetKey === 'pilgrimage') return 'travel';
  if (presetKey === 'business-open' || presetKey === 'shop-open' || presetKey === 'office-open'
      || presetKey === 'job-start' || presetKey === 'contract-signing' || presetKey === 'interview'
      || presetKey === 'litigation' || presetKey === 'exam-start') return 'business';
  if (presetKey === 'vidyarambha' || presetKey === 'aksharabhyasam') return 'education';
  if (presetKey === 'vehicle') return 'vehicle-purchase';
  return 'general';
}

export default router;
