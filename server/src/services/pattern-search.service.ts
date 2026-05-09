// Pattern search — DSL for astrological pattern matching against a chart.
//
// Grammar (case-insensitive):
//   planet in sign             —  "SA in libra"     / "saturn in LI"
//   planet in Nh               —  "MA in 10h"       (Mars in 10th house)
//   planet aspects planet      —  "JU aspects MO"
//   planet aspects Nh          —  "SA aspects 10h"
//   planet with planet         —  "SU with SA"      (conjunction, ≤10°)
//   planet retrograde          —  "ME retrograde"
//   planet exalted             —  "MA exalted"
//   planet debilitated         —  "SA debilitated"
//   planet combust             —  "ME combust"
//   planet own                 —  "JU own"          (in own sign)
//   planet strong              —  Shadbala total >= 5 rupas (simple)
//   lagna in sign              —  "lagna in virgo"
//   moon-sign is sign          —  "moonsign is libra"
//   nakshatra lord is planet   —  "nakshatralord is JU"
//   yoga <name>                —  "yoga gajakesari" — a named yoga flag
//
// Multiple conditions combine via `and` / `or` / parens. Example:
//   (SA in 10h or SA aspects 10h) and JU in 5h
//
// The parser is deliberately forgiving — unknown tokens are ignored in
// boolean context, never throw.

import { KundaliResult } from './kundali.service';
import { PlanetId, RASHIS } from '../utils/astro-constants';
import { calculateShadbala } from './strength.service';
import { detectYogas } from './yoga.service';

// Vedic aspect distances (1 = same house). All planets aspect 7th; Mars +4/+8;
// Jupiter +5/+9; Saturn +3/+10. Rahu/Ketu aspect 5/7/9 (Parashara).
function aspectDistances(from: PlanetId): number[] {
  if (from === 'MA') return [7, 4, 8];
  if (from === 'JU') return [7, 5, 9];
  if (from === 'SA') return [7, 3, 10];
  if (from === 'RA' || from === 'KE') return [5, 7, 9];
  return [7];
}

function planetAspectsHouse(k: KundaliResult, from: PlanetId, house: number): boolean {
  const p = k.planets.find((x) => x.id === from);
  if (!p) return false;
  const dist = ((house - p.house + 12) % 12) + 1;
  return aspectDistances(from).includes(dist);
}

function planetAspectsPlanet(k: KundaliResult, from: PlanetId, to: PlanetId): boolean {
  const b = k.planets.find((x) => x.id === to);
  if (!b) return false;
  return planetAspectsHouse(k, from, b.house);
}

const PLANET_ALIASES: Record<string, PlanetId> = {
  su: 'SU', sun: 'SU', surya: 'SU', ravi: 'SU',
  mo: 'MO', moon: 'MO', chandra: 'MO', soma: 'MO',
  ma: 'MA', mars: 'MA', mangal: 'MA', kuja: 'MA',
  me: 'ME', mercury: 'ME', budh: 'ME', budha: 'ME',
  ju: 'JU', jupiter: 'JU', guru: 'JU', brihaspati: 'JU',
  ve: 'VE', venus: 'VE', shukra: 'VE',
  sa: 'SA', saturn: 'SA', shani: 'SA',
  ra: 'RA', rahu: 'RA',
  ke: 'KE', ketu: 'KE',
};

const SIGN_ALIASES: Record<string, number> = {};
RASHIS.forEach((r, i) => {
  SIGN_ALIASES[r.name.toLowerCase()] = i + 1;
  SIGN_ALIASES[r.nameHi.toLowerCase()] = i + 1;
});
// Shortcuts
Object.assign(SIGN_ALIASES, {
  ar: 1, ta: 2, ge: 3, cn: 4, le: 5, vi: 6,
  li: 7, sc: 8, sg: 9, cp: 10, aq: 11, pi: 12,
  aries: 1, taurus: 2, gemini: 3, cancer: 4, leo: 5, virgo: 6,
  libra: 7, scorpio: 8, sagittarius: 9, capricorn: 10, aquarius: 11, pisces: 12,
});

