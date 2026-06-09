"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Shield, Globe, ChevronLeft, ChevronRight, Check, AlertCircle, FileText, Loader2, Download } from "lucide-react";
import Link from "next/link";
import { getApiUrl } from "@/lib/api";

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

function WizardForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const templateId = searchParams.get("templateId") || "bail_habitation";
  const contractType = searchParams.get("type") || "Bail";

  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedContractId, setGeneratedContractId] = useState<string | null>(null);
  const [compiledContent, setCompiledContent] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);

  const questions = contractType === "Bail" ? bailQuestions : travailQuestions;
  const currentQuestion = questions[currentStep - 1];

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    setToken(savedToken);
  }, []);

  // Update dynamic preview
  useEffect(() => {
    // Client-side local preview rendering
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
    setFormData((prev) => ({
      ...prev,
      [currentQuestion.key]: value,
    }));
    setError(null);
  };

  const handleNext = () => {
    if (!formData[currentQuestion.key]) {
      setError(lang === "FR" ? "Veuillez répondre à cette question." : "Por favor, responda a esta pergunta.");
      return;
    }
    setError(null);
    if (currentStep < 7) {
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
    try {
      const response = await fetch(getApiUrl("/api/contracts/generate"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
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
      // Fetch compiled content from backend to get official reference format
      await fetchOfficialPreview(resData.contractId);
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchOfficialPreview = async (contractId: string) => {
    try {
      const response = await fetch(getApiUrl(`/api/contracts/${contractId}/preview`), {
        headers: {
          Authorization: `Bearer ${token}`
        }
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

  return (
    <main className="min-h-screen bg-[#FAFAF8] flex flex-col antialiased selection:bg-[#C9A84C] selection:text-white">
      {/* Header */}
      <header className="w-full bg-white border-b border-[#E2E8F0] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/contracts" className="flex items-center gap-2 text-[#1A365D]">
            <Shield className="w-6 h-6 text-[#C9A84C]" />
            <span className="font-semibold text-lg font-serif">EasyLaw</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/vault" className="text-sm font-semibold text-[#1A365D] hover:text-[#C9A84C] transition">
              Coffre-Fort
            </Link>
            <button
              onClick={() => setLang(lang === "FR" ? "PT" : "FR")}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2E8F0] text-sm text-[#1A365D] hover:bg-[#FAFAF8] transition"
            >
              <Globe className="w-4 h-4 text-[#C9A84C]" />
              <span className="font-semibold">{lang}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Split-screen Layout */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 md:py-10 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        {/* Left: Questionnaire */}
        <div className="bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-6 md:p-8 flex flex-col justify-between min-h-[500px]">
          {generatedContractId ? (
            <div className="text-center py-12 flex-1 flex flex-col justify-center items-center">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4 border border-green-200">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#1A365D] font-serif mb-3">
                {lang === "FR" ? "Contrat Généré !" : "Contrato Gerado !"}
              </h2>
              <p className="text-gray-500 text-sm mb-8 max-w-sm">
                {lang === "FR" 
                  ? "Votre contrat a été certifié conforme et enregistré en toute sécurité dans votre Coffre-Fort."
                  : "O seu contrato foi certificado e guardado em total segurança no seu Cofre-Forte."}
              </p>
              <div className="flex gap-4">
                <Link
                  href="/vault"
                  className="py-2.5 px-6 border border-[#E2E8F0] text-[#1A365D] font-semibold text-sm rounded-lg hover:bg-[#FAFAF8] transition"
                >
                  {lang === "FR" ? "Accéder au Coffre-Fort" : "Aceder ao Cofre-Forte"}
                </Link>
                <a
                  href={getApiUrl(`/vault/${generatedContractId}.pdf`)}
                  download
                  className="flex items-center gap-2 py-2.5 px-6 bg-[#C9A84C] hover:bg-[#C9A84C]/90 text-white font-semibold text-sm rounded-lg transition shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>{lang === "FR" ? "Télécharger PDF" : "Descarregar PDF"}</span>
                </a>
              </div>
            </div>
          ) : (
            <>
              <div>
                {/* Progress bar */}
                <div className="mb-8">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-400 mb-1.5">
                    <span>Question {currentStep} / 7</span>
                    <span>{Math.round((currentStep / 7) * 100)}%</span>
                  </div>
                  <div className="w-full bg-[#FAFAF8] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
                    <div 
                      className="bg-[#C9A84C] h-full transition-all duration-300"
                      style={{ width: `${(currentStep / 7) * 100}%` }}
                    ></div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex gap-2 items-start">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form Field */}
                <div className="space-y-4">
                  <label className="block text-lg font-serif font-bold text-[#1A365D]">
                    {currentQuestion.label}
                  </label>
                  {currentQuestion.type === "date" ? (
                    <input
                      type="date"
                      value={formData[currentQuestion.key] || ""}
                      onChange={(e) => handleInputChange(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] focus:border-[#1A365D] focus:outline-none text-sm transition"
                    />
                  ) : currentQuestion.type === "number" ? (
                    <input
                      type="number"
                      value={formData[currentQuestion.key] || ""}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={currentQuestion.placeholder}
                      className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] focus:border-[#1A365D] focus:outline-none text-sm transition"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[currentQuestion.key] || ""}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={currentQuestion.placeholder}
                      className="w-full px-4 py-3 rounded-lg border border-[#E2E8F0] focus:border-[#1A365D] focus:outline-none text-sm transition"
                    />
                  )}
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-12 pt-6 border-t border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  className="flex items-center gap-1 py-2 px-4 border border-[#E2E8F0] hover:bg-[#FAFAF8] text-[#1A365D] rounded-lg text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{lang === "FR" ? "Précédent" : "Anterior"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex items-center gap-1 py-2.5 px-6 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-xs font-semibold transition shadow-md"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{currentStep === 7 ? (lang === "FR" ? "Finaliser" : "Finalizar") : (lang === "FR" ? "Suivant" : "Seguinte")}</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right: Live Preview Pane */}
        <div className="bg-[#1A365D] rounded-2xl p-6 text-white flex flex-col min-h-[500px] shadow-xl relative overflow-hidden">
          {/* Subtle logo bg */}
          <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-white/5 blur-3xl"></div>

          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10 relative z-10">
            <FileText className="w-5 h-5 text-[#C9A84C]" />
            <span className="font-serif font-bold text-sm tracking-wider uppercase">
              {lang === "FR" ? "Aperçu en temps réel" : "Visualização em tempo real"}
            </span>
          </div>

          <div className="flex-1 bg-white/5 rounded-xl p-4 font-mono text-xs whitespace-pre-wrap overflow-y-auto leading-relaxed text-slate-200 border border-white/10 relative z-10">
            {compiledContent}
          </div>
        </div>
      </div>
    </main>
  );
}

import { Suspense } from "react";

export default function ContractWizardPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAFAF8]">
        <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Chargement du questionnaire...</p>
      </div>
    }>
      <WizardForm />
    </Suspense>
  );
}
