import { Router } from 'express';
import { calculateNumerology } from '../services/numerology.service';

const router = Router();

/**
 * POST /api/numerology
 * Body: { dob: "YYYY-MM-DD", name?: string }
 */
router.post('/', (req, res) => {
  const { dob, name } = req.body as { dob?: string; name?: string };
  if (!dob) return res.status(400).json({ ok: false, error: 'dob (YYYY-MM-DD) required' });
  const d = new Date(dob);
  if (isNaN(d.getTime())) return res.status(400).json({ ok: false, error: 'invalid dob' });
  res.json({ ok: true, numerology: calculateNumerology(d, name) });
});

export default router;
