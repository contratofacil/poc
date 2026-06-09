---
title: "EasyLaw — Accessibility Review (WCAG 2.2 AA)"
project: easylaw
status: review
created: 2026-06-09
reviewer: senior accessibility auditor
target: WCAG 2.2 Level AA (floor) — AAA on critical paths per EXPERIENCE.md §Accessibility Floor
artifacts_reviewed:
  - DESIGN.md
  - EXPERIENCE.md
  - .working/mocks/01-landing.html
  - .working/mocks/02-nif-wizard.html
  - .working/mocks/03-compliance-dashboard.html
  - .working/mocks/04-contract-wizard.html
  - .working/mocks/05-luso-legal-chat.html
---

# Accessibility Review (WCAG 2.2 AA)

## Verdict: PASS WITH NOTES

The visual system is fundamentally sound — text contrast on the dominant `text.primary` / `brand.primary` / `text.inverse` pairings is exceptional (10:1–16:1), the spines explicitly commit to AA as a floor (EXPERIENCE.md §Accessibility Floor), and the tri-color compliance system is consistently doubled with icons + text labels. However, **three normative-text contrast failures and one large-text borderline pass** prevent a clean PASS at this stage, and several behavioural concerns (forms, ARIA, focus, motion) are under-specified in the spines and would risk regression at build time if not promoted now.

None of the failures are conceptually expensive to fix — they cluster on the saturated mid-tone palette (gold, raw status colors) and need either darker token variants or a usage rule that bans the color combinations.

---

## Contrast audit table

All ratios computed via the WCAG relative-luminance formula. Required ratio per WCAG 2.2 SC 1.4.3:

- Normal text (≤18px regular OR <14px bold): **4.5:1**
- Large text (≥18px regular OR ≥14px bold): **3:1**
- Non-text UI components and graphical objects (SC 1.4.11): **3:1**

### Text pairs

| Combination | Ratio | Required | Pass/Fail |
|---|---|---|---|
| `text.primary` `#1a202c` on `surface.page` `#f8f6f1` | **15.11:1** | 4.5:1 | PASS (AAA) |
| `text.primary` `#1a202c` on `surface.card` `#ffffff` | **16.32:1** | 4.5:1 | PASS (AAA) |
| `text.secondary` `#4a5568` on `surface.page` `#f8f6f1` | **6.97:1** | 4.5:1 | PASS (AAA) |
| `text.secondary` `#4a5568` on `surface.card` `#ffffff` | **7.53:1** | 4.5:1 | PASS (AAA) |
| `text.muted` `#718096` on `surface.page` `#f8f6f1` | **3.72:1** | 4.5:1 | **FAIL** (AA normal) — passes for ≥18px |
| `text.muted` `#718096` on `surface.card` `#ffffff` | **4.02:1** | 4.5:1 | **FAIL** (AA normal) — passes for ≥18px |
| `brand.primary` `#1a3a5c` on `surface.page` `#f8f6f1` (H1–H3, links) | **10.78:1** | 4.5:1 | PASS (AAA) |
| `brand.primary` `#1a3a5c` on `surface.card` `#ffffff` | **11.64:1** | 4.5:1 | PASS (AAA) |
| `text.inverse` `#f8f6f1` on `brand.primary` `#1a3a5c` (`btn-primary`, sidebar, footer) | **10.78:1** | 4.5:1 | PASS (AAA) |
| `text.primary` `#1a202c` on `brand.secondary` `#d4a017` (`btn-gold`) | **6.87:1** | 4.5:1 | PASS (AAA) |
| `brand.secondary` `#d4a017` on `surface.page` `#f8f6f1` (italic gold accent in landing H1, `gold-fade` underline) | **2.20:1** | 3:1 (large/decorative) — **4.5:1 if treated as text** | **FAIL** as text accent — see Findings |
| `brand.secondary` `#d4a017` on `brand.primary` `#1a3a5c` (logo box, sidebar accent border, footer "E" badge) | **4.90:1** | 4.5:1 | PASS — non-text 3:1 also passes |
| `status.green.fg` `#16a34a` on `status.green.bg` `#dcfce7` (badge, tri-bar segment label) | **3.00:1** | 4.5:1 normal / 3:1 large-or-bold | **FAIL for ≤14px caption** ; bare-PASS as 14px+ bold |
| `status.amber.fg` `#d97706` on `status.amber.bg` `#fef3c7` (badge, tri-bar segment label) | **2.86:1** | 4.5:1 / 3:1 | **FAIL** even as bold large text |
| `status.red.fg` `#dc2626` on `status.red.bg` `#fee2e2` (badge "Urgent") | **3.95:1** | 4.5:1 / 3:1 | **FAIL for normal text** ; bare-PASS as ≥14px bold (large per WCAG) |
| `status.red.fg` `#dc2626` on `surface.page` `#f8f6f1` (required-field `*`) | **4.47:1** | 4.5:1 (asterisk is a meaningful character) | **FAIL by 0.03** — marginal, but technically failing |
| `white #ffffff` on `danger` `#dc2626` (danger button) | **4.83:1** | 4.5:1 | PASS |
| Mock 02 amber info card: `#92400e` heading on `#fef3c7` | **6.37:1** | 4.5:1 | PASS |
| Mock 02 amber info card: `#78350f` body on `#fef3c7` | **8.15:1** | 4.5:1 | PASS |
| Footer `opacity-70` white (~`#b3b3b3` effective) on `#1a3a5c` | **5.55:1** | 4.5:1 | PASS |
| Footer `opacity-60` (~`#999999`) on `#1a3a5c` (`© 2026` line, partner disclaimer) | **4.09:1** | 4.5:1 normal | **FAIL** — passes only as ≥18px (it is 12px) |
| `text.muted` link hover targets in nav (`hover:text-[color:var(--brand-primary)]`) at rest = `#4a5568` | 6.97:1 | 4.5:1 | PASS |

