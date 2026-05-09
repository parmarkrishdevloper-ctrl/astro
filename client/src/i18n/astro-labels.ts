// Astro-label dictionaries — translate computed result values at render time.
//
// Covers:
//   - 9 planets (grahas)
//   - 12 rashis (signs)
//   - 27 nakshatras
//   - 12 houses (bhavas) + 12 house topics
//   - 7 Jaimini karakas
//   - 7 weekdays (varas)
//   - 30 tithis + 2 pakshas
//   - 11 karanas
//   - 27 panchang yogas
//   - Classical Vedic yoga names (extensible)
//
// Every entry has en / hi / gu / sa variants. Sanskrit (sa) is rendered in
// Devanagari with classical (saṃskṛta) word forms.

import { Locale } from './index';

export type AstroLang = 'en' | 'hi' | 'gu' | 'sa';

// ─── 9 Grahas ───────────────────────────────────────────────────────────────
export const PLANET_LABELS: Record<string, Record<AstroLang, string>> = {
  SU: { en: 'Sun',     hi: 'सूर्य',  gu: 'સૂર્ય',  sa: 'सूर्यः' },
  MO: { en: 'Moon',    hi: 'चंद्र',  gu: 'ચંદ્ર',  sa: 'चन्द्रः' },
  MA: { en: 'Mars',    hi: 'मंगल',  gu: 'મંગળ',  sa: 'मङ्गलः' },
  ME: { en: 'Mercury', hi: 'बुध',   gu: 'બુધ',   sa: 'बुधः' },
  JU: { en: 'Jupiter', hi: 'गुरु',  gu: 'ગુરુ',  sa: 'गुरुः' },
  VE: { en: 'Venus',   hi: 'शुक्र',  gu: 'શુક્ર',  sa: 'शुक्रः' },
  SA: { en: 'Saturn',  hi: 'शनि',   gu: 'શનિ',   sa: 'शनिः' },
  RA: { en: 'Rahu',    hi: 'राहु',  gu: 'રાહુ',  sa: 'राहुः' },
  KE: { en: 'Ketu',    hi: 'केतु',  gu: 'કેતુ',  sa: 'केतुः' },
};

// ─── Short 1-2 char planet glyphs (for compact chart cells) ─────────────────
export const PLANET_SHORT_LABELS: Record<string, Record<AstroLang, string>> = {
  SU: { en: 'SU', hi: 'सू', gu: 'સૂ', sa: 'सू' },
  MO: { en: 'MO', hi: 'चं', gu: 'ચં', sa: 'चं' },
  MA: { en: 'MA', hi: 'मं', gu: 'મં', sa: 'मं' },
  ME: { en: 'ME', hi: 'बु', gu: 'બુ', sa: 'बु' },
  JU: { en: 'JU', hi: 'गु', gu: 'ગુ', sa: 'गु' },
  VE: { en: 'VE', hi: 'शु', gu: 'શુ', sa: 'शु' },
  SA: { en: 'SA', hi: 'श',  gu: 'શ',  sa: 'श'  },
  RA: { en: 'RA', hi: 'रा', gu: 'રા', sa: 'रा' },
  KE: { en: 'KE', hi: 'के', gu: 'કે', sa: 'के' },
};

// ─── Short rashi glyph (1-2 chars, for chart cells) ─────────────────────────
export const RASHI_SHORT_LABELS: Record<number, Record<AstroLang, string>> = {
  1:  { en: 'Ar', hi: 'मे', gu: 'મે', sa: 'मे' },
  2:  { en: 'Ta', hi: 'वृ', gu: 'વૃ', sa: 'वृ' },
  3:  { en: 'Ge', hi: 'मि', gu: 'મિ', sa: 'मि' },
  4:  { en: 'Cn', hi: 'क',  gu: 'ક',  sa: 'क'  },
  5:  { en: 'Le', hi: 'सिं', gu: 'સિં', sa: 'सिं' },
  6:  { en: 'Vi', hi: 'क'+'न्या', gu: 'કન્યા', sa: 'क'+'न्या' },
  7:  { en: 'Li', hi: 'तु', gu: 'તુ', sa: 'तु' },
  8:  { en: 'Sc', hi: 'वृ'+'श्चि', gu: 'વૃશ્ચિ', sa: 'वृ'+'श्चि' },
  9:  { en: 'Sg', hi: 'ध',  gu: 'ધ',  sa: 'ध'  },
  10: { en: 'Cp', hi: 'म',  gu: 'મ',  sa: 'म'  },
  11: { en: 'Aq', hi: 'कुं', gu: 'કું', sa: 'कुं' },
  12: { en: 'Pi', hi: 'मी', gu: 'મી', sa: 'मी' },
};

// ─── 12 Rashis ──────────────────────────────────────────────────────────────
export const RASHI_LABELS: Record<number, Record<AstroLang, string>> = {
  1:  { en: 'Aries',       hi: 'मेष',        gu: 'મેષ',        sa: 'मेषः' },
  2:  { en: 'Taurus',      hi: 'वृषभ',       gu: 'વૃષભ',       sa: 'वृषभः' },
  3:  { en: 'Gemini',      hi: 'मिथुन',      gu: 'મિથુન',      sa: 'मिथुनम्' },
  4:  { en: 'Cancer',      hi: 'कर्क',       gu: 'કર્ક',       sa: 'कर्कः' },
  5:  { en: 'Leo',         hi: 'सिंह',       gu: 'સિંહ',       sa: 'सिंहः' },
  6:  { en: 'Virgo',       hi: 'कन्या',      gu: 'કન્યા',      sa: 'कन्या' },
  7:  { en: 'Libra',       hi: 'तुला',       gu: 'તુલા',       sa: 'तुला' },
  8:  { en: 'Scorpio',     hi: 'वृश्चिक',     gu: 'વૃશ્ચિક',     sa: 'वृश्चिकः' },
  9:  { en: 'Sagittarius', hi: 'धनु',        gu: 'ધનુ',        sa: 'धनुः' },
  10: { en: 'Capricorn',   hi: 'मकर',        gu: 'મકર',        sa: 'मकरः' },
  11: { en: 'Aquarius',    hi: 'कुम्भ',       gu: 'કુંભ',       sa: 'कुम्भः' },
  12: { en: 'Pisces',      hi: 'मीन',        gu: 'મીન',        sa: 'मीनः' },
};

