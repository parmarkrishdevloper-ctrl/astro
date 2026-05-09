import { useEffect, useState } from 'react';
import { Card, PageShell, ErrorBanner } from '../components/ui/Card';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { Branding } from '../types';

export function AdminBrandingPage() {
  const { t } = useT();
  const [b, setB] = useState<Branding | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    api.getBranding()
      .then((r) => setB(r.branding))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!b) return;
    setSaving(true); setError(null);
    try {
      const r = await api.setBranding(b);
      setB(r.branding);
      setSavedAt(new Date());
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !b) return;
    const reader = new FileReader();
    reader.onload = () => setB({ ...b, logoDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  }

  if (loading) return <PageShell title={t('admin.loadingTitle', 'Branding')}><p>{t('common.loading', 'Loading…')}</p></PageShell>;
  if (error)   return <PageShell title={t('admin.loadingTitle', 'Branding')}><ErrorBanner>{error}</ErrorBanner></PageShell>;
  if (!b)      return null;

  return (
    <PageShell title={t('admin.title', 'Branding & White Label')} subtitle={t('admin.subtitle', 'Configure how your firm appears on PDF reports.')}>
      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <Card title={t('admin.settings', 'Settings')}>
          <div className="space-y-4">
            <Field label={t('admin.companyName', 'Company Name')}>
              <input value={b.companyName} onChange={(e) => setB({ ...b, companyName: e.target.value })} className="input" />
            </Field>
            <Field label={t('admin.tagline', 'Tagline')}>
              <input value={b.tagline ?? ''} onChange={(e) => setB({ ...b, tagline: e.target.value })} className="input" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t('admin.primary', 'Primary Color')}>
                <div className="flex gap-2 items-center">
                  <input type="color" value={b.primaryColor} onChange={(e) => setB({ ...b, primaryColor: e.target.value })} className="h-10 w-14 rounded border border-vedicGold/40" />
                  <input value={b.primaryColor} onChange={(e) => setB({ ...b, primaryColor: e.target.value })} className="input flex-1" />
                </div>
              </Field>
              <Field label={t('admin.accent', 'Accent Color')}>
                <div className="flex gap-2 items-center">
                  <input type="color" value={b.accentColor} onChange={(e) => setB({ ...b, accentColor: e.target.value })} className="h-10 w-14 rounded border border-vedicGold/40" />
                  <input value={b.accentColor} onChange={(e) => setB({ ...b, accentColor: e.target.value })} className="input flex-1" />
                </div>
              </Field>
            </div>

            <Field label={t('admin.logo', 'Logo (PNG/JPG/SVG — embedded as data URL)')}>
              <input type="file" accept="image/*" onChange={handleLogo}
                className="block text-xs text-vedicMaroon" />
            </Field>

            <fieldset className="border border-vedicGold/30 rounded-lg p-3">
              <legend className="text-xs font-bold text-vedicMaroon px-1">{t('admin.contactLegend', 'Contact')}</legend>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <Field label={t('admin.phone', 'Phone')}>
                  <input value={b.contact?.phone ?? ''} onChange={(e) => setB({ ...b, contact: { ...b.contact, phone: e.target.value } })} className="input" />
                </Field>
                <Field label={t('admin.email', 'Email')}>
                  <input value={b.contact?.email ?? ''} onChange={(e) => setB({ ...b, contact: { ...b.contact, email: e.target.value } })} className="input" />
                </Field>
                <Field label={t('admin.website', 'Website')}>
                  <input value={b.contact?.website ?? ''} onChange={(e) => setB({ ...b, contact: { ...b.contact, website: e.target.value } })} className="input" />
                </Field>
                <Field label={t('admin.address', 'Address')}>
                  <input value={b.contact?.address ?? ''} onChange={(e) => setB({ ...b, contact: { ...b.contact, address: e.target.value } })} className="input" />
                </Field>
              </div>
            </fieldset>

            <Field label={t('admin.footerText', 'Footer Text')}>
              <textarea value={b.footerText ?? ''} onChange={(e) => setB({ ...b, footerText: e.target.value })}
                className="input h-20" />
            </Field>

            <div className="flex items-center gap-3">
              <button onClick={save} disabled={saving}
                className="rounded-lg bg-saffron hover:bg-deepSaffron text-white px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
                {saving ? t('admin.saving', 'Saving…') : t('admin.saveBtn', 'Save Branding')}
              </button>
              {savedAt && <span className="text-xs text-emerald-700">{t('admin.savedAt', 'Saved at')} {savedAt.toLocaleTimeString()}</span>}
            </div>
          </div>
        </Card>

        <Card title={t('admin.preview', 'Live Preview')}>
          <div className="border-2" style={{ borderColor: b.primaryColor, borderStyle: 'double' }}>
            <div className="p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${b.accentColor}` }}>
              {b.logoDataUrl && <img src={b.logoDataUrl} alt={t('admin.logoAlt', 'logo')} className="h-12 max-w-[80px] object-contain" />}
              <div>
                {/* user-supplied branding text — locale-agnostic */}
                <div className="text-base font-bold" style={{ color: b.primaryColor, fontFamily: 'Georgia, serif' }}>
                  {b.companyName}
                </div>
                <div className="text-[10px] italic text-slate-500">{b.tagline}</div>
              </div>
            </div>
            <div className="p-4 text-xs space-y-1">
              <div style={{ color: b.primaryColor, fontWeight: 700 }}>{t('admin.sampleHeading', 'Sample Heading')}</div>
              <p className="text-slate-700">{t('admin.bodyText', 'Body text in the report style.')}</p>
            </div>
            {/* user-supplied branding footer — locale-agnostic */}
            <div className="p-2 text-[9px] text-center text-slate-500" style={{ borderTop: `1px solid ${b.accentColor}` }}>
              {b.footerText}
            </div>
          </div>
        </Card>
      </div>

      <style>{`.input { width: 100%; border-radius: 0.5rem; border: 1px solid rgba(212,175,55,0.4); padding: 0.5rem 0.75rem; font-size: 0.875rem; background: white; }`}</style>
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
