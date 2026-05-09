// Phase 13 — Marital astrology (deep).
//
// Deeper than the basic life-areas module. Analyses the 7th house stack:
//   • 7th lord placement and condition
//   • Darakaraka (Jaimini — spouse karaka)
//   • Upa-pada Lagna (UL) — classical spouse indicator
//   • Navamsha (D9) 7th house — second-half-of-life spouse chart
//   • Venus (wife karaka) / Jupiter (husband karaka) strength
//   • Mangal dosha status
//   • Spouse descriptor (sign, nature, appearance hints)
//   • Timing windows via Vimshottari dashas

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { calculateKarakas } from './jaimini.service';
import { buildDivisional } from './divisional.service';
import { computeMahadashas } from './dasha.service';
import { Locale as _MaritalLocale } from '../i18n';

const MALEFICS: PlanetId[] = ['SA', 'MA', 'RA', 'KE', 'SU'];
const BENEFICS: PlanetId[] = ['JU', 'VE', 'ME', 'MO'];

function planetsAspectingHouse(k: KundaliResult, house: number): PlanetId[] {
  const res: PlanetId[] = [];
  for (const p of k.planets) {
    const dist = ((house - p.house + 12) % 12) + 1;
    if (dist === 7) res.push(p.id);
    if (p.id === 'MA' && (dist === 4 || dist === 8)) res.push(p.id);
    if (p.id === 'JU' && (dist === 5 || dist === 9)) res.push(p.id);
    if (p.id === 'SA' && (dist === 3 || dist === 10)) res.push(p.id);
  }
  return res;
}

// Upa-pada Lagna (UL) = sign at (count from asc to 12th lord, then count same
// number of signs from 12th lord). Simplified: the sign occupied by 12L plus
// distance from 12L to that sign mirrored again.
function upaPada(k: KundaliResult): { signNum: number; signName: string; housesFromAsc: number } {
  const twelfthLord = k.houses[11].lord;
  const twelfthLordP = k.planets.find((p) => p.id === twelfthLord)!;
  const twelfthSignNum = twelfthLordP.rashi.num;
  // 12L's sign count from 12H's sign:
  const twelfthSign = k.houses[11].rashiNum;
  const distance = ((twelfthSignNum - twelfthSign + 12) % 12) + 1;
  // UL sign = distance from twelfthLord's sign, same count
  const ulSignNum = ((twelfthSignNum + distance - 1 - 1) % 12) + 1;
  const housesFromAsc = ((ulSignNum - k.ascendant.rashi.num + 12) % 12) + 1;
  return {
    signNum: ulSignNum,
    signName: RASHIS[ulSignNum - 1].name,
    housesFromAsc,
  };
}

function mangalDoshaStatus(k: KundaliResult): {
  active: boolean;
  fromLagna: boolean;
  fromMoon: boolean;
  fromVenus: boolean;
  cancelled: boolean;
  notes: string[];
} {
  const mars = k.planets.find((p) => p.id === 'MA')!;
  const moon = k.planets.find((p) => p.id === 'MO')!;
  const venus = k.planets.find((p) => p.id === 'VE')!;
  const ascRashi = k.ascendant.rashi.num;
  const moonRashi = moon.rashi.num;
  const venusRashi = venus.rashi.num;
  const doshaHouses = [1, 2, 4, 7, 8, 12];
  const marsSign = mars.rashi.num;
  const fromLagnaHouse = ((marsSign - ascRashi + 12) % 12) + 1;
  const fromMoonHouse = ((marsSign - moonRashi + 12) % 12) + 1;
  const fromVenusHouse = ((marsSign - venusRashi + 12) % 12) + 1;
  const fromLagna = doshaHouses.includes(fromLagnaHouse);
  const fromMoon = doshaHouses.includes(fromMoonHouse);
  const fromVenus = doshaHouses.includes(fromVenusHouse);
  // Cancellations: Mars in own sign (Aries/Scorpio) or exalted (Capricorn);
  // Mars with JU/VE conjunction; Mars aspected by JU.
  const notes: string[] = [];
  let cancelled = false;
  if (mars.ownSign) { cancelled = true; notes.push('Mars in own sign — dosha cancelled.'); }
  if (mars.exalted) { cancelled = true; notes.push('Mars exalted — dosha cancelled.'); }
  const mateConj = k.planets.find((p) => p.house === mars.house && (p.id === 'JU' || p.id === 'VE'));
  if (mateConj) { cancelled = true; notes.push(`Mars conjunct ${mateConj.id} — softened.`); }
  // JU aspect to Mars
  const jup = k.planets.find((p) => p.id === 'JU')!;
  const jupToMars = ((mars.house - jup.house + 12) % 12) + 1;
  if (jupToMars === 5 || jupToMars === 9 || jupToMars === 7) {
    cancelled = true;
    notes.push('Jupiter aspects Mars — dosha mitigated.');
  }
  return {
    active: fromLagna || fromMoon || fromVenus,
    fromLagna, fromMoon, fromVenus, cancelled, notes,
  };
}

