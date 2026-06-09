import { getApiUrl, apiFetch } from "@/lib/api";
import type { AlertLog, ComplianceItem, Obligation } from "./types";
import type { ComplianceStatus } from "@/styles/tokens";

export type { AlertLog, ApiObligation, ComplianceItem } from "./types";

export interface AddObligationPayload {
  title: string;
  description?: string;
  due_date: string;
  category: string;
  user_id?: string | null;
}

function mapColorToStatus(color: ComplianceItem["color"]): ComplianceStatus {
  if (color === "orange") return "amber";
  return color;
}

export function mapItem(item: ComplianceItem): Obligation {
  const status = mapColorToStatus(item.color);
  return {
    id: item.id,
    label: item.title,
    description: item.description ?? undefined,
    status,
    daysRemaining: item.days_left,
    dueDate: item.due_date,
    isUrgent: item.color === "red" && item.days_left <= 30,
    category: item.category,
    backendStatus: item.status,
  };
}

function sortByDueDate(items: Obligation[]): Obligation[] {
  return [...items].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
}

export async function fetchComplianceItems(userId?: string | null): Promise<Obligation[]> {
  const path =
    userId != null && userId.length > 0
      ? `/api/compliance?user_id=${encodeURIComponent(userId)}`
      : "/api/compliance";

  const res = await fetch(getApiUrl(path));
  const data = (await res.json()) as { success: boolean; items?: ComplianceItem[]; message?: string };

  if (!res.ok || !data.success || !data.items) {
    throw new Error(data.message ?? "Impossible de charger les obligations.");
  }

  return sortByDueDate(data.items.map(mapItem));
}

export async function fetchAlertLogs(): Promise<AlertLog[]> {
  const res = await fetch(getApiUrl("/api/compliance/alert-logs"));
  const data = (await res.json()) as { success: boolean; logs?: AlertLog[]; message?: string };

  if (!res.ok || !data.success || !data.logs) {
    throw new Error(data.message ?? "Impossible de charger le journal des alertes.");
  }

  return data.logs;
}

export async function createComplianceItem(payload: AddObligationPayload): Promise<Obligation> {
  const res = await apiFetch("/api/compliance", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { success: boolean; item?: ComplianceItem; message?: string };

  if (!res.ok || !data.success || !data.item) {
    throw new Error(data.message ?? "Impossible d'ajouter l'obligation.");
  }

  return mapItem(data.item);
}

export async function updateComplianceStatus(
  id: string,
  status: "pending" | "completed",
): Promise<Obligation> {
  const res = await apiFetch(`/api/compliance/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
  const data = (await res.json()) as { success: boolean; item?: ComplianceItem; message?: string };

  if (!res.ok || !data.success || !data.item) {
    throw new Error(data.message ?? "Impossible de mettre à jour le statut.");
  }

  return mapItem(data.item);
}

export async function deleteComplianceItem(id: string): Promise<void> {
  const res = await apiFetch(`/api/compliance/${id}`, { method: "DELETE" });
  const data = (await res.json()) as { success: boolean; message?: string };

  if (!res.ok || !data.success) {
    throw new Error(data.message ?? "Impossible de supprimer l'obligation.");
  }
}

export async function simulateComplianceAlerts(): Promise<{ logsGenerated: number; logs: AlertLog[] }> {
  const res = await fetch(getApiUrl("/api/compliance/simulate-alerts"), { method: "POST" });
  const data = (await res.json()) as {
    success: boolean;
    logsGenerated?: number;
    logs?: AlertLog[];
    message?: string;
  };

  if (!res.ok || !data.success) {
    throw new Error(data.message ?? "La simulation des alertes a échoué.");
  }

  return {
    logsGenerated: data.logsGenerated ?? 0,
    logs: data.logs ?? [],
  };
}

export async function fetchBackendUserId(): Promise<string | null> {
  const res = await apiFetch("/api/auth/profile");
  const data = (await res.json()) as { success: boolean; user?: { id: string } };

  if (res.ok && data.success && data.user?.id) {
    return data.user.id;
  }

  return null;
}
