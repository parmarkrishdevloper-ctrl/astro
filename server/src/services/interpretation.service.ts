// Interpretation engine — assembles human-readable readings for a chart.
//
// Combines the static text database (data/interpretations.ts) with classical
// references (data/classical-refs.ts) to produce a coherent narrative for
// each section of the report.

import { PlanetId, RASHIS } from '../utils/astro-constants';
import { KundaliResult } from './kundali.service';
import { lagnaInterpretation, planetInHouse, planetInSign, lordInHouse } from '../data/interpretations';
import { findRefs, ClassicalRef } from '../data/classical-refs';
import { Locale, pf } from '../i18n';
import { astroLabels } from '../i18n/astro-labels';

export interface InterpretationLine {
  topic: string;
  text: string;
  refs: ClassicalRef[];
}

export interface FullInterpretation {
  ascendant: InterpretationLine;
  planetsInHouses: InterpretationLine[];
  planetsInSigns: InterpretationLine[];
  houseLordPlacements: InterpretationLine[];
}

export function interpretChart(k: KundaliResult, locale: Locale = 'en'): FullInterpretation {
  const al = astroLabels(locale);

  const ascendant: InterpretationLine = {
    topic: pf('interpret.topic.ascendant', locale, { sign: al.rashi(k.ascendant.rashi.num) }, ''),
    text: lagnaInterpretation(k.ascendant.rashi.num, locale),
    refs: findRefs([`asc${k.ascendant.rashi.num}`, 'lagna'], locale),
  };

  const planetsInHouses = k.planets.map((p) => ({
    topic: pf('interpret.topic.planetInHouse', locale, { planet: al.planet(p.id), h: p.house }, ''),
    text: planetInHouse(p.id, p.house, locale),
    refs: findRefs([p.id, `house${p.house}`], locale),
  }));

  const planetsInSigns = k.planets.map((p) => ({
    topic: pf('interpret.topic.planetInSign', locale, { planet: al.planet(p.id), sign: al.rashi(p.rashi.num) }, ''),
    text: planetInSign(p.id, p.rashi.num, locale),
    refs: findRefs([p.id, `sign${p.rashi.num}`], locale),
  }));

  const houseLordPlacements: InterpretationLine[] = [];
  const lagnaSign = k.ascendant.rashi.num;
  for (let h = 1; h <= 12; h++) {
    const sign = ((lagnaSign - 1 + (h - 1)) % 12) + 1;
    const lord: PlanetId = RASHIS[sign - 1].lord;
    const lordPlanet = k.planets.find((pp) => pp.id === lord);
    if (!lordPlanet) continue;
    houseLordPlacements.push({
      topic: pf('interpret.topic.lordInHouse', locale, { l: h, lord: al.planet(lord), h: lordPlanet.house }, ''),
      text: lordInHouse(h, lordPlanet.house, locale),
      refs: findRefs([`l${h}`, `house${lordPlanet.house}`], locale),
    });
  }

  return { ascendant, planetsInHouses, planetsInSigns, houseLordPlacements };
}
