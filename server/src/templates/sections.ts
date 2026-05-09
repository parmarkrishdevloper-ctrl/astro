// Pluggable section renderers for the worksheet PDF system.
//
// Every "section" is a small function: (KundaliResult, opts) => HTML string.
// The worksheet template stitches sections together inside a shared shell,
// so a 25+ report library is achieved by composing sections instead of
// duplicating templates.

import { KundaliResult } from '../services/kundali.service';
import { computeVimshottari } from '../services/dasha.service';
import { calculateAshtakavarga } from '../services/ashtakavarga.service';
import { calculateShadbala } from '../services/strength.service';
import { detectAllYogas } from '../services/yoga-engine.service';
import { interpretChart } from '../services/interpretation.service';
import { REMEDIES, getRemedyEntry } from '../data/remedies';
import { calculateJaimini } from '../services/jaimini.service';
import { calculateKP } from '../services/kp.service';
import { calculateAvasthas } from '../services/avastha.service';
import { calculateSudarshana } from '../services/sudarshana.service';
import { calculateVarshaphala } from '../services/varshaphala.service';
import { computeTransits } from '../services/transit.service';
import { PlanetId } from '../utils/astro-constants';
import { Locale, tr, p, pf } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

export interface SectionOpts {
  locale?: Locale;
  age?: number;          // varshaphala
  planets?: PlanetId[];  // remedies filter
}

const L = (o?: SectionOpts): Locale => o?.locale ?? 'en';

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDeg(d: number): string {
  const a = Math.abs(d);
  const deg = Math.floor(a);
  const minF = (a - deg) * 60;
  const min = Math.floor(minF);
  const sec = Math.round((minF - min) * 60);
  return `${deg}°${String(min).padStart(2, '0')}'${String(sec).padStart(2, '0')}"`;
}

// ─── Birth details ──────────────────────────────────────────────────────────
export function sectionBirthDetails(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  return `
    <h2>${esc(tr(lc, 'pdf.section.birth'))}</h2>
    <div class="info-row"><span>${esc(tr(lc, 'pdf.field.datetime'))}</span><span>${k.utc}</span></div>
    <div class="info-row"><span>${esc(tr(lc, 'pdf.field.place'))}</span><span>${esc(k.input.placeName ?? '—')} (${k.input.lat.toFixed(4)}°, ${k.input.lng.toFixed(4)}°)</span></div>
    <div class="info-row"><span>${esc(tr(lc, 'pdf.field.ascendant'))}</span><span>${esc(al.rashi(k.ascendant.rashi.num))} — ${fmtDeg(k.ascendant.longitude)} · ${esc(al.nakshatra(k.ascendant.nakshatra.num))} ${esc(tr(lc, 'pdf.field.pada'))} ${k.ascendant.nakshatra.pada}</span></div>
    <div class="info-row"><span>${esc(tr(lc, 'pdf.field.ayanamsa'))}</span><span>${esc(k.ayanamsa.name)} ${fmtDeg(k.ayanamsa.valueDeg)}</span></div>
  `;
}

