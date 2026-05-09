// Phase 18 — Multilingual phrasebook for narrative generation.
//
// Locale-keyed phrase bank used by narrative.service.ts to assemble human-
// readable interpretations in en / hi / gu / sa. Strictly rule-based: a
// phrasebook entry is a tagged template with {placeholders} resolved against
// the chart context.
//
// Schema is shared across locales — adding a new key means writing the same
// key in every locale (with English as automatic fallback).

import type { Locale } from '../i18n';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Phrasebook {
  // Section headers
  section: {
    overview: string;
    personality: string;
    career: string;
    relationships: string;
    wealth: string;
    health: string;
    spirituality: string;
    dasha: string;
    transit: string;
    yoga: string;
    today: string;
    journal_intro: string;
    compare_intro: string;
    compare_synastry: string;
    compare_compatibility: string;
  };

  // Connectors / glue
  glue: {
    period_now: string;             // "Currently the running period is"
    in_house: string;               // "in the {n}th house"
    in_sign: string;                // "in {sign}"
    nakshatra_in: string;           // "nakshatra {nak}"
    bullet: string;                 // "•"
    sentence_end: string;           // "."
    and: string;
  };

  // House themes (used when describing planet placements)
  house: Record<number, string>;     // 1..12 → "self / vitality"

  // Planet temperaments (one-liner)
  planet: Record<string, string>;    // planet id → archetype

  // Sign tones
  rashiTone: Record<number, string>; // 1..12 → fire/earth/air/water tone

  // Dasha lord themes (planet id → narrative tone for an active dasha)
  dashaTheme: Record<string, string>;

  // Yoga summaries
  yoga: Record<string, string>;      // yoga key → "Raja Yoga: a kingly combination..."

  // Ordinal numbers (for "1st house", "10th lord")
  ordinal: (n: number) => string;

  // Days of the week (for journal entries)
  weekday: string[];                 // 0=Sunday..6=Saturday

  // Compare verdicts (qualitative scores)
  compatibility: {
    excellent: string;
    good: string;
    moderate: string;
    challenging: string;
  };

  // Today/journal phrases
  today: {
    nakshatra_today: string;       // "Today's nakshatra is {nak}"
    tithi_today: string;
    yoga_today: string;
    sun_in: string;
    moon_in: string;
    auspicious_window: string;
    inauspicious_window: string;
    dasha_running: string;
    journal_lead: string;
    journal_close: string;
  };

  // Misc tone strings
  tone: {
    strong: string;
    weak: string;
    exalted: string;
    debilitated: string;
    own_sign: string;
    retrograde: string;
    combust: string;
    benefic: string;
    malefic: string;
  };
}

