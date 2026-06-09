# Rubric Walker Review

**Spines audited:**
- `DESIGN.md` (277 lines)
- `EXPERIENCE.md` (452 lines)

**Date:** 2026-06-09

## Verdict: PASS WITH NOTES

Both spines are substantively complete, canonically ordered, and tightly cross-referenced. The blocking items are minor: one frontmatter token gap on the DESIGN side, light token-reference discipline drift in EXPERIENCE prose, and one self-contradiction on emoji policy (TrustBar pictograms).

---

## Pass 1 — Coverage checklist

### DESIGN.md — canonical sections (order-locked)

- [✓] **Brand & Style** — present, opens body (lines 156-167). Anchors the "Prestige juridique accessible" axis with 4 first-principles, inspirations + anti-references, and chromatic tonality. Strong.
- [✓] **Colors** — present (lines 169-182). Cross-refs `{colors}` frontmatter, gives semantic usage rules per role (authority / elevation / parchment / mist / status). Dark mode explicitly deferred to Phase 3 — good closure.
- [✓] **Typography** — present (lines 184-198). Triptyque rationale (Playfair / Inter / JetBrains Mono), italique rules, tabular-nums note.
- [✓] **Layout & Spacing** — present (lines 200-213). Mobile / tablet / desktop padding rules, container widths, section gaps.
- [✓] **Elevation & Depth** — present (lines 215-223). Discrete-by-design, three named shadows, anti-neumorphism/glassmorphism stated.
- [✓] **Shapes** — present (lines 225-234). Per-element rounded scale, divider rule.
- [✓] **Components** — present (lines 236-254). 13-row inventory with `Implémenté` vs `À créer` status.
- [✓] **Do's and Don'ts** — present, closes the spine (lines 256-end). 6 Do, 8 Don't. Crisp.

**DESIGN.md order:** Brand & Style → Colors → Typography → Layout & Spacing → Elevation & Depth → Shapes → Components → Do's and Don'ts. **Order-lock respected.**

### DESIGN.md — frontmatter tokens

- [✓] `colors` — brand / surface / text / status / danger families populated with hex.
- [✓] `typography` — fonts, scale (9 steps), letterSpacing — fully populated.
- [✓] `rounded` — 5 steps (sm/md/lg/xl/full) populated.
- [✓] `spacing` — unit, scale (12 steps), container (5 widths), layout (3 specials) populated.
- [✓] `components` — 7 components specced (button, card, input, badge, trustbar, complianceBadge — note: 5 of the 7 are actual components; trustbar and complianceBadge are semi-tokens).
- [⚠] `shadows` and `motion` — present in frontmatter (lines 135-149) but **not declared in the rubric's required token list**. They are useful additions; not a defect, but worth noting they exceed the canonical 5.

### EXPERIENCE.md — required sections

- [✓] **Foundation** — present (lines 20-31). Form-factor, UI system, framework, surfaces, auth, i18n, stakes — all populated.
- [✓] **Information Architecture** — present (lines 33-92). Site map ASCII + structuring rules + need→surface→US mapping table.
- [✓] **Voice and Tone** — present (lines 94-121). Identity statement + 8-row tonal modulation table + 9 microcopy rules.
- [✓] **Component Patterns** — present (lines 123-180). 6 behavioral patterns specced (Wizard, FileDrop, ChatBubble, PdfPreviewPane, Timeline, TrustBar, LangSwitcher = 7 actually).
- [✓] **State Patterns** — present (lines 182-230). Loading, Empty, Errors, Confirmations, Permissions, Streaming IA — six state families.
- [✓] **Interaction Primitives** — present (lines 232-245). 10-row table covering click / long-press / swipe / hover / drag / keyboard / Cmd-K / Cmd-S / Escape / Enter.
- [✓] **Accessibility Floor** — present (lines 247-268). WCAG 2.2 AA floor, AAA on critical paths. Non-negotiables + testing list.
- [✓] **Key Flows** — present (lines 317-384). 5 flows.

