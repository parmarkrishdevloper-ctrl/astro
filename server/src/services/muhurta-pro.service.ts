// Phase 11 — Muhurta Pro.
//
// Extends the base muhurat finder with:
//   • Classical muhurta yogas (Sarvartha-siddhi, Amrit-siddhi, Ravi,
//     Pushkar, Guru-Pushya, Dwi-Pushkar, Tri-Pushkar) — detected by
//     weekday + nakshatra + tithi patterns
//   • 35+ named event presets (marriage/surgery/signing contracts/…)
//     each with preferred nakshatras, weekdays, tithis, yogas
//   • Chaughadia + Hora calendar — full day or week timeline of 8
//     day-segments + 24 hora-ruler slots per day
//   • Varjyam widget — the ~96-minute inauspicious window that shifts
//     daily with the moon's nakshatra

import { PlanetId, NAKSHATRAS } from '../utils/astro-constants';
import { calculatePanchang } from './panchang.service';

// ─────────────────────────────────────────────────────────────────
// A. Classical muhurta yogas
// ─────────────────────────────────────────────────────────────────

/** Sarvartha-siddhi yoga — weekday + nakshatra pairs where all goals succeed. */
const SARVARTHA_SIDDHI: Record<number, number[]> = {
  0: [1, 8, 12, 13, 19, 21, 26],        // Sunday: Ashwini, Pushya, U.Phal, Hasta, Mula, U.Ashadha, U.Bhadra
  1: [4, 5, 8, 17, 22],                  // Monday: Rohini, Mrigashira, Pushya, Anuradha, Shravana
  2: [1, 12, 14, 17, 19],                // Tuesday: Ashwini, U.Phal, Chitra, Anuradha, Mula
  3: [4, 5, 6, 13, 14, 17],              // Wed: Rohini, Mrigashira, Ardra, Hasta, Chitra, Anuradha
  4: [1, 7, 8, 17, 27],                  // Thursday: Ashwini, Punarvasu, Pushya, Anuradha, Revati
  5: [1, 7, 17, 22, 27],                 // Friday: Ashwini, Punarvasu, Anuradha, Shravana, Revati
  6: [4, 15, 22],                        // Saturday: Rohini, Svati, Shravana
};

/** Amrit-siddhi yoga — single weekday+nak pair per day, strongest. */
const AMRIT_SIDDHI: Record<number, number> = {
  0: 13, 1: 5, 2: 1, 3: 17, 4: 8, 5: 27, 6: 4,
};

/** Ravi yoga — day's nakshatra at 4,6,9,10,13,20 count from birth-day nak. */
const RAVI_OFFSETS = [4, 6, 9, 10, 13, 20];

/** Dwi-Pushkar — specific tithi+weekday+nakshatra triplets doubling results. */
const DWI_PUSHKAR_NAKS = [5, 15, 21];                            // Mrigashira, Svati, U.Ashadha
const DWI_PUSHKAR_TITHIS = [2, 7, 12];                            // Dwitiya, Saptami, Dwadashi
const DWI_PUSHKAR_DAYS = [0, 2, 6];                               // Sun, Tue, Sat

/** Tri-Pushkar — the extreme version: tripled results (good or bad). */
const TRI_PUSHKAR_NAKS = [3, 13, 23];                             // Krittika, Hasta, Dhanishta (purna-nakshatras)
const TRI_PUSHKAR_TITHIS = [2, 7, 12];
const TRI_PUSHKAR_DAYS = [0, 2, 6];

/** Pushkar-navamsa: Sun in specific navamsas of chara rashis — simplified. */
const PUSHKAR_NAV_RASHIS = [1, 4, 7, 10];                          // movable signs

export type MuhurtaYogaName =
  | 'सर्वार्थ-सिद्धि' | 'अमृत-सिद्धि'
  | 'रवि' | 'गुरु-पुष्य' | 'द्वि-पुष्कर' | 'त्रि-पुष्कर' | 'पुष्कर-नवांश';

