"use client";

import {
  usePrivy,
  useWallets,
  useLoginWithEmail,
  useLoginWithSms,
  useLoginWithOAuth,
  useLoginWithPasskey,
  useCreateWallet,
} from "@privy-io/react-auth";
import { useState, useEffect } from "react";

// ─── Test-mode types ──────────────────────────────────────────────────────────

interface TestUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  lang: string;
  is_verified: number;
  created_at: string;
  token: string;
}

declare global {
  interface Window {
    __TEST_MODE__?: boolean;
    __TEST_USER__?: TestUser;
  }
}

// ─── 1. Auth state ────────────────────────────────────────────────────────────

/**
 * Returns the current auth state.
 * In test environments (window.__TEST_MODE__ === true) reads from
 * window.__TEST_USER__ instead of Privy so Playwright tests can run
 * without a real Privy App ID.
 */
export function useEasyLawAuth() {
  const privyHook = usePrivy();

  // Test-mode state (only active when window.__TEST_MODE__ is set)
  const [testUser, setTestUser] = useState<TestUser | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.__TEST_MODE__ && window.__TEST_USER__) {
      setTestUser(window.__TEST_USER__);
    }
  }, []);

  // ── Test mode override ───────────────────────────────────────────────────────
  if (testUser) {
    const RESEARCH_ROLES = ["super_admin", "admin", "cabinet_avocat", "avocat", "avocat_associe", "juriste"];
    return {
      ready: true,
      authenticated: true,
      user: { id: testUser.id, email: { address: testUser.email } } as any,
      userId: testUser.id,
      email: testUser.email,
      phone: undefined,
      logout: async () => {
        if (typeof window !== "undefined") {
          window.__TEST_MODE__ = false;
          window.__TEST_USER__ = undefined;
        }
      },
      getAccessToken: async () => testUser.token,
      isPro: RESEARCH_ROLES.includes(testUser.role),
    };
  }

  // ── Real Privy hook ──────────────────────────────────────────────────────────
  const { ready, authenticated, user, logout, getAccessToken } = privyHook;

  return {
    ready,
    authenticated,
    user,
    userId: user?.id,
    email: user?.email?.address,
    phone: user?.phone?.number,
    logout,
    getAccessToken,
    /** True if user has a lawyer/cabinet role stored in Privy custom metadata */
    isPro: (user?.customMetadata as Record<string, unknown>)?.role === "pro",
  };
}

/* ─── 2. Login methods ────────────────────────────────────────────────────── */

/** Email OTP — primary auth for EasyLaw */
export function useEmailAuth() {
  return useLoginWithEmail();
}

/** SMS OTP — secondary auth, popular in Portugal */
export function useSmsAuth() {
  return useLoginWithSms();
}

/** Social login — Google or LinkedIn */
export function useSocialAuth() {
  return useLoginWithOAuth();
}

/** Passkey (WebAuthn) — biometric, for power users / lawyers */
export function usePasskeyAuth() {
  return useLoginWithPasskey();
}

/* ─── 3. Embedded wallet (on-chain document signing) ─────────────────────── */

export function useDocumentWallet() {
  const { wallets, ready } = useWallets();
  const { createWallet } = useCreateWallet();

  const embeddedWallet = wallets.find(
    (w) => w.walletClientType === "privy"
  );

  async function signDocument(documentHash: string): Promise<string> {
    if (!embeddedWallet) {
      throw new Error("No embedded wallet found. Please create one first.");
    }
    const provider = await embeddedWallet.getEthereumProvider();
    const signature = await provider.request({
      method: "personal_sign",
      params: [documentHash, embeddedWallet.address],
    });
    return signature as string;
  }

  async function ensureWallet() {
    if (!embeddedWallet) {
      return createWallet();
    }
    return embeddedWallet;
  }

  return {
    ready,
    wallet: embeddedWallet,
    address: embeddedWallet?.address,
    hasWallet: !!embeddedWallet,
    signDocument,
    ensureWallet,
  };
}

/* ─── 4. DID Identity helpers ────────────────────────────────────────────── */

export function useUserIdentity() {
  const { user, ready } = usePrivy();

  if (!ready || !user) {
    return { ready, did: null, linkedAccounts: [], verifiedEmail: false, verifiedPhone: false };
  }

  return {
    ready,
    did: user.id,
    linkedAccounts: user.linkedAccounts ?? [],
    verifiedEmail: !!user.email?.address,
    verifiedPhone: !!user.phone?.number,
    walletAddresses: (user.linkedAccounts ?? [])
      .filter((a) => a.type === "wallet" || a.type === "smart_wallet")
      .map((a) => (a as { address: string }).address),
  };
}
