import {
  VEDIC_PLANETS,
  PlanetId,
  RASHIS,
  rashiOf,
  nakshatraOf,
  houseOf,
  EXALTATION,
  COMBUSTION_DEG,
  normDeg,
} from '../utils/astro-constants';
import { dateToJD, toUTC } from '../utils/julian';
import {
  computeAllGrahas,
  computeAscendant,
  getAyanamsa,
  withAyanamsa,
  RawPosition,
} from './ephemeris.service';
import { LRU } from '../utils/lru';

// Memoize chart calculations — same birth input always yields the same chart,
// so we can cache aggressively. Capacity 500 is enough for typical workloads.
const kundaliCache = new LRU<KundaliResult>(500);

function cacheKey(input: BirthInput): string {
  return [
    input.datetime,
    input.tzOffsetHours ?? '',
    input.lat.toFixed(4),
    input.lng.toFixed(4),
    input.options?.ayanamsa ?? 'lahiri',
    input.options?.houseSystem ?? 'placidus',
    input.options?.tropical ? 'trop' : 'sid',
  ].join('|');
}

export function clearKundaliCache(): void {
  kundaliCache.clear();
}

export function kundaliCacheSize(): number {
  return kundaliCache.size;
}

export interface BirthInput {
  /** ISO 8601 — either with explicit offset, or naive + tzOffsetHours */
  datetime: string;
  tzOffsetHours?: number;
  lat: number;
  lng: number;
  placeName?: string;
  /** Chart calculation options. Omit for defaults (Lahiri, Placidus, sidereal). */
  options?: {
    ayanamsa?: string;       // key into AYANAMSA_MAP
    houseSystem?: string;    // key into HOUSE_SYSTEM_MAP
    /** When true, return tropical (Western) positions. Ayanamsa is ignored. */
    tropical?: boolean;
  };
}

export interface PlanetPosition {
  id: PlanetId;
  name: string;
  nameHi: string;
  longitude: number;          // sidereal
  speed: number;
  retrograde: boolean;
  rashi: { num: number; name: string; nameHi: string; degInRashi: number };
  nakshatra: { num: number; name: string; nameHi: string; lord: PlanetId; pada: number };
  house: number;              // 1..12 (whole-sign from Lagna)
  exalted: boolean;
  debilitated: boolean;
  combust: boolean;
  ownSign: boolean;
}

export interface KundaliResult {
  input: BirthInput;
  utc: string;
  jd: number;
  ayanamsa: { name: string; valueDeg: number; mode: 'sidereal' | 'tropical' };
  houseSystem: string;
  ascendant: {
    longitude: number;
    rashi: { num: number; name: string; nameHi: string; degInRashi: number };
    nakshatra: { num: number; name: string; nameHi: string; lord: PlanetId; pada: number };
  };
  houses: { num: number; rashiNum: number; rashiName: string; lord: PlanetId; cuspLongitude: number }[];
  planets: PlanetPosition[];
}

export function calculateKundali(input: BirthInput): KundaliResult {
  const key = cacheKey(input);
  const cached = kundaliCache.get(key);
  if (cached) return cached;

  const utcDate = toUTC(input.datetime, input.tzOffsetHours);
  const jd = dateToJD(utcDate);

  const ayanamsaKey = input.options?.ayanamsa ?? 'lahiri';
  const houseSystem = input.options?.houseSystem ?? 'placidus';
  const tropical = !!input.options?.tropical;

  // In tropical mode, ayanamsa is irrelevant — skip the override wrapper.
  const run = () => ({
    grahas: computeAllGrahas(jd, tropical),
    asc: computeAscendant(jd, input.lat, input.lng, houseSystem, tropical),
    ayanamsaValue: tropical ? 0 : getAyanamsa(jd),
  });
  const { grahas, asc, ayanamsaValue } = tropical
    ? run()
    : withAyanamsa(ayanamsaKey, run);

  const sunLong = grahas.SU.longitude;
  const planets: PlanetPosition[] = VEDIC_PLANETS.map((p) => {
    const raw: RawPosition = grahas[p.id];
    const r = rashiOf(raw.longitude);
    const n = nakshatraOf(raw.longitude);
    const house = houseOf(raw.longitude, asc.ascendant);

    const exalt = EXALTATION[p.id];
    const exalted = exalt ? r.num === exalt.rashi : false;
    // Debilitation = exact opposite rashi
    const debilitated = exalt ? r.num === ((exalt.rashi + 5) % 12) + 1 : false;

    // Combustion: angular distance from Sun (skip for SU/MO/RA/KE)
    let combust = false;
    const cRange = COMBUSTION_DEG[p.id];
    if (cRange != null) {
      const diff = Math.abs(((raw.longitude - sunLong + 540) % 360) - 180);
      const angSep = 180 - diff;
      combust = angSep <= cRange;
    }

    // Own sign — planet's lord matches the sign it's sitting in
    const ownSign = RASHIS[r.num - 1].lord === p.id;

    return {
      id: p.id,
      name: p.name,
      nameHi: p.nameHi,
      longitude: raw.longitude,
      speed: raw.speed,
      retrograde: raw.retrograde,
      rashi: { num: r.num, name: r.name, nameHi: r.nameHi, degInRashi: r.deg },
      nakshatra: { num: n.num, name: n.name, nameHi: n.nameHi, lord: n.lord, pada: n.pada },
      house,
      exalted,
      debilitated,
      combust,
      ownSign,
    };
  });

  // Houses (whole-sign): house i carries the rashi (lagnaRashi + i - 1) mod 12
  const lagnaRashiIdx = Math.floor(normDeg(asc.ascendant) / 30); // 0..11
  const houses = Array.from({ length: 12 }, (_, i) => {
    const rashiIdx = (lagnaRashiIdx + i) % 12;
    const r = RASHIS[rashiIdx];
    return {
      num: i + 1,
      rashiNum: r.num,
      rashiName: r.name,
      lord: r.lord,
      cuspLongitude: asc.cusps[i] ?? rashiIdx * 30,
    };
  });

  const ascR = rashiOf(asc.ascendant);
  const ascN = nakshatraOf(asc.ascendant);

  const result: KundaliResult = {
    input,
    utc: utcDate.toISOString(),
    jd,
    ayanamsa: {
      name: tropical ? 'tropical' : ayanamsaKey,
      valueDeg: ayanamsaValue,
      mode: tropical ? 'tropical' : 'sidereal',
    },
    houseSystem,
    ascendant: {
      longitude: asc.ascendant,
      rashi: { num: ascR.num, name: ascR.name, nameHi: ascR.nameHi, degInRashi: ascR.deg },
      nakshatra: { num: ascN.num, name: ascN.name, nameHi: ascN.nameHi, lord: ascN.lord, pada: ascN.pada },
    },
    houses,
    planets,
  };

  kundaliCache.set(key, result);
  return result;
}
