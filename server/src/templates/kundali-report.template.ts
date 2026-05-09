// HTML template for the full Vedic Kundali report. Returns a string of valid
// HTML5 ready to feed to Puppeteer's setContent(). All assets are inlined so
// the PDF generation never makes outbound network calls.

import { KundaliResult } from '../services/kundali.service';
import { YogaResult } from '../services/yoga.service';
import { AllDoshasResult } from '../services/dosha.service';
import { ShadbalaResult } from '../services/strength.service';
import { VimshottariResult } from '../services/dasha.service';
import { IBranding } from '../models/branding.model';
import { type Locale, p, translator } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDeg(d: number): string {
  const a = Math.abs(d);
  const deg = Math.floor(a);
  const minF = (a - deg) * 60;
  const min = Math.floor(minF);
  const sec = Math.round((minF - min) * 60);
  return `${deg}°${String(min).padStart(2, '0')}'${String(sec).padStart(2, '0')}"`;
}

// ─── NORTH-INDIAN CHART SVG (server-rendered) ───────────────────────────────
// 12 polygon regions in the diamond layout. Houses fixed by position; the
// rashi number sitting in each house is determined by the Lagna rashi.
function northChartSvg(k: KundaliResult, sizePx = 320): string {
  const S = sizePx;
  const H = S / 2;
  const planetsByHouse: Record<number, string[]> = {};
  for (let i = 1; i <= 12; i++) planetsByHouse[i] = [];
  for (const p of k.planets) planetsByHouse[p.house].push(p.id);

  // Region polygon coordinates: [houseNum, points, labelXY]
  // Outer square corners A,B,C,D + edge midpoints m1..m4 + center O
  const A = [0, 0], B = [S, 0], C = [S, S], D = [0, S];
  const m1 = [H, 0], m2 = [S, H], m3 = [H, S], m4 = [0, H];
  const O = [H, H];
  const pts = (...arr: number[][]) => arr.map((p) => p.join(',')).join(' ');

  type Region = { house: number; poly: string; lx: number; ly: number };
  const regions: Region[] = [
    { house: 1,  poly: pts(m1, O, m4, A), lx: H * 0.5, ly: H * 0.45 },
    { house: 2,  poly: pts(A, m1, m4),    lx: H * 0.45, ly: H * 0.18 },
    { house: 3,  poly: pts(A, B, m1),     lx: H,       ly: H * 0.20 },
    { house: 4,  poly: pts(m1, B, m2, O), lx: H * 1.5, ly: H * 0.45 },
    { house: 5,  poly: pts(B, m2),        lx: H * 1.78, ly: H * 0.45 },
    { house: 6,  poly: pts(B, C, m2),     lx: H * 1.80, ly: H },
    { house: 7,  poly: pts(m2, C, m3, O), lx: H * 1.5, ly: H * 1.55 },
    { house: 8,  poly: pts(C, m3),        lx: H * 1.78, ly: H * 1.55 },
    { house: 9,  poly: pts(C, D, m3),     lx: H,       ly: H * 1.80 },
    { house: 10, poly: pts(m3, D, m4, O), lx: H * 0.5, ly: H * 1.55 },
    { house: 11, poly: pts(D, m4),        lx: H * 0.20, ly: H * 1.55 },
    { house: 12, poly: pts(D, A, m4),     lx: H * 0.20, ly: H },
  ];

  const lagnaRashi = k.ascendant.rashi.num;
  const polys = regions.map((r) => {
    const rashi = ((lagnaRashi + r.house - 2 + 12) % 12) + 1;
    const planets = planetsByHouse[r.house].join(' ');
    return `
      <polygon points="${r.poly}" fill="none" stroke="#7c2d12" stroke-width="1.5"/>
      <text x="${r.lx}" y="${r.ly - 10}" text-anchor="middle" font-size="10" fill="#94a3b8">${rashi}</text>
      <text x="${r.lx}" y="${r.ly + 6}" text-anchor="middle" font-size="11" font-weight="600" fill="#0f172a">${esc(planets)}</text>
    `;
  }).join('');

  return `
    <svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${S}" height="${S}" fill="#fff7ed" stroke="#7c2d12" stroke-width="2"/>
      <line x1="0" y1="0" x2="${S}" y2="${S}" stroke="#7c2d12" stroke-width="1.5"/>
      <line x1="${S}" y1="0" x2="0" y2="${S}" stroke="#7c2d12" stroke-width="1.5"/>
      <polygon points="${H},0 ${S},${H} ${H},${S} 0,${H}" fill="none" stroke="#7c2d12" stroke-width="1.5"/>
      ${polys}
    </svg>
  `;
}

