import React from "react";

export type Period = "today" | "7d" | "30d" | "all";

const OPTIONS: { value: Period; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "all", label: "Tout" },
];

interface PeriodFilterProps {
  value: Period;
  onChange: (period: Period) => void;
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div
      className="inline-flex gap-0.5 p-1 rounded-lg border"
      style={{ background: "var(--surface-page)", borderColor: "var(--surface-mist)" }}
      role="group"
      aria-label="Filtrer par période"
    >
      {OPTIONS.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="px-3 py-1.5 rounded-md text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--brand-primary)]/45"
            style={
              active
                ? { background: "var(--brand-primary)", color: "var(--text-inverse)" }
                : { background: "transparent", color: "var(--text-muted)" }
            }
            aria-pressed={active}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
