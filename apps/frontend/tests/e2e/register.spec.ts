import { test, expect } from '@playwright/test';

test.describe('Page d\'inscription', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('affiche le formulaire d\'inscription complet', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /créer votre compte easylaw/i })).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('#acceptCgu')).toBeVisible();
    await expect(page.locator('#acceptPrivacy')).toBeVisible();
  });

  test('affiche les erreurs de validation si le formulaire est soumis vide', async ({ page }) => {
    await page.getByRole('button', { name: /s'inscrire/i }).click();
    await expect(page.getByText(/nom doit comporter au moins/i)).toBeVisible();
    await expect(page.getByText(/e-mail valide/i)).toBeVisible();
  });

  test('affiche une erreur si le mot de passe ne respecte pas les règles', async ({ page }) => {
    await page.locator('input[name="name"]').fill('Jean Dupont');
    await page.locator('input[type="email"]').fill('jean@example.com');
    await page.locator('input[name="password"]').fill('weak');
    await page.getByRole('button', { name: /s'inscrire/i }).click();
    // Use the error element (red text) specifically, not the hint text
    await expect(page.locator('.text-red-600').filter({ hasText: /8 caractères/i })).toBeVisible();
  });

  test('affiche une erreur si les cases CGU/confidentialité ne sont pas cochées', async ({ page }) => {
    await page.locator('input[name="name"]').fill('Jean Dupont');
    await page.locator('input[type="email"]').fill('jean@example.com');
    await page.locator('input[name="password"]').fill('Password1');
    await page.getByRole('button', { name: /s'inscrire/i }).click();
    await expect(page.getByText(/accepter les CGU/i)).toBeVisible();
  });

  test('bascule la langue vers le portugais', async ({ page }) => {
    await page.getByRole('button', { name: /fr/i }).click();
    await expect(page.getByRole('heading', { name: /criar a sua conta/i })).toBeVisible();
  });

  test('le bouton affiche/masque le mot de passe fonctionne', async ({ page }) => {
    await page.locator('input[name="password"]').fill('MonMotDePasse1');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password');
    // Toggle : le deuxième button[type="button"] (premier = langue)
    await page.locator('button[type="button"]').nth(1).click();
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text');
  });
});
