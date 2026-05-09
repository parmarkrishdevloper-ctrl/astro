// Phase 19 — Samudrika Shastra (full-body physiognomy).
//
// Traditional 32-lakshana / Panchanga physiognomy system. The user supplies
// categorical features across head, face, body, limbs, voice, gait; we map
// each to its classical interpretation (varna, deha-lakshana, guna-dosha)
// and synthesise a multi-section reading.

export type Complexion =
  | 'fair' | 'golden' | 'wheatish' | 'dusky' | 'dark';
export type Build =
  | 'lean' | 'medium' | 'muscular' | 'stocky';
export type Voice =
  | 'melodious' | 'resonant' | 'soft' | 'harsh' | 'high-pitched';
export type Gait =
  | 'elephant' | 'swan' | 'tiger' | 'bull' | 'peacock' | 'horse';

export interface SamudrikaInput {
  gender?: 'm' | 'f' | 'other';
  complexion: Complexion;
  build: Build;
  height?: 'short' | 'medium' | 'tall';
  forehead?: 'broad' | 'medium' | 'narrow';
  eyes?: 'lotus' | 'deep-set' | 'large' | 'almond' | 'small';
  eyebrows?: 'arched' | 'straight' | 'thick' | 'joined';
  nose?: 'straight' | 'aquiline' | 'upturned' | 'flat' | 'long';
  lips?: 'thin' | 'medium' | 'full';
  neck?: 'short' | 'long' | 'conch-like';
  shoulders?: 'broad' | 'medium' | 'narrow' | 'drooping';
  hands?: 'long' | 'short' | 'soft' | 'firm';
  feet?: 'soft-rosy' | 'firm' | 'cracked' | 'flat';
  voice?: Voice;
  gait?: Gait;
  hair?: 'straight' | 'wavy' | 'curly' | 'thick' | 'thin';
  naveldepth?: 'deep' | 'shallow';
  laughter?: 'restrained' | 'hearty' | 'shrill';
}

export interface SamudrikaReading {
  summary: string;
  bodyType: string; // dominant varna / dehatype
  sections: { id: string; heading: string; paragraphs: string[] }[];
  auspicious: string[];
  inauspicious: string[];
  notes: string[];
}

// ─── Tables ────────────────────────────────────────────────────────────────

const COMPLEXION: Record<Complexion, string> = {
  fair:     'Fair complexion (Gaura) — classically linked with Venusian grace, creativity, and sensitivity. Caution: over-fair often pairs with delicate digestion.',
  golden:   'Golden (Kanchan) complexion — auspicious in classical texts; said to draw prosperity and recognition.',
  wheatish: 'Wheatish (Gauravarna) complexion — balanced, the middle path, steady temperament.',
  dusky:    'Dusky (Shyama) complexion — associated with endurance, depth, and practical wisdom.',
  dark:     'Dark (Krishna) complexion — classical markers of stamina, warrior resolve, and quiet intensity.',
};

const BUILD: Record<Build, string> = {
  lean:     'Lean build (Vata predominance) — quick movement, creative thought, nervous energy; needs grounding food and routine.',
  medium:   'Medium build (Sama) — balanced dosha, steady endurance, adaptable.',
  muscular: 'Muscular build (Pitta predominance) — ambition, heat, leadership drive; watch inflammation and irritability.',
  stocky:   'Stocky build (Kapha predominance) — stability, loyalty, slow to anger; watch lethargy and weight.',
};

const VOICE: Record<Voice, string> = {
  melodious:     'Melodious voice — classical sign of Saraswati\'s grace; marks the speaker, singer, or teacher.',
  resonant:      'Resonant voice — authority; natural orator or commander.',
  soft:          'Soft voice — gentle nature, healing presence, diplomatic.',
  harsh:         'Harsh voice — classical caution; intent often read as aggressive even when not so.',
  'high-pitched':'High-pitched voice — Vata prominence; enthusiasm, but tires listeners.',
};

