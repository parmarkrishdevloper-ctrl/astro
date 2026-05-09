// Phase 19 — Biometric routes (palmistry / samudrika / graphology /
// deep numerology / tarot).
//
//   POST /api/palmistry                → readPalm(PalmInput)
//   POST /api/samudrika                → readSamudrika(SamudrikaInput)
//   POST /api/graphology               → readGraphology(GraphologyInput)
//   POST /api/numerology-deep          → deepNumerology(dob, name?, today?)
//   POST /api/numerology-compatibility → nameCompatibility(nameA, nameB)
//   POST /api/tarot                    → tarotReading(spread, question?, birth?)
//
// These engines are purely local (no external APIs), matching the project
// convention in CLAUDE.md. The tarot endpoint accepts an optional `birth`
// object; if supplied, we compute a kundali and derive the tarot seed from
// the chart so the same chart+spread always produces the same draw.

import { Router } from 'express';
import { BirthInput, calculateKundali } from '../services/kundali.service';
import { readPalm, PalmInput } from '../services/palmistry.service';
import { readSamudrika, SamudrikaInput } from '../services/samudrika.service';
import { readGraphology, GraphologyInput } from '../services/graphology.service';
import {
  deepNumerology,
  nameCompatibility,
} from '../services/numerology-deep.service';
import { tarotReading, SpreadType } from '../services/tarot.service';

const router = Router();

function readBirth(body: any): BirthInput | null {
  if (!body?.datetime || body.lat == null || body.lng == null) return null;
  return {
    datetime: body.datetime,
    tzOffsetHours: body.tzOffsetHours,
    lat: Number(body.lat),
    lng: Number(body.lng),
    placeName: body.placeName,
    options: body.options,
  };
}

// ─── Palmistry ────────────────────────────────────────────────────────────
router.post('/palmistry', (req, res, next) => {
  try {
    const input = req.body as PalmInput;
    if (!input?.handShape || !input?.dominantHand || !input?.thumb) {
      return res.status(400).json({
        ok: false,
        error: 'palmistry requires { dominantHand, handShape, thumb, fingers?, lines?, mounts?, marks? }',
      });
    }
    // Normalise optional sub-objects so the service doesn't crash on undefined.
    const normalised: PalmInput = {
      ...input,
      fingers: input.fingers ?? {},
      lines: input.lines ?? {},
      mounts: input.mounts ?? {},
      marks: input.marks ?? [],
    };
    const reading = readPalm(normalised, req.locale);
    res.json({ ok: true, reading });
  } catch (err) {
    next(err);
  }
});

// ─── Samudrika ────────────────────────────────────────────────────────────
router.post('/samudrika', (req, res, next) => {
  try {
    const input = req.body as SamudrikaInput;
    if (!input?.complexion || !input?.build) {
      return res.status(400).json({
        ok: false,
        error: 'samudrika requires at least { complexion, build }',
      });
    }
    const reading = readSamudrika(input, req.locale);
    res.json({ ok: true, reading });
  } catch (err) {
    next(err);
  }
});

// ─── Graphology ───────────────────────────────────────────────────────────
router.post('/graphology', (req, res, next) => {
  try {
    const input = req.body as GraphologyInput;
    if (!input?.slant || !input?.pressure || !input?.size || !input?.spacing || !input?.baseline) {
      return res.status(400).json({
        ok: false,
        error: 'graphology requires { slant, pressure, size, spacing, baseline, ... }',
      });
    }
    const reading = readGraphology(input, req.locale);
    res.json({ ok: true, reading });
  } catch (err) {
    next(err);
  }
});

// ─── Deep numerology ──────────────────────────────────────────────────────
router.post('/numerology-deep', (req, res, next) => {
  try {
    const body = req.body || {};
    const dobStr = String(body.dob ?? '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dobStr)) {
      return res.status(400).json({ ok: false, error: 'dob (YYYY-MM-DD) required' });
    }
    const dob = new Date(`${dobStr}T00:00:00Z`);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ ok: false, error: 'dob is not a valid date' });
    }
    const todayStr = typeof body.today === 'string' ? body.today.slice(0, 10) : null;
    const today = todayStr && /^\d{4}-\d{2}-\d{2}$/.test(todayStr)
      ? new Date(`${todayStr}T00:00:00Z`)
      : new Date();
    const name = typeof body.name === 'string' ? body.name : undefined;
    const result = deepNumerology(dob, name, today, req.locale);
    res.json({ ok: true, result });
  } catch (err) {
    next(err);
  }
});

router.post('/numerology-compatibility', (req, res, next) => {
  try {
    const body = req.body || {};
    const nameA = typeof body.nameA === 'string' ? body.nameA : '';
    const nameB = typeof body.nameB === 'string' ? body.nameB : '';
    if (!nameA.trim() || !nameB.trim()) {
      return res.status(400).json({ ok: false, error: 'nameA and nameB required' });
    }
    const result = nameCompatibility(nameA, nameB);
    res.json({ ok: true, result });
  } catch (err) {
    next(err);
  }
});

// ─── Tarot (optionally chart-seeded) ──────────────────────────────────────
const VALID_SPREADS: SpreadType[] = ['three-card', 'celtic-cross', 'chart-overlay'];

router.post('/tarot', (req, res, next) => {
  try {
    const body = req.body || {};
    const spread = body.spread as SpreadType;
    if (!VALID_SPREADS.includes(spread)) {
      return res.status(400).json({
        ok: false,
        error: `spread must be one of ${VALID_SPREADS.join(', ')}`,
      });
    }
    const question = typeof body.question === 'string' ? body.question : undefined;
    const seed = typeof body.seed === 'string' ? body.seed : undefined;

    // chart-overlay needs a chart; others may optionally get one for stable seed.
    const birth = readBirth(body.birth);
    let chart = undefined;
    if (birth) {
      chart = calculateKundali(birth);
    }
    if (spread === 'chart-overlay' && !chart && !seed) {
      return res.status(400).json({
        ok: false,
        error: 'chart-overlay spread requires birth {datetime, lat, lng} or an explicit seed',
      });
    }

    const result = tarotReading({ spread, question, seed, chart }, req.locale);
    res.json({ ok: true, result });
  } catch (err) {
    next(err);
  }
});

export default router;
