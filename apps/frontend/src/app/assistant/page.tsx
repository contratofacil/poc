"use client";

import React, { useState, useEffect, useRef } from "react";
import { Shield, Send, AlertTriangle, ArrowLeft, Loader2, Award, CheckCircle2, User, Bot, HelpCircle } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  inScope?: boolean;
}

const translations = {
  FR: {
    title: "Assistant Luso-Legal",
    subtitle: "Posez vos questions sur le droit portugais & européen",
    backBtn: "Retour",
    placeholder: "Ex: Comment obtenir un NIF ? Quels sont les délais d'un bail ?",
    sendBtn: "Envoyer",
    loginRequired: "Connexion requise",
    loginRequiredDesc: "Veuillez vous connecter pour accéder à l'assistant juridique.",
    loginBtn: "Se connecter",
    escalateBtn: "Escalader vers un avocat",
    escalateModalTitle: "Escalader la consultation",
    escalateModalDesc: "Un avocat du cabinet partenaire Oliveira & Cameiro prendra en charge votre dossier. Veuillez résumer brièvement votre problème complexe :",
    escalateSubmitBtn: "Soumettre à l'avocat",
    escalateCancelBtn: "Annuler",
    escalateSuccess: "Votre demande a été escaladée avec succès ! Un avocat de Oliveira & Cameiro vous recontactera sous 24h.",
    guardrailWarning: "Cette question a été identifiée comme hors périmètre (non liée au droit portugais ou européen).",
    noHistory: "Débutez votre conversation avec l'assistant juridique. L'IA répondra sous 3 secondes sur les sujets de droit portugais.",
    sourceLabel: "Source légale simulée :",
    summaryPlaceholder: "Décrivez les détails de votre problème légal pour l'avocat...",
    errorGeneric: "Une erreur est survenue.",
  },
  PT: {
    title: "Assistente Luso-Legal",
    subtitle: "Faça perguntas sobre o direito português e europeu",
    backBtn: "Voltar",
    placeholder: "Ex: Como obter um NIF? Quais são os prazos de um contrato de arrendamento?",
    sendBtn: "Enviar",
    loginRequired: "Autenticação necessária",
    loginRequiredDesc: "Por favor, inicie sessão para aceder ao assistente jurídico.",
    loginBtn: "Entrar",
    escalateBtn: "Escalar para um advogado",
    escalateModalTitle: "Escalar consulta jurídica",
    escalateModalDesc: "Um advogado do gabinete parceiro Oliveira & Cameiro tratará do seu caso. Por favor, resuma brevemente a sua questão complexa:",
    escalateSubmitBtn: "Submeter para o advogado",
    escalateCancelBtn: "Cancelar",
    escalateSuccess: "O seu pedido foi escalado com sucesso! Um advogado da Oliveira & Cameiro entrará em contacto em 24h.",
    guardrailWarning: "Esta questão foi identificada como fora de âmbito (não relacionada com direito português ou europeu).",
    noHistory: "Inicie a sua conversa com o assistente jurídico. A IA responderá em menos de 3 segundos sobre tópicos legais.",
    sourceLabel: "Fonte legal simulada:",
    summaryPlaceholder: "Descreva os detalhes do seu problema jurídico para o advogado...",
    errorGeneric: "Ocorreu um erro.",
  }
};

