"use client";

import * as React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import type { LandingMessages } from "@/lib/landing/i18n";

interface SiteHeaderProps {
  messages: LandingMessages;
  /** Code langue affiché dans le switcher (FR/PT). */
  langCode: string;
}

/**
 * <SiteHeader /> — Sticky header public (P2).
 * Logo + nav desktop (4 items vers `#` placeholders) + LangSwitcher stub + CTAs auth.
 *
 * LangSwitcher est un button stub non-interactif au MVP (cookie write + reload viendra
 * avec migration next-intl, OQ-001).
 */
export function SiteHeader({ messages: t, langCode }: SiteHeaderProps) {
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
            style={{
              color: "var(--brand-primary)",
              fontFamily: "var(--font-serif)",
            }}
          >
            EasyLaw
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="hidden md:flex items-center gap-6 text-sm">
          {/* TODO(P3+): pages réelles — pour l'instant placeholders no-op */}
          <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]">
            {t.navProducts}
          </a>
          <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]">
            {t.navHowItWorks}
          </a>
          <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]">
            {t.navPricing}
          </a>
          <a href="#" className="text-[var(--text-secondary)] hover:text-[var(--brand-primary)] transition-colors rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]">
            {t.navCabinet}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            aria-label="Sélecteur de langue (bientôt actif)"
            className="rounded-md border border-[var(--surface-mist-strong)] bg-transparent px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] opacity-70 cursor-not-allowed"
          >
            {langCode.toUpperCase()} ▾
          </button>
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