// ─── Planet table ───────────────────────────────────────────────────────────
export function sectionPlanetTable(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const rows = k.planets.map((pl) => {
    const flags = [
      pl.retrograde && 'R', pl.exalted && 'EX', pl.debilitated && 'DB',
      pl.combust && 'C', pl.ownSign && 'OWN',
    ].filter(Boolean).join(' ');
    return `<tr>
      <td>${esc(al.planet(pl.id))}</td><td>${fmtDeg(pl.longitude)}</td>
      <td>${esc(al.rashi(pl.rashi.num))}</td><td>${esc(al.nakshatra(pl.nakshatra.num))} (p${pl.nakshatra.pada})</td>
      <td class="num">${pl.house}</td><td class="flags">${esc(flags)}</td>
    </tr>`;
  }).join('');
  return `<h2>${esc(tr(lc, 'pdf.section.planets'))}</h2>
    <table>
      <thead><tr>
        <th>${esc(tr(lc, 'pdf.field.graha'))}</th>
        <th>${esc(tr(lc, 'pdf.field.longitude'))}</th>
        <th>${esc(tr(lc, 'pdf.field.rashi'))}</th>
        <th>${esc(tr(lc, 'pdf.field.nakshatra'))}</th>
        <th>${esc(tr(lc, 'pdf.field.house'))}</th>
        <th>${esc(tr(lc, 'pdf.field.flags'))}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ─── Vimshottari Dasha ──────────────────────────────────────────────────────
export function sectionVimshottari(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const v = computeVimshottari(k);
  const rows = v.mahadashas.map((m) => `<tr>
    <td>${esc(al.planet(m.lord))}</td><td>${m.start.slice(0, 10)}</td>
    <td>${m.end.slice(0, 10)}</td><td class="num">${m.years.toFixed(2)}</td>
  </tr>`).join('');
  return `<h2>${esc(tr(lc, 'pdf.section.dasha'))}</h2>
    <table><thead><tr>
      <th>${esc(tr(lc, 'pdf.field.lord'))}</th>
      <th>${esc(tr(lc, 'pdf.field.start'))}</th>
      <th>${esc(tr(lc, 'pdf.field.end'))}</th>
      <th>${esc(tr(lc, 'pdf.field.years'))}</th>
    </tr></thead>
    <tbody>${rows}</tbody></table>`;
}

// ─── Ashtakavarga ──────────────────────────────────────────────────────────
export function sectionAshtakavarga(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const a = calculateAshtakavarga(k);
  const head = `<th>${esc(tr(lc, 'pdf.field.sign'))}</th>` +
    Object.keys(a.bav).map((b) => `<th>${esc(b)}</th>`).join('') + '<th>SAV</th>';
  const refs = Object.keys(a.bav) as Array<keyof typeof a.bav>;
  const rows = Array.from({ length: 12 }, (_, i) => {
    const cells = refs.map((r) => `<td class="num">${a.bav[r].points[i]}</td>`).join('');
    return `<tr><td class="num">${i + 1}</td>${cells}<td class="num"><strong>${a.sav.points[i]}</strong></td></tr>`;
  }).join('');
  return `<h2>${esc(tr(lc, 'pdf.section.ashtakavarga'))}</h2>
    <table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>
    <p class="muted">SAV ${esc(tr(lc, 'pdf.field.total'))}: <strong>${a.sav.total}</strong> / 337</p>`;
}

// ─── Shadbala ───────────────────────────────────────────────────────────────
export function sectionShadbala(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const s = calculateShadbala(k);
  const catLabel = (c: string): string => {
    const key = c === 'very strong'
      ? 'pdf.shadbala.category.veryStrong'
      : c === 'strong'
      ? 'pdf.shadbala.category.strong'
      : c === 'moderate'
      ? 'pdf.shadbala.category.moderate'
      : c === 'weak'
      ? 'pdf.shadbala.category.weak'
      : '';
    return key ? p(key, lc, c) : c;
  };
  const rows = s.planets.map((pl) => `<tr>
    <td>${esc(al.planet(pl.planet))}</td>
    <td class="num">${pl.components.sthana}</td>
    <td class="num">${pl.components.dig}</td>
    <td class="num">${pl.components.kala}</td>
    <td class="num">${pl.components.cheshta}</td>
    <td class="num">${pl.components.naisargika.toFixed(2)}</td>
    <td class="num">${pl.components.drik}</td>
    <td class="num"><strong>${pl.totalRupas}</strong></td>
    <td>${esc(catLabel(pl.category))}</td>
  </tr>`).join('');
  return `<h2>${esc(tr(lc, 'pdf.section.shadbala'))}</h2>
    <table>
      <thead><tr>
        <th>${esc(tr(lc, 'pdf.field.graha'))}</th>
        <th>${esc(p('pdf.kundali.sthana', lc, 'Sthana'))}</th>
        <th>${esc(p('pdf.kundali.dig', lc, 'Dig'))}</th>
        <th>${esc(p('pdf.kundali.kala', lc, 'Kala'))}</th>
        <th>${esc(p('pdf.kundali.cheshta', lc, 'Cheshta'))}</th>
        <th>${esc(p('pdf.kundali.naisargika', lc, 'Naisargika'))}</th>
        <th>${esc(p('pdf.kundali.drik', lc, 'Drik'))}</th>
        <th>${esc(p('pdf.kundali.rupas', lc, 'Rupas'))}</th>
        <th>${esc(p('pdf.kundali.category', lc, 'Category'))}</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="muted">${esc(tr(lc, 'pdf.label.strongest'))}: <strong>${esc(al.planet(s.strongest))}</strong> · ${esc(tr(lc, 'pdf.label.weakest'))}: <strong>${esc(al.planet(s.weakest))}</strong></p>`;
}

// ─── Yogas ──────────────────────────────────────────────────────────────────
export function sectionYogas(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const ys = detectAllYogas(k);
  if (ys.length === 0) return `<h2>${esc(tr(lc, 'pdf.section.yogas'))}</h2><p class="muted">${esc(tr(lc, 'pdf.label.noYogas'))}</p>`;
  const involvesWord = p('pdf.kundali.involves', lc, 'involves');
  const items = ys.map((y) => `
    <div class="card">
      <div class="card-title">${esc(y.name)} <span class="pill pill-${y.strength}">${esc(y.strength)}</span></div>
      <div class="card-meta">${esc(y.category)} · ${esc(y.source)} · ${esc(involvesWord)} ${esc((y.involves ?? []).map((id: any) => al.planet(String(id))).join(', '))}</div>
      <p>${esc(y.effect)}</p>
    </div>`).join('');
  return `<h2>${esc(tr(lc, 'pdf.section.yogas'))} (${ys.length})</h2>${items}`;
}

// ─── Interpretations ────────────────────────────────────────────────────────
export function sectionInterpretation(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const i = interpretChart(k, lc);
  const phRows = i.planetsInHouses.map((l) => `<li><strong>${esc(l.topic)}</strong>: ${esc(l.text)}</li>`).join('');
  const psRows = i.planetsInSigns.map((l) => `<li><strong>${esc(l.topic)}</strong>: ${esc(l.text)}</li>`).join('');
  const llRows = i.houseLordPlacements.map((l) => `<li><strong>${esc(l.topic)}</strong>: ${esc(l.text)}</li>`).join('');
  return `<h2>${esc(tr(lc, 'pdf.section.interpretation'))}</h2>
    <h3>${esc(tr(lc, 'pdf.field.ascendant'))}</h3><p>${esc(i.ascendant.text)}</p>
    <h3>${esc(tr(lc, 'pdf.section.planetsInHouses', 'Planets in Houses'))}</h3><ul>${phRows}</ul>
    <h3>${esc(tr(lc, 'pdf.section.planetsInSigns', 'Planets in Signs'))}</h3><ul>${psRows}</ul>
    <h3>${esc(tr(lc, 'pdf.section.houseLordPlacements', 'House Lord Placements'))}</h3><ul>${llRows}</ul>`;
}

// ─── Remedies ───────────────────────────────────────────────────────────────
export function sectionRemedies(_k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const ids = opts?.planets ?? (Object.keys(REMEDIES) as PlanetId[]);
  const cards = ids.map((id) => {
    if (!REMEDIES[id]) return '';
    const r = getRemedyEntry(id, lc);
    return `<div class="card">
      <div class="card-title">${esc(al.planet(id))} — ${esc(r.gemstone.primary)}</div>
      <div class="card-meta">${esc(r.gemstone.weight)} · ${esc(r.gemstone.metal)} · ${esc(r.gemstone.finger)} · ${esc(r.gemstone.day)}</div>
      <p><strong>${esc(tr(lc, 'pdf.kundali.beejMantra', 'Beej Mantra'))}:</strong> ${esc(r.beejMantra)}</p>
      ${r.gayatri ? `<p><strong>Gayatri:</strong> ${esc(r.gayatri)}</p>` : ''}
      <p><strong>${esc(tr(lc, 'pdf.kundali.donations', 'Donations'))}:</strong> ${esc(r.donations.join(', '))}</p>
      <p><strong>${esc(tr(lc, 'pdf.kundali.ritual', 'Ritual'))}:</strong> ${esc(r.ritual)}</p>
      <p><strong>${esc(tr(lc, 'pdf.kundali.yantra', 'Yantra'))}:</strong> ${esc(r.yantra)} · <strong>${esc(tr(lc, 'pdf.kundali.fasting', 'Fasting'))}:</strong> ${esc(r.fastingDay)}</p>
    </div>`;
  }).join('');
  return `<h2>${esc(tr(lc, 'pdf.section.remedies'))}</h2>${cards}`;
}

// ─── Jaimini ────────────────────────────────────────────────────────────────
export function sectionJaimini(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const j = calculateJaimini(k);
  const karakaRows = j.karakas.map((c) => `<tr>
    <td>${esc(c.karaka)} (${esc(c.fullName)})</td><td>${esc(al.planet(c.planet))}</td><td>${fmtDeg(c.degInRashi)}</td>
  </tr>`).join('');
  const padaRows = j.lagnas.arudhaPadas.map((l) => `<tr>
    <td class="num">A${l.house}</td><td>${esc(al.rashiByName(l.signName))}</td>
  </tr>`).join('');
  const charaRows = j.charaDasha.slice(0, 12).map((pe) => `<tr>
    <td>${esc(al.rashiByName(pe.signName))}</td><td class="num">${pe.years}</td>
    <td>${pe.startDate.slice(0, 10)}</td><td>${pe.endDate.slice(0, 10)}</td>
  </tr>`).join('');
  const tlRows = j.timeLagnas.lagnas.map((l) => `<tr>
    <td>${esc(l.name)}</td><td>${fmtDeg(l.longitude)}</td><td>${esc(al.rashi(l.rashi.num))}</td><td class="num">${l.house}</td>
  </tr>`).join('');
  const rajaRows = j.rajaYogas.map((y) => `<tr>
    <td>${esc(y.name)}</td><td>${y.present ? '<strong>YES</strong>' : '—'}</td><td><em>${esc(y.details)}</em></td>
  </tr>`).join('');
  const lonRows = j.longevity.pairs.map((pe) => `<tr>
    <td>${esc(pe.label)}</td><td>${pe.signA} / ${pe.signB}</td><td>${esc(pe.span)}</td>
  </tr>`).join('');
  return `<h2>${esc(tr(lc, 'pdf.section.jaimini'))}</h2>
    <h3>Chara Karakas</h3>
    <table><thead><tr><th>${esc(tr(lc, 'pdf.field.role'))}</th><th>${esc(tr(lc, 'pdf.field.planet'))}</th><th>${esc(tr(lc, 'pdf.field.degInSign'))}</th></tr></thead><tbody>${karakaRows}</tbody></table>
    <h3>Arudha Padas</h3>
    <table><thead><tr><th>${esc(tr(lc, 'pdf.field.pada'))}</th><th>${esc(tr(lc, 'pdf.field.sign'))}</th></tr></thead><tbody>${padaRows}</tbody></table>
    <h3>Time-sensitive Lagnas</h3>
    <table><thead><tr><th>${esc(tr(lc, 'pdf.field.ascendant'))}</th><th>${esc(tr(lc, 'pdf.field.longitude'))}</th><th>${esc(tr(lc, 'pdf.field.rashi'))}</th><th>${esc(tr(lc, 'pdf.field.house'))}</th></tr></thead><tbody>${tlRows}</tbody></table>
    <h3>Jaimini Raja Yogas</h3>
    <table><thead><tr><th>Yoga</th><th>Present</th><th>Details</th></tr></thead><tbody>${rajaRows}</tbody></table>
    <h3>Longevity (3-pair method) — <strong>${esc(j.longevity.overall)}</strong></h3>
    <table><thead><tr><th>Pair</th><th>${esc(tr(lc, 'pdf.field.sign'))}</th><th>Span</th></tr></thead><tbody>${lonRows}</tbody></table>
    <h3>Chara Dasha</h3>
    <table><thead><tr><th>${esc(tr(lc, 'pdf.field.sign'))}</th><th>${esc(tr(lc, 'pdf.field.years'))}</th><th>${esc(tr(lc, 'pdf.field.start'))}</th><th>${esc(tr(lc, 'pdf.field.end'))}</th></tr></thead><tbody>${charaRows}</tbody></table>`;
}

// ─── KP system ──────────────────────────────────────────────────────────────
export function sectionKP(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const kp = calculateKP(k);
  const rows = kp.planets.map((pl) => `<tr>
    <td>${esc(al.planet(pl.id))}</td><td>${fmtDeg(pl.longitude)}</td>
    <td>${esc(al.planet(pl.signLord))}</td><td>${esc(al.planet(pl.starLord))}</td>
    <td>${esc(al.planet(pl.subLord))}</td><td>${esc(al.planet(pl.subSubLord))}</td>
  </tr>`).join('');
  const cuspRows = kp.cusps.map((c) => `<tr>
    <td class="num">${c.house}</td><td>${fmtDeg(c.longitude)}</td>
    <td>${esc(al.planet(c.signLord))}</td><td>${esc(al.planet(c.starLord))}</td>
    <td>${esc(al.planet(c.subLord))}</td><td>${esc(al.planet(c.subSubLord))}</td>
  </tr>`).join('');
  const sigRows = kp.cuspSignificators.map((c) => `<tr>
    <td class="num">${c.house}</td>
    <td>${c.A.join(', ') || '—'}</td><td>${c.B.join(', ') || '—'}</td>
    <td>${c.C.join(', ') || '—'}</td><td>${c.D.join(', ') || '—'}</td>
  </tr>`).join('');
  return `<h2>${esc(tr(lc, 'pdf.section.kp'))}</h2>
    <h3>Planets — KP Lords</h3>
    <table><thead><tr><th>${esc(tr(lc, 'pdf.field.graha'))}</th><th>${esc(tr(lc, 'pdf.field.longitude'))}</th><th>${esc(tr(lc, 'pdf.field.sign'))}</th><th>${esc(tr(lc, 'pdf.field.star'))}</th><th>${esc(tr(lc, 'pdf.field.sub'))}</th><th>Sub-Sub</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <h3>Cusps — KP Lords</h3>
    <table><thead><tr><th>${esc(tr(lc, 'pdf.field.house'))}</th><th>${esc(tr(lc, 'pdf.field.longitude'))}</th><th>${esc(tr(lc, 'pdf.field.sign'))}</th><th>${esc(tr(lc, 'pdf.field.star'))}</th><th>${esc(tr(lc, 'pdf.field.sub'))}</th><th>Sub-Sub</th></tr></thead>
    <tbody>${cuspRows}</tbody></table>
    <h3>Cusp Significators (A=strongest, D=weakest)</h3>
    <table><thead><tr><th>${esc(tr(lc, 'pdf.field.house'))}</th><th>A</th><th>B</th><th>C</th><th>D</th></tr></thead>
    <tbody>${sigRows}</tbody></table>`;
}

// ─── Avasthas ───────────────────────────────────────────────────────────────
export function sectionAvasthas(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const av = calculateAvasthas(k);
  const rows = av.map((a) => `<tr>
    <td>${esc(al.planet(a.planet))}</td><td>${esc(a.baladi)}</td>
    <td>${esc(a.jagradadi)}</td><td>${esc(a.deeptadi)}</td>
  </tr>`).join('');
  return `<h2>${esc(tr(lc, 'pdf.section.avasthas'))}</h2>
    <table><thead><tr><th>${esc(tr(lc, 'pdf.field.graha'))}</th><th>Baladi</th><th>Jagradadi</th><th>Deeptadi</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

// ─── Sudarshana Chakra ──────────────────────────────────────────────────────
export function sectionSudarshana(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const s = calculateSudarshana(k);
  const ringHtml = s.rings.map((ring) => {
    const rows = ring.cells.map((c) => `<tr>
      <td class="num">${c.house}</td><td>${esc(al.rashiByName(c.signName))}</td><td>${esc(c.planets.map((id) => al.planet(id)).join(' '))}</td>
    </tr>`).join('');
    return `<h3>${esc(ring.reference)} Ring</h3>
      <table><thead><tr><th>${esc(tr(lc, 'pdf.field.house'))}</th><th>${esc(tr(lc, 'pdf.field.sign'))}</th><th>Planets</th></tr></thead><tbody>${rows}</tbody></table>`;
  }).join('');
  return `<h2>${esc(tr(lc, 'pdf.section.sudarshana'))}</h2>${ringHtml}`;
}

// ─── Varshaphala ────────────────────────────────────────────────────────────
export function sectionVarshaphala(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const age = opts?.age ?? 30;
  const v = calculateVarshaphala(k.input, age);
  const sahamRows = v.sahams.map((s) => `<tr>
    <td>${esc(s.name)}</td><td class="num">${fmtDeg(s.longitude)}</td>
    <td>${esc(al.rashi(s.signNum))}</td>
  </tr>`).join('');
  return `<h2>${esc(pf('pdf.sections.heading.varshaphala', lc, { age }, `Varshaphala — Year ${age}`))}</h2>
    <p><strong>${esc(p('pdf.varsha.summary', lc, 'Solar Return'))}:</strong> ${esc(v.varshaMomentUTC)}</p>
    <p><strong>${esc(p('pdf.varsha.muntha', lc, 'Muntha'))}:</strong> ${esc(al.rashi(v.muntha.signNum))} · <strong>${esc(p('pdf.varsha.varshesha', lc, 'Varshesha (year lord)'))}:</strong> ${esc(al.planet(v.varshesha))}</p>
    <h3>Sahams</h3>
    <table><thead><tr><th>Saham</th><th>${esc(tr(lc, 'pdf.field.longitude'))}</th><th>${esc(tr(lc, 'pdf.field.sign'))}</th></tr></thead>
    <tbody>${sahamRows}</tbody></table>`;
}

// ─── Transits ───────────────────────────────────────────────────────────────
export function sectionTransits(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const t = computeTransits(k);
  const rows = t.positions.map((pe) => `<tr>
    <td>${esc(al.planet(pe.id))}</td><td>${fmtDeg(pe.longitude)}</td>
    <td>${esc(al.rashiByName(pe.signName))}</td><td class="num">${pe.natalHouse}</td>
  </tr>`).join('');
  return `<h2>${esc(pf('pdf.sections.heading.transitsAt', lc, { at: t.whenUTC }, `Current Transits — ${t.whenUTC}`))}</h2>
    <table><thead><tr><th>${esc(tr(lc, 'pdf.field.graha'))}</th><th>${esc(tr(lc, 'pdf.field.longitude'))}</th><th>${esc(tr(lc, 'pdf.field.sign'))}</th><th>${esc(p('pdf.kundali.fromLagna', lc, 'From Lagna'))}</th></tr></thead>
    <tbody>${rows}</tbody></table>
    ${t.sadesati.active ? `<p><strong>${esc(tr(lc, 'pdf.label.sadeSati'))}:</strong> ${esc(t.sadesati.phase ?? '')}</p>` : ''}`;
}

// ─── Chalit (Bhava Chalit) ─────────────────────────────────────────────────
import { computeChalit } from '../services/chalit.service';
import { computeUpagrahas } from '../services/upagraha.service';
import { computeSensitivePoints } from '../services/sensitive-points.service';

export function sectionSensitivePoints(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const sp = computeSensitivePoints(k);
  const rows = sp.points.map((pe) => `<tr>
    <td>${esc(pe.name)}</td>
    <td>${fmtDeg(pe.longitude)}</td>
    <td>${esc(al.rashi(pe.rashi.num))}</td>
    <td>${esc(al.nakshatra(pe.nakshatra.num))} p${pe.nakshatra.pada}</td>
    <td class="num">${pe.house}</td>
    <td><em>${esc(pe.description)}</em></td>
  </tr>`).join('');
  const ecl = sp.preNatalEclipses;
  const eclRows = [
    ecl.solar ? `<tr><td>Solar</td><td>${esc(ecl.solar.utc)}</td><td>${fmtDeg(ecl.solar.sunLongitude)}</td><td>${esc(al.rashi(ecl.solar.rashiSun.num))}</td><td>${Math.round(ecl.solar.daysBeforeBirth)}d before</td></tr>` : '',
    ecl.lunar ? `<tr><td>Lunar</td><td>${esc(ecl.lunar.utc)}</td><td>${fmtDeg(ecl.lunar.moonLongitude)}</td><td>${esc(al.rashi(ecl.lunar.rashiMoon.num))}</td><td>${Math.round(ecl.lunar.daysBeforeBirth)}d before</td></tr>` : '',
  ].filter(Boolean).join('');
  return `<h2>Sensitive Points (${sp.isDayBirth ? 'Day' : 'Night'} birth)</h2>
    <table><thead><tr><th>Point</th><th>${esc(tr(lc, 'pdf.field.longitude'))}</th><th>${esc(tr(lc, 'pdf.field.rashi'))}</th><th>${esc(tr(lc, 'pdf.field.nakshatra'))}</th><th>${esc(tr(lc, 'pdf.field.house'))}</th><th>${esc(p('pdf.common.note', lc, 'Note'))}</th></tr></thead>
    <tbody>${rows}</tbody></table>
    ${eclRows ? `<h3>Pre-natal eclipses</h3>
      <table><thead><tr><th>Type</th><th>UTC</th><th>${esc(tr(lc, 'pdf.field.longitude'))}</th><th>${esc(tr(lc, 'pdf.field.sign'))}</th><th>Before birth</th></tr></thead>
      <tbody>${eclRows}</tbody></table>` : ''}`;
}

export function sectionUpagrahas(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const u = computeUpagrahas(k);
  const all = [
    ...(u.gulika ? [u.gulika] : []),
    ...(u.mandi  ? [u.mandi]  : []),
    ...u.kalaGroup,
  ];
  const rows = all.map((pe) => `<tr>
    <td>${esc(pe.name)}</td>
    <td>${fmtDeg(pe.longitude)}</td>
    <td>${esc(al.rashi(pe.rashi.num))}</td>
    <td>${esc(al.nakshatra(pe.nakshatra.num))} p${pe.nakshatra.pada}</td>
    <td class="num">${pe.house}</td>
    <td><em>${esc(pe.formula)}</em></td>
  </tr>`).join('');
  return `<h2>Upagrahas — Shadow Sensitive Points</h2>
    <table><thead><tr><th>Point</th><th>${esc(tr(lc, 'pdf.field.longitude'))}</th><th>${esc(tr(lc, 'pdf.field.rashi'))}</th><th>${esc(tr(lc, 'pdf.field.nakshatra'))}</th><th>${esc(tr(lc, 'pdf.field.house'))}</th><th>Formula</th></tr></thead>
    <tbody>${rows}</tbody></table>
    ${u.saturnSegment.segmentNumber != null
      ? `<p><strong>${u.saturnSegment.isDayBirth ? 'Day' : 'Night'}</strong> birth · Saturn rules segment ${u.saturnSegment.segmentNumber}/8.</p>`
      : ''}`;
}

export function sectionChalit(k: KundaliResult, opts?: SectionOpts): string {
  const lc = L(opts);
  const al = astroLabels(lc);
  const c = computeChalit(k, 'placidus');
  const bhavaRows = c.bhavas.map((b) => `<tr>
    <td class="num">${b.num}</td>
    <td>${fmtDeg(b.start)}</td>
    <td>${fmtDeg(b.midpoint)}</td>
    <td>${fmtDeg(b.end)}</td>
    <td>${esc(al.rashi(b.rashiAtMid.num))}</td>
  </tr>`).join('');
  const shiftRows = c.planets.map((pe) => `<tr>
    <td>${esc(al.planet(pe.id))}</td>
    <td>${fmtDeg(pe.longitude)}</td>
    <td class="num">${pe.wholeSignHouse}</td>
    <td class="num">${pe.chalitHouse}</td>
    <td>${pe.shifted ? esc(pe.shiftDirection) : '—'}</td>
  </tr>`).join('');
  return `<h2>Bhava Chalit (Placidus)</h2>
    <table><thead><tr><th>Bhava</th><th>${esc(tr(lc, 'pdf.field.start'))}</th><th>Cusp (mid)</th><th>${esc(tr(lc, 'pdf.field.end'))}</th><th>${esc(tr(lc, 'pdf.field.rashi'))} @ cusp</th></tr></thead>
    <tbody>${bhavaRows}</tbody></table>
    <h3>Planetary shifts vs Whole-Sign</h3>
    <table><thead><tr><th>${esc(tr(lc, 'pdf.field.graha'))}</th><th>${esc(tr(lc, 'pdf.field.longitude'))}</th><th>WS House</th><th>Chalit</th><th>Shift</th></tr></thead>
    <tbody>${shiftRows}</tbody></table>
    ${c.shiftedPlanets.length === 0
      ? '<p><em>No planets shift between whole-sign and Placidus chalit in this chart.</em></p>'
      : `<p><strong>${c.shiftedPlanets.length}</strong> planet(s) move houses in Chalit: ${c.shiftedPlanets.map((id) => esc(al.planet(id))).join(', ')}.</p>`}`;
}

// ─── Section registry ──────────────────────────────────────────────────────
export type SectionId =
  | 'birth' | 'planets' | 'vimshottari' | 'ashtakavarga' | 'shadbala'
  | 'yogas' | 'interpretation' | 'remedies' | 'jaimini' | 'kp'
  | 'avasthas' | 'sudarshana' | 'varshaphala' | 'transits' | 'chalit' | 'upagrahas' | 'sensitivePoints';

export const SECTION_REGISTRY: Record<SectionId, (k: KundaliResult, opts?: SectionOpts) => string> = {
  birth: sectionBirthDetails,
  planets: sectionPlanetTable,
  vimshottari: sectionVimshottari,
  ashtakavarga: sectionAshtakavarga,
  shadbala: sectionShadbala,
  yogas: sectionYogas,
  interpretation: sectionInterpretation,
  remedies: sectionRemedies,
  jaimini: sectionJaimini,
  kp: sectionKP,
  avasthas: sectionAvasthas,
  sudarshana: sectionSudarshana,
  varshaphala: sectionVarshaphala,
  transits: sectionTransits,
  chalit: sectionChalit,
  upagrahas: sectionUpagrahas,
  sensitivePoints: sectionSensitivePoints,
};
