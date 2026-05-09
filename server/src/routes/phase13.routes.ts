// Phase 13 — Specialty reports (Vastu / Medical / Marital / Career / Financial).
//
//   GET  /api/specialty/vastu/directions     → static 9-direction catalogue
//   POST /api/specialty/vastu                → computeVastuReport(chart)
//   POST /api/specialty/medical              → computeMedicalDeep(chart)
//   POST /api/specialty/marital              → computeMaritalDeep(chart)
//   POST /api/specialty/career               → computeCareerDeep(chart)
//   POST /api/specialty/financial            → computeFinancial(chart)

import { Router, Request, Response } from 'express';
import { calculateKundali, BirthInput, KundaliResult } from '../services/kundali.service';
import { listDirections, computeVastuReport } from '../services/vastu.service';
import { computeMedicalDeep } from '../services/medical-deep.service';
import { computeMaritalDeep } from '../services/marital-deep.service';
import { computeCareerDeep } from '../services/career-deep.service';
import { computeFinancial } from '../services/financial.service';

const router = Router();

function parseBirth(req: Request, res: Response): KundaliResult | null {
  const b = req.body as Partial<BirthInput>;
  if (!b?.datetime || b.lat == null || b.lng == null) {
    res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
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

router.get('/vastu/directions', (_req, res) => {
  res.json({ ok: true, directions: listDirections() });
});

router.post('/vastu', (req, res) => {
  const k = parseBirth(req, res);
  if (!k) return;
  res.json({ ok: true, report: computeVastuReport(k, req.locale) });
});

router.post('/medical', (req, res) => {
  const k = parseBirth(req, res);
  if (!k) return;
  res.json({ ok: true, report: computeMedicalDeep(k, req.locale) });
});

router.post('/marital', (req, res) => {
  const k = parseBirth(req, res);
  if (!k) return;
  res.json({ ok: true, report: computeMaritalDeep(k, req.locale) });
});

router.post('/career', (req, res) => {
  const k = parseBirth(req, res);
  if (!k) return;
  res.json({ ok: true, report: computeCareerDeep(k, req.locale) });
});

router.post('/financial', (req, res) => {
  const k = parseBirth(req, res);
  if (!k) return;
  res.json({ ok: true, report: computeFinancial(k, req.locale) });
});

export default router;
