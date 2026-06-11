import type { Page } from "@playwright/test";
import { TEST_USERS, type TestRole, type TestUser } from "../fixtures/test-users";

/**
 * Injecte un utilisateur de test dans la page avant le chargement React.
 *
 * Mécanisme :
 *   1. window.__TEST_MODE__ = true  → useEasyLawAuth retourne l'utilisateur mocké
 *   2. window.__TEST_USER__         → données du profil (rôle, nom, email…)
 *   3. localStorage.token           → satisfait le check AppShell (requireAuth)
 *   4. page.route /api/auth/profile → mock la réponse backend
 *
 * @param page     Playwright page
 * @param roleOrUser  Rôle (string) ou objet TestUser complet
 */
export async function loginAs(
  page: Page,
  roleOrUser: TestRole | TestUser,
): Promise<TestUser> {
  const user: TestUser =
    typeof roleOrUser === "string" ? TEST_USERS[roleOrUser] : roleOrUser;

  // Injecter avant que React ne monte
  await page.addInitScript((u) => {
    (window as any).__TEST_MODE__ = true;
    (window as any).__TEST_USER__ = u;
    localStorage.setItem("token", u.token);
  }, user);

  // Mocker GET /api/auth/profile
  await page.route("**/api/auth/profile", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, user }),
      });
    } else {
      // PUT /api/auth/profile — simuler la mise à jour
      const reqBody = route.request().postDataJSON() as { name?: string; lang?: string };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          user: { ...user, ...(reqBody ?? {}) },
        }),
      });
    }
  });

  // Mocker POST /api/auth/profile/export
  await page.route("**/api/auth/profile/export", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        exportData: { user, contracts: [], nif: [] },
      }),
    });
  });

  return user;
}

/**
 * Déconnecte l'utilisateur de test (nettoie le state injecté).
 */
export async function logoutTest(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__TEST_MODE__ = false;
    (window as any).__TEST_USER__ = undefined;
    localStorage.removeItem("token");
  });
}

/**
 * Cookie de consentement pré-rempli pour éviter que la bannière RGPD
 * ne bloque les interactions dans les tests.
 */
export const CONSENT_COOKIE = {
  name: "easylaw_consent_v1",
  value: encodeURIComponent(
    JSON.stringify({
      v: 1,
      necessary: true,
      analytics: true,
      marketing: true,
      personalization: true,
      ts: "2026-01-01T00:00:00.000Z",
    }),
  ),
  domain: "localhost",
  path: "/",
};
