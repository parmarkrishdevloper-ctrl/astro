// Learning / tutor page.
//
// Four modes switched via tabs:
//   1. Encyclopedia — clickable entries for every planet/rashi/nakshatra/house/karaka
//   2. Classical texts — browseable sloka corpus
//   3. Tutor mode — step-through lessons for your own chart
//   4. Flashcards — memorisation decks
//
// A global search bar cross-searches all three corpora.

import { useEffect, useState } from 'react';
import { Card, PageShell, Pill, EmptyState } from '../components/ui/Card';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput } from '../types';

type Mode = 'encyclopedia' | 'texts' | 'tutor' | 'flashcards';

export function LearnPage() {
  const { t } = useT();
  const [mode, setMode] = useState<Mode>('encyclopedia');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) { setSearchResults(null); return; }
    const tm = setTimeout(async () => {
      const r = await api.learnSearch(query);
      setSearchResults(r.results);
    }, 300);
    return () => clearTimeout(tm);
  }, [query]);

  return (
    <PageShell title={t('learn.title', 'Learning')} subtitle={t('learn.subtitle', 'Encyclopedia, classical texts, tutor mode for your own chart, flashcards.')}>
      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-3">
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder={t('learn.searchPlaceholder', 'Search everything — planet, nakshatra, yoga, sloka…')}
              className="flex-1 rounded border border-vedicGold/40 px-3 py-2 text-sm" />
            <div className="flex gap-1 text-[11px]">
              {(['encyclopedia','texts','tutor','flashcards'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-3 py-1.5 rounded border text-xs ${mode === m
                    ? 'bg-vedicMaroon text-white border-vedicMaroon'
                    : 'bg-white text-vedicMaroon border-vedicGold/40 hover:bg-parchment'}`}>
                  {t(`learn.${m}`, m)}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {searchResults && <SearchResults r={searchResults} />}

        {!searchResults && mode === 'encyclopedia' && <EncyclopediaView />}
        {!searchResults && mode === 'texts'        && <TextsView />}
        {!searchResults && mode === 'tutor'        && <TutorView />}
        {!searchResults && mode === 'flashcards'   && <FlashcardsView />}
      </div>
    </PageShell>
  );
}

// ─── Search results ────────────────────────────────────────────────────────
function SearchResults({ r }: { r: any }) {
  const { t } = useT();
  const noMatch = t('learn.search.noMatches', 'no matches');
  return (
    <Card title={t('learn.searchHits', 'Search hits — {ency} encyclopedia · {sl} slokas · {yo} yogas')
      .replace('{ency}', String(r.encyclopedia.length))
      .replace('{sl}', String(r.slokas.length))
      .replace('{yo}', String(r.yogas.length))}>
      <div className="grid md:grid-cols-3 gap-4 text-xs">
        <div>
          <h4 className="text-vedicMaroon font-semibold mb-2 uppercase text-[10px] tracking-wider">{t('learn.search.encyclopedia', 'Encyclopedia')}</h4>
          <ul className="space-y-2">
            {r.encyclopedia.map((e: any) => (
              <li key={e.id} className="border border-vedicGold/20 rounded p-2 bg-white/60">
                {/* name + oneliner are now server-localized; kind is a functional code */}
                <div className="font-bold text-vedicMaroon">{e.name}</div>
                <Pill tone="neutral"><span lang="en">{e.kind}</span></Pill>
                <div className="text-[11px] text-vedicMaroon/70 mt-1">{e.oneliner}</div>
              </li>
            ))}
            {r.encyclopedia.length === 0 && <li className="text-vedicMaroon/50 italic">{noMatch}</li>}
          </ul>
        </div>
        <div>
          <h4 className="text-vedicMaroon font-semibold mb-2 uppercase text-[10px] tracking-wider">{t('learn.search.slokas', 'Slokas')}</h4>
          <ul className="space-y-2">
            {r.slokas.map((s: any) => (
              <li key={s.id} className="border border-vedicGold/20 rounded p-2 bg-white/60">
                {/* TODO(i18n-server): localize sloka english/source */}
                <div className="text-vedicMaroon/90" lang="en">{s.english}</div>
                <div className="text-[11px] text-vedicMaroon/50 mt-1" lang="en">{s.source}</div>
              </li>
            ))}
            {r.slokas.length === 0 && <li className="text-vedicMaroon/50 italic">{noMatch}</li>}
          </ul>
        </div>
        <div>
          <h4 className="text-vedicMaroon font-semibold mb-2 uppercase text-[10px] tracking-wider">{t('learn.search.yogas', 'Yogas')}</h4>
          <ul className="space-y-2">
            {r.yogas.map((y: any) => (
              <li key={y.id} className="border border-vedicGold/20 rounded p-2 bg-white/60">
                {/* TODO(i18n-server): localize yoga name/effect */}
                <div className="font-bold text-vedicMaroon" lang="en">{y.name}</div>
                <div className="text-[11px] text-vedicMaroon/70 mt-1" lang="en">{y.effect}</div>
              </li>
            ))}
            {r.yogas.length === 0 && <li className="text-vedicMaroon/50 italic">{noMatch}</li>}
          </ul>
        </div>
      </div>
    </Card>
  );
}

// ─── Encyclopedia ──────────────────────────────────────────────────────────
function EncyclopediaView() {
  const { t } = useT();
  const [kind, setKind] = useState<string>('planet');
  const [entries, setEntries] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    api.encyclopedia(kind).then((r) => { setEntries(r.entries); setSelected(r.entries[0] ?? null); });
  }, [kind]);

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-4">
      <Card>
        <select value={kind} onChange={(e) => setKind(e.target.value)}
          className="w-full rounded border border-vedicGold/40 px-2 py-1.5 text-sm bg-white mb-3">
          <option value="planet">{t('learn.encKind.planet', 'Planets (9)')}</option>
          <option value="rashi">{t('learn.encKind.rashi', 'Rashis (12)')}</option>
          <option value="nakshatra">{t('learn.encKind.nakshatra', 'Nakshatras (27)')}</option>
          <option value="house">{t('learn.encKind.house', 'Houses (12)')}</option>
          <option value="karaka">{t('learn.encKind.karaka', 'Karakas (7)')}</option>
        </select>
        <ul className="space-y-1 max-h-[70vh] overflow-y-auto">
          {entries.map((e) => (
            <li key={e.id}>
              <button onClick={() => setSelected(e)}
                className={`w-full text-left px-2 py-1.5 rounded text-xs ${
                  selected?.id === e.id
                    ? 'bg-vedicMaroon text-white'
                    : 'bg-white hover:bg-parchment text-vedicMaroon'
                }`}>
                <span className="font-semibold">{e.name}</span>
                {e.sanskrit && <span className="opacity-70 ml-2">{e.sanskrit}</span>}
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        {!selected && <EmptyState>{t('learn.pickEntry', 'Pick an entry on the left.')}</EmptyState>}
        {selected && (
          <div>
            <div className="flex items-baseline gap-3 mb-2">
              {/* name + oneliner are now server-localized; description / keywords /
                   meta / source are deferred (deeper prose & functional refs) */}
              <h3 className="text-xl font-bold text-vedicMaroon">{selected.name}</h3>
              {selected.sanskrit && <span className="text-vedicMaroon/60 text-sm font-devanagari">{selected.sanskrit}</span>}
              <Pill tone="neutral"><span lang="en">{selected.kind}</span></Pill>
            </div>
            <p className="text-sm text-vedicMaroon/90 italic">{selected.oneliner}</p>
            <p className="text-sm text-vedicMaroon/80 mt-3" lang="en">{selected.description}</p>
            {selected.meta && Object.keys(selected.meta).length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {Object.entries(selected.meta).map(([k, v]) => (
                  <div key={k} className="rounded bg-parchment/60 px-2 py-1 border border-vedicGold/30">
                    <span className="text-vedicMaroon/50" lang="en">{k}:</span> <strong className="text-vedicMaroon" lang="en">{String(v)}</strong>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-1">
              {selected.keywords.map((k: string) => <Pill key={k} tone="neutral"><span lang="en">{k}</span></Pill>)}
            </div>
            {selected.source && <p className="mt-3 text-[11px] text-vedicMaroon/50 italic" lang="en">{selected.source}</p>}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Classical texts ───────────────────────────────────────────────────────
function TextsView() {
  const { t } = useT();
  const [topic, setTopic] = useState<string>('');
  const [slokas, setSlokas] = useState<any[]>([]);

  useEffect(() => {
    api.slokas(topic || undefined).then((r) => setSlokas(r.slokas));
  }, [topic]);

  const topics = ['mahapurusha','lunar','raja','dhana','jaimini','houses','arishta'];
  return (
    <Card title={t('learn.classicalSlokas', 'Classical slokas — {n}').replace('{n}', String(slokas.length))}>
      <div className="flex gap-1 text-xs mb-3 flex-wrap">
        <button onClick={() => setTopic('')}
          className={`px-2 py-1 rounded border ${topic === '' ? 'bg-vedicMaroon text-white border-vedicMaroon' : 'bg-white border-vedicGold/40 text-vedicMaroon hover:bg-parchment'}`}>
          {t('learn.topicAll', 'all')}
        </button>
        {topics.map((tp) => (
          <button key={tp} onClick={() => setTopic(tp)}
            className={`px-2 py-1 rounded border ${topic === tp ? 'bg-vedicMaroon text-white border-vedicMaroon' : 'bg-white border-vedicGold/40 text-vedicMaroon hover:bg-parchment'}`}>
            {t(`learn.topic.${tp}`, tp)}
          </button>
        ))}
      </div>
      <ul className="space-y-3">
        {slokas.map((s) => (
          <li key={s.id} className="border border-vedicGold/30 rounded p-3 bg-parchment/40">
            <div className="font-devanagari text-base text-vedicMaroon">{s.text}</div>
            {s.translit && <div className="text-xs italic text-vedicMaroon/60 mt-1">{s.translit}</div>}
            {/* TODO(i18n-server): localize sloka english/source */}
            <div className="text-sm text-vedicMaroon/90 mt-2" lang="en">{s.english}</div>
            <div className="text-[11px] text-vedicMaroon/50 mt-1" lang="en">{s.source}</div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ─── Tutor view ────────────────────────────────────────────────────────────
function TutorView() {
  const { t } = useT();
  const [lessons, setLessons] = useState<any[]>([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  async function submit(input: BirthInput) {
    setLoading(true);
    try {
      const r = await api.tutor(input);
      setLessons(r.lessons);
      setStep(0);
    } finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-4">
      <BirthDetailsForm onSubmit={submit} loading={loading} />
      <Card>
        {lessons.length === 0 && <EmptyState>{t('learn.tutorEmpty', 'Enter birth details to receive a tutor walkthrough of your chart.')}</EmptyState>}
        {lessons.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] text-vedicMaroon/60">{t('learn.tutorStep', 'Step {n} of {total}').replace('{n}', String(step + 1)).replace('{total}', String(lessons.length))}</div>
              <div className="flex gap-1">
                <button disabled={step === 0} onClick={() => setStep(step - 1)}
                  className="px-3 py-1 text-xs rounded border border-vedicGold/40 bg-white disabled:opacity-40 text-vedicMaroon hover:bg-parchment">{t('learn.tutorPrev', '← prev')}</button>
                <button disabled={step === lessons.length - 1} onClick={() => setStep(step + 1)}
                  className="px-3 py-1 text-xs rounded border border-vedicGold/40 bg-white disabled:opacity-40 text-vedicMaroon hover:bg-parchment">{t('learn.tutorNext', 'next →')}</button>
              </div>
            </div>
            {/* TODO(i18n-server): localize tutor lesson heading/narrative */}
            <h3 className="text-xl font-bold text-vedicMaroon mb-2" lang="en">{lessons[step].heading}</h3>
            <p className="text-sm text-vedicMaroon/90 leading-relaxed whitespace-pre-wrap" lang="en">{lessons[step].narrative}</p>
            {lessons[step].highlight && (
              <div className="mt-3 text-[11px]">
                <Pill tone="neutral">{t('learn.tutorFocus', 'focus')} · {lessons[step].highlight.kind} · {lessons[step].highlight.id}</Pill>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Flashcards ────────────────────────────────────────────────────────────
function FlashcardsView() {
  const { t } = useT();
  const [topic, setTopic] = useState('nakshatras');
  const [cards, setCards] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    api.flashcards(topic).then((r) => { setCards(r.cards); setIdx(0); setFlipped(false); });
  }, [topic]);

  if (cards.length === 0) return <EmptyState>{t('learn.flashcardLoading', 'Loading flashcards…')}</EmptyState>;
  const card = cards[idx];
  return (
    <Card title={t('learn.flashcardTitle', 'Flashcards — {topic} ({n} / {total})')
      .replace('{topic}', t(`learn.flashcardTopic.${topic}`, topic))
      .replace('{n}', String(idx + 1))
      .replace('{total}', String(cards.length))}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-1 text-xs flex-wrap">
          {['nakshatras','rashis','planets','houses','karakas'].map((tp) => (
            <button key={tp} onClick={() => setTopic(tp)}
              className={`px-2 py-1 rounded border ${topic === tp ? 'bg-vedicMaroon text-white border-vedicMaroon' : 'bg-white border-vedicGold/40 text-vedicMaroon hover:bg-parchment'}`}>
              {t(`learn.flashcardTopic.${tp}`, tp)}
            </button>
          ))}
        </div>
      </div>
      <div onClick={() => setFlipped(!flipped)}
        className="cursor-pointer border border-vedicGold/40 rounded-lg bg-parchment/50 min-h-[200px] p-6 flex items-center justify-center text-center hover:bg-parchment/80 transition-colors">
        {!flipped ? (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-vedicMaroon/50 mb-2">{t('learn.flashcardTap', 'Tap to reveal')}</div>
            {/* TODO(i18n-server): localize flashcard front/back content */}
            <div className="text-xl font-semibold text-vedicMaroon" lang="en">{card.front}</div>
          </div>
        ) : (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-emerald-700 mb-2">{t('learn.flashcardAnswer', 'Answer')}</div>
            <div className="text-sm text-vedicMaroon/90" lang="en">{card.back}</div>
          </div>
        )}
      </div>
      <div className="flex justify-between mt-3 text-xs">
        <button disabled={idx === 0} onClick={() => { setIdx(idx - 1); setFlipped(false); }}
          className="px-3 py-1 rounded border border-vedicGold/40 bg-white text-vedicMaroon disabled:opacity-40 hover:bg-parchment">{t('learn.tutorPrev', '← prev')}</button>
        <button onClick={() => { setFlipped(false); setIdx(Math.floor(Math.random() * cards.length)); }}
          className="px-3 py-1 rounded border border-vedicGold/40 bg-white text-vedicMaroon hover:bg-parchment">{t('learn.flashcardShuffle', '⇄ shuffle')}</button>
        <button disabled={idx === cards.length - 1} onClick={() => { setIdx(idx + 1); setFlipped(false); }}
          className="px-3 py-1 rounded border border-vedicGold/40 bg-white text-vedicMaroon disabled:opacity-40 hover:bg-parchment">{t('learn.tutorNext', 'next →')}</button>
      </div>
    </Card>
  );
}
