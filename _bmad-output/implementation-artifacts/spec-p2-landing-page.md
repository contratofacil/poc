---
title: 'P2 — Landing publique `/` (from mock 01-landing.html)'
type: 'feature'
created: '2026-06-09'
status: 'done'
baseline_commit: '4d0dbed'
context:
  - 'apps/frontend/AGENTS.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-easylaw-2026-06-09/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-easylaw-2026-06-09/EXPERIENCE.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-easylaw-2026-06-09/.working/mocks/01-landing.html'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem :** L'actuel `app/page.tsx` est une welcome card minimaliste (logo + 1 CTA) qui rate complètement le job d'une homepage publique : convertir des expatriés/PME, expliquer l'offre, instaurer la confiance, exposer le partenariat O&C. Stack de tokens utilise encore des hex legacy (#FAFAF8, #1A365D...) non-alignés avec les tokens AA de P1.

**Approach :** Réécrire `page.tsx` en RSC en suivant fidèlement le mock 01-landing.html (7 sections : header sticky → hero → 4-features grid → "comment ça marche" → partenariat O&C → CTA final → footer). Factoriser 3 composants réutilisables : `<TrustBar />`, `<SiteHeader />`, `<SiteFooter />`. Le footer intègre `<ConsentFooterLink />` (livré en P4). Hedge les claims marketing per regulated-content review. FR-only au début, PT déferré sauf si trivial à inliner.

## Boundaries & Constraints

