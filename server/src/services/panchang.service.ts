import { swisseph } from '../config/ephemeris';
import { computeBody, computeAllGrahas } from './ephemeris.service';
import { dateToJD, jdToDate } from '../utils/julian';
import { nakshatraOf, rashiOf, normDeg, NAK_SPAN, RASHIS, NAKSHATRAS } from '../utils/astro-constants';
import {
  NAK_META, DISHA_SHOOL, chandraBalaFor, taraBalaFor, rituFromSunRashi, AMANTA_MASA,
} from '../utils/nakshatra-meta';

// ─── TITHI, YOGA, KARANA names ──────────────────────────────────────────────
const TITHI_NAMES = [
  'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dvadashi', 'Trayodashi', 'Chaturdashi', 'Purnima',
  'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami',
  'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami',
  'Ekadashi', 'Dvadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya',
];
const YOGA_NAMES = [
  'Vishkambha','Priti','Ayushman','Saubhagya','Shobhana','Atiganda','Sukarma','Dhriti',
  'Shoola','Ganda','Vriddhi','Dhruva','Vyaghata','Harshana','Vajra','Siddhi','Vyatipata',
  'Variyan','Parigha','Shiva','Siddha','Sadhya','Shubha','Shukla','Brahma','Indra','Vaidhriti',
];
const KARANA_NAMES_MOVABLE = ['Bava','Balava','Kaulava','Taitila','Garaja','Vanija','Vishti'];
const KARANA_NAMES_FIXED   = ['Shakuni','Chatushpada','Naga','Kimstughna'];

const VARA_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const VARA_LORDS = ['SU','MO','MA','ME','JU','VE','SA'] as const;

// ─── Helpers ───────────────────────────────────────────────────────────────
function tithiIndex(jd: number): number {
  // 0..29 (0-indexed tithi number − 1)
  const sun = computeBody(jd, swisseph.SE_SUN);
  const moon = computeBody(jd, swisseph.SE_MOON);
  return Math.floor(normDeg(moon.longitude - sun.longitude) / 12);
}
function halfTithiIndex(jd: number): number {
  const sun = computeBody(jd, swisseph.SE_SUN);
  const moon = computeBody(jd, swisseph.SE_MOON);
  return Math.floor(normDeg(moon.longitude - sun.longitude) / 6);
}
function yogaIndex(jd: number): number {
  const sun = computeBody(jd, swisseph.SE_SUN);
  const moon = computeBody(jd, swisseph.SE_MOON);
  return Math.floor(normDeg(sun.longitude + moon.longitude) / NAK_SPAN);
}
function nakIndex(jd: number): number {
  const moon = computeBody(jd, swisseph.SE_MOON);
  return Math.floor(normDeg(moon.longitude) / NAK_SPAN);
}

/**
 * Find when `bucketFn` transitions from its current value to the next,
 * searching up to `hoursAhead` hours past `jd`. Returns JD of the transition.
 * Uses forward scan (coarse) + bisection (fine) — robust across wrap-around.
 */
function findTransition(
  jd: number,
  bucketFn: (j: number) => number,
  hoursAhead = 48,
): number | null {
  const start = bucketFn(jd);
  const dayStep = 1 / 24; // 1 hour
  let prev = jd;
  let prevBucket = start;
  for (let h = 1; h <= hoursAhead; h++) {
    const j = jd + h * dayStep;
    const b = bucketFn(j);
    if (b !== prevBucket) {
      // Bisect between `prev` and `j`.
      let lo = prev, hi = j;
      for (let i = 0; i < 25; i++) {
        const mid = (lo + hi) / 2;
        if (bucketFn(mid) === prevBucket) lo = mid; else hi = mid;
      }
      return hi;
    }
    prev = j;
    prevBucket = b;
  }
  return null;
}

