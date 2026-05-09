// Drag-drop custom report builder.
//
// Caller supplies:
//   • BirthInput
//   • an ordered list of sectionIds (picked/ordered in the client UI)
//   • optional branding / subject name / title
//
// We run only the pipelines needed by the selected sections, render each
// section as HTML, concatenate in the requested order, wrap in the shared
// report chrome, and hand back a PDF buffer.
//
// Keeps the cost low: a user who asks for just "planets + dashas" skips
// shadbala, doshas, yogas, etc.

import puppeteer from 'puppeteer';
import { BirthInput, calculateKundali, KundaliResult } from './kundali.service';
import { detectYogas } from './yoga.service';
import { checkAllDoshas } from './dosha.service';
import { calculateShadbala } from './strength.service';
import { computeVimshottari } from './dasha.service';
import { calculatePanchang } from './panchang.service';
import { calculateVarshaphala, calculateMuddaDasha } from './varshaphala.service';
import { getBranding } from '../models/branding.model';

export type SectionId =
  | 'header'
  | 'birth_details'
  | 'rashi_chart'
  | 'planets'
  | 'houses'
  | 'yogas'
  | 'doshas'
  | 'shadbala'
  | 'vimshottari'
  | 'panchang'
  | 'varsha_summary'
  | 'mudda_dasha';

export interface CustomReportInput {
  birth: BirthInput;
  sections: SectionId[];
  subjectName?: string;
  title?: string;
  /** Only used when the section list includes varsha_summary or mudda_dasha */
  age?: number;
}

