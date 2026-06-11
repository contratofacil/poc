import { test, expect } from "@playwright/test";
import { CONSENT_COOKIE } from "./utils/auth-helper";

test.describe("Page NIF — Demande de NIF Portugais", () => {
  test.beforeEach(async ({ page, context }) => {
    // Utiliser le cookie centralisé depuis auth-helper (domaine localhost)
    await context.addCookies([CONSENT_COOKIE]);
    await page.goto("/nif");
  });

  test("affiche le titre de l'étape 1 et les champs du formulaire", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /vos informations personnelles/i }),
    ).toBeVisible();
    await expect(page.locator('input[name="fullname"]')).toBeVisible();
    await expect(page.locator('input[name="birthdate"]')).toBeVisible();
  });

  test("affiche une erreur si on avance sans remplir les champs", async ({ page }) => {
    await page.getByRole("button", { name: /suivant/i }).click();
    // Reste sur l'étape 1 — le champ fullname est toujours visible
    await expect(page.locator('input[name="fullname"]')).toBeVisible();
  });

  test("avance à l'étape 2 (Documents) après remplissage complet", async ({ page }) => {
    await page.locator('input[name="fullname"]').fill("Marie Curie");
    await page.locator('input[name="birthdate"]').fill("1990-06-15");
    await page.locator('input[name="nationality"]').fill("Française");
    await page.locator('input[name="current_residence"]').fill("10 Rue de la Paix, Paris");
    await page.getByRole("button", { name: /suivant/i }).click();

    await expect(
      page.getByRole("heading", { name: /vos documents d'identité/i }),
    ).toBeVisible();
  });
});
