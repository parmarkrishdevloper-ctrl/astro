// Multi-system dasha registry.
// Each system is a nakshatra-based varying-cycle dasha with a fixed lord
// sequence + per-lord years + a rule for determining the starting lord and
// the balance (elapsed fraction) at birth.
//
// The same proportional-subdivision rule (child duration = parent duration
// × lordYears / systemTotal) applies at every level for every system, so
// the existing 6-level drill-down engine works for all of them once a
// system is identified by key.

import { PlanetId, VEDIC_PLANETS, NAK_SPAN, nakshatraOf } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';

export type DashaSystemKey =
  | 'vimshottari' | 'yogini' | 'ashtottari'
  | 'shodasottari' | 'dwadashottari' | 'panchottari'
  | 'shatabdika'   | 'naisargika'    | 'kalachakra';

export interface DashaLordSpec {
  lord: PlanetId;
  years: number;
  displayName?: string;  // e.g. "Mangala" yogini, alongside Moon lord
  displayNameHi?: string;
}

export interface DashaSystem {
  key: DashaSystemKey;
  name: string;
  nameHi: string;
  totalYears: number;
  order: DashaLordSpec[];  // fixed cycle order, starting from a canonical reference
  purpose: string;
  condition?: string;  // classical applicability note
}

// ─── VIMSHOTTARI (for completeness — engine already uses these) ───────────────

const VIMSHOTTARI: DashaSystem = {
  key: 'vimshottari',
  name: 'Vimshottari',
  nameHi: 'विंशोत्तरी',
  totalYears: 120,
  order: [
    { lord: 'KE', years: 7 },
    { lord: 'VE', years: 20 },
    { lord: 'SU', years: 6 },
    { lord: 'MO', years: 10 },
    { lord: 'MA', years: 7 },
    { lord: 'RA', years: 18 },
    { lord: 'JU', years: 16 },
    { lord: 'SA', years: 19 },
    { lord: 'ME', years: 17 },
  ],
  purpose: 'Primary Parashari dasha — 120-year cycle across 9 grahas, ordered by nakshatra lord',
  condition: 'Universal — applies to all charts',
};

// ─── YOGINI (36 years, 8 yoginis) ───────────────────────────────────────────
//
// Each yogini has a ruling planet. Cycle order starts from Mangala (Moon).
// Starting yogini is determined by (nakshatra_index − 1) mod 8.
// Balance = yogini_years × (1 − elapsed_in_nakshatra_fraction).

const YOGINI: DashaSystem = {
  key: 'yogini',
  name: 'Yogini',
  nameHi: 'योगिनी',
  totalYears: 36,
  order: [
    { lord: 'MO', years: 1, displayName: 'Mangala',  displayNameHi: 'मंगला'  },
    { lord: 'SU', years: 2, displayName: 'Pingala',  displayNameHi: 'पिंगला'  },
    { lord: 'JU', years: 3, displayName: 'Dhanya',   displayNameHi: 'धान्या'  },
    { lord: 'MA', years: 4, displayName: 'Bhramari', displayNameHi: 'भ्रामरी' },
    { lord: 'ME', years: 5, displayName: 'Bhadrika', displayNameHi: 'भद्रिका' },
    { lord: 'SA', years: 6, displayName: 'Ulka',     displayNameHi: 'उल्का'   },
    { lord: 'VE', years: 7, displayName: 'Siddha',   displayNameHi: 'सिद्धा'  },
    { lord: 'RA', years: 8, displayName: 'Sankata',  displayNameHi: 'संकटा'   },
  ],
  purpose: '36-year 8-yogini cycle — second opinion alongside Vimshottari, strong for day-to-day timing',
  condition: 'Universal',
};

// ─── ASHTOTTARI (108 years, 8 planets — Moon excluded) ────────────────────
//
// Uses Moon's longitude on a 108-year zodiac cycle starting at Krittika 1
// (26°40' Aries). Each of 8 planets gets a longitudinal arc proportional
// to its years: offsetLong × 108 / 360 → years-traversed in the cycle.
// Starting lord = the planet whose segment contains that position.
// Balance = segmentYears − position_within_segment.
//
// Order per Brihat Parashara Hora Shastra tradition.

const ASHTOTTARI: DashaSystem = {
  key: 'ashtottari',
  name: 'Ashtottari',
  nameHi: 'अष्टोत्तरी',
  totalYears: 108,
  order: [
    { lord: 'SU', years: 6  },
    { lord: 'MO', years: 15 },
    { lord: 'MA', years: 8  },
    { lord: 'ME', years: 17 },
    { lord: 'SA', years: 10 },
    { lord: 'JU', years: 19 },
    { lord: 'RA', years: 12 },
    { lord: 'VE', years: 21 },
  ],
  purpose: '108-year Parashari cycle across 8 grahas (no Ketu) — classical alternate to Vimshottari, cross-check for life events',
  condition: 'Strongest when Rahu is in a trine/quadrant from the lagna lord or in 3rd/6th/8th/12th from lagna (classical). Engine computes it for any chart as a secondary view.',
};

