import {
  PlanetId,
  VIMSHOTTARI_ORDER,
  VIMSHOTTARI_YEARS,
  VIMSHOTTARI_TOTAL,
  SOLAR_YEAR_DAYS,
  NAK_SPAN,
  nakshatraOf,
  VEDIC_PLANETS,
} from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import {
  DASHA_SYSTEMS,
  DashaSystemKey,
  computeDashaStart,
  DashaLordSpec,
} from './dasha-systems';

export type DashaLevel =
  | 'maha'        // 1. Mahadasha
  | 'antar'       // 2. Antardasha (Bhukti)
  | 'pratyantar'  // 3. Pratyantardasha
  | 'sookshma'    // 4. Sookshmadasha
  | 'prana'       // 5. Pranadasha
  | 'deha';       // 6. Dehadasha (finest classical unit)

export const DASHA_LEVELS: DashaLevel[] = [
  'maha', 'antar', 'pratyantar', 'sookshma', 'prana', 'deha',
];

export const DASHA_LEVEL_LABEL: Record<DashaLevel, string> = {
  maha: 'Mahadasha',
  antar: 'Antardasha',
  pratyantar: 'Pratyantardasha',
  sookshma: 'Sookshmadasha',
  prana: 'Pranadasha',
  deha: 'Dehadasha',
};

export interface DashaPeriod {
  lord: PlanetId;
  lordName: string;
  start: string;   // ISO
  end: string;     // ISO
  years: number;   // duration in years (fractional)
  level: DashaLevel;
  /** Optional — defaults to vimshottari for backward compatibility. */
  systemKey?: DashaSystemKey;
  /** For systems like Yogini where the lord has an alternate display name. */
  lordDisplayName?: string;
  lordDisplayNameHi?: string;
}

export interface VimshottariResult {
  birthMoonLongitude: number;
  startNakshatra: { num: number; name: string; lord: PlanetId };
  /** All 9 mahadashas in order, starting from the birth-time partial mahadasha. */
  mahadashas: DashaPeriod[];
}

function planetName(id: PlanetId): string {
  return VEDIC_PLANETS.find((p) => p.id === id)!.name;
}

function addYears(date: Date, years: number): Date {
  return new Date(date.getTime() + years * SOLAR_YEAR_DAYS * 86400 * 1000);
}

function rotateFrom<T>(arr: readonly T[], item: T): T[] {
  const i = arr.indexOf(item);
  if (i < 0) throw new Error(`Item not in sequence: ${String(item)}`);
  return [...arr.slice(i), ...arr.slice(0, i)];
}

function rotateSpecsFromLord(
  specs: DashaLordSpec[], lord: PlanetId,
): DashaLordSpec[] {
  const i = specs.findIndex((s) => s.lord === lord);
  if (i < 0) throw new Error(`Lord ${lord} not in system cycle`);
  return [...specs.slice(i), ...specs.slice(0, i)];
}

function specToDisplay(spec: DashaLordSpec) {
  return {
    lordDisplayName: spec.displayName,
    lordDisplayNameHi: spec.displayNameHi,
  };
}

function nextLevel(l: DashaLevel): DashaLevel | null {
  const i = DASHA_LEVELS.indexOf(l);
  return i >= 0 && i < DASHA_LEVELS.length - 1 ? DASHA_LEVELS[i + 1] : null;
}

/**
 * Generic dasha subdivision. Every level follows the same proportional rule:
 * the parent duration is split into N child segments (one per lord in the
 * system's cycle), starting from the parent's lord, each child getting
 * (lordYears / systemTotal) of the parent duration.
 *
 * The system is read from parent.systemKey (default 'vimshottari').
 */
export function subdivide(parent: DashaPeriod): DashaPeriod[] {
  const child = nextLevel(parent.level);
  if (!child) return [];
  const systemKey: DashaSystemKey = parent.systemKey ?? 'vimshottari';
  const system = DASHA_SYSTEMS[systemKey];
  const order = rotateSpecsFromLord(system.order, parent.lord);
  const startMs = new Date(parent.start).getTime();
  const totalMs = new Date(parent.end).getTime() - startMs;
  const out: DashaPeriod[] = [];
  let cursor = startMs;
  for (const spec of order) {
    const fraction = spec.years / system.totalYears;
    const segMs = totalMs * fraction;
    const segEnd = cursor + segMs;
    out.push({
      lord: spec.lord,
      lordName: planetName(spec.lord),
      start: new Date(cursor).toISOString(),
      end: new Date(segEnd).toISOString(),
      years: segMs / (SOLAR_YEAR_DAYS * 86400 * 1000),
      level: child,
      systemKey,
      ...specToDisplay(spec),
    });
    cursor = segEnd;
  }
  if (out.length) out[out.length - 1].end = parent.end;
  return out;
}

/**
 * Lifespan coverage (years) for mahadasha sequences. Shorter-cycle systems
 * like Yogini (36y) loop through multiple cycles; longer ones like
 * Vimshottari (120y) need a single pass.
 */
const DASHA_COVERAGE_YEARS = 120;

