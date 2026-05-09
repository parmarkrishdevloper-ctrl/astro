// Phase 11 — Varshaphala (Tajaka Annual Horoscope).
//
// Panels:
//   1. Birth form + age selector
//   2. Solar return meta (moment, Muntha, Varshesha, Yogi/Avayogi)
//   3. Varsha chart (North/South Indian)
//   4. Sahams table (49 classical sensitive points)
//   5. Tripataki Chakra (28-nakshatra flag grid)
//   6. Masa-Phala (12 lunar-month split)
//   7. Mudda Dasha timeline (1-year compressed Vimshottari)

import { useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { NorthIndianChart } from '../components/charts/NorthIndianChart';
import { SouthIndianChart } from '../components/charts/SouthIndianChart';
import { ChartToggle, type ChartStyle } from '../components/charts/ChartToggle';
import { Card, PageShell, ErrorBanner, EmptyState } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput, VarshaphalaResult, MuddaPeriod, TajikaResult } from '../types';

function fmtDeg(d: number, rashiShort: (n: number) => string): string {
  const sign = Math.floor(d / 30);
  const within = d - sign * 30;
  const deg = Math.floor(within);
  const mF = (within - deg) * 60;
  const min = Math.floor(mF);
  return `${deg}° ${String(min).padStart(2, '0')}′ ${rashiShort(sign + 1)}`;
}

