import { test, expect } from '@playwright/test';

test.describe('Report Page', () => {
  test('report page renders with submission ID', async ({ page }) => {
    await page.goto('/report/diag_test_12345');
    // Don't wait for networkidle — report page polls backend /analysisStatus
    await page.waitForTimeout(3000);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(20);
  });

  test('success page without params renders', async ({ page }) => {
    await page.goto('/success');
    await page.waitForTimeout(2000);
    const body = await page.textContent('body');
    expect(body!.length).toBeGreaterThan(20);
  });
});