// Map Shadbala "very strong"/"strong"/"moderate"/"weak" English token to a
// localized phrasebook entry. Falls back to the raw English token if no key
// matches.
function shadbalaCategoryLabel(cat: string, locale: Locale): string {
  const key = cat === 'very strong'
    ? 'pdf.shadbala.category.veryStrong'
    : cat === 'strong'
    ? 'pdf.shadbala.category.strong'
    : cat === 'moderate'
    ? 'pdf.shadbala.category.moderate'
    : cat === 'weak'
    ? 'pdf.shadbala.category.weak'
    : '';
  return key ? p(key, locale, cat) : cat;
}

// ─── MAIN TEMPLATE ──────────────────────────────────────────────────────────
export interface ReportData {
  kundali: KundaliResult;
  yogas: YogaResult[];
  doshas: AllDoshasResult;
  shadbala: ShadbalaResult;
  vimshottari: VimshottariResult;
  branding: Partial<IBranding>;
  generatedAt: Date;
  subjectName?: string;
  locale?: Locale;
}

export function renderKundaliReport(data: ReportData): string {
  const { kundali: k, yogas, doshas, shadbala, vimshottari, branding, generatedAt, subjectName } = data;
  const locale: Locale = data.locale ?? 'en';
  const t = translator(locale);
  const al = astroLabels(locale);
  const tx = (key: string, fb?: string) => p(key, locale, fb);

  const primary = branding.primaryColor ?? '#7c2d12';
  const accent = branding.accentColor ?? '#b45309';

  const planetRows = k.planets.map((pl) => {
    const flags = [
      pl.retrograde && 'R',
      pl.exalted && 'EX',
      pl.debilitated && 'DB',
      pl.combust && 'C',
      pl.ownSign && 'OWN',
    ].filter(Boolean).join(' ');
    return `
      <tr>
        <td>${esc(al.planet(pl.id))}</td>
        <td>${fmtDeg(pl.longitude)}</td>
        <td>${esc(al.rashi(pl.rashi.num))}</td>
        <td>${esc(al.nakshatra(pl.nakshatra.num))} (p${pl.nakshatra.pada})</td>
        <td class="num">${pl.house}</td>
        <td class="flags">${esc(flags)}</td>
      </tr>
    `;
  }).join('');

  const houseRows = k.houses.map((h) => `
    <tr>
      <td class="num">${h.num}</td>
      <td>${esc(al.rashi(h.rashiNum))}</td>
      <td>${esc(al.planet(h.lord))}</td>
    </tr>
  `).join('');

  const yogaItems = yogas.length
    ? yogas.map((y) => `
        <div class="card">
          <div class="card-title">${esc(y.name)} <span class="pill pill-${y.strength}">${esc(y.strength)}</span></div>
          <div class="card-meta">${esc(y.type)} · ${esc(tx('pdf.kundali.involves', 'involves'))} ${esc(y.involves.map((id) => al.planet(id)).join(', '))}</div>
          <p>${esc(y.description)}</p>
        </div>
      `).join('')
    : `<p class="muted">${esc(tx('pdf.kundali.noYogas', 'No major classical yogas detected.'))}</p>`;

  const presentLabel = tx('pdf.common.present', 'Present');
  const notPresentLabel = tx('pdf.common.notPresent', 'Not present');
  const notActiveLabel = tx('pdf.common.notActive', 'Not active');
  const cancelledLabel = tx('pdf.kundali.cancelled', 'Cancelled');
  const fromLagna = tx('pdf.kundali.fromLagna', 'From Lagna');
  const moonLbl = tx('pdf.kundali.fromMoon', 'Moon');
  const venusLbl = tx('pdf.kundali.fromVenus', 'Venus');

  // Kaal Sarpa label may already arrive localized via doshas.kaalSarpa.typeLabel —
  // but that is only set if the dosha service was passed the same locale. As a
  // belt-and-suspenders measure, also map the raw `type` through the translator.
  const kaalLabel = doshas.kaalSarpa.hasDosha
    ? (doshas.kaalSarpa.typeLabel ?? (doshas.kaalSarpa.type ? t.kaalSarpaType(doshas.kaalSarpa.type) : presentLabel))
    : null;

  const doshaSection = `
    <div class="grid-2">
      <div class="card">
        <div class="card-title">${esc(tx('pdf.kundali.mangal', 'Mangal Dosha'))}</div>
        <p>${doshas.mangal.hasDosha ? `<strong>${esc(presentLabel)}</strong>` : esc(notPresentLabel)}
        ${doshas.mangal.cancelled
          ? `<br/><em>${esc(cancelledLabel)} — ${esc(doshas.mangal.cancellationReasons.join('; '))}</em>`
          : ''}</p>
        <p class="card-meta">${esc(fromLagna)}: ${doshas.mangal.marsHouse.fromLagna} · ${esc(moonLbl)}: ${doshas.mangal.marsHouse.fromMoon} · ${esc(venusLbl)}: ${doshas.mangal.marsHouse.fromVenus}</p>
      </div>
      <div class="card">
        <div class="card-title">${esc(tx('pdf.kundali.kaalSarpa', 'Kaal Sarpa'))}</div>
        <p>${doshas.kaalSarpa.hasDosha ? `<strong>${esc(kaalLabel ?? presentLabel)}</strong>` : esc(notPresentLabel)}</p>
      </div>
      <div class="card">
        <div class="card-title">${esc(tx('pdf.kundali.sadeSati', 'Sade Sati'))}</div>
        <p>${doshas.sadeSati.active ? `<strong>${esc(doshas.sadeSati.phaseDescription)}</strong>` : esc(notActiveLabel)}</p>
      </div>
    </div>
  `;

  const shadbalaRows = shadbala.planets.map((pl) => `
    <tr>
      <td>${esc(al.planet(pl.planet))}</td>
      <td class="num">${pl.components.sthana}</td>
      <td class="num">${pl.components.dig}</td>
      <td class="num">${pl.components.kala}</td>
      <td class="num">${pl.components.cheshta}</td>
      <td class="num">${pl.components.naisargika.toFixed(2)}</td>
      <td class="num">${pl.components.drik}</td>
      <td class="num"><strong>${pl.totalRupas}</strong></td>
      <td>${esc(shadbalaCategoryLabel(pl.category, locale))}</td>
    </tr>
  `).join('');

  const dashaRows = vimshottari.mahadashas.map((m) => `
    <tr>
      <td>${esc(al.planet(m.lord))}</td>
      <td>${m.start.slice(0, 10)}</td>
      <td>${m.end.slice(0, 10)}</td>
      <td class="num">${m.years.toFixed(2)}</td>
    </tr>
  `).join('');

  const ascRashi = al.rashi(k.ascendant.rashi.num);
  const ascNak = al.nakshatra(k.ascendant.nakshatra.num);

  return `<!doctype html>
<html lang="${esc(locale)}">
<head>
<meta charset="utf-8" />
<title>${esc(tx('pdf.kundali.title', 'Vedic Kundali Report'))} — ${esc(subjectName ?? '')}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Gujarati', 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif; color: #0f172a; font-size: 11px; line-height: 1.45; margin: 0; }
  h1, h2, h3 { font-family: Georgia, 'Tiro Devanagari Sanskrit', 'Tiro Devanagari Hindi', 'Tiro Gujarati', 'Times New Roman', serif; color: ${primary}; margin: 0 0 6px; }
  h1 { font-size: 22px; }
  h2 { font-size: 16px; border-bottom: 2px solid ${accent}; padding-bottom: 4px; margin-top: 18px; }
  h3 { font-size: 13px; }
  .muted { color: #64748b; }
  .header { display: flex; align-items: center; gap: 14px; padding-bottom: 12px; border-bottom: 3px double ${primary}; }
  .header img { max-height: 56px; max-width: 80px; }
  .header .brand { flex: 1; }
  .header .brand .name { font-family: Georgia, 'Tiro Devanagari Sanskrit', 'Tiro Devanagari Hindi', 'Tiro Gujarati', serif; color: ${primary}; font-size: 18px; font-weight: 700; }
  .header .brand .tag { font-size: 10px; color: #64748b; font-style: italic; }
  .header .meta { text-align: right; font-size: 10px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { border: 1px solid #e2e8f0; padding: 4px 6px; text-align: left; }
  th { background: #fff7ed; color: ${primary}; font-weight: 700; font-size: 10px; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.flags { font-family: monospace; font-size: 9px; color: ${accent}; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 6px; }
  .card { border: 1px solid #e2e8f0; border-left: 3px solid ${accent}; padding: 8px 10px; background: #fffbeb; border-radius: 4px; }
  .card-title { font-weight: 700; color: ${primary}; margin-bottom: 2px; }
  .card-meta { font-size: 9px; color: #64748b; margin-bottom: 4px; }
  .card p { margin: 0; }
  .pill { display: inline-block; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .pill-strong { background: #166534; color: #fff; }
  .pill-moderate { background: #ca8a04; color: #fff; }
  .pill-weak { background: #94a3b8; color: #fff; }
  .chart-block { display: flex; gap: 16px; align-items: flex-start; margin-top: 8px; }
  .chart-block .info { flex: 1; }
  .info-row { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #e2e8f0; }
  .info-row span:first-child { color: #64748b; }
  .footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #64748b; text-align: center; }
  .footer .contact { margin-top: 4px; }
</style>
</head>
<body>

<div class="header">
  ${branding.logoDataUrl ? `<img src="${esc(branding.logoDataUrl)}" alt="logo"/>` : ''}
  <div class="brand">
    <div class="name">${esc(branding.companyName)}</div>
    <div class="tag">${esc(branding.tagline ?? '')}</div>
  </div>
  <div class="meta">
    ${esc(tx('pdf.common.generated', 'Generated'))}: ${generatedAt.toISOString().slice(0, 16).replace('T', ' ')} ${esc(tx('pdf.common.utc', 'UTC'))}<br/>
    ${esc(tx('pdf.common.ayanamsa', 'Ayanamsa'))}: ${esc(k.ayanamsa.name)} ${fmtDeg(k.ayanamsa.valueDeg)}
  </div>
</div>

<h1>${esc(tx('pdf.kundali.title', 'Vedic Kundali Report'))}</h1>
${subjectName ? `<p class="muted">${esc(tx('pdf.common.subject', 'Subject'))}: <strong>${esc(subjectName)}</strong></p>` : ''}

<h2>${esc(tx('pdf.kundali.birthDetails', 'Birth Details'))}</h2>
<div class="info-row"><span>${esc(tx('pdf.kundali.dateTimeUtc', 'Date / Time (UTC)'))}</span><span>${k.utc}</span></div>
<div class="info-row"><span>${esc(tx('pdf.common.place', 'Place'))}</span><span>${esc(k.input.placeName ?? '—')} (${k.input.lat.toFixed(4)}°, ${k.input.lng.toFixed(4)}°)</span></div>
<div class="info-row"><span>${esc(tx('pdf.common.julianDay', 'Julian Day'))}</span><span>${k.jd.toFixed(6)}</span></div>
<div class="info-row"><span>${esc(tx('pdf.kundali.ascendant', 'Ascendant (Lagna)'))}</span><span>${esc(ascRashi)} — ${fmtDeg(k.ascendant.longitude)} · ${esc(tx('pdf.common.nakshatra', 'Nakshatra'))} ${esc(ascNak)} pada ${k.ascendant.nakshatra.pada}</span></div>

<h2>${esc(tx('pdf.kundali.rasiChart', 'Rashi Chart (D-1)'))}</h2>
<div class="chart-block">
  ${northChartSvg(k)}
  <div class="info">
    <h3>${esc(tx('pdf.kundali.houses', 'Houses'))}</h3>
    <table>
      <thead><tr><th>${esc(tx('pdf.common.house', 'House'))}</th><th>${esc(tx('pdf.common.rashi', 'Rashi'))}</th><th>${esc(tx('pdf.common.lord', 'Lord'))}</th></tr></thead>
      <tbody>${houseRows}</tbody>
    </table>
  </div>
</div>

<h2>${esc(tx('pdf.kundali.planetaryPositions', 'Planetary Positions'))}</h2>
<table>
  <thead>
    <tr>
      <th>${esc(tx('pdf.kundali.graha', 'Graha'))}</th>
      <th>${esc(tx('pdf.common.longitude', 'Longitude'))}</th>
      <th>${esc(tx('pdf.common.rashi', 'Rashi'))}</th>
      <th>${esc(tx('pdf.common.nakshatra', 'Nakshatra'))}</th>
      <th>${esc(tx('pdf.common.house', 'House'))}</th>
      <th>${esc(tx('pdf.common.flags', 'Flags'))}</th>
    </tr>
  </thead>
  <tbody>${planetRows}</tbody>
</table>

<h2>${esc(tx('pdf.kundali.yogas', 'Yogas'))}</h2>
${yogaItems}

<h2>${esc(tx('pdf.kundali.doshas', 'Doshas'))}</h2>
${doshaSection}

<h2>${esc(tx('pdf.kundali.shadbalaTitle', 'Shadbala (Planetary Strength)'))}</h2>
<table>
  <thead>
    <tr>
      <th>${esc(tx('pdf.kundali.graha', 'Graha'))}</th>
      <th>${esc(tx('pdf.kundali.sthana', 'Sthana'))}</th>
      <th>${esc(tx('pdf.kundali.dig', 'Dig'))}</th>
      <th>${esc(tx('pdf.kundali.kala', 'Kala'))}</th>
      <th>${esc(tx('pdf.kundali.cheshta', 'Cheshta'))}</th>
      <th>${esc(tx('pdf.kundali.naisargika', 'Naisargika'))}</th>
      <th>${esc(tx('pdf.kundali.drik', 'Drik'))}</th>
      <th>${esc(tx('pdf.kundali.rupas', 'Rupas'))}</th>
      <th>${esc(tx('pdf.kundali.category', 'Category'))}</th>
    </tr>
  </thead>
  <tbody>${shadbalaRows}</tbody>
</table>
<p class="muted">${esc(tx('pdf.kundali.strongest', 'Strongest'))}: <strong>${esc(al.planet(shadbala.strongest))}</strong> · ${esc(tx('pdf.kundali.weakest', 'Weakest'))}: <strong>${esc(al.planet(shadbala.weakest))}</strong></p>

<h2>${esc(tx('pdf.kundali.vimshottariTitle', 'Vimshottari Mahadasha Sequence'))}</h2>
<table>
  <thead>
    <tr>
      <th>${esc(tx('pdf.common.lord', 'Lord'))}</th>
      <th>${esc(tx('pdf.common.start', 'Start'))}</th>
      <th>${esc(tx('pdf.common.end', 'End'))}</th>
      <th>${esc(tx('pdf.common.years', 'Years'))}</th>
    </tr>
  </thead>
  <tbody>${dashaRows}</tbody>
</table>

<div class="footer">
  ${esc(branding.footerText ?? '')}
  <div class="contact">
    ${branding.contact?.phone ? `${esc(tx('pdf.common.contactPhone', 'Phone'))}: ${esc(branding.contact.phone)} · ` : ''}
    ${branding.contact?.email ? `${esc(tx('pdf.common.contactEmail', 'Email'))}: ${esc(branding.contact.email)} · ` : ''}
    ${branding.contact?.website ? `${esc(tx('pdf.common.contactWeb', 'Website'))}: ${esc(branding.contact.website)}` : ''}
  </div>
</div>

</body>
</html>`;
}
