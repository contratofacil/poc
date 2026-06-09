"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { ComplianceBadge } from "@/components/ui/badge";
import type { Obligation } from "@/lib/compliance/types";
import { formatDaysBadge } from "@/lib/compliance/types";

const STATUS_DOT = {
  green: "var(--status-green)",
  amber: "var(--status-amber)",
  red: "var(--status-red)",
} as const;

interface ObligationListItemProps {
  obligation: Obligation;
  onClick?: () => void;
}

/**
 * <ObligationListItem /> — row du list view (P3).
 * Status dot + label + meta + ComplianceBadge "X jours" + chevron.
 *
 * Réutilise <ComplianceBadge> de `components/ui/badge.tsx` (P1) pour le badge tri-color.
 */
export function ObligationListItem({ obligation: o, onClick }: ObligationListItemProps) {
  const badgeLabel =
    o.status === "green" ? "à jour" : formatDaysBadge(o.daysRemaining);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-disabled={!onClick}
      className="w-full flex items-center gap-4 p-5 text-left hover:bg-[var(--surface-page)] cursor-pointer focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] transition-colors aria-disabled:cursor-default"
    >
      <span
        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
        style={{ background: STATUS_DOT[o.status] }}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{o.label}</p>
        {o.description && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{o.description}</p>
        )}
      </div>
      <ComplianceBadge status={o.status} label={badgeLabel} className="whitespace-nowrap" />
      <ChevronRight
        className="h-4 w-4 flex-shrink-0"
        style={{ color: "var(--text-muted)" }}
        aria-hidden="true"
      />
    </button>
  );
}
