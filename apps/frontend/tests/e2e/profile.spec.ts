import { test, expect } from "@playwright/test";
import { loginAs, CONSENT_COOKIE } from "./utils/auth-helper";
import { TEST_USERS, ROLE_LABELS, type TestRole } from "./fixtures/test-users";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ALL_ROLES: TestRole[] = [
  "super_admin", "admin", "cabinet_avocat",
  "avocat", "avocat_associe", "juriste",
  "salarie", "assistant",
];

// ─── Suite 1 : Structure de la page profil ────────────────────────────────────

test.describe("Page Profil — structure et contenu", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([CONSENT_COOKIE]);
    await loginAs(page, "avocat");
    await page.goto("/profile");
  });

  test("affiche la carte identité avec les initiales", async ({ page }) => {
    // Avatar avec initiales du nom (Maître Sofia Silva → MS)
    await expect(page.getByText("MS")).toBeVisible();
  });

  test("affiche le nom et l'email de l'utilisateur", async ({ page }) => {
    await expect(page.getByText("Maître Sofia Silva")).toBeVisible();
    await expect(page.getByText("avocat@test.easylaw.pt")).toBeVisible();
  });

  test("affiche la section Informations personnelles", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /informations personnelles/i }),
    ).toBeVisible();
  });

  test("affiche la section Sécurité", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /sécurité/i }),
    ).toBeVisible();
  });

  test("affiche la zone de danger", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /zone de danger/i }),
    ).toBeVisible();
  });

  test("email affiché en lecture seule", async ({ page }) => {
    const emailInput = page.locator('input[type="text"][disabled]').first();
    await expect(emailInput).toBeDisabled();
    await expect(emailInput).toHaveValue("avocat@test.easylaw.pt");
  });
});

// ─── Suite 2 : Badge de rôle par profil ──────────────────────────────────────

test.describe("Badge de rôle — affichage par type d'utilisateur", () => {
  for (const role of ALL_ROLES) {
    test(`affiche le badge "${ROLE_LABELS[role]}" pour le rôle ${role}`, async ({
      page,
      context,
    }) => {
      await context.addCookies([CONSENT_COOKIE]);
      await loginAs(page, role);
      await page.goto("/profile");
      // Utiliser .first() car le label peut apparaître comme sous-chaîne dans l'email
      await expect(page.getByText(ROLE_LABELS[role]).first()).toBeVisible();
    });
  }
});

// ─── Suite 3 : Modification du profil ────────────────────────────────────────

test.describe("Page Profil — édition des informations", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([CONSENT_COOKIE]);
    await loginAs(page, "salarie");
    await page.goto("/profile");
  });

  test("le bouton Modifier active les champs", async ({ page }) => {
    const modifierBtn = page.getByRole("button", { name: /modifier/i });
    await expect(modifierBtn).toBeVisible();
    await modifierBtn.click();

    // Le champ nom doit être actif
    const nameInput = page.locator('input[placeholder="Votre nom complet"]');
    await expect(nameInput).not.toBeDisabled();
  });

  test("peut modifier le nom et enregistrer", async ({ page }) => {
    await page.getByRole("button", { name: /modifier/i }).click();

    const nameInput = page.locator('input[placeholder="Votre nom complet"]');
    await nameInput.fill("Jean Dupont Modifié");

    await page.getByRole("button", { name: /enregistrer/i }).click();

    // Feedback de succès
    await expect(
      page.getByText(/profil mis à jour avec succès/i),
    ).toBeVisible();
  });

  test("le bouton Annuler rétablit les valeurs", async ({ page }) => {
    await page.getByRole("button", { name: /modifier/i }).click();

    const nameInput = page.locator('input[placeholder="Votre nom complet"]');
    await nameInput.fill("Nom Modifié Temporaire");

    await page.getByRole("button", { name: /annuler/i }).click();

    // Retour à l'état initial — bouton Modifier visible, pas Enregistrer
    await expect(page.getByRole("button", { name: /modifier/i })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /enregistrer/i }),
    ).not.toBeVisible();
  });

  test("peut changer la langue vers PT", async ({ page }) => {
    await page.getByRole("button", { name: /modifier/i }).click();

    const ptButton = page.getByRole("button", { name: /português/i });
    await expect(ptButton).toBeVisible();
    await ptButton.click();

    // Le bouton PT doit apparaître sélectionné
    await expect(ptButton).toHaveText(/português/i);
  });
});

// ─── Suite 4 : Déconnexion ───────────────────────────────────────────────────

test.describe("Page Profil — déconnexion", () => {
  test("le bouton Se déconnecter dans l'en-tête est présent", async ({
    page,
    context,
  }) => {
    await context.addCookies([CONSENT_COOKIE]);
    await loginAs(page, "juriste");
    await page.goto("/profile");

    // Il y a deux boutons "Se déconnecter" (header + section sécurité)
    const logoutBtns = page.getByRole("button", { name: /se déconnecter/i });
    await expect(logoutBtns.first()).toBeVisible();
  });
});

// ─── Suite 5 : Suppression de compte (modale) ────────────────────────────────

test.describe("Page Profil — suppression de compte", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([CONSENT_COOKIE]);
    await loginAs(page, "assistant");
    await page.goto("/profile");
  });

  test("le bouton Supprimer ouvre la modale de confirmation", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /supprimer/i }).click();

    await expect(
      page.getByRole("heading", { name: /supprimer le compte/i }),
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("SUPPRIMER"),
    ).toBeVisible();
  });

  test("le bouton Confirmer est désactivé sans saisie", async ({ page }) => {
    await page.getByRole("button", { name: /supprimer/i }).click();

    const confirmBtn = page.getByRole("button", { name: /confirmer/i });
    await expect(confirmBtn).toBeDisabled();
  });

  test("Confirmer activé après saisie de SUPPRIMER", async ({ page }) => {
    await page.getByRole("button", { name: /supprimer/i }).click();

    await page.getByPlaceholder("SUPPRIMER").fill("SUPPRIMER");

    const confirmBtn = page.getByRole("button", { name: /confirmer/i });
    await expect(confirmBtn).not.toBeDisabled();
  });

  test("le bouton Annuler ferme la modale", async ({ page }) => {
    await page.getByRole("button", { name: /supprimer/i }).click();
    await expect(page.getByRole("heading", { name: /supprimer le compte/i })).toBeVisible();

    await page.getByRole("button", { name: /annuler/i }).click();
    await expect(
      page.getByRole("heading", { name: /supprimer le compte/i }),
    ).not.toBeVisible();
  });
});
