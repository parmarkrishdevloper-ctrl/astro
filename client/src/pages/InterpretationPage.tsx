// Phase 18 — Interpretation engine + classical references.
//
// Two linked panels:
//   • Interpretation tabs (Ascendant · Planets in houses · Planets in signs ·
//     House-lord placements) — each line shows narrative text plus the
//     classical refs that back it up as clickable chips.
//   • Classical refs library — browse the whole corpus, filter by source.
//     Clicking a ref chip in the interpretation highlights the same entry
//     here so the authority is always visible alongside the claim.

import { useEffect, useMemo, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type {
  BirthInput, FullInterpretation, InterpretationLine,
  ClassicalRef, ClassicalSource,
} from '../types';

type T = (key: string, fallback?: string) => string;

type Tab = 'ascendant' | 'houses' | 'signs' | 'lords';

const TAB_KEYS: Tab[] = ['ascendant', 'houses', 'signs', 'lords'];

const SOURCE_COLORS: Record<ClassicalSource, string> = {
  'BPHS':           'bg-indigo-100 text-indigo-800',
  'Saravali':       'bg-emerald-100 text-emerald-800',
  'Hora Sara':      'bg-amber-100 text-amber-800',
  'Garga Hora':     'bg-rose-100 text-rose-800',
  'Phaladeepika':   'bg-sky-100 text-sky-800',
  'Jataka Parijata':'bg-purple-100 text-purple-800',
};

export function InterpretationPage() {
  const { t } = useT();
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [interp, setInterp] = useState<FullInterpretation | null>(null);
  const [refs, setRefs] = useState<ClassicalRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('ascendant');
  const [sourceFilter, setSourceFilter] = useState<ClassicalSource | 'all'>('all');
  const [focusRefId, setFocusRefId] = useState<string | null>(null);

  useEffect(() => {
    api.classicalRefs()
      .then((r) => setRefs(r.refs))
      .catch((e) => setError((e as Error).message));
  }, []);

  async function handleSubmit(input: BirthInput) {
    setBirth(input); setLoading(true); setError(null);
    try {
      const r = await api.interpret(input);
      setInterp(r.interpretation);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  const lines = useMemo((): InterpretationLine[] => {
    if (!interp) return [];
    if (tab === 'ascendant') return [interp.ascendant];
    if (tab === 'houses') return interp.planetsInHouses;
    if (tab === 'signs')  return interp.planetsInSigns;
    return interp.houseLordPlacements;
  }, [interp, tab]);

  const visibleRefs = useMemo(
    () => sourceFilter === 'all' ? refs : refs.filter((r) => r.source === sourceFilter),
    [refs, sourceFilter],
  );
  const sources: ClassicalSource[] = useMemo(
    () => Array.from(new Set(refs.map((r) => r.source))) as ClassicalSource[],
    [refs],
  );

  return (
    <PageShell
      title={t('interpret.title', 'Interpretation')}
      subtitle={t('interpret.subtitle', 'Narrative chart reading — each claim is backed by a classical reference you can inspect.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
        </aside>

        <main className="space-y-6">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {loading && <EmptyState>{t('interpret.consulting', 'Consulting the classical texts…')}</EmptyState>}
          {!interp && !loading && !error && !birth && (
            <EmptyState>{t('interpret.empty', 'Enter birth details to generate the interpretation.')}</EmptyState>
          )}

          {interp && (
            <>
              <InterpretationTabs
                t={t}
                tab={tab} onTab={setTab}
                counts={{
                  ascendant: 1,
                  houses: interp.planetsInHouses.length,
                  signs:  interp.planetsInSigns.length,
                  lords:  interp.houseLordPlacements.length,
                }}
              />
              <InterpretationList
                t={t}
                lines={lines}
                onRefClick={(id) => setFocusRefId(id)}
                focusRefId={focusRefId}
              />
            </>
          )}

          <RefsLibrary
            t={t}
            refs={visibleRefs}
            total={refs.length}
            sources={sources}
            filter={sourceFilter}
            onFilter={setSourceFilter}
            focusRefId={focusRefId}
            onClear={() => setFocusRefId(null)}
          />
        </main>
      </div>
    </PageShell>
  );
}

function InterpretationTabs({
  t, tab, onTab, counts,
}: {
  t: T;
  tab: Tab; onTab: (tt: Tab) => void;
  counts: Record<Tab, number>;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-vedicGold/40 bg-white p-1 text-xs">
      {TAB_KEYS.map((k) => (
        <button key={k}
          onClick={() => onTab(k)}
          className={`flex-1 min-w-[120px] px-3 py-2 rounded-lg font-semibold transition ${
            tab === k
              ? 'bg-vedicMaroon text-white'
              : 'text-vedicMaroon hover:bg-vedicMaroon/5'
          }`}>
          {t(`interpret.tab.${k}`, k)} <span className="opacity-70 tabular-nums">({counts[k]})</span>
        </button>
      ))}
    </div>
  );
}

function InterpretationList({
  t, lines, onRefClick, focusRefId,
}: {
  t: T;
  lines: InterpretationLine[];
  onRefClick: (id: string) => void;
  focusRefId: string | null;
}) {
  return (
    <Card title={t('interpret.linesTitle', 'Interpretation — {n} line{plural}').replace('{n}', String(lines.length)).replace('{plural}', lines.length === 1 ? '' : 's')}>
      <div className="space-y-3">
        {lines.map((l, i) => (
          <div key={i} className="rounded-xl border border-vedicGold/30 bg-vedicCream/30 p-4">
            <h4 className="font-semibold text-vedicMaroon mb-1">{l.topic}</h4>
            <p className="text-sm text-vedicMaroon/80 leading-relaxed">{l.text}</p>
            {l.refs.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {l.refs.map((r) => (
                  <button key={r.id}
                    onClick={() => onRefClick(r.id)}
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition ${
                      SOURCE_COLORS[r.source]
                    } ${focusRefId === r.id ? 'ring-2 ring-vedicMaroon' : 'opacity-80 hover:opacity-100'}`}
                    title={r.text}>
                    {r.source} {r.chapter}{r.sloka ? `.${r.sloka}` : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {lines.length === 0 && (
          <p className="text-sm text-vedicMaroon/60 italic">{t('interpret.linesEmpty', 'No lines in this section.')}</p>
        )}
      </div>
    </Card>
  );
}

function RefsLibrary({
  t, refs, total, sources, filter, onFilter, focusRefId, onClear,
}: {
  t: T;
  refs: ClassicalRef[];
  total: number;
  sources: ClassicalSource[];
  filter: ClassicalSource | 'all';
  onFilter: (f: ClassicalSource | 'all') => void;
  focusRefId: string | null;
  onClear: () => void;
}) {
  return (
    <Card title={t('interpret.refsLibrary', 'Classical library — {shown}/{total} refs').replace('{shown}', String(refs.length)).replace('{total}', String(total))} action={
      focusRefId && (
        <button onClick={onClear} className="text-xs text-vedicMaroon underline">
          {t('interpret.clearFocus', 'Clear focus')}
        </button>
      )
    }>
      <div className="flex flex-wrap gap-1 mb-3 text-xs">
        <button onClick={() => onFilter('all')}
          className={`px-2 py-1 rounded ${filter === 'all' ? 'bg-vedicMaroon text-white' : 'bg-vedicMaroon/10 text-vedicMaroon'}`}>
          {t('interpret.allRefs', 'All ({n})').replace('{n}', String(total))}
        </button>
        {sources.map((s) => (
          <button key={s} onClick={() => onFilter(s)}
            className={`px-2 py-1 rounded ${filter === s ? 'bg-vedicMaroon text-white' : SOURCE_COLORS[s]}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {refs.map((r) => (
          <div key={r.id} id={`ref-${r.id}`}
            className={`rounded-lg border p-3 transition ${
              focusRefId === r.id
                ? 'border-vedicMaroon bg-vedicMaroon/5 ring-1 ring-vedicMaroon'
                : 'border-vedicGold/30 bg-white'
            }`}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${SOURCE_COLORS[r.source]}`}>
                  {r.source} {r.chapter}{r.sloka ? `.${r.sloka}` : ''}
                </span>
                <span className="ml-2 font-semibold text-vedicMaroon">{r.topic}</span>
              </div>
            </div>
            <p className="text-sm text-vedicMaroon/80 leading-relaxed">{r.text}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {r.tags.map((tag) => (
                <Pill key={tag} tone="neutral">{tag}</Pill>
              ))}
            </div>
          </div>
        ))}
        {refs.length === 0 && (
          <p className="text-sm text-vedicMaroon/60 italic">{t('interpret.refsEmpty', 'No references in this filter.')}</p>
        )}
      </div>
    </Card>
  );
}
