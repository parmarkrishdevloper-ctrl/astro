// Famous-chart matcher.
//
// A small curated seed of widely-documented natives (source: Astro-Databank).
// A "similarity" score compares structural features:
//   • Lagna sign match          (+30)
//   • Moon sign match           (+25)
//   • Sun sign match            (+15)
//   • Moon nakshatra-lord match (+15)
//   • 10th lord match           (+10)
//   • Mangal dosha match        (+5)
//
// Max 100. This is a loose "archetype" resemblance — not a claim of identical
// destiny. Useful for UI "you share X's pattern of Y" insights.

import { BirthInput, calculateKundali, KundaliResult } from './kundali.service';
import { PlanetId, RASHIS } from '../utils/astro-constants';
import { checkMangalDosha } from './dosha.service';

export interface FamousChart {
  id: string;
  name: string;
  profession: string;
  birth: BirthInput;
  notes?: string;
}

// Curated: data from public biographies — Rodden rating is AA / A where known.
// These are used for archetype comparison only.
export const FAMOUS_CHARTS: FamousChart[] = [
  {
    id: 'gandhi',
    name: 'Mohandas K. Gandhi',
    profession: 'Statesman',
    birth: { datetime: '1869-10-02T07:12:00', tzOffsetHours: 4.5102, lat: 21.6417, lng: 69.6293, placeName: 'Porbandar, India' },
    notes: 'Lagna: Libra. Satyagraha leader.',
  },
  {
    id: 'einstein',
    name: 'Albert Einstein',
    profession: 'Physicist',
    birth: { datetime: '1879-03-14T11:30:00', tzOffsetHours: 0.6222, lat: 48.4011, lng: 10.0, placeName: 'Ulm, Germany' },
    notes: 'Mercury exalted in Pisces (sidereal Aquarius).',
  },
  {
    id: 'ramakrishna',
    name: 'Ramakrishna Paramahamsa',
    profession: 'Mystic',
    birth: { datetime: '1836-02-18T06:30:00', tzOffsetHours: 5.8833, lat: 22.9019, lng: 87.7294, placeName: 'Kamarpukur, India' },
    notes: 'Pisces ascendant, spiritual adept.',
  },
  {
    id: 'vivekananda',
    name: 'Swami Vivekananda',
    profession: 'Philosopher',
    birth: { datetime: '1863-01-12T06:33:00', tzOffsetHours: 5.8833, lat: 22.5726, lng: 88.3639, placeName: 'Kolkata, India' },
    notes: 'Sagittarius Lagna, strong Jupiter.',
  },
  {
    id: 'aurobindo',
    name: 'Sri Aurobindo',
    profession: 'Philosopher',
    birth: { datetime: '1872-08-15T04:52:00', tzOffsetHours: 5.8833, lat: 22.5726, lng: 88.3639, placeName: 'Kolkata, India' },
    notes: 'Cancer ascendant, integral yoga.',
  },
  {
    id: 'tata',
    name: 'J. R. D. Tata',
    profession: 'Industrialist',
    birth: { datetime: '1904-07-29T17:00:00', tzOffsetHours: 0.0, lat: 48.8566, lng: 2.3522, placeName: 'Paris, France' },
    notes: 'Leo Lagna, Lakshmi-yoga native.',
  },
  {
    id: 'ramanujan',
    name: 'Srinivasa Ramanujan',
    profession: 'Mathematician',
    birth: { datetime: '1887-12-22T18:00:00', tzOffsetHours: 5.5083, lat: 10.9496, lng: 79.3780, placeName: 'Erode, India' },
    notes: 'Cancer Lagna, Moon in own sign.',
  },
  {
    id: 'bachchan',
    name: 'Amitabh Bachchan',
    profession: 'Actor',
    birth: { datetime: '1942-10-11T16:00:00', tzOffsetHours: 5.5, lat: 25.4358, lng: 81.8463, placeName: 'Allahabad, India' },
    notes: 'Aquarius Lagna, Lagna lord in 10th.',
  },
  {
    id: 'tendulkar',
    name: 'Sachin Tendulkar',
    profession: 'Cricketer',
    birth: { datetime: '1973-04-24T17:16:00', tzOffsetHours: 5.5, lat: 19.0760, lng: 72.8777, placeName: 'Mumbai, India' },
    notes: 'Strong Mars in sign + big Jupiter 10th.',
  },
  {
    id: 'modi',
    name: 'Narendra Modi',
    profession: 'Politician',
    birth: { datetime: '1950-09-17T11:00:00', tzOffsetHours: 5.5, lat: 23.5880, lng: 72.3693, placeName: 'Vadnagar, India' },
    notes: 'Scorpio Lagna, exalted Moon.',
  },
];

export interface ChartFeatures {
  lagnaSign: number;
  moonSign: number;
  sunSign: number;
  moonNakLord: PlanetId;
  tenthLord: PlanetId;
  mangalDosha: boolean;
}

function extractFeatures(k: KundaliResult): ChartFeatures {
  const moon = k.planets.find((p) => p.id === 'MO')!;
  const sun  = k.planets.find((p) => p.id === 'SU')!;
  const lagnaSign = k.ascendant.rashi.num;
  const tenthSign = ((lagnaSign - 1 + 9) % 12) + 1;
  const tenthLord = RASHIS[tenthSign - 1].lord;
  const md = checkMangalDosha(k);
  return {
    lagnaSign,
    moonSign: moon.rashi.num,
    sunSign: sun.rashi.num,
    moonNakLord: moon.nakshatra.lord,
    tenthLord,
    mangalDosha: md.hasDosha && !md.cancelled,
  };
}

function similarity(a: ChartFeatures, b: ChartFeatures): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  if (a.lagnaSign === b.lagnaSign)   { score += 30; reasons.push(`same Lagna (${RASHIS[a.lagnaSign - 1].name})`); }
  if (a.moonSign === b.moonSign)     { score += 25; reasons.push(`same Moon sign (${RASHIS[a.moonSign - 1].name})`); }
  if (a.sunSign === b.sunSign)       { score += 15; reasons.push(`same Sun sign (${RASHIS[a.sunSign - 1].name})`); }
  if (a.moonNakLord === b.moonNakLord) { score += 15; reasons.push(`same nak-lord (${a.moonNakLord})`); }
  if (a.tenthLord === b.tenthLord)   { score += 10; reasons.push(`same 10L (${a.tenthLord})`); }
  if (a.mangalDosha === b.mangalDosha && a.mangalDosha) { score += 5; reasons.push('both Mangal-dosha'); }
  return { score, reasons };
}

export interface FamousMatch {
  id: string;
  name: string;
  profession: string;
  score: number;
  reasons: string[];
  notes?: string;
}

export function listFamous(): FamousChart[] {
  return FAMOUS_CHARTS;
}

export function matchFamous(k: KundaliResult, topN = 5): FamousMatch[] {
  const me = extractFeatures(k);
  const out: FamousMatch[] = [];
  for (const f of FAMOUS_CHARTS) {
    const km = calculateKundali(f.birth);
    const feat = extractFeatures(km);
    const sim = similarity(me, feat);
    out.push({
      id: f.id,
      name: f.name,
      profession: f.profession,
      score: sim.score,
      reasons: sim.reasons,
      notes: f.notes,
    });
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, topN);
}
