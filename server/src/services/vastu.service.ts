// Phase 13 — Vastu Shastra (Vedic directional architecture).
//
// The 8 cardinal/ordinal directions plus Brahmasthan (center) each have:
//   • A presiding deity (ashta-dikpala)
//   • A ruling planet
//   • A pañca-tattva (element) association
//   • Recommended/forbidden room placements
//
// This service combines the static table with the native's birth chart to
// personalise guidance: auspicious directions, head-while-sleeping direction,
// room-lord interactions, and doshas (architectural afflictions).

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';

export type Direction =
  | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE' | 'C';

export type Tattva = 'Prithvi' | 'Jala' | 'Agni' | 'Vayu' | 'Akasha';

export interface DirectionEntry {
  key: Direction;
  name: string;
  sanskrit: string;
  deity: string;          // ashta-dikpala
  planet: PlanetId | 'BR'; // BR = Brahma (center)
  tattva: Tattva;
  favoredRooms: string[];
  forbiddenRooms: string[];
  notes: string;
}

export const DIRECTIONS: Record<Direction, DirectionEntry> = {
  E:  { key:'E',  name:'East',        sanskrit:'पूर्व',      deity:'Indra',    planet:'SU', tattva:'Agni',    favoredRooms:['Entrance', 'Pooja room (for sunrise darshan)', 'Bathing area'], forbiddenRooms:['Toilet', 'Store-room'],     notes:'Sun rises east — charges the home with prana. Keep open, windowed.' },
  SE: { key:'SE', name:'South-East',  sanskrit:'आग्नेय',     deity:'Agni',     planet:'VE', tattva:'Agni',    favoredRooms:['Kitchen', 'Electrical/fire equipment'],                         forbiddenRooms:['Bedroom (master)', 'Pooja room'],                                   notes:'Ruled by Agni — ideal for cooking and boilers.' },
  S:  { key:'S',  name:'South',       sanskrit:'दक्षिण',     deity:'Yama',     planet:'MA', tattva:'Prithvi', favoredRooms:['Heavy storage', 'Master bedroom (head south)'],              forbiddenRooms:['Entrance (main)', 'Pooja room'],                                    notes:'Closed, weighted — grounds the dwelling.' },
  SW: { key:'SW', name:'South-West',  sanskrit:'नैऋर्त्य',   deity:'Nirriti',  planet:'RA', tattva:'Prithvi', favoredRooms:['Master bedroom', 'Heavy safes', 'Elder\'s room'],           forbiddenRooms:['Kitchen', 'Toilet', 'Entrance'],                                    notes:'Heaviest part of the house. Master lives here.' },
  W:  { key:'W',  name:'West',        sanskrit:'पश्चिम',    deity:'Varuna',   planet:'SA', tattva:'Jala',    favoredRooms:['Dining', 'Children\'s bedroom', 'Study'],                    forbiddenRooms:['Pooja room'],                                                        notes:'Water element — supports gain of knowledge.' },
  NW: { key:'NW', name:'North-West',  sanskrit:'वायव्य',    deity:'Vayu',     planet:'MO', tattva:'Vayu',    favoredRooms:['Guest room', 'Children above marriage age', 'Toilet (if no other option)'], forbiddenRooms:['Master bedroom', 'Kitchen'],                           notes:'Ruled by Vayu — movement. Good for guests and departure-age children.' },
  N:  { key:'N',  name:'North',       sanskrit:'उत्तर',      deity:'Kubera',   planet:'ME', tattva:'Jala',    favoredRooms:['Cash/treasury', 'Entrance', 'Office'],                        forbiddenRooms:['Toilet', 'Kitchen', 'Staircase'],                                    notes:'Kubera — wealth. Keep open, water-bodies favoured.' },
  NE: { key:'NE', name:'North-East',  sanskrit:'ईशान',       deity:'Ishana',   planet:'JU', tattva:'Akasha',  favoredRooms:['Pooja room', 'Meditation', 'Water source (well/tank)'],     forbiddenRooms:['Toilet', 'Kitchen', 'Bedroom', 'Staircase', 'Heavy furniture'],     notes:'Most sacred corner. Must be clean, light, open.' },
  C:  { key:'C',  name:'Brahmasthan', sanskrit:'ब्रह्मस्थान', deity:'Brahma',   planet:'BR', tattva:'Akasha',  favoredRooms:['Open courtyard', 'Skylight', 'Atrium'],                      forbiddenRooms:['Toilet', 'Kitchen', 'Heavy pillar', 'Beam'],                         notes:'Center of the plot — must remain void of obstruction. Vastu\'s heart.' },
};

// ═══════════════════════════════════════════════════════════════════════════
// Planet ↔ direction (for chart personalisation)
// ═══════════════════════════════════════════════════════════════════════════

const PLANET_DIRECTION: Record<PlanetId, Direction> = {
  SU: 'E',  MO: 'NW', MA: 'S',  ME: 'N',  JU: 'NE',
  VE: 'SE', SA: 'W',  RA: 'SW', KE: 'SW',  // Rahu+Ketu share SW (Nirriti)
};

