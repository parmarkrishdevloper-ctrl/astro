import { Router } from 'express';
import { calculateKundali, BirthInput } from '../services/kundali.service';
import { detectYogas } from '../services/yoga.service';
import { checkAllDoshas } from '../services/dosha.service';
import { calculateShadbala } from '../services/strength.service';
import { calculateJaimini } from '../services/jaimini.service';
import { calculateKP, computeRulingPlanets } from '../services/kp.service';
import { calculateAvasthas } from '../services/avastha.service';
import { calculateSudarshana } from '../services/sudarshana.service';
import { computeChalit, ChalitMethod } from '../services/chalit.service';
import { computeUpagrahas } from '../services/upagraha.service';
import { computeSensitivePoints } from '../services/sensitive-points.service';
import { analyzeLifeAreas } from '../services/life-areas.service';
import { computeVimsopaka, VimsopakaScheme, VIMSOPAKA_SCHEMES } from '../services/vimsopaka.service';
import { computeIshtaKashta } from '../services/ishta-kashta.service';
import { computeRemedies } from '../services/remedies.service';
import { computeGochara } from '../services/gochara.service';
import { computeDashaSandhi } from '../services/dasha-sandhi.service';
import { computeAshtakavargaTransit } from '../services/ashtakavarga-transit.service';
import { computeDoubleTransit } from '../services/double-transit.service';
import { calculateLalKitab } from '../services/lal-kitab.service';
import { calculateNadi } from '../services/nadi.service';
import { computeTajikaYogas } from '../services/tajika.service';
import { calculateSphutas } from '../services/sphuta.service';
import { computeSadeSati } from '../services/sade-sati.service';
import { computeReturns } from '../services/returns.service';
import { computeProgressions } from '../services/progressions.service';
import { computeGrahaYuddha } from '../services/graha-yuddha.service';
import { computeCombustion } from '../services/combustion.service';
import { computeRetroShadow } from '../services/retro-shadow.service';
import { computeKakshaBala } from '../services/kaksha-bala.service';

const router = Router();

function parseBirth(req: any) {
  const body = req.body as Partial<BirthInput>;
  if (!body?.datetime || body.lat == null || body.lng == null) {
    return null;
  }
  return calculateKundali({
    datetime: body.datetime,
    tzOffsetHours: body.tzOffsetHours,
    lat: Number(body.lat),
    lng: Number(body.lng),
    placeName: body.placeName,
    options: body.options,
  });
}

/** POST /api/analysis/yogas */
router.post('/yogas', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, yogas: detectYogas(k, req.locale) });
});

/** POST /api/analysis/doshas */
router.post('/doshas', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, doshas: checkAllDoshas(k, undefined, req.locale) });
});

/** POST /api/analysis/shadbala */
router.post('/shadbala', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, shadbala: calculateShadbala(k) });
});

/** POST /api/analysis/jaimini — Karakas + Jaimini aspects + Special Lagnas + Chara Dasha */
router.post('/jaimini', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, jaimini: calculateJaimini(k) });
});

/** POST /api/analysis/kp — KP cusps + significators */
router.post('/kp', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, kp: calculateKP(k) });
});

/** POST /api/analysis/ruling-planets — RPs at the current moment for a location */
router.post('/ruling-planets', (req, res) => {
  const { lat, lng, when } = req.body || {};
  if (lat == null || lng == null) {
    return res.status(400).json({ ok: false, error: 'lat, lng required' });
  }
  const whenISO = when || new Date().toISOString();
  res.json({ ok: true, rulingPlanets: computeRulingPlanets(whenISO, Number(lat), Number(lng)) });
});

/** POST /api/analysis/avasthas — Baladi/Jagradadi/Deeptadi states per planet */
router.post('/avasthas', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, avasthas: calculateAvasthas(k) });
});

/** POST /api/analysis/sudarshana — 3-ring Sudarshana Chakra + dasha */
router.post('/sudarshana', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, sudarshana: calculateSudarshana(k) });
});

