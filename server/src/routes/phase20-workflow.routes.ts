// Phase 20 — Workflow routes.
//
// Endpoints:
//   Saved views (UI state bookmarks):
//     POST   /api/views                create
//     GET    /api/views                list (optional ?route=/kundali&pinned=true)
//     GET    /api/views/:id            fetch one
//     PATCH  /api/views/:id            partial update
//     DELETE /api/views/:id            delete
//
//   Dashboard widgets (snapshot of 3 widgets in one call):
//     POST   /api/widgets/dashboard    body: { birth, when?, chartLabel? }

import { Router } from 'express';
import {
  createSavedView,
  listSavedViews,
  getSavedView,
  updateSavedView,
  deleteSavedView,
} from '../services/saved-view.service';
import { dashboardSnapshot } from '../services/widgets.service';

const router = Router();

// ─── Saved views CRUD ──────────────────────────────────────────────────────

router.post('/views', async (req, res) => {
  try {
    const v = await createSavedView(req.body || {});
    res.json({ ok: true, view: v });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.get('/views', async (req, res) => {
  const opts: any = {};
  if (typeof req.query.route === 'string') opts.route = req.query.route;
  if (req.query.pinned === 'true')  opts.pinned = true;
  if (req.query.pinned === 'false') opts.pinned = false;
  const views = await listSavedViews(opts);
  res.json({ ok: true, views });
});

router.get('/views/:id', async (req, res) => {
  const v = await getSavedView(req.params.id);
  if (!v) return res.status(404).json({ ok: false, error: 'not found' });
  res.json({ ok: true, view: v });
});

router.patch('/views/:id', async (req, res) => {
  try {
    const v = await updateSavedView(req.params.id, req.body || {});
    if (!v) return res.status(404).json({ ok: false, error: 'not found' });
    res.json({ ok: true, view: v });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

router.delete('/views/:id', async (req, res) => {
  const ok = await deleteSavedView(req.params.id);
  res.json({ ok: true, deleted: ok });
});

// ─── Dashboard widgets snapshot ─────────────────────────────────────────────

router.post('/widgets/dashboard', async (req, res) => {
  try {
    const { birth, when, chartLabel } = req.body || {};
    if (!birth || !birth.datetime || typeof birth.lat !== 'number' || typeof birth.lng !== 'number') {
      return res.status(400).json({
        ok: false,
        error: 'birth { datetime, lat, lng } required',
      });
    }
    const whenDate = when ? new Date(when) : new Date();
    if (isNaN(whenDate.getTime())) {
      return res.status(400).json({ ok: false, error: 'invalid when ISO' });
    }
    const snap = dashboardSnapshot(birth, whenDate, chartLabel);
    res.json({ ok: true, snapshot: snap });
  } catch (e: any) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

export default router;
