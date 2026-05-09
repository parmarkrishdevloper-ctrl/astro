import { RASHIS, nakshatraOf, PlanetId, NAKSHATRAS } from '../utils/astro-constants';
import {
  RASHI_VARNA, VARNA_RANK, RASHI_VASHYA, VASHYA_POINTS,
  NAK_YONI, yoniPoints, NAK_GANA, ganaPoints, NAK_NADI, grahaMaitriPoints,
} from '../utils/match-tables';
import { calculateKundali, BirthInput, KundaliResult } from './kundali.service';
import { translator, p, pf, type Locale } from '../i18n';

// ─── TYPES ─────────────────────────────────────────────────────────────────

export type KootKey =
  | 'Varna' | 'Vashya' | 'Tara' | 'Yoni'
  | 'Graha Maitri' | 'Gana' | 'Bhakoot' | 'Nadi';

export interface KootScore {
  /** Localised display name. */
  name: string;
  /** Stable English key for closed-enum lookup on the client. */
  kootKey: KootKey;
  obtained: number;
  max: number;
  detail: string;
  description: string; // what this koot represents (for the report)
}

export interface ManglikSide {
  isManglik: boolean;
  marsHouse: number;
  /** English rashi name (client maps via `al.rashiByName`). */
  marsRashi: string;
  /** Rules that cancel Mangal dosha for this chart — already localised. */
  cancellations: string[];
  netManglik: boolean; // after cancellations
}

export interface ExtraDosha {
  /** Stable English key — client uses `al.extraDosha(name)` to localise. */
  name: string;
  /** Localised display name. */
  nameLabel: string;
  present: boolean;
  /** Localised note. */
  note: string;
}

export interface PersonProfile {
  /**
   * English rashi name. Client should map via `al.rashiByName(rashi)` —
   * `rashiNum` is also emitted so `al.rashi(num)` works directly.
   */
  rashi: string;
  rashiNum: number;
  rashiLord: PlanetId;
  /** English nakshatra name; use `nakNum` with `al.nakshatra(num)`. */
  nakshatra: string;
  nakNum: number;
  nakLord: PlanetId;
  pada: number;
  /** Localised varna. */
  varna: string;
  /** Localised vashya. */
  vashya: string;
  /** Localised yoni. */
  yoni: string;
  /** Localised gana. */
  gana: string;
  /** Localised nadi. */
  nadi: string;
  /** Planet id for the running mahadasha — client uses `al.planet(id)`. */
  currentDasha: PlanetId;
  /** English ascendant rashi name; client uses `al.rashiByName`. */
  ascendantRashi: string;
  moonLongitude: number;     // sidereal, for display
  marsHouse: number;
}

export interface MatchingResult {
  boy: PersonProfile;
  girl: PersonProfile;
  koots: KootScore[];
  total: { obtained: number; max: number; percentage: number };
  /** Localised verdict prose. */
  verdict: string;
  verdictTone: 'excellent' | 'good' | 'acceptable' | 'poor';

  // Manglik (Mars) dosha
  manglik: {
    boy: ManglikSide;
    girl: ManglikSide;
    compatible: boolean;
    /** Localised note. */
    note: string;
  };

  // Nadi & Bhakoot with cancellation checks
  nadiDosha: { present: boolean; cancelled: boolean; reasons: string[]; netDosha: boolean };
  bhakootDosha: { present: boolean; cancelled: boolean; reasons: string[]; netDosha: boolean };

  // Additional classical checks
  extras: ExtraDosha[];

  // Summary counsel — already localised.
  recommendations: string[];
}

// ─── MOON / PERSON PROFILE ─────────────────────────────────────────────────