/** POST /api/analysis/chalit — Bhava Chalit chart. Query ?method=placidus|sripati */
router.post('/chalit', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const m = (req.query.method || req.body?.method || 'placidus') as ChalitMethod;
  const method: ChalitMethod = m === 'sripati' ? 'sripati' : 'placidus';
  res.json({ ok: true, chalit: computeChalit(k, method) });
});

/** POST /api/analysis/life-areas — Medical, Career, Progeny, Wealth focused reports */
router.post('/life-areas', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, lifeAreas: analyzeLifeAreas(k) });
});

/** POST /api/analysis/sensitive-points — Fortune, Spirit, Bhrigu Bindu, Vertex, pre-natal eclipses */
router.post('/sensitive-points', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, sensitivePoints: computeSensitivePoints(k) });
});

/** POST /api/analysis/upagrahas — Gulika, Mandi + Dhuma/Vyatipata/Parivesha/Indrachapa/Upaketu */
router.post('/upagrahas', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, upagrahas: computeUpagrahas(k) });
});

/** GET  /api/analysis/vimsopaka/schemes — list available schemes */
router.get('/vimsopaka/schemes', (_req, res) => {
  const schemes = Object.values(VIMSOPAKA_SCHEMES).map((s) => ({
    key: s.key, name: s.name, nameHi: s.nameHi, purpose: s.purpose,
    vargas: Object.keys(s.weights),
  }));
  res.json({ ok: true, schemes });
});

/** POST /api/analysis/vimsopaka — 20-point weighted divisional strength */
router.post('/vimsopaka', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const schemeParam = (req.query.scheme || req.body?.scheme || 'shodasha') as VimsopakaScheme;
  const scheme: VimsopakaScheme = (['shad', 'sapta', 'dasha', 'shodasha'] as VimsopakaScheme[]).includes(schemeParam)
    ? schemeParam : 'shodasha';
  res.json({ ok: true, vimsopaka: computeVimsopaka(k, scheme) });
});

/** POST /api/analysis/gochara — classical gochar phala from natal Moon with Vedha */
router.post('/gochara', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const when = req.body?.when || req.query.when;
  res.json({ ok: true, gochara: computeGochara(k, typeof when === 'string' ? when : undefined) });
});

/** POST /api/analysis/dasha-sandhi — junction windows at MD/AD transitions */
router.post('/dasha-sandhi', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const from = req.body?.from || new Date().toISOString();
  const toDate = new Date(from); toDate.setFullYear(toDate.getFullYear() + 10);
  const to = req.body?.to || toDate.toISOString();
  const margin = typeof req.body?.marginPct === 'number' ? req.body.marginPct : 0.05;
  res.json({ ok: true, sandhi: computeDashaSandhi(k, from, to, margin) });
});

/** POST /api/analysis/ashtakavarga-transit — BAV + SAV-weighted transit strength snapshot */
router.post('/ashtakavarga-transit', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const when = req.body?.when || req.query.when;
  res.json({ ok: true, ashtakavargaTransit: computeAshtakavargaTransit(k, typeof when === 'string' ? when : undefined) });
});

/** POST /api/analysis/double-transit — K.N. Rao's Jupiter+Saturn double-transit scanner */
router.post('/double-transit', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const from = req.body?.from || new Date().toISOString();
  const toDate = new Date(from); toDate.setFullYear(toDate.getFullYear() + 3);
  const to = req.body?.to || toDate.toISOString();
  const stepDays = typeof req.body?.stepDays === 'number' ? req.body.stepDays : 7;
  res.json({ ok: true, doubleTransit: computeDoubleTransit(k, from, to, stepDays) });
});

/** POST /api/analysis/remedies — classical upayas + chart-specific suggestions */
router.post('/remedies', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, remedies: computeRemedies(k, req.locale) });
});

/** POST /api/analysis/ishta-kashta — desirable/undesirable phala per planet (BPHS ch. 38) */
router.post('/ishta-kashta', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, ishtaKashta: computeIshtaKashta(k) });
});

/** POST /api/analysis/lal-kitab — Teva + Karzas (6 debts) + remedies */
router.post('/lal-kitab', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, lalKitab: calculateLalKitab(k, req.locale) });
});

