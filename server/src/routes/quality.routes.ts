// Quality / accuracy routes.
//
// GET  /api/quality/options                     — available ayanamsa + house systems
// GET  /api/quality/famous                      — list of famous charts
// GET  /api/quality/famous/:id                  — single famous chart meta
// POST /api/quality/famous/:id/kundali          — compute kundali for a famous chart

import { Router } from 'express';
import { calculateKundali } from '../services/kundali.service';
import { FAMOUS_CHARTS, findChart } from '../data/famous-charts';
import { getAyanamsaKeys, getHouseSystemKeys, AYANAMSA_MAP, HOUSE_SYSTEM_MAP } from '../config/ephemeris';

const router = Router();

router.get('/options', (_req, res) => {
  res.json({
    ok: true,
    ayanamsas: getAyanamsaKeys().map((k) => ({ key: k, sidmId: AYANAMSA_MAP[k] })),
    houseSystems: getHouseSystemKeys().map((k) => ({ key: k, code: HOUSE_SYSTEM_MAP[k] })),
  });
});

router.get('/famous', (_req, res) => {
  res.json({ ok: true, charts: FAMOUS_CHARTS });
});

router.get('/famous/:id', (req, res) => {
  const c = findChart(req.params.id);
  if (!c) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true, chart: c });
});

router.post('/famous/:id/kundali', (req, res) => {
  const c = findChart(req.params.id);
  if (!c) return res.status(404).json({ ok: false, error: 'not found' });
  const { ayanamsa, houseSystem } = req.body || {};
  const k = calculateKundali({
    datetime: c.datetime, tzOffsetHours: c.tzOffsetHours,
    lat: c.lat, lng: c.lng, placeName: c.placeName,
    options: { ayanamsa, houseSystem },
  });
  res.json({ ok: true, kundali: k, famous: c });
});

export default router;
