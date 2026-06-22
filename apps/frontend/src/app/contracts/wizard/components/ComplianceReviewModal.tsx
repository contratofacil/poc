"use client";

import React, { useState } from "react";
import { AlertCircle, Info, X, CheckCircle, ArrowLeft, Wand2 } from "lucide-react";

export interface ComplianceFinding {
  field?: string;
  severity: "warning" | "info";
  message: string;
  suggested_fix?: string;
  fix_label?: string;
}

interface Props {
  findings: ComplianceFinding[];
  lang: "FR" | "PT";
  onAcknowledge: () => void;
  onGoBack: (fieldKey?: string) => void;
  onApplyFix: (fieldKey: string, value: string) => void;
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

export function ComplianceReviewModal({ findings, lang, onAcknowledge, onGoBack, onApplyFix }: Props) {
  const [applied, setApplied] = useState<Set<number>>(new Set());

  const warnings = findings.filter((f) => f.severity === "warning");
  const infos = findings.filter((f) => f.severity === "info");
  const firstWarningField = warnings[0]?.field;

  const handleApply = (idx: number, fieldKey: string, value: string) => {
    onApplyFix(fieldKey, value);
    setApplied((prev) => new Set(prev).add(idx));
  };

  const renderFinding = (f: ComplianceFinding, globalIdx: number, isWarning: boolean) => {
    const canApply = !!(f.field && f.suggested_fix);
    const isApplied = applied.has(globalIdx);

    return (
      <div
        key={globalIdx}
        className="flex flex-col gap-2 p-3 rounded-lg"
        style={
          isWarning
            ? { background: "var(--status-amber-bg)", border: "1px solid var(--status-amber-border)" }
            : { background: "var(--status-blue-bg, #eff6ff)", border: "1px solid var(--status-blue-border, #bfdbfe)" }
        }
      >
        <div className="flex items-start gap-3">
          {isWarning
            ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--status-amber)" }} />
            : <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />}
          <p
            className="text-sm leading-relaxed flex-1"
            style={{ color: isWarning ? "var(--status-amber)" : undefined }}
          >
            {f.message}
          </p>
        </div>

        {canApply && (
          <div className="flex items-center gap-2 pl-7">
            {isApplied ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md"
                style={{ background: "var(--status-green-bg, #f0fdf4)", color: "var(--status-green, #16a34a)", border: "1px solid var(--status-green-border, #bbf7d0)" }}>
                <CheckCircle className="w-3 h-3" />
                {lang === "FR" ? "Appliqué" : "Aplicado"}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleApply(globalIdx, f.field!, f.suggested_fix!)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition"
                style={{
                  background: isWarning ? "var(--status-amber)" : "#3b82f6",
                  color: "#fff",
                }}
              >
                <Wand2 className="w-3 h-3" />
                {f.fix_label || (lang === "FR" ? "Appliquer" : "Aplicar")}
              </button>
            )}
            <span className="text-xs text-text-muted truncate max-w-[200px]">{f.suggested_fix}</span>
          </div>
        )}
      </div>
    );
  };

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
        <div className="px-6 py-5 space-y-3 max-h-[28rem] overflow-y-auto">
          <p className="text-sm text-text-secondary mb-4">
            {lang === "FR"
              ? "Notre analyse juridique a relevé les points suivants avant finalisation :"
              : "A nossa análise jurídica identificou os seguintes pontos antes da finalização :"}
          </p>

          {warnings.map((f, i) => {
            const globalIdx = findings.indexOf(f);
            return renderFinding(f, globalIdx, true);
          })}

          {infos.map((f, i) => {
            const globalIdx = findings.indexOf(f);
            return renderFinding(f, globalIdx, false);
          })}
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
