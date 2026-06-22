"use client";

import React, { useState } from "react";
import { Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { useEasyLawAuth } from "@/lib/privy";

interface Props {
  templateId: string;
  lang: "FR" | "PT";
  onApply: (data: Record<string, string>) => void;
}

const CLS_BTN_PRIMARY = [
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition",
  "bg-brand-primary text-text-inverse shadow-card",
  "hover:bg-brand-primary-hover",
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45",
  "disabled:opacity-50 disabled:cursor-not-allowed",
].join(" ");

export function FreeTextGenerator({ templateId, lang, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const { getAccessToken } = useEasyLawAuth();

  const label = lang === "FR"
    ? "Décrire ma situation en langage libre"
    : "Descrever a minha situação em linguagem livre";

  const placeholder = lang === "FR"
    ? "Ex : NDA bilatéral entre TechCorp SA (France) et Acme Lda (Portugal) pour un projet de développement logiciel de 18 mois. Les informations confidentielles couvrent les algorithmes propriétaires et les données clients…"
    : "Ex : NDA bilateral entre TechCorp SA (França) e Acme Lda (Portugal) para um projeto de desenvolvimento de software de 18 meses…";

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setLoading(true);
    setError(null);
    setApplied(false);
    try {
      const token = await getAccessToken();
      const res = await fetch(getApiUrl("/api/contracts/extract-fields"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ templateId, description, lang }),
      });
      const json = await res.json();
      if (!json.success || !json.data || Object.keys(json.data).length === 0) {
        setError(
          json.message ||
          (lang === "FR"
            ? "Impossible d'extraire les informations. Répondez aux questions manuellement."
            : "Impossível extrair as informações. Responda às perguntas manualmente."),
        );
        return;
      }
      onApply(json.data);
      setApplied(true);
      setOpen(false);
    } catch {
      setError(
        lang === "FR"
          ? "Erreur réseau. Réessayez ou répondez aux questions manuellement."
          : "Erro de rede. Tente novamente ou responda às perguntas manualmente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8 rounded-xl border border-surface-mist bg-surface-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-text-secondary hover:bg-surface-page transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "var(--brand-primary)" }} />
          {label}
          {applied && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "var(--status-green-bg)", color: "var(--status-green)" }}>
              {lang === "FR" ? "Appliqué ✓" : "Aplicado ✓"}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-surface-mist">
          <p className="text-xs text-text-muted mb-3">
            {lang === "FR"
              ? "Décrivez votre situation et l'IA pré-remplira le formulaire. Vous pourrez ensuite réviser chaque champ."
              : "Descreva a sua situação e a IA irá pré-preencher o formulário. Poderá depois rever cada campo."}
          </p>
          <textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); setError(null); }}
            placeholder={placeholder}
            rows={5}
            className="w-full px-3.5 py-2.5 rounded-lg text-sm transition bg-surface-card border border-surface-mist-strong text-text-primary placeholder:text-text-muted focus:outline-none focus:border-brand-primary focus:ring-[3px] focus:ring-brand-primary/20 resize-none mb-3"
          />
          {error && (
            <p className="text-xs mb-3" style={{ color: "var(--status-red)" }}>{error}</p>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !description.trim()}
            className={CLS_BTN_PRIMARY}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {lang === "FR" ? "Pré-remplir le formulaire" : "Pré-preencher o formulário"}
          </button>
        </div>
      )}
    </div>
  );
}
