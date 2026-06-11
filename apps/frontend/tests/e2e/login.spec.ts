import { test, expect } from '@playwright/test';

test.describe('Page de connexion', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('affiche le titre et le bouton de connexion Privy', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /connexion à votre compte/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
  });

  test('affiche les liens légaux CGU et politique de confidentialité', async ({ page }) => {
    await expect(page.getByRole('link', { name: /cgu/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /politique de confidentialité/i })).toBeVisible();
  });
});
