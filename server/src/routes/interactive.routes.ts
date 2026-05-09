// Interactive chart routes — planet drawer, dispositor tree, aspect web,
// synastry compare, composite chart.

import { Router } from 'express';
import { calculateKundali, BirthInput } from '../services/kundali.service';
import { PlanetId } from '../utils/astro-constants';
import {
  planetDetail, dispositorTree, aspectWeb, compareCharts, compositeChart,
} from '../services/interactive.service';

const router = Router();

function parseBirth(body: Partial<BirthInput>) {
  if (!body?.datetime || body.lat == null || body.lng == null) return null;
  return calculateKundali({
    datetime: body.datetime, tzOffsetHours: body.tzOffsetHours,
    lat: Number(body.lat), lng: Number(body.lng), placeName: body.placeName,
  });
}

router.post('/planet-detail', (req, res) => {
  const k = parseBirth(req.body);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const { planetId, whenISO } = req.body as { planetId?: PlanetId; whenISO?: string };
  if (!planetId) return res.status(400).json({ ok: false, error: 'planetId required' });
  try {
    res.json({ ok: true, detail: planetDetail(k, planetId, whenISO ? new Date(whenISO) : undefined, req.locale) });
  } catch (e: any) { res.status(400).json({ ok: false, error: e.message }); }
});

router.post('/dispositor-tree', (req, res) => {
  const k = parseBirth(req.body);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, tree: dispositorTree(k) });
});

router.post('/aspect-web', (req, res) => {
  const k = parseBirth(req.body);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, web: aspectWeb(k) });
});

router.post('/compare', (req, res) => {
  const A = parseBirth(req.body?.a);
  const B = parseBirth(req.body?.b);
  if (!A || !B) return res.status(400).json({ ok: false, error: 'a and b birth inputs required' });
  res.json({ ok: true, synastry: compareCharts(A, B), composite: compositeChart(A, B) });
});

export default router;