// ─── English ────────────────────────────────────────────────────────────────
const EN: Phrasebook = {
  section: {
    overview: 'Overview',
    personality: 'Personality',
    career: 'Career & Vocation',
    relationships: 'Relationships',
    wealth: 'Wealth & Finance',
    health: 'Health & Vitality',
    spirituality: 'Spiritual Path',
    dasha: 'Current Period',
    transit: 'Transits',
    yoga: 'Active Yogas',
    today: "Today's Sky",
    journal_intro: "Journal Entry",
    compare_intro: 'Comparative Reading',
    compare_synastry: 'Inter-Chart Aspects',
    compare_compatibility: 'Compatibility',
  },
  glue: {
    period_now: 'The running period is',
    in_house: 'in the {n} house',
    in_sign: 'in {sign}',
    nakshatra_in: 'in nakshatra {nak}',
    bullet: '•',
    sentence_end: '.',
    and: 'and',
  },
  house: {
    1: 'self, vitality, and outward identity',
    2: 'wealth, family, and speech',
    3: 'siblings, courage, and short journeys',
    4: 'home, mother, and emotional foundation',
    5: 'children, creativity, and intellect',
    6: 'enemies, debts, and service',
    7: 'partnership and marriage',
    8: 'longevity, hidden matters, and transformation',
    9: 'fortune, dharma, and the higher mind',
    10: 'career, status, and public action',
    11: 'gains, networks, and elder siblings',
    12: 'losses, foreign lands, and liberation',
  },
  planet: {
    SU: 'soul, authority, vitality',
    MO: 'mind, mother, emotion',
    MA: 'energy, courage, will',
    ME: 'intellect, speech, commerce',
    JU: 'wisdom, dharma, expansion',
    VE: 'love, beauty, refinement',
    SA: 'discipline, longevity, karma',
    RA: 'desire, foreign matters, taboo',
    KE: 'detachment, moksha, the unseen',
  },
  rashiTone: {
    1: 'fiery and pioneering', 2: 'steady and grounded', 3: 'curious and changeable',
    4: 'sensitive and protective', 5: 'royal and creative', 6: 'analytical and humble',
    7: 'diplomatic and partnered', 8: 'intense and hidden', 9: 'expansive and philosophical',
    10: 'disciplined and ambitious', 11: 'inventive and group-oriented', 12: 'compassionate and fluid',
  },
  dashaTheme: {
    SU: 'a period of authority, recognition, and the soul taking centre stage',
    MO: 'a period of feeling, family, and inner reflection',
    MA: 'a period of action, conflict, and decisive movement',
    ME: 'a period of learning, communication, and trade',
    JU: 'a period of expansion, teaching, and good fortune',
    VE: 'a period of relationship, art, and pleasure',
    SA: 'a period of discipline, delay, and karmic ripening',
    RA: 'a period of ambition, foreign winds, and unconventional gain',
    KE: 'a period of detachment, mysticism, and quiet breakthroughs',
  },
  yoga: {
    'Raja Yoga': 'Raja Yoga — a regal combination uplifting status and authority',
    'Dhana Yoga': 'Dhana Yoga — a wealth-bestowing combination',
    'Gajakesari': 'Gaja-Kesari — Jupiter and Moon combine to grant wisdom and respect',
    'Pancha Mahapurusha': 'Pancha Mahapurusha — a benefic in own/exalted sign in a kendra',
    'Neecha Bhanga': 'Neecha-Bhanga — debilitation cancelled, hidden strength surfaces',
    'Vipareeta': 'Viparita Raja Yoga — strength born of difficulty',
  },
  ordinal: (n) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  },
  weekday: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  compatibility: {
    excellent: 'Excellent — a deeply supportive match',
    good: 'Good — workable with mutual effort',
    moderate: 'Moderate — neither flow nor friction dominates',
    challenging: 'Challenging — sustained understanding is required',
  },
  today: {
    nakshatra_today: "Today's nakshatra is {nak}",
    tithi_today: 'Tithi: {tithi} ({paksha} paksha)',
    yoga_today: 'Yoga: {yoga}',
    sun_in: 'Sun is in {sign}',
    moon_in: 'Moon is in {sign}',
    auspicious_window: 'Abhijit Muhurat: {window}',
    inauspicious_window: 'Rahu Kaal: {window}',
    dasha_running: 'You are running {maha}/{antar}',
    journal_lead: 'On {weekday}, {date}, the cosmos meets you with',
    journal_close: 'A good day to honour the lord of the day, {lord}, with mindful action.',
  },
  tone: {
    strong: 'strong', weak: 'weak', exalted: 'exalted', debilitated: 'debilitated',
    own_sign: 'in own sign', retrograde: 'retrograde', combust: 'combust',
    benefic: 'benefic', malefic: 'malefic',
  },
};

