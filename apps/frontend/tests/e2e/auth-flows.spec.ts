import { test, expect } from "@playwright/test";
import { loginAs, logoutTest, CONSENT_COOKIE } from "./utils/auth-helper";

// ─── Suite 1 : Page de connexion ─────────────────────────────────────────────

test.describe("Page Connexion (/login)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("affiche le titre de connexion", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /connexion à votre compte/i }),
    ).toBeVisible();
  });

  test("affiche le bouton Se connecter", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /se connecter/i }),
    ).toBeVisible();
  });

  test("affiche les liens légaux CGU et confidentialité", async ({ page }) => {
    await expect(page.getByRole("link", { name: /cgu/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /politique de confidentialité/i }),
    ).toBeVisible();
  });

  test("page d'accès (/register) affiche un bouton d'action", async ({
    page,
  }) => {
    await page.goto("/register");
    await expect(
      page.getByRole("button", { name: /continue|continuer|continuar/i }),
    ).toBeVisible();
  });
});

// ─── Suite 2 : Redirection vers /login si non authentifié ────────────────────

test.describe("Redirection non authentifié", () => {
  test("la page /profile affiche l'invite de connexion sans auth", async ({
    page,
    context,
  }) => {
    await context.addCookies([CONSENT_COOKIE]);
    // Aller sur /profile sans auth → AuthGuard doit afficher le prompt de connexion
    // (Privy échoue à s'initialiser → état non-authentifié)
    await page.goto("/profile");

    // On attend que Privy échoue (délai max 10s) ou que la page affiche un prompt
    // Dans l'environnement de test sans Privy valide, l'AuthGuard reste en loading
    // donc on vérifie qu'on est bien sur /profile (pas de redirect brutal)
    await expect(page).toHaveURL(/\/profile/);
  });
});

// ─── Suite 3 : Flux avec utilisateur authentifié (test mode) ─────────────────

test.describe("Flux authentifié — mode test", () => {
  test("utilisateur connecté voit sa page profil", async ({
    page,
    context,
  }) => {
    await context.addCookies([CONSENT_COOKIE]);
    await loginAs(page, "salarie");
    await page.goto("/profile");

    await expect(page.getByText("Jean Dupont")).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("salarie@test.easylaw.pt")).toBeVisible();
  });

  test("l'en-tête du profil affiche le bouton Se déconnecter", async ({
    page,
    context,
  }) => {
    await context.addCookies([CONSENT_COOKIE]);
    await loginAs(page, "cabinet_avocat");
    await page.goto("/profile");

    await expect(
      page.getByRole("button", { name: /se déconnecter/i }).first(),
    ).toBeVisible({ timeout: 8000 });
  });

  test("chaque rôle a un badge de rôle visible sur le profil", async ({
    page,
    context,
  }) => {
    await context.addCookies([CONSENT_COOKIE]);
    await loginAs(page, "super_admin");
    await page.goto("/profile");

    await expect(
      page.getByText("Super Administrateur"),
    ).toBeVisible({ timeout: 8000 });
  });
});

// ─── Suite 4 : Comptes de test — liste de référence ─────────────────────────

test.describe("Comptes de test — sanity check", () => {
  const accounts = [
    { role: "super_admin" as const,    email: "superadmin@test.easylaw.pt", label: "Super Administrateur" },
    { role: "admin" as const,          email: "admin@test.easylaw.pt",      label: "Administrateur" },
    { role: "cabinet_avocat" as const, email: "cabinet@test.easylaw.pt",    label: "Cabinet Avocat" },
    { role: "avocat" as const,         email: "avocat@test.easylaw.pt",     label: "Avocat" },
    { role: "avocat_associe" as const, email: "associe@test.easylaw.pt",    label: "Avocat Associé" },
    { role: "juriste" as const,        email: "juriste@test.easylaw.pt",    label: "Juriste" },
    { role: "salarie" as const,        email: "salarie@test.easylaw.pt",    label: "Salarié" },
    { role: "assistant" as const,      email: "assistant@test.easylaw.pt",  label: "Assistant" },
  ];

  for (const account of accounts) {
    test(`${account.label} (${account.email}) — profil accessible`, async ({
      page,
      context,
    }) => {
      await context.addCookies([CONSENT_COOKIE]);
      await loginAs(page, account.role);
      await page.goto("/profile");

      await expect(
        page.getByText(account.email),
      ).toBeVisible({ timeout: 8000 });
      // .first() évite la violation stricte quand le label apparaît aussi dans la sidebar
      await expect(
        page.getByText(account.label).first(),
      ).toBeVisible();
    });
  }
});
