"use client";

import React from "react";
import { AlertCircle, Info, X, CheckCircle, ArrowLeft } from "lucide-react";

export interface ComplianceFinding {
  field?: string;
  severity: "warning" | "info";
  message: string;
}

interface Props {
  findings: ComplianceFinding[];
  lang: "FR" | "PT";
  onAcknowledge: () => void;
  onGoBack: (fieldKey?: string) => void;
}

const CLS_BTN_PRIMARY = [
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition",
  "bg-brand-primary text-text-inverse shadow-card",
  "hover:bg-brand-primary-hover",
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45",
].join(" ");

const CLS_BTN_OUTLINE = [
  "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition",
  "border border-surface-mist bg-transparent text-text-secondary",
  "hover:bg-surface-page",
  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-primary/45",
].join(" ");

export function ComplianceReviewModal({ findings, lang, onAcknowledge, onGoBack }: Props) {
  const warnings = findings.filter((f) => f.severity === "warning");
  const infos = findings.filter((f) => f.severity === "info");
  const firstWarningField = warnings[0]?.field;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compliance-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
    >
      <div className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden" style={{ background: "var(--surface-card)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--surface-mist)" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--status-amber-bg)" }}>
              <AlertCircle className="w-4 h-4" style={{ color: "var(--status-amber)" }} />
            </div>
            <h2 id="compliance-modal-title" className="font-semibold text-text-primary">
              {lang === "FR" ? "Revue de conformité" : "Revisão de conformidade"}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-3 max-h-96 overflow-y-auto">
          <p className="text-sm text-text-secondary mb-4">
            {lang === "FR"
              ? "Notre analyse juridique a relevé les points suivants avant finalisation :"
              : "A nossa análise jurídica identificou os seguintes pontos antes da finalização :"}
          </p>

          {warnings.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "var(--status-amber-bg)", border: "1px solid var(--status-amber-border)" }}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--status-amber)" }} />
              <p className="text-sm leading-relaxed" style={{ color: "var(--status-amber)" }}>{f.message}</p>
            </div>
          ))}

          {infos.map((f, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: "var(--status-blue-bg, #eff6ff)", border: "1px solid var(--status-blue-border, #bfdbfe)" }}>
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
              <p className="text-sm leading-relaxed text-blue-700">{f.message}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--surface-mist)", background: "var(--surface-page)" }}>
          <button
            type="button"
            onClick={() => onGoBack(firstWarningField)}
            className={CLS_BTN_OUTLINE}
          >
            <ArrowLeft className="w-4 h-4" />
            {lang === "FR" ? "Corriger" : "Corrigir"}
          </button>
          <button
            type="button"
            onClick={onAcknowledge}
            className={CLS_BTN_PRIMARY}
          >
            <CheckCircle className="w-4 h-4" />
            {lang === "FR" ? "Continuer malgré tout" : "Continuar mesmo assim"}
          </button>
        </div>
      </div>
    </div>
  );
}
