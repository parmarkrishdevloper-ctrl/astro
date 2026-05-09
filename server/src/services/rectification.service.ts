// Birth time rectification — event-based scoring.
//
// Given an approximate birth time and a list of known life events with
// their dates and "house themes" (e.g. marriage = 7, career = 10), we test
// candidate birth times in 1-minute steps within ±window minutes and score
// each candidate by how many events occurred during a Vimshottari Antar of
// a planet that owns / occupies / is connected to the relevant houses.

import { calculateKundali, BirthInput } from './kundali.service';
import { computeVimshottari, computeAntardashas } from './dasha.service';
import { PlanetId, RASHIS } from '../utils/astro-constants';

export interface RectificationEvent {
  date: string;       // ISO
  house: number;      // 1..12 — primary significator house
  weight?: number;    // optional importance weight (default 1)
}

export interface RectificationCandidate {
  datetimeISO: string;
  score: number;
  matchedEvents: number;
}

export interface RectificationResult {
  bestMatch: RectificationCandidate;
  candidates: RectificationCandidate[];
}

function lordOfHouse(birth: BirthInput, house: number): PlanetId {
  const k = calculateKundali(birth);
  const lagnaSignNum = k.ascendant.rashi.num;
  const targetSignNum = ((lagnaSignNum - 1 + (house - 1)) % 12) + 1;
  return RASHIS[targetSignNum - 1].lord;
}

function scoreCandidate(birth: BirthInput, events: RectificationEvent[]): RectificationCandidate {
  const k = calculateKundali(birth);
  const v = computeVimshottari(k);
  let score = 0;
  let matched = 0;

  for (const ev of events) {
    const evMs = new Date(ev.date).getTime();
    // Find which mahadasha this event falls in
    const maha = v.mahadashas.find(
      (m) => new Date(m.start).getTime() <= evMs && evMs <= new Date(m.end).getTime(),
    );
    if (!maha) continue;
    const antars = computeAntardashas(maha);
    const antar = antars.find(
      (a) => new Date(a.start).getTime() <= evMs && evMs <= new Date(a.end).getTime(),
    );
    if (!antar) continue;

    const houseLord = lordOfHouse(birth, ev.house);
    const w = ev.weight ?? 1;

    // +3 if maha lord = house lord, +2 if antar lord matches, +1 each
    if (maha.lord === houseLord) {
      score += 3 * w;
      matched++;
    }
    if (antar.lord === houseLord) {
      score += 2 * w;
      matched++;
    }
    // +1 if either is in the relevant house (occupant)
    const inHouse = k.planets.find(
      (p) => (p.id === maha.lord || p.id === antar.lord) && p.house === ev.house,
    );
    if (inHouse) {
      score += 1 * w;
      matched++;
    }
  }

  return {
    datetimeISO: new Date(new Date(birth.datetime).getTime() - (birth.tzOffsetHours ?? 0) * 0).toISOString(),
    score,
    matchedEvents: matched,
  };
}

/**
 * Test candidate birth times in 1-minute increments within ±windowMinutes
 * of the input. Returns sorted candidates and the best match.
 */
export function rectifyBirthTime(
  birth: BirthInput,
  events: RectificationEvent[],
  windowMinutes = 30,
): RectificationResult {
  const baseMs = new Date(birth.datetime).getTime();
  const candidates: RectificationCandidate[] = [];

  for (let m = -windowMinutes; m <= windowMinutes; m++) {
    const test = new Date(baseMs + m * 60_000).toISOString();
    const c = scoreCandidate(
      { ...birth, datetime: test },
      events,
    );
    candidates.push({ ...c, datetimeISO: test });
  }

  candidates.sort((a, b) => b.score - a.score);
  return { bestMatch: candidates[0], candidates };
}
