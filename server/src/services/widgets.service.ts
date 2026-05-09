// Dashboard widgets — small, fast, stateless snapshots.
//
// Each widget is a pure function over (BirthInput, when) → JSON. They plug
// into the DashboardPage as cards and into notification schedulers. Keep
// them cheap: no multi-year sampling, no long dasha walks.
//
// Three widgets live here right now:
//   • nextTransit        — earliest future sign-ingress among slow movers
//   • currentPratyantar  — active pratyantar at `when`
//   • chandraBala        — transit Moon's house from natal Moon + favorability

import { PlanetId, VEDIC_PLANETS, RASHIS, normDeg } from '../utils/astro-constants';
import {
  BirthInput,
  calculateKundali,
  KundaliResult,
} from './kundali.service';
import { transitTimeline } from './transit.service';
import { currentDasha, DashaPeriod } from './dasha.service';
import { computeAllGrahas } from './ephemeris.service';
import { dateToJD } from '../utils/julian';

function planetName(id: PlanetId): string {
  return VEDIC_PLANETS.find((p) => p.id === id)?.name ?? id;
}
function rashiName(num: number): string {
  return RASHIS[(num - 1 + 12) % 12].name;
}

// ─── Widget: Next transit ingress ───────────────────────────────────────────
//
// Scans forward `lookaheadDays` (default 180) and picks the earliest
// sign-change among the slow planets [Jupiter, Saturn, Rahu, Mars] — the
// transits people actually notice. Falls back to "none found" if the
// window is quiet (possible for shorter windows).

export interface NextTransitWidget {
  kind: 'next-transit';
  found: boolean;
  date?: string;                 // ISO
  planet?: PlanetId;
  planetName?: string;
  fromSign?: number;
  fromSignName?: string;
  toSign?: number;
  toSignName?: string;
  daysUntil?: number;
}

export function nextTransitWidget(
  birth: BirthInput,
  when: Date = new Date(),
  lookaheadDays = 180,
): NextTransitWidget {
  // Birth is unused for this widget (transit is geocentric), but we keep
  // the signature parallel with the other widgets for the dashboard wrapper.
  void birth;

  const slow: PlanetId[] = ['JU', 'SA', 'RA', 'MA'];
  const ingresses = transitTimeline(when.toISOString(), lookaheadDays);
  const first = ingresses.find((ing) => slow.includes(ing.planet));
  if (!first) return { kind: 'next-transit', found: false };

  const daysUntil = Math.max(
    0,
    Math.round((new Date(first.date).getTime() - when.getTime()) / 86400000),
  );

  return {
    kind: 'next-transit',
    found: true,
    date: first.date,
    planet: first.planet,
    planetName: planetName(first.planet),
    fromSign: first.fromSign,
    fromSignName: rashiName(first.fromSign),
    toSign: first.toSign,
    toSignName: rashiName(first.toSign),
    daysUntil,
  };
}

// ─── Widget: Current Pratyantar ─────────────────────────────────────────────
//
// Active pratyantar (and its parent antar + maha) at the given moment.
// Reuses dasha.service.currentDasha — just repackages for the dashboard.

export interface PratyantarWidget {
  kind: 'pratyantar';
  found: boolean;
  at: string;
  maha?: DashaPeriod;
  antar?: DashaPeriod;
  pratyantar?: DashaPeriod;
}

export function pratyantarWidget(
  kundali: KundaliResult,
  when: Date = new Date(),
): PratyantarWidget {
  const snap = currentDasha(kundali, when);
  if (!snap || !snap.maha) {
    return { kind: 'pratyantar', found: false, at: when.toISOString() };
  }
  return {
    kind: 'pratyantar',
    found: true,
    at: when.toISOString(),
    maha: snap.maha,
    antar: snap.antar ?? undefined,
    pratyantar: snap.pratyantar ?? undefined,
  };
}

// ─── Widget: Chandra Bala (Moon strength by transit) ────────────────────────
//
// Count the transit Moon's house (1..12) from the natal Moon's sign.
// Classical favorable houses (from Moon): 1, 3, 6, 7, 10, 11.
// Unfavorable: 2, 4, 5, 8, 9, 12. This drives the "good day to start"
// intuition in daily practice.

const CHANDRA_FAVORABLE = new Set([1, 3, 6, 7, 10, 11]);

export interface ChandraBalaWidget {
  kind: 'chandra-bala';
  at: string;
  natalMoonSign: number;
  natalMoonSignName: string;
  transitMoonSign: number;
  transitMoonSignName: string;
  houseFromNatalMoon: number;      // 1..12
  favorable: boolean;
  note: string;
}

export function chandraBalaWidget(
  kundali: KundaliResult,
  when: Date = new Date(),
): ChandraBalaWidget {
  const natalMoon = kundali.planets.find((p) => p.id === 'MO');
  if (!natalMoon) throw new Error('Natal Moon not found in chart');

  const jd = dateToJD(when);
  const grahas = computeAllGrahas(jd);
  const transitMoonLon = grahas.MO.longitude;
  const transitSign = Math.floor(normDeg(transitMoonLon) / 30) + 1;
  const natalSign = natalMoon.rashi.num;
  const house = ((transitSign - natalSign + 12) % 12) + 1;
  const fav = CHANDRA_FAVORABLE.has(house);

  const note = fav
    ? `Transit Moon in house ${house} from natal Moon — supportive (classical favorable).`
    : `Transit Moon in house ${house} from natal Moon — restrained (classical unfavorable).`;

  return {
    kind: 'chandra-bala',
    at: when.toISOString(),
    natalMoonSign: natalSign,
    natalMoonSignName: rashiName(natalSign),
    transitMoonSign: transitSign,
    transitMoonSignName: rashiName(transitSign),
    houseFromNatalMoon: house,
    favorable: fav,
    note,
  };
}

// ─── Combined dashboard snapshot ────────────────────────────────────────────
//
// Single call to pull all 3 widgets for one chart at one moment.

export interface DashboardSnapshot {
  at: string;
  chartLabel?: string;
  nextTransit: NextTransitWidget;
  pratyantar: PratyantarWidget;
  chandraBala: ChandraBalaWidget;
}

export function dashboardSnapshot(
  birth: BirthInput,
  when: Date = new Date(),
  chartLabel?: string,
): DashboardSnapshot {
  const kundali = calculateKundali(birth);
  return {
    at: when.toISOString(),
    chartLabel,
    nextTransit: nextTransitWidget(birth, when),
    pratyantar: pratyantarWidget(kundali, when),
    chandraBala: chandraBalaWidget(kundali, when),
  };
}
