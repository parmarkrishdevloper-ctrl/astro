// Phase 18 — Auto-journal.
//
// Given a natal chart and a date (or date range), produce a journal-style
// narrative paragraph that synthesises the day's panchang, the running
// vimshottari sub-period, and notable transits onto the natal chart.
//
// Output shape matches the calendar service's day-summary convention but
// with multi-paragraph narrative in the requested locale.

import type { KundaliResult } from './kundali.service';
import { calculatePanchang, PanchangResult } from './panchang.service';
import { computeTransits, TransitResult } from './transit.service';
import { currentDasha } from './dasha.service';
import type { Locale } from '../i18n';
import { tPlanet, tRashi } from '../i18n';
import { getPhrasebook, fill } from './phrasebook';

export interface JournalEntry {
  date: string;          // YYYY-MM-DD
  weekday: string;       // localized
  paragraphs: string[];  // 2–4 paragraphs of narrative
  signals: {
    nakshatra: string;
    tithi: string;
    yoga: string;
    sunSign: string;
    moonSign: string;
    rahuKaal?: string;
    abhijit?: string;
    dasha?: string;
  };
}

export interface JournalRange {
  locale: Locale;
  from: string;
  to: string;
  entries: JournalEntry[];
}

function fmtRange(r: { start: string; end: string } | null | undefined): string | undefined {
  if (!r) return undefined;
  return `${r.start.slice(11, 16)}–${r.end.slice(11, 16)}`;
}

