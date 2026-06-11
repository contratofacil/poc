/**
 * Comptes de test EasyLaw — un par rôle.
 * Ces comptes sont utilisés par les tests Playwright via le mécanisme
 * window.__TEST_MODE__ / window.__TEST_USER__ (voir src/lib/privy/hooks.ts).
 *
 * En développement, les créer dans la base SQLite via :
 *   cd services/auth && npx tsx seed-test-users.ts
 */

export type TestRole =
  | "super_admin"
  | "admin"
  | "cabinet_avocat"
  | "avocat"
  | "avocat_associe"
  | "juriste"
  | "salarie"
  | "assistant";

export interface TestUser {
  id: string;
  email: string;
  name: string;
  role: TestRole;
  lang: "FR" | "PT" | "EN";
  is_verified: 1;
  created_at: string;
  /** JWT factice pour les tests — le backend est mocké, la signature n'est pas validée */
  token: string;
  /** Mot de passe clair pour la documentation / seed manuel */
  password: string;
}

const BASE_DATE = "2026-01-15T09:00:00.000Z";

// Token factice — format JWT valide mais non vérifié (backend est mocké dans les tests)
function mockToken(role: string): string {
  const header  = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ id: `test-${role}-id`, email: `${role}@test.easylaw.pt`, role, iat: 1700000000, exp: 9999999999 })).toString("base64url");
  return `${header}.${payload}.test_signature_playwright`;
}

export const TEST_USERS: Record<TestRole, TestUser> = {
  super_admin: {
    id: "test-super-admin-id",
    email: "superadmin@test.easylaw.pt",
    name: "Alice Fontaine",
    role: "super_admin",
    lang: "FR",
    is_verified: 1,
    created_at: BASE_DATE,
    token: mockToken("super_admin"),
    password: "SuperAdmin123!",
  },
  admin: {
    id: "test-admin-id",
    email: "admin@test.easylaw.pt",
    name: "Bruno Pereira",
    role: "admin",
    lang: "FR",
    is_verified: 1,
    created_at: BASE_DATE,
    token: mockToken("admin"),
    password: "Admin123!",
  },
  cabinet_avocat: {
    id: "test-cabinet-id",
    email: "cabinet@test.easylaw.pt",
    name: "Cabinet Oliveira",
    role: "cabinet_avocat",
    lang: "PT",
    is_verified: 1,
    created_at: BASE_DATE,
    token: mockToken("cabinet_avocat"),
    password: "Cabinet123!",
  },
  avocat: {
    id: "test-avocat-id",
    email: "avocat@test.easylaw.pt",
    name: "Maître Sofia Silva",
    role: "avocat",
    lang: "PT",
    is_verified: 1,
    created_at: BASE_DATE,
    token: mockToken("avocat"),
    password: "Avocat123!",
  },
  avocat_associe: {
    id: "test-avocat-associe-id",
    email: "associe@test.easylaw.pt",
    name: "Maître João Costa",
    role: "avocat_associe",
    lang: "PT",
    is_verified: 1,
    created_at: BASE_DATE,
    token: mockToken("avocat_associe"),
    password: "Associe123!",
  },
  juriste: {
    id: "test-juriste-id",
    email: "juriste@test.easylaw.pt",
    name: "Dr. Ana Santos",
    role: "juriste",
    lang: "FR",
    is_verified: 1,
    created_at: BASE_DATE,
    token: mockToken("juriste"),
    password: "Juriste123!",
  },
  salarie: {
    id: "test-salarie-id",
    email: "salarie@test.easylaw.pt",
    name: "Jean Dupont",
    role: "salarie",
    lang: "FR",
    is_verified: 1,
    created_at: BASE_DATE,
    token: mockToken("salarie"),
    password: "Salarie123!",
  },
  assistant: {
    id: "test-assistant-id",
    email: "assistant@test.easylaw.pt",
    name: "Marie Ferreira",
    role: "assistant",
    lang: "PT",
    is_verified: 1,
    created_at: BASE_DATE,
    token: mockToken("assistant"),
    password: "Assistant123!",
  },
};

export const ROLE_LABELS: Record<TestRole, string> = {
  super_admin:    "Super Administrateur",
  admin:          "Administrateur",
  cabinet_avocat: "Cabinet Avocat",
  avocat:         "Avocat",
  avocat_associe: "Avocat Associé",
  juriste:        "Juriste",
  salarie:        "Salarié",
  assistant:      "Assistant",
};

/** Rôles qui peuvent accéder au dashboard admin */
export const ADMIN_ROLES: TestRole[] = ["super_admin", "admin", "cabinet_avocat"];

/** Rôles qui peuvent accéder à la recherche juridique */
export const RESEARCH_ROLES: TestRole[] = [
  "super_admin", "admin", "cabinet_avocat",
  "avocat", "avocat_associe", "juriste",
];

/** Rôles sans accès aux pages pro */
export const BASIC_ROLES: TestRole[] = ["salarie", "assistant"];
