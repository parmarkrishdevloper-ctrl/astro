// Festivals engine — generates Hindu festival occurrences for a date range.
//
// Two classes of festivals:
//   1. Tithi-based: anchored to a (masa, paksha, tithi) triple (e.g. Diwali =
//      Kartika Krishna Amavasya, Ganesh Chaturthi = Bhadrapada Shukla Chaturthi).
//   2. Solar-based: anchored to the Sun entering a specific sidereal rashi
//      (e.g. Makara Sankranti = Sun → Capricorn, Mesha Sankranti = Sun → Aries).
//
// The engine scans day-by-day in the target range and records a hit whenever a
// festival's conditions match. For tithi-based festivals, duplicate matches on
// consecutive days are collapsed (the festival is observed once).

import { swisseph } from '../config/ephemeris';
import { computeBody } from './ephemeris.service';
import { dateToJD } from '../utils/julian';
import { normDeg } from '../utils/astro-constants';
import { calculatePanchang } from './panchang.service';
import { Locale, p, pf } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

export type FestivalKind = 'tithi' | 'solar' | 'nakshatra';

export interface FestivalDef {
  id: string;
  name: string;
  nameHi?: string;
  nameGu?: string;
  nameSa?: string;
  kind: FestivalKind;
  // Tithi-based
  masa?: string;           // Amanta month name (e.g. "Kartika")
  paksha?: 'Shukla' | 'Krishna';
  tithi?: number;          // 1..15 within the paksha
  // Solar-based (Sankranti)
  sunEntersRashi?: number; // 1..12
  // Nakshatra-based
  nakshatra?: number;      // 1..27 (Moon occupies this nakshatra)
  category: 'major' | 'vrata' | 'ekadashi' | 'sankranti' | 'jayanti' | 'purnima' | 'amavasya';
  note?: string;
}

export interface FestivalOccurrence {
  date: string;            // ISO date of observance (UTC midnight-anchored)
  def: FestivalDef;
  reason: string;          // human explanation — e.g. "Kartika Krishna Amavasya"
}

/** Per-locale festival names (Gujarati + Sanskrit additions to the
 *  existing nameHi). Indexed by FestivalDef.id. */
