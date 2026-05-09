// Data + chart export pipelines.
//
//   • buildChartCsv(k)         — hand-rolled CSV of planetary positions
//   • buildChartXlsx(k)        — multi-sheet XLSX via exceljs (Planets / Houses / Dashas)
//   • buildChartSvg(k, variant) — standalone SVG markup (north or south Indian)
//   • buildChartPng(k, variant, scale) — PNG buffer rasterised via Puppeteer
//
// The SVG renderers are self-contained so they can be served raw or piped
// into the PDF templates / PNG screenshotter. PNG uses the shared Puppeteer
// instance from pdf.service.ts to avoid spinning a browser per request.

import ExcelJS from 'exceljs';
import puppeteer, { Browser } from 'puppeteer';
import { KundaliResult } from './kundali.service';
import { computeVimshottari } from './dasha.service';
import { RASHIS } from '../utils/astro-constants';

// ─── Shared browser (dedicated to PNG screenshots) ────────────────────────────
let _browser: Browser | null = null;
let _launching: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.connected) return _browser;
  if (_launching) return _launching;
  _launching = puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  }).then((b) => {
    _browser = b;
    _launching = null;
    return b;
  });
  return _launching;
}

export async function shutdownExportEngine(): Promise<void> {
  if (_browser) {
    await _browser.close().catch(() => {});
    _browser = null;
  }
}

// ─── CSV ──────────────────────────────────────────────────────────────────────
function csvCell(v: unknown): string {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(',');
}

export function buildChartCsv(k: KundaliResult): string {
  const rows: string[] = [];
  rows.push(csvRow(['Astrologer Hemraj Laddha — Planetary positions export']));
  rows.push(csvRow([`Datetime (UTC)`, k.utc]));
  rows.push(csvRow([`Lat, Lng`, `${k.input.lat}, ${k.input.lng}`]));
  rows.push(csvRow([`Ayanamsa`, `${k.ayanamsa.name} (${k.ayanamsa.valueDeg.toFixed(6)}°)`]));
  rows.push(csvRow([`Ascendant`, `${k.ascendant.rashi.name} ${k.ascendant.longitude.toFixed(4)}°`]));
  rows.push('');
  rows.push(csvRow([
    'Graha', 'Longitude', 'Speed', 'Retro', 'Rashi', 'DegInRashi',
    'Nakshatra', 'NakLord', 'Pada', 'House', 'Exalted', 'Debilitated',
    'Combust', 'OwnSign',
  ]));
  for (const p of k.planets) {
    rows.push(csvRow([
      p.name,
      p.longitude.toFixed(4),
      p.speed.toFixed(4),
      p.retrograde ? 'Y' : 'N',
      p.rashi.name,
      p.rashi.degInRashi.toFixed(4),
      p.nakshatra.name,
      p.nakshatra.lord,
      p.nakshatra.pada,
      p.house,
      p.exalted ? 'Y' : 'N',
      p.debilitated ? 'Y' : 'N',
      p.combust ? 'Y' : 'N',
      p.ownSign ? 'Y' : 'N',
    ]));
  }
  rows.push('');
  rows.push(csvRow(['House', 'Rashi', 'RashiNum', 'Lord', 'CuspLongitude']));
  for (const h of k.houses) {
    rows.push(csvRow([h.num, h.rashiName, h.rashiNum, h.lord, h.cuspLongitude.toFixed(4)]));
  }
  return rows.join('\n');
}

