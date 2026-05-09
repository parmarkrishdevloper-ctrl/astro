import { Router } from 'express';
import { calculateKundali, BirthInput } from '../services/kundali.service';
import {
  computeVimshottari,
  computeMahadashas,
  computeAntardashas,
  computePratyantars,
  currentDasha,
  currentDashaDeep,
  subdivide,
  DashaPeriod,
  DashaLevel,
  DASHA_LEVELS,
} from '../services/dasha.service';
import {
  DASHA_SYSTEMS, DASHA_SYSTEM_KEYS, DashaSystemKey, computeDashaStart,
} from '../services/dasha-systems';

const router = Router();

function parseBirth(req: any): BirthInput | null {
  const b = req.body ?? {};
  if (!b.datetime || b.lat == null || b.lng == null) return null;
  return {
    datetime: b.datetime,
    tzOffsetHours: b.tzOffsetHours,
    lat: Number(b.lat),
    lng: Number(b.lng),
    placeName: b.placeName,
  };
}

/**
 * POST /api/dasha/vimshottari
 * Body: BirthInput + { expand?: boolean }
 * Returns 9 mahadashas; if expand=true, also nests antardashas.
 */
router.post('/vimshottari', (req, res) => {
  const birth = parseBirth(req);
  if (!birth) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });

  const kundali = calculateKundali(birth);
  const v = computeVimshottari(kundali);

  const expand = !!req.body.expand;
  const mahadashas = expand
    ? v.mahadashas.map((m) => ({ ...m, antardashas: computeAntardashas(m) }))
    : v.mahadashas;

  res.json({ ok: true, vimshottari: { ...v, mahadashas } });
});

/**
 * POST /api/dasha/current
 * Body: BirthInput + { atDate? ISO string }
 * Returns the active maha + antar + pratyantar at the given moment.
 */
router.post('/current', (req, res) => {
  const birth = parseBirth(req);
  if (!birth) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });

  const kundali = calculateKundali(birth);
  const at = req.body.atDate ? new Date(req.body.atDate) : new Date();
  const result = currentDasha(kundali, at);
  res.json({ ok: true, at: at.toISOString(), current: result });
});

/**
 * POST /api/dasha/expand
 * Body: BirthInput + { mahaIndex: number, antarIndex?: number }
 * Returns antardashas of mahaIndex; if antarIndex given, also pratyantars.
 */
router.post('/expand', (req, res) => {
  const birth = parseBirth(req);
  if (!birth) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });

  const kundali = calculateKundali(birth);
  const v = computeVimshottari(kundali);
  const mi = Number(req.body.mahaIndex ?? 0);
  const maha = v.mahadashas[mi];
  if (!maha) return res.status(404).json({ ok: false, error: 'mahaIndex out of range' });
  const antars = computeAntardashas(maha);

  if (req.body.antarIndex != null) {
    const ai = Number(req.body.antarIndex);
    const antar = antars[ai];
    if (!antar) return res.status(404).json({ ok: false, error: 'antarIndex out of range' });
    return res.json({ ok: true, maha, antar, pratyantars: computePratyantars(antar) });
  }
  res.json({ ok: true, maha, antardashas: antars });
});

function parseSystem(req: any): DashaSystemKey {
  const sys = (req.body?.system ?? 'vimshottari') as DashaSystemKey;
  if (!DASHA_SYSTEM_KEYS.includes(sys)) return 'vimshottari';
  return sys;
}

/**
 * GET /api/dasha/systems
 * List of available dasha systems with metadata.
 */
router.get('/systems', (_req, res) => {
  res.json({
    ok: true,
    systems: DASHA_SYSTEM_KEYS.map((k) => DASHA_SYSTEMS[k]),
  });
});

/**
 * POST /api/dasha/deep
 * Body: BirthInput + { atDate?: ISO, system?: 'vimshottari'|'yogini'|'ashtottari' }
 * Returns active period at all 6 levels of the chosen system.
 */
router.post('/deep', (req, res) => {
  const birth = parseBirth(req);
  if (!birth) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });

  const kundali = calculateKundali(birth);
  const at = req.body.atDate ? new Date(req.body.atDate) : new Date();
  const system = parseSystem(req);
  const snapshot = currentDashaDeep(kundali, at, system);
  const dashaStart = computeDashaStart(kundali, system);
  res.json({ ok: true, deep: snapshot, start: dashaStart, system: DASHA_SYSTEMS[system] });
});

/**
 * POST /api/dasha/subdivide
 * Body: BirthInput + { path: number[], system?: DashaSystemKey }
 * `path` is a zero-based index chain from root. Empty path returns mahadashas.
 * [0] returns antardashas of maha[0]. Up to 5 indices deep.
 */
router.post('/subdivide', (req, res) => {
  const birth = parseBirth(req);
  if (!birth) return res.status(400).json({ ok: false, error: 'datetime, lat, lng required' });

  const path: number[] = Array.isArray(req.body.path) ? req.body.path.map(Number) : [];
  if (path.length > 5) {
    return res.status(400).json({ ok: false, error: 'path depth must be ≤ 5 (maha..prana → deha)' });
  }

  const kundali = calculateKundali(birth);
  const system = parseSystem(req);
  const roots = computeMahadashas(kundali, system);

  if (path.length === 0) {
    return res.json({
      ok: true,
      level: 'maha' as DashaLevel,
      parent: null,
      children: roots,
      system,
    });
  }

  let parent: DashaPeriod | undefined = roots[path[0]];
  if (!parent) return res.status(404).json({ ok: false, error: `no maha at index ${path[0]}` });
  const ancestry: DashaPeriod[] = [parent];
  for (let i = 1; i < path.length; i++) {
    const children = subdivide(parent);
    const next = children[path[i]];
    if (!next) return res.status(404).json({ ok: false, error: `no child at depth ${i}, index ${path[i]}` });
    parent = next;
    ancestry.push(parent);
  }
  const children = subdivide(parent);
  res.json({
    ok: true,
    level: children[0]?.level ?? null,
    parent,
    ancestry,
    children,
    levels: DASHA_LEVELS,
    system,
  });
});

export default router;
