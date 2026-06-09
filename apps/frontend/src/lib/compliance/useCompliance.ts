"use client";

import * as React from "react";
import {
  createComplianceItem,
  deleteComplianceItem,
  fetchAlertLogs,
  fetchBackendUserId,
  fetchComplianceItems,
  simulateComplianceAlerts,
  updateComplianceStatus,
  type AddObligationPayload,
  type AlertLog,
} from "./api";
import type { Obligation } from "./types";

interface ComplianceState {
  obligations: Obligation[];
  alertLogs: AlertLog[];
  isLoading: boolean;
  error: string | null;
  userId: string | null;
}

type ComplianceAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; obligations: Obligation[]; alertLogs: AlertLog[]; userId: string | null }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "ADD_ITEM"; item: Obligation }
  | { type: "UPDATE_ITEM"; item: Obligation }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "RESTORE_ITEM"; item: Obligation; index: number }
  | { type: "SET_LOGS"; logs: AlertLog[] }
  | { type: "OPTIMISTIC_TOGGLE"; id: string }
  | { type: "REVERT_ITEM"; item: Obligation };

function sortByDueDate(items: Obligation[]): Obligation[] {
  return [...items].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );
}

function applyOptimisticCompleted(item: Obligation): Obligation {
  return {
    ...item,
    backendStatus: "completed",
    status: "green",
    isUrgent: false,
  };
}

function complianceReducer(state: ComplianceState, action: ComplianceAction): ComplianceState {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, isLoading: true, error: null };
    case "LOAD_SUCCESS":
      return {
        ...state,
        isLoading: false,
        error: null,
        obligations: action.obligations,
        alertLogs: action.alertLogs,
        userId: action.userId,
      };
    case "LOAD_ERROR":
      return { ...state, isLoading: false, error: action.error };
    case "ADD_ITEM":
      return { ...state, obligations: sortByDueDate([action.item, ...state.obligations]) };
    case "UPDATE_ITEM":
      return {
        ...state,
        obligations: state.obligations.map((o) => (o.id === action.item.id ? action.item : o)),
      };
    case "REMOVE_ITEM":
      return { ...state, obligations: state.obligations.filter((o) => o.id !== action.id) };
    case "RESTORE_ITEM": {
      const next = [...state.obligations];
      next.splice(action.index, 0, action.item);
      return { ...state, obligations: sortByDueDate(next) };
    }
    case "SET_LOGS":
      return { ...state, alertLogs: action.logs };
    case "OPTIMISTIC_TOGGLE":
      return {
        ...state,
        obligations: state.obligations.map((o) =>
          o.id === action.id ? applyOptimisticCompleted(o) : o,
        ),
      };
    case "REVERT_ITEM":
      return {
        ...state,
        obligations: state.obligations.map((o) => (o.id === action.item.id ? action.item : o)),
      };
    default:
      return state;
  }
}

export interface UseComplianceReturn {
  obligations: Obligation[];
  alertLogs: AlertLog[];
  isLoading: boolean;
  error: string | null;
  add: (payload: AddObligationPayload) => Promise<void>;
  togglePrepared: (id: string, currentStatus: "pending" | "completed") => Promise<void>;
  remove: (id: string) => Promise<void>;
  simulateAlerts: () => Promise<{ logsGenerated: number }>;
  refresh: () => void;
}

const initialState: ComplianceState = {
  obligations: [],
  alertLogs: [],
  isLoading: true,
  error: null,
  userId: null,
};

export function useCompliance(): UseComplianceReturn {
  const [state, dispatch] = React.useReducer(complianceReducer, initialState);
  const [refreshKey, setRefreshKey] = React.useState(0);

  const refresh = React.useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      dispatch({ type: "LOAD_START" });
      try {
        const userId = await fetchBackendUserId();
        const [obligations, alertLogs] = await Promise.all([
          fetchComplianceItems(userId),
          fetchAlertLogs(),
        ]);

        if (!cancelled) {
          dispatch({ type: "LOAD_SUCCESS", obligations, alertLogs, userId });
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : "Erreur réseau.";
          dispatch({ type: "LOAD_ERROR", error: message });
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  const add = React.useCallback(
    async (payload: AddObligationPayload) => {
      const item = await createComplianceItem({
        ...payload,
        user_id: state.userId,
      });
      dispatch({ type: "ADD_ITEM", item });
    },
    [state.userId],
  );

  const togglePrepared = React.useCallback(
    async (id: string, currentStatus: "pending" | "completed") => {
      const previous = state.obligations.find((o) => o.id === id);
      if (!previous) return;

      const nextStatus = currentStatus === "pending" ? "completed" : "pending";

      if (nextStatus === "completed") {
        dispatch({ type: "OPTIMISTIC_TOGGLE", id });
      }

      try {
        const updated = await updateComplianceStatus(id, nextStatus);
        dispatch({ type: "UPDATE_ITEM", item: updated });
      } catch (err) {
        dispatch({ type: "REVERT_ITEM", item: previous });
        throw err;
      }
    },
    [state.obligations],
  );

  const remove = React.useCallback(
    async (id: string) => {
      const index = state.obligations.findIndex((o) => o.id === id);
      const previous = state.obligations[index];
      if (!previous || index < 0) return;

      dispatch({ type: "REMOVE_ITEM", id });

      try {
        await deleteComplianceItem(id);
      } catch (err) {
        dispatch({ type: "RESTORE_ITEM", item: previous, index });
        throw err;
      }
    },
    [state.obligations],
  );

  const simulateAlerts = React.useCallback(async () => {
    const result = await simulateComplianceAlerts();
    const logs = await fetchAlertLogs();
    dispatch({ type: "SET_LOGS", logs });
    return { logsGenerated: result.logsGenerated };
  }, []);

  return {
    obligations: state.obligations,
    alertLogs: state.alertLogs,
    isLoading: state.isLoading,
    error: state.error,
    add,
    togglePrepared,
    remove,
    simulateAlerts,
    refresh,
  };
}
