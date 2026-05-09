import { useEffect, useState, ReactNode } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { KundaliPage } from './pages/KundaliPage';
import { VarshaphalaPage } from './pages/VarshaphalaPage';
import { PrashnaPage } from './pages/PrashnaPage';
import { RectificationPage } from './pages/RectificationPage';
import { EventPredictionPage } from './pages/EventPredictionPage';
import { SudarshanaPage } from './pages/SudarshanaPage';
import { EphemerisPage } from './pages/EphemerisPage';
import { WorksheetsPage } from './pages/WorksheetsPage';
import { InterpretationPage } from './pages/InterpretationPage';
import { AshtakavargaPage } from './pages/AshtakavargaPage';
import { JaiminiDashasPage } from './pages/JaiminiDashasPage';
import { ClassicalPage } from './pages/ClassicalPage';
import { KPDeepPage } from './pages/KPDeepPage';
import { PredictivePage } from './pages/PredictivePage';
import { PrashnaProPage } from './pages/PrashnaProPage';
import { ChakrasPage } from './pages/ChakrasPage';
import { MuhurtaProPage } from './pages/MuhurtaProPage';
import { RemediesPage } from './pages/RemediesPage';
import { SpecialtyPage } from './pages/SpecialtyPage';
import { ResearchPage } from './pages/ResearchPage';
import { ClassicalTextsPage } from './pages/ClassicalTextsPage';
import { CalendarPage } from './pages/CalendarPage';
import { ExportPage } from './pages/ExportPage';
import { DivisionalsPage } from './pages/DivisionalsPage';
import { DeepDashaPage } from './pages/DeepDashaPage';
import { MatchingPage } from './pages/MatchingPage';
import { PanchangPage } from './pages/PanchangPage';
import { MuhuratPage } from './pages/MuhuratPage';
import { NumerologyPage } from './pages/NumerologyPage';
import { AdminBrandingPage } from './pages/AdminBrandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClassicViewPage } from './pages/ClassicViewPage';
import { TimingPage } from './pages/TimingPage';
import { LibraryPage } from './pages/LibraryPage';
import { LearnPage } from './pages/LearnPage';
import { InteractivePage } from './pages/InteractivePage';
import { OfflinePage } from './pages/OfflinePage';
import { QualityPage } from './pages/QualityPage';
import { AIPage } from './pages/AIPage';
import { BiometricPage } from './pages/BiometricPage';
import { SavedViewsPage } from './pages/SavedViewsPage';
import { CommandPalette } from './components/ui/CommandPalette';
import { useT, LOCALES } from './i18n';
import { useTheme, THEMES } from './theme/ThemeProvider';
import { useActiveChart } from './store/active-chart.store';
import { useFontScale, FONT_SCALES } from './store/font-scale.store';
import {
  IconHome, IconGrid, IconClock, IconBook, IconGrad, IconCompass,
  IconCloud, IconShield, IconUsers, IconCalendar, IconStar, IconHash,
  IconSettings, IconSearch, IconMenu, IconSun, IconMoon, IconGlobe,
  IconPalette, IconChart, IconSparkle,
} from './components/ui/Icons';

