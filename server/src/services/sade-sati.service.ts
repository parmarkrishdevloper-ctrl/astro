// Sade Sati + kakshya timeline.
//
// Sade Sati is Saturn's ~7.5 year transit through the three signs
// centered on the natal Moon: 12th (Rising), 1st (Peak), 2nd (Setting).
// Ashtami Shani = Saturn in 8th from Moon (~2.5 yr); Kantak/Dhaiya = 4th
// from Moon (~2.5 yr). All produce hardship phases worth timing.
//
// Each 30° sign is sub-divided into 8 kakshyas of 3.75° with planetary
// lords in the Prastaraka order (SA ME RA JU VE MA MO SU). For each
// kakshya within a Sade Sati sign we solve for the exact entry and exit
// dates of Saturn.

import { PlanetId, RASHIS, normDeg } from '../utils/astro-constants';
import { computeBody } from './ephemeris.service';
import { dateToJD, jdToDate } from '../utils/julian';
import { swisseph } from '../config/ephemeris';
import { KundaliResult } from './kundali.service';

const SA_ID = swisseph.SE_SATURN;

// 8 kakshyas of 3.75° per sign — Saturn's kakshya lord order (Prastaraka)
const KAKSHYA_LORDS: PlanetId[] = ['SA', 'JU', 'MA', 'SU', 'VE', 'ME', 'MO', 'RA'];
const KAKSHYA_SPAN = 30 / 8; // 3.75°

export type SadeSatiPhase = 'Rising' | 'Peak' | 'Setting' | 'Ashtami' | 'Kantak';

export interface SadeSatiKakshya {
  index: number;              // 0..7 within the sign
  lord: PlanetId;
  startDeg: number;           // 0, 3.75, 7.5, ...
  endDeg: number;
  startUTC: string;           // when Saturn entered
  endUTC: string;             // when Saturn leaves
}

export interface SadeSatiSignSegment {
  phase: SadeSatiPhase;
  signNum: number;            // 1..12
  signName: string;
  fromMoonHouse: number;      // 12, 1, 2, 8, 4
  entryUTC: string;
  exitUTC: string;
  kakshyas: SadeSatiKakshya[];
}

export interface SadeSatiCycle {
  cycle: number;              // 1,2,3... (ordered by start date)
  label: string;              // e.g. "Sade Sati 2027–2035"
  startUTC: string;
  endUTC: string;
  segments: SadeSatiSignSegment[];
}

export interface SadeSatiResult {
  moonSignNum: number;
  moonSignName: string;
  targetSigns: { phase: SadeSatiPhase; signNum: number; signName: string; fromMoonHouse: number }[];
  active: {
    phase: SadeSatiPhase | null;
    saturnSignNum: number;
    saturnHouseFromMoon: number;
    currentKakshya: number | null;   // 0..7
    currentKakshyaLord: PlanetId | null;
  };
  cycles: SadeSatiCycle[];            // past, current, future within the scan window
  ashtami: SadeSatiSignSegment[];     // 8th-from-Moon transits
  kantak: SadeSatiSignSegment[];      // 4th-from-Moon transits
}

// ─── Saturn longitude helper ────────────────────────────────────────────────

function saturnLongAt(jd: number): number {
  return normDeg(computeBody(jd, SA_ID).longitude);
}

function saturnSignAt(jd: number): number {
  return Math.floor(saturnLongAt(jd) / 30) + 1; // 1..12
}

// Binary-search the JD when Saturn first enters `targetSignNum` starting
// from `lo` where its sign is different.
function findSignIngress(loJD: number, hiJD: number, targetSignNum: number): number {
  // Assume: sign at loJD != target; sign at hiJD == target. Find transition.
  let a = loJD, b = hiJD;
  for (let i = 0; i < 40; i++) {
    const mid = (a + b) / 2;
    if (saturnSignAt(mid) === targetSignNum) b = mid;
    else a = mid;
    if (b - a < 1 / 24) break; // within 1 hour
  }
  return b;
}

// Binary-search the JD when Saturn first leaves `signNum`
function findSignExit(loJD: number, hiJD: number, signNum: number): number {
  let a = loJD, b = hiJD;
  for (let i = 0; i < 40; i++) {
    const mid = (a + b) / 2;
    if (saturnSignAt(mid) !== signNum) b = mid;
    else a = mid;
    if (b - a < 1 / 24) break;
  }
  return b;
}

