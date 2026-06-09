# Deferred Work

Goals split out of multi-goal intents and queued for future spec creation. Created/maintained by `bmad-quick-dev`.

---

## 2026-06-09 — P1 step-04 review notes (deferred from PR)

### Status badge borders fail 1.4.11 against `surface.page` (latent bad_spec) *(deferred)*

**Finding source :** Acceptance Auditor iteration 2 of spec-p1-tokens-aa.md.

**Context :** Le P1 spec frontmatter affirme que `status.{green,amber,red}.border` doivent atteindre ≥3:1 (WCAG 1.4.11). Les valeurs choisies (`#86efac`, `#fcd34d`, `#fca5a5`) calculent à ~1.3–1.8:1 contre `surface.page` (#f8f6f1).

**Pourquoi déféré :**
- Ambiguïté de scope dans le spec : 1.4.11 mesure habituellement contre la couleur adjacente. Si on considère le badge comme une unité visuelle (border vs page), ça échoue. Si on considère border vs badge bg interne, ça passe.
- Darker ces borders (e.g. `#16a34a` pour green) changerait significativement l'esthétique "soft pastel chip" actuelle — décision design à arbitrer, pas une simple correction de token.
- Le persona "Miguel sur Compliance Dashboard" comprend de toute façon le statut par la couleur fg + le label texte ; le border est secondaire.

**À faire dans un sprint dédié :**
1. Décider du référentiel : border vs page (strict 1.4.11) OU border vs badge-bg (esthétique pastel preservée).
2. Si on retient strict 1.4.11, darker les 3 borders et tester l'impact visuel sur mocks 03-compliance-dashboard.
3. Mettre à jour le mapping `complianceBadgeClass` + DOT_COLOR.

**Reference :** review iteration 2 finding, computed ratios :
- `#86efac` vs `#f8f6f1` ≈ 1.30:1
- `#fcd34d` vs `#f8f6f1` ≈ 1.32:1
- `#fca5a5` vs `#f8f6f1` ≈ 1.76:1

---

## 2026-06-09 — UX foundation pipeline (intent: "Le site internet EasyLaw doit être codé")

Original intent contained 4 priorities. Scope narrowed to P1 only; P2/P3/P4 deferred to separate specs after P1 ships.

### P2 — Landing publique `/` *(deferred)*

**Reference :** [01-landing.html](../planning-artifacts/ux-designs/ux-easylaw-2026-06-09/.working/mocks/01-landing.html)

**Scope :**
- Page `app/page.tsx` (route `/`) — hero, 4 features cards, "Comment ça marche" 3-steps, partnership section O&C, footer.
- Composant `<TrustBar />` à factoriser dans `apps/frontend/src/components/ui/`.
- Hedger les claims marketing : « 48h » → « habituellement 48h » ; « 500+ dossiers » → flag verifiability (OQ-008).
- i18n FR + PT via traductions inline (migration `next-intl` = OQ-001, différée).

**Acceptance criteria :**
- WCAG 2.2 AA respecté
- Pas d'emoji dans la UI (icons `lucide-react`)
- Citations `<span lang="pt">` autour des références PT
- Mobile-first responsive (375px → 1280px+)

**Estimated complexity :** Medium (~3-4h dev incl. tests E2E Playwright sur les CTAs)

---

### P3 — Compliance Dashboard `/compliance` *(deferred)*

**Reference :** [03-compliance-dashboard.html](../planning-artifacts/ux-designs/ux-easylaw-2026-06-09/.working/mocks/03-compliance-dashboard.html)

**Scope :**
- Page `app/compliance/page.tsx` (route authentifiée).
- Sidebar shell réutilisable (composant `<AppShell />`).
- Tri-color status bar.
- "Action urgente" card.
- List view des obligations avec filtres (Tous / À venir / À jour).
- Composant `<ComplianceBadge status={"green"|"amber"|"red"} />` à factoriser.

**Acceptance criteria :**
- Status tri-couleur jamais reposant seul sur couleur (icon + label obligatoires)
- Garde de route (auth Privy) sur la route
- États : empty (« Aucune obligation surveillée »), loading skeleton, error
- WCAG 2.2 AA

**Estimated complexity :** Medium-large (~4-6h dev — sidebar shell + dashboard + data fetching wired to backend)

**Dépend de :** auth Privy en état stable (cf. branche actuelle `fix/auth-and-api-url`).

---

### P4 — Cookie Consent CMP *(deferred — mais bloquant pour mise en ligne publique)*

**Reference :** EXPERIENCE.md §Cookie Consent & ePrivacy (D-012)

**Scope :**
- Composant `<ConsentBanner />` global, monté dans `apps/frontend/src/app/layout.tsx`.
- 4 catégories : Nécessaires (forcé) / Analytique / Marketing / Personnalisation (les 3 dernières opt-in).
- Accept/Reject à équivalence visuelle (pas de dark pattern asymétrique).
- Persistance cookie 12 mois ; re-consent au-delà.
- Lien permanent footer « Gérer mes cookies » qui rouvre le banner.
- Mention ePrivacy + RGPD Art. 7 dans le banner.

**Acceptance criteria :**
- Aucun cookie non-nécessaire écrit avant consentement
- Banner persiste sa décision (test : refresh → pas de reprompt)
- Accessible clavier complet (Tab order + Escape ferme)
- Choix révisable depuis footer

**Estimated complexity :** Small (~2h dev — composant relativement standalone)

**Priorité d'exécution :** **À reprendre en premier après P1** car légalement bloquant pour mise en ligne publique (CNPD/CNIL enforcement immédiat).
