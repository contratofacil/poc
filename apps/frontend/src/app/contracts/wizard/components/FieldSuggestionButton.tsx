"use client";

import React, { useState } from "react";
import { Loader2, Sparkles, Check, X } from "lucide-react";
import { getApiUrl } from "@/lib/api";
import { useEasyLawAuth } from "@/lib/privy";
import type { TemplateField } from "./FieldInput";

interface Props {
  field: TemplateField;
  formData: Record<string, string>;
  templateId: string;
  lang: "FR" | "PT";
  onAccept: (value: string) => void;
}

export function FieldSuggestionButton({ field, formData, templateId, lang, onAccept }: Props) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getAccessToken } = useEasyLawAuth();

  const handleSuggest = async () => {
    setLoading(true);
    setSuggestion(null);
    setError(null);
    try {
      const token = await getAccessToken();
      // Pass already-answered fields as context, excluding the current field
      const answers = Object.fromEntries(
        Object.entries(formData).filter(([k]) => k !== field.key && k !== '_lang'),
      );
      const res = await fetch(getApiUrl("/api/contracts/suggest-field"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ templateId, fieldKey: field.key, lang, answers }),
      });
      const json = await res.json();
      if (json.success && json.suggestion) {
        setSuggestion(json.suggestion);
      } else {
        setError(json.message || (lang === "FR" ? "Suggestion indisponible." : "Sugestão indisponível."));
      }
    } catch {
      setError(lang === "FR" ? "Erreur réseau." : "Erro de rede.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestion) {
      onAccept(suggestion);
      setSuggestion(null);
    }
  };

  const handleDismiss = () => {
    setSuggestion(null);
    setError(null);
  };

  return (
    <div className="mb-3">
      {!suggestion && (
        <button
          type="button"
          onClick={handleSuggest}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-surface-mist text-text-secondary hover:bg-surface-page transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45 disabled:opacity-50"
        >
          {loading
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Sparkles className="w-3 h-3" style={{ color: "var(--brand-primary)" }} />}
          {lang === "FR" ? "Suggestion IA" : "Sugestão IA"}
        </button>
      )}

      {error && !suggestion && (
        <p className="text-xs mt-1" style={{ color: "var(--status-red)" }}>{error}</p>
      )}

      {suggestion && (
        <div className="rounded-lg border p-3 text-sm" style={{ background: "var(--surface-card)", borderColor: "var(--brand-primary)", borderWidth: "1px" }}>
          <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--brand-primary)" }}>
            {lang === "FR" ? "Suggestion IA :" : "Sugestão IA :"}
          </p>
          <p className="text-text-primary leading-relaxed whitespace-pre-wrap mb-3">{suggestion}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-text-inverse transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45"
              style={{ background: "var(--brand-primary)" }}
            >
              <Check className="w-3 h-3" />
              {lang === "FR" ? "Utiliser" : "Usar"}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-surface-mist text-text-secondary hover:bg-surface-page transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45"
            >
              <X className="w-3 h-3" />
              {lang === "FR" ? "Ignorer" : "Ignorar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
