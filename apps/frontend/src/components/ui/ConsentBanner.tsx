"use client";

/**
 * <ConsentBanner /> — bottom-fixed banner + Personnaliser modal (P4 / D-012)
 *
 * Accessibility :
 *  - Banner : `role="region" aria-label="..."` (pas modal — n'empêche pas la nav)
 *  - Modal Personnaliser : `role="dialog" aria-modal="true"` + focus trap + Escape
 *  - 3 boutons à équivalence visuelle stricte (anti dark-pattern)
 *  - Toggle Nécessaires `aria-disabled` (jamais désactivable)
 *
 * I18n : lit `document.documentElement.lang` au mount (fallback PT).
 */

import * as React from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { useConsent } from "@/lib/consent/context";
import { DEFAULT_CHOICES, type ConsentChoices } from "@/lib/consent/types";
import { getConsentMessages } from "@/lib/consent/i18n";

export function ConsentBanner() {
  const {
    state,
    mounted,
    isBannerOpen,
    acceptAll,
    rejectAll,
    update,
  } = useConsent();
  const [showCustomize, setShowCustomize] = React.useState(false);
  const [lang, setLang] = React.useState<string | undefined>(undefined);
  // Ref vers le bouton "Personnaliser" — restitution du focus à la fermeture du modal,
  // robuste sur Safari/Firefox où click souris ne pose pas le focus.
  const customizeBtnRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    setLang(document.documentElement.lang || "pt");
  }, []);

  const t = getConsentMessages(lang);

  // Anti-flash : ne rien rendre tant que le useEffect du Provider n'a pas lu le cookie
  if (!mounted) return null;
  if (!isBannerOpen) return null;

  return (
    <>
      <aside
        role="region"
        aria-label={t.bannerTitle}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--surface-mist-strong)] bg-[var(--surface-card)] shadow-[0_-4px_24px_-8px_rgb(26_58_92_/_0.10)]"
      >
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex-shrink-0">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand-primary)]">
                <Cookie className="h-5 w-5 text-[var(--surface-page)]" aria-hidden="true" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="consent-banner-title"
                className="text-base font-semibold text-[var(--text-primary)] mb-1"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {t.bannerTitle}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {t.bannerBody}
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                {t.legalNote}{" "}
                <Link
                  href="/legal/cookies"
                  className="underline underline-offset-2 hover:text-[var(--brand-primary)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] rounded-sm"
                >
                  {t.policyLink}
                </Link>
              </p>
            </div>
          </div>

          {/*
            Anti dark-pattern (CNIL/CNPD/EDPB) : "Accepter" et "Refuser" partagent EXACTEMENT
            le même style visuel (filled primary). Seul "Personnaliser" est en outline.
            DOM order respecte le tab order AC-5 : Accepter → Refuser → Personnaliser ;
            la mise en page visuelle responsive est faite via `sm:order-*`.
          */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-3 sm:justify-end">
            <button
              type="button"
              onClick={acceptAll}
              className="order-1 sm:order-3 rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-medium text-[var(--surface-page)] hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] transition-colors"
            >
              {t.acceptAll}
            </button>
            <button
              type="button"
              onClick={rejectAll}
              className="order-2 sm:order-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-medium text-[var(--surface-page)] hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] transition-colors"
            >
              {t.rejectAll}
            </button>
            <button
              ref={customizeBtnRef}
              type="button"
              onClick={() => setShowCustomize(true)}
              className="order-3 sm:order-1 rounded-lg border border-[var(--surface-mist-strong)] bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-page)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] transition-colors"
            >
              {t.customize}
            </button>
          </div>
        </div>
      </aside>

      {showCustomize && (
        <CustomizeDialog
          initial={state ? extractChoices(state) : DEFAULT_CHOICES}
          messages={t}
          returnFocusRef={customizeBtnRef}
          onCancel={() => setShowCustomize(false)}
          onSave={(choices) => {
            update(choices);
            setShowCustomize(false);
          }}
        />
      )}
    </>
  );
}

function extractChoices(state: { analytics: boolean; marketing: boolean; personalization: boolean }): ConsentChoices {
  return {
    analytics: state.analytics,
    marketing: state.marketing,
    personalization: state.personalization,
  };
}

