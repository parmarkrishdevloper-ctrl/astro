// Electional astrology — find auspicious time windows ("muhurats") for an
// event within a search range. We score each candidate window using:
//   • Tithi (avoid Rikta tithis 4/9/14, Amavasya for most events)
//   • Vara (weekday) — event-specific preferred days
//   • Nakshatra — event-specific auspicious nakshatras
//   • Avoid Rahu Kaal / Yamaghanda / Gulika kaal
// Returns ranked windows.

import { calculatePanchang } from './panchang.service';

export type MuhuratEvent =
  | 'marriage'
  | 'griha-pravesh'   // house warming
  | 'travel'
  | 'business'
  | 'education'
  | 'vehicle-purchase'
  | 'general';

// Auspicious nakshatra numbers per event (1..27)
const EVENT_NAKSHATRAS: Record<MuhuratEvent, number[]> = {
  marriage:           [4, 12, 13, 17, 21, 22, 26, 27],   // Rohini, U.Phalguni, Hasta, Anuradha, U.Ashadha, Shravana, U.Bhadrapada, Revati
  'griha-pravesh':    [4, 5, 12, 13, 17, 21, 22, 26, 27],
  travel:             [1, 5, 7, 13, 14, 15, 22, 24],
  business:           [3, 7, 12, 13, 21, 22, 23, 27],
  education:          [1, 5, 8, 13, 17, 22, 27],
  'vehicle-purchase': [4, 12, 13, 17, 21, 22, 26],
  general:            [4, 7, 12, 13, 17, 22, 27],
};

// Preferred weekdays per event (0=Sun..6=Sat)
const EVENT_DAYS: Record<MuhuratEvent, number[]> = {
  marriage:           [1, 3, 4, 5],     // Mon, Wed, Thu, Fri
  'griha-pravesh':    [1, 3, 4, 5],
  travel:             [1, 3, 4, 5],
  business:           [1, 3, 4, 5],
  education:          [1, 3, 4],
  'vehicle-purchase': [1, 3, 4, 5],
  general:            [1, 2, 3, 4, 5],
};

// Tithis to avoid (Rikta = 4, 9, 14; Amavasya = 30; Bhadra not encoded here)
const AVOID_TITHIS = [4, 9, 14, 30];

export interface MuhuratWindow {
  start: string;
  end: string;
  score: number;            // 0..10
  reasons: string[];        // why this slot is good
  warnings: string[];       // why caution
  panchangSnapshot: {
    tithi: string;
    nakshatra: string;
    vara: string;
    yoga: string;
  };
}

export interface MuhuratRequest {
  event: MuhuratEvent;
  startDate: Date;
  endDate: Date;
  lat: number;
  lng: number;
}

export interface MuhuratResult {
  event: MuhuratEvent;
  windows: MuhuratWindow[];      // sorted best-first
  totalCandidatesEvaluated: number;
}

function withinKaal(date: Date, k: { start: string; end: string } | null): boolean {
  if (!k) return false;
  const t = date.getTime();
  return t >= new Date(k.start).getTime() && t <= new Date(k.end).getTime();
}

