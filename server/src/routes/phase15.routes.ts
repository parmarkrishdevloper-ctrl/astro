// Phase 15 — Classical texts.
//
//   POST /api/classical/quotes              → auto-link quotes to chart
//   POST /api/classical/quotes/search       → free-text search across corpus
//   GET  /api/classical/quotes/texts        → list indexed texts + counts
//   POST /api/classical/avasthas-deep       → 12-state deep avastha reading

import { Router, Request, Response } from 'express';
import { calculateKundali, BirthInput, KundaliResult } from '../services/kundali.service';
import { linkQuotes, searchQuotes, listTexts } from '../services/classical-quotes.service';
import { calculateAvasthasDeep } from '../services/avasthas-deep.service';

const router = Router();

function parseBirth(req: Request, res: Response): KundaliResult | null {
  const b = (req.body?.birth ?? req.body) as Partial<BirthInput>;
  if (!b?.datetime || b.lat == null || b.lng == null) {
    res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
    return null;
  }
  return calculateKundali({
    datetime:      b.datetime,
    tzOffsetHours: b.tzOffsetHours,
    lat:           Number(b.lat),
    lng:           Number(b.lng),
    placeName:     b.placeName,
  });
}

router.get('/classical/quotes/texts', (req, res) => {
  res.json({ ok: true, texts: listTexts(req.locale) });
});

router.post('/classical/quotes', (req, res) => {
  const k = parseBirth(req, res);
  if (!k) return;
  const sources = Array.isArray(req.body?.sources) ? req.body.sources : undefined;
  const tags    = Array.isArray(req.body?.tags)    ? req.body.tags    : undefined;
  const limit   = req.body?.limit ? Number(req.body.limit) : undefined;
  res.json({ ok: true, linked: linkQuotes(k, { sources, tags, limit }, req.locale) });
});

router.post('/classical/quotes/search', (req, res) => {
  const query = String(req.body?.query ?? '').trim();
  if (!query) return res.status(400).json({ ok: false, error: 'query required' });
  const limit = req.body?.limit ? Number(req.body.limit) : 30;
  res.json({ ok: true, quotes: searchQuotes(query, limit, req.locale) });
});

router.post('/classical/avasthas-deep', (req, res) => {
  const k = parseBirth(req, res);
  if (!k) return;
  res.json({ ok: true, avasthas: calculateAvasthasDeep(k) });
});

export default router;
