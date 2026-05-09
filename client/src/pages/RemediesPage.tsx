// Phase 12 — Remedies page.
//
// Three tabs:
//   1. Yantras   — 9-planet catalog with magic squares, bijas, installation
//   2. Gemstones — chart-aware recommendation + up-ratnas + wearing muhurat
//   3. Log       — remedy journal (start, track sessions, complete)

import { FormEvent, useEffect, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { AstroTranslator } from '../i18n/astro-labels';
import type { BirthInput } from '../types';

type Tab = 'yantras' | 'gemstones' | 'log';

const PLANETS = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA', 'RA', 'KE'] as const;
type PlanetId = typeof PLANETS[number];

type T = (key: string, fallback?: string) => string;

const KIND_OPTIONS = ['yantra', 'gemstone', 'mantra', 'fasting', 'donation', 'ritual', 'other'] as const;
const STATUS_OPTIONS = ['planned', 'active', 'paused', 'completed', 'abandoned'] as const;

function localizeKind(t: T, k: string): string {
  return t(`remedies.log.kind.${k}`, k);
}
function localizeStatus(t: T, s: string): string {
  return t(`remedies.log.status.${s}`, s);
}

export function RemediesPage() {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>('yantras');

  const tabLabels: Record<Tab, string> = {
    yantras:   t('remedies.tab.yantras', 'Yantras'),
    gemstones: t('remedies.tab.gemstones', 'Gemstones'),
    log:       t('remedies.tab.log', 'Log'),
  };

  return (
    <PageShell
      title={t('remedies.title', 'Remedies')}
      subtitle={t('remedies.subtitle', '9-planet yantras · chart-aware gemstone recommendations · remedy journal.')}
    >
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-vedicGold/30 bg-vedicCream/30 w-fit mb-4">
        {(['yantras', 'gemstones', 'log'] as Tab[]).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === k ? 'bg-vedicMaroon text-white' : 'text-vedicMaroon/70 hover:bg-vedicMaroon/5'
            }`}>
            {tabLabels[k]}
          </button>
        ))}
      </div>

      {tab === 'yantras'   && <YantrasTab />}
      {tab === 'gemstones' && <GemstonesTab />}
      {tab === 'log'       && <LogTab />}
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 1: Yantras
// ═══════════════════════════════════════════════════════════════════════════

function YantrasTab() {
  const { t } = useT();
  const [yantras, setYantras] = useState<any[] | null>(null);
  const [active, setActive] = useState<PlanetId>('SU');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.yantrasList()
      .then((r) => setYantras(r.yantras))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorBanner>{error}</ErrorBanner>;
  if (!yantras) return <EmptyState>{t('remedies.yantras.loading', 'Loading yantra catalog…')}</EmptyState>;

  const yantra = yantras.find((y) => y.planet === active) || yantras[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-4">
      <aside className="space-y-1">
        {yantras.map((y) => (
          <button key={y.planet} onClick={() => setActive(y.planet)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition ${
              active === y.planet
                ? 'bg-vedicMaroon/10 border-vedicMaroon/40'
                : 'bg-parchment/40 border-vedicGold/20 hover:bg-parchment'
            }`}>
            <div className="font-semibold text-vedicMaroon">{y.name}</div>
            <div className="text-[10px] text-vedicMaroon/60">{y.sanskritName}</div>
          </button>
        ))}
      </aside>

      <main className="space-y-3">
        <Card title={t('remedies.yantras.cardTitle', '{name} — {sanskrit}')
          .replace('{name}', yantra.name)
          .replace('{sanskrit}', yantra.sanskritName)}>
          <div className="flex flex-wrap gap-2 mb-3">
            <Pill tone="info">{yantra.metal}</Pill>
            <Pill tone="neutral">{yantra.day}</Pill>
            <Pill tone="neutral">{yantra.direction}</Pill>
            <Pill tone="neutral">{yantra.shape}</Pill>
            <Pill tone="warn">{t('remedies.yantras.japas', '{n} japas').replace('{n}', yantra.japaCount.toLocaleString())}</Pill>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 items-start">
            <MagicSquare square={yantra.magicSquare} sum={yantra.magicSum} colour={yantra.colour} t={t} />
            <div className="space-y-2 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50">{t('remedies.yantras.bija', 'Bija Mantra')}</div>
                <div className="font-semibold text-vedicMaroon" style={{ fontSize: '14px' }}>{yantra.bija}</div>
                <div className="text-[10px] text-vedicMaroon/60 italic" lang="en">{yantra.bijaTranslit}</div>
              </div>
              {yantra.gayatri && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50">{t('remedies.yantras.gayatri', 'Gayatri')}</div>
                  <div className="text-vedicMaroon/80">{yantra.gayatri}</div>
                </div>
              )}
              <div className="flex gap-3 text-vedicMaroon/70">
                <span><strong>{t('remedies.yantras.colour', 'Colour:')}</strong> {yantra.colour}</span>
                {yantra.mudra && <span><strong>{t('remedies.yantras.mudra', 'Mudra:')}</strong> {yantra.mudra}</span>}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card title={t('remedies.yantras.installation', 'Installation procedure')}>
            <ol className="space-y-1.5 text-xs list-decimal pl-5">
              {yantra.installation.map((step: string, i: number) => (
                <li key={i} className="text-vedicMaroon/80">{step}</li>
              ))}
            </ol>
          </Card>
          <Card title={t('remedies.yantras.prescribeWhen', 'Prescribe when')}>
            <ul className="space-y-1.5 text-xs list-disc pl-5">
              {yantra.prescribeWhen.map((c: string, i: number) => (
                <li key={i} className="text-vedicMaroon/80">{c}</li>
              ))}
            </ul>
          </Card>
        </div>

        <Card title={t('remedies.yantras.benefits', 'Benefits')}>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-xs list-disc pl-5">
            {yantra.benefits.map((b: string, i: number) => (
              <li key={i} className="text-vedicMaroon/80">{b}</li>
            ))}
          </ul>
        </Card>
      </main>
    </div>
  );
}

