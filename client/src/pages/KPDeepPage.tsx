// Phase 9 — KP Deep.
//
// Single-page KP workbench for practitioners who work beyond the usual
// Sign/Star/Sub trio. We surface:
//
//   • 4-level lords on both cusps and planets (Sign → Star → Sub → Sub-Sub
//     → Sub-Sub-Sub). Fourth-level is used for pin-point timing.
//   • Cuspal Interlinks — for each bhava, chain its sub-lord through the
//     A/B/C/D significator rule and match against the classical fruition
//     set (1:[1,5,9], 2:[2,11], 7:[2,7,11], etc.). If the sub-lord signifies
//     anything in the expected set the bhava is "promised".
//   • Cusp significators — four-level A/B/C/D grading for every house.
//   • Planet significators — the inverse view: each planet → houses it
//     signifies.
//   • Ruling Planets at a chosen moment (day-lord + Moon/Asc lords).

import { useMemo, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput, PlanetId } from '../types';

type Tab = 'cusps' | 'interlinks' | 'significators' | 'planets' | 'ruling';

const TABS: { key: Tab; labelKey: string; labelFallback: string; hintKey: string; hintFallback: string }[] = [
  { key: 'cusps',         labelKey: 'kspDeep.tab.cusps',         labelFallback: '4-level Cusps',      hintKey: 'kspDeep.hint.cusps',         hintFallback: 'Sign → Star → Sub → Sub² → Sub³ for all 12 cusps + planets' },
  { key: 'interlinks',    labelKey: 'kspDeep.tab.interlinks',    labelFallback: 'Cuspal Interlinks',  hintKey: 'kspDeep.hint.interlinks',    hintFallback: "Each bhava's sub-lord checked against classical fruition houses" },
  { key: 'significators', labelKey: 'kspDeep.tab.significators', labelFallback: 'Cusp Significators', hintKey: 'kspDeep.hint.significators', hintFallback: 'Four-level A/B/C/D grading of significators for every house' },
  { key: 'planets',       labelKey: 'kspDeep.tab.planets',       labelFallback: 'Planet → Houses',    hintKey: 'kspDeep.hint.planets',       hintFallback: 'Inverse view — each planet to the houses it signifies' },
  { key: 'ruling',        labelKey: 'kspDeep.tab.ruling',        labelFallback: 'Ruling Planets',     hintKey: 'kspDeep.hint.ruling',        hintFallback: 'Day-lord, Moon & Ascendant lords at the inspected moment' },
];

