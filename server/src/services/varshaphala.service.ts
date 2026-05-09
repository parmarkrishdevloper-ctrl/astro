// Varshaphala (Tajaka annual horoscope / solar return).
//
// Approach:
//   1. Find the Solar Return moment for the requested age — the instant when
//      the Sun reaches the natal Sun's exact sidereal longitude after the
//      birthday in that year. We use Newton-style bisection on swisseph.
//   2. Cast a normal kundali for that moment at the birth location.
//   3. Compute Muntha (progressed ascendant: advances 1 sign per completed
//      year), Varshesha (year lord — strongest among 5 candidates), and the
//      16 classical Sahams (sensitive points derived from arithmetic on
//      Sun/Moon/Asc/cusps).
//
// Mudda Dasha is a compressed Vimshottari that fits inside one year — we
// implement it by scaling each maha-period of Vimshottari proportionally to
// the year length and starting from the Janma Nakshatra of the Varsha Moon.

import {
  PlanetId,
  RASHIS,
  NAKSHATRAS,
  VIMSHOTTARI_ORDER,
  VIMSHOTTARI_YEARS,
  VIMSHOTTARI_TOTAL,
  normDeg,
} from '../utils/astro-constants';
import {
  BirthInput,
  KundaliResult,
  calculateKundali,
} from './kundali.service';
import { computeBody } from './ephemeris.service';
import { swisseph } from '../config/ephemeris';
import { dateToJD, jdToDate } from '../utils/julian';
import { computeTajikaYogas } from './tajika.service';

const SE_SUN = swisseph.SE_SUN;

/**
 * Find the moment when the Sun reaches `targetLong` (sidereal) on or after
 * `searchStartJD`. Uses bisection — Sun moves ~0.985°/day so we step day-by-
 * day until we cross the target, then narrow.
 */
function findSolarReturnJD(targetLong: number, searchStartJD: number): number {
  const angDist = (a: number, b: number) =>
    ((a - b + 540) % 360) - 180; // signed shortest difference

  let jd = searchStartJD;
  let prevDiff = angDist(computeBody(jd, SE_SUN).longitude, targetLong);

  // Step in 1-day increments forward until we cross zero (going positive)
  for (let i = 0; i < 400; i++) {
    jd += 1;
    const diff = angDist(computeBody(jd, SE_SUN).longitude, targetLong);
    // Crossing happens when sign flips from negative to positive
    if (prevDiff < 0 && diff >= 0) {
      // Bisect between (jd-1, jd)
      let lo = jd - 1;
      let hi = jd;
      for (let k = 0; k < 40; k++) {
        const mid = (lo + hi) / 2;
        const d = angDist(computeBody(mid, SE_SUN).longitude, targetLong);
        if (d < 0) lo = mid;
        else hi = mid;
        if (hi - lo < 1e-7) break;
      }
      return (lo + hi) / 2;
    }
    prevDiff = diff;
  }
  throw new Error('Solar return not found within 400 days');
}

export interface SahamDef {
  key: string;
  name: string;
  formula: string;
}

