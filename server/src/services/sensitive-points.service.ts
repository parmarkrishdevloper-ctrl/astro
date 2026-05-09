// Sensitive points — extra reference longitudes used across traditions.
//
//   • Lot of Fortune (Pars Fortunae) — Hellenistic. Day: Asc + Moon − Sun.
//     Night: Asc + Sun − Moon (reversed). Indicator of material flow.
//   • Lot of Spirit (Pars Daemon) — reverse formulation of Fortune. Indicator
//     of career / professional impulse.
//   • Bhrigu Bindu — midpoint of Moon & Rahu. Core of Bhrigu Nadi; event
//     triggers when transit/dasha lord conjoins this point.
//   • Vertex — secondary angle from swisseph; "fated encounters" (Western).
//   • Arka / Surya Lagna — lagna-equivalent measured from Sun (Sun at 1st).
//   • Chandra Lagna — lagna from Moon.
//   • Pre-natal eclipse (solar / lunar) — Sun's longitude at the most recent
//     eclipse before birth. Used in longevity & classical Indian tantra.
//
// All longitudes are sidereal (Lahiri), matching the rest of the engine.

import swisseph from 'swisseph';
import { KundaliResult } from './kundali.service';
import { dateToJD, toUTC } from '../utils/julian';
import { getAyanamsa } from './ephemeris.service';
import { normDeg, rashiOf, nakshatraOf, houseOf } from '../utils/astro-constants';

const { SEFLG_SIDEREAL, SEFLG_SWIEPH } = swisseph;

export interface SensitivePoint {
  id: string;
  name: string;
  longitude: number;
  rashi: { num: number; name: string; degInRashi: number };
  nakshatra: { num: number; name: string; pada: number };
  house: number;
  description: string;
}

export interface PreNatalEclipse {
  type: 'solar' | 'lunar';
  utc: string;
  sunLongitude: number;
  moonLongitude: number;
  rashiSun: { num: number; name: string };
  rashiMoon: { num: number; name: string };
  daysBeforeBirth: number;
}

export interface SensitivePointsResult {
  isDayBirth: boolean;
  points: SensitivePoint[];
  preNatalEclipses: {
    solar: PreNatalEclipse | null;
    lunar: PreNatalEclipse | null;
  };
}

function descFromLongitude(id: string, name: string, lng: number, ascLng: number, description: string): SensitivePoint {
  const L = normDeg(lng);
  const r = rashiOf(L);
  const n = nakshatraOf(L);
  return {
    id, name,
    longitude: L,
    rashi: { num: r.num, name: r.name, degInRashi: r.deg },
    nakshatra: { num: n.num, name: n.name, pada: n.pada },
    house: houseOf(L, ascLng),
    description,
  };
}

/** Find the nearest eclipse before jdUT. Returns sidereal longitudes at that
 *  moment. Uses swe_sol_eclipse_when_glob / swe_lun_eclipse_when with the
 *  backward flag. */
function findPreviousEclipse(jdUT: number, kind: 'solar' | 'lunar'): PreNatalEclipse | null {
  try {
    const fn: any = kind === 'solar' ? swisseph.swe_sol_eclipse_when_glob : swisseph.swe_lun_eclipse_when;
    const res: any = fn(jdUT, SEFLG_SWIEPH, 0, true); // backward = true
    if (res.error) return null;
    const tMax: number | undefined = res.tMax ?? res.tmax ?? (Array.isArray(res.tret) ? res.tret[0] : undefined);
    if (tMax == null) return null;

    const ayan = getAyanamsa(tMax);
    const sunTrop: any = swisseph.swe_calc_ut(tMax, swisseph.SE_SUN, SEFLG_SWIEPH);
    const moonTrop: any = swisseph.swe_calc_ut(tMax, swisseph.SE_MOON, SEFLG_SWIEPH);
    const sunLng  = normDeg((sunTrop.longitude ?? sunTrop.data?.[0]) - ayan);
    const moonLng = normDeg((moonTrop.longitude ?? moonTrop.data?.[0]) - ayan);

    // JD → calendar date
    const r: any = swisseph.swe_revjul(tMax, swisseph.SE_GREG_CAL);
    const intH = Math.floor(r.hour);
    const minF = (r.hour - intH) * 60;
    const intM = Math.floor(minF);
    const intS = Math.round((minF - intM) * 60);
    const when = new Date(Date.UTC(r.year, r.month - 1, r.day, intH, intM, intS));
    const daysBefore = (jdUT - tMax);

    return {
      type: kind,
      utc: when.toISOString(),
      sunLongitude: sunLng,
      moonLongitude: moonLng,
      rashiSun:  { num: rashiOf(sunLng).num,  name: rashiOf(sunLng).name },
      rashiMoon: { num: rashiOf(moonLng).num, name: rashiOf(moonLng).name },
      daysBeforeBirth: Math.round(daysBefore * 1000) / 1000,
    };
  } catch {
    return null;
  }
}

