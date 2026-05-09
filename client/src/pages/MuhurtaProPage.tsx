// Phase 11 — Muhurta Pro.
//
// Five panes:
//   • Day calendar    — Chaughadia × 16 segs + Hora × 24 + panchang + yogas
//   • Week calendar   — 7-day compact grid
//   • Presets         — 35+ named events with preferred naks/days/tithis
//   • Varjyam widget  — 7-day inauspicious / amritkaal windows
//   • Yoga finder     — evaluate Sarvartha/Amrit/Ravi/Pushkar at a moment

import { FormEvent, useEffect, useState } from 'react';
import { CityAutocomplete } from '../components/forms/CityAutocomplete';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { AstroTranslator } from '../i18n/astro-labels';

type Tab = 'day' | 'week' | 'presets' | 'varjyam' | 'yogas';

const TABS: { key: Tab; labelKey: string; labelFallback: string; descKey: string; descFallback: string }[] = [
  { key: 'day',      labelKey: 'muhurtaPro.tab.day',      labelFallback: 'Day',      descKey: 'muhurtaPro.desc.day',      descFallback: 'Chaughadia × 16 + Hora × 24 + panchang + active muhurta yogas' },
  { key: 'week',     labelKey: 'muhurtaPro.tab.week',     labelFallback: 'Week',     descKey: 'muhurtaPro.desc.week',     descFallback: '7-day grid: quality rhythm + tithi/nakshatra/yoga per day' },
  { key: 'presets',  labelKey: 'muhurtaPro.tab.presets',  labelFallback: 'Presets',  descKey: 'muhurtaPro.desc.presets',  descFallback: '35+ named event muhurtas with preferred naks/days/tithis' },
  { key: 'varjyam',  labelKey: 'muhurtaPro.tab.varjyam',  labelFallback: 'Varjyam',  descKey: 'muhurtaPro.desc.varjyam',  descFallback: 'Rolling 7-day varjyam + amritkaal windows' },
  { key: 'yogas',    labelKey: 'muhurtaPro.tab.yogas',    labelFallback: 'Yogas',    descKey: 'muhurtaPro.desc.yogas',    descFallback: 'Instant yoga checker: Sarvartha / Amrit / Ravi / Guru-Pushya / Pushkar' },
];

type T = (key: string, fallback?: string) => string;

function fmt(iso: string | null | undefined, ut: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toISOString().slice(11, 16) + ' ' + ut;
}

function qualityColor(q: string): string {
  return q === 'good' ? 'bg-green-100 text-green-800'
    : q === 'bad' ? 'bg-red-100 text-red-800'
    : 'bg-yellow-100 text-yellow-800';
}