// ─── SHODASOTTARI (116 years, 8 grahas — no Ketu) ─────────────────────────
// Classical applicability: Lagna in Krishna paksha of a night birth or
// Shukla paksha of a day birth. Engine computes it for any chart as an
// alternate view per BPHS ch.47.

const SHODASOTTARI: DashaSystem = {
  key: 'shodasottari',
  name: 'Shodasottari',
  nameHi: 'षोडशोत्तरी',
  totalYears: 116,
  order: [
    { lord: 'SU', years: 11 },
    { lord: 'MO', years: 11 },
    { lord: 'MA', years: 12 },
    { lord: 'ME', years: 13 },
    { lord: 'SA', years: 14 },
    { lord: 'JU', years: 15 },
    { lord: 'RA', years: 16 },
    { lord: 'VE', years: 24 },
  ],
  purpose: '116-year 8-graha cycle (no Ketu) — classical alternate for specific paksha-time combinations',
  condition: 'Krishna-paksha night birth or Shukla-paksha day birth (BPHS)',
};

// ─── DWADASHOTTARI (112 years, 8 grahas) ─────────────────────────────────
// Classical applicability: Lagna in Sun's navamsha / Pushkara navamsha.

const DWADASHOTTARI: DashaSystem = {
  key: 'dwadashottari',
  name: 'Dwadashottari',
  nameHi: 'द्वादशोत्तरी',
  totalYears: 112,
  order: [
    { lord: 'SU', years:  7 },
    { lord: 'MO', years:  9 },
    { lord: 'MA', years: 11 },
    { lord: 'ME', years: 13 },
    { lord: 'JU', years: 15 },
    { lord: 'VE', years: 17 },
    { lord: 'SA', years: 19 },
    { lord: 'RA', years: 21 },
  ],
  purpose: '112-year 8-graha cycle — arithmetic progression of years, applies to specific navamsha-lagna conditions',
  condition: 'Lagna falls in a Pushkara navamsha or Sun\'s navamsha (BPHS)',
};

// ─── PANCHOTTARI (105 years, 7 grahas — no nodes) ────────────────────────
// Classical applicability: Lagna in Cancer navamsha.

const PANCHOTTARI: DashaSystem = {
  key: 'panchottari',
  name: 'Panchottari',
  nameHi: 'पञ्चोत्तरी',
  totalYears: 105,
  order: [
    { lord: 'SU', years: 12 },
    { lord: 'MO', years: 15 },
    { lord: 'MA', years: 17 },
    { lord: 'ME', years: 10 },
    { lord: 'JU', years: 10 },
    { lord: 'VE', years: 21 },
    { lord: 'SA', years: 20 },
  ],
  purpose: '105-year 7-graha cycle (no Rahu/Ketu) — applies when ascendant falls in a water navamsha',
  condition: 'Lagna in Cancer navamsha (BPHS)',
};

// ─── SHATABDIKA (100 years, 8 grahas) ────────────────────────────────────
// Classical applicability: Lagna in Vargottama navamsha (same sign in D1+D9).

const SHATABDIKA: DashaSystem = {
  key: 'shatabdika',
  name: 'Shatabdika',
  nameHi: 'शताब्दिका',
  totalYears: 100,
  order: [
    { lord: 'SU', years:  5 },
    { lord: 'MO', years:  5 },
    { lord: 'MA', years: 10 },
    { lord: 'ME', years: 10 },
    { lord: 'VE', years: 15 },
    { lord: 'JU', years: 20 },
    { lord: 'SA', years: 15 },
    { lord: 'RA', years: 20 },
  ],
  purpose: '100-year 8-graha cycle — clean centennial framing for long-life charts',
  condition: 'Lagna in Vargottama navamsha (BPHS)',
};

// ─── NAISARGIKA (natural / 120 years) ─────────────────────────────────────
// Not nakshatra-based. Parashara's "natural dasha" — planets rule life stages
// in their natural age order, regardless of birth details. Used alongside
// Vimshottari as a life-stage overlay (infancy → elderhood).

