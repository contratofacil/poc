"use client";

import * as React from "react";
import { AlertTriangle, ChevronRight, Trash2 } from "lucide-react";
import type { Obligation } from "@/lib/compliance/types";

interface ObligationCardProps {
  obligation: Obligation;
  onPrepare?: () => void;
  onMarkPrepared?: () => void;
  onViewDetail?: () => void;
  onDelete?: () => void;
}

/**
 * <ObligationCard /> — Card "Action urgente" red-bordered (P3 / Flow 2 Miguel).
 * Aria : `role="region"` + `aria-labelledby` pour annoncer le titre aux AT.
 */
export function ObligationCard({
  obligation: o,
  onPrepare,
  onMarkPrepared,
  onViewDetail,
  onDelete,
}: ObligationCardProps) {
  const titleId = React.useId();
  const [day, monthRaw] = o.dueDate.split("-").slice(1).reverse();
  const month = monthRaw;
  const year = o.dueDate.slice(0, 4);

  return (
    <article
      role="region"
      aria-labelledby={titleId}
      className="rounded-xl border-2 bg-white p-6 shadow-[var(--shadow-card)]"
      style={{ borderColor: "var(--status-red-border)" }}
    >
      <div className="flex items-start gap-5">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--status-red-bg)" }}
          aria-hidden="true"
        >
          <AlertTriangle className="h-[22px] w-[22px]" style={{ color: "var(--status-red)" }} strokeWidth={2.5} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider"
              style={{
                background: "var(--status-red-bg)",
                color: "var(--status-red)",
                border: "1px solid var(--status-red-border)",
              }}
            >
              Urgent
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              échéance dans {o.daysRemaining} jours
            </span>
          </div>

          <h3
            id={titleId}
            className="text-xl mb-1"
            style={{
              fontFamily: "var(--font-serif)",
              color: "var(--brand-primary)",
            }}
          >
            {o.label}
          </h3>

          {o.description && (
            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
              {o.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onPrepare}
              aria-disabled={!onPrepare}
              className="rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] aria-disabled:opacity-60"
              style={{ background: "var(--brand-primary)", color: "var(--surface-page)" }}
            >
              Préparer ma déclaration
            </button>
            <button
              type="button"
              onClick={onMarkPrepared}
              aria-disabled={!onMarkPrepared}
              className="rounded-md border bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-page)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] aria-disabled:opacity-60"
              style={{
                borderColor: "var(--surface-mist-strong)",
                color: "var(--text-secondary)",
              }}
            >
              Marquer comme préparé
            </button>
            <button
              type="button"
              onClick={onViewDetail}
              aria-disabled={!onViewDetail}
              className="inline-flex items-center gap-1 rounded-md bg-transparent px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-page)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] aria-disabled:opacity-60"
              style={{ color: "var(--brand-primary)" }}
            >
              Voir le détail
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 rounded-md border bg-transparent px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--status-red-bg)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
                style={{
                  borderColor: "var(--status-red-border)",
                  color: "var(--status-red)",
                }}
                aria-label="Supprimer cette obligation"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Supprimer
              </button>
            )}
          </div>
        </div>

        <div className="hidden md:block text-right text-xs text-[var(--text-muted)]">
          <span className="block text-sm" style={{ color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
            {day} / {month}
          </span>
          <span>{year}</span>
        </div>
      </div>
    </article>
  );
}
