// GET /api/search?q=<query>&limit=<n>

import { Router } from 'express';
import { globalSearch } from '../services/global-search.service';

const router = Router();

router.get('/', async (req, res) => {
  const q = String(req.query.q ?? '');
  const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 40)));
  try {
    const hits = await globalSearch(q, limit);
    res.json({ ok: true, hits });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

export default router;
