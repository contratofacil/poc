"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { PRIVY_APP_ID, PRIVY_CLIENT_ID, privyConfig } from "@/lib/privy";

/**
 * EasyLaw App Providers
 *
 * Wraps the app with all required context providers.
 * Must be a Client Component (React context requires it).
 *
 * Providers stacked:
 *  1. PrivyProvider — auth, embedded wallets, DID identity
 *     (add more providers below as needed: React Query, Zustand, etc.)
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID}
      config={privyConfig}
    >
      {children}
    </PrivyProvider>
  );
}
