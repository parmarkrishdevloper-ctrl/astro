// Classical remedies (Upaya) — per-planet gemstone, mantra, deity, day,
// color, charity, and bija-mantra. Plus dosha-specific remedies (Mangal,
// Kaal Sarpa, Sade Sati, Pitru, Kalatra).
//
// The suggestions engine picks remedies based on the chart:
//   • Planets with low Shadbala (≤3 rupas) → strengthening upayas
//   • Planets with high Kashta phala → pacifying upayas
//   • Any doshas present → dosha-specific remedies
//
// This is educational / cultural reference material, not a medical or
// financial recommendation — exposed as advisory content only.

import { KundaliResult } from './kundali.service';
import { PlanetId } from '../utils/astro-constants';
import { calculateShadbala } from './strength.service';
import { checkAllDoshas } from './dosha.service';
import { computeIshtaKashta } from './ishta-kashta.service';
import { Locale, p, pf, translator } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

export interface PlanetRemedy {
  planet: PlanetId;
  name: string;
  nameHi: string;
  deity: string;
  day: string;
  direction: string;
  color: string;
  gem: { primary: string; substitutes: string[] };
  bijaMantra: string;
  vedicMantra: string;
  japaCount: number;
  charity: string[];
  fastingDay: string;
}

export interface DoshaRemedy {
  dosha: string;
  summary: string;
  steps: string[];
  mantra?: string;
}

export interface RemedySuggestion {
  planet: PlanetId;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  remedy: PlanetRemedy;
}

export interface RemedyResult {
  planets: Record<PlanetId, PlanetRemedy>;
  suggestions: RemedySuggestion[];
  doshaRemedies: DoshaRemedy[];
  general: string[];
}

