"use client";

import * as React from "react";
import type { LandingLang } from "@/lib/landing/i18n";

const STORAGE_KEY = "easylaw-lang";
const SUPPORTED: LandingLang[] = ["pt", "fr", "en"];

function readStoredLang(): LandingLang | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "fr" || v === "pt" || v === "en") return v;
  } catch {
    // SSR or restricted storage
  }
  return null;
}

// Note: document.documentElement.lang is NOT checked here because layout.tsx
// hardcodes lang="pt", which would block browser language detection entirely.
function detectLang(): LandingLang {
  const stored = readStoredLang();
  if (stored) return stored;

  if (typeof navigator !== "undefined") {
    for (const nav of navigator.languages ?? [navigator.language ?? ""]) {
      const code = nav.toLowerCase().slice(0, 2) as LandingLang;
      if (SUPPORTED.includes(code)) return code;
    }
  }

  return "pt";
}

interface LanguageContextValue {
  lang: LandingLang;
  setLang: (lang: LandingLang) => void;
}

const LanguageContext = React.createContext<LanguageContextValue>({
  lang: "pt",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<LandingLang>("pt");

  React.useEffect(() => {
    setLangState(detectLang());
  }, []);

  const setLang = React.useCallback((next: LandingLang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    } catch {
      // ignore
    }
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): [LandingLang, (lang: LandingLang) => void] {
  const { lang, setLang } = React.useContext(LanguageContext);
  return [lang, setLang];
}