export function KPDeepPage() {
  const { t, al } = useT();
  const [tab, setTab] = useState<Tab>('cusps');
  const [, setBirth] = useState<BirthInput | null>(null);
  const [kp, setKp] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rp, setRp] = useState<any | null>(null);
  const [rpLat, setRpLat] = useState<number | null>(null);
  const [rpLng, setRpLng] = useState<number | null>(null);
  const [rpWhen, setRpWhen] = useState<string>(() => {
    const d = new Date(); d.setSeconds(0, 0);
    return d.toISOString().slice(0, 16);
  });

  async function handleSubmit(input: BirthInput) {
    setBirth(input);
    setLoading(true); setError(null);
    try {
      const r = await api.kp(input);
      setKp(r.kp);
      setRpLat(input.lat); setRpLng(input.lng);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  async function loadRulingPlanets() {
    if (rpLat == null || rpLng == null) return;
    try {
      const r = await fetch('/api/analysis/ruling-planets', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lat: rpLat, lng: rpLng, when: new Date(rpWhen).toISOString() }),
      });
      const data = await r.json();
      if (data.ok) setRp(data.rulingPlanets);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <PageShell
      title={t('kspDeep.title', 'KP Deep')}
      subtitle={t('kspDeep.subtitle', 'Krishnamurti Paddhati — 4-level cusps · cuspal interlinks · A/B/C/D significators.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={handleSubmit} loading={loading} />
          {kp && (
            <Card title={t('kspDeep.rp.cardTitle', 'Ruling Planets — inspect moment')}>
              <input
                type="datetime-local"
                value={rpWhen}
                onChange={(e) => setRpWhen(e.target.value)}
                className="w-full px-2 py-1.5 rounded-md border border-vedicGold/40 bg-white text-xs mb-2"
              />
              <button
                onClick={loadRulingPlanets}
                disabled={rpLat == null || rpLng == null}
                className="w-full px-3 py-1.5 rounded-md bg-vedicMaroon text-white text-xs font-semibold disabled:opacity-50"
              >
                {t('kspDeep.rp.compute', 'Compute Ruling Planets')}
              </button>
              <p className="mt-2 text-[10px] text-vedicMaroon/60 leading-snug">
                {t('kspDeep.rp.note', 'Uses birth location — RP of any moment are read against the Moon & Ascendant sub-lords of that instant (plus day-lord).')}
              </p>
            </Card>
          )}
        </aside>

        <main className="space-y-4">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {loading && <EmptyState>{t('kspDeep.computing', 'Computing KP chart…')}</EmptyState>}
          {!kp && !loading && !error && (
            <EmptyState>{t('kspDeep.empty', 'Enter birth details to compute the KP deep chart.')}</EmptyState>
          )}

          {kp && (
            <>
              <div className="flex items-center gap-1.5 p-1 rounded-xl border border-vedicGold/30 bg-vedicCream/30 w-fit flex-wrap">
                {TABS.map((tt) => (
                  <button
                    key={tt.key}
                    onClick={() => setTab(tt.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      tab === tt.key ? 'bg-vedicMaroon text-white' : 'text-vedicMaroon/70 hover:bg-vedicMaroon/5'
                    }`}
                  >
                    {t(tt.labelKey, tt.labelFallback)}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-vedicMaroon/60 -mt-2">
                {(() => {
                  const found = TABS.find((tt) => tt.key === tab);
                  return found ? t(found.hintKey, found.hintFallback) : '';
                })()}
              </p>

              {tab === 'cusps'         && <CuspsView kp={kp} />}
              {tab === 'interlinks'    && <InterlinksView kp={kp} />}
              {tab === 'significators' && <CuspSignificatorsView kp={kp} />}
              {tab === 'planets'       && <PlanetSignificatorsView kp={kp} />}
              {tab === 'ruling'        && <RulingPlanetsView rp={rp} />}
            </>
          )}
        </main>
      </div>
    </PageShell>
  );

  // ─── 4-level cusps + planets ───────────────────────────────────────────────

  function CuspsView({ kp }: { kp: any }) {
    return (
      <div className="space-y-4">
        <Card title={t('kspDeep.cusps.cardTitle', 'Cusps — 4-level lords (House → Sign · Star · Sub · Sub² · Sub³)')}>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-vedicMaroon/70 text-left">
                <th className="py-1 pr-2 font-semibold">{t('kspDeep.col.h', 'H')}</th>
                <th className="py-1 pr-2 font-semibold">{t('kspDeep.col.sign', 'Sign')}</th>
                <th className="py-1 pr-2 font-semibold text-right">{t('kspDeep.col.cuspDeg', 'Cusp°')}</th>
                <th className="py-1 pr-2 font-semibold">{t('kspDeep.col.signL', 'Sign L.')}</th>
                <th className="py-1 pr-2 font-semibold">{t('kspDeep.col.starL', 'Star L.')}</th>
                <th className="py-1 pr-2 font-semibold">{t('kspDeep.col.sub', 'Sub')}</th>
                <th className="py-1 pr-2 font-semibold">{t('kspDeep.col.sub2', 'Sub²')}</th>
                <th className="py-1 font-semibold">{t('kspDeep.col.sub3', 'Sub³')}</th>
              </tr>
            </thead>
            <tbody>
              {kp.cusps.map((c: any) => (
                <tr key={c.house} className="border-t border-vedicGold/20">
                  <td className="py-1.5 pr-2 font-bold text-vedicMaroon">{c.house}</td>
                  <td className="py-1.5 pr-2 text-vedicMaroon/80">{al.rashiByName(c.signName)}</td>
                  <td className="py-1.5 pr-2 text-right text-vedicMaroon/60 tabular-nums">
                    {(c.longitude % 30).toFixed(2)}°
                  </td>
                  <td className="py-1.5 pr-2 font-mono font-semibold">{al.planet(c.signLord)}</td>
                  <td className="py-1.5 pr-2 font-mono">{al.planet(c.starLord)}</td>
                  <td className="py-1.5 pr-2 font-mono">{al.planet(c.subLord)}</td>
                  <td className="py-1.5 pr-2 font-mono text-vedicMaroon/70">{al.planet(c.subSubLord)}</td>
                  <td className="py-1.5 font-mono text-vedicMaroon/50">{al.planet(c.subSubSubLord)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title={t('kspDeep.planets.cardTitle', 'Planets — 4-level lords (Graha → Sign · Star · Sub · Sub² · Sub³)')}>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="text-vedicMaroon/70 text-left">
                <th className="py-1 pr-2 font-semibold">{t('kspDeep.col.graha', 'Graha')}</th>
                <th className="py-1 pr-2 font-semibold text-right">{t('kspDeep.col.longitude', 'Longitude')}</th>
                <th className="py-1 pr-2 font-semibold text-right">{t('kspDeep.col.house', 'House')}</th>
                <th className="py-1 pr-2 font-semibold">{t('kspDeep.col.signL', 'Sign L.')}</th>
                <th className="py-1 pr-2 font-semibold">{t('kspDeep.col.starL', 'Star L.')}</th>
                <th className="py-1 pr-2 font-semibold">{t('kspDeep.col.sub', 'Sub')}</th>
                <th className="py-1 pr-2 font-semibold">{t('kspDeep.col.sub2', 'Sub²')}</th>
                <th className="py-1 font-semibold">{t('kspDeep.col.sub3', 'Sub³')}</th>
              </tr>
            </thead>
            <tbody>
              {kp.planets.map((p: any) => (
                <tr key={p.id} className="border-t border-vedicGold/20">
                  <td className="py-1.5 pr-2 font-bold text-vedicMaroon font-mono">{al.planet(p.id)}</td>
                  <td className="py-1.5 pr-2 text-right text-vedicMaroon/70 tabular-nums">
                    {p.longitude.toFixed(2)}°
                  </td>
                  <td className="py-1.5 pr-2 text-right text-vedicMaroon/80 font-semibold tabular-nums">{p.houseOccupied}</td>
                  <td className="py-1.5 pr-2 font-mono font-semibold">{al.planet(p.signLord)}</td>
                  <td className="py-1.5 pr-2 font-mono">{al.planet(p.starLord)}</td>
                  <td className="py-1.5 pr-2 font-mono">{al.planet(p.subLord)}</td>
                  <td className="py-1.5 pr-2 font-mono text-vedicMaroon/70">{al.planet(p.subSubLord)}</td>
                  <td className="py-1.5 font-mono text-vedicMaroon/50">{al.planet(p.subSubSubLord)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    );
  }

  // ─── Cuspal Interlinks ─────────────────────────────────────────────────────

  function InterlinksView({ kp }: { kp: any }) {
    const links = kp.cuspalInterlinks ?? [];
    const promised = links.filter((l: any) => l.promises).length;
    return (
      <div className="space-y-4">
        <Card title={t('kspDeep.interlinks.cardTitle', 'Cuspal Interlinks — {p} / 12 bhavas promise').replace('{p}', String(promised))}>
          <p className="text-[11px] text-vedicMaroon/60 mb-3">
            {t('kspDeep.interlinks.intro', 'Classical "cusp sub-lord" rule (K.S. Krishnamurti): the sub-lord of a bhava\'s cusp decides whether that house will fructify. If its four-step significations overlap with the bhava\'s expected fruition houses, the bhava is')} <span className="font-semibold">{t('kspDeep.interlinks.promised', 'promised')}</span>.
          </p>
          <div className="space-y-1.5">
            {links.map((l: any) => (
              <div
                key={l.house}
                className={`rounded-md px-3 py-2 text-xs border flex items-center gap-3 ${
                  l.promises
                    ? 'bg-emerald-50/40 border-emerald-300/50'
                    : 'bg-red-50/40 border-red-300/40'
                }`}
              >
                <span className="w-8 font-bold text-vedicMaroon tabular-nums">H{l.house}</span>
                <span className="w-12 font-mono font-semibold text-vedicMaroon">{al.planet(l.subLord)}</span>
                <span className="text-[10px] uppercase tracking-wider text-vedicMaroon/50 w-20">{t('kspDeep.interlinks.subLord', 'sub-lord')}</span>
                <span className="flex-1">
                  <span className="text-vedicMaroon/50 text-[10px] mr-1">{t('kspDeep.interlinks.signifies', 'signifies:')}</span>
                  <span className="font-mono">{l.signifies.length ? l.signifies.join(',') : '—'}</span>
                </span>
                <span className="flex-1">
                  <span className="text-vedicMaroon/50 text-[10px] mr-1">{t('kspDeep.interlinks.expected', 'expected:')}</span>
                  <span className="font-mono">{l.expected.join(',')}</span>
                </span>
                <span className="w-20">
                  {l.promises ? (
                    <Pill tone="good">
                      ✓ {l.matchedHouses.join(',')}
                    </Pill>
                  ) : (
                    <Pill tone="bad">{t('kspDeep.interlinks.noMatch', 'no match')}</Pill>
                  )}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  // ─── ABCD significators per cusp ───────────────────────────────────────────

  function CuspSignificatorsView({ kp }: { kp: any }) {
    const rows = kp.cuspSignificators ?? [];
    return (
      <Card title={t('kspDeep.cuspSig.cardTitle', 'Cusp Significators — 4-level A/B/C/D rule')}>
        <p className="text-[11px] text-vedicMaroon/60 mb-3">
          {t('kspDeep.cuspSig.intro', 'For each bhava (in priority order):')}{' '}
          <span className="text-emerald-700 font-semibold">{t('kspDeep.cuspSig.aLabel', 'A')}</span> {t('kspDeep.cuspSig.aDesc', 'planets in the star of an occupant')} · {' '}
          <span className="text-emerald-600 font-semibold">{t('kspDeep.cuspSig.bLabel', 'B')}</span> {t('kspDeep.cuspSig.bDesc', 'occupants themselves')} · {' '}
          <span className="text-amber-700 font-semibold">{t('kspDeep.cuspSig.cLabel', 'C')}</span> {t('kspDeep.cuspSig.cDesc', 'planets in the star of the house lord')} · {' '}
          <span className="text-vedicMaroon font-semibold">{t('kspDeep.cuspSig.dLabel', 'D')}</span> {t('kspDeep.cuspSig.dDesc', 'the house lord.')}
        </p>
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="text-vedicMaroon/70 text-left">
              <th className="py-1 pr-2 font-semibold">{t('kspDeep.col.h', 'H')}</th>
              <th className="py-1 pr-2 text-emerald-700 font-semibold">{t('kspDeep.cuspSig.aHeader', 'A — in star of occupant')}</th>
              <th className="py-1 pr-2 text-emerald-600 font-semibold">{t('kspDeep.cuspSig.bHeader', 'B — occupants')}</th>
              <th className="py-1 pr-2 text-amber-700 font-semibold">{t('kspDeep.cuspSig.cHeader', 'C — in star of house lord')}</th>
              <th className="py-1 font-semibold">{t('kspDeep.cuspSig.dHeader', 'D — house lord')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.house} className="border-t border-vedicGold/20 align-top">
                <td className="py-1.5 pr-2 font-bold text-vedicMaroon tabular-nums">H{r.house}</td>
                <td className="py-1.5 pr-2 text-emerald-700 font-mono">{r.A.map((p: string) => al.planet(p)).join(' ') || '—'}</td>
                <td className="py-1.5 pr-2 text-emerald-600 font-mono">{r.B.map((p: string) => al.planet(p)).join(' ') || '—'}</td>
                <td className="py-1.5 pr-2 text-amber-700 font-mono">{r.C.map((p: string) => al.planet(p)).join(' ') || '—'}</td>
                <td className="py-1.5 font-mono text-vedicMaroon">{r.D.map((p: string) => al.planet(p)).join(' ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    );
  }

  // ─── Planet → houses view ──────────────────────────────────────────────────

  function PlanetSignificatorsView({ kp }: { kp: any }) {
    const rows: { planet: PlanetId; houses: number[] }[] = kp.significators ?? [];
    const sorted = useMemo(
      () => rows.slice().sort((a, b) => b.houses.length - a.houses.length),
      [rows],
    );
    return (
      <Card title={t('kspDeep.planetSig.cardTitle', 'Planet Significators — houses each planet signifies (any of the four steps)')}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sorted.map((r) => (
            <div
              key={r.planet}
              className="rounded-md border border-vedicGold/30 bg-vedicCream/30 p-3 flex items-center gap-3"
            >
              <span className="font-mono font-bold text-sm text-vedicMaroon w-8">{al.planet(r.planet)}</span>
              <div className="flex-1 flex flex-wrap gap-1">
                {r.houses.length === 0 ? (
                  <span className="text-vedicMaroon/40 italic text-[11px]">{t('kspDeep.planetSig.empty', 'no significations')}</span>
                ) : (
                  r.houses.map((h) => (
                    <span key={h} className="font-mono text-[10px] rounded bg-vedicMaroon/10 px-1.5 py-0.5 text-vedicMaroon font-semibold">
                      {h}
                    </span>
                  ))
                )}
              </div>
              <span className="text-[10px] text-vedicMaroon/50 tabular-nums">{r.houses.length}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  // ─── Ruling Planets ────────────────────────────────────────────────────────

  function RulingPlanetsView({ rp }: { rp: any | null }) {
    if (!rp) {
      const empty = t('kspDeep.rp.empty', 'Pick a moment in the Ruling Planets card (left) and click {compute}.');
      const computeText = t('kspDeep.rp.computeShort', 'Compute');
      const parts = empty.split('{compute}');
      return (
        <EmptyState>
          {parts[0]}<span className="font-semibold">{computeText}</span>{parts[1] ?? ''}
        </EmptyState>
      );
    }
    return (
      <div className="space-y-4">
        <Card title={t('kspDeep.rp.trio', 'Ruling Planets — de-duplicated trio + day-lord')}>
          <div className="flex flex-wrap gap-2">
            {rp.ruling.map((p: string) => (
              <span key={p} className="px-2.5 py-1 rounded-md bg-vedicMaroon text-white font-mono text-xs font-semibold">
                {al.planet(p)}
              </span>
            ))}
          </div>
        </Card>
        <Card title={t('kspDeep.rp.components', 'Ruling Planets — components')}>
          <table className="w-full text-xs">
            <tbody>
              <RpRow label={t('kspDeep.rp.dayLord', 'Day-lord (weekday)')}>{al.planet(rp.dayLord)}</RpRow>
              <RpRow label={t('kspDeep.rp.moonSignLord', 'Moon Sign lord')}>{al.planet(rp.moonSignLord)}</RpRow>
              <RpRow label={t('kspDeep.rp.moonStarLord', 'Moon Star lord')}>{al.planet(rp.moonStarLord)}</RpRow>
              <RpRow label={t('kspDeep.rp.moonSubLord', 'Moon Sub lord')}>{al.planet(rp.moonSubLord)}</RpRow>
              <RpRow label={t('kspDeep.rp.ascSignLord', 'Ascendant Sign lord')}>{al.planet(rp.ascSignLord)}</RpRow>
              <RpRow label={t('kspDeep.rp.ascStarLord', 'Ascendant Star lord')}>{al.planet(rp.ascStarLord)}</RpRow>
              <RpRow label={t('kspDeep.rp.ascSubLord', 'Ascendant Sub lord')}>{al.planet(rp.ascSubLord)}</RpRow>
            </tbody>
          </table>
        </Card>
      </div>
    );
  }
}

function RpRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-vedicGold/20">
      <td className="py-1 pr-4 text-vedicMaroon/60">{label}</td>
      <td className="py-1 font-mono font-semibold text-vedicMaroon">{children}</td>
    </tr>
  );
}
