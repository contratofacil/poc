"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { useEasyLawAuth } from "@/lib/privy";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/site/AppShell";

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

type TabType = "users" | "clauses" | "compliance" | "ai";

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

// ─── Inner content ────────────────────────────────────────────────────────────

function AdminPageContent() {
  const { getAccessToken } = useEasyLawAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Users tab
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin_cabinet" | "avocat" | "avocat_junior" | "client">("avocat");
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

  useEffect(() => {
    fetchProfileAndData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      if (profileData.user.role !== "admin_cabinet") { setIsLoading(false); return; }

      const [usersRes, clausesRes, settingsRes] = await Promise.all([
        fetch(getApiUrl("/api/admin/users"), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl("/api/admin/clauses"), { headers: { Authorization: `Bearer ${token}` } }),
        fetch(getApiUrl("/api/admin/settings"), { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [usersData, clausesData, settingsData] = await Promise.all([
        usersRes.json(), clausesRes.json(), settingsRes.json(),
      ]);

      if (usersRes.ok && usersData.success) setUsers(usersData.users);
      if (clausesRes.ok && clausesData.success) setClauses(clausesData.clauses);
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

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm animate-pulse" style={{ color: "var(--text-muted)" }}>
          Chargement du panneau d&apos;administration…
        </p>
      </div>
    );
  }

  // ─── Unauthorized ───────────────────────────────────────────────────────────

  if (profile?.role !== "admin_cabinet") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <AlertCircle className="w-14 h-14 mb-4" style={{ color: "var(--status-red)" }} aria-hidden="true" />
        <h2 className="text-xl mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
          Accès restreint
        </h2>
        <p className="text-sm max-w-md" style={{ color: "var(--text-muted)" }}>
          Cette page est réservée aux administrateurs du cabinet EasyLaw.
        </p>
      </div>
    );
  }

  // ─── Tabs definition ────────────────────────────────────────────────────────

  const TABS: { id: TabType; label: string; Icon: React.ElementType }[] = [
    { id: "users", label: "Membres & Rôles", Icon: Users },
    { id: "clauses", label: "Clauses & Modèles", Icon: Edit3 },
    { id: "compliance", label: "Configuration Compliance", Icon: Sliders },
    { id: "ai", label: "Prompt & IA", Icon: MessageSquare },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-5xl">
      {/* Hero */}
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
          Espace administrateur
        </p>
        <h1 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
          Configuration Backoffice
        </h1>
      </header>

      {/* Alert banner */}
      {message && (
        <div
          className="p-4 mb-6 rounded-lg text-sm flex gap-2 items-start border"
          style={
            message.type === "success"
              ? { background: "var(--status-green-bg)", borderColor: "var(--status-green-border)", color: "var(--status-green)" }
              : { background: "var(--status-red-bg)", borderColor: "var(--status-red-border)", color: "var(--status-red)" }
          }
          role="alert"
        >
          {message.type === "success"
            ? <Check className="w-5 h-5 shrink-0" aria-hidden="true" />
            : <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab bar */}
      <div
        className="flex gap-1 border-b mb-8 overflow-x-auto"
        style={{ borderColor: "var(--surface-mist)" }}
        role="tablist"
      >
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => { setActiveTab(id); setMessage(null); }}
              className="py-3 px-4 text-sm font-semibold transition border-b-2 flex items-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45 rounded-t-md"
              style={
                active
                  ? { borderColor: "var(--brand-secondary)", color: "var(--brand-primary)" }
                  : { borderColor: "transparent", color: "var(--text-muted)" }
              }
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: Users ─────────────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invite form */}
          <div
            className="lg:col-span-1 p-6 rounded-xl border h-fit"
            style={{ background: "var(--surface-page)", borderColor: "var(--surface-mist)" }}
          >
            <h3 className="text-lg mb-2 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
              <UserPlus className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
              Inviter un collaborateur
            </h3>
            <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
              Ajoutez un nouveau membre au cabinet.
            </p>
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
                  <option value="avocat">Avocat</option>
                  <option value="avocat_junior">Avocat Junior</option>
                  <option value="admin_cabinet">Administrateur Cabinet</option>
                  <option value="client">Client</option>
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
              Liste des Utilisateurs
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
                      <td colSpan={3} className="p-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                        Aucun utilisateur trouvé.
                      </td>
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
                            <option value="client">Client</option>
                            <option value="avocat_junior">Avocat Junior</option>
                            <option value="avocat">Avocat</option>
                            <option value="admin_cabinet">Administrateur</option>
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

      {/* ── TAB: Clauses ───────────────────────────────────────────────────────── */}
      {activeTab === "clauses" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add/edit form */}
          <div className="lg:col-span-1 p-6 rounded-xl border" style={{ background: "var(--surface-page)", borderColor: "var(--surface-mist)" }}>
            <h3 className="text-lg mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
              <Plus className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
              {isEditingClause ? "Modifier la clause" : "Ajouter une clause"}
            </h3>
            <form onSubmit={handleSaveClause} className="space-y-4">
              {!isEditingClause && (
                <>
                  <div>
                    <label className="block text-xs font-bold mb-1" style={{ color: "var(--brand-primary)" }}>Type de Contrat</label>
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

          {/* Clauses list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
              Clauses actives
            </h3>
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

      {/* ── TAB: Compliance seuils ─────────────────────────────────────────────── */}
      {activeTab === "compliance" && (
        <form onSubmit={handleSaveSettings} className="max-w-lg space-y-6">
          <div>
            <h3 className="text-lg mb-2 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
              <Sliders className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
              Seuils d&apos;expiration
            </h3>
            <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
              Configurez le code couleur des obligations des PME selon les jours restants.
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

      {/* ── TAB: AI Prompt ─────────────────────────────────────────────────────── */}
      {activeTab === "ai" && (
        <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-6">
          <div>
            <h3 className="text-lg mb-2 flex items-center gap-2" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
              <MessageSquare className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
              Instructions Système de l&apos;IA
            </h3>
            <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
              Ajustez les consignes dictant le comportement de l&apos;assistant Luso-Legal.
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--brand-primary)" }}>
              System prompt
            </label>
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
