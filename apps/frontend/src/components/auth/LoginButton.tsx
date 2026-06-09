"use client";

import { useLogin } from "@privy-io/react-auth";
import { useEasyLawAuth } from "@/lib/privy";
import { Button } from "@/components/ui";

interface LoginButtonProps {
  /** Label shown on the button */
  label?: string;
  /** Called after successful login */
  onSuccess?: () => void;
}

/**
 * LoginButton — triggers the Privy login modal.
 *
 * Supports: email OTP, SMS OTP, passkey, Google, LinkedIn.
 * Configured via privyConfig in src/lib/privy/config.ts.
 *
 * Usage:
 *   <LoginButton onSuccess={() => router.push("/dashboard")} />
 */
export function LoginButton({ label = "Se connecter", onSuccess }: LoginButtonProps) {
  const { authenticated, logout } = useEasyLawAuth();

  const { login } = useLogin({
    onComplete: () => {
      onSuccess?.();
    },
  });

  if (authenticated) {
    return (
      <Button variant="outline" size="md" onClick={logout}>
        Se déconnecter
      </Button>
    );
  }

  return (
    <Button variant="primary" size="md" onClick={login}>
      {label}
    </Button>
  );
}
