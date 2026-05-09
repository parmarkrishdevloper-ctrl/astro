// Phase 11 — Classical chakras for prashna & muhurta.
//
// Five diagrammatic tools distilled to machine-readable form:
//   • Sarvatobhadra  — 9×9 "all-directions" wheel of naks + signs + letters
//   • Chandra Kalanala — 27-cell Moon wheel (flame vs cool positions)
//   • Shoola          — weekday thorn directions + nakshatra triads to avoid
//   • Kota            — fortress: stambha / madhya / prakara / bahya rings
//   • Chatushpata     — 4-quarter construction chakra (vaastu / griha-pravesh)
//
// Each function takes a KundaliResult (natal or prashna chart) and produces
// a cell/position map with planet tenancy + interpretation hints. Callers can
// render these directly or overlay transit planets.
//
// References: Narada's Sarvatobhadra, Varahamihira's Brihat Samhita ch. 97,
// Muhurta Chintamani ch. 6, Vasishtha's Vaastu Shastra.

import { PlanetId, RASHIS, NAKSHATRAS } from '../utils/astro-constants';
import { KundaliResult, PlanetPosition } from './kundali.service';
import { DISHA_SHOOL } from '../utils/nakshatra-meta';

const PLANET_ORDER: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA', 'RA', 'KE'];

// ─────────────────────────────────────────────────────────────────
// 1. Sarvatobhadra Chakra
// ─────────────────────────────────────────────────────────────────
//
// 9×9 grid. Outer ring (28 cells) holds the 27 nakshatras grouped by
// direction; inner ring holds 12 rashis in the 4 corner blocks; center
// 5×5 holds the 49 consonants + vowels.
//
// For each nakshatra we compute:
//   direction  — one of the 8 (N/NE/E/SE/S/SW/W/NW)
//   gridRow    — 0..8
//   gridCol    — 0..8
//   occupants  — planets currently in that nakshatra
//   vedha      — the nakshatra it wounds (opposite on the wheel)

type Direction8 = 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE';

// Classical direction mapping (Narada's layout). Each direction owns 3 to 4
// nakshatras; corners (NE/SE/SW/NW) bridge adjacent cardinal groups.
const NAK_DIRECTION: Direction8[] = [
  // 1..27, 0-indexed here
  'E',  'E',  'E',                       // Ashwini, Bharani, Krittika
  'SE', 'SE', 'SE',                      // Rohini, Mrigashira, Ardra
  'S',  'S',  'S',                       // Punarvasu, Pushya, Ashlesha
  'SW', 'SW', 'SW',                      // Magha, P-Phal, U-Phal
  'W',  'W',  'W',                       // Hasta, Chitra, Svati
  'NW', 'NW', 'NW',                      // Vishakha, Anuradha, Jyeshtha
  'N',  'N',  'N',                       // Mula, P-Ashadha, U-Ashadha
  'NE', 'NE', 'NE',                      // Shravana, Dhanishta, Shatabhisha
  'E',  'E',  'E',                       // P-Bhadra, U-Bhadra, Revati (wrap to E)
];

// 9×9 grid positions for each nakshatra (row, col). Outer ring moves
// clockwise starting from NE corner. Corners hold 3 naks each, sides 2.
const SARVATO_POS: { row: number; col: number }[] = [
  { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 },      // NE corner
  { row: 0, col: 4 }, { row: 1, col: 4 }, { row: 2, col: 4 },      // N side
  { row: 0, col: 6 }, { row: 0, col: 7 }, { row: 0, col: 8 },      // NW corner
  { row: 2, col: 8 }, { row: 4, col: 8 }, { row: 6, col: 8 },      // W side (reversed conceptually)
  { row: 8, col: 8 }, { row: 8, col: 7 }, { row: 8, col: 6 },      // SW corner
  { row: 8, col: 4 }, { row: 7, col: 4 }, { row: 6, col: 4 },      // S side
  { row: 8, col: 2 }, { row: 8, col: 1 }, { row: 8, col: 0 },      // SE corner
  { row: 6, col: 0 }, { row: 4, col: 0 }, { row: 2, col: 0 },      // E side
  { row: 1, col: 1 }, { row: 1, col: 7 }, { row: 7, col: 7 },      // inner corners
];

