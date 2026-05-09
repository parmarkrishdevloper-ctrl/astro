// Lal Kitab — "Red Book" system.
//
// Lal Kitab is a Punjabi/Hindi tradition that treats the natal chart with a
// fixed-Aries wheel (house 1 = Aries regardless of Lagna) and emphasizes
// karmic debts (rin/karza) and folk-style remedies (upaya) rather than
// strength or dasha timing. Its house labels and remedies are distinctive.
//
// We expose:
//   • Teva — Lal Kitab's 12-house wheel (sign = house number; planets placed
//     by natal sign, not by natal house — this is what makes Lal Kitab unique).
//   • Pakka Ghar — each planet's "permanent house" (natural rulership slot).
//   • Karzas — the six classical debts (Pitri, Matri, Stree, Santan, Atma,
//     Brathru), detected by planet positions.
//   • Remedies — classical upayas per planet (kept chart-specific by keying
//     each remedy to the planet that's been diagnosed as afflicted).
//
// References: Pt. Roop Chand Joshi's Lal Kitab (1941/1952 editions), Arun
// Sanhita (computational appendix).

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { Locale, p, pf, tPlanet } from '../i18n';

// ─── Teva: fixed 12-house wheel (house N = sign N) ───────────────────────────
//
// Unlike Parashari (where house 1 = Lagna sign), in Lal Kitab house 1 is
// always Aries, house 2 Taurus, etc. Planets sit in the house that matches
// their natal sign number, regardless of the true Lagna.

export interface LalKitabHouse {
  house: number;                // 1..12 (also the sign number in Lal Kitab)
  signName: string;
  pakkaGhar: PlanetId | null;   // planet whose "permanent house" is this
  planets: PlanetId[];          // planets currently occupying this house
}

/** Each planet's pakka ghar (permanent/own house) in Lal Kitab. */
const PAKKA_GHAR: Record<PlanetId, number> = {
  SU: 1,   // Sun in house 1 = Aries
  MO: 4,   // Moon in house 4 = Cancer
  MA: 3,   // Mars in house 3 = Gemini (Mars is the "brother" — 3rd house)
  ME: 7,   // Mercury in house 7 = Libra
  JU: 2,   // Jupiter in house 2 (Taurus/second) and 5/9/12
  VE: 7,   // Venus in house 7 = Libra
  SA: 10,  // Saturn in house 10 = Capricorn
  RA: 12,  // Rahu in house 12
  KE: 6,   // Ketu in house 6
};

export function buildTeva(k: KundaliResult): LalKitabHouse[] {
  const wheel: LalKitabHouse[] = [];
  for (let h = 1; h <= 12; h++) {
    const pakka = (Object.keys(PAKKA_GHAR) as PlanetId[]).find(
      (p) => PAKKA_GHAR[p] === h,
    ) ?? null;
    wheel.push({
      house: h,
      signName: RASHIS[h - 1].name,
      pakkaGhar: pakka,
      planets: [],
    });
  }
  // Place each planet in the house that equals its natal sign number.
  for (const p of k.planets) {
    wheel[p.rashi.num - 1].planets.push(p.id);
  }
  return wheel;
}

// ─── Pitri / Matri / Stree / Santan / Atma / Brathru Rin (debts) ─────────────
//
// Classical Lal Kitab rin detections. These are "karmic debts" inherited from
// ancestors — each is diagnosed by a specific planetary signature. Our
// implementation follows the most common textbook rules (Roop Chand Joshi's
// original table).
//
//   Pitri Rin   — debt of the father:   Sun afflicted by Rahu/Ketu/Saturn
//                                       in 1/2/5/7/9/12
//   Matri Rin   — debt of the mother:   Moon afflicted by Rahu/Ketu/Saturn
//                                       in 4/9 or with Ketu
//   Stree Rin   — debt to female:       Venus with Rahu/Ketu/Saturn
//                                       or in the 7th with malefics
//   Santan Rin  — debt to children:     Jupiter with Rahu/Ketu/Saturn in 5
//   Atma Rin    — debt to self:         Ketu in Lagna or Sun+Ketu
//   Brathru Rin — debt to siblings:     Mars with Rahu/Ketu/Saturn in 3
//
// Detection is boolean; a "yes" also surfaces the specific condition matched.

