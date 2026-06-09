"use client";

import * as React from "react";
import { Plus, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { ComplianceStatusBar } from "@/components/compliance/ComplianceStatusBar";
import { ObligationCard } from "@/components/compliance/ObligationCard";
import { ObligationListItem } from "@/components/compliance/ObligationListItem";
import { AddObligationModal } from "@/components/compliance/AddObligationModal";
import { ObligationDetailModal } from "@/components/compliance/ObligationDetailModal";
import { EmailAlertsLog } from "@/components/compliance/EmailAlertsLog";
import { EidvProviderSelector } from "@/components/compliance/EidvProviderSelector";
import {
  countByStatus,
  filterObligations,
  type Obligation,
  type ObligationFilter,
} from "@/lib/compliance/types";
import { useCompliance } from "@/lib/compliance/useCompliance";

/**
 * `/compliance` Dashboard (P3 / D-008, P3.5 backend re-wiring).
 */
export default function ComplianceDashboard() {
  const [filter, setFilter] = React.useState<ObligationFilter>("all");
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [detailObligation, setDetailObligation] = React.useState<Obligation | null>(null);

  const {
    obligations,
    alertLogs,
    isLoading,
    error,
    add,
    togglePrepared,
    remove,
    simulateAlerts,
  } = useCompliance();

  const all = obligations;
  const counts = countByStatus(all);
  const urgent = all.find((o) => o.isUrgent);
  const filtered = filterObligations(all, filter).filter((o) => !o.isUrgent);

  const VISIBLE_LIMIT = 5;
  const visibleRows = filtered.slice(0, VISIBLE_LIMIT);
  const remaining = filtered.length - visibleRows.length;

  const openDetail = (o: Obligation) => setDetailObligation(o);

  const handleDelete = async (o: Obligation) => {
    if (!window.confirm("Supprimer cette obligation ?")) return;
    try {
      await remove(o.id);
      if (detailObligation?.id === o.id) {
        setDetailObligation(null);
      }
    } catch {
      window.alert("Impossible de supprimer l'obligation.");
    }
  };

  return (
    <AppShell
      activeSection="compliance"
      breadcrumb={[{ label: "Dashboard", href: "/dashboard" }, { label: "Compliance" }]}
      hasNotifications
    >
      <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-[1200px]">
        {/* ─── Hero ─── */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-2">
          <div>
            <p className="text-xs uppercase tracking-wider mb-1 text-[var(--text-muted)]">
              Bonjour Miguel
            </p>
            <h1
              className="text-3xl md:text-4xl"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--brand-primary)",
              }}
            >
              Vue d&apos;ensemble compliance
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="hidden md:inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
            style={{ background: "var(--brand-primary)", color: "var(--surface-page)" }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Ajouter une obligation
          </button>
        </header>
        <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
          <span lang="pt">Import Lda</span> · NIF entreprise{" "}
          <span style={{ fontFamily: "var(--font-mono)" }}>PT123456789</span>{" "}
          · {isLoading ? "…" : all.length} obligations suivies
        </p>

        {error && (
          <div
            className="mb-6 rounded-lg border px-4 py-3 text-sm"
            style={{
              background: "var(--status-red-bg)",
              borderColor: "var(--status-red-border)",
              color: "var(--status-red)",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {/* ─── État global ─── */}
        <section
          aria-labelledby="status-heading"
          className="rounded-xl border bg-white shadow-[var(--shadow-card)] p-6 mb-8"
          style={{ borderColor: "var(--surface-mist)" }}
        >
          <div className="flex items-baseline justify-between mb-4">
            <h2
              id="status-heading"
              className="text-xl"
              style={{
                fontFamily: "var(--font-serif)",
                color: "var(--brand-primary)",
              }}
            >
              État global
            </h2>
          </div>
          {isLoading ? <StatusBarSkeleton /> : <ComplianceStatusBar counts={counts} />}
        </section>

        {/* ─── Action urgente ─── */}
        {isLoading ? (
          <section className="mb-8" aria-hidden="true">
            <div className="h-5 w-32 rounded animate-pulse mb-3" style={{ background: "var(--surface-mist)" }} />
            <CardSkeleton />
          </section>
        ) : (
          urgent && (
            <section aria-labelledby="urgent-heading" className="mb-8">
              <h2
                id="urgent-heading"
                className="text-lg font-semibold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Action urgente
              </h2>
              <ObligationCard
                obligation={urgent}
                onPrepare={() => openDetail(urgent)}
                onMarkPrepared={() => togglePrepared(urgent.id, urgent.backendStatus ?? "pending")}
                onViewDetail={() => openDetail(urgent)}
                onDelete={() => handleDelete(urgent)}
              />
            </section>
          )
        )}

        {/* ─── List view ─── */}
        <section aria-labelledby="list-heading">
          <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
            <h2
              id="list-heading"
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Toutes les obligations
            </h2>
            {!isLoading && (
              <div className="flex items-center gap-2" role="tablist" aria-label="Filtres obligations">
                <FilterTab
                  label={`Tous (${all.filter((o) => !o.isUrgent).length})`}
                  active={filter === "all"}
                  onClick={() => setFilter("all")}
                />
                <FilterTab
                  label={`À venir (${counts.amber + counts.red - (urgent ? 1 : 0)})`}
                  active={filter === "upcoming"}
                  onClick={() => setFilter("upcoming")}
                />
                <FilterTab
                  label={`À jour (${counts.green})`}
                  active={filter === "current"}
                  onClick={() => setFilter("current")}
                />
              </div>
            )}
          </div>

          <div
            className="rounded-xl border bg-white shadow-[var(--shadow-card)] divide-y"
            style={{ borderColor: "var(--surface-mist)" }}
          >
            {isLoading ? (
              <ListSkeleton />
            ) : visibleRows.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--text-muted)]">
                Aucune obligation dans cette catégorie.
              </div>
            ) : (
              visibleRows.map((o) => (
                <ObligationListItem key={o.id} obligation={o} onClick={() => openDetail(o)} />
              ))
            )}
          </div>

          {!isLoading && remaining > 0 && (
            <button
              type="button"
              aria-disabled
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium rounded-md px-3 py-1.5 focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] transition-colors aria-disabled:opacity-70"
              style={{ color: "var(--brand-primary)" }}
            >
              Voir les {remaining} autres obligations
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </section>

        {!isLoading && (
          <>
            <EmailAlertsLog logs={alertLogs} onSimulate={simulateAlerts} />
            <EidvProviderSelector />
          </>
        )}
      </div>

      <AddObligationModal
        open={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={add}
      />

      <ObligationDetailModal
        obligation={detailObligation}
        open={detailObligation !== null}
        onClose={() => setDetailObligation(null)}
        onTogglePrepared={togglePrepared}
      />
    </AppShell>
  );
}

function FilterTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={[
        "text-xs rounded-md px-2.5 py-1.5 transition-colors",
        "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
      ].join(" ")}
      style={
        active
          ? {
              background: "var(--brand-primary)",
              color: "var(--surface-page)",
              fontWeight: 500,
            }
          : {
              border: "1px solid var(--surface-mist-strong)",
              color: "var(--text-secondary)",
            }
      }
    >
      {label}
    </button>
  );
}

function StatusBarSkeleton() {
  return (
    <div className="flex gap-3" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex-1 h-16 rounded-lg animate-pulse"
          style={{ background: "var(--surface-mist)" }}
        />
      ))}
    </div>
  );
}

function CardSkeleton() {
  return (
    <div
      className="rounded-xl border-2 p-6 animate-pulse"
      style={{ borderColor: "var(--surface-mist)", background: "white" }}
    >
      <div className="h-5 w-2/3 rounded mb-3" style={{ background: "var(--surface-mist)" }} />
      <div className="h-4 w-full rounded mb-2" style={{ background: "var(--surface-mist)" }} />
      <div className="h-4 w-4/5 rounded" style={{ background: "var(--surface-mist)" }} />
    </div>
  );
}

function ListSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 p-5 animate-pulse" aria-hidden="true">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--surface-mist)" }} />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/2 rounded" style={{ background: "var(--surface-mist)" }} />
            <div className="h-3 w-1/3 rounded" style={{ background: "var(--surface-mist)" }} />
          </div>
          <div className="h-6 w-16 rounded-full" style={{ background: "var(--surface-mist)" }} />
        </div>
      ))}
    </>
  );
}
