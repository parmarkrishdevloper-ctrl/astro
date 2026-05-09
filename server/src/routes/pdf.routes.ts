import { Router } from 'express';
import { generateKundaliPdf, generateMatchingPdf } from '../services/pdf.service';
import { BirthInput } from '../services/kundali.service';

const router = Router();

function slug(s: string): string {
  return (s || 'report').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

/**
 * POST /api/pdf/kundali
 * Body: BirthInput + { subjectName? }
 * Response: application/pdf attachment
 */
router.post('/kundali', async (req, res, next) => {
  try {
    const body = req.body as Partial<BirthInput> & { subjectName?: string };
    if (!body?.datetime || body.lat == null || body.lng == null) {
      return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
    }
    const pdf = await generateKundaliPdf(
      {
        datetime: body.datetime,
        tzOffsetHours: body.tzOffsetHours,
        lat: Number(body.lat),
        lng: Number(body.lng),
        placeName: body.placeName,
      },
      body.subjectName,
      req.locale,
    );
    const filename = `kundali-${(body.subjectName ?? 'report').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length.toString());
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/pdf/matching
 * Body: { boy: BirthInput, girl: BirthInput, boyName?, girlName? }
 * Response: application/pdf attachment
 */
router.post('/matching', async (req, res, next) => {
  try {
    const body = req.body as {
      boy?: Partial<BirthInput>; girl?: Partial<BirthInput>;
      boyName?: string; girlName?: string;
    };
    const b = body?.boy, g = body?.girl;
    if (!b?.datetime || b.lat == null || b.lng == null ||
        !g?.datetime || g.lat == null || g.lng == null) {
      return res.status(400).json({ ok: false, error: 'boy & girl must have datetime, lat, lng' });
    }
    const pdf = await generateMatchingPdf(
      { datetime: b.datetime, tzOffsetHours: b.tzOffsetHours,
        lat: Number(b.lat), lng: Number(b.lng), placeName: b.placeName },
      { datetime: g.datetime, tzOffsetHours: g.tzOffsetHours,
        lat: Number(g.lat), lng: Number(g.lng), placeName: g.placeName },
      body.boyName,
      body.girlName,
      req.locale,
    );
    const filename = `matching-${slug(body.boyName ?? 'boy')}-${slug(body.girlName ?? 'girl')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdf.length.toString());
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

export default router;
