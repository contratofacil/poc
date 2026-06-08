"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Eye, EyeOff, Check, AlertCircle, Globe } from "lucide-react";

// Translation dictionary
const translations = {
  FR: {
    title: "Créer votre compte EasyLaw",
    subtitle: "Démocratiser l'accès au droit au Portugal",
    nameLabel: "Nom complet",
    emailLabel: "Adresse e-mail",
    passwordLabel: "Mot de passe",
    passwordHint: "Au moins 8 caractères, 1 majuscule et 1 chiffre",
    langLabel: "Langue préférée",
    cguLabel: "J'accepte les Conditions Générales d'Utilisation (CGU)",
    privacyLabel: "J'accepte la Politique de Confidentialité",
    submitBtn: "S'inscrire",
    submitting: "Inscription en cours...",
    successTitle: "Inscription réussie !",
    successDesc: "Un e-mail de validation vous a été envoyé. Veuillez vérifier votre boîte de réception.",
    errorGeneric: "Une erreur est survenue lors de l'inscription.",
    validationName: "Le nom doit comporter au moins 2 caractères.",
    validationEmail: "Veuillez entrer une adresse e-mail valide.",
    validationPassword: "Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.",
    validationCgu: "Vous devez accepter les CGU.",
    validationPrivacy: "Vous devez accepter la politique de confidentialité.",
    alreadyHaveAccount: "Vous avez déjà un compte ?",
    loginLink: "Se connecter",
  },
  PT: {
    title: "Criar a sua conta EasyLaw",
    subtitle: "Democratizar o acesso ao direito em Portugal",
    nameLabel: "Nome completo",
    emailLabel: "Endereço de e-mail",
    passwordLabel: "Palavra-passe",
    passwordHint: "Pelo menos 8 caracteres, 1 maiúscula e 1 número",
    langLabel: "Idioma de preferência",
    cguLabel: "Aceito os Termos Gerais de Utilização (CGU)",
    privacyLabel: "Aceito a Política de Privacidade",
    submitBtn: "Registar",
    submitting: "A registar...",
    successTitle: "Registo bem-sucedido!",
    successDesc: "Um e-mail de validação foi enviado. Por favor, verifique a sua caixa de entrada.",
    errorGeneric: "Ocorreu um erro durante o registo.",
    validationName: "O nome deve ter pelo menos 2 caracteres.",
    validationEmail: "Por favor, introduza um e-mail válido.",
    validationPassword: "A palavra-passe deve ter pelo menos 8 caracteres, uma maiúscula e um número.",
    validationCgu: "Deve aceitar os CGU.",
    validationPrivacy: "Deve aceitar a política de privacidade.",
    alreadyHaveAccount: "Já tem uma conta?",
    loginLink: "Iniciar sessão",
  },
};

export default function RegisterPage() {
  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[lang];

  // Validation schema matching backend constraints
  const registerSchema = z.object({
    name: z.string().min(2, t.validationName),
    email: z.string().email(t.validationEmail),
    password: z.string().refine((val) => {
      return val.length >= 8 && /[A-Z]/.test(val) && /[0-9]/.test(val);
    }, t.validationPassword),
    lang: z.enum(["FR", "PT"]),
    acceptCgu: z.boolean().refine((val) => val === true, t.validationCgu),
    acceptPrivacy: z.boolean().refine((val) => val === true, t.validationPrivacy),
  });

  type RegisterFormData = z.infer<typeof registerSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      lang: "FR",
      acceptCgu: false,
      acceptPrivacy: false,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await fetch("http://localhost:3001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          lang: data.lang,
          acceptCgu: data.acceptCgu,
          acceptPrivacy: data.acceptPrivacy,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || t.errorGeneric);
      }

      setIsSuccess(true);
    } catch (err: any) {
      setApiError(err.message || t.errorGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = lang === "FR" ? "PT" : "FR";
    setLang(newLang);
    setValue("lang", newLang);
  };

  return (
    <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 antialiased selection:bg-[#C9A84C] selection:text-white">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#1A365D] blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#C9A84C] blur-3xl"></div>
      </div>

      <div className="w-full max-w-lg bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-8 relative z-10">
        {/* Language switch */}
        <div className="flex justify-between items-center mb-6">
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

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A365D] font-serif mb-2">{t.successTitle}</h2>
            <p className="text-[#64748B] text-sm">{t.successDesc}</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[#1A365D] font-serif mb-1">{t.title}</h1>
              <p className="text-[#64748B] text-sm">{t.subtitle}</p>
            </div>

            {apiError && (
              <div className="p-4 mb-6 rounded-lg bg-red-50 border border-red-100 text-red-700 text-sm flex gap-2 items-start">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Name field */}
              <div>
                <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">{t.nameLabel}</label>
                <input
                  type="text"
                  {...register("name")}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm transition focus:outline-none focus:ring-2 focus:ring-[#1A365D]/20 ${
                    errors.name ? "border-red-500 focus:border-red-500" : "border-[#E2E8F0] focus:border-[#1A365D]"
                  }`}
                  placeholder="Lucas Martin"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600 font-medium">{errors.name.message}</p>}
              </div>

              {/* Email field */}
              <div>
                <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">{t.emailLabel}</label>
                <input
                  type="email"
                  {...register("email")}
                  className={`w-full px-4 py-2.5 rounded-lg border text-sm transition focus:outline-none focus:ring-2 focus:ring-[#1A365D]/20 ${
                    errors.email ? "border-red-500 focus:border-red-500" : "border-[#E2E8F0] focus:border-[#1A365D]"
                  }`}
                  placeholder="lucas@example.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>}
              </div>

              {/* Password field */}
              <div>
                <label className="block text-sm font-semibold text-[#1A365D] mb-1.5">{t.passwordLabel}</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    className={`w-full px-4 py-2.5 pr-10 rounded-lg border text-sm transition focus:outline-none focus:ring-2 focus:ring-[#1A365D]/20 ${
                      errors.password ? "border-red-500 focus:border-red-500" : "border-[#E2E8F0] focus:border-[#1A365D]"
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-400">{t.passwordHint}</p>
                {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>}
              </div>

              {/* Accept CGU */}
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="acceptCgu"
                  {...register("acceptCgu")}
                  className="mt-1 rounded text-[#C9A84C] focus:ring-[#C9A84C] border-gray-300 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="acceptCgu" className="text-xs text-gray-600 cursor-pointer select-none leading-relaxed">
                  {t.cguLabel}
                </label>
              </div>
              {errors.acceptCgu && <p className="text-xs text-red-600 font-medium">{errors.acceptCgu.message}</p>}

              {/* Accept Privacy */}
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="acceptPrivacy"
                  {...register("acceptPrivacy")}
                  className="mt-1 rounded text-[#C9A84C] focus:ring-[#C9A84C] border-gray-300 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="acceptPrivacy" className="text-xs text-gray-600 cursor-pointer select-none leading-relaxed">
                  {t.privacyLabel}
                </label>
              </div>
              {errors.acceptPrivacy && <p className="text-xs text-red-600 font-medium">{errors.acceptPrivacy.message}</p>}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 mt-2 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition shadow-md hover:shadow-lg disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {isLoading ? t.submitting : t.submitBtn}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              <span>{t.alreadyHaveAccount} </span>
              <a href="#" className="font-semibold text-[#C9A84C] hover:underline">
                {t.loginLink}
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
