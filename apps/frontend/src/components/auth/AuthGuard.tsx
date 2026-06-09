"use client";

import { useEasyLawAuth } from "@/lib/privy";
import { LoginButton } from "./LoginButton";

interface AuthGuardProps {
  children: React.ReactNode;
  /** If true, also requires Pro (lawyer/cabinet) role */
  requirePro?: boolean;
  /** Custom fallback when not authenticated */
  fallback?: React.ReactNode;
}

/**
 * AuthGuard — wraps protected content.
 *
 * Shows a login prompt until the user is authenticated.
 * Optionally checks for Pro role (Module B — cabinet).
 *
 * Usage:
 *   <AuthGuard requirePro>
 *     <AIResearchPage />
 *   </AuthGuard>
 */
export function AuthGuard({ children, requirePro = false, fallback }: AuthGuardProps) {
  const { ready, authenticated, isPro } = useEasyLawAuth();

  // Loading state — Privy initializing
  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-pulse w-8 h-8 rounded-full bg-[#1a3a5c]/20" />
      </div>
    );
  }

  // Not authenticated
  if (!authenticated) {
    return fallback ?? (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="font-serif text-xl text-[#1a3a5c]">
          Accès réservé aux membres EasyLaw
        </p>
        <p className="text-sm text-[#4a5568]">
          Connectez-vous pour accéder à cette fonctionnalité.
        </p>
        <LoginButton />
      </div>
    );
  }

  // Pro access required but user is not Pro
  if (requirePro && !isPro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <p className="font-serif text-xl text-[#1a3a5c]">
          Accès Module Pro
        </p>
        <p className="text-sm text-[#4a5568]">
          Cette fonctionnalité est réservée aux avocats et cabinets partenaires.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
