// Phase 17 — Print / Export.
//
//   POST /api/pdf/varshphal          → Varshphal book (annual Tajika)
//   POST /api/pdf/muhurat            → Muhurta book (ranked auspicious windows)
//   POST /api/pdf/custom             → Drag-drop section-based report
//   GET  /api/pdf/custom/sections    → Metadata for the section catalog
//   POST /api/export/csv             → Planetary positions as CSV
//   POST /api/export/xlsx            → Multi-sheet XLSX (overview/planets/houses/dasha)
//   POST /api/export/svg             → Hi-res SVG chart (north | south)
//   POST /api/export/png             → PNG raster of the chart (configurable scale)

import { Router } from 'express';
import { BirthInput, calculateKundali } from '../services/kundali.service';
import {
  generateVarshphalPdf,
  generateMuhuratPdf,
} from '../services/pdf.service';
import {
  generateCustomReportPdf,
  SECTION_CATALOG,
  SectionId,
} from '../services/custom-report.service';
import { MuhuratEvent } from '../services/muhurat.service';
import {
  buildChartCsv,
  buildChartXlsx,
  buildChartSvg,
  buildChartPng,
  ChartVariant,
} from '../services/export.service';

const router = Router();

function slug(s: string): string {
  return (s || 'report').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

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

// ─── Books ────────────────────────────────────────────────────────────────────
router.post('/pdf/varshphal', async (req, res, next) => {
  try {
    const body = req.body || {};
    const birth = readBirth(body);
    if (!birth) {
      return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
    }
    const age = Number(body.age);
    if (!Number.isFinite(age) || age < 0 || age > 120) {
      return res.status(400).json({ ok: false, error: 'age (0..120) required' });
    }
    const pdf = await generateVarshphalPdf(birth, age, body.subjectName, req.locale);
    const filename = `varshphal-${slug(body.subjectName ?? 'report')}-age${age}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length.toString());
    res.send(pdf);
  } catch (err) { next(err); }
});

router.post('/pdf/muhurat', async (req, res, next) => {
  try {
    const body = req.body || {};
    const event = body.event as MuhuratEvent | undefined;
    const startDate = body.startDate ? new Date(body.startDate) : null;
    const endDate = body.endDate ? new Date(body.endDate) : null;
    const lat = body.lat != null ? Number(body.lat) : null;
    const lng = body.lng != null ? Number(body.lng) : null;
    if (!event || !startDate || !endDate || lat == null || lng == null ||
        isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        ok: false,
        error: 'event, startDate, endDate, lat, lng required',
      });
    }
    const pdf = await generateMuhuratPdf({
      event, startDate, endDate, lat, lng,
      subjectName: body.subjectName,
      eventLabel: body.eventLabel,
      locationLabel: body.locationLabel,
      locale: req.locale,
    });
    const filename = `muhurat-${slug(event)}-${startDate.toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length.toString());
    res.send(pdf);
  } catch (err) { next(err); }
});

// ─── Drag-drop custom report ──────────────────────────────────────────────────
router.get('/pdf/custom/sections', (_req, res) => {
  res.json({ ok: true, sections: SECTION_CATALOG });
});

router.post('/pdf/custom', async (req, res, next) => {
  try {
    const body = req.body || {};
    const birth = readBirth(body.birth);
    if (!birth) {
      return res.status(400).json({ ok: false, error: 'birth {datetime, lat, lng} required' });
    }
    const sections = Array.isArray(body.sections) ? (body.sections as SectionId[]) : [];
    if (sections.length === 0) {
      return res.status(400).json({ ok: false, error: 'sections[] must be non-empty' });
    }
    const validIds = new Set(SECTION_CATALOG.map((s) => s.id));
    const bad = sections.find((s) => !validIds.has(s));
    if (bad) return res.status(400).json({ ok: false, error: `unknown section: ${bad}` });

    const pdf = await generateCustomReportPdf({
      birth,
      sections,
      subjectName: body.subjectName,
      title: body.title,
      age: body.age != null ? Number(body.age) : undefined,
    });
    const filename = `${slug(body.title ?? 'custom-report')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length.toString());
    res.send(pdf);
  } catch (err) { next(err); }
});

// ─── Data + chart export ──────────────────────────────────────────────────────
router.post('/export/csv', (req, res, next) => {
  try {
    const birth = readBirth(req.body);
    if (!birth) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
    const k = calculateKundali(birth);
    const csv = buildChartCsv(k);
    const filename = `chart-${slug(birth.placeName ?? 'export')}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) { next(err); }
});

router.post('/export/xlsx', async (req, res, next) => {
  try {
    const birth = readBirth(req.body);
    if (!birth) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
    const k = calculateKundali(birth);
    const buf = await buildChartXlsx(k);
    const filename = `chart-${slug(birth.placeName ?? 'export')}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buf.length.toString());
    res.send(buf);
  } catch (err) { next(err); }
});

router.post('/export/svg', (req, res, next) => {
  try {
    const birth = readBirth(req.body);
    if (!birth) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
    const variant = (req.body?.variant === 'south' ? 'south' : 'north') as ChartVariant;
    const size = Math.max(240, Math.min(2400, Number(req.body?.size) || 600));
    const k = calculateKundali(birth);
    const svg = buildChartSvg(k, variant, size);
    const download = req.body?.download === true;
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    if (download) {
      const filename = `chart-${variant}-${size}.svg`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    res.send(svg);
  } catch (err) { next(err); }
});

router.post('/export/png', async (req, res, next) => {
  try {
    const birth = readBirth(req.body);
    if (!birth) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
    const variant = (req.body?.variant === 'south' ? 'south' : 'north') as ChartVariant;
    const scale = Math.max(1, Math.min(8, Number(req.body?.scale) || 3));
    const k = calculateKundali(birth);
    const buf = await buildChartPng(k, variant, scale);
    const filename = `chart-${variant}-${scale}x.png`;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buf.length.toString());
    res.send(buf);
  } catch (err) { next(err); }
});

export default router;
