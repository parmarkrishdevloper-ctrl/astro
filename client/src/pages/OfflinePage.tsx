// Offline / privacy page.
//
// Four sections:
//   1. Offline status — Mongo / Ollama / ephemeris readiness
//   2. Backup — download JSON envelope (optional passphrase-encrypted)
//   3. Restore — upload envelope and merge or replace
//   4. Local narrative — generate interpretation via Ollama or fallback

import { useEffect, useState } from 'react';
import { Card, PageShell, Pill, ErrorBanner } from '../components/ui/Card';
import { BirthDetailsForm } from '../components/forms/BirthDetailsForm';
import { api } from '../api/jyotish';
import { useT } from '../i18n';
import type { BirthInput } from '../types';

type T = (key: string, fallback?: string) => string;

export function OfflinePage() {
  const { t } = useT();
  const [status, setStatus] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refreshStatus() {
    try {
      const r = await api.offlineStatus();
      setStatus(r.status);
    } catch (e) { setError((e as Error).message); }
  }
  useEffect(() => { refreshStatus(); }, []);

  return (
    <PageShell title={t('offline.title', 'Offline & Privacy')} subtitle={t('offline.subtitle', 'Your personal astrology vault — works without internet, never leaks data.')}>
      {error && <ErrorBanner>{error}</ErrorBanner>}
      <div className="space-y-4">
        <StatusPanel status={status} onRefresh={refreshStatus} t={t} />
        <BackupPanel t={t} />
        <RestorePanel onRestored={refreshStatus} t={t} />
        <NarrativePanel t={t} />
      </div>
    </PageShell>
  );
}

function StatusPanel({ status, onRefresh, t }: { status: any; onRefresh: () => void; t: T }) {
  if (!status) return <Card title={t('offline.statusTitle', 'Status')}><p className="text-sm text-vedicMaroon/60 italic">{t('common.loading', 'Loading…')}</p></Card>;
  return (
    <Card title={t('offline.status', 'Offline readiness')}
      action={<button onClick={onRefresh} className="text-[11px] px-2 py-1 rounded border border-vedicGold/40 bg-white text-vedicMaroon hover:bg-parchment">{t('offline.refreshBtn', 'refresh')}</button>}>
      <div className="grid md:grid-cols-2 gap-3 text-xs">
        <StatusRow
          t={t}
          label={t('offline.row.mongo', 'MongoDB (local)')}
          ok={status.mongo}
          ok_text={t('offline.row.mongoOk', 'Connected — your chart library persists')}
          bad_text={t('offline.row.mongoBad', 'Not connected — Library features disabled')}
        />
        <StatusRow
          t={t}
          label={t('offline.row.ollama', 'Ollama (local LLM)')}
          ok={status.ollama}
          ok_text={t('offline.row.ollamaOk', 'Available — narratives will use your local model')}
          bad_text={t('offline.row.ollamaBad', 'Not running — narratives fall back to deterministic rule-based text')}
        />
        <StatusRow
          t={t}
          label={t('offline.row.ephemeris', 'Swiss Ephemeris data')}
          ok={status.ephemeris.available}
          ok_text={t('offline.row.ephemerisOk', 'Full precision ({path})').replace('{path}', String(status.ephemeris.path))}
          bad_text={status.ephemeris.note}
        />
        <StatusRow
          t={t}
          label={t('offline.row.fullyOffline', 'Fully offline?')}
          ok={status.isFullyOffline}
          ok_text={t('offline.row.fullyOfflineOk', 'Yes — this machine can compute and store everything locally')}
          bad_text={t('offline.row.fullyOfflineBad', 'Partially — Moshier fallback is active or Mongo is down')}
        />
      </div>
    </Card>
  );
}