const NAISARGIKA: DashaSystem = {
  key: 'naisargika',
  name: 'Naisargika',
  nameHi: 'नैसर्गिक',
  totalYears: 120,
  order: [
    { lord: 'MO', years:  1, displayName: 'Infancy'     },
    { lord: 'MA', years:  2, displayName: 'Childhood'   },
    { lord: 'ME', years:  9, displayName: 'Youth'       },
    { lord: 'VE', years: 20, displayName: 'Young adult' },
    { lord: 'JU', years: 18, displayName: 'Middle age'  },
    { lord: 'SU', years: 20, displayName: 'Mature'      },
    { lord: 'SA', years: 50, displayName: 'Elderhood'   },
  ],
  purpose: 'Natural life-stage dasha — same cycle for every chart, infancy to elderhood',
  condition: 'Universal — not chart-dependent. Use as a life-stage overlay beside Vimshottari',
};

// ─── KALACHAKRA (108 years, 9 grahas, pada-triggered) ───────────────────
// Classical Kalachakra uses a 108-amsha mapping table (27 nakshatras × 4
// padas) that prescribes a per-pada starting rashi + lord. This first-pass
// implementation uses the Vimshottari order with a 108-year distribution,
// keyed off Moon's pada index (1..108) mod 9. A full amsha-table variant is
// a future refinement.

const KALACHAKRA: DashaSystem = {
  key: 'kalachakra',
  name: 'Kalachakra',
  nameHi: 'कालचक्र',
  totalYears: 108,
  order: [
    { lord: 'KE', years:  7 },
    { lord: 'VE', years: 20 },
    { lord: 'SU', years:  6 },
    { lord: 'MO', years: 10 },
    { lord: 'MA', years:  6 },
    { lord: 'RA', years: 16 },
    { lord: 'JU', years: 12 },
    { lord: 'SA', years: 16 },
    { lord: 'ME', years: 15 },
  ],
  purpose: '108-year wheel-of-time dasha — event-precision timing keyed to navamsha pada',
  condition: 'Simplified variant — uses Vimshottari-style order; classical amsha table pending',
};

export const DASHA_SYSTEMS: Record<DashaSystemKey, DashaSystem> = {
  vimshottari:    VIMSHOTTARI,
  yogini:         YOGINI,
  ashtottari:     ASHTOTTARI,
  shodasottari:   SHODASOTTARI,
  dwadashottari:  DWADASHOTTARI,
  panchottari:    PANCHOTTARI,
  shatabdika:     SHATABDIKA,
  naisargika:     NAISARGIKA,
  kalachakra:     KALACHAKRA,
};

export const DASHA_SYSTEM_KEYS: DashaSystemKey[] = [
  'vimshottari', 'yogini', 'ashtottari',
  'shodasottari', 'dwadashottari', 'panchottari', 'shatabdika', 'naisargika',
  'kalachakra',
];

// ─── Starting-lord + balance computation per system ──────────────────────────

/** Krittika 1st pada begins at 26°40' of Aries. */
const KRITTIKA_START_DEG = 26 + 40 / 60;

export interface DashaStart {
  system: DashaSystemKey;
  startingLord: PlanetId;
  startingLordYears: number;       // full cycle years for that lord
  balanceYears: number;             // un-elapsed portion of the first dasha
  elapsedFraction: number;          // 0..1 within the first dasha
  startingSpec: DashaLordSpec;
  note?: string;
}

export function planetName(id: PlanetId): string {
  return VEDIC_PLANETS.find((p) => p.id === id)!.name;
}

function getMoon(kundali: KundaliResult) {
  const moon = kundali.planets.find((p) => p.id === 'MO');
  if (!moon) throw new Error('Moon not found in kundali');
  return moon;
}

function vimshottariStart(kundali: KundaliResult): DashaStart {
  const moon = getMoon(kundali);
  const nak = nakshatraOf(moon.longitude);
  const lord = nak.lord;
  const system = DASHA_SYSTEMS.vimshottari;
  const spec = system.order.find((s) => s.lord === lord)!;
  const elapsed = nak.degInNak / NAK_SPAN;
  return {
    system: 'vimshottari',
    startingLord: lord,
    startingLordYears: spec.years,
    balanceYears: spec.years * (1 - elapsed),
    elapsedFraction: elapsed,
    startingSpec: spec,
  };
}

function yoginiStart(kundali: KundaliResult): DashaStart {
  const moon = getMoon(kundali);
  const nak = nakshatraOf(moon.longitude);
  // 8 yoginis cycle through 27 nakshatras — (nakNum-1) mod 8 gives position
  const idx = (nak.num - 1) % 8;
  const system = DASHA_SYSTEMS.yogini;
  const spec = system.order[idx];
  const elapsed = nak.degInNak / NAK_SPAN;
  return {
    system: 'yogini',
    startingLord: spec.lord,
    startingLordYears: spec.years,
    balanceYears: spec.years * (1 - elapsed),
    elapsedFraction: elapsed,
    startingSpec: spec,
    note: `Nakshatra ${nak.num} → yogini ${spec.displayName}`,
  };
}