export const SECTION_CATALOG: { id: SectionId; label: string; note: string }[] = [
  { id: 'header',         label: 'Title & Subject',          note: 'Cover heading + subject line' },
  { id: 'birth_details',  label: 'Birth Details',            note: 'Date, time, place, lagna' },
  { id: 'rashi_chart',    label: 'Rashi Chart (D-1)',        note: 'North-Indian diamond with planets' },
  { id: 'planets',        label: 'Planetary Positions',      note: 'Full table with flags' },
  { id: 'houses',         label: 'Houses',                   note: 'Cusps, rashis, lords' },
  { id: 'yogas',          label: 'Yogas',                    note: 'Raja, Dhana, Panch Mahapurusha, etc.' },
  { id: 'doshas',         label: 'Doshas',                   note: 'Mangal, Kaal Sarpa, Sade Sati' },
  { id: 'shadbala',       label: 'Shadbala',                 note: 'Six-fold planetary strength table' },
  { id: 'vimshottari',    label: 'Vimshottari Mahadasha',    note: 'Full 120-year sequence' },
  { id: 'panchang',       label: 'Panchang of Birth Day',    note: 'Tithi, Nakshatra, Yoga, Karana' },
  { id: 'varsha_summary', label: 'Varshaphala — This Year',  note: 'Solar return, Muntha, Varshesha' },
  { id: 'mudda_dasha',    label: 'Mudda Dasha (annual)',     note: 'Annual Vimshottari periods' },
];

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
  const S = sizePx, H = S / 2;
  const planetsByHouse: Record<number, string[]> = {};
  for (let i = 1; i <= 12; i++) planetsByHouse[i] = [];
  for (const p of k.planets) planetsByHouse[p.house].push(p.id);
  const A = [0, 0], B = [S, 0], C = [S, S], D = [0, S];
  const m1 = [H, 0], m2 = [S, H], m3 = [H, S], m4 = [0, H];
  const O = [H, H];
  const pts = (...arr: number[][]) => arr.map((p) => p.join(',')).join(' ');
  const regions = [
    { house: 1,  poly: pts(m1, O, m4, A), lx: H * 0.5,  ly: H * 0.45 },
    { house: 2,  poly: pts(A, m1, m4),    lx: H * 0.45, ly: H * 0.18 },
    { house: 3,  poly: pts(A, B, m1),     lx: H,        ly: H * 0.20 },
    { house: 4,  poly: pts(m1, B, m2, O), lx: H * 1.5,  ly: H * 0.45 },
    { house: 5,  poly: pts(B, m2),        lx: H * 1.78, ly: H * 0.45 },
    { house: 6,  poly: pts(B, C, m2),     lx: H * 1.80, ly: H },
    { house: 7,  poly: pts(m2, C, m3, O), lx: H * 1.5,  ly: H * 1.55 },
    { house: 8,  poly: pts(C, m3),        lx: H * 1.78, ly: H * 1.55 },
    { house: 9,  poly: pts(C, D, m3),     lx: H,        ly: H * 1.80 },
    { house: 10, poly: pts(m3, D, m4, O), lx: H * 0.5,  ly: H * 1.55 },
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
      <text x="${r.lx}" y="${r.ly + 6}" text-anchor="middle" font-size="11" font-weight="600" fill="#0f172a">${esc(planets)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${S}" height="${S}" fill="#fff7ed" stroke="#7c2d12" stroke-width="2"/>
    <line x1="0" y1="0" x2="${S}" y2="${S}" stroke="#7c2d12" stroke-width="1.5"/>
    <line x1="${S}" y1="0" x2="0" y2="${S}" stroke="#7c2d12" stroke-width="1.5"/>
    <polygon points="${H},0 ${S},${H} ${H},${S} 0,${H}" fill="none" stroke="#7c2d12" stroke-width="1.5"/>
    ${polys}</svg>`;
}

function sectionHtml(id: SectionId, ctx: any): string {
  const { k, yogas, doshas, shadbala, vimshottari, panchang, varsha, mudda,
          subjectName, title } = ctx;
  switch (id) {
    case 'header':
      return `<h1>${esc(title ?? 'Custom Astrology Report')}</h1>
        ${subjectName ? `<p class="muted">For: <strong>${esc(subjectName)}</strong></p>` : ''}`;

    case 'birth_details':
      return `<h2>Birth Details</h2>
        <div class="info-row"><span>Date / Time (UTC)</span><span>${k.utc}</span></div>
        <div class="info-row"><span>Place</span><span>${esc(k.input.placeName ?? '—')} (${k.input.lat.toFixed(4)}°, ${k.input.lng.toFixed(4)}°)</span></div>
        <div class="info-row"><span>Ayanamsa</span><span>${esc(k.ayanamsa.name)} ${fmtDeg(k.ayanamsa.valueDeg)}</span></div>
        <div class="info-row"><span>Ascendant</span><span>${esc(k.ascendant.rashi.name)} — ${fmtDeg(k.ascendant.longitude)} · ${esc(k.ascendant.nakshatra.name)} pada ${k.ascendant.nakshatra.pada}</span></div>`;

    case 'rashi_chart':
      return `<h2>Rashi Chart (D-1)</h2><div>${northChartSvg(k)}</div>`;

    case 'planets': {
      const rows = k.planets.map((p: any) => {
        const flags = [
          p.retrograde && 'R', p.exalted && 'EX', p.debilitated && 'DB',
          p.combust && 'C', p.ownSign && 'OWN',
        ].filter(Boolean).join(' ');
        return `<tr>
          <td>${esc(p.name)}</td>
          <td>${fmtDeg(p.longitude)}</td>
          <td>${esc(p.rashi.name)}</td>
          <td>${esc(p.nakshatra.name)} p${p.nakshatra.pada}</td>
          <td class="num">${p.house}</td>
          <td class="flags">${esc(flags)}</td>
        </tr>`;
      }).join('');
      return `<h2>Planetary Positions</h2><table>
        <thead><tr><th>Graha</th><th>Longitude</th><th>Rashi</th><th>Nakshatra</th><th>House</th><th>Flags</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
    }

    case 'houses': {
      const rows = k.houses.map((h: any) => `
        <tr><td class="num">${h.num}</td><td>${esc(h.rashiName)}</td><td>${esc(h.lord)}</td></tr>
      `).join('');
      return `<h2>Houses</h2><table>
        <thead><tr><th>House</th><th>Rashi</th><th>Lord</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
    }

    case 'yogas': {
      if (!yogas?.length) return `<h2>Yogas</h2><p class="muted">No major classical yogas detected.</p>`;
      const items = yogas.map((y: any) => `
        <div class="card">
          <div class="card-title">${esc(y.name)} <span class="pill pill-${y.strength}">${y.strength}</span></div>
          <div class="card-meta">${esc(y.type)} · ${esc(y.involves.join(', '))}</div>
          <p>${esc(y.description)}</p>
        </div>`).join('');
      return `<h2>Yogas</h2>${items}`;
    }

    case 'doshas':
      return `<h2>Doshas</h2><div class="grid-3">
        <div class="card">
          <div class="card-title">Mangal Dosha</div>
          <p>${doshas.mangal.hasDosha ? '<strong>Present</strong>' : 'Not present'}</p>
        </div>
        <div class="card">
          <div class="card-title">Kaal Sarpa</div>
          <p>${doshas.kaalSarpa.hasDosha ? `<strong>${esc(doshas.kaalSarpa.type ?? 'Present')}</strong>` : 'Not present'}</p>
        </div>
        <div class="card">
          <div class="card-title">Sade Sati</div>
          <p>${doshas.sadeSati.active ? `<strong>${esc(doshas.sadeSati.phaseDescription)}</strong>` : 'Not active'}</p>
        </div>
      </div>`;

    case 'shadbala': {
      const rows = shadbala.planets.map((p: any) => `
        <tr>
          <td>${esc(p.planet)}</td>
          <td class="num">${p.components.sthana}</td>
          <td class="num">${p.components.dig}</td>
          <td class="num">${p.components.kala}</td>
          <td class="num">${p.components.cheshta}</td>
          <td class="num">${p.components.naisargika.toFixed(2)}</td>
          <td class="num">${p.components.drik}</td>
          <td class="num"><strong>${p.totalRupas}</strong></td>
          <td>${esc(p.category)}</td>
        </tr>`).join('');
      return `<h2>Shadbala (Planetary Strength)</h2><table>
        <thead><tr><th>Graha</th><th>Sthana</th><th>Dig</th><th>Kala</th><th>Cheshta</th><th>Naisargika</th><th>Drik</th><th>Rupas</th><th>Category</th></tr></thead>
        <tbody>${rows}</tbody></table>
        <p class="muted">Strongest: <strong>${esc(shadbala.strongest)}</strong> · Weakest: <strong>${esc(shadbala.weakest)}</strong></p>`;
    }

    case 'vimshottari': {
      const rows = vimshottari.mahadashas.map((m: any) => `
        <tr><td>${esc(m.lordName)}</td><td>${m.start.slice(0, 10)}</td><td>${m.end.slice(0, 10)}</td><td class="num">${m.years.toFixed(2)}</td></tr>
      `).join('');
      return `<h2>Vimshottari Mahadasha Sequence</h2><table>
        <thead><tr><th>Lord</th><th>Start</th><th>End</th><th>Years</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
    }

    case 'panchang':
      return `<h2>Panchang of Birth Day</h2>
        <div class="info-row"><span>Vara</span><span>${esc(panchang.vara.name)} (lord ${esc(panchang.vara.lord)})</span></div>
        <div class="info-row"><span>Tithi</span><span>${esc(panchang.tithi.paksha)} ${esc(panchang.tithi.name)}</span></div>
        <div class="info-row"><span>Nakshatra</span><span>${esc(panchang.nakshatra.name)} · lord ${esc(panchang.nakshatra.lord)} · pada ${panchang.nakshatra.pada}</span></div>
        <div class="info-row"><span>Yoga</span><span>${esc(panchang.yoga.name)}</span></div>
        <div class="info-row"><span>Karana</span><span>${esc(panchang.karana.name)}</span></div>
        <div class="info-row"><span>Ayana · Ritu · Masa</span><span>${esc(panchang.ayana)} · ${esc(panchang.ritu)} · ${esc(panchang.masa.amanta)}</span></div>`;

    case 'varsha_summary':
      if (!varsha) return '';
      return `<h2>Varshaphala — Age ${varsha.age}</h2>
        <div class="info-row"><span>Solar Return (UTC)</span><span>${varsha.varshaMomentUTC.slice(0, 16).replace('T', ' ')}</span></div>
        <div class="info-row"><span>Muntha sign</span><span>${esc(varsha.muntha.signName)} (lord ${esc(varsha.muntha.lord)})</span></div>
        <div class="info-row"><span>Varshesha</span><span>${esc(varsha.varshesha)}</span></div>
        <div class="info-row"><span>Yogi</span><span>${fmtDeg(varsha.yogi.point)} · nak lord ${esc(varsha.yogi.nakLord)}</span></div>
        <div class="info-row"><span>Avayogi</span><span>${esc(varsha.avayogi.nakLord)}</span></div>`;

    case 'mudda_dasha': {
      if (!mudda?.length) return '';
      const rows = mudda.map((m: any) => `
        <tr><td>${esc(m.lord)}</td><td>${m.startDate.slice(0, 10)}</td><td>${m.endDate.slice(0, 10)}</td><td class="num">${m.days.toFixed(1)}</td></tr>
      `).join('');
      return `<h2>Mudda Dasha</h2><table>
        <thead><tr><th>Lord</th><th>Start</th><th>End</th><th>Days</th></tr></thead>
        <tbody>${rows}</tbody></table>`;
    }
  }
  return '';
}

