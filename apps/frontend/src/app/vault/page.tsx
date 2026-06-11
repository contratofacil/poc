"use client";

import React, { useState, useEffect } from "react";
import { FileText, Download, ShieldAlert, Loader2, Globe } from "lucide-react";
import Link from "next/link";
import { useEasyLawAuth } from "@/lib/privy";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/site/AppShell";
import { apiFetch, getApiUrl } from "@/lib/api";

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

function VaultContent() {
  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const [documents, setDocuments] = useState<VaultDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken } = useEasyLawAuth();

  const t = {
    FR: {
      title: "Coffre-Fort Sécurisé",
      subtitle: "Accédez à vos documents certifiés et gardés en toute sécurité.",
      docsTitle: "Vos documents",
      auditTitle: "Journal d'audit (Cabinet Admins)",
      noDocs: "Aucun document dans votre coffre-fort pour le moment.",
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
      loading: "Chargement du coffre-fort...",
      noAudit: "Aucune trace d'audit trouvée.",
    },
    PT: {
      title: "Cofre-Forte Seguro",
      subtitle: "Aceda aos seus documentos certificados e guardados em total segurança.",
      docsTitle: "Os seus documentos",
      auditTitle: "Registo de auditoria (Cabinet Admins)",
      noDocs: "Nenhum documento no seu cofre-forte de momento.",
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
      loading: "A carregar o cofre-forte...",
      noAudit: "Nenhum registo de auditoria encontrado.",
    },
  }[lang];

  useEffect(() => {
    let cancelled = false;

    const fetchVaultData = async () => {
      try {
        const token = await getAccessToken();

        const profileRes = await apiFetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        let role = "salarie";
        if (profileRes.ok) {
          const data = await profileRes.json();
          if (data.success && data.user) {
            role = data.user.role;
            if (!cancelled) setUserRole(role);
          }
        }

        if (cancelled) return;

        const docsRes = await apiFetch("/api/vault/documents", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (docsRes.ok) {
          const data = await docsRes.json();
          if (data.success && data.documents && !cancelled) {
            setDocuments(data.documents);
          }
        }

        if (cancelled) return;

        if (["super_admin", "admin", "cabinet_avocat"].includes(role)) {
          const auditRes = await apiFetch("/api/vault/audit", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (auditRes.ok) {
            const data = await auditRes.json();
            if (data.success && data.auditLogs && !cancelled) {
              setAuditLogs(data.auditLogs);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          setError("Failed to load vault data.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchVaultData();

    return () => {
      cancelled = true;
    };
  }, [getAccessToken]);

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
          >
            {t.title}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {t.subtitle}
          </p>
        </div>
        <button
          onClick={() => setLang((p) => (p === "FR" ? "PT" : "FR"))}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45"
          style={{ borderColor: "var(--surface-mist-strong)", color: "var(--text-secondary)" }}
        >
          <Globe className="w-4 h-4" aria-hidden="true" />
          {lang}
        </button>
      </div>

      {error && (
        <div
          className="p-3 mb-6 rounded-lg border text-sm"
          style={{ background: "var(--status-red-bg)", borderColor: "var(--status-red-border)", color: "var(--status-red)" }}
          role="alert"
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2
            className="w-10 h-10 animate-spin mb-4"
            style={{ color: "var(--brand-secondary)" }}
            aria-hidden="true"
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {t.loading}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Documents section */}
          <section
            className="rounded-2xl border p-6 shadow-[var(--shadow-card)]"
            style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
            aria-labelledby="vault-docs-heading"
          >
            <h2
              id="vault-docs-heading"
              className="text-lg font-bold mb-5 pb-4 border-b flex items-center gap-2"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--brand-primary)",
                borderColor: "var(--surface-mist)",
              }}
            >
              <FileText className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
              {t.docsTitle}
            </h2>

            {documents.length === 0 ? (
              <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
                {t.noDocs}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wider font-semibold" style={{ borderColor: "var(--surface-mist)", color: "var(--text-muted)" }}>
                      <th className="pb-3 pr-4">{t.colName}</th>
                      <th className="pb-3 pr-4">{t.colType}</th>
                      <th className="pb-3 pr-4">{t.colStatus}</th>
                      <th className="pb-3 pr-4">{t.colDate}</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: "var(--text-primary)" }}>
                    {documents.map((doc) => (
                      <tr
                        key={doc.id}
                        className="border-b transition"
                        style={{ borderColor: "var(--surface-mist)" }}
                      >
                        <td className="py-4 pr-4 font-semibold">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 shrink-0" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
                            <span className="truncate max-w-[200px] md:max-w-xs">{doc.name}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4 font-medium uppercase text-xs" style={{ color: "var(--text-muted)" }}>
                          {doc.type}
                        </td>
                        <td className="py-4 pr-4">
                          <span
                            className="text-xs px-2.5 py-0.5 rounded-full font-bold border"
                            style={{
                              background: "var(--status-green-bg)",
                              borderColor: "var(--status-green-border)",
                              color: "var(--status-green)",
                            }}
                          >
                            {doc.status}
                          </span>
                        </td>
                        <td className="py-4 pr-4 font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-right">
                          <a
                            href={getApiUrl(doc.url)}
                            download
                            className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition shadow-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45"
                            style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
                          >
                            <Download className="w-3.5 h-3.5" aria-hidden="true" />
                            {t.actionDownload}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Admin Audit Trail Panel */}
          {userRole && ["super_admin", "admin", "cabinet_avocat"].includes(userRole) && (
            <section
              className="rounded-2xl border p-6 shadow-[var(--shadow-card)]"
              style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
              aria-labelledby="vault-audit-heading"
            >
              <h2
                id="vault-audit-heading"
                className="text-lg font-bold mb-5 pb-4 border-b flex items-center gap-2"
                style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)", borderColor: "var(--surface-mist)" }}
              >
                <ShieldAlert className="w-5 h-5" style={{ color: "var(--status-red)" }} aria-hidden="true" />
                {t.auditTitle}
              </h2>

              {auditLogs.length === 0 ? (
                <p className="text-sm py-8 text-center" style={{ color: "var(--text-muted)" }}>
                  {t.noAudit}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b font-semibold uppercase tracking-wider" style={{ borderColor: "var(--surface-mist)", color: "var(--text-muted)" }}>
                        <th className="pb-3 pr-4">{t.auditDate}</th>
                        <th className="pb-3 pr-4">{t.auditAction}</th>
                        <th className="pb-3 pr-4">{t.auditUser}</th>
                        <th className="pb-3 pr-4">{t.auditEntity}</th>
                        <th className="pb-3 pr-4">{t.auditIP}</th>
                        <th className="pb-3">User Agent</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: "var(--text-secondary)" }}>
                      {auditLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b font-mono transition"
                          style={{ borderColor: "var(--surface-mist)" }}
                        >
                          <td className="py-3 pr-4 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className="px-2 py-0.5 rounded text-xs font-bold"
                              style={{ background: "var(--surface-page)", color: "var(--brand-primary)" }}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-medium truncate max-w-[120px]" style={{ color: "var(--brand-primary)" }}>
                            {log.user_id || "Anonymous"}
                          </td>
                          <td className="py-3 pr-4 whitespace-nowrap" style={{ color: "var(--text-primary)" }}>
                            {log.entity_type} ({log.entity_id?.slice(0, 8)})
                          </td>
                          <td className="py-3 pr-4 font-semibold" style={{ color: "var(--brand-secondary)" }}>
                            {log.ip_addr}
                          </td>
                          <td className="py-3 max-w-xs truncate" style={{ color: "var(--text-muted)" }} title={log.user_agent}>
                            {log.user_agent}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function VaultPage() {
  return (
    <AuthGuard>
      <AppShell
        requireAuth={false}
        activeSection="vault"
        breadcrumb={[{ label: "Coffre-Fort" }]}
      >
        <VaultContent />
      </AppShell>
    </AuthGuard>
  );
}