function profile(k: KundaliResult, currentDasha: PlanetId, locale: Locale): PersonProfile {
  const t = translator(locale);
  const moon = k.planets.find((pl) => pl.id === 'MO')!;
  const nak = nakshatraOf(moon.longitude);
  const mars = k.planets.find((pl) => pl.id === 'MA')!;
  return {
    rashi: moon.rashi.name,
    rashiNum: moon.rashi.num,
    rashiLord: RASHIS[moon.rashi.num - 1].lord,
    nakshatra: nak.name,
    nakNum: nak.num,
    nakLord: NAKSHATRAS[nak.num - 1].lord,
    pada: nak.pada,
    varna: t.varna(RASHI_VARNA[moon.rashi.num]),
    vashya: t.vashya(RASHI_VASHYA[moon.rashi.num]),
    yoni: t.yoni(NAK_YONI[nak.num]),
    gana: t.gana(NAK_GANA[nak.num]),
    nadi: t.nadi(NAK_NADI[nak.num]),
    currentDasha,
    ascendantRashi: k.ascendant.rashi.name,
    moonLongitude: moon.longitude,
    marsHouse: mars.house,
  };
}

// ─── KOOT COMPUTATIONS WITH DESCRIPTIONS ───────────────────────────────────

const KOOT_DESC_KEY: Record<KootKey, string> = {
  Varna:          'matching.koot.varna.description',
  Vashya:         'matching.koot.vashya.description',
  Tara:           'matching.koot.tara.description',
  Yoni:           'matching.koot.yoni.description',
  'Graha Maitri': 'matching.koot.maitri.description',
  Gana:           'matching.koot.gana.description',
  Bhakoot:        'matching.koot.bhakoot.description',
  Nadi:           'matching.koot.nadi.description',
};

function makeKoot(
  key: KootKey,
  obtained: number,
  max: number,
  detail: string,
  locale: Locale,
): KootScore {
  const t = translator(locale);
  return {
    name: t.kootName(key),
    kootKey: key,
    obtained, max, detail,
    description: p(KOOT_DESC_KEY[key], locale),
  };
}

function varnaKoot(a: number, b: number, locale: Locale): KootScore {
  const t = translator(locale);
  const bv = RASHI_VARNA[a], gv = RASHI_VARNA[b];
  const ok = VARNA_RANK[bv] >= VARNA_RANK[gv];
  const warn = ok ? '' : p('matching.koot.varna.warnLow', locale);
  const detail = pf('matching.koot.varna.detail', locale,
    { boy: t.varna(bv), girl: t.varna(gv), warn });
  return makeKoot('Varna', ok ? 1 : 0, 1, detail, locale);
}
function vashyaKoot(a: number, b: number, locale: Locale): KootScore {
  const t = translator(locale);
  const av = RASHI_VASHYA[a], bv = RASHI_VASHYA[b];
  const detail = pf('matching.koot.vashya.detail', locale,
    { boy: t.vashya(av), girl: t.vashya(bv) });
  return makeKoot('Vashya', VASHYA_POINTS[av][bv], 2, detail, locale);
}
function taraKoot(bn: number, gn: number, locale: Locale): KootScore {
  function dir(from: number, to: number) {
    const count = ((to - from + 27) % 27) + 1;
    const rem = count % 9;
    return [3, 5, 7].includes(rem) ? 0 : 1.5;
  }
  const got = dir(bn, gn) + dir(gn, bn);
  const detail = p('matching.koot.tara.detail', locale);
  return makeKoot('Tara', got, 3, detail, locale);
}
function yoniKoot(bn: number, gn: number, locale: Locale): KootScore {
  const t = translator(locale);
  const a = NAK_YONI[bn], b = NAK_YONI[gn];
  const detail = pf('matching.koot.yoni.detail', locale,
    { boy: t.yoni(a), girl: t.yoni(b) });
  return makeKoot('Yoni', yoniPoints(a, b), 4, detail, locale);
}
function grahaMaitriKoot(bl: PlanetId, gl: PlanetId, locale: Locale): KootScore {
  // Planet IDs are stable cross-locale tokens — client renders via al.planet().
  const detail = pf('matching.koot.maitri.detail', locale, { boy: bl, girl: gl });
  return makeKoot('Graha Maitri', grahaMaitriPoints(bl, gl), 5, detail, locale);
}
function ganaKoot(bn: number, gn: number, locale: Locale): KootScore {
  const t = translator(locale);
  const a = NAK_GANA[bn], b = NAK_GANA[gn];
  const detail = pf('matching.koot.gana.detail', locale,
    { boy: t.gana(a), girl: t.gana(b) });
  return makeKoot('Gana', ganaPoints(a, b), 6, detail, locale);
}
function bhakootKoot(a: number, b: number, locale: Locale): KootScore {
  const f = ((b - a + 12) % 12) + 1;
  const bk = ((a - b + 12) % 12) + 1;
  const bad =
    (f === 6 && bk === 8) || (f === 8 && bk === 6) ||
    (f === 9 && bk === 5) || (f === 5 && bk === 9) ||
    (f === 12 && bk === 2) || (f === 2 && bk === 12);
  const flag = p(bad ? 'matching.koot.bhakoot.dosha' : 'matching.koot.bhakoot.ok', locale);
  const detail = pf('matching.koot.bhakoot.detail', locale, { f, b: bk, flag });
  return makeKoot('Bhakoot', bad ? 0 : 7, 7, detail, locale);
}
function nadiKoot(bn: number, gn: number, locale: Locale): KootScore {
  const t = translator(locale);
  const a = NAK_NADI[bn], b = NAK_NADI[gn];
  const same = a === b;
  const flag = same ? p('matching.koot.nadi.dosha', locale) : '';
  const detail = pf('matching.koot.nadi.detail', locale,
    { boy: t.nadi(a), girl: t.nadi(b), flag });
  return makeKoot('Nadi', same ? 0 : 8, 8, detail, locale);
}

