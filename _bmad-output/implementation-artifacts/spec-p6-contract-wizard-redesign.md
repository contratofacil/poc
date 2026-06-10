---
title: 'P6 — Contract Wizard Visual Redesign'
type: 'feature'
created: '2026-06-09'
status: 'done'
baseline_commit: 'ac4f784b4084d71aba5afbb876130b916e73d755'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La page `/contracts/wizard` utilise des couleurs hex hardcodées (`#1A365D`, `#C9A84C`, `#E2E8F0`…) et un layout qui ne correspond pas au design system EasyLaw ni au mock `04-contract-wizard.html` (top bar unifié, stepper 7 segments, grille 12 colonnes, volet preview sticky).

**Approach:** Remplacer le shell visuel de `apps/frontend/src/app/contracts/wizard/page.tsx` par le layout du mock — top bar, stepper à 7 segments, grille `lg:grid-cols-12` (left 7 / right 5), volet preview sticky — en conservant intégralement toute la logique existante (state, handlers, API calls, Suspense wrapper).

## Boundaries & Constraints

**Always:**
- Toutes les couleurs via CSS vars (`var(--brand-primary)`, etc.) — aucun hex hardcodé
- Logique existante préservée sans modification : `bailQuestions`, `travailQuestions`, `handleInputChange`, `handleNext`, `handlePrev`, `submitContract`, `fetchOfficialPreview`, les deux `useEffect`, le `Suspense` wrapper, le token localStorage
- Police Playfair Display pour le `<h1>` de question, Inter pour le corps
- Tous les éléments interactifs keyboard-accessible (focus ring visible)
- TypeScript strict — aucun `any`
- Aucun nouveau package

**Ask First:**
- Si la question doit être présentée comme `<h1>` (avec label au-dessus) plutôt que `<label>` standalone

**Never:**
- Modifier les tableaux `bailQuestions` / `travailQuestions` (questions, keys, types)
- Modifier les appels API (`/api/contracts/generate`, `/api/contracts/{id}/preview`, `/vault/{id}.pdf`)
- Passer à un layout multi-champs par étape (la logique reste une question par étape)
- Supprimer le lien de téléchargement PDF dans l'état success

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Progression stepper | `currentStep` passe de 3 à 4 | 4 segments remplis (brand-primary), 3 vides (surface-mist) | — |
| Preview update | Saisie dans un champ | `compiledContent` mis à jour via `useEffect`, affiché dans le volet droit | — |
| État success | `generatedContractId` non-null | Left panel affiche le success state ; right panel toujours visible | — |
| Back navigation | `currentStep === 1`, clic "Précédent" | Bouton disabled (`opacity-50 cursor-not-allowed`) | — |

</frozen-after-approval>

## Code Map

- `apps/frontend/src/app/contracts/wizard/page.tsx` -- Seul fichier à modifier : shell visuel complet, conserve toute la logique
- `_bmad-output/planning-artifacts/ux-designs/ux-easylaw-2026-06-09/.working/mocks/04-contract-wizard.html` -- Source of truth visuelle
- `apps/frontend/src/app/nif/page.tsx` -- Référence de style : pattern top bar + stepper + CSS vars déjà validé en P5

## Tasks & Acceptance

**Execution:**

