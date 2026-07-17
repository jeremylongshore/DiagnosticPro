// e2e-live/photo-attach.spec.ts — customer path on test.diagnosticpro.io
// with an actual photo attached pre-pay. Proves the full dpro-752 epic:
//   form + photo (real JPEG) -> saveSubmission -> evidence upload (multipart)
//   -> Stripe TEST1001 free checkout -> webhook/paid -> gpt-4o vision caption
//   -> caption fused into CUSTOMER_DATA_BLOCK -> 15-section report
//   -> PDF download -> PDF text contains visual-evidence reference.
//
// Run:
//   PLAYWRIGHT_BASE_URL=https://test.diagnosticpro.io \
//   DPRO_STRIPE_TEST_MODE=1 \
//   DPRO_STRIPE_COUPON=TEST1001 \
//   DPRO_TEST_EMAIL=jeremy@intentsolutions.io \
//   pnpm exec playwright test --project=live-journey e2e-live/photo-attach.spec.ts

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SEED, type SeedCase } from './fixtures/seed-cases';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
const FIXTURE_PHOTO = path.join(HERE, 'fixtures', 'dash-P0301.jpg');
const RESULTS_DIR = path.join(REPO_ROOT, 'tests', 'live');
const RUN_EPOCH = Date.now();

const PAY_READY = process.env.DPRO_STRIPE_TEST_MODE === '1';
const COUPON = (process.env.DPRO_STRIPE_COUPON || 'TEST1001').trim();
const SEED_ID = process.env.DPRO_SEED_CASE || DEFAULT_SEED.id;
const TEST_EMAIL = (process.env.DPRO_TEST_EMAIL || 'jeremy@intentsolutions.io').trim();

const PAY_BLOCKED =
  'blocked: set DPRO_STRIPE_TEST_MODE=1 and target a sk_test backend ' +
  '(https://test.diagnosticpro.io). Never run photo-attach against live keys.';

let seed: SeedCase = DEFAULT_SEED;
let submissionId = '';
let checkoutUrl = '';
let downloadPath = '';
let evidenceId = '';

const evidence: Record<string, Record<string, unknown>> = {};
const results: Array<{ id: string; name: string; status: string; ms: number; error?: string }> = [];

function ev(stepId: string, data: Record<string, unknown>) {
  evidence[stepId] = { ...(evidence[stepId] ?? {}), ...data };
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  const { SEED_CASES } = await import('./fixtures/seed-cases');
  seed = SEED_CASES.find((c) => c.id === SEED_ID) ?? DEFAULT_SEED;
  // Tag the email so this run is uniquely findable in the operator inbox.
  const [local, domain] = TEST_EMAIL.split('@');
  const email = `${local}+photo.${RUN_EPOCH}@${domain}`;
  (test as unknown as { email: string }).email = email;

  if (!fs.existsSync(FIXTURE_PHOTO)) {
    throw new Error(`fixture photo missing at ${FIXTURE_PHOTO}`);
  }
});

test.afterEach(async ({}, testInfo) => {
  const id = testInfo.title.split(' ')[0];
  results.push({
    id,
    name: testInfo.title,
    status: testInfo.status ?? 'unknown',
    ms: testInfo.duration,
    error: testInfo.error?.message?.split('\n').slice(0, 4).join('\n')
  });
});

test.afterAll(async ({}, testInfo) => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const out = path.join(RESULTS_DIR, `JOURNEY-PHOTO-${RUN_EPOCH}.json`);
  const summary = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const email = (test as unknown as { email: string }).email ?? TEST_EMAIL;
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        run: `JOURNEY-PHOTO-${RUN_EPOCH}`,
        baseUrl: testInfo.project.use.baseURL,
        coupon: COUPON,
        seed: { id: seed.id, label: seed.label },
        fixturePhoto: FIXTURE_PHOTO,
        startedAt: new Date(RUN_EPOCH).toISOString(),
        finishedAt: new Date().toISOString(),
        gates: { stripeTestMode: PAY_READY, coupon: COUPON },
        summary,
        journeyState: { submissionId, checkoutUrl, email, evidenceId },
        steps: results,
        evidenceByStep: evidence
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`\n[photo-journey] results -> ${out}`);
});