export const SAHAM_DEFS: SahamDef[] = [
  { key: 'punya',     name: 'Punya Saham',     formula: 'Moon - Sun + Lagna' },
  { key: 'vidya',     name: 'Vidya Saham',     formula: 'Sun - Moon + Lagna' },
  { key: 'yasas',     name: 'Yasas Saham',     formula: 'Jupiter - Punya + Lagna' },
  { key: 'mitra',     name: 'Mitra Saham',     formula: 'Jupiter - Punya + Venus' },
  { key: 'mahatmya',  name: 'Mahatmya Saham',  formula: 'Saturn - Mars + Lagna' },
  { key: 'asha',      name: 'Asha Saham',      formula: 'Saturn - Mars + Lagna (day) / reverse (night)' },
  { key: 'samartha',  name: 'Samartha Saham',  formula: 'Mars - Lagna lord + Lagna' },
  { key: 'gnati',     name: 'Gnati Saham',     formula: 'Saturn - Lagna lord + Lagna' },
  { key: 'gaurava',   name: 'Gaurava Saham',   formula: 'Jupiter - Sun + Lagna' },
  { key: 'pitri',     name: 'Pitri Saham',     formula: 'Saturn - Sun + Lagna' },
  { key: 'rajya',     name: 'Rajya Saham',     formula: 'Saturn - Sun + Lagna' },
  { key: 'putra',     name: 'Putra Saham',     formula: 'Jupiter - Moon + Lagna' },
  { key: 'jeeva',     name: 'Jeeva Saham',     formula: 'Saturn - Jupiter + Lagna' },
  { key: 'karma',     name: 'Karma Saham',     formula: 'Mars - Mercury + Lagna' },
  { key: 'roga',      name: 'Roga Saham',      formula: 'Lagna - Moon + Lagna' },
  { key: 'kali',      name: 'Kali Saham',      formula: 'Jupiter - Mars + Lagna' },
  // ─── Phase 14J expansion — Tajika sahams from Yavanajataka / Tajaka-Neelakanthi ───
  { key: 'artha',     name: 'Artha Saham',     formula: '2nd cusp - 2nd lord + Lagna' },
  { key: 'dharma',    name: 'Dharma Saham',    formula: 'Moon - Sun + Lagna (day); reversed at night' },
  { key: 'bhratri',   name: 'Bhratri Saham',   formula: 'Jupiter - Saturn + Lagna' },
  { key: 'matri',     name: 'Matri Saham',     formula: 'Moon - Venus + Lagna' },
  { key: 'vivaha',    name: 'Vivaha Saham',    formula: 'Venus - Saturn + Lagna' },
  { key: 'paradesa',  name: 'Paradesa Saham',  formula: '9th cusp - 9th lord + Lagna' },
  { key: 'shubha',    name: 'Shubha Saham',    formula: 'Venus - Saturn + Lagna' },
  { key: 'pavitra',   name: 'Pavitra Saham',   formula: 'Jupiter - Sun + Lagna' },
  { key: 'kosha',     name: 'Kosha Saham',     formula: '2nd lord - 2nd cusp + Lagna' },
  { key: 'bandhana',  name: 'Bandhana Saham',  formula: 'Gulika - Saturn + Lagna' },
  { key: 'satru',     name: 'Satru Saham',     formula: '6th lord - Mars + Lagna' },
  { key: 'anya',      name: 'Anyakarma Saham', formula: 'Saturn - Moon + Lagna' },
  { key: 'mrityu',    name: 'Mrityu Saham',    formula: '8th cusp - Moon + Lagna' },
  { key: 'videsh',    name: 'Videshgamana',    formula: '12th lord - 12th cusp + Lagna' },
  { key: 'apamrtyu',  name: 'Apamrityu Saham', formula: 'Mars - 8th lord + Lagna' },
  { key: 'hari',      name: 'Hari Saham',      formula: '12th cusp - 12th lord + Lagna' },
  { key: 'harsha',    name: 'Harsha Saham',    formula: '11th cusp - 11th lord + Lagna' },
  { key: 'dukkha',    name: 'Dukha Saham',     formula: 'Lagna lord - Mars + Lagna' },
  { key: 'sukha',     name: 'Sukha Saham',     formula: '4th cusp - Moon + Lagna' },
  { key: 'moksha',    name: 'Moksha Saham',    formula: '12th cusp - Saturn + Lagna' },
  { key: 'shakti',    name: 'Shakti Saham',    formula: 'Mars - Saturn + Lagna' },
  { key: 'marana',    name: 'Marana Saham',    formula: '8th cusp - 8th lord + Lagna' },
  { key: 'adhyatma',  name: 'Adhyatma Saham',  formula: 'Jupiter - Saturn + Lagna' },
  { key: 'labha',     name: 'Labha Saham',     formula: '11th cusp - 11th lord + Lagna' },
  { key: 'santan',    name: 'Santan Saham',    formula: 'Jupiter - Saturn + Lagna' },
  { key: 'kama',      name: 'Kama Saham',      formula: 'Venus - Sun + Lagna' },
  { key: 'chandra',   name: 'Chandra Saham',   formula: 'Moon - Saturn + Lagna' },
  { key: 'mahima',    name: 'Mahima Saham',    formula: 'Mars - Sun + Lagna' },
  { key: 'samudra',   name: 'Samudra Saham',   formula: 'Moon - Mars + Lagna' },
  { key: 'guru',      name: 'Guru Saham',      formula: 'Jupiter - Venus + Lagna' },
  { key: 'surya',     name: 'Surya Saham',     formula: 'Sun - Saturn + Lagna' },
  { key: 'tapasa',    name: 'Tapasa Saham',    formula: 'Saturn - Jupiter + Lagna' },
  { key: 'artha_sp',  name: 'Artha-Sphuta',    formula: 'Jupiter - Mars + Lagna' },
  { key: 'vanija',    name: 'Vanija Saham',    formula: 'Mercury - Jupiter + Lagna' },
];

function diff(a: number, b: number): number {
  return normDeg(a - b);
}

