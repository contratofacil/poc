"use client";

import * as React from "react";
import { X } from "lucide-react";
import { ComplianceBadge } from "@/components/ui/badge";
import type { Obligation } from "@/lib/compliance/types";
import { formatDaysBadge } from "@/lib/compliance/types";

interface ObligationDetailModalProps {
  obligation: Obligation | null;
  open: boolean;
  onClose: () => void;
  onTogglePrepared: (id: string, currentStatus: "pending" | "completed") => Promise<void>;
}

export function ObligationDetailModal({
  obligation,
  open,
  onClose,
  onTogglePrepared,
}: ObligationDetailModalProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const [isToggling, setIsToggling] = React.useState(false);
  const [toggleError, setToggleError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && obligation) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open, obligation]);

  if (!obligation) return null;

  const backendStatus = obligation.backendStatus ?? "pending";
  const badgeLabel =
    obligation.status === "green" ? "à jour" : formatDaysBadge(obligation.daysRemaining);

  const handleToggle = async () => {
    setToggleError(null);
    setIsToggling(true);
    try {
      await onTogglePrepared(obligation.id, backendStatus);
    } catch (err) {
      setToggleError(err instanceof Error ? err.message : "Erreur lors de la mise à jour.");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="w-full max-w-lg rounded-xl border p-0 shadow-[var(--shadow-card)] backdrop:bg-black/40"
      style={{
        borderColor: "var(--surface-mist)",
        background: "var(--surface-page)",
      }}
      aria-labelledby="obligation-detail-title"
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2
            id="obligation-detail-title"
            className="text-xl pr-4"
            style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}
          >
            {obligation.label}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 shrink-0 transition-colors hover:bg-[var(--surface-mist)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          {obligation.description && (
            <p style={{ color: "var(--text-secondary)" }}>{obligation.description}</p>
          )}

          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Échéance</dt>
              <dd className="font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                {obligation.dueDate}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Délai</dt>
              <dd>
                <ComplianceBadge status={obligation.status} label={badgeLabel} />
              </dd>
            </div>
            {obligation.category && (
              <div>
                <dt className="text-xs text-[var(--text-muted)]">Catégorie</dt>
                <dd className="font-medium" style={{ color: "var(--text-primary)" }}>
                  {obligation.category}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-[var(--text-muted)]">Statut</dt>
              <dd className="font-medium" style={{ color: "var(--text-primary)" }}>
                {backendStatus === "completed" ? "Préparé" : "En attente"}
              </dd>
            </div>
          </dl>
        </div>

        {toggleError && (
          <p className="mt-4 text-sm rounded-lg px-3 py-2" style={{ background: "var(--status-red-bg)", color: "var(--status-red)" }} role="alert">
            {toggleError}
          </p>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className="w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-60"
            style={{
              border: "1px solid var(--surface-mist-strong)",
              color: "var(--text-secondary)",
              background: "transparent",
            }}
          >
            {isToggling
              ? "Mise à jour…"
              : backendStatus === "completed"
                ? "Marquer comme en attente"
                : "Marquer comme préparé"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
