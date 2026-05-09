// Phase 19 — Palmistry (Hasta Samudrika).
//
// Rule-based interpretive engine: the user supplies categorical features of
// the hand (shape, lines, mounts, marks) and we map each feature to a
// classical interpretation paragraph. No image analysis — the input is
// "mostly zero" / minimal, just structured flags.
//
// References: Cheiro's "Language of the Hand" + classical Hasta Samudrika
// (Chiromancy as preserved in Brihat Samhita ch. 68 and Garga Samhita).

import { Locale, p, pf } from '../i18n';

export type HandShape = 'earth' | 'air' | 'fire' | 'water';
export type LineQuality = 'absent' | 'faint' | 'clear' | 'deep' | 'broken' | 'chained' | 'forked';
export type MountSize = 'flat' | 'normal' | 'developed' | 'over-developed';
export type Mark =
  | 'star' | 'cross' | 'triangle' | 'square' | 'island' | 'grille' | 'circle' | 'spot';

export interface PalmInput {
  dominantHand: 'left' | 'right';
  handShape: HandShape;
  thumb: 'flexible' | 'firm' | 'low-set' | 'high-set';
  fingers: {
    jupiter?: 'long' | 'normal' | 'short';   // index
    saturn?: 'long' | 'normal' | 'short';    // middle
    apollo?: 'long' | 'normal' | 'short';    // ring
    mercury?: 'long' | 'normal' | 'short';   // little
  };
  lines: {
    life?: LineQuality;
    head?: LineQuality;
    heart?: LineQuality;
    fate?: LineQuality;
    sun?: LineQuality;       // Apollo / fame
    mercury?: LineQuality;   // health / business
    marriage?: LineQuality;
  };
  mounts?: {
    jupiter?: MountSize;
    saturn?: MountSize;
    apollo?: MountSize;
    mercury?: MountSize;
    venus?: MountSize;
    mars_lower?: MountSize;
    mars_upper?: MountSize;
    moon?: MountSize;
    rahu?: MountSize;
  };
  marks?: { line: keyof PalmInput['lines']; mark: Mark }[];
}

export interface PalmistryReading {
  summary: string;
  sections: { id: string; heading: string; paragraphs: string[] }[];
  highlights: string[];
  notes: string[];
}

// ─── Interpretation tables ─────────────────────────────────────────────────

const HAND_SHAPE_READING: Record<HandShape, { theme: string; traits: string }> = {
  earth: {
    theme: 'Earth hand (square palm, short fingers)',
    traits:
      'Practical, grounded, hands-on; finds meaning in tangible work and prefers tradition over experiment. Builds slowly but reliably.',
  },
  air: {
    theme: 'Air hand (square palm, long fingers)',
    traits:
      'Intellectual, communicative, restless mind; thrives on ideas, language, and social exchange. Quick to understand, slower to commit emotionally.',
  },
  fire: {
    theme: 'Fire hand (long palm, short fingers)',
    traits:
      'Energetic, instinctive, action-oriented; takes initiative and inspires others. Risks include impulsiveness and burnout when not paced.',
  },
  water: {
    theme: 'Water hand (long palm, long fingers)',
    traits:
      'Sensitive, imaginative, empathic; rich inner life and creative gifts. Needs solitude to recharge; absorbs surrounding emotions easily.',
  },
};

const THUMB_READING: Record<PalmInput['thumb'], string> = {
  flexible:
    'Flexible thumb — adaptable, generous, persuadable; finds it easier to compromise than to hold a hard line.',
  firm:
    'Firm (stiff) thumb — strong willpower, principled, sometimes stubborn; values self-discipline and follow-through.',
  'low-set':
    'Low-set thumb — independent, rule-bending, original thinker; resists being told what to do.',
  'high-set':
    'High-set thumb — cautious, tradition-respecting, methodical; prefers proven paths.',
};

