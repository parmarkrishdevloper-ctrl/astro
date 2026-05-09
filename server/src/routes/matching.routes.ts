import { Router } from 'express';
import { matchKundalis } from '../services/matching.service';
import { BirthInput } from '../services/kundali.service';

const router = Router();

/**
 * POST /api/matching/ashtakoot
 * Body: { boy: BirthInput, girl: BirthInput }
 */
router.post('/ashtakoot', (req, res) => {
  const { boy, girl } = req.body as { boy?: BirthInput; girl?: BirthInput };
  if (!boy || !girl || !boy.datetime || !girl.datetime) {
    return res.status(400).json({ ok: false, error: 'Both boy and girl BirthInputs required.' });
  }
  const result = matchKundalis(boy, girl, req.locale);
  res.json({ ok: true, matching: result });
});

export default router;
