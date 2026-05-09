// Phase 16 — Calendar workspace.
//
// Four panels, driven by a single (lat, lng) location:
//   • Live panchang clock — right-now tithi/nak/yoga/karana with live countdowns,
//     ayana/ritu/masa progress bars.
//   • Festival engine — upcoming festivals for the next 180 days; category chips.
//   • Year calendar — 365-day grid, month-by-month, with festival & ekadashi dots.
//   • Ayana/Ritu/Masa viz — stacked horizontal bars over 12 months showing
//     solstice/equinox, seasons, and lunar-month boundaries.
//
// Default location: Mumbai (19.0760, 72.8777). User can enter any lat/lng.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, PageShell, ErrorBanner, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';

const MONTH_KEYS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WEEKDAY_KEYS = ['S','M','T','W','T','F','S'];

type Tab = 'live' | 'festivals' | 'year' | 'viz';

type T = (key: string, fallback?: string) => string;

function fmtMs(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms < 0) return '—';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

function categoryTone(cat: string): string {
  switch (cat) {
    case 'major':      return 'bg-vedicMaroon text-white';
    case 'jayanti':    return 'bg-vedicGold/90 text-vedicMaroon';
    case 'ekadashi':   return 'bg-indigo-100 text-indigo-800';
    case 'purnima':    return 'bg-yellow-100 text-yellow-800';
    case 'amavasya':   return 'bg-slate-700 text-white';
    case 'sankranti':  return 'bg-orange-200 text-orange-900';
    case 'vrata':      return 'bg-emerald-100 text-emerald-800';
    default:           return 'bg-parchment text-vedicMaroon';
  }
}

function localizeCategory(t: T, c: string): string {
  return t(`calendar.cat.${c}`, c);
}

