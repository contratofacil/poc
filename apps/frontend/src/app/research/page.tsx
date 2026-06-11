"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  BookOpen,
  Zap,
  FileDown,
  ExternalLink,
  Clock,
  ChevronRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Scale,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { useEasyLawAuth } from "@/lib/privy";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/site/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchSource {
  qdrant_id: string;
  chunk_text: string;
  title: string;
  url: string;
  source: string;
  date: string | null;
  doc_type: string | null;
  score: number;
}

interface HistoryItem {
  id: string;
  query: string;
  mode: string;
  summary: string | null;
  created_at: string;
}

type SearchMode = "standard" | "deepdive";

interface ProgressState {
  step: string;
  pct: number;
  label: string;
  subQueries?: string[];
}

const SOURCE_COLORS: Record<string, string> = {
  DRE_I: "#1A6FC4",
  DRE_II: "#2E86AB",
  DGSI: "#7C3AED",
  CURIA: "#0F5C2E",
  EURLEX: "#1A4B8C",
  CAAD: "#C96B30",
};

// ─── Source badge ─────────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: string }) {
  const label = source.replace("_", " ");
  const color = SOURCE_COLORS[source] ?? "#666";
  return (
    <span
      className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
      style={{ background: color }}
    >
      {label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

function ResearchPageContent() {
  const { getAccessToken } = useEasyLawAuth();

  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleError, setRoleError] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("standard");
  const [isSearching, setIsSearching] = useState(false);

  const [streamedText, setStreamedText] = useState("");
  const [sources, setSources] = useState<SearchSource[]>([]);
  const [summary, setSummary] = useState("");
  const [recapTable, setRecapTable] = useState("");
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [currentSearchId, setCurrentSearchId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedVaultId, setExportedVaultId] = useState<string | null>(null);

  const responseRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ALLOWED_ROLES = [
    "super_admin", "admin", "cabinet_avocat",
    "avocat", "avocat_associe", "juriste",
  ];

  // ── Init: check role + load history ─────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      const token = await getAccessToken();
      if (!token) { setRoleError(true); setIsInitializing(false); return; }
      try {
        const res = await fetch(getApiUrl("/api/auth/profile"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        const role = data.user?.role;
        if (!ALLOWED_ROLES.includes(role)) {
          setRoleError(true);
        } else {
          setRoleError(false);
          setUserRole(role);
          loadHistory(token);
        }
      } catch {
        setRoleError(true);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAccessToken]);

  const loadHistory = async (token: string) => {
    try {
      const res = await fetch(getApiUrl("/api/research/history"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setHistory(data.searches ?? []);
    } catch {}
  };

  // Auto-scroll to bottom of response as tokens stream in
  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [streamedText]);

  // ── Search handler (SSE) ─────────────────────────────────────────────────────
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setStreamedText("");
    setSources([]);
    setSummary("");
    setRecapTable("");
    setProgress(null);
    setCurrentSearchId(null);
    setExportedVaultId(null);
    setErrorMsg(null);

    const token = await getAccessToken();
    if (!token) { setErrorMsg("Session expirée — veuillez vous reconnecter."); setIsSearching(false); return; }

    const endpoint = mode === "deepdive" ? "/api/research/deepdive" : "/api/research/query";

    try {
      const response = await fetch(getApiUrl(endpoint), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message ?? `HTTP ${response.status}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.type === "text") {
              setStreamedText((prev) => prev + payload.content);
            } else if (payload.type === "done") {
              setSources(payload.sources ?? []);
              setSummary(payload.summary ?? "");
              setCurrentSearchId(payload.searchId ?? null);
              loadHistory(token);
            } else if (payload.type === "table") {
              setRecapTable(payload.content ?? "");
            } else if (payload.type === "progress") {
              setProgress({ step: payload.step, pct: payload.pct, label: payload.label ?? payload.step, subQueries: payload.subQueries });
            } else if (payload.type === "error") {
              setErrorMsg(payload.message ?? "Une erreur est survenue.");
            }
          } catch {}
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Erreur de connexion au serveur.");
    } finally {
      setIsSearching(false);
      setProgress(null);
    }
  };

  // ── PDF export ────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    if (!currentSearchId || isExporting) return;
    setIsExporting(true);
    const token = await getAccessToken();
    try {
      const res = await fetch(getApiUrl(`/api/research/${currentSearchId}/export`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token ?? ""}` },
      });
      const data = await res.json();
      if (data.success) setExportedVaultId(data.vaultId);
      else setErrorMsg(data.message ?? "Erreur export PDF.");
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Erreur export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Load past search from history ────────────────────────────────────────────
  const loadSearch = async (id: string) => {
    const token = await getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(getApiUrl(`/api/research/${id}`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const s = data.search;
        setQuery(s.query);
        setMode(s.mode);
        setStreamedText(s.response_text ?? "");
        setSources(s.sources ?? []);
        setSummary(s.summary ?? "");
        setRecapTable(s.table_json ?? "");
        setCurrentSearchId(s.id);
        setExportedVaultId(s.pdf_vault_id ?? null);
        setErrorMsg(null);
      }
    } catch {}
  };

  // ── RBAC gate ─────────────────────────────────────────────────────────────────
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand-secondary)" }} />
      </div>
    );
  }

  if (roleError) {
    return (
      <div className="max-w-lg mx-auto py-20 px-6 text-center space-y-4">
        <Scale className="w-12 h-12 mx-auto mb-2" style={{ color: "var(--brand-secondary)" }} />
        <h2 className="text-xl font-semibold" style={{ color: "var(--brand-primary)", fontFamily: "var(--font-serif)" }}>
          Accès réservé
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          La Recherche Juridique IA (Module B) est réservée aux avocats et cabinets partenaires EasyLaw.
        </p>
        <a
          href="/assistant"
          className="inline-block mt-4 px-5 py-2.5 rounded-lg text-sm font-semibold text-white"
          style={{ background: "var(--brand-primary)" }}
        >
          Accéder à Luso-Legal →
        </a>
      </div>
    );
  }

  const hasResults = streamedText.length > 0;
  const isDone = hasResults && !isSearching;

  return (
    <div className="flex flex-col lg:flex-row gap-0 h-full min-h-0" style={{ height: "calc(100vh - 64px)" }}>
      {/* ── LEFT: History sidebar ──────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:border-r overflow-y-auto"
        style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}
      >
        <div className="p-4 border-b" style={{ borderColor: "var(--surface-mist)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Historique
          </p>
        </div>
        {history.length === 0 ? (
          <p className="text-xs p-4" style={{ color: "var(--text-muted)" }}>Aucune recherche</p>
        ) : (
          <ul className="flex-1 divide-y" style={{ borderColor: "var(--surface-mist)" }}>
            {history.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => loadSearch(item.id)}
                  className="w-full text-left px-4 py-3 hover:bg-black/5 transition text-xs"
                >
                  <p className="font-medium truncate mb-0.5" style={{ color: "var(--brand-primary)" }}>
                    {item.query}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                      style={{
                        background: item.mode === "deepdive" ? "var(--brand-secondary)" : "var(--surface-mist)",
                        color: item.mode === "deepdive" ? "var(--brand-primary)" : "var(--text-muted)",
                      }}
                    >
                      {item.mode === "deepdive" ? "DeepDive" : "Standard"}
                    </span>
                    <span style={{ color: "var(--text-muted)" }}>
                      {new Date(item.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* ── RIGHT: Main area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b shrink-0" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
          <form onSubmit={handleSearch} className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <textarea
                  ref={textareaRef}
                  rows={2}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSearch(e as any); } }}
                  placeholder="Posez votre question juridique… (Enter pour chercher, Shift+Enter pour saut de ligne)"
                  disabled={isSearching}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm resize-none focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/20 transition"
                  style={{ border: "1px solid var(--surface-mist)", color: "var(--brand-primary)", background: "var(--surface-page)" }}
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !query.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition self-start mt-0.5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45 disabled:opacity-50"
                style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>

            {/* Mode toggle */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("standard")}
                disabled={isSearching}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/30"
                style={
                  mode === "standard"
                    ? { background: "var(--brand-primary)", color: "var(--text-inverse)" }
                    : { border: "1px solid var(--surface-mist)", color: "var(--text-muted)" }
                }
              >
                <BookOpen className="w-3.5 h-3.5" />
                Standard
              </button>
              <button
                type="button"
                onClick={() => setMode("deepdive")}
                disabled={isSearching}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/30"
                style={
                  mode === "deepdive"
                    ? { background: "var(--brand-secondary)", color: "var(--brand-primary)" }
                    : { border: "1px solid var(--surface-mist)", color: "var(--text-muted)" }
                }
              >
                <Zap className="w-3.5 h-3.5" />
                DeepDive
              </button>
              {mode === "deepdive" && (
                <span className="text-[10px] self-center ml-1" style={{ color: "var(--text-muted)" }}>
                  Recherche exhaustive multi-sources · plus lente
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Results area */}
        <div ref={responseRef} className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Error */}
          {errorMsg && (
            <div
              className="flex gap-2 items-start p-3 rounded-xl text-sm border"
              style={{ background: "var(--status-red-bg)", borderColor: "var(--status-red-border)", color: "var(--status-red)" }}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* DeepDive progress bar */}
          {progress && (
            <div className="space-y-2">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface-mist)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress.pct}%`, background: "var(--brand-secondary)" }}
                />
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{progress.label}</p>
              {progress.subQueries && (
                <div className="flex flex-wrap gap-1.5">
                  {progress.subQueries.map((sq, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border font-mono" style={{ borderColor: "var(--surface-mist)", color: "var(--text-muted)" }}>
                      {sq}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!hasResults && !isSearching && !errorMsg && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <Scale className="w-10 h-10 opacity-30" style={{ color: "var(--brand-primary)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--brand-primary)" }}>Recherche Juridique IA — Module B</p>
              <p className="text-xs max-w-sm" style={{ color: "var(--text-muted)" }}>
                Posez une question juridique en langage naturel. Sources : DRE, DGSI, CURIA, EUR-Lex, CAAD.
              </p>
            </div>
          )}

          {/* Streaming response */}
          {(hasResults || isSearching) && (
            <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Analyse juridique</p>
              <div
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: "var(--brand-primary)" }}
              >
                {streamedText}
                {isSearching && !progress && (
                  <span className="inline-block w-1 h-4 ml-0.5 animate-pulse align-middle" style={{ background: "var(--brand-secondary)" }} />
                )}
              </div>
            </div>
          )}

          {/* Sources panel */}
          {isDone && sources.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Sources ({sources.length})
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 p-3 rounded-xl border hover:shadow-sm transition group"
                    style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)", textDecoration: "none" }}
                  >
                    <SourceBadge source={src.source} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium line-clamp-2 group-hover:underline" style={{ color: "var(--brand-primary)" }}>
                        {src.title}
                      </p>
                      {src.date && (
                        <p className="text-[10px] flex items-center gap-1 mt-0.5" style={{ color: "var(--text-muted)" }}>
                          <Clock className="w-3 h-3" /> {src.date}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="w-3 h-3 shrink-0 opacity-40 group-hover:opacity-100 mt-0.5" style={{ color: "var(--text-muted)" }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Summary card */}
          {isDone && summary && (
            <div className="rounded-xl border p-4" style={{ borderColor: "var(--surface-mist)", background: "rgba(212,160,23,0.06)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--brand-secondary)" }}>Résumé</p>
              <p className="text-sm" style={{ color: "var(--brand-primary)" }}>{summary}</p>
            </div>
          )}

          {/* DeepDive recap table */}
          {isDone && recapTable && (
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--surface-mist)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider p-3" style={{ color: "var(--text-muted)", background: "var(--surface-card)" }}>
                Tableau récapitulatif
              </p>
              <div
                className="p-4 text-sm overflow-x-auto"
                style={{ color: "var(--brand-primary)" }}
                dangerouslySetInnerHTML={{ __html: recapTable }}
              />
            </div>
          )}

          {/* PDF export */}
          {isDone && currentSearchId && (
            <div className="flex items-center gap-3">
              {!exportedVaultId ? (
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]/30"
                  style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
                >
                  {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                  {isExporting ? "Génération du PDF…" : "Exporter en PDF"}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm" style={{ color: "var(--status-green)" }}>
                  <CheckCircle className="w-4 h-4" />
                  PDF enregistré dans votre coffre
                  <a href="/vault" className="underline font-semibold" style={{ color: "var(--brand-primary)" }}>
                    Accéder au coffre →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function ResearchPage() {
  return (
    <AuthGuard>
      <AppShell
        requireAuth={false}
        activeSection="research"
        breadcrumb={[{ label: "Recherche Juridique IA" }]}
      >
        <ResearchPageContent />
      </AppShell>
    </AuthGuard>
  );
}
