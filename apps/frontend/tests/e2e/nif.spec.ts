import { test, expect } from '@playwright/test';

test.describe('Page NIF - Demande de NIF Portugais', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/nif');
  });

  test('affiche le titre et la première étape (Infos Personnelles)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /demande de nif/i })).toBeVisible();
    await expect(page.locator('input[name="fullname"]')).toBeVisible();
    await expect(page.locator('input[name="birthdate"]')).toBeVisible();
  });

  test('affiche une erreur de validation si on avance sans remplir les champs', async ({ page }) => {
    await page.getByRole('button', { name: /suivant/i }).click();
    // Should stay on step 1 — fullname field still visible
    await expect(page.locator('input[name="fullname"]')).toBeVisible();
  });

  test('avance à l\'étape 2 (Documents) après remplissage de l\'étape 1', async ({ page }) => {
    await page.locator('input[name="fullname"]').fill('Marie Curie');
    await page.locator('input[name="birthdate"]').fill('1990-06-15');
    await page.locator('input[name="nationality"]').fill('Française');
    await page.locator('input[name="current_residence"]').fill('10 Rue de la Paix, Paris');
    await page.getByRole('button', { name: /suivant/i }).click();
    // Step 2: Documents should now be visible
    await expect(page.locator('input[name="cardNumber"]')).not.toBeVisible();
    // Step 2 heading should be visible
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
  });
});
