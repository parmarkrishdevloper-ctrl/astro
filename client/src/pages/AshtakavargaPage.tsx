// Phase 19 — Ashtakavarga (Bhinnashtakavarga + Sarvashtakavarga + shodhita).
//
// Panels:
//   1. Sarvashtakavarga (SAV) — 12-sign heatmap (0..48 typical range).
//      Sign with the highest sum is where transiting planets do their best work.
//   2. Bhinnashtakavarga (BAV) — 7×12 grid of each graha's points per sign,
//      with the per-planet total column. Raw ↔ Trikona shodhita ↔ Ekadhipatya
//      shodhita toggles the matrix between the three classical formulations.
//
// Cell colour = linear blend from cream → vedic maroon scaled by the value's
// share of that column's theoretical max (8 per planet, 48 across all).

import { useMemo, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { AstroTranslator } from '../i18n/astro-labels';
import type {
  BirthInput, AshtakavargaResult, PlanetId, BAV,
} from '../types';

const REF_PLANETS: PlanetId[] = ['SU', 'MO', 'MA', 'ME', 'JU', 'VE', 'SA'];

type Reduction = 'raw' | 'trikona' | 'ekadhipatya';

export function AshtakavargaPage() {
  const { t, al } = useT();
  const [result, setResult] = useState<AshtakavargaResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reduction, setReduction] = useState<Reduction>('raw');

  async function handleSubmit(input: BirthInput) {
    setLoading(true); setError(null);
    try {
      const r = await api.ashtakavarga(input);
      setResult(r.ashtakavarga);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  const bavMatrix = useMemo((): Record<PlanetId, BAV> | null => {
    if (!result) return null;
    if (reduction === 'trikona') return result.trikonaShodhita;
    if (reduction === 'ekadhipatya') return result.ekadhipatyaShodhita;
    return result.bav;
  }, [result, reduction]);

  return (
    <PageShell
      title={t('ashtakavarga.title', 'Ashtakavarga')}
      subtitle={t('ashtakavarga.subtitle', 'Bhinnashtakavarga for each graha, the Sarvashtakavarga sum, and both classical reductions.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
          {result && (
            <ReductionToggle value={reduction} onChange={setReduction} t={t} />
          )}
        </aside>

        <main className="space-y-6">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {loading && <EmptyState>{t('ashtakavarga.loading', 'Building the 8-house benefic matrix…')}</EmptyState>}
          {!result && !loading && !error && (
            <EmptyState>{t('ashtakavarga.empty', 'Enter birth details to compute the Ashtakavarga.')}</EmptyState>
          )}

          {result && bavMatrix && (
            <>
              <SavHeatmap sav={result.sav} t={t} al={al} />
              <BavGrid matrix={bavMatrix} reduction={reduction} t={t} al={al} />
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

function ReductionToggle({
  value, onChange, t,
}: {
  value: Reduction;
  onChange: (r: Reduction) => void;
  t: (k: string, f?: string) => string;
}) {
  const opts: { key: Reduction; labelKey: string; labelFallback: string; hintKey: string; hintFallback: string }[] = [
    { key: 'raw',         labelKey: 'ashtakavarga.reduction.raw',         labelFallback: 'Raw BAV',          hintKey: 'ashtakavarga.reduction.rawHint',         hintFallback: 'unreduced bindu counts' },
    { key: 'trikona',     labelKey: 'ashtakavarga.reduction.trikona',     labelFallback: 'Trikona Shodhita', hintKey: 'ashtakavarga.reduction.trikonaHint',     hintFallback: 'trine min subtracted' },
    { key: 'ekadhipatya', labelKey: 'ashtakavarga.reduction.ekadhipatya', labelFallback: 'Ekadhipatya',      hintKey: 'ashtakavarga.reduction.ekadhipatyaHint', hintFallback: 'same-lord pair reduction' },
  ];
  return (
    <div className="rounded-2xl border border-vedicGold/40 bg-white p-5 shadow-sm space-y-2 text-xs">
      <h3 className="text-sm font-semibold text-vedicMaroon">{t('ashtakavarga.reductionTitle', 'Reduction')}</h3>
      {opts.map((o) => (
        <button key={o.key}
          onClick={() => onChange(o.key)}
          className={`w-full flex flex-col items-start px-3 py-2 rounded transition ${
            value === o.key
              ? 'bg-vedicMaroon text-white'
              : 'bg-vedicMaroon/5 text-vedicMaroon hover:bg-vedicMaroon/10'
          }`}>
          <span className="font-semibold">{t(o.labelKey, o.labelFallback)}</span>
          <span className={`text-[10px] ${value === o.key ? 'text-white/70' : 'text-vedicMaroon/60'}`}>
            {t(o.hintKey, o.hintFallback)}
          </span>
        </button>
      ))}
    </div>
  );
}

// Linear cream→maroon gradient. share: 0..1.
function heatColor(share: number): string {
  const s = Math.max(0, Math.min(1, share));
  // cream #fdf6e6 → maroon #7a1e1e
  const r = Math.round(253 + (122 - 253) * s);
  const g = Math.round(246 + (30  - 246) * s);
  const b = Math.round(230 + (30  - 230) * s);
  return `rgb(${r},${g},${b})`;
}

function SavHeatmap({ sav, t, al }: {
  sav: { points: number[]; total: number };
  t: (k: string, f?: string) => string;
  al: AstroTranslator;
}) {
  const max = Math.max(...sav.points, 1);
  const min = Math.min(...sav.points);
  const avg = Math.round(sav.total / 12);
  const title = t('ashtakavarga.savTitle', 'Sarvashtakavarga — {total} bindus · avg {avg}/sign')
    .replace('{total}', String(sav.total))
    .replace('{avg}', String(avg));
  return (
    <Card title={title}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('ashtakavarga.savDesc', 'Sum across all seven grahas. Highest-scoring signs channel transits most productively; lowest-scoring signs weaken them.')}
      </p>
      <div className="grid grid-cols-12 gap-1">
        {sav.points.map((v, i) => {
          const share = v / 48; // theoretical max per sign
          return (
            <div key={i}
              className="rounded px-1.5 py-2 text-center border border-vedicGold/30"
              style={{ background: heatColor(share) }}>
              <div className={`text-[9px] uppercase tracking-wider ${share > 0.55 ? 'text-white/80' : 'text-vedicMaroon/70'}`}>
                {al.rashiShort(i + 1)}
              </div>
              <div className={`text-sm font-semibold tabular-nums ${share > 0.55 ? 'text-white' : 'text-vedicMaroon'}`}>
                {v}
              </div>
              <div className={`text-[9px] ${share > 0.55 ? 'text-white/70' : 'text-vedicMaroon/50'}`}>
                {v === max ? t('ashtakavarga.savMax', '▲ max') : v === min ? t('ashtakavarga.savMin', '▼ min') : ' '}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function BavGrid({
  matrix, reduction, t, al,
}: {
  matrix: Record<PlanetId, BAV>;
  reduction: Reduction;
  t: (k: string, f?: string) => string;
  al: AstroTranslator;
}) {
  const grandTotal = REF_PLANETS.reduce((s, p) => s + matrix[p].total, 0);
  const title = t('ashtakavarga.bavTitle', 'Bhinnashtakavarga — {n} grahas × 12 signs · Σ {total}')
    .replace('{n}', String(REF_PLANETS.length))
    .replace('{total}', String(grandTotal));
  const range = reduction === 'raw'
    ? t('ashtakavarga.rangeRaw', 'range 48–55')
    : t('ashtakavarga.rangeReduced', 'post-reduction');
  const desc = t('ashtakavarga.bavDesc', "Per-graha bindus per sign. Max per planet per sign is 8. Row total shows the graha's overall strength across the zodiac ({range}).")
    .replace('{range}', range);
  return (
    <Card title={title}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {desc}
      </p>
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr className="text-vedicMaroon/70">
              <th className="py-1 pr-2 text-left font-semibold">{t('ashtakavarga.colGraha', 'Graha')}</th>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((signNum) => (
                <th key={signNum} className="px-1 font-mono text-[10px]">{al.rashiShort(signNum)}</th>
              ))}
              <th className="pl-2 text-right font-semibold">{t('ashtakavarga.colTotal', 'Σ')}</th>
            </tr>
          </thead>
          <tbody>
            {REF_PLANETS.map((p) => {
              const row = matrix[p];
              return (
                <tr key={p} className="border-t border-vedicGold/20">
                  <td className="py-1.5 pr-2 text-vedicMaroon font-semibold">{al.planet(p)}</td>
                  {row.points.map((v, i) => (
                    <td key={i} className="p-0.5">
                      <div
                        className={`text-center rounded tabular-nums ${
                          v / 8 > 0.6 ? 'text-white' : 'text-vedicMaroon'
                        }`}
                        style={{ background: heatColor(v / 8), padding: '3px 0', fontSize: 11 }}>
                        {v}
                      </div>
                    </td>
                  ))}
                  <td className="pl-2 text-right font-semibold tabular-nums text-vedicMaroon">
                    {row.total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
