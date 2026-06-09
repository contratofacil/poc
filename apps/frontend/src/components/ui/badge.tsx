import * as React from "react";
import { complianceBadgeClass, type ComplianceStatus } from "@/styles/tokens";

/** Generic badge */
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline";
}

export function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        variant === "outline"
          ? "bg-transparent border border-[#e8e4dd] text-[#4a5568]"
          : "bg-[#e8e4dd] text-[#1a3a5c]",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

/** Compliance-specific tri-color badge */
interface ComplianceBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: ComplianceStatus;
  label?: string;
}

const DOT_COLOR: Record<ComplianceStatus, string> = {
  green: "bg-[#16a34a]",
  amber: "bg-[#d97706]",
  red:   "bg-[#dc2626]",
};

const DEFAULT_LABEL: Record<ComplianceStatus, string> = {
  green: "Conforme",
  amber: "Attention",
  red:   "Urgent",
};

export function ComplianceBadge({ status, label, className = "", ...props }: ComplianceBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        complianceBadgeClass[status],
        className,
      ].join(" ")}
      {...props}
    >
      <span className={["w-1.5 h-1.5 rounded-full", DOT_COLOR[status]].join(" ")} />
      {label ?? DEFAULT_LABEL[status]}
    </span>
  );
}
