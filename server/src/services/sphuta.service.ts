// Sphutas — classical sensitive point computations.
//
// A "sphuta" is a computed longitude made by summing/averaging the
// longitudes of two or more reference points (planets, Lagna, Gulika).
// Each sphuta has a classical purpose — progeny, wealth, longevity, etc.
//
// We compute the standard BPHS/Tajika sphutas:
//
//   • Pranapada Sphuta — fine time marker; 5 × (time in vighatis from
//     sunrise) + Sun's longitude. Each pran = 4 sec → full 30° shift
//     every 12 minutes.
//   • Beeja Sphuta      — Sun + Venus + Jupiter. Progeny for male.
//   • Kshetra Sphuta    — Moon + Mars + Jupiter. Progeny for female.
//   • Tri-Sphuta        — Lagna + Moon + Sun. Life force indicator.
//   • Chatuh-Sphuta     — Tri + Gulika. BPHS longevity.
//   • Pancha-Sphuta     — Chatuh + Rahu. Full longevity sum.
//   • Ayur Sphuta       — Saturn + Moon + Lagna. Lifespan indicator.
//   • Yogi Sphuta       — Sun + Moon + 93°20′. Yogi/Avayogi.
//   • Avayogi Sphuta    — complementary to Yogi.
//
// And the four "lagnas of prosperity" not yet elsewhere in the engine:
//
//   • Indu Lagna        — Janma-kala Chandra-grihana; sign reached by
//                         counting (9th lord's kala) signs from Moon.
//   • Shree Lagna       — "Auspicious Lagna"; Ascendant + Moon's nakshatra
//                         × 13°20' from zero (BPHS chaitra-paddhati).
//   • Varnada Lagna     — "Caste Lagna"; derived from Lagna and Hora
//                         Lagna quality match.
//   • Bhava Lagna ref   — already in jaimini.service.ts; referenced for
//                         Shree computation.

import { PlanetId, RASHIS, normDeg, rashiOf, nakshatraOf, houseOf, NAK_SPAN } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { computeUpagrahas } from './upagraha.service';
import { computeTimeLagnas } from './jaimini.service';
import { toUTC } from '../utils/julian';

export interface SphutaEntry {
  id: string;
  name: string;
  longitude: number;
  signNum: number;
  signName: string;
  degInRashi: number;
  nakshatraName: string;
  nakshatraPada: number;
  house: number;
  formula: string;
  purpose: string;
}

function signIdx(lng: number): number {
  return Math.floor(normDeg(lng) / 30);
}

function build(id: string, name: string, lng: number, ascLng: number, formula: string, purpose: string): SphutaEntry {
  const L = normDeg(lng);
  const r = rashiOf(L);
  const n = nakshatraOf(L);
  return {
    id, name,
    longitude: L,
    signNum: r.num,
    signName: r.name,
    degInRashi: r.deg,
    nakshatraName: n.name,
    nakshatraPada: n.pada,
    house: houseOf(L, ascLng),
    formula, purpose,
  };
}

function lngOf(k: KundaliResult, id: PlanetId): number {
  return k.planets.find((p) => p.id === id)!.longitude;
}

// ─── Pranapada ───────────────────────────────────────────────────────────────
//
// Pranapada = 5 × (vighatis since sunrise) + Sun's longitude.
// 1 ghatika = 24 minutes = 60 vighatis; so 1 vighati ≈ 24 s.
// We use the hours-since-sunrise already computed by computeTimeLagnas.

