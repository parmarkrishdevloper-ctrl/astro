// Varshphal book — HTML template for the annual horoscope (solar return)
// report. Covers: natal header, varsha chart, Muntha/Varshesha, Tajika sahams,
// Yogi/Avayogi, Tripataki chakra, Masa-Phala timeline, Mudda dasha, Tajika
// yogas (Itthasala etc.).

import { KundaliResult } from '../services/kundali.service';
import { VarshaphalaResult, MuddaPeriod } from '../services/varshaphala.service';
import { IBranding } from '../models/branding.model';
import { type Locale, p, pf } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
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

function northChartSvg(k: KundaliResult, sizePx = 300): string {
  const S = sizePx;
  const H = S / 2;
  const planetsByHouse: Record<number, string[]> = {};
  for (let i = 1; i <= 12; i++) planetsByHouse[i] = [];
  for (const p of k.planets) planetsByHouse[p.house].push(p.id);
  const A = [0, 0], B = [S, 0], C = [S, S], D = [0, S];
  const m1 = [H, 0], m2 = [S, H], m3 = [H, S], m4 = [0, H];
  const O = [H, H];
  const pts = (...arr: number[][]) => arr.map((p) => p.join(',')).join(' ');
  const regions = [
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
    </svg>`;
}

export interface VarshphalaReportData {
  natal: KundaliResult;
  varsha: VarshaphalaResult;
  mudda: MuddaPeriod[];
  branding: Partial<IBranding>;
  generatedAt: Date;
  subjectName?: string;
  locale?: Locale;
}

export function renderVarshphalReport(data: VarshphalaReportData): string {
  const { natal, varsha, mudda, branding, generatedAt, subjectName } = data;
  const locale: Locale = data.locale ?? 'en';
  const al = astroLabels(locale);
  const tx = (key: string, fb?: string) => p(key, locale, fb);
  const tf = (key: string, vars: Record<string, string | number>, fb?: string) =>
    pf(key, locale, vars, fb);

  const primary = branding.primaryColor ?? '#7c2d12';
  const accent  = branding.accentColor  ?? '#b45309';

  const planetRows = varsha.chart.planets.map((pl) => {
    const flags = [
      pl.retrograde && 'R', pl.exalted && 'EX', pl.debilitated && 'DB',
      pl.combust && 'C', pl.ownSign && 'OWN',
    ].filter(Boolean).join(' ');
    return `<tr>
      <td>${esc(al.planet(pl.id))}</td>
      <td>${fmtDeg(pl.longitude)}</td>
      <td>${esc(al.rashi(pl.rashi.num))}</td>
      <td>${esc(al.nakshatra(pl.nakshatra.num))} p${pl.nakshatra.pada}</td>
      <td class="num">${pl.house}</td>
      <td class="flags">${esc(flags)}</td>
    </tr>`;
  }).join('');

  const sahamRows = varsha.sahams.slice(0, 24).map((s) => `
    <tr><td>${esc(s.name)}</td><td>${fmtDeg(s.longitude)}</td><td>${esc(al.rashi(s.signNum))}</td></tr>
  `).join('');

  const muddaRows = mudda.map((m) => `
    <tr>
      <td>${esc(al.planet(m.lord))}</td>
      <td>${m.startDate.slice(0, 10)}</td>
      <td>${m.endDate.slice(0, 10)}</td>
      <td class="num">${m.days.toFixed(1)}</td>
    </tr>
  `).join('');

  const masaRows = varsha.masaPhala.map((m) => `
    <tr>
      <td class="num">${m.month}</td>
      <td>${m.startDate.slice(0, 10)}</td>
      <td>${m.endDate.slice(0, 10)}</td>
      <td>${esc(al.rashi(m.munthaSign))}</td>
      <td>${esc(al.rashi(m.moonSign))}</td>
    </tr>
  `).join('');

  // Tajika yoga emission is engine-shape-dependent; cast through any to keep the
  // template tolerant if the upstream service later starts returning a `yogas[]`.
  const tajikaYogas: any[] = (varsha as any)?.tajika?.yogas ?? [];
  const tajikaYogaItems = tajikaYogas.length
    ? tajikaYogas.map((y: any) => `
        <div class="card">
          <div class="card-title">${esc(y.name)} <span class="pill pill-${y.strength ?? 'moderate'}">${esc(y.strength ?? 'moderate')}</span></div>
          <div class="card-meta">${esc(((y.planets ?? []) as string[]).map((id) => al.planet(id)).join(' + '))}</div>
          <p>${esc(y.description ?? '')}</p>
        </div>
      `).join('')
    : `<p class="muted">${esc(tx('pdf.varsha.noTajikaYogas', 'No active Tajika yogas in this solar return.'))}</p>`;

  const ageHeading = tf('pdf.varsha.ageHeading', { age: varsha.age }, `Age ${varsha.age}`);

  return `<!doctype html>
<html lang="${esc(locale)}">
<head>
<meta charset="utf-8" />
<title>${esc(tx('pdf.varsha.title', 'Varshphal Book'))} — ${esc(subjectName ?? ageHeading)}</title>
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
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 6px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 6px; }
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
  .page-break { page-break-after: always; }
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
    ${esc(tx('pdf.common.ayanamsa', 'Ayanamsa'))}: ${esc(natal.ayanamsa.name)} ${fmtDeg(natal.ayanamsa.valueDeg)}
  </div>
</div>

<h1>${esc(tx('pdf.varsha.title', 'Varshphal Book'))} — ${esc(ageHeading)}</h1>
${subjectName ? `<p class="muted">${esc(tx('pdf.common.subject', 'Subject'))}: <strong>${esc(subjectName)}</strong></p>` : ''}

<h2>${esc(tx('pdf.varsha.summary', 'Solar Return'))}</h2>
<div class="info-row"><span>${esc(tx('pdf.varsha.varshaUtc', 'Varsha Pravesh (UTC)'))}</span><span>${varsha.varshaMomentUTC.slice(0, 16).replace('T', ' ')}</span></div>
<div class="info-row"><span>${esc(tx('pdf.varsha.natalMoment', 'Natal moment'))}</span><span>${natal.utc}</span></div>
<div class="info-row"><span>${esc(tx('pdf.common.place', 'Place'))}</span><span>${esc(natal.input.placeName ?? '—')} (${natal.input.lat.toFixed(4)}°, ${natal.input.lng.toFixed(4)}°)</span></div>
<div class="info-row"><span>${esc(tx('pdf.varsha.varshaLagna', 'Varsha Lagna'))}</span><span>${esc(al.rashi(varsha.chart.ascendant.rashi.num))} — ${fmtDeg(varsha.chart.ascendant.longitude)}</span></div>

<h2>${esc(tx('pdf.varsha.varshaChartTitle', 'Varsha Chart (D-1 of the year)'))}</h2>
<div class="chart-block">
  ${northChartSvg(varsha.chart)}
  <div class="info">
    <h3>${esc(tx('pdf.varsha.yearRulers', 'Year rulers'))}</h3>
    <div class="info-row"><span>${esc(tx('pdf.varsha.muntha', 'Muntha'))}</span><span>${esc(al.rashi(varsha.muntha.signNum))} (${esc(tx('pdf.common.lord', 'Lord').toLowerCase())}: ${esc(al.planet(varsha.muntha.lord))})</span></div>
    <div class="info-row"><span>${esc(tx('pdf.varsha.varshesha', 'Varshesha (year lord)'))}</span><span>${esc(al.planet(varsha.varshesha))}</span></div>
    <div class="info-row"><span>${esc(tx('pdf.varsha.yogi', 'Yogi point'))}</span><span>${fmtDeg(varsha.yogi.point)} — ${esc(tx('pdf.common.nakshatra', 'Nakshatra').toLowerCase())} ${esc(tx('pdf.common.lord', 'Lord').toLowerCase())} ${esc(al.planet(varsha.yogi.nakLord))}</span></div>
    <div class="info-row"><span>${esc(tx('pdf.varsha.avayogi', 'Avayogi'))}</span><span>${esc(al.planet(varsha.avayogi.nakLord))}</span></div>
    <div class="info-row"><span>${esc(tx('pdf.varsha.duplicateYogi', 'Duplicate Yogi'))}</span><span>${esc(al.planet(varsha.duplicateYogi))}</span></div>
  </div>
</div>

<h2>${esc(tx('pdf.varsha.planetaryPositions', 'Planetary Positions (Varsha chart)'))}</h2>
<table>
  <thead><tr>
    <th>${esc(tx('pdf.kundali.graha', 'Graha'))}</th>
    <th>${esc(tx('pdf.common.longitude', 'Longitude'))}</th>
    <th>${esc(tx('pdf.common.rashi', 'Rashi'))}</th>
    <th>${esc(tx('pdf.common.nakshatra', 'Nakshatra'))}</th>
    <th>${esc(tx('pdf.common.house', 'House'))}</th>
    <th>${esc(tx('pdf.common.flags', 'Flags'))}</th>
  </tr></thead>
  <tbody>${planetRows}</tbody>
</table>

<div class="page-break"></div>

<h2>${esc(tx('pdf.varsha.sahams', 'Tajika Sahams (selected)'))}</h2>
<table>
  <thead><tr>
    <th>Saham</th>
    <th>${esc(tx('pdf.common.longitude', 'Longitude'))}</th>
    <th>${esc(tx('pdf.common.rashi', 'Rashi'))}</th>
  </tr></thead>
  <tbody>${sahamRows}</tbody>
</table>

<h2>${esc(tx('pdf.varsha.tajikaYogas', 'Tajika Yogas'))}</h2>
<div class="grid-2">${tajikaYogaItems}</div>

<h2>${esc(tx('pdf.varsha.masaPhala', 'Masa-Phala (monthly timeline)'))}</h2>
<table>
  <thead><tr>
    <th>${esc(tx('pdf.common.month', 'Month'))}</th>
    <th>${esc(tx('pdf.common.start', 'Start'))}</th>
    <th>${esc(tx('pdf.common.end', 'End'))}</th>
    <th>${esc(tx('pdf.varsha.munthaSign', 'Muntha sign'))}</th>
    <th>${esc(tx('pdf.varsha.moonSign', 'Moon sign'))}</th>
  </tr></thead>
  <tbody>${masaRows}</tbody>
</table>

<h2>${esc(tx('pdf.varsha.muddaDasha', 'Mudda Dasha (annual Vimshottari)'))}</h2>
<table>
  <thead><tr>
    <th>${esc(tx('pdf.common.lord', 'Lord'))}</th>
    <th>${esc(tx('pdf.common.start', 'Start'))}</th>
    <th>${esc(tx('pdf.common.end', 'End'))}</th>
    <th>${esc(tx('pdf.varsha.days', 'Days'))}</th>
  </tr></thead>
  <tbody>${muddaRows}</tbody>
</table>

<div class="footer">
  ${esc(branding.footerText ?? '')}
</div>

</body></html>`;
}
