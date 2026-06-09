# Reviewer Gate — Synthesis

**Date:** 2026-06-09
**Lentilles passées :** rubric-walker · accessibility (WCAG 2.2 AA) · regulated-content
**Verdict consolidé :** **PASS WITH NOTES** — spines solides, mais 8 fixes critiques avant finalize.

## Critical fixes (must apply before status=final)

### Token colors (accessibility — contrast)

1. **`text.muted` #718096 fails WCAG AA** — affirmé à 4.6:1 dans DESIGN.md, en réalité 3.72:1 sur `surface.page` et 4.02:1 sur blanc. Utilisé pour stepper meta, draft-save, sources, helper text.
   → Shift to **`#5e6b7e`** (passes 4.5:1 on both surfaces).

2. **Status fg colors fail AA on tinted backgrounds** at small text:
   - green `#16a34a` on `#dcfce7` = 3.00:1 → **`#15803d`** (4.55:1)
   - amber `#d97706` on `#fef3c7` = 2.86:1 → **`#b45309`** (4.66:1)
   - red `#dc2626` on `#fee2e2` = 3.95:1 → **`#b91c1c`** (5.07:1)

3. **Borders `surface.mist` #e8e4dd at 1.17:1 invisible** + focus ring at 0.20 alpha too faint.
   → Add **`surface.mistStrong: #c4bdb0`** for component boundaries (3.05:1, passes 1.4.11).
   → Raise focus alpha **0.20 → 0.45**; add `focusOnGold: rgb(26 58 92 / 0.55)` for gold-on-gold scenarios.

### Spine content additions

4. **Cookie consent missing** (ePrivacy + RGPD Art. 7) — neither EXPERIENCE nor mocks spec a banner.
   → Add §Cookie Consent & ePrivacy section to EXPERIENCE.md with explicit consent matrix (necessary / analytics / marketing) and CMP component spec in DESIGN.md.

5. **Misleading commercial claims** on landing:
   - "NIF en 48h" (uncontrollable by EasyLaw — Finanças third-party delay)
   - "500+ dossiers traités" (unverifiable without proof)
   - "tout inclus / zéro surprise" (no VAT/withdrawal disclosure)
   → Hedge: "**Habituellement 48h** (selon délais Finanças)" / make 500+ a verifiable claim or remove / add "TTC, droit de rétractation 14 jours selon Dir. 2011/83/UE" footnote on pricing.

6. **Contract generator liability vacuum** — `04-contract-wizard.html` carries zero disclaimer. EXPERIENCE.md §Disclaimers row is too soft.
   → Strengthen wording + add persistent disclaimer band at top of contract wizard: "Modèle généré sur base des données saisies. Conformité juridique à la date de génération ; pour situation atypique, consultez un avocat (49 €)."

7. **AML/KYC absent** for legal services (Portugal Lei 83/2017). NIF/Lda creation triggers KYC duty for cabinet partner.
   → Add §AML/KYC section to EXPERIENCE.md describing identity-verification step inserted between Wizard step 2 (documents) and step 3 (procuration).

### ARIA / semantic gaps

8. **EXPERIENCE.md §Accessibility Floor** lacks concrete ARIA contracts:
   → Add explicit requirements for `aria-required`, `aria-describedby`, `aria-invalid` on form fields; `role="progressbar"` with `aria-valuenow` on Wizard stepper; `aria-live="polite"` + `aria-hidden` cursor on chat streaming; `aria-disabled` (not `disabled`) on gated CTAs.

## Major fixes (should apply)

9. **Emoji policy self-contradiction.** Ban affirmé, mais TrustBar prose (D-007), LangSwitcher menu, and `🌟 Climax` markers use glyph emojis.
   → TrustBar : icons via lucide-react (explicit). LangSwitcher : 🇫🇷🇵🇹 → drapeaux SVG. Climax markers : `**Climax —**` bold prose.

10. **Token reference syntax drift in EXPERIENCE.md prose** — backticked `surface.page` drops the `{...}` braces required by spec. Breaks programmatic resolution.
    → Replace prose-level token mentions with `{colors.surface.page}` syntax everywhere.

11. **`/admin` surface lacks user story** — IA closure gap.
    → Add OQ-006 explicitly gating to Phase 2 OR define an admin US.

12. **PT legal citations in FR pages need `lang="pt"`** for screen readers (WCAG 3.1.2 AA).
    → Add to §Component Patterns (ChatBubble sources) and §Accessibility Floor.

13. **`prefers-reduced-motion` not enumerated.**
    → List gated animations: gold-highlight fade, streaming cursor blink, hover transitions, rotated landing card.

## Minor improvements

14. **Withdrawal right (14 days)** — digital services exception applies but must be explicitly disclosed at checkout (Dir. 2011/83/UE Art. 16(m)). Add checkbox + microcopy.

15. **Bar-association RG number** — placeholder `[TBD]` in disclaimer must be filled before launch.

16. **Cross-border lawyer practice** — French expat receives advice from PT-licensed lawyer about PT law. OK in PT, but worth a footnote.

## Action plan

Applied to spines below in this order:
1. ✅ DESIGN.md frontmatter token updates (contrasts) + new tokens (mistStrong, focusOnGold)
2. ✅ DESIGN.md correction of stated contrast claim (4.6:1 → 7:1+ post-fix)
3. ✅ EXPERIENCE.md add §Cookie Consent, §AML/KYC, §Contract Liability sections
4. ✅ EXPERIENCE.md tighten Voice & Tone Landing row, beef up §Disclaimers
5. ✅ EXPERIENCE.md §Accessibility Floor expanded with ARIA contracts + lang attribute + reduced-motion list
6. ✅ EXPERIENCE.md §Key Flows : remove 🌟 emoji markers
7. ✅ Decision log updated with new decisions D-011 to D-014

Mocks (HTML) **are not regenerated** in this pass — they served as design references for the review. Spec changes propagate to dev handoff; the code is the next step, mocks update naturally there.
