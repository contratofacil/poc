"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, AlertCircle, FileText, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getApiUrl } from "@/lib/api";
import { useEasyLawAuth } from "@/lib/privy";
import { AuthGuard } from "@/components/auth/AuthGuard";

// ─── Design constants ─────────────────────────────────────────────────────────

const CLS_BTN_PRIMARY = [
  "inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition",
  "bg-brand-primary text-text-inverse shadow-card",
  "hover:bg-brand-primary-hover",
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

const CLS_BTN_OUTLINE = [
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition",
  "border border-surface-mist bg-transparent text-text-secondary",
  "hover:bg-surface-page",
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

const CLS_INPUT = [
  "w-full px-3.5 py-2.5 rounded-lg text-sm transition",
  "bg-surface-card border border-surface-mist-strong",
  "text-text-primary placeholder:text-text-muted",
  "focus:outline-none focus:border-brand-primary focus:ring-[3px] focus:ring-brand-primary/20",
].join(" ");

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Question {
  key: string;
  label: string;
  placeholder: string;
  type: string;
}

const bailQuestions: Question[] = [
  { key: "bailleur", label: "Nom complet du propriétaire (Bailleur)", placeholder: "Ex: M. Jean Dupont", type: "text" },
  { key: "preneur", label: "Nom complet du locataire (Preneur)", placeholder: "Ex: Mme Marie Curie", type: "text" },
  { key: "adresse", label: "Adresse exacte du logement", placeholder: "Ex: Rua da Prata 120, Lisbonne", type: "text" },
  { key: "loyer", label: "Montant du loyer mensuel (EUR)", placeholder: "Ex: 950", type: "number" },
  { key: "duree", label: "Durée du bail (mois)", placeholder: "Ex: 12", type: "number" },
  { key: "debut", label: "Date d'effet du bail", placeholder: "2026-06-01", type: "date" },
  { key: "paiement", label: "Mode de paiement du loyer", placeholder: "Ex: Virement bancaire", type: "text" },
];

const travailQuestions: Question[] = [
  { key: "employeur", label: "Dénomination de l'employeur", placeholder: "Ex: EasyLaw Lda", type: "text" },
  { key: "salarie", label: "Nom complet du salarié", placeholder: "Ex: M. Albert Einstein", type: "text" },
  { key: "poste", label: "Intitulé du poste occupé", placeholder: "Ex: Développeur Fullstack", type: "text" },
  { key: "salaire", label: "Salaire mensuel brut (EUR)", placeholder: "Ex: 2500", type: "number" },
  { key: "heures", label: "Durée hebdomadaire de travail (heures)", placeholder: "Ex: 40", type: "number" },
  { key: "debut", label: "Date de début de l'activité", placeholder: "2026-06-01", type: "date" },
  { key: "essai", label: "Période d'essai (jours)", placeholder: "Ex: 30", type: "number" },
];

// ─── Inner component (needs useSearchParams) ──────────────────────────────────

function WizardForm() {
  const searchParams = useSearchParams();

  const templateId = searchParams.get("templateId") || "bail_habitation";
  const contractType = searchParams.get("type") || "Bail";

  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedContractId, setGeneratedContractId] = useState<string | null>(null);
  const [compiledContent, setCompiledContent] = useState<string>("");

  const { getAccessToken } = useEasyLawAuth();

  const questions = contractType === "Bail" ? bailQuestions : travailQuestions;
  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep - 1];

  // Update dynamic preview
  useEffect(() => {
    let preview = `CONTRAT DE ${contractType.toUpperCase()}\n\n`;
    if (contractType === "Bail") {
      preview += `Entre les soussignés :\n`;
      preview += `Le Bailleur : ${formData.bailleur || "[Nom du Propriétaire]"}\n`;
      preview += `Le Preneur : ${formData.preneur || "[Nom du Locataire]"}\n\n`;
      preview += `Il a été convenu ce qui suit :\n\n`;
      preview += `1. Le logement est situé à l'adresse suivante : ${formData.adresse || "[Adresse du bien]"}.\n\n`;
      preview += `2. Le loyer mensuel est fixé à ${formData.loyer || "[loyer]"} EUR. (Ref: Art. 1040 du Code Civil Portugais)\n\n`;
      preview += `3. Le bail est conclu pour une durée de ${formData.duree || "[duree]"} mois. (Ref: Art. 1042 du Code Civil Portugais)\n\n`;
      preview += `4. Date d'effet : ${formData.debut || "[Date de début]"}.\n\n`;
      preview += `5. Règlement : Le loyer sera payé par ${formData.paiement || "[Mode de paiement]"}.\n`;
    } else {
      preview += `Entre les soussignés :\n`;
      preview += `L'Employeur : ${formData.employeur || "[Nom de l'Employeur]"}\n`;
      preview += `Le Salarié : ${formData.salarie || "[Nom du Salarié]"}\n\n`;
      preview += `Il a été convenu ce qui suit :\n\n`;
      preview += `1. Le salarié exercera les fonctions de : ${formData.poste || "[Poste]"}.\n\n`;
      preview += `2. Le salarié perçoit un salaire brut mensuel de ${formData.salaire || "[salaire]"} EUR. (Ref: Art. 273 du Code du Travail)\n\n`;
      preview += `3. Temps de travail : Le contrat de travail est conclu pour une durée hebdomadaire de ${formData.heures || "[heures]"} heures.\n\n`;
      preview += `4. Date de début : Le contrat prend effet le ${formData.debut || "[Date de début]"}.\n\n`;
      preview += `5. Période d'essai : La période d'essai est fixée à ${formData.essai || "[Période d'essai]"} jours.\n`;
    }
    setCompiledContent(preview);
  }, [formData, contractType]);

  const handleInputChange = (value: string) => {
    setFormData((prev) => ({ ...prev, [currentQuestion.key]: value }));
    setError(null);
  };

  const handleNext = () => {
    if (!formData[currentQuestion.key]) {
      setError(lang === "FR" ? "Veuillez répondre à cette question." : "Por favor, responda a esta pergunta.");
      return;
    }
    setError(null);
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      submitContract();
    }
  };

  const handlePrev = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const submitContract = async () => {
    setIsSubmitting(true);
    setError(null);
    const token = await getAccessToken();
    try {
      const response = await fetch(getApiUrl("/api/contracts/generate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: contractType,
          template_id: templateId,
          data: formData,
        }),
      });

      const resData = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(resData.message || "Erreur de génération");
      }

      setGeneratedContractId(resData.contractId);
      await fetchOfficialPreview(resData.contractId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchOfficialPreview = async (contractId: string) => {
    const token = await getAccessToken();
    try {
      const response = await fetch(getApiUrl(`/api/contracts/${contractId}/preview`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.compiledContent) {
          setCompiledContent(data.compiledContent);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const minsRemaining = Math.max(1, totalSteps - currentStep + 1);

  return (
    <div className="min-h-screen bg-surface-page">

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-surface-mist sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--brand-primary)" }}>
              <span className="text-text-inverse font-bold text-sm font-serif">E</span>
            </div>
            <span className="font-semibold font-serif" style={{ color: "var(--brand-primary)" }}>EasyLaw</span>
            <span className="text-text-muted text-sm hidden sm:inline">
              / Contrats / {contractType}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-text-muted hidden sm:inline">
              {lang === "FR" ? "Brouillon sauvegardé · il y a 3s" : "Rascunho guardado · há 3s"}
            </span>
            <button
              type="button"
              onClick={() => setLang(lang === "FR" ? "PT" : "FR")}
              className="px-3 py-1.5 rounded-lg border border-surface-mist text-xs font-semibold text-text-secondary hover:bg-surface-page transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45"
            >
              {lang}
            </button>
          </div>
        </div>
      </div>

      {/* ── Stepper bar ──────────────────────────────────────────────────────── */}
      {!generatedContractId && (
        <div className="bg-white border-b border-surface-mist sticky top-14 z-40">
          <div className="max-w-[1400px] mx-auto px-6 py-3">
            <div className="flex items-center justify-between text-xs text-text-muted mb-2">
              <span>
                {lang === "FR"
                  ? `Question ${currentStep} sur ${totalSteps}`
                  : `Pergunta ${currentStep} de ${totalSteps}`}
              </span>
              <span>
                {lang === "FR"
                  ? `~${minsRemaining} min restantes`
                  : `~${minsRemaining} min restantes`}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full transition-all duration-300"
                  style={{ background: i < currentStep ? "var(--brand-primary)" : "var(--surface-mist)" }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Split layout ─────────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-12 gap-0">

        {/* Left: questionnaire */}
        <section className="lg:col-span-7 px-6 lg:px-10 py-10 lg:border-r border-surface-mist min-h-[calc(100vh-7rem)]">

          {generatedContractId ? (
            /* ── Success state ───────────────────────────────────────────────── */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 border"
                style={{
                  background: "var(--status-green-bg)",
                  color: "var(--status-green)",
                  borderColor: "var(--status-green-border)",
                }}>
                <Check className="w-8 h-8" />
              </div>
              <h1 className="text-3xl mb-3">
                {lang === "FR" ? "Contrat généré !" : "Contrato gerado!"}
              </h1>
              <p className="text-text-secondary text-lg leading-relaxed mb-8 max-w-sm">
                {lang === "FR"
                  ? "Votre contrat a été certifié conforme et enregistré en toute sécurité dans votre Coffre-Fort."
                  : "O seu contrato foi certificado e guardado em total segurança no seu Cofre-Forte."}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/vault" className={CLS_BTN_OUTLINE}>
                  {lang === "FR" ? "Accéder au Coffre-Fort" : "Aceder ao Cofre-Forte"}
                </Link>
                <a
                  href={getApiUrl(`/vault/${generatedContractId}.pdf`)}
                  download
                  className={CLS_BTN_PRIMARY}
                >
                  <Download className="w-4 h-4" />
                  {lang === "FR" ? "Télécharger PDF" : "Descarregar PDF"}
                </a>
              </div>
            </div>
          ) : (
            /* ── Question form ───────────────────────────────────────────────── */
            <>
              <p className="text-xs uppercase tracking-wider text-text-muted mb-2">
                {lang === "FR"
                  ? `Question ${currentStep} sur ${totalSteps}`
                  : `Pergunta ${currentStep} de ${totalSteps}`}
              </p>
              <h1 id="question-label" className="text-3xl md:text-4xl mb-8">
                {currentQuestion.label}
              </h1>

              {error && (
                <div role="alert" className="p-4 mb-6 rounded-lg border flex gap-2 items-start text-sm"
                  style={{
                    background: "var(--status-red-bg)",
                    borderColor: "var(--status-red-border)",
                    color: "var(--status-red)",
                  }}>
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                {currentQuestion.type === "date" ? (
                  <input
                    type="date"
                    aria-labelledby="question-label"
                    value={formData[currentQuestion.key] || ""}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className={CLS_INPUT}
                  />
                ) : currentQuestion.type === "number" ? (
                  <input
                    type="number"
                    aria-labelledby="question-label"
                    value={formData[currentQuestion.key] || ""}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    className={CLS_INPUT}
                  />
                ) : (
                  <input
                    type="text"
                    aria-labelledby="question-label"
                    value={formData[currentQuestion.key] || ""}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder={currentQuestion.placeholder}
                    className={CLS_INPUT}
                  />
                )}
              </div>

              {/* Nav footer */}
              <div className="flex items-center justify-between mt-10 pt-8 border-t border-surface-mist">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className={CLS_BTN_OUTLINE}
                >
                  <ChevronLeft className="w-4 h-4" />
                  {lang === "FR" ? "Question précédente" : "Pergunta anterior"}
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className={CLS_BTN_PRIMARY}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      {currentStep === totalSteps
                        ? (lang === "FR" ? "Finaliser" : "Finalizar")
                        : (lang === "FR" ? "Continuer" : "Continuar")}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </section>

        {/* Right: preview pane */}
        <aside className="lg:col-span-5 bg-surface-page px-6 lg:px-8 py-10 lg:sticky lg:top-[7rem] lg:h-[calc(100vh-7rem)] overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-text-muted" />
              <p className="text-xs uppercase tracking-wider text-text-muted">
                {lang === "FR" ? "Aperçu temps réel" : "Pré-visualização em tempo real"}
              </p>
            </div>
            <button
              type="button"
              className="text-xs px-2.5 py-1.5 rounded-md border border-surface-mist bg-transparent text-text-secondary hover:bg-surface-page transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45"
            >
              {lang === "FR" ? "Téléchargement après paiement" : "Download após pagamento"}
            </button>
          </div>

          <div className="bg-surface-card border border-surface-mist shadow-card rounded-md p-6 font-mono text-xs whitespace-pre-wrap overflow-y-auto leading-relaxed text-text-primary flex-1">
            {compiledContent}
          </div>

          <p className="text-xs text-text-muted text-center mt-3">
            {lang === "FR"
              ? "Téléchargement disponible après finalisation (49 €)."
              : "Download disponível após finalização (49 €)."}
          </p>
        </aside>
      </div>
    </div>
  );
}

// ─── Page export (Suspense required for useSearchParams) ─────────────────────

export default function ContractWizardPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-screen bg-surface-page">
            <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: "var(--brand-secondary)" }} />
            <p className="text-text-muted text-sm">
              Chargement du questionnaire...
            </p>
          </div>
        }
      >
        <WizardForm />
      </Suspense>
    </AuthGuard>
  );
}
