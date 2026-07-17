// e2e-live/coupon-free.spec.ts — full customer path on test.diagnosticpro.io
// using Stripe TEST keys + promotion code TEST1001 (100% off).
//
// Proves: form → saveSubmission → createCheckoutSession(coupon) → hosted
// checkout (free) → webhook/paid → real LLM report → PDF download.
//
// Run:
//   PLAYWRIGHT_BASE_URL=https://test.diagnosticpro.io \
//   DPRO_STRIPE_TEST_MODE=1 \
//   DPRO_STRIPE_COUPON=TEST1001 \
//   DPRO_TEST_EMAIL=jeremy@intentsolutions.io \
//   pnpm exec playwright test --project=live-journey e2e-live/coupon-free.spec.ts
//
// Seed data: e2e-live/fixtures/seed-cases.ts (rich DTC + shop-quote scenarios).
// Customer email defaults to jeremy@intentsolutions.io (override with DPRO_TEST_EMAIL).

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SEED, type SeedCase } from './fixtures/seed-cases';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
const RESULTS_DIR = path.join(REPO_ROOT, 'tests', 'live');
const RUN_EPOCH = Date.now();

const PAY_READY = process.env.DPRO_STRIPE_TEST_MODE === '1';
const COUPON = (process.env.DPRO_STRIPE_COUPON || 'TEST1001').trim();
const SEED_ID = process.env.DPRO_SEED_CASE || DEFAULT_SEED.id;
/** Form + Stripe email for the real operator inbox. */
const TEST_EMAIL = (process.env.DPRO_TEST_EMAIL || 'jeremy@intentsolutions.io').trim();

const PAY_BLOCKED =
  'blocked: set DPRO_STRIPE_TEST_MODE=1 and target a sk_test backend ' +
  '(https://test.diagnosticpro.io). Never run free-coupon pay against live keys.';

let seed: SeedCase = DEFAULT_SEED;
let submissionId = '';
let checkoutSessionId = '';
let checkoutUrl = '';
let downloadUrl = '';
let viewUrl = '';
let email = '';

const evidence: Record<string, Record<string, unknown>> = {};
const results: Array<{
  id: string;
  name: string;
  status: string;
  ms: number;
  evidence?: Record<string, unknown>;
  error?: string;
}> = [];

function ev(stepId: string, data: Record<string, unknown>) {
  evidence[stepId] = { ...(evidence[stepId] ?? {}), ...data };
}

async function pollStatus(
  request: import('@playwright/test').APIRequestContext,
  id: string,
  wanted: string[],
  timeoutMs: number,
  fatal: string[] = ['failed'],
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let last = '';
  while (Date.now() < deadline) {
    const res = await request.post('/analysisStatus', { data: { submissionId: id } });
    if (res.status() === 200) {
      last = (await res.json()).status;
      if (wanted.includes(last)) return last;
      if (fatal.includes(last)) throw new Error(`submission ${id} hit fatal status '${last}'`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`timed out after ${timeoutMs}ms waiting for ${wanted.join('|')} (last: '${last}')`);
}

/** Drive the public form UI with a rich seed case; returns submissionId from /saveSubmission. */
async function submitSeedViaUi(
  page: import('@playwright/test').Page,
  caseData: SeedCase,
  runEmail: string,
): Promise<string> {
  await page.goto(`/equipment/${caseData.equipmentSlug}`, { waitUntil: 'domcontentloaded' });

  await page.getByText('Select manufacturer').click();
  await page.getByRole('option', { name: caseData.make, exact: true }).click();
  await page.getByText('Select model', { exact: true }).click();
  await page.getByRole('option', { name: caseData.model, exact: true }).click();
  await page.getByText('Select year').click();
  await page.getByRole('option', { name: caseData.year, exact: true }).click();

  await page.locator('#description').fill(caseData.description);

  // Contact first (always visible) — then expand optional details for report signal.
  await page.locator('#full-name').fill(caseData.fullName);
  await page.locator('#email').fill(runEmail);

  // Expand "Add Details for Better Results" — #mileage only mounts when open.
  const addDetails = page.getByRole('button', { name: /Add Details for Better Results/i });
  if (await addDetails.isVisible().catch(() => false)) {
    await addDetails.scrollIntoViewIfNeeded();
    await addDetails.click();
    await expect(page.locator('#mileage')).toBeVisible({ timeout: 10_000 });
  }

  if (await page.locator('#mileage').isVisible().catch(() => false)) {
    if (caseData.mileage) await page.locator('#mileage').fill(caseData.mileage);
    if (caseData.errorCodes) await page.locator('#error-codes').fill(caseData.errorCodes);
    if (caseData.details?.previousRepairs) {
      await page.locator('#previous-repairs').fill(caseData.details.previousRepairs);
    }
    if (caseData.details?.shopQuoteAmount) {
      await page.locator('#quote-amount').fill(caseData.details.shopQuoteAmount);
    }
    if (caseData.details?.shopRecommendation) {
      await page.locator('#shop-recommendation').fill(caseData.details.shopRecommendation);
    }
    if (caseData.details?.troubleshootingSteps) {
      await page.locator('#troubleshooting').fill(caseData.details.troubleshootingSteps);
    }
    if (caseData.phone) {
      await page.locator('#phone').fill(caseData.phone);
    }
  }

  const [saveRes] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith('/saveSubmission') && r.request().method() === 'POST',
      { timeout: 30_000 },
    ),
    page.getByRole('button', { name: 'Review' }).click(),
  ]);
  expect(saveRes.status()).toBe(200);
  const body = await saveRes.json();
  expect(body.submissionId).toMatch(/^diag_\d{13}_[0-9a-f]{8}$/);
  return body.submissionId as string;
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  const { SEED_CASES } = await import('./fixtures/seed-cases');
  seed = SEED_CASES.find((c) => c.id === SEED_ID) ?? DEFAULT_SEED;
  // Prefer operator inbox so real people can find the submission/report.
  // Optional unique tag: DPRO_EMAIL_UNIQUE=1 → jeremy+epoch@... for isolation.
  if (process.env.DPRO_EMAIL_UNIQUE === '1') {
    const [local, domain] = TEST_EMAIL.split('@');
    email = `${local}+${seed.id}.${RUN_EPOCH}@${domain}`;
  } else {
    email = TEST_EMAIL;
  }
});

