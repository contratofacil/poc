import { test, expect } from '@playwright/test';

test.describe('Page d\'accueil EasyLaw', () => {
  test('affiche le logo et le titre de la page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('EasyLaw')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('le bouton "Créer un compte" navigue vers /register', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /créer un compte/i }).click();
    await expect(page).toHaveURL('/register');
  });
});
