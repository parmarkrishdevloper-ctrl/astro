import { Router } from 'express';
import { BirthInput } from '../services/kundali.service';
import { calculateVarshaphala, calculateMuddaDasha } from '../services/varshaphala.service';

const router = Router();

/** POST /api/varshaphala — body: BirthInput + age */
router.post('/', (req, res) => {
  const { age = 0, ...birth } = req.body || {};
  if (!birth?.datetime || birth.lat == null || birth.lng == null) {
    return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  }
  const v = calculateVarshaphala(birth as BirthInput, Number(age));
  res.json({ ok: true, varshaphala: v, muddaDasha: calculateMuddaDasha(v) });
});

export default router;
