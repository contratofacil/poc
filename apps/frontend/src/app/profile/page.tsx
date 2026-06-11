"use client";

import React, { useState, useEffect } from "react";
import {
  User, Mail, Globe, Download, Trash2, LogOut,
  Check, AlertCircle, Pencil, Shield, Calendar,
  Lock, ChevronRight, Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEasyLawAuth } from "@/lib/privy";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { apiFetch } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  lang: string;
  is_verified: number;
  created_at: string;
}

// ─── Role display config ──────────────────────────────────────────────────────

const ROLE_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  super_admin:    { label: "Super Administrateur", bg: "rgba(220,38,38,0.08)",   text: "#dc2626", border: "rgba(220,38,38,0.2)" },
  admin:          { label: "Administrateur",        bg: "rgba(79,70,229,0.08)",  text: "#4f46e5", border: "rgba(79,70,229,0.2)" },
  cabinet_avocat: { label: "Cabinet Avocat",         bg: "rgba(26,58,92,0.10)",  text: "#1a3a5c", border: "rgba(26,58,92,0.25)" },
  avocat:         { label: "Avocat",                 bg: "rgba(180,83,9,0.08)",  text: "#b45309", border: "rgba(180,83,9,0.2)" },
  avocat_associe: { label: "Avocat Associé",         bg: "rgba(146,64,14,0.08)", text: "#92400e", border: "rgba(146,64,14,0.2)" },
  juriste:        { label: "Juriste",                bg: "rgba(5,150,105,0.08)", text: "#065f46", border: "rgba(5,150,105,0.2)" },
  salarie:        { label: "Salarié",                bg: "rgba(100,116,139,0.08)", text: "#475569", border: "rgba(100,116,139,0.2)" },
  assistant:      { label: "Assistant",              bg: "rgba(100,116,139,0.06)", text: "#64748b", border: "rgba(100,116,139,0.15)" },
};

const LANG_OPTIONS = [
  { value: "FR", label: "Français", flag: "🇫🇷" },
  { value: "PT", label: "Português", flag: "🇵🇹" },
  { value: "EN", label: "English",   flag: "🇬🇧" },
];

function getRoleConfig(role: string) {
  return ROLE_CONFIG[role] ?? { label: role, bg: "rgba(100,116,139,0.08)", text: "#475569", border: "rgba(100,116,139,0.2)" };
}