const FESTIVAL_NAMES_LOC: Record<string, { gu?: string; sa?: string }> = {
  'makara-sankranti':   { gu: 'મકર સંક્રાંતિ',          sa: 'मकरसंक्रान्तिः' },
  'mesha-sankranti':    { gu: 'મેષ સંક્રાંતિ (બૈસાખી)', sa: 'मेषसंक्रान्तिः' },
  'karka-sankranti':    { gu: 'કર્ક સંક્રાંતિ',          sa: 'कर्कसंक्रान्तिः' },
  'tula-sankranti':     { gu: 'તુલા સંક્રાંતિ',          sa: 'तुलासंक्रान्तिः' },
  'ugadi':              { gu: 'ઉગાદિ / ગુડી પાડવો',     sa: 'युगादिः' },
  'rama-navami':        { gu: 'રામ નવમી',              sa: 'रामनवमी' },
  'hanuman-jayanti':    { gu: 'હનુમાન જયંતી',          sa: 'हनुमज्जयन्ती' },
  'akshaya-tritiya':    { gu: 'અક્ષય તૃતીયા',          sa: 'अक्षयतृतीया' },
  'buddha-purnima':     { gu: 'બુદ્ધ પૂર્ણિમા',          sa: 'बुद्धपूर्णिमा' },
  'guru-purnima':       { gu: 'ગુરુ પૂર્ણિમા',          sa: 'गुरुपूर्णिमा' },
  'raksha-bandhan':     { gu: 'રક્ષાબંધન',              sa: 'रक्षाबन्धनम्' },
  'krishna-janmashtami':{ gu: 'કૃષ્ણ જન્માષ્ટમી',     sa: 'कृष्णजन्माष्टमी' },
  'ganesh-chaturthi':   { gu: 'ગણેશ ચતુર્થી',          sa: 'गणेशचतुर्थी' },
  'navratri-start':     { gu: 'શરદ નવરાત્રિ આરંભ',     sa: 'शरन्नवरात्रारम्भः' },
  'durga-ashtami':      { gu: 'દુર્ગાષ્ટમી',             sa: 'दुर्गाष्टमी' },
  'vijayadashami':      { gu: 'વિજયાદશમી (દશેરા)',    sa: 'विजयादशमी' },
  'sharad-purnima':     { gu: 'શરદ પૂર્ણિમા',          sa: 'शरत्पूर्णिमा' },
  'karwa-chauth':       { gu: 'કરવા ચૌથ',              sa: 'करकचतुर्थी' },
  'dhanteras':          { gu: 'ધનતેરસ',                sa: 'धनत्रयोदशी' },
  'diwali':             { gu: 'દિવાળી (દીપાવલિ)',     sa: 'दीपावली' },
  'govardhan-puja':     { gu: 'ગોવર્ધન પૂજા',          sa: 'गोवर्धनपूजा' },
  'bhai-dooj':          { gu: 'ભાઈ બીજ',              sa: 'भ्रातृद्वितीया' },
  'chhath-puja':        { gu: 'છઠ પૂજા',                sa: 'षष्ठीपूजा' },
  'kartika-purnima':    { gu: 'કાર્તિક પૂર્ણિમા',       sa: 'कार्तिकपूर्णिमा' },
  'vivah-panchami':     { gu: 'વિવાહ પંચમી',          sa: 'विवाहपञ्चमी' },
  'gita-jayanti':       { gu: 'ગીતા જયંતી',             sa: 'गीताजयन्ती' },
  'lohri':              { gu: 'લોહડી',                 sa: 'लोहडी' },
  'vasant-panchami':    { gu: 'વસંત પંચમી',            sa: 'वसन्तपञ्चमी' },
  'ratha-saptami':      { gu: 'રથ સપ્તમી',              sa: 'रथसप्तमी' },
  'magha-purnima':      { gu: 'મહા પૂર્ણિમા',           sa: 'माघपूर्णिमा' },
  'maha-shivaratri':    { gu: 'મહાશિવરાત્રિ',           sa: 'महाशिवरात्रिः' },
  'holika-dahan':       { gu: 'હોલિકા દહન',             sa: 'होलिकादहनम्' },
  'holi':               { gu: 'હોળી',                   sa: 'होलिका' },
  'shukla-ekadashi':    { gu: 'શુક્લ એકાદશી',          sa: 'शुक्लैकादशी' },
  'krishna-ekadashi':   { gu: 'કૃષ્ણ એકાદશી',          sa: 'कृष्णैकादशी' },
  'pradosh-shukla':     { gu: 'પ્રદોષ વ્રત (શુક્લ)',    sa: 'प्रदोषव्रतम् (शुक्लम्)' },
  'pradosh-krishna':    { gu: 'પ્રદોષ વ્રત (કૃષ્ણ)',    sa: 'प्रदोषव्रतम् (कृष्णम्)' },
  'amavasya-monthly':   { gu: 'અમાવસ્યા',              sa: 'अमावस्या' },
  'purnima-monthly':    { gu: 'પૂર્ણિમા',               sa: 'पूर्णिमा' },
  'sankashti-chaturthi':{ gu: 'સંકષ્ટી ચતુર્થી',        sa: 'सङ्कष्टीचतुर्थी' },
};

/** Pick the festival name for the requested locale. */
export function festivalName(def: FestivalDef, locale: Locale): string {
  const loc = FESTIVAL_NAMES_LOC[def.id];
  switch (locale) {
    case 'hi': return def.nameHi ?? def.name;
    case 'gu': return loc?.gu ?? def.nameHi ?? def.name;
    case 'sa': return loc?.sa ?? def.nameHi ?? def.name;
    default:   return def.name;
  }
}

/** Localize the festival.note via phrasebook key festivals.note.<id>.
 *  Falls through to the raw English note. */
export function festivalNote(def: FestivalDef, locale: Locale): string | undefined {
  if (!def.note) return undefined;
  return p(`festivals.note.${def.id}`, locale, def.note);
}

/** Compose the human reason string ("Kartika Krishna Amavasya") in the
 *  requested locale by translating masa/paksha/tithi components. */
export function festivalReason(def: FestivalDef, panchang: ReturnType<typeof calculatePanchang>, locale: Locale): string {
  const al = astroLabels(locale);
  if (def.kind === 'solar' && def.sunEntersRashi) {
    return pf('festivals.reason.solar', locale,
      { rashi: al.rashi(def.sunEntersRashi) },
      `Sun enters ${def.sunEntersRashi}`);
  }
  if (def.kind === 'tithi') {
    const masa = def.masa ?? panchang.masa.amanta;
    return pf('festivals.reason.tithi', locale,
      { masa: p(`festivals.masa.${masa}`, locale, masa),
        paksha: al.paksha(panchang.tithi.paksha),
        tithi: al.tithi(panchang.tithi.name) },
      `${masa} ${panchang.tithi.paksha} ${panchang.tithi.name}`);
  }
  if (def.kind === 'nakshatra' && def.nakshatra) {
    return pf('festivals.reason.nakshatra', locale,
      { nakshatra: al.nakshatra(def.nakshatra) },
      `Moon in nakshatra ${def.nakshatra}`);
  }
  return def.note ?? '';
}

