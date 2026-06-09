---
title: 'P3 — Compliance Dashboard `/compliance` (visual upgrade from mock 03)'
type: 'feature'
created: '2026-06-09'
status: 'done'
baseline_commit: '1d860be'
context:
  - 'apps/frontend/AGENTS.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-easylaw-2026-06-09/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-easylaw-2026-06-09/EXPERIENCE.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-easylaw-2026-06-09/.working/mocks/03-compliance-dashboard.html'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem :** L'actuelle `/compliance/page.tsx` est fonctionnelle (550 lignes, backend fetch + CRUD + email alerts log) mais visuellement legacy : table dense, layout monolithique sans shell, hex hardcodés (`#FAFAF8`, `#1A365D`, `#C9A84C`, `#E2E8F0`), pas alignée avec les tokens AA de P1, pas réutilisable pour les autres routes authentifiées. La mock UX 03-compliance-dashboard.html spécifie un dashboard moderne (sidebar shell persistante, État global tri-color, Action urgente card, list filtrable) — c'est l'écran qui matérialise le pitch produit pour Miguel (PME).

**Approach :** Remplacer la page entière par une version visual-first basée sur le mock. Construire un `<AppShell />` réutilisable (sidebar + topbar) qui servira aussi pour les autres routes authentifiées. Mock data hardcodée typée pour faciliter le re-wiring backend en P3.5 (décrit dans deferred-work). **Régression temporaire acceptée** sur les fonctionnalités backend actuelles (add form / toggle / delete / email alerts log) — déférée à P3.5.

## Boundaries & Constraints

