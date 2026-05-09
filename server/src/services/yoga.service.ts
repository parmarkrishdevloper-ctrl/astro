import { KundaliResult } from './kundali.service';
import { PlanetId, RASHIS } from '../utils/astro-constants';
import { detectAllYogas } from './yoga-engine.service';
import { p, pf, tPlanet, tRashi, type Locale } from '../i18n';

export interface YogaResult {
  /** Stable English name. Client maps via `al.yoga(name)`. */
  name: string;
  type: 'Mahapurusha' | 'Raja' | 'Dhana' | 'Lunar' | 'Other';
  involves: PlanetId[];
  /** Localised description prose. */
  description: string;
  strength: 'strong' | 'moderate' | 'weak';
}

// ─── PANCHA MAHAPURUSHA ─────────────────────────────────────────────────────
// Each non-luminary (Mars, Mercury, Jupiter, Venus, Saturn) forms a Mahapurusha
// yoga when in own sign or exalted, AND in a kendra (1, 4, 7, 10).
const MAHAPURUSHA: { planet: PlanetId; name: string }[] = [
  { planet: 'MA', name: 'Ruchaka Yoga' },
  { planet: 'ME', name: 'Bhadra Yoga' },
  { planet: 'JU', name: 'Hamsa Yoga' },
  { planet: 'VE', name: 'Malavya Yoga' },
  { planet: 'SA', name: 'Shasha Yoga' },
];

const KENDRAS = [1, 4, 7, 10];

function checkPanchaMahapurusha(k: KundaliResult, locale: Locale): YogaResult[] {
  const out: YogaResult[] = [];
  for (const mp of MAHAPURUSHA) {
    const pl = k.planets.find((x) => x.id === mp.planet)!;
    if ((pl.ownSign || pl.exalted) && KENDRAS.includes(pl.house)) {
      const state = p(pl.exalted ? 'yoga.state.exalted' : 'yoga.state.ownSign', locale);
      out.push({
        name: mp.name,
        type: 'Mahapurusha',
        involves: [mp.planet],
        description: pf('yoga.description.PanchaMahapurusha', locale, {
          planet: tPlanet(locale, mp.planet),
          state,
          rashi: tRashi(locale, pl.rashi.num),
          house: pl.house,
        }),
        strength: pl.exalted ? 'strong' : 'moderate',
      });
    }
  }
  return out;
}

// ─── GAJAKESARI ─────────────────────────────────────────────────────────────
// Jupiter in a kendra (1,4,7,10) from the Moon.
function checkGajakesari(k: KundaliResult, locale: Locale): YogaResult | null {
  const moon = k.planets.find((pl) => pl.id === 'MO')!;
  const jup = k.planets.find((pl) => pl.id === 'JU')!;
  const dist = ((jup.rashi.num - moon.rashi.num + 12) % 12) + 1;
  if ([1, 4, 7, 10].includes(dist)) {
    const suffix = dist === 1 ? 'st' : dist === 4 ? 'th' : dist === 7 ? 'th' : 'th';
    return {
      name: 'Gajakesari Yoga',
      type: 'Lunar',
      involves: ['MO', 'JU'],
      description: pf('yoga.description.Gajakesari', locale, { dist: `${dist}${suffix}` }),
      strength: 'moderate',
    };
  }
  return null;
}

// ─── BUDHADITYA ─────────────────────────────────────────────────────────────
// Sun and Mercury in the same sign (i.e., conjunct).
function checkBudhaditya(k: KundaliResult, locale: Locale): YogaResult | null {
  const sun = k.planets.find((pl) => pl.id === 'SU')!;
  const mer = k.planets.find((pl) => pl.id === 'ME')!;
  if (sun.rashi.num === mer.rashi.num && !mer.combust) {
    return {
      name: 'Budhaditya Yoga',
      type: 'Other',
      involves: ['SU', 'ME'],
      description: pf('yoga.description.Budhaditya', locale, { rashi: tRashi(locale, sun.rashi.num) }),
      strength: 'moderate',
    };
  }
  return null;
}

// ─── CHANDRA-MANGALA YOGA ───────────────────────────────────────────────────
// Moon and Mars conjunct or in mutual aspect → wealth yoga.
function checkChandraMangala(k: KundaliResult, locale: Locale): YogaResult | null {
  const moon = k.planets.find((pl) => pl.id === 'MO')!;
  const mars = k.planets.find((pl) => pl.id === 'MA')!;
  if (moon.rashi.num === mars.rashi.num) {
    return {
      name: 'Chandra-Mangala Yoga',
      type: 'Dhana',
      involves: ['MO', 'MA'],
      description: p('yoga.description.ChandraMangala', locale),
      strength: 'moderate',
    };
  }
  return null;
}

