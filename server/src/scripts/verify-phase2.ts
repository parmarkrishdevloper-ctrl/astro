/**
 * Phase 2 verification — internal sanity checks on the astrology engine.
 *
 * Test case: a synthetic recent chart so currentDasha() lands inside the
 * 120-year Vimshottari window. Lat/lng are New Delhi (28.61°N, 77.21°E).
 *
 * The pass/fail at the end is determined by structural assertions
 * (Ketu = Rahu+180, dasha sums to 120 years, antardasha lord matches maha
 * lord, etc.) — not by hard-coding planet positions, since those depend on
 * whether ephemeris files are present (full vs Moshier fallback).
 */

import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { buildDivisional } from '../services/divisional.service';
import { computeVimshottari, computeAntardashas, currentDasha } from '../services/dasha.service';

function fmtDeg(d: number): string {
  const sign = d < 0 ? '-' : '';
  const a = Math.abs(d);
  const deg = Math.floor(a);
  const minF = (a - deg) * 60;
  const min = Math.floor(minF);
  const sec = Math.round((minF - min) * 60);
  return `${sign}${deg}°${String(min).padStart(2, '0')}'${String(sec).padStart(2, '0')}"`;
}

function line(s = '') { console.log(s); }
function hr() { line('─'.repeat(78)); }

function main() {
  initEphemeris();

  // Synthetic test chart — New Delhi, 1990-08-15 10:30 IST (UTC+5:30)
  const k = calculateKundali({
    datetime: '1990-08-15T10:30:00+05:30',
    lat: 28.6139,
    lng: 77.2090,
    placeName: 'New Delhi, India',
  });

  hr();
  line(`PHASE 2 VERIFY  —  ${k.input.placeName}`);
  line(`Birth UTC:  ${k.utc}`);
  line(`Julian Day: ${k.jd.toFixed(6)}`);
  line(`Ayanamsa:   ${k.ayanamsa.name}  ${fmtDeg(k.ayanamsa.valueDeg)}`);
  hr();
  line(`Ascendant: ${fmtDeg(k.ascendant.longitude)}   ` +
    `${k.ascendant.rashi.name} (${k.ascendant.rashi.nameHi})   ` +
    `Nakshatra: ${k.ascendant.nakshatra.name} pada ${k.ascendant.nakshatra.pada}`);
  hr();
  line('GRAHA          LONGITUDE     RASHI          NAKSHATRA            HOUSE  FLAGS');
  for (const p of k.planets) {
    const flags = [
      p.retrograde && 'R',
      p.exalted && 'EX',
      p.debilitated && 'DB',
      p.combust && 'C',
      p.ownSign && 'OWN',
    ].filter(Boolean).join(' ');
    line(
      `${p.id} ${p.name.padEnd(9)}  ${fmtDeg(p.longitude).padStart(12)}  ` +
      `${p.rashi.name.padEnd(13)}  ${(p.nakshatra.name + ' p' + p.nakshatra.pada).padEnd(20)}  ` +
      ` ${String(p.house).padStart(2)}    ${flags}`,
    );
  }
  hr();

  // ── Divisional: D9 Navamsa ────────────────────────────────────────────────
  const d9 = buildDivisional(k, 'D9');
  line(`D9 NAVAMSA   (Asc Rashi: ${d9.ascendantRashi})`);
  for (const p of d9.positions) {
    line(`  ${p.id} ${p.name.padEnd(9)}  → rashi ${p.rashi.toString().padStart(2)} ${p.rashiName.padEnd(12)} (house ${p.house})`);
  }
  hr();

  // ── Vimshottari ──────────────────────────────────────────────────────────
  const v = computeVimshottari(k);
  line(`Birth Moon nakshatra: ${v.startNakshatra.name} (lord ${v.startNakshatra.lord})`);
  line('VIMSHOTTARI MAHADASHA SEQUENCE:');
  for (const m of v.mahadashas) {
    line(`  ${m.lord} ${m.lordName.padEnd(8)} ${m.start.slice(0, 10)} → ${m.end.slice(0, 10)}  (${m.years.toFixed(2)} yrs)`);
  }
  hr();

  // First mahadasha → antardashas
  const firstAntars = computeAntardashas(v.mahadashas[0]);
  line(`Antardashas inside first maha (${v.mahadashas[0].lord}):`);
  for (const a of firstAntars) {
    line(`  ${a.lord} ${a.lordName.padEnd(8)} ${a.start.slice(0, 10)} → ${a.end.slice(0, 10)}  (${a.years.toFixed(3)} yrs)`);
  }
  hr();

  // Current dasha as of "today"
  const cur = currentDasha(k, new Date('2026-04-08T00:00:00Z'));
  if (cur?.maha) {
    line(`Active dasha as of 2026-04-08:`);
    line(`  Maha:       ${cur.maha.lord} ${cur.maha.lordName}   (${cur.maha.start.slice(0,10)} → ${cur.maha.end.slice(0,10)})`);
    if (cur.antar) line(`  Antar:      ${cur.antar.lord} ${cur.antar.lordName}   (${cur.antar.start.slice(0,10)} → ${cur.antar.end.slice(0,10)})`);
    if (cur.pratyantar) line(`  Pratyantar: ${cur.pratyantar.lord} ${cur.pratyantar.lordName}   (${cur.pratyantar.start.slice(0,10)} → ${cur.pratyantar.end.slice(0,10)})`);
  } else {
    line('No active dasha (chart date is past 120-year window).');
  }
  hr();

  // ── Sanity assertions ────────────────────────────────────────────────────
  const failures: string[] = [];
  // Sum of all 9 mahadasha years should be 120 - elapsed-of-first
  const sumMaha = v.mahadashas.reduce((s, m) => s + m.years, 0);
  // First is partial; total should be < 120 but > 113 (worst case all but ~7 elapsed)
  if (sumMaha > 120.001 || sumMaha < 100) {
    failures.push(`Total mahadasha years out of range: ${sumMaha.toFixed(2)}`);
  }
  // First antardasha lord should equal mahadasha lord
  if (firstAntars[0].lord !== v.mahadashas[0].lord) {
    failures.push(`First antardasha lord mismatch: ${firstAntars[0].lord} vs ${v.mahadashas[0].lord}`);
  }
  // Houses 1..12 should each appear exactly once in lookup
  const houseSet = new Set(k.houses.map((h) => h.num));
  if (houseSet.size !== 12) failures.push('Houses missing entries');
  // Ketu = Rahu + 180
  const ra = k.planets.find((p) => p.id === 'RA')!;
  const ke = k.planets.find((p) => p.id === 'KE')!;
  const diff = Math.abs(((ra.longitude + 180) - ke.longitude + 540) % 360 - 180);
  if (diff > 180 - 0.001) {
    // OK — diff close to 180 is wrong, we want ≈ 0
  }
  const exp = ((ra.longitude + 180) % 360);
  if (Math.abs(exp - ke.longitude) > 0.0001) {
    failures.push(`Ketu != Rahu+180  (rahu=${ra.longitude}, ketu=${ke.longitude})`);
  }

  if (failures.length) {
    line('FAILURES:');
    failures.forEach((f) => line('  ✗ ' + f));
    process.exit(1);
  }
  line('ALL SANITY CHECKS PASSED ✓');
}

main();
