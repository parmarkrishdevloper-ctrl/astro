// Phase 17 — Worksheet PDF bundles.
//
// The server exposes three endpoints:
//   GET  /api/worksheet/bundles     → list of predefined report bundles
//   POST /api/worksheet/bundle/:id  → render a bundle PDF
//   POST /api/worksheet/custom      → render a custom section list
//
// Two modes:
//   • Bundle  — pick from curated bundles (Brief, Full, Predictive, …)
//   • Custom — check any subset of the 17 sections, give it a title

import { useEffect, useState } from 'react';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput, WorksheetBundle, WorksheetSectionId } from '../types';

type T = (key: string, fallback?: string) => string;

const ALL_SECTIONS: WorksheetSectionId[] = [
  'birth', 'planets', 'vimshottari', 'shadbala', 'ashtakavarga',
  'yogas', 'jaimini', 'kp', 'avasthas', 'sudarshana',
  'varshaphala', 'transits', 'chalit', 'upagrahas', 'sensitivePoints',
  'interpretation', 'remedies',
];

const SECTION_FALLBACKS: Record<WorksheetSectionId, string> = {
  birth: 'Birth details',
  planets: 'Planet table',
  vimshottari: 'Vimshottari dasha',
  ashtakavarga: 'Ashtakavarga',
  shadbala: 'Shadbala',
  yogas: 'Yogas',
  interpretation: 'Interpretation',
  remedies: 'Remedies',
  jaimini: 'Jaimini',
  kp: 'K.P. system',
  avasthas: 'Avasthas',
  sudarshana: 'Sudarshana chakra',
  varshaphala: 'Varshaphala',
  transits: 'Transits',
  chalit: 'Chalit chart',
  upagrahas: 'Upagrahas',
  sensitivePoints: 'Sensitive points',
};

function sectionLabel(t: T, id: WorksheetSectionId): string {
  return t(`worksheets.section.${id}`, SECTION_FALLBACKS[id] ?? id);
}

type Mode = 'bundle' | 'custom';

