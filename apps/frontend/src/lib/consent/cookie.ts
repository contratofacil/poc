/**
 * Cookie Consent — read/write helpers (P4 / D-012)
 *
 * Pures fonctions. SSR-safe : retournent `null` côté serveur (pas d'accès `document`).
 */

import {
  CONSENT_COOKIE_NAME,
  CONSENT_MAX_AGE_SECONDS,
  CONSENT_VERSION,
  type ConsentState,
} from "./types";

/**
 * Lit le cookie de consentement. Retourne `null` si :
 * - Côté serveur (pas de `document`)
 * - Cookie absent
 * - Cookie corrompu ou version obsolète
 */
export function readConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!match) return null;

  const raw = decodeURIComponent(match.slice(CONSENT_COOKIE_NAME.length + 1));

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Record<string, unknown>;
    if (obj.v !== CONSENT_VERSION) return null;
    if (obj.necessary !== true) return null;
    if (
      typeof obj.analytics !== "boolean" ||
      typeof obj.marketing !== "boolean" ||
      typeof obj.personalization !== "boolean" ||
      typeof obj.ts !== "string"
    ) {
      return null;
    }
    return {
      v: CONSENT_VERSION,
      necessary: true,
      analytics: obj.analytics,
      marketing: obj.marketing,
      personalization: obj.personalization,
      ts: obj.ts,
    };
  } catch {
    return null;
  }
}

/**
 * Écrit le cookie de consentement. Max-Age 12 mois, SameSite=Lax,
 * Secure si HTTPS. Path=/ pour disponibilité globale.
 */
export function writeConsent(state: ConsentState): void {
  if (typeof document === "undefined") return;

  const value = encodeURIComponent(JSON.stringify(state));
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; Max-Age=${CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

/** Efface le cookie de consentement (déclenche un re-prompt à la prochaine visite). */
export function clearConsent(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${CONSENT_COOKIE_NAME}=; Max-Age=0; Path=/`;
}
