// Classic-view dashboard — recreates the Parashara's Light single-screen
// layout. All five panels are fetched in parallel from the active chart so
// you never re-enter birth details:
//
//   ┌─────────────┬─────────────┐
//   │   D1 Lagna  │  D9 Navamsa │
//   │  (largest)  ├─────────────┤
//   │             │  Jaimini    │
//   │             │  karakas    │
//   ├──────┬──────┼─────────────┤
//   │ Dasha│Shadbal│ Planet     │
//   │ list │ bars  │ table      │
//   └──────┴──────┴─────────────┘
//
// The form on the right rail lets you switch charts in place — submit
// promotes the new chart to the active-chart store and every panel
// re-fetches.
//
// Pulls existing components (NorthIndianChart, PlanetTable, DashaTimeline)
// where possible; Jaimini + Shadbala panels are inline since they're tight.

import { useEffect, useMemo, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState } from '../components/ui/Card';
import { GaneshLoader } from '../components/ui/GaneshLoader';
import { NorthIndianChart } from '../components/charts/NorthIndianChart';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type {
  BirthInput, KundaliResult, DivisionalChart,
  VimshottariResult, ShadbalaResult, PlanetId,
} from '../types';

interface Bundle {
  kundali: KundaliResult;
  navamsa: DivisionalChart;
  dasha: VimshottariResult;
  shadbala: ShadbalaResult;
  jaimini: any;
}

