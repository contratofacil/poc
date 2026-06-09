"use client";

import React, { useState, useRef } from "react";
import { Check, AlertCircle, FileText, ChevronRight, ChevronLeft, CreditCard, Lock } from "lucide-react";
import { getApiUrl } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Lang = "FR" | "PT";

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

// ─── Stepper helpers ──────────────────────────────────────────────────────────

const STEPPER_LABELS: Record<Lang, readonly string[]> = {
  FR: ["Informations", "Documents", "Procuration", "Paiement"],
  PT: ["Informações", "Documentos", "Procuração", "Pagamento"],
};

function getStepperIdx(step: number): number {
  if (step <= 1) return 1;
  if (step <= 2) return 2;
  if (step <= 3) return 3;
  return 4;
}

// ─── Translations ─────────────────────────────────────────────────────────────

type T = {
  breadcrumb: string;
  draftSaved: string;
  stepOf: (s: number) => string;
  timeEstimate: string;
  step1Title: string; step1Sub: string;
  fullNameLabel: string; birthdateLabel: string; nationalityLabel: string; residenceLabel: string;
  step2Title: string; step2Sub: string;
  passportLabel: string; passportHint: string;
  addressLabel: string; addressHint: string; addressSub: string;
  dropZone: string; dropZoneSub: string;
  ocrBadge: string; replace: string; uploaded: string;
  infoBlockTitle: string; infoBlockBody: string;
  trust1: string; trust2: string; trust3: string;
  step3Title: string; step3Sub: string;
  step3CardTitle: string; step3CardBody: string;
  downloadTemplate: string; step3Note: string;
  reviewTitle: string; reviewSub: string; validateAndPay: string;
  paymentTitle: string; paymentSub: string; price: string;
  cardNumberLabel: string; expiryLabel: string; cvcLabel: string;
  payBtn: string; processingPayment: string;
  successTitle: string; successDesc: string; backHomeBtn: string;
  back: string; next: string; continue: string;
  validationError: string; uploadError: string; submitError: string; uploading: string; uploadBothHint: string;
};

