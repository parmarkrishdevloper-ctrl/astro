// Theme system supporting 4 named visual themes. The active theme is exposed
// to CSS via `data-theme` on the <html> element. We also keep the `dark` class
// in sync for the existing dark-mode utility overrides in index.css.

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export type Theme = 'classic' | 'dark-cosmic' | 'modern-minimal' | 'royal-traditional';

export const THEMES: { id: Theme; label: string; isDark: boolean }[] = [
  { id: 'classic',           label: 'Classic',           isDark: false },
  { id: 'dark-cosmic',       label: 'Dark Cosmic',       isDark: true  },
  { id: 'modern-minimal',    label: 'Modern Minimal',    isDark: false },
  { id: 'royal-traditional', label: 'Royal Traditional', isDark: false },
];

const STORAGE_KEY = 'jyotishpro.theme';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  /** Cycle to the next theme in THEMES order — wired to a keyboard shortcut. */
  cycle: () => void;
  /**
   * Backwards-compat: existing components used `toggle()` to flip light/dark.
   * It now toggles between Classic and Dark Cosmic.
   */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isTheme(s: string | null): s is Theme {
  return THEMES.some((t) => t.id === s);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'classic';
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) return stored;
    // Legacy values from the old 2-theme system
    if (stored === 'dark') return 'dark-cosmic';
    if (stored === 'light') return 'classic';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark-cosmic'
      : 'classic';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    const isDark = THEMES.find((t) => t.id === theme)?.isDark ?? false;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function setTheme(t: Theme) { setThemeState(t); }
  function cycle() {
    setThemeState((current) => {
      const idx = THEMES.findIndex((t) => t.id === current);
      return THEMES[(idx + 1) % THEMES.length].id;
    });
  }
  function toggle() {
    setThemeState((current) => (current === 'dark-cosmic' ? 'classic' : 'dark-cosmic'));
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycle, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}
