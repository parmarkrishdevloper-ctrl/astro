// Remedies database for the 9 grahas.
// Indexed by PlanetId — each entry covers gems, mantras, donations,
// rituals, yantras, and a recommended fasting day.
//
// Use `getRemedyEntry(id, locale)` to obtain a fully-localized snapshot
// (gems / metals / fingers / days / charity items / ritual prose / yantra
// name) for the user's current language; the raw `REMEDIES` constant
// remains in English for legacy callers.

import { PlanetId } from '../utils/astro-constants';
import { Locale, p, translator } from '../i18n';

export interface RemedyEntry {
  planet: PlanetId;
  gemstone: { primary: string; secondary?: string; weight: string; metal: string; finger: string; day: string };
  beejMantra: string;
  gayatri?: string;
  donations: string[];
  ritual: string;
  yantra: string;
  fastingDay: string;
}

export const REMEDIES: Record<PlanetId, RemedyEntry> = {
  SU: {
    planet: 'SU',
    gemstone: { primary: 'Ruby', secondary: 'Garnet', weight: '3-5 carats', metal: 'Gold', finger: 'Ring', day: 'Sunday morning' },
    beejMantra: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः',
    gayatri: 'ॐ आदित्याय विद्महे दिवाकराय धीमहि तन्नः सूर्यः प्रचोदयात्',
    donations: ['wheat', 'jaggery', 'copper', 'red flowers'],
    ritual: 'Surya Namaskar at sunrise; offer water (Arghya) facing east.',
    yantra: 'Surya Yantra',
    fastingDay: 'Sunday',
  },
  MO: {
    planet: 'MO',
    gemstone: { primary: 'Pearl', secondary: 'Moonstone', weight: '4-6 carats', metal: 'Silver', finger: 'Little', day: 'Monday morning' },
    beejMantra: 'ॐ श्रां श्रीं श्रौं सः चन्द्रमसे नमः',
    donations: ['rice', 'milk', 'silver', 'white cloth'],
    ritual: 'Worship Lord Shiva on Mondays; offer milk to Shivalinga.',
    yantra: 'Chandra Yantra',
    fastingDay: 'Monday',
  },
  MA: {
    planet: 'MA',
    gemstone: { primary: 'Red Coral', secondary: 'Carnelian', weight: '5-7 carats', metal: 'Gold/Copper', finger: 'Ring', day: 'Tuesday morning' },
    beejMantra: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',
    donations: ['red lentils (masoor dal)', 'red cloth', 'copper', 'sweets'],
    ritual: 'Hanuman Chalisa on Tuesdays; visit Hanuman temple.',
    yantra: 'Mangal Yantra',
    fastingDay: 'Tuesday',
  },
  ME: {
    planet: 'ME',
    gemstone: { primary: 'Emerald', secondary: 'Peridot', weight: '3-5 carats', metal: 'Gold', finger: 'Little', day: 'Wednesday morning' },
    beejMantra: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः',
    donations: ['moong dal', 'green cloth', 'bronze', 'green vegetables'],
    ritual: 'Worship Lord Vishnu on Wednesdays.',
    yantra: 'Budh Yantra',
    fastingDay: 'Wednesday',
  },
  JU: {
    planet: 'JU',
    gemstone: { primary: 'Yellow Sapphire', secondary: 'Topaz', weight: '3-5 carats', metal: 'Gold', finger: 'Index', day: 'Thursday morning' },
    beejMantra: 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः',
    donations: ['turmeric', 'yellow cloth', 'chana dal', 'gold'],
    ritual: 'Worship of Brihaspati or Lord Vishnu on Thursdays.',
    yantra: 'Guru Yantra',
    fastingDay: 'Thursday',
  },
  VE: {
    planet: 'VE',
    gemstone: { primary: 'Diamond', secondary: 'White Sapphire', weight: '1-2 carats', metal: 'Platinum', finger: 'Little', day: 'Friday morning' },
    beejMantra: 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः',
    donations: ['white rice', 'silk', 'sugar', 'white cloth'],
    ritual: 'Worship of Goddess Lakshmi on Fridays.',
    yantra: 'Shukra Yantra',
    fastingDay: 'Friday',
  },
  SA: {
    planet: 'SA',
    gemstone: { primary: 'Blue Sapphire', secondary: 'Amethyst', weight: '3-5 carats', metal: 'Iron/Panchadhatu', finger: 'Middle', day: 'Saturday evening' },
    beejMantra: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',
    donations: ['black sesame', 'mustard oil', 'iron', 'black cloth'],
    ritual: 'Hanuman Chalisa; light a mustard-oil lamp under a peepal tree on Saturdays.',
    yantra: 'Shani Yantra',
    fastingDay: 'Saturday',
  },
  RA: {
    planet: 'RA',
    gemstone: { primary: 'Hessonite (Gomed)', weight: '4-6 carats', metal: 'Mixed metal', finger: 'Middle', day: 'Saturday evening' },
    beejMantra: 'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः',
    donations: ['black sesame', 'blanket', 'mustard oil'],
    ritual: 'Recite Durga Saptashati; worship Goddess Durga.',
    yantra: 'Rahu Yantra',
    fastingDay: 'Saturday',
  },
  KE: {
    planet: 'KE',
    gemstone: { primary: "Cat's Eye (Lehsuniya)", weight: '3-5 carats', metal: 'Mixed metal', finger: 'Ring', day: 'Tuesday morning' },
    beejMantra: 'ॐ स्रां स्रीं स्रौं सः केतवे नमः',
    donations: ['blanket', 'sesame', 'multicolored cloth'],
    ritual: 'Worship Lord Ganesha; recite Ganesha Atharvashirsha.',
    yantra: 'Ketu Yantra',
    fastingDay: 'Tuesday',
  },
};

/**
 * Returns the per-graha remedy entry with all human-facing fields
 * localized to the requested locale. Mantra (Devanagari) is left as-is.
 */
export function getRemedyEntry(id: PlanetId, locale: Locale = 'en'): RemedyEntry {
  const base = REMEDIES[id];
  const t = translator(locale);
  return {
    ...base,
    gemstone: {
      ...base.gemstone,
      primary:   t.gemstone(base.gemstone.primary),
      secondary: base.gemstone.secondary ? t.gemstoneSubstitute(base.gemstone.secondary) : undefined,
      metal:     t.metal(base.gemstone.metal),
      finger:    t.finger(base.gemstone.finger),
      day:       t.fastingDayLabel(base.gemstone.day),
    },
    donations:  base.donations.map((d) => t.charityItem(d)),
    ritual:     p(`remedies.dataFile.ritual.${id}`, locale, base.ritual),
    yantra:     p(`remedies.dataFile.yantra.${id}`, locale, base.yantra),
    fastingDay: t.fastingDayLabel(base.fastingDay),
  };
}
