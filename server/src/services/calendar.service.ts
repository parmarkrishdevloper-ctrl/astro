// Calendar builder — renders a per-day summary (365-day or multi-year) with
// panchang headline fields + festival overlays. Kept intentionally lightweight
// so the client can grid a year on the screen without blowing up the payload:
//
//   date, weekday, tithi name/num/paksha, nakshatra name/num,
//   yoga name, masa (amanta), ritu, ayana, samvat (vikram), festivals[]
//
// A full PanchangResult per day would be ~3 kB × 365 ≈ 1 MB — too heavy. The
// summary is ~200 bytes/day, well under 100 kB for a full year.

import { calculatePanchang } from './panchang.service';
import { generateFestivals, FestivalOccurrence } from './festivals.service';
import { Locale } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

export interface CalendarDay {
  date: string;             // "YYYY-MM-DD"
  weekday: string;          // "Mon", "Tue", ...
  weekdayNum: number;       // 0=Sun..6=Sat
  tithi: { num: number; name: string; paksha: string };
  nakshatra: { num: number; name: string };
  yoga: string;
  karana: string;
  masa: string;             // amanta
  ritu: string;
  ayana: string;
  samvat: { vikram: number; shaka: number };
  sunrise: string | null;
  sunset: string | null;
  moonrise: string | null;
  moonset: string | null;
  festivals: { id: string; name: string; category: string }[];
  specialBadges: string[];  // ["Ekadashi","Purnima","Amavasya","Sankranti"] etc.
}

const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

/** Build a day-by-day calendar between `start` and `end` inclusive. */
export function buildCalendarRange(
  start: Date,
  end: Date,
  lat: number,
  lng: number,
  locale: Locale = 'en',
): CalendarDay[] {
  const al = astroLabels(locale);
  // Pre-compute festivals once for the whole range to amortize scanning.
  const fests = generateFestivals(start, end, lat, lng, locale);
  const festByDate = new Map<string, FestivalOccurrence[]>();
  for (const f of fests) {
    const arr = festByDate.get(f.date) ?? [];
    arr.push(f);
    festByDate.set(f.date, arr);
  }

  const days: CalendarDay[] = [];
  for (let d = new Date(start.getTime()); d.getTime() <= end.getTime(); d = addDays(d, 1)) {
    const pan = calculatePanchang(d, lat, lng);
    const iso = d.toISOString().slice(0, 10);
    const dayFests = festByDate.get(iso) ?? [];
    const badges: string[] = [];
    const withinPaksha = pan.tithi.num <= 15 ? pan.tithi.num : pan.tithi.num - 15;
    if (withinPaksha === 11) badges.push('Ekadashi');
    if (withinPaksha === 15 && pan.tithi.paksha === 'Shukla') badges.push('Purnima');
    if (withinPaksha === 15 && pan.tithi.paksha === 'Krishna') badges.push('Amavasya');
    if (withinPaksha === 4 && pan.tithi.paksha === 'Krishna') badges.push('Sankashti');
    if (dayFests.some((f) => f.def.category === 'sankranti')) badges.push('Sankranti');

    // Short weekday in the requested locale (3-char-ish slug from al.vara)
    const fullVara = al.vara(['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][pan.vara.num - 1]);
    const weekdayShort = locale === 'en' ? WD[pan.vara.num - 1] : fullVara.slice(0, 3);

    days.push({
      date: iso,
      weekday: weekdayShort,
      weekdayNum: pan.vara.num - 1,
      tithi: { num: pan.tithi.num, name: al.tithi(pan.tithi.name), paksha: al.paksha(pan.tithi.paksha) },
      nakshatra: { num: pan.nakshatra.num, name: al.nakshatra(pan.nakshatra.num) },
      yoga: al.pyoga(pan.yoga.name),
      karana: al.karana(pan.karana.name),
      masa: pan.masa.amanta, // amanta names stay English (used as functional key in joins)
      ritu: pan.ritu,
      ayana: pan.ayana,
      samvat: { vikram: pan.samvat.vikram, shaka: pan.samvat.shaka },
      sunrise: pan.sunrise,
      sunset: pan.sunset,
      moonrise: pan.moonrise,
      moonset: pan.moonset,
      festivals: dayFests.map((f) => ({
        id: f.def.id, name: f.def.name, category: f.def.category,
      })),
      specialBadges: badges,
    });
  }
  return days;
}

/** Convenience: full calendar year (Jan 1 → Dec 31). */
export function buildCalendarYear(year: number, lat: number, lng: number, locale: Locale = 'en'): CalendarDay[] {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year, 11, 31));
  return buildCalendarRange(start, end, lat, lng, locale);
}

/** Aggregate ayana/ritu/masa segments over a range — for year-wheel viz. */
export interface SegmentRow {
  label: string;
  start: string;
  end: string;
  kind: 'ayana' | 'ritu' | 'masa';
}

export function buildSegments(days: CalendarDay[]): SegmentRow[] {
  const out: SegmentRow[] = [];
  if (days.length === 0) return out;

  function collectBy(kind: 'ayana' | 'ritu' | 'masa', keyOf: (d: CalendarDay) => string) {
    let segStart = days[0].date;
    let segKey = keyOf(days[0]);
    for (let i = 1; i < days.length; i++) {
      const k = keyOf(days[i]);
      if (k !== segKey) {
        out.push({ label: segKey, start: segStart, end: days[i - 1].date, kind });
        segStart = days[i].date;
        segKey = k;
      }
    }
    out.push({ label: segKey, start: segStart, end: days[days.length - 1].date, kind });
  }
  collectBy('ayana', (d) => d.ayana);
  collectBy('ritu',  (d) => d.ritu);
  collectBy('masa',  (d) => d.masa);
  return out;
}