export function MuhurtaProPage() {
  const { t, al } = useT();
  const [tab, setTab] = useState<Tab>('day');
  const [placeName, setPlaceName] = useState('New Delhi, India');
  const [lat, setLat] = useState(28.6139);
  const [lng, setLng] = useState(77.2090);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [birthNak, setBirthNak] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [day, setDay] = useState<any>(null);
  const [week, setWeek] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [varjyam, setVarjyam] = useState<any[]>([]);

  async function loadDay() {
    setLoading(true); setError(null);
    try {
      const r = await api.muhurtaDay({ date: new Date(date).toISOString(), lat, lng, birthNak: birthNak || undefined });
      setDay(r.day);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  async function loadWeek() {
    setLoading(true); setError(null);
    try {
      const r = await api.muhurtaWeek({ start: new Date(date).toISOString(), lat, lng, birthNak: birthNak || undefined });
      setWeek(r.days);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  async function loadVarjyam() {
    setLoading(true); setError(null);
    try {
      const r = await api.varjyamWidget({ date: new Date(date).toISOString(), lat, lng, days: 7 });
      setVarjyam(r.varjyam);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    api.muhurtaPresets().then((r) => setPresets(r.presets)).catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    if (tab === 'day') loadDay();
    else if (tab === 'week') loadWeek();
    else if (tab === 'varjyam') loadVarjyam();
  }, [tab, date, lat, lng]);   // eslint-disable-line react-hooks/exhaustive-deps

  const utLabel = t('muhurtaPro.utSuffix', 'UT');

  return (
    <PageShell
      title={t('muhurtaPro.title', 'Muhurta Pro')}
      subtitle={t('muhurtaPro.subtitle', 'Classical muhurta classes · 35+ presets · Chaughadia/Hora calendar · Varjyam widget.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="space-y-4">
          <Card title={t('muhurtaPro.locDate', 'Location & date')}>
            <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (tab === 'day') loadDay(); else if (tab === 'week') loadWeek(); else if (tab === 'varjyam') loadVarjyam(); }}
              className="space-y-3">
              <div className="text-xs">
                <div className="text-vedicMaroon/70 mb-1">{t('muhurtaPro.place', 'Place')}</div>
                <CityAutocomplete value={placeName} onChange={setPlaceName}
                  onSelect={(c) => { setPlaceName(c.name); setLat(c.lat); setLng(c.lng); }} />
                <div className="flex gap-2 mt-1 text-[10px] text-vedicMaroon/50 font-mono">
                  <span>{lat.toFixed(4)}°</span><span>·</span><span>{lng.toFixed(4)}°</span>
                </div>
              </div>
              <label className="block text-xs">
                <span className="text-vedicMaroon/70">{t('muhurtaPro.date', 'Date')}</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-vedicGold/30 bg-white" />
              </label>
              <label className="block text-xs">
                <span className="text-vedicMaroon/70">{t('muhurtaPro.birthNak', 'Birth nakshatra (1-27, for Tara-bala)')}</span>
                <input type="number" min={1} max={27} value={birthNak} onChange={(e) => setBirthNak(e.target.value ? Number(e.target.value) : '')}
                  className="w-full mt-1 px-2 py-1.5 rounded border border-vedicGold/30 bg-white" />
              </label>
              <button type="submit" className="w-full btn btn-primary text-sm py-2">{t('muhurtaPro.reload', 'Reload')}</button>
            </form>
          </Card>
        </aside>

        <main className="space-y-4">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-vedicGold/30 bg-vedicCream/30 w-fit">
            {TABS.map((tt) => (
              <button key={tt.key} onClick={() => setTab(tt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  tab === tt.key ? 'bg-vedicMaroon text-white' : 'text-vedicMaroon/70 hover:bg-vedicMaroon/5'
                }`}>
                {t(tt.labelKey, tt.labelFallback)}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-vedicMaroon/60 -mt-2">
            {(() => {
              const found = TABS.find((tt) => tt.key === tab);
              return found ? t(found.descKey, found.descFallback) : '';
            })()}
          </p>

          {loading && <EmptyState>{t('muhurtaPro.loading', 'Loading…')}</EmptyState>}
          {tab === 'day'     && day && <DayView data={day} t={t} al={al} ut={utLabel} />}
          {tab === 'week'    && week.length > 0 && <WeekView days={week} t={t} al={al} />}
          {tab === 'presets' && <PresetsView presets={presets} t={t} />}
          {tab === 'varjyam' && <VarjyamView data={varjyam} t={t} al={al} ut={utLabel} />}
          {tab === 'yogas'   && <YogasView t={t} />}
        </main>
      </div>
    </PageShell>
  );
}

// ─── Day view ────────────────────────────────────────────────────

function DayView({ data, t, al, ut }: { data: any; t: T; al: AstroTranslator; ut: string }) {
  return (
    <div className="space-y-3">
      <Card title={`${data.date} · ${data.weekday ? al.vara(data.weekday) : ''}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <Tile label={t('muhurtaPro.tile.tithi', 'Tithi')}     value={data.summary?.tithi} />
          <Tile label={t('muhurtaPro.tile.nakshatra', 'Nakshatra')} value={data.summary?.nakshatra} />
          <Tile label={t('muhurtaPro.tile.yoga', 'Yoga')}      value={data.summary?.yoga} />
          <Tile label={t('muhurtaPro.tile.karana', 'Karana')}    value={data.summary?.karana} />
        </div>
        {data.panchangYogas?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {data.panchangYogas.map((y: any, i: number) => (
              <Pill key={i} tone={y.strength === 'strong' ? 'good' : 'info'}>
                {/* TODO(i18n-server): localize y.name (yoga name string) */}
                <span lang="en">{y.name}</span> · {al.strength(y.strength)}
              </Pill>
            ))}
          </div>
        )}
      </Card>

      <Card title={t('muhurtaPro.inauspicious', 'Inauspicious periods (avoid)')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <TimeRangeTile label={t('muhurtaPro.range.rahuKaal', 'Rahu Kaal')}   range={data.rahuKaal}   tone="bad" ut={ut} />
          <TimeRangeTile label={t('muhurtaPro.range.yamaghanda', 'Yamaghanda')}  range={data.yamaghanda} tone="bad" ut={ut} />
          <TimeRangeTile label={t('muhurtaPro.range.gulika', 'Gulika')}      range={data.gulika}     tone="bad" ut={ut} />
          <TimeRangeTile label={t('muhurtaPro.range.varjyam', 'Varjyam')}     range={data.varjyam}    tone="bad" ut={ut} />
        </div>
      </Card>

      <Card title={t('muhurtaPro.auspicious', 'Auspicious periods (use)')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <TimeRangeTile label={t('muhurtaPro.range.abhijit', 'Abhijit')}    range={data.abhijit}   tone="good" ut={ut} />
          <TimeRangeTile label={t('muhurtaPro.range.amritKaal', 'Amrit Kaal')} range={data.amritKaal} tone="good" ut={ut} />
          {(data.durMuhurtam || []).slice(0, 2).map((r: any, i: number) => (
            <TimeRangeTile key={i} label={t('muhurtaPro.range.durMuhurta', 'Dur-muhurta {n}').replace('{n}', String(i + 1))} range={r} tone="warn" ut={ut} />
          ))}
        </div>
      </Card>

      <Card title={t('muhurtaPro.chaughadiaTitle', 'Chaughadia (16 segments: 8 day + 8 night)')} padded={false}>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-1 p-3 text-[10px]">
          {(data.chaughadia || []).map((c: any, i: number) => (
            <div key={i} className={`p-1.5 rounded text-center ${qualityColor(c.quality)}`}>
              {/* TODO(i18n-server): localize c.label (chaughadia segment name) */}
              <div className="font-bold" lang="en">{c.label}</div>
              <div className="font-mono text-[9px] opacity-70">{fmt(c.start, ut)}</div>
              <div className="opacity-50 text-[9px]">{c.isDay ? t('muhurtaPro.day', 'Day') : t('muhurtaPro.night', 'Night')}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('muhurtaPro.horaTitle', 'Hora — 24 planetary hours')} padded={false}>
        <div className="grid grid-cols-6 md:grid-cols-12 gap-1 p-3 text-[10px]">
          {(data.hora || []).map((h: any, i: number) => (
            <div key={i} className={`p-1.5 rounded border border-vedicGold/20 text-center ${h.isDay ? 'bg-yellow-50' : 'bg-indigo-50'}`}>
              <div className="font-bold text-vedicMaroon">{al.planet(h.ruler)}</div>
              <div className="font-mono text-[9px] opacity-60">{fmt(h.start, ut)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Week view ────────────────────────────────────────────────

function WeekView({ days, t, al }: { days: any[]; t: T; al: AstroTranslator }) {
  return (
    <Card title={t('muhurtaPro.weekTitle', '7-day panchang + muhurta classes')}>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-vedicMaroon/60">
            <th className="py-1">{t('muhurtaPro.col.date', 'Date')}</th>
            <th>{t('muhurtaPro.col.day', 'Day')}</th>
            <th>{t('muhurtaPro.col.tithi', 'Tithi')}</th>
            <th>{t('muhurtaPro.col.nak', 'Nakshatra')}</th>
            <th>{t('muhurtaPro.col.yoga', 'Yoga')}</th>
            <th>{t('muhurtaPro.col.classes', 'Active classes')}</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d, i) => (
            <tr key={i} className="border-t border-vedicGold/10">
              <td className="py-1 font-mono">{d.date}</td>
              <td>{d.weekday ? al.vara(d.weekday) : ''}</td>
              <td className="text-[11px]">{d.summary?.tithi}</td>
              <td className="text-[11px]">{d.summary?.nakshatra}</td>
              <td className="text-[11px]">{d.summary?.yoga}</td>
              <td>
                <div className="flex flex-wrap gap-1">
                  {(d.panchangYogas || []).map((y: any, j: number) => (
                    // TODO(i18n-server): localize y.name (yoga name string)
                    <span key={j} className="text-[9px] px-1.5 py-0.5 rounded bg-vedicMaroon/10 text-vedicMaroon font-semibold" lang="en">
                      {y.name}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ─── Presets view ────────────────────────────────────────────

function PresetsView({ presets, t }: { presets: any[]; t: T }) {
  const grouped: Record<string, any[]> = {};
  for (const p of presets) (grouped[p.category] ||= []).push(p);
  return (
    <div className="space-y-3">
      <Card title={t('muhurtaPro.presetTitle', '{n} event presets (8 categories)').replace('{n}', String(presets.length))}>
        <p className="text-xs text-vedicMaroon/70 mb-3">
          {t('muhurtaPro.presetIntro', 'Each preset encodes preferred nakshatras · weekdays · tithis · horas — select one and run a muhurta search against it.')}
        </p>
        {Object.entries(grouped).map(([cat, list]) => (
          <div key={cat} className="mb-4">
            {/* TODO(i18n-server): localize category names */}
            <div className="text-[10px] uppercase tracking-wider font-semibold text-vedicMaroon/50 mb-1.5" lang="en">
              {t('muhurtaPro.presetCount', '{cat} · {n}').replace('{cat}', cat).replace('{n}', String(list.length))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {list.map((p) => (
                <div key={p.key} className="p-2 rounded border border-vedicGold/20 bg-parchment/40">
                  {/* TODO(i18n-server): localize preset.label and preset.note */}
                  <div className="font-semibold text-vedicMaroon text-sm" lang="en">{p.label}</div>
                  <div className="text-[11px] text-vedicMaroon/60 mt-0.5" lang="en">{p.note}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Varjyam widget ──────────────────────────────────────────

function VarjyamView({ data, t, al: _al, ut }: { data: any[]; t: T; al: AstroTranslator; ut: string }) {
  return (
    <Card title={t('muhurtaPro.varjyamTitle', 'Varjyam · Amrit-kaal · Rahu-kaal — rolling 7 days')}>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-vedicMaroon/60">
            <th className="py-1">{t('muhurtaPro.varjyam.col.date', 'Date')}</th>
            <th>{t('muhurtaPro.varjyam.col.nak', 'Nakshatra')}</th>
            <th>{t('muhurtaPro.varjyam.col.varjyam', 'Varjyam')}</th>
            <th>{t('muhurtaPro.varjyam.col.amrit', 'Amrit-kaal')}</th>
            <th>{t('muhurtaPro.varjyam.col.rahu', 'Rahu-kaal')}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d, i) => (
            <tr key={i} className="border-t border-vedicGold/10">
              <td className="py-1 font-mono">{d.date}</td>
              {/* TODO(i18n-server): nakshatra is a string here; would prefer an ID for al.nakshatra */}
              <td lang="en">{d.nakshatra}</td>
              <td className="font-mono text-[11px] text-red-700">
                {d.varjyam ? `${fmt(d.varjyam.start, ut)} → ${fmt(d.varjyam.end, ut)}` : '—'}
              </td>
              <td className="font-mono text-[11px] text-green-700">
                {d.amritKaal ? `${fmt(d.amritKaal.start, ut)} → ${fmt(d.amritKaal.end, ut)}` : '—'}
              </td>
              <td className="font-mono text-[11px] text-red-700">
                {d.rahuKaal ? `${fmt(d.rahuKaal.start, ut)} → ${fmt(d.rahuKaal.end, ut)}` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// ─── Yogas checker ────────────────────────────────────────────

function YogasView({ t }: { t: T }) {
  const { al } = useT();
  const [weekday, setWeekday] = useState(4);
  const [nakshatra, setNakshatra] = useState(8);
  const [tithi, setTithi] = useState(5);
  const [birthNak, setBirthNak] = useState<number | ''>('');
  const [sunRashi, setSunRashi] = useState<number | ''>('');
  const [yogas, setYogas] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function check() {
    setLoading(true); setErr(null);
    try {
      const r = await api.muhurtaYogas({
        weekday, nakshatra, tithi,
        birthNak: birthNak || undefined,
        sunRashi: sunRashi || undefined,
      });
      setYogas(r.yogas);
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <Card title={t('muhurtaPro.yogas.title', 'Muhurta Yoga checker')}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs mb-3">
        <label className="flex flex-col gap-1">
          <span className="text-vedicMaroon/70">{t('muhurtaPro.yogas.weekday', 'Weekday (0=Sun)')}</span>
          <input type="number" min={0} max={6} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}
            className="px-2 py-1.5 rounded border border-vedicGold/30 bg-white" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-vedicMaroon/70">{t('muhurtaPro.yogas.nak', 'Nakshatra (1-27)')}</span>
          <input type="number" min={1} max={27} value={nakshatra} onChange={(e) => setNakshatra(Number(e.target.value))}
            className="px-2 py-1.5 rounded border border-vedicGold/30 bg-white" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-vedicMaroon/70">{t('muhurtaPro.yogas.tithi', 'Tithi (1-30)')}</span>
          <input type="number" min={1} max={30} value={tithi} onChange={(e) => setTithi(Number(e.target.value))}
            className="px-2 py-1.5 rounded border border-vedicGold/30 bg-white" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-vedicMaroon/70">{t('muhurtaPro.yogas.birthNak', 'Birth nak (optional)')}</span>
          <input type="number" min={1} max={27} value={birthNak} onChange={(e) => setBirthNak(e.target.value ? Number(e.target.value) : '')}
            className="px-2 py-1.5 rounded border border-vedicGold/30 bg-white" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-vedicMaroon/70">{t('muhurtaPro.yogas.sunRashi', 'Sun rashi (1-12)')}</span>
          <input type="number" min={1} max={12} value={sunRashi} onChange={(e) => setSunRashi(e.target.value ? Number(e.target.value) : '')}
            className="px-2 py-1.5 rounded border border-vedicGold/30 bg-white" />
        </label>
      </div>
      <button onClick={check} disabled={loading} className="btn btn-primary text-sm px-4 py-1.5">
        {loading ? t('muhurtaPro.yogas.checking', 'Checking…') : t('muhurtaPro.yogas.checkActive', 'Check active yogas')}
      </button>

      {err && <ErrorBanner>{err}</ErrorBanner>}
      {yogas && (
        <div className="mt-3">
          {yogas.length === 0 && (
            <p className="text-xs italic text-vedicMaroon/60">{t('muhurtaPro.yogas.empty', 'No active muhurta-class yogas for this moment.')}</p>
          )}
          {yogas.map((y, i) => (
            <div key={i} className="mb-2 p-2 rounded border border-vedicGold/20 bg-parchment/40">
              <div className="flex items-center gap-2 mb-1">
                {/* TODO(i18n-server): localize y.name (yoga name string) */}
                <Pill tone={y.strength === 'strong' ? 'good' : 'info'}><span lang="en">{y.name}</span></Pill>
                <span className="text-[10px] uppercase text-vedicMaroon/50">{al.strength(y.strength)}</span>
              </div>
              {/* TODO(i18n-server): localize y.reason prose */}
              <div className="text-xs text-vedicMaroon/70" lang="en">{y.reason}</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function Tile({ label, value }: { label: string; value: any }) {
  return (
    <div className="p-2 rounded border border-vedicGold/20 bg-parchment/40">
      <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50">{label}</div>
      <div className="font-semibold text-vedicMaroon">{value ?? '—'}</div>
    </div>
  );
}

function TimeRangeTile({ label, range, tone, ut }: { label: string; range: any; tone: 'good' | 'bad' | 'warn'; ut: string }) {
  const bg = tone === 'good' ? 'bg-green-50' : tone === 'bad' ? 'bg-red-50' : 'bg-yellow-50';
  const color = tone === 'good' ? 'text-green-800' : tone === 'bad' ? 'text-red-800' : 'text-yellow-800';
  return (
    <div className={`p-2 rounded border border-vedicGold/20 ${bg}`}>
      <div className={`text-[10px] uppercase tracking-wider ${color}`}>{label}</div>
      <div className={`font-mono text-[11px] ${color}`}>
        {range ? `${fmt(range.start, ut)} → ${fmt(range.end, ut)}` : '—'}
      </div>
    </div>
  );
}
