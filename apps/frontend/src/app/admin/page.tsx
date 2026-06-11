"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserPlus,
  Check,
  AlertCircle,
  Edit3,
  Trash2,
  Plus,
  Sliders,
  MessageSquare,
  LayoutDashboard,
  TrendingUp,
  FileText,
  Bot,
  CreditCard,
  ShieldCheck,
  Activity,
  Cpu,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Database,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { useEasyLawAuth } from "@/lib/privy";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/site/AppShell";
import { KPICard } from "@/components/admin/KPICard";
import { PeriodFilter, type Period } from "@/components/admin/PeriodFilter";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  lang: string;
  is_verified: number;
}

interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  lang: string;
  created_at: string;
}

interface ClauseVersion {
  id: string;
  contract_type: string;
  clause_key: string;
  content: string;
  loi_reference: string;
}

interface SystemSetting {
  key: string;
  value: string;
}

type TabType = "overview" | "users" | "clauses" | "compliance" | "ai" | "llm" | "rag" | "audit";

interface LLMPrompt {
  id: string;
  key: string;
  name: string;
  description: string | null;
  system_prompt: string;
  user_prompt_template: string | null;
  provider: string;
  model: string;
  max_tokens: number;
  temperature: number;
  updated_at: string;
}

type LLMProvider = "anthropic" | "openai" | "mistral" | "google";

// ─── Role definitions (mirrors backend ROLES) ─────────────────────────────────
type UserRole =
  | "super_admin"
  | "admin"
  | "cabinet_avocat"
  | "avocat"
  | "avocat_associe"
  | "juriste"
  | "salarie"
  | "assistant";

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin:    "Super Administrateur",
  admin:          "Administrateur",
  cabinet_avocat: "Cabinet Avocat",
  avocat:         "Avocat",
  avocat_associe: "Avocat Associé",
  juriste:        "Juriste",
  salarie:        "Salarié",
  assistant:      "Assistant",
};

const ALL_ROLES: UserRole[] = [
  "super_admin", "admin", "cabinet_avocat",
  "avocat", "avocat_associe", "juriste",
  "salarie", "assistant",
];

const ADMIN_ROLES: UserRole[] = ["super_admin", "admin", "cabinet_avocat"];
// ─────────────────────────────────────────────────────────────────────────────

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: "#C96B30",
  openai: "#10A37F",
  mistral: "#7C3AED",
  google: "#4285F4",
};

const PROVIDER_MODELS: Record<LLMProvider, string[]> = {
  anthropic: ["claude-haiku-4-5", "claude-sonnet-4-6", "claude-opus-4-8"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
  mistral: ["mistral-small-latest", "mistral-large-latest", "open-mistral-nemo"],
  google: ["gemini-2.0-flash", "gemini-1.5-pro"],
};

interface AdminStats {
  period: string;
  users: { total: number; new: number; verified: number; byRole: Record<string, number> };
  nif: { total: number; new: number; byStatus: Record<string, number>; conversionRate: number };
  payments: { totalRevenue: number; paidCount: number; pendingCount: number; byProduct: Record<string, number> };
  contracts: { total: number; new: number; byType: Record<string, number> };
  assistant: { totalMessages: number; escalations: { pending: number; assigned: number; closed: number } };
  compliance: { green: number; orange: number; red: number; total: number };
  vault: { totalDocuments: number; totalSizeBytes: number };
  recentActions: { action: string; entity_type: string; ip_addr: string; timestamp: string; user_email: string }[];
}

interface IndexingRun {
  id: string;
  source: string;
  status: string;
  docs_indexed: number;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
}

interface IndexingStatus {
  runs: IndexingRun[];
  docCounts: { source: string; count: number }[];
}

// ─── Shared style constants ───────────────────────────────────────────────────

const CLS_INPUT =
  "w-full px-3 py-2 rounded-lg text-sm transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/20";

const INPUT_STYLE: React.CSSProperties = {
  border: "1px solid var(--surface-mist)",
  color: "var(--brand-primary)",
  background: "var(--surface-card)",
};

const CLS_BTN_PRIMARY =
  "py-2 px-4 rounded-lg text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45 disabled:opacity-60 disabled:cursor-not-allowed";

const CLS_BTN_OUTLINE =
  "px-3 py-2 border rounded-lg text-sm transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45";

// ─── Source colors ─────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  DRE_I: "#1A6FC4",
  DRE_II: "#2E86AB",
  DGSI: "#7C3AED",
  CURIA: "#0F5C2E",
  EURLEX: "#1A4B8C",
  CAAD: "#C96B30",
};

// ─── Admin sub-sidebar nav ─────────────────────────────────────────────────────

interface NavGroup {
  label: string;
  items: { id: TabType; label: string; Icon: React.ElementType; badge?: string | number }[];
}

// ─── Inner content ────────────────────────────────────────────────────────────

