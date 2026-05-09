// Muhurta book — HTML template for a shortlist of auspicious windows for
// a chosen event type (marriage, travel, new_venture, etc.). Each window
// carries a score, panchang snapshot, reasons, and warnings.

import { MuhuratResult } from '../services/muhurat.service';
import { IBranding } from '../models/branding.model';
import { type Locale, p, pf } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const date = d.toISOString().slice(0, 10);
  const time = d.toISOString().slice(11, 16);
  return `${date} ${time} UTC`;
}

export interface MuhuratReportData {
  result: MuhuratResult;
  eventLabel: string;
  subjectName?: string;
  locationLabel?: string;
  branding: Partial<IBranding>;
  generatedAt: Date;
  locale?: Locale;
}

export function renderMuhuratReport(data: MuhuratReportData): string {
  const { result, eventLabel, subjectName, locationLabel, branding, generatedAt } = data;
  const locale: Locale = data.locale ?? 'en';
  const al = astroLabels(locale);
  const tx = (key: string, fb?: string) => p(key, locale, fb);
  const tf = (key: string, vars: Record<string, string | number>, fb?: string) =>
    pf(key, locale, vars, fb);

  const primary = branding.primaryColor ?? '#7c2d12';
  const accent  = branding.accentColor  ?? '#b45309';

  const top = result.windows.slice(0, 20);

  const cautionLabel = tx('pdf.muhurat.warnings', 'Caution');
  const panchangAt   = tx('pdf.muhurat.panchangAt', 'Panchang at this window');

  const cards = top.length
    ? top.map((w, i) => {
        const scoreTone = w.score >= 8 ? 'strong' : w.score >= 6 ? 'moderate' : 'weak';
        const reasons = w.reasons.map((r) => `<li>${esc(r)}</li>`).join('');
        const warnings = w.warnings.length
          ? `<div class="warn"><strong>${esc(cautionLabel)}:</strong><ul>${w.warnings.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>`
          : '';
        // Localize the panchang snapshot tokens. Panchang strings come in as
        // canonical English token names from the panchang service.
        const tithiLoc = al.tithi(w.panchangSnapshot.tithi);
        const nakLoc   = al.nakshatraByName(w.panchangSnapshot.nakshatra);
        const varaLoc  = al.vara(w.panchangSnapshot.vara);
        const yogaLoc  = al.pyoga(w.panchangSnapshot.yoga);
        return `
          <div class="card">
            <div class="card-title">
              <span class="rank">#${i + 1}</span>
              ${fmtDt(w.start)} → ${fmtDt(w.end)}
              <span class="pill pill-${scoreTone}">${esc(tx('pdf.muhurat.score', 'Score'))} ${w.score.toFixed(1)}</span>
            </div>
            <div class="card-meta">
              ${esc(panchangAt)}: ${esc(tithiLoc)} ·
              ${esc(nakLoc)} ·
              ${esc(varaLoc)} ·
              ${esc(yogaLoc)}
            </div>
            ${reasons ? `<ul class="good">${reasons}</ul>` : ''}
            ${warnings}
          </div>
        `;
      }).join('')
    : `<p class="muted">${esc(tx('pdf.muhurat.noWindows', 'No auspicious windows found within the requested range. Try widening the date range or choosing a different event.'))}</p>`;

  return `<!doctype html>
<html lang="${esc(locale)}">
<head>
<meta charset="utf-8" />
<title>${esc(tx('pdf.muhurat.title', 'Muhurta Book'))} — ${esc(eventLabel)}</title>
<style>
  @page { size: A4; margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Gujarati', 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif; color: #0f172a; font-size: 11px; line-height: 1.45; margin: 0; }
  h1, h2, h3 { font-family: Georgia, 'Tiro Devanagari Sanskrit', 'Tiro Devanagari Hindi', 'Tiro Gujarati', 'Times New Roman', serif; color: ${primary}; margin: 0 0 6px; }
  h1 { font-size: 22px; }
  h2 { font-size: 16px; border-bottom: 2px solid ${accent}; padding-bottom: 4px; margin-top: 18px; }
  .muted { color: #64748b; }
  .header { display: flex; align-items: center; gap: 14px; padding-bottom: 12px; border-bottom: 3px double ${primary}; }
  .header img { max-height: 56px; max-width: 80px; }
  .header .brand { flex: 1; }
  .header .brand .name { font-family: Georgia, 'Tiro Devanagari Sanskrit', 'Tiro Devanagari Hindi', 'Tiro Gujarati', serif; color: ${primary}; font-size: 18px; font-weight: 700; }
  .header .brand .tag { font-size: 10px; color: #64748b; font-style: italic; }
  .header .meta { text-align: right; font-size: 10px; color: #64748b; }
  .card { border: 1px solid #e2e8f0; border-left: 3px solid ${accent}; padding: 8px 12px; background: #fffbeb; border-radius: 4px; margin-top: 8px; }
  .card-title { font-weight: 700; color: ${primary}; margin-bottom: 3px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .card-title .rank { background: ${primary}; color: #fff; padding: 1px 6px; border-radius: 10px; font-size: 10px; }
  .card-meta { font-size: 10px; color: #64748b; margin-bottom: 4px; }
  ul { margin: 4px 0 4px 16px; padding: 0; }
  ul.good li { color: #166534; }
  .warn { background: #fef2f2; border-left: 2px solid #dc2626; padding: 4px 8px; margin-top: 4px; font-size: 10px; color: #991b1b; }
  .pill { display: inline-block; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .pill-strong { background: #166534; color: #fff; }
  .pill-moderate { background: #ca8a04; color: #fff; }
  .pill-weak { background: #94a3b8; color: #fff; }
  .info-row { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #e2e8f0; }
  .info-row span:first-child { color: #64748b; }
  .footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #64748b; text-align: center; }
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
    ${esc(tx('pdf.common.generated', 'Generated'))}: ${generatedAt.toISOString().slice(0, 16).replace('T', ' ')} ${esc(tx('pdf.common.utc', 'UTC'))}
  </div>
</div>

<h1>${esc(tx('pdf.muhurat.title', 'Muhurta Book'))} — ${esc(eventLabel)}</h1>
${subjectName ? `<p class="muted">${esc(tx('pdf.common.subject', 'Subject'))}: <strong>${esc(subjectName)}</strong></p>` : ''}

<div class="info-row"><span>${esc(tx('pdf.muhurat.event', 'Event'))}</span><span>${esc(result.event)}</span></div>
${locationLabel ? `<div class="info-row"><span>${esc(tx('pdf.muhurat.location', 'Location'))}</span><span>${esc(locationLabel)}</span></div>` : ''}
<div class="info-row"><span>${esc(tx('pdf.muhurat.evaluatedDays', 'Candidates evaluated'))}</span><span>${result.totalCandidatesEvaluated}</span></div>
<div class="info-row"><span>${esc(tx('pdf.muhurat.windowsFound', 'Auspicious windows found'))}</span><span>${result.windows.length}</span></div>

<h2>${esc(tf('pdf.muhurat.windows', { n: top.length }, `Top ${top.length} Windows`))}</h2>
${cards}

<div class="footer">
  ${esc(branding.footerText ?? '')}
</div>

</body></html>`;
}