// ─── Sunrise / Sunset / Moonrise / Moonset ────────────────────────────────
function riseTrans(jdStart: number, body: number, flag: number, lat: number, lng: number): Date | null {
  try {
    const res: any = swisseph.swe_rise_trans(
      jdStart, body, '',
      swisseph.SEFLG_SWIEPH, flag,
      lng, lat, 0, 0, 0,
    );
    if (res.error || res.transitTime == null) return null;
    return jdToDate(res.transitTime);
  } catch {
    return null;
  }
}

function dayTimes(date: Date, lat: number, lng: number) {
  const start = new Date(Date.UTC(
    date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0,
  ));
  const jdStart = dateToJD(start);
  return {
    sunrise: riseTrans(jdStart, swisseph.SE_SUN, swisseph.SE_CALC_RISE, lat, lng),
    sunset: riseTrans(jdStart, swisseph.SE_SUN, swisseph.SE_CALC_SET, lat, lng),
    moonrise: riseTrans(jdStart, swisseph.SE_MOON, swisseph.SE_CALC_RISE, lat, lng),
    moonset: riseTrans(jdStart, swisseph.SE_MOON, swisseph.SE_CALC_SET, lat, lng),
  };
}

// ─── Rahu / Gulika / Yamaghanda segments ──────────────────────────────────
const RAHU_KAAL_SEGMENT  = [8,2,7,5,6,4,3];
const GULIKA_SEGMENT     = [7,6,5,4,3,2,1];
const YAMAGHANDA_SEGMENT = [5,4,3,2,1,7,6];

function segmentTime(sunrise: Date, sunset: Date, segIdx1: number) {
  const total = sunset.getTime() - sunrise.getTime();
  const seg = total / 8;
  const start = new Date(sunrise.getTime() + (segIdx1 - 1) * seg);
  const end = new Date(start.getTime() + seg);
  return { start: start.toISOString(), end: end.toISOString() };
}

// ─── Karana for a half-tithi index (0..59) ────────────────────────────────
function karanaNameByHalf(halfIdx: number): string {
  const h = ((halfIdx % 60) + 60) % 60;
  if (h === 0) return KARANA_NAMES_FIXED[3]; // Kimstughna
  if (h >= 57) return KARANA_NAMES_FIXED[h - 57];
  return KARANA_NAMES_MOVABLE[(h - 1) % 7];
}

// ─── Masa & Samvat ────────────────────────────────────────────────────────
function lunarMasa(jd: number): { amanta: string; purnimanta: string } {
  // Solar rashi at the most-recent new moon determines the lunar month.
  // Find last Amavasya (tithi index 29 → 0 transition).
  let j = jd;
  for (let i = 0; i < 45; i++) {
    const t = tithiIndex(j);
    if (t === 29) break;
    j -= 1;
  }
  // Now walk backward to the exact transition into tithi 29.
  while (tithiIndex(j) !== 29 && j > jd - 45) j -= 0.25;
  const sunAtNewMoon = computeBody(j, swisseph.SE_SUN);
  const rashi = Math.floor(normDeg(sunAtNewMoon.longitude) / 30); // 0..11
  // Amanta month: month starts at new moon following the Sun entering that rashi.
  // Traditional mapping: rashi 11 (Pisces) → Chaitra, rashi 0 (Aries) → Vaishakha, etc.
  const amantaIdx = (rashi + 1) % 12;
  const amanta = AMANTA_MASA[amantaIdx];
  // Purnimanta month starts on the next-day-after-full-moon, so it's generally
  // the same name as the Amanta month that *contains* that full moon — which,
  // from the day after purnima until the next new moon, is the NEXT Amanta.
  const currentTithi = tithiIndex(jd);
  const isAfterPurnima = currentTithi >= 15; // Krishna paksha
  const purnimanta = isAfterPurnima ? AMANTA_MASA[(amantaIdx + 1) % 12] : amanta;
  return { amanta, purnimanta };
}

