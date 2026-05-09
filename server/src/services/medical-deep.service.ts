// Phase 13 — Medical astrology (deep).
//
// Extends the basic life-areas medical module. Computes:
//   • Per-body-system vulnerability from sign/planet rulerships and afflictions
//   • Per-planet disease indicators (what each graha threatens when afflicted)
//   • Drekkana body-part mapping (classical)
//   • Dusthana-strength (6/8/12) summary with period warnings
//   • Overall arogya-bhava (health bhava) score

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { KundaliResult, PlanetPosition } from './kundali.service';
import { Locale as _MedLocale } from '../i18n';

// Rashi → body part (Kalapurusha — the cosmic body model)
// Aries=head, Taurus=face/neck, Gemini=arms/lungs, Cancer=chest/stomach,
// Leo=heart/upper-back, Virgo=intestines, Libra=kidneys/lower-back,
// Scorpio=genitals, Sagittarius=hips/thighs, Capricorn=knees, Aquarius=calves,
// Pisces=feet.
export const RASHI_BODY_PART: Record<number, string> = {
  1:  'Head, brain, skull',
  2:  'Face, neck, throat, vocal cords',
  3:  'Arms, hands, lungs, shoulders, upper ribs',
  4:  'Chest, breasts, stomach, oesophagus',
  5:  'Heart, upper back, spine (thoracic)',
  6:  'Intestines, abdomen, bowel, pancreas',
  7:  'Kidneys, lower back, lumbar spine',
  8:  'Genitals, bladder, rectum, reproductive organs',
  9:  'Hips, thighs, sciatic nerve, liver',
  10: 'Knees, joints, skin, skeletal structure',
  11: 'Calves, ankles, circulation, nervous system',
  12: 'Feet, toes, lymphatic system',
};

// Planet → body systems / functions
export const PLANET_BODY: Record<PlanetId, string[]> = {
  SU: ['Heart', 'Spine (marrow)', 'Right eye (men)', 'Vitality (ojas)', 'Circulatory system'],
  MO: ['Stomach', 'Breasts', 'Left eye (men)', 'Body fluids', 'Lymph', 'Mind / emotions'],
  MA: ['Blood', 'Muscles', 'Bone-marrow', 'Energy (pitta)', 'Reproductive heat'],
  ME: ['Nervous system', 'Skin', 'Speech organs', 'Respiratory (shared)', 'Memory'],
  JU: ['Liver', 'Fat metabolism', 'Pancreas', 'Arterial system', 'Ears (hearing)'],
  VE: ['Kidneys', 'Reproductive system', 'Skin (beauty)', 'Hormones (oestrogen)', 'Eyes (beauty)'],
  SA: ['Bones', 'Teeth', 'Knees', 'Nerves (degenerative)', 'Chronic inflammation', 'Hair'],
  RA: ['Mysterious/undiagnosed illness', 'Skin allergies', 'Poisoning', 'Anxiety', 'Phobias'],
  KE: ['Immune system', 'Parasitic/viral infection', 'Nerve disorders', 'Scars', 'Moksha-bhava'],
};

// Diseases classically linked to each planet when afflicted
export const PLANET_DISEASES: Record<PlanetId, string[]> = {
  SU: ['Heart disease', 'Spinal issues', 'Bone fever', 'Blood pressure', 'Eye strain'],
  MO: ['Anaemia', 'Depression', 'Insomnia', 'Menstrual disorders', 'Pulmonary congestion', 'Water-retention'],
  MA: ['Inflammation', 'Accidents / surgery', 'Blood disorders', 'Ulcers', 'Fever', 'Measles / pox'],
  ME: ['Nervous disorders', 'Skin conditions', 'Stammer', 'Epilepsy', 'Memory loss', 'Respiratory'],
  JU: ['Diabetes', 'Liver/pancreas failure', 'Obesity', 'Ear disorders', 'Tumour (benign)', 'Jaundice'],
  VE: ['Kidney stones', 'UTI', 'Reproductive disorders', 'Venereal diseases', 'Diabetes (sweet tooth)', 'Cataracts'],
  SA: ['Arthritis', 'Rheumatism', 'Chronic fatigue', 'Dental decay', 'Paralysis', 'Cancer (chronic)'],
  RA: ['Undiagnosed illness', 'Poisoning', 'Skin allergies', 'Mental aberrations', 'Snake bite'],
  KE: ['Fistula', 'Parasitic infection', 'Nerve degeneration', 'Viral fever', 'Sudden illness'],
};

