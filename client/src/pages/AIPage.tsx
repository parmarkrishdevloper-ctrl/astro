// Phase 18 — AI / Narrative workspace.
//
// Three tabs, all locale-aware (en/hi/gu/sa) and rule-based local NLG
// (no third-party LLM):
//   • Narrative — full sectioned chart reading (overview, personality,
//                 career, relationships, wealth, health, spirituality,
//                 dasha, yoga)
//   • Journal   — auto-generated daily entry synthesising panchang,
//                 dasha, and notable transits onto the natal chart;
//                 single day or up to 31 days
//   • Compare   — chart-to-chart synastry narrative (Ashtakoot guṇ-milan
//                 score, planet-on-house overlays, Bhakoot moon axis)

import { useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput } from '../types';

type Tab = 'narrative' | 'journal' | 'compare';
type AILocale = 'en' | 'hi' | 'gu' | 'sa';

// ─── Locale picker ──────────────────────────────────────────────────────────
function LocalePicker({ value, onChange }: { value: AILocale; onChange: (l: AILocale) => void }) {
  const { t } = useT();
  const LOCALES: { value: AILocale; label: string; native: string }[] = [
    { value: 'en', label: t('ai.locale.english.label', 'English'),  native: t('ai.locale.english.native', 'English') },
    { value: 'hi', label: t('ai.locale.hindi.label', 'Hindi'),    native: t('ai.locale.hindi.native', 'हिन्दी') },
    { value: 'gu', label: t('ai.locale.gujarati.label', 'Gujarati'), native: t('ai.locale.gujarati.native', 'ગુજરાતી') },
    { value: 'sa', label: t('ai.locale.sanskrit.label', 'Sanskrit'), native: t('ai.locale.sanskrit.native', 'संस्कृतम्') },
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {LOCALES.map((l) => (
        <button key={l.value} onClick={() => onChange(l.value)}
          className={`px-3 py-1.5 rounded text-xs font-semibold border transition-colors ${
            value === l.value
              ? 'bg-vedicMaroon text-white border-vedicMaroon'
              : 'border-vedicGold/40 text-vedicMaroon/70 hover:bg-parchment/60'
          }`}>
          <span className="block">{l.native}</span>
          <span className="block text-[9px] opacity-70 font-normal">{l.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Narrative tab ──────────────────────────────────────────────────────────
type NarrativeReport = Awaited<ReturnType<typeof api.narrative>>['report'];

function NarrativeTab({ birth, setError }: {
  birth: BirthInput | null;
  setError: (s: string | null) => void;
}) {
  const { t } = useT();
  const SECTION_OPTIONS: { id: string; label: string }[] = [
    { id: 'overview',      label: t('ai.section.overview', 'Overview') },
    { id: 'personality',   label: t('ai.section.personality', 'Personality') },
    { id: 'career',        label: t('ai.section.career', 'Career') },
    { id: 'relationships', label: t('ai.section.relationships', 'Relationships') },
    { id: 'wealth',        label: t('ai.section.wealth', 'Wealth') },
    { id: 'health',        label: t('ai.section.health', 'Health') },
    { id: 'spirituality',  label: t('ai.section.spirituality', 'Spirituality') },
    { id: 'dasha',         label: t('ai.section.dasha', 'Dasha') },
    { id: 'yoga',          label: t('ai.section.yoga', 'Yogas') },
  ];

  const [locale, setLocale] = useState<AILocale>('en');
  const [picked, setPicked] = useState<string[]>(SECTION_OPTIONS.map((s) => s.id));
  const [report, setReport] = useState<NarrativeReport | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }
  function selectAll() { setPicked(SECTION_OPTIONS.map((s) => s.id)); }
  function selectNone() { setPicked([]); }

  async function generate() {
    if (!birth) { setError(t('ai.error.enterBirth', 'Enter birth details first')); return; }
    if (picked.length === 0) { setError(t('ai.error.pickSection', 'Pick at least one section')); return; }
    setBusy(true); setError(null);
    try {
      const r = await api.narrative(birth, locale, picked);
      setReport(r.report);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const sectionWord = (n: number) => n === 1 ? t('ai.narrative.sectionSingular', 'section') : t('ai.narrative.sectionPlural', 'sections');

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-vedicMaroon/80 mb-1.5 font-semibold">{t('ai.language', 'Language')}</div>
            <LocalePicker value={locale} onChange={setLocale} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-xs text-vedicMaroon/80 font-semibold">{t('ai.sections', 'Sections')} ({picked.length}/{SECTION_OPTIONS.length})</div>
              <div className="flex gap-1">
                <button onClick={selectAll} className="text-[11px] text-vedicMaroon/60 hover:text-vedicMaroon px-2">{t('ai.all', 'all')}</button>
                <button onClick={selectNone} className="text-[11px] text-vedicMaroon/60 hover:text-vedicMaroon px-2">{t('ai.none', 'none')}</button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SECTION_OPTIONS.map((s) => (
                <button key={s.id} onClick={() => toggle(s.id)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-colors ${
                    picked.includes(s.id)
                      ? 'bg-vedicGold/30 border-vedicGold text-vedicMaroon'
                      : 'border-vedicGold/30 text-vedicMaroon/50 hover:bg-parchment/60'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <button className="btn btn-primary" onClick={generate} disabled={busy || !birth || picked.length === 0}>
        {busy ? t('ai.narrative.composing', 'Composing narrative…') : t('ai.narrative.btn', 'Generate Narrative')}
      </button>
      {!birth && <span className="text-xs text-vedicMaroon/60 italic ml-3">{t('ai.error.enterBirth', 'Enter birth details first')}</span>}

      {report && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Pill tone="info">{report.locale}</Pill>
            <Pill tone="neutral">{report.sections.length} {sectionWord(report.sections.length)}</Pill>
            {/* TODO(i18n-server): localize report.meta sign names */}
            {report.meta?.ascendant && <Pill tone="good"><span lang="en">{t('ai.narrative.lagna', 'Lagna')}: {report.meta.ascendant.sign}</span></Pill>}
            {report.meta?.moonSign && <Pill tone="neutral"><span lang="en">{t('ai.narrative.moon', 'Moon')}: {report.meta.moonSign}</span></Pill>}
            {report.meta?.sunSign && <Pill tone="neutral"><span lang="en">{t('ai.narrative.sun', 'Sun')}: {report.meta.sunSign}</span></Pill>}
            {report.meta?.dasha?.maha && (
              // TODO(i18n-server): localize dasha planet names
              <Pill tone="info"><span lang="en">{t('ai.narrative.dasha', 'Dasha')}: {report.meta.dasha.maha}{report.meta.dasha.antar ? ` / ${report.meta.dasha.antar}` : ''}</span></Pill>
            )}
          </div>

          {report.sections.map((s) => (
            <Card key={s.id}>
              {/* TODO(i18n-server): localize section heading */}
              <h3 className="text-base font-semibold text-vedicMaroon mb-2" lang={report.locale}>{s.heading}</h3>
              <div className="space-y-2 text-sm leading-relaxed text-vedicMaroon/85" lang={report.locale}>
                {s.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {!report && !busy && (
        <EmptyState>{t('ai.narrative.empty', 'Pick a language + sections, then generate. The narrative is composed locally — no third-party LLM.')}</EmptyState>
      )}
    </div>
  );
}

// ─── Journal tab ────────────────────────────────────────────────────────────
type JournalEntry = Awaited<ReturnType<typeof api.journalDay>>['entry'];

function JournalTab({ birth, setError }: {
  birth: BirthInput | null;
  setError: (s: string | null) => void;
}) {
  const { t } = useT();
  const [locale, setLocale] = useState<AILocale>('en');
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const [mode, setMode] = useState<'day' | 'range'>('day');
  const [date, setDate] = useState(today);
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(in7);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (!birth) { setError(t('ai.error.enterBirth', 'Enter birth details first')); return; }
    setBusy(true); setError(null);
    try {
      if (mode === 'day') {
        const r = await api.journalDay(birth, date, birth.lat, birth.lng, locale);
        setEntries([r.entry]);
      } else {
        const r = await api.journalRange(birth, from, to, birth.lat, birth.lng, locale);
        setEntries(r.entries);
      }
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const entryWord = (n: number) => n === 1 ? t('ai.journal.entrySingular', 'entry') : t('ai.journal.entryPlural', 'entries');

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-vedicMaroon/80 mb-1.5 font-semibold">{t('ai.language', 'Language')}</div>
            <LocalePicker value={locale} onChange={setLocale} />
          </div>
          <div>
            <div className="text-xs text-vedicMaroon/80 mb-1.5 font-semibold">{t('ai.range', 'Range')}</div>
            <div className="flex gap-1 mb-2">
              <button onClick={() => setMode('day')}
                className={`px-3 py-1.5 rounded text-xs font-semibold border ${
                  mode === 'day' ? 'bg-vedicMaroon text-white border-vedicMaroon' : 'border-vedicGold/40 text-vedicMaroon/70 hover:bg-parchment/60'
                }`}>{t('ai.singleDay', 'Single day')}</button>
              <button onClick={() => setMode('range')}
                className={`px-3 py-1.5 rounded text-xs font-semibold border ${
                  mode === 'range' ? 'bg-vedicMaroon text-white border-vedicMaroon' : 'border-vedicGold/40 text-vedicMaroon/70 hover:bg-parchment/60'
                }`}>{t('ai.range.window', 'Range (≤ 31 days)')}</button>
            </div>
            {mode === 'day' ? (
              <label className="text-xs text-vedicMaroon/80 block max-w-xs">
                {t('ai.date', 'Date')}
                <input type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
              </label>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md">
                <label className="text-xs text-vedicMaroon/80">
                  {t('ai.from', 'From')}
                  <input type="date" className="input mt-1" value={from} onChange={(e) => setFrom(e.target.value)} />
                </label>
                <label className="text-xs text-vedicMaroon/80">
                  {t('ai.to', 'To')}
                  <input type="date" className="input mt-1" value={to} onChange={(e) => setTo(e.target.value)} />
                </label>
              </div>
            )}
          </div>
        </div>
      </Card>

      <button className="btn btn-primary" onClick={generate} disabled={busy || !birth}>
        {busy ? t('ai.journal.building', 'Building journal…') : mode === 'day' ? t('ai.journal.dayBtn', 'Generate day entry') : t('ai.journal.rangeBtn', 'Generate range')}
      </button>
      {!birth && <span className="text-xs text-vedicMaroon/60 italic ml-3">{t('ai.error.enterBirth', 'Enter birth details first')}</span>}

      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-vedicMaroon/60 italic">
            {entries.length} {entryWord(entries.length)} — {t('ai.journal.synthesisHint', 'synthesized locally from panchang + dasha + transits')}
          </div>
          {entries.map((e) => (
            <Card key={e.date}>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                {/* TODO(i18n-server): localize weekday */}
                <h3 className="text-base font-semibold text-vedicMaroon">{e.date} <span className="text-xs text-vedicMaroon/60 font-normal" lang="en">· {e.weekday}</span></h3>
                <div className="flex gap-1 flex-wrap">
                  {/* TODO(i18n-server): localize signal labels (nakshatra/tithi/dasha planet) */}
                  <Pill tone="info"><span lang="en">{e.signals.nakshatra}</span></Pill>
                  <Pill tone="neutral"><span lang="en">{e.signals.tithi}</span></Pill>
                  {e.signals.dasha && <Pill tone="good"><span lang="en">{e.signals.dasha}</span></Pill>}
                </div>
              </div>
              <div className="space-y-2 text-sm leading-relaxed text-vedicMaroon/85 mb-3" lang={locale}>
                {e.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-vedicMaroon/70 pt-2 border-t border-vedicGold/30">
                {/* TODO(i18n-server): localize signal values (yoga/sign names/Abhijit/RahuKaal) */}
                <div><span className="font-semibold">{t('ai.journal.yoga', 'Yoga:')}</span> <span lang="en">{e.signals.yoga}</span></div>
                <div><span className="font-semibold">{t('ai.journal.sun', 'Sun:')}</span> <span lang="en">{e.signals.sunSign}</span></div>
                <div><span className="font-semibold">{t('ai.journal.moon', 'Moon:')}</span> <span lang="en">{e.signals.moonSign}</span></div>
                {e.signals.abhijit && <div><span className="font-semibold">{t('ai.journal.abhijit', 'Abhijit:')}</span> <span lang="en">{e.signals.abhijit}</span></div>}
                {e.signals.rahuKaal && <div><span className="font-semibold">{t('ai.journal.rahuKaal', 'Rāhu kāl:')}</span> <span lang="en">{e.signals.rahuKaal}</span></div>}
              </div>
            </Card>
          ))}
        </div>
      )}

      {entries.length === 0 && !busy && (
        <EmptyState>{t('ai.journal.empty', "Pick a date or range; we'll narrate each day in your chosen language.")}</EmptyState>
      )}
    </div>
  );
}

// ─── Compare tab ────────────────────────────────────────────────────────────
type Compare = Awaited<ReturnType<typeof api.compareNarrative>>['compare'];

function CompareTab({ birth, setError }: {
  birth: BirthInput | null;
  setError: (s: string | null) => void;
}) {
  const { t } = useT();
  const [locale, setLocale] = useState<AILocale>('en');
  // Partner B form fields (use a simple inline form so the user can edit B without losing A)
  const [bName, setBName] = useState(t('ai.partnerDefault', 'Partner'));
  const [bDatetime, setBDatetime] = useState('1992-03-12T14:20');
  const [bTz, setBTz] = useState(5.5);
  const [bLat, setBLat] = useState(19.0760);
  const [bLng, setBLng] = useState(72.8777);
  const [bPlace, setBPlace] = useState(t('ai.partnerPlace', 'Mumbai, India'));
  const [compare, setCompare] = useState<Compare | null>(null);
  const [busy, setBusy] = useState(false);

  function compatibilityTone(c: Compare['compatibility']): 'good' | 'warn' | 'neutral' | 'bad' {
    if (c === 'excellent') return 'good';
    if (c === 'good') return 'good';
    if (c === 'moderate') return 'warn';
    return 'bad';
  }

  async function generate() {
    if (!birth) { setError(t('ai.error.enterChartA', 'Enter chart A (birth details) first')); return; }
    setBusy(true); setError(null);
    try {
      const b: BirthInput = {
        name: bName, placeName: bPlace,
        datetime: bDatetime, tzOffsetHours: bTz,
        lat: bLat, lng: bLng,
      };
      const r = await api.compareNarrative(birth, b, locale);
      setCompare(r.compare);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-vedicMaroon/80 mb-1.5 font-semibold">{t('ai.language', 'Language')}</div>
            <LocalePicker value={locale} onChange={setLocale} />
          </div>
          <div>
            <div className="text-xs text-vedicMaroon/80 mb-1.5 font-semibold">
              {t('ai.compare.chartBHeading', 'Chart B (partner) — chart A is taken from the side birth-details form')}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-xs text-vedicMaroon/80">
                {t('ai.compare.name', 'Name')}
                <input className="input mt-1" value={bName} onChange={(e) => setBName(e.target.value)} />
              </label>
              <label className="text-xs text-vedicMaroon/80">
                {t('ai.compare.place', 'Place')}
                <input className="input mt-1" value={bPlace} onChange={(e) => setBPlace(e.target.value)} />
              </label>
              <label className="text-xs text-vedicMaroon/80 md:col-span-2">
                {t('ai.compare.datetime', 'Date & time')}
                <input type="datetime-local" className="input mt-1" value={bDatetime} onChange={(e) => setBDatetime(e.target.value)} />
              </label>
              <label className="text-xs text-vedicMaroon/80">
                {t('ai.compare.latitude', 'Latitude')}
                <input type="number" step="0.0001" className="input mt-1" value={bLat} onChange={(e) => setBLat(Number(e.target.value))} />
              </label>
              <label className="text-xs text-vedicMaroon/80">
                {t('ai.compare.longitude', 'Longitude')}
                <input type="number" step="0.0001" className="input mt-1" value={bLng} onChange={(e) => setBLng(Number(e.target.value))} />
              </label>
              <label className="text-xs text-vedicMaroon/80">
                {t('ai.compare.tzOffset', 'TZ offset (hours)')}
                <input type="number" step="0.25" className="input mt-1" value={bTz} onChange={(e) => setBTz(Number(e.target.value))} />
              </label>
            </div>
          </div>
        </div>
      </Card>

      <button className="btn btn-primary" onClick={generate} disabled={busy || !birth}>
        {busy ? t('ai.compare.comparing', 'Comparing charts…') : t('ai.compare.btn', 'Compare A ↔ B')}
      </button>
      {!birth && <span className="text-xs text-vedicMaroon/60 italic ml-3">{t('ai.compare.enterChartAFirst', 'Enter chart A first')}</span>}

      {compare && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Pill tone={compatibilityTone(compare.compatibility)}>{t(`ai.compatibility.${compare.compatibility}`, compare.compatibility)}</Pill>
              {typeof compare.gunMilanScore === 'number' && (
                <Pill tone={compare.gunMilanScore >= 18 ? 'good' : compare.gunMilanScore >= 12 ? 'warn' : 'bad'}>
                  {t('ai.compare.gunMilan', 'Guṇ-milan')} {compare.gunMilanScore}/36
                </Pill>
              )}
              <Pill tone="info">{compare.locale}</Pill>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-vedicMaroon/85" lang={compare.locale}>
              {compare.paragraphs.map((p, i) => (
                <div key={i}>
                  {/* TODO(i18n-server): localize compare paragraph headings */}
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-vedicMaroon/60 mb-1" lang={compare.locale}>{p.heading}</div>
                  <p>{p.text}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-sm font-semibold text-vedicMaroon mb-2">{t('ai.compare.aOnB', "A's planets in B's houses")}</h3>
              {compare.overlays.aOnB.length === 0 ? (
                <div className="text-xs text-vedicMaroon/50 italic">{t('ai.compare.noOverlays', 'No notable overlays.')}</div>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {compare.overlays.aOnB.map((o, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {/* TODO(i18n-server): localize planet name */}
                      <span className="font-mono text-vedicMaroon/60 shrink-0 w-20 truncate" lang="en">{o.planet} → {o.house}H</span>
                      {/* TODO(i18n-server): localize overlay meaning prose */}
                      <span className="text-vedicMaroon/85" lang={compare.locale}>{o.meaning}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <h3 className="text-sm font-semibold text-vedicMaroon mb-2">{t('ai.compare.bOnA', "B's planets in A's houses")}</h3>
              {compare.overlays.bOnA.length === 0 ? (
                <div className="text-xs text-vedicMaroon/50 italic">{t('ai.compare.noOverlays', 'No notable overlays.')}</div>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {compare.overlays.bOnA.map((o, i) => (
                    <li key={i} className="flex items-start gap-2">
                      {/* TODO(i18n-server): localize planet name */}
                      <span className="font-mono text-vedicMaroon/60 shrink-0 w-20 truncate" lang="en">{o.planet} → {o.house}H</span>
                      {/* TODO(i18n-server): localize overlay meaning prose */}
                      <span className="text-vedicMaroon/85" lang={compare.locale}>{o.meaning}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <h3 className="text-sm font-semibold text-vedicMaroon mb-2">{t('ai.compare.bhakoot', 'Bhakoot moon axis')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* TODO(i18n-server): localize moon-sign names */}
              <div><span className="font-semibold text-vedicMaroon/80">{t('ai.compare.aMoon', "A's Moon:")}</span> <span lang="en">{compare.moonAxis.aMoonSign}</span></div>
              <div><span className="font-semibold text-vedicMaroon/80">{t('ai.compare.bMoon', "B's Moon:")}</span> <span lang="en">{compare.moonAxis.bMoonSign}</span></div>
              <div><span className="font-semibold text-vedicMaroon/80">{t('ai.compare.bFromA', 'B from A:')}</span> {compare.moonAxis.relativeHouse}H</div>
              {/* TODO(i18n-server): localize bhakoot note */}
              <div className="md:col-span-3 text-vedicMaroon/85" lang={compare.locale}>{compare.moonAxis.note}</div>
            </div>
          </Card>
        </div>
      )}

      {!compare && !busy && (
        <EmptyState>{t('ai.compare.empty', 'Fill in partner B and click Compare. Output: guṇ-milan score, planet overlays, Bhakoot moon axis, and a multi-paragraph narrative.')}</EmptyState>
      )}
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────
export function AIPage() {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>('narrative');
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const TABS: { id: Tab; label: string; note: string }[] = [
    { id: 'narrative', label: t('ai.tab.narrative', 'Narrative'), note: t('ai.tab.narrative.note', 'Sectioned chart reading in 4 languages') },
    { id: 'journal',   label: t('ai.tab.journal', 'Journal'),   note: t('ai.tab.journal.note', 'Auto-generated daily astrology paragraphs') },
    { id: 'compare',   label: t('ai.tab.compare', 'Compare'),   note: t('ai.tab.compare.note', 'Chart-to-chart synastry narrative + guṇ-milan') },
  ];

  return (
    <PageShell
      title={t('ai.title', 'AI · Narrative')}
      subtitle={t('ai.subtitle', 'Locale-aware chart readings, daily auto-journal, and chart-to-chart compare. Composed locally — no third-party LLM.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={setBirth} loading={false} />
          {birth && (
            <Card>
              <div className="text-xs text-vedicMaroon/70 space-y-1">
                <div className="flex gap-2"><Pill tone="good">{t('ai.loaded', 'Loaded')}</Pill> <span>{birth.name ?? t('ai.subjectFallback', 'Subject')}</span></div>
                <div>{birth.placeName}</div>
                <div>{birth.datetime} (UTC{(birth.tzOffsetHours ?? 0) >= 0 ? '+' : ''}{birth.tzOffsetHours ?? 0})</div>
              </div>
            </Card>
          )}
        </aside>

        <main className="space-y-4">
          <div className="flex flex-wrap gap-1 border-b border-vedicGold/40 pb-1">
            {TABS.map((tb) => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className={`px-3 py-1.5 rounded-t text-sm font-semibold ${
                  tab === tb.id
                    ? 'bg-vedicMaroon text-white'
                    : 'text-vedicMaroon/70 hover:bg-parchment/60'
                }`}>
                {tb.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-vedicMaroon/60 italic -mt-2">
            {TABS.find((tb) => tb.id === tab)?.note}
          </div>

          {error && <ErrorBanner>{error}</ErrorBanner>}

          {tab === 'narrative' && <NarrativeTab birth={birth} setError={setError} />}
          {tab === 'journal'   && <JournalTab   birth={birth} setError={setError} />}
          {tab === 'compare'   && <CompareTab   birth={birth} setError={setError} />}
        </main>
      </div>
    </PageShell>
  );
}
