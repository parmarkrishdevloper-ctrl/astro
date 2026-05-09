// Live panchang — a "right-now" snapshot with countdowns, progress bars, and
// ayana/ritu/masa progress. Calls calculatePanchang for the day-anchored fields
// (sunrise, auspicious times, masa, samvat, balas) and then overwrites the
// moment-sensitive fields (tithi/nakshatra/yoga/karana endsAt + countdowns)
// using `now` as the reference JD. That way the countdown is always positive
// and refers to the next transition *after now*.

import { calculatePanchang, PanchangResult } from './panchang.service';
import { computeBody } from './ephemeris.service';
import { swisseph } from '../config/ephemeris';
import { dateToJD, jdToDate } from '../utils/julian';
import { normDeg, NAK_SPAN, NAKSHATRAS } from '../utils/astro-constants';

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
const KARANA_MOV = ['Bava','Balava','Kaulava','Taitila','Garaja','Vanija','Vishti'];
const KARANA_FIX = ['Shakuni','Chatushpada','Naga','Kimstughna'];

export interface LivePanchang extends PanchangResult {
  now: string;
  countdowns: {
    tithiMs: number | null;
    nakshatraMs: number | null;
    yogaMs: number | null;
    karanaMs: number | null;
    sunriseMs: number | null;
    sunsetMs:  number | null;
  };
  progress: {
    tithi: number;
    nakshatra: number;
    yoga: number;
    ayana: number;
    ritu: number;
    masa: number;
  };
  solarMarkers: {
    ayanaStartDeg: number;
    ayanaEndDeg:   number;
    rituStartDeg:  number;
    rituEndDeg:    number;
    sunDeg:        number;
  };
}

function tithiIndexAt(jd: number): number {
  const s = computeBody(jd, swisseph.SE_SUN);
  const m = computeBody(jd, swisseph.SE_MOON);
  return Math.floor(normDeg(m.longitude - s.longitude) / 12);
}
function halfTithiIndexAt(jd: number): number {
  const s = computeBody(jd, swisseph.SE_SUN);
  const m = computeBody(jd, swisseph.SE_MOON);
  return Math.floor(normDeg(m.longitude - s.longitude) / 6);
}
function yogaIndexAt(jd: number): number {
  const s = computeBody(jd, swisseph.SE_SUN);
  const m = computeBody(jd, swisseph.SE_MOON);
  return Math.floor(normDeg(s.longitude + m.longitude) / NAK_SPAN);
}
function nakIndexAt(jd: number): number {
  const m = computeBody(jd, swisseph.SE_MOON);
  return Math.floor(normDeg(m.longitude) / NAK_SPAN);
}

function findTransition(jd: number, bucketFn: (j: number) => number, hoursAhead = 48): number | null {
  const start = bucketFn(jd);
  const step = 1 / 24;
  let prev = jd, prevBucket = start;
  for (let h = 1; h <= hoursAhead; h++) {
    const j = jd + h * step;
    const b = bucketFn(j);
    if (b !== prevBucket) {
      let lo = prev, hi = j;
      for (let i = 0; i < 25; i++) {
        const mid = (lo + hi) / 2;
        if (bucketFn(mid) === prevBucket) lo = mid; else hi = mid;
      }
      return hi;
    }
    prev = j; prevBucket = b;
  }
  return null;
}

function karanaNameByHalf(halfIdx: number): string {
  const h = ((halfIdx % 60) + 60) % 60;
  if (h === 0) return KARANA_FIX[3];
  if (h >= 57) return KARANA_FIX[h - 57];
  return KARANA_MOV[(h - 1) % 7];
}

function nakshatraFraction(moonDeg: number): number {
  return (normDeg(moonDeg) % NAK_SPAN) / NAK_SPAN;
}
function yogaFraction(sunDeg: number, moonDeg: number): number {
  return (normDeg(sunDeg + moonDeg) % NAK_SPAN) / NAK_SPAN;
}
function tithiFraction(sunDeg: number, moonDeg: number): number {
  return (normDeg(moonDeg - sunDeg) % 12) / 12;
}

