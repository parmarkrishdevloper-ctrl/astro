import { swisseph } from '../config/ephemeris';

/** Convert a UTC Date to Julian Day (UT). */
export function dateToJD(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();
  const hour =
    date.getUTCHours() +
    date.getUTCMinutes() / 60 +
    date.getUTCSeconds() / 3600 +
    date.getUTCMilliseconds() / 3600000;
  return swisseph.swe_julday(y, m, d, hour, swisseph.SE_GREG_CAL);
}

/** Inverse: Julian Day → UTC Date. */
export function jdToDate(jd: number): Date {
  const r: any = swisseph.swe_revjul(jd, swisseph.SE_GREG_CAL);
  const intHour = Math.floor(r.hour);
  const minF = (r.hour - intHour) * 60;
  const intMin = Math.floor(minF);
  const intSec = Math.round((minF - intMin) * 60);
  return new Date(Date.UTC(r.year, r.month - 1, r.day, intHour, intMin, intSec));
}

/**
 * Parse a "local" datetime + tz offset (hours, e.g. 5.5 for IST) into a UTC Date.
 * Accepts either:
 *   - ISO 8601 string with explicit offset (e.g. "1990-08-15T10:30:00+05:30") → tzOffset ignored
 *   - Naive ISO ("1990-08-15T10:30:00") + tzOffset
 */
export function toUTC(input: string, tzOffsetHours?: number): Date {
  const hasOffset = /[zZ]|[+-]\d{2}:?\d{2}$/.test(input);
  if (hasOffset) return new Date(input);
  if (tzOffsetHours == null) {
    throw new Error('Datetime has no offset and no tzOffsetHours was provided');
  }
  // Treat as UTC, then subtract the offset
  const asUtc = new Date(input + 'Z');
  return new Date(asUtc.getTime() - tzOffsetHours * 3600 * 1000);
}
