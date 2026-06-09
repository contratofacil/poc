"use client";

import * as React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { ConsentFooterLink } from "@/components/ui/ConsentFooterLink";
import type { LandingMessages } from "@/lib/landing/i18n";

interface SiteFooterProps {
  messages: LandingMessages;
}

/**
 * <SiteFooter /> — Footer navy 4 colonnes (P2).
 * Inclut <ConsentFooterLink /> dans la colonne Légal (P4 — réouvre le banner).
 * Tous les liens hors `/legal/cookies` pointent vers `#` (TODO placeholders, voir spec).
 */
export function SiteFooter({ messages: t }: SiteFooterProps) {
  return (
    <footer
      className="border-t border-[var(--surface-mist)]"
      style={{
        background: "var(--brand-primary)",
        color: "var(--surface-page)",
      }}
    >
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-md"
              style={{ background: "var(--brand-secondary)" }}
              aria-hidden="true"
            >
              <Shield className="h-3.5 w-3.5" style={{ color: "var(--brand-primary)" }} />
            </span>
            <span
              className="font-semibold"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              EasyLaw
            </span>
          </div>
          <p className="opacity-80 leading-relaxed">{t.footerTagline}</p>
        </div>

        <div>
          <p className="font-medium mb-3">{t.footerColProducts}</p>
          <ul className="space-y-2 opacity-90">
            <li><a href="#" className="hover:underline rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]">{t.footerProd1}</a></li>
            <li><a href="#" className="hover:underline rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]">{t.footerProd2}</a></li>
            <li><a href="#" className="hover:underline rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]">{t.footerProd3}</a></li>
            <li><a href="#" className="hover:underline rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]">{t.footerProd4}</a></li>
          </ul>
        </div>

        <div>
          <p className="font-medium mb-3">{t.footerColCompany}</p>
          <ul className="space-y-2 opacity-90">
            <li><a href="#" className="hover:underline rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]">{t.footerCo1}</a></li>
            <li><a href="#" className="hover:underline rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]">{t.footerCo2}</a></li>
            <li><a href="#" className="hover:underline rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]">{t.footerCo3}</a></li>
            <li><a href="#" className="hover:underline rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]">{t.footerCo4}</a></li>
          </ul>
        </div>

        <div>
          <p className="font-medium mb-3">{t.footerColLegal}</p>
          <ul className="space-y-2 opacity-90">
            <li><a href="#" className="hover:underline rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]">{t.footerLegal1}</a></li>
            <li><a href="#" className="hover:underline rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]">{t.footerLegal2}</a></li>
            <li><Link href="/legal/cookies" className="hover:underline rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]">{t.footerLegal3}</Link></li>
            <li><a href="#" className="hover:underline rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]">{t.footerLegal4}</a></li>
            <li className="pt-1"><ConsentFooterLink className="!text-[var(--surface-page)] !opacity-90 hover:!text-[var(--surface-page)]" /></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3 text-xs opacity-70">
          <p>{t.footerCopyright}</p>
          <p className="max-w-2xl">{t.footerSupervision}</p>
        </div>
      </div>
    </footer>
  );
}