function AdminPageContent() {
  const { getAccessToken } = useEasyLawAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Overview tab
  const [period, setPeriod] = useState<Period>("30d");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Users tab
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>("avocat");
  const [isInviting, setIsInviting] = useState(false);

  // Clauses tab
  const [clauses, setClauses] = useState<ClauseVersion[]>([]);
  const [isEditingClause, setIsEditingClause] = useState<string | null>(null);
  const [clauseForm, setClauseForm] = useState({
    contract_type: "Bail",
    clause_key: "",
    content: "",
    loi_reference: "",
  });
  const [isSavingClause, setIsSavingClause] = useState(false);

  // Settings tabs
  const [orangeDays, setOrangeDays] = useState("90");
  const [redDays, setRedDays] = useState("30");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // LLM Prompts tab
  const [llmPrompts, setLlmPrompts] = useState<LLMPrompt[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<LLMPrompt | null>(null);
  const [llmEditForm, setLlmEditForm] = useState<Partial<LLMPrompt>>({});
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);
  const [isTestingPrompt, setIsTestingPrompt] = useState(false);
  const [testVars, setTestVars] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);

  // RAG tab
  const [indexingStatus, setIndexingStatus] = useState<IndexingStatus | null>(null);
  const [isLoadingRag, setIsLoadingRag] = useState(false);
  const [isTriggeringIndex, setIsTriggeringIndex] = useState(false);

  const fetchStats = useCallback(async (p: Period) => {
    const token = await getAccessToken();
    if (!token) return;
    setIsLoadingStats(true);
    try {
      const res = await fetch(getApiUrl(`/api/admin/stats?period=${p}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setStats(data);
    } catch {
      // non-fatal
    } finally {
      setIsLoadingStats(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchIndexingStatus = useCallback(async () => {
    const token = await getAccessToken();
    if (!token) return;
    setIsLoadingRag(true);
    try {
      const res = await fetch(getApiUrl("/api/admin/indexing/status"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setIndexingStatus(data);
    } catch {
      // non-fatal
    } finally {
      setIsLoadingRag(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchProfileAndData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAccessToken]);

  useEffect(() => {
    if (profile?.role && ADMIN_ROLES.includes(profile.role as UserRole)) fetchStats(period);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, profile]);

  useEffect(() => {
    if (activeTab === "rag" && profile?.role && ADMIN_ROLES.includes(profile.role as UserRole)) fetchIndexingStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, profile]);

  const fetchProfileAndData = async () => {
    const token = await getAccessToken();
    if (!token) { setIsLoading(false); return; }

    try {
      const profileRes = await fetch(getApiUrl("/api/auth/profile"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileRes.json();

      if (!profileRes.ok || !profileData.success) {
        throw new Error(profileData.message || "Failed to load profile.");
      }
      setProfile(profileData.user);

      if (!ADMIN_ROLES.includes(profileData.user.role as UserRole)) { setIsLoading(false); return; }

      const [usersRes, clausesRes, settingsRes, llmRes] = await Promise.all([
        fetch(getApiUrl("/api/admin/users"), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl("/api/admin/clauses"), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl("/api/admin/settings"), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl("/api/admin/llm-prompts"), { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [usersData, clausesData, settingsData, llmData] = await Promise.all([
        usersRes.json(), clausesRes.json(), settingsRes.json(), llmRes.json(),
      ]);

      if (usersRes.ok && usersData.success) setUsers(usersData.users);
      if (clausesRes.ok && clausesData.success) setClauses(clausesData.clauses);
      if (llmRes.ok && llmData.success) setLlmPrompts(llmData.prompts ?? []);
      if (settingsRes.ok && settingsData.success) {
        const s = settingsData.settings;
        const get = (k: string) => (s as SystemSetting[]).find((x) => x.key === k)?.value;
        if (get("compliance_orange_days")) setOrangeDays(get("compliance_orange_days")!);
        if (get("compliance_red_days")) setRedDays(get("compliance_red_days")!);
        if (get("assistant_system_prompt")) setSystemPrompt(get("assistant_system_prompt")!);
      }
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Une erreur est survenue." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setMessage(null);
    const token = await getAccessToken();
    try {
      const res = await fetch(getApiUrl("/api/auth/invite"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `Invitation envoyée à ${inviteEmail} avec succès.` });
        setInviteEmail("");
        await fetchProfileAndData();
      } else throw new Error(data.message || "Failed to send invitation.");
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erreur inconnue." });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setMessage(null);
    const token = await getAccessToken();
    try {
      const res = await fetch(getApiUrl(`/api/admin/users/${userId}/role`), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Rôle mis à jour avec succès." });
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      } else throw new Error(data.message || "Failed to update role.");
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erreur inconnue." });
    }
  };

  const handleSaveClause = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingClause(true);
    setMessage(null);
    const token = await getAccessToken();
    try {
      const url = isEditingClause ? getApiUrl(`/api/admin/clauses/${isEditingClause}`) : getApiUrl("/api/admin/clauses");
      const body = isEditingClause
        ? JSON.stringify({ content: clauseForm.content, loi_reference: clauseForm.loi_reference })
        : JSON.stringify(clauseForm);
      const res = await fetch(url, {
        method: isEditingClause ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: isEditingClause ? "Clause modifiée." : "Nouvelle clause ajoutée." });
        setIsEditingClause(null);
        setClauseForm({ contract_type: "Bail", clause_key: "", content: "", loi_reference: "" });
        await fetchProfileAndData();
      } else throw new Error(data.message || "Failed to save clause.");
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erreur inconnue." });
    } finally {
      setIsSavingClause(false);
    }
  };

  const handleDeleteClause = async (clauseId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette clause ?")) return;
    setMessage(null);
    const token = await getAccessToken();
    try {
      const res = await fetch(getApiUrl(`/api/admin/clauses/${clauseId}`), {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Clause supprimée avec succès." });
        setClauses((prev) => prev.filter((c) => c.id !== clauseId));
      } else throw new Error(data.message || "Failed to delete clause.");
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erreur inconnue." });
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setMessage(null);
    const token = await getAccessToken();
    try {
      const res = await fetch(getApiUrl("/api/admin/settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          settings: [
            { key: "compliance_orange_days", value: orangeDays },
            { key: "compliance_red_days", value: redDays },
            { key: "assistant_system_prompt", value: systemPrompt },
          ],
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Paramètres enregistrés avec succès." });
      } else throw new Error(data.message || "Failed to update settings.");
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erreur inconnue." });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTriggerIndex = async (source?: string) => {
    setIsTriggeringIndex(true);
    setMessage(null);
    const token = await getAccessToken();
    try {
      const res = await fetch(getApiUrl("/api/admin/indexing/trigger"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ source }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: data.message ?? "Indexation déclenchée." });
        setTimeout(() => fetchIndexingStatus(), 2000);
      } else throw new Error(data.message || "Failed to trigger indexing.");
    } catch (err: unknown) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Erreur inconnue." });
    } finally {
      setIsTriggeringIndex(false);
    }
  };

  // ─── Nav groups ──────────────────────────────────────────────────────────────

  const escalationCount = stats?.assistant.escalations.pending ?? 0;

  const NAV_GROUPS: NavGroup[] = [
    {
      label: "Vue principale",
      items: [
        { id: "overview", label: "Vue d'ensemble", Icon: LayoutDashboard },
        { id: "users", label: "Membres & Rôles", Icon: Users, badge: users.length || undefined },
        { id: "clauses", label: "Clauses & Modèles", Icon: Edit3 },
        { id: "audit", label: "Audit trail", Icon: Activity },
      ],
    },
    {
      label: "Intelligence IA",
      items: [
        { id: "rag", label: "Corpus RAG", Icon: Database },
        { id: "llm", label: "LLM & Prompts", Icon: Cpu },
        { id: "ai", label: "Luso-Legal IA", Icon: MessageSquare, badge: escalationCount > 0 ? escalationCount : undefined },
      ],
    },
    {
      label: "Configuration",
      items: [
        { id: "compliance", label: "Compliance", Icon: Sliders },
      ],
    },
  ];

  // ─── Loading ──────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>
          Chargement du panneau d&apos;administration…
        </p>
      </div>
    );
  }

  // ─── Unauthorized ──────────────────────────────────────────────────────────────

  if (!profile?.role || !ADMIN_ROLES.includes(profile.role as UserRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="w-14 h-14 mb-4" style={{ color: "var(--status-red)" }} aria-hidden="true" />
        <h2 className="text-xl mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
          Accès restreint
        </h2>
        <p className="text-sm max-w-md" style={{ color: "var(--text-muted)" }}>
          Cette page est réservée aux Super Admins, Admins et Cabinets Avocat.
        </p>
      </div>
    );
  }

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setMessage(null);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]" style={{ background: "var(--surface-page)" }}>

      {/* ── Admin sub-sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-48 lg:shrink-0 lg:border-r lg:sticky lg:top-0 lg:h-screen"
        style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}
        aria-label="Navigation administration"
      >
        {/* Header */}
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--surface-mist)" }}>
          <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-muted)" }}>
            Backoffice
          </p>
          <p className="text-sm font-semibold mt-0.5" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
            Administration
          </p>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-2" aria-label="Sections admin">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p
                className="px-2 mb-1 text-[9px] uppercase tracking-[0.12em] font-semibold"
                style={{ color: "var(--text-muted)" }}
              >
                {group.label}
              </p>
              {group.items.map(({ id, label, Icon, badge }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => switchTab(id)}
                    aria-current={isActive ? "page" : undefined}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left text-xs transition mb-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/30"
                    style={
                      isActive
                        ? {
                            background: "rgba(212,160,23,0.12)",
                            borderLeft: "2px solid var(--brand-secondary)",
                            paddingLeft: "calc(0.625rem - 2px)",
                            color: "var(--brand-primary)",
                            fontWeight: 600,
                          }
                        : { color: "var(--text-secondary)" }
                    }
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="flex-1 min-w-0 truncate">{label}</span>
                    {badge !== undefined && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                        style={
                          id === "ai"
                            ? { background: "var(--status-red-bg)", color: "var(--status-red)" }
                            : { background: "rgba(26,58,92,0.08)", color: "var(--brand-primary)" }
                        }
                      >
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── Main area ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Admin topbar */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-3 border-b"
          style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
        >
          <div>
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Espace administrateur
            </p>
            <h1 className="text-lg font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
              {NAV_GROUPS.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label ?? "Administration"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Alert if pending escalations */}
            {escalationCount > 0 && (
              <button
                onClick={() => switchTab("ai")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--status-red)]/40"
                style={{ background: "var(--status-red-bg)", color: "var(--status-red)" }}
              >
                <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                {escalationCount} escalade{escalationCount > 1 ? "s" : ""} en attente
              </button>
            )}

            {activeTab === "overview" && (
              <PeriodFilter value={period} onChange={setPeriod} />
            )}
          </div>
        </div>

        {/* Alert banner */}
        {message && (
          <div
            className="mx-6 mt-4 p-3 rounded-lg text-sm flex gap-2 items-start border"
            style={
              message.type === "success"
                ? { background: "var(--status-green-bg)", borderColor: "var(--status-green-border)", color: "var(--status-green)" }
                : { background: "var(--status-red-bg)", borderColor: "var(--status-red-border)", color: "var(--status-red)" }
            }
            role="alert"
          >
            {message.type === "success"
              ? <Check className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 px-6 py-6 overflow-auto">

          {/* ── TAB: Overview ────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-5xl">
              {isLoadingStats ? (
                <div className="py-16 text-center text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>
                  Chargement des indicateurs…
                </div>
              ) : !stats ? (
                <div className="py-16 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  Impossible de charger les statistiques.
                </div>
              ) : (
                <>
                  {/* Row 1 — KPI cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    <KPICard
                      title="Revenus encaissés"
                      value={`€ ${(stats.payments?.totalRevenue ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}`}
                      subtitle={`${stats.payments?.paidCount ?? 0} paiements · ${stats.payments?.pendingCount ?? 0} en attente`}
                      icon={<CreditCard className="w-4 h-4" />}
                      color="default"
                    />
                    <KPICard
                      title="Nouveaux utilisateurs"
                      value={stats.users.new}
                      subtitle={`${stats.users.total} inscrits · ${stats.users.verified} vérifiés`}
                      icon={<Users className="w-4 h-4" />}
                      trend={{ delta: stats.users.new }}
                      color="blue"
                    />
                    <KPICard
                      title="NIF traités"
                      value={stats.nif.byStatus["NIF obtenu"] ?? 0}
                      subtitle={`Conversion : ${stats.nif.conversionRate}%`}
                      icon={<FileText className="w-4 h-4" />}
                      trend={{ delta: stats.nif.new, label: "nouveaux dossiers" }}
                      color="green"
                    />
                    <KPICard
                      title="Escalades avocat"
                      value={stats.assistant.escalations.pending}
                      subtitle={`${stats.assistant.escalations.assigned} assignée(s) · ${stats.assistant.escalations.closed} clôturée(s)`}
                      icon={<Bot className="w-4 h-4" />}
                      color={stats.assistant.escalations.pending > 0 ? "amber" : "green"}
                    />
                  </div>

                  {/* Row 2 — NIF pipeline + contracts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* NIF pipeline */}
                    <section
                      className="p-5 rounded-xl border shadow-[var(--shadow-card)]"
                      style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
                    >
                      <h3
                        className="text-sm font-semibold mb-4 flex items-center gap-2"
                        style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                      >
                        <TrendingUp className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
                        Pipeline NIF
                      </h3>
                      <div className="flex gap-0.5">
                        {(["pending", "En traitement", "NIF obtenu", "Notifié"] as const).map((s, i) => {
                          const count = stats.nif.byStatus[s] ?? 0;
                          const labelMap: Record<string, string> = {
                            pending: "Reçu", "En traitement": "En traitement", "NIF obtenu": "NIF obtenu", Notifié: "Notifié",
                          };
                          const bgMap: Record<string, string> = {
                            pending: "var(--surface-page)",
                            "En traitement": "var(--status-amber-bg)",
                            "NIF obtenu": "var(--status-green-bg)",
                            Notifié: "#dbeafe",
                          };
                          const textMap: Record<string, string> = {
                            pending: "var(--text-secondary)",
                            "En traitement": "var(--status-amber)",
                            "NIF obtenu": "var(--status-green)",
                            Notifié: "#1e40af",
                          };
                          const radii = ["rounded-l-lg", "", "", "rounded-r-lg"];
                          return (
                            <div
                              key={s}
                              className={`flex-1 p-3 text-center ${radii[i]}`}
                              style={{ background: bgMap[s] }}
                            >
                              <div className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: textMap[s] }}>
                                {count}
                              </div>
                              <div className="text-[9px] font-semibold mt-1 uppercase tracking-wide" style={{ color: textMap[s] }}>
                                {labelMap[s]}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Contracts breakdown */}
                    <section
                      className="p-5 rounded-xl border shadow-[var(--shadow-card)]"
                      style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
                    >
                      <h3
                        className="text-sm font-semibold mb-4 flex items-center gap-2"
                        style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                      >
                        <FileText className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
                        Contrats — {stats.contracts.total} total
                      </h3>
                      <div className="space-y-2.5">
                        {Object.entries(stats.contracts.byType).length === 0 ? (
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Aucun contrat généré.</p>
                        ) : (
                          Object.entries(stats.contracts.byType).map(([type, count]) => {
                            const total = stats.contracts.total || 1;
                            const pct = Math.round(((count as number) / total) * 100);
                            return (
                              <div key={type} className="flex items-center gap-3">
                                <div className="text-xs w-32 shrink-0 truncate" style={{ color: "var(--text-secondary)" }}>{type}</div>
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-mist)" }}>
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--brand-secondary)" }} />
                                </div>
                                <div className="text-xs font-bold w-6 text-right" style={{ color: "var(--brand-primary)" }}>{count as number}</div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Row 3 — Users by role + compliance + assistant */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Users by role */}
                    <section
                      className="p-5 rounded-xl border shadow-[var(--shadow-card)]"
                      style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
                    >
                      <h3
                        className="text-sm font-semibold mb-4 flex items-center gap-2"
                        style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                      >
                        <Users className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
                        Utilisateurs par rôle
                      </h3>
                      <div className="space-y-2.5">
                        {ALL_ROLES.map((role) => {
                          const count = stats.users.byRole[role] ?? 0;
                          const total = stats.users.total || 1;
                          const pct = Math.round((count / total) * 100);
                          return (
                            <div key={role} className="flex items-center gap-3">
                              <div className="text-xs w-28 shrink-0 truncate" style={{ color: "var(--text-secondary)" }}>{ROLE_LABELS[role]}</div>
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-mist)" }}>
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--brand-primary)" }} />
                              </div>
                              <div className="text-xs font-bold w-5 text-right" style={{ color: "var(--brand-primary)" }}>{count}</div>
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Compliance */}
                    <section
                      className="p-5 rounded-xl border shadow-[var(--shadow-card)]"
                      style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
                    >
                      <h3
                        className="text-sm font-semibold mb-4 flex items-center gap-2"
                        style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                      >
                        <ShieldCheck className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
                        Compliance — {stats.compliance.total}
                      </h3>
                      <div className="space-y-2">
                        {[
                          { label: "À jour", value: stats.compliance.green, color: "var(--status-green)", bg: "var(--status-green-bg)" },
                          { label: "Attention", value: stats.compliance.orange, color: "var(--status-amber)", bg: "var(--status-amber-bg)" },
                          { label: "Critique", value: stats.compliance.red, color: "var(--status-red)", bg: "var(--status-red-bg)" },
                        ].map(({ label, value, color, bg }) => (
                          <div
                            key={label}
                            className="flex items-center justify-between px-3 py-2 rounded-lg"
                            style={{ background: bg }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                              <span className="text-xs font-semibold" style={{ color }}>{label}</span>
                            </div>
                            <span className="text-base font-bold" style={{ fontFamily: "var(--font-serif)", color }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Assistant */}
                    <section
                      className="p-5 rounded-xl border shadow-[var(--shadow-card)]"
                      style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
                    >
                      <h3
                        className="text-sm font-semibold mb-4 flex items-center gap-2"
                        style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                      >
                        <Bot className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
                        Luso-Legal IA
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Messages", value: stats.assistant.totalMessages },
                          { label: "En attente", value: stats.assistant.escalations.pending, warn: stats.assistant.escalations.pending > 0 },
                          { label: "Clôturées", value: stats.assistant.escalations.closed },
                        ].map(({ label, value, warn }) => (
                          <div
                            key={label}
                            className="text-center p-3 rounded-lg"
                            style={{ background: "var(--surface-page)" }}
                          >
                            <div
                              className="text-xl font-bold"
                              style={{ fontFamily: "var(--font-serif)", color: warn ? "var(--status-amber)" : "var(--brand-primary)" }}
                            >
                              {value}
                            </div>
                            <div className="text-[9px] font-semibold mt-0.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                              {label}
                            </div>
                          </div>
                        ))}
                      </div>
                      {stats.assistant.escalations.pending > 0 && (
                        <button
                          onClick={() => switchTab("ai")}
                          className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold text-center transition hover:opacity-80 focus-visible:outline-none"
                          style={{ background: "var(--status-amber-bg)", color: "var(--status-amber)" }}
                        >
                          Traiter les escalades →
                        </button>
                      )}
                    </section>
                  </div>

                  {/* Row 4 — Recent actions (compact) */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3
                        className="text-sm font-semibold flex items-center gap-2"
                        style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                      >
                        <Activity className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
                        Dernières actions
                      </h3>
                      <button
                        onClick={() => switchTab("audit")}
                        className="text-xs font-semibold transition hover:opacity-70 focus-visible:outline-none"
                        style={{ color: "var(--brand-secondary)" }}
                      >
                        Voir tout →
                      </button>
                    </div>
                    <div
                      className="rounded-xl border overflow-hidden shadow-[var(--shadow-card)]"
                      style={{ borderColor: "var(--surface-mist)" }}
                    >
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b" style={{ background: "var(--surface-page)", borderColor: "var(--surface-mist)" }}>
                            {["Action", "Entité", "Utilisateur", "Date"].map((h) => (
                              <th key={h} className="p-3 font-semibold" style={{ color: "var(--brand-primary)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentActions.slice(0, 5).map((a, i) => (
                            <tr
                              key={i}
                              className="border-b hover:bg-[var(--surface-page)] transition-colors"
                              style={{ borderColor: "var(--surface-mist)" }}
                            >
                              <td className="p-3 font-mono font-semibold" style={{ color: "var(--brand-secondary)" }}>{a.action}</td>
                              <td className="p-3" style={{ color: "var(--text-secondary)" }}>{a.entity_type}</td>
                              <td className="p-3" style={{ color: "var(--text-secondary)" }}>{a.user_email}</td>
                              <td className="p-3" style={{ color: "var(--text-muted)" }}>
                                {new Date(a.timestamp).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                              </td>
                            </tr>
                          ))}
                          {stats.recentActions.length === 0 && (
                            <tr>
                              <td colSpan={4} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>
                                Aucune action enregistrée.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
            </div>
          )}

          {/* ── TAB: Users ─────────────────────────────────────────────────────── */}
          {activeTab === "users" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl">
              {/* Invite form */}
              <div
                className="lg:col-span-1 p-6 rounded-xl border h-fit"
                style={{ background: "var(--surface-page)", borderColor: "var(--surface-mist)" }}
              >
                <h3 className="text-lg mb-2 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
                  <UserPlus className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
                  Inviter un collaborateur
                </h3>
                <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>Ajoutez un nouveau membre au cabinet.</p>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: "var(--brand-primary)" }}>E-mail</label>
                    <input
                      type="email" required value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className={CLS_INPUT} style={INPUT_STYLE}
                      placeholder="avocat@easylaw.pt"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: "var(--brand-primary)" }}>Rôle</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                      className={CLS_INPUT} style={INPUT_STYLE}
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit" disabled={isInviting}
                    className={`w-full ${CLS_BTN_PRIMARY}`}
                    style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
                  >
                    {isInviting ? "Invitation…" : "Envoyer l'invitation"}
                  </button>
                </form>
              </div>

              {/* Users table */}
              <div className="lg:col-span-2">
                <h3 className="text-lg mb-4" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
                  Liste des utilisateurs
                </h3>
                <div className="rounded-xl border overflow-hidden shadow-[var(--shadow-card)]" style={{ borderColor: "var(--surface-mist)" }}>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b" style={{ background: "var(--surface-page)", borderColor: "var(--surface-mist)" }}>
                        <th className="p-3 font-semibold" style={{ color: "var(--brand-primary)" }}>Utilisateur</th>
                        <th className="p-3 font-semibold" style={{ color: "var(--brand-primary)" }}>Rôle</th>
                        <th className="p-3 font-semibold" style={{ color: "var(--brand-primary)" }}>Inscription</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>Aucun utilisateur trouvé.</td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="border-b hover:bg-[var(--surface-page)] transition-colors" style={{ borderColor: "var(--surface-mist)" }}>
                            <td className="p-3">
                              <div className="font-semibold" style={{ color: "var(--brand-primary)" }}>{u.name || "Sans nom"}</div>
                              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{u.email}</div>
                            </td>
                            <td className="p-3">
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="px-2 py-1 rounded text-xs focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45"
                                style={{ border: "1px solid var(--surface-mist)", background: "var(--surface-card)", color: "var(--brand-primary)" }}
                              >
                                {ALL_ROLES.map((r) => (
                                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 text-xs" style={{ color: "var(--text-muted)" }}>
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: Clauses ─────────────────────────────────────────────────────── */}
          {activeTab === "clauses" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-5xl">
              <div className="lg:col-span-1 p-6 rounded-xl border" style={{ background: "var(--surface-page)", borderColor: "var(--surface-mist)" }}>
                <h3 className="text-lg mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
                  <Plus className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
                  {isEditingClause ? "Modifier la clause" : "Ajouter une clause"}
                </h3>
                <form onSubmit={handleSaveClause} className="space-y-4">
                  {!isEditingClause && (
                    <>
                      <div>
                        <label className="block text-xs font-bold mb-1" style={{ color: "var(--brand-primary)" }}>Type de contrat</label>
                        <select
                          value={clauseForm.contract_type}
                          onChange={(e) => setClauseForm((p) => ({ ...p, contract_type: e.target.value }))}
                          className={CLS_INPUT} style={INPUT_STYLE}
                        >
                          <option value="Bail">Bail (Habitation)</option>
                          <option value="Travail">Contrat de Travail</option>
                          <option value="Prestation">Prestation de Services</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1" style={{ color: "var(--brand-primary)" }}>Clé unique</label>
                        <input
                          type="text" required value={clauseForm.clause_key}
                          onChange={(e) => setClauseForm((p) => ({ ...p, clause_key: e.target.value }))}
                          className={CLS_INPUT} style={INPUT_STYLE}
                          placeholder="ex: loyer, salaire, preavis"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: "var(--brand-primary)" }}>Texte de la clause</label>
                    <textarea
                      required rows={4} value={clauseForm.content}
                      onChange={(e) => setClauseForm((p) => ({ ...p, content: e.target.value }))}
                      className={CLS_INPUT} style={INPUT_STYLE}
                      placeholder="Le loyer mensuel est fixé à {loyer} EUR…"
                    />
                    <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                      Utilisez &#123;variable&#125; pour les champs dynamiques.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: "var(--brand-primary)" }}>Référence légale (optionnel)</label>
                    <input
                      type="text" value={clauseForm.loi_reference}
                      onChange={(e) => setClauseForm((p) => ({ ...p, loi_reference: e.target.value }))}
                      className={CLS_INPUT} style={INPUT_STYLE}
                      placeholder="ex: Art. 1040 du Code Civil"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit" disabled={isSavingClause}
                      className={`flex-1 ${CLS_BTN_PRIMARY}`}
                      style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
                    >
                      {isSavingClause ? "Enregistrement…" : "Enregistrer"}
                    </button>
                    {isEditingClause && (
                      <button
                        type="button"
                        onClick={() => { setIsEditingClause(null); setClauseForm({ contract_type: "Bail", clause_key: "", content: "", loi_reference: "" }); }}
                        className={CLS_BTN_OUTLINE}
                        style={{ borderColor: "var(--surface-mist)", color: "var(--text-secondary)" }}
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>Clauses actives</h3>
                {clauses.length === 0 ? (
                  <div className="text-center py-12 rounded-xl border text-sm" style={{ borderColor: "var(--surface-mist)", color: "var(--text-muted)" }}>
                    Aucune clause configurée dans la base de données.
                  </div>
                ) : (
                  clauses.map((clause) => (
                    <div
                      key={clause.id}
                      className="p-4 rounded-xl border flex justify-between gap-4 shadow-[var(--shadow-card)]"
                      style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: "rgba(212,160,23,0.10)", color: "var(--brand-secondary)" }}
                          >
                            {clause.contract_type}
                          </span>
                          <span className="font-mono text-xs font-bold" style={{ color: "var(--brand-primary)" }}>
                            {clause.clause_key}
                          </span>
                        </div>
                        <p className="text-sm italic mb-2 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                          &ldquo;{clause.content}&rdquo;
                        </p>
                        {clause.loi_reference && (
                          <div className="text-xs font-semibold" style={{ color: "var(--brand-secondary)" }}>
                            Source : {clause.loi_reference}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() => { setIsEditingClause(clause.id); setClauseForm({ contract_type: clause.contract_type, clause_key: clause.clause_key, content: clause.content, loi_reference: clause.loi_reference }); }}
                          className="p-1.5 rounded border transition hover:bg-[var(--surface-page)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45"
                          style={{ borderColor: "var(--surface-mist)", color: "var(--text-secondary)" }}
                          aria-label="Modifier cette clause"
                        >
                          <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleDeleteClause(clause.id)}
                          className="p-1.5 rounded border transition hover:bg-[var(--status-red-bg)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--status-red)]/45"
                          style={{ borderColor: "var(--status-red-border)", color: "var(--status-red)" }}
                          aria-label="Supprimer cette clause"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ── TAB: Audit trail ─────────────────────────────────────────────────── */}
          {activeTab === "audit" && (
            <div className="max-w-5xl">
              <div
                className="rounded-xl border overflow-hidden shadow-[var(--shadow-card)]"
                style={{ borderColor: "var(--surface-mist)" }}
              >
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b" style={{ background: "var(--surface-page)", borderColor: "var(--surface-mist)" }}>
                      {["Action", "Entité", "Utilisateur", "IP", "Date"].map((h) => (
                        <th key={h} className="p-3 font-semibold" style={{ color: "var(--brand-primary)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {!stats ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center animate-pulse" style={{ color: "var(--text-muted)" }}>
                          Chargement du journal…
                        </td>
                      </tr>
                    ) : stats.recentActions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center" style={{ color: "var(--text-muted)" }}>Aucune action enregistrée.</td>
                      </tr>
                    ) : (
                      stats.recentActions.map((a, i) => (
                        <tr
                          key={i}
                          className="border-b hover:bg-[var(--surface-page)] transition-colors"
                          style={{ borderColor: "var(--surface-mist)" }}
                        >
                          <td className="p-3 font-mono font-semibold" style={{ color: "var(--brand-secondary)" }}>{a.action}</td>
                          <td className="p-3" style={{ color: "var(--text-secondary)" }}>{a.entity_type}</td>
                          <td className="p-3" style={{ color: "var(--text-secondary)" }}>{a.user_email}</td>
                          <td className="p-3 font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>{a.ip_addr || "—"}</td>
                          <td className="p-3" style={{ color: "var(--text-muted)" }}>
                            {new Date(a.timestamp).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── TAB: RAG Corpus ────────────────────────────────────────────────── */}
          {activeTab === "rag" && (
            <div className="max-w-3xl space-y-6">
              {/* Summary KPIs */}
              {indexingStatus && (
                <div className="grid grid-cols-3 gap-4">
                  <div
                    className="p-4 rounded-xl border text-center shadow-[var(--shadow-card)]"
                    style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
                  >
                    <div className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
                      {indexingStatus.docCounts.reduce((s, d) => s + (d.count ?? 0), 0).toLocaleString("fr-FR")}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Chunks totaux</div>
                  </div>
                  <div
                    className="p-4 rounded-xl border text-center shadow-[var(--shadow-card)]"
                    style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
                  >
                    <div className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
                      {indexingStatus.docCounts.length}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>Sources actives</div>
                  </div>
                  <div
                    className="p-4 rounded-xl border text-center shadow-[var(--shadow-card)]"
                    style={{
                      background: indexingStatus.runs.some((r) => r.status === "running") ? "var(--status-amber-bg)" : "var(--surface-card)",
                      borderColor: indexingStatus.runs.some((r) => r.status === "running") ? "var(--status-amber-border)" : "var(--surface-mist)",
                    }}
                  >
                    <div
                      className="text-2xl font-bold mb-1"
                      style={{ fontFamily: "var(--font-serif)", color: indexingStatus.runs.some((r) => r.status === "running") ? "var(--status-amber)" : "var(--brand-primary)" }}
                    >
                      {indexingStatus.runs.filter((r) => r.status === "running").length}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>En cours</div>
                  </div>
                </div>
              )}

              {/* Source breakdown */}
              <section
                className="p-5 rounded-xl border shadow-[var(--shadow-card)]"
                style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="text-sm font-semibold flex items-center gap-2"
                    style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                  >
                    <Database className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
                    Sources indexées dans Qdrant
                  </h3>
                  <button
                    onClick={() => fetchIndexingStatus()}
                    disabled={isLoadingRag}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/30"
                    style={{ borderColor: "var(--surface-mist)", color: "var(--text-secondary)" }}
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingRag ? "animate-spin" : ""}`} aria-hidden="true" />
                    Actualiser
                  </button>
                </div>

                {isLoadingRag && !indexingStatus ? (
                  <div className="py-8 text-center text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>
                    Chargement du statut…
                  </div>
                ) : indexingStatus?.docCounts.length === 0 ? (
                  <div className="py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    Aucune source indexée. Déclenchez une première indexation.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {indexingStatus?.docCounts.map((d) => {
                      const total = indexingStatus.docCounts.reduce((s, x) => s + x.count, 0) || 1;
                      const pct = Math.round((d.count / total) * 100);
                      const color = SOURCE_COLORS[d.source] ?? "#888";
                      const isRunning = indexingStatus.runs.some((r) => r.source === d.source && r.status === "running");
                      return (
                        <div key={d.source} className="flex items-center gap-3">
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded text-white shrink-0 w-16 text-center"
                            style={{ background: color }}
                          >
                            {d.source.replace("_", " ")}
                          </span>
                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-mist)" }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                          </div>
                          <span className="text-xs font-semibold w-20 text-right shrink-0" style={{ color: "var(--brand-primary)" }}>
                            {(d.count ?? 0).toLocaleString("fr-FR")}
                          </span>
                          {isRunning && (
                            <span
                              className="text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                              style={{ background: "var(--status-amber-bg)", color: "var(--status-amber)" }}
                            >
                              En cours…
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Recent indexing runs */}
              {indexingStatus && indexingStatus.runs.length > 0 && (
                <section
                  className="p-5 rounded-xl border shadow-[var(--shadow-card)]"
                  style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
                >
                  <h3
                    className="text-sm font-semibold mb-4 flex items-center gap-2"
                    style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                  >
                    <Activity className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
                    Dernières exécutions
                  </h3>
                  <div className="space-y-2">
                    {indexingStatus.runs.slice(0, 8).map((run) => (
                      <div
                        key={run.id}
                        className="flex items-center gap-3 text-xs py-2 border-b"
                        style={{ borderColor: "var(--surface-mist)" }}
                      >
                        <span
                          className="text-[9px] px-2 py-0.5 rounded-full font-semibold shrink-0"
                          style={
                            run.status === "done"
                              ? { background: "var(--status-green-bg)", color: "var(--status-green)" }
                              : run.status === "running"
                              ? { background: "var(--status-amber-bg)", color: "var(--status-amber)" }
                              : { background: "var(--status-red-bg)", color: "var(--status-red)" }
                          }
                        >
                          {run.status}
                        </span>
                        <span
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: "var(--surface-mist)", color: "var(--brand-primary)" }}
                        >
                          {run.source ?? "ALL"}
                        </span>
                        <span style={{ color: "var(--text-secondary)" }}>
                          {(run.docs_indexed ?? 0).toLocaleString("fr-FR")} docs
                        </span>
                        {run.error_message && (
                          <span className="flex-1 truncate" style={{ color: "var(--status-red)" }}>
                            {run.error_message}
                          </span>
                        )}
                        <span className="ml-auto shrink-0" style={{ color: "var(--text-muted)" }}>
                          {new Date(run.started_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => handleTriggerIndex()}
                  disabled={isTriggeringIndex}
                  className={`flex items-center gap-2 ${CLS_BTN_PRIMARY}`}
                  style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
                >
                  <RefreshCw className={`w-4 h-4 ${isTriggeringIndex ? "animate-spin" : ""}`} aria-hidden="true" />
                  {isTriggeringIndex ? "Déclenchement…" : "Ré-indexer toutes les sources"}
                </button>
                {["DRE_I", "DRE_II", "DGSI", "CURIA", "EURLEX", "CAAD"].map((src) => (
                  <button
                    key={src}
                    onClick={() => handleTriggerIndex(src)}
                    disabled={isTriggeringIndex}
                    className={CLS_BTN_OUTLINE}
                    style={{ borderColor: SOURCE_COLORS[src] ?? "var(--surface-mist)", color: SOURCE_COLORS[src] ?? "var(--text-secondary)" }}
                  >
                    {src.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── TAB: Compliance config ─────────────────────────────────────────── */}
          {activeTab === "compliance" && (
            <form onSubmit={handleSaveSettings} className="max-w-lg space-y-6">
              <div>
                <h3 className="text-lg mb-2 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
                  <Sliders className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
                  Seuils d&apos;expiration
                </h3>
                <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
                  Configurez le code couleur des obligations selon les jours restants.
                </p>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-primary)" }}>
                    Alerte Orange — jours restants
                  </label>
                  <input
                    type="number" required value={orangeDays}
                    onChange={(e) => setOrangeDays(e.target.value)}
                    className={CLS_INPUT}
                    style={{ ...INPUT_STYLE, borderColor: "var(--status-amber-border)" }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                    En dessous de ce seuil, l&apos;obligation passe de vert à orange.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-primary)" }}>
                    Alerte Rouge — jours restants
                  </label>
                  <input
                    type="number" required value={redDays}
                    onChange={(e) => setRedDays(e.target.value)}
                    className={CLS_INPUT}
                    style={{ ...INPUT_STYLE, borderColor: "var(--status-red-border)" }}
                  />
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                    En dessous de ce seuil, l&apos;obligation passe d&apos;orange à rouge.
                  </p>
                </div>
              </div>
              <button
                type="submit" disabled={isSavingSettings}
                className={`${CLS_BTN_PRIMARY} px-6`}
                style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
              >
                {isSavingSettings ? "Enregistrement…" : "Enregistrer les seuils"}
              </button>
            </form>
          )}

          {/* ── TAB: LLM & Prompts ─────────────────────────────────────────────── */}
          {activeTab === "llm" && (
            <div className="space-y-4 max-w-3xl">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Configurez le provider et le modèle pour chaque fonction IA. Les modifications sont effectives immédiatement.
              </p>
              {llmPrompts.length === 0 ? (
                <p className="text-sm py-8 text-center animate-pulse" style={{ color: "var(--text-muted)" }}>Chargement des prompts…</p>
              ) : (
                llmPrompts.map((prompt) => {
                  const isOpen = editingPrompt?.id === prompt.id;
                  return (
                    <div key={prompt.id} className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--surface-mist)" }}>
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer"
                        style={{ background: "var(--surface-card)" }}
                        onClick={() => {
                          if (isOpen) { setEditingPrompt(null); setTestResult(null); }
                          else { setEditingPrompt(prompt); setLlmEditForm({ ...prompt }); setTestResult(null); setTestVars(""); }
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <code className="text-[11px] px-2 py-0.5 rounded font-mono shrink-0" style={{ background: "var(--surface-mist)", color: "var(--brand-primary)" }}>
                            {prompt.key}
                          </code>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate" style={{ color: "var(--brand-primary)" }}>{prompt.name}</p>
                            {prompt.description && <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{prompt.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: PROVIDER_COLORS[prompt.provider] ?? "#888" }}>
                            {prompt.provider}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full border font-mono" style={{ color: "var(--text-muted)", borderColor: "var(--surface-mist)" }}>
                            {prompt.model}
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4" style={{ color: "var(--text-muted)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
                        </div>
                      </div>

                      {isOpen && llmEditForm && (
                        <div className="border-t p-4 space-y-4" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-page)" }}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-primary)" }}>Provider</label>
                              <select
                                value={llmEditForm.provider ?? "anthropic"}
                                onChange={(e) => setLlmEditForm((f) => ({ ...f, provider: e.target.value, model: (PROVIDER_MODELS[e.target.value as LLMProvider] ?? [])[0] ?? "" }))}
                                className={CLS_INPUT} style={INPUT_STYLE}
                              >
                                {(["anthropic", "openai", "mistral", "google"] as LLMProvider[]).map((p) => (
                                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-primary)" }}>Modèle</label>
                              <select
                                value={llmEditForm.model ?? ""}
                                onChange={(e) => setLlmEditForm((f) => ({ ...f, model: e.target.value }))}
                                className={CLS_INPUT} style={INPUT_STYLE}
                              >
                                {(PROVIDER_MODELS[llmEditForm.provider as LLMProvider] ?? []).map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-primary)" }}>max_tokens</label>
                              <input type="number" min={64} max={8192} step={64}
                                value={llmEditForm.max_tokens ?? 2048}
                                onChange={(e) => setLlmEditForm((f) => ({ ...f, max_tokens: parseInt(e.target.value) }))}
                                className={CLS_INPUT} style={INPUT_STYLE}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold mb-1 flex justify-between" style={{ color: "var(--brand-primary)" }}>
                                temperature <span>{(llmEditForm.temperature ?? 0.3).toFixed(1)}</span>
                              </label>
                              <input type="range" min={0} max={1} step={0.05}
                                value={llmEditForm.temperature ?? 0.3}
                                onChange={(e) => setLlmEditForm((f) => ({ ...f, temperature: parseFloat(e.target.value) }))}
                                className="w-full"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-primary)" }}>System prompt</label>
                            <textarea rows={7} value={llmEditForm.system_prompt ?? ""}
                              onChange={(e) => setLlmEditForm((f) => ({ ...f, system_prompt: e.target.value }))}
                              className={CLS_INPUT} style={INPUT_STYLE}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold mb-1" style={{ color: "var(--brand-primary)" }}>
                              Template message utilisateur{" "}
                              <span className="font-normal" style={{ color: "var(--text-muted)" }}>
                                (optionnel — variables: {"{{query}}"}, {"{{context}}"}, {"{{sources_text}}"})
                              </span>
                            </label>
                            <textarea rows={4} value={llmEditForm.user_prompt_template ?? ""}
                              onChange={(e) => setLlmEditForm((f) => ({ ...f, user_prompt_template: e.target.value || null }))}
                              className={CLS_INPUT} style={INPUT_STYLE}
                              placeholder="Laisser vide pour utiliser le message utilisateur brut"
                            />
                          </div>

                          <div className="rounded-lg p-3 space-y-2 border" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-mist)" }}>
                            <p className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--brand-primary)" }}>
                              <FlaskConical className="w-3.5 h-3.5" /> Tester ce prompt
                            </p>
                            <input type="text" placeholder={`Variables JSON ex: {"query": "NIF Portugal"}`}
                              value={testVars}
                              onChange={(e) => setTestVars(e.target.value)}
                              className={CLS_INPUT} style={INPUT_STYLE}
                            />
                            <button type="button" disabled={isTestingPrompt}
                              onClick={async () => {
                                setIsTestingPrompt(true); setTestResult(null);
                                const token = await getAccessToken();
                                try {
                                  let vars: Record<string, string> = {};
                                  try { vars = testVars ? JSON.parse(testVars) : {}; } catch { vars = { message: testVars }; }
                                  const r = await fetch(getApiUrl(`/api/admin/llm-prompts/${prompt.id}/test`), {
                                    method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                                    body: JSON.stringify({ variables: vars }),
                                  });
                                  const d = await r.json();
                                  setTestResult(d.result ?? d.message ?? "No result");
                                } catch (e: unknown) { setTestResult("Erreur: " + (e instanceof Error ? e.message : String(e))); }
                                finally { setIsTestingPrompt(false); }
                              }}
                              className={`${CLS_BTN_OUTLINE} text-xs`}
                              style={{ color: "var(--brand-primary)", borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}
                            >
                              {isTestingPrompt ? "Appel en cours…" : "Tester (appel non-streaming)"}
                            </button>
                            {testResult && (
                              <pre className="text-[11px] p-3 rounded-lg overflow-x-auto whitespace-pre-wrap" style={{ background: "var(--surface-card)", color: "var(--text-muted)", maxHeight: 200 }}>
                                {testResult}
                              </pre>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <button type="button" disabled={isSavingPrompt}
                              onClick={async () => {
                                setIsSavingPrompt(true);
                                const token = await getAccessToken();
                                try {
                                  const r = await fetch(getApiUrl(`/api/admin/llm-prompts/${prompt.id}`), {
                                    method: "PUT", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                                    body: JSON.stringify(llmEditForm),
                                  });
                                  const d = await r.json();
                                  if (r.ok && d.success) {
                                    setLlmPrompts((prev) => prev.map((p) => p.id === prompt.id ? { ...p, ...llmEditForm } as LLMPrompt : p));
                                    setEditingPrompt(null);
                                    setMessage({ type: "success", text: `Prompt "${prompt.name}" mis à jour.` });
                                  } else {
                                    setMessage({ type: "error", text: d.message ?? "Erreur" });
                                  }
                                } catch { setMessage({ type: "error", text: "Erreur réseau." }); }
                                finally { setIsSavingPrompt(false); }
                              }}
                              className={CLS_BTN_PRIMARY}
                              style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
                            >
                              {isSavingPrompt ? "Enregistrement…" : "Enregistrer"}
                            </button>
                            <button type="button" onClick={() => { setEditingPrompt(null); setTestResult(null); }}
                              className={CLS_BTN_OUTLINE}
                              style={{ color: "var(--text-muted)", borderColor: "var(--surface-mist)" }}
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* ── TAB: Luso-Legal IA ────────────────────────────────────────────── */}
          {activeTab === "ai" && (
            <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-lg mb-2 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
                  <MessageSquare className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
                  Instructions système de l&apos;IA
                </h3>
                <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
                  Ajustez les consignes dictant le comportement de l&apos;assistant Luso-Legal.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-primary)" }}>System prompt</label>
                <textarea
                  required rows={8} value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className={CLS_INPUT} style={INPUT_STYLE}
                  placeholder="Vous êtes Luso-Legal, assistant juridique…"
                />
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                  Pour valider, posez &ldquo;qui es-tu&rdquo; sur la page /assistant après enregistrement.
                </p>
              </div>
              <button
                type="submit" disabled={isSavingSettings}
                className={`${CLS_BTN_PRIMARY} px-6`}
                style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
              >
                {isSavingSettings ? "Enregistrement…" : "Enregistrer les instructions"}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  return (
    <AuthGuard>
      <AppShell
        requireAuth={false}
        activeSection="admin"
        breadcrumb={[{ label: "Administration" }]}
      >
        <AdminPageContent />
      </AppShell>
    </AuthGuard>
  );
}