const FINGER_LENGTH: Record<'long' | 'normal' | 'short', Record<string, string>> = {
  long: {
    jupiter: 'Long Jupiter (index) — natural authority, leadership ambition, faith in self.',
    saturn:  'Long Saturn (middle) — patience, depth of thought, bias toward solitude and study.',
    apollo:  'Long Apollo (ring) — aesthetic gifts, expressiveness, love of art and acclaim.',
    mercury: 'Long Mercury (little) — eloquent, persuasive, business-savvy.',
  },
  normal: {
    jupiter: 'Balanced Jupiter — leadership tempered by humility.',
    saturn:  'Balanced Saturn — disciplined yet warm.',
    apollo:  'Balanced Apollo — creative without vanity.',
    mercury: 'Balanced Mercury — clear communication, steady commerce.',
  },
  short: {
    jupiter: 'Short Jupiter — discomfort with command roles; prefers contributing in a team.',
    saturn:  'Short Saturn — restless with routine; struggles with patience.',
    apollo:  'Short Apollo — modest about creative gifts; understated style.',
    mercury: 'Short Mercury — direct rather than persuasive; values action over speech.',
  },
};

const LINE_READING: Record<string, Record<LineQuality, string>> = {
  life: {
    absent:   'Life line absent — extremely rare; classically a sign of constitutional fragility.',
    faint:    'Faint life line — guard against fatigue; build vitality through disciplined diet, sleep, and pranayama.',
    clear:    'Clear life line — steady vitality, healthy reserves, capacity to recover from illness.',
    deep:     'Deep life line — strong constitution, robust energy, long working life.',
    broken:   'Break in life line — a major life pivot or transition (place, occupation, identity).',
    chained:  'Chained life line — periods of stress on the body; care needed in mid-life.',
    forked:   'Forked end on life line — a late-life shift in focus, often toward inner pursuits.',
  },
  head: {
    absent:   'Head line absent — very rare; suggests intuition led over intellect.',
    faint:    'Faint head line — concentration drifts; routines and time-blocking help.',
    clear:    'Clear head line — focused, balanced reasoning.',
    deep:     'Deep head line — sharp, analytical, sometimes too critical.',
    broken:   'Break in head line — a sudden change in mindset or career direction.',
    chained:  'Chained head line — overthinking and worry; meditation rebalances.',
    forked:   'Writer\'s fork on head line — duality of thought, can hold opposing views; suited to writing, law, research.',
  },
  heart: {
    absent:   'Heart line absent — rare; suggests difficulty expressing feeling.',
    faint:    'Faint heart line — guarded emotionally; needs trust before opening.',
    clear:    'Clear heart line — warm, sincere affection.',
    deep:     'Deep heart line — passionate, all-or-nothing in love; possessive when threatened.',
    broken:   'Break in heart line — a major heartbreak followed by reorientation.',
    chained:  'Chained heart line — short-lived attachments, easily moved.',
    forked:   'Forked heart line — balanced love nature; can hold romance and friendship together.',
  },
  fate: {
    absent:   'Fate line absent — self-made path; little inheritance, much improvisation.',
    faint:    'Faint fate line — career direction emerges late.',
    clear:    'Clear fate line — purposeful career trajectory, recognised contribution.',
    deep:     'Deep fate line — strong destiny pull; difficult to escape one\'s calling.',
    broken:   'Break in fate line — career pivot, often leading to a more authentic path.',
    chained:  'Chained fate line — early years of struggle and restart.',
    forked:   'Forked fate line — dual careers or late-life shift to a creative or spiritual second act.',
  },
  sun: {
    absent:   'No Sun line — recognition comes through the work, not the name.',
    faint:    'Faint Sun line — talent recognised in narrow circles.',
    clear:    'Clear Sun line — public esteem, success in creative or visible work.',
    deep:     'Deep Sun line — fame potential; the work outlives the person.',
    broken:   'Broken Sun line — fame followed by quiet, then renewal.',
    chained:  'Chained Sun line — recognition arrives in fits and starts.',
    forked:   'Forked Sun line — multiple talents converge; possible second career in arts.',
  },
  mercury: {
    absent:   'No Mercury line — robust health rarely needing attention.',
    faint:    'Faint Mercury line — track health quietly; minor digestive or nervous patterns.',
    clear:    'Clear Mercury line — business acumen and steady wellbeing.',
    deep:     'Deep Mercury line — strong commercial instincts; possible healing gifts.',
    broken:   'Break in Mercury line — a health or business reset around mid-life.',
    chained:  'Chained Mercury line — episodic ailments tied to stress.',
    forked:   'Forked Mercury line — combine commerce with healing or science.',
  },
  marriage: {
    absent:   'No marriage line — connection seen as friendship-first; partnership may be unconventional or absent.',
    faint:    'Faint marriage line — light bonds rather than legal marriage.',
    clear:    'Clear marriage line — committed, recognised partnership.',
    deep:     'Deep marriage line — strong, central life-partnership.',
    broken:   'Broken marriage line — separation or major partnership crisis.',
    chained:  'Chained marriage line — recurring disagreements, but bond endures.',
    forked:   'Forked end on marriage line — relationship strain late in life.',
  },
};

