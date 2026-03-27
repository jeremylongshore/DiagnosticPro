import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('loads and renders content', async ({ page }) => {
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(100);
  });

  test('displays pricing information', async ({ page }) => {
    const body = await page.textContent('body');
    // Price should appear somewhere on the landing page
    expect(body).toMatch(/\$?\d+\.\d{2}/);
  });

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(50);
  });
});
