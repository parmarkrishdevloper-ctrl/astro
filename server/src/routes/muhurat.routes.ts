import { Router } from 'express';
import { findMuhurat, findMuhuratAdvanced, MuhuratEvent } from '../services/muhurat.service';

const router = Router();

/**
 * POST /api/muhurat
 * Body: { event, startDate, endDate, lat, lng }
 */
router.post('/', (req, res) => {
  const { event, startDate, endDate, lat, lng } = req.body as {
    event?: MuhuratEvent;
    startDate?: string;
    endDate?: string;
    lat?: number;
    lng?: number;
  };
  if (!event || !startDate || !endDate || lat == null || lng == null) {
    return res.status(400).json({
      ok: false,
      error: 'event, startDate, endDate, lat, lng required',
    });
  }
  const result = findMuhurat({
    event,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    lat: Number(lat),
    lng: Number(lng),
  });
  res.json({ ok: true, muhurat: result });
});

/**
 * POST /api/muhurat/advanced
 * Hour-granularity search with Chaughadia + Hora + Tara Bala scoring.
 * Body: { event, startDate, endDate, lat, lng, birthNakshatra?, stepMinutes? }
 */
router.post('/advanced', (req, res) => {
  const { event, startDate, endDate, lat, lng, birthNakshatra, stepMinutes } = req.body as {
    event?: MuhuratEvent;
    startDate?: string; endDate?: string;
    lat?: number; lng?: number;
    birthNakshatra?: number; stepMinutes?: number;
  };
  if (!event || !startDate || !endDate || lat == null || lng == null) {
    return res.status(400).json({ ok: false, error: 'event, startDate, endDate, lat, lng required' });
  }
  const result = findMuhuratAdvanced({
    event,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    lat: Number(lat), lng: Number(lng),
    birthNakshatra: birthNakshatra != null ? Number(birthNakshatra) : undefined,
    stepMinutes: stepMinutes != null ? Number(stepMinutes) : undefined,
  });
  res.json({ ok: true, muhurat: result });
});

export default router;
