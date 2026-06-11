"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home, FileText, Edit2, Clock, MessageSquare,
  Lock, Settings, Search, LogOut, User,
  Brain, FolderOpen, Wand2,
  type LucideIcon,
} from "lucide-react";
import { useEasyLawAuth } from "@/lib/privy";
import { apiFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppSection =
  | "dashboard"
  | "nif"
  | "contracts"
  | "compliance"
  | "assistant"
  | "vault"
  | "research"
  | "admin"
  | "ged"
  | "analysis"
  | "documents";

interface NavItem {
  id: AppSection;
  label: string;
  href: string;
  icon: LucideIcon;
}

interface UserProfile {
  name: string | null;
  email: string;
  role: string;
}

// ─── Role config ──────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  super_admin:    "Super Admin",
  admin:          "Administrateur",
  cabinet_avocat: "Cabinet Avocat",
  avocat:         "Avocat",
  avocat_associe: "Avocat Associé",
  juriste:        "Juriste",
  salarie:        "Salarié",
  assistant:      "Assistant",
};

const ROLE_COLORS: Record<string, string> = {
  super_admin:    "#dc2626",
  admin:          "#4f46e5",
  cabinet_avocat: "var(--brand-secondary)",
  avocat:         "#b45309",
  avocat_associe: "#92400e",
  juriste:        "#065f46",
  salarie:        "#94a3b8",
  assistant:      "#94a3b8",
};

// ─── Nav items ────────────────────────────────────────────────────────────────

const ITEMS: NavItem[] = [
  { id: "dashboard",  label: "Dashboard",     href: "/dashboard",  icon: Home },
  { id: "nif",        label: "NIF & dossiers", href: "/nif",        icon: FileText },
  { id: "contracts",  label: "Contrats",       href: "/contracts",  icon: Edit2 },
  { id: "compliance", label: "Compliance",     href: "/compliance", icon: Clock },
  { id: "assistant",  label: "Luso-Legal",     href: "/assistant",  icon: MessageSquare },
  { id: "vault",      label: "Coffre",         href: "/vault",      icon: Lock },
  { id: "research",   label: "Recherche IA",   href: "/research",   icon: Search },
  { id: "analysis",  label: "Analyse docs",   href: "/analysis",   icon: Brain },
  { id: "ged",       label: "GED Cabinet",    href: "/ged",        icon: FolderOpen },
  { id: "documents", label: "Documents IA",   href: "/documents/generate", icon: Wand2 },
  { id: "admin",     label: "Administration", href: "/admin",      icon: Settings },
];

// ─── User avatar helper ───────────────────────────────────────────────────────

function getInitials(name: string | null, email: string) {
  if (name?.trim()) {
    return name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AppSidebarProps {
  active: AppSection;
}

export function AppSidebar({ active }: AppSidebarProps) {
  const router = useRouter();
  const { logout, getAccessToken } = useEasyLawAuth();
  const [userProfile, setUserProfile] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;
        const res = await apiFetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled && res.ok && data.success) {
          setUserProfile({
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
          });
        }
      } catch {
        // non-fatal — sidebar degrades gracefully
      }
    })();
    return () => { cancelled = true; };
  }, [getAccessToken]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const displayName = userProfile
    ? (userProfile.name?.trim() || userProfile.email.split("@")[0])
    : "…";
  const displayRole = userProfile ? (ROLE_LABELS[userProfile.role] ?? userProfile.role) : "";
  const initials     = userProfile ? getInitials(userProfile.name, userProfile.email) : "…";
  const roleColor    = userProfile ? (ROLE_COLORS[userProfile.role] ?? "var(--brand-secondary)") : "var(--brand-secondary)";

  return (
    <>
      {/* ── DESKTOP sidebar (lg+) ──────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-64 lg:h-screen lg:sticky lg:top-0"
        style={{ background: "var(--surface-sidebar)", color: "var(--surface-page)" }}
        aria-label="Navigation principale"
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-md"
              style={{ background: "var(--brand-secondary)" }}
            >
              <span
                className="font-bold"
                style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}
              >
                E
              </span>
            </span>
            <span className="font-semibold text-lg" style={{ fontFamily: "var(--font-serif)" }}>
              EasyLaw
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 text-sm overflow-y-auto" aria-label="Sections de l'application">
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
                  isActive ? "font-medium" : "hover:bg-white/10 text-white/90",
                ].join(" ")}
                style={
                  isActive
                    ? {
                        background: "rgba(212,160,23,0.15)",
                        borderLeft: "3px solid var(--brand-secondary)",
                        paddingLeft: "calc(0.75rem - 3px)",
                      }
                    : undefined
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-white/10 space-y-1">
          {/* Profile link */}
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)] group"
          >
            {/* Avatar */}
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "var(--brand-secondary)", color: "var(--brand-primary)" }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-white/90 group-hover:text-white">
                {displayName}
              </p>
              {displayRole && (
                <p className="text-[10px] truncate" style={{ color: roleColor, opacity: 0.9 }}>
                  {displayRole}
                </p>
              )}
            </div>
            <User className="w-3.5 h-3.5 shrink-0 opacity-50 group-hover:opacity-80" aria-hidden="true" />
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/70 hover:bg-white/10 hover:text-white/90 transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus-on-gold)]"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="text-xs">Se déconnecter</span>
          </button>
        </div>
      </aside>

      {/* ── MOBILE bottom-nav (<lg) ────────────────────────────────────────────── */}
      <nav
        className="lg:hidden fixed inset-x-0 bottom-0 z-20 border-t flex justify-around"
        style={{
          background: "var(--surface-sidebar)",
          borderColor: "rgba(255,255,255,0.10)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-label="Navigation principale"
      >
        {ITEMS.slice(0, 4).map((item) => {
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
              style={isActive ? { color: "var(--brand-secondary)" } : { color: "white" }}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
        {/* Profile button in mobile nav */}
        <Link
          href="/profile"
          aria-current={undefined}
          className="flex flex-col items-center gap-0.5 py-2 px-1 text-[10px] opacity-70 hover:opacity-100 transition-opacity rounded-md focus-visible:outline-none"
          style={{ color: "white" }}
        >
          <div
            className="h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold"
            style={{ background: "var(--brand-secondary)", color: "var(--brand-primary)" }}
          >
            {initials}
          </div>
          <span>Profil</span>
        </Link>
      </nav>
    </>
  );
}