// ─── Global keyboard shortcuts ──────────────────────────────────────────
function GlobalShortcuts() {
  const { cycle, setTheme } = useTheme();
  const navigate = useNavigate();
  useEffect(() => {
    function onThemeEvent(e: Event) {
      const id = (e as CustomEvent).detail;
      if (id) setTheme(id as any);
    }
    window.addEventListener('jyotish:theme', onThemeEvent);
    return () => window.removeEventListener('jyotish:theme', onThemeEvent);
  }, [setTheme]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT') return;
      if (e.altKey && e.key === 't') { e.preventDefault(); cycle(); }
      if (e.altKey && e.key === 'd') { e.preventDefault(); navigate('/dashboard'); }
      if (e.altKey && e.key === 'k') { e.preventDefault(); navigate('/'); }
      if (e.altKey && e.key === 'v') { e.preventDefault(); navigate('/divisionals'); }
      if (e.altKey && e.key === 'y') { e.preventDefault(); navigate('/dasha'); }
      if (e.altKey && e.key === 'm') { e.preventDefault(); navigate('/matching'); }
      if (e.altKey && e.key === 'p') { e.preventDefault(); navigate('/panchang'); }
      if (e.altKey && e.key === 'i') { e.preventDefault(); navigate('/timing'); }
      if (e.altKey && e.key === 'l') { e.preventDefault(); navigate('/library'); }
      if (e.altKey && e.key === 'e') { e.preventDefault(); navigate('/learn'); }
      if (e.altKey && e.key === 'x') { e.preventDefault(); navigate('/interactive'); }
      if (e.altKey && e.key === 'o') { e.preventDefault(); navigate('/offline'); }
      if (e.altKey && e.key === 'n') { e.preventDefault(); navigate('/numerology'); }
      if (e.altKey && e.key === 'a') { e.preventDefault(); navigate('/varshaphala'); }
      if (e.altKey && e.key === 'q') { e.preventDefault(); navigate('/prashna'); }
      if (e.altKey && e.key === 'r') { e.preventDefault(); navigate('/rectify'); }
      if (e.altKey && e.key === 'g') { e.preventDefault(); navigate('/events'); }
      if (e.altKey && e.key === 's') { e.preventDefault(); navigate('/sudarshana'); }
      if (e.altKey && e.key === 'h') { e.preventDefault(); navigate('/ephemeris'); }
      if (e.altKey && e.key === 'w') { e.preventDefault(); navigate('/worksheets'); }
      if (e.altKey && e.key === 'j') { e.preventDefault(); navigate('/interpret'); }
      if (e.altKey && e.key === 'b') { e.preventDefault(); navigate('/ashtakavarga'); }
      if (e.altKey && e.key === 'u') { e.preventDefault(); navigate('/jaimini'); }
      if (e.altKey && e.key === 'c') { e.preventDefault(); navigate('/classical'); }
      if (e.altKey && e.key === 'f') { e.preventDefault(); navigate('/kp-deep'); }
      if (e.altKey && e.key === 'z') { e.preventDefault(); navigate('/predictive'); }
      if (e.altKey && ['1','2','3','4'].includes(e.key)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('jyotish:theme', { detail: THEMES[Number(e.key)-1]?.id }));
      }

      // Font-zoom shortcuts: Cmd/Ctrl + (=|+) / (-|_) / 0
      // (Use the Ctrl+ browser shortcut as well; the browser still handles
      //  its own zoom — but our store-driven scaling overrides at the rem
      //  level so both work harmoniously.)
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        useFontScale.getState().zoomIn();
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        useFontScale.getState().zoomOut();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault();
        useFontScale.getState().reset();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cycle, navigate]);
  return null;
}

// ─── Sidebar navigation ─────────────────────────────────────────────────
type NavItem = { to: string; label: string; icon: (p: any) => ReactNode; hint?: string };
type NavSection = { section: string; items: NavItem[] };