function getInitials(name: string | null, email: string) {
  if (name && name.trim()) {
    return name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function formatDate(iso: string, lang: string) {
  try {
    return new Date(iso).toLocaleDateString(lang === "FR" ? "fr-FR" : lang === "PT" ? "pt-PT" : "en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

function ProfileContent() {
  const router = useRouter();
  const { logout, getAccessToken } = useEasyLawAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName]         = useState("");
  const [lang, setLang]         = useState<"PT" | "FR" | "EN">("FR");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting]   = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ── Fetch profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) { setIsLoading(false); return; }
        const res = await apiFetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!cancelled && res.ok && data.success) {
          setProfile(data.user);
          setName(data.user.name ?? "");
          const l = data.user.lang?.toUpperCase();
          setLang(l === "PT" || l === "EN" ? l : "FR");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [getAccessToken]);

  // ── Save changes ─────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const token = await getAccessToken();
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: name.trim(), lang }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.user);
        setEditingName(false);
        setMessage({ type: "success", text: "Profil mis à jour avec succès." });
      } else {
        setMessage({ type: "error", text: data.message ?? "Échec de la mise à jour." });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
    } finally {
      setIsSaving(false);
    }
  };

  // ── Export data ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      const token = await getAccessToken();
      const res = await apiFetch("/api/auth/profile/export", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const blob = new Blob([JSON.stringify(data.exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `easylaw_export_${profile?.id ?? "user"}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setMessage({ type: "success", text: "Données exportées avec succès." });
      }
    } catch {
      setMessage({ type: "error", text: "Erreur lors de l'export." });
    } finally {
      setIsExporting(false);
    }
  };

  // ── Delete account ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (deleteConfirmText !== "SUPPRIMER") return;
    setIsDeleting(true);
    try {
      const token = await getAccessToken();
      const res = await apiFetch("/api/auth/profile", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        logout();
        router.push("/");
      } else {
        setMessage({ type: "error", text: data.message ?? "Échec de la suppression." });
        setShowDeleteModal(false);
      }
    } catch {
      setMessage({ type: "error", text: "Erreur réseau." });
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Handle logout ────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-page)" }}>
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand-primary)" }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--surface-page)" }}>
        <AlertCircle className="w-10 h-10" style={{ color: "var(--status-red)" }} />
        <p style={{ color: "var(--text-secondary)" }}>Impossible de charger votre profil.</p>
        <button onClick={handleLogout} className="text-sm underline" style={{ color: "var(--brand-primary)" }}>
          Se déconnecter
        </button>
      </div>
    );
  }

  const roleConf = getRoleConfig(profile.role);
  const initials = getInitials(profile.name, profile.email);

  return (
    <div className="min-h-screen" style={{ background: "var(--surface-page)" }}>

      {/* ── Top bar ────────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/contracts" className="flex items-center gap-2">
            <Shield className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} />
            <span className="font-semibold text-base" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
              EasyLaw
            </span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition hover:opacity-80"
            style={{ borderColor: "var(--surface-mist)", color: "var(--text-secondary)", background: "var(--surface-page)" }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Se déconnecter
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Feedback banner ──────────────────────────────────────────────────── */}
        {message && (
          <div
            className="mb-6 p-4 rounded-xl border flex items-start gap-3 text-sm"
            style={
              message.type === "success"
                ? { background: "var(--status-green-bg)", borderColor: "var(--status-green)", color: "var(--status-green)" }
                : { background: "var(--status-red-bg)", borderColor: "var(--status-red)", color: "var(--status-red)" }
            }
          >
            {message.type === "success"
              ? <Check className="w-4 h-4 mt-0.5 shrink-0" />
              : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto opacity-60 hover:opacity-100 transition shrink-0"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── LEFT: Identity card ─────────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Avatar card */}
            <div
              className="rounded-2xl border p-6 flex flex-col items-center text-center shadow-[var(--shadow-card)]"
              style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
            >
              {/* Avatar circle */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-4 shadow-md"
                style={{ background: "var(--brand-primary)", color: "var(--brand-secondary)", fontFamily: "var(--font-serif)" }}
              >
                {initials}
              </div>

              {/* Name */}
              <h1
                className="text-lg font-bold mb-1 leading-tight"
                style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
              >
                {profile.name || "Sans nom"}
              </h1>

              {/* Email */}
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                {profile.email}
              </p>

              {/* Role badge */}
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                style={{ background: roleConf.bg, color: roleConf.text, borderColor: roleConf.border }}
              >
                <Shield className="w-3 h-3" />
                {roleConf.label}
              </span>

              {/* Verification badge */}
              <div className="mt-4 flex items-center gap-1.5">
                {profile.is_verified ? (
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--status-green)" }}>
                    <Check className="w-3.5 h-3.5" />
                    Compte vérifié
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--status-amber)" }}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Non vérifié
                  </span>
                )}
              </div>
            </div>

            {/* Meta info */}
            <div
              className="rounded-xl border p-4 space-y-3 shadow-[var(--shadow-card)]"
              style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
            >
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-secondary)" }} />
                <span>Membre depuis le <span className="font-medium" style={{ color: "var(--text-primary)" }}>{formatDate(profile.created_at, lang)}</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                <Globe className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-secondary)" }} />
                <span>Langue : <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {LANG_OPTIONS.find((l) => l.value === lang)?.label ?? lang}
                </span></span>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--brand-secondary)" }} />
                <span>ID : <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>{profile.id.slice(0, 12)}…</span></span>
              </div>
            </div>

            {/* Quick actions */}
            <div
              className="rounded-xl border overflow-hidden shadow-[var(--shadow-card)]"
              style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
            >
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[var(--surface-page)] transition border-b disabled:opacity-60"
                style={{ borderColor: "var(--surface-mist)", color: "var(--text-secondary)" }}
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>Exporter mes données</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[var(--surface-page)] transition"
                style={{ color: "var(--text-secondary)" }}
              >
                <LogOut className="w-4 h-4" />
                <span>Se déconnecter</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
              </button>
            </div>
          </div>

          {/* ── RIGHT: Edit forms ────────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Personal info form */}
            <section
              className="rounded-2xl border shadow-[var(--shadow-card)]"
              style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
            >
              <div
                className="px-6 py-4 border-b flex items-center justify-between"
                style={{ borderColor: "var(--surface-mist)" }}
              >
                <div>
                  <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
                    Informations personnelles
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    Mettez à jour votre nom et vos préférences de langue.
                  </p>
                </div>
                {!editingName && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition hover:opacity-80"
                    style={{ borderColor: "var(--surface-mist)", color: "var(--brand-primary)", background: "var(--surface-page)" }}
                  >
                    <Pencil className="w-3 h-3" />
                    Modifier
                  </button>
                )}
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-5">

                {/* Email (read-only) */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--brand-primary)" }}>
                    Adresse e-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      disabled
                      value={profile.email}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm"
                      style={{
                        background: "var(--surface-page)",
                        border: "1px solid var(--surface-mist)",
                        color: "var(--text-muted)",
                      }}
                    />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                    L'adresse e-mail ne peut pas être modifiée.
                  </p>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--brand-primary)" }}>
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: editingName ? "var(--brand-primary)" : "var(--text-muted)" }} />
                    <input
                      type="text"
                      required
                      disabled={!editingName}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Votre nom complet"
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm transition"
                      style={{
                        background: editingName ? "var(--surface-card)" : "var(--surface-page)",
                        border: `1px solid ${editingName ? "var(--brand-primary)" : "var(--surface-mist)"}`,
                        color: "var(--text-primary)",
                        outline: "none",
                        boxShadow: editingName ? "0 0 0 3px var(--brand-primary)22" : "none",
                      }}
                    />
                  </div>
                </div>

                {/* Role (read-only) */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--brand-primary)" }}>
                    Rôle
                  </label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      disabled
                      value={roleConf.label}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm"
                      style={{
                        background: "var(--surface-page)",
                        border: "1px solid var(--surface-mist)",
                        color: roleConf.text,
                        fontWeight: 600,
                      }}
                    />
                  </div>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                    Le rôle est géré par un administrateur.
                  </p>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "var(--brand-primary)" }}>
                    Langue d'interface
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {LANG_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={!editingName}
                        onClick={() => setLang(opt.value as "PT" | "FR" | "EN")}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition"
                        style={
                          lang === opt.value
                            ? {
                                background: "rgba(26,58,92,0.06)",
                                borderColor: "var(--brand-primary)",
                                color: "var(--brand-primary)",
                                fontWeight: 700,
                              }
                            : {
                                background: "var(--surface-page)",
                                borderColor: "var(--surface-mist)",
                                color: "var(--text-secondary)",
                                opacity: editingName ? 1 : 0.6,
                              }
                        }
                      >
                        <span className="text-base">{opt.flag}</span>
                        <span className="text-xs">{opt.label}</span>
                        {lang === opt.value && <Check className="w-3 h-3 ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                {editingName && (
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSaving || !name.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition disabled:opacity-60"
                      style={{
                        background: "var(--brand-primary)",
                        color: "var(--text-inverse)",
                      }}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {isSaving ? "Enregistrement…" : "Enregistrer"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingName(false);
                        setName(profile.name ?? "");
                        setLang((profile.lang?.toUpperCase() as "PT" | "FR" | "EN") ?? "FR");
                      }}
                      className="py-2.5 px-4 rounded-lg text-sm font-semibold border transition hover:opacity-80"
                      style={{
                        borderColor: "var(--surface-mist)",
                        color: "var(--text-secondary)",
                        background: "var(--surface-page)",
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                )}
              </form>
            </section>

            {/* Security section */}
            <section
              className="rounded-2xl border shadow-[var(--shadow-card)]"
              style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
            >
              <div className="px-6 py-4 border-b" style={{ borderColor: "var(--surface-mist)" }}>
                <h2 className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
                  Sécurité & Connexion
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Gérez vos sessions et accès à votre compte.
                </p>
              </div>
              <div className="p-6 space-y-3">
                <div
                  className="flex items-center justify-between p-3 rounded-lg border"
                  style={{ borderColor: "var(--surface-mist)", background: "var(--surface-page)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "var(--status-green-bg)" }}
                    >
                      <Check className="w-4 h-4" style={{ color: "var(--status-green)" }} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Session active</p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Connecté via EasyLaw</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition hover:opacity-80"
                    style={{
                      borderColor: "var(--surface-mist)",
                      color: "var(--text-secondary)",
                      background: "var(--surface-card)",
                    }}
                  >
                    Déconnecter
                  </button>
                </div>
              </div>
            </section>

            {/* Danger zone */}
            <section
              className="rounded-2xl border shadow-[var(--shadow-card)]"
              style={{ background: "var(--surface-card)", borderColor: "rgba(220,38,38,0.2)" }}
            >
              <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(220,38,38,0.15)" }}>
                <h2 className="text-sm font-semibold" style={{ color: "#dc2626" }}>
                  Zone de danger
                </h2>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  Ces actions sont irréversibles. Procédez avec précaution.
                </p>
              </div>
              <div className="p-6">
                <div
                  className="flex items-start justify-between gap-4 p-4 rounded-xl border"
                  style={{ borderColor: "rgba(220,38,38,0.15)", background: "rgba(220,38,38,0.03)" }}
                >
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#dc2626" }}>Supprimer mon compte</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Toutes vos données personnelles, dossiers et historiques seront définitivement supprimés.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="flex items-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition shrink-0 hover:opacity-80"
                    style={{
                      borderColor: "rgba(220,38,38,0.3)",
                      color: "#dc2626",
                      background: "rgba(220,38,38,0.06)",
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Supprimer
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* ── Delete confirmation modal ─────────────────────────────────────────── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="w-full max-w-md rounded-2xl border shadow-[var(--shadow-modal)] p-6"
            style={{ background: "var(--surface-card)", borderColor: "rgba(220,38,38,0.3)" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(220,38,38,0.1)" }}
            >
              <Trash2 className="w-6 h-6" style={{ color: "#dc2626" }} />
            </div>
            <h3
              className="text-center text-lg font-bold mb-2"
              style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
            >
              Supprimer le compte
            </h3>
            <p className="text-center text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              Cette action est irréversible. Tapez <strong style={{ color: "#dc2626" }}>SUPPRIMER</strong> pour confirmer.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full px-4 py-2.5 rounded-lg text-sm mb-4 text-center font-mono"
              style={{
                border: "1px solid rgba(220,38,38,0.3)",
                background: "var(--surface-page)",
                color: "var(--text-primary)",
                outline: "none",
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(""); }}
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold border transition hover:opacity-80"
                style={{ borderColor: "var(--surface-mist)", color: "var(--text-secondary)", background: "var(--surface-page)" }}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmText !== "SUPPRIMER" || isDeleting}
                className="flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-40"
                style={{ background: "#dc2626", color: "#fff" }}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {isDeleting ? "Suppression…" : "Confirmer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