// ─── 27 Nakshatras ──────────────────────────────────────────────────────────
export const NAKSHATRA_LABELS: Record<number, Record<AstroLang, string>> = {
  1:  { en: 'Ashwini',         hi: 'अश्विनी',       gu: 'અશ્વિની',       sa: 'अश्विनी' },
  2:  { en: 'Bharani',         hi: 'भरणी',         gu: 'ભરણી',         sa: 'भरणी' },
  3:  { en: 'Krittika',        hi: 'कृत्तिका',      gu: 'કૃત્તિકા',      sa: 'कृत्तिका' },
  4:  { en: 'Rohini',          hi: 'रोहिणी',       gu: 'રોહિણી',       sa: 'रोहिणी' },
  5:  { en: 'Mrigashira',      hi: 'मृगशिरा',      gu: 'મૃગશીરા',      sa: 'मृगशिरा' },
  6:  { en: 'Ardra',           hi: 'आर्द्रा',       gu: 'આર્દ્રા',       sa: 'आर्द्रा' },
  7:  { en: 'Punarvasu',       hi: 'पुनर्वसु',      gu: 'પુનર્વસુ',      sa: 'पुनर्वसु' },
  8:  { en: 'Pushya',          hi: 'पुष्य',         gu: 'પુષ્ય',         sa: 'पुष्यः' },
  9:  { en: 'Ashlesha',        hi: 'आश्लेषा',       gu: 'આશ્લેષા',       sa: 'आश्लेषा' },
  10: { en: 'Magha',           hi: 'मघा',          gu: 'મઘા',          sa: 'मघा' },
  11: { en: 'Purva Phalguni',  hi: 'पूर्व फाल्गुनी', gu: 'પૂર્વ ફાલ્ગુની', sa: 'पूर्वफल्गुनी' },
  12: { en: 'Uttara Phalguni', hi: 'उत्तर फाल्गुनी', gu: 'ઉત્તર ફાલ્ગુની', sa: 'उत्तरफल्गुनी' },
  13: { en: 'Hasta',           hi: 'हस्त',          gu: 'હસ્ત',          sa: 'हस्तः' },
  14: { en: 'Chitra',          hi: 'चित्रा',        gu: 'ચિત્રા',        sa: 'चित्रा' },
  15: { en: 'Swati',           hi: 'स्वाति',        gu: 'સ્વાતિ',        sa: 'स्वाती' },
  16: { en: 'Vishakha',        hi: 'विशाखा',        gu: 'વિશાખા',        sa: 'विशाखा' },
  17: { en: 'Anuradha',        hi: 'अनुराधा',       gu: 'અનુરાધા',       sa: 'अनुराधा' },
  18: { en: 'Jyeshtha',        hi: 'ज्येष्ठा',       gu: 'જ્યેષ્ઠા',       sa: 'ज्येष्ठा' },
  19: { en: 'Mula',            hi: 'मूल',           gu: 'મૂળ',           sa: 'मूलम्' },
  20: { en: 'Purva Ashadha',   hi: 'पूर्वाषाढ़ा',    gu: 'પૂર્વાષાઢા',    sa: 'पूर्वाषाढा' },
  21: { en: 'Uttara Ashadha',  hi: 'उत्तराषाढ़ा',    gu: 'ઉત્તરાષાઢા',    sa: 'उत्तराषाढा' },
  22: { en: 'Shravana',        hi: 'श्रवण',          gu: 'શ્રવણ',          sa: 'श्रवणः' },
  23: { en: 'Dhanishta',       hi: 'धनिष्ठा',        gu: 'ધનિષ્ઠા',        sa: 'धनिष्ठा' },
  24: { en: 'Shatabhisha',     hi: 'शतभिषा',         gu: 'શતભિષા',         sa: 'शतभिषा' },
  25: { en: 'Purva Bhadrapada',hi: 'पूर्व भाद्रपद',   gu: 'પૂર્વ ભાદ્રપદ',   sa: 'पूर्वभाद्रपदा' },
  26: { en: 'Uttara Bhadrapada',hi: 'उत्तर भाद्रपद', gu: 'ઉત્તર ભાદ્રપદ', sa: 'उत्तरभाद्रपदा' },
  27: { en: 'Revati',          hi: 'रेवती',          gu: 'રેવતી',          sa: 'रेवती' },
};

// ─── Weekdays (vara) ───────────────────────────────────────────────────────
export const VARA_LABELS: Record<string, Record<AstroLang, string>> = {
  Sunday:    { en: 'Sunday',    hi: 'रविवार',    gu: 'રવિવાર',    sa: 'रविवासरः' },
  Monday:    { en: 'Monday',    hi: 'सोमवार',    gu: 'સોમવાર',    sa: 'सोमवासरः' },
  Tuesday:   { en: 'Tuesday',   hi: 'मंगलवार',   gu: 'મંગળવાર',   sa: 'भौमवासरः' },
  Wednesday: { en: 'Wednesday', hi: 'बुधवार',    gu: 'બુધવાર',    sa: 'बुधवासरः' },
  Thursday:  { en: 'Thursday',  hi: 'गुरुवार',    gu: 'ગુરુવાર',    sa: 'गुरुवासरः' },
  Friday:    { en: 'Friday',    hi: 'शुक्रवार',   gu: 'શુક્રવાર',   sa: 'शुक्रवासरः' },
  Saturday:  { en: 'Saturday',  hi: 'शनिवार',    gu: 'શનિવાર',    sa: 'शनिवासरः' },
};

// ─── Pakshas + Tithis ──────────────────────────────────────────────────────
export const PAKSHA_LABELS: Record<string, Record<AstroLang, string>> = {
  Shukla:  { en: 'Shukla',  hi: 'शुक्ल',  gu: 'શુક્લ',  sa: 'शुक्लपक्षः' },
  Krishna: { en: 'Krishna', hi: 'कृष्ण',  gu: 'કૃષ્ણ',  sa: 'कृष्णपक्षः' },
};

// Tithi names (1..15 repeated Shukla/Krishna, 30 = Amavasya, 15 = Purnima)
export const TITHI_NAMES: Record<string, Record<AstroLang, string>> = {
  Pratipada:    { en: 'Pratipada',     hi: 'प्रतिपदा',      gu: 'પ્રતિપદા',      sa: 'प्रतिपत्' },
  Dwitiya:      { en: 'Dwitiya',       hi: 'द्वितीया',      gu: 'દ્વિતીયા',      sa: 'द्वितीया' },
  Tritiya:      { en: 'Tritiya',       hi: 'तृतीया',       gu: 'તૃતીયા',       sa: 'तृतीया' },
  Chaturthi:    { en: 'Chaturthi',     hi: 'चतुर्थी',       gu: 'ચતુર્થી',       sa: 'चतुर्थी' },
  Panchami:     { en: 'Panchami',      hi: 'पंचमी',        gu: 'પંચમી',        sa: 'पञ्चमी' },
  Shashthi:     { en: 'Shashthi',      hi: 'षष्ठी',        gu: 'ષષ્ઠી',        sa: 'षष्ठी' },
  Saptami:      { en: 'Saptami',       hi: 'सप्तमी',       gu: 'સપ્તમી',       sa: 'सप्तमी' },
  Ashtami:      { en: 'Ashtami',       hi: 'अष्टमी',       gu: 'અષ્ટમી',       sa: 'अष्टमी' },
  Navami:       { en: 'Navami',        hi: 'नवमी',         gu: 'નવમી',         sa: 'नवमी' },
  Dashami:      { en: 'Dashami',       hi: 'दशमी',         gu: 'દશમી',         sa: 'दशमी' },
  Ekadashi:     { en: 'Ekadashi',      hi: 'एकादशी',       gu: 'એકાદશી',       sa: 'एकादशी' },
  Dwadashi:     { en: 'Dwadashi',      hi: 'द्वादशी',       gu: 'દ્વાદશી',       sa: 'द्वादशी' },
  Trayodashi:   { en: 'Trayodashi',    hi: 'त्रयोदशी',      gu: 'ત્રયોદશી',      sa: 'त्रयोदशी' },
  Chaturdashi:  { en: 'Chaturdashi',   hi: 'चतुर्दशी',      gu: 'ચતુર્દશી',      sa: 'चतुर्दशी' },
  Purnima:      { en: 'Purnima',       hi: 'पूर्णिमा',     gu: 'પૂર્ણિમા',     sa: 'पूर्णिमा' },
  Amavasya:     { en: 'Amavasya',      hi: 'अमावस्या',     gu: 'અમાવસ્યા',     sa: 'अमावस्या' },
};