/** POST /api/analysis/nadi — Nadi amsa positions, Deha/Jeeva, per-bhava phala */
router.post('/nadi', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, nadi: calculateNadi(k) });
});

/** POST /api/analysis/tajika — Tajika yogas (Itthasala, Ishraaf, Muthashila, Nakta, Yamaya) */
router.post('/tajika', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, tajika: computeTajikaYogas(k) });
});

/** POST /api/analysis/sphutas — classical sphuta table (Pranapada, Beeja, Kshetra, Ayur, etc.) */
router.post('/sphutas', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, sphutas: calculateSphutas(k) });
});

// ─── Phase 10 — Predictive precision ───────────────────────────────────────

/** POST /api/analysis/sade-sati — 7.5yr Sade Sati timeline + kakshyas */
router.post('/sade-sati', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const when = typeof req.body?.when === 'string' ? req.body.when : undefined;
  res.json({ ok: true, sadeSati: computeSadeSati(k, when) });
});

/** POST /api/analysis/returns — Saturn / Jupiter / Solar / Lunar / Rahu returns */
router.post('/returns', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const when = typeof req.body?.when === 'string' ? req.body.when : undefined;
  res.json({ ok: true, returns: computeReturns(k, when) });
});

/** POST /api/analysis/progressions — secondary progressions (1 day = 1 year) */
router.post('/progressions', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const age = typeof req.body?.age === 'number' ? req.body.age : undefined;
  res.json({ ok: true, progressions: computeProgressions(k, age) });
});

/** POST /api/analysis/graha-yuddha — planetary war scanner */
router.post('/graha-yuddha', (req, res) => {
  const when = typeof req.body?.when === 'string' ? req.body.when : undefined;
  const years = typeof req.body?.windowYears === 'number' ? req.body.windowYears : 2;
  res.json({ ok: true, grahaYuddha: computeGrahaYuddha(when, years) });
});

/** POST /api/analysis/combustion — combust windows per planet */
router.post('/combustion', (req, res) => {
  const when = typeof req.body?.when === 'string' ? req.body.when : undefined;
  const years = typeof req.body?.windowYears === 'number' ? req.body.windowYears : 2;
  res.json({ ok: true, combustion: computeCombustion(when, years) });
});

/** POST /api/analysis/retro-shadow — retrograde shadow cycles */
router.post('/retro-shadow', (req, res) => {
  const when = typeof req.body?.when === 'string' ? req.body.when : undefined;
  const years = typeof req.body?.windowYears === 'number' ? req.body.windowYears : 2;
  res.json({ ok: true, retroShadow: computeRetroShadow(when, years) });
});

/** POST /api/analysis/kaksha-bala — natal kaksha-bala per planet */
router.post('/kaksha-bala', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({ ok: true, kakshaBala: computeKakshaBala(k) });
});

/** POST /api/analysis/predictive — Phase 10 bundle in one request */
router.post('/predictive', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  const when = typeof req.body?.when === 'string' ? req.body.when : undefined;
  const windowYears = typeof req.body?.windowYears === 'number' ? req.body.windowYears : 2;
  const age = typeof req.body?.age === 'number' ? req.body.age : undefined;
  res.json({
    ok: true,
    predictive: {
      sadeSati: computeSadeSati(k, when),
      returns: computeReturns(k, when),
      progressions: computeProgressions(k, age),
      grahaYuddha: computeGrahaYuddha(when, windowYears),
      combustion: computeCombustion(when, windowYears),
      retroShadow: computeRetroShadow(when, windowYears),
      kakshaBala: computeKakshaBala(k),
    },
  });
});

/** POST /api/analysis/full — kundali + yogas + doshas + shadbala + jaimini in one call */
router.post('/full', (req, res) => {
  const k = parseBirth(req);
  if (!k) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });
  res.json({
    ok: true,
    kundali: k,
    yogas: detectYogas(k, req.locale),
    doshas: checkAllDoshas(k, undefined, req.locale),
    shadbala: calculateShadbala(k),
    jaimini: calculateJaimini(k),
    kp: calculateKP(k),
    avasthas: calculateAvasthas(k),
    sudarshana: calculateSudarshana(k),
  });
});

export default router;
