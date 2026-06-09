---
baseline_commit: fe0ad75a0bb762755a3b9479c3f36a2b34743d07
---

# Story 17-1 : Auth Privy — Migration de l'authentification

Status: review

## Story

En tant qu'utilisateur EasyLaw,
Je veux me connecter via Privy (email OTP, Google, passkey…)
Afin de pouvoir accéder à mon espace sans gérer un mot de passe supplémentaire.

## Acceptance Criteria

1. La page `/register` est remplacée par une page d'auth Privy qui déclenche le modal Privy.
2. Les pages `/profile`, `/contracts`, `/vault` utilisent `useEasyLawAuth()` au lieu de l'ancien `useAuth()`.
3. Les pages protégées affichent un prompt de connexion si l'utilisateur n'est pas authentifié (via `AuthGuard`).
4. Le token Privy (`getAccessToken()`) est transmis en `Authorization: Bearer` aux appels API backend.
5. L'ancien `AuthContext` (localStorage JWT) n'est plus utilisé dans les pages applicatives.

## Tasks / Subtasks

- [x] T1 — Exposer `getAccessToken` dans `useEasyLawAuth` (AC: 4)
  - [x] Ajouter `getAccessToken` depuis `usePrivy()` dans le hook `useEasyLawAuth`
- [x] T2 — Remplacer `/app/register/page.tsx` par une page Privy (AC: 1)
  - [x] Page bilingue (FR/PT) avec bouton "Se connecter / S'inscrire" déclenchant `login()` Privy
  - [x] Redirection vers `/` après connexion réussie
- [x] T3 — Migrer `/app/profile/page.tsx` vers Privy (AC: 2, 3, 4, 5)
  - [x] Remplacer `useAuth()` par `useEasyLawAuth()` + `getAccessToken()`
  - [x] Envelopper la page dans `AuthGuard`
- [x] T4 — Migrer `/app/contracts/page.tsx` vers Privy (AC: 2, 3, 4, 5)
  - [x] Remplacer `useAuth()` par `useEasyLawAuth()` + `getAccessToken()`
  - [x] Envelopper la page dans `AuthGuard`
- [x] T5 — Migrer `/app/vault/page.tsx` vers Privy (AC: 2, 3, 4, 5)
  - [x] Remplacer `useAuth()` par `useEasyLawAuth()` + `getAccessToken()`
  - [x] Envelopper la page dans `AuthGuard`

## Dev Notes

### Architecture
- `PrivyProvider` est déjà en place dans `apps/frontend/src/app/providers.tsx`
- Config Privy : `src/lib/privy/config.ts` (email, SMS, passkey, Google, LinkedIn)
- Hooks : `src/lib/privy/hooks.ts` → `useEasyLawAuth`, `useDocumentWallet`, `useUserIdentity`
- Composants : `src/components/auth/AuthGuard.tsx`, `src/components/auth/LoginButton.tsx`
- Ancien système : `src/contexts/AuthContext.tsx` (localStorage JWT) → à abandonner dans les pages

### Pattern de migration
```tsx
// AVANT
const { token, isAuthenticated, logout } = useAuth();
// ... appel API avec token

// APRÈS
const { authenticated, logout, getAccessToken } = useEasyLawAuth();
const token = await getAccessToken();
// ... appel API avec token Privy
```

### Notes importantes
- `getAccessToken()` est async — appeler dans les `useEffect` ou handlers d'événements
- Le backend (`services/auth`) utilise son propre JWT ; les appels backend recevront le token Privy
  comme Bearer — le backend doit valider avec `verifyPrivyToken` (déjà dans `src/lib/privy/server.ts`)
- Pour cette story, on ne modifie pas le backend : les pages continuent d'appeler le même endpoint
  mais avec le token Privy plutôt que le JWT localStorage

## Dev Agent Record

### Implementation Plan
Migrer les 3 pages applicatives et la page register vers Privy auth.
Approche : hook-first (exposer getAccessToken) puis page par page.

### Debug Log

### Completion Notes
- T1 : `getAccessToken` exposé via `useEasyLawAuth()` (hooks.ts)
- T2 : `/register` remplacé par page Privy — bouton "Continuer" déclenche modal Privy, redirect `/` post-login
- T3 : `/profile` migré vers Privy — `ProfileContent` + `AuthGuard` wrapper, token async dans tous les appels API
- T4 : `/contracts` migré vers Privy — suppression du localStorage fallback, `AuthGuard` wrapper
- T5 : `/vault` migré vers Privy — token async dans fetchVaultData, `AuthGuard` wrapper
- Build Next.js ✅ sans erreur TypeScript
- Page /register vérifiée visuellement dans le preview

## File List

- `apps/frontend/src/lib/privy/hooks.ts` (modifié)
- `apps/frontend/src/app/register/page.tsx` (remplacé)
- `apps/frontend/src/app/profile/page.tsx` (modifié)
- `apps/frontend/src/app/contracts/page.tsx` (modifié)
- `apps/frontend/src/app/vault/page.tsx` (modifié)
- `_bmad-output/implementation-artifacts/17-1-auth-privy.md` (créé)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modifié)

## Change Log

- 2026-06-09 : Story implémentée — migration auth Privy sur 3 pages + nouvelle page /register (all tasks done)