const PLANET_REMEDIES_BASE: Record<PlanetId, PlanetRemedy> = {
  SU: {
    planet: 'SU', name: 'Sun', nameHi: 'सूर्य',
    deity: 'Surya / Shiva', day: 'Sunday', direction: 'East', color: 'Red / Copper',
    gem: { primary: 'Ruby (Manik)', substitutes: ['Red Garnet', 'Red Spinel'] },
    bijaMantra: 'Om Hram Hreem Hroum Sah Suryaya Namah',
    vedicMantra: 'Om Surya Devaya Vidmahe Sahasrakiranaya Dheemahi Tanno Surya Prachodayat',
    japaCount: 7000,
    charity: ['Wheat', 'Jaggery', 'Copper items', 'Red cloth'],
    fastingDay: 'Sunday',
  },
  MO: {
    planet: 'MO', name: 'Moon', nameHi: 'चन्द्र',
    deity: 'Parvati / Chandra', day: 'Monday', direction: 'North-West', color: 'White / Silver',
    gem: { primary: 'Pearl (Moti)', substitutes: ['Moonstone', 'White Coral'] },
    bijaMantra: 'Om Shraam Shreem Shroum Sah Chandraya Namah',
    vedicMantra: 'Om Ksheeraputraya Vidmahe Amrita Tatvaya Dheemahi Tanno Chandra Prachodayat',
    japaCount: 11000,
    charity: ['Rice', 'Milk', 'Silver', 'White cloth'],
    fastingDay: 'Monday',
  },
  MA: {
    planet: 'MA', name: 'Mars', nameHi: 'मंगल',
    deity: 'Kartikeya / Hanuman', day: 'Tuesday', direction: 'South', color: 'Red',
    gem: { primary: 'Red Coral (Moonga)', substitutes: ['Carnelian', 'Red Jasper'] },
    bijaMantra: 'Om Kram Kreem Kroum Sah Bhaumaya Namah',
    vedicMantra: 'Om Angarakaya Vidmahe Shakti Hastaya Dheemahi Tanno Bhauma Prachodayat',
    japaCount: 10000,
    charity: ['Red lentils (masoor dal)', 'Red cloth', 'Copper', 'Jaggery'],
    fastingDay: 'Tuesday',
  },
  ME: {
    planet: 'ME', name: 'Mercury', nameHi: 'बुध',
    deity: 'Vishnu', day: 'Wednesday', direction: 'North', color: 'Green',
    gem: { primary: 'Emerald (Panna)', substitutes: ['Peridot', 'Green Tourmaline'] },
    bijaMantra: 'Om Braam Breem Broum Sah Budhaya Namah',
    vedicMantra: 'Om Saumyarupaya Vidmahe Vanamalaya Dheemahi Tanno Budha Prachodayat',
    japaCount: 9000,
    charity: ['Green mung beans', 'Green cloth', 'Bronze items', 'Education supplies'],
    fastingDay: 'Wednesday',
  },
  JU: {
    planet: 'JU', name: 'Jupiter', nameHi: 'गुरु / बृहस्पति',
    deity: 'Brihaspati / Dattatreya', day: 'Thursday', direction: 'North-East', color: 'Yellow',
    gem: { primary: 'Yellow Sapphire (Pukhraj)', substitutes: ['Yellow Topaz', 'Citrine'] },
    bijaMantra: 'Om Gram Greem Groum Sah Gurave Namah',
    vedicMantra: 'Om Vrishabha Dhwajaaya Vidmahe Grineeshvaraya Dheemahi Tanno Guru Prachodayat',
    japaCount: 19000,
    charity: ['Turmeric', 'Yellow cloth', 'Gold', 'Books', 'Chana dal'],
    fastingDay: 'Thursday',
  },
  VE: {
    planet: 'VE', name: 'Venus', nameHi: 'शुक्र',
    deity: 'Lakshmi / Shukra', day: 'Friday', direction: 'South-East', color: 'White / Pastel',
    gem: { primary: 'Diamond (Heera)', substitutes: ['White Sapphire', 'White Zircon', 'Opal'] },
    bijaMantra: 'Om Dram Dreem Droum Sah Shukraya Namah',
    vedicMantra: 'Om Aswadhwajaya Vidmahe Dhanurhastaya Dheemahi Tanno Shukra Prachodayat',
    japaCount: 16000,
    charity: ['Rice', 'Silver', 'White cloth', 'Ghee', 'Sugar'],
    fastingDay: 'Friday',
  },
  SA: {
    planet: 'SA', name: 'Saturn', nameHi: 'शनि',
    deity: 'Shani / Hanuman / Bhairava', day: 'Saturday', direction: 'West', color: 'Dark Blue / Black',
    gem: { primary: 'Blue Sapphire (Neelam)', substitutes: ['Amethyst', 'Lapis Lazuli', 'Iolite'] },
    bijaMantra: 'Om Praam Preem Proum Sah Shanaischaraya Namah',
    vedicMantra: 'Om Neelanjana Samabhasam Raviputram Yamagrajam Chaya Martand Sambhutam Tam Namami Shanaishcharam',
    japaCount: 23000,
    charity: ['Black sesame', 'Iron', 'Mustard oil', 'Black cloth', 'Urad dal'],
    fastingDay: 'Saturday',
  },
  RA: {
    planet: 'RA', name: 'Rahu', nameHi: 'राहु',
    deity: 'Durga / Bhairava', day: 'Saturday (co-lord)', direction: 'South-West', color: 'Smoky / Grey',
    gem: { primary: 'Hessonite Garnet (Gomed)', substitutes: ['Smoky Quartz'] },
    bijaMantra: 'Om Bhram Bhreem Bhroum Sah Rahave Namah',
    vedicMantra: 'Om Nakadhwajaya Vidmahe Padma Hastaya Dheemahi Tanno Rahu Prachodayat',
    japaCount: 18000,
    charity: ['Black / multi-color cloth', 'Black gram (urad)', 'Coconut', 'Mustard oil'],
    fastingDay: 'Saturday',
  },
  KE: {
    planet: 'KE', name: 'Ketu', nameHi: 'केतु',
    deity: 'Ganesha / Bhairava', day: 'Tuesday (co-lord)', direction: 'North-West', color: 'Multi-color / Brown',
    gem: { primary: "Cat's Eye (Lahsuniya)", substitutes: ['Chrysoberyl'] },
    bijaMantra: 'Om Sraam Sreem Sroum Sah Ketave Namah',
    vedicMantra: 'Om Ashwadhwajaya Vidmahe Shoolahastaya Dheemahi Tanno Ketu Prachodayat',
    japaCount: 7000,
    charity: ['Brown / multi-color cloth', 'Sesame', 'Coconut', 'Blankets'],
    fastingDay: 'Tuesday',
  },
};