// ─── KEMADRUMA (NEGATIVE) ───────────────────────────────────────────────────
// No planet (other than Sun, Rahu, Ketu) in 2nd or 12th from Moon, and no
// planet conjunct Moon.
function checkKemadruma(k: KundaliResult, locale: Locale): YogaResult | null {
  const moon = k.planets.find((pl) => pl.id === 'MO')!;
  const others = k.planets.filter((pl) => !['MO', 'SU', 'RA', 'KE'].includes(pl.id));
  const moonRashi = moon.rashi.num;
  const second = (moonRashi % 12) + 1;
  const twelfth = ((moonRashi - 2 + 12) % 12) + 1;
  const presence = others.some((pl) =>
    pl.rashi.num === moonRashi || pl.rashi.num === second || pl.rashi.num === twelfth,
  );
  if (!presence) {
    return {
      name: 'Kemadruma Yoga',
      type: 'Other',
      involves: ['MO'],
      description: p('yoga.description.Kemadruma', locale),
      strength: 'weak',
    };
  }
  return null;
}

// ─── RAJA YOGA — basic detection ────────────────────────────────────────────
// Lord of a kendra (1,4,7,10) conjunct or in mutual aspect with lord of a
// trikona (1,5,9). We do a simplified version: same-sign conjunction only.
function checkRajaYogas(k: KundaliResult, locale: Locale): YogaResult[] {
  const out: YogaResult[] = [];
  const lagnaRashi = k.ascendant.rashi.num;
  const KENDRA_RASHIS = [
    lagnaRashi,
    ((lagnaRashi + 2) % 12) + 1,
    ((lagnaRashi + 5) % 12) + 1,
    ((lagnaRashi + 8) % 12) + 1,
  ];
  const TRIKONA_RASHIS = [
    lagnaRashi,
    ((lagnaRashi + 3) % 12) + 1,
    ((lagnaRashi + 7) % 12) + 1,
  ];

  const kendraLords = new Set(KENDRA_RASHIS.map((r) => RASHIS[r - 1].lord));
  const trikonaLords = new Set(TRIKONA_RASHIS.map((r) => RASHIS[r - 1].lord));

  // Find planets that own a kendra and are conjunct with planets that own a trikona
  for (const a of k.planets) {
    if (!kendraLords.has(a.id)) continue;
    for (const b of k.planets) {
      if (a.id === b.id) continue;
      if (!trikonaLords.has(b.id)) continue;
      if (a.rashi.num === b.rashi.num) {
        out.push({
          name: 'Raja Yoga',
          type: 'Raja',
          involves: [a.id, b.id],
          description: pf('yoga.description.RajaYoga', locale, {
            a: tPlanet(locale, a.id),
            b: tPlanet(locale, b.id),
            rashi: tRashi(locale, a.rashi.num),
          }),
          strength: 'strong',
        });
        break; // one per kendra-lord pair
      }
    }
  }
  return out;
}

// ─── NEECHABHANGA RAJA YOGA ─────────────────────────────────────────────────
// A debilitated planet's Neecha is "cancelled" (bhanga) when its dispositor
// (lord of the sign it occupies) is in a kendra from the Ascendant or Moon,
// turning the debilitation into a Raja Yoga.
function checkNeechabhanga(k: KundaliResult, locale: Locale): YogaResult[] {
  const out: YogaResult[] = [];
  const moon = k.planets.find((pl) => pl.id === 'MO')!;
  for (const pl of k.planets) {
    if (!pl.debilitated) continue;
    const dispId = RASHIS[pl.rashi.num - 1].lord;
    const disp = k.planets.find((x) => x.id === dispId);
    if (!disp) continue;
    const fromLagna = disp.house;
    const fromMoon = ((disp.rashi.num - moon.rashi.num + 12) % 12) + 1;
    const inKendra = [1, 4, 7, 10];
    if (inKendra.includes(fromLagna) || inKendra.includes(fromMoon)) {
      const anchorKey = inKendra.includes(fromLagna) ? 'yoga.anchor.lagna' : 'yoga.anchor.moon';
      out.push({
        name: 'Neechabhanga Raja Yoga',
        type: 'Raja',
        involves: [pl.id, dispId],
        description: pf('yoga.description.Neechabhanga', locale, {
          planet: tPlanet(locale, pl.id),
          rashi: tRashi(locale, pl.rashi.num),
          disp: tPlanet(locale, dispId),
          anchor: p(anchorKey, locale),
        }),
        strength: 'strong',
      });
    }
  }
  return out;
}

