import { test, expect } from '@playwright/test';

test.describe('Page d\'accès à l\'espace juridique (Privy)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('affiche un titre et le bouton d\'action principal', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue|continuer|continuar/i })).toBeVisible();
  });

  test('le bouton de langue cycle et change le titre', async ({ page }) => {
    const langBtn = page.getByRole('button', { name: /switch language/i });
    await expect(langBtn).toBeVisible();

    const headingBefore = await page.getByRole('heading', { level: 1 }).textContent();
    await langBtn.click();
    const headingAfter = await page.getByRole('heading', { level: 1 }).textContent();

    expect(headingAfter).not.toBe(headingBefore);
  });

  test('affiche les liens légaux', async ({ page }) => {
    // Les liens vers CGU et politique de confidentialité sont présents
    const legalLinks = page.locator('a[href="/legal/terms"], a[href="/legal/privacy"]');
    await expect(legalLinks.first()).toBeVisible();
  });
});
