"use client";

import * as React from "react";
import Link from "next/link";
import {
  Home,
  FileText,
  Edit2,
  Clock,
  MessageSquare,
  Lock,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type AppSection =
  | "dashboard"
  | "nif"
  | "contracts"
  | "compliance"
  | "assistant"
  | "vault"
  | "admin";

interface NavItem {
  id: AppSection;
  label: string;
  href: string;
  icon: LucideIcon;
}

const ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: Home },
  { id: "nif", label: "NIF & dossiers", href: "/nif", icon: FileText },
  { id: "contracts", label: "Contrats", href: "/contracts", icon: Edit2 },
  { id: "compliance", label: "Compliance", href: "/compliance", icon: Clock },
  { id: "assistant", label: "Luso-Legal", href: "/assistant", icon: MessageSquare },
  { id: "vault", label: "Coffre", href: "/vault", icon: Lock },
  { id: "admin", label: "Administration", href: "/admin", icon: Settings },
];

interface AppSidebarProps {
  active: AppSection;
  userName?: string;
  userMeta?: string;
}

/**
 * <AppSidebar /> — sidebar gauche desktop / bottom-nav mobile (P3).
 * Réutilisable pour toute route authentifiée. Item actif highlighted via
 * background subtil + border-left gold (cf. mock 03).
 */
export function AppSidebar({ active, userName = "Miguel Rodrigues", userMeta = "Import Lda · PME" }: AppSidebarProps) {
  return (
    <>
      {/* DESKTOP sidebar (lg+) */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:sticky lg:top-0"
        style={{
          background: "var(--surface-sidebar)",
          color: "var(--surface-page)",
        }}
        aria-label="Navigation principale"
      >
        <div className="p-5 border-b border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{ background: "var(--brand-secondary)" }}
              aria-hidden="true"
            >
              <span
                className="font-bold"
                style={{
                  color: "var(--brand-primary)",
                  fontFamily: "var(--font-serif)",
                }}
              >
                E
              </span>
            </span>
            <span
              className="font-semibold text-lg"
              style={{ fontFamily: "var(--font-serif)" }}
            >
              EasyLaw
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1 text-sm" aria-label="Sections de l'application">
          {ITEMS.map((item) => {
            const isActive = item.id === active;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                  "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]",
                  isActive
                    ? "font-medium"
                    : "hover:bg-white/10 text-white/90",
                ].join(" ")}
                style={
                  isActive
                    ? {
                        background: "rgba(212, 160, 23, 0.15)",
                        borderLeft: "3px solid var(--brand-secondary)",
                        paddingLeft: "calc(0.75rem - 3px)",
                      }
                    : undefined
                }
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 text-xs opacity-90 flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-full flex items-center justify-center font-semibold flex-shrink-0"
            style={{ background: "var(--brand-secondary)", color: "var(--brand-primary)" }}
            aria-hidden="true"
          >
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium">{userName}</p>
            <p className="truncate opacity-80">{userMeta}</p>
          </div>
        </div>
      </aside>

      {/* MOBILE bottom-nav (<lg) */}
      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-20 border-t flex justify-around"
        style={{
          background: "var(--surface-sidebar)",
          color: "var(--surface-page)",
          borderColor: "rgba(255,255,255,0.10)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-label="Navigation principale"
      >
        {ITEMS.slice(0, 5).map((item) => {
          const isActive = item.id === active;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={[
                "flex flex-col items-center gap-0.5 py-2 px-1 text-[10px]",
                "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)] rounded-md",
                isActive ? "" : "opacity-70 hover:opacity-100 transition-opacity",
              ].join(" ")}
              style={isActive ? { color: "var(--brand-secondary)" } : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