// 12 rashis anchored inside the 4 diagonal quadrants (3 per quadrant).
const RASHI_POS: { rashi: number; row: number; col: number }[] = [
  { rashi: 1,  row: 3, col: 1 }, { rashi: 2,  row: 2, col: 1 }, { rashi: 3,  row: 1, col: 2 },
  { rashi: 4,  row: 1, col: 3 }, { rashi: 5,  row: 1, col: 5 }, { rashi: 6,  row: 1, col: 6 },
  { rashi: 7,  row: 2, col: 7 }, { rashi: 8,  row: 3, col: 7 }, { rashi: 9,  row: 5, col: 7 },
  { rashi: 10, row: 7, col: 5 }, { rashi: 11, row: 7, col: 3 }, { rashi: 12, row: 5, col: 1 },
];

export interface SarvatoCell {
  nakshatra: number;
  nakshatraName: string;
  direction: Direction8;
  row: number;
  col: number;
  occupants: PlanetId[];
  vedha: number;          // nakshatra wounded (opposite-ish)
  vedhaName: string;
}

export interface SarvatoResult {
  cells: SarvatoCell[];
  rashis: { rashi: number; name: string; row: number; col: number; occupants: PlanetId[] }[];
  directionStrength: { dir: Direction8; benefics: number; malefics: number; note: string }[];
  currentMoonNakshatra: number;
}

const BENEFIC_SET = new Set<PlanetId>(['JU', 'VE', 'ME', 'MO']);
const MALEFIC_SET = new Set<PlanetId>(['SU', 'MA', 'SA', 'RA', 'KE']);

import { Locale, p, pf } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

export function computeSarvatobhadra(natal: KundaliResult, locale: Locale = 'en'): SarvatoResult {
  const al = astroLabels(locale);
  const nakTenants: Record<number, PlanetId[]> = {};
  const rashiTenants: Record<number, PlanetId[]> = {};
  for (const p of natal.planets) {
    (nakTenants[p.nakshatra.num] ||= []).push(p.id);
    (rashiTenants[p.rashi.num] ||= []).push(p.id);
  }

  const cells: SarvatoCell[] = [];
  for (let i = 0; i < 27; i++) {
    const vedhaNum = ((i + 14) % 27) + 1;  // opposite ± wrap
    cells.push({
      nakshatra: i + 1,
      nakshatraName: al.nakshatra(i + 1),
      direction: NAK_DIRECTION[i],
      row: SARVATO_POS[i]?.row ?? 0,
      col: SARVATO_POS[i]?.col ?? 0,
      occupants: nakTenants[i + 1] || [],
      vedha: vedhaNum,
      vedhaName: al.nakshatra(vedhaNum),
    });
  }

  const rashis = RASHI_POS.map((r) => ({
    rashi: r.rashi,
    name: al.rashi(r.rashi),
    row: r.row,
    col: r.col,
    occupants: rashiTenants[r.rashi] || [],
  }));

  const dirs: Direction8[] = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  const directionStrength = dirs.map((d) => {
    const dirCells = cells.filter((c) => c.direction === d);
    let benefics = 0, malefics = 0;
    for (const c of dirCells) {
      for (const p of c.occupants) {
        if (BENEFIC_SET.has(p)) benefics++;
        else if (MALEFIC_SET.has(p)) malefics++;
      }
    }
    const net = benefics - malefics;
    const note = net > 0 ? p('chakras.sarvato.note.auspicious', locale, 'Auspicious — safe for travel/action')
      : net < 0 ? p('chakras.sarvato.note.afflicted', locale, 'Afflicted — avoid major undertakings')
      : p('chakras.sarvato.note.neutral', locale, 'Neutral — ordinary results');
    return { dir: d, benefics, malefics, note };
  });

  const moon = natal.planets.find((p) => p.id === 'MO');
  return {
    cells,
    rashis,
    directionStrength,
    currentMoonNakshatra: moon ? moon.nakshatra.num : 0,
  };
}

// ─────────────────────────────────────────────────────────────────
// 2. Chandra Kalanala Chakra
// ─────────────────────────────────────────────────────────────────
//
// 27-cell Moon wheel: starting at Moon's nakshatra, count forward.
// Certain positions are "jwala" (flame/fire) — inauspicious for
// transiting planets or questioner's arrow direction.
//
// Traditional flame positions: 1, 6, 8, 11, 15, 22, 27 counted from Moon nak.
// "Dhuma" (smoke) positions: 3, 9, 14, 20.
// Others are "shanta" (cool/auspicious).