// ─── Karanas ───────────────────────────────────────────────────────────────
export const KARANA_LABELS: Record<string, Record<AstroLang, string>> = {
  Bava:        { en: 'Bava',        hi: 'बव',         gu: 'બવ',         sa: 'बवम्' },
  Balava:      { en: 'Balava',      hi: 'बालव',       gu: 'બાલવ',       sa: 'बालवम्' },
  Kaulava:     { en: 'Kaulava',     hi: 'कौलव',       gu: 'કૌલવ',       sa: 'कौलवम्' },
  Taitila:     { en: 'Taitila',     hi: 'तैतिल',       gu: 'તૈતિલ',       sa: 'तैतिलम्' },
  Gara:        { en: 'Gara',        hi: 'गर',         gu: 'ગર',         sa: 'गरजम्' },
  Vanija:      { en: 'Vanija',      hi: 'वणिज',       gu: 'વણિજ',       sa: 'वणिजम्' },
  Vishti:      { en: 'Vishti',      hi: 'विष्टि',      gu: 'વિષ્ટિ',      sa: 'विष्टिः' },
  Shakuni:     { en: 'Shakuni',     hi: 'शकुनि',      gu: 'શકુનિ',      sa: 'शकुनिः' },
  Chatushpada: { en: 'Chatushpada', hi: 'चतुष्पद',    gu: 'ચતુષ્પદ',    sa: 'चतुष्पदम्' },
  Naga:        { en: 'Naga',        hi: 'नाग',        gu: 'નાગ',        sa: 'नागः' },
  Kimstughna:  { en: 'Kimstughna',  hi: 'किंस्तुघ्न',   gu: 'કિંસ્તુઘ્ન',   sa: 'किंस्तुघ्नम्' },
};

// ─── Panchang yogas (27) ───────────────────────────────────────────────────
export const PYOGA_LABELS: Record<string, Record<AstroLang, string>> = {
  Vishkumbha:  { en: 'Vishkumbha',   hi: 'विष्कुम्भ',   gu: 'વિષ્કુંભ',   sa: 'विष्कम्भः' },
  Preeti:      { en: 'Preeti',       hi: 'प्रीति',      gu: 'પ્રીતિ',      sa: 'प्रीतिः' },
  Ayushman:    { en: 'Ayushman',     hi: 'आयुष्मान',    gu: 'આયુષ્માન',    sa: 'आयुष्मान्' },
  Saubhagya:   { en: 'Saubhagya',    hi: 'सौभाग्य',    gu: 'સૌભાગ્ય',    sa: 'सौभाग्यम्' },
  Shobhana:    { en: 'Shobhana',     hi: 'शोभन',       gu: 'શોભન',       sa: 'शोभनम्' },
  Atiganda:    { en: 'Atiganda',     hi: 'अतिगण्ड',     gu: 'અતિગંડ',     sa: 'अतिगण्डः' },
  Sukarman:    { en: 'Sukarman',     hi: 'सुकर्मा',     gu: 'સુકર્મા',     sa: 'सुकर्मा' },
  Dhriti:      { en: 'Dhriti',       hi: 'धृति',       gu: 'ધૃતિ',       sa: 'धृतिः' },
  Shoola:      { en: 'Shoola',       hi: 'शूल',        gu: 'શૂલ',        sa: 'शूलम्' },
  Ganda:       { en: 'Ganda',        hi: 'गण्ड',       gu: 'ગંડ',        sa: 'गण्डः' },
  Vriddhi:     { en: 'Vriddhi',      hi: 'वृद्धि',      gu: 'વૃદ્ધિ',      sa: 'वृद्धिः' },
  Dhruva:      { en: 'Dhruva',       hi: 'ध्रुव',       gu: 'ધ્રુવ',       sa: 'ध्रुवः' },
  Vyaghata:    { en: 'Vyaghata',     hi: 'व्याघात',    gu: 'વ્યાઘાત',    sa: 'व्याघातः' },
  Harshana:    { en: 'Harshana',     hi: 'हर्षण',      gu: 'હર્ષણ',      sa: 'हर्षणः' },
  Vajra:       { en: 'Vajra',        hi: 'वज्र',       gu: 'વજ્ર',       sa: 'वज्रम्' },
  Siddhi:      { en: 'Siddhi',       hi: 'सिद्धि',      gu: 'સિદ્ધિ',      sa: 'सिद्धिः' },
  Vyatipata:   { en: 'Vyatipata',    hi: 'व्यतीपात',   gu: 'વ્યતીપાત',   sa: 'व्यतीपातः' },
  Variyan:     { en: 'Variyan',      hi: 'वरीयान्',    gu: 'વરીયાન',    sa: 'वरीयान्' },
  Parigha:     { en: 'Parigha',      hi: 'परिघ',       gu: 'પરિઘ',       sa: 'परिघः' },
  Shiva:       { en: 'Shiva',        hi: 'शिव',        gu: 'શિવ',        sa: 'शिवः' },
  Siddha:      { en: 'Siddha',       hi: 'सिद्ध',       gu: 'સિદ્ધ',       sa: 'सिद्धः' },
  Sadhya:      { en: 'Sadhya',       hi: 'साध्य',       gu: 'સાધ્ય',       sa: 'साध्यः' },
  Shubha:      { en: 'Shubha',       hi: 'शुभ',         gu: 'શુભ',         sa: 'शुभः' },
  Shukla:      { en: 'Shukla',       hi: 'शुक्ल',       gu: 'શુક્લ',       sa: 'शुक्लः' },
  Brahma:      { en: 'Brahma',       hi: 'ब्रह्म',       gu: 'બ્રહ્મ',       sa: 'ब्रह्म' },
  Aindra:      { en: 'Aindra',       hi: 'इन्द्र',       gu: 'ઇન્દ્ર',       sa: 'ऐन्द्रः' },
  Vaidhriti:   { en: 'Vaidhriti',    hi: 'वैधृति',      gu: 'વૈધૃતિ',      sa: 'वैधृतिः' },
};

// ─── Houses — topic label ──────────────────────────────────────────────────
export const HOUSE_LABELS: Record<number, Record<AstroLang, string>> = {
  1:  { en: 'Self · Body',           hi: 'लग्न · शरीर',      gu: 'લગ્ન · શરીર',      sa: 'तनुः · देहः' },
  2:  { en: 'Wealth · Speech',       hi: 'धन · वाणी',       gu: 'ધન · વાણી',       sa: 'धनम् · वाक्' },
  3:  { en: 'Siblings · Effort',     hi: 'भाई · साहस',       gu: 'ભાઈ · સાહસ',       sa: 'सहजः · पराक्रमः' },
  4:  { en: 'Home · Mother',         hi: 'घर · माता',        gu: 'ઘર · માતા',        sa: 'सुखम् · माता' },
  5:  { en: 'Children · Mind',       hi: 'संतान · बुद्धि',    gu: 'સંતાન · બુદ્ધિ',    sa: 'सुतः · बुद्धिः' },
  6:  { en: 'Enemies · Health',      hi: 'शत्रु · रोग',       gu: 'શત્રુ · રોગ',       sa: 'रिपुः · रोगः' },
  7:  { en: 'Spouse · Partnership',  hi: 'जीवनसाथी',        gu: 'જીવનસાથી',        sa: 'जायाभावः' },
  8:  { en: 'Transformation',        hi: 'आयु · परिवर्तन',   gu: 'આયુ · પરિવર્તન',   sa: 'आयुः · परिवर्तनम्' },
  9:  { en: 'Fortune · Dharma',      hi: 'भाग्य · धर्म',      gu: 'ભાગ્ય · ધર્મ',      sa: 'भाग्यम् · धर्मः' },
  10: { en: 'Career · Karma',        hi: 'कर्म · व्यवसाय',    gu: 'કર્મ · વ્યવસાય',    sa: 'कर्म · व्यवसायः' },
  11: { en: 'Gains · Friends',       hi: 'लाभ · मित्र',       gu: 'લાભ · મિત્ર',       sa: 'लाभः · मित्राणि' },
  12: { en: 'Losses · Moksha',       hi: 'व्यय · मोक्ष',      gu: 'વ્યય · મોક્ષ',      sa: 'व्ययः · मोक्षः' },
};

