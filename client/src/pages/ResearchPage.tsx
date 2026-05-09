// Phase 14 — Research page.
//
// Six tabs:
//   1. Pattern   — DSL pattern search against a chart
//   2. Timeline  — dasha + transit + event overlay
//   3. Stats     — correlation across a set of sample charts
//   4. Famous    — archetype match to seeded famous charts
//   5. Rectify+  — deep (multi-technique) birth-time rectification
//   6. Notebook  — saved research cards

import { useEffect, useMemo, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput } from '../types';

type Tab = 'pattern' | 'timeline' | 'stats' | 'famous' | 'rectify' | 'notebook';

const PLANETS = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA', 'RA', 'KE'] as const;

export function ResearchPage() {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>('pattern');

  const tabLabels: Record<Tab, string> = {
    pattern:  t('research.tab.pattern', 'pattern'),
    timeline: t('research.tab.timeline', 'timeline'),
    stats:    t('research.tab.stats', 'stats'),
    famous:   t('research.tab.famous', 'famous'),
    rectify:  t('research.tab.rectify', 'rectify+'),
    notebook: t('research.tab.notebook', 'notebook'),
  };

  return (
    <PageShell
      title={t('research.title', 'Research')}
      subtitle={t('research.subtitle', 'Pattern search · Timeline overlay · Stats · Famous-chart matcher · Deep rectification · Notebook')}
    >
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-vedicGold/30 bg-vedicCream/30 w-fit mb-4">
        {(['pattern', 'timeline', 'stats', 'famous', 'rectify', 'notebook'] as Tab[]).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === k ? 'bg-vedicMaroon text-white' : 'text-vedicMaroon/70 hover:bg-vedicMaroon/5'
            }`}>
            {tabLabels[k]}
          </button>
        ))}
      </div>

      {tab === 'pattern'  && <PatternTab />}
      {tab === 'timeline' && <TimelineTab />}
      {tab === 'stats'    && <StatsTab />}
      {tab === 'famous'   && <FamousTab />}
      {tab === 'rectify'  && <RectifyDeepTab />}
      {tab === 'notebook' && <NotebookTab />}
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Pattern search
// ═══════════════════════════════════════════════════════════════════════════

function PatternTab() {
  const { t } = useT();
  const [presets, setPresets] = useState<{ id: string; label: string; query: string }[]>([]);
  const [query, setQuery] = useState('SA in 10h and JU aspects MO');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.researchPatternPresets().then((r) => setPresets(r.presets)).catch(() => {});
  }, []);

  async function onSubmit(birth: BirthInput) {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await api.researchPattern(birth, query);
      setResult(r.result);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      <aside>
        <BirthDetailsForm onSubmit={onSubmit} loading={loading} />
      </aside>
      <main className="space-y-3">
        <Card title={t('research.pattern.dsl', 'Pattern DSL')}>
          <div className="space-y-2">
            <textarea
              className="w-full h-20 text-sm font-mono p-2 rounded-lg border border-vedicGold/30 bg-white/80"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('research.pattern.placeholder', 'e.g. SA in 10h and JU aspects MO')}
            />
            <div className="flex flex-wrap gap-1.5">
              {/* TODO(i18n-server): localize preset labels */}
              {presets.map((p) => (
                <button key={p.id} onClick={() => setQuery(p.query)}
                  className="text-[11px] px-2 py-1 rounded-md border border-vedicGold/30 bg-white/60 hover:bg-vedicMaroon/5"
                  lang="en">
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-vedicMaroon/60">
              {/* Grammar phrase keeps the DSL tokens (which are English keywords) inline */}
              {t('research.pattern.grammar', 'Grammar: {grammar}. Combine with {bool}.')
                .replace('{grammar}', '')
                .replace('{bool}', '')}
              <code>planet in sign / Nh</code>, <code>planet aspects planet / Nh</code>,
              <code> planet with planet</code>, <code>planet retrograde / exalted / debilitated / combust / own / strong</code>,
              <code> lagna in sign</code>, <code>moonsign is sign</code>, <code>yoga &lt;name&gt;</code>.
              <code> and / or / not</code>.
            </p>
          </div>
        </Card>

        {error && <ErrorBanner>{error}</ErrorBanner>}
        {loading && <EmptyState>{t('research.pattern.evaluating', 'Evaluating pattern…')}</EmptyState>}
        {!result && !loading && !error && (
          <EmptyState>{t('research.pattern.empty', 'Enter birth details and click to match.')}</EmptyState>
        )}

        {result && (
          <Card title={result.match ? t('research.pattern.resultMatch', 'Pattern result — MATCH') : t('research.pattern.resultNoMatch', 'Pattern result — no match')}>
            <div className="mb-2">
              <Pill tone={result.match ? 'good' : 'neutral'}>
                {result.match ? t('research.pattern.matched', '✓ matched') : t('research.pattern.notMatched', '✗ did not match')}
              </Pill>
            </div>
            {result.parseErrors?.length > 0 && (
              <div className="text-xs text-vedicMaroon/70 mb-2">
                {/* TODO(i18n-server): localize parse error messages */}
                <span>{t('research.pattern.parseWarn', 'Parse warnings: {list}').replace('{list}', '')}</span>
                <span lang="en">{result.parseErrors.join(' · ')}</span>
              </div>
            )}
            <ul className="text-xs space-y-1">
              {result.breakdown.map((b: any, i: number) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={b.match ? 'text-emerald-600' : 'text-rose-600'}>
                    {b.match ? '✓' : '✗'}
                  </span>
                  <code>{b.clause}</code>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Timeline overlay
// ═══════════════════════════════════════════════════════════════════════════

function TimelineTab() {
  const { t } = useT();
  const defFrom = new Date().toISOString().slice(0, 10);
  const defTo = new Date(Date.now() + 5 * 365 * 86400_000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(defFrom);
  const [to, setTo] = useState(defTo);
  const [events, setEvents] = useState<{ date: string; title: string; category?: string }[]>([]);
  const [newEv, setNewEv] = useState({ date: '', title: '', category: 'event' });
  const [overlay, setOverlay] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(birth: BirthInput) {
    setLoading(true); setError(null); setOverlay(null);
    try {
      const r = await api.researchTimeline({
        birth,
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString(),
        events,
      });
      setOverlay(r.overlay);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  function addEvent() {
    if (!newEv.date || !newEv.title) return;
    setEvents((es) => [...es, { ...newEv }]);
    setNewEv({ date: '', title: '', category: 'event' });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      <aside className="space-y-4">
        <BirthDetailsForm onSubmit={onSubmit} loading={loading} />
        <Card title={t('research.timeline.window', 'Window')}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label>{t('research.timeline.from', 'From')}<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full mt-1 p-1 rounded border border-vedicGold/30" /></label>
            <label>{t('research.timeline.to', 'To')}<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full mt-1 p-1 rounded border border-vedicGold/30" /></label>
          </div>
        </Card>
        <Card title={t('research.timeline.events', 'Life events')}>
          <div className="space-y-1 mb-2">
            {events.map((e, i) => (
              <div key={i} className="text-xs flex items-center justify-between p-1 rounded bg-vedicCream/40">
                {/* TODO(i18n-server): localize event title and category labels */}
                <span lang="en">{e.date} · <b>{e.title}</b> <span className="text-vedicMaroon/50">{e.category}</span></span>
                <button onClick={() => setEvents(events.filter((_, j) => j !== i))} className="text-rose-600">×</button>
              </div>
            ))}
            {!events.length && <div className="text-xs text-vedicMaroon/60">{t('research.timeline.noEvents', 'No events — add some below to overlay.')}</div>}
          </div>
          <div className="grid grid-cols-[1fr_1fr] gap-1 text-xs">
            <input type="date" value={newEv.date} onChange={(e) => setNewEv({ ...newEv, date: e.target.value })} className="p-1 rounded border border-vedicGold/30" />
            <input placeholder={t('research.timeline.category', 'Category')} value={newEv.category} onChange={(e) => setNewEv({ ...newEv, category: e.target.value })} className="p-1 rounded border border-vedicGold/30" />
            <input placeholder={t('research.timeline.title', 'Title')} value={newEv.title} onChange={(e) => setNewEv({ ...newEv, title: e.target.value })} className="col-span-2 p-1 rounded border border-vedicGold/30" />
          </div>
          <button onClick={addEvent} className="mt-2 text-xs px-2 py-1 rounded bg-vedicMaroon text-white">{t('research.timeline.addEvent', '+ add event')}</button>
        </Card>
      </aside>
      <main className="space-y-3">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {loading && <EmptyState>{t('research.timeline.building', 'Building overlay…')}</EmptyState>}
        {!overlay && !loading && !error && (
          <EmptyState>{t('research.timeline.empty', 'Enter birth details to render a dasha/transit overlay.')}</EmptyState>
        )}
        {overlay && <TimelineRender overlay={overlay} />}
      </main>
    </div>
  );
}

function TimelineRender({ overlay }: { overlay: any }) {
  const { t } = useT();
  const fromMs = new Date(overlay.window.from).getTime();
  const toMs   = new Date(overlay.window.to).getTime();
  const span   = Math.max(toMs - fromMs, 1);
  const pctOf  = (iso: string) => Math.max(0, Math.min(100, ((new Date(iso).getTime() - fromMs) / span) * 100));

  const lanes: ['maha' | 'antar' | 'transit' | 'event', string][] = [
    ['maha',    t('research.timeline.lane.maha', 'Mahadasha')],
    ['antar',   t('research.timeline.lane.antar', 'Antardasha')],
    ['transit', t('research.timeline.lane.transit', 'Transits (slow)')],
    ['event',   t('research.timeline.lane.event', 'Life events')],
  ];

  return (
    <Card title={t('research.timeline.overlay', 'Timeline overlay')} className="overflow-x-auto">
      <div className="min-w-[700px] space-y-3">
        {lanes.map(([lane, label]) => {
          const bars = overlay.bars?.filter((b: any) => b.lane === lane) ?? [];
          const pts  = overlay.points?.filter((p: any) => p.lane === lane) ?? [];
          return (
            <div key={lane}>
              <div className="text-[11px] font-semibold text-vedicMaroon/70 mb-1">{label}</div>
              <div className="relative h-8 rounded-md bg-vedicCream/40 border border-vedicGold/20">
                {bars.map((b: any, i: number) => {
                  const left = pctOf(b.start);
                  const w = Math.max(1, pctOf(b.end) - left);
                  return (
                    // TODO(i18n-server): localize bar label
                    <div key={`b${i}`} title={`${b.label} · ${b.start.slice(0, 10)} → ${b.end.slice(0, 10)}`}
                      className="absolute top-1 bottom-1 rounded-sm text-[10px] text-white flex items-center px-1 overflow-hidden"
                      style={{
                        left: `${left}%`, width: `${w}%`,
                        background: lane === 'maha' ? '#801336' : '#b0436b',
                      }}
                      lang="en">
                      {b.label}
                    </div>
                  );
                })}
                {pts.map((p: any, i: number) => {
                  const left = pctOf(p.date);
                  return (
                    // TODO(i18n-server): localize point label
                    <div key={`p${i}`} title={`${p.label} · ${p.date.slice(0, 10)}`}
                      className="absolute top-0 bottom-0 border-l-2 border-dashed"
                      style={{
                        left: `${left}%`,
                        borderColor: lane === 'transit' ? '#0ea5e9' : '#059669',
                      }}>
                      <div className="absolute top-0 -translate-x-1/2 text-[9px] whitespace-nowrap"
                           style={{ color: lane === 'transit' ? '#0369a1' : '#047857' }}
                           lang="en">
                        {p.label.length > 28 ? p.label.slice(0, 28) + '…' : p.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="flex justify-between text-[10px] text-vedicMaroon/60">
          <span>{overlay.window.from.slice(0, 10)}</span>
          <span>{overlay.window.to.slice(0, 10)}</span>
        </div>
      </div>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Stats correlation
// ═══════════════════════════════════════════════════════════════════════════

const FAMOUS_CACHE_KEY = '__famousCache__';

function StatsTab() {
  const { t } = useT();
  const [famous, setFamous] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('JU strong and SA strong');
  const [result, setResult] = useState<any | null>(null);
  const [dist, setDist] = useState<any | null>(null);
  const [facet, setFacet] = useState<'lagnaSign' | 'moonSign' | 'sunSign' | 'nakLord'>('moonSign');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.researchFamous().then((r) => {
      setFamous(r.charts);
      setSelected(new Set(r.charts.map((c: any) => c.id)));
      (window as any)[FAMOUS_CACHE_KEY] = r.charts;
    }).catch(() => {});
  }, []);

  const samples = useMemo(
    () => famous.filter((f) => selected.has(f.id)).map((f) => ({ label: f.name, tag: f.profession, birth: f.birth })),
    [famous, selected],
  );

  async function runCorrelation() {
    if (!samples.length || !query.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await api.researchStats({ samples, query, groupByTag: true });
      setResult(r.result);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function runDistribution() {
    if (!samples.length) return;
    setLoading(true); setError(null); setDist(null);
    try {
      const r = await api.researchDistribution({ samples, facet });
      setDist(r.result);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      <aside className="space-y-4">
        <Card title={t('research.stats.samples', 'Sample set')}>
          <div className="text-xs text-vedicMaroon/70 mb-2">
            {t('research.stats.using', 'Using {sel}/{total} seeded famous charts.').replace('{sel}', String(selected.size)).replace('{total}', String(famous.length))}
          </div>
          <div className="max-h-56 overflow-auto space-y-1">
            {famous.map((f) => (
              <label key={f.id} className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={selected.has(f.id)} onChange={(e) => {
                  const nxt = new Set(selected);
                  e.target.checked ? nxt.add(f.id) : nxt.delete(f.id);
                  setSelected(nxt);
                }} />
                {/* TODO(i18n-server): localize famous name and profession */}
                <span lang="en">{f.name} <span className="text-vedicMaroon/50">· {f.profession}</span></span>
              </label>
            ))}
          </div>
        </Card>
        <Card title={t('research.stats.pattern', 'Pattern')}>
          <textarea className="w-full h-20 text-sm font-mono p-2 rounded-lg border border-vedicGold/30 bg-white/80"
            value={query} onChange={(e) => setQuery(e.target.value)} />
          <button onClick={runCorrelation} className="mt-2 text-xs px-2 py-1 rounded bg-vedicMaroon text-white" disabled={loading}>
            {t('research.stats.runCorr', 'Run correlation')}
          </button>
        </Card>
        <Card title={t('research.stats.distribution', 'Distribution')}>
          <select className="w-full text-xs p-1 rounded border border-vedicGold/30"
            value={facet} onChange={(e) => setFacet(e.target.value as any)}>
            <option value="lagnaSign">{t('research.stats.facet.lagnaSign', 'Lagna sign')}</option>
            <option value="moonSign">{t('research.stats.facet.moonSign', 'Moon sign')}</option>
            <option value="sunSign">{t('research.stats.facet.sunSign', 'Sun sign')}</option>
            <option value="nakLord">{t('research.stats.facet.nakLord', 'Moon nak-lord')}</option>
          </select>
          <button onClick={runDistribution} className="mt-2 text-xs px-2 py-1 rounded bg-vedicMaroon text-white" disabled={loading}>
            {t('research.stats.compute', 'Compute')}
          </button>
        </Card>
      </aside>
      <main className="space-y-3">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {loading && <EmptyState>{t('research.stats.crunching', 'Crunching numbers…')}</EmptyState>}
        {!result && !dist && !loading && !error && (
          <EmptyState>{t('research.stats.empty', 'Pick samples + pattern to run a correlation.')}</EmptyState>
        )}

        {result && (
          <Card title={t('research.stats.corrTitle', 'Correlation — {pct}% ({mc}/{n})').replace('{pct}', String(result.matchPct)).replace('{mc}', String(result.matchCount)).replace('{n}', String(result.n))}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="font-semibold text-emerald-700 mb-1">{t('research.stats.hits', 'Hits')}</div>
                {/* TODO(i18n-server): localize famous label/tag */}
                {result.hits.map((h: any, i: number) => (
                  <div key={i} lang="en">{h.label} <span className="text-vedicMaroon/50">· {h.tag}</span></div>
                ))}
                {!result.hits.length && <div className="text-vedicMaroon/50">—</div>}
              </div>
              <div>
                <div className="font-semibold text-rose-700 mb-1">{t('research.stats.misses', 'Misses')}</div>
                {result.misses.map((h: any, i: number) => (
                  <div key={i} lang="en">{h.label} <span className="text-vedicMaroon/50">· {h.tag}</span></div>
                ))}
                {!result.misses.length && <div className="text-vedicMaroon/50">—</div>}
              </div>
            </div>
            {result.byTag && (
              <div className="mt-3 text-xs">
                <div className="font-semibold mb-1">{t('research.stats.byTag', 'By tag')}</div>
                <table className="w-full">
                  <thead><tr className="text-left text-vedicMaroon/60">
                    <th>{t('research.stats.col.tag', 'Tag')}</th>
                    <th>{t('research.stats.col.n', 'N')}</th>
                    <th>{t('research.stats.col.match', 'Match')}</th>
                    <th>{t('research.stats.col.pct', '%')}</th>
                  </tr></thead>
                  <tbody>
                    {result.byTag.map((b: any) => (
                      <tr key={b.tag}>
                        {/* TODO(i18n-server): localize tag string */}
                        <td lang="en">{b.tag}</td><td>{b.n}</td><td>{b.matchCount}</td><td>{b.matchPct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {dist && (
          <Card title={t('research.stats.distTitle', '{facet} distribution (n={n})').replace('{facet}', dist.facet).replace('{n}', String(dist.n))}>
            <div className="space-y-1 text-xs">
              {dist.slices.map((s: any) => (
                <div key={s.key} className="flex items-center gap-2">
                  {/* TODO(i18n-server): localize slice key (sign/lord) */}
                  <div className="w-28 text-vedicMaroon/80" lang="en">{s.key}</div>
                  <div className="flex-1 h-3 bg-vedicCream/40 rounded">
                    <div className="h-3 rounded bg-vedicMaroon" style={{ width: `${s.pct}%` }} />
                  </div>
                  <div className="w-16 text-right">{s.n} ({s.pct}%)</div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Famous chart matcher
// ═══════════════════════════════════════════════════════════════════════════

function FamousTab() {
  const { t } = useT();
  const [matches, setMatches] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(birth: BirthInput) {
    setLoading(true); setError(null); setMatches(null);
    try {
      const r = await api.researchFamousMatch(birth, 10);
      setMatches(r.matches);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      <aside>
        <BirthDetailsForm onSubmit={onSubmit} loading={loading} />
      </aside>
      <main className="space-y-3">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {loading && <EmptyState>{t('research.famous.matching', 'Matching archetype…')}</EmptyState>}
        {!matches && !loading && !error && (
          <EmptyState>{t('research.famous.empty', 'Find the famous natives whose chart structure most resembles yours.')}</EmptyState>
        )}
        {matches && (
          <Card title={t('research.famous.matches', 'Archetype matches')}>
            <div className="space-y-2">
              {matches.map((m: any) => (
                <div key={m.id} className="p-2 rounded-lg border border-vedicGold/30 bg-white/70">
                  <div className="flex items-center justify-between">
                    <div>
                      {/* TODO(i18n-server): localize famous name and profession */}
                      <div className="font-semibold" lang="en">{m.name}</div>
                      <div className="text-[11px] text-vedicMaroon/70" lang="en">{m.profession}</div>
                    </div>
                    <Pill tone={m.score >= 50 ? 'good' : m.score >= 25 ? 'info' : 'neutral'}>
                      {m.score} / 100
                    </Pill>
                  </div>
                  {m.reasons?.length > 0 && (
                    <ul className="mt-1 text-[11px] text-vedicMaroon/80 list-disc pl-4">
                      {/* TODO(i18n-server): localize reason prose */}
                      {m.reasons.map((r: string, i: number) => <li key={i} lang="en">{r}</li>)}
                    </ul>
                  )}
                  {/* TODO(i18n-server): localize notes prose */}
                  {m.notes && <div className="mt-1 text-[11px] italic text-vedicMaroon/60" lang="en">{m.notes}</div>}
                </div>
              ))}
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Deep rectification
// ═══════════════════════════════════════════════════════════════════════════

function RectifyDeepTab() {
  const { t, al } = useT();
  const [events, setEvents] = useState<any[]>([
    { date: '2015-06-01', category: 'marriage', house: 7, karaka: 'VE', weight: 1 },
  ]);
  const [newEv, setNewEv] = useState({ date: '', category: 'career', house: 10, karaka: '', weight: 1 });
  const [win, setWin] = useState(60);
  const [step, setStep] = useState(2);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(birth: BirthInput) {
    if (!events.length) { setError(t('research.rectify.errAdd', 'Add at least one event.')); return; }
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await api.researchRectifyDeep({
        birth, events, windowMinutes: win, stepMinutes: step,
      });
      setResult(r.result);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  function addEv() {
    if (!newEv.date) return;
    setEvents((es) => [...es, { ...newEv, karaka: newEv.karaka || undefined }]);
    setNewEv({ date: '', category: 'career', house: 10, karaka: '', weight: 1 });
  }

  function localizeCat(c: string): string {
    const map: Record<string, string> = {
      'career': 'career', 'marriage': 'marriage', 'birth-child': 'birthChild',
      'loss-parent': 'lossParent', 'health': 'health', 'move': 'move', 'other': 'other',
    };
    return t(`research.rectify.cat.${map[c] ?? c}`, c);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      <aside className="space-y-4">
        <BirthDetailsForm onSubmit={onSubmit} loading={loading} />
        <Card title={t('research.rectify.window', 'Search window')}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label>{t('research.rectify.minutes', '± minutes')}
              <input type="number" min={5} max={360} value={win} onChange={(e) => setWin(+e.target.value)}
                className="w-full mt-1 p-1 rounded border border-vedicGold/30" />
            </label>
            <label>{t('research.rectify.step', 'Step minutes')}
              <input type="number" min={1} max={30} value={step} onChange={(e) => setStep(+e.target.value)}
                className="w-full mt-1 p-1 rounded border border-vedicGold/30" />
            </label>
          </div>
        </Card>
        <Card title={t('research.rectify.events', 'Events')}>
          <div className="space-y-1 mb-2">
            {events.map((e, i) => (
              <div key={i} className="text-xs flex items-center justify-between p-1 rounded bg-vedicCream/40">
                <span>{e.date} · <b>{localizeCat(e.category)}</b> · H{e.house}{e.karaka ? ` · ${al.planet(e.karaka)}` : ''}</span>
                <button onClick={() => setEvents(events.filter((_, j) => j !== i))} className="text-rose-600">×</button>
              </div>
            ))}
            {!events.length && <div className="text-xs text-vedicMaroon/60">{t('research.rectify.eventsEmpty', 'Add known life events.')}</div>}
          </div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <input type="date" value={newEv.date} onChange={(e) => setNewEv({ ...newEv, date: e.target.value })} className="p-1 rounded border border-vedicGold/30" />
            <select value={newEv.category} onChange={(e) => setNewEv({ ...newEv, category: e.target.value })} className="p-1 rounded border border-vedicGold/30">
              <option value="career">{t('research.rectify.cat.career', 'career')}</option>
              <option value="marriage">{t('research.rectify.cat.marriage', 'marriage')}</option>
              <option value="birth-child">{t('research.rectify.cat.birthChild', 'child-birth')}</option>
              <option value="loss-parent">{t('research.rectify.cat.lossParent', 'loss-parent')}</option>
              <option value="health">{t('research.rectify.cat.health', 'health')}</option>
              <option value="move">{t('research.rectify.cat.move', 'move')}</option>
              <option value="other">{t('research.rectify.cat.other', 'other')}</option>
            </select>
            <input type="number" min={1} max={12} value={newEv.house} onChange={(e) => setNewEv({ ...newEv, house: +e.target.value })} placeholder={t('research.rectify.house', 'house')} className="p-1 rounded border border-vedicGold/30" />
            <select value={newEv.karaka} onChange={(e) => setNewEv({ ...newEv, karaka: e.target.value })} className="p-1 rounded border border-vedicGold/30">
              <option value="">{t('research.rectify.noKaraka', '(no karaka)')}</option>
              {PLANETS.map((k) => <option key={k} value={k}>{al.planet(k)}</option>)}
            </select>
          </div>
          <button onClick={addEv} className="mt-2 text-xs px-2 py-1 rounded bg-vedicMaroon text-white">{t('research.timeline.addEvent', '+ add event')}</button>
        </Card>
      </aside>
      <main className="space-y-3">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {loading && <EmptyState>{t('research.rectify.searching', 'Searching…')}</EmptyState>}
        {!result && !loading && !error && (
          <EmptyState>{t('research.rectify.empty', 'Enter approx birth details + known events, then Submit to rectify.')}</EmptyState>
        )}
        {result && (
          <>
            <Card title={t('research.rectify.bestMatch', 'Best match — confidence {conf}').replace('{conf}', String(result.confidence))}>
              <div className="text-sm font-semibold mb-1">
                {result.bestMatch.datetimeISO.replace('T', ' ').slice(0, 16)} UTC
              </div>
              <div className="text-xs text-vedicMaroon/70 mb-2">
                {t('research.rectify.scoreLine', 'Score: {score} · matched signatures: {matched}').replace('{score}', String(result.bestMatch.score)).replace('{matched}', String(result.bestMatch.matched))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px] mb-3">
                {Object.entries(result.bestMatch.scores).map(([k, v]) => (
                  <div key={k} className="p-1 rounded bg-vedicCream/40">
                    {/* TODO(i18n-server): localize score key labels */}
                    <div className="text-vedicMaroon/60 uppercase" lang="en">{k}</div>
                    <div className="font-semibold">{String(v)}</div>
                  </div>
                ))}
              </div>
              <ul className="text-xs list-disc pl-4">
                {/* TODO(i18n-server): localize commentary prose */}
                {result.commentary.map((c: string, i: number) => <li key={i} lang="en">{c}</li>)}
              </ul>
            </Card>
            <Card title={t('research.rectify.top10', 'Top 10 candidates')}>
              <table className="w-full text-[11px]">
                <thead><tr className="text-left text-vedicMaroon/60 border-b">
                  <th>{t('research.rectify.col.time', 'Time (UTC)')}</th>
                  <th>{t('research.rectify.col.score', 'Score')}</th>
                  <th>{t('research.rectify.col.vim', 'Vim')}</th>
                  <th>{t('research.rectify.col.d9', 'D9')}</th>
                  <th>{t('research.rectify.col.d10', 'D10')}</th>
                  <th>{t('research.rectify.col.tat', 'Tat')}</th>
                  <th>{t('research.rectify.col.lag', 'Lag')}</th>
                </tr></thead>
                <tbody>
                  {result.top.map((c: any, i: number) => (
                    <tr key={i} className={i === 0 ? 'bg-vedicMaroon/5' : ''}>
                      <td>{c.datetimeISO.replace('T', ' ').slice(0, 16)}</td>
                      <td><b>{c.score}</b></td>
                      <td>{c.scores.vimshottari}</td>
                      <td>{c.scores.navamsha}</td>
                      <td>{c.scores.dashamsa}</td>
                      <td>{c.scores.tattwa}</td>
                      <td>{c.scores.lagna}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Notebook
// ═══════════════════════════════════════════════════════════════════════════

function NotebookTab() {
  const { t } = useT();
  const [notes, setNotes] = useState<any[]>([]);
  const [kind, setKind] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ kind: 'freeform', title: '', body: '', tags: '' });

  async function refresh() {
    setLoading(true); setError(null);
    try {
      const r = await api.researchNotesList(kind || undefined);
      setNotes(r.notes);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  useEffect(() => { refresh(); }, [kind]);

  async function save() {
    if (!draft.title.trim()) return;
    setLoading(true); setError(null);
    try {
      const r = await api.researchNotesCreate({
        kind: draft.kind,
        title: draft.title.trim(),
        body: draft.body,
        tags: draft.tags.split(',').map((s) => s.trim()).filter(Boolean),
      });
      if (!r.ok) throw new Error(t('research.note.saveFailed', 'save failed'));
      setDraft({ kind: 'freeform', title: '', body: '', tags: '' });
      await refresh();
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  async function del(id: string) {
    if (!confirm(t('research.note.confirmDelete', 'Delete this note?'))) return;
    await api.researchNotesDelete(id);
    await refresh();
  }

  async function togglePin(n: any) {
    await api.researchNotesUpdate(n.id, { pinned: !n.pinned });
    await refresh();
  }

  function localizeKindLabel(k: string): string {
    return t(`research.note.kind.${k}`, k);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      <aside className="space-y-4">
        <Card title={t('research.note.new', 'New note')}>
          <div className="space-y-2 text-xs">
            <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value })}
              className="w-full p-1 rounded border border-vedicGold/30">
              <option value="freeform">{t('research.note.kind.freeform', 'freeform')}</option>
              <option value="pattern">{t('research.note.kind.pattern', 'pattern')}</option>
              <option value="sample">{t('research.note.kind.sample', 'sample')}</option>
              <option value="stat">{t('research.note.kind.stat', 'stat')}</option>
              <option value="match">{t('research.note.kind.match', 'match')}</option>
              <option value="rectify">{t('research.note.kind.rectify', 'rectify')}</option>
            </select>
            <input placeholder={t('research.note.title', 'Title')} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full p-1 rounded border border-vedicGold/30" />
            <textarea placeholder={t('research.note.bodyMd', 'Body (markdown)')} value={draft.body} rows={5}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              className="w-full p-1 rounded border border-vedicGold/30" />
            <input placeholder={t('research.note.tags', 'Tags (comma separated)')} value={draft.tags}
              onChange={(e) => setDraft({ ...draft, tags: e.target.value })}
              className="w-full p-1 rounded border border-vedicGold/30" />
            <button onClick={save} className="text-xs px-3 py-1 rounded bg-vedicMaroon text-white" disabled={loading}>
              {t('research.note.save', 'Save')}
            </button>
          </div>
        </Card>
        <Card title={t('research.note.filter', 'Filter')}>
          <select value={kind} onChange={(e) => setKind(e.target.value)}
            className="w-full text-xs p-1 rounded border border-vedicGold/30">
            <option value="">{t('research.note.kind.all', 'all')}</option>
            <option value="freeform">{t('research.note.kind.freeform', 'freeform')}</option>
            <option value="pattern">{t('research.note.kind.pattern', 'pattern')}</option>
            <option value="sample">{t('research.note.kind.sample', 'sample')}</option>
            <option value="stat">{t('research.note.kind.stat', 'stat')}</option>
            <option value="match">{t('research.note.kind.match', 'match')}</option>
            <option value="rectify">{t('research.note.kind.rectify', 'rectify')}</option>
          </select>
        </Card>
      </aside>
      <main className="space-y-3">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {!notes.length && !loading && !error && (
          <EmptyState>{t('research.note.empty', 'No notes yet. Save research findings from the panel on the left.')}</EmptyState>
        )}
        {notes.map((n) => (
          <Card key={n.id} title={n.title}>
            <div className="mb-2 flex items-center gap-2">
              <Pill tone="neutral">{localizeKindLabel(n.kind)}</Pill>
              {n.pinned && <span title={t('research.note.pinned', 'pinned')}>📌</span>}
            </div>
            {n.body && (
              // TODO(i18n-server): localize note body prose
              <pre className="whitespace-pre-wrap text-xs text-vedicMaroon/80" lang="en">{n.body}</pre>
            )}
            {n.tags?.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                {/* TODO(i18n-server): localize tag strings */}
                {n.tags.map((tg: string) => <Pill key={tg} tone="info"><span lang="en">{tg}</span></Pill>)}
              </div>
            )}
            <div className="mt-2 flex items-center gap-2 text-[11px] text-vedicMaroon/60">
              <span>{t('research.note.updated', 'updated {date}').replace('{date}', new Date(n.updatedAt).toLocaleDateString())}</span>
              <button onClick={() => togglePin(n)} className="underline">{n.pinned ? t('research.note.unpin', 'unpin') : t('research.note.pin', 'pin')}</button>
              <button onClick={() => del(n.id)} className="text-rose-700 underline">{t('research.note.delete', 'delete')}</button>
            </div>
          </Card>
        ))}
      </main>
    </div>
  );
}
