import { Router } from 'express';
import { computeBody } from '../services/ephemeris.service';
import { dateToJD } from '../utils/julian';
import { VEDIC_PLANETS, rashiOf } from '../utils/astro-constants';
import { calculateKundali, BirthInput } from '../services/kundali.service';
import { HOUSE_SYSTEM_MAP, AYANAMSA_MAP } from '../config/ephemeris';
import {
  buildAllDivisionals, buildDivisional, Varga,
  VARGA_META, ALL_VARGAS, vargaSummary,
} from '../services/divisional.service';

const router = Router();

const AYANAMSA_LABELS: Record<string, { name: string; description: string }> = {
  lahiri:              { name: 'Lahiri (Chitrapaksha)', description: 'Government of India standard — most common in Vedic practice' },
  raman:               { name: 'B.V. Raman',            description: 'Adjusted Lahiri; ~22\' less' },
  krishnamurti:        { name: 'Krishnamurti (KP)',     description: 'KP system default' },
  true_chitrapaksha:   { name: 'True Chitrapaksha',     description: 'Fixes Chitra at exactly 180° (Spica)' },
  yukteshwar:          { name: 'Sri Yukteshwar',        description: 'From The Holy Science; ~22\' more than Lahiri' },
  fagan_bradley:       { name: 'Fagan–Bradley',         description: 'Western sidereal standard' },
  deluce:              { name: 'De Luce',               description: 'Christian sidereal, zero at AD 1' },
  jn_bhasin:           { name: 'J.N. Bhasin',           description: 'Alternate Vedic ayanamsa' },
  suryasiddhanta:      { name: 'Surya Siddhanta',       description: 'Classical Siddhantic' },
  aryabhata:           { name: 'Aryabhata',             description: 'Classical Siddhantic (Aryabhatiya)' },
};

const HOUSE_SYSTEM_LABELS: Record<string, { name: string; description: string }> = {
  placidus:      { name: 'Placidus',      description: 'Time-based — dominant Western + KP system' },
  koch:          { name: 'Koch',          description: 'Birthplace-based, modern German' },
  whole_sign:    { name: 'Whole Sign',    description: 'Classical Vedic — each rashi is one house from lagna' },
  equal:         { name: 'Equal House',   description: '30° arcs from ascendant' },
  sripati:       { name: 'Sripati (Porphyry)', description: 'Indian equivalent — trisects quadrants; cusp = bhava midpoint' },
  regiomontanus: { name: 'Regiomontanus', description: 'Great-circle divisions via the equator' },
  campanus:      { name: 'Campanus',      description: 'Great-circle divisions via the prime vertical' },
  topocentric:   { name: 'Topocentric',   description: 'Modern Placidus-like; refined for high latitudes' },
};

/**
 * GET /api/kundali/verify
 * Smoke test — Lahiri sidereal positions for all 9 grahas at J2000.
 */
router.get('/verify', (_req, res) => {
  const refDate = new Date(Date.UTC(2000, 0, 1, 12, 0, 0));
  const jd = dateToJD(refDate);

  const positions = VEDIC_PLANETS.map((p) => {
    if (p.computed && p.id === 'KE') {
      const rahu = computeBody(jd, VEDIC_PLANETS.find((x) => x.id === 'RA')!.swephId);
      const ketuLong = (rahu.longitude + 180) % 360;
      const r = rashiOf(ketuLong);
      return {
        id: p.id, name: p.name, nameHi: p.nameHi,
        longitude: ketuLong, rashi: r.name, rashiNum: r.num,
        degInRashi: r.deg, retrograde: true,
      };
    }
    const pos = computeBody(jd, p.swephId);
    const r = rashiOf(pos.longitude);
    return {
      id: p.id, name: p.name, nameHi: p.nameHi,
      longitude: pos.longitude, rashi: r.name, rashiNum: r.num,
      degInRashi: r.deg, retrograde: p.id === 'RA' ? true : pos.retrograde,
    };
  });

  res.json({
    ok: true, referenceUtc: refDate.toISOString(), julianDay: jd,
    ayanamsa: 'lahiri', positions,
  });
});

