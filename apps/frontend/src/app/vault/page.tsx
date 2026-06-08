"use client";

import React, { useState, useEffect } from "react";
import { Shield, Globe, FileText, Download, Clock, ShieldAlert, Loader2, Lock, ListFilter } from "lucide-react";
import Link from "next/link";

interface VaultDocument {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  url: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_addr: string;
  user_agent: string;
  timestamp: string;
}

export default function VaultPage() {
  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    setToken(savedToken);

    if (savedToken) {
      fetchUserDataAndVault(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserDataAndVault = async (authToken: string) => {
    try {
      // 1. Fetch user role
      const profileRes = await fetch("http://localhost:3001/api/auth/profile", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      let role = "client";
      if (profileRes.ok) {
        const data = await profileRes.json();
        if (data.success && data.user) {
          role = data.user.role;
          setUserRole(role);
        }
      }

      // 2. Fetch documents
      const docsRes = await fetch("http://localhost:3001/api/vault/documents", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (docsRes.ok) {
        const data = await docsRes.json();
        if (data.success && data.documents) {
          setDocuments(data.documents);
        }
      }

      // 3. Fetch audit trail if admin
      if (role === "admin_cabinet") {
        const auditRes = await fetch("http://localhost:3001/api/vault/audit", {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        if (auditRes.ok) {
          const data = await auditRes.json();
          if (data.success && data.auditLogs) {
            setAuditLogs(data.auditLogs);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load vault data.");
    } finally {
      setIsLoading(false);
    }
  };

  const t = {
    FR: {
      title: "Coffre-Fort Sécurisé",
      subtitle: "Accédez à vos documents certifiés et gardés en toute sécurité.",
      docsTitle: "Vos documents",
      auditTitle: "Journal d'audit (Cabinet Admins)",
      noDocs: "Aucun document dans votre coffre-fort pour le moment.",
      loginRequired: "Veuillez vous connecter pour accéder à votre coffre-fort.",
      loginBtn: "Se connecter",
      colName: "Nom",
      colType: "Type",
      colStatus: "Statut",
      colDate: "Créé le",
      actionDownload: "Télécharger",
      auditAction: "Action",
      auditUser: "Utilisateur",
      auditEntity: "Entité",
      auditIP: "Adresse IP",
      auditDate: "Date/Heure",
      badgeVerified: "Sécurisé",
    },
    PT: {
      title: "Cofre-Forte Seguro",
      subtitle: "Aceda aos seus documentos certificados e guardados em total segurança.",
      docsTitle: "Os seus documentos",
      auditTitle: "Registo de auditoria (Cabinet Admins)",
      noDocs: "Nenhum documento no seu cofre-forte de momento.",
      loginRequired: "Por favor, inicie sessão para aceder ao seu cofre-forte.",
      loginBtn: "Entrar",
      colName: "Nome",
      colType: "Tipo",
      colStatus: "Estado",
      colDate: "Criado em",
      actionDownload: "Descarregar",
      auditAction: "Ação",
      auditUser: "Utilizador",
      auditEntity: "Entidade",
      auditIP: "Endereço IP",
      auditDate: "Data/Hora",
      badgeVerified: "Seguro",
    }
  }[lang];

  return (
    <main className="min-h-screen bg-[#FAFAF8] flex flex-col antialiased selection:bg-[#C9A84C] selection:text-white">
      {/* Header */}
      <header className="w-full bg-white border-b border-[#E2E8F0] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-[#1A365D]">
            <Shield className="w-6 h-6 text-[#C9A84C]" />
            <span className="font-semibold text-lg font-serif">EasyLaw</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/contracts" className="text-sm font-semibold text-[#1A365D] hover:text-[#C9A84C] transition">
              Contrats
            </Link>
            <button
              onClick={() => setLang(lang === "FR" ? "PT" : "FR")}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2E8F0] text-sm text-[#1A365D] hover:bg-[#FAFAF8] transition"
            >
              <Globe className="w-4 h-4 text-[#C9A84C]" />
              <span className="font-semibold">{lang}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-[#1A365D] font-serif mb-2">{t.title}</h1>
          <p className="text-gray-600 text-sm max-w-md mx-auto">{t.subtitle}</p>
        </div>

        {!token ? (
          <div className="max-w-md mx-auto bg-white border border-[#E2E8F0] shadow-lg rounded-2xl p-8 text-center">
            <Lock className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
            <p className="text-gray-600 text-sm mb-6">{t.loginRequired}</p>
            <Link
              href="/login"
              className="inline-block py-2.5 px-6 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition shadow-md"
            >
              {t.loginBtn}
            </Link>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin mb-4" />
            <p className="text-gray-500 text-sm">Chargement du coffre-fort...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Documents section */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-[#1A365D] font-serif mb-6 flex items-center gap-2 border-b border-[#E2E8F0] pb-4">
                <FileText className="w-5 h-5 text-[#C9A84C]" />
                <span>{t.docsTitle}</span>
              </h2>

              {documents.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">{t.noDocs}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-[#E2E8F0] text-gray-400 font-bold">
                        <th className="pb-3 pr-4">{t.colName}</th>
                        <th className="pb-3 pr-4">{t.colType}</th>
                        <th className="pb-3 pr-4">{t.colStatus}</th>
                        <th className="pb-3 pr-4">{t.colDate}</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="text-[#1A365D] hover:bg-[#FAFAF8] transition">
                          <td className="py-4 pr-4 font-semibold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#C9A84C] shrink-0" />
                            <span className="truncate max-w-[200px] md:max-w-xs">{doc.name}</span>
                          </td>
                          <td className="py-4 pr-4 font-medium uppercase text-gray-500">{doc.type}</td>
                          <td className="py-4 pr-4">
                            <span className="bg-green-50 text-green-700 text-xs px-2.5 py-0.5 rounded-full font-bold border border-green-100">
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-4 pr-4 text-gray-400 font-mono text-xs">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 text-right">
                            <a
                              href={`http://localhost:3001${doc.url}`}
                              download
                              className="inline-flex items-center gap-1 py-1.5 px-3 bg-[#1A365D] hover:bg-[#1A365D]/95 text-white font-semibold text-xs rounded-lg transition shadow-sm"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>{t.actionDownload}</span>
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Admin Audit Trail Panel */}
            {userRole === "admin_cabinet" && (
              <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-bold text-[#1A365D] font-serif mb-6 flex items-center gap-2 border-b border-[#E2E8F0] pb-4">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  <span>{t.auditTitle}</span>
                </h2>

                {auditLogs.length === 0 ? (
                  <p className="text-gray-500 text-sm py-8 text-center">Aucune trace d'audit trouvée.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] text-gray-400 font-bold uppercase tracking-wider">
                          <th className="pb-3 pr-4">{t.auditDate}</th>
                          <th className="pb-3 pr-4">{t.auditAction}</th>
                          <th className="pb-3 pr-4">{t.auditUser}</th>
                          <th className="pb-3 pr-4">{t.auditEntity}</th>
                          <th className="pb-3 pr-4">{t.auditIP}</th>
                          <th className="pb-3">User Agent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {auditLogs.map((log) => (
                          <tr key={log.id} className="text-gray-600 hover:bg-[#FAFAF8] transition font-mono">
                            <td className="py-3 pr-4 whitespace-nowrap text-gray-400">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 pr-4">
                              <span className="bg-slate-100 text-[#1A365D] px-2 py-0.5 rounded font-bold">
                                {log.action}
                              </span>
                            </td>
                            <td className="py-3 pr-4 text-[#1A365D] font-medium truncate max-w-[120px]">
                              {log.user_id || "Anonymous"}
                            </td>
                            <td className="py-3 pr-4 whitespace-nowrap">
                              {log.entity_type} ({log.entity_id?.slice(0, 8)})
                            </td>
                            <td className="py-3 pr-4 text-[#C9A84C] font-semibold">{log.ip_addr}</td>
                            <td className="py-3 max-w-xs truncate text-gray-400" title={log.user_agent}>
                              {log.user_agent}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
