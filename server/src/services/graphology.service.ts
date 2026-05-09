// Phase 19 — Graphology (handwriting analysis).
//
// The user supplies categorical observations about their handwriting
// (slant, pressure, size, spacing, baseline, letter forms, t-bar, i-dot,
// signature). We map each feature to its classical graphological
// interpretation and compose a Big-Five-style personality summary.

export type Slant     = 'left' | 'vertical' | 'right' | 'variable';
export type Pressure  = 'light' | 'medium' | 'heavy' | 'variable';
export type Size      = 'small' | 'medium' | 'large';
export type Spacing   = 'tight' | 'even' | 'wide';
export type Baseline  = 'rising' | 'level' | 'falling' | 'wavy';
export type Loop      = 'absent' | 'narrow' | 'rounded' | 'exaggerated';
export type TbarCross = 'low' | 'middle' | 'high' | 'absent';
export type IDot      = 'omitted' | 'precise' | 'high' | 'circle' | 'stroke';
export type Signature = 'matches' | 'larger' | 'smaller' | 'illegible' | 'underlined';

export interface GraphologyInput {
  slant: Slant;
  pressure: Pressure;
  size: Size;
  spacing: Spacing;
  baseline: Baseline;
  upperLoops?: Loop;    // l, h, b, k — intellect / aspiration
  lowerLoops?: Loop;    // g, y, p — physical / material drive
  tbar?: TbarCross;
  idot?: IDot;
  signature?: Signature;
  connected?: 'connected' | 'disconnected' | 'mixed';
}

export interface GraphologyReading {
  summary: string;
  bigFive: {
    openness: number;          // 0..100
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    stability: number;
  };
  sections: { id: string; heading: string; paragraphs: string[] }[];
  flags: string[];
}

// ─── Interpretation tables ─────────────────────────────────────────────────

const SLANT: Record<Slant, { read: string; e: number; a: number; s: number }> = {
  left:     { read: 'Leftward slant — reserved, self-protective, past-oriented; may resist being "read" by others.',      e: -20, a: -5, s:   0 },
  vertical: { read: 'Vertical slant — self-controlled, independent, head over heart.',                                     e:   0, a:  0, s:  10 },
  right:    { read: 'Rightward slant — outgoing, emotionally forward, future-oriented.',                                   e:  25, a: 10, s:   0 },
  variable: { read: 'Variable slant — mood-driven; emotions swing with context.',                                           e:   5, a:  0, s: -15 },
};

const PRESSURE: Record<Pressure, { read: string; o: number; c: number; s: number }> = {
  light:    { read: 'Light pressure — sensitive, gentle, conflict-averse; ideas held lightly.',                            o:  10, c:  -5, s:  -5 },
  medium:   { read: 'Medium pressure — balanced engagement; steady energy.',                                                o:   0, c:  10, s:  10 },
  heavy:    { read: 'Heavy pressure — deep feeling, stubborn commitments, physical vitality.',                              o:  -5, c:  10, s:   0 },
  variable: { read: 'Variable pressure — mood-dependent energy; mental or emotional shifts.',                               o:  10, c: -10, s: -10 },
};

const SIZE: Record<Size, { read: string; e: number; o: number }> = {
  small:  { read: 'Small writing — concentration, modesty, detail-focused; can withdraw under stress.',                     e: -10, o: -5 },
  medium: { read: 'Medium writing — balanced self-presentation.',                                                            e:   0, o:  0 },
  large:  { read: 'Large writing — expressive, confident, wants to be seen; broad-strokes thinker.',                        e:  20, o: 10 },
};

const SPACING: Record<Spacing, { read: string; e: number; a: number }> = {
  tight: { read: 'Tight spacing — closeness to others; may crowd social space.',           e:  10, a:   5 },
  even:  { read: 'Even spacing — respect for others\' space; clear social boundaries.',    e:   0, a:  10 },
  wide:  { read: 'Wide spacing — needs room; independent, reflective.',                     e: -10, a:   0 },
};

const BASELINE: Record<Baseline, { read: string; s: number }> = {
  rising:  { read: 'Rising baseline — optimism, ambition, energy rising through the work.',     s:  15 },
  level:   { read: 'Level baseline — emotional stability and disciplined focus.',                 s:  20 },
  falling: { read: 'Falling baseline — fatigue, low mood, or temporary discouragement.',          s: -20 },
  wavy:    { read: 'Wavy baseline — oscillating mood; variable concentration.',                   s: -10 },
};

const TBAR: Record<TbarCross, string> = {
  low:     'Low t-bar — modest self-esteem; work harder to recognise your own achievements.',
  middle:  'Mid t-bar — balanced self-regard.',
  high:    'High t-bar — lofty goals, aspiration; bias toward idealism.',
  absent:  'Missing t-bar — distracted or hurried mind; attention drifts to the next task.',
};

const IDOT: Record<IDot, string> = {
  omitted:  'Omitted i-dot — details left unfinished; recurring in rushed moments.',
  precise:  'Precise i-dot — attention to detail, disciplined execution.',
  high:     'Floating i-dot — imagination, big-picture ideation.',
  circle:   'Circle i-dot — individuality, creative signal, youth of spirit.',
  stroke:   'Slash i-dot — impatience, decisive temper.',
};

