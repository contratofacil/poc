"use client";

import * as React from "react";
import Link from "next/link";
import { Globe, Shield } from "lucide-react";
import type { LandingLang, LandingMessages } from "@/lib/landing/i18n";

interface SiteHeaderProps {
  messages: LandingMessages;
  lang: LandingLang;
  onLangChange: (lang: LandingLang) => void;
}

const LANGS: { code: LandingLang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
  { code: "pt", label: "PT" },
];

export function SiteHeader({ messages: t, lang, onLangChange }: SiteHeaderProps) {
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const currentLabel = LANGS.find((l) => l.code === lang)?.label ?? lang.toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--surface-mist)] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--brand-primary)" }}
            aria-hidden="true"
          >
            <Shield className="h-4 w-4" style={{ color: "var(--brand-secondary)" }} />
          </span>
          <span
            className="text-lg font-semibold"
            style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}
          >
            EasyLaw
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-6 text-sm">
          <a href="/#features" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]">
            {t.navProducts}
          </a>
          <a href="/#how" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]">
            {t.navHowItWorks}
          </a>
          <Link href="/pricing" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]">
            {t.navPricing}
          </Link>
          <Link href="/cabinet" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]">
            {t.navCabinet}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label="Select language"
              className="flex items-center gap-1 rounded-md border border-[var(--surface-mist-strong)] bg-transparent px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-page)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              {currentLabel}
              <span aria-hidden="true" className="opacity-60">▾</span>
            </button>

            {open && (
              <ul
                role="listbox"
                aria-label="Language"
                className="absolute right-0 mt-1 w-24 rounded-lg border border-[var(--surface-mist)] bg-white shadow-[var(--shadow-card)] py-1 text-sm z-50"
              >
                {LANGS.map(({ code, label }) => (
                  <li key={code} role="option" aria-selected={lang === code}>
                    <button
                      type="button"
                      onClick={() => { onLangChange(code); setOpen(false); }}
                      className={[
                        "w-full text-left px-3 py-1.5 rounded-sm hover:bg-[var(--surface-page)] transition-colors",
                        lang === code
                          ? "font-semibold text-[var(--brand-primary)]"
                          : "text-[var(--text-secondary)]",
                      ].join(" ")}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Link
            href="/login"
            className="hidden sm:inline-flex rounded-md border border-[var(--surface-mist-strong)] px-3 py-1.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-page)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          >
            {t.signIn}
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-[var(--brand-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--brand-secondary-hover)] transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]"
          >
            {t.startCta}
          </Link>
        </div>
      </div>
    </header>
  );
}
