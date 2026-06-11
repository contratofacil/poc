"use client";

import React, { useState, useEffect, useRef } from "react";
import { FolderOpen, Upload, Search, CheckCircle, XCircle, Clock, BarChart2, Download, Filter, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { apiFetch } from "@/lib/api";
import { useEasyLawAuth } from "@/lib/privy";

interface Dossier { id: string; name: string; description?: string; }
interface CabDoc { id: string; title: string; doc_type: string; ai_category: string; ai_priority: string; ai_summary: string; dossier_id?: string; created_at: string; size_bytes?: number; }
interface ValidationItem { id: string; document_id: string; title: string; ai_summary: string; ai_priority: string; status: string; uploader_name?: string; }
interface Report { total_documents: number; by_category: Array<{ ai_category: string; count: number }>; validation: { total: number; validated: number; pending: number }; }

type View = "library" | "validation" | "report";

function GedContent() {
  const { getAccessToken } = useEasyLawAuth();
  const [view, setView] = useState<View>("library");
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [documents, setDocuments] = useState<CabDoc[]>([]);
  const [queue, setQueue] = useState<ValidationItem[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CabDoc[]>([]);
  const [selectedDossier, setSelectedDossier] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [newDossierName, setNewDossierName] = useState("");
  const [showNewDossier, setShowNewDossier] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDossiers();
    fetchLibrary();
  }, []);

  useEffect(() => {
    if (view === "validation") fetchQueue();
    if (view === "report") fetchReport();
  }, [view]);

  async function fetchDossiers() {
    try {
      const token = await getAccessToken();
      const res = await apiFetch("/api/ged/dossiers", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setDossiers(d.dossiers ?? []); }
    } catch { /* ignore */ }
  }

  async function fetchLibrary(dossierId?: string) {
    try {
      const token = await getAccessToken();
      const params = new URLSearchParams();
      if (dossierId) params.set("dossier_id", dossierId);
      const res = await apiFetch(`/api/ged/library?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setDocuments(d.documents ?? []); }
    } catch { /* ignore */ }
  }

  async function fetchQueue() {
    try {
      const token = await getAccessToken();
      const res = await apiFetch("/api/ged/validation-queue", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setQueue(d.queue ?? []); }
    } catch { /* ignore */ }
  }

  async function fetchReport() {
    try {
      const token = await getAccessToken();
      const res = await apiFetch("/api/ged/report", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setReport(d.report); }
    } catch { /* ignore */ }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const token = await getAccessToken();
    const res = await apiFetch("/api/ged/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query: searchQuery }),
    });
    if (res.ok) { const d = await res.json(); setSearchResults(d.results ?? []); }
  }

  async function handleImport(fileList: FileList) {
    if (!fileList.length) return;
    setUploading(true);
    try {
      const token = await getAccessToken();
      const formData = new FormData();
      Array.from(fileList).forEach(f => formData.append("documents", f));
      if (selectedDossier) formData.append("dossier_id", selectedDossier);
      const res = await apiFetch("/api/ged/import", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) { await fetchLibrary(selectedDossier ?? undefined); }
    } finally { setUploading(false); }
  }

  async function createDossier() {
    if (!newDossierName.trim()) return;
    const token = await getAccessToken();
    const res = await apiFetch("/api/ged/dossiers", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDossierName }),
    });
    if (res.ok) { await fetchDossiers(); setNewDossierName(""); setShowNewDossier(false); }
  }

  async function validateDoc(id: string, action: "validate" | "reject" | "modify") {
    const token = await getAccessToken();
    await apiFetch(`/api/ged/validate/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await fetchQueue();
  }

  async function exportReport() {
    const token = await getAccessToken();
    const res = await apiFetch("/api/ged/report/export", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "rapport-ged.pdf"; a.click();
      URL.revokeObjectURL(url);
    }
  }

  const priorityColor: Record<string, string> = { urgent: "var(--status-red)", important: "var(--brand-secondary)", normal: "var(--text-muted)", archivage: "var(--text-muted)" };

  return (
    <div className="flex h-full" style={{ background: "var(--surface-base)" }}>
      {/* Left sidebar */}
      <aside className="w-60 border-r flex flex-col shrink-0" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--surface-mist)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>GED Cabinet</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Knowledge Management</p>
        </div>
        <nav className="p-2 space-y-1">
          {(["library", "validation", "report"] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition" style={{ background: view === v ? "rgba(var(--brand-primary-rgb),0.08)" : "transparent", color: view === v ? "var(--brand-primary)" : "var(--text-secondary)" }}>
              {v === "library" ? <FolderOpen className="w-4 h-4" /> : v === "validation" ? <CheckCircle className="w-4 h-4" /> : <BarChart2 className="w-4 h-4" />}
              {v === "library" ? "Bibliothèque" : v === "validation" ? "File de validation" : "Reporting"}
            </button>
          ))}
        </nav>
        {view === "library" && (
          <div className="flex-1 overflow-y-auto p-2">
            <div className="flex items-center justify-between px-2 py-1 mb-1">
              <span className="text-xs font-bold uppercase" style={{ color: "var(--text-muted)" }}>Dossiers</span>
              <button onClick={() => setShowNewDossier(!showNewDossier)} className="text-xs font-bold" style={{ color: "var(--brand-primary)" }}>+</button>
            </div>
            {showNewDossier && (
              <div className="px-2 mb-2 flex gap-1">
                <input value={newDossierName} onChange={e => setNewDossierName(e.target.value)} placeholder="Nom du dossier" className="flex-1 px-2 py-1 rounded text-xs border" style={{ borderColor: "var(--surface-mist-strong)" }} />
                <button onClick={createDossier} className="px-2 py-1 rounded text-xs font-bold" style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}>OK</button>
              </div>
            )}
            <button
              onClick={() => { setSelectedDossier(null); fetchLibrary(); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition"
              style={{ background: !selectedDossier ? "rgba(var(--brand-primary-rgb),0.06)" : "transparent", color: "var(--text-secondary)" }}
            >
              <FolderOpen className="w-3.5 h-3.5" /> Tous les documents
            </button>
            {dossiers.map(d => (
              <button key={d.id} onClick={() => { setSelectedDossier(d.id); fetchLibrary(d.id); }} className="w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs transition" style={{ background: selectedDossier === d.id ? "rgba(var(--brand-primary-rgb),0.06)" : "transparent", color: "var(--text-secondary)" }}>
                <ChevronRight className="w-3 h-3" /> {d.name}
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6">
        {view === "library" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>Bibliothèque documentaire</h1>
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}>
                  <Upload className="w-3.5 h-3.5" /> {uploading ? "Import..." : "Importer"}
                </button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={e => e.target.files && handleImport(e.target.files)} />
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 mb-5">
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Recherche en langage naturel dans les documents du cabinet..." className="flex-1 px-4 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--surface-mist-strong)", background: "var(--surface-card)" }} />
              <button type="submit" className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}>
                <Search className="w-4 h-4" />
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>RÉSULTATS DE RECHERCHE ({searchResults.length})</p>
                <div className="space-y-2">
                  {searchResults.map(d => <DocRow key={d.id} doc={d} priorityColor={priorityColor} />)}
                </div>
                <button onClick={() => setSearchResults([])} className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>Effacer les résultats</button>
              </div>
            )}

            <p className="text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>TOUS LES DOCUMENTS ({documents.length})</p>
            {documents.length === 0 ? (
              <div className="text-center py-16 opacity-40">
                <FolderOpen className="w-12 h-12 mx-auto mb-3" />
                <p className="text-sm">Aucun document — importez vos premiers fichiers</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map(d => <DocRow key={d.id} doc={d} priorityColor={priorityColor} />)}
              </div>
            )}
          </>
        )}

        {view === "validation" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>File de validation</h1>
              <span className="px-2 py-1 rounded-full text-xs font-bold" style={{ background: "rgba(var(--status-red-rgb),0.1)", color: "var(--status-red)" }}>{queue.length} en attente</span>
            </div>
            {queue.length === 0 ? (
              <div className="text-center py-16 opacity-40">
                <CheckCircle className="w-12 h-12 mx-auto mb-3" />
                <p className="text-sm">File vide — tous les documents sont validés</p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map(item => (
                  <div key={item.id} className="rounded-xl border p-4" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.ai_summary}</p>
                        <span className="text-[10px] font-bold mt-1 inline-block" style={{ color: priorityColor[item.ai_priority] ?? "var(--text-muted)" }}>{item.ai_priority?.toUpperCase()}</span>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button onClick={() => validateDoc(item.id, "validate")} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(var(--status-green-rgb),0.1)", color: "var(--status-green)" }}>
                          <CheckCircle className="w-3.5 h-3.5 inline mr-1" /> Valider
                        </button>
                        <button onClick={() => validateDoc(item.id, "modify")} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(var(--brand-secondary-rgb),0.1)", color: "var(--brand-secondary)" }}>
                          Modifier
                        </button>
                        <button onClick={() => validateDoc(item.id, "reject")} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(var(--status-red-rgb),0.1)", color: "var(--status-red)" }}>
                          <XCircle className="w-3.5 h-3.5 inline mr-1" /> Rejeter
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {view === "report" && report && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>Reporting Cabinet</h1>
              <button onClick={exportReport} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border" style={{ borderColor: "var(--surface-mist-strong)", color: "var(--text-secondary)" }}>
                <Download className="w-3.5 h-3.5" /> Exporter PDF
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: "Total documents", value: report.total_documents },
                { label: "Documents validés", value: report.validation?.validated ?? 0 },
                { label: "En attente validation", value: report.validation?.pending ?? 0 },
              ].map(kpi => (
                <div key={kpi.label} className="rounded-xl border p-5" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
                  <p className="text-2xl font-bold" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>{kpi.value}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{kpi.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border p-5" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
              <p className="font-bold text-sm mb-3" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>Répartition par catégorie</p>
              {report.by_category.map(c => (
                <div key={c.ai_category} className="flex items-center gap-3 mb-2">
                  <span className="text-xs w-32 truncate" style={{ color: "var(--text-secondary)" }}>{c.ai_category}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-mist)" }}>
                    <div className="h-2 rounded-full" style={{ width: `${Math.round((c.count / report.total_documents) * 100)}%`, background: "var(--brand-primary)" }} />
                  </div>
                  <span className="text-xs font-bold w-6 text-right" style={{ color: "var(--text-primary)" }}>{c.count}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function DocRow({ doc, priorityColor }: { doc: CabDoc; priorityColor: Record<string, string> }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{doc.title}</p>
        <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{doc.ai_summary}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-mist)", color: priorityColor[doc.ai_priority] ?? "var(--text-muted)" }}>{doc.ai_priority}</span>
        <span className="text-[10px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>{doc.doc_type}</span>
      </div>
    </div>
  );
}

export default function GedPage() {
  return (
    <AuthGuard>
      <AppShell requireAuth={false} activeSection="ged" breadcrumb={[{ label: "GED Cabinet" }]}>
        <GedContent />
      </AppShell>
    </AuthGuard>
  );
}
