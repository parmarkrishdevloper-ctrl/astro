// Small atom components for Phase 20 workflow features.
// Used across Kundali / Prashna / Tarot / Biometric / Dashboard.
//
//   <VoiceInputButton onTranscript={(t) => setField(t)} />
//   <ClipboardPasteButton onPaste={(parsed) => hydrateForm(parsed)} />
//   <SaveViewButton route="/kundali" snapshot={{ birth, ... }} />

import { useState } from 'react';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useClipboardPaste, ParsedClipboard } from '../../hooks/useClipboardPaste';
import { api } from '../../api/jyotish';
import { useT } from '../../i18n';

// ─── VoiceInputButton ───────────────────────────────────────────────────────

export function VoiceInputButton({
  onTranscript,
  lang = 'en-IN',
  title,
}: {
  onTranscript: (text: string) => void;
  lang?: string;
  title?: string;
}) {
  const { t } = useT();
  const v = useVoiceInput(lang);

  if (!v.supported) return null;

  const handleClick = () => {
    if (v.listening) {
      v.stop();
      if (v.transcript) onTranscript(v.transcript);
    } else {
      v.start();
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title ?? t('workflow.voiceTitle', 'Speak to fill')}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors ${
        v.listening
          ? 'bg-vedicMaroon text-white border-vedicMaroon animate-pulse'
          : 'bg-white border-vedicGold/40 text-vedicMaroon hover:bg-parchment'
      }`}
    >
      <span aria-hidden>🎙</span>
      <span>{v.listening ? t('workflow.listening', 'Listening…') : t('workflow.voice', 'Voice')}</span>
      {v.transcript && !v.listening && (
        <span className="text-[10px] opacity-70 max-w-[120px] truncate">"{v.transcript}"</span>
      )}
    </button>
  );
}

// ─── ClipboardPasteButton ───────────────────────────────────────────────────

export function ClipboardPasteButton({
  onPaste,
  title,
  label,
}: {
  onPaste: (parsed: ParsedClipboard) => void;
  title?: string;
  label?: string;
}) {
  const { t } = useT();
  const cp = useClipboardPaste();
  const [err, setErr] = useState<string | null>(null);

  if (!cp.supported) return null;

  const handleClick = async () => {
    setErr(null);
    const parsed = await cp.pasteAndParse();
    if (!parsed) {
      setErr(cp.error || t('common.clipboardEmpty', 'Clipboard empty'));
      return;
    }
    onPaste(parsed);
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={cp.busy}
        title={title ?? t('workflow.pasteTitle', 'Paste from clipboard')}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-vedicGold/40 bg-white text-vedicMaroon text-xs font-medium hover:bg-parchment disabled:opacity-50"
      >
        <span aria-hidden>📋</span>
        <span>{cp.busy ? t('common.reading', 'Reading…') : (label ?? t('workflow.paste', 'Paste'))}</span>
      </button>
      {err && <span className="text-[10px] text-red-600">{err}</span>}
    </div>
  );
}

// ─── SaveViewButton ─────────────────────────────────────────────────────────

export function SaveViewButton({
  route,
  kind = 'generic',
  snapshot,
  chartId,
  defaultName = '',
  onSaved,
}: {
  route: string;
  kind?: string;
  snapshot: any;
  chartId?: string;
  defaultName?: string;
  onSaved?: () => void;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [tags, setTags] = useState('');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState<string | null>(null);
  const [ok,   setOk]   = useState(false);

  const save = async () => {
    if (!name.trim()) { setErr(t('common.nameRequired', 'Name required')); return; }
    setBusy(true); setErr(null);
    try {
      await api.views.create({
        name: name.trim(),
        route,
        kind,
        snapshot,
        tags: tags.split(',').map((tg) => tg.trim()).filter(Boolean),
        chartId,
      });
      setOk(true);
      onSaved?.();
      setTimeout(() => { setOpen(false); setOk(false); setName(''); setTags(''); }, 700);
    } catch (e: any) {
      setErr(e?.message ?? t('common.saveFailed', 'Save failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-vedicGold/40 bg-white text-vedicMaroon text-xs font-medium hover:bg-parchment"
      >
        <span aria-hidden>⭐</span>
        <span>{t('workflow.saveView', 'Save view')}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 z-20 w-[280px] rounded-lg border border-vedicGold/40 bg-white shadow-xl p-3 space-y-2">
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-vedicMaroon/60">
            {t('workflow.name', 'Name')}
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('workflow.savePlaceholder', "e.g. Ayan's Jupiter transit 2026")}
            className="w-full px-2 py-1 border border-vedicGold/30 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-vedicMaroon"
          />
          <label className="block text-[10px] uppercase tracking-wider font-semibold text-vedicMaroon/60">
            {t('workflow.tags', 'Tags (comma-separated)')}
          </label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t('workflow.tagsPlaceholder', 'career, transit')}
            className="w-full px-2 py-1 border border-vedicGold/30 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-vedicMaroon"
          />
          {err && <div className="text-[11px] text-red-600">{err}</div>}
          {ok  && <div className="text-[11px] text-green-700">{t('common.savedOk', 'Saved ✓')}</div>}
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-2 py-1 text-xs text-vedicMaroon/70 hover:text-vedicMaroon"
              disabled={busy}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={busy}
              className="px-3 py-1 bg-vedicMaroon text-white text-xs rounded-md font-medium hover:bg-vedicMaroon/90 disabled:opacity-50"
            >
              {busy ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
