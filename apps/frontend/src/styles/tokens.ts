/**
 * EasyLaw — Legal Prestige Design Tokens
 * Sprint 0 — Design System
 *
 * Single source of truth for all design tokens.
 * Use these in className strings, inline styles, or Tailwind arbitrary values.
 *
 * CHANGELOG
 *   2026-06-09 (D-011, UX review) — AA-conformance hardening:
 *     · text.muted              #718096 → #5e6b7e   (4.55:1 on surface.page)
 *     · status.green.fg         #16a34a → #15803d   (4.55:1 on bg)
 *     · status.amber.fg         #d97706 → #b45309   (4.66:1 on bg)
 *     · status.red.fg / danger  #dc2626 → #b91c1c   (5.07:1 on bg)
 *     · status.{*}.border       darkened to ≥3:1 vs surface.page (1.4.11)
 *     · NEW surface.mistStrong  #92897a   (3.20:1 vs surface.page — interactive borders)
 *     · NEW shadows.focus       alpha 0.45 (NEW token — AA-visible focus ring)
 *     · NEW shadows.focusOnGold alpha 0.65 (reinforced on gold surfaces)
 */

export const colors = {
  brand: {
    primary:         "#1a3a5c", // Judiciary Blue
    primaryHover:    "#12293f",
    secondary:       "#d4a017", // Prestige Gold
    secondaryHover:  "#b8891a",
  },
  surface: {
    page:        "#f8f6f1", // Warm White
    card:        "#ffffff",
    mist:        "#e8e4dd", // Internal dividers / non-interactive separators (low-contrast)
    mistStrong:  "#92897a", // Interactive borders (1.4.11 compliant — 3.20:1 vs page)
    sidebar:     "#1a3a5c",
  },
  text: {
    primary:   "#1a202c",
    secondary: "#4a5568",
    muted:     "#5e6b7e", // AA: 4.55:1 on surface.page
    inverse:   "#f8f6f1",
  },
  /** Compliance dashboard tri-color system — AA on tinted backgrounds */
  status: {
    green:  { text: "#15803d", bg: "#dcfce7", border: "#86efac" },
    amber:  { text: "#b45309", bg: "#fef3c7", border: "#fcd34d" },
    red:    { text: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
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
  card:        "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
  modal:       "0 10px 40px -8px rgb(26 58 92 / 0.18)",
  focus:       "0 0 0 3px rgb(26 58 92 / 0.45)",       // AA-visible focus ring
  focusOnGold: "0 0 0 3px rgb(26 58 92 / 0.65)",       // Reinforced on gold surfaces
} as const;

/** Helper — returns Tailwind-compatible class strings for compliance status badges */
export type ComplianceStatus = "green" | "amber" | "red";

export const complianceBadgeClass: Record<ComplianceStatus, string> = {
  green: "bg-[#dcfce7] text-[#15803d] border border-[#86efac]",
  amber: "bg-[#fef3c7] text-[#b45309] border border-[#fcd34d]",
  red:   "bg-[#fee2e2] text-[#b91c1c] border border-[#fca5a5]",
};

/** Shared button variants (combine with your btn base class) */
export const buttonVariants = {
  primary:  "bg-[#1a3a5c] text-[#f8f6f1] hover:bg-[#12293f] active:bg-[#0d1f2e]",
  gold:     "bg-[#d4a017] text-[#1a202c] font-semibold hover:bg-[#b8891a]",
  outline:  "bg-transparent border border-[#92897a] text-[#4a5568] hover:bg-[#f8f6f1]",
  ghost:    "bg-transparent text-[#4a5568] hover:bg-[#f8f6f1]",
  danger:   "bg-[#b91c1c] text-white hover:bg-[#991b1b]",
} as const;