// ─── Jaimini karakas ───────────────────────────────────────────────────────
export const KARAKA_LABELS: Record<string, Record<AstroLang, string>> = {
  AK:  { en: 'Atmakaraka',   hi: 'आत्मकारक',   gu: 'આત્મકારક',   sa: 'आत्मकारकः' },
  AmK: { en: 'Amatyakaraka', hi: 'अमात्यकारक', gu: 'અમાત્યકારક', sa: 'अमात्यकारकः' },
  BK:  { en: 'Bhratrikaraka',hi: 'भ्रातृकारक',  gu: 'ભ્રાતૃકારક',  sa: 'भ्रातृकारकः' },
  MK:  { en: 'Matrikaraka',  hi: 'मातृकारक',   gu: 'માતૃકારક',   sa: 'मातृकारकः' },
  PK:  { en: 'Putrakaraka',  hi: 'पुत्रकारक',   gu: 'પુત્રકારક',   sa: 'पुत्रकारकः' },
  GK:  { en: 'Gnatikaraka',  hi: 'ज्ञातिकारक',  gu: 'જ્ઞાતિકારક',  sa: 'ज्ञातिकारकः' },
  DK:  { en: 'Darakaraka',   hi: 'दारकारक',    gu: 'દારકારક',    sa: 'दारकारकः' },
};

// ─── Classical yoga names (core set; engine also ships many more) ──────────
export const YOGA_LABELS: Record<string, Record<AstroLang, string>> = {
  'Ruchaka Yoga':           { en: 'Ruchaka Yoga',           hi: 'रुचक योग',           gu: 'રુચક યોગ',           sa: 'रुचकयोगः' },
  'Bhadra Yoga':            { en: 'Bhadra Yoga',            hi: 'भद्र योग',           gu: 'ભદ્ર યોગ',           sa: 'भद्रयोगः' },
  'Hamsa Yoga':             { en: 'Hamsa Yoga',             hi: 'हंस योग',            gu: 'હંસ યોગ',            sa: 'हंसयोगः' },
  'Malavya Yoga':           { en: 'Malavya Yoga',           hi: 'मालव्य योग',         gu: 'માલવ્ય યોગ',         sa: 'मालव्ययोगः' },
  'Shasha Yoga':            { en: 'Shasha Yoga',            hi: 'शश योग',             gu: 'શશ યોગ',             sa: 'शशयोगः' },
  'Gajakesari Yoga':        { en: 'Gajakesari Yoga',        hi: 'गजकेसरी योग',        gu: 'ગજકેસરી યોગ',        sa: 'गजकेसरीयोगः' },
  'Budhaditya Yoga':        { en: 'Budhaditya Yoga',        hi: 'बुधादित्य योग',      gu: 'બુધાદિત્ય યોગ',      sa: 'बुधादित्ययोगः' },
  'Chandra-Mangala Yoga':   { en: 'Chandra-Mangala Yoga',   hi: 'चन्द्र-मंगल योग',     gu: 'ચંદ્ર-મંગળ યોગ',     sa: 'चन्द्रमङ्गलयोगः' },
  'Sunapha Yoga':           { en: 'Sunapha Yoga',           hi: 'सुनफा योग',          gu: 'સુનફા યોગ',          sa: 'सुनफायोगः' },
  'Anapha Yoga':            { en: 'Anapha Yoga',            hi: 'अनफा योग',           gu: 'અનફા યોગ',           sa: 'अनफायोगः' },
  'Durudhara Yoga':         { en: 'Durudhara Yoga',         hi: 'दुरुधरा योग',         gu: 'દુરુધરા યોગ',         sa: 'दुरुधरायोगः' },
  'Kemadruma Yoga':         { en: 'Kemadruma Yoga',         hi: 'केमद्रुम योग',        gu: 'કેમદ્રુમ યોગ',        sa: 'केमद्रुमयोगः' },
  'Vesi Yoga':              { en: 'Vesi Yoga',              hi: 'वेशी योग',           gu: 'વેશી યોગ',           sa: 'वेशीयोगः' },
  'Vosi Yoga':              { en: 'Vosi Yoga',              hi: 'वोशी योग',           gu: 'વોશી યોગ',           sa: 'वोशीयोगः' },
  'Raja Yoga':              { en: 'Raja Yoga',              hi: 'राज योग',            gu: 'રાજ યોગ',            sa: 'राजयोगः' },
  'Dharma-Karma Adhipati Yoga': { en: 'Dharma-Karma Adhipati', hi: 'धर्म-कर्म अधिपति', gu: 'ધર્મ-કર્મ અધિપતિ', sa: 'धर्मकर्माधिपतियोगः' },
  'Lakshmi Yoga':           { en: 'Lakshmi Yoga',           hi: 'लक्ष्मी योग',         gu: 'લક્ષ્મી યોગ',         sa: 'लक्ष्मीयोगः' },
  'Saraswati Yoga':         { en: 'Saraswati Yoga',         hi: 'सरस्वती योग',        gu: 'સરસ્વતી યોગ',        sa: 'सरस्वतीयोगः' },
  'Amala Yoga':             { en: 'Amala Yoga',             hi: 'अमल योग',           gu: 'અમલ યોગ',           sa: 'अमलयोगः' },
  'Adhi Yoga':              { en: 'Adhi Yoga',              hi: 'अधि योग',           gu: 'અધિ યોગ',           sa: 'अधियोगः' },
  // Extra safety-net entries — server normally localizes these via the
  // yogasDb.<id>.name phrasebook key, but if a request comes back with an
  // English yoga name, al.yoga(name) still resolves correctly.
  'Dhana Yoga':             { en: 'Dhana Yoga',             hi: 'धन योग',            gu: 'ધન યોગ',            sa: 'धनयोगः' },
  'Mahalakshmi Yoga':       { en: 'Mahalakshmi Yoga',       hi: 'महालक्ष्मी योग',     gu: 'મહાલક્ષ્મી યોગ',     sa: 'महालक्ष्मीयोगः' },
  'Kala Sarpa Yoga':        { en: 'Kala Sarpa Yoga',        hi: 'काल सर्प योग',       gu: 'કાળ સર્પ યોગ',       sa: 'कालसर्पयोगः' },
  'Daridra Yoga':           { en: 'Daridra Yoga',           hi: 'दरिद्र योग',         gu: 'દરિદ્ર યોગ',         sa: 'दरिद्रयोगः' },
  'Shakata Yoga':           { en: 'Shakata Yoga',           hi: 'शकट योग',           gu: 'શકટ યોગ',           sa: 'शकटयोगः' },
  'Kapata Yoga':            { en: 'Kapata Yoga',            hi: 'कपट योग',           gu: 'કપટ યોગ',           sa: 'कपटयोगः' },
  'Guru Chandala Yoga':     { en: 'Guru Chandala Yoga',     hi: 'गुरु चांडाल योग',    gu: 'ગુરુ ચાંડાલ યોગ',    sa: 'गुरुचाण्डालयोगः' },
  'Guru-Mangala Yoga':      { en: 'Guru-Mangala Yoga',      hi: 'गुरु-मंगल योग',      gu: 'ગુરુ-મંગળ યોગ',      sa: 'गुरुमङ्गलयोगः' },
  'Shukra-Budha Yoga':      { en: 'Shukra-Budha Yoga',      hi: 'शुक्र-बुध योग',      gu: 'શુક્ર-બુધ યોગ',      sa: 'शुक्रबुधयोगः' },
  'Paap Kartari Yoga (Lagna)': { en: 'Paap Kartari Yoga (Lagna)', hi: 'पाप कर्तरी योग (लग्न)', gu: 'પાપ કર્તરી યોગ (લગ્ન)', sa: 'पापकर्तरीयोगः (लग्नम्)' },
  'Shubh Kartari Yoga (Lagna)':{ en: 'Shubh Kartari Yoga (Lagna)', hi: 'शुभ कर्तरी योग (लग्न)', gu: 'શુભ કર્તરી યોગ (લગ્ન)', sa: 'शुभकर्तरीयोगः (लग्नम्)' },
  'Neechabhanga Raja Yoga (Sun)': { en: 'Neechabhanga Raja Yoga (Sun)', hi: 'नीचभंग राज योग (सूर्य)', gu: 'નીચભંગ રાજ યોગ (સૂર્ય)', sa: 'नीचभङ्गराजयोगः (सूर्यः)' },
};