// Sign → element → direction (rashi-bandhu)
const RASHI_DIRECTION: Record<number, Direction> = {
  // Fire signs → East; Earth → South; Air → West; Water → North
  1:  'E',  // Aries (fire)
  5:  'E',  // Leo (fire)
  9:  'E',  // Sagittarius (fire)
  2:  'S',  // Taurus (earth)
  6:  'S',  // Virgo (earth)
  10: 'S',  // Capricorn (earth)
  3:  'W',  // Gemini (air)
  7:  'W',  // Libra (air)
  11: 'W',  // Aquarius (air)
  4:  'N',  // Cancer (water)
  8:  'N',  // Scorpio (water)
  12: 'N',  // Pisces (water)
};

// Head-while-sleeping: by nakshatra lord (classical rule — head toward direction
// of the nakshatra's ruling planet; never toward north).
function headDirection(moonNakLord: PlanetId): Direction {
  const d = PLANET_DIRECTION[moonNakLord];
  // Never north — override to east
  return d === 'N' ? 'E' : d;
}

// ═══════════════════════════════════════════════════════════════════════════
// Personalised Vastu report
// ═══════════════════════════════════════════════════════════════════════════

export interface VastuDoshaCheck {
  dosha: string;
  severity: 'low' | 'medium' | 'high';
  remedy: string;
}

export interface VastuReport {
  directions: DirectionEntry[];           // static catalogue
  personal: {
    ascDirection: Direction;              // from ascendant rashi
    moonDirection: Direction;             // from Moon rashi
    strongestPlanet: PlanetId;            // approximated (exalted/own > debil)
    strongestDirection: Direction;
    headWhileSleeping: Direction;
    deskFacingWhileWorking: Direction;    // = direction opposite to seated
    meditationDirection: Direction;
    wealthCornerDirection: Direction;     // always N (Kubera) + 2nd lord's dir
  };
  roomAdvice: Record<string, { best: Direction[]; avoid: Direction[]; note: string }>;
  doshaChecks: VastuDoshaCheck[];         // universal + chart-driven advisories
  notes: string[];
}

function approximateStrongest(k: KundaliResult): PlanetId {
  // Lightweight strength: exalted > own > neutral > combust/debilitated.
  // (For a rigorous result the caller can pass pre-computed shadbala — we
  // keep this service self-contained and inexpensive.)
  const score: Record<PlanetId, number> = { SU:0,MO:0,MA:0,ME:0,JU:0,VE:0,SA:0,RA:0,KE:0 };
  for (const p of k.planets) {
    if (p.exalted) score[p.id] += 15;
    else if (p.ownSign) score[p.id] += 10;
    if (p.debilitated) score[p.id] -= 15;
    if (p.combust) score[p.id] -= 8;
    if (p.retrograde) score[p.id] += 3;
    // kendra/trikona boost
    if ([1,4,7,10].includes(p.house)) score[p.id] += 3;
    if ([5,9].includes(p.house)) score[p.id] += 3;
    if ([6,8,12].includes(p.house)) score[p.id] -= 2;
  }
  let best: PlanetId = 'SU';
  let bestScore = -Infinity;
  (Object.keys(score) as PlanetId[]).forEach((id) => {
    if (score[id] > bestScore) { bestScore = score[id]; best = id; }
  });
  return best;
}

function oppositeDirection(d: Direction): Direction {
  const opp: Record<Direction, Direction> = {
    E:'W', W:'E', N:'S', S:'N',
    NE:'SW', SW:'NE', NW:'SE', SE:'NW', C:'C',
  };
  return opp[d];
}

import { Locale as _VastuLocale } from '../i18n';