### EXPERIENCE.md — triggered sections

- [✓] **Inspiration & Anti-patterns** — present (lines 270-285). 5 inspirations, 5 anti-patterns with EasyLaw counter-rule each.
- [✓] **Responsive & Platform** — present (lines 287-315). Breakpoints + per-surface mobile/desktop table + iOS/PWA/print notes.

### EXPERIENCE.md — invented sections (lines 388-441)

- Disclaimers & Mentions obligatoires (regulated content)
- Trust signals — orchestration
- Multi-rôles — adaptation du shell
- Notifications & Canaux

All four are product-specific concerns appropriate to a regulated-consumer juridical platform and properly disclosed under a `## Sections inventées` heading.

### EXPERIENCE.md — Open Questions

- [✓] **Open Questions résiduelles** (lines 445-451) — 5 items (OQ-001…OQ-005), each carries a recommendation or referral path.

---

## Findings (severity-ranked)

### Critical (blocks finalize)

*None.*

### Major (should fix)

1. **Self-contradiction on emoji policy — TrustBar.** DESIGN.md `Don't` rule (line 272) says *"Don't utiliser d'emoji dans la UI"*, and EXPERIENCE.md microcopy rule (line 119) reiterates *"Émojis interdits dans toute UI persistante"*. Yet EXPERIENCE.md line 171 describes TrustBar as *"🔒 TLS · 🛡 RGPD · ⚖ Ordem dos Advogados · ✓ AMA Certified"* and LangSwitcher line 179 *"🇫🇷 Français · 🇵🇹 Português · 🇬🇧 English"*. Line 172 parenthetically clarifies *"(Pictos rendus par lucide-react, pas d'emoji.)"* — but this only covers TrustBar, not LangSwitcher's flag emojis, and reading order surfaces the conflict before the disclaimer. **Fix:** either remove emoji glyphs from the prose entirely and reference lucide-react icon names (`Lock`, `Shield`, `Scale`, `BadgeCheck`), or move the disclaimer ahead of the glyph list. For LangSwitcher specifically, decide explicitly: flag-emoji vs. SVG flag asset, then state it.

2. **Cross-reference syntax inconsistency.** Rubric expects `{path.to.token}` syntax in EXPERIENCE.md when referencing DESIGN tokens. EXPERIENCE *does* use this form inside `{components}` frontmatter chains (e.g. line 95 `focus-visible:ring-{colors.brand.primary}`), but in prose it drops the braces — e.g. line 148 *"fond `surface.page`, texte `text.primary`"*, line 206 *"`status.red.fg`"*, line 209 *"`status.amber`"*. These are clickable to a designer but break programmatic token resolution. **Fix:** wrap inline prose token refs in `{colors.surface.page}` form, or document the bare-backtick convention in Foundation.

3. **IA closure — Admin surface unjustified.** The mapping table (line 92) lists `/admin` with *"(Module Cabinet, story TBD)"*. The rubric requires every surface to have a justifying user story. **Fix:** either (a) flag this as [ASSUMPTION] and add to Open Questions, (b) add a story stub, or (c) gate `/admin` to Phase 2 explicitly so it doesn't count against MVP closure.

### Minor (nice-to-have)

4. **Flow 3 (Ana) climax exists but flow is explicitly out-of-MVP-scope.** Line 352 *"Hors-périmètre MVP — décrit pour cohérence IA Phase 2."* The Key Flows section is the MVP behavioral spine; including a Phase 2 flow dilutes the contract. **Fix:** move Flow 3 to an appendix `## Phase 2 — Cabinet flows (preview)` or tag the climax beat clearly with `[PHASE-2]`.

5. **DESIGN.md frontmatter has `shadows` and `motion` keys** (lines 135-149) that the rubric did not enumerate. Not wrong — they are load-bearing for `shadows.focus` / `shadows.card` references — but worth noting the spine has *exceeded* the canonical token list. Recommend keeping them but acknowledging in a Foundation note.

