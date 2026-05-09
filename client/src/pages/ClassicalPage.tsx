// Phase 9 — Classical breadth.
//
// A three-tab workspace that surfaces the three new classical systems in
// one place:
//   • Lal Kitab — Teva wheel + karmic debts (karzas) + remedies
//   • Nadi      — Per-planet Nadi amsa + Deha/Jeeva + per-bhava phala
//   • Sphutas   — Classical sensitive-point table (Pranapada, Beeja, etc.)
//
// All three operate on the same BirthInput, so one form submit populates
// every tab.

import { useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { AstroTranslator } from '../i18n/astro-labels';
import type { BirthInput } from '../types';

type Tab = 'lalkitab' | 'nadi' | 'sphuta';

interface TabMeta {
  key: Tab;
  labelKey: string;
  labelFallback: string;
  descKey: string;
  descFallback: string;
}

const TABS: TabMeta[] = [
  { key: 'lalkitab', labelKey: 'classical.tab.lalkitab', labelFallback: 'Lal Kitab', descKey: 'classical.tab.lalkitabDesc', descFallback: '6 karmic debts + Teva wheel + remedies' },
  { key: 'nadi',     labelKey: 'classical.tab.nadi',     labelFallback: 'Nadi',     descKey: 'classical.tab.nadiDesc',     descFallback: 'Nadi amsa · Deha/Jeeva · 12-bhava phala' },
  { key: 'sphuta',   labelKey: 'classical.tab.sphuta',   labelFallback: 'Sphutas',  descKey: 'classical.tab.sphutaDesc',   descFallback: 'Pranapada · Beeja · Kshetra · Ayur · Indu · Varnada' },
];

export function ClassicalPage() {
  const { t, al } = useT();
  const [tab, setTab] = useState<Tab>('lalkitab');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lalKitab, setLalKitab] = useState<any | null>(null);
  const [nadi, setNadi] = useState<any | null>(null);
  const [sphuta, setSphuta] = useState<any | null>(null);

  async function handleSubmit(input: BirthInput) {
    setLoading(true); setError(null);
    try {
      const [lk, nd, sp] = await Promise.all([
        api.lalKitab(input),
        api.nadi(input),
        api.sphutas(input),
      ]);
      setLalKitab(lk.lalKitab);
      setNadi(nd.nadi);
      setSphuta(sp.sphutas);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  const any = lalKitab || nadi || sphuta;

  return (
    <PageShell
      title={t('classical.title', 'Classical Systems')}
      subtitle={t('classical.subtitle', 'Lal Kitab · Nadi · Sphutas — classical reading systems that sit outside mainstream Parashari.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
        </aside>

        <main className="space-y-4">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {loading && <EmptyState>{t('classical.loading', 'Computing Lal Kitab, Nadi, and Sphutas…')}</EmptyState>}
          {!any && !loading && !error && (
            <EmptyState>{t('classical.empty', 'Enter birth details to compute the three classical systems.')}</EmptyState>
          )}

          {any && (
            <>
              <div className="flex items-center gap-1.5 p-1 rounded-xl border border-vedicGold/30 bg-vedicCream/30 w-fit">
                {TABS.map((tm) => (
                  <button
                    key={tm.key}
                    onClick={() => setTab(tm.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      tab === tm.key ? 'bg-vedicMaroon text-white' : 'text-vedicMaroon/70 hover:bg-vedicMaroon/5'
                    }`}>
                    {t(tm.labelKey, tm.labelFallback)}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-vedicMaroon/60 -mt-2">
                {(() => {
                  const tm = TABS.find((tt) => tt.key === tab);
                  return tm ? t(tm.descKey, tm.descFallback) : '';
                })()}
              </p>

              {tab === 'lalkitab' && lalKitab && <LalKitabView data={lalKitab} t={t} al={al} />}
              {tab === 'nadi'     && nadi     && <NadiView data={nadi} t={t} al={al} />}
              {tab === 'sphuta'   && sphuta   && <SphutaView data={sphuta} t={t} al={al} />}
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

// ─── Lal Kitab view ─────────────────────────────────────────────────────────

function LalKitabView({ data, t, al }: {
  data: any;
  t: (k: string, f?: string) => string;
  al: AstroTranslator;
}) {
  return (
    <div className="space-y-4">
      <Card title={t('classical.karzasTitle', 'Karzas — six karmic debts')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.karzas.map((k: any) => (
            <div key={k.key}
              className={`rounded-lg p-3 border ${
                k.present
                  ? 'border-vedicMaroon/40 bg-vedicMaroon/5'
                  : 'border-vedicGold/20 bg-vedicCream/30'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-xs text-vedicMaroon">{k.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  k.present ? 'bg-vedicMaroon text-white' : 'bg-vedicGold/20 text-vedicMaroon/60'
                }`}>
                  {k.present ? t('classical.karzaPresent', 'PRESENT') : t('classical.karzaClear', 'clear')}
                </span>
              </div>
              <p className="text-[11px] text-vedicMaroon/70">{k.reason}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title={t('classical.tevaTitle', 'Teva — Lal Kitab wheel (house = sign number)')}>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5">
          {data.teva.map((h: any) => (
            <div key={h.house}
              className={`rounded-md p-2 border text-center ${
                h.planets.length > 0
                  ? 'border-vedicMaroon/40 bg-vedicMaroon/5'
                  : 'border-vedicGold/20 bg-vedicCream/30'
              }`}>
              <div className="text-[10px] font-mono text-vedicMaroon/50 mb-1">H{h.house}</div>
              <div className="text-[11px] font-semibold text-vedicMaroon">{al.rashiByName(h.signName)}</div>
              {h.pakkaGhar && (
                <div className="text-[9px] text-vedicMaroon/50">{t('classical.pakkaShort', 'pakka:')} {h.pakkaGhar}</div>
              )}
              {h.planets.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-0.5 justify-center">
                  {h.planets.map((p: string) => (
                    <span key={p} className="text-[10px] px-1 rounded bg-vedicMaroon text-white font-mono">{al.planetShort(p)}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {data.pakkaGharActive.length > 0 && (
          <p className="mt-3 text-[11px] text-vedicMaroon/70">
            <span className="font-semibold">{t('classical.pakkaActive', 'Pakka ghar active:')}</span>{' '}
            {data.pakkaGharActive.map((x: any) => `${al.planet(x.planet)}@${x.house}`).join(' · ')}
          </p>
        )}
      </Card>

      {data.remedies.length > 0 && (
        <Card title={t('classical.remediesTitle', 'Chart-specific remedies (upayas)')}>
          <div className="space-y-2">
            {data.remedies.map((r: any, i: number) => (
              <div key={i} className="rounded-md border border-vedicGold/30 bg-vedicCream/30 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-vedicMaroon">{r.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-vedicMaroon/50">
                    {t(`lalkitab.scope.${r.scope}`, r.scope)}
                  </span>
                </div>
                <p className="text-[11px] text-vedicMaroon/70">{r.action}</p>
                <p className="text-[10px] text-vedicMaroon/50 mt-1">{r.timing}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Nadi view ──────────────────────────────────────────────────────────────

function NadiView({ data, t, al }: {
  data: any;
  t: (k: string, f?: string) => string;
  al: AstroTranslator;
}) {
  const { Shukla = 0, Krishna = 0, Mishra = 0 } = data.natureCounts ?? {};
  return (
    <div className="space-y-4">
      <Card title={t('classical.dehaJeevaTitle', 'Deha · Jeeva (Parashara Nadi)')}>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-vedicGold/30 bg-vedicCream/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50 mb-1">{t('classical.deha', 'Deha (body)')}</div>
            <div className="text-sm font-semibold text-vedicMaroon">{al.rashiByName(data.dehaJeeva.deha.signName)}</div>
            <div className="text-[11px] text-vedicMaroon/60">{t('classical.lordPrefix', 'lord:')} {al.planet(data.dehaJeeva.deha.lord)}</div>
          </div>
          <div className="rounded-md border border-vedicGold/30 bg-vedicCream/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50 mb-1">{t('classical.jeeva', 'Jeeva (soul)')}</div>
            <div className="text-sm font-semibold text-vedicMaroon">{al.rashiByName(data.dehaJeeva.jeeva.signName)}</div>
            <div className="text-[11px] text-vedicMaroon/60">{t('classical.lordPrefix', 'lord:')} {al.planet(data.dehaJeeva.jeeva.lord)}</div>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-vedicMaroon/60">
          {t('classical.atmakarakaNote', 'Atmakaraka {ak} — events unfold when its lord is activated by dasha or transit.')
            .replace('{ak}', al.planet(data.dehaJeeva.atmakaraka))}
        </p>
      </Card>

      <Card title={t('classical.nadiPlanetsTitle', 'Planet Nadi amsas')}>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-vedicMaroon/60">
              <th className="text-left py-1 pr-2 font-semibold">{t('classical.colPlanet', 'Planet')}</th>
              <th className="text-left py-1 pr-2 font-semibold">{t('classical.colSign', 'Sign')}</th>
              <th className="text-right py-1 pr-2 font-semibold">{t('classical.colIdx', 'Idx (/150)')}</th>
              <th className="text-left py-1 pr-2 font-semibold">{t('classical.colNadiName', 'Nadi name')}</th>
              <th className="text-left py-1 font-semibold">{t('classical.colNature', 'Nature')}</th>
            </tr>
          </thead>
          <tbody>
            {data.nadiPlanets.map((p: any) => (
              <tr key={p.id} className="border-t border-vedicGold/20">
                <td className="py-1 pr-2 font-mono font-semibold">{al.planet(p.id)}</td>
                <td className="py-1 pr-2 text-vedicMaroon/70">{al.rashiByName(p.signName)}</td>
                <td className="py-1 pr-2 text-right text-vedicMaroon/70 tabular-nums">{p.amsa.signIdx}</td>
                {/* TODO(i18n-server): localize nadi name */}
                <td className="py-1 pr-2 text-vedicMaroon" lang="en">{p.amsa.nadiName}</td>
                <td className={`py-1 font-semibold ${
                  p.amsa.nature === 'Shukla' ? 'text-green-700' :
                  p.amsa.nature === 'Krishna' ? 'text-vedicMaroon' : 'text-amber-700'
                }`}>
                  {p.amsa.nature === 'Shukla' ? t('classical.shukla', 'Shukla') :
                   p.amsa.nature === 'Krishna' ? t('classical.krishna', 'Krishna') :
                   t('classical.mishra', 'Mishra')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex gap-3 text-[11px] text-vedicMaroon/60">
          <span>{t('classical.shukla', 'Shukla')}: <span className="font-semibold text-green-700">{Shukla}</span></span>
          <span>{t('classical.krishna', 'Krishna')}: <span className="font-semibold text-vedicMaroon">{Krishna}</span></span>
          <span>{t('classical.mishra', 'Mishra')}: <span className="font-semibold text-amber-700">{Mishra}</span></span>
        </div>
      </Card>

      <Card title={t('classical.phalaTitle', '12-Bhava Nadi phala')}>
        <div className="space-y-1">
          {data.phala.map((p: any) => (
            <div key={p.house}
              className={`rounded-md px-3 py-2 text-xs flex items-start gap-3 ${
                p.verdict === 'supportive' ? 'bg-green-50 border border-green-200' :
                p.verdict === 'challenging' ? 'bg-red-50 border border-red-200' :
                p.verdict === 'mixed' ? 'bg-amber-50 border border-amber-200' :
                'bg-vedicCream/40 border border-vedicGold/20'
              }`}>
              <span className="font-mono text-[10px] text-vedicMaroon/60 w-6">H{p.house}</span>
              <span className="font-semibold text-vedicMaroon w-20">{al.rashiByName(p.signName)}</span>
              <span className="text-[10px] font-mono text-vedicMaroon/50 w-8">{al.planetShort(p.lord)}</span>
              {/* TODO(i18n-server): localize phala reading */}
              <span className="flex-1 text-vedicMaroon/80" lang="en">{p.reading}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Sphuta view ────────────────────────────────────────────────────────────

function SphutaView({ data, t, al }: {
  data: any;
  t: (k: string, f?: string) => string;
  al: AstroTranslator;
}) {
  return (
    <div className="space-y-4">
      <Card title={t('classical.sphutasTitle', 'Classical Sphutas')}>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-vedicMaroon/60">
              <th className="text-left py-1 pr-2 font-semibold">{t('classical.colSphuta', 'Sphuta')}</th>
              <th className="text-left py-1 pr-2 font-semibold">{t('classical.colFormula', 'Formula')}</th>
              <th className="text-left py-1 pr-2 font-semibold">{t('classical.colSign', 'Sign')}</th>
              <th className="text-left py-1 pr-2 font-semibold">{t('classical.colNakshatra', 'Nakshatra')}</th>
              <th className="text-right py-1 pr-2 font-semibold">{t('classical.colHouse', 'House')}</th>
              <th className="text-left py-1 font-semibold">{t('classical.colPurpose', 'Purpose')}</th>
            </tr>
          </thead>
          <tbody>
            {data.sphutas.map((s: any) => (
              <tr key={s.id} className="border-t border-vedicGold/20 align-top">
                {/* TODO(i18n-server): localize sphuta name */}
                <td className="py-1.5 pr-2 font-semibold text-vedicMaroon" lang="en">{s.name}</td>
                <td className="py-1.5 pr-2 text-[10px] font-mono text-vedicMaroon/70">{s.formula}</td>
                <td className="py-1.5 pr-2 text-vedicMaroon/70 tabular-nums">
                  {al.rashiByName(s.signName)} <span className="text-[10px] text-vedicMaroon/50">{s.degInRashi.toFixed(2)}°</span>
                </td>
                <td className="py-1.5 pr-2 text-vedicMaroon/70">{al.nakshatra(s.nakshatraNum) ?? s.nakshatraName} <span className="text-[10px] text-vedicMaroon/50">{t('classical.padaPrefix', 'pada')} {s.nakshatraPada}</span></td>
                <td className="py-1.5 pr-2 text-right text-vedicMaroon font-semibold">{s.house}</td>
                {/* TODO(i18n-server): localize sphuta purpose */}
                <td className="py-1.5 text-[11px] text-vedicMaroon/70" lang="en">{s.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card title={t('classical.specialLagnasTitle', 'Special Lagnas')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-md border border-vedicGold/30 bg-vedicCream/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50 mb-1">{t('classical.indulagna', 'Indu Lagna')}</div>
            <div className="text-sm font-semibold text-vedicMaroon">{al.rashiByName(data.indulagna.signName)}</div>
            <div className="text-[11px] text-vedicMaroon/60">{t('classical.lordPrefix', 'lord:')} {al.planet(data.indulagna.lord)} — {t('classical.induSubtitle', '"wealth ascendant" from Moon')}</div>
          </div>
          <div className="rounded-md border border-vedicGold/30 bg-vedicCream/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-vedicMaroon/50 mb-1">{t('classical.varnada', 'Varnada Lagna')}</div>
            <div className="text-sm font-semibold text-vedicMaroon">{al.rashiByName(data.varnadaLagna.signName)}</div>
            <div className="text-[11px] text-vedicMaroon/60">{t('classical.lordPrefix', 'lord:')} {al.planet(data.varnadaLagna.lord)} — {t('classical.varnadaSubtitle', '"caste/social lagna"')}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
