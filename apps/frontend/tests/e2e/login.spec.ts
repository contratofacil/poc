import { test, expect } from '@playwright/test';

test.describe('Page de connexion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('affiche le formulaire de connexion en français par défaut', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /connexion à votre compte/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
  });

  test('bascule la langue vers le portugais', async ({ page }) => {
    await page.getByRole('button', { name: /fr/i }).click();
    await expect(page.getByRole('heading', { name: /iniciar sessão/i })).toBeVisible();
  });

  test('affiche une erreur de validation avec un email invalide', async ({ page }) => {
    // Disable browser native validation so Zod can run
    await page.locator('form').evaluate((f) => f.setAttribute('novalidate', ''));
    await page.locator('input[type="email"]').fill('invalide');
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page.getByText(/e-mail valide/i)).toBeVisible();
  });

  test('affiche une erreur de validation si le mot de passe est vide', async ({ page }) => {
    await page.locator('input[type="email"]').fill('test@example.com');
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page.getByText(/mot de passe est requis/i)).toBeVisible();
  });

  test('le bouton affiche/masque le mot de passe fonctionne', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill('secret123');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    // Le bouton toggle est le deuxième button[type="button"] (premier = langue)
    await page.locator('button[type="button"]').nth(1).click();
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text');
  });

  test('le lien "S\'inscrire" navigue vers /register', async ({ page }) => {
    await page.getByRole('link', { name: /s'inscrire/i }).click();
    await expect(page).toHaveURL('/register');
  });
});