// ─── Strength / category words for yogas ──────────────────────────────────
export const STRENGTH_LABELS: Record<string, Record<AstroLang, string>> = {
  strong:   { en: 'Strong',   hi: 'प्रबल',      gu: 'પ્રબળ',      sa: 'प्रबलः' },
  moderate: { en: 'Moderate', hi: 'मध्यम',     gu: 'મધ્યમ',     sa: 'मध्यमः' },
  weak:     { en: 'Weak',     hi: 'दुर्बल',     gu: 'નબળું',     sa: 'दुर्बलः' },
};

export const PAKSHA = PAKSHA_LABELS;

// ─── Closed-enum dictionaries (mirror of server/i18n/index.ts tables) ──────
// Used when the server still emits an English token (e.g. PersonProfile.varna
// before the locale header was introduced, or the stable 'kootKey').

export const VARNA_LABELS: Record<string, Record<AstroLang, string>> = {
  Brahmin:   { en: 'Brahmin',   hi: 'ब्राह्मण',   gu: 'બ્રાહ્મણ',   sa: 'ब्राह्मणः' },
  Kshatriya: { en: 'Kshatriya', hi: 'क्षत्रिय',   gu: 'ક્ષત્રિય',   sa: 'क्षत्रियः' },
  Vaishya:   { en: 'Vaishya',   hi: 'वैश्य',      gu: 'વૈશ્ય',      sa: 'वैश्यः' },
  Shudra:    { en: 'Shudra',    hi: 'शूद्र',      gu: 'શૂદ્ર',      sa: 'शूद्रः' },
};

export const VASHYA_LABELS: Record<string, Record<AstroLang, string>> = {
  Chatushpada: { en: 'Chatushpada', hi: 'चतुष्पद',  gu: 'ચતુષ્પદ',  sa: 'चतुष्पदम्' },
  Manava:      { en: 'Manava',      hi: 'मानव',     gu: 'માનવ',     sa: 'मानवः' },
  Jalachara:   { en: 'Jalachara',   hi: 'जलचर',    gu: 'જલચર',    sa: 'जलचरः' },
  Vanachara:   { en: 'Vanachara',   hi: 'वनचर',    gu: 'વનચર',    sa: 'वनचरः' },
  Keeta:       { en: 'Keeta',       hi: 'कीट',      gu: 'કીટ',      sa: 'कीटः' },
};

export const YONI_LABELS: Record<string, Record<AstroLang, string>> = {
  Horse:    { en: 'Horse',    hi: 'अश्व',     gu: 'અશ્વ',     sa: 'अश्वः' },
  Elephant: { en: 'Elephant', hi: 'गज',      gu: 'ગજ',      sa: 'गजः' },
  Sheep:    { en: 'Sheep',    hi: 'मेष',      gu: 'મેષ',      sa: 'मेषः' },
  Snake:    { en: 'Snake',    hi: 'सर्प',     gu: 'સર્પ',     sa: 'सर्पः' },
  Dog:      { en: 'Dog',      hi: 'श्वान',    gu: 'શ્વાન',    sa: 'श्वा' },
  Cat:      { en: 'Cat',      hi: 'मार्जार',   gu: 'માર્જાર',   sa: 'मार्जारः' },
  Rat:      { en: 'Rat',      hi: 'मूषक',    gu: 'મૂષક',    sa: 'मूषकः' },
  Cow:      { en: 'Cow',      hi: 'गौ',      gu: 'ગૌ',      sa: 'धेनुः' },
  Buffalo:  { en: 'Buffalo',  hi: 'महिष',    gu: 'મહિષ',    sa: 'महिषः' },
  Tiger:    { en: 'Tiger',    hi: 'व्याघ्र',   gu: 'વ્યાઘ્ર',   sa: 'व्याघ्रः' },
  Hare:     { en: 'Hare',     hi: 'मृग',      gu: 'મૃગ',      sa: 'मृगः' },
  Deer:     { en: 'Deer',     hi: 'मृग',      gu: 'મૃગ',      sa: 'मृगः' },
  Monkey:   { en: 'Monkey',   hi: 'वानर',    gu: 'વાનર',    sa: 'वानरः' },
  Mongoose: { en: 'Mongoose', hi: 'नकुल',    gu: 'નકુલ',    sa: 'नकुलः' },
  Lion:     { en: 'Lion',     hi: 'सिंह',     gu: 'સિંહ',     sa: 'सिंहः' },
};

export const GANA_LABELS: Record<string, Record<AstroLang, string>> = {
  Deva:     { en: 'Deva',     hi: 'देव',     gu: 'દેવ',     sa: 'देवः' },
  Manushya: { en: 'Manushya', hi: 'मनुष्य',   gu: 'મનુષ્ય',   sa: 'मनुष्यः' },
  Rakshasa: { en: 'Rakshasa', hi: 'राक्षस',   gu: 'રાક્ષસ',   sa: 'राक्षसः' },
};

export const NADI_LABELS: Record<string, Record<AstroLang, string>> = {
  Aadi:   { en: 'Aadi',   hi: 'आदि',    gu: 'આદિ',    sa: 'आदिः' },
  Madhya: { en: 'Madhya', hi: 'मध्य',   gu: 'મધ્ય',   sa: 'मध्यः' },
  Antya:  { en: 'Antya',  hi: 'अन्त्य',  gu: 'અંત્ય',  sa: 'अन्त्यः' },
};

