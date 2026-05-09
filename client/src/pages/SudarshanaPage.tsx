// Phase 15 — Sudarshana Chakra + Avasthas.
//
// Sudarshana Chakra reads the chart from three reference points at once:
// Lagna, Moon, Sun. Each gives a 12-house ring; all three share the same
// planets but position them differently. Sudarshana Dasha cycles 12 years
// per ring × 3 rings = 36-year lifespan grid.
//
// Avasthas are three classical state systems applied per planet:
//   Baladi (age) · Jagradadi (sleep) · Deeptadi (mood).
//
// Panels:
//   1. Birth form
//   2. 3-ring concentric SVG chakra (Lagna outer, Moon middle, Sun inner)
//   3. Sudarshana Dasha table (36-year grid, current year highlighted)
//   4. Avastha table (per-planet 3-column states with legend)

import { useMemo, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { AstroTranslator } from '../i18n/astro-labels';
import type {
  BirthInput, SudarshanaResult, AvasthaEntry,
  SudarshanaRing, SudarshanaReference,
  BaladiState, JagradadiState, DeeptadiState,
} from '../types';

const RING_COLORS: Record<SudarshanaReference, { stroke: string; fill: string }> = {
  Lagna: { stroke: '#7a1e1e', fill: '#fdf6e6' },
  Moon:  { stroke: '#4f46e5', fill: '#eef2ff' },
  Sun:   { stroke: '#d97706', fill: '#fef3c7' },
};

export function SudarshanaPage() {
  const { t, al } = useT();
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [sudarshana, setSudarshana] = useState<SudarshanaResult | null>(null);
  const [avasthas, setAvasthas] = useState<AvasthaEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(input: BirthInput) {
    setBirth(input);
    setLoading(true); setError(null);
    try {
      const [s, a] = await Promise.all([
        api.sudarshana(input), api.avasthas(input),
      ]);
      setSudarshana(s.sudarshana);
      setAvasthas(a.avasthas);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  const currentYear = useMemo(() => {
    if (!birth) return null;
    const ms = Date.now() - new Date(birth.datetime).getTime();
    return Math.max(1, Math.floor(ms / (365.25 * 86400 * 1000)) + 1);
  }, [birth]);

  const ringLabels: Record<SudarshanaReference, string> = {
    Lagna: t('sudarshana.ringLagna', 'Lagna (outer)'),
    Moon:  t('sudarshana.ringMoon', 'Moon (middle)'),
    Sun:   t('sudarshana.ringSun', 'Sun (inner)'),
  };

  return (
    <PageShell
      title={t('sudarshana.title', 'Sudarshana & Avasthas')}
      subtitle={t('sudarshana.subtitle', 'Three-reference chart reading: rings from Lagna, Moon, Sun · 36-year dasha · classical planetary states.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
        </aside>

        <main className="space-y-6">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {!sudarshana && !loading && !error && (
            <EmptyState>{t('sudarshana.empty', 'Enter birth details to compute the three-ring chakra and state tables.')}</EmptyState>
          )}
          {loading && <EmptyState>{t('sudarshana.loading', 'Building chakra rings…')}</EmptyState>}

          {sudarshana && (
            <>
              <ChakraPanel sudarshana={sudarshana} t={t} al={al} ringLabels={ringLabels} />
              <DashaGridPanel sudarshana={sudarshana} currentYear={currentYear} t={t} al={al} />
              {avasthas.length > 0 && <AvasthaPanel entries={avasthas} t={t} al={al} />}
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

// ─── Concentric 3-ring chakra ────────────────────────────────────────────────

function ChakraPanel({ sudarshana, t, al, ringLabels }: {
  sudarshana: SudarshanaResult;
  t: (k: string, f?: string) => string;
  al: AstroTranslator;
  ringLabels: Record<SudarshanaReference, string>;
}) {
  return (
    <Card title={t('sudarshana.chakraTitle', 'Sudarshana Chakra — three concentric rings, one per reference point')}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('sudarshana.chakraDesc', 'Each ring is 12 houses counted from its reference sign. Planets sit in the same sign regardless of ring, so the house-number shifts per reference. This is the classical way to read a chart from Lagna, Moon, and Sun simultaneously.')}
      </p>
      <div className="flex justify-center">
        <SudarshanaSVG rings={sudarshana.rings} t={t} al={al} />
      </div>
      <div className="flex flex-wrap gap-4 justify-center mt-3 text-[11px]">
        {sudarshana.rings.map((r) => (
          <span key={r.reference} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: RING_COLORS[r.reference].fill,
              border: `1.5px solid ${RING_COLORS[r.reference].stroke}` }} />
            <span className="text-vedicMaroon">{ringLabels[r.reference]}</span>
            <span className="text-vedicMaroon/60">· {al.rashiShort(r.refSignNum)}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}

function SudarshanaSVG({ rings, t, al }: {
  rings: SudarshanaRing[];
  t: (k: string, f?: string) => string;
  al: AstroTranslator;
}) {
  const cx = 220, cy = 220;
  const radii = [200, 140, 80]; // outer → middle → inner radii
  const labelR = [210, 150, 90];
  const innerR = [160, 100, 40]; // inner boundary of each ring
  // Cell N is the slice from angle (N-1)*30 to N*30, starting at 12 o'clock, going clockwise.
  const cellCenterAngle = (h: number) => ((h - 1) * 30 + 15 - 90) * (Math.PI / 180);

  function arcPath(rOut: number, rIn: number, aStart: number, aEnd: number) {
    const largeArc = aEnd - aStart > Math.PI ? 1 : 0;
    const x1 = cx + rOut * Math.cos(aStart), y1 = cy + rOut * Math.sin(aStart);
    const x2 = cx + rOut * Math.cos(aEnd),   y2 = cy + rOut * Math.sin(aEnd);
    const x3 = cx + rIn  * Math.cos(aEnd),   y3 = cy + rIn  * Math.sin(aEnd);
    const x4 = cx + rIn  * Math.cos(aStart), y4 = cy + rIn  * Math.sin(aStart);
    return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  }

  return (
    <svg viewBox="0 0 440 440" className="max-w-full" style={{ width: 440, height: 440 }}>
      {rings.map((ring, ri) => (
        <g key={ring.reference}>
          {ring.cells.map((cell) => {
            const aStart = ((cell.house - 1) * 30 - 90) * (Math.PI / 180);
            const aEnd   = ((cell.house)     * 30 - 90) * (Math.PI / 180);
            const style = RING_COLORS[ring.reference];
            return (
              <path key={`${ring.reference}-${cell.house}`}
                d={arcPath(radii[ri], innerR[ri], aStart, aEnd)}
                fill={style.fill} stroke={style.stroke} strokeWidth="1"
                opacity="0.9">
                <title>
                  {`${ring.reference} ring · H${cell.house} · ${cell.signName}${cell.planets.length ? ` · ${cell.planets.join(', ')}` : ''}`}
                </title>
              </path>
            );
          })}
          {ring.cells.map((cell) => {
            const a = cellCenterAngle(cell.house);
            const lx = cx + labelR[ri] * Math.cos(a);
            const ly = cy + labelR[ri] * Math.sin(a);
            const rMid = (radii[ri] + innerR[ri]) / 2;
            const mx = cx + rMid * Math.cos(a);
            const my = cy + rMid * Math.sin(a);
            return (
              <g key={`${ring.reference}-${cell.house}-lbl`}>
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                  fontSize={ri === 0 ? 11 : 10} fontWeight="bold"
                  fill={RING_COLORS[ring.reference].stroke}>
                  {cell.house}
                </text>
                {cell.planets.length > 0 && (
                  <text x={mx} y={my} textAnchor="middle" dominantBaseline="middle"
                    fontSize={9} fill="#111" fontWeight="600">
                    {cell.planets.map((p) => al.planetShort(p)).join(',')}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      ))}
      <circle cx={cx} cy={cy} r="24" fill="#fff7d6" stroke="#7a1e1e" strokeWidth="1.5" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
        fontSize="10" fontWeight="bold" fill="#7a1e1e">{t('sudarshana.centerLabel', 'Sudarshana')}</text>
    </svg>
  );
}

// ─── Sudarshana Dasha 36-year grid ───────────────────────────────────────────

function DashaGridPanel({
  sudarshana, currentYear, t, al,
}: {
  sudarshana: SudarshanaResult;
  currentYear: number | null;
  t: (k: string, f?: string) => string;
  al: AstroTranslator;
}) {
  return (
    <Card title={t('sudarshana.dashaTitle', 'Sudarshana Dasha — 36-year grid (3 rings × 12 houses)')}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('sudarshana.dashaDesc', 'One year per house. Year 1–12 runs the Lagna ring, 13–24 the Moon ring, 25–36 the Sun ring.')}
        {currentYear && currentYear <= 36 && <> {t('sudarshana.currentYear', 'Current year {n} is highlighted.').replace('{n}', String(currentYear))}</>}
        {currentYear && currentYear > 36 && <> {t('sudarshana.pastCycle', 'Native is past the 36-year cycle ({n}y); cycle repeats.').replace('{n}', String(currentYear))}</>}
      </p>
      <div className="grid grid-cols-12 gap-1 text-[10px]">
        {sudarshana.dasha.map((d) => {
          const style = RING_COLORS[d.ring];
          const isCurrent = currentYear != null && ((currentYear - 1) % 36) + 1 === d.year;
          return (
            <div key={d.year}
              className={`rounded p-1.5 text-center border ${isCurrent ? 'ring-2 ring-amber-400' : ''}`}
              style={{ background: style.fill, borderColor: style.stroke }}
              title={`${d.year} · ${d.ring} H${d.house} · ${al.rashiShort(d.signNum)}`}>
              <div className="font-bold tabular-nums" style={{ color: style.stroke }}>{d.year}</div>
              <div className="text-[9px] opacity-70">H{d.house}</div>
              <div className="text-[9px] text-vedicMaroon/70">{al.rashiShort(d.signNum)}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Avasthas ───────────────────────────────────────────────────────────────

const BALADI_TONE: Record<BaladiState, 'good' | 'warn' | 'bad' | 'neutral' | 'info'> = {
  Bala: 'info', Kumara: 'neutral', Yuva: 'good', Vriddha: 'warn', Mrita: 'bad',
};
const JAGRADADI_TONE: Record<JagradadiState, 'good' | 'warn' | 'neutral'> = {
  Jagrat: 'good', Swapna: 'warn', Sushupti: 'neutral',
};
const DEEPTADI_TONE: Record<DeeptadiState, 'good' | 'warn' | 'bad' | 'neutral' | 'info'> = {
  Deepta: 'good', Swastha: 'good', Mudita: 'info', Shanta: 'neutral',
  Deena: 'warn', Vikala: 'warn', Dukhita: 'bad', Khala: 'bad',
};

function AvasthaPanel({ entries, t, al }: {
  entries: AvasthaEntry[];
  t: (k: string, f?: string) => string;
  al: AstroTranslator;
}) {
  return (
    <Card title={t('sudarshana.avasthaTitle', 'Avasthas — {n} planets · three classical state systems').replace('{n}', String(entries.length))}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('sudarshana.avasthaDesc', 'Baladi (age-slot by degree): Bala → Kumara → Yuva → Vriddha → Mrita. Jagradadi (wakefulness by sign-lord friendship): Jagrat → Swapna → Sushupti. Deeptadi (mood by dignity): Deepta → Swastha → Mudita → Shanta → Deena → Vikala → Dukhita → Khala. Rahu and Ketu are omitted.')}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
              <th className="py-1">{t('sudarshana.colPlanet', 'Planet')}</th>
              <th>{t('sudarshana.colBaladi', 'Baladi (age)')}</th>
              <th>{t('sudarshana.colJagradadi', 'Jagradadi (sleep)')}</th>
              <th>{t('sudarshana.colDeeptadi', 'Deeptadi (mood)')}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.planet} className="border-b border-vedicGold/10">
                <td className="py-1 font-bold text-vedicMaroon">{al.planet(e.planet)}</td>
                <td><Pill tone={BALADI_TONE[e.baladi]}>{al.baladi(e.baladi)}</Pill></td>
                <td><Pill tone={JAGRADADI_TONE[e.jagradadi]}>{al.jagradadi(e.jagradadi)}</Pill></td>
                <td><Pill tone={DEEPTADI_TONE[e.deeptadi]}>{al.deeptadi(e.deeptadi)}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
