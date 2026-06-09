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

### P2 — Landing publique `/` ✓ *SHIPPED 2026-06-09 — `feat/p2-landing-page` merged to main*

**Reference :** [01-landing.html](../planning-artifacts/ux-designs/ux-easylaw-2026-06-09/.working/mocks/01-landing.html)

**Delivered :** `app/page.tsx` + `TrustBar`, `SiteHeader`, `SiteFooter`, `HeroNifCard`, i18n FR+PT inline, 7 sections. WCAG AA. `spec-p2-landing-page.md` status: done.

---

### P3 — Compliance Dashboard `/compliance` ✓ *SHIPPED 2026-06-09 — `feat/p3-compliance-dashboard` merged to main*

**Reference :** [03-compliance-dashboard.html](../planning-artifacts/ux-designs/ux-easylaw-2026-06-09/.working/mocks/03-compliance-dashboard.html)

**Delivered :** `AppShell`, `AppSidebar`, `AppTopBar`, `ComplianceStatusBar`, `ObligationCard`, `ObligationListItem` + `compliance/page.tsx`. Mock data typée 11 obligations. WCAG AA. `spec-p3-compliance-dashboard.md` status: done.

**Régression temporaire :** add/delete/toggle obligations + email alerts log retirés — déférés à P3.5 ci-dessous.

---

### P3.5 — Re-wiring backend `/api/compliance` to P3 components ✓ *SHIPPED 2026-06-09*

**Context :** P3 remplace la page `/compliance` par un visual-first dashboard avec mock data. L'API `/api/compliance` existe toujours côté backend mais n'est plus connectée au frontend.

**Scope :**
- Remplacer `MOCK_OBLIGATIONS` par un fetch `GET /api/compliance` dans `apps/frontend/src/lib/compliance/`.
- Réintégrer les fonctionnalités CRUD retirées en P3 : formulaire "Ajouter une obligation" (CTA `+` dans le Hero), toggle "Marquer comme préparé" sur `ObligationCard`, suppression avec confirmation.
- Réintégrer le log "Email alerts" (affiché en section distincte sous la liste, comme dans la page originale).
- Connecter `ObligationCard` CTAs à des actions réelles (`onPrepare` → wizard P3.5, `onMarkPrepared` → PATCH, `onViewDetail` → modal ou sous-route).
- AML/KYC step (D-013) : sélection eIDV provider + intégration wizard.

**Files à modifier :**
- `apps/frontend/src/lib/compliance/mockData.tsx` → remplacer par hook `useCompliance()` avec SWR/fetch
- `apps/frontend/src/app/compliance/page.tsx` → connecter aux callbacks réels
- `apps/frontend/src/components/compliance/ObligationCard.tsx` → activer CTAs
- `apps/frontend/src/components/compliance/ObligationListItem.tsx` → activer click handler

**Dépend de :** auth Privy stable + `/api/compliance` endpoint opérationnel.

**Delivered :** `api.ts`, `useCompliance()`, `AddObligationModal`, `ObligationDetailModal`, `EmailAlertsLog`, `EidvProviderSelector` + page/card wiring. CRUD + alertes email reconnectés. `spec-p3.5-backend-rewiring.md` status: done.

---

### P4 — Cookie Consent CMP ✓ *SHIPPED 2026-06-09 — merged to main with P1+P2*

**Delivered :** `ConsentBanner`, `ConsentFooterLink`, `consent/context.tsx`, `consent/cookie.ts`, `consent/i18n.ts`, `/legal/cookies/page.tsx`. Cookie `easylaw_consent_v1`, 4 catégories, CNIL-compliant (boutons Accept/Reject équivalents). `spec-p4-cookie-consent.md` status: done.

---

### P4-ORIG — Cookie Consent CMP *(original deferred note — superseded above)*

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
