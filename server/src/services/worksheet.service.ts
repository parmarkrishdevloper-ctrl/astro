// Worksheet PDF service.
//
// Generates PDFs from a WorksheetSpec (a list of section ids). Predefined
// "report types" map a friendly name to a fixed section ordering — this is
// how we deliver 25+ report variants without 25 templates.

import puppeteer, { Browser } from 'puppeteer';
import { calculateKundali, BirthInput, KundaliResult } from './kundali.service';
import { getBranding } from '../models/branding.model';
import { renderWorksheet, WorksheetSpec } from '../templates/worksheet.template';
import { SectionId } from '../templates/sections';
import { Locale } from '../i18n';

let _browser: Browser | null = null;
let _launching: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.connected) return _browser;
  if (_launching) return _launching;
  _launching = puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  }).then((b) => { _browser = b; _launching = null; return b; });
  return _launching;
}

export async function shutdownWorksheetEngine(): Promise<void> {
  if (_browser) {
    await _browser.close().catch(() => {});
    _browser = null;
  }
}

// ─── Predefined report bundles ──────────────────────────────────────────────
// Each entry maps a friendly id → ordered section list. New report variants
// are added simply by extending this map.
export const REPORT_BUNDLES: Record<string, { title: string; sections: SectionId[] }> = {
  brief:          { title: 'Brief Kundali', sections: ['birth', 'planets', 'vimshottari'] },
  full:           { title: 'Full Vedic Report', sections: [
                    'birth', 'planets', 'shadbala', 'yogas', 'vimshottari',
                    'ashtakavarga', 'jaimini', 'avasthas', 'sudarshana',
                    'interpretation', 'remedies'] },
  predictive:     { title: 'Predictive Report', sections: [
                    'birth', 'planets', 'vimshottari', 'transits', 'yogas', 'interpretation'] },
  varshaphala:    { title: 'Varshaphala (Annual)', sections: [
                    'birth', 'planets', 'varshaphala'] },
  jaimini:        { title: 'Jaimini Report', sections: ['birth', 'planets', 'jaimini'] },
  kp:             { title: 'KP Report', sections: ['birth', 'planets', 'kp'] },
  ashtakavarga:   { title: 'Ashtakavarga Report', sections: ['birth', 'planets', 'ashtakavarga'] },
  shadbala:       { title: 'Shadbala Report', sections: ['birth', 'planets', 'shadbala'] },
  yoga:           { title: 'Yoga Detection Report', sections: ['birth', 'planets', 'yogas'] },
  remedies:       { title: 'Remedies Report', sections: ['birth', 'planets', 'remedies'] },
  transits:       { title: 'Current Transits', sections: ['birth', 'transits'] },
  interpretation: { title: 'Interpretation Report', sections: ['birth', 'planets', 'interpretation'] },
  sudarshana:     { title: 'Sudarshana Chakra', sections: ['birth', 'planets', 'sudarshana'] },
  avasthas:       { title: 'Avasthas Report', sections: ['birth', 'planets', 'avasthas'] },
  // Phase 20C — long-form family-heirloom edition. Everything in one book.
  book:           { title: 'Kundali Book — Complete Edition', sections: [
                    'birth', 'planets', 'chalit', 'upagrahas', 'sensitivePoints',
                    'vimshottari', 'shadbala', 'yogas', 'ashtakavarga',
                    'jaimini', 'kp', 'avasthas', 'sudarshana', 'varshaphala',
                    'transits', 'interpretation', 'remedies'] },
};

export type ReportBundleId = keyof typeof REPORT_BUNDLES;

export async function renderWorksheetPdf(
  birth: BirthInput,
  spec: WorksheetSpec,
  precomputedKundali?: KundaliResult,
): Promise<Buffer> {
  const k = precomputedKundali ?? calculateKundali(birth);
  const branding = await getBranding();
  const html = renderWorksheet({
    spec, kundali: k, branding, generatedAt: new Date(),
  });
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '16mm', bottom: '16mm', left: '13mm', right: '13mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}

export async function renderBundlePdf(
  birth: BirthInput,
  bundleId: string,
  subjectName?: string,
  locale: Locale = 'en',
): Promise<Buffer> {
  const bundle = REPORT_BUNDLES[bundleId];
  if (!bundle) throw new Error(`Unknown report bundle: ${bundleId}`);
  const spec: WorksheetSpec = {
    title: bundle.title,
    sections: bundle.sections.map((id) => ({ id })),
    subjectName,
    locale,
  };
  return renderWorksheetPdf(birth, spec);
}

export interface BatchEntry {
  birth: BirthInput;
  bundleId: string;
  subjectName?: string;
  locale?: Locale;
}

export interface BatchResult {
  subjectName?: string;
  bundleId: string;
  ok: boolean;
  pdf?: Buffer;
  error?: string;
}

/**
 * Batch-generate PDFs sequentially. Returns one entry per request, including
 * any per-item errors so a single failure doesn't abort the whole batch. The
 * shared browser instance keeps this efficient even at large batch sizes.
 */
export async function renderBatch(entries: BatchEntry[]): Promise<BatchResult[]> {
  const out: BatchResult[] = [];
  for (const e of entries) {
    try {
      const pdf = await renderBundlePdf(e.birth, e.bundleId, e.subjectName, e.locale);
      out.push({ subjectName: e.subjectName, bundleId: e.bundleId, ok: true, pdf });
    } catch (err: any) {
      out.push({
        subjectName: e.subjectName,
        bundleId: e.bundleId,
        ok: false,
        error: err?.message ?? String(err),
      });
    }
  }
  return out;
}