// ─── Hindi ──────────────────────────────────────────────────────────────────
const HI: Phrasebook = {
  section: {
    overview: 'सिंहावलोकन',
    personality: 'व्यक्तित्व',
    career: 'व्यवसाय व कर्मक्षेत्र',
    relationships: 'संबंध',
    wealth: 'धन व समृद्धि',
    health: 'स्वास्थ्य',
    spirituality: 'आध्यात्मिक मार्ग',
    dasha: 'वर्तमान दशा',
    transit: 'गोचर',
    yoga: 'सक्रिय योग',
    today: 'आज का आकाश',
    journal_intro: 'दैनिक डायरी',
    compare_intro: 'तुलनात्मक अध्ययन',
    compare_synastry: 'अंतर-कुंडली दृष्टियाँ',
    compare_compatibility: 'अनुकूलता',
  },
  glue: {
    period_now: 'चल रही दशा है',
    in_house: '{n} भाव में',
    in_sign: '{sign} राशि में',
    nakshatra_in: '{nak} नक्षत्र में',
    bullet: '•',
    sentence_end: '।',
    and: 'और',
  },
  house: {
    1: 'स्वयं, जीवनी-शक्ति, बाहरी पहचान',
    2: 'धन, परिवार, वाणी',
    3: 'भाई-बहन, साहस, छोटी यात्राएँ',
    4: 'घर, माता, भावनात्मक नींव',
    5: 'संतान, सृजन, बुद्धि',
    6: 'शत्रु, ऋण, सेवा',
    7: 'जीवनसाथी, विवाह',
    8: 'आयु, गूढ़ विषय, रूपांतरण',
    9: 'भाग्य, धर्म, उच्च-ज्ञान',
    10: 'व्यवसाय, यश, सार्वजनिक कर्म',
    11: 'लाभ, मित्र-वर्ग, बड़े भाई',
    12: 'व्यय, विदेश, मोक्ष',
  },
  planet: {
    SU: 'आत्मा, अधिकार, ओज',
    MO: 'मन, माता, भावना',
    MA: 'ऊर्जा, साहस, संकल्प',
    ME: 'बुद्धि, वाणी, व्यापार',
    JU: 'ज्ञान, धर्म, विस्तार',
    VE: 'प्रेम, सौंदर्य, परिष्कार',
    SA: 'अनुशासन, आयु, कर्म',
    RA: 'इच्छा, विदेश, अपरंपरागत',
    KE: 'वैराग्य, मोक्ष, अदृश्य',
  },
  rashiTone: {
    1: 'अग्नि-सम और साहसी', 2: 'स्थिर और भौतिक', 3: 'जिज्ञासु और परिवर्तनशील',
    4: 'संवेदनशील और रक्षक', 5: 'राजसी और सृजनशील', 6: 'विश्लेषक और विनम्र',
    7: 'कूटनीतिक और सहभागी', 8: 'गहन और गुप्त', 9: 'विस्तृत और दार्शनिक',
    10: 'अनुशासित और महत्त्वाकांक्षी', 11: 'नवीन और सामूहिक', 12: 'करुण और तरल',
  },
  dashaTheme: {
    SU: 'अधिकार, मान्यता और आत्म-प्रकाश का काल',
    MO: 'भावना, परिवार और अंतर्मन का काल',
    MA: 'क्रिया, संघर्ष और निर्णायक गति का काल',
    ME: 'अध्ययन, संवाद और व्यापार का काल',
    JU: 'विस्तार, गुरु-कृपा और सौभाग्य का काल',
    VE: 'संबंध, कला और सुख का काल',
    SA: 'अनुशासन, विलंब और कर्म-फल का काल',
    RA: 'महत्त्वाकांक्षा, विदेश और अपरंपरागत लाभ का काल',
    KE: 'वैराग्य, गुह्य और मौन सिद्धि का काल',
  },
  yoga: {
    'Raja Yoga': 'राज योग — पद और सत्ता दिलाने वाला योग',
    'Dhana Yoga': 'धन योग — समृद्धि-कारक योग',
    'Gajakesari': 'गजकेसरी — चंद्र-गुरु संयोग, बुद्धि व सम्मान',
    'Pancha Mahapurusha': 'पंच महापुरुष — केंद्र में स्व/उच्च शुभ ग्रह',
    'Neecha Bhanga': 'नीच-भंग — दुर्बलता का निरस्त होना, गुप्त बल',
    'Vipareeta': 'विपरीत राज योग — कठिनाई से उत्पन्न शक्ति',
  },
  ordinal: (n) => `${n}वाँ`,
  weekday: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
  compatibility: {
    excellent: 'उत्तम — गहन समर्थक मेल',
    good: 'शुभ — परस्पर प्रयास से सुखद',
    moderate: 'मध्यम — न प्रवाह न संघर्ष',
    challenging: 'कठिन — सतत समझदारी अपेक्षित',
  },
  today: {
    nakshatra_today: 'आज का नक्षत्र {nak} है',
    tithi_today: 'तिथि: {tithi} ({paksha} पक्ष)',
    yoga_today: 'योग: {yoga}',
    sun_in: 'सूर्य {sign} राशि में हैं',
    moon_in: 'चंद्र {sign} राशि में हैं',
    auspicious_window: 'अभिजित मुहूर्त: {window}',
    inauspicious_window: 'राहु काल: {window}',
    dasha_running: 'आप {maha}/{antar} दशा में हैं',
    journal_lead: '{weekday}, {date} को आकाश आपको देता है',
    journal_close: 'आज के स्वामी {lord} का स्मरण कर सुविचारित कर्म करना शुभ है।',
  },
  tone: {
    strong: 'बलवान', weak: 'दुर्बल', exalted: 'उच्च', debilitated: 'नीच',
    own_sign: 'स्वराशि में', retrograde: 'वक्री', combust: 'अस्त',
    benefic: 'शुभ', malefic: 'पापी',
  },
};