function buildDoshaRemedy(key: 'mangal' | 'kaalsarpa' | 'sadeSati', locale: Locale): DoshaRemedy {
  const stepCount = 5;
  return {
    dosha:   p(`remedies.dosha.${key}.title`,   locale, ''),
    summary: p(`remedies.dosha.${key}.summary`, locale, ''),
    steps:   Array.from({ length: stepCount }, (_, i) =>
               p(`remedies.dosha.${key}.step.${i}`, locale, '')),
    mantra:  p(`remedies.dosha.${key}.mantra`,  locale, ''),
  };
}

function buildPlanetRemedy(id: PlanetId, locale: Locale): PlanetRemedy {
  const base = PLANET_REMEDIES_BASE[id];
  const t = translator(locale);
  const al = astroLabels(locale);
  return {
    ...base,
    name: al.planet(id),
    deity: t.deity(base.deity),
    day: t.fastingDayLabel(base.day),
    direction: t.direction(base.direction),
    color: t.colour(base.color),
    gem: {
      primary: t.gemstone(base.gem.primary),
      substitutes: base.gem.substitutes.map((s) => t.gemstoneSubstitute(s)),
    },
    charity: base.charity.map((c) => t.charityItem(c)),
    fastingDay: t.fastingDayLabel(base.fastingDay),
    // bijaMantra / vedicMantra are Sanskrit transliterations — keep as-is
  };
}

function primaryReason(ps: { planet: PlanetId; rupa: number; kashta: number; ishta: number; })
  : { key: string; vars: Record<string, string | number> } | null {
  if (ps.rupa < 3) {
    return { key: 'remedies.suggestion.lowShadbala', vars: { rupa: ps.rupa.toFixed(2) } };
  }
  if (ps.kashta - ps.ishta >= 15) {
    return { key: 'remedies.suggestion.kashtaExceeds', vars: { kashta: ps.kashta.toFixed(1) } };
  }
  return null;
}

export function computeRemedies(k: KundaliResult, locale: Locale = 'en'): RemedyResult {
  const shad = calculateShadbala(k);
  const ik = computeIshtaKashta(k);
  const doshas = checkAllDoshas(k, undefined, locale);

  // Localized per-planet remedy table
  const planets = Object.fromEntries(
    (Object.keys(PLANET_REMEDIES_BASE) as PlanetId[]).map((id) => [id, buildPlanetRemedy(id, locale)]),
  ) as Record<PlanetId, PlanetRemedy>;

  const ikMap = Object.fromEntries(ik.rows.map((r) => [r.planet, r]));
  const suggestions: RemedySuggestion[] = [];

  for (const ps of shad.planets) {
    const ikRow = ikMap[ps.planet];
    const reason = primaryReason({
      planet: ps.planet,
      rupa: ps.totalRupas,
      kashta: ikRow?.kashta ?? 0,
      ishta: ikRow?.ishta ?? 0,
    });
    if (!reason) continue;
    const priority: RemedySuggestion['priority'] =
      ps.totalRupas < 2.5 ? 'high'
      : ps.totalRupas < 3.5 ? 'medium'
      : 'low';
    suggestions.push({
      planet: ps.planet,
      reason: pf(reason.key, locale, reason.vars, ''),
      priority,
      remedy: planets[ps.planet],
    });
  }
  suggestions.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority];
  });

  const doshaRemedies: DoshaRemedy[] = [];
  if (doshas.mangal.hasDosha && !doshas.mangal.cancelled) doshaRemedies.push(buildDoshaRemedy('mangal', locale));
  if (doshas.kaalSarpa.hasDosha) doshaRemedies.push(buildDoshaRemedy('kaalsarpa', locale));
  if (doshas.sadeSati.active) doshaRemedies.push(buildDoshaRemedy('sadeSati', locale));

  const general = Array.from({ length: 5 }, (_, i) => p(`remedies.general.${i}`, locale, ''));

  return {
    planets,
    suggestions,
    doshaRemedies,
    general,
  };
}
