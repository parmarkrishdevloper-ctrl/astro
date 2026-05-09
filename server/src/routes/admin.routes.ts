import { Router } from 'express';
import { getBranding, setBranding } from '../models/branding.model';

const router = Router();

/** GET /api/admin/branding — read current white-label branding */
router.get('/branding', async (_req, res) => {
  const b = await getBranding();
  res.json({ ok: true, branding: b });
});

/** PUT /api/admin/branding — partial update */
router.put('/branding', async (req, res) => {
  const allowed = [
    'companyName', 'tagline', 'logoDataUrl',
    'primaryColor', 'accentColor', 'contact', 'footerText',
  ];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in req.body) patch[k] = req.body[k];
  const updated = await setBranding(patch);
  res.json({ ok: true, branding: updated });
});

export default router;
