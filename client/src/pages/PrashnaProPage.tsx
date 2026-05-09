// Phase 11 — Prashna Pro.
//
// Five-school horary workbench. One question input → five parallel
// interpretations from different classical schools:
//   • Tajika         — Itthasala / Ishraaf / Manahu sambandhas
//   • Narchintamani  — Kerala-school kendra/trikona + tithi analysis
//   • Shatpanchasika — 56 sutras (20 encoded) of Prithuyasas
//   • Swara          — breath / nostril / pañca-tattva Ida-Pingala
//   • Arudha         — arudha lagna + 12 padas + quesited arudha

import { FormEvent, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CityAutocomplete } from '../components/forms/CityAutocomplete';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { VoiceInputButton, SaveViewButton } from '../components/ui/WorkflowAtoms';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { PrashnaCategory } from '../types';

type SchoolTab = 'tajika' | 'narchintamani' | 'shatpanchasika' | 'swara' | 'arudha';

const SCHOOLS: { key: SchoolTab; labelKey: string; labelFallback: string; descKey: string; descFallback: string }[] = [
  { key: 'tajika',         labelKey: 'prashnaPro.tab.tajika',         labelFallback: 'Tajika',         descKey: 'prashnaPro.school.tajika',         descFallback: 'Persian-influenced aspect school — Itthasala / Ishraaf / Manahu' },
  { key: 'narchintamani',  labelKey: 'prashnaPro.tab.narchintamani',  labelFallback: 'Narchintamani',  descKey: 'prashnaPro.school.narchintamani',  descFallback: 'Kerala horary — kendra/trikona benefic-malefic count, pancha-swara' },
  { key: 'shatpanchasika', labelKey: 'prashnaPro.tab.shatpanchasika', labelFallback: 'Shatpanchasika', descKey: 'prashnaPro.school.shatpanchasika', descFallback: 'Prithuyasas — 56 sutras distilled into yes/no rulings' },
  { key: 'swara',          labelKey: 'prashnaPro.tab.swara',          labelFallback: 'Swara',          descKey: 'prashnaPro.school.swara',          descFallback: 'Shivasvarodaya — nostril, pañca-tattva, directional questions' },
  { key: 'arudha',         labelKey: 'prashnaPro.tab.arudha',         labelFallback: 'Arudha',         descKey: 'prashnaPro.school.arudha',         descFallback: 'Arudha lagna + 12 padas + category-specific quesited arudha' },
];

const CATEGORIES: { key: PrashnaCategory; labelKey: string; fallback: string }[] = [
  { key: 'marriage',   labelKey: 'prashnaPro.cat.marriage',   fallback: 'Marriage' },
  { key: 'career',     labelKey: 'prashnaPro.cat.career',     fallback: 'Career' },
  { key: 'health',     labelKey: 'prashnaPro.cat.health',     fallback: 'Health' },
  { key: 'progeny',    labelKey: 'prashnaPro.cat.progeny',    fallback: 'Children' },
  { key: 'property',   labelKey: 'prashnaPro.cat.property',   fallback: 'Property' },
  { key: 'travel',     labelKey: 'prashnaPro.cat.travel',     fallback: 'Travel' },
  { key: 'litigation', labelKey: 'prashnaPro.cat.litigation', fallback: 'Litigation' },
  { key: 'finance',    labelKey: 'prashnaPro.cat.finance',    fallback: 'Finance' },
  { key: 'education',  labelKey: 'prashnaPro.cat.education',  fallback: 'Education' },
];

