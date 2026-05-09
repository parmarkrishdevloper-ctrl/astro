import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { NorthIndianChart } from '../components/charts/NorthIndianChart';
import { SouthIndianChart } from '../components/charts/SouthIndianChart';
import { ChartToggle, type ChartStyle } from '../components/charts/ChartToggle';
import { PlanetTable } from '../components/results/PlanetTable';
import { DashaTimeline } from '../components/results/DashaTimeline';
import { Card, Pill, ErrorBanner, EmptyState, PageShell } from '../components/ui/Card';
import { ClipboardPasteButton, SaveViewButton } from '../components/ui/WorkflowAtoms';
import { useT } from '../i18n';
import { api } from '../api/jyotish';
import type {
  BirthInput, KundaliResult, VimshottariResult,
  YogaResult, AllDoshasResult, ShadbalaResult,
  ChartOptions, AyanamsaInfo, HouseSystemInfo,
  VimsopakaResult, VimsopakaScheme, IshtaKashtaResult, RemedyResult,
  GocharaResult, SandhiResult,
  AshtakavargaTransitResult, DoubleTransitResult,
} from '../types';

export function KundaliPage() {
  const { t } = useT();
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [formSeed, setFormSeed] = useState<Partial<BirthInput> | undefined>(undefined);
  const [kundali, setKundali] = useState<KundaliResult | null>(null);
  const [vimshottari, setVimshottari] = useState<VimshottariResult | null>(null);
  const [yogas, setYogas] = useState<YogaResult[] | null>(null);
  const [doshas, setDoshas] = useState<AllDoshasResult | null>(null);
  const [shadbala, setShadbala] = useState<ShadbalaResult | null>(null);
  const [chalit, setChalit] = useState<Awaited<ReturnType<typeof api.chalit>>['chalit'] | null>(null);
  const [chalitMethod, setChalitMethod] = useState<'placidus' | 'sripati'>('placidus');
  const [upagrahas, setUpagrahas] = useState<Awaited<ReturnType<typeof api.upagrahas>>['upagrahas'] | null>(null);
  const [sensitivePoints, setSensitivePoints] = useState<Awaited<ReturnType<typeof api.sensitivePoints>>['sensitivePoints'] | null>(null);
  const [jaimini, setJaimini] = useState<any>(null);
  const [kp, setKp] = useState<any>(null);
  const [lifeAreas, setLifeAreas] = useState<any>(null);
  const [vimsopaka, setVimsopaka] = useState<VimsopakaResult | null>(null);
  const [vimsopakaScheme, setVimsopakaScheme] = useState<VimsopakaScheme>('shodasha');
  const [ishtaKashta, setIshtaKashta] = useState<IshtaKashtaResult | null>(null);
  const [remedies, setRemedies] = useState<RemedyResult | null>(null);
  const [gochara, setGochara] = useState<GocharaResult | null>(null);
  const [sandhi, setSandhi] = useState<SandhiResult | null>(null);
  const [avTransit, setAvTransit] = useState<AshtakavargaTransitResult | null>(null);
  const [doubleTransit, setDoubleTransit] = useState<DoubleTransitResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartStyle, setChartStyle] = useState<ChartStyle>('north');

  // Phase 8d — chart settings
  const [ayanamsa, setAyanamsa] = useState<string>('lahiri');
  const [houseSystem, setHouseSystem] = useState<string>('placidus');
  const [tropical, setTropical] = useState<boolean>(false);
  const [ayanamsaList, setAyanamsaList] = useState<AyanamsaInfo[]>([]);
  const [houseSystemList, setHouseSystemList] = useState<HouseSystemInfo[]>([]);

  // Phase 20 — rehydrate from saved view via history.state
  const location = useLocation();
  useEffect(() => {
    const saved = (location.state as any)?.savedView;
    if (saved?.snapshot?.birth) {
      setFormSeed(saved.snapshot.birth);
      if (saved.snapshot.ayanamsa)    setAyanamsa(saved.snapshot.ayanamsa);
      if (saved.snapshot.houseSystem) setHouseSystem(saved.snapshot.houseSystem);
      if (typeof saved.snapshot.tropical === 'boolean') setTropical(saved.snapshot.tropical);
    }
    // Intentionally only on mount / when navigated to — don't depend on `location.state` shape
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.ayanamsas().then((r) => setAyanamsaList(r.ayanamsas)).catch(() => {});
    api.houseSystems().then((r) => setHouseSystemList(r.systems)).catch(() => {});
  }, []);

  function withOptions(input: BirthInput): BirthInput {
    const options: ChartOptions = { ayanamsa, houseSystem, tropical };
    return { ...input, options };
  }

  async function handleSubmit(raw: BirthInput) {
    const input = withOptions(raw);
    setLoading(true); setError(null);
    setKundali(null); setVimshottari(null); setYogas(null); setDoshas(null); setShadbala(null); setChalit(null); setUpagrahas(null); setSensitivePoints(null); setJaimini(null); setKp(null); setLifeAreas(null); setVimsopaka(null); setIshtaKashta(null); setRemedies(null); setGochara(null); setSandhi(null); setAvTransit(null); setDoubleTransit(null);
    setBirth(input);
    try {
      const nowISO = new Date().toISOString();
      const threeYearsOut = new Date();
      threeYearsOut.setFullYear(threeYearsOut.getFullYear() + 3);
      const [k, v, y, d, s, c, u, sp, ji, kpRes, la, vp, ik, rm, gc, sd, avt, dt] = await Promise.all([
        api.calculate(input),
        api.vimshottari(input, true),
        api.yogas(input),
        api.doshas(input),
        api.shadbala(input),
        api.chalit(input, chalitMethod),
        api.upagrahas(input),
        api.sensitivePoints(input),
        api.jaimini(input),
        api.kp(input),
        api.lifeAreas(input),
        api.vimsopaka(input, vimsopakaScheme),
        api.ishtaKashta(input),
        api.remedies(input),
        api.gochara(input, nowISO),
        api.dashaSandhi(input, nowISO, new Date(Date.now() + 10 * 365.25 * 86400000).toISOString(), 0.05),
        api.ashtakavargaTransit(input, nowISO),
        api.doubleTransit(input, nowISO, threeYearsOut.toISOString(), 7),
      ]);
      setKundali(k.kundali);
      setVimshottari(v.vimshottari);
      setYogas(y.yogas);
      setDoshas(d.doshas);
      setShadbala(s.shadbala);
      setChalit(c.chalit);
      setUpagrahas(u.upagrahas);
      setSensitivePoints(sp.sensitivePoints);
      setJaimini(ji.jaimini);
      setKp(kpRes.kp);
      setLifeAreas(la.lifeAreas);
      setVimsopaka(vp.vimsopaka);
      setIshtaKashta(ik.ishtaKashta);
      setRemedies(rm.remedies);
      setGochara(gc.gochara);
      setSandhi(sd.sandhi);
      setAvTransit(avt.ashtakavargaTransit);
      setDoubleTransit(dt.doubleTransit);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  // Re-run when chart settings change (only after first submit)
  useEffect(() => {
    if (!birth) return;
    const { options: _drop, ...raw } = birth;
    handleSubmit(raw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ayanamsa, houseSystem, tropical]);

  async function downloadPdf() {
    if (!birth) return;
    setPdfLoading(true);
    try {
      const blob = await api.pdfKundali(birth, birth.name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kundali-${(birth.name ?? 'report').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { setError((e as Error).message); }
    finally { setPdfLoading(false); }
  }

  return (
    <PageShell title={t('kundali.title', 'Kundali')} subtitle={t('kundali.subtitle', 'The full Vedic chart analysis — every panel, every engine.')}
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <ClipboardPasteButton
            title="Paste birth details from clipboard"
            onPaste={(p) => setFormSeed({
              datetime: p.datetime,
              lat: p.lat,
              lng: p.lng,
              placeName: p.place,
            })}
          />
          {birth && (
            <SaveViewButton
              route="/kundali"
              kind="kundali-view"
              snapshot={{ birth, ayanamsa, houseSystem, tropical }}
              defaultName={birth.placeName ? `Kundali: ${birth.placeName}` : 'Kundali view'}
            />
          )}
          {kundali && (
            <button onClick={downloadPdf} disabled={pdfLoading} className="btn btn-primary">
              {pdfLoading ? t('kundali.generatingPdf', 'Generating PDF…') : `⬇ ${t('kundali.downloadPdf', 'Download PDF')}`}
            </button>
          )}
        </div>
      }>
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
      <aside className="space-y-4">
        <BirthDetailsForm onSubmit={handleSubmit} loading={loading} initialValue={formSeed} />
        <ChartSettingsCard
          ayanamsa={ayanamsa}
          houseSystem={houseSystem}
          tropical={tropical}
          ayanamsas={ayanamsaList}
          houseSystems={houseSystemList}
          onAyanamsa={setAyanamsa}
          onHouseSystem={setHouseSystem}
          onTropical={setTropical}
        />
        {kundali && <ChartSummary kundali={kundali} />}
      </aside>

      <main className="space-y-6">
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {!kundali && !loading && !error && (
          <EmptyState>{t('kundali.empty', 'Enter birth details on the left and click Generate Kundali.')}</EmptyState>
        )}
        {loading && <EmptyState>{t('kundali.computing', 'Computing chart…')}</EmptyState>}

        {kundali && (
          <>
            <div className="rounded-2xl border border-vedicGold/40 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-vedicGold/30 bg-parchment flex items-center justify-between">
                <h3 className="text-sm font-semibold text-vedicMaroon">{t('kundali.rasiChart', 'Rasi Chart (D1)')}</h3>
                <ChartToggle value={chartStyle} onChange={setChartStyle} />
              </div>
              <div className="p-5 flex justify-center">
                {chartStyle === 'north'
                  ? <NorthIndianChart kundali={kundali} />
                  : <SouthIndianChart kundali={kundali} />}
              </div>
            </div>

            <PlanetTable kundali={kundali} />

            {yogas && <YogasPanel yogas={yogas} />}
            {doshas && <DoshasPanel doshas={doshas} />}
            {shadbala && <ShadbalaPanel shadbala={shadbala} />}
            {ishtaKashta && <IshtaKashtaPanel ik={ishtaKashta} />}
            {vimsopaka && (
              <VimsopakaPanel
                vimsopaka={vimsopaka}
                scheme={vimsopakaScheme}
                onChangeScheme={async (s) => {
                  setVimsopakaScheme(s);
                  if (!birth) return;
                  try {
                    const r = await api.vimsopaka(birth, s);
                    setVimsopaka(r.vimsopaka);
                  } catch (e) { setError((e as Error).message); }
                }}
              />
            )}
            {upagrahas && <UpagrahaPanel u={upagrahas} />}
            {sensitivePoints && <SensitivePointsPanel sp={sensitivePoints} />}
            {jaimini && <JaiminiPanel j={jaimini} />}
            {kp && <KPPanel kp={kp} />}
            {lifeAreas && <LifeAreasPanel la={lifeAreas} />}
            {chalit && (
              <ChalitPanel
                chalit={chalit}
                method={chalitMethod}
                houseSystem={kundali.houseSystem}
                onChangeMethod={async (m) => {
                  setChalitMethod(m);
                  if (!birth) return;
                  try {
                    const c = await api.chalit(birth, m);
                    setChalit(c.chalit);
                  } catch (e) { setError((e as Error).message); }
                }}
              />
            )}
            {remedies && <RemediesPanel r={remedies} />}
            {gochara && <GocharaPanel g={gochara} />}
            {avTransit && <AshtakavargaTransitPanel a={avTransit} />}
            {doubleTransit && <DoubleTransitPanel d={doubleTransit} />}
            {sandhi && <SandhiPanel s={sandhi} />}
            {vimshottari && <DashaTimeline vimshottari={vimshottari} />}
          </>
        )}
      </main>
    </div>
    </PageShell>
  );
}

function ChartSummary({ kundali }: { kundali: KundaliResult }) {
  const { t, al } = useT();
  const a = kundali.ascendant;
  const isTrop = kundali.ayanamsa.mode === 'tropical';
  return (
    <div className="rounded-2xl border border-vedicGold/40 bg-white p-5 shadow-sm space-y-2 text-xs">
      <h3 className="text-sm font-semibold text-vedicMaroon mb-1">{t('chart.summary', 'Chart Summary')}</h3>
      <Row label={t('kundali.ascendant', 'Ascendant')}>{al.rashi(a.rashi.num)}</Row>
      <Row label={t('kundali.lagnaNakshatra', 'Lagna nakshatra')}>{al.nakshatra(a.nakshatra.num)} {t('common.pada', 'pada')} {a.nakshatra.pada}</Row>
      <Row label={t('chart.zodiac', 'Zodiac')}>{isTrop ? t('common.tropical', 'Tropical (Sayana)') : t('common.sidereal', 'Sidereal (Nirayana)')}</Row>
      <Row label={t('kundali.ayanamsa', 'Ayanamsa')}>{isTrop ? t('common.tropicalDash', '— (tropical)') : `${kundali.ayanamsa.name} ${kundali.ayanamsa.valueDeg.toFixed(4)}°`}</Row>
      <Row label={t('chart.houseSystem', 'House system')}>{kundali.houseSystem}</Row>
      <Row label={t('kundali.utc', 'UTC time')}>{kundali.utc}</Row>
      <Row label={t('kundali.jd', 'Julian Day')}>{kundali.jd.toFixed(4)}</Row>
    </div>
  );
}

function ChartSettingsCard({
  ayanamsa, houseSystem, tropical,
  ayanamsas, houseSystems,
  onAyanamsa, onHouseSystem, onTropical,
}: {
  ayanamsa: string;
  houseSystem: string;
  tropical: boolean;
  ayanamsas: AyanamsaInfo[];
  houseSystems: HouseSystemInfo[];
  onAyanamsa: (v: string) => void;
  onHouseSystem: (v: string) => void;
  onTropical: (v: boolean) => void;
}) {
  const { t } = useT();
  const activeAya = ayanamsas.find((a) => a.key === ayanamsa);
  const activeHouse = houseSystems.find((h) => h.key === houseSystem);
  return (
    <div className="rounded-2xl border border-vedicGold/40 bg-white p-5 shadow-sm space-y-3 text-xs">
      <h3 className="text-sm font-semibold text-vedicMaroon">{t('chart.settings', 'Chart Settings')}</h3>

      <label className="flex items-center justify-between gap-2 rounded-lg border border-vedicGold/30 px-3 py-2 cursor-pointer">
        <div>
          <div className="text-vedicMaroon font-semibold">{t('common.tropical', 'Tropical (Sayana)')}</div>
          <div className="text-[10px] text-vedicMaroon/60">{t('common.tropicalNote', 'Western zodiac — ignores ayanamsa')}</div>
        </div>
        <input
          type="checkbox"
          checked={tropical}
          onChange={(e) => onTropical(e.target.checked)}
          className="h-4 w-4 accent-vedicMaroon"
        />
      </label>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-vedicMaroon/60 mb-1">
          {t('kundali.ayanamsa', 'Ayanamsa')} {tropical && t('common.tropicalInactive', '(inactive)')}
        </label>
        <select
          value={ayanamsa}
          disabled={tropical}
          onChange={(e) => onAyanamsa(e.target.value)}
          className="w-full rounded-md border border-vedicGold/40 bg-white px-2 py-1 disabled:opacity-50"
        >
          {ayanamsas.map((a) => (
            <option key={a.key} value={a.key}>{a.name}</option>
          ))}
        </select>
        {activeAya && !tropical && (
          <p className="mt-1 text-[10px] text-vedicMaroon/60 italic">{activeAya.description}</p>
        )}
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-wider text-vedicMaroon/60 mb-1">
          {t('chart.houseSystem', 'House system')}
        </label>
        <select
          value={houseSystem}
          onChange={(e) => onHouseSystem(e.target.value)}
          className="w-full rounded-md border border-vedicGold/40 bg-white px-2 py-1"
        >
          {houseSystems.map((h) => (
            <option key={h.key} value={h.key}>{h.name}</option>
          ))}
        </select>
        {activeHouse && (
          <p className="mt-1 text-[10px] text-vedicMaroon/60 italic">{activeHouse.description}</p>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="opacity-60">{label}</span>
      <span className="text-right text-vedicMaroon">{children}</span>
    </div>
  );
}

function YogasPanel({ yogas }: { yogas: YogaResult[] }) {
  const { t, al } = useT();
  return (
    <Card title={`${t('yogas.detected', 'Yogas Detected')} (${yogas.length})`}>
      {yogas.length === 0 ? (
        <p className="text-sm text-vedicMaroon/60">{t('yogas.none', 'No major classical yogas detected.')}</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {yogas.map((y, i) => (
            <div key={i} className="rounded-lg border border-vedicGold/30 bg-parchment/30 p-3">
              <div className="flex items-center justify-between mb-1">
                <strong className="text-vedicMaroon text-sm">{al.yoga(y.name)}</strong>
                <Pill tone={y.strength === 'strong' ? 'good' : y.strength === 'weak' ? 'warn' : 'neutral'}>
                  {al.strength(y.strength)}
                </Pill>
              </div>
              <div className="text-[10px] text-vedicMaroon/50 uppercase tracking-wider mb-1">
                {t(`yogas.type.${y.type}`, y.type)} · {y.involves.map((p) => al.planet(p)).join(', ')}
              </div>
              <p className="text-xs text-vedicMaroon/80">{y.description}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DoshasPanel({ doshas }: { doshas: AllDoshasResult }) {
  const { t } = useT();
  return (
    <Card title={t('doshas.title', 'Doshas')}>
      <div className="grid md:grid-cols-3 gap-3 text-xs">
        <div className="rounded-lg border border-vedicGold/30 p-3">
          <div className="flex items-center justify-between mb-1">
            <strong className="text-vedicMaroon">{t('doshas.mangal', 'Mangal')}</strong>
            <Pill tone={doshas.mangal.hasDosha ? (doshas.mangal.cancelled ? 'warn' : 'bad') : 'good'}>
              {doshas.mangal.hasDosha
                ? (doshas.mangal.cancelled ? t('doshas.status.cancelled', 'cancelled') : t('doshas.status.present', 'present'))
                : t('doshas.status.none', 'none')}
            </Pill>
          </div>
          <p className="text-vedicMaroon/70">{t('doshas.fromLagna', 'From Lagna')}: {doshas.mangal.marsHouse.fromLagna} · {t('doshas.fromMoon', 'Moon')}: {doshas.mangal.marsHouse.fromMoon} · {t('doshas.fromVenus', 'Venus')}: {doshas.mangal.marsHouse.fromVenus}</p>
          {doshas.mangal.cancellationReasons.length > 0 && (
            <p className="text-emerald-700 mt-1 text-[11px]">{doshas.mangal.cancellationReasons.join('; ')}</p>
          )}
        </div>

        <div className="rounded-lg border border-vedicGold/30 p-3">
          <div className="flex items-center justify-between mb-1">
            <strong className="text-vedicMaroon">{t('doshas.kaalSarpa', 'Kaal Sarpa')}</strong>
            <Pill tone={doshas.kaalSarpa.hasDosha ? 'bad' : 'good'}>
              {doshas.kaalSarpa.hasDosha ? t('doshas.status.present', 'present') : t('doshas.status.none', 'none')}
            </Pill>
          </div>
          <p className="text-vedicMaroon/70">{doshas.kaalSarpa.typeLabel ?? doshas.kaalSarpa.type ?? '—'}</p>
        </div>

        <div className="rounded-lg border border-vedicGold/30 p-3">
          <div className="flex items-center justify-between mb-1">
            <strong className="text-vedicMaroon">{t('doshas.sadeSati', 'Sade Sati')}</strong>
            <Pill tone={doshas.sadeSati.active ? 'warn' : 'good'}>
              {doshas.sadeSati.active ? (doshas.sadeSati.phase ?? t('doshas.status.active', 'active')) : t('doshas.status.none', 'none')}
            </Pill>
          </div>
          <p className="text-vedicMaroon/70">{doshas.sadeSati.phaseDescription}</p>
        </div>
      </div>
    </Card>
  );
}

function ShadbalaPanel({ shadbala }: { shadbala: ShadbalaResult }) {
  const { t, al } = useT();
  const max = Math.max(...shadbala.planets.map((p) => p.totalRupas));
  const catKey = (c: string) => {
    if (c === 'very strong') return 'shad.cat.veryStrong';
    if (c === 'strong')      return 'shad.cat.strong';
    if (c === 'moderate')    return 'shad.cat.moderate';
    return 'shad.cat.weak';
  };
  return (
    <Card title={t('kundali.shadbala', 'Shadbala — Planetary Strength')}>
      <div className="space-y-2">
        {shadbala.planets.map((p) => {
          const pct = Math.round((p.totalRupas / Math.max(max, 1)) * 100);
          const tone =
            p.category === 'very strong' ? 'bg-emerald-600'
            : p.category === 'strong' ? 'bg-emerald-500'
            : p.category === 'moderate' ? 'bg-amber-500'
            : 'bg-red-500';
          return (
            <div key={p.planet} className="flex items-center gap-3 text-xs">
              <div className="w-12 font-bold text-vedicMaroon">{al.planet(p.planet)}</div>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="w-16 text-right tabular-nums">{p.totalRupas}</div>
              <div className="w-24 text-vedicMaroon/60">{t(catKey(p.category), p.category)}</div>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-vedicMaroon/60">
        {t('shad.strongest', 'Strongest')}: <strong className="text-emerald-700">{al.planet(shadbala.strongest)}</strong> · {t('shad.weakest', 'Weakest')}: <strong className="text-red-700">{al.planet(shadbala.weakest)}</strong>
      </p>
    </Card>
  );
}

function RemediesPanel({ r }: { r: RemedyResult }) {
  const { t, al } = useT();
  const [activePlanet, setActivePlanet] = useState<string | null>(null);
  const priorityTone: Record<'high' | 'medium' | 'low', string> = {
    high: 'bg-red-600 text-white',
    medium: 'bg-amber-500 text-white',
    low: 'bg-sky-500 text-white',
  };
  const priorityLabel = (p: 'high' | 'medium' | 'low') =>
    p === 'high' ? t('kundaliRemedies.priority.high', 'HIGH')
    : p === 'medium' ? t('kundaliRemedies.priority.medium', 'MEDIUM')
    : t('kundaliRemedies.priority.low', 'LOW');
  const planetIds = Object.keys(r.planets) as Array<keyof RemedyResult['planets']>;
  const selected = activePlanet ? r.planets[activePlanet as keyof RemedyResult['planets']] : null;
  return (
    <Card title={t('kundaliRemedies.title', 'Remedies (Upaya) — Classical Suggestions')}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('kundaliRemedies.disclaimer', 'Educational reference. Gemstone and ritual choices should always be confirmed by a qualified astrologer and tested personally before long-term use.')}
      </p>

      {r.suggestions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-vedicMaroon mb-2">{t('kundaliRemedies.priorityHeading', 'Priority suggestions for your chart')}</h4>
          <div className="space-y-2">
            {r.suggestions.map((s) => (
              <div key={s.planet} className="flex items-start gap-3 p-2 rounded border border-vedicMaroon/15 bg-white/60">
                <div className="w-10 text-xs font-bold text-vedicMaroon pt-0.5">{al.planet(s.planet)}</div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-vedicMaroon">{s.remedy.name}</span>
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${priorityTone[s.priority]}`}>
                      {priorityLabel(s.priority)}
                    </span>
                  </div>
                  <p className="text-vedicMaroon/70 mb-1">{s.reason}</p>
                  <p className="text-[11px]">
                    <strong>{t('kundaliRemedies.gem', 'Gem')}:</strong> {s.remedy.gem.primary} ·{' '}
                    <strong>{t('kundaliRemedies.mantra', 'Mantra')}:</strong> <em>{s.remedy.bijaMantra}</em>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {r.doshaRemedies.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-vedicMaroon mb-2">{t('kundaliRemedies.doshaSpecific', 'Dosha-specific remedies')}</h4>
          <div className="space-y-2">
            {r.doshaRemedies.map((d) => (
              <details key={d.dosha} className="text-xs rounded border border-amber-500/30 bg-amber-50/40 p-2">
                <summary className="cursor-pointer font-semibold text-amber-800">{d.dosha}</summary>
                <p className="mt-1 text-vedicMaroon/70">{d.summary}</p>
                <ul className="mt-2 list-disc list-inside space-y-0.5 text-vedicMaroon/80">
                  {d.steps.map((step, i) => <li key={i}>{step}</li>)}
                </ul>
                {d.mantra && <p className="mt-2 italic text-vedicMaroon/70">{t('kundaliRemedies.mantra', 'Mantra')}: {d.mantra}</p>}
              </details>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-xs font-semibold text-vedicMaroon mb-2">{t('kundaliRemedies.perPlanet', 'Full per-planet reference')}</h4>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {planetIds.map((pid) => (
            <button
              key={pid}
              onClick={() => setActivePlanet(activePlanet === pid ? null : pid)}
              className={`text-[11px] px-2 py-1 rounded border ${
                activePlanet === pid
                  ? 'bg-vedicMaroon text-white border-vedicMaroon'
                  : 'border-vedicMaroon/30 text-vedicMaroon hover:bg-vedicMaroon/5'
              }`}
            >
              {al.planet(pid)}
            </button>
          ))}
        </div>
        {selected && (
          <div className="text-xs border border-vedicMaroon/15 rounded p-3 bg-white/60">
            <div className="flex flex-wrap gap-x-6 gap-y-1 mb-2">
              <span><strong>{selected.name}</strong> ({selected.nameHi})</span>
              <span><strong>{t('kundaliRemedies.deity', 'Deity')}:</strong> {selected.deity}</span>
              <span><strong>{t('kundaliRemedies.day', 'Day')}:</strong> {al.vara(selected.day)}</span>
              <span><strong>{t('kundaliRemedies.direction', 'Direction')}:</strong> {selected.direction}</span>
              <span><strong>{t('kundaliRemedies.color', 'Color')}:</strong> {selected.color}</span>
            </div>
            <div className="mb-1"><strong>{t('kundaliRemedies.gem', 'Gem')}:</strong> {selected.gem.primary}
              {selected.gem.substitutes.length > 0 && <span className="text-vedicMaroon/60"> ({t('kundaliRemedies.alt', 'alt')}: {selected.gem.substitutes.join(', ')})</span>}
            </div>
            <div className="mb-1"><strong>{t('kundaliRemedies.bijaMantra', 'Bija mantra')}:</strong> <em>{selected.bijaMantra}</em></div>
            <div className="mb-1"><strong>{t('kundaliRemedies.vedicMantra', 'Vedic mantra')}:</strong> <em>{selected.vedicMantra}</em></div>
            <div className="mb-1"><strong>{t('kundaliRemedies.japaCount', 'Japa count')}:</strong> {selected.japaCount.toLocaleString()} {t('kundaliRemedies.japaSpan', 'over a 40-day mandala')}</div>
            <div className="mb-1"><strong>{t('kundaliRemedies.charity', 'Charity')}:</strong> {selected.charity.join(', ')}</div>
            <div><strong>{t('kundaliRemedies.fasting', 'Fasting')}:</strong> {al.vara(selected.fastingDay)}</div>
          </div>
        )}
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-vedicMaroon/70 hover:text-vedicMaroon">{t('kundaliRemedies.general', 'General guidance')}</summary>
        <ul className="mt-2 list-disc list-inside space-y-0.5 text-vedicMaroon/80">
          {r.general.map((g, i) => <li key={i}>{g}</li>)}
        </ul>
      </details>
    </Card>
  );
}

function IshtaKashtaPanel({ ik }: { ik: IshtaKashtaResult }) {
  const { al } = useT();
  const netTone: Record<IshtaKashtaResult['rows'][number]['netResult'], string> = {
    Auspicious: 'bg-emerald-600 text-white',
    Mixed: 'bg-amber-500 text-white',
    Inauspicious: 'bg-red-600 text-white',
  };
  return (
    <Card title="Ishta / Kashta Phala — Auspicious vs Inauspicious Effects">
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        Ishta = √(Cheshta × Uchcha); Kashta = √((60−Cheshta) × (60−Uchcha)). Virupas, 0–60.
      </p>
      <div className="space-y-1.5">
        {ik.rows.map((r) => {
          const ishtaPct = (r.ishta / 60) * 100;
          const kashtaPct = (r.kashta / 60) * 100;
          return (
            <div key={r.planet} className="flex items-center gap-3 text-xs">
              <div className="w-10 font-bold text-vedicMaroon">{al.planet(r.planet)}</div>
              <div className="flex-1 flex h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${ishtaPct/2}%` }} title={`Ishta ${r.ishta.toFixed(2)}`} />
                <div className="h-full bg-red-500 ml-auto" style={{ width: `${kashtaPct/2}%` }} title={`Kashta ${r.kashta.toFixed(2)}`} />
              </div>
              <div className="w-14 text-right tabular-nums text-emerald-700">+{r.ishta.toFixed(1)}</div>
              <div className="w-14 text-right tabular-nums text-red-700">−{r.kashta.toFixed(1)}</div>
              <div className={`w-24 text-center text-[10px] font-semibold rounded px-1.5 py-0.5 ${netTone[r.netResult]}`}>
                {r.netResult}
              </div>
            </div>
          );
        })}
      </div>

      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-vedicMaroon/70 hover:text-vedicMaroon">
          Uchcha / Cheshta components
        </summary>
        <table className="w-full mt-2 text-[11px] border-collapse">
          <thead>
            <tr className="text-vedicMaroon/70">
              <th className="text-left py-1 pr-2">Planet</th>
              <th className="text-right py-1 px-2">Uchcha</th>
              <th className="text-right py-1 px-2">Cheshta</th>
              <th className="text-right py-1 px-2">Ishta</th>
              <th className="text-right py-1 px-2">Kashta</th>
            </tr>
          </thead>
          <tbody>
            {ik.rows.map((r) => (
              <tr key={r.planet} className="border-t border-vedicMaroon/10">
                <td className="py-1 pr-2 font-bold text-vedicMaroon">{al.planet(r.planet)}</td>
                <td className="text-right py-1 px-2 tabular-nums">{r.uchchaBala.toFixed(2)}</td>
                <td className="text-right py-1 px-2 tabular-nums">{r.cheshtaBala.toFixed(2)}</td>
                <td className="text-right py-1 px-2 tabular-nums text-emerald-700">{r.ishta.toFixed(2)}</td>
                <td className="text-right py-1 px-2 tabular-nums text-red-700">{r.kashta.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <p className="mt-3 text-[11px] text-vedicMaroon/60">
        Most Auspicious: <strong className="text-emerald-700">{al.planet(ik.mostAuspicious)}</strong> · Most Inauspicious: <strong className="text-red-700">{al.planet(ik.mostInauspicious)}</strong>
      </p>
    </Card>
  );
}

const DIGNITY_GLYPH: Record<string, string> = {
  Exalted: 'E', Own: 'O', Vargottama: 'V',
  Friend: 'F', Neutral: 'N', Enemy: 'X', Debilitated: 'D',
};

function VimsopakaPanel({
  vimsopaka, scheme, onChangeScheme,
}: {
  vimsopaka: VimsopakaResult;
  scheme: VimsopakaScheme;
  onChangeScheme: (s: VimsopakaScheme) => void;
}) {
  const { al } = useT();
  const catTone: Record<VimsopakaResult['rows'][number]['category'], string> = {
    Purna: 'bg-emerald-600 text-white',
    Uttama: 'bg-emerald-500 text-white',
    Gopura: 'bg-amber-500 text-white',
    Simhasana: 'bg-amber-400 text-vedicMaroon',
    Paravata: 'bg-red-400 text-white',
    Iravata: 'bg-red-600 text-white',
  };
  const barTone = (c: VimsopakaResult['rows'][number]['category']) =>
    c === 'Purna' ? 'bg-emerald-600'
    : c === 'Uttama' ? 'bg-emerald-500'
    : c === 'Gopura' ? 'bg-amber-500'
    : c === 'Simhasana' ? 'bg-amber-400'
    : c === 'Paravata' ? 'bg-red-400'
    : 'bg-red-600';
  const dignityTone: Record<string, string> = {
    Exalted: 'text-emerald-700',
    Own: 'text-emerald-600',
    Vargottama: 'text-emerald-700',
    Friend: 'text-sky-700',
    Neutral: 'text-slate-600',
    Enemy: 'text-orange-700',
    Debilitated: 'text-red-700',
  };
  return (
    <Card
      title={`Vimsopaka Bala — ${vimsopaka.meta.name}`}
      action={
        <select
          value={scheme}
          onChange={(e) => onChangeScheme(e.target.value as VimsopakaScheme)}
          className="text-xs border border-vedicMaroon/30 rounded px-2 py-1 bg-white"
        >
          <option value="shad">Shad Varga (6)</option>
          <option value="sapta">Sapta Varga (7)</option>
          <option value="dasha">Dasha Varga (10)</option>
          <option value="shodasha">Shodasha Varga (16)</option>
        </select>
      }
    >
      <p className="text-[11px] text-vedicMaroon/60 mb-3">{vimsopaka.meta.purpose}</p>

      <div className="space-y-1.5 mb-4">
        {vimsopaka.rows.map((r) => {
          const pct = (r.total / 20) * 100;
          return (
            <div key={r.planet} className="flex items-center gap-3 text-xs">
              <div className="w-10 font-bold text-vedicMaroon">{al.planet(r.planet)}</div>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${barTone(r.category)}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="w-14 text-right tabular-nums">{r.total.toFixed(2)}/20</div>
              <div className={`w-20 text-center text-[10px] font-semibold rounded px-1.5 py-0.5 ${catTone[r.category]}`}>
                {r.category}
              </div>
            </div>
          );
        })}
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-vedicMaroon/70 hover:text-vedicMaroon">
          Per-varga breakdown
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="text-vedicMaroon/70">
                <th className="text-left py-1 pr-2">Planet</th>
                {vimsopaka.rows[0]?.cells.map((c) => (
                  <th key={c.varga} className="text-center py-1 px-1">
                    {c.varga}<br/>
                    <span className="text-[9px] text-vedicMaroon/50">×{c.weight}</span>
                  </th>
                ))}
                <th className="text-right py-1 pl-2">Σ</th>
              </tr>
            </thead>
            <tbody>
              {vimsopaka.rows.map((r) => (
                <tr key={r.planet} className="border-t border-vedicMaroon/10">
                  <td className="py-1 pr-2 font-bold text-vedicMaroon">{al.planet(r.planet)}</td>
                  {r.cells.map((c) => (
                    <td key={c.varga} className="text-center py-1 px-1" title={`${c.rashiName} · ${c.dignity} · ${c.points} pts → ${c.contribution.toFixed(2)}`}>
                      <span className={dignityTone[c.dignity] ?? 'text-slate-600'}>
                        {DIGNITY_GLYPH[c.dignity]}
                      </span>
                      {c.vargottama && !['Vargottama'].includes(c.dignity) && <span className="text-emerald-700">*</span>}
                    </td>
                  ))}
                  <td className="text-right py-1 pl-2 tabular-nums font-semibold">{r.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-vedicMaroon/60 mt-2">
            Letters: E=Exalted, O=Own, V=Vargottama, F=Friend, N=Neutral, X=Enemy, D=Debilitated. * marks vargottama.
          </p>
        </div>
      </details>

      <p className="mt-3 text-[11px] text-vedicMaroon/60">
        Strongest: <strong className="text-emerald-700">{al.planet(vimsopaka.strongest)}</strong> · Weakest: <strong className="text-red-700">{al.planet(vimsopaka.weakest)}</strong>
      </p>
    </Card>
  );
}

function fmtDeg(d: number): string {
  const deg = Math.floor(d);
  const mF = (d - deg) * 60;
  const min = Math.floor(mF);
  const sec = Math.round((mF - min) * 60);
  return `${deg}° ${String(min).padStart(2, '0')}′ ${String(sec).padStart(2, '0')}″`;
}

type UpagrahaData = NonNullable<Awaited<ReturnType<typeof api.upagrahas>>['upagrahas']>;

function UpagrahaPanel({ u }: { u: UpagrahaData }) {
  const { t, al } = useT();
  const allPoints = [
    ...(u.gulika ? [u.gulika] : []),
    ...(u.mandi  ? [u.mandi]  : []),
    ...u.kalaGroup,
  ];
  return (
    <Card title={t('upagraha.title', 'Upagrahas — {n} shadow sensitive points').replace('{n}', String(allPoints.length))}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
              <th className="py-1">{t('common.point', 'Point')}</th>
              <th>{t('common.longitude', 'Longitude')}</th>
              <th>{t('common.rashi', 'Rashi')}</th>
              <th>{t('common.nakshatra', 'Nakshatra')}</th>
              <th>{t('common.house', 'House')}</th>
              <th>{t('common.formula', 'Formula')}</th>
            </tr>
          </thead>
          <tbody>
            {allPoints.map((p) => {
              const isGulikaMandi = p.id === 'GULIKA' || p.id === 'MANDI';
              return (
                <tr key={p.id} className={`border-b border-vedicGold/10 ${isGulikaMandi ? 'bg-rose-50' : ''}`}>
                  <td className="py-1 font-bold text-vedicMaroon">{p.name}</td>
                  <td className="tabular-nums">{fmtDeg(p.longitude)}</td>
                  <td>{al.rashi(p.rashi.num)} · {fmtDeg(p.rashi.degInRashi)}</td>
                  <td>{al.nakshatra(p.nakshatra.num)} {t('common.pada', 'pada')} {p.nakshatra.pada}</td>
                  <td className="tabular-nums font-semibold">{p.house}</td>
                  <td className="text-vedicMaroon/60 italic">{p.formula}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {u.saturnSegment.segmentNumber != null && (
        <p className="mt-3 text-[11px] text-vedicMaroon/60">
          {u.saturnSegment.isDayBirth ? t('upagraha.day', 'Day') : t('upagraha.night', 'Night')} {t('upagraha.birth', 'birth.')}{' '}
          {t('upagraha.saturnRules', 'Saturn rules segment')} <strong>{u.saturnSegment.segmentNumber}</strong> {t('upagraha.of8', 'of 8')}
          {u.saturnSegment.startUTC && (
            <> · {new Date(u.saturnSegment.startUTC).toUTCString()} → {new Date(u.saturnSegment.endUTC!).toUTCString()}</>
          )}.
        </p>
      )}
    </Card>
  );
}

function LifeAreasPanel({ la }: { la: any }) {
  const { t } = useT();
  const areas = [la.medical, la.career, la.progeny, la.wealth];
  return (
    <Card title={t('lifeAreas.title', 'Life Areas — Medical · Career · Progeny · Wealth')}>
      <div className="grid md:grid-cols-2 gap-4">
        {areas.map((r: any) => {
          const tone = r.score >= 75 ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : r.score >= 55 ? 'bg-amber-50 border-amber-300 text-amber-900'
            : r.score >= 35 ? 'bg-orange-50 border-orange-300 text-orange-900'
            : 'bg-red-50 border-red-300 text-red-900';
          return (
            <div key={r.area} className={`border rounded-lg p-3 ${tone}`}>
              <div className="flex justify-between items-start">
                <div>
                  {/* TODO(i18n-server): localize r.label */}
                  <div className="text-sm font-bold" lang="en">{r.label}</div>
                  <div className="text-[11px] opacity-70">{t('lifeAreas.houses', 'Houses')}: {r.housesConsidered.join(', ')}</div>
                </div>
                <div className="text-2xl font-bold tabular-nums">{r.score}</div>
              </div>
              {/* TODO(i18n-server): localize r.summary */}
              <p className="text-xs mt-2 italic" lang="en">{r.summary}</p>
              <details className="mt-2">
                <summary className="text-[11px] cursor-pointer opacity-80">{t('lifeAreas.factors', '{n} factors').replace('{n}', String(r.factors.length))}</summary>
                <ul className="mt-1 text-[11px] space-y-0.5">
                  {r.factors.map((f: any, i: number) => (
                    <li key={i} className={f.kind === 'positive' ? 'text-emerald-800' : 'text-red-800'}>
                      {/* TODO(i18n-server): localize f.text */}
                      {f.kind === 'positive' ? '+' : '−'}{Math.abs(f.weight)} · <span lang="en">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function KPPanel({ kp }: { kp: any }) {
  const { t, al } = useT();
  return (
    <Card title={t('kp.title', 'KP (Krishnamurti Paddhati) — {p} planets, {c} cusps')
      .replace('{p}', String(kp.planets?.length ?? 0))
      .replace('{c}', String(kp.cusps?.length ?? 0))}>
      <div className="grid md:grid-cols-2 gap-4 text-xs">
        <div>
          <h4 className="text-vedicMaroon font-semibold mb-2 uppercase text-[10px] tracking-wider">{t('kp.planetLords', 'Planet Lords (Sign / Star / Sub / Sub-Sub)')}</h4>
          <table className="w-full">
            <thead>
              <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                <th className="py-1">{t('kp.graha', 'Graha')}</th><th>{t('common.sign', 'Sign')}</th><th>{t('kp.star', 'Star')}</th><th>{t('kp.sub', 'Sub')}</th><th>{t('kp.subSub', 'S-Sub')}</th>
              </tr>
            </thead>
            <tbody>
              {(kp.planets ?? []).map((p: any) => (
                <tr key={p.id} className="border-b border-vedicGold/10">
                  <td className="py-1 font-bold text-vedicMaroon">{al.planet(p.id)}</td>
                  <td>{al.planet(p.signLord)}</td>
                  <td>{al.planet(p.starLord)}</td>
                  <td>{al.planet(p.subLord)}</td>
                  <td className="text-vedicMaroon/70">{al.planet(p.subSubLord)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4 className="text-vedicMaroon font-semibold mb-2 uppercase text-[10px] tracking-wider">{t('kp.cuspLords', 'Cusp Lords')}</h4>
          <table className="w-full">
            <thead>
              <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                <th className="py-1">{t('common.houseShort', 'H')}</th><th>{t('common.sign', 'Sign')}</th><th>{t('kp.star', 'Star')}</th><th>{t('kp.sub', 'Sub')}</th><th>{t('kp.subSub', 'S-Sub')}</th>
              </tr>
            </thead>
            <tbody>
              {(kp.cusps ?? []).map((c: any) => (
                <tr key={c.house} className="border-b border-vedicGold/10">
                  <td className="py-1 font-bold text-vedicMaroon">{c.house}</td>
                  <td>{al.planet(c.signLord)}</td>
                  <td>{al.planet(c.starLord)}</td>
                  <td>{al.planet(c.subLord)}</td>
                  <td className="text-vedicMaroon/70">{al.planet(c.subSubLord)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4">
        <h4 className="text-vedicMaroon font-semibold mb-2 uppercase text-[10px] tracking-wider">
          {t('kp.cuspSignificators', 'Cusp Significators — A (planets in star of occupants) · B (occupants) · C (in star of house lord) · D (house lord)')}
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                <th className="py-1">{t('common.houseShort', 'H')}</th>
                <th className="text-emerald-700">{t('kp.colA', 'A')}</th>
                <th className="text-emerald-600">{t('kp.colB', 'B')}</th>
                <th className="text-amber-700">{t('kp.colC', 'C')}</th>
                <th className="text-vedicMaroon/70">{t('kp.colD', 'D')}</th>
              </tr>
            </thead>
            <tbody>
              {(kp.cuspSignificators ?? []).map((c: any) => (
                <tr key={c.house} className="border-b border-vedicGold/10">
                  <td className="py-1 font-bold text-vedicMaroon">{c.house}</td>
                  <td className="text-emerald-700">{c.A.map((id: string) => al.planet(id)).join(' ') || '—'}</td>
                  <td className="text-emerald-600">{c.B.map((id: string) => al.planet(id)).join(' ') || '—'}</td>
                  <td className="text-amber-700">{c.C.map((id: string) => al.planet(id)).join(' ') || '—'}</td>
                  <td className="text-vedicMaroon/70">{c.D.map((id: string) => al.planet(id)).join(' ') || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}

function JaiminiPanel({ j }: { j: any }) {
  const { t, al } = useT();
  const presentYogas = (j.rajaYogas ?? []).filter((y: any) => y.present);
  const longevityKey = (s: string) =>
    s === 'long' ? t('jaiminiPanel.longevity.long', 'long')
    : s === 'medium' ? t('jaiminiPanel.longevity.medium', 'medium')
    : s === 'short' ? t('jaiminiPanel.longevity.short', 'short')
    : s ?? '—';
  return (
    <Card title={t('jaiminiPanel.title', 'Jaimini — {k} karakas · {y} Raja yoga(s) · longevity: {l}')
      .replace('{k}', String(j.karakas?.length ?? 0))
      .replace('{y}', String(presentYogas.length))
      .replace('{l}', longevityKey(j.longevity?.overall ?? ''))}>
      <div className="grid md:grid-cols-2 gap-4 text-xs">
        <div>
          <h4 className="text-vedicMaroon font-semibold mb-2 uppercase text-[10px] tracking-wider">{t('jaiminiPanel.charaKarakas', 'Chara Karakas')}</h4>
          <table className="w-full">
            <thead>
              <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                <th className="py-1">{t('common.role', 'Role')}</th><th>{t('common.planet', 'Planet')}</th><th>{t('common.deg', 'Deg')}</th>
              </tr>
            </thead>
            <tbody>
              {j.karakas?.map((c: any) => (
                <tr key={c.karaka} className="border-b border-vedicGold/10">
                  <td className="py-1"><strong className="text-vedicMaroon">{c.karaka}</strong> <span className="text-vedicMaroon/60">{al.karaka(c.karaka)}</span></td>
                  <td className="font-bold">{al.planet(c.planet)}</td>
                  <td className="tabular-nums">{fmtDeg(c.degInRashi)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4 className="text-vedicMaroon font-semibold mb-2 uppercase text-[10px] tracking-wider">{t('jaiminiPanel.timeLagnas', 'Time Lagnas')}</h4>
          <table className="w-full">
            <thead>
              <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                <th className="py-1">{t('common.lagna', 'Lagna')}</th><th>{t('common.rashi', 'Rashi')}</th><th>{t('common.house', 'House')}</th>
              </tr>
            </thead>
            <tbody>
              {(j.timeLagnas?.lagnas ?? []).map((l: any) => (
                <tr key={l.id} className="border-b border-vedicGold/10">
                  <td className="py-1 font-bold text-vedicMaroon">{l.name}</td>
                  <td>{al.rashi(l.rashi.num)}</td>
                  <td className="tabular-nums font-semibold">{l.house}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4">
        <h4 className="text-vedicMaroon font-semibold mb-2 uppercase text-[10px] tracking-wider">{t('jaiminiPanel.rajaYogas', 'Raja Yogas')}</h4>
        <div className="grid md:grid-cols-2 gap-2">
          {(j.rajaYogas ?? []).map((y: any) => (
            <div key={y.id} className={`flex items-start gap-2 text-xs p-2 rounded border ${y.present ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
              <span className={y.present ? 'text-emerald-700 font-bold' : 'text-slate-400'}>{y.present ? '✓' : '○'}</span>
              <div>
                <div className="font-semibold text-vedicMaroon">{al.yoga(y.name)}</div>
                {/* TODO(i18n-server): localize y.details */}
                <div className="text-vedicMaroon/60 text-[11px]" lang="en">{y.details}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <h4 className="text-vedicMaroon font-semibold mb-2 uppercase text-[10px] tracking-wider">{t('jaiminiPanel.longevityHeading', 'Longevity')} — <span className={
          j.longevity?.overall === 'long' ? 'text-emerald-700' :
          j.longevity?.overall === 'medium' ? 'text-amber-700' : 'text-red-700'
        }>{longevityKey(j.longevity?.overall ?? '')}</span></h4>
        <table className="w-full text-xs">
          <thead><tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30"><th className="py-1">{t('jaiminiPanel.pair', 'Pair')}</th><th>{t('jaiminiPanel.signs', 'Signs')}</th><th>{t('jaiminiPanel.span', 'Span')}</th></tr></thead>
          <tbody>
            {(j.longevity?.pairs ?? []).map((p: any) => (
              <tr key={p.id} className="border-b border-vedicGold/10">
                {/* TODO(i18n-server): localize p.label */}
                <td className="py-1" lang="en">{p.label}</td>
                <td className="tabular-nums">{p.signA} / {p.signB}</td>
                {/* TODO(i18n-server): localize p.span */}
                <td className="text-vedicMaroon" lang="en">{p.span}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

type SPData = NonNullable<Awaited<ReturnType<typeof api.sensitivePoints>>['sensitivePoints']>;

function SensitivePointsPanel({ sp }: { sp: SPData }) {
  const { t, al } = useT();
  return (
    <Card title={t('sensitivePts.title', 'Sensitive Points — {n} ({when} birth)')
      .replace('{n}', String(sp.points.length))
      .replace('{when}', sp.isDayBirth ? t('sensitivePts.day', 'day') : t('sensitivePts.night', 'night'))}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
              <th className="py-1">{t('common.point', 'Point')}</th><th>{t('common.longitude', 'Longitude')}</th><th>{t('common.rashi', 'Rashi')}</th>
              <th>{t('common.nakshatra', 'Nakshatra')}</th><th>{t('common.house', 'House')}</th><th>{t('sensitivePts.formulaNote', 'Formula / note')}</th>
            </tr>
          </thead>
          <tbody>
            {sp.points.map((p) => (
              <tr key={p.id} className="border-b border-vedicGold/10">
                <td className="py-1 font-bold text-vedicMaroon">{p.name}</td>
                <td className="tabular-nums">{fmtDeg(p.longitude)}</td>
                <td>{al.rashi(p.rashi.num)} · {fmtDeg(p.rashi.degInRashi)}</td>
                <td>{al.nakshatra(p.nakshatra.num)} {t('common.pada', 'pada')} {p.nakshatra.pada}</td>
                <td className="tabular-nums font-semibold">{p.house}</td>
                {/* TODO(i18n-server): localize p.description */}
                <td className="text-vedicMaroon/60 italic" lang="en">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {(sp.preNatalEclipses.solar || sp.preNatalEclipses.lunar) && (
        <div className="mt-4 pt-3 border-t border-vedicGold/30 space-y-1 text-[11px] text-vedicMaroon/70">
          <h4 className="text-vedicMaroon font-semibold uppercase text-[10px] tracking-wider mb-2">{t('sensitivePts.preNatalEclipses', 'Pre-natal eclipses')}</h4>
          {sp.preNatalEclipses.solar && (
            <div>
              <strong>{t('sensitivePts.solar', 'Solar')}:</strong>{' '}
              {new Date(sp.preNatalEclipses.solar.utc).toUTCString()}
              {' · '}{al.planet('SU')} {fmtDeg(sp.preNatalEclipses.solar.sunLongitude)} ({al.rashi(sp.preNatalEclipses.solar.rashiSun.num)})
              {' · '}{Math.round(sp.preNatalEclipses.solar.daysBeforeBirth)} {t('sensitivePts.daysBeforeBirth', 'days before birth')}
            </div>
          )}
          {sp.preNatalEclipses.lunar && (
            <div>
              <strong>{t('sensitivePts.lunar', 'Lunar')}:</strong>{' '}
              {new Date(sp.preNatalEclipses.lunar.utc).toUTCString()}
              {' · '}{al.planet('MO')} {fmtDeg(sp.preNatalEclipses.lunar.moonLongitude)} ({al.rashi(sp.preNatalEclipses.lunar.rashiMoon.num)})
              {' · '}{Math.round(sp.preNatalEclipses.lunar.daysBeforeBirth)} {t('sensitivePts.daysBeforeBirth', 'days before birth')}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

type ChalitData = NonNullable<Awaited<ReturnType<typeof api.chalit>>['chalit']>;

function ChalitPanel({
  chalit, method, houseSystem, onChangeMethod,
}: {
  chalit: ChalitData;
  method: 'placidus' | 'sripati';
  houseSystem: string;
  onChangeMethod: (m: 'placidus' | 'sripati') => void;
}) {
  const { t, al } = useT();
  const shiftCount = chalit.shiftedPlanets.length;
  const shiftWord = (d: string) =>
    d === 'forward' ? t('chalit.shift.forward', 'forward')
    : d === 'backward' ? t('chalit.shift.backward', 'backward')
    : '—';
  const methodName = (m: string) => m === 'placidus' ? t('chalit.method.placidus', 'Placidus') : t('chalit.method.sripati', 'Sripati');
  return (
    <Card
      title={t('chalit.title', 'Bhava Chalit — {m} method on {h} cusps ({n} {label} shifted)')
        .replace('{m}', methodName(method))
        .replace('{h}', houseSystem)
        .replace('{n}', String(shiftCount))
        .replace('{label}', shiftCount === 1 ? t('chalit.planet', 'planet') : t('chalit.planets', 'planets'))}
      action={
        <div className="flex gap-1 text-[11px]">
          {(['placidus', 'sripati'] as const).map((m) => (
            <button
              key={m}
              onClick={() => onChangeMethod(m)}
              className={`px-2 py-1 rounded border ${method === m
                ? 'bg-vedicMaroon text-white border-vedicMaroon'
                : 'bg-white text-vedicMaroon border-vedicGold/40 hover:bg-parchment'}`}
            >
              {methodName(m)}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid md:grid-cols-2 gap-4 text-xs">
        <div>
          <h4 className="text-vedicMaroon font-semibold mb-2 uppercase text-[10px] tracking-wider">{t('chalit.bhavaCusps', 'Bhava cusps')}</h4>
          <table className="w-full">
            <thead>
              <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                <th className="py-1">{t('chalit.bhShort', 'Bh.')}</th><th>{t('chalit.cuspMid', 'Cusp (mid)')}</th><th>{t('common.rashi', 'Rashi')}</th>
              </tr>
            </thead>
            <tbody>
              {chalit.bhavas.map((b) => (
                <tr key={b.num} className="border-b border-vedicGold/10">
                  <td className="py-1 font-bold text-vedicMaroon">{b.num}</td>
                  <td className="tabular-nums">{fmtDeg(b.midpoint)}</td>
                  <td>{al.rashi(b.rashiAtMid.num)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <h4 className="text-vedicMaroon font-semibold mb-2 uppercase text-[10px] tracking-wider">{t('chalit.planetHouse', 'Planet house (WS → Chalit)')}</h4>
          <table className="w-full">
            <thead>
              <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                <th className="py-1">{t('kp.graha', 'Graha')}</th><th>{t('chalit.ws', 'WS')}</th><th>{t('chalit.chalit', 'Chalit')}</th><th>{t('chalit.shift', 'Shift')}</th>
              </tr>
            </thead>
            <tbody>
              {chalit.planets.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-vedicGold/10 ${p.shifted ? 'bg-amber-50' : ''}`}
                >
                  <td className="py-1 font-bold text-vedicMaroon">{al.planet(p.id)}</td>
                  <td className="tabular-nums">{p.wholeSignHouse}</td>
                  <td className="tabular-nums font-semibold">{p.chalitHouse}</td>
                  <td className={
                    p.shiftDirection === 'forward' ? 'text-emerald-700'
                    : p.shiftDirection === 'backward' ? 'text-amber-700'
                    : 'text-vedicMaroon/40'
                  }>
                    {p.shiftDirection === 'same' ? '—' : shiftWord(p.shiftDirection)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-3 text-[11px] text-vedicMaroon/60 italic">
        {method === 'placidus'
          ? t('chalit.note.placidus', 'Placidus: the cusp marks the START of each bhava. KP & most Western software.')
          : t('chalit.note.sripati', 'Sripati: the cusp is the MIDDLE of each bhava (classical Parashara).')}
      </p>
    </Card>
  );
}

function GocharaPanel({ g }: { g: GocharaResult }) {
  const { t, al } = useT();
  const favCount = g.rows.filter((r) => r.netResult === 'favorable').length;
  const cancelledCount = g.rows.filter((r) => r.netResult === 'cancelled').length;
  const unfavCount = g.rows.filter((r) => r.netResult === 'unfavorable').length;
  const netTone: Record<GocharaResult['rows'][number]['netResult'], string> = {
    favorable: 'bg-emerald-600 text-white',
    cancelled: 'bg-amber-500 text-white',
    unfavorable: 'bg-red-600 text-white',
    neutral: 'bg-slate-400 text-white',
  };
  const netLabel = (n: GocharaResult['rows'][number]['netResult']) =>
    n === 'favorable' ? t('gochara.net.favorable', 'favorable')
    : n === 'cancelled' ? t('gochara.net.cancelled', 'cancelled')
    : n === 'unfavorable' ? t('gochara.net.unfavorable', 'unfavorable')
    : t('gochara.net.neutral', 'neutral');
  return (
    <Card title={t('gochara.title', 'Gochara Phala — Transit from natal Moon ({sign})').replace('{sign}', al.rashi(g.moonSign))}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('gochara.snapshotAt', 'Snapshot at')} {new Date(g.whenUTC).toLocaleString()}. {favCount} {t('gochara.summary.favorable', 'favorable')} · {cancelledCount} {t('gochara.summary.cancelledByVedha', 'cancelled by Vedha')} · {unfavCount} {t('gochara.summary.unfavorable', 'unfavorable')}.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
              <th className="py-1">{t('common.planet', 'Planet')}</th>
              <th>{t('gochara.transitSign', 'Transit Sign')}</th>
              <th className="text-center">{t('common.house', 'House')}<br/><span className="text-[9px]">{t('gochara.fromMoon', 'from Moon')}</span></th>
              <th className="text-center">{t('gochara.net', 'Net')}</th>
              <th>{t('gochara.vedha', 'Vedha')}</th>
              <th>{t('gochara.reading', 'Reading')}</th>
            </tr>
          </thead>
          <tbody>
            {g.rows.map((r) => (
              <tr key={r.planet} className="border-b border-vedicGold/10">
                <td className="py-1 font-bold text-vedicMaroon">{al.planet(r.planet)}</td>
                <td>{al.rashi(r.transitSign)}</td>
                <td className="text-center tabular-nums font-semibold">{r.houseFromMoon}</td>
                <td className="text-center">
                  <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${netTone[r.netResult]}`}>
                    {netLabel(r.netResult)}
                  </span>
                </td>
                <td className="text-[11px] text-vedicMaroon/70">
                  {r.vedhaActive ? `${t('gochara.by', 'by')} ${al.planet(r.vedhaBy ?? '')}` : '—'}
                </td>
                {/* TODO(i18n-server): localize r.interpretation */}
                <td className="text-[11px] text-vedicMaroon/80 italic" lang="en">{r.interpretation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function AshtakavargaTransitPanel({ a }: { a: AshtakavargaTransitResult }) {
  const { t, al } = useT();
  const verdictTone: Record<AshtakavargaTransitResult['rows'][number]['verdict'], string> = {
    'very strong': 'bg-emerald-600 text-white',
    'strong': 'bg-emerald-500 text-white',
    'moderate': 'bg-amber-500 text-white',
    'weak': 'bg-red-400 text-white',
    'very weak': 'bg-red-600 text-white',
  };
  const barTone = (v: AshtakavargaTransitResult['rows'][number]['verdict']) =>
    v === 'very strong' ? 'bg-emerald-600'
    : v === 'strong' ? 'bg-emerald-500'
    : v === 'moderate' ? 'bg-amber-500'
    : v === 'weak' ? 'bg-red-400' : 'bg-red-600';
  const verdictLabel = (v: AshtakavargaTransitResult['rows'][number]['verdict']) =>
    v === 'very strong' ? t('avTransit.verdict.veryStrong', 'very strong')
    : v === 'strong' ? t('avTransit.verdict.strong', 'strong')
    : v === 'moderate' ? t('avTransit.verdict.moderate', 'moderate')
    : v === 'weak' ? t('avTransit.verdict.weak', 'weak')
    : t('avTransit.verdict.veryWeak', 'very weak');
  return (
    <Card title={t('avTransit.title', 'Ashtakavarga Transit Strength — Natal SAV total {n}').replace('{n}', String(a.natalSAVTotal))}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('avTransit.snapshotAt', 'Snapshot at')} {new Date(a.whenUTC).toLocaleString()}. {t('avTransit.classical', 'Classical: own-BAV ≥ 5 or SAV ≥ 28 = transit carries weight.')}
      </p>
      <div className="space-y-1.5 mb-3">
        {a.rows.map((r) => (
          <div key={r.planet} className="flex items-center gap-3 text-xs">
            <div className="w-10 font-bold text-vedicMaroon">{al.planet(r.planet)}</div>
            <div className="w-24 text-[11px] text-vedicMaroon/70">{al.rashi(r.transitSign)}</div>
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${barTone(r.verdict)}`} style={{ width: `${r.strengthScore}%` }} />
            </div>
            <div className="w-14 text-right tabular-nums">{r.strengthScore.toFixed(0)}</div>
            <div className="w-10 text-right tabular-nums text-[11px]">{r.ownBindus}/8</div>
            <div className="w-12 text-right tabular-nums text-[11px] text-vedicMaroon/70">{r.sarvaBindus}/56</div>
            <div className={`w-20 text-center text-[10px] font-semibold rounded px-1.5 py-0.5 ${verdictTone[r.verdict]}`}>
              {verdictLabel(r.verdict)}
            </div>
          </div>
        ))}
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-vedicMaroon/70 hover:text-vedicMaroon">{t('avTransit.readings', 'Readings')}</summary>
        <ul className="mt-2 list-disc list-inside space-y-0.5 text-vedicMaroon/80 text-[11px]">
          {/* TODO(i18n-server): localize r.interpretation */}
          {a.rows.map((r) => <li key={r.planet} lang="en">{r.interpretation}</li>)}
        </ul>
      </details>
    </Card>
  );
}

function DoubleTransitPanel({ d }: { d: DoubleTransitResult }) {
  const { t, al } = useT();
  return (
    <Card title={t('doubleTransit.title', 'Double Transit (K.N. Rao) — {n} Jupiter+Saturn windows').replace('{n}', String(d.events.length))}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('doubleTransit.note', 'Windows where both Jupiter and Saturn influence the same house from Lagna ({lagna}) or Moon ({moon}).')
          .replace('{lagna}', al.rashi(d.natalLagnaSign))
          .replace('{moon}', al.rashi(d.natalMoonSign))}{' '}
        {t('doubleTransit.scanned', 'Scanned')} {new Date(d.from).toLocaleDateString()} → {new Date(d.to).toLocaleDateString()}.
      </p>
      {d.events.length === 0 ? (
        <p className="text-sm text-vedicMaroon/60">{t('doubleTransit.empty', 'No overlapping Jupiter+Saturn influences detected in this window.')}</p>
      ) : (
        <div className="space-y-2">
          {d.events.map((ev, i) => (
            <details key={i} className="rounded border border-vedicMaroon/15 bg-white/60 text-xs">
              <summary className="cursor-pointer p-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="font-semibold text-vedicMaroon">{new Date(ev.date).toLocaleDateString()}</span>
                <span className="text-vedicMaroon/70">{t('doubleTransit.jup', 'Jup')} {al.rashi(ev.jupiterSign)} · {t('doubleTransit.sat', 'Sat')} {al.rashi(ev.saturnSign)}</span>
                {ev.houseFromLagna.length > 0 && (
                  <span className="text-emerald-700">{t('common.lagna', 'Lagna')} {t('common.houseShort', 'H')}{ev.houseFromLagna.join(',')}</span>
                )}
                {ev.houseFromMoon.length > 0 && (
                  <span className="text-sky-700">{t('doubleTransit.moon', 'Moon')} {t('common.houseShort', 'H')}{ev.houseFromMoon.join(',')}</span>
                )}
              </summary>
              <div className="px-3 pb-3 pt-1 border-t border-vedicMaroon/10">
                <ul className="list-disc list-inside space-y-0.5 text-vedicMaroon/80">
                  {/* TODO(i18n-server): localize ev.activatedTopics items */}
                  {ev.activatedTopics.map((tp, j) => <li key={j} lang="en">{tp}</li>)}
                </ul>
              </div>
            </details>
          ))}
        </div>
      )}
    </Card>
  );
}

function SandhiPanel({ s }: { s: SandhiResult }) {
  const { t, al } = useT();
  const sevTone: Record<SandhiResult['windows'][number]['severity'], string> = {
    high: 'bg-red-600 text-white',
    medium: 'bg-amber-500 text-white',
    low: 'bg-sky-500 text-white',
  };
  const mahaCount = s.windows.filter((w) => w.level === 'maha').length;
  const antarCount = s.windows.filter((w) => w.level === 'antar').length;
  const levelLabel = (l: string) =>
    l === 'maha' ? t('sandhi.level.maha', 'maha')
    : l === 'antar' ? t('sandhi.level.antar', 'antar')
    : l;
  const sevLabel = (sv: 'high' | 'medium' | 'low') =>
    sv === 'high' ? t('sandhi.severity.high', 'high')
    : sv === 'medium' ? t('sandhi.severity.medium', 'medium')
    : t('sandhi.severity.low', 'low');
  return (
    <Card title={t('sandhi.title', 'Dasha Sandhi — {n} junction window(s) in next 10y · {m} maha · {a} antar')
      .replace('{n}', String(s.windows.length))
      .replace('{m}', String(mahaCount))
      .replace('{a}', String(antarCount))}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('sandhi.margin', 'Margin')} {(s.marginPct * 100).toFixed(0)}% {t('sandhi.atJunction', 'at each junction. Classical caution: health, mind, major decisions within the window.')}
      </p>
      {s.windows.length === 0 ? (
        <p className="text-sm text-vedicMaroon/60">{t('sandhi.empty', 'No junction windows in this range.')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-vedicMaroon/60 border-b border-vedicGold/30">
                <th className="py-1">{t('sandhi.col.level', 'Level')}</th>
                <th>{t('sandhi.col.transition', 'Transition')}</th>
                <th>{t('sandhi.col.windowStart', 'Window start')}</th>
                <th>{t('sandhi.col.junction', 'Junction')}</th>
                <th>{t('sandhi.col.windowEnd', 'Window end')}</th>
                <th className="text-right">{t('sandhi.col.days', 'Days')}</th>
                <th className="text-center">{t('sandhi.col.severity', 'Severity')}</th>
                <th>{t('common.note', 'Note')}</th>
              </tr>
            </thead>
            <tbody>
              {s.windows.map((w, i) => (
                <tr key={i} className="border-b border-vedicGold/10">
                  <td className="py-1 text-[10px] uppercase tracking-wider text-vedicMaroon/60">{levelLabel(w.level)}</td>
                  <td className="font-semibold text-vedicMaroon">{al.planet(w.outgoingLord)} → {al.planet(w.incomingLord)}</td>
                  <td className="tabular-nums text-[11px]">{new Date(w.sandhiStart).toLocaleDateString()}</td>
                  <td className="tabular-nums text-[11px] font-semibold">{new Date(w.junctionAt).toLocaleDateString()}</td>
                  <td className="tabular-nums text-[11px]">{new Date(w.sandhiEnd).toLocaleDateString()}</td>
                  <td className="text-right tabular-nums">{w.totalDays.toFixed(0)}</td>
                  <td className="text-center">
                    <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${sevTone[w.severity]}`}>
                      {sevLabel(w.severity)}
                    </span>
                  </td>
                  {/* TODO(i18n-server): localize w.note */}
                  <td className="text-[11px] text-vedicMaroon/70 italic" lang="en">{w.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