const GAIT: Record<Gait, string> = {
  elephant: 'Gaja-gati (elephant gait) — stately, measured; classical sign of royalty and wealth-retention.',
  swan:     'Hamsa-gati (swan gait) — graceful, considered auspicious especially in women; refinement.',
  tiger:    'Vyaghra-gati (tiger gait) — bold, prowling; warrior temperament.',
  bull:     'Vrsabha-gati (bull gait) — grounded, strong; steadfast character.',
  peacock:  'Mayura-gati (peacock gait) — flair, artistic pride.',
  horse:    'Ashva-gati (horse gait) — restless, quick; wanderer and messenger temperaments.',
};

const FEATURE_LOOKUP: Record<string, Record<string, string>> = {
  forehead: {
    broad:  'Broad forehead — expansive mind, wide interests, leadership capacity.',
    medium: 'Medium forehead — balanced intellect and instinct.',
    narrow: 'Narrow forehead — focused on practical matters, fewer abstractions.',
  },
  eyes: {
    lotus:     'Padma (lotus) eyes — classical beauty; gentle, sensitive, auspicious.',
    'deep-set':'Deep-set eyes — intense, watchful, good memory.',
    large:     'Large eyes — expressive, open-hearted, easily moved.',
    almond:    'Almond eyes — poised, observant, artistic.',
    small:     'Small eyes — shrewd, analytical, guard feelings.',
  },
  eyebrows: {
    arched:   'Arched brows — expressive, theatrical, love of drama.',
    straight: 'Straight brows — direct, factual.',
    thick:    'Thick brows — willful, vital, strong opinions.',
    joined:   'Joined brows (Ekabhru) — intensity; classical texts mark this as a sign of strong karmic imprints.',
  },
  nose: {
    straight: 'Straight nose — honest, straightforward, classical sign of dignity.',
    aquiline: 'Aquiline nose — ambition, leadership, commanding presence.',
    upturned: 'Upturned nose — optimism, curiosity, youthful charm.',
    flat:     'Flat nose — earthy, sensual, grounded.',
    long:     'Long nose — pride, bias toward fine distinctions and hierarchy.',
  },
  lips: {
    thin:   'Thin lips — measured speech, secrets kept.',
    medium: 'Medium lips — balanced expressiveness.',
    full:   'Full lips — warm, affectionate, hedonic tendencies.',
  },
  neck: {
    short:      'Short neck — stubborn, grounded, endurance.',
    long:       'Long neck — refinement, sensitivity, elegance.',
    'conch-like':'Conch-shaped neck (three-lined) — classically very auspicious; dignity and wealth.',
  },
  shoulders: {
    broad:    'Broad shoulders — capacity to carry responsibility; protector archetype.',
    medium:   'Medium shoulders — balanced.',
    narrow:   'Narrow shoulders — avoid taking on too much weight — delegate.',
    drooping: 'Drooping shoulders — prone to burdens and fatigue.',
  },
  hands: {
    long:  'Long hands — reach, ambition, gathering power.',
    short: 'Short hands — efficient, practical, close-in.',
    soft:  'Soft hands — sensitive, not suited to heavy labour; creative or contemplative work.',
    firm:  'Firm hands — discipline, work capacity.',
  },
  feet: {
    'soft-rosy':'Soft rosy feet — classical sign of royal comfort and prosperity.',
    firm:       'Firm feet — hardiness, capacity for travel.',
    cracked:    'Cracked feet — signify long walks, hard work, or neglect of self-care.',
    flat:       'Flat feet — grounded, but classical texts caution against excessive arduous travel.',
  },
  hair: {
    straight: 'Straight hair — stable emotions, steady temperament.',
    wavy:     'Wavy hair — flexibility, creative oscillation.',
    curly:    'Curly hair — passion, volatility, rich inner world.',
    thick:    'Thick hair — vitality, long life.',
    thin:     'Thin hair — Vata; protect digestion and scalp oil.',
  },
  height: {
    short:  'Short stature — compactness, agility, wit.',
    medium: 'Medium stature — balanced visibility.',
    tall:   'Tall stature — visible, marked for leadership or performance roles.',
  },
  naveldepth: {
    deep:    'Deep navel — classical sign of wealth and long life.',
    shallow: 'Shallow navel — lighter pranic reserves; build vitality.',
  },
  laughter: {
    restrained:'Restrained laughter — dignity and control; rarely unguarded.',
    hearty:    'Hearty laughter — generous spirit, social warmth.',
    shrill:    'Shrill laughter — nervous energy; classical caution against this in formal settings.',
  },
};

