---
title: 'P7 — Luso-Legal Chat Visual Redesign'
type: 'feature'
created: '2026-06-09'
status: 'done'
baseline_commit: 'ac4f784b4084d71aba5afbb876130b916e73d755'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La page `/assistant` utilise un shell visuel qui ne correspond pas au mock `05-luso-legal-chat.html` — header dark navy au lieu de blanc, bulles utilisateur en bleu marine au lieu de style clair, pas de sidebar threads, disclaimer éparpillé par message au lieu d'une barre persistante.

**Approach:** Redesign visuel de `apps/frontend/src/app/assistant/page.tsx` — layout `flex h-[calc(100vh-56px)] overflow-hidden`, sidebar threads statique placeholder (pas de nouvel endpoint), header blanc avec bouton gold, bulles utilisateur claires, barre disclaimer persistante — en conservant intégralement toute la logique existante (API, state, modal escalade).

## Boundaries & Constraints

**Always:**
- Toutes les couleurs via CSS vars — aucun hex hardcodé
- Logique existante préservée : `handleSendMessage`, `handleEscalate`, `initHistory`, les deux `useEffect`, modal escalade, `AuthGuard` + `AppShell` wrapper
- Tous les éléments interactifs keyboard-accessible (focus rings)
- TypeScript strict — aucun `any`
- Aucun nouveau package

**Ask First:**
- Si la sidebar threads doit montrer l'historique réel (via `messages` state) ou rester 100% statique

**Never:**
- Modifier les appels API (`/api/assistant/history`, `/api/assistant/chat`, `/api/assistant/escalate`)
- Supprimer `AuthGuard` ou `AppShell` — la page doit rester dans le shell applicatif
- Ajouter un endpoint pour les threads — la sidebar est un placeholder statique

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Sidebar usage meter | `messages` avec N messages user | Barre de progression `N/10`, texte "N questions ce mois sur 10 incluses" | — |
| "Nouvelle conversation" | Clic sidebar | `setMessages([])` — vide le chat en cours | — |
| Bulle utilisateur | Message role=user | Style clair `bg-surface-page border-surface-mist` (non dark navy) | — |
| Barre disclaimer | Toujours visible | Au-dessus de l'input, texte `t.disclaimer` | — |
| Modal escalade | Clic "Parler à un avocat" | Modal inchangé — même handler `handleEscalate` | — |

</frozen-after-approval>

## Code Map

- `apps/frontend/src/app/assistant/page.tsx` -- Seul fichier à modifier
- `_bmad-output/planning-artifacts/ux-designs/ux-easylaw-2026-06-09/.working/mocks/05-luso-legal-chat.html` -- Source of truth visuelle
- `apps/frontend/src/app/nif/page.tsx` -- Référence CSS vars + pattern top-bar (P5)

## Tasks & Acceptance

**Execution:**

- [x] `apps/frontend/src/app/assistant/page.tsx` -- Redesign visuel complet :

  **Layout racine** (remplacer `flex flex-col px-4…py-6 style={{height:calc(100vh-56px)}}`) :
  ```tsx
  <div className="flex h-[calc(100vh-56px)] overflow-hidden">
  ```

  **Sidebar threads** (nouveau, placeholder statique — `hidden lg:flex flex-col w-72 border-r border-surface-mist bg-surface-card`) :
  - Header sidebar : logo "E" (`bg-brand-primary rounded-md`) + "EasyLaw" Playfair + bouton "＋ Nouvelle conversation" (`w-full bg-brand-primary text-text-inverse rounded-md py-2 text-sm`) → `onClick={() => setMessages([])}` 
  - Liste threads : si `messages.length > 0` → un item actif (`border-l-[3px] border-brand-secondary bg-surface-page`) avec le 1er message tronqué ; sinon message vide `text-text-muted text-sm text-center py-4`
  - Usage meter (pied de sidebar) : `text-xs text-text-muted`, `"${userCount} questions ce mois sur 10 incluses"`, barre `h-1.5 rounded-full bg-surface-mist` avec fill `bg-brand-secondary width: ${userCount/10*100}%` — `userCount = Math.min(messages.filter(m => m.role === 'user').length, 10)`

  **Main area** (remplacer le wrapper chat existant) : `flex-1 flex flex-col min-w-0 overflow-hidden`

  **Header chat** (remplacer dark navy) — `border-b border-surface-mist bg-surface-card px-6 py-3 flex items-center justify-between shrink-0` :
  - Gauche : icône chat `w-8 h-8 rounded-full bg-brand-primary` + titre "Luso-Legal" `text-base font-semibold text-text-primary` + sous-titre `text-xs text-text-muted`
  - Droite : lang toggle (outline, kbd-accessible) + bouton "Parler à un avocat" `bg-brand-secondary text-text-primary rounded-md px-4 py-2 text-sm flex items-center gap-2` visible si `messages.length > 0` → `setShowEscalateModal(true)`

  **Messages area** — conserver le fond `bg-surface-page`, supprimer le header de section dark navy. Modifications de style bulle :
  - User messages : `bg-surface-page border border-surface-mist` (remplace `bg-brand-primary text-text-inverse`)
  - Texte user : `text-text-primary` (remplace `text-text-inverse`)
  - AI messages : inchangé (white card, border-surface-mist)
  - Supprimer le disclaimer italique `<p className="text-[10px] italic">` sous chaque message IA

  **Barre disclaimer persistante** — entre `messagesEndRef` et le form input, `shrink-0` :
  ```tsx
  <div className="border-t border-surface-mist px-4 lg:px-8 py-2 text-xs text-text-muted flex items-center gap-2 bg-surface-page shrink-0">
    <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
    <span>{t.disclaimer}</span>
  </div>
  ```

  **Input footer** — `border-t border-surface-mist bg-surface-card px-4 lg:px-8 py-4 shrink-0` :
  - Ajouter `max-w-[800px] mx-auto` autour du textarea + button
  - Conserver textarea, onKeyDown, send button, disabled logic (inchangés)

  **Banners success/error** — déplacer hors du flux principal vers le dessus de `<main>` (`shrink-0`), inchangées

  **Modal escalade** — inchangée (déjà bien implémentée)

