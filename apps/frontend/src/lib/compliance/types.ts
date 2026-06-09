/**
 * Compliance — domain types (P3 / D-008, P3.5 backend re-wiring).
 */

import type { ComplianceStatus } from "@/styles/tokens";

import type { ReactNode } from "react";

export interface ComplianceItem {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  status: "pending" | "completed";
  category: string;
  user_id: string | null;
  created_at: string;
  days_left: number;
  color: "red" | "orange" | "green";
}

/** Backend compliance row alias (P3.5). */
export type ApiObligation = ComplianceItem;

export interface AlertLog {
  id: string;
  compliance_item_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  sent_at: string;
}

export interface Obligation {
  id: string;
  /** Titre affiché — ReactNode pour permettre `<span lang="pt">` granulaire autour des termes PT */
  label: ReactNode;
  /** Description longue affichée sur la card urgente OU au hover/expand */
  description?: ReactNode;
  status: ComplianceStatus;
  /** Jours jusqu'à l'échéance. Négatif si en retard. */
  daysRemaining: number;
  /** Date d'échéance au format ISO court (YYYY-MM-DD) */
  dueDate: string;
  /** Tag urgent visuel (renders ObligationCard au lieu de row) */
  isUrgent?: boolean;
  /** Catégorie backend (Fiscal, Juridique, …) */
  category?: string;
  /** Statut workflow backend */
  backendStatus?: "pending" | "completed";
}

export type ObligationFilter = "all" | "upcoming" | "current";

export function filterObligations(
  list: Obligation[],
  filter: ObligationFilter,
): Obligation[] {
  if (filter === "all") return list;
  if (filter === "upcoming") return list.filter((o) => o.status === "amber");
  return list.filter((o) => o.status === "green");
}

export function countByStatus(list: Obligation[]): Record<ComplianceStatus, number> {
  return {
    green: list.filter((o) => o.status === "green").length,
    amber: list.filter((o) => o.status === "amber").length,
    red: list.filter((o) => o.status === "red").length,
  };
}

/** Formate "27 jours" / "67 jours" / "en retard" pour les badges de liste. */
export function formatDaysBadge(daysRemaining: number, lang: "fr" = "fr"): string {
  if (daysRemaining < 0) return lang === "fr" ? "en retard" : "em atraso";
  if (daysRemaining === 0) return lang === "fr" ? "aujourd'hui" : "hoje";
  return `${daysRemaining} ${lang === "fr" ? "jours" : "dias"}`;
}
