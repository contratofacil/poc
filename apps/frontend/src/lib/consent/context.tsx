"use client";

/**
 * Cookie Consent — React Context + useConsent() hook (P4 / D-012)
 *
 * Patron SSR-safe : `hasResolved=false` au render serveur initial, puis
 * `useEffect` lit le cookie au mount. Le banner gate son rendu via `mounted`
 * pour éviter le flash "no consent → consent" à l'hydratation.
 */

import * as React from "react";
import {
  ALL_ACCEPTED,
  CONSENT_VERSION,
  DEFAULT_CHOICES,
  type ConsentChoices,
  type ConsentState,
} from "./types";
import { clearConsent, readConsent, writeConsent } from "./cookie";

interface ConsentContextValue {
  /** État courant. `null` tant que le user n'a pas tranché (jamais visible aux consumers une fois `hasResolved`). */
  state: ConsentState | null;
  /** `true` si un choix a déjà été persisté (cookie présent et valide). */
  hasResolved: boolean;
  /** `true` une fois le `useEffect` initial passé (gate anti-flash). */
  mounted: boolean;
  /** `true` quand le banner doit être affiché (premier consent OU réouverture explicite). */
  isBannerOpen: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  /** Sauvegarde un état partiel + nécessaires forcés. Ferme le banner. */
  update: (choices: ConsentChoices) => void;
  /** Rouvre le banner (depuis le footer ou un trigger ad-hoc). */
  openBanner: () => void;
  /** Ferme le banner sans persister — uniquement utilisable si `hasResolved` (sinon on force le choix). */
  closeBanner: () => void;
  /** Efface le cookie. Réservé aux outils admin / debug. */
  reset: () => void;
}

const ConsentContext = React.createContext<ConsentContextValue | null>(null);

function persist(choices: ConsentChoices): ConsentState {
  const next: ConsentState = {
    v: CONSENT_VERSION,
    necessary: true,
    ...choices,
    ts: new Date().toISOString(),
  };
  writeConsent(next);
  return next;
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<ConsentState | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [isBannerOpen, setIsBannerOpen] = React.useState(false);

  React.useEffect(() => {
    const existing = readConsent();
    setState(existing);
    setIsBannerOpen(existing === null);
    setMounted(true);
  }, []);

  const acceptAll = React.useCallback(() => {
    setState(persist(ALL_ACCEPTED));
    setIsBannerOpen(false);
  }, []);

  const rejectAll = React.useCallback(() => {
    setState(persist(DEFAULT_CHOICES));
    setIsBannerOpen(false);
  }, []);

  const update = React.useCallback((choices: ConsentChoices) => {
    setState(persist(choices));
    setIsBannerOpen(false);
  }, []);

  const openBanner = React.useCallback(() => setIsBannerOpen(true), []);

  const closeBanner = React.useCallback(() => {
    // Refuse de fermer si pas encore tranché : on force le choix au premier affichage
    setIsBannerOpen((prev) => (state === null ? prev : false));
  }, [state]);

  const reset = React.useCallback(() => {
    clearConsent();
    setState(null);
    setIsBannerOpen(true);
  }, []);

  const value: ConsentContextValue = {
    state,
    hasResolved: state !== null,
    mounted,
    isBannerOpen,
    acceptAll,
    rejectAll,
    update,
    openBanner,
    closeBanner,
    reset,
  };

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}

export function useConsent(): ConsentContextValue {
  const ctx = React.useContext(ConsentContext);
  if (!ctx) {
    throw new Error(
      "useConsent() must be used inside <ConsentProvider>. Wrap the app root.",
    );
  }
  return ctx;
}
