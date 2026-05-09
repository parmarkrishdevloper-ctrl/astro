// Searchable knowledge base of classical text references.
// Each entry: text source + chapter/sloka + topic + English gist.
// Used by the interpretation engine to cite authority on every claim.
//
// Use `findRefs(tags, locale)` to obtain refs with `topic` and `text`
// localized per the requested locale (en / hi / gu / sa); the underlying
// `CLASSICAL_REFS` constant remains in English for legacy callers.

import { Locale, p } from '../i18n';

export interface ClassicalRef {
  id: string;
  source: 'BPHS' | 'Saravali' | 'Hora Sara' | 'Garga Hora' | 'Phaladeepika' | 'Jataka Parijata';
  chapter: string;
  sloka?: string;
  topic: string;
  text: string;
  tags: string[];
}

/** Tags that have a human-facing display form (vs. functional codes
 *  like 'SU' / 'house4' which the engine handles via al.* helpers). */
const DISPLAY_TAGS = new Set([
  'career', 'dhana', 'kendra', 'mahapurusha', 'gajakesari', 'budhaditya',
]);

function localizeTag(tag: string, locale: Locale): string {
  if (DISPLAY_TAGS.has(tag)) {
    return p(`classicalRef.tag.${tag}`, locale, tag);
  }
  return tag;
}

function localizeRef(r: ClassicalRef, locale: Locale): ClassicalRef {
  return {
    ...r,
    topic: p(`classicalRef.${r.id}.topic`, locale, r.topic),
    text:  p(`classicalRef.${r.id}.text`,  locale, r.text),
    tags:  r.tags.map((t) => localizeTag(t, locale)),
  };
}

export const CLASSICAL_REFS: ClassicalRef[] = [
  {
    id: 'bphs.24.15',
    source: 'BPHS',
    chapter: '24',
    sloka: '15',
    topic: 'Sun in 10th house',
    text: 'A person born with the Sun in the 10th house obtains great government favor, high status, and respect from authority.',
    tags: ['SU', 'house10', 'career'],
  },
  {
    id: 'bphs.24.20',
    source: 'BPHS',
    chapter: '24',
    sloka: '20',
    topic: 'Moon in 4th house',
    text: 'The Moon in the 4th house bestows happiness, mother\'s love, vehicles, property and a peaceful home life.',
    tags: ['MO', 'house4'],
  },
  {
    id: 'bphs.36.5',
    source: 'BPHS',
    chapter: '36',
    sloka: '5',
    topic: 'Ruchaka Mahapurusha Yoga',
    text: 'Mars in own sign or exalted, placed in a kendra, forms Ruchaka — produces a fearless leader, wealthy and famous.',
    tags: ['MA', 'mahapurusha', 'kendra'],
  },
  {
    id: 'saravali.33.8',
    source: 'Saravali',
    chapter: '33',
    sloka: '8',
    topic: 'Gajakesari Yoga',
    text: 'When Jupiter occupies a kendra from the Moon, Gajakesari Yoga is formed — the native is respected by kings and learned men.',
    tags: ['JU', 'MO', 'gajakesari'],
  },
  {
    id: 'phaladeepika.6.4',
    source: 'Phaladeepika',
    chapter: '6',
    sloka: '4',
    topic: 'Lakshmi Yoga (5th lord in 9th)',
    text: 'When the lord of the 5th house occupies the 9th, the native enjoys wealth, blessings of Lakshmi, and progeny.',
    tags: ['l5', 'house9', 'dhana'],
  },
  {
    id: 'horasara.7.2',
    source: 'Hora Sara',
    chapter: '7',
    sloka: '2',
    topic: 'Budhaditya Yoga',
    text: 'Sun and Mercury together in any house create Budhaditya — sharp intellect, learning, and skill in speech.',
    tags: ['SU', 'ME', 'budhaditya'],
  },
];

/** Find references whose tags include any of the given tags.
 *  When `locale` is provided (default: 'en'), each returned ref has its
 *  `topic`, `text`, and human-facing `tags` localized via the phrasebook.
 *  Functional tag codes (planet IDs, `houseN`, `lN`, `signN`) pass through
 *  unchanged so the engine can keep matching on them.
 */
export function findRefs(tags: string[], locale: Locale = 'en'): ClassicalRef[] {
  const matched = CLASSICAL_REFS.filter((r) => r.tags.some((t) => tags.includes(t)));
  if (locale === 'en') return matched;
  return matched.map((r) => localizeRef(r, locale));
}
