"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import { getApiUrl } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EasyLawProfile {
  id: string;
  email: string;
  name: string | null;
  role: string;
  lang: string;
  is_verified: number;
  created_at: string;
}

type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface EasyLawUserContextValue {
  /** Profil utilisateur EasyLaw (rôle, id local, etc.) — null si non synchronisé */
  profile: EasyLawProfile | null;
  /** État de la synchronisation Privy → EasyLaw */
  syncStatus: SyncStatus;
  /** Erreur éventuelle lors de la synchronisation */
  syncError: string | null;
  /** Forcer une re-synchronisation (utile après changement de rôle côté admin) */
  refresh: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export const EasyLawUserContext = createContext<EasyLawUserContextValue | undefined>(
  undefined
);

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * EasyLawUserProvider — synchronise automatiquement l'utilisateur Privy avec
 * le backend EasyLaw.
 *
 * Flux :
 *  1. Privy → authenticated = true
 *  2. getAccessToken() → token Privy
 *  3. GET /api/auth/profile (Bearer <privy_token>)
 *     → Backend : verifyPrivyToken → resolvePrivyUser
 *       → Crée ou lie l'utilisateur en DB (privy_did)
 *       → Retourne le profil EasyLaw
 *  4. Profil stocké dans le contexte → disponible dans toute l'app
 *
 * À placer **à l'intérieur** de <PrivyProvider>.
 */
export function EasyLawUserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { ready, authenticated, getAccessToken } = usePrivy();

  const [profile, setProfile] = useState<EasyLawProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [syncError, setSyncError] = useState<string | null>(null);

  // Évite les appels en double (StrictMode, double-render)
  const syncingRef = useRef(false);
  // Garde trace du DID courant pour éviter de re-syncer inutilement
  const lastSyncedTokenRef = useRef<string | null>(null);

  const syncWithBackend = useCallback(async () => {
    if (!authenticated) {
      setProfile(null);
      setSyncStatus("idle");
      setSyncError(null);
      lastSyncedTokenRef.current = null;
      return;
    }

    if (syncingRef.current) return;

    let token: string | null = null;
    try {
      token = await getAccessToken();
    } catch {
      return;
    }

    if (!token) return;

    // Éviter de re-syncer si le token n'a pas changé et qu'on a déjà un profil
    if (token === lastSyncedTokenRef.current && profile !== null) return;

    syncingRef.current = true;
    setSyncStatus("syncing");
    setSyncError(null);

    try {
      const res = await fetch(getApiUrl("/api/auth/profile"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.success || !data.user) {
        throw new Error("Réponse invalide du serveur.");
      }

      setProfile(data.user as EasyLawProfile);
      setSyncStatus("synced");
      lastSyncedTokenRef.current = token;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de synchronisation.";
      setSyncError(msg);
      setSyncStatus("error");
      console.error("[EasyLawUserContext] Sync failed:", msg);
    } finally {
      syncingRef.current = false;
    }
  }, [authenticated, getAccessToken, profile]);

  // Synchronisation automatique quand Privy est prêt et authentifié
  useEffect(() => {
    if (!ready) return;
    syncWithBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated]);

  // Déconnexion : vider le profil
  useEffect(() => {
    if (ready && !authenticated) {
      setProfile(null);
      setSyncStatus("idle");
      setSyncError(null);
      lastSyncedTokenRef.current = null;
    }
  }, [ready, authenticated]);

  return (
    <EasyLawUserContext.Provider
      value={{
        profile,
        syncStatus,
        syncError,
        refresh: syncWithBackend,
      }}
    >
      {children}
    </EasyLawUserContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Accède au profil utilisateur EasyLaw synchronisé depuis Privy.
 * Doit être utilisé à l'intérieur de <EasyLawUserProvider>.
 */
export function useEasyLawUser(): EasyLawUserContextValue {
  const ctx = useContext(EasyLawUserContext);
  if (!ctx) {
    throw new Error(
      "useEasyLawUser must be used within EasyLawUserProvider. " +
        "Make sure EasyLawUserProvider is inside PrivyProvider in providers.tsx."
    );
  }
  return ctx;
}

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ADMIN_ROLES = ["super_admin", "admin", "cabinet_avocat"] as const;
const PRO_ROLES = [
  "super_admin",
  "admin",
  "cabinet_avocat",
  "avocat",
  "avocat_associe",
  "juriste",
] as const;

export function isAdminRole(role: string | undefined): boolean {
  return ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}

export function isProRole(role: string | undefined): boolean {
  return PRO_ROLES.includes(role as (typeof PRO_ROLES)[number]);
}