const MOUNT_READING: Record<string, Record<MountSize, string>> = {
  jupiter:    { flat:'Mount of Jupiter flat — humility may shade into self-doubt.',           normal:'Balanced Jupiter mount — healthy ambition.',                 developed:'Developed Jupiter mount — strong leadership drive, dignity.', 'over-developed':'Over-developed Jupiter mount — pride, risk of arrogance.' },
  saturn:     { flat:'Mount of Saturn flat — light-hearted, dislikes melancholy.',             normal:'Balanced Saturn mount — sober but not heavy.',              developed:'Developed Saturn mount — patience, depth, capacity for solitary mastery.', 'over-developed':'Over-developed Saturn mount — gloom, isolation.' },
  apollo:     { flat:'Mount of Apollo flat — modest creativity, avoids spotlight.',           normal:'Balanced Apollo mount — quiet artistry.',                   developed:'Developed Apollo mount — talent for art, music, performance.', 'over-developed':'Over-developed Apollo mount — vanity, ostentation.' },
  mercury:    { flat:'Mount of Mercury flat — speech kept private; commerce not central.',    normal:'Balanced Mercury mount — clear communication, steady trade.', developed:'Developed Mercury mount — eloquent, business gifts, healing aptitude.', 'over-developed':'Over-developed Mercury mount — risk of cunning, sharp dealing.' },
  venus:      { flat:'Mount of Venus flat — low warmth, ascetic temperament.',                normal:'Balanced Venus mount — affectionate without indulgence.',   developed:'Developed Venus mount — warmth, charm, vitality, love of beauty.', 'over-developed':'Over-developed Venus mount — sensual excess.' },
  mars_lower: { flat:'Lower Mars flat — non-confrontational, peace-keeping.',                  normal:'Balanced lower Mars — measured courage.',                    developed:'Developed lower Mars — physical courage, stamina.', 'over-developed':'Over-developed lower Mars — temper, aggression.' },
  mars_upper: { flat:'Upper Mars flat — yields under pressure.',                                normal:'Balanced upper Mars — moral resilience.',                   developed:'Developed upper Mars — endurance, ability to hold a position.', 'over-developed':'Over-developed upper Mars — combativeness, inflexibility.' },
  moon:       { flat:'Mount of Moon flat — pragmatic, low fantasy.',                            normal:'Balanced Moon mount — healthy imagination.',                developed:'Developed Moon mount — imagination, intuition, love of travel and water.', 'over-developed':'Over-developed Moon mount — moodiness, escapism.' },
  rahu:       { flat:'Rahu mount flat — minor unconventional drives.',                          normal:'Balanced Rahu mount — innovative without rebellion.',       developed:'Developed Rahu mount — boundary-pushing, fame through unconventional means.', 'over-developed':'Over-developed Rahu mount — disruptive instincts, addictions.' },
};

const MARK_READING: Record<Mark, string> = {
  star:     'Star — a sudden, unexpected event; in benefic houses brings recognition, in malefic ones a shock.',
  cross:    'Cross — obstacles or warnings on the related life domain; karma to be worked through.',
  triangle: 'Triangle — protected gift; talent or success in the line\'s domain.',
  square:   'Square — protection; you survive challenges in this domain without lasting harm.',
  island:   'Island — temporary weakness or scandal; passes when the line resumes.',
  grille:   'Grille — confusion, scattering of energy; needs simplification.',
  circle:   'Circle (rare) — on the Sun line: enduring fame; elsewhere often illness.',
  spot:     'Spot — a discrete event affecting the line\'s domain; meaning depends on color and depth (not encoded here).',
};

// ─── Builder ──────────────────────────────────────────────────────────────

