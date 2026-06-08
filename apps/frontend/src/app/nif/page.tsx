"use client";

import React, { useState } from "react";
import { Shield, Globe, Check, AlertCircle, Upload, CreditCard, User, FileText, ChevronRight, ChevronLeft } from "lucide-react";

const translations = {
  FR: {
    title: "Demande de NIF Portugais",
    subtitle: "Obtenez votre numéro fiscal portugais en quelques étapes",
    step1: "Infos Personnelles",
    step2: "Documents",
    step3: "Vérification",
    step4: "Paiement",
    
    // Step 1
    fullNameLabel: "Nom complet (comme sur le passeport)",
    birthdateLabel: "Date de naissance",
    nationalityLabel: "Nationalité",
    residenceLabel: "Adresse de résidence actuelle",
    nextBtn: "Suivant",
    prevBtn: "Précédent",

    // Step 2
    passportLabel: "Passeport (page avec photo)",
    proofAddressLabel: "Justificatif de domicile (de moins de 3 mois)",
    uploadSuccess: "Fichier téléversé avec succès !",
    uploading: "Téléversement...",

    // Step 3
    reviewTitle: "Vérifiez vos informations",
    reviewDesc: "Assurez-vous que toutes les informations sont exactes avant de procéder au paiement.",
    submitApplicationBtn: "Valider et payer",

    // Step 4
    paymentTitle: "Paiement sécurisé",
    paymentDesc: "Frais de dossier pour l'obtention du NIF",
    price: "99,00 €",
    cardNumberLabel: "Numéro de carte",
    expiryLabel: "Date d'expiration",
    cvcLabel: "Code CVC",
    payBtn: "Payer 99,00 €",
    processingPayment: "Traitement du paiement...",
    successTitle: "Demande soumise avec succès !",
    successDesc: "Votre dossier NIF a été enregistré. Nos juristes vont l'analyser sous 24h. Un e-mail de confirmation vous a été envoyé.",
    backHomeBtn: "Retour à l'accueil",

    validationError: "Veuillez remplir tous les champs requis.",
    uploadError: "Une erreur est survenue lors du téléversement du document.",
    submitError: "Une erreur est survenue lors de l'enregistrement de votre demande."
  },
  PT: {
    title: "Pedido de NIF Português",
    subtitle: "Obtenha o seu número de identificação fiscal português em poucos passos",
    step1: "Dados Pessoais",
    step2: "Documentos",
    step3: "Verificação",
    step4: "Pagamento",

    // Step 1
    fullNameLabel: "Nome completo (como no passaporte)",
    birthdateLabel: "Data de nascimento",
    nationalityLabel: "Nacionalidade",
    residenceLabel: "Morada de residência atual",
    nextBtn: "Seguinte",
    prevBtn: "Anterior",

    // Step 2
    passportLabel: "Passaporte (página com fotografia)",
    proofAddressLabel: "Comprovativo de morada (menos de 3 meses)",
    uploadSuccess: "Ficheiro carregado com sucesso!",
    uploading: "A carregar...",

    // Step 3
    reviewTitle: "Verifique as suas informações",
    reviewDesc: "Certifique-se de que todas as informações estão corretas antes de proceder ao pagamento.",
    submitApplicationBtn: "Validar e pagar",

    // Step 4
    paymentTitle: "Pagamento seguro",
    paymentDesc: "Custos de processo para obtenção de NIF",
    price: "99,00 €",
    cardNumberLabel: "Número do cartão",
    expiryLabel: "Data de validade",
    cvcLabel: "Código CVC",
    payBtn: "Pagar 99,00 €",
    processingPayment: "A processar o pagamento...",
    successTitle: "Pedido submetido com sucesso!",
    successDesc: "O seu processo NIF foi registado. Os nossos juristas irão analisá-lo em 24h. Um e-mail de confirmação foi-lhe enviado.",
    backHomeBtn: "Voltar ao início",

    validationError: "Por favor, preencha todos os campos obrigatórios.",
    uploadError: "Ocorreu um erro ao carregar o documento.",
    submitError: "Ocorreu um erro ao registar o seu pedido."
  }
};

