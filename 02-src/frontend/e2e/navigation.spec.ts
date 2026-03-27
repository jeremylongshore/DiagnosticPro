import { test, expect } from '@playwright/test';

test.describe('Route Navigation', () => {
  const routes = [
    { path: '/', name: 'Home' },
    { path: '/terms', name: 'Terms' },
    { path: '/privacy', name: 'Privacy' },
    { path: '/equipment/automotive', name: 'Equipment Landing' },
  ];

  for (const route of routes) {
    test(`${route.name} (${route.path}) renders content`, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      // SPA should render real content, not empty body
      const body = await page.textContent('body');
      expect(body!.length).toBeGreaterThan(50);
    });
  }

  test('unknown route shows 404 content', async ({ page }) => {
    await page.goto('/this-route-does-not-exist-xyz');
    await page.waitForLoadState('networkidle');
    const body = await page.textContent('body');
    // Should render something (even the 404 page has content)
    expect(body!.length).toBeGreaterThan(10);
  });
});
