import { useEffect, useMemo, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, Pill, ErrorBanner, EmptyState } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type {
  BirthInput, Varga, VargaMeta, DivisionalChart, VargaSummaryRow, Dignity,
} from '../types';

const DIGNITY_TONE: Record<Dignity, 'good' | 'warn' | 'bad' | 'neutral'> = {
  Exalted: 'good',
  OwnSign: 'good',
  Debilitated: 'bad',
  '': 'neutral',
};

const DIGNITY_KEY: Record<Dignity, string> = {
  Exalted: 'divisionals.dignity.exalted',
  OwnSign: 'divisionals.dignity.ownSign',
  Debilitated: 'divisionals.dignity.debilitated',
  '': '',
};

export function DivisionalsPage() {
  const { t, al } = useT();
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [vargaMeta, setVargaMeta] = useState<Record<Varga, VargaMeta> | null>(null);
  const [vargaList, setVargaList] = useState<Varga[]>([]);
  const [charts, setCharts] = useState<Record<Varga, DivisionalChart> | null>(null);
  const [summary, setSummary] = useState<VargaSummaryRow[] | null>(null);
  const [selected, setSelected] = useState<Varga>('D9');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.vargaMeta()
      .then((r) => { setVargaMeta(r.meta); setVargaList(r.vargas); })
      .catch((e) => setError((e as Error).message));
  }, []);

  async function compute(b: BirthInput) {
    setLoading(true); setError(null); setCharts(null); setSummary(null);
    try {
      const [d, s] = await Promise.all([api.divisional(b), api.vargaSummary(b)]);
      setCharts(d.charts); setSummary(s.summary);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  const chart = charts?.[selected];
  const meta = vargaMeta?.[selected];

  const vargottamaPlanets = useMemo(
    () => chart ? chart.positions.filter((p) => p.vargottama).map((p) => p.name) : [],
    [chart],
  );

  return (
    <PageShell
      title={t('divisionals.title', 'Divisional Charts (Shodashvarga)')}
      subtitle={t('divisionals.subtitle', 'Full D-1 through D-60 — Parashari varga analysis')}
    >
      <div className="mb-6">
        <BirthDetailsForm
          onSubmit={(b) => { setBirth(b); compute(b); }}
        />
        {birth && <p className="text-[11px] text-emerald-700 mt-2">{t('divisionals.captured', '✓ Birth details captured')}</p>}
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {loading && <EmptyState>{t('divisionals.computing', 'Computing {n} divisional charts…').replace('{n}', String(vargaList.length))}</EmptyState>}
      {!charts && !loading && !error && (
        <EmptyState>{t('divisionals.empty', 'Submit birth details to render all divisional charts.')}</EmptyState>
      )}

      {charts && meta && chart && (
        <div className="space-y-6">
          {/* ── VARGA PICKER ─────────────────────────────────────── */}
          <Card title={t('divisionals.selectVarga', 'Select a varga')}>
            <div className="flex flex-wrap gap-2">
              {vargaList.map((v) => {
                const m = vargaMeta?.[v];
                const isActive = v === selected;
                return (
                  <button
                    key={v}
                    onClick={() => setSelected(v)}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors
                      ${isActive ? 'text-white border-transparent'
                                 : 'text-vedicMaroon bg-white/60 border-vedicGold/40 hover:bg-vedicGold/10'}`}
                    style={isActive ? { background: 'var(--vedic-maroon, #7c2d12)' } : {}}
                    title={m?.purpose}
                  >
                    <div className="tabular-nums">{v}</div>
                    <div className="text-[10px] opacity-80 font-normal">{m?.name}</div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* ── HEADER FOR SELECTED VARGA ────────────────────────── */}
          <Card title={`${meta.varga} — ${meta.name} (${meta.nameHi})`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                {/* TODO(i18n-server): localize VargaMeta.purpose */}
                <p className="text-sm text-vedicMaroon/80" lang="en">{meta.purpose}</p>
                <p className="text-[11px] text-vedicMaroon/60 mt-1">
                  {t('divisionals.headerSegments', '{seg} segments × {deg}°').replace('{seg}', String(meta.segments)).replace('{deg}', meta.segmentDeg.toFixed(3))}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Pill tone="info">{t('divisionals.ascendant', 'Ascendant')}: {al.rashi(chart.ascendantRashi)}</Pill>
                {vargottamaPlanets.length > 0 && (
                  <Pill tone="good">{t('divisionals.vargottama', 'Vargottama')}: {vargottamaPlanets.map((n) => al.planetByName(n)).join(', ')}</Pill>
                )}
              </div>
            </div>
          </Card>

          {/* ── POSITIONS TABLE ─────────────────────────────────── */}
          <Card title={t('divisionals.positionsTitle', 'Planet positions in this varga')}>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase text-vedicMaroon/60">
                <tr className="border-b border-vedicGold/30">
                  <th className="text-left py-2">{t('divisionals.col.planet', 'Planet')}</th>
                  <th className="text-left py-2">{t('divisionals.col.rashi', 'Rashi')}</th>
                  <th className="text-right py-2">{t('divisionals.col.house', 'House')}</th>
                  <th className="text-left py-2 pl-4">{t('divisionals.col.dignity', 'Dignity')}</th>
                  <th className="text-left py-2 pl-4">{t('divisionals.col.flags', 'Flags')}</th>
                </tr>
              </thead>
              <tbody>
                {chart.positions.map((p) => (
                  <tr key={p.id} className="border-b border-vedicGold/10">
                    <td className="py-2 font-semibold text-vedicMaroon">{al.planet(p.id)}</td>
                    <td className="py-2">{al.rashi(p.rashi)}</td>
                    <td className="py-2 text-right tabular-nums">{p.house}</td>
                    <td className="py-2 pl-4">
                      {p.dignity && (
                        <Pill tone={DIGNITY_TONE[p.dignity]}>{t(DIGNITY_KEY[p.dignity] || '', p.dignity)}</Pill>
                      )}
                    </td>
                    <td className="py-2 pl-4">
                      {p.vargottama && <Pill tone="good">{t('divisionals.vargottama', 'Vargottama')}</Pill>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* ── 12-HOUSE GRID ────────────────────────────────────── */}
          <Card title={t('divisionals.houseLayout', 'House layout')}>
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 12 }).map((_, houseIdx) => {
                const houseNum = houseIdx + 1;
                const rashiNum = ((chart.ascendantRashi - 1 + houseIdx) % 12) + 1;
                const planetsHere = chart.positions.filter((p) => p.house === houseNum);
                const isLagna = houseNum === 1;
                return (
                  <div
                    key={houseNum}
                    className={`rounded-lg border p-2 min-h-[76px] text-xs
                      ${isLagna ? 'border-vedicMaroon/50 bg-vedicGold/10' : 'border-vedicGold/30 bg-white/40'}`}
                  >
                    <div className="flex justify-between text-[10px] text-vedicMaroon/60">
                      <span>{t('common.houseShort', 'H')}{houseNum}</span>
                      <span className="tabular-nums">{al.rashiShort(rashiNum)}</span>
                    </div>
                    <div className="font-semibold text-vedicMaroon">
                      {planetsHere.map((p) => al.planetShort(p.id)).join(' · ') || '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* ── SUMMARY ACROSS ALL VARGAS ───────────────────────── */}
          {summary && (
            <Card title={t('divisionals.summaryTitle', 'Strength across all 20 vargas')}>
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase text-vedicMaroon/60">
                  <tr className="border-b border-vedicGold/30">
                    <th className="text-left py-2">{t('divisionals.col.planet', 'Planet')}</th>
                    <th className="text-right py-2">{t('divisionals.summary.vargottama', 'Vargottama')}</th>
                    <th className="text-right py-2">{t('divisionals.summary.exalted', 'Exalted')}</th>
                    <th className="text-right py-2">{t('divisionals.summary.ownSign', 'Own sign')}</th>
                    <th className="text-right py-2">{t('divisionals.summary.debilitated', 'Debilitated')}</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((row) => (
                    <tr key={row.id} className="border-b border-vedicGold/10">
                      <td className="py-2 font-semibold text-vedicMaroon">{al.planet(row.id)}</td>
                      <td className="py-2 text-right tabular-nums">
                        <span className={row.vargottamaCount >= 3 ? 'text-emerald-700 font-semibold' : ''}>
                          {row.vargottamaCount}
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        <span className={row.exaltedCount > 0 ? 'text-emerald-700' : ''}>
                          {row.exaltedCount}
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        <span className={row.ownSignCount > 0 ? 'text-emerald-700' : ''}>
                          {row.ownSignCount}
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        <span className={row.debilitatedCount > 0 ? 'text-red-700' : ''}>
                          {row.debilitatedCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-[11px] text-vedicMaroon/60">
                {t('divisionals.summaryNote', 'A planet vargottama in 3+ charts, or exalted in multiple vargas, is considered very strong. High debilitation counts flag weakness.')}
              </p>
            </Card>
          )}
        </div>
      )}
    </PageShell>
  );
}
