// Phase 13 — Specialty page.
//
// Five tabs:
//   1. Vastu      — directional architecture + chart-driven doshas
//   2. Medical    — body vulnerability, planetary afflictions, longevity band
//   3. Marital    — 7H + Navamsha + Upa-pada + Mangal dosha + timings
//   4. Career     — 10H + Amatyakaraka + Dashamsa + triple analysis + fields
//   5. Financial  — 2/11/9/5 houses + dhana yogas + timings + sources

import { useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput } from '../types';

type Tab = 'vastu' | 'medical' | 'marital' | 'career' | 'financial';

type T = (key: string, fallback?: string) => string;

function localizeKind(t: T, k: string): string {
  return t(`specialty.kind.${k}`, k);
}
function localizeSeverity(t: T, s: string): string {
  return t(`specialty.severity.${s}`, s);
}
function localizeState(t: T, s: string): string {
  return t(`specialty.medical.state.${s}`, s);
}
function localizeFlag(t: T, b: boolean): string {
  return b ? t('specialty.value.yes', 'yes') : t('specialty.value.no', 'no');
}
function localizeScore(t: T, s: string): string {
  return t(`specialty.score.${s}`, s);
}
function localizeLordState(t: T, s: string): string {
  return t(`specialty.lordState.${s}`, s);
}
function localizeLongevity(t: T, s: string): string {
  return t(`specialty.longevity.${s}`, s);
}
function localizeDirection(t: T, d: string): string {
  return t(`specialty.direction.${d}`, d);
}

