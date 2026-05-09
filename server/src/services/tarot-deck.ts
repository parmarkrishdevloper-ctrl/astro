// Phase 19 — Tarot deck (78 cards).
//
// Minimal keyword-level data per card; enough to compose reading paragraphs.

export type Suit = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
export interface TarotCard {
  id: number;           // 0-77
  name: string;
  suit: Suit;
  upright: string;
  reversed: string;
  element?: 'fire' | 'water' | 'air' | 'earth';
  keywords: string[];
}

const MAJOR: TarotCard[] = [
  { id: 0,  name: 'The Fool',            suit: 'major', upright: 'new beginnings, innocence, leap of faith', reversed: 'recklessness, naivety, foolish risk',      keywords: ['beginnings','risk','potential'] },
  { id: 1,  name: 'The Magician',        suit: 'major', upright: 'willpower, manifestation, mastery',         reversed: 'manipulation, untapped potential',         keywords: ['will','skill','focus'] },
  { id: 2,  name: 'The High Priestess',  suit: 'major', upright: 'intuition, sacred knowledge, inner voice',  reversed: 'secrets, disconnection from intuition',    keywords: ['intuition','mystery','subconscious'] },
  { id: 3,  name: 'The Empress',         suit: 'major', upright: 'abundance, fertility, nurturing',           reversed: 'dependence, smothering, creative block',   keywords: ['abundance','nurture','creation'] },
  { id: 4,  name: 'The Emperor',         suit: 'major', upright: 'authority, structure, leadership',          reversed: 'tyranny, rigidity, domination',            keywords: ['authority','structure'] },
  { id: 5,  name: 'The Hierophant',      suit: 'major', upright: 'tradition, teaching, spiritual guidance',   reversed: 'rebellion, unconventional, dogma',         keywords: ['tradition','teaching'] },
  { id: 6,  name: 'The Lovers',          suit: 'major', upright: 'union, choice, values alignment',           reversed: 'disharmony, misaligned values',            keywords: ['love','choice'] },
  { id: 7,  name: 'The Chariot',         suit: 'major', upright: 'determination, victory, willpower',         reversed: 'lack of direction, obstacles',             keywords: ['drive','victory'] },
  { id: 8,  name: 'Strength',            suit: 'major', upright: 'courage, inner strength, compassion',       reversed: 'self-doubt, weakness, low confidence',     keywords: ['courage','composure'] },
  { id: 9,  name: 'The Hermit',          suit: 'major', upright: 'solitude, introspection, inner guidance',   reversed: 'isolation, withdrawal, loneliness',        keywords: ['solitude','wisdom'] },
  { id:10,  name: 'Wheel of Fortune',    suit: 'major', upright: 'cycles, turning point, destiny',            reversed: 'bad luck, resistance to change',           keywords: ['cycles','fate'] },
  { id:11,  name: 'Justice',             suit: 'major', upright: 'truth, fairness, cause and effect',         reversed: 'injustice, bias, dishonesty',              keywords: ['truth','fairness'] },
  { id:12,  name: 'The Hanged Man',      suit: 'major', upright: 'surrender, new perspective, pause',         reversed: 'stalling, sacrifice without purpose',      keywords: ['surrender','pause'] },
  { id:13,  name: 'Death',               suit: 'major', upright: 'endings, transformation, rebirth',          reversed: 'resistance to change, stagnation',         keywords: ['ending','rebirth'] },
  { id:14,  name: 'Temperance',          suit: 'major', upright: 'balance, moderation, synthesis',            reversed: 'excess, imbalance, discord',               keywords: ['balance','synthesis'] },
  { id:15,  name: 'The Devil',           suit: 'major', upright: 'shadow, attachment, materialism',           reversed: 'breaking chains, liberation',              keywords: ['bondage','shadow'] },
  { id:16,  name: 'The Tower',           suit: 'major', upright: 'sudden upheaval, revelation, awakening',    reversed: 'avoidance of upheaval, disaster averted',  keywords: ['upheaval','revelation'] },
  { id:17,  name: 'The Star',            suit: 'major', upright: 'hope, inspiration, healing',                reversed: 'despair, loss of faith',                   keywords: ['hope','healing'] },
  { id:18,  name: 'The Moon',            suit: 'major', upright: 'illusion, intuition, subconscious',         reversed: 'fear released, clarity returning',         keywords: ['illusion','intuition'] },
  { id:19,  name: 'The Sun',             suit: 'major', upright: 'joy, success, vitality',                    reversed: 'temporary sadness, blocked joy',           keywords: ['joy','success'] },
  { id:20,  name: 'Judgement',           suit: 'major', upright: 'reckoning, rebirth, absolution',            reversed: 'self-doubt, refusal to reckon',            keywords: ['reckoning','rebirth'] },
  { id:21,  name: 'The World',           suit: 'major', upright: 'completion, wholeness, accomplishment',     reversed: 'incompletion, shortcut taken',             keywords: ['completion','wholeness'] },
];

// ─── Minor arcana ─────────────────────────────────────────────────────────
const MINOR_NAMES = [
  'Ace','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
  'Page','Knight','Queen','King',
];