// ─── MANGAL (MARS) DOSHA ──────────────────────────────────────────────────

const MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12];

function analyseManglik(k: KundaliResult, locale: Locale): ManglikSide {
  const mars = k.planets.find((pl) => pl.id === 'MA')!;
  const asc = k.ascendant;
  const isManglik = MANGLIK_HOUSES.includes(mars.house);

  const cancellations: string[] = [];
  if (!isManglik) {
    return { isManglik: false, marsHouse: mars.house, marsRashi: mars.rashi.name,
      cancellations: [], netManglik: false };
  }

  // Classical cancellations
  if (mars.rashi.num === 1 /* Aries — own */ && mars.house === 1) {
    cancellations.push(p('matching.cancellation.marsAriesIn1', locale));
  }
  if (mars.rashi.num === 8 /* Scorpio — own */ && mars.house === 4) {
    cancellations.push(p('matching.cancellation.marsScorpioIn4', locale));
  }
  if (mars.rashi.num === 10 /* Capricorn — exalted */) {
    cancellations.push(p('matching.cancellation.marsExalted', locale));
  }
  if (mars.house === 2 && [3, 6].includes(mars.rashi.num)) {
    cancellations.push(p('matching.cancellation.marsIn2InGeminiVirgo', locale));
  }
  if (mars.house === 12 && [2, 7].includes(mars.rashi.num)) {
    cancellations.push(p('matching.cancellation.marsIn12InTaurusLibra', locale));
  }
  if (mars.house === 4 && [1, 8].includes(mars.rashi.num)) {
    cancellations.push(p('matching.cancellation.marsIn4InAriesScorpio', locale));
  }
  if (mars.house === 7 && [4, 5].includes(mars.rashi.num)) {
    cancellations.push(p('matching.cancellation.marsIn7InCancerLeo', locale));
  }
  if (mars.house === 8 && [9, 12].includes(mars.rashi.num)) {
    cancellations.push(p('matching.cancellation.marsIn8InSagPisces', locale));
  }

  // Mars aspected or conjunct Jupiter or Moon → mitigation
  const jup = k.planets.find((pl) => pl.id === 'JU');
  if (jup && Math.abs(jup.longitude - mars.longitude) < 10) {
    cancellations.push(p('matching.cancellation.jupiterConjunctMars', locale));
  }
  const moon = k.planets.find((pl) => pl.id === 'MO');
  if (moon && Math.abs(moon.longitude - mars.longitude) < 12) {
    cancellations.push(p('matching.cancellation.moonConjunctMars', locale));
  }
  // Saturn same house as Mars
  const sat = k.planets.find((pl) => pl.id === 'SA');
  if (sat && sat.house === mars.house) {
    cancellations.push(p('matching.cancellation.saturnWithMars', locale));
  }

  void asc;
  return {
    isManglik: true,
    marsHouse: mars.house,
    marsRashi: mars.rashi.name,
    cancellations,
    netManglik: cancellations.length === 0,
  };
}

