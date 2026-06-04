// Shad Avasthas — six situational planetary states.
//
// Classical sources: Uttara Kalamrita (Kalidasa), Jataka Parijata.
// These describe a planet's *situational mood* based on who it's with, who
// aspects it, and what sign it occupies. They complement Baladi (age),
// Jagradadi (wakefulness), Deeptadi (luminosity) — together forming the
// "Dwadasha Avastha" (twelve states) reading.
//
// Six states, in order of classical enumeration:
//
//   Lajjita   (ashamed)   planet in 5H conjoined with node / Sun / Saturn / Mars
//   Garvita   (proud)     planet in exaltation or moolatrikona
//   Kshudhita (hungry)    planet in enemy sign or with an enemy
//   Trashita  (thirsty)   planet in watery sign, aspected by malefic, no benefic
//   Mudita    (delighted) planet in friend sign or conjoined/aspected by benefic
//   Kshobhita (agitated)  planet combust AND with enemy AND aspected by malefic
//
// Multiple states can be true simultaneously. We return all that apply,
// plus a compact boolean map, plus a summary verdict.

import { PlanetId } from '../utils/astro-constants';
import { KundaliResult, PlanetPosition } from './kundali.service';

export type ShadAvasthaKey =
  | 'Lajjita' | 'Garvita' | 'Kshudhita' | 'Trashita' | 'Mudita' | 'Kshobhita';

export const SHAD_AVASTHA_INFO: Record<ShadAvasthaKey, { label: string; mood: string; verdict: 'good' | 'bad' | 'mixed' }> = {
  Lajjita:   { label: 'लज्जित (शर्मिंदा)',   mood: 'सम्मान की हानि, कारक तत्व से समझौता',        verdict: 'bad' },
  Garvita:   { label: 'गर्वित (गौरवान्वित)',     mood: 'आत्मविश्वासी, स्वतंत्र रूप से अच्छे परिणाम देता है',   verdict: 'good' },
  Kshudhita: { label: 'क्षुधित (भूखा)',  mood: 'कमजोर, फल देने में असमर्थ',           verdict: 'bad' },
  Trashita:  { label: 'तृषित (प्यासा)',  mood: 'लालसा, अतृप्त, भावनात्मक रूप से क्षीण', verdict: 'bad' },
  Mudita:    { label: 'मुदित (प्रसन्न)',  mood: 'संतुष्ट, कारक और भाव को आशीर्वाद देता है',      verdict: 'good' },
  Kshobhita: { label: 'क्षोभित (क्षुब्ध)', mood: 'अत्यधिक अशांत, कारक तत्व को नष्ट करता है',        verdict: 'bad' },
};

// Benefics/malefics (natural).
const BENEFICS: PlanetId[] = ['JU', 'VE', 'MO']; // Moon waxing benefic; simplified as always benefic
const MALEFICS: PlanetId[] = ['SU', 'MA', 'SA', 'RA', 'KE'];

// Friend table (same structure as avastha.service.ts).
const FRIENDS: Record<PlanetId, PlanetId[]> = {
  SU: ['MO', 'MA', 'JU'],
  MO: ['SU', 'ME'],
  MA: ['SU', 'MO', 'JU'],
  ME: ['SU', 'VE'],
  JU: ['SU', 'MO', 'MA'],
  VE: ['ME', 'SA'],
  SA: ['ME', 'VE'],
  RA: ['VE', 'SA'],
  KE: ['MA', 'VE'],
};

const ENEMIES: Record<PlanetId, PlanetId[]> = {
  SU: ['VE', 'SA'],
  MO: [],                // Moon has no enemies classically
  MA: ['ME'],
  ME: ['MO'],
  JU: ['ME', 'VE'],
  VE: ['SU', 'MO'],
  SA: ['SU', 'MO', 'MA'],
  RA: ['SU', 'MO', 'MA'],
  KE: ['SU', 'MO', 'MA'],
};

