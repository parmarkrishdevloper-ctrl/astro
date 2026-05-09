// Phase 10 routes — yoga detection, interpretation, remedies, classical refs.

import { Router } from 'express';
import { calculateKundali, BirthInput } from '../services/kundali.service';
import { detectAllYogas } from '../services/yoga-engine.service';
import { interpretChart } from '../services/interpretation.service';
import { REMEDIES, getRemedyEntry } from '../data/remedies';
import { CLASSICAL_REFS, findRefs } from '../data/classical-refs';
import { PlanetId } from '../utils/astro-constants';

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

router.post('/yogas/detect', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, yogas: detectAllYogas(k, req.locale) });
});

router.post('/interpret', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, interpretation: interpretChart(k, req.locale) });
});

router.get('/remedies', (req, res) => {
  const ids = Object.keys(REMEDIES) as PlanetId[];
  const remedies = Object.fromEntries(
    ids.map((id) => [id, getRemedyEntry(id, req.locale)]),
  );
  res.json({ ok: true, remedies });
});

router.get('/remedies/:planet', (req, res) => {
  const id = req.params.planet.toUpperCase() as PlanetId;
  if (!REMEDIES[id]) return res.status(404).json({ ok: false, error: 'unknown planet id' });
  res.json({ ok: true, remedy: getRemedyEntry(id, req.locale) });
});

router.get('/refs', (req, res) => {
  const tagsParam = (req.query.tags as string) || '';
  if (!tagsParam) {
    // Localize the full corpus for the requested locale
    const all = findRefs(CLASSICAL_REFS.flatMap((r) => r.tags), req.locale);
    return res.json({ ok: true, refs: all });
  }
  const tags = tagsParam.split(',').map((t) => t.trim()).filter(Boolean);
  res.json({ ok: true, refs: findRefs(tags, req.locale) });
});

export default router;