export function WorksheetsPage() {
  const { t } = useT();
  const [birth, setBirth] = useState<BirthInput | null>(null);
  const [bundles, setBundles] = useState<WorksheetBundle[]>([]);
  const [mode, setMode] = useState<Mode>('bundle');
  const [subjectName, setSubjectName] = useState('');
  const [customTitle, setCustomTitle] = useState(t('worksheets.defaultTitle', 'Custom Worksheet'));
  const [customSections, setCustomSections] = useState<Set<WorksheetSectionId>>(
    new Set(['birth', 'planets', 'vimshottari']),
  );
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.worksheetBundles()
      .then((r) => setBundles(r.bundles))
      .catch((e) => setError((e as Error).message));
  }, []);

  async function downloadBundle(b: WorksheetBundle) {
    if (!birth) return;
    setGeneratingId(b.id); setError(null);
    try {
      const blob = await api.worksheetBundlePdf(b.id, birth, subjectName || birth.name);
      const fallback = t('worksheets.fallbackName', 'report');
      triggerDownload(blob, `${b.id}-${(subjectName || birth.name || fallback).replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (e) {
      setError((e as Error).message);
    } finally { setGeneratingId(null); }
  }

  async function downloadCustom() {
    if (!birth || customSections.size === 0) return;
    setGeneratingId('custom'); setError(null);
    try {
      const blob = await api.worksheetCustomPdf(birth, {
        title: customTitle || t('worksheets.defaultTitle', 'Custom Worksheet'),
        subjectName: subjectName || birth.name,
        sections: ALL_SECTIONS.filter((id) => customSections.has(id)).map((id) => ({ id })),
      });
      const filenameBase = customTitle || t('worksheets.defaultFilename', 'worksheet');
      triggerDownload(blob, `${filenameBase.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } catch (e) {
      setError((e as Error).message);
    } finally { setGeneratingId(null); }
  }

  function toggleSection(id: WorksheetSectionId) {
    const next = new Set(customSections);
    if (next.has(id)) next.delete(id); else next.add(id);
    setCustomSections(next);
  }

  return (
    <PageShell
      title={t('worksheets.title', 'Worksheets')}
      subtitle={t('worksheets.subtitle', 'Curated and custom PDF bundles — mix any of 17 Vedic sections into a single report.')}
    >
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        <aside className="space-y-4">
          <BirthDetailsForm onSubmit={setBirth} loading={false} />
          <SubjectCard t={t} value={subjectName} onChange={setSubjectName} />
          <ModeToggle t={t} mode={mode} onChange={setMode} />
        </aside>

        <main className="space-y-6">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {!birth && !error && (
            <EmptyState>{t('worksheets.empty', 'Enter birth details to enable PDF generation.')}</EmptyState>
          )}

          {birth && mode === 'bundle' && (
            <BundleGrid
              t={t}
              bundles={bundles}
              onDownload={downloadBundle}
              generatingId={generatingId}
            />
          )}

          {birth && mode === 'custom' && (
            <CustomBuilder
              t={t}
              title={customTitle}
              onTitleChange={setCustomTitle}
              selected={customSections}
              onToggle={toggleSection}
              onDownload={downloadCustom}
              generating={generatingId === 'custom'}
            />
          )}
        </main>
      </div>
    </PageShell>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

function SubjectCard({
  t, value, onChange,
}: { t: T; value: string; onChange: (s: string) => void }) {
  return (
    <div className="rounded-2xl border border-vedicGold/40 bg-white p-5 shadow-sm space-y-2 text-xs">
      <h3 className="text-sm font-semibold text-vedicMaroon">{t('worksheets.subjectTitle', 'Subject')}</h3>
      <label className="block">
        <span className="block mb-1 text-vedicMaroon/70">{t('worksheets.subjectLabel', 'Name on report')}</span>
        <input
          type="text" placeholder={t('worksheets.subjectPlaceholder', '(optional — falls back to birth form name)')}
          value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-vedicGold/40 bg-white px-2 py-1.5"
        />
      </label>
    </div>
  );
}

function ModeToggle({ t, mode, onChange }: { t: T; mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="rounded-2xl border border-vedicGold/40 bg-white p-1 shadow-sm flex text-xs">
      {(['bundle', 'custom'] as Mode[]).map((m) => (
        <button key={m}
          onClick={() => onChange(m)}
          className={`flex-1 py-2 rounded-xl font-semibold capitalize transition ${
            mode === m
              ? 'bg-vedicMaroon text-white'
              : 'text-vedicMaroon hover:bg-vedicMaroon/5'
          }`}>
          {m === 'bundle' ? t('worksheets.modeBundle', 'Curated bundles') : t('worksheets.modeCustom', 'Custom build')}
        </button>
      ))}
    </div>
  );
}

function BundleGrid({
  t, bundles, onDownload, generatingId,
}: {
  t: T;
  bundles: WorksheetBundle[];
  onDownload: (b: WorksheetBundle) => void;
  generatingId: string | null;
}) {
  if (bundles.length === 0) {
    return <EmptyState>{t('worksheets.loadingBundles', 'Loading bundles…')}</EmptyState>;
  }
  return (
    <Card title={t('worksheets.bundlesTitle', 'Curated bundles — {n}').replace('{n}', String(bundles.length))}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('worksheets.bundlesDesc', 'Each bundle renders a pre-configured section ordering. Pick one and the PDF downloads directly to your machine.')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {bundles.map((b) => (
          <div key={b.id} className="rounded-xl border border-vedicGold/30 bg-vedicCream/30 p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                {/* TODO(i18n-server): localize bundle.title */}
                <h4 className="font-semibold text-vedicMaroon" lang="en">{b.title}</h4>
                <code className="text-[10px] text-vedicMaroon/50 font-mono">{b.id}</code>
              </div>
              <Pill tone="neutral">{t('worksheets.sectionCount', '{n} §').replace('{n}', String(b.sections.length))}</Pill>
            </div>
            <div className="flex flex-wrap gap-1">
              {b.sections.map((s) => (
                <span key={s}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-vedicMaroon/10 text-vedicMaroon">
                  {sectionLabel(t, s as WorksheetSectionId)}
                </span>
              ))}
            </div>
            <button
              onClick={() => onDownload(b)}
              disabled={generatingId !== null}
              className="mt-auto btn btn-primary text-xs">
              {generatingId === b.id ? t('worksheets.generating', 'Generating PDF…') : t('worksheets.downloadBtn', '⬇ Download PDF')}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CustomBuilder({
  t, title, onTitleChange, selected, onToggle, onDownload, generating,
}: {
  t: T;
  title: string;
  onTitleChange: (s: string) => void;
  selected: Set<WorksheetSectionId>;
  onToggle: (id: WorksheetSectionId) => void;
  onDownload: () => void;
  generating: boolean;
}) {
  return (
    <Card title={t('worksheets.customTitle', 'Custom build — {selected}/{total} sections').replace('{selected}', String(selected.size)).replace('{total}', String(ALL_SECTIONS.length))}>
      <p className="text-[11px] text-vedicMaroon/60 mb-3">
        {t('worksheets.customDesc', 'Pick any subset of sections. The PDF renders them in the order shown.')}
      </p>
      <label className="block mb-3 text-xs">
        <span className="block mb-1 text-vedicMaroon/70">{t('worksheets.reportTitle', 'Report title')}</span>
        <input
          type="text" value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full rounded-md border border-vedicGold/40 bg-white px-2 py-1.5"
        />
      </label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 mb-4">
        {ALL_SECTIONS.map((id) => {
          const on = selected.has(id);
          return (
            <button key={id}
              onClick={() => onToggle(id)}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition border ${
                on
                  ? 'bg-vedicMaroon/10 border-vedicMaroon/40 text-vedicMaroon'
                  : 'bg-white border-vedicGold/30 text-vedicMaroon/60 hover:bg-vedicMaroon/5'
              }`}>
              <span className={`w-3 h-3 rounded border ${
                on ? 'bg-vedicMaroon border-vedicMaroon' : 'border-vedicMaroon/40'
              }`} />
              <span className="flex-1 truncate">{sectionLabel(t, id)}</span>
            </button>
          );
        })}
      </div>
      <button
        onClick={onDownload}
        disabled={generating || selected.size === 0}
        className="btn btn-primary text-sm">
        {generating ? t('worksheets.generating', 'Generating PDF…') : t('worksheets.downloadCustom', '⬇ Download PDF ({n} sections)').replace('{n}', String(selected.size))}
      </button>
    </Card>
  );
}