// ─── Curated list (not exhaustive; spans the major Hindu calendar) ─────────
export const FESTIVALS: FestivalDef[] = [
  // ── Solar Sankrantis ──
  { id: 'makara-sankranti', name: 'Makara Sankranti', nameHi: 'मकर संक्रांति',
    kind: 'solar', sunEntersRashi: 10, category: 'sankranti',
    note: 'Sun enters Capricorn — start of Uttarayana observance' },
  { id: 'mesha-sankranti', name: 'Mesha Sankranti (Baisakhi)', nameHi: 'मेष संक्रांति',
    kind: 'solar', sunEntersRashi: 1, category: 'sankranti',
    note: 'Sun enters Aries — solar new year' },
  { id: 'karka-sankranti', name: 'Karka Sankranti', nameHi: 'कर्क संक्रांति',
    kind: 'solar', sunEntersRashi: 4, category: 'sankranti',
    note: 'Sun enters Cancer — start of Dakshinayana' },
  { id: 'tula-sankranti', name: 'Tula Sankranti', nameHi: 'तुला संक्रांति',
    kind: 'solar', sunEntersRashi: 7, category: 'sankranti' },

  // ── Major lunar festivals (Amanta month) ──
  { id: 'ugadi', name: 'Ugadi / Gudi Padwa', nameHi: 'उगादि',
    kind: 'tithi', masa: 'Chaitra', paksha: 'Shukla', tithi: 1, category: 'major',
    note: 'Lunar new year (Chaitra Shukla Pratipada)' },
  { id: 'rama-navami', name: 'Rama Navami', nameHi: 'राम नवमी',
    kind: 'tithi', masa: 'Chaitra', paksha: 'Shukla', tithi: 9, category: 'jayanti' },
  { id: 'hanuman-jayanti', name: 'Hanuman Jayanti', nameHi: 'हनुमान जयंती',
    kind: 'tithi', masa: 'Chaitra', paksha: 'Shukla', tithi: 15, category: 'jayanti' },
  { id: 'akshaya-tritiya', name: 'Akshaya Tritiya', nameHi: 'अक्षय तृतीया',
    kind: 'tithi', masa: 'Vaishakha', paksha: 'Shukla', tithi: 3, category: 'major' },
  { id: 'buddha-purnima', name: 'Buddha Purnima', nameHi: 'बुद्ध पूर्णिमा',
    kind: 'tithi', masa: 'Vaishakha', paksha: 'Shukla', tithi: 15, category: 'purnima' },
  { id: 'guru-purnima', name: 'Guru Purnima', nameHi: 'गुरु पूर्णिमा',
    kind: 'tithi', masa: 'Ashadha', paksha: 'Shukla', tithi: 15, category: 'purnima' },
  { id: 'raksha-bandhan', name: 'Raksha Bandhan', nameHi: 'रक्षा बंधन',
    kind: 'tithi', masa: 'Shravana', paksha: 'Shukla', tithi: 15, category: 'major' },
  { id: 'krishna-janmashtami', name: 'Krishna Janmashtami', nameHi: 'कृष्ण जन्माष्टमी',
    kind: 'tithi', masa: 'Bhadrapada', paksha: 'Krishna', tithi: 8, category: 'jayanti' },
  { id: 'ganesh-chaturthi', name: 'Ganesh Chaturthi', nameHi: 'गणेश चतुर्थी',
    kind: 'tithi', masa: 'Bhadrapada', paksha: 'Shukla', tithi: 4, category: 'major' },
  { id: 'navratri-start', name: 'Sharad Navratri begins', nameHi: 'शरद नवरात्रि',
    kind: 'tithi', masa: 'Ashwin', paksha: 'Shukla', tithi: 1, category: 'major' },
  { id: 'durga-ashtami', name: 'Durga Ashtami', nameHi: 'दुर्गाष्टमी',
    kind: 'tithi', masa: 'Ashwin', paksha: 'Shukla', tithi: 8, category: 'major' },
  { id: 'vijayadashami', name: 'Vijayadashami (Dussehra)', nameHi: 'विजयादशमी',
    kind: 'tithi', masa: 'Ashwin', paksha: 'Shukla', tithi: 10, category: 'major' },
  { id: 'sharad-purnima', name: 'Sharad Purnima', nameHi: 'शरद पूर्णिमा',
    kind: 'tithi', masa: 'Ashwin', paksha: 'Shukla', tithi: 15, category: 'purnima' },
  { id: 'karwa-chauth', name: 'Karwa Chauth', nameHi: 'करवा चौथ',
    kind: 'tithi', masa: 'Kartika', paksha: 'Krishna', tithi: 4, category: 'vrata' },
  { id: 'dhanteras', name: 'Dhanteras', nameHi: 'धनतेरस',
    kind: 'tithi', masa: 'Kartika', paksha: 'Krishna', tithi: 13, category: 'major' },
  { id: 'diwali', name: 'Diwali (Deepavali)', nameHi: 'दीपावली',
    kind: 'tithi', masa: 'Kartika', paksha: 'Krishna', tithi: 15, category: 'major',
    note: 'Kartika Amavasya — festival of lights' },
  { id: 'govardhan-puja', name: 'Govardhan Puja', nameHi: 'गोवर्धन पूजा',
    kind: 'tithi', masa: 'Kartika', paksha: 'Shukla', tithi: 1, category: 'major' },
  { id: 'bhai-dooj', name: 'Bhai Dooj', nameHi: 'भाई दूज',
    kind: 'tithi', masa: 'Kartika', paksha: 'Shukla', tithi: 2, category: 'major' },
  { id: 'chhath-puja', name: 'Chhath Puja', nameHi: 'छठ पूजा',
    kind: 'tithi', masa: 'Kartika', paksha: 'Shukla', tithi: 6, category: 'vrata' },
  { id: 'kartika-purnima', name: 'Kartika Purnima', nameHi: 'कार्तिक पूर्णिमा',
    kind: 'tithi', masa: 'Kartika', paksha: 'Shukla', tithi: 15, category: 'purnima' },
  { id: 'vivah-panchami', name: 'Vivah Panchami', nameHi: 'विवाह पंचमी',
    kind: 'tithi', masa: 'Margashirsha', paksha: 'Shukla', tithi: 5, category: 'major' },
  { id: 'gita-jayanti', name: 'Gita Jayanti', nameHi: 'गीता जयंती',
    kind: 'tithi', masa: 'Margashirsha', paksha: 'Shukla', tithi: 11, category: 'jayanti' },
  { id: 'lohri', name: 'Lohri', nameHi: 'लोहड़ी',
    kind: 'tithi', masa: 'Pausha', paksha: 'Krishna', tithi: 13, category: 'major' },
  { id: 'vasant-panchami', name: 'Vasant Panchami', nameHi: 'वसंत पंचमी',
    kind: 'tithi', masa: 'Magha', paksha: 'Shukla', tithi: 5, category: 'major' },
  { id: 'ratha-saptami', name: 'Ratha Saptami', nameHi: 'रथ सप्तमी',
    kind: 'tithi', masa: 'Magha', paksha: 'Shukla', tithi: 7, category: 'major' },
  { id: 'magha-purnima', name: 'Magha Purnima', nameHi: 'माघ पूर्णिमा',
    kind: 'tithi', masa: 'Magha', paksha: 'Shukla', tithi: 15, category: 'purnima' },
  { id: 'maha-shivaratri', name: 'Maha Shivaratri', nameHi: 'महाशिवरात्रि',
    kind: 'tithi', masa: 'Phalguna', paksha: 'Krishna', tithi: 14, category: 'major' },
  { id: 'holika-dahan', name: 'Holika Dahan', nameHi: 'होलिका दहन',
    kind: 'tithi', masa: 'Phalguna', paksha: 'Shukla', tithi: 15, category: 'major' },
  { id: 'holi', name: 'Holi', nameHi: 'होली',
    kind: 'tithi', masa: 'Chaitra', paksha: 'Krishna', tithi: 1, category: 'major' },

  // ── Ekadashis (monthly — fire twice per month) ──
  { id: 'shukla-ekadashi', name: 'Shukla Ekadashi', kind: 'tithi',
    paksha: 'Shukla', tithi: 11, category: 'ekadashi',
    note: 'Shukla paksha Ekadashi (every month)' },
  { id: 'krishna-ekadashi', name: 'Krishna Ekadashi', kind: 'tithi',
    paksha: 'Krishna', tithi: 11, category: 'ekadashi',
    note: 'Krishna paksha Ekadashi (every month)' },

  // ── Monthly general ──
  { id: 'pradosh-shukla', name: 'Pradosh Vrat (Shukla)', kind: 'tithi',
    paksha: 'Shukla', tithi: 13, category: 'vrata',
    note: 'Trayodashi — every month' },
  { id: 'pradosh-krishna', name: 'Pradosh Vrat (Krishna)', kind: 'tithi',
    paksha: 'Krishna', tithi: 13, category: 'vrata' },
  { id: 'amavasya-monthly', name: 'Amavasya', kind: 'tithi',
    paksha: 'Krishna', tithi: 15, category: 'amavasya',
    note: 'New Moon — every month' },
  { id: 'purnima-monthly', name: 'Purnima', kind: 'tithi',
    paksha: 'Shukla', tithi: 15, category: 'purnima',
    note: 'Full Moon — every month' },
  { id: 'sankashti-chaturthi', name: 'Sankashti Chaturthi', kind: 'tithi',
    paksha: 'Krishna', tithi: 4, category: 'vrata' },
];