export interface MuhurtaYogaHit {
  name: MuhurtaYogaName;
  active: boolean;
  reason: string;
  strength: 'weak' | 'moderate' | 'strong';
}

export function detectMuhurtaYogas(input: {
  weekday: number;
  nakshatra: number;
  tithi: number;
  birthNak?: number;
  sunRashi?: number;
}): MuhurtaYogaHit[] {
  const { weekday, nakshatra, tithi, birthNak, sunRashi } = input;
  const hits: MuhurtaYogaHit[] = [];

  // Sarvartha-siddhi
  const ssNaks = SARVARTHA_SIDDHI[weekday] || [];
  if (ssNaks.includes(nakshatra)) {
    hits.push({
      name: 'सर्वार्थ-सिद्धि',
      active: true,
      reason: `${NAKSHATRAS[nakshatra - 1].nameHi} पर ${weekdayNameHi(weekday)} — सभी कार्य सफल होते हैं`,
      strength: 'strong',
    });
  }

  // Amrit-siddhi (strongest single pair)
  if (AMRIT_SIDDHI[weekday] === nakshatra) {
    hits.push({
      name: 'अमृत-सिद्धि',
      active: true,
      reason: `${NAKSHATRAS[nakshatra - 1].nameHi} पर ${weekdayNameHi(weekday)} — "अमर सफलता" का संयोजन`,
      strength: 'strong',
    });
  }

  // Ravi yoga — needs birthNak to evaluate
  if (birthNak) {
    const diff = ((nakshatra - birthNak + 27) % 27) + 1;
    if (RAVI_OFFSETS.includes(diff)) {
      hits.push({
        name: 'रवि',
        active: true,
        reason: `दिन का नक्षत्र जन्म नक्षत्र से ${diff}वां है — रवि योग (सूर्य की जीवन शक्ति)`,
        strength: 'moderate',
      });
    }
  }

  // Guru-Pushya yoga — Thursday + Pushya
  if (weekday === 4 && nakshatra === 8) {
    hits.push({
      name: 'गुरु-पुष्य',
      active: true,
      reason: 'गुरुवार + पुष्य — धन व धर्म के लिए मुहूर्तों का मुकुट',
      strength: 'strong',
    });
  }

  // Dwi-Pushkar
  if (DWI_PUSHKAR_NAKS.includes(nakshatra) &&
      DWI_PUSHKAR_TITHIS.includes(tithi) &&
      DWI_PUSHKAR_DAYS.includes(weekday)) {
    hits.push({
      name: 'द्वि-पुष्कर',
      active: true,
      reason: 'वार × तिथि × नक्षत्र त्रिक — परिणाम दोगुने होते हैं',
      strength: 'strong',
    });
  }

  // Tri-Pushkar
  if (TRI_PUSHKAR_NAKS.includes(nakshatra) &&
      TRI_PUSHKAR_TITHIS.includes(tithi) &&
      TRI_PUSHKAR_DAYS.includes(weekday)) {
    hits.push({
      name: 'त्रि-पुष्कर',
      active: true,
      reason: 'त्रि-शक्ति त्रिक — परिणाम तिगुने होते हैं (ध्रुवता पर ध्यान दें)',
      strength: 'strong',
    });
  }

  // Pushkar-navamsa (simplified: Sun in movable sign)
  if (sunRashi && PUSHKAR_NAV_RASHIS.includes(sunRashi)) {
    hits.push({
      name: 'पुष्कर-नवांश',
      active: true,
      reason: 'सूर्य चर राशि में — सरलीकृत पुष्कर नवांश गुण',
      strength: 'moderate',
    });
  }

  return hits;
}

function weekdayName(n: number): string {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][n] || '';
}

function weekdayNameHi(n: number): string {
  return ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'][n] || '';
}

// ─────────────────────────────────────────────────────────────────
// B. Event presets — 35+ named muhurtas
// ─────────────────────────────────────────────────────────────────