// Auspicious / inauspicious lakshana — classical flags
const AUSPICIOUS = new Set([
  'hair:thick', 'neck:conch-like', 'eyes:lotus', 'voice:melodious',
  'gait:elephant', 'gait:swan', 'nose:straight', 'complexion:golden',
  'feet:soft-rosy', 'naveldepth:deep',
]);
const INAUSPICIOUS = new Set([
  'voice:harsh', 'laughter:shrill', 'feet:cracked',
  'shoulders:drooping', 'eyebrows:joined',
]);

// ─── Builder ──────────────────────────────────────────────────────────────

function doshaOf(input: SamudrikaInput): string {
  // Simple mapping build → dosha dominance
  return input.build === 'lean'
    ? 'Vata-dominant'
    : input.build === 'muscular'
    ? 'Pitta-dominant'
    : input.build === 'stocky'
    ? 'Kapha-dominant'
    : 'Tridosha-balanced';
}

import { Locale, p, pf } from '../i18n';

export function readSamudrika(input: SamudrikaInput, locale: Locale = 'en'): SamudrikaReading {
  const dosha = doshaOf(input);
  const bodyType = `${dosha} · ${input.complexion} complexion · ${input.build} build`;

  const faceParagraphs: string[] = [];
  for (const f of ['forehead', 'eyes', 'eyebrows', 'nose', 'lips']) {
    const v = (input as any)[f];
    if (v && FEATURE_LOOKUP[f]?.[v]) faceParagraphs.push(FEATURE_LOOKUP[f][v]);
  }

  const bodyParagraphs: string[] = [];
  bodyParagraphs.push(COMPLEXION[input.complexion]);
  bodyParagraphs.push(BUILD[input.build]);
  for (const f of ['height', 'neck', 'shoulders', 'hands', 'feet', 'hair', 'naveldepth']) {
    const v = (input as any)[f];
    if (v && FEATURE_LOOKUP[f]?.[v]) bodyParagraphs.push(FEATURE_LOOKUP[f][v]);
  }

  const presenceParagraphs: string[] = [];
  if (input.voice) presenceParagraphs.push(VOICE[input.voice]);
  if (input.gait)  presenceParagraphs.push(GAIT[input.gait]);
  if (input.laughter && FEATURE_LOOKUP.laughter[input.laughter]) {
    presenceParagraphs.push(FEATURE_LOOKUP.laughter[input.laughter]);
  }
  if (presenceParagraphs.length === 0) presenceParagraphs.push('No presence data supplied; classical physiognomy rates voice and gait among the strongest indicators.');

  const sections = [
    { id: 'body',      heading: p('samudrika.heading.body',  locale, 'Body constitution'),      paragraphs: bodyParagraphs },
    { id: 'face',      heading: p('samudrika.heading.face',  locale, 'Face and features'),      paragraphs: faceParagraphs.length ? faceParagraphs : ['No face-feature data supplied.'] },
    { id: 'presence',  heading: p('samudrika.heading.signs', locale, 'Voice, gait, and presence'), paragraphs: presenceParagraphs },
  ];

  // Scan for classical auspicious / inauspicious flags
  const present = new Set<string>();
  for (const k of Object.keys(input)) {
    const v = (input as any)[k];
    if (typeof v === 'string') present.add(`${k}:${v}`);
  }
  const auspicious = [...present].filter((x) => AUSPICIOUS.has(x));
  const inauspicious = [...present].filter((x) => INAUSPICIOUS.has(x));

  const opening = `${dosha} constitution with ${input.complexion} complexion and a ${input.build} build`;
  const summary = pf('samudrika.summary', locale, { bodyType, opening }, '');

  const notes = [
    p('samudrika.notes.0', locale, 'Samudrika lakshana are descriptive, not deterministic — they speak to disposition, not fate.'),
    'Individual features are read alongside the whole — a single "inauspicious" flag is outweighed by the balance of the body.',
  ];

  return { summary, bodyType, sections, auspicious, inauspicious, notes };
}