// Spouse descriptor from 7H sign and 7H lord placement
function describeSpouse(k: KundaliResult): {
  nature: string[];
  appearance: string[];
  origin: string;
} {
  const seventhSign = k.houses[6].rashiNum;
  const seventhLord = k.houses[6].lord;
  const seventhLordP = k.planets.find((p) => p.id === seventhLord)!;
  const r = RASHIS[seventhSign - 1];

  const nature: string[] = [];
  const appearance: string[] = [];
  switch (r.element) {
    case 'Fire':  nature.push('passionate, driven, temperamental'); appearance.push('athletic, ruddy complexion'); break;
    case 'Earth': nature.push('stable, practical, resource-oriented'); appearance.push('well-built, earthy tones'); break;
    case 'Air':   nature.push('communicative, social, restless'); appearance.push('slender, fair skin'); break;
    case 'Water': nature.push('emotional, sensitive, home-loving'); appearance.push('soft features, watery eyes'); break;
  }
  switch (r.quality) {
    case 'Movable': nature.push('ambitious, initiating'); break;
    case 'Fixed':   nature.push('loyal, stubborn'); break;
    case 'Dual':    nature.push('adaptable, dual-natured'); break;
  }
  // Lord placement hint
  const origin = (() => {
    if (seventhLordP.house === 12) return 'Likely from a distant place or foreign background.';
    if (seventhLordP.house === 9) return 'Likely from a respected lineage / different cultural background.';
    if (seventhLordP.house === 3) return 'Likely from your neighbourhood or through siblings\' network.';
    if (seventhLordP.house === 7) return 'Classical placement — spouse from your peer group.';
    if (seventhLordP.house === 1) return 'Spouse resembles you; early acquaintance or your own social circle.';
    return 'Origin indicated by 7th lord\'s house context.';
  })();

  return { nature, appearance, origin };
}

// Timing: list Vimshottari mahadashas of 7L, UL-lord, Venus, Jupiter (JU for
// women as "husband karaka" is classical; we return both and let the client show)
function marriageTimings(k: KundaliResult): {
  mahadasha: string;
  lord: PlanetId;
  startISO: string;
  endISO: string;
  why: string;
}[] {
  const mahas = computeMahadashas(k, 'vimshottari');
  const seventhLord = k.houses[6].lord;
  const upa = upaPada(k);
  const ulSignNum = upa.signNum;
  const ulLord = RASHIS[ulSignNum - 1].lord;
  const windows: ReturnType<typeof marriageTimings> = [];
  const interesting: Record<PlanetId, string> = {
    [seventhLord]: '7th lord — primary marriage ruler',
    [ulLord]: 'UL-lord — classical spouse indicator',
    VE: 'Venus — spouse karaka',
    JU: 'Jupiter — husband karaka (classical, for women)',
  };
  for (const m of mahas) {
    if (m.lord in interesting) {
      windows.push({
        mahadasha: `${m.lord}`,
        lord: m.lord as PlanetId,
        startISO: m.start.slice(0, 10),
        endISO: m.end.slice(0, 10),
        why: interesting[m.lord as PlanetId],
      });
    }
  }
  return windows;
}

