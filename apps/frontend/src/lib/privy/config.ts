import type { PrivyClientConfig } from "@privy-io/react-auth";

/**
 * EasyLaw — Privy.io Configuration
 *
 * Covers 4 integration axes:
 *  1. Authentication  — email OTP, SMS, passkeys, social (Google, LinkedIn)
 *  2. Embedded Wallets — on-chain document signing (complement CMD eIDAS)
 *  3. Crypto Payments  — future: stablecoin / USDC payments
 *  4. DID Identity     — decentralized identity for expatriates / Golden Visa
 */
export const PRIVY_APP_ID =
  process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "your-privy-app-id";

export const PRIVY_CLIENT_ID =
  process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID ?? "";

export const privyConfig: PrivyClientConfig = {
  /* ── 1. Login methods ─────────────────────────────────────────────────── */
  loginMethods: [
    "email",        // OTP email — primary for EasyLaw users
    "sms",          // OTP SMS  — preferred in Portugal (MB Way culture)
    "passkey",      // WebAuthn biometric — lawyers / power users
    "google",       // Social — quick onboarding
    "linkedin",     // Social — professionals / cabinet users
  ],

  /* ── Appearance ──────────────────────────────────────────────────────── */
  appearance: {
    theme: "light",
    accentColor: "#1a3a5c",   // Judiciary Blue
    logo: "/logo-easylaw.svg",
    landingHeader: "Bienvenue sur EasyLaw",
    loginMessage: "Connectez-vous pour accéder à votre espace juridique",
    walletChainType: "ethereum-only",
  },

  /* ── 2. Embedded wallets (on-chain document signing) ─────────────────── */
  embeddedWallets: {
    ethereum: {
      createOnLogin: "users-without-wallets",  // Auto-create for new users
    },
    showWalletUIs: false,                      // EasyLaw controls the UI
  },

  /* ── Legal / compliance ──────────────────────────────────────────────── */
  legal: {
    termsAndConditionsUrl: "https://easylaw.pt/cgu",
    privacyPolicyUrl: "https://easylaw.pt/privacy",
  },

  /* ── MFA (lawyers + cabinet admins) ─────────────────────────────────── */
  mfa: {
    noPromptOnMfaRequired: false,  // Prompt users to set up MFA
  },
};