const MALEFICS: PlanetId[] = ['SA', 'MA', 'RA', 'KE', 'SU'];
const BENEFICS: PlanetId[] = ['JU', 'VE', 'ME', 'MO'];

function planetsAspectingHouse(k: KundaliResult, house: number): PlanetId[] {
  // Vedic aspects: every planet aspects 7th; MA also 4,8; JU also 5,9; SA also 3,10.
  const aspects: PlanetId[] = [];
  for (const p of k.planets) {
    const from = p.house;
    const dist = ((house - from + 12) % 12) + 1; // 1-based distance
    if (dist === 7) aspects.push(p.id);
    if (p.id === 'MA' && (dist === 4 || dist === 8)) aspects.push(p.id);
    if (p.id === 'JU' && (dist === 5 || dist === 9)) aspects.push(p.id);
    if (p.id === 'SA' && (dist === 3 || dist === 10)) aspects.push(p.id);
  }
  return aspects;
}

function afflictionScore(k: KundaliResult, house: number): number {
  // Higher = more afflicted. Positive for malefic conjunction/aspect,
  // negative for benefic presence (relief).
  let score = 0;
  for (const p of k.planets) {
    if (p.house === house) score += MALEFICS.includes(p.id) ? 8 : BENEFICS.includes(p.id) ? -5 : 0;
  }
  for (const pid of planetsAspectingHouse(k, house)) {
    score += MALEFICS.includes(pid) ? 4 : BENEFICS.includes(pid) ? -3 : 0;
  }
  return score;
}

function planetAfflictionScore(k: KundaliResult, p: PlanetPosition): number {
  let score = 0;
  // Own affliction
  if (p.debilitated) score += 10;
  if (p.combust) score += 6;
  if ([6,8,12].includes(p.house)) score += 5;
  // Conjunction with malefics
  const conj = k.planets.filter((q) => q.id !== p.id && q.house === p.house);
  for (const q of conj) {
    if (MALEFICS.includes(q.id)) score += 4;
    if (BENEFICS.includes(q.id)) score -= 3;
  }
  // Relief factors
  if (p.exalted) score -= 8;
  if (p.ownSign) score -= 5;
  return score;
}

// ═══════════════════════════════════════════════════════════════════════════
// Reports
// ═══════════════════════════════════════════════════════════════════════════

export interface BodyPartVulnerability {
  part: string;
  rashiNum: number;
  houseNum: number;             // house number from ascendant sitting on that rashi
  afflictionScore: number;
  occupants: PlanetId[];
  aspects: PlanetId[];
  risk: 'low' | 'moderate' | 'elevated' | 'high';
  notes: string[];
}

export interface PlanetMedicalEntry {
  planet: PlanetId;
  afflictionScore: number;
  bodySystems: string[];
  diseasesToWatch: string[];
  state: 'strong' | 'neutral' | 'afflicted';
  notes: string[];
}

export interface MedicalDeepReport {
  overallScore: number;         // 0..100 (higher = healthier)
  overallLabel: 'robust' | 'balanced' | 'watch' | 'fragile';
  arogyaBhava: {                // 1st house (body) summary
    lord: PlanetId;
    lordState: 'strong' | 'weak';
    occupants: PlanetId[];
    aspects: PlanetId[];
  };
  dusthanas: {                  // 6/8/12 affliction summary
    sixth:  { score: number; occupants: PlanetId[]; lord: PlanetId };
    eighth: { score: number; occupants: PlanetId[]; lord: PlanetId };
    twelfth:{ score: number; occupants: PlanetId[]; lord: PlanetId };
  };
  bodyVulnerability: BodyPartVulnerability[];
  planetHealth: PlanetMedicalEntry[];
  longevityBand: 'alpayu (short)' | 'madhyayu (middle)' | 'poornayu (long)';  // approximate
  recommendations: string[];
}

