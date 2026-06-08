"use client";

import React, { useState, useEffect } from "react";
import { Shield, ArrowLeft, Check, AlertCircle, Plus, Calendar, Bell, Mail, Clock, CheckCircle2, AlertTriangle, Trash2, Play } from "lucide-react";
import Link from "next/link";

interface ComplianceItem {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: string;
  category: string;
  user_id: string | null;
  created_at: string;
  days_left: number;
  color: "red" | "orange" | "green";
}

interface AlertLog {
  id: string;
  compliance_item_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  sent_at: string;
}

export default function ComplianceDashboard() {
  const [items, setItems] = useState<ComplianceItem[]>([]);
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const [lang, setLang] = useState<"PT" | "FR">("FR");
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newCategory, setNewCategory] = useState("Fiscal");
  const [userId, setUserId] = useState<string | null>(null);

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
      // 1. Get profile to find user_id and lang
      const profileRes = await fetch("http://localhost:3001/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileRes.json();
      let currentUserId = null;
      if (profileRes.ok && profileData.success) {
        setUserId(profileData.user.id);
        currentUserId = profileData.user.id;
        setLang(profileData.user.lang === "PT" ? "PT" : "FR");
      }

      // 2. Fetch compliance items
      await fetchItems(currentUserId);
      
      // 3. Fetch alert logs
      await fetchLogs();
    } catch (err) {
      setMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchItems = async (uId: string | null) => {
    const url = uId 
      ? `http://localhost:3001/api/compliance?user_id=${uId}` 
      : "http://localhost:3001/api/compliance";
    
    const res = await fetch(url);
    const data = await res.json();
    if (res.ok && data.success) {
      setItems(data.items);
    }
  };

  const fetchLogs = async () => {
    const res = await fetch("http://localhost:3001/api/compliance/alert-logs");
    const data = await res.json();
    if (res.ok && data.success) {
      setLogs(data.logs);
    }
  };

  const handleAddObligation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDueDate) return;

    try {
      const res = await fetch("http://localhost:3001/api/compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          due_date: newDueDate,
          category: newCategory,
          user_id: userId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setItems(prev => [data.item, ...prev].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()));
        setNewTitle("");
        setNewDesc("");
        setNewDueDate("");
        setShowAddForm(false);
        setMessage({
          type: "success",
          text: lang === "FR" ? "Obligation ajoutée avec succès !" : "Obrigação adicionada com sucesso!"
        });
      } else {
        setMessage({ type: "error", text: data.message || "Failed to add." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error occurred." });
    }
  };

  const handleToggleStatus = async (item: ComplianceItem) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    try {
      const res = await fetch(`http://localhost:3001/api/compliance/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems(prev => prev.map(i => i.id === item.id ? data.item : i));
        setMessage({
          type: "success",
          text: lang === "FR" ? "Statut mis à jour." : "Estado atualizado."
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error occurred." });
    }
  };

  const handleDeleteItem = async (id: string) => {
    const confirmDelete = window.confirm(lang === "FR" ? "Supprimer cette obligation ?" : "Eliminar esta obrigação?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://localhost:3001/api/compliance/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        setMessage({
          type: "success",
          text: lang === "FR" ? "Obligation supprimée." : "Obrigação eliminada."
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error." });
    }
  };

  const handleRunAlertsSimulation = async () => {
    setIsSimulating(true);
    setMessage(null);
    try {
      const res = await fetch("http://localhost:3001/api/compliance/simulate-alerts", {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          type: "success",
          text: lang === "FR" 
            ? `Simulation réussie ! ${data.logsGenerated} alerte(s) générée(s).` 
            : `Simulação concluída! ${data.logsGenerated} alerta(s) gerado(s).`
        });
        await fetchLogs();
      } else {
        setMessage({ type: "error", text: "Simulation failed." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setIsSimulating(false);
    }
  };

  // Group items by status colors
  const redItems = items.filter(i => i.color === "red");
  const orangeItems = items.filter(i => i.color === "orange");
  const greenItems = items.filter(i => i.color === "green");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center font-serif text-[#1A365D]">
        Loading dashboard data...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] p-4 sm:p-8 antialiased selection:bg-[#C9A84C] selection:text-white text-[#1A365D]">
      <div className="max-w-6xl mx-auto bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-6 sm:p-8 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b pb-4 border-[#E2E8F0]">
          <Link href="/profile" className="flex items-center gap-2 text-[#1A365D]">
            <Shield className="w-6 h-6 text-[#C9A84C]" />
            <span className="font-semibold text-lg font-serif">EasyLaw Compliance</span>
          </Link>
          <Link
            href="/profile"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#1A365D] hover:text-[#C9A84C] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === "FR" ? "Mon Profil" : "Meu Perfil"}</span>
          </Link>
        </div>

        {/* Status Message */}
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

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-serif text-[#1A365D] mb-1">
              {lang === "FR" ? "Tableau de bord de conformité" : "Painel de Conformidade"}
            </h1>
            <p className="text-[#64748B] text-sm">
              {lang === "FR"
                ? "Suivez vos obligations fiscales et juridiques portugaises en temps réel."
                : "Acompanhe as suas obrigações fiscais e jurídicas portuguesas em tempo real."}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="py-2 px-4 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition shadow-md hover:shadow-lg flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{lang === "FR" ? "Ajouter Obligation" : "Adicionar Obrigação"}</span>
            </button>
            
            <button
              onClick={handleRunAlertsSimulation}
              disabled={isSimulating}
              className="py-2 px-4 bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-white rounded-lg text-sm font-semibold transition shadow-md hover:shadow-lg flex items-center gap-1.5 disabled:opacity-75"
            >
              <Play className="w-4 h-4" />
              <span>{isSimulating ? "..." : (lang === "FR" ? "Simuler Alertes (07:00)" : "Simular Alertas (07:00)")}</span>
            </button>
          </div>
        </div>

        {/* Add Obligation Form */}
        {showAddForm && (
          <form onSubmit={handleAddObligation} className="mb-8 p-6 bg-[#FAFAF8] border border-[#E2E8F0] rounded-xl space-y-4">
            <h3 className="font-serif font-bold text-lg">
              {lang === "FR" ? "Nouvelle Obligation Légale" : "Nova Obrigação Legal"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Titre / Title</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Déclaration de TVA"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-[#1A365D] bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date d'échéance / Due Date</label>
                <input
                  type="date"
                  required
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-[#1A365D] bg-white"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Catégorie / Category</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-[#1A365D] bg-white"
                >
                  <option value="Fiscal">{lang === "FR" ? "Fiscal" : "Fiscal"}</option>
                  <option value="Juridique">{lang === "FR" ? "Juridique" : "Jurídico"}</option>
                  <option value="Administratif">{lang === "FR" ? "Administratif" : "Administrativo"}</option>
                  <option value="Immobilier">{lang === "FR" ? "Immobilier" : "Imobiliário"}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Optionnel"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:border-[#1A365D] bg-white"
                />
              </div>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                className="py-2 px-4 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-xs font-semibold transition"
              >
                {lang === "FR" ? "Enregistrer" : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition"
              >
                {lang === "FR" ? "Annuler" : "Cancelar"}
              </button>
            </div>
          </form>
        )}

        {/* Tri-Color Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* RED: Overdue */}
          <div className="border border-red-200 bg-red-50/30 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h4 className="font-bold text-sm uppercase tracking-wide">
                  {lang === "FR" ? "Retard / Urgent (Rouge)" : "Em Atraso (Vermelho)"}
                </h4>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {lang === "FR" ? "Obligations en retard exigeant une action immédiate." : "Obrigações atrasadas que requerem ação imediata."}
              </p>
            </div>
            <div className="text-3xl font-extrabold text-red-600">{redItems.length}</div>
          </div>

          {/* ORANGE: Near Due */}
          <div className="border border-orange-200 bg-orange-50/30 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-orange-700 mb-2">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="font-bold text-sm uppercase tracking-wide">
                  {lang === "FR" ? "Échéance Proche (Orange)" : "Prazo Próximo (Laranja)"}
                </h4>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {lang === "FR" ? "À traiter dans les 7 jours restants." : "A serem resolvidas nos próximos 7 dias."}
              </p>
            </div>
            <div className="text-3xl font-extrabold text-orange-600">{orangeItems.length}</div>
          </div>

          {/* GREEN: Completed / Safe */}
          <div className="border border-green-200 bg-green-50/30 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <h4 className="font-bold text-sm uppercase tracking-wide">
                  {lang === "FR" ? "Conforme / Sûr (Vert)" : "Conforme / Seguro (Verde)"}
                </h4>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                {lang === "FR" ? "Échéances lointaines ou terminées avec succès." : "Prazos distantes ou concluídos com sucesso."}
              </p>
            </div>
            <div className="text-3xl font-extrabold text-green-600">{greenItems.length}</div>
          </div>
        </div>

        {/* Compliance Obligations List */}
        <div className="mb-10">
          <h2 className="text-xl font-bold font-serif mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#C9A84C]" />
            <span>{lang === "FR" ? "Obligations de conformité active" : "Lista de Obrigações Ativas"}</span>
          </h2>
          
          {items.length === 0 ? (
            <div className="text-center py-10 text-gray-400 border border-dashed rounded-xl">
              {lang === "FR" ? "Aucune obligation à afficher." : "Nenhuma obrigação para exibir."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-gray-500">
                    <th className="pb-3 font-semibold">{lang === "FR" ? "Statut" : "Estado"}</th>
                    <th className="pb-3 font-semibold">{lang === "FR" ? "Obligation" : "Obrigação"}</th>
                    <th className="pb-3 font-semibold">Catégorie</th>
                    <th className="pb-3 font-semibold">{lang === "FR" ? "Échéance" : "Prazo"}</th>
                    <th className="pb-3 font-semibold">{lang === "FR" ? "Jours Restants" : "Dias Restantes"}</th>
                    <th className="pb-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center justify-center w-3 h-3 rounded-full ${
                            item.color === "red"
                              ? "bg-red-500 ring-4 ring-red-100"
                              : item.color === "orange"
                              ? "bg-orange-500 ring-4 ring-orange-100"
                              : "bg-green-500 ring-4 ring-green-100"
                          }`}
                          title={`${item.color} status`}
                        />
                      </td>
                      <td className="py-4 font-medium text-[#1A365D]">
                        <div>{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-gray-400 mt-0.5 font-normal">{item.description}</div>
                        )}
                      </td>
                      <td className="py-4 text-xs">
                        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 font-mono text-xs">{item.due_date}</td>
                      <td className="py-4">
                        {item.status === "completed" ? (
                          <span className="text-green-600 font-semibold text-xs flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            {lang === "FR" ? "Terminé" : "Concluído"}
                          </span>
                        ) : item.days_left < 0 ? (
                          <span className="text-red-600 font-bold text-xs">
                            {lang === "FR" ? `${Math.abs(item.days_left)} jours de retard` : `${Math.abs(item.days_left)} dias de atraso`}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs font-semibold">
                            {item.days_left} {lang === "FR" ? "jours restants" : "dias restantes"}
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={`p-1.5 rounded-lg border transition ${
                              item.status === "completed"
                                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}
                            title={item.status === "completed" ? "Mark incomplete" : "Mark complete"}
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg hover:bg-red-100 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Email Alerts Log Section */}
        <div className="pt-6 border-t border-[#E2E8F0]">
          <h2 className="text-xl font-bold font-serif mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#C9A84C]" />
            <span>{lang === "FR" ? "Journal des alertes simulées" : "Histórico de Alertas Simulados"}</span>
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            {lang === "FR"
              ? "Emails simulés envoyés automatiquement aux clients portugais à 07:00 pour les notifications d'échéance."
              : "E-mails simulados enviados automaticamente aos clientes portugueses às 07:00 para notificações de prazos."}
          </p>

          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border border-dashed rounded-xl bg-gray-50/50">
              {lang === "FR" ? "Aucune alerte envoyée." : "Nenhum alerta enviado."}
            </div>
          ) : (
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="p-4 bg-gray-50 border border-[#E2E8F0] rounded-xl flex gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 h-fit">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-1.5 flex-1">
                    <div className="flex justify-between items-start gap-4">
                      <span className="font-semibold text-gray-600">To: {log.recipient_email}</span>
                      <span className="text-gray-400 font-mono text-[10px]">{new Date(log.sent_at).toLocaleString()}</span>
                    </div>
                    <div className="font-bold text-[#1A365D]">{log.subject}</div>
                    <pre className="text-[11px] text-gray-500 whitespace-pre-wrap font-sans bg-white p-2.5 rounded border border-gray-100 mt-1">
                      {log.body}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
