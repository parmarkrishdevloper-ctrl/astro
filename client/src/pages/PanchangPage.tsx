import { useEffect, useState } from 'react';
import { Card, PageShell, ErrorBanner } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { PanchangResult, TimeRange } from '../types';
import { CityAutocomplete } from '../components/forms/CityAutocomplete';
import type { City } from '../data/cities';

const DEFAULT_CITY: City = {
  name: 'New Delhi', admin: 'Delhi', country: 'IN',
  lat: 28.6139, lng: 77.2090, tz: 5.5,
};

function fmtTime(iso: string | null | undefined, tz: number): string {
  if (!iso) return '—';
  const d = new Date(new Date(iso).getTime() + tz * 3600 * 1000);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function fmtRange(r: TimeRange | null | undefined, tz: number): string {
  if (!r) return '—';
  return `${fmtTime(r.start, tz)} → ${fmtTime(r.end, tz)}`;
}

function fmtDeg(d: number): string {
  const deg = Math.floor(d);
  const min = Math.floor((d - deg) * 60);
  const sec = Math.round((((d - deg) * 60) - min) * 60);
  return `${deg}° ${String(min).padStart(2, '0')}′ ${String(sec).padStart(2, '0')}″`;
}

export function PanchangPage() {
  const { t, al } = useT();
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [cityInput, setCityInput] = useState('New Delhi, Delhi');
  const [city, setCity] = useState<City>(DEFAULT_CITY);
  const [data, setData] = useState<PanchangResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchPanchang() {
    setLoading(true); setError(null);
    try {
      const r = await api.panchang(date, city.lat, city.lng);
      setData(r.panchang);
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  useEffect(() => { fetchPanchang(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [date, city]);

  const tz = city.tz;

  return (
    <PageShell
      title={t('panchang.title', 'Daily Panchang')}
      subtitle={t('panchang.subtitle', 'Tithi · Nakshatra · Yoga · Karana · Muhurtas · Samvat · Ritu · Ayana — computed from Swiss Ephemeris.')}
    >
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <label className="block">
            <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{t('common.date', 'Date')}</div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </label>
          <label className="block flex-1 min-w-[240px]">
            <div className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{t('common.city', 'City')}</div>
            <CityAutocomplete
              value={cityInput}
              onChange={setCityInput}
              onCitySelect={(c) => { setCity(c); }}
              placeholder={t('panchang.cityPlaceholder', 'Type any city or village…')}
            />
          </label>
          <button onClick={fetchPanchang} disabled={loading}
            className="rounded-lg bg-saffron hover:bg-deepSaffron text-white px-5 py-2 text-sm font-semibold disabled:opacity-50">
            {loading ? t('common.loading', 'Loading…') : t('common.refresh', 'Refresh')}
          </button>
        </div>
        <div className="mt-2 text-[11px]" style={{ color: 'var(--text-subtle)' }}>
          {t('panchang.tzNote', 'Times shown in TZ {sign}{tz} (civil offset for {city}).')
            .replace('{sign}', tz >= 0 ? '+' : '')
            .replace('{tz}', String(tz))
            .replace('{city}', city.name)}
        </div>
      </Card>

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {data && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* ─── FIVE LIMBS ─── */}
          <Card title={t('panchang.fiveLimbs', 'Pancha-anga (Five Limbs)')}>
            <dl className="text-sm space-y-2">
              <Row label={t('panchang.varaWeekday', 'Vara (Weekday)')} value={`${al.vara(data.vara.name)} · ${t('panchang.lord', 'Lord')} ${al.planetByName(data.vara.lord)}`} />
              <Row label={t('panchang.tithi', 'Tithi')} value={`${al.paksha(data.tithi.paksha)} ${al.tithi(data.tithi.name)}`} />
              <Row label={`  ${t('panchang.endsAt', 'ends at')}`} value={fmtTime(data.tithi.endsAt, tz)} sub />
              <Row label={`  ${t('panchang.next', 'next')}`} value={al.tithi(data.tithi.nextName)} sub />
              <Row label={t('panchang.nakshatra', 'Nakshatra')} value={`${al.nakshatra(data.nakshatra.num)} · ${t('panchang.padaLabel', 'Pada')} ${data.nakshatra.pada}`} />
              <Row label={`  ${t('panchang.endsAt', 'ends at')}`} value={fmtTime(data.nakshatra.endsAt, tz)} sub />
              <Row label={`  ${t('panchang.next', 'next')}`} value={data.nakshatra.nextName} sub />
              <Row label={t('panchang.yoga', 'Yoga')} value={al.pyoga(data.yoga.name)} />
              <Row label={`  ${t('panchang.endsAt', 'ends at')}`} value={fmtTime(data.yoga.endsAt, tz)} sub />
              <Row label={`  ${t('panchang.next', 'next')}`} value={al.pyoga(data.yoga.nextName)} sub />
              <Row label={t('panchang.karana', 'Karana')} value={al.karana(data.karana.name)} />
              <Row label={`  ${t('panchang.endsAt', 'ends at')}`} value={fmtTime(data.karana.endsAt, tz)} sub />
              <Row label={`  ${t('panchang.next', 'next')}`} value={al.karana(data.karana.nextName)} sub />
            </dl>
          </Card>

          {/* ─── NAKSHATRA ATTRIBUTES ─── */}
          <Card title={t('panchang.nakshatraAttrs', 'Nakshatra attributes')}>
            <dl className="text-sm space-y-2">
              <Row label={t('panchang.lord', 'Lord')} value={al.planetByName(data.nakshatra.lord)} />
              {/* TODO(i18n-server): localize nakshatra deity / gana / yoni / varna / nadi names */}
              <Row label={t('panchang.deity', 'Deity')} value={data.nakshatra.deity} en />
              <Row label={t('panchang.gana', 'Gana')} value={data.nakshatra.gana} en />
              <Row label={t('panchang.yoni', 'Yoni')} value={data.nakshatra.yoni} en />
              <Row label={t('panchang.varna', 'Varna')} value={data.nakshatra.varna} en />
              <Row label={t('panchang.nadi', 'Nadi')} value={data.nakshatra.nadi} en />
            </dl>
          </Card>

          {/* ─── SUN & MOON ─── */}
          <Card title={t('panchang.sunMoon', 'Sun · Moon')}>
            <dl className="text-sm space-y-2">
              <Row label={t('panchang.sunRashi', 'Sun rashi')} value={`${al.rashiByName(data.sun.rashi)} · ${fmtDeg(data.sun.degInRashi)}`} />
              <Row label={t('panchang.sunNakshatra', 'Sun nakshatra')} value={data.sun.nakshatra} en />
              <Row label={t('panchang.moonRashi', 'Moon rashi')} value={`${al.rashiByName(data.moon.rashi)} · ${fmtDeg(data.moon.degInRashi)}`} />
              <Row label={t('panchang.moonNakshatra', 'Moon nakshatra')} value={data.moon.nakshatra} en />
            </dl>
          </Card>

          {/* ─── CALENDAR ─── */}
          <Card title={t('panchang.calendarContext', 'Calendar context')}>
            <dl className="text-sm space-y-2">
              {/* TODO(i18n-server): localize ayana / ritu / masa names */}
              <Row label={t('panchang.ayana', 'Ayana')} value={data.ayana} en />
              <Row label={t('panchang.ritu', 'Ritu (Season)')} value={data.ritu} en />
              <Row label={t('panchang.masaAmanta', 'Masa (Amanta)')} value={data.masa.amanta} en />
              <Row label={t('panchang.masaPurnimanta', 'Masa (Purnimanta)')} value={data.masa.purnimanta} en />
              <Row label={t('panchang.vikramSamvat', 'Vikram Samvat')} value={String(data.samvat.vikram)} />
              <Row label={t('panchang.shakaSamvat', 'Shaka Samvat')} value={String(data.samvat.shaka)} />
              <Row label={t('panchang.kaliSamvat', 'Kali Samvat')} value={String(data.samvat.kali)} />
              <Row label={t('panchang.dishaShool', 'Disha-shool')} value={t('panchang.avoidTravel', 'Avoid travel {direction}').replace('{direction}', data.vara.dishaShool)} />
            </dl>
          </Card>

          {/* ─── SUN / MOON TIMES ─── */}
          <Card title={t('panchang.riseSet', 'Rise & Set')} className="md:col-span-2">
            <div className="grid sm:grid-cols-4 gap-3">
              <Stat label={t('panchang.sunrise', 'Sunrise')}  value={fmtTime(data.sunrise, tz)} tone="gold" />
              <Stat label={t('panchang.sunset', 'Sunset')}   value={fmtTime(data.sunset, tz)} tone="gold" />
              <Stat label={t('panchang.moonrise', 'Moonrise')} value={fmtTime(data.moonrise, tz)} tone="indigo" />
              <Stat label={t('panchang.moonset', 'Moonset')}  value={fmtTime(data.moonset, tz)} tone="indigo" />
            </div>
          </Card>

          {/* ─── AUSPICIOUS ─── */}
          <Card title={t('panchang.auspicious', 'Auspicious periods (Shubha Muhurta)')} className="md:col-span-2">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <MuhurtaBlock title={t('panchang.brahmaMuhurta', 'Brahma Muhurta')}  range={data.brahmaMuhurat}  tone="ok" tz={tz} />
              <MuhurtaBlock title={t('panchang.abhijit', 'Abhijit Muhurta')} range={data.abhijitMuhurat} tone="ok" tz={tz} />
              <MuhurtaBlock title={t('panchang.amritKaal', 'Amrit Kaal')}      range={data.amritKaal}      tone="ok" tz={tz} />
              <MuhurtaBlock title={t('panchang.pratahSandhya', 'Pratah Sandhya')}  range={data.pratahSandhya}  tone="ok" tz={tz} />
              <MuhurtaBlock title={t('panchang.sayamSandhya', 'Sayam Sandhya')}   range={data.sayamSandhya}   tone="ok" tz={tz} />
              <MuhurtaBlock title={t('panchang.godhuli', 'Godhuli')}         range={data.godhuliMuhurat} tone="ok" tz={tz} />
            </div>
          </Card>

          {/* ─── INAUSPICIOUS ─── */}
          <Card title={t('panchang.inauspicious', 'Inauspicious periods (Ashubha Kaal)')} className="md:col-span-2">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <MuhurtaBlock title={t('panchang.rahuKaal', 'Rahu Kaal')}   range={data.rahuKaal}   tone="bad" tz={tz} />
              <MuhurtaBlock title={t('panchang.yamaghanda', 'Yamaghanda')}  range={data.yamaghanda} tone="bad" tz={tz} />
              <MuhurtaBlock title={t('panchang.gulika', 'Gulika Kaal')} range={data.gulika}     tone="bad" tz={tz} />
              <MuhurtaBlock title={t('panchang.varjyam', 'Varjyam')}     range={data.varjyam}    tone="bad" tz={tz} />
              {data.durMuhurtam.map((r, i) => (
                <MuhurtaBlock key={i} title={t('panchang.durMuhurtam', 'Dur Muhurtam {n}').replace('{n}', String(i + 1))} range={r} tone="bad" tz={tz} />
              ))}
            </div>
          </Card>

          {/* ─── BALAS ─── */}
          <Card title={t('panchang.balaToday', 'Bala (strength) for today')} className="md:col-span-2">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  {t('panchang.chandraBala', 'Chandra Bala — favorable Moon-sign natives')}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.chandraBalaRashis.map((r) => (
                    <span key={r} className="text-[11px] px-2 py-1 rounded-full font-semibold"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-strong)', border: '1px solid var(--border-subtle)' }}>
                      {al.rashi(r)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
                  {t('panchang.taraBala', 'Tara Bala — favorable nakshatras (9-fold)')}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {data.taraBalaFavorable.slice(0, 15).map((n) => (
                    <span key={`f-${n}`} className="text-[11px] px-2 py-1 rounded-full"
                      style={{ background: 'rgba(52,211,153,0.15)', color: '#065f46', border: '1px solid rgba(52,211,153,0.35)' }}>
                      {al.nakshatra(n)}
                    </span>
                  ))}
                </div>
                <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: 'var(--text-subtle)' }}>
                  {t('panchang.taraBalaAvoid', 'Avoid (Janma · Vipat · Pratyari · Vadha)')}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {data.taraBalaInauspicious.slice(0, 12).map((n) => (
                    <span key={`b-${n}`} className="text-[11px] px-2 py-1 rounded-full"
                      style={{ background: 'rgba(248,113,113,0.15)', color: '#7f1d1d', border: '1px solid rgba(248,113,113,0.35)' }}>
                      {al.nakshatra(n)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );
}

function Row({ label, value, sub, en }: { label: string; value: string; sub?: boolean; en?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b pb-1"
      style={{ borderColor: 'var(--border-subtle)' }}>
      <dt className={sub ? 'text-[11px]' : 'text-xs'}
        style={{ color: sub ? 'var(--text-subtle)' : 'var(--text-muted)' }}>{label}</dt>
      <dd className={sub ? 'text-[11px] tabular-nums' : 'text-sm font-semibold'}
        style={{ color: sub ? 'var(--text-muted)' : 'var(--text-strong)' }}
        lang={en ? 'en' : undefined}>{value}</dd>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: 'gold' | 'indigo' }) {
  const colorBg = tone === 'gold' ? 'rgba(251,191,36,0.12)' : 'rgba(99,102,241,0.12)';
  const colorBorder = tone === 'gold' ? 'rgba(251,191,36,0.35)' : 'rgba(99,102,241,0.35)';
  return (
    <div className="rounded-lg p-3" style={{ background: colorBg, border: `1px solid ${colorBorder}` }}>
      <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-strong)' }}>{value}</div>
    </div>
  );
}

function MuhurtaBlock({ title, range, tone, tz }: {
  title: string; range: TimeRange | null; tone: 'ok' | 'bad'; tz: number;
}) {
  const bg = tone === 'ok' ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)';
  const border = tone === 'ok' ? 'rgba(16,185,129,0.30)' : 'rgba(239,68,68,0.30)';
  const tx = tone === 'ok' ? '#065f46' : '#7f1d1d';
  return (
    <div className="rounded-lg p-3" style={{ background: bg, border: `1px solid ${border}` }}>
      <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: tx }}>{title}</div>
      <div className="text-sm font-semibold tabular-nums mt-1" style={{ color: 'var(--text-strong)' }}>
        {range ? `${fmtTime(range.start, tz)} → ${fmtTime(range.end, tz)}` : '—'}
      </div>
    </div>
  );
}

void fmtRange;
