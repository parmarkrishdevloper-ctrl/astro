// Jaimini astrology calculations.
//
// Implements the 7-karaka Parashari scheme (Sun..Saturn, no nodes) which is
// what Parashara's Light and most modern panchanga software use by default.
// All karakas are determined purely by degree-within-sign (advancement) — the
// planet that has progressed furthest through its current sign is the
// Atmakaraka, etc.

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { KundaliResult, PlanetPosition } from './kundali.service';

export type KarakaKey =
  | 'AK'   // Atmakaraka
  | 'AmK'  // Amatyakaraka
  | 'BK'   // Bhratrikaraka
  | 'MK'   // Matrikaraka
  | 'PK'   // Putrakaraka
  | 'GK'   // Gnatikaraka
  | 'DK';  // Darakaraka

export interface KarakaAssignment {
  karaka: KarakaKey;
  fullName: string;
  planet: PlanetId;
  degInRashi: number;
  meaning: string;
}

const ORDER: { key: KarakaKey; full: string; meaning: string }[] = [
  { key: 'AK',  full: 'Atmakaraka',   meaning: 'Soul / self' },
  { key: 'AmK', full: 'Amatyakaraka', meaning: 'Career / minister' },
  { key: 'BK',  full: 'Bhratrikaraka', meaning: 'Siblings / co-borns' },
  { key: 'MK',  full: 'Matrikaraka',  meaning: 'Mother' },
  { key: 'PK',  full: 'Putrakaraka',  meaning: 'Children' },
  { key: 'GK',  full: 'Gnatikaraka',  meaning: 'Relatives / enemies' },
  { key: 'DK',  full: 'Darakaraka',   meaning: 'Spouse' },
];

/**
 * Compute the 7 Chara Karakas (Parashari scheme — Sun..Saturn).
 * Sorted by degree-within-sign descending; the planet with the highest
 * advancement is AK, the lowest is DK.
 */
export function calculateKarakas(k: KundaliResult): KarakaAssignment[] {
  const seven = k.planets.filter((p) =>
    (['SU','MO','MA','ME','JU','VE','SA'] as PlanetId[]).includes(p.id),
  );
  const sorted = [...seven].sort((a, b) => b.rashi.degInRashi - a.rashi.degInRashi);
  return sorted.map((p, i) => ({
    karaka: ORDER[i].key,
    fullName: ORDER[i].full,
    planet: p.id,
    degInRashi: p.rashi.degInRashi,
    meaning: ORDER[i].meaning,
  }));
}

// ─── Jaimini aspects ────────────────────────────────────────────────────────
//
// Jaimini sign-based aspect rules:
//   - Movable signs aspect Fixed signs (except the adjacent one).
//   - Fixed signs aspect Movable signs (except the adjacent one).
//   - Dual signs aspect other Dual signs.
// "Adjacent" means immediately next to the sign (the 2nd from it).
//
// We return a list of planet pairs that aspect each other based on the signs
// they occupy.

export interface JaiminiAspectGroup {
  group: 'movable-fixed' | 'dual';
  pairs: { a: PlanetId; b: PlanetId; aSign: number; bSign: number }[];
}

function quality(signNum: number): 'Movable' | 'Fixed' | 'Dual' {
  return RASHIS[signNum - 1].quality;
}

/** Movable→Fixed (and reverse), excluding the sign adjacent to it. */
function movableFixedAspects(signA: number, signB: number): boolean {
  const qa = quality(signA);
  const qb = quality(signB);
  if (qa === 'Dual' || qb === 'Dual') return false;
  if (qa === qb) return false; // Movable doesn't aspect Movable
  // Adjacent = sign immediately next (forward or back)
  const diff = ((signB - signA + 12) % 12);
  if (diff === 1 || diff === 11) return false;
  return true;
}

function dualAspects(signA: number, signB: number): boolean {
  return quality(signA) === 'Dual' && quality(signB) === 'Dual' && signA !== signB;
}

