// Enterprise dashboard — welcome, metrics, chart preview, quick actions.
//
// Composition (top → bottom):
//   1. Welcome banner with date + current dasha badge
//   2. 4 metric cards (Current Maha · Today Tithi · Transit Focus · Active Yogas)
//   3. Two-column layout: Rasi chart + Planet table | Dasha timeline + Yoga list
//   4. Recent charts from library
//   5. Quick links footer row

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { NorthIndianChart } from '../components/charts/NorthIndianChart';
import { Card, PageShell, Pill, ErrorBanner, EmptyState } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import {
  IconCompass, IconClock, IconCalendar, IconStar, IconUsers,
  IconGrad, IconSparkle, IconChart,
} from '../components/ui/Icons';
import type {
  BirthInput, KundaliResult, VimshottariResult, YogaResult, ShadbalaResult,
} from '../types';
import { useDesktopNotifications } from '../hooks/useDesktopNotifications';

export function DashboardPage() {
  const { t, al } = useT();
  const navigate = useNavigate();
  const [kundali, setKundali] = useState<KundaliResult | null>(null);
  const [vim, setVim] = useState<VimshottariResult | null>(null);
  const [yogas, setYogas] = useState<YogaResult[] | null>(null);
  const [shad, setShad] = useState<ShadbalaResult | null>(null);
  const [panchang, setPanchang] = useState<any | null>(null);
  const [transits, setTransits] = useState<any | null>(null);
  const [libCount, setLibCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [widgets, setWidgets] = useState<any | null>(null);
  const notifs = useDesktopNotifications();

  useEffect(() => {
    api.libraryList().then((r) => setLibCount(r.charts.length)).catch(() => setLibCount(0));
  }, []);

  async function handleSubmit(input: BirthInput) {
    setLoading(true); setError(null);
    setKundali(null); setVim(null); setYogas(null); setShad(null); setPanchang(null); setTransits(null); setWidgets(null);
    setBirth(input);
    try {
      const today = new Date();
      const [k, v, y, s, p] = await Promise.all([
        api.calculate(input),
        api.vimshottari(input, true),
        api.yogas(input),
        api.shadbala(input),
        api.panchang(today.toISOString().slice(0, 10), input.lat, input.lng),
      ]);
      setKundali(k.kundali);
      setVim(v.vimshottari);
      setYogas(y.yogas);
      setShad(s.shadbala);
      setPanchang(p.panchang);
      // Transits available via horoscope payload — fetch separately & tolerate failure
      api.horoscope(input, 'day').then((h) => {
        setTransits({ positions: h.horoscope?.transitFocus?.map((tf: any) => ({ id: tf.planet, natalHouse: tf.natalHouse })) ?? [] });
      }).catch(() => {});
      // Phase 20 widgets — tolerate failure
      api.dashboardWidgets(input, new Date().toISOString()).then((w) => {
        setWidgets(w.snapshot);
      }).catch(() => {});
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  const currentMaha = vim?.mahadashas?.find((m) => {
    const t = Date.now();
    return new Date(m.start).getTime() <= t && t < new Date(m.end).getTime();
  });

  // Fire a one-shot desktop notification when a slow-planet ingress is today
  useEffect(() => {
    if (!widgets || !notifs.supported || notifs.permission !== 'granted') return;
    const nt = widgets.nextTransit;
    if (nt?.found && typeof nt.daysUntil === 'number' && nt.daysUntil <= 1) {
      const planet = al.planet(nt.planet);
      const toSign = al.rashi(nt.toSign);
      const fromSign = al.rashi(nt.fromSign);
      const whenLabel = nt.daysUntil === 0 ? t('widgets.today') : t('widgets.tomorrow');
      notifs.notify(
        `${t('widgets.nextTransit')}: ${planet} · ${whenLabel}`,
        `${planet}: ${fromSign} → ${toSign}`,
      );
    }
  }, [widgets, notifs.permission, notifs.supported, t, al]);
  const strongYogas = yogas?.filter((y) => y.strength === 'strong') ?? [];
  const jupiterHouse = transits?.positions?.find((p: any) => p.id === 'JU')?.natalHouse;
  const saturnHouse  = transits?.positions?.find((p: any) => p.id === 'SA')?.natalHouse;

  return (
    <PageShell
      title={t('dashboard.title')}
      subtitle={t('dashboard.subtitle')}
      actions={
        <>
          <button onClick={() => navigate('/')} className="btn btn-secondary">
            <IconCompass width={16} height={16} /> {t('dashboard.fullKundali')}
          </button>
          <button onClick={() => navigate('/timing')} className="btn btn-primary">
            <IconClock width={16} height={16} /> {t('dashboard.timingView')}
          </button>
        </>
      }>
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {!kundali && (
        <div className="grid md:grid-cols-[380px_1fr] gap-6">
          <div>
            <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
          </div>
          <div className="space-y-4">
            <WelcomeBanner libCount={libCount} t={t} />
            <QuickLinks navigate={navigate} t={t} />
          </div>
        </div>
      )}

      {kundali && (
        <div className="space-y-6">
          {/* Metric row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon={<IconClock />}
              label={t('dashboard.currentMaha')}
              value={currentMaha ? al.planet(currentMaha.lord) : '—'}
              sub={currentMaha
                ? `${new Date(currentMaha.start).toLocaleDateString()} → ${new Date(currentMaha.end).toLocaleDateString()}`
                : t('dashboard.notActive')}
            />
            <MetricCard
              icon={<IconCalendar />}
              label={t('dashboard.todayTithi')}
              value={panchang ? al.tithi(panchang.tithi.name) : '—'}
              sub={panchang ? `${al.paksha(panchang.tithi.paksha)} · ${al.vara(panchang.vara.name)}` : ''}
            />
            <MetricCard
              icon={<IconSparkle />}
              label={t('dashboard.transitFocus')}
              value={jupiterHouse ? `${t('common.houseShort')}${jupiterHouse} / ${t('common.houseShort')}${saturnHouse}` : '—'}
              sub={jupiterHouse ? `${al.planet('JU')} ${t('common.houseShort')}${jupiterHouse} · ${al.planet('SA')} ${t('common.houseShort')}${saturnHouse}` : ''}
            />
            <MetricCard
              icon={<IconStar />}
              label={t('dashboard.yogasCount')}
              value={(yogas?.length ?? 0).toString()}
              sub={strongYogas.length > 0 ? `${strongYogas.length} ${al.strength('strong')}` : ''}
            />
          </div>

          {/* Phase 20 — workflow widgets */}
          {widgets && (
            <Phase20Widgets widgets={widgets} notifs={notifs} />
          )}

          {/* Main grid: chart + planet snapshot */}
          <div className="grid lg:grid-cols-[1.1fr_1fr] gap-4">
            <Card title={t('dashboard.rasiChart')}>
              <div className="flex justify-center">
                <NorthIndianChart kundali={kundali} />
              </div>
            </Card>
            <div className="space-y-4">
              <ChartSnapshot kundali={kundali} t={t} al={al} />
              {shad && <ShadbalaMini shadbala={shad} t={t} al={al} />}
            </div>
          </div>

          {/* Dasha + yogas */}
          <div className="grid lg:grid-cols-2 gap-4">
            {vim && <DashaSnapshot vim={vim} t={t} al={al} />}
            {yogas && <YogasMini yogas={yogas} t={t} al={al} />}
          </div>

          {/* Quick links */}
          <QuickLinks navigate={navigate} t={t} />
        </div>
      )}
    </PageShell>
  );
}

// ─── Welcome banner ──────────────────────────────────────────────────────
function WelcomeBanner({ libCount, t }: { libCount: number | null; t: (k: string, fb?: string) => string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('dashboard.morning') : hour < 18 ? t('dashboard.afternoon') : t('dashboard.evening');
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const libLabel = t('dashboard.libCount').replace('{n}', String(libCount ?? 0));
  return (
    <div className="rounded-2xl p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--brand-primary) 0%, color-mix(in srgb, var(--brand-primary) 70%, var(--saffron)) 100%)',
        color: 'var(--text-on-brand)',
      }}>
      <div className="relative z-10">
        <div className="text-sm font-medium opacity-90">{greeting}</div>
        <div className="font-display text-2xl font-bold mt-1">{t('dashboard.welcome')}</div>
        <div className="text-sm opacity-80 mt-1">{today}</div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm">{libLabel}</span>
          <span className="px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm">{t('dashboard.engineLabel')}</span>
        </div>
      </div>
      <svg className="absolute right-0 bottom-0 opacity-20" width="200" height="200" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="0.5">
        <circle cx="12" cy="12" r="10"/>
        <circle cx="12" cy="12" r="7"/>
        <circle cx="12" cy="12" r="4"/>
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"/>
      </svg>
    </div>
  );
}

// ─── Metric card ─────────────────────────────────────────────────────────
function MetricCard({
  icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="metric-card">
      <div className="flex items-start justify-between mb-3">
        <span className="metric-label">{label}</span>
        <span style={{ color: 'var(--brand-accent)' }}>{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
      <div className="metric-trail" />
    </div>
  );
}

// ─── Chart snapshot ──────────────────────────────────────────────────────
function ChartSnapshot({ kundali, t, al }: { kundali: KundaliResult; t: (k: string, fb?: string) => string; al: any }) {
  return (
    <Card title={t('dashboard.snapshot')}>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Row label={t('kundali.ascendant')} value={`${al.rashi(kundali.ascendant.rashi.num)} ${kundali.ascendant.rashi.degInRashi.toFixed(2)}°`} />
        <Row label={t('common.nakshatra')} value={`${al.nakshatra(kundali.ascendant.nakshatra.num)} p${kundali.ascendant.nakshatra.pada}`} />
        <Row label={t('kundali.ayanamsa')} value={`${kundali.ayanamsa.name} · ${kundali.ayanamsa.valueDeg.toFixed(4)}°`} />
        <Row label={t('kundali.jd')} value={kundali.jd.toFixed(4)} mono />
        <Row label={t('kundali.utc')} value={new Date(kundali.utc).toUTCString().slice(0, 25)} />
        {kundali.input.placeName && <Row label={t('library.place')} value={kundali.input.placeName} />}
      </div>
      <div className="mt-4 pt-4 border-t border-vedicGold/20">
        <div className="text-[11px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{t('dashboard.notable')}</div>
        <div className="flex flex-wrap gap-1.5">
          {kundali.planets.filter((p) => p.exalted || p.debilitated || p.ownSign || p.retrograde).map((p) => (
            <Pill key={p.id} tone={p.exalted || p.ownSign ? 'good' : p.debilitated ? 'bad' : 'warn'}>
              {al.planet(p.id)} {p.exalted ? t('dignity.exalt') : p.debilitated ? t('dignity.debil') : p.ownSign ? t('dignity.own') : t('dignity.retrograde')}
            </Pill>
          ))}
          {kundali.planets.every((p) => !p.exalted && !p.debilitated && !p.ownSign && !p.retrograde) && (
            <span className="text-xs italic" style={{ color: 'var(--text-subtle)' }}>{t('dashboard.noMajor')}</span>
          )}
        </div>
      </div>
    </Card>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className={`text-sm font-medium ${mono ? 'font-mono' : ''}`} style={{ color: 'var(--text-strong)' }}>{value}</div>
    </div>
  );
}

// ─── Shadbala mini ───────────────────────────────────────────────────────
function ShadbalaMini({ shadbala, t, al }: { shadbala: ShadbalaResult; t: (k: string, fb?: string) => string; al: any }) {
  const max = Math.max(...shadbala.planets.map((p) => p.totalRupas));
  return (
    <Card title={t('kundali.shadbala')}>
      <div className="space-y-2">
        {shadbala.planets.map((p) => {
          const pct = Math.max(0, Math.min(100, (p.totalRupas / max) * 100));
          const tone = p.category === 'strong' ? 'var(--good)' : p.category === 'moderate' ? 'var(--warn)' : 'var(--bad)';
          return (
            <div key={p.planet} className="flex items-center gap-3 text-xs">
              <div className="w-16 font-bold" style={{ color: 'var(--brand-primary)' }}>{al.planet(p.planet)}</div>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: tone }} />
              </div>
              <div className="w-14 text-right font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>{p.totalRupas.toFixed(2)}</div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {t('dashboard.strongest')}: <strong style={{ color: 'var(--good)' }}>{al.planet(shadbala.strongest)}</strong>
        {' · '}
        {t('dashboard.weakest')}: <strong style={{ color: 'var(--bad)' }}>{al.planet(shadbala.weakest)}</strong>
      </div>
    </Card>
  );
}

// ─── Dasha snapshot ──────────────────────────────────────────────────────
function DashaSnapshot({ vim, t, al }: { vim: VimshottariResult; t: (k: string, fb?: string) => string; al: any }) {
  const now = Date.now();
  const current = vim.mahadashas.find((m) =>
    new Date(m.start).getTime() <= now && now < new Date(m.end).getTime());
  const next = vim.mahadashas.find((m) => new Date(m.start).getTime() > now);
  const elapsed = current ? ((now - new Date(current.start).getTime()) / (new Date(current.end).getTime() - new Date(current.start).getTime())) * 100 : 0;

  return (
    <Card title={t('kundali.dasha')}>
      {current && (
        <div className="mb-4">
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <div className="font-display text-2xl font-bold" style={{ color: 'var(--brand-primary)' }}>{al.planet(current.lord)}</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('dashboard.currentlyActive')}</div>
          </div>
          <div className="text-xs font-mono tabular-nums mb-2" style={{ color: 'var(--text-muted)' }}>
            {new Date(current.start).toLocaleDateString()} → {new Date(current.end).toLocaleDateString()} ({current.years}{t('common.yearShort')})
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-3)' }}>
            <div className="h-full rounded-full"
              style={{ width: `${elapsed.toFixed(1)}%`, background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-accent))' }} />
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--text-subtle)' }}>{elapsed.toFixed(1)}% {t('dashboard.elapsed')}</div>
        </div>
      )}
      <div className="pt-3 border-t border-vedicGold/20 text-xs space-y-1.5">
        {vim.mahadashas.slice(0, 6).map((m) => {
          const isCurrent = m === current;
          return (
            <div key={m.start} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isCurrent ? 'animate-pulse' : ''}`}
                  style={{ background: isCurrent ? 'var(--brand-primary)' : 'var(--border-soft)' }} />
                <span className={isCurrent ? 'font-bold' : ''} style={{ color: isCurrent ? 'var(--brand-primary)' : 'var(--text-body)' }}>
                  {al.planet(m.lord)}
                </span>
                <span className="font-mono tabular-nums" style={{ color: 'var(--text-muted)' }}>{m.years}{t('common.yearShort')}</span>
              </div>
              <span className="font-mono tabular-nums" style={{ color: 'var(--text-subtle)' }}>
                {new Date(m.start).getFullYear()}–{new Date(m.end).getFullYear()}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Yogas mini ──────────────────────────────────────────────────────────
function YogasMini({ yogas, t, al }: { yogas: YogaResult[]; t: (k: string, fb?: string) => string; al: any }) {
  return (
    <Card title={`${t('kundali.yogas')} (${yogas.length})`}>
      {yogas.length === 0 && <p className="text-sm italic" style={{ color: 'var(--text-subtle)' }}>—</p>}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
        {yogas.map((y) => (
          <div key={y.name} className="p-3 rounded-lg border"
            style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="font-semibold text-sm" style={{ color: 'var(--brand-primary)' }}>{al.yoga(y.name)}</div>
              <Pill tone={y.strength === 'strong' ? 'good' : y.strength === 'moderate' ? 'warn' : 'neutral'}>
                {al.strength(y.strength)}
              </Pill>
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{y.description}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Quick links ─────────────────────────────────────────────────────────
function QuickLinks({ navigate, t }: { navigate: (p: string) => void; t: (k: string, fb?: string) => string }) {
  const links = [
    { icon: IconCompass,  label: t('dashboard.chartLink'),     desc: t('dashboard.chartLinkDesc'),    path: '/' },
    { icon: IconClock,    label: t('nav.timing'),              desc: t('dashboard.timingDesc'),       path: '/timing' },
    { icon: IconUsers,    label: t('nav.library'),             desc: t('dashboard.libraryDesc'),      path: '/library' },
    { icon: IconChart,    label: t('nav.interactive'),         desc: t('dashboard.interactiveDesc'),  path: '/interactive' },
    { icon: IconGrad,     label: t('nav.learn'),               desc: t('dashboard.learnDesc'),        path: '/learn' },
    { icon: IconCalendar, label: t('nav.panchang'),            desc: t('dashboard.panchangDesc'),     path: '/panchang' },
  ];
  return (
    <Card title={t('dashboard.quickLinks')}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <button key={l.path} onClick={() => navigate(l.path)}
              className="group p-4 rounded-xl border text-left transition-all hover:shadow-md"
              style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: 'color-mix(in srgb, var(--brand-primary) 10%, transparent)', color: 'var(--brand-primary)' }}>
                  <Icon />
                </div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-strong)' }}>{l.label}</div>
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.desc}</div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Phase 20 — 3 workflow widgets row ──────────────────────────────────────
function Phase20Widgets({
  widgets,
  notifs,
}: {
  widgets: any;
  notifs: ReturnType<typeof useDesktopNotifications>;
}) {
  const { t, al } = useT();
  const nt = widgets.nextTransit;
  const pr = widgets.pratyantar;
  const cb = widgets.chandraBala;

  // Day-distance label — Today / Tomorrow / In N days.
  const daysLabel = (n: number) =>
    n === 0 ? t('widgets.today')
    : n === 1 ? t('widgets.tomorrow')
    : t('widgets.inDays').replace('{n}', String(n));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Next transit */}
      <Card title={t('widgets.nextTransit')}>
        {nt.found ? (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-vedicMaroon/60">
              {daysLabel(nt.daysUntil)}
            </div>
            <div className="text-lg font-bold text-vedicMaroon mt-1">{al.planet(nt.planet)}</div>
            <div className="text-sm text-vedicMaroon/80 mt-0.5">
              {al.rashi(nt.fromSign)} → {al.rashi(nt.toSign)}
            </div>
            <div className="text-[11px] text-vedicMaroon/50 mt-2">
              {new Date(nt.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </div>
          </div>
        ) : (
          <EmptyState>{t('widgets.noMajorTransit').replace('{n}', '180')}</EmptyState>
        )}
      </Card>

      {/* Current pratyantar */}
      <Card title={t('widgets.pratyantar')}>
        {pr.found && pr.pratyantar ? (
          <div>
            <div className="text-[11px] uppercase tracking-wider text-vedicMaroon/60">
              {al.planet(pr.maha?.lord)} / {al.planet(pr.antar?.lord)}
            </div>
            <div className="text-lg font-bold text-vedicMaroon mt-1">
              {al.planet(pr.pratyantar.lord)}
            </div>
            <div className="text-[11px] text-vedicMaroon/50 mt-2">
              {new Date(pr.pratyantar.start).toLocaleDateString()} → {new Date(pr.pratyantar.end).toLocaleDateString()}
            </div>
            <div className="text-[11px] text-vedicMaroon/70 mt-1">
              {pr.pratyantar.years.toFixed(3)} {t('widgets.yearSpan')}
            </div>
          </div>
        ) : (
          <EmptyState>{t('widgets.noActivePratyantar')}</EmptyState>
        )}
      </Card>

      {/* Chandra Bala */}
      <Card title={t('widgets.chandraBala')}>
        <div>
          <div className="flex items-center gap-2">
            <Pill tone={cb.favorable ? 'good' : 'warn'}>
              {cb.favorable ? t('widgets.favorable') : t('widgets.restrained')}
            </Pill>
            <span className="text-[11px] text-vedicMaroon/60">
              {t('widgets.houseFromNatalMoon').replace('{n}', String(cb.houseFromNatalMoon))}
            </span>
          </div>
          <div className="text-sm text-vedicMaroon/80 mt-2">
            {t('widgets.transitMoonIn').replace('{sign}', al.rashi(cb.transitMoonSign))}
          </div>
          <div className="text-[11px] text-vedicMaroon/60 mt-0.5">
            {t('widgets.natalMoon').replace('{sign}', al.rashi(cb.natalMoonSign))}
          </div>
          <div className="text-[11px] text-vedicMaroon/70 mt-1 italic">
            {cb.favorable ? t('widgets.note.favorable') : t('widgets.note.restrained')}
          </div>
          {!notifs.supported ? null : notifs.permission === 'granted' ? (
            <div className="text-[10px] text-green-700 mt-2">🔔 {t('widgets.alertsOn')}</div>
          ) : (
            <button
              type="button"
              onClick={() => notifs.request()}
              className="mt-2 text-[11px] px-2 py-1 rounded border border-vedicGold/40 bg-white text-vedicMaroon hover:bg-parchment"
            >
              {t('widgets.enableAlerts')}
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}
