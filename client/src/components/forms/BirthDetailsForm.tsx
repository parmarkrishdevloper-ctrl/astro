import { FormEvent, useEffect, useState } from 'react';
import type { AyanamsaInfo, BirthInput, ChartOptions } from '../../types';
import { api } from '../../api/jyotish';
import { useT } from '../../i18n';
import { CityAutocomplete } from './CityAutocomplete';
import { SavedChartsDropdown } from './SavedChartsDropdown';
import { useActiveChart } from '../../store/active-chart.store';

interface Props {
  onSubmit: (input: BirthInput) => void;
  loading?: boolean;
  /** Optional seed — when this object changes by reference, the form rehydrates.
   *  If absent and the active-chart store has a saved chart, the form hydrates
   *  from that automatically so the user enters details once for the whole app. */
  initialValue?: Partial<BirthInput> & { datetime?: string; lat?: number; lng?: number; placeName?: string };
  /** When true (default), auto-fires `onSubmit(activeChart)` once on mount if
   *  the active-chart store has a saved chart, so navigating to a new page
   *  shows the analysis without an extra click. Set false on pages where the
   *  user must always click Generate (e.g. matching needs two charts). */
  autoCompute?: boolean;
}

type Preset = { labelKey: string; labelFallback: string; value: Omit<BirthInput, 'datetime'> & { datetime: string } };
const PRESETS: Preset[] = [
  { labelKey: 'form.preset.delhi', labelFallback: 'New Delhi (1990-08-15 10:30 IST)',
    value: { name: 'Sample', placeName: 'New Delhi, India',
      datetime: '1990-08-15T10:30', tzOffsetHours: 5.5, lat: 28.6139, lng: 77.2090 } },
  { labelKey: 'form.preset.mumbai', labelFallback: 'Mumbai (1985-04-22 06:15 IST)',
    value: { name: 'Sample', placeName: 'Mumbai, India',
      datetime: '1985-04-22T06:15', tzOffsetHours: 5.5, lat: 19.0760, lng: 72.8777 } },
];

