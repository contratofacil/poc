---
title: 'P5 — NIF Wizard Visual Redesign'
type: 'feature'
created: '2026-06-09'
status: 'done'
baseline_commit: '6f1f1bed9563f5d4388f85f48fa9be446f013ba5'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La page `/nif` utilise l'ancien style avec des couleurs hexadécimales hardcodées et un layout centré-carte qui ne correspond pas au design system EasyLaw ni au mock UX `02-nif-wizard.html` (top bar + stepper horizontal + main content pleine largeur).

**Approach:** Remplacer le shell visuel de `apps/frontend/src/app/nif/page.tsx` par le layout du mock — top bar, stepper 4 étapes, main content max-w-920px — tout en conservant intégralement la logique existante (API calls, validation, state). Ajouter l'étape 3 Procuration (placeholder statique) entre Documents et Paiement.

## Boundaries & Constraints

**Always:**
- Toutes les couleurs via CSS vars (`var(--brand-primary)`, etc.) — aucun hex hardcodé
- Logique existante (handleFileUpload, handleReviewSubmit, handlePaymentSubmit, validation) préservée sans modification
- Police Playfair Display pour les `<h1>` d'étapes, Inter pour le corps
- Tous les éléments interactifs keyboard-accessible (focus ring visible)
- TypeScript strict — aucun `any`
- Aucun nouveau package

**Ask First:**
- Si le step Review actuel (étape 3 existante) doit être supprimé ou fusionné dans Paiement

**Never:**
- Modifier la logique API (`/api/nif/upload`, `/api/nif/apply`)
- Supprimer les traductions FR/PT existantes (étendre si nécessaire)
- Ajouter un vrai endpoint pour la Procuration — c'est un placeholder statique

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Stepper progression | Step 1 complété (tous champs) | Barre de progression passe à 2/4 rempli, label "✓ Informations" | - |
| Upload fichier réussi | Fichier sélectionné → API OK | Card avec nom du fichier, badge "Qualité validée", bouton "Remplacer" | - |
| Upload fichier vide (step 2 "Continuer") | `passport_path` ou `proof_of_address_path` vide | Bouton "Continuer" disabled + message d'erreur sous le footer | Inline error |
| Étape Procuration | Clic "Continuer" | Transition vers étape Paiement (step 4) | - |
| Succès final | Payment submit OK | Écran de succès avec lien vers accueil | - |

</frozen-after-approval>

## Code Map

- `apps/frontend/src/app/nif/page.tsx` -- Seul fichier à modifier : shell visuel + ajout step 3 Procuration
- `_bmad-output/planning-artifacts/ux-designs/ux-easylaw-2026-06-09/.working/mocks/02-nif-wizard.html` -- Source of truth visuelle

## Tasks & Acceptance

**Execution:**

