"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Shield, User, Globe, Download, Trash2, ArrowLeft, Check, AlertCircle, FileText, Loader2, Plus, X } from "lucide-react";
import Link from "next/link";
import { useEasyLawAuth } from "@/lib/privy";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { apiFetch } from "@/lib/api";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  lang: string;
  is_verified: number;
  created_at: string;
}

function ProfileContent() {
  const { logout, getAccessToken } = useEasyLawAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [lang, setLang] = useState<"PT" | "FR">("PT");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      try {
        const token = await getAccessToken();
        const res = await apiFetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setProfile(data.user);
          setName(data.user.name || "");
          setLang(data.user.lang === "FR" ? "FR" : "PT");
        } else {
          setMessage({ type: "error", text: data.message || "Failed to load profile." });
        }
      } catch (err) {
        setMessage({ type: "error", text: "Network error occurred while fetching profile." });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [getAccessToken]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const token = await getAccessToken();
      const res = await apiFetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, lang }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProfile(data.user);
        setMessage({ type: "success", text: lang === "FR" ? "Profil mis à jour avec succès." : "Perfil atualizado com sucesso." });
      } else {
        setMessage({ type: "error", text: data.message || "Update failed." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setIsSaving(false);
    }
  };

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
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data.exportData, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `personal_data_export_${profile?.id || "user"}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setMessage({ type: "success", text: lang === "FR" ? "Données exportées avec succès." : "Dados exportados com sucesso." });
      } else {
        setMessage({ type: "error", text: data.message || "Export failed." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      lang === "FR"
        ? "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible."
        : "Tem a certeza que deseja eliminar a sua conta? Esta ação é irreversível."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setMessage(null);

    try {
      const token = await getAccessToken();
      const res = await apiFetch("/api/auth/profile", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(lang === "FR" ? "Votre compte a été supprimé." : "A sua conta foi eliminada.");
        logout();
      } else {
        setMessage({ type: "error", text: data.message || "Deletion failed." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center font-serif text-[#1A365D]">
        Loading profile...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] p-4 sm:p-8 antialiased selection:bg-[#C9A84C] selection:text-white">
      <div className="max-w-2xl mx-auto bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-6 sm:p-8 relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b pb-4 border-[#E2E8F0]">
          <Link href="/" className="flex items-center gap-2 text-[#1A365D]">
            <Shield className="w-6 h-6 text-[#C9A84C]" />
            <span className="font-semibold text-lg font-serif">EasyLaw</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1A365D] hover:text-[#C9A84C] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === "FR" ? "Retour" : "Voltar"}</span>
          </Link>
        </div>

        {message && (
          <div
            className={`p-4 mb-6 rounded-lg text-sm flex gap-2 items-start ${
              message.type === "success"
                ? "bg-green-50 border border-green-100 text-green-700"
                : "bg-red-50 border border-red-100 text-red-700"
            }`}
          >
            {message.type === "success" ? (
              <Check className="w-5 h-5 shrink-0 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1A365D] font-serif mb-1">
            {lang === "FR" ? "Paramètres du profil" : "Configurações do perfil"}
          </h1>
          <p className="text-[#64748B] text-sm">
            {lang === "FR"
              ? "Gérez vos informations personnelles et vos préférences de langue."
              : "Gerencie as suas informações pessoais e preferências de idioma."}
          </p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Email (Read-Only) */}
          <div>
            <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">
              {lang === "FR" ? "Adresse e-mail (non modifiable)" : "Endereço de e-mail (não editável)"}
            </label>
            <input
              type="text"
              disabled
              value={profile?.email || ""}
              className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] bg-gray-50 text-gray-500 text-sm focus:outline-none"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">
              {lang === "FR" ? "Nom complet" : "Nome completo"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#1A365D]/20 focus:border-[#1A365D] text-sm transition focus:outline-none"
                placeholder="Lucas Silva"
              />
            </div>
          </div>

          {/* Language preference */}
          <div>
            <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">
              {lang === "FR" ? "Préférence de langue" : "Preferência de idioma"}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input
                  type="radio"
                  name="lang"
                  value="PT"
                  checked={lang === "PT"}
                  onChange={() => setLang("PT")}
                  className="accent-[#C9A84C]"
                />
                PT (Português)
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input
                  type="radio"
                  name="lang"
                  value="FR"
                  checked={lang === "FR"}
                  onChange={() => setLang("FR")}
                  className="accent-[#C9A84C]"
                />
                FR (Français)
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#E2E8F0] flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-2.5 px-4 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition shadow-md hover:shadow-lg disabled:opacity-75"
            >
              {isSaving
                ? (lang === "FR" ? "Enregistrement..." : "A guardar...")
                : (lang === "FR" ? "Enregistrer les modifications" : "Guardar alterações")}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-75"
            >
              <Download className="w-4 h-4" />
              <span>{lang === "FR" ? "Exporter mes données" : "Exportar meus dados"}</span>
            </button>
          </div>
        </form>

        {/* Danger zone */}
        <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
          <h3 className="text-red-700 font-serif font-bold text-base mb-2">
            {lang === "FR" ? "Zone de danger" : "Zona de perigo"}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {lang === "FR"
              ? "Une fois votre compte supprimé, vos données personnelles et historiques seront archivés/supprimés définitivement."
              : "Depois de eliminar a sua conta, os seus dados pessoais e histórico serão arquivados/eliminados permanentemente."}
          </p>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="py-2 px-4 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-sm font-semibold transition flex items-center gap-2 disabled:opacity-75"
          >
            <Trash2 className="w-4 h-4" />
            <span>{lang === "FR" ? "Demander la suppression du compte" : "Solicitar eliminação da conta"}</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
