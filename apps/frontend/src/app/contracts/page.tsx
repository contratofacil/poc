"use client";

import React, { useState, useEffect } from "react";
import { FileText, ArrowRight, Loader2, Globe } from "lucide-react";
import Link from "next/link";
import { useEasyLawAuth } from "@/lib/privy";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AppShell } from "@/components/site/AppShell";
import { apiFetch } from "@/lib/api";

interface Template {
  id: string;
  name: string;
  type: string;
  description: string;
}

const translations = {
  FR: {
    title: "Générateur de Contrats",
    subtitle: "Sélectionnez un modèle validé juridiquement pour démarrer le questionnaire",
    loading: "Chargement des modèles...",
    generateBtn: "Générer ce contrat",
    emptyTemplates: "Aucun modèle disponible pour le moment.",
    badgeVerified: "Vérifié NRAU",
  },
  PT: {
    title: "Gerador de Contratos",
    subtitle: "Selecione um modelo legalmente validado para iniciar o questionário",
    loading: "A carregar os modelos...",
    generateBtn: "Gerar este contrato",
    emptyTemplates: "Nenhum modelo disponível de momento.",
    badgeVerified: "Validado NRAU",
  },
};

function ContractsCatalogueContent() {
  const [lang, setLang] = useState<"FR" | "PT">("FR");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getAccessToken } = useEasyLawAuth();

  const t = translations[lang];

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const token = await getAccessToken();
        const res = await apiFetch("/api/contracts/templates", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.templates) {
            setTemplates(data.templates);
          }
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [getAccessToken]);

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-6xl mx-auto">
      {/* Toolbar row */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
          >
            {t.title}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {t.subtitle}
          </p>
        </div>
        <button
          onClick={() => setLang((p) => (p === "FR" ? "PT" : "FR"))}
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45"
          style={{
            borderColor: "var(--surface-mist-strong)",
            color: "var(--text-secondary)",
          }}
        >
          <Globe className="w-4 h-4" aria-hidden="true" />
          {lang}
        </button>
      </div>

      {/* Decorative blurs */}
      <div className="relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
          <div
            className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full blur-3xl"
            style={{ background: "var(--brand-primary)" }}
          />
          <div
            className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] rounded-full blur-3xl"
            style={{ background: "var(--brand-secondary)" }}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2
              className="w-10 h-10 animate-spin mb-4"
              style={{ color: "var(--brand-secondary)" }}
              aria-hidden="true"
            />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t.loading}
            </p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {t.emptyTemplates}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-xl p-6 shadow-[var(--shadow-card)] border flex flex-col justify-between transition hover:shadow-[var(--shadow-modal)]"
                style={{ background: "var(--surface-card)", borderColor: "var(--surface-mist)" }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-bold"
                      style={{
                        background: "rgba(212,160,23,0.1)",
                        color: "var(--brand-secondary)",
                      }}
                    >
                      {t.badgeVerified}
                    </span>
                    <span className="text-xs font-bold uppercase" style={{ color: "var(--text-muted)" }}>
                      {tpl.type}
                    </span>
                  </div>
                  <h3
                    className="text-lg font-bold mb-2"
                    style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
                  >
                    {tpl.name}
                  </h3>
                  <p className="text-xs leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
                    {tpl.description}
                  </p>
                </div>
                <Link
                  href={`/contracts/wizard?templateId=${tpl.id}&type=${tpl.type}`}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold transition shadow-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45"
                  style={{ background: "var(--brand-primary)", color: "var(--text-inverse)" }}
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{t.generateBtn}</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContractsCataloguePage() {
  return (
    <AuthGuard>
      <AppShell
        requireAuth={false}
        activeSection="contracts"
        breadcrumb={[{ label: "Contrats" }]}
      >
        <ContractsCatalogueContent />
      </AppShell>
    </AuthGuard>
  );
}
