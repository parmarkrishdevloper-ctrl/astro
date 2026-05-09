// Krishnamurti Paddhati (KP) calculations.
//
// KP uses Placidus house cusps (already returned by swisseph) and divides
// each Nakshatra into 9 unequal "subs" — each sub is proportional to the
// Vimshottari Dasha years of a planet (Ke 7, Ve 20, Su 6, …, Me 17), giving
// 27 × 9 = 243 sub-divisions across the zodiac.  Every degree therefore has
// a Sign Lord, a Star Lord (nakshatra ruler), and a Sub Lord — the trio that
// drives every KP prediction.
//
// We expose:
//   - lordsAt(longitude)        → { sign, star, sub }
//   - calculateKP(kundali)      → cusps + planet KP-lords + significators
//   - computeRulingPlanets(...) → ruling planets at the current moment

import {
  RASHIS,
  NAKSHATRAS,
  NAK_SPAN,
  PlanetId,
  VIMSHOTTARI_ORDER,
  VIMSHOTTARI_YEARS,
  VIMSHOTTARI_TOTAL,
  normDeg,
} from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { computeAllGrahas, computeAscendant } from './ephemeris.service';
import { dateToJD } from '../utils/julian';

export interface KPLords {
  sign: PlanetId;
  star: PlanetId;
  sub: PlanetId;
  /** KP-5 level — the sub of the sub (Sub-Sub Lord). Used for fine-grained
   *  timing in event prediction. */
  subSub: PlanetId;
  /** KP-6 level — the sub of the sub-sub (4th deep level). Used by advanced
   *  KP practitioners for pin-point timing of fleeting events. */
  subSubSub: PlanetId;
}

/**
 * Build the 9 sub-spans (in degrees) inside a single nakshatra, starting
 * from the nakshatra's own lord and walking the Vimshottari order. Each
 * sub's width = NAK_SPAN × (planet's Vim years / 120).
 */
function subSpansForStarLord(starLord: PlanetId): { lord: PlanetId; width: number }[] {
  const startIdx = VIMSHOTTARI_ORDER.indexOf(starLord);
  const spans: { lord: PlanetId; width: number }[] = [];
  for (let i = 0; i < 9; i++) {
    const lord = VIMSHOTTARI_ORDER[(startIdx + i) % 9];
    spans.push({
      lord,
      width: NAK_SPAN * (VIMSHOTTARI_YEARS[lord] / VIMSHOTTARI_TOTAL),
    });
  }
  return spans;
}

/** Sign / Star / Sub lord for any sidereal longitude. */
export function lordsAt(longitude: number): KPLords {
  const lon = normDeg(longitude);
  const signNum = Math.floor(lon / 30) + 1;
  const sign = RASHIS[signNum - 1].lord;

  const nakNum = Math.floor(lon / NAK_SPAN) + 1;
  const nak = NAKSHATRAS[nakNum - 1];
  const star = nak.lord;

  // Position inside the nakshatra
  const into = lon - (nakNum - 1) * NAK_SPAN;
  const spans = subSpansForStarLord(star);
  let acc = 0;
  let sub: PlanetId = star;
  let subStart = 0;
  let subWidth = spans[0].width;
  for (const s of spans) {
    if (into < acc + s.width) {
      sub = s.lord;
      subStart = acc;
      subWidth = s.width;
      break;
    }
    acc += s.width;
  }

  // Sub-sub lord — divide the sub span by Vimshottari proportions again,
  // starting from the sub lord itself.
  const intoSub = into - subStart;
  const subSpans: { lord: PlanetId; width: number }[] = (() => {
    const startIdx = VIMSHOTTARI_ORDER.indexOf(sub);
    const out: { lord: PlanetId; width: number }[] = [];
    for (let i = 0; i < 9; i++) {
      const lord = VIMSHOTTARI_ORDER[(startIdx + i) % 9];
      out.push({ lord, width: subWidth * (VIMSHOTTARI_YEARS[lord] / VIMSHOTTARI_TOTAL) });
    }
    return out;
  })();
  let acc2 = 0;
  let subSub: PlanetId = sub;
  let subSubStart = 0;
  let subSubWidth = subSpans[0].width;
  for (const s of subSpans) {
    if (intoSub < acc2 + s.width) {
      subSub = s.lord;
      subSubStart = acc2;
      subSubWidth = s.width;
      break;
    }
    acc2 += s.width;
  }

  // Sub-sub-sub lord — 4th-level recursion. Divide the sub-sub span by
  // Vimshottari proportions starting from the sub-sub lord.
  const intoSubSub = intoSub - subSubStart;
  let acc3 = 0;
  let subSubSub: PlanetId = subSub;
  const sssStartIdx = VIMSHOTTARI_ORDER.indexOf(subSub);
  for (let i = 0; i < 9; i++) {
    const lord = VIMSHOTTARI_ORDER[(sssStartIdx + i) % 9];
    const width = subSubWidth * (VIMSHOTTARI_YEARS[lord] / VIMSHOTTARI_TOTAL);
    if (intoSubSub < acc3 + width) { subSubSub = lord; break; }
    acc3 += width;
  }

  return { sign, star, sub, subSub, subSubSub };
}

