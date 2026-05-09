import { Router } from 'express';
import { calculatePanchang } from '../services/panchang.service';

const router = Router();

/**
 * GET /api/panchang?date=YYYY-MM-DD&lat=..&lng=..
 * or POST /api/panchang { date, lat, lng }
 */
function handle(req: any, res: any) {
  const src = { ...req.query, ...req.body };
  const { date, lat, lng } = src;
  if (lat == null || lng == null) {
    return res.status(400).json({ ok: false, error: 'lat, lng required' });
  }
  const d = date ? new Date(date) : new Date();
  const result = calculatePanchang(d, Number(lat), Number(lng));
  res.json({ ok: true, panchang: result });
}

router.get('/', handle);
router.post('/', handle);

export default router;