function MagicSquare({ square, sum, colour, t }: { square: number[][]; sum: number; colour: string; t: T }) {
  const accent = colour.toLowerCase().includes('red') ? 'bg-red-50 border-red-300' :
                 colour.toLowerCase().includes('yellow') ? 'bg-yellow-50 border-yellow-300' :
                 colour.toLowerCase().includes('white') ? 'bg-gray-50 border-gray-300' :
                 colour.toLowerCase().includes('green') ? 'bg-green-50 border-green-300' :
                 colour.toLowerCase().includes('blue') || colour.toLowerCase().includes('dark') ? 'bg-blue-50 border-blue-300' :
                 colour.toLowerCase().includes('smoky') || colour.toLowerCase().includes('grey') ? 'bg-stone-100 border-stone-400' :
                 'bg-parchment border-vedicGold/40';
  return (
    <div className="inline-block">
      <div className={`grid grid-cols-3 border-2 ${accent}`}>
        {square.flat().map((n, i) => (
          <div key={i} className="w-12 h-12 flex items-center justify-center border border-vedicMaroon/20 text-vedicMaroon font-display font-bold text-lg">
            {n}
          </div>
        ))}
      </div>
      <div className="text-center mt-1 text-[10px] text-vedicMaroon/60">{t('remedies.yantras.magicSum', 'Magic sum · {sum}').replace('{sum}', String(sum))}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 2: Gemstones
// ═══════════════════════════════════════════════════════════════════════════

function GemstonesTab() {
  const { t, al } = useT();
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ageYears, setAgeYears] = useState(30);
  const [bodyFrame, setBodyFrame] = useState<'small' | 'medium' | 'large'>('medium');
  const [lastInput, setLastInput] = useState<BirthInput | null>(null);

  async function handleSubmit(input: BirthInput) {
    setLoading(true); setError(null); setReport(null);
    setLastInput(input);
    try {
      const r = await api.gemstonesRecommend({ ...input, ageYears, bodyFrame });
      setReport(r.report);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  async function rerun() {
    if (!lastInput) return;
    await handleSubmit(lastInput);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      <aside className="space-y-3">
        <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
        <Card title={t('remedies.gem.personalization', 'Personalization')}>
          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2">
              <span className="w-24 text-vedicMaroon/70">{t('remedies.gem.age', 'Age')}</span>
              <input type="number" min={1} max={120} value={ageYears}
                onChange={(e) => setAgeYears(Number(e.target.value))}
                onBlur={rerun}
                className="w-16 px-2 py-1 rounded border border-vedicGold/30 bg-white text-right" />
              <span className="text-[10px] text-vedicMaroon/50">{t('remedies.gem.years', 'years')}</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="w-24 text-vedicMaroon/70">{t('remedies.gem.bodyFrame', 'Body frame')}</span>
              <select value={bodyFrame} onChange={(e) => { setBodyFrame(e.target.value as any); }}
                onBlur={rerun}
                className="px-2 py-1 rounded border border-vedicGold/30 bg-white">
                <option value="small">{t('remedies.gem.frameSmall', 'Small')}</option>
                <option value="medium">{t('remedies.gem.frameMedium', 'Medium')}</option>
                <option value="large">{t('remedies.gem.frameLarge', 'Large')}</option>
              </select>
            </label>
            <p className="text-[10px] text-vedicMaroon/50 italic">
              {t('remedies.gem.weightNote', 'Weight is scaled by age/frame — resubmit to recompute.')}
            </p>
          </div>
        </Card>
      </aside>

      <main className="space-y-3">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {loading && <EmptyState>{t('remedies.gem.analyzing', 'Analyzing functional benefics and malefics…')}</EmptyState>}
        {!report && !loading && !error && (
          <EmptyState>{t('remedies.gem.empty', 'Enter birth details to generate a chart-aware gem prescription.')}</EmptyState>
        )}

        {report && <GemstoneReportView report={report} t={t} al={al} />}
      </main>
    </div>
  );
}

function GemstoneReportView({ report, t, al }: { report: any; t: T; al: AstroTranslator }) {
  const primary = report.primary;
  return (
    <>
      <Card title={t('remedies.gem.ascendant', 'Ascendant — {name} (lord: {lord})')
        .replace('{name}', al.rashiByName(report.ascendant.name))
        .replace('{lord}', al.planet(report.ascendant.lord))}>
        <p className="text-xs text-vedicMaroon/70">{report.note}</p>
      </Card>

      {primary && (
        <Card title={t('remedies.gem.primary', 'Primary: {stone} — {planet}')
          .replace('{stone}', primary.gemstone.primary)
          .replace('{planet}', al.planet(primary.planet))}>
          <div className="flex flex-wrap gap-2 mb-3">
            <Pill tone="good">{primary.verdict}</Pill>
            <Pill tone="info">{t('remedies.gem.weight', '{r} ratti ({c} ct)').replace('{r}', String(primary.weightRatti)).replace('{c}', String(primary.weightCarat))}</Pill>
            <Pill tone="info">{t('remedies.gem.metalFinger', '{metal} · {finger} finger').replace('{metal}', primary.gemstone.metal).replace('{finger}', primary.gemstone.finger)}</Pill>
            <Pill tone="neutral">{primary.gemstone.colour}</Pill>
          </div>
          <div className="text-xs text-vedicMaroon/70 space-y-1 mb-3">
            {primary.reasons.map((r: string, i: number) => <div key={i}>• {r}</div>)}
          </div>
          <div className="text-xs">
            <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50 mb-1">{t('remedies.gem.upRatnas', 'Up-ratnas (substitutes)')}</div>
            <div className="flex flex-wrap gap-1.5">
              {primary.gemstone.upRatnas.map((u: string) => (
                <span key={u} className="px-2 py-0.5 rounded bg-parchment border border-vedicGold/30 text-vedicMaroon/80">{u}</span>
              ))}
            </div>
          </div>
        </Card>
      )}

      {report.wearingMuhurat && (
        <Card title={t('remedies.gem.wearingMuhurat', 'Wearing muhurat')}>
          <div className="flex flex-wrap gap-2 mb-3">
            <Pill tone="info">{al.vara(report.wearingMuhurat.day)}</Pill>
            <Pill tone="neutral">{t('remedies.gem.next', 'Next: {date}').replace('{date}', report.wearingMuhurat.nextDateISO)}</Pill>
            <Pill tone="warn">{t('remedies.gem.hora', 'Hora: {p}').replace('{p}', al.planet(report.wearingMuhurat.horaPlanet))}</Pill>
            <Pill tone="neutral">{t('remedies.yantras.japas', '{n} japas').replace('{n}', report.wearingMuhurat.mantraCount.toLocaleString())}</Pill>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50 mb-1">{t('remedies.gem.bestHours', 'Best horas (from sunrise)')}</div>
              <ul className="space-y-0.5 font-mono text-vedicMaroon/80">
                {report.wearingMuhurat.bestHours.map((h: string, i: number) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50 mb-1">{t('remedies.gem.favNak', 'Favourable nakshatras')}</div>
              <div className="flex flex-wrap gap-1">
                {report.wearingMuhurat.nakshatraPreference.map((n: string) => (
                  <span key={n} className="px-1.5 py-0.5 rounded bg-parchment border border-vedicGold/30 text-[11px] text-vedicMaroon/80">{n}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs">
            <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50 mb-1">{t('remedies.gem.procedure', 'Procedure')}</div>
            <ol className="list-decimal pl-5 space-y-1 text-vedicMaroon/80">
              {report.wearingMuhurat.procedure.map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </div>
        </Card>
      )}

      <Card title={t('remedies.gem.allGrahas', 'All 9 grahas — prescription verdict')}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60">
              <th className="py-1">{t('remedies.gem.col.graha', 'Graha')}</th>
              <th>{t('remedies.gem.col.stone', 'Stone')}</th>
              <th>{t('remedies.gem.col.verdict', 'Verdict')}</th>
              <th>{t('remedies.gem.col.weight', 'Weight')}</th>
              <th>{t('remedies.gem.col.finger', 'Finger')}</th>
              <th>{t('remedies.gem.col.score', 'Score')}</th>
            </tr>
          </thead>
          <tbody>
            {report.recommendations.map((r: any) => (
              <tr key={r.planet} className="border-t border-vedicGold/10">
                <td className="py-1 font-mono">{al.planet(r.planet)}</td>
                <td>{r.gemstone.primary}</td>
                <td>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    r.verdict.includes('strongly') ? 'bg-green-200 text-green-900' :
                    r.verdict === 'recommended' ? 'bg-green-100 text-green-800' :
                    r.verdict === 'avoid' ? 'bg-red-100 text-red-800' :
                    r.verdict.includes('strictly') ? 'bg-red-200 text-red-900' :
                    'bg-gray-100 text-gray-700'
                  }`}>{r.verdict}</span>
                </td>
                <td className="font-mono">{t('remedies.gem.weightShort', '{r}r ({c}ct)').replace('{r}', String(r.weightRatti)).replace('{c}', String(r.weightCarat))}</td>
                <td>{r.gemstone.finger}</td>
                <td className="font-mono">{r.priorityScore > 0 ? '+' : ''}{r.priorityScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {report.avoid.length > 0 && (
        <Card title={t('remedies.gem.avoid', 'Strictly avoid ({n})').replace('{n}', String(report.avoid.length))}>
          <ul className="space-y-1.5 text-xs">
            {report.avoid.map((r: any) => (
              <li key={r.planet} className="text-vedicMaroon/80">
                <strong className="text-red-700">{r.gemstone.primary}</strong> ({al.planet(r.planet)}):
                {' '}<span>{r.reasons.slice(0, 2).join(' · ')}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tab 3: Log
// ═══════════════════════════════════════════════════════════════════════════

function LogTab() {
  const { t, al } = useT();
  const [entries, setEntries] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{ status?: string; kind?: string; planet?: string }>({});
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      const r = await api.remedyLogList(filter);
      setEntries(r.entries);
    } catch (e) { setError((e as Error).message); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter.status, filter.kind, filter.planet]);

  async function handleDelete(id: string) {
    if (!confirm(t('remedies.log.confirmDelete', 'Delete this remedy log?'))) return;
    await api.remedyLogDelete(id);
    load();
  }

  async function handleSession(id: string, count = 108) {
    await api.remedyLogSession(id, { count });
    load();
  }

  async function handleStatus(id: string, status: string) {
    await api.remedyLogUpdate(id, { status });
    load();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select value={filter.status || ''} onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
          className="text-xs px-2 py-1 rounded border border-vedicGold/30 bg-white">
          <option value="">{t('remedies.log.allStatuses', 'All statuses')}</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{localizeStatus(t, s)}</option>)}
        </select>
        <select value={filter.kind || ''} onChange={(e) => setFilter({ ...filter, kind: e.target.value || undefined })}
          className="text-xs px-2 py-1 rounded border border-vedicGold/30 bg-white">
          <option value="">{t('remedies.log.allKinds', 'All kinds')}</option>
          {KIND_OPTIONS.map((k) => <option key={k} value={k}>{localizeKind(t, k)}</option>)}
        </select>
        <select value={filter.planet || ''} onChange={(e) => setFilter({ ...filter, planet: e.target.value || undefined })}
          className="text-xs px-2 py-1 rounded border border-vedicGold/30 bg-white">
          <option value="">{t('remedies.log.allPlanets', 'All planets')}</option>
          {PLANETS.map((p) => <option key={p} value={p}>{al.planet(p)}</option>)}
        </select>
        <div className="flex-1" />
        <button onClick={() => setShowForm((v) => !v)}
          className="btn btn-primary text-xs px-3 py-1.5">
          {showForm ? t('remedies.log.cancel', 'Cancel') : t('remedies.log.newRemedy', '+ New remedy')}
        </button>
      </div>

      {showForm && <NewRemedyForm onCreated={() => { load(); setShowForm(false); }} />}

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {!entries && !error && <EmptyState>{t('remedies.log.loading', 'Loading…')}</EmptyState>}
      {entries && entries.length === 0 && (
        <EmptyState>{t('remedies.log.noEntries', "No remedies logged yet. Start tracking yantras, gems, or mantras you've undertaken.")}</EmptyState>
      )}

      {entries && entries.map((e) => (
        <RemedyLogCard key={e._id} entry={e}
          onDelete={() => handleDelete(e._id)}
          onSession={() => handleSession(e._id, e.recurrence?.countPerSession || 108)}
          onStatus={(s) => handleStatus(e._id, s)}
        />
      ))}
    </div>
  );
}

function RemedyLogCard({
  entry, onDelete, onSession, onStatus,
}: {
  entry: any;
  onDelete: () => void;
  onSession: () => void;
  onStatus: (s: string) => void;
}) {
  const { t, al } = useT();
  const progress = entry.progress || {};
  const pct = progress.targetCount && progress.totalCount
    ? Math.min(100, Math.round((progress.totalCount / progress.targetCount) * 100))
    : null;
  const statusTone =
    entry.status === 'completed' ? 'good' :
    entry.status === 'active'    ? 'info' :
    entry.status === 'paused'    ? 'warn' :
    entry.status === 'abandoned' ? 'bad' : 'neutral';

  return (
    <Card title={entry.title}>
      <div className="flex flex-wrap gap-2 mb-2">
        <Pill tone="neutral">{localizeKind(t, entry.kind)}</Pill>
        {entry.planet && <Pill tone="info">{al.planet(entry.planet)}</Pill>}
        <Pill tone={statusTone as any}>{localizeStatus(t, entry.status)}</Pill>
        {progress.sessionsCompleted > 0 && (
          <Pill tone="neutral">{t('remedies.log.sessionsCompleted', '{n} sessions').replace('{n}', String(progress.sessionsCompleted))}</Pill>
        )}
      </div>
      {entry.details && <p className="text-xs text-vedicMaroon/70 mb-2">{entry.details}</p>}
      {pct !== null && (
        <div className="mb-2">
          <div className="h-2 rounded bg-parchment overflow-hidden">
            <div className="h-full bg-vedicMaroon" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-[10px] text-vedicMaroon/60 mt-1 font-mono">
            {progress.totalCount?.toLocaleString() || 0} / {progress.targetCount?.toLocaleString()} — {pct}%
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-2 text-[11px]">
        <button onClick={onSession}
          className="px-2 py-1 rounded bg-vedicMaroon/10 text-vedicMaroon hover:bg-vedicMaroon/20">
          {t('remedies.log.session', '+ Session ({n})').replace('{n}', String(entry.recurrence?.countPerSession || 108))}
        </button>
        <select value={entry.status}
          onChange={(e) => onStatus(e.target.value)}
          className="px-2 py-1 rounded border border-vedicGold/30 bg-white">
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{localizeStatus(t, s)}</option>)}
        </select>
        <button onClick={onDelete}
          className="px-2 py-1 rounded text-red-700 hover:bg-red-50">
          {t('remedies.log.delete', 'Delete')}
        </button>
      </div>
    </Card>
  );
}

function NewRemedyForm({ onCreated }: { onCreated: () => void }) {
  const { t, al } = useT();
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<typeof KIND_OPTIONS[number]>('mantra');
  const [planet, setPlanet] = useState<PlanetId | ''>('');
  const [details, setDetails] = useState('');
  const [targetCount, setTargetCount] = useState<number>(108);
  const [countPerSession, setCountPerSession] = useState<number>(108);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setErr(t('remedies.log.titleRequired', 'Title required')); return; }
    setSaving(true); setErr(null);
    try {
      await api.remedyLogCreate({
        title: title.trim(),
        kind,
        planet: planet || undefined,
        details: details.trim() || undefined,
        progress: { sessionsCompleted: 0, totalCount: 0, targetCount },
        recurrence: { countPerSession },
        status: 'planned',
      });
      onCreated();
    } catch (e) { setErr((e as Error).message); }
    finally { setSaving(false); }
  }

  return (
    <Card title={t('remedies.log.formTitle', 'New remedy log entry')}>
      <form onSubmit={submit} className="space-y-2 text-xs">
        {err && <div className="text-red-700 text-[11px]">{err}</div>}
        <label className="block">
          <span className="text-vedicMaroon/70">{t('remedies.log.titleField', 'Title')}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={t('remedies.log.titlePlaceholder', 'e.g. Shani bija mantra — 23000 japas')}
            className="w-full mt-1 px-2 py-1.5 rounded border border-vedicGold/30 bg-white" />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className="block">
            <span className="text-vedicMaroon/70">{t('remedies.log.kind', 'Kind')}</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as any)}
              className="w-full mt-1 px-2 py-1.5 rounded border border-vedicGold/30 bg-white">
              {KIND_OPTIONS.map((k) => <option key={k} value={k}>{localizeKind(t, k)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-vedicMaroon/70">{t('remedies.log.planet', 'Planet')}</span>
            <select value={planet} onChange={(e) => setPlanet(e.target.value as any)}
              className="w-full mt-1 px-2 py-1.5 rounded border border-vedicGold/30 bg-white">
              <option value="">—</option>
              {PLANETS.map((p) => <option key={p} value={p}>{al.planet(p)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-vedicMaroon/70">{t('remedies.log.targetCount', 'Target count')}</span>
            <input type="number" min={1} value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className="w-full mt-1 px-2 py-1.5 rounded border border-vedicGold/30 bg-white" />
          </label>
        </div>
        <label className="block">
          <span className="text-vedicMaroon/70">{t('remedies.log.perSession', 'Per-session count')}</span>
          <input type="number" min={1} value={countPerSession}
            onChange={(e) => setCountPerSession(Number(e.target.value))}
            className="w-full mt-1 px-2 py-1.5 rounded border border-vedicGold/30 bg-white" />
        </label>
        <label className="block">
          <span className="text-vedicMaroon/70">{t('remedies.log.details', 'Details')}</span>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)}
            rows={2}
            className="w-full mt-1 px-2 py-1.5 rounded border border-vedicGold/30 bg-white" />
        </label>
        <button type="submit" disabled={saving} className="btn btn-primary text-xs px-3 py-1.5">
          {saving ? t('remedies.log.saving', 'Saving…') : t('remedies.log.create', 'Create')}
        </button>
      </form>
    </Card>
  );
}
