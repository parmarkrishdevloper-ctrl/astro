// Saved-charts picker that replaces the old "Load preset…" select on the
// Birth Details form. Lists every chart the user has saved into the
// embedded SQLite library (server: `charts` table; API: /api/library/charts),
// with live name search, one-click load, delete, and a "Save current" button
// that captures the form's current values into a new library entry.
//
// Usage:
//   <SavedChartsDropdown
//     current={{ name, placeName, datetime, tzOffsetHours, lat, lng }}
//     onLoad={(c) => applyToForm(c)}
//   />
//
// The component is a self-contained popover — clicking outside dismisses it.

import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/jyotish';
import { useT } from '../../i18n';
import type { BirthInput } from '../../types';

interface SavedChart {
  _id: string;
  label: string;
  relationship?: string;
  datetime: string;
  placeName?: string;
  lat: number;
  lng: number;
  tzOffsetHours?: number;
  updatedAt?: string;
}

interface Preset {
  labelKey: string;
  labelFallback: string;
  value: BirthInput;
}

interface Props {
  /** Form's current values — used by the "Save current" button. */
  current: BirthInput;
  /** Called when a user picks a saved chart or sample preset. */
  onLoad: (chart: BirthInput) => void;
  /** Sample fallback presets (the old hardcoded list) — shown at the bottom. */
  presets?: Preset[];
}

export function SavedChartsDropdown({ current, onLoad, presets = [] }: Props) {
  const { t } = useT();
  const [open, setOpen]       = useState(false);
  const [charts, setCharts]   = useState<SavedChart[]>([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Re-fetch the saved-charts list whenever the popover opens. Keeping this
  // lazy (and not polling) keeps the form snappy while still showing fresh
  // data right when the user goes to pick.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true); setErr(null);
    api.libraryList()
      .then((r) => { if (!cancelled) setCharts(r.charts || []); })
      .catch((e) => { if (!cancelled) setErr((e as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]);

  // Click-outside dismisses the popover.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  // Filter saved charts by name. Case-insensitive substring match.
  const q = search.trim().toLowerCase();
  const filtered = q
    ? charts.filter((c) => (c.label || '').toLowerCase().includes(q)
                        || (c.placeName || '').toLowerCase().includes(q))
    : charts;

  function handleLoad(c: SavedChart) {
    onLoad({
      name:          c.label,
      placeName:     c.placeName,
      datetime:      c.datetime,
      tzOffsetHours: c.tzOffsetHours,
      lat:           c.lat,
      lng:           c.lng,
    });
    setOpen(false);
  }

  function handlePreset(p: Preset) {
    onLoad(p.value);
    setOpen(false);
  }

  async function handleSaveCurrent() {
    const label = (current.name && current.name.trim())
      || prompt(t('form.savePrompt', 'Name for this chart?')) || '';
    if (!label.trim()) return;
    setSaving(true); setErr(null);
    try {
      await api.libraryCreate({
        label: label.trim(),
        relationship: 'other',
        datetime:      current.datetime,
        tzOffsetHours: current.tzOffsetHours,
        lat:           current.lat,
        lng:           current.lng,
        placeName:     current.placeName,
      });
      // Re-fetch the list so the new entry appears immediately.
      const r = await api.libraryList();
      setCharts(r.charts || []);
    } catch (e) {
      setErr((e as Error).message);
    } finally { setSaving(false); }
  }

  async function handleDelete(c: SavedChart, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(t('form.deleteConfirm', 'Delete chart "{name}"?').replace('{name}', c.label))) return;
    try {
      await api.libraryDelete(c._id);
      setCharts((prev) => prev.filter((x) => x._id !== c._id));
    } catch (er) {
      setErr((er as Error).message);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input text-xs py-1 flex items-center justify-between gap-2"
        style={{ width: 'auto', minWidth: 160, maxWidth: 200 }}
      >
        <span className="truncate">
          {t('form.savedCharts', 'Saved charts')}
          {charts.length > 0 && <span className="ml-1.5 text-vedicMaroon/50">({charts.length})</span>}
        </span>
        <span className="text-[10px] opacity-60">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div
          className="absolute right-0 z-30 mt-1 w-[320px] rounded-lg border bg-white shadow-xl"
          style={{ borderColor: 'var(--border-subtle, #E2D5B8)' }}
        >
          {/* Search + Save current */}
          <div className="p-2 border-b border-vedicGold/20 flex gap-2 items-center">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('form.searchByName', 'Search by name…')}
              className="input text-xs flex-1 py-1"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveCurrent}
              disabled={saving}
              className="text-[11px] font-semibold px-2 py-1 rounded
                         bg-vedicMaroon text-white hover:bg-vedicMaroon/90
                         disabled:opacity-50 whitespace-nowrap"
              title={t('form.saveCurrentTitle', 'Save the current birth details to your library')}
            >
              {saving ? '…' : `+ ${t('form.saveCurrent', 'Save')}`}
            </button>
          </div>

          {/* List body */}
          <div className="max-h-[320px] overflow-auto py-1">
            {err && <div className="px-3 py-2 text-[11px] text-red-700">{err}</div>}
            {loading && (
              <div className="px-3 py-3 text-[11px] text-vedicMaroon/60 text-center">
                {t('form.loadingCharts', 'Loading saved charts…')}
              </div>
            )}

            {!loading && filtered.length === 0 && !q && charts.length === 0 && (
              <div className="px-3 py-3 text-[11px] text-vedicMaroon/60 text-center italic">
                {t('form.noChartsYet', 'No charts saved yet — fill the form and click "+ Save".')}
              </div>
            )}
            {!loading && filtered.length === 0 && q && (
              <div className="px-3 py-3 text-[11px] text-vedicMaroon/60 text-center italic">
                {t('form.noMatch', 'No charts match "{q}".').replace('{q}', q)}
              </div>
            )}

            {filtered.length > 0 && (
              <div className="px-1">
                <div className="px-2 pt-1 pb-1 text-[10px] uppercase tracking-wider text-vedicMaroon/50">
                  {t('form.yourCharts', 'Your saved charts')}
                </div>
                {filtered.map((c) => (
                  <div
                    key={c._id}
                    onClick={() => handleLoad(c)}
                    className="group px-2 py-1.5 rounded hover:bg-vedicCream/60 cursor-pointer flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-vedicMaroon truncate">{c.label}</div>
                      <div className="text-[10px] text-vedicMaroon/60 truncate">
                        {c.datetime?.slice(0, 10)}
                        {c.placeName ? ` · ${c.placeName}` : ''}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(c, e)}
                      className="opacity-0 group-hover:opacity-100 text-red-700 text-xs px-1 leading-none transition"
                      title={t('form.delete', 'Delete')}
                      aria-label={`Delete ${c.label}`}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Sample presets */}
            {presets.length > 0 && !q && (
              <div className="px-1 pt-2 mt-1 border-t border-vedicGold/15">
                <div className="px-2 pt-1 pb-1 text-[10px] uppercase tracking-wider text-vedicMaroon/50">
                  {t('form.samplePresets', 'Sample presets')}
                </div>
                {presets.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => handlePreset(p)}
                    className="px-2 py-1.5 rounded hover:bg-vedicCream/60 cursor-pointer text-xs text-vedicMaroon/80"
                  >
                    {t(p.labelKey, p.labelFallback)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
