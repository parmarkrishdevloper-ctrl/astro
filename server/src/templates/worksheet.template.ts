// Worksheet template — a thin shell that wraps a list of section HTML strings
// in a styled, branded A4 document. Replaces the need for 25 separate report
// templates: each "report type" is just a different section ordering.

import { KundaliResult } from '../services/kundali.service';
import { IBranding } from '../models/branding.model';
import { SECTION_REGISTRY, SectionId, SectionOpts } from './sections';
import { type Locale, p, tr } from '../i18n';

export interface WorksheetSpec {
  /** Sections to include, in order. Each may carry per-section options. */
  sections: { id: SectionId; opts?: SectionOpts }[];
  /** Page header title (e.g., "Vedic Kundali Report", "Varshaphala 2026"). */
  title: string;
  subtitle?: string;
  subjectName?: string;
  /** Output language for headings, labels, and graha/rashi names. */
  locale?: Locale;
}

export interface WorksheetData {
  spec: WorksheetSpec;
  kundali: KundaliResult;
  branding: Partial<IBranding>;
  generatedAt: Date;
}

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderWorksheet(data: WorksheetData): string {
  const { spec, kundali, branding, generatedAt } = data;
  const locale: Locale = spec.locale ?? 'en';
  const tx = (key: string, fb?: string) => p(key, locale, fb);
  const primary = branding.primaryColor ?? '#7c2d12';
  const accent = branding.accentColor ?? '#b45309';

  // Render each requested section through the registry. Unknown ids are
  // skipped silently rather than aborting the whole worksheet. The worksheet
  // locale is merged into per-section opts so individual sections see one.
  const body = spec.sections.map((s) => {
    const fn = SECTION_REGISTRY[s.id];
    if (!fn) return '';
    try {
      return fn(kundali, { ...s.opts, locale });
    } catch (e: any) {
      return `<p class="muted">${esc(tx('pdf.worksheet.section', 'Section'))} "${esc(s.id)}" failed: ${esc(e?.message ?? e)}</p>`;
    }
  }).join('\n');

  return `<!doctype html>
<html lang="${esc(locale)}"><head><meta charset="utf-8"/>
<title>${esc(spec.title)}</title>
<style>
  @page { size: A4; margin: 16mm 13mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Noto Sans', 'Noto Sans Devanagari', 'Noto Sans Gujarati', 'Helvetica Neue', Helvetica, Arial, system-ui, sans-serif; color: #0f172a; font-size: 10.5px; line-height: 1.45; margin: 0; }
  h1, h2, h3 { font-family: Georgia, 'Tiro Devanagari Sanskrit', 'Tiro Devanagari Hindi', 'Tiro Gujarati', serif; color: ${primary}; margin: 0 0 6px; }
  h1 { font-size: 22px; }
  h2 { font-size: 15px; border-bottom: 2px solid ${accent}; padding-bottom: 3px; margin-top: 16px; page-break-after: avoid; }
  h3 { font-size: 12px; margin-top: 8px; }
  .muted { color: #64748b; }
  .header { display: flex; align-items: center; gap: 14px; padding-bottom: 10px; border-bottom: 3px double ${primary}; }
  .header img { max-height: 56px; max-width: 80px; }
  .header .brand { flex: 1; }
  .header .brand .name { font-family: Georgia, 'Tiro Devanagari Sanskrit', 'Tiro Devanagari Hindi', 'Tiro Gujarati', serif; color: ${primary}; font-size: 18px; font-weight: 700; }
  .header .brand .tag { font-size: 10px; color: #64748b; font-style: italic; }
  .header .meta { text-align: right; font-size: 10px; color: #64748b; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th, td { border: 1px solid #e2e8f0; padding: 3px 5px; text-align: left; }
  th { background: #fff7ed; color: ${primary}; font-weight: 700; font-size: 9px; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  td.flags { font-family: monospace; font-size: 9px; color: ${accent}; }
  .info-row { display: flex; justify-content: space-between; padding: 2px 0; border-bottom: 1px dotted #e2e8f0; }
  .info-row span:first-child { color: #64748b; }
  .card { border: 1px solid #e2e8f0; border-left: 3px solid ${accent}; padding: 6px 9px; background: #fffbeb; border-radius: 4px; margin-top: 4px; }
  .card-title { font-weight: 700; color: ${primary}; }
  .card-meta { font-size: 9px; color: #64748b; margin: 2px 0; }
  .card p { margin: 2px 0; }
  .pill { display: inline-block; padding: 1px 6px; border-radius: 10px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
  .pill-strong { background: #166534; color: #fff; }
  .pill-moderate { background: #ca8a04; color: #fff; }
  .pill-weak { background: #94a3b8; color: #fff; }
  ul { margin: 4px 0 4px 18px; padding: 0; }
  li { margin: 2px 0; }
  .footer { margin-top: 18px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 9px; color: #64748b; text-align: center; }
</style></head><body>

<div class="header">
  ${branding.logoDataUrl ? `<img src="${esc(branding.logoDataUrl)}" alt="logo"/>` : ''}
  <div class="brand">
    <div class="name">${esc(branding.companyName ?? 'Astrologer Hemraj Laddha')}</div>
    <div class="tag">${esc(branding.tagline ?? '')}</div>
  </div>
  <div class="meta">
    ${esc(tr(locale, 'pdf.generated'))} ${generatedAt.toISOString().slice(0, 16).replace('T', ' ')} ${esc(tx('pdf.common.utc', 'UTC'))}
  </div>
</div>

<h1>${esc(spec.title)}</h1>
${spec.subtitle ? `<p class="muted">${esc(spec.subtitle)}</p>` : ''}
${spec.subjectName ? `<p class="muted">${esc(tr(locale, 'pdf.for'))}: <strong>${esc(spec.subjectName)}</strong></p>` : ''}

${body}

<div class="footer">${esc(branding.footerText ?? '')}</div>
</body></html>`;
}
