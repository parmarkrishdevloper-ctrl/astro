// Phase 12 — Prashna (Horary Astrology).
//
// Two modes:
//   1. Time-based — cast a chart for the exact moment the question is asked.
//   2. KP number (1..249) — querent picks a number; maps to an ascendant
//      degree for a sub-lord verdict.
//
// When a category is supplied the server applies the K.P. Cuspal Interlink
// rule to return a YES / NO / MIXED verdict with confidence + analysis rows.

import { FormEvent, useState } from 'react';
import { NorthIndianChart } from '../components/charts/NorthIndianChart';
import { SouthIndianChart } from '../components/charts/SouthIndianChart';
import { ChartToggle, type ChartStyle } from '../components/charts/ChartToggle';
import { CityAutocomplete } from '../components/forms/CityAutocomplete';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type {
  PrashnaResult, PrashnaVerdictResult, PrashnaCategory,
} from '../types';

type Mode = 'time' | 'number';

const CATEGORIES: { key: PrashnaCategory; labelKey: string; fallback: string; primary: number }[] = [
  { key: 'marriage',   labelKey: 'prashna.cat.marriage',   fallback: 'Marriage',     primary: 7  },
  { key: 'career',     labelKey: 'prashna.cat.career',     fallback: 'Career / Job', primary: 10 },
  { key: 'health',     labelKey: 'prashna.cat.health',     fallback: 'Health',       primary: 1  },
  { key: 'progeny',    labelKey: 'prashna.cat.progeny',    fallback: 'Children',     primary: 5  },
  { key: 'property',   labelKey: 'prashna.cat.property',   fallback: 'Property',     primary: 4  },
  { key: 'travel',     labelKey: 'prashna.cat.travel',     fallback: 'Travel',       primary: 3  },
  { key: 'litigation', labelKey: 'prashna.cat.litigation', fallback: 'Litigation',   primary: 6  },
  { key: 'finance',    labelKey: 'prashna.cat.finance',    fallback: 'Finance',      primary: 2  },
  { key: 'education',  labelKey: 'prashna.cat.education',  fallback: 'Education',    primary: 4  },
];

