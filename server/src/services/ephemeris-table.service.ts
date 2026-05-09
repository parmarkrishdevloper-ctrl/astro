// Tabular and graphical ephemeris generation.
//
// Tabular: a row per day with each planet's longitude.
// Graphical: a JSON-friendly series suitable for an SVG line chart in the UI
// (one polyline per planet — degrees vs day index, retrograde detected from
// negative speed).

import { PlanetId, normDeg, RASHIS } from '../utils/astro-constants';
import { computeAllGrahas } from './ephemeris.service';
import { dateToJD, jdToDate } from '../utils/julian';

export interface EphemerisRow {
  date: string;
  positions: Record<PlanetId, { longitude: number; signNum: number; sign: string; retrograde: boolean }>;
}

export function buildEphemerisTable(startISO: string, days: number): EphemerisRow[] {
  const start = new Date(startISO);
  const startJD = dateToJD(start);
  const rows: EphemerisRow[] = [];
  for (let d = 0; d < days; d++) {
    const jd = startJD + d;
    const g = computeAllGrahas(jd);
    const positions = {} as EphemerisRow['positions'];
    for (const id of Object.keys(g) as PlanetId[]) {
      const lon = g[id].longitude;
      const signNum = Math.floor(normDeg(lon) / 30) + 1;
      positions[id] = {
        longitude: lon,
        signNum,
        sign: RASHIS[signNum - 1].name,
        retrograde: g[id].retrograde,
      };
    }
    rows.push({ date: jdToDate(jd).toISOString(), positions });
  }
  return rows;
}

export interface GraphicalEphemerisSeries {
  planet: PlanetId;
  /** [dayIndex, longitudeDegrees] points; gaps inserted at 0/360 wrap */
  points: { x: number; y: number; retrograde: boolean }[];
}

export function buildGraphicalEphemeris(startISO: string, days: number): GraphicalEphemerisSeries[] {
  const rows = buildEphemerisTable(startISO, days);
  const planets: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA', 'RA', 'KE'];
  return planets.map((p) => ({
    planet: p,
    points: rows.map((r, i) => ({
      x: i,
      y: r.positions[p].longitude,
      retrograde: r.positions[p].retrograde,
    })),
  }));
}