export function ClassicViewPage() {
  const { t, al } = useT();
  const [bundle, setBundle]   = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  async function compute(input: BirthInput) {
    setLoading(true); setError(null);
    try {
      // Fan out — the five panels are independent and each endpoint is fast,
      // so parallel is a real win even on slow machines.
      const [k, d, dasha, sb, jai] = await Promise.all([
        api.calculate(input),
        api.divisional(input, ['D9']),
        api.vimshottari(input, true),
        api.shadbala(input),
        api.jaimini(input),
      ]);
      setBundle({
        kundali:  k.kundali,
        navamsa:  d.charts.D9,
        dasha:    dasha.vimshottari,
        shadbala: sb.shadbala,
        jaimini:  jai.jaimini,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <PageShell
      title={t('classic.title', 'Classic View — All-in-One')}
      subtitle={t('classic.subtitle', 'Lagna · Navamsa · Vimshottari · Shadbala · Jaimini Karakas — single screen')}
    >
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <main className="min-w-0">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {!bundle && !loading && !error && (
            <EmptyState>{t('classic.empty', 'Enter birth details on the right to see the full classical layout.')}</EmptyState>
          )}
          {loading && <GaneshLoader size="md" message={t('classic.computing', 'Computing all panels…')} />}
          {bundle && <ClassicGrid b={bundle} />}
        </main>

        <aside className="xl:sticky xl:top-[72px] xl:self-start">
          <BirthDetailsForm onSubmit={compute} loading={loading} />
        </aside>
      </div>
    </PageShell>
  );

  // (al/t are exposed via closure to grid panels declared below.)
  function ClassicGrid({ b }: { b: Bundle }) {
    return (
      <div className="grid grid-cols-12 gap-3">
        {/* Top-left: D1 Lagna chart — largest panel, spans 7 cols × 2 rows */}
        <Card title={chartTitle('janma', b.kundali)}
              className="col-span-12 lg:col-span-7 lg:row-span-2">
          <NorthIndianChart kundali={b.kundali} className="w-full" />
        </Card>

        {/* Top-right top: D9 Navamsa */}
        <Card title={t('classic.navamsa', 'Navamsa (D9) — Spouse / 2nd half of life')}
              className="col-span-12 lg:col-span-5">
          <NavamsaChart d9={b.navamsa} ascRashi={b.kundali.ascendant.rashi.num} />
        </Card>

        {/* Top-right bottom: Jaimini Karakas */}
        <Card title={t('classic.jaimini', 'Jaimini Karakas')}
              className="col-span-12 lg:col-span-5">
          <JaiminiPanel jaimini={b.jaimini} />
        </Card>

        {/* Bottom row: Vimshottari · Shadbala · Planet table */}
        <Card title={t('classic.vimshottari', 'Vimshottari Dasha')}
              className="col-span-12 md:col-span-6 lg:col-span-4">
          <DashaList dasha={b.dasha} />
        </Card>

        <Card title={t('classic.shadbala', 'Shadbala (Rupas)')}
              className="col-span-12 md:col-span-6 lg:col-span-4">
          <ShadbalaBars sb={b.shadbala} />
        </Card>

        <Card title={t('classic.planets', 'Janma Kundali — Planets')}
              className="col-span-12 lg:col-span-4">
          <PlanetMini kundali={b.kundali} />
        </Card>
      </div>
    );
  }

  function chartTitle(_key: string, k: KundaliResult): string {
    const dt  = (k.input?.datetime ?? '').slice(0, 16).replace('T', ' ');
    const loc = k.input?.placeName ?? '';
    return t('classic.lagna', 'Janma Kundali (Lagna · D1)') + (dt ? ` — ${dt}${loc ? ' · ' + loc : ''}` : '');
  }

  // ─── Sub-panels ──────────────────────────────────────────────────────────

  // Adapter: render a divisional chart as a North-Indian diamond by mapping
  // it into the minimal fields NorthIndianChart consumes from KundaliResult.
  function NavamsaChart({ d9, ascRashi }: { d9: DivisionalChart; ascRashi: number }) {
    const fauxKundali = useMemo<KundaliResult>(() => ({
      input: {} as any,
      utc: '',
      ayanamsa: { name: 'lahiri', valueDeg: 0 },
      ascendant: {
        longitude: 0,
        rashi: { num: d9.ascendantRashi, name: d9.ascendantRashiName, nameHi: '', degInRashi: 0 } as any,
        nakshatra: { num: 0, name: '', lord: 'SU' as PlanetId, pada: 1 } as any,
      } as any,
      planets: d9.positions.map((p) => {
        // Dignity enum: 'Exalted' | 'Debilitated' | 'OwnSign' | ''
        const dig = (p.dignity ?? '') as string;
        return {
          id: p.id,
          name: p.name,
          nameHi: '',
          longitude: 0,
          speed: 0,
          retrograde: false,
          rashi: { num: p.rashi, name: p.rashiName, nameHi: p.rashiNameHi, degInRashi: 0 } as any,
          nakshatra: { num: 0, name: '', lord: 'SU' as PlanetId, pada: 1 } as any,
          house: p.house,
          exalted: dig === 'Exalted',
          debilitated: dig === 'Debilitated',
          combust: false,
          ownSign: dig === 'OwnSign',
        };
      }) as any,
      houses: [],
    } as any), [d9]);
    return <NorthIndianChart kundali={fauxKundali} className="w-full max-w-[280px] mx-auto" />;
  }

  function DashaList({ dasha }: { dasha: VimshottariResult }) {
    // Find the running mahadasha and show the next ~10 antardashas around it
    const now = Date.now();
    const rows: { label: string; start: string; active: boolean }[] = [];
    for (const md of dasha.mahadashas) {
      const mdActive = Date.parse(md.start) <= now && now < Date.parse(md.end);
      const ads = md.antardashas ?? [];
      // If this is the running mahadasha, list its antardashas; otherwise just the maha
      if (mdActive && ads.length > 0) {
        for (const ad of ads) {
          const adActive = Date.parse(ad.start) <= now && now < Date.parse(ad.end);
          rows.push({
            label: `${al.planet(md.lord)}–${al.planet(ad.lord)}`,
            start: ad.start.slice(0, 10),
            active: adActive,
          });
        }
      } else {
        rows.push({
          label: `${al.planet(md.lord)} (${md.years.toFixed(1)}y)`,
          start: md.start.slice(0, 10),
          active: mdActive,
        });
      }
    }
    return (
      <div className="text-[11px] font-mono max-h-[260px] overflow-auto">
        {rows.map((r, i) => (
          <div key={i}
            className={`flex justify-between py-0.5 border-b border-vedicGold/10
              ${r.active ? 'bg-vedicGold/15 font-bold text-vedicMaroon' : 'text-vedicMaroon/80'}`}>
            <span className="truncate pr-2">{r.label}</span>
            <span className="opacity-70 tabular-nums">{r.start}</span>
          </div>
        ))}
      </div>
    );
  }

  function ShadbalaBars({ sb }: { sb: ShadbalaResult }) {
    const max = Math.max(...sb.planets.map((p) => p.totalRupas), 8);
    return (
      <div className="space-y-1.5">
        {sb.planets.map((p) => {
          const pct = Math.min(100, (p.totalRupas / max) * 100);
          const tone =
            p.category === 'very strong' ? 'bg-emerald-600'
            : p.category === 'strong' ? 'bg-emerald-500'
            : p.category === 'moderate' ? 'bg-amber-500'
            : 'bg-red-500';
          return (
            <div key={p.planet} className="flex items-center gap-2 text-[11px]">
              <span className="w-10 font-semibold text-vedicMaroon">{al.planet(p.planet)}</span>
              <div className="flex-1 h-3 bg-vedicGold/10 rounded relative overflow-hidden">
                <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
                <span className="absolute inset-0 flex items-center justify-end pr-1 font-mono text-[10px] text-vedicMaroon/80">
                  {p.totalRupas.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
        <div className="text-[10px] text-vedicMaroon/60 pt-1 flex justify-between">
          <span>{t('classic.strongest', 'Strongest:')} <b>{al.planet(sb.strongest as PlanetId)}</b></span>
          <span>{t('classic.weakest', 'Weakest:')} <b>{al.planet(sb.weakest as PlanetId)}</b></span>
        </div>
      </div>
    );
  }

  function JaiminiPanel({ jaimini }: { jaimini: any }) {
    // Server returns { karakas: [{ karaka: 'AK', fullName, planet, meaning, degInRashi }, ...] }.
    const list = Array.isArray(jaimini?.karakas) ? jaimini.karakas : [];
    return (
      <table className="w-full text-[11px]">
        <thead>
          <tr className="text-vedicMaroon/60">
            <th className="text-left py-0.5">{t('classic.code', 'Code')}</th>
            <th className="text-left">{t('classic.role', 'Role')}</th>
            <th className="text-left">{t('classic.planet', 'Planet')}</th>
            <th className="text-left">{t('classic.meaning', 'Meaning')}</th>
          </tr>
        </thead>
        <tbody>
          {list.map((row: any) => (
            <tr key={row.karaka} className="border-t border-vedicGold/10">
              <td className="py-0.5 font-mono text-vedicMaroon/70">{row.karaka}</td>
              <td className="font-medium text-vedicMaroon/80">{row.fullName ?? ''}</td>
              <td className="font-semibold text-vedicMaroon">
                {row.planet ? al.planet(row.planet as PlanetId) : '—'}
              </td>
              <td className="text-vedicMaroon/60 text-[10px]">{row.meaning ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  function PlanetMini({ kundali }: { kundali: KundaliResult }) {
    return (
      <div className="text-[11px] max-h-[260px] overflow-auto">
        <table className="w-full">
          <thead>
            <tr className="text-vedicMaroon/60">
              <th className="text-left py-0.5">{t('classic.col.body', 'Body')}</th>
              <th className="text-left">{t('classic.col.deg', 'Deg')}</th>
              <th className="text-left">{t('classic.col.rashi', 'Rashi')}</th>
              <th className="text-left">{t('classic.col.nak', 'Nakshatra')}</th>
              <th className="text-left">{t('classic.col.pada', 'Pd')}</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-vedicGold/10 bg-vedicCream/40">
              <td className="py-0.5 font-bold text-vedicMaroon">{t('classic.lagna_short', 'Lg')}</td>
              <td className="font-mono">{fmtDeg(kundali.ascendant.rashi.degInRashi)}</td>
              <td>{al.rashiByName(kundali.ascendant.rashi.name)}</td>
              <td className="truncate max-w-[120px]">{al.nakshatra(kundali.ascendant.nakshatra.num)}</td>
              <td>{kundali.ascendant.nakshatra.pada}</td>
            </tr>
            {kundali.planets.map((p) => (
              <tr key={p.id} className="border-t border-vedicGold/10">
                <td className="py-0.5 font-semibold text-vedicMaroon">{al.planet(p.id)}</td>
                <td className="font-mono">{fmtDeg(p.rashi.degInRashi)}{p.retrograde ? 'ᴿ' : ''}</td>
                <td>{al.rashiByName(p.rashi.name)}</td>
                <td className="truncate max-w-[120px]">{al.nakshatra(p.nakshatra.num)}</td>
                <td>{p.nakshatra.pada}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

// Format a fractional rashi-degree as DD°MM' for compact display.
function fmtDeg(d: number): string {
  const deg = Math.floor(d);
  const min = Math.floor((d - deg) * 60);
  return `${String(deg).padStart(2, '0')}°${String(min).padStart(2, '0')}'`;
}

// Re-export under a default for matching the import style elsewhere.
export default ClassicViewPage;