const JWALA_OFFSETS = [1, 6, 8, 11, 15, 22, 27];
const DHUMA_OFFSETS = [3, 9, 14, 20];

type KalanalaState = 'Jwala' | 'Dhuma' | 'Shanta';

export interface KalanalaCell {
  nakshatra: number;
  name: string;
  offsetFromMoon: number;    // 1..27
  state: KalanalaState;
  occupants: PlanetId[];
}

export interface KalanalaResult {
  moonNakshatra: number;
  cells: KalanalaCell[];
  afflictedPlanets: { planet: PlanetId; nakshatra: number; state: KalanalaState }[];
  summary: string;
}

export function computeKalanala(natal: KundaliResult, locale: Locale = 'en'): KalanalaResult {
  const al = astroLabels(locale);
  const moon = natal.planets.find((p) => p.id === 'MO');
  if (!moon) {
    return { moonNakshatra: 0, cells: [], afflictedPlanets: [], summary: 'Moon not found.' };
  }
  const moonNak = moon.nakshatra.num;

  const nakTenants: Record<number, PlanetId[]> = {};
  for (const p of natal.planets) {
    (nakTenants[p.nakshatra.num] ||= []).push(p.id);
  }

  const cells: KalanalaCell[] = [];
  for (let off = 1; off <= 27; off++) {
    const nak = ((moonNak - 1 + off - 1) % 27) + 1;
    const state: KalanalaState = JWALA_OFFSETS.includes(off) ? 'Jwala'
      : DHUMA_OFFSETS.includes(off) ? 'Dhuma'
      : 'Shanta';
    cells.push({
      nakshatra: nak,
      name: al.nakshatra(nak),
      offsetFromMoon: off,
      state,
      occupants: nakTenants[nak] || [],
    });
  }

  const afflictedPlanets: { planet: PlanetId; nakshatra: number; state: KalanalaState }[] = [];
  for (const c of cells) {
    if (c.state === 'Jwala' || c.state === 'Dhuma') {
      for (const pl of c.occupants) {
        afflictedPlanets.push({ planet: pl, nakshatra: c.nakshatra, state: c.state });
      }
    }
  }

  const summary = afflictedPlanets.length === 0
    ? p('chakras.kalanala.summary.peaceful', locale, 'All planets rest in Shanta positions — the Moon wheel is peaceful.')
    : pf('chakras.kalanala.summary.afflicted', locale,
        { n: afflictedPlanets.length, plural: afflictedPlanets.length === 1 ? '' : 's' },
        `${afflictedPlanets.length} planet${afflictedPlanets.length === 1 ? '' : 's'} in Jwala/Dhuma — apply remedies or delay major actions.`);

  return { moonNakshatra: moonNak, cells, afflictedPlanets, summary };
}

// ─────────────────────────────────────────────────────────────────
// 3. Shoola Chakra
// ─────────────────────────────────────────────────────────────────
//
// Per-weekday travel thorn chart. Uses Disha-shool directions and
// pairs each weekday with a triad of nakshatras that form a "shoola"
// (spear) pointing outward — inauspicious to travel toward or receive
// guests from that direction on that day.

const WEEKDAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Shoola triads: 3 nakshatras per weekday that form the thorn.
// (Muhurta Chintamani tradition — selected naks aligned with the day lord.)
const SHOOLA_TRIADS: number[][] = [
  [3, 15, 23],   // Sunday  — Krittika, Hasta, Dhanishta (Sun-ruled / Visible pada)
  [4, 16, 24],   // Monday  — Rohini, Vishakha, Shatabhisha
  [5, 17, 25],   // Tuesday — Mrigashira, Anuradha, P-Bhadra
  [6, 18, 26],   // Wednesday
  [7, 19, 27],   // Thursday
  [8, 20, 1],    // Friday
  [9, 21, 2],    // Saturday
];

// Per-day travel-prohibited tithi-groups (auxiliary, informational)
const SHOOLA_TITHIS: number[][] = [
  [5, 10, 15],   // Sunday
  [2, 7, 12],    //
  [3, 8, 13],
  [4, 9, 14],
  [1, 6, 11],
  [5, 10, 15],
  [2, 7, 12],
];

