import { test, expect } from '@playwright/test';

test.describe('Page d\'accueil EasyLaw', () => {
  test('affiche le logo EasyLaw dans la navigation et le titre principal', async ({ page }) => {
    await page.goto('/');
    // Logo dans la nav (link précis, évite le strict mode violation)
    await expect(page.getByRole('link', { name: 'EasyLaw' }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('le CTA principal navigue vers /register', async ({ page }) => {
    await page.goto('/');
    // Le bouton principal (href="/register") peu importe la langue affichée
    await page.locator('a[href="/register"]').first().click();
    await expect(page).toHaveURL('/register');
  });
});
