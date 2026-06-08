"use client";

import React, { useState, useEffect } from "react";
import { Shield, Globe, Check, AlertCircle, Clock, CheckCircle, ArrowRight, RefreshCw, CreditCard } from "lucide-react";
import Link from "next/link";

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
      "Reçu": {
        title: "Dossier Reçu",
        desc: "Votre dossier a été soumis et est en attente de vérification de paiement."
      },
      "En traitement": {
        title: "En Cours de Traitement",
        desc: "Nos experts juridiques analysent et soumettent vos documents aux autorités fiscales."
      },
      "NIF obtenu": {
        title: "NIF Obtenu",
        desc: "Félicitations ! Votre numéro fiscal portugais a été généré par l'administration."
      },
      "Notifié": {
        title: "Dossier Notifié",
        desc: "Le certificat NIF vous a été envoyé par e-mail et est disponible dans votre espace."
      }
    }
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
      "Reçu": {
        title: "Processo Recebido",
        desc: "O seu processo foi submetido e aguarda verificação do pagamento."
      },
      "En traitement": {
        title: "Em Processamento",
        desc: "Os nossos especialistas estão a analisar e a submeter os seus documentos às finanças."
      },
      "NIF obtenu": {
        title: "NIF Obtido",
        desc: "Parabéns! O seu número fiscal português foi gerado pela administração fiscal."
      },
      "Notifié": {
        title: "Processo Notificado",
        desc: "O certificado do NIF foi-lhe enviado por e-mail e está disponível na sua área de cliente."
      }
    }
  }
};

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export default function NifStatusPage() {
  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const [userIdInput, setUserIdInput] = useState("");
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    // 1. Check URL parameters
    const params = new URLSearchParams(window.location.search);
    const urlUserId = params.get("user_id");
    
    if (urlUserId) {
      setActiveUserId(urlUserId);
      setUserIdInput(urlUserId);
      return;
    }

    // 2. Check token in localStorage
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = parseJwt(token);
      if (decoded && decoded.id) {
        setActiveUserId(decoded.id);
        setUserIdInput(decoded.id);
        return;
      }
    }
  }, []);

  const fetchStatus = async (uid: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3001/api/nif/status?user_id=${uid}`);
      if (!response.ok) {
        if (response.status === 404) {
          setStatusData(null);
        }
        throw new Error("No dossier found or server error");
      }
      const data = await response.json();
      setStatusData(data);
    } catch (err: any) {
      setError(err.message || "Failed to load status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeUserId) {
      fetchStatus(activeUserId);
    }
  }, [activeUserId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (userIdInput.trim()) {
      setActiveUserId(userIdInput.trim());
    }
  };

  // Simulation of payment + webhook triggers to ease testing
  const handleSimulatePayment = async () => {
    if (!activeUserId) return;
    setPaymentLoading(true);
    try {
      // 1. Create a stripe payment
      const paymentRes = await fetch("http://localhost:3001/api/nif/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: activeUserId,
          method: "stripe",
          amount: 99.00,
          currency: "EUR"
        })
      });

      if (!paymentRes.ok) throw new Error("Payment initiation failed");
      const paymentData = await paymentRes.json();

      // 2. Trigger mock webhook
      const webhookRes = await fetch("http://localhost:3001/api/nif/payment/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stripe_id: paymentData.stripeSessionId
        })
      });

      if (!webhookRes.ok) throw new Error("Webhook simulation failed");

      // 3. Refresh status
      await fetchStatus(activeUserId);
    } catch (err: any) {
      alert("Simulation error: " + err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const toggleLanguage = () => {
    setLang(lang === "FR" ? "PT" : "FR");
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-4 antialiased selection:bg-[#C9A84C] selection:text-white">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#1A365D] blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#C9A84C] blur-3xl"></div>
      </div>

      <div className="w-full max-w-2xl bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-6 md:p-8 relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#E2E8F0]">
          <Link href="/" className="flex items-center gap-2 text-[#1A365D]">
            <Shield className="w-6 h-6 text-[#C9A84C]" />
            <span className="font-semibold text-lg font-serif">EasyLaw</span>
          </Link>
          <button
            onClick={toggleLanguage}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2E8F0] text-sm text-[#1A365D] hover:bg-[#FAFAF8] transition"
          >
            <Globe className="w-4 h-4 text-[#C9A84C]" />
            <span className="font-semibold">{lang}</span>
          </button>
        </div>

        {/* User Search Bar */}
        <form onSubmit={handleSearch} className="mb-6 flex gap-2">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t.enterUserId}
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:border-[#1A365D] focus:outline-none text-sm transition"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition"
          >
            {t.searchBtn}
          </button>
        </form>

        {loading && (
          <div className="text-center py-12 text-[#64748B] flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#C9A84C]" />
            <span>{t.loading}</span>
          </div>
        )}

        {!loading && !statusData && activeUserId && (
          <div className="text-center py-10 border border-dashed border-[#E2E8F0] rounded-xl bg-[#FAFAF8]">
            <AlertCircle className="w-12 h-12 text-[#C9A84C] mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-[#1A365D] font-serif mb-1">{t.noDossierTitle}</h3>
            <p className="text-sm text-[#64748B] mb-6 max-w-sm mx-auto">{t.noDossierDesc}</p>
            <Link
              href="/nif"
              className="inline-flex items-center gap-2 py-2 px-5 bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-white rounded-lg text-sm font-semibold transition shadow-sm"
            >
              <span>{t.createDossierBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {!loading && statusData && (
          <div className="space-y-6">
            {/* Status and Payment Indicator Card */}
            <div className="bg-[#FAFAF8] border border-[#E2E8F0] rounded-xl p-5">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4 pb-4 border-b border-[#E2E8F0]">
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase">{t.statusLabel}</span>
                  <span className="text-lg font-bold text-[#1A365D] font-serif">{statusData.status}</span>
                </div>
                
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase md:text-right">{t.paymentStatusLabel}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {statusData.paymentStatus === "paid" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                        <Check className="w-3.5 h-3.5" />
                        {t.paid}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-800 border border-yellow-200">
                        <Clock className="w-3.5 h-3.5" />
                        {t.pending}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Simulate payment helper for testing */}
              {statusData.paymentStatus !== "paid" && (
                <button
                  onClick={handleSimulatePayment}
                  disabled={paymentLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-dashed border-[#C9A84C] bg-[#C9A84C]/5 text-[#C9A84C] hover:bg-[#C9A84C]/10 rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4" />
                  {paymentLoading ? "Simulation..." : t.simulatePaymentBtn}
                </button>
              )}

              {statusData.paymentStatus === "paid" && (
                <p className="text-xs text-green-700 bg-green-50/50 p-2.5 rounded-lg border border-green-100/50">
                  {t.successMsg}
                </p>
              )}
            </div>

            {/* Timeline UI */}
            <div>
              <h3 className="font-serif font-bold text-[#1A365D] mb-6 text-lg">Timeline</h3>

              <div className="relative border-l-2 border-[#E2E8F0] ml-3 pl-6 space-y-8">
                {statusData.timeline.map((stepItem: any, index: number) => {
                  const stepText = t.steps[stepItem.step as keyof typeof t.steps] || { title: stepItem.step, desc: "" };
                  const isCompleted = stepItem.status === "completed";
                  const isCurrent = stepItem.status === "current";
                  
                  return (
                    <div key={index} className="relative">
                      {/* Node circle */}
                      <span className={`absolute -left-[33px] top-0 flex items-center justify-center w-6 h-6 rounded-full border transition-all duration-300 ${
                        isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : isCurrent
                          ? "bg-white border-[#C9A84C] text-[#C9A84C] ring-4 ring-[#C9A84C]/10"
                          : "bg-white border-[#E2E8F0] text-gray-400"
                      }`}>
                        {isCompleted ? (
                          <Check className="w-3.5 h-3.5 font-bold" />
                        ) : isCurrent ? (
                          <span className="w-2 h-2 bg-[#C9A84C] rounded-full animate-pulse" />
                        ) : (
                          <span className="text-[10px] font-bold">{index + 1}</span>
                        )}
                      </span>

                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <h4 className={`font-semibold text-sm transition-colors ${
                            isCurrent ? "text-[#C9A84C]" : "text-[#1A365D]"
                          }`}>
                            {stepText.title}
                          </h4>
                          {stepItem.date && (
                            <span className="text-[10px] text-[#64748B]">
                              {t.updatedAt} {new Date(stepItem.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#64748B] leading-relaxed">
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

        <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex justify-end">
          <Link
            href="/"
            className="text-xs font-bold text-[#64748B] hover:text-[#1A365D] transition"
          >
            {t.backToHome}
          </Link>
        </div>
      </div>
    </main>
  );
}