// ─── XLSX ─────────────────────────────────────────────────────────────────────
export async function buildChartXlsx(k: KundaliResult): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Astrologer Hemraj Laddha';
  wb.created = new Date();

  // Sheet 1: Overview
  const ov = wb.addWorksheet('Overview');
  ov.columns = [{ width: 28 }, { width: 48 }];
  const ovRows: [string, string | number][] = [
    ['Datetime (UTC)', k.utc],
    ['Latitude', k.input.lat],
    ['Longitude', k.input.lng],
    ['Place', k.input.placeName ?? ''],
    ['Ayanamsa', `${k.ayanamsa.name} (${k.ayanamsa.valueDeg.toFixed(6)}°)`],
    ['House system', k.houseSystem],
    ['Ascendant longitude', k.ascendant.longitude.toFixed(4)],
    ['Ascendant rashi', k.ascendant.rashi.name],
    ['Ascendant nakshatra', `${k.ascendant.nakshatra.name} pada ${k.ascendant.nakshatra.pada}`],
  ];
  ovRows.forEach((r) => {
    const row = ov.addRow(r);
    row.getCell(1).font = { bold: true };
  });

  // Sheet 2: Planets
  const pl = wb.addWorksheet('Planets');
  pl.columns = [
    { header: 'Graha', key: 'name', width: 10 },
    { header: 'Longitude', key: 'lon', width: 12 },
    { header: 'Speed', key: 'speed', width: 10 },
    { header: 'Retro', key: 'retro', width: 7 },
    { header: 'Rashi', key: 'rashi', width: 14 },
    { header: 'Deg in Rashi', key: 'degIn', width: 12 },
    { header: 'Nakshatra', key: 'nak', width: 16 },
    { header: 'Nak Lord', key: 'nakLord', width: 10 },
    { header: 'Pada', key: 'pada', width: 6 },
    { header: 'House', key: 'house', width: 6 },
    { header: 'Exalted', key: 'ex', width: 8 },
    { header: 'Debilitated', key: 'db', width: 12 },
    { header: 'Combust', key: 'c', width: 9 },
    { header: 'Own Sign', key: 'own', width: 9 },
  ];
  pl.getRow(1).font = { bold: true };
  pl.getRow(1).fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' },
  };
  for (const p of k.planets) {
    pl.addRow({
      name: p.name,
      lon: Number(p.longitude.toFixed(4)),
      speed: Number(p.speed.toFixed(4)),
      retro: p.retrograde ? 'Y' : 'N',
      rashi: p.rashi.name,
      degIn: Number(p.rashi.degInRashi.toFixed(4)),
      nak: p.nakshatra.name,
      nakLord: p.nakshatra.lord,
      pada: p.nakshatra.pada,
      house: p.house,
      ex: p.exalted ? 'Y' : 'N',
      db: p.debilitated ? 'Y' : 'N',
      c: p.combust ? 'Y' : 'N',
      own: p.ownSign ? 'Y' : 'N',
    });
  }

  // Sheet 3: Houses
  const hs = wb.addWorksheet('Houses');
  hs.columns = [
    { header: 'House', key: 'num', width: 7 },
    { header: 'Rashi', key: 'rashi', width: 14 },
    { header: 'Rashi Num', key: 'rashiNum', width: 10 },
    { header: 'Lord', key: 'lord', width: 8 },
    { header: 'Cusp Longitude', key: 'cusp', width: 15 },
  ];
  hs.getRow(1).font = { bold: true };
  hs.getRow(1).fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' },
  };
  for (const h of k.houses) {
    hs.addRow({
      num: h.num,
      rashi: h.rashiName,
      rashiNum: h.rashiNum,
      lord: h.lord,
      cusp: Number(h.cuspLongitude.toFixed(4)),
    });
  }

  // Sheet 4: Vimshottari mahadashas
  const vim = computeVimshottari(k);
  const ds = wb.addWorksheet('Vimshottari');
  ds.columns = [
    { header: 'Lord', key: 'lord', width: 10 },
    { header: 'Start', key: 'start', width: 22 },
    { header: 'End', key: 'end', width: 22 },
    { header: 'Years', key: 'years', width: 9 },
  ];
  ds.getRow(1).font = { bold: true };
  ds.getRow(1).fill = {
    type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' },
  };
  for (const m of vim.mahadashas) {
    ds.addRow({
      lord: m.lordName,
      start: m.start,
      end: m.end,
      years: Number(m.years.toFixed(4)),
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

// ─── SVG — north Indian diamond ───────────────────────────────────────────────
function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function northChartSvg(k: KundaliResult, sizePx = 600): string {
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
  const fontBig = Math.round(S / 28);
  const fontSml = Math.round(S / 40);
  const polys = regions.map((r) => {
    const rashi = ((lagnaRashi + r.house - 2 + 12) % 12) + 1;
    const planets = planetsByHouse[r.house].join(' ');
    return `
    <polygon points="${r.poly}" fill="none" stroke="#7c2d12" stroke-width="${S / 320}"/>
    <text x="${r.lx}" y="${r.ly - fontSml}" text-anchor="middle" font-size="${fontSml}" fill="#94a3b8">${rashi}</text>
    <text x="${r.lx}" y="${r.ly + fontBig * 0.4}" text-anchor="middle" font-size="${fontBig}" font-weight="600" fill="#0f172a">${esc(planets)}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="0" width="${S}" height="${S}" fill="#fff7ed" stroke="#7c2d12" stroke-width="${S / 200}"/>
  <line x1="0" y1="0" x2="${S}" y2="${S}" stroke="#7c2d12" stroke-width="${S / 320}"/>
  <line x1="${S}" y1="0" x2="0" y2="${S}" stroke="#7c2d12" stroke-width="${S / 320}"/>
  <polygon points="${H},0 ${S},${H} ${H},${S} 0,${H}" fill="none" stroke="#7c2d12" stroke-width="${S / 320}"/>
  ${polys}
</svg>`;
}

// ─── SVG — south Indian fixed grid ────────────────────────────────────────────
// In the south format each cell is a fixed rashi. Aries sits top-2nd from left.
// The outer 12 cells form a 4x4 grid with the middle 4 cells blank.
function southChartSvg(k: KundaliResult, sizePx = 600): string {
  const S = sizePx;
  const cell = S / 4;
  // Row-major grid position → rashi number (fixed south-Indian layout)
  // Top row (y=0):    Pisces(12) Aries(1) Taurus(2) Gemini(3)
  // Second (y=1):     Aquarius(11) [mid]   [mid]    Cancer(4)
  // Third  (y=2):     Capricorn(10)[mid]   [mid]    Leo(5)
  // Bottom (y=3):     Sagitt(9)   Scorpio(8) Libra(7) Virgo(6)
  const layout: { r: number; gx: number; gy: number }[] = [
    { r: 12, gx: 0, gy: 0 }, { r: 1,  gx: 1, gy: 0 }, { r: 2,  gx: 2, gy: 0 }, { r: 3,  gx: 3, gy: 0 },
    { r: 11, gx: 0, gy: 1 },                                                    { r: 4,  gx: 3, gy: 1 },
    { r: 10, gx: 0, gy: 2 },                                                    { r: 5,  gx: 3, gy: 2 },
    { r: 9,  gx: 0, gy: 3 }, { r: 8,  gx: 1, gy: 3 }, { r: 7,  gx: 2, gy: 3 }, { r: 6,  gx: 3, gy: 3 },
  ];

  const planetsByRashi: Record<number, string[]> = {};
  for (let i = 1; i <= 12; i++) planetsByRashi[i] = [];
  for (const p of k.planets) planetsByRashi[p.rashi.num].push(p.id);

  const fontBig = Math.round(S / 28);
  const fontSml = Math.round(S / 44);

  const lagnaR = k.ascendant.rashi.num;
  const cells = layout.map((c) => {
    const x = c.gx * cell;
    const y = c.gy * cell;
    const rashi = RASHIS[c.r - 1];
    const planets = planetsByRashi[c.r];
    const lines = planets.map((p, i) =>
      `<text x="${x + cell / 2}" y="${y + cell / 2 + fontBig * (i - (planets.length - 1) / 2)}" text-anchor="middle" font-size="${fontBig}" font-weight="600" fill="#0f172a">${esc(p)}</text>`
    ).join('');
    const isLagna = c.r === lagnaR;
    return `
    <rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${isLagna ? '#fde68a' : '#fff7ed'}" stroke="#7c2d12" stroke-width="${S / 300}"/>
    <text x="${x + 6}" y="${y + fontSml + 4}" font-size="${fontSml}" fill="#94a3b8">${rashi.name}</text>
    ${isLagna ? `<text x="${x + cell - 6}" y="${y + fontSml + 4}" text-anchor="end" font-size="${fontSml}" fill="#b45309" font-weight="700">Lagna</text>` : ''}
    ${lines}`;
  }).join('');

  const midX = cell, midY = cell, midW = cell * 2, midH = cell * 2;

  return `<svg viewBox="0 0 ${S} ${S}" width="${S}" height="${S}" xmlns="http://www.w3.org/2000/svg">
  ${cells}
  <rect x="${midX}" y="${midY}" width="${midW}" height="${midH}" fill="#fffbeb" stroke="#7c2d12" stroke-width="${S / 300}"/>
  <text x="${midX + midW / 2}" y="${midY + midH / 2}" text-anchor="middle" dominant-baseline="middle" font-family="Georgia, serif" font-size="${fontBig * 1.2}" fill="#7c2d12" font-weight="700">Rashi Chart</text>
</svg>`;
}

export type ChartVariant = 'north' | 'south';

export function buildChartSvg(k: KundaliResult, variant: ChartVariant = 'north', sizePx = 600): string {
  return variant === 'south' ? southChartSvg(k, sizePx) : northChartSvg(k, sizePx);
}

// ─── PNG ──────────────────────────────────────────────────────────────────────
export async function buildChartPng(
  k: KundaliResult,
  variant: ChartVariant = 'north',
  scale = 3,
): Promise<Buffer> {
  const baseSize = 600;
  const svg = buildChartSvg(k, variant, baseSize);
  const html = `<!doctype html><html><head><meta charset="utf-8"/>
<style>
  html, body { margin: 0; padding: 0; background: #ffffff; }
  .wrap { display: inline-block; line-height: 0; }
  svg { display: block; }
</style></head><body>
<div class="wrap" id="wrap">${svg}</div>
</body></html>`;

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({
      width: baseSize,
      height: baseSize,
      deviceScaleFactor: Math.max(1, Math.min(8, scale)),
    });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const el = await page.$('#wrap');
    if (!el) throw new Error('SVG wrapper element not found');
    const shot = await el.screenshot({ type: 'png', omitBackground: false });
    return Buffer.from(shot);
  } finally {
    await page.close().catch(() => {});
  }
}