// Solve JD where Saturn's longitude equals `targetDeg` (0..360), within [lo,hi]
function findLongitudeCrossing(loJD: number, hiJD: number, targetDeg: number): number {
  let a = loJD, b = hiJD;
  for (let i = 0; i < 40; i++) {
    const mid = (a + b) / 2;
    const x = saturnLongAt(mid);
    // direction: Saturn generally moves forward. During retrograde it moves back.
    // Use sign of (target - x) combined with endpoint longitudes to bracket.
    const xa = saturnLongAt(a);
    const xb = saturnLongAt(b);
    // Normalize within the ~2.5yr sign window — unwrapping not needed if short
    if ((xa - targetDeg) * (x - targetDeg) <= 0) b = mid; else a = mid;
    if (b - a < 1 / 24) break;
  }
  return b;
}

// Walk Saturn's sign timeline between [scanStartJD, scanEndJD], returning
// ingress events { jd, signNum } ordered by time. Uses coarse ~week step.
function saturnIngresses(scanStartJD: number, scanEndJD: number): { jd: number; signNum: number }[] {
  const step = 7; // days
  let prev = saturnSignAt(scanStartJD);
  const out: { jd: number; signNum: number }[] = [{ jd: scanStartJD, signNum: prev }];
  for (let jd = scanStartJD + step; jd <= scanEndJD; jd += step) {
    const s = saturnSignAt(jd);
    if (s !== prev) {
      // refine
      const exact = findSignIngress(jd - step, jd, s);
      out.push({ jd: exact, signNum: s });
      prev = s;
    }
  }
  return out;
}

// ─── Kakshya windows inside a [entry, exit] for a given sign ─────────────
function buildKakshyas(entryJD: number, exitJD: number, signNum: number): SadeSatiKakshya[] {
  const signStartDeg = (signNum - 1) * 30;
  const out: SadeSatiKakshya[] = [];
  for (let i = 0; i < 8; i++) {
    const startDeg = i * KAKSHYA_SPAN;
    const endDeg = (i + 1) * KAKSHYA_SPAN;
    const absStart = signStartDeg + startDeg;
    const absEnd = signStartDeg + endDeg - 0.0001; // avoid ambiguity on boundary
    // Saturn may traverse the kakshya 1-3 times due to retrograde. For a
    // simple timeline we take the first crossing of the start and the last
    // crossing of the end within [entryJD, exitJD].
    const kStart = i === 0 ? entryJD : findLongitudeCrossing(entryJD, exitJD, absStart);
    const kEnd = i === 7 ? exitJD : findLongitudeCrossing(entryJD, exitJD, absEnd);
    out.push({
      index: i,
      lord: KAKSHYA_LORDS[i],
      startDeg,
      endDeg,
      startUTC: jdToDate(kStart).toISOString(),
      endUTC: jdToDate(kEnd).toISOString(),
    });
  }
  return out;
}

// ─── Main entry ─────────────────────────────────────────────────────────────