export function computeVastuReport(k: KundaliResult, _locale: _VastuLocale = 'en'): VastuReport {
  const ascRashi = k.ascendant.rashi.num;
  const moonPlanet = k.planets.find((p) => p.id === 'MO')!;
  const strongest = approximateStrongest(k);
  const moonNakLord = moonPlanet.nakshatra.lord;
  const ascDir = RASHI_DIRECTION[ascRashi];
  const moonDir = RASHI_DIRECTION[moonPlanet.rashi.num];
  const strongestDir = PLANET_DIRECTION[strongest];
  const headDir = headDirection(moonNakLord);
  const secondLord = k.houses[1].lord;  // 2L = wealth
  const wealthDir = PLANET_DIRECTION[secondLord];

  const directions = (Object.keys(DIRECTIONS) as Direction[]).map((d) => DIRECTIONS[d]);

  // Room advice aggregated across DIRECTIONS (inverted index)
  const rooms: string[] = ['Entrance','Pooja room','Kitchen','Master bedroom','Children bedroom','Guest room','Study','Office','Dining','Toilet','Store-room','Staircase'];
  const roomAdvice: VastuReport['roomAdvice'] = {};
  for (const room of rooms) {
    const best: Direction[] = [];
    const avoid: Direction[] = [];
    for (const d of directions) {
      if (d.favoredRooms.some((r) => r.toLowerCase().includes(room.toLowerCase().split(' ')[0]))) best.push(d.key);
      if (d.forbiddenRooms.some((r) => r.toLowerCase().includes(room.toLowerCase().split(' ')[0]))) avoid.push(d.key);
    }
    roomAdvice[room] = {
      best, avoid,
      note: best.length ? `Place in ${best.map((x) => DIRECTIONS[x].name).join(', ')}` : 'No strong preference.',
    };
  }

  // Dosha advisories driven by chart
  const doshaChecks: VastuDoshaCheck[] = [];
  // Rahu/Ketu in 4th (home sector) — fundamental home-vastu affliction
  const rahu = k.planets.find((p) => p.id === 'RA')!;
  const ketu = k.planets.find((p) => p.id === 'KE')!;
  if (rahu.house === 4 || ketu.house === 4) {
    doshaChecks.push({
      dosha: `${rahu.house === 4 ? 'Rahu' : 'Ketu'} afflicts 4th house (sukha-sthana)`,
      severity: 'high',
      remedy: 'Install a kalash with water in the NE corner. Keep NE corner clutter-free. Donate on Saturdays.',
    });
  }
  // Saturn in 4th → delays + coldness at home
  const saturn = k.planets.find((p) => p.id === 'SA')!;
  if (saturn.house === 4) {
    doshaChecks.push({
      dosha: 'Saturn in 4th — coldness, structural delays at home',
      severity: 'medium',
      remedy: 'Keep SW quadrant weighted (heavy furniture). Plant a peepal in an open plot if possible.',
    });
  }
  // Mars in 4th → disputes/fire accidents
  const mars = k.planets.find((p) => p.id === 'MA')!;
  if (mars.house === 4) {
    doshaChecks.push({
      dosha: 'Mars in 4th — fire/accident risk at home, discord',
      severity: 'medium',
      remedy: 'Kitchen (Agni zone) must be strictly SE. Install a Hanuman image facing south.',
    });
  }
  // 4th lord debilitated or in 6/8/12
  const fourthLord = k.houses[3].lord;
  const fourthLordP = k.planets.find((p) => p.id === fourthLord)!;
  if (fourthLordP.debilitated || [6,8,12].includes(fourthLordP.house)) {
    doshaChecks.push({
      dosha: `4th lord ${fourthLord} is ${fourthLordP.debilitated ? 'debilitated' : 'in dusthana'} — property gain delayed`,
      severity: 'medium',
      remedy: 'Keep NE corner luminous (always a lamp at dusk). Donate land/seeds on Mondays.',
    });
  }
  // Universal doshas (architectural, not chart-based)
  doshaChecks.push(
    { dosha: 'Toilet in NE corner', severity: 'high',
      remedy: 'If unavoidable, keep it sealed, install copper pyramid, salt-bowl in corner, change annually.' },
    { dosha: 'Kitchen in NE', severity: 'high',
      remedy: 'Relocate stove to SE corner of the kitchen. Install bagua mirror outside.' },
    { dosha: 'Staircase in center (Brahmasthan)', severity: 'high',
      remedy: 'Keep Brahmasthan void; place a skylight above. Hang copper mass below staircase.' },
    { dosha: 'Sleeping with head towards North', severity: 'high',
      remedy: `Change orientation — head toward ${DIRECTIONS[headDir].name} (personalised for your Moon nakshatra lord).` },
  );

  return {
    directions,
    personal: {
      ascDirection: ascDir,
      moonDirection: moonDir,
      strongestPlanet: strongest,
      strongestDirection: strongestDir,
      headWhileSleeping: headDir,
      deskFacingWhileWorking: oppositeDirection(strongestDir),
      meditationDirection: 'NE',
      wealthCornerDirection: wealthDir,
    },
    roomAdvice,
    doshaChecks,
    notes: [
      `Ascendant is ${k.ascendant.rashi.name} — rashi-direction is ${DIRECTIONS[ascDir].name}.`,
      `Moon sign is ${RASHIS[moonPlanet.rashi.num - 1].name}; Moon direction is ${DIRECTIONS[moonDir].name}.`,
      `Strongest planet (approx.) is ${strongest}. Face ${DIRECTIONS[oppositeDirection(strongestDir)].name} while working — this draws that planet's energy toward you.`,
      `Head-while-sleeping is ${DIRECTIONS[headDir].name} — from your Moon-nakshatra-lord (${moonNakLord}).`,
      `Wealth corner (after Kubera's North) is ${DIRECTIONS[wealthDir].name} — your 2nd-lord's direction. Keep cash, safes, and deities here.`,
    ],
  };
}

export function listDirections(): DirectionEntry[] {
  return (Object.keys(DIRECTIONS) as Direction[]).map((d) => DIRECTIONS[d]);
}