export function VarshaphalaPage() {
  const { t } = useT();
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [age, setAge] = useState(35);
  const [varsha, setVarsha] = useState<VarshaphalaResult | null>(null);
  const [mudda, setMudda] = useState<MuddaPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartStyle, setChartStyle] = useState<ChartStyle>('north');

  async function handleSubmit(input: BirthInput) {
    setBirth(input);
    await fetchVarsha(input, age);
  }

  async function fetchVarsha(input: BirthInput, a: number) {
    setLoading(true); setError(null);
    try {
      const r = await api.varshaphala(input, a);
      setVarsha(r.varshaphala);
      setMudda(r.muddaDasha);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  async function handleAgeChange(newAge: number) {
    setAge(newAge);
    if (birth) await fetchVarsha(birth, newAge);
  }

  return (
    <PageShell
      title={t('varsha.title', 'Varshaphala')}
      subtitle={t('varsha.subtitle', 'Tajaka Annual Horoscope — solar return chart, Muntha, Sahams, and Mudda Dasha.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
          <AgeSelector age={age} onChange={handleAgeChange} disabled={!birth || loading} />
          {varsha && <YearMetaCard v={varsha} />}
        </aside>

        <main className="space-y-6">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {!varsha && !loading && !error && (
            <EmptyState>{t('varsha.empty', 'Enter birth details and pick an age to cast the annual chart.')}</EmptyState>
          )}
          {loading && <EmptyState>{t('varsha.computing', 'Computing solar return…')}</EmptyState>}

          {varsha && (
            <>
              <div className="rounded-2xl border border-vedicGold/40 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-vedicGold/30 bg-parchment flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-vedicMaroon">
                    {t('varsha.varshaChart', 'Varsha Chart')} — {t('varsha.age', 'Age')} {varsha.age} · {new Date(varsha.varshaMomentUTC).toUTCString()}
                  </h3>
                  <ChartToggle value={chartStyle} onChange={setChartStyle} />
                </div>
                <div className="p-5 flex justify-center">
                  {chartStyle === 'north'
                    ? <NorthIndianChart kundali={varsha.chart} />
                    : <SouthIndianChart kundali={varsha.chart} />}
                </div>
              </div>

              <YogiPanel v={varsha} />
              {varsha.tajika && <TajikaPanel tajika={varsha.tajika} />}
              <SahamsPanel sahams={varsha.sahams} />
              <TripatakiPanel tripataki={varsha.tripataki} />
              <MasaPhalaPanel months={varsha.masaPhala} />
              <MuddaPanel periods={mudda} />
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

function AgeSelector({
  age, onChange, disabled,
}: { age: number; onChange: (a: number) => void; disabled: boolean }) {
  const { t } = useT();
  return (
    <div className="rounded-2xl border border-vedicGold/40 bg-white p-5 shadow-sm space-y-3 text-xs">
      <h3 className="text-sm font-semibold text-vedicMaroon">{t('varsha.year', 'Year (age)')}</h3>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(0, age - 1))}
          disabled={disabled || age <= 0}
          className="w-8 h-8 rounded border border-vedicMaroon/30 text-vedicMaroon hover:bg-vedicMaroon/5 disabled:opacity-30"
        >−</button>
        <input
          type="number"
          value={age}
          min={0}
          max={120}
          onChange={(e) => onChange(Math.max(0, Math.min(120, Number(e.target.value))))}
          disabled={disabled}
          className="flex-1 text-center rounded-md border border-vedicGold/40 bg-white px-2 py-1 tabular-nums"
        />
        <button
          onClick={() => onChange(Math.min(120, age + 1))}
          disabled={disabled || age >= 120}
          className="w-8 h-8 rounded border border-vedicMaroon/30 text-vedicMaroon hover:bg-vedicMaroon/5 disabled:opacity-30"
        >+</button>
      </div>
      <p className="text-[10px] text-vedicMaroon/60 italic">
        {t('varsha.ageHint', 'Age 0 = the natal moment. Age N = the N-th solar return (when Sun comes back to natal sidereal longitude).')}
      </p>
    </div>
  );
}

function YearMetaCard({ v }: { v: VarshaphalaResult }) {
  const { t, al } = useT();
  return (
    <div className="rounded-2xl border border-vedicGold/40 bg-white p-5 shadow-sm space-y-2 text-xs">
      <h3 className="text-sm font-semibold text-vedicMaroon mb-1">{t('varsha.summary', 'Year Summary')}</h3>
      <Row label={t('varsha.age', 'Age')}>{v.age}</Row>
      <Row label={t('varsha.varshaUtc', 'Varsha UTC')}>{new Date(v.varshaMomentUTC).toUTCString()}</Row>
      <Row label={t('varsha.varshaLagna', 'Varsha Lagna')}>{al.rashiByName(v.chart.ascendant.rashi.name)}</Row>
      <Row label={t('varsha.muntha', 'Muntha')}>
        {al.rashiByName(v.muntha.signName)} ({t('varsha.muntha.lord', 'lord {l}').replace('{l}', al.planetByName(v.muntha.lord))})
      </Row>
      <Row label={t('varsha.varshesha', 'Varshesha')}>{al.planetByName(v.varshesha)}</Row>
      <Row label={t('varsha.yogi', 'Yogi')}>
        {al.planetByName(v.yogi.nakLord)} · {t('varsha.muntha.dup', 'dup {l}').replace('{l}', al.planetByName(v.duplicateYogi))}
      </Row>
      <Row label={t('varsha.avayogi', 'Avayogi')}>{al.planetByName(v.avayogi.nakLord)}</Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="opacity-60">{label}</span>
      <span className="text-right text-vedicMaroon">{children}</span>
    </div>
  );
}

function YogiPanel({ v }: { v: VarshaphalaResult }) {
  const { t, al } = useT();
  return (
    <Card title={t('varsha.yogi.title', 'Yogi · Avayogi · Duplicate Yogi — year-lord trio')}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('varsha.yogi.intro', 'Yogi Sphuta = Sun + Moon + 93°20′. The nakshatra lord of that point is the Yogi (benefic for the year); the lord 6 nakshatras ahead is the Avayogi (inimical); the sign lord of the Yogi point is the Duplicate Yogi.')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="rounded border border-emerald-400/40 bg-emerald-50/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-emerald-700 mb-1">{t('varsha.yogi.label', 'Yogi (favourable)')}</div>
          <div className="text-lg font-bold text-emerald-800">{al.planetByName(v.yogi.nakLord)}</div>
          <div className="text-[11px] text-vedicMaroon/70 mt-1">
            {t('varsha.yogi.sphuta', 'Sphuta {deg} · sign {sign} (lord {lord})')
              .replace('{deg}', fmtDeg(v.yogi.point, al.rashiShort))
              .replace('{sign}', al.rashiShort(v.yogi.signNum))
              .replace('{lord}', al.planetByName(v.yogi.rashiLord))}
          </div>
        </div>
        <div className="rounded border border-red-400/40 bg-red-50/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-red-700 mb-1">{t('varsha.avayogi.label', 'Avayogi (inimical)')}</div>
          <div className="text-lg font-bold text-red-800">{al.planetByName(v.avayogi.nakLord)}</div>
          <div className="text-[11px] text-vedicMaroon/70 mt-1">{t('varsha.avayogi.note', 'Nak-lord 6 ahead of the Yogi.')}</div>
        </div>
        <div className="rounded border border-amber-400/40 bg-amber-50/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-amber-700 mb-1">{t('varsha.dupYogi.label', 'Duplicate Yogi')}</div>
          <div className="text-lg font-bold text-amber-800">{al.planetByName(v.duplicateYogi)}</div>
          <div className="text-[11px] text-vedicMaroon/70 mt-1">{t('varsha.dupYogi.note', 'Rashi-lord of the Yogi Sphuta sign.')}</div>
        </div>
      </div>
    </Card>
  );
}

function SahamsPanel({ sahams }: { sahams: VarshaphalaResult['sahams'] }) {
  const { t, al } = useT();
  const [filter, setFilter] = useState('');
  const filtered = filter
    ? sahams.filter((s) => s.name.toLowerCase().includes(filter.toLowerCase()) || s.key.includes(filter.toLowerCase()))
    : sahams;
  return (
    <Card
      title={t('varsha.sahams.title', 'Sahams ({n}) — Tajaka sensitive points').replace('{n}', String(sahams.length))}
      action={
        <input
          type="search"
          placeholder={t('varsha.sahams.filter', 'Filter…')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs border border-vedicMaroon/30 rounded px-2 py-1 bg-white w-32"
        />
      }
    >
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('varsha.sahams.intro', 'Each Saham is derived from arithmetic on Sun/Moon/Asc/cusps (e.g. Punya = Moon − Sun + Lagna). The sign a Saham falls in is read like a natal point for that topic during the year.')}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
              <th className="py-1">{t('varsha.sahams.colSaham', 'Saham')}</th>
              <th>{t('common.longitude', 'Longitude')}</th>
              <th>{t('common.sign', 'Sign')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.key} className="border-b border-vedicGold/10">
                {/* TODO(i18n-server): localize saham name */}
                <td className="py-1 font-semibold text-vedicMaroon"><span lang="en">{s.name}</span></td>
                <td className="tabular-nums text-vedicMaroon/80">{fmtDeg(s.longitude, al.rashiShort)}</td>
                <td>{al.rashiByName(s.signName)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-vedicMaroon/60 mt-3">{t('varsha.sahams.noMatch', 'No sahams matched "{q}".').replace('{q}', filter)}</p>
      )}
    </Card>
  );
}

function TripatakiPanel({ tripataki }: { tripataki: VarshaphalaResult['tripataki'] }) {
  const { t } = useT();
  const flagTone: Record<'flag1' | 'flag2' | 'flag3', string> = {
    flag1: 'bg-emerald-500 text-white',
    flag2: 'bg-amber-500 text-white',
    flag3: 'bg-red-500 text-white',
  };
  return (
    <Card title={t('varsha.tripataki.title', 'Tripataki Chakra — 28 nakshatras · 3 flags')}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('varsha.tripataki.intro', 'Each nakshatra is assigned to one of three flags relative to the Varsha Moon. Transit events through flag-1 nakshatras tend to be favourable; flag-2 mixed; flag-3 unfavourable.')}
      </p>
      <div className="grid grid-cols-7 md:grid-cols-14 gap-1">
        {tripataki.nakshatras.map((n) => (
          <div
            key={`${n.num}-${n.flag}`}
            className={`text-center text-[10px] font-semibold rounded py-1 ${flagTone[n.flag]}`}
            title={t('varsha.tripataki.cell', 'Nakshatra {n} · {flag}').replace('{n}', String(n.num)).replace('{flag}', n.flag)}
          >
            {n.num}
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-[11px]">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500"></span> {t('varsha.tripataki.flag1', 'Flag 1 (favourable)')}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500"></span> {t('varsha.tripataki.flag2', 'Flag 2 (mixed)')}</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"></span> {t('varsha.tripataki.flag3', 'Flag 3 (unfavourable)')}</span>
      </div>
    </Card>
  );
}

function MasaPhalaPanel({ months }: { months: VarshaphalaResult['masaPhala'] }) {
  const { t, al } = useT();
  return (
    <Card title={t('varsha.masa.title', 'Masa-Phala — {n} lunar months in this year').replace('{n}', String(months.length))}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
              <th className="py-1">{t('varsha.masa.colMonth', 'Month')}</th>
              <th>{t('varsha.masa.colStart', 'Start')}</th>
              <th>{t('varsha.masa.colEnd', 'End')}</th>
              <th>{t('varsha.masa.colMuntha', 'Muntha sign')}</th>
              <th>{t('varsha.masa.colMoon', 'Moon sign')}</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month} className="border-b border-vedicGold/10">
                <td className="py-1 font-semibold text-vedicMaroon">{m.month}</td>
                <td className="tabular-nums">{new Date(m.startDate).toLocaleDateString()}</td>
                <td className="tabular-nums">{new Date(m.endDate).toLocaleDateString()}</td>
                <td>{al.rashiShort(m.munthaSign)}</td>
                <td>{al.rashiShort(m.moonSign)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function TajikaPanel({ tajika }: { tajika: TajikaResult }) {
  const { t } = useT();
  const s = tajika.summary;
  const totalDirect = s.itthasala + s.ishraaf + s.manahu;
  return (
    <Card title={t('varsha.tajika.title', 'Tajika Yogas — {direct} sambandhas · {trans} light-transfers').replace('{direct}', String(totalDirect)).replace('{trans}', String(tajika.transfers.length))}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('varsha.tajika.intro1', 'Tajika applies Western-style angular aspects (conj/sextile/square/trine/opposition) with classical')}
        <span className="font-semibold"> {t('varsha.tajika.intro.deep', 'deeptamsha orbs')}</span> {t('varsha.tajika.intro2', 'to the Varsha chart. Faster planet moving toward exactness =')}
        <span className="font-semibold text-emerald-700"> {t('varsha.tajika.itthasala', 'Itthasala')}</span> {t('varsha.tajika.itthasalaDesc', '(promise fulfils); past exact =')}
        <span className="font-semibold text-amber-700"> {t('varsha.tajika.ishraaf', 'Ishraaf')}</span> {t('varsha.tajika.ishraafDesc', '(promise fading); same-sign close conjunction =')}
        <span className="font-semibold"> {t('varsha.tajika.manahu', 'Manahu')}</span>{t('varsha.tajika.manahuDot', '.')}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
        <SummaryTile label={t('varsha.tajika.tile.itthasala', 'Itthasala')} value={s.itthasala} tone="good" hint={t('varsha.tajika.tile.itthasalaHint', 'applying · fulfils')} />
        <SummaryTile label={t('varsha.tajika.tile.ishraaf', 'Ishraaf')}   value={s.ishraaf}   tone="warn" hint={t('varsha.tajika.tile.ishraafHint', 'separating · fades')} />
        <SummaryTile label={t('varsha.tajika.tile.manahu', 'Manahu')}    value={s.manahu}    tone="info" hint={t('varsha.tajika.tile.manahuHint', 'same-sign union')} />
        <SummaryTile label={t('varsha.tajika.tile.nakta', 'Nakta')}     value={s.nakta}     tone="good" hint={t('varsha.tajika.tile.naktaHint', 'fast-C bridges A,B')} />
        <SummaryTile label={t('varsha.tajika.tile.yamaya', 'Yamaya')}    value={s.yamaya}    tone="info" hint={t('varsha.tajika.tile.yamayaHint', 'slow-C bridges A,B')} />
      </div>

      {tajika.sambandhas.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                <th className="py-1 pr-2">{t('varsha.tajika.colPair', 'Pair')}</th>
                <th className="py-1 pr-2">{t('varsha.tajika.colAspect', 'Aspect')}</th>
                <th className="py-1 pr-2">{t('varsha.tajika.colRelation', 'Relation')}</th>
                <th className="py-1 pr-2 text-right">{t('varsha.tajika.colOrb', 'Orb')}</th>
                <th className="py-1 pr-2 text-right">{t('varsha.tajika.colAllowed', 'Allowed')}</th>
                <th className="py-1 pr-2">{t('varsha.tajika.colFaster', 'Faster')}</th>
                <th className="py-1">{t('varsha.tajika.colDir', 'Dir.')}</th>
              </tr>
            </thead>
            <tbody>
              {tajika.sambandhas.map((x, i) => (
                <tr key={`${x.a}-${x.b}-${i}`} className="border-b border-vedicGold/10">
                  <td className="py-1 pr-2 font-mono font-semibold text-vedicMaroon">{x.a}–{x.b}</td>
                  {/* TODO(i18n-server): localize aspect */}
                  <td className="py-1 pr-2 capitalize"><span lang="en">{x.aspect}</span></td>
                  <td className={`py-1 pr-2 font-semibold ${
                    x.relation === 'Itthasala' ? 'text-emerald-700'
                    : x.relation === 'Ishraaf' ? 'text-amber-700'
                    : 'text-vedicMaroon'
                  }`}>
                    {x.relation === 'Itthasala' ? t('varsha.tajika.itthasala', 'Itthasala')
                     : x.relation === 'Ishraaf' ? t('varsha.tajika.ishraaf', 'Ishraaf')
                     : x.relation === 'Manahu' ? t('varsha.tajika.manahu', 'Manahu')
                     : x.relation}
                  </td>
                  <td className="py-1 pr-2 text-right tabular-nums">{x.orb.toFixed(2)}°</td>
                  <td className="py-1 pr-2 text-right text-vedicMaroon/60 tabular-nums">{x.allowed.toFixed(1)}°</td>
                  <td className="py-1 pr-2 font-mono">{x.faster}</td>
                  <td className="py-1">{x.applying ? t('varsha.tajika.applying', '↗ applying') : t('varsha.tajika.separating', '↘ separating')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tajika.transfers.length > 0 && (
        <div className="mt-4">
          <h4 className="text-[11px] uppercase tracking-wider text-vedicMaroon/60 mb-2">
            {t('varsha.tajika.transferTitle', 'Transfer of light (Nakta · Yamaya)')}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {tajika.transfers.map((trf, i) => (
              <span key={i} className={`text-[11px] px-2 py-1 rounded border ${
                trf.kind === 'Nakta'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                  : 'bg-sky-50 border-sky-300 text-sky-800'
              }`}>
                <span className="font-semibold">
                  {trf.kind === 'Nakta' ? t('varsha.tajika.tile.nakta', 'Nakta') : t('varsha.tajika.tile.yamaya', 'Yamaya')}:
                </span>{' '}
                <span className="font-mono">{trf.a} ↔ {trf.b}</span>{' '}
                <span className="text-[10px] opacity-70">{t('varsha.tajika.via', 'via {v}').replace('{v}', String(trf.via))}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {tajika.sambandhas.length === 0 && tajika.transfers.length === 0 && (
        <p className="text-sm text-vedicMaroon/60 italic">
          {t('varsha.tajika.empty', 'No Tajika sambandhas detected this year — planets are outside their deeptamsha orbs for all classical aspects.')}
        </p>
      )}
    </Card>
  );
}

function SummaryTile({
  label, value, tone, hint,
}: { label: string; value: number; tone: 'good' | 'warn' | 'info'; hint: string }) {
  const toneCls =
    tone === 'good' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
    : tone === 'warn' ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-vedicCream/40 border-vedicGold/30 text-vedicMaroon';
  return (
    <div className={`rounded-md border px-3 py-2 ${toneCls}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-lg font-bold tabular-nums">{value}</div>
      <div className="text-[10px] opacity-70">{hint}</div>
    </div>
  );
}

function MuddaPanel({ periods }: { periods: MuddaPeriod[] }) {
  const { t, al } = useT();
  if (periods.length === 0) return null;
  const totalDays = periods.reduce((s, p) => s + p.days, 0);
  return (
    <Card title={t('varsha.mudda.title', 'Mudda Dasha — 1 year compressed Vimshottari · {n} sub-periods').replace('{n}', String(periods.length))}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('varsha.mudda.intro', "Ratios from standard Vimshottari are scaled so the full cycle fits the year. Starts from the lord of the Varsha Moon's nakshatra.")}
      </p>
      <div className="space-y-1.5">
        {periods.map((p, i) => {
          const pct = (p.days / totalDays) * 100;
          return (
            <div key={i} className="flex items-center gap-3 text-xs">
              <div className="w-10 font-bold text-vedicMaroon">{al.planetByName(p.lord)}</div>
              <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden relative">
                <div className="h-full bg-vedicMaroon/60" style={{ width: `${pct}%` }} />
              </div>
              <div className="w-24 text-right tabular-nums text-vedicMaroon/70 text-[11px]">{t('varsha.mudda.days', '{d} d').replace('{d}', p.days.toFixed(1))}</div>
              <div className="w-56 text-[11px] tabular-nums text-vedicMaroon/60">
                {new Date(p.startDate).toLocaleDateString()} → {new Date(p.endDate).toLocaleDateString()}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
