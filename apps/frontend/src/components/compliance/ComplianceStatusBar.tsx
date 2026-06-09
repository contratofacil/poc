import * as React from "react";

interface ComplianceStatusBarProps {
  counts: { green: number; amber: number; red: number };
}

/**
 * Barre tri-color flex segments avec labels intégrés + légende (P3 / D-008).
 * Utilise les tokens status AA durcis (P1 D-011).
 */
export function ComplianceStatusBar({ counts }: ComplianceStatusBarProps) {
  const total = Math.max(counts.green + counts.amber + counts.red, 1);
  const pct = {
    green: (counts.green / total) * 100,
    amber: (counts.amber / total) * 100,
    red: (counts.red / total) * 100,
  };

  return (
    <div>
      <div
        className="flex items-stretch h-12 rounded-lg overflow-hidden border mb-4"
        style={{ borderColor: "var(--surface-mist)" }}
        role="img"
        aria-label={`État global compliance : ${counts.green} à jour, ${counts.amber} à venir, ${counts.red} urgent`}
      >
        {counts.green > 0 && (
          <div
            className="flex items-center justify-center text-sm font-semibold"
            style={{
              background: "var(--status-green-bg)",
              color: "var(--status-green)",
              flexBasis: `${pct.green}%`,
            }}
          >
            {counts.green} à jour
          </div>
        )}
        {counts.amber > 0 && (
          <div
            className="flex items-center justify-center text-sm font-semibold"
            style={{
              background: "var(--status-amber-bg)",
              color: "var(--status-amber)",
              flexBasis: `${pct.amber}%`,
            }}
          >
            {counts.amber} à venir
          </div>
        )}
        {counts.red > 0 && (
          <div
            className="flex items-center justify-center text-sm font-semibold"
            style={{
              background: "var(--status-red-bg)",
              color: "var(--status-red)",
              flexBasis: `${pct.red}%`,
            }}
          >
            {counts.red} urgent
          </div>
        )}
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs list-none p-0">
        <li className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: "var(--status-green)" }}
            aria-hidden="true"
          />
          <span className="text-[var(--text-secondary)]">À jour (90+ jours de marge)</span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: "var(--status-amber)" }}
            aria-hidden="true"
          />
          <span className="text-[var(--text-secondary)]">À venir (≤ 90 jours)</span>
        </li>
        <li className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ background: "var(--status-red)" }}
            aria-hidden="true"
          />
          <span className="text-[var(--text-secondary)]">Urgent (≤ 30 jours ou retard)</span>
        </li>
      </ul>
    </div>
  );
}