function lineSection(input: PalmInput, locale: Locale): { id: string; heading: string; paragraphs: string[] } {
  const paragraphs: string[] = [];
  for (const [name, q] of Object.entries(input.lines)) {
    if (!q) continue;
    const tbl = LINE_READING[name];
    const reading = tbl?.[q];
    if (reading) {
      const lineLabel = p(`palmistry.lineName.${name}`, locale, name[0].toUpperCase() + name.slice(1));
      // Inner reading prose stays English — high-volume content not yet phrasebooked
      paragraphs.push(pf('palmistry.linePara', locale, { line: lineLabel, reading }, ''));
    }
  }
  if (paragraphs.length === 0) {
    paragraphs.push(p('palmistry.fallback.lines', locale, ''));
  }
  return { id: 'lines', heading: p('palmistry.heading.lines', locale, 'Major lines'), paragraphs };
}

function mountSection(input: PalmInput, locale: Locale): { id: string; heading: string; paragraphs: string[] } {
  const paragraphs: string[] = [];
  for (const [name, sz] of Object.entries(input.mounts ?? {})) {
    if (!sz) continue;
    const tbl = MOUNT_READING[name];
    const reading = tbl?.[sz];
    if (reading) paragraphs.push(reading);
  }
  if (paragraphs.length === 0) paragraphs.push(p('palmistry.fallback.mounts', locale, ''));
  return { id: 'mounts', heading: p('palmistry.heading.mounts', locale, 'Mounts'), paragraphs };
}

function marksSection(input: PalmInput, locale: Locale): { id: string; heading: string; paragraphs: string[] } {
  const paragraphs: string[] = [];
  for (const m of input.marks ?? []) {
    const markLabel = p(`palmistry.markName.${m.mark}`, locale, m.mark);
    const lineLabel = p(`palmistry.lineName.${m.line}`, locale, m.line);
    paragraphs.push(pf('palmistry.markPara', locale, { mark: markLabel, line: lineLabel, reading: MARK_READING[m.mark] }, ''));
  }
  if (paragraphs.length === 0) paragraphs.push(p('palmistry.fallback.marks', locale, ''));
  return { id: 'marks', heading: p('palmistry.heading.marks', locale, 'Special marks'), paragraphs };
}

function fingersSection(input: PalmInput, locale: Locale): { id: string; heading: string; paragraphs: string[] } {
  const paragraphs: string[] = [THUMB_READING[input.thumb]];
  for (const [name, len] of Object.entries(input.fingers)) {
    if (!len) continue;
    const reading = FINGER_LENGTH[len]?.[name];
    if (reading) paragraphs.push(reading);
  }
  return { id: 'fingers', heading: p('palmistry.heading.fingers', locale, 'Thumb & fingers'), paragraphs };
}

export function readPalm(input: PalmInput, locale: Locale = 'en'): PalmistryReading {
  const handReading = HAND_SHAPE_READING[input.handShape];
  const localizedTheme  = p(`palmistry.shape.${input.handShape}.theme`,  locale, handReading.theme);
  const localizedTraits = p(`palmistry.shape.${input.handShape}.traits`, locale, handReading.traits);

  const sections = [
    {
      id: 'shape',
      heading: p('palmistry.heading.shape', locale, 'Hand shape'),
      paragraphs: [`${localizedTheme}. ${localizedTraits}`],
    },
    fingersSection(input, locale),
    lineSection(input, locale),
    mountSection(input, locale),
    marksSection(input, locale),
  ];

  const handLabel = p(`palmistry.hand.${input.dominantHand}`, locale, input.dominantHand);
  const opening = localizedTraits.split(/[;.।]/)[0]?.trim() ?? '';
  const summary = pf('palmistry.summary', locale, { hand: handLabel, theme: localizedTheme, opening }, '');

  // Highlights: any deep / forked main line (kept English — short labels)
  const highlights: string[] = [];
  for (const [name, q] of Object.entries(input.lines)) {
    if (q === 'deep' || q === 'forked') highlights.push(`${name} line is ${q}`);
  }
  if (input.marks && input.marks.length > 0) {
    highlights.push(`${input.marks.length} special mark${input.marks.length === 1 ? '' : 's'}`);
  }

  const notes = [
    p('palmistry.notes.0', locale, ''),
    p('palmistry.notes.1', locale, ''),
  ];

  return { summary, sections, highlights, notes };
}