// Watery signs: Cancer (4), Scorpio (8), Pisces (12).
const WATERY_SIGNS = new Set([4, 8, 12]);

// Moolatrikona sign per planet (simplified 1-char id → sign number).
const MOOLATRIKONA: Partial<Record<PlanetId, number>> = {
  SU: 5,  // Leo
  MO: 2,  // Taurus
  MA: 1,  // Aries
  ME: 6,  // Virgo
  JU: 9,  // Sagittarius
  VE: 7,  // Libra
  SA: 11, // Aquarius
};

/**
 * Vedic aspect targets from a planet. All planets aspect the 7th house from
 * themselves; Mars also aspects 4th & 8th; Jupiter 5th & 9th; Saturn 3rd & 10th.
 */
function aspectHousesFrom(p: PlanetId): number[] {
  if (p === 'MA') return [4, 7, 8];
  if (p === 'JU') return [5, 7, 9];
  if (p === 'SA') return [3, 7, 10];
  return [7];
}

function aspectsBetween(from: PlanetPosition, to: PlanetPosition): boolean {
  // count inclusive: sign of 'from' is 1, next is 2, ... wrap at 12.
  const diff = ((to.rashi.num - from.rashi.num + 12) % 12) + 1;
  return aspectHousesFrom(from.id).includes(diff);
}

// ── rule helpers ────────────────────────────────────────────────────────────
function isLajjita(p: PlanetPosition, all: PlanetPosition[]): boolean {
  if (p.house !== 5) return false;
  const bad: PlanetId[] = ['SU', 'SA', 'MA', 'RA', 'KE'];
  return all.some((x) => x.id !== p.id && x.house === 5 && bad.includes(x.id));
}

function isGarvita(p: PlanetPosition): boolean {
  if (p.exalted) return true;
  if (MOOLATRIKONA[p.id] === p.rashi.num) return true;
  return false;
}

function isKshudhita(p: PlanetPosition, all: PlanetPosition[]): boolean {
  const enemies = ENEMIES[p.id] ?? [];
  // enemy sign?
  const lordOfSign = signLord(p.rashi.num);
  if (enemies.includes(lordOfSign)) return true;
  // conjunct or aspected by enemy?
  for (const x of all) {
    if (x.id === p.id) continue;
    if (!enemies.includes(x.id)) continue;
    if (x.house === p.house) return true;
    if (aspectsBetween(x, p)) return true;
  }
  return false;
}

function isTrashita(p: PlanetPosition, all: PlanetPosition[]): boolean {
  if (!WATERY_SIGNS.has(p.rashi.num)) return false;
  const aspMal = all.some((x) => x.id !== p.id && MALEFICS.includes(x.id) && aspectsBetween(x, p));
  const aspBen = all.some((x) => x.id !== p.id && BENEFICS.includes(x.id) && aspectsBetween(x, p));
  return aspMal && !aspBen;
}

function isMudita(p: PlanetPosition, all: PlanetPosition[]): boolean {
  const friends = FRIENDS[p.id] ?? [];
  const lord = signLord(p.rashi.num);
  if (friends.includes(lord)) return true;
  for (const x of all) {
    if (x.id === p.id) continue;
    if (!BENEFICS.includes(x.id)) continue;
    if (x.house === p.house) return true;
    if (aspectsBetween(x, p)) return true;
  }
  return false;
}

function isKshobhita(p: PlanetPosition, all: PlanetPosition[]): boolean {
  if (!p.combust) return false;
  const kshud = isKshudhita(p, all);
  if (!kshud) return false;
  const aspMal = all.some((x) => x.id !== p.id && MALEFICS.includes(x.id) && aspectsBetween(x, p));
  return aspMal;
}

function signLord(signNum: number): PlanetId {
  const lords: PlanetId[] = ['MA','VE','ME','MO','SU','ME','VE','MA','JU','SA','SA','JU'];
  return lords[signNum - 1];
}

