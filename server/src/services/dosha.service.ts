import { KundaliResult } from './kundali.service';
import { computeBody } from './ephemeris.service';
import { swisseph } from '../config/ephemeris';
import { dateToJD } from '../utils/julian';
import { rashiOf, normDeg } from '../utils/astro-constants';
import { translator, p, type Locale } from '../i18n';

// ─── MANGAL DOSHA ───────────────────────────────────────────────────────────
// Mars in houses 1, 2, 4, 7, 8, 12 from Lagna / Moon / Venus.
// Cancellations: Mars in own/exalted sign, etc. (basic version below).

export interface MangalDoshaResult {
  hasDosha: boolean;
  fromLagna: boolean;
  fromMoon: boolean;
  fromVenus: boolean;
  marsHouse: { fromLagna: number; fromMoon: number; fromVenus: number };
  cancelled: boolean;
  /** Already localised. */
  cancellationReasons: string[];
}

const MANGAL_HOUSES = [1, 2, 4, 7, 8, 12];

function houseFromReference(longitude: number, refLongitude: number): number {
  // Whole-sign: house = ((planetRashi - refRashi + 12) % 12) + 1
  const planetRashi = Math.floor(normDeg(longitude) / 30);
  const refRashi = Math.floor(normDeg(refLongitude) / 30);
  return ((planetRashi - refRashi + 12) % 12) + 1;
}

export function checkMangalDosha(k: KundaliResult, locale: Locale = 'en'): MangalDoshaResult {
  const mars = k.planets.find((pl) => pl.id === 'MA')!;
  const moon = k.planets.find((pl) => pl.id === 'MO')!;
  const venus = k.planets.find((pl) => pl.id === 'VE')!;

  const fromLagna = mars.house;
  const fromMoon = houseFromReference(mars.longitude, moon.longitude);
  const fromVenus = houseFromReference(mars.longitude, venus.longitude);

  const inFromLagna = MANGAL_HOUSES.includes(fromLagna);
  const inFromMoon = MANGAL_HOUSES.includes(fromMoon);
  const inFromVenus = MANGAL_HOUSES.includes(fromVenus);

  // Cancellations (basic):
  const reasons: string[] = [];
  if (mars.ownSign) reasons.push(p('dosha.mangal.cancellation.marsOwnSign', locale));
  if (mars.exalted) reasons.push(p('dosha.mangal.cancellation.marsExalted', locale));
  if (mars.rashi.num === 4 || mars.rashi.num === 5) {
    reasons.push(p('dosha.mangal.cancellation.marsCancerLeo', locale)); // friendly
  }
  // Aspect by Jupiter cancels (simplified — checking 5th/9th aspect)
  const jup = k.planets.find((pl) => pl.id === 'JU')!;
  const jupHouseFromMars = ((mars.rashi.num - jup.rashi.num + 12) % 12) + 1;
  if ([5, 7, 9].includes(jupHouseFromMars)) {
    reasons.push(p('dosha.mangal.cancellation.jupiterAspect', locale));
  }

  return {
    hasDosha: inFromLagna || inFromMoon || inFromVenus,
    fromLagna: inFromLagna,
    fromMoon: inFromMoon,
    fromVenus: inFromVenus,
    marsHouse: { fromLagna, fromMoon, fromVenus },
    cancelled: reasons.length > 0,
    cancellationReasons: reasons,
  };
}

// ─── KAAL SARPA DOSHA ───────────────────────────────────────────────────────
// All 7 visible planets fall on one side of the Rahu-Ketu axis.

const KAAL_SARPA_TYPES = [
  // Rahu's house # → English type key. Localised label is computed at the end.
  { rahuHouse: 1,  type: 'Anant' },
  { rahuHouse: 2,  type: 'Kulik' },
  { rahuHouse: 3,  type: 'Vasuki' },
  { rahuHouse: 4,  type: 'Shankhpal' },
  { rahuHouse: 5,  type: 'Padma' },
  { rahuHouse: 6,  type: 'Mahapadma' },
  { rahuHouse: 7,  type: 'Takshaka' },
  { rahuHouse: 8,  type: 'Karkotaka' },
  { rahuHouse: 9,  type: 'Shankhachuda' },
  { rahuHouse: 10, type: 'Ghatak' },
  { rahuHouse: 11, type: 'Vishakta' },
  { rahuHouse: 12, type: 'Sheshnag' },
];

