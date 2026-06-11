"use client";

import * as React from "react";
import { Shield } from "lucide-react";

const STORAGE_KEY = "easylaw_eidv_provider";

// Décision OQ-007 (2026-06-11) : Veriff retenu pour la production — société UE
// (Estonie), eIDV + liveness + screening PEP/sanctions, self-serve à faible volume.
// "Privy KYC" retiré : privy.io n'offre pas de produit eIDV autonome (son API
// "KYC" ne couvre que le statut des onramps fiat via Bridge).
const PROVIDERS = [
  {
    id: "veriff",
    name: "Veriff",
    tagline: "eIDV + liveness + screening PEP/sanctions. Société UE, conforme AML5, self-serve.",
    recommended: true,
  },
  {
    id: "onfido",
    name: "Onfido (Entrust)",
    tagline: "Vérification documentaire et biométrique, couverture mondiale. Avantageux à fort volume.",
    recommended: false,
  },
  {
    id: "mock",
    name: "Simulation (POC)",
    tagline: "Driver de démonstration — décision simulée, aucune donnée transmise à un tiers.",
    recommended: false,
  },
] as const;

type ProviderId = (typeof PROVIDERS)[number]["id"];

export function EidvProviderSelector() {
  const [selected, setSelected] = React.useState<ProviderId>("veriff");

  React.useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ProviderId | null;
    if (stored && PROVIDERS.some((p) => p.id === stored)) {
      setSelected(stored);
    }
  }, []);

  const handleSelect = (id: ProviderId) => {
    setSelected(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  return (
    <section aria-labelledby="eidv-heading" className="mt-10">
      <details className="rounded-xl border bg-white shadow-[var(--shadow-card)]" style={{ borderColor: "var(--surface-mist)" }}>
        <summary
          className="cursor-pointer list-none p-5 flex items-center gap-2 text-lg font-semibold focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] rounded-xl"
          style={{ color: "var(--text-primary)" }}
        >
          <Shield className="h-5 w-5 shrink-0" style={{ color: "var(--brand-primary)" }} aria-hidden="true" />
          Configuration AML/KYC — Vérification d&apos;identité
        </summary>

        <div className="px-5 pb-5 pt-0 border-t" style={{ borderColor: "var(--surface-mist)" }}>
          <p className="text-sm mb-4 mt-4" style={{ color: "var(--text-secondary)" }}>
            Choisissez le fournisseur eIDV pour les contrôles KYC de vos clients et bénéficiaires effectifs.
          </p>

          <fieldset>
            <legend className="sr-only">Fournisseur eIDV</legend>
            <div className="space-y-3" role="radiogroup" aria-label="Fournisseur eIDV">
              {PROVIDERS.map((provider) => (
                <label
                  key={provider.id}
                  className={[
                    "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
                    "focus-within:shadow-[var(--shadow-focus)]",
                  ].join(" ")}
                  style={{
                    borderColor: selected === provider.id ? "var(--brand-primary)" : "var(--surface-mist-strong)",
                    background: selected === provider.id ? "var(--surface-page)" : "white",
                  }}
                >
                  <input
                    type="radio"
                    name="eidv-provider"
                    value={provider.id}
                    checked={selected === provider.id}
                    onChange={() => handleSelect(provider.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {provider.name}
                      </span>
                      {provider.recommended && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{
                            background: "var(--status-green-bg)",
                            color: "var(--status-green)",
                            border: "1px solid var(--status-green-border)",
                          }}
                        >
                          Recommandé
                        </span>
                      )}
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                      {provider.tagline}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <p className="text-xs mt-4" style={{ color: "var(--text-muted)" }}>
            Conformément à la <span lang="pt">Lei 83/2017</span> — données conservées 7 ans.
            La configuration est stockée localement en attendant l&apos;endpoint paramètres backend (OQ-007).
          </p>
        </div>
      </details>
    </section>
  );
}
