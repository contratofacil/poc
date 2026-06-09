---
id: spec-p3.5-backend-rewiring
status: in-progress
created: 2026-06-09
---

# Spec P3.5 — Backend Re-wiring: Compliance Dashboard

## Goal

Re-connect the P3 visual compliance dashboard to the live `/api/compliance` backend, restoring
CRUD and email-alert features that were deferred in P3, and adding AML/KYC eIDV provider
configuration (D-013).

**Source of truth:** `_bmad-output/implementation-artifacts/deferred-work.md` §P3.5

---

## Context

| Layer | Current state (after P3) |
|---|---|
| `/compliance/page.tsx` | Reads `MOCK_OBLIGATIONS` (11 hardcoded items) |
| Backend `GET /api/compliance` | Exists but disconnected |
| Add / Delete / Toggle | Removed in P3 (deferred) |
| Email alerts log | Removed in P3 (deferred) |
| `ObligationCard` CTAs | `aria-disabled`, no `onClick` passed |

---

## Backend API contract (from pre-P3 page)

All calls hit `getApiUrl(path)` which resolves via `NEXT_PUBLIC_API_URL` or `localhost:3001`.

| Method | Path | Auth | Body / Query | Response |
|---|---|---|---|---|
| GET | `/api/compliance` | optional | `?user_id=` | `{ success, items: ComplianceItem[] }` |
| POST | `/api/compliance` | Bearer | `{ title, description, due_date, category, user_id }` | `{ success, item: ComplianceItem }` |
| PUT | `/api/compliance/:id` | Bearer | `{ status }` | `{ success, item: ComplianceItem }` |
| DELETE | `/api/compliance/:id` | Bearer | — | `{ success }` / 2xx |
| GET | `/api/compliance/alert-logs` | — | — | `{ success, logs: AlertLog[] }` |
| POST | `/api/compliance/simulate-alerts` | — | — | `{ success, logsGenerated: number }` |

### Backend types

```ts
interface ComplianceItem {
  id: string;
  title: string;
  description: string | null;
  due_date: string;           // "YYYY-MM-DD"
  status: "pending" | "completed";
  category: string;
  user_id: string | null;
  created_at: string;
  days_left: number;
  color: "red" | "orange" | "green";
}

interface AlertLog {
  id: string;
  compliance_item_id: string;
  recipient_email: string;
  subject: string;
  body: string;
  sent_at: string;            // ISO timestamp
}
```

### Backend → `Obligation` mapping

| Backend field | P3 `Obligation` field | Notes |
|---|---|---|
| `title` | `label` | `string` — valid `ReactNode` |
| `description \| null` | `description \| undefined` | null → undefined |
| `color` (orange/red/green) | `status` (amber/red/green) | "orange" → "amber" |
| `days_left` | `daysRemaining` | |
| `due_date` | `dueDate` | |
| `color === "red" && days_left <= 30` | `isUrgent` | |

---

## Files

### New files

| File | Purpose |
|---|---|
| `src/lib/compliance/api.ts` | Backend types + `mapItem` adapter + raw fetch helpers |
| `src/lib/compliance/useCompliance.ts` | `useCompliance()` hook — state + mutations |
| `src/components/compliance/AddObligationModal.tsx` | Add-obligation form modal |
| `src/components/compliance/ObligationDetailModal.tsx` | Detail view modal (onViewDetail) |
| `src/components/compliance/EmailAlertsLog.tsx` | Alerts log section |
| `src/components/compliance/EidvProviderSelector.tsx` | AML/KYC D-013 eIDV config card |

### Modified files

| File | Changes |
|---|---|
| `src/app/compliance/page.tsx` | Replace `MOCK_OBLIGATIONS` with `useCompliance()`, wire CTAs, add alerts log + eIDV section |
| `src/components/compliance/ObligationCard.tsx` | Add `onDelete` prop, enable all CTAs |
| `src/components/compliance/ObligationListItem.tsx` | Pass `onClick` from page |
| `src/lib/compliance/types.ts` | Export `ApiObligation` type alias |

---

## `useCompliance()` hook specification

```ts
interface UseComplianceReturn {
  obligations: Obligation[];
  alertLogs: AlertLog[];
  isLoading: boolean;
  error: string | null;
  add: (payload: AddObligationPayload) => Promise<void>;
  togglePrepared: (id: string, currentStatus: "pending" | "completed") => Promise<void>;
  remove: (id: string) => Promise<void>;
  simulateAlerts: () => Promise<{ logsGenerated: number }>;
  refresh: () => void;
}

interface AddObligationPayload {
  title: string;
  description?: string;
  due_date: string;          // "YYYY-MM-DD"
  category: string;
}
```

- Uses `useReducer` + `useEffect` (no external deps: no SWR, no React Query).
- Calls `apiFetch` from `src/lib/api.ts` for authenticated mutations.
- Plain `fetch(getApiUrl(...))` for unauthenticated reads (GET items, GET logs).
- On mount: fetches items + alert-logs concurrently with `Promise.all`.
- Optimistic update on `togglePrepared`: flips local status immediately, reverts on error.
- Optimistic update on `remove`: removes from list immediately, reverts on error.
- `add`: non-optimistic — awaits response and prepends new item, re-sorts by `due_date`.

---

## Component specifications

