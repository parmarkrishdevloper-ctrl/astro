import { swisseph, initEphemeris, AYANAMSA_MAP, HOUSE_SYSTEM_MAP, setAyanamsa } from '../config/ephemeris';
import { VEDIC_PLANETS, PlanetId, normDeg } from '../utils/astro-constants';

const SEFLG_SIDEREAL = swisseph.SEFLG_SIDEREAL;
const SEFLG_SPEED = swisseph.SEFLG_SPEED;

export interface RawPosition {
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  retrograde: boolean;
}

/** Compute one body's position at jdUT. Sidereal by default; pass tropical=true
 *  to drop SEFLG_SIDEREAL and return tropical (Western) longitudes. */
export function computeBody(
  jdUT: number, swephId: number, tropical = false,
): RawPosition {
  initEphemeris();
  const base = tropical ? SEFLG_SPEED : (SEFLG_SIDEREAL | SEFLG_SPEED);
  const res: any = swisseph.swe_calc_ut(jdUT, swephId, base);
  if (res.error) throw new Error(res.error);
  return {
    longitude: normDeg(res.longitude),
    latitude: res.latitude,
    distance: res.distance,
    speed: res.longitudeSpeed,
    retrograde: res.longitudeSpeed < 0,
  };
}

/** Compute all 9 grahas; Ketu = Rahu + 180. Returns by PlanetId. */
export function computeAllGrahas(
  jdUT: number, tropical = false,
): Record<PlanetId, RawPosition> {
  const out = {} as Record<PlanetId, RawPosition>;
  for (const p of VEDIC_PLANETS) {
    if (p.computed) continue;
    out[p.id] = computeBody(jdUT, p.swephId, tropical);
  }
  const rahu = out.RA;
  out.KE = {
    longitude: normDeg(rahu.longitude + 180),
    latitude: -rahu.latitude,
    distance: rahu.distance,
    speed: rahu.speed,
    retrograde: true, // nodes are conventionally retrograde
  };
  // Rahu (true node) is also conventionally retrograde
  out.RA.retrograde = true;
  return out;
}

/** Ascendant + cusps using the given house system (default Placidus).
 *  Sidereal by default; tropical=true returns tropical cusps. */
export function computeAscendant(
  jdUT: number, lat: number, lng: number,
  houseSystem: string = 'placidus',
  tropical = false,
): {
  ascendant: number;
  mc: number;
  cusps: number[]; // 12 house cusps in the chosen zodiac
} {
  initEphemeris();
  const code = HOUSE_SYSTEM_MAP[houseSystem] ?? 'P';
  const flags = tropical ? 0 : SEFLG_SIDEREAL;
  const res: any = swisseph.swe_houses_ex(jdUT, flags, lat, lng, code);
  if (res.error) throw new Error(res.error);
  const cuspsRaw: number[] = res.house ?? res.houses ?? [];
  const cusps: number[] =
    cuspsRaw.length === 13 ? cuspsRaw.slice(1) : cuspsRaw.slice(0, 12);
  return {
    ascendant: normDeg(res.ascendant),
    mc: normDeg(res.mc),
    cusps: cusps.map(normDeg),
  };
}

/** Apply a per-request ayanamsa override; remembers & restores the default.
 *  Guard uses `in` because some sid-mode constants are 0 (Fagan-Bradley). */
export function withAyanamsa<T>(key: string | undefined, fn: () => T): T {
  if (!key || !(key in AYANAMSA_MAP)) return fn();
  setAyanamsa(key);
  try { return fn(); }
  finally { setAyanamsa('lahiri'); }
}

/** Current ayanamsa value in degrees at jdUT (e.g. ~24.x for Lahiri 2025). */
export function getAyanamsa(jdUT: number): number {
  initEphemeris();
  return swisseph.swe_get_ayanamsa_ut(jdUT);
}

export { AYANAMSA_MAP };