export function computeSensitivePoints(k: KundaliResult): SensitivePointsResult {
  const asc = k.ascendant.longitude;
  const sun = k.planets.find((p) => p.id === 'SU')!.longitude;
  const moon = k.planets.find((p) => p.id === 'MO')!.longitude;
  const rahu = k.planets.find((p) => p.id === 'RA')!.longitude;

  // Day vs night: whether the Sun is above the horizon. For simplicity we
  // approximate by checking Sun's natal house (7..12 means above, 1..6 below
  // — in whole-sign). Hellenistic tradition uses house 7..12 = day sect.
  const sunHouse = k.planets.find((p) => p.id === 'SU')!.house;
  const isDayBirth = sunHouse >= 7 && sunHouse <= 12;

  const lotFortune = isDayBirth
    ? normDeg(asc + moon - sun)
    : normDeg(asc + sun - moon);
  const lotSpirit = isDayBirth
    ? normDeg(asc + sun - moon)
    : normDeg(asc + moon - sun);

  // Bhrigu Bindu — midpoint of Moon and Rahu on the forward arc Moon → Rahu.
  const fwd = (rahu - moon + 360) % 360;
  const bhriguBindu = normDeg(moon + fwd / 2);

  // Vertex — extracted from swe_houses_ex (sidereal).
  const utcDate = toUTC(k.input.datetime, k.input.tzOffsetHours);
  const jd = dateToJD(utcDate);
  let vertex: number | null = null;
  try {
    const hRes: any = swisseph.swe_houses_ex(jd, SEFLG_SIDEREAL, k.input.lat, k.input.lng, 'P');
    vertex = typeof hRes.vertex === 'number' ? normDeg(hRes.vertex) : null;
  } catch { /* ignore */ }

  // Arka Lagna = 0° of Sun's sign as new 1st house (effectively sun's rashi
  // start). Chandra Lagna = 0° of Moon's sign.
  const arkaLagna = normDeg(Math.floor(sun / 30) * 30);
  const chandraLagna = normDeg(Math.floor(moon / 30) * 30);

  const points: SensitivePoint[] = [
    descFromLongitude('LOT_FORTUNE', 'Lot of Fortune', lotFortune, asc,
      isDayBirth ? 'Asc + Moon − Sun (day)' : 'Asc + Sun − Moon (night)'),
    descFromLongitude('LOT_SPIRIT', 'Lot of Spirit', lotSpirit, asc,
      isDayBirth ? 'Asc + Sun − Moon (day)' : 'Asc + Moon − Sun (night)'),
    descFromLongitude('BHRIGU_BINDU', 'Bhrigu Bindu', bhriguBindu, asc,
      'Midpoint of Moon and Rahu (forward arc)'),
    descFromLongitude('ARKA_LAGNA', 'Arka (Surya) Lagna', arkaLagna, asc,
      "0° of Sun's sign — lagna counted from Sun"),
    descFromLongitude('CHANDRA_LAGNA', 'Chandra Lagna', chandraLagna, asc,
      "0° of Moon's sign — lagna counted from Moon"),
  ];
  if (vertex != null) {
    points.push(descFromLongitude('VERTEX', 'Vertex', vertex, asc,
      'Secondary angle from Placidus houses (fated encounters)'));
  }

  // Pre-natal eclipses
  const solar = findPreviousEclipse(jd, 'solar');
  const lunar = findPreviousEclipse(jd, 'lunar');

  return { isDayBirth, points, preNatalEclipses: { solar, lunar } };
}
