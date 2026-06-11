import { test, expect } from '@playwright/test';

// Pre-seed le cookie de consentement pour éviter que la bannière bloque les clics
const CONSENT_COOKIE = {
  name: 'easylaw_consent_v1',
  value: encodeURIComponent(
    JSON.stringify({ v: 1, necessary: true, analytics: true, marketing: true, personalization: true, ts: '2026-01-01T00:00:00.000Z' })
  ),
  domain: 'frontend-production-167a.up.railway.app',
  path: '/',
};

test.describe('Page NIF - Demande de NIF Portugais', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addCookies([CONSENT_COOKIE]);
    await page.goto('/nif');
  });

  test('affiche le titre de l\'étape 1 et les champs du formulaire', async ({ page }) => {
    // Titre step 1 en FR (langue par défaut de la page NIF)
    await expect(page.getByRole('heading', { name: /vos informations personnelles/i })).toBeVisible();
    await expect(page.locator('input[name="fullname"]')).toBeVisible();
    await expect(page.locator('input[name="birthdate"]')).toBeVisible();
  });

  test('affiche une erreur de validation si on avance sans remplir les champs', async ({ page }) => {
    await page.getByRole('button', { name: /suivant/i }).click();
    // Reste sur l'étape 1 — le champ fullname est toujours visible
    await expect(page.locator('input[name="fullname"]')).toBeVisible();
  });

  test('avance à l\'étape 2 (Documents) après remplissage de l\'étape 1', async ({ page }) => {
    await page.locator('input[name="fullname"]').fill('Marie Curie');
    await page.locator('input[name="birthdate"]').fill('1990-06-15');
    await page.locator('input[name="nationality"]').fill('Française');
    await page.locator('input[name="current_residence"]').fill('10 Rue de la Paix, Paris');
    await page.getByRole('button', { name: /suivant/i }).click();
    // Step 2 : titre "Vos documents d'identité."
    await expect(page.getByRole('heading', { name: /vos documents d'identité/i })).toBeVisible();
  });
});
