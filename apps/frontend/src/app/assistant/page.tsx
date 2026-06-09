"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  AlertTriangle,
  Loader2,
  Award,
  Bot,
  HelpCircle,
  CheckCircle2,
  User,
} from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { useEasyLawAuth } from "@/lib/privy";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/site/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  inScope?: boolean;
}

// ─── Translations ─────────────────────────────────────────────────────────────

const translations = {
  FR: {
    title: "Luso-Legal",
    subtitle: "Assistant juridique — droit portugais & européen",
    placeholder: "Ex: Comment obtenir un NIF ? Quels sont les délais d'un bail ?",
    sendBtn: "Envoyer",
    escalateBtn: "Escalader vers un avocat",
    escalateModalTitle: "Escalader la consultation",
    escalateModalDesc:
      "Un avocat du cabinet partenaire Oliveira & Cameiro prendra en charge votre dossier. Résumez brièvement votre problème :",
    escalateSubmitBtn: "Soumettre à l'avocat",
    escalateCancelBtn: "Annuler",
    escalateSuccess:
      "Votre demande a été escaladée avec succès ! Un avocat de Oliveira & Cameiro vous recontactera sous 24h.",
    guardrailWarning:
      "Cette question est hors périmètre (non liée au droit portugais ou européen).",
    noHistory: "Débutez votre conversation. L'IA répond en quelques secondes sur les sujets de droit portugais & européen.",
    disclaimer: "Ceci n'est pas un avis juridique — consultez un avocat pour toute décision.",
    summaryPlaceholder: "Décrivez les détails de votre problème légal pour l'avocat…",
    errorGeneric: "Une erreur est survenue.",
    historyLoading: "Chargement de l'historique…",
  },
  PT: {
    title: "Luso-Legal",
    subtitle: "Assistente jurídico — direito português e europeu",
    placeholder: "Ex: Como obter um NIF? Quais são os prazos de arrendamento?",
    sendBtn: "Enviar",
    escalateBtn: "Escalar para um advogado",
    escalateModalTitle: "Escalar consulta jurídica",
    escalateModalDesc:
      "Um advogado do gabinete parceiro Oliveira & Cameiro tratará do seu caso. Resuma brevemente a sua questão:",
    escalateSubmitBtn: "Submeter para o advogado",
    escalateCancelBtn: "Cancelar",
    escalateSuccess:
      "O seu pedido foi escalado com sucesso! Um advogado da Oliveira & Cameiro entrará em contacto em 24h.",
    guardrailWarning:
      "Esta questão está fora de âmbito (não relacionada com direito português ou europeu).",
    noHistory: "Inicie a sua conversa. A IA responde em segundos sobre tópicos de direito português e europeu.",
    disclaimer: "Isto não é um parecer jurídico — consulte um advogado para qualquer decisão.",
    summaryPlaceholder: "Descreva os detalhes do seu problema jurídico para o advogado…",
    errorGeneric: "Ocorreu um erro.",
    historyLoading: "A carregar o histórico…",
  },
};

// ─── Inner content (uses Privy hook) ─────────────────────────────────────────

