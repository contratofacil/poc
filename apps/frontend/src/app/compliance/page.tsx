"use client";

import * as React from "react";
import { Plus, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/site/AppShell";
import { ComplianceStatusBar } from "@/components/compliance/ComplianceStatusBar";
import { ObligationCard } from "@/components/compliance/ObligationCard";
import { ObligationListItem } from "@/components/compliance/ObligationListItem";
import {
  countByStatus,
  filterObligations,
  type ObligationFilter,
} from "@/lib/compliance/types";
import { MOCK_OBLIGATIONS } from "@/lib/compliance/mockData";

/**
 * `/compliance` Dashboard (P3 / D-008, Flow 2 Miguel).
 *
 * Visual upgrade from mock 03-compliance-dashboard.html. Mock data hardcodée —
 * re-wiring `/api/compliance` endpoint déféré à P3.5 (cf. deferred-work).
 */
export default function ComplianceDashboard() {
  const [filter, setFilter] = React.useState<ObligationFilter>("all");

  const all = MOCK_OBLIGATIONS;
  const counts = countByStatus(all);
  const urgent = all.find((o) => o.isUrgent);
  const filtered = filterObligations(all, filter).filter((o) => !o.isUrgent);

  const VISIBLE_LIMIT = 5;
  const visibleRows = filtered.slice(0, VISIBLE_LIMIT);
  const remaining = filtered.length - visibleRows.length;

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
          · {all.length} obligations suivies
        </p>

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
            <span className="text-xs text-[var(--text-muted)]">
              Données simulées · mock data MVP
            </span>
          </div>
          <ComplianceStatusBar counts={counts} />
        </section>

        {/* ─── Action urgente ─── */}
        {urgent && (
          <section aria-labelledby="urgent-heading" className="mb-8">
            <h2
              id="urgent-heading"
              className="text-lg font-semibold mb-3"
              style={{ color: "var(--text-primary)" }}
            >
              Action urgente
            </h2>
            <ObligationCard obligation={urgent} />
          </section>
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
          </div>

          <div
            className="rounded-xl border bg-white shadow-[var(--shadow-card)] divide-y"
            style={{ borderColor: "var(--surface-mist)" }}
          >
            {visibleRows.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--text-muted)]">
                Aucune obligation dans cette catégorie.
              </div>
            ) : (
              visibleRows.map((o) => (
                <ObligationListItem key={o.id} obligation={o} />
              ))
            )}
          </div>

          {remaining > 0 && (
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
      </div>
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