export function calculateJaiminiAspects(k: KundaliResult): JaiminiAspectGroup[] {
  const seven = k.planets.filter((p) =>
    (['SU','MO','MA','ME','JU','VE','SA','RA','KE'] as PlanetId[]).includes(p.id),
  );
  const movFixed: JaiminiAspectGroup['pairs'] = [];
  const dual: JaiminiAspectGroup['pairs'] = [];
  for (let i = 0; i < seven.length; i++) {
    for (let j = i + 1; j < seven.length; j++) {
      const a = seven[i];
      const b = seven[j];
      if (movableFixedAspects(a.rashi.num, b.rashi.num)) {
        movFixed.push({ a: a.id, b: b.id, aSign: a.rashi.num, bSign: b.rashi.num });
      }
      if (dualAspects(a.rashi.num, b.rashi.num)) {
        dual.push({ a: a.id, b: b.id, aSign: a.rashi.num, bSign: b.rashi.num });
      }
    }
  }
  return [
    { group: 'movable-fixed', pairs: movFixed },
    { group: 'dual',          pairs: dual    },
  ];
}

// ─── Special Lagnas ─────────────────────────────────────────────────────────
//
// Arudha (Pada) Lagna of a house = sign reached by counting forward from the
// house lord, the same number of signs that the lord is from the house. Two
// adjustments per BPHS:
//   - If the result is the same sign as the house, take the 10th from it.
//   - If the result is the 7th from the house, take the 4th from it.
//
// We compute A1 (Arudha Lagna), A2..A12 (Bhava Padas), and Upapada (UL = A12).
// Karakamsha = sign occupied by Atmakaraka in Navamsha (placeholder until D9
// service exposes it).

export interface SpecialLagnas {
  arudhaPadas: { house: number; signNum: number; signName: string }[];
  upapadaLagna: { signNum: number; signName: string };
  /** Sign of Atmakaraka in Navamsha — populated when D9 longitudes are passed. */
  karakamshaLagna?: { signNum: number; signName: string };
}

function signOfPlanet(k: KundaliResult, id: PlanetId): number {
  const p = k.planets.find((x) => x.id === id);
  return p ? p.rashi.num : 1;
}

function adjustArudha(houseSign: number, padaSign: number): number {
  // Pada in same sign as the house → take 10th from pada
  if (padaSign === houseSign) {
    return ((padaSign - 1 + 9) % 12) + 1;
  }
  // Pada in 7th from the house → take 4th from pada
  const seventhFromHouse = ((houseSign - 1 + 6) % 12) + 1;
  if (padaSign === seventhFromHouse) {
    return ((padaSign - 1 + 3) % 12) + 1;
  }
  return padaSign;
}

export function calculateSpecialLagnas(k: KundaliResult): SpecialLagnas {
  const lagnaRashi = k.ascendant.rashi.num;
  const padas: SpecialLagnas['arudhaPadas'] = [];
  for (let h = 1; h <= 12; h++) {
    const houseSignNum = ((lagnaRashi - 1 + (h - 1)) % 12) + 1;
    const lord = RASHIS[houseSignNum - 1].lord;
    const lordSignNum = signOfPlanet(k, lord);
    // distance lord is from the house (1..12)
    const dist = ((lordSignNum - houseSignNum + 12) % 12) + 1;
    // pada = same distance forward from the lord's sign
    const rawPada = ((lordSignNum - 1 + (dist - 1)) % 12) + 1;
    const pada = adjustArudha(houseSignNum, rawPada);
    padas.push({
      house: h,
      signNum: pada,
      signName: RASHIS[pada - 1].name,
    });
  }
  const upapada = padas[11]; // A12
  return {
    arudhaPadas: padas,
    upapadaLagna: { signNum: upapada.signNum, signName: upapada.signName },
  };
}

// ─── Chara Dasha (Jaimini) ──────────────────────────────────────────────────
//
// Sign-based dasha. The sequence depends on whether the Lagna is in an
// odd-footed (Aries..Leo, Libra..Sagittarius are odd; Cancer..Pisces are
// even) sign — odd-footed runs zodiacal, even-footed runs reverse-zodiacal.
// Each sign's dasha length = (count from sign to its lord, minus 1) years,
// minimum 1, maximum 12.

const ODD_FOOTED = [1, 2, 3, 7, 8, 9]; // Aries, Tau, Gem, Lib, Sco, Sag

function isOddFooted(signNum: number): boolean {
  // Per Jaimini: Aries..Leo + Libra..Sagittarius odd-footed; rest even-footed.
  // (Standard convention used in PL.)
  return ODD_FOOTED.includes(signNum) || signNum === 5; // include Leo
}