function ashtottariStart(kundali: KundaliResult): DashaStart {
  const moon = getMoon(kundali);
  // Cycle origin = Krittika 1st pada = 26°40' Aries.
  const offsetLong = ((moon.longitude - KRITTIKA_START_DEG) + 360) % 360;
  // Convert longitudinal offset into years-traversed along the 108y cycle.
  const yearsIn = (offsetLong / 360) * 108;
  const system = DASHA_SYSTEMS.ashtottari;
  let cum = 0;
  let startingIdx = 0;
  for (let i = 0; i < system.order.length; i++) {
    const ny = system.order[i].years;
    if (yearsIn < cum + ny) { startingIdx = i; break; }
    cum += ny;
  }
  const spec = system.order[startingIdx];
  const elapsedInLord = yearsIn - cum;  // years already spent in this lord
  const elapsedFrac = elapsedInLord / spec.years;
  return {
    system: 'ashtottari',
    startingLord: spec.lord,
    startingLordYears: spec.years,
    balanceYears: spec.years - elapsedInLord,
    elapsedFraction: elapsedFrac,
    startingSpec: spec,
    note: `Moon at ${moon.longitude.toFixed(2)}° → ${yearsIn.toFixed(2)}y into 108y cycle (from Krittika 1st pada)`,
  };
}

// ─── Nakshatra-cyclic start (Shodasottari / Dwadashottari / Panchottari / Shatabdika) ───
//
// Same shape as Yogini: starting lord index = (nakshatra_num − 1) mod N,
// balance = fullYears × (1 − elapsedInNak). N = system.order.length.

function nakCyclicStart(kundali: KundaliResult, key: DashaSystemKey): DashaStart {
  const moon = getMoon(kundali);
  const nak = nakshatraOf(moon.longitude);
  const system = DASHA_SYSTEMS[key];
  const idx = (nak.num - 1) % system.order.length;
  const spec = system.order[idx];
  const elapsed = nak.degInNak / NAK_SPAN;
  return {
    system: key,
    startingLord: spec.lord,
    startingLordYears: spec.years,
    balanceYears: spec.years * (1 - elapsed),
    elapsedFraction: elapsed,
    startingSpec: spec,
    note: `Nakshatra ${nak.num} mod ${system.order.length} → ${spec.lord}${spec.displayName ? ` (${spec.displayName})` : ''}`,
  };
}

// ─── Naisargika start ─────────────────────────────────────────────────────
// Natural dasha starts fresh at Moon (infancy) for every chart, regardless
// of birth time. Balance = full Moon period.

function naisargikaStart(kundali: KundaliResult): DashaStart {
  void kundali;
  const system = DASHA_SYSTEMS.naisargika;
  const spec = system.order[0];
  return {
    system: 'naisargika',
    startingLord: spec.lord,
    startingLordYears: spec.years,
    balanceYears: spec.years,
    elapsedFraction: 0,
    startingSpec: spec,
    note: 'Natural dasha — begins at Moon (infancy) for every chart',
  };
}

// ─── Kalachakra start ─────────────────────────────────────────────────────
// 108 padas (27 nakshatras × 4) → index mod 9 picks the starting graha.
// Balance = fullYears × (1 − elapsedInPada).

function kalachakraStart(kundali: KundaliResult): DashaStart {
  const moon = getMoon(kundali);
  const nak = nakshatraOf(moon.longitude);
  const padaIdx = (nak.num - 1) * 4 + (nak.pada - 1); // 0..107
  const system = DASHA_SYSTEMS.kalachakra;
  const idx = padaIdx % system.order.length;
  const spec = system.order[idx];
  // Elapsed within the pada (pada span = NAK_SPAN/4)
  const padaSpan = NAK_SPAN / 4;
  const degInPada = nak.degInNak - (nak.pada - 1) * padaSpan;
  const elapsed = Math.max(0, Math.min(1, degInPada / padaSpan));
  return {
    system: 'kalachakra',
    startingLord: spec.lord,
    startingLordYears: spec.years,
    balanceYears: spec.years * (1 - elapsed),
    elapsedFraction: elapsed,
    startingSpec: spec,
    note: `Pada ${padaIdx + 1}/108 → idx ${idx} → ${spec.lord}`,
  };
}

export function computeDashaStart(
  kundali: KundaliResult,
  system: DashaSystemKey,
): DashaStart {
  switch (system) {
    case 'vimshottari':   return vimshottariStart(kundali);
    case 'yogini':        return yoginiStart(kundali);
    case 'ashtottari':    return ashtottariStart(kundali);
    case 'shodasottari':
    case 'dwadashottari':
    case 'panchottari':
    case 'shatabdika':    return nakCyclicStart(kundali, system);
    case 'naisargika':    return naisargikaStart(kundali);
    case 'kalachakra':    return kalachakraStart(kundali);
  }
}
