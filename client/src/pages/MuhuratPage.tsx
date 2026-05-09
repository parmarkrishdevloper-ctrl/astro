import { useState } from 'react';
import { Card, PageShell, ErrorBanner, EmptyState, Pill } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import { CityAutocomplete } from '../components/forms/CityAutocomplete';
import type { MuhuratEvent, MuhuratResult } from '../types';

const EVENT_KEYS: { value: MuhuratEvent; key: string; fallback: string }[] = [
  { value: 'marriage',         key: 'muhurat.event.marriage',        fallback: 'Marriage' },
  { value: 'griha-pravesh',    key: 'muhurat.event.grihaPravesh',    fallback: 'Griha Pravesh (House Warming)' },
  { value: 'travel',           key: 'muhurat.event.travel',          fallback: 'Travel' },
  { value: 'business',         key: 'muhurat.event.business',        fallback: 'Business / Inauguration' },
  { value: 'education',        key: 'muhurat.event.education',       fallback: 'Education / Vidyarambha' },
  { value: 'vehicle-purchase', key: 'muhurat.event.vehiclePurchase', fallback: 'Vehicle Purchase' },
  { value: 'general',          key: 'muhurat.event.general',         fallback: 'General Auspicious' },
];

export function MuhuratPage() {
  const { t } = useT();
  const today = new Date();
  const inOneMonth = new Date(today.getTime() + 30 * 86400000);
  const [event, setEvent] = useState<MuhuratEvent>('marriage');
  const [start, setStart] = useState(today.toISOString().slice(0, 10));
  const [end, setEnd]     = useState(inOneMonth.toISOString().slice(0, 10));
  const [lat, setLat]     = useState(28.6139);
  const [lng, setLng]     = useState(77.2090);
  const [city, setCity]   = useState('New Delhi, Delhi');
  const [result, setResult] = useState<MuhuratResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [birthNak, setBirthNak] = useState<number | ''>('');
  const [stepMin, setStepMin]   = useState(60);
  const [advResult, setAdvResult] = useState<Awaited<ReturnType<typeof api.muhuratAdvanced>>['muhurat'] | null>(null);

  async function search() {
    setLoading(true); setError(null); setResult(null); setAdvResult(null);
    try {
      if (advanced) {
        const r = await api.muhuratAdvanced(event, start, end, lat, lng, {
          birthNakshatra: birthNak === '' ? undefined : Number(birthNak),
          stepMinutes: stepMin,
        });
        setAdvResult(r.muhurat);
      } else {
        const r = await api.muhurat(event, start, end, lat, lng);
        setResult(r.muhurat);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  return (
    <PageShell title={t('muhurat.title', 'Muhurat Finder')} subtitle={t('muhurat.subtitle', 'Find auspicious time windows for important events.')}>
      <Card className="mb-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label={t('muhurat.event', 'Event Type')}>
            <select value={event} onChange={(e) => setEvent(e.target.value as MuhuratEvent)}
              className="w-full rounded-lg border border-vedicGold/40 px-3 py-2 text-sm bg-white">
              {EVENT_KEYS.map((e) => <option key={e.value} value={e.value}>{t(e.key, e.fallback)}</option>)}
            </select>
          </Field>
          <Field label={t('common.from', 'From')}>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-lg border border-vedicGold/40 px-3 py-2 text-sm" />
          </Field>
          <Field label={t('common.to', 'To')}>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-lg border border-vedicGold/40 px-3 py-2 text-sm" />
          </Field>
          <Field label={t('common.city', 'City')}>
            <CityAutocomplete
              value={city}
              onChange={setCity}
              onCitySelect={(c) => { setCity(`${c.name}, ${c.admin}`); setLat(c.lat); setLng(c.lng); }}
            />
          </Field>
          <Field label={t('form.lat', 'Latitude')}>
            <input type="number" step="0.0001" value={lat} onChange={(e) => setLat(+e.target.value)}
              className="w-full rounded-lg border border-vedicGold/40 px-3 py-2 text-sm tabular-nums" />
          </Field>
          <Field label={t('form.lng', 'Longitude')}>
            <input type="number" step="0.0001" value={lng} onChange={(e) => setLng(+e.target.value)}
              className="w-full rounded-lg border border-vedicGold/40 px-3 py-2 text-sm tabular-nums" />
          </Field>
          <div className="flex items-end">
            <button onClick={search} disabled={loading}
              className="w-full rounded-lg bg-saffron hover:bg-deepSaffron text-white py-2.5 text-sm font-semibold disabled:opacity-50">
              {loading ? t('muhurat.searching', 'Searching…') : advanced ? t('muhurat.findAdvanced', 'Find Advanced Muhurat') : t('muhurat.find', 'Find Muhurat')}
            </button>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-vedicGold/30">
          <label className="inline-flex items-center gap-2 text-sm text-vedicMaroon cursor-pointer">
            <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
            <span className="font-semibold">{t('muhurat.advancedMode', 'Advanced mode')}</span>
            <span className="text-vedicMaroon/60 text-xs">{t('muhurat.advancedDesc', '(hourly granularity, Chaughadia, Hora, Tara Bala)')}</span>
          </label>
          {advanced && (
            <div className="grid md:grid-cols-3 gap-4 mt-3">
              <Field label={t('muhurat.birthNakshatra', 'Birth Nakshatra # (1..27) for Tara Bala')}>
                <input type="number" min="1" max="27" value={birthNak}
                  onChange={(e) => setBirthNak(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder={t('muhurat.birthNakHint', 'e.g. 4 = Rohini')}
                  className="w-full rounded-lg border border-vedicGold/40 px-3 py-2 text-sm bg-white tabular-nums" />
              </Field>
              <Field label={t('muhurat.slotDuration', 'Slot duration (minutes)')}>
                <select value={stepMin} onChange={(e) => setStepMin(Number(e.target.value))}
                  className="w-full rounded-lg border border-vedicGold/40 px-3 py-2 text-sm bg-white">
                  <option value={30}>{t('muhurat.minutes30', '30 min')}</option>
                  <option value={60}>{t('muhurat.minutes60', '60 min (default)')}</option>
                  <option value={120}>{t('muhurat.hours2', '2 hours')}</option>
                  <option value={240}>{t('muhurat.hours4', '4 hours')}</option>
                </select>
              </Field>
            </div>
          )}
        </div>
      </Card>

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {!result && !advResult && !loading && !error && <EmptyState>{t('muhurat.empty', 'Pick an event and date range.')}</EmptyState>}

      {advResult && (
        <Card title={t('muhurat.slotsHeader', '{n} slot(s) — ranked by score ({total} evaluated)').replace('{n}', String(advResult.slots.length)).replace('{total}', String(advResult.totalSlotsEvaluated))}>
          <div className="space-y-2">
            {advResult.slots.slice(0, 20).map((s, i) => {
              const tone = s.score >= 14 ? 'good' : s.score >= 10 ? 'warn' : 'bad';
              const chTone = s.chaughadiaQuality === 'good' ? 'text-emerald-700'
                : s.chaughadiaQuality === 'bad' ? 'text-red-700' : 'text-amber-700';
              return (
                <div key={i} className="border border-vedicGold/30 rounded-lg p-3 bg-parchment/40">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-vedicMaroon">
                        {new Date(s.start).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {' → '}
                        {new Date(s.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-[11px] text-vedicMaroon/60 mt-1 flex gap-3 flex-wrap">
                        <span>{t('muhurat.hora', 'Hora')}: <strong className="text-vedicMaroon">{s.hora}</strong></span>
                        <span>{t('muhurat.chaughadia', 'Chaughadia')}: <strong className={chTone}>{s.chaughadia}</strong></span>
                        {s.tara && <span>{t('muhurat.tara', 'Tara')}: <strong className={s.tara.score > 0 ? 'text-emerald-700' : s.tara.score < 0 ? 'text-red-700' : 'text-vedicMaroon'}>{s.tara.name}</strong></span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-vedicMaroon tabular-nums">{s.score.toFixed(1)}</div>
                      <Pill tone={tone}>{t('muhurat.scoreOf20', 'score / 20')}</Pill>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                    <Snap label={t('panchang.tithi', 'Tithi')} v={s.panchang.tithi} />
                    <Snap label={t('panchang.nakshatra', 'Nakshatra')} v={s.panchang.nakshatra} />
                    <Snap label={t('panchang.vara', 'Vara')} v={s.panchang.vara} />
                    <Snap label={t('panchang.yoga', 'Yoga')} v={s.panchang.yoga} />
                  </div>
                  {s.reasons.length > 0 && (
                    <ul className="mt-1 text-[11px] text-emerald-800 list-disc pl-5">
                      {s.reasons.map((r, j) => <li key={j}>{r}</li>)}
                    </ul>
                  )}
                  {s.warnings.length > 0 && (
                    <ul className="mt-1 text-[11px] text-amber-800 list-disc pl-5">
                      {s.warnings.map((r, j) => <li key={j}>{r}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {result && (
        <Card title={t('muhurat.windowsHeader', '{n} window(s) — ranked by score ({total} days evaluated)').replace('{n}', String(result.windows.length)).replace('{total}', String(result.totalCandidatesEvaluated))}>
          <div className="space-y-3">
            {result.windows.slice(0, 10).map((w, i) => {
              const tone = w.score >= 8 ? 'good' : w.score >= 6 ? 'warn' : 'bad';
              return (
                <div key={i} className="border border-vedicGold/30 rounded-lg p-4 bg-parchment/40">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-base font-bold text-vedicMaroon">
                        {new Date(w.start).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-vedicMaroon/70 mt-1">
                        {new Date(w.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} — {' '}
                        {new Date(w.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-vedicMaroon tabular-nums">{w.score.toFixed(1)}</div>
                      <Pill tone={tone}>{t('muhurat.score', 'score')}</Pill>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                    <Snap label={t('panchang.tithi', 'Tithi')} v={w.panchangSnapshot.tithi} />
                    <Snap label={t('panchang.nakshatra', 'Nakshatra')} v={w.panchangSnapshot.nakshatra} />
                    <Snap label={t('panchang.vara', 'Vara')} v={w.panchangSnapshot.vara} />
                    <Snap label={t('panchang.yoga', 'Yoga')} v={w.panchangSnapshot.yoga} />
                  </div>
                  {w.reasons.length > 0 && (
                    <ul className="mt-2 text-xs text-emerald-800 list-disc pl-5">
                      {w.reasons.map((r, j) => <li key={j}>{r}</li>)}
                    </ul>
                  )}
                  {w.warnings.length > 0 && (
                    <ul className="mt-1 text-xs text-amber-800 list-disc pl-5">
                      {w.warnings.map((r, j) => <li key={j}>{r}</li>)}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </PageShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-vedicMaroon/70 mb-1">{label}</div>
      {children}
    </label>
  );
}

function Snap({ label, v }: { label: string; v: string }) {
  return (
    <div className="rounded bg-white/70 border border-vedicGold/20 px-2 py-1">
      <span className="text-vedicMaroon/50 mr-1">{label}:</span>
      {/* TODO(i18n-server): localize panchang snapshot strings (tithi, nakshatra, vara, yoga) */}
      <span className="font-semibold text-vedicMaroon" lang="en">{v}</span>
    </div>
  );
}