type KarzaKey =
  | 'pitri' | 'matri' | 'stree' | 'santan' | 'atma' | 'brathru';

export interface Karza {
  key: KarzaKey;
  name: string;
  present: boolean;
  reason: string;
}

const MALEFICS: PlanetId[] = ['SA', 'RA', 'KE'];

function signOf(k: KundaliResult, id: PlanetId): number {
  return k.planets.find((p) => p.id === id)?.rashi.num ?? 0;
}

function isWith(k: KundaliResult, a: PlanetId, b: PlanetId): boolean {
  return signOf(k, a) === signOf(k, b) && signOf(k, a) !== 0;
}

function houseOfPlanet(k: KundaliResult, id: PlanetId): number {
  return k.planets.find((p) => p.id === id)?.house ?? 0;
}

export function detectKarzas(k: KundaliResult, locale: Locale = 'en'): Karza[] {
  // Helper: format a list of malefic planet codes (RA/SA/KE) into the active
  // locale's planet names so the embedded reason text reads naturally.
  const fmtMalefics = (ms: PlanetId[]) => ms.map((id) => tPlanet(locale, id)).join(', ');

  const out: Karza[] = [];

  // Pitri
  const sunHouse = houseOfPlanet(k, 'SU');
  const sunAfflictedBy = MALEFICS.filter((m) => isWith(k, 'SU', m));
  const sunInPitriHouse = [1, 2, 5, 7, 9, 12].includes(sunHouse);
  const pitriPresent = sunAfflictedBy.length > 0 && sunInPitriHouse;
  out.push({
    key: 'pitri',
    name: p('lalkitab.karza.pitri.name', locale, 'Pitri Rin (debt of father)'),
    present: pitriPresent,
    reason: pitriPresent
      ? pf('lalkitab.karza.pitri.reason.afflicted', locale, { h: sunHouse, malefics: fmtMalefics(sunAfflictedBy) }, `Sun in H${sunHouse} conjunct ${sunAfflictedBy.join(', ')}`)
      : p('lalkitab.karza.pitri.reason.clear', locale, 'Sun unafflicted in relevant houses'),
  });

  // Matri
  const moonHouse = houseOfPlanet(k, 'MO');
  const moonAfflictedBy = MALEFICS.filter((m) => isWith(k, 'MO', m));
  const moonInMatriHouse = [4, 9].includes(moonHouse) || isWith(k, 'MO', 'KE');
  const matriPresent = moonAfflictedBy.length > 0 && moonInMatriHouse;
  out.push({
    key: 'matri',
    name: p('lalkitab.karza.matri.name', locale, 'Matri Rin (debt of mother)'),
    present: matriPresent,
    reason: matriPresent
      ? pf('lalkitab.karza.matri.reason.afflicted', locale, { h: moonHouse, malefics: fmtMalefics(moonAfflictedBy) }, `Moon in H${moonHouse} conjunct ${moonAfflictedBy.join(', ')}`)
      : p('lalkitab.karza.matri.reason.clear', locale, 'Moon unafflicted in relevant houses'),
  });

  // Stree
  const venusHouse = houseOfPlanet(k, 'VE');
  const venusAfflictedBy = MALEFICS.filter((m) => isWith(k, 'VE', m));
  const venusIn7 = venusHouse === 7;
  const streePresent = venusAfflictedBy.length > 0 || (venusIn7 && MALEFICS.some((m) => houseOfPlanet(k, m) === 7));
  out.push({
    key: 'stree',
    name: p('lalkitab.karza.stree.name', locale, 'Stree Rin (debt to female)'),
    present: streePresent,
    reason: venusAfflictedBy.length > 0
      ? pf('lalkitab.karza.stree.reason.conjunct', locale, { malefics: fmtMalefics(venusAfflictedBy) }, `Venus conjunct ${venusAfflictedBy.join(', ')}`)
      : venusIn7
        ? p('lalkitab.karza.stree.reason.in7', locale, 'Venus in 7th with malefics')
        : p('lalkitab.karza.stree.reason.clear', locale, 'Venus free'),
  });

  // Santan
  const jupHouse = houseOfPlanet(k, 'JU');
  const jupAfflictedBy = MALEFICS.filter((m) => isWith(k, 'JU', m));
  const jupIn5 = jupHouse === 5;
  const santanPresent = jupIn5 && jupAfflictedBy.length > 0;
  out.push({
    key: 'santan',
    name: p('lalkitab.karza.santan.name', locale, 'Santan Rin (debt to children)'),
    present: santanPresent,
    reason: santanPresent
      ? pf('lalkitab.karza.santan.reason.afflicted', locale, { malefics: fmtMalefics(jupAfflictedBy) }, `Jupiter in 5th conjunct ${jupAfflictedBy.join(', ')}`)
      : p('lalkitab.karza.santan.reason.clear', locale, 'Jupiter free in 5th context'),
  });

  // Atma
  const keHouse = houseOfPlanet(k, 'KE');
  const atma = keHouse === 1 || isWith(k, 'SU', 'KE');
  out.push({
    key: 'atma',
    name: p('lalkitab.karza.atma.name', locale, 'Atma Rin (debt of self)'),
    present: atma,
    reason: keHouse === 1
      ? p('lalkitab.karza.atma.reason.ke1', locale, 'Ketu in Lagna')
      : isWith(k, 'SU', 'KE')
        ? p('lalkitab.karza.atma.reason.suke', locale, 'Sun conjunct Ketu')
        : p('lalkitab.karza.atma.reason.clear', locale, 'no signature'),
  });

  // Brathru
  const marsHouse = houseOfPlanet(k, 'MA');
  const marsAfflictedBy = MALEFICS.filter((m) => m !== 'SA' && isWith(k, 'MA', m)); // Mars with Rahu/Ketu
  const marsIn3 = marsHouse === 3;
  const brathruPresent = marsIn3 && marsAfflictedBy.length > 0;
  out.push({
    key: 'brathru',
    name: p('lalkitab.karza.brathru.name', locale, 'Brathru Rin (debt to siblings)'),
    present: brathruPresent,
    reason: brathruPresent
      ? pf('lalkitab.karza.brathru.reason.afflicted', locale, { malefics: fmtMalefics(marsAfflictedBy) }, `Mars in 3rd conjunct ${marsAfflictedBy.join(', ')}`)
      : p('lalkitab.karza.brathru.reason.clear', locale, 'Mars free in 3rd context'),
  });

  return out;
}

