// Phase 15 F+G — unified Timing / prediction page.
//
// Panels:
//   1. Birth-details form (shared)
//   2. Today's personal horoscope (day/week/month toggle)
//   3. Transit heatmap calendar (90-day grid)
//   4. Dasha-Transit alignment alerts (top 20)
//   5. Retrograde & combustion timeline
//   6. Eclipses + outer-planet ingresses
//   7. Event journal (add past events → rectify birth time using existing API)

import { useEffect, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput } from '../types';

type Scope = 'day' | 'week' | 'month';

export function TimingPage() {
  const { t, al } = useT();
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [scope, setScope] = useState<Scope>('day');
  const [horoscope, setHoroscope] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [rxEvents, setRxEvents] = useState<any[]>([]);
  const [journal, setJournal] = useState<{ eclipses: any[]; ingresses: any[] }>({ eclipses: [], ingresses: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heatmapStart, setHeatmapStart] = useState(new Date().toISOString().slice(0, 10));

  async function run(input: BirthInput) {
    setBirth(input);
    setLoading(true); setError(null);
    try {
      const nowIso = new Date().toISOString();
      const start = new Date(heatmapStart + 'T00:00:00Z').toISOString();
      const [h, heat, alerts0, rx, jr] = await Promise.all([
        api.horoscope(input, scope, nowIso),
        api.transitHeatmap(input, start, 90),
        api.dashaTransitAlerts(input, start, 3 * 365, 2),
        api.rxCombust(start, 365),
        api.eclipseJournal(start, 3 * 365, input),
      ]);
      setHoroscope(h.horoscope);
      setHeatmap(heat.heatmap);
      setAlerts(alerts0.alerts);
      setRxEvents(rx.events);
      setJournal(jr.journal);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  // Re-fetch horoscope when scope changes (keep the rest)
  useEffect(() => {
    if (!birth) return;
    api.horoscope(birth, scope, new Date().toISOString())
      .then((h) => setHoroscope(h.horoscope))
      .catch((e) => setError((e as Error).message));
  }, [scope]);

  return (
    <PageShell title={t('timing.title', 'Timing & Prediction')} subtitle={t('timing.subtitle', 'Horoscope · heatmap · alerts · retrogrades · eclipses. Everything your dasha is telling you right now.')}>
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={run} loading={loading} />
          <div className="rounded-lg border border-vedicGold/40 p-3 text-xs bg-white">
            <div className="uppercase tracking-wider text-vedicMaroon/60 mb-1">{t('timing.heatmapStart', 'Heatmap / journal start')}</div>
            <input type="date" value={heatmapStart} onChange={(e) => setHeatmapStart(e.target.value)}
              className="w-full rounded border border-vedicGold/40 px-2 py-1 text-sm" />
          </div>
        </aside>

        <main className="space-y-4">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {!horoscope && !loading && !error && <EmptyState>{t('timing.empty', 'Enter birth details to unlock your personal timing view.')}</EmptyState>}
          {loading && <EmptyState>{t('timing.loading', 'Fetching timing data…')}</EmptyState>}

          {horoscope && (
            <Card title={t('timing.horoscope', 'Your personal horoscope')}
              action={
                <div className="flex gap-1 text-[11px]">
                  {(['day','week','month'] as const).map((s) => (
                    <button key={s} onClick={() => setScope(s)}
                      className={`px-2 py-1 rounded border ${scope === s
                        ? 'bg-vedicMaroon text-white border-vedicMaroon'
                        : 'bg-white text-vedicMaroon border-vedicGold/40 hover:bg-parchment'}`}>
                      {t(`timing.scope.${s}`, s)}
                    </button>
                  ))}
                </div>
              }>
              {/* TODO(i18n-server): localize horoscope.headline + horoscope.bullets */}
              <div className="text-base font-semibold text-vedicMaroon mb-2" lang="en">{horoscope.headline}</div>
              <ul className="space-y-1.5 text-sm text-vedicMaroon/90">
                {horoscope.bullets.map((b: string, i: number) => <li key={i} lang="en">• {b}</li>)}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <Pill tone="neutral">{t('panchang.tithi', 'Tithi')}: <span lang="en">{horoscope.panchang.tithi}</span></Pill>
                <Pill tone="neutral"><span lang="en">{horoscope.panchang.nakshatra}</span></Pill>
                <Pill tone="neutral"><span lang="en">{horoscope.panchang.vara}</span></Pill>
                <Pill tone="neutral">{t('panchang.yoga', 'Yoga')}: <span lang="en">{horoscope.panchang.yoga}</span></Pill>
                {horoscope.retrograde.length > 0 && <Pill tone="warn">{t('timing.rx', 'Rx')}: {horoscope.retrograde.map((p: string) => al.planet(p)).join(', ')}</Pill>}
                {horoscope.combust.length > 0 && <Pill tone="warn">{t('timing.combust', 'Combust')}: {horoscope.combust.map((p: string) => al.planet(p)).join(', ')}</Pill>}
              </div>
            </Card>
          )}

          {heatmap.length > 0 && (
            <Card title={t('timing.heatmapTitle', 'Transit heatmap — {n} days from {date}').replace('{n}', String(heatmap.length)).replace('{date}', heatmap[0].date)}>
              <HeatmapGrid days={heatmap} />
              <div className="mt-3 flex items-center gap-3 text-[11px] text-vedicMaroon/60">
                <Swatch color="#059669" label={t('timing.swatch.excellent', 'Excellent (75+)')} />
                <Swatch color="#84cc16" label={t('timing.swatch.good', 'Good (60+)')} />
                <Swatch color="#cbd5e1" label={t('timing.swatch.neutral', 'Neutral')} />
                <Swatch color="#f59e0b" label={t('timing.swatch.caution', 'Caution')} />
                <Swatch color="#dc2626" label={t('timing.swatch.difficult', 'Difficult')} />
              </div>
            </Card>
          )}

          {alerts.length > 0 && (
            <Card title={t('timing.alertsTitle', 'Dasha-Transit alerts — {n} windows').replace('{n}', String(alerts.length))}>
              <div className="space-y-2 text-xs">
                {alerts.slice(0, 20).map((a, i) => (
                  <div key={i} className="border border-vedicGold/30 rounded p-2 bg-parchment/40 flex justify-between items-start gap-4">
                    <div>
                      <div className="font-bold text-vedicMaroon">
                        {new Date(a.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        {/* TODO(i18n-server): localize alert.topic */}
                        <span className="ml-2 text-vedicMaroon/60 font-normal">{t('timing.house', 'House')} {a.dominantHouse} — <span lang="en">{a.topic}</span></span>
                      </div>
                      <div className="text-[11px] text-vedicMaroon/60 mt-1">
                        {t('timing.maha', 'Maha')} {al.planet(a.factors.mahaLord)} ({t('common.houseShort', 'H')}{a.factors.mahaHouse})
                        {a.factors.antarLord && ` · ${t('timing.antar', 'Antar')} ${al.planet(a.factors.antarLord)} (${t('common.houseShort', 'H')}${a.factors.antarHouse})`}
                        {' '}· {t('timing.jup', 'Jup')} {t('common.houseShort', 'H')}{a.factors.jupiterHouse} · {t('timing.sat', 'Sat')} {t('common.houseShort', 'H')}{a.factors.saturnHouse}
                      </div>
                    </div>
                    <Pill tone={a.score >= 3 ? 'good' : 'warn'}>{t('timing.scoreOf4', 'score {n}/4').replace('{n}', String(a.score))}</Pill>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {rxEvents.length > 0 && (
            <Card title={t('timing.rxTitle', 'Retrograde & combustion timeline — {n} events').replace('{n}', String(rxEvents.length))}>
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-parchment/90">
                    <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                      <th className="py-1">{t('timing.col.date', 'Date')}</th><th>{t('timing.col.planet', 'Planet')}</th><th>{t('timing.col.event', 'Event')}</th><th>{t('timing.col.sign', 'Sign')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rxEvents.map((e, i) => (
                      <tr key={i} className="border-b border-vedicGold/10">
                        <td className="py-1 tabular-nums">{new Date(e.utc).toLocaleDateString()}</td>
                        <td className="font-bold text-vedicMaroon">{al.planet(e.planet)}</td>
                        {/* TODO(i18n-server): localize rx event.kind */}
                        <td lang="en" className={
                          e.kind.startsWith('retrograde') ? 'text-amber-700'
                          : e.kind.startsWith('combust') ? 'text-red-700'
                          : 'text-vedicMaroon/80'
                        }>{e.kind}</td>
                        <td className="tabular-nums">{al.rashi(e.signNum)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {(journal.eclipses.length > 0 || journal.ingresses.length > 0) && (
            <Card title={t('timing.eclipseTitle', 'Eclipse & Ingress journal — {ne} eclipses, {ni} ingresses').replace('{ne}', String(journal.eclipses.length)).replace('{ni}', String(journal.ingresses.length))}>
              {journal.eclipses.length > 0 && (
                <>
                  <h4 className="text-vedicMaroon font-semibold uppercase text-[10px] tracking-wider mb-2">{t('timing.eclipses', 'Eclipses')}</h4>
                  <table className="w-full text-xs mb-4">
                    <thead>
                      <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                        <th className="py-1">{t('timing.col.type', 'Type')}</th><th>{t('timing.col.when', 'When (UTC)')}</th><th>{t('timing.col.sunSign', 'Sun sign')}</th><th>{t('timing.col.moonSign', 'Moon sign')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journal.eclipses.map((e, i) => (
                        <tr key={i} className="border-b border-vedicGold/10">
                          {/* TODO(i18n-server): localize eclipse.type */}
                          <td className="py-1 font-bold text-vedicMaroon" lang="en">{e.type}</td>
                          <td>{new Date(e.utc).toLocaleString()}</td>
                          <td>{al.rashiByName(e.rashiSunName)}</td>
                          <td>{al.rashiByName(e.rashiMoonName)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              {journal.ingresses.length > 0 && (
                <>
                  <h4 className="text-vedicMaroon font-semibold uppercase text-[10px] tracking-wider mb-2">{t('timing.ingresses', 'Outer-planet ingresses')}</h4>
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-parchment/90">
                        <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                          <th className="py-1">{t('timing.col.date', 'Date')}</th><th>{t('timing.col.planet', 'Planet')}</th><th>{t('timing.col.fromTo', 'From → To')}</th><th>{t('timing.col.yourHouse', 'Your house')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {journal.ingresses.map((e, i) => (
                          <tr key={i} className="border-b border-vedicGold/10">
                            <td className="py-1 tabular-nums">{new Date(e.utc).toLocaleDateString()}</td>
                            <td className="font-bold text-vedicMaroon">{al.planet(e.planet)}</td>
                            <td>{al.rashiByName(e.fromSignName)} → <strong>{al.rashiByName(e.toSignName)}</strong></td>
                            <td className="tabular-nums">{e.natalHouse ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </Card>
          )}
        </main>
      </div>
    </PageShell>
  );
}

function HeatmapGrid({ days }: { days: any[] }) {
  const colorFor = (cat: string) =>
    cat === 'excellent' ? '#059669'
    : cat === 'good'    ? '#84cc16'
    : cat === 'neutral' ? '#cbd5e1'
    : cat === 'caution' ? '#f59e0b'
    : '#dc2626';
  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
      {days.map((d) => (
        <div key={d.date}
          title={`${d.date} — ${d.category} (${d.score}/100)\n${d.factors.join('\n')}`}
          className="aspect-square rounded-sm cursor-help hover:ring-2 hover:ring-vedicMaroon/60"
          style={{ backgroundColor: colorFor(d.category), opacity: 0.4 + (d.score / 200) }}
        />
      ))}
    </div>
  );
}

function Swatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
