// Phase 13 — Financial astrology (dhana).
//
// Analyses the wealth quartet (2, 11, 9, 5) plus classical dhana yogas:
//   • 2nd house — earned wealth, family wealth, speech (influences commerce)
//   • 11th house — gains (labha)
//   • 9th house — fortune (bhagya)
//   • 5th house — speculation, investment, intellect
//   • Dhana yogas — 2L/5L/9L/11L mutual connections
//   • Lakshmi yoga, Kubera yoga, Chandra-Mangal yoga
//   • Maraka periods (2L / 7L dashas) — caution windows
//   • Timing windows via dhana-lords' dashas

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { computeMahadashas } from './dasha.service';
import { Locale as _FinLocale } from '../i18n';

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

function lordState(k: KundaliResult, lord: PlanetId): 'strong' | 'neutral' | 'weak' {
  const p = k.planets.find((x) => x.id === lord)!;
  if (p.exalted || p.ownSign) return 'strong';
  if (p.debilitated || p.combust || [6,8,12].includes(p.house)) return 'weak';
  return 'neutral';
}

function hasConnection(k: KundaliResult, a: PlanetId, b: PlanetId): {
  connected: boolean; mode: 'conjunction' | 'mutual-aspect' | 'exchange' | 'none';
} {
  const pa = k.planets.find((p) => p.id === a)!;
  const pb = k.planets.find((p) => p.id === b)!;
  if (pa.house === pb.house) return { connected: true, mode: 'conjunction' };
  const distAtoB = ((pb.house - pa.house + 12) % 12) + 1;
  const distBtoA = ((pa.house - pb.house + 12) % 12) + 1;
  if (distAtoB === 7 && distBtoA === 7) return { connected: true, mode: 'mutual-aspect' };
  // Exchange (parivartana) — check if A is in B's own-sign and vice versa
  const aSign = pa.rashi.num;
  const bSign = pb.rashi.num;
  const aIsInBsSign = RASHIS[aSign - 1].lord === b;
  const bIsInAsSign = RASHIS[bSign - 1].lord === a;
  if (aIsInBsSign && bIsInAsSign) return { connected: true, mode: 'exchange' };
  return { connected: false, mode: 'none' };
}

export interface DhanaYogaResult {
  yoga: string;
  active: boolean;
  strength: 'strong' | 'moderate' | 'weak' | 'absent';
  explanation: string;
}

function detectDhanaYogas(k: KundaliResult): DhanaYogaResult[] {
  const yogas: DhanaYogaResult[] = [];
  const l2 = k.houses[1].lord;
  const l5 = k.houses[4].lord;
  const l9 = k.houses[8].lord;
  const l11 = k.houses[10].lord;

  // Classical dhana yogas: 2L–11L, 2L–5L, 2L–9L, 5L–11L, 5L–9L, 9L–11L
  const pairs: [PlanetId, PlanetId, string][] = [
    [l2, l11, '2L–11L (earning × gains)'],
    [l2, l5,  '2L–5L (earning × investment)'],
    [l2, l9,  '2L–9L (earning × fortune)'],
    [l5, l11, '5L–11L (investment × gains)'],
    [l5, l9,  '5L–9L (investment × fortune)'],
    [l9, l11, '9L–11L (fortune × gains) — Lakshmi-adjacent'],
  ];
  for (const [a, b, label] of pairs) {
    if (a === b) {
      yogas.push({ yoga: label, active: true, strength: 'strong', explanation: `Same planet (${a}) rules both houses — automatic fusion.` });
      continue;
    }
    const c = hasConnection(k, a, b);
    if (c.connected) {
      const strength: DhanaYogaResult['strength'] =
        c.mode === 'exchange' ? 'strong' :
        c.mode === 'mutual-aspect' ? 'moderate' :
        c.mode === 'conjunction' ? 'strong' : 'weak';
      yogas.push({ yoga: label, active: true, strength, explanation: `${a} and ${b} in ${c.mode}.` });
    } else {
      yogas.push({ yoga: label, active: false, strength: 'absent', explanation: `${a} and ${b} unconnected.` });
    }
  }

  // Lakshmi yoga — 9L in own/exalted + Jupiter/Venus strong
  const lord9 = k.houses[8].lord;
  const l9P = k.planets.find((p) => p.id === lord9)!;
  const jup = k.planets.find((p) => p.id === 'JU')!;
  const ven = k.planets.find((p) => p.id === 'VE')!;
  const lakshmiActive = (l9P.exalted || l9P.ownSign) && (jup.exalted || jup.ownSign || ven.exalted || ven.ownSign);
  yogas.push({
    yoga: 'Lakshmi yoga',
    active: lakshmiActive,
    strength: lakshmiActive ? 'strong' : 'absent',
    explanation: lakshmiActive
      ? `9L ${lord9} exalted/own-sign, and ${jup.exalted || jup.ownSign ? 'Jupiter' : 'Venus'} strong.`
      : '9L not exalted/own-sign or Jupiter/Venus not strong.',
  });

  // Chandra-Mangal yoga — Moon and Mars conjunct or in mutual aspect
  const cm = hasConnection(k, 'MO', 'MA');
  yogas.push({
    yoga: 'Chandra-Mangal yoga',
    active: cm.connected,
    strength: cm.connected ? (cm.mode === 'conjunction' ? 'strong' : 'moderate') : 'absent',
    explanation: cm.connected ? `Moon and Mars in ${cm.mode}.` : 'No Moon–Mars connection.',
  });

  // Kubera yoga (simplified) — 2L, 11L strong + JU aspecting 2nd house
  const l2P = k.planets.find((p) => p.id === l2)!;
  const l11P = k.planets.find((p) => p.id === l11)!;
  const jupAspectingSecond = ((2 - jup.house + 12) % 12) + 1;
  const jupAspects2 = jupAspectingSecond === 5 || jupAspectingSecond === 7 || jupAspectingSecond === 9;
  const kuberaActive = (lordState(k, l2) !== 'weak') && (lordState(k, l11) !== 'weak') && jupAspects2;
  yogas.push({
    yoga: 'Kubera yoga',
    active: kuberaActive,
    strength: kuberaActive ? 'strong' : 'absent',
    explanation: kuberaActive
      ? `2L (${l2}) and 11L (${l11}) not weak; Jupiter aspects 2nd house.`
      : 'Requirements not met.',
  });

  return yogas;
}