// ─── VIPARITA RAJA YOGAS — Harsha / Sarala / Vimala ─────────────────────────
// Lord of a dusthana (6/8/12) in another dusthana becomes a Viparita Raja
// Yoga: "reverse" of misfortune → prosperity through adversity.
function checkViparitaRaja(k: KundaliResult, locale: Locale): YogaResult[] {
  const lagna = k.ascendant.rashi.num;
  const dustRashi = (n: number) => ((lagna + n - 2) % 12) + 1;
  const sixth = RASHIS[dustRashi(6) - 1].lord;
  const eighth = RASHIS[dustRashi(8) - 1].lord;
  const twelfth = RASHIS[dustRashi(12) - 1].lord;
  const DUST_HOUSES = [6, 8, 12];
  const out: YogaResult[] = [];
  const named: { lord: PlanetId; name: string; house: number }[] = [
    { lord: sixth,   name: 'Harsha (6th)',  house: 6 },
    { lord: eighth,  name: 'Sarala (8th)',  house: 8 },
    { lord: twelfth, name: 'Vimala (12th)', house: 12 },
  ];
  for (const v of named) {
    const pl = k.planets.find((x) => x.id === v.lord);
    if (!pl) continue;
    if (DUST_HOUSES.includes(pl.house) && pl.house !== v.house) {
      // Only "benefic" variant: the dusthana lord sits in a DIFFERENT dusthana
      out.push({
        name: `Viparita Raja Yoga — ${v.name}`,
        type: 'Raja',
        involves: [v.lord],
        description: pf('yoga.description.Viparita', locale, {
          planet: tPlanet(locale, pl.id),
          ofHouse: v.house,
          inHouse: pl.house,
        }),
        strength: 'strong',
      });
    }
  }
  return out;
}

// ─── DARIDRA YOGA ───────────────────────────────────────────────────────────
// 11th lord (labhesha) in a dusthana (6/8/12) → financial struggle.
function checkDaridra(k: KundaliResult, locale: Locale): YogaResult | null {
  const lagna = k.ascendant.rashi.num;
  const eleventhRashi = ((lagna + 9) % 12) + 1;
  const lordId = RASHIS[eleventhRashi - 1].lord;
  const pl = k.planets.find((x) => x.id === lordId);
  if (!pl) return null;
  if ([6, 8, 12].includes(pl.house)) {
    return {
      name: 'Daridra Yoga',
      type: 'Other',
      involves: [lordId],
      description: pf('yoga.description.Daridra', locale, {
        planet: tPlanet(locale, pl.id),
        house: pl.house,
      }),
      strength: 'moderate',
    };
  }
  return null;
}

// ─── SAKATA YOGA (negative) ─────────────────────────────────────────────────
// Moon in 6/8/12 from Jupiter — fluctuating fortune, rise-fall cycles.
// Cancelled if Jupiter is in kendra from Lagna.
function checkSakata(k: KundaliResult, locale: Locale): YogaResult | null {
  const moon = k.planets.find((pl) => pl.id === 'MO')!;
  const jup = k.planets.find((pl) => pl.id === 'JU')!;
  const dist = ((moon.rashi.num - jup.rashi.num + 12) % 12) + 1;
  if (![6, 8, 12].includes(dist)) return null;
  const cancelled = [1, 4, 7, 10].includes(jup.house);
  return {
    name: 'Sakata Yoga',
    type: 'Lunar',
    involves: ['MO', 'JU'],
    description: pf('yoga.description.Sakata', locale, {
      dist,
      cancel: cancelled ? p('yoga.sakata.cancelled', locale) : '',
    }),
    strength: cancelled ? 'weak' : 'moderate',
  };
}