function vulnerabilityBand(score: number): BodyPartVulnerability['risk'] {
  if (score >= 12) return 'high';
  if (score >= 6) return 'elevated';
  if (score >= 2) return 'moderate';
  return 'low';
}

function medicalLabel(overall: number): MedicalDeepReport['overallLabel'] {
  if (overall >= 75) return 'robust';
  if (overall >= 55) return 'balanced';
  if (overall >= 35) return 'watch';
  return 'fragile';
}

function longevityBand(k: KundaliResult): MedicalDeepReport['longevityBand'] {
  // Simplified Parashari — lord of lagna and 8th, and Saturn.
  const lagnaLord = k.houses[0].lord;
  const eighthLord = k.houses[7].lord;
  const lagnaP = k.planets.find((p) => p.id === lagnaLord)!;
  const eighthP = k.planets.find((p) => p.id === eighthLord)!;
  const sat = k.planets.find((p) => p.id === 'SA')!;
  // Count kendras + strength
  let score = 0;
  if ([1,4,7,10].includes(lagnaP.house)) score += 2;
  if ([1,4,7,10].includes(eighthP.house)) score += 1;
  if ([1,4,7,10].includes(sat.house)) score += 1;
  if (lagnaP.exalted || lagnaP.ownSign) score += 2;
  if (lagnaP.debilitated) score -= 2;
  if (sat.exalted || sat.ownSign) score += 1;
  if (sat.debilitated) score -= 1;
  if (score >= 4) return 'poornayu (long)';
  if (score >= 1) return 'madhyayu (middle)';
  return 'alpayu (short)';
}

