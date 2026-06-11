import { test, expect } from "@playwright/test";

test.describe("Page d'accueil EasyLaw", () => {
  test("affiche le logo EasyLaw et le titre principal", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "EasyLaw" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("le CTA principal navigue vers /register", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/register"]').first().click();
    await expect(page).toHaveURL("/register");
  });

  test("affiche au moins 2 services dans la section services", async ({ page }) => {
    await page.goto("/");
    // La section des services contient plusieurs headings h2/h3
    const serviceHeadings = page.locator('section h2, section h3, [class*="service"] h2');
    await expect(serviceHeadings.first()).toBeVisible();
  });

  test("les liens légaux footer sont accessibles", async ({ page }) => {
    await page.goto("/");
    // Au moins un lien légal doit exister
    const legalLink = page.locator(
      'a[href="/legal/terms"], a[href="/legal/privacy"], a[href="/legal/mentions"]'
    );
    await expect(legalLink.first()).toBeAttached();
  });
});
