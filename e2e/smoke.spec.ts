import { test, expect } from "@playwright/test";
test("homepage renders and primary CTA exists", async ({ page }) => {
  await page.goto("https://diagnosticpro.io", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveTitle(/DiagnosticPro/i);
  const ctas = page.locator('text=/Pay|Checkout|Get Report|Start/i');
  await expect(ctas.first()).toBeVisible({ timeout: 10000 });
});