function dateAdd(iso: string, days: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateDiff(a: string, b: string): number {
  const da = new Date(a + 'T12:00:00Z').getTime();
  const db = new Date(b + 'T12:00:00Z').getTime();
  return Math.round((db - da) / 86400000);
}

// ─── Per-day entry builder ──────────────────────────────────────────────────

function describeTransits(
  natal: KundaliResult,
  tr: TransitResult,
  locale: Locale,
): string {
  const pb = getPhrasebook(locale);
  // Pick the slow movers (Sa, Ju, Ra, Ke) — they shape the day's mood
  const interesting = tr.positions.filter((p) =>
    p.id === 'SA' || p.id === 'JU' || p.id === 'RA' || p.id === 'KE',
  );
  const lines = interesting.map((p) => {
    const houseStr = fill(pb.glue.in_house, { n: pb.ordinal(p.natalHouse) });
    const signStr = fill(pb.glue.in_sign, { sign: tRashi(locale, p.signNum) });
    return `${tPlanet(locale, p.id)} ${signStr} (${houseStr}${p.retrograde ? ', ' + pb.tone.retrograde : ''})`;
  });
  if (lines.length === 0) return '';
  if (locale === 'en') return `Slow-moving transits today: ${lines.join('; ')}.`;
  if (locale === 'hi') return `आज के मंद-गोचर: ${lines.join('; ')}।`;
  if (locale === 'gu') return `આજના ધીમા ગોચરો: ${lines.join('; ')}.`;
  return `अद्य मन्दगोचराः: ${lines.join('; ')}॥`;
}

function describePanchangNarrative(
  pan: PanchangResult,
  locale: Locale,
): string {
  const pb = getPhrasebook(locale);
  const parts: string[] = [];
  if (locale === 'en') {
    parts.push(`The day's nakshatra is ${pan.nakshatra.name}, ruled by ${tPlanet(locale, pan.nakshatra.lord)}, of the ${pan.nakshatra.gana} gana — ${pan.nakshatra.deity}'s asterism.`);
    parts.push(`Tithi ${pan.tithi.name} (${pan.tithi.paksha} paksha); yoga ${pan.yoga.name}; karana ${pan.karana.name}.`);
    parts.push(`Sun in ${pan.sun.rashi}, Moon in ${pan.moon.rashi}. Ayana: ${pan.ayana}; Ritu: ${pan.ritu}.`);
  } else if (locale === 'hi') {
    parts.push(`आज का नक्षत्र ${pan.nakshatra.nameHi || pan.nakshatra.name} है, स्वामी ${tPlanet(locale, pan.nakshatra.lord)}, ${pan.nakshatra.gana} गण।`);
    parts.push(`तिथि ${pan.tithi.name} (${pan.tithi.paksha} पक्ष); योग ${pan.yoga.name}; करण ${pan.karana.name}।`);
    parts.push(`सूर्य ${pan.sun.rashi} में, चंद्र ${pan.moon.rashi} में। अयन: ${pan.ayana}; ऋतु: ${pan.ritu}।`);
  } else if (locale === 'gu') {
    parts.push(`આજનું નક્ષત્ર ${pan.nakshatra.name}, સ્વામી ${tPlanet(locale, pan.nakshatra.lord)}.`);
    parts.push(`તિથિ ${pan.tithi.name} (${pan.tithi.paksha} પક્ષ); યોગ ${pan.yoga.name}; કરણ ${pan.karana.name}.`);
    parts.push(`સૂર્ય ${pan.sun.rashi}, ચંદ્ર ${pan.moon.rashi}. અયન: ${pan.ayana}; ઋતુ: ${pan.ritu}.`);
  } else {
    parts.push(`अद्य नक्षत्रं ${pan.nakshatra.name}, स्वामी ${tPlanet(locale, pan.nakshatra.lord)}॥`);
    parts.push(`तिथिः ${pan.tithi.name}; योगः ${pan.yoga.name}; करणं ${pan.karana.name}॥`);
    parts.push(`सूर्यः ${pan.sun.rashi}, चन्द्रः ${pan.moon.rashi}॥`);
  }
  // Auspicious / inauspicious windows
  if (pan.abhijitMuhurat) {
    parts.push(fill(pb.today.auspicious_window, { window: fmtRange(pan.abhijitMuhurat) ?? '' }));
  }
  if (pan.rahuKaal) {
    parts.push(fill(pb.today.inauspicious_window, { window: fmtRange(pan.rahuKaal) ?? '' }));
  }
  return parts.join(' ');
}

export function buildJournalEntry(
  natal: KundaliResult,
  date: string,
  lat: number,
  lng: number,
  locale: Locale = 'en',
): JournalEntry {
  const pb = getPhrasebook(locale);
  const dt = new Date(date + 'T12:00:00Z');
  const weekday = pb.weekday[dt.getUTCDay()];
  const pan = calculatePanchang(dt, lat, lng);
  const tr = computeTransits(natal, dt.toISOString());
  const dd = currentDasha(natal, dt);

  const lead = fill(pb.today.journal_lead, { weekday, date });
  const dashaLine = dd?.maha
    ? fill(pb.today.dasha_running, {
        maha: tPlanet(locale, dd.maha.lord),
        antar: dd.antar ? tPlanet(locale, dd.antar.lord) : '—',
      })
    : '';

  const paragraphs: string[] = [];
  paragraphs.push(`${lead} ${describePanchangNarrative(pan, locale)}`);
  if (dashaLine) paragraphs.push(`${dashaLine}.`);
  const transitLine = describeTransits(natal, tr, locale);
  if (transitLine) paragraphs.push(transitLine);
  const close = fill(pb.today.journal_close, { lord: pan.vara.lord });
  paragraphs.push(close);

  return {
    date,
    weekday,
    paragraphs,
    signals: {
      nakshatra: pan.nakshatra.name,
      tithi: pan.tithi.name,
      yoga: pan.yoga.name,
      sunSign: pan.sun.rashi,
      moonSign: pan.moon.rashi,
      rahuKaal: fmtRange(pan.rahuKaal),
      abhijit: fmtRange(pan.abhijitMuhurat),
      dasha: dd?.maha ? `${tPlanet(locale, dd.maha.lord)}${dd.antar ? '/' + tPlanet(locale, dd.antar.lord) : ''}` : undefined,
    },
  };
}

export function buildJournalRange(
  natal: KundaliResult,
  fromDate: string,
  toDate: string,
  lat: number,
  lng: number,
  locale: Locale = 'en',
): JournalRange {
  const days = Math.max(0, Math.min(31, dateDiff(fromDate, toDate)));
  const entries: JournalEntry[] = [];
  for (let i = 0; i <= days; i++) {
    const d = dateAdd(fromDate, i);
    entries.push(buildJournalEntry(natal, d, lat, lng, locale));
  }
  return { locale, from: fromDate, to: toDate, entries };
}
