'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { dictionaries, Locale } from '@/app/lib/i18n/dictionaries';

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (typeof dictionaries)['en'];
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('0w_locale') as Locale | null;
    if (saved && (saved === 'en' || saved === 'fr')) {
      setLocaleState(saved);
    } else if (navigator.language.startsWith('fr')) {
      setLocaleState('fr');
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('0w_locale', l);
    document.documentElement.lang = l;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