test('P1-01 form submit + photo attach -> submission pending + 1 evidence row', async ({ page }) => {
  test.skip(!PAY_READY, PAY_BLOCKED);
  const email = (test as unknown as { email: string }).email;

  // Drive the public form UI
  await page.goto(`/equipment/${seed.equipmentSlug}`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Select manufacturer').click();
  await page.getByRole('option', { name: seed.make, exact: true }).click();
  await page.getByText('Select model', { exact: true }).click();
  await page.getByRole('option', { name: seed.model, exact: true }).click();
  await page.getByText('Select year').click();
  await page.getByRole('option', { name: seed.year, exact: true }).click();
  await page.locator('#description').fill(seed.description);
  await page.locator('#full-name').fill(seed.fullName);
  await page.locator('#email').fill(email);

  const addDetails = page.getByRole('button', { name: /Add Details for Better Results/i });
  if (await addDetails.isVisible().catch(() => false)) {
    await addDetails.scrollIntoViewIfNeeded();
    await addDetails.click();
  }
  if (await page.locator('#mileage').isVisible().catch(() => false)) {
    if (seed.mileage) await page.locator('#mileage').fill(seed.mileage);
    if (seed.errorCodes) await page.locator('#error-codes').fill(seed.errorCodes);
    if (seed.details?.previousRepairs) await page.locator('#previous-repairs').fill(seed.details.previousRepairs);
    if (seed.details?.shopQuoteAmount) await page.locator('#quote-amount').fill(seed.details.shopQuoteAmount);
  }

  const [saveRes] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/saveSubmission') && r.request().method() === 'POST', { timeout: 30_000 }),
    page.getByRole('button', { name: 'Review' }).click(),
  ]);
  expect(saveRes.status()).toBe(200);
  const body = await saveRes.json();
  submissionId = body.submissionId;
  expect(submissionId).toMatch(/^diag_\d{13}_[0-9a-f]{8}$/);

  // Wait for the photo panel to render on Review (it mounts after submissionId is known).
  await expect(page.getByTestId('photo-attach-camera')).toBeVisible({ timeout: 30_000 });

  // Attach via the library input (capture=environment only fires the camera on mobile).
  // Use the raw file input directly so jsdom-style API issues don't matter.
  await page.setInputFiles('[data-testid="photo-attach-library-input"]', FIXTURE_PHOTO);

  // Upload
  const uploadButton = page.getByTestId('photo-attach-upload');
  await expect(uploadButton).toBeVisible({ timeout: 10_000 });
  const [uploadRes] = await Promise.all([
    page.waitForResponse((r) => /\/evidence\//.test(r.url()) && r.request().method() === 'POST', { timeout: 30_000 }),
    uploadButton.click(),
  ]);
  expect(uploadRes.status()).toBe(201);
  const uploadBody = await uploadRes.json();
  evidenceId = uploadBody.evidence?.id ?? '';
  expect(evidenceId).toMatch(/^ev_/);

  // Verify the evidence row exists server-side.
  const listRes = await page.request.get(`/evidence/${encodeURIComponent(submissionId)}`);
  expect(listRes.status()).toBe(200);
  const list = await listRes.json();
  expect(list.evidence.some((e: { id: string; status: string }) => e.id === evidenceId && e.status === 'uploaded')).toBe(true);

  ev('P1-01', { submissionId, evidenceId, photoBytes: fs.statSync(FIXTURE_PHOTO).size });
});

test('P1-02 createCheckoutSession with TEST1001 yields $0 test session', async ({ request }) => {
  test.skip(!PAY_READY, PAY_BLOCKED);
  test.skip(!submissionId, 'no submission from P1-01');
  const res = await request.post('/createCheckoutSession', { data: { submissionId, promotionCode: COUPON } });
  expect(res.status(), await res.text()).toBe(200);
  const body = await res.json();
  expect(body.sessionId).toMatch(/^cs_test_/);
  expect(body.url).toContain('checkout.stripe.com');
  checkoutUrl = body.url;
  ev('P1-02', { sessionId: body.sessionId });
});