export interface PresetSpec {
  key: string;
  label: string;
  category: 'परिवार' | 'आवास' | 'कार्य' | 'वित्त' | 'यात्रा' | 'आध्यात्मिक' | 'चिकित्सा' | 'अन्य';
  goodNakshatras: number[];
  goodWeekdays: number[];
  goodTithis: number[];
  avoidTithis?: number[];
  requiredYogas?: MuhurtaYogaName[];
  preferredHora?: PlanetId[];
  note: string;
}

export const PRESETS: PresetSpec[] = [
  // ── Family ─────────────────────────────────────────────────
  { key: 'marriage',       label: 'विवाह',                  category: 'परिवार',
    goodNakshatras: [4, 12, 13, 17, 21, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], avoidTithis: [4, 9, 14, 30],
    preferredHora: ['VE', 'JU'],
    note: 'स्थिर नक्षत्र + सोम/बुध/गुरु/शुक्र; रिक्ता तिथियों से बचें।' },
  { key: 'engagement',     label: 'सगाई',        category: 'परिवार',
    goodNakshatras: [4, 8, 12, 13, 17, 21, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['VE', 'JU'],
    note: 'विवाह मुहूर्तों के समान, तिथि की पाबंदी कम होती है।' },
  { key: 'namakaran',      label: 'नामकरण',        category: 'परिवार',
    goodNakshatras: [1, 4, 5, 7, 8, 12, 13, 17, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [1, 2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'ME', 'VE'],
    note: 'प्रायः जन्म से 11वें या 12वें दिन; सूर्योदय होरा उत्तम।' },
  { key: 'annaprashan',    label: 'अन्नप्राशन',category: 'परिवार',
    goodNakshatras: [4, 7, 8, 12, 13, 17, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'VE'],
    note: 'बालकों के लिए 6वें महीने / बालिकाओं के लिए 5वें महीने में।' },
  { key: 'karnavedha',     label: 'कर्णवेध', category: 'परिवार',
    goodNakshatras: [5, 8, 13, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [5, 10, 11, 13], preferredHora: ['JU', 'ME'],
    note: 'जन्म से विषम महीने में उत्तम।' },
  { key: 'chudakaran',     label: 'चूड़ाकरण',   category: 'परिवार',
    goodNakshatras: [8, 13, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'VE'],
    note: 'प्रायः 3 वर्ष की आयु से पूर्व।' },
  { key: 'upanayanam',     label: 'उपनयन (यज्ञोपवीत)',category: 'परिवार',
    goodNakshatras: [1, 4, 5, 7, 8, 13, 17, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11], preferredHora: ['JU'],
    note: 'उत्तरायण उत्तम, परंपरानुसार 8/11/12 वर्ष की आयु।' },

  // ── Dwelling / vaastu ──────────────────────────────────────
  { key: 'bhoomi-puja',    label: 'भूमि पूजन',               category: 'आवास',
    goodNakshatras: [4, 7, 8, 12, 13, 17, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [1, 2, 3, 5, 7, 10, 11, 13], avoidTithis: [4, 8, 9, 14, 30],
    preferredHora: ['JU', 'VE', 'ME'],
    note: 'स्थिर व मृदु नक्षत्र; सूर्योदय से दोपहर का समय आदर्श।' },
  { key: 'foundation',     label: 'शिलान्यास',          category: 'आवास',
    goodNakshatras: [4, 7, 8, 12, 13, 17, 21, 22, 26, 27], goodWeekdays: [1, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'VE'],
    note: 'चंद्र मास की प्राथमिकता: मार्गशीर्ष, माघ, फाल्गुन।' },
  { key: 'griha-pravesh',  label: 'गृह प्रवेश',             category: 'आवास',
    goodNakshatras: [4, 5, 12, 13, 17, 21, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], avoidTithis: [4, 9, 14, 30],
    preferredHora: ['JU', 'VE', 'ME'], requiredYogas: ['सर्वार्थ-सिद्धि'],
    note: 'दक्षिणायन से बचें; उत्तरायण के सूर्य मास चुनें।' },
  { key: 'construction-start', label: 'निर्माण आरंभ',    category: 'आवास',
    goodNakshatras: [4, 7, 8, 13, 17, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'VE'],
    note: 'ढांचे की मजबूती के लिए स्थिर पृथ्वी नक्षत्र।' },
  { key: 'well-digging',   label: 'कुआँ / बोरवेल खुदाई',   category: 'आवास',
    goodNakshatras: [6, 9, 20, 21, 22, 24, 25, 26, 27], goodWeekdays: [1, 3, 5, 6],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['MO', 'VE'],
    note: 'जल तत्व के नक्षत्र; चंद्र/शुक्र की होरा।' },

  // ── Work / business ────────────────────────────────────────
  { key: 'business-open',  label: 'व्यवसाय आरंभ',          category: 'कार्य',
    goodNakshatras: [3, 7, 12, 13, 21, 22, 23, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'JU'],
    note: 'लाभ चौघड़िया वृद्धि करता है; बुध/गुरु होरा उत्तम।' },
  { key: 'shop-open',      label: 'नई दुकान आरंभ',          category: 'कार्य',
    goodNakshatras: [3, 7, 12, 13, 21, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 5, 7, 10, 11, 13], preferredHora: ['ME', 'JU'],
    note: 'शनिवार से बचें, बुधवार चुनें।' },
  { key: 'office-open',    label: 'नया कार्यालय आरंभ',        category: 'कार्य',
    goodNakshatras: [7, 8, 12, 13, 17, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'ME'],
    note: 'गुरु के प्रभाव के साथ व्यवसाय आरंभ के समान।' },
  { key: 'job-start',      label: 'नई नौकरी आरंभ',          category: 'कार्य',
    goodNakshatras: [1, 3, 7, 8, 12, 13, 17, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'ME', 'SU'],
    note: 'सूर्य की होरा पहले दिन प्रतिष्ठा बढ़ाती है।' },
  { key: 'contract-signing', label: 'अनुबंध हस्ताक्षर',       category: 'कार्य',
    goodNakshatras: [3, 7, 8, 12, 13, 17, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'JU'],
    note: 'सटीक और निर्दोष शर्तों के लिए बुध की होरा।' },
  { key: 'interview',      label: 'साक्षात्कार',                 category: 'कार्य',
    goodNakshatras: [3, 7, 8, 13, 17, 27], goodWeekdays: [1, 3, 4],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'JU'],
    note: 'शुभ/लाभ चौघड़िया विशेष रूप से अनुशंसित।' },

  // ── Education ──────────────────────────────────────────────
  { key: 'vidyarambha',    label: 'विद्यारंभ', category: 'आध्यात्मिक',
    goodNakshatras: [5, 8, 13, 17, 22, 27], goodWeekdays: [1, 3, 4],
    goodTithis: [1, 2, 3, 5, 7, 10, 11], preferredHora: ['ME', 'JU'],
    note: 'वसंत पंचमी आदर्श; सरस्वती आह्वान।' },
  { key: 'aksharabhyasam', label: 'अक्षराभ्यास', category: 'आध्यात्मिक',
    goodNakshatras: [5, 8, 13, 17, 22, 27], goodWeekdays: [1, 3, 4],
    goodTithis: [5, 10, 11], preferredHora: ['ME', 'JU'],
    note: 'तीसरे वर्ष या 2-5 आयु; जल/अग्नि राशि में लग्न।' },
  { key: 'exam-start',     label: 'परीक्षा आरंभ',   category: 'कार्य',
    goodNakshatras: [3, 5, 8, 13, 17, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'JU'],
    note: 'बुध होरा + शुभ चौघड़िया।' },

  // ── Travel ─────────────────────────────────────────────────
  { key: 'travel-long',    label: 'लंबी दूरी की यात्रा',      category: 'यात्रा',
    goodNakshatras: [1, 5, 7, 13, 14, 15, 22, 24], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'MO', 'JU'],
    note: 'उस दिन के लिए दिशा-शूल की दिशा से बचें।' },
  { key: 'travel-short',   label: 'छोटी यात्रा',              category: 'यात्रा',
    goodNakshatras: [1, 4, 5, 7, 13, 14, 15, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'MO'],
    note: 'कोई भी लाभ/अमृत चौघड़िया उत्तम है।' },
  { key: 'pilgrimage',     label: 'तीर्थ यात्रा',       category: 'आध्यात्मिक',
    goodNakshatras: [4, 5, 7, 8, 13, 17, 22, 27], goodWeekdays: [1, 4, 5],
    goodTithis: [2, 3, 5, 10, 11, 13, 15], preferredHora: ['JU', 'MO'],
    note: 'एकादशी या पूर्णिमा की प्राथमिकता।' },

  // ── Finance ────────────────────────────────────────────────
  { key: 'vehicle',        label: 'वाहन खरीद',          category: 'वित्त',
    goodNakshatras: [4, 5, 12, 13, 17, 21, 22, 26], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['VE', 'ME'],
    note: 'वाहन पंजीकरण पर शनि होरा से बचें।' },
  { key: 'property',       label: 'संपत्ति खरीद',         category: 'वित्त',
    goodNakshatras: [4, 7, 8, 12, 13, 17, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'VE'],
    note: 'स्थिर नक्षत्र (रोहिणी/उत्तरा) की प्राथमिकता।' },
  { key: 'gold-buy',       label: 'सोना / चाँदी खरीद',    category: 'वित्त',
    goodNakshatras: [4, 8, 12, 13, 17, 22, 27], goodWeekdays: [1, 4, 5],
    goodTithis: [3, 5, 10, 11, 13], preferredHora: ['VE', 'JU'],
    note: 'अक्षय तृतीया, धनतेरस अति उत्तम दिन हैं।' },
  { key: 'investment',     label: 'निवेश / शेयर',       category: 'वित्त',
    goodNakshatras: [3, 7, 8, 12, 13, 22, 27], goodWeekdays: [1, 3, 4],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['ME', 'JU'],
    note: 'लाभ चौघड़िया, बुध होरा, संपत/मित्र तारा।' },
  { key: 'loan',           label: 'ऋण वितरण',         category: 'वित्त',
    goodNakshatras: [4, 8, 12, 13, 17, 22, 27], goodWeekdays: [1, 3, 4],
    goodTithis: [2, 3, 5, 7, 10, 11], preferredHora: ['JU', 'ME'],
    note: 'शनिवार, मंगलवार और क्रूर ग्रहों की होरा से बचें।' },

  // ── Medical ────────────────────────────────────────────────
  { key: 'surgery',        label: 'सर्जरी (वैकल्पिक)',        category: 'चिकित्सा',
    goodNakshatras: [1, 3, 5, 6, 14, 16, 19, 24, 25], goodWeekdays: [2, 3, 6],
    goodTithis: [4, 6, 8, 9, 11, 12, 14], preferredHora: ['MA', 'ME', 'SA'],
    note: 'मंगल की होरा चीर-फाड़ के लिए; कृष्ण पक्ष को प्राथमिकता।' },
  { key: 'medicine-start', label: 'औषधि आरंभ',         category: 'चिकित्सा',
    goodNakshatras: [4, 7, 8, 12, 13, 17, 22, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 13], preferredHora: ['JU', 'ME', 'MO'],
    note: 'उपचार के लिए गुरु होरा; मंगल होरा से बचें।' },

  // ── Spiritual / religious ──────────────────────────────────
  { key: 'yajna',          label: 'यज्ञ / होम',              category: 'आध्यात्मिक',
    goodNakshatras: [3, 5, 7, 8, 13, 17, 22, 27], goodWeekdays: [0, 1, 3, 4, 5],
    goodTithis: [2, 3, 5, 7, 10, 11, 12, 13, 15], preferredHora: ['JU', 'SU', 'ME'],
    note: 'विशेषकर अग्नि अनुष्ठानों के लिए अग्नि तत्व के नक्षत्र।' },
  { key: 'mantra-start',   label: 'मंत्र जाप आरंभ',       category: 'आध्यात्मिक',
    goodNakshatras: [3, 5, 7, 8, 13, 17, 22, 27], goodWeekdays: [1, 3, 4],
    goodTithis: [2, 5, 7, 10, 11, 13], preferredHora: ['JU', 'ME'],
    note: 'ब्रह्म मुहूर्त (सूर्योदय से पूर्व) आदर्श है।' },
  { key: 'meditation-start', label: 'ध्यान शिविर आरंभ', category: 'आध्यात्मिक',
    goodNakshatras: [8, 13, 17, 22, 27], goodWeekdays: [1, 4],
    goodTithis: [5, 10, 11, 15], preferredHora: ['JU', 'MO'],
    note: 'एकादशी + सोमवार + पुष्य शास्त्रीय है।' },
  { key: 'idol-install',   label: 'मूर्ति स्थापना (प्रतिष्ठा)', category: 'आध्यात्मिक',
    goodNakshatras: [5, 7, 8, 13, 17, 22, 26, 27], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 10, 11, 13], preferredHora: ['JU', 'VE'],
    note: 'दिव्य-नक्षत्र की प्राथमिकता; देव गुरु बृहस्पति होरा।' },
  { key: 'dana',           label: 'दान',            category: 'आध्यात्मिक',
    goodNakshatras: [5, 7, 8, 13, 17, 22, 26, 27], goodWeekdays: [1, 4, 5],
    goodTithis: [2, 3, 5, 10, 11, 13, 15], preferredHora: ['JU', 'MO'],
    note: 'पूर्णिमा, अमावस्या, संक्रांति अति उत्तम दिन हैं।' },

  // ── Other ─────────────────────────────────────────────────
  { key: 'sowing',         label: 'कृषि बुवाई',       category: 'अन्य',
    goodNakshatras: [4, 5, 8, 9, 20, 21, 22, 26], goodWeekdays: [1, 3, 4, 5],
    goodTithis: [2, 3, 5, 10, 11, 13], preferredHora: ['MO', 'VE', 'JU'],
    note: 'जल/पृथ्वी नक्षत्र; चंद्रमा से सिंचित नक्षत्र उपज बढ़ाते हैं।' },
  { key: 'litigation',     label: 'मुकदमा दायर करना',         category: 'कार्य',
    goodNakshatras: [1, 3, 14, 16, 25], goodWeekdays: [2, 3],
    goodTithis: [4, 6, 9, 11, 14], preferredHora: ['MA', 'ME'],
    note: 'असामान्य: आक्रामक मामलों के लिए उग्र नक्षत्र और मंगल की होरा का प्रयोग करें।' },
];

// ─────────────────────────────────────────────────────────────────
// C. Chaughadia + Hora calendar
// ─────────────────────────────────────────────────────────────────

const CHAUGHADIA_DAY: Record<number, string[]> = {
  0: ['उद्वेग','चर','लाभ','अमृत','काल','शुभ','रोग','उद्वेग'],
  1: ['अमृत','काल','शुभ','रोग','उद्वेग','चर','लाभ','अमृत'],
  2: ['रोग','उद्वेग','चर','लाभ','अमृत','काल','शुभ','रोग'],
  3: ['लाभ','अमृत','काल','शुभ','रोग','उद्वेग','चर','लाभ'],
  4: ['शुभ','रोग','उद्वेग','चर','लाभ','अमृत','काल','शुभ'],
  5: ['चर','लाभ','अमृत','काल','शुभ','रोग','उद्वेग','चर'],
  6: ['काल','शुभ','रोग','उद्वेग','चर','लाभ','अमृत','काल'],
};
const CHAUGHADIA_NIGHT: Record<number, string[]> = {
  0: ['शुभ','अमृत','चर','रोग','काल','लाभ','उद्वेग','शुभ'],
  1: ['चर','रोग','काल','लाभ','उद्वेग','शुभ','अमृत','चर'],
  2: ['काल','लाभ','उद्वेग','शुभ','अमृत','चर','रोग','काल'],
  3: ['उद्वेग','शुभ','अमृत','चर','रोग','काल','लाभ','उद्वेग'],
  4: ['अमृत','चर','रोग','काल','लाभ','उद्वेग','शुभ','अमृत'],
  5: ['रोग','काल','लाभ','उद्वेग','शुभ','अमृत','चर','रोग'],
  6: ['लाभ','उद्वेग','शुभ','अमृत','चर','रोग','काल','लाभ'],
};
const CHAUGHADIA_QUALITY: Record<string, 'good' | 'neutral' | 'bad'> = {
  'अमृत': 'good', 'शुभ': 'good', 'लाभ': 'good',
  'चर': 'neutral',
  'रोग': 'bad', 'काल': 'bad', 'उद्वेग': 'bad',
};

const CHALDEAN_ORDER: PlanetId[] = ['SA','JU','MA','SU','VE','ME','MO'];
const WEEKDAY_LORD_IDX: Record<number, number> = {
  0: 3, 1: 6, 2: 2, 3: 5, 4: 1, 5: 4, 6: 0,
};

function horaRulerAt(hoursSinceSunrise: number, weekday: number): PlanetId {
  const h = ((hoursSinceSunrise % 24) + 24) % 24;
  const idx = Math.floor(h);
  const dayLordIdx = WEEKDAY_LORD_IDX[weekday] ?? 0;
  const pos = (((dayLordIdx + idx * 5) % 7) + 7) % 7;
  return CHALDEAN_ORDER[pos];
}

export interface ChaughadiaSegment {
  start: string;
  end: string;
  label: string;
  quality: 'good' | 'neutral' | 'bad';
  isDay: boolean;
}

export interface HoraSegment {
  start: string;
  end: string;
  ruler: PlanetId;
  isDay: boolean;
}

export interface DayCalendar {
  date: string;
  weekday: string;
  sunrise: string | null;
  sunset: string | null;
  chaughadia: ChaughadiaSegment[];
  hora: HoraSegment[];
  panchangYogas: MuhurtaYogaHit[];
  varjyam: { start: string; end: string } | null;
  amritKaal: { start: string; end: string } | null;
  durMuhurtam: { start: string; end: string }[];
  rahuKaal: { start: string; end: string } | null;
  gulika: { start: string; end: string } | null;
  yamaghanda: { start: string; end: string } | null;
  abhijit: { start: string; end: string } | null;
  summary: {
    tithi: string;
    nakshatra: string;
    yoga: string;
    karana: string;
  };
}

export function buildDayCalendar(dateISO: string, lat: number, lng: number, birthNak?: number): DayCalendar {
  const date = new Date(dateISO);
  const p = calculatePanchang(date, lat, lng);
  const weekdayIdx = new Date(p.sunrise || dateISO).getUTCDay();

  const chaughadia: ChaughadiaSegment[] = [];
  const hora: HoraSegment[] = [];

  if (p.sunrise && p.sunset) {
    const sr = new Date(p.sunrise).getTime();
    const ss = new Date(p.sunset).getTime();
    const dayLen = ss - sr;
    const nightLen = 24 * 3600000 - dayLen;
    const segDay = dayLen / 8;
    const segNight = nightLen / 8;

    // Day Chaughadia (8 segs sunrise→sunset)
    const daySeq = CHAUGHADIA_DAY[weekdayIdx];
    for (let i = 0; i < 8; i++) {
      const s = sr + i * segDay;
      const e = sr + (i + 1) * segDay;
      chaughadia.push({
        start: new Date(s).toISOString(),
        end: new Date(e).toISOString(),
        label: daySeq[i],
        quality: CHAUGHADIA_QUALITY[daySeq[i]],
        isDay: true,
      });
    }
    // Night Chaughadia (8 segs sunset→next sunrise)
    const nightSeq = CHAUGHADIA_NIGHT[weekdayIdx];
    for (let i = 0; i < 8; i++) {
      const s = ss + i * segNight;
      const e = ss + (i + 1) * segNight;
      chaughadia.push({
        start: new Date(s).toISOString(),
        end: new Date(e).toISOString(),
        label: nightSeq[i],
        quality: CHAUGHADIA_QUALITY[nightSeq[i]],
        isDay: false,
      });
    }

    // Hora — 24 hours of 1h each, day/night by sun
    for (let i = 0; i < 24; i++) {
      const s = sr + i * 3600000;
      const e = s + 3600000;
      hora.push({
        start: new Date(s).toISOString(),
        end: new Date(e).toISOString(),
        ruler: horaRulerAt(i, weekdayIdx),
        isDay: (s >= sr && s < ss),
      });
    }
  }

  const panchangYogas = detectMuhurtaYogas({
    weekday: weekdayIdx,
    nakshatra: p.nakshatra.num,
    tithi: p.tithi.num,
    birthNak,
    sunRashi: p.sun.rashiNum,
  });

  return {
    date: new Date(dateISO).toISOString().slice(0, 10),
    weekday: p.vara.name,
    sunrise: p.sunrise,
    sunset: p.sunset,
    chaughadia,
    hora,
    panchangYogas,
    varjyam: p.varjyam,
    amritKaal: p.amritKaal,
    durMuhurtam: p.durMuhurtam,
    rahuKaal: p.rahuKaal,
    gulika: p.gulika,
    yamaghanda: p.yamaghanda,
    abhijit: p.abhijitMuhurat,
    summary: {
      tithi: `${p.tithi.paksha} ${p.tithi.name}`,
      nakshatra: p.nakshatra.name,
      yoga: p.yoga.name,
      karana: p.karana.name,
    },
  };
}

export function buildWeekCalendar(startISO: string, lat: number, lng: number, birthNak?: number): DayCalendar[] {
  const start = new Date(startISO);
  const days: DayCalendar[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    days.push(buildDayCalendar(d.toISOString(), lat, lng, birthNak));
  }
  return days;
}

// ─────────────────────────────────────────────────────────────────
// D. Varjyam widget (dedicated endpoint for side-panel display)
// ─────────────────────────────────────────────────────────────────

export interface VarjyamWindow {
  date: string;
  nakshatra: string;
  varjyam: { start: string; end: string } | null;
  amritKaal: { start: string; end: string } | null;
  rahuKaal: { start: string; end: string } | null;
  note: string;
}

export function buildVarjyamWidget(
  dateISO: string, lat: number, lng: number, days = 7,
): VarjyamWindow[] {
  const out: VarjyamWindow[] = [];
  const start = new Date(dateISO);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const p = calculatePanchang(d, lat, lng);
    out.push({
      date: d.toISOString().slice(0, 10),
      nakshatra: p.nakshatra.name,
      varjyam: p.varjyam,
      amritKaal: p.amritKaal,
      rahuKaal: p.rahuKaal,
      note: p.varjyam
        ? 'Avoid initiating any new action during varjyam. Amrit-kaal (if present) is its opposite — highly auspicious.'
        : 'No active varjyam window today — broadly clear.',
    });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────
// E. Preset-aware muhurta suggest (thin wrapper)
// ─────────────────────────────────────────────────────────────────

export function findPresetByKey(key: string): PresetSpec | undefined {
  return PRESETS.find((p) => p.key === key);
}

export function listPresets(): { key: string; label: string; category: string; note: string }[] {
  return PRESETS.map((p) => ({ key: p.key, label: p.label, category: p.category, note: p.note }));
}