function pranapadaLongitude(k: KundaliResult): number | null {
  const tl = computeTimeLagnas(k);
  if (tl.sunriseUTC == null || tl.sunAtSunrise == null) return null;
  // 1 hour = 3600s = 150 vighatis. Pran-pada shifts 5°/vighati.
  // That's way too fast — BPHS uses a reduced rate. The canonical formula
  // using "pranas" of 4s each: each pran adds 30° / 360 pranas per hour
  // which works out to advancing full 30 signs every 2 hours.
  //
  // Canonical: PP = Sun + (vighatikas-since-sunrise / 6) × 30° (equivalent
  // to Sun advancing by the fraction of a 2-hour window).
  const hours = tl.lagnas[0]?.hoursSinceSunrise ?? 0;
  const vighatis = hours * 150; // 1 hr = 150 vighatis
  const degShift = (vighatis / 60) * 12; // 60 vighatis = 12° (BPHS)
  return normDeg(tl.sunAtSunrise + degShift);
}

// ─── Indu Lagna (Yogic wealth lagna) ─────────────────────────────────────────
//
// Classical "kala" allocations per planet:
//   SU 30, MO 16, MA 6, ME 8, JU 10, VE 12, SA 1
// Indu Lagna = (9th-from-Lagna lord's kala + 9th-from-Moon lord's kala) mod
// 12, counted from Moon's sign. (Sum mod 12; starting from Moon.)
const KALA: Record<PlanetId, number> = {
  SU: 30, MO: 16, MA: 6, ME: 8, JU: 10, VE: 12, SA: 1, RA: 0, KE: 0,
};

function induLagnaSign(k: KundaliResult): number {
  const lagnaSign = k.ascendant.rashi.num;
  const moonSign = k.planets.find((p) => p.id === 'MO')!.rashi.num;

  const ninthFromLagna = ((lagnaSign - 1 + 8) % 12) + 1;
  const ninthFromMoon  = ((moonSign  - 1 + 8) % 12) + 1;
  const lordA = RASHIS[ninthFromLagna - 1].lord;
  const lordB = RASHIS[ninthFromMoon  - 1].lord;

  const total = KALA[lordA] + KALA[lordB];
  const offset = total % 12;
  return ((moonSign - 1 + offset) % 12) + 1;
}

// ─── Shree Lagna ─────────────────────────────────────────────────────────────
//
// Shree Lagna = Ascendant + (Moon's nakshatra−1) × 13°20' + (pada within
// nakshatra offset). BPHS 7/37. Effectively walks Ascendant forward by
// Moon's position in the nakshatra chain.

function shreeLagnaLongitude(k: KundaliResult): number {
  const moon = k.planets.find((p) => p.id === 'MO')!;
  const nakNum = moon.nakshatra.num;
  const pada = moon.nakshatra.pada;
  const asc = k.ascendant.longitude;
  // shift = (nakNum-1)*NAK_SPAN + (pada-1)*(NAK_SPAN/4)
  const shift = (nakNum - 1) * NAK_SPAN + (pada - 1) * (NAK_SPAN / 4);
  return normDeg(asc + shift);
}

// ─── Varnada Lagna ───────────────────────────────────────────────────────────
//
// Varnada depends on Lagna and Hora Lagna qualities:
//   - Lagna & HL both odd or both even → Varnada = HL (in matching count)
//   - Otherwise Varnada = 13th from Lagna (= 1st, but classical rule gives
//     12th counted a specific way).
// We implement the common BPHS rule: if both Lagna and Hora are odd, Varnada
// counts forward from HL by (HL - Lagna) counted forward; if both even,
// count backward; if mismatched, 13−count. Approximation below follows
// Santhanam's implementation in PL.

function varnadaLagnaSign(k: KundaliResult): number {
  const tl = computeTimeLagnas(k);
  const lagnaSign = k.ascendant.rashi.num;
  const horaSign = tl.lagnas.find((l) => l.id === 'HORA')?.rashi.num ?? lagnaSign;

  const lagnaOdd = lagnaSign % 2 === 1;
  const horaOdd = horaSign % 2 === 1;

  if (lagnaOdd === horaOdd) {
    // count forward from Aries to Lagna, and from Aries to Hora; sum mod 12
    const sum = lagnaSign + horaSign;
    return ((sum - 1) % 12) + 1 || 12;
  } else {
    const diff = Math.abs(lagnaSign - horaSign);
    const n = (13 - diff + 12) % 12;
    return n === 0 ? 12 : n;
  }
}