const translations: Record<Lang, T> = {
  FR: {
    breadcrumb: "/ Nouveau dossier NIF",
    draftSaved: "Brouillon sauvegardé · il y a 3s",
    stepOf: (s) => `Étape ${s} sur 4`,
    timeEstimate: "Comptez environ 8 minutes au total",
    step1Title: "Vos informations personnelles.",
    step1Sub: "Ces informations figureront dans votre dossier NIF transmis aux Finanças.",
    fullNameLabel: "Nom complet (comme sur le passeport)",
    birthdateLabel: "Date de naissance",
    nationalityLabel: "Nationalité",
    residenceLabel: "Adresse de résidence actuelle",
    step2Title: "Vos documents d'identité.",
    step2Sub: "Téléversez votre passeport et un justificatif de domicile. Vos fichiers sont chiffrés (AES-256) avant d'arriver sur nos serveurs.",
    passportLabel: "Passeport ou carte d'identité",
    passportHint: "PDF, JPG, PNG · max 10 Mo",
    addressLabel: "Justificatif de domicile",
    addressHint: "PDF, JPG, PNG · max 10 Mo",
    addressSub: "Facture d'électricité, gaz, eau, internet, ou avis d'imposition — datant de moins de 3 mois.",
    dropZone: "Glissez votre fichier ici, ou cliquez pour parcourir",
    dropZoneSub: "Vos documents sont chiffrés avant transmission.",
    ocrBadge: "Qualité OCR validée",
    replace: "Remplacer",
    uploaded: "Téléversé",
    infoBlockTitle: "Pourquoi ce document ?",
    infoBlockBody: "Le justificatif est requis par les Finanças pour confirmer votre résidence fiscale. Sans lui, la demande est automatiquement rejetée.",
    trust1: "Chiffrement AES-256 au repos",
    trust2: "Conforme RGPD",
    trust3: "Supervisé par Oliveira & Carneiro",
    step3Title: "Procuration notariée.",
    step3Sub: "Pour représenter votre dossier auprès des Finanças, notre cabinet requiert une procuration simple. Téléchargez le modèle, faites-le signer devant notaire, puis numérisez-le.",
    step3CardTitle: "Modèle de procuration",
    step3CardBody: "Formulaire pré-rempli conforme aux exigences des Finanças. À signer devant notaire puis à numériser.",
    downloadTemplate: "Télécharger le modèle (.docx)",
    step3Note: "La procuration signée sera demandée par votre juriste référent avant transmission du dossier.",
    reviewTitle: "Vérifiez vos informations.",
    reviewSub: "Assurez-vous que tout est exact avant de procéder au paiement.",
    validateAndPay: "Valider et payer",
    paymentTitle: "Paiement sécurisé.",
    paymentSub: "Frais de dossier pour l'obtention du NIF",
    price: "99,00 €",
    cardNumberLabel: "Numéro de carte",
    expiryLabel: "Date d'expiration",
    cvcLabel: "Code CVC",
    payBtn: "Payer 99,00 €",
    processingPayment: "Traitement du paiement...",
    successTitle: "Demande soumise avec succès !",
    successDesc: "Votre dossier NIF a été enregistré. Nos juristes vont l'analyser sous 24h. Un e-mail de confirmation vous a été envoyé.",
    backHomeBtn: "Retour à l'accueil",
    back: "Retour",
    next: "Suivant",
    continue: "Continuer",
    validationError: "Veuillez remplir tous les champs requis.",
    uploadError: "Une erreur est survenue lors du téléversement du document.",
    submitError: "Une erreur est survenue lors de l'enregistrement de votre demande.",
    uploading: "Téléversement...",
    uploadBothHint: "Téléversez les deux documents pour continuer.",
  },
  PT: {
    breadcrumb: "/ Novo processo NIF",
    draftSaved: "Rascunho guardado · há 3s",
    stepOf: (s) => `Etapa ${s} de 4`,
    timeEstimate: "Cerca de 8 minutos no total",
    step1Title: "As suas informações pessoais.",
    step1Sub: "Estas informações constarão do seu processo NIF transmitido às Finanças.",
    fullNameLabel: "Nome completo (como no passaporte)",
    birthdateLabel: "Data de nascimento",
    nationalityLabel: "Nacionalidade",
    residenceLabel: "Morada de residência atual",
    step2Title: "Os seus documentos de identidade.",
    step2Sub: "Carregue o seu passaporte e um comprovativo de morada. Os seus ficheiros são encriptados (AES-256) antes de chegarem aos nossos servidores.",
    passportLabel: "Passaporte ou bilhete de identidade",
    passportHint: "PDF, JPG, PNG · máx 10 MB",
    addressLabel: "Comprovativo de morada",
    addressHint: "PDF, JPG, PNG · máx 10 MB",
    addressSub: "Fatura de eletricidade, gás, água, internet ou nota de liquidação — com menos de 3 meses.",
    dropZone: "Arraste o seu ficheiro aqui, ou clique para escolher",
    dropZoneSub: "Os seus documentos são encriptados antes da transmissão.",
    ocrBadge: "Qualidade OCR validada",
    replace: "Substituir",
    uploaded: "Carregado",
    infoBlockTitle: "Porquê este documento?",
    infoBlockBody: "O comprovativo é exigido pelas Finanças para confirmar a sua residência fiscal. Sem ele, o pedido é automaticamente rejeitado.",
    trust1: "Encriptação AES-256 em repouso",
    trust2: "Conforme RGPD",
    trust3: "Supervisionado por Oliveira & Carneiro",
    step3Title: "Procuração notariada.",
    step3Sub: "Para representar o seu processo junto das Finanças, o nosso gabinete necessita de uma procuração simples. Descarregue o modelo, assine perante notário e digitalize-o.",
    step3CardTitle: "Modelo de procuração",
    step3CardBody: "Formulário pré-preenchido conforme as exigências das Finanças. A assinar perante notário e a digitalizar.",
    downloadTemplate: "Descarregar o modelo (.docx)",
    step3Note: "A procuração assinada será solicitada pelo seu jurista antes da transmissão do processo.",
    reviewTitle: "Verifique as suas informações.",
    reviewSub: "Certifique-se de que tudo está correto antes de proceder ao pagamento.",
    validateAndPay: "Validar e pagar",
    paymentTitle: "Pagamento seguro.",
    paymentSub: "Custos de processo para obtenção do NIF",
    price: "99,00 €",
    cardNumberLabel: "Número do cartão",
    expiryLabel: "Data de validade",
    cvcLabel: "Código CVC",
    payBtn: "Pagar 99,00 €",
    processingPayment: "A processar o pagamento...",
    successTitle: "Pedido submetido com sucesso!",
    successDesc: "O seu processo NIF foi registado. Os nossos juristas irão analisá-lo em 24h. Um e-mail de confirmação foi-lhe enviado.",
    backHomeBtn: "Voltar ao início",
    back: "Anterior",
    next: "Seguinte",
    continue: "Continuar",
    validationError: "Por favor, preencha todos os campos obrigatórios.",
    uploadError: "Ocorreu um erro ao carregar o documento.",
    submitError: "Ocorreu um erro ao registar o seu pedido.",
    uploading: "A carregar...",
    uploadBothHint: "Carregue os dois documentos para continuar.",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NifWizardPage() {
  const [lang, setLang] = useState<Lang>("FR");
  // Internal steps: 1=Informations, 2=Documents, 3=Procuration, 4=Review, 5=Payment, 6=Success
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullname: "",
    birthdate: "",
    nationality: "",
    current_residence: "",
    passport_path: "",
    proof_of_address_path: "",
  });

  const [passportFileName, setPassportFileName] = useState("");
  const [addressFileName, setAddressFileName] = useState("");
  const [isUploadingPassport, setIsUploadingPassport] = useState(false);
  const [isUploadingAddress, setIsUploadingAddress] = useState(false);

  const [paymentData, setPaymentData] = useState({ cardNumber: "", expiry: "", cvc: "" });

  const passportInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];
  const stepperIdx = getStepperIdx(step);
  const labels = STEPPER_LABELS[lang];

  // ── Handlers ────────────────────────────────────────────────────────────────

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

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: "passport_path" | "proof_of_address_path",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.currentTarget.value = "";
    setError(null);
    if (fieldName === "passport_path") {
      setIsUploadingPassport(true);
      setPassportFileName(file.name);
    } else {
      setIsUploadingAddress(true);
      setAddressFileName(file.name);
    }
    try {
      const response = await fetch(getApiUrl("/api/nif/upload"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name }),
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setFormData((prev) => ({ ...prev, [fieldName]: data.filepath }));
    } catch {
      setError(t.uploadError);
      if (fieldName === "passport_path") {
        setPassportFileName("");
        setFormData((prev) => ({ ...prev, passport_path: "" }));
      } else {
        setAddressFileName("");
        setFormData((prev) => ({ ...prev, proof_of_address_path: "" }));
      }
    } finally {
      if (fieldName === "passport_path") setIsUploadingPassport(false);
      else setIsUploadingAddress(false);
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
      const response = await fetch(getApiUrl("/api/nif/apply"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Application submission failed");
      setStep(5);
    } catch {
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
    setTimeout(() => {
      setIsLoading(false);
      setStep(6);
    }, 1500);
  };

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-surface-page">

      {/* Top bar */}
      {step < 6 && (
        <header className="border-b border-surface-mist bg-surface-card">
          <div className="max-w-[1280px] mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md bg-brand-primary flex items-center justify-center flex-shrink-0">
                <span className="text-text-inverse font-bold text-sm font-serif leading-none">E</span>
              </div>
              <span className="font-semibold font-serif text-brand-primary">EasyLaw</span>
              <span className="text-text-muted text-sm hidden sm:inline">{t.breadcrumb}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-muted hidden sm:inline">{t.draftSaved}</span>
              <button
                type="button"
                onClick={() => setLang((l) => (l === "FR" ? "PT" : "FR"))}
                className="border border-surface-mist bg-transparent text-text-secondary text-xs rounded-md px-2.5 py-1.5 hover:bg-surface-page focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45 transition"
                aria-label="Changer de langue"
              >
                {lang} ▾
              </button>
              <div
                aria-hidden="true"
                className="w-8 h-8 rounded-full bg-brand-primary text-text-inverse flex items-center justify-center text-xs font-semibold select-none"
              >
                EL
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Stepper */}
      {step < 6 && (
        <div className="border-b border-surface-mist bg-surface-card">
          <div className="max-w-[920px] mx-auto px-6 py-5">
            <div className="flex items-center justify-between mb-3 text-xs text-text-muted">
              <span>{t.stepOf(stepperIdx)}</span>
              <span>{t.timeEstimate}</span>
            </div>
            <div className="flex items-center gap-2">
              {([1, 2, 3, 4] as const).map((i) => (
                <div
                  key={i}
                  className="flex-1 h-1.5 rounded-full transition-colors duration-300"
                  style={{ background: stepperIdx >= i ? "var(--brand-primary)" : "var(--surface-mist)" }}
                />
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2 text-[11px]">
              {labels.map((label, i) => {
                const idx = i + 1;
                const isDone = stepperIdx > idx;
                const isCurrent = stepperIdx === idx;
                return (
                  <span
                    key={label}
                    className={isDone ? "text-text-secondary" : isCurrent ? "font-medium" : "text-text-muted"}
                    style={isCurrent ? { color: "var(--brand-primary)" } : undefined}
                  >
                    {isDone ? `✓ ${label}` : label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="max-w-[920px] mx-auto px-6 py-10">

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-status-red-bg border border-status-red-border text-status-red text-sm flex gap-2 items-start">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Step 1: Informations ────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <h1 className="text-3xl md:text-4xl mb-3">{t.step1Title}</h1>
            <p className="text-text-secondary text-lg leading-relaxed mb-8">{t.step1Sub}</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t.fullNameLabel} <span className="text-status-red">*</span>
                </label>
                <input type="text" name="fullname" value={formData.fullname} onChange={handleInputChange}
                  placeholder="Jean Dupont" className={CLS_INPUT} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    {t.birthdateLabel} <span className="text-status-red">*</span>
                  </label>
                  <input type="date" name="birthdate" value={formData.birthdate} onChange={handleInputChange}
                    className={CLS_INPUT} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    {t.nationalityLabel} <span className="text-status-red">*</span>
                  </label>
                  <input type="text" name="nationality" value={formData.nationality} onChange={handleInputChange}
                    placeholder="Française" className={CLS_INPUT} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  {t.residenceLabel} <span className="text-status-red">*</span>
                </label>
                <input type="text" name="current_residence" value={formData.current_residence}
                  onChange={handleInputChange} placeholder="123 Rue de Rivoli, Paris" className={CLS_INPUT} />
              </div>
            </div>

            <NavFooter step={step} onPrev={handlePrev} onNext={handleNext} t={t} />
          </>
        )}

        {/* ── Step 2: Documents ───────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <h1 className="text-3xl md:text-4xl mb-3">{t.step2Title}</h1>
            <p className="text-text-secondary text-lg leading-relaxed mb-8">{t.step2Sub}</p>

            <section className="mb-6">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-base font-medium" style={{ color: "var(--text-primary)", fontFamily: "inherit" }}>
                  {t.passportLabel} <span className="text-status-red">*</span>
                </h3>
                <span className="text-xs text-text-muted">{t.passportHint}</span>
              </div>
              {passportFileName ? (
                <UploadedCard fileName={passportFileName} isUploading={isUploadingPassport}
                  ocrLabel={t.ocrBadge} replaceLabel={t.replace} uploadedLabel={t.uploaded}
                  onReplace={() => passportInputRef.current?.click()}
                  inputRef={passportInputRef}
                  onFileChange={(e) => handleFileUpload(e, "passport_path")} />
              ) : (
                <DropZone isUploading={isUploadingPassport} label={t.dropZone} sublabel={t.dropZoneSub}
                  uploadingLabel={t.uploading} inputRef={passportInputRef}
                  onFileChange={(e) => handleFileUpload(e, "passport_path")} />
              )}
            </section>

            <section className="mb-8">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="text-base font-medium" style={{ color: "var(--text-primary)", fontFamily: "inherit" }}>
                  {t.addressLabel} <span className="text-status-red">*</span>
                </h3>
                <span className="text-xs text-text-muted">{t.addressHint}</span>
              </div>
              <p className="text-xs text-text-muted mb-3">{t.addressSub}</p>
              {addressFileName ? (
                <UploadedCard fileName={addressFileName} isUploading={isUploadingAddress}
                  ocrLabel={t.ocrBadge} replaceLabel={t.replace} uploadedLabel={t.uploaded}
                  onReplace={() => addressInputRef.current?.click()}
                  inputRef={addressInputRef}
                  onFileChange={(e) => handleFileUpload(e, "proof_of_address_path")} />
              ) : (
                <DropZone isUploading={isUploadingAddress} label={t.dropZone} sublabel={t.dropZoneSub}
                  uploadingLabel={t.uploading} inputRef={addressInputRef}
                  onFileChange={(e) => handleFileUpload(e, "proof_of_address_path")} />
              )}
            </section>

            <aside className="rounded-lg p-5 mb-8 flex gap-4"
              style={{ background: "var(--status-amber-bg)", border: "1px solid var(--status-amber-border)" }}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--status-amber)" }} />
              <div className="text-sm">
                <p className="font-semibold mb-1" style={{ color: "var(--status-amber)" }}>{t.infoBlockTitle}</p>
                <p className="text-text-secondary">{t.infoBlockBody}</p>
              </div>
            </aside>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-muted mb-8 pb-8 border-b border-surface-mist">
              <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" />{t.trust1}</span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                {t.trust2}
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="6" /><path d="M9 14l-2 8 5-3 5 3-2-8" />
                </svg>
                {t.trust3}
              </span>
            </div>

            <NavFooter step={step} onPrev={handlePrev} onNext={handleNext} t={t}
              nextLabel={t.continue}
              nextDisabled={!formData.passport_path || !formData.proof_of_address_path} />
            {(!formData.passport_path || !formData.proof_of_address_path) && (
              <p className="text-xs text-text-muted mt-3 text-right">{t.uploadBothHint}</p>
            )}
          </>
        )}

        {/* ── Step 3: Procuration ─────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <h1 className="text-3xl md:text-4xl mb-3">{t.step3Title}</h1>
            <p className="text-text-secondary text-lg leading-relaxed mb-8">{t.step3Sub}</p>

            <div className="rounded-xl border border-surface-mist bg-surface-card p-6 shadow-card mb-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-surface-page flex items-center justify-center flex-shrink-0">
                  <FileText className="w-6 h-6 text-text-muted" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-text-primary mb-1">{t.step3CardTitle}</p>
                  <p className="text-sm text-text-secondary mb-4">{t.step3CardBody}</p>
                  <a href="#"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-surface-mist bg-transparent text-text-secondary hover:bg-surface-page transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45"
                    aria-label={t.downloadTemplate}
                    onClick={(e) => e.preventDefault()}
                  >
                    <FileText className="w-4 h-4" />
                    {t.downloadTemplate}
                  </a>
                </div>
              </div>
            </div>

            <p className="text-sm text-text-muted mb-8">{t.step3Note}</p>

            <NavFooter step={step} onPrev={handlePrev} onNext={handleNext} t={t} nextLabel={t.continue} />
          </>
        )}

        {/* ── Step 4: Review ──────────────────────────────────────────────── */}
        {step === 4 && (
          <>
            <h1 className="text-3xl md:text-4xl mb-3">{t.reviewTitle}</h1>
            <p className="text-text-secondary text-lg leading-relaxed mb-8">{t.reviewSub}</p>

            <div className="bg-surface-page border border-surface-mist rounded-xl p-5 mb-8 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ReviewRow label={t.fullNameLabel} value={formData.fullname} />
                <ReviewRow label={t.birthdateLabel} value={formData.birthdate} />
                <ReviewRow label={t.nationalityLabel} value={formData.nationality} />
                <ReviewRow label={t.residenceLabel} value={formData.current_residence} />
              </div>
              <div className="pt-4 border-t border-surface-mist space-y-2">
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <FileText className="w-4 h-4 text-brand-secondary" />
                  <span>Passeport : <strong className="text-status-green">{passportFileName}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-secondary">
                  <FileText className="w-4 h-4 text-brand-secondary" />
                  <span>Justificatif : <strong className="text-status-green">{addressFileName}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button type="button" onClick={handlePrev} className={CLS_BTN_OUTLINE} disabled={isLoading}>
                <ChevronLeft className="w-4 h-4" />{t.back}
              </button>
              <button type="button" onClick={handleReviewSubmit} className={CLS_BTN_PRIMARY} disabled={isLoading}>
                {isLoading ? "Envoi..." : t.validateAndPay}<ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ── Step 5: Payment ─────────────────────────────────────────────── */}
        {step === 5 && (
          <>
            <h1 className="text-3xl md:text-4xl mb-3">{t.paymentTitle}</h1>
            <p className="text-text-secondary text-lg leading-relaxed mb-6">{t.paymentSub}</p>

            <div className="flex items-center justify-between bg-surface-page border border-surface-mist rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-brand-secondary" />
                <div>
                  <span className="block font-semibold text-sm text-text-primary">NIF Standard Application</span>
                  <span className="block text-xs text-text-muted">Service 100% en ligne</span>
                </div>
              </div>
              <span className="font-serif font-bold text-xl text-brand-primary">{t.price}</span>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">{t.cardNumberLabel}</label>
                <input type="text" name="cardNumber" value={paymentData.cardNumber}
                  onChange={handlePaymentChange} placeholder="4242 4242 4242 4242" className={CLS_INPUT} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">{t.expiryLabel}</label>
                  <input type="text" name="expiry" value={paymentData.expiry}
                    onChange={handlePaymentChange} placeholder="MM/AA" className={CLS_INPUT} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">{t.cvcLabel}</label>
                  <input type="text" name="cvc" value={paymentData.cvc}
                    onChange={handlePaymentChange} placeholder="123" className={CLS_INPUT} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-surface-mist">
                <button type="button" onClick={handlePrev} className={CLS_BTN_OUTLINE} disabled={isLoading}>
                  <ChevronLeft className="w-4 h-4" />{t.back}
                </button>
                <button type="submit" className={CLS_BTN_PRIMARY} disabled={isLoading}>
                  {isLoading ? t.processingPayment : t.payBtn}
                </button>
              </div>
            </form>
          </>
        )}

        {/* ── Step 6: Success ─────────────────────────────────────────────── */}
        {step === 6 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border"
              style={{ background: "var(--status-green-bg)", borderColor: "var(--status-green-border)" }}>
              <Check className="w-8 h-8" style={{ color: "var(--status-green)" }} />
            </div>
            <h1 className="text-3xl mb-3">{t.successTitle}</h1>
            <p className="text-text-secondary mb-8 max-w-md mx-auto leading-relaxed">{t.successDesc}</p>
            <a href="/" className={CLS_BTN_PRIMARY}>{t.backHomeBtn}</a>
          </div>
        )}

      </main>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface DropZoneProps {
  isUploading: boolean;
  label: string;
  sublabel: string;
  uploadingLabel: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function DropZone({ isUploading, label, sublabel, uploadingLabel, inputRef, onFileChange }: DropZoneProps) {
  return (
    <label className="block rounded-xl border-2 border-dashed border-surface-mist bg-surface-card p-10 text-center cursor-pointer hover:border-brand-primary transition focus-within:ring-[3px] focus-within:ring-brand-primary/20">
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
        onChange={onFileChange} className="sr-only" />
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
        className="mx-auto mb-3 text-text-muted">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <p className="font-medium text-sm text-text-primary mb-1">
        {isUploading ? uploadingLabel : label}
      </p>
      <p className="text-xs text-text-muted">{sublabel}</p>
    </label>
  );
}

interface UploadedCardProps {
  fileName: string;
  isUploading: boolean;
  ocrLabel: string;
  replaceLabel: string;
  uploadedLabel: string;
  onReplace: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function UploadedCard({ fileName, isUploading, ocrLabel, replaceLabel, uploadedLabel, onReplace, inputRef, onFileChange }: UploadedCardProps) {
  return (
    <div className="rounded-xl border border-surface-mist bg-surface-card p-4 shadow-card">
      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
        onChange={onFileChange} className="sr-only" aria-hidden="true" tabIndex={-1} />
      <div className="flex items-start gap-4">
        <div className="w-20 h-24 rounded-md border border-surface-mist flex-shrink-0 flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, var(--surface-page) 0%, var(--surface-mist) 100%)" }}>
          <FileText className="w-8 h-8 text-brand-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-text-primary truncate">{fileName}</p>
          <p className="text-xs text-text-muted">{isUploading ? "..." : uploadedLabel}</p>
          <div className="mt-2 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border"
            style={{ background: "var(--status-green-bg)", color: "var(--status-green)", borderColor: "var(--status-green-border)" }}>
            <Check className="w-3 h-3" />{ocrLabel}
          </div>
        </div>
        <button type="button" onClick={onReplace}
          className="border border-surface-mist bg-transparent text-text-secondary text-xs rounded-md px-2.5 py-1.5 hover:bg-surface-page focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45 transition flex-shrink-0">
          {replaceLabel}
        </button>
      </div>
    </div>
  );
}

interface NavFooterProps {
  step: number;
  onPrev: () => void;
  onNext: () => void;
  t: T;
  nextLabel?: string;
  nextDisabled?: boolean;
}

function NavFooter({ step, onPrev, onNext, t, nextLabel, nextDisabled = false }: NavFooterProps) {
  const label = nextLabel ?? t.next;
  return (
    <div className="flex items-center justify-between mt-10 pt-8 border-t border-surface-mist">
      <button type="button" onClick={onPrev} disabled={step === 1} className={CLS_BTN_OUTLINE}>
        <ChevronLeft className="w-4 h-4" />{t.back}
      </button>
      <button type="button" onClick={onNext} disabled={nextDisabled} className={CLS_BTN_PRIMARY}>
        {label}<ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block text-xs font-bold text-text-muted uppercase tracking-wide mb-0.5">{label}</span>
      <span className="text-text-primary font-medium text-sm">{value}</span>
    </div>
  );
}