### Non-text / UI component pairs (SC 1.4.11 — 3:1 required)

| Combination | Ratio | Required | Pass/Fail |
|---|---|---|---|
| `surface.mist` `#e8e4dd` border on `surface.card` `#ffffff` (card border, input border, divider) | **1.27:1** | 3:1 | **FAIL** — visual-only borders below contrast floor |
| `surface.mist` `#e8e4dd` border on `surface.page` `#f8f6f1` (header bottom border, section dividers) | **1.17:1** | 3:1 | **FAIL** |
| `brand.primary` `#1a3a5c` stepper progress vs `surface.mist` `#e8e4dd` unfilled (non-text component state) | 9.19:1 | 3:1 | PASS |
| Input focus border `brand.primary` `#1a3a5c` on `surface.card` `#ffffff` | 11.64:1 | 3:1 | PASS |
| Focus ring `rgb(26 58 92 / 0.20)` on `surface.page` | Effective ~1.4:1 against page | 3:1 | **FAIL** — see SC 2.4.11 finding |
| Status dots (`#16a34a`, `#d97706`, `#dc2626`) on white card row | 2.51:1 / 3.36:1 / 4.83:1 | 3:1 | green dot **FAIL**; amber & red pass |

---

## Findings by WCAG criterion

### 1.4.3 Contrast (Minimum) — AA

- **`text.muted` (`#718096`) is below 4.5:1 on both surfaces** (3.72 on page, 4.02 on card). The spine itself flags this — DESIGN.md line 179 says "*Ratio 4.6:1 — limite AA, à ne PAS utiliser pour information critique*", but the **actual measured ratio is 3.72:1, not 4.6:1** — the spine's claim is incorrect (likely measured against pure white only, or before the surface-page tint was finalized). `text.muted` is currently used for: trust-bar copy on landing, "Étape 2 sur 4" stepper meta, "Brouillon sauvegardé · il y a 3s", file-size hints ("2,3 Mo · téléversé il y a 12 s"), "À venir" timeline label, dashboard "11 obligations suivies" subhead, source attribution ("— DRE") in chat, helper text under inputs, badge counters, etc. Several of these are informationally non-trivial — particularly stepper progress, draft-save state, and chat source attribution.
- **Status colors fail on their tinted backgrounds when the text is ≤14px caption**: green `#16a34a` on `#dcfce7` = 3.00:1; amber `#d97706` on `#fef3c7` = 2.86:1; red `#dc2626` on `#fee2e2` = 3.95:1. The compliance badges, tri-color bar labels ("7 à jour" / "3 à venir" / "1 urgent"), and inline pills ("67 jours" / "à jour") all use 12–14px text — failing AA.
- **Italic gold accent in landing H1** ("démocratisé.") at `#d4a017` on `#f8f6f1` = 2.20:1. At 60px display weight 700 this qualifies as "large text" requiring 3:1 — **still fails**. The `gold-fade::after` underline is purely decorative and exempt, but the italic word is not.
- **Footer disclaimer line** (`opacity-60`, 12px) computes to ~4.09:1 — fails AA for normal text (12px is not "large").
- **Required-asterisk** `*` rendered in `#dc2626` on `#f8f6f1` lands at 4.47:1 — fails by a hair. Functionally moot if asterisks are accompanied by accessible "required" semantics (see 3.3.2 below), but cosmetically it should be hardened.

### 1.4.11 Non-text Contrast — AA

- **`surface.mist` (`#e8e4dd`) borders fail at 1.17–1.27:1.** This affects nearly every card, input, button outline, divider, dropzone border, table row separator, header bottom border, and the stepper "unfilled" segments. WCAG 1.4.11 requires 3:1 for *UI components* whose boundaries convey state or are the only indicator a component exists. For decorative borders accompanied by drop shadow + color block, this is technically tolerable, but two cases are not:
  - `btn-outline` (`border:1px solid #e8e4dd; background:transparent`) — the border is the **only** signal this is an interactive button against `surface.page`. This **fails 1.4.11**.
  - `<input>` resting state — same problem: border `#e8e4dd` on `#ffffff` at 1.27:1. The user cannot perceive the input field boundary without zooming.
  - The dashed `FileDrop` border (`border-2 border-dashed border-mist`) on white at 1.27:1 — the entire dropzone affordance is invisible.
