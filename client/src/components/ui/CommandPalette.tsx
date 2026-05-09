// Cmd+K command palette.
//
// Opens on Cmd/Ctrl+K anywhere in the app. Two sections:
//   1. Quick nav commands — jump to any page
//   2. Live global search — charts, events, notes, encyclopedia, slokas, yogas
//
// Keyboard: arrows to move, Enter to activate, Esc to dismiss.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/jyotish';
import { useT } from '../../i18n';

type NavCommand = { id: string; label: string; url: string; hint?: string };

function buildNavCommands(t: (k: string, fb?: string) => string): NavCommand[] {
  const open = t('palette.openPrefix', 'Open');
  const withDesc = (label: string, descKey: string, descFallback: string) =>
    `${label} (${t(descKey, descFallback)})`;
  return [
    { id: 'nav:kundali',     label: `${open} ${t('nav.kundali','Kundali')}`,        url: '/',           hint: 'Alt+K' },
    { id: 'nav:dashboard',   label: `${open} ${t('nav.dashboard','Dashboard')}`,    url: '/dashboard',  hint: 'Alt+D' },
    { id: 'nav:timing',      label: `${open} ${t('nav.timing','Timing')}`,          url: '/timing',     hint: 'Alt+I' },
    { id: 'nav:library',     label: `${open} ${t('nav.library','Library')}`,        url: '/library',    hint: 'Alt+L' },
    { id: 'nav:learn',       label: `${open} ${t('nav.learn','Learn')}`,            url: '/learn' },
    { id: 'nav:interactive', label: `${open} ${t('nav.interactive','Interactive')}`,url: '/interactive' },
    { id: 'nav:offline',     label: `${open} ${t('nav.offline','Offline')}`,        url: '/offline' },
    { id: 'nav:matching',    label: `${open} ${t('nav.matching','Matching')}`,      url: '/matching',   hint: 'Alt+M' },
    { id: 'nav:panchang',    label: `${open} ${t('nav.panchang','Panchang')}`,      url: '/panchang',   hint: 'Alt+P' },
    { id: 'nav:muhurat',     label: `${open} ${t('nav.muhurat','Muhurat')}`,        url: '/muhurat' },
    { id: 'nav:numerology',  label: `${open} ${t('nav.numerology','Numerology')}`,  url: '/numerology' },
    { id: 'nav:biometric',   label: withDesc(`${open} ${t('nav.biometric','Biometric')}`, 'palette.desc.biometric', 'Palmistry · Samudrika · Graphology · Deep Numerology · Tarot'), url: '/biometric' },
    { id: 'nav:views',       label: withDesc(`${open} ${t('nav.views','Saved Views')}`,    'palette.desc.views',     'bookmarked UI snapshots'), url: '/views', hint: 'Alt+V' },
    { id: 'nav:classical',   label: withDesc(`${open} ${t('nav.classical','Classical')}`,  'palette.desc.classical', 'Lal Kitab · Nadi · Sphuta'), url: '/classical', hint: 'Alt+C' },
    { id: 'nav:kp-deep',     label: withDesc(`${open} ${t('nav.kpDeep','KP Deep')}`,       'palette.desc.kpDeep',    '4-level + interlinks'),      url: '/kp-deep',   hint: 'Alt+F' },
    { id: 'nav:predictive',  label: withDesc(`${open} ${t('nav.predictive','Predictive')}`,'palette.desc.predictive','Sade Sati · Returns · Progressions · War · Combust · Retro · Kaksha'), url: '/predictive', hint: 'Alt+Z' },
    { id: 'nav:prashna-pro', label: withDesc(`${open} ${t('nav.prashnaPro','Prashna Pro')}`,'palette.desc.prashnaPro','Tajika · Narchintamani · Shatpanchasika · Swara · Arudha'), url: '/prashna-pro' },
    { id: 'nav:chakras',     label: withDesc(`${open} ${t('nav.chakras','Chakras')}`,      'palette.desc.chakras',   'Sarvatobhadra · Kalanala · Shoola · Kota · Chatushpata'), url: '/chakras' },
    { id: 'nav:muhurta-pro', label: withDesc(`${open} ${t('nav.muhurtaPro','Muhurta Pro')}`,'palette.desc.muhurtaPro','35+ presets · Chaughadia+Hora calendar · Varjyam · Yoga detector'), url: '/muhurta-pro' },
    { id: 'nav:remedies',    label: withDesc(`${open} ${t('nav.remedies','Remedies')}`,    'palette.desc.remedies',  '9 Yantras · Gemstones · Remedy log'), url: '/remedies' },
    { id: 'nav:specialty',   label: withDesc(`${open} ${t('nav.specialty','Specialty')}`,  'palette.desc.specialty', 'Vastu · Medical · Marital · Career · Financial'), url: '/specialty' },
    { id: 'nav:research',    label: withDesc(`${open} ${t('nav.research','Research')}`,    'palette.desc.research',  'Pattern · Timeline · Stats · Famous · Rectify+ · Notebook'), url: '/research' },
    { id: 'nav:classical-texts', label: withDesc(`${open} ${t('nav.classicalTexts','Classical Texts')}`, 'palette.desc.classicalTexts', 'Saravali · Parijata · Phaladeepika · Uttara Kalamrita · Bharanam · 12 Avasthas'), url: '/classical-texts' },
    { id: 'nav:calendar',    label: withDesc(`${open} ${t('nav.calendar','Calendar')}`,    'palette.desc.calendar',  'Live panchang · Festivals · Year view · Ayana/Ritu/Masa viz'), url: '/calendar' },
    { id: 'nav:ai',          label: withDesc(`${open} ${t('nav.ai','AI · Narrative')}`,    'palette.desc.ai',        'Multilingual chart reading · Auto-journal · Chart-to-chart compare'), url: '/ai' },
    { id: 'nav:export',      label: withDesc(`${open} ${t('nav.export','Print & Export')}`,'palette.desc.export',    'Varshphal · Muhurta books · Drag-drop builder · CSV/XLSX/SVG/PNG'), url: '/export' },
  ];
}