function useNavSections(): NavSection[] {
  const { t } = useT();
  return [
    { section: t('section.workspace', 'Workspace'), items: [
      { to: '/',             label: t('nav.kundali',     'Kundali'),      icon: IconCompass,  hint: 'K' },
      { to: '/classic',      label: t('nav.classic',     'Classic View'), icon: IconStar },
      { to: '/divisionals',  label: t('nav.divisionals', 'Divisionals'),  icon: IconGrid,     hint: 'V' },
      { to: '/dasha',        label: t('nav.dasha',       'Dasha'),        icon: IconClock,    hint: 'Y' },
      { to: '/dashboard',    label: t('nav.dashboard',   'Dashboard'),    icon: IconHome,     hint: 'D' },
      { to: '/timing',       label: t('nav.timing',      'Timing'),       icon: IconClock,    hint: 'I' },
      { to: '/varshaphala',  label: t('nav.varshaphala', 'Varshaphala'),  icon: IconSparkle,  hint: 'A' },
      { to: '/prashna',      label: t('nav.prashna',     'Prashna'),      icon: IconSearch,   hint: 'Q' },
      { to: '/rectify',      label: t('nav.rectify',     'Rectify'),      icon: IconClock,    hint: 'R' },
      { to: '/events',       label: t('nav.events',      'Events'),       icon: IconStar,     hint: 'G' },
      { to: '/sudarshana',   label: t('nav.sudarshana',  'Sudarshana'),   icon: IconPalette,  hint: 'S' },
      { to: '/ephemeris',    label: t('nav.ephemeris',   'Ephemeris'),    icon: IconChart,    hint: 'H' },
      { to: '/interactive',  label: t('nav.interactive', 'Interactive'),  icon: IconChart,    hint: 'X' },
      { to: '/worksheets',   label: t('nav.worksheets',  'Worksheets'),   icon: IconBook,     hint: 'W' },
      { to: '/interpret',    label: t('nav.interpret',   'Interpret'),    icon: IconBook,     hint: 'J' },
      { to: '/ashtakavarga', label: t('nav.ashtakavarga','Ashtakavarga'), icon: IconGrid,     hint: 'B' },
      { to: '/jaimini',      label: t('nav.jaimini',     'Jaimini Dashas'), icon: IconClock,  hint: 'U' },
      { to: '/classical',    label: t('nav.classical',   'Classical'),    icon: IconBook,     hint: 'C' },
      { to: '/kp-deep',      label: t('nav.kpDeep',      'KP Deep'),      icon: IconStar,     hint: 'F' },
      { to: '/predictive',   label: t('nav.predictive',  'Predictive'),   icon: IconSparkle,  hint: 'Z' },
      { to: '/prashna-pro',  label: t('nav.prashnaPro',  'Prashna Pro'),  icon: IconSearch },
      { to: '/chakras',      label: t('nav.chakras',     'Chakras'),      icon: IconPalette },
      { to: '/muhurta-pro',  label: t('nav.muhurtaPro',  'Muhurta Pro'),  icon: IconCalendar },
      { to: '/remedies',     label: t('nav.remedies',    'Remedies'),     icon: IconSparkle },
      { to: '/specialty',    label: t('nav.specialty',   'Specialty'),    icon: IconStar },
      { to: '/research',     label: t('nav.research',    'Research'),     icon: IconSearch },
      { to: '/classical-texts', label: t('nav.classicalTexts', 'Classical Texts'), icon: IconBook },
      { to: '/calendar',     label: t('nav.calendar',    'Calendar'),     icon: IconCalendar },
      { to: '/ai',           label: t('nav.ai',          'AI · Narrative'), icon: IconSparkle },
      { to: '/export',       label: t('nav.export',      'Print & Export'), icon: IconCloud },
    ]},
    { section: t('section.knowledge', 'Knowledge'), items: [
      { to: '/library',    label: t('nav.library',    'Library'),     icon: IconUsers,    hint: 'L' },
      { to: '/learn',      label: t('nav.learn',      'Learn'),       icon: IconGrad,     hint: 'E' },
      { to: '/views',      label: t('nav.views',      'Saved Views'), icon: IconSparkle },
    ]},
    { section: t('section.tools', 'Tools'), items: [
      { to: '/matching',   label: t('nav.matching',   'Matching'),    icon: IconStar,     hint: 'M' },
      { to: '/panchang',   label: t('nav.panchang',   'Panchang'),    icon: IconCalendar, hint: 'P' },
      { to: '/muhurat',    label: t('nav.muhurat',    'Muhurat'),     icon: IconSparkle },
      { to: '/numerology', label: t('nav.numerology', 'Numerology'),  icon: IconHash,     hint: 'N' },
      { to: '/biometric',  label: t('nav.biometric',  'Biometric'),   icon: IconSparkle },
    ]},
    { section: t('section.system', 'System'), items: [
      { to: '/offline',    label: t('nav.offline',    'Offline'),     icon: IconCloud,    hint: 'O' },
      { to: '/quality',    label: t('nav.quality',    'Quality'),     icon: IconShield },
      { to: '/admin',      label: t('nav.admin',      'Branding'),    icon: IconSettings },
    ]},
  ];
}

