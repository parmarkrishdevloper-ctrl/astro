// Server-side i18n. Lightweight key→string lookup with fallback to English,
// plus a translator factory that exposes localized helpers for closed
// enumerations (varna, vashya, yoni, ...) and a phrasebook of templated
// prose used by the matching / dosha / yoga services.
//
// Locale is passed explicitly to renderers — no global state — so concurrent
// batch jobs can mix languages safely.

import { en } from './en';
import { hi } from './hi';
import { gu } from './gu';
import { sa } from './sa';

export type Locale = 'en' | 'hi' | 'gu' | 'sa';

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'hi', 'gu', 'sa'] as const;

const DICTS: Record<Locale, Record<string, string>> = { en, hi, gu, sa };

export function isLocale(s: unknown): s is Locale {
  return s === 'en' || s === 'hi' || s === 'gu' || s === 'sa';
}

/** Resolve a translation key against the given locale, falling back to English. */
export function tr(locale: Locale, key: string, fallback?: string): string {
  return DICTS[locale][key] ?? DICTS.en[key] ?? fallback ?? key;
}

/** Bind a translator to a fixed locale — handy for renderers. */
export function bindT(locale: Locale): (key: string, fallback?: string) => string {
  return (key, fallback) => tr(locale, key, fallback);
}

// ─── PDF labels (kept for back-compat with PDF templates) ────────────────────
export const PLANET_NAMES: Record<Locale, Record<string, string>> = {
  en: { SU: 'Sun', MO: 'Moon', MA: 'Mars', ME: 'Mercury', JU: 'Jupiter', VE: 'Venus', SA: 'Saturn', RA: 'Rahu', KE: 'Ketu' },
  hi: { SU: 'सूर्य', MO: 'चंद्र', MA: 'मंगल', ME: 'बुध', JU: 'गुरु', VE: 'शुक्र', SA: 'शनि', RA: 'राहु', KE: 'केतु' },
  gu: { SU: 'સૂર્ય', MO: 'ચંદ્ર', MA: 'મંગળ', ME: 'બુધ', JU: 'ગુરુ', VE: 'શુક્ર', SA: 'શનિ', RA: 'રાહુ', KE: 'કેતુ' },
  sa: { SU: 'सूर्यः', MO: 'चन्द्रः', MA: 'मङ्गलः', ME: 'बुधः', JU: 'गुरुः', VE: 'शुक्रः', SA: 'शनिः', RA: 'राहुः', KE: 'केतुः' },
};

export const RASHI_NAMES: Record<Locale, string[]> = {
  en: ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'],
  hi: ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'],
  gu: ['મેષ','વૃષભ','મિથુન','કર્ક','સિંહ','કન્યા','તુલા','વૃશ્ચિક','ધનુ','મકર','કુંભ','મીન'],
  sa: ['मेषः','वृषभः','मिथुनम्','कर्कः','सिंहः','कन्या','तुला','वृश्चिकः','धनुः','मकरः','कुम्भः','मीनः'],
};

export function tPlanet(locale: Locale, id: string): string {
  return PLANET_NAMES[locale][id] ?? PLANET_NAMES.en[id] ?? id;
}

export function tRashi(locale: Locale, num: number): string {
  if (num < 1 || num > 12) return '';
  return RASHI_NAMES[locale][num - 1] ?? RASHI_NAMES.en[num - 1];
}

// ─── Closed enum dictionaries ────────────────────────────────────────────────
// Every entry keys on the canonical English form emitted by the services.

type EnumMap = Record<string, Record<Locale, string>>;

const VARNA: EnumMap = {
  Brahmin:   { en: 'Brahmin',   hi: 'ब्राह्मण',   gu: 'બ્રાહ્મણ',   sa: 'ब्राह्मणः' },
  Kshatriya: { en: 'Kshatriya', hi: 'क्षत्रिय',   gu: 'ક્ષત્રિય',   sa: 'क्षत्रियः' },
  Vaishya:   { en: 'Vaishya',   hi: 'वैश्य',      gu: 'વૈશ્ય',      sa: 'वैश्यः' },
  Shudra:    { en: 'Shudra',    hi: 'शूद्र',      gu: 'શૂદ્ર',      sa: 'शूद्रः' },
};

const VASHYA: EnumMap = {
  Chatushpada: { en: 'Chatushpada', hi: 'चतुष्पद',  gu: 'ચતુષ્પદ',  sa: 'चतुष्पदम्' },
  Manava:      { en: 'Manava',      hi: 'मानव',     gu: 'માનવ',     sa: 'मानवः' },
  Jalachara:   { en: 'Jalachara',   hi: 'जलचर',    gu: 'જલચર',    sa: 'जलचरः' },
  Vanachara:   { en: 'Vanachara',   hi: 'वनचर',    gu: 'વનચર',    sa: 'वनचरः' },
  Keeta:       { en: 'Keeta',       hi: 'कीट',      gu: 'કીટ',      sa: 'कीटः' },
};

const YONI: EnumMap = {
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

const GANA: EnumMap = {
  Deva:     { en: 'Deva',     hi: 'देव',     gu: 'દેવ',     sa: 'देवः' },
  Manushya: { en: 'Manushya', hi: 'मनुष्य',   gu: 'મનુષ્ય',   sa: 'मनुष्यः' },
  Rakshasa: { en: 'Rakshasa', hi: 'राक्षस',   gu: 'રાક્ષસ',   sa: 'राक्षसः' },
};

const NADI: EnumMap = {
  Aadi:   { en: 'Aadi',   hi: 'आदि',    gu: 'આદિ',    sa: 'आदिः' },
  Madhya: { en: 'Madhya', hi: 'मध्य',   gu: 'મધ્ય',   sa: 'मध्यः' },
  Antya:  { en: 'Antya',  hi: 'अन्त्य',  gu: 'અંત્ય',  sa: 'अन्त्यः' },
};

const DIGNITY: EnumMap = {
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

const DIRECTION: EnumMap = {
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

const METAL: EnumMap = {
  Gold:       { en: 'Gold',       hi: 'सोना',     gu: 'સોનું',    sa: 'सुवर्णम्' },
  Silver:     { en: 'Silver',     hi: 'चांदी',    gu: 'ચાંદી',    sa: 'रजतम्' },
  Copper:     { en: 'Copper',     hi: 'तांबा',    gu: 'તાંબુ',    sa: 'ताम्रम्' },
  Brass:      { en: 'Brass',      hi: 'पीतल',    gu: 'પિત્તળ',   sa: 'पित्तलम्' },
  Bronze:     { en: 'Bronze',     hi: 'कांस्य',   gu: 'કાંસું',   sa: 'कांस्यम्' },
  Iron:       { en: 'Iron',       hi: 'लोहा',     gu: 'લોખંડ',    sa: 'लौहम्' },
  Tin:        { en: 'Tin',        hi: 'टिन',     gu: 'કલાઈ',    sa: 'त्रपु' },
  Lead:       { en: 'Lead',       hi: 'सीसा',    gu: 'સીસું',    sa: 'सीसम्' },
  Platinum:   { en: 'Platinum',   hi: 'प्लेटिनम', gu: 'પ્લેટિનમ', sa: 'प्लेटिनम्' },
  Panchaloha: { en: 'Panchaloha', hi: 'पंचलोह',  gu: 'પંચલોહ',  sa: 'पञ्चलोहम्' },
  Panchadhatu:{ en: 'Panchadhatu',hi: 'पञ्चधातु', gu: 'પંચધાતુ',  sa: 'पञ्चधातुः' },
  Ashtadhatu: { en: 'Ashtadhatu', hi: 'अष्टधातु', gu: 'અષ્ટધાતુ', sa: 'अष्टधातुः' },
  'Mixed-metal (Ashtadhatu)': { en: 'Mixed-metal (Ashtadhatu)', hi: 'मिश्रधातु (अष्टधातु)', gu: 'મિશ્રધાતુ (અષ્ટધાતુ)', sa: 'मिश्रधातुः (अष्टधातुः)' },
  'Iron / Panchadhatu':       { en: 'Iron / Panchadhatu',       hi: 'लोहा / पञ्चधातु',     gu: 'લોખંડ / પંચધાતુ',    sa: 'लौहम् / पञ्चधातुः' },
  'Silver / Platinum':        { en: 'Silver / Platinum',        hi: 'चांदी / प्लेटिनम',    gu: 'ચાંદી / પ્લેટિનમ',   sa: 'रजतम् / प्लेटिनम्' },
  'Mixed metal':              { en: 'Mixed metal',              hi: 'मिश्रधातु',            gu: 'મિશ્રધાતુ',         sa: 'मिश्रधातुः' },
};

const FINGER: EnumMap = {
  Index:  { en: 'Index',  hi: 'तर्जनी',    gu: 'તર્જની',    sa: 'तर्जनी' },
  Middle: { en: 'Middle', hi: 'मध्यमा',   gu: 'મધ્યમા',   sa: 'मध्यमा' },
  Ring:   { en: 'Ring',   hi: 'अनामिका', gu: 'અનામિકા', sa: 'अनामिका' },
  Little: { en: 'Little', hi: 'कनिष्ठा',  gu: 'કનિષ્ઠા',  sa: 'कनिष्ठा' },
};

const GEMSTONE: EnumMap = {
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
  // gemstones.service primaries that include parenthesised native name
  'Hessonite Garnet (Gomed)':    { en: 'Hessonite Garnet (Gomed)',  hi: 'गोमेद',         gu: 'ગોમેદ',         sa: 'गोमेदः (गोमेदः)' },
  "Cat's Eye (Lehsuniya)":       { en: "Cat's Eye (Lehsuniya)",     hi: 'लहसुनिया',     gu: 'લહસુનિયા',     sa: 'वैदूर्यम् (लहसुनिया)' },
  "Cat's Eye (Lahsuniya)":       { en: "Cat's Eye (Lahsuniya)",     hi: 'लहसुनिया',     gu: 'લહસુનિયા',     sa: 'वैदूर्यम् (लहसुनिया)' },
};

const COLOUR: EnumMap = {
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
  // ─ Compound / descriptive colour phrases used by gemstones + yantras catalogues
  'Red / pigeon-blood':    { en: 'Red / pigeon-blood',    hi: 'लाल / कबूतर-रक्त',    gu: 'લાલ / કબૂતર-રક્ત',    sa: 'रक्तः / कपोतरक्तवर्णः' },
  'Lustrous white':        { en: 'Lustrous white',        hi: 'चमकदार श्वेत',         gu: 'ચળકતો શ્વેત',         sa: 'दीप्तश्वेतः' },
  'Red / orange':          { en: 'Red / orange',          hi: 'लाल / नारंगी',         gu: 'લાલ / નારંગી',         sa: 'रक्तः / नारङ्गः' },
  'Yellow / honey':        { en: 'Yellow / honey',        hi: 'पीला / मधु-वर्ण',     gu: 'પીળો / મધ વર્ણ',     sa: 'पीतः / मधुवर्णः' },
  'White / clear':         { en: 'White / clear',         hi: 'श्वेत / पारदर्शी',     gu: 'શ્વેત / પારદર્શી',     sa: 'श्वेतः / स्वच्छः' },
  'Blue / cornflower':     { en: 'Blue / cornflower',     hi: 'नीला / कॉर्नफ्लावर',  gu: 'વાદળી / કોર્નફ્લાવર', sa: 'नीलः / कॉर्नफ्लावरवर्णः' },
  'Honey-brown':           { en: 'Honey-brown',           hi: 'मधु-भूरा',             gu: 'મધ-બદામી',            sa: 'मधुश्यावः' },
  'Smoky / golden-yellow': { en: 'Smoky / golden-yellow', hi: 'धूम्र / स्वर्णिम पीत', gu: 'ધૂમ્ર / સોનેરી પીળો', sa: 'धूम्रः / स्वर्णपीतः' },
  'Red / golden orange':   { en: 'Red / golden orange',   hi: 'लाल / स्वर्णिम नारंगी',gu: 'લાલ / સોનેરી નારંગી', sa: 'रक्तः / स्वर्णनारङ्गः' },
  'White / pearl':         { en: 'White / pearl',         hi: 'श्वेत / मुक्ता-वर्ण', gu: 'શ્વેત / મોતી',         sa: 'श्वेतः / मुक्तावर्णः' },
  'Red / coral':           { en: 'Red / coral',           hi: 'लाल / प्रवाल-वर्ण',    gu: 'લાલ / પરવાળું',       sa: 'रक्तः / प्रवालवर्णः' },
  'White / rainbow':       { en: 'White / rainbow',       hi: 'श्वेत / इन्द्रधनुषी',  gu: 'શ્વેત / મેઘધનુષ',     sa: 'श्वेतः / इन्द्रधनुर्वर्णः' },
  'Dark blue / black':     { en: 'Dark blue / black',     hi: 'गहरा नीला / काला',     gu: 'ઘેરો વાદળી / કાળો',  sa: 'गाढनीलः / कृष्णः' },
  'Smoky grey':            { en: 'Smoky grey',            hi: 'धूम्र-धूसर',           gu: 'ધૂમ્ર-ધૂસર',          sa: 'धूम्रधूसरः' },
  'Smoky / multicolour':   { en: 'Smoky / multicolour',   hi: 'धूम्र / बहुरंगी',     gu: 'ધૂમ્ર / બહુરંગી',     sa: 'धूम्रः / बहुवर्णः' },
};

const BALADI: EnumMap = {
  Bala:    { en: 'Bala',    hi: 'बाल',    gu: 'બાલ',    sa: 'बालः' },
  Kumara:  { en: 'Kumara',  hi: 'कुमार',  gu: 'કુમાર',  sa: 'कुमारः' },
  Yuva:    { en: 'Yuva',    hi: 'युवा',   gu: 'યુવા',   sa: 'युवा' },
  Vriddha: { en: 'Vriddha', hi: 'वृद्ध',   gu: 'વૃદ્ધ',   sa: 'वृद्धः' },
  Mrita:   { en: 'Mrita',   hi: 'मृत',    gu: 'મૃત',    sa: 'मृतः' },
};

const JAGRADADI: EnumMap = {
  Jagrat:   { en: 'Jagrat',   hi: 'जाग्रत',  gu: 'જાગ્રત',   sa: 'जाग्रत्' },
  Swapna:   { en: 'Swapna',   hi: 'स्वप्न',   gu: 'સ્વપ્ન',   sa: 'स्वप्नः' },
  Sushupti: { en: 'Sushupti', hi: 'सुषुप्ति', gu: 'સુષુપ્તિ', sa: 'सुषुप्तिः' },
};

const LAJJITADI: EnumMap = {
  Lajjita:  { en: 'Lajjita',  hi: 'लज्जित',  gu: 'લજ્જિત',  sa: 'लज्जितः' },
  Garvita:  { en: 'Garvita',  hi: 'गर्वित',   gu: 'ગર્વિત',   sa: 'गर्वितः' },
  Kshudita: { en: 'Kshudita', hi: 'क्षुधित', gu: 'ક્ષુધિત', sa: 'क्षुधितः' },
  Trishita: { en: 'Trishita', hi: 'तृषित',   gu: 'તૃષિત',   sa: 'तृषितः' },
  Mudita:   { en: 'Mudita',   hi: 'मुदित',   gu: 'મુદિત',   sa: 'मुदितः' },
  Kshobhita:{ en: 'Kshobhita',hi: 'क्षोभित', gu: 'ક્ષોભિત', sa: 'क्षोभितः' },
};

const DEEPTADI: EnumMap = {
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

const KOOT_NAME: EnumMap = {
  Varna:         { en: 'Varna',         hi: 'वर्ण',          gu: 'વર્ણ',          sa: 'वर्णः' },
  Vashya:        { en: 'Vashya',        hi: 'वश्य',         gu: 'વશ્ય',         sa: 'वश्यः' },
  Tara:          { en: 'Tara',          hi: 'तारा',         gu: 'તારા',         sa: 'तारा' },
  Yoni:          { en: 'Yoni',          hi: 'योनि',         gu: 'યોનિ',         sa: 'योनिः' },
  'Graha Maitri':{ en: 'Graha Maitri',  hi: 'ग्रह मैत्री',    gu: 'ગ્રહ મૈત્રી',    sa: 'ग्रहमैत्री' },
  Gana:          { en: 'Gana',          hi: 'गण',          gu: 'ગણ',          sa: 'गणः' },
  Bhakoot:       { en: 'Bhakoot',       hi: 'भकूट',        gu: 'ભકૂટ',        sa: 'भकूटः' },
  Nadi:          { en: 'Nadi',          hi: 'नाड़ी',         gu: 'નાડી',         sa: 'नाडी' },
};

const EXTRA_DOSHA: EnumMap = {
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

const PHASE: EnumMap = {
  first: { en: 'First',  hi: 'प्रथम',  gu: 'પ્રથમ',  sa: 'प्रथमः' },
  peak:  { en: 'Peak',   hi: 'चरम',   gu: 'ચરમ',   sa: 'चरमः' },
  last:  { en: 'Last',   hi: 'अन्तिम', gu: 'અંતિમ', sa: 'अन्तिमः' },
};

const BODY_PART: EnumMap = {
  Head:      { en: 'Head',      hi: 'सिर',       gu: 'માથું',     sa: 'शिरः' },
  Face:      { en: 'Face',      hi: 'मुख',      gu: 'મુખ',      sa: 'मुखम्' },
  Eye:       { en: 'Eye',       hi: 'नेत्र',     gu: 'નેત્ર',     sa: 'नेत्रम्' },
  Mouth:     { en: 'Mouth',     hi: 'मुख',      gu: 'મુખ',      sa: 'मुखम्' },
  Neck:      { en: 'Neck',      hi: 'कंठ',      gu: 'કંઠ',      sa: 'कण्ठः' },
  Shoulders: { en: 'Shoulders', hi: 'कंधे',     gu: 'ખભા',     sa: 'स्कन्धौ' },
  Heart:     { en: 'Heart',     hi: 'हृदय',     gu: 'હૃદય',     sa: 'हृदयम्' },
  Chest:     { en: 'Chest',     hi: 'वक्ष',      gu: 'છાતી',     sa: 'वक्षः' },
  Stomach:   { en: 'Stomach',   hi: 'उदर',     gu: 'પેટ',      sa: 'उदरम्' },
  Hip:       { en: 'Hip',       hi: 'कटि',     gu: 'કમર',     sa: 'कटिः' },
  Genitals:  { en: 'Genitals',  hi: 'गुह्य',    gu: 'ગુહ્ય',    sa: 'गुह्यम्' },
  Thighs:    { en: 'Thighs',    hi: 'जंघा',     gu: 'જાંઘ',      sa: 'जङ्घा' },
  Knees:     { en: 'Knees',     hi: 'जानु',     gu: 'ઘૂંટણ',     sa: 'जानुनी' },
  Calves:    { en: 'Calves',    hi: 'पिंडली',   gu: 'પિંડી',     sa: 'जङ्घे' },
  Feet:      { en: 'Feet',      hi: 'पाद',     gu: 'પગ',      sa: 'पादौ' },
};

const KAAL_SARPA_TYPE: EnumMap = {
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

const VERDICT_TONE: EnumMap = {
  excellent:  { en: 'Excellent',  hi: 'उत्कृष्ट',  gu: 'ઉત્કૃષ્ટ',  sa: 'उत्कृष्टम्' },
  good:       { en: 'Good',       hi: 'अच्छा',    gu: 'સારું',      sa: 'शुभम्' },
  acceptable: { en: 'Acceptable', hi: 'स्वीकार्य', gu: 'સ્વીકાર્ય', sa: 'ग्राह्यम्' },
  poor:       { en: 'Poor',       hi: 'दुर्बल',     gu: 'નબળું',     sa: 'दुर्बलम्' },
};

// ─── Biometric services — closed-set helpers ────────────────────────────────
// Used by palmistry / samudrika / graphology / tarot services.

// Palmistry hand sides (left/right, dominant/passive).
const HAND_SIDE: EnumMap = {
  left:    { en: 'left',    hi: 'बाएँ',    gu: 'ડાબો',    sa: 'वामः' },
  right:   { en: 'right',   hi: 'दाएँ',    gu: 'જમણો',    sa: 'दक्षिणः' },
  active:  { en: 'active',  hi: 'सक्रिय',  gu: 'સક્રિય',   sa: 'क्रियाशीलः' },
  passive: { en: 'passive', hi: 'निष्क्रिय', gu: 'નિષ્ક્રિય', sa: 'निष्क्रियः' },
};

// Palmistry hand shapes (earth/air/fire/water).
const HAND_SHAPE: EnumMap = {
  earth: { en: 'Earth',  hi: 'पृथ्वी',  gu: 'પૃથ્વી',   sa: 'पृथ्वी' },
  air:   { en: 'Air',    hi: 'वायु',   gu: 'વાયુ',    sa: 'वायुः' },
  fire:  { en: 'Fire',   hi: 'अग्नि',   gu: 'અગ્નિ',   sa: 'अग्निः' },
  water: { en: 'Water',  hi: 'जल',    gu: 'જળ',     sa: 'जलम्' },
};

// Palm mounts — Jupiter, Saturn, Apollo, Mercury, Venus, Mars (lower/upper),
// Moon, Rahu. The mount labels are also reused for finger names.
const PALM_MOUNT: EnumMap = {
  jupiter:    { en: 'Jupiter',     hi: 'गुरु पर्वत',     gu: 'ગુરુ પર્વત',     sa: 'गुरुपर्वतः' },
  saturn:     { en: 'Saturn',      hi: 'शनि पर्वत',     gu: 'શનિ પર્વત',     sa: 'शनिपर्वतः' },
  apollo:     { en: 'Apollo',      hi: 'सूर्य पर्वत',    gu: 'સૂર્ય પર્વત',    sa: 'सूर्यपर्वतः' },
  mercury:    { en: 'Mercury',     hi: 'बुध पर्वत',     gu: 'બુધ પર્વત',     sa: 'बुधपर्वतः' },
  venus:      { en: 'Venus',       hi: 'शुक्र पर्वत',    gu: 'શુક્ર પર્વત',    sa: 'शुक्रपर्वतः' },
  mars_lower: { en: 'Lower Mars',  hi: 'निम्न मंगल',   gu: 'નિમ્ન મંગળ',   sa: 'अधोमङ्गलः' },
  mars_upper: { en: 'Upper Mars',  hi: 'उच्च मंगल',    gu: 'ઉચ્ચ મંગળ',    sa: 'ऊर्ध्वमङ्गलः' },
  moon:       { en: 'Moon',        hi: 'चन्द्र पर्वत',  gu: 'ચંદ્ર પર્વત',   sa: 'चन्द्रपर्वतः' },
  rahu:       { en: 'Rahu',        hi: 'राहु पर्वत',     gu: 'રાહુ પર્વત',     sa: 'राहुपर्वतः' },
};

// Palm lines — life / head / heart / fate / sun / mercury / marriage.
const PALM_LINE: EnumMap = {
  life:     { en: 'Life',     hi: 'जीवन रेखा',  gu: 'જીવન રેખા',  sa: 'जीवनरेखा' },
  head:     { en: 'Head',     hi: 'मस्तिष्क रेखा', gu: 'મસ્તિષ્ક રેખા', sa: 'मस्तिष्करेखा' },
  heart:    { en: 'Heart',    hi: 'हृदय रेखा',  gu: 'હૃદય રેખા',  sa: 'हृदयरेखा' },
  fate:     { en: 'Fate',     hi: 'भाग्य रेखा',  gu: 'ભાગ્ય રેખા',  sa: 'भाग्यरेखा' },
  sun:      { en: 'Sun',      hi: 'सूर्य रेखा',   gu: 'સૂર્ય રેખા',  sa: 'सूर्यरेखा' },
  mercury:  { en: 'Mercury',  hi: 'बुध रेखा',   gu: 'બુધ રેખા',   sa: 'बुधरेखा' },
  marriage: { en: 'Marriage', hi: 'विवाह रेखा',  gu: 'લગ્ન રેખા',  sa: 'विवाहरेखा' },
};

// Palmistry marks — star/cross/triangle/square/island/grille/circle/spot.
const PALM_MARK: EnumMap = {
  star:     { en: 'Star',     hi: 'तारक',  gu: 'તારક',   sa: 'तारकम्' },
  cross:    { en: 'Cross',    hi: 'क्रॉस',   gu: 'ક્રૉસ',    sa: 'क्रूसः' },
  triangle: { en: 'Triangle', hi: 'त्रिकोण', gu: 'ત્રિકોણ', sa: 'त्रिकोणम्' },
  square:   { en: 'Square',   hi: 'चतुष्कोण', gu: 'ચોરસ',  sa: 'चतुष्कोणम्' },
  island:   { en: 'Island',   hi: 'द्वीप',   gu: 'દ્વીપ',   sa: 'द्वीपम्' },
  grille:   { en: 'Grille',   hi: 'जाली',   gu: 'જાળી',   sa: 'जालिका' },
  circle:   { en: 'Circle',   hi: 'वृत्त',   gu: 'વર્તુળ',  sa: 'वृत्तम्' },
  spot:     { en: 'Spot',     hi: 'बिन्दु',  gu: 'બિંદુ',   sa: 'बिन्दुः' },
};

// Tarot suits — major arcana plus the four minor arcana suits.
const TAROT_SUIT: EnumMap = {
  major:     { en: 'Major Arcana', hi: 'महार्कन',     gu: 'મહાઅર્કન',    sa: 'महार्कनम्' },
  wands:     { en: 'Wands',        hi: 'दण्ड',        gu: 'દંડ',         sa: 'दण्डाः' },
  cups:      { en: 'Cups',         hi: 'चषक',        gu: 'ચષક',        sa: 'चषकाः' },
  swords:    { en: 'Swords',       hi: 'खड्ग',       gu: 'ખડ્ગ',       sa: 'खड्गाः' },
  pentacles: { en: 'Pentacles',    hi: 'पञ्चकोण',    gu: 'પંચકોણ',     sa: 'पञ्चकोणाः' },
};

// Tarot suit elements (fire/water/air/earth) — re-used short labels.
const TAROT_ELEMENT: EnumMap = {
  fire:  { en: 'fire',  hi: 'अग्नि', gu: 'અગ્નિ', sa: 'अग्निः' },
  water: { en: 'water', hi: 'जल',   gu: 'જળ',   sa: 'जलम्' },
  air:   { en: 'air',   hi: 'वायु',  gu: 'વાયુ',  sa: 'वायुः' },
  earth: { en: 'earth', hi: 'पृथ्वी', gu: 'પૃથ્વી', sa: 'पृथ्वी' },
};

// Palmistry — finger length labels (long / normal / short).
const FINGER_LENGTH: EnumMap = {
  long:   { en: 'Long',   hi: 'दीर्घ',  gu: 'દીર્ઘ',  sa: 'दीर्घा' },
  normal: { en: 'Balanced', hi: 'सम', gu: 'સંતુલિત', sa: 'समा' },
  short:  { en: 'Short',  hi: 'ह्रस्व', gu: 'હ્રસ્વ', sa: 'ह्रस्वा' },
};

// Palmistry — thumb-type labels.
const THUMB_TYPE: EnumMap = {
  flexible:   { en: 'Flexible',   hi: 'लचीला',     gu: 'લવચીક',     sa: 'लचकदार' },
  firm:       { en: 'Firm',       hi: 'दृढ़',       gu: 'દૃઢ',        sa: 'दृढः' },
  'low-set':  { en: 'Low-set',    hi: 'नीचा',     gu: 'નીચો',      sa: 'नीचस्थः' },
  'high-set': { en: 'High-set',   hi: 'ऊँचा',     gu: 'ઊંચો',      sa: 'उच्चस्थः' },
};

// Palmistry — line quality (absent / faint / clear / deep / broken / chained / forked).
const LINE_QUALITY: EnumMap = {
  absent:  { en: 'Absent',  hi: 'अनुपस्थित', gu: 'અનુપસ્થિત', sa: 'अनुपस्थिता' },
  faint:   { en: 'Faint',   hi: 'क्षीण',     gu: 'ક્ષીણ',     sa: 'क्षीणा' },
  clear:   { en: 'Clear',   hi: 'स्पष्ट',     gu: 'સ્પષ્ટ',     sa: 'स्पष्टा' },
  deep:    { en: 'Deep',    hi: 'गहरी',     gu: 'ઊંડી',     sa: 'गभीरा' },
  broken:  { en: 'Broken',  hi: 'टूटी',      gu: 'તૂટેલી',     sa: 'भग्ना' },
  chained: { en: 'Chained', hi: 'श्रृंखलित', gu: 'સાંકળાવાળી', sa: 'शृङ्खलिता' },
  forked:  { en: 'Forked',  hi: 'द्विशाखी',  gu: 'દ્વિશાખી',  sa: 'द्विशाखा' },
};

// Palmistry — mount size (flat / normal / developed / over-developed).
const MOUNT_SIZE: EnumMap = {
  flat:             { en: 'Flat',             hi: 'चिपटा',         gu: 'સપાટ',         sa: 'समतलः' },
  normal:           { en: 'Balanced',         hi: 'सन्तुलित',       gu: 'સંતુલિત',      sa: 'सन्तुलितः' },
  developed:        { en: 'Developed',        hi: 'विकसित',        gu: 'વિકસિત',       sa: 'विकसितः' },
  'over-developed': { en: 'Over-developed',   hi: 'अति-विकसित',    gu: 'અતિ-વિકસિત',   sa: 'अतिविकसितः' },
};

// Samudrika — complexion (Gaura / Kanchan / Gauravarna / Shyama / Krishna).
const COMPLEXION: EnumMap = {
  fair:     { en: 'Fair',     hi: 'गौर',      gu: 'ગૌર',      sa: 'गौरः' },
  golden:   { en: 'Golden',   hi: 'काञ्चन',   gu: 'કાંચન',    sa: 'कांचनवर्णः' },
  wheatish: { en: 'Wheatish', hi: 'गौरवर्ण',  gu: 'ઘઉંવર્ણ',  sa: 'गौरवर्णः' },
  dusky:    { en: 'Dusky',    hi: 'श्यामल',   gu: 'શ્યામળ',   sa: 'श्यामलः' },
  dark:     { en: 'Dark',     hi: 'कृष्ण',    gu: 'કૃષ્ણ',    sa: 'कृष्णवर्णः' },
};

// Samudrika — body build (Vata / Pitta / Kapha / sama).
const BUILD: EnumMap = {
  lean:     { en: 'Lean',     hi: 'कृश',      gu: 'કૃશ',     sa: 'कृशः' },
  medium:   { en: 'Medium',   hi: 'मध्यम',    gu: 'મધ્યમ',   sa: 'मध्यमः' },
  muscular: { en: 'Muscular', hi: 'मांसल',    gu: 'સ્નાયુબદ્ધ', sa: 'मांसलः' },
  stocky:   { en: 'Stocky',   hi: 'स्थूल',    gu: 'સ્થૂળ',    sa: 'स्थूलः' },
};

// Samudrika — voice quality.
const VOICE_QUALITY: EnumMap = {
  melodious:      { en: 'Melodious',   hi: 'मधुर',     gu: 'મધુર',     sa: 'मधुरः' },
  resonant:       { en: 'Resonant',    hi: 'गम्भीर',    gu: 'ગંભીર',    sa: 'गम्भीरः' },
  soft:           { en: 'Soft',        hi: 'मृदु',     gu: 'મૃદુ',     sa: 'मृदुः' },
  harsh:          { en: 'Harsh',       hi: 'कर्कश',    gu: 'કર્કશ',    sa: 'कर्कशः' },
  'high-pitched': { en: 'High-pitched',hi: 'तीक्ष्ण',   gu: 'તીક્ષ્ણ',   sa: 'तीक्ष्णः' },
};

// Samudrika — gait (gaja / hamsa / vyaghra / vrsabha / mayura / ashva).
const GAIT_TYPE: EnumMap = {
  elephant: { en: 'Elephant gait', hi: 'गज गति',     gu: 'ગજ ગતિ',     sa: 'गजगतिः' },
  swan:     { en: 'Swan gait',     hi: 'हंस गति',    gu: 'હંસ ગતિ',    sa: 'हंसगतिः' },
  tiger:    { en: 'Tiger gait',    hi: 'व्याघ्र गति', gu: 'વ્યાઘ્ર ગતિ', sa: 'व्याघ्रगतिः' },
  bull:     { en: 'Bull gait',     hi: 'वृषभ गति',   gu: 'વૃષભ ગતિ',   sa: 'वृषभगतिः' },
  peacock:  { en: 'Peacock gait',  hi: 'मयूर गति',   gu: 'મયૂર ગતિ',   sa: 'मयूरगतिः' },
  horse:    { en: 'Horse gait',    hi: 'अश्व गति',   gu: 'અશ્વ ગતિ',   sa: 'अश्वगतिः' },
};

// Samudrika — feature value labels (forehead / eyes / eyebrows / etc).
const SAMUDRIKA_VALUE: EnumMap = {
  // Generic small descriptors
  short:        { en: 'Short',       hi: 'छोटा',      gu: 'ટૂંકું',      sa: 'ह्रस्वम्' },
  medium:       { en: 'Medium',      hi: 'मध्यम',     gu: 'મધ્યમ',     sa: 'मध्यमम्' },
  tall:         { en: 'Tall',        hi: 'दीर्घ',     gu: 'ઊંચું',      sa: 'दीर्घम्' },
  long:         { en: 'Long',        hi: 'दीर्घ',     gu: 'દીર્ઘ',     sa: 'दीर्घम्' },
  // Forehead
  broad:        { en: 'Broad',       hi: 'विस्तृत',    gu: 'વિશાળ',     sa: 'विस्तीर्णम्' },
  narrow:       { en: 'Narrow',      hi: 'सङ्कीर्ण',  gu: 'સાંકડું',    sa: 'सङ्कीर्णम्' },
  // Eyes
  lotus:        { en: 'Lotus-shaped',hi: 'पद्म-नेत्र', gu: 'પદ્મ-નેત્ર', sa: 'पद्मनेत्रम्' },
  'deep-set':   { en: 'Deep-set',    hi: 'गम्भीर',    gu: 'ઊંડું',      sa: 'गम्भीरम्' },
  large:        { en: 'Large',       hi: 'विशाल',    gu: 'મોટું',      sa: 'विशालम्' },
  almond:       { en: 'Almond',      hi: 'बादामी',    gu: 'બદામી',    sa: 'बादामी' },
  small:        { en: 'Small',       hi: 'लघु',      gu: 'નાનું',      sa: 'लघु' },
  // Eyebrows
  arched:       { en: 'Arched',      hi: 'धनुषाकार',  gu: 'કમાનદાર',  sa: 'धनुराकारम्' },
  straight:     { en: 'Straight',    hi: 'सीधी',     gu: 'સીધી',     sa: 'सरला' },
  thick:        { en: 'Thick',       hi: 'घनी',      gu: 'ગાઢી',     sa: 'घना' },
  joined:       { en: 'Joined',      hi: 'मिलित',    gu: 'મળેલી',    sa: 'मिलिता' },
  // Nose
  aquiline:     { en: 'Aquiline',    hi: 'गरुडवत्',   gu: 'ગરુડ',      sa: 'गरुडवत्' },
  upturned:     { en: 'Upturned',    hi: 'उठी हुई',   gu: 'ઊંચી',      sa: 'उन्नता' },
  flat:         { en: 'Flat',        hi: 'चपटा',     gu: 'સપાટ',     sa: 'समतलः' },
  // Lips
  thin:         { en: 'Thin',        hi: 'पतले',     gu: 'પાતળા',    sa: 'सूक्ष्माः' },
  full:         { en: 'Full',        hi: 'भरे',      gu: 'ભરાવદાર',  sa: 'पूर्णौ' },
  // Neck
  'conch-like': { en: 'Conch-like',  hi: 'शंखवत्',   gu: 'શંખવત્',    sa: 'शङ्खवत्' },
  // Shoulders
  drooping:     { en: 'Drooping',    hi: 'ढुलकती',   gu: 'ઢળતી',     sa: 'अवसन्ना' },
  // Hands / feet
  soft:         { en: 'Soft',        hi: 'कोमल',     gu: 'નાજુક',    sa: 'कोमलः' },
  firm:         { en: 'Firm',        hi: 'दृढ़',     gu: 'દૃઢ',      sa: 'दृढः' },
  'soft-rosy':  { en: 'Soft & rosy', hi: 'कोमल-गुलाबी', gu: 'કોમળ-ગુલાબી', sa: 'कोमल-रक्तवर्णौ' },
  cracked:      { en: 'Cracked',     hi: 'फटे',      gu: 'ફાટેલા',   sa: 'विदीर्णौ' },
  // Hair
  wavy:         { en: 'Wavy',        hi: 'लहरीला',   gu: 'લહેરિયાળું',sa: 'तरङ्गिणी' },
  curly:        { en: 'Curly',       hi: 'घुँघराले',  gu: 'ઘૂંઘરાળું',  sa: 'कुटिला' },
  // Navel
  deep:         { en: 'Deep',        hi: 'गहरी',     gu: 'ઊંડી',      sa: 'गभीरा' },
  shallow:      { en: 'Shallow',     hi: 'छिछली',    gu: 'છીછરી',    sa: 'उत्तरला' },
  // Laughter
  restrained:   { en: 'Restrained',  hi: 'संयमित',   gu: 'સંયમિત',    sa: 'संयता' },
  hearty:       { en: 'Hearty',      hi: 'मुक्त',     gu: 'ખુલ્લા-દિલે', sa: 'मुक्तम्' },
  shrill:       { en: 'Shrill',      hi: 'तीखा',     gu: 'તીખું',     sa: 'तीक्ष्णम्' },
};

// Samudrika — feature key (for headings / legends).
const SAMUDRIKA_FEATURE_KEY: EnumMap = {
  forehead:   { en: 'Forehead',  hi: 'ललाट',     gu: 'કપાળ',    sa: 'ललाटम्' },
  eyes:       { en: 'Eyes',      hi: 'नेत्र',     gu: 'આંખ',     sa: 'नेत्रे' },
  eyebrows:   { en: 'Eyebrows',  hi: 'भ्रू',      gu: 'ભ્રમર',    sa: 'भ्रूः' },
  nose:       { en: 'Nose',      hi: 'नासिका',    gu: 'નાક',     sa: 'नासिका' },
  lips:       { en: 'Lips',      hi: 'अधर',     gu: 'હોઠ',     sa: 'ओष्ठौ' },
  neck:       { en: 'Neck',      hi: 'कण्ठ',     gu: 'ગરદન',   sa: 'कण्ठः' },
  shoulders:  { en: 'Shoulders', hi: 'स्कन्ध',    gu: 'ખભા',    sa: 'स्कन्धौ' },
  hands:      { en: 'Hands',     hi: 'हाथ',     gu: 'હાથ',    sa: 'हस्तौ' },
  feet:       { en: 'Feet',      hi: 'पाद',     gu: 'પગ',     sa: 'पादौ' },
  hair:       { en: 'Hair',      hi: 'केश',     gu: 'વાળ',    sa: 'केशाः' },
  height:     { en: 'Height',    hi: 'ऊँचाई',   gu: 'ઊંચાઈ',  sa: 'उच्चता' },
  voice:      { en: 'Voice',     hi: 'स्वर',     gu: 'સ્વર',     sa: 'स्वरः' },
  gait:       { en: 'Gait',      hi: 'गति',     gu: 'ગતિ',     sa: 'गतिः' },
  laughter:   { en: 'Laughter',  hi: 'हास्य',    gu: 'હાસ્ય',    sa: 'हास्यम्' },
  naveldepth: { en: 'Navel',     hi: 'नाभि',    gu: 'નાભિ',    sa: 'नाभिः' },
  build:      { en: 'Build',     hi: 'देह-गठन',  gu: 'કાયા',    sa: 'देहसंहितिः' },
  complexion: { en: 'Complexion',hi: 'वर्ण',     gu: 'વર્ણ',     sa: 'वर्णः' },
};

// Samudrika — dosha labels (Vata / Pitta / Kapha + balanced).
const DOSHA_LABEL: EnumMap = {
  'Vata-dominant':       { en: 'Vata-dominant',       hi: 'वात-प्रधान',     gu: 'વાત-પ્રધાન',     sa: 'वातप्रधानः' },
  'Pitta-dominant':      { en: 'Pitta-dominant',      hi: 'पित्त-प्रधान',   gu: 'પિત્ત-પ્રધાન',   sa: 'पित्तप्रधानः' },
  'Kapha-dominant':      { en: 'Kapha-dominant',      hi: 'कफ-प्रधान',     gu: 'કફ-પ્રધાન',     sa: 'कफप्रधानः' },
  'Tridosha-balanced':   { en: 'Tridosha-balanced',   hi: 'त्रिदोष-सम',    gu: 'ત્રિદોષ-સંતુલિત', sa: 'त्रिदोषसमः' },
};

// Graphology — slant (left / vertical / right / variable).
const SLANT: EnumMap = {
  left:     { en: 'Left',     hi: 'वाम',       gu: 'ડાબું',      sa: 'वामः' },
  vertical: { en: 'Vertical', hi: 'सीधा',     gu: 'સીધું',      sa: 'सरलः' },
  right:    { en: 'Right',    hi: 'दक्षिण',   gu: 'જમણું',    sa: 'दक्षिणः' },
  variable: { en: 'Variable', hi: 'परिवर्ती', gu: 'પરિવર્તી',  sa: 'परिवर्तनशीलः' },
};

// Graphology — pressure (light / medium / heavy / variable).
const PRESSURE: EnumMap = {
  light:    { en: 'Light',    hi: 'हल्का',    gu: 'હળવો',    sa: 'लघुः' },
  medium:   { en: 'Medium',   hi: 'मध्यम',    gu: 'મધ્યમ',    sa: 'मध्यमः' },
  heavy:    { en: 'Heavy',    hi: 'भारी',    gu: 'ભારે',     sa: 'गुरुः' },
  variable: { en: 'Variable', hi: 'परिवर्ती', gu: 'પરિવર્તી',  sa: 'परिवर्तनशीलः' },
};

// Graphology — size / spacing / baseline / loop / tbar / idot / signature / connection.
const HAND_SIZE: EnumMap = {
  small:  { en: 'Small',  hi: 'छोटा',    gu: 'નાનું',    sa: 'सूक्ष्मम्' },
  medium: { en: 'Medium', hi: 'मध्यम',    gu: 'મધ્યમ',    sa: 'मध्यमम्' },
  large:  { en: 'Large',  hi: 'बड़ा',    gu: 'મોટું',     sa: 'विशालम्' },
};

const HAND_SPACING: EnumMap = {
  tight: { en: 'Tight', hi: 'सघन',    gu: 'ઘટ્ટ',    sa: 'सङ्कुलम्' },
  even:  { en: 'Even',  hi: 'सम',     gu: 'સમ',     sa: 'समम्' },
  wide:  { en: 'Wide',  hi: 'विस्तृत', gu: 'પહોળું',  sa: 'विस्तीर्णम्' },
};

const HAND_BASELINE: EnumMap = {
  rising:  { en: 'Rising',  hi: 'आरोहक',  gu: 'ચઢતી',    sa: 'आरोहकम्' },
  level:   { en: 'Level',   hi: 'समतल',   gu: 'સમતલ',   sa: 'समतलम्' },
  falling: { en: 'Falling', hi: 'अवरोहक', gu: 'ઉતરતી',   sa: 'अवरोहकम्' },
  wavy:    { en: 'Wavy',    hi: 'तरङ्गित',gu: 'લહેરિયું',  sa: 'तरङ्गितम्' },
};

const HAND_LOOP: EnumMap = {
  absent:      { en: 'Absent',      hi: 'अनुपस्थित', gu: 'અનુપસ્થિત', sa: 'अनुपस्थिताः' },
  narrow:      { en: 'Narrow',      hi: 'सङ्कीर्ण',  gu: 'સાંકડા',    sa: 'सङ्कीर्णाः' },
  rounded:     { en: 'Rounded',     hi: 'गोलाकार',  gu: 'ગોળાકાર',  sa: 'गोलाकाराः' },
  exaggerated: { en: 'Exaggerated', hi: 'अतिशयित',  gu: 'અતિશયોક્ત', sa: 'अतिशयिताः' },
};

const TBAR: EnumMap = {
  low:    { en: 'Low',     hi: 'नीचा',    gu: 'નીચું',    sa: 'अधोलिखितम्' },
  middle: { en: 'Mid',     hi: 'मध्य',    gu: 'મધ્યમ',    sa: 'मध्ये लिखितम्' },
  high:   { en: 'High',    hi: 'ऊँचा',    gu: 'ઊંચું',    sa: 'उच्चलिखितम्' },
  absent: { en: 'Missing', hi: 'अनुपस्थित', gu: 'અનુપસ્થિત', sa: 'अनुपस्थितम्' },
};

const IDOT: EnumMap = {
  omitted: { en: 'Omitted', hi: 'त्यक्त',  gu: 'છોડેલું',   sa: 'त्यक्तः' },
  precise: { en: 'Precise', hi: 'सटीक',   gu: 'ચોકસાઈ',   sa: 'सूक्ष्मः' },
  high:    { en: 'Floating',hi: 'उत्तुंग',  gu: 'ઊંચું',     sa: 'उत्थितः' },
  circle:  { en: 'Circle',  hi: 'वृत्त',    gu: 'વર્તુળ',    sa: 'वृत्तरूपः' },
  stroke:  { en: 'Slash',   hi: 'रेखा',    gu: 'લકીર',    sa: 'रेखारूपः' },
};

const SIGNATURE_TYPE: EnumMap = {
  matches:    { en: 'Matches',    hi: 'अनुरूप',     gu: 'સમાન',     sa: 'अनुरूपा' },
  larger:     { en: 'Larger',     hi: 'बड़ी',      gu: 'મોટી',     sa: 'विशालतरा' },
  smaller:    { en: 'Smaller',    hi: 'छोटी',      gu: 'નાની',     sa: 'सूक्ष्मतरा' },
  illegible:  { en: 'Illegible',  hi: 'अपठनीय',    gu: 'અપાત્ર',    sa: 'अपठनीया' },
  underlined: { en: 'Underlined', hi: 'रेखांकित',   gu: 'રેખાંકિત',  sa: 'रेखाङ्किता' },
};

const CONNECTION: EnumMap = {
  connected:    { en: 'Connected',    hi: 'सम्बद्ध',  gu: 'જોડાયેલ',   sa: 'सम्बद्धम्' },
  disconnected: { en: 'Disconnected', hi: 'विच्छिन्न', gu: 'વિખંડિત',   sa: 'विच्छिन्नम्' },
  mixed:        { en: 'Mixed',        hi: 'मिश्रित',  gu: 'મિશ્રિત',   sa: 'मिश्रम्' },
};

// Graphology — Big-Five trait labels.
const BIG_FIVE: EnumMap = {
  openness:          { en: 'Openness',          hi: 'खुलापन',       gu: 'ખુલ્લાપણ',     sa: 'मुक्तत्वम्' },
  conscientiousness: { en: 'Conscientiousness', hi: 'विवेकशीलता',   gu: 'વિવેકશીલતા',  sa: 'विवेकशीलता' },
  extraversion:      { en: 'Extraversion',      hi: 'बहिर्मुखता',    gu: 'બહિર્મુખતા',   sa: 'बहिर्मुखता' },
  agreeableness:     { en: 'Agreeableness',     hi: 'सहयोगिता',     gu: 'સહકારી-વૃત્તિ',sa: 'सहयोगिता' },
  stability:         { en: 'Stability',         hi: 'स्थिरता',        gu: 'સ્થિરતા',     sa: 'स्थिरता' },
};

// Tarot — spread types (three-card / celtic-cross / chart-overlay).
const TAROT_SPREAD_TYPE: EnumMap = {
  'three-card':   { en: 'Three-card spread',  hi: 'त्रि-पत्र विन्यास',  gu: 'ત્રિ-પત્તી વિન્યાસ', sa: 'त्रिपत्रविन्यासः' },
  'celtic-cross': { en: 'Celtic Cross',       hi: 'सेल्टिक क्रॉस',     gu: 'સેલ્ટિક ક્રૉસ',     sa: 'सेल्टिक्-क्रूसः' },
  'chart-overlay':{ en: 'Chart overlay',      hi: 'कुण्डली-आधारित',   gu: 'કુંડળી-આધારિત',   sa: 'कुण्डल्याधारितः' },
};

// Tarot — orientation (upright / reversed).
const TAROT_ORIENTATION: EnumMap = {
  upright:  { en: 'upright',  hi: 'सीधा',    gu: 'સીધું',    sa: 'ऋजुः' },
  reversed: { en: 'reversed', hi: 'विपरीत',  gu: 'ઊંધું',    sa: 'विपरीतः' },
};

// Numerology-deep — name compatibility quality.
const NUMEROLOGY_QUALITY: EnumMap = {
  'identical resonance — mirror dynamic': {
    en: 'identical resonance — mirror dynamic',
    hi: 'समान कम्पन — दर्पण-तुल्य सम्बन्ध',
    gu: 'સમાન કંપન — દર્પણ-સમ સંબંધ',
    sa: 'समानानुनादः — दर्पणसम्बन्धः',
  },
  harmonious: {
    en: 'harmonious',
    hi: 'सामञ्जस्यपूर्ण',
    gu: 'સામંજસ્યપૂર્ણ',
    sa: 'सामञ्जस्यपूर्णः',
  },
  'workable, needs communication': {
    en: 'workable, needs communication',
    hi: 'कार्यसाध्य — वार्तालाप अपेक्षित',
    gu: 'કાર્યસાધ્ય — સંવાદ આવશ્યક',
    sa: 'कार्यसाध्यः — संवादापेक्षी',
  },
  'challenging polarity': {
    en: 'challenging polarity',
    hi: 'प्रतिकूल ध्रुवीयता',
    gu: 'પ્રતિકૂળ ધ્રુવીયતા',
    sa: 'प्रतिकूलद्वैतम्',
  },
};

// ─── Remedies — closed-set helpers ──────────────────────────────────────────
// Deities, fasting-day labels, gemstone substitutes, and charity items
// emitted by remedies.service / data/remedies / gemstones.service.

const DEITY: EnumMap = {
  Surya:                       { en: 'Surya',                       hi: 'सूर्य',               gu: 'સૂર્ય',               sa: 'सूर्यः' },
  'Surya / Shiva':             { en: 'Surya / Shiva',               hi: 'सूर्य / शिव',         gu: 'સૂર્ય / શિવ',         sa: 'सूर्यः / शिवः' },
  'Parvati / Chandra':         { en: 'Parvati / Chandra',           hi: 'पार्वती / चन्द्र',     gu: 'પાર્વતી / ચંદ્ર',     sa: 'पार्वती / चन्द्रः' },
  'Kartikeya / Hanuman':       { en: 'Kartikeya / Hanuman',         hi: 'कार्तिकेय / हनुमान',  gu: 'કાર્તિકેય / હનુમાન',  sa: 'कार्तिकेयः / हनुमान्' },
  Vishnu:                      { en: 'Vishnu',                      hi: 'विष्णु',               gu: 'વિષ્ણુ',              sa: 'विष्णुः' },
  'Brihaspati / Dattatreya':   { en: 'Brihaspati / Dattatreya',     hi: 'बृहस्पति / दत्तात्रेय', gu: 'બૃહસ્પતિ / દત્તાત્રેય', sa: 'बृहस्पतिः / दत्तात्रेयः' },
  'Lakshmi / Shukra':          { en: 'Lakshmi / Shukra',            hi: 'लक्ष्मी / शुक्र',     gu: 'લક્ષ્મી / શુક્ર',     sa: 'लक्ष्मीः / शुक्रः' },
  'Shani / Hanuman / Bhairava':{ en: 'Shani / Hanuman / Bhairava',  hi: 'शनि / हनुमान / भैरव', gu: 'શનિ / હનુમાન / ભૈરવ', sa: 'शनिः / हनुमान् / भैरवः' },
  'Durga / Bhairava':          { en: 'Durga / Bhairava',            hi: 'दुर्गा / भैरव',       gu: 'દુર્ગા / ભૈરવ',       sa: 'दुर्गा / भैरवः' },
  'Ganesha / Bhairava':        { en: 'Ganesha / Bhairava',          hi: 'गणेश / भैरव',         gu: 'ગણેશ / ભૈરવ',         sa: 'गणेशः / भैरवः' },
};

// Fasting-day labels emitted by remedies + data/remedies. Includes plain
// weekdays, "Sunday morning"/"Saturday evening" (period suffixes) and the
// "(co-lord)" markers for nodal grahas.
const FASTING_DAY_LABEL: EnumMap = {
  Sunday:    { en: 'Sunday',    hi: 'रविवार',    gu: 'રવિવાર',    sa: 'रविवासरः' },
  Monday:    { en: 'Monday',    hi: 'सोमवार',    gu: 'સોમવાર',    sa: 'सोमवासरः' },
  Tuesday:   { en: 'Tuesday',   hi: 'मंगलवार',   gu: 'મંગળવાર',   sa: 'भौमवासरः' },
  Wednesday: { en: 'Wednesday', hi: 'बुधवार',    gu: 'બુધવાર',    sa: 'बुधवासरः' },
  Thursday:  { en: 'Thursday',  hi: 'गुरुवार',    gu: 'ગુરુવાર',    sa: 'गुरुवासरः' },
  Friday:    { en: 'Friday',    hi: 'शुक्रवार',   gu: 'શુક્રવાર',   sa: 'शुक्रवासरः' },
  Saturday:  { en: 'Saturday',  hi: 'शनिवार',    gu: 'શનિવાર',    sa: 'शनिवासरः' },
  'Sunday morning':    { en: 'Sunday morning',    hi: 'रविवार प्रातः',    gu: 'રવિવાર સવારે',    sa: 'रविवासरे प्रातःकाले' },
  'Monday morning':    { en: 'Monday morning',    hi: 'सोमवार प्रातः',    gu: 'સોમવાર સવારે',    sa: 'सोमवासरे प्रातःकाले' },
  'Tuesday morning':   { en: 'Tuesday morning',   hi: 'मंगलवार प्रातः',   gu: 'મંગળવાર સવારે',   sa: 'भौमवासरे प्रातःकाले' },
  'Wednesday morning': { en: 'Wednesday morning', hi: 'बुधवार प्रातः',    gu: 'બુધવાર સવારે',    sa: 'बुधवासरे प्रातःकाले' },
  'Thursday morning':  { en: 'Thursday morning',  hi: 'गुरुवार प्रातः',    gu: 'ગુરુવાર સવારે',    sa: 'गुरुवासरे प्रातःकाले' },
  'Friday morning':    { en: 'Friday morning',    hi: 'शुक्रवार प्रातः',   gu: 'શુક્રવાર સવારે',   sa: 'शुक्रवासरे प्रातःकाले' },
  'Saturday morning':  { en: 'Saturday morning',  hi: 'शनिवार प्रातः',    gu: 'શનિવાર સવારે',    sa: 'शनिवासरे प्रातःकाले' },
  'Sunday evening':    { en: 'Sunday evening',    hi: 'रविवार सायं',      gu: 'રવિવાર સાંજે',    sa: 'रविवासरे सायंकाले' },
  'Monday evening':    { en: 'Monday evening',    hi: 'सोमवार सायं',      gu: 'સોમવાર સાંજે',    sa: 'सोमवासरे सायंकाले' },
  'Tuesday evening':   { en: 'Tuesday evening',   hi: 'मंगलवार सायं',     gu: 'મંગળવાર સાંજે',   sa: 'भौमवासरे सायंकाले' },
  'Wednesday evening': { en: 'Wednesday evening', hi: 'बुधवार सायं',      gu: 'બુધવાર સાંજે',    sa: 'बुधवासरे सायंकाले' },
  'Thursday evening':  { en: 'Thursday evening',  hi: 'गुरुवार सायं',     gu: 'ગુરુવાર સાંજે',    sa: 'गुरुवासरे सायंकाले' },
  'Friday evening':    { en: 'Friday evening',    hi: 'शुक्रवार सायं',    gu: 'શુક્રવાર સાંજે',   sa: 'शुक्रवासरे सायंकाले' },
  'Saturday evening':  { en: 'Saturday evening',  hi: 'शनिवार सायं',      gu: 'શનિવાર સાંજે',    sa: 'शनिवासरे सायंकाले' },
  'Saturday (co-lord)':{ en: 'Saturday (co-lord)',hi: 'शनिवार (सह-स्वामी)',gu: 'શનિવાર (સહ-સ્વામી)', sa: 'शनिवासरः (सहनाथः)' },
  'Tuesday (co-lord)': { en: 'Tuesday (co-lord)', hi: 'मंगलवार (सह-स्वामी)',gu: 'મંગળવાર (સહ-સ્વામી)', sa: 'भौमवासरः (सहनाथः)' },
};

// Substitute / up-ratna stones not already covered by GEMSTONE.
const GEMSTONE_SUBSTITUTE: EnumMap = {
  // primaries (also accept primary names so callers can route everything here)
  Ruby:                  { en: 'Ruby',                  hi: 'माणिक्य',       gu: 'માણેક',         sa: 'माणिक्यम्' },
  Pearl:                 { en: 'Pearl',                 hi: 'मोती',          gu: 'મોતી',          sa: 'मुक्ता' },
  'Red Coral':           { en: 'Red Coral',             hi: 'मूंगा',          gu: 'પરવાળું',       sa: 'प्रवालम्' },
  Emerald:               { en: 'Emerald',               hi: 'पन्ना',         gu: 'પન્ના',         sa: 'मरकतम्' },
  'Yellow Sapphire':     { en: 'Yellow Sapphire',       hi: 'पुखराज',       gu: 'પુખરાજ',       sa: 'पुष्परागः' },
  Diamond:               { en: 'Diamond',               hi: 'हीरा',          gu: 'હીરો',          sa: 'वज्रम्' },
  'Blue Sapphire':       { en: 'Blue Sapphire',         hi: 'नीलम',         gu: 'નીલમ',         sa: 'नीलमणिः' },
  Hessonite:             { en: 'Hessonite',             hi: 'गोमेद',         gu: 'ગોમેદ',         sa: 'गोमेदः' },
  "Cat's Eye":           { en: "Cat's Eye",             hi: 'लहसुनिया',     gu: 'લહસુનિયા',     sa: 'वैदूर्यम्' },
  // common aliases (Hindi-language names)
  Manik:                 { en: 'Manik',                 hi: 'माणिक्य',       gu: 'માણેક',         sa: 'माणिक्यम्' },
  Moti:                  { en: 'Moti',                  hi: 'मोती',          gu: 'મોતી',          sa: 'मुक्ता' },
  Moonga:                { en: 'Moonga',                hi: 'मूंगा',          gu: 'પરવાળું',       sa: 'प्रवालम्' },
  Panna:                 { en: 'Panna',                 hi: 'पन्ना',         gu: 'પન્ના',         sa: 'मरकतम्' },
  Pukhraj:               { en: 'Pukhraj',               hi: 'पुखराज',       gu: 'પુખરાજ',       sa: 'पुष्परागः' },
  Heera:                 { en: 'Heera',                 hi: 'हीरा',          gu: 'હીરો',          sa: 'वज्रम्' },
  Neelam:                { en: 'Neelam',                hi: 'नीलम',         gu: 'નીલમ',         sa: 'नीलमणिः' },
  Gomed:                 { en: 'Gomed',                 hi: 'गोमेद',         gu: 'ગોમેદ',         sa: 'गोमेदः' },
  Lehsuniya:             { en: 'Lehsuniya',             hi: 'लहसुनिया',     gu: 'લહસુનિયા',     sa: 'वैदूर्यम्' },
  Lahsuniya:             { en: 'Lahsuniya',             hi: 'लहसुनिया',     gu: 'લહસુનિયા',     sa: 'वैदूर्यम्' },
  Topaz:                 { en: 'Topaz',                 hi: 'पुखराज',       gu: 'પુખરાજ',       sa: 'पुष्परागः' },
  // substitutes
  'Red Garnet':          { en: 'Red Garnet',            hi: 'लाल गार्नेट',   gu: 'લાલ ગાર્નેટ',   sa: 'रक्तगार्नेटः' },
  'Red Spinel':          { en: 'Red Spinel',            hi: 'लाल स्पिनेल',   gu: 'લાલ સ્પિનેલ',   sa: 'रक्तस्पिनेलः' },
  'Red Tourmaline':      { en: 'Red Tourmaline',        hi: 'लाल टूर्मेलिन',  gu: 'લાલ ટૂર્મલિન',  sa: 'रक्ततूर्मलिनम्' },
  Rubellite:             { en: 'Rubellite',             hi: 'रूबेलाइट',     gu: 'રૂબેલાઈટ',     sa: 'रूबेलाइट्' },
  Moonstone:             { en: 'Moonstone',             hi: 'चंद्रकांत',    gu: 'ચંદ્રકાંત',    sa: 'चन्द्रकान्तः' },
  'White Coral':         { en: 'White Coral',           hi: 'श्वेत मूंगा',     gu: 'શ્વેત પરવાળું',  sa: 'श्वेतप्रवालम्' },
  'Cultured Pearl':      { en: 'Cultured Pearl',        hi: 'संवर्धित मोती',  gu: 'સંવર્ધિત મોતી',  sa: 'सम्पादितमुक्ता' },
  Carnelian:             { en: 'Carnelian',             hi: 'सुलेमानी',      gu: 'કાર્નેલિયન',    sa: 'सुलेमानी' },
  'Red Jasper':          { en: 'Red Jasper',            hi: 'लाल जैस्पर',    gu: 'લાલ જૈસ્પર',    sa: 'रक्तजैस्परम्' },
  Sardonyx:              { en: 'Sardonyx',              hi: 'सार्डोनिक्स',  gu: 'સાર્ડોનિક્સ',  sa: 'सार्डोनिक्सः' },
  Peridot:               { en: 'Peridot',               hi: 'पेरिडॉट',       gu: 'પેરીડોટ',       sa: 'पेरिडॉट्' },
  'Green Tourmaline':    { en: 'Green Tourmaline',      hi: 'हरित टूर्मेलिन', gu: 'લીલો ટૂર્મલિન', sa: 'हरिततूर्मलिनम्' },
  'Green Aventurine':    { en: 'Green Aventurine',      hi: 'हरित एवेंट्यूरीन', gu: 'લીલો એવેન્ચ્યુરિન', sa: 'हरितएवेन्ट्युरीनम्' },
  'Yellow Topaz':        { en: 'Yellow Topaz',          hi: 'पीला पुखराज',  gu: 'પીળો પુખરાજ',  sa: 'पीतपुष्परागः' },
  Citrine:               { en: 'Citrine',               hi: 'सुनहला',         gu: 'સુનહલા',        sa: 'सुनहला' },
  'Yellow Citrine':      { en: 'Yellow Citrine',        hi: 'पीला सुनहला',   gu: 'પીળો સુનહલા',   sa: 'पीतसुनहला' },
  'Yellow Beryl (Heliodor)': { en: 'Yellow Beryl (Heliodor)', hi: 'पीला बेरील', gu: 'પીળો બેરિલ', sa: 'पीतवैडूर्यम्' },
  'White Sapphire':      { en: 'White Sapphire',        hi: 'सफेद नीलम',    gu: 'શ્વેત નીલમ',    sa: 'श्वेतनीलमणिः' },
  'White Topaz':         { en: 'White Topaz',           hi: 'सफेद पुखराज',  gu: 'શ્વેત પુખરાજ',  sa: 'श्वेतपुष्परागः' },
  'White Zircon':        { en: 'White Zircon',          hi: 'सफेद जिरकोन',  gu: 'શ્વેત ઝિરકોન',  sa: 'श्वेतजिरकोनम्' },
  Zircon:                { en: 'Zircon',                hi: 'जिरकोन',        gu: 'ઝિરકોન',        sa: 'जिरकोनम्' },
  'Quartz Crystal':      { en: 'Quartz Crystal',        hi: 'स्फटिक',        gu: 'સ્ફટિક',        sa: 'स्फटिकम्' },
  Opal:                  { en: 'Opal',                  hi: 'ओपल',          gu: 'ઓપલ',          sa: 'उपलः' },
  Amethyst:              { en: 'Amethyst',              hi: 'जमुनिया',       gu: 'જમુનિયા',       sa: 'जमुनिया' },
  'Lapis Lazuli':        { en: 'Lapis Lazuli',          hi: 'लाजवर्द',       gu: 'લાજવર્દ',       sa: 'लाजवर्दः' },
  Iolite:                { en: 'Iolite',                hi: 'आयोलाइट',      gu: 'આયોલાઈટ',      sa: 'आयोलाइट्' },
  Tanzanite:             { en: 'Tanzanite',             hi: 'टांज़नाइट',     gu: 'ટેનઝનાઇટ',     sa: 'तंजनाइट्' },
  'Smoky Quartz':        { en: 'Smoky Quartz',          hi: 'धूम्र स्फटिक',  gu: 'ધૂમ્ર સ્ફટિક',  sa: 'धूम्रस्फटिकम्' },
  'Orange Zircon':        { en: 'Orange Zircon',         hi: 'नारंगी जिरकोन', gu: 'નારંગી ઝિરકોન', sa: 'नारङ्गजिरकोनम्' },
  'Honey-Gomedaka':       { en: 'Honey-Gomedaka',        hi: 'मधु गोमेद',     gu: 'મધ ગોમેદ',      sa: 'मधुगोमेदः' },
  'Spessartite Garnet':   { en: 'Spessartite Garnet',    hi: 'स्पेसार्टाइट गार्नेट', gu: 'સ્પેસાર્ટાઇટ ગાર્નેટ', sa: 'स्पेसार्टाइट-गार्नेटः' },
  Chrysoberyl:           { en: 'Chrysoberyl',           hi: 'क्रिसोबेरील',  gu: 'ક્રિસોબેરિલ',  sa: 'क्रिसोबेरीलम्' },
  'Tiger Eye':           { en: 'Tiger Eye',             hi: 'व्याघ्रनयन',   gu: 'વ્યાઘ્રનયન',   sa: 'व्याघ्रनेत्रम्' },
  'Quartz Cat-eye':      { en: 'Quartz Cat-eye',        hi: 'स्फटिक लहसुनिया', gu: 'સ્ફટિક લહસુનિયા', sa: 'स्फटिकवैदूर्यम्' },
  Garnet:                { en: 'Garnet',                hi: 'रक्तमणि',      gu: 'ગાર્નેટ',      sa: 'रक्तमणिः' },
  Spinel:                { en: 'Spinel',                hi: 'स्पिनेल',       gu: 'સ્પિનેલ',       sa: 'स्पिनेल' },
  'Hessonite Garnet':    { en: 'Hessonite Garnet',      hi: 'गोमेद',         gu: 'ગોમેદ',         sa: 'गोमेदः' },
  // parenthesized aliases used as primaries
  'Ruby (Manik)':                { en: 'Ruby (Manik)',                hi: 'माणिक्य (मणिक)',   gu: 'માણેક (મણિક)',     sa: 'माणिक्यम् (मणिकम्)' },
  'Pearl (Moti)':                { en: 'Pearl (Moti)',                hi: 'मोती (मोती)',      gu: 'મોતી (મોતી)',     sa: 'मुक्ता (मोती)' },
  'Red Coral (Moonga)':          { en: 'Red Coral (Moonga)',          hi: 'मूंगा',             gu: 'પરવાળું',         sa: 'प्रवालम् (मूंगा)' },
  'Emerald (Panna)':             { en: 'Emerald (Panna)',             hi: 'पन्ना',            gu: 'પન્ના',           sa: 'मरकतम् (पन्ना)' },
  'Yellow Sapphire (Pukhraj)':   { en: 'Yellow Sapphire (Pukhraj)',   hi: 'पुखराज',          gu: 'પુખરાજ',         sa: 'पुष्परागः (पुखराजः)' },
  'Diamond (Heera)':             { en: 'Diamond (Heera)',             hi: 'हीरा',             gu: 'હીરો',            sa: 'वज्रम् (हीरा)' },
  'Blue Sapphire (Neelam)':      { en: 'Blue Sapphire (Neelam)',      hi: 'नीलम',            gu: 'નીલમ',           sa: 'नीलमणिः (नीलम)' },
  'Hessonite Garnet (Gomed)':    { en: 'Hessonite Garnet (Gomed)',    hi: 'गोमेद',            gu: 'ગોમેદ',           sa: 'गोमेदः (गोमेदः)' },
  "Cat's Eye (Lahsuniya)":       { en: "Cat's Eye (Lahsuniya)",       hi: 'लहसुनिया',        gu: 'લહસુનિયા',       sa: 'वैदूर्यम् (लहसुनिया)' },
  "Cat's Eye (Lehsuniya)":       { en: "Cat's Eye (Lehsuniya)",       hi: 'लहसुनिया',        gu: 'લહસુનિયા',       sa: 'वैदूर्यम् (लहसुनिया)' },
  'Hessonite (Gomed)':           { en: 'Hessonite (Gomed)',           hi: 'गोमेद',            gu: 'ગોમેદ',           sa: 'गोमेदः (गोमेदः)' },
};

// Charity / donation items emitted by remedies.service + data/remedies.
const CHARITY_ITEM: EnumMap = {
  Wheat:                  { en: 'Wheat',                  hi: 'गेहूँ',             gu: 'ઘઉં',             sa: 'गोधूमः' },
  wheat:                  { en: 'wheat',                  hi: 'गेहूँ',             gu: 'ઘઉં',             sa: 'गोधूमः' },
  Jaggery:                { en: 'Jaggery',                hi: 'गुड़',              gu: 'ગોળ',             sa: 'गुडः' },
  jaggery:                { en: 'jaggery',                hi: 'गुड़',              gu: 'ગોળ',             sa: 'गुडः' },
  Copper:                 { en: 'Copper',                 hi: 'तांबा',             gu: 'તાંબુ',           sa: 'ताम्रम्' },
  copper:                 { en: 'copper',                 hi: 'तांबा',             gu: 'તાંબુ',           sa: 'ताम्रम्' },
  'Copper items':         { en: 'Copper items',           hi: 'तांबे की वस्तुएँ',  gu: 'તાંબાની વસ્તુઓ',  sa: 'ताम्रवस्तूनि' },
  'red flowers':          { en: 'red flowers',            hi: 'लाल पुष्प',        gu: 'લાલ ફૂલો',        sa: 'रक्तपुष्पाणि' },
  Rice:                   { en: 'Rice',                   hi: 'चावल',            gu: 'ચોખા',           sa: 'तण्डुलाः' },
  rice:                   { en: 'rice',                   hi: 'चावल',            gu: 'ચોખા',           sa: 'तण्डुलाः' },
  'white rice':           { en: 'white rice',             hi: 'सफेद चावल',      gu: 'સફેદ ચોખા',      sa: 'श्वेततण्डुलाः' },
  Milk:                   { en: 'Milk',                   hi: 'दूध',              gu: 'દૂધ',             sa: 'दुग्धम्' },
  milk:                   { en: 'milk',                   hi: 'दूध',              gu: 'દૂધ',             sa: 'दुग्धम्' },
  Silver:                 { en: 'Silver',                 hi: 'चांदी',           gu: 'ચાંદી',           sa: 'रजतम्' },
  silver:                 { en: 'silver',                 hi: 'चांदी',           gu: 'ચાંદી',           sa: 'रजतम्' },
  'White cloth':          { en: 'White cloth',            hi: 'श्वेत वस्त्र',      gu: 'સફેદ વસ્ત્ર',     sa: 'श्वेतवस्त्रम्' },
  'white cloth':          { en: 'white cloth',            hi: 'श्वेत वस्त्र',      gu: 'સફેદ વસ્ત્ર',     sa: 'श्वेतवस्त्रम्' },
  'Red cloth':            { en: 'Red cloth',              hi: 'लाल वस्त्र',       gu: 'લાલ વસ્ત્ર',      sa: 'रक्तवस्त्रम्' },
  'red cloth':            { en: 'red cloth',              hi: 'लाल वस्त्र',       gu: 'લાલ વસ્ત્ર',      sa: 'रक्तवस्त्रम्' },
  'Red lentils (masoor dal)': { en: 'Red lentils (masoor dal)', hi: 'मसूर दाल',  gu: 'મસૂર દાળ',  sa: 'मसूरदालः' },
  'red lentils (masoor dal)': { en: 'red lentils (masoor dal)', hi: 'मसूर दाल',  gu: 'મસૂર દાળ',  sa: 'मसूरदालः' },
  'masoor dal':           { en: 'masoor dal',             hi: 'मसूर दाल',         gu: 'મસૂર દાળ',        sa: 'मसूरदालः' },
  'moong dal':            { en: 'moong dal',              hi: 'मूंग दाल',          gu: 'મગ દાળ',         sa: 'मुद्गदालः' },
  'Green mung beans':     { en: 'Green mung beans',       hi: 'मूंग',              gu: 'મગ',              sa: 'मुद्गाः' },
  'Green cloth':          { en: 'Green cloth',            hi: 'हरा वस्त्र',        gu: 'લીલું વસ્ત્ર',     sa: 'हरितवस्त्रम्' },
  'green cloth':          { en: 'green cloth',            hi: 'हरा वस्त्र',        gu: 'લીલું વસ્ત્ર',     sa: 'हरितवस्त्रम्' },
  'Bronze items':         { en: 'Bronze items',           hi: 'कांस्य वस्तुएँ',   gu: 'કાંસાની વસ્તુઓ',  sa: 'कांस्यवस्तूनि' },
  bronze:                 { en: 'bronze',                 hi: 'कांस्य',            gu: 'કાંસું',           sa: 'कांस्यम्' },
  'green vegetables':     { en: 'green vegetables',       hi: 'हरी सब्ज़ियाँ',     gu: 'લીલા શાકભાજી',  sa: 'हरितशाकानि' },
  'Education supplies':   { en: 'Education supplies',     hi: 'शिक्षा सामग्री',   gu: 'શિક્ષણ સામગ્રી',  sa: 'विद्यासाधनानि' },
  'education supplies':   { en: 'education supplies',     hi: 'शिक्षा सामग्री',   gu: 'શિક્ષણ સામગ્રી',  sa: 'विद्यासाधनानि' },
  Turmeric:               { en: 'Turmeric',               hi: 'हल्दी',            gu: 'હળદર',           sa: 'हरिद्रा' },
  turmeric:               { en: 'turmeric',               hi: 'हल्दी',            gu: 'હળદર',           sa: 'हरिद्रा' },
  'Yellow cloth':         { en: 'Yellow cloth',           hi: 'पीत वस्त्र',       gu: 'પીળું વસ્ત્ર',     sa: 'पीतवस्त्रम्' },
  'yellow cloth':         { en: 'yellow cloth',           hi: 'पीत वस्त्र',       gu: 'પીળું વસ્ત્ર',     sa: 'पीतवस्त्रम्' },
  Gold:                   { en: 'Gold',                   hi: 'सोना',             gu: 'સોનું',           sa: 'सुवर्णम्' },
  gold:                   { en: 'gold',                   hi: 'सोना',             gu: 'સોનું',           sa: 'सुवर्णम्' },
  Books:                  { en: 'Books',                  hi: 'पुस्तकें',          gu: 'પુસ્તકો',         sa: 'पुस्तकानि' },
  books:                  { en: 'books',                  hi: 'पुस्तकें',          gu: 'પુસ્તકો',         sa: 'पुस्तकानि' },
  'Chana dal':            { en: 'Chana dal',              hi: 'चना दाल',          gu: 'ચણા દાળ',         sa: 'चणकदालः' },
  'chana dal':            { en: 'chana dal',              hi: 'चना दाल',          gu: 'ચણા દાળ',         sa: 'चणकदालः' },
  Ghee:                   { en: 'Ghee',                   hi: 'घी',               gu: 'ઘી',              sa: 'घृतम्' },
  ghee:                   { en: 'ghee',                   hi: 'घी',               gu: 'ઘી',              sa: 'घृतम्' },
  Sugar:                  { en: 'Sugar',                  hi: 'चीनी',             gu: 'ખાંડ',            sa: 'शर्करा' },
  sugar:                  { en: 'sugar',                  hi: 'चीनी',             gu: 'ખાંડ',            sa: 'शर्करा' },
  Silk:                   { en: 'Silk',                   hi: 'रेशम',             gu: 'રેશમ',            sa: 'पट्टम्' },
  silk:                   { en: 'silk',                   hi: 'रेशम',             gu: 'રેશમ',            sa: 'पट्टम्' },
  'Black sesame':         { en: 'Black sesame',           hi: 'काला तिल',         gu: 'કાળા તલ',        sa: 'कृष्णतिलाः' },
  'black sesame':         { en: 'black sesame',           hi: 'काला तिल',         gu: 'કાળા તલ',        sa: 'कृष्णतिलाः' },
  Iron:                   { en: 'Iron',                   hi: 'लोहा',             gu: 'લોખંડ',           sa: 'लौहम्' },
  iron:                   { en: 'iron',                   hi: 'लोहा',             gu: 'લોખંડ',           sa: 'लौहम्' },
  'Mustard oil':          { en: 'Mustard oil',            hi: 'सरसों तेल',       gu: 'સરસવ તેલ',       sa: 'सर्षपतैलम्' },
  'mustard oil':          { en: 'mustard oil',            hi: 'सरसों तेल',       gu: 'સરસવ તેલ',       sa: 'सर्षपतैलम्' },
  'Black cloth':          { en: 'Black cloth',            hi: 'काला वस्त्र',      gu: 'કાળું વસ્ત્ર',     sa: 'कृष्णवस्त्रम्' },
  'black cloth':          { en: 'black cloth',            hi: 'काला वस्त्र',      gu: 'કાળું વસ્ત્ર',     sa: 'कृष्णवस्त्रम्' },
  'Urad dal':             { en: 'Urad dal',               hi: 'उड़द दाल',          gu: 'અડદ દાળ',         sa: 'माषदालः' },
  'urad dal':             { en: 'urad dal',               hi: 'उड़द दाल',          gu: 'અડદ દાળ',         sa: 'माषदालः' },
  Urad:                   { en: 'Urad',                   hi: 'उड़द',              gu: 'અડદ',             sa: 'माषः' },
  urad:                   { en: 'urad',                   hi: 'उड़द',              gu: 'અડદ',             sa: 'माषः' },
  Blanket:                { en: 'Blanket',                hi: 'कंबल',             gu: 'ધાબળો',           sa: 'कम्बलः' },
  blanket:                { en: 'blanket',                hi: 'कंबल',             gu: 'ધાબળો',           sa: 'कम्बलः' },
  Blankets:               { en: 'Blankets',               hi: 'कंबल',             gu: 'ધાબળા',           sa: 'कम्बलाः' },
  Sesame:                 { en: 'Sesame',                 hi: 'तिल',              gu: 'તલ',              sa: 'तिलाः' },
  sesame:                 { en: 'sesame',                 hi: 'तिल',              gu: 'તલ',              sa: 'तिलाः' },
  'multicolored cloth':   { en: 'multicolored cloth',     hi: 'बहुरंगी वस्त्र',    gu: 'બહુરંગી વસ્ત્ર',  sa: 'बहुवर्णवस्त्रम्' },
  'multi-color cloth':    { en: 'multi-color cloth',      hi: 'बहुरंगी वस्त्र',    gu: 'બહુરંગી વસ્ત્ર',  sa: 'बहुवर्णवस्त्रम्' },
  'Black / multi-color cloth': { en: 'Black / multi-color cloth', hi: 'काला / बहुरंगी वस्त्र', gu: 'કાળું / બહુરંગી વસ્ત્ર', sa: 'कृष्ण / बहुवर्णवस्त्रम्' },
  'Brown / multi-color cloth': { en: 'Brown / multi-color cloth', hi: 'भूरा / बहुरंगी वस्त्र', gu: 'બદામી / બહુરંગી વસ્ત્ર', sa: 'श्यावम् / बहुवर्णवस्त्रम्' },
  Coconut:                { en: 'Coconut',                hi: 'नारियल',          gu: 'નાળિયેર',         sa: 'नारिकेलम्' },
  coconut:                { en: 'coconut',                hi: 'नारियल',          gu: 'નાળિયેર',         sa: 'नारिकेलम्' },
  'Black gram (urad)':    { en: 'Black gram (urad)',      hi: 'उड़द',              gu: 'અડદ',             sa: 'माषः' },
  'black gram':           { en: 'black gram',             hi: 'उड़द',              gu: 'અડદ',             sa: 'माषः' },
  sweets:                 { en: 'sweets',                 hi: 'मिठाई',           gu: 'મીઠાઈ',          sa: 'मिष्टान्नम्' },
};

// ─── Phrasebook ──────────────────────────────────────────────────────────────
// Templated prose used by matching / dosha / yoga services. Tokens
// (`{name}`) are filled by the `pf()` formatter. Keep keys narrow — one key
// per phrase, per locale.

const PHRASES: Record<string, Record<Locale, string>> = {
  // ─ Matching: verdicts ─────────────────────────────────────────────────────
  'matching.verdict.excellent': {
    en: 'Excellent — highly recommended',
    hi: 'उत्कृष्ट — अत्यन्त अनुशंसित',
    gu: 'ઉત્કૃષ્ટ — ભલામણ કરેલ',
    sa: 'उत्कृष्टम् — अत्यनुशंसितम्',
  },
  'matching.verdict.good': {
    en: 'Good — favorable match',
    hi: 'शुभ — अनुकूल मेल',
    gu: 'સારું — અનુકૂળ મેળ',
    sa: 'शुभम् — अनुकूलः सम्बन्धः',
  },
  'matching.verdict.acceptable': {
    en: 'Acceptable — minimum threshold met',
    hi: 'स्वीकार्य — न्यूनतम मानक पूर्ण',
    gu: 'સ્વીકાર્ય — લઘુતમ માપદંડ પૂર્ણ',
    sa: 'ग्राह्यम् — न्यूनमानं प्राप्तम्',
  },
  'matching.verdict.poor': {
    en: 'Below threshold — not recommended',
    hi: 'न्यूनतम से नीचे — अनुशंसित नहीं',
    gu: 'મર્યાદાથી નીચે — ભલામણ નથી',
    sa: 'न्यूनात् न्यूनम् — न अनुशंसितम्',
  },

  // ─ Matching: recommendations ──────────────────────────────────────────────
  'matching.recommendation.proceed': {
    en: 'No blocking issues detected — the combination looks workable.',
    hi: 'कोई बाधक विषय नहीं — संयोग कार्यसाध्य प्रतीत होता है।',
    gu: 'કોઈ અવરોધ નથી — સંયોગ સકારાત્મક જણાય છે.',
    sa: 'न कोऽपि विघ्नः — सम्बन्धः साध्यः अस्ति।',
  },
  'matching.recommendation.belowThreshold': {
    en: 'Guna score below classical threshold of 18; proceed with caution.',
    hi: 'गुण-योग 18 से कम है; सावधानी से आगे बढ़ें।',
    gu: 'ગુણ-મિલન 18 થી ઓછું છે; સાવચેતીપૂર્વક આગળ વધો.',
    sa: 'गुणाङ्कः अष्टादशात् न्यूनः — सावधानेन प्रवर्तेत।',
  },
  'matching.recommendation.cautionNadi': {
    en: 'Nadi dosha is present and uncancelled — consult an astrologer for remedies (Mahamrityunjay, Rudrabhishek).',
    hi: 'नाड़ी दोष विद्यमान और अनिवारित है — उपायों (महामृत्युंजय, रुद्राभिषेक) हेतु ज्योतिषी से परामर्श लें।',
    gu: 'નાડી દોષ હાજર છે અને રદ થયેલ નથી — ઉપાય (મહામૃત્યુંજય, રુદ્રાભિષેક) માટે જ્યોતિષીની સલાહ લો.',
    sa: 'नाडीदोषः वर्तते अनिवारितः — महामृत्युञ्जय-रुद्राभिषेकादिषु ज्योतिषं पृच्छेत्।',
  },
  'matching.recommendation.cautionBhakoot': {
    en: 'Bhakoot dosha active — traditional remedies: charitable donations, worship of Vishnu.',
    hi: 'भकूट दोष सक्रिय है — पारम्परिक उपाय: दान, विष्णु पूजा।',
    gu: 'ભકૂટ દોષ સક્રિય છે — પરંપરાગત ઉપાય: દાન, વિષ્ણુ પૂજા.',
    sa: 'भकूटदोषः क्रियाशीलः — दानम्, विष्णुपूजनम् च परम्परागतोपायाः।',
  },
  'matching.recommendation.cautionMangal': {
    en: 'Manglik mismatch — consider Kumbha-Vivaha or delayed marriage after 28 for the Manglik partner.',
    hi: 'मांगलिक असंगति — कुम्भ विवाह अथवा 28 वर्षोपरान्त विवाह पर विचार करें।',
    gu: 'મંગળિક અસંગતિ — કુંભ વિવાહ અથવા 28 પછી લગ્નનો વિચાર કરો.',
    sa: 'मङ्गलिकवैषम्यम् — कुम्भविवाहं अष्टाविंशत्यनन्तरं विवाहं वा परिकल्पयेत्।',
  },
  'matching.recommendation.consultPriest': {
    en: 'Consult a learned priest for personalised remedial measures.',
    hi: 'व्यक्तिगत उपायों हेतु विद्वान् पुरोहित से परामर्श लें।',
    gu: 'વ્યક્તિગત ઉપાય માટે વિદ્વાન પુરોહિતની સલાહ લો.',
    sa: 'व्यक्तिगतोपायार्थं विद्वत्पुरोहितं पृच्छेत्।',
  },
  'matching.recommendation.vedha': {
    en: 'Vedha dosha found — remedy with specific nakshatra deity worship.',
    hi: 'वेध दोष पाया गया — विशेष नक्षत्र देवता की पूजा से उपाय करें।',
    gu: 'વેધ દોષ મળ્યો — વિશિષ્ટ નક્ષત્ર દેવતા પૂજાથી ઉપાય.',
    sa: 'वेधदोषः प्राप्तः — विशिष्टनक्षत्रदेवतायाः पूजनेन उपायः।',
  },
  'matching.recommendation.rajju': {
    en: 'Rajju dosha present — important longevity indicator; re-run matching with exact birth times.',
    hi: 'रज्जु दोष विद्यमान — आयु से जुड़ा महत्त्वपूर्ण संकेत; सटीक जन्म-समय के साथ मिलान दोबारा करें।',
    gu: 'રજ્જુ દોષ હાજર — આયુષ્યનો મહત્ત્વનો સંકેત; ચોક્કસ જન્મ સમય સાથે ફરી મેળવો.',
    sa: 'रज्जुदोषः वर्तते — आयुषः महान् सूचकः; सूक्ष्मजन्मसमयैः पुनः मेलयतु।',
  },

  // ─ Matching: manglik notes ────────────────────────────────────────────────
  'matching.manglik.both': {
    en: 'Both manglik — they neutralize each other',
    hi: 'दोनों मांगलिक — परस्पर निरस्त',
    gu: 'બંને મંગળિક — એકબીજાને રદ કરે છે',
    sa: 'उभौ मङ्गलिकौ — परस्परनिरासः',
  },
  'matching.manglik.cancelled': {
    en: 'Mangal dosha cancelled by classical rules',
    hi: 'शास्त्रीय नियमानुसार मंगल दोष निरस्त',
    gu: 'શાસ્ત્રીય નિયમ અનુસાર મંગળ દોષ રદ',
    sa: 'शास्त्रनियमेन मङ्गलदोषः निरस्तः',
  },
  'matching.manglik.mismatchBoy': {
    en: 'Only boy has active Mangal dosha — caution',
    hi: 'केवल वर पर मांगलिक प्रभाव — सावधानी',
    gu: 'ફક્ત વર પર મંગળિક અસર — સાવચેતી',
    sa: 'केवलं वरः मङ्गलदोषयुक्तः — सावधानम्',
  },
  'matching.manglik.mismatchGirl': {
    en: 'Only girl has active Mangal dosha — caution',
    hi: 'केवल वधू पर मांगलिक प्रभाव — सावधानी',
    gu: 'ફક્ત કન્યા પર મંગળિક અસર — સાવચેતી',
    sa: 'केवलं कन्या मङ्गलदोषयुक्ता — सावधानम्',
  },
  'matching.manglik.none': {
    en: 'Neither has active Mangal dosha',
    hi: 'किसी पर भी सक्रिय मंगल दोष नहीं',
    gu: 'કોઈનામાં સક્રિય મંગળ દોષ નથી',
    sa: 'न कस्यापि मङ्गलदोषः सक्रियः',
  },

  // ─ Matching: manglik cancellations (closed list) ──────────────────────────
  'matching.cancellation.marsAriesIn1': {
    en: 'Mars in own sign (Aries) in 1st house',
    hi: 'मंगल स्व-राशि (मेष) में प्रथम भाव',
    gu: 'મંગળ સ્વ-રાશિ (મેષ)માં પ્રથમ ભાવ',
    sa: 'मङ्गलः स्वराशौ (मेषे) प्रथमे भावे',
  },
  'matching.cancellation.marsScorpioIn4': {
    en: 'Mars in own sign (Scorpio) in 4th house',
    hi: 'मंगल स्व-राशि (वृश्चिक) में चतुर्थ भाव',
    gu: 'મંગળ સ્વ-રાશિ (વૃશ્ચિક)માં ચતુર્થ ભાવ',
    sa: 'मङ्गलः स्वराशौ (वृश्चिके) चतुर्थे भावे',
  },
  'matching.cancellation.marsExalted': {
    en: 'Mars in exaltation (Capricorn)',
    hi: 'मंगल उच्च राशि (मकर) में',
    gu: 'મંગળ ઉચ્ચ રાશિ (મકર)માં',
    sa: 'मङ्गलः उच्चे (मकरे)',
  },
  'matching.cancellation.marsIn2InGeminiVirgo': {
    en: 'Mars in 2nd in Gemini/Virgo',
    hi: 'मंगल द्वितीय भाव में मिथुन/कन्या',
    gu: 'મંગળ દ્વિતીય ભાવમાં મિથુન/કન્યા',
    sa: 'मङ्गलः द्वितीये मिथुने कन्यायां वा',
  },
  'matching.cancellation.marsIn12InTaurusLibra': {
    en: 'Mars in 12th in Taurus/Libra',
    hi: 'मंगल द्वादश भाव में वृषभ/तुला',
    gu: 'મંગળ દ્વાદશ ભાવમાં વૃષભ/તુલા',
    sa: 'मङ्गलः द्वादशे वृषभे तुलायां वा',
  },
  'matching.cancellation.marsIn4InAriesScorpio': {
    en: 'Mars in 4th in Aries/Scorpio',
    hi: 'मंगल चतुर्थ भाव में मेष/वृश्चिक',
    gu: 'મંગળ ચતુર્થ ભાવમાં મેષ/વૃશ્ચિક',
    sa: 'मङ्गलः चतुर्थे मेषे वृश्चिके वा',
  },
  'matching.cancellation.marsIn7InCancerLeo': {
    en: 'Mars in 7th in Cancer/Leo',
    hi: 'मंगल सप्तम भाव में कर्क/सिंह',
    gu: 'મંગળ સપ્તમ ભાવમાં કર્ક/સિંહ',
    sa: 'मङ्गलः सप्तमे कर्के सिंहे वा',
  },
  'matching.cancellation.marsIn8InSagPisces': {
    en: 'Mars in 8th in Sagittarius/Pisces',
    hi: 'मंगल अष्टम भाव में धनु/मीन',
    gu: 'મંગળ અષ્ટમ ભાવમાં ધનુ/મીન',
    sa: 'मङ्गलः अष्टमे धनुषि मीने वा',
  },
  'matching.cancellation.jupiterConjunctMars': {
    en: 'Jupiter conjunct Mars (within 10°) mitigates',
    hi: 'गुरु-मंगल युति (10° के भीतर) न्यूनीकरण',
    gu: 'ગુરુ-મંગળ યુતિ (10°ની અંદર) ઘટાડે છે',
    sa: 'गुरुमङ्गलयुतिः (दश-अंशे) न्यूनीकरणम्',
  },
  'matching.cancellation.moonConjunctMars': {
    en: 'Moon conjunct Mars (within 12°) mitigates',
    hi: 'चन्द्र-मंगल युति (12° के भीतर) न्यूनीकरण',
    gu: 'ચંદ્ર-મંગળ યુતિ (12°ની અંદર) ઘટાડે છે',
    sa: 'चन्द्रमङ्गलयुतिः (द्वादश-अंशे) न्यूनीकरणम्',
  },
  'matching.cancellation.saturnWithMars': {
    en: 'Saturn with Mars in same house mitigates',
    hi: 'शनि-मंगल एक ही भाव में होने से न्यूनीकरण',
    gu: 'શનિ-મંગળ એક જ ભાવમાં હોવાથી ઘટાડે છે',
    sa: 'शनिमङ्गलौ एकभावे — न्यूनीकरणम्',
  },

  // ─ Matching: nadi/bhakoot cancellations ───────────────────────────────────
  'matching.cancellation.sameRashi': {
    en: 'Same Moon rashi — Nadi dosha mitigated',
    hi: 'समान चन्द्र राशि — नाड़ी दोष न्यून',
    gu: 'સમાન ચંદ્ર રાશિ — નાડી દોષ ઘટ્યો',
    sa: 'समानचन्द्रराशिः — नाडीदोषः न्यूनः',
  },
  'matching.cancellation.sameNakshatra': {
    en: 'Same nakshatra but different padas — Nadi dosha mitigated',
    hi: 'समान नक्षत्र किन्तु भिन्न पाद — नाड़ी दोष न्यून',
    gu: 'સમાન નક્ષત્ર પણ ભિન્ન પાદ — નાડી દોષ ઘટ્યો',
    sa: 'समाननक्षत्रं भिन्नपादौ — नाडीदोषः न्यूनः',
  },
  'matching.cancellation.sameRashiLordNadi': {
    en: 'Same rashi-lord — Nadi dosha partially mitigated',
    hi: 'समान राशि-स्वामी — नाड़ी दोष आंशिक रूप से न्यून',
    gu: 'સમાન રાશિ-સ્વામી — નાડી દોષ આંશિક ઘટ્યો',
    sa: 'समानराशिनाथः — नाडीदोषः अंशेन न्यूनः',
  },
  'matching.cancellation.sameRashiLordBhakoot': {
    en: 'Same rashi-lord — Bhakoot dosha cancelled',
    hi: 'समान राशि-स्वामी — भकूट दोष निरस्त',
    gu: 'સમાન રાશિ-સ્વામી — ભકૂટ દોષ રદ',
    sa: 'समानराशिनाथः — भकूटदोषः निरस्तः',
  },
  'matching.cancellation.sameNakLord': {
    en: 'Same nakshatra-lord — Bhakoot dosha cancelled',
    hi: 'समान नक्षत्र-स्वामी — भकूट दोष निरस्त',
    gu: 'સમાન નક્ષત્ર-સ્વામી — ભકૂટ દોષ રદ',
    sa: 'समाननक्षत्रनाथः — भकूटदोषः निरस्तः',
  },

  // ─ Matching: koot one-line descriptions ───────────────────────────────────
  'matching.koot.varna.detail': {
    en: "Boy: {boy}, Girl: {girl}{warn}",
    hi: 'वर: {boy}, वधू: {girl}{warn}',
    gu: 'વર: {boy}, કન્યા: {girl}{warn}',
    sa: 'वरः {boy}, कन्या {girl}{warn}',
  },
  'matching.koot.varna.warnLow': {
    en: ' (boy should not be lower)',
    hi: ' (वर निम्न नहीं होना चाहिए)',
    gu: ' (વર નીચો ન હોવો જોઈએ)',
    sa: ' (वरः न्यूनः न भवेत्)',
  },
  'matching.koot.vashya.detail': {
    en: 'Boy: {boy}, Girl: {girl}',
    hi: 'वर: {boy}, वधू: {girl}',
    gu: 'વર: {boy}, કન્યા: {girl}',
    sa: 'वरः {boy}, कन्या {girl}',
  },
  'matching.koot.tara.detail': {
    en: 'Boy→Girl + Girl→Boy (mod 9)',
    hi: 'वर→वधू + वधू→वर (mod 9)',
    gu: 'વર→કન્યા + કન્યા→વર (mod 9)',
    sa: 'वर→कन्या + कन्या→वर (mod 9)',
  },
  'matching.koot.yoni.detail': {
    en: 'Boy: {boy}, Girl: {girl}',
    hi: 'वर: {boy}, वधू: {girl}',
    gu: 'વર: {boy}, કન્યા: {girl}',
    sa: 'वरः {boy}, कन्या {girl}',
  },
  'matching.koot.maitri.detail': {
    en: 'Boy-lord: {boy}, Girl-lord: {girl}',
    hi: 'वर-स्वामी: {boy}, वधू-स्वामी: {girl}',
    gu: 'વર-સ્વામી: {boy}, કન્યા-સ્વામી: {girl}',
    sa: 'वरस्वामी {boy}, कन्यास्वामी {girl}',
  },
  'matching.koot.gana.detail': {
    en: 'Boy: {boy}, Girl: {girl}',
    hi: 'वर: {boy}, वधू: {girl}',
    gu: 'વર: {boy}, કન્યા: {girl}',
    sa: 'वरः {boy}, कन्या {girl}',
  },
  'matching.koot.bhakoot.detail': {
    en: 'Mutual distance {f}/{b}{flag}',
    hi: 'पारस्परिक दूरी {f}/{b}{flag}',
    gu: 'પારસ્પરિક અંતર {f}/{b}{flag}',
    sa: 'परस्परदूरम् {f}/{b}{flag}',
  },
  'matching.koot.bhakoot.dosha': {
    en: ' (dosha)',
    hi: ' (दोष)',
    gu: ' (દોષ)',
    sa: ' (दोषः)',
  },
  'matching.koot.bhakoot.ok': {
    en: ' (OK)',
    hi: ' (ठीक)',
    gu: ' (બરાબર)',
    sa: ' (शुभम्)',
  },
  'matching.koot.nadi.detail': {
    en: 'Boy: {boy}, Girl: {girl}{flag}',
    hi: 'वर: {boy}, वधू: {girl}{flag}',
    gu: 'વર: {boy}, કન્યા: {girl}{flag}',
    sa: 'वरः {boy}, कन्या {girl}{flag}',
  },
  'matching.koot.nadi.dosha': {
    en: ' (Nadi dosha)',
    hi: ' (नाड़ी दोष)',
    gu: ' (નાડી દોષ)',
    sa: ' (नाडीदोषः)',
  },

  // ─ Matching: koot meanings (the long descriptions) ────────────────────────
  'matching.koot.varna.description': {
    en: "Caste/ego compatibility — boy's varna should be equal to or higher than girl's for a full point. Indicates mutual respect and spiritual orientation.",
    hi: 'वर्ण/अहम् सामंजस्य — पूर्ण अंक हेतु वर का वर्ण वधू से समान या उच्च होना चाहिए। पारस्परिक सम्मान व आध्यात्मिक दिशा का सूचक।',
    gu: 'વર્ણ/અહમ્ સંગતતા — સંપૂર્ણ અંક માટે વરનો વર્ણ કન્યા જેટલો અથવા ઊંચો હોવો જોઈએ. પરસ્પર આદર અને આધ્યાત્મિક દિશાનું સૂચક.',
    sa: 'वर्ण-अहंकारस्य अनुकूलता — पूर्णाङ्कार्थं वरस्य वर्णः कन्यासमः अधिको वा भवेत्। परस्परसम्मानस्य आध्यात्मिकदिशायाः च सूचकः।',
  },
  'matching.koot.vashya.description': {
    en: 'Dominance/mutual magnetism between partners. Measures how much the couple will be attracted and aligned with each other.',
    hi: 'दम्पति में आकर्षण व अनुकूलता — कितना खिंचाव और सामंजस्य रहेगा।',
    gu: 'દંપતિમાં આકર્ષણ અને અનુકૂળતા — કેટલું ખેંચાણ અને સંવાદ રહેશે.',
    sa: 'दम्पत्योः आकर्षणम् अनुकूलता च — परस्पराकर्षणं समरसता च।',
  },
  'matching.koot.tara.description': {
    en: 'Destiny/longevity compatibility — counted as lunar mansions from each partner. Governs health, longevity and life-events harmony.',
    hi: 'भाग्य/आयु अनुकूलता — दोनों के नक्षत्रों की गणना। स्वास्थ्य, आयु व घटनाक्रम का सामंजस्य।',
    gu: 'ભાગ્ય/આયુષ્ય સંગતતા — બન્નેના નક્ષત્રની ગણતરી. આરોગ્ય, આયુષ્ય અને ઘટનાક્રમ સંવાદ.',
    sa: 'भाग्य-आयुषोः अनुकूलता — उभयोः नक्षत्रगणनम्। आरोग्यम्, आयुः, घटना-समरसता।',
  },
  'matching.koot.yoni.description': {
    en: 'Sexual / instinctive compatibility derived from nakshatra animal symbolism. Key for physical chemistry and temperament.',
    hi: 'यौन/प्रवृत्तिगत अनुकूलता — नक्षत्र पशु प्रतीकवाद से। शारीरिक रसायन व स्वभाव का प्रमुख सूचक।',
    gu: 'યૌન/સ્વાભાવિક સંગતતા — નક્ષત્ર પશુ પ્રતીકવાદથી. શારીરિક રસાયણ અને સ્વભાવનું મુખ્ય સૂચક.',
    sa: 'योन्याः अनुकूलता — नक्षत्रपशुप्रतीकेभ्यः। शारीरिकरसायनम् स्वभावः च।',
  },
  'matching.koot.maitri.description': {
    en: 'Friendship between the Moon-sign lords of both partners. Measures mental compatibility and emotional alignment.',
    hi: 'दोनों के चन्द्र-राशि स्वामियों की मैत्री। मानसिक अनुकूलता व भावनात्मक सामंजस्य।',
    gu: 'બંનેના ચંદ્ર-રાશિ સ્વામીઓની મૈત્રી. માનસિક અનુકૂળતા અને ભાવનાત્મક સંવાદ.',
    sa: 'उभयोः चन्द्रराशिनाथयोः मैत्री। मानसिक-अनुकूलता भावसमरसता च।',
  },
  'matching.koot.gana.description': {
    en: 'Temperament (Deva/Manushya/Rakshasa). Reflects underlying nature — divine, human, or demonic — and attitude toward life.',
    hi: 'स्वभाव (देव/मनुष्य/राक्षस) — अन्तर्निहित प्रकृति और जीवन-दृष्टि का प्रतिबिम्ब।',
    gu: 'સ્વભાવ (દેવ/મનુષ્ય/રાક્ષસ) — મૂળ પ્રકૃતિ અને જીવન-દૃષ્ટિનું પ્રતિબિંબ.',
    sa: 'स्वभावः (देव-मनुष्य-राक्षसः) — मूलप्रकृतेः जीवनदृष्टेश्च प्रतिबिम्बः।',
  },
  'matching.koot.bhakoot.description': {
    en: 'Rashi distance compatibility. Affects financial prosperity, family harmony and emotional flow.',
    hi: 'राशि-दूरी अनुकूलता — आर्थिक समृद्धि, पारिवारिक सामंजस्य व भावनात्मक प्रवाह को प्रभावित करती है।',
    gu: 'રાશિ-દૂરી સંગતતા — આર્થિક સમૃદ્ધિ, કુટુંબ સંવાદ, ભાવનાત્મક પ્રવાહ.',
    sa: 'राशिदूरस्य अनुकूलता — आर्थिकसमृद्धिः, कौटुम्बिकसमरसता, भावनाप्रवाहः।',
  },
  'matching.koot.nadi.description': {
    en: 'Pulse/ayurvedic constitution compatibility — the most weighted koot. Same-nadi is traditionally avoided due to progeny and health concerns.',
    hi: 'नाड़ी/आयुर्वेदिक प्रकृति अनुकूलता — सबसे भारी कूट। समान नाड़ी पारम्परिक रूप से वर्जित।',
    gu: 'નાડી/આયુર્વેદિક પ્રકૃતિ સંગતતા — સૌથી વજનદાર કૂટ. સમાન નાડી પરંપરાગત રીતે ટાળવામાં આવે છે.',
    sa: 'नाड्याः आयुर्वेदप्रकृतेश्च अनुकूलता — सर्वाधिकगौरवः कूटः। समानानाडी प्रायशः वर्ज्या।',
  },

  // ─ Matching: extras (rajju, vedha, mahendra, stri-dheerga) ────────────────
  'matching.extra.rajju.same': {
    en: 'Both in {group}-Rajju — traditionally avoided (longevity concern)',
    hi: 'दोनों {group}-रज्जु में — पारम्परिक रूप से वर्जित (आयु सम्बन्धी चिन्ता)',
    gu: 'બંને {group}-રજ્જુમાં — પરંપરાગત રીતે ટાળવામાં આવે છે (આયુષ્ય ચિંતા)',
    sa: 'उभौ {group}-रज्जौ — परम्परयालं वर्ज्यम् (आयुः-चिन्ता)',
  },
  'matching.extra.rajju.different': {
    en: 'Different rajju groups ({a} / {b}) — no Rajju dosha',
    hi: 'भिन्न रज्जु समूह ({a} / {b}) — रज्जु दोष नहीं',
    gu: 'ભિન્ન રજ્જુ સમૂહ ({a} / {b}) — રજ્જુ દોષ નથી',
    sa: 'भिन्नरज्जुसमूहौ ({a} / {b}) — न रज्जुदोषः',
  },
  'matching.extra.vedha.present': {
    en: 'Incompatible nakshatra pair (Vedha)',
    hi: 'असंगत नक्षत्र युग्म (वेध)',
    gu: 'અસંગત નક્ષત્ર યુગ્મ (વેધ)',
    sa: 'असङ्गतं नक्षत्रयुग्मम् (वेधः)',
  },
  'matching.extra.vedha.none': {
    en: 'No nakshatra Vedha',
    hi: 'कोई नक्षत्र वेध नहीं',
    gu: 'કોઈ નક્ષત્ર વેધ નથી',
    sa: 'न नक्षत्रवेधः',
  },
  'matching.extra.mahendra.good': {
    en: "Auspicious — girl's nakshatra at count {count} from boy",
    hi: 'शुभ — वर से {count}वें स्थान पर वधू का नक्षत्र',
    gu: 'શુભ — વરથી {count}માં સ્થાને કન્યાનું નક્ષત્ર',
    sa: 'शुभम् — वरात् {count}-स्थाने कन्या-नक्षत्रम्',
  },
  'matching.extra.mahendra.neutral': {
    en: 'Not Mahendra (count {count}) — neutral',
    hi: 'महेन्द्र नहीं (गणना {count}) — सामान्य',
    gu: 'મહેન્દ્ર નથી (ગણના {count}) — તટસ્થ',
    sa: 'न महेन्द्रः (गणना {count}) — समः',
  },
  'matching.extra.striDheerga.present': {
    en: "Girl's nakshatra at count {count} >= 9 — Stri Dheerga present",
    hi: 'वधू का नक्षत्र {count} >= 9 — स्त्री-दीर्घ विद्यमान',
    gu: 'કન્યાનું નક્ષત્ર {count} >= 9 — સ્ત્રી-દીર્ઘ હાજર',
    sa: 'कन्या-नक्षत्रम् {count} >= 9 — स्त्रीदीर्घः वर्तते',
  },
  'matching.extra.striDheerga.absent': {
    en: "Girl's nakshatra only {count} — Stri Dheerga absent",
    hi: 'वधू का नक्षत्र केवल {count} — स्त्री-दीर्घ अनुपस्थित',
    gu: 'કન્યાનું નક્ષત્ર માત્ર {count} — સ્ત્રી-દીર્ઘ ગેરહાજર',
    sa: 'कन्या-नक्षत्रम् केवलम् {count} — न स्त्रीदीर्घः',
  },

  // ─ Dosha: mangal cancellations ────────────────────────────────────────────
  'dosha.mangal.cancellation.marsOwnSign': {
    en: 'Mars in own sign',
    hi: 'मंगल स्वराशि में',
    gu: 'મંગળ સ્વ-રાશિમાં',
    sa: 'मङ्गलः स्वराशौ',
  },
  'dosha.mangal.cancellation.marsExalted': {
    en: 'Mars exalted',
    hi: 'मंगल उच्च',
    gu: 'મંગળ ઉચ્ચ',
    sa: 'मङ्गलः उच्चः',
  },
  'dosha.mangal.cancellation.marsCancerLeo': {
    en: 'Mars in Cancer/Leo',
    hi: 'मंगल कर्क/सिंह में',
    gu: 'મંગળ કર્ક/સિંહમાં',
    sa: 'मङ्गलः कर्के सिंहे वा',
  },
  'dosha.mangal.cancellation.jupiterAspect': {
    en: 'Jupiter aspects Mars',
    hi: 'गुरु की दृष्टि मंगल पर',
    gu: 'ગુરુની દૃષ્ટિ મંગળ પર',
    sa: 'गुरुः मङ्गलं पश्यति',
  },

  // ─ Dosha: kaal sarpa ──────────────────────────────────────────────────────
  'dosha.kaalSarpa.partial': {
    en: 'Partial Kaal Sarpa — one or more planets fall outside the Rahu-Ketu axis',
    hi: 'आंशिक कालसर्प — एक या अधिक ग्रह राहु-केतु अक्ष के बाहर',
    gu: 'આંશિક કાલસર્પ — એક અથવા વધુ ગ્રહો રાહુ-કેતુ અક્ષની બહાર',
    sa: 'अंशेन कालसर्पः — एकः अधिको वा ग्रहः राहु-केतु-अक्षात् बहिः',
  },

  // ─ Dosha: sade sati phases ────────────────────────────────────────────────
  'dosha.sadeSati.first': {
    en: 'First phase — Saturn in 12th from Moon',
    hi: 'प्रथम चरण — चन्द्र से द्वादश में शनि',
    gu: 'પ્રથમ તબક્કો — ચંદ્રથી દ્વાદશમાં શનિ',
    sa: 'प्रथमचरणः — चन्द्रात् द्वादशे शनिः',
  },
  'dosha.sadeSati.peak': {
    en: 'Peak phase — Saturn over natal Moon',
    hi: 'चरम — जन्म चन्द्र पर शनि',
    gu: 'ચરમ — જન્મ ચંદ્ર પર શનિ',
    sa: 'चरमचरणः — जन्म-चन्द्रोपरि शनिः',
  },
  'dosha.sadeSati.last': {
    en: 'Last phase — Saturn in 2nd from Moon',
    hi: 'अन्तिम चरण — चन्द्र से द्वितीय में शनि',
    gu: 'અંતિમ તબક્કો — ચંદ્રથી દ્વિતીયમાં શનિ',
    sa: 'अन्तिमचरणः — चन्द्रात् द्वितीये शनिः',
  },
  'dosha.sadeSati.none': {
    en: 'Not in Sade Sati',
    hi: 'साढ़ेसाती में नहीं',
    gu: 'સાડેસાતીમાં નથી',
    sa: 'न साढेसातौ',
  },

  // ─ Yoga: descriptions for hand-coded yogas ────────────────────────────────
  'yoga.description.PanchaMahapurusha': {
    en: '{planet} is {state} ({rashi}) in house {house} — a powerful Mahapurusha Yoga conferring leadership, fame, and prosperity.',
    hi: '{planet} {state} ({rashi}) में {house} भाव में है — शक्तिशाली पञ्च-महापुरुष योग, नेतृत्व, यश व समृद्धि कारक।',
    gu: '{planet} {state} ({rashi})માં {house} ભાવમાં છે — શક્તિશાળી પંચ-મહાપુરુષ યોગ; નેતૃત્વ, યશ, સમૃદ્ધિ.',
    sa: '{planet} {state} ({rashi}-राशौ) {house}-भावे — पञ्चमहापुरुषयोगः बलवान् नेतृत्वकीर्तिसमृद्धिप्रदः।',
  },
  'yoga.state.exalted': {
    en: 'exalted',
    hi: 'उच्च',
    gu: 'ઉચ્ચ',
    sa: 'उच्चस्थः',
  },
  'yoga.state.ownSign': {
    en: 'in own sign',
    hi: 'स्वराशि',
    gu: 'સ્વ-રાશિ',
    sa: 'स्वराशौ',
  },
  'yoga.description.Gajakesari': {
    en: 'Jupiter is in the {dist} house from the Moon — confers wisdom, eloquence, and respect.',
    hi: 'गुरु चन्द्र से {dist} भाव में है — बुद्धि, वाणी व सम्मान कारक।',
    gu: 'ગુરુ ચંદ્રથી {dist} ભાવમાં છે — બુદ્ધિ, વાણી અને માનનું કારક.',
    sa: 'गुरुः चन्द्रात् {dist}-भावे — बुद्धि-वाक्-सम्मानप्रदः।',
  },
  'yoga.description.Budhaditya': {
    en: 'Sun and Mercury conjunct in {rashi} — sharp intellect, learning, communication.',
    hi: 'सूर्य व बुध की युति {rashi} राशि में — तीक्ष्ण बुद्धि, अध्ययन, संवाद।',
    gu: 'સૂર્ય અને બુધનો યુતિ {rashi}માં — તીક્ષ્ણ બુદ્ધિ, અધ્યયન, સંવાદ.',
    sa: 'सूर्यबुधयुतिः {rashi}-राशौ — बुद्धि-विद्या-सम्भाषणप्रदा।',
  },
  'yoga.description.ChandraMangala': {
    en: 'Moon and Mars conjunct — wealth through commerce and enterprise.',
    hi: 'चन्द्र-मंगल युति — व्यापार व उद्यम से धन।',
    gu: 'ચંદ્ર-મંગળ યુતિ — વેપાર અને ઉદ્યમથી ધન.',
    sa: 'चन्द्रमङ्गलयुतिः — वाणिज्योद्यमेन धनम्।',
  },
  'yoga.description.Kemadruma': {
    en: 'Moon is isolated — no planets in 2nd, 12th, or with the Moon. Considered an inauspicious lunar yoga; mitigated by other strong placements.',
    hi: 'चन्द्र एकाकी — द्वितीय, द्वादश तथा चन्द्र-स्थान में कोई ग्रह नहीं। अशुभ चान्द्र योग; अन्य प्रबल स्थानों से न्यूनित।',
    gu: 'ચંદ્ર એકલો — દ્વિતીય, દ્વાદશ અને ચંદ્ર-સ્થાનમાં કોઈ ગ્રહ નથી. અશુભ ચાંદ્ર યોગ; અન્ય બળવાન સ્થાનોથી ઘટે છે.',
    sa: 'चन्द्रः एकाकी — द्वितीये, द्वादशे, चन्द्रस्थानेषु न ग्रहाः। अशुभचन्द्रयोगः; अन्यबलैः न्यूनः।',
  },
  'yoga.description.RajaYoga': {
    en: '{a} (kendra lord) conjunct {b} (trikona lord) in {rashi} — classical wealth-and-power yoga.',
    hi: '{a} (केन्द्र स्वामी) व {b} (त्रिकोण स्वामी) की युति {rashi} में — शास्त्रीय धन-शक्ति योग।',
    gu: '{a} (કેન્દ્ર સ્વામી) અને {b} (ત્રિકોણ સ્વામી)નો યુતિ {rashi}માં — શાસ્ત્રીય ધન-શક્તિ યોગ.',
    sa: '{a} (केन्द्रनाथः) {b} (त्रिकोणनाथः) {rashi}-राशौ युतौ — शास्त्रीयो धन-शक्तियोगः।',
  },
  'yoga.description.Neechabhanga': {
    en: '{planet} is debilitated in {rashi}, but its dispositor {disp} is in kendra from {anchor} — debilitation is cancelled, forming a Raja Yoga.',
    hi: '{planet} {rashi} में नीच है, परन्तु इसका दिशापति {disp} {anchor} से केन्द्र में है — नीच भंग होकर राज योग।',
    gu: '{planet} {rashi}માં નીચ છે, પણ તેનો દિશાપતિ {disp} {anchor}થી કેન્દ્રમાં છે — નીચ ભંગ થઈ રાજ યોગ.',
    sa: '{planet} {rashi}-राशौ नीचः, परं तस्य दिक्पतिः {disp} {anchor}-तः केन्द्रे — नीचभङ्गेन राजयोगः।',
  },
  'yoga.anchor.lagna': {
    en: 'Lagna',
    hi: 'लग्न',
    gu: 'લગ્ન',
    sa: 'लग्नात्',
  },
  'yoga.anchor.moon': {
    en: 'Moon',
    hi: 'चन्द्र',
    gu: 'ચંદ્ર',
    sa: 'चन्द्रात्',
  },
  'yoga.description.Viparita': {
    en: '{planet}, lord of the {ofHouse}th, occupies the {inHouse}th — classical Viparita Raja Yoga giving success through obstacles.',
    hi: '{planet}, {ofHouse}वें के स्वामी, {inHouse}वें भाव में हैं — शास्त्रीय विपरीत राज योग; कठिनाई से सफलता।',
    gu: '{planet}, {ofHouse}માં ભાવના સ્વામી, {inHouse}માં ભાવમાં છે — શાસ્ત્રીય વિપરીત રાજ યોગ; કઠિનાઈમાંથી સફળતા.',
    sa: '{planet} {ofHouse}-भावस्य नाथः {inHouse}-भावे स्थितः — शास्त्रीयो विपरीत-राजयोगः; विघ्नात् फलप्राप्तिः।',
  },
  'yoga.description.Daridra': {
    en: '{planet}, the 11th (labha) lord, occupies the {house}th — indicates financial struggle and blocked gains. Mitigated by strong 2nd, 9th, or 11th placements.',
    hi: '{planet}, एकादश (लाभ) स्वामी, {house}वें भाव में — आर्थिक संघर्ष व अवरुद्ध लाभ का सूचक। द्वितीय, नवम, एकादश के बल से न्यून।',
    gu: '{planet}, એકાદશ (લાભ) સ્વામી, {house}માં ભાવમાં — આર્થિક સંઘર્ષ અને અટકેલા લાભ. દ્વિતીય, નવમ, એકાદશના બળથી ઘટે છે.',
    sa: '{planet} एकादश-(लाभ-)नाथः {house}-भावे — आर्थिक-सङ्कटं रुद्धलाभं च सूचयति। द्वितीय-नवम-एकादशबलेन न्यूनः।',
  },
  'yoga.description.Sakata': {
    en: 'Moon is in the {dist}th from Jupiter — wealth rises and falls like a cart wheel{cancel}.',
    hi: 'चन्द्र गुरु से {dist}वें में — धन शकट चक्र की भाँति उच्चावच{cancel}।',
    gu: 'ચંદ્ર ગુરુથી {dist}માં — ધન શકટ ચક્રની જેમ ઊંચું-નીચું{cancel}.',
    sa: 'चन्द्रः गुरोः {dist}-भावे — शकटचक्रवत् धनस्य उच्चावचता{cancel}।',
  },
  'yoga.sakata.cancelled': {
    en: ', but cancelled because Jupiter occupies a kendra from Lagna',
    hi: ', परन्तु गुरु लग्न से केन्द्र में होने से निरस्त',
    gu: ', પરંતુ ગુરુ લગ્નથી કેન્દ્રમાં હોવાથી રદ',
    sa: ', परं गुरुः लग्नात् केन्द्रस्थः इति निरस्तः',
  },
  'yoga.description.Adhi': {
    en: 'Benefics ({list}) occupy the 6th/7th/8th from the Moon — confers leadership, wealth, and command.',
    hi: 'शुभ ग्रह ({list}) चन्द्र से 6/7/8 भाव में — नेतृत्व, धन, अधिकार कारक।',
    gu: 'શુભ ગ્રહો ({list}) ચંદ્રથી 6/7/8 ભાવમાં — નેતૃત્વ, ધન, અધિકાર કારક.',
    sa: 'शुभग्रहाः ({list}) चन्द्रात् ६-७-८-भावेषु — नेतृत्व-धन-अधिकारप्रदाः।',
  },
  'yoga.description.RajjuNabhasa': {
    en: 'All seven planets occupy movable (chara) signs — traveller, restless, fond of foreign places.',
    hi: 'सातों ग्रह चर राशियों में — यात्री, अशान्त, विदेश-प्रिय।',
    gu: 'સાતેય ગ્રહો ચર રાશિઓમાં — પ્રવાસી, ચંચળ, વિદેશ-પ્રેમી.',
    sa: 'सप्तापि ग्रहाः चरराशिषु — यात्री, अशान्तः, परदेशप्रियः।',
  },
  'yoga.description.MusalaNabhasa': {
    en: 'All seven planets occupy fixed (sthira) signs — steady wealth, honours, high status.',
    hi: 'सातों ग्रह स्थिर राशियों में — स्थायी धन, सम्मान, उच्च प्रतिष्ठा।',
    gu: 'સાતેય ગ્રહો સ્થિર રાશિઓમાં — સ્થાયી ધન, સન્માન, ઉચ્ચ પ્રતિષ્ઠા.',
    sa: 'सप्तापि ग्रहाः स्थिरराशिषु — स्थिरधनम्, सम्मानम्, उच्चपदम्।',
  },
  'yoga.description.NalaNabhasa': {
    en: 'All seven planets occupy dual (dwi-svabhava) signs — defective limb or trait, adaptive, resourceful.',
    hi: 'सातों ग्रह द्विस्वभाव राशियों में — किसी अंग में दोष, अनुकूलनशील, संसाधनी।',
    gu: 'સાતેય ગ્રહો દ્વિ-સ્વભાવ રાશિઓમાં — અંગ/લક્ષણમાં દોષ, અનુકૂળ, સંસાધનિક.',
    sa: 'सप्तापि ग्रहाः द्विस्वभावराशिषु — कस्मिंश्चित् अङ्गे दोषः, अनुकूलः, बहूपायी।',
  },
  'yoga.description.Parivartana': {
    en: '{a} and {b} exchange signs — strengthens both planets and their houses.',
    hi: '{a} व {b} में राशि-परिवर्तन — दोनों ग्रह व उनके भाव बलवान्।',
    gu: '{a} અને {b} વચ્ચે રાશિ-પરિવર્તન — બંને ગ્રહ અને તેમના ભાવો બળવાન.',
    sa: '{a} {b} राशिविनिमयः — उभौ ग्रहौ तदधिष्ठितभावौ च बलिनौ।',
  },

  // ─ Yogas DB: names + effect prose for the data-driven catalogue ───────────
  // (32 entries; one (name, effect) pair per yoga. Keep keys aligned with the
  //  `id` field of every YOGAS entry in data/yogas-db.ts.)

  // ─ Pancha Mahapurusha ─
  'yogasDb.ruchaka.name': {
    en: 'Ruchaka Yoga',
    hi: 'रुचक योग',
    gu: 'રુચક યોગ',
    sa: 'रुचकयोगः',
  },
  'yogasDb.ruchaka.effect': {
    en: 'Courageous, commanding leader; martial prowess; high status.',
    hi: 'साहसी, आज्ञाकारी नेता; मार्शल पराक्रम; उच्च प्रतिष्ठा।',
    gu: 'સાહસી, આદેશક નેતા; પરાક્રમ; ઉચ્ચ પ્રતિષ્ઠા.',
    sa: 'साहसी आज्ञाप्रदः नेता; पराक्रमः; उच्चपदम्।',
  },
  'yogasDb.bhadra.name': {
    en: 'Bhadra Yoga',
    hi: 'भद्र योग',
    gu: 'ભદ્ર યોગ',
    sa: 'भद्रयोगः',
  },
  'yogasDb.bhadra.effect': {
    en: 'Sharp intelligence, learning, eloquence and business acumen.',
    hi: 'तीक्ष्ण बुद्धि, विद्या, वाक्पटुता एवं व्यापारिक कौशल।',
    gu: 'તીક્ષ્ણ બુદ્ધિ, વિદ્યા, વાક્પટુતા અને વ્યાપારિક કૌશલ્ય.',
    sa: 'तीक्ष्णा बुद्धिः, विद्या, वाक्पाटवम्, वाणिज्यनैपुण्यं च।',
  },
  'yogasDb.hamsa.name': {
    en: 'Hamsa Yoga',
    hi: 'हंस योग',
    gu: 'હંસ યોગ',
    sa: 'हंसयोगः',
  },
  'yogasDb.hamsa.effect': {
    en: 'Wisdom, virtue, religious nature, respected by all.',
    hi: 'विद्वत्ता, सद्गुण, धार्मिक प्रकृति, सर्वत्र सम्मान।',
    gu: 'વિદ્વત્તા, સદ્ગુણ, ધાર્મિક પ્રકૃતિ, સર્વત્ર સન્માન.',
    sa: 'विद्वत्ता, सद्गुणाः, धार्मिकस्वभावः, सर्वैः सम्मानितः।',
  },
  'yogasDb.malavya.name': {
    en: 'Malavya Yoga',
    hi: 'मालव्य योग',
    gu: 'માલવ્ય યોગ',
    sa: 'मालव्ययोगः',
  },
  'yogasDb.malavya.effect': {
    en: 'Beauty, luxury, artistic talents and a happy family life.',
    hi: 'सौन्दर्य, ऐश्वर्य, कलात्मक प्रतिभा एवं सुखी पारिवारिक जीवन।',
    gu: 'સૌંદર્ય, ઐશ્વર્ય, કલાત્મક પ્રતિભા અને સુખી પારિવારિક જીવન.',
    sa: 'सौन्दर्यम्, ऐश्वर्यम्, कलाकौशलम्, सुखकरं कुटुम्बजीवनं च।',
  },
  'yogasDb.shasha.name': {
    en: 'Shasha Yoga',
    hi: 'शश योग',
    gu: 'શશ યોગ',
    sa: 'शशयोगः',
  },
  'yogasDb.shasha.effect': {
    en: 'Discipline, longevity, leadership over many; political success.',
    hi: 'अनुशासन, दीर्घायु, बहुजनों पर नेतृत्व; राजनीतिक सफलता।',
    gu: 'અનુશાસન, દીર્ઘાયુ, બહુજનો પર નેતૃત્વ; રાજકીય સફળતા.',
    sa: 'अनुशासनम्, दीर्घायुः, बहुजनेषु नेतृत्वम्, राजनीतौ सफलता च।',
  },

  // ─ Lunar / Solar yogas ─
  'yogasDb.gajakesari.name': {
    en: 'Gajakesari Yoga',
    hi: 'गजकेसरी योग',
    gu: 'ગજકેસરી યોગ',
    sa: 'गजकेसरीयोगः',
  },
  'yogasDb.gajakesari.effect': {
    en: 'Eloquence, fame, intelligence and respect among learned.',
    hi: 'वाक्पटुता, यश, बुद्धि एवं विद्वानों में सम्मान।',
    gu: 'વાક્પટુતા, યશ, બુદ્ધિ અને વિદ્વાનોમાં સન્માન.',
    sa: 'वाक्पाटवम्, कीर्तिः, बुद्धिः, विद्वत्सु सम्मानः च।',
  },
  'yogasDb.budhaditya.name': {
    en: 'Budhaditya Yoga',
    hi: 'बुधादित्य योग',
    gu: 'બુધાદિત્ય યોગ',
    sa: 'बुधादित्ययोगः',
  },
  'yogasDb.budhaditya.effect': {
    en: 'Sharp intellect, learning, communication skills.',
    hi: 'तीक्ष्ण बुद्धि, विद्या, संवाद कौशल।',
    gu: 'તીક્ષ્ણ બુદ્ધિ, વિદ્યા, સંવાદ કૌશલ્ય.',
    sa: 'तीक्ष्णा बुद्धिः, विद्या, सम्भाषणनैपुण्यं च।',
  },
  'yogasDb.chandra_mangala.name': {
    en: 'Chandra-Mangala Yoga',
    hi: 'चंद्र-मंगल योग',
    gu: 'ચંદ્ર-મંગળ યોગ',
    sa: 'चन्द्रमङ्गलयोगः',
  },
  'yogasDb.chandra_mangala.effect': {
    en: 'Wealth through commerce and enterprise.',
    hi: 'व्यापार एवं उद्यम से धन-प्राप्ति।',
    gu: 'વ્યાપાર અને ઉદ્યમથી ધન-પ્રાપ્તિ.',
    sa: 'वाणिज्योद्यमेन धनप्राप्तिः।',
  },
  'yogasDb.sunapha.name': {
    en: 'Sunapha Yoga',
    hi: 'सुनफा योग',
    gu: 'સુનફા યોગ',
    sa: 'सुनफायोगः',
  },
  'yogasDb.sunapha.effect': {
    en: 'Self-earned wealth, intelligence, fame.',
    hi: 'स्वार्जित धन, बुद्धि, यश।',
    gu: 'સ્વાર્જિત ધન, બુદ્ધિ, યશ.',
    sa: 'स्वार्जितं धनम्, बुद्धिः, कीर्तिः च।',
  },

  // ─ Arishta ─
  'yogasDb.kemadruma.name': {
    en: 'Kemadruma Yoga',
    hi: 'केमद्रुम योग',
    gu: 'કેમદ્રુમ યોગ',
    sa: 'केमद्रुमयोगः',
  },
  'yogasDb.kemadruma.effect': {
    en: 'Isolated Moon — financial struggle and emotional difficulty unless cancelled.',
    hi: 'एकाकी चन्द्र — निरस्त न होने पर आर्थिक संघर्ष व भावनात्मक कठिनाई।',
    gu: 'એકાકી ચંદ્ર — રદ ન થાય તો આર્થિક સંઘર્ષ અને ભાવનાત્મક મુશ્કેલી.',
    sa: 'एकाकी चन्द्रः — अनिवारिते सति आर्थिकसङ्कटं भावनादुःखं च।',
  },

  // ─ House-lord-in-house yogas ─
  'yogasDb.l1_in_10.name': {
    en: 'Lord of Lagna in 10th',
    hi: 'लग्नेश 10वें भाव में',
    gu: 'લગ્નેશ 10મા ભાવમાં',
    sa: 'लग्नेशः दशमे भावे',
  },
  'yogasDb.l1_in_10.effect': {
    en: 'Career success, recognition from authority.',
    hi: 'व्यवसाय में सफलता, राजकीय/अधिकारी वर्ग से प्रतिष्ठा।',
    gu: 'કારકિર્દી સફળતા, સત્તાધિકારીઓ તરફથી માન્યતા.',
    sa: 'कर्मणि सफलता, अधिकारिवर्गात् सम्मानप्राप्तिः।',
  },
  'yogasDb.l9_in_10.name': {
    en: 'Dharma-Karma Adhipati Yoga',
    hi: 'धर्म-कर्मा अधिपति योग',
    gu: 'ધર્મ-કર્મા અધિપતિ યોગ',
    sa: 'धर्मकर्माधिपतियोगः',
  },
  'yogasDb.l9_in_10.effect': {
    en: 'Powerful raja yoga; success aligned with dharma.',
    hi: 'शक्तिशाली राज योग; धर्मानुकूल सफलता।',
    gu: 'શક્તિશાળી રાજ યોગ; ધર્માનુકૂળ સફળતા.',
    sa: 'बलवान् राजयोगः; धर्मानुकूला सफलता।',
  },
  'yogasDb.l5_in_9.name': {
    en: 'Lakshmi Yoga',
    hi: 'लक्ष्मी योग',
    gu: 'લક્ષ્મી યોગ',
    sa: 'लक्ष्मीयोगः',
  },
  'yogasDb.l5_in_9.effect': {
    en: 'Wealth, fortune, blessings of Lakshmi.',
    hi: 'धन, सौभाग्य, लक्ष्मी की कृपा।',
    gu: 'ધન, સૌભાગ્ય, લક્ષ્મીની કૃપા.',
    sa: 'धनम्, सौभाग्यम्, लक्ष्म्याः कृपा च।',
  },
  'yogasDb.l11_in_2.name': {
    en: 'Dhana Yoga',
    hi: 'धन योग',
    gu: 'ધન યોગ',
    sa: 'धनयोगः',
  },
  'yogasDb.l11_in_2.effect': {
    en: 'Multiple sources of income flowing into the family wealth.',
    hi: 'अनेक आय-स्रोत कुटुम्ब के धन में संचित होते हैं।',
    gu: 'અનેક આવક-સ્રોતો કુટુંબના ધનમાં વહે છે.',
    sa: 'बहूनि आयस्थानानि कुटुम्बधने सङ्गृह्यन्ते।',
  },

  // ─ Phase 14I — Lunar (anapha, durudhara) ─
  'yogasDb.anapha.name': {
    en: 'Anapha Yoga',
    hi: 'अनफा योग',
    gu: 'અનફા યોગ',
    sa: 'अनफायोगः',
  },
  'yogasDb.anapha.effect': {
    en: 'Eloquent, virtuous, courteous, kingly temperament; strong social position.',
    hi: 'वाक्पटु, सद्गुणी, विनम्र, राजसी स्वभाव; उच्च सामाजिक स्थान।',
    gu: 'વાક્પટુ, સદ્ગુણી, વિનમ્ર, રાજસી સ્વભાવ; ઉચ્ચ સામાજિક સ્થાન.',
    sa: 'वाक्पटुः सद्गुणी विनयी राजसस्वभावः; उच्चं सामाजिकपदम्।',
  },
  'yogasDb.durudhara.name': {
    en: 'Durudhara Yoga',
    hi: 'दुरुधरा योग',
    gu: 'દુરુધરા યોગ',
    sa: 'दुरुधरायोगः',
  },
  'yogasDb.durudhara.effect': {
    en: 'Wealth, vehicles, servants; provident and self-assured life.',
    hi: 'धन, वाहन, सेवक; दूरदर्शी एवं आत्मविश्वासी जीवन।',
    gu: 'ધન, વાહનો, સેવકો; દૂરદર્શી અને આત્મવિશ્વાસપૂર્ણ જીવન.',
    sa: 'धनम्, वाहनानि, सेवकाः; दूरदर्शि आत्मविश्वासयुक्तं जीवनम्।',
  },

  // ─ Solar yogas ─
  'yogasDb.vesi.name': {
    en: 'Vesi Yoga',
    hi: 'वेशी योग',
    gu: 'વેશી યોગ',
    sa: 'वेशीयोगः',
  },
  'yogasDb.vesi.effect': {
    en: 'Honest, truthful, noble; righteous demeanour.',
    hi: 'सत्यनिष्ठ, ईमानदार, उदार; धार्मिक आचरण।',
    gu: 'સત્યનિષ્ઠ, પ્રામાણિક, ઉદાર; ધાર્મિક આચરણ.',
    sa: 'सत्यनिष्ठः, सत्यवादी, उदारः; धार्मिकं आचरणम्।',
  },
  'yogasDb.vosi.name': {
    en: 'Vosi Yoga',
    hi: 'वोशी योग',
    gu: 'વોશી યોગ',
    sa: 'वोशीयोगः',
  },
  'yogasDb.vosi.effect': {
    en: 'Learned, generous, philosophic turn of mind.',
    hi: 'विद्वान्, उदार, दार्शनिक स्वभाव।',
    gu: 'વિદ્વાન, ઉદાર, દાર્શનિક સ્વભાવ.',
    sa: 'विद्वान्, उदारः, दार्शनिकस्वभावः।',
  },

  // ─ Classical Dhana yogas ─
  'yogasDb.l2_in_11.name': {
    en: '2nd lord in 11th',
    hi: 'द्वितीयेश 11वें भाव में',
    gu: 'દ્વિતીયેશ 11મા ભાવમાં',
    sa: 'द्वितीयेशः एकादशे भावे',
  },
  'yogasDb.l2_in_11.effect': {
    en: 'Family wealth converts to ongoing gains.',
    hi: 'कुटुम्ब का धन निरन्तर लाभ में परिवर्तित होता है।',
    gu: 'કુટુંબનું ધન સતત લાભમાં પરિવર્તિત થાય છે.',
    sa: 'कुटुम्बधनं नित्यं लाभरूपेण परिणमते।',
  },
  'yogasDb.l5_in_11.name': {
    en: '5th lord in 11th',
    hi: 'पंचमेश 11वें भाव में',
    gu: 'પંચમેશ 11મા ભાવમાં',
    sa: 'पञ्चमेशः एकादशे भावे',
  },
  'yogasDb.l5_in_11.effect': {
    en: 'Gains through intelligence, speculation, and children.',
    hi: 'बुद्धि, सट्टा एवं संतान से लाभ।',
    gu: 'બુદ્ધિ, સટ્ટા અને સંતાનથી લાભ.',
    sa: 'बुद्ध्या सट्टया सन्तानेन च लाभः।',
  },
  'yogasDb.l9_in_2.name': {
    en: '9th lord in 2nd',
    hi: 'नवमेश 2रे भाव में',
    gu: 'નવમેશ 2જા ભાવમાં',
    sa: 'नवमेशः द्वितीये भावे',
  },
  'yogasDb.l9_in_2.effect': {
    en: 'Wealth through good fortune; paternal inheritance.',
    hi: 'सौभाग्य से धन; पैतृक सम्पत्ति।',
    gu: 'સૌભાગ્યથી ધન; પૈતૃક સંપત્તિ.',
    sa: 'सौभाग्येन धनम्; पैतृकं द्रव्यम्।',
  },
  'yogasDb.l9_in_11.name': {
    en: 'Bhagyodaya — 9th lord in 11th',
    hi: 'भाग्योदय — नवमेश 11वें भाव में',
    gu: 'ભાગ્યોદય — નવમેશ 11મા ભાવમાં',
    sa: 'भाग्योदयः — नवमेशः एकादशे भावे',
  },
  'yogasDb.l9_in_11.effect': {
    en: 'Luck translates into steady material gains throughout life.',
    hi: 'जीवनभर सौभाग्य स्थायी आर्थिक लाभ में परिणत।',
    gu: 'જીવનભર સૌભાગ્ય સ્થાયી આર્થિક લાભમાં પરિણમે છે.',
    sa: 'जीवनपर्यन्तं भाग्यं स्थिरार्थलाभरूपेण परिणमते।',
  },
  'yogasDb.l10_in_11.name': {
    en: '10th lord in 11th',
    hi: 'दशमेश 11वें भाव में',
    gu: 'દશમેશ 11મા ભાવમાં',
    sa: 'दशमेशः एकादशे भावे',
  },
  'yogasDb.l10_in_11.effect': {
    en: 'Career produces strong gains; commission / profit-sharing.',
    hi: 'व्यवसाय से प्रबल लाभ; कमीशन/लाभांश।',
    gu: 'કારકિર્દીથી પ્રબળ લાભ; કમિશન/નફો.',
    sa: 'कर्मणः बलवान् लाभः; आयांशः लाभविभागः च।',
  },
  'yogasDb.l2_in_5.name': {
    en: '2nd lord in 5th',
    hi: 'द्वितीयेश 5वें भाव में',
    gu: 'દ્વિતીયેશ 5મા ભાવમાં',
    sa: 'द्वितीयेशः पञ्चमे भावे',
  },
  'yogasDb.l2_in_5.effect': {
    en: 'Wealth via intellectual pursuits / children / speculation.',
    hi: 'बौद्धिक कार्यों, संतान अथवा सट्टे से धन।',
    gu: 'બૌદ્ધિક પ્રવૃત્તિઓ, સંતાન કે સટ્ટાથી ધન.',
    sa: 'बुद्धिकार्यैः, सन्तानेन, सट्टया वा धनम्।',
  },

  // ─ Raja yogas (kendra-trikona / specific lords) ─
  'yogasDb.l1_in_4.name': {
    en: 'Lord of Lagna in 4th',
    hi: 'लग्नेश 4थे भाव में',
    gu: 'લગ્નેશ 4થા ભાવમાં',
    sa: 'लग्नेशः चतुर्थे भावे',
  },
  'yogasDb.l1_in_4.effect': {
    en: 'Comfort, vehicles, property; strong domestic life.',
    hi: 'सुख, वाहन, सम्पत्ति; सशक्त गृहस्थ जीवन।',
    gu: 'સુખ, વાહનો, સંપત્તિ; સશક્ત ગૃહસ્થ જીવન.',
    sa: 'सुखम्, वाहनानि, स्थावरम्; बलवान् गृहस्थभावः।',
  },
  'yogasDb.l1_in_7.name': {
    en: 'Lord of Lagna in 7th',
    hi: 'लग्नेश 7वें भाव में',
    gu: 'લગ્નેશ 7મા ભાવમાં',
    sa: 'लग्नेशः सप्तमे भावे',
  },
  'yogasDb.l1_in_7.effect': {
    en: 'Focus on partnership; strong spouse; foreign residence potential.',
    hi: 'जीवनसाथी पर ध्यान; प्रबल जीवनसाथी; विदेश-वास की सम्भावना।',
    gu: 'જીવનસાથી પર ધ્યાન; પ્રબળ જીવનસાથી; વિદેશવાસની શક્યતા.',
    sa: 'जीवनसहचरे ध्यानम्; बलवान् सहचरः; परदेशवासयोगः।',
  },
  'yogasDb.l1_in_9.name': {
    en: 'Bhagya Yoga — 1st lord in 9th',
    hi: 'भाग्य योग — लग्नेश 9वें भाव में',
    gu: 'ભાગ્ય યોગ — લગ્નેશ 9મા ભાવમાં',
    sa: 'भाग्ययोगः — लग्नेशः नवमे भावे',
  },
  'yogasDb.l1_in_9.effect': {
    en: 'Religious, fortunate, blessed by father and teachers.',
    hi: 'धार्मिक, भाग्यशाली, पिता एवं गुरुओं से कृपापात्र।',
    gu: 'ધાર્મિક, ભાગ્યશાળી, પિતા અને ગુરુઓની કૃપાપાત્ર.',
    sa: 'धार्मिकः, भाग्यवान्, पितुः गुरूणां च कृपापात्रम्।',
  },
  'yogasDb.l4_in_10.name': {
    en: '4th lord in 10th',
    hi: 'चतुर्थेश 10वें भाव में',
    gu: 'ચતુર્થેશ 10મા ભાવમાં',
    sa: 'चतुर्थेशः दशमे भावे',
  },
  'yogasDb.l4_in_10.effect': {
    en: 'Emotional satisfaction through work; inherited profession.',
    hi: 'कार्य से भावनात्मक सन्तुष्टि; पैतृक व्यवसाय।',
    gu: 'કાર્યથી ભાવનાત્મક સંતોષ; પૈતૃક વ્યવસાય.',
    sa: 'कर्मणा भावसन्तोषः; पैतृको व्यवसायः।',
  },
  'yogasDb.l5_in_10.name': {
    en: '5th lord in 10th',
    hi: 'पंचमेश 10वें भाव में',
    gu: 'પંચમેશ 10મા ભાવમાં',
    sa: 'पञ्चमेशः दशमे भावे',
  },
  'yogasDb.l5_in_10.effect': {
    en: 'Creative work; teaching, public intellectual role.',
    hi: 'सर्जनात्मक कार्य; अध्यापन, सार्वजनिक बौद्धिक भूमिका।',
    gu: 'સર્જનાત્મક કાર્ય; અધ્યાપન, જાહેર બૌદ્ધિક ભૂમિકા.',
    sa: 'सर्जनात्मकं कर्म; अध्यापनम्, सार्वजनिक-बुद्धिजीविभूमिका।',
  },
  'yogasDb.l10_in_1.name': {
    en: '10th lord in 1st',
    hi: 'दशमेश लग्न में',
    gu: 'દશમેશ લગ્નમાં',
    sa: 'दशमेशः लग्ने',
  },
  'yogasDb.l10_in_1.effect': {
    en: 'Self-made, ambitious, reputation built on personal effort.',
    hi: 'स्वावलम्बी, महत्त्वाकांक्षी, स्व-प्रयास से प्रतिष्ठा।',
    gu: 'સ્વાવલંબી, મહત્ત્વાકાંક્ષી, સ્વ-પ્રયત્નથી પ્રતિષ્ઠા.',
    sa: 'स्वावलम्बी, महत्त्वाकाङ्क्षी, स्वप्रयत्नेन कीर्तिः।',
  },
  'yogasDb.l10_in_5.name': {
    en: '10th lord in 5th',
    hi: 'दशमेश 5वें भाव में',
    gu: 'દશમેશ 5મા ભાવમાં',
    sa: 'दशमेशः पञ्चमे भावे',
  },
  'yogasDb.l10_in_5.effect': {
    en: 'Fame through intellect, creativity, or public speaking.',
    hi: 'बुद्धि, सृजनात्मकता अथवा सार्वजनिक भाषण से यश।',
    gu: 'બુદ્ધિ, સર્જનાત્મકતા કે જાહેર વક્તવ્યથી યશ.',
    sa: 'बुद्ध्या, सर्जनात्मकतया, सार्वजनिकभाषणेन वा कीर्तिः।',
  },
  'yogasDb.l10_in_9.name': {
    en: 'Karma-Dharma Adhipati',
    hi: 'कर्म-धर्म अधिपति',
    gu: 'કર્મ-ધર્મ અધિપતિ',
    sa: 'कर्मधर्माधिपतिः',
  },
  'yogasDb.l10_in_9.effect': {
    en: 'Career aligned with dharma; teaching, law, philosophy, service.',
    hi: 'धर्मानुकूल कर्म; अध्यापन, विधि, दर्शन, सेवा।',
    gu: 'ધર્માનુકૂળ કર્મ; અધ્યાપન, કાયદો, દર્શન, સેવા.',
    sa: 'धर्मानुकूलं कर्म; अध्यापनम्, विधिः, दर्शनम्, सेवा च।',
  },
  'yogasDb.l5_in_1.name': {
    en: '5th lord in 1st',
    hi: 'पंचमेश लग्न में',
    gu: 'પંચમેશ લગ્નમાં',
    sa: 'पञ्चमेशः लग्ने',
  },
  'yogasDb.l5_in_1.effect': {
    en: 'Intelligent, child-blessed, creative endeavours succeed.',
    hi: 'बुद्धिमान्, सन्तान-सौभाग्य, सर्जनात्मक प्रयास सफल।',
    gu: 'બુદ્ધિમાન, સંતાન-સૌભાગ્ય, સર્જનાત્મક પ્રયત્નો સફળ.',
    sa: 'बुद्धिमान्, सन्तानसौख्यम्, सर्जनात्मककार्येषु सफलता।',
  },
  'yogasDb.l9_in_5.name': {
    en: '9th lord in 5th',
    hi: 'नवमेश 5वें भाव में',
    gu: 'નવમેશ 5મા ભાવમાં',
    sa: 'नवमेशः पञ्चमे भावे',
  },
  'yogasDb.l9_in_5.effect': {
    en: 'Dharmic creativity; children follow parental teachings.',
    hi: 'धार्मिक सर्जनात्मकता; सन्तान माता-पिता की शिक्षा का अनुसरण करती है।',
    gu: 'ધાર્મિક સર્જનાત્મકતા; સંતાન માતા-પિતાના શિક્ષણને અનુસરે છે.',
    sa: 'धार्मिकी सर्जनात्मकता; सन्ततिः पित्रोः शिक्षाम् अनुसरति।',
  },
  'yogasDb.l9_in_1.name': {
    en: '9th lord in 1st',
    hi: 'नवमेश लग्न में',
    gu: 'નવમેશ લગ્નમાં',
    sa: 'नवमेशः लग्ने',
  },
  'yogasDb.l9_in_1.effect': {
    en: 'Luck follows the self; noble bearing; respect in society.',
    hi: 'भाग्य स्वयं के साथ; उत्तम आचरण; समाज में सम्मान।',
    gu: 'ભાગ્ય સ્વયંની સાથે; ઉત્તમ આચરણ; સમાજમાં સન્માન.',
    sa: 'भाग्यं स्वयमनुगच्छति; उत्तमं आचरणम्; समाजे सम्मानम्।',
  },

  // ─ Additional named yogas ─
  'yogasDb.amala.name': {
    en: 'Amala Yoga',
    hi: 'अमल योग',
    gu: 'અમલ યોગ',
    sa: 'अमलयोगः',
  },
  'yogasDb.amala.effect': {
    en: 'Unblemished reputation, fame, noble work.',
    hi: 'निष्कलंक प्रतिष्ठा, यश, उत्तम कर्म।',
    gu: 'નિષ્કલંક પ્રતિષ્ઠા, યશ, ઉત્તમ કર્મ.',
    sa: 'निष्कलङ्का कीर्तिः, यशः, उत्तमं कर्म।',
  },
  'yogasDb.saraswati.name': {
    en: 'Saraswati Yoga',
    hi: 'सरस्वती योग',
    gu: 'સરસ્વતી યોગ',
    sa: 'सरस्वतीयोगः',
  },
  'yogasDb.saraswati.effect': {
    en: 'Learning, poetry, music, linguistic mastery, divine grace.',
    hi: 'विद्या, काव्य, संगीत, भाषा-निपुणता, देवी-कृपा।',
    gu: 'વિદ્યા, કાવ્ય, સંગીત, ભાષા-નિપુણતા, દેવી-કૃપા.',
    sa: 'विद्या, काव्यम्, सङ्गीतम्, भाषानैपुण्यम्, दैवी कृपा च।',
  },
  'yogasDb.lakshmi_mahalakshmi.name': {
    en: 'Mahalakshmi Yoga',
    hi: 'महालक्ष्मी योग',
    gu: 'મહાલક્ષ્મી યોગ',
    sa: 'महालक्ष्मीयोगः',
  },
  'yogasDb.lakshmi_mahalakshmi.effect': {
    en: 'Abundant wealth, auspiciousness, grace of the goddess of fortune.',
    hi: 'प्रचुर धन, मांगल्य, लक्ष्मी देवी की कृपा।',
    gu: 'પુષ્કળ ધન, મંગળતા, લક્ષ્મીદેવીની કૃપા.',
    sa: 'प्रचुरं धनम्, माङ्गल्यम्, श्रीदेव्याः कृपा च।',
  },
  'yogasDb.adhi.name': {
    en: 'Adhi Yoga',
    hi: 'अधि योग',
    gu: 'અધિ યોગ',
    sa: 'अधियोगः',
  },
  'yogasDb.adhi.effect': {
    en: 'Leadership, lasting fame, many followers.',
    hi: 'नेतृत्व, चिरकालीन यश, बहु-अनुयायी।',
    gu: 'નેતૃત્વ, ચિરકાલીન યશ, બહુ-અનુયાયી.',
    sa: 'नेतृत्वम्, चिरस्थायि कीर्तिः, बहवः अनुयायिनः।',
  },
  'yogasDb.guru_mangala.name': {
    en: 'Guru-Mangala Yoga',
    hi: 'गुरु-मंगल योग',
    gu: 'ગુરુ-મંગળ યોગ',
    sa: 'गुरुमङ्गलयोगः',
  },
  'yogasDb.guru_mangala.effect': {
    en: 'Disciplined drive, courage tempered by wisdom; suited to leadership roles.',
    hi: 'अनुशासित ऊर्जा, ज्ञान-मण्डित साहस; नेतृत्व-योग्य।',
    gu: 'અનુશાસિત ઊર્જા, જ્ઞાનથી શોભતું સાહસ; નેતૃત્વયોગ્ય.',
    sa: 'अनुशासितं तेजः, ज्ञानमण्डितं साहसम्; नेतृत्वार्हः।',
  },
  'yogasDb.shukra_budha.name': {
    en: 'Shukra-Budha Yoga',
    hi: 'शुक्र-बुध योग',
    gu: 'શુક્ર-બુધ યોગ',
    sa: 'शुक्रबुधयोगः',
  },
  'yogasDb.shukra_budha.effect': {
    en: 'Artistic intelligence, charm, trade acumen, polished speech.',
    hi: 'कलात्मक बुद्धि, आकर्षण, व्यापार-कौशल, परिष्कृत वाणी।',
    gu: 'કલાત્મક બુદ્ધિ, આકર્ષણ, વ્યાપાર-કૌશલ્ય, પરિષ્કૃત વાણી.',
    sa: 'कलाबुद्धिः, आकर्षणम्, वाणिज्यनैपुण्यम्, परिष्कृता वाणी च।',
  },
  'yogasDb.neechabhanga.name': {
    en: 'Neechabhanga Raja Yoga (Sun)',
    hi: 'नीचभंग राज योग (सूर्य)',
    gu: 'નીચભંગ રાજ યોગ (સૂર્ય)',
    sa: 'नीचभङ्गराजयोगः (सूर्यः)',
  },
  'yogasDb.neechabhanga.effect': {
    en: 'Cancellation of debilitation produces unexpected rise and recognition.',
    hi: 'नीच-भंग होने से अप्रत्याशित उन्नति एवं प्रतिष्ठा।',
    gu: 'નીચ-ભંગ થતાં અણધારી પ્રગતિ અને પ્રતિષ્ઠા.',
    sa: 'नीचभङ्गेन अप्रत्याशिता उन्नतिः कीर्तिश्च।',
  },
  'yogasDb.shubh_kartari.name': {
    en: 'Shubh Kartari Yoga (Lagna)',
    hi: 'शुभ कर्तरी योग (लग्न)',
    gu: 'શુભ કર્તરી યોગ (લગ્ન)',
    sa: 'शुभकर्तरीयोगः (लग्ने)',
  },
  'yogasDb.shubh_kartari.effect': {
    en: 'Lagna enclosed by benefics — protection, support in life.',
    hi: 'शुभ ग्रहों से लग्न आवृत्त — जीवन में रक्षा एवं सहयोग।',
    gu: 'શુભ ગ્રહોથી લગ્ન ઘેરાયેલું — જીવનમાં રક્ષા અને સહયોગ.',
    sa: 'शुभग्रहैः लग्नं वेष्टितम् — जीवने रक्षा साहाय्यं च।',
  },
  'yogasDb.paap_kartari.name': {
    en: 'Paap Kartari Yoga (Lagna)',
    hi: 'पाप कर्तरी योग (लग्न)',
    gu: 'પાપ કર્તરી યોગ (લગ્ન)',
    sa: 'पापकर्तरीयोगः (लग्ने)',
  },
  'yogasDb.paap_kartari.effect': {
    en: 'Lagna surrounded by malefics — early-life struggle, hedged self-image.',
    hi: 'पाप ग्रहों से लग्न आवृत्त — प्रारम्भिक जीवन में संघर्ष, सीमित आत्म-छवि।',
    gu: 'પાપ ગ્રહોથી લગ્ન ઘેરાયેલું — પ્રારંભિક જીવનમાં સંઘર્ષ, મર્યાદિત આત્મ-છબી.',
    sa: 'पापग्रहैः लग्नं वेष्टितम् — आदिजीवने सङ्घर्षः, सङ्कुचिता आत्मच्छाया।',
  },

  // ─ Arishta combinations ─
  'yogasDb.sakata.name': {
    en: 'Shakata Yoga',
    hi: 'शकट योग',
    gu: 'શકટ યોગ',
    sa: 'शकटयोगः',
  },
  'yogasDb.sakata.effect': {
    en: 'Jupiter in 6/8/12 from Moon — up-and-down material fortunes.',
    hi: 'चन्द्र से 6/8/12 भाव में गुरु — आर्थिक स्थिति में उतार-चढ़ाव।',
    gu: 'ચંદ્રથી 6/8/12 ભાવમાં ગુરુ — આર્થિક સ્થિતિમાં ઉતાર-ચઢાવ.',
    sa: 'चन्द्रात् ६-८-१२-भावे गुरुः — आर्थिकस्य उच्चावचता।',
  },
  'yogasDb.daridra.name': {
    en: 'Daridra Yoga',
    hi: 'दरिद्र योग',
    gu: 'દરિદ્ર યોગ',
    sa: 'दरिद्रयोगः',
  },
  'yogasDb.daridra.effect': {
    en: '11th lord in 6th — sources of gain blocked by debts / adversaries.',
    hi: 'एकादशेश 6ठे भाव में — ऋण/शत्रुओं से लाभ-स्रोत अवरुद्ध।',
    gu: 'એકાદશેશ 6ઠ્ઠા ભાવમાં — ઋણ/શત્રુઓથી લાભ-સ્રોત અવરુદ્ધ.',
    sa: 'एकादशेशः षष्ठे भावे — ऋणैः शत्रुभिश्च लाभस्थानानि रुद्धानि।',
  },
  'yogasDb.kapata.name': {
    en: 'Kapata Yoga',
    hi: 'कपट योग',
    gu: 'કપટ યોગ',
    sa: 'कपटयोगः',
  },
  'yogasDb.kapata.effect': {
    en: 'Mercury-Rahu conjunction — tendency to deceit or deceptive circumstances.',
    hi: 'बुध-राहु युति — कपट की प्रवृत्ति अथवा भ्रामक परिस्थिति।',
    gu: 'બુધ-રાહુ યુતિ — કપટની વૃત્તિ અથવા ભ્રામક પરિસ્થિતિ.',
    sa: 'बुधराहुयुतिः — कपटप्रवृत्तिः भ्रामकं परिवेशो वा।',
  },
  'yogasDb.guru_chandal.name': {
    en: 'Guru Chandala Yoga',
    hi: 'गुरु चांडाल योग',
    gu: 'ગુરુ ચાંડાલ યોગ',
    sa: 'गुरुचाण्डालयोगः',
  },
  'yogasDb.guru_chandal.effect': {
    en: 'Wisdom polluted; teachers misbehave; need for self-discipline.',
    hi: 'ज्ञान दूषित; गुरुओं का अनुचित आचरण; आत्म-संयम की आवश्यकता।',
    gu: 'જ્ઞાન દૂષિત; ગુરુઓનું અનુચિત આચરણ; આત્મ-સંયમની જરૂર.',
    sa: 'दूषितं ज्ञानम्; गुरूणां अनुचितं आचरणम्; आत्मसंयमस्य आवश्यकता।',
  },
  'yogasDb.kal_sarpa.name': {
    en: 'Kala Sarpa Yoga',
    hi: 'काल सर्प योग',
    gu: 'કાલ સર્પ યોગ',
    sa: 'कालसर्पयोगः',
  },
  'yogasDb.kal_sarpa.effect': {
    en: 'Life has "all-in" swings; major karmic lessons; delayed fruition.',
    hi: 'जीवन में अति-तीव्र उतार-चढ़ाव; प्रमुख कर्म-पाठ; विलम्बित फल-प्राप्ति।',
    gu: 'જીવનમાં અતિ-તીવ્ર ઉતાર-ચઢાવ; મુખ્ય કર્મ-પાઠ; વિલંબિત ફળ-પ્રાપ્તિ.',
    sa: 'जीवने अतितीव्रोच्चावचाः; प्रमुखाः कर्मपाठाः; विलम्बिता फलप्राप्तिः।',
  },

  // ─ Retrograde flags as yogas ─
  'yogasDb.jupiter_retrograde.name': {
    en: 'Jupiter Retrograde',
    hi: 'गुरु वक्री',
    gu: 'ગુરુ વક્રી',
    sa: 'गुरुः वक्री',
  },
  'yogasDb.jupiter_retrograde.effect': {
    en: 'Deep, reflective wisdom; teacher role in previous life carried forward.',
    hi: 'गम्भीर एवं आत्मनिरीक्षणकारी ज्ञान; पूर्वजन्म की गुरु-भूमिका अग्रसर।',
    gu: 'ગંભીર અને આત્મનિરીક્ષણાત્મક જ્ઞાન; પૂર્વજન્મની ગુરુ-ભૂમિકા આગળ ધપે છે.',
    sa: 'गम्भीरं आत्मनिरीक्षणयुक्तं ज्ञानम्; पूर्वजन्मनः गुरुभूमिका अनुवर्तते।',
  },
  'yogasDb.saturn_retrograde.name': {
    en: 'Saturn Retrograde',
    hi: 'शनि वक्री',
    gu: 'શનિ વક્રી',
    sa: 'शनिः वक्री',
  },
  'yogasDb.saturn_retrograde.effect': {
    en: 'Unfinished karmic work of discipline and responsibility; later fruition.',
    hi: 'अनुशासन एवं उत्तरदायित्व का अधूरा कर्म; विलम्बित फल।',
    gu: 'અનુશાસન અને જવાબદારીનું અધૂરું કર્મ; વિલંબિત ફળ.',
    sa: 'अनुशासन-उत्तरदायित्वयोः अपूर्णं कर्म; विलम्बितं फलम्।',
  },
  'yogasDb.mars_retrograde.name': {
    en: 'Mars Retrograde',
    hi: 'मंगल वक्री',
    gu: 'મંગળ વક્રી',
    sa: 'मङ्गलः वक्री',
  },
  'yogasDb.mars_retrograde.effect': {
    en: 'Internalised drive; anger held in; strategic rather than direct action.',
    hi: 'आन्तरीकृत ऊर्जा; क्रोध दमित; प्रत्यक्ष के स्थान पर रणनीतिक कर्म।',
    gu: 'આંતરિક ઊર્જા; ગુસ્સો દબાવેલો; પ્રત્યક્ષ બદલે વ્યૂહાત્મક ક્રિયા.',
    sa: 'आन्तरीकृतं तेजः; निगृहीतः क्रोधः; प्रत्यक्षात् रणनीतिकं कर्म।',
  },

  // ─ House-based special combinations ─
  'yogasDb.ju_in_1.name': {
    en: 'Jupiter in Lagna',
    hi: 'गुरु लग्न में',
    gu: 'ગુરુ લગ્નમાં',
    sa: 'गुरुः लग्ने',
  },
  'yogasDb.ju_in_1.effect': {
    en: 'Protected, wise, respected; classical "best placement" for Jupiter.',
    hi: 'रक्षित, विद्वान्, सम्मानित; गुरु का शास्त्रीय "श्रेष्ठ स्थान"।',
    gu: 'રક્ષિત, વિદ્વાન, સન્માનિત; ગુરુનું શાસ્ત્રીય "શ્રેષ્ઠ સ્થાન".',
    sa: 'रक्षितः, विद्वान्, सम्मानितः; गुरोः शास्त्रीयं "श्रेष्ठं स्थानम्"।',
  },
  'yogasDb.ve_in_1.name': {
    en: 'Venus in Lagna',
    hi: 'शुक्र लग्न में',
    gu: 'શુક્ર લગ્નમાં',
    sa: 'शुक्रः लग्ने',
  },
  'yogasDb.ve_in_1.effect': {
    en: 'Attractive, diplomatic, artistic; strong relationships.',
    hi: 'आकर्षक, कूटनीतिज्ञ, कलात्मक; प्रबल सम्बन्ध।',
    gu: 'આકર્ષક, કૂટનીતિજ્ઞ, કલાત્મક; પ્રબળ સંબંધો.',
    sa: 'आकर्षकः, कूटनीतिज्ञः, कलाप्रियः; बलवन्तः सम्बन्धाः।',
  },
  'yogasDb.mo_in_4.name': {
    en: 'Moon in 4th',
    hi: 'चन्द्र 4थे भाव में',
    gu: 'ચંદ્ર 4થા ભાવમાં',
    sa: 'चन्द्रः चतुर्थे भावे',
  },
  'yogasDb.mo_in_4.effect': {
    en: 'Emotional fulfilment at home, mother-close, property gains.',
    hi: 'गृह में भावनात्मक सन्तोष, माता से निकटता, सम्पत्ति-लाभ।',
    gu: 'ઘરમાં ભાવનાત્મક સંતોષ, માતા સાથે નિકટતા, સંપત્તિ-લાભ.',
    sa: 'गृहे भावसन्तोषः, मात्रा सान्निध्यम्, स्थावरलाभः।',
  },
  'yogasDb.sa_in_7.name': {
    en: 'Saturn in 7th',
    hi: 'शनि 7वें भाव में',
    gu: 'શનિ 7મા ભાવમાં',
    sa: 'शनिः सप्तमे भावे',
  },
  'yogasDb.sa_in_7.effect': {
    en: 'Serious, committed partner; may delay marriage.',
    hi: 'गम्भीर, समर्पित जीवनसाथी; विवाह में विलम्ब सम्भव।',
    gu: 'ગંભીર, સમર્પિત જીવનસાથી; લગ્નમાં વિલંબ થઈ શકે.',
    sa: 'गम्भीरः समर्पितश्च सहचरः; विवाहे विलम्बः सम्भवति।',
  },
  'yogasDb.ma_in_3.name': {
    en: 'Mars in 3rd',
    hi: 'मंगल 3रे भाव में',
    gu: 'મંગળ 3જા ભાવમાં',
    sa: 'मङ्गलः तृतीये भावे',
  },
  'yogasDb.ma_in_3.effect': {
    en: 'Courageous siblings, entrepreneurial drive, martial skill.',
    hi: 'पराक्रमी भाई-बहन, उद्यमशीलता, सामरिक कौशल।',
    gu: 'પરાક્રમી ભાઈ-બહેન, ઉદ્યમશીલતા, સામરિક કૌશલ્ય.',
    sa: 'पराक्रमिणः सहजाः, उद्यमशीलता, युद्धनैपुण्यम्।',
  },
  'yogasDb.me_in_5.name': {
    en: 'Mercury in 5th',
    hi: 'बुध 5वें भाव में',
    gu: 'બુધ 5મા ભાવમાં',
    sa: 'बुधः पञ्चमे भावे',
  },
  'yogasDb.me_in_5.effect': {
    en: 'Sharp intelligence, communication-based creativity, teaching talent.',
    hi: 'तीक्ष्ण बुद्धि, संवाद-आधारित सर्जनात्मकता, अध्यापन-प्रतिभा।',
    gu: 'તીક્ષ્ણ બુદ્ધિ, સંવાદ-આધારિત સર્જનાત્મકતા, અધ્યાપન-પ્રતિભા.',
    sa: 'तीक्ष्णा बुद्धिः, सम्भाषणजा सर्जनात्मकता, अध्यापननैपुण्यम्।',
  },
  'yogasDb.su_in_10.name': {
    en: 'Sun in 10th',
    hi: 'सूर्य 10वें भाव में',
    gu: 'સૂર્ય 10મા ભાવમાં',
    sa: 'सूर्यः दशमे भावे',
  },
  'yogasDb.su_in_10.effect': {
    en: 'Commanding presence in career; authority, government / executive roles.',
    hi: 'कर्मक्षेत्र में आज्ञाकारी उपस्थिति; अधिकार, सरकारी/कार्यकारी पद।',
    gu: 'કારકિર્દીમાં આદેશાત્મક હાજરી; સત્તા, સરકારી/કાર્યકારી ભૂમિકા.',
    sa: 'कर्मणि आज्ञाप्रभावी स्थितिः; अधिकारः, राजकीय-कार्यकारी-पदम्।',
  },
  'yogasDb.ra_in_3.name': {
    en: 'Rahu in 3rd',
    hi: 'राहु 3रे भाव में',
    gu: 'રાહુ 3જા ભાવમાં',
    sa: 'राहुः तृतीये भावे',
  },
  'yogasDb.ra_in_3.effect': {
    en: 'Courageous initiative, risk-taking, unconventional siblings.',
    hi: 'पराक्रमी पहल, जोखिम-वृत्ति, अनूठे भाई-बहन।',
    gu: 'પરાક્રમી પહેલ, જોખમ-વૃત્તિ, અસામાન્ય ભાઈ-બહેન.',
    sa: 'पराक्रमि-उद्यमः, साहसिकत्वम्, असामान्याः सहजाः।',
  },
  'yogasDb.ke_in_12.name': {
    en: 'Ketu in 12th',
    hi: 'केतु 12वें भाव में',
    gu: 'કેતુ 12મા ભાવમાં',
    sa: 'केतुः द्वादशे भावे',
  },
  'yogasDb.ke_in_12.effect': {
    en: 'Mystical inclination, foreign life, moksha potential.',
    hi: 'आध्यात्मिक प्रवृत्ति, विदेश-वास, मोक्ष-सम्भावना।',
    gu: 'આધ્યાત્મિક વૃત્તિ, વિદેશવાસ, મોક્ષ-સંભાવના.',
    sa: 'आध्यात्मिकवृत्तिः, परदेशवासः, मोक्षयोगः।',
  },

  // ─ Planet-aspects-planet ─
  'yogasDb.ju_aspects_mo.name': {
    en: 'Jupiter aspects Moon',
    hi: 'गुरु की दृष्टि चन्द्र पर',
    gu: 'ગુરુની દૃષ્ટિ ચંદ્ર પર',
    sa: 'गुरोः दृष्टिः चन्द्रे',
  },
  'yogasDb.ju_aspects_mo.effect': {
    en: 'Benevolent mother, emotional wisdom, protective upbringing.',
    hi: 'दयालु माता, भावनात्मक प्रज्ञा, रक्षक पालन-पोषण।',
    gu: 'દયાળુ માતા, ભાવનાત્મક પ્રજ્ઞા, રક્ષાત્મક ઉછેર.',
    sa: 'सदया माता, भावनाप्रज्ञा, रक्षणात्मकं पालनम्।',
  },
  'yogasDb.sa_aspects_su.name': {
    en: 'Saturn aspects Sun',
    hi: 'शनि की दृष्टि सूर्य पर',
    gu: 'શનિની દૃષ્ટિ સૂર્ય પર',
    sa: 'शनेः दृष्टिः सूर्ये',
  },
  'yogasDb.sa_aspects_su.effect': {
    en: 'Ego humbled by responsibility; father-issues or delayed recognition.',
    hi: 'उत्तरदायित्व से अहंकार विनम्र; पिता-सम्बन्धी विषय अथवा विलम्बित प्रतिष्ठा।',
    gu: 'જવાબદારીથી અહંકાર નમ્ર; પિતા-સંબંધી મુદ્દા કે વિલંબિત માન્યતા.',
    sa: 'उत्तरदायित्वेन अहङ्कारः नम्रः; पितृसम्बन्धिनः समस्याः विलम्बिता वा कीर्तिः।',
  },
  'yogasDb.ma_aspects_ju.name': {
    en: 'Mars aspects Jupiter',
    hi: 'मंगल की दृष्टि गुरु पर',
    gu: 'મંગળની દૃષ્ટિ ગુરુ પર',
    sa: 'मङ्गलस्य दृष्टिः गुरौ',
  },
  'yogasDb.ma_aspects_ju.effect': {
    en: 'Courage in the service of wisdom; warrior-teacher archetype.',
    hi: 'ज्ञान की सेवा में पराक्रम; योद्धा-गुरु आदर्श।',
    gu: 'જ્ઞાનની સેવામાં પરાક્રમ; યોદ્ધા-ગુરુ આદર્શ.',
    sa: 'ज्ञानसेवायां पराक्रमः; योद्धा-गुरु-आदर्शः।',
  },

  // ─ PDF: shared labels (used across kundali / matching / varsha / muhurat) ─
  'pdf.common.generated':    { en: 'Generated',         hi: 'निर्मित',          gu: 'નિર્મિત',         sa: 'निर्मितम्' },
  'pdf.common.ayanamsa':     { en: 'Ayanamsa',          hi: 'अयनांश',           gu: 'અયનાંશ',         sa: 'अयनांशः' },
  'pdf.common.utc':          { en: 'UTC',               hi: 'यू.टी.सी.',        gu: 'યુ.ટી.સી.',      sa: 'यू.टी.सी.' },
  'pdf.common.julianDay':    { en: 'Julian Day',        hi: 'जूलियन दिवस',      gu: 'જુલિયન દિવસ',    sa: 'जूलियन-दिवसः' },
  'pdf.common.place':        { en: 'Place',             hi: 'स्थान',           gu: 'સ્થાન',          sa: 'स्थानम्' },
  'pdf.common.subject':      { en: 'Subject',           hi: 'जातक',            gu: 'જાતક',          sa: 'जातकः' },
  'pdf.common.lat':          { en: 'Latitude',          hi: 'अक्षांश',          gu: 'અક્ષાંશ',        sa: 'अक्षांशः' },
  'pdf.common.lng':          { en: 'Longitude',         hi: 'देशांतर',          gu: 'રેખાંશ',         sa: 'रेखांशः' },
  'pdf.common.from':         { en: 'From',              hi: 'से',              gu: 'થી',             sa: 'तः' },
  'pdf.common.to':           { en: 'To',                hi: 'तक',              gu: 'સુધી',           sa: 'पर्यन्तम्' },
  'pdf.common.years':        { en: 'Years',             hi: 'वर्ष',             gu: 'વર્ષ',           sa: 'वर्षाणि' },
  'pdf.common.start':        { en: 'Start',             hi: 'आरम्भ',           gu: 'આરંભ',          sa: 'आरम्भः' },
  'pdf.common.end':          { en: 'End',               hi: 'समाप्ति',          gu: 'સમાપ્તિ',        sa: 'समाप्तिः' },
  'pdf.common.house':        { en: 'House',             hi: 'भाव',             gu: 'ભાવ',           sa: 'भावः' },
  'pdf.common.lord':         { en: 'Lord',              hi: 'स्वामी',           gu: 'સ્વામી',         sa: 'स्वामी' },
  'pdf.common.rashi':        { en: 'Rashi',             hi: 'राशि',            gu: 'રાશિ',          sa: 'राशिः' },
  'pdf.common.nakshatra':    { en: 'Nakshatra',         hi: 'नक्षत्र',          gu: 'નક્ષત્ર',        sa: 'नक्षत्रम्' },
  'pdf.common.longitude':    { en: 'Longitude',         hi: 'स्फुट',            gu: 'સ્ફુટ',          sa: 'स्फुटम्' },
  'pdf.common.flags':        { en: 'Flags',             hi: 'विशेष',           gu: 'વિશેષ',         sa: 'विशेषम्' },
  'pdf.common.dignity':      { en: 'Dignity',           hi: 'अवस्था',           gu: 'અવસ્થા',         sa: 'अवस्था' },
  'pdf.common.deg':          { en: 'Deg',               hi: 'अंश',             gu: 'અંશ',           sa: 'अंशः' },
  'pdf.common.score':        { en: 'Score',             hi: 'अंक',             gu: 'ગુણાંક',         sa: 'अङ्कः' },
  'pdf.common.note':         { en: 'Note',              hi: 'टिप्पणी',          gu: 'નોંધ',          sa: 'टिप्पणी' },
  'pdf.common.day':          { en: 'Day',               hi: 'दिन',             gu: 'દિવસ',          sa: 'दिनम्' },
  'pdf.common.month':        { en: 'Month',             hi: 'मास',             gu: 'માસ',           sa: 'मासः' },
  'pdf.common.notPresent':   { en: 'Not present',       hi: 'अनुपस्थित',         gu: 'અનુપસ્થિત',      sa: 'अनुपस्थितः' },
  'pdf.common.present':      { en: 'Present',           hi: 'उपस्थित',          gu: 'ઉપસ્થિત',        sa: 'उपस्थितः' },
  'pdf.common.notActive':    { en: 'Not active',        hi: 'सक्रिय नहीं',       gu: 'સક્રિય નથી',     sa: 'न सक्रियः' },
  'pdf.common.notable':      { en: 'Notable',           hi: 'उल्लेखनीय',        gu: 'ઉલ્લેખનીય',      sa: 'उल्लेखनीयम्' },
  'pdf.common.contactPhone': { en: 'Phone',             hi: 'दूरभाष',           gu: 'દૂરધ્વનિ',       sa: 'दूरभाषः' },
  'pdf.common.contactEmail': { en: 'Email',             hi: 'ईमेल',            gu: 'ઇમેલ',          sa: 'विद्युत्पत्रम्' },
  'pdf.common.contactWeb':   { en: 'Website',           hi: 'जालस्थल',          gu: 'વેબસાઇટ',        sa: 'जालस्थलम्' },

  // ─ PDF: kundali report ────────────────────────────────────────────────────
  'pdf.kundali.title':              { en: 'Vedic Kundali Report',     hi: 'वैदिक कुण्डली प्रतिवेदन',     gu: 'વૈદિક કુંડળી પ્રતિવેદન',     sa: 'वैदिककुण्डलीप्रतिवेदनम्' },
  'pdf.kundali.birthDetails':       { en: 'Birth Details',            hi: 'जन्म विवरण',                gu: 'જન્મ વિગતો',               sa: 'जन्मविवरणम्' },
  'pdf.kundali.dateTimeUtc':        { en: 'Date / Time (UTC)',        hi: 'तिथि / समय (UTC)',           gu: 'તારીખ / સમય (UTC)',         sa: 'तिथिः / समयः (UTC)' },
  'pdf.kundali.ascendant':          { en: 'Ascendant (Lagna)',        hi: 'लग्न',                      gu: 'લગ્ન',                     sa: 'लग्नम्' },
  'pdf.kundali.rasiChart':          { en: 'Rashi Chart (D-1)',        hi: 'राशि चक्र (D-1)',            gu: 'રાશિ ચક્ર (D-1)',           sa: 'राशिचक्रम् (D-1)' },
  'pdf.kundali.houses':             { en: 'Houses',                   hi: 'भाव',                       gu: 'ભાવો',                     sa: 'भावाः' },
  'pdf.kundali.planetaryPositions': { en: 'Planetary Positions',      hi: 'ग्रह स्थिति',                gu: 'ગ્રહ સ્થિતિ',                sa: 'ग्रहस्थितिः' },
  'pdf.kundali.graha':              { en: 'Graha',                    hi: 'ग्रह',                      gu: 'ગ્રહ',                     sa: 'ग्रहः' },
  'pdf.kundali.yogas':              { en: 'Yogas',                    hi: 'योग',                       gu: 'યોગ',                      sa: 'योगाः' },
  'pdf.kundali.noYogas':            { en: 'No major classical yogas detected.', hi: 'कोई प्रमुख शास्त्रीय योग नहीं मिला।', gu: 'કોઈ મુખ્ય શાસ્ત્રીય યોગ મળ્યો નથી.', sa: 'न कोऽपि मुख्यः शास्त्रीयो योगः प्राप्तः।' },
  'pdf.kundali.involves':           { en: 'involves',                 hi: 'सम्मिलित',                   gu: 'સામેલ',                   sa: 'सम्मिलिताः' },
  'pdf.kundali.doshas':             { en: 'Doshas',                   hi: 'दोष',                        gu: 'દોષ',                      sa: 'दोषाः' },
  'pdf.kundali.mangal':             { en: 'Mangal Dosha',             hi: 'मंगल दोष',                   gu: 'મંગળ દોષ',                  sa: 'मङ्गलदोषः' },
  'pdf.kundali.kaalSarpa':          { en: 'Kaal Sarpa',               hi: 'कालसर्प',                    gu: 'કાલસર્પ',                   sa: 'कालसर्पः' },
  'pdf.kundali.sadeSati':           { en: 'Sade Sati',                hi: 'साढ़ेसाती',                   gu: 'સાડેસાતી',                  sa: 'साढेसाती' },
  'pdf.kundali.fromLagna':          { en: 'From Lagna',               hi: 'लग्न से',                    gu: 'લગ્નથી',                    sa: 'लग्नात्' },
  'pdf.kundali.fromMoon':           { en: 'Moon',                     hi: 'चन्द्र',                      gu: 'ચંદ્ર',                     sa: 'चन्द्रः' },
  'pdf.kundali.fromVenus':          { en: 'Venus',                    hi: 'शुक्र',                      gu: 'શુક્ર',                    sa: 'शुक्रः' },
  'pdf.kundali.cancelled':          { en: 'Cancelled',                hi: 'निरस्त',                     gu: 'રદ',                       sa: 'निरस्तः' },
  'pdf.kundali.shadbalaTitle':      { en: 'Shadbala (Planetary Strength)', hi: 'षड्बल (ग्रह बल)',         gu: 'ષડ્બલ (ગ્રહ બળ)',           sa: 'षड्बलम् (ग्रहबलम्)' },
  'pdf.kundali.sthana':             { en: 'Sthana',                   hi: 'स्थान',                      gu: 'સ્થાન',                     sa: 'स्थानम्' },
  'pdf.kundali.dig':                { en: 'Dig',                      hi: 'दिक्',                       gu: 'દિક્',                      sa: 'दिक्' },
  'pdf.kundali.kala':               { en: 'Kala',                     hi: 'काल',                       gu: 'કાળ',                      sa: 'कालः' },
  'pdf.kundali.cheshta':            { en: 'Cheshta',                  hi: 'चेष्टा',                      gu: 'ચેષ્ટા',                    sa: 'चेष्टा' },
  'pdf.kundali.naisargika':         { en: 'Naisargika',               hi: 'नैसर्गिक',                    gu: 'નૈસર્ગિક',                  sa: 'नैसर्गिकम्' },
  'pdf.kundali.drik':               { en: 'Drik',                     hi: 'दृक्',                       gu: 'દૃક્',                      sa: 'दृक्' },
  'pdf.kundali.rupas':              { en: 'Rupas',                    hi: 'रूप',                        gu: 'રૂપ',                      sa: 'रूपाणि' },
  'pdf.kundali.category':           { en: 'Category',                 hi: 'श्रेणी',                     gu: 'શ્રેણી',                    sa: 'वर्गः' },
  'pdf.kundali.strongest':          { en: 'Strongest',                hi: 'सर्वबलवान्',                  gu: 'સૌથી બળવાન',                sa: 'सर्वाधिकबलवान्' },
  'pdf.kundali.weakest':            { en: 'Weakest',                  hi: 'सर्वदुर्बल',                   gu: 'સૌથી નબળું',                sa: 'सर्वाधिकदुर्बलः' },
  'pdf.kundali.vimshottariTitle':   { en: 'Vimshottari Mahadasha Sequence', hi: 'विंशोत्तरी महादशा क्रम', gu: 'વિંશોત્તરી મહાદશા ક્રમ',  sa: 'विंशोत्तरीमहादशाक्रमः' },

  // ─ PDF: shadbala category strings ─────────────────────────────────────────
  'pdf.shadbala.category.veryStrong':{ en: 'Very Strong',  hi: 'अत्यन्त बलवान्', gu: 'અત્યંત બળવાન', sa: 'अत्यन्तबलवान्' },
  'pdf.shadbala.category.strong':    { en: 'Strong',       hi: 'बलवान्',         gu: 'બળવાન',       sa: 'बलवान्' },
  'pdf.shadbala.category.moderate':  { en: 'Moderate',     hi: 'मध्यम',          gu: 'મધ્યમ',       sa: 'मध्यमः' },
  'pdf.shadbala.category.weak':      { en: 'Weak',         hi: 'दुर्बल',          gu: 'નબળું',       sa: 'दुर्बलः' },

  // ─ PDF: matching report ───────────────────────────────────────────────────
  'pdf.matching.title':             { en: 'Ashtakoot Matching Report', hi: 'अष्टकूट मिलान प्रतिवेदन',     gu: 'અષ્ટકૂટ મિલન પ્રતિવેદન',    sa: 'अष्टकूटमेलनप्रतिवेदनम्' },
  'pdf.matching.boy':               { en: 'Boy',                       hi: 'वर',                       gu: 'વર',                      sa: 'वरः' },
  'pdf.matching.girl':              { en: 'Girl',                      hi: 'वधू',                      gu: 'કન્યા',                    sa: 'कन्या' },
  'pdf.matching.partnerProfiles':   { en: 'Birth profiles',            hi: 'जन्म प्रोफाइल',             gu: 'જન્મ પ્રોફાઇલ',             sa: 'जन्मविवरणे' },
  'pdf.matching.verdict':           { en: 'Verdict',                   hi: 'निष्कर्ष',                   gu: 'નિર્ણય',                   sa: 'निष्कर्षः' },
  'pdf.matching.kootBreakdown':     { en: 'Koot-by-koot score',        hi: 'कूट-वार अंक',                gu: 'કૂટ-વાર ગુણ',                sa: 'कूटशः अङ्काः' },
  'pdf.matching.koot':              { en: 'Koot',                      hi: 'कूट',                       gu: 'કૂટ',                      sa: 'कूटः' },
  'pdf.matching.score':             { en: 'Score',                     hi: 'अंक',                       gu: 'ગુણ',                      sa: 'अङ्कः' },
  'pdf.matching.detail':            { en: 'Detail',                    hi: 'विवरण',                     gu: 'વિગત',                    sa: 'विवरणम्' },
  'pdf.matching.description':       { en: 'What each koot means',      hi: 'प्रत्येक कूट का अर्थ',        gu: 'દરેક કૂટનો અર્થ',           sa: 'प्रत्येककूटस्य अर्थः' },
  'pdf.matching.total':             { en: 'Total',                     hi: 'कुल',                       gu: 'કુલ',                     sa: 'योगः' },
  'pdf.matching.compatibility':     { en: '{pct}% compatibility',      hi: '{pct}% अनुकूलता',            gu: '{pct}% અનુકૂળતા',           sa: '{pct}% अनुकूलता' },
  'pdf.matching.manglikAnalysis':   { en: 'Manglik (Mars) analysis',   hi: 'मांगलिक (मंगल) विश्लेषण',    gu: 'મંગળિક (મંગળ) વિશ્લેષણ',    sa: 'मङ्गलिक- (मङ्गल-) विश्लेषणम्' },
  'pdf.matching.cancellations':     { en: 'Cancellations',             hi: 'निरसन',                     gu: 'રદ',                       sa: 'निरसनम्' },
  'pdf.matching.nadiBhakoot':       { en: 'Nadi · Bhakoot — cancellations', hi: 'नाड़ी · भकूट — निरसन',  gu: 'નાડી · ભકૂટ — રદ',        sa: 'नाडी · भकूट — निरसनम्' },
  'pdf.matching.additionalChecks':  { en: 'Additional checks',         hi: 'अतिरिक्त परीक्षण',           gu: 'વધારાની ચકાસણી',          sa: 'अतिरिक्तपरीक्षणम्' },
  'pdf.matching.recommendations':   { en: 'Recommendations',           hi: 'अनुशंसाएँ',                 gu: 'ભલામણો',                  sa: 'अनुशंसा' },
  'pdf.matching.absent':            { en: 'Absent',                    hi: 'अनुपस्थित',                 gu: 'ગેરહાજર',                  sa: 'अनुपस्थितः' },
  'pdf.matching.check':             { en: 'Check',                     hi: 'परीक्षण',                   gu: 'ચકાસણી',                  sa: 'परीक्षणम्' },
  'pdf.matching.result':            { en: 'Result',                    hi: 'परिणाम',                    gu: 'પરિણામ',                  sa: 'परिणामः' },
  'pdf.matching.ascendant':         { en: 'Ascendant',                 hi: 'लग्न',                      gu: 'લગ્ન',                     sa: 'लग्नम्' },
  'pdf.matching.moonRashi':         { en: 'Moon rashi',                hi: 'चन्द्र राशि',                gu: 'ચંદ્ર રાશિ',                sa: 'चन्द्रराशिः' },
  'pdf.matching.moonNakshatra':     { en: 'Moon nakshatra',            hi: 'चन्द्र नक्षत्र',              gu: 'ચંદ્ર નક્ષત્ર',              sa: 'चन्द्रनक्षत्रम्' },
  'pdf.matching.varna':             { en: 'Varna',                     hi: 'वर्ण',                      gu: 'વર્ણ',                     sa: 'वर्णः' },
  'pdf.matching.vashya':            { en: 'Vashya',                    hi: 'वश्य',                      gu: 'વશ્ય',                     sa: 'वश्यः' },
  'pdf.matching.yoni':              { en: 'Yoni',                      hi: 'योनि',                      gu: 'યોનિ',                    sa: 'योनिः' },
  'pdf.matching.gana':              { en: 'Gana',                      hi: 'गण',                        gu: 'ગણ',                      sa: 'गणः' },
  'pdf.matching.nadi':              { en: 'Nadi',                      hi: 'नाड़ी',                       gu: 'નાડી',                    sa: 'नाडी' },
  'pdf.matching.marsHouse':         { en: 'Mars house',                hi: 'मंगल भाव',                   gu: 'મંગળ ભાવ',                  sa: 'मङ्गलभावः' },
  'pdf.matching.currentDasha':      { en: 'Current mahadasha',         hi: 'वर्तमान महादशा',             gu: 'વર્તમાન મહાદશા',            sa: 'सम्प्रति महादशा' },
  'pdf.matching.activeMangal':      { en: 'Active Mangal dosha',       hi: 'सक्रिय मंगल दोष',            gu: 'સક્રિય મંગળ દોષ',           sa: 'सक्रियो मङ्गलदोषः' },
  'pdf.matching.doshaCancelled':    { en: 'Dosha cancelled',           hi: 'दोष निरस्त',                 gu: 'દોષ રદ',                   sa: 'दोषः निरस्तः' },
  'pdf.matching.noDosha':           { en: 'No dosha',                  hi: 'कोई दोष नहीं',                gu: 'કોઈ દોષ નથી',              sa: 'न दोषः' },
  'pdf.matching.marsInHouse':       { en: 'Mars in {house}th ({rashi})', hi: 'मंगल {house}वें भाव में ({rashi})', gu: 'મંગળ {house}માં ભાવ ({rashi})', sa: 'मङ्गलः {house}-भावे ({rashi})' },
  'pdf.matching.nadiDoshaTitle':    { en: 'Nadi Dosha',                hi: 'नाड़ी दोष',                  gu: 'નાડી દોષ',                 sa: 'नाडीदोषः' },
  'pdf.matching.bhakootDoshaTitle': { en: 'Bhakoot Dosha',             hi: 'भकूट दोष',                   gu: 'ભકૂટ દોષ',                  sa: 'भकूटदोषः' },
  'pdf.matching.statusActive':      { en: 'Active — caution',          hi: 'सक्रिय — सावधानी',           gu: 'સક્રિય — સાવચેતી',         sa: 'सक्रियः — सावधानम्' },
  'pdf.matching.statusCancelled':   { en: 'Present but cancelled',     hi: 'विद्यमान किन्तु निरस्त',      gu: 'હાજર પણ રદ',               sa: 'विद्यमानः किन्तु निरस्तः' },
  'pdf.matching.boyMangal':         { en: '{name} — Manglik',          hi: '{name} — मांगलिक',           gu: '{name} — મંગળિક',          sa: '{name} — मङ्गलिकः' },
  'pdf.matching.girlMangal':        { en: '{name} — Manglik',          hi: '{name} — मांगलिक',           gu: '{name} — મંગળિક',          sa: '{name} — मङ्गलिका' },
  'pdf.matching.yes':               { en: 'Yes',                       hi: 'हाँ',                        gu: 'હા',                       sa: 'अस्ति' },
  'pdf.matching.no':                { en: 'No',                        hi: 'नहीं',                       gu: 'ના',                       sa: 'नास्ति' },

  // ─ PDF: varshaphala report ────────────────────────────────────────────────
  'pdf.varsha.title':            { en: 'Varshphal Book',          hi: 'वर्षफल पुस्तिका',          gu: 'વર્ષફળ પુસ્તિકા',          sa: 'वर्षफलपुस्तिका' },
  'pdf.varsha.summary':          { en: 'Solar Return',            hi: 'सौर प्रत्यागमन',           gu: 'સૌર પ્રત્યાગમન',           sa: 'सूर्यप्रत्यागमनम्' },
  'pdf.varsha.varshaUtc':        { en: 'Varsha Pravesh (UTC)',    hi: 'वर्ष-प्रवेश (UTC)',         gu: 'વર્ષ-પ્રવેશ (UTC)',         sa: 'वर्षप्रवेशः (UTC)' },
  'pdf.varsha.varshaLagna':      { en: 'Varsha Lagna',            hi: 'वर्ष लग्न',                gu: 'વર્ષ લગ્ન',                sa: 'वर्षलग्नम्' },
  'pdf.varsha.muntha':           { en: 'Muntha',                  hi: 'मुन्था',                   gu: 'મુન્થા',                    sa: 'मुन्था' },
  'pdf.varsha.varshesha':        { en: 'Varshesha (year lord)',   hi: 'वर्षेश (वर्ष-स्वामी)',       gu: 'વર્ષેશ (વર્ષ-સ્વામી)',       sa: 'वर्षेशः (वर्षनाथः)' },
  'pdf.varsha.yogi':             { en: 'Yogi point',              hi: 'योगी बिन्दु',              gu: 'યોગી બિંદુ',                sa: 'योगिबिन्दुः' },
  'pdf.varsha.avayogi':          { en: 'Avayogi',                 hi: 'अवयोगी',                   gu: 'અવયોગી',                   sa: 'अवयोगी' },
  'pdf.varsha.duplicateYogi':    { en: 'Duplicate Yogi',          hi: 'द्विरुक्त योगी',            gu: 'દ્વિરુક્ત યોગી',            sa: 'द्विरुक्तयोगी' },
  'pdf.varsha.sahams':           { en: 'Tajika Sahams (selected)', hi: 'ताजिक सहम (चयनित)',      gu: 'તાજિક સહમ (પસંદ)',         sa: 'ताजिकसहमानि (चयनितानि)' },
  'pdf.varsha.muddaDasha':       { en: 'Mudda Dasha (annual Vimshottari)', hi: 'मुद्दा दशा (वार्षिक विंशोत्तरी)', gu: 'મુદ્દા દશા (વાર્ષિક વિંશોત્તરી)', sa: 'मुद्दादशा (वार्षिकविंशोत्तरी)' },
  'pdf.varsha.tripatakiChakra':  { en: 'Tripataki Chakra',        hi: 'त्रिपताकी चक्र',           gu: 'ત્રિપતાકી ચક્ર',           sa: 'त्रिपताकीचक्रम्' },
  'pdf.varsha.lord':             { en: 'Lord',                    hi: 'स्वामी',                   gu: 'સ્વામી',                   sa: 'स्वामी' },
  'pdf.varsha.balance':          { en: 'Balance',                 hi: 'शेष',                      gu: 'શેષ',                      sa: 'शेषम्' },
  'pdf.varsha.starting':         { en: 'Starting',                hi: 'आरम्भ',                    gu: 'આરંભ',                    sa: 'आरम्भः' },
  'pdf.varsha.natalMoment':      { en: 'Natal moment',            hi: 'जन्म क्षण',                gu: 'જન્મ ક્ષણ',                sa: 'जन्मक्षणः' },
  'pdf.varsha.yearRulers':       { en: 'Year rulers',             hi: 'वर्ष-स्वामी',               gu: 'વર્ષ-સ્વામી',               sa: 'वर्षनाथाः' },
  'pdf.varsha.varshaChartTitle': { en: 'Varsha Chart (D-1 of the year)', hi: 'वर्ष कुण्डली (वर्ष की D-1)', gu: 'વર્ષ કુંડળી (વર્ષની D-1)',  sa: 'वर्षकुण्डली (वर्षस्य D-1)' },
  'pdf.varsha.planetaryPositions':{ en: 'Planetary Positions (Varsha chart)', hi: 'ग्रह स्थिति (वर्ष कुण्डली)', gu: 'ગ્રહ સ્થિતિ (વર્ષ કુંડળી)', sa: 'ग्रहस्थितिः (वर्षकुण्डली)' },
  'pdf.varsha.tajikaYogas':      { en: 'Tajika Yogas',            hi: 'ताजिक योग',                gu: 'તાજિક યોગ',                sa: 'ताजिकयोगाः' },
  'pdf.varsha.noTajikaYogas':    { en: 'No active Tajika yogas in this solar return.', hi: 'इस सौर प्रत्यागमन में कोई सक्रिय ताजिक योग नहीं।', gu: 'આ સૌર પ્રત્યાગમનમાં કોઈ સક્રિય તાજિક યોગ નથી.', sa: 'अस्मिन् सूर्यप्रत्यागमे न कोऽपि सक्रियः ताजिकयोगः।' },
  'pdf.varsha.masaPhala':        { en: 'Masa-Phala (monthly timeline)', hi: 'मास-फल (मासिक समयरेखा)', gu: 'માસ-ફળ (માસિક સમયરેખા)',  sa: 'मासफलम् (मासिककालरेखा)' },
  'pdf.varsha.munthaSign':       { en: 'Muntha sign',             hi: 'मुन्था राशि',               gu: 'મુન્થા રાશિ',               sa: 'मुन्थाराशिः' },
  'pdf.varsha.moonSign':         { en: 'Moon sign',               hi: 'चन्द्र राशि',               gu: 'ચંદ્ર રાશિ',                sa: 'चन्द्रराशिः' },
  'pdf.varsha.days':             { en: 'Days',                    hi: 'दिवस',                     gu: 'દિવસ',                    sa: 'दिनानि' },
  'pdf.varsha.ageHeading':       { en: 'Age {age}',               hi: 'आयु {age}',                gu: 'ઉંમર {age}',               sa: 'वयः {age}' },

  // ─ PDF: muhurat report ────────────────────────────────────────────────────
  'pdf.muhurat.title':         { en: 'Muhurta Book',           hi: 'मुहूर्त पुस्तिका',           gu: 'મુહૂર્ત પુસ્તિકા',           sa: 'मुहूर्तपुस्तिका' },
  'pdf.muhurat.event':         { en: 'Event',                  hi: 'कार्य',                    gu: 'કાર્ય',                     sa: 'कार्यम्' },
  'pdf.muhurat.dateRange':     { en: 'Date range',             hi: 'तिथि-अवधि',                gu: 'તારીખ-અવધિ',               sa: 'तिथि-अवधिः' },
  'pdf.muhurat.location':      { en: 'Location',               hi: 'स्थान',                    gu: 'સ્થાન',                     sa: 'स्थानम्' },
  'pdf.muhurat.windows':       { en: 'Top {n} Windows',        hi: 'सर्वोत्तम {n} अवधियाँ',     gu: 'ટોચની {n} અવધિઓ',          sa: 'सर्वोत्तमाः {n} अवधयः' },
  'pdf.muhurat.window':        { en: 'Window',                 hi: 'अवधि',                     gu: 'અવધિ',                     sa: 'अवधिः' },
  'pdf.muhurat.score':         { en: 'Score',                  hi: 'अंक',                      gu: 'ગુણાંક',                    sa: 'अङ्कः' },
  'pdf.muhurat.tithi':         { en: 'Tithi',                  hi: 'तिथि',                      gu: 'તિથિ',                     sa: 'तिथिः' },
  'pdf.muhurat.nakshatra':     { en: 'Nakshatra',              hi: 'नक्षत्र',                   gu: 'નક્ષત્ર',                   sa: 'नक्षत्रम्' },
  'pdf.muhurat.yoga':          { en: 'Yoga',                   hi: 'योग',                      gu: 'યોગ',                      sa: 'योगः' },
  'pdf.muhurat.vara':          { en: 'Vara',                   hi: 'वार',                       gu: 'વાર',                      sa: 'वासरः' },
  'pdf.muhurat.reasons':       { en: 'Reasons',                hi: 'कारण',                      gu: 'કારણો',                    sa: 'कारणानि' },
  'pdf.muhurat.warnings':      { en: 'Caution',                hi: 'सावधानी',                  gu: 'સાવચેતી',                  sa: 'सावधानम्' },
  'pdf.muhurat.evaluatedDays': { en: 'Candidates evaluated',   hi: 'मूल्यांकित विकल्प',         gu: 'મૂલ્યાંકિત વિકલ્પ',         sa: 'मूल्याङ्किताः विकल्पाः' },
  'pdf.muhurat.windowsFound':  { en: 'Auspicious windows found', hi: 'शुभ अवधियाँ प्राप्त',     gu: 'શુભ અવધિઓ મળી',           sa: 'शुभावधयः प्राप्ताः' },
  'pdf.muhurat.noWindows':     { en: 'No auspicious windows found within the requested range. Try widening the date range or choosing a different event.', hi: 'अनुरोधित अवधि में कोई शुभ अवधि नहीं मिली। तिथि-अवधि बढ़ाएँ अथवा अन्य कार्य चुनें।', gu: 'વિનંતી કરેલ અવધિમાં કોઈ શુભ અવધિ મળી નથી. તારીખ-અવધિ વધારો અથવા અન્ય કાર્ય પસંદ કરો.', sa: 'याचितायां अवधौ न शुभावधयः प्राप्ताः। तिथि-अवधिं वर्धयतु अथवा अन्यत् कार्यं चिनुयात्।' },
  'pdf.muhurat.panchangAt':    { en: 'Panchang at this window', hi: 'इस अवधि का पंचांग',        gu: 'આ અવધિનું પંચાંગ',          sa: 'अस्याः अवधेः पञ्चाङ्गम्' },

  // ─ PDF: worksheet shell ──────────────────────────────────────────────────
  'pdf.worksheet.title':       { en: 'Worksheet',              hi: 'कार्यपत्र',                  gu: 'કાર્યપત્ર',                 sa: 'कार्यपत्रम्' },
  'pdf.worksheet.preparedFor': { en: 'Prepared for',           hi: 'के लिए निर्मित',             gu: 'માટે તૈયાર',                sa: 'कृते निर्मितम्' },
  'pdf.worksheet.section':     { en: 'Section',                hi: 'अनुभाग',                    gu: 'વિભાગ',                    sa: 'अनुभागः' },

  // ─ PDF: general section helpers (used in templates/sections.ts) ──────────
  'pdf.sections.heading.transitsAt': { en: 'Current Transits — {at}', hi: 'वर्तमान गोचर — {at}', gu: 'વર્તમાન ગોચર — {at}', sa: 'सम्प्रति गोचरः — {at}' },
  'pdf.sections.heading.varshaphala': { en: 'Varshaphala — Year {age}', hi: 'वर्षफल — आयु {age}', gu: 'વર્ષફળ — ઉંમર {age}', sa: 'वर्षफलम् — वयः {age}' },

  // ─ PDF: Interpretation sub-headings ──────────────────────────────────────
  'pdf.section.planetsInHouses':    { en: 'Planets in Houses',     hi: 'भावों में ग्रह',          gu: 'ભાવોમાં ગ્રહો',           sa: 'भावेषु ग्रहाः' },
  'pdf.section.planetsInSigns':     { en: 'Planets in Signs',      hi: 'राशियों में ग्रह',         gu: 'રાશિઓમાં ગ્રહો',          sa: 'राशिषु ग्रहाः' },
  'pdf.section.houseLordPlacements':{ en: 'House Lord Placements', hi: 'भावेशों की स्थिति',       gu: 'ભાવેશોની સ્થિતિ',         sa: 'भावेशानां स्थानानि' },

  // ─ PDF: Remedies section labels ──────────────────────────────────────────
  'pdf.kundali.beejMantra': { en: 'Beej Mantra', hi: 'बीज मंत्र', gu: 'બીજ મંત્ર', sa: 'बीजमन्त्रः' },
  'pdf.kundali.donations':  { en: 'Donations',  hi: 'दान',       gu: 'દાન',        sa: 'दानानि' },
  'pdf.kundali.ritual':     { en: 'Ritual',     hi: 'अनुष्ठान',  gu: 'અનુષ્ઠાન',  sa: 'अनुष्ठानम्' },
  'pdf.kundali.yantra':     { en: 'Yantra',     hi: 'यंत्र',     gu: 'યંત્ર',      sa: 'यन्त्रम्' },
  'pdf.kundali.fasting':    { en: 'Fasting',    hi: 'व्रत',     gu: 'ઉપવાસ',     sa: 'व्रतम्' },

  // ─ Remedies: dosha-specific entries ──────────────────────────────────────
  'remedies.dosha.mangal.title':   { en: 'Mangal Dosha',     hi: 'मंगल दोष',     gu: 'મંગળ દોષ',     sa: 'मङ्गलदोषः' },
  'remedies.dosha.mangal.summary': { en: 'Mars in 1/2/4/7/8/12 can stress marital harmony and property matters.', hi: 'मंगल का 1/2/4/7/8/12 भाव में होना वैवाहिक सामंजस्य और संपत्ति संबंधी मामलों पर दबाव डाल सकता है।', gu: 'મંગળનું 1/2/4/7/8/12માં હોવું વૈવાહિક સામંજસ્ય અને સંપત્તિ સંબંધી બાબતો પર દબાણ આપી શકે.', sa: 'मङ्गलः 1/2/4/7/8/12 भावे विवाहसौख्ये धनसम्पत्तौ च तनावं जनयति।' },
  'remedies.dosha.mangal.step.0':  { en: 'Chant Hanuman Chalisa daily, especially on Tuesdays', hi: 'प्रतिदिन हनुमान चालीसा का पाठ करें, विशेषकर मंगलवार को', gu: 'દરરોજ હનુમાન ચાલીસાનો પાઠ કરો, ખાસ કરીને મંગળવારે', sa: 'प्रतिदिनं हनुमच्चालीसां पठेत्, विशेषतः भौमवासरे' },
  'remedies.dosha.mangal.step.1':  { en: 'Offer red cloth and jaggery at a Hanuman or Kartikeya temple', hi: 'हनुमान या कार्तिकेय मंदिर में लाल वस्त्र और गुड़ चढ़ाएँ', gu: 'હનુમાન કે કાર્તિકેય મંદિરમાં લાલ વસ્ત્ર અને ગોળ ચઢાવો', sa: 'हनुमत्कार्तिकेयमन्दिरे रक्तवस्त्रं गुडं च समर्पयेत्' },
  'remedies.dosha.mangal.step.2':  { en: 'Fast on Tuesdays and avoid non-vegetarian food', hi: 'मंगलवार को व्रत रखें और मांसाहार त्यागें', gu: 'મંગળવારે ઉપવાસ રાખો અને માંસાહારથી દૂર રહો', sa: 'भौमवासरे उपवासं कुर्यात्, मांसाहारं वर्जयेत्' },
  'remedies.dosha.mangal.step.3':  { en: 'Recite Mangal Kavach or the Mangalashtakam', hi: 'मंगल कवच या मंगलाष्टकम् का पाठ करें', gu: 'મંગળ કવચ કે મંગળાષ્ટકમ્ પાઠ કરો', sa: 'मङ्गलकवचं मङ्गलाष्टकं वा पठेत्' },
  'remedies.dosha.mangal.step.4':  { en: 'For marriage compatibility, match with another Mangalik or perform Kumbh Vivah', hi: 'विवाह योग्यता हेतु अन्य मांगलिक से मेल अथवा कुम्भ विवाह कराएँ', gu: 'લગ્ન માટે અન્ય મંગળિક સાથે મેળાપ અથવા કુંભ વિવાહ કરો', sa: 'विवाहयोग्यतायै अपरमाङ्गलिकेन सह मेलनं कुम्भविवाहं वा कुर्यात्' },
  'remedies.dosha.mangal.mantra':  { en: 'Om Kram Kreem Kroum Sah Bhaumaya Namah', hi: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः', gu: 'ૐ ક્રાં ક્રીં ક્રૌં સઃ ભૌમાય નમઃ', sa: 'ॐ क्रां क्रीं क्रौं सः भौमाय नमः' },

  'remedies.dosha.kaalsarpa.title':   { en: 'Kaal Sarpa Dosha', hi: 'काल सर्प दोष', gu: 'કાળ સર્પ દોષ', sa: 'कालसर्पदोषः' },
  'remedies.dosha.kaalsarpa.summary': { en: 'All seven planets trapped between Rahu and Ketu — karmic delays and cyclical struggle.', hi: 'सातों ग्रह राहु–केतु के मध्य फँसे हुए — कर्मजन्य विलंब और चक्रीय संघर्ष।', gu: 'સાતેય ગ્રહો રાહુ–કેતુ વચ્ચે ફસાયેલા — કર્મજન્ય વિલંબ અને ચક્રીય સંઘર્ષ.', sa: 'सप्तग्रहाः राहुकेत्वोः मध्ये निरुद्धाः — कर्मजन्यविलम्बः चक्रीयसङ्घर्षश्च।' },
  'remedies.dosha.kaalsarpa.step.0':  { en: 'Perform Kaal Sarpa Shanti puja at Trimbakeshwar, Kalahasti, or Ujjain', hi: 'त्रयंबकेश्वर, कालहस्ती या उज्जैन में काल सर्प शांति पूजा करें', gu: 'ત્ર્યંબકેશ્વર, કાલહસ્તી કે ઉજ્જૈનમાં કાળ સર્પ શાંતિ પૂજા કરો', sa: 'त्र्यम्बकेश्वरे कालहस्तौ उज्जयिन्यां वा कालसर्पशान्तिपूजां कुर्यात्' },
  'remedies.dosha.kaalsarpa.step.1':  { en: 'Recite Mahamrityunjaya mantra 108 times daily', hi: 'प्रतिदिन महामृत्युंजय मंत्र का 108 बार जाप करें', gu: 'દરરોજ મહામૃત્યુંજય મંત્રનો 108 વખત જાપ કરો', sa: 'प्रतिदिनं अष्टोत्तरशतवारं महामृत्युञ्जयमन्त्रं जपेत्' },
  'remedies.dosha.kaalsarpa.step.2':  { en: 'Offer milk to Shiva Lingam on Mondays', hi: 'सोमवार को शिवलिंग पर दूध चढ़ाएँ', gu: 'સોમવારે શિવલિંગ પર દૂધ ચઢાવો', sa: 'सोमवासरे शिवलिङ्गे क्षीरं समर्पयेत्' },
  'remedies.dosha.kaalsarpa.step.3':  { en: 'Chant Rahu and Ketu beeja mantras together', hi: 'राहु और केतु बीज मंत्रों का एक साथ जाप करें', gu: 'રાહુ અને કેતુ બીજ મંત્રોનો સાથે જાપ કરો', sa: 'राहुकेतुबीजमन्त्रौ सह जपेत्' },
  'remedies.dosha.kaalsarpa.step.4':  { en: 'Feed snakes (symbolically, with milk offered at Shiva temples on Naag Panchami)', hi: 'सर्पों को (नाग पंचमी पर शिव मंदिरों में दूध अर्पित कर) प्रतीकात्मक भोग दें', gu: 'સર્પોને (નાગ પંચમીએ શિવ મંદિરોમાં દૂધ ધરી) પ્રતીકાત્મક ભોગ આપો', sa: 'नागपञ्चम्यां शिवालयेषु क्षीरं समर्प्य प्रतीकात्मकं नागेभ्यः अन्नं दद्यात्' },
  'remedies.dosha.kaalsarpa.mantra':  { en: 'Om Tryambakam Yajamahe Sugandhim Pushtivardhanam…', hi: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्…', gu: 'ૐ ત્ર્યમ્બકં યજામહે સુગંધિં પુષ્ટિવર્ધનમ્…', sa: 'ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्…' },

  'remedies.dosha.sadeSati.title':   { en: 'Sade Sati (Saturn 7½)', hi: 'साढ़े साती (शनि साढ़े सात)', gu: 'સાડે સાતી (શનિ સાડે સાત)', sa: 'साढ़ेसातीदोषः (सार्धसप्तवर्षः)' },
  'remedies.dosha.sadeSati.summary': { en: "Saturn transiting 12th/1st/2nd from natal Moon — 7½ years of introspective tests.", hi: 'शनि का जन्म चन्द्र से 12वें/1वें/2वें भाव में गोचर — साढ़े सात वर्ष की आत्मचिंतनात्मक परीक्षा।', gu: 'શનિનું જન્મ ચંદ્રથી 12મા/1લા/2જા ભાવમાં ગોચર — સાડે સાત વર્ષની આત્મમંથન પરીક્ષા.', sa: 'शनेः जन्मचन्द्रात् द्वादश/प्रथम/द्वितीयभावे गोचरः — सार्धसप्तवर्षाणि आत्मचिन्तनपरीक्षा।' },
  'remedies.dosha.sadeSati.step.0':  { en: 'Recite Hanuman Chalisa daily and visit Shani Dev temple on Saturdays', hi: 'प्रतिदिन हनुमान चालीसा पढ़ें और शनिवार को शनिदेव मंदिर जाएँ', gu: 'દરરોજ હનુમાન ચાલીસા વાંચો અને શનિવારે શનિદેવ મંદિર જાઓ', sa: 'प्रतिदिनं हनुमच्चालीसां पठेत्, शनिवासरे शनैश्चरमन्दिरं गच्छेत्' },
  'remedies.dosha.sadeSati.step.1':  { en: 'Light a mustard-oil lamp under a peepal tree on Saturdays', hi: 'शनिवार को पीपल वृक्ष के नीचे सरसों के तेल का दीपक जलाएँ', gu: 'શનિવારે પીપળાના વૃક્ષ નીચે સરસવના તેલનો દીપક પ્રગટાવો', sa: 'शनिवासरे अश्वत्थवृक्षाधः सर्षपतैलदीपं प्रज्वालयेत्' },
  'remedies.dosha.sadeSati.step.2':  { en: 'Donate black sesame, iron, or mustard oil to the needy', hi: 'जरूरतमंदों को काले तिल, लोहा या सरसों का तेल दान करें', gu: 'જરૂરિયાતમંદોને કાળા તલ, લોહું કે સરસવનું તેલ દાન કરો', sa: 'दीनेभ्यः कृष्णतिलं लोहं सर्षपतैलं वा दद्यात्' },
  'remedies.dosha.sadeSati.step.3':  { en: 'Recite Shani Stotra or Dasaratha-Shani-Stotra', hi: 'शनि स्तोत्र अथवा दशरथ शनि स्तोत्र का पाठ करें', gu: 'શનિ સ્તોત્ર કે દશરથ શનિ સ્તોત્ર પાઠ કરો', sa: 'शनिस्तोत्रं दशरथशनिस्तोत्रं वा पठेत्' },
  'remedies.dosha.sadeSati.step.4':  { en: 'Wear a Blue Sapphire only after trial; Amethyst is a safer alternative', hi: 'नीलम परीक्षण के पश्चात ही धारण करें; ऐमेथिस्ट सुरक्षित विकल्प है', gu: 'નીલમ પરીક્ષણ પછી જ ધારણ કરો; એમેથિસ્ટ સુરક્ષિત વિકલ્પ છે', sa: 'नीलमणिं परीक्षणानन्तरमेव धारयेत्; एमेथिस्तः सुरक्षितः विकल्पः' },
  'remedies.dosha.sadeSati.mantra':  { en: 'Om Neelanjana Samabhasam Raviputram Yamagrajam…', hi: 'ॐ नीलाञ्जन समाभासं रविपुत्रं यमाग्रजम्…', gu: 'ૐ નીલાંજન સમાભાસં રવિપુત્રં યમાગ્રજમ્…', sa: 'ॐ नीलाञ्जनसमाभासं रविपुत्रं यमाग्रजम्…' },

  // ─ Remedies: suggestion reasons ──────────────────────────────────────────
  'remedies.suggestion.lowShadbala':   { en: 'Shadbala is low ({rupa} rupas) — planet needs strengthening', hi: 'षड्बल कम है ({rupa} रूपक) — ग्रह सुदृढ़ीकरण आवश्यक', gu: 'ષડ્બલ ઓછું છે ({rupa} રૂપક) — ગ્રહને બળ આપવું જરૂરી', sa: 'षड्बलं न्यूनम् ({rupa} रूपकाः) — ग्रहस्य सुदृढीकरणं आवश्यकम्' },
  'remedies.suggestion.kashtaExceeds': { en: 'Kashta phala ({kashta}) exceeds Ishta — pacification recommended', hi: 'कष्ट फल ({kashta}) इष्ट से अधिक — शांति-कर्म अनुशंसित', gu: 'કષ્ટ ફળ ({kashta}) ઇષ્ટથી વધારે — શાંતિ-કર્મ ભલામણ કરેલ', sa: 'कष्टफलम् ({kashta}) इष्टम् अतिक्रमति — शान्तिकर्म प्रशस्तम्' },

  // ─ Remedies: general guidance ────────────────────────────────────────────
  'remedies.general.0': { en: 'Regular meditation and pranayama harmonise all grahic energies', hi: 'नियमित ध्यान और प्राणायाम सभी ग्रहीय ऊर्जाओं को सामंजस्य में लाते हैं', gu: 'નિયમિત ધ્યાન અને પ્રાણાયામ બધી ગ્રહીય ઊર્જાઓને સામંજસ્યમાં લાવે છે', sa: 'नियमितं ध्यानं प्राणायामः च सर्वग्रहोर्जाः सामञ्जस्ये नयतः' },
  'remedies.general.1': { en: 'Bathe before sunrise and offer water to the Sun', hi: 'सूर्योदय से पूर्व स्नान करें और सूर्य को अर्घ्य दें', gu: 'સૂર્યોદય પહેલાં સ્નાન કરો અને સૂર્યને અર્ઘ્ય આપો', sa: 'सूर्योदयात् पूर्वं स्नात्वा सूर्याय अर्घ्यं दद्यात्' },
  'remedies.general.2': { en: 'Feed animals, birds, or the hungry — classical karmic purifier', hi: 'पशु, पक्षी अथवा क्षुधार्तों को भोजन कराएँ — शास्त्रोक्त कर्म-शुद्धि', gu: 'પ્રાણીઓ, પક્ષીઓ કે ભૂખ્યાઓને ભોજન આપો — શાસ્ત્રોક્ત કર્મ-શુદ્ધિ', sa: 'पशुपक्षिणे क्षुधितेभ्यो वा अन्नं दद्यात् — शास्त्रोक्ता कर्मशुद्धिः' },
  'remedies.general.3': { en: 'Wear gemstones only after testing them for personal compatibility (never skip trial periods)', hi: 'रत्न केवल व्यक्तिगत अनुकूलता के परीक्षण के पश्चात धारण करें (परीक्षण-अवधि कभी न छोड़ें)', gu: 'રત્નો ફક્ત વ્યક્તિગત અનુકૂળતાના પરીક્ષણ પછી જ ધારણ કરો (પરીક્ષણ-અવધિ ક્યારેય ન છોડો)', sa: 'व्यक्तिगतानुकूलता-परीक्षणानन्तरमेव रत्नानि धारयेत्, परीक्षणकालं कदापि न त्यजेत्' },
  'remedies.general.4': { en: 'Japa counts listed are classical totals to complete over 40 days (mandala)', hi: 'दिए गए जाप संख्याएँ 40-दिवसीय मण्डल में पूरी करने योग्य शास्त्रोक्त कुल हैं', gu: 'દર્શાવેલ જાપ સંખ્યાઓ 40-દિવસીય મંડળમાં પૂર્ણ કરવા યોગ્ય શાસ્ત્રોક્ત કુલ છે', sa: 'प्रदर्शिताः जपसङ्ख्याः चत्वारिंशद्दिनमण्डले पूरयितुं शास्त्रोक्ताः समष्टयः' },

  // ─ Remedies: data-file rituals (per-graha) ───────────────────────────────
  'remedies.dataFile.ritual.SU': { en: 'Surya Namaskar at sunrise; offer water (Arghya) facing east.', hi: 'सूर्योदय पर सूर्य नमस्कार; पूर्व मुख होकर अर्घ्य दें।', gu: 'સૂર્યોદય સમયે સૂર્ય નમસ્કાર; પૂર્વાભિમુખ થઈ અર્ઘ્ય આપો.', sa: 'सूर्योदये सूर्यनमस्कारः; प्राङ्मुखः सन् अर्घ्यं दद्यात्।' },
  'remedies.dataFile.ritual.MO': { en: 'Worship Lord Shiva on Mondays; offer milk to Shivalinga.', hi: 'सोमवार को भगवान शिव की आराधना; शिवलिंग पर दूध अर्पित करें।', gu: 'સોમવારે ભગવાન શિવની આરાધના; શિવલિંગ પર દૂધ ચઢાવો.', sa: 'सोमवासरे शिवपूजनं; शिवलिङ्गे क्षीरं समर्पयेत्।' },
  'remedies.dataFile.ritual.MA': { en: 'Hanuman Chalisa on Tuesdays; visit Hanuman temple.', hi: 'मंगलवार को हनुमान चालीसा; हनुमान मंदिर के दर्शन करें।', gu: 'મંગળવારે હનુમાન ચાલીસા; હનુમાન મંદિરે દર્શન કરો.', sa: 'भौमवासरे हनुमच्चालीसा; हनुमन्मन्दिरदर्शनं कुर्यात्।' },
  'remedies.dataFile.ritual.ME': { en: 'Worship Lord Vishnu on Wednesdays.', hi: 'बुधवार को भगवान विष्णु की आराधना करें।', gu: 'બુધવારે ભગવાન વિષ્ણુની આરાધના કરો.', sa: 'बुधवासरे विष्णुपूजनं कुर्यात्।' },
  'remedies.dataFile.ritual.JU': { en: 'Worship of Brihaspati or Lord Vishnu on Thursdays.', hi: 'गुरुवार को बृहस्पति अथवा भगवान विष्णु की आराधना।', gu: 'ગુરુવારે બૃહસ્પતિ કે ભગવાન વિષ્ણુની આરાધના.', sa: 'गुरुवासरे बृहस्पतेः विष्णोः वा पूजनं कुर्यात्।' },
  'remedies.dataFile.ritual.VE': { en: 'Worship of Goddess Lakshmi on Fridays.', hi: 'शुक्रवार को देवी लक्ष्मी की आराधना।', gu: 'શુક્રવારે દેવી લક્ષ્મીની આરાધના.', sa: 'शुक्रवासरे लक्ष्मीदेव्याः पूजनं कुर्यात्।' },
  'remedies.dataFile.ritual.SA': { en: 'Hanuman Chalisa; light a mustard-oil lamp under a peepal tree on Saturdays.', hi: 'हनुमान चालीसा; शनिवार को पीपल वृक्ष के नीचे सरसों-तेल का दीपक जलाएँ।', gu: 'હનુમાન ચાલીસા; શનિવારે પીપળાના વૃક્ષ નીચે સરસવ-તેલનો દીપક પ્રગટાવો.', sa: 'हनुमच्चालीसा; शनिवासरे अश्वत्थाधः सर्षपतैलदीपं प्रज्वालयेत्।' },
  'remedies.dataFile.ritual.RA': { en: 'Recite Durga Saptashati; worship Goddess Durga.', hi: 'दुर्गा सप्तशती का पाठ करें; देवी दुर्गा की आराधना करें।', gu: 'દુર્ગા સપ્તશતીનો પાઠ કરો; દેવી દુર્ગાની આરાધના કરો.', sa: 'दुर्गासप्तशतीं पठेत्; दुर्गादेव्याः पूजनं कुर्यात्।' },
  'remedies.dataFile.ritual.KE': { en: 'Worship Lord Ganesha; recite Ganesha Atharvashirsha.', hi: 'भगवान गणेश की आराधना; गणेश अथर्वशीर्ष का पाठ करें।', gu: 'ભગવાન ગણેશની આરાધના; ગણેશ અથર્વશીર્ષ પાઠ કરો.', sa: 'गणेशपूजनं; गणपत्यथर्वशीर्षं पठेत्।' },

  // ─ Remedies: yantra names (per-graha) ────────────────────────────────────
  'remedies.dataFile.yantra.SU': { en: 'Surya Yantra',  hi: 'सूर्य यंत्र',  gu: 'સૂર્ય યંત્ર',  sa: 'सूर्ययन्त्रम्'  },
  'remedies.dataFile.yantra.MO': { en: 'Chandra Yantra',hi: 'चंद्र यंत्र',  gu: 'ચંદ્ર યંત્ર',   sa: 'चन्द्रयन्त्रम्' },
  'remedies.dataFile.yantra.MA': { en: 'Mangal Yantra', hi: 'मंगल यंत्र',   gu: 'મંગળ યંત્ર',   sa: 'मङ्गलयन्त्रम्'  },
  'remedies.dataFile.yantra.ME': { en: 'Budh Yantra',   hi: 'बुध यंत्र',    gu: 'બુધ યંત્ર',    sa: 'बुधयन्त्रम्'    },
  'remedies.dataFile.yantra.JU': { en: 'Guru Yantra',   hi: 'गुरु यंत्र',   gu: 'ગુરુ યંત્ર',   sa: 'गुरुयन्त्रम्'   },
  'remedies.dataFile.yantra.VE': { en: 'Shukra Yantra', hi: 'शुक्र यंत्र',  gu: 'શુક્ર યંત્ર',  sa: 'शुक्रयन्त्रम्'  },
  'remedies.dataFile.yantra.SA': { en: 'Shani Yantra',  hi: 'शनि यंत्र',    gu: 'શનિ યંત્ર',    sa: 'शनियन्त्रम्'    },
  'remedies.dataFile.yantra.RA': { en: 'Rahu Yantra',   hi: 'राहु यंत्र',   gu: 'રાહુ યંત્ર',   sa: 'राहुयन्त्रम्'   },
  'remedies.dataFile.yantra.KE': { en: 'Ketu Yantra',   hi: 'केतु यंत्र',   gu: 'કેતુ યંત્ર',   sa: 'केतुयन्त्रम्'   },

  // ─ Interpretation: house themes (12) ────────────────────────────────────
  'interpret.houseTheme.1':  { en: 'self, body, personality',                   hi: 'स्वयं, शरीर, व्यक्तित्व',                gu: 'સ્વયં, શરીર, વ્યક્તિત્વ',                sa: 'आत्मा, देहः, व्यक्तित्वम्' },
  'interpret.houseTheme.2':  { en: 'wealth, family, speech',                    hi: 'धन, परिवार, वाणी',                    gu: 'ધન, કુટુંબ, વાણી',                     sa: 'धनम्, कुटुम्बम्, वाक्' },
  'interpret.houseTheme.3':  { en: 'siblings, courage, communication',          hi: 'भाई-बहन, साहस, संवाद',                gu: 'ભાઈ-બહેન, સાહસ, સંવાદ',                sa: 'सहोदराः, साहसः, सम्भाषणम्' },
  'interpret.houseTheme.4':  { en: 'mother, home, vehicles',                    hi: 'माता, गृह, वाहन',                     gu: 'માતા, ઘર, વાહન',                       sa: 'माता, गृहम्, वाहनम्' },
  'interpret.houseTheme.5':  { en: 'children, intellect, romance',              hi: 'सन्तान, बुद्धि, प्रेम',                gu: 'સંતાન, બુદ્ધિ, પ્રેમ',                  sa: 'सन्ततिः, बुद्धिः, प्रेम' },
  'interpret.houseTheme.6':  { en: 'enemies, debts, health',                    hi: 'शत्रु, ऋण, स्वास्थ्य',                gu: 'શત્રુઓ, ઋણ, આરોગ્ય',                  sa: 'शत्रवः, ऋणम्, आरोग्यम्' },
  'interpret.houseTheme.7':  { en: 'spouse, partnerships, public life',         hi: 'जीवनसाथी, साझेदारी, सार्वजनिक जीवन',  gu: 'જીવનસાથી, ભાગીદારી, જાહેર જીવન',        sa: 'दम्पती, सहयोगः, सार्वजनिकजीवनम्' },
  'interpret.houseTheme.8':  { en: 'longevity, transformation, hidden matters', hi: 'आयुष्य, परिवर्तन, गुप्त विषय',         gu: 'આયુષ્ય, પરિવર્તન, ગુપ્ત બાબતો',         sa: 'आयुः, परिवर्तनम्, गुप्तविषयाः' },
  'interpret.houseTheme.9':  { en: 'fortune, dharma, father',                   hi: 'भाग्य, धर्म, पिता',                    gu: 'ભાગ્ય, ધર્મ, પિતા',                    sa: 'भाग्यम्, धर्मः, पिता' },
  'interpret.houseTheme.10': { en: 'career, status, public role',               hi: 'कर्म, प्रतिष्ठा, सार्वजनिक भूमिका',     gu: 'કારકિર્દી, પ્રતિષ્ઠા, જાહેર ભૂમિકા',     sa: 'कर्म, प्रतिष्ठा, सार्वजनिकभूमिका' },
  'interpret.houseTheme.11': { en: 'gains, friends, fulfillment',               hi: 'लाभ, मित्र, पूर्णता',                  gu: 'લાભ, મિત્રો, પૂર્ણતા',                  sa: 'लाभः, मित्राणि, पूर्णता' },
  'interpret.houseTheme.12': { en: 'losses, expenses, foreign lands',           hi: 'व्यय, हानि, विदेश',                    gu: 'વ્યય, હાનિ, વિદેશ',                    sa: 'व्ययः, हानिः, विदेशः' },

  // ─ Interpretation: planet flavors ───────────────────────────────────────
  'interpret.planetFlavor.SU': { en: 'authority, vitality and ego',                  hi: 'अधिकार, ओज और अहं',                gu: 'અધિકાર, ઓજ અને અહં',                sa: 'अधिकारः, ओजः, अहङ्कारश्च' },
  'interpret.planetFlavor.MO': { en: 'emotions, mind and nurturance',                hi: 'भावनाएँ, मन और पालन',              gu: 'ભાવનાઓ, મન અને પાલન',              sa: 'भावनाः, मनः, पोषणम्' },
  'interpret.planetFlavor.MA': { en: 'energy, courage and assertiveness',            hi: 'ऊर्जा, साहस और दृढ़ता',             gu: 'ઊર્જા, સાહસ અને દૃઢતા',             sa: 'ऊर्जा, साहसः, दृढता' },
  'interpret.planetFlavor.ME': { en: 'intellect, communication and skill',           hi: 'बुद्धि, संवाद और कौशल',             gu: 'બુદ્ધિ, સંવાદ અને કૌશલ',             sa: 'बुद्धिः, सम्भाषणम्, कौशलम्' },
  'interpret.planetFlavor.JU': { en: 'wisdom, expansion and grace',                  hi: 'ज्ञान, विस्तार और कृपा',             gu: 'જ્ઞાન, વિસ્તાર અને કૃપા',             sa: 'ज्ञानम्, विस्तारः, कृपा' },
  'interpret.planetFlavor.VE': { en: 'love, beauty and harmony',                     hi: 'प्रेम, सौन्दर्य और सामंजस्य',          gu: 'પ્રેમ, સૌંદર્ય અને સામંજસ્ય',           sa: 'प्रेम, सौन्दर्यम्, सामञ्जस्यम्' },
  'interpret.planetFlavor.SA': { en: 'discipline, structure and discipline of time', hi: 'अनुशासन, संरचना और काल-अनुशासन',     gu: 'અનુશાસન, સંરચના અને સમય-અનુશાસન',     sa: 'अनुशासनम्, संरचना, कालानुशासनम्' },
  'interpret.planetFlavor.RA': { en: 'ambition, foreign influences and obsession',   hi: 'आकांक्षा, विदेशी प्रभाव और तीव्र मोह',  gu: 'આકાંક્ષા, વિદેશી પ્રભાવ અને તીવ્ર મોહ',  sa: 'आकाङ्क्षा, विदेशीयप्रभावः, तीव्रासक्तिः' },
  'interpret.planetFlavor.KE': { en: 'detachment, spirituality and sudden insight',  hi: 'विरक्ति, आध्यात्मिकता और अकस्मात अंतर्दृष्टि', gu: 'વિરક્તિ, આધ્યાત્મિકતા અને અકસ્માત અંતર્દૃષ્ટિ', sa: 'विरक्तिः, आध्यात्मिकता, सहसा अन्तर्दृष्टिः' },

  // ─ Interpretation: sign natures (12) ────────────────────────────────────
  'interpret.signNature.1':  { en: 'pioneering, energetic',                hi: 'अग्रणी, ऊर्जावान',         gu: 'અગ્રણી, ઊર્જાવાન',         sa: 'अग्रगः, तेजस्वी' },
  'interpret.signNature.2':  { en: 'stable, sensual',                      hi: 'स्थिर, इन्द्रिय-प्रिय',      gu: 'સ્થિર, ઈન્દ્રિય-પ્રિય',      sa: 'स्थिरः, इन्द्रियप्रियः' },
  'interpret.signNature.3':  { en: 'curious, communicative',               hi: 'जिज्ञासु, संवादी',         gu: 'જિજ્ઞાસુ, સંવાદી',         sa: 'जिज्ञासुः, सम्भाषणप्रियः' },
  'interpret.signNature.4':  { en: 'nurturing, sensitive',                 hi: 'पालनकर्ता, संवेदनशील',     gu: 'પાલનકર્તા, સંવેદનશીલ',     sa: 'पोषकः, संवेदनशीलः' },
  'interpret.signNature.5':  { en: 'royal, expressive',                    hi: 'राजसी, अभिव्यक्तिशील',     gu: 'રાજસી, અભિવ્યક્ત',          sa: 'राजसः, अभिव्यक्तिप्रियः' },
  'interpret.signNature.6':  { en: 'analytical, service-minded',           hi: 'विश्लेषणात्मक, सेवापरायण',   gu: 'વિશ્લેષણાત્મક, સેવાપરાયણ',   sa: 'विश्लेषकः, सेवापरायणः' },
  'interpret.signNature.7':  { en: 'diplomatic, partnership-oriented',     hi: 'कूटनीतिज्ञ, साझेदारी-केंद्रित', gu: 'કૂટનીતિજ્ઞ, ભાગીદારી-કેન્દ્રિત', sa: 'कूटनीतिज्ञः, सहयोगकेन्द्रितः' },
  'interpret.signNature.8':  { en: 'intense, transformative',              hi: 'तीव्र, परिवर्तनकारी',       gu: 'તીવ્ર, પરિવર્તનકારી',       sa: 'तीव्रः, परिवर्तनकारी' },
  'interpret.signNature.9':  { en: 'philosophical, expansive',             hi: 'दार्शनिक, विस्तृत',         gu: 'દાર્શનિક, વિસ્તૃત',         sa: 'दार्शनिकः, विस्तीर्णः' },
  'interpret.signNature.10': { en: 'disciplined, ambitious',               hi: 'अनुशासित, महत्त्वाकांक्षी',   gu: 'અનુશાસિત, મહત્વાકાંક્ષી',    sa: 'अनुशासितः, महत्त्वाकाङ्क्षी' },
  'interpret.signNature.11': { en: 'innovative, humanitarian',             hi: 'नवप्रवर्तक, मानवतावादी',     gu: 'નવપ્રવર્તક, માનવતાવાદી',     sa: 'नवप्रवर्तकः, मानवतावादी' },
  'interpret.signNature.12': { en: 'compassionate, mystical',              hi: 'करुणामय, रहस्यमय',         gu: 'કરુણામય, રહસ્યમય',          sa: 'करुणामयः, रहस्यमयः' },

  // ─ Interpretation: lagna personality (12) ───────────────────────────────
  'interpret.lagnaNature.1':  { en: 'You are direct, enterprising and natural-born leader (Aries lagna).',           hi: 'आप सीधे, उद्यमी और स्वाभाविक नेता हैं (मेष लग्न)।',            gu: 'તમે સીધા, ઉદ્યમી અને સ્વાભાવિક નેતા છો (મેષ લગ્ન).',           sa: 'भवान् ऋजुः उद्यमी स्वाभाविकः नेता (मेषलग्नम्)।' },
  'interpret.lagnaNature.2':  { en: 'You are stable, sensuous and persistent (Taurus lagna).',                       hi: 'आप स्थिर, इन्द्रिय-प्रिय और दृढ़ हैं (वृषभ लग्न)।',              gu: 'તમે સ્થિર, ઈન્દ્રિય-પ્રિય અને દૃઢ છો (વૃષભ લગ્ન).',              sa: 'भवान् स्थिरः इन्द्रियप्रियः दृढः (वृषभलग्नम्)।' },
  'interpret.lagnaNature.3':  { en: 'You are quick-witted, talkative and adaptable (Gemini lagna).',                 hi: 'आप तीव्र-बुद्धि, वाचाल और अनुकूलनशील हैं (मिथुन लग्न)।',         gu: 'તમે તીવ્ર બુદ્ધિવાળા, વાચાળ અને અનુકૂળ છો (મિથુન લગ્ન).',          sa: 'भवान् तीव्रबुद्धिः वाचाटः अनुकूलनशीलः (मिथुनलग्नम्)।' },
  'interpret.lagnaNature.4':  { en: 'You are emotional, protective and family-oriented (Cancer lagna).',             hi: 'आप भावुक, रक्षक और परिवार-केंद्रित हैं (कर्क लग्न)।',             gu: 'તમે ભાવુક, રક્ષક અને કુટુંબ-કેન્દ્રિત છો (કર્ક લગ્ન).',             sa: 'भवान् भावुकः रक्षकः कुटुम्बकेन्द्रितः (कर्कलग्नम्)।' },
  'interpret.lagnaNature.5':  { en: 'You are confident, generous and expressive (Leo lagna).',                       hi: 'आप आत्मविश्वासी, उदार और अभिव्यक्तिशील हैं (सिंह लग्न)।',         gu: 'તમે આત્મવિશ્વાસી, ઉદાર અને અભિવ્યક્ત છો (સિંહ લગ્ન).',            sa: 'भवान् आत्मविश्वासी उदारः अभिव्यक्तिप्रियः (सिंहलग्नम्)।' },
  'interpret.lagnaNature.6':  { en: 'You are precise, analytical and service-minded (Virgo lagna).',                 hi: 'आप सूक्ष्म, विश्लेषणात्मक और सेवापरायण हैं (कन्या लग्न)।',        gu: 'તમે સૂક્ષ્મ, વિશ્લેષણાત્મક અને સેવાપરાયણ છો (કન્યા લગ્ન).',         sa: 'भवान् सूक्ष्मः विश्लेषकः सेवापरायणः (कन्यालग्नम्)।' },
  'interpret.lagnaNature.7':  { en: 'You are diplomatic, refined and partnership-driven (Libra lagna).',             hi: 'आप कूटनीतिज्ञ, परिष्कृत और साझेदारी-प्रेरित हैं (तुला लग्न)।',     gu: 'તમે કૂટનીતિજ્ઞ, પરિષ્કૃત અને ભાગીદારી-પ્રેરિત છો (તુલા લગ્ન).',     sa: 'भवान् कूटनीतिज्ञः परिष्कृतः सहयोगप्रेरितः (तुलालग्नम्)।' },
  'interpret.lagnaNature.8':  { en: 'You are intense, secretive and transformative (Scorpio lagna).',                hi: 'आप तीव्र, गुप्त और परिवर्तनकारी हैं (वृश्चिक लग्न)।',            gu: 'તમે તીવ્ર, ગૂઢ અને પરિવર્તનકારી છો (વૃશ્ચિક લગ્ન).',              sa: 'भवान् तीव्रः गुप्तः परिवर्तनकारी (वृश्चिकलग्नम्)।' },
  'interpret.lagnaNature.9':  { en: 'You are optimistic, philosophical and freedom-loving (Sagittarius lagna).',     hi: 'आप आशावादी, दार्शनिक और स्वतंत्रता-प्रिय हैं (धनु लग्न)।',         gu: 'તમે આશાવાદી, દાર્શનિક અને સ્વતંત્રતા-પ્રિય છો (ધનુ લગ્ન).',         sa: 'भवान् आशावादी दार्शनिकः स्वातन्त्र्यप्रियः (धनुर्लग्नम्)।' },
  'interpret.lagnaNature.10': { en: 'You are disciplined, ambitious and patient (Capricorn lagna).',                 hi: 'आप अनुशासित, महत्त्वाकांक्षी और धैर्यवान हैं (मकर लग्न)।',          gu: 'તમે અનુશાસિત, મહત્વાકાંક્ષી અને ધૈર્યવાન છો (મકર લગ્ન).',           sa: 'भवान् अनुशासितः महत्त्वाकाङ्क्षी धैर्यवान् (मकरलग्नम्)।' },
  'interpret.lagnaNature.11': { en: 'You are innovative, humanitarian and unconventional (Aquarius lagna).',         hi: 'आप नवप्रवर्तक, मानवतावादी और अपरंपरागत हैं (कुंभ लग्न)।',           gu: 'તમે નવપ્રવર્તક, માનવતાવાદી અને અપરંપરાગત છો (કુંભ લગ્ન).',         sa: 'भवान् नवप्रवर्तकः मानवतावादी अपारम्परिकः (कुम्भलग्नम्)।' },
  'interpret.lagnaNature.12': { en: 'You are compassionate, intuitive and mystical (Pisces lagna).',                 hi: 'आप करुणामय, अंतर्ज्ञानी और रहस्यमय हैं (मीन लग्न)।',              gu: 'તમે કરુણામય, અંતર્જ્ઞાની અને રહસ્યમય છો (મીન લગ્ન).',              sa: 'भवान् करुणामयः अन्तर्ज्ञानी रहस्यमयः (मीनलग्नम्)।' },

  // ─ Interpretation: lord-in-house special yogas ─────────────────────────
  'interpret.lordInHouse.1-1':  { en: 'Strong personality and self-determination.',           hi: 'दृढ़ व्यक्तित्व और आत्म-निर्णय।',           gu: 'દૃઢ વ્યક્તિત્વ અને આત્મ-નિર્ણય.',           sa: 'दृढं व्यक्तित्वम् आत्मनिर्णयश्च।' },
  'interpret.lordInHouse.1-10': { en: 'Career success and recognition; self-made achievement.', hi: 'कर्म में सफलता और सम्मान; स्वबल पर उपलब्धि।', gu: 'કારકિર્દીમાં સફળતા અને સન્માન; સ્વબળે સિદ્ધિ.',  sa: 'कर्मणि सफलता प्रतिष्ठा च; स्वबलेन सिद्धिः।' },
  'interpret.lordInHouse.5-9':  { en: 'Lakshmi Yoga — wealth, fortune, blessings of children.', hi: 'लक्ष्मी योग — धन, भाग्य, सन्तान-सुख।',         gu: 'લક્ષ્મી યોગ — ધન, ભાગ્ય, સંતાન-સુખ.',         sa: 'लक्ष्मीयोगः — धनं भाग्यं सन्ततिसुखं च।' },
  'interpret.lordInHouse.9-10': { en: 'Dharma-Karma Adhipati — alignment of dharma and career.', hi: 'धर्म-कर्म अधिपति — धर्म और कर्म का संयोग।',     gu: 'ધર્મ-કર્મ અધિપતિ — ધર્મ અને કર્મનું સંયોગ.',      sa: 'धर्मकर्माधिपतियोगः — धर्मस्य कर्मणश्च समायोगः।' },
  'interpret.lordInHouse.10-1': { en: 'Career defines self-image; visible public role.',      hi: 'कर्म ही आत्म-छवि; दृश्यमान सार्वजनिक भूमिका।', gu: 'કારકિર્દી જ આત્મ-છબી; દૃશ્યમાન જાહેર ભૂમિકા.', sa: 'कर्म एव आत्मच्छविः; दृश्या सार्वजनिकभूमिका।' },
  'interpret.lordInHouse.11-2': { en: 'Multiple income streams flowing into family wealth.',  hi: 'अनेक आय-स्रोत पारिवारिक धन में प्रवाहित।',     gu: 'અનેક આવક-સ્રોત કુટુંબના ધનમાં વહે છે.',       sa: 'बहुविधाः आयप्रवाहाः कुटुम्बधने सम्मिलिताः।' },

  // ─ Interpretation: composition templates ────────────────────────────────
  'interpret.template.planetInHouse':       { en: '{planet} brings {flavor} to matters of {theme} (house {h}).',                       hi: '{planet} {flavor} को {theme} (भाव {h}) पर ले आता है।',                       gu: '{planet} {flavor}ને {theme} (ભાવ {h})માં લાવે છે.',                          sa: '{planet} {flavor} {theme} (भावः {h}) इति विषये नयति।' },
  'interpret.template.planetInSign':        { en: '{planet} in {sign} colors its {flavor} with {nature} qualities.',                   hi: '{planet} {sign} राशि में अपने {flavor} को {nature} गुणों से रंग देता है।',     gu: '{planet} {sign} રાશિમાં પોતાના {flavor}ને {nature} ગુણોથી રંગે છે.',          sa: '{planet} {sign} राशौ स्वकीयं {flavor} {nature} गुणैः रञ्जयति।' },
  'interpret.template.lordInHouseGeneric':  { en: 'The lord of house {l} placed in house {h} links {themeFrom} with {themeTo}.',       hi: 'भाव {l} का स्वामी भाव {h} में स्थित होकर {themeFrom} को {themeTo} से जोड़ता है।', gu: 'ભાવ {l}નો સ્વામી ભાવ {h}માં સ્થિત થઈ {themeFrom}ને {themeTo} સાથે જોડે છે.',  sa: 'भावस्य {l} स्वामी {h} भावे स्थितः {themeFrom} {themeTo} इति सह सम्बन्धयति।' },

  // ─ Palmistry: section headings + summary template + hand-shape readings ─
  'palmistry.heading.shape':   { en: 'Hand shape',         hi: 'हाथ का आकार',          gu: 'હાથનો આકાર',        sa: 'हस्ताकारः' },
  'palmistry.heading.fingers': { en: 'Thumb & fingers',    hi: 'अंगूठा व अंगुलियाँ',     gu: 'અંગૂઠો અને આંગળીઓ',  sa: 'अङ्गुष्ठाङ्गुल्यः' },
  'palmistry.heading.lines':   { en: 'Major lines',        hi: 'मुख्य रेखाएँ',           gu: 'મુખ્ય રેખાઓ',         sa: 'प्रमुखरेखाः' },
  'palmistry.heading.mounts':  { en: 'Mounts',             hi: 'पर्वत',                gu: 'પર્વતો',              sa: 'पर्वताः' },
  'palmistry.heading.marks':   { en: 'Special marks',      hi: 'विशेष चिह्न',          gu: 'વિશેષ ચિહ્નો',        sa: 'विशेषचिह्नानि' },
  'palmistry.summary':         { en: 'Reading the {hand} (active) hand. {theme} — {opening}.', hi: '{hand} (सक्रिय) हाथ का अध्ययन। {theme} — {opening}।', gu: '{hand} (સક્રિય) હાથનો અભ્યાસ. {theme} — {opening}.', sa: '{hand} (सक्रियं) हस्तं पठ्यते। {theme} — {opening}।' },
  'palmistry.hand.left':       { en: 'left',               hi: 'बायें',                gu: 'ડાબા',                sa: 'वामं' },
  'palmistry.hand.right':      { en: 'right',              hi: 'दायें',                gu: 'જમણા',                sa: 'दक्षिणं' },
  'palmistry.shape.earth.theme':  { en: 'Earth hand (square palm, short fingers)',  hi: 'पृथ्वी हाथ (वर्ग हथेली, छोटी अंगुलियाँ)',  gu: 'પૃથ્વી હાથ (ચોરસ હથેળી, ટૂંકી આંગળીઓ)', sa: 'पृथ्वीहस्तः (चतुरस्रहस्ततलं ह्रस्वाङ्गुल्यः)' },
  'palmistry.shape.earth.traits': { en: 'Practical, grounded, hands-on; finds meaning in tangible work and prefers tradition over experiment. Builds slowly but reliably.', hi: 'व्यावहारिक, संतुलित, कर्मठ; मूर्त कार्य में अर्थ पाता है और परंपरा को प्रयोग से अधिक मानता है। धीरे किन्तु विश्वसनीय रूप से निर्माण करता है।', gu: 'વ્યવહારુ, સ્થિર, કર્મઠ; મૂર્ત કાર્યમાં અર્થ શોધે છે અને પરંપરાને પ્રયોગ કરતાં વધુ ગણે છે. ધીમે પણ ભરોસાપાત્ર રીતે બાંધે છે.', sa: 'व्यावहारिकः, स्थिरः, कर्मठः; मूर्तकर्मणि अर्थं विन्दति परम्परां प्रयोगात् अधिकं मन्यते। शनैः परं विश्वसनीयरूपेण निर्माति।' },
  'palmistry.shape.air.theme':    { en: 'Air hand (square palm, long fingers)',     hi: 'वायु हाथ (वर्ग हथेली, लंबी अंगुलियाँ)',    gu: 'વાયુ હાથ (ચોરસ હથેળી, લાંબી આંગળીઓ)',  sa: 'वायुहस्तः (चतुरस्रहस्ततलं दीर्घाङ्गुल्यः)' },
  'palmistry.shape.air.traits':   { en: 'Intellectual, communicative, restless mind; thrives on ideas, language, and social exchange. Quick to understand, slower to commit emotionally.', hi: 'बौद्धिक, संवादप्रिय, चंचल मन; विचारों, भाषा एवं सामाजिक आदान-प्रदान में फलता है। शीघ्र समझता है, भावनात्मक प्रतिबद्धता धीमी।', gu: 'બૌદ્ધિક, સંવાદપ્રિય, ચંચળ મન; વિચાર, ભાષા અને સામાજિક આદાન-પ્રદાનમાં ખીલે છે. ઝડપથી સમજે, ભાવનાત્મક પ્રતિબદ્ધતા ધીમી.', sa: 'बौद्धिकः, संवादप्रियः, चञ्चलमनाः; विचारेषु भाषायां सामाजिकविनिमये च प्रवर्धते। शीघ्रं बोधति, भावप्रतिबद्धता मन्दा।' },
  'palmistry.shape.fire.theme':   { en: 'Fire hand (long palm, short fingers)',     hi: 'अग्नि हाथ (लंबी हथेली, छोटी अंगुलियाँ)',  gu: 'અગ્નિ હાથ (લાંબી હથેળી, ટૂંકી આંગળીઓ)',  sa: 'अग्निहस्तः (दीर्घहस्ततलं ह्रस्वाङ्गुल्यः)' },
  'palmistry.shape.fire.traits':  { en: 'Energetic, instinctive, action-oriented; takes initiative and inspires others. Risks include impulsiveness and burnout when not paced.', hi: 'ऊर्जावान, सहज-वृत्ति, कर्म-केन्द्रित; पहल करता है और दूसरों को प्रेरित करता है। आवेग और थकान का जोखिम जब गति न संयमी हो।', gu: 'ઊર્જાવાન, સહજ-વૃત્તિ, કર્મ-કેન્દ્રિત; પહેલ કરે અને બીજાને પ્રેરિત કરે. આવેગ અને થાકાવાનું જોખમ જ્યારે ગતિ સંયમિત ન હોય.', sa: 'तेजस्वी, सहजवृत्तिः, कर्मकेन्द्रितः; प्रथमं प्रवर्तते अन्यान् प्रेरयति च। आवेगस्य श्रान्तेश्च जोखिमं यदा गतिः अनियन्त्रिता।' },
  'palmistry.shape.water.theme':  { en: 'Water hand (long palm, long fingers)',     hi: 'जल हाथ (लंबी हथेली, लंबी अंगुलियाँ)',     gu: 'જળ હાથ (લાંબી હથેળી, લાંબી આંગળીઓ)',  sa: 'जलहस्तः (दीर्घहस्ततलं दीर्घाङ्गुल्यः)' },
  'palmistry.shape.water.traits': { en: 'Sensitive, imaginative, empathic; rich inner life and creative gifts. Needs solitude to recharge; absorbs surrounding emotions easily.', hi: 'संवेदनशील, कल्पनाशील, सहानुभूति-पूर्ण; समृद्ध आन्तरिक जीवन एवं सृजनात्मक उपहार। ऊर्जा हेतु एकांत आवश्यक; आसपास की भावनाओं को सहज ग्रहण करता है।', gu: 'સંવેદનશીલ, કલ્પનાશીલ, સહાનુભૂતિપૂર્ણ; સમૃદ્ધ આંતરિક જીવન અને સર્જનાત્મક ઉપહારો. ઊર્જા માટે એકાંત જરૂરી; આસપાસની ભાવનાઓને સહજ ગ્રહણ કરે.', sa: 'संवेदनशीलः, कल्पनाशीलः, सहानुभूतिपूर्णः; समृद्धम् आन्तरिकजीवनम् सर्जनात्मकोपहाराश्च। ऊर्जायै एकान्तं अपेक्ष्यते; परिसरस्य भावान् सहजं गृह्णाति।' },
  'palmistry.notes.0': { en: 'In palmistry the active (dominant) hand shows what you have made of yourself; the passive hand shows inherent disposition.', hi: 'हस्तरेखा-शास्त्र में सक्रिय (प्रमुख) हाथ दर्शाता है कि आपने स्वयं को क्या बनाया है; निष्क्रिय हाथ अंतर्निहित प्रवृत्ति।', gu: 'હસ્તરેખાશાસ્ત્રમાં સક્રિય (પ્રધાન) હાથ બતાવે છે કે તમે પોતાને શું બનાવ્યું છે; નિષ્ક્રિય હાથ સ્વભાવગત વલણ.', sa: 'हस्तसामुद्रिके सक्रियः (प्रधानः) हस्तः दर्शयति यत् भवान् स्वयं किं कृतवान्; निष्क्रियो हस्तः अन्तर्निहितां प्रवृत्तिं दर्शयति।' },
  'palmistry.notes.1': { en: 'Lines change over years — re-read every 3–5 years.', hi: 'रेखाएँ वर्षों में बदलती हैं — प्रत्येक 3–5 वर्ष पर पुनः पढ़ें।', gu: 'રેખાઓ વર્ષો સાથે બદલાય છે — દર 3–5 વર્ષે ફરી વાંચો.', sa: 'रेखाः वर्षेषु परिवर्तन्ते — प्रति त्रि-पञ्चवर्षम् पुनः पठ्यताम्।' },
  'palmistry.fallback.lines':  { en: 'No major line data supplied — readings here describe how each line tends to manifest at different qualities.', hi: 'मुख्य रेखा-डेटा उपलब्ध नहीं — यहाँ प्रत्येक रेखा विभिन्न गुणों में कैसे प्रकट होती है, यह वर्णित है।', gu: 'મુખ્ય રેખા-ડેટા આપ્યો નથી — અહીં દરેક રેખા વિવિધ ગુણોમાં કેવી રીતે પ્રગટ થાય તે વર્ણવ્યું છે.', sa: 'प्रमुखरेखादत्तानि नोपलब्धानि — अत्र प्रत्येकरेखायाः विविधगुणेषु प्रकटीकरणं वर्ण्यते।' },
  'palmistry.fallback.mounts': { en: 'No mount data supplied; mounts modulate the lines but are not required for the basic reading.', hi: 'पर्वत-डेटा उपलब्ध नहीं; पर्वत रेखाओं को सूचित करते हैं किन्तु आधारभूत पठन हेतु अनिवार्य नहीं।', gu: 'પર્વત-ડેટા આપ્યો નથી; પર્વતો રેખાઓને સૂચવે છે પણ આધારભૂત વાંચન માટે જરૂરી નથી.', sa: 'पर्वतदत्तानि नोपलब्धानि; पर्वताः रेखाः नियन्त्रयन्ति परं मूलपठनाय न आवश्यकाः।' },
  'palmistry.fallback.marks':  { en: 'No special marks reported.', hi: 'कोई विशेष चिह्न प्रस्तुत नहीं।', gu: 'કોઈ વિશેષ ચિહ્ન આપ્યું નથી.', sa: 'न विशेषचिह्नं निवेदितम्।' },
  'palmistry.markPara':        { en: '{mark} on {line} line — {reading}', hi: '{mark} {line} रेखा पर — {reading}', gu: '{mark} {line} રેખા પર — {reading}', sa: '{mark} {line} रेखायां — {reading}' },
  'palmistry.linePara':        { en: '{line} line: {reading}', hi: '{line} रेखा: {reading}', gu: '{line} રેખા: {reading}', sa: '{line} रेखा: {reading}' },
  'palmistry.lineName.life':     { en: 'Life',     hi: 'जीवन',     gu: 'જીવન',    sa: 'जीवनम्' },
  'palmistry.lineName.head':     { en: 'Head',     hi: 'मस्तिष्क',  gu: 'મસ્તિષ્ક', sa: 'मस्तिष्कः' },
  'palmistry.lineName.heart':    { en: 'Heart',    hi: 'हृदय',      gu: 'હૃદય',    sa: 'हृदयम्' },
  'palmistry.lineName.fate':     { en: 'Fate',     hi: 'भाग्य',     gu: 'ભાગ્ય',    sa: 'भाग्यम्' },
  'palmistry.lineName.sun':      { en: 'Sun',      hi: 'सूर्य',     gu: 'સૂર્ય',    sa: 'सूर्यः' },
  'palmistry.lineName.mercury':  { en: 'Mercury',  hi: 'बुध',       gu: 'બુધ',     sa: 'बुधः' },
  'palmistry.lineName.marriage': { en: 'Marriage', hi: 'विवाह',     gu: 'લગ્ન',    sa: 'विवाहः' },
  'palmistry.markName.star':     { en: 'Star',     hi: 'तारा',      gu: 'તારો',    sa: 'तारका' },
  'palmistry.markName.cross':    { en: 'Cross',    hi: 'क्रॉस',     gu: 'ક્રોસ',    sa: 'स्वस्तिका' },
  'palmistry.markName.triangle': { en: 'Triangle', hi: 'त्रिभुज',   gu: 'ત્રિકોણ',  sa: 'त्रिकोणम्' },
  'palmistry.markName.square':   { en: 'Square',   hi: 'वर्ग',      gu: 'ચોરસ',    sa: 'चतुरस्रम्' },
  'palmistry.markName.island':   { en: 'Island',   hi: 'द्वीप',     gu: 'દ્વીપ',    sa: 'द्वीपम्' },
  'palmistry.markName.grille':   { en: 'Grille',   hi: 'जाली',      gu: 'જાળી',    sa: 'जाली' },
  'palmistry.markName.circle':   { en: 'Circle',   hi: 'वृत्त',     gu: 'વર્તુળ',  sa: 'वृत्तम्' },
  'palmistry.markName.spot':     { en: 'Spot',     hi: 'बिन्दु',    gu: 'બિંદુ',   sa: 'बिन्दुः' },

  // ─ Samudrika: section headings + summary + body-type names ──────────────
  'samudrika.summary':         { en: 'Constitution: {bodyType}. {opening}.', hi: 'गठन: {bodyType}। {opening}।', gu: 'બંધારણ: {bodyType}. {opening}.', sa: 'देहप्रकृतिः: {bodyType}। {opening}।' },
  'samudrika.heading.body':    { en: 'Body & gait',         hi: 'शरीर व चाल',          gu: 'શરીર અને ચાલ',       sa: 'देहो गतिश्च' },
  'samudrika.heading.face':    { en: 'Face & features',     hi: 'मुख व अंग',            gu: 'મુખ અને અંગ',         sa: 'मुखाङ्गानि' },
  'samudrika.heading.signs':   { en: 'Auspicious & inauspicious signs', hi: 'शुभ व अशुभ लक्षण',    gu: 'શુભ અને અશુભ ચિહ્નો',  sa: 'शुभाशुभलक्षणानि' },
  'samudrika.notes.0':         { en: 'Samudrika Shastra is descriptive — the reading frames disposition and tendency, not destiny.', hi: 'सामुद्रिक शास्त्र वर्णात्मक है — पठन प्रवृत्ति को रेखांकित करता है, नियति को नहीं।', gu: 'સામુદ્રિક શાસ્ત્ર વર્ણાત્મક છે — વાંચન વૃત્તિને રેખાંકિત કરે છે, ભાગ્યને નહીં.', sa: 'सामुद्रिकशास्त्रं वर्णात्मकम् — पठनं प्रवृत्तिं उल्लिखति न तु नियतिम्।' },
  'samudrika.bodyType.brahmin':   { en: 'Brahmin (sattvic)',  hi: 'ब्राह्मण (सात्त्विक)',   gu: 'બ્રાહ્મણ (સાત્ત્વિક)',   sa: 'ब्राह्मणः (सात्त्विकः)' },
  'samudrika.bodyType.kshatriya': { en: 'Kshatriya (rajasic)',hi: 'क्षत्रिय (राजसिक)',     gu: 'ક્ષત્રિય (રાજસિક)',     sa: 'क्षत्रियः (राजसिकः)' },
  'samudrika.bodyType.vaishya':   { en: 'Vaishya (mixed)',    hi: 'वैश्य (मिश्र)',         gu: 'વૈશ્ય (મિશ્ર)',         sa: 'वैश्यः (मिश्रः)' },
  'samudrika.bodyType.shudra':    { en: 'Shudra (tamasic)',   hi: 'शूद्र (तामसिक)',        gu: 'શૂદ્ર (તામસિક)',       sa: 'शूद्रः (तामसिकः)' },

  // ─ Graphology: section headings + summary template ──────────────────────
  'graphology.summary':        { en: 'Sample analysed — {n} feature{plural} considered.', hi: 'नमूना विश्लेषित — {n} विशेषता{plural} पर विचार किया गया।', gu: 'નમૂનો વિશ્લેષાયો — {n} લક્ષણ{plural} પર વિચાર.', sa: 'नमूना विश्लेषिता — {n} विशेषाः परीक्षिताः।' },
  'graphology.heading.traits': { en: 'Handwriting traits',    hi: 'लेखन-शैली विशेषताएँ',  gu: 'લેખન-શૈલીની વિશેષતાઓ', sa: 'लेखनशैल्याः विशेषाः' },
  'graphology.heading.summary':{ en: 'Personality summary',   hi: 'व्यक्तित्व सारांश',     gu: 'વ્યક્તિત્વ સારાંશ',     sa: 'व्यक्तित्वसारः' },

  // ─ Tarot: spread + position labels ──────────────────────────────────────
  'tarot.spread.three-card':   { en: 'Three-card spread',     hi: 'तीन-कार्ड फैलाव',        gu: 'ત્રણ-કાર્ડ ફેલાવ',       sa: 'त्रिपत्र-विस्तारः' },
  'tarot.spread.celtic-cross': { en: 'Celtic Cross',          hi: 'सेल्टिक क्रॉस',          gu: 'સેલ્ટિક ક્રોસ',          sa: 'सेल्टिकस्वस्तिकः' },
  'tarot.spread.career':       { en: 'Career spread',         hi: 'कर्म फैलाव',            gu: 'કારકિર્દી ફેલાવ',         sa: 'आजीविकाविस्तारः' },
  'tarot.spread.yes-no':       { en: 'Yes/No',                hi: 'हाँ/नहीं',              gu: 'હા/ના',                sa: 'आम्/न' },
  'tarot.position.past':       { en: 'Past',                  hi: 'भूत',                  gu: 'ભૂતકાળ',                sa: 'भूतम्' },
  'tarot.position.present':    { en: 'Present',               hi: 'वर्तमान',              gu: 'વર્તમાન',               sa: 'वर्तमानम्' },
  'tarot.position.future':     { en: 'Future',                hi: 'भविष्य',               gu: 'ભવિષ્ય',                sa: 'भविष्यम्' },
  'tarot.position.advice':     { en: 'Advice',                hi: 'सलाह',                 gu: 'સલાહ',                 sa: 'सूचना' },
  'tarot.position.outcome':    { en: 'Outcome',               hi: 'परिणाम',               gu: 'પરિણામ',               sa: 'परिणामः' },
  'tarot.summary':             { en: '{spread} spread — {n} card{plural} drawn.', hi: '{spread} — {n} कार्ड{plural} खींचे गए।', gu: '{spread} — {n} કાર્ડ{plural} ખેંચ્યા.', sa: '{spread} — {n} पत्राणि उद्धृतानि।' },

  // ─ Numerology-deep: section headings + master/karmic labels ─────────────
  'numerologyDeep.heading.path':       { en: 'Life path',            hi: 'जीवन-पथ',             gu: 'જીવન-પથ',              sa: 'जीवनपथः' },
  'numerologyDeep.heading.challenges': { en: 'Challenges',           hi: 'चुनौतियाँ',           gu: 'પડકારો',                sa: 'समस्याः' },
  'numerologyDeep.heading.cycles':     { en: 'Personal cycles',      hi: 'व्यक्तिगत चक्र',       gu: 'વ્યક્તિગત ચક્ર',         sa: 'व्यक्तिगतचक्राणि' },
  'numerologyDeep.heading.compatibility':{ en: 'Compatibility',      hi: 'अनुकूलता',            gu: 'અનુકૂળતા',              sa: 'अनुकूलता' },
  'numerologyDeep.master.label':       { en: 'Master numbers',       hi: 'मास्टर अंक',          gu: 'માસ્ટર અંક',            sa: 'गुरु-अङ्काः' },
  'numerologyDeep.karmic.label':       { en: 'Karmic debts',         hi: 'कर्म ऋण',             gu: 'કર્મ ઋણ',               sa: 'कर्मऋणानि' },
  'numerologyDeep.cycle.physical':     { en: 'Physical cycle',       hi: 'भौतिक चक्र',          gu: 'ભૌતિક ચક્ર',            sa: 'देहचक्रम्' },
  'numerologyDeep.cycle.emotional':    { en: 'Emotional cycle',      hi: 'भावनात्मक चक्र',      gu: 'ભાવનાત્મક ચક્ર',        sa: 'भावचक्रम्' },
  'numerologyDeep.cycle.intellectual': { en: 'Intellectual cycle',   hi: 'बौद्धिक चक्र',         gu: 'બૌદ્ધિક ચક્ર',          sa: 'बौद्धिकचक्रम्' },

  // ─ Classical texts: 5 source metadata entries (author / era / descriptive note) ──
  'classicalText.Saravali.author':           { en: 'Kalyana Varma',         hi: 'कल्याण वर्मा',           gu: 'કલ્યાણ વર્મા',           sa: 'कल्याणवर्मा' },
  'classicalText.Saravali.era':              { en: '8th c. CE',             hi: '8वीं शताब्दी ई.',         gu: '8મી સદી ઈ.',             sa: 'अष्टमशताब्दी (ख्रीष्टाब्दे)' },
  'classicalText.Saravali.note':             { en: 'Compendium of planetary effects, house-by-house and yoga-by-yoga.', hi: 'ग्रह-फलों का संग्रह — भाव-दर-भाव और योग-दर-योग।', gu: 'ગ્રહ-ફળોનું સંકલન — ભાવ-દર-ભાવ અને યોગ-દર-યોગ.', sa: 'ग्रहफलानां संग्रहः — भावक्रमेण योगक्रमेण च।' },
  'classicalText.Jataka Parijata.author':    { en: 'Vaidyanatha Dikshita',  hi: 'वैद्यनाथ दीक्षित',        gu: 'વૈદ્યનાથ દીક્ષિત',         sa: 'वैद्यनाथदीक्षितः' },
  'classicalText.Jataka Parijata.era':       { en: '15th c. CE',            hi: '15वीं शताब्दी ई.',        gu: '15મી સદી ઈ.',           sa: 'पञ्चदशशताब्दी (ख्रीष्टाब्दे)' },
  'classicalText.Jataka Parijata.note':      { en: 'Eighteen-chapter classical on natal results and yogas.', hi: 'जन्म-फल और योगों पर अठारह-अध्याय शास्त्र।', gu: 'જન્મ-ફળ અને યોગો પર અઢાર-અધ્યાય શાસ્ત્ર.', sa: 'जन्मफलयोगयोः अष्टादशाध्यायशास्त्रम्।' },
  'classicalText.Phaladeepika.author':       { en: 'Mantreshwara',          hi: 'मन्त्रेश्वर',             gu: 'મંત્રેશ્વર',              sa: 'मन्त्रेश्वरः' },
  'classicalText.Phaladeepika.era':          { en: '14th c. CE',            hi: '14वीं शताब्दी ई.',        gu: '14મી સદી ઈ.',           sa: 'चतुर्दशशताब्दी (ख्रीष्टाब्दे)' },
  'classicalText.Phaladeepika.note':         { en: 'Practical results-oriented text; pillar of modern Vedic predictive practice.', hi: 'व्यावहारिक फल-केन्द्रित ग्रन्थ; आधुनिक वैदिक भविष्यवाणी का स्तम्भ।', gu: 'વ્યવહારુ ફલ-કેન્દ્રિત ગ્રંથ; આધુનિક વૈદિક ભવિષ્યવાણીનો સ્તંભ.', sa: 'फलकेन्द्रितो व्यावहारिकग्रन्थः; आधुनिकवैदिकभविष्यवाणीनां स्तम्भः।' },
  'classicalText.Uttara Kalamrita.author':   { en: 'Kalidasa',              hi: 'कालिदास',               gu: 'કાલિદાસ',                sa: 'कालिदासः' },
  'classicalText.Uttara Kalamrita.era':      { en: '15th c. CE',            hi: '15वीं शताब्दी ई.',        gu: '15મી સદી ઈ.',           sa: 'पञ्चदशशताब्दी (ख्रीष्टाब्दे)' },
  'classicalText.Uttara Kalamrita.note':     { en: 'Advanced classical covering sphutas, karakas, and special lagnas.', hi: 'स्फुट, कारक एवं विशेष लग्नों पर उन्नत शास्त्र।', gu: 'સ્ફુટ, કારક અને વિશેષ લગ્નો પર ઊંડું શાસ્ત્ર.', sa: 'स्फुटकारकविशेषलग्नविषयकम् उन्नतशास्त्रम्।' },
  'classicalText.Jataka Bharanam.author':    { en: 'Dhundiraja',            hi: 'धुन्धिराज',              gu: 'ધુન્ધિરાજ',              sa: 'धुन्धिराजः' },
  'classicalText.Jataka Bharanam.era':       { en: '15th c. CE',            hi: '15वीं शताब्दी ई.',        gu: '15મી સદી ઈ.',           sa: 'पञ्चदशशताब्दी (ख्रीष्टाब्दे)' },
  'classicalText.Jataka Bharanam.note':      { en: 'Structured presentation of yogas with phalita.', hi: 'फलित सहित योगों की सुव्यवस्थित प्रस्तुति।', gu: 'ફલિત સહિત યોગોની વ્યવસ્થિત રજૂઆત.', sa: 'फलितसहितानां योगानां सुव्यवस्थिता प्रस्तुतिः।' },

  // ─ Classical quotes: 35 entries × text translation ──────────────────────
  'classicalQuote.sar.sun.01.text':       { en: 'The Sun in the 1st house makes one lean, short-tempered, courageous, and given to wandering; his head may pain in youth.', hi: 'लग्न में सूर्य व्यक्ति को कृशकाय, अल्पक्रोधी, साहसी एवं भ्रमणशील बनाता है; युवावस्था में सिरदर्द संभव।', gu: 'લગ્નમાં સૂર્ય જાતકને કૃશ, ઝડપી ગુસ્સાવાળા, સાહસી અને ભ્રમણશીલ બનાવે; યુવાવસ્થામાં માથાનો દુખાવો સંભવ.', sa: 'लग्ने सूर्यः कृशकायं स्वल्पक्रोधं साहसिकं भ्रमणशीलं च करोति; यौवने शिरःपीडा सम्भवा।' },
  'classicalQuote.sar.sun.10.text':       { en: "When the Sun occupies the 10th, one attains royal favour, authority, wealth through one's own effort, and lasting reputation.", hi: 'दशम भाव में सूर्य के होने पर राजकीय कृपा, अधिकार, स्वबल पर धन एवं स्थायी कीर्ति प्राप्त होती है।', gu: 'દશમ ભાવમાં સૂર્ય હોય ત્યારે રાજકૃપા, અધિકાર, સ્વબળે ધન અને સ્થાયી કીર્તિ મળે છે.', sa: 'दशमे सूर्ये राजकृपा अधिकारः स्वबलेन धनं स्थिरा कीर्तिश्च प्राप्यन्ते।' },
  'classicalQuote.sar.moon.04.text':      { en: 'The Moon in the 4th gives vehicles, an affectionate mother, a beautiful home, and contentment of the heart.', hi: 'चतुर्थ भाव में चन्द्र वाहन, स्नेहमयी माता, सुन्दर गृह एवं हृदयानन्द देता है।', gu: 'ચતુર્થ ભાવમાં ચંદ્ર વાહન, સ્નેહાળ માતા, સુંદર ઘર અને હૃદય-આનંદ આપે છે.', sa: 'चतुर्थे चन्द्रः वाहनं स्नेहमयीं मातरं सुन्दरं गृहं हृदयानन्दं च प्रयच्छति।' },
  'classicalQuote.sar.mars.exalt.text':   { en: 'Mars exalted gives conquest of foes, distinguished courage, landed estates, and mastery over weapons or command.', hi: 'उच्च मंगल शत्रुओं पर विजय, विशिष्ट साहस, भू-सम्पत्ति एवं शस्त्र-कौशल या नेतृत्व देता है।', gu: 'ઉચ્ચ મંગળ શત્રુઓ પર વિજય, વિશિષ્ટ સાહસ, ભૂ-સંપત્તિ અને શસ્ત્ર-કૌશલ કે નેતૃત્વ આપે છે.', sa: 'उच्चे मङ्गलः शत्रुजयं विशिष्टसाहसं भूसम्पत्तिं शस्त्रकौशलं नेतृत्वं वा प्रयच्छति।' },
  'classicalQuote.sar.mercury.01.text':   { en: 'Mercury in lagna makes one learned, witty, long-lived, and skilled in speech and writing.', hi: 'लग्न में बुध जातक को विद्वान, चतुर, दीर्घायु एवं वाक्-लेखन में कुशल बनाता है।', gu: 'લગ્નમાં બુધ જાતકને વિદ્વાન, ચતુર, દીર્ઘાયુ અને વાક્-લેખનમાં કુશળ બનાવે છે.', sa: 'लग्ने बुधः जातकं विद्वांसं चतुरं दीर्घायुषं वाक्लेखनकुशलं च करोति।' },
  'classicalQuote.sar.jupiter.05.text':   { en: 'Jupiter in the 5th grants excellent children, devotion to mantra and scripture, and success in knowledge-work.', hi: 'पंचम भाव में बृहस्पति उत्तम सन्तान, मन्त्र एवं शास्त्र में निष्ठा तथा ज्ञान-कार्य में सफलता देता है।', gu: 'પંચમ ભાવમાં બૃહસ્પતિ ઉત્તમ સંતાન, મંત્ર અને શાસ્ત્રમાં નિષ્ઠા તથા જ્ઞાન-કાર્યમાં સફળતા આપે છે.', sa: 'पञ्चमे बृहस्पतिः उत्तमां सन्ततिं मन्त्रशास्त्रनिष्ठां ज्ञानकर्मणि सफलतां च प्रयच्छति।' },
  'classicalQuote.sar.venus.07.text':     { en: 'Venus in the 7th gives a charming and devoted spouse, pleasures of the senses, and comforts in love.', hi: 'सप्तम भाव में शुक्र मनोहर एवं निष्ठावान जीवनसाथी, इन्द्रिय-सुख तथा प्रेम-सुख देता है।', gu: 'સપ્તમ ભાવમાં શુક્ર મનોહર અને નિષ્ઠાવાન જીવનસાથી, ઈન્દ્રિય-સુખ અને પ્રેમ-સુખ આપે છે.', sa: 'सप्तमे शुक्रः मनोहरं निष्ठावन्तं दम्पतिं इन्द्रियसुखं प्रेमसुखं च प्रयच्छति।' },
  'classicalQuote.sar.saturn.03.text':    { en: 'Saturn in the 3rd gives enduring valour, wealth through effort, disciplined siblings, and long-distance ventures.', hi: 'तृतीय भाव में शनि स्थायी पराक्रम, श्रमजन्य धन, अनुशासित भाई-बहन एवं दूरस्थ उद्यम देता है।', gu: 'તૃતીય ભાવમાં શનિ સ્થાયી પરાક્રમ, શ્રમજન્ય ધન, અનુશાસિત ભાઈ-બહેન અને દૂરના ઉદ્યોગ આપે છે.', sa: 'तृतीये शनिः स्थिरं पराक्रमं श्रमजन्यं धनं अनुशासितं सहोदरान् दूरस्थोद्यमं च प्रयच्छति।' },
  'classicalQuote.jp.lagna.lord.10.text': { en: 'When the lord of the lagna occupies the 10th house, the native rises through his own merit and earns a name that endures.', hi: 'लग्नेश दशम भाव में होने पर जातक अपनी योग्यता से उन्नति करता है और स्थायी कीर्ति अर्जित करता है।', gu: 'લગ્નેશ દશમ ભાવમાં હોય ત્યારે જાતક પોતાની યોગ્યતાથી ઉન્નતિ કરે અને સ્થાયી કીર્તિ મેળવે.', sa: 'लग्नेशो दशमे भावे स्थितः सन् जातकः स्वगुणेन उन्नतिं करोति स्थिरां कीर्तिं च लभते।' },
  'classicalQuote.jp.9.lord.10.text':     { en: 'The 9th lord in the 10th forms Dharma-Karma-Adhipati yoga, giving a principled profession and government favour.', hi: 'नवमेश दशम भाव में होकर धर्म-कर्म अधिपति योग बनाता है — सिद्धान्तपरक व्यवसाय तथा शासन-कृपा।', gu: 'નવમેશ દશમ ભાવમાં ધર્મ-કર્મ અધિપતિ યોગ બનાવે — સિદ્ધાંતપૂર્ણ વ્યવસાય અને રાજ્ય-કૃપા.', sa: 'नवमेशो दशमे भावे धर्मकर्माधिपतियोगं जनयति — सिद्धान्तमयं व्यवसायं राजकृपां च।' },
  'classicalQuote.jp.jupiter.lagna.text': { en: 'Jupiter in the lagna confers longevity, good conduct, intellect, scriptural learning, and the respect of elders.', hi: 'लग्न में बृहस्पति दीर्घायु, सदाचार, बुद्धि, शास्त्र-ज्ञान एवं वृद्धों का आदर देता है।', gu: 'લગ્નમાં બૃહસ્પતિ દીર્ઘાયુ, સદાચાર, બુદ્ધિ, શાસ્ત્ર-જ્ઞાન અને વડીલોનો આદર આપે છે.', sa: 'लग्ने बृहस्पतिः दीर्घायुषं सदाचारं बुद्धिं शास्त्रज्ञानं वृद्धादरं च प्रयच्छति।' },
  'classicalQuote.jp.moon.waxing.lagna.text': { en: 'The Moon in the lagna, strong in paksha-bala, gives a handsome form, emotional steadiness, and maternal blessings.', hi: 'पक्ष-बल से बली चन्द्र लग्न में सुन्दर रूप, भावनात्मक स्थिरता एवं मातृ-आशीष देता है।', gu: 'પક્ષ-બલથી બળવાન ચંદ્ર લગ્નમાં સુંદર રૂપ, ભાવનાત્મક સ્થિરતા અને માતૃ-આશીર્વાદ આપે છે.', sa: 'पक्षबलयुक्तश्चन्द्रः लग्ने सुन्दरं रूपं भावस्थैर्यं मातृवरदं च प्रयच्छति।' },
  'classicalQuote.jp.saturn.debil.text':  { en: 'Saturn debilitated in Aries makes the native obstinate, wandering, and quarrelsome unless a raja-yoga repairs the damage.', hi: 'मेष में नीच शनि व्यक्ति को हठी, भ्रमणशील एवं कलहप्रिय बनाता है, जब तक राज-योग क्षति न सुधारे।', gu: 'મેષમાં નીચ શનિ વ્યક્તિને હઠી, ભ્રમણશીલ અને ઝઘડાળુ બનાવે, જ્યાં સુધી રાજ-યોગ ખામી ન સુધારે.', sa: 'मेषे नीचो शनिः जातकं हठिनं भ्रमणशीलं कलहप्रियं च करोति, यावन्न राजयोगः क्षतिं प्रतिकरोति।' },
  'classicalQuote.jp.venus.02.text':      { en: 'Venus in the 2nd gives speech full of sweetness, wealth accumulated steadily, and facial beauty.', hi: 'द्वितीय भाव में शुक्र मधुर वाणी, क्रमिक धन-संग्रह एवं मुख-सौन्दर्य देता है।', gu: 'દ્વિતીય ભાવમાં શુક્ર મધુર વાણી, ધીમું ધન-સંગ્રહ અને મુખ-સૌંદર્ય આપે છે.', sa: 'द्वितीये शुक्रः मधुरवाचं क्रमशो धनसंग्रहं मुखसौन्दर्यं च प्रयच्छति।' },
  'classicalQuote.jp.mars.07.text':       { en: 'Mars in the 7th (without benefic aspect) becomes Kuja dosha — harsh temper in marriage, loss of spouse, repeated disputes.', hi: 'सप्तम भाव में मंगल (शुभ दृष्टि के बिना) कुज दोष बनाता है — विवाह में कठोर स्वभाव, जीवनसाथी की हानि, बारंबार विवाद।', gu: 'સપ્તમ ભાવમાં મંગળ (શુભ દૃષ્ટિ વિના) કુજ દોષ બને — લગ્નમાં કઠોર સ્વભાવ, જીવનસાથીની હાનિ, વારંવાર વિવાદ.', sa: 'सप्तमे मङ्गलः शुभदृष्टिविहीनः कुजदोषं जनयति — विवाहे कठोरस्वभावः, दम्पत्या हानिः, पुनः पुनः विवादाः।' },
  'classicalQuote.phd.sun.exalt.text':    { en: "The Sun in exaltation grants a strong constitution, royal favour, father's prosperity, and eminence among peers.", hi: 'उच्च सूर्य दृढ़ शरीर, राजकृपा, पिता की समृद्धि एवं सहकर्मियों में प्रतिष्ठा देता है।', gu: 'ઉચ્ચ સૂર્ય દૃઢ શરીર, રાજકૃપા, પિતાની સમૃદ્ધિ અને સહકર્મીઓમાં પ્રતિષ્ઠા આપે છે.', sa: 'उच्चे सूर्ये दृढं देहं राजकृपां पितुः समृद्धिं समानेषु प्रतिष्ठां च प्रयच्छति।' },
  'classicalQuote.phd.moon.debil.text':   { en: 'The Moon in Scorpio (debilitation) brings mental anxiety, early struggles with the mother, and emotional volatility.', hi: 'वृश्चिक में नीच चन्द्र मानसिक अशांति, माता से प्रारम्भिक संघर्ष एवं भावनात्मक अस्थिरता लाता है।', gu: 'વૃશ્ચિકમાં નીચ ચંદ્ર માનસિક અશાંતિ, માતા સાથે પ્રારંભિક સંઘર્ષ અને ભાવનાત્મક અસ્થિરતા લાવે છે.', sa: 'वृश्चिके नीचे चन्द्रे मानसिकाशान्तिः मातुः प्रारम्भिकः सङ्घर्षः भावास्थैर्यं च जायन्ते।' },
  'classicalQuote.phd.mercury.retro.text':{ en: 'Mercury retrograde bestows uncommon intellect but indirect speech; the native reconsiders before acting.', hi: 'वक्री बुध असाधारण बुद्धि देता है किन्तु वाणी अप्रत्यक्ष होती है; जातक कर्म से पूर्व पुनर्विचार करता है।', gu: 'વક્રી બુધ અસામાન્ય બુદ્ધિ આપે પણ વાણી અપ્રત્યક્ષ; જાતક કર્મ પહેલાં પુનઃવિચાર કરે છે.', sa: 'वक्रीबुधः असामान्यां बुद्धिं प्रयच्छति परम् अप्रत्यक्षां वाचम्; जातकः कर्मणः पूर्वं पुनर्विचारयति।' },
  'classicalQuote.phd.jupiter.02.text':   { en: 'Jupiter in the 2nd gives wealth through honorable means, scholarly family, and speech that persuades.', hi: 'द्वितीय भाव में बृहस्पति सम्मानपूर्वक धन, विद्वान कुटुम्ब एवं प्रेरक वाणी देता है।', gu: 'દ્વિતીય ભાવમાં બૃહસ્પતિ સન્માનપૂર્વક ધન, વિદ્વાન કુટુંબ અને પ્રેરક વાણી આપે છે.', sa: 'द्वितीये बृहस्पतिः सम्मान्यद्वारेण धनं विद्वत्कुटुम्बं प्रेरकवाचं च प्रयच्छति।' },
  'classicalQuote.phd.combust.sun.text':  { en: 'A planet combust by the Sun loses its power to deliver — the native puts forth effort, but the fruit is delayed.', hi: 'सूर्य से अस्त ग्रह फल देने की शक्ति खो देता है — जातक प्रयास करता है, परन्तु फल विलम्बित होता है।', gu: 'સૂર્યથી અસ્ત ગ્રહ ફળ આપવાની શક્તિ ગુમાવે — જાતક પ્રયત્ન કરે પણ ફળ વિલંબિત.', sa: 'सूर्येणास्तंगतो ग्रहो फलप्रदानशक्तिं नष्टयति — जातकः यत्नते परं फलं विलम्बितम्।' },
  'classicalQuote.phd.7.lord.6.text':     { en: 'The 7th lord in the 6th brings disputes in marriage, delay, or a spouse from a professional background.', hi: 'सप्तमेश छठे भाव में विवाह-विवाद, विलम्ब अथवा व्यावसायिक पृष्ठभूमि के जीवनसाथी को लाता है।', gu: 'સપ્તમેશ છઠ્ઠા ભાવમાં લગ્ન-વિવાદ, વિલંબ કે વ્યાવસાયિક પૃષ્ઠભૂમિના જીવનસાથીને લાવે.', sa: 'सप्तमेशः षष्ठे भावे विवाहविवादं विलम्बं वा व्यावसायिकपृष्ठभूम्यां दम्पतिं वा आनयति।' },
  'classicalQuote.uk.atmakaraka.text':    { en: "The planet of greatest longitude — the Atmakaraka — rules the soul's primary desires; its house and sign colour the whole life.", hi: 'सर्वोच्च देशान्तर वाला ग्रह — आत्मकारक — आत्मा की प्रमुख इच्छाओं का स्वामी होता है; उसका भाव एवं राशि सम्पूर्ण जीवन को रंगते हैं।', gu: 'સૌથી ઊંચા દેશાંતરનો ગ્રહ — આત્મકારક — આત્માની પ્રધાન ઇચ્છાઓનો સ્વામી; તેનો ભાવ અને રાશિ સમગ્ર જીવનને રંગે છે.', sa: 'सर्वाधिकदेशान्तरयुक्तो ग्रहः — आत्मकारकः — आत्मनः प्रधानेच्छानां स्वामी; तस्य भावो राशिश्च समग्रजीवनं रञ्जयतः।' },
  'classicalQuote.uk.venus.5.text':       { en: 'Venus in the 5th from lagna or Arudha brings fame in the arts, skill in poetry, and a charming first child.', hi: 'लग्न अथवा आरूढ से पंचम भाव में शुक्र कलाओं में कीर्ति, काव्य-कौशल एवं मनोहर प्रथम सन्तान देता है।', gu: 'લગ્ન કે આરૂઢથી પંચમ ભાવમાં શુક્ર કલાઓમાં કીર્તિ, કાવ્ય-કૌશલ અને મનોહર પ્રથમ સંતાન આપે.', sa: 'लग्नात् आरूढाद्वा पञ्चमे भावे शुक्रः कलासु कीर्तिं काव्यकौशलं मनोहरं प्रथमसन्ततिं च प्रयच्छति।' },
  'classicalQuote.uk.rahu.lagna.text':    { en: 'Rahu in the lagna causes the native to break convention — early rebellion, unusual appearance, appetite for foreign ideas.', hi: 'लग्न में राहु जातक को परम्परा-भंजक बनाता है — प्रारम्भिक विद्रोह, असाधारण रूप, विदेशी विचारों में रुचि।', gu: 'લગ્નમાં રાહુ જાતકને પરંપરા-ભંજક બનાવે — પ્રારંભિક વિદ્રોહ, અસામાન્ય રૂપ, વિદેશી વિચારોમાં રુચિ.', sa: 'लग्ने राहुः जातकं परम्पराभञ्जकं करोति — प्रारम्भिकं विद्रोहं असामान्यं रूपं विदेशीयविचारेषु रुचिं च।' },
  'classicalQuote.uk.ketu.12.text':       { en: 'Ketu in the 12th, without malefic affliction, gives spiritual insight, travel to distant lands, and detachment at the end of life.', hi: 'द्वादश भाव में अनपीड़ित केतु आध्यात्मिक अंतर्दृष्टि, दूरदेश यात्रा एवं अन्त-जीवन में वैराग्य देता है।', gu: 'દ્વાદશ ભાવમાં અપીડિત કેતુ આધ્યાત્મિક અંતર્દૃષ્ટિ, દૂરદેશ યાત્રા અને જીવન-અંતે વૈરાગ્ય આપે છે.', sa: 'द्वादशे केतुः अपीडितः सन् आध्यात्मिकीं अन्तर्दृष्टिं दूरदेशयात्रां जीवनान्ते वैराग्यं च प्रयच्छति।' },
  'classicalQuote.uk.saturn.07.text':     { en: 'Saturn in the 7th delays marriage but gives a serious, enduring partnership once it finally arrives.', hi: 'सप्तम भाव में शनि विवाह में विलम्ब करता है किन्तु अन्ततः आने पर गम्भीर एवं स्थायी सम्बन्ध देता है।', gu: 'સપ્તમ ભાવમાં શનિ લગ્નમાં વિલંબ કરે પણ આખરે ગંભીર અને સ્થાયી સંબંધ આપે છે.', sa: 'सप्तमे शनिः विवाहं विलम्बयति परम् अन्ते गम्भीरं स्थिरं च सम्बन्धं प्रयच्छति।' },
  'classicalQuote.jb.guru.mangala.text':  { en: 'Jupiter with Mars in any house forms Guru-Mangala yoga — righteous courage, success in law, good teachers, and protection of dharma.', hi: 'किसी भी भाव में बृहस्पति-मंगल युति गुरु-मंगल योग बनाती है — धार्मिक साहस, विधि-क्षेत्र में सफलता, उत्तम गुरु एवं धर्म-रक्षा।', gu: 'કોઈપણ ભાવમાં બૃહસ્પતિ-મંગળ યુતિ ગુરુ-મંગળ યોગ બનાવે — ધાર્મિક સાહસ, કાયદાક્ષેત્રે સફળતા, ઉત્તમ ગુરુ અને ધર્મ-રક્ષા.', sa: 'यत्र कुत्रचित् भावे बृहस्पतिमङ्गलयोः युतिः गुरुमङ्गलयोगं जनयति — धार्मिकसाहसं, विधिक्षेत्रे सफलतां, श्रेष्ठगुरून्, धर्मरक्षां च।' },
  'classicalQuote.jb.chandra.mangala.text':{ en: 'The Moon conjunct Mars (Chandra-Mangala yoga) gives wealth through real estate, trade, or mother-side inheritance — sometimes with emotional volatility.', hi: 'चन्द्र-मंगल युति चन्द्र-मंगल योग बनाती है — स्थावर सम्पत्ति, व्यापार अथवा मातृ-पक्ष की उत्तराधिकार से धन; कभी-कभी भावनात्मक अस्थिरता के साथ।', gu: 'ચંદ્ર-મંગળ યુતિ ચંદ્ર-મંગળ યોગ બનાવે — સ્થાવર સંપત્તિ, વેપાર કે માતૃપક્ષના વારસાથી ધન; ક્યારેક ભાવનાત્મક અસ્થિરતા સાથે.', sa: 'चन्द्रमङ्गलयोः युतिः चन्द्रमङ्गलयोगं जनयति — स्थावरसम्पत्तौ व्यापारे मातृपक्षस्य परम्परायाम् वा धनं; कदाचित् भावास्थैर्येण सह।' },
  'classicalQuote.jb.budha.aditya.text':  { en: 'Mercury with the Sun forms Budhaditya yoga — sharp intellect, administrative skill, and recognition for one\'s writing or speech.', hi: 'सूर्य-बुध युति बुधादित्य योग बनाती है — तीक्ष्ण बुद्धि, प्रशासनिक कौशल एवं लेखन-वक्तृत्व के लिए मान्यता।', gu: 'સૂર્ય-બુધ યુતિ બુધાદિત્ય યોગ બનાવે — તીક્ષ્ણ બુદ્ધિ, વહીવટી કૌશલ અને લેખન-વક્તૃત્વ માટે માન્યતા.', sa: 'सूर्यबुधयोः युतिः बुधादित्ययोगं जनयति — तीक्ष्णां बुद्धिं प्रशासकौशलं लेखनवक्तृत्वयोः च प्रसिद्धिम्।' },
  'classicalQuote.jb.gajakesari.text':    { en: 'Jupiter in a kendra from the Moon (Gaja-Kesari yoga) grants confident speech, respect in assemblies, and a commanding presence.', hi: 'चन्द्र से केन्द्र में बृहस्पति (गज-केसरी योग) आत्मविश्वासपूर्ण वाणी, सभाओं में आदर एवं प्रभावशाली उपस्थिति देता है।', gu: 'ચંદ્રથી કેન્દ્રમાં બૃહસ્પતિ (ગજ-કેસરી યોગ) આત્મવિશ્વાસપૂર્ણ વાણી, સભાઓમાં આદર અને પ્રભાવશાળી ઉપસ્થિતિ આપે.', sa: 'चन्द्रात् केन्द्रे बृहस्पतिः (गजकेसरीयोगः) आत्मविश्वासपूर्णां वाचं सभासु आदरं प्रभावशालिनीं उपस्थितिं च प्रयच्छति।' },
  'classicalQuote.jb.kemadruma.text':     { en: 'If no planet (other than the Sun or nodes) occupies the 2nd or 12th from the Moon, Kemadruma yoga is said to form — poverty and loneliness unless countered.', hi: 'यदि चन्द्र से द्वितीय या द्वादश भाव में कोई ग्रह (सूर्य या नोड्स के अतिरिक्त) न हो, केमद्रुम योग बनता है — दरिद्रता एवं एकाकीपन, जब तक प्रतिकार न हो।', gu: 'ચંદ્રથી દ્વિતીય કે દ્વાદશ ભાવમાં કોઈ ગ્રહ (સૂર્ય કે નોડ સિવાય) ન હોય તો કેમદ્રુમ યોગ બને — દરિદ્રતા અને એકાંત, જ્યાં સુધી પ્રતિકાર ન થાય.', sa: 'यदि चन्द्रात् द्वितीये द्वादशे वा भावे कोऽपि ग्रहः (सूर्यस्य राहोः केतोश्च विना) न तिष्ठति, केमद्रुमयोगो जायते — दारिद्र्यम् एकाकित्वं च, यावन्न प्रतीकारः।' },
  'classicalQuote.jb.panch.mahapurush.mars.text': { en: 'Mars in own sign or exaltation in a kendra from the lagna forms Ruchaka Mahapurusha yoga — military or athletic distinction, commanding presence, landed wealth.', hi: 'मंगल लग्न से केन्द्र में स्व या उच्च राशि में होकर रुचक महापुरुष योग बनाता है — सैन्य अथवा खेल में विशेषता, प्रभावशाली उपस्थिति, भू-सम्पत्ति।', gu: 'મંગળ લગ્નથી કેન્દ્રમાં સ્વ કે ઉચ્ચ રાશિમાં હોય તો રુચક મહાપુરુષ યોગ બને — સૈન્ય કે રમતક્ષેત્રમાં વિશેષતા, પ્રભાવી ઉપસ્થિતિ, ભૂ-સંપત્તિ.', sa: 'मङ्गलः लग्नात् केन्द्रे स्वराशौ उच्चे वा स्थितः रुचकमहापुरुषयोगं जनयति — सैन्ये क्रीडासु वा विशिष्टतां प्रभावशालिनीं उपस्थितिं भूसम्पत्तिं च।' },

  // ─ Encyclopedia: planet oneliners (9 grahas) ────────────────────────────
  'enc.SU.oneliner':       { en: 'The soul (atma), vitality, father, authority, ego.', hi: 'आत्मा, ओज, पिता, अधिकार, अहं।', gu: 'આત્મા, ઓજ, પિતા, અધિકાર, અહંકાર.', sa: 'आत्मा, ओजः, पिता, अधिकारः, अहङ्कारः।' },
  'enc.MO.oneliner':       { en: 'Mind (manas), mother, emotions, public, receptivity.', hi: 'मन, माता, भावनाएँ, जनसमूह, ग्रहणशीलता।', gu: 'મન, માતા, ભાવનાઓ, જનસમુદાય, ગ્રહણશીલતા.', sa: 'मनः, माता, भावनाः, जनसमूहः, ग्रहणशीलता।' },
  'enc.MA.oneliner':       { en: 'Warrior energy — courage, brothers, action, conflict.', hi: 'योद्धा-ऊर्जा — साहस, भाई, क्रिया, संघर्ष।', gu: 'યોદ્ધા-ઊર્જા — સાહસ, ભાઈઓ, ક્રિયા, સંઘર્ષ.', sa: 'योद्धृशक्तिः — साहसम्, सहोदराः, क्रिया, सङ्घर्षः।' },
  'enc.ME.oneliner':       { en: 'Intellect, speech, commerce, short journeys.', hi: 'बुद्धि, वाणी, व्यापार, लघु यात्राएँ।', gu: 'બુદ્ધિ, વાણી, વ્યવસાય, ટૂંકી યાત્રાઓ.', sa: 'बुद्धिः, वाक्, व्यापारः, लघुयात्राः।' },
  'enc.JU.oneliner':       { en: 'Wisdom, teacher, dharma, children, wealth.', hi: 'ज्ञान, गुरु, धर्म, सन्तान, धन।', gu: 'જ્ઞાન, ગુરુ, ધર્મ, સંતાન, ધન.', sa: 'ज्ञानम्, गुरुः, धर्मः, सन्ततिः, धनम्।' },
  'enc.VE.oneliner':       { en: 'Love, beauty, art, spouse (male chart), luxury.', hi: 'प्रेम, सौन्दर्य, कला, जीवनसाथी (पुरुष-कुण्डली), विलासिता।', gu: 'પ્રેમ, સૌંદર્ય, કલા, જીવનસાથી (પુરુષ-કુંડળી), વિલાસ.', sa: 'प्रेम, सौन्दर्यम्, कला, दम्पती (पुंसां कुण्डल्याम्), विलासः।' },
  'enc.SA.oneliner':       { en: 'Discipline, time, structure, longevity, restriction.', hi: 'अनुशासन, काल, संरचना, आयुष्य, बन्धन।', gu: 'અનુશાસન, કાળ, સંરચના, આયુષ્ય, બંધન.', sa: 'अनुशासनम्, कालः, संरचना, आयुः, बन्धनम्।' },
  'enc.RA.oneliner':       { en: 'Ambition, foreign influences, obsession, illusion.', hi: 'आकांक्षा, विदेशी प्रभाव, तीव्र मोह, माया।', gu: 'આકાંક્ષા, વિદેશી પ્રભાવ, તીવ્ર મોહ, માયા.', sa: 'आकाङ्क्षा, विदेशीयप्रभावः, तीव्रासक्तिः, माया।' },
  'enc.KE.oneliner':       { en: 'Detachment, spirituality, sudden insight, past karma.', hi: 'विरक्ति, आध्यात्मिकता, अकस्मात अंतर्दृष्टि, पूर्व कर्म।', gu: 'વિરક્તિ, આધ્યાત્મિકતા, અકસ્માત અંતર્દૃષ્ટિ, પૂર્વ કર્મ.', sa: 'विरक्तिः, आध्यात्मिकता, सहसा अन्तर्दृष्टिः, पूर्वकर्म।' },

  // ─ Encyclopedia: rashi oneliners (12 signs) ─────────────────────────────
  'enc.rashi-1.oneliner':  { en: 'Cardinal Fire — pioneering, energetic, head-first.',                       hi: 'चर अग्नि — अग्रणी, ऊर्जावान, साहसी।',                            gu: 'ચર અગ્નિ — અગ્રણી, ઊર્જાવાન, સાહસી.',                            sa: 'चराग्निः — अग्रगः, तेजस्वी, साहसिकः।' },
  'enc.rashi-2.oneliner':  { en: 'Fixed Earth — stable, sensual, persistent, value-driven.',                hi: 'स्थिर पृथ्वी — स्थिर, इन्द्रिय-प्रिय, दृढ़, मूल्य-केन्द्रित।',     gu: 'સ્થિર પૃથ્વી — સ્થિર, ઈન્દ્રિય-પ્રિય, દૃઢ, મૂલ્ય-કેન્દ્રિત.',     sa: 'स्थिरा पृथ्वी — स्थिरः, इन्द्रियप्रियः, दृढः, मूल्यकेन्द्रितः।' },
  'enc.rashi-3.oneliner':  { en: 'Mutable Air — curious, communicative, restless mind.',                    hi: 'द्विस्वभाव वायु — जिज्ञासु, संवादप्रिय, चंचल मन।',                gu: 'દ્વિસ્વભાવ વાયુ — જિજ્ઞાસુ, સંવાદપ્રિય, ચંચળ મન.',                sa: 'द्विस्वभावो वायुः — जिज्ञासुः, सम्भाषणप्रियः, चञ्चलमनाः।' },
  'enc.rashi-4.oneliner':  { en: 'Cardinal Water — nurturing, emotional, family-rooted.',                   hi: 'चर जल — पालनकर्ता, भावुक, पारिवारिक।',                          gu: 'ચર જળ — પાલનકર્તા, ભાવુક, કૌટુંબિક.',                          sa: 'चरम् उदकम् — पोषकः, भावुकः, कुटुम्बकेन्द्रितः।' },
  'enc.rashi-5.oneliner':  { en: 'Fixed Fire — royal, expressive, generous, dramatic.',                     hi: 'स्थिर अग्नि — राजसी, अभिव्यक्तिशील, उदार, नाटकीय।',              gu: 'સ્થિર અગ્નિ — રાજસી, અભિવ્યક્ત, ઉદાર, નાટકીય.',                 sa: 'स्थिराग्निः — राजसः, अभिव्यक्तिप्रियः, उदारः, नाट्यप्रियः।' },
  'enc.rashi-6.oneliner':  { en: 'Mutable Earth — analytical, service-minded, precise.',                    hi: 'द्विस्वभाव पृथ्वी — विश्लेषणात्मक, सेवापरायण, सूक्ष्म।',         gu: 'દ્વિસ્વભાવ પૃથ્વી — વિશ્લેષણાત્મક, સેવાપરાયણ, સૂક્ષ્મ.',          sa: 'द्विस्वभावा पृथ्वी — विश्लेषकः, सेवापरायणः, सूक्ष्मः।' },
  'enc.rashi-7.oneliner':  { en: 'Cardinal Air — diplomatic, partnership-oriented, refined.',               hi: 'चर वायु — कूटनीतिज्ञ, साझेदारी-केन्द्रित, परिष्कृत।',             gu: 'ચર વાયુ — કૂટનીતિજ્ઞ, ભાગીદારી-કેન્દ્રિત, પરિષ્કૃત.',             sa: 'चरो वायुः — कूटनीतिज्ञः, सहयोगकेन्द्रितः, परिष्कृतः।' },
  'enc.rashi-8.oneliner':  { en: 'Fixed Water — intense, secretive, transformative.',                       hi: 'स्थिर जल — तीव्र, गुप्त, परिवर्तनकारी।',                          gu: 'સ્થિર જળ — તીવ્ર, ગૂઢ, પરિવર્તનકારી.',                            sa: 'स्थिरम् उदकम् — तीव्रः, गुप्तः, परिवर्तनकारी।' },
  'enc.rashi-9.oneliner':  { en: 'Mutable Fire — philosophical, expansive, freedom-loving.',                hi: 'द्विस्वभाव अग्नि — दार्शनिक, विस्तृत, स्वतन्त्रता-प्रिय।',           gu: 'દ્વિસ્વભાવ અગ્નિ — દાર્શનિક, વિસ્તૃત, સ્વતંત્રતા-પ્રિય.',           sa: 'द्विस्वभावाग्निः — दार्शनिकः, विस्तीर्णः, स्वातन्त्र्यप्रियः।' },
  'enc.rashi-10.oneliner': { en: 'Cardinal Earth — disciplined, ambitious, patient, structural.',           hi: 'चर पृथ्वी — अनुशासित, महत्त्वाकांक्षी, धैर्यवान, संरचनात्मक।',     gu: 'ચર પૃથ્વી — અનુશાસિત, મહત્વાકાંક્ષી, ધૈર્યવાન, સંરચનાત્મક.',     sa: 'चरा पृथ्वी — अनुशासितः, महत्त्वाकाङ्क्षी, धैर्यवान्, सांरचनिकः।' },
  'enc.rashi-11.oneliner': { en: 'Fixed Air — innovative, humanitarian, unconventional.',                   hi: 'स्थिर वायु — नवप्रवर्तक, मानवतावादी, अपारम्परिक।',                gu: 'સ્થિર વાયુ — નવપ્રવર્તક, માનવતાવાદી, અપારંપરિક.',                sa: 'स्थिरो वायुः — नवप्रवर्तकः, मानवतावादी, अपारम्परिकः।' },
  'enc.rashi-12.oneliner': { en: 'Mutable Water — compassionate, mystical, dissolving boundaries.',         hi: 'द्विस्वभाव जल — करुणामय, रहस्यमय, सीमा-विलयकारी।',              gu: 'દ્વિસ્વભાવ જળ — કરુણામય, રહસ્યમય, સીમા-વિલયકારી.',              sa: 'द्विस्वभावम् उदकम् — करुणामयः, रहस्यमयः, सीमाविलयकारी।' },

  // ─ Encyclopedia: house oneliners (12 bhavas) ────────────────────────────
  'enc.house-1.oneliner':  { en: 'Self, body, appearance, overall life direction.',                hi: 'स्वयं, शरीर, रूप, जीवन-दिशा।',                          gu: 'સ્વયં, શરીર, રૂપ, જીવન-દિશા.',                          sa: 'आत्मा, देहः, रूपम्, जीवनदिशा।' },
  'enc.house-2.oneliner':  { en: 'Wealth, speech, family, food.',                                   hi: 'धन, वाणी, कुटुम्ब, भोजन।',                              gu: 'ધન, વાણી, કુટુંબ, ભોજન.',                              sa: 'धनम्, वाक्, कुटुम्बम्, भोजनम्।' },
  'enc.house-3.oneliner':  { en: 'Siblings, courage, communication, short journeys.',              hi: 'भाई-बहन, साहस, संवाद, लघु यात्राएँ।',                  gu: 'ભાઈ-બહેન, સાહસ, સંવાદ, ટૂંકી યાત્રાઓ.',                sa: 'सहोदराः, साहसम्, सम्भाषणम्, लघुयात्राः।' },
  'enc.house-4.oneliner':  { en: 'Mother, home, vehicles, inner happiness.',                       hi: 'माता, गृह, वाहन, आन्तरिक सुख।',                          gu: 'માતા, ઘર, વાહન, આંતરિક સુખ.',                          sa: 'माता, गृहम्, वाहनम्, आन्तरिकं सुखम्।' },
  'enc.house-5.oneliner':  { en: 'Children, intellect, romance, mantra-power.',                    hi: 'सन्तान, बुद्धि, प्रेम, मन्त्र-शक्ति।',                  gu: 'સંતાન, બુદ્ધિ, પ્રેમ, મંત્ર-શક્તિ.',                    sa: 'सन्ततिः, बुद्धिः, प्रेम, मन्त्रशक्तिः।' },
  'enc.house-6.oneliner':  { en: 'Enemies, debts, disease, daily service.',                        hi: 'शत्रु, ऋण, रोग, नित्य-सेवा।',                            gu: 'શત્રુઓ, ઋણ, રોગ, નિત્ય-સેવા.',                          sa: 'शत्रवः, ऋणम्, रोगः, नित्यसेवा।' },
  'enc.house-7.oneliner':  { en: 'Spouse, partnerships, public dealings.',                         hi: 'जीवनसाथी, साझेदारी, सार्वजनिक व्यवहार।',                  gu: 'જીવનસાથી, ભાગીદારી, જાહેર વ્યવહાર.',                    sa: 'दम्पती, सहयोगः, सार्वजनिकव्यवहारः।' },
  'enc.house-8.oneliner':  { en: 'Longevity, transformation, hidden matters, occult.',             hi: 'आयुष्य, परिवर्तन, गुप्त विषय, गुह्य विद्या।',           gu: 'આયુષ્ય, પરિવર્તન, ગુપ્ત બાબતો, ગૂઢ વિદ્યા.',             sa: 'आयुः, परिवर्तनम्, गुप्तविषयाः, गुह्यविद्या।' },
  'enc.house-9.oneliner':  { en: 'Fortune, dharma, father, higher learning, long journeys.',        hi: 'भाग्य, धर्म, पिता, उच्च शिक्षा, दीर्घ यात्राएँ।',         gu: 'ભાગ્ય, ધર્મ, પિતા, ઉચ્ચ શિક્ષણ, લાંબી યાત્રાઓ.',         sa: 'भाग्यम्, धर्मः, पिता, उच्चशिक्षणम्, दीर्घयात्राः।' },
  'enc.house-10.oneliner': { en: 'Career, status, public role, karma in the world.',                hi: 'कर्म, प्रतिष्ठा, सार्वजनिक भूमिका, सांसारिक कर्म।',      gu: 'કારકિર્દી, પ્રતિષ્ઠા, જાહેર ભૂમિકા, સાંસારિક કર્મ.',     sa: 'कर्म, प्रतिष्ठा, सार्वजनिकभूमिका, सांसारिककर्म।' },
  'enc.house-11.oneliner': { en: 'Gains, friends, hopes, fulfilment.',                              hi: 'लाभ, मित्र, आशाएँ, पूर्णता।',                            gu: 'લાભ, મિત્રો, આશાઓ, પૂર્ણતા.',                            sa: 'लाभः, मित्राणि, आशाः, पूर्णता।' },
  'enc.house-12.oneliner': { en: 'Loss, expenses, foreign lands, moksha.',                          hi: 'व्यय, हानि, विदेश, मोक्ष।',                              gu: 'વ્યય, હાનિ, વિદેશ, મોક્ષ.',                              sa: 'व्ययः, हानिः, विदेशः, मोक्षः।' },

  // ─ Encyclopedia: karaka oneliners (7 Jaimini karakas) ───────────────────
  'enc.karaka-AK.oneliner':  { en: 'The soul-significator — the planet of greatest longitude.',        hi: 'आत्म-कारक — सर्वाधिक देशान्तर वाला ग्रह।',                    gu: 'આત્મ-કારક — સૌથી ઊંચા દેશાંતરનો ગ્રહ.',                       sa: 'आत्मकारकः — सर्वाधिकदेशान्तरयुक्तो ग्रहः।' },
  'enc.karaka-AmK.oneliner': { en: 'The minister — the second-highest planet by longitude.',           hi: 'अमात्य-कारक — देशान्तर में दूसरा ग्रह।',                       gu: 'અમાત્ય-કારક — દેશાંતરમાં બીજો ગ્રહ.',                          sa: 'अमात्यकारकः — देशान्तरे द्वितीयः ग्रहः।' },
  'enc.karaka-BK.oneliner':  { en: 'Karaka of siblings, courage, brothers.',                            hi: 'भ्रातृ-कारक — भाई, साहस का सूचक।',                            gu: 'ભ્રાતૃ-કારક — ભાઈઓ, સાહસનો કારક.',                            sa: 'भ्रातृकारकः — सहोदरः, साहसस्य कारकः।' },
  'enc.karaka-MK.oneliner':  { en: 'Karaka of mother and home.',                                         hi: 'मातृ-कारक — माता, गृह का सूचक।',                                gu: 'માતૃ-કારક — માતા, ઘરનો કારક.',                                sa: 'मातृकारकः — मातुः गृहस्य च कारकः।' },
  'enc.karaka-PK.oneliner':  { en: 'Karaka of children and progeny.',                                    hi: 'पुत्र-कारक — सन्तान का सूचक।',                                  gu: 'પુત્ર-કારક — સંતાનનો કારક.',                                  sa: 'पुत्रकारकः — सन्ततेः कारकः।' },
  'enc.karaka-GK.oneliner':  { en: 'Karaka of relatives, cousins, hardships.',                          hi: 'ज्ञाति-कारक — स्वजन, कठिनाई का सूचक।',                          gu: 'જ્ઞાતિ-કારક — સ્વજનો, મુશ્કેલીઓનો કારક.',                       sa: 'ज्ञातिकारकः — स्वजनानां कष्टानां च कारकः।' },
  'enc.karaka-DK.oneliner':  { en: 'Karaka of spouse — the planet of lowest longitude.',                 hi: 'दार-कारक — जीवनसाथी का सूचक, सबसे न्यून देशान्तर।',             gu: 'દાર-કારક — જીવનસાથીનો કારક, સૌથી ઓછું દેશાંતર.',               sa: 'दारकारकः — दम्पत्या कारकः, न्यूनतमदेशान्तरः।' },

  // ─ Chakras: kalanala state names (Jwala / Dhuma / Shanta) ───────────────
  'chakras.kalanala.state.Jwala':  { en: 'Jwala',  hi: 'ज्वाला', gu: 'જ્વાળા',  sa: 'ज्वाला' },
  'chakras.kalanala.state.Dhuma':  { en: 'Dhuma',  hi: 'धूम',    gu: 'ધૂમ',     sa: 'धूमः' },
  'chakras.kalanala.state.Shanta': { en: 'Shanta', hi: 'शान्त',   gu: 'શાંત',    sa: 'शान्तः' },
  'chakras.kalanala.summary.peaceful': { en: 'All planets rest in Shanta positions — the Moon wheel is peaceful.', hi: 'सभी ग्रह शान्त स्थानों में हैं — चन्द्र-चक्र शान्त है।', gu: 'બધા ગ્રહો શાંત સ્થાનોમાં છે — ચંદ્ર-ચક્ર શાંત છે.', sa: 'सर्वे ग्रहाः शान्तस्थानेषु तिष्ठन्ति — चन्द्रचक्रं शान्तम्।' },
  'chakras.kalanala.summary.afflicted': { en: '{n} planet{plural} in Jwala/Dhuma — apply remedies or delay major actions.', hi: '{n} ग्रह ज्वाला/धूम में हैं — उपाय करें या प्रमुख कार्य विलम्बित करें।', gu: '{n} ગ્રહ જ્વાળા/ધૂમમાં — ઉપાય કરો કે મુખ્ય કાર્ય વિલંબિત કરો.', sa: '{n} ग्रहाः ज्वालाधूमयोः — उपायं कुर्यात् मुख्यकर्म विलम्बयेत् वा।' },

  // ─ Chakras: Kota zone names ─────────────────────────────────────────────
  'chakras.kota.zone.Stambha': { en: 'Stambha', hi: 'स्तम्भ', gu: 'સ્તંભ', sa: 'स्तम्भः' },
  'chakras.kota.zone.Madhya':  { en: 'Madhya',  hi: 'मध्य',   gu: 'મધ્ય',  sa: 'मध्यम्' },
  'chakras.kota.zone.Prakara': { en: 'Prakara', hi: 'प्राकार', gu: 'પ્રાકાર', sa: 'प्राकारः' },
  'chakras.kota.zone.Bahya':   { en: 'Bahya',   hi: 'बाह्य',   gu: 'બાહ્ય',  sa: 'बाह्यः' },
  'chakras.kota.summary.threat':       { en: '{att} attacker(s) inside the fort vs {def} defender(s) — guard health & finances.', hi: 'किले के भीतर {att} आक्रमणकारी बनाम {def} रक्षक — स्वास्थ्य व वित्त की रक्षा करें।', gu: 'કિલ્લાની અંદર {att} આક્રમણકારી vs {def} રક્ષક — આરોગ્ય અને નાણાંની રક્ષા કરો.', sa: 'दुर्गाभ्यन्तरे {att} आक्रमकाः {def} रक्षकाश्च — आरोग्यं वित्तं च रक्षेत्।' },
  'chakras.kota.summary.holds':        { en: '{def} defender(s) inside, {att} attacker(s) — fortress holds.', hi: '{def} रक्षक भीतर, {att} आक्रमणकारी — किला सुरक्षित है।', gu: '{def} રક્ષક અંદર, {att} આક્રમણકારી — કિલ્લો સુરક્ષિત.', sa: '{def} रक्षकाः अन्तः, {att} आक्रमकाः — दुर्गं सुरक्षितम्।' },
  'chakras.kota.summary.empty':        { en: 'Fortress empty — life events proceed at their own pace.', hi: 'किला खाली — जीवन की घटनाएँ अपनी गति से चलती हैं।', gu: 'કિલ્લો ખાલી — જીવનની ઘટનાઓ પોતાની ગતિએ ચાલે છે.', sa: 'दुर्गं रिक्तम् — जीवनघटनाः स्वगत्या प्रचलन्ति।' },

  // ─ Chakras: Sarvatobhadra direction notes ───────────────────────────────
  'chakras.sarvato.note.auspicious': { en: 'Auspicious — safe for travel/action', hi: 'शुभ — यात्रा/कर्म हेतु सुरक्षित',     gu: 'શુભ — યાત્રા/કર્મ માટે સુરક્ષિત',    sa: 'शुभम् — यात्रायै कर्मणे च सुरक्षितम्' },
  'chakras.sarvato.note.afflicted':  { en: 'Afflicted — avoid major undertakings',hi: 'पीड़ित — प्रमुख कार्य त्यागें',           gu: 'પીડિત — મુખ્ય કાર્યો ટાળો',          sa: 'पीडितम् — मुख्यकर्मणि वर्जयेत्' },
  'chakras.sarvato.note.neutral':    { en: 'Neutral — ordinary results',           hi: 'सामान्य — साधारण फल',                  gu: 'સામાન્ય — સામાન્ય ફળ',               sa: 'सामान्यम् — सामान्यफलम्' },

  // ─ Chakras: Shoola today notes ──────────────────────────────────────────
  'chakras.shoola.note.inThorn': { en: 'Moon is in a thorn nakshatra ({nak}) on {day} — avoid travel toward {dir}.', hi: 'चन्द्र शूल नक्षत्र ({nak}) में है {day} पर — {dir} दिशा में यात्रा त्यागें।', gu: 'ચંદ્ર શૂળ નક્ષત્ર ({nak})માં છે {day}ના રોજ — {dir} દિશામાં યાત્રા ટાળો.', sa: 'चन्द्रः शूलनक्षत्रे ({nak}) {day} दिने — {dir} दिशायां यात्रां वर्जयेत्।' },
  'chakras.shoola.note.clear':   { en: 'Moon clear of thorn naks; ordinary travel OK, still avoid {dir} direction if possible.', hi: 'चन्द्र शूल नक्षत्रों से मुक्त; सामान्य यात्रा ठीक, यथासम्भव {dir} दिशा से बचें।', gu: 'ચંદ્ર શૂળ નક્ષત્રોથી મુક્ત; સામાન્ય યાત્રા ઠીક, શક્ય તો {dir} દિશાથી બચો.', sa: 'चन्द्रः शूलनक्षत्रेभ्यो मुक्तः; सामान्यया यात्रया युज्यते, यथासम्भवं {dir} दिशायां वर्जयेत्।' },

  // ─ Chakras: Chatushpata pada metadata (4 padas + deity + element + guidance) ──
  'chakras.pada.Purva.name':      { en: 'Purva',    hi: 'पूर्व',    gu: 'પૂર્વ',     sa: 'पूर्वा' },
  'chakras.pada.Dakshina.name':   { en: 'Dakshina', hi: 'दक्षिण',  gu: 'દક્ષિણ',   sa: 'दक्षिणा' },
  'chakras.pada.Paschim.name':    { en: 'Paschim',  hi: 'पश्चिम',  gu: 'પશ્ચિમ',   sa: 'पश्चिमा' },
  'chakras.pada.Uttara.name':     { en: 'Uttara',   hi: 'उत्तर',    gu: 'ઉત્તર',    sa: 'उत्तरा' },
  'chakras.deity.Agni':           { en: 'Agni',     hi: 'अग्नि',    gu: 'અગ્નિ',    sa: 'अग्निः' },
  'chakras.deity.Yama':           { en: 'Yama',     hi: 'यम',       gu: 'યમ',       sa: 'यमः' },
  'chakras.deity.Varuna':         { en: 'Varuna',   hi: 'वरुण',     gu: 'વરુણ',     sa: 'वरुणः' },
  'chakras.deity.Kubera':         { en: 'Kubera',   hi: 'कुबेर',     gu: 'કુબેર',     sa: 'कुबेरः' },
  'chakras.element.Fire':         { en: 'Fire',     hi: 'अग्नि',    gu: 'અગ્નિ',    sa: 'अग्निः' },
  'chakras.element.Earth':        { en: 'Earth',    hi: 'पृथ्वी',    gu: 'પૃથ્વી',    sa: 'पृथ्वी' },
  'chakras.element.Water':        { en: 'Water',    hi: 'जल',       gu: 'જળ',       sa: 'जलम्' },
  'chakras.element.Metal':        { en: 'Metal',    hi: 'धातु',     gu: 'ધાતુ',      sa: 'धातुः' },
  'chakras.pada.Purva.guidance':    { en: 'Threshold, first-entry, bhoomi-puja',     hi: 'देहली, प्रथम-प्रवेश, भूमि-पूजा',      gu: 'દ્વાર, પ્રથમ-પ્રવેશ, ભૂમિ-પૂજા',      sa: 'द्वारम्, प्रथमप्रवेशः, भूमिपूजा' },
  'chakras.pada.Dakshina.guidance': { en: 'Avoid new construction or openings',      hi: 'नये निर्माण या उद्घाटन से बचें',           gu: 'નવા બાંધકામ કે ઉદ્ઘાટનથી બચો',         sa: 'नवनिर्माणम् उद्घाटनं वा वर्जयेत्' },
  'chakras.pada.Paschim.guidance':  { en: 'Foundation / well-digging / plumbing',    hi: 'नींव / कुआँ खोदना / नल-कार्य',          gu: 'પાયો / કુવો ખોદવો / નળ-કાર્ય',          sa: 'भित्तेरारम्भः / कूपखननम् / नलकार्यम्' },
  'chakras.pada.Uttara.guidance':   { en: 'Safes, treasury, gold, crown stone',      hi: 'तिजोरी, कोष, स्वर्ण, मुकुट-शिला',          gu: 'તિજોરી, ખજાનો, સોનું, મુકુટ-પથ્થર',     sa: 'तिजोरी, कोषः, सुवर्णम्, मुकुटशिला' },

  // ─ Specialty deep services: closed-enum labels (career/medical/marital/financial/vastu) ──
  // Score label tiers (career/marital/financial use 4-5 tiers each)
  'specialty.score.high-achievement': { en: 'High achievement', hi: 'उच्च सिद्धि',     gu: 'ઉચ્ચ સિદ્ધિ',     sa: 'उच्चसिद्धिः' },
  'specialty.score.strong':           { en: 'Strong',           hi: 'दृढ़',           gu: 'દૃઢ',            sa: 'दृढः' },
  'specialty.score.moderate':         { en: 'Moderate',         hi: 'मध्यम',          gu: 'મધ્યમ',          sa: 'मध्यमः' },
  'specialty.score.struggle':         { en: 'Struggle',         hi: 'संघर्ष',         gu: 'સંઘર્ષ',         sa: 'सङ्घर्षः' },
  'specialty.score.excellent':        { en: 'Excellent',        hi: 'उत्तम',          gu: 'ઉત્તમ',          sa: 'उत्तमः' },
  'specialty.score.good':             { en: 'Good',             hi: 'अच्छा',          gu: 'સારું',           sa: 'सुष्ठु' },
  'specialty.score.weak':             { en: 'Weak',             hi: 'दुर्बल',         gu: 'નબળું',          sa: 'दुर्बलः' },
  'specialty.score.poor':             { en: 'Poor',             hi: 'खराब',           gu: 'ખરાબ',          sa: 'अयोग्यम्' },
  'specialty.score.harmonious':       { en: 'Harmonious',       hi: 'सामंजस्यपूर्ण',  gu: 'સામંજસ્યપૂર્ણ',  sa: 'सामञ्जस्यपूर्णम्' },
  'specialty.score.challenging':      { en: 'Challenging',      hi: 'चुनौतीपूर्ण',     gu: 'પડકારજનક',      sa: 'चुनौतीपूर्णम्' },
  'specialty.score.wealthy':          { en: 'Wealthy',          hi: 'सम्पन्न',         gu: 'સંપન્ન',         sa: 'सम्पन्नः' },
  'specialty.score.affluent':         { en: 'Affluent',         hi: 'समृद्ध',          gu: 'સમૃદ્ધ',         sa: 'समृद्धः' },
  'specialty.score.middle':           { en: 'Middle income',    hi: 'मध्य आय',         gu: 'મધ્યમ આવક',      sa: 'मध्यमा आयः' },
  'specialty.score.tight':            { en: 'Tight',            hi: 'तंग',            gu: 'તાણ',            sa: 'सङ्कटः' },
  // Marital scoreLabel actuals: 'strong'|'favourable'|'mixed'|'challenged'
  'specialty.score.favourable':       { en: 'Favourable',       hi: 'अनुकूल',         gu: 'અનુકૂળ',         sa: 'अनुकूलम्' },
  'specialty.score.mixed':            { en: 'Mixed',            hi: 'मिश्र',          gu: 'મિશ્ર',           sa: 'मिश्रम्' },
  'specialty.score.challenged':       { en: 'Challenged',       hi: 'चुनौतीपूर्ण',     gu: 'પડકારગ્રસ્ત',    sa: 'सङ्कटापन्नः' },
  // Financial scoreLabel actuals: 'exceptional'|'prosperous'|'moderate'|'slow'
  'specialty.score.exceptional':      { en: 'Exceptional',      hi: 'असाधारण',        gu: 'અસાધારણ',       sa: 'असाधारणम्' },
  'specialty.score.prosperous':       { en: 'Prosperous',       hi: 'समृद्ध',         gu: 'સમૃદ્ધ',         sa: 'समृद्धः' },
  'specialty.score.slow':             { en: 'Slow',             hi: 'धीमा',           gu: 'ધીમું',          sa: 'मन्दः' },
  // Medical overallLabel actuals: 'robust'|'balanced'|'watch'|'fragile'
  'specialty.score.robust':           { en: 'Robust',           hi: 'सशक्त',          gu: 'સશક્ત',          sa: 'सशक्तः' },
  'specialty.score.balanced':         { en: 'Balanced',         hi: 'संतुलित',        gu: 'સંતુલિત',        sa: 'सन्तुलितः' },
  'specialty.score.watch':            { en: 'Watch',            hi: 'सावधान',         gu: 'સાવધાન',         sa: 'सावधानम्' },
  'specialty.score.fragile':          { en: 'Fragile',          hi: 'क्षीण',          gu: 'ક્ષીણ',          sa: 'क्षीणः' },

  // Lord state (used in career.tenthHouse and marital.seventhHouse)
  'specialty.lordState.strong':  { en: 'strong',  hi: 'दृढ़',     gu: 'દૃઢ',     sa: 'दृढः' },
  'specialty.lordState.neutral': { en: 'neutral', hi: 'सामान्य',  gu: 'સામાન્ય', sa: 'सामान्यः' },
  'specialty.lordState.weak':    { en: 'weak',    hi: 'दुर्बल',   gu: 'નબળું',   sa: 'दुर्बलः' },

  // Longevity band (medical-deep)
  'specialty.longevity.short':  { en: 'short',  hi: 'लघु',    gu: 'ટૂંકું',   sa: 'अल्पम्' },
  'specialty.longevity.medium': { en: 'medium', hi: 'मध्यम',  gu: 'મધ્યમ',  sa: 'मध्यमम्' },
  'specialty.longevity.long':   { en: 'long',   hi: 'दीर्घ',   gu: 'દીર્ઘ',   sa: 'दीर्घम्' },
  // Verbatim longevity strings emitted by medical-deep (sanskrit-tagged with English gloss)
  'specialty.longevity.alpayu (short)':     { en: 'alpayu (short)',      hi: 'अल्पायु (लघु)',    gu: 'અલ્પાયુ (ટૂંકું)',   sa: 'अल्पायुः' },
  'specialty.longevity.madhyayu (middle)':  { en: 'madhyayu (middle)',   hi: 'मध्यायु (मध्यम)',  gu: 'મધ્યાયુ (મધ્યમ)',   sa: 'मध्यायुः' },
  'specialty.longevity.poornayu (long)':    { en: 'poornayu (long)',     hi: 'पूर्णायु (दीर्घ)',  gu: 'પૂર્ણાયુ (દીર્ઘ)',  sa: 'पूर्णायुः' },

  // Direction strings (for vastu/career/marital — overlap with translator.direction
  // but service emits 8 cardinal-pair forms with hyphen — list them explicitly here)
  'specialty.direction.East':       { en: 'East',       hi: 'पूर्व',         gu: 'પૂર્વ',        sa: 'पूर्वा' },
  'specialty.direction.West':       { en: 'West',       hi: 'पश्चिम',        gu: 'પશ્ચિમ',       sa: 'पश्चिमा' },
  'specialty.direction.North':      { en: 'North',      hi: 'उत्तर',          gu: 'ઉત્તર',        sa: 'उत्तरा' },
  'specialty.direction.South':      { en: 'South',      hi: 'दक्षिण',        gu: 'દક્ષિણ',       sa: 'दक्षिणा' },
  'specialty.direction.North-East': { en: 'North-East', hi: 'ईशान',          gu: 'ઈશાન',         sa: 'ईशान्या' },
  'specialty.direction.South-West': { en: 'South-West', hi: 'नैऋत्य',         gu: 'નૈઋત્ય',       sa: 'नैऋत्या' },
  'specialty.direction.North-West': { en: 'North-West', hi: 'वायव्य',         gu: 'વાયવ્ય',       sa: 'वायव्या' },
  'specialty.direction.South-East': { en: 'South-East', hi: 'आग्नेय',         gu: 'આગ્નેય',       sa: 'आग्नेयी' },
  'specialty.direction.Brahmasthan': { en: 'Brahmasthan', hi: 'ब्रह्मस्थान',  gu: 'બ્રહ્મસ્થાન',  sa: 'ब्रह्मस्थानम्' },
  // Vastu service emits 2-letter codes (E/SE/S/SW/W/NW/N/NE/C); add code aliases
  'specialty.direction.E':  { en: 'East',        hi: 'पूर्व',     gu: 'પૂર્વ',     sa: 'पूर्वा' },
  'specialty.direction.SE': { en: 'South-East',  hi: 'आग्नेय',    gu: 'આગ્નેય',    sa: 'आग्नेयी' },
  'specialty.direction.S':  { en: 'South',       hi: 'दक्षिण',    gu: 'દક્ષિણ',    sa: 'दक्षिणा' },
  'specialty.direction.SW': { en: 'South-West',  hi: 'नैऋत्य',     gu: 'નૈઋત્ય',    sa: 'नैऋत्या' },
  'specialty.direction.W':  { en: 'West',        hi: 'पश्चिम',    gu: 'પશ્ચિમ',    sa: 'पश्चिमा' },
  'specialty.direction.NW': { en: 'North-West',  hi: 'वायव्य',     gu: 'વાયવ્ય',    sa: 'वायव्या' },
  'specialty.direction.N':  { en: 'North',       hi: 'उत्तर',      gu: 'ઉત્તર',     sa: 'उत्तरा' },
  'specialty.direction.NE': { en: 'North-East',  hi: 'ईशान',       gu: 'ઈશાન',      sa: 'ईशान्या' },
  'specialty.direction.C':  { en: 'Brahmasthan', hi: 'ब्रह्मस्थान', gu: 'બ્રહ્મસ્થાન', sa: 'ब्रह्मस्थानम्' },

  // ─ Lal Kitab — karza names, reason templates, remedies, scope labels ────
  // 6 karzas (karmic debts), 9 planet remedies, 3 scope tags. The reason +
  // angular templates use {h} for house number and {malefics} for joined
  // planet IDs (RA/SA/KE).

  // Karza names
  'lalkitab.karza.pitri.name':   { en: 'Pitri Rin (debt of father)',   hi: 'पितृ ऋण (पिता का ऋण)',        gu: 'પિતૃ ઋણ (પિતાનું ઋણ)',         sa: 'पितृऋणम् (पितुः ऋणम्)' },
  'lalkitab.karza.matri.name':   { en: 'Matri Rin (debt of mother)',   hi: 'मातृ ऋण (माता का ऋण)',        gu: 'માતૃ ઋણ (માતાનું ઋણ)',         sa: 'मातृऋणम् (मातुः ऋणम्)' },
  'lalkitab.karza.stree.name':   { en: 'Stree Rin (debt to female)',   hi: 'स्त्री ऋण (स्त्री का ऋण)',     gu: 'સ્ત્રી ઋણ (સ્ત્રીનું ઋણ)',     sa: 'स्त्रीऋणम् (स्त्रियाः ऋणम्)' },
  'lalkitab.karza.santan.name':  { en: 'Santan Rin (debt to children)',hi: 'सन्तान ऋण (सन्तान का ऋण)',    gu: 'સંતાન ઋણ (સંતાનનું ઋણ)',       sa: 'सन्तानऋणम् (सन्तानस्य ऋणम्)' },
  'lalkitab.karza.atma.name':    { en: 'Atma Rin (debt of self)',      hi: 'आत्म ऋण (स्वयं का ऋण)',       gu: 'આત્મ ઋણ (પોતાનું ઋણ)',         sa: 'आत्मऋणम् (आत्मनः ऋणम्)' },
  'lalkitab.karza.brathru.name': { en: 'Brathru Rin (debt to siblings)',hi: 'भ्रातृ ऋण (भाई का ऋण)',      gu: 'ભ્રાતૃ ઋણ (ભાઈનું ઋણ)',        sa: 'भ्रातृऋणम् (भ्रातुः ऋणम्)' },

  // Karza reason — when present (templated)
  'lalkitab.karza.pitri.reason.afflicted':   { en: 'Sun in H{h} conjunct {malefics}',           hi: 'सूर्य भाव {h} में {malefics} के साथ',           gu: 'સૂર્ય ભાવ {h}માં {malefics} સાથે',           sa: 'सूर्यः {h}-भावे {malefics}-युक्तः' },
  'lalkitab.karza.matri.reason.afflicted':   { en: 'Moon in H{h} conjunct {malefics}',          hi: 'चन्द्र भाव {h} में {malefics} के साथ',          gu: 'ચંદ્ર ભાવ {h}માં {malefics} સાથે',           sa: 'चन्द्रः {h}-भावे {malefics}-युक्तः' },
  'lalkitab.karza.stree.reason.conjunct':    { en: 'Venus conjunct {malefics}',                 hi: 'शुक्र {malefics} के साथ',                       gu: 'શુક્ર {malefics} સાથે',                      sa: 'शुक्रः {malefics}-युक्तः' },
  'lalkitab.karza.stree.reason.in7':         { en: 'Venus in 7th with malefics',                hi: 'शुक्र सप्तम भाव में पापग्रहों के साथ',           gu: 'શુક્ર સાતમા ભાવમાં પાપગ્રહો સાથે',          sa: 'शुक्रः सप्तमे पापग्रहैः सह' },
  'lalkitab.karza.santan.reason.afflicted':  { en: 'Jupiter in 5th conjunct {malefics}',        hi: 'गुरु पंचम भाव में {malefics} के साथ',           gu: 'ગુરુ પંચમ ભાવમાં {malefics} સાથે',           sa: 'गुरुः पञ्चमे {malefics}-युक्तः' },
  'lalkitab.karza.atma.reason.ke1':          { en: 'Ketu in Lagna',                             hi: 'केतु लग्न में',                                  gu: 'કેતુ લગ્નમાં',                              sa: 'केतुः लग्ने' },
  'lalkitab.karza.atma.reason.suke':         { en: 'Sun conjunct Ketu',                         hi: 'सूर्य केतु के साथ',                              gu: 'સૂર્ય કેતુ સાથે',                           sa: 'सूर्यः केतुयुक्तः' },
  'lalkitab.karza.brathru.reason.afflicted': { en: 'Mars in 3rd conjunct {malefics}',           hi: 'मंगल तृतीय भाव में {malefics} के साथ',          gu: 'મંગળ તૃતીય ભાવમાં {malefics} સાથે',          sa: 'मङ्गलः तृतीये {malefics}-युक्तः' },

  // Karza reason — when clear/absent
  'lalkitab.karza.pitri.reason.clear':   { en: 'Sun unafflicted in relevant houses',  hi: 'सूर्य सम्बद्ध भावों में पीड़ित नहीं', gu: 'સૂર્ય સંબંધિત ભાવોમાં પીડિત નથી', sa: 'सूर्यः प्रासङ्गिकेषु भावेषु अपीडितः' },
  'lalkitab.karza.matri.reason.clear':   { en: 'Moon unafflicted in relevant houses', hi: 'चन्द्र सम्बद्ध भावों में पीड़ित नहीं', gu: 'ચંદ્ર સંબંધિત ભાવોમાં પીડિત નથી', sa: 'चन्द्रः प्रासङ्गिकेषु भावेषु अपीडितः' },
  'lalkitab.karza.stree.reason.clear':   { en: 'Venus free',                          hi: 'शुक्र मुक्त',                          gu: 'શુક્ર મુક્ત',                       sa: 'शुक्रः मुक्तः' },
  'lalkitab.karza.santan.reason.clear':  { en: 'Jupiter free in 5th context',         hi: 'गुरु पंचम सन्दर्भ में मुक्त',          gu: 'ગુરુ પંચમ સંદર્ભમાં મુક્ત',         sa: 'गुरुः पञ्चमसन्दर्भे मुक्तः' },
  'lalkitab.karza.atma.reason.clear':    { en: 'no signature',                        hi: 'कोई संकेत नहीं',                       gu: 'કોઈ સંકેત નથી',                     sa: 'किमपि लक्षणं नास्ति' },
  'lalkitab.karza.brathru.reason.clear': { en: 'Mars free in 3rd context',            hi: 'मंगल तृतीय सन्दर्भ में मुक्त',         gu: 'મંગળ તૃતીય સંદર્ભમાં મુક્ત',        sa: 'मङ्गलः तृतीयसन्दर्भे मुक्तः' },

  // Planet remedy — title (relates the remedy theme), action (concrete upaya), timing
  'lalkitab.remedy.SU.title':  { en: 'Sun — honour father',         hi: 'सूर्य — पिता का सम्मान',           gu: 'સૂર્ય — પિતાનો આદર',                sa: 'सूर्यः — पितुः सम्मानम्' },
  'lalkitab.remedy.MO.title':  { en: 'Moon — honour mother',        hi: 'चन्द्र — माता का सम्मान',          gu: 'ચંદ્ર — માતાનો આદર',                sa: 'चन्द्रः — मातुः सम्मानम्' },
  'lalkitab.remedy.MA.title':  { en: 'Mars — pacify aggression',    hi: 'मंगल — आक्रामकता शान्त करना',      gu: 'મંગળ — આક્રમકતા શાંત કરવી',         sa: 'मङ्गलः — आक्रोशशमनम्' },
  'lalkitab.remedy.ME.title':  { en: 'Mercury — cleanse speech',    hi: 'बुध — वाणी की शुद्धि',             gu: 'બુધ — વાણીની શુદ્ધિ',               sa: 'बुधः — वाक्शुद्धिः' },
  'lalkitab.remedy.JU.title':  { en: 'Jupiter — respect elders',    hi: 'गुरु — गुरुजनों का आदर',           gu: 'ગુરુ — વડીલોનો આદર',                sa: 'गुरुः — गुरुजनसम्मानम्' },
  'lalkitab.remedy.VE.title':  { en: 'Venus — respect women',       hi: 'शुक्र — स्त्रियों का सम्मान',       gu: 'શુક્ર — સ્ત્રીઓનો આદર',             sa: 'शुक्रः — स्त्रीसम्मानम्' },
  'lalkitab.remedy.SA.title':  { en: 'Saturn — serve the weak',     hi: 'शनि — दीन-दुखियों की सेवा',        gu: 'શનિ — દીન-દુખીઓની સેવા',            sa: 'शनिः — दीनसेवा' },
  'lalkitab.remedy.RA.title':  { en: 'Rahu — purify mind',          hi: 'राहु — मन की शुद्धि',              gu: 'રાહુ — મનની શુદ્ધિ',                sa: 'राहुः — मनःशुद्धिः' },
  'lalkitab.remedy.KE.title':  { en: 'Ketu — support dogs/strays',  hi: 'केतु — कुत्तों/अनाथों की सहायता',  gu: 'કેતુ — કૂતરા/અનાથોને મદદ',         sa: 'केतुः — श्वानानाम् अनाथानां च सेवा' },

  'lalkitab.remedy.SU.action': { en: 'Offer water to rising Sun; avoid copper gifts from elders', hi: 'उगते सूर्य को जल अर्पित करें; गुरुजनों से ताम्र उपहार न लें',     gu: 'ઉગતા સૂર્યને જળ અર્પણ કરો; વડીલો પાસેથી તાંબાની ભેટ ન લો',     sa: 'उद्यद्भास्वते जलार्पणम्; गुरुजनात् ताम्रप्रदानं वर्जयेत्' },
  'lalkitab.remedy.MO.action': { en: 'Carry silver in pocket; offer milk to silver idol',          hi: 'जेब में चाँदी रखें; चाँदी की मूर्ति पर दूध चढ़ाएँ',                gu: 'ખિસ્સામાં ચાંદી રાખો; ચાંદીની મૂર્તિ પર દૂધ ચઢાવો',           sa: 'रजतं पात्रे धरेत्; रजतमूर्तौ क्षीरार्पणम्' },
  'lalkitab.remedy.MA.action': { en: 'Donate sweet red items to temple; avoid blood sport',         hi: 'मिठे लाल पदार्थ मन्दिर में दान करें; रक्त-क्रीड़ा से बचें',           gu: 'મીઠી લાલ વસ્તુઓ મંદિરમાં દાન કરો; રક્ત-ક્રીડાથી દૂર રહો',     sa: 'मधुरं रक्तद्रव्यं देवालये दानम्; रक्तक्रीडां वर्जयेत्' },
  'lalkitab.remedy.ME.action': { en: 'Feed green fodder to cows; avoid lying',                      hi: 'गायों को हरा चारा दें; असत्य भाषण से बचें',                          gu: 'ગાયોને લીલો ચારો ખવડાવો; અસત્ય બોલવાનું ટાળો',                sa: 'गोभ्यः हरितचारदानम्; असत्यभाषणं वर्जयेत्' },
  'lalkitab.remedy.JU.action': { en: 'Donate turmeric/gram/yellow cloth to temple Brahmin',         hi: 'मन्दिर के ब्राह्मण को हल्दी/चना/पीला वस्त्र दान करें',                  gu: 'મંદિરના બ્રાહ્મણને હળદર/ચણા/પીળું વસ્ત્ર દાન કરો',           sa: 'देवालयब्राह्मणाय हरिद्रा-चणक-पीतवस्त्रदानम्' },
  'lalkitab.remedy.VE.action': { en: 'Donate white items (rice/curd/silver) to widow or temple',    hi: 'विधवा या मन्दिर में श्वेत वस्तुएँ (चावल/दही/चाँदी) दान करें',         gu: 'વિધવા કે મંદિરમાં શ્વેત વસ્તુઓ (ચોખા/દહીં/ચાંદી) દાન કરો',  sa: 'विधवायै देवालयाय वा शुक्लद्रव्यदानम् (तण्डुल-दधि-रजतम्)' },
  'lalkitab.remedy.SA.action': { en: 'Feed mustard oil/black sesame to crows; help labourers',      hi: 'कौओं को सरसों तेल/काले तिल खिलाएँ; श्रमिकों की सहायता करें',           gu: 'કાગડાઓને સરસવનું તેલ/કાળા તલ આપો; શ્રમિકોને મદદ કરો',         sa: 'काकेभ्यः सर्षपतैल-कृष्णतिलार्पणम्; श्रमिकानां सहायः' },
  'lalkitab.remedy.RA.action': { en: 'Flow 400g coal in flowing water; avoid blue clothes',         hi: '400 ग्राम कोयला बहते जल में प्रवाहित करें; नीले वस्त्र न पहनें',      gu: '400 ગ્રામ કોલસો વહેતા જળમાં વહાવો; વાદળી વસ્ત્ર ન પહેરો',     sa: 'सार्धचतुष्शतग्राम-अङ्गारं प्रवाहजले विसर्जयेत्; नीलवस्त्रं वर्जयेत्' },
  'lalkitab.remedy.KE.action': { en: 'Feed dogs; donate black-and-white blanket',                   hi: 'कुत्तों को खिलाएँ; काला-सफेद कम्बल दान करें',                          gu: 'કૂતરાઓને ખવડાવો; કાળો-સફેદ કંબલ દાન કરો',                     sa: 'श्वानेभ्यः अन्नदानम्; कृष्णशुक्ल-कम्बलदानम्' },

  'lalkitab.remedy.SU.timing': { en: 'Every Sunday morning', hi: 'प्रत्येक रविवार प्रातः', gu: 'દરેક રવિવાર સવારે', sa: 'प्रति रविवासरे प्रातः' },
  'lalkitab.remedy.MO.timing': { en: 'Every Monday',         hi: 'प्रत्येक सोमवार',        gu: 'દરેક સોમવારે',       sa: 'प्रति सोमवासरे' },
  'lalkitab.remedy.MA.timing': { en: 'Every Tuesday',        hi: 'प्रत्येक मंगलवार',       gu: 'દરેક મંગળવારે',      sa: 'प्रति मङ्गलवासरे' },
  'lalkitab.remedy.ME.timing': { en: 'Every Wednesday',      hi: 'प्रत्येक बुधवार',        gu: 'દરેક બુધવારે',       sa: 'प्रति बुधवासरे' },
  'lalkitab.remedy.JU.timing': { en: 'Every Thursday',       hi: 'प्रत्येक गुरुवार',       gu: 'દરેક ગુરુવારે',      sa: 'प्रति गुरुवासरे' },
  'lalkitab.remedy.VE.timing': { en: 'Every Friday',         hi: 'प्रत्येक शुक्रवार',      gu: 'દરેક શુક્રવારે',     sa: 'प्रति शुक्रवासरे' },
  'lalkitab.remedy.SA.timing': { en: 'Every Saturday',       hi: 'प्रत्येक शनिवार',        gu: 'દરેક શનિવારે',       sa: 'प्रति शनिवासरे' },
  'lalkitab.remedy.RA.timing': { en: 'Every Saturday',       hi: 'प्रत्येक शनिवार',        gu: 'દરેક શનિવારે',       sa: 'प्रति शनिवासरे' },
  'lalkitab.remedy.KE.timing': { en: 'Every Saturday',       hi: 'प्रत्येक शनिवार',        gu: 'દરેક શનિવારે',       sa: 'प्रति शनिवासरे' },

  // Scope tags + composed templates
  'lalkitab.scope.karza':     { en: 'karza',     hi: 'कर्ज़ा',       gu: 'કર્ઝા',     sa: 'ऋणम्' },
  'lalkitab.scope.angular':   { en: 'angular',   hi: 'केन्द्रस्थ',  gu: 'કેન્દ્રસ્થ', sa: 'केन्द्रस्थ' },
  'lalkitab.scope.universal': { en: 'universal', hi: 'सार्वत्रिक',  gu: 'સાર્વત્રિક', sa: 'सार्वत्रिक' },
  'lalkitab.angular.title':   { en: '{planet} in angular house {h}', hi: '{planet} केन्द्र भाव {h} में', gu: '{planet} કેન્દ્ર ભાવ {h}માં', sa: '{planet}: केन्द्रभावे {h}' },

  // ─ Festivals: reason templates + Hindu masa names ───────────────────────
  'festivals.reason.solar':     { en: 'Sun enters {rashi}',                 hi: 'सूर्य का {rashi} में प्रवेश',          gu: 'સૂર્યનો {rashi}માં પ્રવેશ',           sa: 'सूर्यः {rashi} राशिं प्रविशति' },
  'festivals.reason.tithi':     { en: '{masa} {paksha} {tithi}',            hi: '{masa} {paksha} {tithi}',              gu: '{masa} {paksha} {tithi}',              sa: '{masa} {paksha} {tithi}' },
  'festivals.reason.nakshatra': { en: 'Moon in {nakshatra}',                hi: 'चन्द्र {nakshatra} नक्षत्र में',         gu: 'ચંદ્ર {nakshatra} નક્ષત્રમાં',           sa: 'चन्द्रः {nakshatra} नक्षत्रे' },

  'festivals.masa.Chaitra':      { en: 'Chaitra',     hi: 'चैत्र',     gu: 'ચૈત્ર',     sa: 'चैत्रः' },
  'festivals.masa.Vaishakha':    { en: 'Vaishakha',   hi: 'वैशाख',    gu: 'વૈશાખ',    sa: 'वैशाखः' },
  'festivals.masa.Jyeshtha':     { en: 'Jyeshtha',    hi: 'ज्येष्ठ',   gu: 'જ્યેષ્ઠ',   sa: 'ज्येष्ठः' },
  'festivals.masa.Ashadha':      { en: 'Ashadha',     hi: 'आषाढ़',    gu: 'અષાઢ',     sa: 'आषाढः' },
  'festivals.masa.Shravana':     { en: 'Shravana',    hi: 'श्रावण',    gu: 'શ્રાવણ',    sa: 'श्रावणः' },
  'festivals.masa.Bhadrapada':   { en: 'Bhadrapada',  hi: 'भाद्रपद',   gu: 'ભાદ્રપદ',   sa: 'भाद्रपदः' },
  'festivals.masa.Ashwin':       { en: 'Ashwin',      hi: 'आश्विन',    gu: 'આશ્વિન',    sa: 'आश्विनः' },
  'festivals.masa.Kartika':      { en: 'Kartika',     hi: 'कार्तिक',   gu: 'કાર્તિક',   sa: 'कार्तिकः' },
  'festivals.masa.Margashirsha': { en: 'Margashirsha',hi: 'मार्गशीर्ष', gu: 'માર્ગશીર્ષ',sa: 'मार्गशीर्षः' },
  'festivals.masa.Pausha':       { en: 'Pausha',      hi: 'पौष',       gu: 'પોષ',       sa: 'पौषः' },
  'festivals.masa.Magha':        { en: 'Magha',       hi: 'माघ',       gu: 'મહા',       sa: 'माघः' },
  'festivals.masa.Phalguna':     { en: 'Phalguna',    hi: 'फाल्गुन',   gu: 'ફાગણ',      sa: 'फाल्गुनः' },

  // ─ Festivals: per-entry note prose (only entries with non-empty `note`) ──
  'festivals.note.makara-sankranti':{ en: 'Sun enters Capricorn — start of Uttarayana observance', hi: 'सूर्य का मकर में प्रवेश — उत्तरायण आरम्भ', gu: 'સૂર્યનો મકરમાં પ્રવેશ — ઉત્તરાયણ આરંભ', sa: 'सूर्यस्य मकरप्रवेशः — उत्तरायणारम्भः' },
  'festivals.note.mesha-sankranti': { en: 'Sun enters Aries — solar new year', hi: 'सूर्य का मेष में प्रवेश — सौर नववर्ष', gu: 'સૂર્યનો મેષમાં પ્રવેશ — સૌર નવવર્ષ', sa: 'सूर्यस्य मेषप्रवेशः — सौरनववर्षम्' },
  'festivals.note.karka-sankranti': { en: 'Sun enters Cancer — start of Dakshinayana', hi: 'सूर्य का कर्क में प्रवेश — दक्षिणायन आरम्भ', gu: 'સૂર્યનો કર્કમાં પ્રવેશ — દક્ષિણાયન આરંભ', sa: 'सूर्यस्य कर्कप्रवेशः — दक्षिणायनारम्भः' },
  'festivals.note.ugadi':          { en: 'Lunar new year (Chaitra Shukla Pratipada)', hi: 'चान्द्र नववर्ष (चैत्र शुक्ल प्रतिपदा)', gu: 'ચાંદ્ર નવવર્ષ (ચૈત્ર શુક્લ પ્રતિપદા)', sa: 'चान्द्रनववर्षम् (चैत्रशुक्लप्रतिपदा)' },
  'festivals.note.diwali':         { en: 'Kartika Amavasya — festival of lights', hi: 'कार्तिक अमावस्या — दीपों का त्योहार', gu: 'કાર્તિક અમાવસ્યા — દીપોનો તહેવાર', sa: 'कार्तिकामावस्या — दीपोत्सवः' },
  'festivals.note.shukla-ekadashi':{ en: 'Shukla paksha Ekadashi (every month)',  hi: 'शुक्ल पक्ष एकादशी (प्रतिमास)', gu: 'શુક્લ પક્ષ એકાદશી (દર મહિને)', sa: 'शुक्लपक्षैकादशी (प्रतिमासम्)' },
  'festivals.note.krishna-ekadashi':{ en: 'Krishna paksha Ekadashi (every month)', hi: 'कृष्ण पक्ष एकादशी (प्रतिमास)', gu: 'કૃષ્ણ પક્ષ એકાદશી (દર મહિને)', sa: 'कृष्णपक्षैकादशी (प्रतिमासम्)' },
  'festivals.note.pradosh-shukla': { en: 'Trayodashi — every month',          hi: 'त्रयोदशी — प्रतिमास',          gu: 'ત્રયોદશી — દર મહિને',         sa: 'त्रयोदशी — प्रतिमासम्' },
  'festivals.note.amavasya-monthly':{ en: 'New Moon — every month',           hi: 'अमावस्या — प्रतिमास',          gu: 'અમાવસ્યા — દર મહિને',         sa: 'अमावस्या — प्रतिमासम्' },
  'festivals.note.purnima-monthly':{ en: 'Full Moon — every month',           hi: 'पूर्णिमा — प्रतिमास',           gu: 'પૂર્ણિમા — દર મહિને',         sa: 'पूर्णिमा — प्रतिमासम्' },

  // ─ Classical refs: per-entry topic + text (BPHS / Saravali / Phaladeepika / Hora Sara) ──
  'classicalRef.bphs.24.15.topic': { en: 'Sun in 10th house',                  hi: 'सूर्य दशम भाव में',                gu: 'સૂર્ય દશમ ભાવમાં',                sa: 'सूर्यः दशमे भावे' },
  'classicalRef.bphs.24.15.text':  { en: 'A person born with the Sun in the 10th house obtains great government favor, high status, and respect from authority.', hi: 'दशम भाव में सूर्य के होने पर जातक को राजकीय कृपा, उच्च पद और सत्ता का सम्मान प्राप्त होता है।', gu: 'દશમ ભાવમાં સૂર્ય હોય ત્યારે જાતકને રાજકીય કૃપા, ઉચ્ચ પદ અને સત્તાનું સન્માન મળે છે.', sa: 'दशमे भावे सूर्ये जातकः राजकृपां उच्चपदं अधिकाराद् आदरं च लभते।' },

  'classicalRef.bphs.24.20.topic': { en: 'Moon in 4th house',                  hi: 'चंद्र चतुर्थ भाव में',              gu: 'ચંદ્ર ચતુર્થ ભાવમાં',             sa: 'चन्द्रः चतुर्थे भावे' },
  'classicalRef.bphs.24.20.text':  { en: "The Moon in the 4th house bestows happiness, mother's love, vehicles, property and a peaceful home life.", hi: 'चतुर्थ भाव में चंद्र सुख, माता का प्रेम, वाहन, संपत्ति और शांत गृहस्थ जीवन प्रदान करता है।', gu: 'ચતુર્થ ભાવમાં ચંદ્ર સુખ, માતાનો પ્રેમ, વાહન, સંપત્તિ અને શાંત ગૃહસ્થ જીવન આપે છે.', sa: 'चतुर्थे भावे चन्द्रः सुखं मातृप्रेम वाहनं सम्पत्तिं शान्तं गृहस्थजीवनं च प्रयच्छति।' },

  'classicalRef.bphs.36.5.topic':  { en: 'Ruchaka Mahapurusha Yoga',           hi: 'रुचक महापुरुष योग',              gu: 'રુચક મહાપુરુષ યોગ',              sa: 'रुचक-महापुरुषयोगः' },
  'classicalRef.bphs.36.5.text':   { en: 'Mars in own sign or exalted, placed in a kendra, forms Ruchaka — produces a fearless leader, wealthy and famous.', hi: 'मंगल स्व राशि अथवा उच्च होकर केन्द्र में स्थित होने पर रुचक योग बनता है — निर्भय नेता, धनवान एवं यशस्वी।', gu: 'મંગળ સ્વ રાશિ કે ઉચ્ચ થઈ કેન્દ્રમાં હોય ત્યારે રુચક યોગ બને છે — નિર્ભય નેતા, ધનવાન અને યશસ્વી.', sa: 'मङ्गलः स्वराशौ उच्चे वा केन्द्रे स्थितः रुचकयोगं जनयति — निर्भयः नेता धनवान् यशस्वी च।' },

  'classicalRef.saravali.33.8.topic': { en: 'Gajakesari Yoga',                 hi: 'गजकेसरी योग',                   gu: 'ગજકેસરી યોગ',                   sa: 'गजकेसरीयोगः' },
  'classicalRef.saravali.33.8.text':  { en: 'When Jupiter occupies a kendra from the Moon, Gajakesari Yoga is formed — the native is respected by kings and learned men.', hi: 'जब बृहस्पति चंद्र से केन्द्र में स्थित हो, गजकेसरी योग बनता है — जातक राजाओं एवं विद्वानों द्वारा सम्मानित होता है।', gu: 'જ્યારે બૃહસ્પતિ ચંદ્રથી કેન્દ્રમાં હોય ત્યારે ગજકેસરી યોગ બને છે — જાતકને રાજાઓ અને વિદ્વાનો સન્માન આપે છે.', sa: 'यदा बृहस्पतिः चन्द्रात् केन्द्रे तिष्ठति तदा गजकेसरीयोगः जायते — जातकः नृपैः विद्वद्भिश्च मान्यते।' },

  'classicalRef.phaladeepika.6.4.topic': { en: 'Lakshmi Yoga (5th lord in 9th)', hi: 'लक्ष्मी योग (पंचमेश नवम में)',     gu: 'લક્ષ્મી યોગ (પંચમેશ નવમમાં)',     sa: 'लक्ष्मीयोगः (पञ्चमेशः नवमे)' },
  'classicalRef.phaladeepika.6.4.text':  { en: 'When the lord of the 5th house occupies the 9th, the native enjoys wealth, blessings of Lakshmi, and progeny.', hi: 'पंचम भाव का स्वामी नवम भाव में स्थित होने पर जातक को धन, लक्ष्मी की कृपा एवं सन्तान सुख प्राप्त होता है।', gu: 'પંચમ ભાવનો સ્વામી નવમ ભાવમાં હોય ત્યારે જાતકને ધન, લક્ષ્મીની કૃપા અને સંતાન-સુખ મળે છે.', sa: 'पञ्चमस्य भावस्य अधिपः नवमे स्थितः सन् जातकाय धनं लक्ष्मीकृपां सन्ततिं च प्रदाति।' },

  'classicalRef.horasara.7.2.topic': { en: 'Budhaditya Yoga',                 hi: 'बुधादित्य योग',                  gu: 'બુધાદિત્ય યોગ',                  sa: 'बुधादित्ययोगः' },
  'classicalRef.horasara.7.2.text':  { en: 'Sun and Mercury together in any house create Budhaditya — sharp intellect, learning, and skill in speech.', hi: 'किसी भी भाव में सूर्य और बुध की युति बुधादित्य योग बनाती है — तीक्ष्ण बुद्धि, विद्या एवं वाक्-कौशल।', gu: 'કોઈપણ ભાવમાં સૂર્ય અને બુધની યુતિ બુધાદિત્ય યોગ બનાવે છે — તીક્ષ્ણ બુદ્ધિ, વિદ્યા અને વાક્-કૌશલ.', sa: 'सूर्यबुधयोः यत्र कुत्रचित् भावे युतिः बुधादित्ययोगं जनयति — तीक्ष्णबुद्धिः विद्या वाक्कौशलं च।' },

  // ─ Classical refs: display tag labels (only the human-facing ones) ───────
  'classicalRef.tag.career':       { en: 'career',        hi: 'कर्म',           gu: 'કારકિર્દી',        sa: 'कर्म' },
  'classicalRef.tag.dhana':        { en: 'wealth',        hi: 'धन',             gu: 'ધન',             sa: 'धनम्' },
  'classicalRef.tag.kendra':       { en: 'kendra',        hi: 'केन्द्र',         gu: 'કેન્દ્ર',         sa: 'केन्द्रम्' },
  'classicalRef.tag.mahapurusha':  { en: 'mahapurusha',   hi: 'महापुरुष',       gu: 'મહાપુરુષ',       sa: 'महापुरुषः' },
  'classicalRef.tag.gajakesari':   { en: 'gajakesari',    hi: 'गजकेसरी',        gu: 'ગજકેસરી',        sa: 'गजकेसरी' },
  'classicalRef.tag.budhaditya':   { en: 'budhaditya',    hi: 'बुधादित्य',      gu: 'બુધાદિત્ય',      sa: 'बुधादित्यः' },

  // ─ Interpretation: topic templates ──────────────────────────────────────
  'interpret.topic.ascendant':     { en: 'Ascendant — {sign}',                          hi: 'लग्न — {sign}',                          gu: 'લગ્ન — {sign}',                          sa: 'लग्नम् — {sign}' },
  'interpret.topic.planetInHouse': { en: '{planet} in house {h}',                        hi: '{planet} भाव {h} में',                    gu: '{planet} ભાવ {h}માં',                     sa: '{planet} {h} भावे' },
  'interpret.topic.planetInSign':  { en: '{planet} in {sign}',                           hi: '{planet} {sign} राशि में',                 gu: '{planet} {sign} રાશિમાં',                  sa: '{planet} {sign} राशौ' },
  'interpret.topic.lordInHouse':   { en: 'Lord of house {l} ({lord}) in house {h}',      hi: 'भाव {l} का स्वामी ({lord}) भाव {h} में',   gu: 'ભાવ {l}નો સ્વામી ({lord}) ભાવ {h}માં',    sa: '{l} भावस्य स्वामी ({lord}) {h} भावे' },

  // ─ Gemstone: verdicts ────────────────────────────────────────────────────
  'gemstone.verdict.strongly recommended': { en: 'strongly recommended', hi: 'अत्यन्त अनुशंसित', gu: 'અત્યંત ભલામણ કરેલ',  sa: 'अत्यन्तं प्रशस्तम्' },
  'gemstone.verdict.recommended':          { en: 'recommended',          hi: 'अनुशंसित',         gu: 'ભલામણ કરેલ',         sa: 'प्रशस्तम्' },
  'gemstone.verdict.optional':             { en: 'optional',             hi: 'वैकल्पिक',         gu: 'વૈકલ્પિક',           sa: 'विकल्पः' },
  'gemstone.verdict.avoid':                { en: 'avoid',                hi: 'त्यागें',           gu: 'ટાળો',              sa: 'त्याज्यम्' },
  'gemstone.verdict.strictly avoid':       { en: 'strictly avoid',       hi: 'पूर्णतः त्यागें',  gu: 'પૂર્ણપણે ટાળો',     sa: 'पूर्णतः त्याज्यम्' },

  // ─ Gemstone: hand (right/either) ─────────────────────────────────────────
  'gemstone.hand.right':  { en: 'right',  hi: 'दाहिना', gu: 'જમણો',  sa: 'दक्षिणः' },
  'gemstone.hand.either': { en: 'either', hi: 'कोई भी',  gu: 'કોઈપણ', sa: 'कोऽपि' },

  // ─ Gemstone: reasons (recommendation prose) ──────────────────────────────
  'gemstone.reason.yogakaraka':         { en: 'Yogakaraka for {rashi} ascendant',                        hi: '{rashi} लग्न के लिए योगकारक',                                     gu: '{rashi} લગ્ન માટે યોગકારક',                                       sa: '{rashi} लग्नस्य योगकारकः' },
  'gemstone.reason.ascLord':            { en: 'Ascendant lord',                                           hi: 'लग्नेश',                                                              gu: 'લગ્નેશ',                                                             sa: 'लग्नेशः' },
  'gemstone.reason.functionalBenefic':  { en: 'Functional benefic',                                       hi: 'क्रियात्मक शुभ ग्रह',                                                gu: 'કાર્યાત્મક શુભ ગ્રહ',                                              sa: 'कार्यात्मकशुभग्रहः' },
  'gemstone.reason.weakBenefic':        { en: 'Weak but benefic — stone will boost',                      hi: 'दुर्बल किन्तु शुभ — रत्न से बल बढ़ेगा',                                gu: 'નબળો પણ શુભ — રત્ન બળ વધારશે',                                  sa: 'दुर्बलः किन्तु शुभः — रत्नेन बलवृद्धिः' },
  'gemstone.reason.debilitatedBenefic': { en: 'Debilitated benefic — urgent remedy',                      hi: 'नीच परन्तु शुभ — तत्काल उपाय आवश्यक',                              gu: 'નીચ પણ શુભ — તાત્કાલિક ઉપાય જરૂરી',                            sa: 'नीचः शुभः — तत्क्षणं उपायः आवश्यकः' },
  'gemstone.reason.maraka':             { en: 'MARAKA — maraka stones can trigger severe issues',          hi: 'मारक — मारक रत्न गम्भीर समस्याएँ उत्पन्न कर सकते हैं',          gu: 'મારક — મારક રત્નો ગંભીર સમસ્યાઓ સર્જી શકે',                   sa: 'मारकः — मारकरत्नानि गुरुदोषं जनयन्ति' },
  'gemstone.reason.functionalMalefic':  { en: 'Functional malefic for this ascendant',                    hi: 'इस लग्न हेतु क्रियात्मक पाप ग्रह',                                gu: 'આ લગ્ન માટે કાર્યાત્મક પાપ ગ્રહ',                                 sa: 'अस्य लग्नस्य कार्यात्मकपापग्रहः' },
  'gemstone.reason.rahuCaution':        { en: 'Rahu stones amplify karmic extremes — use cautiously',     hi: 'राहु रत्न कर्मजन्य अति-स्थितियाँ बढ़ाते हैं — सावधानी से प्रयोग करें', gu: 'રાહુ રત્નો કર્મજન્ય અતિ-સ્થિતિઓ વધારે છે — સાવધાનીથી પ્રયોગ કરો', sa: 'राहुरत्नानि कर्मजन्यान् अतिचारान् वर्धयन्ति — सावधानेन प्रयोगः' },
  'gemstone.reason.ketuCaution':        { en: 'Ketu stones accelerate detachment — use cautiously',       hi: 'केतु रत्न वैराग्य त्वरित करते हैं — सावधानी से प्रयोग करें',     gu: 'કેતુ રત્નો વૈરાગ્યને ઝડપી કરે છે — સાવધાનીથી પ્રયોગ કરો',     sa: 'केतुरत्नानि वैराग्यं त्वरयन्ति — सावधानेन प्रयोगः' },
  'gemstone.reason.veryStrong':         { en: 'Already very strong — stone may overload',                  hi: 'पहले से अति-बलवान — रत्न अधिभार उत्पन्न कर सकता है',          gu: 'પહેલેથી જ ખૂબ બળવાન — રત્ન અતિભાર સર્જી શકે',                  sa: 'पूर्वमेव अतिबलवान् — रत्नं अतिभारं जनयेत्' },
  'gemstone.reason.combust':            { en: 'Combust — stone helps reclaim voice',                       hi: 'अस्तंगत — रत्न अभिव्यक्ति पुनः प्राप्त करने में सहायक',           gu: 'અસ્તંગત — રત્ન અભિવ્યક્તિ પુનઃ પ્રાપ્ત કરવામાં સહાયક',         sa: 'अस्तङ्गतः — रत्नं अभिव्यक्तिप्रत्यागमने साहाय्यकम्' },
  'gemstone.reason.exalted':            { en: 'Exalted — already radiant; stone optional',                  hi: 'उच्च — पहले से ही दीप्त; रत्न वैकल्पिक',                            gu: 'ઉચ્ચ — પહેલેથી જ દીપ્ત; રત્ન વૈકલ્પિક',                          sa: 'उच्चस्थः — पूर्वमेव दीप्तः; रत्नं विकल्पः' },

  // ─ Gemstone: hour label & nakshatra preference ───────────────────────────
  'gemstone.hour.fromSunrise':         { en: 'Sunrise +{h1}:00 → +{h2}:00',  hi: 'सूर्योदय +{h1}:00 → +{h2}:00', gu: 'સૂર્યોદય +{h1}:00 → +{h2}:00', sa: 'सूर्योदयात् +{h1}:00 → +{h2}:00' },

  // ─ Gemstone: procedure steps ─────────────────────────────────────────────
  'gemstone.procedure.bathe':         { en: "Bathe and wear clean clothes in the gemstone's colour ({colour}).", hi: 'स्नान कर रत्न के वर्ण ({colour}) के स्वच्छ वस्त्र धारण करें।', gu: 'સ્નાન કરી રત્નના રંગ ({colour}) ના સ્વચ્છ વસ્ત્ર ધારણ કરો.', sa: 'स्नात्वा रत्नवर्णस्य ({colour}) शुद्धवस्त्राणि धारयेत्।' },
  'gemstone.procedure.cleanse':       { en: 'Cleanse the ring in Gangajal / unboiled milk / honey + ghee + tulsi for 15 min.', hi: 'अंगूठी को गंगाजल / कच्चा दूध / मधु + घृत + तुलसी में 15 मिनट तक शुद्ध करें।', gu: 'વીંટીને ગંગાજળ / કાચા દૂધ / મધ + ઘી + તુલસીમાં 15 મિનિટ સુધી શુદ્ધ કરો.', sa: 'अङ्गुलीयं गङ्गाजलेन / कच्चदुग्धेन / मधुघृततुलसीभिः पञ्चदशमिनिटं शुद्धं कुर्यात्।' },
  'gemstone.procedure.placeOnPlate':  { en: 'Place on a {metal} plate facing {direction}.', hi: '{metal} थाली में {direction} दिशा की ओर रखें।', gu: '{metal} થાળીમાં {direction} દિશા તરફ રાખો.', sa: '{metal}पात्रे {direction}-दिशां प्रति स्थापयेत्।' },
  'gemstone.procedure.reciteMantra':  { en: 'Recite bija mantra {count} times (or in multiples of 108).', hi: 'बीज मंत्र {count} बार जप करें (अथवा 108 के गुणकों में)।', gu: 'બીજ મંત્રનો {count} વખત જાપ કરો (અથવા 108 ના ગુણાંકોમાં).', sa: 'बीजमन्त्रं {count} वारं जपेत् (अष्टोत्तरशतगुणितैः वा)।' },
  'gemstone.procedure.wear':          { en: 'Wear on {finger} finger of {hand} hand during the chosen hora.', hi: 'चयनित होरा में {hand} हाथ की {finger} अंगुली में धारण करें।', gu: 'પસંદ કરેલ હોરામાં {hand} હાથની {finger} આંગળીમાં ધારણ કરો.', sa: 'निर्वाचितायां होरायां {hand}हस्तस्य {finger}अङ्गुलौ धारयेत्।' },
  'gemstone.procedure.observe':       { en: 'Observe for 30-40 days; discontinue if discomfort appears.', hi: '30-40 दिनों तक परीक्षण करें; असुविधा होने पर त्याग दें।', gu: '30-40 દિવસ સુધી પરીક્ષણ કરો; અસુવિધા જણાય તો ત્યાગ કરો.', sa: 'त्रिंशच्चत्वारिंशद्दिनानि परीक्षणं कुर्यात्; असुविधायां त्याज्यम्।' },

  // ─ Gemstone: report note ─────────────────────────────────────────────────
  'gemstone.note.noFavorable':        { en: 'No strongly favorable graha in this chart — consider spiritual remedies (mantra, charity, yantra) over gemstones.', hi: 'इस चार्ट में कोई अत्यन्त अनुकूल ग्रह नहीं — रत्नों के स्थान पर आध्यात्मिक उपायों (मंत्र, दान, यंत्र) पर विचार करें।', gu: 'આ ચાર્ટમાં કોઈ અત્યંત અનુકૂળ ગ્રહ નથી — રત્નોની જગ્યાએ આધ્યાત્મિક ઉપાયો (મંત્ર, દાન, યંત્ર) પર વિચાર કરો.', sa: 'अस्मिन् कुण्डले अत्यन्तानुकूलः ग्रहः नास्ति — रत्नानां स्थाने आध्यात्मिक-उपायाः (मन्त्रः, दानम्, यन्त्रम्) चिन्त्यन्ताम्।' },
  'gemstone.note.primary':            { en: 'Primary recommendation: {stone} for {planet}. Wear {ratti} ratti (~{carat} carat) set in {metal} on the {finger} finger.', hi: 'मुख्य अनुशंसा: {planet} के लिए {stone}। {finger} अंगुली में {metal} में जड़ा {ratti} रत्ती (~{carat} कैरेट) धारण करें।', gu: 'મુખ્ય ભલામણ: {planet} માટે {stone}. {finger} આંગળીમાં {metal} માં જડેલા {ratti} રત્તી (~{carat} કેરેટ) ધારણ કરો.', sa: 'मुख्या अनुशंसा: {planet}-निमित्तं {stone}। {finger}अङ्गुलौ {metal}-निर्मिते {ratti} रत्तीप्रमाणं (~{carat} कैरेट्) धारयेत्।' },

  // ─ Yantra: shape ─────────────────────────────────────────────────────────
  'yantra.shape.square':   { en: 'square',   hi: 'वर्ग',     gu: 'ચોરસ',    sa: 'चतुरस्रम्' },
  'yantra.shape.triangle': { en: 'triangle', hi: 'त्रिभुज',  gu: 'ત્રિકોણ',  sa: 'त्रिकोणम्' },
  'yantra.shape.hexagon':  { en: 'hexagon',  hi: 'षट्कोण', gu: 'ષટ્કોણ',  sa: 'षट्कोणम्' },
  'yantra.shape.circle':   { en: 'circle',   hi: 'वृत्त',     gu: 'વર્તુળ',  sa: 'वृत्तम्' },
  'yantra.shape.octagon':  { en: 'octagon',  hi: 'अष्टकोण', gu: 'અષ્ટકોણ', sa: 'अष्टकोणम्' },
  'yantra.shape.pentagon': { en: 'pentagon', hi: 'पंचकोण',  gu: 'પંચકોણ',  sa: 'पञ्चकोणम्' },

  // ─ Yantra: mudras (closed-set) ───────────────────────────────────────────
  'yantra.mudra.Surya Mudra': { en: 'Surya Mudra', hi: 'सूर्य मुद्रा', gu: 'સૂર્ય મુદ્રા', sa: 'सूर्यमुद्रा' },

  // ─ Yantra: installation steps (per-graha, ordered) ───────────────────────
  'yantra.install.SU.0': { en: 'Select Sunday at sunrise during Shukla Paksha.', hi: 'शुक्ल पक्ष में रविवार सूर्योदय का चयन करें।', gu: 'શુક્લ પક્ષમાં રવિવાર સૂર્યોદય પસંદ કરો.', sa: 'शुक्लपक्षे रविवासरे सूर्योदये निर्वचनं कुर्यात्।' },
  'yantra.install.SU.1': { en: 'Bathe and wear clean red or saffron clothing.', hi: 'स्नान कर लाल अथवा भगवा वस्त्र धारण करें।', gu: 'સ્નાન કરી લાલ અથવા કેસરી વસ્ત્ર ધારણ કરો.', sa: 'स्नात्वा रक्तं काषायं वा वस्त्रं धारयेत्।' },
  'yantra.install.SU.2': { en: 'Face east. Place the yantra on a red cloth.', hi: 'पूर्व मुख होकर बैठें। यंत्र को लाल वस्त्र पर रखें।', gu: 'પૂર્વાભિમુખ બેસો. યંત્રને લાલ વસ્ત્ર પર રાખો.', sa: 'प्राङ्मुखः सन् यन्त्रं रक्तवस्त्रे स्थापयेत्।' },
  'yantra.install.SU.3': { en: 'Offer red flowers, kumkum, and sandalwood.', hi: 'लाल पुष्प, कुमकुम और चंदन अर्पित करें।', gu: 'લાલ ફૂલો, કુમકુમ અને ચંદન અર્પણ કરો.', sa: 'रक्तपुष्पाणि कुङ्कुमं चन्दनं च समर्पयेत्।' },
  'yantra.install.SU.4': { en: 'Recite the bija mantra 7000 times (or 7× in 21 days).', hi: 'बीज मंत्र का 7000 बार जप करें (अथवा 21 दिनों में 7 गुना)।', gu: 'બીજ મંત્રનો 7000 વખત જાપ કરો (અથવા 21 દિવસોમાં 7 ગણો).', sa: 'बीजमन्त्रं सप्तसहस्रवारं जपेत् (एकविंशतिदिनेषु सप्तगुणं वा)।' },
  'yantra.install.SU.5': { en: 'Offer arghya (water) to the Sun facing east.', hi: 'पूर्व मुख होकर सूर्य को अर्घ्य अर्पित करें।', gu: 'પૂર્વાભિમુખ થઈ સૂર્યને અર્ઘ્ય આપો.', sa: 'प्राङ्मुखः सन् सूर्याय अर्घ्यं दद्यात्।' },

  'yantra.install.MO.0': { en: 'Select Monday on Purnima or bright-half evening after moonrise.', hi: 'पूर्णिमा अथवा शुक्ल पक्ष की संध्या में चन्द्रोदय के पश्चात सोमवार चुनें।', gu: 'પૂર્ણિમા કે શુક્લ પક્ષની સાંજે ચંદ્રોદય બાદ સોમવાર પસંદ કરો.', sa: 'पूर्णिमायां शुक्लपक्षसायं वा चन्द्रोदयानन्तरं सोमवासरं निर्वचयेत्।' },
  'yantra.install.MO.1': { en: 'Bathe, wear white. Place yantra on white silk.', hi: 'स्नान कर श्वेत वस्त्र धारण करें। यंत्र को श्वेत रेशम पर रखें।', gu: 'સ્નાન કરી શ્વેત વસ્ત્ર ધારણ કરો. યંત્રને શ્વેત રેશમ પર રાખો.', sa: 'स्नात्वा श्वेतवस्त्रं धारयेत्; यन्त्रं श्वेतपट्टे स्थापयेत्।' },
  'yantra.install.MO.2': { en: 'Offer white flowers, rice, milk, and camphor.', hi: 'श्वेत पुष्प, चावल, दूध और कर्पूर अर्पित करें।', gu: 'શ્વેત ફૂલો, ચોખા, દૂધ અને કપૂર અર્પણ કરો.', sa: 'श्वेतपुष्पाणि तण्डुलाः दुग्धं कर्पूरं च समर्पयेत्।' },
  'yantra.install.MO.3': { en: 'Chant the bija 11000 times over 11 Mondays.', hi: '11 सोमवारों में बीज मंत्र का 11000 बार जप करें।', gu: '11 સોમવારોમાં બીજ મંત્રનો 11000 વખત જાપ કરો.', sa: 'एकादश सोमवासरेषु बीजमन्त्रं एकादशसहस्रवारं जपेत्।' },
  'yantra.install.MO.4': { en: 'Offer milk to a Shivalinga afterwards.', hi: 'पश्चात् शिवलिंग पर दूध अर्पित करें।', gu: 'પછી શિવલિંગ પર દૂધ ચઢાવો.', sa: 'अनन्तरं शिवलिङ्गे दुग्धं समर्पयेत्।' },

  'yantra.install.MA.0': { en: 'Tuesday at sunrise, preferably during Krittika or Mrigashira nakshatra.', hi: 'मंगलवार सूर्योदय पर, विशेषकर कृत्तिका अथवा मृगशिरा नक्षत्र में।', gu: 'મંગળવારે સૂર્યોદય સમયે, ખાસ કરીને કૃત્તિકા કે મૃગશિરા નક્ષત્રમાં.', sa: 'भौमवासरे सूर्योदये, विशेषतः कृत्तिकायां मृगशिरायां वा नक्षत्रे।' },
  'yantra.install.MA.1': { en: 'Wear red. Face south.', hi: 'लाल वस्त्र धारण करें। दक्षिण मुख होकर बैठें।', gu: 'લાલ વસ્ત્ર ધારણ કરો. દક્ષિણાભિમુખ બેસો.', sa: 'रक्तवस्त्रं धारयेत्; दक्षिणाभिमुखः उपविशेत्।' },
  'yantra.install.MA.2': { en: 'Offer red flowers, jaggery, and red sandalwood.', hi: 'लाल पुष्प, गुड़ और रक्तचंदन अर्पित करें।', gu: 'લાલ ફૂલો, ગોળ અને રક્તચંદન અર્પણ કરો.', sa: 'रक्तपुष्पाणि गुडं रक्तचन्दनं च समर्पयेत्।' },
  'yantra.install.MA.3': { en: 'Chant bija 10000 times; Hanuman Chalisa 11 times.', hi: 'बीज मंत्र का 10000 बार और हनुमान चालीसा का 11 बार पाठ करें।', gu: 'બીજ મંત્રનો 10000 વખત અને હનુમાન ચાલીસાનો 11 વખત પાઠ કરો.', sa: 'बीजमन्त्रं दशसहस्रवारं हनुमच्चालीसां च एकादशवारं पठेत्।' },
  'yantra.install.MA.4': { en: 'Light a ghee lamp and visit a Hanuman temple afterwards.', hi: 'घी का दीपक प्रज्वलित करें और पश्चात् हनुमान मंदिर के दर्शन करें।', gu: 'ઘીનો દીપક પ્રગટાવો અને પછી હનુમાન મંદિરે દર્શન કરો.', sa: 'घृतदीपं प्रज्वालयेत्; अनन्तरं हनुमन्मन्दिरदर्शनं कुर्यात्।' },

  'yantra.install.ME.0': { en: 'Wednesday morning during Ashlesha/Jyeshtha/Revati nakshatra.', hi: 'आश्लेषा/ज्येष्ठा/रेवती नक्षत्र में बुधवार प्रातः।', gu: 'આશ્લેષા/જ્યેષ્ઠા/રેવતી નક્ષત્રમાં બુધવાર સવારે.', sa: 'आश्लेषा/ज्येष्ठा/रेवती-नक्षत्रे बुधवासरे प्रातःकाले।' },
  'yantra.install.ME.1': { en: 'Wear green. Face north.', hi: 'हरा वस्त्र धारण करें। उत्तर मुख होकर बैठें।', gu: 'લીલું વસ્ત્ર ધારણ કરો. ઉત્તરાભિમુખ બેસો.', sa: 'हरितवस्त्रं धारयेत्; उत्तराभिमुखः उपविशेत्।' },
  'yantra.install.ME.2': { en: 'Offer moong dal, green leaves, durva grass.', hi: 'मूंग दाल, हरे पत्ते, दूर्वा अर्पित करें।', gu: 'મગ દાળ, લીલા પત્તાં, દૂર્વા અર્પણ કરો.', sa: 'मुद्गदालं हरितपत्राणि दूर्वां च समर्पयेत्।' },
  'yantra.install.ME.3': { en: 'Chant bija 9000 times in 9 Wednesdays.', hi: '9 बुधवारों में बीज मंत्र का 9000 बार जप करें।', gu: '9 બુધવારોમાં બીજ મંત્રનો 9000 વખત જાપ કરો.', sa: 'नवबुधवासरेषु बीजमन्त्रं नवसहस्रवारं जपेत्।' },
  'yantra.install.ME.4': { en: 'Donate green items afterwards.', hi: 'पश्चात् हरी वस्तुओं का दान करें।', gu: 'પછી લીલી વસ્તુઓનું દાન કરો.', sa: 'अनन्तरं हरितवस्तूनि दद्यात्।' },

  'yantra.install.JU.0': { en: 'Thursday morning during Punarvasu / Vishakha / Purva-bhadrapada.', hi: 'पुनर्वसु / विशाखा / पूर्वा-भाद्रपद नक्षत्र में गुरुवार प्रातः।', gu: 'પુનર્વસુ / વિશાખા / પૂર્વા-ભાદ્રપદ નક્ષત્રમાં ગુરુવાર સવારે.', sa: 'पुनर्वसु/विशाखा/पूर्वाभाद्रपद-नक्षत्रे गुरुवासरे प्रातःकाले।' },
  'yantra.install.JU.1': { en: 'Wear yellow. Face north-east (Ishana).', hi: 'पीत वस्त्र धारण करें। ईशान कोण की ओर मुख करें।', gu: 'પીળું વસ્ત્ર ધારણ કરો. ઈશાન ખૂણા તરફ મુખ કરો.', sa: 'पीतवस्त्रं धारयेत्; ईशानाभिमुखः उपविशेत्।' },
  'yantra.install.JU.2': { en: 'Offer yellow flowers, chana dal, turmeric, ghee lamp.', hi: 'पीत पुष्प, चना दाल, हल्दी, घी का दीपक अर्पित करें।', gu: 'પીળાં ફૂલો, ચણા દાળ, હળદર, ઘીનો દીપક અર્પણ કરો.', sa: 'पीतपुष्पाणि चणकदालं हरिद्रां घृतदीपं च समर्पयेत्।' },
  'yantra.install.JU.3': { en: 'Chant bija 19000 times over 19 Thursdays.', hi: '19 गुरुवारों में बीज मंत्र का 19000 बार जप करें।', gu: '19 ગુરુવારોમાં બીજ મંત્રનો 19000 વખત જાપ કરો.', sa: 'एकोनविंशतिगुरुवासरेषु बीजमन्त्रं एकोनविंशतिसहस्रवारं जपेत्।' },
  'yantra.install.JU.4': { en: 'Feed Brahmin/teacher and donate yellow items afterwards.', hi: 'पश्चात् ब्राह्मण/गुरु को भोजन कराएँ और पीत वस्तुओं का दान करें।', gu: 'પછી બ્રાહ્મણ/ગુરુને ભોજન કરાવો અને પીળી વસ્તુઓનું દાન કરો.', sa: 'अनन्तरं ब्राह्मणं गुरुं वा भोजयेत्, पीतवस्तूनि च दद्यात्।' },

  'yantra.install.VE.0': { en: 'Friday evening during Bharani / Purva-phalguni / Purva-ashadha.', hi: 'भरणी / पूर्वा-फाल्गुनी / पूर्वा-षाढ़ नक्षत्र में शुक्रवार सायं।', gu: 'ભરણી / પૂર્વા-ફાલ્ગુની / પૂર્વા-ષાઢ નક્ષત્રમાં શુક્રવાર સાંજે.', sa: 'भरणी/पूर्वाफाल्गुनी/पूर्वाषाढा-नक्षत्रे शुक्रवासरे सायंकाले।' },
  'yantra.install.VE.1': { en: 'Wear white/silk. Face south-east (Agneya).', hi: 'श्वेत/रेशम धारण करें। आग्नेय कोण की ओर मुख करें।', gu: 'શ્વેત/રેશમ ધારણ કરો. આગ્નેય ખૂણા તરફ મુખ કરો.', sa: 'श्वेतं पट्टं वा धारयेत्; आग्नेयाभिमुखः उपविशेत्।' },
  'yantra.install.VE.2': { en: 'Offer white flowers, sugar, rice, and rose petals.', hi: 'श्वेत पुष्प, चीनी, चावल और गुलाब की पंखुड़ियाँ अर्पित करें।', gu: 'શ્વેત ફૂલો, ખાંડ, ચોખા અને ગુલાબની પાંખડીઓ અર્પણ કરો.', sa: 'श्वेतपुष्पाणि शर्करां तण्डुलान् गुलाबपत्राणि च समर्पयेत्।' },
  'yantra.install.VE.3': { en: 'Chant bija 16000 times over 16 Fridays.', hi: '16 शुक्रवारों में बीज मंत्र का 16000 बार जप करें।', gu: '16 શુક્રવારોમાં બીજ મંત્રનો 16000 વખત જાપ કરો.', sa: 'षोडशशुक्रवासरेषु बीजमन्त्रं षोडशसहस्रवारं जपेत्।' },
  'yantra.install.VE.4': { en: 'Worship Lakshmi and donate white items afterwards.', hi: 'पश्चात् लक्ष्मी की पूजा करें और श्वेत वस्तुओं का दान करें।', gu: 'પછી લક્ષ્મીની પૂજા કરો અને શ્વેત વસ્તુઓનું દાન કરો.', sa: 'अनन्तरं लक्ष्मीं पूजयेत्, श्वेतवस्तूनि च दद्यात्।' },

  'yantra.install.SA.0': { en: 'Saturday evening during Pushya / Anuradha / Uttara-bhadrapada.', hi: 'पुष्य / अनुराधा / उत्तरा-भाद्रपद नक्षत्र में शनिवार सायं।', gu: 'પુષ્ય / અનુરાધા / ઉત્તરા-ભાદ્રપદ નક્ષત્રમાં શનિવાર સાંજે.', sa: 'पुष्य/अनुराधा/उत्तराभाद्रपद-नक्षत्रे शनिवासरे सायंकाले।' },
  'yantra.install.SA.1': { en: 'Wear black/dark blue. Face west.', hi: 'काला/गहरा नीला वस्त्र धारण करें। पश्चिम मुख होकर बैठें।', gu: 'કાળું/ઘેરો વાદળી વસ્ત્ર ધારણ કરો. પશ્ચિમાભિમુખ બેસો.', sa: 'कृष्णं गाढनीलं वा वस्त्रं धारयेत्; पश्चिमाभिमुखः उपविशेत्।' },
  'yantra.install.SA.2': { en: 'Offer black sesame, mustard oil, iron nails.', hi: 'काले तिल, सरसों तेल, लोहे की कीलें अर्पित करें।', gu: 'કાળા તલ, સરસવ તેલ, લોખંડની ખીલ્લીઓ અર્પણ કરો.', sa: 'कृष्णतिलं सर्षपतैलं लौहकीलकं च समर्पयेत्।' },
  'yantra.install.SA.3': { en: 'Light a mustard-oil lamp under a peepal tree.', hi: 'पीपल वृक्ष के नीचे सरसों के तेल का दीपक प्रज्वलित करें।', gu: 'પીપળાના વૃક્ષ નીચે સરસવના તેલનો દીપક પ્રગટાવો.', sa: 'अश्वत्थवृक्षाधः सर्षपतैलदीपं प्रज्वालयेत्।' },
  'yantra.install.SA.4': { en: 'Chant bija 23000 times over 23 Saturdays.', hi: '23 शनिवारों में बीज मंत्र का 23000 बार जप करें।', gu: '23 શનિવારોમાં બીજ મંત્રનો 23000 વખત જાપ કરો.', sa: 'त्रयोविंशतिशनिवासरेषु बीजमन्त्रं त्रयोविंशतिसहस्रवारं जपेत्।' },
  'yantra.install.SA.5': { en: 'Donate mustard oil, iron, shoes, or a blanket.', hi: 'सरसों तेल, लोहा, जूते अथवा कंबल का दान करें।', gu: 'સરસવ તેલ, લોખંડ, જોડા કે ધાબળાનું દાન કરો.', sa: 'सर्षपतैलं लौहं उपानहौ कम्बलं वा दद्यात्।' },

  'yantra.install.RA.0': { en: 'Saturday during Ardra / Swati / Shatabhisha — Rahu Kaal window.', hi: 'आर्द्रा / स्वाति / शतभिषा नक्षत्र में शनिवार राहु काल अवधि में।', gu: 'આર્દ્રા / સ્વાતિ / શતભિષા નક્ષત્રમાં શનિવાર રાહુ કાલ સમયમાં.', sa: 'आर्द्रा/स्वाति/शतभिषा-नक्षत्रे शनिवासरे राहुकालसमये।' },
  'yantra.install.RA.1': { en: 'Wear grey/dark colors. Face south-west (Nairitya).', hi: 'धूसर/गहरे वर्ण के वस्त्र धारण करें। नैऋत्य कोण की ओर मुख करें।', gu: 'ધૂસર/ઘેરા રંગના વસ્ત્ર ધારણ કરો. નૈઋત્ય ખૂણા તરફ મુખ કરો.', sa: 'धूसरं गाढवर्णं वा वस्त्रं धारयेत्; नैऋत्याभिमुखः उपविशेत्।' },
  'yantra.install.RA.2': { en: 'Offer sesame, mustard oil, dark blue flowers.', hi: 'तिल, सरसों तेल, गहरे नीले पुष्प अर्पित करें।', gu: 'તલ, સરસવ તેલ, ઘેરા વાદળી ફૂલો અર્પણ કરો.', sa: 'तिलान् सर्षपतैलं गाढनीलपुष्पाणि च समर्पयेत्।' },
  'yantra.install.RA.3': { en: 'Chant bija 18000 times over 18 Saturdays.', hi: '18 शनिवारों में बीज मंत्र का 18000 बार जप करें।', gu: '18 શનિવારોમાં બીજ મંત્રનો 18000 વખત જાપ કરો.', sa: 'अष्टादशशनिवासरेषु बीजमन्त्रं अष्टादशसहस्रवारं जपेत्।' },
  'yantra.install.RA.4': { en: 'Recite Durga Saptashati; donate black blankets.', hi: 'दुर्गा सप्तशती का पाठ करें; काले कंबलों का दान करें।', gu: 'દુર્ગા સપ્તશતીનો પાઠ કરો; કાળા ધાબળાનું દાન કરો.', sa: 'दुर्गासप्तशतीं पठेत्; कृष्णकम्बलान् दद्यात्।' },

  'yantra.install.KE.0': { en: 'Tuesday during Ashwini / Magha / Mula nakshatra.', hi: 'अश्विनी / मघा / मूल नक्षत्र में मंगलवार।', gu: 'અશ્વિની / મઘા / મૂલ નક્ષત્રમાં મંગળવાર.', sa: 'अश्विनी/मघा/मूल-नक्षत्रे भौमवासरे।' },
  'yantra.install.KE.1': { en: 'Wear multicolour or smoky shades. Sit facing north.', hi: 'बहुरंगी अथवा धूम्र-वर्ण के वस्त्र धारण करें। उत्तर मुख होकर बैठें।', gu: 'બહુરંગી અથવા ધૂમ્ર-વર્ણના વસ્ત્ર ધારણ કરો. ઉત્તરાભિમુખ બેસો.', sa: 'बहुवर्णं धूम्रवर्णं वा वस्त्रं धारयेत्; उत्तराभिमुखः उपविशेत्।' },
  'yantra.install.KE.2': { en: 'Offer sesame, multicoloured flowers, and coconut.', hi: 'तिल, बहुरंगी पुष्प और नारियल अर्पित करें।', gu: 'તલ, બહુરંગી ફૂલો અને નાળિયેર અર્પણ કરો.', sa: 'तिलान् बहुवर्णपुष्पाणि नारिकेलं च समर्पयेत्।' },
  'yantra.install.KE.3': { en: 'Chant bija 17000 times over 17 Tuesdays.', hi: '17 मंगलवारों में बीज मंत्र का 17000 बार जप करें।', gu: '17 મંગળવારોમાં બીજ મંત્રનો 17000 વખત જાપ કરો.', sa: 'सप्तदशभौमवासरेषु बीजमन्त्रं सप्तदशसहस्रवारं जपेत्।' },
  'yantra.install.KE.4': { en: 'Worship Lord Ganesha; recite Ganesha Atharvashirsha.', hi: 'गणेश जी की पूजा करें; गणेश अथर्वशीर्ष का पाठ करें।', gu: 'ગણેશજીની પૂજા કરો; ગણેશ અથર્વશીર્ષનો પાઠ કરો.', sa: 'गणेशं पूजयेत्; गणपत्यथर्वशीर्षं पठेत्।' },

  // ─ Yantra: prescribe-when conditions (per-graha, ordered) ────────────────
  'yantra.prescribe.SU.0': { en: 'Sun is debilitated (Libra) in chart',                       hi: 'चार्ट में सूर्य नीच राशि (तुला) में स्थित',                                       gu: 'ચાર્ટમાં સૂર્ય નીચ રાશિ (તુલા)માં સ્થિત',                                  sa: 'कुण्डले सूर्यः नीचराशौ (तुला) स्थितः' },
  'yantra.prescribe.SU.1': { en: 'Sun combust under 10° Sun (self-combust n/a)',              hi: 'सूर्य 10° के भीतर अस्तंगत (आत्म-अस्त लागू नहीं)',                              gu: 'સૂર્ય 10°ની અંદર અસ્તંગત (સ્વ-અસ્ત લાગુ નથી)',                          sa: 'सूर्यः दशांशे अस्तङ्गतः (स्वास्तङ्गतम् न प्रयोज्यम्)' },
  'yantra.prescribe.SU.2': { en: 'Sun afflicted by Saturn/Rahu/Ketu conjunction',             hi: 'सूर्य पर शनि/राहु/केतु की युति का दोष',                                          gu: 'સૂર્ય પર શનિ/રાહુ/કેતુની યુતિનો દોષ',                                       sa: 'सूर्ये शनि/राहु/केतु-युतिदोषः' },
  'yantra.prescribe.SU.3': { en: 'Weak Sun (Shadbala < 3 Rupas)',                              hi: 'दुर्बल सूर्य (षड्बल 3 रूपक से कम)',                                              gu: 'નબળો સૂર્ય (ષડ્બલ 3 રૂપકથી ઓછું)',                                       sa: 'दुर्बलः सूर्यः (षड्बलम् त्रिरूपकात् न्यूनम्)' },
  'yantra.prescribe.SU.4': { en: 'Authority, recognition, or confidence issues',               hi: 'अधिकार, सम्मान अथवा आत्मविश्वास की समस्याएँ',                                  gu: 'અધિકાર, સન્માન કે આત્મવિશ્વાસની સમસ્યાઓ',                                  sa: 'अधिकारः सम्मानम् आत्मविश्वासः वा सम्बन्धि-समस्याः' },

  'yantra.prescribe.MO.0': { en: 'Moon debilitated (Scorpio) in chart',                        hi: 'चार्ट में चन्द्र नीच राशि (वृश्चिक) में स्थित',                                  gu: 'ચાર્ટમાં ચંદ્ર નીચ રાશિ (વૃશ્ચિક)માં સ્થિત',                                sa: 'कुण्डले चन्द्रः नीचराशौ (वृश्चिक) स्थितः' },
  'yantra.prescribe.MO.1': { en: 'Moon in 6/8/12 or afflicted by Saturn/Rahu',                  hi: 'चन्द्र 6/8/12 भाव में अथवा शनि/राहु से पीड़ित',                                gu: 'ચંદ્ર 6/8/12 ભાવમાં અથવા શનિ/રાહુથી પીડિત',                              sa: 'चन्द्रः षष्ठ/अष्टम/द्वादशभावेषु शनि/राहुपीडितो वा' },
  'yantra.prescribe.MO.2': { en: 'Kshina Chandra (waning Moon near Amavasya)',                  hi: 'क्षीण चन्द्र (अमावस्या के समीप कृष्णपक्ष-शुद्ध)',                              gu: 'ક્ષીણ ચંદ્ર (અમાવસ્યા નજીક કૃષ્ણપક્ષમાં)',                                  sa: 'क्षीणचन्द्रः (अमावास्या-सन्निहितः कृष्णपक्षीयः)' },
  'yantra.prescribe.MO.3': { en: 'Emotional instability, sleeplessness, or mental unrest',      hi: 'भावनात्मक अस्थिरता, अनिद्रा अथवा मानसिक अशान्ति',                              gu: 'ભાવનાત્મક અસ્થિરતા, અનિદ્રા કે માનસિક અશાંતિ',                              sa: 'भावुक-अस्थैर्यम् अनिद्रा वा मानसिकाशान्तिः' },
  'yantra.prescribe.MO.4': { en: 'Mother-related afflictions',                                  hi: 'मातृ-सम्बन्धी क्लेश',                                                            gu: 'માતૃ-સંબંધિત ક્લેશ',                                                         sa: 'मातृ-सम्बन्धि-दोषाः' },

  'yantra.prescribe.MA.0': { en: 'Mars debilitated (Cancer) in chart',                          hi: 'चार्ट में मंगल नीच राशि (कर्क) में स्थित',                                       gu: 'ચાર્ટમાં મંગળ નીચ રાશિ (કર્ક)માં સ્થિત',                                  sa: 'कुण्डले मङ्गलः नीचराशौ (कर्क) स्थितः' },
  'yantra.prescribe.MA.1': { en: 'Mars in 6/8/12 or Rahu/Ketu conjunction',                     hi: 'मंगल 6/8/12 भाव में अथवा राहु/केतु से युति',                                    gu: 'મંગળ 6/8/12 ભાવમાં અથવા રાહુ/કેતુ સાથે યુતિ',                            sa: 'मङ्गलः षष्ठ/अष्टम/द्वादशभावेषु राहु/केतुयुतो वा' },
  'yantra.prescribe.MA.2': { en: 'Manglik dosha activation (Mars in 1/2/4/7/8/12)',              hi: 'मांगलिक दोष सक्रिय (मंगल 1/2/4/7/8/12 भाव में)',                              gu: 'મંગળિક દોષ સક્રિય (મંગળ 1/2/4/7/8/12 ભાવમાં)',                          sa: 'माङ्गलिकदोषः सक्रियः (मङ्गलः 1/2/4/7/8/12 भावेषु)' },
  'yantra.prescribe.MA.3': { en: 'Anger, accident-proneness, surgery, or blood disorders',      hi: 'क्रोध, दुर्घटना-प्रवृत्ति, शल्य अथवा रक्त-विकार',                              gu: 'ક્રોધ, અકસ્માત-પ્રવૃત્તિ, શસ્ત્રક્રિયા કે રક્ત-વિકાર',                       sa: 'क्रोधः दुर्घटना-प्रवृत्तिः शस्त्रक्रिया रक्तविकारो वा' },
  'yantra.prescribe.MA.4': { en: 'Sibling or property disputes',                                hi: 'भ्रातृ अथवा सम्पत्ति विवाद',                                                     gu: 'ભાઈ-બહેન કે મિલકત વિવાદ',                                                  sa: 'भ्रातृ-सम्बन्धि-विवादः सम्पत्ति-विवादो वा' },

  'yantra.prescribe.ME.0': { en: 'Mercury debilitated (Pisces) in chart',                       hi: 'चार्ट में बुध नीच राशि (मीन) में स्थित',                                         gu: 'ચાર્ટમાં બુધ નીચ રાશિ (મીન)માં સ્થિત',                                    sa: 'कुण्डले बुधः नीचराशौ (मीन) स्थितः' },
  'yantra.prescribe.ME.1': { en: 'Mercury combust in the Sun',                                  hi: 'सूर्य से अस्तंगत बुध',                                                            gu: 'સૂર્યથી અસ્તંગત બુધ',                                                         sa: 'सूर्येण अस्तङ्गतः बुधः' },
  'yantra.prescribe.ME.2': { en: 'Mercury afflicted by Mars/Saturn/Rahu',                       hi: 'बुध मंगल/शनि/राहु से पीड़ित',                                                    gu: 'બુધ મંગળ/શનિ/રાહુથી પીડિત',                                                sa: 'बुधः मङ्गल/शनि/राहुपीडितः' },
  'yantra.prescribe.ME.3': { en: 'Speech, learning, or commerce problems',                      hi: 'वाणी, अध्ययन अथवा व्यापार सम्बन्धी समस्याएँ',                                  gu: 'વાણી, અભ્યાસ કે વ્યાપાર સંબંધી સમસ્યાઓ',                                  sa: 'वाणी विद्या व्यापारो वा सम्बन्धि-समस्याः' },
  'yantra.prescribe.ME.4': { en: 'Nervous system or skin issues',                               hi: 'स्नायु-तन्त्र अथवा त्वचा सम्बन्धी समस्याएँ',                                    gu: 'મજ્જાતંત્ર કે ત્વચા સંબંધી સમસ્યાઓ',                                       sa: 'स्नायुतन्त्र-त्वचा-सम्बन्धि-समस्याः' },

  'yantra.prescribe.JU.0': { en: 'Jupiter debilitated (Capricorn) in chart',                    hi: 'चार्ट में गुरु नीच राशि (मकर) में स्थित',                                       gu: 'ચાર્ટમાં ગુરુ નીચ રાશિ (મકર)માં સ્થિત',                                    sa: 'कुण्डले गुरुः नीचराशौ (मकर) स्थितः' },
  'yantra.prescribe.JU.1': { en: 'Jupiter combust or in 6/8/12',                                hi: 'गुरु अस्तंगत अथवा 6/8/12 भाव में',                                              gu: 'ગુરુ અસ્તંગત અથવા 6/8/12 ભાવમાં',                                          sa: 'गुरुः अस्तङ्गतः षष्ठ/अष्टम/द्वादशभावेषु वा' },
  'yantra.prescribe.JU.2': { en: 'Jupiter conjunct Rahu/Ketu (Guru-Chandal)',                   hi: 'गुरु राहु/केतु से युत (गुरु-चांडाल)',                                            gu: 'ગુરુ રાહુ/કેતુ સાથે યુત (ગુરુ-ચાંડાલ)',                                    sa: 'गुरुः राहु/केतुयुतः (गुरु-चाण्डालयोगः)' },
  'yantra.prescribe.JU.3': { en: 'Progeny, wisdom, or spiritual stagnation',                    hi: 'सन्तति, ज्ञान अथवा आध्यात्मिक स्थैर्य की कमी',                                  gu: 'સંતતિ, જ્ઞાન કે આધ્યાત્મિક સ્થગનતા',                                       sa: 'सन्ततिः ज्ञानम् आध्यात्मिक-स्थैर्यं वा अभावः' },
  'yantra.prescribe.JU.4': { en: 'Liver or pancreatic issues',                                  hi: 'यकृत अथवा अग्नाशय सम्बन्धी समस्याएँ',                                          gu: 'યકૃત કે સ્વાદુપિંડ સંબંધી સમસ્યાઓ',                                          sa: 'यकृत्-अग्न्याशय-सम्बन्धि-समस्याः' },

  'yantra.prescribe.VE.0': { en: 'Venus debilitated (Virgo) in chart',                          hi: 'चार्ट में शुक्र नीच राशि (कन्या) में स्थित',                                     gu: 'ચાર્ટમાં શુક્ર નીચ રાશિ (કન્યા)માં સ્થિત',                                  sa: 'कुण्डले शुक्रः नीचराशौ (कन्या) स्थितः' },
  'yantra.prescribe.VE.1': { en: 'Venus combust (within 10°) — very common',                    hi: 'शुक्र अस्तंगत (10° के भीतर) — अति-सामान्य',                                    gu: 'શુક્ર અસ્તંગત (10°ની અંદર) — ખૂબ સામાન્ય',                              sa: 'शुक्रः अस्तङ्गतः (दशांशे) — अतिसामान्यः' },
  'yantra.prescribe.VE.2': { en: 'Venus afflicted in 7th house',                                hi: 'सप्तम भाव में शुक्र पीड़ित',                                                     gu: 'સપ્તમ ભાવમાં શુક્ર પીડિત',                                                  sa: 'सप्तमभावे शुक्रः पीडितः' },
  'yantra.prescribe.VE.3': { en: 'Marriage delay, marital discord, or romantic issues',          hi: 'विवाह में विलम्ब, वैवाहिक कलह अथवा प्रेम-सम्बन्धी समस्याएँ',                  gu: 'લગ્નમાં વિલંબ, વૈવાહિક કલહ કે પ્રેમ-સંબંધી સમસ્યાઓ',                       sa: 'विवाहविलम्बः वैवाहिककलहः प्रेम-सम्बन्धि-समस्या वा' },
  'yantra.prescribe.VE.4': { en: 'Kidney, reproductive, or skin issues',                        hi: 'वृक्क, प्रजनन अथवा त्वचा सम्बन्धी समस्याएँ',                                    gu: 'મૂત્રપિંડ, પ્રજનન કે ત્વચા સંબંધી સમસ્યાઓ',                                  sa: 'वृक्क-प्रजननेन्द्रिय-त्वचा-सम्बन्धि-समस्याः' },

  'yantra.prescribe.SA.0': { en: 'Saturn debilitated (Aries) in chart',                         hi: 'चार्ट में शनि नीच राशि (मेष) में स्थित',                                         gu: 'ચાર્ટમાં શનિ નીચ રાશિ (મેષ)માં સ્થિત',                                    sa: 'कुण्डले शनिः नीचराशौ (मेष) स्थितः' },
  'yantra.prescribe.SA.1': { en: 'Sade-Sati (Saturn transit 12-1-2 from Moon)',                  hi: 'साढ़े-साती (चन्द्र से 12-1-2 भाव में शनि गोचर)',                                  gu: 'સાડે-સાતી (ચંદ્રથી 12-1-2 ભાવમાં શનિ ગોચર)',                              sa: 'सार्धसप्तवर्षदोषः (चन्द्रात् द्वादश-प्रथम-द्वितीयभावेषु शनि-गोचरः)' },
  'yantra.prescribe.SA.2': { en: 'Ashtama Shani (Saturn transit 8th from Moon)',                 hi: 'अष्टम शनि (चन्द्र से 8वें भाव में शनि गोचर)',                                  gu: 'અષ્ટમ શનિ (ચંદ્રથી 8મા ભાવમાં શનિ ગોચર)',                                  sa: 'अष्टमशनिः (चन्द्रात् अष्टमभावे शनि-गोचरः)' },
  'yantra.prescribe.SA.3': { en: 'Saturn in 6/8/12 or conjunct Rahu/Ketu',                       hi: 'शनि 6/8/12 भाव में अथवा राहु/केतु से युति',                                    gu: 'શનિ 6/8/12 ભાવમાં અથવા રાહુ/કેતુ સાથે યુતિ',                            sa: 'शनिः षष्ठ/अष्टम/द्वादशभावेषु राहु/केतुयुतो वा' },
  'yantra.prescribe.SA.4': { en: 'Chronic illness, bone/joint issues, delays',                   hi: 'दीर्घकालीन रोग, अस्थि/सन्धि सम्बन्धी समस्याएँ, विलम्ब',                          gu: 'દીર્ઘકાલીન રોગ, અસ્થિ/સાંધા સંબંધી સમસ્યાઓ, વિલંબ',                       sa: 'दीर्घकालीनरोगः अस्थिसन्धि-सम्बन्धि-समस्या विलम्बो वा' },

  'yantra.prescribe.RA.0': { en: 'Rahu in 1/5/7/9 causing Pitru Dosha or Kaal Sarpa',            hi: 'राहु 1/5/7/9 भाव में पितृ दोष अथवा काल सर्प उत्पन्न करता है',                  gu: 'રાહુ 1/5/7/9 ભાવમાં પિતૃ દોષ કે કાળ સર્પ સર્જે છે',                       sa: 'राहुः 1/5/7/9-भावेषु पितृदोषं कालसर्पं वा जनयति' },
  'yantra.prescribe.RA.1': { en: 'Rahu conjunct Sun/Moon (eclipses)',                            hi: 'राहु सूर्य/चन्द्र से युत (ग्रहण योग)',                                            gu: 'રાહુ સૂર્ય/ચંદ્ર સાથે યુત (ગ્રહણ યોગ)',                                    sa: 'राहुः सूर्य/चन्द्रयुतः (ग्रहणयोगः)' },
  'yantra.prescribe.RA.2': { en: 'Rahu in Ashlesha / Jyeshtha / Revati (gandanta)',              hi: 'राहु आश्लेषा / ज्येष्ठा / रेवती में (गण्डान्त)',                                  gu: 'રાહુ આશ્લેષા / જ્યેષ્ઠા / રેવતીમાં (ગંડાંત)',                                sa: 'राहुः आश्लेषा/ज्येष्ठा/रेवतीनक्षत्रे (गण्डान्तः)' },
  'yantra.prescribe.RA.3': { en: 'Obsession, addiction, paranoia, or foreign-land problems',     hi: 'जुनून, व्यसन, संशय अथवा विदेश-सम्बन्धी समस्याएँ',                              gu: 'જનૂન, વ્યસન, શંકા કે વિદેશ-સંબંધી સમસ્યાઓ',                                  sa: 'अभिनिवेशः व्यसनं शङ्का विदेश-सम्बन्धि-समस्या वा' },
  'yantra.prescribe.RA.4': { en: 'Unexplained fears or sudden reversals',                        hi: 'अकारण भय अथवा अकस्मात् विपर्यय',                                                gu: 'અકારણ ભય કે અચાનક વિપરીતતા',                                                sa: 'अकारणभयं अकस्मात्-विपर्ययो वा' },

  'yantra.prescribe.KE.0': { en: 'Ketu in 1/5/7 — detachment, spiritual fever',                  hi: 'केतु 1/5/7 भाव में — वैराग्य, आध्यात्मिक उत्तेजना',                              gu: 'કેતુ 1/5/7 ભાવમાં — વૈરાગ્ય, આધ્યાત્મિક ઉત્તેજના',                       sa: 'केतुः 1/5/7-भावेषु — वैराग्यम् आध्यात्मिक-तापो वा' },
  'yantra.prescribe.KE.1': { en: 'Ketu conjunct Sun/Moon (eclipses)',                            hi: 'केतु सूर्य/चन्द्र से युत (ग्रहण योग)',                                            gu: 'કેતુ સૂર્ય/ચંદ્ર સાથે યુત (ગ્રહણ યોગ)',                                    sa: 'केतुः सूर्य/चन्द्रयुतः (ग्रहणयोगः)' },
  'yantra.prescribe.KE.2': { en: 'Ketu in gandanta or Mula / Ashlesha / Jyeshtha',                hi: 'केतु गण्डान्त अथवा मूल / आश्लेषा / ज्येष्ठा में',                                gu: 'કેતુ ગંડાંત અથવા મૂલ / આશ્લેષા / જ્યેષ્ઠામાં',                              sa: 'केतुः गण्डान्ते मूल/आश्लेषा/ज्येष्ठानक्षत्रे वा' },
  'yantra.prescribe.KE.3': { en: 'Obsessive-compulsive, skin, or nerve issues',                   hi: 'मनोग्रस्त-बाध्यता, त्वचा अथवा स्नायु सम्बन्धी समस्याएँ',                       gu: 'મનોગ્રસ્ત-વિવશતા, ત્વચા કે મજ્જા સંબંધી સમસ્યાઓ',                       sa: 'अभिनिवेश-विवशता-त्वचा-स्नायु-सम्बन्धि-समस्याः' },
  'yantra.prescribe.KE.4': { en: 'Sudden losses or inexplicable endings',                         hi: 'अकस्मात् हानि अथवा अप्रत्याशित अन्त',                                            gu: 'અચાનક ખોટ કે અકસ્માત અંત',                                                  sa: 'अकस्मात्-हानिः अप्रत्याशित-अन्तो वा' },

  // ─ Yantra: benefits (per-graha, ordered) ─────────────────────────────────
  'yantra.benefit.SU.0': { en: 'Restores vitality and ojas',                                                                                                hi: 'ओज और जीवन-शक्ति का पुनरुद्धार करता है',                                          gu: 'ઓજ અને જીવન-શક્તિને પુનઃસ્થાપિત કરે છે',                                  sa: 'ओजः जीवशक्तिं च प्रत्यानयति' },
  'yantra.benefit.SU.1': { en: 'Strengthens position, authority, and public recognition',                                                                  hi: 'पद, अधिकार और जन-प्रतिष्ठा को सुदृढ़ करता है',                                    gu: 'પદ, અધિકાર અને જન-પ્રતિષ્ઠાને દૃઢ કરે છે',                                    sa: 'पदम् अधिकारं जनप्रतिष्ठां च दृढीकरोति' },
  'yantra.benefit.SU.2': { en: 'Improves paternal relationships',                                                                                            hi: 'पितृ-सम्बन्धों में सुधार लाता है',                                                  gu: 'પિતૃ-સંબંધોમાં સુધારો લાવે છે',                                                sa: 'पितृ-सम्बन्धान् सुधारयति' },
  'yantra.benefit.SU.3': { en: 'Heals eye and heart ailments',                                                                                                hi: 'नेत्र और हृदय रोगों में लाभकारी',                                                gu: 'નેત્ર અને હૃદય રોગોમાં લાભકારી',                                              sa: 'नेत्र-हृदय-रोगेषु साहाय्यकम्' },

  'yantra.benefit.MO.0': { en: 'Calms mind and emotions',                                                                                                    hi: 'मन और भावनाओं को शान्त करता है',                                                gu: 'મન અને ભાવનાઓને શાંત કરે છે',                                                sa: 'मनः भावनां च शमयति' },
  'yantra.benefit.MO.1': { en: 'Improves sleep, intuition, and mental clarity',                                                                              hi: 'निद्रा, अन्तर्ज्ञान और मानसिक स्पष्टता बढ़ाता है',                                gu: 'નિદ્રા, અંતર્જ્ઞાન અને માનસિક સ્પષ્ટતા વધારે છે',                              sa: 'निद्रां अन्तर्ज्ञानं मानसस्पष्टतां च वर्धयति' },
  'yantra.benefit.MO.2': { en: 'Strengthens maternal bond and domestic peace',                                                                              hi: 'मातृ-बन्धन और गृह-शान्ति को सुदृढ़ करता है',                                      gu: 'માતૃ-બંધન અને ઘરની શાંતિ દૃઢ કરે છે',                                          sa: 'मातृ-सम्बन्धं गृह-शान्तिं च दृढीकरोति' },
  'yantra.benefit.MO.3': { en: 'Balances fluid and hormonal systems',                                                                                        hi: 'द्रव्य और हार्मोनल तन्त्रों में सन्तुलन लाता है',                                  gu: 'દ્રવ્ય અને હોર્મોન તંત્રોને સંતુલિત કરે છે',                                  sa: 'द्रव-हार्मोन-तन्त्रयोः साम्यं जनयति' },

  'yantra.benefit.MA.0': { en: 'Channels anger into courage',                                                                                                hi: 'क्रोध को साहस में परिवर्तित करता है',                                            gu: 'ક્રોધને સાહસમાં પરિવર્તિત કરે છે',                                            sa: 'क्रोधं साहसरूपेण परिवर्तयति' },
  'yantra.benefit.MA.1': { en: 'Protects from accidents, surgery, and enemies',                                                                              hi: 'दुर्घटना, शल्यचिकित्सा और शत्रुओं से रक्षा करता है',                              gu: 'અકસ્માત, શસ્ત્રક્રિયા અને શત્રુઓથી રક્ષણ આપે છે',                              sa: 'दुर्घटना-शस्त्रक्रिया-शत्रुभ्यः रक्षां करोति' },
  'yantra.benefit.MA.2': { en: 'Strengthens willpower and physical stamina',                                                                                hi: 'इच्छाशक्ति और शारीरिक सहनशक्ति को सुदृढ़ करता है',                              gu: 'ઈચ્છાશક્તિ અને શારીરિક સહનશક્તિને દૃઢ કરે છે',                                  sa: 'इच्छाशक्तिं शारीरिक-सहनशक्तिं च दृढीकरोति' },
  'yantra.benefit.MA.3': { en: 'Helps marital harmony (for Mangliks)',                                                                                      hi: 'वैवाहिक सामंजस्य में सहायक (मांगलिकों हेतु)',                                  gu: 'વૈવાહિક સામંજસ્યમાં સહાયક (મંગળિકો માટે)',                                    sa: 'वैवाहिक-सामञ्जस्ये साहाय्यकम् (माङ्गलिकानां कृते)' },

  'yantra.benefit.ME.0': { en: 'Sharpens intellect, memory, speech',                                                                                          hi: 'बुद्धि, स्मरण और वाणी को तीक्ष्ण करता है',                                        gu: 'બુદ્ધિ, સ્મરણ અને વાણીને તીવ્ર બનાવે છે',                                      sa: 'बुद्धिं स्मृतिं वाणीं च तीक्ष्णयति' },
  'yantra.benefit.ME.1': { en: 'Favors commerce, trade, and communication',                                                                                  hi: 'व्यापार, वाणिज्य और सञ्चार में अनुकूल',                                          gu: 'વ્યાપાર, વાણિજ્ય અને સંચારમાં અનુકૂળ',                                        sa: 'वाणिज्ये व्यापारे सञ्चारे च अनुकूलः' },
  'yantra.benefit.ME.2': { en: 'Heals nervous-system and skin conditions',                                                                                  hi: 'स्नायु-तन्त्र और त्वचा रोगों में लाभकारी',                                        gu: 'મજ્જાતંત્ર અને ત્વચા રોગોમાં લાભકારી',                                          sa: 'स्नायुतन्त्र-त्वचा-रोगेषु साहाय्यकम्' },
  'yantra.benefit.ME.3': { en: 'Good for students and writers',                                                                                                hi: 'विद्यार्थियों और लेखकों के लिए हितकर',                                            gu: 'વિદ્યાર્થીઓ અને લેખકો માટે હિતકારી',                                            sa: 'विद्यार्थिनाम् लेखकानां च हितकरम्' },

  'yantra.benefit.JU.0': { en: 'Expands wisdom, wealth, and virtue',                                                                                          hi: 'ज्ञान, धन और सद्गुणों का विस्तार करता है',                                      gu: 'જ્ઞાન, ધન અને સદ્ગુણોનો વિસ્તાર કરે છે',                                      sa: 'ज्ञानं धनं सद्गुणान् च वर्धयति' },
  'yantra.benefit.JU.1': { en: 'Favors progeny and marriage for women',                                                                                      hi: 'सन्तति और स्त्रियों के विवाह में अनुकूल',                                        gu: 'સંતતિ અને સ્ત્રીઓના લગ્નમાં અનુકૂળ',                                          sa: 'सन्तत्यां स्त्रीणां विवाहे च अनुकूलः' },
  'yantra.benefit.JU.2': { en: 'Removes guru-chandal dosha',                                                                                                  hi: 'गुरु-चांडाल दोष का निवारण करता है',                                              gu: 'ગુરુ-ચાંડાલ દોષનું નિવારણ કરે છે',                                              sa: 'गुरु-चाण्डालदोषं निवारयति' },
  'yantra.benefit.JU.3': { en: 'Heals liver, fat metabolism, and diabetes',                                                                                  hi: 'यकृत, मेद-पाचन और मधुमेह में लाभकारी',                                          gu: 'યકૃત, મેદ-પાચન અને મધુપ્રમેહમાં લાભકારી',                                      sa: 'यकृत्-मेदोपचय-मधुमेहेषु साहाय्यकम्' },

  'yantra.benefit.VE.0': { en: 'Attracts love, beauty, luxury, refinement',                                                                                  hi: 'प्रेम, सौन्दर्य, ऐश्वर्य और परिष्कार आकर्षित करता है',                            gu: 'પ્રેમ, સૌંદર્ય, વૈભવ અને પરિષ્કાર આકર્ષે છે',                                  sa: 'प्रेम सौन्दर्यम् ऐश्वर्यं परिष्कारं च आकर्षयति' },
  'yantra.benefit.VE.1': { en: 'Favors marriage and partnerships',                                                                                            hi: 'विवाह और साझेदारी में अनुकूल',                                                  gu: 'લગ્ન અને ભાગીદારીમાં અનુકૂળ',                                                sa: 'विवाहे साझेदार्यां च अनुकूलः' },
  'yantra.benefit.VE.2': { en: 'Favors arts, music, and design',                                                                                              hi: 'कला, सङ्गीत और रूपाङ्कन में अनुकूल',                                            gu: 'કલા, સંગીત અને ડિઝાઇનમાં અનુકૂળ',                                            sa: 'कलासु सङ्गीते रूपाङ्कने च अनुकूलः' },
  'yantra.benefit.VE.3': { en: 'Heals reproductive and urinary systems',                                                                                    hi: 'प्रजनन और मूत्र तन्त्रों में लाभकारी',                                              gu: 'પ્રજનન અને મૂત્ર તંત્રોમાં લાભકારી',                                          sa: 'प्रजननेन्द्रिय-मूत्रतन्त्रयोः साहाय्यकम्' },

  'yantra.benefit.SA.0': { en: 'Eases Sade-Sati and Shani dhaiyya',                                                                                            hi: 'साढ़े-साती और शनि ढैय्या में राहत प्रदान करता है',                                gu: 'સાડે-સાતી અને શનિ ઢૈય્યામાં રાહત આપે છે',                                    sa: 'सार्धसप्तवर्षदोषे ढैय्यायां च आराम जनयति' },
  'yantra.benefit.SA.1': { en: 'Removes delays, restrictions, and karmic burdens',                                                                            hi: 'विलम्ब, बाधाएँ और कर्मजन्य भार दूर करता है',                                    gu: 'વિલંબ, પ્રતિબંધ અને કર્મજન્ય ભારને દૂર કરે છે',                              sa: 'विलम्बान् प्रतिबन्धान् कर्म-भारं च दूरीकरोति' },
  'yantra.benefit.SA.2': { en: 'Favors service, discipline, and longevity',                                                                                  hi: 'सेवा, अनुशासन और दीर्घायु में अनुकूल',                                            gu: 'સેવા, અનુશાસન અને દીર્ઘાયુષ્યમાં અનુકૂળ',                                    sa: 'सेवा अनुशासने दीर्घायुषि च अनुकूलः' },
  'yantra.benefit.SA.3': { en: 'Heals bones, joints, nerves, and chronic ailments',                                                                          hi: 'अस्थि, सन्धि, स्नायु और दीर्घ-रोगों में लाभकारी',                                  gu: 'અસ્થિ, સાંધા, મજ્જા અને દીર્ઘકાલીન રોગોમાં લાભકારી',                          sa: 'अस्थि-सन्धि-स्नायु-दीर्घरोगेषु साहाय्यकम्' },

  'yantra.benefit.RA.0': { en: 'Neutralizes Kaal Sarpa dosha',                                                                                                  hi: 'काल सर्प दोष को निष्क्रिय करता है',                                              gu: 'કાળ સર્પ દોષને નિષ્ક્રિય કરે છે',                                              sa: 'कालसर्पदोषं निष्क्रियं करोति' },
  'yantra.benefit.RA.1': { en: 'Removes phobias, addictions, and unexplained fears',                                                                          hi: 'भय, व्यसन और अकारण आशंकाएँ दूर करता है',                                        gu: 'ભય, વ્યસનો અને અકારણ આશંકાઓ દૂર કરે છે',                                    sa: 'भय-व्यसन-अकारणाशङ्काः दूरीकरोति' },
  'yantra.benefit.RA.2': { en: 'Favors foreign travel and research',                                                                                          hi: 'विदेश यात्रा और शोध में अनुकूल',                                                gu: 'વિદેશ યાત્રા અને સંશોધનમાં અનુકૂળ',                                          sa: 'विदेश-यात्रायां शोधे च अनुकूलः' },
  'yantra.benefit.RA.3': { en: 'Protects from sudden reversals and deception',                                                                                hi: 'अकस्मात् विपर्यय और कपट से रक्षा करता है',                                      gu: 'અચાનક વિપરીતતા અને કપટથી રક્ષણ આપે છે',                                      sa: 'अकस्मात्-विपर्ययात् कपटाच्च रक्षां करोति' },

  'yantra.benefit.KE.0': { en: 'Neutralizes Kaal Sarpa dosha',                                                                                                  hi: 'काल सर्प दोष को निष्क्रिय करता है',                                              gu: 'કાળ સર્પ દોષને નિષ્ક્રિય કરે છે',                                              sa: 'कालसर्पदोषं निष्क्रियं करोति' },
  'yantra.benefit.KE.1': { en: 'Awakens spiritual insight and moksha tendency',                                                                                hi: 'आध्यात्मिक अन्तर्दृष्टि और मोक्ष-वृत्ति को जागृत करता है',                          gu: 'આધ્યાત્મિક અંતર્દૃષ્ટિ અને મોક્ષ-વૃત્તિને જાગૃત કરે છે',                          sa: 'आध्यात्मिक-अन्तर्दृष्टिं मोक्षवृत्तिं च जागरयति' },
  'yantra.benefit.KE.2': { en: 'Heals OCD, skin, and nerve issues',                                                                                            hi: 'मनोग्रस्त-बाध्यता, त्वचा और स्नायु सम्बन्धी समस्याओं में लाभकारी',                gu: 'OCD, ત્વચા અને મજ્જા સંબંધી સમસ્યાઓમાં લાભકારી',                              sa: 'अभिनिवेश-विवशता-त्वचा-स्नायु-समस्यासु साहाय्यकम्' },
  'yantra.benefit.KE.3': { en: 'Removes obstacles (Ketu ~ Ganesha energy)',                                                                                    hi: 'विघ्न दूर करता है (केतु ~ गणेश ऊर्जा)',                                            gu: 'વિઘ્નો દૂર કરે છે (કેતુ ~ ગણેશ ઊર્જા)',                                        sa: 'विघ्नान् दूरीकरोति (केतुः ~ गणेश-शक्तिः)' },
};

export function p(key: string, locale: Locale, fallback?: string): string {
  return PHRASES[key]?.[locale] ?? PHRASES[key]?.en ?? fallback ?? key;
}

export function pf(
  key: string,
  locale: Locale,
  vars: Record<string, string | number>,
  fallback?: string,
): string {
  const tmpl = p(key, locale, fallback);
  return tmpl.replace(/\{(\w+)\}/g, (_m, k: string) => {
    const v = vars[k];
    return v === undefined || v === null ? '' : String(v);
  });
}

// ─── Translator factory ──────────────────────────────────────────────────────

function lookup(map: EnumMap, key: string, locale: Locale): string {
  return map[key]?.[locale] ?? map[key]?.en ?? key;
}

export interface ServerTranslator {
  varna(en: string): string;
  vashya(en: string): string;
  yoni(en: string): string;
  gana(en: string): string;
  nadi(en: string): string;
  dignity(en: string): string;
  direction(en: string): string;
  metal(en: string): string;
  finger(en: string): string;
  gemstone(en: string): string;
  colour(en: string): string;
  baladi(en: string): string;
  jagradadi(en: string): string;
  lajjitadi(en: string): string;
  deeptadi(en: string): string;
  verdictTone(tone: string): string;
  kootName(en: string): string;
  extraDosha(en: string): string;
  phase(en: string): string;
  bodyPart(en: string): string;
  kaalSarpaType(en: string): string;
  /** Deity / ishta-devata names emitted by remedies catalogue. */
  deity(en: string): string;
  /** Fasting-day labels (incl. "Sunday morning", "Saturday (co-lord)"). */
  fastingDayLabel(en: string): string;
  /** Up-ratna / substitute / aliased gemstone names. */
  gemstoneSubstitute(en: string): string;
  /** Charity / donation items emitted by remedies catalogue. */
  charityItem(en: string): string;
  /** Hand side / orientation labels (left/right/active/passive). */
  handSide(en: string): string;
  /** Palmistry hand-shape labels (earth/air/fire/water). */
  handShape(en: string): string;
  /** Palmistry mount labels (jupiter/saturn/.../moon/rahu). */
  palmMount(en: string): string;
  /** Palmistry line labels (life/head/heart/fate/sun/mercury/marriage). */
  palmLine(en: string): string;
  /** Palmistry marks (star/cross/triangle/...). */
  palmMark(en: string): string;
  /** Tarot suit labels (major/wands/cups/swords/pentacles). */
  tarotSuit(en: string): string;
  /** Tarot element labels (fire/water/air/earth). */
  tarotElement(en: string): string;
  /** Tarot spread-type labels (three-card / celtic-cross / chart-overlay). */
  tarotSpreadType(en: string): string;
  /** Tarot orientation (upright / reversed). */
  tarotOrientation(en: string): string;
  /** Palmistry finger-length (long / normal / short). */
  fingerLength(en: string): string;
  /** Palmistry thumb-type (flexible / firm / low-set / high-set). */
  thumbType(en: string): string;
  /** Palmistry line-quality (absent / faint / clear / deep / broken / chained / forked). */
  lineQuality(en: string): string;
  /** Palmistry mount-size (flat / normal / developed / over-developed). */
  mountSize(en: string): string;
  /** Samudrika complexion (fair / golden / wheatish / dusky / dark). */
  complexion(en: string): string;
  /** Samudrika body build (lean / medium / muscular / stocky). */
  build(en: string): string;
  /** Samudrika voice quality (melodious / resonant / soft / harsh / high-pitched). */
  voiceQuality(en: string): string;
  /** Samudrika gait (elephant / swan / tiger / bull / peacock / horse). */
  gaitType(en: string): string;
  /** Samudrika feature value (forehead/eyes/eyebrows/...). */
  samudrikaValue(en: string): string;
  /** Samudrika feature key (forehead, eyes, eyebrows...). */
  samudrikaFeatureKey(en: string): string;
  /** Samudrika dosha label (Vata-dominant / Pitta-dominant / etc). */
  doshaLabel(en: string): string;
  /** Graphology slant (left / vertical / right / variable). */
  slant(en: string): string;
  /** Graphology pressure (light / medium / heavy / variable). */
  pressure(en: string): string;
  /** Graphology size (small / medium / large). */
  handSize(en: string): string;
  /** Graphology spacing (tight / even / wide). */
  handSpacing(en: string): string;
  /** Graphology baseline (rising / level / falling / wavy). */
  handBaseline(en: string): string;
  /** Graphology loop type (absent / narrow / rounded / exaggerated). */
  handLoop(en: string): string;
  /** Graphology t-bar (low / middle / high / absent). */
  tbar(en: string): string;
  /** Graphology i-dot (omitted / precise / high / circle / stroke). */
  idot(en: string): string;
  /** Graphology signature (matches / larger / smaller / illegible / underlined). */
  signatureType(en: string): string;
  /** Graphology connection (connected / disconnected / mixed). */
  connection(en: string): string;
  /** Graphology Big-Five trait labels. */
  bigFive(en: string): string;
  /** Numerology-deep compatibility quality phrase. */
  numerologyQuality(en: string): string;
}

export function translator(locale: Locale): ServerTranslator {
  return {
    varna:        (e) => lookup(VARNA, e, locale),
    vashya:       (e) => lookup(VASHYA, e, locale),
    yoni:         (e) => lookup(YONI, e, locale),
    gana:         (e) => lookup(GANA, e, locale),
    nadi:         (e) => lookup(NADI, e, locale),
    dignity:      (e) => lookup(DIGNITY, e, locale),
    direction:    (e) => lookup(DIRECTION, e, locale),
    metal:        (e) => lookup(METAL, e, locale),
    finger:       (e) => lookup(FINGER, e, locale),
    gemstone:     (e) => lookup(GEMSTONE, e, locale),
    colour:       (e) => lookup(COLOUR, e, locale),
    baladi:       (e) => lookup(BALADI, e, locale),
    jagradadi:    (e) => lookup(JAGRADADI, e, locale),
    lajjitadi:    (e) => lookup(LAJJITADI, e, locale),
    deeptadi:     (e) => lookup(DEEPTADI, e, locale),
    verdictTone:  (e) => lookup(VERDICT_TONE, e, locale),
    kootName:     (e) => lookup(KOOT_NAME, e, locale),
    extraDosha:   (e) => lookup(EXTRA_DOSHA, e, locale),
    phase:        (e) => lookup(PHASE, e, locale),
    bodyPart:     (e) => lookup(BODY_PART, e, locale),
    kaalSarpaType:(e) => lookup(KAAL_SARPA_TYPE, e, locale),
    deity:             (e) => lookup(DEITY, e, locale),
    fastingDayLabel:   (e) => lookup(FASTING_DAY_LABEL, e, locale),
    gemstoneSubstitute:(e) => lookup(GEMSTONE_SUBSTITUTE, e, locale),
    charityItem:       (e) => lookup(CHARITY_ITEM, e, locale),
    handSide:          (e) => lookup(HAND_SIDE, e, locale),
    handShape:         (e) => lookup(HAND_SHAPE, e, locale),
    palmMount:         (e) => lookup(PALM_MOUNT, e, locale),
    palmLine:          (e) => lookup(PALM_LINE, e, locale),
    palmMark:          (e) => lookup(PALM_MARK, e, locale),
    tarotSuit:         (e) => lookup(TAROT_SUIT, e, locale),
    tarotElement:      (e) => lookup(TAROT_ELEMENT, e, locale),
    tarotSpreadType:   (e) => lookup(TAROT_SPREAD_TYPE, e, locale),
    tarotOrientation:  (e) => lookup(TAROT_ORIENTATION, e, locale),
    fingerLength:      (e) => lookup(FINGER_LENGTH, e, locale),
    thumbType:         (e) => lookup(THUMB_TYPE, e, locale),
    lineQuality:       (e) => lookup(LINE_QUALITY, e, locale),
    mountSize:         (e) => lookup(MOUNT_SIZE, e, locale),
    complexion:        (e) => lookup(COMPLEXION, e, locale),
    build:             (e) => lookup(BUILD, e, locale),
    voiceQuality:      (e) => lookup(VOICE_QUALITY, e, locale),
    gaitType:          (e) => lookup(GAIT_TYPE, e, locale),
    samudrikaValue:    (e) => lookup(SAMUDRIKA_VALUE, e, locale),
    samudrikaFeatureKey:(e) => lookup(SAMUDRIKA_FEATURE_KEY, e, locale),
    doshaLabel:        (e) => lookup(DOSHA_LABEL, e, locale),
    slant:             (e) => lookup(SLANT, e, locale),
    pressure:          (e) => lookup(PRESSURE, e, locale),
    handSize:          (e) => lookup(HAND_SIZE, e, locale),
    handSpacing:       (e) => lookup(HAND_SPACING, e, locale),
    handBaseline:      (e) => lookup(HAND_BASELINE, e, locale),
    handLoop:          (e) => lookup(HAND_LOOP, e, locale),
    tbar:              (e) => lookup(TBAR, e, locale),
    idot:              (e) => lookup(IDOT, e, locale),
    signatureType:     (e) => lookup(SIGNATURE_TYPE, e, locale),
    connection:        (e) => lookup(CONNECTION, e, locale),
    bigFive:           (e) => lookup(BIG_FIVE, e, locale),
    numerologyQuality: (e) => lookup(NUMEROLOGY_QUALITY, e, locale),
  };
}
