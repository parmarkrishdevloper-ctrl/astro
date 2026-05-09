// Phase 11 — Classical chakras workbench.
//
// Five diagrammatic tools side-by-side:
//   • Sarvatobhadra — 9×9 "all-directions" wheel of naks + signs
//   • Chandra Kalanala — Moon wheel with Jwala/Dhuma/Shanta positions
//   • Shoola — weekday thorn directions + triads to avoid
//   • Kota — fortress Stambha/Madhya/Prakara/Bahya rings
//   • Chatushpata — 4-quarter construction chakra
//
// All from one birth input + one API call (/api/chakras/all).

import { useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { AstroTranslator } from '../i18n/astro-labels';
import type { BirthInput } from '../types';

type Tab = 'sarvato' | 'kalanala' | 'shoola' | 'kota' | 'chatushpata';

const TABS: { key: Tab; labelKey: string; labelFallback: string; descKey: string; descFallback: string }[] = [
  { key: 'sarvato',      labelKey: 'chakras.tab.sarvato',     labelFallback: 'Sarvatobhadra',    descKey: 'chakras.desc.sarvato',     descFallback: '9×9 all-directions wheel — 27 naks + 12 rashis + 8 direction zones' },
  { key: 'kalanala',     labelKey: 'chakras.tab.kalanala',    labelFallback: 'Chandra Kalanala', descKey: 'chakras.desc.kalanala',    descFallback: '27-cell Moon wheel — Jwala / Dhuma / Shanta positions' },
  { key: 'shoola',       labelKey: 'chakras.tab.shoola',      labelFallback: 'Shoola',           descKey: 'chakras.desc.shoola',      descFallback: 'Weekday thorn directions + triads to avoid for travel' },
  { key: 'kota',         labelKey: 'chakras.tab.kota',        labelFallback: 'Kota',             descKey: 'chakras.desc.kota',        descFallback: 'Fortress: Stambha / Madhya / Prakara / Bahya rings' },
  { key: 'chatushpata',  labelKey: 'chakras.tab.chatushpata', labelFallback: 'Chatushpata',      descKey: 'chakras.desc.chatushpata', descFallback: '4-quarter vaastu chakra — construction & griha-pravesh guidance' },
];

type T = (key: string, fallback?: string) => string;

export function ChakrasPage() {
  const { t, al } = useT();
  const [tab, setTab] = useState<Tab>('sarvato');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  async function handleSubmit(input: BirthInput) {
    setLoading(true); setError(null);
    try {
      const r = await api.chakrasAll(input);
      setData(r.chakras);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <PageShell
      title={t('chakras.title', 'Classical Chakras')}
      subtitle={t('chakras.subtitle', 'Sarvatobhadra · Chandra Kalanala · Shoola · Kota · Chatushpata — the 5 traditional diagrammatic tools.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
        </aside>

        <main className="space-y-4">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {loading && <EmptyState>{t('chakras.loading', 'Rendering chakras — Sarvatobhadra, Kalanala, Shoola, Kota, Chatushpata…')}</EmptyState>}
          {!data && !loading && !error && (
            <EmptyState>{t('chakras.empty', 'Enter birth details to compute all five classical chakras.')}</EmptyState>
          )}

          {data && (
            <>
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border border-vedicGold/30 bg-vedicCream/30 w-fit">
                {TABS.map((tt) => (
                  <button key={tt.key} onClick={() => setTab(tt.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      tab === tt.key ? 'bg-vedicMaroon text-white' : 'text-vedicMaroon/70 hover:bg-vedicMaroon/5'
                    }`}>
                    {t(tt.labelKey, tt.labelFallback)}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-vedicMaroon/60 -mt-2">
                {(() => {
                  const found = TABS.find((tt) => tt.key === tab);
                  return found ? t(found.descKey, found.descFallback) : '';
                })()}
              </p>

              {tab === 'sarvato'     && <SarvatoView data={data.sarvatobhadra} t={t} al={al} />}
              {tab === 'kalanala'    && <KalanalaView data={data.kalanala} t={t} al={al} />}
              {tab === 'shoola'      && <ShoolaView data={data.shoola} t={t} al={al} />}
              {tab === 'kota'        && <KotaView data={data.kota} t={t} al={al} />}
              {tab === 'chatushpata' && <ChatushpataView data={data.chatushpata} t={t} />}
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}

// ─── Sarvatobhadra (9×9 grid) ────────────────────────────────────

function SarvatoView({ data, t, al }: { data: any; t: T; al: AstroTranslator }) {
  const grid: Array<Array<{ nak?: any; rashi?: any }>> =
    Array.from({ length: 9 }, () => Array(9).fill(null).map(() => ({})));
  for (const c of data.cells || []) grid[c.row][c.col] = { ...grid[c.row][c.col], nak: c };
  for (const r of data.rashis || []) grid[r.row][r.col] = { ...grid[r.row][r.col], rashi: r };

  return (
    <div className="space-y-3">
      <Card title={t('chakras.sarvato.dirStrength', 'Direction strength')}>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2 text-xs">
          {(data.directionStrength || []).map((d: any) => {
            const tone = d.benefics - d.malefics > 0 ? 'good' : d.benefics - d.malefics < 0 ? 'bad' : 'neutral';
            return (
              <div key={d.dir} className="p-2 rounded border border-vedicGold/20 bg-parchment/40 text-center">
                {/* d.dir is a 2-char compass code (E/SE/S/etc.) — kept English */}
                <div className="text-[10px] uppercase text-vedicMaroon/50" lang="en">{d.dir}</div>
                <div className="mt-1 flex items-center justify-center gap-1">
                  <Pill tone={tone as any}>+{d.benefics} / -{d.malefics}</Pill>
                </div>
                <div className="mt-1 text-[10px] text-vedicMaroon/60">{d.note?.split(' — ')[0]}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title={t('chakras.sarvato.gridTitle', 'Sarvatobhadra Grid (9×9)')} padded={false}>
        <div className="overflow-x-auto p-4">
          <table className="mx-auto border-collapse font-mono text-[10px]">
            <tbody>
              {grid.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => {
                    const n = cell.nak; const r = cell.rashi;
                    const occupied = n?.occupants?.length || r?.occupants?.length;
                    return (
                      <td key={ci} className={`border border-vedicGold/30 w-14 h-14 align-top text-center ${
                        occupied ? 'bg-vedicMaroon/10' : 'bg-parchment/30'
                      }`}>
                        {n && (
                          <>
                            {/* nakshatraName now server-localized; direction is a compass code kept English */}
                            <div className="text-[9px] text-vedicMaroon/70 truncate px-1">{n.nakshatraName}</div>
                            <div className="text-[8px] text-vedicMaroon/50" lang="en">{n.direction}</div>
                            {n.occupants?.length > 0 && (
                              <div className="text-[9px] font-bold text-vedicMaroon">{n.occupants.map((p: string) => al.planet(p)).join(' ')}</div>
                            )}
                          </>
                        )}
                        {r && (
                          <>
                            <div className="text-[9px] text-vedicMaroon/70 truncate px-1">{al.rashiByName(r.name)}</div>
                            {r.occupants?.length > 0 && (
                              <div className="text-[9px] font-bold text-vedicMaroon">{r.occupants.map((p: string) => al.planet(p)).join(' ')}</div>
                            )}
                          </>
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
    </div>
  );
}

// ─── Chandra Kalanala ────────────────────────────────────────────

function KalanalaView({ data, t, al }: { data: any; t: T; al: AstroTranslator }) {
  const stateTone = (s: string) => s === 'Jwala' ? 'bad' : s === 'Dhuma' ? 'warn' : 'good';
  const stateLabel = (s: string) => {
    if (s === 'Jwala') return t('chakras.kalanala.state.jwala', 'Jwala');
    if (s === 'Dhuma') return t('chakras.kalanala.state.dhuma', 'Dhuma');
    if (s === 'Shanta') return t('chakras.kalanala.state.shanta', 'Shanta');
    return s;
  };
  return (
    <div className="space-y-3">
      <Card title={t('chakras.kalanala.title', 'Moon wheel — Janma nakshatra at offset 1')}>
        <p className="text-xs text-vedicMaroon/70 mb-3">{data.summary}</p>
        {data.afflictedPlanets?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.afflictedPlanets.map((a: any, i: number) => (
              <Pill key={i} tone={stateTone(a.state) as any}>{al.planet(a.planet)} · {stateLabel(a.state)}</Pill>
            ))}
          </div>
        )}
      </Card>
      <Card title={t('chakras.kalanala.cells', '27 Kalanala positions')}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60">
              <th className="py-1">{t('chakras.kalanala.col.num', '#')}</th>
              <th>{t('chakras.kalanala.col.nak', 'Nakshatra')}</th>
              <th>{t('chakras.kalanala.col.offset', 'Offset')}</th>
              <th>{t('chakras.kalanala.col.state', 'State')}</th>
              <th>{t('chakras.kalanala.col.occ', 'Occupants')}</th>
            </tr>
          </thead>
          <tbody>
            {(data.cells || []).map((c: any, i: number) => (
              <tr key={i} className={`border-t border-vedicGold/10 ${c.state === 'Jwala' ? 'bg-red-50' : c.state === 'Dhuma' ? 'bg-yellow-50' : ''}`}>
                <td className="py-1 font-mono">{c.nakshatra}</td>
                <td>{c.name}</td>
                <td className="font-mono">{c.offsetFromMoon}</td>
                <td>
                  <Pill tone={stateTone(c.state) as any}>{stateLabel(c.state)}</Pill>
                </td>
                <td className="font-mono text-vedicMaroon">{c.occupants?.length ? c.occupants.map((p: string) => al.planet(p)).join(' ') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Shoola ──────────────────────────────────────────────────────

function ShoolaView({ data, t, al }: { data: any; t: T; al: AstroTranslator }) {
  return (
    <div className="space-y-3">
      <Card title={t('chakras.shoola.today', 'Today — {weekday}').replace('{weekday}', data.today?.weekday ? al.vara(data.today.weekday) : '')}>
        <div className="flex flex-wrap gap-2 mb-3">
          <Pill tone="warn">{t('chakras.shoola.dishaShool', 'Disha-shool: {dir}').replace('{dir}', data.today?.dishaShool ?? '')}</Pill>
          {data.moonInThorn && <Pill tone="bad">{t('chakras.shoola.moonInThorn', 'Moon IN thorn nakshatra')}</Pill>}
          {!data.moonInThorn && <Pill tone="good">{t('chakras.shoola.moonClear', 'Moon clear of thorn naks')}</Pill>}
        </div>
        <p className="text-xs text-vedicMaroon/70">{data.today?.note}</p>
      </Card>
      <Card title={t('chakras.shoola.weekTable', 'Weekly thorn table')}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60">
              <th className="py-1">{t('chakras.shoola.col.weekday', 'Weekday')}</th>
              <th>{t('chakras.shoola.col.dishaShool', 'Disha-shool')}</th>
              <th>{t('chakras.shoola.col.thorn', 'Thorn nakshatras')}</th>
            </tr>
          </thead>
          <tbody>
            {(data.weekTable || []).map((r: any, i: number) => (
              <tr key={i} className="border-t border-vedicGold/10">
                <td className="py-1 font-semibold">{al.vara(r.weekday)}</td>
                {/* dishaShool = compass-name kept English for consistency with weekly grid */}
                <td lang="en">{r.dishaShool}</td>
                <td>{r.thornNakshatras.map((tn: any) => `${tn.num}. ${al.nakshatra(tn.num)}`).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Kota ────────────────────────────────────────────────────────

function KotaView({ data, t, al }: { data: any; t: T; al: AstroTranslator }) {
  const zoneColor = (z: string) => ({
    Stambha: 'bg-red-100 text-red-800',
    Madhya:  'bg-orange-100 text-orange-800',
    Prakara: 'bg-yellow-100 text-yellow-800',
    Bahya:   'bg-green-100 text-green-800',
  }[z] || '');
  const zoneLabel = (z: string) => {
    if (z === 'Stambha') return t('chakras.kota.zone.stambha', 'Stambha');
    if (z === 'Madhya')  return t('chakras.kota.zone.madhya', 'Madhya');
    if (z === 'Prakara') return t('chakras.kota.zone.prakara', 'Prakara');
    if (z === 'Bahya')   return t('chakras.kota.zone.bahya', 'Bahya');
    return z;
  };
  return (
    <div className="space-y-3">
      <Card title={t('chakras.kota.title', 'Kota Chakra — Pala: {pala}, Swami: {swami}')
        .replace('{pala}', data.kotaPala ? al.planet(data.kotaPala) : '')
        .replace('{swami}', data.kotaSwami ? al.planet(data.kotaSwami) : '')}>
        <p className="text-xs text-vedicMaroon/70 mb-3">{data.summary}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <div className="font-semibold mb-1 text-red-700">{t('chakras.kota.attackers', 'Attackers ({n})').replace('{n}', String(data.attackers?.length || 0))}</div>
            {data.attackers?.length ? (
              <ul className="space-y-1">
                {data.attackers.map((a: any, i: number) => (
                  <li key={i}>{t('chakras.kota.zoneEntry', '{planet} in {zone} (nak {nak})')
                    .replace('{planet}', al.planet(a.planet))
                    .replace('{zone}', zoneLabel(a.zone))
                    .replace('{nak}', String(a.nakshatra))}</li>
                ))}
              </ul>
            ) : <div className="text-vedicMaroon/40">{t('chakras.kota.none', 'none')}</div>}
          </div>
          <div>
            <div className="font-semibold mb-1 text-green-700">{t('chakras.kota.defenders', 'Defenders ({n})').replace('{n}', String(data.defenders?.length || 0))}</div>
            {data.defenders?.length ? (
              <ul className="space-y-1">
                {data.defenders.map((a: any, i: number) => (
                  <li key={i}>{t('chakras.kota.zoneEntry', '{planet} in {zone} (nak {nak})')
                    .replace('{planet}', al.planet(a.planet))
                    .replace('{zone}', zoneLabel(a.zone))
                    .replace('{nak}', String(a.nakshatra))}</li>
                ))}
              </ul>
            ) : <div className="text-vedicMaroon/40">{t('chakras.kota.none', 'none')}</div>}
          </div>
        </div>
      </Card>
      <Card title={t('chakras.kota.layout', 'Fortress layout (by offset from Janma nak)')}>
        <div className="grid grid-cols-4 md:grid-cols-9 gap-1 text-[10px]">
          {(data.cells || []).map((c: any, i: number) => (
            <div key={i} className={`p-1.5 rounded border border-vedicGold/20 text-center ${zoneColor(c.zone)}`}>
              <div className="font-mono text-[9px]">{c.offsetFromKota}</div>
              <div className="truncate font-semibold">{c.name.slice(0, 6)}</div>
              {c.occupants?.length > 0 && <div className="font-bold">{c.occupants.map((p: string) => al.planet(p)).join('')}</div>}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Chatushpata ─────────────────────────────────────────────────

function ChatushpataView({ data, t }: { data: any; t: T }) {
  return (
    <div className="space-y-3">
      <Card title={t('chakras.chatush.title', '4-quarter construction chakra')}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(data.padas || []).map((p: any, i: number) => (
            <div key={i} className={`p-3 rounded border text-xs ${
              p.auspicious ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            }`}>
              {/* pada name + deity + element + guidance now server-localized */}
              <div className="font-bold text-vedicMaroon">{p.name} · {p.direction}</div>
              <div className="text-vedicMaroon/70">{p.deity} · {p.element}</div>
              <div className="mt-2 text-[11px]">{p.guidance}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card title={t('chakras.chatush.recs', 'Recommendations by muhurta')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <Rec title={t('chakras.chatush.bhoomiPuja', 'Bhoomi-puja')} list={data.recommendations?.bhoomiPuja} tone="good" />
          <Rec title={t('chakras.chatush.foundation', 'Foundation')} list={data.recommendations?.foundation} tone="good" />
          <Rec title={t('chakras.chatush.grihaPravesh', 'Griha-pravesh')} list={data.recommendations?.grihapravesh} tone="good" />
          <Rec title={t('chakras.chatush.avoid', 'Avoid')} list={data.recommendations?.avoid} tone="bad" />
        </div>
      </Card>
    </div>
  );
}

function Rec({ title, list, tone }: { title: string; list?: { nakshatras?: number[]; names?: string[] }; tone: 'good' | 'bad' }) {
  return (
    <div className={`p-3 rounded border ${tone === 'good' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
      <div className="font-semibold mb-1">{title}</div>
      {/* list.names are server-localized nakshatra names */}
      <div className="text-[11px] text-vedicMaroon/70">
        {list?.names?.length ? list.names.join(', ') : '—'}
      </div>
    </div>
  );
}