// ─── NADI + BHAKOOT CANCELLATIONS ─────────────────────────────────────────

function checkNadiCancellation(bn: number, gn: number, bp: PersonProfile, gp: PersonProfile, locale: Locale):
  { cancelled: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (bp.rashi === gp.rashi) reasons.push(p('matching.cancellation.sameRashi', locale));
  if (bp.nakshatra === gp.nakshatra && bp.pada !== gp.pada) {
    reasons.push(p('matching.cancellation.sameNakshatra', locale));
  }
  if (bp.rashiLord === gp.rashiLord) reasons.push(p('matching.cancellation.sameRashiLordNadi', locale));
  void bn; void gn;
  return { cancelled: reasons.length > 0, reasons };
}

function checkBhakootCancellation(bp: PersonProfile, gp: PersonProfile, locale: Locale):
  { cancelled: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (bp.rashiLord === gp.rashiLord) {
    reasons.push(p('matching.cancellation.sameRashiLordBhakoot', locale));
  }
  if (bp.nakLord === gp.nakLord) {
    reasons.push(p('matching.cancellation.sameNakLord', locale));
  }
  // Mutual friendship of rashi lords cancels
  return { cancelled: reasons.length > 0, reasons };
}

// ─── EXTRA DOSHAS / CHECKS ────────────────────────────────────────────────

function rajjuDosha(bn: number, gn: number, locale: Locale): ExtraDosha {
  // Rajju classification by nakshatra: Paada, Katee, Nabhee, Kantha, Shira — 5-fold.
  const PAADA   = [1, 10, 19];
  const KATEE   = [2, 9, 11, 18, 20, 27];
  const NABHEE  = [3, 8, 12, 17, 21, 26];
  const KANTHA  = [4, 7, 13, 16, 22, 25];
  const SHIRA   = [5, 6, 14, 15, 23, 24];
  const group = (n: number) =>
    PAADA.includes(n) ? 'Paada' :
    KATEE.includes(n) ? 'Katee' :
    NABHEE.includes(n) ? 'Nabhee' :
    KANTHA.includes(n) ? 'Kantha' : 'Shira';
  const t = translator(locale);
  const a = group(bn); const b = group(gn);
  const same = a === b;
  return {
    name: 'Rajju Dosha',
    nameLabel: t.extraDosha('Rajju Dosha'),
    present: same,
    note: same
      ? pf('matching.extra.rajju.same', locale, { group: a })
      : pf('matching.extra.rajju.different', locale, { a, b }),
  };
}

function vedhaDosha(bn: number, gn: number, locale: Locale): ExtraDosha {
  // Classical incompatible pairs (Vedha). 14 pairs total.
  const PAIRS: [number, number][] = [
    [1, 18], [2, 17], [3, 16], [4, 15], [5, 23], [6, 22], [7, 21],
    [8, 20], [9, 19], [10, 27], [11, 26], [12, 25], [13, 24], [14, 27],
  ];
  const t = translator(locale);
  const hit = PAIRS.some(([x, y]) =>
    (bn === x && gn === y) || (bn === y && gn === x));
  return {
    name: 'Vedha Dosha',
    nameLabel: t.extraDosha('Vedha Dosha'),
    present: hit,
    note: hit ? p('matching.extra.vedha.present', locale) : p('matching.extra.vedha.none', locale),
  };
}