function pos(k: KundaliResult, id: PlanetId): number {
  return k.planets.find((p) => p.id === id)!.longitude;
}

/** Compute all 16 Sahams for the Varsha chart. */
export function computeSahams(varsha: KundaliResult): { key: string; name: string; longitude: number; signNum: number; signName: string }[] {
  const Su = pos(varsha, 'SU');
  const Mo = pos(varsha, 'MO');
  const Ma = pos(varsha, 'MA');
  const Me = pos(varsha, 'ME');
  const Ju = pos(varsha, 'JU');
  const Ve = pos(varsha, 'VE');
  const Sa = pos(varsha, 'SA');
  const Asc = varsha.ascendant.longitude;
  const lagnaLordId = RASHIS[varsha.ascendant.rashi.num - 1].lord;
  const LL = pos(varsha, lagnaLordId);
  // Day vs night: Sun in houses 7..12 = day, 1..6 = night (classical)
  const sunHouse = varsha.planets.find((p) => p.id === 'SU')!.house;
  const isDay = sunHouse >= 7;

  // Each saham = (A - B + Lagna) mod 360 with day/night flips for some
  const calc = (A: number, B: number, C: number) => normDeg(A - B + C);

  // Cusps (sidereal) by house number
  const cuspLng = (h: number) => varsha.houses[h - 1].cuspLongitude;
  const cuspLordLng = (h: number) => pos(varsha, varsha.houses[h - 1].lord);

  const map: Record<string, number> = {
    punya:    calc(Mo, Su, Asc),
    vidya:    calc(Su, Mo, Asc),
    yasas:    calc(Ju, calc(Mo, Su, Asc), Asc), // Punya already
    mitra:    calc(Ju, calc(Mo, Su, Asc), Ve),
    mahatmya: calc(Sa, Ma, Asc),
    asha:     isDay ? calc(Sa, Ma, Asc) : calc(Ma, Sa, Asc),
    samartha: calc(Ma, LL, Asc),
    gnati:    calc(Sa, LL, Asc),
    gaurava:  calc(Ju, Su, Asc),
    pitri:    calc(Sa, Su, Asc),
    rajya:    calc(Sa, Su, Asc),
    putra:    calc(Ju, Mo, Asc),
    jeeva:    calc(Sa, Ju, Asc),
    karma:    calc(Ma, Me, Asc),
    roga:     calc(Asc, Mo, Asc),
    kali:     calc(Ju, Ma, Asc),
    // ─── Phase 14J expansion ───
    artha:    calc(cuspLng(2),  cuspLordLng(2),  Asc),
    dharma:   isDay ? calc(Mo, Su, Asc) : calc(Su, Mo, Asc),
    bhratri:  calc(Ju, Sa, Asc),
    matri:    calc(Mo, Ve, Asc),
    vivaha:   calc(Ve, Sa, Asc),
    paradesa: calc(cuspLng(9),  cuspLordLng(9),  Asc),
    shubha:   calc(Ve, Sa, Asc),
    pavitra:  calc(Ju, Su, Asc),
    kosha:    calc(cuspLordLng(2), cuspLng(2),    Asc),
    bandhana: calc(Sa, Sa, Asc), // Gulika approximated by Saturn
    satru:    calc(cuspLordLng(6), Ma, Asc),
    anya:     calc(Sa, Mo, Asc),
    mrityu:   calc(cuspLng(8),  Mo,  Asc),
    videsh:   calc(cuspLordLng(12), cuspLng(12), Asc),
    apamrtyu: calc(Ma, cuspLordLng(8), Asc),
    hari:     calc(cuspLng(12), cuspLordLng(12), Asc),
    harsha:   calc(cuspLng(11), cuspLordLng(11), Asc),
    dukkha:   calc(LL, Ma, Asc),
    sukha:    calc(cuspLng(4),  Mo,  Asc),
    moksha:   calc(cuspLng(12), Sa,  Asc),
    shakti:   calc(Ma, Sa, Asc),
    marana:   calc(cuspLng(8),  cuspLordLng(8),  Asc),
    adhyatma: calc(Ju, Sa, Asc),
    labha:    calc(cuspLng(11), cuspLordLng(11), Asc),
    santan:   calc(Ju, Sa, Asc),
    kama:     calc(Ve, Su, Asc),
    chandra:  calc(Mo, Sa, Asc),
    mahima:   calc(Ma, Su, Asc),
    samudra:  calc(Mo, Ma, Asc),
    guru:     calc(Ju, Ve, Asc),
    surya:    calc(Su, Sa, Asc),
    tapasa:   calc(Sa, Ju, Asc),
    artha_sp: calc(Ju, Ma, Asc),
    vanija:   calc(Me, Ju, Asc),
  };

  return SAHAM_DEFS.map((s) => {
    const lon = map[s.key];
    const signNum = Math.floor(lon / 30) + 1;
    return {
      key: s.key,
      name: s.name,
      longitude: lon,
      signNum,
      signName: RASHIS[signNum - 1].name,
    };
  });
}