function AssistantPageContent() {
  const { getAccessToken } = useEasyLawAuth();

  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateSummary, setEscalateSummary] = useState("");
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalateSuccessMessage, setEscalateSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const t = translations[lang];

  useEffect(() => {
    initHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initHistory = async () => {
    const token = await getAccessToken();
    if (!token) { setIsHistoryLoading(false); return; }
    try {
      const res = await fetch(getApiUrl("/api/assistant/history"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setMessages(data.messages || []);
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const token = await getAccessToken();
    if (!token) return;

    const text = input.trim();
    setInput("");
    setIsLoading(true);
    setErrorMessage(null);

    setMessages((prev) => [
      ...prev,
      { id: Math.random().toString(), role: "user", content: text },
    ]);

    try {
      const res = await fetch(getApiUrl("/api/assistant/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) => [
          ...prev,
          { id: Math.random().toString(), role: "assistant", content: data.response, inScope: data.inScope },
        ]);
      } else {
        setErrorMessage(data.message || t.errorGeneric);
      }
    } catch {
      setErrorMessage(t.errorGeneric);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as unknown as React.FormEvent);
    }
  };

  const handleEscalate = async () => {
    if (!escalateSummary.trim() || isEscalating) return;
    const token = await getAccessToken();
    if (!token) return;

    setIsEscalating(true);
    setErrorMessage(null);
    try {
      const res = await fetch(getApiUrl("/api/assistant/escalate"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversation_summary: escalateSummary }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setEscalateSuccessMessage(data.message || t.escalateSuccess);
        setEscalateSummary("");
        setShowEscalateModal(false);
        setTimeout(() => setEscalateSuccessMessage(null), 8000);
      } else {
        setErrorMessage(data.message || t.errorGeneric);
      }
    } catch {
      setErrorMessage(t.errorGeneric);
    } finally {
      setIsEscalating(false);
    }
  };

  return (
    <div
      className="flex flex-col px-4 sm:px-6 lg:px-10 py-6"
      style={{ height: "calc(100vh - 56px)" }}
    >
      {/* Success / error banners */}
      {escalateSuccessMessage && (
        <div
          className="mb-4 p-3 rounded-lg border text-sm flex gap-2 items-center shrink-0"
          style={{ background: "var(--status-green-bg)", borderColor: "var(--status-green-border)", color: "var(--status-green)" }}
          role="alert"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <p>{escalateSuccessMessage}</p>
        </div>
      )}
      {errorMessage && (
        <div
          className="mb-4 p-3 rounded-lg border text-sm flex gap-2 items-center shrink-0"
          style={{ background: "var(--status-red-bg)", borderColor: "var(--status-red-border)", color: "var(--status-red)" }}
          role="alert"
        >
          <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Chat container */}
      <div
        className="flex-1 rounded-xl border flex flex-col overflow-hidden shadow-[var(--shadow-card)] min-h-0"
        style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}
      >
        {/* ── Chat header ──────────────────────────────────────────────────── */}
        <div
          className="px-5 py-4 flex items-center justify-between gap-4 shrink-0"
          style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
        >
          <div className="flex items-center gap-3">
            <Bot className="w-5 h-5 shrink-0" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
            <div>
              <h1 className="font-semibold text-base" style={{ fontFamily: "var(--font-serif)" }}>
                {t.title}
              </h1>
              <p className="text-xs opacity-70">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setLang(lang === "FR" ? "PT" : "FR")}
              className="px-2.5 py-1 rounded-md border text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/50"
              style={{ borderColor: "rgba(255,255,255,0.25)", color: "var(--text-inverse)" }}
              aria-label="Changer de langue"
            >
              {lang}
            </button>
            {messages.length > 0 && (
              <button
                onClick={() => setShowEscalateModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-white/50"
                style={{ background: "var(--brand-secondary)", color: "var(--brand-primary)" }}
              >
                <Award className="w-3.5 h-3.5" aria-hidden="true" />
                {t.escalateBtn}
              </button>
            )}
          </div>
        </div>

        {/* ── Messages area ─────────────────────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0"
          style={{ background: "var(--surface-page)" }}
          aria-live="polite"
          aria-label="Conversation"
        >
          {isHistoryLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
              <span className="ml-2 text-sm" style={{ color: "var(--text-muted)" }}>{t.historyLoading}</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <HelpCircle className="w-12 h-12 mb-3" style={{ color: "var(--surface-mist-strong)" }} aria-hidden="true" />
              <p className="text-sm max-w-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {t.noHistory}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.role === "user";
              const isOutOfScope = msg.role === "assistant" && msg.inScope === false;

              return (
                <div key={msg.id} className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "var(--brand-primary)" }}
                      aria-hidden="true"
                    >
                      <Bot className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} />
                    </div>
                  )}

                  <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-line shadow-sm ${
                        isUser
                          ? "rounded-2xl rounded-br-sm"
                          : isOutOfScope
                          ? "rounded-2xl rounded-bl-sm"
                          : "rounded-2xl rounded-bl-sm border"
                      }`}
                      style={
                        isUser
                          ? { background: "var(--brand-primary)", color: "var(--text-inverse)" }
                          : isOutOfScope
                          ? { background: "var(--status-amber-bg)", borderColor: "var(--status-amber-border)", color: "var(--text-primary)", border: "1px solid var(--status-amber-border)" }
                          : { background: "var(--surface-card)", borderColor: "var(--surface-mist)", color: "var(--text-primary)" }
                      }
                    >
                      {msg.content}

                      {isOutOfScope && (
                        <div
                          className="mt-2 pt-2 border-t flex items-center gap-1.5 text-xs"
                          style={{ borderColor: "var(--status-amber-border)", color: "var(--status-amber)" }}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          {t.guardrailWarning}
                        </div>
                      )}
                    </div>

                    {!isUser && (
                      <p className="text-[10px] italic px-1" style={{ color: "var(--text-muted)" }}>
                        {t.disclaimer}
                      </p>
                    )}
                  </div>

                  {isUser && (
                    <div
                      className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "var(--surface-mist)", color: "var(--text-secondary)" }}
                      aria-hidden="true"
                    >
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-2 justify-start">
              <div
                className="h-7 w-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "var(--brand-primary)" }}
                aria-hidden="true"
              >
                <Bot className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} />
              </div>
              <div
                className="px-4 py-3 rounded-2xl rounded-bl-sm border"
                style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
              >
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ background: "var(--text-muted)", animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input footer ──────────────────────────────────────────────────── */}
        <form
          onSubmit={handleSendMessage}
          className="flex gap-3 p-4 border-t shrink-0"
          style={{ borderColor: "var(--surface-mist)", background: "var(--surface-card)" }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t.placeholder}
            disabled={isLoading || isHistoryLoading}
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm resize-none transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/20"
            style={{
              border: "1px solid var(--surface-mist-strong)",
              color: "var(--text-primary)",
              background: "var(--surface-page)",
            }}
            aria-label="Votre message"
          />
          <button
            type="submit"
            disabled={isLoading || isHistoryLoading || !input.trim()}
            className="px-4 py-2.5 rounded-lg transition flex items-center justify-center shrink-0 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
            aria-label={t.sendBtn}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>

      {/* ── Escalation modal ─────────────────────────────────────────────────── */}
      {showEscalateModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{ background: "rgba(0,0,0,0.45)" }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="escalate-modal-title"
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6 shadow-[var(--shadow-modal)]"
            style={{ background: "var(--surface-card)", border: "1px solid var(--surface-mist)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-5 h-5" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
              <h2
                id="escalate-modal-title"
                className="text-lg font-semibold"
                style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
              >
                {t.escalateModalTitle}
              </h2>
            </div>

            <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {t.escalateModalDesc}
            </p>

            <textarea
              value={escalateSummary}
              onChange={(e) => setEscalateSummary(e.target.value)}
              placeholder={t.summaryPlaceholder}
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg text-sm resize-none mb-5 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/20"
              style={{
                border: "1px solid var(--surface-mist-strong)",
                color: "var(--text-primary)",
                background: "var(--surface-page)",
              }}
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowEscalateModal(false); setEscalateSummary(""); }}
                disabled={isEscalating}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition border focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45"
                style={{ borderColor: "var(--surface-mist-strong)", color: "var(--text-secondary)" }}
              >
                {t.escalateCancelBtn}
              </button>
              <button
                type="button"
                onClick={handleEscalate}
                disabled={isEscalating || !escalateSummary.trim()}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45 disabled:opacity-50"
                style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
              >
                {isEscalating && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {t.escalateSubmitBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function AssistantPage() {
  return (
    <AuthGuard>
      <AppShell
        requireAuth={false}
        activeSection="assistant"
        breadcrumb={[{ label: "Luso-Legal" }]}
      >
        <AssistantPageContent />
      </AppShell>
    </AuthGuard>
  );
}