export interface KPCusp {
  house: number;
  longitude: number;
  signNum: number;
  signName: string;
  signLord: PlanetId;
  starLord: PlanetId;
  subLord: PlanetId;
  subSubLord: PlanetId;
  subSubSubLord: PlanetId;
}

export interface KPPlanetEntry {
  id: PlanetId;
  longitude: number;
  signLord: PlanetId;
  starLord: PlanetId;
  subLord: PlanetId;
  subSubLord: PlanetId;
  subSubSubLord: PlanetId;
  houseOccupied: number;
}

export interface KPSignificator {
  planet: PlanetId;
  /** Houses that this planet "signifies" (per the four-step KP rule). */
  houses: number[];
}

/** For each house, the planets that signify it, graded A (strongest) → D. */
export interface KPCuspSignificator {
  house: number;
  A: PlanetId[];  // planets in the star of an occupant
  B: PlanetId[];  // occupants themselves
  C: PlanetId[];  // planets in the star of the house lord
  D: PlanetId[];  // the house lord itself
}

/** KP Cuspal Interlink — chains a cusp's sub-lord back through significator
 *  levels to verify a fructification promise.
 *
 *  Classical KP "cuspal sub lord" rule: the sub-lord of any bhava cusp
 *  decides whether that house will fructify — its signification of the
 *  bhava's indicators (own, 2/11 for 2nd, 5/11 for 5th, etc.) is what you
 *  confirm. The interlink maps each cusp → its sub lord → the houses that
 *  sub lord signifies → whether those houses match the bhava's expected
 *  significators. */
export interface KPCuspalInterlink {
  house: number;
  subLord: PlanetId;
  /** Houses that this sub-lord signifies under the A/B/C/D rule (union) */
  signifies: number[];
  /** Classical expected houses for this bhava to "fructify" */
  expected: number[];
  /** True if signifies ∩ expected is non-empty */
  promises: boolean;
  matchedHouses: number[];
}

export interface KPResult {
  cusps: KPCusp[];
  planets: KPPlanetEntry[];
  significators: KPSignificator[];
  cuspSignificators: KPCuspSignificator[];
  cuspalInterlinks: KPCuspalInterlink[];
}

/** Classical KP expectation table — what houses the cusp sub-lord of each
 *  bhava must signify for that bhava to be "promised". */
const BHAVA_PROMISE_HOUSES: Record<number, number[]> = {
  1:  [1, 5, 9],       // Self, prosperity, dharma
  2:  [2, 11],         // Wealth, gain
  3:  [3, 9, 11],      // Courage, long travel, gain
  4:  [4, 11],         // Home, gain
  5:  [2, 5, 11],      // Progeny/wealth
  6:  [6, 8, 12],      // Dushtana — debt/disease/enemy
  7:  [2, 7, 11],      // Marriage
  8:  [6, 8, 12],      // Longevity
  9:  [3, 9, 12],      // Fortune, long travel
  10: [6, 10, 11],     // Career success
  11: [2, 6, 11],      // Gain, loans recovered
  12: [5, 9, 12],      // Moksha / foreign
};

/** Build KP cusps from a kundali (uses Placidus longitudes already in `houses`). */
export function calculateKP(k: KundaliResult): KPResult {
  const cusps: KPCusp[] = k.houses.map((h) => {
    const l = lordsAt(h.cuspLongitude);
    return {
      house: h.num,
      longitude: h.cuspLongitude,
      signNum: h.rashiNum,
      signName: h.rashiName,
      signLord: l.sign,
      starLord: l.star,
      subLord: l.sub,
      subSubLord: l.subSub,
      subSubSubLord: l.subSubSub,
    };
  });

  const planets: KPPlanetEntry[] = k.planets.map((p) => {
    const l = lordsAt(p.longitude);
    return {
      id: p.id,
      longitude: p.longitude,
      signLord: l.sign,
      starLord: l.star,
      subLord: l.sub,
      subSubLord: l.subSub,
      subSubSubLord: l.subSubSub,
      houseOccupied: p.house,
    };
  });

  const significators = computeSignificators(planets, cusps);
  const cuspSignificators = computeCuspSignificators(planets, cusps);
  const cuspalInterlinks = computeCuspalInterlinks(cusps, significators);
  return { cusps, planets, significators, cuspSignificators, cuspalInterlinks };
}

/** For each cusp, trace its sub-lord through the significator table and
 *  check whether it signifies the classical fructification set for that
 *  bhava. The result is the "cuspal sub lord promise" chain. */
function computeCuspalInterlinks(
  cusps: KPCusp[],
  significators: KPSignificator[],
): KPCuspalInterlink[] {
  const sigsByPlanet = new Map<PlanetId, number[]>();
  for (const s of significators) sigsByPlanet.set(s.planet, s.houses);

  return cusps.map((c) => {
    const expected = BHAVA_PROMISE_HOUSES[c.house];
    const signifies = sigsByPlanet.get(c.subLord) ?? [];
    const matchedHouses = signifies.filter((h) => expected.includes(h));
    return {
      house: c.house,
      subLord: c.subLord,
      signifies,
      expected,
      promises: matchedHouses.length > 0,
      matchedHouses,
    };
  });
}

