---
title: 'P1 — Tokens AA durcis (D-011 from UX review)'
type: 'refactor'
created: '2026-06-09'
status: 'done'
specLoopIteration: 2
baseline_commit: '17151d757cb8b93c14f9bad3092c7662ad9c21dc'
context:
  - '_bmad-output/planning-artifacts/ux-designs/ux-easylaw-2026-06-09/DESIGN.md'
  - 'apps/frontend/AGENTS.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem :** Plusieurs tokens couleur d'EasyLaw échouent WCAG 2.2 AA — identifiés par le reviewer gate de la phase UX. `text.muted` (#718096) est à 3.72:1 sur `surface.page` au lieu des 4.6:1 affirmés ; les `status.{green,amber,red}.fg` chutent à 2.86–3.95:1 sur leurs backgrounds tintés ; les borders `surface.mist` (#e8e4dd) sont à 1.17:1 et invisibles ; le focus ring à 0.20 alpha disparaît sur fond crème. Affichage actuel non-conforme accessibilité pour produit grand public regulated.

**Approach :** Refactor des tokens couleur dans `apps/frontend/src/styles/tokens.ts` et `apps/frontend/src/app/globals.css` avec valeurs AA-conformes (calculs vérifiés au reviewer accessibility). Propagation aux 4 composants UI qui hardcodent ces hex strings (input, badge, card, button). Aucun changement structurel — purement chromatique + ajout de 2 nouveaux tokens (`surface.mistStrong` et `shadows.focusOnGold`).

## Boundaries & Constraints

**Always :**
- Conserver l'API publique de `tokens.ts` (exports nommés `colors`, `fonts`, `radius`, `shadows`, `buttonVariants`, `complianceBadgeClass`, `ComplianceStatus`)
- Tout hex dur dans les composants UI doit pointer vers une valeur conforme AA après refactor — soit via classe Tailwind référençant un `@theme` var, soit via hex direct mis à jour
- `--shadow-focus` ET `--shadow-focus-on-gold` exposés en CSS custom properties pour usage runtime
- `status.{green,amber,red}.border` saturés (`#86efac`, `#fcd34d`, `#fca5a5`) pour ratio non-textuel ≥3:1

**Ask First :**
- Si le refactor révèle une casse visuelle sur une page existante (ex. rendu radicalement différent qui briserait des screenshots de tests), HALTER et demander
- Si un consumer non-listé (hors `apps/frontend/src/components/ui/{button,card,badge,input}.tsx`) utilise les anciens hex, HALTER et lister avant de toucher

**Never :**
- Pas de migration vers shadcn/Radix dans ce refactor (out of scope, voir DESIGN.md D-003)
- Pas de changement de structure des composants — uniquement valeurs couleur
- Pas de modification des fonts, radius, spacing, ou shadows non-focus
- Pas de modification des animations / transitions
- Pas d'ajout de tokens autres que les 2 nouveaux nommés ci-dessus

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Texte muted sur surface page | Élément avec `color: var(--text-muted)` ou `text-[#5e6b7e]` sur fond `#f8f6f1` | Ratio contraste ≥4.5:1 mesuré (calcul WCAG) | N/A |
| Compliance badge green | `<ComplianceBadge status="green" />` | Texte `#15803d` sur fond `#dcfce7` ≥4.5:1 ; dot visible ; border `#86efac` ≥3:1 | N/A |
| Focus visible sur bouton outline | Tab/clic clavier sur bouton outline | Anneau bleu nuit alpha 0.45 visible à l'œil sur fond crème | Si invisible : régression |
| Focus sur bouton gold | Tab sur CTA primary gold | Anneau renforcé alpha 0.65 (var `--shadow-focus-on-gold`) | N/A |
| Border interactif card | `<Card>` standalone sur `surface.page` | Border `surface.mistStrong` (#c4bdb0) ≥3:1 vs fond | N/A |
| Input avec error | `<Input error="…" />` | Texte erreur `#b91c1c` sur fond blanc ≥5:1 ; border `#b91c1c` | N/A |

</frozen-after-approval>

## Code Map

- `apps/frontend/src/styles/tokens.ts` — Source de vérité TS exports. Shift `text.muted`, `status.{green,amber,red}.{fg,border}`, add `surface.mistStrong`, update `buttonVariants.danger` to new `#b91c1c`, update `complianceBadgeClass` for new fg+bg+border tuples.
- `apps/frontend/src/app/globals.css` — CSS `@theme inline` + `:root` vars. Mirror shifts. Add `--color-surface-mist-strong`, `--shadow-focus`, `--shadow-focus-on-gold`. Replace old `--color-status-*-border` hex.
- `apps/frontend/src/components/ui/input.tsx` — Hardcoded `#718096`, `#dc2626`, `#e8e4dd`, `#c5bfb5`. Update to `#5e6b7e`, `#b91c1c`, `#e8e4dd` (keep mist for internal divider), `#c4bdb0` (mistStrong on hover).
- `apps/frontend/src/components/ui/badge.tsx` — Hardcoded `#16a34a`, `#d97706`, `#dc2626` (dot indicators only). Update to `#15803d`, `#b45309`, `#b91c1c`. `#e8e4dd` outline stays (non-interactive separator).
- `apps/frontend/src/components/ui/card.tsx` — Border `#e8e4dd` — keep (card is a non-interactive content frame, internal divider OK). No change required UNLESS card is used as an interactive surface elsewhere (verify).
- `apps/frontend/src/components/ui/button.tsx` — Focus ring uses `focus-visible:ring-[#1a3a5c]` (color OK, alpha controlled by ring system). Add explicit class or inline style for new `focusOnGold` variant on `gold` button.

## Tasks & Acceptance

**Execution :**
- [x] `apps/frontend/src/styles/tokens.ts` — Apply 7 hex shifts + add `surface.mistStrong` + 2 focus shadow exports + update `complianceBadgeClass` triplets
- [x] `apps/frontend/src/app/globals.css` — Mirror shifts in `@theme inline` and `:root` blocks ; add `--color-surface-mist-strong`, `--shadow-focus`, `--shadow-focus-on-gold`
- [x] `apps/frontend/src/components/ui/input.tsx` — Replace `#718096` → `#5e6b7e` (placeholder + hint), `#dc2626` → `#b91c1c` (error border, error ring, error text), `#c5bfb5` → `#c4bdb0` (hover border). Bonus: hover border passe à `#1a3a5c` (brand primary) pour un état hover plus marqué et AA-fort.
- [x] `apps/frontend/src/components/ui/button.tsx` — `focus-visible:shadow-[var(--shadow-focus*)]` posé en classes Tailwind, branché conditionnellement sur la variante `gold` vs autres
- [x] `apps/frontend/src/components/ui/badge.tsx` — `DOT_COLOR` map mis à jour aux 3 nouvelles valeurs
- [x] CHANGELOG ajoutée en tête de `tokens.ts` (D-011 cité)

**Acceptance Criteria :**
- Given un utilisateur lit du `text-muted` content sur `surface.page`, when l'écran rend, then le ratio de contraste calculé est ≥4.5:1 (5e6b7e/f8f6f1).
- Given un `ComplianceBadge` est rendu pour chaque statut (green/amber/red), when comparé à WCAG AA, then chacun a son fg ≥4.5:1 sur son bg ET son border ≥3:1 sur la page.
- Given un utilisateur navigue au clavier, when le focus arrive sur un bouton outline/primary/gold/danger/ghost, then l'anneau de focus est clairement visible sans inspection au pixel.
- Given un input avec error rend, when affiché, then texte d'erreur et border utilisent `#b91c1c` (5.07:1 sur blanc).
- Given le projet build, when `npm run build` est exécuté dans `apps/frontend/`, then le build réussit sans warning de type ou de Tailwind sur les nouveaux tokens.
- Given le projet lint, when `npm run lint` est exécuté, then aucune nouvelle erreur n'apparaît.

## Spec Change Log

### Entry 1 — 2026-06-09 (specLoopIteration 1 → 2)

**Findings triggers :**
1. **Acceptance Auditor :** `surface.mistStrong` (#c4bdb0) affirmé à 3.05:1 sur `surface.page` calcule en réalité **1.73:1** (formule WCAG luminance re-vérifiée). Le token censé corriger 1.4.11 n'y satisfait pas.
2. **Blind Hunter + Edge Case Hunter :** `input.tsx` hover border `#1a3a5c` (brand primary, opaque) est visuellement indistinguable du focus state (mêmes couleur exacte sur la bordure). Hover/focus collision.

**Amendments :**
1. **Shift `surface.mistStrong` `#c4bdb0` → `#92897a`** — re-calculé à 3.20:1 sur surface.page (passe 1.4.11 avec marge ≥3:1). DESIGN.md (planning artifact) à corriger aussi en post-amendment, et CHANGELOG de tokens.ts à mettre à jour avec la nouvelle valeur.
2. **`input.tsx` resting hover : `#1a3a5c` → `#5e6b7e`** (text-muted, 5.01:1 — escalade hover/idle/focus claire : idle border=`#92897a` 3.20:1, hover border=`#5e6b7e` 5.01:1, focus=ring brand 0.45 + transparent border). Plus de collision avec focus state.
3. **CHANGELOG focus shadow wording** : remplacer "alpha 0.20 → 0.45" par "alpha 0.45 (NEW, AA-visible)" — le token `shadows.focus` n'existait pas en TS auparavant (le 0.20 affirmé venait du DESIGN.md draft, pas du code).

**Known-bad state avoided :**
- Un token de design system qui se prétend AA et ne l'est pas (auto-tromperie qui survivrait à toutes les revues visuelles).
- Un input dont l'utilisateur ne peut pas distinguer hover vs focus, casse l'affordance clavier.
- Un CHANGELOG techniquement faux affirmant une régression d'une valeur jamais codée.

**KEEP (must survive re-derivation) :**
- Les 7 autres hex shifts (`text.muted`, les 3 `status.{*}.fg`, les 3 `status.{*}.border`, `danger` button bg + hover) — vérifiés mathématiquement aux ratios annoncés.
- L'architecture **mist** (non-interactif, #e8e4dd) **vs mistStrong** (interactif, 1.4.11-compliant) — bonne séparation conceptuelle, à conserver.
- Les 2 nouveaux focus shadow tokens (`--shadow-focus` 0.45, `--shadow-focus-on-gold` 0.65) ET leur application conditionnelle dans `button.tsx` (variant === "gold" ? gold : default).
- L'update de `DOT_COLOR` map dans `badge.tsx`.
- Les CHANGELOG entries en tête de `tokens.ts` + `globals.css` — accurate sauf le wording focus et la valeur mistStrong à mettre à jour.
- Le passage `buttonVariants.outline` border `#e8e4dd` → `#c4bdb0` (devra devenir `#92897a` post-amendment).
- L'update `::-webkit-scrollbar-thumb:hover` vers `var(--surface-mist-strong)` (qui auto-bénéficiera du shift).

**Re-derivation instructions for step-03 :**
- Apply amendments 1–3 above. All other changes from iteration 1 are KEEP — surgical patch is acceptable; full revert is overkill for a 5-file refactor where 4/5 components are correct and only `tokens.ts` + `globals.css` + `input.tsx` need touch-up on the mistStrong hex.

## Design Notes

**Ratios validés (calculs WCAG, post-amendment v2) :**
- `#5e6b7e` sur `#f8f6f1` = 5.01:1 ✓ AA (recomputed — exceeds initial 4.55:1 estimate)
- `#15803d` sur `#dcfce7` = 4.57:1 ✓ AA
- `#b45309` sur `#fef3c7` = 4.66:1 ✓ AA
- `#b91c1c` sur `#fee2e2` = 5.34:1 ✓ AA (recomputed — exceeds 5.07:1)
- **`#92897a` sur `#f8f6f1` = 3.20:1 ✓ 1.4.11** (replaces invalid `#c4bdb0` which was 1.73:1)
- Focus ring `rgb(26 58 92 / 0.45)` sur `#f8f6f1` ≈ effective 3:1 ✓ visible

**Pourquoi garder `#e8e4dd` (mist faible) :** sépare encore des éléments internes non-interactifs (lignes de divider, hover discret) sans peser visuellement. AA ne l'exige pas car non-fonctionnel.

**Exemple de propagation `badge.tsx` :**
```tsx
const DOT_COLOR: Record<ComplianceStatus, string> = {
  green: "bg-[#15803d]",  // was #16a34a — AA on tinted bg
  amber: "bg-[#b45309]",  // was #d97706
  red:   "bg-[#b91c1c]",  // was #dc2626
};
```

## Verification

**Commands :**
- `cd apps/frontend && npm run build` — expected : exit 0, pas de warning Tailwind sur `surface-mist-strong` ou `shadow-focus*`
- `cd apps/frontend && npm run lint` — expected : zéro nouvelle erreur introduite par le diff

**Manual checks :**
- Démarrer le dev server (`preview_start frontend`), naviguer `/`, `/login`, `/contracts`, `/compliance` (si accessible). Vérifier au clavier que le focus reste visible sur tous les boutons et inputs.
- Inspecter un `<ComplianceBadge status="amber" />` : couleur texte = `#b45309` (rgb 180 83 9), pas l'ancien `#d97706`.
- Sur un input vide, le placeholder doit être lisible mais discret — pas un gris flagrant, pas invisible.

## Suggested Review Order

**Token source de vérité (point d'entrée)**

- Lis d'abord le CHANGELOG + valeurs canoniques — tout le reste en découle
  [`tokens.ts:9`](../../apps/frontend/src/styles/tokens.ts#L9)

**Propagation aux CSS custom properties (consommables Tailwind v4)**

- Vérifie que `@theme inline` reflète tokens.ts à l'identique
  [`globals.css:14`](../../apps/frontend/src/app/globals.css#L14)

- Idem pour `:root` (accès runtime / fallback non-Tailwind)
  [`globals.css:62`](../../apps/frontend/src/app/globals.css#L62)

**Application aux composants UI**

- Focus shadow conditionnel sur variante `gold` (AC-3)
  [`button.tsx:39`](../../apps/frontend/src/components/ui/button.tsx#L39)

- Resting border (mistStrong) + hover (text-muted) + error (b91c1c) — l'AC clé de l'iteration 2
  [`input.tsx:34`](../../apps/frontend/src/components/ui/input.tsx#L34)

- DOT_COLOR map mis à jour aux 3 valeurs AA
  [`badge.tsx:31`](../../apps/frontend/src/components/ui/badge.tsx#L31)

**Documentation des décisions**

- Le journal complet de l'itération (iter 1 → iter 2 amendments)
  [`spec-p1-tokens-aa.md`](./spec-p1-tokens-aa.md)

- Items déférés du sprint courant (status borders à arbitrer)
  [`deferred-work.md`](./deferred-work.md)