function parsePlanet(tok: string): PlanetId | null {
  return PLANET_ALIASES[tok.toLowerCase()] ?? null;
}
function parseSign(tok: string): number | null {
  const s = SIGN_ALIASES[tok.toLowerCase()];
  return s ?? null;
}
function parseHouseNum(tok: string): number | null {
  const m = tok.match(/^(\d{1,2})h$/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 12 ? n : null;
}

// ── AST ──────────────────────────────────────────────────────────────────────

type Leaf =
  | { kind: 'planet-in-sign'; planet: PlanetId; sign: number }
  | { kind: 'planet-in-house'; planet: PlanetId; house: number }
  | { kind: 'planet-aspects-planet'; from: PlanetId; to: PlanetId }
  | { kind: 'planet-aspects-house'; from: PlanetId; house: number }
  | { kind: 'planet-with-planet'; a: PlanetId; b: PlanetId }
  | { kind: 'planet-retrograde'; planet: PlanetId }
  | { kind: 'planet-exalted'; planet: PlanetId }
  | { kind: 'planet-debilitated'; planet: PlanetId }
  | { kind: 'planet-combust'; planet: PlanetId }
  | { kind: 'planet-own'; planet: PlanetId }
  | { kind: 'planet-strong'; planet: PlanetId }
  | { kind: 'lagna-in-sign'; sign: number }
  | { kind: 'moon-in-sign'; sign: number }
  | { kind: 'nak-lord'; planet: PlanetId }
  | { kind: 'yoga'; name: string }
  | { kind: 'bad'; why: string };

type Node =
  | { op: 'leaf'; leaf: Leaf }
  | { op: 'and'; left: Node; right: Node }
  | { op: 'or'; left: Node; right: Node }
  | { op: 'not'; child: Node };

function tokenize(q: string): string[] {
  return q
    .replace(/[()]/g, (c) => ` ${c} `)
    .split(/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Pratt-style tiny parser with precedence: not > and > or
function parse(q: string): Node {
  const toks = tokenize(q);
  let i = 0;

  function peek(): string | undefined { return toks[i]; }
  function take(): string | undefined { return toks[i++]; }

  function parseLeaf(): Node {
    // Try to match a clause of up to 3 tokens
    const a = take();
    if (!a) return { op: 'leaf', leaf: { kind: 'bad', why: 'empty' } };

    const aLow = a.toLowerCase();
    if (aLow === 'lagna') {
      const isTok = toks[i]?.toLowerCase();
      if (isTok === 'in' || isTok === 'is') i++;
      const signTok = take();
      const sign = signTok ? parseSign(signTok) : null;
      if (sign) return { op: 'leaf', leaf: { kind: 'lagna-in-sign', sign } };
      return { op: 'leaf', leaf: { kind: 'bad', why: `lagna: need sign, got "${signTok}"` } };
    }
    if (aLow === 'moonsign' || aLow === 'moon-sign') {
      const isTok = toks[i]?.toLowerCase();
      if (isTok === 'in' || isTok === 'is') i++;
      const signTok = take();
      const sign = signTok ? parseSign(signTok) : null;
      if (sign) return { op: 'leaf', leaf: { kind: 'moon-in-sign', sign } };
      return { op: 'leaf', leaf: { kind: 'bad', why: `moonsign: need sign, got "${signTok}"` } };
    }
    if (aLow === 'nakshatralord' || aLow === 'nak-lord') {
      const isTok = toks[i]?.toLowerCase();
      if (isTok === 'is' || isTok === 'in') i++;
      const pTok = take();
      const pl = pTok ? parsePlanet(pTok) : null;
      if (pl) return { op: 'leaf', leaf: { kind: 'nak-lord', planet: pl } };
      return { op: 'leaf', leaf: { kind: 'bad', why: `nak-lord: need planet` } };
    }
    if (aLow === 'yoga') {
      const name = take() ?? '';
      return { op: 'leaf', leaf: { kind: 'yoga', name: name.toLowerCase() } };
    }

    const planet = parsePlanet(a);
    if (!planet) return { op: 'leaf', leaf: { kind: 'bad', why: `unknown token "${a}"` } };

    const rel = take()?.toLowerCase();
    if (!rel) return { op: 'leaf', leaf: { kind: 'bad', why: `need predicate after ${a}` } };

    if (rel === 'retrograde') return { op: 'leaf', leaf: { kind: 'planet-retrograde', planet } };
    if (rel === 'exalted')    return { op: 'leaf', leaf: { kind: 'planet-exalted',    planet } };
    if (rel === 'debilitated' || rel === 'debil') {
      return { op: 'leaf', leaf: { kind: 'planet-debilitated', planet } };
    }
    if (rel === 'combust')    return { op: 'leaf', leaf: { kind: 'planet-combust',    planet } };
    if (rel === 'own' || rel === 'swakshetra') {
      return { op: 'leaf', leaf: { kind: 'planet-own', planet } };
    }
    if (rel === 'strong')     return { op: 'leaf', leaf: { kind: 'planet-strong',     planet } };

    if (rel === 'in') {
      const tgt = take();
      if (!tgt) return { op: 'leaf', leaf: { kind: 'bad', why: `${a} in ??` } };
      const houseN = parseHouseNum(tgt);
      if (houseN) return { op: 'leaf', leaf: { kind: 'planet-in-house', planet, house: houseN } };
      const sign = parseSign(tgt);
      if (sign) return { op: 'leaf', leaf: { kind: 'planet-in-sign', planet, sign } };
      return { op: 'leaf', leaf: { kind: 'bad', why: `${a} in "${tgt}" — not sign/house` } };
    }

    if (rel === 'aspects' || rel === 'drishti') {
      const tgt = take();
      if (!tgt) return { op: 'leaf', leaf: { kind: 'bad', why: `${a} aspects ??` } };
      const houseN = parseHouseNum(tgt);
      if (houseN) return { op: 'leaf', leaf: { kind: 'planet-aspects-house', from: planet, house: houseN } };
      const p2 = parsePlanet(tgt);
      if (p2) return { op: 'leaf', leaf: { kind: 'planet-aspects-planet', from: planet, to: p2 } };
      return { op: 'leaf', leaf: { kind: 'bad', why: `aspects target "${tgt}" invalid` } };
    }

    if (rel === 'with' || rel === 'conjunct' || rel === 'yuti') {
      const tgt = take();
      const p2 = tgt ? parsePlanet(tgt) : null;
      if (p2) return { op: 'leaf', leaf: { kind: 'planet-with-planet', a: planet, b: p2 } };
      return { op: 'leaf', leaf: { kind: 'bad', why: `${a} with "${tgt}"` } };
    }

    return { op: 'leaf', leaf: { kind: 'bad', why: `unknown relation "${rel}"` } };
  }

  function parsePrimary(): Node {
    const t = peek();
    if (t === '(') {
      take();
      const inner = parseOr();
      if (peek() === ')') take();
      return inner;
    }
    if (t?.toLowerCase() === 'not') {
      take();
      return { op: 'not', child: parsePrimary() };
    }
    return parseLeaf();
  }

  function parseAnd(): Node {
    let left = parsePrimary();
    while (peek()?.toLowerCase() === 'and' || peek()?.toLowerCase() === '&') {
      take();
      left = { op: 'and', left, right: parsePrimary() };
    }
    return left;
  }

  function parseOr(): Node {
    let left = parseAnd();
    while (peek()?.toLowerCase() === 'or' || peek()?.toLowerCase() === '|') {
      take();
      left = { op: 'or', left, right: parseAnd() };
    }
    return left;
  }

  return parseOr();
}

// ── Evaluator ────────────────────────────────────────────────────────────────

function evalLeaf(leaf: Leaf, k: KundaliResult): boolean {
  const p = (id: PlanetId) => k.planets.find((pl) => pl.id === id)!;

  switch (leaf.kind) {
    case 'planet-in-sign':
      return p(leaf.planet).rashi.num === leaf.sign;
    case 'planet-in-house':
      return p(leaf.planet).house === leaf.house;
    case 'planet-retrograde':
      return p(leaf.planet).retrograde;
    case 'planet-exalted':
      return p(leaf.planet).exalted;
    case 'planet-debilitated':
      return p(leaf.planet).debilitated;
    case 'planet-combust':
      return p(leaf.planet).combust;
    case 'planet-own':
      return p(leaf.planet).ownSign;
    case 'planet-strong': {
      const sb = calculateShadbala(k);
      return (sb.planets.find((s) => s.planet === leaf.planet)?.totalRupas ?? 0) >= 5;
    }
    case 'planet-with-planet': {
      const pa = p(leaf.a), pb = p(leaf.b);
      const diff = Math.abs(((pa.longitude - pb.longitude + 540) % 360) - 180);
      const sep = 180 - diff;
      return sep <= 10 && pa.rashi.num === pb.rashi.num;
    }
    case 'planet-aspects-planet':
      return planetAspectsPlanet(k, leaf.from, leaf.to);
    case 'planet-aspects-house':
      return planetAspectsHouse(k, leaf.from, leaf.house);
    case 'lagna-in-sign':
      return k.ascendant.rashi.num === leaf.sign;
    case 'moon-in-sign':
      return p('MO').rashi.num === leaf.sign;
    case 'nak-lord':
      return p('MO').nakshatra.lord === leaf.planet;
    case 'yoga': {
      const y = detectYogas(k);
      return y.some((yg) => yg.name.toLowerCase().includes(leaf.name));
    }
    case 'bad':
      return false;
  }
}

function evalNode(n: Node, k: KundaliResult): boolean {
  switch (n.op) {
    case 'leaf': return evalLeaf(n.leaf, k);
    case 'and':  return evalNode(n.left, k) && evalNode(n.right, k);
    case 'or':   return evalNode(n.left, k) || evalNode(n.right, k);
    case 'not':  return !evalNode(n.child, k);
  }
}

// Collect all leaves for explanation
function collectLeaves(n: Node, out: Leaf[] = []): Leaf[] {
  if (n.op === 'leaf') { out.push(n.leaf); return out; }
  if (n.op === 'not')  { collectLeaves(n.child, out); return out; }
  collectLeaves(n.left, out);
  collectLeaves(n.right, out);
  return out;
}

export interface PatternSearchResult {
  query: string;
  match: boolean;
  breakdown: { clause: string; match: boolean }[];
  parseErrors: string[];
}

function describeLeaf(l: Leaf): string {
  switch (l.kind) {
    case 'planet-in-sign':      return `${l.planet} in ${RASHIS[l.sign - 1].name}`;
    case 'planet-in-house':     return `${l.planet} in ${l.house}H`;
    case 'planet-retrograde':   return `${l.planet} retrograde`;
    case 'planet-exalted':      return `${l.planet} exalted`;
    case 'planet-debilitated':  return `${l.planet} debilitated`;
    case 'planet-combust':      return `${l.planet} combust`;
    case 'planet-own':          return `${l.planet} in own sign`;
    case 'planet-strong':       return `${l.planet} strong (≥5 rupas)`;
    case 'planet-with-planet':  return `${l.a} with ${l.b}`;
    case 'planet-aspects-planet': return `${l.from} aspects ${l.to}`;
    case 'planet-aspects-house':  return `${l.from} aspects ${l.house}H`;
    case 'lagna-in-sign':       return `Lagna in ${RASHIS[l.sign - 1].name}`;
    case 'moon-in-sign':        return `Moon in ${RASHIS[l.sign - 1].name}`;
    case 'nak-lord':            return `Nak-lord = ${l.planet}`;
    case 'yoga':                return `yoga "${l.name}"`;
    case 'bad':                 return `⚠ ${l.why}`;
  }
}

export function searchPattern(k: KundaliResult, query: string): PatternSearchResult {
  const ast = parse(query);
  const match = evalNode(ast, k);
  const leaves = collectLeaves(ast);
  const parseErrors = leaves.filter((l) => l.kind === 'bad').map((l: any) => l.why);
  const breakdown = leaves
    .filter((l) => l.kind !== 'bad')
    .map((l) => ({ clause: describeLeaf(l), match: evalLeaf(l, k) }));
  return { query, match, breakdown, parseErrors };
}

// Catalog of presets — pre-built patterns for UI dropdowns
export const PATTERN_PRESETS: { id: string; label: string; query: string }[] = [
  { id: 'gajakesari',   label: 'Gaja-Kesari (JU kendra from MO)', query: 'yoga gajakesari' },
  { id: 'mahalakshmi',  label: 'Mahalakshmi (VE + MO in kendra/kona)', query: 'yoga lakshmi' },
  { id: 'raja-rajyoga', label: 'Raja Yoga (kendra-kona lord link)', query: 'yoga raja' },
  { id: 'neechabhanga', label: 'Neecha-Bhanga (debilitated but cancelled)', query: 'yoga neecha' },
  { id: 'kemadruma',    label: 'Kemadruma (Moon isolated)', query: 'yoga kemadruma' },
  { id: 'sasa',         label: 'Sasa Yoga (Saturn in kendra own/exalt)', query: 'SA in capricorn or SA in aquarius or SA in libra' },
  { id: 'budhaditya',   label: 'Budha-Aditya (SU + ME)', query: 'SU with ME' },
  { id: 'guru-mangal',  label: 'Guru-Mangala (JU + MA)', query: 'JU with MA' },
  { id: 'scholar',      label: 'Scholar (JU in 5H, strong)', query: 'JU in 5h and JU strong' },
  { id: 'wealth-2-11',  label: 'Wealth link 2L–11L', query: '(ME in 11h or SA in 11h or VE in 11h) and JU aspects 2h' },
];