export function computeMedicalDeep(k: KundaliResult, _locale: _MedLocale = 'en'): MedicalDeepReport {
  const ascRashi = k.ascendant.rashi.num;

  // Body vulnerability — walk the 12 rashis from ascendant
  const bodyVulnerability: BodyPartVulnerability[] = [];
  for (let h = 1; h <= 12; h++) {
    const rashiNum = ((ascRashi - 1 + (h - 1)) % 12) + 1;
    const occupants = k.planets.filter((p) => p.house === h).map((p) => p.id);
    const aspects = planetsAspectingHouse(k, h).filter((p) => !occupants.includes(p));
    const score = afflictionScore(k, h);
    const notes: string[] = [];
    if (occupants.length === 0 && aspects.length === 0) notes.push('House unoccupied and unaspected — neutral.');
    if (occupants.some((pid) => MALEFICS.includes(pid))) notes.push(`Malefics present: ${occupants.filter((p) => MALEFICS.includes(p)).join(', ')}.`);
    if (aspects.some((pid) => MALEFICS.includes(pid))) notes.push(`Malefic aspects: ${aspects.filter((p) => MALEFICS.includes(p)).join(', ')}.`);
    if (occupants.some((pid) => BENEFICS.includes(pid))) notes.push(`Benefic occupancy (relief): ${occupants.filter((p) => BENEFICS.includes(p)).join(', ')}.`);
    bodyVulnerability.push({
      part: RASHI_BODY_PART[rashiNum],
      rashiNum,
      houseNum: h,
      afflictionScore: score,
      occupants,
      aspects,
      risk: vulnerabilityBand(score),
      notes,
    });
  }

  // Planet health matrix
  const planetHealth: PlanetMedicalEntry[] = k.planets.map((p) => {
    const aScore = planetAfflictionScore(k, p);
    const state: PlanetMedicalEntry['state'] =
      aScore >= 6 ? 'afflicted' : aScore <= -4 ? 'strong' : 'neutral';
    const notes: string[] = [];
    if (p.debilitated) notes.push('Debilitated.');
    if (p.exalted) notes.push('Exalted — protective.');
    if (p.combust) notes.push('Combust by Sun — weakened.');
    if ([6,8,12].includes(p.house)) notes.push(`In ${p.house}th (dusthana).`);
    if (p.ownSign) notes.push('Own sign — stable.');
    return {
      planet: p.id,
      afflictionScore: aScore,
      bodySystems: PLANET_BODY[p.id],
      diseasesToWatch: state === 'afflicted' ? PLANET_DISEASES[p.id] : [],
      state, notes,
    };
  });

  // Dusthanas
  const dusthanas = {
    sixth:  { score: afflictionScore(k, 6),  occupants: k.planets.filter((p) => p.house === 6).map((p)=>p.id),  lord: k.houses[5].lord },
    eighth: { score: afflictionScore(k, 8),  occupants: k.planets.filter((p) => p.house === 8).map((p)=>p.id),  lord: k.houses[7].lord },
    twelfth:{ score: afflictionScore(k, 12), occupants: k.planets.filter((p) => p.house === 12).map((p)=>p.id), lord: k.houses[11].lord },
  };

  // Arogya bhava (1st)
  const firstLord = k.houses[0].lord;
  const firstLordP = k.planets.find((p) => p.id === firstLord)!;
  const arogyaScore = planetAfflictionScore(k, firstLordP);
  const arogyaBhava = {
    lord: firstLord,
    lordState: (arogyaScore <= 0 ? 'strong' : 'weak') as 'strong' | 'weak',
    occupants: k.planets.filter((p) => p.house === 1).map((p) => p.id),
    aspects: planetsAspectingHouse(k, 1),
  };

  // Overall score: weighted composite
  const avgRisk = bodyVulnerability.reduce((s, v) => s + v.afflictionScore, 0) / 12;
  const dustotal = dusthanas.sixth.score + dusthanas.eighth.score + dusthanas.twelfth.score;
  const afflictedPlanets = planetHealth.filter((p) => p.state === 'afflicted').length;
  // Start at 80, subtract penalties
  let overall = 80 - Math.max(0, avgRisk) * 2 - Math.max(0, dustotal) * 0.6 - afflictedPlanets * 3;
  overall += arogyaBhava.lordState === 'strong' ? 5 : -5;
  overall = Math.max(0, Math.min(100, Math.round(overall)));

  const recommendations: string[] = [];
  const highRisks = bodyVulnerability.filter((v) => v.risk === 'high' || v.risk === 'elevated');
  if (highRisks.length) {
    recommendations.push(`Elevated risk for: ${highRisks.map((v) => v.part).slice(0, 3).join('; ')}.`);
  }
  const afflictedIds = planetHealth.filter((p) => p.state === 'afflicted').map((p) => p.planet);
  if (afflictedIds.includes('SA')) recommendations.push('Saturn afflicted — monitor bones, joints; avoid cold/damp foods.');
  if (afflictedIds.includes('MA')) recommendations.push('Mars afflicted — blood pressure, inflammation; avoid pungent excess.');
  if (afflictedIds.includes('ME')) recommendations.push('Mercury afflicted — nervous system; daily pranayama, reduce screen exposure.');
  if (afflictedIds.includes('MO')) recommendations.push('Moon afflicted — emotional/stomach; regular meal schedule, full-moon routines.');
  if (afflictedIds.includes('SU')) recommendations.push('Sun afflicted — cardiac care; surya-arghya daily at sunrise.');
  if (afflictedIds.includes('RA') || afflictedIds.includes('KE')) recommendations.push('Nodes afflicted — unusual/mysterious symptoms possible; keep second-opinion medical review.');
  recommendations.push('Full-annual checkup during 6th/8th lord major periods; avoid surgery in Moon-waning + Saturn-transit-8th windows.');

  return {
    overallScore: overall,
    overallLabel: medicalLabel(overall),
    arogyaBhava,
    dusthanas,
    bodyVulnerability,
    planetHealth,
    longevityBand: longevityBand(k),
    recommendations,
  };
}
