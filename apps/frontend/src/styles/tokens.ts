/**
 * EasyLaw — Legal Prestige Design Tokens
 * Sprint 0 — Design System
 *
 * Single source of truth for all design tokens.
 * Use these in className strings, inline styles, or Tailwind arbitrary values.
 */

export const colors = {
  brand: {
    primary:         "#1a3a5c", // Judiciary Blue
    primaryHover:    "#12293f",
    secondary:       "#d4a017", // Prestige Gold
    secondaryHover:  "#b8891a",
  },
  surface: {
    page:   "#f8f6f1", // Warm White
    card:   "#ffffff",
    mist:   "#e8e4dd", // Borders / dividers
    sidebar: "#1a3a5c",
  },
  text: {
    primary:   "#1a202c",
    secondary: "#4a5568",
    muted:     "#718096",
    inverse:   "#f8f6f1",
  },
  /** Compliance dashboard tri-color system */
  status: {
    green:  { text: "#16a34a", bg: "#dcfce7", border: "#bbf7d0" },
    amber:  { text: "#d97706", bg: "#fef3c7", border: "#fde68a" },
    red:    { text: "#dc2626", bg: "#fee2e2", border: "#fecaca" },
  },
} as const;

export const fonts = {
  serif:  "var(--font-playfair)",   // Playfair Display — headings
  sans:   "var(--font-inter)",      // Inter — body text
  mono:   "var(--font-jetbrains)",  // JetBrains Mono — legal refs
} as const;

export const radius = {
  sm:   "4px",
  md:   "8px",
  lg:   "12px",
  xl:   "16px",
  full: "9999px",
} as const;

export const shadows = {
  card:  "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
  modal: "0 10px 40px -8px rgb(26 58 92 / 0.18)",
} as const;

/** Helper — returns Tailwind-compatible class strings for compliance status badges */
export type ComplianceStatus = "green" | "amber" | "red";

export const complianceBadgeClass: Record<ComplianceStatus, string> = {
  green: "bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]",
  amber: "bg-[#fef3c7] text-[#d97706] border border-[#fde68a]",
  red:   "bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]",
};

/** Shared button variants (combine with your btn base class) */
export const buttonVariants = {
  primary:  "bg-[#1a3a5c] text-[#f8f6f1] hover:bg-[#12293f] active:bg-[#0d1f2e]",
  gold:     "bg-[#d4a017] text-[#1a202c] font-semibold hover:bg-[#b8891a]",
  outline:  "bg-transparent border border-[#e8e4dd] text-[#4a5568] hover:bg-[#f8f6f1]",
  ghost:    "bg-transparent text-[#4a5568] hover:bg-[#f8f6f1]",
  danger:   "bg-[#dc2626] text-white hover:bg-[#b91c1c]",
} as const;
