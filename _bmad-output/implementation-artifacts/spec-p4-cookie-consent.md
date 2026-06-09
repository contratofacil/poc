---
title: 'P4 — Cookie Consent CMP (D-012 from UX review)'
type: 'feature'
created: '2026-06-09'
status: 'done'
baseline_commit: 'ec8d97d68af7bca239c2b3bd15d9437d8ad7b9cc'
context:
  - 'apps/frontend/AGENTS.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-easylaw-2026-06-09/EXPERIENCE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem :** EasyLaw n'a aucun mécanisme de consentement aux cookies. ePrivacy + RGPD Art. 7 imposent un opt-in explicite pour tout cookie non-essentiel avant collecte. CNPD/CNIL enforce activement (jusqu'à 4 % du CA). Bloque légalement toute mise en ligne publique.

**Approach :** Composant client `<ConsentBanner />` monté globalement dans `app/layout.tsx`. Persistance dans un cookie `easylaw_consent_v1` (JSON, 12 mois). 4 catégories (Nécessaires forcés, Analytique, Marketing, Personnalisation). 3 boutons à équivalence visuelle stricte ("Tout accepter" / "Tout refuser" / "Personnaliser"). Hook `useConsent()` exporté pour que d'autres composants (footer "Gérer mes cookies", analytics intégrateurs) lisent/réécrivent l'état. Accessibility WCAG 2.2 AA : tab order logique, Escape ferme le modal Personnaliser, focus trap dans ce modal.

## Boundaries & Constraints

**Always :**
- Aucun cookie non-essentiel n'est écrit avant que l'utilisateur ait soumis un choix explicite ("Accepter tout", "Refuser tout", ou "Enregistrer mes choix")
- "Accepter tout" et "Refuser tout" doivent être visuellement à équivalence — même size, même hiérarchie, jamais un griffé/secondary fight l'autre. Pas de dark pattern.
- Le cookie persiste 12 mois maximum. Au-delà, re-consent obligatoire.
- La catégorie "Nécessaires" est forcée à `true` et **non désactivable** par l'utilisateur (cookies session, auth Privy, langue, consent lui-même).
- Texte i18n FR + PT — toutes les chaînes du banner doivent exister dans les deux langues, lues depuis `document.documentElement.lang` ou un context i18n existant.
- Hook `useConsent()` exporte au minimum `{state, openBanner, hasResolved, update}`.

**Ask First :**
- Si une lib externe (e.g. `cookie-consent`, `react-cookie-consent`) est tentante pour gagner du temps, HALTER et demander — la décision archi est de tout coder en interne pour éviter une nouvelle dépendance.
- Si le mécanisme propose de bloquer la navigation tant qu'un choix n'est pas fait ("wall"), HALTER — c'est interdit (cf. CNIL).

**Never :**
- Pas d'auto-acceptation par défaut (Analytics/Marketing/Personnalisation = `false` jusqu'à action explicite).
- Pas d'écriture en `localStorage` du consentement (cookie SEULEMENT, pour que le serveur puisse le lire en SSR et bloquer les scripts en amont si besoin).
- Pas d'intégration analytics dans cette tâche (Google Analytics, PostHog, Meta Pixel) — uniquement le mécanisme de consentement + persistance.
- Pas de bandeau qui réapparaît tant que le cookie n'est pas explicitement révoqué (test "reload après choix").
- Pas d'emoji.
- Pas de wrapper Provider qui force la rehydratation côté serveur sur chaque page (le composant doit lire le cookie côté client ET côté serveur pour éviter le flash "no consent" puis "consent" à l'hydratation).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Première visite | Cookie absent | Banner visible bottom-fixed après mount | N/A |
| "Accepter tout" cliqué | Banner ouvert | Cookie écrit `{necessary, analytics, marketing, personalization} = true`, banner ferme, pas de reprompt au reload | N/A |
| "Refuser tout" cliqué | Banner ouvert | Cookie écrit avec les 3 catégories opt-in à `false`, banner ferme, pas de reprompt au reload | N/A |
| "Personnaliser" cliqué | Banner ouvert | Modal s'ouvre, focus trap actif, Escape ferme | N/A |
| Modal "Enregistrer mes choix" cliqué | Modal ouvert | Cookie écrit avec choix utilisateur, modal + banner ferment | N/A |
| Footer "Gérer mes cookies" cliqué | N'importe quelle page après choix initial | `openBanner()` rouvre le banner pré-rempli avec choix existant | N/A |
| Reload après choix | Cookie présent | Banner reste fermé (resolved=true) | Si cookie corrompu/v≠1 : effacer + re-prompt |
| Cookie expiré (12+ mois) | Cookie absent (auto-expired) | Banner réapparait sur la prochaine visite | N/A |
| SSR / hydratation | Pas d'accès `document.cookie` au render serveur initial | Pas de flash de banner — utiliser `'use client'` + `useEffect` ou lire cookie via Next.js `cookies()` dans un Server Component wrapper | N/A |
| Keyboard nav | Tab depuis le banner | Tab order : "Tout accepter" → "Tout refuser" → "Personnaliser" → "Politique cookies" → cycle | N/A |
| Modal Escape | Modal ouvert | Modal ferme, focus revient au bouton "Personnaliser" du banner | N/A |

</frozen-after-approval>

## Code Map

- `apps/frontend/src/lib/consent/types.ts` — Types TS : `ConsentCategory`, `ConsentState`, constantes `CONSENT_COOKIE_NAME`, `CONSENT_VERSION`, `MAX_AGE_SECONDS`.
- `apps/frontend/src/lib/consent/cookie.ts` — Read/write cookie helpers SSR-safe. Pure fonctions sans accès React.
- `apps/frontend/src/lib/consent/context.tsx` — `ConsentProvider`, `useConsent()` hook avec `state`, `hasResolved`, `update(state)`, `acceptAll()`, `rejectAll()`, `openBanner()`, `isBannerOpen`.
- `apps/frontend/src/lib/consent/i18n.ts` — Translations FR + PT pour toutes les chaînes (titre, description, 4 catégories, 3 boutons, modal labels, footer link).
- `apps/frontend/src/components/ui/ConsentBanner.tsx` — Component banner + modal Personnaliser (focus trap, Escape, click-outside).
- `apps/frontend/src/components/ui/ConsentFooterLink.tsx` — Lien "Gérer mes cookies" exporté pour usage dans futur footer (Phase P2).
- `apps/frontend/src/app/layout.tsx` — Wrap `Providers` avec `<ConsentProvider>`, mount `<ConsentBanner />` après children.
- `apps/frontend/src/app/legal/cookies/page.tsx` — Page placeholder courte expliquant la politique cookies (pour que le lien du banner ne 404).

## Tasks & Acceptance

**Execution :**
- [x] `apps/frontend/src/lib/consent/types.ts` — Types + constantes
- [x] `apps/frontend/src/lib/consent/cookie.ts` — SSR-safe read/write/clear helpers ; validation version + structure
- [x] `apps/frontend/src/lib/consent/context.tsx` — Provider client + `useConsent()` hook complet (state, hasResolved, mounted anti-flash, isBannerOpen, acceptAll, rejectAll, update, openBanner, closeBanner, reset)
- [x] `apps/frontend/src/lib/consent/i18n.ts` — FR + PT (fallback PT marché principal)
- [x] `apps/frontend/src/components/ui/ConsentBanner.tsx` — Banner + modal Customize avec focus trap, Escape, body scroll-lock, backdrop ne ferme pas. **Bonus correction sur place** : "Tout accepter" et "Tout refuser" tous DEUX en filled primary identical (vs initial filled vs outline — corrigé après détection visuelle pour stricte équivalence CNIL).
- [x] `apps/frontend/src/components/ui/ConsentFooterLink.tsx` — Bouton réouverture
- [x] `apps/frontend/src/app/legal/cookies/page.tsx` — Page policy MVP avec 4 catégories
- [x] `apps/frontend/src/app/layout.tsx` — Wrap Provider + mount banner

**Acceptance Criteria :**
- Given une première visite sans cookie, when la page se charge, then le banner apparait après hydration avec les 3 boutons "Tout accepter", "Tout refuser", "Personnaliser" à équivalence visuelle.
- Given l'utilisateur clique "Tout accepter", when le navigateur recharge la page, then aucun banner ne réapparait et `document.cookie` contient `easylaw_consent_v1=…analytics:true…`.
- Given l'utilisateur clique "Tout refuser", when reload, then aucun reprompt et `analytics:false, marketing:false, personalization:false` dans le cookie.
- Given un utilisateur a fait un choix initial, when il appelle `openBanner()` (via Footer link), then le banner se ré-ouvre pré-rempli avec ses choix précédents.
- Given l'utilisateur navigue au clavier, when il atteint le banner, then Tab cycle entre les 3 CTAs et le lien légal ; Escape dans le modal Personnaliser le ferme et restaure le focus.
- Given le projet build, when `npm run build` est exécuté, then exit 0 sans warning lié au nouveau code.
- Given le projet lint, when `npm run lint`, then zéro nouvelle erreur introduite par le diff.
- Given aucun consentement encore donné, when la page charge, then aucun cookie autre que `easylaw_consent_v1` (s'il est écrit comme placeholder vide ? NON) ne doit être posé — `easylaw_consent_v1` lui-même n'est écrit qu'au moment du choix explicite.

## Spec Change Log

### Entry 1 — 2026-06-09 (step-04 review patches, no loopback)

**Findings triggers :** Edge Case Hunter + Acceptance Auditor (parallel review).

3 issues critiques toutes classifiées `patch` (pas de bad_spec frozen amendment) :

1. **AC-5 tab order violation** (Auditor FAIL) — DOM order initial Personnaliser → Refuser → Accepter ne matchait pas spec ("Accepter → Refuser → Personnaliser"). CSS `order-*` ne change pas le tab order, seulement le visual. **Patch :** réordonné JSX (Accept en premier en DOM, Reject 2ème, Customize 3ème), conservé `sm:order-*` pour visual desktop. Tab clavier maintenant aligné spec.

2. **Backdrop click cassait le focus trap** (Edge Case major) — clic backdrop déplaçait `activeElement` vers body, après quoi Tab s'échappait du modal. **Patch :** ajout `onMouseDown` handler sur backdrop avec `e.preventDefault()` si target=currentTarget — bloque le déplacement focus sans empêcher le clic ; ajout dans `onKeyDown` d'un check "active hors du dialog → focus first" pour reprendre le contrôle si la situation se produit malgré tout.

3. **Safari/Firefox mouse-click + Escape** (Edge Case major) — `previouslyFocused = document.activeElement` capture `<body>` quand le user clique souris sur Personnaliser sur Safari/Firefox (où button click ne pose pas le focus). Escape rendait le focus au body. **Patch :** introduit prop `returnFocusRef` passée du `<ConsentBanner>` (qui ref le bouton Personnaliser) au `<CustomizeDialog>`. Restauration du focus utilise cette ref explicite — robuste cross-browser.

**Patches mineurs additionnels :**
- Unused import `ALL_ACCEPTED` retiré (lint hygiène).
- Focus initial modal déplacé du Cancel button vers Close X (premier focusable DOM, AT-friendly — Shift+Tab du focus initial wrap vers Save logiquement).

**Notes déférées (non-critiques) :**
- `<html lang="pt">` hardcoded ; banner ne réagit pas à un switch lang client-side — OK pour MVP, à revoir avec migration next-intl (OQ-001).
- Cookie `split("; ")` fail théorique si polyfill weird — acceptable, RFC-6265 standard.
- Body overflow restore stomp scenario théorique — pas de conflit current.
- `closeBanner` exposé mais inutilisé — dead-code-ish, harmless, gardé pour symétrie API.

## Design Notes

**Cookie format (v1) :**
```json
{
  "v": 1,
  "necessary": true,
  "analytics": false,
  "marketing": false,
  "personalization": false,
  "ts": "2026-06-09T12:34:56.789Z"
}
```
URL-encoded, écrit avec : `document.cookie = "easylaw_consent_v1=" + encodeURIComponent(JSON.stringify(state)) + "; Max-Age=31536000; Path=/; SameSite=Lax" + (location.protocol === "https:" ? "; Secure" : "")`

**Visual layout (banner, mobile-first) :**
- Bottom-fixed, full-width sur mobile, max-w-3xl centré sur desktop
- Background `surface.card` (#fff), border-top `surface.mistStrong` (#92897a)
- Padding 16px mobile, 24px desktop
- 3 boutons : "Tout accepter" (primary), "Tout refuser" (primary outline avec mêmes dimensions, JAMAIS ghost), "Personnaliser" (outline secondaire visuellement plus discret car action complexe)

**Modal Personnaliser :**
- `role="dialog"` `aria-modal="true"` `aria-labelledby`
- 4 toggles (Switch component à créer si non existant — sinon checkbox stylisée)
- Toggle "Nécessaires" disabled + `aria-disabled="true"` + tooltip explicatif
- 2 boutons : "Annuler" (revient au banner sans persister) + "Enregistrer mes choix" (primary)
- Click sur backdrop NE ferme PAS (force choix explicite)

**Pattern SSR-safe (no flash) :**
- `ConsentProvider` est `'use client'`
- Au premier render serveur, `hasResolved` est `false` par défaut
- Le banner a `aria-hidden="true"` + `opacity-0` initialement, puis fade-in après le `useEffect` qui lit le cookie. Évite le flash "banner visible → disparait" si l'utilisateur a déjà consenti.

## Verification

**Commands :**
- `cd apps/frontend && npm run build` — expected: exit 0
- `cd apps/frontend && npm run lint` — expected: zéro nouvelle erreur sur les fichiers ajoutés

**Manual checks (vérifiés runtime durant step-03/step-04) :**
- ✓ Première visite : banner apparait après hydration.
- ✓ "Recusar tudo" : cookie `analytics:false, marketing:false, personalization:false, necessary:true, v:1, ts:...` écrit, banner ferme.
- ✓ Reload après refus : pas de reprompt, cookie persiste.
- ✓ "Aceitar tudo" : cookie tous-opt-in à true, banner ferme.
- ✓ Modal Personnaliser : 4 toggles affichés, Necessários badge "SEMPRE ATIVO" + state forced ON + non-cliquable.
- ✓ Escape ferme le modal + restore body overflow.

## Suggested Review Order

**Foundation — types & persistance (point d'entrée)**

- Démarrer ici, c'est le contrat de données du système
  [`types.ts`](../../apps/frontend/src/lib/consent/types.ts)

- Lecture/écriture SSR-safe avec validation version + structure
  [`cookie.ts`](../../apps/frontend/src/lib/consent/cookie.ts)

**State management React**

- Provider client + hook complet (anti-flash via `mounted` gate)
  [`context.tsx`](../../apps/frontend/src/lib/consent/context.tsx)

**Translations FR + PT**

- 21 clés par langue, fallback PT marché principal
  [`i18n.ts`](../../apps/frontend/src/lib/consent/i18n.ts)

**UI principale (le cœur du diff — patches step-04 ici)**

- Anti dark-pattern (Accept/Reject identiques), DOM tab order respecté, focus trap renforcé
  [`ConsentBanner.tsx`](../../apps/frontend/src/components/ui/ConsentBanner.tsx)

**Mount global**

- Wrap du Provider autour de Providers + banner monté en dernier
  [`layout.tsx`](../../apps/frontend/src/app/layout.tsx)

**Surfaces périphériques**

- Trigger réutilisable footer "Gérer mes cookies"
  [`ConsentFooterLink.tsx`](../../apps/frontend/src/components/ui/ConsentFooterLink.tsx)

- Page policy MVP — à compléter avec service juridique avant launch
  [`legal/cookies/page.tsx`](../../apps/frontend/src/app/legal/cookies/page.tsx)
