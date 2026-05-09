// Server-side astro-label dictionaries — translate computed result values at
// PDF render time. Mirrors the client's `client/src/i18n/astro-labels.ts`
// table-by-table so server-rendered HTML/PDF can speak the same vocabulary
// as the React UI without round-tripping through the JSON API.
//
// Covers:
//   - 9 grahas, 12 rashis, 27 nakshatras
//   - 12 houses (topic strings) + 7 Jaimini karakas
//   - 7 weekdays, 30 tithis, 2 pakshas, 11 karanas, 27 panchang yogas
//
// Every entry has en / hi / gu / sa variants. Sanskrit (sa) is rendered in
// Devanagari with classical (saṃskṛta) word forms — never a copy of Hindi.

import type { Locale } from './index';

// ─── 9 Grahas ───────────────────────────────────────────────────────────────
export const PLANET_LABELS: Record<string, Record<Locale, string>> = {
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

// ─── 12 Rashis ──────────────────────────────────────────────────────────────
export const RASHI_LABELS: Record<number, Record<Locale, string>> = {
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
export const NAKSHATRA_LABELS: Record<number, Record<Locale, string>> = {
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

// ─── Houses — topic label ──────────────────────────────────────────────────
export const HOUSE_LABELS: Record<number, Record<Locale, string>> = {
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
export const KARAKA_LABELS: Record<string, Record<Locale, string>> = {
  AK:  { en: 'Atmakaraka',   hi: 'आत्मकारक',   gu: 'આત્મકારક',   sa: 'आत्मकारकः' },
  AmK: { en: 'Amatyakaraka', hi: 'अमात्यकारक', gu: 'અમાત્યકારક', sa: 'अमात्यकारकः' },
  BK:  { en: 'Bhratrikaraka',hi: 'भ्रातृकारक',  gu: 'ભ્રાતૃકારક',  sa: 'भ्रातृकारकः' },
  MK:  { en: 'Matrikaraka',  hi: 'मातृकारक',   gu: 'માતૃકારક',   sa: 'मातृकारकः' },
  PK:  { en: 'Putrakaraka',  hi: 'पुत्रकारक',   gu: 'પુત્રકારક',   sa: 'पुत्रकारकः' },
  GK:  { en: 'Gnatikaraka',  hi: 'ज्ञातिकारक',  gu: 'જ્ઞાતિકારક',  sa: 'ज्ञातिकारकः' },
  DK:  { en: 'Darakaraka',   hi: 'दारकारक',    gu: 'દારકારક',    sa: 'दारकारकः' },
};

// ─── Weekdays (vara) ───────────────────────────────────────────────────────
export const VARA_LABELS: Record<string, Record<Locale, string>> = {
  Sunday:    { en: 'Sunday',    hi: 'रविवार',    gu: 'રવિવાર',    sa: 'रविवासरः' },
  Monday:    { en: 'Monday',    hi: 'सोमवार',    gu: 'સોમવાર',    sa: 'सोमवासरः' },
  Tuesday:   { en: 'Tuesday',   hi: 'मंगलवार',   gu: 'મંગળવાર',   sa: 'भौमवासरः' },
  Wednesday: { en: 'Wednesday', hi: 'बुधवार',    gu: 'બુધવાર',    sa: 'बुधवासरः' },
  Thursday:  { en: 'Thursday',  hi: 'गुरुवार',    gu: 'ગુરુવાર',    sa: 'गुरुवासरः' },
  Friday:    { en: 'Friday',    hi: 'शुक्रवार',   gu: 'શુક્રવાર',   sa: 'शुक्रवासरः' },
  Saturday:  { en: 'Saturday',  hi: 'शनिवार',    gu: 'શનિવાર',    sa: 'शनिवासरः' },
};

// ─── Pakshas + Tithis ──────────────────────────────────────────────────────
export const PAKSHA_LABELS: Record<string, Record<Locale, string>> = {
  Shukla:  { en: 'Shukla',  hi: 'शुक्ल',  gu: 'શુક્લ',  sa: 'शुक्लपक्षः' },
  Krishna: { en: 'Krishna', hi: 'कृष्ण',  gu: 'કૃષ્ણ',  sa: 'कृष्णपक्षः' },
};

export const TITHI_NAMES: Record<string, Record<Locale, string>> = {
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
export const KARANA_LABELS: Record<string, Record<Locale, string>> = {
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
export const PYOGA_LABELS: Record<string, Record<Locale, string>> = {
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

// ─── Translator factory ────────────────────────────────────────────────────
function lookupBy<K extends string | number>(
  map: Record<K, Record<Locale, string>>,
  key: K,
  locale: Locale,
): string {
  return map[key]?.[locale] ?? map[key]?.en ?? String(key);
}

export interface AstroLabels {
  planet(id: string): string;
  rashi(num: number): string;
  nakshatra(num: number): string;
  house(num: number): string;
  karaka(id: string): string;
  vara(name: string): string;
  tithi(name: string): string;
  paksha(name: string): string;
  karana(name: string): string;
  pyoga(name: string): string;
  /** Translate a planet name already rendered in English. */
  planetByName(en: string): string;
  /** Translate a rashi name already rendered in English. */
  rashiByName(en: string): string;
  /** Translate a nakshatra name already rendered in English. */
  nakshatraByName(en: string): string;
}

export function astroLabels(locale: Locale): AstroLabels {
  return {
    planet:    (id)   => PLANET_LABELS[id]?.[locale] ?? PLANET_LABELS[id]?.en ?? id,
    rashi:     (num)  => RASHI_LABELS[num]?.[locale] ?? RASHI_LABELS[num]?.en ?? String(num),
    nakshatra: (num)  => NAKSHATRA_LABELS[num]?.[locale] ?? NAKSHATRA_LABELS[num]?.en ?? String(num),
    house:     (num)  => HOUSE_LABELS[num]?.[locale] ?? HOUSE_LABELS[num]?.en ?? `H${num}`,
    karaka:    (id)   => lookupBy(KARAKA_LABELS, id, locale),
    vara:      (name) => lookupBy(VARA_LABELS, name, locale),
    tithi:     (name) => lookupBy(TITHI_NAMES, name, locale),
    paksha:    (name) => lookupBy(PAKSHA_LABELS, name, locale),
    karana:    (name) => lookupBy(KARANA_LABELS, name, locale),
    pyoga:     (name) => lookupBy(PYOGA_LABELS, name, locale),
    planetByName: (name) => {
      const id = (Object.keys(PLANET_LABELS) as string[])
        .find((k) => PLANET_LABELS[k].en === name);
      return id ? PLANET_LABELS[id][locale] ?? PLANET_LABELS[id].en : name;
    },
    rashiByName: (name) => {
      const num = (Object.keys(RASHI_LABELS) as Array<string>)
        .find((k) => RASHI_LABELS[Number(k)].en === name);
      return num ? RASHI_LABELS[Number(num)][locale] ?? RASHI_LABELS[Number(num)].en : name;
    },
    nakshatraByName: (name) => {
      const num = (Object.keys(NAKSHATRA_LABELS) as Array<string>)
        .find((k) => NAKSHATRA_LABELS[Number(k)].en === name);
      return num
        ? NAKSHATRA_LABELS[Number(num)][locale] ?? NAKSHATRA_LABELS[Number(num)].en
        : name;
    },
  };
}