export function computeSadeSati(natal: KundaliResult, whenISO?: string): SadeSatiResult {
  const when = whenISO ? new Date(whenISO) : new Date();
  const nowJD = dateToJD(when);
  const moonSignNum = natal.planets.find((p) => p.id === 'MO')!.rashi.num; // 1..12

  const phaseOfHouse = (h: number): SadeSatiPhase | null => {
    if (h === 12) return 'Rising';
    if (h === 1) return 'Peak';
    if (h === 2) return 'Setting';
    if (h === 8) return 'Ashtami';
    if (h === 4) return 'Kantak';
    return null;
  };

  const signFromHouse = (house: number): number => {
    // house is from Moon; return absolute sign 1..12
    return ((moonSignNum - 1 + (house - 1)) % 12) + 1;
  };

  const sadeSatiSigns = [12, 1, 2].map((h) => signFromHouse(h));
  const targetSigns = ([12, 1, 2, 8, 4] as const).map((h) => {
    const sn = signFromHouse(h);
    return {
      phase: phaseOfHouse(h)!,
      signNum: sn,
      signName: RASHIS[sn - 1].name,
      fromMoonHouse: h,
    };
  });

  // Scan window: 60 years around 'now' captures ~2 cycles either side
  const windowYears = 60;
  const scanStartJD = nowJD - windowYears * 365.25;
  const scanEndJD = nowJD + windowYears * 365.25;
  const events = saturnIngresses(scanStartJD, scanEndJD);

  // Build SadeSatiSignSegment for every ingress whose signNum is of interest
  function segmentFor(i: number, desiredSet: number[]): SadeSatiSignSegment | null {
    const e = events[i];
    if (!desiredSet.includes(e.signNum)) return null;
    const next = events[i + 1];
    const exitJD = next ? next.jd : scanEndJD;
    const house = ((e.signNum - moonSignNum + 12) % 12) + 1;
    const phase = phaseOfHouse(house)!;
    return {
      phase,
      signNum: e.signNum,
      signName: RASHIS[e.signNum - 1].name,
      fromMoonHouse: house,
      entryUTC: jdToDate(e.jd).toISOString(),
      exitUTC: jdToDate(exitJD).toISOString(),
      kakshyas: buildKakshyas(e.jd, exitJD, e.signNum),
    };
  }

  // Sade Sati segments + group consecutive into cycles (3 signs of 2.5yr each)
  const ssSegments: SadeSatiSignSegment[] = [];
  for (let i = 0; i < events.length; i++) {
    const seg = segmentFor(i, sadeSatiSigns);
    if (seg) ssSegments.push(seg);
  }

  // Group into cycles: a cycle = segment chain starting at Rising (12th) with
  // consecutive Rising → Peak → Setting. Runs that don't start at Rising
  // (partial windows at the scan edges) are still included as partial cycles.
  const cycles: SadeSatiCycle[] = [];
  let i = 0;
  let cycleNum = 1;
  while (i < ssSegments.length) {
    // collect up to 3 consecutive segments matching Rising→Peak→Setting
    const group: SadeSatiSignSegment[] = [ssSegments[i]];
    let j = i + 1;
    while (j < ssSegments.length && group.length < 3) {
      // Check if next segment continues the chain
      const prev = group[group.length - 1];
      const cand = ssSegments[j];
      // Continuation if candidate sign is (prev sign % 12) + 1 (next sign)
      // AND candidate starts within ~1 week of prev's exit
      const next = (prev.signNum % 12) + 1;
      const gapDays = (new Date(cand.entryUTC).getTime() - new Date(prev.exitUTC).getTime()) / 86400000;
      if (cand.signNum === next && Math.abs(gapDays) < 90) {
        group.push(cand);
        j++;
      } else break;
    }
    const start = group[0].entryUTC;
    const end = group[group.length - 1].exitUTC;
    const y1 = new Date(start).getUTCFullYear();
    const y2 = new Date(end).getUTCFullYear();
    cycles.push({
      cycle: cycleNum++,
      label: `Sade Sati ${y1}–${y2}`,
      startUTC: start,
      endUTC: end,
      segments: group,
    });
    i = j;
  }

  // Ashtami Shani and Kantak Shani — simpler: every segment in those signs
  const ashtamiSign = signFromHouse(8);
  const kantakSign = signFromHouse(4);
  const ashtami: SadeSatiSignSegment[] = [];
  const kantak: SadeSatiSignSegment[] = [];
  for (let k = 0; k < events.length; k++) {
    const a = segmentFor(k, [ashtamiSign]);
    if (a) ashtami.push(a);
    const c = segmentFor(k, [kantakSign]);
    if (c) kantak.push(c);
  }

  // Active status right now
  const satLongNow = saturnLongAt(nowJD);
  const satSignNow = Math.floor(satLongNow / 30) + 1;
  const satHouseFromMoon = ((satSignNow - moonSignNum + 12) % 12) + 1;
  const activePhase = phaseOfHouse(satHouseFromMoon);
  let currentKakshya: number | null = null;
  let currentKakshyaLord: PlanetId | null = null;
  if (activePhase) {
    const degInSign = satLongNow - (satSignNow - 1) * 30;
    currentKakshya = Math.min(7, Math.floor(degInSign / KAKSHYA_SPAN));
    currentKakshyaLord = KAKSHYA_LORDS[currentKakshya];
  }

  return {
    moonSignNum,
    moonSignName: RASHIS[moonSignNum - 1].name,
    targetSigns,
    active: {
      phase: activePhase,
      saturnSignNum: satSignNow,
      saturnHouseFromMoon: satHouseFromMoon,
      currentKakshya,
      currentKakshyaLord,
    },
    cycles,
    ashtami,
    kantak,
  };
}