// Brand avatar — circular photo of the astrologer with graceful fallback
// to a compass icon if the image file isn't present at /hemraj-laddha.jpg.
function BrandAvatar() {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: 'var(--brand-primary)' }}>
        <IconCompass width={20} height={20} stroke="#FBF7EE" />
      </div>
    );
  }
  return (
    <img
      src="/hemraj-laddha.jpg"
      alt="Astrologer Hemraj Laddha"
      onError={() => setErrored(true)}
      className="w-9 h-9 rounded-full object-cover ring-2 ring-vedicGold/40"
    />
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sections = useNavSections();
  const { t } = useT();
  return (
    <>
      {/* mobile overlay */}
      {open && (
        <button onClick={onClose}
          aria-label="Close menu"
          className="md:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" />
      )}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-[248px] z-40 flex flex-col
          border-r border-vedicGold/30 transition-transform duration-200
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{ background: 'var(--surface-1)' }}>
        {/* Brand */}
        <div className="px-5 py-4 border-b border-vedicGold/30">
          <div className="flex items-center gap-2.5">
            <BrandAvatar />
            <div className="min-w-0">
              <div className="font-display font-bold text-[15px] leading-tight truncate" style={{ color: 'var(--text-strong)' }}>
                {t('brand.name', 'Astrologer Hemraj Laddha')}
              </div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
                {t('brand.subtitle', 'Vedic Astrology Suite')}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {sections.map((s) => (
            <div key={s.section} className="mb-1">
              <div className="sidebar-section-label">{s.section}</div>
              {s.items.map((it) => {
                const Icon = it.icon;
                return (
                  <NavLink key={it.to} to={it.to} end={it.to === '/'} onClick={onClose}
                    className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                    <span className="sidebar-icon"><Icon /></span>
                    <span className="flex-1 truncate">{it.label}</span>
                    {it.hint && (
                      <span className="text-[10px] font-mono opacity-50">⌥{it.hint}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-vedicGold/30 text-[11px]"
          style={{ color: 'var(--text-subtle)' }}>
          <div>{t('common.companyName', 'Astrologer Hemraj Laddha')}</div>
          <div>{t('common.engineFooter', 'Swiss Ephemeris · Lahiri ayanamsa')}</div>
        </div>
      </aside>
    </>
  );
}

// ─── Active-chart badge ──────────────────────────────────────────────────
// Shows the chart currently loaded into the global store. Click the chip to
// jump back to the Kundali page where the user can edit the details.
function ActiveChartBadge() {
  const active = useActiveChart((s) => s.active);
  const clear  = useActiveChart((s) => s.clear);
  const navigate = useNavigate();
  if (!active) return null;
  const dt = (active.datetime || '').slice(0, 10);
  const label = active.name && active.name.trim() ? active.name : (active.placeName || 'Active chart');
  return (
    <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-lg border text-xs"
      style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>Chart:</span>
      <button
        onClick={() => navigate('/')}
        className="font-semibold truncate max-w-[180px]"
        style={{ color: 'var(--text-body)' }}
        title={`${label} · ${dt} · ${active.placeName ?? ''} — click to edit`}
      >
        {label}
      </button>
      <span className="font-mono text-[10px]" style={{ color: 'var(--text-subtle)' }}>{dt}</span>
      <button
        onClick={() => clear()}
        className="ml-1 px-1.5 leading-none rounded hover:bg-vedicMaroon/10"
        style={{ color: 'var(--text-subtle)' }}
        title="Clear active chart"
        aria-label="Clear active chart"
      >×</button>
    </div>
  );
}

// ─── Font-zoom control ──────────────────────────────────────────────────
// Three-button widget (A−  A%  A+) for the user to scale every rem-based
// piece of UI. Pinned to the topbar so it's reachable from any page. The
// keyboard shortcuts ⌘+ / ⌘- / ⌘0 are wired in GlobalShortcuts above.
function FontZoomControl() {
  const scale   = useFontScale((s) => s.scale);
  const zoomIn  = useFontScale((s) => s.zoomIn);
  const zoomOut = useFontScale((s) => s.zoomOut);
  const reset   = useFontScale((s) => s.reset);
  const atMin = scale === FONT_SCALES[0];
  const atMax = scale === FONT_SCALES[FONT_SCALES.length - 1];
  const pct = Math.round(scale * 100);
  return (
    <div className="hidden sm:flex items-center gap-0.5 px-1 py-1 rounded-lg border"
      style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
      <button
        type="button"
        onClick={zoomOut}
        disabled={atMin}
        className="px-1.5 py-0.5 rounded text-xs font-bold disabled:opacity-40 hover:bg-vedicMaroon/10"
        style={{ color: 'var(--text-muted)' }}
        title="Decrease text size  (⌘−)"
        aria-label="Decrease text size"
      >A<span className="text-[9px] align-top">−</span></button>
      <button
        type="button"
        onClick={reset}
        className="px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums hover:bg-vedicMaroon/10"
        style={{ color: 'var(--text-body)' }}
        title="Reset to 100%  (⌘0)"
        aria-label={`Current zoom ${pct}%, click to reset`}
      >{pct}%</button>
      <button
        type="button"
        onClick={zoomIn}
        disabled={atMax}
        className="px-1.5 py-0.5 rounded text-sm font-bold disabled:opacity-40 hover:bg-vedicMaroon/10"
        style={{ color: 'var(--text-muted)' }}
        title="Increase text size  (⌘+)"
        aria-label="Increase text size"
      >A<span className="text-[10px] align-top">+</span></button>
    </div>
  );
}

// ─── Top bar ─────────────────────────────────────────────────────────────
function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { locale, setLocale, t } = useT();
  const { theme, setTheme } = useTheme();
  const current = THEMES.find((th) => th.id === theme);
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between gap-4 px-4 md:px-6 border-b border-vedicGold/30"
      style={{ background: 'color-mix(in srgb, var(--surface-1) 85%, transparent)', backdropFilter: 'blur(8px)', height: 60 }}>
      <div className="flex items-center gap-3">
        <button onClick={onToggleSidebar}
          className="md:hidden btn btn-ghost p-2" aria-label="Open menu">
          <IconMenu />
        </button>
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
          <IconSearch width={16} height={16} />
          <span className="hidden sm:inline">{t('common.searchAll', 'Search everything')}</span>
          <span className="hidden md:inline font-mono text-[11px] px-1.5 py-0.5 rounded"
            style={{ background: 'var(--surface-3)', color: 'var(--text-subtle)' }}>
            ⌘K
          </span>
        </button>
        <ActiveChartBadge />
      </div>

      <div className="flex items-center gap-1.5">
        <FontZoomControl />
        <div className="hidden sm:flex items-center gap-1 px-1.5 py-1 rounded-lg border"
          style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
          <IconGlobe width={14} height={14} stroke="var(--text-muted)" />
          <select value={locale} onChange={(e) => setLocale(e.target.value as any)}
            className="bg-transparent text-xs font-medium pr-1 focus:outline-none cursor-pointer"
            style={{ color: 'var(--text-body)' }}
            aria-label="Language">
            {LOCALES.map((l) => <option key={l.code} value={l.code}>{l.native} {l.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-lg border"
          style={{ background: 'var(--surface-1)', borderColor: 'var(--border-subtle)' }}>
          {current?.isDark ? <IconMoon width={14} height={14} stroke="var(--text-muted)" /> : <IconSun width={14} height={14} stroke="var(--text-muted)" />}
          <select value={theme} onChange={(e) => setTheme(e.target.value as any)}
            className="bg-transparent text-xs font-medium pr-1 focus:outline-none cursor-pointer"
            style={{ color: 'var(--text-body)' }}
            aria-label="Theme">
            {THEMES.map((th) => <option key={th.id} value={th.id}>{th.label}</option>)}
          </select>
        </div>
      </div>
    </header>
  );
}

// ─── Shell ───────────────────────────────────────────────────────────────
export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <BrowserRouter>
      <GlobalShortcuts />
      <CommandPalette />
      <div className="min-h-screen flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 md:ml-0">
          <TopBar onToggleSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 min-w-0">
            <Routes>
              <Route path="/"            element={<KundaliPage />} />
              <Route path="/divisionals" element={<DivisionalsPage />} />
              <Route path="/dasha"       element={<DeepDashaPage />} />
              <Route path="/dashboard"   element={<DashboardPage />} />
              <Route path="/classic"     element={<ClassicViewPage />} />
              <Route path="/timing"      element={<TimingPage />} />
              <Route path="/library"     element={<LibraryPage />} />
              <Route path="/learn"       element={<LearnPage />} />
              <Route path="/interactive" element={<InteractivePage />} />
              <Route path="/offline"     element={<OfflinePage />} />
              <Route path="/quality"     element={<QualityPage />} />
              <Route path="/varshaphala" element={<VarshaphalaPage />} />
              <Route path="/prashna"     element={<PrashnaPage />} />
              <Route path="/rectify"     element={<RectificationPage />} />
              <Route path="/events"      element={<EventPredictionPage />} />
              <Route path="/sudarshana"  element={<SudarshanaPage />} />
              <Route path="/ephemeris"   element={<EphemerisPage />} />
              <Route path="/worksheets"  element={<WorksheetsPage />} />
              <Route path="/interpret"   element={<InterpretationPage />} />
              <Route path="/ashtakavarga" element={<AshtakavargaPage />} />
              <Route path="/jaimini"     element={<JaiminiDashasPage />} />
              <Route path="/classical"   element={<ClassicalPage />} />
              <Route path="/kp-deep"     element={<KPDeepPage />} />
              <Route path="/predictive"  element={<PredictivePage />} />
              <Route path="/prashna-pro" element={<PrashnaProPage />} />
              <Route path="/chakras"     element={<ChakrasPage />} />
              <Route path="/muhurta-pro" element={<MuhurtaProPage />} />
              <Route path="/remedies"    element={<RemediesPage />} />
              <Route path="/specialty"   element={<SpecialtyPage />} />
              <Route path="/research"    element={<ResearchPage />} />
              <Route path="/classical-texts" element={<ClassicalTextsPage />} />
              <Route path="/calendar"    element={<CalendarPage />} />
              <Route path="/ai"          element={<AIPage />} />
              <Route path="/export"      element={<ExportPage />} />
              <Route path="/matching"    element={<MatchingPage />} />
              <Route path="/panchang"    element={<PanchangPage />} />
              <Route path="/muhurat"     element={<MuhuratPage />} />
              <Route path="/numerology"  element={<NumerologyPage />} />
              <Route path="/biometric"   element={<BiometricPage />} />
              <Route path="/views"       element={<SavedViewsPage />} />
              <Route path="/admin"       element={<AdminBrandingPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