export interface ShoolaResult {
  today: {
    weekday: string;
    weekdayIdx: number;
    dishaShool: string;
    thornNakshatras: { num: number; name: string }[];
    thornTithis: number[];
    note: string;
  };
  weekTable: {
    weekday: string;
    dishaShool: string;
    thornNakshatras: { num: number; name: string }[];
  }[];
  currentMoonNakshatra: number;
  moonInThorn: boolean;
}

export function computeShoola(natal: KundaliResult, when?: string, locale: Locale = 'en'): ShoolaResult {
  const al = astroLabels(locale);
  const t = (en: string) => en; // direction strings ("North"/"South"/etc.) — could
                                 // route through a deeper translator helper later
  const dt = when ? new Date(when) : new Date();
  const wd = dt.getUTCDay();

  const triad = (idx: number) => SHOOLA_TRIADS[idx].map((n) => ({ num: n, name: al.nakshatra(n) }));

  const moon = natal.planets.find((pl) => pl.id === 'MO');
  const moonNak = moon ? moon.nakshatra.num : 0;
  const todayThorns = SHOOLA_TRIADS[wd];
  const moonInThorn = todayThorns.includes(moonNak);

  const weekdayLabel = (i: number) => al.vara(WEEKDAY_NAMES[i]);

  const weekTable = WEEKDAY_NAMES.map((_name, i) => ({
    weekday: weekdayLabel(i),
    dishaShool: t(DISHA_SHOOL[i]),
    thornNakshatras: triad(i),
  }));

  const note = moonInThorn
    ? pf('chakras.shoola.note.inThorn', locale,
        { nak: al.nakshatra(moonNak), day: weekdayLabel(wd), dir: DISHA_SHOOL[wd] }, '')
    : pf('chakras.shoola.note.clear', locale,
        { dir: DISHA_SHOOL[wd] }, '');

  return {
    today: {
      weekday: weekdayLabel(wd),
      weekdayIdx: wd,
      dishaShool: t(DISHA_SHOOL[wd]),
      thornNakshatras: triad(wd),
      thornTithis: SHOOLA_TITHIS[wd],
      note,
    },
    weekTable,
    currentMoonNakshatra: moonNak,
    moonInThorn,
  };
}

// ─────────────────────────────────────────────────────────────────
// 4. Kota Chakra
// ─────────────────────────────────────────────────────────────────
//
// Fortress wheel. 27 naks divided into 4 concentric rings from the
// "Kota-nakshatra" (typically natal Moon or Janma nak):
//   • Stambha (1)    — central pillar
//   • Madhya (2-8)   — inner court (7 naks)
//   • Prakara (9-17) — outer wall (9 naks)
//   • Bahya (18-27)  — outside (10 naks)
//
// Transiting malefics inside (stambha/madhya) are dangerous for the
// native's health/longevity; benefics inside are protective.

type KotaZone = 'Stambha' | 'Madhya' | 'Prakara' | 'Bahya';

function kotaZone(offset: number): KotaZone {
  if (offset === 1) return 'Stambha';
  if (offset <= 8) return 'Madhya';
  if (offset <= 17) return 'Prakara';
  return 'Bahya';
}

export interface KotaCell {
  nakshatra: number;
  name: string;
  offsetFromKota: number;
  zone: KotaZone;
  occupants: PlanetId[];
}

export interface KotaResult {
  kotaNakshatra: number;      // Janma nak (natal Moon nak)
  kotaPala: PlanetId;         // the "fortress lord" (lord of kota-nakshatra)
  kotaSwami: PlanetId;        // commander (lord of 1/4-quarter count)
  cells: KotaCell[];
  attackers: { planet: PlanetId; zone: KotaZone; nakshatra: number }[];
  defenders: { planet: PlanetId; zone: KotaZone; nakshatra: number }[];
  summary: string;
}

