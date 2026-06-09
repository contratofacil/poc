"use client";

import { useEffect, Suspense } from "react";
import { useLogin } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Globe, Loader2 } from "lucide-react";
import { useEasyLawAuth } from "@/lib/privy";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated } = useEasyLawAuth();

  const redirectTo = searchParams.get("redirect") || "/contracts";

  const { login } = useLogin({
    onComplete: () => {
      router.push(redirectTo);
    },
  });

  useEffect(() => {
    if (authenticated) {
      router.push(redirectTo);
    }
  }, [authenticated, router, redirectTo]);

  return (
    <main className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4 antialiased selection:bg-[#C9A84C] selection:text-white">
      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#1A365D] blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#C9A84C] blur-3xl" />
      </div>

      <div className="w-full max-w-lg bg-white border border-[#E2E8F0] shadow-xl rounded-2xl p-8 relative z-10 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 text-[#1A365D] mb-8">
          <Shield className="w-7 h-7 text-[#C9A84C]" />
          <span className="font-semibold text-xl font-serif">EasyLaw</span>
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-bold text-[#1A365D] font-serif mb-2">
          Accédez à votre espace juridique
        </h1>
        <p className="text-[#64748B] text-sm mb-8">
          Inscription ou connexion en quelques secondes — email, Google, passkey…
        </p>

        {/* CTA */}
        <button
          onClick={login}
          className="w-full py-3 px-4 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-sm font-semibold transition shadow-md hover:shadow-lg"
        >
          Continuer
        </button>

        <p className="mt-6 text-xs text-[#94A3B8]">
          En continuant, vous acceptez les{" "}
          <a href="https://easylaw.pt/cgu" className="underline hover:text-[#1A365D]">CGU</a>
          {" "}et la{" "}
          <a href="https://easylaw.pt/privacy" className="underline hover:text-[#1A365D]">Politique de confidentialité</a>.
        </p>

        {/* Lang badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#64748B]">
          <Globe className="w-3.5 h-3.5" />
          <span>Disponível em Português · Available in English</span>
        </div>
      </div>
    </main>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAFAF8]">
        <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin mb-4" />
        <p className="text-gray-500 text-sm">Chargement...</p>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
