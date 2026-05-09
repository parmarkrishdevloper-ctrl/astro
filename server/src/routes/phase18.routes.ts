// Phase 18 — AI / Narrative routes.
//
//   POST /api/narrative           → multilingual chart narrative (sectioned)
//   POST /api/narrative/section   → one section only (lighter payload)
//   POST /api/journal/day         → single-day auto-journal entry
//   POST /api/journal/range       → up to 31 days of journal entries
//   POST /api/compare/narrative   → chart-to-chart compare reading

import { Router } from 'express';
import { BirthInput, calculateKundali } from '../services/kundali.service';
import { isLocale, Locale } from '../i18n';
import {
  buildNarrativeReport,
  buildSectionNarrative,
  ALL_SECTIONS,
  NarrativeSection,
} from '../services/narrative.service';
import { buildJournalEntry, buildJournalRange } from '../services/journal.service';
import { compareCharts } from '../services/compare.service';

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

function pickLocale(s: any): Locale {
  return isLocale(s) ? s : 'en';
}

// ─── Multilingual narrative ──────────────────────────────────────────────────
router.post('/narrative', (req, res, next) => {
  try {
    const birth = readBirth(req.body?.birth ?? req.body);
    if (!birth) {
      return res.status(400).json({ ok: false, error: 'birth {datetime, lat, lng} required' });
    }
    const locale = pickLocale(req.body?.locale);
    const sections = Array.isArray(req.body?.sections)
      ? (req.body.sections as NarrativeSection[]).filter((s) =>
          ALL_SECTIONS.includes(s),
        )
      : undefined;
    const k = calculateKundali(birth);
    const report = buildNarrativeReport(k, locale, { sections });
    res.json({ ok: true, report });
  } catch (err) {
    next(err);
  }
});

router.post('/narrative/section', (req, res, next) => {
  try {
    const birth = readBirth(req.body?.birth ?? req.body);
    if (!birth) {
      return res.status(400).json({ ok: false, error: 'birth {datetime, lat, lng} required' });
    }
    const locale = pickLocale(req.body?.locale);
    const section = req.body?.section as NarrativeSection;
    if (!ALL_SECTIONS.includes(section)) {
      return res.status(400).json({
        ok: false,
        error: `section must be one of ${ALL_SECTIONS.join(', ')}`,
      });
    }
    const k = calculateKundali(birth);
    const chunk = buildSectionNarrative(k, section, locale);
    res.json({ ok: true, locale, section: chunk });
  } catch (err) {
    next(err);
  }
});

// ─── Auto-journal ────────────────────────────────────────────────────────────
router.post('/journal/day', (req, res, next) => {
  try {
    const body = req.body || {};
    const birth = readBirth(body.birth);
    if (!birth) {
      return res.status(400).json({ ok: false, error: 'birth {datetime, lat, lng} required' });
    }
    const date = String(body.date ?? '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ ok: false, error: 'date (YYYY-MM-DD) required' });
    }
    const lat = Number(body.lat ?? birth.lat);
    const lng = Number(body.lng ?? birth.lng);
    const locale = pickLocale(body.locale);
    const k = calculateKundali(birth);
    const entry = buildJournalEntry(k, date, lat, lng, locale);
    res.json({ ok: true, locale, entry });
  } catch (err) {
    next(err);
  }
});

router.post('/journal/range', (req, res, next) => {
  try {
    const body = req.body || {};
    const birth = readBirth(body.birth);
    if (!birth) {
      return res.status(400).json({ ok: false, error: 'birth {datetime, lat, lng} required' });
    }
    const from = String(body.from ?? '').slice(0, 10);
    const to = String(body.to ?? '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      return res.status(400).json({ ok: false, error: 'from / to (YYYY-MM-DD) required' });
    }
    const lat = Number(body.lat ?? birth.lat);
    const lng = Number(body.lng ?? birth.lng);
    const locale = pickLocale(body.locale);
    const k = calculateKundali(birth);
    const range = buildJournalRange(k, from, to, lat, lng, locale);
    res.json({ ok: true, ...range });
  } catch (err) {
    next(err);
  }
});

// ─── Chart-to-chart compare ─────────────────────────────────────────────────
router.post('/compare/narrative', (req, res, next) => {
  try {
    const body = req.body || {};
    const a = readBirth(body.a);
    const b = readBirth(body.b);
    if (!a || !b) {
      return res.status(400).json({
        ok: false,
        error: 'a {datetime,lat,lng} and b {datetime,lat,lng} required',
      });
    }
    const locale = pickLocale(body.locale);
    const ka = calculateKundali(a);
    const kb = calculateKundali(b);
    const compare = compareCharts(ka, kb, locale);
    res.json({ ok: true, compare });
  } catch (err) {
    next(err);
  }
});

export default router;