// ─── Gujarati ───────────────────────────────────────────────────────────────
const GU: Phrasebook = {
  section: {
    overview: 'ઝાંખી',
    personality: 'વ્યક્તિત્વ',
    career: 'કારકિર્દી',
    relationships: 'સંબંધો',
    wealth: 'ધન-સંપત્તિ',
    health: 'આરોગ્ય',
    spirituality: 'આધ્યાત્મિક માર્ગ',
    dasha: 'ચાલતી દશા',
    transit: 'ગોચર',
    yoga: 'સક્રિય યોગો',
    today: 'આજનું આકાશ',
    journal_intro: 'દૈનિક ડાયરી',
    compare_intro: 'તુલનાત્મક અધ્યયન',
    compare_synastry: 'આંતર-કુંડળી દૃષ્ટિઓ',
    compare_compatibility: 'અનુકૂળતા',
  },
  glue: {
    period_now: 'ચાલી રહેલી દશા છે',
    in_house: '{n} ભાવમાં',
    in_sign: '{sign} રાશિમાં',
    nakshatra_in: '{nak} નક્ષત્રમાં',
    bullet: '•',
    sentence_end: '.',
    and: 'અને',
  },
  house: {
    1: 'સ્વ, શક્તિ અને બાહ્ય ઓળખ',
    2: 'ધન, કુટુંબ, વાણી',
    3: 'ભાઈ-બહેન, સાહસ',
    4: 'ઘર, માતા, ભાવનાત્મક પાયો',
    5: 'સંતાન, સર્જન, બુદ્ધિ',
    6: 'શત્રુ, ઋણ, સેવા',
    7: 'જીવનસાથી, લગ્ન',
    8: 'આયુ, ગૂઢ, રૂપાંતર',
    9: 'ભાગ્ય, ધર્મ, ઉચ્ચ જ્ઞાન',
    10: 'કારકિર્દી, માન, સાર્વજનિક કર્મ',
    11: 'લાભ, મિત્રો, મોટા ભાઈ',
    12: 'વ્યય, વિદેશ, મોક્ષ',
  },
  planet: {
    SU: 'આત્મા, અધિકાર, તેજ',
    MO: 'મન, માતા, ભાવ',
    MA: 'ઊર્જા, સાહસ, સંકલ્પ',
    ME: 'બુદ્ધિ, વાણી, વેપાર',
    JU: 'જ્ઞાન, ધર્મ, વિસ્તાર',
    VE: 'પ્રેમ, સૌંદર્ય, શુદ્ધિ',
    SA: 'શિસ્ત, આયુ, કર્મ',
    RA: 'ઈચ્છા, વિદેશ, અપરંપરાગત',
    KE: 'વૈરાગ્ય, મોક્ષ, અદ્રશ્ય',
  },
  rashiTone: {
    1: 'અગ્નિ સમ', 2: 'સ્થિર', 3: 'જિજ્ઞાસુ',
    4: 'સંવેદનશીલ', 5: 'રાજસી', 6: 'વિશ્લેષક',
    7: 'કૂટનીતિક', 8: 'ગહન', 9: 'દાર્શનિક',
    10: 'મહત્ત્વાકાંક્ષી', 11: 'નવીન', 12: 'કરુણ',
  },
  dashaTheme: {
    SU: 'અધિકાર અને આત્મ-પ્રકાશનો કાળ',
    MO: 'ભાવ અને પરિવારનો કાળ',
    MA: 'ક્રિયા અને સંઘર્ષનો કાળ',
    ME: 'અધ્યયન અને વેપારનો કાળ',
    JU: 'વિસ્તાર અને કૃપાનો કાળ',
    VE: 'સંબંધ અને કલાનો કાળ',
    SA: 'શિસ્ત અને કર્મ-ફળનો કાળ',
    RA: 'મહત્ત્વાકાંક્ષા અને વિદેશનો કાળ',
    KE: 'વૈરાગ્ય અને ગૂઢનો કાળ',
  },
  yoga: {
    'Raja Yoga': 'રાજ યોગ — પદ-પ્રતિષ્ઠાનો યોગ',
    'Dhana Yoga': 'ધન યોગ — સમૃદ્ધિ-કારક',
    'Gajakesari': 'ગજકેસરી — ચંદ્ર-ગુરુ સંયોગ',
    'Pancha Mahapurusha': 'પંચ મહાપુરુષ',
    'Neecha Bhanga': 'નીચ-ભંગ — ગુપ્ત બળ',
    'Vipareeta': 'વિપરીત રાજ યોગ',
  },
  ordinal: (n) => `${n}મું`,
  weekday: ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર'],
  compatibility: {
    excellent: 'ઉત્તમ — ગાઢ સંગત',
    good: 'સારું — પ્રયાસથી સુખકર',
    moderate: 'મધ્યમ',
    challenging: 'કઠિન — સતત સમજદારી જરૂરી',
  },
  today: {
    nakshatra_today: 'આજનું નક્ષત્ર {nak} છે',
    tithi_today: 'તિથિ: {tithi} ({paksha} પક્ષ)',
    yoga_today: 'યોગ: {yoga}',
    sun_in: 'સૂર્ય {sign} માં છે',
    moon_in: 'ચંદ્ર {sign} માં છે',
    auspicious_window: 'અભિજિત મુહૂર્ત: {window}',
    inauspicious_window: 'રાહુ કાળ: {window}',
    dasha_running: 'આપ {maha}/{antar} માં છો',
    journal_lead: '{weekday}, {date} ના રોજ આકાશ આપને આપે છે',
    journal_close: 'આજના સ્વામી {lord} ને વંદન કરી સુવિચારિત કર્મ કરવું શુભ છે.',
  },
  tone: {
    strong: 'બળવાન', weak: 'નિર્બળ', exalted: 'ઉચ્ચ', debilitated: 'નીચ',
    own_sign: 'સ્વ-રાશિમાં', retrograde: 'વક્રી', combust: 'અસ્ત',
    benefic: 'શુભ', malefic: 'પાપી',
  },
};