export function SpecialtyPage() {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>('vastu');

  const tabLabels: Record<Tab, string> = {
    vastu:     t('specialty.tab.vastu', 'Vastu'),
    medical:   t('specialty.tab.medical', 'Medical'),
    marital:   t('specialty.tab.marital', 'Marital'),
    career:    t('specialty.tab.career', 'Career'),
    financial: t('specialty.tab.financial', 'Financial'),
  };

  return (
    <PageShell
      title={t('specialty.title', 'Specialty')}
      subtitle={t('specialty.subtitle', 'Vastu · Medical · Marital · Career · Financial — chart-aware deep analyses.')}
    >
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-vedicGold/30 bg-vedicCream/30 w-fit mb-4">
        {(['vastu', 'medical', 'marital', 'career', 'financial'] as Tab[]).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === k ? 'bg-vedicMaroon text-white' : 'text-vedicMaroon/70 hover:bg-vedicMaroon/5'
            }`}>
            {tabLabels[k]}
          </button>
        ))}
      </div>

      {tab === 'vastu'     && <SpecialtyTab kind="vastu"     call={api.specialtyVastu}     render={VastuView} />}
      {tab === 'medical'   && <SpecialtyTab kind="medical"   call={api.specialtyMedical}   render={MedicalView} />}
      {tab === 'marital'   && <SpecialtyTab kind="marital"   call={api.specialtyMarital}   render={MaritalView} />}
      {tab === 'career'    && <SpecialtyTab kind="career"    call={api.specialtyCareer}    render={CareerView} />}
      {tab === 'financial' && <SpecialtyTab kind="financial" call={api.specialtyFinancial} render={FinancialView} />}
    </PageShell>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared tab wrapper — form on left, result on right
// ═══════════════════════════════════════════════════════════════════════════

function SpecialtyTab({
  kind, call, render,
}: {
  kind: string;
  call: (input: BirthInput) => Promise<{ ok: true; report: any }>;
  render: (p: { report: any }) => JSX.Element;
}) {
  const { t } = useT();
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(input: BirthInput) {
    setLoading(true); setError(null); setReport(null);
    try {
      const r = await call(input);
      setReport(r.report);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  const localKind = localizeKind(t, kind);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      <aside>
        <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
      </aside>
      <main className="space-y-3">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {loading && <EmptyState>{t('specialty.computing', 'Computing {kind} analysis…').replace('{kind}', localKind)}</EmptyState>}
        {!report && !loading && !error && (
          <EmptyState>{t('specialty.empty', 'Enter birth details to generate a {kind} report.').replace('{kind}', localKind)}</EmptyState>
        )}
        {report && render({ report })}
      </main>
    </div>
  );
}

function severityTone(s: string): 'good' | 'bad' | 'warn' | 'neutral' | 'info' {
  if (s === 'low')      return 'good';
  if (s === 'moderate') return 'info';
  if (s === 'elevated' || s === 'medium') return 'warn';
  if (s === 'high')     return 'bad';
  return 'neutral';
}

// ═══════════════════════════════════════════════════════════════════════════
// Vastu
// ═══════════════════════════════════════════════════════════════════════════

function VastuView({ report }: { report: any }) {
  const { t, al } = useT();
  const p = report.personal;
  return (
    <>
      <Card title={t('specialty.vastu.directions', 'Personalised directions')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <DirCell label={t('specialty.vastu.dirAsc', 'Ascendant')}       value={localizeDirection(t, p.ascDirection)} />
          <DirCell label={t('specialty.vastu.dirMoon', 'Moon sign')}       value={localizeDirection(t, p.moonDirection)} />
          <DirCell label={t('specialty.vastu.dirStrongest', 'Strongest graha')} value={`${al.planet(p.strongestPlanet)} · ${localizeDirection(t, p.strongestDirection)}`} />
          <DirCell label={t('specialty.vastu.dirHead', 'Head sleeping')}   value={localizeDirection(t, p.headWhileSleeping)} />
          <DirCell label={t('specialty.vastu.dirDesk', 'Desk facing')}     value={localizeDirection(t, p.deskFacingWhileWorking)} />
          <DirCell label={t('specialty.vastu.dirMeditation', 'Meditation')}      value={localizeDirection(t, p.meditationDirection)} />
          <DirCell label={t('specialty.vastu.dirWealth', 'Wealth corner')}   value={localizeDirection(t, p.wealthCornerDirection)} />
        </div>
        <div className="mt-3 text-[11px] text-vedicMaroon/70 space-y-0.5">
          {/* TODO(i18n-server): localize report.notes (server prose) */}
          {report.notes.map((n: string, i: number) => <div key={i} lang="en">• {n}</div>)}
        </div>
      </Card>

      <Card title={t('specialty.vastu.doshas', 'Doshas & advisories')}>
        <ul className="space-y-1.5 text-xs">
          {report.doshaChecks.map((d: any, i: number) => (
            <li key={i} className="flex flex-col gap-0.5 border-t border-vedicGold/10 pt-1.5">
              <div className="flex gap-2 items-center">
                <Pill tone={severityTone(d.severity)}>{localizeSeverity(t, d.severity)}</Pill>
                {/* TODO(i18n-server): localize d.dosha and d.remedy */}
                <span className="font-semibold text-vedicMaroon" lang="en">{d.dosha}</span>
              </div>
              <div className="text-vedicMaroon/70 text-[11px] pl-1" lang="en">↳ {d.remedy}</div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title={t('specialty.vastu.dikpala', '9 directions — dikpala catalogue')}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60">
              <th className="py-1">{t('specialty.vastu.col.dir', 'Dir')}</th>
              <th>{t('specialty.vastu.col.deity', 'Deity')}</th>
              <th>{t('specialty.vastu.col.planet', 'Planet')}</th>
              <th>{t('specialty.vastu.col.tattva', 'Tattva')}</th>
              <th>{t('specialty.vastu.col.favoured', 'Favoured')}</th>
            </tr>
          </thead>
          <tbody>
            {report.directions.map((d: any) => (
              <tr key={d.key} className="border-t border-vedicGold/10 align-top">
                <td className="py-1 font-mono font-semibold">{localizeDirection(t, d.key)}</td>
                {/* TODO(i18n-server): localize d.deity, d.tattva, d.favoredRooms */}
                <td lang="en">{d.deity}</td>
                <td>{al.planet(d.planet)}</td>
                <td lang="en">{d.tattva}</td>
                <td className="text-[11px] text-vedicMaroon/70" lang="en">{d.favoredRooms.slice(0, 2).join(' · ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title={t('specialty.vastu.roomAdvisor', 'Room placement advisor')}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60">
              <th className="py-1">{t('specialty.vastu.col.room', 'Room')}</th>
              <th>{t('specialty.vastu.col.best', 'Best')}</th>
              <th>{t('specialty.vastu.col.avoid', 'Avoid')}</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(report.roomAdvice as Record<string, any>).map(([room, a]) => (
              <tr key={room} className="border-t border-vedicGold/10">
                {/* TODO(i18n-server): localize room name */}
                <td className="py-1 font-semibold" lang="en">{room}</td>
                <td className="text-green-700">{a.best.map((d: string) => localizeDirection(t, d)).join(', ') || t('specialty.value.dash', '—')}</td>
                <td className="text-red-700">{a.avoid.map((d: string) => localizeDirection(t, d)).join(', ') || t('specialty.value.dash', '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function DirCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-vedicGold/20 bg-parchment/30 p-2">
      <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50">{label}</div>
      <div className="font-mono font-semibold text-vedicMaroon">{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Medical
// ═══════════════════════════════════════════════════════════════════════════

function MedicalView({ report }: { report: any }) {
  const { t, al } = useT();
  return (
    <>
      <Card title={t('specialty.medical.overallTitle', 'Health overall — {label} ({score}/100)').replace('{label}', localizeScore(t, report.overallLabel)).replace('{score}', String(report.overallScore))}>
        <div className="flex flex-wrap gap-2 mb-3">
          <Pill tone={scoreTone(report.overallScore)}>{localizeScore(t, report.overallLabel)}</Pill>
          <Pill tone="info">{t('specialty.medical.longevity', 'Longevity: {band}').replace('{band}', localizeLongevity(t, report.longevityBand))}</Pill>
          <Pill tone="neutral">{t('specialty.medical.arogyaLord', 'Arogya bhava lord: {planet} ({state})').replace('{planet}', al.planet(report.arogyaBhava.lord)).replace('{state}', localizeState(t, report.arogyaBhava.lordState))}</Pill>
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <DusthanaCell label={t('specialty.medical.dust6th', '6th')} d={report.dusthanas.sixth} />
          <DusthanaCell label={t('specialty.medical.dust8th', '8th')} d={report.dusthanas.eighth} />
          <DusthanaCell label={t('specialty.medical.dust12th', '12th')} d={report.dusthanas.twelfth} />
        </div>
      </Card>

      <Card title={t('specialty.medical.body', 'Body vulnerability (12 rashis → body parts)')}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60">
              <th className="py-1">{t('specialty.medical.col.house', 'House')}</th>
              <th>{t('specialty.medical.col.part', 'Body part')}</th>
              <th>{t('specialty.medical.col.risk', 'Risk')}</th>
              <th>{t('specialty.medical.col.occAsp', 'Occupants / aspects')}</th>
            </tr>
          </thead>
          <tbody>
            {report.bodyVulnerability.map((b: any) => (
              <tr key={b.houseNum} className="border-t border-vedicGold/10 align-top">
                <td className="py-1 font-mono">{b.houseNum}</td>
                {/* TODO(i18n-server): localize b.part */}
                <td className="font-semibold" lang="en">{b.part}</td>
                <td><Pill tone={severityTone(b.risk)}>{localizeSeverity(t, b.risk)}</Pill></td>
                <td className="text-[11px] text-vedicMaroon/70">
                  {b.occupants.length ? t('specialty.medical.in', 'In: {planets}').replace('{planets}', b.occupants.map((p: string) => al.planet(p)).join(', ')) : ''}
                  {b.aspects.length ? ` · ${t('specialty.medical.asp', 'Asp: {planets}').replace('{planets}', b.aspects.map((p: string) => al.planet(p)).join(', '))}` : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title={t('specialty.medical.matrix', 'Planetary health matrix')}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60">
              <th className="py-1">{t('specialty.medical.col.planet', 'Planet')}</th>
              <th>{t('specialty.medical.col.state', 'State')}</th>
              <th>{t('specialty.medical.col.systems', 'Systems')}</th>
              <th>{t('specialty.medical.col.watch', 'Watch')}</th>
            </tr>
          </thead>
          <tbody>
            {report.planetHealth.map((h: any) => (
              <tr key={h.planet} className="border-t border-vedicGold/10 align-top">
                <td className="py-1 font-semibold">{al.planet(h.planet)}</td>
                <td>
                  <Pill tone={h.state === 'strong' ? 'good' : h.state === 'afflicted' ? 'bad' : 'neutral'}>
                    {localizeState(t, h.state)}
                  </Pill>
                </td>
                {/* TODO(i18n-server): localize h.bodySystems and h.diseasesToWatch */}
                <td className="text-[11px] text-vedicMaroon/70" lang="en">{h.bodySystems.slice(0, 3).join(', ')}</td>
                <td className="text-[11px] text-vedicMaroon/70" lang="en">{h.diseasesToWatch.slice(0, 3).join(', ') || t('specialty.value.dash', '—')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title={t('specialty.medical.recommend', 'Recommendations')}>
        <ul className="space-y-1 text-xs list-disc pl-5 text-vedicMaroon/80">
          {/* TODO(i18n-server): localize report.recommendations prose */}
          {report.recommendations.map((r: string, i: number) => <li key={i} lang="en">{r}</li>)}
        </ul>
      </Card>
    </>
  );
}

function DusthanaCell({ label, d }: { label: string; d: any }) {
  const { t, al } = useT();
  return (
    <div className="rounded border border-vedicGold/20 bg-parchment/30 p-2">
      <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50">{t('specialty.medical.dustHouse', '{label} house').replace('{label}', label)}</div>
      <div className="text-vedicMaroon font-mono">{t('specialty.medical.dustScore', 'Score {n}').replace('{n}', String(d.score))}</div>
      <div className="text-[10px] text-vedicMaroon/60">{t('specialty.medical.dustLord', 'Lord: {planet}').replace('{planet}', al.planet(d.lord))}</div>
      {d.occupants.length > 0 && (
        <div className="text-[10px] text-vedicMaroon/60">{t('specialty.medical.dustIn', 'In: {planets}').replace('{planets}', d.occupants.map((p: string) => al.planet(p)).join(', '))}</div>
      )}
    </div>
  );
}

function scoreTone(s: number): 'good' | 'bad' | 'warn' | 'neutral' | 'info' {
  if (s >= 75) return 'good';
  if (s >= 55) return 'info';
  if (s >= 35) return 'warn';
  return 'bad';
}

// ═══════════════════════════════════════════════════════════════════════════
// Marital
// ═══════════════════════════════════════════════════════════════════════════

function MaritalView({ report }: { report: any }) {
  const { t, al } = useT();
  const dash = t('specialty.value.dash', '—');
  return (
    <>
      <Card title={t('specialty.marital.scoreTitle', 'Marital score — {label} ({score}/100)').replace('{label}', localizeScore(t, report.scoreLabel)).replace('{score}', String(report.score))}>
        <div className="flex flex-wrap gap-2 mb-3">
          <Pill tone={scoreTone(report.score)}>{localizeScore(t, report.scoreLabel)}</Pill>
          <Pill tone="info">{t('specialty.marital.spouseKaraka', 'Spouse karaka: {planet}').replace('{planet}', al.planet(report.karakas.spouseKaraka))}</Pill>
          <Pill tone="info">{t('specialty.marital.darakaraka', 'Darakaraka: {planet}').replace('{planet}', al.planet(report.karakas.darakaraka))}</Pill>
          {report.navamsha.venusVargottama && <Pill tone="good">{t('specialty.marital.venusVargottama', 'Venus vargottama')}</Pill>}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card title={t('specialty.marital.seventhHouse', '7th house')}>
          <div className="text-xs space-y-1">
            <div>{t('specialty.marital.lordIs', 'Lord: {planet} ({state})').replace('{planet}', al.planet(report.seventhHouse.lord)).replace('{state}', localizeLordState(t, report.seventhHouse.lordState))}</div>
            {/* TODO(i18n-server): localize report.seventhHouse.sign.element/quality */}
            <div lang="en">{t('specialty.marital.signIs', 'Sign: {name} ({element} · {quality})').replace('{name}', al.rashiByName(report.seventhHouse.sign.name)).replace('{element}', report.seventhHouse.sign.element).replace('{quality}', report.seventhHouse.sign.quality)}</div>
            <div>{t('specialty.marital.occupants', 'Occupants: {planets}').replace('{planets}', report.seventhHouse.occupants.map((p: string) => al.planet(p)).join(', ') || dash)}</div>
            <div>{t('specialty.marital.aspects', 'Aspects: {planets}').replace('{planets}', report.seventhHouse.aspects.map((p: string) => al.planet(p)).join(', ') || dash)}</div>
            {report.seventhHouse.benefics.length > 0 && <div className="text-green-700">{t('specialty.marital.beneficsIn', 'Benefics in: {planets}').replace('{planets}', report.seventhHouse.benefics.map((p: string) => al.planet(p)).join(', '))}</div>}
            {report.seventhHouse.malefics.length > 0 && <div className="text-red-700">{t('specialty.marital.maleficsIn', 'Malefics in: {planets}').replace('{planets}', report.seventhHouse.malefics.map((p: string) => al.planet(p)).join(', '))}</div>}
          </div>
        </Card>

        <Card title={t('specialty.marital.navamsha', 'Navamsha (D9)')}>
          <div className="text-xs space-y-1">
            <div>{t('specialty.marital.ascSign', 'Asc sign: {name}').replace('{name}', al.rashiByName(report.navamsha.ascRashiName))}</div>
            <div>{t('specialty.marital.seventhSign', '7th sign: {name}').replace('{name}', al.rashiByName(report.navamsha.seventhSignName))}</div>
            <div>{t('specialty.marital.seventhLord', '7L: {planet} in D9 house {h}').replace('{planet}', al.planet(report.navamsha.seventhLord)).replace('{h}', String(report.navamsha.seventhLordHouse))}</div>
            <div>{t('specialty.marital.venusVarg', 'Venus vargottama: {flag}').replace('{flag}', report.navamsha.venusVargottama ? t('specialty.value.YES', 'YES') : t('specialty.value.no', 'no'))}</div>
          </div>
        </Card>

        <Card title={t('specialty.marital.upapada', 'Upa-pada Lagna (UL)')}>
          <div className="text-xs space-y-1">
            <div>{t('specialty.marital.ulSign', 'UL sign: {name} ({h}H from asc)').replace('{name}', al.rashiByName(report.upaPada.signName)).replace('{h}', String(report.upaPada.housesFromAsc))}</div>
            <div>{t('specialty.marital.ulLord', 'UL lord: {planet}').replace('{planet}', al.planet(report.upaPada.lord))}</div>
            <div>{t('specialty.marital.benefics', 'Benefics: {planets}').replace('{planets}', report.upaPada.benefics.map((p: string) => al.planet(p)).join(', ') || dash)}</div>
            <div>{t('specialty.marital.malefics', 'Malefics: {planets}').replace('{planets}', report.upaPada.malefics.map((p: string) => al.planet(p)).join(', ') || dash)}</div>
          </div>
        </Card>

        <Card title={report.mangalDosha.active ? t('specialty.marital.mangalActive', 'Mangal dosha — ACTIVE') : t('specialty.marital.mangalAbsent', 'Mangal dosha — absent')}>
          <div className="text-xs space-y-1">
            <div>{t('specialty.marital.fromLagna', 'From Lagna: {flag}').replace('{flag}', localizeFlag(t, report.mangalDosha.fromLagna))}</div>
            <div>{t('specialty.marital.fromMoon', 'From Moon: {flag}').replace('{flag}', localizeFlag(t, report.mangalDosha.fromMoon))}</div>
            <div>{t('specialty.marital.fromVenus', 'From Venus: {flag}').replace('{flag}', localizeFlag(t, report.mangalDosha.fromVenus))}</div>
            <div>{t('specialty.marital.cancelled', 'Cancelled: {flag}').replace('{flag}', localizeFlag(t, report.mangalDosha.cancelled))}</div>
            {report.mangalDosha.notes?.length > 0 && (
              <ul className="text-[11px] text-vedicMaroon/70 pl-3 list-disc">
                {/* TODO(i18n-server): localize mangal dosha notes */}
                {report.mangalDosha.notes.map((n: string, i: number) => <li key={i} lang="en">{n}</li>)}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card title={t('specialty.marital.spouseInd', 'Spouse indicators')}>
        {/* TODO(i18n-server): localize spouse nature/appearance/origin prose */}
        <div className="text-xs space-y-1">
          <div lang="en">{t('specialty.marital.nature', 'Nature: {value}').replace('{value}', Array.isArray(report.spouse.nature) ? report.spouse.nature.join(' · ') : report.spouse.nature)}</div>
          <div lang="en">{t('specialty.marital.appearance', 'Appearance: {value}').replace('{value}', Array.isArray(report.spouse.appearance) ? report.spouse.appearance.join(' · ') : report.spouse.appearance)}</div>
          <div lang="en">{t('specialty.marital.origin', 'Origin: {value}').replace('{value}', report.spouse.origin)}</div>
        </div>
      </Card>

      <Card title={t('specialty.marital.timings', 'Marriage timing windows')}>
        {report.marriageTimings.length === 0 && <div className="text-xs text-vedicMaroon/60">{t('specialty.marital.noTimings', 'No dasha windows highlighted in range.')}</div>}
        <ul className="text-xs space-y-1.5">
          {report.marriageTimings.map((tm: any, i: number) => (
            <li key={i} className="border-t border-vedicGold/10 pt-1.5 flex justify-between gap-3">
              <div>
                {/* TODO(i18n-server): localize tm.mahadasha and tm.why */}
                <div className="font-semibold" lang="en">{tm.mahadasha} ({al.planet(tm.lord)})</div>
                <div className="text-[11px] text-vedicMaroon/70" lang="en">{tm.why}</div>
              </div>
              <div className="font-mono text-[11px] text-vedicMaroon/70 text-right whitespace-nowrap">
                {tm.startISO} → {tm.endISO}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <FactorsCard factors={report.factors} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Career
// ═══════════════════════════════════════════════════════════════════════════

function CareerView({ report }: { report: any }) {
  const { t, al } = useT();
  const dash = t('specialty.value.dash', '—');
  return (
    <>
      <Card title={t('specialty.career.scoreTitle', 'Career score — {label} ({score}/100)').replace('{label}', localizeScore(t, report.scoreLabel)).replace('{score}', String(report.score))}>
        <div className="flex flex-wrap gap-2 mb-3">
          <Pill tone={scoreTone(report.score)}>{localizeScore(t, report.scoreLabel)}</Pill>
          <Pill tone="info">{t('specialty.career.amk', 'AmK: {planet} ({strength})').replace('{planet}', al.planet(report.amatyakaraka.planet)).replace('{strength}', al.strength(report.amatyakaraka.strength))}</Pill>
          <Pill tone="info">{t('specialty.career.strongest', 'Strongest: {planet} · {rupas} rupas').replace('{planet}', al.planet(report.strongestGraha.planet)).replace('{rupas}', report.strongestGraha.rupas.toFixed(2))}</Pill>
          <Pill tone="neutral">{t('specialty.career.workplaceDir', 'Workplace dir: {dir}').replace('{dir}', localizeDirection(t, report.workplaceDirection))}</Pill>
          <Pill tone="neutral">{t('specialty.career.deskFacing', 'Desk facing: {dir}').replace('{dir}', localizeDirection(t, report.deskFacing))}</Pill>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card title={t('specialty.career.tenthHouse', '10th house')}>
          <div className="text-xs space-y-1">
            <div>{t('specialty.career.lordHouse', 'Lord: {planet} ({state}) in house {h}').replace('{planet}', al.planet(report.tenthHouse.lord)).replace('{state}', localizeLordState(t, report.tenthHouse.lordState)).replace('{h}', String(report.tenthHouse.lordHouse))}</div>
            <div>{t('specialty.career.signIs', 'Sign: {name}').replace('{name}', al.rashiByName(report.tenthHouse.sign.name))}</div>
            <div>{t('specialty.career.occupants', 'Occupants: {planets}').replace('{planets}', report.tenthHouse.occupants.map((p: string) => al.planet(p)).join(', ') || dash)}</div>
            <div>{t('specialty.career.aspects', 'Aspects: {planets}').replace('{planets}', report.tenthHouse.aspects.map((p: string) => al.planet(p)).join(', ') || dash)}</div>
            {report.tenthHouse.benefics.length > 0 && <div className="text-green-700">{t('specialty.career.benefics', 'Benefics: {planets}').replace('{planets}', report.tenthHouse.benefics.map((p: string) => al.planet(p)).join(', '))}</div>}
            {report.tenthHouse.malefics.length > 0 && <div className="text-red-700">{t('specialty.career.malefics', 'Malefics: {planets}').replace('{planets}', report.tenthHouse.malefics.map((p: string) => al.planet(p)).join(', '))}</div>}
          </div>
        </Card>

        <Card title={t('specialty.career.dashamsa', 'Dashamsa (D10)')}>
          <div className="text-xs space-y-1">
            <div>{t('specialty.career.ascD10', 'Asc: {name}').replace('{name}', al.rashiByName(report.dashamsa.ascRashiName))}</div>
            <div>{t('specialty.career.tenthSign', '10th sign: {name}').replace('{name}', al.rashiByName(report.dashamsa.tenthSignName))}</div>
            <div>{t('specialty.career.tenthLord', '10L: {planet} in D10 house {h}').replace('{planet}', al.planet(report.dashamsa.tenthLord)).replace('{h}', String(report.dashamsa.tenthLordHouseInD10))}</div>
            <div><span className="text-green-700">{t('specialty.career.vargottama', 'Vargottama: {planets}').replace('{planets}', report.dashamsa.vargottamaPlanets.map((p: string) => al.planet(p)).join(', ') || dash)}</span></div>
          </div>
        </Card>
      </div>

      <Card title={t('specialty.career.triple', 'Triple analysis (10th from Lagna / Moon / Sun)')}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60">
              <th className="py-1">{t('specialty.career.col.from', 'From')}</th>
              <th>{t('specialty.career.col.sign', 'Sign')}</th>
              <th>{t('specialty.career.col.occ', 'Occupants')}</th>
              <th>{t('specialty.career.col.asp', 'Aspects')}</th>
            </tr>
          </thead>
          <tbody>
            {(['fromLagna', 'fromMoon', 'fromSun'] as const).map((k) => {
              const tr = report.triple[k];
              const labelKey = k.replace('from', '');
              return (
                <tr key={k} className="border-t border-vedicGold/10">
                  <td className="py-1 font-semibold">{t(`specialty.career.from.${labelKey}`, labelKey)}</td>
                  <td>{al.rashiByName(tr.signName)}</td>
                  <td>{tr.occupants.map((p: string) => al.planet(p)).join(', ') || dash}</td>
                  <td>{tr.aspects.map((p: string) => al.planet(p)).join(', ') || dash}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card title={t('specialty.career.fields', 'Career fields (merged)')}>
        <div className="flex flex-wrap gap-1.5">
          {/* TODO(i18n-server): localize career field names */}
          {report.careerFields.map((f: string) => (
            <span key={f} className="px-2 py-0.5 rounded bg-parchment border border-vedicGold/30 text-[11px] text-vedicMaroon/80" lang="en">{f}</span>
          ))}
        </div>
      </Card>

      <Card title={t('specialty.career.timings', 'Career timing windows')}>
        {report.careerTimings.length === 0 && <div className="text-xs text-vedicMaroon/60">{t('specialty.career.noWindows', 'No windows in range.')}</div>}
        <ul className="text-xs space-y-1.5">
          {report.careerTimings.map((tm: any, i: number) => (
            <li key={i} className="border-t border-vedicGold/10 pt-1.5 flex justify-between gap-3">
              <div>
                {/* TODO(i18n-server): localize tm.mahadasha and tm.why */}
                <div className="font-semibold" lang="en">{tm.mahadasha} ({al.planet(tm.lord)})</div>
                <div className="text-[11px] text-vedicMaroon/70" lang="en">{tm.why}</div>
              </div>
              <div className="font-mono text-[11px] text-vedicMaroon/70 text-right whitespace-nowrap">
                {tm.startISO} → {tm.endISO}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <FactorsCard factors={report.factors} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Financial
// ═══════════════════════════════════════════════════════════════════════════

function FinancialView({ report }: { report: any }) {
  const { t, al } = useT();
  const dash = t('specialty.value.dash', '—');
  return (
    <>
      <Card title={t('specialty.financial.scoreTitle', 'Financial score — {label} ({score}/100)').replace('{label}', localizeScore(t, report.scoreLabel)).replace('{score}', String(report.score))}>
        <div className="flex flex-wrap gap-2">
          <Pill tone={scoreTone(report.score)}>{localizeScore(t, report.scoreLabel)}</Pill>
        </div>
        {/* TODO(i18n-server): localize report.liquidityNote prose */}
        <div className="mt-3 text-xs text-vedicMaroon/70" lang="en">{report.liquidityNote}</div>
      </Card>

      <Card title={t('specialty.financial.wealth', 'Wealth houses (2/11/9/5)')}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60">
              <th className="py-1">{t('specialty.financial.col.house', 'House')}</th>
              <th>{t('specialty.financial.col.lord', 'Lord')}</th>
              <th>{t('specialty.financial.col.state', 'State')}</th>
              <th>{t('specialty.financial.col.occ', 'Occupants')}</th>
              <th>{t('specialty.financial.col.asp', 'Aspects')}</th>
            </tr>
          </thead>
          <tbody>
            {(['second', 'eleventh', 'ninth', 'fifth'] as const).map((k) => {
              const h = report.wealthHouses[k];
              const houseKey = k.charAt(0).toUpperCase() + k.slice(1);
              return (
                <tr key={k} className="border-t border-vedicGold/10">
                  <td className="py-1 font-semibold">{t(`specialty.financial.h.${k}`, houseKey)}</td>
                  <td>{al.planet(h.lord)}</td>
                  <td>
                    <Pill tone={h.lordState === 'strong' ? 'good' : h.lordState === 'weak' ? 'bad' : 'neutral'}>
                      {localizeLordState(t, h.lordState)}
                    </Pill>
                  </td>
                  <td>{h.occupants.map((p: string) => al.planet(p)).join(', ') || dash}</td>
                  <td>{h.aspects.map((p: string) => al.planet(p)).join(', ') || dash}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card title={t('specialty.financial.dhanaYogas', 'Dhana yogas')}>
        <ul className="space-y-1.5 text-xs">
          {report.dhanaYogas.map((y: any, i: number) => (
            <li key={i} className="border-t border-vedicGold/10 pt-1.5 flex justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Pill tone={y.active ? (y.strength === 'strong' ? 'good' : y.strength === 'moderate' ? 'info' : 'warn') : 'neutral'}>
                    {y.active ? al.strength(y.strength) : t('specialty.financial.absent', 'absent')}
                  </Pill>
                  {/* TODO(i18n-server): localize yoga name (try al.yoga else fallback) */}
                  <span className="font-semibold">{al.yoga(y.yoga)}</span>
                </div>
                {/* TODO(i18n-server): localize y.explanation prose */}
                <div className="text-[11px] text-vedicMaroon/70" lang="en">{y.explanation}</div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title={t('specialty.financial.income', 'Likely income sources')}>
        <ul className="list-disc pl-5 space-y-1 text-xs text-vedicMaroon/80">
          {/* TODO(i18n-server): localize income source phrases */}
          {report.incomeSources.map((s: string, i: number) => <li key={i} lang="en">{s}</li>)}
        </ul>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card title={t('specialty.financial.dhanaTime', 'Dhana (wealth-gain) timings')}>
          {report.dhanaTimings.length === 0 && <div className="text-xs text-vedicMaroon/60">{t('specialty.financial.noneRange', 'None in range.')}</div>}
          <ul className="text-xs space-y-1.5">
            {report.dhanaTimings.map((tm: any, i: number) => (
              <li key={i} className="border-t border-vedicGold/10 pt-1.5">
                {/* TODO(i18n-server): localize tm.mahadasha and tm.why */}
                <div className="font-semibold" lang="en">{tm.mahadasha} <span className="text-vedicMaroon/60 text-[11px]">({al.planet(tm.lord)})</span></div>
                <div className="text-[11px] text-vedicMaroon/70" lang="en">{tm.why}</div>
                <div className="font-mono text-[11px] text-vedicMaroon/60">{tm.startISO} → {tm.endISO}</div>
              </li>
            ))}
          </ul>
        </Card>
        <Card title={t('specialty.financial.maraka', 'Maraka timings (caution)')}>
          {report.marakaTimings.length === 0 && <div className="text-xs text-vedicMaroon/60">{t('specialty.financial.noneRange', 'None in range.')}</div>}
          <ul className="text-xs space-y-1.5">
            {report.marakaTimings.map((tm: any, i: number) => (
              <li key={i} className="border-t border-vedicGold/10 pt-1.5">
                {/* TODO(i18n-server): localize tm.mahadasha and tm.why */}
                <div className="font-semibold" lang="en">{tm.mahadasha} <span className="text-vedicMaroon/60 text-[11px]">({al.planet(tm.lord)})</span></div>
                <div className="text-[11px] text-vedicMaroon/70" lang="en">{tm.why}</div>
                <div className="font-mono text-[11px] text-vedicMaroon/60">{tm.startISO} → {tm.endISO}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <FactorsCard factors={report.factors} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Shared: factors card
// ═══════════════════════════════════════════════════════════════════════════

function FactorsCard({ factors }: { factors: any[] }) {
  const { t } = useT();
  const pos = factors.filter((f) => f.kind === 'positive');
  const neg = factors.filter((f) => f.kind === 'negative');
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <Card title={t('specialty.factors.supportive', 'Supportive factors ({n})').replace('{n}', String(pos.length))}>
        <ul className="text-xs space-y-1 text-vedicMaroon/80">
          {pos.map((f, i) => (
            <li key={i}>
              <span className="font-mono text-green-700 mr-1">+{f.weight}</span>
              {/* TODO(i18n-server): localize factor f.text prose */}
              <span lang="en">{f.text}</span>
            </li>
          ))}
          {pos.length === 0 && <li className="text-vedicMaroon/50">{t('specialty.value.dash', '—')}</li>}
        </ul>
      </Card>
      <Card title={t('specialty.factors.challenging', 'Challenging factors ({n})').replace('{n}', String(neg.length))}>
        <ul className="text-xs space-y-1 text-vedicMaroon/80">
          {neg.map((f, i) => (
            <li key={i}>
              <span className="font-mono text-red-700 mr-1">{f.weight}</span>
              {/* TODO(i18n-server): localize factor f.text prose */}
              <span lang="en">{f.text}</span>
            </li>
          ))}
          {neg.length === 0 && <li className="text-vedicMaroon/50">{t('specialty.value.dash', '—')}</li>}
        </ul>
      </Card>
    </div>
  );
}
