import { describe, it, expect } from 'vitest';
import { initEphemeris } from '../config/ephemeris';
import { calculateKundali } from '../services/kundali.service';
import { tr, tPlanet, tRashi, isLocale, Locale } from '../i18n';
import { renderWorksheet } from '../templates/worksheet.template';
import { sectionBirthDetails, sectionPlanetTable, sectionVimshottari } from '../templates/sections';

initEphemeris();

const SAMPLE = {
  datetime: '1990-08-15T10:30:00+05:30',
  lat: 28.6139,
  lng: 77.2090,
  placeName: 'New Delhi',
};

const ALL: Locale[] = ['en', 'hi', 'gu', 'sa'];

describe('server i18n core', () => {
  it('isLocale narrows correctly', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('hi')).toBe(true);
    expect(isLocale('gu')).toBe(true);
    expect(isLocale('sa')).toBe(true);
    expect(isLocale('xx')).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it('tr returns localised strings and falls back to English', () => {
    expect(tr('en', 'pdf.section.birth')).toBe('Birth Details');
    expect(tr('hi', 'pdf.section.birth')).not.toBe('Birth Details');
    expect(tr('gu', 'pdf.section.birth')).not.toBe('Birth Details');
    expect(tr('sa', 'pdf.section.birth')).not.toBe('Birth Details');
    // Unknown key falls back to the key itself
    expect(tr('en', 'unknown.key', 'fb')).toBe('fb');
  });

  it('tPlanet/tRashi return per-locale labels', () => {
    expect(tPlanet('en', 'SU')).toBe('Sun');
    expect(tPlanet('hi', 'SU')).toBe('सूर्य');
    expect(tPlanet('gu', 'SU')).toBe('સૂર્ય');
    expect(tPlanet('sa', 'SU')).toBe('सूर्यः');
    expect(tRashi('hi', 1)).toBe('मेष');
    expect(tRashi('gu', 1)).toBe('મેષ');
  });
});

describe('localised sections', () => {
  it('birth/planet/dasha sections render in every locale without throwing', () => {
    const k = calculateKundali(SAMPLE);
    for (const lc of ALL) {
      const b = sectionBirthDetails(k, { locale: lc });
      const p = sectionPlanetTable(k, { locale: lc });
      const d = sectionVimshottari(k, { locale: lc });
      expect(b).toContain(tr(lc, 'pdf.section.birth'));
      expect(p).toContain(tr(lc, 'pdf.section.planets'));
      expect(d).toContain(tr(lc, 'pdf.section.dasha'));
    }
  });

  it('different locales produce different planet table HTML', () => {
    const k = calculateKundali(SAMPLE);
    const en = sectionPlanetTable(k, { locale: 'en' });
    const hi = sectionPlanetTable(k, { locale: 'hi' });
    expect(en).not.toBe(hi);
    expect(hi).toContain('सूर्य');
    expect(en).toContain('Sun');
  });
});

describe('localised worksheet', () => {
  it('sets html lang and uses localised header', () => {
    const k = calculateKundali(SAMPLE);
    const html = renderWorksheet({
      spec: {
        title: 'Test',
        sections: [{ id: 'birth' }, { id: 'planets' }, { id: 'vimshottari' }],
        locale: 'gu',
      },
      kundali: k,
      branding: { companyName: 'Astrologer Hemraj Laddha' },
      generatedAt: new Date('2026-04-09T00:00:00Z'),
    });
    expect(html).toContain('<html lang="gu"');
    expect(html).toContain(tr('gu', 'pdf.section.birth'));
    expect(html).toContain(tr('gu', 'pdf.section.planets'));
    expect(html).toContain(tr('gu', 'pdf.generated'));
  });

  it('defaults to English when no locale supplied', () => {
    const k = calculateKundali(SAMPLE);
    const html = renderWorksheet({
      spec: { title: 'T', sections: [{ id: 'birth' }] },
      kundali: k,
      branding: {},
      generatedAt: new Date(),
    });
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('Birth Details');
  });
});
