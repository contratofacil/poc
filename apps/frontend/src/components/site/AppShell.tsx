"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useEasyLawAuth } from "@/lib/privy";
import { AppSidebar, type AppSection } from "./AppSidebar";
import { AppTopBar, type BreadcrumbItem } from "./AppTopBar";

interface AppShellProps {
  activeSection: AppSection;
  breadcrumb: BreadcrumbItem[];
  hasNotifications?: boolean;
  /** Si true, requiert une session Privy — sinon redirect /login?redirect=<currentPath>. */
  requireAuth?: boolean;
  /** Path courant pour le param redirect (default : window.location.pathname côté client). */
  currentPath?: string;
  children: React.ReactNode;
}

/**
 * AppShell — wrapper layout pour les routes authentifiées.
 * Compose sidebar + topbar + main scrollable. Auth check via Privy.
 */
export function AppShell({
  activeSection,
  breadcrumb,
  hasNotifications = false,
  requireAuth = true,
  currentPath,
  children,
}: AppShellProps) {
  const router = useRouter();
  const { ready, authenticated } = useEasyLawAuth();

  React.useEffect(() => {
    if (!requireAuth || !ready || authenticated) return;
    // window.__TEST_MODE__ s'active de façon asynchrone (Playwright) — ne pas
    // rediriger avant que useEasyLawAuth ait pu le prendre en compte.
    if (typeof window !== "undefined" && window.__TEST_MODE__) return;
    const path = currentPath ?? window.location.pathname;
    router.replace(`/login?redirect=${encodeURIComponent(path)}`);
  }, [requireAuth, ready, authenticated, currentPath, router]);

  if (requireAuth && !(ready && authenticated)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--surface-page)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Vérification de session…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: "var(--surface-page)" }}>
      {/* Skip-link */}
      <a
        href="#app-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-[var(--brand-primary)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--surface-page)] focus-visible:shadow-[var(--shadow-focus-on-gold)]"
      >
        Aller au contenu principal
      </a>

      <AppSidebar active={activeSection} />

      <div className="flex-1 min-w-0 flex flex-col pb-16 lg:pb-0">
        <AppTopBar breadcrumb={breadcrumb} hasNotifications={hasNotifications} />
        <main id="app-main" className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