// Maraka (death-inflicting) — classically 2L and 7L dashas after age 36,
// also MA/KE dasha timings post middle age. We just flag maraka lords.
function marakaTimings(k: KundaliResult): {
  mahadasha: string;
  lord: PlanetId;
  startISO: string;
  endISO: string;
  why: string;
}[] {
  const mahas = computeMahadashas(k, 'vimshottari');
  const l2 = k.houses[1].lord;
  const l7 = k.houses[6].lord;
  const marakas = new Set<PlanetId>([l2, l7]);
  const whyMap: Record<PlanetId, string> = {} as any;
  whyMap[l2] = '2L — maraka (wealth-loss window)';
  whyMap[l7] = (whyMap[l7] ? whyMap[l7] + '; ' : '') + '7L — maraka';
  const out: ReturnType<typeof marakaTimings> = [];
  for (const m of mahas) {
    if (marakas.has(m.lord as PlanetId)) {
      out.push({
        mahadasha: m.lord, lord: m.lord as PlanetId,
        startISO: m.start.slice(0, 10),
        endISO: m.end.slice(0, 10),
        why: whyMap[m.lord as PlanetId],
      });
    }
  }
  return out;
}

function dhanaTimings(k: KundaliResult): {
  mahadasha: string;
  lord: PlanetId;
  startISO: string;
  endISO: string;
  why: string;
}[] {
  const mahas = computeMahadashas(k, 'vimshottari');
  const l2 = k.houses[1].lord;
  const l9 = k.houses[8].lord;
  const l11 = k.houses[10].lord;
  const l5 = k.houses[4].lord;
  const interesting = new Set<PlanetId>([l2, l5, l9, l11]);
  const whyMap: Record<PlanetId, string> = {} as any;
  const addWhy = (p: PlanetId, s: string) => { whyMap[p] = whyMap[p] ? `${whyMap[p]}; ${s}` : s; };
  addWhy(l2, '2L — earned income');
  addWhy(l5, '5L — investment / speculation');
  addWhy(l9, '9L — fortune / mentorship');
  addWhy(l11, '11L — gains / yield');
  const out: ReturnType<typeof dhanaTimings> = [];
  for (const m of mahas) {
    if (interesting.has(m.lord as PlanetId)) {
      out.push({
        mahadasha: m.lord, lord: m.lord as PlanetId,
        startISO: m.start.slice(0, 10),
        endISO: m.end.slice(0, 10),
        why: whyMap[m.lord as PlanetId],
      });
    }
  }
  return out;
}

export interface FinancialReport {
  wealthHouses: {
    second:    { lord: PlanetId; lordState: 'strong'|'neutral'|'weak'; occupants: PlanetId[]; aspects: PlanetId[] };
    eleventh:  { lord: PlanetId; lordState: 'strong'|'neutral'|'weak'; occupants: PlanetId[]; aspects: PlanetId[] };
    ninth:     { lord: PlanetId; lordState: 'strong'|'neutral'|'weak'; occupants: PlanetId[]; aspects: PlanetId[] };
    fifth:     { lord: PlanetId; lordState: 'strong'|'neutral'|'weak'; occupants: PlanetId[]; aspects: PlanetId[] };
  };
  dhanaYogas: DhanaYogaResult[];
  dhanaTimings: ReturnType<typeof dhanaTimings>;
  marakaTimings: ReturnType<typeof marakaTimings>;
  incomeSources: string[];           // per lord + natural karaka
  liquidityNote: string;             // Moon-Mars, speculation-note
  score: number;                     // 0..100 (wealth velocity)
  scoreLabel: 'exceptional' | 'prosperous' | 'moderate' | 'slow';
  factors: { kind: 'positive' | 'negative'; text: string; weight: number }[];
}

