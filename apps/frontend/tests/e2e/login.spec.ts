import { test, expect } from "@playwright/test";

test.describe("Page de connexion (/login)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("affiche le titre et le bouton de connexion Privy", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /connexion à votre compte/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /se connecter/i }),
    ).toBeVisible();
  });

  test("affiche les liens légaux CGU et politique de confidentialité", async ({ page }) => {
    await expect(page.getByRole("link", { name: /cgu/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /politique de confidentialité/i }),
    ).toBeVisible();
  });

  test("affiche le logo EasyLaw", async ({ page }) => {
    await expect(page.getByText("EasyLaw").first()).toBeVisible();
  });
});

test.describe("Page inscription (/register)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/register");
  });

  test("affiche un titre et le bouton d'action principal", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continue|continuer|continuar/i }),
    ).toBeVisible();
  });

  test("le bouton de langue cycle et change le titre", async ({ page }) => {
    const langBtn = page.getByRole("button", { name: /switch language/i });
    await expect(langBtn).toBeVisible();

    const headingBefore = await page.getByRole("heading", { level: 1 }).textContent();
    await langBtn.click();
    const headingAfter = await page.getByRole("heading", { level: 1 }).textContent();
    expect(headingAfter).not.toBe(headingBefore);
  });

  test("affiche les liens légaux", async ({ page }) => {
    const legalLinks = page.locator(
      'a[href="/legal/terms"], a[href="/legal/privacy"]',
    );
    await expect(legalLinks.first()).toBeVisible();
  });
});
