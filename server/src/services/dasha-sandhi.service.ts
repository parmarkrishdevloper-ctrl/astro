// Dasha Sandhi — junction windows at Vimshottari transitions.
//
// "Sandhi" means junction/twilight. The last few percent of a departing
// Mahadasha and the first few percent of the incoming one form an
// unsettled window where the old lord's results have largely played out
// but the new lord has not yet taken hold. Classical authorities flag
// this as a period of health/mental vulnerability, especially when
// Mahadashas switch between hostile planets (e.g., Sun → Moon, Mars → Rahu).
//
// We identify upcoming Sandhi windows within a given date range at both
// Mahadasha and Antardasha levels, with configurable margin (default 5%).

import { PlanetId } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { computeVimshottari, computeAntardashas, DashaPeriod } from './dasha.service';

export interface SandhiWindow {
  level: 'maha' | 'antar';
  outgoingLord: PlanetId;
  incomingLord: PlanetId;
  outgoingStart: string;
  sandhiStart: string;
  junctionAt: string;      // exact MD/AD boundary
  sandhiEnd: string;
  incomingEnd: string;
  totalDays: number;
  severity: 'high' | 'medium' | 'low';
  note: string;
}

export interface SandhiResult {
  from: string;
  to: string;
  marginPct: number;
  windows: SandhiWindow[];
}

// Natural enmity matrix for severity grading. Cross-checks used below.
const ENEMIES: Record<PlanetId, PlanetId[]> = {
  SU: ['VE', 'SA', 'RA'],
  MO: ['RA', 'KE'],
  MA: ['ME'],
  ME: ['MO'],
  JU: ['ME', 'VE'],
  VE: ['SU', 'MO'],
  SA: ['SU', 'MO', 'MA'],
  RA: ['SU', 'MO'],
  KE: ['SU', 'MO'],
};

function isEnemy(a: PlanetId, b: PlanetId): boolean {
  return ENEMIES[a]?.includes(b) || ENEMIES[b]?.includes(a);
}

function severity(a: PlanetId, b: PlanetId): SandhiWindow['severity'] {
  if (isEnemy(a, b)) return 'high';
  // Transitioning into/out of a malefic carries weight even without enmity
  const malefics: PlanetId[] = ['SA', 'RA', 'KE', 'MA', 'SU'];
  if (malefics.includes(a) && malefics.includes(b)) return 'medium';
  return 'low';
}

function msToDays(ms: number): number {
  return +(ms / (1000 * 60 * 60 * 24)).toFixed(1);
}

function windowFromPair(
  outgoing: DashaPeriod, incoming: DashaPeriod,
  level: 'maha' | 'antar', marginPct: number,
): SandhiWindow {
  const outStart = new Date(outgoing.start).getTime();
  const junction = new Date(outgoing.end).getTime();
  const inEnd = new Date(incoming.end).getTime();
  const outDuration = junction - outStart;
  const inDuration = inEnd - junction;
  const sandhiStart = new Date(junction - outDuration * marginPct);
  const sandhiEnd = new Date(junction + inDuration * marginPct);
  const sev = severity(outgoing.lord, incoming.lord);
  return {
    level,
    outgoingLord: outgoing.lord,
    incomingLord: incoming.lord,
    outgoingStart: outgoing.start,
    sandhiStart: sandhiStart.toISOString(),
    junctionAt: outgoing.end,
    sandhiEnd: sandhiEnd.toISOString(),
    incomingEnd: incoming.end,
    totalDays: msToDays(sandhiEnd.getTime() - sandhiStart.getTime()),
    severity: sev,
    note:
      sev === 'high' ? `Hostile transition from ${outgoing.lord} to ${incoming.lord} — classical caution: health, mind, decisions`
      : sev === 'medium' ? `Malefic-to-malefic junction (${outgoing.lord} → ${incoming.lord}) — keep major commitments outside this window`
      : `Routine ${outgoing.lord} → ${incoming.lord} junction — lighter effects expected`,
  };
}

function overlapsRange(start: string, end: string, from: Date, to: Date): boolean {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return s <= to.getTime() && e >= from.getTime();
}

export function computeDashaSandhi(
  kundali: KundaliResult,
  fromISO: string,
  toISO: string,
  marginPct = 0.05,
): SandhiResult {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  const vim = computeVimshottari(kundali);
  const mds = vim.mahadashas;

  const windows: SandhiWindow[] = [];

  // Maha-level sandhis
  for (let i = 0; i < mds.length - 1; i++) {
    const a = mds[i];
    const b = mds[i + 1];
    const w = windowFromPair(a, b, 'maha', marginPct);
    if (overlapsRange(w.sandhiStart, w.sandhiEnd, from, to)) windows.push(w);
  }

  // Antar-level sandhis (within each MD that overlaps the range)
  for (const md of mds) {
    if (!overlapsRange(md.start, md.end, from, to)) continue;
    const antars = md.antardashas ?? computeAntardashas(md);
    for (let i = 0; i < antars.length - 1; i++) {
      const a = antars[i];
      const b = antars[i + 1];
      const w = windowFromPair(a, b, 'antar', marginPct);
      if (overlapsRange(w.sandhiStart, w.sandhiEnd, from, to)) windows.push(w);
    }
  }

  windows.sort((a, b) => new Date(a.sandhiStart).getTime() - new Date(b.sandhiStart).getTime());

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    marginPct,
    windows,
  };
}
