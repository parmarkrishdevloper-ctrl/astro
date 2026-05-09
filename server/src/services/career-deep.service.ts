// Phase 13 — Career astrology (deep).
//
// Goes beyond the basic life-areas career module to include:
//   • 10th house stack — occupants, aspects, lord
//   • Amatyakaraka (AmK) — Jaimini career karaka
//   • Dashamsa (D10) — profession-specific chart
//   • 10th from Moon, Sun, Lagna — triple analysis
//   • Career fields by dominant planet + D10 ascendant
//   • Direction best for office / workplace
//   • Timing windows via 10L / AmK mahadashas

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { calculateKarakas } from './jaimini.service';
import { buildDivisional } from './divisional.service';
import { computeMahadashas } from './dasha.service';
import { calculateShadbala } from './strength.service';
import { Locale } from '../i18n';

const MALEFICS: PlanetId[] = ['SA', 'MA', 'RA', 'KE', 'SU'];
const BENEFICS: PlanetId[] = ['JU', 'VE', 'ME', 'MO'];

const CAREER_FIELDS: Record<PlanetId, string[]> = {
  SU: ['Government service', 'Administration', 'Medicine (cardiology)', 'Politics', 'Leadership roles'],
  MO: ['Public relations', 'Hospitality', 'Marine / liquids', 'Nursing', 'Food industry', 'Real estate (residential)'],
  MA: ['Military', 'Surgery', 'Engineering', 'Sports', 'Real estate (land)', 'Police / security'],
  ME: ['Commerce', 'Writing / journalism', 'Accounting', 'IT / software', 'Mathematics', 'Teaching', 'Law'],
  JU: ['Education / teaching', 'Law', 'Finance (wealth advisory)', 'Priesthood / clergy', 'Counselling'],
  VE: ['Arts', 'Music', 'Fashion', 'Beauty / cosmetics', 'Entertainment', 'Luxury goods', 'Transport (vehicles)'],
  SA: ['Civil services (long tenure)', 'Mining', 'Iron / steel', 'Agriculture (manual)', 'Research (long-term)'],
  RA: ['Foreign affairs', 'IT innovation', 'Media / film', 'Photography', 'Mass communications', 'Aviation'],
  KE: ['Occult / astrology', 'Spiritual healing', 'Research (esoteric)', 'Surgery (neuro)', 'Pharma'],
};

const PLANET_DIRECTION: Record<PlanetId, string> = {
  SU: 'East',    MO: 'North-West', MA: 'South',      ME: 'North',
  JU: 'North-East', VE: 'South-East', SA: 'West',    RA: 'South-West', KE: 'South-West',
};

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

function houseFromReference(
  k: KundaliResult,
  reference: 'lagna' | 'moon' | 'sun',
  targetHouse: number,
): { occupants: PlanetId[]; aspects: PlanetId[]; sign: number; signName: string } {
  let refSign: number;
  if (reference === 'lagna') refSign = k.ascendant.rashi.num;
  else if (reference === 'moon') refSign = k.planets.find((p) => p.id === 'MO')!.rashi.num;
  else refSign = k.planets.find((p) => p.id === 'SU')!.rashi.num;
  const sign = ((refSign - 1 + (targetHouse - 1)) % 12) + 1;
  const occupants = k.planets.filter((p) => p.rashi.num === sign).map((p) => p.id);
  // aspects computed relative to the natal houses (approximation):
  const natalHouse = ((sign - k.ascendant.rashi.num + 12) % 12) + 1;
  const aspects = planetsAspectingHouse(k, natalHouse).filter((x) => !occupants.includes(x));
  return { occupants, aspects, sign, signName: RASHIS[sign - 1].name };
}

