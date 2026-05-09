// Personal horoscope generator.
//
// Combines today's panchang + running Vimshottari sub-periods + Moon-sign
// transit to build a short daily / weekly / monthly text snippet for a
// specific native. Output is deterministic — same inputs always produce
// the same string, making it safe to bake into PDFs or cache.

import { KundaliResult } from './kundali.service';
import { PlanetId } from '../utils/astro-constants';
import { currentDasha } from './dasha.service';
import { calculatePanchang } from './panchang.service';
import { computeTransits } from './transit.service';
import { rxSnapshot } from './rx-combust.service';

export type HoroscopeScope = 'day' | 'week' | 'month';

export interface HoroscopeReport {
  scope: HoroscopeScope;
  dateFrom: string;
  dateTo: string;
  currentMahaLord: PlanetId | null;
  currentAntarLord: PlanetId | null;
  /** Moon sign & nakshatra at report start */
  moon: { signNum: number; signName: string; nakshatraName: string };
  panchang: {
    tithi: string;
    nakshatra: string;
    vara: string;
    yoga: string;
  };
  retrograde: PlanetId[];
  combust: PlanetId[];
  /** Which natal house(s) are currently under transit from Jupiter / Saturn. */
  transitFocus: { planet: PlanetId; natalHouse: number }[];
  headline: string;             // single-sentence summary
  bullets: string[];             // specific talking points
}

const HOUSE_FOCUS: Record<number, string> = {
  1:  'self-presentation and vitality',
  2:  'money, speech, and family dynamics',
  3:  'siblings, initiative, short trips',
  4:  'home, mother, emotional base',
  5:  'creativity, romance, study',
  6:  'work routines, health, dispute resolution',
  7:  'partnerships, business deals, spouse',
  8:  'transformation, hidden topics, shared resources',
  9:  'higher learning, mentors, long journeys',
 10:  'career visibility, authority figures',
 11:  'gains, friend circles, big goals',
 12:  'retreat, solitude, foreign matters',
};

const PLANET_TONE: Record<PlanetId, string> = {
  SU: 'authoritative, ego-focused',
  MO: 'emotional, public-facing',
  MA: 'driven, possibly confrontational',
  ME: 'intellectual, communicative',
  JU: 'expansive, teaching, generous',
  VE: 'relational, artistic, indulgent',
  SA: 'disciplined, slow, karmic',
  RA: 'unconventional, ambitious, foreign',
  KE: 'detached, introspective, mystical',
};

export function buildHoroscope(natal: KundaliResult, scope: HoroscopeScope, whenISO?: string): HoroscopeReport {
  const start = whenISO ? new Date(whenISO) : new Date();
  const end = new Date(start);
  if (scope === 'day')   end.setUTCDate(start.getUTCDate() + 1);
  if (scope === 'week')  end.setUTCDate(start.getUTCDate() + 7);
  if (scope === 'month') end.setUTCMonth(start.getUTCMonth() + 1);

  const dasha = currentDasha(natal, start);
  const mahaLord = (dasha?.maha?.lord ?? null) as PlanetId | null;
  const antarLord = (dasha?.antar?.lord ?? null) as PlanetId | null;

  const p = calculatePanchang(start, natal.input.lat, natal.input.lng);
  const t = computeTransits(natal, start.toISOString());
  const rx = rxSnapshot(start.toISOString());

  // Jupiter / Saturn natal-house focus
  const focus: { planet: PlanetId; natalHouse: number }[] = t.positions
    .filter((pl) => pl.id === 'JU' || pl.id === 'SA')
    .map((pl) => ({ planet: pl.id as PlanetId, natalHouse: pl.natalHouse }));

  const bullets: string[] = [];
  if (mahaLord && antarLord && dasha?.maha && dasha?.antar) {
    const mahaHouse = natal.planets.find((pl) => pl.id === mahaLord)!.house;
    const antarHouse = natal.planets.find((pl) => pl.id === antarLord)!.house;
    bullets.push(`Running ${mahaLord}/${antarLord} period — ${PLANET_TONE[mahaLord]} backdrop with ${PLANET_TONE[antarLord]} foreground.`);
    bullets.push(`Maha lord sits in your ${mahaHouse}th (${HOUSE_FOCUS[mahaHouse]}); antar lord in your ${antarHouse}th (${HOUSE_FOCUS[antarHouse]}).`);
  }
  focus.forEach((f) => {
    bullets.push(`${f.planet} transits your ${f.natalHouse}th — watch ${HOUSE_FOCUS[f.natalHouse]}.`);
  });
  if (rx.retrograde.length > 0) {
    bullets.push(`Retrograde now: ${rx.retrograde.join(', ')} — review before initiating.`);
  }
  if (rx.combust.length > 0) {
    bullets.push(`Combust: ${rx.combust.join(', ')} — these significations are muffled.`);
  }
  if (t.sadesati?.active) {
    bullets.push(`Sade Sati — ${t.sadesati.phase} phase. Slow, disciplined effort pays off.`);
  }

  const headline = (() => {
    if (!mahaLord || !antarLord) return `${scope} snapshot: neutral period, steady progress expected.`;
    const dominantHouse = focus[0]?.natalHouse ?? natal.planets.find((pl) => pl.id === mahaLord)!.house;
    return `${scope === 'day' ? 'Today' : scope === 'week' ? 'This week' : 'This month'}: ${mahaLord}/${antarLord} focus on ${HOUSE_FOCUS[dominantHouse]}.`;
  })();

  return {
    scope,
    dateFrom: start.toISOString(),
    dateTo: end.toISOString(),
    currentMahaLord: mahaLord,
    currentAntarLord: antarLord,
    moon: {
      signNum: p.nakshatra.num ? natal.planets.find((pl) => pl.id === 'MO')!.rashi.num : natal.planets.find((pl) => pl.id === 'MO')!.rashi.num,
      signName: natal.planets.find((pl) => pl.id === 'MO')!.rashi.name,
      nakshatraName: p.nakshatra.name,
    },
    panchang: {
      tithi: `${p.tithi.paksha} ${p.tithi.name}`,
      nakshatra: p.nakshatra.name,
      vara: p.vara.name,
      yoga: p.yoga.name,
    },
    retrograde: rx.retrograde,
    combust: rx.combust,
    transitFocus: focus,
    headline,
    bullets,
  };
}
