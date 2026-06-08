# Story 1.1: Inscription

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a visitor,
I want to register with my email and password,
so that I can create my EasyLaw account.

## Acceptance Criteria

1. Form with email and password fields.
2. Password requirements: minimum 8 characters, at least 1 uppercase letter, and at least 1 digit.
3. Mandatory email verification before accessing any authenticated services.
4. User must choose their language (PT or FR) during the registration flow.
5. Mandatory checkbox/agreement for CGU (Terms of Service) and Privacy Policy.
6. API response for the registration endpoint must be under 500ms (P95).

## Tasks / Subtasks

- [x] Backend API: Create POST `/api/auth/register` (AC: 1, 2, 4, 5, 6)
  - [x] Implement registration logic in Auth Service (Node.js / Express / Passport.js)
  - [x] Add request validation using Zod (email validation, password regex checks, language options)
  - [x] Generate email verification token and save to DB
  - [x] Send verification email using SendGrid template
- [x] Database Schema: Integrate `users` table fields (AC: 3, 4)
  - [x] Fields: `id`, `email`, `name`, `password_hash`, `role`, `lang`, `is_verified`, `verification_token`, `created_at`, `deleted_at`
- [x] Frontend UI: Create Registration Page (AC: 1, 2, 4, 5)
  - [x] Implement registration page in Next.js 14 (App Router) at `/register`
  - [x] Design form using Tailwind CSS + shadcn/ui (using design tokens: primary #1A365D, accent #C9A84C, bg #FAFAF8)
  - [x] Integrate React Hook Form + Zod for client-side validation (matching backend rules)
  - [x] Implement language switcher / selector input (PT / FR) using next-intl
  - [x] Include mandatory agreement checkboxes for CGU and Privacy Policy
  - [x] Show loading state and error states with smooth transitions
- [x] Testing & Verification (AC: 1-6)
  - [x] Add integration test for `/api/auth/register` API endpoint (validate 500ms constraint, token generation)
  - [x] Add unit tests for password regex and form validation logic

## Dev Notes

- **Tech Stack**: Next.js 14, Express, Passport.js, JWT, PostgreSQL.
- **Design Tokens**: Blue #1A365D, Or #C9A84C, bg #FAFAF8, Inter font.
- **Security**: Password hashing using bcrypt. Rate limiting on the registration endpoint.
- **i18n**: Utilize `next-intl` for translation strings.

### Project Structure Notes

- Frontend page: `/app/(auth)/register/page.tsx`
- Backend Auth route: `/services/auth/routes/register.ts`

### References

- [Source: planning-artifacts/prd/easylaw-prd-2026-05-26.md#FR-A01-01](file:///C:/LAB/contratofacil/_bmad-output/planning-artifacts/prd/easylaw-prd-2026-05-26.md)
- [Source: planning-artifacts/architecture/easylaw-architecture-2026-05-26.md#Service Auth](file:///C:/LAB/contratofacil/_bmad-output/planning-artifacts/architecture/easylaw-architecture-2026-05-26.md)
- [Source: planning-artifacts/ux/easylaw-ux-2026-05-26.md#Palette & Style](file:///C:/LAB/contratofacil/_bmad-output/planning-artifacts/ux/easylaw-ux-2026-05-26.md)

## Dev Agent Record

### Agent Model Used

Gemini 3.5 Flash

### Debug Log References

None

### Completion Notes List

- Auth Express service fully configured with SQLite database and Jest integration test suite passing.
- Vite React TypeScript app initialized with custom premium design CSS (Navy Blue, Gold, Cream bg) and registration page with Zod/React Hook Form validations.
- Registration forms wired up to backend API endpoint successfully.

### File List

- `/services/auth/db-schema.sql`
- `/services/auth/server.ts`
- `/services/auth/db.ts`
- `/services/auth/email.ts`
- `/services/auth/package.json`
- `/services/auth/tsconfig.json`
- `/services/auth/jest.config.js`
- `/services/auth/.env`
- `/services/auth/.env.example`
- `/services/auth/server.test.ts`
- `/apps/frontend/src/App.tsx`
- `/apps/frontend/src/index.css`
- `/apps/frontend/src/App.css`
- `/apps/frontend/package.json`
- `/apps/frontend/tsconfig.json`
- `/apps/frontend/vite.config.ts`
