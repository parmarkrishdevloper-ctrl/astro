// Double Transit — K.N. Rao's "Jupiter + Saturn simultaneous influence" rule.
//
// Sri K.N. Rao's popular predictive technique: when both Jupiter AND Saturn
// simultaneously *influence* (transit or aspect) the same house from the
// natal Lagna or natal Moon, events tied to that house tend to manifest
// during the combined window. "Influence" here means:
//   • transit occupancy in the house, OR
//   • transit aspect onto the house (Jupiter aspects 5th/7th/9th;
//     Saturn aspects 3rd/7th/10th).
//
// We scan a date range in weekly steps, flag every window where both
// giants influence the same house, and list the significant houses each
// such window "activates". Useful for timing marriage, career changes,
// progeny, property acquisitions, etc.
//
// This is a coarse-grained predictive filter. For precise in-month timing,
// combine with Gochara Vedha + Ashtakavarga transit score + Sandhi checks.

import { PlanetId, normDeg } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { computeAllGrahas } from './ephemeris.service';
import { dateToJD } from '../utils/julian';

const JUP_ASPECTS = [5, 7, 9]; // houses aspected, counted from Jupiter's house
const SAT_ASPECTS = [3, 7, 10];

function signFromLong(long: number): number {
  return Math.floor(normDeg(long) / 30) + 1;
}

function houseFromRef(transitSign: number, refSign: number): number {
  return ((transitSign - refSign + 12) % 12) + 1;
}

/** Return the houses (1..12) this transit influences given its own house. */
function housesInfluenced(transitHouse: number, aspects: number[]): number[] {
  const out = [transitHouse];
  for (const a of aspects) {
    out.push(((transitHouse - 1 + (a - 1)) % 12) + 1);
  }
  return [...new Set(out)];
}

const HOUSE_SIGNIFICATIONS: Record<number, string> = {
  1: 'self, vitality, personality',
  2: 'wealth, family, speech',
  3: 'siblings, courage, short travels',
  4: 'mother, home, education, vehicles',
  5: 'children, creativity, intellect',
  6: 'service, health, enemies, loans',
  7: 'marriage, partnerships, business',
  8: 'longevity, inheritance, transformations',
  9: 'father, fortune, dharma, higher learning',
  10: 'career, status, karma',
  11: 'gains, income, elder siblings, fulfilment of desires',
  12: 'losses, spirituality, foreign lands, expenses',
};

export interface DoubleTransitEvent {
  date: string;
  jupiterSign: number;
  saturnSign: number;
  houseFromLagna: number[];      // houses both aspect from natal Lagna
  houseFromMoon: number[];       // houses both aspect from natal Moon
  activatedTopics: string[];     // combined house significations
}

export interface DoubleTransitResult {
  natalMoonSign: number;
  natalLagnaSign: number;
  from: string;
  to: string;
  events: DoubleTransitEvent[];
}

export function computeDoubleTransit(
  natal: KundaliResult,
  fromISO: string,
  toISO: string,
  stepDays = 7,
): DoubleTransitResult {
  const lagnaSign = natal.ascendant.rashi.num;
  const moonSign = natal.planets.find((p) => p.id === 'MO')!.rashi.num;

  const from = new Date(fromISO);
  const to = new Date(toISO);
  const totalDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));

  const events: DoubleTransitEvent[] = [];
  let prevSignature: string | null = null;

  for (let d = 0; d <= totalDays; d += stepDays) {
    const sample = new Date(from.getTime() + d * 86400000);
    const jd = dateToJD(sample);
    const g = computeAllGrahas(jd);
    const jupSign = signFromLong(g.JU.longitude);
    const satSign = signFromLong(g.SA.longitude);

    const jupHouseLagna = houseFromRef(jupSign, lagnaSign);
    const satHouseLagna = houseFromRef(satSign, lagnaSign);
    const jupHouseMoon = houseFromRef(jupSign, moonSign);
    const satHouseMoon = houseFromRef(satSign, moonSign);

    const jupInflLagna = housesInfluenced(jupHouseLagna, JUP_ASPECTS);
    const satInflLagna = housesInfluenced(satHouseLagna, SAT_ASPECTS);
    const jupInflMoon = housesInfluenced(jupHouseMoon, JUP_ASPECTS);
    const satInflMoon = housesInfluenced(satHouseMoon, SAT_ASPECTS);

    const fromLagna = jupInflLagna.filter((h) => satInflLagna.includes(h));
    const fromMoon = jupInflMoon.filter((h) => satInflMoon.includes(h));

    if (fromLagna.length === 0 && fromMoon.length === 0) continue;

    // Dedupe consecutive samples with identical signatures so we only
    // record transitions, not every weekly sample inside a multi-month window.
    const sig = `${[...fromLagna].sort().join(',')}|${[...fromMoon].sort().join(',')}|${jupSign}|${satSign}`;
    if (sig === prevSignature) continue;
    prevSignature = sig;

    const allHouses = [...new Set([...fromLagna, ...fromMoon])];
    events.push({
      date: sample.toISOString(),
      jupiterSign: jupSign,
      saturnSign: satSign,
      houseFromLagna: fromLagna,
      houseFromMoon: fromMoon,
      activatedTopics: allHouses.map((h) => `${h}th: ${HOUSE_SIGNIFICATIONS[h]}`),
    });
  }

  return {
    natalMoonSign: moonSign,
    natalLagnaSign: lagnaSign,
    from: from.toISOString(),
    to: to.toISOString(),
    events,
  };
}