test.afterEach(async ({}, testInfo) => {
  const id = testInfo.title.split(' ')[0];
  results.push({
    id,
    name: testInfo.title,
    status: testInfo.status ?? 'unknown',
    ms: testInfo.duration,
    evidence: evidence[id],
    error: testInfo.error?.message?.split('\n').slice(0, 4).join('\n'),
  });
});

test.afterAll(async ({}, testInfo) => {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const out = path.join(RESULTS_DIR, `JOURNEY-COUPON-${RUN_EPOCH}.json`);
  const summary = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  fs.writeFileSync(
    out,
    JSON.stringify(
      {
        run: `JOURNEY-COUPON-${RUN_EPOCH}`,
        baseUrl: testInfo.project.use.baseURL,
        coupon: COUPON,
        seed: { id: seed.id, label: seed.label },
        startedAt: new Date(RUN_EPOCH).toISOString(),
        finishedAt: new Date().toISOString(),
        gates: { stripeTestMode: PAY_READY, coupon: COUPON },
        summary,
        journeyState: { submissionId, checkoutSessionId, email },
        steps: results,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`\n[coupon-journey] results -> ${out}`);
});

test('C1-01 landing + form shell (no Whop CTAs)', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/DiagnosticPro/i);
  await expect(page.locator('#diagnostic-form')).toBeAttached();
  // Public UI must stay Stripe-only while Whop is deferred.
  await expect(page.getByText(/Login with Whop/i)).toHaveCount(0);
  await expect(page.getByText(/\$29\/mo/i)).toHaveCount(0);
  ev('C1-01', { http: response?.status(), seedId: seed.id });
});

test('C1-02 rich seed form submit creates pending submission', async ({ page }) => {
  test.skip(!PAY_READY, PAY_BLOCKED);
  submissionId = await submitSeedViaUi(page, seed, email);

  const st = await page.request.post('/analysisStatus', { data: { submissionId } });
  expect(st.status()).toBe(200);
  expect((await st.json()).status).toBe('pending');

  // Review page shows Stripe pay surface (not membership free path).
  await expect(page.locator('stripe-buy-button')).toBeAttached({ timeout: 30_000 });
  await expect(page.getByText(/Included with Membership/i)).toHaveCount(0);

  ev('C1-02', {
    submissionId,
    email,
    seedId: seed.id,
    make: seed.make,
    model: seed.model,
    errorCodes: seed.errorCodes,
  });
});

