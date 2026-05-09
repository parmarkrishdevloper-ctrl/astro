// Phase 13 — Birth-Time Rectification.
//
// Given an approximate birth moment and a list of known life events (date
// + house theme), the server tests candidate times in 1-minute steps within
// a ±window and scores each against Vimshottari dashas. The best-scoring
// candidate is the rectified birth time.
//
// Panels:
//   1. Birth form (approximate time)
//   2. Events editor (date + house + weight rows, add/remove/preset)
//   3. Window stepper (±minutes)
//   4. Best-match card + score-vs-time graph + ranked candidates table

import { useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type {
  BirthInput, RectificationEventInput, RectificationResult,
} from '../types';

const HOUSE_THEMES: { house: number; themeKey: string; themeFallback: string }[] = [
  { house: 1,  themeKey: 'rectify.theme.1',  themeFallback: 'Self / health' },
  { house: 2,  themeKey: 'rectify.theme.2',  themeFallback: 'Wealth / family' },
  { house: 3,  themeKey: 'rectify.theme.3',  themeFallback: 'Siblings / travel' },
  { house: 4,  themeKey: 'rectify.theme.4',  themeFallback: 'Home / property' },
  { house: 5,  themeKey: 'rectify.theme.5',  themeFallback: 'Children / romance' },
  { house: 6,  themeKey: 'rectify.theme.6',  themeFallback: 'Disease / debt / litigation' },
  { house: 7,  themeKey: 'rectify.theme.7',  themeFallback: 'Marriage / partnership' },
  { house: 8,  themeKey: 'rectify.theme.8',  themeFallback: 'Longevity / crisis' },
  { house: 9,  themeKey: 'rectify.theme.9',  themeFallback: 'Father / fortune' },
  { house: 10, themeKey: 'rectify.theme.10', themeFallback: 'Career / status' },
  { house: 11, themeKey: 'rectify.theme.11', themeFallback: 'Gains / goals' },
  { house: 12, themeKey: 'rectify.theme.12', themeFallback: 'Loss / foreign' },
];

export function RectificationPage() {
  const { t } = useT();
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [events, setEvents] = useState<RectificationEventInput[]>([
    { date: '2015-02-14', house: 7, weight: 1 },
    { date: '2018-06-01', house: 10, weight: 1 },
    { date: '2020-11-20', house: 5, weight: 1 },
  ]);
  const [windowMinutes, setWindowMinutes] = useState(30);
  const [result, setResult] = useState<RectificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleBirthSubmit(input: BirthInput) {
    setBirth(input);
    await run(input, events, windowMinutes);
  }

  async function run(input: BirthInput, evs: RectificationEventInput[], w: number) {
    if (evs.length === 0) { setError(t('rectify.errorAtLeastOne', 'Add at least one event to rectify.')); return; }
    setLoading(true); setError(null);
    try {
      const r = await api.rectify(input, evs, w);
      setResult(r.result);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  function addEvent() {
    setEvents([...events, { date: new Date().toISOString().slice(0, 10), house: 1, weight: 1 }]);
  }
  function removeEvent(i: number) {
    setEvents(events.filter((_, idx) => idx !== i));
  }
  function updateEvent(i: number, patch: Partial<RectificationEventInput>) {
    setEvents(events.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  async function rerun() {
    if (birth) await run(birth, events, windowMinutes);
  }

  return (
    <PageShell
      title={t('rectify.title', 'Rectification')}
      subtitle={t('rectify.subtitle', 'Find the true birth minute by scoring candidates against known life events and Vimshottari dashas.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={handleBirthSubmit} loading={loading} />
          <WindowCard
            windowMinutes={windowMinutes}
            setWindowMinutes={setWindowMinutes}
            onRerun={rerun}
            disabled={!birth || loading}
          />
        </aside>

        <main className="space-y-6">
          {error && <ErrorBanner>{error}</ErrorBanner>}

          <EventsEditor
            events={events}
            onAdd={addEvent}
            onRemove={removeEvent}
            onUpdate={updateEvent}
            onRerun={rerun}
            canRerun={!!birth && !loading}
          />

          {!result && !loading && !error && (
            <EmptyState>{t('rectify.empty', 'Enter approximate birth details and at least one event to rectify.')}</EmptyState>
          )}
          {loading && <EmptyState>{t('rectify.scoring', 'Scoring candidates…')}</EmptyState>}

          {result && (
            <>
              <BestMatchCard
                result={result}
                original={birth?.datetime}
                tzOffsetHours={birth?.tzOffsetHours}
              />
              <ScoreGraph result={result} />
              <CandidatesTable result={result} />
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

function WindowCard({
  windowMinutes, setWindowMinutes, onRerun, disabled,
}: {
  windowMinutes: number; setWindowMinutes: (n: number) => void;
  onRerun: () => void; disabled: boolean;
}) {
  const { t } = useT();
  return (
    <div className="rounded-2xl border border-vedicGold/40 bg-white p-5 shadow-sm space-y-3 text-xs">
      <h3 className="text-sm font-semibold text-vedicMaroon">{t('rectify.window', 'Search window')}</h3>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setWindowMinutes(Math.max(5, windowMinutes - 5))}
          disabled={disabled || windowMinutes <= 5}
          className="w-8 h-8 rounded border border-vedicMaroon/30 text-vedicMaroon hover:bg-vedicMaroon/5 disabled:opacity-30"
        >−</button>
        <input
          type="number" min={5} max={240} step={5}
          value={windowMinutes}
          onChange={(e) => setWindowMinutes(Math.max(5, Math.min(240, Number(e.target.value))))}
          disabled={disabled}
          className="flex-1 text-center rounded-md border border-vedicGold/40 bg-white px-2 py-1 tabular-nums"
        />
        <button
          onClick={() => setWindowMinutes(Math.min(240, windowMinutes + 5))}
          disabled={disabled || windowMinutes >= 240}
          className="w-8 h-8 rounded border border-vedicMaroon/30 text-vedicMaroon hover:bg-vedicMaroon/5 disabled:opacity-30"
        >+</button>
        <span className="text-vedicMaroon/70 text-[11px]">{t('rectify.windowMin', 'min')}</span>
      </div>
      <p className="text-[10px] text-vedicMaroon/60 italic">
        {t('rectify.windowHint', 'Tests every minute from −{w} to +{w} around the approximate birth time.').replace(/\{w\}/g, String(windowMinutes))}
      </p>
      <button onClick={onRerun} disabled={disabled}
        className="btn btn-primary w-full text-xs">{t('rectify.rerun', 'Re-run rectification')}</button>
    </div>
  );
}

function EventsEditor({
  events, onAdd, onRemove, onUpdate, onRerun, canRerun,
}: {
  events: RectificationEventInput[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, patch: Partial<RectificationEventInput>) => void;
  onRerun: () => void;
  canRerun: boolean;
}) {
  const { t } = useT();
  return (
    <Card
      title={t('rectify.events.title', 'Life events ({n}) — date + significator house').replace('{n}', String(events.length))}
      action={
        <button onClick={onAdd} className="btn btn-ghost text-xs">{t('rectify.events.add', '+ Add event')}</button>
      }
    >
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('rectify.events.intro', 'Pick a house whose theme matches each event. Higher weight = stronger anchor. Standard mappings: marriage 7 · career 10 · child 5 · surgery 6 · father 9 · property 4.')}
      </p>
      {events.length === 0 && (
        <p className="text-sm text-vedicMaroon/60">{t('rectify.events.empty', 'No events yet — click + Add event to start.')}</p>
      )}
      <div className="space-y-2">
        {events.map((ev, i) => {
          const themeEntry = HOUSE_THEMES.find((th) => th.house === ev.house);
          const themeText = themeEntry ? t(themeEntry.themeKey, themeEntry.themeFallback) : '—';
          return (
            <div key={i} className="flex gap-2 items-center text-xs">
              <input
                type="date"
                value={ev.date}
                onChange={(e) => onUpdate(i, { date: e.target.value })}
                className="input tabular-nums"
                style={{ maxWidth: 150 }}
              />
              <select
                value={ev.house}
                onChange={(e) => onUpdate(i, { house: Number(e.target.value) })}
                className="input"
                style={{ maxWidth: 220 }}
              >
                {HOUSE_THEMES.map((th) => (
                  <option key={th.house} value={th.house}>
                    {t('rectify.events.option', 'H{h} · {theme}').replace('{h}', String(th.house)).replace('{theme}', t(th.themeKey, th.themeFallback))}
                  </option>
                ))}
              </select>
              <input
                type="number" min={0.25} max={5} step={0.25}
                value={ev.weight ?? 1}
                onChange={(e) => onUpdate(i, { weight: Number(e.target.value) })}
                className="input tabular-nums"
                style={{ maxWidth: 80 }}
              />
              <span className="text-vedicMaroon/50 flex-1 truncate">{themeText}</span>
              <button
                onClick={() => onRemove(i)}
                className="text-red-500 hover:text-red-700 text-lg px-2"
                title={t('rectify.events.removeTitle', 'Remove event')}
              >×</button>
            </div>
          );
        })}
      </div>
      {events.length > 0 && (
        <div className="mt-3">
          <button onClick={onRerun} disabled={!canRerun}
            className="btn btn-primary text-xs">{t('rectify.events.runWith', 'Run rectification with these events')}</button>
        </div>
      )}
    </Card>
  );
}

function BestMatchCard({
  result, original, tzOffsetHours,
}: {
  result: RectificationResult;
  original?: string;
  tzOffsetHours?: number;
}) {
  const { t } = useT();
  const best = result.bestMatch;
  const deltaMinutes = original
    ? (new Date(best.datetimeISO).getTime() - new Date(original).getTime()) / 60_000
    : null;
  const localStr = formatLocal(best.datetimeISO, tzOffsetHours, t);
  return (
    <Card title={t('rectify.best', 'Best match')}>
      <div className="rounded-lg border border-emerald-400/50 bg-emerald-50/40 p-4 flex items-center gap-6 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-emerald-700 mb-1">{t('rectify.best.label', 'Rectified birth time')}</div>
          <div className="text-2xl font-bold text-emerald-900 tabular-nums">{localStr}</div>
          <div className="text-[11px] text-vedicMaroon/60 mt-0.5">{new Date(best.datetimeISO).toUTCString()}</div>
        </div>
        <div className="flex gap-4 text-xs">
          <Stat label={t('common.score', 'Score')}>{best.score.toFixed(1)}</Stat>
          <Stat label={t('rectify.best.matchedSignals', 'Matched signals')}>{best.matchedEvents}</Stat>
          {deltaMinutes !== null && (
            <Stat label={t('rectify.best.shift', 'Shift')}>
              <span className={deltaMinutes === 0 ? 'text-vedicMaroon/60'
                : deltaMinutes > 0 ? 'text-emerald-700' : 'text-red-700'}>
                {deltaMinutes === 0 ? '±0'
                  : `${deltaMinutes > 0 ? '+' : ''}${deltaMinutes.toFixed(0)}m`}
              </span>
            </Stat>
          )}
        </div>
      </div>
    </Card>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/60">{label}</div>
      <div className="text-lg font-bold text-vedicMaroon tabular-nums">{children}</div>
    </div>
  );
}

function formatLocal(iso: string, tz: number | undefined, t: (k: string, f?: string) => string): string {
  const d = new Date(iso);
  if (tz == null) return d.toISOString().slice(11, 16);
  const local = new Date(d.getTime() + tz * 3600_000);
  const hh = String(local.getUTCHours()).padStart(2, '0');
  const mm = String(local.getUTCMinutes()).padStart(2, '0');
  return t('rectify.tzLocal', '{hh}:{mm} (TZ+{tz})').replace('{hh}', hh).replace('{mm}', mm).replace('{tz}', String(tz));
}

function ScoreGraph({ result }: { result: RectificationResult }) {
  const { t } = useT();
  const byTime = [...result.candidates].sort(
    (a, b) => new Date(a.datetimeISO).getTime() - new Date(b.datetimeISO).getTime(),
  );
  if (byTime.length === 0) return null;
  const maxScore = Math.max(1, ...byTime.map((c) => c.score));
  const bestISO = result.bestMatch.datetimeISO;
  return (
    <Card title={t('rectify.score.title', 'Score distribution — {n} candidates tested (one per minute)').replace('{n}', String(byTime.length))}>
      <div className="flex items-end gap-[1px] h-32 overflow-x-auto px-1">
        {byTime.map((c) => {
          const h = (c.score / maxScore) * 100;
          const isBest = c.datetimeISO === bestISO;
          return (
            <div
              key={c.datetimeISO}
              className="flex-1 min-w-[2px]"
              title={t('rectify.score.tip', '{t} · score {s}').replace('{t}', c.datetimeISO.slice(11, 16)).replace('{s}', c.score.toFixed(1))}
            >
              <div
                className={isBest ? 'bg-emerald-500' : 'bg-vedicMaroon/40'}
                style={{ height: `${Math.max(2, h)}%` }}
              />
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-vedicMaroon/60 mt-2">
        {t('rectify.score.note', 'Each bar = one minute in the search window. Green bar is the best-scoring candidate.')}
      </p>
    </Card>
  );
}

function CandidatesTable({ result }: { result: RectificationResult }) {
  const { t } = useT();
  const top = result.candidates.slice(0, 10);
  return (
    <Card title={t('rectify.candidates.title', 'Top 10 candidates — sorted by score')}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
              <th className="py-1">{t('rectify.candidates.rank', 'Rank')}</th>
              <th>{t('rectify.candidates.timeUtc', 'Time (UTC)')}</th>
              <th className="text-right">{t('common.score', 'Score')}</th>
              <th className="text-right">{t('rectify.candidates.matched', 'Matched')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {top.map((c, i) => (
              <tr key={c.datetimeISO} className="border-b border-vedicGold/10">
                <td className="py-1 font-bold text-vedicMaroon">{i + 1}</td>
                <td className="tabular-nums text-vedicMaroon/80">
                  {new Date(c.datetimeISO).toISOString().slice(0, 16).replace('T', ' ')}
                </td>
                <td className="text-right tabular-nums font-semibold text-vedicMaroon">
                  {c.score.toFixed(1)}
                </td>
                <td className="text-right tabular-nums text-vedicMaroon/70">{c.matchedEvents}</td>
                <td>
                  {i === 0 && <Pill tone="good">{t('rectify.candidates.best', 'best')}</Pill>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
