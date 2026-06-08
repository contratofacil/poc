"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Eye, EyeOff, Check, AlertCircle, Globe } from "lucide-react";
import Link from "next/link";

// Translation dictionary
const translations = {
  FR: {
    title: "Connexion à votre compte",
    subtitle: "Accédez à votre assistant juridique EasyLaw",
    emailLabel: "Adresse e-mail",
    passwordLabel: "Mot de passe",
    submitBtn: "Se connecter",
    submitting: "Connexion en cours...",
    successTitle: "Connexion réussie !",
    successDesc: "Vous êtes connecté avec succès.",
    errorGeneric: "Une erreur est survenue lors de la connexion.",
    validationEmail: "Veuillez entrer une adresse e-mail valide.",
    validationPassword: "Le mot de passe est requis.",
    noAccount: "Vous n'avez pas de compte ?",
    registerLink: "S'inscrire",
  },
  PT: {
    title: "Iniciar sessão na sua conta",
    subtitle: "Aceda ao seu assistente jurídico EasyLaw",
    emailLabel: "Endereço de e-mail",
    passwordLabel: "Palavra-passe",
    submitBtn: "Entrar",
    submitting: "A entrar...",
    successTitle: "Sessão iniciada com sucesso!",
    successDesc: "Iniciou sessão com sucesso.",
    errorGeneric: "Ocorreu um erro durante o início de sessão.",
    validationEmail: "Por favor, introduza um e-mail válido.",
    validationPassword: "A palavra-passe é obrigatória.",
    noAccount: "Não tem uma conta?",
    registerLink: "Registar",
  },
};

export default function LoginPage() {
  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[lang];

  // Validation schema
  const loginSchema = z.object({
    email: z.string().email(t.validationEmail),
    password: z.string().min(1, t.validationPassword),
    lang: z.enum(["FR", "PT"]),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      lang: "FR",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(resData.message || t.errorGeneric);
      }

      // Save token to localStorage
      if (resData.token) {
        localStorage.setItem("token", resData.token);
      }

      setIsSuccess(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.errorGeneric;
      setApiError(message);
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
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-semibold text-[#1A365D]">{t.passwordLabel}</label>
                </div>
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
                {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>}
              </div>

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
              <span>{t.noAccount} </span>
              <Link href="/register" className="font-semibold text-[#C9A84C] hover:underline">
                {t.registerLink}
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
