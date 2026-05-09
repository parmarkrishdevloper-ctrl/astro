/**
 * Phase 4 verification — exercises matching, panchang, doshas, yogas,
 * shadbala, numerology, and muhurat services with deterministic inputs.
 */

import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { matchKundalis } from '../services/matching.service';
import { calculatePanchang } from '../services/panchang.service';
import { checkAllDoshas } from '../services/dosha.service';
import { detectYogas } from '../services/yoga.service';
import { calculateShadbala } from '../services/strength.service';
import { calculateNumerology } from '../services/numerology.service';
import { findMuhurat } from '../services/muhurat.service';

function line(s = '') { console.log(s); }
function hr() { line('─'.repeat(78)); }

function main() {
  initEphemeris();

  const boy = {
    datetime: '1990-08-15T10:30:00+05:30',
    lat: 28.6139, lng: 77.2090,
    placeName: 'New Delhi, India',
  };
  const girl = {
    datetime: '1992-03-20T14:15:00+05:30',
    lat: 19.0760, lng: 72.8777,
    placeName: 'Mumbai, India',
  };

  const bk = calculateKundali(boy);

  hr();
  line('PHASE 4 VERIFY');
  hr();

  // ── ASHTAKOOT MATCHING ────────────────────────────────────────────────────
  const m = matchKundalis(boy, girl);
  line(`MATCHING — Boy ${m.boy.rashi}/${m.boy.nakshatra}, Girl ${m.girl.rashi}/${m.girl.nakshatra}`);
  for (const k of m.koots) {
    line(`  ${k.name.padEnd(13)}  ${k.obtained}/${k.max}   ${k.detail}`);
  }
  line(`  TOTAL:        ${m.total.obtained}/${m.total.max}   →  ${m.verdict}`);
  line(`  Manglik: boy=${m.manglik.boy} girl=${m.manglik.girl} compatible=${m.manglik.compatible}`);
  line(`  Nadi dosha: ${m.nadiDosha}    Bhakoot dosha: ${m.bhakootDosha}`);
  hr();

  // ── PANCHANG ──────────────────────────────────────────────────────────────
  const p = calculatePanchang(new Date('2026-04-08T00:00:00Z'), 28.6139, 77.2090);
  line('PANCHANG (New Delhi, 2026-04-08)');
  line(`  Vara:      ${p.vara.name} (lord ${p.vara.lord})`);
  line(`  Tithi:     ${p.tithi.paksha} ${p.tithi.name}`);
  line(`  Nakshatra: ${p.nakshatra.name} pada ${p.nakshatra.pada} (lord ${p.nakshatra.lord})`);
  line(`  Yoga:      ${p.yoga.name}`);
  line(`  Karana:    ${p.karana.name}`);
  line(`  Sunrise:   ${p.sunrise}`);
  line(`  Sunset:    ${p.sunset}`);
  line(`  Rahu Kaal: ${p.rahuKaal?.start} → ${p.rahuKaal?.end}`);
  line(`  Abhijit:   ${p.abhijitMuhurat?.start} → ${p.abhijitMuhurat?.end}`);
  hr();

  // ── DOSHAS ────────────────────────────────────────────────────────────────
  const d = checkAllDoshas(bk, new Date('2026-04-08T00:00:00Z'));
  line('DOSHAS');
  line(`  Mangal:    has=${d.mangal.hasDosha}  fromLagna=${d.mangal.fromLagna} fromMoon=${d.mangal.fromMoon} fromVenus=${d.mangal.fromVenus}`);
  line(`             cancelled=${d.mangal.cancelled}  reasons=[${d.mangal.cancellationReasons.join(', ')}]`);
  line(`  KaalSarpa: has=${d.kaalSarpa.hasDosha}  type=${d.kaalSarpa.type ?? '—'}`);
  line(`  SadeSati:  active=${d.sadeSati.active}  phase=${d.sadeSati.phase ?? '—'}  ${d.sadeSati.phaseDescription}`);
  hr();

  // ── YOGAS ─────────────────────────────────────────────────────────────────
  const yogas = detectYogas(bk);
  line(`YOGAS (${yogas.length} detected)`);
  for (const y of yogas) {
    line(`  ${y.name} (${y.type}, ${y.strength})`);
    line(`     ${y.description}`);
  }
  hr();

  // ── SHADBALA ──────────────────────────────────────────────────────────────
  const s = calculateShadbala(bk);
  line('SHADBALA');
  line('  PLANET  STH   DIG   KAL   CHE   NAI   DRK   TOTAL(V)  RUPAS  CATEGORY');
  for (const p of s.planets) {
    const c = p.components;
    line(
      `  ${p.planet.padEnd(6)}  ${c.sthana.toString().padStart(4)}  ${c.dig.toString().padStart(4)}  ` +
      `${c.kala.toString().padStart(4)}  ${c.cheshta.toString().padStart(4)}  ${c.naisargika.toFixed(2).padStart(5)}  ` +
      `${c.drik.toString().padStart(4)}   ${p.totalVirupas.toString().padStart(7)}  ${p.totalRupas.toString().padStart(5)}  ${p.category}`,
    );
  }
  line(`  Strongest: ${s.strongest}    Weakest: ${s.weakest}`);
  hr();

  // ── NUMEROLOGY ────────────────────────────────────────────────────────────
  const n = calculateNumerology(new Date('1990-08-15'), 'Arjun Sharma');
  line('NUMEROLOGY (DOB 1990-08-15, name "Arjun Sharma")');
  line(`  Moolank:  ${n.moolank.number} (${n.moolank.rulingPlanet}) — ${n.moolank.personality}`);
  line(`  Bhagyank: ${n.bhagyank.number} (${n.bhagyank.rulingPlanet}) — ${n.bhagyank.personality}`);
  if (n.nameNumber) line(`  Name no.: ${n.nameNumber.number} (sum ${n.nameNumber.rawSum}) — ${n.nameNumber.rulingPlanet}`);
  hr();

  // ── MUHURAT ───────────────────────────────────────────────────────────────
  const mu = findMuhurat({
    event: 'marriage',
    startDate: new Date('2026-05-01T00:00:00Z'),
    endDate: new Date('2026-05-15T00:00:00Z'),
    lat: 28.6139, lng: 77.2090,
  });
  line(`MUHURAT — marriage windows in May 1-15, 2026 (${mu.totalCandidatesEvaluated} days evaluated)`);
  for (const w of mu.windows.slice(0, 5)) {
    line(`  score=${w.score.toFixed(1)}  ${w.start.slice(0,10)}  tithi=${w.panchangSnapshot.tithi}  nak=${w.panchangSnapshot.nakshatra}  vara=${w.panchangSnapshot.vara}`);
    if (w.reasons.length) line(`     + ${w.reasons.join(' | ')}`);
    if (w.warnings.length) line(`     ! ${w.warnings.join(' | ')}`);
  }
  hr();

  // ── SANITY ────────────────────────────────────────────────────────────────
  const failures: string[] = [];
  if (m.total.obtained < 0 || m.total.obtained > m.total.max) failures.push('Match score out of bounds');
  if (m.total.max !== 36) failures.push(`Match max should be 36, got ${m.total.max}`);
  if (s.planets.length !== 7) failures.push('Shadbala should cover 7 grahas');
  if (n.moolank.number < 1 || n.moolank.number > 9) failures.push('Moolank out of range');
  if (!p.tithi?.name) failures.push('Panchang tithi missing');
  if (mu.windows.length === 0) failures.push('Muhurat returned no windows');

  if (failures.length) {
    line('FAILURES:');
    failures.forEach((f) => line('  ✗ ' + f));
    process.exit(1);
  }
  line('ALL PHASE 4 SANITY CHECKS PASSED ✓');
}

main();
