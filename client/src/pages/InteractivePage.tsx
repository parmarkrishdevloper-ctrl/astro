// Interactive chart page.
//
// Four modes switched via tabs:
//   1. Planet drawer — click a planet in a list, see full context
//   2. Dispositor tree — all 9 chains + final dispositors
//   3. Aspect web — SVG node graph of all aspects
//   4. Nakshatra wheel — 27-nakshatra polar wheel with planet markers
//   5. Compare — bi-wheel synastry + composite chart for two birth inputs

import { useEffect, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, Pill, EmptyState } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput, KundaliResult } from '../types';

type Mode = 'planet' | 'dispositor' | 'aspects' | 'nakshatra' | 'compare';

export function InteractivePage() {
  const { t } = useT();
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [kundali, setKundali] = useState<KundaliResult | null>(null);
  const [mode, setMode] = useState<Mode>('planet');
  const [loading, setLoading] = useState(false);

  async function run(input: BirthInput) {
    setLoading(true);
    try {
      const r = await api.calculate(input);
      setBirth(input);
      setKundali(r.kundali);
    } finally { setLoading(false); }
  }

  const tabs: { id: Mode; key: string; fallback: string }[] = [
    { id: 'planet',     key: 'interactive.clickPlanet', fallback: 'Click-a-planet' },
    { id: 'dispositor', key: 'interactive.dispositor',  fallback: 'Dispositor tree' },
    { id: 'aspects',    key: 'interactive.aspects',     fallback: 'Aspect web' },
    { id: 'nakshatra',  key: 'interactive.wheel',       fallback: 'Nakshatra wheel' },
    { id: 'compare',    key: 'interactive.compare',     fallback: 'Compare two charts' },
  ];

  return (
    <PageShell title={t('interactive.title', 'Interactive Chart')} subtitle={t('interactive.subtitle', 'Click any planet. See its full context: dignity, aspects, dispositor chain, remedies. Plus dispositor tree, aspect web, nakshatra wheel, and chart comparison.')}>
      <div className="grid lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={run} loading={loading} />
        </aside>

        <main className="space-y-4">
          {!kundali && <EmptyState>{t('interactive.empty', 'Enter birth details to unlock interactive exploration.')}</EmptyState>}
          {kundali && birth && (
            <>
              <Card>
                <div className="flex gap-1 text-xs flex-wrap">
                  {tabs.map(({ id, key, fallback }) => (
                    <button key={id} onClick={() => setMode(id)}
                      className={`px-3 py-1.5 rounded border text-xs ${mode === id
                        ? 'bg-vedicMaroon text-white border-vedicMaroon'
                        : 'bg-white text-vedicMaroon border-vedicGold/40 hover:bg-parchment'}`}>
                      {t(key, fallback)}
                    </button>
                  ))}
                </div>
              </Card>

              {mode === 'planet'     && <PlanetDrawerView  birth={birth} kundali={kundali} />}
              {mode === 'dispositor' && <DispositorView    birth={birth} kundali={kundali} />}
              {mode === 'aspects'    && <AspectWebView     birth={birth} kundali={kundali} />}
              {mode === 'nakshatra'  && <NakshatraWheelView kundali={kundali} />}
              {mode === 'compare'    && <CompareView       selfBirth={birth} />}
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

// ─── Planet drawer ─────────────────────────────────────────────────────────
const PLANET_IDS = ['SU','MO','MA','ME','JU','VE','SA','RA','KE'];

function PlanetDrawerView({ birth, kundali }: { birth: BirthInput; kundali: KundaliResult }) {
  const { t, al } = useT();
  const [pid, setPid] = useState('SU');
  const [detail, setDetail] = useState<any | null>(null);

  useEffect(() => {
    api.planetDetail(birth, pid, new Date().toISOString()).then((r) => setDetail(r.detail));
  }, [pid, birth]);

  void kundali;

  return (
    <div className="grid md:grid-cols-[140px_1fr] gap-4">
      <Card>
        <ul className="space-y-1">
          {PLANET_IDS.map((p) => (
            <li key={p}>
              <button onClick={() => setPid(p)}
                className={`w-full text-left px-3 py-2 rounded text-sm ${pid === p
                  ? 'bg-vedicMaroon text-white'
                  : 'bg-white hover:bg-parchment text-vedicMaroon'}`}>
                {al.planet(p)}
              </button>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        {!detail && <EmptyState>{t('interactive.loading', 'Loading…')}</EmptyState>}
        {detail && (
          <div>
            <div className="flex items-baseline gap-3 flex-wrap">
              {/* TODO(i18n-server): localize encyclopedia entry name/oneliner */}
              <h3 className="text-xl font-bold text-vedicMaroon">{al.planet(pid)}</h3>
              <span className="text-vedicMaroon/60">{detail.enc?.sanskrit}</span>
              <Pill tone={
                detail.dignity.exalted ? 'good'
                : detail.dignity.debilitated ? 'bad'
                : detail.dignity.ownSign ? 'good' : 'neutral'
              }><span lang="en">{detail.dignity.label}</span></Pill>
              {detail.currentDasha.maha && <Pill tone="good">{t('interactive.mahaLordNow', 'Maha lord now')}</Pill>}
              {detail.currentDasha.antar && <Pill tone="good">{t('interactive.antarLordNow', 'Antar lord now')}</Pill>}
            </div>
            <p className="text-xs text-vedicMaroon/70 italic mt-1" lang="en">{detail.enc?.oneliner}</p>

            <div className="grid md:grid-cols-2 gap-3 mt-4 text-xs">
              <InfoBlock label={t('interactive.position', 'Position')}>
                {al.rashi(detail.planet.rashi.num)} · {Number(detail.planet.rashi.degInRashi).toFixed(2)}° ·
                {' '}{t('common.house', 'House').toLowerCase()} {detail.planet.house} · {al.nakshatra(detail.planet.nakshatra.num)} {t('common.pada', 'pada')} {detail.planet.nakshatra.pada}
              </InfoBlock>
              <InfoBlock label={t('interactive.lordOf', 'Lord of houses')}>
                {detail.lordOf.length ? detail.lordOf.join(', ') : '—'}
              </InfoBlock>
              <InfoBlock label={t('interactive.conjunctWith', 'Conjunct with')}>
                {detail.conjunctions.length ? detail.conjunctions.map((c: string) => al.planet(c)).join(', ') : t('interactive.alone', 'alone')}
              </InfoBlock>
              <InfoBlock label={t('interactive.dispositorChain', 'Dispositor chain')}>
                {detail.dispositorChain.map((c: string) => al.planet(c)).join(' → ')}
              </InfoBlock>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mt-3 text-xs">
              <div>
                <h4 className="text-vedicMaroon font-semibold uppercase text-[10px] tracking-wider mb-1">{t('interactive.aspectsReceived', 'Aspects received')}</h4>
                {detail.aspectsReceived.length === 0 && <p className="italic text-vedicMaroon/60">{t('interactive.none', 'none')}</p>}
                <ul className="space-y-1">
                  {detail.aspectsReceived.map((e: any, i: number) => (
                    <li key={i}>{al.planet(e.from)} → {al.planet(e.to)} ({e.houseDiff}, <span lang="en">{e.kind}</span>)</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-vedicMaroon font-semibold uppercase text-[10px] tracking-wider mb-1">{t('interactive.aspectsGiven', 'Aspects given')}</h4>
                {detail.aspectsGiven.length === 0 && <p className="italic text-vedicMaroon/60">{t('interactive.none', 'none')}</p>}
                <ul className="space-y-1">
                  {detail.aspectsGiven.map((e: any, i: number) => (
                    <li key={i}>{al.planet(e.from)} → {al.planet(e.to)} ({e.houseDiff}, <span lang="en">{e.kind}</span>)</li>
                  ))}
                </ul>
              </div>
            </div>

            {detail.remedies && (
              <div className="mt-4 pt-3 border-t border-vedicGold/30 text-xs">
                <h4 className="text-vedicMaroon font-semibold uppercase text-[10px] tracking-wider mb-1">{t('interactive.classicalRemedies', 'Classical remedies')}</h4>
                <div className="grid md:grid-cols-2 gap-2">
                  {detail.remedies.beejMantra && <InfoBlock label={t('interactive.beejMantra', 'Beej Mantra')}><span className="font-devanagari">{detail.remedies.beejMantra}</span></InfoBlock>}
                  {detail.remedies.gemstone && (
                    <InfoBlock label={t('interactive.gemstone', 'Gemstone')}>
                      <span>{detail.remedies.gemstone.primary} · {detail.remedies.gemstone.weight} · {detail.remedies.gemstone.metal}, {detail.remedies.gemstone.finger} finger</span>
                    </InfoBlock>
                  )}
                  {detail.remedies.fastingDay && <InfoBlock label={t('interactive.fastingDay', 'Fasting day')}>{detail.remedies.fastingDay}</InfoBlock>}
                  {detail.remedies.ritual && <InfoBlock label={t('interactive.ritual', 'Ritual')}><span>{detail.remedies.ritual}</span></InfoBlock>}
                  {detail.remedies.donations && <InfoBlock label={t('interactive.donations', 'Donations')}><span>{detail.remedies.donations.join(', ')}</span></InfoBlock>}
                  {detail.remedies.yantra && <InfoBlock label={t('interactive.yantra', 'Yantra')}><span>{detail.remedies.yantra}</span></InfoBlock>}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded bg-parchment/60 px-3 py-2 border border-vedicGold/30">
      <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50 mb-0.5">{label}</div>
      <div className="text-vedicMaroon">{children}</div>
    </div>
  );
}

// ─── Dispositor tree ───────────────────────────────────────────────────────
function DispositorView({ birth }: { birth: BirthInput; kundali: KundaliResult }) {
  const { t, al } = useT();
  const [tree, setTree] = useState<any | null>(null);
  useEffect(() => { api.dispositorTree(birth).then((r) => setTree(r.tree)); }, [birth]);
  if (!tree) return <EmptyState>{t('interactive.loading', 'Loading…')}</EmptyState>;
  const finalText = tree.finalDispositors.length
    ? tree.finalDispositors.map((p: string) => al.planet(p)).join(', ')
    : t('interactive.none', 'none');
  return (
    <Card title={t('interactive.dispositorTitle', 'Dispositor chains · Final dispositors: {final}').replace('{final}', finalText)}>
      <div className="grid md:grid-cols-2 gap-3 text-sm">
        {Object.entries(tree.chains).map(([id, chain]: [string, any]) => (
          <div key={id} className="border border-vedicGold/30 rounded p-3 bg-parchment/40">
            <div className="font-bold text-vedicMaroon">{al.planet(id)}</div>
            <div className="text-xs text-vedicMaroon/80 mt-1 font-mono">{chain.map((c: string) => al.planet(c)).join(' → ')}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-vedicMaroon/60 italic">
        {t('interactive.dispositorNote', "The chain follows each planet's sign lord until it loops. A planet in its own sign is a final dispositor — the chart resolves its energy there.")}
      </p>
    </Card>
  );
}

// ─── Aspect web (SVG) ──────────────────────────────────────────────────────
function AspectWebView({ birth }: { birth: BirthInput; kundali: KundaliResult }) {
  const { t, al } = useT();
  const [web, setWeb] = useState<any | null>(null);
  useEffect(() => { api.aspectWeb(birth).then((r) => setWeb(r.web)); }, [birth]);
  if (!web) return <EmptyState>{t('interactive.loading', 'Loading…')}</EmptyState>;

  // Position 9 planets around a circle
  const R = 180, C = 220;
  const pos = (i: number) => ({
    x: C + R * Math.cos(((i / 9) * 2 * Math.PI) - Math.PI / 2),
    y: C + R * Math.sin(((i / 9) * 2 * Math.PI) - Math.PI / 2),
  });
  const idToIdx = Object.fromEntries(web.nodes.map((n: any, i: number) => [n.id, i]));

  return (
    <Card title={t('interactive.aspectWebTitle', 'Aspect web — {n} edges').replace('{n}', String(web.edges.length))}>
      <div className="flex justify-center">
        <svg width={440} height={440} viewBox="0 0 440 440">
          <circle cx={C} cy={C} r={R + 20} fill="none" stroke="#D4AF37" strokeOpacity="0.3" />
          {web.edges.map((e: any, i: number) => {
            const a = pos(idToIdx[e.from]);
            const b = pos(idToIdx[e.to]);
            const color = e.kind === 'special' ? '#7B1E1E' : '#6b7280';
            return (
              <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={color} strokeOpacity="0.4" strokeWidth={e.kind === 'special' ? 1.5 : 0.75} />
            );
          })}
          {web.nodes.map((n: any, i: number) => {
            const p = pos(i);
            return (
              <g key={n.id}>
                <circle cx={p.x} cy={p.y} r={18} fill="#FFF8E7" stroke="#7B1E1E" strokeWidth={1.5} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#7B1E1E">
                  {al.planetShort(n.id)}
                </text>
                <text x={p.x} y={p.y + 32} textAnchor="middle" fontSize={9} fill="#7B1E1E" opacity={0.6}>
                  {t('common.houseShort', 'H')}{n.house}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="text-[11px] text-vedicMaroon/60 flex gap-4 justify-center mt-2">
        <span><span className="inline-block w-4 h-0.5 bg-vedicMaroon mr-1 align-middle"></span> {t('interactive.legend.special', 'special aspect (Mars 4/8, Jup 5/9, Sat 3/10)')}</span>
        <span><span className="inline-block w-4 h-0.5 bg-slate-500 mr-1 align-middle"></span> {t('interactive.legend.universal', '7th aspect (universal)')}</span>
      </div>
    </Card>
  );
}

// ─── Nakshatra wheel ───────────────────────────────────────────────────────
function NakshatraWheelView({ kundali }: { kundali: KundaliResult }) {
  const { t, al } = useT();
  const R = 200, C = 230;
  const innerR = 100;
  const polar = (r: number, angleDeg: number) => ({
    x: C + r * Math.cos((angleDeg - 90) * Math.PI / 180),
    y: C + r * Math.sin((angleDeg - 90) * Math.PI / 180),
  });
  // Each nakshatra = 360/27 ≈ 13.33° of arc
  return (
    <Card title={t('interactive.nakshatraWheelTitle', 'Nakshatra wheel — 27 lunar mansions')}>
      <div className="flex justify-center">
        <svg width={460} height={460} viewBox="0 0 460 460">
          <circle cx={C} cy={C} r={R} fill="none" stroke="#7B1E1E" strokeOpacity={0.5} />
          <circle cx={C} cy={C} r={innerR} fill="none" stroke="#D4AF37" strokeOpacity={0.5} />
          {Array.from({ length: 27 }, (_, i) => {
            const ang = i * (360 / 27);
            const next = (i + 1) * (360 / 27);
            const mid = (ang + next) / 2;
            const p1 = polar(innerR, ang);
            const p2 = polar(R, ang);
            const labelPos = polar((innerR + R) / 2, mid);
            return (
              <g key={i}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#D4AF37" strokeOpacity={0.4} />
                <text x={labelPos.x} y={labelPos.y} textAnchor="middle"
                  fontSize={8} fill="#7B1E1E" transform={`rotate(${mid > 180 ? mid + 90 : mid - 90}, ${labelPos.x}, ${labelPos.y})`}>
                  {i + 1}. {al.nakshatra(i + 1)}
                </text>
              </g>
            );
          })}
          {/* Planet markers */}
          {kundali.planets.map((p) => {
            const ang = (p.longitude / 360) * 360;
            const point = polar(innerR - 8, ang);
            return (
              <g key={p.id}>
                <circle cx={point.x} cy={point.y} r={12} fill="#FFF8E7" stroke="#7B1E1E" strokeWidth={1.5} />
                <text x={point.x} y={point.y + 4} textAnchor="middle" fontSize={9} fontWeight="bold" fill="#7B1E1E">
                  {al.planetShort(p.id)}
                </text>
              </g>
            );
          })}
          {/* Lagna marker */}
          {(() => {
            const lp = polar(R + 15, kundali.ascendant.longitude);
            return <text x={lp.x} y={lp.y} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#D4AF37">{t('interactive.lagnaShort', 'Lg')}</text>;
          })()}
        </svg>
      </div>
      <p className="text-[11px] text-vedicMaroon/60 italic mt-2 text-center">
        {t('interactive.nakshatraWheelNote', 'Each nakshatra spans 13°20′; planets are plotted by sidereal longitude. Lagna ("Lg") marks the rising degree.')}
      </p>
    </Card>
  );
}

// ─── Compare view ──────────────────────────────────────────────────────────
function CompareView({ selfBirth }: { selfBirth: BirthInput }) {
  const { t, al } = useT();
  const [, setPartner] = useState<BirthInput | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  async function go(p: BirthInput) {
    setPartner(p);
    setLoading(true);
    try {
      const r = await api.compare(selfBirth, p);
      setResult(r);
    } finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-4">
      <div>
        <div className="mb-2 text-[11px] text-vedicMaroon/60">
          {t('interactive.compareNote', 'Comparing against your chart above. Enter partner below.')}
        </div>
        <BirthDetailsForm onSubmit={go} loading={loading} />
      </div>
      <div className="space-y-4">
        {!result && <EmptyState>{t('interactive.partnerEnter', 'Enter partner birth details.')}</EmptyState>}
        {result && (
          <>
            <Card title={t('interactive.synastryTitle', 'Synastry — {n} positive hits').replace('{n}', String(result.synastry.hits.length))}>
              <div className="grid md:grid-cols-4 gap-2 text-xs">
                {result.synastry.hits.map((h: any, i: number) => (
                  <div key={i} className="border border-vedicGold/20 rounded p-2 bg-parchment/40">
                    <span className="font-bold text-vedicMaroon">{al.planet(h.aPlanet)}</span>
                    {/* TODO(i18n-server): localize synastry.relation */}
                    <span className="text-vedicMaroon/60" lang="en"> {h.relation} </span>
                    <span className="font-bold text-vedicMaroon">{al.planet(h.bPlanet)}</span>
                    <div className="text-[11px] text-vedicMaroon/50">({h.houseDiff})</div>
                  </div>
                ))}
              </div>
              <h4 className="text-vedicMaroon font-semibold uppercase text-[10px] tracking-wider mt-4 mb-2">{t('interactive.yourPlanetsInTheirHouses', 'Your planets in their houses')}</h4>
              <div className="grid md:grid-cols-3 gap-2 text-xs">
                {result.synastry.aPlanetsInBHouses.map((x: any) => (
                  <div key={x.id} className="bg-white border border-vedicGold/20 rounded px-2 py-1">
                    <strong className="text-vedicMaroon">{al.planet(x.id)}</strong> {t('interactive.synastryFalls', 'falls in their {h}th house').replace('{h}', String(x.house))}
                  </div>
                ))}
              </div>
            </Card>
            <Card title={t('interactive.compositeTitle', 'Composite chart — midpoint positions')}>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                    <th className="py-1">{t('interactive.col.body', 'Body')}</th><th>{t('interactive.col.longitude', 'Composite longitude')}</th><th>{t('interactive.col.sign', 'Sign')}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-vedicGold/10 bg-parchment/40">
                    <td className="py-1 font-bold text-vedicMaroon">{t('interactive.asc', 'Asc')}</td>
                    <td className="tabular-nums">{result.composite.ascendant.longitude.toFixed(2)}°</td>
                    <td>{al.rashiByName(result.composite.ascendant.signName)}</td>
                  </tr>
                  {result.composite.planets.map((p: any) => (
                    <tr key={p.id} className="border-b border-vedicGold/10">
                      <td className="py-1 font-bold text-vedicMaroon">{al.planet(p.id)}</td>
                      <td className="tabular-nums">{p.longitude.toFixed(2)}°</td>
                      <td>{al.rashiByName(p.signName)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