export function CalendarPage() {
  const { t, al } = useT();
  const [tab, setTab] = useState<Tab>('live');
  const [lat, setLat] = useState('19.0760');
  const [lng, setLng] = useState('72.8777');
  const [locName, setLocName] = useState('Mumbai');
  const [live, setLive] = useState<any | null>(null);
  const [festivals, setFestivals] = useState<any[] | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [yearData, setYearData] = useState<{ days: any[]; segments: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tickMs, setTickMs] = useState(Date.now());
  const fetchedLiveAt = useRef<number>(0);

  async function loadLive() {
    setError(null);
    try {
      const r = await api.calendarLive(Number(lat), Number(lng));
      setLive(r.live);
      fetchedLiveAt.current = Date.now();
    } catch (e) { setError((e as Error).message); }
  }
  async function loadFestivals() {
    setLoading(true); setError(null);
    try {
      const start = new Date();
      const end = new Date(start.getTime() + 180 * 86400000);
      const r = await api.calendarFestivals(
        Number(lat), Number(lng),
        start.toISOString().slice(0, 10),
        end.toISOString().slice(0, 10),
      );
      setFestivals(r.festivals);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }
  async function loadYear(y: number) {
    setLoading(true); setError(null);
    try {
      const r = await api.calendarYear(Number(lat), Number(lng), y);
      setYearData({ days: r.days, segments: r.segments });
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  // Initial load of live panchang
  useEffect(() => { loadLive(); /* eslint-disable-next-line */ }, []);

  // Smooth 1-second ticker for countdown animation
  useEffect(() => {
    const id = setInterval(() => setTickMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-refresh live panchang every 5 minutes to re-anchor transitions
  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() - fetchedLiveAt.current >= 5 * 60 * 1000) loadLive();
    }, 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line
  }, [lat, lng]);

  // Lazy-load festivals and year when switching tabs
  useEffect(() => {
    if (tab === 'festivals' && !festivals) loadFestivals();
    if ((tab === 'year' || tab === 'viz') && !yearData) loadYear(year);
    // eslint-disable-next-line
  }, [tab]);

  const liveCountdowns = useMemo(() => {
    if (!live) return null;
    const drift = Date.now() - fetchedLiveAt.current;
    void tickMs;
    return {
      tithi:     live.countdowns.tithiMs     != null ? live.countdowns.tithiMs     - drift : null,
      nakshatra: live.countdowns.nakshatraMs != null ? live.countdowns.nakshatraMs - drift : null,
      yoga:      live.countdowns.yogaMs      != null ? live.countdowns.yogaMs      - drift : null,
      karana:    live.countdowns.karanaMs    != null ? live.countdowns.karanaMs    - drift : null,
      sunrise:   live.countdowns.sunriseMs   != null ? live.countdowns.sunriseMs   - drift : null,
      sunset:    live.countdowns.sunsetMs    != null ? live.countdowns.sunsetMs    - drift : null,
    };
  }, [live, tickMs]);

  return (
    <PageShell
      title={t('calendar.title', 'Calendar')}
      subtitle={t('calendar.subtitle', 'Live panchang clock · festival engine · 365-day calendar · Ayana / Ritu / Masa visualization')}
    >
      {/* ── Location row ───────────────────────────────────────────────── */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-vedicMaroon/70 mb-1">
              {t('calendar.place', 'Place')}
            </label>
            <input
              value={locName} onChange={(e) => setLocName(e.target.value)}
              className="px-2 py-1.5 text-sm border border-vedicGold/40 rounded bg-parchment/30 w-40"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-vedicMaroon/70 mb-1">
              {t('calendar.lat', 'Latitude')}
            </label>
            <input
              value={lat} onChange={(e) => setLat(e.target.value)}
              className="px-2 py-1.5 text-sm border border-vedicGold/40 rounded bg-parchment/30 w-28 font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-vedicMaroon/70 mb-1">
              {t('calendar.lng', 'Longitude')}
            </label>
            <input
              value={lng} onChange={(e) => setLng(e.target.value)}
              className="px-2 py-1.5 text-sm border border-vedicGold/40 rounded bg-parchment/30 w-28 font-mono"
            />
          </div>
          <button
            onClick={() => { loadLive(); setFestivals(null); setYearData(null); }}
            className="px-3 py-1.5 text-sm rounded bg-vedicMaroon text-white hover:bg-vedicMaroon/90"
          >
            {t('calendar.refresh', 'Refresh')}
          </button>
          {live && (
            <div className="ml-auto text-[11px] text-vedicMaroon/60">
              {t('calendar.snapshot', 'Snapshot: {time}').replace('{time}', new Date(live.now).toLocaleString())}
            </div>
          )}
        </div>
      </Card>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4">
        {(['live','festivals','year','viz'] as Tab[]).map((tk) => (
          <button key={tk} onClick={() => setTab(tk)}
            className={`px-3 py-1.5 text-sm rounded border ${
              tab === tk
                ? 'bg-vedicMaroon text-white border-vedicMaroon'
                : 'bg-white text-vedicMaroon border-vedicGold/40 hover:bg-parchment'
            }`}>
            {tk === 'live' ? t('calendar.tab.live', 'Live Clock') :
             tk === 'festivals' ? t('calendar.tab.festivals', 'Festivals') :
             tk === 'year' ? t('calendar.tab.year', 'Year View') : t('calendar.tab.viz', 'Ayana / Ritu / Masa')}
          </button>
        ))}
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {/* ── Live clock panel ───────────────────────────────────────────── */}
      {tab === 'live' && live && liveCountdowns && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="text-xs uppercase tracking-wider text-vedicMaroon/70 mb-3">
              {t('calendar.rightNow', 'Right now — {place}').replace('{place}', locName)}
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <LiveField label={t('calendar.field.vara', 'Vara')}      value={al.vara(live.vara.name)} sub={al.planet(live.vara.lord)}/>
              <LiveField label={t('calendar.field.paksha', 'Paksha')}    value={al.paksha(live.tithi.paksha)} sub={live.tithi.paksha === 'Shukla' ? t('calendar.waxing', 'waxing') : t('calendar.waning', 'waning')}/>
              <LiveField label={t('calendar.field.tithi', 'Tithi')}     value={al.tithi(live.tithi.name)}    sub={t('calendar.endsIn', 'ends in {ms} → {next}').replace('{ms}', fmtMs(liveCountdowns.tithi)).replace('{next}', al.tithi(live.tithi.nextName))}
                progress={live.progress.tithi}/>
              <LiveField label={t('calendar.field.nakshatra', 'Nakshatra')} value={live.nakshatra.name} sub={t('calendar.endsIn', 'ends in {ms} → {next}').replace('{ms}', fmtMs(liveCountdowns.nakshatra)).replace('{next}', live.nakshatra.nextName)}
                progress={live.progress.nakshatra}/>
              <LiveField label={t('calendar.field.yoga', 'Yoga')}      value={al.pyoga(live.yoga.name)}      sub={t('calendar.endsIn', 'ends in {ms} → {next}').replace('{ms}', fmtMs(liveCountdowns.yoga)).replace('{next}', al.pyoga(live.yoga.nextName))}
                progress={live.progress.yoga}/>
              <LiveField label={t('calendar.field.karana', 'Karana')}    value={al.karana(live.karana.name)}    sub={t('calendar.endsIn', 'ends in {ms} → {next}').replace('{ms}', fmtMs(liveCountdowns.karana)).replace('{next}', al.karana(live.karana.nextName))}/>
            </div>
          </Card>

          <Card>
            <div className="text-xs uppercase tracking-wider text-vedicMaroon/70 mb-3">
              {t('calendar.solarCycle', 'Solar cycle')}
            </div>
            {/* TODO(i18n-server): localize live.ayana / live.ritu / live.masa value strings */}
            <ProgressRow label={t('calendar.ayana', 'Ayana')} value={live.ayana} fraction={live.progress.ayana} note={t('calendar.sunAt', 'sun at {deg}°').replace('{deg}', live.solarMarkers.sunDeg.toFixed(2))}/>
            <ProgressRow label={t('calendar.ritu', 'Ritu')}  value={live.ritu}  fraction={live.progress.ritu}/>
            <ProgressRow label={t('calendar.masa', 'Masa')}  value={live.masa.amanta} fraction={live.progress.masa}
              note={t('calendar.newMoonRange', 'new moon → new moon ({pct}%)').replace('{pct}', (live.progress.masa * 100).toFixed(1))}/>
            <div className="mt-3 pt-3 border-t border-vedicGold/30 text-[11px] text-vedicMaroon/70">
              <div>{t('calendar.samvat', 'Samvat: Vikram {vikram} · Shaka {shaka} · Kali {kali}').replace('{vikram}', String(live.samvat.vikram)).replace('{shaka}', String(live.samvat.shaka)).replace('{kali}', String(live.samvat.kali))}</div>
              <div lang="en">{t('calendar.masaLine', 'Masa: Amanta {amanta} / Purnimanta {purnimanta}').replace('{amanta}', live.masa.amanta).replace('{purnimanta}', live.masa.purnimanta)}</div>
            </div>
          </Card>

          <Card>
            <div className="text-xs uppercase tracking-wider text-vedicMaroon/70 mb-3">
              {t('calendar.dayAnchors', 'Day anchors')}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <DayAnchor label={t('calendar.sunrise', 'Sunrise')}   time={live.sunrise}   countdown={liveCountdowns.sunrise}/>
              <DayAnchor label={t('calendar.sunset', 'Sunset')}    time={live.sunset}    countdown={liveCountdowns.sunset}/>
              <DayAnchor label={t('calendar.moonrise', 'Moonrise')}  time={live.moonrise}/>
              <DayAnchor label={t('calendar.moonset', 'Moonset')}   time={live.moonset}/>
              <DayAnchor label={t('calendar.brahmaMuhurta', 'Brahma Muhurta')} range={live.brahmaMuhurat}/>
              <DayAnchor label={t('calendar.abhijitMuhurat', 'Abhijit Muhurat')} range={live.abhijitMuhurat}/>
              <DayAnchor label={t('calendar.amritKaal', 'Amrit Kaal')}  range={live.amritKaal}/>
              <DayAnchor label={t('calendar.godhuli', 'Godhuli')}     range={live.godhuliMuhurat}/>
            </div>
          </Card>

          <Card>
            <div className="text-xs uppercase tracking-wider text-vedicMaroon/70 mb-3">
              {t('calendar.inauspicious', 'Inauspicious today')}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <DayAnchor label={t('calendar.rahuKaal', 'Rahu Kaal')}   range={live.rahuKaal}    bad/>
              <DayAnchor label={t('calendar.gulika', 'Gulika')}       range={live.gulika}       bad/>
              <DayAnchor label={t('calendar.yamaghanda', 'Yamaghanda')}   range={live.yamaghanda}   bad/>
              <DayAnchor label={t('calendar.varjyam', 'Varjyam')}      range={live.varjyam}      bad/>
            </div>
            {live.durMuhurtam?.length > 0 && (
              <div className="mt-2 text-[11px] text-vedicMaroon/70">
                {t('calendar.durMuhurtam', 'Dur Muhurtam: {ranges}').replace('{ranges}', live.durMuhurtam.map((r: any) =>
                  `${fmtTime(r.start)}–${fmtTime(r.end)}`).join(' · '))}
              </div>
            )}
            <div className="mt-2 text-[11px] text-vedicMaroon/70">
              {/* TODO(i18n-server): localize disha shool direction */}
              <span>{t('calendar.dishaShool', 'Disha Shool: {dir}').replace('{dir}', '')}</span>
              <span className="font-semibold" lang="en">{live.vara.dishaShool}</span>
            </div>
          </Card>
        </div>
      )}

      {/* ── Festivals panel ────────────────────────────────────────────── */}
      {tab === 'festivals' && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-vedicMaroon">
              {t('calendar.festivalsTitle', 'Festivals — next 180 days')}
            </div>
            {loading && <span className="text-xs text-vedicMaroon/60">{t('calendar.loading', 'loading…')}</span>}
          </div>
          {festivals && festivals.length > 0 && (
            <div className="space-y-1 max-h-[65vh] overflow-y-auto">
              {festivals.map((f, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-vedicGold/10 last:border-0">
                  <div className="w-24 shrink-0 text-[11px] font-mono text-vedicMaroon/70">{f.date}</div>
                  <span className={`px-1.5 py-0.5 text-[9px] uppercase rounded ${categoryTone(f.def.category)}`}>
                    {localizeCategory(t, f.def.category)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-vedicMaroon truncate">{f.def.name}</div>
                    <div className="text-[11px] text-vedicMaroon/60 truncate">
                      {f.reason}{f.def.note ? ` — ${f.def.note}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {festivals && festivals.length === 0 && (
            <div className="text-sm text-vedicMaroon/60 italic">{t('calendar.noFestivals', 'No festivals in this range.')}</div>
          )}
        </Card>
      )}

      {/* ── Year calendar grid ─────────────────────────────────────────── */}
      {tab === 'year' && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => { const y = year - 1; setYear(y); loadYear(y); }}
              className="px-2 py-1 text-xs rounded border border-vedicGold/40 hover:bg-parchment">
              ← {year - 1}
            </button>
            <div className="px-3 py-1 text-sm font-semibold text-vedicMaroon">{year}</div>
            <button
              onClick={() => { const y = year + 1; setYear(y); loadYear(y); }}
              className="px-2 py-1 text-xs rounded border border-vedicGold/40 hover:bg-parchment">
              {year + 1} →
            </button>
            {loading && <span className="ml-2 text-xs text-vedicMaroon/60">{t('calendar.loading', 'loading…')}</span>}
          </div>

          {yearData && <YearGrid days={yearData.days} />}
        </>
      )}

      {/* ── Ayana/Ritu/Masa viz ────────────────────────────────────────── */}
      {tab === 'viz' && (
        <>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => { const y = year - 1; setYear(y); loadYear(y); }}
              className="px-2 py-1 text-xs rounded border border-vedicGold/40 hover:bg-parchment">
              ← {year - 1}
            </button>
            <div className="px-3 py-1 text-sm font-semibold text-vedicMaroon">{year}</div>
            <button
              onClick={() => { const y = year + 1; setYear(y); loadYear(y); }}
              className="px-2 py-1 text-xs rounded border border-vedicGold/40 hover:bg-parchment">
              {year + 1} →
            </button>
            {loading && <span className="ml-2 text-xs text-vedicMaroon/60">{t('calendar.loading', 'loading…')}</span>}
          </div>
          {yearData && <SegmentBars year={year} segments={yearData.segments} />}
        </>
      )}
    </PageShell>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function LiveField({ label, value, sub, progress }: {
  label: string; value: string; sub?: string; progress?: number;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/60">{label}</div>
      <div className="text-base font-semibold text-vedicMaroon">{value}</div>
      {progress != null && (
        <div className="mt-1 h-1 bg-vedicGold/15 rounded overflow-hidden">
          <div className="h-full bg-vedicMaroon" style={{ width: `${(progress * 100).toFixed(1)}%` }} />
        </div>
      )}
      {sub && <div className="text-[10px] text-vedicMaroon/60 mt-0.5">{sub}</div>}
    </div>
  );
}

function ProgressRow({ label, value, fraction, note }: {
  label: string; value: string; fraction: number; note?: string;
}) {
  const pct = Math.max(0, Math.min(1, fraction)) * 100;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs">
        <span className="uppercase tracking-wider text-vedicMaroon/70">{label}</span>
        {/* TODO(i18n-server): localize value (server prose) */}
        <span className="font-semibold text-vedicMaroon" lang="en">{value}</span>
      </div>
      <div className="mt-1 h-2 bg-vedicGold/15 rounded overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 bg-vedicMaroon transition-all"
          style={{ width: `${pct.toFixed(1)}%` }} />
      </div>
      <div className="flex justify-between mt-0.5 text-[10px] text-vedicMaroon/60">
        <span>{pct.toFixed(1)}%</span>
        {note && <span>{note}</span>}
      </div>
    </div>
  );
}

function DayAnchor({ label, time, range, countdown, bad }: {
  label: string; time?: string | null; range?: { start: string; end: string } | null;
  countdown?: number | null; bad?: boolean;
}) {
  const { t } = useT();
  return (
    <div className={`p-2 rounded ${bad ? 'bg-red-50' : 'bg-parchment/40'}`}>
      <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/60">{label}</div>
      {time && <div className="text-sm font-semibold text-vedicMaroon">{fmtTime(time)}</div>}
      {range && (
        <div className="text-sm font-semibold text-vedicMaroon">
          {fmtTime(range.start)}–{fmtTime(range.end)}
        </div>
      )}
      {!time && !range && <div className="text-sm text-vedicMaroon/50">—</div>}
      {countdown != null && countdown > 0 && (
        <div className="text-[10px] text-vedicMaroon/60">{t('calendar.in', 'in {ms}').replace('{ms}', fmtMs(countdown))}</div>
      )}
    </div>
  );
}

function YearGrid({ days }: { days: any[] }) {
  // Group days by (year, month).
  const byMonth = new Map<number, any[]>();
  for (const d of days) {
    const m = parseInt(d.date.slice(5, 7), 10) - 1;
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(d);
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {MONTH_KEYS.map((name, idx) => {
        const monthDays = byMonth.get(idx) ?? [];
        return <MonthCard key={idx} monthKey={name} days={monthDays} />;
      })}
    </div>
  );
}

function MonthCard({ monthKey, days }: { monthKey: string; days: any[] }) {
  const { t } = useT();
  if (days.length === 0) return null;
  // Find starting weekday offset
  const firstWd = days[0].weekdayNum;
  const cells: (any | null)[] = [...Array(firstWd).fill(null), ...days];
  while (cells.length % 7 !== 0) cells.push(null);
  return (
    <Card>
      <div className="flex items-baseline justify-between mb-2">
        <div className="text-sm font-semibold text-vedicMaroon">{t(`calendar.month.${monthKey}`, monthKey)}</div>
        {/* TODO(i18n-server): localize masa/ritu name strings */}
        <div className="text-[10px] text-vedicMaroon/60" lang="en">
          {days[0].masa} · {days[0].ritu}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-[10px]">
        {WEEKDAY_KEYS.map((w, i) => (
          <div key={i} className="text-center text-vedicMaroon/50 font-semibold py-0.5">{t(`calendar.wd.${w}`, w)}</div>
        ))}
        {cells.map((d, i) => d ? <DayCell key={i} d={d} /> : <div key={i} />)}
      </div>
    </Card>
  );
}

function DayCell({ d }: { d: any }) {
  const day = parseInt(d.date.slice(8, 10), 10);
  const hasMajor = d.festivals.some((f: any) => f.category === 'major' || f.category === 'jayanti');
  const hasMinor = d.festivals.length > 0 && !hasMajor;
  const isEkadashi = d.specialBadges.includes('Ekadashi');
  const isPurnima = d.specialBadges.includes('Purnima');
  const isAmavasya = d.specialBadges.includes('Amavasya');
  const isSankranti = d.specialBadges.includes('Sankranti');

  // Tooltip kept in English (browser-native title attr): server prose,
  // safe for localization in a follow-up.
  const title = [
    `${d.date} (${d.weekday})`,
    `Tithi: ${d.tithi.paksha} ${d.tithi.name}`,
    `Nakshatra: ${d.nakshatra.name}`,
    `Yoga: ${d.yoga}`,
    `Masa: ${d.masa} · Ritu: ${d.ritu}`,
    ...d.festivals.map((f: any) => `★ ${f.name}`),
    ...d.specialBadges.map((b: string) => `• ${b}`),
  ].join('\n');

  let bg = 'bg-parchment/30 hover:bg-parchment';
  if (hasMajor)        bg = 'bg-vedicMaroon text-white';
  else if (hasMinor)   bg = 'bg-vedicGold/40';
  else if (isSankranti) bg = 'bg-orange-200';
  else if (isPurnima)  bg = 'bg-yellow-100';
  else if (isAmavasya) bg = 'bg-slate-300';

  return (
    <div title={title}
      className={`aspect-square flex flex-col items-center justify-center rounded cursor-help ${bg}`}>
      <div className="text-[10px] font-semibold">{day}</div>
      <div className="flex gap-0.5 mt-0.5">
        {isEkadashi && <div className="w-1 h-1 rounded-full bg-indigo-500" />}
        {(hasMinor || hasMajor) && !isEkadashi && <div className="w-1 h-1 rounded-full bg-current opacity-70" />}
      </div>
    </div>
  );
}

function SegmentBars({ year, segments }: { year: number; segments: any[] }) {
  const { t } = useT();
  const yearStart = new Date(Date.UTC(year, 0, 1)).getTime();
  const yearEnd = new Date(Date.UTC(year, 11, 31)).getTime();
  const totalMs = yearEnd - yearStart;

  function barPos(s: any): { left: number; width: number } {
    const start = Date.parse(s.start + 'T00:00:00Z');
    const end = Date.parse(s.end + 'T00:00:00Z') + 86400000;
    return {
      left: Math.max(0, ((start - yearStart) / totalMs) * 100),
      width: Math.max(0.5, ((end - start) / totalMs) * 100),
    };
  }

  const ayanaSegs = segments.filter((s) => s.kind === 'ayana');
  const rituSegs  = segments.filter((s) => s.kind === 'ritu');
  const masaSegs  = segments.filter((s) => s.kind === 'masa');

  function tone(kind: string, label: string): string {
    if (kind === 'ayana') return label === 'Uttarayana'
      ? 'bg-vedicGold/70 text-vedicMaroon'
      : 'bg-indigo-400/70 text-white';
    if (kind === 'ritu') {
      const m: Record<string, string> = {
        Vasanta:  'bg-emerald-300/80 text-emerald-900',
        Grishma:  'bg-amber-400/80 text-amber-900',
        Varsha:   'bg-blue-400/80 text-blue-900',
        Sharad:   'bg-orange-300/80 text-orange-900',
        Hemanta:  'bg-slate-400/80 text-white',
        Shishira: 'bg-cyan-300/80 text-cyan-900',
      };
      return m[label] ?? 'bg-parchment';
    }
    return 'bg-vedicMaroon/80 text-white';
  }

  function Bar({ segs, kind }: { segs: any[]; kind: string }) {
    return (
      <div className="relative h-8 rounded bg-vedicGold/10 overflow-hidden">
        {segs.map((s, i) => {
          const { left, width } = barPos(s);
          return (
            // TODO(i18n-server): localize segment label inside bar
            <div key={i} title={`${s.label} — ${s.start} to ${s.end}`}
              className={`absolute inset-y-0 flex items-center justify-center px-1 text-[10px] font-semibold border-r border-white/40 ${tone(kind, s.label)}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              lang="en">
              {width > 3 ? s.label : ''}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Card>
      <div className="text-sm font-semibold text-vedicMaroon mb-3">{t('calendar.yearTitle', 'Year {year} — solar & lunar cycle').replace('{year}', String(year))}</div>

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Pill>{t('calendar.ayana', 'Ayana')}</Pill>
          <span className="text-[10px] text-vedicMaroon/60">
            {t('calendar.uttarayanaInfo', 'Uttarayana (northbound) · Dakshinayana (southbound)')}
          </span>
        </div>
        <Bar segs={ayanaSegs} kind="ayana" />
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Pill>{t('calendar.ritu', 'Ritu')}</Pill>
          <span className="text-[10px] text-vedicMaroon/60">
            {t('calendar.rituInfo', '6 seasons — 2 solar months each')}
          </span>
        </div>
        <Bar segs={rituSegs} kind="ritu" />
      </div>

      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Pill>{t('calendar.masa', 'Masa')}</Pill>
          <span className="text-[10px] text-vedicMaroon/60">
            {t('calendar.masaInfo', 'Amanta lunar months (new moon → new moon)')}
          </span>
        </div>
        <Bar segs={masaSegs} kind="masa" />
      </div>

      {/* Month markers */}
      <div className="relative h-5 mt-1">
        {MONTH_KEYS.map((m, i) => {
          const start = new Date(Date.UTC(year, i, 1)).getTime();
          const left = ((start - yearStart) / totalMs) * 100;
          return (
            <div key={i} className="absolute top-0 text-[10px] text-vedicMaroon/70 font-mono"
              style={{ left: `${left}%` }}>
              <div className="w-px h-2 bg-vedicGold/40 mb-0.5" />
              {t(`calendar.month.${m}`, m)}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
