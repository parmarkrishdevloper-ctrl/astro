// Phase 15 — Classical texts workspace.
//
// Two tabs, one birth form:
//   • Quotes — auto-link quotes from Saravali / Jataka Parijata / Phaladeepika /
//              Uttara Kalamrita / Jataka Bharanam to the chart's features.
//              Filter by source/tag; free-text search the corpus.
//   • Avasthas — the 12-state deep reading: Baladi + Jagradadi + Deeptadi + Shad
//              (Lajjita/Garvita/Kshudhita/Trashita/Mudita/Kshobhita). Scored and
//              verdict-coloured per planet.
//
// Birth input drives both tabs in one submit.

import { useEffect, useMemo, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput } from '../types';

type Tab = 'quotes' | 'avasthas';

const SOURCES = [
  'Saravali', 'Jataka Parijata', 'Phaladeepika', 'Uttara Kalamrita', 'Jataka Bharanam',
];

export function ClassicalTextsPage() {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>('quotes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState<any[] | null>(null);
  const [avasthas, setAvasthas] = useState<any[] | null>(null);
  const [texts, setTexts] = useState<any[]>([]);
  const [activeSources, setActiveSources] = useState<Set<string>>(new Set(SOURCES));
  const [searchQ, setSearchQ] = useState('');
  const [searchHits, setSearchHits] = useState<any[] | null>(null);
  const [lastBirth, setLastBirth] = useState<BirthInput | null>(null);

  useEffect(() => {
    api.classicalTexts().then((r) => setTexts(r.texts)).catch(() => { /* ignore */ });
  }, []);

  async function handleSubmit(birth: BirthInput) {
    setLoading(true); setError(null);
    setLastBirth(birth);
    try {
      const [q, a] = await Promise.all([
        api.classicalQuotes(birth, {}),
        api.avasthasDeep(birth),
      ]);
      setLinked(q.linked);
      setAvasthas(a.avasthas);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  async function onSearch() {
    const q = searchQ.trim();
    if (!q) { setSearchHits(null); return; }
    try {
      const r = await api.classicalQuotesSearch(q, 50);
      setSearchHits(r.quotes);
    } catch (e) { setError((e as Error).message); }
  }

  async function applySourceFilter() {
    if (!lastBirth) return;
    setLoading(true); setError(null);
    try {
      const r = await api.classicalQuotes(lastBirth, { sources: [...activeSources] });
      setLinked(r.linked);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  const any = linked || avasthas;

  return (
    <PageShell
      title={t('classicalTexts.title', 'Classical Texts')}
      subtitle={t('classicalTexts.subtitle', 'Auto-link quotes from Saravali · Jataka Parijata · Phaladeepika · Uttara Kalamrita · Jataka Bharanam — and read the 12-state Avastha profile.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />

          <Card title={t('classicalTexts.textsIndexed', 'Texts indexed')}>
            <div className="space-y-1.5">
              {texts.map((tx) => (
                <div key={tx.source} className="flex items-start justify-between gap-2 text-[11px]">
                  <div className="min-w-0">
                    {/* source name kept English — it's a proper-noun book title */}
                    <div className="font-semibold text-vedicMaroon truncate" lang="en">{tx.source}</div>
                    <div className="text-vedicMaroon/60">{tx.author} · {tx.era}</div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-vedicGold/20 text-vedicMaroon font-mono shrink-0">
                    {tx.quoteCount}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        <main className="space-y-4">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {loading && <EmptyState>{t('classicalTexts.linkingComputing', 'Linking quotes and computing Avasthas…')}</EmptyState>}
          {!any && !loading && !error && (
            <EmptyState>{t('classicalTexts.empty', 'Enter birth details to auto-link classical quotes and the 12-state Avastha reading.')}</EmptyState>
          )}

          {any && (
            <>
              <div className="flex items-center gap-1.5 p-1 rounded-xl border border-vedicGold/30 bg-vedicCream/30 w-fit">
                {([
                  { k: 'quotes',   label: t('classicalTexts.tab.quotes', 'Quotes'),   desc: t('classicalTexts.tab.quotes.desc', 'Auto-linked from 5 classical texts') },
                  { k: 'avasthas', label: t('classicalTexts.tab.avasthas', 'Avasthas Deep'), desc: t('classicalTexts.tab.avasthas.desc', '12 states — Baladi · Jagradadi · Deeptadi · Shad') },
                ] as const).map((tb) => (
                  <button key={tb.k} onClick={() => setTab(tb.k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      tab === tb.k ? 'bg-vedicMaroon text-white' : 'text-vedicMaroon/70 hover:bg-vedicMaroon/5'
                    }`}>
                    {tb.label}
                  </button>
                ))}
              </div>

              {tab === 'quotes' && linked && (
                <QuotesTab
                  linked={linked}
                  activeSources={activeSources}
                  toggleSource={(s) => {
                    const n = new Set(activeSources);
                    n.has(s) ? n.delete(s) : n.add(s);
                    setActiveSources(n);
                  }}
                  onApply={applySourceFilter}
                  searchQ={searchQ}
                  setSearchQ={setSearchQ}
                  onSearch={onSearch}
                  searchHits={searchHits}
                  clearSearch={() => { setSearchQ(''); setSearchHits(null); }}
                />
              )}
              {tab === 'avasthas' && avasthas && <AvasthasTab entries={avasthas} />}
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function QuotesTab({
  linked, activeSources, toggleSource, onApply,
  searchQ, setSearchQ, onSearch, searchHits, clearSearch,
}: {
  linked: any[];
  activeSources: Set<string>;
  toggleSource: (s: string) => void;
  onApply: () => void;
  searchQ: string;
  setSearchQ: (s: string) => void;
  onSearch: () => void;
  searchHits: any[] | null;
  clearSearch: () => void;
}) {
  const { t } = useT();
  const grouped = useMemo(() => {
    const g = new Map<string, any[]>();
    for (const l of linked) {
      const arr = g.get(l.quote.source) ?? [];
      arr.push(l);
      g.set(l.quote.source, arr);
    }
    return g;
  }, [linked]);

  const matchCountText = searchHits
    ? `${searchHits.length} ${searchHits.length === 1 ? t('classicalTexts.matchesSingular', 'quote match') : t('classicalTexts.matchesPlural', 'quotes match')} "${searchQ}"`
    : '';

  const linkedCount = linked.length;
  const linkedTitleText = `${t('classicalTexts.linkedTitle', 'Auto-linked to your chart')} — ${linkedCount} ${linkedCount === 1 ? t('classicalTexts.quoteSingular', 'quote') : t('classicalTexts.quotePlural', 'quotes')}`;

  return (
    <div className="space-y-4">
      <Card title={t('classicalTexts.filterBySource', 'Filter by source')}>
        <div className="flex items-center gap-2 flex-wrap">
          {SOURCES.map((s) => (
            <button key={s} onClick={() => toggleSource(s)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                activeSources.has(s)
                  ? 'bg-vedicMaroon text-white border-vedicMaroon'
                  : 'bg-parchment text-vedicMaroon/70 border-vedicGold/30 hover:bg-vedicMaroon/5'
              }`}>
              {/* source = proper-noun book title (Saravali / Phaladeepika / etc.) — kept English */}
              <span lang="en">{s}</span>
            </button>
          ))}
          <button onClick={onApply}
            className="ml-auto px-3 py-1 rounded-md text-[11px] font-semibold bg-vedicGold/20 text-vedicMaroon border border-vedicGold/40 hover:bg-vedicGold/30">
            {t('classicalTexts.applyFilter', 'Apply filter')}
          </button>
        </div>
      </Card>

      <Card title={t('classicalTexts.searchCorpus', 'Search the corpus')}>
        <div className="flex items-center gap-2">
          <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
            placeholder={t('classicalTexts.searchPlaceholder', "e.g. 'marriage' · 'raja-yoga' · 'jupiter 5th'")}
            className="flex-1 px-3 py-1.5 text-sm border border-vedicGold/30 rounded-md bg-parchment/50 focus:outline-none focus:border-vedicMaroon/50" />
          <button onClick={onSearch}
            className="px-3 py-1.5 rounded-md text-xs font-semibold bg-vedicMaroon text-white hover:bg-vedicMaroon/90">
            {t('classicalTexts.searchBtn', 'Search')}
          </button>
          {searchHits && (
            <button onClick={clearSearch}
              className="px-2 py-1.5 rounded-md text-[11px] font-semibold bg-vedicGold/20 text-vedicMaroon border border-vedicGold/40">
              {t('classicalTexts.clearBtn', 'Clear')}
            </button>
          )}
        </div>
        {searchHits && (
          <div className="mt-3 space-y-2">
            <div className="text-[11px] text-vedicMaroon/60">
              {matchCountText}
            </div>
            {searchHits.map((q) => (
              <div key={q.id} className="rounded-md border border-vedicGold/30 bg-parchment/30 p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  {/* source + chapter — proper-noun book title and chapter ref kept English */}
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-vedicMaroon/60" lang="en">
                    {q.source}{q.chapter ? ` · ${q.chapter}` : ''}
                  </span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {q.tags.slice(0, 3).map((tg: string) => (
                      // tags are functional codes (e.g. 'sun', 'house-1') kept English
                      <span key={tg} className="text-[9px] px-1 py-0.5 rounded bg-vedicGold/20 text-vedicMaroon/70" lang="en">{tg}</span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-vedicMaroon/90 italic leading-relaxed">{q.text}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title={linkedTitleText}>
        {linked.length === 0 ? (
          <p className="text-xs italic text-vedicMaroon/60">
            {t('classicalTexts.noMatches', 'No quote conditions matched this chart. Try broader filter selection.')}
          </p>
        ) : (
          <div className="space-y-4">
            {[...grouped.entries()].map(([source, items]) => (
              <div key={source}>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-vedicMaroon/70 mb-2 pb-1 border-b border-vedicGold/20">
                  {/* source name = proper-noun book title kept English */}
                  <span lang="en">{source}</span> <span className="font-mono text-vedicMaroon/50">({items.length})</span>
                </h4>
                <div className="space-y-2">
                  {items.map((l) => (
                    <div key={l.quote.id}
                      className="rounded-md border border-vedicGold/30 bg-parchment/30 p-3">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        {/* chapter / source — proper-noun reference kept English */}
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-vedicMaroon/60" lang="en">
                          {l.quote.chapter ?? source}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-mono text-vedicMaroon/50">{t('classicalTexts.score', 'score')} {l.score}</span>
                        </div>
                      </div>
                      <p className="text-xs text-vedicMaroon/90 italic leading-relaxed mb-2">"{l.quote.text}"</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-semibold text-vedicMaroon/60">{t('classicalTexts.matchedOn', 'matched on:')}</span>
                        {l.matchedOn.map((m: string, i: number) => (
                          // matched-on labels are short functional codes (e.g. "Sun in 10H") — kept English
                          <span key={i}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-vedicMaroon/10 text-vedicMaroon font-mono" lang="en">
                            {m}
                          </span>
                        ))}
                        {l.quote.tags.length > 0 && (
                          <span className="ml-auto flex gap-1">
                            {l.quote.tags.slice(0, 3).map((tg: string) => (
                              // tags = functional codes kept English
                              <span key={tg} className="text-[9px] px-1 py-0.5 rounded bg-vedicGold/20 text-vedicMaroon/70" lang="en">
                                {tg}
                              </span>
                            ))}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function AvasthasTab({ entries }: { entries: any[] }) {
  const { t } = useT();
  return (
    <div className="space-y-4">
      <Card title={t('classicalTexts.matrixTitle', 'Twelve-state Avastha Matrix')}>
        <p className="text-[11px] text-vedicMaroon/60 mb-3">
          {t('classicalTexts.matrixIntro', 'Each planet evaluated across')} <b>{t('classicalTexts.matrixIntroBold', 'four classical schemes')}</b>{t('classicalTexts.matrixIntroEnd', ': Baladi (age 5), Jagradadi (sleep 3), Deeptadi (luminosity 8), and Shad (situational 6). Net score drives the verdict colour.')}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-vedicMaroon/60 text-left">
                <th className="py-1 pr-2 font-semibold">{t('classicalTexts.col.planet', 'Planet')}</th>
                <th className="py-1 pr-2 font-semibold">{t('classicalTexts.col.baladi', 'Baladi')}</th>
                <th className="py-1 pr-2 font-semibold">{t('classicalTexts.col.jagradadi', 'Jagradadi')}</th>
                <th className="py-1 pr-2 font-semibold">{t('classicalTexts.col.deeptadi', 'Deeptadi')}</th>
                <th className="py-1 pr-2 font-semibold">{t('classicalTexts.col.shadStates', 'Shad states')}</th>
                <th className="py-1 pr-2 font-semibold text-right">{t('classicalTexts.col.score', 'Score')}</th>
                <th className="py-1 pr-2 font-semibold">{t('classicalTexts.col.verdict', 'Verdict')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.planet} className="border-t border-vedicGold/20 align-top">
                  {/* TODO(i18n-server): localize planet name */}
                  <td className="py-1.5 pr-2 font-mono font-bold text-vedicMaroon" lang="en">{e.planet}</td>
                  {/* TODO(i18n-server): localize baladi/jagradadi/deeptadi state names */}
                  <td className="py-1.5 pr-2 text-vedicMaroon/80" lang="en">{e.baladi}</td>
                  <td className="py-1.5 pr-2 text-vedicMaroon/80" lang="en">{e.jagradadi}</td>
                  <td className="py-1.5 pr-2 text-vedicMaroon/80" lang="en">{e.deeptadi}</td>
                  <td className="py-1.5 pr-2">
                    {e.shad.active.length === 0 ? (
                      <span className="text-vedicMaroon/40 italic">—</span>
                    ) : (
                      <div className="flex gap-1 flex-wrap">
                        {e.shad.active.map((s: string) => (
                          // TODO(i18n-server): localize shad state name
                          <span key={s}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              shadTone(s)
                            }`} lang="en">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className={`py-1.5 pr-2 text-right font-mono font-bold tabular-nums ${
                    e.score > 0 ? 'text-green-700' : e.score < 0 ? 'text-red-700' : 'text-vedicMaroon/60'
                  }`}>
                    {e.score > 0 ? `+${e.score}` : e.score}
                  </td>
                  <td className="py-1.5 pr-2">
                    <Pill tone={verdictTone(e.verdict)}>{t(`classicalTexts.verdict.${e.verdict}`, e.verdict)}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={t('classicalTexts.perPlanet', 'Per-planet readings')}>
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.planet}
              className={`rounded-md border p-3 ${
                e.verdict === 'excellent' ? 'bg-green-50 border-green-200' :
                e.verdict === 'good'      ? 'bg-green-50/50 border-green-100' :
                e.verdict === 'neutral'   ? 'bg-vedicCream/40 border-vedicGold/20' :
                e.verdict === 'weak'      ? 'bg-amber-50 border-amber-200' :
                                            'bg-red-50 border-red-200'
              }`}>
              <div className="flex items-center gap-3 mb-1">
                {/* TODO(i18n-server): localize planet name */}
                <span className="font-mono font-bold text-vedicMaroon" lang="en">{e.planet}</span>
                <Pill tone={verdictTone(e.verdict)}>{t(`classicalTexts.verdict.${e.verdict}`, e.verdict)}</Pill>
                {/* TODO(i18n-server): localize avastha state names */}
                <span className="text-[10px] font-mono text-vedicMaroon/50" lang="en">
                  {e.baladi} · {e.jagradadi} · {e.deeptadi}
                </span>
              </div>
              {/* TODO(i18n-server): localize avastha reading prose */}
              <p className="text-xs text-vedicMaroon/90 leading-relaxed" lang="en">{e.reading}</p>
              {e.shad.reasons.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {e.shad.reasons.map((r: any) => (
                    <li key={r.state} className="text-[11px] text-vedicMaroon/70">
                      {/* TODO(i18n-server): localize shad state names + reasons */}
                      <span className={`inline-block w-16 font-semibold ${shadTextTone(r.state)}`} lang="en">{r.state}</span>
                      <span lang="en">→ {r.reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('classicalTexts.legend', 'Scheme legend')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
          <div>
            <div className="font-semibold text-vedicMaroon mb-1">{t('classicalTexts.legend.baladi', 'Baladi — age / strength (5)')}</div>
            <div className="text-vedicMaroon/70">{t('classicalTexts.legend.baladi.list', 'Bala · Kumara · Yuva · Vriddha · Mrita')}</div>
          </div>
          <div>
            <div className="font-semibold text-vedicMaroon mb-1">{t('classicalTexts.legend.jagradadi', 'Jagradadi — awareness (3)')}</div>
            <div className="text-vedicMaroon/70">{t('classicalTexts.legend.jagradadi.list', 'Jagrat · Swapna · Sushupti')}</div>
          </div>
          <div>
            <div className="font-semibold text-vedicMaroon mb-1">{t('classicalTexts.legend.deeptadi', 'Deeptadi — luminosity (8)')}</div>
            <div className="text-vedicMaroon/70">{t('classicalTexts.legend.deeptadi.list', 'Deepta · Swastha · Mudita · Shanta · Deena · Vikala · Dukhita · Khala')}</div>
          </div>
          <div>
            <div className="font-semibold text-vedicMaroon mb-1">{t('classicalTexts.legend.shad', 'Shad — situational (6)')}</div>
            <div className="text-vedicMaroon/70">
              <span className="text-green-700 font-semibold">{t('classicalTexts.legend.shad.positive', 'Garvita · Mudita')}</span>
              {' · '}
              <span className="text-red-700 font-semibold">{t('classicalTexts.legend.shad.negative', 'Lajjita · Kshudhita · Trashita · Kshobhita')}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─── helpers ───────────────────────────────────────────────────────────────

function verdictTone(v: string): 'good' | 'bad' | 'warn' | 'neutral' {
  if (v === 'excellent' || v === 'good') return 'good';
  if (v === 'afflicted') return 'bad';
  if (v === 'weak') return 'warn';
  return 'neutral';
}

function shadTone(s: string): string {
  if (s === 'Garvita' || s === 'Mudita')  return 'bg-green-100 text-green-800';
  if (s === 'Kshobhita')                   return 'bg-red-200 text-red-900';
  if (s === 'Lajjita')                     return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-900';
}

function shadTextTone(s: string): string {
  if (s === 'Garvita' || s === 'Mudita') return 'text-green-700';
  if (s === 'Kshobhita' || s === 'Lajjita') return 'text-red-700';
  return 'text-amber-700';
}
