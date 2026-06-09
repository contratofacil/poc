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

/* ─── 1. Auth state ───────────────────────────────────────────────────────── */

/**
 * Returns the current auth state.
 * Always check `ready` before using `authenticated` or `user`.
 */
export function useEasyLawAuth() {
  const { ready, authenticated, user, logout, getAccessToken } = usePrivy();

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

/**
 * Returns the user's embedded Ethereum wallet.
 * Used for on-chain document signing (complement to CMD eIDAS).
 *
 * Usage:
 *   const { wallet, address, signDocument } = useDocumentWallet();
 *   await signDocument("0xdocumentHash...");
 */
export function useDocumentWallet() {
  const { wallets, ready } = useWallets();
  const { createWallet } = useCreateWallet();

  const embeddedWallet = wallets.find(
    (w) => w.walletClientType === "privy"
  );

  /**
   * Sign a document hash on-chain.
   * @param documentHash - keccak256 hash of the document (hex string)
   * @returns signature hex string
   */
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

  /**
   * Ensure the user has an embedded wallet, creating one if needed.
   */
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

/**
 * Returns a decentralized identity summary for the user.
 * Used in Golden Visa / D7 / NIF modules for identity verification.
 */
export function useUserIdentity() {
  const { user, ready } = usePrivy();

  if (!ready || !user) {
    return { ready, did: null, linkedAccounts: [], verifiedEmail: false, verifiedPhone: false };
  }

  return {
    ready,
    /** Privy DID — portable decentralized identifier */
    did: user.id,
    linkedAccounts: user.linkedAccounts ?? [],
    verifiedEmail: !!user.email?.address,
    verifiedPhone: !!user.phone?.number,
    /** All verified wallet addresses */
    walletAddresses: (user.linkedAccounts ?? [])
      .filter((a) => a.type === "wallet" || a.type === "smart_wallet")
      .map((a) => (a as { address: string }).address),
  };
}