function samvatYears(date: Date): { vikram: number; shaka: number; kali: number } {
  const y = date.getUTCFullYear();
  // Vikram begins ~Chaitra Shukla Pratipada (March/April); use Apr cut-off.
  const isSecondHalf = (date.getUTCMonth() + 1) >= 4;
  const vikram = isSecondHalf ? y + 57 : y + 56;
  const shaka  = isSecondHalf ? y - 78 : y - 79;
  const kali   = isSecondHalf ? y + 3102 : y + 3101;
  return { vikram, shaka, kali };
}

// ─── PUBLIC ────────────────────────────────────────────────────────────────

export interface TimeRange { start: string; end: string }

export interface PanchangResult {
  date: string;
  lat: number;
  lng: number;

  vara: { num: number; name: string; lord: string; dishaShool: string };

  tithi: {
    num: number; name: string; paksha: string;
    elapsedFraction: number;
    endsAt: string | null;
    nextName: string;
  };

  nakshatra: {
    num: number; name: string; nameHi: string; lord: string; pada: number;
    deity: string; gana: string; yoni: string; varna: string; nadi: string;
    endsAt: string | null; nextName: string;
  };

  yoga:   { num: number; name: string; endsAt: string | null; nextName: string };
  karana: { num: number; name: string; endsAt: string | null; nextName: string };

  sun:  { longitude: number; rashi: string; rashiNum: number; degInRashi: number; nakshatra: string };
  moon: { longitude: number; rashi: string; rashiNum: number; degInRashi: number; nakshatra: string };

  ayana: 'Uttarayana' | 'Dakshinayana';
  ritu: string;
  masa: { amanta: string; purnimanta: string };
  samvat: { vikram: number; shaka: number; kali: number };

  sunrise: string | null;
  sunset:  string | null;
  moonrise: string | null;
  moonset:  string | null;

  // Auspicious
  brahmaMuhurat: TimeRange | null;
  abhijitMuhurat: TimeRange | null;
  godhuliMuhurat: TimeRange | null;
  amritKaal:      TimeRange | null;
  pratahSandhya:  TimeRange | null;
  sayamSandhya:   TimeRange | null;

  // Inauspicious
  rahuKaal:   TimeRange | null;
  gulika:     TimeRange | null;
  yamaghanda: TimeRange | null;
  varjyam:    TimeRange | null;
  durMuhurtam: TimeRange[];

  // Balas
  chandraBalaRashis: number[];       // rashi numbers favorable
  taraBalaFavorable: number[];       // nakshatra numbers favorable
  taraBalaInauspicious: number[];
}

