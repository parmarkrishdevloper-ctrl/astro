/**
 * Phase 5 verification — runs the full PDF pipeline and writes a sample
 * Kundali report to disk. Confirms Puppeteer can launch, the template
 * compiles, and the produced file is a valid PDF (starts with %PDF-).
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { initEphemeris } from '../config/ephemeris';
import { generateKundaliPdf, shutdownPdfEngine } from '../services/pdf.service';
import { setBranding } from '../models/branding.model';

async function main() {
  initEphemeris();

  // Set sample branding (uses in-memory fallback if Mongo not connected)
  await setBranding({
    companyName: 'Astrologer Hemraj Laddha',
    tagline: 'Authentic Vedic Astrology',
    primaryColor: '#7c2d12',
    accentColor: '#b45309',
    contact: {
      phone: '+91-99999-00000',
      email: 'hello@tankar.in',
      website: 'tankar.in',
    },
    footerText: 'For guidance only — astrological inferences are not professional advice.',
  });

  console.log('[verify-phase5] generating PDF…');
  const pdf = await generateKundaliPdf(
    {
      datetime: '1990-08-15T10:30:00+05:30',
      lat: 28.6139,
      lng: 77.2090,
      placeName: 'New Delhi, India',
    },
    'Sample Subject',
  );

  const outDir = join(__dirname, '..', '..', 'tmp');
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'sample-kundali.pdf');
  writeFileSync(outPath, pdf);

  // Validate magic bytes
  const head = pdf.slice(0, 5).toString('utf8');
  const ok = head === '%PDF-';

  console.log(`[verify-phase5] wrote ${pdf.length} bytes → ${outPath}`);
  console.log(`[verify-phase5] PDF magic header: ${head}  ${ok ? '✓' : '✗'}`);

  await shutdownPdfEngine();

  if (!ok) {
    console.error('FAIL: not a valid PDF');
    process.exit(1);
  }
  console.log('PHASE 5 VERIFY PASSED ✓');
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