function StatusRow({ label, ok, ok_text, bad_text, t }: { label: string; ok: boolean; ok_text: string; bad_text: string; t: T }) {
  return (
    <div className={`rounded border p-3 ${ok ? 'border-emerald-300 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] uppercase tracking-wider text-vedicMaroon/60">{label}</span>
        <Pill tone={ok ? 'good' : 'warn'}>{ok ? t('offline.statusReady', 'ready') : t('offline.statusUnavailable', 'unavailable')}</Pill>
      </div>
      <div className={`text-xs ${ok ? 'text-emerald-900' : 'text-amber-900'}`}>
        {ok ? ok_text : bad_text}
      </div>
    </div>
  );
}

function BackupPanel({ t }: { t: T }) {
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function doBackup() {
    setLoading(true); setResult(null);
    try {
      const r = await api.backupExport(passphrase || undefined);
      const blob = new Blob([JSON.stringify(r.backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `jyotishpro-backup-${new Date().toISOString().slice(0, 10)}${passphrase ? '-encrypted' : ''}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setResult(passphrase ? t('offline.encryptedDone', 'Encrypted backup downloaded.') : t('offline.plainDone', 'Plain backup downloaded.'));
    } catch (e) { setResult((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <Card title={t('offline.export', 'Export backup')}>
      <div className="text-xs text-vedicMaroon/70 mb-3">
        {t('offline.exportDesc', 'Downloads your entire chart library — all people, events, predictions, notes, voice memos — as a single JSON file. Adding a passphrase encrypts the payload with AES-256-GCM (PBKDF2-SHA256, 210,000 iterations). Safe to keep in cloud storage.')}
      </div>
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-[11px] uppercase tracking-wider text-vedicMaroon/60 mb-1">{t('offline.passphraseLabel', 'Passphrase (optional)')}</label>
          <input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)}
            placeholder={t('offline.passphrasePlaceholder', 'leave empty to export unencrypted')}
            className="w-full rounded border border-vedicGold/40 px-3 py-2 text-sm" />
        </div>
        <button onClick={doBackup} disabled={loading}
          className="rounded bg-saffron hover:bg-deepSaffron text-white py-2 px-4 text-sm font-semibold disabled:opacity-50">
          {loading ? t('offline.exporting', 'Exporting…') : t('offline.downloadBtn', '⬇ Download')}
        </button>
      </div>
      {result && <p className="mt-3 text-xs text-vedicMaroon/80">{result}</p>}
    </Card>
  );
}

function RestorePanel({ onRestored, t }: { onRestored: () => void; t: T }) {
  const [envelope, setEnvelope] = useState<any | null>(null);
  const [fileName, setFileName] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [replace, setReplace] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try { setEnvelope(JSON.parse(reader.result as string)); setResult(null); }
      catch (e) { setResult((e as Error).message); }
    };
    reader.readAsText(file);
  }

  async function doRestore() {
    if (!envelope) return;
    setLoading(true); setResult(null);
    try {
      const r = await api.backupRestore(envelope, passphrase || undefined, replace);
      setResult(
        t('offline.importedReport', 'Imported {imported} chart(s), skipped {skipped}.{replaced}')
          .replace('{imported}', String(r.result.imported))
          .replace('{skipped}', String(r.result.skipped))
          .replace('{replaced}', r.result.replaced ? t('offline.replacedNote', ' (existing data replaced)') : ''),
      );
      onRestored();
    } catch (e) { setResult((e as Error).message); }
    finally { setLoading(false); }
  }

  return (
    <Card title={t('offline.restore', 'Restore backup')}>
      <div className="text-xs text-vedicMaroon/70 mb-3">
        {t('offline.restoreDesc', 'Upload a backup JSON file. Charts are merged into your library by default; tick "replace" to wipe existing data first. Encrypted backups require the original passphrase.')}
      </div>
      <div className="grid md:grid-cols-2 gap-2 items-end">
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-vedicMaroon/60 mb-1">{t('offline.backupFile', 'Backup file')}</label>
          <input type="file" accept=".json,application/json" onChange={onFile}
            className="w-full text-xs file:mr-3 file:px-2 file:py-1 file:rounded file:border-0 file:bg-parchment file:text-vedicMaroon" />
          {fileName && <p className="text-[11px] text-vedicMaroon/60 mt-1">{t('offline.loaded', 'Loaded:')} <strong>{fileName}</strong>{envelope?.encrypted ? ' ' + t('offline.encryptedSuffix', '(encrypted)') : ' ' + t('offline.plainSuffix', '(plain)')}</p>}
        </div>
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-vedicMaroon/60 mb-1">{t('offline.passphraseEnc', 'Passphrase (if encrypted)')}</label>
          <input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)}
            className="w-full rounded border border-vedicGold/40 px-3 py-2 text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <label className="inline-flex items-center gap-2 text-xs text-vedicMaroon">
          <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
          <span>{t('offline.replaceData', 'Replace existing data (destructive)')}</span>
        </label>
        <button onClick={doRestore} disabled={!envelope || loading}
          className="ml-auto rounded bg-vedicMaroon hover:bg-vedicMaroon/90 text-white py-2 px-4 text-sm font-semibold disabled:opacity-50">
          {loading ? t('offline.restoring', 'Restoring…') : t('offline.restoreBtn', '⬆ Restore')}
        </button>
      </div>
      {result && <p className="mt-3 text-xs text-vedicMaroon/80">{result}</p>}
    </Card>
  );
}

function NarrativePanel({ t }: { t: T }) {
  const [result, setResult] = useState<{ source: string; model?: string; narrative: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(input: BirthInput) {
    setLoading(true); setResult(null);
    try {
      const r = await api.localNarrative(input);
      setResult({ source: r.source, model: r.model, narrative: r.narrative });
    } catch (e) {
      setResult({ source: 'error', narrative: (e as Error).message });
    } finally { setLoading(false); }
  }

  return (
    <Card title={t('offline.narrativeTitle', 'Local-LLM interpretation (Ollama or rule-based fallback)')}>
      <div className="text-xs text-vedicMaroon/70 mb-3">
        {t('offline.narrativeDescBefore', 'Generates a 3-4 paragraph interpretation of any chart. If Ollama is running on this machine (')}
        <code className="font-mono bg-parchment px-1 rounded">localhost:11434</code>
        {t('offline.narrativeDescAfter', ") the prompt goes there; otherwise the app assembles a deterministic rule-based narrative from the engine's own output. Either way,")}
        <strong>{t('offline.narrativeDescBold', ' no chart data ever leaves your machine')}</strong>.
      </div>
      <div className="grid md:grid-cols-[340px_1fr] gap-4">
        <BirthDetailsForm onSubmit={run} loading={loading} />
        <div className="rounded border border-vedicGold/30 p-4 bg-parchment/40 min-h-[200px]">
          {!result && !loading && <p className="text-xs text-vedicMaroon/60 italic">{t('offline.narrativeEmpty', 'Enter birth details to get a narrative.')}</p>}
          {loading && <p className="text-xs text-vedicMaroon/60 italic">{t('offline.generating', 'Generating…')}</p>}
          {result && (
            <div>
              <div className="mb-3 flex items-center gap-2 text-[11px]">
                <Pill tone={result.source === 'ollama' ? 'good' : 'neutral'}>
                  {t('offline.sourceLabel', 'source: {source}').replace('{source}', result.source)}{result.model ? ` (${result.model})` : ''}
                </Pill>
              </div>
              {/* TODO(i18n-server): localize narrative output (LLM/rule-based, server-rendered) */}
              <div className="text-sm text-vedicMaroon/90 whitespace-pre-wrap leading-relaxed" lang="en">{result.narrative}</div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
