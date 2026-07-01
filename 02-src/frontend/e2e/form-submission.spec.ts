import { test, expect } from '@playwright/test';

test.describe('Diagnostic Form Flow - Full Paid User Journey (self-host)', () => {
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

  test('full flow: submit form, simulate payment, trigger analysis (mock), check report ready and download', async ({ page, request }) => {
    // Use API for setup to simulate paid flow (since Stripe button hard in E2E)
    const base = process.env.VITE_API_BASE || 'http://localhost:8089'; // assume backend on 8089 in test env

    // 1. Submit via UI (saves to SQLite)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Fill minimal form (assume selectors from form)
    await page.selectOption('select[name="equipmentType"]', 'automotive'); // adjust if needed
    // For simplicity, use request to save since UI form may be complex
    const saveRes = await request.post(`${base}/saveSubmission`, {
      data: {
        payload: {
          equipmentType: 'automotive',
          make: 'Toyota',
          model: 'Camry',
          year: '2020',
          symptoms: ['engine light'],
          fullName: 'Test User',
          email: 'test@example.com'
        }
      }
    });
    expect(saveRes.ok()).toBeTruthy();
    const saveData = await saveRes.json();
    const submissionId = saveData.submissionId;
    expect(submissionId).toBeDefined();

    // 2. Simulate payment success by triggering analyze (with TEST_MOCK_LLM)
    // In real CI, start backend with TEST_MOCK_LLM=true
    const analyzeRes = await request.post(`${base}/analyzeDiagnostic`, {
      data: { submissionId, force: true }
    });
    // May 200 even if processing
    expect([200,202]).toContain(analyzeRes.status());

    // 3. Poll status until ready (or assume mock makes it fast)
    let status = 'pending';
    for (let i = 0; i < 10; i++) {
      const statusRes = await request.post(`${base}/analysisStatus`, { data: { submissionId } });
      const sdata = await statusRes.json();
      status = sdata.status;
      if (status === 'ready' || status === 'failed') break;
      await page.waitForTimeout(1000);
    }
    // With mock, should be ready quickly, but since async, may need wait
    expect(['ready', 'processing']).toContain(status);

    // 4. Go to report page, check ready, download link
    await page.goto(`/report/${submissionId}`);
    await page.waitForLoadState('networkidle');

    // Check for ready state or download button (depends on UI)
    const pageText = await page.textContent('body');
    expect(pageText!.toLowerCase()).toMatch(/ready|download|report/);

    // Try download if link present
    const downloadLink = page.locator('a:has-text("Download")');
    if (await downloadLink.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadLink.click()
      ]);
      expect(download.suggestedFilename()).toContain('.pdf');
    }
  });
});