// ─── Lal Kitab Remedies ─────────────────────────────────────────────────────
//
// A chart-specific upaya list: for each karza that's present, surface the
// classical remedy. Also, for any malefic in house 1/4/7/10 (angular
// Lal-Kitab afflictions), surface the planet-specific upaya.

export interface LalKitabRemedy {
  planet: PlanetId;
  scope: 'karza' | 'angular' | 'universal';
  title: string;
  action: string;
  timing: string;
}

/** Look up a single planet's remedy line in the active locale. Falls back to
 *  the English text when the phrasebook hasn't been seeded for that locale. */
function planetRemedy(locale: Locale, planet: PlanetId): { title: string; action: string; timing: string } {
  const fb = PLANET_REMEDIES_EN[planet];
  return {
    title:  p(`lalkitab.remedy.${planet}.title`,  locale, fb.title),
    action: p(`lalkitab.remedy.${planet}.action`, locale, fb.action),
    timing: p(`lalkitab.remedy.${planet}.timing`, locale, fb.timing),
  };
}

// English fallbacks — used when the phrasebook has no entry for a locale.
const PLANET_REMEDIES_EN: Record<PlanetId, { title: string; action: string; timing: string }> = {
  SU: { title: 'Sun — honour father',        action: 'Offer water to rising Sun; avoid copper gifts from elders',   timing: 'Every Sunday morning' },
  MO: { title: 'Moon — honour mother',       action: 'Carry silver in pocket; offer milk to silver idol',           timing: 'Every Monday' },
  MA: { title: 'Mars — pacify aggression',   action: 'Donate sweet red items to temple; avoid blood sport',         timing: 'Every Tuesday' },
  ME: { title: 'Mercury — cleanse speech',   action: 'Feed green fodder to cows; avoid lying',                      timing: 'Every Wednesday' },
  JU: { title: 'Jupiter — respect elders',   action: 'Donate turmeric/gram/yellow cloth to temple Brahmin',         timing: 'Every Thursday' },
  VE: { title: 'Venus — respect women',      action: 'Donate white items (rice/curd/silver) to widow or temple',    timing: 'Every Friday' },
  SA: { title: 'Saturn — serve the weak',    action: 'Feed mustard oil/black sesame to crows; help labourers',      timing: 'Every Saturday' },
  RA: { title: 'Rahu — purify mind',         action: 'Flow 400g coal in flowing water; avoid blue clothes',         timing: 'Every Saturday' },
  KE: { title: 'Ketu — support dogs/strays', action: 'Feed dogs; donate black-and-white blanket',                   timing: 'Every Saturday' },
};