export interface MaritalDeepReport {
  seventhHouse: {
    lord: PlanetId;
    lordState: 'strong' | 'neutral' | 'weak';
    lordHouse: number;
    sign: { num: number; name: string; element: string; quality: string };
    occupants: PlanetId[];
    aspects: PlanetId[];
    benefics: PlanetId[];
    malefics: PlanetId[];
  };
  navamsha: {
    ascRashi: number;
    ascRashiName: string;
    seventhSign: number;
    seventhSignName: string;
    seventhLord: PlanetId;
    seventhLordHouse: number;       // in D9
    venusVargottama: boolean;
  };
  upaPada: {
    signNum: number;
    signName: string;
    housesFromAsc: number;
    lord: PlanetId;
    benefics: PlanetId[];
    malefics: PlanetId[];
  };
  karakas: { spouseKaraka: PlanetId; darakaraka: PlanetId };   // VE (or JU) + DK
  mangalDosha: ReturnType<typeof mangalDoshaStatus>;
  spouse: ReturnType<typeof describeSpouse>;
  marriageTimings: ReturnType<typeof marriageTimings>;
  score: number;                    // 0..100
  scoreLabel: 'strong' | 'favourable' | 'mixed' | 'challenged';
  factors: { kind: 'positive' | 'negative'; text: string; weight: number }[];
}

