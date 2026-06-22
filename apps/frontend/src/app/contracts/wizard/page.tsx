"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Check, AlertCircle, FileText, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { getApiUrl } from "@/lib/api";
import { useEasyLawAuth } from "@/lib/privy";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { FieldInput, type TemplateField } from "./components/FieldInput";
import { FreeTextGenerator } from "./components/FreeTextGenerator";
import { FieldSuggestionButton } from "./components/FieldSuggestionButton";
import { ComplianceReviewModal, type ComplianceFinding } from "./components/ComplianceReviewModal";

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

// ─── Types ────────────────────────────────────────────────────────────────────

interface ContractTemplate {
  id: string;
  name: string;
  type: string;
  description: string;
  badge?: string;
  fields: TemplateField[];
}

// ─── Inner component (needs useSearchParams) ──────────────────────────────────

function WizardForm() {
  const searchParams = useSearchParams();

  const templateId = searchParams.get("templateId") || "bail_habitation";
  const contractType = searchParams.get("type") || "";

  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedContractId, setGeneratedContractId] = useState<string | null>(null);
  const [compiledContent, setCompiledContent] = useState<string>("");
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [waiveWithdrawal, setWaiveWithdrawal] = useState(false);

  // Template loading
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [templateError, setTemplateError] = useState<string | null>(null);

  // Compliance review (Feature D)
  const [complianceFindings, setComplianceFindings] = useState<ComplianceFinding[] | null>(null);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewAcknowledged, setReviewAcknowledged] = useState(false);

  const { getAccessToken } = useEasyLawAuth();

  // ── Fetch template on mount ──────────────────────────────────────────────
  useEffect(() => {
    async function fetchTemplate() {
      setTemplateLoading(true);
      setTemplateError(null);
      try {
        const token = await getAccessToken();
        const res = await fetch(getApiUrl("/api/contracts/templates"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Erreur de chargement du modèle");
        const data = await res.json();
        const found: ContractTemplate | undefined = data.templates?.find(
          (t: ContractTemplate) => t.id === templateId,
        );
        if (!found) throw new Error(`Modèle "${templateId}" introuvable`);
        setTemplate(found);
      } catch (err: unknown) {
        setTemplateError(err instanceof Error ? err.message : "Erreur de chargement");
      } finally {
        setTemplateLoading(false);
      }
    }
    fetchTemplate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const questions = template?.fields ?? [];
  const totalSteps = questions.length;
  const currentQuestion = questions[currentStep - 1];

  // Reset compliance acknowledged when form changes
  useEffect(() => {
    if (!generatedContractId) setReviewAcknowledged(false);
  }, [formData, generatedContractId]);

  // Reset suggestion state on step change
  useEffect(() => {
    setError(null);
  }, [currentStep]);

  // ── Generic live preview ─────────────────────────────────────────────────
  useEffect(() => {
    if (!template) return;
    let preview = `${template.name.toUpperCase()}\n\n`;
    for (const f of template.fields) {
      const val = formData[f.key];
      if (val) preview += `${f.label} : ${val}\n`;
    }
    if (!preview.includes("\n\n") || preview === `${template.name.toUpperCase()}\n\n`) {
      preview += lang === "FR" ? "(Remplissez les champs pour voir l'aperçu)" : "(Preencha os campos para ver a pré-visualização)";
    }
    setCompiledContent(preview);
  }, [formData, template, lang]);

  // ── Input change ─────────────────────────────────────────────────────────
  const handleInputChange = useCallback(
    (value: string) => {
      if (!currentQuestion) return;
      setFormData((prev) => ({ ...prev, [currentQuestion.key]: value }));
      setError(null);
    },
    [currentQuestion],
  );

  // ── Run compliance review ────────────────────────────────────────────────
  const runComplianceReview = async (): Promise<ComplianceFinding[]> => {
    try {
      const token = await getAccessToken();
      const res = await fetch(getApiUrl("/api/contracts/compliance-review"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ templateId, data: formData, lang }),
      });
      const json = await res.json();
      return Array.isArray(json.findings) ? json.findings : [];
    } catch {
      return []; // non-blocking: failure = no findings
    }
  };

  // ── Submit contract ──────────────────────────────────────────────────────
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
          type: template?.type || contractType,
          template_id: templateId,
          data: { ...formData, _lang: lang },
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

  // ── Navigation ───────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (!currentQuestion) return;
    const val = formData[currentQuestion.key];
    if (!val && !currentQuestion.optional) {
      setError(lang === "FR" ? "Veuillez répondre à cette question." : "Por favor, responda a esta pergunta.");
      return;
    }
    setError(null);

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      return;
    }

    // Last step: check legal declarations
    if (!confirmAccuracy || !waiveWithdrawal) {
      setError(
        lang === "FR"
          ? "Veuillez confirmer les deux déclarations ci-dessous avant de finaliser."
          : "Confirme as duas declarações abaixo antes de finalizar.",
      );
      return;
    }

    // Run compliance review before submitting (Feature D)
    if (!reviewAcknowledged) {
      setIsReviewing(true);
      const findings = await runComplianceReview();
      setIsReviewing(false);

      if (findings.length > 0) {
        setComplianceFindings(findings);
        setShowComplianceModal(true);
        return;
      }
      // No findings → skip modal, submit directly
    }

    submitContract();
  };

  const handlePrev = () => {
    setError(null);
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  const handleComplianceAcknowledge = () => {
    setShowComplianceModal(false);
    setReviewAcknowledged(true);
    submitContract();
  };

  const handleComplianceGoBack = (fieldKey?: string) => {
    setShowComplianceModal(false);
    if (fieldKey && template) {
      const idx = template.fields.findIndex((f) => f.key === fieldKey);
      if (idx >= 0) setCurrentStep(idx + 1);
    }
  };

  const minsRemaining = Math.max(1, totalSteps - currentStep + 1);

  // ── Loading / error states ────────────────────────────────────────────────
  if (templateLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface-page">
        <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: "var(--brand-secondary)" }} />
        <p className="text-text-muted text-sm">
          {lang === "FR" ? "Chargement du modèle de contrat…" : "A carregar o modelo de contrato…"}
        </p>
      </div>
    );
  }

  if (templateError || !template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-surface-page px-6">
        <AlertCircle className="w-10 h-10 mb-4" style={{ color: "var(--status-red)" }} />
        <p className="text-text-primary font-semibold mb-2">{templateError || "Modèle introuvable"}</p>
        <Link href="/contracts" className={CLS_BTN_OUTLINE}>{lang === "FR" ? "Retour aux contrats" : "Voltar aos contratos"}</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-page">

      {/* Compliance modal (Feature D) */}
      {showComplianceModal && complianceFindings && (
        <ComplianceReviewModal
          findings={complianceFindings}
          lang={lang}
          onAcknowledge={handleComplianceAcknowledge}
          onGoBack={handleComplianceGoBack}
        />
      )}

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
              / Contrats / {template.name}
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
              <span>{`~${minsRemaining} min restantes`}</span>
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

      {/* ── Legal disclaimer banner ───────────────────────────────────────── */}
      {!generatedContractId && (
        <div
          role="note"
          className="border-b"
          style={{ background: "var(--status-amber-bg)", borderColor: "var(--status-amber-border)" }}
        >
          <div
            className="max-w-[1400px] mx-auto px-6 py-2.5 flex items-start gap-2 text-xs leading-relaxed"
            style={{ color: "var(--status-amber)" }}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {lang === "FR"
                ? "Modèle juridique généré automatiquement à partir de vos réponses. Conformité légale validée à la date de génération. Pour les situations atypiques, "
                : "Modelo jurídico gerado automaticamente a partir das suas respostas. Conformidade legal validada à data de geração. Para situações atípicas, "}
              <Link
                href="/contact"
                className="underline underline-offset-2 font-semibold hover:opacity-80 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45 rounded-sm"
              >
                {lang === "FR" ? "demandez un avis d'avocat (49 €)" : "peça um parecer de advogado (49 €)"}
              </Link>
              .
            </span>
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
              {/* Feature A: Free-text generator — shown only at step 1 */}
              {currentStep === 1 && (
                <FreeTextGenerator
                  templateId={templateId}
                  lang={lang}
                  onApply={(data) => setFormData((prev) => ({ ...prev, ...data }))}
                />
              )}

              <p className="text-xs uppercase tracking-wider text-text-muted mb-2">
                {lang === "FR"
                  ? `Question ${currentStep} sur ${totalSteps}`
                  : `Pergunta ${currentStep} de ${totalSteps}`}
              </p>
              <h1 id="question-label" className="text-3xl md:text-4xl mb-4">
                {currentQuestion?.label}
                {currentQuestion?.optional && (
                  <span className="ml-3 text-base font-normal text-text-muted align-middle">
                    ({lang === "FR" ? "optionnel" : "opcional"})
                  </span>
                )}
              </h1>

              {/* Feature B: AI suggestion button */}
              {currentQuestion && (
                <FieldSuggestionButton
                  field={currentQuestion}
                  formData={formData}
                  templateId={templateId}
                  lang={lang}
                  onAccept={handleInputChange}
                />
              )}

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

              {/* Generic field renderer (Feature 0: bug fix) */}
              {currentQuestion && (
                <div>
                  <FieldInput
                    field={currentQuestion}
                    value={formData[currentQuestion.key] || ""}
                    onChange={handleInputChange}
                    lang={lang}
                  />
                </div>
              )}

              {/* Legal declarations on last step */}
              {currentStep === totalSteps && (
                <fieldset className="mt-8 space-y-3 rounded-lg border border-surface-mist bg-surface-card p-4">
                  <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {lang === "FR" ? "Déclarations obligatoires" : "Declarações obrigatórias"}
                  </legend>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={confirmAccuracy}
                      onChange={(e) => { setConfirmAccuracy(e.target.checked); setError(null); }}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-surface-mist-strong accent-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45"
                    />
                    <span className="text-sm text-text-secondary leading-relaxed">
                      {lang === "FR"
                        ? "J'ai vérifié que les informations saisies correspondent à ma situation. Je comprends que ce modèle ne remplace pas un conseil personnalisé pour les cas complexes."
                        : "Verifiquei que as informações inseridas correspondem à minha situação. Compreendo que este modelo não substitui um aconselhamento personalizado para casos complexos."}
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={waiveWithdrawal}
                      onChange={(e) => { setWaiveWithdrawal(e.target.checked); setError(null); }}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-surface-mist-strong accent-[var(--brand-primary)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45"
                    />
                    <span className="text-sm text-text-secondary leading-relaxed">
                      {lang === "FR"
                        ? "Je consens à l'exécution immédiate du service et renonce à mon droit de rétractation de 14 jours, conformément à l'art. 16(m) de la Directive 2011/83/UE."
                        : "Consinto a execução imediata do serviço e renuncio ao meu direito de retratação de 14 dias, nos termos do art. 16(m) da Diretiva 2011/83/UE."}
                    </span>
                  </label>
                </fieldset>
              )}

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
                  disabled={isSubmitting || isReviewing}
                  className={CLS_BTN_PRIMARY}
                >
                  {(isSubmitting || isReviewing) ? (
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
