// Local LLM narrative service — optional Ollama integration.
//
// If an Ollama instance is running on http://localhost:11434 we route the
// prompt to it and stream the response back. Otherwise we fall back to a
// deterministic rule-based narrative assembled from the engine's own output,
// so you always get something useful without a live model.
//
// The goal is that *no interpretation text ever leaves the user's machine*.

import { KundaliResult } from './kundali.service';
import { currentDasha } from './dasha.service';
import { detectAllYogas } from './yoga-engine.service';
import { calculateKarakas } from './jaimini.service';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2';

export interface NarrativeResult {
  source: 'ollama' | 'rule-based';
  model?: string;
  narrative: string;
}

// ─── Rule-based fallback (deterministic) ────────────────────────────────────
function ruleBasedNarrative(k: KundaliResult): string {
  const asc = k.ascendant;
  const lines: string[] = [];

  lines.push(`This chart rises in ${asc.rashi.name} (${asc.rashi.nameHi}), nakshatra ${asc.nakshatra.name} pada ${asc.nakshatra.pada}. The Vimshottari dasha begins from lord ${asc.nakshatra.lord}.`);

  const moon = k.planets.find((p) => p.id === 'MO')!;
  lines.push(`Moon is in ${moon.rashi.name}, house ${moon.house}, nakshatra ${moon.nakshatra.name}. This is your emotional baseline; the Moon-sign colours every dasha.`);

  const karakas = calculateKarakas(k);
  const ak = karakas.find((x) => x.karaka === 'AK')!;
  const akPlanet = k.planets.find((p) => p.id === ak.planet)!;
  lines.push(`Atmakaraka — the soul-indicator — is ${ak.planet}, most advanced through ${akPlanet.rashi.name} at ${akPlanet.rashi.degInRashi.toFixed(2)}°. This is your central inner project.`);

  const dd = currentDasha(k);
  if (dd?.maha && dd.antar) {
    const mahaHouse = k.planets.find((p) => p.id === dd.maha.lord)!.house;
    const antarHouse = k.planets.find((p) => p.id === dd.antar!.lord)!.house;
    lines.push(`The running period is ${dd.maha.lord}/${dd.antar.lord}. Maha lord sits in your ${mahaHouse}th, antar lord in your ${antarHouse}th — that is where current events unfold.`);
  }

  const yogas = detectAllYogas(k).slice(0, 5);
  if (yogas.length > 0) {
    lines.push(`Classical yogas active in this chart include: ${yogas.map((y) => y.name).join(', ')}.`);
  }

  const tenLord = k.houses[9].lord;
  const tp = k.planets.find((p) => p.id === tenLord)!;
  lines.push(`Career signal: 10th lord ${tenLord} is in your ${tp.house}th house — your professional energy expresses through the matters of that house.`);

  lines.push(`Notable placements: ${k.planets
    .filter((p) => p.exalted || p.debilitated || p.ownSign || p.retrograde)
    .map((p) => `${p.id} ${p.exalted ? 'exalted' : p.debilitated ? 'debilitated' : p.ownSign ? 'own sign' : 'retrograde'} in ${p.rashi.name}`)
    .join('; ') || 'no major dignities'}.`);

  return lines.join('\n\n');
}

// ─── Prompt builder for Ollama ──────────────────────────────────────────────
function promptFor(k: KundaliResult): string {
  const asc = k.ascendant;
  const moon = k.planets.find((p) => p.id === 'MO')!;
  const sun  = k.planets.find((p) => p.id === 'SU')!;
  const dd = currentDasha(k);
  const yogas = detectAllYogas(k).slice(0, 8);
  const karakas = calculateKarakas(k);

  const facts = [
    `Ascendant: ${asc.rashi.name}, nakshatra ${asc.nakshatra.name} pada ${asc.nakshatra.pada}`,
    `Sun in ${sun.rashi.name}, house ${sun.house}${sun.exalted ? ' (exalted)' : sun.debilitated ? ' (debilitated)' : ''}`,
    `Moon in ${moon.rashi.name}, house ${moon.house}, nakshatra ${moon.nakshatra.name}`,
    `Atmakaraka: ${karakas[0].planet}. Darakaraka: ${karakas[6].planet}`,
    `Running period: ${dd?.maha?.lord}/${dd?.antar?.lord ?? '—'}`,
    `Active yogas: ${yogas.map((y) => y.name).join(', ') || 'none notable'}`,
    `Planetary positions: ${k.planets.map((p) => `${p.id} ${p.rashi.name} H${p.house}${p.retrograde ? 'R' : ''}`).join(', ')}`,
  ].join('\n');

  return `You are a classical Vedic astrologer. Given only the deterministic facts below (computed locally with Swiss Ephemeris and Lahiri ayanamsa), write a concise 3-4 paragraph interpretation. Do NOT invent positions or houses that aren't listed. Focus on themes (career, relationships, mind, dharma) derived from the listed placements. Keep the tone grounded and specific.\n\n${facts}\n\nInterpretation:`;
}

async function ollamaAvailable(): Promise<boolean> {
  try {
    const r = await fetch(`${OLLAMA_HOST}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

async function callOllama(prompt: string): Promise<string> {
  const r = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!r.ok) throw new Error(`Ollama ${r.status}`);
  const j = await r.json() as any;
  return (j.response ?? '').trim();
}

export async function generateNarrative(k: KundaliResult): Promise<NarrativeResult> {
  if (await ollamaAvailable()) {
    try {
      const narrative = await callOllama(promptFor(k));
      if (narrative.length > 50) {
        return { source: 'ollama', model: OLLAMA_MODEL, narrative };
      }
    } catch { /* fall through to rule-based */ }
  }
  return { source: 'rule-based', narrative: ruleBasedNarrative(k) };
}

export { ollamaAvailable };
