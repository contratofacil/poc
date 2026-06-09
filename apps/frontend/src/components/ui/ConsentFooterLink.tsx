"use client";

/**
 * <ConsentFooterLink /> — bouton "Gérer mes cookies" (P4 / D-012)
 *
 * À monter dans le footer global du site. Rouvre le banner via `openBanner()`.
 * Visuellement discret (lien texte underline), s'aligne avec les autres liens légaux du footer.
 */

import * as React from "react";
import { useConsent } from "@/lib/consent/context";
import { getConsentMessages } from "@/lib/consent/i18n";

export function ConsentFooterLink({ className = "" }: { className?: string }) {
  const { openBanner } = useConsent();
  const [lang, setLang] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    setLang(document.documentElement.lang || "pt");
  }, []);

  const t = getConsentMessages(lang);

  return (
    <button
      type="button"
      onClick={openBanner}
      className={[
        "inline-flex items-center text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2 transition-colors",
        "focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] rounded-sm",
        className,
      ].join(" ")}
    >
      {t.footerManage}
    </button>
  );
}