export interface KaalSarpaResult {
  hasDosha: boolean;
  /**
   * Stable English key (e.g. 'Anant', 'Kulik') for closed-enum lookup.
   * Null when there is no dosha.
   */
  type: string | null;
  /** Localised display label. */
  typeLabel: string | null;
  partial: boolean;
}

export function checkKaalSarpa(k: KundaliResult, locale: Locale = 'en'): KaalSarpaResult {
  const t = translator(locale);
  const rahu = k.planets.find((pl) => pl.id === 'RA')!;
  const ketu = k.planets.find((pl) => pl.id === 'KE')!;
  const visible = k.planets.filter((pl) => !['RA', 'KE'].includes(pl.id));

  // Walk from Rahu to Ketu the "short" way (180° arc). Are all visible planets
  // inside that arc, or all outside? If all on one side → Kaal Sarpa.
  function inArc(long: number, start: number, end: number): boolean {
    // Arc from start, going counter-clockwise (increasing degrees) to end.
    const norm = (a: number) => ((a % 360) + 360) % 360;
    const s = norm(start);
    const e = norm(end);
    const l = norm(long);
    return s < e ? l >= s && l <= e : l >= s || l <= e;
  }

  const allInForwardArc = visible.every((pl) =>
    inArc(pl.longitude, rahu.longitude, ketu.longitude),
  );
  const allInBackwardArc = visible.every((pl) =>
    inArc(pl.longitude, ketu.longitude, rahu.longitude),
  );

  if (!allInForwardArc && !allInBackwardArc) {
    return { hasDosha: false, type: null, typeLabel: null, partial: false };
  }

  const type = KAAL_SARPA_TYPES.find((entry) => entry.rahuHouse === rahu.house)?.type ?? null;
  const typeLabel = type ? t.kaalSarpaType(type) : null;
  return { hasDosha: true, type, typeLabel, partial: false };
}

// ─── SADE SATI ──────────────────────────────────────────────────────────────
// Saturn transits over the natal Moon's sign and the two adjacent (12th & 2nd)
// signs from Moon. Total ~7.5 years split into 3 phases of ~2.5 years each.

export interface SadeSatiResult {
  active: boolean;
  /** Stable phase key (unchanged across locales). */
  phase: 'first' | 'peak' | 'last' | null;
  /** Localised phase description. */
  phaseDescription: string;
  saturnRashi: number;
  moonRashi: number;
  housesFromMoon: number;
}

export function checkSadeSati(
  k: KundaliResult,
  atDate: Date = new Date(),
  locale: Locale = 'en',
): SadeSatiResult {
  const moon = k.planets.find((pl) => pl.id === 'MO')!;
  const moonRashi = moon.rashi.num;

  const jd = dateToJD(atDate);
  const transitSat = computeBody(jd, swisseph.SE_SATURN);
  const satRashi = rashiOf(transitSat.longitude).num;

  const dist = ((satRashi - moonRashi + 12) % 12) + 1; // 1..12

  let phase: 'first' | 'peak' | 'last' | null = null;
  let desc = p('dosha.sadeSati.none', locale);
  if (dist === 12) { phase = 'first'; desc = p('dosha.sadeSati.first', locale); }
  else if (dist === 1)  { phase = 'peak';  desc = p('dosha.sadeSati.peak', locale); }
  else if (dist === 2)  { phase = 'last';  desc = p('dosha.sadeSati.last', locale); }

  return {
    active: phase !== null,
    phase,
    phaseDescription: desc,
    saturnRashi: satRashi,
    moonRashi,
    housesFromMoon: dist,
  };
}

export interface AllDoshasResult {
  mangal: MangalDoshaResult;
  kaalSarpa: KaalSarpaResult;
  sadeSati: SadeSatiResult;
}

export function checkAllDoshas(
  k: KundaliResult,
  atDate?: Date,
  locale: Locale = 'en',
): AllDoshasResult {
  return {
    mangal: checkMangalDosha(k, locale),
    kaalSarpa: checkKaalSarpa(k, locale),
    sadeSati: checkSadeSati(k, atDate, locale),
  };
}