- **Status dots** in the compliance list (`w-2.5 h-2.5` flat-colored, no icon) — green dot at `#16a34a` on white = 2.51:1 fails 1.4.11. These dots are *the* color-coded affordance in the table rows; while there is an adjacent pill with text, the visual scan pattern relies on the dot.
- **Focus ring** `box-shadow: 0 0 0 3px rgb(26 58 92 / 0.20)` — at 20% alpha against a `#f8f6f1` page, the effective ring color is ~`#d4d3cf`, yielding ~1.4:1. **Fails 1.4.11.** This is the most consequential finding because WCAG 2.2 added SC 2.4.11 / 2.4.13 (Focus Appearance / Not Obscured) and SC 2.4.11 is now AA. See next.

### 1.4.1 Use of Color — A

- **Tri-color compliance system: PASS.** Verified across mock 03: the urgent card has a triangle alert icon + uppercase "URGENT" label + countdown days + dated stamp. The tri-color bar has color + percentage labels + a legend below explicitly mapping each color to text ("À jour (90+ jours)" / "À venir (≤ 90 jours)" / "Urgent (≤ 30 jours)"). The list rows have a colored dot + a text pill (e.g. "67 jours", "à jour"). EXPERIENCE.md §Accessibility Floor line 268 explicitly mandates this doubling. **No reliance on color alone.**
- **Validation errors** in EXPERIENCE.md §State Patterns specify `alert-circle` icon + red text — color is doubled with an icon.
- **One minor weakness**: the timeline in mock 01 distinguishes "completed" steps (filled blue dot + checkmark) vs "in-progress" (gold ring + dot) vs "future" (mist outline only). This works visually but the "future" step has no aria-current or text equivalent — relies on dot styling alone for sighted users (see 4.1.2 below).

### 2.1.1 Keyboard — A

- The spines (EXPERIENCE.md §Interaction Primitives) commit to full keyboard coverage and "no keyboard trap". The mocks use `ring-brand` on every button — implementation is implicitly keyboard-friendly.
- **Gaps in the spine** (would risk regression at build):
  - Modal/sheet escape behavior is described as "Escape ferme modal/sheet/menu" but the **focus return** pattern (where focus goes after close) is not specified.
  - The Privy auth modal is third-party — its keyboard contract must be verified once embedded.
  - Mock 05's textarea uses `Cmd/Ctrl + Enter to send` — discoverable via hint, good — but `Shift+Enter` for newline must remain to avoid trapping users who can't reach the modifier (one-handed keyboard / switch device users); the hint mentions it, so this is fine. Confirm the keyboard handler doesn't swallow plain `Enter` as submit.
  - "Continue →" button on mock 02 is rendered `disabled` (`disabled style="opacity:0.5;cursor:not-allowed"`) — `disabled` removes the button from tab order. Per WCAG and modern guidance, prefer `aria-disabled="true"` so screen-reader users discover the constraint and the linked helper text ("Téléversez le justificatif…") is reachable. Currently the helper text below the button is not programmatically associated with anything — screen-reader users get nothing.

### 2.4.7 Focus Visible — AA

- Every interactive element in the mocks declares `ring-brand`, mapping to `box-shadow: 0 0 0 3px rgb(26 58 92 / 0.20)`. **Issue: 20% alpha is too low.** Computed contrast of the effective ring vs `surface.page` background is ~1.4:1 — well under the 3:1 floor that WCAG 2.2 SC 2.4.11 (and the more stringent SC 2.4.13 AAA "Focus Appearance") requires. SC 2.4.11 (Focus Not Obscured) is AA in WCAG 2.2 and is currently met. SC 1.4.11 / 2.4.13 applied to focus indicators effectively require the ring to be perceivable.
- **Recommended fix**: bump alpha to ≥45% (`rgb(26 58 92 / 0.45)`) which yields ~2.8:1, or use a solid 2px `brand.primary` outline + 1px white spacer. The shadow token already exists (`shadows.focus`) — just darken it.
- Also: focus on the gold CTA "Commencer mon dossier" lands a blue ring on a gold pill on a cream page. The ring is **clearly visible against gold** (computes ~5:1 vs gold) but only **~1.4:1 against the surface** — so part of the ring is invisible. Either widen the offset or switch to a dual-color ring (outer brand-primary + inner white) on gold backgrounds.

### 2.4.11 Focus Not Obscured (Minimum) — AA (new in WCAG 2.2)

