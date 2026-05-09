// Phase 17 — Print / Export workspace.
//
// Five tabs, all sharing a single birth form:
//   • Varshphal book    — annual Tajika horoscope PDF
//   • Muhurta book       — ranked auspicious windows PDF
//   • Custom builder     — drag/drop sections → PDF
//   • Data export        — CSV + XLSX of planetary data
//   • Chart export       — hi-res SVG + PNG (north / south)

import { useEffect, useMemo, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput, MuhuratEvent } from '../types';

type Tab = 'varshphal' | 'muhurat' | 'custom' | 'data' | 'chart';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Custom section builder with drag/drop ordering ───────────────────────────
function CustomBuilder({ birth, setError }: {
  birth: BirthInput | null; setError: (s: string | null) => void;
}) {
  const { t } = useT();
  const [catalog, setCatalog] = useState<Array<{ id: string; label: string; note: string }>>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState(t('export.custom.defaultTitle', 'Custom Astrology Report'));
  const [subjectName, setSubjectName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    api.customSections()
      .then((r) => {
        setCatalog(r.sections);
        setSelected(['header', 'birth_details', 'rashi_chart', 'planets', 'vimshottari']);
      })
      .catch((e) => setError((e as Error).message));
  }, [setError]);

  const available = useMemo(
    () => catalog.filter((s) => !selected.includes(s.id)),
    [catalog, selected],
  );

  function toggleAdd(id: string) { setSelected((sel) => [...sel, id]); }
  function toggleRemove(id: string) { setSelected((sel) => sel.filter((x) => x !== id)); }

  function onDragStart(id: string) { setDragId(id); }
  function onDragOver(e: React.DragEvent) { e.preventDefault(); }
  function onDropAt(idx: number) {
    if (!dragId) return;
    const without = selected.filter((x) => x !== dragId);
    const target = Math.min(without.length, idx);
    const next = [...without.slice(0, target), dragId, ...without.slice(target)];
    setSelected(next);
    setDragId(null);
  }

  async function buildPdf() {
    if (!birth) { setError(t('export.error.enterBirth', 'Enter birth details first')); return; }
    if (selected.length === 0) { setError(t('export.error.pickSection', 'Pick at least one section')); return; }
    setBusy(true); setError(null);
    try {
      const blob = await api.pdfCustom({
        birth, sections: selected,
        subjectName: subjectName || undefined,
        title: title || undefined,
        age: selected.includes('varsha_summary') || selected.includes('mudda_dasha') ? age : undefined,
      });
      const fn = (title || 'custom-report').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.pdf';
      downloadBlob(blob, fn);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  const needsAge = selected.includes('varsha_summary') || selected.includes('mudda_dasha');
  const generateLabel = busy
    ? t('export.varshphal.building', 'Building PDF…')
    : `${t('export.custom.generatePdf', 'Generate PDF')} (${selected.length} ${selected.length === 1 ? t('export.custom.section', 'section') : t('export.custom.sectionPlural', 'sections')})`;

  return (
    <div className="space-y-4">
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs text-vedicMaroon/80">
            {t('export.custom.reportTitle', 'Report title')}
            <input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="text-xs text-vedicMaroon/80">
            {t('export.custom.subjectName', 'Subject name (optional)')}
            <input className="input mt-1" value={subjectName} onChange={(e) => setSubjectName(e.target.value)} />
          </label>
          {needsAge && (
            <label className="text-xs text-vedicMaroon/80">
              {t('export.custom.age', 'Age (for annual sections)')}
              <input type="number" min={0} max={120} className="input mt-1"
                value={age} onChange={(e) => setAge(Number(e.target.value))} />
            </label>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="text-sm font-semibold text-vedicMaroon mb-2">{t('export.custom.available', 'Available sections')}</h3>
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
            {available.length === 0 && (
              <div className="text-xs text-vedicMaroon/50 italic">{t('export.custom.allAdded', 'All sections added.')}</div>
            )}
            {available.map((s) => (
              <button key={s.id} onClick={() => toggleAdd(s.id)}
                className="w-full text-left px-3 py-2 rounded border border-vedicGold/40 hover:bg-parchment/70 flex items-center gap-2">
                {/* TODO(i18n-server): localize section label and note */}
                <span className="text-vedicMaroon font-semibold text-sm flex-1" lang="en">{s.label}</span>
                <span className="text-[11px] text-vedicMaroon/55 italic truncate max-w-[55%]" lang="en">{s.note}</span>
                <span className="text-vedicGold text-lg leading-none">+</span>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-vedicMaroon mb-2">
            {t('export.custom.reportSections', 'Report sections')} <span className="text-[11px] text-vedicMaroon/60">{t('export.custom.dragHint', '(drag to reorder)')}</span>
          </h3>
          <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1"
            onDragOver={onDragOver}
            onDrop={() => onDropAt(selected.length)}>
            {selected.length === 0 && (
              <div className="text-xs text-vedicMaroon/50 italic">{t('export.custom.addFromLeft', 'Add sections from the left.')}</div>
            )}
            {selected.map((id, i) => {
              const meta = catalog.find((c) => c.id === id);
              if (!meta) return null;
              return (
                <div key={id}
                  draggable
                  onDragStart={() => onDragStart(id)}
                  onDragOver={onDragOver}
                  onDrop={(e) => { e.stopPropagation(); onDropAt(i); }}
                  className={`group px-3 py-2 rounded border border-vedicGold/60 bg-parchment/40 flex items-center gap-2 cursor-move ${
                    dragId === id ? 'opacity-50' : ''
                  }`}>
                  <span className="text-vedicMaroon/40 font-mono text-xs w-6 shrink-0">{i + 1}.</span>
                  <span className="text-vedicMaroon/50 font-mono text-xs">⋮⋮</span>
                  <div className="flex-1 min-w-0">
                    {/* TODO(i18n-server): localize section label and note */}
                    <div className="text-sm font-semibold text-vedicMaroon truncate" lang="en">{meta.label}</div>
                    <div className="text-[11px] text-vedicMaroon/55 truncate" lang="en">{meta.note}</div>
                  </div>
                  <button onClick={() => toggleRemove(id)}
                    className="text-xs text-vedicMaroon/50 hover:text-red-700 px-2 py-1">✕</button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn btn-primary" onClick={buildPdf} disabled={busy || !birth || selected.length === 0}>
          {generateLabel}
        </button>
        {!birth && <span className="text-xs text-vedicMaroon/60 italic">{t('export.enterBirthFirstNote', 'Enter birth details first')}</span>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function ExportPage() {
  const { t } = useT();
  const [tab, setTab] = useState<Tab>('varshphal');
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const TABS: { id: Tab; label: string; note: string }[] = [
    { id: 'varshphal', label: t('export.tab.varshphal', 'Varshphal Book'),  note: t('export.tab.varshphal.note', 'Annual Tajika horoscope (PDF)') },
    { id: 'muhurat',   label: t('export.tab.muhurat', 'Muhurta Book'),    note: t('export.tab.muhurat.note', 'Ranked auspicious windows (PDF)') },
    { id: 'custom',    label: t('export.tab.custom', 'Custom Builder'),  note: t('export.tab.custom.note', 'Drag/drop sections → PDF') },
    { id: 'data',      label: t('export.tab.data', 'Data Export'),     note: t('export.tab.data.note', 'CSV / XLSX of chart data') },
    { id: 'chart',     label: t('export.tab.chart', 'Chart Export'),    note: t('export.tab.chart.note', 'Hi-res SVG / PNG') },
  ];

  const MUHURAT_EVENTS: { value: MuhuratEvent; label: string }[] = [
    { value: 'marriage',         label: t('export.muhurat.event.marriage', 'Marriage') },
    { value: 'griha-pravesh',    label: t('export.muhurat.event.grihaPravesh', 'Griha Pravesh (house warming)') },
    { value: 'travel',           label: t('export.muhurat.event.travel', 'Travel') },
    { value: 'business',         label: t('export.muhurat.event.business', 'Business / new venture') },
    { value: 'education',        label: t('export.muhurat.event.education', 'Education / initiation') },
    { value: 'vehicle-purchase', label: t('export.muhurat.event.vehiclePurchase', 'Vehicle purchase') },
    { value: 'general',          label: t('export.muhurat.event.general', 'General auspicious time') },
  ];

  // Varshphal
  const [vpAge, setVpAge] = useState(35);
  const [vpName, setVpName] = useState('');

  // Muhurat
  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const [muEvent, setMuEvent] = useState<MuhuratEvent>('marriage');
  const [muStart, setMuStart] = useState(today);
  const [muEnd, setMuEnd] = useState(in30);
  const [muLat, setMuLat] = useState('19.0760');
  const [muLng, setMuLng] = useState('72.8777');

  // Chart export
  const [cvariant, setCvariant] = useState<'north' | 'south'>('north');
  const [cscale, setCscale] = useState(3);
  const [csize, setCsize] = useState(800);
  const [svgPreview, setSvgPreview] = useState<string | null>(null);

  async function doVarshphal() {
    if (!birth) { setError(t('export.error.enterBirth', 'Enter birth details first')); return; }
    setBusy(true); setError(null);
    try {
      const blob = await api.pdfVarshphal(birth, vpAge, vpName || birth.name);
      const slug = (vpName || birth.name || 'report').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      downloadBlob(blob, `varshphal-${slug}-age${vpAge}.pdf`);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function doMuhurat() {
    setBusy(true); setError(null);
    try {
      const label = MUHURAT_EVENTS.find((e) => e.value === muEvent)?.label ?? muEvent;
      const blob = await api.pdfMuhurat({
        event: muEvent,
        startDate: new Date(muStart).toISOString(),
        endDate: new Date(muEnd + 'T23:59:59').toISOString(),
        lat: Number(muLat), lng: Number(muLng),
        eventLabel: label,
      });
      downloadBlob(blob, `muhurat-${muEvent}-${muStart}.pdf`);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function doCsv() {
    if (!birth) { setError(t('export.error.enterBirth', 'Enter birth details first')); return; }
    setBusy(true); setError(null);
    try {
      const blob = await api.exportCsv(birth);
      const slug = (birth.name || 'chart').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      downloadBlob(blob, `chart-${slug}.csv`);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function doXlsx() {
    if (!birth) { setError(t('export.error.enterBirth', 'Enter birth details first')); return; }
    setBusy(true); setError(null);
    try {
      const blob = await api.exportXlsx(birth);
      const slug = (birth.name || 'chart').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      downloadBlob(blob, `chart-${slug}.xlsx`);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  async function doSvgPreview() {
    if (!birth) { setError(t('export.error.enterBirth', 'Enter birth details first')); return; }
    setBusy(true); setError(null);
    try {
      const blob = await api.exportSvg(birth, cvariant, csize, false);
      const text = await blob.text();
      setSvgPreview(text);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function doSvgDownload() {
    if (!birth) { setError(t('export.error.enterBirth', 'Enter birth details first')); return; }
    setBusy(true); setError(null);
    try {
      const blob = await api.exportSvg(birth, cvariant, csize, true);
      downloadBlob(blob, `chart-${cvariant}-${csize}.svg`);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  async function doPngDownload() {
    if (!birth) { setError(t('export.error.enterBirth', 'Enter birth details first')); return; }
    setBusy(true); setError(null);
    try {
      const blob = await api.exportPng(birth, cvariant, cscale);
      downloadBlob(blob, `chart-${cvariant}-${cscale}x.png`);
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }

  return (
    <PageShell
      title={t('export.title', 'Print & Export')}
      subtitle={t('export.subtitle', 'Books, drag/drop custom reports, and data/chart export (CSV · XLSX · SVG · PNG).')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={setBirth} loading={busy} />
          {birth && (
            <Card>
              <div className="text-xs text-vedicMaroon/70 space-y-1">
                <div className="flex gap-2"><Pill tone="good">{t('export.loaded', 'Loaded')}</Pill> <span>{birth.name ?? t('export.subjectFallback', 'Subject')}</span></div>
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

          {tab === 'varshphal' && (
            <Card>
              <h2 className="text-lg font-semibold text-vedicMaroon mb-3">{t('export.varshphal.title', 'Varshphal Book')}</h2>
              <p className="text-xs text-vedicMaroon/70 mb-3">
                {t('export.varshphal.intro', 'Generates a complete annual Tajika horoscope as a multi-page A4 PDF — solar-return chart, Muntha/Varshesha, 24 Sahams, Mudda Dasha, and Masa-Phala.')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <label className="text-xs text-vedicMaroon/80">
                  {t('export.varshphal.age', 'Age (years to project for)')}
                  <input type="number" min={0} max={120} className="input mt-1"
                    value={vpAge} onChange={(e) => setVpAge(Number(e.target.value))} />
                </label>
                <label className="text-xs text-vedicMaroon/80">
                  {t('export.varshphal.subjectName', 'Subject name (optional override)')}
                  <input className="input mt-1" value={vpName} onChange={(e) => setVpName(e.target.value)} placeholder={birth?.name ?? ''} />
                </label>
              </div>
              <button className="btn btn-primary" onClick={doVarshphal} disabled={busy || !birth}>
                {busy ? t('export.varshphal.building', 'Building PDF…') : t('export.varshphal.btn', 'Download Varshphal PDF')}
              </button>
              {!birth && <div className="text-xs text-vedicMaroon/60 italic mt-2">{t('export.enterBirthFirstPeriod', 'Enter birth details first.')}</div>}
            </Card>
          )}

          {tab === 'muhurat' && (
            <Card>
              <h2 className="text-lg font-semibold text-vedicMaroon mb-3">{t('export.muhurat.title', 'Muhurta Book')}</h2>
              <p className="text-xs text-vedicMaroon/70 mb-3">
                {t('export.muhurat.intro', 'Ranks every candidate day in your range by panchang auspiciousness for the selected event and prints the top 20 windows with reasons and cautions.')}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <label className="text-xs text-vedicMaroon/80 md:col-span-2">
                  {t('export.muhurat.event', 'Event')}
                  <select className="input mt-1" value={muEvent} onChange={(e) => setMuEvent(e.target.value as MuhuratEvent)}>
                    {MUHURAT_EVENTS.map((e) => <option key={e.value} value={e.value}>{e.label}</option>)}
                  </select>
                </label>
                <label className="text-xs text-vedicMaroon/80">
                  {t('export.muhurat.startDate', 'Start date')}
                  <input type="date" className="input mt-1" value={muStart} onChange={(e) => setMuStart(e.target.value)} />
                </label>
                <label className="text-xs text-vedicMaroon/80">
                  {t('export.muhurat.endDate', 'End date')}
                  <input type="date" className="input mt-1" value={muEnd} onChange={(e) => setMuEnd(e.target.value)} />
                </label>
                <label className="text-xs text-vedicMaroon/80">
                  {t('export.muhurat.latitude', 'Latitude')}
                  <input className="input mt-1" value={muLat} onChange={(e) => setMuLat(e.target.value)} />
                </label>
                <label className="text-xs text-vedicMaroon/80">
                  {t('export.muhurat.longitude', 'Longitude')}
                  <input className="input mt-1" value={muLng} onChange={(e) => setMuLng(e.target.value)} />
                </label>
              </div>
              <button className="btn btn-primary" onClick={doMuhurat} disabled={busy}>
                {busy ? t('export.varshphal.building', 'Building PDF…') : t('export.muhurat.btn', 'Download Muhurta PDF')}
              </button>
            </Card>
          )}

          {tab === 'custom' && (
            <CustomBuilder birth={birth} setError={setError} />
          )}

          {tab === 'data' && (
            <Card>
              <h2 className="text-lg font-semibold text-vedicMaroon mb-3">{t('export.data.title', 'Data Export')}</h2>
              <p className="text-xs text-vedicMaroon/70 mb-3">
                {t('export.data.intro', 'Raw chart data in spreadsheet formats. XLSX has four sheets (Overview · Planets · Houses · Vimshottari); CSV is a single flat sheet.')}
              </p>
              <div className="flex flex-wrap gap-2">
                <button className="btn btn-secondary" onClick={doCsv} disabled={busy || !birth}>
                  {busy ? t('export.data.exporting', 'Exporting…') : t('export.data.csv', 'Download CSV')}
                </button>
                <button className="btn btn-primary" onClick={doXlsx} disabled={busy || !birth}>
                  {busy ? t('export.data.exporting', 'Exporting…') : t('export.data.xlsx', 'Download XLSX')}
                </button>
              </div>
              {!birth && <div className="text-xs text-vedicMaroon/60 italic mt-2">{t('export.enterBirthFirstPeriod', 'Enter birth details first.')}</div>}
            </Card>
          )}

          {tab === 'chart' && (
            <>
              <Card>
                <h2 className="text-lg font-semibold text-vedicMaroon mb-3">{t('export.chart.title', 'Chart Export')}</h2>
                <p className="text-xs text-vedicMaroon/70 mb-3">
                  {t('export.chart.intro', 'Hi-resolution vector (SVG) or raster (PNG) chart artwork for print, slides, or social posts. PNG is rasterized at configurable scale (1× baseline 600 px → 8× for 4800 px print).')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <label className="text-xs text-vedicMaroon/80">
                    {t('export.chart.style', 'Chart style')}
                    <select className="input mt-1" value={cvariant} onChange={(e) => setCvariant(e.target.value as 'north' | 'south')}>
                      <option value="north">{t('export.chart.style.north', 'North Indian (diamond)')}</option>
                      <option value="south">{t('export.chart.style.south', 'South Indian (fixed grid)')}</option>
                    </select>
                  </label>
                  <label className="text-xs text-vedicMaroon/80">
                    {t('export.chart.svgSize', 'SVG viewBox size (px)')}
                    <input type="number" min={240} max={2400} step={40} className="input mt-1"
                      value={csize} onChange={(e) => setCsize(Number(e.target.value))} />
                  </label>
                  <label className="text-xs text-vedicMaroon/80">
                    {t('export.chart.pngScale', 'PNG scale (1× – 8×)')}
                    <input type="number" min={1} max={8} step={1} className="input mt-1"
                      value={cscale} onChange={(e) => setCscale(Number(e.target.value))} />
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-secondary" onClick={doSvgPreview} disabled={busy || !birth}>{t('export.chart.previewSvg', 'Preview SVG')}</button>
                  <button className="btn btn-secondary" onClick={doSvgDownload} disabled={busy || !birth}>{t('export.chart.downloadSvg', 'Download SVG')}</button>
                  <button className="btn btn-primary" onClick={doPngDownload} disabled={busy || !birth}>
                    {t('export.chart.downloadPng', 'Download PNG')} ({cscale}× · {600 * cscale}px)
                  </button>
                </div>
                {!birth && <div className="text-xs text-vedicMaroon/60 italic mt-2">{t('export.enterBirthFirstPeriod', 'Enter birth details first.')}</div>}
              </Card>

              {svgPreview && (
                <Card>
                  <h3 className="text-sm font-semibold text-vedicMaroon mb-3">{t('export.chart.preview', 'Preview')}</h3>
                  <div className="flex justify-center bg-white rounded border border-vedicGold/30 p-4"
                       dangerouslySetInnerHTML={{ __html: svgPreview }} />
                </Card>
              )}

              {!svgPreview && (
                <EmptyState>
                  {t('export.chart.previewHint', 'Click "Preview SVG" to see the chart before downloading.')}
                </EmptyState>
              )}
            </>
          )}
        </main>
      </div>
    </PageShell>
  );
}
