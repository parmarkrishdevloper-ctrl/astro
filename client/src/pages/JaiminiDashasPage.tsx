// Phase 8 — Jaimini rashi-based dashas.
//
// Four sign-dashas on a single page, side-by-side for cross-checking:
//   • Chara     — moves zodiacal or reverse per Lagna foot-type, years =
//                 (sign→lord count) − 1. Already wired via jaimini service.
//   • Sthira    — fixed: Movable signs 7y, Fixed 8y, Dual 9y. Total 96y.
//   • Narayana  — direction by Lagna's quality (Fixed → reverse).
//   • Shoola    — starts from 8th house sign; longevity-focused.
//
// Each column shows the 12 rashi periods with start/end and duration. The
// currently-active period (based on the inspected moment) is highlighted so
// you can see which rashi is ruling the chart across all four systems at
// once.

import { useMemo, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { AstroTranslator } from '../i18n/astro-labels';
import type {
  BirthInput, JaiminiDashaKey, JaiminiDashasBundle, JaiminiRashiDashaPeriod,
} from '../types';

interface SystemMeta {
  key: JaiminiDashaKey;
  labelKey: string;
  labelFallback: string;
  descKey: string;
  descFallback: string;
}

const SYSTEMS: SystemMeta[] = [
  { key: 'chara',         labelKey: 'jaimini.system.chara',          labelFallback: 'Chara',          descKey: 'jaimini.system.charaDesc',          descFallback: '(sign→lord count − 1), direction by odd/even foot of Lagna' },
  { key: 'sthira',        labelKey: 'jaimini.system.sthira',         labelFallback: 'Sthira',         descKey: 'jaimini.system.sthiraDesc',         descFallback: 'fixed: Movable 7y · Fixed 8y · Dual 9y (96y total)' },
  { key: 'narayana',      labelKey: 'jaimini.system.narayana',       labelFallback: 'Narayana',       descKey: 'jaimini.system.narayanaDesc',       descFallback: 'direction by Lagna quality (Mov/Dual forward · Fixed reverse)' },
  { key: 'shoola',        labelKey: 'jaimini.system.shoola',         labelFallback: 'Shoola',         descKey: 'jaimini.system.shoolaDesc',         descFallback: 'starts from 8th sign (longevity-focused), raw sign→lord count' },
  { key: 'niryanaShoola', labelKey: 'jaimini.system.niryanaShoola',  labelFallback: 'Niryana Shoola', descKey: 'jaimini.system.niryanaShoolaDesc',  descFallback: "starts from 8th lord's sign; longevity cross-check" },
  { key: 'padakrama',     labelKey: 'jaimini.system.padakrama',      labelFallback: 'Padakrama',      descKey: 'jaimini.system.padakramaDesc',      descFallback: 'Sudasa/Lakshmi — starts from Arudha Lagna (A1); prosperity' },
];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
  });
}

function total(periods: JaiminiRashiDashaPeriod[]): number {
  return periods.reduce((s, p) => s + p.years, 0);
}

function activeAt(periods: JaiminiRashiDashaPeriod[], at: Date): number {
  const t = at.getTime();
  return periods.findIndex(
    (p) => new Date(p.startDate).getTime() <= t && t < new Date(p.endDate).getTime(),
  );
}

