// Phase 12 — 9-planet Yantra catalog.
//
// A yantra is a geometric diagram (mystical circuit) used as a focal object
// for graha worship and remedy. Each graha has:
//   • A magic square (Kameya/Ank chakra) whose rows/cols/diagonals all sum
//     to a planet-specific constant
//   • A bija mantra (seed syllable) and a japa count (classical recitation)
//   • A metal substrate, direction, preferred day, and colour
//   • Installation/energization (prana-pratishtha) procedure
//   • When to prescribe (weakness / affliction criteria)
//
// This is a static catalog — no computation. Returned to the client for
// display on the Remedies page.

import { PlanetId } from '../utils/astro-constants';
import { Locale, p, translator } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

export type YantraShape = 'square' | 'triangle' | 'hexagon' | 'circle' | 'octagon' | 'pentagon';

export interface YantraEntry {
  planet: PlanetId;
  name: string;
  sanskritName: string;
  // 3x3 magic square; rows/cols/diagonals sum to `magicSum`.
  magicSquare: number[][];
  magicSum: number;
  bija: string;
  bijaTranslit: string;
  japaCount: number;              // classical recitation count
  gayatri?: string;
  metal: string;                  // copper, silver, gold, panchadhatu, etc.
  day: string;                    // weekday for installation
  direction: string;              // direction to face
  colour: string;
  shape: YantraShape;             // principal geometric form
  mudra?: string;
  installation: string[];         // step-by-step procedure
  prescribeWhen: string[];        // conditions that suggest this yantra
  benefits: string[];
}

