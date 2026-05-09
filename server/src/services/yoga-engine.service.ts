// Generic yoga rule engine.
//
// Evaluates the predicate DSL from data/yogas-db.ts against a KundaliResult.
// Returns all yogas whose rule clauses match. Also auto-detects all 12×11/2
// possible Parivartana (mutual exchange) yogas.

import { KundaliResult } from './kundali.service';
import { PlanetId, RASHIS, SPECIAL_ASPECTS } from '../utils/astro-constants';
import { YOGAS, YogaDef, Predicate } from '../data/yogas-db';
import { p, pf, type Locale } from '../i18n';

const KENDRAS = [1, 4, 7, 10];

function planet(k: KundaliResult, id: PlanetId) {
  return k.planets.find((p) => p.id === id);
}

function distance(a: number, b: number): number {
  return ((b - a + 12) % 12) + 1;
}

function houseFromPlanet(k: KundaliResult, target: PlanetId, ref: PlanetId): number {
  const t = planet(k, target);
  const r = planet(k, ref);
  if (!t || !r) return 0;
  return distance(r.rashi.num, t.rashi.num);
}

function planetAspects(k: KundaliResult, from: PlanetId, to: PlanetId): boolean {
  const f = planet(k, from);
  const t = planet(k, to);
  if (!f || !t) return false;
  // 7th aspect (universal)
  if (((t.rashi.num - f.rashi.num + 12) % 12) === 6) return true;
  // Special aspects
  for (const a of SPECIAL_ASPECTS[from] || []) {
    if (((t.rashi.num - f.rashi.num + 12) % 12) === a - 1) return true;
  }
  return false;
}

function lordOfHouse(k: KundaliResult, h: number): PlanetId {
  const lagna = k.ascendant.rashi.num;
  const sign = ((lagna - 1 + (h - 1)) % 12) + 1;
  return RASHIS[sign - 1].lord;
}

function evaluatePredicate(k: KundaliResult, pred: Predicate): boolean {
  switch (pred.kind) {
    case 'in_own_or_exalted_kendra': {
      const p = planet(k, pred.planet);
      return !!p && (p.ownSign || p.exalted) && KENDRAS.includes(p.house);
    }
    case 'planet_in_house': {
      const p = planet(k, pred.planet);
      return !!p && p.house === pred.house;
    }
    case 'planet_in_sign': {
      const p = planet(k, pred.planet);
      return !!p && p.rashi.num === pred.sign;
    }
    case 'planet_aspects_planet':
      return planetAspects(k, pred.from, pred.to);
    case 'conjunct': {
      const a = planet(k, pred.a);
      const b = planet(k, pred.b);
      return !!a && !!b && a.rashi.num === b.rashi.num;
    }
    case 'planet_in_kendra_from': {
      const h = houseFromPlanet(k, pred.planet, pred.from);
      return KENDRAS.includes(h);
    }
    case 'mutual_kendra': {
      const ha = houseFromPlanet(k, pred.a, pred.b);
      const hb = houseFromPlanet(k, pred.b, pred.a);
      return KENDRAS.includes(ha) && KENDRAS.includes(hb);
    }
    case 'lord_of_house_in_house': {
      const lord = lordOfHouse(k, pred.lordOf);
      const p = planet(k, lord);
      return !!p && p.house === pred.in;
    }
    case 'parivartana': {
      const a = planet(k, pred.a);
      const b = planet(k, pred.b);
      if (!a || !b) return false;
      const lordA = RASHIS[a.rashi.num - 1].lord;
      const lordB = RASHIS[b.rashi.num - 1].lord;
      return lordA === pred.b && lordB === pred.a;
    }
    case 'is_retrograde': {
      const p = planet(k, pred.planet);
      return !!p && p.retrograde;
    }
    case 'is_combust': {
      const p = planet(k, pred.planet);
      return !!p && p.combust;
    }
    case 'all_planets_in_houses': {
      return k.planets.every((p) => pred.houses.includes(p.house));
    }
    case 'no_planet_in_houses_from_moon': {
      const moon = planet(k, 'MO');
      if (!moon) return false;
      const exclude = new Set<PlanetId>(['MO', ...(pred.exclude || [])]);
      const houses = pred.houses.map(
        (h) => ((moon.rashi.num - 1 + (h - 1)) % 12) + 1,
      );
      // Also exclude conjunctions with the Moon itself
      if (k.planets.some((p) => !exclude.has(p.id) && p.rashi.num === moon.rashi.num)) {
        return false;
      }
      return !k.planets.some(
        (p) => !exclude.has(p.id) && houses.includes(p.rashi.num),
      );
    }
  }
}

function evaluateRule(k: KundaliResult, rule: YogaDef['rule']): boolean {
  if (rule.all && !rule.all.every((p) => evaluatePredicate(k, p))) return false;
  if (rule.any && !rule.any.some((p) => evaluatePredicate(k, p))) return false;
  return true;
}

export interface DetectedYoga {
  id: string;
  name: string;
  sanskrit?: string;
  category: string;
  effect: string;
  source: string;
  strength: 'strong' | 'moderate' | 'weak';
  involves: PlanetId[];
}

/** Detect parivartana yogas (mutual sign exchange between any two grahas). */
function detectParivartanas(k: KundaliResult, locale: Locale): DetectedYoga[] {
  const out: DetectedYoga[] = [];
  const ids: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA'];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = planet(k, ids[i])!;
      const b = planet(k, ids[j])!;
      if (RASHIS[a.rashi.num - 1].lord === ids[j] &&
          RASHIS[b.rashi.num - 1].lord === ids[i]) {
        out.push({
          id: `parivartana_${ids[i]}_${ids[j]}`,
          name: `Parivartana Yoga (${ids[i]} ↔ ${ids[j]})`,
          sanskrit: 'परिवर्तन योग',
          category: 'Parivartana',
          effect: pf('yoga.description.Parivartana', locale, { a: ids[i], b: ids[j] }),
          source: 'BPHS Ch.34 Sl.32',
          strength: 'strong',
          involves: [ids[i], ids[j]],
        });
      }
    }
  }
  return out;
}

export function detectAllYogas(k: KundaliResult, locale: Locale = 'en'): DetectedYoga[] {
  const out: DetectedYoga[] = [];
  for (const def of YOGAS) {
    if (evaluateRule(k, def.rule)) {
      // Try to extract involved planets from the rule
      const involves = new Set<PlanetId>();
      const collect = (p: Predicate) => {
        if ('planet' in p) involves.add(p.planet as PlanetId);
        if ('a' in p) involves.add(p.a as PlanetId);
        if ('b' in p) involves.add(p.b as PlanetId);
        if ('from' in p) involves.add(p.from as PlanetId);
        if ('to' in p) involves.add(p.to as PlanetId);
      };
      def.rule.all?.forEach(collect);
      def.rule.any?.forEach(collect);
      // Localize via the phrasebook (nameKey / effectKey), falling back to
      // the English string authored in yogas-db. Keys were added in the
      // Phase 14L localization pass; entries without a key still resolve.
      const localizedName = def.nameKey
        ? p(def.nameKey, locale, def.name)
        : def.name;
      const localizedEffect = def.effectKey
        ? p(def.effectKey, locale, def.effect)
        : def.effect;
      out.push({
        id: def.id,
        name: localizedName,
        sanskrit: def.sanskrit,
        category: def.category,
        effect: localizedEffect,
        source: def.source,
        strength: def.strength ?? 'moderate',
        involves: [...involves],
      });
    }
  }
  out.push(...detectParivartanas(k, locale));
  return out;
}
