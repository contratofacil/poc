import { test, expect } from "@playwright/test";
import { loginAs, CONSENT_COOKIE } from "./utils/auth-helper";
import {
  ADMIN_ROLES,
  RESEARCH_ROLES,
  BASIC_ROLES,
  type TestRole,
} from "./fixtures/test-users";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function mockAdminApis(page: import("@playwright/test").Page) {
  await page.route("**/api/admin/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, users: [], clauses: [], settings: [], data: {} }),
    });
  });
  await page.route("**/api/admin/stats**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        users: { total: 0, new: 0, verified: 0, byRole: {} },
        nif: { total: 0, new: 0, byStatus: {}, conversionRate: 0 },
        payments: { totalRevenue: 0, paidCount: 0, pendingCount: 0, byProduct: {} },
        contracts: { total: 0, new: 0, byType: {} },
        assistant: { totalMessages: 0, escalations: { pending: 0, assigned: 0, closed: 0 } },
        compliance: { green: 0, orange: 0, red: 0, total: 0 },
        vault: { totalDocuments: 0, totalSizeBytes: 0 },
        recentActions: [],
      }),
    });
  });
}

// ─── Suite 1 : Accès à la page Admin ─────────────────────────────────────────

test.describe("Page Admin — contrôle d'accès RBAC", () => {
  for (const role of ADMIN_ROLES) {
    test(`✓ ${role} peut accéder au dashboard admin`, async ({
      page,
      context,
    }) => {
      await context.addCookies([CONSENT_COOKIE]);
      await loginAs(page, role);
      await mockAdminApis(page);
      await page.goto("/admin");

      // Le dashboard admin doit s'afficher (sidebar "Administration" ou contenu admin)
      await expect(
        page.getByRole("heading", { name: /administration/i }).or(
          page.getByText(/backoffice/i)
        ),
      ).toBeVisible({ timeout: 10000 });
    });
  }

  for (const role of [...RESEARCH_ROLES.filter(r => !ADMIN_ROLES.includes(r)), ...BASIC_ROLES] as TestRole[]) {
    test(`✗ ${role} voit le message "Accès restreint" sur /admin`, async ({
      page,
      context,
    }) => {
      await context.addCookies([CONSENT_COOKIE]);
      await loginAs(page, role);
      await page.goto("/admin");

      await expect(
        page.getByRole("heading", { name: /accès restreint/i }),
      ).toBeVisible({ timeout: 10000 });
    });
  }
});

// ─── Suite 2 : Accès à la Recherche Juridique ─────────────────────────────────

test.describe("Page Recherche — contrôle d'accès RBAC", () => {
  async function mockResearchApis(page: import("@playwright/test").Page) {
    await page.route("**/api/research/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, searches: [] }),
      });
    });
  }

  for (const role of RESEARCH_ROLES) {
    test(`✓ ${role} peut accéder à la recherche juridique`, async ({
      page,
      context,
    }) => {
      await context.addCookies([CONSENT_COOKIE]);
      await loginAs(page, role);
      await mockResearchApis(page);
      await page.goto("/research");

      // La page de recherche doit afficher le champ de saisie
      await expect(
        page.getByRole("textbox").or(page.getByRole("heading", { name: /recherche/i })),
      ).toBeVisible({ timeout: 10000 });
    });
  }

  for (const role of BASIC_ROLES) {
    test(`✗ ${role} voit un message d'accès refusé sur /research`, async ({
      page,
      context,
    }) => {
      await context.addCookies([CONSENT_COOKIE]);
      await loginAs(page, role);
      await page.goto("/research");

      // Doit afficher un message d'accès refusé (h2 "Accès réservé")
      await expect(
        page.getByRole("heading", { name: /accès réservé/i }),
      ).toBeVisible({ timeout: 10000 });
    });
  }
});

// ─── Suite 3 : Sidebar — liens visibles selon le rôle ────────────────────────

test.describe("Sidebar — navigation selon le rôle", () => {
  test("sidebar affiche le lien Administration pour un admin", async ({
    page,
    context,
  }) => {
    await context.addCookies([CONSENT_COOKIE]);
    await loginAs(page, "admin");
    await mockAdminApis(page);
    await page.goto("/contracts");

    await expect(
      page.getByRole("link", { name: /administration/i }),
    ).toBeVisible();
  });

  test("sidebar affiche le nom et le rôle de l'utilisateur connecté", async ({
    page,
    context,
  }) => {
    await context.addCookies([CONSENT_COOKIE]);
    await loginAs(page, "avocat");
    await page.goto("/contracts");

    // Le nom ou les initiales de l'avocat de test
    await expect(
      page.getByText(/maître sofia silva|MS/i).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test("sidebar affiche le bouton Se déconnecter", async ({
    page,
    context,
  }) => {
    await context.addCookies([CONSENT_COOKIE]);
    await loginAs(page, "salarie");
    await page.goto("/contracts");

    await expect(
      page.getByRole("button", { name: /se déconnecter/i }),
    ).toBeVisible();
  });

  test("sidebar contient un lien vers /profile", async ({
    page,
    context,
  }) => {
    await context.addCookies([CONSENT_COOKIE]);
    await loginAs(page, "juriste");
    await page.goto("/contracts");

    await expect(
      page.locator('a[href="/profile"]').first(),
    ).toBeVisible({ timeout: 8000 });
  });
});
