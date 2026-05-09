// Eclipse & ingress journal.
//
// Given a date range, returns a chronological list of:
//   • Solar and lunar eclipses (from swisseph eclipse_when_* functions)
//   • Outer-planet sign-ingresses (Jupiter, Saturn, Rahu)
//
// If a natal chart is supplied, each event is also annotated with the house
// in that chart (so the user sees "Saturn enters your 7th house on 2027-03-29").

import swisseph from 'swisseph';
import { KundaliResult } from './kundali.service';
import { VEDIC_PLANETS, PlanetId, normDeg, RASHIS } from '../utils/astro-constants';
import { computeBody, getAyanamsa } from './ephemeris.service';
import { dateToJD, jdToDate } from '../utils/julian';

const { SEFLG_SWIEPH } = swisseph;

function signOf(lng: number): number {
  return Math.floor(normDeg(lng) / 30) + 1;
}

// ─── Eclipses ──────────────────────────────────────────────────────────────
export interface EclipseEvent {
  type: 'solar' | 'lunar';
  utc: string;
  sunLongitude: number;
  moonLongitude: number;
  rashiSun: number;
  rashiSunName: string;
  rashiMoon: number;
  rashiMoonName: string;
}

function nextEclipse(startJD: number, kind: 'solar' | 'lunar'): EclipseEvent | null {
  try {
    const fn: any = kind === 'solar' ? swisseph.swe_sol_eclipse_when_glob : swisseph.swe_lun_eclipse_when;
    const res: any = fn(startJD, SEFLG_SWIEPH, 0, false);  // backward=false
    if (res.error) return null;
    const tMax: number | undefined = res.tMax ?? res.tmax ?? (Array.isArray(res.tret) ? res.tret[0] : undefined);
    if (tMax == null) return null;
    const ayan = getAyanamsa(tMax);
    const sun: any = swisseph.swe_calc_ut(tMax, swisseph.SE_SUN, SEFLG_SWIEPH);
    const moon: any = swisseph.swe_calc_ut(tMax, swisseph.SE_MOON, SEFLG_SWIEPH);
    const sunLng = normDeg((sun.longitude ?? sun.data?.[0]) - ayan);
    const moonLng = normDeg((moon.longitude ?? moon.data?.[0]) - ayan);
    const when = jdToDate(tMax);
    const sS = signOf(sunLng), mS = signOf(moonLng);
    return {
      type: kind, utc: when.toISOString(),
      sunLongitude: sunLng, moonLongitude: moonLng,
      rashiSun: sS, rashiSunName: RASHIS[sS - 1].name,
      rashiMoon: mS, rashiMoonName: RASHIS[mS - 1].name,
    };
  } catch { return null; }
}

export function listEclipses(startISO: string, days: number): EclipseEvent[] {
  const start = dateToJD(new Date(startISO));
  const end = start + days;
  const events: EclipseEvent[] = [];
  for (const kind of ['solar', 'lunar'] as const) {
    let cursor = start;
    for (let i = 0; i < 20; i++) {
      const ev = nextEclipse(cursor, kind);
      if (!ev) break;
      const evJD = dateToJD(new Date(ev.utc));
      if (evJD > end) break;
      events.push(ev);
      cursor = evJD + 1;      // advance past this event
    }
  }
  events.sort((a, b) => new Date(a.utc).getTime() - new Date(b.utc).getTime());
  return events;
}

// ─── Outer-planet ingresses ────────────────────────────────────────────────
// Step through time, detect when a planet's sign changes.

export interface IngressEvent {
  planet: PlanetId;
  fromSignNum: number;
  fromSignName: string;
  toSignNum: number;
  toSignName: string;
  utc: string;
  longitude: number;
  natalHouse?: number;
}

const INGRESS_PLANETS: PlanetId[] = ['JU', 'SA', 'RA', 'KE'];

export interface IngressOptions {
  start: string;
  days: number;
  /** Include faster-moving planets (MA, VE, ME, SU, MO)? Default false to
   *  keep the journal focused on major multi-year ingresses. */
  includeFast?: boolean;
  /** If supplied, each event is annotated with its house in the natal chart. */
  natal?: KundaliResult;
}

export function listIngresses(opts: IngressOptions): IngressEvent[] {
  const startJD = dateToJD(new Date(opts.start));
  const days = Math.min(3650, Math.max(1, opts.days));
  const plist = opts.includeFast
    ? VEDIC_PLANETS.map((p) => p.id)
    : INGRESS_PLANETS;

  // previous sign per planet
  const prevSign: Partial<Record<PlanetId, number>> = {};
  const swephIdMap: Partial<Record<PlanetId, number>> = {};
  for (const def of VEDIC_PLANETS) swephIdMap[def.id] = def.swephId;

  const events: IngressEvent[] = [];
  for (let i = 0; i <= days; i++) {
    const jd = startJD + i;
    for (const id of plist) {
      const swephId = swephIdMap[id];
      if (swephId == null) continue;
      const p = computeBody(jd, swephId);
      // For Ketu (south node) swisseph doesn't have a direct body; we derive
      // Ketu from Rahu.
      let lng = p.longitude;
      if (id === 'KE') {
        // Recompute via Rahu
        const rahuId = swephIdMap['RA']!;
        const rahu = computeBody(jd, rahuId);
        lng = normDeg(rahu.longitude + 180);
      }
      const sign = signOf(lng);
      const ps = prevSign[id];
      if (ps != null && ps !== sign) {
        const ev: IngressEvent = {
          planet: id,
          fromSignNum: ps, fromSignName: RASHIS[ps - 1].name,
          toSignNum: sign, toSignName: RASHIS[sign - 1].name,
          utc: jdToDate(jd).toISOString(),
          longitude: lng,
        };
        if (opts.natal) {
          const lagnaSign = opts.natal.ascendant.rashi.num;
          ev.natalHouse = ((sign - lagnaSign + 12) % 12) + 1;
        }
        events.push(ev);
      }
      prevSign[id] = sign;
    }
  }
  return events;
}

// ─── Combined journal ──────────────────────────────────────────────────────
export interface EclipseJournalResult {
  eclipses: EclipseEvent[];
  ingresses: IngressEvent[];
}

export function buildEclipseJournal(opts: IngressOptions): EclipseJournalResult {
  return {
    eclipses: listEclipses(opts.start, opts.days),
    ingresses: listIngresses(opts),
  };
}