/** Does day `panchang` match a tithi-based festival definition? */
function tithiMatches(
  def: FestivalDef,
  panchang: ReturnType<typeof calculatePanchang>,
): boolean {
  if (def.kind !== 'tithi' || def.tithi == null || !def.paksha) return false;
  if (panchang.tithi.paksha !== def.paksha) return false;
  const shuklaTithi = panchang.tithi.num;          // 1..30
  const withinPaksha = shuklaTithi <= 15 ? shuklaTithi : shuklaTithi - 15;
  if (withinPaksha !== def.tithi) return false;
  if (def.masa) {
    // Match either amanta or purnimanta (different regions follow different conventions).
    return panchang.masa.amanta === def.masa || panchang.masa.purnimanta === def.masa;
  }
  return true;
}

/** Returns solar rashi (1..12) for a given date (UTC noon). */
function sunRashiOn(date: Date): number {
  const jd = dateToJD(date);
  const sun = computeBody(jd, swisseph.SE_SUN);
  return Math.floor(normDeg(sun.longitude) / 30) + 1;
}

/**
 * Generate festival occurrences between `start` and `end` (inclusive).
 * Scans one day at a time. Collapses tithi-based duplicates (a tithi can span
 * two civil days — we fire once per festival per lunar month).
 */
export function generateFestivals(
  start: Date,
  end: Date,
  lat: number,
  lng: number,
  locale: Locale = 'en',
): FestivalOccurrence[] {
  const out: FestivalOccurrence[] = [];
  const dayMs = 24 * 3600 * 1000;
  const seen = new Set<string>(); // "defId:year-month-masa"

  // Track prior day's sun rashi for Sankranti detection (transition moment).
  let prevRashi = sunRashiOn(new Date(start.getTime() - dayMs));

  for (let t = start.getTime(); t <= end.getTime(); t += dayMs) {
    const day = new Date(t);
    const pan = calculatePanchang(day, lat, lng);
    const rashi = sunRashiOn(day);

    // Solar Sankrantis — fire on day Sun's rashi changes.
    if (rashi !== prevRashi) {
      for (const def of FESTIVALS) {
        if (def.kind === 'solar' && def.sunEntersRashi === rashi) {
          out.push({
            date: day.toISOString().slice(0, 10),
            def: localizeFestival(def, locale),
            reason: festivalReason(def, pan, locale),
          });
        }
      }
    }
    prevRashi = rashi;

    // Tithi-based festivals.
    for (const def of FESTIVALS) {
      if (def.kind !== 'tithi') continue;
      if (!tithiMatches(def, pan)) continue;
      // Dedup within the same lunar month.
      const month = pan.masa.amanta;
      const ym = `${day.getUTCFullYear()}-${month}`;
      const key = `${def.id}:${ym}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        date: day.toISOString().slice(0, 10),
        def: localizeFestival(def, locale),
        reason: festivalReason(def, pan, locale),
      });
    }
  }

  return out.sort((a, b) => a.date.localeCompare(b.date));
}

/** Returns the festival def with `name` and `note` overridden for the
 *  requested locale. The `nameHi` field is preserved for clients that
 *  still want the bilingual rendering. */
export function localizeFestival(def: FestivalDef, locale: Locale): FestivalDef {
  return {
    ...def,
    name: festivalName(def, locale),
    note: festivalNote(def, locale),
  };
}

function tithiLabel(t: number, paksha: 'Shukla' | 'Krishna'): string {
  const names = ['Pratipada','Dvitiya','Tritiya','Chaturthi','Panchami','Shashthi',
                 'Saptami','Ashtami','Navami','Dashami','Ekadashi','Dvadashi',
                 'Trayodashi','Chaturdashi','Purnima'];
  if (t === 15 && paksha === 'Krishna') return 'Amavasya';
  return names[t - 1] ?? `Tithi ${t}`;
}

/** List all festival definitions (no date computation). */
export function listFestivalDefs(): FestivalDef[] {
  return FESTIVALS;
}