export const DIGNITY_LABELS: Record<string, Record<AstroLang, string>> = {
  Exalted:     { en: 'Exalted',     hi: 'उच्च',     gu: 'ઉચ્ચ',     sa: 'उच्चस्थः' },
  Debilitated: { en: 'Debilitated', hi: 'नीच',      gu: 'નીચ',      sa: 'नीचस्थः' },
  OwnSign:     { en: 'Own Sign',    hi: 'स्वराशि',   gu: 'સ્વ-રાશિ', sa: 'स्वराशिः' },
  Friend:      { en: 'Friend',      hi: 'मित्र',    gu: 'મિત્ર',    sa: 'मित्रः' },
  Neutral:     { en: 'Neutral',     hi: 'सम',      gu: 'સમ',      sa: 'समः' },
  Enemy:       { en: 'Enemy',       hi: 'शत्रु',    gu: 'શત્રુ',    sa: 'शत्रुः' },
  Vargottama:  { en: 'Vargottama',  hi: 'वर्गोत्तम', gu: 'વર્ગોત્તમ', sa: 'वर्गोत्तमः' },
  Combust:     { en: 'Combust',     hi: 'अस्त',    gu: 'અસ્ત',    sa: 'अस्तङ्गतः' },
  Retrograde:  { en: 'Retrograde',  hi: 'वक्री',    gu: 'વક્રી',    sa: 'वक्री' },
};

export const DIRECTION_LABELS: Record<string, Record<AstroLang, string>> = {
  N:  { en: 'North',     hi: 'उत्तर',    gu: 'ઉત્તર',    sa: 'उत्तरम्' },
  S:  { en: 'South',     hi: 'दक्षिण',   gu: 'દક્ષિણ',   sa: 'दक्षिणम्' },
  E:  { en: 'East',      hi: 'पूर्व',    gu: 'પૂર્વ',    sa: 'पूर्वम्' },
  W:  { en: 'West',      hi: 'पश्चिम',   gu: 'પશ્ચિમ',   sa: 'पश्चिमम्' },
  NE: { en: 'Northeast', hi: 'ईशान',    gu: 'ઈશાન',    sa: 'ईशानम्' },
  NW: { en: 'Northwest', hi: 'वायव्य',   gu: 'વાયવ્ય',   sa: 'वायव्यम्' },
  SE: { en: 'Southeast', hi: 'आग्नेय',   gu: 'આગ્નેય',   sa: 'आग्नेयम्' },
  SW: { en: 'Southwest', hi: 'नैऋत्य',   gu: 'નૈઋત્ય',   sa: 'नैऋत्यम्' },
  North:     { en: 'North',     hi: 'उत्तर',    gu: 'ઉત્તર',    sa: 'उत्तरम्' },
  South:     { en: 'South',     hi: 'दक्षिण',   gu: 'દક્ષિણ',   sa: 'दक्षिणम्' },
  East:      { en: 'East',      hi: 'पूर्व',    gu: 'પૂર્વ',    sa: 'पूर्वम्' },
  West:      { en: 'West',      hi: 'पश्चिम',   gu: 'પશ્ચિમ',   sa: 'पश्चिमम्' },
  Northeast: { en: 'Northeast', hi: 'ईशान',    gu: 'ઈશાન',    sa: 'ईशानम्' },
  Northwest: { en: 'Northwest', hi: 'वायव्य',   gu: 'વાયવ્ય',   sa: 'वायव्यम्' },
  Southeast: { en: 'Southeast', hi: 'आग्नेय',   gu: 'આગ્નેય',   sa: 'आग्नेयम्' },
  Southwest: { en: 'Southwest', hi: 'नैऋत्य',   gu: 'નૈઋત્ય',   sa: 'नैऋत्यम्' },
};

export const METAL_LABELS: Record<string, Record<AstroLang, string>> = {
  Gold:       { en: 'Gold',       hi: 'सोना',     gu: 'સોનું',    sa: 'सुवर्णम्' },
  Silver:     { en: 'Silver',     hi: 'चांदी',    gu: 'ચાંદી',    sa: 'रजतम्' },
  Copper:     { en: 'Copper',     hi: 'तांबा',    gu: 'તાંબુ',    sa: 'ताम्रम्' },
  Brass:      { en: 'Brass',      hi: 'पीतल',    gu: 'પિત્તળ',   sa: 'पित्तलम्' },
  Iron:       { en: 'Iron',       hi: 'लोहा',     gu: 'લોખંડ',    sa: 'लौहम्' },
  Tin:        { en: 'Tin',        hi: 'टिन',     gu: 'કલાઈ',    sa: 'त्रपु' },
  Lead:       { en: 'Lead',       hi: 'सीसा',    gu: 'સીસું',    sa: 'सीसम्' },
  Panchaloha: { en: 'Panchaloha', hi: 'पंचलोह',  gu: 'પંચલોહ',  sa: 'पञ्चलोहम्' },
};

export const FINGER_LABELS: Record<string, Record<AstroLang, string>> = {
  Index:  { en: 'Index',  hi: 'तर्जनी',    gu: 'તર્જની',    sa: 'तर्जनी' },
  Middle: { en: 'Middle', hi: 'मध्यमा',   gu: 'મધ્યમા',   sa: 'मध्यमा' },
  Ring:   { en: 'Ring',   hi: 'अनामिका', gu: 'અનામિકા', sa: 'अनामिका' },
  Little: { en: 'Little', hi: 'कनिष्ठा',  gu: 'કનિષ્ઠા',  sa: 'कनिष्ठा' },
};

export const GEMSTONE_LABELS: Record<string, Record<AstroLang, string>> = {
  Ruby:           { en: 'Ruby',           hi: 'माणिक्य',     gu: 'માણેક',       sa: 'माणिक्यम्' },
  Pearl:          { en: 'Pearl',          hi: 'मोती',        gu: 'મોતી',        sa: 'मुक्ता' },
  'Red Coral':    { en: 'Red Coral',      hi: 'मूंगा',        gu: 'પરવાળું',     sa: 'प्रवालम्' },
  Emerald:        { en: 'Emerald',        hi: 'पन्ना',       gu: 'પન્ના',       sa: 'मरकतम्' },
  'Yellow Sapphire': { en: 'Yellow Sapphire', hi: 'पुखराज',  gu: 'પુખરાજ',     sa: 'पुष्परागः' },
  Diamond:        { en: 'Diamond',        hi: 'हीरा',        gu: 'હીરો',        sa: 'वज्रम्' },
  'Blue Sapphire':{ en: 'Blue Sapphire',  hi: 'नीलम',       gu: 'નીલમ',       sa: 'नीलमणिः' },
  Hessonite:      { en: 'Hessonite',      hi: 'गोमेद',       gu: 'ગોમેદ',       sa: 'गोमेदः' },
  "Cat's Eye":    { en: "Cat's Eye",      hi: 'लहसुनिया',   gu: 'લહસુનિયા',   sa: 'वैदूर्यम्' },
  Garnet:         { en: 'Garnet',         hi: 'रक्तमणि',    gu: 'ગાર્નેટ',     sa: 'रक्तमणिः' },
  Moonstone:      { en: 'Moonstone',      hi: 'चंद्रकांत',   gu: 'ચંદ્રકાંત',   sa: 'चन्द्रकान्तः' },
  Carnelian:      { en: 'Carnelian',      hi: 'सुलेमानी',   gu: 'કાર્નેલિયન',   sa: 'सुलेमानी' },
  Peridot:        { en: 'Peridot',        hi: 'पेरिडॉट',    gu: 'પેરીડોટ',    sa: 'पेरिडॉट्' },
  Citrine:        { en: 'Citrine',        hi: 'सुनहला',      gu: 'સુનહલા',     sa: 'सुनहला' },
  'White Sapphire': { en: 'White Sapphire', hi: 'सफेद नीलम', gu: 'શ્વેત નીલમ', sa: 'श्वेतनीलमणिः' },
  Amethyst:       { en: 'Amethyst',       hi: 'जमुनिया',    gu: 'જમુનિયા',    sa: 'जमुनिया' },
  Spinel:         { en: 'Spinel',         hi: 'स्पिनेल',     gu: 'સ્પિનેલ',     sa: 'स्पिनेल' },
  "Tiger's Eye":  { en: "Tiger's Eye",    hi: 'व्याघ्रनयन', gu: 'વ્યાઘ્રનયન', sa: 'व्याघ्रनेत्रम्' },
};