**Always :**
- `<AppShell />` doit être réutilisable. Props minimaux : `activeSection`, `breadcrumb`, `children`. Le composant gère sidebar (gauche desktop, masquée mobile + bottom-nav 5 items max) + topbar + main wrapper.
- Auth guard préservé : si `localStorage.getItem("token")` est `null` au mount, redirect `/login?redirect=/compliance` (même mécanisme que l'existant).
- Status colors via tokens P1 AA : `var(--status-green)`, `var(--status-green-bg)`, etc. — **jamais** `bg-red-50` ou `text-red-600` (legacy Tailwind colors hors tokens).
- Réutiliser `<ComplianceBadge>` du fichier `components/ui/badge.tsx` (livré en P1).
- `<span lang="pt">` autour des termes officiels portugais : IVA Periódica, NIF, NRAU, IRC, IES, Lda, Alvará, Finanças.
- Mock data typée via interface `Obligation` exportée — facilitera le swap backend en P3.5.
- Action urgente card : `role="region"` + `aria-labelledby` + nom explicite ; pas de `aria-live="assertive"` (l'urgent est statique, pas une notification temps-réel).
- Build ✓ + lint zéro nouvelle erreur introduite par le diff.
- L'i18n est **FR-only** au MVP P3 (le shell est auth, public majoritairement francophone côté Miguel ; PT viendra avec next-intl OQ-001). Les termes métier portugais sont conservés tels quels avec `<span lang="pt">`.

**Ask First :**
- Si l'utilisateur ne veut PAS la régression backend (préserver add/delete/toggle et email alerts log), HALTER et redéfinir le scope : on garde alors un mode "compatibility" qui restitue la table CRUD existante en dessous du nouveau dashboard.

**Never :**
- Pas de nouvelle dépendance JS externe (lucide-react suffit).
- Pas de migration vers shadcn (D-003).
- Pas de hex legacy hardcodé (`#FAFAF8`, `#1A365D`, `#C9A84C`, `#E2E8F0`, `#64748B`...). Toutes les couleurs via CSS vars P1.
- Pas d'emoji.
- Pas d'animation excessive — respecter `prefers-reduced-motion` sur tout hover/transition non-fonctionnel.
- Pas de modification de `layout.tsx` (le ConsentBanner global continue de fonctionner par-dessus).
- Pas de migration de la sidebar vers un mécanisme d'état partagé (Context, store) au MVP — local state suffit.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| User non-authentifié visite `/compliance` | `localStorage.token === null` | Redirect immédiat vers `/login?redirect=/compliance` | N/A |
| User authentifié | `token` présent | Render le shell + dashboard avec mock data | N/A |
| Filter "À venir" cliqué | Tab state amber filter | Liste filtrée par `status === "amber"` (3 rows visibles) | N/A |
| Filter "À jour" cliqué | Tab state green filter | Liste filtrée (rows green visibles) | N/A |
| Action urgente CTA "Préparer ma déclaration" cliqué | Click | No-op au MVP (TODO P3.5 : ouvrir wizard) avec `aria-disabled` ou href "#" | N/A |
| Mobile <768px | viewport 375px | Sidebar masquée, bottom-nav 5 items, layout 1 col | N/A |
| Desktop ≥1024px | viewport 1280px | Sidebar fixe gauche w-64, main flex-1 | N/A |
| `prefers-reduced-motion: reduce` | OS pref | Transitions hover désactivées | N/A |

</frozen-after-approval>

## Code Map

- `apps/frontend/src/components/site/AppShell.tsx` — `'use client'`. Wrapper layout pour routes authentifiées : sidebar + topbar + `<main>`. Auth check via localStorage token + redirect. Props : `{ activeSection, breadcrumb, children }`.
- `apps/frontend/src/components/site/AppSidebar.tsx` — Sidebar gauche desktop / bottom-nav mobile. 6 items (Dashboard, NIF, Contrats, Compliance, Luso-Legal, Coffre) avec icônes lucide. Profile footer.
- `apps/frontend/src/components/site/AppTopBar.tsx` — Top bar avec breadcrumb props + LangSwitcher disabled stub + bell notification stub (dot rouge).
- `apps/frontend/src/components/compliance/ComplianceStatusBar.tsx` — Barre flex segments tri-color avec labels intégrés + légende dessous. Props : `{ counts: { green, amber, red }, lang }`.
- `apps/frontend/src/components/compliance/ObligationCard.tsx` — Card "Action urgente" red-bordered. Props : `{ obligation, onPrepare, onMarkPrepared, onViewDetail }`.
- `apps/frontend/src/components/compliance/ObligationListItem.tsx` — Row du list view. Props : `{ obligation, onClick }`. Status dot + label + meta + badge "jours" + chevron.
- `apps/frontend/src/lib/compliance/types.ts` — Interface `Obligation` + helper `daysFromNow(dueDate)`.
- `apps/frontend/src/lib/compliance/mockData.ts` — Mock data (11 obligations matching the mock).
- `apps/frontend/src/app/compliance/page.tsx` — Remplacement complet. Compose AppShell + dashboard sections : Hero greeting, État global card, Action urgente card, list view filtrable.

## Tasks & Acceptance

**Execution :**
- [x] `apps/frontend/src/lib/compliance/types.ts` — Interface `Obligation` avec `label: ReactNode` (granular `<span lang="pt">` wrapping) + `filterObligations` filter "upcoming" = `status === "amber"` only + `countByStatus` + `formatDaysBadge`.
- [x] `apps/frontend/src/lib/compliance/mockData.tsx` — 11 obligations (.tsx pour JSX inline, `<Pt>` wrapper component pour les termes PT). 1 urgent rouge, 3 amber, 7 green.
- [x] `apps/frontend/src/components/site/AppShell.tsx` — Auth check + skip-link + sidebar + topbar + main. Mobile pb-16 pour bottom-nav.
- [x] `apps/frontend/src/components/site/AppSidebar.tsx` — Sidebar navy desktop / bottom-nav mobile. Gold border-left sur item actif + `aria-current="page"`.
- [x] `apps/frontend/src/components/site/AppTopBar.tsx` — Breadcrumb `aria-current="page"` + LangSwitcher stub + bell dot rouge.
- [x] `apps/frontend/src/components/compliance/ComplianceStatusBar.tsx` — `role="img"` + `aria-label` décrivant les counts. Segments flex + légende.
- [x] `apps/frontend/src/components/compliance/ObligationCard.tsx` — `role="region"` + `aria-labelledby`. 3 CTAs avec `aria-disabled`. ChevronRight icon pour "Voir le détail".
- [x] `apps/frontend/src/components/compliance/ObligationListItem.tsx` — Réutilise `<ComplianceBadge>` de `components/ui/badge.tsx` (P1). `aria-disabled` quand pas de onClick.
- [x] `apps/frontend/src/app/compliance/page.tsx` — AppShell + 4 sections. Filtre "À venir" = amber only. Counts affichés dans tabs.

**Acceptance Criteria :**
- Given un user authentifié visite `/compliance`, when la page rend, then le AppShell est visible (sidebar gauche desktop avec "Compliance" highlighted + topbar avec breadcrumb "Dashboard / Compliance") et le main contient les 4 sections du mock dans l'ordre (Hero, État global, Action urgente, List).
- Given un user non-authentifié visite `/compliance`, when la page rend, then il est redirigé vers `/login?redirect=/compliance`.
- Given le user clique le filter "À venir", when le state local change, then la liste ne montre que les obligations amber.
- Given un user lit l'Action urgente, when un lecteur d'écran traverse, then le `role="region"` annonce "Action urgente : Déclaration TVA mensuelle (IVA Periódica)" avec `<span lang="pt">` autour de "IVA Periódica".
- Given le projet build, when `npm run build`, then exit 0.
- Given le projet lint, when `npm run lint`, then zéro nouvelle erreur introduite.
- Given un screenshot du rendu `/compliance` en desktop 1280px, when comparé au mock 03-compliance-dashboard.html, then les 4 sections sont présentes dans le même ordre avec les bonnes proportions visuelles.

## Spec Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2026-06-09 | `Obligation.label` changed from `string` to `ReactNode` ; `description` from `string?` to `ReactNode?` | Granular `<span lang="pt">` inline wrapping required by Acceptance Auditor (full h3 lang-attr was FAIL) |
| 2026-06-09 | `mockData.ts` → `mockData.tsx` (file renamed) | JSX syntax requires .tsx extension; `<Pt>` wrapper component added for PT terms |
| 2026-06-09 | `filterObligations` "upcoming" filter changed to `status === "amber"` only (was `amber \|\| red`) | Acceptance Auditor: "À venir" = upcoming but not overdue — red obligations are already past deadline, semantically different |
| 2026-06-09 | `ObligationListItem` reimported `<ComplianceBadge>` from `components/ui/badge.tsx` | Acceptance Auditor: P1 component must be reused, not duplicated inline |
| 2026-06-09 | `ObligationCard` + page.tsx: "→" text arrow replaced with `<ChevronRight>` lucide icon | Icon communicates directionality to non-sighted users via `aria-hidden`; text arrow was decorative noise |
| 2026-06-09 | `AppShell` auth check uses `router.replace()` instead of `window.location.href` | Diverges from spec note (which mentioned window.location.href for pre-render) — useRouter().replace() functional and avoids CSP violations in some configs |

## Design Notes

**AppShell réutilisable :** Conçu pour fonctionner aussi sur `/nif`, `/contracts`, `/assistant`, `/vault`. Props minimaux + composition. Item actif passé en prop (pas de detect via `usePathname()` au MVP — plus simple, plus testable).

**Auth check** : pattern aligné avec l'existant `compliance/page.tsx:51-55` (lecture `localStorage.token` + redirect via `window.location.href`). Pas de migration vers `useRouter().push()` parce que la redirection est pré-render et ne doit pas trigger React events.

**Mock data réaliste** : reprend les 11 obligations visualisées dans le mock + invente 6 supplémentaires pour la queue (la story Miguel a 11 obligations total, 5 visibles ailleurs + 6 cachées derrière "Voir les 6 autres"). Toutes typées avec termes PT pertinents.

**i18n FR-only au MVP P3** : décision pragmatique pour réduire le scope. L'existant `/compliance` avait FR+PT mais via un mécanisme fetch profile → setLang qui ajoute du couplage backend. P3 simplifie en FR-only + termes PT inline avec `<span lang="pt">`. Migration vers next-intl couvrira FR+PT proprement.

**Régression backend acceptée** : add/delete/toggle/email alerts log retirés de cette page. Une nouvelle entrée dans deferred-work (P3.5) trackera le re-wiring. L'API `/api/compliance` continue d'exister côté backend, juste pas connectée au frontend pour l'instant.

## Verification

**Commands :**
- `cd apps/frontend && npm run build` — expected: exit 0
- `cd apps/frontend && npm run lint` — expected: zéro nouvelle erreur sur les fichiers P3

**Manual checks :**
- Démarrer dev server, ouvrir `/compliance` en navigation privée : redirect vers `/login?redirect=/compliance`.
- Set token en localStorage + reload `/compliance` : AppShell visible, sidebar Compliance gold-highlighted, 4 sections dashboard rendues.
- Cliquer tab "À venir" : 3 rows amber visibles.
- Tab depuis URL bar : focus skip-link → sidebar items → topbar → CTA "+ Ajouter" → tabs → list rows.
