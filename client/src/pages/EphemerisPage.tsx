// Phase 16 — Ephemeris (tabular + graphical).
//
// For a start date and day count, the server returns:
//   • GET /api/ephemeris           → daily longitudes, sign, retrograde flag
//   • GET /api/ephemeris/graphical → one series per planet (x=day index, y=lon°)
//
// Panels:
//   1. Controls: start date + days stepper + planet toggles
//   2. Graphical SVG: 9 polylines (one per planet) over 12 zodiac bands,
//      with retrograde samples dotted
//   3. Daily table: scrollable, each row is a day, columns are planets
//      (sign + degree + R̲ when retrograde)

import { useEffect, useMemo, useState } from 'react';
import { Card, PageShell, ErrorBanner, EmptyState } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { AstroTranslator } from '../i18n/astro-labels';
import type {
  EphemerisRow, GraphicalEphemerisSeries, PlanetId,
} from '../types';

const PLANETS: { id: PlanetId; color: string }[] = [
  { id: 'SU', color: '#d97706' },
  { id: 'MO', color: '#64748b' },
  { id: 'MA', color: '#dc2626' },
  { id: 'ME', color: '#059669' },
  { id: 'JU', color: '#ca8a04' },
  { id: 'VE', color: '#db2777' },
  { id: 'SA', color: '#1e3a8a' },
  { id: 'RA', color: '#4c1d95' },
  { id: 'KE', color: '#6b7280' },
];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function EphemerisPage() {
  const { t, al } = useT();
  const [startDate, setStartDate] = useState(todayISO());
  const [days, setDays] = useState(30);
  const [rows, setRows] = useState<EphemerisRow[]>([]);
  const [series, setSeries] = useState<GraphicalEphemerisSeries[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<Set<PlanetId>>(
    new Set(PLANETS.map((p) => p.id)),
  );

  async function run(d: string, n: number) {
    setLoading(true); setError(null);
    try {
      const startISO = new Date(d + 'T00:00:00Z').toISOString();
      const [tab, gr] = await Promise.all([
        api.ephemeris(startISO, n),
        api.graphicalEphemeris(startISO, n),
      ]);
      setRows(tab.ephemeris);
      setSeries(gr.series);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  useEffect(() => { run(startDate, days); /* eslint-disable-next-line */ }, []);

  function toggle(id: PlanetId) {
    const next = new Set(active);
    if (next.has(id)) next.delete(id); else next.add(id);
    setActive(next);
  }

  return (
    <PageShell
      title={t('ephemeris.title', 'Ephemeris')}
      subtitle={t('ephemeris.subtitle', 'Daily sidereal longitudes for the nine grahas — tabular and graphical.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="space-y-4">
          <ControlsCard
            startDate={startDate} days={days} loading={loading}
            onStartDate={(d) => { setStartDate(d); run(d, days); }}
            onDays={(n) => { setDays(n); run(startDate, n); }}
            t={t}
          />
          <PlanetsCard active={active} onToggle={toggle} t={t} al={al} />
        </aside>

        <main className="space-y-6">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {loading && <EmptyState>{t('ephemeris.loading', 'Walking the ephemeris…')}</EmptyState>}
          {!loading && rows.length === 0 && !error && (
            <EmptyState>{t('ephemeris.empty', 'No ephemeris data yet.')}</EmptyState>
          )}

          {series.length > 0 && (
            <>
              <GraphicalChart series={series} active={active} days={days} startDate={startDate} t={t} al={al} />
              <DailyTable rows={rows} active={active} t={t} al={al} />
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

function ControlsCard({
  startDate, days, loading, onStartDate, onDays, t,
}: {
  startDate: string; days: number; loading: boolean;
  onStartDate: (d: string) => void; onDays: (n: number) => void;
  t: (k: string, f?: string) => string;
}) {
  return (
    <div className="rounded-2xl border border-vedicGold/40 bg-white p-5 shadow-sm space-y-3 text-xs">
      <h3 className="text-sm font-semibold text-vedicMaroon">{t('ephemeris.range', 'Range')}</h3>
      <label className="block">
        <span className="block mb-1 text-vedicMaroon/70">{t('ephemeris.startDate', 'Start date')}</span>
        <input
          type="date" value={startDate} disabled={loading}
          onChange={(e) => onStartDate(e.target.value)}
          className="w-full rounded-md border border-vedicGold/40 bg-white px-2 py-1.5 tabular-nums"
        />
      </label>
      <div>
        <span className="block mb-1 text-vedicMaroon/70">{t('ephemeris.days', 'Days ({n})').replace('{n}', String(days))}</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDays(Math.max(1, days - 30))}
            disabled={loading || days <= 1}
            className="w-8 h-8 rounded border border-vedicMaroon/30 text-vedicMaroon hover:bg-vedicMaroon/5 disabled:opacity-30"
          >−</button>
          <input
            type="number" min={1} max={366} step={1}
            value={days} disabled={loading}
            onChange={(e) => onDays(Math.max(1, Math.min(366, Number(e.target.value))))}
            className="flex-1 text-center rounded-md border border-vedicGold/40 bg-white px-2 py-1 tabular-nums"
          />
          <button
            onClick={() => onDays(Math.min(366, days + 30))}
            disabled={loading || days >= 366}
            className="w-8 h-8 rounded border border-vedicMaroon/30 text-vedicMaroon hover:bg-vedicMaroon/5 disabled:opacity-30"
          >+</button>
        </div>
        <p className="text-[10px] text-vedicMaroon/60 italic mt-1">{t('ephemeris.maxNote', 'Up to 366 days per request.')}</p>
      </div>
    </div>
  );
}

function PlanetsCard({
  active, onToggle, t, al,
}: {
  active: Set<PlanetId>;
  onToggle: (id: PlanetId) => void;
  t: (k: string, f?: string) => string;
  al: AstroTranslator;
}) {
  return (
    <div className="rounded-2xl border border-vedicGold/40 bg-white p-5 shadow-sm space-y-1 text-xs">
      <h3 className="text-sm font-semibold text-vedicMaroon mb-2">{t('ephemeris.planets', 'Planets')}</h3>
      {PLANETS.map((p) => {
        const on = active.has(p.id);
        return (
          <button key={p.id} onClick={() => onToggle(p.id)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded transition
              ${on ? 'bg-vedicMaroon/5' : 'opacity-40 hover:opacity-70'}`}>
            <span className="w-3 h-3 rounded" style={{ background: p.color }} />
            <span className="flex-1 text-left text-vedicMaroon">{al.planet(p.id)}</span>
            <span className="font-mono text-vedicMaroon/50">{p.id}</span>
          </button>
        );
      })}
    </div>
  );
}

// Break a planet's series into unbroken segments at 360°→0° wraps so the
// polyline doesn't draw a diagonal across the whole viewbox.
function segmentSeries(points: { x: number; y: number; retrograde: boolean }[]) {
  const segs: typeof points[] = [];
  let cur: typeof points = [];
  for (let i = 0; i < points.length; i++) {
    if (i > 0 && Math.abs(points[i].y - points[i - 1].y) > 180) {
      if (cur.length) segs.push(cur);
      cur = [];
    }
    cur.push(points[i]);
  }
  if (cur.length) segs.push(cur);
  return segs;
}

function GraphicalChart({
  series, active, days, startDate, t, al,
}: {
  series: GraphicalEphemerisSeries[]; active: Set<PlanetId>;
  days: number; startDate: string;
  t: (k: string, f?: string) => string;
  al: AstroTranslator;
}) {
  const W = 600; const H = 300;
  const padL = 32; const padR = 8; const padT = 8; const padB = 22;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const xOf = (x: number) => padL + (x / Math.max(1, days - 1)) * plotW;
  const yOf = (y: number) => padT + (1 - y / 360) * plotH;

  const tickIdxs = useMemo(() => {
    const n = Math.min(6, days);
    const step = Math.max(1, Math.floor(days / n));
    const out: number[] = [];
    for (let i = 0; i < days; i += step) out.push(i);
    if (out[out.length - 1] !== days - 1) out.push(days - 1);
    return out;
  }, [days]);

  const dateForIdx = (i: number) => {
    const d = new Date(startDate + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + i);
    return d.toISOString().slice(5, 10);
  };

  const shown = series.filter((s) => active.has(s.planet));

  const graphTitle = t('ephemeris.graphTitle', 'Graphical ephemeris — {n} day{s} from {date}')
    .replace('{n}', String(days))
    .replace('{s}', days === 1 ? '' : 's')
    .replace('{date}', startDate);

  return (
    <Card title={graphTitle}>
      <p className="text-[11px] text-vedicMaroon/60 mb-2">
        {t('ephemeris.graphDesc', 'Longitude (0–360°) per planet across the window. Dotted samples mark retrograde days. The 12 horizontal bands are the sidereal signs; wraps at 360°→0° break the line.')}
      </p>
      <div className="relative w-full" style={{ aspectRatio: `${W} / ${H}` }}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full">
          {/* Sign bands + labels */}
          {Array.from({ length: 12 }, (_, i) => i + 1).map((signNum) => {
            const i = signNum - 1;
            const y0 = yOf((i + 1) * 30);
            const y1 = yOf(i * 30);
            return (
              <g key={signNum}>
                <rect x={padL} y={y0} width={plotW} height={y1 - y0}
                  fill={i % 2 === 0 ? '#fdf6e6' : '#faeecd'} />
                <text x={padL - 4} y={(y0 + y1) / 2 + 3} textAnchor="end"
                  fontSize="8" fill="#7a1e1e" opacity="0.6">{al.rashiShort(signNum)}</text>
                <line x1={padL} x2={W - padR} y1={y1} y2={y1}
                  stroke="#caa25b" strokeWidth="0.3" opacity="0.5" />
              </g>
            );
          })}

          {/* X-axis date ticks */}
          {tickIdxs.map((i) => (
            <g key={i}>
              <line x1={xOf(i)} x2={xOf(i)} y1={padT} y2={H - padB}
                stroke="#caa25b" strokeWidth="0.2" opacity="0.4" />
              <text x={xOf(i)} y={H - padB + 12} textAnchor="middle"
                fontSize="8" fill="#7a1e1e" opacity="0.7">{dateForIdx(i)}</text>
            </g>
          ))}

          {/* Planet lines */}
          {shown.map((s) => {
            const color = PLANETS.find((p) => p.id === s.planet)!.color;
            const segs = segmentSeries(s.points);
            return (
              <g key={s.planet}>
                {segs.map((seg, i) => (
                  <polyline key={i}
                    fill="none" stroke={color} strokeWidth="1.2"
                    points={seg.map((pt) => `${xOf(pt.x)},${yOf(pt.y)}`).join(' ')}
                  />
                ))}
                {s.points.filter((p) => p.retrograde).map((p, i) => (
                  <circle key={i} cx={xOf(p.x)} cy={yOf(p.y)}
                    r="1.8" fill={color} stroke="white" strokeWidth="0.5">
                    <title>{t('ephemeris.retroTitle', '{p} retrograde · day {x} · {y}°')
                      .replace('{p}', al.planet(s.planet))
                      .replace('{x}', String(p.x))
                      .replace('{y}', p.y.toFixed(2))}</title>
                  </circle>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
    </Card>
  );
}

function DailyTable({
  rows, active, t, al,
}: {
  rows: EphemerisRow[]; active: Set<PlanetId>;
  t: (k: string, f?: string) => string;
  al: AstroTranslator;
}) {
  const shownPlanets = PLANETS.filter((p) => active.has(p.id));
  const tableTitle = t('ephemeris.tableTitle', 'Daily table — {n} row{s}')
    .replace('{n}', String(rows.length))
    .replace('{s}', rows.length === 1 ? '' : 's');
  return (
    <Card title={tableTitle}>
      <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white shadow-[0_1px_0_rgba(202,162,91,0.4)]">
            <tr className="text-left text-vedicMaroon/70 border-b border-vedicGold/30">
              <th className="py-1.5 pr-2">{t('ephemeris.colDate', 'Date')}</th>
              {shownPlanets.map((p) => (
                <th key={p.id} className="pr-2">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    {al.planet(p.id)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-vedicGold/10">
                <td className="py-1 pr-2 tabular-nums text-vedicMaroon/80">
                  {r.date.slice(0, 10)}
                </td>
                {shownPlanets.map((p) => {
                  const pos = r.positions[p.id];
                  if (!pos) return <td key={p.id} className="pr-2 text-vedicMaroon/40">—</td>;
                  const deg = pos.longitude - (pos.signNum - 1) * 30;
                  return (
                    <td key={p.id} className="pr-2 tabular-nums">
                      <span className="text-vedicMaroon">{al.rashiShort(pos.signNum)}</span>
                      <span className="text-vedicMaroon/60 ml-1">{deg.toFixed(2)}°</span>
                      {pos.retrograde && (
                        <span className="ml-1 inline-block px-1 rounded bg-red-100 text-red-700 text-[9px] font-semibold">{t('ephemeris.retroFlag', 'R')}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
