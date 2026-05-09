// Tiny zero-dep i18n. We expose a Provider, a hook `useT()`, and a key-based
// `t()` function. Locale is persisted to localStorage.

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { en } from './en';
import { hi } from './hi';
import { gu } from './gu';
import { sa } from './sa';
import { makeAstroTranslator, AstroTranslator } from './astro-labels';

export type Locale = 'en' | 'hi' | 'gu' | 'sa';
const DICTS: Record<Locale, Record<string, string>> = { en, hi, gu, sa };
export const LOCALES: { code: Locale; label: string; native: string }[] = [
  { code: 'en', label: 'English',   native: 'EN' },
  { code: 'hi', label: 'Hindi',     native: 'हि' },
  { code: 'gu', label: 'Gujarati',  native: 'ગુ' },
  { code: 'sa', label: 'Sanskrit',  native: 'सं' },
];
const STORAGE_KEY = 'jyotishpro.locale';

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, fallback?: string) => string;
  /** Translators for computed astrology labels (planets, rashis, etc.) */
  al: AstroTranslator;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    return stored && stored in DICTS ? stored : 'en';
  });

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  function setLocale(l: Locale) {
    setLocaleState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }

  function t(key: string, fallback?: string): string {
    return DICTS[locale][key] ?? DICTS.en[key] ?? fallback ?? key;
  }

  const al = useMemo(() => makeAstroTranslator(locale), [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, al }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useT(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT must be used within <I18nProvider>');
  return ctx;
}