**Acceptance Criteria:**
- Given page `/assistant` chargée, when aucune action, then sidebar `w-72` visible (lg+), header blanc, barre disclaimer visible au-dessus de l'input
- Given un message utilisateur envoyé, when rendu, then bulle utilisateur style clair (`bg-surface-page`) — non dark navy
- Given `messages.length === 1` (1 msg user), then usage meter affiche "1 question ce mois sur 10 incluses" + barre 10% remplie
- Given clic "Nouvelle conversation", then `messages` vidé, usage meter revient à 0
- Given clic "Parler à un avocat" (visible si messages > 0), then modal escalade s'ouvre (comportement inchangé)
- Aucune couleur hex hardcodée — grep = 0
- `tsc --noEmit` passe sans erreur

## Review Notes (step-04)

3 review subagents (adversarial, edge-case, a11y) ran post-implementation.

**Fixed:**
- [BUG] Keyboard hint said "Cmd/Ctrl+Enter" but handler fires on plain Enter — corrected to "Entrée pour envoyer · Shift+Entrée pour saut de ligne"
- [CRITICAL a11y] Modal opened without moving focus inside and had no Escape key handler — added `useEffect` + `modalCancelRef` for focus-on-open, `handleModalKeyDown` for Escape, click-outside backdrop div
- [BUG a11y] Modal textarea had no accessible label — added `aria-label`
- [BUG a11y] Typing indicator dots had no SR text — added `role="status"` + `aria-label` on the dots wrapper
- [MINOR] `<h1>` was overriding font with `--font-sans` — removed override (globals base styles apply Playfair Display automatically)
- [MINOR] Language toggle `aria-label` was hardcoded French — made dynamic (`"Changer de langue"` / `"Mudar idioma"`)
- [MINOR] History loading container missing `role="status"` — added

**Deferred (pre-existing / out of scope):**
- `rgba(0,0,0,0.45)` modal backdrop — no `--overlay-backdrop` token defined yet; deferred
- Optimistic message not rolled back on failure — pre-existing behaviour
- `AppShell requireAuth={false}` inside `AuthGuard` — pre-existing pattern

## Spec Change Log

## Design Notes

**Sidebar thread item actif :**
```tsx
<div className="px-3 py-2.5 rounded-md cursor-default"
  style={{ background: "var(--surface-page)", borderLeft: "3px solid var(--brand-secondary)" }}>
  <p className="font-medium text-sm truncate text-text-primary">
    {messages[0]?.content.slice(0, 40) || "Conversation en cours"}
  </p>
  <p className="text-xs text-text-muted truncate mt-0.5">{t.subtitle}</p>
</div>
```

**Icône chat SVG dans le header (pas d'import Lucide supplémentaire requis — utiliser `Bot` existant) :**
En fait, garder `Bot` de Lucide pour l'icône dans le header et les avatars messages.

## Verification

**Commands:**
- `cd apps/frontend && npx tsc --noEmit` -- expected: 0 erreurs
- `grep -n "#[0-9a-fA-F]\{3,6\}" apps/frontend/src/app/assistant/page.tsx` -- expected: 0 résultats
