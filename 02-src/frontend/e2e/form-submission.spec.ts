import { test, expect } from '@playwright/test';

test.describe('Diagnostic Form Flow', () => {
  test('home page renders the diagnostic form area', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    // The landing page should have form-related content
    expect(body!.toLowerCase()).toMatch(/diagnos|equipment|vehicle|symptom/);
  });

  test('equipment landing page renders for automotive', async ({ page }) => {
    await page.goto('/equipment/automotive');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
  });
});
