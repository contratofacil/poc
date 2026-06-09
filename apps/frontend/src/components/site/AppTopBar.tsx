"use client";

import * as React from "react";
import Link from "next/link";
import { Bell } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface AppTopBarProps {
  breadcrumb: BreadcrumbItem[];
  /** Si true, dot rouge notification visible sur la cloche */
  hasNotifications?: boolean;
  langCode?: string;
}

/**
 * <AppTopBar /> — top bar shell routes authentifiées (P3).
 * Breadcrumb à gauche + LangSwitcher stub + bell notifications stub.
 */
export function AppTopBar({
  breadcrumb,
  hasNotifications = false,
  langCode = "FR",
}: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-10 border-b bg-white" style={{ borderColor: "var(--surface-mist)" }}>
      <div className="px-4 lg:px-8 h-14 flex items-center justify-between">
        <nav aria-label="Fil d'Ariane" className="text-sm">
          <ol className="flex items-center gap-2 text-[var(--text-muted)]">
            {breadcrumb.map((item, i) => {
              const isLast = i === breadcrumb.length - 1;
              return (
                <li key={`${item.label}-${i}`} className="flex items-center gap-2">
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="hover:text-[var(--brand-primary)] transition-colors rounded-sm focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      aria-current={isLast ? "page" : undefined}
                      className={isLast ? "text-[var(--text-primary)]" : ""}
                    >
                      {item.label}
                    </span>
                  )}
                  {!isLast && <span aria-hidden="true">/</span>}
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            aria-label="Sélecteur de langue (bientôt actif)"
            className="rounded-md border px-2.5 py-1.5 text-xs font-medium opacity-70 cursor-not-allowed bg-transparent"
            style={{ borderColor: "var(--surface-mist-strong)", color: "var(--text-secondary)" }}
          >
            {langCode} ▾
          </button>
          <button
            type="button"
            aria-label={
              hasNotifications
                ? "Notifications (nouvelles)"
                : "Notifications"
            }
            className="relative rounded-md p-2 hover:bg-[var(--surface-page)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] transition-colors"
          >
            <Bell className="h-[18px] w-[18px]" style={{ color: "var(--text-secondary)" }} aria-hidden="true" />
            {hasNotifications && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "var(--status-red)" }}
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