**Always :**
- **i18n FR + PT inline dès le MVP** (choix utilisateur 2026-06-09). Pattern : un dict inline (`i18n.ts`) avec clés `fr` + `pt` ; lecture du `lang` côté client via `document.documentElement.lang` (même pattern que `ConsentBanner` de P4). **Conséquence acceptée** : la landing devient un Client Component (`'use client'`). Server-render PT (default `<html lang="pt">`) puis client substitue en FR si lang === "fr". SEO : Google lit le rendu serveur PT — acceptable, marché principal.
- Réutiliser les sous-composants en mode mixte : `SiteFooter` peut rester client (déjà contient `ConsentFooterLink` client) ; `SiteHeader` client (langSwitcher stub + besoin du i18n) ; `TrustBar` peut être server (labels passés en props).
- Réutiliser les tokens P1 via CSS vars : `var(--brand-primary)`, `var(--brand-secondary)`, `var(--text-muted)` (#5e6b7e AA), `var(--surface-mist-strong)` (#92897a 1.4.11), `var(--shadow-focus)`. Jamais hex legacy hardcodé.
- `<h1>` unique (le hero) + landmarks sémantiques (`<header>`, `<main>`, `<footer>`, `<section>` nommé via aria-labelledby ou aria-label si besoin).
- WCAG 2.2 AA : focus visible sur tous interactifs, `<span lang="pt">` autour de "Ordem dos Advogados", `aria-label` sur liens externes, alt texte sur images, gold-fade décoratif gated par `prefers-reduced-motion` ou supprimé.
- Le `<ConsentBanner />` (P4) continue de fonctionner par-dessus le footer — pas de changement à `layout.tsx` qui le monte globalement.
- Hedge claims marketing : "48h" → "**habituellement** 48h" ; "500+ dossiers traités" → retirer (non-vérifiable, OQ-008 ouvert) ou remplacer par un signal vérifiable ("Cabinet partenaire Ordem dos Advogados").
- Tous les CTAs principaux pointent vers des routes existantes ou `/register` (welcome-card actuel y pointe déjà). "Voir la démo" est un placeholder `#demo` (ancre vide). **Routes manquantes** référencées par la nav/footer pointent vers `#` (no-op) avec un comment TODO inline (choix utilisateur 2026-06-09) : `/comment-ca-marche`, `/tarifs`, `/a-propos`, `/contact`, `/blog`, `/legal/cgu`, `/legal/privacy`, `/legal/rgpd`, `/legal/mentions`. Seuls les liens vers les routes existantes (`/login`, `/register`, `/legal/cookies`, etc.) sont fonctionnels.

**Ask First :**
- (résolu pré-approbation) Routes manquantes → `#` no-op (choix utilisateur).
- (résolu pré-approbation) i18n → FR + PT inline (choix utilisateur).
- Si pendant l'implémentation un asset image manquant (ex. logo SVG) cause une régression visuelle non triviale, HALTER et demander avant de fixer.

**Never :**
- Pas de migration vers `next-intl` ici (OQ-001 différée).
- Pas de hex legacy hardcodé (`#1A365D`, `#FAFAF8`, `#C9A84C`, `#E2E8F0`). Utiliser uniquement les CSS vars P1.
- Pas d'emoji dans la UI ni dans les `alt`/`aria-label`.
- Pas d'animations excessives (le mock a un `rotate-3deg` discret sur card flottante → OK mais respecter `prefers-reduced-motion: reduce` via media query CSS).
- Pas de fetch côté serveur sur cette page (statique pure, prerenderable). Les claims "X dossiers traités" sont statiques ou retirés.
- Pas de dépendance JS externe nouvelle (no carousel lib, no animation lib). Lucide-react déjà présent suffit.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Première visite landing | URL `/` | Page rendue en SSR, 7 sections visibles, ConsentBanner par-dessus (P4) | N/A |
| Navigation clavier | Tab depuis URL bar | Skip-link → logo → nav → CTA header → contenu → footer ; focus visible partout | N/A |
| Mobile <640px | Viewport 375px | Hero 1 col, nav cachée (hamburger placeholder ou supprimé), CTA stick (sans sticky bottom — pas dans scope) | N/A |
| Tablet/Desktop ≥1024px | Viewport 1280px | Hero 2 col (text gauche + card flottante droite avec rotate-3deg), nav visible | N/A |
| `prefers-reduced-motion: reduce` | OS pref | Card flottante hero affichée sans rotation (`rotate-0`) | N/A |
| Lien externe vers source | Click sur lien O&C | Pas de lien externe sur landing — partenariat textuel uniquement | N/A |
| Lien interne sur CTA | "Commencer mon dossier NIF" | Navigation `/register` (route existe) | N/A |
| Lien footer "Politique cookies" | Click | Navigation `/legal/cookies` (créée en P4) | N/A |
| Lien footer "Gérer mes cookies" | Click | Réouvre ConsentBanner via `<ConsentFooterLink />` | N/A |
| Image manquante (logo SVG) | Asset 404 | Fallback `<Shield />` ou text-only — pas d'écran cassé | N/A |

</frozen-after-approval>

## Code Map

- `apps/frontend/src/lib/landing/i18n.ts` — Dictionnaire FR + PT pour toutes les strings de la landing (header, hero, features, étapes, partnership, CTA final, footer). Helper `getLandingMessages(lang)` avec fallback PT.
- `apps/frontend/src/components/ui/TrustBar.tsx` — 4 signaux confiance (TLS, RGPD, Ordem dos Advogados, AMA Certified). Server Component, labels passés en props ou via dict.
- `apps/frontend/src/components/site/SiteHeader.tsx` — `'use client'`. Sticky header avec logo + nav desktop + CTAs. Lit `document.documentElement.lang` post-mount pour switcher FR/PT. LangSwitcher est un bouton placeholder "FR ▾" / "PT ▾" non-interactif (pas de cookie write au MVP).
- `apps/frontend/src/components/site/SiteFooter.tsx` — `'use client'` (contient `ConsentFooterLink`). Footer 4 colonnes navy + ligne légale + ConsentFooterLink dans la colonne Légal.
- `apps/frontend/src/app/page.tsx` — `'use client'`. Landing page complète, 7 sections. Importe le dict i18n + lit lang client-side.

**Composants existants à réutiliser :**
- `<ConsentFooterLink />` from `@/components/ui/ConsentFooterLink` (P4)
- `<Button />` from `@/components/ui/button` *(optionnel — la landing peut utiliser des `<Link>` stylés en classes Tailwind directement vu la variété de tailles)*

**Routes existantes en l'état (vérifier avant de pointer dessus) :**
- `/` (cette page), `/login`, `/register`, `/legal/cookies`, `/contracts`, `/contracts/wizard`, `/compliance`, `/nif`, `/nif/status`, `/assistant`, `/vault`, `/admin`, `/profile`
- **Routes manquantes** que le mock référence : `/comment-ca-marche`, `/tarifs`, `/a-propos`, `/contact`, `/blog`, `/legal/cgu`, `/legal/privacy`, `/legal/rgpd`, `/legal/mentions`. → Voir Ask First.

## Tasks & Acceptance

**Execution :**
- [x] `apps/frontend/src/lib/landing/i18n.ts` — 65 clés × 2 langues (FR + PT)
- [x] `apps/frontend/src/components/ui/TrustBar.tsx` — 4 signaux pure server-renderable
- [x] `apps/frontend/src/components/site/SiteHeader.tsx` — Sticky, nav desktop, CTAs, LangSwitcher stub disabled
- [x] `apps/frontend/src/components/site/SiteFooter.tsx` — Footer navy 4 colonnes, ConsentFooterLink intégré dans Légal
- [x] `apps/frontend/src/app/page.tsx` — Client component, 7 sections, sub-components factorés (FeatureCard, Step, HeroNifCard, TimelineStep)
- [x] `apps/frontend/src/app/globals.css` — Ajout utilitaire `.gold-fade::after` (decorative underline pour Step)
- [x] Verified runtime : ConsentBanner s'affiche par-dessus, "Gerir os meus cookies" footer rouvre le banner, page rend en PT par défaut (html.lang="pt"), 7 sections visibles

**Acceptance Criteria :**
- Given une visite à `/`, when la page rend, then le hero affiche le h1 "Le droit portugais, démocratisé." avec un sub-tagline pédagogique et 2 CTAs (gold + outline) ; le card flottante NIF tracking est visible en desktop.
- Given un user au clavier, when il Tab depuis l'URL bar, then le focus traverse : logo → nav items → "Se connecter" → "Commencer" header → CTAs hero → features cards (interactives ou hover only) → étapes → quote → footer links, avec focus visible partout.
- Given `prefers-reduced-motion: reduce`, when la page rend, then la card flottante du hero n'est pas en `rotate-3` (transform désactivé).
- Given un utilisateur lit le hero, when il voit la promesse "48h", then le texte indique "habituellement 48h" et non un absolu non-tenable.
- Given le footer rend, when l'utilisateur clique "Gérer mes cookies", then le ConsentBanner se réouvre (P4 integration).
- Given le projet build, when `npm run build`, then exit 0 sans warning sur les nouveaux composants.
- Given le projet lint, when `npm run lint`, then zéro nouvelle erreur introduite par le diff.
- Given un screenshot du rendu de `/` en desktop 1280px, when comparé au mock 01-landing.html, then les 7 sections sont présentes dans le même ordre, avec proportionnellement la même hiérarchie typographique et chromatique (≠ pixel-perfect, mais reconnaissable).

## Spec Change Log

*(empty)*

## Design Notes

**Approche RSC vs Client :** Initialement prévu full-RSC, basculé en client à cause du choix i18n FR+PT inline (lecture `document.documentElement.lang` au mount, même pattern que P4 ConsentBanner). SEO : `<html lang="pt">` + server-render PT par défaut ; Google indexera la version PT. Hydration : si lang === "fr", remplacement client. CLS minime (~100ms). Acceptable au MVP en attendant `next-intl` (OQ-001).

**Routes manquantes — décision par défaut :** Pointer les liens du mock vers `#` (no-op) avec un comment TODO ; la nav reste visible mais cliquer ne 404 pas. Alternative : pointer vers `/` (lien ancré aux sections). Voir Ask First.

**Logo asset :** Le projet a `apps/frontend/public/logo-easylaw.svg` (vu lors du merge). Vérifier qu'il fonctionne ou tomber sur la composition `<Shield /> + "EasyLaw"` actuelle.

**`<span lang="pt">` cibles :** "Ordem dos Advogados" (mentionné 2× dans le mock), "AMA Certified", possibly "Cabinet" si terminologie portugaise distincte.

**Pattern mobile menu :** mock desktop nav `hidden md:flex` ; on garde le pattern (nav désirée seulement sur md+). Pas de hamburger mobile MVP — gardé minimal avec juste logo + CTA "Commencer" sur mobile.

## Verification

**Commands :**
- `cd apps/frontend && npm run build` — expected: exit 0, route `/` size raisonnable (<10kB JS pour une page statique)
- `cd apps/frontend && npm run lint` — expected: zéro nouvelle erreur

**Manual checks (vérifiés runtime) :**
- ✓ `/` rend en PT (default html.lang="pt"), 7 sections présentes, hero 2 col en desktop ≥1024px, features 2×2 grid, footer 4 col navy
- ✓ Sections empilées en mobile (375px tested)
- ✓ Footer "Gerir os meus cookies" rouvre ConsentBanner (P2+P4 integration)
- ✓ Build ✓ 16 routes, /legal/cookies inchangée

## Suggested Review Order

**Source de vérité textes — entrée**

- 65 clés × 2 langues
  [`i18n.ts`](../../apps/frontend/src/lib/landing/i18n.ts)

**Composants UI factorés**

- TrustBar pure server, 4 signaux avec `lang="pt"` sur Ordem
  [`TrustBar.tsx`](../../apps/frontend/src/components/ui/TrustBar.tsx)

**Composants site (header/footer réutilisables)**

- Sticky header avec LangSwitcher stub disabled
  [`SiteHeader.tsx`](../../apps/frontend/src/components/site/SiteHeader.tsx)

- Footer navy + intégration ConsentFooterLink dans Légal
  [`SiteFooter.tsx`](../../apps/frontend/src/components/site/SiteFooter.tsx)

**Page principale (cœur du diff)**

- Client component, i18n inline, 7 sections, sub-components FeatureCard/Step/HeroNifCard/TimelineStep
  [`page.tsx`](../../apps/frontend/src/app/page.tsx)

**Style additif**

- Utility gold-fade pour les step titres
  [`globals.css`](../../apps/frontend/src/app/globals.css)
