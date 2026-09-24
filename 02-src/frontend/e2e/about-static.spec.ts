import { expect, test } from "@playwright/test";

const headings = [
  "What DiagnosticPro does",
  "What makes DiagnosticPro different",
  "Who uses DiagnosticPro",
  "The team behind DiagnosticPro",
  "How DiagnosticPro works",
  "Key facts",
  "Frequently asked questions",
];

for (const width of [390, 1440]) {
  test.describe(`About without JavaScript at ${width}px`, () => {
    test.use({ javaScriptEnabled: false, viewport: { width, height: 900 } });
    test("publishes the complete entity page in the HTTP response", async ({ page }) => {
      const response = await page.goto("/about/");
      expect(response?.status()).toBe(200);
      const html = await response!.text();
      expect(html).toContain("About DiagnosticPro");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText("About DiagnosticPro");
      await expect(page.locator("main h2")).toHaveText(headings);
      await expect(page).toHaveTitle(
        "About DiagnosticPro | AI Equipment Diagnostic Second Opinions"
      );
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        "https://diagnosticpro.io/about"
      );
      const fields = [
        "Company Name",
        "Type",
        "Founded",
        "Founder",
        "Headquarters",
        "Website",
        "Core Offering",
        "Pricing",
        "Contract Terms",
        "Services",
        "Communication",
        "Notable Clients",
        "Customers Served",
        "Projects Delivered",
        "Competitors",
        "Social",
      ];
      for (const field of fields) {
        await expect(page.getByRole("rowheader", { name: field, exact: true })).toBeVisible();
      }
      const schema = JSON.parse(
        await page.locator('script[type="application/ld+json"]').innerText()
      );
      expect(schema["@type"]).toBe("FAQPage");
      expect(schema.mainEntity).toHaveLength(7);
      for (const item of schema.mainEntity) {
        await expect(page.getByRole("heading", { name: item.name, exact: true })).toBeVisible();
        await expect(page.getByText(item.acceptedAnswer.text, { exact: true })).toBeVisible();
      }
      await expect(
        page.getByRole("link", { name: "Start a diagnosis", exact: true })
      ).toHaveAttribute("href", "/#diagnostic-form");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
    });
  });
}

test("the app takes over the static page and its CTA still navigates", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/about/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("main h2")).toHaveText(headings);
  await page.getByRole("button", { name: "Start diagnosis", exact: true }).click();
  await expect(page.locator("#diagnostic-form")).toBeVisible();
  await expect(page).toHaveURL(/\/#diagnostic-form$/);
  expect(errors).toEqual([]);
});
