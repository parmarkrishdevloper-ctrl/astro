import { useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, Pill, ErrorBanner, EmptyState } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput, MatchingResult, PersonProfile, ManglikSide } from '../types';

const TONE: Record<MatchingResult['verdictTone'], { color: string; bg: string }> = {
  excellent: { color: '#15803d', bg: '#ecfdf5' },
  good:      { color: '#4d7c0f', bg: '#f7fee7' },
  acceptable:{ color: '#b45309', bg: '#fffbeb' },
  poor:      { color: '#b91c1c', bg: '#fef2f2' },
};

export function MatchingPage() {
  const { t } = useT();
  const [boy, setBoy] = useState<BirthInput | null>(null);
  const [girl, setGirl] = useState<BirthInput | null>(null);
  const [result, setResult] = useState<MatchingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  async function compute(b: BirthInput, g: BirthInput) {
    setLoading(true); setError(null); setResult(null);
    try {
      const r = await api.matching(b, g);
      setResult(r.matching);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  async function downloadPdf() {
    if (!boy || !girl) return;
    setPdfLoading(true); setError(null);
    try {
      const blob = await api.pdfMatching(boy, girl, boy.name, girl.name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `matching-${(boy.name ?? 'boy')}-${(girl.name ?? 'girl')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    } finally { setPdfLoading(false); }
  }

  return (
    <PageShell
      title={t('matching.title', 'Ashtakoot Matching')}
      subtitle={t('matching.subtitle', 'Full 36-point Guna Milan + Manglik, Nadi, Bhakoot & extra classical checks')}
      actions={
        result && (
          <button
            onClick={downloadPdf}
            disabled={pdfLoading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm"
            style={{ background: 'var(--vedic-maroon, #7c2d12)', opacity: pdfLoading ? 0.6 : 1 }}
          >
            {pdfLoading ? t('matching.generatingPdf', 'Generating PDF…') : t('matching.downloadPdf', '⬇ Download PDF Report')}
          </button>
        )
      }
    >
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-vedicMaroon mb-2">👦 {t('matching.boy', 'Boy')}</h3>
          <BirthDetailsForm
            autoCompute={false}
            onSubmit={(b) => { setBoy(b); if (girl) compute(b, girl); }}
          />
          {boy && <p className="text-[11px] text-emerald-700 mt-2">{t('matching.boyCaptured', '✓ Boy details captured')}</p>}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-vedicMaroon mb-2">👧 {t('matching.girl', 'Girl')}</h3>
          <BirthDetailsForm
            autoCompute={false}
            onSubmit={(g) => { setGirl(g); if (boy) compute(boy, g); }}
          />
          {girl && <p className="text-[11px] text-emerald-700 mt-2">{t('matching.girlCaptured', '✓ Girl details captured')}</p>}
        </div>
      </div>

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {loading && <EmptyState>{t('matching.computing', 'Computing match…')}</EmptyState>}
      {!result && !loading && !error && (
        <EmptyState>{t('matching.empty', 'Submit both birth details — match runs automatically once both are entered.')}</EmptyState>
      )}

      {result && (
        <div className="space-y-6">
          {/* ── VERDICT HERO ─────────────────────────────────────── */}
          <Card title={t('matching.verdict', 'Verdict')}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-baseline gap-3">
                <div className="text-5xl font-bold text-vedicMaroon tabular-nums">
                  {result.total.obtained}
                </div>
                <div className="text-2xl text-vedicMaroon/50">/ {result.total.max}</div>
                <div className="text-base text-vedicMaroon/70">({result.total.percentage}%)</div>
              </div>
              <div
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{
                  color: TONE[result.verdictTone].color,
                  background: TONE[result.verdictTone].bg,
                }}
              >
                {result.verdict}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill tone={result.manglik.compatible ? 'good' : 'bad'}>
                {result.manglik.compatible ? t('matching.manglikCompatible', 'Manglik compatible') : t('matching.manglikMismatch', 'Manglik mismatch')}
              </Pill>
              <Pill tone={result.nadiDosha.netDosha ? 'bad' : result.nadiDosha.present ? 'warn' : 'good'}>
                {result.nadiDosha.netDosha ? t('matching.nadiDosha', 'Nadi Dosha') : result.nadiDosha.present ? t('matching.nadiCancelled', 'Nadi cancelled') : t('matching.nadiNone', 'No Nadi Dosha')}
              </Pill>
              <Pill tone={result.bhakootDosha.netDosha ? 'bad' : result.bhakootDosha.present ? 'warn' : 'good'}>
                {result.bhakootDosha.netDosha ? t('matching.bhakootDosha', 'Bhakoot Dosha') : result.bhakootDosha.present ? t('matching.bhakootCancelled', 'Bhakoot cancelled') : t('matching.bhakootNone', 'No Bhakoot Dosha')}
              </Pill>
            </div>
          </Card>

          {/* ── BIRTH PROFILES ────────────────────────────────────── */}
          <div className="grid lg:grid-cols-2 gap-6">
            <ProfileCard title={`👦 ${t('matching.boy', 'Boy')}`} p={result.boy} />
            <ProfileCard title={`👧 ${t('matching.girl', 'Girl')}`} p={result.girl} />
          </div>

          {/* ── KOOT SCORE TABLE ─────────────────────────────────── */}
          <Card title={t('matching.koots', 'Koot-by-Koot Breakdown (Ashtakoot)')}>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase text-vedicMaroon/60">
                <tr className="border-b border-vedicGold/30">
                  <th className="text-left py-2">{t('matching.koot', 'Koot')}</th>
                  <th className="text-right py-2">{t('matching.score', 'Score')}</th>
                  <th className="text-left py-2 pl-4">{t('matching.detail', 'Detail')}</th>
                  <th className="text-right py-2">{t('matching.bar', 'Bar')}</th>
                </tr>
              </thead>
              <tbody>
                {result.koots.map((k) => {
                  const pct = Math.round((k.obtained / k.max) * 100);
                  const tone = pct >= 75 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500';
                  return (
                    <tr key={k.kootKey} className="border-b border-vedicGold/10">
                      <td className="py-2 font-semibold text-vedicMaroon">{k.name}</td>
                      <td className="py-2 text-right tabular-nums">{k.obtained}/{k.max}</td>
                      <td className="py-2 pl-4 text-vedicMaroon/70 text-xs">{k.detail}</td>
                      <td className="py-2 w-32">
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                <tr className="font-semibold text-vedicMaroon">
                  <td className="py-2">{t('common.total', 'Total')}</td>
                  <td className="py-2 text-right tabular-nums">
                    {result.total.obtained}/{result.total.max}
                  </td>
                  <td className="py-2 pl-4 text-xs">{t('matching.compatibilityPct', '{pct}% compatibility').replace('{pct}', String(result.total.percentage))}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </Card>

          {/* ── KOOT EXPLANATIONS ──────────────────────────────────── */}
          <Card title={t('matching.kootsExplain', 'What Each Koot Means')}>
            <div className="grid md:grid-cols-2 gap-3">
              {result.koots.map((k) => (
                <div key={k.kootKey} className="rounded-lg border border-vedicGold/30 p-3 bg-white/60">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-vedicMaroon">{k.name}</h4>
                    <span className="text-xs text-vedicMaroon/60 tabular-nums">
                      {k.obtained}/{k.max}
                    </span>
                  </div>
                  <p className="text-[11px] text-vedicMaroon/60 mt-1">{k.detail}</p>
                  <p className="text-xs text-vedicMaroon/80 mt-2 leading-relaxed">{k.description}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* ── MANGLIK ANALYSIS ──────────────────────────────────── */}
          <Card title={t('matching.manglikAnalysis', 'Manglik (Mars) Analysis')}>
            <div className="grid md:grid-cols-2 gap-3">
              <ManglikCard title={`👦 ${t('matching.boy', 'Boy')}`} m={result.manglik.boy} />
              <ManglikCard title={`👧 ${t('matching.girl', 'Girl')}`} m={result.manglik.girl} />
            </div>
            <div
              className="mt-4 rounded-lg px-4 py-3 text-sm"
              style={{
                background: result.manglik.compatible ? '#ecfdf5' : '#fef2f2',
                color: result.manglik.compatible ? '#065f46' : '#991b1b',
              }}
            >
              {result.manglik.note}
            </div>
          </Card>

          {/* ── NADI / BHAKOOT CANCELLATIONS ──────────────────────── */}
          <Card title={t('matching.nadiBhakoot', 'Nadi · Bhakoot Cancellations')}>
            <div className="grid md:grid-cols-2 gap-3">
              <DoshaCard
                title={t('matching.nadiDosha', 'Nadi Dosha')}
                present={result.nadiDosha.present}
                cancelled={result.nadiDosha.cancelled}
                reasons={result.nadiDosha.reasons}
              />
              <DoshaCard
                title={t('matching.bhakootDosha', 'Bhakoot Dosha')}
                present={result.bhakootDosha.present}
                cancelled={result.bhakootDosha.cancelled}
                reasons={result.bhakootDosha.reasons}
              />
            </div>
          </Card>

          {/* ── EXTRA DOSHAS ─────────────────────────────────────── */}
          <Card title={t('matching.additional', 'Additional Classical Checks')}>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase text-vedicMaroon/60">
                <tr className="border-b border-vedicGold/30">
                  <th className="text-left py-2">{t('matching.check', 'Check')}</th>
                  <th className="text-left py-2">{t('matching.result', 'Result')}</th>
                  <th className="text-left py-2">{t('matching.note', 'Note')}</th>
                </tr>
              </thead>
              <tbody>
                {result.extras.map((e) => {
                  // `e.name` is the stable English key; auspiciousness is keyed off it.
                  const isAuspicious = e.name === 'Mahendra' || e.name === 'Stri Dheerga';
                  const good = isAuspicious ? e.present : !e.present;
                  return (
                    <tr key={e.name} className="border-b border-vedicGold/10">
                      <td className="py-2 font-semibold text-vedicMaroon">{e.nameLabel}</td>
                      <td className="py-2">
                        <span className={`font-semibold ${good ? 'text-emerald-700' : 'text-red-700'}`}>
                          {isAuspicious
                            ? e.present ? t('matching.extra.presentGood', 'Present ✓') : t('matching.extra.absent', 'Absent')
                            : e.present ? t('matching.extra.presentBad', 'Present ✗') : t('matching.extra.absentGood', 'Absent ✓')}
                        </span>
                      </td>
                      <td className="py-2 text-vedicMaroon/80 text-xs">{e.note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {/* ── RECOMMENDATIONS ──────────────────────────────────── */}
          <Card title={t('matching.recommendations', 'Recommendations')}>
            <ul className="space-y-2">
              {result.recommendations.map((r, i) => (
                <li key={i} className="text-sm text-vedicMaroon/90 flex gap-2">
                  <span className="text-vedicGold">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </PageShell>
  );
}

function ProfileCard({ title, p }: { title: string; p: PersonProfile }) {
  const { t, al } = useT();
  const houseSuffix = t('matching.profile.houseSuffix', 'th');
  const lordWord = t('matching.profile.lord', 'lord');
  const padaWord = t('matching.profile.pada', 'pada');
  // Server emits English rashi/nakshatra names + numbers. Use al.rashi(num) /
  // al.nakshatra(num) for clean localised labels. varna/vashya/yoni/gana/nadi
  // are already localised on the server.
  const rows: [string, string | number][] = [
    [t('matching.profile.ascendant', 'Ascendant'), al.rashiByName(p.ascendantRashi)],
    [t('matching.profile.moonRashi', 'Moon rashi'), `${al.rashi(p.rashiNum)} (${lordWord} ${al.planet(p.rashiLord)})`],
    [t('matching.profile.moonNakshatra', 'Moon nakshatra'), `${al.nakshatra(p.nakNum)} ${padaWord} ${p.pada} (${lordWord} ${al.planet(p.nakLord)})`],
    [t('matching.profile.varna', 'Varna'), p.varna],
    [t('matching.profile.vashya', 'Vashya'), p.vashya],
    [t('matching.profile.yoni', 'Yoni'), p.yoni],
    [t('matching.profile.gana', 'Gana'), p.gana],
    [t('matching.profile.nadi', 'Nadi'), p.nadi],
    [t('matching.profile.marsHouse', 'Mars house'), `${p.marsHouse}${houseSuffix}`],
    [t('matching.profile.currentMahadasha', 'Current mahadasha'), al.planet(p.currentDasha)],
  ];
  return (
    <Card title={title}>
      <table className="w-full text-sm">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k} className="border-b border-vedicGold/10 last:border-0">
              <td className="py-1.5 text-vedicMaroon/60 text-xs">{k}</td>
              <td className="py-1.5 text-right font-semibold text-vedicMaroon">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function ManglikCard({ title, m }: { title: string; m: ManglikSide }) {
  const { t, al } = useT();
  const status = m.netManglik ? t('matching.manglik.active', 'Active') : m.isManglik ? t('matching.manglik.cancelled', 'Cancelled') : t('matching.manglik.notPresent', 'Not present');
  const tone = m.netManglik ? 'bad' : m.isManglik ? 'warn' : 'good';
  // Server emits the English rashi name; localise via al.rashiByName.
  const marsInfo = t('matching.manglik.marsInfo', 'Mars in {h}th house, rashi {r}')
    .replace('{h}', String(m.marsHouse))
    .replace('{r}', al.rashiByName(m.marsRashi));
  return (
    <div className="rounded-lg border border-vedicGold/30 p-3 bg-white/60">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-vedicMaroon">{title}</h4>
        <Pill tone={tone as 'good' | 'bad' | 'warn'}>{status}</Pill>
      </div>
      <p className="text-xs text-vedicMaroon/80 mt-2">{marsInfo}</p>
      {m.cancellations.length > 0 && (
        <>
          <p className="text-[11px] text-vedicMaroon/60 mt-3 font-semibold uppercase">
            {t('matching.cancellations', 'Cancellations')}
          </p>
          <ul className="mt-1 space-y-1">
            {m.cancellations.map((c, i) => (
              <li key={i} className="text-xs text-emerald-800 flex gap-2">
                <span className="text-emerald-600">✓</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function DoshaCard({
  title, present, cancelled, reasons,
}: { title: string; present: boolean; cancelled: boolean; reasons: string[] }) {
  const { t } = useT();
  const status = !present
    ? { label: t('matching.dosha.notPresent', 'Not present'), tone: 'good' as const }
    : cancelled
    ? { label: t('matching.dosha.cancelled', 'Present but cancelled'), tone: 'warn' as const }
    : { label: t('matching.dosha.active', 'Active — caution'), tone: 'bad' as const };
  return (
    <div className="rounded-lg border border-vedicGold/30 p-3 bg-white/60">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-vedicMaroon">{title}</h4>
        <Pill tone={status.tone}>{status.label}</Pill>
      </div>
      {reasons.length > 0 && (
        <>
          <p className="text-[11px] text-vedicMaroon/60 mt-3 font-semibold uppercase">
            {t('matching.cancellations', 'Cancellations')}
          </p>
          <ul className="mt-1 space-y-1">
            {reasons.map((r, i) => (
              <li key={i} className="text-xs text-emerald-800 flex gap-2">
                <span className="text-emerald-600">✓</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
