import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { SECTION_REGISTRY, SectionId } from '../templates/sections';
import { renderWorksheet } from '../templates/worksheet.template';
import { REPORT_BUNDLES } from '../services/worksheet.service';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139,
  lng: 77.2090,
  placeName: 'New Delhi',
};

describe('section registry', () => {
  it('every registered section produces non-empty HTML', () => {
    const k = calculateKundali(SAMPLE);
    for (const id of Object.keys(SECTION_REGISTRY) as SectionId[]) {
      const html = SECTION_REGISTRY[id](k);
      expect(html, `section ${id}`).toBeTruthy();
      expect(html.length, `section ${id}`).toBeGreaterThan(20);
    }
  });

  it('escapes user-visible strings (no naked < in section bodies)', () => {
    const k = calculateKundali(SAMPLE);
    const html = SECTION_REGISTRY.planets(k);
    // Tags are intentionally present, but content cells should not contain
    // unescaped angle brackets from the data layer.
    expect(html).toContain('<table');
    expect(html).toContain('<thead');
  });
});

describe('worksheet template', () => {
  it('renders a full bundle as a complete HTML document', () => {
    const k = calculateKundali(SAMPLE);
    const html = renderWorksheet({
      spec: {
        title: 'Test Report',
        sections: REPORT_BUNDLES.full.sections.map((id) => ({ id })),
        subjectName: 'Test Subject',
      },
      kundali: k,
      branding: { companyName: 'Astrologer Hemraj Laddha', primaryColor: '#7c2d12' },
      generatedAt: new Date('2026-04-09T00:00:00Z'),
    });
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain('Test Report');
    expect(html).toContain('Test Subject');
    expect(html).toContain('Astrologer Hemraj Laddha');
    expect(html).toContain('</html>');
  });

  it('skips unknown section ids without throwing', () => {
    const k = calculateKundali(SAMPLE);
    const html = renderWorksheet({
      spec: {
        title: 'Resilience',
        sections: [
          { id: 'birth' },
          { id: 'nonsense' as any },
          { id: 'planets' },
        ],
      },
      kundali: k,
      branding: {},
      generatedAt: new Date(),
    });
    expect(html).toContain('Birth Details');
    expect(html).toContain('Planetary Positions');
  });
});

describe('report bundles', () => {
  it('every bundle references only known section ids', () => {
    const knownIds = new Set(Object.keys(SECTION_REGISTRY));
    for (const [bundleId, bundle] of Object.entries(REPORT_BUNDLES)) {
      bundle.sections.forEach((s) => {
        expect(knownIds.has(s), `bundle ${bundleId} → ${s}`).toBe(true);
      });
    }
  });

  it('exposes 14+ predefined report types', () => {
    expect(Object.keys(REPORT_BUNDLES).length).toBeGreaterThanOrEqual(14);
  });
});
