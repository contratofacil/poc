import * as React from "react";
import { Lock, ShieldCheck, Scale, Check } from "lucide-react";

interface TrustBarProps {
  labels: {
    tls: string;
    rgpd: string;
    ordem: string;
    verified: string;
  };
  className?: string;
}

/**
 * <TrustBar /> — 4 signaux de confiance (P2 / D-007).
 * Ordre fixe : TLS → RGPD → Ordem dos Advogados (PT) → Cabinet partenaire vérifié.
 * Pure component, server-renderable.
 */
export function TrustBar({ labels, className = "" }: TrustBarProps) {
  return (
    <ul
      className={[
        "flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--text-muted)]",
        className,
      ].join(" ")}
      aria-label="Signaux de confiance EasyLaw"
    >
      <li className="flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.tls}</span>
      </li>
      <li className="flex items-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.rgpd}</span>
      </li>
      <li className="flex items-center gap-1.5">
        <Scale className="h-3.5 w-3.5" aria-hidden="true" />
        <span lang="pt">{labels.ordem}</span>
      </li>
      <li className="flex items-center gap-1.5">
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{labels.verified}</span>
      </li>
    </ul>
  );
}
