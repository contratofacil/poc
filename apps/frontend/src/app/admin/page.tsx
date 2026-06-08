"use client";

import React, { useState, useEffect } from "react";
import { Shield, Users, Mail, UserPlus, ArrowLeft, Check, AlertCircle, Settings, Edit3, Trash2, Plus, Sliders, MessageSquare } from "lucide-react";
import Link from "next/link";

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

export default function AdminPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("users");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Users Tab state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin_cabinet" | "avocat" | "avocat_junior" | "client">("avocat");
  const [isInviting, setIsInviting] = useState(false);

  // Clauses Tab state
  const [clauses, setClauses] = useState<ClauseVersion[]>([]);
  const [isEditingClause, setIsEditingClause] = useState<string | null>(null);
  const [clauseForm, setClauseForm] = useState({
    contract_type: "Bail",
    clause_key: "",
    content: "",
    loi_reference: ""
  });
  const [isSavingClause, setIsSavingClause] = useState(false);

  // Settings states (Compliance & AI)
  const [orangeDays, setOrangeDays] = useState("90");
  const [redDays, setRedDays] = useState("30");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    fetchProfileAndData();
  }, []);

  const fetchProfileAndData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      // 1. Fetch Profile
      const profileRes = await fetch("http://localhost:3001/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profileData = await profileRes.json();

      if (!profileRes.ok || !profileData.success) {
        throw new Error(profileData.message || "Failed to load profile.");
      }

      setProfile(profileData.user);

      if (profileData.user.role !== "admin_cabinet") {
        setIsLoading(false);
        return;
      }

      // 2. Fetch Users
      const usersRes = await fetch("http://localhost:3001/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersRes.ok && usersData.success) {
        setUsers(usersData.users);
      }

      // 3. Fetch Clauses
      const clausesRes = await fetch("http://localhost:3001/api/admin/clauses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clausesData = await clausesRes.json();
      if (clausesRes.ok && clausesData.success) {
        setClauses(clausesData.clauses);
      }

      // 4. Fetch System Settings
      const settingsRes = await fetch("http://localhost:3001/api/admin/settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const settingsData = await settingsRes.json();
      if (settingsRes.ok && settingsData.success) {
        const orange = settingsData.settings.find((s: SystemSetting) => s.key === "compliance_orange_days");
        const red = settingsData.settings.find((s: SystemSetting) => s.key === "compliance_red_days");
        const prompt = settingsData.settings.find((s: SystemSetting) => s.key === "assistant_system_prompt");

        if (orange) setOrangeDays(orange.value);
        if (red) setRedDays(red.value);
        if (prompt) setSystemPrompt(prompt.value);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred while fetching system data." });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle User Invitation
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setMessage(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:3001/api/auth/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: `Invitation envoyée à ${inviteEmail} avec succès.` });
        setInviteEmail("");
        // Reload users list
        fetchProfileAndData();
      } else {
        throw new Error(data.message || "Failed to send invitation.");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsInviting(false);
    }
  };

  // Change User Role
  const handleRoleChange = async (userId: string, newRole: string) => {
    setMessage(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:3001/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Rôle mis à jour avec succès." });
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, role: newRole } : u))
        );
      } else {
        throw new Error(data.message || "Failed to update role.");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Save/Edit Contract Clause
  const handleSaveClause = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingClause(true);
    setMessage(null);
    const token = localStorage.getItem("token");

    try {
      let res;
      if (isEditingClause) {
        // Edit Clause
        res = await fetch(`http://localhost:3001/api/admin/clauses/${isEditingClause}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            content: clauseForm.content,
            loi_reference: clauseForm.loi_reference
          })
        });
      } else {
        // Create Clause
        res = await fetch("http://localhost:3001/api/admin/clauses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(clauseForm)
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: isEditingClause ? "Clause modifiée." : "Nouvelle clause ajoutée." });
        setIsEditingClause(null);
        setClauseForm({ contract_type: "Bail", clause_key: "", content: "", loi_reference: "" });
        // Reload clauses list
        fetchProfileAndData();
      } else {
        throw new Error(data.message || "Failed to save clause.");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSavingClause(false);
    }
  };

  // Delete Clause
  const handleDeleteClause = async (clauseId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette clause ?")) return;
    setMessage(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:3001/api/admin/clauses/${clauseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Clause supprimée avec succès." });
        setClauses(prev => prev.filter(c => c.id !== clauseId));
      } else {
        throw new Error(data.message || "Failed to delete clause.");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  // Save Settings (Compliance & Prompt AI)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setMessage(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:3001/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          settings: [
            { key: "compliance_orange_days", value: orangeDays },
            { key: "compliance_red_days", value: redDays },
            { key: "assistant_system_prompt", value: systemPrompt }
          ]
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: "Paramètres enregistrés avec succès." });
      } else {
        throw new Error(data.message || "Failed to update settings.");
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSavingSettings(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center font-serif text-[#1A365D]">
        Chargement du panneau d'administration...
      </div>
    );
  }

  const isAuthorized = profile?.role === "admin_cabinet";

  return (
    <main className="min-h-screen bg-[#FAFAF8] p-4 sm:p-8 antialiased selection:bg-[#C9A84C] selection:text-white">
      <div className="max-w-5xl mx-auto bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-6 sm:p-8 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b pb-4 border-[#E2E8F0]">
          <Link href="/" className="flex items-center gap-2 text-[#1A365D]">
            <Shield className="w-6 h-6 text-[#C9A84C]" />
            <span className="font-semibold text-lg font-serif">Configuration Backoffice EasyLaw</span>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-xs font-semibold text-[#1A365D] hover:text-[#C9A84C] transition">
            <ArrowLeft className="w-4 h-4" />
            <span>Retour Accueil</span>
          </Link>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-lg text-sm flex gap-2 items-start ${
            message.type === "success"
              ? "bg-green-50 border border-green-100 text-green-700"
              : "bg-red-50 border border-red-100 text-red-700"
          }`}>
            {message.type === "success" ? <Check className="w-5 h-5 shrink-0 text-green-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />}
            <span>{message.text}</span>
          </div>
        )}

        {!isAuthorized ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#1A365D] font-serif mb-2">Accès restreint</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              Cette page est réservée aux administrateurs du cabinet EasyLaw.
            </p>
            <Link href="/profile" className="inline-block py-2 px-4 bg-[#1A365D] text-white rounded-lg text-sm font-semibold hover:bg-[#1A365D]/90 transition">
              Retour à mon profil
            </Link>
          </div>
        ) : (
          <div>
            {/* Tabs Selector */}
            <div className="flex gap-2 border-b border-[#E2E8F0] mb-8 overflow-x-auto">
              <button
                onClick={() => { setActiveTab("users"); setMessage(null); }}
                className={`py-3 px-4 text-sm font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
                  activeTab === "users" ? "border-[#C9A84C] text-[#1A365D]" : "border-transparent text-gray-500 hover:text-[#1A365D]"
                }`}
              >
                <Users className="w-4 h-4" />
                Membres & Rôles
              </button>
              <button
                onClick={() => { setActiveTab("clauses"); setMessage(null); }}
                className={`py-3 px-4 text-sm font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
                  activeTab === "clauses" ? "border-[#C9A84C] text-[#1A365D]" : "border-transparent text-gray-500 hover:text-[#1A365D]"
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Clauses & Modèles
              </button>
              <button
                onClick={() => { setActiveTab("compliance"); setMessage(null); }}
                className={`py-3 px-4 text-sm font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
                  activeTab === "compliance" ? "border-[#C9A84C] text-[#1A365D]" : "border-transparent text-gray-500 hover:text-[#1A365D]"
                }`}
              >
                <Sliders className="w-4 h-4" />
                Configuration Compliance
              </button>
              <button
                onClick={() => { setActiveTab("ai"); setMessage(null); }}
                className={`py-3 px-4 text-sm font-semibold transition border-b-2 flex items-center gap-2 shrink-0 ${
                  activeTab === "ai" ? "border-[#C9A84C] text-[#1A365D]" : "border-transparent text-gray-500 hover:text-[#1A365D]"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Prompt & IA
              </button>
            </div>

            {/* TAB 1: Users & Roles */}
            {activeTab === "users" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Invite form */}
                <div className="lg:col-span-1 bg-[#FAFAF8] p-6 rounded-xl border border-[#E2E8F0] h-fit">
                  <h3 className="font-serif font-bold text-[#1A365D] text-lg mb-2 flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-[#C9A84C]" />
                    Inviter un collaborateur
                  </h3>
                  <p className="text-gray-500 text-xs mb-6">Ajoutez un nouveau membre au cabinet.</p>

                  <form onSubmit={handleInvite} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#1A365D] mb-1">E-mail</label>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A365D]/20 text-[#1A365D]"
                        placeholder="avocat@easylaw.pt"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1A365D] mb-1">Rôle</label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as any)}
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1A365D]/20 text-[#1A365D]"
                      >
                        <option value="avocat">Avocat</option>
                        <option value="avocat_junior">Avocat Junior</option>
                        <option value="admin_cabinet">Administrateur Cabinet</option>
                        <option value="client">Client</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isInviting}
                      className="w-full py-2 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition"
                    >
                      {isInviting ? "Invitation..." : "Envoyer l'invitation"}
                    </button>
                  </form>
                </div>

                {/* Users Table list */}
                <div className="lg:col-span-2">
                  <h3 className="font-serif font-bold text-[#1A365D] text-lg mb-4">Liste des Utilisateurs</h3>
                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-[#E2E8F0] text-[#1A365D] font-bold">
                          <th className="p-3">Utilisateur</th>
                          <th className="p-3">Rôle Actuel</th>
                          <th className="p-3">Date d'inscription</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u.id} className="border-b border-[#E2E8F0] text-gray-700 hover:bg-[#FAFAF8] transition">
                            <td className="p-3">
                              <div className="font-semibold text-[#1A365D]">{u.name || "Utilisateur sans nom"}</div>
                              <div className="text-xs text-gray-500">{u.email}</div>
                            </td>
                            <td className="p-3">
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                className="px-2 py-1 border border-[#E2E8F0] rounded bg-white text-xs focus:outline-none text-[#1A365D]"
                              >
                                <option value="client">Client</option>
                                <option value="avocat_junior">Avocat Junior</option>
                                <option value="avocat">Avocat</option>
                                <option value="admin_cabinet">Administrateur</option>
                              </select>
                            </td>
                            <td className="p-3 text-xs text-gray-500">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Contract Clause versions */}
            {activeTab === "clauses" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Add/Edit Form */}
                <div className="lg:col-span-1 bg-[#FAFAF8] p-6 rounded-xl border border-[#E2E8F0]">
                  <h3 className="font-serif font-bold text-[#1A365D] text-lg mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-[#C9A84C]" />
                    {isEditingClause ? "Modifier la clause" : "Ajouter une clause"}
                  </h3>

                  <form onSubmit={handleSaveClause} className="space-y-4">
                    {!isEditingClause && (
                      <>
                        <div>
                          <label className="block text-xs font-bold text-[#1A365D] mb-1">Type de Contrat</label>
                          <select
                            value={clauseForm.contract_type}
                            onChange={(e) => setClauseForm(prev => ({ ...prev, contract_type: e.target.value }))}
                            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm bg-white focus:outline-none text-[#1A365D]"
                          >
                            <option value="Bail">Bail (Habitation)</option>
                            <option value="Travail">Contrat de Travail</option>
                            <option value="Prestation">Prestation de Services</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#1A365D] mb-1">Clé unique de la clause</label>
                          <input
                            type="text"
                            required
                            value={clauseForm.clause_key}
                            onChange={(e) => setClauseForm(prev => ({ ...prev, clause_key: e.target.value }))}
                            className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none text-[#1A365D]"
                            placeholder="ex: loyer, salaire, preavis"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-[#1A365D] mb-1">Texte de la clause</label>
                      <textarea
                        required
                        rows={4}
                        value={clauseForm.content}
                        onChange={(e) => setClauseForm(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none text-[#1A365D]"
                        placeholder="Le loyer mensuel est fixé à {loyer} EUR..."
                      />
                      <p className="text-[10px] text-gray-500 mt-1">Utilisez des accolades pour les variables, ex: &#123;loyer&#125;.</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1A365D] mb-1">Référence Légale (Optionnel)</label>
                      <input
                        type="text"
                        value={clauseForm.loi_reference}
                        onChange={(e) => setClauseForm(prev => ({ ...prev, loi_reference: e.target.value }))}
                        className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none text-[#1A365D]"
                        placeholder="ex: Art. 1040 du Code Civil"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSavingClause}
                        className="flex-1 py-2 bg-[#1A365D] text-white rounded-lg text-sm font-semibold hover:bg-[#1A365D]/90 transition"
                      >
                        {isSavingClause ? "Enregistrement..." : "Enregistrer"}
                      </button>
                      {isEditingClause && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingClause(null);
                            setClauseForm({ contract_type: "Bail", clause_key: "", content: "", loi_reference: "" });
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* List of Clauses */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="font-serif font-bold text-[#1A365D] text-lg">Clauses de templates actives</h3>
                  {clauses.length === 0 ? (
                    <div className="text-center py-12 border border-[#E2E8F0] rounded-xl text-gray-400 text-sm">
                      Aucune clause configurée dans la base de données.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clauses.map(clause => (
                        <div key={clause.id} className="p-4 border border-[#E2E8F0] rounded-xl bg-white shadow-sm flex justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C9A84C]/10 text-[#C9A84C] font-semibold">{clause.contract_type}</span>
                              <span className="font-mono text-xs font-bold text-[#1A365D]">{clause.clause_key}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-2 italic">"{clause.content}"</p>
                            {clause.loi_reference && (
                              <div className="text-xs text-[#C9A84C] font-semibold">Source : {clause.loi_reference}</div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => {
                                setIsEditingClause(clause.id);
                                setClauseForm({
                                  contract_type: clause.contract_type,
                                  clause_key: clause.clause_key,
                                  content: clause.content,
                                  loi_reference: clause.loi_reference
                                });
                              }}
                              className="p-1.5 text-gray-500 hover:text-[#1A365D] border border-[#E2E8F0] rounded hover:bg-gray-50 transition"
                              title="Modifier"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClause(clause.id)}
                              className="p-1.5 text-red-500 hover:text-red-700 border border-red-100 rounded hover:bg-red-50 transition"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Compliance settings thresholds */}
            {activeTab === "compliance" && (
              <form onSubmit={handleSaveSettings} className="max-w-lg space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-[#1A365D] text-lg mb-2 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#C9A84C]" />
                    Seuils d'expiration
                  </h3>
                  <p className="text-gray-500 text-xs mb-6">Configurez le nombre de jours restants définissant le code couleur des obligations des PME.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">Alerte Orange (Jours d'échéance restants)</label>
                    <input
                      type="number"
                      required
                      value={orangeDays}
                      onChange={(e) => setOrangeDays(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A365D]/20 text-[#1A365D]"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Si le délai est inférieur à ce seuil, la tâche passera de VERT à ORANGE (Alerte préventive).</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">Alerte Rouge (Jours d'échéance restants)</label>
                    <input
                      type="number"
                      required
                      value={redDays}
                      onChange={(e) => setRedDays(e.target.value)}
                      className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A365D]/20 text-[#1A365D]"
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Si le délai est inférieur à ce seuil, la tâche passera de ORANGE à ROUGE (Alerte critique).</p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="py-2.5 px-6 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition"
                >
                  {isSavingSettings ? "Enregistrement..." : "Enregistrer les seuils"}
                </button>
              </form>
            )}

            {/* TAB 4: Prompt AI assistant */}
            {activeTab === "ai" && (
              <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-6">
                <div>
                  <h3 className="font-serif font-bold text-[#1A365D] text-lg mb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#C9A84C]" />
                    Instructions Système de l'IA (System Prompt)
                  </h3>
                  <p className="text-gray-500 text-xs mb-6">Ajustez les consignes système dictant le comportement et la personnalité de l'assistant juridique Luso-Legal.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">Invite système (Prompt)</label>
                  <textarea
                    required
                    rows={8}
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A365D]/20 text-[#1A365D]"
                    placeholder="Vous êtes Luso-Legal, assistant juridique..."
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Pour valider que la modification est bien prise en compte, vous pouvez demander 'qui es-tu' ou 'consignes' à l'IA sur la page `/assistant` après enregistrement.</p>
                </div>

                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="py-2.5 px-6 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition"
                >
                  {isSavingSettings ? "Enregistrement..." : "Enregistrer les instructions"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