// ─── ADHI YOGA ──────────────────────────────────────────────────────────────
// Benefics (Jupiter, Venus, Mercury) in 6th, 7th and 8th from the Moon —
// leadership, authority, prosperity.
function checkAdhi(k: KundaliResult, locale: Locale): YogaResult | null {
  const moon = k.planets.find((pl) => pl.id === 'MO')!;
  const benefics: PlanetId[] = ['JU', 'VE', 'ME'];
  const housesFromMoon = [6, 7, 8];
  const found = new Set<number>();
  const involved: PlanetId[] = [];
  for (const bid of benefics) {
    const pl = k.planets.find((x) => x.id === bid)!;
    const d = ((pl.rashi.num - moon.rashi.num + 12) % 12) + 1;
    if (housesFromMoon.includes(d)) {
      found.add(d);
      involved.push(bid);
    }
  }
  if (found.size >= 2 && involved.length >= 2) {
    return {
      name: 'Adhi Yoga',
      type: 'Raja',
      involves: involved,
      description: pf('yoga.description.Adhi', locale, {
        list: involved.map((id) => tPlanet(locale, id)).join(', '),
      }),
      strength: found.size === 3 ? 'strong' : 'moderate',
    };
  }
  return null;
}

// ─── NABHASA ASRAYA YOGAS — Rajju / Musala / Nala ───────────────────────────
// The 7 non-nodal planets all confined to one rashi-type:
//   Rajju : all in movable (chara) signs
//   Musala: all in fixed (sthira) signs
//   Nala  : all in dual (dwi) signs
function checkNabhasaAsraya(k: KundaliResult, locale: Locale): YogaResult | null {
  const CORE: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA'];
  const rashis = CORE.map((pid) => k.planets.find((x) => x.id === pid)!.rashi.num);
  // Movable: 1,4,7,10 ; Fixed: 2,5,8,11 ; Dual: 3,6,9,12
  const MOVABLE = [1, 4, 7, 10];
  const FIXED = [2, 5, 8, 11];
  const DUAL = [3, 6, 9, 12];
  const allIn = (set: number[]) => rashis.every((r) => set.includes(r));
  if (allIn(MOVABLE)) return {
    name: 'Rajju Yoga (Nabhasa Asraya)',
    type: 'Other',
    involves: CORE,
    description: p('yoga.description.RajjuNabhasa', locale),
    strength: 'strong',
  };
  if (allIn(FIXED)) return {
    name: 'Musala Yoga (Nabhasa Asraya)',
    type: 'Other',
    involves: CORE,
    description: p('yoga.description.MusalaNabhasa', locale),
    strength: 'strong',
  };
  if (allIn(DUAL)) return {
    name: 'Nala Yoga (Nabhasa Asraya)',
    type: 'Other',
    involves: CORE,
    description: p('yoga.description.NalaNabhasa', locale),
    strength: 'moderate',
  };
  return null;
}

export function detectYogas(k: KundaliResult, locale: Locale = 'en'): YogaResult[] {
  const out: YogaResult[] = [];
  out.push(...checkPanchaMahapurusha(k, locale));
  const gj = checkGajakesari(k, locale); if (gj) out.push(gj);
  const bd = checkBudhaditya(k, locale); if (bd) out.push(bd);
  const cm = checkChandraMangala(k, locale); if (cm) out.push(cm);
  const km = checkKemadruma(k, locale); if (km) out.push(km);
  out.push(...checkRajaYogas(k, locale));

  // Phase 9.3 — Extended classical yogas
  out.push(...checkNeechabhanga(k, locale));
  out.push(...checkViparitaRaja(k, locale));
  const dr = checkDaridra(k, locale); if (dr) out.push(dr);
  const sk = checkSakata(k, locale); if (sk) out.push(sk);
  const ad = checkAdhi(k, locale); if (ad) out.push(ad);
  const nb = checkNabhasaAsraya(k, locale); if (nb) out.push(nb);

  // Merge in results from the DSL yoga engine (classical DB — Phase 14I
  // expansion). De-duplicate by yoga name to avoid showing both hand-coded
  // and DSL versions of the same classical combination.
  const seen = new Set(out.map((y) => y.name.toLowerCase()));
  const CAT_MAP: Record<string, YogaResult['type']> = {
    Raja: 'Raja', Dhana: 'Dhana', Mahapurusha: 'Mahapurusha', Lunar: 'Lunar',
  };
  for (const d of detectAllYogas(k, locale)) {
    if (seen.has(d.name.toLowerCase())) continue;
    out.push({
      name: d.name,
      type: CAT_MAP[d.category] ?? 'Other',
      involves: d.involves ?? [],
      description: d.effect + (d.source ? ` (${d.source})` : ''),
      strength: (d.strength as YogaResult['strength']) ?? 'moderate',
    });
    seen.add(d.name.toLowerCase());
  }
  return out;
}
