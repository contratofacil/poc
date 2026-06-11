"use client";

import React, { useState, useEffect } from "react";
import { Wand2, FileText, Download, Loader2, Clock, Eye } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { apiFetch } from "@/lib/api";
import { useEasyLawAuth } from "@/lib/privy";
import Link from "next/link";

interface GeneratedDoc {
  id: string;
  title: string;
  doc_type: string;
  status: string;
  created_at: string;
}

const DOC_TYPES = [
  { id: "acte_juridique", label: "Acte juridique" },
  { id: "conclusions", label: "Conclusions / Mémoire" },
  { id: "contrat", label: "Contrat sur mesure" },
  { id: "lettre_mise_en_demeure", label: "Lettre de mise en demeure" },
  { id: "assignation", label: "Assignation" },
  { id: "requete", label: "Requête" },
  { id: "autre", label: "Autre document juridique" },
];

function GenerateDocContent() {
  const { getAccessToken } = useEasyLawAuth();
  const [instruction, setInstruction] = useState("");
  const [docType, setDocType] = useState("acte_juridique");
  const [title, setTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ id: string; title: string; content: string } | null>(null);
  const [history, setHistory] = useState<GeneratedDoc[]>([]);
  const [activeTab, setActiveTab] = useState<"generate" | "history">("generate");

  useEffect(() => { fetchHistory(); }, []);

  async function fetchHistory() {
    try {
      const token = await getAccessToken();
      const res = await apiFetch("/api/documents", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setHistory(d.documents ?? []); }
    } catch { /* ignore */ }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!instruction.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const token = await getAccessToken();
      const res = await apiFetch("/api/documents/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ instruction, doc_type: docType, title: title || undefined }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setResult(data.document);
      await fetchHistory();
    } catch (err: any) {
      alert(err?.message ?? "Erreur lors de la génération");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="px-4 sm:px-8 py-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Wand2 className="w-6 h-6" style={{ color: "var(--brand-primary)" }} />
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
            Génération de Documents IA
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Rédigez un document juridique en langage naturel — basé sur le droit portugais et vos dossiers
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b" style={{ borderColor: "var(--surface-mist)" }}>
        {(["generate", "history"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="px-4 py-2 text-sm font-semibold transition border-b-2 -mb-px" style={{ borderColor: activeTab === tab ? "var(--brand-primary)" : "transparent", color: activeTab === tab ? "var(--brand-primary)" : "var(--text-muted)" }}>
            {tab === "generate" ? "Nouveau document" : `Historique (${history.length})`}
          </button>
        ))}
      </div>

      {activeTab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Type de document
              </label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--surface-mist-strong)", background: "var(--surface-card)" }}
              >
                {DOC_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Titre (optionnel)
              </label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Mise en demeure Société XYZ"
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ borderColor: "var(--surface-mist-strong)", background: "var(--surface-card)" }}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Instruction en langage naturel *
              </label>
              <textarea
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                placeholder="Ex: Rédigez une mise en demeure adressée à la société Lda pour non-paiement d'une facture de 5 000 EUR échue le 15 mars 2026. La société a été relancée par email deux fois sans réponse. Délai accordé : 15 jours."
                rows={8}
                className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                style={{ borderColor: "var(--surface-mist-strong)", background: "var(--surface-card)" }}
                required
              />
            </div>

            <button
              type="submit"
              disabled={generating || !instruction.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold disabled:opacity-50 transition"
              style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
            >
              {generating ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours...</>
              ) : (
                <><Wand2 className="w-4 h-4" /> Générer le document</>
              )}
            </button>
          </form>

          {/* Result panel */}
          <div>
            {generating && (
              <div className="flex flex-col items-center justify-center h-64 rounded-xl border" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
                <Loader2 className="w-10 h-10 animate-spin mb-4 opacity-30" style={{ color: "var(--brand-primary)" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Claude rédige votre document...</p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Vérification des sources PT/EU en cours</p>
              </div>
            )}

            {result && !generating && (
              <div className="rounded-xl border" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--surface-mist)" }}>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{result.title}</span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/documents/${result.id}/edit`} className="flex items-center gap-1 px-2 py-1 rounded text-xs border" style={{ borderColor: "var(--surface-mist-strong)", color: "var(--text-secondary)" }}>
                      <Eye className="w-3 h-3" /> Éditer
                    </Link>
                  </div>
                </div>
                <div className="p-4 max-h-80 overflow-y-auto">
                  <pre className="text-xs whitespace-pre-wrap leading-relaxed" style={{ color: "var(--text-primary)", fontFamily: "var(--font-serif)" }}>
                    {result.content}
                  </pre>
                </div>
              </div>
            )}

            {!result && !generating && (
              <div className="flex flex-col items-center justify-center h-64 rounded-xl border opacity-40" style={{ borderColor: "var(--surface-mist)" }}>
                <Wand2 className="w-10 h-10 mb-3" />
                <p className="text-sm">Votre document apparaîtra ici</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-16 opacity-40">
              <Clock className="w-10 h-10 mx-auto mb-3" />
              <p className="text-sm">Aucun document généré pour le moment</p>
            </div>
          ) : (
            history.map(doc => (
              <Link key={doc.id} href={`/documents/${doc.id}/edit`} className="flex items-center gap-4 px-4 py-3 rounded-xl border transition hover:border-current" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
                <FileText className="w-5 h-5 shrink-0" style={{ color: "var(--brand-primary)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{doc.title}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {doc.doc_type} · {new Date(doc.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: "var(--surface-mist)", color: "var(--text-muted)" }}>{doc.status}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function GenerateDocPage() {
  return (
    <AuthGuard>
      <AppShell requireAuth={false} activeSection="documents" breadcrumb={[{ label: "Documents" }, { label: "Générer" }]}>
        <GenerateDocContent />
      </AppShell>
    </AuthGuard>
  );
}