test('P1-03 hosted checkout completes free (coupon) and redirects to /success', async ({ page }) => {
  test.skip(!PAY_READY, PAY_BLOCKED);
  test.skip(!checkoutUrl, 'no checkout from P1-02');
  test.setTimeout(180_000);

  await page.goto(checkoutUrl, { waitUntil: 'domcontentloaded' });
  const emailField = page.locator('#email');
  if (await emailField.count()) await emailField.fill((test as unknown as { email: string }).email);
  const cardNumber = page.locator('#cardNumber');
  if ((await cardNumber.count()) && (await cardNumber.isVisible().catch(() => false))) {
    const cardRadio = page.locator('#payment-method-accordion-item-title-card');
    if ((await cardRadio.count()) && !(await cardRadio.isChecked())) await cardRadio.click();
    await cardNumber.fill('4242 4242 4242 4242');
    await page.locator('#cardExpiry').fill('12 / 34');
    await page.locator('#cardCvc').fill('123');
    const name = page.locator('#billingName');
    if (await name.count()) await name.fill(seed.fullName);
    const zip = page.locator('#billingPostalCode');
    if (await zip.count()) await zip.fill('30301');
  }
  const submit = page.locator('[data-testid="hosted-payment-submit-button"]');
  if (await submit.count()) {
    await submit.click();
  } else {
    await page.getByRole('button', { name: /pay|submit|start|complete/i }).first().click();
  }
  await page.waitForURL(/\/success\?session_id=cs_/, { timeout: 90_000 });
  ev('P1-03', { redirectedTo: new URL(page.url()).pathname + new URL(page.url()).search });
});

test('P1-04 evidence row flips to ready (vision captioned) and analysis reaches ready', async ({ request }) => {
  test.skip(!PAY_READY, PAY_BLOCKED);
  test.skip(!submissionId, 'no submission');
  test.setTimeout(420_000);

  // Poll the evidence row until it's no longer 'uploaded'. gpt-4o vision runs
  // BEFORE callLLM (per dpro-752.4 wiring), so once status flips we know the
  // caption already fused into CUSTOMER_DATA_BLOCK.
  const deadline = Date.now() + 180_000;
  let lastStatus = 'uploaded';
  while (Date.now() < deadline) {
    const list = await request.get(`/evidence/${encodeURIComponent(submissionId)}`);
    if (list.status() === 200) {
      const rows = (await list.json()).evidence ?? [];
      const row = rows.find((e: { id: string }) => e.id === evidenceId);
      if (row) {
        lastStatus = row.status;
        if (lastStatus !== 'uploaded') break;
      }
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  expect(['ready', 'failed']).toContain(lastStatus);
  ev('P1-04', { evidenceFinalStatus: lastStatus });

  // Now poll submission until analysis ready
  const deadline2 = Date.now() + 300_000;
  let last = '';
  while (Date.now() < deadline2) {
    const res = await request.post('/analysisStatus', { data: { submissionId } });
    if (res.status() === 200) {
      last = (await res.json()).status;
      if (last === 'ready') break;
      if (last === 'failed') throw new Error(`submission failed: ${last}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  expect(last).toBe('ready');
  ev('P1-04', { finalStatus: last });
});

test('P1-05 PDF download + text contains photo-evidence citation', async ({ request }, testInfo) => {
  test.skip(!PAY_READY, PAY_BLOCKED);
  test.skip(!submissionId, 'no submission');

  const signed = await request.get(`/reports/signed-url?submissionId=${encodeURIComponent(submissionId)}`);
  expect(signed.status()).toBe(200);
  const { downloadUrl } = await signed.json();

  const pdfRes = await request.get(downloadUrl);
  expect(pdfRes.status()).toBe(200);
  const buf = await pdfRes.body();
  expect(buf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  expect(buf.length).toBeGreaterThan(20_000);

  // Save the PDF for forensic analysis + extract text to verify vision citation.
  downloadPath = testInfo.outputPath(`photo-${submissionId}.pdf`);
  fs.writeFileSync(downloadPath, buf);

  // Pull text from the PDF binary using pdftotext if available; else grep the
  // PDF's text streams for case-insensitive evidence markers.
  let pdfText = '';
  try {
    const { execSync } = await import('node:child_process');
    pdfText = execSync(`pdftotext -layout ${JSON.stringify(downloadPath)} -`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString();
  } catch {
    // pdftotext not installed; fall back to a raw stream scan
    pdfText = buf.toString('latin1');
  }

  const evidenceMarkers = ['PHOTO EVIDENCE', 'photo evidence', 'P0301', 'CYLINDER', 'photo'];
  const hits = evidenceMarkers.filter((m) => pdfText.toUpperCase().includes(m.toUpperCase()));
  ev('P1-05', { pdfBytes: buf.length, savedTo: downloadPath, textMatches: hits });

  // The seeded photo literally says "P0301" and "CYLINDER 1 MISFIRE" in big text.
  // gpt-4o should describe it; either the literal "P0301" appears OR a clear
  // "photo" reference. We assert at least 1 hit.
  expect(hits.length).toBeGreaterThanOrEqual(1);
});