function CustomizeDialog({
  initial,
  messages: t,
  returnFocusRef,
  onCancel,
  onSave,
}: {
  initial: ConsentChoices;
  messages: ReturnType<typeof getConsentMessages>;
  /** Ref vers le bouton qui a ouvert le modal. Restauration du focus à la fermeture,
   *  robuste sur Safari/Firefox où le click souris ne pose pas le focus sur un button. */
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
  onCancel: () => void;
  onSave: (choices: ConsentChoices) => void;
}) {
  const [draft, setDraft] = React.useState<ConsentChoices>(initial);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const closeBtnRef = React.useRef<HTMLButtonElement>(null);
  const titleId = React.useId();

  // Focus trap + Escape
  React.useEffect(() => {
    // Focus initial sur le bouton de fermeture (premier focusable du dialog, AT-friendly)
    closeBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), [role="switch"]:not([aria-disabled="true"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      // Si le focus s'est échappé du dialog (ex. clic backdrop a déplacé activeElement vers body),
      // le ramener à l'intérieur en commençant par le premier focusable.
      if (!active || !dialogRef.current?.contains(active)) {
        e.preventDefault();
        first.focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);

    // Scroll-lock the body while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      // Restauration robuste : priorité à returnFocusRef (bouton trigger connu).
      returnFocusRef.current?.focus();
    };
  }, [onCancel, returnFocusRef]);

  // Empêche le click souris sur le backdrop de déplacer le focus vers body
  // (préserve l'intégrité du focus trap pour la nav clavier ultérieure).
  const handleBackdropMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
    }
  };

  return (
    <div
      onMouseDown={handleBackdropMouseDown}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[rgb(26_58_92_/_0.50)] p-4 sm:items-center"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-2xl rounded-xl bg-[var(--surface-card)] shadow-[var(--shadow-modal)] max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between border-b border-[var(--surface-mist)] px-5 py-4 sm:px-6">
          <div>
            <h2
              id={titleId}
              className="text-lg font-semibold text-[var(--text-primary)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {t.modalTitle}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{t.modalIntro}</p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onCancel}
            aria-label={t.cancel}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface-page)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-4 sm:px-6 space-y-3">
          <CategoryRow
            label={t.catNecessary}
            description={t.catNecessaryDesc}
            locked
            lockedLabel={t.catNecessaryLocked}
            checked
            onChange={() => {}}
            ariaToggle={t.ariaToggle}
          />
          <CategoryRow
            label={t.catAnalytics}
            description={t.catAnalyticsDesc}
            checked={draft.analytics}
            onChange={(v) => setDraft((d) => ({ ...d, analytics: v }))}
            ariaToggle={t.ariaToggle}
          />
          <CategoryRow
            label={t.catMarketing}
            description={t.catMarketingDesc}
            checked={draft.marketing}
            onChange={(v) => setDraft((d) => ({ ...d, marketing: v }))}
            ariaToggle={t.ariaToggle}
          />
          <CategoryRow
            label={t.catPersonalization}
            description={t.catPersonalizationDesc}
            checked={draft.personalization}
            onChange={(v) => setDraft((d) => ({ ...d, personalization: v }))}
            ariaToggle={t.ariaToggle}
          />
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--surface-mist)] px-5 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--surface-mist-strong)] bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-page)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-medium text-[var(--surface-page)] hover:bg-[var(--brand-primary-hover)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] transition-colors"
          >
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({
  label,
  description,
  checked,
  onChange,
  locked,
  lockedLabel,
  ariaToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  locked?: boolean;
  lockedLabel?: string;
  ariaToggle: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-lg border border-[var(--surface-mist)] bg-[var(--surface-page)] p-3 sm:p-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{label}</p>
          {locked && (
            <span className="rounded-full bg-[var(--status-green-bg)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--status-green)] border border-[var(--status-green-border)]">
              {lockedLabel}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-[var(--text-secondary)] leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={locked || undefined}
        aria-label={`${ariaToggle} — ${label}`}
        onClick={() => !locked && onChange(!checked)}
        className={[
          "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors",
          "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]",
          checked
            ? "bg-[var(--brand-primary)]"
            : "bg-[var(--surface-mist-strong)]",
          locked ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className={[
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          ].join(" ")}
        />
      </button>
    </div>
  );
}