export function findMuhurat(req: MuhuratRequest): MuhuratResult {
  const { event, startDate, endDate, lat, lng } = req;
  const okNak = new Set(EVENT_NAKSHATRAS[event]);
  const okDay = new Set(EVENT_DAYS[event]);

  const windows: MuhuratWindow[] = [];
  let evaluated = 0;

  // Walk one day at a time. For each day compute panchang and pick the
  // sunrise→noon block as the candidate window (subject to kaal exclusions).
  const cursor = new Date(startDate);
  cursor.setUTCHours(0, 0, 0, 0);
  const stop = new Date(endDate);

  while (cursor.getTime() <= stop.getTime()) {
    evaluated++;
    const p = calculatePanchang(new Date(cursor), lat, lng);

    let score = 5;
    const reasons: string[] = [];
    const warnings: string[] = [];

    if (okNak.has(p.nakshatra.num)) {
      score += 2;
      reasons.push(`${p.nakshatra.name} is auspicious for ${event}`);
    } else {
      warnings.push(`${p.nakshatra.name} not in preferred nakshatras`);
    }

    if (okDay.has(p.vara.num - 1)) {
      score += 1;
      reasons.push(`${p.vara.name} is favorable`);
    } else {
      warnings.push(`${p.vara.name} not preferred for ${event}`);
    }

    if (AVOID_TITHIS.includes(p.tithi.num)) {
      score -= 2;
      warnings.push(`${p.tithi.name} (Rikta/Amavasya) — generally avoided`);
    } else {
      score += 1;
      reasons.push(`${p.tithi.name} is acceptable`);
    }

    // Build a candidate window: from sunrise to abhijit muhurat end (or noon).
    if (p.sunrise && p.abhijitMuhurat) {
      const start = new Date(p.sunrise);
      const end = new Date(p.abhijitMuhurat.end);

      // Exclude if window overlaps Rahu Kaal entirely
      const noon = new Date((start.getTime() + end.getTime()) / 2);
      if (withinKaal(noon, p.rahuKaal)) {
        score -= 2;
        warnings.push('Overlaps Rahu Kaal');
      }
      if (withinKaal(noon, p.yamaghanda)) {
        score -= 1;
        warnings.push('Overlaps Yamaghanda');
      }
      if (withinKaal(noon, p.gulika)) {
        score -= 1;
        warnings.push('Overlaps Gulika Kaal');
      }

      windows.push({
        start: start.toISOString(),
        end: end.toISOString(),
        score: Math.max(0, Math.min(10, score)),
        reasons,
        warnings,
        panchangSnapshot: {
          tithi: `${p.tithi.paksha} ${p.tithi.name}`,
          nakshatra: p.nakshatra.name,
          vara: p.vara.name,
          yoga: p.yoga.name,
        },
      });
    }

    // advance one day
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  windows.sort((a, b) => b.score - a.score);
  return {
    event,
    windows,
    totalCandidatesEvaluated: evaluated,
  };
}

// ══════════════════════════════════════════════════════════════════════════
// Advanced Muhurta Finder — hour-granularity with Chaughadia + Hora +
// Tara-Bala + inauspicious panchang-yoga screening.
// ══════════════════════════════════════════════════════════════════════════

// 27 Panchang yogas that should be avoided for most auspicious work
// (Vyatipata, Vaidhriti etc.). These are panchang-yoga *numbers*, not Jaimini.
const INAUSPICIOUS_PANCHANG_YOGAS = new Set([1, 6, 9, 10, 17, 27]);
//  1 Vishkumbha · 6 Ganda · 9 Shoola · 10 Ganda · 17 Vyatipata · 27 Vaidhriti

// Chaughadia sequence — 8 segments of day (sunrise → sunset) and similar
// for night. Each labelled "good" / "neutral" / "bad" for auspicious work.
// The starting segment depends on weekday (day lord).
// Standard table:
const CHAUGHADIA_DAY: Record<number, string[]> = {
  0: ['Udveg','Char','Labh','Amrita','Kaal','Shubha','Rog','Udveg'],      // Sun
  1: ['Amrita','Kaal','Shubha','Rog','Udveg','Char','Labh','Amrita'],     // Mon
  2: ['Rog','Udveg','Char','Labh','Amrita','Kaal','Shubha','Rog'],        // Tue
  3: ['Labh','Amrita','Kaal','Shubha','Rog','Udveg','Char','Labh'],       // Wed
  4: ['Shubha','Rog','Udveg','Char','Labh','Amrita','Kaal','Shubha'],     // Thu
  5: ['Char','Labh','Amrita','Kaal','Shubha','Rog','Udveg','Char'],       // Fri
  6: ['Kaal','Shubha','Rog','Udveg','Char','Labh','Amrita','Kaal'],       // Sat
};

const CHAUGHADIA_NIGHT: Record<number, string[]> = {
  0: ['Shubha','Amrita','Char','Rog','Kaal','Labh','Udveg','Shubha'],
  1: ['Char','Rog','Kaal','Labh','Udveg','Shubha','Amrita','Char'],
  2: ['Kaal','Labh','Udveg','Shubha','Amrita','Char','Rog','Kaal'],
  3: ['Udveg','Shubha','Amrita','Char','Rog','Kaal','Labh','Udveg'],
  4: ['Amrita','Char','Rog','Kaal','Labh','Udveg','Shubha','Amrita'],
  5: ['Rog','Kaal','Labh','Udveg','Shubha','Amrita','Char','Rog'],
  6: ['Labh','Udveg','Shubha','Amrita','Char','Rog','Kaal','Labh'],
};

const CHAUGHADIA_QUALITY: Record<string, 'good' | 'neutral' | 'bad'> = {
  Amrita: 'good', Shubha: 'good', Labh: 'good',
  Char:   'neutral',
  Rog:    'bad',  Kaal:   'bad',  Udveg: 'bad',
};

// Hora (1 hour planetary ruler). Hora starts at sunrise with the day lord;
// sequence by descending-speed Chaldean order.
const CHALDEAN_ORDER = ['SA','JU','MA','SU','VE','ME','MO'];
const WEEKDAY_LORD_IDX: Record<number, number> = {
  0: 3, // Sunday  → Sun
  1: 6, // Monday  → Moon
  2: 2, // Tuesday → Mars
  3: 5, // Wed     → Mercury
  4: 1, // Thu     → Jupiter
  5: 4, // Fri     → Venus
  6: 0, // Sat     → Saturn
};

function horaRulerFromSunrise(hoursSinceSunrise: number, dow: number): string {
  // Hora cycles every 24h from sunrise; the day-lord rules hora 0, then
  // successive horas cycle Chaldean ↓ stepping by 5.
  const normHours = ((hoursSinceSunrise % 24) + 24) % 24;
  const horaIdx = Math.floor(normHours);
  const idx = WEEKDAY_LORD_IDX[dow] ?? 0;
  const lordPos = (((idx + horaIdx * 5) % 7) + 7) % 7;
  return CHALDEAN_ORDER[lordPos];
}

// Preferred hora ruler per event.
const EVENT_HORA_RULER: Record<MuhuratEvent, string[]> = {
  marriage:           ['VE', 'JU'],
  'griha-pravesh':    ['JU', 'VE', 'ME'],
  travel:             ['ME', 'JU'],
  business:           ['ME', 'JU'],
  education:          ['ME', 'JU'],
  'vehicle-purchase': ['VE', 'ME'],
  general:            ['JU', 'VE', 'ME'],
};

// Tara Bala — the 27 nakshatras starting from the native's birth nakshatra
// are grouped into 9 taras, cycled 3 times. Classical scoring:
//   1 Janma (0), 2 Sampat (+1), 3 Vipat (-1), 4 Kshema (+1),
//   5 Pratyari (-1), 6 Sadhana (+1), 7 Naidhana (-2), 8 Mitra (+1),
//   9 Param-mitra (+2).
const TARA_SCORE: Record<number, { name: string; score: number }> = {
  1: { name: 'Janma',       score: 0 },
  2: { name: 'Sampat',      score: 1 },
  3: { name: 'Vipat',       score: -1 },
  4: { name: 'Kshema',      score: 1 },
  5: { name: 'Pratyari',    score: -1 },
  6: { name: 'Sadhana',     score: 1 },
  7: { name: 'Naidhana',    score: -2 },
  8: { name: 'Mitra',       score: 1 },
  9: { name: 'Param-mitra', score: 2 },
};

function taraFor(birthNak: number, currentNak: number): { num: number; name: string; score: number } {
  const diff = ((currentNak - birthNak + 27) % 27) + 1;
  const taraNum = ((diff - 1) % 9) + 1;
  const { name, score } = TARA_SCORE[taraNum];
  return { num: taraNum, name, score };
}

export interface AdvancedMuhuratSlot {
  start: string;
  end: string;
  score: number;                 // 0..20
  hora: string;                  // planet ruling this hour
  chaughadia: string;            // Amrita / Shubha / Labh / Char / Rog / Kaal / Udveg
  chaughadiaQuality: 'good' | 'neutral' | 'bad';
  reasons: string[];
  warnings: string[];
  panchang: { tithi: string; nakshatra: string; vara: string; yoga: string };
  tara?: { num: number; name: string; score: number };
}

export interface AdvancedMuhuratRequest extends MuhuratRequest {
  /** Birth nakshatra of the native for Tara Bala scoring (1..27). */
  birthNakshatra?: number;
  /** Minutes per slot (default 60 = hourly). */
  stepMinutes?: number;
}

export interface AdvancedMuhuratResult {
  event: MuhuratEvent;
  slots: AdvancedMuhuratSlot[];        // sorted best-first
  totalSlotsEvaluated: number;
}

export function findMuhuratAdvanced(req: AdvancedMuhuratRequest): AdvancedMuhuratResult {
  const { event, startDate, endDate, lat, lng, birthNakshatra, stepMinutes = 60 } = req;
  const stepMs = stepMinutes * 60 * 1000;

  const okNak  = new Set(EVENT_NAKSHATRAS[event]);
  const okDay  = new Set(EVENT_DAYS[event]);
  const okHora = new Set(EVENT_HORA_RULER[event]);

  const slots: AdvancedMuhuratSlot[] = [];
  let evaluated = 0;

  // Build panchang-per-day cache so we don't recompute panchang 24× / day
  const panchangCache = new Map<string, ReturnType<typeof calculatePanchang>>();
  const getP = (d: Date) => {
    const key = d.toISOString().slice(0, 10);
    if (!panchangCache.has(key)) panchangCache.set(key, calculatePanchang(new Date(d), lat, lng));
    return panchangCache.get(key)!;
  };

  const cursor = new Date(startDate);
  while (cursor.getTime() <= endDate.getTime()) {
    evaluated++;
    const p = getP(cursor);
    if (!p.sunrise || !p.sunset) { cursor.setTime(cursor.getTime() + stepMs); continue; }

    const sr = new Date(p.sunrise).getTime();
    const ss = new Date(p.sunset).getTime();
    const isDay = cursor.getTime() >= sr && cursor.getTime() < ss;
    const hoursSinceRef = isDay
      ? (cursor.getTime() - sr) / 3600000
      : (cursor.getTime() - ss) / 3600000;

    // Hindu-day weekday: if cursor is before today's sunrise, treat it as
    // belonging to the previous calendar day.
    const hinduWeekdayDate = cursor.getTime() < sr ? new Date(cursor.getTime() - 86400000) : cursor;
    const dow = hinduWeekdayDate.getUTCDay();
    const hoursSinceHinduSunrise = (cursor.getTime() - (cursor.getTime() < sr ? sr - 86400000 : sr)) / 3600000;
    const hora = horaRulerFromSunrise(hoursSinceHinduSunrise, dow);

    // Chaughadia segment
    const segSpan = ((isDay ? (ss - sr) : (sr + 24 * 3600000 - ss)) / 8);
    const segIdx = Math.floor(
      (cursor.getTime() - (isDay ? sr : ss)) / segSpan,
    );
    const chSeq = isDay ? CHAUGHADIA_DAY[dow] : CHAUGHADIA_NIGHT[dow];
    const chaughadia = chSeq[Math.min(7, Math.max(0, segIdx))];
    const chaughadiaQuality = CHAUGHADIA_QUALITY[chaughadia];

    let score = 10;
    const reasons: string[] = [];
    const warnings: string[] = [];

    if (okNak.has(p.nakshatra.num)) { score += 3; reasons.push(`Nakshatra ${p.nakshatra.name}`); }
    else warnings.push(`Nakshatra ${p.nakshatra.name} not preferred`);

    if (okDay.has(p.vara.num - 1)) { score += 2; reasons.push(`${p.vara.name} preferred`); }
    else warnings.push(`${p.vara.name} not preferred`);

    if (AVOID_TITHIS.includes(p.tithi.num)) { score -= 3; warnings.push(`${p.tithi.name} (Rikta/Amavasya)`); }
    else { score += 1; reasons.push(`${p.tithi.name} acceptable`); }

    if (INAUSPICIOUS_PANCHANG_YOGAS.has(p.yoga.num)) { score -= 3; warnings.push(`Panchang yoga ${p.yoga.name} is inauspicious`); }
    else reasons.push(`Panchang yoga ${p.yoga.name}`);

    if (chaughadiaQuality === 'good')    { score += 3; reasons.push(`Chaughadia ${chaughadia}`); }
    else if (chaughadiaQuality === 'bad'){ score -= 3; warnings.push(`Chaughadia ${chaughadia}`); }

    if (okHora.has(hora)) { score += 2; reasons.push(`Hora ruled by ${hora}`); }

    if (withinKaal(cursor, p.rahuKaal))   { score -= 4; warnings.push('Rahu Kaal'); }
    if (withinKaal(cursor, p.yamaghanda)) { score -= 2; warnings.push('Yamaghanda'); }
    if (withinKaal(cursor, p.gulika))     { score -= 2; warnings.push('Gulika Kaal'); }

    let tara: AdvancedMuhuratSlot['tara'];
    if (birthNakshatra) {
      tara = taraFor(birthNakshatra, p.nakshatra.num);
      score += tara.score * 2;
      if (tara.score > 0) reasons.push(`Tara ${tara.name}`);
      else if (tara.score < 0) warnings.push(`Tara ${tara.name}`);
    }

    slots.push({
      start: new Date(cursor).toISOString(),
      end:   new Date(cursor.getTime() + stepMs).toISOString(),
      score: Math.max(0, Math.min(20, score)),
      hora, chaughadia, chaughadiaQuality,
      reasons, warnings,
      panchang: {
        tithi: `${p.tithi.paksha} ${p.tithi.name}`,
        nakshatra: p.nakshatra.name,
        vara: p.vara.name,
        yoga: p.yoga.name,
      },
      tara,
    });
    cursor.setTime(cursor.getTime() + stepMs);
  }

  slots.sort((a, b) => b.score - a.score);
  return { event, slots, totalSlotsEvaluated: evaluated };
}
