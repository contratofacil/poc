"use client";

import * as React from "react";
import { Mail, Play } from "lucide-react";
import type { AlertLog } from "@/lib/compliance/types";

interface EmailAlertsLogProps {
  logs: AlertLog[];
  onSimulate: () => Promise<{ logsGenerated: number }>;
}

export function EmailAlertsLog({ logs, onSimulate }: EmailAlertsLogProps) {
  const [isSimulating, setIsSimulating] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSimulate = async () => {
    setIsSimulating(true);
    setMessage(null);
    try {
      const result = await onSimulate();
      setMessage({
        type: "success",
        text: `Simulation réussie — ${result.logsGenerated} alerte(s) générée(s).`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "La simulation a échoué.",
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <section aria-labelledby="alerts-heading" className="mt-10">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2
          id="alerts-heading"
          className="text-lg font-semibold inline-flex items-center gap-2"
          style={{ color: "var(--text-primary)" }}
        >
          <Mail className="h-5 w-5" style={{ color: "var(--brand-primary)" }} aria-hidden="true" />
          Journal des alertes email
        </h2>
        <button
          type="button"
          onClick={handleSimulate}
          disabled={isSimulating}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)] disabled:opacity-60"
          style={{ background: "var(--brand-secondary)", color: "var(--text-primary)" }}
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          {isSimulating ? "Simulation…" : "Simuler alertes"}
        </button>
      </div>

      {message && (
        <p
          className="mb-3 text-sm rounded-lg px-3 py-2"
          style={{
            background: message.type === "success" ? "var(--status-green-bg)" : "var(--status-red-bg)",
            color: message.type === "success" ? "var(--status-green)" : "var(--status-red)",
          }}
          role="status"
        >
          {message.text}
        </p>
      )}

      <div
        className="rounded-xl border bg-white shadow-[var(--shadow-card)] p-4 max-h-80 overflow-y-auto"
        style={{ borderColor: "var(--surface-mist)" }}
      >
        {logs.length === 0 ? (
          <p className="text-sm text-center py-6 text-[var(--text-muted)]">Aucune alerte envoyée.</p>
        ) : (
          <ul className="space-y-4">
            {logs.map((log) => (
              <li
                key={log.id}
                className="border-b pb-4 last:border-b-0 last:pb-0"
                style={{ borderColor: "var(--surface-mist)" }}
              >
                <p className="text-xs text-[var(--text-muted)] mb-1">
                  {new Date(log.sent_at).toLocaleString("fr-FR")} · To: {log.recipient_email}
                </p>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--text-primary)" }}>
                  {log.subject}
                </p>
                <pre
                  className="text-xs whitespace-pre-wrap font-sans"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {log.body}
                </pre>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