export interface CareerDeepReport {
  tenthHouse: {
    lord: PlanetId;
    lordHouse: number;
    lordState: 'strong' | 'neutral' | 'weak';
    sign: { num: number; name: string };
    occupants: PlanetId[];
    aspects: PlanetId[];
    benefics: PlanetId[];
    malefics: PlanetId[];
  };
  amatyakaraka: {
    planet: PlanetId;
    degInRashi: number;
    strength: 'strong' | 'neutral' | 'weak';
  };
  strongestGraha: {
    planet: PlanetId;
    rupas: number;
    rank: 1 | 2 | 3 | 4 | 5 | 6 | 7;  // among 7 Parashari planets
  };
  dashamsa: {
    ascRashi: number;
    ascRashiName: string;
    tenthSign: number;
    tenthSignName: string;
    tenthLord: PlanetId;
    tenthLordHouseInD10: number;
    vargottamaPlanets: PlanetId[];
  };
  triple: {
    fromLagna: ReturnType<typeof houseFromReference>;
    fromMoon: ReturnType<typeof houseFromReference>;
    fromSun: ReturnType<typeof houseFromReference>;
  };
  careerFields: string[];                 // merged, dedup
  workplaceDirection: string;
  deskFacing: string;
  careerTimings: { mahadasha: string; lord: PlanetId; startISO: string; endISO: string; why: string }[];
  score: number;                          // 0..100
  scoreLabel: 'high-achievement' | 'strong' | 'moderate' | 'struggle';
  factors: { kind: 'positive' | 'negative'; text: string; weight: number }[];
}

function opposite(dir: string): string {
  const m: Record<string, string> = {
    'East':'West', 'West':'East', 'North':'South', 'South':'North',
    'North-East':'South-West', 'South-West':'North-East',
    'North-West':'South-East', 'South-East':'North-West',
  };
  return m[dir] || 'North';
}