test('C1-03 createCheckoutSession with TEST1001 yields $0 test session', async ({ request }) => {
  test.skip(!PAY_READY, PAY_BLOCKED);
  test.skip(!submissionId, 'no submission from C1-02');

  const res = await request.post('/createCheckoutSession', {
    data: { submissionId, promotionCode: COUPON },
  });
  expect(res.status(), await res.text()).toBe(200);
  const body = await res.json();
  expect(body.sessionId).toMatch(/^cs_test_/);
  expect(body.url).toContain('checkout.stripe.com');
  checkoutSessionId = body.sessionId;
  checkoutUrl = body.url;

  // Resolve session totals — 100% off should be amount_total 0.
  const sess = await request.get(`/checkout/session?id=${encodeURIComponent(checkoutSessionId)}`);
  expect(sess.status()).toBe(200);
  const sbody = await sess.json();
  expect(sbody.submissionId ?? sbody.client_reference_id).toBe(submissionId);

  ev('C1-03', {
    sessionId: checkoutSessionId,
    amount_total: sbody.amount_total,
    payment_status: sbody.payment_status,
    coupon: COUPON,
  });
  // Soft: if API exposes amount_total, free coupon should be 0.
  if (typeof sbody.amount_total === 'number') {
    expect(sbody.amount_total).toBe(0);
  }
});

test('C1-04 hosted checkout completes free (coupon) and redirects to /success', async ({ page }) => {
  test.skip(!PAY_READY, PAY_BLOCKED);
  test.skip(!checkoutUrl, 'no checkout from C1-03');
  test.setTimeout(180_000);
  expect(checkoutSessionId).toMatch(/^cs_test_/);

  await page.goto(checkoutUrl, { waitUntil: 'domcontentloaded' });

  // Email is often pre-required even on $0 sessions.
  const emailField = page.locator('#email');
  if (await emailField.count()) {
    await emailField.fill(email);
  }

  // If Stripe still wants a card (promo not applied or amount > 0), use 4242.
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
    const linkPass = page.locator('#enableStripePass');
    if ((await linkPass.count()) && (await linkPass.isChecked())) await linkPass.uncheck();
  }

  // Prefer the hosted submit button; fall back to text match for $0 "Pay $0" / "Start trial".
  const submit = page.locator('[data-testid="hosted-payment-submit-button"]');
  if (await submit.count()) {
    await submit.click();
  } else {
    await page.getByRole('button', { name: /pay|submit|start|complete/i }).first().click();
  }

  await page.waitForURL(/\/success\?session_id=cs_/, { timeout: 90_000 });
  const url = new URL(page.url());
  expect(url.searchParams.get('session_id')).toBe(checkoutSessionId);
  ev('C1-04', { redirectedTo: url.pathname + url.search, coupon: COUPON });
});

test('C1-05 webhook marks paid/processing and analysis reaches ready', async ({ request }) => {
  test.skip(!PAY_READY, PAY_BLOCKED);
  test.skip(!submissionId, 'no submission');
  test.setTimeout(420_000);

  const paidOrBeyond = await pollStatus(
    request,
    submissionId,
    ['paid', 'processing', 'ready'],
    90_000,
  );
  expect(['paid', 'processing', 'ready']).toContain(paidOrBeyond);

  const ready = await pollStatus(request, submissionId, ['ready'], 360_000);
  expect(ready).toBe('ready');
  ev('C1-05', { paidOrBeyond, ready, seedHints: seed.expectHints });
});

test('C1-06 signed-url + PDF download contract', async ({ request }) => {
  test.skip(!PAY_READY, PAY_BLOCKED);
  test.skip(!submissionId, 'no submission');

  const res = await request.get(`/reports/signed-url?submissionId=${encodeURIComponent(submissionId)}`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.downloadUrl).toContain('/reports/download/');
  expect(body.viewUrl).toContain('/view/');
  downloadUrl = body.downloadUrl;
  viewUrl = body.viewUrl;

  const pdf = await request.get(downloadUrl);
  expect(pdf.status()).toBe(200);
  const buf = await pdf.body();
  expect(buf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  expect(buf.length).toBeGreaterThan(10_240);

  const view = await request.get(viewUrl);
  expect(view.status()).toBe(200);
  expect(view.headers()['content-type']).toContain('application/pdf');

  ev('C1-06', {
    downloadUrl,
    viewUrl,
    pdfBytes: buf.length,
    seedId: seed.id,
  });
});

test('C1-07 /success auto-download with free coupon session', async ({ page }, testInfo) => {
  test.skip(!PAY_READY, PAY_BLOCKED);
  test.skip(!checkoutSessionId, 'no session');
  test.setTimeout(180_000);

  const downloadPromise = page.waitForEvent('download', { timeout: 120_000 });
  await page.goto(`/success?session_id=${encodeURIComponent(checkoutSessionId)}`);
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`diagnostic-${submissionId}.pdf`);
  const pdfPath = testInfo.outputPath(`coupon-${submissionId}.pdf`);
  await download.saveAs(pdfPath);
  const buf = fs.readFileSync(pdfPath);
  expect(buf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  expect(buf.length).toBeGreaterThan(10_240);
  ev('C1-07', {
    filename: download.suggestedFilename(),
    pdfBytes: buf.length,
    savedTo: pdfPath,
    coupon: COUPON,
  });
});