function ayanaProgress(sunDeg: number): { frac: number; startDeg: number; endDeg: number } {
  if (sunDeg >= 270 || sunDeg < 90) {
    const since = sunDeg >= 270 ? sunDeg - 270 : sunDeg + 90;
    return { frac: since / 180, startDeg: 270, endDeg: 90 };
  }
  return { frac: (sunDeg - 90) / 180, startDeg: 90, endDeg: 270 };
}
function rituProgress(sunDeg: number): { frac: number; startDeg: number; endDeg: number } {
  const rashi = Math.floor(sunDeg / 30);
  const rituStart = Math.floor(rashi / 2) * 2 * 30;
  return { frac: (sunDeg - rituStart) / 60, startDeg: rituStart, endDeg: rituStart + 60 };
}
function masaProgress(sunDeg: number, moonDeg: number): number {
  return normDeg(moonDeg - sunDeg) / 360;
}

export function calculateLivePanchang(now: Date, lat: number, lng: number): LivePanchang {
  const pan = calculatePanchang(now, lat, lng);
  const nowMs = now.getTime();
  const jd = dateToJD(now);

  const sun  = computeBody(jd, swisseph.SE_SUN);
  const moon = computeBody(jd, swisseph.SE_MOON);
  const sunDeg  = normDeg(sun.longitude);
  const moonDeg = normDeg(moon.longitude);

  // Live transitions anchored at `now`.
  const tIdx = tithiIndexAt(jd);
  const tEnd = findTransition(jd, tithiIndexAt);
  const liveTithi = {
    num: tIdx + 1,
    name: TITHI_NAMES[tIdx],
    paksha: tIdx < 15 ? 'Shukla' : 'Krishna',
    elapsedFraction: tithiFraction(sunDeg, moonDeg),
    endsAt: tEnd ? jdToDate(tEnd).toISOString() : null,
    nextName: TITHI_NAMES[(tIdx + 1) % 30],
  };

  const yIdx = yogaIndexAt(jd);
  const yEnd = findTransition(jd, yogaIndexAt);
  const liveYoga = {
    num: yIdx + 1,
    name: YOGA_NAMES[yIdx],
    endsAt: yEnd ? jdToDate(yEnd).toISOString() : null,
    nextName: YOGA_NAMES[(yIdx + 1) % 27],
  };

  const hIdx = halfTithiIndexAt(jd);
  const kEnd = findTransition(jd, halfTithiIndexAt);
  const liveKarana = {
    num: hIdx + 1,
    name: karanaNameByHalf(hIdx),
    endsAt: kEnd ? jdToDate(kEnd).toISOString() : null,
    nextName: karanaNameByHalf(hIdx + 1),
  };

  const nIdx = nakIndexAt(jd);
  const nEnd = findTransition(jd, nakIndexAt);
  const liveNak = {
    ...pan.nakshatra,
    num: nIdx + 1,
    name: NAKSHATRAS[nIdx].name,
    endsAt: nEnd ? jdToDate(nEnd).toISOString() : null,
    nextName: NAKSHATRAS[(nIdx + 1) % 27].name,
  };

  const tithiMs     = liveTithi.endsAt     ? Date.parse(liveTithi.endsAt)     - nowMs : null;
  const nakshatraMs = liveNak.endsAt       ? Date.parse(liveNak.endsAt)       - nowMs : null;
  const yogaMs      = liveYoga.endsAt      ? Date.parse(liveYoga.endsAt)      - nowMs : null;
  const karanaMs    = liveKarana.endsAt    ? Date.parse(liveKarana.endsAt)    - nowMs : null;
  const sunriseMs   = pan.sunrise          ? Date.parse(pan.sunrise)          - nowMs : null;
  const sunsetMs    = pan.sunset           ? Date.parse(pan.sunset)           - nowMs : null;

  const ayana = ayanaProgress(sunDeg);
  const ritu  = rituProgress(sunDeg);

  return {
    ...pan,
    tithi: liveTithi,
    nakshatra: liveNak,
    yoga: liveYoga,
    karana: liveKarana,
    now: now.toISOString(),
    countdowns: { tithiMs, nakshatraMs, yogaMs, karanaMs, sunriseMs, sunsetMs },
    progress: {
      tithi:     liveTithi.elapsedFraction,
      nakshatra: nakshatraFraction(moonDeg),
      yoga:      yogaFraction(sunDeg, moonDeg),
      ayana:     ayana.frac,
      ritu:      ritu.frac,
      masa:      masaProgress(sunDeg, moonDeg),
    },
    solarMarkers: {
      ayanaStartDeg: ayana.startDeg,
      ayanaEndDeg:   ayana.endDeg,
      rituStartDeg:  ritu.startDeg,
      rituEndDeg:    ritu.endDeg,
      sunDeg,
    },
  };
}
