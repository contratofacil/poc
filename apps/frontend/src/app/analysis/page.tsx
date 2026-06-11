"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, FileText, Brain, Download, Clock, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, X } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { apiFetch } from "@/lib/api";
import { useEasyLawAuth } from "@/lib/privy";

interface AnalysisResult {
  resume?: { enjeux?: string; parties?: string[]; roles?: Record<string, string>; points_cles?: string[] };
  clauses_sensibles?: Array<{ document: string; clause: string; risque: string; niveau: string }>;
  chronologie?: Array<{ date: string; evenement: string; document_source: string }>;
  confrontation_sources?: Array<{ point: string; reference_pt_eu: string; commentaire: string }>;
  recommandations?: string[];
  error?: string;
}

interface Session {
  id: string;
  name: string;
  status: string;
  doc_count: number;
  page_count: number;
  created_at: string;
}

type Step = "upload" | "analyze" | "results";

function AnalysisContent() {
  const { getAccessToken } = useEasyLawAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [step, setStep] = useState<Step>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>("resume");
  const [sessionName, setSessionName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchSessions(); }, []);

  async function fetchSessions() {
    try {
      const token = await getAccessToken();
      const res = await apiFetch("/api/analysis/sessions", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const d = await res.json(); setSessions(d.sessions ?? []); }
    } catch { /* ignore */ }
  }

  async function handleUpload() {
    if (!files.length) return;
    setUploading(true);
    setProgress(10);
    try {
      const token = await getAccessToken();
      const createRes = await apiFetch("/api/analysis/sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: sessionName || `Analyse ${new Date().toLocaleDateString("fr-FR")}` }),
      });
      const createData = await createRes.json();
      if (!createData.success) throw new Error(createData.message);
      const sessionId = createData.session.id;

      setProgress(30);
      const formData = new FormData();
      files.forEach(f => formData.append("documents", f));

      const uploadRes = await apiFetch(`/api/analysis/sessions/${sessionId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.message);

      setProgress(60);
      setActiveSession({ id: sessionId, name: sessionName || `Analyse`, status: "ready", doc_count: files.length, page_count: uploadData.totalPages, created_at: new Date().toISOString() });
      setStep("analyze");
      setProgress(100);
      await fetchSessions();
    } catch (err: any) {
      alert(err?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleAnalyze() {
    if (!activeSession) return;
    setAnalyzing(true);
    setProgress(0);
    const progressInterval = setInterval(() => setProgress(p => Math.min(p + 3, 90)), 800);
    try {
      const token = await getAccessToken();
      const res = await apiFetch(`/api/analysis/sessions/${activeSession.id}/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setResult(data.result);
      setStep("results");
      setProgress(100);
      await fetchSessions();
    } catch (err: any) {
      alert(err?.message ?? "Analysis failed");
    } finally {
      clearInterval(progressInterval);
      setAnalyzing(false);
    }
  }

  async function exportPdf() {
    if (!activeSession) return;
    const token = await getAccessToken();
    const res = await apiFetch(`/api/analysis/sessions/${activeSession.id}/export/pdf`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const d = await res.json();
    if (d.success) alert("PDF exporté et stocké dans votre vault.");
    else alert(d.message);
  }

  async function exportExcel() {
    if (!activeSession) return;
    const token = await getAccessToken();
    const res = await apiFetch(`/api/analysis/sessions/${activeSession.id}/export/excel`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `analyse-${activeSession.id}.xlsx`; a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function loadSession(s: Session) {
    const token = await getAccessToken();
    const res = await apiFetch(`/api/analysis/sessions/${s.id}`, { headers: { Authorization: `Bearer ${token}` } });
    const d = await res.json();
    if (d.success) {
      setActiveSession(s);
      setResult(d.result);
      setStep(d.result ? "results" : s.status === "ready" ? "analyze" : "upload");
    }
  }

  const nivelColor: Record<string, string> = {
    "elevé": "var(--status-red)",
    "moyen": "var(--brand-secondary)",
    "faible": "var(--status-green)",
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="flex h-full" style={{ background: "var(--surface-base)" }}>
      {/* Sidebar — session history */}
      <aside className="w-64 border-r flex flex-col shrink-0" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
        <div className="p-4 border-b" style={{ borderColor: "var(--surface-mist)" }}>
          <h2 className="font-bold text-sm" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
            Analyse de Documents
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Module B — Avocats</p>
        </div>
        <button
          onClick={() => { setStep("upload"); setActiveSession(null); setResult(null); setFiles([]); }}
          className="mx-3 mt-3 py-2 px-3 rounded-lg text-xs font-semibold text-center transition"
          style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
        >
          + Nouvelle analyse
        </button>
        <div className="flex-1 overflow-y-auto p-3 space-y-1 mt-2">
          {sessions.map(s => (
            <button
              key={s.id}
              onClick={() => loadSession(s)}
              className="w-full text-left px-3 py-2.5 rounded-lg text-xs transition"
              style={{
                background: activeSession?.id === s.id ? "rgba(var(--brand-primary-rgb),0.08)" : "transparent",
                color: "var(--text-primary)",
              }}
            >
              <div className="font-semibold truncate">{s.name}</div>
              <div className="flex items-center gap-2 mt-0.5" style={{ color: "var(--text-muted)" }}>
                <span>{s.doc_count} docs</span>
                <span className={`px-1 rounded text-[10px] font-bold ${s.status === "done" ? "text-green-600" : s.status === "processing" ? "text-amber-600" : "text-gray-500"}`}>
                  {s.status}
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">
        {step === "upload" && (
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
              Upload de documents
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
              Jusqu'à 100 documents / 1 500 pages par session. Formats: PDF, Word, Excel, images.
            </p>
            <input
              value={sessionName}
              onChange={e => setSessionName(e.target.value)}
              placeholder="Nom de la session (optionnel)"
              className="w-full px-3 py-2 rounded-lg border text-sm mb-4"
              style={{ borderColor: "var(--surface-mist-strong)", background: "var(--surface-card)" }}
            />
            <div
              onDrop={onDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition hover:border-current"
              style={{ borderColor: "var(--surface-mist-strong)", color: "var(--text-muted)" }}
            >
              <Upload className="w-12 h-12 mx-auto mb-4 opacity-40" />
              <p className="font-semibold text-sm">Glissez vos documents ici</p>
              <p className="text-xs mt-1">ou cliquez pour sélectionner</p>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.tiff" className="hidden" onChange={e => setFiles(Array.from(e.target.files ?? []))} />
            </div>
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{files.length} fichier(s) sélectionné(s)</p>
                {files.slice(0, 5).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: "var(--surface-mist)" }}>
                    <FileText className="w-4 h-4 shrink-0" />
                    <span className="truncate">{f.name}</span>
                    <span className="ml-auto shrink-0 opacity-60">{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
                {files.length > 5 && <p className="text-xs opacity-60">... et {files.length - 5} autres</p>}
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold mt-2 disabled:opacity-50"
                  style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
                >
                  {uploading ? `Upload... ${progress}%` : "Uploader et continuer"}
                </button>
              </div>
            )}
          </div>
        )}

        {step === "analyze" && activeSession && (
          <div className="max-w-xl mx-auto text-center">
            <Brain className="w-16 h-16 mx-auto mb-6 opacity-30" style={{ color: "var(--brand-primary)" }} />
            <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
              {activeSession.name}
            </h1>
            <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
              {activeSession.doc_count} document(s) uploadés — {activeSession.page_count} pages
            </p>
            <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
              L'analyse IA va identifier les risques, clauses sensibles, chronologie et les confronter aux sources PT/EU.
            </p>
            {analyzing && (
              <div className="mb-6">
                <div className="w-full rounded-full h-2 mb-2" style={{ background: "var(--surface-mist)" }}>
                  <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--brand-primary)" }} />
                </div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Analyse en cours...</p>
              </div>
            )}
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="px-8 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 transition"
              style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
            >
              {analyzing ? "Analyse en cours..." : "Lancer l'analyse IA"}
            </button>
          </div>
        )}

        {step === "results" && result && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
                Résultats de l'analyse
              </h1>
              <div className="flex gap-2">
                <button onClick={exportPdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition" style={{ borderColor: "var(--surface-mist-strong)", color: "var(--text-secondary)" }}>
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition" style={{ borderColor: "var(--surface-mist-strong)", color: "var(--text-secondary)" }}>
                  <Download className="w-3.5 h-3.5" /> Excel
                </button>
              </div>
            </div>

            {/* Resume */}
            <Section title="Résumé structuré" id="resume" expanded={expandedSection === "resume"} onToggle={id => setExpandedSection(expandedSection === id ? null : id)}>
              {result.resume?.enjeux && <p className="text-sm mb-3 leading-relaxed" style={{ color: "var(--text-primary)" }}>{result.resume.enjeux}</p>}
              {result.resume?.points_cles?.length ? (
                <ul className="space-y-1">{result.resume.points_cles.map((p, i) => <li key={i} className="text-sm flex gap-2"><span className="mt-0.5">•</span><span style={{ color: "var(--text-secondary)" }}>{p}</span></li>)}</ul>
              ) : null}
            </Section>

            {/* Clauses sensibles */}
            {result.clauses_sensibles?.length ? (
              <Section title={`Clauses sensibles (${result.clauses_sensibles.length})`} id="clauses" expanded={expandedSection === "clauses"} onToggle={id => setExpandedSection(expandedSection === id ? null : id)}>
                <div className="space-y-3">
                  {result.clauses_sensibles.map((c, i) => (
                    <div key={i} className="rounded-lg p-3 border" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-mist)" }}>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: nivelColor[c.niveau] ?? "var(--text-muted)" }} />
                        <span className="text-xs font-bold" style={{ color: nivelColor[c.niveau] ?? "var(--text-muted)" }}>{c.niveau?.toUpperCase()}</span>
                        <span className="text-xs opacity-60">{c.document}</span>
                      </div>
                      <p className="text-sm font-semibold mb-0.5" style={{ color: "var(--text-primary)" }}>{c.clause}</p>
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.risque}</p>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            {/* Chronologie */}
            {result.chronologie?.length ? (
              <Section title={`Chronologie (${result.chronologie.length} événements)`} id="chrono" expanded={expandedSection === "chrono"} onToggle={id => setExpandedSection(expandedSection === id ? null : id)}>
                <div className="space-y-2">
                  {result.chronologie.map((e, i) => (
                    <div key={i} className="flex gap-4 text-sm">
                      <span className="shrink-0 font-mono text-xs w-28" style={{ color: "var(--text-muted)" }}>{e.date}</span>
                      <span style={{ color: "var(--text-primary)" }}>{e.evenement}</span>
                    </div>
                  ))}
                </div>
              </Section>
            ) : null}

            {/* Recommandations */}
            {result.recommandations?.length ? (
              <Section title="Recommandations" id="reco" expanded={expandedSection === "reco"} onToggle={id => setExpandedSection(expandedSection === id ? null : id)}>
                <ul className="space-y-2">{result.recommandations.map((r, i) => <li key={i} className="flex gap-2 text-sm"><CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--status-green)" }} /><span style={{ color: "var(--text-secondary)" }}>{r}</span></li>)}</ul>
              </Section>
            ) : null}
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ title, id, expanded, onToggle, children }: { title: string; id: string; expanded: boolean; onToggle: (id: string) => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border mb-4" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
      <button onClick={() => onToggle(id)} className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-left" style={{ color: "var(--brand-primary)" }}>
        <span style={{ fontFamily: "var(--font-serif)" }}>{title}</span>
        {expanded ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
      </button>
      {expanded && <div className="px-5 pb-5">{children}</div>}
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <AuthGuard>
      <AppShell requireAuth={false} activeSection="analysis" breadcrumb={[{ label: "Analyse de Documents" }]}>
        <AnalysisContent />
      </AppShell>
    </AuthGuard>
  );
}
