// HTML → PDF via Puppeteer. We keep ONE shared headless browser instance
// across requests for performance — launching Chromium per request is slow.

import puppeteer, { Browser } from 'puppeteer';
import { calculateKundali, BirthInput, KundaliResult } from './kundali.service';
import { detectYogas } from './yoga.service';
import { checkAllDoshas } from './dosha.service';
import { calculateShadbala } from './strength.service';
import { computeVimshottari } from './dasha.service';
import { getBranding } from '../models/branding.model';
import { renderKundaliReport } from '../templates/kundali-report.template';
import { matchKundalis } from './matching.service';
import { renderMatchingReport } from '../templates/matching-report.template';
import { calculateVarshaphala, calculateMuddaDasha } from './varshaphala.service';
import { renderVarshphalReport } from '../templates/varshaphala-report.template';
import { findMuhurat, MuhuratEvent } from './muhurat.service';
import { renderMuhuratReport } from '../templates/muhurat-report.template';
import type { Locale } from '../i18n';

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

export async function shutdownPdfEngine(): Promise<void> {
  if (_browser) {
    await _browser.close().catch(() => {});
    _browser = null;
  }
}

/**
 * Generate the full Vedic Kundali report as a PDF buffer. Caller supplies a
 * BirthInput; the service runs the entire astrology pipeline (kundali → yogas
 * → doshas → shadbala → vimshottari), pulls branding, then renders & prints.
 */
export async function generateKundaliPdf(
  birth: BirthInput,
  subjectName?: string,
  locale: Locale = 'en',
): Promise<Buffer> {
  const k: KundaliResult = calculateKundali(birth);
  const yogas = detectYogas(k, locale);
  const doshas = checkAllDoshas(k, undefined, locale);
  const shadbala = calculateShadbala(k);
  const vimshottari = computeVimshottari(k);
  const branding = await getBranding();

  const html = renderKundaliReport({
    kundali: k,
    yogas,
    doshas,
    shadbala,
    vimshottari,
    branding,
    generatedAt: new Date(),
    subjectName,
    locale,
  });

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Generate the full Ashtakoot Matching report as a PDF buffer. Runs the
 * matching pipeline (Ashtakoot koots + Manglik + Nadi/Bhakoot cancellations +
 * Rajju/Vedha/Mahendra/Stri Dheerga + recommendations), pulls branding, then
 * renders & prints.
 */
export async function generateMatchingPdf(
  boy: BirthInput,
  girl: BirthInput,
  boyName?: string,
  girlName?: string,
  locale: Locale = 'en',
): Promise<Buffer> {
  const matching = matchKundalis(boy, girl, locale);
  const branding = await getBranding();

  const html = renderMatchingReport({
    matching,
    branding,
    boyName,
    girlName,
    generatedAt: new Date(),
    locale,
  });

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Generate a Varshphal book (annual Tajika horoscope for a given age). Runs
 * the natal kundali + solar-return + Muntha/Varshesha/Sahams + Mudda pipeline
 * and prints a multi-section A4 PDF.
 */
export async function generateVarshphalPdf(
  birth: BirthInput,
  age: number,
  subjectName?: string,
  locale: Locale = 'en',
): Promise<Buffer> {
  const natal = calculateKundali(birth);
  const varsha = calculateVarshaphala(birth, age);
  const mudda = calculateMuddaDasha(varsha);
  const branding = await getBranding();

  const html = renderVarshphalReport({
    natal, varsha, mudda, branding, generatedAt: new Date(), subjectName, locale,
  });

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}

/**
 * Generate a Muhurta book — ranked list of auspicious windows within a date
 * range for a given event. Returns an A4 PDF buffer.
 */
export async function generateMuhuratPdf(input: {
  event: MuhuratEvent;
  startDate: Date;
  endDate: Date;
  lat: number;
  lng: number;
  subjectName?: string;
  locationLabel?: string;
  eventLabel?: string;
  locale?: Locale;
}): Promise<Buffer> {
  const result = findMuhurat({
    event: input.event,
    startDate: input.startDate,
    endDate: input.endDate,
    lat: input.lat,
    lng: input.lng,
  });
  const branding = await getBranding();

  const html = renderMuhuratReport({
    result,
    eventLabel: input.eventLabel ?? input.event,
    subjectName: input.subjectName,
    locationLabel: input.locationLabel,
    branding,
    generatedAt: new Date(),
    locale: input.locale ?? 'en',
  });

  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' },
    });
    return Buffer.from(pdf);
  } finally {
    await page.close().catch(() => {});
  }
}