function charaYearsForSign(signNum: number): number {
  const lordOfSign = RASHIS[signNum - 1].lord;
  // Find the sign owned by 'lord' that is closest counting from signNum
  // (in zodiacal order). Subtract 1.
  const ownedSigns: number[] = [];
  for (let i = 0; i < 12; i++) {
    if (RASHIS[i].lord === lordOfSign) ownedSigns.push(i + 1);
  }
  // pick the one with smallest forward distance from signNum
  let best = 12;
  for (const s of ownedSigns) {
    const dist = ((s - signNum + 12) % 12) || 12;
    if (dist < best) best = dist;
  }
  const years = best - 1;
  return Math.min(12, Math.max(1, years));
}

export interface CharaDashaPeriod {
  signNum: number;
  signName: string;
  years: number;
  startDate: string;
  endDate: string;
}

export function calculateCharaDasha(k: KundaliResult): CharaDashaPeriod[] {
  const lagnaSign = k.ascendant.rashi.num;
  const direction = isOddFooted(lagnaSign) ? +1 : -1;
  const seq: number[] = [];
  for (let i = 0; i < 12; i++) {
    seq.push(((lagnaSign - 1 + direction * i + 144) % 12) + 1);
  }
  const periods: CharaDashaPeriod[] = [];
  let cursor = new Date(k.utc).getTime();
  for (const s of seq) {
    const yrs = charaYearsForSign(s);
    const start = new Date(cursor);
    const end = new Date(cursor + yrs * 365.25 * 86400 * 1000);
    periods.push({
      signNum: s,
      signName: RASHIS[s - 1].name,
      years: yrs,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    cursor = end.getTime();
  }
  return periods;
}

// ─── Chara Antardashas (sub-periods within each MD) ─────────────────────────
//
// Within a Chara Mahadasha of sign S, the 12 antardashas run through all 12
// signs starting from S itself, in the same direction (zodiacal for odd-
// footed Lagnas, reverse for even-footed). Each antardasha length is
// proportional to that sign's own Chara years compared to the total 12-sign
// cycle length inside this MD.
//
// Formula: antardashaYears = (MD.years) × (signYears / Σ signYears over 12)
// Equivalent to Irangnath Rath's simplified Parashari-chara variant.

export interface CharaAntardasha {
  signNum: number;
  signName: string;
  years: number;
  startDate: string;
  endDate: string;
}

export interface CharaDashaPeriodWithSubs extends CharaDashaPeriod {
  antardashas: CharaAntardasha[];
}

export function expandCharaAntardashas(k: KundaliResult): CharaDashaPeriodWithSubs[] {
  const mds = calculateCharaDasha(k);
  const lagnaSign = k.ascendant.rashi.num;
  const direction = isOddFooted(lagnaSign) ? +1 : -1;
  // Each sign's intrinsic Chara years — build the full 12-sign table once.
  const signYears: number[] = [];
  for (let s = 1; s <= 12; s++) signYears.push(charaYearsForSign(s));
  const totalIntrinsic = signYears.reduce((a, b) => a + b, 0);

  return mds.map((md) => {
    const seq: number[] = [];
    for (let i = 0; i < 12; i++) {
      seq.push(((md.signNum - 1 + direction * i + 144) % 12) + 1);
    }
    let cursor = new Date(md.startDate).getTime();
    const mdEnd = new Date(md.endDate).getTime();
    const mdSpan = mdEnd - cursor;
    const antardashas: CharaAntardasha[] = seq.map((s, idx) => {
      const portion = signYears[s - 1] / totalIntrinsic;
      const segMs = mdSpan * portion;
      const start = new Date(cursor);
      const end = idx === 11 ? new Date(mdEnd) : new Date(cursor + segMs);
      cursor = end.getTime();
      return {
        signNum: s,
        signName: RASHIS[s - 1].name,
        years: (end.getTime() - start.getTime()) / (365.25 * 86400 * 1000),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    });
    return { ...md, antardashas };
  });
}

// ─── Sthira Dasha (Jaimini, "fixed" rashi dasha) ────────────────────────────
//
// Each rashi receives a length determined purely by its quality:
//   Movable signs → 7 years
//   Fixed signs   → 8 years
//   Dual signs    → 9 years
// Total cycle: 4×(7+8+9) = 96 years.
//
// Starts from Lagna and walks in the same zodiacal/reverse direction as
// Chara (odd-footed → forward, even-footed → backward).

function sthiraYearsForSign(signNum: number): number {
  const q = RASHIS[signNum - 1].quality;
  return q === 'Movable' ? 7 : q === 'Fixed' ? 8 : 9;
}

export function calculateSthiraDasha(k: KundaliResult): CharaDashaPeriod[] {
  const lagnaSign = k.ascendant.rashi.num;
  const direction = isOddFooted(lagnaSign) ? +1 : -1;
  const periods: CharaDashaPeriod[] = [];
  let cursor = new Date(k.utc).getTime();
  for (let i = 0; i < 12; i++) {
    const s = ((lagnaSign - 1 + direction * i + 144) % 12) + 1;
    const yrs = sthiraYearsForSign(s);
    const start = new Date(cursor);
    const end = new Date(cursor + yrs * 365.25 * 86400 * 1000);
    periods.push({
      signNum: s,
      signName: RASHIS[s - 1].name,
      years: yrs,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    cursor = end.getTime();
  }
  return periods;
}

// ─── Narayana Dasha (Jaimini) ───────────────────────────────────────────────
//
// Starts from Lagna. Direction is decided by Lagna's quality:
//   Movable or Dual → zodiacal (forward)
//   Fixed           → reverse (anti-zodiacal)
// Years per rashi = Chara-style count (sign→lord distance), BUT the count
// reverses with direction — for reverse traversal we count lord→sign.

function narayanaYearsForSign(signNum: number, direction: 1 | -1): number {
  const lord = RASHIS[signNum - 1].lord;
  const ownedSigns: number[] = [];
  for (let i = 0; i < 12; i++) if (RASHIS[i].lord === lord) ownedSigns.push(i + 1);
  let best = 12;
  for (const s of ownedSigns) {
    const dist = direction > 0
      ? (((s - signNum + 12) % 12) || 12)
      : (((signNum - s + 12) % 12) || 12);
    if (dist < best) best = dist;
  }
  const years = best - 1;
  return Math.min(12, Math.max(1, years));
}

export function calculateNarayanaDasha(k: KundaliResult): CharaDashaPeriod[] {
  const lagnaSign = k.ascendant.rashi.num;
  const q = RASHIS[lagnaSign - 1].quality;
  const direction: 1 | -1 = q === 'Fixed' ? -1 : 1;
  const periods: CharaDashaPeriod[] = [];
  let cursor = new Date(k.utc).getTime();
  for (let i = 0; i < 12; i++) {
    const s = ((lagnaSign - 1 + direction * i + 144) % 12) + 1;
    const yrs = narayanaYearsForSign(s, direction);
    const start = new Date(cursor);
    const end = new Date(cursor + yrs * 365.25 * 86400 * 1000);
    periods.push({
      signNum: s,
      signName: RASHIS[s - 1].name,
      years: yrs,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    cursor = end.getTime();
  }
  return periods;
}

// ─── Shoola Dasha (Jaimini, longevity dasha) ────────────────────────────────
//
// Starts from the 8th house sign (house of longevity), not Lagna. Direction
// follows Chara's odd/even-footed rule based on the starting sign. Years per
// rashi = full count from sign to lord (without Chara's minus-1 adjustment),
// bounded 1..12.

function shoolaYearsForSign(signNum: number): number {
  const lord = RASHIS[signNum - 1].lord;
  const ownedSigns: number[] = [];
  for (let i = 0; i < 12; i++) if (RASHIS[i].lord === lord) ownedSigns.push(i + 1);
  let best = 12;
  for (const s of ownedSigns) {
    const dist = ((s - signNum + 12) % 12) || 12;
    if (dist < best) best = dist;
  }
  return Math.min(12, Math.max(1, best));
}

export function calculateShoolaDasha(k: KundaliResult): CharaDashaPeriod[] {
  const lagnaSign = k.ascendant.rashi.num;
  const eighthSign = ((lagnaSign - 1 + 7) % 12) + 1;
  const direction = isOddFooted(eighthSign) ? +1 : -1;
  const periods: CharaDashaPeriod[] = [];
  let cursor = new Date(k.utc).getTime();
  for (let i = 0; i < 12; i++) {
    const s = ((eighthSign - 1 + direction * i + 144) % 12) + 1;
    const yrs = shoolaYearsForSign(s);
    const start = new Date(cursor);
    const end = new Date(cursor + yrs * 365.25 * 86400 * 1000);
    periods.push({
      signNum: s,
      signName: RASHIS[s - 1].name,
      years: yrs,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    cursor = end.getTime();
  }
  return periods;
}

// ─── Niryana Shoola Dasha ────────────────────────────────────────────────────
//
// A variant of Shoola Dasha with different start and direction rules:
//   - Starts from the sign occupied by the 8th lord (not the 8th sign itself).
//   - Direction follows the 8th lord's sign's odd/even-foot rule.
//   - Years per sign use the classical "sign → lord, count without minus-1"
//     formula, i.e. 1..12 bounded; same as regular Shoola.
//
// Used for longevity decisions complementary to Shoola.

export function calculateNiryanaShoolaDasha(k: KundaliResult): CharaDashaPeriod[] {
  const lagnaSign = k.ascendant.rashi.num;
  const eighthSign = ((lagnaSign - 1 + 7) % 12) + 1;
  const eighthLord = RASHIS[eighthSign - 1].lord;
  const eighthLordSign = k.planets.find((p) => p.id === eighthLord)?.rashi.num ?? eighthSign;
  const direction = isOddFooted(eighthLordSign) ? +1 : -1;
  const periods: CharaDashaPeriod[] = [];
  let cursor = new Date(k.utc).getTime();
  for (let i = 0; i < 12; i++) {
    const s = ((eighthLordSign - 1 + direction * i + 144) % 12) + 1;
    const yrs = shoolaYearsForSign(s);
    const start = new Date(cursor);
    const end = new Date(cursor + yrs * 365.25 * 86400 * 1000);
    periods.push({
      signNum: s,
      signName: RASHIS[s - 1].name,
      years: yrs,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    cursor = end.getTime();
  }
  return periods;
}

// ─── Padakrama (Sudasa / Lakshmi) Dasha ─────────────────────────────────────
//
// Lakshmi/Sudasa: a rashi dasha keyed to the Arudha Lagna (A1) with years
// equal to the raw (sign → lord) count, direction by A1's odd/even-foot.
// Used for prosperity timing — when the current period is in a kendra/
// trikona from A1, material success surges.

export function calculatePadakramaDasha(k: KundaliResult): CharaDashaPeriod[] {
  const a1Sign = calculateSpecialLagnas(k).arudhaPadas[0].signNum;
  const direction = isOddFooted(a1Sign) ? +1 : -1;
  const periods: CharaDashaPeriod[] = [];
  let cursor = new Date(k.utc).getTime();
  for (let i = 0; i < 12; i++) {
    const s = ((a1Sign - 1 + direction * i + 144) % 12) + 1;
    const yrs = shoolaYearsForSign(s);
    const start = new Date(cursor);
    const end = new Date(cursor + yrs * 365.25 * 86400 * 1000);
    periods.push({
      signNum: s,
      signName: RASHIS[s - 1].name,
      years: yrs,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    cursor = end.getTime();
  }
  return periods;
}

// ─── Time-based Lagnas (Hora, Ghati, Bhava) ─────────────────────────────────
//
// These classical Jaimini lagnas are time-sensitive markers measured from
// sunrise. Each advances through the zodiac at a different rate:
//
//   Bhava Lagna — 1 sign / 2 hours (full cycle in 24h)   → 15°/hour
//   Hora Lagna  — 1 sign / 1 hour  (full cycle in 12h)   → 30°/hour
//   Ghati Lagna — 1 sign / 1 ghati (= 24 min; full cycle
//                 in 12 ghati = 4h 48min)                 → 75°/hour
//
// All three start at the Sun's longitude at sunrise. The birth-moment value
// is that starting longitude + (hoursSinceSunrise × rate).

import swisseph from 'swisseph';
import { normDeg, rashiOf, nakshatraOf, houseOf } from '../utils/astro-constants';
import { dateToJD, toUTC } from '../utils/julian';
import { computeAllGrahas } from './ephemeris.service';

const { SEFLG_SWIEPH, SE_CALC_RISE, SE_SUN } = swisseph;

function sunriseBeforeBirth(birthUTC: Date, lat: number, lng: number): Date | null {
  // Find the sunrise on or immediately before the birth moment.
  const start = new Date(Date.UTC(birthUTC.getUTCFullYear(), birthUTC.getUTCMonth(), birthUTC.getUTCDate(), 0, 0, 0));
  const jdStart = dateToJD(start);
  try {
    // Use "backward" by starting one day earlier and picking the rise before birth.
    const res: any = swisseph.swe_rise_trans(jdStart - 1.5, SE_SUN, '', SEFLG_SWIEPH, SE_CALC_RISE, lng, lat, 0, 0, 0);
    if (res.error || res.transitTime == null) return null;
    // Walk forward by ~1 day increments until we pass birth, take the last one that's <= birth.
    let t = res.transitTime;
    let last = t;
    const birthJD = dateToJD(birthUTC);
    for (let i = 0; i < 5; i++) {
      if (t > birthJD) break;
      last = t;
      const r2: any = swisseph.swe_rise_trans(t + 0.01, SE_SUN, '', SEFLG_SWIEPH, SE_CALC_RISE, lng, lat, 0, 0, 0);
      if (r2.error || r2.transitTime == null) break;
      t = r2.transitTime;
    }
    const rev: any = swisseph.swe_revjul(last, swisseph.SE_GREG_CAL);
    const intH = Math.floor(rev.hour);
    const minF = (rev.hour - intH) * 60;
    const intM = Math.floor(minF);
    const intS = Math.round((minF - intM) * 60);
    return new Date(Date.UTC(rev.year, rev.month - 1, rev.day, intH, intM, intS));
  } catch { return null; }
}

export interface TimeLagna {
  id: 'BHAVA' | 'HORA' | 'GHATI';
  name: string;
  longitude: number;
  rashi: { num: number; name: string; degInRashi: number };
  nakshatra: { num: number; name: string; pada: number };
  house: number;
  rateDegPerHour: number;
  hoursSinceSunrise: number;
}

export interface TimeLagnasResult {
  sunriseUTC: string | null;
  sunAtSunrise: number | null;
  lagnas: TimeLagna[];
}

export function computeTimeLagnas(k: KundaliResult): TimeLagnasResult {
  const birthUTC = toUTC(k.input.datetime, k.input.tzOffsetHours);
  const sunrise = sunriseBeforeBirth(birthUTC, k.input.lat, k.input.lng);
  if (!sunrise) return { sunriseUTC: null, sunAtSunrise: null, lagnas: [] };

  const jdSunrise = dateToJD(sunrise);
  const sunAtSunrise = computeAllGrahas(jdSunrise).SU.longitude;
  const ascLng = k.ascendant.longitude;
  const hoursSinceSunrise = (birthUTC.getTime() - sunrise.getTime()) / 3600000;

  const make = (id: 'BHAVA' | 'HORA' | 'GHATI', name: string, rate: number): TimeLagna => {
    const lng = normDeg(sunAtSunrise + rate * hoursSinceSunrise);
    const r = rashiOf(lng);
    const n = nakshatraOf(lng);
    return {
      id, name,
      longitude: lng,
      rashi: { num: r.num, name: r.name, degInRashi: r.deg },
      nakshatra: { num: n.num, name: n.name, pada: n.pada },
      house: houseOf(lng, ascLng),
      rateDegPerHour: rate,
      hoursSinceSunrise: Math.round(hoursSinceSunrise * 10000) / 10000,
    };
  };

  return {
    sunriseUTC: sunrise.toISOString(),
    sunAtSunrise,
    lagnas: [
      make('BHAVA', 'Bhava Lagna', 15),
      make('HORA',  'Hora Lagna',  30),
      make('GHATI', 'Ghati Lagna', 75),
    ],
  };
}

// ─── Jaimini Raja Yogas ─────────────────────────────────────────────────────
//
// Classical combinations involving Karakas / Arudha Lagna / Navamsa.
// We detect a focused subset that is broadly agreed-upon:
//
//   1. AK in 1/4/7/10 from Lagna            — Kendra of Atmakaraka
//   2. AK in 5/9 from Lagna                 — Trikona of Atmakaraka
//   3. AmK in aspecting relationship to AK  — using Jaimini aspects
//   4. AK and AmK in same sign              — conjunction yoga
//   5. AL (Arudha Lagna) in kendra from Lagna — power of public image
//   6. AK aspects 10th (career amplification)
//   7. Lagna has a graha + AK conjunct (Rajayoga Raja)

export interface JaiminiRajaYoga {
  id: string;
  name: string;
  present: boolean;
  details: string;
}

export function calculateJaiminiRajaYogas(k: KundaliResult): JaiminiRajaYoga[] {
  const lagna = k.ascendant.rashi.num;
  const karakas = calculateKarakas(k);
  const ak = karakas.find((x) => x.karaka === 'AK')!;
  const amk = karakas.find((x) => x.karaka === 'AmK')!;
  const akPlanet = k.planets.find((p) => p.id === ak.planet)!;
  const amkPlanet = k.planets.find((p) => p.id === amk.planet)!;
  const arudhas = calculateSpecialLagnas(k).arudhaPadas;
  const a1Sign = arudhas[0].signNum;

  const houseFromLagna = (signNum: number) => ((signNum - lagna + 12) % 12) + 1;

  const akHouse = houseFromLagna(akPlanet.rashi.num);
  const amkHouse = houseFromLagna(amkPlanet.rashi.num);
  const a1House = houseFromLagna(a1Sign);

  const aspects = calculateJaiminiAspects(k);
  const akAmkAspect = aspects.some((g) => g.pairs.some((p) =>
    (p.a === ak.planet && p.b === amk.planet) || (p.a === amk.planet && p.b === ak.planet)));

  const yogas: JaiminiRajaYoga[] = [
    {
      id: 'AK_KENDRA',
      name: 'AK in Kendra from Lagna',
      present: [1, 4, 7, 10].includes(akHouse),
      details: `${ak.planet} (AK) in house ${akHouse}`,
    },
    {
      id: 'AK_TRIKONA',
      name: 'AK in Trikona from Lagna',
      present: [5, 9].includes(akHouse),
      details: `${ak.planet} (AK) in house ${akHouse}`,
    },
    {
      id: 'AMK_KENDRA',
      name: 'AmK in Kendra from Lagna',
      present: [1, 4, 7, 10].includes(amkHouse),
      details: `${amk.planet} (AmK) in house ${amkHouse}`,
    },
    {
      id: 'AK_AMK_ASPECT',
      name: 'AK and AmK in mutual Jaimini aspect',
      present: akAmkAspect,
      details: akAmkAspect ? `${ak.planet} ↔ ${amk.planet}` : 'no aspect',
    },
    {
      id: 'AK_AMK_CONJ',
      name: 'AK and AmK conjunct (same sign)',
      present: akPlanet.rashi.num === amkPlanet.rashi.num,
      details: `AK:${ak.planet} AmK:${amk.planet} sign ${akPlanet.rashi.num}`,
    },
    {
      id: 'AL_KENDRA',
      name: 'Arudha Lagna (A1) in Kendra from Lagna',
      present: [1, 4, 7, 10].includes(a1House),
      details: `A1 in house ${a1House} (${RASHIS[a1Sign - 1].name})`,
    },
    {
      id: 'AK_IN_AL',
      name: 'AK in the sign of Arudha Lagna',
      present: akPlanet.rashi.num === a1Sign,
      details: `${ak.planet} sign ${akPlanet.rashi.num}, A1 ${a1Sign}`,
    },
  ];
  return yogas;
}

// ─── Jaimini Longevity (Ayur) ───────────────────────────────────────────────
//
// BPHS-style 3-pair longevity assessment. For each pair of reference points,
// classify whether they sit in (Movable, Fixed, Dual) qualities and derive a
// short/medium/long marker. The majority of three pairs decides.
//
//   Pair 1: {Lagna rashi, Hora Lagna rashi}
//   Pair 2: {Moon rashi, 8th-from-Moon rashi}
//   Pair 3: {AK rashi, 8th-from-AK rashi}
//
// Quality mapping (classical):
//   Both Movable OR both Fixed OR {Fixed + Dual} → Medium
//   Both Dual OR {Movable + Fixed}               → Long
//   {Movable + Dual}                              → Short

type Lifespan = 'short' | 'medium' | 'long';

function pairSpan(signA: number, signB: number): Lifespan {
  const qa = RASHIS[signA - 1].quality;
  const qb = RASHIS[signB - 1].quality;
  const set = new Set([qa, qb]);
  if (set.size === 1) {
    if (qa === 'Dual') return 'long';
    return 'medium';
  }
  if (set.has('Movable') && set.has('Fixed')) return 'long';
  if (set.has('Fixed') && set.has('Dual')) return 'medium';
  return 'short'; // Movable + Dual
}

export interface JaiminiLongevity {
  pairs: Array<{ id: string; label: string; signA: number; signB: number; span: Lifespan }>;
  overall: Lifespan;
  method: 'jaimini-3-pairs';
}

export function calculateJaiminiLongevity(k: KundaliResult): JaiminiLongevity {
  const lagnaSign = k.ascendant.rashi.num;
  const tlRes = computeTimeLagnas(k);
  const horaSign = tlRes.lagnas.find((l) => l.id === 'HORA')?.rashi.num ?? lagnaSign;
  const moon = k.planets.find((p) => p.id === 'MO')!;
  const eighthFromMoon = ((moon.rashi.num - 1 + 7) % 12) + 1;
  const karakas = calculateKarakas(k);
  const ak = karakas.find((x) => x.karaka === 'AK')!;
  const akPlanet = k.planets.find((p) => p.id === ak.planet)!;
  const eighthFromAk = ((akPlanet.rashi.num - 1 + 7) % 12) + 1;

  const pairs = [
    { id: 'P1', label: 'Lagna + Hora Lagna',    signA: lagnaSign,      signB: horaSign,        span: pairSpan(lagnaSign, horaSign) },
    { id: 'P2', label: 'Moon + 8th from Moon',  signA: moon.rashi.num, signB: eighthFromMoon,  span: pairSpan(moon.rashi.num, eighthFromMoon) },
    { id: 'P3', label: 'AK + 8th from AK',      signA: akPlanet.rashi.num, signB: eighthFromAk, span: pairSpan(akPlanet.rashi.num, eighthFromAk) },
  ];

  const counts: Record<Lifespan, number> = { short: 0, medium: 0, long: 0 };
  pairs.forEach((p) => { counts[p.span] += 1; });
  const overall = (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]) as Lifespan;
  return { pairs, overall, method: 'jaimini-3-pairs' };
}

// ─── Aggregate ─────────────────────────────────────────────────────────────

export interface JaiminiResult {
  karakas: KarakaAssignment[];
  aspects: JaiminiAspectGroup[];
  lagnas: SpecialLagnas;
  charaDasha: CharaDashaPeriod[];
  /** Phase 14D additions */
  charaDashaExpanded: CharaDashaPeriodWithSubs[];
  timeLagnas: TimeLagnasResult;
  rajaYogas: JaiminiRajaYoga[];
  longevity: JaiminiLongevity;
  /** Phase 8 — additional rashi-based Jaimini dashas */
  sthiraDasha: CharaDashaPeriod[];
  narayanaDasha: CharaDashaPeriod[];
  shoolaDasha: CharaDashaPeriod[];
  /** Phase 9 — deep Jaimini: Niryana Shoola (longevity) + Padakrama (prosperity) */
  niryanaShoolaDasha: CharaDashaPeriod[];
  padakramaDasha: CharaDashaPeriod[];
}

export function calculateJaimini(k: KundaliResult): JaiminiResult {
  return {
    karakas: calculateKarakas(k),
    aspects: calculateJaiminiAspects(k),
    lagnas: calculateSpecialLagnas(k),
    charaDasha: calculateCharaDasha(k),
    charaDashaExpanded: expandCharaAntardashas(k),
    timeLagnas: computeTimeLagnas(k),
    rajaYogas: calculateJaiminiRajaYogas(k),
    longevity: calculateJaiminiLongevity(k),
    sthiraDasha: calculateSthiraDasha(k),
    narayanaDasha: calculateNarayanaDasha(k),
    shoolaDasha: calculateShoolaDasha(k),
    niryanaShoolaDasha: calculateNiryanaShoolaDasha(k),
    padakramaDasha: calculatePadakramaDasha(k),
  };
}

// Used by tests / consumers that just want planet positions sorted by deg.
export function planetsByAdvancement(planets: PlanetPosition[]): PlanetPosition[] {
  return [...planets].sort((a, b) => b.rashi.degInRashi - a.rashi.degInRashi);
}
