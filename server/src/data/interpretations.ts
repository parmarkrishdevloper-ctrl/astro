// Interpretation text database.
//
// We provide:
//   - PLANET_IN_HOUSE: 9 planets × 12 houses = 108 entries (templated)
//   - PLANET_IN_SIGN: 9 × 12 = 108 entries (templated)
//   - SIGN_AS_LAGNA: 12 entries (ascendant personality)
//   - LORD_IN_HOUSE: 6 special yogas + a generic template
//
// All text is now locale-aware via the server phrasebook (en/hi/gu/sa).
// Texts are concise (1–2 sentences) — adequate for the dashboard tooltip,
// the auto-generated PDF report, and the lessons module. They are written
// to be coherent across the matrix.

import { PlanetId } from '../utils/astro-constants';
import { Locale, p, pf } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

function houseTheme(h: number, locale: Locale): string {
  return p(`interpret.houseTheme.${h}`, locale, '');
}

function planetFlavor(id: PlanetId, locale: Locale): string {
  return p(`interpret.planetFlavor.${id}`, locale, '');
}

function signNature(num: number, locale: Locale): string {
  return p(`interpret.signNature.${num}`, locale, '');
}

export function planetInHouse(planet: PlanetId, house: number, locale: Locale = 'en'): string {
  const al = astroLabels(locale);
  return pf('interpret.template.planetInHouse', locale, {
    planet: al.planet(planet),
    flavor: planetFlavor(planet, locale),
    theme:  houseTheme(house, locale),
    h:      house,
  }, '');
}

export function planetInSign(planet: PlanetId, signNum: number, locale: Locale = 'en'): string {
  const al = astroLabels(locale);
  return pf('interpret.template.planetInSign', locale, {
    planet: al.planet(planet),
    sign:   al.rashi(signNum),
    flavor: planetFlavor(planet, locale),
    nature: signNature(signNum, locale),
  }, '');
}

export function lagnaInterpretation(signNum: number, locale: Locale = 'en'): string {
  return p(`interpret.lagnaNature.${signNum}`, locale, '');
}

export function lordInHouse(lordOf: number, inHouse: number, locale: Locale = 'en'): string {
  const key = `interpret.lordInHouse.${lordOf}-${inHouse}`;
  // Try the special-yoga key first; if it doesn't exist, fall through to the
  // generic template that links the two house-themes.
  const special = p(key, locale, '__MISS__');
  if (special !== '__MISS__' && special !== '') return special;
  return pf('interpret.template.lordInHouseGeneric', locale, {
    l:         lordOf,
    h:         inHouse,
    themeFrom: houseTheme(lordOf, locale),
    themeTo:   houseTheme(inHouse, locale),
  }, '');
}
