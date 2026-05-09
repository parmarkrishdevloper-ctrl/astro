// Phase 14 — Event prediction + auspiciousness graph.
//
// For a given birth chart + horizon (years), the server walks the
// Vimshottari Maha→Antar tree and emits event windows per category
// (marriage, children, career, property, travel, health, wealth) with
// probability tiers. Separately it yields a 0..100 auspiciousness score
// per year based on the dasha lords' dignities.
//
// Panels:
//   1. Birth form + years stepper
//   2. Auspiciousness line chart (score vs year)
//   3. Category chips (filter)
//   4. Event list (sorted by date, probability pill, dasha tag, reasoning)

import { useMemo, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type {
  BirthInput, EventWindow, AuspiciousnessPoint, EventProbability,
} from '../types';

const CATEGORIES: { key: string; labelKey: string; fallback: string; color: string }[] = [
  { key: 'marriage', labelKey: 'events.cat.marriage', fallback: 'Marriage',        color: 'bg-rose-500' },
  { key: 'children', labelKey: 'events.cat.children', fallback: 'Children',        color: 'bg-amber-500' },
  { key: 'career',   labelKey: 'events.cat.career',   fallback: 'Career growth',   color: 'bg-indigo-500' },
  { key: 'property', labelKey: 'events.cat.property', fallback: 'Property',        color: 'bg-emerald-500' },
  { key: 'travel',   labelKey: 'events.cat.travel',   fallback: 'Foreign travel',  color: 'bg-sky-500' },
  { key: 'health',   labelKey: 'events.cat.health',   fallback: 'Health concern',  color: 'bg-red-500' },
  { key: 'wealth',   labelKey: 'events.cat.wealth',   fallback: 'Financial gains', color: 'bg-yellow-500' },
];

const PROB_TONE: Record<EventProbability, 'good' | 'warn' | 'neutral'> = {
  High: 'good', Medium: 'warn', Low: 'neutral',
};

export function EventPredictionPage() {
  const { t } = useT();
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [years, setYears] = useState(30);
  const [events, setEvents] = useState<EventWindow[]>([]);
  const [graph, setGraph] = useState<AuspiciousnessPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCats, setActiveCats] = useState<Set<string>>(
    new Set(CATEGORIES.map((c) => c.key)),
  );

  async function handleSubmit(input: BirthInput) {
    setBirth(input);
    await run(input, years);
  }

  async function run(input: BirthInput, y: number) {
    setLoading(true); setError(null);
    try {
      const [ev, aus] = await Promise.all([
        api.predictEvents(input, y),
        api.auspiciousness(input, y),
      ]);
      setEvents(ev.events);
      setGraph(aus.points);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  async function handleYearsChange(y: number) {
    setYears(y);
    if (birth) await run(birth, y);
  }

  function toggleCat(key: string) {
    const next = new Set(activeCats);
    if (next.has(key)) next.delete(key); else next.add(key);
    setActiveCats(next);
  }

  const filtered = useMemo(
    () => events.filter((e) => activeCats.has(e.category)),
    [events, activeCats],
  );

  return (
    <PageShell
      title={t('events.title', 'Event Prediction')}
      subtitle={t('events.subtitle', 'Dasha-based event windows and year-by-year auspiciousness over your chosen horizon.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
          <HorizonCard years={years} onChange={handleYearsChange} disabled={!birth || loading} />
          {events.length > 0 && <CategoryLegend
            counts={countsByCategory(events)}
            active={activeCats}
            onToggle={toggleCat}
          />}
        </aside>

        <main className="space-y-6">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {!events.length && !loading && !error && (
            <EmptyState>{t('events.empty', 'Enter birth details to generate the event timeline.')}</EmptyState>
          )}
          {loading && <EmptyState>{t('events.computing', 'Walking the dasha tree…')}</EmptyState>}

          {events.length > 0 && (
            <>
              <AuspiciousnessGraph points={graph} />
              <EventsTimeline events={filtered} total={events.length} />
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

function HorizonCard({
  years, onChange, disabled,
}: { years: number; onChange: (n: number) => void; disabled: boolean }) {
  const { t } = useT();
  return (
    <div className="rounded-2xl border border-vedicGold/40 bg-white p-5 shadow-sm space-y-3 text-xs">
      <h3 className="text-sm font-semibold text-vedicMaroon">{t('events.horizon', 'Horizon (years)')}</h3>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(5, years - 5))}
          disabled={disabled || years <= 5}
          className="w-8 h-8 rounded border border-vedicMaroon/30 text-vedicMaroon hover:bg-vedicMaroon/5 disabled:opacity-30"
        >−</button>
        <input
          type="number" min={5} max={120} step={5}
          value={years}
          onChange={(e) => onChange(Math.max(5, Math.min(120, Number(e.target.value))))}
          disabled={disabled}
          className="flex-1 text-center rounded-md border border-vedicGold/40 bg-white px-2 py-1 tabular-nums"
        />
        <button
          onClick={() => onChange(Math.min(120, years + 5))}
          disabled={disabled || years >= 120}
          className="w-8 h-8 rounded border border-vedicMaroon/30 text-vedicMaroon hover:bg-vedicMaroon/5 disabled:opacity-30"
        >+</button>
      </div>
      <p className="text-[10px] text-vedicMaroon/60 italic">
        {t('events.horizonHint', 'Range from birth. Longer horizons surface Jupiter/Saturn-level events.')}
      </p>
    </div>
  );
}

function CategoryLegend({
  counts, active, onToggle,
}: {
  counts: Record<string, number>;
  active: Set<string>;
  onToggle: (k: string) => void;
}) {
  const { t } = useT();
  return (
    <div className="rounded-2xl border border-vedicGold/40 bg-white p-5 shadow-sm space-y-2 text-xs">
      <h3 className="text-sm font-semibold text-vedicMaroon mb-1">{t('events.filter', 'Filter by category')}</h3>
      {CATEGORIES.map((c) => {
        const on = active.has(c.key);
        return (
          <button key={c.key} onClick={() => onToggle(c.key)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition
              ${on ? 'bg-vedicMaroon/5' : 'opacity-40 hover:opacity-70'}`}>
            <span className={`w-3 h-3 rounded ${c.color}`} />
            <span className="flex-1 text-left text-vedicMaroon">{t(c.labelKey, c.fallback)}</span>
            <span className="tabular-nums text-vedicMaroon/60">{counts[c.key] ?? 0}</span>
          </button>
        );
      })}
    </div>
  );
}

function countsByCategory(events: EventWindow[]): Record<string, number> {
  const c: Record<string, number> = {};
  for (const e of events) c[e.category] = (c[e.category] ?? 0) + 1;
  return c;
}

function AuspiciousnessGraph({ points }: { points: AuspiciousnessPoint[] }) {
  const { t } = useT();
  if (points.length === 0) return null;
  const W = 100; const H = 40;
  const xStep = W / Math.max(1, points.length - 1);
  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * xStep).toFixed(2)},${(H - (p.score / 100) * H).toFixed(2)}`)
    .join(' ');
  const avg = Math.round(points.reduce((s, p) => s + p.score, 0) / points.length);
  const start = new Date(points[0].date);
  const end   = new Date(points[points.length - 1].date);
  return (
    <Card title={t('events.aus.title', 'Auspiciousness — {n} years · average {a}/100').replace('{n}', String(points.length)).replace('{a}', String(avg))}>
      <p className="text-[11px] text-vedicMaroon/60 mb-2">
        {t('events.aus.intro', 'Year-by-year score built from the dignity of the active Maha and Antar lords. 50 = neutral; 100 = exalted dasha lord in friendly antar.')}
      </p>
      <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full">
          <line x1="0" x2={W} y1={H / 2} y2={H / 2}
            stroke="#caa25b" strokeWidth="0.15" strokeDasharray="0.6 0.6" />
          <path d={`${pathD} L${W},${H} L0,${H} Z`} fill="#7a1e1e" fillOpacity="0.15" />
          <path d={pathD} fill="none" stroke="#7a1e1e" strokeWidth="0.35" />
          {points.map((p, i) => (
            <circle key={i} cx={i * xStep} cy={H - (p.score / 100) * H}
              r="0.4" fill="#7a1e1e">
              {/* TODO(i18n-server): localize dasha string */}
              <title>{t('events.aus.tip', '{d} · {s}/100 · {dasha}').replace('{d}', p.date.slice(0, 10)).replace('{s}', String(p.score)).replace('{dasha}', p.dasha)}</title>
            </circle>
          ))}
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-vedicMaroon/60 mt-1 tabular-nums">
        <span>{start.getUTCFullYear()}</span>
        <span>{end.getUTCFullYear()}</span>
      </div>
    </Card>
  );
}

function EventsTimeline({
  events, total,
}: { events: EventWindow[]; total: number }) {
  const { t } = useT();
  const sorted = [...events].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
  return (
    <Card title={t('events.timeline.title', 'Event windows — {shown}/{total} shown').replace('{shown}', String(sorted.length)).replace('{total}', String(total))}>
      {sorted.length === 0 && (
        <p className="text-sm text-vedicMaroon/60">{t('events.timeline.empty', 'No events match the active filters.')}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
              <th className="py-1">{t('events.colStart', 'Start')}</th>
              <th>{t('events.colEnd', 'End')}</th>
              <th>{t('events.colCategory', 'Category')}</th>
              <th>{t('events.colDasha', 'Dasha')}</th>
              <th>{t('events.colProbability', 'Probability')}</th>
              <th>{t('events.colWhy', 'Why')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e, i) => {
              const cat = CATEGORIES.find((c) => c.key === e.category);
              const catLabel = cat ? t(cat.labelKey, cat.fallback) : e.label;
              const probLabel = t(`events.prob.${e.probability}`, e.probability);
              return (
                <tr key={i} className="border-b border-vedicGold/10 align-top">
                  <td className="py-1 tabular-nums text-vedicMaroon/80">
                    {new Date(e.start).toLocaleDateString()}
                  </td>
                  <td className="tabular-nums text-vedicMaroon/60">
                    {new Date(e.end).toLocaleDateString()}
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${cat?.color ?? 'bg-slate-500'}`} />
                      <span className="font-semibold text-vedicMaroon">{catLabel}</span>
                    </span>
                  </td>
                  {/* TODO(i18n-server): localize dasha string */}
                  <td className="font-mono text-vedicMaroon" lang="en">{e.dasha}</td>
                  <td><Pill tone={PROB_TONE[e.probability]}>{probLabel}</Pill></td>
                  {/* TODO(i18n-server): localize reason */}
                  <td className="text-vedicMaroon/70 text-[11px]" lang="en">{e.reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