// Classical 3x3 magic squares — rows/cols/diagonals sum to the planet's
// numeric constant (the 'ank'), which encodes Vedic correspondences.
export const YANTRAS: Record<PlanetId, YantraEntry> = {
  SU: {
    planet: 'SU',
    name: 'Surya Yantra',
    sanskritName: 'सूर्य यन्त्र',
    magicSquare: [[6, 1, 8], [7, 5, 3], [2, 9, 4]],
    magicSum: 15,
    bija: 'ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः',
    bijaTranslit: 'Om Hraam Hreem Hraum Sah Suryaya Namah',
    japaCount: 7000,
    gayatri: 'ॐ आदित्याय विद्महे दिवाकराय धीमहि तन्नः सूर्यः प्रचोदयात्',
    metal: 'Copper',
    day: 'Sunday',
    direction: 'East',
    colour: 'Red / golden orange',
    shape: 'square',
    mudra: 'Surya Mudra',
    installation: [
      'Select Sunday at sunrise during Shukla Paksha.',
      'Bathe and wear clean red or saffron clothing.',
      'Face east. Place the yantra on a red cloth.',
      'Offer red flowers, kumkum, and sandalwood.',
      'Recite the bija mantra 7000 times (or 7× in 21 days).',
      'Offer arghya (water) to the Sun facing east.',
    ],
    prescribeWhen: [
      'Sun is debilitated (Libra) in chart',
      'Sun combust under 10° Sun (self-combust n/a)',
      'Sun afflicted by Saturn/Rahu/Ketu conjunction',
      'Weak Sun (Shadbala < 3 Rupas)',
      'Authority, recognition, or confidence issues',
    ],
    benefits: [
      'Restores vitality and ojas',
      'Strengthens position, authority, and public recognition',
      'Improves paternal relationships',
      'Heals eye and heart ailments',
    ],
  },

  MO: {
    planet: 'MO',
    name: 'Chandra Yantra',
    sanskritName: 'चन्द्र यन्त्र',
    magicSquare: [[7, 2, 9], [8, 6, 4], [3, 10, 5]],
    magicSum: 18,
    bija: 'ॐ श्रां श्रीं श्रौं सः चन्द्रमसे नमः',
    bijaTranslit: 'Om Shraam Shreem Shraum Sah Chandramase Namah',
    japaCount: 11000,
    gayatri: 'ॐ क्षीरपुत्राय विद्महे अमृतत्वाय धीमहि तन्नो चन्द्रः प्रचोदयात्',
    metal: 'Silver',
    day: 'Monday',
    direction: 'North-West',
    colour: 'White / pearl',
    shape: 'circle',
    installation: [
      'Select Monday on Purnima or bright-half evening after moonrise.',
      'Bathe, wear white. Place yantra on white silk.',
      'Offer white flowers, rice, milk, and camphor.',
      'Chant the bija 11000 times over 11 Mondays.',
      'Offer milk to a Shivalinga afterwards.',
    ],
    prescribeWhen: [
      'Moon debilitated (Scorpio) in chart',
      'Moon in 6/8/12 or afflicted by Saturn/Rahu',
      'Kshina Chandra (waning Moon near Amavasya)',
      'Emotional instability, sleeplessness, or mental unrest',
      'Mother-related afflictions',
    ],
    benefits: [
      'Calms mind and emotions',
      'Improves sleep, intuition, and mental clarity',
      'Strengthens maternal bond and domestic peace',
      'Balances fluid and hormonal systems',
    ],
  },

  MA: {
    planet: 'MA',
    name: 'Mangal Yantra',
    sanskritName: 'मङ्गल यन्त्र',
    magicSquare: [[8, 3, 10], [9, 7, 5], [4, 11, 6]],
    magicSum: 21,
    bija: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः',
    bijaTranslit: 'Om Kraam Kreem Kraum Sah Bhaumaya Namah',
    japaCount: 10000,
    gayatri: 'ॐ अंगारकाय विद्महे शक्तिहस्ताय धीमहि तन्नो भौमः प्रचोदयात्',
    metal: 'Copper',
    day: 'Tuesday',
    direction: 'South',
    colour: 'Red / coral',
    shape: 'triangle',
    installation: [
      'Tuesday at sunrise, preferably during Krittika or Mrigashira nakshatra.',
      'Wear red. Face south.',
      'Offer red flowers, jaggery, and red sandalwood.',
      'Chant bija 10000 times; Hanuman Chalisa 11 times.',
      'Light a ghee lamp and visit a Hanuman temple afterwards.',
    ],
    prescribeWhen: [
      'Mars debilitated (Cancer) in chart',
      'Mars in 6/8/12 or Rahu/Ketu conjunction',
      'Manglik dosha activation (Mars in 1/2/4/7/8/12)',
      'Anger, accident-proneness, surgery, or blood disorders',
      'Sibling or property disputes',
    ],
    benefits: [
      'Channels anger into courage',
      'Protects from accidents, surgery, and enemies',
      'Strengthens willpower and physical stamina',
      'Helps marital harmony (for Mangliks)',
    ],
  },

  ME: {
    planet: 'ME',
    name: 'Budh Yantra',
    sanskritName: 'बुध यन्त्र',
    magicSquare: [[9, 4, 11], [10, 8, 6], [5, 12, 7]],
    magicSum: 24,
    bija: 'ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः',
    bijaTranslit: 'Om Braam Breem Braum Sah Budhaya Namah',
    japaCount: 9000,
    gayatri: 'ॐ सौम्यरूपाय विद्महे वाणीश्वराय धीमहि तन्नो बुधः प्रचोदयात्',
    metal: 'Bronze',
    day: 'Wednesday',
    direction: 'North',
    colour: 'Green',
    shape: 'hexagon',
    installation: [
      'Wednesday morning during Ashlesha/Jyeshtha/Revati nakshatra.',
      'Wear green. Face north.',
      'Offer moong dal, green leaves, durva grass.',
      'Chant bija 9000 times in 9 Wednesdays.',
      'Donate green items afterwards.',
    ],
    prescribeWhen: [
      'Mercury debilitated (Pisces) in chart',
      'Mercury combust in the Sun',
      'Mercury afflicted by Mars/Saturn/Rahu',
      'Speech, learning, or commerce problems',
      'Nervous system or skin issues',
    ],
    benefits: [
      'Sharpens intellect, memory, speech',
      'Favors commerce, trade, and communication',
      'Heals nervous-system and skin conditions',
      'Good for students and writers',
    ],
  },

  JU: {
    planet: 'JU',
    name: 'Guru Yantra',
    sanskritName: 'गुरु यन्त्र',
    magicSquare: [[10, 5, 12], [11, 9, 7], [6, 13, 8]],
    magicSum: 27,
    bija: 'ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः',
    bijaTranslit: 'Om Graam Greem Graum Sah Gurave Namah',
    japaCount: 19000,
    gayatri: 'ॐ वृहस्पतये विद्महे सुराचार्याय धीमहि तन्नो गुरुः प्रचोदयात्',
    metal: 'Gold',
    day: 'Thursday',
    direction: 'North-East',
    colour: 'Yellow',
    shape: 'octagon',
    installation: [
      'Thursday morning during Punarvasu / Vishakha / Purva-bhadrapada.',
      'Wear yellow. Face north-east (Ishana).',
      'Offer yellow flowers, chana dal, turmeric, ghee lamp.',
      'Chant bija 19000 times over 19 Thursdays.',
      'Feed Brahmin/teacher and donate yellow items afterwards.',
    ],
    prescribeWhen: [
      'Jupiter debilitated (Capricorn) in chart',
      'Jupiter combust or in 6/8/12',
      'Jupiter conjunct Rahu/Ketu (Guru-Chandal)',
      'Progeny, wisdom, or spiritual stagnation',
      'Liver or pancreatic issues',
    ],
    benefits: [
      'Expands wisdom, wealth, and virtue',
      'Favors progeny and marriage for women',
      'Removes guru-chandal dosha',
      'Heals liver, fat metabolism, and diabetes',
    ],
  },

  VE: {
    planet: 'VE',
    name: 'Shukra Yantra',
    sanskritName: 'शुक्र यन्त्र',
    magicSquare: [[11, 6, 13], [12, 10, 8], [7, 14, 9]],
    magicSum: 30,
    bija: 'ॐ द्रां द्रीं द्रौं सः शुक्राय नमः',
    bijaTranslit: 'Om Draam Dreem Draum Sah Shukraya Namah',
    japaCount: 16000,
    gayatri: 'ॐ भृगुवंशाय विद्महे दिव्यदेहाय धीमहि तन्नो शुक्रः प्रचोदयात्',
    metal: 'Silver / Platinum',
    day: 'Friday',
    direction: 'South-East',
    colour: 'White / rainbow',
    shape: 'pentagon',
    installation: [
      'Friday evening during Bharani / Purva-phalguni / Purva-ashadha.',
      'Wear white/silk. Face south-east (Agneya).',
      'Offer white flowers, sugar, rice, and rose petals.',
      'Chant bija 16000 times over 16 Fridays.',
      'Worship Lakshmi and donate white items afterwards.',
    ],
    prescribeWhen: [
      'Venus debilitated (Virgo) in chart',
      'Venus combust (within 10°) — very common',
      'Venus afflicted in 7th house',
      'Marriage delay, marital discord, or romantic issues',
      'Kidney, reproductive, or skin issues',
    ],
    benefits: [
      'Attracts love, beauty, luxury, refinement',
      'Favors marriage and partnerships',
      'Favors arts, music, and design',
      'Heals reproductive and urinary systems',
    ],
  },

  SA: {
    planet: 'SA',
    name: 'Shani Yantra',
    sanskritName: 'शनि यन्त्र',
    magicSquare: [[12, 7, 14], [13, 11, 9], [8, 15, 10]],
    magicSum: 33,
    bija: 'ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः',
    bijaTranslit: 'Om Praam Preem Praum Sah Shanaishcharaya Namah',
    japaCount: 23000,
    gayatri: 'ॐ शनैश्चराय विद्महे सूर्यपुत्राय धीमहि तन्नः शनिः प्रचोदयात्',
    metal: 'Iron / Panchadhatu',
    day: 'Saturday',
    direction: 'West',
    colour: 'Dark blue / black',
    shape: 'square',
    installation: [
      'Saturday evening during Pushya / Anuradha / Uttara-bhadrapada.',
      'Wear black/dark blue. Face west.',
      'Offer black sesame, mustard oil, iron nails.',
      'Light a mustard-oil lamp under a peepal tree.',
      'Chant bija 23000 times over 23 Saturdays.',
      'Donate mustard oil, iron, shoes, or a blanket.',
    ],
    prescribeWhen: [
      'Saturn debilitated (Aries) in chart',
      'Sade-Sati (Saturn transit 12-1-2 from Moon)',
      'Ashtama Shani (Saturn transit 8th from Moon)',
      'Saturn in 6/8/12 or conjunct Rahu/Ketu',
      'Chronic illness, bone/joint issues, delays',
    ],
    benefits: [
      'Eases Sade-Sati and Shani dhaiyya',
      'Removes delays, restrictions, and karmic burdens',
      'Favors service, discipline, and longevity',
      'Heals bones, joints, nerves, and chronic ailments',
    ],
  },

  RA: {
    planet: 'RA',
    name: 'Rahu Yantra',
    sanskritName: 'राहु यन्त्र',
    magicSquare: [[13, 8, 15], [14, 12, 10], [9, 16, 11]],
    magicSum: 36,
    bija: 'ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः',
    bijaTranslit: 'Om Bhraam Bhreem Bhraum Sah Rahave Namah',
    japaCount: 18000,
    gayatri: 'ॐ नाकध्वजाय विद्महे पद्महस्ताय धीमहि तन्नो राहुः प्रचोदयात्',
    metal: 'Mixed-metal (Ashtadhatu)',
    day: 'Saturday',
    direction: 'South-West',
    colour: 'Smoky grey',
    shape: 'octagon',
    installation: [
      'Saturday during Ardra / Swati / Shatabhisha — Rahu Kaal window.',
      'Wear grey/dark colors. Face south-west (Nairitya).',
      'Offer sesame, mustard oil, dark blue flowers.',
      'Chant bija 18000 times over 18 Saturdays.',
      'Recite Durga Saptashati; donate black blankets.',
    ],
    prescribeWhen: [
      'Rahu in 1/5/7/9 causing Pitru Dosha or Kaal Sarpa',
      'Rahu conjunct Sun/Moon (eclipses)',
      'Rahu in Ashlesha / Jyeshtha / Revati (gandanta)',
      'Obsession, addiction, paranoia, or foreign-land problems',
      'Unexplained fears or sudden reversals',
    ],
    benefits: [
      'Neutralizes Kaal Sarpa dosha',
      'Removes phobias, addictions, and unexplained fears',
      'Favors foreign travel and research',
      'Protects from sudden reversals and deception',
    ],
  },

  KE: {
    planet: 'KE',
    name: 'Ketu Yantra',
    sanskritName: 'केतु यन्त्र',
    magicSquare: [[14, 9, 16], [15, 13, 11], [10, 17, 12]],
    magicSum: 39,
    bija: 'ॐ स्रां स्रीं स्रौं सः केतवे नमः',
    bijaTranslit: 'Om Sraam Sreem Sraum Sah Ketave Namah',
    japaCount: 17000,
    gayatri: 'ॐ गदाहस्ताय विद्महे अमृतध्वजाय धीमहि तन्नो केतुः प्रचोदयात्',
    metal: 'Mixed-metal (Ashtadhatu)',
    day: 'Tuesday',
    direction: 'North (celestial pole)',
    colour: 'Smoky / multicolour',
    shape: 'triangle',
    installation: [
      'Tuesday during Ashwini / Magha / Mula nakshatra.',
      'Wear multicolour or smoky shades. Sit facing north.',
      'Offer sesame, multicoloured flowers, and coconut.',
      'Chant bija 17000 times over 17 Tuesdays.',
      'Worship Lord Ganesha; recite Ganesha Atharvashirsha.',
    ],
    prescribeWhen: [
      'Ketu in 1/5/7 — detachment, spiritual fever',
      'Ketu conjunct Sun/Moon (eclipses)',
      'Ketu in gandanta or Mula / Ashlesha / Jyeshtha',
      'Obsessive-compulsive, skin, or nerve issues',
      'Sudden losses or inexplicable endings',
    ],
    benefits: [
      'Neutralizes Kaal Sarpa dosha',
      'Awakens spiritual insight and moksha tendency',
      'Heals OCD, skin, and nerve issues',
      'Removes obstacles (Ketu ~ Ganesha energy)',
    ],
  },
};

