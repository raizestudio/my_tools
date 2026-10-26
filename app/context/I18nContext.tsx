// app/context/I18nContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { dictionaries, Locale, Dictionary } from "@/app/lib/i18n/dictionaries";

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Rendu initial serveur/statique
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    // 1. Choix explicite enregistré
    const saved = localStorage.getItem("0w_locale") as Locale;
    if (saved && (saved === "fr" || saved === "en")) {
      setLocaleState(saved);
      document.documentElement.lang = saved;
      return;
    }

    // 2. Détection de la langue du système / navigateur
    const browserLang = (navigator.language || "").toLowerCase();
    const detectedLocale: Locale = browserLang.startsWith("fr") ? "fr" : "en";

    setLocaleState(detectedLocale);
    document.documentElement.lang = detectedLocale;
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("0w_locale", newLocale);
    document.documentElement.lang = newLocale;
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t: dictionaries[locale] ?? dictionaries.fr,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
};