export function PrashnaProPage() {
  const { t } = useT();
  const [question, setQuestion] = useState('Will the endeavour succeed?');
  const [category, setCategory] = useState<PrashnaCategory>('career');
  const [placeName, setPlaceName] = useState('New Delhi, India');
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.2090);
  const [tithiNum, setTithiNum] = useState(10);
  const [waxing, setWaxing] = useState(true);
  const [dayIndex, setDayIndex] = useState(new Date().getUTCDay());
  const [hoursSinceSunrise, setHoursSinceSunrise] = useState(6);

  const [tab, setTab] = useState<SchoolTab>('tajika');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Phase 20 — rehydrate from saved view
  const location = useLocation();
  useEffect(() => {
    const s = (location.state as any)?.savedView?.snapshot;
    if (!s) return;
    if (typeof s.question === 'string')   setQuestion(s.question);
    if (typeof s.category === 'string')   setCategory(s.category);
    if (typeof s.placeName === 'string')  setPlaceName(s.placeName);
    if (typeof s.lat === 'number')        setLat(s.lat);
    if (typeof s.lng === 'number')        setLng(s.lng);
    if (typeof s.tithiNum === 'number')   setTithiNum(s.tithiNum);
    if (typeof s.waxing === 'boolean')    setWaxing(s.waxing);
    if (typeof s.dayIndex === 'number')   setDayIndex(s.dayIndex);
    if (typeof s.hoursSinceSunrise === 'number') setHoursSinceSunrise(s.hoursSinceSunrise);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCast(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setData(null);
    try {
      const r = await api.prashnaSchools({
        lat, lng,
        whenISO: new Date().toISOString(),
        question: question.trim() || undefined,
        category,
        dayIndex, waxing, hoursSinceSunrise,
        tithiNum,
      });
      setData(r.schools);
    } catch (err) {
      setError((err as Error).message);
    } finally { setLoading(false); }
  }

  const defaultName = question.length > 0
    ? t('prashnaPro.savedNamed', 'Prashna: {q}').replace('{q}', question.slice(0, 40))
    : t('prashnaPro.savedDefault', 'Prashna view');

  return (
    <PageShell
      title={t('prashnaPro.title', 'Prashna Pro')}
      subtitle={t('prashnaPro.subtitle', 'Five-school horary workbench — one question, five classical interpretations.')}
      actions={
        <SaveViewButton
          route="/prashna-pro"
          kind="prashna-question"
          snapshot={{ question, category, placeName, lat, lng, tithiNum, waxing, dayIndex, hoursSinceSunrise }}
          defaultName={defaultName}
        />
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <Card title={t('prashnaPro.ask', 'Ask a question')}>
            <form onSubmit={handleCast} className="space-y-3">
              <label className="block text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-vedicMaroon/70">{t('prashnaPro.question', 'Question')}</span>
                  <VoiceInputButton onTranscript={(tx) => setQuestion(tx)} title={t('prashnaPro.voiceTitle', 'Speak your question')} />
                </div>
                <input value={question} onChange={(e) => setQuestion(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-vedicGold/30 bg-white" />
              </label>
              <label className="block text-xs">
                <span className="text-vedicMaroon/70">{t('prashnaPro.category', 'Category')}</span>
                <select value={category} onChange={(e) => setCategory(e.target.value as PrashnaCategory)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-vedicGold/30 bg-white">
                  {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{t(c.labelKey, c.fallback)}</option>)}
                </select>
              </label>
              <div className="text-xs">
                <div className="text-vedicMaroon/70 mb-1">{t('prashnaPro.querentPlace', 'Querent place')}</div>
                <CityAutocomplete
                  value={placeName}
                  onChange={(v) => setPlaceName(v)}
                  onSelect={(c) => { setPlaceName(c.name); setLat(c.lat); setLng(c.lng); }}
                />
                <div className="flex gap-2 mt-1 text-[10px] text-vedicMaroon/50 font-mono">
                  <span>{lat.toFixed(4)}°</span><span>·</span><span>{lng.toFixed(4)}°</span>
                </div>
              </div>

              <details className="text-xs">
                <summary className="cursor-pointer text-vedicMaroon/70">{t('prashnaPro.swaraPanel', 'Swara & panchang inputs')}</summary>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <span className="w-24">{t('prashnaPro.tithi', 'Tithi (1-30)')}</span>
                    <input type="number" min={1} max={30} value={tithiNum}
                      onChange={(e) => setTithiNum(Number(e.target.value))}
                      className="w-16 px-1.5 py-1 rounded border border-vedicGold/30 bg-white text-right" />
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-24">{t('prashnaPro.paksha', 'Paksha')}</span>
                    <select value={waxing ? 'shukla' : 'krishna'} onChange={(e) => setWaxing(e.target.value === 'shukla')}
                      className="px-1.5 py-1 rounded border border-vedicGold/30 bg-white">
                      <option value="shukla">{t('prashnaPro.shukla', 'Shukla (waxing)')}</option>
                      <option value="krishna">{t('prashnaPro.krishna', 'Krishna (waning)')}</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-24">{t('prashnaPro.weekday', 'Weekday (0-6)')}</span>
                    <input type="number" min={0} max={6} value={dayIndex}
                      onChange={(e) => setDayIndex(Number(e.target.value))}
                      className="w-16 px-1.5 py-1 rounded border border-vedicGold/30 bg-white text-right" />
                    <span className="text-[10px] text-vedicMaroon/50">{t('prashnaPro.sunZero', '0=Sun')}</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <span className="w-24">{t('prashnaPro.hoursSinceSunrise', 'Hrs since sunrise')}</span>
                    <input type="number" step={0.25} min={0} max={24} value={hoursSinceSunrise}
                      onChange={(e) => setHoursSinceSunrise(Number(e.target.value))}
                      className="w-16 px-1.5 py-1 rounded border border-vedicGold/30 bg-white text-right" />
                  </label>
                </div>
              </details>

              <button type="submit" disabled={loading}
                className="w-full btn btn-primary text-sm py-2">
                {loading ? t('prashnaPro.casting', 'Casting…') : t('prashnaPro.cast', 'Cast prashna')}
              </button>
            </form>
          </Card>
        </aside>

        <main className="space-y-4">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {loading && <EmptyState>{t('prashnaPro.loading', 'Consulting five schools — Tajika, Narchintamani, Shatpanchasika, Swara, Arudha…')}</EmptyState>}
          {!data && !loading && !error && (
            <EmptyState>{t('prashnaPro.empty', 'Enter a question and cast the prashna. The moment of asking becomes the chart.')}</EmptyState>
          )}

          {data && (
            <>
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-vedicGold/30 bg-vedicCream/30 w-fit">
                {SCHOOLS.map((s) => (
                  <button key={s.key} onClick={() => setTab(s.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      tab === s.key ? 'bg-vedicMaroon text-white' : 'text-vedicMaroon/70 hover:bg-vedicMaroon/5'
                    }`}>
                    {t(s.labelKey, s.labelFallback)}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-vedicMaroon/60 -mt-2">
                {(() => {
                  const cur = SCHOOLS.find((s) => s.key === tab);
                  return cur ? t(cur.descKey, cur.descFallback) : '';
                })()}
              </p>

              {tab === 'tajika'         && <TajikaView data={data.tajika} />}
              {tab === 'narchintamani'  && <NarchintamaniView data={data.narchintamani} />}
              {tab === 'shatpanchasika' && <ShatpanchasikaView data={data.shatpanchasika} />}
              {tab === 'swara'          && <SwaraView data={data.swara} />}
              {tab === 'arudha'         && <ArudhaView data={data.arudha} />}
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

// ─── School views ─────────────────────────────────────────────────

function TajikaView({ data }: { data: any }) {
  const { t, al } = useT();
  const tone = data.verdict === 'yes' ? 'good' : data.verdict === 'no' ? 'bad' : 'warn';
  const pairs = data.pairs || [];
  return (
    <div className="space-y-3">
      <Card title={t('prashnaPro.verdictHeader', 'Verdict — {v}').replace('{v}', String(data.verdict || 'unknown').toUpperCase())}>
        <div className="flex items-center gap-3 mb-3">
          <Pill tone={tone as any}>{t('prashnaPro.scorePill', 'Score {n}').replace('{n}', String(data.score))}</Pill>
          {/* TODO(i18n-server): localize reasoning */}
          <span className="text-xs text-vedicMaroon/70" lang="en">{data.reasoning}</span>
        </div>
        <div className="text-xs text-vedicMaroon/70">
          <strong>{t('prashnaPro.lagnaLord', 'Lagna lord:')}</strong> {al.planetByName(data.lagnaLord)} · <strong>{t('prashnaPro.quesitedLord', 'Quesited lord:')}</strong> {al.planetByName(data.quesitedLord)}
          {data.moonLord && <> · <strong>{t('prashnaPro.moonLord', 'Moon-nak lord:')}</strong> {al.planetByName(data.moonLord)}</>}
          {data.quesitedHouse && <> · <strong>{t('prashnaPro.quesitedHouse', 'Quesited house:')}</strong> {data.quesitedHouse}</>}
        </div>
      </Card>
      <Card title={t('prashnaPro.sambandhas', 'Sambandhas ({n})').replace('{n}', String(pairs.length))}>
        {pairs.length ? (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-vedicMaroon/60">
                <th className="py-1">{t('prashnaPro.colPair', 'Pair')}</th><th>{t('prashnaPro.colRelation', 'Relation')}</th><th>{t('prashnaPro.colAspect', 'Aspect')}</th><th>{t('prashnaPro.colOrbAllowed', 'Orb / Allowed')}</th><th>{t('prashnaPro.colApplying', 'Applying')}</th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((s: any, i: number) => (
                <tr key={i} className="border-t border-vedicGold/10">
                  {/* TODO(i18n-server): localize between */}
                  <td className="py-1" lang="en">{s.between}</td>
                  <td className={
                    s.relation === 'Itthasala' ? 'text-green-700 font-semibold' :
                    s.relation === 'Ishraaf' ? 'text-red-700 font-semibold' :
                    'text-vedicMaroon/80'
                  }>{s.relation}</td>
                  {/* TODO(i18n-server): localize aspect */}
                  <td className="capitalize" lang="en">{s.aspect}</td>
                  <td className="font-mono">{s.orb?.toFixed(2)}° / {s.allowed?.toFixed(2)}°</td>
                  <td>{s.applying ? t('prashnaPro.applyingYes', 'Yes') : t('prashnaPro.applyingNo', 'No')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <EmptyState>{t('prashnaPro.tajikaEmpty', 'No sambandhas detected — neutral chart.')}</EmptyState>}
      </Card>
    </div>
  );
}

function NarchintamaniView({ data }: { data: any }) {
  const { t, al } = useT();
  const overall = data.overall || 'neutral';
  const tone = overall === 'favorable' ? 'good' : overall === 'unfavorable' ? 'bad' : 'warn';
  const ps = data.panchaSwaras || {};
  return (
    <div className="space-y-3">
      <Card title={t('prashnaPro.narchHeader', 'Narchintamani — {v}').replace('{v}', String(overall).toUpperCase())}>
        <div className="flex flex-wrap gap-2 mb-3">
          {/* TODO(i18n-server): localize overall */}
          <Pill tone={tone as any}><span lang="en">{overall}</span></Pill>
          <Pill tone="info">{t('prashnaPro.lagnaPill', 'Lagna: {s}').replace('{s}', String(data.lagnaStrength))}</Pill>
          <Pill tone="info">{t('prashnaPro.moonPill', 'Moon: {s}').replace('{s}', String(data.moonStrength))}</Pill>
          {/* TODO(i18n-server): localize tithiGroup */}
          {data.tithiGroup && <Pill tone="neutral">{t('prashnaPro.tithiPill', 'Tithi: {t}').replace('{t}', String(data.tithiGroup))}</Pill>}
        </div>
        {Array.isArray(data.notes) && data.notes.length > 0 && (
          <ul className="text-xs text-vedicMaroon/70 space-y-1 list-disc pl-5">
            {/* TODO(i18n-server): localize notes */}
            {data.notes.map((n: string, i: number) => <li key={i} lang="en">{n}</li>)}
          </ul>
        )}
      </Card>
      <Card title={t('prashnaPro.panchaSwaras', 'Pancha-swaras (5 lords)')}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <Metric label={t('prashnaPro.psLagna', 'Lagna lord')} value={al.planetByName(ps.lagna)} />
          <Metric label={t('prashnaPro.psMoon', 'Moon-sign lord')} value={al.planetByName(ps.moon)} />
          <Metric label={t('prashnaPro.psHora', 'Hora ruler')} value={al.planetByName(ps.hora)} />
          <Metric label={t('prashnaPro.psNakshatra', 'Nakshatra lord')} value={al.planetByName(ps.nakshatra)} />
          <Metric label={t('prashnaPro.psAmsa', 'Navamsa lord')} value={al.planetByName(ps.amsa)} />
        </div>
      </Card>
      <Card title={t('prashnaPro.kendraTrikona', 'Kendra / Trikona analysis')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Metric label={t('prashnaPro.beneficKendra', 'Benefics in kendra')} value={data.kendra?.beneficCount} />
          <Metric label={t('prashnaPro.maleficKendra', 'Malefics in kendra')} value={data.kendra?.maleficCount} />
          <Metric label={t('prashnaPro.beneficTrikona', 'Benefics in trikona')} value={data.trikona?.beneficCount} />
          <Metric label={t('prashnaPro.maleficTrikona', 'Malefics in trikona')} value={data.trikona?.maleficCount} />
        </div>
        <div className="mt-3 text-[11px] text-vedicMaroon/60 grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>{t('prashnaPro.kendraOcc', 'Kendra occupants:')} <span className="font-mono">{(data.kendra?.occupiedBy || []).map((p: string) => al.planetByName(p)).join(', ') || '—'}</span></div>
          <div>{t('prashnaPro.trikonaOcc', 'Trikona occupants:')} <span className="font-mono">{(data.trikona?.occupiedBy || []).map((p: string) => al.planetByName(p)).join(', ') || '—'}</span></div>
        </div>
      </Card>
    </div>
  );
}

function ShatpanchasikaView({ data }: { data: any }) {
  const { t } = useT();
  const fired = data.firedSutras || [];
  const verdict = data.verdict || 'mixed';
  const tone = verdict === 'yes' ? 'good' : verdict === 'no' ? 'bad' : 'warn';
  return (
    <div className="space-y-3">
      <Card title={t('prashnaPro.shatHeader', 'Shatpanchasika — {v}').replace('{v}', String(verdict).toUpperCase())}>
        <div className="flex gap-2 flex-wrap">
          {/* TODO(i18n-server): localize verdict word */}
          <Pill tone={tone as any}>{t('prashnaPro.verdictPill', 'Verdict: {v}').replace('{v}', String(verdict))}</Pill>
          <Pill tone="info">{t('prashnaPro.scorePill', 'Score {n}').replace('{n}', String(data.score))}</Pill>
          <Pill tone="good">{t('prashnaPro.positive', 'Positive {n}').replace('{n}', String(data.positive ?? 0))}</Pill>
          <Pill tone="bad">{t('prashnaPro.negative', 'Negative {n}').replace('{n}', String(data.negative ?? 0))}</Pill>
          <Pill tone="neutral">{t('prashnaPro.neutral', 'Neutral {n}').replace('{n}', String(data.neutral ?? 0))}</Pill>
        </div>
      </Card>
      <Card title={t('prashnaPro.firedSutras', 'Fired sutras ({n})').replace('{n}', String(fired.length))}>
        {fired.length ? (
          <ul className="space-y-1.5 text-xs">
            {fired.map((s: any, i: number) => (
              <li key={i} className="flex gap-2 items-start">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono shrink-0 ${
                  s.polarity === 'positive' ? 'bg-green-100 text-green-800' :
                  s.polarity === 'negative' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-700'
                }`}>#{s.id}</span>
                {/* TODO(i18n-server): localize sutra text */}
                <span className="text-vedicMaroon/80" lang="en">{s.text}</span>
              </li>
            ))}
          </ul>
        ) : <EmptyState>{t('prashnaPro.shatEmpty', 'No sutras fired — chart pattern is rare.')}</EmptyState>}
      </Card>
    </div>
  );
}

function SwaraView({ data }: { data: any }) {
  const { t } = useT();
  const nostrilTone = data.nostril === 'Sushumna' ? 'warn' : data.nostril === 'Ida' ? 'info' : 'good';
  const bhutaTone = data.bhutaQuality === 'auspicious' ? 'good' : data.bhutaQuality === 'inauspicious' ? 'bad' : 'warn';
  const dirTone = data.directionMatch === 'favorable' ? 'good' : data.directionMatch === 'unfavorable' ? 'bad' : 'neutral';
  const bhutaName = (n: string) => {
    const m: Record<string, string> = {
      Prithvi: t('prashnaPro.bhuta.prithvi', 'Prithvi'),
      Jala:    t('prashnaPro.bhuta.jala', 'Jala'),
      Agni:    t('prashnaPro.bhuta.agni', 'Agni'),
      Vayu:    t('prashnaPro.bhuta.vayu', 'Vayu'),
      Akasha:  t('prashnaPro.bhuta.akasha', 'Akasha'),
    };
    return m[n] || n;
  };
  const qualName = (q: string) => {
    const m: Record<string, string> = {
      auspicious:   t('prashnaPro.qual.auspicious', 'auspicious'),
      inauspicious: t('prashnaPro.qual.inauspicious', 'inauspicious'),
      mixed:        t('prashnaPro.qual.mixed', 'mixed'),
    };
    return m[q] || q;
  };
  const bhutas: { name: string; quality: string; durationKey: string; durationFallback: string }[] = [
    { name: 'Prithvi', quality: 'auspicious',   durationKey: 'prashnaPro.bhuta.20min', durationFallback: '20 min' },
    { name: 'Jala',    quality: 'auspicious',   durationKey: 'prashnaPro.bhuta.16min', durationFallback: '16 min' },
    { name: 'Agni',    quality: 'inauspicious', durationKey: 'prashnaPro.bhuta.12min', durationFallback: '12 min' },
    { name: 'Vayu',    quality: 'mixed',        durationKey: 'prashnaPro.bhuta.8min',  durationFallback: '8 min' },
    { name: 'Akasha',  quality: 'inauspicious', durationKey: 'prashnaPro.bhuta.4min',  durationFallback: '4 min' },
  ];
  return (
    <div className="space-y-3">
      <Card title={t('prashnaPro.swaraHeader', 'Active breath — {nostril} · {bhuta}').replace('{nostril}', String(data.nostril)).replace('{bhuta}', bhutaName(data.bhuta))}>
        <div className="flex flex-wrap gap-2 mb-3">
          {/* TODO(i18n-server): localize nostril name */}
          <Pill tone={nostrilTone as any}>{t('prashnaPro.nostrilPill', '{n} nostril').replace('{n}', String(data.nostril))}</Pill>
          <Pill tone={bhutaTone as any}>{t('prashnaPro.bhutaPill', '{b} ({q})').replace('{b}', bhutaName(data.bhuta)).replace('{q}', qualName(data.bhutaQuality))}</Pill>
          {/* TODO(i18n-server): localize directionMatch */}
          <Pill tone={dirTone as any}>{t('prashnaPro.directionPill', 'Direction: {d}').replace('{d}', String(data.directionMatch))}</Pill>
          <Pill tone={data.verdict === 'yes' ? 'good' : data.verdict === 'no' ? 'bad' : 'warn'}>
            {t('prashnaPro.swaraVerdict', 'Verdict: {v}').replace('{v}', String(data.verdict || '').toUpperCase())}
          </Pill>
        </div>
        {Array.isArray(data.notes) && data.notes.length > 0 && (
          <ul className="text-xs text-vedicMaroon/70 space-y-1 list-disc pl-5">
            {/* TODO(i18n-server): localize notes */}
            {data.notes.map((n: string, i: number) => <li key={i} lang="en">{n}</li>)}
          </ul>
        )}
      </Card>
      <Card title={t('prashnaPro.bhutaRef', 'Reference — pañca-tattva cycle')}>
        <div className="grid grid-cols-5 gap-2 text-xs">
          {bhutas.map((b) => (
            <div key={b.name} className={`p-2 rounded border ${
              data.bhuta === b.name ? 'border-vedicMaroon bg-vedicMaroon/10' : 'border-vedicGold/20 bg-parchment/40'
            }`}>
              <div className="font-semibold text-vedicMaroon">{bhutaName(b.name)}</div>
              <div className="text-[10px] text-vedicMaroon/60">{t(b.durationKey, b.durationFallback)}</div>
              <div className="text-[10px] text-vedicMaroon/60 capitalize">{qualName(b.quality)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ArudhaView({ data }: { data: any }) {
  const { t, al } = useT();
  const padas = data.arudhaPadas || [];
  const lagnaPada = padas.find((p: any) => p.house === 1);
  const qa = data.quesitedArudha;
  return (
    <div className="space-y-3">
      <Card title={t('prashnaPro.arudhaHeader', 'Arudha Lagna — house {h}').replace('{h}', String(data.arudhaLagna))}>
        <div className="flex gap-2 flex-wrap">
          {lagnaPada && <Pill tone="info">{t('prashnaPro.arudhaLagnaLord', 'Lagna lord: {lord} in H{h}').replace('{lord}', al.planetByName(lagnaPada.lord)).replace('{h}', String(lagnaPada.lordHouse))}</Pill>}
          {qa && (
            <Pill tone="warn">
              {t('prashnaPro.arudhaQuesited', '{cat} arudha: H{q} → pada H{a}').replace('{cat}', qa.category).replace('{q}', String(qa.quesitedHouse)).replace('{a}', String(qa.arudha))}
              {qa.tenants?.length
                ? t('prashnaPro.arudhaTenants', '· {t}').replace('{t}', qa.tenants.map((p: string) => al.planetByName(p)).join(', '))
                : t('prashnaPro.arudhaEmpty', '· empty')}
            </Pill>
          )}
        </div>
        {Array.isArray(data.notes) && data.notes.length > 0 && (
          <ul className="mt-3 text-xs text-vedicMaroon/70 space-y-1 list-disc pl-5">
            {/* TODO(i18n-server): localize notes */}
            {data.notes.map((n: string, i: number) => <li key={i} lang="en">{n}</li>)}
          </ul>
        )}
      </Card>
      <Card title={t('prashnaPro.padasTitle', '12 Arudha Padas')}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60">
              <th className="py-1">{t('prashnaPro.padasHouse', 'House')}</th><th>{t('prashnaPro.padasLord', 'Lord')}</th><th>{t('prashnaPro.padasLordIn', 'Lord in')}</th><th>{t('prashnaPro.padasArudha', 'Arudha pada')}</th>
            </tr>
          </thead>
          <tbody>
            {padas.map((p: any, i: number) => (
              <tr key={i} className="border-t border-vedicGold/10">
                <td className="py-1 font-mono">{p.house}</td>
                <td>{al.planetByName(p.lord)}</td>
                <td className="font-mono">{p.lordHouse}</td>
                <td className="font-mono font-semibold">{p.arudha}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function Metric({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-2 rounded border border-vedicGold/20 bg-parchment/40">
      <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50">{label}</div>
      <div className="font-display font-bold text-vedicMaroon text-lg">{value ?? '—'}</div>
    </div>
  );
}
