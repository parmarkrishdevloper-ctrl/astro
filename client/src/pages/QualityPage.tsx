// Quality & accuracy page.
//
//   • Configuration panel — ayanamsa + house system pickers with live preview
//   • Famous charts browser — pick Gandhi/Einstein/Jobs/etc and see the chart
//     under any ayanamsa/house-system combo (great for regression & teaching)

import { useEffect, useState } from 'react';
import { Card, PageShell, Pill, EmptyState } from '../components/ui/Card';

import { api } from '../api/jyotish';
import { useT } from '../i18n';

type T = (key: string, fallback?: string) => string;

function ayanamsaHelp(t: T, key: string): string {
  return t(`quality.help.${key}`, t('quality.help.dash', '—'));
}

export function QualityPage() {
  const { t } = useT();
  const [ayanamsas, setAyanamsas] = useState<any[]>([]);
  const [houseSystems, setHouseSystems] = useState<any[]>([]);
  const [famous, setFamous] = useState<any[]>([]);
  const [ayn, setAyn] = useState('lahiri');
  const [hs, setHs] = useState('placidus');
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.qualityOptions().then((r) => { setAyanamsas(r.ayanamsas); setHouseSystems(r.houseSystems); });
    api.famousList().then((r) => setFamous(r.charts));
  }, []);

  async function compute(id: string) {
    setSelected(id);
    setLoading(true);
    try {
      const r = await api.famousKundali(id, { ayanamsa: ayn, houseSystem: hs });
      setResult(r);
    } finally { setLoading(false); }
  }

  return (
    <PageShell title={t('quality.title', 'Quality & Accuracy')} subtitle={t('quality.subtitleFull', "Swap ayanamsa & house systems. Compare against verified famous charts. Lock your engine's behaviour with regression tests.")}>
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <Card title={t('quality.engineConfig', 'Chart engine config')}>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-vedicMaroon/60 mb-1">{t('quality.ayanamsa', 'Ayanamsa')}</label>
                <select value={ayn} onChange={(e) => setAyn(e.target.value)}
                  className="w-full rounded border border-vedicGold/40 px-2 py-1.5 text-sm bg-white">
                  {ayanamsas.map((a) => <option key={a.key} value={a.key}>{a.key}</option>)}
                </select>
                <p className="text-[11px] text-vedicMaroon/60 italic mt-1">{ayanamsaHelp(t, ayn)}</p>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-vedicMaroon/60 mb-1">{t('quality.houseSystem', 'House system')}</label>
                <select value={hs} onChange={(e) => setHs(e.target.value)}
                  className="w-full rounded border border-vedicGold/40 px-2 py-1.5 text-sm bg-white">
                  {houseSystems.map((h) => <option key={h.key} value={h.key}>{h.key} ({h.code})</option>)}
                </select>
              </div>
              {selected && (
                <button onClick={() => compute(selected)}
                  className="w-full rounded bg-vedicMaroon text-white py-1.5 text-xs font-semibold hover:bg-vedicMaroon/90">
                  {t('quality.recompute', '↻ Recompute with these settings')}
                </button>
              )}
            </div>
          </Card>

          <Card title={t('quality.famousCharts', 'Famous charts ({n})').replace('{n}', String(famous.length))}>
            <ul className="space-y-1">
              {famous.map((c) => (
                <li key={c.id}>
                  <button onClick={() => compute(c.id)}
                    className={`w-full text-left px-3 py-2 rounded text-sm border ${
                      selected === c.id
                        ? 'bg-vedicMaroon text-white border-vedicMaroon'
                        : 'bg-white text-vedicMaroon border-vedicGold/30 hover:bg-parchment'
                    }`}>
                    {/* TODO(i18n-server): localize famous.name */}
                    <div className="font-semibold" lang="en">{c.name}</div>
                    <div className="text-[11px] opacity-80 flex gap-2">
                      {/* TODO(i18n-server): localize famous.category */}
                      <span lang="en">{c.category}</span>
                      <span>· {new Date(c.datetime).getUTCFullYear()}</span>
                      {c.rodden && <span>· <Pill tone="good">{t('quality.roddenPill', 'Rodden {grade}').replace('{grade}', c.rodden)}</Pill></span>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        <main>
          {!result && !loading && <EmptyState>{t('quality.empty', 'Pick a famous chart on the left to test the engine against verified birth data.')}</EmptyState>}
          {loading && <EmptyState>{t('quality.computing', 'Computing…')}</EmptyState>}
          {result && !loading && <FamousChartView result={result} />}
        </main>
      </div>
    </PageShell>
  );
}

function FamousChartView({ result }: { result: any }) {
  const { t, al } = useT();
  const { kundali, famous } = result;
  return (
    <div className="space-y-4">
      <Card title={`${famous.name} · ${famous.placeName}`}>
        <div className="text-xs text-vedicMaroon/80 flex flex-wrap gap-3">
          <span>{t('quality.born', 'Born:')} <strong className="text-vedicMaroon">{new Date(famous.datetime).toUTCString()}</strong></span>
          {/* TODO(i18n-server): localize famous.category */}
          <span>{t('quality.category', 'Category:')} <span lang="en">{famous.category}</span></span>
          {famous.rodden && <span>{t('quality.rodden', 'Rodden:')} <Pill tone="good">{famous.rodden}</Pill></span>}
        </div>
        {/* TODO(i18n-server): localize famous.note */}
        {famous.note && <p className="mt-2 text-xs italic text-vedicMaroon/70" lang="en">{famous.note}</p>}
        <div className="mt-3 flex gap-2 text-[11px]">
          <Pill tone="neutral">{t('quality.ayanamsaLabel', 'ayanamsa: {name}').replace('{name}', kundali.ayanamsa.name)}</Pill>
          <Pill tone="neutral">{t('quality.ayanamsaValue', 'ayanamsa value: {deg}°').replace('{deg}', kundali.ayanamsa.valueDeg.toFixed(4))}</Pill>
        </div>
      </Card>

      <Card title={t('quality.ascendant', 'Ascendant — {name} ({nameHi})').replace('{name}', al.rashiByName(kundali.ascendant.rashi.name)).replace('{nameHi}', kundali.ascendant.rashi.nameHi)}>
        <div className="text-xs text-vedicMaroon/80 flex flex-wrap gap-3">
          <span>{t('quality.longitude', 'Longitude:')} <strong className="text-vedicMaroon">{kundali.ascendant.longitude.toFixed(4)}°</strong></span>
          <span>{t('quality.inSign', 'In-sign: {deg}°').replace('{deg}', kundali.ascendant.rashi.degInRashi.toFixed(2))}</span>
          <span>{t('quality.nakshatra', 'Nakshatra: {name} pada {pada}').replace('{name}', al.nakshatra(kundali.ascendant.nakshatra.num) || kundali.ascendant.nakshatra.name).replace('{pada}', String(kundali.ascendant.nakshatra.pada))}</span>
        </div>
      </Card>

      <Card title={t('quality.planets', 'Planets')}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                <th className="py-1">{t('quality.col.graha', 'Graha')}</th><th>{t('quality.col.longitude', 'Longitude')}</th><th>{t('quality.col.rashi', 'Rashi')}</th>
                <th>{t('quality.col.house', 'House')}</th><th>{t('quality.col.nakshatra', 'Nakshatra')}</th><th>{t('quality.col.status', 'Status')}</th>
              </tr>
            </thead>
            <tbody>
              {kundali.planets.map((p: any) => (
                <tr key={p.id} className="border-b border-vedicGold/10">
                  <td className="py-1 font-bold text-vedicMaroon">{al.planet(p.id) || p.id}</td>
                  <td className="tabular-nums">{p.longitude.toFixed(4)}°</td>
                  <td>{al.rashiByName(p.rashi.name) || p.rashi.name}</td>
                  <td className="tabular-nums">{p.house}</td>
                  <td>{al.nakshatra(p.nakshatra.num) || p.nakshatra.name} p{p.nakshatra.pada}</td>
                  <td>
                    {p.exalted && <Pill tone="good">{t('quality.exalted', 'exalted')}</Pill>}
                    {p.debilitated && <Pill tone="bad">{t('quality.debilitated', 'debilitated')}</Pill>}
                    {p.ownSign && <Pill tone="good">{t('quality.ownSign', 'own sign')}</Pill>}
                    {p.retrograde && <Pill tone="warn">{t('quality.retrograde', 'Rx')}</Pill>}
                    {p.combust && <Pill tone="warn">{t('quality.combust', 'combust')}</Pill>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={t('quality.houseCusps', 'House cusps')}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                <th className="py-1">{t('quality.col.houseNum', 'House')}</th><th>{t('quality.col.cusp', 'Cusp longitude')}</th><th>{t('quality.col.rashi', 'Rashi')}</th><th>{t('quality.col.lord', 'Lord')}</th>
              </tr>
            </thead>
            <tbody>
              {kundali.houses.map((h: any) => (
                <tr key={h.num} className="border-b border-vedicGold/10">
                  <td className="py-1 font-bold text-vedicMaroon">{h.num}</td>
                  <td className="tabular-nums">{h.cuspLongitude.toFixed(4)}°</td>
                  <td>{al.rashiByName(h.rashiName) || h.rashiName}</td>
                  <td>{al.planet(h.lord) || h.lord}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