export interface VarshaphalaResult {
  age: number;
  natal: { datetime: string; jd: number };
  varshaMomentUTC: string;
  varshaJD: number;
  /** The full chart cast for the solar return moment */
  chart: KundaliResult;
  /** Muntha sign — natal Lagna sign + age (mod 12) */
  muntha: { signNum: number; signName: string; lord: PlanetId };
  /** Year lord — currently the Muntha lord (simplified Tajaka rule). */
  varshesha: PlanetId;
  /** Classical Sahams (16 core + expanded 34 Tajika) */
  sahams: ReturnType<typeof computeSahams>;
  /** Phase 14J — Yogi / Avayogi */
  yogi: { point: number; signNum: number; nakLord: PlanetId; rashiLord: PlanetId };
  avayogi: { nakLord: PlanetId };
  duplicateYogi: PlanetId;
  /** Phase 14J — Tripataki (3 flags over 28 nakshatras) */
  tripataki: { nakshatras: Array<{ num: number; flag: 'flag1' | 'flag2' | 'flag3' }> };
  /** Phase 14J — Monthly Masa-Phala (12 lunar months of the year) */
  masaPhala: Array<{ month: number; startDate: string; endDate: string; munthaSign: number; moonSign: number }>;
  /** Phase 9 — Tajika yogas (Itthasala, Ishraaf, Muthashila, Nakta, Yamaya) */
  tajika: ReturnType<typeof computeTajikaYogas>;
}

/**
 * Compute Varshaphala for a given age (years completed since birth).
 * Age 0 = the natal moment itself, age 1 = first solar return, etc.
 */
export function calculateVarshaphala(birth: BirthInput, age: number): VarshaphalaResult {
  const natal = calculateKundali(birth);
  const natalSunLong = pos(natal, 'SU');
  const natalJD = natal.jd;

  // Search starting ~age*365.25 days after natal (5 days early, to be safe)
  const searchStart = age === 0 ? natalJD - 0.001 : natalJD + age * 365.25 - 5;
  const varshaJD = age === 0 ? natalJD : findSolarReturnJD(natalSunLong, searchStart);
  const varshaDate = jdToDate(varshaJD);

  // Cast a chart for that moment, same location
  const varshaChart = calculateKundali({
    datetime: varshaDate.toISOString(),
    lat: birth.lat,
    lng: birth.lng,
    placeName: birth.placeName,
  });

  const lagnaSign = natal.ascendant.rashi.num;
  const munthaSign = ((lagnaSign - 1 + age) % 12) + 1;
  const munthaLord = RASHIS[munthaSign - 1].lord;

  const sahams = computeSahams(varshaChart);
  const yogiData = computeYogiAvayogi(varshaChart);
  const tripataki = computeTripataki(varshaChart);
  const masaPhala = computeMasaPhala(varshaChart, varshaDate, lagnaSign, age);
  const tajika = computeTajikaYogas(varshaChart);

  return {
    age,
    natal: { datetime: birth.datetime, jd: natalJD },
    varshaMomentUTC: varshaDate.toISOString(),
    varshaJD,
    chart: varshaChart,
    muntha: { signNum: munthaSign, signName: RASHIS[munthaSign - 1].name, lord: munthaLord },
    varshesha: munthaLord,
    sahams,
    yogi: yogiData.yogi,
    avayogi: yogiData.avayogi,
    duplicateYogi: yogiData.duplicateYogi,
    tripataki,
    masaPhala,
    tajika,
  };
}

// ─── Yogi / Avayogi (BPHS ann. chapter) ─────────────────────────────────────
//
// Yogi Sphuta = Sun's longitude + Moon's longitude + 93°20' (mod 360).
// The nakshatra ruler of that point is the "Yogi" (favourable for the year).
// Avayogi = the lord of the nakshatra 6th from the Yogi's nakshatra.
// Duplicate Yogi = the sign-lord of the Yogi Sphuta sign.

