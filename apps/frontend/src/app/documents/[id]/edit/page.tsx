"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, GitBranch, Users, CheckCircle, XCircle, Send, Check, X, Languages, ShieldOff, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { apiFetch } from "@/lib/api";
import { useEasyLawAuth } from "@/lib/privy";
import { useParams, useRouter } from "next/navigation";
import { io as socketIO, Socket } from "socket.io-client";

interface Comment {
  id: string;
  content: string;
  author_id: string;
  author_name?: string;
  anchor_text?: string;
  resolved: number;
  created_at: string;
}

interface Suggestion {
  id: string;
  original_text?: string;
  suggested_text: string;
  author_id: string;
  status: string;
}

interface Version {
  id: string;
  version_number: number;
  change_summary?: string;
  created_by: string;
  created_at: string;
}

type Panel = "comments" | "suggestions" | "versions" | "anonymize" | "translate";

function EditDocContent({ docId }: { docId: string }) {
  const { getAccessToken } = useEasyLawAuth();
  const router = useRouter();
  const [doc, setDoc] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [activePanel, setActivePanel] = useState<Panel>("comments");
  const [newComment, setNewComment] = useState("");
  const [newSuggestion, setNewSuggestion] = useState({ original: "", suggested: "" });
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [anonResult, setAnonResult] = useState<string>("");
  const [translateLang, setTranslateLang] = useState("FR");
  const [translateResult, setTranslateResult] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    loadDocument();
  }, [docId]);

  useEffect(() => {
    let sock: Socket | null = null;
    async function connectSocket() {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
      sock = socketIO(apiBase, { auth: { token } });
      socketRef.current = sock;
      sock.emit("document:join", docId);

      sock.on("user:joined", (u: any) => setOnlineUsers(prev => [...prev.filter(x => x !== u.userId), u.userId]));
      sock.on("user:left", (u: any) => setOnlineUsers(prev => prev.filter(x => x !== u.userId)));
      sock.on("comment:new", (c: Comment) => setComments(prev => [c, ...prev]));
      sock.on("comment:resolved", ({ id }: any) => setComments(prev => prev.map(c => c.id === id ? { ...c, resolved: 1 } : c)));
      sock.on("suggestion:new", (s: Suggestion) => setSuggestions(prev => [s, ...prev]));
      sock.on("suggestion:updated", ({ id, status }: any) => setSuggestions(prev => prev.map(s => s.id === id ? { ...s, status } : s)));
      sock.on("version:saved", (v: Version) => setVersions(prev => [v, ...prev]));
    }
    connectSocket();
    return () => { sock?.emit("document:leave", docId); sock?.disconnect(); };
  }, [docId]);

  async function loadDocument() {
    const token = await getAccessToken();
    const res = await apiFetch(`/api/documents/${docId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const d = await res.json();
      setDoc(d.document);
      setComments(d.comments ?? []);
      setSuggestions(d.suggestions ?? []);
      setVersions(d.versions ?? []);
    }
  }

  async function addComment() {
    if (!newComment.trim()) return;
    const token = await getAccessToken();
    await apiFetch(`/api/documents/${docId}/comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    setNewComment("");
  }

  async function resolveComment(id: string) {
    const token = await getAccessToken();
    await apiFetch(`/api/documents/${docId}/comments/${id}/resolve`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
  }

  async function addSuggestion() {
    if (!newSuggestion.suggested.trim()) return;
    const token = await getAccessToken();
    await apiFetch(`/api/documents/${docId}/suggestions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ original_text: newSuggestion.original || undefined, suggested_text: newSuggestion.suggested }),
    });
    setNewSuggestion({ original: "", suggested: "" });
  }

  async function actOnSuggestion(sid: string, action: "accept" | "reject") {
    const token = await getAccessToken();
    await apiFetch(`/api/documents/${docId}/suggestions/${sid}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  async function saveVersion() {
    const summary = prompt("Résumé des changements (optionnel):");
    const token = await getAccessToken();
    await apiFetch(`/api/documents/${docId}/versions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ change_summary: summary ?? "Version sauvegardée" }),
    });
  }

  async function anonymize() {
    const content = doc?.instruction_nl ?? "Document sans contenu";
    setProcessing(true);
    const token = await getAccessToken();
    const res = await apiFetch("/api/documents/anonymize", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content, document_id: docId }),
    });
    const d = await res.json();
    setAnonResult(d.anonymized ?? d.message);
    setProcessing(false);
  }

  async function translate() {
    const content = doc?.instruction_nl ?? "Document sans contenu";
    setProcessing(true);
    const token = await getAccessToken();
    const res = await apiFetch("/api/documents/translate", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ content, target_lang: translateLang, source_lang: "PT" }),
    });
    const d = await res.json();
    setTranslateResult(d.translated ?? d.message);
    setProcessing(false);
  }

  if (!doc) return <div className="flex items-center justify-center h-64"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--brand-primary)", borderTopColor: "transparent" }} /></div>;

  const pendingSuggestions = suggestions.filter(s => s.status === "pending");
  const openComments = comments.filter(c => !c.resolved);

  return (
    <div className="flex h-full" style={{ background: "var(--surface-base)" }}>
      {/* Document area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1 rounded hover:opacity-70">
              <ChevronLeft className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
            </button>
            <h1 className="font-bold text-base truncate" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>{doc.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            {onlineUsers.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                <Users className="w-3.5 h-3.5" />
                <span>{onlineUsers.length + 1} en ligne</span>
              </div>
            )}
            <button onClick={saveVersion} className="px-3 py-1.5 rounded-lg text-xs font-semibold border" style={{ borderColor: "var(--surface-mist-strong)", color: "var(--text-secondary)" }}>
              <GitBranch className="w-3.5 h-3.5 inline mr-1" /> Sauvegarder version
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            <pre className="text-sm whitespace-pre-wrap leading-loose" style={{ fontFamily: "var(--font-serif)", color: "var(--text-primary)" }}>
              {doc.instruction_nl}
            </pre>

            {/* Inline suggestions display */}
            {pendingSuggestions.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-bold uppercase" style={{ color: "var(--text-muted)" }}>Suggestions en attente ({pendingSuggestions.length})</p>
                {pendingSuggestions.map(s => (
                  <div key={s.id} className="rounded-lg border p-3" style={{ borderColor: "var(--surface-mist-strong)", background: "rgba(var(--brand-secondary-rgb),0.04)" }}>
                    {s.original_text && <p className="text-xs mb-1 line-through opacity-50">{s.original_text}</p>}
                    <p className="text-sm underline decoration-dotted" style={{ color: "var(--brand-primary)" }}>{s.suggested_text}</p>
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => actOnSuggestion(s.id, "accept")} className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ background: "rgba(var(--status-green-rgb),0.1)", color: "var(--status-green)" }}>
                        <Check className="w-3 h-3" /> Accepter
                      </button>
                      <button onClick={() => actOnSuggestion(s.id, "reject")} className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ background: "rgba(var(--status-red-rgb),0.1)", color: "var(--status-red)" }}>
                        <X className="w-3 h-3" /> Rejeter
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <aside className="w-80 border-l flex flex-col" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
        <nav className="flex border-b" style={{ borderColor: "var(--surface-mist)" }}>
          {([
            { id: "comments", icon: MessageSquare, label: `(${openComments.length})` },
            { id: "suggestions", icon: CheckCircle, label: `(${pendingSuggestions.length})` },
            { id: "versions", icon: GitBranch, label: "" },
            { id: "anonymize", icon: ShieldOff, label: "" },
            { id: "translate", icon: Languages, label: "" },
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setActivePanel(tab.id)} title={tab.id} className="flex-1 flex flex-col items-center py-2.5 text-[10px] transition border-b-2" style={{ borderColor: activePanel === tab.id ? "var(--brand-primary)" : "transparent", color: activePanel === tab.id ? "var(--brand-primary)" : "var(--text-muted)" }}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto p-4">
          {activePanel === "comments" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && addComment()} placeholder="Ajouter un commentaire..." className="flex-1 px-3 py-2 rounded-lg border text-xs" style={{ borderColor: "var(--surface-mist-strong)" }} />
                <button onClick={addComment} className="p-2 rounded-lg" style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}><Send className="w-3.5 h-3.5" /></button>
              </div>
              {openComments.map(c => (
                <div key={c.id} className="rounded-lg p-3 border" style={{ borderColor: "var(--surface-mist)" }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: "var(--brand-primary)" }}>{c.author_name ?? c.author_id}</p>
                  <p className="text-xs" style={{ color: "var(--text-primary)" }}>{c.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{new Date(c.created_at).toLocaleString("fr-FR")}</span>
                    <button onClick={() => resolveComment(c.id)} className="text-[10px] font-semibold" style={{ color: "var(--status-green)" }}>Résoudre</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activePanel === "suggestions" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <input value={newSuggestion.original} onChange={e => setNewSuggestion(p => ({ ...p, original: e.target.value }))} placeholder="Texte original (optionnel)" className="w-full px-3 py-2 rounded border text-xs" style={{ borderColor: "var(--surface-mist-strong)" }} />
                <textarea value={newSuggestion.suggested} onChange={e => setNewSuggestion(p => ({ ...p, suggested: e.target.value }))} placeholder="Votre suggestion *" rows={3} className="w-full px-3 py-2 rounded border text-xs resize-none" style={{ borderColor: "var(--surface-mist-strong)" }} />
                <button onClick={addSuggestion} className="w-full py-1.5 rounded text-xs font-semibold" style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}>Proposer</button>
              </div>
            </div>
          )}

          {activePanel === "versions" && (
            <div className="space-y-2">
              {versions.map(v => (
                <div key={v.id} className="rounded-lg p-3 border" style={{ borderColor: "var(--surface-mist)" }}>
                  <p className="text-xs font-bold" style={{ color: "var(--brand-primary)" }}>v{v.version_number}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{v.change_summary}</p>
                  <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>{new Date(v.created_at).toLocaleString("fr-FR")}</p>
                </div>
              ))}
            </div>
          )}

          {activePanel === "anonymize" && (
            <div className="space-y-3">
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Remplace noms, adresses, NIF par [PARTIE_A], [ADRESSE_1], etc.</p>
              <button onClick={anonymize} disabled={processing} className="w-full py-2 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}>
                {processing ? "Anonymisation..." : "Anonymiser le document"}
              </button>
              {anonResult && <pre className="text-xs p-3 rounded border whitespace-pre-wrap max-h-64 overflow-y-auto" style={{ borderColor: "var(--surface-mist)", color: "var(--text-primary)" }}>{anonResult}</pre>}
            </div>
          )}

          {activePanel === "translate" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: "var(--text-secondary)" }}>Langue cible</label>
                <select value={translateLang} onChange={e => setTranslateLang(e.target.value)} className="w-full px-3 py-2 rounded border text-xs" style={{ borderColor: "var(--surface-mist-strong)" }}>
                  <option value="FR">Français</option>
                  <option value="EN">Anglais</option>
                  <option value="ES">Espagnol</option>
                  <option value="PT">Portugais</option>
                </select>
              </div>
              <button onClick={translate} disabled={processing} className="w-full py-2 rounded-lg text-xs font-semibold disabled:opacity-50" style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}>
                {processing ? "Traduction..." : "Traduire le document"}
              </button>
              {translateResult && <pre className="text-xs p-3 rounded border whitespace-pre-wrap max-h-64 overflow-y-auto" style={{ borderColor: "var(--surface-mist)", color: "var(--text-primary)" }}>{translateResult}</pre>}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function EditDocPage() {
  const params = useParams();
  const docId = params?.id as string;

  return (
    <AuthGuard>
      <AppShell requireAuth={false} activeSection="documents" breadcrumb={[{ label: "Documents" }, { label: "Éditer" }]}>
        <EditDocContent docId={docId} />
      </AppShell>
    </AuthGuard>
  );
}
