"use client";

import { useState, useEffect, Suspense } from "react";
import { useLogin } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Globe, Loader2 } from "lucide-react";
import { useEasyLawAuth } from "@/lib/privy";

const translations = {
  FR: {
    heading: "Accédez à votre espace juridique",
    subtitle: "Inscription ou connexion en quelques secondes — email, Google, passkey…",
    cta: "Continuer",
    legal: "En continuant, vous acceptez les",
    cgu: "CGU",
    and: "et la",
    privacy: "Politique de confidentialité",
    loading: "Chargement…",
  },
  PT: {
    heading: "Aceda ao seu espaço jurídico",
    subtitle: "Registo ou início de sessão em segundos — email, Google, passkey…",
    cta: "Continuar",
    legal: "Ao continuar, aceita os",
    cgu: "Termos de Utilização",
    and: "e a",
    privacy: "Política de Privacidade",
    loading: "A carregar…",
  },
};

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, ready } = useEasyLawAuth();
  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const t = translations[lang];

  const redirectTo = searchParams.get("redirect") || "/contracts";

  const { login } = useLogin({
    onComplete: () => {
      router.push(redirectTo);
    },
  });

  useEffect(() => {
    if (ready && authenticated) {
      router.push(redirectTo);
    }
  }, [ready, authenticated, router, redirectTo]);

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAFAF8]">
        <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin mb-4" />
        <p className="text-gray-500 text-sm">{translations.FR.loading}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 antialiased selection:bg-[#C9A84C] selection:text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#1A365D] blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#C9A84C] blur-3xl" />
      </div>

      <div className="w-full max-w-lg bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-8 relative z-10 text-center">
        {/* Logo + lang toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 text-[#1A365D]">
            <Shield className="w-7 h-7 text-[#C9A84C]" />
            <span className="font-semibold text-xl font-serif">EasyLaw</span>
          </div>
          <button
            onClick={() => setLang(lang === "FR" ? "PT" : "FR")}
            className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#1A365D] transition"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{lang === "FR" ? "PT" : "FR"}</span>
          </button>
        </div>

        <h1 className="text-2xl font-bold text-[#1A365D] font-serif mb-2">
          {t.heading}
        </h1>
        <p className="text-[#64748B] text-sm mb-8">
          {t.subtitle}
        </p>

        <button
          onClick={login}
          className="w-full py-3 px-4 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition shadow-md hover:shadow-lg"
        >
          {t.cta}
        </button>

        <p className="mt-6 text-xs text-[#94A3B8]">
          {t.legal}{" "}
          <a href="https://easylaw.pt/cgu" className="underline hover:text-[#1A365D]">
            {t.cgu}
          </a>
          {" "}{t.and}{" "}
          <a href="https://easylaw.pt/privacy" className="underline hover:text-[#1A365D]">
            {t.privacy}
          </a>.
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAFAF8]">
        <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Chargement…</p>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