const SOURCE_BY_LORD: Record<PlanetId, string> = {
  SU: 'Government salary / authority income',
  MO: 'Public / hospitality / liquids / real-estate income',
  MA: 'Land / property / engineering / action-based income',
  ME: 'Commerce / trade / communications / writing / software',
  JU: 'Advisory / teaching / finance / law / wealth-management',
  VE: 'Arts / fashion / vehicles / luxury / entertainment',
  SA: 'Long-term service / manual labour / mining / agriculture',
  RA: 'Foreign / technology / speculation / media',
  KE: 'Occult / pharma / research / short sudden gains',
};

export function computeFinancial(k: KundaliResult, _locale: _FinLocale = 'en'): FinancialReport {
  const factors: FinancialReport['factors'] = [];

  const buildHouse = (h: number) => {
    const lord = k.houses[h - 1].lord;
    const state = lordState(k, lord);
    const occupants = k.planets.filter((p) => p.house === h).map((p) => p.id);
    const aspects = planetsAspectingHouse(k, h).filter((x) => !occupants.includes(x));
    return { lord, lordState: state, occupants, aspects };
  };

  const wealth = {
    second:   buildHouse(2),
    eleventh: buildHouse(11),
    ninth:    buildHouse(9),
    fifth:    buildHouse(5),
  };

  for (const [key, h] of [['2nd', wealth.second], ['11th', wealth.eleventh], ['9th', wealth.ninth], ['5th', wealth.fifth]] as const) {
    if (h.lordState === 'strong') factors.push({ kind: 'positive', text: `${key} lord ${h.lord} is strong.`, weight: 7 });
    if (h.lordState === 'weak')   factors.push({ kind: 'negative', text: `${key} lord ${h.lord} is weak.`, weight: -6 });
    const benefOcc = h.occupants.filter((p) => BENEFICS.includes(p));
    const malefOcc = h.occupants.filter((p) => MALEFICS.includes(p));
    if (benefOcc.length) factors.push({ kind: 'positive', text: `Benefics in ${key} (${benefOcc.join(', ')}).`, weight: 4 });
    if (malefOcc.length) factors.push({ kind: 'negative', text: `Malefics in ${key} (${malefOcc.join(', ')}).`, weight: -3 });
  }

  const yogas = detectDhanaYogas(k);
  for (const y of yogas) {
    if (y.active) factors.push({
      kind: 'positive', text: `${y.yoga} active (${y.strength}).`,
      weight: y.strength === 'strong' ? 8 : y.strength === 'moderate' ? 4 : 2,
    });
  }

  // Liquidity note (Chandra-Mangal or Moon in a water sign)
  const moon = k.planets.find((p) => p.id === 'MO')!;
  const mars = k.planets.find((p) => p.id === 'MA')!;
  let liquidityNote = 'Average cashflow — wealth accumulates steadily via routine channels.';
  const chandraMangal = yogas.find((y) => y.yoga === 'Chandra-Mangal yoga')!;
  if (chandraMangal.active) liquidityNote = 'Chandra-Mangal yoga active — strong commercial drive; expect frequent cash conversion cycles.';
  if (moon.rashi.num === 4 || moon.rashi.num === 8 || moon.rashi.num === 12) {
    liquidityNote += ' Moon in water sign — wealth flows in emotional waves; retain liquid savings.';
  }

  // Income sources — from 2L, 11L, 9L
  const sources = new Set<string>();
  for (const pid of [wealth.second.lord, wealth.eleventh.lord, wealth.ninth.lord]) {
    sources.add(SOURCE_BY_LORD[pid]);
  }
  // Include strongest dhana-lord's natural karaka if distinct
  if (yogas.some((y) => y.yoga.startsWith('2L–11L') && y.active)) {
    sources.add('Steady monthly income with matching gains (recurring revenue).');
  }
  if (yogas.some((y) => y.yoga.startsWith('5L–9L') && y.active)) {
    sources.add('Investments and speculation blessed by fortune (equities, long-term calls).');
  }

  const base = 55 + factors.reduce((s, f) => s + f.weight, 0);
  const score = Math.max(0, Math.min(100, Math.round(base)));
  const scoreLabel: FinancialReport['scoreLabel'] =
    score >= 80 ? 'exceptional' : score >= 60 ? 'prosperous' : score >= 40 ? 'moderate' : 'slow';

  return {
    wealthHouses: wealth,
    dhanaYogas: yogas,
    dhanaTimings: dhanaTimings(k),
    marakaTimings: marakaTimings(k),
    incomeSources: [...sources],
    liquidityNote,
    score,
    scoreLabel,
    factors,
  };
}