export function computeMaritalDeep(k: KundaliResult, _locale: _MaritalLocale = 'en'): MaritalDeepReport {
  const factors: MaritalDeepReport['factors'] = [];

  // 7th house analysis
  const seventhLord = k.houses[6].lord;
  const seventhLordP = k.planets.find((p) => p.id === seventhLord)!;
  const occupants = k.planets.filter((p) => p.house === 7).map((x) => x.id);
  const aspects = planetsAspectingHouse(k, 7).filter((x) => !occupants.includes(x));
  const benefOcc = occupants.filter((p) => BENEFICS.includes(p));
  const malefOcc = occupants.filter((p) => MALEFICS.includes(p));
  const lordState: 'strong' | 'neutral' | 'weak' =
    seventhLordP.exalted || seventhLordP.ownSign ? 'strong' :
    seventhLordP.debilitated || seventhLordP.combust || [6,8,12].includes(seventhLordP.house) ? 'weak' : 'neutral';
  if (lordState === 'strong') factors.push({ kind: 'positive', text: `7th lord ${seventhLord} is ${seventhLordP.exalted ? 'exalted' : 'in own sign'}.`, weight: 10 });
  if (lordState === 'weak')   factors.push({ kind: 'negative', text: `7th lord ${seventhLord} is ${seventhLordP.debilitated ? 'debilitated' : seventhLordP.combust ? 'combust' : 'in dusthana'}.`, weight: -10 });
  if (benefOcc.length) factors.push({ kind: 'positive', text: `Benefics in 7th: ${benefOcc.join(', ')}.`, weight: 6 * benefOcc.length });
  if (malefOcc.length) factors.push({ kind: 'negative', text: `Malefics in 7th: ${malefOcc.join(', ')}.`, weight: -6 * malefOcc.length });

  const r7 = RASHIS[k.houses[6].rashiNum - 1];

  // Navamsha (D9)
  const d9 = buildDivisional(k, 'D9');
  const d9Seventh = ((d9.ascendantRashi - 1 + 6) % 12) + 1;
  const d9SeventhLord = RASHIS[d9Seventh - 1].lord;
  const d9SeventhLordPos = d9.positions.find((p) => p.id === d9SeventhLord)!;
  const venusInD9 = d9.positions.find((p) => p.id === 'VE')!;
  const venusVargottama = venusInD9.vargottama;
  if (venusVargottama) factors.push({ kind: 'positive', text: 'Venus vargottama (D9 = D1) — strong spouse indicator.', weight: 8 });

  // UL
  const ul = upaPada(k);
  const ulOccupants = k.planets.filter((p) =>
    ((p.rashi.num - 1 - (ul.signNum - 1) + 12) % 12) === 0,
  ).map((p) => p.id);
  const ulBenefics = ulOccupants.filter((p) => BENEFICS.includes(p));
  const ulMalefics = ulOccupants.filter((p) => MALEFICS.includes(p));
  const ulLord = RASHIS[ul.signNum - 1].lord;
  if (ulBenefics.length) factors.push({ kind: 'positive', text: `Benefics in UL: ${ulBenefics.join(', ')}.`, weight: 5 });
  if (ulMalefics.length) factors.push({ kind: 'negative', text: `Malefics in UL: ${ulMalefics.join(', ')}.`, weight: -5 });

  // Jaimini karakas
  const karakas = calculateKarakas(k);
  const dk = karakas.find((kk) => kk.karaka === 'DK')!;
  const spouseKaraka: PlanetId = 'VE';  // classical for both, but UI can show JU for women

  // Mangal dosha
  const mangal = mangalDoshaStatus(k);
  if (mangal.active && !mangal.cancelled) factors.push({ kind: 'negative', text: `Mangal dosha active (from ${[mangal.fromLagna && 'Lagna', mangal.fromMoon && 'Moon', mangal.fromVenus && 'Venus'].filter(Boolean).join(' + ')}).`, weight: -8 });
  if (mangal.active && mangal.cancelled) factors.push({ kind: 'positive', text: 'Mangal dosha present but cancelled.', weight: 3 });

  // Venus health
  const venus = k.planets.find((p) => p.id === 'VE')!;
  if (venus.exalted) factors.push({ kind: 'positive', text: 'Venus exalted.', weight: 6 });
  if (venus.debilitated) factors.push({ kind: 'negative', text: 'Venus debilitated.', weight: -6 });
  if (venus.combust) factors.push({ kind: 'negative', text: 'Venus combust.', weight: -5 });
  if ([6,8,12].includes(venus.house)) factors.push({ kind: 'negative', text: `Venus in ${venus.house}th (dusthana).`, weight: -4 });

  // Spouse descriptor
  const spouse = describeSpouse(k);

  // Timings
  const timings = marriageTimings(k);

  // Score composite
  const baseScore = 60 + factors.reduce((s, f) => s + f.weight, 0);
  const score = Math.max(0, Math.min(100, Math.round(baseScore)));
  const scoreLabel: MaritalDeepReport['scoreLabel'] =
    score >= 75 ? 'strong' : score >= 55 ? 'favourable' : score >= 35 ? 'mixed' : 'challenged';

  return {
    seventhHouse: {
      lord: seventhLord,
      lordState,
      lordHouse: seventhLordP.house,
      sign: { num: k.houses[6].rashiNum, name: r7.name, element: r7.element, quality: r7.quality },
      occupants,
      aspects,
      benefics: benefOcc,
      malefics: malefOcc,
    },
    navamsha: {
      ascRashi: d9.ascendantRashi,
      ascRashiName: d9.ascendantRashiName,
      seventhSign: d9Seventh,
      seventhSignName: RASHIS[d9Seventh - 1].name,
      seventhLord: d9SeventhLord,
      seventhLordHouse: d9SeventhLordPos.house,
      venusVargottama,
    },
    upaPada: {
      ...ul,
      lord: ulLord,
      benefics: ulBenefics,
      malefics: ulMalefics,
    },
    karakas: { spouseKaraka, darakaraka: dk.planet },
    mangalDosha: mangal,
    spouse,
    marriageTimings: timings,
    score,
    scoreLabel,
    factors,
  };
}
