"use client";

import React, { useState, useEffect } from "react";
import { Shield, Globe, FileText, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEasyLawAuth } from "@/lib/privy";
import { AuthGuard } from "@/components/auth/AuthGuard";
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
    <main className="min-h-screen bg-[#FAFAF8] flex flex-col antialiased selection:bg-[#C9A84C] selection:text-white">
      {/* Header */}
      <header className="w-full bg-white border-b border-[#E2E8F0] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-[#1A365D]">
            <Shield className="w-6 h-6 text-[#C9A84C]" />
            <span className="font-semibold text-lg font-serif">EasyLaw</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/vault" className="text-sm font-semibold text-[#1A365D] hover:text-[#C9A84C] transition">
              Coffre-Fort
            </Link>
            <button
              onClick={() => setLang((p) => (p === "FR" ? "PT" : "FR"))}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E2E8F0] text-sm text-[#1A365D] hover:bg-[#FAFAF8] transition"
            >
              <Globe className="w-4 h-4 text-[#C9A84C]" />
              <span className="font-semibold">{lang}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-12 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#1A365D] blur-3xl" />
          <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#C9A84C] blur-3xl" />
        </div>

        <div className="mb-10 text-center relative z-10">
          <h1 className="text-3xl font-bold text-[#1A365D] font-serif mb-2">{t.title}</h1>
          <p className="text-gray-600 text-sm max-w-md mx-auto">{t.subtitle}</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 relative z-10">
            <Loader2 className="w-10 h-10 text-[#C9A84C] animate-spin mb-4" />
            <p className="text-gray-500 text-sm">{t.loading}</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20 relative z-10">
            <p className="text-gray-500 text-sm">{t.emptyTemplates}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white border border-[#E2E8F0] rounded-xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs bg-[#C9A84C]/10 text-[#C9A84C] px-2.5 py-1 rounded-full font-bold">
                      {t.badgeVerified}
                    </span>
                    <span className="text-xs text-gray-400 font-bold uppercase">{tpl.type}</span>
                  </div>
                  <h3 className="text-lg font-bold text-[#1A365D] font-serif mb-2">{tpl.name}</h3>
                  <p className="text-gray-600 text-xs leading-relaxed mb-6">{tpl.description}</p>
                </div>
                <Link
                  href={`/contracts/wizard?templateId=${tpl.id}&type=${tpl.type}`}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#1A365D] hover:bg-[#1A365D]/90 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                >
                  <span>{t.generateBtn}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ContractsCataloguePage() {
  return (
    <AuthGuard>
      <ContractsCatalogueContent />
    </AuthGuard>
  );
}
