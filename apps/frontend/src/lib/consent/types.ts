/**
 * Cookie Consent — types & constants (P4 / D-012)
 *
 * Conformité ePrivacy + RGPD Art. 7 : consentement explicite opt-in pour
 * cookies non-essentiels. Nécessaires forcés à `true` et non-désactivables.
 */

export const CONSENT_COOKIE_NAME = "easylaw_consent_v1";
export const CONSENT_VERSION = 1;
/** 12 mois en secondes (Max-Age). Au-delà, re-consent obligatoire. */
export const CONSENT_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export type ConsentCategory =
  | "necessary"
  | "analytics"
  | "marketing"
  | "personalization";

export interface ConsentState {
  v: typeof CONSENT_VERSION;
  necessary: true; // forcé — non éditable côté UI
  analytics: boolean;
  marketing: boolean;
  personalization: boolean;
  /** ISO 8601 timestamp du dernier choix utilisateur */
  ts: string;
}

/** État opt-in/opt-out (sans la version ni le timestamp), utilisé pour les helpers UI. */
export type ConsentChoices = Pick<
  ConsentState,
  "analytics" | "marketing" | "personalization"
>;

export const DEFAULT_CHOICES: ConsentChoices = {
  analytics: false,
  marketing: false,
  personalization: false,
};

export const ALL_ACCEPTED: ConsentChoices = {
  analytics: true,
  marketing: true,
  personalization: true,
};