/** Reverse of significators: for each house, list planets at A/B/C/D strength. */
function computeCuspSignificators(
  planets: KPPlanetEntry[],
  cusps: KPCusp[],
): KPCuspSignificator[] {
  const occupants: Record<number, PlanetId[]> = {};
  for (let h = 1; h <= 12; h++) occupants[h] = [];
  for (const p of planets) occupants[p.houseOccupied].push(p.id);

  return cusps.map((cusp) => {
    const h = cusp.house;
    const houseLord = cusp.signLord;
    const occ = occupants[h];
    const A: PlanetId[] = []; // star of occupant
    const B: PlanetId[] = occ.slice();
    const C: PlanetId[] = []; // star of house lord
    const D: PlanetId[] = [houseLord];

    for (const pl of planets) {
      if (occ.includes(pl.starLord) && !A.includes(pl.id)) A.push(pl.id);
      if (pl.starLord === houseLord && !C.includes(pl.id)) C.push(pl.id);
    }
    return { house: h, A, B, C, D };
  });
}

/**
 * KP four-step significator rule (in priority order):
 *   1. Planets in the star of an occupant of the house
 *   2. Occupants of the house themselves
 *   3. Planets in the star of the lord of the house
 *   4. The lord of the house
 *
 * For each planet we collect the union of houses it signifies under any of
 * the four steps. This is the standard "houses signified by a planet" view
 * used in KP charts.
 */
function computeSignificators(
  planets: KPPlanetEntry[],
  cusps: KPCusp[],
): KPSignificator[] {
  const housesByPlanet: Record<string, Set<number>> = {};
  const ensure = (id: PlanetId) => (housesByPlanet[id] ||= new Set<number>());

  // Pre-index occupants of each house
  const occupants: Record<number, PlanetId[]> = {};
  for (let h = 1; h <= 12; h++) occupants[h] = [];
  for (const p of planets) occupants[p.houseOccupied].push(p.id);

  for (let h = 1; h <= 12; h++) {
    const cusp = cusps[h - 1];
    const houseLord = cusp.signLord;
    const occ = occupants[h];

    // Step 1: planets in the star of an occupant
    for (const planet of planets) {
      if (occ.includes(planet.starLord)) ensure(planet.id).add(h);
    }
    // Step 2: occupants themselves
    for (const o of occ) ensure(o).add(h);
    // Step 3: planets in the star of the house lord
    for (const planet of planets) {
      if (planet.starLord === houseLord) ensure(planet.id).add(h);
    }
    // Step 4: the house lord itself
    ensure(houseLord).add(h);
  }

  return Object.entries(housesByPlanet).map(([planet, set]) => ({
    planet: planet as PlanetId,
    houses: [...set].sort((a, b) => a - b),
  }));
}

// ─── Ruling Planets (current moment) ────────────────────────────────────────

export interface RulingPlanets {
  /** Day-lord based on weekday (Sun=Sunday, Moon=Monday, …) */
  dayLord: PlanetId;
  /** Moon's sign lord, star lord, sub lord at the current moment */
  moonSignLord: PlanetId;
  moonStarLord: PlanetId;
  moonSubLord: PlanetId;
  /** Ascendant sign lord, star lord, sub lord at the current moment */
  ascSignLord: PlanetId;
  ascStarLord: PlanetId;
  ascSubLord: PlanetId;
  /** All ruling planets de-duplicated, in canonical order */
  ruling: PlanetId[];
}

const WEEKDAY_LORDS: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA'];

export function computeRulingPlanets(
  whenISO: string,
  lat: number,
  lng: number,
): RulingPlanets {
  const d = new Date(whenISO);
  const jd = dateToJD(d);
  const grahas = computeAllGrahas(jd);
  const asc = computeAscendant(jd, lat, lng);

  const moon = lordsAt(grahas.MO.longitude);
  const ascL = lordsAt(asc.ascendant);

  // 0=Sunday in JS getDay → SU is index 0 in WEEKDAY_LORDS
  const dayLord = WEEKDAY_LORDS[d.getUTCDay()];

  const all = [
    dayLord,
    moon.sign, moon.star, moon.sub,
    ascL.sign, ascL.star, ascL.sub,
  ];
  const seen = new Set<PlanetId>();
  const ruling: PlanetId[] = [];
  for (const id of all) {
    if (!seen.has(id)) {
      seen.add(id);
      ruling.push(id);
    }
  }

  return {
    dayLord,
    moonSignLord: moon.sign,
    moonStarLord: moon.star,
    moonSubLord: moon.sub,
    ascSignLord: ascL.sign,
    ascStarLord: ascL.star,
    ascSubLord: ascL.sub,
    ruling,
  };
}