export function JaiminiDashasPage() {
  const { t, al } = useT();
  const [dashas, setDashas] = useState<JaiminiDashasBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [atInput, setAtInput] = useState<string>(() => {
    const d = new Date(); d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });

  const atDate = useMemo(() => new Date(atInput), [atInput]);

  async function handleSubmit(input: BirthInput) {
    setLoading(true); setError(null);
    try {
      const r = await api.jaiminiDashas(input);
      setDashas(r.dashas);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <PageShell
      title={t('jaimini.title', 'Jaimini Rashi Dashas')}
      subtitle={t('jaimini.subtitle', 'Chara · Sthira · Narayana · Shoola — four sign-based dashas side-by-side.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
          {dashas && (
            <Card title={t('jaimini.inspectMoment', 'Inspect moment')}>
              <input
                type="datetime-local"
                value={atInput}
                onChange={(e) => setAtInput(e.target.value)}
                className="w-full px-2 py-1.5 rounded-md border border-vedicGold/40 bg-white text-xs"
              />
              <p className="mt-2 text-[11px] text-vedicMaroon/60">
                {t('jaimini.inspectNote', 'The active rashi at this moment is highlighted in each system.')}
              </p>
            </Card>
          )}
        </aside>

        <main className="space-y-6">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {loading && <EmptyState>{t('jaimini.loading', 'Computing four Jaimini dashas…')}</EmptyState>}
          {!dashas && !loading && !error && (
            <EmptyState>{t('jaimini.empty', 'Enter birth details to compute the Jaimini rashi dashas.')}</EmptyState>
          )}

          {dashas && (
            <>
              <SystemOverview dashas={dashas} t={t} />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {SYSTEMS.map((s) => (
                  <DashaColumn
                    key={s.key}
                    systemKey={s.key}
                    label={t(s.labelKey, s.labelFallback)}
                    description={t(s.descKey, s.descFallback)}
                    periods={dashas[s.key] ?? []}
                    at={atDate}
                    t={t}
                    al={al}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

function SystemOverview({
  dashas, t,
}: {
  dashas: JaiminiDashasBundle;
  t: (k: string, f?: string) => string;
}) {
  return (
    <Card title={t('jaimini.overviewTitle', 'Four systems — at a glance')}>
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-vedicMaroon/70">
            <th className="text-left py-1 pr-3 font-semibold">{t('jaimini.colSystem', 'System')}</th>
            <th className="text-left py-1 pr-3 font-semibold">{t('jaimini.colCovers', 'Covers')}</th>
            <th className="text-left py-1 pr-3 font-semibold">{t('jaimini.colFormulation', 'Formulation')}</th>
            <th className="text-right py-1 font-semibold">{t('jaimini.colYears', 'Σ years')}</th>
          </tr>
        </thead>
        <tbody>
          {SYSTEMS.map((s) => (
            <tr key={s.key} className="border-t border-vedicGold/20">
              <td className="py-1.5 pr-3 font-semibold text-vedicMaroon">{t(s.labelKey, s.labelFallback)}</td>
              <td className="py-1.5 pr-3 text-vedicMaroon/70 tabular-nums">
                {dashas[s.key]?.[0] ? fmtDate(dashas[s.key][0].startDate) : '—'}
                {dashas[s.key]?.[11] ? ` → ${fmtDate(dashas[s.key][11].endDate)}` : ''}
              </td>
              <td className="py-1.5 pr-3 text-vedicMaroon/70">{t(s.descKey, s.descFallback)}</td>
              <td className="py-1.5 text-right text-vedicMaroon tabular-nums font-semibold">
                {total(dashas[s.key] ?? []).toFixed(0)}y
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function DashaColumn({
  systemKey, label, description, periods, at, t, al,
}: {
  systemKey: JaiminiDashaKey;
  label: string;
  description: string;
  periods: JaiminiRashiDashaPeriod[];
  at: Date;
  t: (k: string, f?: string) => string;
  al: AstroTranslator;
}) {
  const activeIdx = activeAt(periods, at);
  const sum = total(periods);
  const cardTitle = t('jaimini.dashaSuffix', '{label} Dasha — {y}y')
    .replace('{label}', label)
    .replace('{y}', sum.toFixed(0));

  return (
    <Card title={cardTitle}>
      <p className="text-[11px] text-vedicMaroon/60 mb-2">{description}</p>
      <div className="space-y-1">
        {periods.map((p, i) => {
          const isActive = i === activeIdx;
          const share = Math.max(0.1, p.years / 12);
          return (
            <div
              key={`${systemKey}-${i}`}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition ${
                isActive
                  ? 'bg-vedicMaroon text-white'
                  : 'bg-vedicCream/50 text-vedicMaroon hover:bg-vedicMaroon/5'
              }`}
            >
              <span className={`w-6 text-[10px] tabular-nums ${isActive ? 'text-white/60' : 'text-vedicMaroon/50'}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="w-24 font-semibold">{al.rashiByName(p.signName)}</span>
              <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${isActive ? 'bg-white/20' : 'bg-vedicMaroon/10'}`}>
                <div
                  className={`h-full ${isActive ? 'bg-white' : 'bg-vedicMaroon/60'}`}
                  style={{ width: `${share * 100}%` }}
                />
              </div>
              <span className={`w-14 text-right text-[10px] tabular-nums ${isActive ? 'text-white/70' : 'text-vedicMaroon/60'}`}>
                {p.years.toFixed(0)}y
              </span>
              <span className={`w-40 text-right text-[10px] tabular-nums ${isActive ? 'text-white/70' : 'text-vedicMaroon/50'}`}>
                {fmtDate(p.startDate)} → {fmtDate(p.endDate)}
              </span>
              {isActive && (
                <span className="text-[10px] font-semibold uppercase">{t('jaimini.now', 'now')}</span>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