export function computeKota(natal: KundaliResult, locale: Locale = 'en'): KotaResult {
  const al = astroLabels(locale);
  const moon = natal.planets.find((pl) => pl.id === 'MO');
  if (!moon) {
    return {
      kotaNakshatra: 0, kotaPala: 'SU', kotaSwami: 'SU',
      cells: [], attackers: [], defenders: [], summary: 'Moon not found.',
    };
  }
  const moonNak = moon.nakshatra.num;
  const kotaPala = NAKSHATRAS[moonNak - 1].lord;
  // Kota Swami = lord of the nakshatra 1/4 of the way around (≈7 ahead)
  const swamiNak = ((moonNak - 1 + 7) % 27) + 1;
  const kotaSwami = NAKSHATRAS[swamiNak - 1].lord;

  const nakTenants: Record<number, PlanetId[]> = {};
  for (const pl of natal.planets) {
    (nakTenants[pl.nakshatra.num] ||= []).push(pl.id);
  }

  const cells: KotaCell[] = [];
  for (let off = 1; off <= 27; off++) {
    const nak = ((moonNak - 1 + off - 1) % 27) + 1;
    cells.push({
      nakshatra: nak,
      name: al.nakshatra(nak),
      offsetFromKota: off,
      zone: kotaZone(off),
      occupants: nakTenants[nak] || [],
    });
  }

  const attackers: { planet: PlanetId; zone: KotaZone; nakshatra: number }[] = [];
  const defenders: { planet: PlanetId; zone: KotaZone; nakshatra: number }[] = [];
  for (const c of cells) {
    if (c.zone === 'Stambha' || c.zone === 'Madhya') {
      for (const pl of c.occupants) {
        if (MALEFIC_SET.has(pl)) attackers.push({ planet: pl, zone: c.zone, nakshatra: c.nakshatra });
        else if (BENEFIC_SET.has(pl)) defenders.push({ planet: pl, zone: c.zone, nakshatra: c.nakshatra });
      }
    }
  }

  const summary = attackers.length > defenders.length
    ? pf('chakras.kota.summary.threat', locale, { att: attackers.length, def: defenders.length }, '')
    : defenders.length > 0
      ? pf('chakras.kota.summary.holds', locale, { def: defenders.length, att: attackers.length }, '')
      : p('chakras.kota.summary.empty', locale, 'Fortress empty — life events proceed at their own pace.');

  return { kotaNakshatra: moonNak, kotaPala, kotaSwami, cells, attackers, defenders, summary };
}

// ─────────────────────────────────────────────────────────────────
// 5. Chatushpata Chakra
// ─────────────────────────────────────────────────────────────────
//
// 4-quarter construction/vaastu chakra. Maps 27 nakshatras to 4 padas
// aligned with cardinal directions. Each pada has a deity, element,
// and guidance for whether construction / griha-pravesh on its naks
// is auspicious.
//
// Padas from Moon-nak:
//   1. Purva (East)   — naks 1-7   — Agni — entry / first step auspicious
//   2. Dakshina (S)   — naks 8-14  — Yama — avoid major works
//   3. Paschim (W)    — naks 15-20 — Varuna — foundation-laying OK
//   4. Uttara (N)     — naks 21-27 — Kubera — wealth / crown works

type ChatushpataPada = {
  name: 'Purva' | 'Dakshina' | 'Paschim' | 'Uttara';
  direction: 'East' | 'South' | 'West' | 'North';
  deity: string;
  element: string;
  auspicious: boolean;
  guidance: string;
};

const CHATUSHPATA_PADAS: ChatushpataPada[] = [
  { name: 'Purva',    direction: 'East',  deity: 'Agni',    element: 'Fire',  auspicious: true,  guidance: 'Threshold, first-entry, bhoomi-puja' },
  { name: 'Dakshina', direction: 'South', deity: 'Yama',    element: 'Earth', auspicious: false, guidance: 'Avoid new construction or openings' },
  { name: 'Paschim',  direction: 'West',  deity: 'Varuna',  element: 'Water', auspicious: true,  guidance: 'Foundation / well-digging / plumbing' },
  { name: 'Uttara',   direction: 'North', deity: 'Kubera',  element: 'Metal', auspicious: true,  guidance: 'Safes, treasury, gold, crown stone' },
];

function chatushpataPadaIdx(offset: number): 0 | 1 | 2 | 3 {
  if (offset <= 7)  return 0;
  if (offset <= 14) return 1;
  if (offset <= 20) return 2;
  return 3;
}

