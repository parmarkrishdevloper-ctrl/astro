// Upagrahas — shadow planets / sensitive points used in classical
// Vedic astrology alongside the main nine grahas.
//
// Two families:
//
//   1. Kala / Mrityu group (derived from Sun's longitude, Parashara):
//        Dhuma      = Sun + 133°20'
//        Vyatipata  = 360° − Dhuma
//        Parivesha  = Vyatipata + 180°
//        Indrachapa = 360° − Parivesha
//        Upaketu    = Indrachapa + 16°40'
//
//   2. Gulika / Mandi group (depend on time of birth + sunrise/sunset):
//        Day birth  — divide daylight into 8 equal parts ruled in sequence
//                     by planets starting from the weekday lord. Saturn's
//                     slot is the "Gulika/Mandi portion". Gulika = ascendant
//                     at the START of that portion, Mandi = ascendant at
//                     the MIDDLE (some traditions use end; we expose both).
//        Night birth — analogous, with night divided into 8 parts ruled
//                      from the lord of the 5th weekday onward.
//
// Interpretation: Gulika and Mandi are the most potent malefic sensitive
// points; their house position is said to carry Saturn-like afflictive
// influence. Dhuma/Vyatipata etc. are minor malefic shadow points used
// in muhurta and annual (Tajika) analysis.

import swisseph from 'swisseph';
import { dateToJD, toUTC } from '../utils/julian';
import { normDeg, rashiOf, nakshatraOf, houseOf, RASHIS } from '../utils/astro-constants';
import { computeAscendant } from './ephemeris.service';
import { KundaliResult } from './kundali.service';

const { SEFLG_SWIEPH, SE_CALC_RISE, SE_CALC_SET, SE_SUN } = swisseph;

// ─── Sunrise / Sunset (mirror of panchang helper, kept local) ──────────────
function computeSunriseSunset(date: Date, lat: number, lng: number): { sunrise: Date | null; sunset: Date | null } {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  const jdStart = dateToJD(start);

  function rise(flag: number): Date | null {
    try {
      const res: any = swisseph.swe_rise_trans(jdStart, SE_SUN, '', SEFLG_SWIEPH, flag, lng, lat, 0, 0, 0);
      if (res.error || res.transitTime == null) return null;
      const r: any = swisseph.swe_revjul(res.transitTime, swisseph.SE_GREG_CAL);
      const intH = Math.floor(r.hour);
      const minF = (r.hour - intH) * 60;
      const intM = Math.floor(minF);
      const intS = Math.round((minF - intM) * 60);
      return new Date(Date.UTC(r.year, r.month - 1, r.day, intH, intM, intS));
    } catch { return null; }
  }

  return { sunrise: rise(SE_CALC_RISE), sunset: rise(SE_CALC_SET) };
}

// ─── Weekday-specific order of ruling planets over the 8 diurnal parts ─────
// Parashara's kaala-vibhaga: each weekday, daylight is ruled by this ordered
// sequence of 7 planets (first 7 of 8 parts). The 8th part is ownerless
// (some traditions assign it to "Sani again" or leave it void — we treat it
// as void here since it does not affect Gulika location).
const DAY_ORDER: Record<number, (keyof typeof PLANET_IDS)[]> = {
  0: ['SU','VE','ME','MO','SA','JU','MA'], // Sunday starts with Sun
  1: ['MO','SA','JU','MA','SU','VE','ME'], // Monday starts with Moon
  2: ['MA','SU','VE','ME','MO','SA','JU'],
  3: ['ME','MO','SA','JU','MA','SU','VE'],
  4: ['JU','MA','SU','VE','ME','MO','SA'],
  5: ['VE','ME','MO','SA','JU','MA','SU'],
  6: ['SA','JU','MA','SU','VE','ME','MO'], // Saturday starts with Saturn
};

// Night order — starts with the lord of the 5th weekday from the day lord.
// (Sunday night → Jupiter first; Monday night → Venus first; …)
const NIGHT_ORDER: Record<number, (keyof typeof PLANET_IDS)[]> = {
  0: ['JU','MA','SU','VE','ME','MO','SA'],
  1: ['VE','ME','MO','SA','JU','MA','SU'],
  2: ['SA','JU','MA','SU','VE','ME','MO'],
  3: ['SU','VE','ME','MO','SA','JU','MA'],
  4: ['MO','SA','JU','MA','SU','VE','ME'],
  5: ['MA','SU','VE','ME','MO','SA','JU'],
  6: ['ME','MO','SA','JU','MA','SU','VE'],
};

const PLANET_IDS = { SU:0, MO:1, MA:2, ME:3, JU:4, VE:5, SA:6 } as const;

// ─── Types ─────────────────────────────────────────────────────────────────
export interface UpagrahaPoint {
  id: string;
  name: string;
  longitude: number;
  rashi: { num: number; name: string; degInRashi: number };
  nakshatra: { num: number; name: string; pada: number };
  house: number;
  formula: string;              // human-readable derivation
}