const MINOR_MEANINGS: Record<Suit, { upright: string[]; reversed: string[] }> = {
  major: { upright: [], reversed: [] },
  wands: {
    upright: [
      'inspiration, new passion, creative spark',
      'planning, personal power, choices',
      'expansion, foresight, early success',
      'celebration, harmony, home',
      'conflict, competition, scrappy win',
      'victory, public recognition, progress',
      'defence, perseverance, maintaining ground',
      'swift action, momentum, messages',
      'resilience, last stand, test of will',
      'burden, responsibility, over-commitment',
      'curious apprentice, message of passion, bold beginnings',
      'adventurous action-taker, impulsive mover',
      'warm confidence, creative leader, generous',
      'visionary leader, entrepreneur, decisive',
    ],
    reversed: [
      'blocked creativity, delays',
      'indecision, lack of planning',
      'delays, obstacles, lack of foresight',
      'trouble at home, broken celebration',
      'avoiding conflict, internal battle',
      'ego trouble, fall from status',
      'giving up, overwhelmed',
      'slowdown, frustration, wait',
      'paranoia, exhaustion',
      'release of burden, delegation',
      'scattered enthusiasm, bad news',
      'reckless, impatient',
      'insecurity, demanding',
      'tyrannical, impulsive',
    ],
  },
  cups: {
    upright: [
      'new love, emotional beginning, spiritual gift',
      'partnership, mutual respect, union',
      'celebration, friendship, community',
      'apathy, meditation, reconsideration',
      'grief, loss, disappointment',
      'nostalgia, childhood, reunion',
      'choices, fantasy, illusion',
      'walking away, seeking deeper truth',
      'contentment, satisfaction, gratitude',
      'emotional fulfilment, family, joy',
      'dreamy artist, gentle messenger, offer of love',
      'romantic idealist, proposal, imaginative action',
      'emotional wisdom, nurturer, counsellor',
      'compassionate leader, wise in feeling, diplomatic',
    ],
    reversed: [
      'emotional block, missed connection',
      'imbalance in partnership',
      'gossip, broken alliance',
      'new motivation, noticing what is offered',
      'acceptance, forgiveness, moving on',
      'stuck in the past, inability to grow up',
      'clarity returning, illusions lifted',
      'return to what was left, avoidance',
      'taking pleasure for granted',
      'disharmony at home, broken family',
      'creative block, bad-news messenger',
      'moody, jealous, emotional manipulation',
      'insecurity, emotionally needy',
      'emotionally manipulative, moody leader',
    ],
  },
  swords: {
    upright: [
      'breakthrough, clarity, truth',
      'stalemate, difficult choice, impasse',
      'heartbreak, sorrow, painful truth',
      'rest, recovery, contemplation',
      'conflict, unfair win, humiliation',
      'transition, moving on, mental peace returning',
      'deception, stealth, strategy',
      'restriction, trapped thinking, self-imposed limits',
      'anxiety, nightmares, worry',
      'defeat, painful ending, rock bottom',
      'curious student, watchful messenger, eager communicator',
      'decisive action, aggressive pursuit, direct speech',
      'independent wisdom, clear-eyed, cuts illusion',
      'authoritative intellect, fair, strict',
    ],
    reversed: [
      'confusion, miscommunication, force misused',
      'indecision, confusion resolving',
      'healing from heartbreak, forgiving',
      'restlessness, burnout, refusing rest',
      'reconciliation, regret',
      'stuck in transit, unresolved baggage',
      'conscience, coming clean',
      'liberation, breaking free',
      'releasing worry, hope returning',
      'survival, painful lesson absorbed',
      'malicious gossip, cynical',
      'reckless, scattered, bullying',
      'cold, cruel, overly judgmental',
      'abuse of power, manipulation',
    ],
  },
  pentacles: {
    upright: [
      'new opportunity, material beginning, prosperity seed',
      'balancing priorities, juggling, adaptability',
      'teamwork, craftsmanship, recognition',
      'security, saving, possessiveness',
      'hardship, poverty, isolation',
      'generosity, charity, giving and receiving',
      'assessment, patience, long-term view',
      'mastery, apprenticeship, dedication',
      'luxury, self-sufficiency, abundance',
      'legacy, inheritance, family wealth',
      'ambitious student, good news about work',
      'reliable worker, steady progress',
      'practical nurturer, resourceful, grounded',
      'wealthy leader, disciplined authority, stability',
    ],
    reversed: [
      'missed opportunity, bad investment',
      'financial disarray, overcommitment',
      'poor teamwork, lack of quality',
      'greed, possessiveness, financial worry',
      'recovery from hardship, spiritual wealth',
      'strings attached, debt',
      'impatience, poor planning',
      'perfectionism, mediocrity',
      'isolation, financial setback',
      'family disputes, lost legacy',
      'lazy, bad news about money',
      'boring, stuck in routine',
      'unbalanced work/home, smothering',
      'corrupt leader, greedy',
    ],
  },
};

export const TAROT_DECK: TarotCard[] = (() => {
  const deck: TarotCard[] = [...MAJOR];
  const suits: Suit[] = ['wands','cups','swords','pentacles'];
  const element: Record<Suit, 'fire' | 'water' | 'air' | 'earth' | undefined> = {
    major: undefined, wands: 'fire', cups: 'water', swords: 'air', pentacles: 'earth',
  };
  let id = 22;
  for (const s of suits) {
    for (let i = 0; i < 14; i++) {
      const ur = MINOR_MEANINGS[s].upright[i];
      const rv = MINOR_MEANINGS[s].reversed[i];
      deck.push({
        id: id++,
        name: `${MINOR_NAMES[i]} of ${s[0].toUpperCase() + s.slice(1)}`,
        suit: s,
        upright: ur,
        reversed: rv,
        element: element[s],
        keywords: ur.split(', ').slice(0, 3),
      });
    }
  }
  return deck;
})();

export const DECK_SIZE = TAROT_DECK.length;