export function PrashnaPage() {
  const { t } = useT();
  const [mode, setMode] = useState<Mode>('time');
  const [question, setQuestion] = useState('Will the marriage proposal succeed?');
  const [category, setCategory] = useState<PrashnaCategory | ''>('marriage');
  const [number, setNumber] = useState(108);
  const [placeName, setPlaceName] = useState('New Delhi, India');
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.2090);

  const [prashna, setPrashna] = useState<PrashnaResult | null>(null);
  const [verdict, setVerdict] = useState<PrashnaVerdictResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartStyle, setChartStyle] = useState<ChartStyle>('north');

  async function handleCast(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const r = await api.prashna({
        lat, lng,
        whenISO: mode === 'time' ? new Date().toISOString() : undefined,
        question: question.trim() || undefined,
        number: mode === 'number' ? number : undefined,
        category: category || undefined,
      });
      setPrashna(r.prashna);
      setVerdict(r.verdict);
    } catch (err) {
      setError((err as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <PageShell
      title={t('prashna.title', 'Prashna')}
      subtitle={t('prashna.subtitle', 'Horary astrology — cast a chart for the moment of a question, then read its verdict through K.P. cuspal interlinks.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <QuestionForm
            mode={mode} setMode={setMode}
            question={question} setQuestion={setQuestion}
            category={category} setCategory={setCategory}
            number={number} setNumber={setNumber}
            placeName={placeName} setPlaceName={setPlaceName}
            lat={lat} setLat={setLat} lng={lng} setLng={setLng}
            onCast={handleCast} loading={loading}
          />
        </aside>

        <main className="space-y-6">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {!prashna && !loading && !error && (
            <EmptyState>
              {t('prashna.empty', "Enter the question's location, optionally pick a category for a YES/NO verdict, then press Cast.")}
            </EmptyState>
          )}
          {loading && <EmptyState>{t('prashna.casting', 'Casting prashna chart…')}</EmptyState>}

          {prashna && (
            <>
              {verdict && <VerdictPanel v={verdict} />}
              <div className="rounded-2xl border border-vedicGold/40 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-vedicGold/30 bg-parchment flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-vedicMaroon">
                    {t('prashna.chart', 'Prashna Chart')} — {prashna.mode === 'number' ? t('prashna.kpNum', 'KP #{n}').replace('{n}', String(number)) : t('prashna.moment', 'Moment')} · {new Date(prashna.whenUTC).toUTCString()}
                  </h3>
                  <ChartToggle value={chartStyle} onChange={setChartStyle} />
                </div>
                <div className="p-5 flex justify-center">
                  {chartStyle === 'north'
                    ? <NorthIndianChart kundali={prashna.chart} />
                    : <SouthIndianChart kundali={prashna.chart} />}
                </div>
              </div>

              <AscendantLordsPanel prashna={prashna} />
              {verdict && <AnalysisPanel v={verdict} />}
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

function QuestionForm({
  mode, setMode, question, setQuestion, category, setCategory,
  number, setNumber, placeName, setPlaceName,
  lat, setLat, lng, setLng, onCast, loading,
}: {
  mode: Mode; setMode: (m: Mode) => void;
  question: string; setQuestion: (s: string) => void;
  category: PrashnaCategory | ''; setCategory: (c: PrashnaCategory | '') => void;
  number: number; setNumber: (n: number) => void;
  placeName: string; setPlaceName: (s: string) => void;
  lat: number; setLat: (n: number) => void;
  lng: number; setLng: (n: number) => void;
  onCast: (e: FormEvent) => void; loading: boolean;
}) {
  const { t } = useT();
  return (
    <form onSubmit={onCast} className="card">
      <header className="card-header">
        <h3 className="card-header-title">{t('prashna.form.title', 'Cast the prashna')}</h3>
      </header>
      <div className="card-body space-y-3">
        <Field label={t('prashna.form.question', 'Question')}>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            className="input"
            placeholder={t('prashna.form.questionPh', 'Will the loan be approved? …')}
          />
        </Field>

        <Field label={t('prashna.form.mode', 'Mode')}>
          <div className="flex rounded-md border border-vedicGold/40 overflow-hidden text-xs">
            <button type="button" onClick={() => setMode('time')}
              className={`flex-1 py-1.5 ${mode === 'time' ? 'bg-vedicMaroon text-white' : 'bg-white text-vedicMaroon'}`}>
              {t('prashna.form.modeMoment', 'Moment')}
            </button>
            <button type="button" onClick={() => setMode('number')}
              className={`flex-1 py-1.5 ${mode === 'number' ? 'bg-vedicMaroon text-white' : 'bg-white text-vedicMaroon'}`}>
              {t('prashna.form.modeNumber', 'KP Number')}
            </button>
          </div>
        </Field>

        {mode === 'number' && (
          <Field label={t('prashna.form.number', 'Number (1–249)')}>
            <input type="number" min={1} max={249} value={number}
              onChange={(e) => setNumber(Math.max(1, Math.min(249, Number(e.target.value))))}
              required className="input tabular-nums" />
          </Field>
        )}

        <Field label={t('prashna.form.category', 'Category (for verdict)')}>
          <select value={category} onChange={(e) => setCategory(e.target.value as PrashnaCategory | '')}
            className="input">
            <option value="">{t('prashna.form.categorySkip', '— skip verdict —')}</option>
            {CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>
                {t('prashna.form.categoryOption', '{label} · house {h}')
                  .replace('{label}', t(c.labelKey, c.fallback))
                  .replace('{h}', String(c.primary))}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('prashna.form.place', 'Place (for ascendant + houses)')}>
          <CityAutocomplete
            value={placeName}
            onChange={setPlaceName}
            onCitySelect={(c) => { setPlaceName(`${c.name}, ${c.admin}`); setLat(c.lat); setLng(c.lng); }}
            placeholder={t('prashna.form.placePh', 'Delhi, Mumbai, New York…')}
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Field label={t('prashna.form.lat', 'Lat')}>
            <input type="number" step="0.0001" value={lat}
              onChange={(e) => setLat(Number(e.target.value))} required
              className="input tabular-nums" />
          </Field>
          <Field label={t('prashna.form.lng', 'Lng')}>
            <input type="number" step="0.0001" value={lng}
              onChange={(e) => setLng(Number(e.target.value))} required
              className="input tabular-nums" />
          </Field>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full">
          {loading ? t('prashna.form.casting', 'Casting…') : t('prashna.form.cast', 'Cast prashna')}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs">
      <span className="block mb-1 font-medium text-vedicMaroon/80">{label}</span>
      {children}
    </label>
  );
}

function VerdictPanel({ v }: { v: PrashnaVerdictResult }) {
  const { t, al } = useT();
  const tone: Record<typeof v.verdict, { pill: 'good' | 'bad' | 'warn'; bg: string; text: string; border: string; label: string }> = {
    yes:   { pill: 'good', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-400/50', label: t('prashna.verdict.yes', 'YES') },
    no:    { pill: 'bad',  bg: 'bg-red-50',     text: 'text-red-800',     border: 'border-red-400/50',     label: t('prashna.verdict.no', 'NO')  },
    mixed: { pill: 'warn', bg: 'bg-amber-50',   text: 'text-amber-800',   border: 'border-amber-400/50',   label: t('prashna.verdict.mixed', 'MIXED') },
  };
  const tn = tone[v.verdict];
  const pct = Math.round(v.confidence * 100);
  return (
    // TODO(i18n-server): localize categoryLabel
    <Card title={t('prashna.verdict.title', 'Verdict — {label} (primary house {h})').replace('{label}', v.categoryLabel).replace('{h}', String(v.primaryHouse))}>
      <div className={`rounded-lg border ${tn.border} ${tn.bg} p-4 flex items-center gap-5`}>
        <div className={`text-4xl font-black ${tn.text}`}>{tn.label}</div>
        <div className="flex-1">
          <div className="text-xs text-vedicMaroon/70 mb-1">{t('prashna.verdict.confidence', 'Confidence')}</div>
          <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${v.verdict === 'yes' ? 'bg-emerald-500' : v.verdict === 'no' ? 'bg-red-500' : 'bg-amber-500'}`}
              style={{ width: `${pct}%` }} />
          </div>
          <div className="text-[11px] text-vedicMaroon/60 mt-1">{t('prashna.verdict.confPct', '{p}% of sub-lords cleanly agree').replace('{p}', String(pct))}</div>
        </div>
      </div>
      <p className="text-[11px] text-vedicMaroon/70 mt-3 leading-relaxed">
        {/* TODO(i18n-server): localize reasoning */}
        <span lang="en">{v.reasoning}</span>
      </p>
      {v.rulingPlanets.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-vedicMaroon/60 uppercase tracking-wider">{t('prashna.verdict.ruling', 'Ruling planets')}</span>
          {v.rulingPlanets.map((p) => <Pill key={p} tone="info">{al.planetByName(p)}</Pill>)}
        </div>
      )}
    </Card>
  );
}

function AscendantLordsPanel({ prashna }: { prashna: PrashnaResult }) {
  const { t, al } = useT();
  if (!prashna.ascendantLords) return null;
  return (
    <Card title={t('prashna.lords.title', 'KP Ascendant lords (number-based)')}>
      <div className="grid grid-cols-3 gap-3 text-xs">
        <LordCell label={t('prashna.lords.sign', 'Sign lord')}   value={al.planetByName(prashna.ascendantLords.sign)} />
        <LordCell label={t('prashna.lords.star', 'Star lord')}   value={al.planetByName(prashna.ascendantLords.star)} />
        <LordCell label={t('prashna.lords.sub', 'Sub-lord')}     value={al.planetByName(prashna.ascendantLords.sub)} />
      </div>
      <p className="text-[11px] text-vedicMaroon/60 mt-3">
        {t('prashna.lords.note', 'The sub-lord carries the final verdict in K.P.; the star lord shapes outcome; the sign lord sets the stage.')}
      </p>
    </Card>
  );
}

function LordCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-vedicGold/40 bg-parchment/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/60">{label}</div>
      <div className="text-lg font-bold text-vedicMaroon">{value}</div>
    </div>
  );
}

function AnalysisPanel({ v }: { v: PrashnaVerdictResult }) {
  const { t, al } = useT();
  return (
    <Card title={t('prashna.analysis.title', 'Cuspal Interlink analysis — three sub-lords')}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('prashna.analysis.intro', 'K.P. horary resolves a question through three sub-lords: the ascendant (querent), the Moon (mind), and the primary house (matter). A sub-lord is positive when it signifies a helpful house and avoids a destroyer.')}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
              <th className="py-1">{t('prashna.analysis.colSource', 'Source')}</th>
              <th>{t('prashna.analysis.colSub', 'Sub-lord')}</th>
              <th>{t('prashna.analysis.colSig', 'Signifies houses')}</th>
              <th className="text-center">{t('prashna.analysis.colPositive', 'Positive')}</th>
              <th className="text-center">{t('prashna.analysis.colDestroyer', 'Destroyer')}</th>
            </tr>
          </thead>
          <tbody>
            {v.analysis.map((row, i) => (
              <tr key={i} className="border-b border-vedicGold/10">
                {/* TODO(i18n-server): localize source */}
                <td className="py-1 font-semibold text-vedicMaroon"><span lang="en">{row.source}</span></td>
                <td className="font-bold text-vedicMaroon">{al.planetByName(row.sublord)}</td>
                <td className="tabular-nums text-vedicMaroon/80">
                  {row.signifiesHouses.length > 0 ? row.signifiesHouses.join(', ') : '—'}
                </td>
                <td className="text-center">
                  {row.positiveHit ? <Pill tone="good">{t('prashna.analysis.hit', 'hit')}</Pill> : <span className="text-vedicMaroon/30">—</span>}
                </td>
                <td className="text-center">
                  {row.destroyerHit ? <Pill tone="bad">{t('prashna.analysis.hit', 'hit')}</Pill> : <span className="text-vedicMaroon/30">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
