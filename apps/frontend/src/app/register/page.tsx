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
          {translations.FR.loading}
        </p>
      </div>
    );
  }

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
        {/* Logo + lang toggle */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2" style={{ color: "var(--brand-primary)" }}>
            <Shield className="w-7 h-7" style={{ color: "var(--brand-secondary)" }} aria-hidden="true" />
            <span className="font-semibold text-xl" style={{ fontFamily: "var(--font-serif)" }}>
              EasyLaw
            </span>
          </div>
          <button
            onClick={() => setLang(lang === "FR" ? "PT" : "FR")}
            className="flex items-center gap-1.5 text-xs transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45 rounded"
            style={{ color: "var(--text-secondary)" }}
          >
            <Globe className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{lang === "FR" ? "PT" : "FR"}</span>
          </button>
        </div>

        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
        >
          {t.heading}
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
          {t.subtitle}
        </p>

        <button
          onClick={login}
          className="w-full py-3 px-4 rounded-lg text-sm font-semibold transition shadow-md hover:shadow-lg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45"
          style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
        >
          {t.cta}
        </button>

        <p className="mt-6 text-xs" style={{ color: "var(--text-muted)" }}>
          {t.legal}{" "}
          <a
            href="https://easylaw.pt/cgu"
            className="underline transition hover:opacity-80"
            style={{ color: "var(--brand-primary)" }}
          >
            {t.cgu}
          </a>
          {" "}{t.and}{" "}
          <a
            href="https://easylaw.pt/privacy"
            className="underline transition hover:opacity-80"
            style={{ color: "var(--brand-primary)" }}
          >
            {t.privacy}
          </a>.
        </p>
      </div>
    </main>
  );
}

export default function RegisterPage() {
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
            Chargement…
          </p>
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
