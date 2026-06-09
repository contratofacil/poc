"use client";

import React, { useState, useEffect } from "react";
import { Shield, Globe, Check, AlertCircle, Clock, ArrowRight, RefreshCw, CreditCard } from "lucide-react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";

const translations = {
  FR: {
    title: "Suivi de Dossier NIF",
    subtitle: "Consultez l'état d'avancement de votre demande de NIF",
    enterUserId: "Entrez votre identifiant utilisateur pour suivre votre dossier :",
    searchBtn: "Rechercher",
    noDossierTitle: "Aucun dossier trouvé",
    noDossierDesc: "Nous n'avons pas trouvé de demande de NIF associée à cet identifiant.",
    createDossierBtn: "Créer une demande",
    paymentStatusLabel: "Statut du Paiement",
    paid: "Payé",
    pending: "En attente de paiement",
    simulatePaymentBtn: "Simuler le Paiement (Checkout + Webhook)",
    successMsg: "Votre paiement a été reçu. Notre équipe traite actuellement votre dossier.",
    currentStepLabel: "Étape actuelle",
    updatedAt: "Mis à jour le",
    loading: "Chargement des informations...",
    statusLabel: "Statut du dossier",
    backToHome: "Retour à l'accueil",
    steps: {
      "Reçu": { title: "Dossier Reçu", desc: "Votre dossier a été soumis et est en attente de vérification de paiement." },
      "En traitement": { title: "En Cours de Traitement", desc: "Nos experts juridiques analysent et soumettent vos documents aux autorités fiscales." },
      "NIF obtenu": { title: "NIF Obtenu", desc: "Félicitations ! Votre numéro fiscal portugais a été généré par l'administration." },
      "Notifié": { title: "Dossier Notifié", desc: "Le certificat NIF vous a été envoyé par e-mail et est disponible dans votre espace." },
    },
  },
  PT: {
    title: "Acompanhamento do Processo NIF",
    subtitle: "Consulte o estado do seu pedido de NIF",
    enterUserId: "Introduza o seu ID de utilizador para acompanhar o processo:",
    searchBtn: "Procurar",
    noDossierTitle: "Nenhum processo encontrado",
    noDossierDesc: "Não encontrámos nenhum pedido de NIF associado a este identificador.",
    createDossierBtn: "Criar um pedido",
    paymentStatusLabel: "Estado do Pagamento",
    paid: "Pago",
    pending: "Aguardando pagamento",
    simulatePaymentBtn: "Simular Pagamento (Checkout + Webhook)",
    successMsg: "O seu pagamento foi recebido. A nossa equipa está a processar o seu pedido.",
    currentStepLabel: "Etapa atual",
    updatedAt: "Atualizado em",
    loading: "A carregar informações...",
    statusLabel: "Estado do processo",
    backToHome: "Voltar ao início",
    steps: {
      "Reçu": { title: "Processo Recebido", desc: "O seu processo foi submetido e aguarda verificação do pagamento." },
      "En traitement": { title: "Em Processamento", desc: "Os nossos especialistas estão a analisar e a submeter os seus documentos às finanças." },
      "NIF obtenu": { title: "NIF Obtido", desc: "Parabéns! O seu número fiscal português foi gerado pela administração fiscal." },
      "Notifié": { title: "Processo Notificado", desc: "O certificado do NIF foi-lhe enviado por e-mail e está disponível na sua área de cliente." },
    },
  },
};

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export default function NifStatusPage() {
  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const [userIdInput, setUserIdInput] = useState("");
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUserId = params.get("user_id");
    if (urlUserId) { setActiveUserId(urlUserId); setUserIdInput(urlUserId); return; }

    const token = localStorage.getItem("token");
    if (token) {
      const decoded = parseJwt(token);
      if (decoded?.id) { setActiveUserId(decoded.id); setUserIdInput(decoded.id); }
    }
  }, []);

  const fetchStatus = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(getApiUrl(`/api/nif/status?user_id=${uid}`));
      if (!response.ok) {
        if (response.status === 404) setStatusData(null);
        throw new Error("No dossier found or server error");
      }
      setStatusData(await response.json());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeUserId) fetchStatus(activeUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUserId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (userIdInput.trim()) setActiveUserId(userIdInput.trim());
  };

  const handleSimulatePayment = async () => {
    if (!activeUserId) return;
    setPaymentLoading(true);
    try {
      const paymentRes = await fetch(getApiUrl("/api/nif/payment"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: activeUserId, method: "stripe", amount: 99.0, currency: "EUR" }),
      });
      if (!paymentRes.ok) throw new Error("Payment initiation failed");
      const paymentData = await paymentRes.json();

      const webhookRes = await fetch(getApiUrl("/api/nif/payment/webhook"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stripe_id: paymentData.stripeSessionId }),
      });
      if (!webhookRes.ok) throw new Error("Webhook simulation failed");

      await fetchStatus(activeUserId);
    } catch (err: unknown) {
      alert("Simulation error: " + (err instanceof Error ? err.message : err));
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4 antialiased"
      style={{ background: "var(--surface-page)" }}
    >
      {/* Background blurs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: "var(--brand-primary)" }} />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: "var(--brand-secondary)" }} />
      </div>

      <div
        className="w-full max-w-2xl rounded-2xl p-6 md:p-8 relative z-10 shadow-[var(--shadow-modal)] border"
        style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center mb-6 pb-4 border-b"
          style={{ borderColor: "var(--surface-mist)" }}
        >
          <Link
            href="/"
            className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45 rounded"
            style={{ color: "var(--brand-primary)" }}
          >
            <Shield className="w-6 h-6" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
            <span className="font-semibold text-lg" style={{ fontFamily: "var(--font-serif)" }}>
              EasyLaw
            </span>
          </Link>
          <button
            onClick={() => setLang(lang === "FR" ? "PT" : "FR")}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45"
            style={{ borderColor: "var(--surface-mist-strong)", color: "var(--text-secondary)" }}
          >
            <Globe className="w-4 h-4" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
            <span className="font-semibold">{lang}</span>
          </button>
        </div>

        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-xl font-bold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
            {t.title}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.subtitle}</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder={t.enterUserId}
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg text-sm transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/20"
            style={{ border: "1px solid var(--surface-mist-strong)", color: "var(--text-primary)", background: "var(--surface-page)" }}
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45"
            style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
          >
            {t.searchBtn}
          </button>
        </form>

        {error && (
          <div className="p-3 mb-4 rounded-lg border text-sm" style={{ background: "var(--status-red-bg)", borderColor: "var(--status-red-border)", color: "var(--status-red)" }} role="alert">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12 flex flex-col items-center gap-3" style={{ color: "var(--text-secondary)" }}>
            <RefreshCw className="w-8 h-8 animate-spin" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
            <span className="text-sm">{t.loading}</span>
          </div>
        )}

        {!loading && !statusData && activeUserId && (
          <div
            className="text-center py-10 rounded-xl border border-dashed"
            style={{ background: "var(--surface-page)", borderColor: "var(--surface-mist-strong)" }}
          >
            <AlertCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
            <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
              {t.noDossierTitle}
            </h3>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: "var(--text-secondary)" }}>
              {t.noDossierDesc}
            </p>
            <Link
              href="/nif"
              className="inline-flex items-center gap-2 py-2 px-5 rounded-lg text-sm font-semibold transition shadow-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-secondary)]/45"
              style={{ background: "var(--brand-secondary)", color: "var(--brand-primary)" }}
            >
              {t.createDossierBtn}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        )}

        {!loading && statusData && (
          <div className="space-y-6">
            {/* Status card */}
            <div
              className="rounded-xl border p-5"
              style={{ background: "var(--surface-page)", borderColor: "var(--surface-mist)" }}
            >
              <div
                className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 pb-4 border-b"
                style={{ borderColor: "var(--surface-mist)" }}
              >
                <div>
                  <span className="block text-xs font-bold uppercase mb-0.5" style={{ color: "var(--text-muted)" }}>
                    {t.statusLabel}
                  </span>
                  <span className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
                    {statusData.status}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase mb-0.5 md:text-right" style={{ color: "var(--text-muted)" }}>
                    {t.paymentStatusLabel}
                  </span>
                  {statusData.paymentStatus === "paid" ? (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                      style={{ background: "var(--status-green-bg)", borderColor: "var(--status-green-border)", color: "var(--status-green)" }}
                    >
                      <Check className="w-3.5 h-3.5" aria-hidden="true" />
                      {t.paid}
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
                      style={{ background: "var(--status-amber-bg)", borderColor: "var(--status-amber-border)", color: "var(--status-amber)" }}
                    >
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      {t.pending}
                    </span>
                  )}
                </div>
              </div>

              {statusData.paymentStatus !== "paid" && (
                <button
                  onClick={handleSimulatePayment}
                  disabled={paymentLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-bold transition border border-dashed focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-secondary)]/45 disabled:opacity-50"
                  style={{ borderColor: "var(--brand-secondary)", background: "rgba(212,160,23,0.05)", color: "var(--brand-secondary)" }}
                >
                  <CreditCard className="w-4 h-4" aria-hidden="true" />
                  {paymentLoading ? "Simulation..." : t.simulatePaymentBtn}
                </button>
              )}

              {statusData.paymentStatus === "paid" && (
                <p
                  className="text-xs p-2.5 rounded-lg border"
                  style={{ background: "var(--status-green-bg)", borderColor: "var(--status-green-border)", color: "var(--status-green)" }}
                >
                  {t.successMsg}
                </p>
              )}
            </div>

            {/* Timeline */}
            <div>
              <h3 className="font-bold text-lg mb-6" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
                Timeline
              </h3>

              <div
                className="relative border-l-2 ml-3 pl-6 space-y-8"
                style={{ borderColor: "var(--surface-mist-strong)" }}
              >
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {statusData.timeline.map((stepItem: any, index: number) => {
                  const stepText = t.steps[stepItem.step as keyof typeof t.steps] || { title: stepItem.step, desc: "" };
                  const isCompleted = stepItem.status === "completed";
                  const isCurrent = stepItem.status === "current";

                  return (
                    <div key={index} className="relative">
                      <span
                        className="absolute -left-[33px] top-0 flex items-center justify-center w-6 h-6 rounded-full border transition-all duration-300"
                        style={
                          isCompleted
                            ? { background: "var(--status-green)", borderColor: "var(--status-green)", color: "var(--text-inverse)" }
                            : isCurrent
                            ? { background: "var(--surface-card)", borderColor: "var(--brand-secondary)", color: "var(--brand-secondary)", boxShadow: "0 0 0 4px rgba(212,160,23,0.12)" }
                            : { background: "var(--surface-card)", borderColor: "var(--surface-mist-strong)", color: "var(--text-muted)" }
                        }
                      >
                        {isCompleted ? (
                          <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--brand-secondary)" }} />
                        ) : (
                          <span className="text-[10px] font-bold">{index + 1}</span>
                        )}
                      </span>

                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <h4
                            className="font-semibold text-sm"
                            style={{ color: isCurrent ? "var(--brand-secondary)" : "var(--brand-primary)" }}
                          >
                            {stepText.title}
                          </h4>
                          {stepItem.date && (
                            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                              {t.updatedAt} {new Date(stepItem.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {stepText.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div
          className="mt-8 pt-4 border-t flex justify-end"
          style={{ borderColor: "var(--surface-mist)" }}
        >
          <Link
            href="/"
            className="text-xs font-bold transition hover:opacity-80 focus-visible:outline-none"
            style={{ color: "var(--text-muted)" }}
          >
            {t.backToHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