export function computeRemedies(k: KundaliResult, karzas: Karza[], locale: Locale = 'en'): LalKitabRemedy[] {
  const out: LalKitabRemedy[] = [];

  const karzaMap: Partial<Record<KarzaKey, PlanetId>> = {
    pitri: 'SU', matri: 'MO', stree: 'VE', santan: 'JU', atma: 'KE', brathru: 'MA',
  };
  for (const k2 of karzas) {
    if (!k2.present) continue;
    const planet = karzaMap[k2.key];
    if (!planet) continue;
    const r = planetRemedy(locale, planet);
    // Compose: "<karza name> — <remedy title>". Both halves are already
    // in the active locale via p() above and detectKarzas().
    out.push({
      planet,
      scope: 'karza',
      title: `${k2.name} — ${r.title}`,
      action: r.action,
      timing: r.timing,
    });
  }

  // Malefics in angular houses → angular upaya.
  for (const mal of MALEFICS) {
    const h = houseOfPlanet(k, mal);
    if ([1, 4, 7, 10].includes(h)) {
      const r = planetRemedy(locale, mal);
      out.push({
        planet: mal,
        scope: 'angular',
        title: pf('lalkitab.angular.title', locale, { planet: tPlanet(locale, mal), h }, `${mal} in angular house ${h}`),
        action: r.action,
        timing: r.timing,
      });
    }
  }

  return out;
}

// ─── Aggregate ───────────────────────────────────────────────────────────────

export interface LalKitabResult {
  teva: LalKitabHouse[];
  karzas: Karza[];
  remedies: LalKitabRemedy[];
  /** Planets currently sitting in their pakka ghar — highly auspicious in LK. */
  pakkaGharActive: { planet: PlanetId; house: number }[];
}

export function calculateLalKitab(k: KundaliResult, locale: Locale = 'en'): LalKitabResult {
  const teva = buildTeva(k);
  const karzas = detectKarzas(k, locale);
  const remedies = computeRemedies(k, karzas, locale);
  const pakkaGharActive = (Object.keys(PAKKA_GHAR) as PlanetId[])
    .filter((pl) => signOf(k, pl) === PAKKA_GHAR[pl])
    .map((pl) => ({ planet: pl, house: PAKKA_GHAR[pl] }));
  return { teva, karzas, remedies, pakkaGharActive };
}