export function computeCareerDeep(k: KundaliResult, _locale: Locale = 'en'): CareerDeepReport {
  const factors: CareerDeepReport['factors'] = [];

  // 10th house
  const tenthLord = k.houses[9].lord;
  const tenthLordP = k.planets.find((p) => p.id === tenthLord)!;
  const occupants = k.planets.filter((p) => p.house === 10).map((p) => p.id);
  const aspects = planetsAspectingHouse(k, 10).filter((x) => !occupants.includes(x));
  const benefOcc = occupants.filter((p) => BENEFICS.includes(p));
  const malefOcc = occupants.filter((p) => MALEFICS.includes(p));
  // Note: malefics in 10th are actually good for Vedic career astrology (dig-bala),
  // but benefics give softer, refined work. We'll mark both positive with different weights.
  const lordState: 'strong' | 'neutral' | 'weak' =
    tenthLordP.exalted || tenthLordP.ownSign ? 'strong' :
    tenthLordP.debilitated || tenthLordP.combust || [6,8,12].includes(tenthLordP.house) ? 'weak' : 'neutral';
  if (lordState === 'strong') factors.push({ kind: 'positive', text: `10th lord ${tenthLord} is ${tenthLordP.exalted ? 'exalted' : 'own sign'}.`, weight: 12 });
  if (lordState === 'weak')   factors.push({ kind: 'negative', text: `10th lord ${tenthLord} is ${tenthLordP.debilitated ? 'debilitated' : tenthLordP.combust ? 'combust' : 'in dusthana'}.`, weight: -10 });
  if (malefOcc.length) factors.push({ kind: 'positive', text: `Malefics in 10th (${malefOcc.join(', ')}) — drive, digbala.`, weight: 4 * malefOcc.length });
  if (benefOcc.length) factors.push({ kind: 'positive', text: `Benefics in 10th (${benefOcc.join(', ')}) — ethical, favoured.`, weight: 3 * benefOcc.length });

  // Amatyakaraka
  const karakas = calculateKarakas(k);
  const amk = karakas.find((x) => x.karaka === 'AmK')!;
  const amkP = k.planets.find((p) => p.id === amk.planet)!;
  const amkStrength: 'strong' | 'neutral' | 'weak' =
    amkP.exalted || amkP.ownSign ? 'strong' :
    amkP.debilitated || amkP.combust ? 'weak' : 'neutral';
  if (amkStrength === 'strong') factors.push({ kind: 'positive', text: `Amatyakaraka ${amk.planet} is strong.`, weight: 8 });
  if (amkStrength === 'weak')   factors.push({ kind: 'negative', text: `Amatyakaraka ${amk.planet} is weak.`, weight: -6 });

  // Shadbala — strongest graha (excluding nodes)
  const sb = calculateShadbala(k);
  const sortedByRupas = sb.planets.slice().sort((a, b) => b.totalRupas - a.totalRupas);
  const strongest = sortedByRupas[0];
  const rankIdx = sortedByRupas.findIndex((p) => p.planet === tenthLord);
  if (rankIdx >= 0 && rankIdx <= 2) factors.push({ kind: 'positive', text: `10th lord ${tenthLord} is among top-3 by Shadbala.`, weight: 6 });

  // D10 analysis
  const d10 = buildDivisional(k, 'D10');
  const d10TenthSign = ((d10.ascendantRashi - 1 + 9) % 12) + 1;
  const d10TenthLord = RASHIS[d10TenthSign - 1].lord;
  const d10TenthLordPos = d10.positions.find((p) => p.id === d10TenthLord)!;
  const vargottamaPlanets = d10.positions.filter((p) => p.vargottama).map((p) => p.id);
  if (vargottamaPlanets.includes(tenthLord as PlanetId)) factors.push({ kind: 'positive', text: `10th lord vargottama in D10 — consistent career direction.`, weight: 7 });

  // Triple analysis
  const triple = {
    fromLagna: houseFromReference(k, 'lagna', 10),
    fromMoon:  houseFromReference(k, 'moon', 10),
    fromSun:   houseFromReference(k, 'sun', 10),
  };

  // Career fields: dominant planet + AmK + 10th lord's fields merged
  const primaryPlanets: PlanetId[] = [strongest.planet as PlanetId, amk.planet as PlanetId, tenthLord];
  const fieldsSet = new Set<string>();
  for (const pl of primaryPlanets) {
    (CAREER_FIELDS[pl] || []).forEach((f) => fieldsSet.add(f));
  }
  const careerFields = [...fieldsSet].slice(0, 12);

  // Workplace direction: 10L direction
  const workplaceDirection = PLANET_DIRECTION[tenthLord];
  const deskFacing = opposite(PLANET_DIRECTION[strongest.planet as PlanetId]);

  // Career timings
  const mahas = computeMahadashas(k, 'vimshottari');
  const interestingLords = new Set<PlanetId>([tenthLord, amk.planet as PlanetId, strongest.planet as PlanetId]);
  const whyMap: Record<PlanetId, string> = {} as any;
  whyMap[tenthLord] = '10th lord dasha — core career period';
  whyMap[amk.planet as PlanetId] = (whyMap[amk.planet as PlanetId] ? `${whyMap[amk.planet as PlanetId]}; ` : '') + 'Amatyakaraka dasha';
  whyMap[strongest.planet as PlanetId] = (whyMap[strongest.planet as PlanetId] ? `${whyMap[strongest.planet as PlanetId]}; ` : '') + 'Strongest-graha dasha';
  const careerTimings: CareerDeepReport['careerTimings'] = [];
  for (const m of mahas) {
    if (interestingLords.has(m.lord as PlanetId)) {
      careerTimings.push({
        mahadasha: m.lord, lord: m.lord as PlanetId,
        startISO: m.start.slice(0, 10),
        endISO: m.end.slice(0, 10),
        why: whyMap[m.lord as PlanetId],
      });
    }
  }

  const base = 60 + factors.reduce((s, f) => s + f.weight, 0);
  const score = Math.max(0, Math.min(100, Math.round(base)));
  const scoreLabel: CareerDeepReport['scoreLabel'] =
    score >= 80 ? 'high-achievement' : score >= 60 ? 'strong' : score >= 40 ? 'moderate' : 'struggle';

  return {
    tenthHouse: {
      lord: tenthLord,
      lordHouse: tenthLordP.house,
      lordState,
      sign: { num: k.houses[9].rashiNum, name: RASHIS[k.houses[9].rashiNum - 1].name },
      occupants, aspects,
      benefics: benefOcc,
      malefics: malefOcc,
    },
    amatyakaraka: { planet: amk.planet as PlanetId, degInRashi: amk.degInRashi, strength: amkStrength },
    strongestGraha: {
      planet: strongest.planet as PlanetId,
      rupas: +strongest.totalRupas.toFixed(2),
      rank: 1,
    },
    dashamsa: {
      ascRashi: d10.ascendantRashi,
      ascRashiName: d10.ascendantRashiName,
      tenthSign: d10TenthSign,
      tenthSignName: RASHIS[d10TenthSign - 1].name,
      tenthLord: d10TenthLord,
      tenthLordHouseInD10: d10TenthLordPos.house,
      vargottamaPlanets,
    },
    triple,
    careerFields,
    workplaceDirection,
    deskFacing,
    careerTimings,
    score,
    scoreLabel,
    factors,
  };
}
