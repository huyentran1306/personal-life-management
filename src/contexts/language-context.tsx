"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type Locale, type TranslationKey, t as translate } from "@/lib/i18n";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("plm-locale") as Locale | null;
    if (saved === "en" || saved === "vi") setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("plm-locale", l);
  }

  function t(key: TranslationKey, vars?: Record<string, string | number>) {
    return translate(locale, key, vars);
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