const LOOP: Record<Loop, string> = {
  absent:      'Loops absent — preference for economy; mind or body kept on a tight rein.',
  narrow:      'Narrow loops — guarded feelings or constrained imagination.',
  rounded:     'Rounded loops — healthy imagination and physical vitality.',
  exaggerated: 'Exaggerated loops — desire to be seen; fantasy or enthusiasm may outrun execution.',
};

const SIGNATURE: Record<Signature, string> = {
  matches:    'Signature matches body handwriting — congruence between private and public self.',
  larger:     'Signature larger than body text — public confidence exceeds private self-image; showing up for attention.',
  smaller:    'Signature smaller than body text — private self is bigger than the public projection; hidden depth.',
  illegible:  'Illegible signature — reserve, privacy, sometimes protective obfuscation.',
  underlined: 'Underlined signature — strong self-assertion; important to be remembered.',
};

const CONNECTED: Record<'connected' | 'disconnected' | 'mixed', { read: string; o: number; c: number }> = {
  connected:    { read: 'Connected letters — systematic reasoning; logical, step-by-step thinking.', o:  -5, c: 10 },
  disconnected: { read: 'Disconnected letters — intuitive leaps; sees patterns before articulating them.', o:  15, c: -5 },
  mixed:        { read: 'Mixed connection — adaptive thinker; blends logic with intuition.', o:  10, c:  5 },
};

// ─── Builder ───────────────────────────────────────────────────────────────

import { Locale, p, pf } from '../i18n';

function clamp(n: number): number { return Math.max(0, Math.min(100, n)); }

export function readGraphology(input: GraphologyInput, locale: Locale = 'en'): GraphologyReading {
  // Base scores = 50 (neutral)
  let openness = 50, conscientiousness = 50, extraversion = 50, agreeableness = 50, stability = 50;

  const sl = SLANT[input.slant];          extraversion += sl.e; agreeableness += sl.a; stability += sl.s;
  const pr = PRESSURE[input.pressure];    openness      += pr.o; conscientiousness += pr.c; stability += pr.s;
  const sz = SIZE[input.size];            extraversion += sz.e; openness      += sz.o;
  const sp = SPACING[input.spacing];      extraversion += sp.e; agreeableness += sp.a;
  const bl = BASELINE[input.baseline];    stability     += bl.s;

  if (input.connected && CONNECTED[input.connected]) {
    const c = CONNECTED[input.connected];
    openness += c.o;  conscientiousness += c.c;
  }

  // Paragraphs
  const paragraphs: string[] = [];
  paragraphs.push(sl.read);
  paragraphs.push(pr.read);
  paragraphs.push(sz.read);
  paragraphs.push(sp.read);
  paragraphs.push(bl.read);
  if (input.upperLoops) paragraphs.push(`Upper loops (aspiration, intellect): ${LOOP[input.upperLoops]}`);
  if (input.lowerLoops) paragraphs.push(`Lower loops (material, physical drive): ${LOOP[input.lowerLoops]}`);
  if (input.tbar)       paragraphs.push(`T-bar: ${TBAR[input.tbar]}`);
  if (input.idot)       paragraphs.push(`I-dot: ${IDOT[input.idot]}`);
  if (input.connected)  paragraphs.push(CONNECTED[input.connected].read);
  if (input.signature)  paragraphs.push(`Signature: ${SIGNATURE[input.signature]}`);

  const bigFive = {
    openness:          clamp(openness),
    conscientiousness: clamp(conscientiousness),
    extraversion:      clamp(extraversion),
    agreeableness:     clamp(agreeableness),
    stability:         clamp(stability),
  };

  const flags: string[] = [];
  if (bigFive.stability < 35) flags.push('Low stability signal — stress-management support recommended.');
  if (bigFive.extraversion > 75) flags.push('Strong extraverted expression — energised by social engagement.');
  if (bigFive.extraversion < 30) flags.push('Strong introverted expression — energised by solitude.');
  if (bigFive.conscientiousness > 75) flags.push('Strong conscientiousness — organised, reliable, goal-directed.');
  if (bigFive.openness > 75) flags.push('Strong openness — curious, imaginative, bias toward new experience.');

  const featureCount = paragraphs.length;
  const localizedSummary = pf('graphology.summary', locale,
    { n: featureCount, plural: featureCount === 1 ? '' : 's' }, '');
  // Inner Big-Five details follow the localized one-liner
  const summary = `${localizedSummary} ` +
    `Five-factor profile: O ${bigFive.openness}, C ${bigFive.conscientiousness}, ` +
    `E ${bigFive.extraversion}, A ${bigFive.agreeableness}, S ${bigFive.stability}.`;

  const sections = [
    { id: 'strokes', heading: p('graphology.heading.traits',  locale, 'Stroke characteristics'), paragraphs: paragraphs.slice(0, 5) },
    { id: 'letters', heading: p('graphology.heading.summary', locale, 'Letter forms'),           paragraphs: paragraphs.slice(5) },
  ];

  return { summary, bigFive, sections, flags };
}
