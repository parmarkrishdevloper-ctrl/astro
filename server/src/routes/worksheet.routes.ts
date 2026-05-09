// Worksheet & batch PDF routes — Phase 11.

import { Router } from 'express';
import {
  renderWorksheetPdf,
  renderBundlePdf,
  renderBatch,
  REPORT_BUNDLES,
} from '../services/worksheet.service';
import { BirthInput } from '../services/kundali.service';
import { WorksheetSpec } from '../templates/worksheet.template';
import { isLocale } from '../i18n';

const router = Router();

function parseBirth(body: any): BirthInput | null {
  if (!body?.datetime || body.lat == null || body.lng == null) return null;
  return {
    datetime: body.datetime,
    tzOffsetHours: body.tzOffsetHours,
    lat: Number(body.lat),
    lng: Number(body.lng),
    placeName: body.placeName,
  };
}

function safeFilename(s: string): string {
  return s.replace(/[^a-z0-9]+/gi, '-').toLowerCase().replace(/^-|-$/g, '') || 'report';
}

/** GET /api/worksheet/bundles — list available report types. */
router.get('/bundles', (_req, res) => {
  res.json({
    ok: true,
    bundles: Object.entries(REPORT_BUNDLES).map(([id, b]) => ({
      id, title: b.title, sections: b.sections,
    })),
  });
});

/** POST /api/worksheet/bundle/:id — render a predefined bundle. */
router.post('/bundle/:id', async (req, res, next) => {
  try {
    const birth = parseBirth(req.body);
    if (!birth) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
    const bundleId = req.params.id;
    if (!REPORT_BUNDLES[bundleId]) {
      return res.status(404).json({ ok: false, error: `unknown bundle: ${bundleId}` });
    }
    const subjectName = req.body.subjectName as string | undefined;
    const locale = isLocale(req.body.locale) ? req.body.locale : 'en';
    const pdf = await renderBundlePdf(birth, bundleId, subjectName, locale);
    const fname = `${bundleId}-${safeFilename(subjectName ?? 'report')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.setHeader('Content-Length', pdf.length.toString());
    res.send(pdf);
  } catch (err) { next(err); }
});

/** POST /api/worksheet/custom — caller supplies a full WorksheetSpec. */
router.post('/custom', async (req, res, next) => {
  try {
    const birth = parseBirth(req.body);
    if (!birth) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
    const spec = req.body.spec as WorksheetSpec | undefined;
    if (!spec || !Array.isArray(spec.sections) || spec.sections.length === 0) {
      return res.status(400).json({ ok: false, error: 'spec.sections required' });
    }
    const pdf = await renderWorksheetPdf(birth, spec);
    const fname = `${safeFilename(spec.title || 'worksheet')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
    res.setHeader('Content-Length', pdf.length.toString());
    res.send(pdf);
  } catch (err) { next(err); }
});

/** POST /api/worksheet/batch — array of {birth, bundleId, subjectName}. */
router.post('/batch', async (req, res, next) => {
  try {
    const entries = req.body?.entries;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ ok: false, error: 'entries[] required' });
    }
    const results = await renderBatch(
      entries.map((e: any) => ({
        birth: parseBirth(e),
        bundleId: e.bundleId,
        subjectName: e.subjectName,
      })).filter((e: any) => e.birth !== null) as any,
    );
    // Return JSON manifest with base64 PDFs (caller may download individually)
    res.json({
      ok: true,
      results: results.map((r) => ({
        subjectName: r.subjectName,
        bundleId: r.bundleId,
        ok: r.ok,
        error: r.error,
        sizeBytes: r.pdf?.length ?? 0,
        pdfBase64: r.pdf?.toString('base64'),
      })),
    });
  } catch (err) { next(err); }
});

export default router;