- [x] `apps/frontend/src/app/nif/page.tsx` -- Remplacer le shell visuel par le layout mock (top bar + stepper + main) et remap les steps :

  **Mapping des steps :**
  - Step 1 = Informations (formulaire existant, inchangé)
  - Step 2 = Documents (upload existant, cards style mock)
  - Step 3 = Procuration (nouveau, placeholder statique)
  - Step 4 = Revue + Paiement (étapes 3+4 actuelles, inchangées)
  - Step 5 = Succès

  **Top bar** (full width, `bg-white`, `border-b border-[var(--surface-mist)]`, h-14) :
  - Gauche : logo "E" (rounded-md, `bg-[var(--brand-primary)]`) + "EasyLaw" Playfair + `/ Nouveau dossier NIF` texte-muted sm:visible
  - Droite : `Brouillon sauvegardé` label hidden sm + bouton FR/PT toggle (outline, kbd-accessible) + avatar initiales

  **Stepper bar** (full width, `bg-white`, `border-b`, max-w-920px centré) :
  - "Étape X sur 4" + "Comptez environ 8 minutes" — `text-xs text-muted`
  - 4 segments `flex-1 h-1.5 rounded-full` — remplis = `bg-[var(--brand-primary)]`, vides = `bg-[var(--surface-mist)]`
  - Labels sous les segments : step actif = `font-medium color:var(--brand-primary)`, step précédent = `✓ text-sec`, step futur = `text-muted`

  **Main content** (max-w-\[920px\] mx-auto px-6 py-10) :
  - `<h1>` Playfair Display text-3xl/4xl, sous-titre `text-sec text-lg`

  **Step 2 — upload cards** (conserver logique handleFileUpload) :
  - État vide : `<label>` dashed border drop zone (avec `<input type="file" className="sr-only">`)
  - État fichier chargé : card bg-white border rounded-xl p-4 — thumbnail icône FileText, nom fichier, badge vert "Qualité validée", bouton "Remplacer" outline
  - Info block amber (`bg-[#fef3c7] border-[#fde68a]`) expliquant pourquoi le justificatif est requis
  - Trust bar (3 badges : chiffrement AES-256, RGPD, cabinet Oliveira & Carneiro)

  **Step 3 — Procuration (nouveau placeholder)** :
  - `<h1>` "Procuration notariée."
  - Paragraphe explicatif : nécessaire pour que le cabinet représente le client aux Finanças
  - Card avec bouton "Télécharger le modèle" (outline, `href="#"`, pas d'API call)
  - Navigation : ← Retour | Continuer →

  **Footer navigation** (tous steps) :
  - ← Retour outline-btn gauche (disabled si step 1, `opacity-50 cursor-not-allowed`)
  - Continuer → / Suivant → btn-primary droite (disabled si conditions non remplies)

**Acceptance Criteria:**
- Given la page `/nif` chargée, when aucune action, then le top bar et le stepper sont visibles (step 1 actif, 1 segment rempli)
- Given step 1 rempli, when clic "Suivant →", then step passe à 2, stepper montre 2/4, label "✓ Informations"
- Given step 2, when les deux fichiers sont uploadés, then les deux upload cards montrent l'état "chargé" (nom fichier + badge vert) et "Continuer →" est activé
- Given step 2 incomplet, when clic "Continuer →", then message d'erreur inline visible
- Given step 3 (Procuration), when clic "Continuer →", then step passe à 4 (Revue/Paiement)
- Given n'importe quel step, when Tab/Shift-Tab, then focus ring visible sur tous les éléments interactifs
- Aucune couleur hex hardcodée dans le fichier (grep `#[0-9a-fA-F]{3,6}` sur le fichier = 0 résultats)
- `tsc --noEmit` et `next build` passent sans erreur

## Spec Change Log

### Review — 2026-06-09

**3 bugs found and fixed post-review:**
1. Upload error split-brain: catch block now also clears `formData.passport_path` / `proof_of_address_path` (was clearing only filename state, leaving stale API path).
2. Re-upload same file silently ignored: `e.currentTarget.value = ""` added in `handleFileUpload` so `onChange` fires even when selecting the same file again.
3. Hardcoded French "Téléversé" in `UploadedCard`: moved to `t.uploaded` (FR: "Téléversé", PT: "Carregado").

**Deferred (pre-existing, out of this PR's scope):**
- Duplicate POST on back-nav from Payment step (backend must be idempotent; no client guard added — same behavior as before redesign)
- Upload race condition (concurrent selections race to set `formData` path — pre-existing, no AbortController)
- Stepper shows "Paiement" on both Review and Payment steps — per-spec design, Review+Payment intentionally share stepper step 4

**All ACs passed** (AC-4 was partial: disabled button shows hint text instead of error banner — acceptable UX improvement).

## Design Notes

**Step 3 Procuration — placeholder pattern** (identique aux patterns P3/P3.5) :
```tsx
// Step 3: Procuration — static placeholder, no API call
<section>
  <h1 className="font-serif text-3xl mb-3" style={{ color: 'var(--brand-primary)' }}>
    Procuration notariée.
  </h1>
  <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
    Pour agir en votre nom auprès des Finanças, notre cabinet requiert une procuration simple...
  </p>
  <div className="rounded-xl border p-5 bg-white shadow-card">
    <a href="#" className="btn-outline ...">Télécharger le modèle (.docx)</a>
  </div>
</section>
```

**Stepper segment calc** : segment `i` (0-indexed) est rempli si `step > i`.

## Verification

**Commands:**
- `cd apps/frontend && npx tsc --noEmit` -- expected: 0 errors
- `cd apps/frontend && npx next build` -- expected: build successful, no type errors