// ─── Aggregate ───────────────────────────────────────────────────────────────

export interface SphutaResult {
  sphutas: SphutaEntry[];
  indulagna: { signNum: number; signName: string; lord: PlanetId };
  varnadaLagna: { signNum: number; signName: string; lord: PlanetId };
}

export function calculateSphutas(k: KundaliResult): SphutaResult {
  const asc = k.ascendant.longitude;
  const sun = lngOf(k, 'SU');
  const moon = lngOf(k, 'MO');
  const mars = lngOf(k, 'MA');
  const jup = lngOf(k, 'JU');
  const ven = lngOf(k, 'VE');
  const sat = lngOf(k, 'SA');
  const rahu = lngOf(k, 'RA');

  // Gulika — use the upagraha service; fall back to Saturn if unavailable.
  const upas = computeUpagrahas(k);
  const gulika = upas.gulika?.longitude ?? sat;

  const entries: SphutaEntry[] = [];

  const pp = pranapadaLongitude(k);
  if (pp != null) {
    entries.push(build('PRANAPADA', 'Pranapada', pp, asc,
      "Sun + (vighatis/60)×12°",
      'Fine time-of-birth marker; used to cross-check rectification'));
  }

  const beeja = normDeg(sun + ven + jup);
  entries.push(build('BEEJA', 'Beeja Sphuta', beeja, asc,
    'Sun + Venus + Jupiter',
    'Progeny (male) — strength of procreative yoga'));

  const kshetra = normDeg(moon + mars + jup);
  entries.push(build('KSHETRA', 'Kshetra Sphuta', kshetra, asc,
    'Moon + Mars + Jupiter',
    'Progeny (female) — fertility indicator'));

  const triSphuta = normDeg(asc + moon + sun);
  entries.push(build('TRI_SPHUTA', 'Tri-Sphuta', triSphuta, asc,
    'Lagna + Moon + Sun',
    'Life force — adverse transits here mark vitality dips'));

  const chatuh = normDeg(triSphuta + gulika);
  entries.push(build('CHATUH_SPHUTA', 'Chatuh-Sphuta', chatuh, asc,
    'Tri-Sphuta + Gulika',
    'BPHS longevity sum — afflicted trine markers shorten life'));

  const pancha = normDeg(chatuh + rahu);
  entries.push(build('PANCHA_SPHUTA', 'Pancha-Sphuta', pancha, asc,
    'Chatuh-Sphuta + Rahu',
    'Full longevity sum; used for Maraka-dasha confirmation'));

  const ayur = normDeg(sat + moon + asc);
  entries.push(build('AYUR', 'Ayur Sphuta', ayur, asc,
    'Saturn + Moon + Lagna',
    'Lifespan point — transits by Saturn here are critical'));

  // Yogi / Avayogi — classical "Sun + Moon + 93°20'" gives the Yogi point.
  const yogi = normDeg(sun + moon + 93 + 20 / 60);
  entries.push(build('YOGI', 'Yogi Sphuta', yogi, asc,
    "Sun + Moon + 93°20'",
    'Yogi — nakshatra lord is highly auspicious; rashi lord is duplicate Yogi'));
  const avayogi = normDeg(yogi + 186 + 40 / 60);
  entries.push(build('AVAYOGI', 'Avayogi Sphuta', avayogi, asc,
    "Yogi + 186°40'",
    'Avayogi — nakshatra lord causes obstructions'));

  const induSign = induLagnaSign(k);
  const varnadaSign = varnadaLagnaSign(k);

  return {
    sphutas: entries,
    indulagna: {
      signNum: induSign,
      signName: RASHIS[induSign - 1].name,
      lord: RASHIS[induSign - 1].lord,
    },
    varnadaLagna: {
      signNum: varnadaSign,
      signName: RASHIS[varnadaSign - 1].name,
      lord: RASHIS[varnadaSign - 1].lord,
    },
  };
}