// ── main API ────────────────────────────────────────────────────────────────
export interface ShadAvasthaEntry {
  planet: PlanetId;
  /** Which states are active — a planet can be in several at once. */
  states: Record<ShadAvasthaKey, boolean>;
  /** All active state keys, in canonical order. */
  active: ShadAvasthaKey[];
  /** Net verdict: Garvita+Mudita without bad states → good; any bad without good → bad; mix → mixed; none → neutral. */
  verdict: 'good' | 'bad' | 'mixed' | 'neutral';
  /** Why — short human reason per active state. */
  reasons: { state: ShadAvasthaKey; reason: string }[];
}

function reasonFor(state: ShadAvasthaKey, p: PlanetPosition, all: PlanetPosition[]): string {
  const peers = all.filter((x) => x.id !== p.id);
  switch (state) {
    case 'Lajjita': {
      const bad = peers.filter((x) => x.house === 5 && ['SU','SA','MA','RA','KE'].includes(x.id)).map((x) => x.id);
      return `5वें भाव में ${bad.join(', ')} के साथ`;
    }
    case 'Garvita':
      return p.exalted ? `${p.rashi.name} में उच्च का` : `${p.rashi.name} में मूलत्रिकोण`;
    case 'Kshudhita': {
      const enemies = ENEMIES[p.id] ?? [];
      if (enemies.includes(signLord(p.rashi.num))) return `शत्रु राशि ${p.rashi.name} (स्वामी ${signLord(p.rashi.num)}) में`;
      const conj = peers.find((x) => enemies.includes(x.id) && x.house === p.house);
      if (conj) return `शत्रु ${conj.id} के साथ`;
      const asp  = peers.find((x) => enemies.includes(x.id) && aspectsBetween(x, p));
      return asp ? `शत्रु ${asp.id} से दृष्ट` : 'शत्रु का प्रभाव';
    }
    case 'Trashita':
      return `जल तत्व राशि ${p.rashi.name} में, पाप ग्रह से दृष्ट, कोई शुभ प्रभाव नहीं`;
    case 'Mudita': {
      const lord = signLord(p.rashi.num);
      if ((FRIENDS[p.id] ?? []).includes(lord)) return `मित्र राशि (${p.rashi.name}, स्वामी ${lord}) में`;
      const ben = peers.find((x) => ['JU','VE','MO'].includes(x.id) && (x.house === p.house || aspectsBetween(x, p)));
      return ben ? `${ben.id} का आशीर्वाद` : 'मित्र का प्रभाव';
    }
    case 'Kshobhita':
      return 'अस्त + शत्रु के साथ + पाप ग्रह से दृष्ट — अत्यधिक अशांति';
  }
}

export function calculateShadAvastha(k: KundaliResult): ShadAvasthaEntry[] {
  const planets = k.planets.filter((p) => !['RA','KE'].includes(p.id));
  return planets.map((p) => {
    const all = k.planets;
    const states: Record<ShadAvasthaKey, boolean> = {
      Lajjita:   isLajjita(p, all),
      Garvita:   isGarvita(p),
      Kshudhita: isKshudhita(p, all),
      Trashita:  isTrashita(p, all),
      Mudita:    isMudita(p, all),
      Kshobhita: isKshobhita(p, all),
    };
    const active = (Object.keys(states) as ShadAvasthaKey[]).filter((k) => states[k]);
    const hasGood = active.some((s) => SHAD_AVASTHA_INFO[s].verdict === 'good');
    const hasBad  = active.some((s) => SHAD_AVASTHA_INFO[s].verdict === 'bad');
    const verdict: ShadAvasthaEntry['verdict'] =
      hasGood && hasBad ? 'mixed' :
      hasGood ? 'good' :
      hasBad  ? 'bad' : 'neutral';
    const reasons = active.map((s) => ({ state: s, reason: reasonFor(s, p, all) }));
    return { planet: p.id, states, active, verdict, reasons };
  });
}