function mahendra(bn: number, gn: number, locale: Locale): ExtraDosha {
  // Favorable: count from boy to girl = 4, 7, 10, 13, 16, 19, 22, 25.
  const count = ((gn - bn + 27) % 27) + 1;
  const good = [4, 7, 10, 13, 16, 19, 22, 25].includes(count);
  const t = translator(locale);
  return {
    name: 'Mahendra',
    nameLabel: t.extraDosha('Mahendra'),
    present: good,   // "present" here means "auspicious present"
    note: good
      ? pf('matching.extra.mahendra.good', locale, { count })
      : pf('matching.extra.mahendra.neutral', locale, { count }),
  };
}

function striDheerga(bn: number, gn: number, locale: Locale): ExtraDosha {
  // Girl's nakshatra should be beyond 9 counts from boy's for auspicious longevity.
  const count = ((gn - bn + 27) % 27) + 1;
  const good = count >= 9;
  const t = translator(locale);
  return {
    name: 'Stri Dheerga',
    nameLabel: t.extraDosha('Stri Dheerga'),
    present: good,
    note: good
      ? pf('matching.extra.striDheerga.present', locale, { count })
      : pf('matching.extra.striDheerga.absent', locale, { count }),
  };
}

// ─── DASHA SNIPPET ────────────────────────────────────────────────────────

function currentMahadasha(k: KundaliResult, asOf = new Date()): PlanetId {
  const moon = k.planets.find((pl) => pl.id === 'MO')!;
  const nak = nakshatraOf(moon.longitude);
  const lord = NAKSHATRAS[nak.num - 1].lord;
  // Simplified: return birth-mahadasha lord; full engine already exists in dasha.service
  // but for a marriage report the current running lord is what matters.
  const VIMSHOTTARI_ORDER: PlanetId[] = ['KE','VE','SU','MO','MA','RA','JU','SA','ME'];
  const VIMSHOTTARI_YEARS: Record<PlanetId, number> = {
    KE: 7, VE: 20, SU: 6, MO: 10, MA: 7, RA: 18, JU: 16, SA: 19, ME: 17,
  };
  const birthIdx = VIMSHOTTARI_ORDER.indexOf(lord);
  // days from birth; fall back: use asOf - nakshatra-derived zero point
  const degInNak = nak.degInNak;
  const elapsed = (degInNak / (360 / 27)) * VIMSHOTTARI_YEARS[lord];
  const birthDate = new Date(k.utc);
  const yearsSinceBirth = (asOf.getTime() - birthDate.getTime()) / (365.25 * 86400 * 1000);
  let remaining = VIMSHOTTARI_YEARS[lord] - elapsed;
  let idx = birthIdx;
  let y = yearsSinceBirth;
  if (y < remaining) return lord;
  y -= remaining;
  for (let i = 1; i < 30; i++) {
    idx = (idx + 1) % 9;
    const nxt = VIMSHOTTARI_ORDER[idx];
    const span = VIMSHOTTARI_YEARS[nxt];
    if (y < span) return nxt;
    y -= span;
  }
  return lord;
}

// ─── PUBLIC ────────────────────────────────────────────────────────────────

