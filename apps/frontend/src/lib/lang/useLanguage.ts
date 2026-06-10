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

function detectLang(): LandingLang {
  const stored = readStoredLang();
  if (stored) return stored;

  if (typeof document !== "undefined") {
    const doc = document.documentElement.lang.toLowerCase().slice(0, 2);
    if (SUPPORTED.includes(doc as LandingLang)) return doc as LandingLang;
  }

  if (typeof navigator !== "undefined") {
    for (const nav of navigator.languages ?? [navigator.language ?? ""]) {
      const code = nav.toLowerCase().slice(0, 2) as LandingLang;
      if (SUPPORTED.includes(code)) return code;
    }
  }

  return "pt";
}

/**
 * Trilingual language hook — EN / FR / PT.
 * Persists choice in localStorage and updates <html lang="…">.
 */
export function useLanguage(): [LandingLang, (lang: LandingLang) => void] {
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

  return [lang, setLang];
}