// ─── Localization helper ────────────────────────────────────────────────────
//
// `localizeYantra` returns a YantraEntry whose human-facing strings are
// resolved into the requested locale. Devanagari fields (bija, gayatri,
// sanskritName) are passed through unchanged — they are already the
// canonical Sanskrit. `bijaTranslit` (romanised pronunciation) is also
// kept verbatim so callers always have a romanised handle.

function localizeYantra(entry: YantraEntry, locale: Locale): YantraEntry {
  const t = translator(locale);
  const al = astroLabels(locale);
  const planetId = entry.planet;
  return {
    ...entry,
    name:        p(`remedies.dataFile.yantra.${planetId}`, locale, entry.name),
    // sanskritName is canonical Sanskrit — leave as-is
    metal:       t.metal(entry.metal),
    day:         al.vara(entry.day),
    direction:   t.direction(entry.direction),
    colour:      t.colour(entry.colour),
    shape:       p(`yantra.shape.${entry.shape}`, locale, entry.shape) as YantraShape,
    mudra:       entry.mudra ? p(`yantra.mudra.${entry.mudra}`, locale, entry.mudra) : entry.mudra,
    installation:  entry.installation.map((step, i) =>
                     p(`yantra.install.${planetId}.${i}`, locale, step)),
    prescribeWhen: entry.prescribeWhen.map((c, i) =>
                     p(`yantra.prescribe.${planetId}.${i}`, locale, c)),
    benefits:      entry.benefits.map((b, i) =>
                     p(`yantra.benefit.${planetId}.${i}`, locale, b)),
  };
}

export function getYantra(planet: PlanetId, locale: Locale = 'en'): YantraEntry {
  return localizeYantra(YANTRAS[planet], locale);
}

export function listYantras(locale: Locale = 'en'): YantraEntry[] {
  const order: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA', 'RA', 'KE'];
  return order.map((pl) => localizeYantra(YANTRAS[pl], locale));
}
