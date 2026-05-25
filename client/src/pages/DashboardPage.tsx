import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { NorthIndianChart } from '../components/charts/NorthIndianChart';
import { Card, PageShell, Pill, ErrorBanner } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type {
  BirthInput, KundaliResult, VimshottariResult, ShadbalaResult, DivisionalChart
} from '../types';

export function DashboardPage() {
  const { t, al } = useT();
  const navigate = useNavigate();
  const [kundali, setKundali] = useState<KundaliResult | null>(null);
  const [navamsha, setNavamsha] = useState<DivisionalChart | null>(null);
  const [gochar, setGochar] = useState<KundaliResult | null>(null);
  const [prashna, setPrashna] = useState<KundaliResult | null>(null);
  const [vim, setVim] = useState<VimshottariResult | null>(null);
  const [shad, setShad] = useState<ShadbalaResult | null>(null);
  const [jaimini, setJaimini] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(input: BirthInput) {
    setLoading(true); setError(null);
    setKundali(null); setNavamsha(null); setGochar(null); setPrashna(null);
    setVim(null); setShad(null); setJaimini(null);

    try {
      const todayISO = new Date().toISOString();
      const [k, d, v, s, j, g, p] = await Promise.all([
        api.calculate(input),
        api.divisional(input, ['D9']),
        api.vimshottari(input, true),
        api.shadbala(input),
        api.jaimini(input),
        api.calculate({ ...input, datetime: todayISO }),
        api.prashna({ lat: input.lat, lng: input.lng })
      ]);
      setKundali(k.kundali);
      setNavamsha(d.charts.D9);
      setVim(v.vimshottari);
      setShad(s.shadbala);
      setJaimini(j.jaimini);
      setGochar(g.kundali);
      setPrashna(p.prashna.chart);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  // Adapter for DivisionalChart to NorthIndianChart
  const renderDivisionalChart = (chart: DivisionalChart) => {
    const fakeKundali = {
      ascendant: { rashi: { num: chart.ascendantRashi } },
      planets: chart.positions.map(p => ({
        id: p.id, house: p.house, retrograde: false
      }))
    } as any;
    return <NorthIndianChart kundali={fakeKundali} />;
  };

  return (
    <PageShell
      title={t('dashboard.title')}
      subtitle={t('dashboard.subtitle')}
      actions={
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          {t('dashboard.fullKundali')}
        </button>
      }>
      {error && <ErrorBanner>{error}</ErrorBanner>}

      {!kundali && (
        <div className="max-w-md mx-auto">
          <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
        </div>
      )}

      {kundali && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-min">
          {/* Main Janma Kundali (Spans 2 cols, 2 rows) */}
          <div className="md:col-span-2 md:row-span-2">
            <Card title={t('dashboard.rasiChart') || 'जन्म कुंडली'}>
              <div className="flex justify-center h-[500px]">
                <NorthIndianChart kundali={kundali} className="w-full h-full max-w-lg" />
              </div>
            </Card>
          </div>

          {/* Navamsha (Top Right) */}
          <div className="md:col-span-1">
            <Card title={t('dashboard.navamsha') || 'नवांश'}>
              <div className="flex justify-center h-[240px]">
                {navamsha && renderDivisionalChart(navamsha)}
              </div>
            </Card>
          </div>

          {/* Gochar Aaj (Middle Right) */}
          <div className="md:col-span-1">
            <Card title={t('dashboard.gocharAaj') || 'गोचर आज'}>
              <div className="flex justify-center h-[240px]">
                {gochar && <NorthIndianChart kundali={gochar} className="w-full h-full max-w-xs" />}
              </div>
            </Card>
          </div>

          {/* Vimshottari (Bottom Left) */}
          <div className="md:col-span-1">
            <Card title={t('kundali.dasha') || 'विंशोतरी'}>
              <div className="text-xs space-y-1.5 h-[200px] overflow-y-auto pr-2">
                {vim && vim.mahadashas.slice(0, 9).map((m) => (
                  <div key={m.start} className="flex justify-between items-center py-1 border-b border-subtle last:border-0">
                    <span className="font-semibold text-brand-primary">{al.planet(m.lord)}</span>
                    <span className="text-muted tabular-nums">
                      {new Date(m.start).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Jaimini / Shadbala (Bottom Middle) */}
          <div className="md:col-span-1">
            <Card title={t('dashboard.jaimini') || 'जेमिनी कारक दृष्टियां'}>
               <div className="text-xs h-[200px] overflow-y-auto">
                 {jaimini && jaimini.karakas && (
                   <div className="grid grid-cols-2 gap-2 mb-4">
                     {jaimini.karakas.map((k: any) => (
                       <div key={k.type} className="flex justify-between">
                         <span className="text-muted">{k.type}</span>
                         <span className="font-semibold">{al.planet(k.planet)}</span>
                       </div>
                     ))}
                   </div>
                 )}
                 {shad && (
                    <div className="mt-4 pt-2 border-t border-subtle">
                       <span className="text-muted">{t('dashboard.strongest')}: </span>
                       <strong className="text-good">{al.planet(shad.strongest)}</strong>
                    </div>
                 )}
               </div>
            </Card>
          </div>

          {/* Prashna Kundali (Bottom Right) */}
          <div className="md:col-span-1">
            <Card title={t('dashboard.prashna') || 'प्रश्न कुंडली'}>
               <div className="flex justify-center h-[200px]">
                 {prashna && <NorthIndianChart kundali={prashna} className="w-full h-full max-w-xs" />}
               </div>
            </Card>
          </div>
        </div>
      )}
    </PageShell>
  );
}