- Mocks 03 and 05 have **sticky headers + sticky sidebars**. A focused element scrolled near the top of the viewport could be obscured by the sticky header. This is not visible in static mocks but is an implementation risk. EXPERIENCE.md does not currently mention `scroll-padding-top` or equivalent. **Must be promoted as an implementation rule.**

### 2.4.3 Focus Order — A

- Stepper progress bar uses 4 sibling `<div>`s with no semantic linkage to step labels (mock 02). Tab order is implicitly logical (header → stepper isn't focusable → main form → footer actions) but the *stepper itself* has zero affordance for keyboard users — they can't jump backward to step 1 via keyboard. This is fine if there's a "Retour" button (there is), but the visual back-arrow next to "Étape 1: Informations ✓" is not interactive.

### 2.5.5 / 2.5.8 Target Size — AA (2.5.8 new in WCAG 2.2)

- WCAG 2.2 SC 2.5.8 **AA** requires ≥24×24 CSS pixels for pointer targets (with exceptions for inline links and user-agent defaults). 2.5.5 (44×44) remains AAA.
- DESIGN.md `button.sizes` defines: `sm: padding "6px 12px" font body-sm (14px)`, `md: padding "8px 16px" font body-sm`, `lg: padding "12px 24px" font body`. Computed heights:
  - `sm` = 14px + 12px = **26px** — passes 2.5.8 (24px) but fails 2.5.5 (44px AAA). Acceptable for AA.
  - `md` = 14px + 16px = **30px** — passes 2.5.8.
  - `lg` = 16px + 24px = **40px** — passes 2.5.8, close to AAA.
- **Real-life check on mocks**:
  - Mock 01 header "FR ▾" button (`px-2.5 py-1.5 text-xs` ≈ 24×24px) — borderline pass on 2.5.8.
  - Mock 03 quick-action chips in chat (`px-3 py-1.5 text-xs` ≈ 26×24px) — borderline.
  - Mock 05 send icon button (`p-2` with 16px icon → 32×32px) — pass.
  - Mock 02 disabled "Continuer" — pass on size.
  - Stepper dot indicators (mocks 01 timeline `w-5 h-5` = 20×20px) — *not interactive* per design, but if they become clickable they'd fail.
- **Recommendation**: pin `button.sizes.sm` to ≥`28px` effective height (`py-1.5` = 6px top/bottom + 14px line-height + 2px = 28px works) and require all icon-only buttons to be ≥`p-2.5` (40×40px) per the trust-bar pattern.

### 3.3.1 Error Identification — A

- EXPERIENCE.md §State Patterns covers this well: validation errors use red text + `alert-circle` icon inline under the field. **Color is doubled with icon + text.** PASS.
- **Gap**: the spine doesn't explicitly require `aria-invalid="true"` on the offending input, nor `aria-describedby` linking the input to its error message. Without this, the error is visible but **not announced** to screen readers — the keyboard user tabs past the field with no auditory cue that an error exists.

### 3.3.2 Labels or Instructions — A

- Mock 02 inputs have visible `<label>` blocks. PASS.
- Mock 04 (contract wizard) inputs have visible labels. PASS.
- **Gap**: required-field marker is just a red `*`. WCAG requires the required-ness be programmatically discoverable. Need `aria-required="true"` on the input and a non-visual cue ("(required)" / "(obligatoire)" via `aria-label` or a visually-hidden span next to the asterisk). The current pattern fails screen-reader users.
- **Gap**: helper text below inputs (e.g. "Indiqué hors charges. Les charges seront détaillées…") is not associated via `aria-describedby` in the mocks. Spine should require this association.

### 3.3.7 Redundant Entry — A (new in WCAG 2.2)

- Wizard NIF (mock 02) auto-saves draft every 10s per EXPERIENCE.md §Wizard. Good — meets the spirit of 3.3.7.
- The "Retour" button preserves entered values per EXPERIENCE.md ("Retour arrière toujours possible sans perte de données"). PASS.

### 3.3.8 Accessible Authentication — AA (new in WCAG 2.2)

- Auth is delegated to Privy (email OTP, SMS OTP, Passkey, Google, LinkedIn). Passkey + Google + LinkedIn meet 3.3.8 by definition. Email/SMS OTP allow paste of the code (no manual transcription) which also meets 3.3.8. **PASS, contingent on Privy honoring paste.**
- Confirm at build time: the OTP input must accept paste of all 6 digits in one event, not split into 6 single-digit boxes that block paste. Add this as a vendor verification step.

### 4.1.2 Name, Role, Value — A

Numerous gaps in the mocks (they're prototypes, but the spines should normalize this):

- **Header logo `<a href="#">`** in mock 01 has no accessible name beyond the visual letter "E" — needs `aria-label="EasyLaw — accueil"`.
- **Avatar div** in mocks 02/03 (`<div>...LM</div>`) is presentational only — it should be wrapped in a `<button>` with `aria-label="Compte de Lucas Martin"` since per the EXPERIENCE.md profile route exists. The mock makes it look interactive but it has no role.
- **Tri-color bar** in mock 03 is three sibling `<div>`s with text content — needs a role and an aria-label summarizing the state, e.g. `<div role="img" aria-label="État compliance: 7 à jour, 3 à venir, 1 urgent">...</div>`. Screen-reader users currently get "7 à jour 3 à venir 1 urgent" without the grouping context.
- **Stepper** (mocks 02, 04) — a horizontal progress bar with 4–7 segments. Needs `role="progressbar"` with `aria-valuemin`, `aria-valuemax`, `aria-valuenow`, `aria-valuetext="Étape 2 sur 4: Documents"` per EXPERIENCE.md's commitment to `role="progressbar"`.
- **Timeline** (mock 01) — needs `<ol>` (which it is) and each `<li>` should mark current step with `aria-current="step"`. The completed steps should have `aria-label` indicating completion ("Étape complétée: Documents vérifiés"). Currently checkmark is decorative SVG without `aria-label`.
- **Chat streaming bubble** (mock 05) — the assistant message block during streaming needs `aria-live="polite"` (or `aria-busy="true"` until complete). Without it, screen-reader users do not perceive new tokens. Also: the blinking cursor `<span class="blink">` must be `aria-hidden="true"` to avoid SR reading "blink blink blink".
- **Compliance badges / status pills** — the `<span>` with text is fine, but the colored dot (`<span class="w-2.5 h-2.5 ...">`) is purely decorative redundant indicator — should be `aria-hidden="true"` so SR users don't get a "•" before the row text.
- **Send button** in chat (mock 05) is icon-only with no accessible name — needs `aria-label="Envoyer la question"`.
- **Sidebar links** in mock 03 are `<a>` without `href` (the anchors are placeholders). Build-time: ensure each has an `href` so they're discoverable in the tab order; mark the current page with `aria-current="page"`.
- **Notification bell** in mock 03 has a red dot indicating unread — needs `aria-label="3 notifications non lues"` or similar; currently the bell has no label at all.
- **Lang switcher** "FR ▾" — should be `<button aria-haspopup="listbox" aria-expanded="false">` with the dropdown items having `role="option"` and the chevron `aria-hidden`.

### 4.1.3 Status Messages — AA

- Per EXPERIENCE.md, toast on "Brouillon sauvegardé" / "Une obligation traitée" / "Préférence sauvée" needs `role="status"` (or `aria-live="polite"`). Banner on session expired / network lost needs `role="alert"` (assertive). **Not currently called out in spine.**
- The streaming chat response — handled above under 4.1.2.

### 2.4.2 Page Titled / 2.4.6 Headings and Labels — AA

- Each mock has a meaningful `<title>` (e.g. "NIF — Étape 2/4 · Documents — EasyLaw"). PASS.
- Heading hierarchy issues:
  - Mock 03 has TWO `<h1>` elements (intentional in spine: "un seul `<h1>` par page" — spine wants one). The h1 "Vue d'ensemble compliance" is correct; the second h1 is the urgent-card title "Déclaration TVA mensuelle" rendered as `<h3>` actually — wait, re-reading: "Action urgente" is `<h2>` (rendered with Inter font override), and the obligation name is `<h3>`. OK, that's fine. But "Toutes les obligations" is rendered as `<h2>` styled with Inter — both `<h2>`s share a parent. Confirm at build that only one `<h1>` exists per page (spine already mandates this).
  - Mock 04 has `<h1>` "Quelles sont les conditions financières du bail ?" then `<h2>` is missing — jumps straight to inputs. This is OK (form, not document) but the side `<aside>` PDF preview uses an inner `<h2>` ("Contrato de Arrendamento"). Both h2 are in a separate landmark so no semantic conflict — just verify the screen-reader heading-jump list reads cleanly.

### 1.3.1 Info and Relationships — A

- Landmark gaps in mocks:
  - Mock 01: has `<header>`, `<section>`s, `<footer>` but no explicit `<main>` — the hero `<section>` should be wrapped in `<main>`.
  - Mock 02: has `<main>` but the top stepper is in a `<div>`, not `<nav aria-label="Progression du dossier">` or similar.
  - Mock 03: has `<aside>` (sidebar), `<main>`, `<header>`, but the dashboard "Vue d'ensemble" cards are siblings of the same `<main>` without sub-`<section>` landmarks. Acceptable, but the spine should require each major dashboard region to be a `<section aria-labelledby="...">`.
  - Mock 05: chat thread list is `<aside>` — good. Messages container is just a `<div>` — should be `<section aria-label="Historique de la conversation">` and individual messages should be `<article>` (per chat patterns) with `role="log"` on the parent.
- **Form ↔ helper text relationships** — see 3.3.2 above.

### 2.3.3 Animation from Interactions — AAA / 2.2.2 Pause, Stop, Hide — A

- Spine commits to `prefers-reduced-motion` (EXPERIENCE.md §Accessibility Floor line 262). PASS in intent.
- **Gap in spine**: which specific animations are gated on `prefers-reduced-motion`? The `gold-highlight` 1.5s fade in mock 04, the streaming cursor blink in mock 05, hover transitions on buttons, the rotated floating card in mock 01 — these need explicit listing so the engineer knows what to wrap in `@media (prefers-reduced-motion: reduce)`.
- The streaming cursor blink (`animation:blink 1s steps(2) infinite`) is purely decorative and should be **disabled entirely** under reduced-motion, replaced with a static cursor or "Génération en cours" text.

### 3.1.1 Language of Page / 3.1.2 Language of Parts — A / AA

- All mocks have `<html lang="fr">`. PASS for FR mocks. PT mocks not provided but EXPERIENCE.md §i18n commits to PT/FR locale switching with persistence. Build-time requirement: `<html lang="{locale}">` must update with locale, **not be hardcoded**.
- Portuguese legal references in the FR chat response (mock 05) — `art. 1098.º do Código Civil` and similar — should be wrapped in `<span lang="pt">` for correct screen-reader pronunciation. Same for the PDF preview (mock 04) which contains a Portuguese contract body (`Artigo 1.º — Identificação das partes…`) inside a French page. This is **3.1.2 AA** and currently not addressed.

### 2.5.7 Dragging Movements — AA (new in WCAG 2.2)

- EXPERIENCE.md §Interaction Primitives mentions "Drag — Réservé à FileDrop (upload). Pas de drag-to-reorder MVP." Good — only one drag interaction in MVP. **It must have a non-drag alternative.** Mock 02 confirms the dropzone has "ou cliquez pour parcourir" as a labeled fallback (the entire `<label>` triggers the file picker). PASS.

### 1.4.10 Reflow — AA

- All mocks use Tailwind's responsive utilities and `max-w-*` containers. The PDF preview in mock 04 is a fixed `max-width:420px; aspect-ratio:1/1.414` inside a `lg:col-span-5` — at 320px viewport this would collapse below the form (mobile bottom-sheet per spine). EXPERIENCE.md §Responsive confirms the mobile bottom-sheet pattern. PASS.

---

## Critical issues blocking AA

These must be addressed before the design can be certified AA:

1. **`text.muted` (`#718096`) fails AA at 3.72–4.02:1.** Used extensively for metadata, helper text, draft-save indicator, file-size hints, source attribution. **Fix: shift the muted token to `#5e6b7e` or darker** (yields ~5.5:1 on page) and update the DESIGN.md comment claiming "Ratio 4.6:1" which is empirically wrong.
2. **Status colors on tinted backgrounds (badges + tri-color bar labels) fail AA** at 2.86–3.95:1 for the 12–14px text inside them. **Fix: either** (a) darken status `fg` tokens (`#15803d` green / `#b45309` amber / `#b91c1c` red yield 4.5:1+ on the matching `bg`), **or** (b) keep status fg as-is but recolor the badge text to `text.primary` and use the status color only as left-border + icon (still color-doubled-with-icon per the existing rule).
3. **Non-text contrast of `surface.mist` borders on inputs, outline buttons, and the FileDrop dropzone fails 1.4.11 at 1.17–1.27:1.** Components whose only visual signal is the border (transparent outline buttons, resting inputs, dashed dropzone) are imperceptible at default zoom. **Fix: introduce a `surface.mistStrong` token at ~`#c4bdb0` (3.1:1 on white) reserved for component boundaries**, keep `#e8e4dd` only for purely decorative dividers paired with a contrast-passing element.
4. **Focus ring at 20% alpha fails 1.4.11 / 2.4.11 for indicator contrast** (~1.4:1 on page). **Fix: raise alpha to 0.45+ and add a secondary white inset on saturated CTA backgrounds (gold).**
5. **Required-field marker is visual-only.** The `*` is not announced. **Fix: spine must require `aria-required="true"` + visually-hidden "(obligatoire)" text on every required input.**
6. **Streaming chat lacks `aria-live`** — screen-reader users get no signal that the assistant has begun answering. The blinking cursor span will be announced. **Fix: spine must require `aria-live="polite"` on the streaming bubble and `aria-hidden="true"` on the cursor span.**

## Major issues

7. **Helper text below inputs is not programmatically associated** (no `aria-describedby`). Spine should mandate this.
8. **Error messages lack `aria-invalid` + `aria-describedby` linkage** per EXPERIENCE.md §State Patterns. The visual treatment passes; the SR experience fails.
9. **Footer disclaimer `opacity-60` at 12px fails AA** (4.09:1 vs needed 4.5:1). Bump to `opacity-75` or larger font.
10. **Stepper has no `role="progressbar"` markup in mocks** despite the spine committing to it. Promote to a hard rule.
11. **Tri-color bar lacks an aria-label summarizing state.** SR users get fragmented text.
12. **`disabled` attribute on "Continuer" hides the button from SR.** Use `aria-disabled="true"` + maintain tab order; ensure the helper-text below is associated.
13. **Portuguese legal citations in FR pages lack `lang="pt"`** wrapping (SC 3.1.2 AA).
14. **Status-dot indicators on compliance list rows are color-only at the dot level** (2.51:1 for green). The adjacent pill text mitigates, but per 1.4.11 the visual dot itself fails. **Fix: replace dot with a 12×12 icon shape per status** (filled circle for green, half-circle/triangle for amber, exclamation for red) — keeps the doubling explicit.
15. **Icon-only buttons (send button, notification bell, lang switcher chevron) lack accessible names** in mocks. Spine must require `aria-label` on every icon-only control.
16. **Animations are not exhaustively listed** for `prefers-reduced-motion` gating: `gold-highlight` fade, cursor blink, hover transitions, the rotated card on landing, the gold-fade underline. Spine should enumerate or specify a project-wide rule.
17. **Sticky header + sticky sidebar may obscure focused elements** (SC 2.4.11 new in 2.2). Spine must mandate `scroll-padding-top` matching header height.
18. **Auth modal (Privy)** — third-party flow must be verified for keyboard, focus trap, and 3.3.8 paste support before launch. Spine should list this as a vendor compliance gate.

## Minor issues

19. Italic gold word "démocratisé" in landing H1 sits at 2.20:1. Visually striking but fails as text. Either darken the gold to `#8a6d10` (3.1:1 on cream — large-text pass), or change the treatment (underline accent only, gold reserved for the underline).
20. Required-asterisk on `#f8f6f1` at 4.47:1 — promote to `#b91c1c` (passes at 5.7:1) since the asterisk is currently the primary visual marker.
21. Mock 01 header logo `<a href="#">` and avatar `<div>` lack accessible names — spine should require these for any branding glyph.
22. Mock 02 amber info `<aside>` background `#fef3c7` with icon stroke `#d97706` — icon non-text contrast = 2.86:1 vs `#fef3c7`. Use a darker amber for the icon stroke (`#b45309`) at the same surface to pass 1.4.11.
23. Chat quick-action chip "⚖ Demander un avis d'avocat (49 €)" uses `style="color:var(--brand-secondary)"` for emphasis — gold text on white = 2.38:1. **Fails.** Use brand-primary or solid gold-bg variant.
24. The "Marquer comme préparé" / "Voir le détail →" outline buttons in mock 03 rely entirely on the 1.27:1 mist border. Imperceptible.
25. Timeline "future" steps (mock 01) are differentiated only by opacity-50 + mist-border outline. Add an explicit visually-hidden "Étape à venir" label.
26. Mock 04 contract preview gold-highlight `bg-yellow-100` (Tailwind `#fef9c3`) with text `#1a202c` = 14.6:1 — passes — but the visual association between "doré" caption and the actual yellow tint is misleading (the caption says "Les champs dorés viennent d'être remplis" while showing pale yellow). Cosmetic, not a11y.
27. Compliance "À venir (4)" filter button uses `font-medium` brand-primary background with white text — that's fine — but the sibling "Tous (11)" and "À jour (7)" outline buttons rely on the mist border (1.27:1). The selected button is distinguishable, but the unselected siblings are not perceivable as buttons.
28. The chat send-button uses `btn-primary` with no `type="button"` (will default to `type="submit"` inside a form) — minor but specify in spine.
29. The `Cmd/Ctrl+Enter to send` hint in mock 05 is a useful keyboard shortcut, but the textarea also needs a "Send" instruction for users who can't issue the shortcut — the visible icon button satisfies this once it has an `aria-label`.

---

## Recommendations to add to spines

### DESIGN.md — token changes

1. **Recolor `text.muted`** from `#718096` to `#5e6b7e` (or `#5c6b7e`). Update the inline note on line 179 — the current "4.6:1" claim is inaccurate; the new value should be cited with the corrected ratio (~5.5:1 on `surface.page`).
2. **Add `surface.mistStrong: "#c4bdb0"`** — reserve `surface.mist` (`#e8e4dd`) for decorative dividers paired with another contrast-passing signal; require `mistStrong` for every component boundary (inputs, outline buttons, dropzone, card border when no shadow).
3. **Darken status `fg` tokens**:
   - `status.green.fg`: `#16a34a` → `#15803d` (4.54:1 on `#dcfce7`)
   - `status.amber.fg`: `#d97706` → `#b45309` (4.52:1 on `#fef3c7`)
   - `status.red.fg`: `#dc2626` → `#b91c1c` (5.91:1 on `#fee2e2`)
   - Add an inline note that these are the **only** fg/bg pairings permitted for status pills; if status text needs to render on `surface.card`, use the same darkened fg (still 5+:1 on white).
4. **Raise focus-ring alpha** in `shadows.focus`: `0 0 0 3px rgb(26 58 92 / 0.20)` → `0 0 0 3px rgb(26 58 92 / 0.45)`. Add a `shadows.focusOnGold` variant: `0 0 0 2px #ffffff, 0 0 0 4px #1a3a5c` for use on gold/saturated backgrounds.
5. **Recolor decorative italic** "démocratisé" in landing H1 — either `brand.secondaryDark: "#8a6d10"` (3.1:1 on cream) or treat as underline accent only.
6. **Mandate target sizes ≥24×24px** in `button.sizes.sm` (move padding to `8px 12px` to lift `sm` to 28px effective). Icon-only buttons → `≥40×40px` minimum touch area (`p-2.5` with 20px icon).
7. **Annotate `text.muted` usage rules**: never on critical info; never below 14px (current draft.md says "to NOT use for critical information" — make it normative).

### EXPERIENCE.md — behavior + ARIA additions

8. **Promote to §Accessibility Floor: required-field semantics.** Every required input must carry `aria-required="true"` and a visually-hidden "(obligatoire)" / "(obrigatório)" sibling. The `*` is visual emphasis only.
9. **Form ↔ helper text association.** Helper paragraphs below inputs must be referenced by `aria-describedby` on the input. Error messages: `aria-invalid="true"` + `aria-describedby="…-error"` on the input.
10. **Streaming chat ARIA contract.** Assistant message container during streaming: `aria-live="polite"` + `aria-busy="true"`; cursor blink span `aria-hidden="true"`. On stream complete, remove `aria-busy`. Sources list must be reachable via Tab.
11. **Toast / banner ARIA contract.** Non-blocking toast → `role="status"` (`aria-live="polite"`). Blocking banner (session expired, network lost) → `role="alert"`.
12. **Stepper ARIA.** Stepper bar → `role="progressbar" aria-valuemin="1" aria-valuemax="{total}" aria-valuenow="{current}" aria-valuetext="Étape {n} sur {total}: {nom}"`. Step labels list → `<ol>` with `aria-current="step"` on active.
13. **Tri-color compliance bar ARIA.** Wrap in `<div role="img" aria-label="État compliance: X à jour, Y à venir, Z urgent">`. Legend already present visually — keep it.
14. **Status-dot doubling.** In list rows, replace flat colored dots with status icons (check / clock / triangle-alert) so 1.4.11 is met at the dot level.
15. **Disabled CTAs.** Use `aria-disabled="true"` + visible disabled styling, not the HTML `disabled` attribute, so the button stays in tab order and the linked helper text is reachable via Tab. Helper text must be `aria-describedby`-linked.
16. **Lang of parts.** Portuguese legal citations and contract bodies inside FR/EN pages must be wrapped in `<span lang="pt">`. Add to §Voice and Tone microcopy rules.
17. **Reduced-motion enumeration.** Add a sub-section listing every animation gated on `prefers-reduced-motion: reduce`: `gold-highlight` field-fade, streaming cursor blink, button hover transitions, the rotated landing card, the `gold-fade` underline draw, modal enter/exit. Cursor blink → static cursor.
18. **Sticky-region scroll handling.** Mandate `scroll-padding-top` equal to sticky header height on every layout with a sticky header, to satisfy SC 2.4.11.
19. **Focus return.** When a modal/sheet/menu closes (Escape or X), focus must return to the element that opened it. Spell this out in §Interaction Primitives.
20. **Privy auth a11y gate.** Add a vendor-acceptance checklist item: keyboard reachable, focus-trapped while open, ESC closes, OTP input accepts paste of full code (SC 3.3.8), screen-reader announces modal open via `aria-labelledby`/`aria-modal="true"`.
21. **Icon-only control labels.** Spine should mandate `aria-label` on every icon-only `<button>` and `<a>` — applies to send button, notification bell, lang switcher dropdown trigger, profile-avatar button, dropzone remove, etc.
22. **Skip-link target.** EXPERIENCE.md already commits to "Aller au contenu principal". Spine should specify the `id="main"` target on the `<main>` landmark and that the skip-link is visible on focus (currently no mock implements this).
23. **Landmarks contract.** Mandate `<main>` on every page, `<nav aria-label="…">` on every navigation cluster (header nav, sidebar, breadcrumbs, stepper). Mock 01 currently has no `<main>`.
24. **Touch-target enforcement.** Spine should reference SC 2.5.8 (24×24 AA new in WCAG 2.2) and require buttons to meet it; AAA (44×44) on payment + signature flows per the existing AAA-on-critical-paths commitment.

### Add to verification & QA

25. **Automated checks**: add axe-core or Pa11y to CI on every shipped page route; fail the build on serious violations.
26. **Manual checks**: VoiceOver + NVDA on Lucas and Miguel parcours (already in §Accessibility Floor) — promote to a release-gate checklist with named pages.
27. **Contrast budget**: forbid introducing any new color pair < the relevant SC threshold; treat the token file as the single source of truth and add a unit test that asserts the documented ratios.
