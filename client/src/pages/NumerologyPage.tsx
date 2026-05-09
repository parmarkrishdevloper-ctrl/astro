import { useState } from 'react';
import { Card, PageShell, ErrorBanner, EmptyState } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { NumerologyResult, NumerologyProfile } from '../types';

export function NumerologyPage() {
  const { t } = useT();
  const [dob, setDob] = useState('1990-08-15');
  const [name, setName] = useState('Arjun Sharma');
  const [data, setData] = useState<NumerologyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function compute() {
    setLoading(true); setError(null); setData(null);
    try {
      const r = await api.numerology(dob, name);
      setData(r.numerology);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <PageShell title={t('numerology.title', 'Vedic Numerology')} subtitle={t('numerology.subtitle', 'Moolank, Bhagyank, and Chaldean name number with planetary rulership.')}>
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <label className="block">
            <div className="text-[11px] uppercase tracking-wider text-vedicMaroon/70 mb-1">{t('numerology.dob', 'Date of Birth')}</div>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
              className="rounded-lg border border-vedicGold/40 px-3 py-2 text-sm" />
          </label>
          <label className="block flex-1 min-w-[200px]">
            <div className="text-[11px] uppercase tracking-wider text-vedicMaroon/70 mb-1">{t('numerology.name', 'Name (optional)')}</div>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-vedicGold/40 px-3 py-2 text-sm" />
          </label>
          <button onClick={compute} disabled={loading}
            className="rounded-lg bg-saffron hover:bg-deepSaffron text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-50">
            {loading ? t('numerology.computing', 'Computing…') : t('common.calculate', 'Calculate')}
          </button>
        </div>
      </Card>

      {error && <ErrorBanner>{error}</ErrorBanner>}
      {!data && !loading && !error && <EmptyState>{t('numerology.empty', 'Enter your birth date to compute your Moolank and Bhagyank.')}</EmptyState>}

      {data && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProfileCard title={t('numerology.moolank', 'Moolank (Root)')} subtitle={t('numerology.moolankSub', 'From birth day digit sum')} profile={data.moolank} />
          <ProfileCard title={t('numerology.bhagyank', 'Bhagyank (Destiny)')} subtitle={t('numerology.bhagyankSub', 'From full DOB digit sum')} profile={data.bhagyank} />
          {data.nameNumber && (
            <ProfileCard
              title={t('numerology.nameNo', 'Name Number')}
              subtitle={`${t('numerology.chaldeanSum', 'Chaldean sum')}: ${data.nameNumber.rawSum}`}
              profile={data.nameNumber}
            />
          )}
        </div>
      )}
    </PageShell>
  );
}

function ProfileCard({ title, subtitle, profile }: { title: string; subtitle: string; profile: NumerologyProfile }) {
  const { t } = useT();
  return (
    <Card title={title}>
      <p className="text-[11px] text-vedicMaroon/50 -mt-2 mb-3">{subtitle}</p>
      <div className="flex items-center gap-4 mb-4">
        <div className="text-5xl font-bold text-saffron tabular-nums">{profile.number}</div>
        <div>
          <div className="text-xs text-vedicMaroon/60">{t('numerology.planet', 'Ruling Planet')}</div>
          {/* TODO(i18n-server): localize NumerologyProfile.rulingPlanet */}
          <div className="text-base font-semibold text-vedicMaroon" lang="en">{profile.rulingPlanet}</div>
        </div>
      </div>
      {/* TODO(i18n-server): localize NumerologyProfile.personality */}
      <p className="text-xs text-vedicMaroon/80 mb-4 italic" lang="en">{profile.personality}</p>
      <dl className="text-xs space-y-1.5">
        <KV label={t('numerology.colors', 'Lucky Colors')} value={profile.luckyColors.join(', ')} />
        <KV label={t('numerology.days', 'Lucky Days')}   value={profile.luckyDays.join(', ')} />
        <KV label={t('numerology.numbers', 'Lucky Numbers')} value={profile.luckyNumbers.join(', ')} />
        <KV label={t('numerology.gem', 'Lucky Gem')}    value={profile.luckyGem} />
      </dl>
    </Card>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 border-b border-vedicGold/15 pb-1">
      <dt className="text-vedicMaroon/60">{label}</dt>
      <dd className="text-vedicMaroon font-medium text-right">{value}</dd>
    </div>
  );
}
