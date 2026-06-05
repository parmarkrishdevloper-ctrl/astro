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
      note: best.length ? `इसे ${best.map((x) => DIRECTIONS[x].sanskrit).join(', ')} में रखें` : 'कोई विशेष प्राथमिकता नहीं।',
    };
  }

  // Dosha advisories driven by chart
  const doshaChecks: VastuDoshaCheck[] = [];
  // Rahu/Ketu in 4th (home sector) — fundamental home-vastu affliction
  const rahu = k.planets.find((p) => p.id === 'RA')!;
  const ketu = k.planets.find((p) => p.id === 'KE')!;
  if (rahu.house === 4 || ketu.house === 4) {
    doshaChecks.push({
      dosha: `${rahu.house === 4 ? 'राहु' : 'केतु'} चौथे भाव (सुख स्थान) को पीड़ित कर रहा है`,
      severity: 'high',
      remedy: 'ईशान कोण (NE) में जल भरा कलश स्थापित करें। ईशान कोण को साफ-सुथरा रखें। शनिवार को दान करें।',
    });
  }
  // Saturn in 4th → delays + coldness at home
  const saturn = k.planets.find((p) => p.id === 'SA')!;
  if (saturn.house === 4) {
    doshaChecks.push({
      dosha: 'चतुर्थ भाव में शनि — घर में उदासीनता और निर्माण में विलंब',
      severity: 'medium',
      remedy: 'नैऋत्य (SW) भाग को भारी रखें (भारी फर्नीचर)। यदि संभव हो तो खुले भूखंड में पीपल का पेड़ लगाएँ।',
    });
  }
  // Mars in 4th → disputes/fire accidents
  const mars = k.planets.find((p) => p.id === 'MA')!;
  if (mars.house === 4) {
    doshaChecks.push({
      dosha: 'चतुर्थ भाव में मंगल — घर में आग/दुर्घटना का जोखिम, विवाद',
      severity: 'medium',
      remedy: 'रसोई (अग्नि क्षेत्र) strictly आग्नेय (SE) में होनी चाहिए। दक्षिणमुखी हनुमान जी का चित्र स्थापित करें।',
    });
  }
  // 4th lord debilitated or in 6/8/12
  const fourthLord = k.houses[3].lord;
  const fourthLordP = k.planets.find((p) => p.id === fourthLord)!;
  if (fourthLordP.debilitated || [6,8,12].includes(fourthLordP.house)) {
    doshaChecks.push({
      dosha: `चतुर्थेश ${fourthLord} ${fourthLordP.debilitated ? 'नीच का' : 'दुःस्थान में'} है — संपत्ति लाभ में विलंब`,
      severity: 'medium',
      remedy: 'ईशान कोण (NE) को प्रकाशमान रखें (शाम को हमेशा एक दीपक जलाएं)। सोमवार को भूमि/बीज का दान करें।',
    });
  }
  // Universal doshas (architectural, not chart-based)
  doshaChecks.push(
    { dosha: 'ईशान कोण (NE) में शौचालय', severity: 'high',
      remedy: 'यदि अपरिहार्य हो, तो इसे सील रखें, तांबे का पिरामिड स्थापित करें, कोने में नमक का कटोरा रखें, इसे प्रतिवर्ष बदलें।' },
    { dosha: 'ईशान कोण (NE) में रसोई', severity: 'high',
      remedy: 'चूल्हे को रसोई के आग्नेय (SE) कोने में ले जाएं। बाहर बागुआ दर्पण (bagua mirror) स्थापित करें।' },
    { dosha: 'केंद्र (ब्रह्मस्थान) में सीढ़ियाँ', severity: 'high',
      remedy: 'ब्रह्मस्थान को खाली रखें; ऊपर एक रोशनदान (skylight) लगाएं। सीढ़ियों के नीचे तांबे का पिंड लटकाएं।' },
    { dosha: 'उत्तर दिशा की ओर सिर करके सोना', severity: 'high',
      remedy: `दिशा बदलें — सिर ${DIRECTIONS[headDir].name} की ओर रखें (आपके चंद्रमा के नक्षत्र स्वामी के अनुसार वैयक्तिकृत)।` },
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
      `लग्न ${k.ascendant.rashi.name} है — राशि की दिशा ${DIRECTIONS[ascDir].sanskrit} है।`,
      `चंद्र राशि ${RASHIS[moonPlanet.rashi.num - 1].name} है; चंद्र की दिशा ${DIRECTIONS[moonDir].sanskrit} है।`,
      `सबसे प्रबल ग्रह (अनुमानित) ${strongest} है। काम करते समय ${DIRECTIONS[oppositeDirection(strongestDir)].sanskrit} की ओर मुख करें — यह उस ग्रह की ऊर्जा को आपकी ओर आकर्षित करता है।`,
      `सोते समय सिर ${DIRECTIONS[headDir].sanskrit} की ओर होना चाहिए — यह आपके चंद्र-नक्षत्र-स्वामी (${moonNakLord}) के अनुसार है।`,
      `धन का कोना (कुबेर की उत्तर दिशा के बाद) ${DIRECTIONS[wealthDir].sanskrit} है — यह आपके दूसरे भाव के स्वामी की दिशा है। नकद, तिजोरी और इष्ट देव को यहाँ रखें।`,
    ],
  };
}

export function listDirections(): DirectionEntry[] {
  return (Object.keys(DIRECTIONS) as Direction[]).map((d) => DIRECTIONS[d]);
}