export const COLOUR_LABELS: Record<string, Record<AstroLang, string>> = {
  Red:    { en: 'Red',    hi: 'लाल',     gu: 'લાલ',     sa: 'रक्तः' },
  Orange: { en: 'Orange', hi: 'नारंगी',   gu: 'નારંગી',   sa: 'नारङ्गः' },
  Yellow: { en: 'Yellow', hi: 'पीला',    gu: 'પીળો',    sa: 'पीतः' },
  Green:  { en: 'Green',  hi: 'हरा',      gu: 'લીલો',    sa: 'हरितः' },
  Blue:   { en: 'Blue',   hi: 'नीला',    gu: 'વાદળી',   sa: 'नीलः' },
  Indigo: { en: 'Indigo', hi: 'जामुनी',  gu: 'જામુની',  sa: 'नीलः' },
  Violet: { en: 'Violet', hi: 'बैंगनी',   gu: 'જાંબુડી',  sa: 'बैगनी' },
  White:  { en: 'White',  hi: 'श्वेत',    gu: 'શ્વેત',    sa: 'श्वेतः' },
  Black:  { en: 'Black',  hi: 'काला',    gu: 'કાળો',    sa: 'कृष्णः' },
  Gold:   { en: 'Gold',   hi: 'सुनहरा',  gu: 'સોનેરી',   sa: 'सुवर्णः' },
  Silver: { en: 'Silver', hi: 'रजतवर्ण', gu: 'રજત',     sa: 'रजतम्' },
};

export const BALADI_LABELS: Record<string, Record<AstroLang, string>> = {
  Bala:    { en: 'Bala',    hi: 'बाल',    gu: 'બાલ',    sa: 'बालः' },
  Kumara:  { en: 'Kumara',  hi: 'कुमार',  gu: 'કુમાર',  sa: 'कुमारः' },
  Yuva:    { en: 'Yuva',    hi: 'युवा',   gu: 'યુવા',   sa: 'युवा' },
  Vriddha: { en: 'Vriddha', hi: 'वृद्ध',   gu: 'વૃદ્ધ',   sa: 'वृद्धः' },
  Mrita:   { en: 'Mrita',   hi: 'मृत',    gu: 'મૃત',    sa: 'मृतः' },
};

export const JAGRADADI_LABELS: Record<string, Record<AstroLang, string>> = {
  Jagrat:   { en: 'Jagrat',   hi: 'जाग्रत',  gu: 'જાગ્રત',   sa: 'जाग्रत्' },
  Swapna:   { en: 'Swapna',   hi: 'स्वप्न',   gu: 'સ્વપ્ન',   sa: 'स्वप्नः' },
  Sushupti: { en: 'Sushupti', hi: 'सुषुप्ति', gu: 'સુષુપ્તિ', sa: 'सुषुप्तिः' },
};

export const DEEPTADI_LABELS: Record<string, Record<AstroLang, string>> = {
  Deepta:    { en: 'Deepta',    hi: 'दीप्त',     gu: 'દીપ્ત',     sa: 'दीप्तः' },
  Swastha:   { en: 'Swastha',   hi: 'स्वस्थ',    gu: 'સ્વસ્થ',    sa: 'स्वस्थः' },
  Mudita:    { en: 'Mudita',    hi: 'मुदित',     gu: 'મુદિત',     sa: 'मुदितः' },
  Shanta:    { en: 'Shanta',    hi: 'शान्त',     gu: 'શાંત',     sa: 'शान्तः' },
  Sakta:     { en: 'Sakta',     hi: 'सक्त',      gu: 'સક્ત',      sa: 'सक्तः' },
  Nipidita:  { en: 'Nipidita',  hi: 'निपीडित',   gu: 'નિપીડિત',   sa: 'निपीडितः' },
  Sudukhita: { en: 'Sudukhita', hi: 'सुदुःखित', gu: 'સુદુઃખિત', sa: 'सुदुःखितः' },
  Khala:     { en: 'Khala',     hi: 'खल',       gu: 'ખલ',       sa: 'खलः' },
  Bhitita:   { en: 'Bhitita',   hi: 'भीत',      gu: 'ભીત',      sa: 'भीतः' },
};

export const KAAL_SARPA_TYPE_LABELS: Record<string, Record<AstroLang, string>> = {
  Anant:        { en: 'Anant',        hi: 'अनन्त',       gu: 'અનંત',        sa: 'अनन्तः' },
  Kulik:        { en: 'Kulik',        hi: 'कुलिक',       gu: 'કુલિક',        sa: 'कुलिकः' },
  Vasuki:       { en: 'Vasuki',       hi: 'वासुकि',     gu: 'વાસુકિ',      sa: 'वासुकिः' },
  Shankhpal:    { en: 'Shankhpal',    hi: 'शंखपाल',    gu: 'શંખપાલ',    sa: 'शङ्खपालः' },
  Padma:        { en: 'Padma',        hi: 'पद्म',         gu: 'પદ્મ',         sa: 'पद्मः' },
  Mahapadma:    { en: 'Mahapadma',    hi: 'महापद्म',    gu: 'મહાપદ્મ',    sa: 'महापद्मः' },
  'Maha-Padma': { en: 'Maha-Padma',   hi: 'महापद्म',    gu: 'મહાપદ્મ',    sa: 'महापद्मः' },
  Takshak:      { en: 'Takshak',      hi: 'तक्षक',       gu: 'તક્ષક',       sa: 'तक्षकः' },
  Takshaka:     { en: 'Takshaka',     hi: 'तक्षक',       gu: 'તક્ષક',       sa: 'तक्षकः' },
  Karkotak:     { en: 'Karkotak',     hi: 'कर्कोटक',    gu: 'કર્કોટક',    sa: 'कर्कोटकः' },
  Karkotaka:    { en: 'Karkotaka',    hi: 'कर्कोटक',    gu: 'કર્કોટક',    sa: 'कर्कोटकः' },
  Shankhachoor: { en: 'Shankhachoor', hi: 'शंखचूड़',     gu: 'શંખચૂડ',     sa: 'शङ्खचूडः' },
  Shankhachuda: { en: 'Shankhachuda', hi: 'शंखचूड़',     gu: 'શંખચૂડ',     sa: 'शङ्खचूडः' },
  Ghatak:       { en: 'Ghatak',       hi: 'घातक',      gu: 'ઘાતક',      sa: 'घातकः' },
  Vishdhar:     { en: 'Vishdhar',     hi: 'विषधर',     gu: 'વિષધર',     sa: 'विषधरः' },
  Vishakta:     { en: 'Vishakta',     hi: 'विषक्त',     gu: 'વિષક્ત',     sa: 'विषक्तः' },
  Sheshnaag:    { en: 'Sheshnaag',    hi: 'शेषनाग',    gu: 'શેષનાગ',    sa: 'शेषनागः' },
  Sheshnag:     { en: 'Sheshnag',     hi: 'शेषनाग',    gu: 'શેષનાગ',    sa: 'शेषनागः' },
};