6. **No DESIGN.md "Open Questions" / `[ASSUMPTION]` annotations.** EXPERIENCE.md carries OQ-001…OQ-005, but DESIGN.md has zero `[ASSUMPTION]`, `[NOTE FOR UX]`, or open-question markers. The `Components` table does carry `À créer` status which functions as a soft TODO list — that partly closes the gap, but explicit assumption flags (e.g. *"Playfair Display loaded via Google Fonts — confirm self-host before launch"*) would harden the spine.

7. **Component count mismatch.** DESIGN.md Components table lists 13 components (line 240-254). EXPERIENCE.md Component Patterns specs 7 behavioral patterns (Wizard, FileDrop, ChatBubble, PdfPreviewPane, Timeline, TrustBar, LangSwitcher). The 6 unspecified ones (Button, Card, Badge, Input, ComplianceBadge, StatusPill) have no behavioral pattern. Most are atomic and self-explanatory, but `ComplianceBadge` and `StatusPill` carry semantic weight and would benefit from a behavioral note (e.g. "always paired with icon + label per a11y rule").

8. **Flow protagonists named but one flow re-uses Lucas twice.** Flow 1 and Flow 4 and Flow 5 are all *Lucas*. Reasonable narrative continuity, and Flow 4 explicitly says *"Lucas (de retour)"* — but with only 5 flows and 3 sharing a protagonist, the spine slightly under-represents persona diversity (Miguel = 1, Ana = 1 but Phase 2). **Fix:** consider adding a brief PME-side flow with Miguel for `/contracts` (a typical NDA-fournisseur flow), or split Lucas-bail into a separate persona.

9. **Climax beat conventions vary.** Flow 1 uses 🌟 emoji marker on step 7 ("🌟 Climax — Confirmation transmise"). Flows 2, 3, 4, 5 also use 🌟. The star emoji itself violates the no-emoji-in-UI rule — though Key Flows are spec-level, not UI prose, the convention drift is worth resolving (e.g. `**Climax —**` bolded prefix without the star glyph).

---

## Recommendations

1. **Resolve emoji policy contradiction in one pass:** replace all glyph emojis in TrustBar/LangSwitcher prose with lucide-react icon names. Audit Key Flows for the 🌟 markers and replace with `**Climax —**`. Update DESIGN.md `Don't` to clarify the rule applies to *runtime UI only*, not spec markup.

2. **Standardize token references in EXPERIENCE.md prose** by wrapping bare `surface.page` / `status.red.fg` references in braces (`{colors.surface.page}`). Document the convention in Foundation so future contributors mirror it.

3. **Close `/admin` IA gap**: either gate to Phase 2 explicitly (preferred — keeps MVP surface contract clean), or flag as `[ASSUMPTION] — admin surface scope deferred to Cabinet module spec` and add OQ-006.

4. **Move Flow 3 (Ana / Module B)** to a clearly labeled `## Phase 2 preview` subsection under Key Flows, or to an appendix. Preserves MVP scope discipline.

5. **Add `[ASSUMPTION]` markers in DESIGN.md** for font hosting (Google Fonts vs self-host), icon library version pin (lucide-react x.y), and dark-mode CSS-variable scaffolding presence. Hardens the spine before mocks consume it.

6. **Author behavioral notes for `ComplianceBadge` and `StatusPill`** in EXPERIENCE.md Component Patterns — both carry compliance semantics and a11y requirements (icon + label doubling, color-blindness coverage). The rest of the DESIGN.md Components table is fine to leave atomic.

7. **Consider a 6th Key Flow** with Miguel (PME) generating a contract — would balance B2C/PME representation and exercise the `/contracts` surface from the PME angle.

8. **Cross-link OQ-002** ("réalité du frontend existant") to the DESIGN.md sources list (`apps/frontend/src/styles/tokens.ts`, `globals.css`) — currently the OQ is orphan-floating.
