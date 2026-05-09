// Phase 10 — Predictive precision.
//
// A seven-tab workbench that surfaces long-horizon timing tools from one
// birth input and one API call (/api/analysis/predictive):
//   • Sade Sati   — 7.5yr Saturn cycles with 8-kakshya breakdown per sign
//   • Returns     — Saturn/Jupiter/Solar/Lunar/Rahu returns, past + upcoming
//   • Progressions — secondary progressions (1 day = 1 year) + aspects to natal
//   • Graha Yuddha — planetary wars ±2yr with winner/loser per pair
//   • Combustion  — combust windows per planet with start/exact/end
//   • Retro Shadow — full retrograde cycles (pre-shadow → Rx → post-shadow)
//   • Kaksha Bala — natal 3.75° kakshya strength per planet

import { useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { AstroTranslator } from '../i18n/astro-labels';
import type {
  BirthInput, PredictiveBundle, SadeSatiCycle, SadeSatiSignSegment,
  PlanetaryReturn, ProgressedAspect, GrahaYuddhaEvent,
  CombustionWindow, RetroCycle,
} from '../types';

type Tab = 'sadeSati' | 'returns' | 'progressions' | 'grahaYuddha' | 'combustion' | 'retroShadow' | 'kakshaBala';

const TABS: { key: Tab; labelKey: string; labelFallback: string; descKey: string; descFallback: string }[] = [
  { key: 'sadeSati',    labelKey: 'predictive.tab.sadeSati',    labelFallback: 'Sade Sati',    descKey: 'predictive.desc.sadeSati',    descFallback: '7.5-year Saturn cycles with 8-kakshya breakdown per sign' },
  { key: 'returns',     labelKey: 'predictive.tab.returns',     labelFallback: 'Returns',      descKey: 'predictive.desc.returns',     descFallback: 'Saturn · Jupiter · Solar · Lunar · Rahu — past & upcoming' },
  { key: 'progressions',labelKey: 'predictive.tab.progressions',labelFallback: 'Progressions', descKey: 'predictive.desc.progressions',descFallback: 'Secondary progressions (1 day = 1 year) + natal aspects' },
  { key: 'grahaYuddha', labelKey: 'predictive.tab.grahaYuddha', labelFallback: 'Graha Yuddha', descKey: 'predictive.desc.grahaYuddha', descFallback: 'Planetary wars ±2 years, winner/loser by classical rule' },
  { key: 'combustion',  labelKey: 'predictive.tab.combustion',  labelFallback: 'Combustion',   descKey: 'predictive.desc.combustion',  descFallback: 'Combust windows per planet with start · exact · end' },
  { key: 'retroShadow', labelKey: 'predictive.tab.retroShadow', labelFallback: 'Retro Shadow', descKey: 'predictive.desc.retroShadow', descFallback: 'Full retrograde cycles: pre-shadow → Rx → post-shadow' },
  { key: 'kakshaBala',  labelKey: 'predictive.tab.kakshaBala',  labelFallback: 'Kaksha Bala',  descKey: 'predictive.desc.kakshaBala',  descFallback: 'Natal 3.75° kakshya strength per planet (0-8 scale)' },
];

function fmtDate(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function PredictivePage() {
  const { t, al } = useT();
  const [tab, setTab] = useState<Tab>('sadeSati');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PredictiveBundle | null>(null);
  const [age, setAge] = useState(35);

  async function handleSubmit(input: BirthInput) {
    setLoading(true); setError(null);
    try {
      const r = await api.predictive(input, { age, windowYears: 2 });
      setData(r.predictive);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <PageShell
      title={t('predictive.title', 'Predictive Precision')}
      subtitle={t('predictive.subtitle', 'Sade Sati · Returns · Progressions · Graha Yuddha · Combustion · Retro shadow · Kaksha Bala')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
          <Card title={t('predictive.age.title', 'Progression age')}>
            <label className="flex items-center gap-2 text-xs text-vedicMaroon/70">
              {t('predictive.age.label', 'Age (years)')}
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value) || 0)}
                min={0} max={120}
                className="w-16 px-2 py-1 rounded border border-vedicGold/30 bg-white text-right"
              />
            </label>
            <p className="text-[10px] text-vedicMaroon/50 mt-1">
              {t('predictive.age.note', 'Secondary progression = birth + age days. Re-submit after editing.')}
            </p>
          </Card>
        </aside>

        <main className="space-y-4">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {loading && <EmptyState>{t('predictive.loading', 'Scanning ephemeris — Sade Sati, returns, wars, combustion, shadows…')}</EmptyState>}
          {!data && !loading && !error && (
            <EmptyState>{t('predictive.empty', 'Enter birth details to scan 60+ years of predictive events.')}</EmptyState>
          )}

          {data && (
            <>
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-vedicGold/30 bg-vedicCream/30 w-fit">
                {TABS.map((tt) => (
                  <button
                    key={tt.key}
                    onClick={() => setTab(tt.key)}
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

              {tab === 'sadeSati'     && <SadeSatiView data={data.sadeSati} t={t} al={al} />}
              {tab === 'returns'      && <ReturnsView data={data.returns} t={t} al={al} />}
              {tab === 'progressions' && <ProgressionsView data={data.progressions} t={t} al={al} />}
              {tab === 'grahaYuddha'  && <GrahaYuddhaView data={data.grahaYuddha} t={t} al={al} />}
              {tab === 'combustion'   && <CombustionView data={data.combustion} t={t} al={al} />}
              {tab === 'retroShadow'  && <RetroShadowView data={data.retroShadow} t={t} al={al} />}
              {tab === 'kakshaBala'   && <KakshaBalaView data={data.kakshaBala} t={t} al={al} />}
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

type T = (key: string, fallback?: string) => string;

// ─── Sade Sati view ─────────────────────────────────────────────────────────

function SadeSatiView({ data, t, al }: { data: PredictiveBundle['sadeSati']; t: T; al: AstroTranslator }) {
  const active = data.active.phase !== null;
  return (
    <div className="space-y-4">
      <Card title={t('predictive.sade.activeMoon', 'Moon sign · {sign} — Saturn currently {h}th from Moon')
        .replace('{sign}', al.rashiByName(data.moonSignName))
        .replace('{h}', String(data.active.saturnHouseFromMoon))}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Tile label={t('predictive.sade.phaseNow', 'Phase now')} value={data.active.phase ?? t('predictive.sade.inactive', 'inactive')} tone={active ? 'warn' : 'info'} />
          <Tile label={t('predictive.sade.saturnSign', 'Saturn sign')} value={`#${data.active.saturnSignNum}`} tone="info" />
          <Tile
            label={t('predictive.sade.currKakshya', 'Current kakshya')}
            value={data.active.currentKakshya != null
              ? `#${data.active.currentKakshya + 1} · ${al.planet(String(data.active.currentKakshyaLord))}`
              : t('predictive.sade.dash', '—')}
            tone={data.active.currentKakshya != null ? 'warn' : 'info'}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.targetSigns.map((s) => (
            <span key={s.phase + s.signNum} className="text-[10px] px-2 py-0.5 rounded bg-vedicMaroon/10 text-vedicMaroon font-semibold">
              {s.phase}: {al.rashiByName(s.signName)} ({s.fromMoonHouse}th)
            </span>
          ))}
        </div>
      </Card>

      {data.cycles.map((c) => <CycleCard key={c.cycle} cycle={c} t={t} al={al} />)}

      {data.ashtami.length > 0 && (
        <Card title={t('predictive.sade.ashtami', 'Ashtami Shani (8th from Moon) — {n} transit(s)').replace('{n}', String(data.ashtami.length))}>
          <SegmentList segments={data.ashtami} t={t} al={al} />
        </Card>
      )}
      {data.kantak.length > 0 && (
        <Card title={t('predictive.sade.kantak', 'Kantak / Dhaiya Shani (4th from Moon) — {n} transit(s)').replace('{n}', String(data.kantak.length))}>
          <SegmentList segments={data.kantak} t={t} al={al} />
        </Card>
      )}
    </div>
  );
}

function CycleCard({ cycle, t, al }: { cycle: SadeSatiCycle; t: T; al: AstroTranslator }) {
  return (
    // TODO(i18n-server): localize cycle.label
    <Card title={cycle.label}>
      <div className="text-[11px] text-vedicMaroon/60 mb-2">
        {fmtDate(cycle.startUTC)} → {fmtDate(cycle.endUTC)} · {t('predictive.sade.cycleSegments', '{phases} phase(s)').replace('{phases}', String(cycle.segments.length))}
      </div>
      {cycle.segments.map((s) => <SegmentBlock key={s.entryUTC} seg={s} t={t} al={al} />)}
    </Card>
  );
}

function SegmentList({ segments, t, al }: { segments: SadeSatiSignSegment[]; t: T; al: AstroTranslator }) {
  return <div className="space-y-3">{segments.map((s) => <SegmentBlock key={s.entryUTC} seg={s} t={t} al={al} />)}</div>;
}

function SegmentBlock({ seg, t, al }: { seg: SadeSatiSignSegment; t: T; al: AstroTranslator }) {
  const tone =
    seg.phase === 'Peak' ? 'border-vedicMaroon/40 bg-vedicMaroon/5' :
    seg.phase === 'Ashtami' ? 'border-red-300 bg-red-50' :
    seg.phase === 'Kantak' ? 'border-amber-300 bg-amber-50' :
    'border-vedicGold/30 bg-vedicCream/30';
  return (
    <div className={`rounded-md p-3 border ${tone}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-vedicMaroon">
          {t('predictive.sade.segHeader', '{phase} · {sign} (H{h} from Moon)')
            .replace('{phase}', seg.phase)
            .replace('{sign}', al.rashiByName(seg.signName))
            .replace('{h}', String(seg.fromMoonHouse))}
        </span>
        <span className="text-[10px] text-vedicMaroon/60 tabular-nums">
          {fmtDate(seg.entryUTC)} → {fmtDate(seg.exitUTC)}
        </span>
      </div>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-1">
        {seg.kakshyas.map((k) => (
          <div key={k.index} className="rounded border border-vedicGold/25 bg-white p-1.5 text-center">
            <div className="text-[9px] text-vedicMaroon/50 font-mono">K{k.index + 1}</div>
            <div className="text-[11px] font-semibold text-vedicMaroon">{al.planet(k.lord)}</div>
            <div className="text-[9px] text-vedicMaroon/60 tabular-nums">{fmtDate(k.startUTC)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Returns view ──────────────────────────────────────────────────────────

function ReturnsView({ data, t, al }: { data: PredictiveBundle['returns']; t: T; al: AstroTranslator }) {
  const groups: { labelKey: string; labelFallback: string; list: PlanetaryReturn[]; color: string }[] = [
    { labelKey: 'predictive.returns.saturn',  labelFallback: 'Saturn returns (≈29.5 yr cycle)',    list: data.saturn,  color: 'text-slate-700' },
    { labelKey: 'predictive.returns.jupiter', labelFallback: 'Jupiter returns (≈11.9 yr cycle)',   list: data.jupiter, color: 'text-amber-700' },
    { labelKey: 'predictive.returns.solar',   labelFallback: 'Solar returns (next 10 birthdays)',  list: data.solar,   color: 'text-orange-700' },
    { labelKey: 'predictive.returns.lunar',   labelFallback: 'Lunar returns (next 12 months)',     list: data.lunar,   color: 'text-blue-700' },
    { labelKey: 'predictive.returns.rahu',    labelFallback: 'Rahu returns (≈18.6 yr nodal axis)', list: data.rahu,    color: 'text-vedicMaroon' },
  ];
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <Card key={g.labelKey} title={t(g.labelKey, g.labelFallback)}>
          {g.list.length === 0 ? (
            <div className="text-[11px] text-vedicMaroon/50">{t('predictive.returns.empty', 'No returns within the searched window.')}</div>
          ) : (
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-vedicMaroon/60">
                  <th className="text-left py-1 pr-2 font-semibold">{t('predictive.returns.colNum', '#')}</th>
                  <th className="text-left py-1 pr-2 font-semibold">{t('predictive.returns.colDate', 'Date (UTC)')}</th>
                  <th className="text-right py-1 pr-2 font-semibold">{t('predictive.returns.colAge', 'Age')}</th>
                  <th className="text-left py-1 pr-2 font-semibold">{t('predictive.returns.colSign', 'Sign')}</th>
                  <th className="text-right py-1 pr-2 font-semibold">{t('predictive.returns.colDeg', 'Deg')}</th>
                  <th className="text-left py-1 font-semibold">{t('predictive.returns.colNak', 'Nakshatra')}</th>
                </tr>
              </thead>
              <tbody>
                {g.list.map((r) => (
                  <tr key={r.returnUTC} className="border-t border-vedicGold/20">
                    <td className={`py-1 pr-2 font-mono ${g.color}`}>{r.occurrence}</td>
                    <td className="py-1 pr-2 tabular-nums">{fmtDate(r.returnUTC)}</td>
                    <td className="py-1 pr-2 text-right tabular-nums text-vedicMaroon/70">{r.ageYearsAtReturn.toFixed(1)}</td>
                    <td className="py-1 pr-2">{al.rashiByName(r.signName)}</td>
                    <td className="py-1 pr-2 text-right tabular-nums text-vedicMaroon/60">{r.degInSign.toFixed(2)}°</td>
                    <td className="py-1 text-vedicMaroon/70">
                      {/* TODO(i18n-server): localize nakshatraName by ID */}
                      <span lang="en">{r.nakshatraName}</span> <span className="text-[10px] text-vedicMaroon/40">{t('predictive.returns.pada', 'pada')} {r.nakshatraPada}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      ))}
    </div>
  );
}

// ─── Progressions view ─────────────────────────────────────────────────────

function ProgressionsView({ data, t, al }: { data: PredictiveBundle['progressions']; t: T; al: AstroTranslator }) {
  return (
    <div className="space-y-4">
      <Card title={t('predictive.prog.title', 'Progressed to age {age} — {date}')
        .replace('{age}', data.ageYears.toFixed(2))
        .replace('{date}', fmtDate(data.progressedDateUTC))}>
        <div className="text-[11px] text-vedicMaroon/70 mb-2">
          {t('predictive.prog.ascendant', 'Progressed Ascendant:')} <span className="font-semibold text-vedicMaroon">{al.rashiByName(data.progressedAscendantSign)}</span>
          <span className="text-vedicMaroon/50 ml-2">({data.progressedAscendant.toFixed(2)}°)</span>
        </div>
      </Card>

      <Card title={t('predictive.prog.planets', 'Progressed planets')}>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-vedicMaroon/60">
              <th className="text-left py-1 pr-2 font-semibold">{t('predictive.prog.colPlanet', 'Planet')}</th>
              <th className="text-left py-1 pr-2 font-semibold">{t('predictive.prog.colSign', 'Sign')}</th>
              <th className="text-right py-1 pr-2 font-semibold">{t('predictive.prog.colDeg', 'Deg')}</th>
              <th className="text-left py-1 pr-2 font-semibold">{t('predictive.prog.colNak', 'Nakshatra')}</th>
              <th className="text-right py-1 pr-2 font-semibold">{t('predictive.prog.colHouse', 'House (natal)')}</th>
              <th className="text-right py-1 font-semibold">{t('predictive.prog.colDelta', 'Δ from natal')}</th>
            </tr>
          </thead>
          <tbody>
            {data.planets.map((p) => (
              <tr key={p.id} className="border-t border-vedicGold/20">
                <td className="py-1 pr-2 font-mono font-semibold">{al.planet(p.id)}{p.retrograde && <span className="text-[9px] text-red-600 ml-1">℞</span>}</td>
                <td className="py-1 pr-2">{al.rashiByName(p.signName)}</td>
                <td className="py-1 pr-2 text-right tabular-nums text-vedicMaroon/60">{p.degInSign.toFixed(2)}°</td>
                <td className="py-1 pr-2 text-vedicMaroon/70">
                  {/* TODO(i18n-server): localize nakshatraName by ID */}
                  <span lang="en">{p.nakshatraName}</span> <span className="text-[10px] text-vedicMaroon/40">{t('predictive.returns.pada', 'pada')} {p.nakshatraPada}</span>
                </td>
                <td className="py-1 pr-2 text-right font-semibold text-vedicMaroon">{p.natalHouseNow}</td>
                <td className="py-1 text-right tabular-nums text-vedicMaroon/60">{p.delta >= 0 ? '+' : ''}{p.delta.toFixed(1)}°</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title={t('predictive.prog.aspectsTitle', 'Progressed → natal aspects (1° orb) — {n}').replace('{n}', String(data.aspectsToNatal.length))}>
        {data.aspectsToNatal.length === 0 ? (
          <div className="text-[11px] text-vedicMaroon/50">{t('predictive.prog.noAspects', 'No tight progressed aspects right now.')}</div>
        ) : (
          <div className="space-y-1">
            {data.aspectsToNatal.slice(0, 20).map((a, i) => <AspectRow key={i} a={a} t={t} al={al} />)}
          </div>
        )}
      </Card>
    </div>
  );
}

function AspectRow({ a, t, al }: { a: ProgressedAspect; t: T; al: AstroTranslator }) {
  const toneByKind: Record<ProgressedAspect['kind'], string> = {
    conjunction: 'bg-purple-50 border-purple-200',
    sextile:     'bg-green-50 border-green-200',
    square:      'bg-red-50 border-red-200',
    trine:       'bg-blue-50 border-blue-200',
    opposition:  'bg-amber-50 border-amber-200',
  };
  const kindKeyMap: Record<ProgressedAspect['kind'], string> = {
    conjunction: 'predictive.aspect.conjunction',
    sextile:     'predictive.aspect.sextile',
    square:      'predictive.aspect.square',
    trine:       'predictive.aspect.trine',
    opposition:  'predictive.aspect.opposition',
  };
  return (
    <div className={`rounded px-3 py-1.5 border text-xs flex items-center gap-3 ${toneByKind[a.kind]}`}>
      <span className="font-mono font-semibold w-14">{al.planet(a.a)} → {al.planet(a.b)}</span>
      <span className="uppercase tracking-wider text-[10px] font-semibold w-20">{t(kindKeyMap[a.kind], a.kind)}</span>
      <span className="text-vedicMaroon/60 tabular-nums">{t('predictive.prog.orb', 'orb {orb}°').replace('{orb}', a.orb.toFixed(2))}</span>
    </div>
  );
}

// ─── Graha Yuddha view ─────────────────────────────────────────────────────

function GrahaYuddhaView({ data, t, al }: { data: PredictiveBundle['grahaYuddha']; t: T; al: AstroTranslator }) {
  return (
    <div className="space-y-4">
      <Card title={t('predictive.war.cardTitle', '{n} planetary war(s) between {from} and {to}')
        .replace('{n}', String(data.events.length))
        .replace('{from}', fmtDate(data.fromUTC))
        .replace('{to}', fmtDate(data.toUTC))}>
        {data.events.length === 0 ? (
          <div className="text-[11px] text-vedicMaroon/50">{t('predictive.war.empty', 'No planetary wars in this window.')}</div>
        ) : (
          <div className="space-y-1.5">
            {data.events.map((e) => <WarRow key={e.peakUTC + e.pair.join('')} e={e} t={t} al={al} />)}
          </div>
        )}
      </Card>
    </div>
  );
}

function WarRow({ e, t, al }: { e: GrahaYuddhaEvent; t: T; al: AstroTranslator }) {
  return (
    <div className="rounded-md border border-vedicGold/30 bg-vedicCream/30 p-2.5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs font-semibold text-vedicMaroon">
          {al.planet(e.pair[0])} vs {al.planet(e.pair[1])} <span className="text-vedicMaroon/40">·</span> {al.rashiByName(e.signName)}
        </span>
        <span className="text-[10px] text-vedicMaroon/60 tabular-nums">
          {t('predictive.war.peakOrb', 'peak {date} · orb {orb}°')
            .replace('{date}', fmtDate(e.peakUTC))
            .replace('{orb}', e.peakOrb.toFixed(2))}
        </span>
      </div>
      <div className="text-[11px] text-vedicMaroon/70 mt-1 flex items-center gap-2 flex-wrap">
        <Pill tone="good">{t('predictive.war.winner', 'Winner: {p}').replace('{p}', al.planet(e.winner))}</Pill>
        <Pill tone="warn">{t('predictive.war.loser', 'Loser: {p}').replace('{p}', al.planet(e.loser))}</Pill>
        <span className="text-[10px] text-vedicMaroon/50">
          {fmtDate(e.startUTC)} → {fmtDate(e.endUTC)}
        </span>
      </div>
      {/* TODO(i18n-server): localize verdict */}
      <p className="text-[11px] text-vedicMaroon/60 mt-1 italic" lang="en">{e.verdict}</p>
    </div>
  );
}

// ─── Combustion view ───────────────────────────────────────────────────────

function CombustionView({ data, t, al }: { data: PredictiveBundle['combustion']; t: T; al: AstroTranslator }) {
  const byPlanet = data.windows.reduce((acc, w) => {
    (acc[w.planet] ||= []).push(w);
    return acc;
  }, {} as Record<string, CombustionWindow[]>);
  const planets = Object.keys(byPlanet);
  return (
    <div className="space-y-4">
      {planets.map((p) => (
        <Card key={p} title={t('predictive.combust.cardTitle', '{p} — {n} combustion window(s) (orb ±{orb}°)')
          .replace('{p}', al.planet(p))
          .replace('{n}', String(byPlanet[p].length))
          .replace('{orb}', String(byPlanet[p][0].orb))}>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-vedicMaroon/60">
                <th className="text-left py-1 pr-2 font-semibold">{t('predictive.combust.colStart', 'Start')}</th>
                <th className="text-left py-1 pr-2 font-semibold">{t('predictive.combust.colExact', 'Exact (closest)')}</th>
                <th className="text-left py-1 pr-2 font-semibold">{t('predictive.combust.colEnd', 'End')}</th>
                <th className="text-right py-1 pr-2 font-semibold">{t('predictive.combust.colDays', 'Days')}</th>
                <th className="text-right py-1 pr-2 font-semibold">{t('predictive.combust.colPeak', 'Peak sep')}</th>
                <th className="text-left py-1 font-semibold">{t('predictive.combust.colSign', 'Sign')}</th>
              </tr>
            </thead>
            <tbody>
              {byPlanet[p].map((w) => (
                <tr key={w.exactUTC} className="border-t border-vedicGold/20">
                  <td className="py-1 pr-2 tabular-nums">{fmtDate(w.startUTC)}</td>
                  <td className="py-1 pr-2 tabular-nums font-semibold text-vedicMaroon">{fmtDate(w.exactUTC)}</td>
                  <td className="py-1 pr-2 tabular-nums">{fmtDate(w.endUTC)}</td>
                  <td className="py-1 pr-2 text-right tabular-nums text-vedicMaroon/70">{w.durationDays.toFixed(0)}</td>
                  <td className="py-1 pr-2 text-right tabular-nums text-vedicMaroon/60">{w.peakSeparation.toFixed(2)}°</td>
                  <td className="py-1 text-vedicMaroon/70">{al.rashiByName(w.signName)}{w.retrogradeAtStart && <span className="text-[10px] text-red-600 ml-1">℞</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}

// ─── Retrograde shadow view ────────────────────────────────────────────────

function RetroShadowView({ data, t, al }: { data: PredictiveBundle['retroShadow']; t: T; al: AstroTranslator }) {
  const byPlanet = data.cycles.reduce((acc, c) => {
    (acc[c.planet] ||= []).push(c);
    return acc;
  }, {} as Record<string, RetroCycle[]>);
  const planets = Object.keys(byPlanet);
  return (
    <div className="space-y-4">
      {planets.map((p) => (
        <Card key={p} title={t('predictive.retro.cardTitle', '{p} — {n} retrograde cycle(s)')
          .replace('{p}', al.planet(p))
          .replace('{n}', String(byPlanet[p].length))}>
          <div className="space-y-2">
            {byPlanet[p].map((c) => <RetroRow key={c.stationRetrogradeUTC} c={c} t={t} al={al} />)}
          </div>
        </Card>
      ))}
    </div>
  );
}

function RetroRow({ c, t, al }: { c: RetroCycle; t: T; al: AstroTranslator }) {
  const shadowDays = (new Date(c.postShadowEndUTC).getTime() - new Date(c.preShadowStartUTC).getTime()) / 86400000;
  const signR = al.rashiByName(c.signAtStationR);
  const signD = al.rashiByName(c.signAtStationD);
  return (
    <div className="rounded border border-vedicGold/30 bg-vedicCream/30 p-2.5">
      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
        <span className="text-[11px] font-semibold text-vedicMaroon">
          {t('predictive.retro.shadowArc', 'Shadow arc {arc}° · {a} → {b}')
            .replace('{arc}', c.shadowArcDeg.toFixed(2))
            .replace('{a}', signR)
            .replace('{b}', signD)}
        </span>
        <span className="text-[10px] text-vedicMaroon/60 tabular-nums">
          {t('predictive.retro.totalDays', 'total {n}d').replace('{n}', shadowDays.toFixed(0))}
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-[10px]">
        <Stage label={t('predictive.retro.preShadow', 'Pre-shadow')}  date={c.preShadowStartUTC}      tone="bg-amber-50 border-amber-200" />
        <Stage label={t('predictive.retro.stationR', 'Station ℞')}    date={c.stationRetrogradeUTC}   tone="bg-red-50 border-red-200" />
        <Stage label={t('predictive.retro.stationD', 'Station D')}    date={c.stationDirectUTC}       tone="bg-blue-50 border-blue-200" />
        <Stage label={t('predictive.retro.postShadow', 'Post-shadow')} date={c.postShadowEndUTC}      tone="bg-green-50 border-green-200" />
      </div>
      <div className="text-[10px] text-vedicMaroon/50 mt-1 tabular-nums">
        {t('predictive.retro.stationDeg', '℞ @ {r}° · D @ {d}°')
          .replace('{r}', c.stationRetrogradeDeg.toFixed(2))
          .replace('{d}', c.stationDirectDeg.toFixed(2))}
      </div>
    </div>
  );
}

function Stage({ label, date, tone }: { label: string; date: string; tone: string }) {
  return (
    <div className={`rounded px-2 py-1 border ${tone}`}>
      <div className="text-[9px] uppercase tracking-wider text-vedicMaroon/50">{label}</div>
      <div className="font-mono font-semibold text-vedicMaroon">{fmtDate(date)}</div>
    </div>
  );
}

// ─── Kaksha Bala view ──────────────────────────────────────────────────────

function KakshaBalaView({ data, t, al }: { data: PredictiveBundle['kakshaBala']; t: T; al: AstroTranslator }) {
  return (
    <div className="space-y-4">
      <Card title={t('predictive.kaksha.summary', 'Summary — planets ranked by kaksha bala (0-8)')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {data.summary.map((s) => (
            <div key={s.planet} className="rounded-md border border-vedicGold/30 bg-vedicCream/30 p-2.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-vedicMaroon">{al.planet(s.planet)}</span>
                <span className="text-[10px] text-vedicMaroon/50">{t('predictive.kaksha.rank', '#{n}').replace('{n}', String(s.rank))}</span>
              </div>
              <div className="text-2xl font-semibold text-vedicMaroon tabular-nums">{s.bala}<span className="text-sm text-vedicMaroon/40">{t('predictive.kaksha.balaOf8', '/8')}</span></div>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('predictive.kaksha.detail', 'Per-planet kakshya occupancy (3.75° slot within its sign)')}>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-vedicMaroon/60">
              <th className="text-left py-1 pr-2 font-semibold">{t('predictive.kaksha.colPlanet', 'Planet')}</th>
              <th className="text-left py-1 pr-2 font-semibold">{t('predictive.kaksha.colSign', 'Sign')}</th>
              <th className="text-right py-1 pr-2 font-semibold">{t('predictive.kaksha.colLong', 'Long')}</th>
              <th className="text-left py-1 pr-2 font-semibold">{t('predictive.kaksha.colKakshya', 'Kakshya')}</th>
              <th className="text-left py-1 pr-2 font-semibold">{t('predictive.kaksha.colLord', 'Lord')}</th>
              <th className="text-left py-1 pr-2 font-semibold">{t('predictive.kaksha.colContrib', 'Contributors (∑ = bala)')}</th>
              <th className="text-right py-1 font-semibold">{t('predictive.kaksha.colBala', 'Bala')}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.planet} className="border-t border-vedicGold/20">
                <td className="py-1 pr-2 font-mono font-semibold">{al.planet(r.planet)}</td>
                <td className="py-1 pr-2">{al.rashiByName(r.signName)}</td>
                <td className="py-1 pr-2 text-right tabular-nums text-vedicMaroon/60">{r.longitude.toFixed(2)}°</td>
                <td className="py-1 pr-2 text-right tabular-nums text-vedicMaroon/70">#{r.kakshyaIndex + 1}</td>
                <td className="py-1 pr-2 font-mono text-vedicMaroon">{al.planet(r.kakshyaLord)}</td>
                <td className="py-1 pr-2">
                  <div className="flex gap-0.5">
                    {r.contributors.map((c) => (
                      <span key={c.by} className={`text-[9px] font-mono px-1 rounded ${
                        c.gives ? 'bg-vedicMaroon text-white' : 'bg-vedicGold/10 text-vedicMaroon/40'
                      }`}>{al.planet(c.by)}</span>
                    ))}
                  </div>
                </td>
                <td className="py-1 text-right font-semibold text-vedicMaroon tabular-nums">{r.kakshaBala}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Tile helper ────────────────────────────────────────────────────────────

function Tile({ label, value, tone }: { label: string; value: string | number; tone: 'good' | 'warn' | 'info' }) {
  const toneClass = tone === 'good'
    ? 'border-green-300 bg-green-50 text-green-800'
    : tone === 'warn'
    ? 'border-amber-300 bg-amber-50 text-amber-800'
    : 'border-vedicGold/30 bg-vedicCream/30 text-vedicMaroon';
  return (
    <div className={`rounded-md border p-3 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-60">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}