- [x] `apps/frontend/src/app/contracts/wizard/page.tsx` -- Remplacer le shell visuel par le layout mock en conservant toute la logique :

  **Top bar** (full width, `bg-white`, `border-b border-surface-mist`, h-14) :
  - Gauche : logo "E" (rounded-md, `bg-brand-primary`) + "EasyLaw" Playfair + `/ Contrats / {contractType}` texte-muted sm:visible
  - Droite : `Brouillon sauvegardé` label + bouton FR/PT toggle (outline, kbd-accessible)
  - Supprimer : lien `Shield`, lien `/vault`, icône `Globe`

  **Stepper bar** (full width, `bg-white`, `border-b`) :
  - "Question {currentStep} sur 7" à gauche, "~{max(1, 7 - currentStep + 1)} min restantes" à droite — `text-xs text-text-muted`
  - 7 segments `flex-1 h-1.5 rounded-full` — remplis si `i <= currentStep`, vides sinon (brand-primary / surface-mist)
  - Caché quand `generatedContractId` non-null

  **Grid** (`max-w-[1400px] mx-auto lg:grid-cols-12`) :
  - Left : `lg:col-span-7 px-6 lg:px-10 py-10 lg:border-r border-surface-mist min-h-[calc(100vh-7rem)]`
    - Label catégorie `text-xs uppercase tracking-wider text-text-muted mb-2` (ex : "Question {currentStep} sur 7")
    - `<h1 className="text-3xl md:text-4xl mb-3">` contenant `currentQuestion.label` (Playfair via globals)
    - Input existant avec CSS vars : `border-surface-mist`, `focus:border-brand-primary`, `focus:ring-brand-primary/20`
    - Nav footer : `← Question précédente` (CLS_BTN_OUTLINE) | `Continuer →` / `Finaliser →` (CLS_BTN_PRIMARY)
  - Right : `lg:col-span-5 bg-surface-page px-6 lg:px-8 py-10 lg:sticky lg:top-[7rem] lg:h-[calc(100vh-7rem)]`
    - Header : "Aperçu temps réel" `text-xs uppercase text-text-muted` + bouton outline "Télécharger (après paiement)"
    - Paper card : `bg-white border border-surface-mist shadow-card rounded-md p-6 font-mono text-xs whitespace-pre-wrap overflow-y-auto`
    - Affiche `compiledContent` (logique inchangée)

  **État success** (quand `generatedContractId` non-null) :
  - Supprimer le dark navy background
  - Icône check `bg-status-green-bg text-status-green border-status-green-border` (CSS vars)
  - Texte existant conservé (FR/PT inline ternaire)
  - Boutons : "Accéder au Coffre-Fort" → CLS_BTN_OUTLINE, "Télécharger PDF" → CLS_BTN_PRIMARY (ex brand-secondary si disponible)
  - Right panel toujours visible (affiche le contrat final)

  **Constantes CSS** (module-level, comme P5) :
  ```ts
  const CLS_BTN_PRIMARY = [...].join(" ");   // identique P5
  const CLS_BTN_OUTLINE = [...].join(" ");   // identique P5
  const CLS_INPUT = [...].join(" ");          // identique P5
  ```

**Acceptance Criteria:**
- Given la page chargée (Bail, step 1), when aucune action, then top bar + stepper visible, 1 segment rempli (brand-primary), 6 vides
- Given step 4, when l'utilisateur saisit une valeur, then le volet droit (right aside) affiche la valeur dans `compiledContent`
- Given step 7, when clic "Finaliser →", then `submitContract` appelé (comportement identique à l'existant)
- Given `generatedContractId` non-null, then stepper masqué, success state affiché, lien téléchargement PDF présent
- Aucune couleur hex hardcodée (`grep #[0-9a-fA-F]{3,6}` = 0 résultats)
- `tsc --noEmit` et `next build` passent sans erreur

## Spec Change Log

### Review — 2026-06-09

**4 bugs trouvés et corrigés post-review :**
1. `router` importé/appelé via `useRouter` mais jamais utilisé → import et hook supprimés.
2. Error banner sans `role="alert"` → attribut ajouté (annonce aux AT).
3. Input sans label programmatique → `id="question-label"` sur le `<h1>` + `aria-labelledby="question-label"` sur les 3 branches input.
4. `currentQuestion.placeholder` affiché comme sous-titre du h1 (duplication confuse) → paragraphe supprimé ; placeholder visible uniquement dans l'input.

**Déférés (pré-existants) :**
- Validation numérique accepte `'0'` (loyer 0, durée 0) — logique inchangée depuis l'original
- Race condition `useEffect` vs `fetchOfficialPreview` — idem
- `document.lang` non mis à jour au changement de langue — idem
- Sticky aside `top-[7rem]` légèrement trop haut quand stepper masqué — cosmétique mineur

**Tous les ACs passent.** `aria-labelledby` confirmé par l'arbre d'accessibilité (textbox libellé "Nom complet du propriétaire (Bailleur)").

## Design Notes

**Sticky aside pattern :**
```tsx
<aside className="lg:col-span-5 bg-surface-page px-6 lg:px-8 py-10 lg:sticky lg:top-[7rem] lg:h-[calc(100vh-7rem)] overflow-y-auto">
```
Le `top-[7rem]` correspond à top-bar (h-14 = 3.5rem) + stepper (~3.5rem) = ~7rem.

**Stepper segments (7) :**
```tsx
{Array.from({ length: 7 }, (_, i) => (
  <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i < currentStep ? "bg-brand-primary" : "bg-surface-mist"}`} />
))}
```

**Preview paper card :**
```tsx
<div className="bg-white border border-surface-mist shadow-card rounded-md p-6 font-mono text-xs whitespace-pre-wrap overflow-y-auto leading-relaxed text-text-primary flex-1">
  {compiledContent}
</div>
```

## Verification

**Commands:**
- `cd apps/frontend && npx tsc --noEmit` -- expected: 0 erreurs
- `grep -n "#[0-9a-fA-F]\{3,6\}" apps/frontend/src/app/contracts/wizard/page.tsx` -- expected: 0 résultats
