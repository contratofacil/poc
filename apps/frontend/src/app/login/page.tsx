"use client";

import { useEffect, Suspense } from "react";
import { useLogin } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Globe, Loader2 } from "lucide-react";
import { useEasyLawAuth } from "@/lib/privy";

function LoginContent() {
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
    <main
      className="min-h-screen flex items-center justify-center p-4 antialiased"
      style={{ background: "var(--surface-page)" }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
        <div
          className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: "var(--brand-primary)" }}
        />
        <div
          className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: "var(--brand-secondary)" }}
        />
      </div>

      <div
        className="w-full max-w-lg rounded-2xl p-8 relative z-10 text-center shadow-[var(--shadow-modal)] border"
        style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
      >
        <div className="flex items-center justify-center gap-2 mb-8" style={{ color: "var(--brand-primary)" }}>
          <Shield className="w-7 h-7" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
          <span className="font-semibold text-xl" style={{ fontFamily: "var(--font-serif)" }}>
            EasyLaw
          </span>
        </div>

        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
        >
          Connexion à votre compte
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
          Email, Google, LinkedIn, passkey ou SMS — un clic suffit.
        </p>

        <button
          onClick={login}
          className="w-full py-3 px-4 rounded-lg text-sm font-semibold transition shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45"
          style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
        >
          Se connecter
        </button>

        <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
          En continuant, vous acceptez les{" "}
          <a
            href="/legal/terms"
            className="underline transition hover:opacity-80 focus-visible:outline-none"
            style={{ color: "var(--brand-primary)" }}
          >
            CGU
          </a>
          {" "}et la{" "}
          <a
            href="/legal/privacy"
            className="underline transition hover:opacity-80 focus-visible:outline-none"
            style={{ color: "var(--brand-primary)" }}
          >
            Politique de confidentialité
          </a>
          .
        </p>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <Globe className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Disponível em Português · Available in English</span>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex flex-col items-center justify-center min-h-screen"
          style={{ background: "var(--surface-page)" }}
        >
          <Loader2
            className="w-10 h-10 animate-spin mb-4"
            style={{ color: "var(--brand-secondary)" }}
            aria-hidden="true"
          />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Chargement...
          </p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
