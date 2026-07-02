import { test, expect } from '@playwright/test';

// Local plumbing checks only. The former "full paid journey" test here bypassed
// Stripe via /analyzeDiagnostic {force:true} on a mock-LLM backend — endpoints
// the real frontend never calls. It was retired in favor of the real per-step
// customer-journey suite at e2e-live/journey.spec.ts (run with `pnpm test:live`),
// which drives the deployed site, real Stripe hosted checkout (test mode) and
// the real LLM. Nothing in this file may touch payment or analysis paths.
test.describe('Diagnostic form (local plumbing)', () => {
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