export function BirthDetailsForm({ onSubmit, loading, initialValue, autoCompute = true }: Props) {
  const { t } = useT();
  const setActiveChart = useActiveChart((s) => s.setActive);
  const activeChart    = useActiveChart((s) => s.active);

  // Initial form state — seed from active-chart store if no `initialValue` was
  // passed, so users who entered details on one page see them prefilled here.
  const seed = initialValue ?? activeChart ?? null;
  const [name, setName]               = useState(seed?.name ?? 'Sample');
  const [placeName, setPlaceName]     = useState(seed?.placeName ?? 'New Delhi, India');
  const [datetime, setDatetime]       = useState(seed?.datetime?.slice(0, 16) ?? '1990-08-15T10:30');
  const [tzOffsetHours, setTz]        = useState(seed?.tzOffsetHours ?? 5.5);
  const [lat, setLat]                 = useState(seed?.lat ?? 28.6139);
  const [lng, setLng]                 = useState(seed?.lng ?? 77.2090);

  // Rehydrate from `initialValue` when its reference changes (caller-driven).
  useEffect(() => {
    if (!initialValue) return;
    if (initialValue.placeName !== undefined) setPlaceName(initialValue.placeName);
    if (initialValue.datetime  !== undefined) {
      // Convert ISO with T to the form's naive 'YYYY-MM-DDTHH:MM' shape
      setDatetime(initialValue.datetime.slice(0, 16));
    }
    if (typeof initialValue.tzOffsetHours === 'number') setTz(initialValue.tzOffsetHours);
    if (typeof initialValue.lat === 'number') setLat(initialValue.lat);
    if (typeof initialValue.lng === 'number') setLng(initialValue.lng);
    if (typeof initialValue.name === 'string') setName(initialValue.name);
  }, [initialValue]);

  // Rehydrate from the active-chart store when it changes (e.g. user changes
  // the active chart from the header dropdown while sitting on this page).
  // We deliberately only run this when the caller did NOT pass an explicit
  // `initialValue` — caller-driven seeds always win.
  useEffect(() => {
    if (initialValue || !activeChart) return;
    if (activeChart.placeName !== undefined) setPlaceName(activeChart.placeName);
    if (activeChart.datetime  !== undefined) setDatetime(activeChart.datetime.slice(0, 16));
    if (typeof activeChart.tzOffsetHours === 'number') setTz(activeChart.tzOffsetHours);
    if (typeof activeChart.lat === 'number') setLat(activeChart.lat);
    if (typeof activeChart.lng === 'number') setLng(activeChart.lng);
    if (typeof activeChart.name === 'string') setName(activeChart.name);
    // Dependency list intentionally omits state setters; they are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChart]);

  // Chart options — Phase 8: zodiac-mode toggle + ayanamsa selector.
  const [tropical, setTropical] = useState<boolean>(false);
  const [ayanamsa, setAyanamsa] = useState<string>('lahiri');
  const [ayanamsaList, setAyanamsaList] = useState<AyanamsaInfo[]>([]);
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);

  useEffect(() => {
    api.ayanamsas().then((r) => setAyanamsaList(r.ayanamsas)).catch(() => {});
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const options: ChartOptions = { ayanamsa, tropical };
    const input: BirthInput = { name, placeName, datetime, tzOffsetHours, lat, lng, options };
    // Promote whatever the user typed to the active chart so every other page
    // automatically sees the same details when they navigate.
    setActiveChart(input);
    onSubmit(input);
  }

  // Auto-compute on mount when an active chart is loaded — so navigating to
  // a new page using BirthDetailsForm fires the computation immediately
  // without the user clicking Generate again. We track this in a ref so we
  // never double-fire across re-renders, and we only fire when the caller
  // didn't pass an explicit `initialValue` (caller-driven seeds always win).
  const [autoFired, setAutoFired] = useState(false);
  useEffect(() => {
    if (!autoCompute || autoFired) return;
    if (initialValue) return;          // caller is in control
    if (!activeChart) return;          // nothing to fire with
    setAutoFired(true);
    onSubmit(activeChart);
    // Don't include onSubmit in deps — pages typically declare it inline so
    // its identity changes every render and would re-fire infinitely.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoCompute, activeChart, initialValue, autoFired]);

  function applyPreset(idx: number) {
    const p = PRESETS[idx].value;
    setName(p.name ?? '');
    setPlaceName(p.placeName ?? '');
    setDatetime(p.datetime);
    setTz(p.tzOffsetHours ?? 0);
    setLat(p.lat);
    setLng(p.lng);
  }

  /** Load a saved chart (or sample preset) into the form fields. The
   *  dropdown component normalises both into the BirthInput shape. */
  function applySavedChart(c: BirthInput) {
    if (typeof c.name === 'string')           setName(c.name);
    if (typeof c.placeName === 'string')      setPlaceName(c.placeName);
    if (typeof c.datetime === 'string')       setDatetime(c.datetime.slice(0, 16));
    if (typeof c.tzOffsetHours === 'number')  setTz(c.tzOffsetHours);
    if (typeof c.lat === 'number')            setLat(c.lat);
    if (typeof c.lng === 'number')            setLng(c.lng);
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <header className="card-header">
        <h3 className="card-header-title">{t('form.birthDetails')}</h3>
        <SavedChartsDropdown
          current={{ name, placeName, datetime, tzOffsetHours, lat, lng }}
          onLoad={applySavedChart}
          presets={PRESETS}
        />
      </header>

      <div className="card-body space-y-3">
        <Field label={t('form.name')}>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </Field>
        <Field label={t('form.place')}>
          <CityAutocomplete
            value={placeName}
            onChange={setPlaceName}
            onCitySelect={(c) => { setPlaceName(`${c.name}, ${c.admin}`); setLat(c.lat); setLng(c.lng); setTz(c.tz); }}
            placeholder={t('form.cityPlaceholder', 'Delhi, Mumbai, New York…')}
          />
        </Field>
        <Field label={t('form.datetime')}>
          <input type="datetime-local" value={datetime}
            onChange={(e) => setDatetime(e.target.value)} required className="input" />
        </Field>

        <div className="grid grid-cols-3 gap-2">
          <Field label={t('form.lat')}>
            <input type="number" step="0.0001" value={lat}
              onChange={(e) => setLat(Number(e.target.value))} required
              className="input tabular-nums" />
          </Field>
          <Field label={t('form.lng')}>
            <input type="number" step="0.0001" value={lng}
              onChange={(e) => setLng(Number(e.target.value))} required
              className="input tabular-nums" />
          </Field>
          <Field label={t('form.tz')}>
            <input type="number" step="0.25" value={tzOffsetHours}
              onChange={(e) => setTz(Number(e.target.value))} required
              className="input tabular-nums" />
          </Field>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setOptionsOpen((v) => !v)}
            className="flex items-center justify-between w-full text-[11px] text-vedicMaroon/70 hover:text-vedicMaroon py-1"
          >
            <span>
              <span className="font-semibold">{t('form.zodiacLabel', 'Zodiac:')}</span>{' '}
              {tropical ? t('common.tropical', 'Tropical (Sayana)') : `${t('form.siderealPrefix', 'Sidereal')} · ${ayanamsa}`}
            </span>
            <span className="text-[10px] opacity-60">{optionsOpen ? t('form.optionsHide', '▴ hide') : t('form.optionsShow', '▾ options')}</span>
          </button>
          {optionsOpen && (
            <div className="mt-2 rounded-lg border border-vedicGold/30 bg-vedicCream/30 p-3 space-y-2">
              <label className="flex items-center justify-between text-[11px] text-vedicMaroon">
                <span>
                  <span className="font-semibold">{t('common.tropical', 'Tropical (Sayana)')}</span>
                  <span className="block text-[10px] text-vedicMaroon/60">{t('common.tropicalNote', 'Western zodiac — ignores ayanamsa')}</span>
                </span>
                <input
                  type="checkbox"
                  checked={tropical}
                  onChange={(e) => setTropical(e.target.checked)}
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
                  onChange={(e) => setAyanamsa(e.target.value)}
                  className="w-full rounded-md border border-vedicGold/40 bg-white px-2 py-1 text-[11px] disabled:opacity-50"
                >
                  {ayanamsaList.length === 0 && <option value="lahiri">Lahiri</option>}
                  {ayanamsaList.map((a) => (
                    <option key={a.key} value={a.key}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <button type="submit" disabled={loading}
          className="btn btn-accent w-full mt-2" style={{ padding: '10px 14px' }}>
          {loading ? (
            <>
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.22-8.56" strokeLinecap="round"/>
              </svg>
              {t('kundali.computing')}
            </>
          ) : (
            <>{t('kundali.generate')}</>
          )}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="label">{label}</div>
      {children}
    </label>
  );
}