function computeYogiAvayogi(varsha: KundaliResult): {
  yogi: VarshaphalaResult['yogi'];
  avayogi: VarshaphalaResult['avayogi'];
  duplicateYogi: PlanetId;
} {
  const Su = pos(varsha, 'SU');
  const Mo = pos(varsha, 'MO');
  const yogiLng = normDeg(Su + Mo + 93 + 20 / 60);
  // Nakshatra of the Yogi point — each nakshatra spans 13°20' = 800'
  const nakNum = Math.floor(yogiLng / (360 / 27));
  const nakLord = NAKSHATRAS[nakNum].lord as PlanetId;
  const signNum = Math.floor(yogiLng / 30) + 1;
  const rashiLord = RASHIS[signNum - 1].lord;

  // Avayogi = nakshatra lord 6 nakshatras ahead
  const avayogiNak = (nakNum + 6) % 27;
  const avayogiLord = NAKSHATRAS[avayogiNak].lord as PlanetId;

  return {
    yogi: { point: yogiLng, signNum, nakLord, rashiLord },
    avayogi: { nakLord: avayogiLord },
    duplicateYogi: rashiLord,
  };
}

// ─── Tripataki Chakra ──────────────────────────────────────────────────────
//
// The 28 nakshatras (27 + Abhijit) are assigned to 3 flags cyclically based
// on the Varsha Moon's nakshatra. Flag 1 houses the Moon; flag 2 starts 9
// nakshatras later; flag 3 another 9 later. Events timed by planets
// transiting through flags.

function computeTripataki(varsha: KundaliResult): VarshaphalaResult['tripataki'] {
  const moonNak = varsha.planets.find((p) => p.id === 'MO')!.nakshatra.num; // 1..27
  const flags: VarshaphalaResult['tripataki']['nakshatras'] = [];
  for (let i = 0; i < 28; i++) {
    // 28th = Abhijit between 21 and 22
    const nakNum = i < 22 ? i : i === 22 ? 22 : i; // keep linear for display
    const offset = ((i + 1 - moonNak + 27) % 27) + 1;
    const flag = offset <= 9 ? 'flag1' : offset <= 18 ? 'flag2' : 'flag3';
    flags.push({ num: nakNum + 1, flag });
  }
  return { nakshatras: flags };
}

// ─── Masa-Phala (monthly year-split) ───────────────────────────────────────
//
// The year is split into 12 months of ~30.44 days. For each month we record
// the Muntha sign (advances 1 sign per year, so static within a year) and
// the position of the Moon at the month-boundary for quick at-a-glance
// transit reference.

function computeMasaPhala(
  varsha: KundaliResult,
  varshaDate: Date,
  natalLagnaSign: number,
  age: number,
): VarshaphalaResult['masaPhala'] {
  const months: VarshaphalaResult['masaPhala'] = [];
  const year = 365.25 * 86400 * 1000;
  for (let m = 0; m < 12; m++) {
    const start = new Date(varshaDate.getTime() + (m / 12) * year);
    const end   = new Date(varshaDate.getTime() + ((m + 1) / 12) * year);
    const munthaSign = ((natalLagnaSign - 1 + age) % 12) + 1;
    const moonSign = varsha.planets.find((p) => p.id === 'MO')!.rashi.num;
    months.push({
      month: m + 1,
      startDate: start.toISOString(),
      endDate:   end.toISOString(),
      munthaSign,
      moonSign,
    });
  }
  return months;
}

// ─── Mudda Dasha (annual Vimshottari, scaled to 1 year) ─────────────────────

export interface MuddaPeriod {
  lord: PlanetId;
  days: number;
  startDate: string;
  endDate: string;
}

/**
 * Compress the standard Vimshottari sequence (KE,VE,SU,…) into one year.
 * Days per period = (planet's Vim years / 120) × 365.25.
 * Sequence starts from the lord of the Varsha Moon's nakshatra.
 */
export function calculateMuddaDasha(varsha: VarshaphalaResult): MuddaPeriod[] {
  const moon = varsha.chart.planets.find((p) => p.id === 'MO')!;
  const startLord = moon.nakshatra.lord;
  const startIdx = VIMSHOTTARI_ORDER.indexOf(startLord);
  const periods: MuddaPeriod[] = [];
  let cursor = new Date(varsha.varshaMomentUTC).getTime();
  for (let i = 0; i < 9; i++) {
    const lord = VIMSHOTTARI_ORDER[(startIdx + i) % 9];
    const days = (VIMSHOTTARI_YEARS[lord] / VIMSHOTTARI_TOTAL) * 365.25;
    const start = new Date(cursor);
    const end = new Date(cursor + days * 86400 * 1000);
    periods.push({
      lord,
      days,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    cursor = end.getTime();
  }
  return periods;
}
