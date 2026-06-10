import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export type KPIColor = "default" | "green" | "amber" | "red" | "blue";

interface KPITrend {
  delta: number;
  label?: string;
}

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: KPITrend;
  color?: KPIColor;
}

const COLOR_MAP: Record<KPIColor, { accent: string; bg: string; border: string }> = {
  default: {
    accent: "var(--brand-secondary)",
    bg: "var(--surface-card)",
    border: "var(--surface-mist)",
  },
  green: {
    accent: "var(--status-green)",
    bg: "var(--status-green-bg)",
    border: "var(--status-green-border)",
  },
  amber: {
    accent: "var(--status-amber)",
    bg: "var(--status-amber-bg)",
    border: "var(--status-amber-border)",
  },
  red: {
    accent: "var(--status-red)",
    bg: "var(--status-red-bg)",
    border: "var(--status-red-border)",
  },
  blue: {
    accent: "var(--brand-primary)",
    bg: "var(--surface-card)",
    border: "var(--surface-mist)",
  },
};

export function KPICard({ title, value, subtitle, icon, trend, color = "default" }: KPICardProps) {
  const { accent, bg, border } = COLOR_MAP[color];

  const trendPositive = trend && trend.delta > 0;
  const trendNeutral = trend && trend.delta === 0;
  const TrendIcon = trendNeutral ? Minus : trendPositive ? TrendingUp : TrendingDown;
  const trendColor = trendNeutral
    ? "var(--text-muted)"
    : trendPositive
    ? "var(--status-green)"
    : "var(--status-red)";

  return (
    <div
      className="p-5 rounded-xl border shadow-[var(--shadow-card)] flex flex-col gap-3"
      style={{ background: bg, borderColor: border }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          {title}
        </span>
        {icon && (
          <span className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: `${accent}18`, color: accent }}>
            {icon}
          </span>
        )}
      </div>

      <div>
        <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-serif)", color: "var(--brand-primary)" }}>
          {value}
        </div>
        {subtitle && (
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: trendColor }}>
          <TrendIcon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            {trend.delta > 0 ? "+" : ""}
            {trend.delta}
            {trend.label ? ` ${trend.label}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