function reportShell(body: string, branding: any, generatedAt: Date): string {
  const esc2 = esc;
  const primary = branding.primaryColor ?? '#7c2d12';
  const accent  = branding.accentColor  ?? '#b45309';
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/>
<title>Custom Report</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #0f172a; font-size: 11px; line-height: 1.45; margin: 0; }
  h1, h2, h3 { font-family: Georgia, 'Times New Roman', serif; color: ${primary}; margin: 0 0 6px; }
  h1 { font-size: 22px; }
  h2 { font-size: 16px; border-bottom: 2px solid ${accent}; padding-bottom: 4px; margin-top: 18px; }
  .muted { color: #64748b; }
  .header { display: flex; align-items: center; gap: 14px; padding-bottom: 12px; border-bottom: 3px double ${primary}; }
  .header img { max-height: 56px; max-width: 80px; }
  .header .brand { flex: 1; }
  .header .brand .name { font-family: Georgia, serif; color: ${primary}; font-size: 18px; font-weight: 700; }
  .header .brand .tag { font-size: 10px; color: #64748b; font-style: italic; }
  .header .meta { text-align: right; font-size: 10px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; margin-top: 6px; }
  th, td { border: 1px solid #e2e8f0; padding: 4px 6px; text-align: left; }
  th { background: #fff7ed; color: ${primary}; font-weight: 700; font-size: 10px; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.flags { font-family: monospace; font-size: 9px; color: ${accent}; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 6px; }
  .card { border: 1px solid #e2e8f0; border-left: 3px solid ${accent}; padding: 8px 10px; background: #fffbeb; border-radius: 4px; }
  .card-title { font-weight: 700; color: ${primary}; margin-bottom: 2px; }
  .card-meta { font-size: 9px; color: #64748b; margin-bottom: 4px; }
  .pill { display: inline-block; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .pill-strong { background: #166534; color: #fff; }
  .pill-moderate { background: #ca8a04; color: #fff; }
  .pill-weak { background: #94a3b8; color: #fff; }
  .info-row { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #e2e8f0; }
  .info-row span:first-child { color: #64748b; }
  .footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #64748b; text-align: center; }
</style>
</head><body>
<div class="header">
  ${branding.logoDataUrl ? `<img src="${esc2(branding.logoDataUrl)}" alt="logo"/>` : ''}
  <div class="brand">
    <div class="name">${esc2(branding.companyName)}</div>
    <div class="tag">${esc2(branding.tagline ?? '')}</div>
  </div>
  <div class="meta">Generated: ${generatedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC</div>
</div>
${body}
<div class="footer">${esc2(branding.footerText ?? '')}</div>
</body></html>`;
}

export async function generateCustomReportPdf(input: CustomReportInput): Promise<Buffer> {
  const k = calculateKundali(input.birth);
  const wants = new Set(input.sections);

  const yogas       = wants.has('yogas')       ? detectYogas(k)      : null;
  const doshas      = wants.has('doshas')      ? checkAllDoshas(k)   : null;
  const shadbala    = wants.has('shadbala')    ? calculateShadbala(k): null;
  const vimshottari = wants.has('vimshottari') ? computeVimshottari(k) : null;
  const panchang    = wants.has('panchang')
    ? calculatePanchang(new Date(k.utc), input.birth.lat, input.birth.lng)
    : null;
  const needsVarsha = wants.has('varsha_summary') || wants.has('mudda_dasha');
  const varsha = needsVarsha ? calculateVarshaphala(input.birth, input.age ?? 0) : null;
  const mudda  = wants.has('mudda_dasha') && varsha ? calculateMuddaDasha(varsha) : null;

  const ctx = { k, yogas, doshas, shadbala, vimshottari, panchang, varsha, mudda,
                subjectName: input.subjectName, title: input.title };

  const body = input.sections.map((id) => sectionHtml(id, ctx)).join('\n');
  const branding = await getBranding();
  const html = reportShell(body, branding, new Date());

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4', printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close().catch(() => {});
  }
}