export default function AssistantPage() {
  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escalateSummary, setEscalateSummary] = useState("");
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalateSuccessMessage, setEscalateSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const t = translations[lang];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
      fetchHistory(token);
    } else {
      setIsHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchHistory = async (token: string) => {
    try {
      const res = await fetch("http://localhost:3001/api/assistant/history", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const userMessageText = input;
    setInput("");
    setIsLoading(true);
    setErrorMessage(null);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      role: "user",
      content: userMessageText,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch("http://localhost:3001/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessageText }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            role: "assistant",
            content: data.response,
            inScope: data.inScope,
          },
        ]);
      } else {
        setErrorMessage(data.message || t.errorGeneric);
      }
    } catch (err) {
      setErrorMessage(t.errorGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!escalateSummary.trim() || isEscalating) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setIsEscalating(true);
    setErrorMessage(null);

    try {
      const res = await fetch("http://localhost:3001/api/assistant/escalate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ conversation_summary: escalateSummary }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEscalateSuccessMessage(data.message || t.escalateSuccess);
        setEscalateSummary("");
        setShowEscalateModal(false);
        setTimeout(() => {
          setEscalateSuccessMessage(null);
        }, 8000);
      } else {
        setErrorMessage(data.message || t.errorGeneric);
      }
    } catch (err) {
      setErrorMessage(t.errorGeneric);
    } finally {
      setIsEscalating(false);
    }
  };

  if (isHistoryLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center font-serif text-[#1A365D]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C] mr-2" />
        Chargement de l'assistant...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 antialiased selection:bg-[#C9A84C] selection:text-white">
        <div className="w-full max-w-md bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-8 text-center">
          <Shield className="w-12 h-12 text-[#C9A84C] mx-auto mb-4" />
          <h1 className="text-xl font-bold text-[#1A365D] font-serif mb-2">{t.loginRequired}</h1>
          <p className="text-gray-500 text-sm mb-6">{t.loginRequiredDesc}</p>
          <Link
            href="/login"
            className="inline-block w-full py-3 px-4 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition"
          >
            {t.loginBtn}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] flex flex-col antialiased selection:bg-[#C9A84C] selection:text-white">
      {/* Premium Header */}
      <header className="bg-white border-b border-[#E2E8F0] px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-[#1A365D]">
              <Shield className="w-7 h-7 text-[#C9A84C]" />
              <span className="font-bold text-xl font-serif">EasyLaw</span>
            </Link>
            <span className="h-4 w-px bg-gray-200"></span>
            <div className="hidden sm:block">
              <h1 className="text-[#1A365D] font-serif font-semibold text-sm">{t.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setLang(lang === "FR" ? "PT" : "FR")}
              className="px-2.5 py-1 rounded-full border border-[#E2E8F0] text-xs font-semibold text-[#1A365D] hover:bg-[#FAFAF8] transition"
            >
              {lang}
            </button>
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-semibold text-[#1A365D] hover:text-[#C9A84C] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.backBtn}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main chat window container */}
      <section className="flex-1 max-w-5xl w-full mx-auto p-4 flex flex-col justify-between overflow-hidden">
        {/* Escalation Success message */}
        {escalateSuccessMessage && (
          <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex gap-3 items-center shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <p className="font-medium">{escalateSuccessMessage}</p>
          </div>
        )}

        {/* Error banner */}
        {errorMessage && (
          <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex gap-3 items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        <div className="bg-white border border-[#E2E8F0] shadow-md rounded-2xl flex-1 flex flex-col min-h-[500px] max-h-[700px] overflow-hidden">
          {/* Chat Header Actions */}
          <div className="bg-[#1A365D] text-white px-6 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#C9A84C]" />
              <div>
                <h2 className="font-semibold text-sm font-serif">{t.title}</h2>
                <p className="text-[10px] text-gray-300">RAG-powered Portuguese Law System</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => setShowEscalateModal(true)}
                className="bg-[#C9A84C] hover:bg-[#C9A84C]/95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5" />
                <span>{t.escalateBtn}</span>
              </button>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FAFAF8]/50">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <HelpCircle className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm max-w-sm leading-relaxed">{t.noHistory}</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === "user";
                const isOutofScope = msg.role === "assistant" && msg.inScope === false;

                return (
                  <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                      isUser
                        ? "bg-[#1A365D] text-white rounded-br-none"
                        : isOutofScope
                        ? "bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-none"
                        : "bg-white border border-[#E2E8F0] text-[#1A365D] rounded-bl-none"
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-bold tracking-wider opacity-60">
                        {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        <span>{isUser ? "Vous" : "IA Assistant"}</span>
                      </div>
                      
                      <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>

                      {isOutofScope && (
                        <div className="mt-2 pt-2 border-t border-amber-200 flex items-center gap-1.5 text-xs text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{t.guardrailWarning}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* User Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-[#E2E8F0] bg-white flex gap-2 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:ring-2 focus:ring-[#1A365D]/20 focus:border-[#1A365D] text-sm focus:outline-none disabled:bg-gray-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#1A365D] hover:bg-[#1A365D]/90 text-white p-2.5 rounded-lg transition disabled:opacity-50 shrink-0"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </section>

      {/* Escalation Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl max-w-lg w-full p-6 animate-scale-up">
            <div className="flex items-center gap-2 text-[#1A365D] mb-4">
              <Award className="w-6 h-6 text-[#C9A84C]" />
              <h3 className="font-bold text-lg font-serif">{t.escalateModalTitle}</h3>
            </div>
            
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              {t.escalateModalDesc}
            </p>

            <textarea
              value={escalateSummary}
              onChange={(e) => setEscalateSummary(e.target.value)}
              placeholder={t.summaryPlaceholder}
              rows={4}
              className="w-full px-3 py-2 border border-[#E2E8F0] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A365D]/20 focus:border-[#1A365D] mb-6 resize-none"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowEscalateModal(false);
                  setEscalateSummary("");
                }}
                disabled={isEscalating}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                {t.escalateCancelBtn}
              </button>
              <button
                type="button"
                onClick={handleEscalate}
                disabled={isEscalating || !escalateSummary.trim()}
                className="px-4 py-2 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
              >
                {isEscalating && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{t.escalateSubmitBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