export const KOOT_NAME_LABELS: Record<string, Record<AstroLang, string>> = {
  Varna:         { en: 'Varna',         hi: 'वर्ण',          gu: 'વર્ણ',          sa: 'वर्णः' },
  Vashya:        { en: 'Vashya',        hi: 'वश्य',         gu: 'વશ્ય',         sa: 'वश्यः' },
  Tara:          { en: 'Tara',          hi: 'तारा',         gu: 'તારા',         sa: 'तारा' },
  Yoni:          { en: 'Yoni',          hi: 'योनि',         gu: 'યોનિ',         sa: 'योनिः' },
  'Graha Maitri':{ en: 'Graha Maitri',  hi: 'ग्रह मैत्री',    gu: 'ગ્રહ મૈત્રી',    sa: 'ग्रहमैत्री' },
  Gana:          { en: 'Gana',          hi: 'गण',          gu: 'ગણ',          sa: 'गणः' },
  Bhakoot:       { en: 'Bhakoot',       hi: 'भकूट',        gu: 'ભકૂટ',        sa: 'भकूटः' },
  Nadi:          { en: 'Nadi',          hi: 'नाड़ी',         gu: 'નાડી',         sa: 'नाडी' },
};

export const EXTRA_DOSHA_LABELS: Record<string, Record<AstroLang, string>> = {
  Mahendra:        { en: 'Mahendra',        hi: 'महेन्द्र',     gu: 'મહેન્દ્ર',     sa: 'महेन्द्रः' },
  'Stri Dheerga':  { en: 'Stri Dheerga',    hi: 'स्त्री दीर्घ',  gu: 'સ્ત્રી દીર્ઘ',  sa: 'स्त्रीदीर्घः' },
  Vedha:           { en: 'Vedha',           hi: 'वेध',         gu: 'વેધ',         sa: 'वेधः' },
  Rajju:           { en: 'Rajju',           hi: 'रज्जु',        gu: 'રજ્જુ',        sa: 'रज्जुः' },
  Vasya:           { en: 'Vasya',           hi: 'वश्य',         gu: 'વશ્ય',         sa: 'वश्यः' },
  'Yoni Bhauma':   { en: 'Yoni Bhauma',     hi: 'योनि भौम',   gu: 'યોનિ ભૌમ',   sa: 'योनिभौमः' },
  'Mangal Dosha':  { en: 'Mangal Dosha',    hi: 'मंगल दोष',   gu: 'મંગળ દોષ',   sa: 'मङ्गलदोषः' },
  'Rajju Dosha':   { en: 'Rajju Dosha',     hi: 'रज्जु दोष',   gu: 'રજ્જુ દોષ',   sa: 'रज्जुदोषः' },
  'Vedha Dosha':   { en: 'Vedha Dosha',     hi: 'वेध दोष',    gu: 'વેધ દોષ',    sa: 'वेधदोषः' },
};

// ─── Translator factory ────────────────────────────────────────────────────
function lookupEnum(
  map: Record<string, Record<AstroLang, string>>,
  key: string,
  lang: AstroLang,
): string {
  return map[key]?.[lang] ?? map[key]?.en ?? key;
}

export function makeAstroTranslator(locale: Locale) {
  // Sanskrit is now first-class — no fallback to Hindi.
  const lang: AstroLang = locale as AstroLang;
  return {
    planet:    (id: string)  => PLANET_LABELS[id]?.[lang]       ?? id,
    planetShort: (id: string)=> PLANET_SHORT_LABELS[id]?.[lang] ?? id,
    rashi:     (num: number) => RASHI_LABELS[num]?.[lang]       ?? String(num),
    rashiShort:(num: number) => RASHI_SHORT_LABELS[num]?.[lang] ?? String(num),
    nakshatra: (num: number) => NAKSHATRA_LABELS[num]?.[lang]   ?? String(num),
    house:     (num: number) => HOUSE_LABELS[num]?.[lang]       ?? `H${num}`,
    karaka:    (id: string)  => KARAKA_LABELS[id]?.[lang]       ?? id,
    vara:      (name: string)=> VARA_LABELS[name]?.[lang]       ?? name,
    tithi:     (name: string)=> TITHI_NAMES[name]?.[lang]       ?? name,
    paksha:    (name: string)=> PAKSHA_LABELS[name]?.[lang]     ?? name,
    karana:    (name: string)=> KARANA_LABELS[name]?.[lang]     ?? name,
    pyoga:     (name: string)=> PYOGA_LABELS[name]?.[lang]      ?? name,
    yoga:      (name: string)=> YOGA_LABELS[name]?.[lang]       ?? name,
    strength:  (s: string)   => STRENGTH_LABELS[s]?.[lang]      ?? s,
    // ─── Closed-enum helpers (mirror server tables) ─────────────────────────
    varna:         (s: string) => lookupEnum(VARNA_LABELS, s, lang),
    vashya:        (s: string) => lookupEnum(VASHYA_LABELS, s, lang),
    yoni:          (s: string) => lookupEnum(YONI_LABELS, s, lang),
    gana:          (s: string) => lookupEnum(GANA_LABELS, s, lang),
    nadi:          (s: string) => lookupEnum(NADI_LABELS, s, lang),
    dignity:       (s: string) => lookupEnum(DIGNITY_LABELS, s, lang),
    direction:     (s: string) => lookupEnum(DIRECTION_LABELS, s, lang),
    metal:         (s: string) => lookupEnum(METAL_LABELS, s, lang),
    finger:        (s: string) => lookupEnum(FINGER_LABELS, s, lang),
    gemstone:      (s: string) => lookupEnum(GEMSTONE_LABELS, s, lang),
    colour:        (s: string) => lookupEnum(COLOUR_LABELS, s, lang),
    baladi:        (s: string) => lookupEnum(BALADI_LABELS, s, lang),
    jagradadi:     (s: string) => lookupEnum(JAGRADADI_LABELS, s, lang),
    deeptadi:      (s: string) => lookupEnum(DEEPTADI_LABELS, s, lang),
    kaalSarpaType: (s: string) => lookupEnum(KAAL_SARPA_TYPE_LABELS, s, lang),
    kootName:      (s: string) => lookupEnum(KOOT_NAME_LABELS, s, lang),
    extraDosha:    (s: string) => lookupEnum(EXTRA_DOSHA_LABELS, s, lang),
    /** Translate a planet name already rendered in English by lookup table. */
    planetByName: (name: string) => {
      const id = Object.entries(PLANET_LABELS).find(([, v]) => v.en === name)?.[0];
      return id ? PLANET_LABELS[id][lang] : name;
    },
    /** Translate a rashi name already in English. */
    rashiByName: (name: string) => {
      const num = Object.entries(RASHI_LABELS).find(([, v]) => v.en === name)?.[0];
      return num ? RASHI_LABELS[Number(num)][lang] : name;
    },
  };
}

export type AstroTranslator = ReturnType<typeof makeAstroTranslator>;