/**
 * Compute mahadasha sequence for any registered dasha system.
 * The first mahadasha is partial — only the un-elapsed balance of the
 * starting lord's period as determined by the system's rule. Cycles
 * repeat until the total span covers DASHA_COVERAGE_YEARS from birth.
 */
export function computeMahadashas(
  kundali: KundaliResult,
  systemKey: DashaSystemKey = 'vimshottari',
): DashaPeriod[] {
  const system = DASHA_SYSTEMS[systemKey];
  const start = computeDashaStart(kundali, systemKey);
  const order = rotateSpecsFromLord(system.order, start.startingLord);
  const birthDate = new Date(kundali.utc);
  const horizon = addYears(birthDate, DASHA_COVERAGE_YEARS);
  const out: DashaPeriod[] = [];
  let cursor = birthDate;
  let i = 0;
  while (cursor < horizon) {
    const spec = order[i % order.length];
    const years = i === 0 ? start.balanceYears : spec.years;
    const end = addYears(cursor, years);
    out.push({
      lord: spec.lord,
      lordName: planetName(spec.lord),
      start: cursor.toISOString(),
      end: end.toISOString(),
      years,
      level: 'maha',
      systemKey,
      ...specToDisplay(spec),
    });
    cursor = end;
    i++;
  }
  return out;
}

/**
 * Vimshottari-specific wrapper kept for backward compatibility.
 */
export function computeVimshottari(kundali: KundaliResult): VimshottariResult {
  const moon = kundali.planets.find((p) => p.id === 'MO')!;
  const nak = nakshatraOf(moon.longitude);
  // Reference VIMSHOTTARI_ORDER/YEARS/TOTAL to keep unused-import pruning happy
  void VIMSHOTTARI_ORDER; void VIMSHOTTARI_YEARS; void VIMSHOTTARI_TOTAL; void rotateFrom;
  return {
    birthMoonLongitude: moon.longitude,
    startNakshatra: { num: nak.num, name: nak.name, lord: nak.lord },
    mahadashas: computeMahadashas(kundali, 'vimshottari'),
  };
}

/** Antardashas inside a single mahadasha. */
export function computeAntardashas(maha: DashaPeriod): DashaPeriod[] {
  return subdivide(maha);
}

/** Pratyantars within an antardasha. */
export function computePratyantars(antar: DashaPeriod): DashaPeriod[] {
  return subdivide(antar);
}

/** Sookshmas within a pratyantar. */
export function computeSookshmas(pratyantar: DashaPeriod): DashaPeriod[] {
  return subdivide(pratyantar);
}

/** Pranas within a sookshma. */
export function computePranas(sookshma: DashaPeriod): DashaPeriod[] {
  return subdivide(sookshma);
}

/** Dehas within a prana — the finest classical Vimshottari unit. */
export function computeDehas(prana: DashaPeriod): DashaPeriod[] {
  return subdivide(prana);
}

function findActive(periods: DashaPeriod[], tMs: number): DashaPeriod | null {
  return periods.find(
    (p) => new Date(p.start).getTime() <= tMs && tMs < new Date(p.end).getTime(),
  ) ?? null;
}

/** Find the active mahadasha + antardasha + pratyantar at a given moment. */
export function currentDasha(
  kundali: KundaliResult,
  atDate: Date = new Date(),
  systemKey: DashaSystemKey = 'vimshottari',
) {
  const mahadashas = computeMahadashas(kundali, systemKey);
  const t = atDate.getTime();
  const maha = findActive(mahadashas, t);
  if (!maha) return null;
  const antar = findActive(subdivide(maha), t);
  if (!antar) return { maha, antar: null, pratyantar: null };
  const pratyantar = findActive(subdivide(antar), t);
  return { maha, antar, pratyantar: pratyantar ?? null };
}

export interface DeepDashaSnapshot {
  at: string;
  systemKey: DashaSystemKey;
  maha: DashaPeriod | null;
  antar: DashaPeriod | null;
  pratyantar: DashaPeriod | null;
  sookshma: DashaPeriod | null;
  prana: DashaPeriod | null;
  deha: DashaPeriod | null;
}

/**
 * Descend all 6 levels of the given dasha system to find the active period
 * at each depth for the given moment. Returns nulls from the first level
 * that has no active child (e.g. beyond the total cycle span).
 */
export function currentDashaDeep(
  kundali: KundaliResult,
  atDate: Date = new Date(),
  systemKey: DashaSystemKey = 'vimshottari',
): DeepDashaSnapshot {
  const mahadashas = computeMahadashas(kundali, systemKey);
  const t = atDate.getTime();
  const snap: DeepDashaSnapshot = {
    at: atDate.toISOString(),
    systemKey,
    maha: null, antar: null, pratyantar: null,
    sookshma: null, prana: null, deha: null,
  };
  let parent: DashaPeriod | null = findActive(mahadashas, t);
  snap.maha = parent;
  const fields: (keyof DeepDashaSnapshot)[] = [
    'antar', 'pratyantar', 'sookshma', 'prana', 'deha',
  ];
  for (const f of fields) {
    if (!parent) break;
    const child = findActive(subdivide(parent), t);
    (snap as any)[f] = child;
    parent = child;
  }
  return snap;
}