export interface ChatushpataCell {
  nakshatra: number;
  name: string;
  offsetFromMoon: number;
  padaIdx: number;
  pada: string;
  direction: string;
  deity: string;
  auspicious: boolean;
  occupants: PlanetId[];
}

export interface ChatushpataResult {
  moonNakshatra: number;
  padas: ChatushpataPada[];
  cells: ChatushpataCell[];
  recommendations: {
    bhoomiPuja:    { nakshatras: number[]; names: string[] };
    foundation:    { nakshatras: number[]; names: string[] };
    grihapravesh:  { nakshatras: number[]; names: string[] };
    avoid:         { nakshatras: number[]; names: string[] };
  };
}

export function computeChatushpata(natal: KundaliResult, locale: Locale = 'en'): ChatushpataResult {
  const al = astroLabels(locale);
  const moon = natal.planets.find((pl) => pl.id === 'MO');
  const moonNak = moon ? moon.nakshatra.num : 1;

  const nakTenants: Record<number, PlanetId[]> = {};
  for (const pl of natal.planets) {
    (nakTenants[pl.nakshatra.num] ||= []).push(pl.id);
  }

  // Build localized padas (overlay name / direction / deity / element / guidance)
  const localizedPadas: ChatushpataPada[] = CHATUSHPATA_PADAS.map((pada) => ({
    ...pada,
    name:      p(`chakras.pada.${pada.name}.name`,      locale, pada.name) as ChatushpataPada['name'],
    direction: p(`chakras.pada.${pada.name}.name`,      locale, pada.direction) as ChatushpataPada['direction'],
    deity:     p(`chakras.deity.${pada.deity}`,         locale, pada.deity),
    element:   p(`chakras.element.${pada.element}`,     locale, pada.element),
    guidance:  p(`chakras.pada.${pada.name}.guidance`,  locale, pada.guidance),
  }));

  const cells: ChatushpataCell[] = [];
  for (let off = 1; off <= 27; off++) {
    const nak = ((moonNak - 1 + off - 1) % 27) + 1;
    const idx = chatushpataPadaIdx(off);
    const padaSrc = CHATUSHPATA_PADAS[idx];
    cells.push({
      nakshatra: nak,
      name: al.nakshatra(nak),
      offsetFromMoon: off,
      padaIdx: idx,
      pada: p(`chakras.pada.${padaSrc.name}.name`, locale, padaSrc.name),
      direction: padaSrc.direction, // direction stays English short — used as functional key client-side
      deity: p(`chakras.deity.${padaSrc.deity}`, locale, padaSrc.deity),
      auspicious: padaSrc.auspicious,
      occupants: nakTenants[nak] || [],
    });
  }

  const byPada = (idx: number) => cells.filter((c) => c.padaIdx === idx).map((c) => c.nakshatra);
  const namesOf = (nums: number[]) => nums.map((n) => al.nakshatra(n));
  const purva = byPada(0);
  const dakshi = byPada(1);
  const paschi = byPada(2);
  const uttara = byPada(3);

  return {
    moonNakshatra: moonNak,
    padas: localizedPadas,
    cells,
    recommendations: {
      bhoomiPuja:    { nakshatras: purva,  names: namesOf(purva) },
      foundation:    { nakshatras: paschi, names: namesOf(paschi) },
      grihapravesh:  { nakshatras: uttara, names: namesOf(uttara) },
      avoid:         { nakshatras: dakshi, names: namesOf(dakshi) },
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// Bundle
// ─────────────────────────────────────────────────────────────────

export interface AllChakrasResult {
  sarvatobhadra: SarvatoResult;
  kalanala:      KalanalaResult;
  shoola:        ShoolaResult;
  kota:          KotaResult;
  chatushpata:   ChatushpataResult;
}

export function computeAllChakras(natal: KundaliResult, when?: string, locale: Locale = 'en'): AllChakrasResult {
  return {
    sarvatobhadra: computeSarvatobhadra(natal, locale),
    kalanala:      computeKalanala(natal, locale),
    shoola:        computeShoola(natal, when, locale),
    kota:          computeKota(natal, locale),
    chatushpata:   computeChatushpata(natal, locale),
  };
}

// Unused but exported for potential consumer UI helpers
export { PLANET_ORDER as _CHAKRA_PLANET_ORDER };