export function calculatePanchang(dateInput: Date, lat: number, lng: number): PanchangResult {
  const times = dayTimes(dateInput, lat, lng);
  const refDate = times.sunrise ?? new Date(Date.UTC(
    dateInput.getUTCFullYear(), dateInput.getUTCMonth(), dateInput.getUTCDate(), 12, 0, 0,
  ));
  const jd = dateToJD(refDate);

  // Core bodies.
  const sun  = computeBody(jd, swisseph.SE_SUN);
  const moon = computeBody(jd, swisseph.SE_MOON);
  const sunR = rashiOf(sun.longitude);
  const moonR = rashiOf(moon.longitude);
  const sunNak = nakshatraOf(sun.longitude);
  const moonNak = nakshatraOf(moon.longitude);

  // Tithi, yoga, karana, nakshatra with end times.
  const tIdx = tithiIndex(jd);
  const tEnd = findTransition(jd, tithiIndex);
  const diff = normDeg(moon.longitude - sun.longitude);
  const tithi = {
    num: tIdx + 1,
    name: TITHI_NAMES[tIdx],
    paksha: tIdx < 15 ? 'Shukla' : 'Krishna',
    elapsedFraction: (diff % 12) / 12,
    endsAt: tEnd ? jdToDate(tEnd).toISOString() : null,
    nextName: TITHI_NAMES[(tIdx + 1) % 30],
  };

  const yIdx = yogaIndex(jd);
  const yEnd = findTransition(jd, yogaIndex);
  const yoga = {
    num: yIdx + 1,
    name: YOGA_NAMES[yIdx],
    endsAt: yEnd ? jdToDate(yEnd).toISOString() : null,
    nextName: YOGA_NAMES[(yIdx + 1) % 27],
  };

  const hIdx = halfTithiIndex(jd);
  const kEnd = findTransition(jd, halfTithiIndex);
  const karana = {
    num: hIdx + 1,
    name: karanaNameByHalf(hIdx),
    endsAt: kEnd ? jdToDate(kEnd).toISOString() : null,
    nextName: karanaNameByHalf(hIdx + 1),
  };

  const nIdx = nakIndex(jd);
  const nEnd = findTransition(jd, nakIndex);
  const meta = NAK_META[nIdx];
  const nakshatra = {
    num: moonNak.num,
    name: moonNak.name,
    nameHi: moonNak.nameHi,
    lord: moonNak.lord,
    pada: moonNak.pada,
    deity: meta.deity,
    gana: meta.gana,
    yoni: meta.yoni,
    varna: meta.varna,
    nadi: meta.nadi,
    endsAt: nEnd ? jdToDate(nEnd).toISOString() : null,
    nextName: NAKSHATRAS[(nIdx + 1) % 27].name,
  };

  const dow = refDate.getUTCDay();

  // Auspicious / inauspicious periods that need sunrise+sunset.
  let rahuKaal: TimeRange | null = null;
  let gulika: TimeRange | null = null;
  let yamaghanda: TimeRange | null = null;
  let abhijit: TimeRange | null = null;
  let brahma: TimeRange | null = null;
  let godhuli: TimeRange | null = null;
  let pratah: TimeRange | null = null;
  let sayam: TimeRange | null = null;
  let varjyam: TimeRange | null = null;
  let amrit: TimeRange | null = null;
  const durMuhurtam: TimeRange[] = [];

  if (times.sunrise && times.sunset) {
    const sr = times.sunrise;
    const ss = times.sunset;
    const dayLen = ss.getTime() - sr.getTime();
    rahuKaal   = segmentTime(sr, ss, RAHU_KAAL_SEGMENT[dow]);
    gulika     = segmentTime(sr, ss, GULIKA_SEGMENT[dow]);
    yamaghanda = segmentTime(sr, ss, YAMAGHANDA_SEGMENT[dow]);

    // Abhijit — 24 min around solar noon.
    const noon = new Date((sr.getTime() + ss.getTime()) / 2);
    abhijit = {
      start: new Date(noon.getTime() - 12 * 60 * 1000).toISOString(),
      end:   new Date(noon.getTime() + 12 * 60 * 1000).toISOString(),
    };

    // Brahma Muhurta — 96 min to 48 min before sunrise.
    brahma = {
      start: new Date(sr.getTime() - 96 * 60 * 1000).toISOString(),
      end:   new Date(sr.getTime() - 48 * 60 * 1000).toISOString(),
    };

    // Pratah Sandhya — 24 min bracketing sunrise.
    pratah = {
      start: new Date(sr.getTime() - 24 * 60 * 1000).toISOString(),
      end:   new Date(sr.getTime() + 24 * 60 * 1000).toISOString(),
    };
    // Sayam Sandhya — 24 min bracketing sunset.
    sayam = {
      start: new Date(ss.getTime() - 24 * 60 * 1000).toISOString(),
      end:   new Date(ss.getTime() + 24 * 60 * 1000).toISOString(),
    };
    // Godhuli — 24 min after sunset.
    godhuli = {
      start: ss.toISOString(),
      end:   new Date(ss.getTime() + 24 * 60 * 1000).toISOString(),
    };

    // Varjyam — starts at nakshatra-relative ghati offset, 96-min duration.
    if (nEnd) {
      const nakStartJd = findNakStart(jd);
      if (nakStartJd) {
        const nakDurMs = jdToDate(nEnd).getTime() - jdToDate(nakStartJd).getTime();
        const offset = (meta.varjyaGhati / 60) * nakDurMs;
        const vStart = jdToDate(nakStartJd).getTime() + offset;
        const vEnd = vStart + 96 * 60 * 1000;
        varjyam = { start: new Date(vStart).toISOString(), end: new Date(vEnd).toISOString() };
        // Amrit Kaal — ~6h after Varjya start, 96 min duration (traditional approximation).
        const aStart = vStart + 6 * 3600 * 1000;
        amrit = {
          start: new Date(aStart).toISOString(),
          end: new Date(aStart + 96 * 60 * 1000).toISOString(),
        };
      }
    }

    // Dur Muhurtam — weekday-specific bad muhurtas, each 48 min.
    // 15 muhurtas from sunrise to sunset; indices per Vedic tables:
    const DUR_MUHURTA: Record<number, number[]> = {
      0: [14],           // Sun
      1: [12, 14],       // Mon
      2: [4, 9],         // Tue
      3: [8],            // Wed
      4: [9],            // Thu
      5: [5, 9],         // Fri
      6: [2],            // Sat
    };
    const muhurtaLen = dayLen / 15;
    for (const idx of DUR_MUHURTA[dow] ?? []) {
      const s = new Date(sr.getTime() + (idx - 1) * muhurtaLen);
      const e = new Date(s.getTime() + muhurtaLen);
      durMuhurtam.push({ start: s.toISOString(), end: e.toISOString() });
    }
  }

  const ayana: 'Uttarayana' | 'Dakshinayana' =
    sun.longitude >= 270 || sun.longitude < 90 ? 'Uttarayana' : 'Dakshinayana';
  const ritu = rituFromSunRashi(sunR.num);
  const masa = lunarMasa(jd);
  const samvat = samvatYears(refDate);

  const chandraBalaRashis = chandraBalaFor(moonR.num);
  const tara = taraBalaFor(moonNak.num);

  void computeAllGrahas; // kept for future expansion

  return {
    date: refDate.toISOString(),
    lat, lng,
    vara: {
      num: dow + 1,
      name: VARA_NAMES[dow],
      lord: VARA_LORDS[dow],
      dishaShool: DISHA_SHOOL[dow],
    },
    tithi,
    nakshatra,
    yoga,
    karana,
    sun: {
      longitude: sun.longitude,
      rashi: sunR.name,
      rashiNum: sunR.num,
      degInRashi: sunR.deg,
      nakshatra: sunNak.name,
    },
    moon: {
      longitude: moon.longitude,
      rashi: moonR.name,
      rashiNum: moonR.num,
      degInRashi: moonR.deg,
      nakshatra: moonNak.name,
    },
    ayana,
    ritu,
    masa,
    samvat,
    sunrise: times.sunrise?.toISOString() ?? null,
    sunset:  times.sunset?.toISOString() ?? null,
    moonrise: times.moonrise?.toISOString() ?? null,
    moonset:  times.moonset?.toISOString() ?? null,
    brahmaMuhurat: brahma,
    abhijitMuhurat: abhijit,
    godhuliMuhurat: godhuli,
    amritKaal: amrit,
    pratahSandhya: pratah,
    sayamSandhya: sayam,
    rahuKaal,
    gulika,
    yamaghanda,
    varjyam,
    durMuhurtam,
    chandraBalaRashis,
    taraBalaFavorable: tara.favorable,
    taraBalaInauspicious: tara.inauspicious,
  };
}

/** Walk backward to find when the Moon entered the current nakshatra. */
function findNakStart(jd: number): number | null {
  const cur = nakIndex(jd);
  const step = 1 / 24;
  let j = jd;
  for (let h = 0; h < 28; h++) {
    const prev = j - step;
    if (nakIndex(prev) !== cur) {
      // bisect
      let lo = prev, hi = j;
      for (let i = 0; i < 25; i++) {
        const mid = (lo + hi) / 2;
        if (nakIndex(mid) === cur) hi = mid; else lo = mid;
      }
      return hi;
    }
    j = prev;
  }
  return null;
}

// Ensure tree-shake doesn't drop unused import.
void RASHIS;