// ─── Sanskrit ────────────────────────────────────────────────────────────────
const SA: Phrasebook = {
  section: {
    overview: 'अवलोकनम्',
    personality: 'स्वभावः',
    career: 'वृत्तिः',
    relationships: 'सम्बन्धाः',
    wealth: 'धनम्',
    health: 'आरोग्यम्',
    spirituality: 'अध्यात्ममार्गः',
    dasha: 'वर्तमानदशा',
    transit: 'गोचरः',
    yoga: 'सक्रिययोगाः',
    today: 'अद्यतनं नभः',
    journal_intro: 'दैनन्दिनी',
    compare_intro: 'तुलनात्मकं विवेचनम्',
    compare_synastry: 'अन्तर्जातकदृष्टयः',
    compare_compatibility: 'अनुकूलता',
  },
  glue: {
    period_now: 'सम्प्रति दशा वर्तते',
    in_house: '{n} भावे',
    in_sign: '{sign} राशौ',
    nakshatra_in: '{nak} नक्षत्रे',
    bullet: '•',
    sentence_end: '॥',
    and: 'च',
  },
  house: {
    1: 'स्वयम्, बलम्, स्वरूपम्',
    2: 'धनम्, कुटुम्बम्, वाक्',
    3: 'भ्रातरः, साहसम्',
    4: 'गृहम्, माता, हृदयम्',
    5: 'सन्ततिः, बुद्धिः',
    6: 'शत्रुः, ऋणम्, सेवा',
    7: 'दाम्पत्यम्, विवाहः',
    8: 'आयुः, गूढः, परिवर्तनम्',
    9: 'भाग्यम्, धर्मः',
    10: 'कर्म, यशः',
    11: 'लाभः, मित्राणि',
    12: 'व्ययः, परदेशः, मोक्षः',
  },
  planet: {
    SU: 'आत्मा, राजसत्ता',
    MO: 'मनः, माता',
    MA: 'ऊर्जा, साहसम्',
    ME: 'बुद्धिः, वाक्',
    JU: 'ज्ञानम्, धर्मः',
    VE: 'प्रेम, सौन्दर्यम्',
    SA: 'अनुशासनम्, कर्म',
    RA: 'इच्छा, परदेशः',
    KE: 'वैराग्यम्, मोक्षः',
  },
  rashiTone: {
    1: 'अग्निसमः', 2: 'स्थिरः', 3: 'चञ्चलः',
    4: 'संवेदी', 5: 'राजसः', 6: 'विश्लेषकः',
    7: 'कूटः', 8: 'गूढः', 9: 'दार्शनिकः',
    10: 'महत्वाकांक्षी', 11: 'नूतनः', 12: 'करुणः',
  },
  dashaTheme: {
    SU: 'राजसत्तायाः कालः',
    MO: 'मनोभावस्य कालः',
    MA: 'क्रियायाः कालः',
    ME: 'विद्यायाः वाणिज्यस्य च कालः',
    JU: 'विस्तारस्य कालः',
    VE: 'प्रेम्णः कलायाः च कालः',
    SA: 'अनुशासनस्य कालः',
    RA: 'अभिलाषायाः कालः',
    KE: 'वैराग्यस्य कालः',
  },
  yoga: {
    'Raja Yoga': 'राजयोगः',
    'Dhana Yoga': 'धनयोगः',
    'Gajakesari': 'गजकेसरीयोगः',
    'Pancha Mahapurusha': 'पञ्चमहापुरुषयोगः',
    'Neecha Bhanga': 'नीचभङ्गयोगः',
    'Vipareeta': 'विपरीतराजयोगः',
  },
  ordinal: (n) => `${n}तमः`,
  weekday: ['रविवासरः', 'सोमवासरः', 'मङ्गलवासरः', 'बुधवासरः', 'गुरुवासरः', 'शुक्रवासरः', 'शनिवासरः'],
  compatibility: {
    excellent: 'उत्तमम्',
    good: 'शुभम्',
    moderate: 'मध्यमम्',
    challenging: 'कठिनम्',
  },
  today: {
    nakshatra_today: 'अद्यतनं नक्षत्रं {nak}',
    tithi_today: 'तिथिः {tithi} ({paksha}पक्षः)',
    yoga_today: 'योगः {yoga}',
    sun_in: 'सूर्यः {sign} राशौ',
    moon_in: 'चन्द्रः {sign} राशौ',
    auspicious_window: 'अभिजिन्मुहूर्तः {window}',
    inauspicious_window: 'राहुकालः {window}',
    dasha_running: 'भवान् {maha}/{antar} दशायां वर्तते',
    journal_lead: '{weekday} दिने, {date}, नभो ददाति',
    journal_close: 'अद्य {lord} स्मरणेन सत्कर्म कुर्यात्।',
  },
  tone: {
    strong: 'बलवान्', weak: 'दुर्बलः', exalted: 'उच्चस्थः', debilitated: 'नीचस्थः',
    own_sign: 'स्वराशौ', retrograde: 'वक्री', combust: 'अस्तङ्गतः',
    benefic: 'शुभः', malefic: 'पापी',
  },
};

// ─── Public API ─────────────────────────────────────────────────────────────

const BANKS: Record<Locale, Phrasebook> = { en: EN, hi: HI, gu: GU, sa: SA };

export function getPhrasebook(locale: Locale): Phrasebook {
  return BANKS[locale] ?? BANKS.en;
}

/** Substitute {placeholders} in a template with values from ctx. */
export function fill(template: string, ctx: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(ctx[k] ?? ''));
}
