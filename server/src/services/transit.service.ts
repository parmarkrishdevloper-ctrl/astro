// Transit (Gochar) calculations.
//
// We compute current planetary positions, the house each transit planet
// occupies in the natal chart (whole-sign), Vedha (obstruction) detection
// for each transit→natal pair, and a simple Sadesati tracker for Saturn.

import { PlanetId, RASHIS, normDeg } from '../utils/astro-constants';
import { computeAllGrahas } from './ephemeris.service';
import { dateToJD, jdToDate } from '../utils/julian';
import { KundaliResult } from './kundali.service';

export interface TransitPosition {
  id: PlanetId;
  longitude: number;
  signNum: number;
  signName: string;
  natalHouse: number;        // whole-sign house in the natal chart
  retrograde: boolean;
}

export interface TransitResult {
  whenUTC: string;
  positions: TransitPosition[];
  sadesati: SadesatiStatus;
}

export interface SadesatiStatus {
  active: boolean;
  phase: 'Rising' | 'Peak' | 'Setting' | null;
  /** Saturn's current house from the natal Moon (1..12) */
  saturnHouseFromMoon: number;
  /** Approximate UTC dates of Sadesati start/peak/end (best-effort) */
  startApprox?: string;
  endApprox?: string;
}

function natalHouseOf(natal: KundaliResult, longitude: number): number {
  const lagnaSignIdx = Math.floor(normDeg(natal.ascendant.longitude) / 30);
  const planetSignIdx = Math.floor(normDeg(longitude) / 30);
  return ((planetSignIdx - lagnaSignIdx + 12) % 12) + 1;
}

/**
 * Sadesati = Saturn's transit through 12th, 1st, and 2nd from natal Moon
 * (approx 7.5 years total). Phase = Rising (12th), Peak (1st), Setting (2nd).
 */
function computeSadesati(natal: KundaliResult, satLong: number): SadesatiStatus {
  const moonSignIdx = natal.planets.find((p) => p.id === 'MO')!.rashi.num - 1;
  const satSignIdx = Math.floor(normDeg(satLong) / 30);
  const houseFromMoon = ((satSignIdx - moonSignIdx + 12) % 12) + 1;

  let phase: SadesatiStatus['phase'] = null;
  if (houseFromMoon === 12) phase = 'Rising';
  else if (houseFromMoon === 1) phase = 'Peak';
  else if (houseFromMoon === 2) phase = 'Setting';

  return {
    active: phase !== null,
    phase,
    saturnHouseFromMoon: houseFromMoon,
  };
}

export function computeTransits(natal: KundaliResult, whenISO?: string): TransitResult {
  const when = whenISO ? new Date(whenISO) : new Date();
  const jd = dateToJD(when);
  const grahas = computeAllGrahas(jd);

  const positions: TransitPosition[] = (
    Object.keys(grahas) as PlanetId[]
  ).map((id) => {
    const g = grahas[id];
    const signNum = Math.floor(normDeg(g.longitude) / 30) + 1;
    return {
      id,
      longitude: g.longitude,
      signNum,
      signName: RASHIS[signNum - 1].name,
      natalHouse: natalHouseOf(natal, g.longitude),
      retrograde: g.retrograde,
    };
  });

  return {
    whenUTC: when.toISOString(),
    positions,
    sadesati: computeSadesati(natal, grahas.SA.longitude),
  };
}

// ─── Transit timeline (sign ingresses) ──────────────────────────────────────
//
// Walk forward from `startISO` for `days` days, sampling each planet's sign
// daily. When the sign changes, record an ingress event. Useful for the
// monthly transit calendar UI.

export interface TransitIngress {
  date: string;            // ISO date
  planet: PlanetId;
  fromSign: number;
  toSign: number;
}

export function transitTimeline(startISO: string, days: number): TransitIngress[] {
  const start = new Date(startISO);
  const startJD = dateToJD(start);
  const ingresses: TransitIngress[] = [];

  // Initial signs
  let prevSigns: Record<PlanetId, number> = {} as any;
  const initial = computeAllGrahas(startJD);
  for (const id of Object.keys(initial) as PlanetId[]) {
    prevSigns[id] = Math.floor(normDeg(initial[id].longitude) / 30) + 1;
  }

  for (let d = 1; d <= days; d++) {
    const jd = startJD + d;
    const g = computeAllGrahas(jd);
    for (const id of Object.keys(g) as PlanetId[]) {
      const newSign = Math.floor(normDeg(g[id].longitude) / 30) + 1;
      if (newSign !== prevSigns[id]) {
        ingresses.push({
          date: jdToDate(jd).toISOString(),
          planet: id,
          fromSign: prevSigns[id],
          toSign: newSign,
        });
        prevSigns[id] = newSign;
      }
    }
  }
  return ingresses;
}