export interface UpagrahaResult {
  /** Dhuma, Vyatipata, Parivesha, Indrachapa, Upaketu (Sun-derived chain) */
  kalaGroup: UpagrahaPoint[];
  /** Gulika, Mandi — birth-time + sunrise/sunset dependent */
  gulika: UpagrahaPoint | null;
  mandi: UpagrahaPoint | null;
  /** Debug: which segment of daylight/night Saturn rules */
  saturnSegment: {
    isDayBirth: boolean;
    segmentNumber: number | null;   // 1..7 (or null if Saturn has no segment)
    startUTC: string | null;
    midUTC: string | null;
    endUTC: string | null;
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function describePoint(id: string, name: string, lng: number, ascLng: number, formula: string): UpagrahaPoint {
  const r = rashiOf(lng);
  const n = nakshatraOf(lng);
  return {
    id, name,
    longitude: lng,
    rashi: { num: r.num, name: r.name, degInRashi: r.deg },
    nakshatra: { num: n.num, name: n.name, pada: n.pada },
    house: houseOf(lng, ascLng),
    formula,
  };
}

function saturnSlotIndex(dayOfWeek: number, isDay: boolean): number | null {
  const order = isDay ? DAY_ORDER[dayOfWeek] : NIGHT_ORDER[dayOfWeek];
  const idx = order.indexOf('SA');
  return idx >= 0 ? idx : null;
}

// ─── Main ──────────────────────────────────────────────────────────────────
export function computeUpagrahas(k: KundaliResult): UpagrahaResult {
  const ascLng = k.ascendant.longitude;
  const sunLng = k.planets.find((p) => p.id === 'SU')!.longitude;

  // Kala group — deterministic chain from Sun.
  const dhuma      = normDeg(sunLng + 133 + 20/60);
  const vyatipata  = normDeg(360 - dhuma);
  const parivesha  = normDeg(vyatipata + 180);
  const indrachapa = normDeg(360 - parivesha);
  const upaketu    = normDeg(indrachapa + 16 + 40/60);
  const kalaGroup: UpagrahaPoint[] = [
    describePoint('DHUMA',      'Dhuma',      dhuma,      ascLng, "Sun + 133°20'"),
    describePoint('VYATIPATA',  'Vyatipata',  vyatipata,  ascLng, "360° − Dhuma"),
    describePoint('PARIVESHA',  'Parivesha',  parivesha,  ascLng, "Vyatipata + 180°"),
    describePoint('INDRACHAPA', 'Indrachapa', indrachapa, ascLng, "360° − Parivesha"),
    describePoint('UPAKETU',    'Upaketu',    upaketu,    ascLng, "Indrachapa + 16°40'"),
  ];

  // Gulika / Mandi — require sunrise, sunset, weekday, and birth time.
  const birthUTC = toUTC(k.input.datetime, k.input.tzOffsetHours);
  const sRS = computeSunriseSunset(birthUTC, k.input.lat, k.input.lng);
  let gulika: UpagrahaPoint | null = null;
  let mandi: UpagrahaPoint | null = null;
  let saturnSegment: UpagrahaResult['saturnSegment'] = {
    isDayBirth: false, segmentNumber: null, startUTC: null, midUTC: null, endUTC: null,
  };

  if (sRS.sunrise && sRS.sunset) {
    const bt = birthUTC.getTime();
    const sr = sRS.sunrise.getTime();
    const ss = sRS.sunset.getTime();
    const isDay = bt >= sr && bt < ss;

    // Day-of-week at sunrise (or at sunset for night birth) determines order
    const refBoundary = isDay ? sRS.sunrise : sRS.sunset;
    // Use local weekday by adjusting with the TZ offset
    const tzMinutes = ((k.input.tzOffsetHours ?? 0) * 60);
    const local = new Date(refBoundary.getTime() + tzMinutes * 60000);
    const dow = local.getUTCDay(); // 0..6 Sun..Sat

    const segIdx = saturnSlotIndex(dow, isDay);
    if (segIdx != null) {
      const windowStart = isDay ? sr : ss;
      const windowEnd   = isDay ? ss : sr + 24 * 3600 * 1000; // next sunrise approximation
      const total = windowEnd - windowStart;
      const segLen = total / 8;
      const segStart = new Date(windowStart + segIdx * segLen);
      const segMid   = new Date(segStart.getTime() + segLen / 2);
      const segEnd   = new Date(segStart.getTime() + segLen);

      // Gulika lng = ascendant at segment start; Mandi lng = ascendant at midpoint
      const ascAtStart = computeAscendant(dateToJD(segStart), k.input.lat, k.input.lng).ascendant;
      const ascAtMid   = computeAscendant(dateToJD(segMid),   k.input.lat, k.input.lng).ascendant;

      gulika = describePoint('GULIKA', 'Gulika', ascAtStart, ascLng, "Ascendant @ start of Saturn's portion");
      mandi  = describePoint('MANDI',  'Mandi',  ascAtMid,   ascLng, "Ascendant @ middle of Saturn's portion");

      saturnSegment = {
        isDayBirth: isDay,
        segmentNumber: segIdx + 1,
        startUTC: segStart.toISOString(),
        midUTC:   segMid.toISOString(),
        endUTC:   segEnd.toISOString(),
      };
    }
  }

  return { kalaGroup, gulika, mandi, saturnSegment };
}