/**
 * POST /api/kundali/calculate
 * Body: { datetime, tzOffsetHours?, lat, lng, placeName? }
 * Returns full birth chart: planets (with rashi/nakshatra/pada/house),
 * ascendant, houses, ayanamsa.
 */
router.post('/calculate', (req, res) => {
  const body = req.body as Partial<BirthInput>;
  if (!body?.datetime || body.lat == null || body.lng == null) {
    return res.status(400).json({
      ok: false,
      error: 'Required fields: datetime (ISO 8601), lat, lng. tzOffsetHours optional if datetime has offset.',
    });
  }
  const result = calculateKundali({
    datetime: body.datetime,
    tzOffsetHours: body.tzOffsetHours,
    lat: Number(body.lat),
    lng: Number(body.lng),
    placeName: body.placeName,
    options: body.options,
  });
  res.json({ ok: true, kundali: result });
});

/**
 * POST /api/kundali/divisional
 * Body: BirthInput + { vargas?: Varga[] }   (default = all)
 */
router.post('/divisional', (req, res) => {
  const { vargas, ...birth } = req.body as Partial<BirthInput> & { vargas?: Varga[] };
  if (!birth?.datetime || birth.lat == null || birth.lng == null) {
    return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  }
  const kundali = calculateKundali({
    datetime: birth.datetime,
    tzOffsetHours: birth.tzOffsetHours,
    lat: Number(birth.lat),
    lng: Number(birth.lng),
    placeName: birth.placeName,
    options: birth.options,
  });
  const charts = vargas?.length
    ? Object.fromEntries(vargas.map((v) => [v, buildDivisional(kundali, v)]))
    : buildAllDivisionals(kundali);
  res.json({ ok: true, ascendant: kundali.ascendant, charts });
});

/**
 * GET /api/kundali/varga-meta
 * Returns the list of vargas + meta (name, segments, purpose).
 */
router.get('/varga-meta', (_req, res) => {
  res.json({ ok: true, vargas: ALL_VARGAS, meta: VARGA_META });
});

/** GET /api/kundali/ayanamsas — list available ayanamsas + 'tropical' sentinel. */
router.get('/ayanamsas', (_req, res) => {
  const ayanamsas = Object.keys(AYANAMSA_MAP).map((key) => ({
    key,
    ...(AYANAMSA_LABELS[key] ?? { name: key, description: '' }),
  }));
  res.json({ ok: true, ayanamsas, tropical: { key: 'tropical', name: 'Tropical (Sayana)', description: 'Western zodiac — no ayanamsa offset applied' } });
});

/** GET /api/kundali/house-systems — list available house systems. */
router.get('/house-systems', (_req, res) => {
  const systems = Object.keys(HOUSE_SYSTEM_MAP).map((key) => ({
    key,
    code: HOUSE_SYSTEM_MAP[key],
    ...(HOUSE_SYSTEM_LABELS[key] ?? { name: key, description: '' }),
  }));
  res.json({ ok: true, systems });
});

/**
 * POST /api/kundali/varga-summary
 * Body: BirthInput
 * Returns per-planet dignity / vargottama counts across all 20 divisionals.
 */
router.post('/varga-summary', (req, res) => {
  const body = req.body as Partial<BirthInput>;
  if (!body?.datetime || body.lat == null || body.lng == null) {
    return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  }
  const kundali = calculateKundali({
    datetime: body.datetime,
    tzOffsetHours: body.tzOffsetHours,
    lat: Number(body.lat),
    lng: Number(body.lng),
    placeName: body.placeName,
    options: body.options,
  });
  res.json({ ok: true, ascendant: kundali.ascendant, summary: vargaSummary(kundali) });
});

export default router;