export default function NifWizardPage() {
  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullname: "",
    birthdate: "",
    nationality: "",
    current_residence: "",
    passport_path: "",
    proof_of_address_path: ""
  });

  const [passportFileName, setPassportFileName] = useState("");
  const [addressFileName, setAddressFileName] = useState("");
  const [isUploadingPassport, setIsUploadingPassport] = useState(false);
  const [isUploadingAddress, setIsUploadingAddress] = useState(false);

  // Payment State
  const [paymentData, setPaymentData] = useState({
    cardNumber: "",
    expiry: "",
    cvc: ""
  });

  const t = translations[lang];

  const toggleLanguage = () => {
    setLang(lang === "FR" ? "PT" : "FR");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: "passport_path" | "proof_of_address_path") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    if (fieldName === "passport_path") {
      setIsUploadingPassport(true);
      setPassportFileName(file.name);
    } else {
      setIsUploadingAddress(true);
      setAddressFileName(file.name);
    }

    try {
      const response = await fetch("http://localhost:3001/api/nif/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ filename: file.name })
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setFormData((prev) => ({ ...prev, [fieldName]: data.filepath }));
    } catch (err) {
      setError(t.uploadError);
      if (fieldName === "passport_path") {
        setPassportFileName("");
      } else {
        setAddressFileName("");
      }
    } finally {
      if (fieldName === "passport_path") {
        setIsUploadingPassport(false);
      } else {
        setIsUploadingAddress(false);
      }
    }
  };

  const validateStep1 = () => {
    if (!formData.fullname || !formData.birthdate || !formData.nationality || !formData.current_residence) {
      setError(t.validationError);
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.passport_path || !formData.proof_of_address_path) {
      setError(t.validationError);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    
    setError(null);
    setStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    setError(null);
    setStep((prev) => prev - 1);
  };

  const handleReviewSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/api/nif/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("Application submission failed");
      }

      // Move to payment step
      setStep(4);
    } catch (err) {
      setError(t.submitError);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.cardNumber || !paymentData.expiry || !paymentData.cvc) {
      setError(t.validationError);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Simulate payment call
    setTimeout(() => {
      setIsLoading(false);
      setStep(5); // Success state
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8] flex flex-col items-center justify-center p-4 antialiased selection:bg-[#C9A84C] selection:text-white">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#1A365D] blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#C9A84C] blur-3xl"></div>
      </div>

      <div className="w-full max-w-2xl bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-6 md:p-8 relative z-10">
        {/* Header switch & logo */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 text-[#1A365D]">
            <Shield className="w-6 h-6 text-[#C9A84C]" />
            <span className="font-semibold text-lg font-serif">EasyLaw</span>
          </div>
          <button
            onClick={toggleLanguage}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2E8F0] text-sm text-[#1A365D] hover:bg-[#FAFAF8] transition"
          >
            <Globe className="w-4 h-4 text-[#C9A84C]" />
            <span className="font-semibold">{lang}</span>
          </button>
        </div>

        {/* Step indicator (only show for steps 1-4) */}
        {step <= 4 && (
          <div className="mb-8">
            <div className="flex justify-between items-center text-xs font-semibold text-[#64748B] mb-2">
              <span className={step === 1 ? "text-[#1A365D]" : ""}>{t.step1}</span>
              <span className={step === 2 ? "text-[#1A365D]" : ""}>{t.step2}</span>
              <span className={step === 3 ? "text-[#1A365D]" : ""}>{t.step3}</span>
              <span className={step === 4 ? "text-[#1A365D]" : ""}>{t.step4}</span>
            </div>
            <div className="w-full bg-[#FAFAF8] h-2 rounded-full overflow-hidden border border-[#E2E8F0]">
              <div 
                className="bg-[#C9A84C] h-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex gap-2 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-[#1A365D] font-serif mb-1">{t.title}</h2>
            <p className="text-[#64748B] text-sm mb-6">{t.subtitle}</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">{t.fullNameLabel}</label>
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:border-[#1A365D] focus:outline-none text-sm transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">{t.birthdateLabel}</label>
                  <input
                    type="date"
                    name="birthdate"
                    value={formData.birthdate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:border-[#1A365D] focus:outline-none text-sm transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">{t.nationalityLabel}</label>
                  <input
                    type="text"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleInputChange}
                    placeholder="French"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:border-[#1A365D] focus:outline-none text-sm transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">{t.residenceLabel}</label>
                <input
                  type="text"
                  name="current_residence"
                  value={formData.current_residence}
                  onChange={handleInputChange}
                  placeholder="123 Rue de Rivoli, Paris"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:border-[#1A365D] focus:outline-none text-sm transition"
                />
              </div>
            </div>

            <div className="flex justify-end mt-8">
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 py-2.5 px-6 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition shadow-md"
              >
                <span>{t.nextBtn}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Documents */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-[#1A365D] font-serif mb-4">{t.step2}</h2>

            <div className="space-y-6">
              {/* Passport Upload */}
              <div className="border border-dashed border-[#E2E8F0] bg-[#FAFAF8] rounded-xl p-6 text-center">
                <label className="cursor-pointer block">
                  <Upload className="w-10 h-10 text-[#C9A84C] mx-auto mb-3" />
                  <span className="block text-sm font-semibold text-[#1A365D] mb-1">{t.passportLabel}</span>
                  <span className="block text-xs text-gray-500 mb-3">PDF, JPG, PNG (Max 5MB)</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "passport_path")}
                    className="hidden"
                  />
                  <span className="inline-block px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-gray-50 text-[#1A365D] text-xs font-semibold rounded-lg transition shadow-sm">
                    {isUploadingPassport ? t.uploading : "Choisir un fichier"}
                  </span>
                </label>
                {passportFileName && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-green-600 font-medium">
                    <Check className="w-4 h-4" />
                    <span>{passportFileName} - {t.uploadSuccess}</span>
                  </div>
                )}
              </div>

              {/* Proof of Address Upload */}
              <div className="border border-dashed border-[#E2E8F0] bg-[#FAFAF8] rounded-xl p-6 text-center">
                <label className="cursor-pointer block">
                  <Upload className="w-10 h-10 text-[#C9A84C] mx-auto mb-3" />
                  <span className="block text-sm font-semibold text-[#1A365D] mb-1">{t.proofAddressLabel}</span>
                  <span className="block text-xs text-gray-500 mb-3">PDF, JPG, PNG (Max 5MB)</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileUpload(e, "proof_of_address_path")}
                    className="hidden"
                  />
                  <span className="inline-block px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-gray-50 text-[#1A365D] text-xs font-semibold rounded-lg transition shadow-sm">
                    {isUploadingAddress ? t.uploading : "Choisir un fichier"}
                  </span>
                </label>
                {addressFileName && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-green-600 font-medium">
                    <Check className="w-4 h-4" />
                    <span>{addressFileName} - {t.uploadSuccess}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-2 py-2.5 px-6 border border-[#E2E8F0] hover:bg-[#FAFAF8] text-[#1A365D] rounded-lg text-sm font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t.prevBtn}</span>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 py-2.5 px-6 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition shadow-md"
              >
                <span>{t.nextBtn}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-[#1A365D] font-serif mb-1">{t.reviewTitle}</h2>
            <p className="text-[#64748B] text-sm mb-6">{t.reviewDesc}</p>

            <div className="bg-[#FAFAF8] border border-[#E2E8F0] rounded-xl p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase">{t.fullNameLabel}</span>
                  <span className="text-[#1A365D] font-medium text-sm">{formData.fullname}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase">{t.birthdateLabel}</span>
                  <span className="text-[#1A365D] font-medium text-sm">{formData.birthdate}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase">{t.nationalityLabel}</span>
                  <span className="text-[#1A365D] font-medium text-sm">{formData.nationality}</span>
                </div>
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase">{t.residenceLabel}</span>
                  <span className="text-[#1A365D] font-medium text-sm">{formData.current_residence}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <FileText className="w-4 h-4 text-[#C9A84C]" />
                  <span>Passport: <strong className="text-green-600">{passportFileName}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                  <FileText className="w-4 h-4 text-[#C9A84C]" />
                  <span>Proof of Address: <strong className="text-green-600">{addressFileName}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-2 py-2.5 px-6 border border-[#E2E8F0] hover:bg-[#FAFAF8] text-[#1A365D] rounded-lg text-sm font-semibold transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{t.prevBtn}</span>
              </button>
              <button
                type="button"
                onClick={handleReviewSubmit}
                disabled={isLoading}
                className="flex items-center gap-2 py-2.5 px-6 bg-[#C9A84C] hover:bg-[#C9A84C]/95 text-white rounded-lg text-sm font-semibold transition shadow-md disabled:opacity-70"
              >
                <span>{isLoading ? "Envoi..." : t.submitApplicationBtn}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Payment mock */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-[#1A365D] font-serif mb-1">{t.paymentTitle}</h2>
            <p className="text-[#64748B] text-sm mb-6">{t.paymentDesc}</p>

            <div className="flex items-center justify-between bg-[#FAFAF8] border border-[#E2E8F0] rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-[#C9A84C]" />
                <div>
                  <span className="block font-semibold text-sm text-[#1A365D]">NIF Standard Application</span>
                  <span className="block text-xs text-gray-500">Service 100% en ligne</span>
                </div>
              </div>
              <span className="font-serif font-bold text-xl text-[#1A365D]">{t.price}</span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">{t.cardNumberLabel}</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={handlePaymentChange}
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:border-[#1A365D] focus:outline-none text-sm transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">{t.expiryLabel}</label>
                  <input
                    type="text"
                    name="expiry"
                    value={paymentData.expiry}
                    onChange={handlePaymentChange}
                    placeholder="MM/YY"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:border-[#1A365D] focus:outline-none text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">{t.cvcLabel}</label>
                  <input
                    type="text"
                    name="cvc"
                    value={paymentData.cvc}
                    onChange={handlePaymentChange}
                    placeholder="123"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E2E8F0] focus:border-[#1A365D] focus:outline-none text-sm transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 py-3 px-4 bg-[#1A365D] hover:bg-[#1A365D]/95 text-white rounded-lg text-sm font-semibold transition shadow-md disabled:opacity-75"
              >
                {isLoading ? t.processingPayment : t.payBtn}
              </button>
            </form>
          </div>
        )}

        {/* Step 5: Success screen */}
        {step === 5 && (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A365D] font-serif mb-3">{t.successTitle}</h2>
            <p className="text-[#64748B] text-sm mb-8 max-w-md mx-auto leading-relaxed">{t.successDesc}</p>

            <a
              href="/"
              className="inline-block py-2.5 px-6 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition shadow-md"
            >
              {t.backHomeBtn}
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