type Hit = Awaited<ReturnType<typeof api.globalSearch>>['hits'][number];
type Item = { id: string; label: string; url: string; kind: string; snippet?: string; hint?: string };

export function CommandPalette() {
  const { t, locale } = useT();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const NAV_COMMANDS = useMemo(() => buildNavCommands(t), [t, locale]);

  // Global shortcut: Cmd/Ctrl+K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
    else { setQ(''); setHits([]); setActive(0); }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) { setHits([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.globalSearch(q, 30);
        setHits(r.hits);
        setActive(0);
      } catch { /* ignore */ }
    }, 180);
    return () => clearTimeout(t);
  }, [q, open]);

  // Build unified item list (nav + hits)
  const ql = q.trim().toLowerCase();
  const filteredNav = NAV_COMMANDS.filter((c) =>
    !ql || c.label.toLowerCase().includes(ql) || c.url.includes(ql));
  const items: Item[] = [
    ...filteredNav.map((n) => ({ id: n.id, label: n.label, url: n.url, kind: 'nav', hint: n.hint })),
    ...hits.map((h) => ({
      id: `${h.kind}:${h.id}`, label: h.title, url: h.url, kind: h.kind, snippet: h.snippet,
    })),
  ];

  // Keyboard navigation
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); return; }
    if (e.key === 'Enter' && items[active]) {
      e.preventDefault();
      navigate(items[active].url);
      setOpen(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[8vh] bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()}
        className="w-[92vw] max-w-[640px] rounded-xl border border-vedicGold/40 bg-white shadow-2xl overflow-hidden">
        <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKeyDown}
          placeholder={t('palette.placeholder', 'Jump to page, search any chart, note, sloka, yoga…')}
          className="w-full px-4 py-3 text-sm border-b border-vedicGold/30 bg-parchment/40 focus:outline-none" />
        <div className="max-h-[60vh] overflow-y-auto">
          {items.length === 0 && (
            <div className="px-4 py-8 text-center text-vedicMaroon/60 text-sm italic">
              {q.length < 2 ? t('common.searchPrompt', 'Type 2+ characters to search your entire knowledge base.') : t('common.noMatches', 'No matches.')}
            </div>
          )}
          {items.map((it, i) => (
            <button key={it.id} onClick={() => { navigate(it.url); setOpen(false); }}
              onMouseEnter={() => setActive(i)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 border-b border-vedicGold/10 ${
                active === i ? 'bg-vedicMaroon/10' : 'hover:bg-parchment'
              }`}>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-vedicMaroon/50 w-20 shrink-0">{it.kind}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-vedicMaroon truncate">{it.label}</div>
                {it.snippet && <div className="text-[11px] text-vedicMaroon/60 truncate">{it.snippet}</div>}
              </div>
              {it.hint && <span className="text-[10px] text-vedicMaroon/50 font-mono">{it.hint}</span>}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 bg-parchment/60 border-t border-vedicGold/30 text-[10px] text-vedicMaroon/60 flex justify-between">
          <span>{t('common.paletteHints', '↑↓ navigate · ↵ open · esc close')}</span>
          <span>{items.length} {items.length === 1 ? t('common.result', 'result') : t('common.results', 'results')}</span>
        </div>
      </div>
    </div>
  );
}
