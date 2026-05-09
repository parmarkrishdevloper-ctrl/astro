// Offline / privacy routes.
//
// POST /api/offline/backup         body: { passphrase? } → JSON envelope
// POST /api/offline/restore        body: { envelope, passphrase?, replaceExisting? }
// POST /api/offline/narrative      body: BirthInput → local-LLM or rule-based narrative
// GET  /api/offline/status         offline-readiness check (mongo / ollama / ephemeris)

import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { exportBackup, restoreBackup } from '../services/backup.service';
import { generateNarrative, ollamaAvailable } from '../services/local-llm.service';
import { calculateKundali, BirthInput } from '../services/kundali.service';
import mongoose from 'mongoose';

const router = Router();

// ─── Backup ────────────────────────────────────────────────────────────────
router.post('/backup', async (req, res) => {
  try {
    const { passphrase } = req.body || {};
    const env = await exportBackup(passphrase);
    res.json({ ok: true, backup: env });
  } catch (e: any) { res.status(500).json({ ok: false, error: e.message }); }
});

router.post('/restore', async (req, res) => {
  try {
    const { envelope, passphrase, replaceExisting } = req.body || {};
    if (!envelope) return res.status(400).json({ ok: false, error: 'envelope required' });
    const result = await restoreBackup({ envelope, passphrase, replaceExisting });
    res.json({ ok: true, result });
  } catch (e: any) { res.status(400).json({ ok: false, error: e.message }); }
});

// ─── Narrative (Ollama or fallback) ────────────────────────────────────────
router.post('/narrative', async (req, res) => {
  const body = req.body as Partial<BirthInput>;
  if (!body?.datetime || body.lat == null || body.lng == null) {
    return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  }
  try {
    const k = calculateKundali({
      datetime: body.datetime, tzOffsetHours: body.tzOffsetHours,
      lat: Number(body.lat), lng: Number(body.lng), placeName: body.placeName,
    });
    const n = await generateNarrative(k);
    res.json({ ok: true, ...n });
  } catch (e: any) { res.status(500).json({ ok: false, error: e.message }); }
});

// ─── Offline readiness ─────────────────────────────────────────────────────
router.get('/status', async (_req, res) => {
  const ephePath = process.env.EPHE_PATH
    || path.join(process.cwd(), 'server', 'ephe');
  const hasEphe = fs.existsSync(ephePath)
    && fs.readdirSync(ephePath).some((f) => f.endsWith('.se1'));
  const dbReady = mongoose.connection.readyState === 1;
  const ollama = await ollamaAvailable();
  res.json({
    ok: true,
    status: {
      db: dbReady,
      mongo: dbReady,
      ollama,
      ephemeris: {
        path: ephePath,
        available: hasEphe,
        note: hasEphe
          ? 'Full Swiss Ephemeris precision'
          : 'Falling back to Moshier (lower precision) — drop .se1 files into server/ephe/ for full accuracy',
      },
      isFullyOffline: dbReady && hasEphe,
    },
  });
});


export default router;