### `AddObligationModal`

- Triggered by the `+` Hero button in `compliance/page.tsx`.
- Native `<dialog>` element (`ref.current.showModal()`) — provides built-in focus trap + Escape close + `::backdrop`.
- Fields: Titre (required, text), Description (optional, textarea), Échéance (required, date input), Catégorie (select: Fiscal / Juridique / Social / Autre).
- Uses react-hook-form (already in deps) + zod for validation.
- On submit calls `useCompliance().add()`, closes on success.
- Styling: card in `var(--surface-page)`, labels `var(--text-primary)`, inputs border `var(--surface-mist-strong)`, submit button `var(--brand-primary)`.

### `ObligationDetailModal`

- Triggered by "Voir le détail" in `ObligationCard`.
- `<dialog>` element, shows full obligation info: label, description, due_date, status, days_left, category.
- Shows a "Marquer comme préparé / en attente" toggle button.
- Close button top-right.

### `EmailAlertsLog`

- Section rendered at the bottom of `compliance/page.tsx`.
- Heading `h2` with `Mail` icon, same styling as existing `h2` sections.
- List of `AlertLog` entries: `To:`, subject, body (pre-formatted), sent_at.
- "Simuler alertes" button calls `simulateAlerts()`, shows a toast/inline message.
- Max-height scrollable area.
- Empty state: "Aucune alerte envoyée."

### `EidvProviderSelector` (D-013)

- Section card at bottom of compliance page (below email alerts log).
- Heading "Configuration AML/KYC — Vérification d'identité".
- Radio group of 3 providers: Onfido, Veriff, Privy KYC.
- Each provider card shows: name, tagline, badge "Recommandé" on Privy KYC.
- Selection saved to `localStorage["easylaw_eidv_provider"]` (backend settings endpoint deferred — OQ-007 still open).
- Disclaimer: `Lei 83/2017` + "données conservées 7 ans".
- Hidden until the user expands (collapsible `<details>` or toggle button) to avoid cognitive overload.

### `ObligationCard` changes

- Add `onDelete?: () => void` prop.
- Add a "Supprimer" button (Trash2 icon, secondary/destructive style) in the CTA row.
- Remove `aria-disabled` from all buttons when their handler is defined.
- `onPrepare` (existing): opens `ObligationDetailModal` with the obligation.
- `onMarkPrepared` (existing): calls `togglePrepared(id, "pending")`.

---

## `compliance/page.tsx` changes

```tsx
const { obligations, alertLogs, isLoading, error, add, togglePrepared, remove, simulateAlerts } = useCompliance();

// Replace:
const all = MOCK_OBLIGATIONS;
// With:
const all = obligations;
```

Loading state: render existing layout skeleton (same sections, rows replaced by shimmer divs).
Error state: inline error banner (style matching message in original page — `status-red-bg / status-red`).

Hero `+` button: remove `aria-disabled`, attach `onClick={() => setShowAddForm(true)}`.

Pass to `ObligationCard`:
- `onMarkPrepared={() => togglePrepared(urgent.id, "pending")}`
- `onViewDetail={() => setDetailObligation(urgent)}`
- `onDelete={() => { if (confirm("Supprimer cette obligation ?")) remove(urgent.id); }}`

Pass to `ObligationListItem`:
- `onClick={() => setDetailObligation(o)}`

After list: `<EmailAlertsLog logs={alertLogs} onSimulate={simulateAlerts} />`
After alerts: `<EidvProviderSelector />` (collapsed by default).

Remove the `Données simulées · mock data MVP` label from the "État global" card header.

---

## Acceptance criteria

- [ ] AC-1 Page loads with live data from `GET /api/compliance` (no mock import).
- [ ] AC-2 Loading state shown while fetch is in-flight.
- [ ] AC-3 Error state shown if fetch fails (network error / non-2xx).
- [ ] AC-4 "Ajouter une obligation" button opens modal; form submits to `POST /api/compliance`; new item appears in list.
- [ ] AC-5 "Marquer comme préparé" on ObligationCard calls `PUT /api/compliance/:id` with `{ status: "completed" }`.
- [ ] AC-6 "Supprimer" (trash icon) shows browser confirm dialog then calls `DELETE /api/compliance/:id`; item removed from list.
- [ ] AC-7 "Voir le détail" opens ObligationDetailModal with full obligation data.
- [ ] AC-8 Email alerts log section renders below list; "Simuler alertes" button calls `POST /api/compliance/simulate-alerts`.
- [ ] AC-9 EidvProviderSelector renders collapsed; user can expand, select provider, selection persists in localStorage.
- [ ] AC-10 No hardcoded hex colors — all styling via CSS var tokens.
- [ ] AC-11 All interactive elements keyboard-accessible (Tab/Enter/Escape on modals).
- [ ] AC-12 TypeScript strict — no `any`, no `@ts-ignore`.
- [ ] AC-13 No new packages added to `package.json`.

---

## Out of scope for P3.5

- Pagination / infinite scroll on obligations list (VISIBLE_LIMIT stub stays).
- Full eIDV widget integration (Onfido/Veriff SDK) — UI config only.
- PEP screening flow.
- `/compliance/settings` sub-route.

---

## Spec change log

| Date | Change |
|---|---|
| 2026-06-09 | Initial spec created |