export function matchKundalis(
  boy: BirthInput,
  girl: BirthInput,
  locale: Locale = 'en',
): MatchingResult {
  const bk = calculateKundali(boy);
  const gk = calculateKundali(girl);
  const asOf = new Date();
  const boyDasha = currentMahadasha(bk, asOf);
  const girlDasha = currentMahadasha(gk, asOf);
  const bp = profile(bk, boyDasha, locale);
  const gp = profile(gk, girlDasha, locale);

  const koots: KootScore[] = [
    varnaKoot(bp.rashiNum, gp.rashiNum, locale),
    vashyaKoot(bp.rashiNum, gp.rashiNum, locale),
    taraKoot(bp.nakNum, gp.nakNum, locale),
    yoniKoot(bp.nakNum, gp.nakNum, locale),
    grahaMaitriKoot(bp.rashiLord, gp.rashiLord, locale),
    ganaKoot(bp.nakNum, gp.nakNum, locale),
    bhakootKoot(bp.rashiNum, gp.rashiNum, locale),
    nadiKoot(bp.nakNum, gp.nakNum, locale),
  ];
  const obtained = koots.reduce((s, k) => s + k.obtained, 0);
  const max = koots.reduce((s, k) => s + k.max, 0);
  const percentage = Math.round((obtained / max) * 100);

  let verdictTone: MatchingResult['verdictTone'] = 'poor';
  if (obtained >= 32) verdictTone = 'excellent';
  else if (obtained >= 24) verdictTone = 'good';
  else if (obtained >= 18) verdictTone = 'acceptable';
  const verdict = p(`matching.verdict.${verdictTone}`, locale);

  // Manglik analysis per side
  const boyMang = analyseManglik(bk, locale);
  const girlMang = analyseManglik(gk, locale);
  const bothAffected = boyMang.netManglik && girlMang.netManglik;
  const neitherAffected = !boyMang.netManglik && !girlMang.netManglik;
  const mangCompatible = bothAffected || neitherAffected;
  const manglikNote =
    mangCompatible
      ? (bothAffected ? p('matching.manglik.both', locale)
         : p('matching.manglik.none', locale))
      : (boyMang.netManglik
          ? p('matching.manglik.mismatchBoy', locale)
          : p('matching.manglik.mismatchGirl', locale));

  // Nadi cancellation
  const nadiKootRow = koots.find((k) => k.kootKey === 'Nadi')!;
  const nadiPresent = nadiKootRow.obtained === 0;
  const nadiCanc = checkNadiCancellation(bp.nakNum, gp.nakNum, bp, gp, locale);

  // Bhakoot cancellation
  const bhakootKootRow = koots.find((k) => k.kootKey === 'Bhakoot')!;
  const bhakootPresent = bhakootKootRow.obtained === 0;
  const bhakootCanc = checkBhakootCancellation(bp, gp, locale);

  // Extras
  const extras: ExtraDosha[] = [
    rajjuDosha(bp.nakNum, gp.nakNum, locale),
    vedhaDosha(bp.nakNum, gp.nakNum, locale),
    mahendra(bp.nakNum, gp.nakNum, locale),
    striDheerga(bp.nakNum, gp.nakNum, locale),
  ];

  // Counsel
  const rec: string[] = [];
  if (obtained < 18) rec.push(p('matching.recommendation.belowThreshold', locale));
  if (nadiPresent && !nadiCanc.cancelled) rec.push(p('matching.recommendation.cautionNadi', locale));
  if (bhakootPresent && !bhakootCanc.cancelled) rec.push(p('matching.recommendation.cautionBhakoot', locale));
  if (boyMang.netManglik !== girlMang.netManglik) rec.push(p('matching.recommendation.cautionMangal', locale));
  const vedha = extras.find((e) => e.name === 'Vedha Dosha');
  if (vedha?.present) rec.push(p('matching.recommendation.vedha', locale));
  const rajju = extras.find((e) => e.name === 'Rajju Dosha');
  if (rajju?.present) rec.push(p('matching.recommendation.rajju', locale));
  if (rec.length === 0) rec.push(p('matching.recommendation.proceed', locale));

  void NAKSHATRAS;

  return {
    boy: bp,
    girl: gp,
    koots,
    total: { obtained, max, percentage },
    verdict,
    verdictTone,
    manglik: {
      boy: boyMang,
      girl: girlMang,
      compatible: mangCompatible,
      note: manglikNote,
    },
    nadiDosha: {
      present: nadiPresent,
      cancelled: nadiCanc.cancelled,
      reasons: nadiCanc.reasons,
      netDosha: nadiPresent && !nadiCanc.cancelled,
    },
    bhakootDosha: {
      present: bhakootPresent,
      cancelled: bhakootCanc.cancelled,
      reasons: bhakootCanc.reasons,
      netDosha: bhakootPresent && !bhakootCanc.cancelled,
    },
    extras,
    recommendations: rec,
  };
}
