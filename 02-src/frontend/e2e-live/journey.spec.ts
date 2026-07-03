// e2e-live/journey.spec.ts — the REAL customer journey, one test() per step,
// run in order against a deployed site (PLAYWRIGHT_BASE_URL). No mock LLM, no
// fake Stripe SDK, no bypass endpoints: this drives the same DOM, the same
// same-origin API paths, the same Stripe hosted checkout and the same
// auto-download a paying customer hits.
//
// Run:  pnpm run test:live                     (defaults to https://diagnosticpro.io)
//       PLAYWRIGHT_BASE_URL=https://... pnpm exec playwright test --project=live-journey
//
// Gating env (payment + member steps only):
//   DPRO_STRIPE_TEST_MODE=1   target backend runs Stripe TEST keys (sk_test) —
//                             enables the 4242-card payment steps. The suite
//                             HARD-REFUSES to pay a cs_live_ session either way.
//   DPRO_WHOP_TEST_TOKEN      a real Whop member access token (J2)
//   DPRO_WHOP_TEST_EMAIL      the member's email (submission ownership check)
//
// Every step appends a machine-readable result row; the suite writes
// tests/live/JOURNEY-<epoch>.json at the end (extends the LIVE-000N convention).
// Steps are serial: the first broken link fails and names itself; later steps
// are skipped, so a red run always points at the exact broken step.

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
const RESULTS_DIR = path.join(REPO_ROOT, 'tests', 'live');
const RUN_EPOCH = Date.now();

const PAY_READY = process.env.DPRO_STRIPE_TEST_MODE === '1';
const WHOP_TOKEN = process.env.DPRO_WHOP_TEST_TOKEN || '';
const WHOP_EMAIL = process.env.DPRO_WHOP_TEST_EMAIL || '';

const PAY_BLOCKED_REASON =
  'blocked: payment steps need a target backend running Stripe TEST-mode keys ' +
  '(set DPRO_STRIPE_TEST_MODE=1 once sk_test is deployed to the test target — ' +
  'see /dev/shm/dpro-test-keys.env handoff)';
const WHOP_BLOCKED_REASON =
  'blocked: needs DPRO_WHOP_TEST_TOKEN (+ DPRO_WHOP_TEST_EMAIL) for a real Whop member';

// ---------- shared journey state (serial suite, single worker) ----------
let submissionId = '';
let checkoutSessionId = '';
let checkoutUrl = '';
let downloadUrl = '';
let viewUrl = '';
let whopSubmissionId = '';

// ---------- per-step results (Phase 5 home: tests/live/JOURNEY-*.json) ----------
type StepEvidence = Record<string, unknown>;
const evidence: Record<string, StepEvidence> = {};
const results: Array<{
  id: string;
  name: string;
  status: string;
  ms: number;
  evidence?: StepEvidence;
  error?: string;
}> = [];

function ev(stepId: string, data: StepEvidence) {
  evidence[stepId] = { ...(evidence[stepId] ?? {}), ...data };
}

test.describe.configure({ mode: 'serial' });

test.afterEach(async ({}, testInfo) => {
  const id = testInfo.title.split(' ')[0]; // "J1-01", "J2-02", ...
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
  const out = path.join(RESULTS_DIR, `JOURNEY-${RUN_EPOCH}.json`);
  const summary = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  fs.writeFileSync(out, JSON.stringify({
    run: `JOURNEY-${RUN_EPOCH}`,
    baseUrl: testInfo.project.use.baseURL,
    startedAt: new Date(RUN_EPOCH).toISOString(),
    finishedAt: new Date().toISOString(),
    gates: { stripeTestMode: PAY_READY, whopMemberToken: !!WHOP_TOKEN },
    summary,
    journeyState: { submissionId, checkoutSessionId, whopSubmissionId },
    steps: results,
  }, null, 2) + '\n');
  console.log(`\n[journey] results -> ${out}`);
});

// helper: poll POST /analysisStatus until one of `wanted` (or fail on `fatal`)
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

// ============================ J1 — retail purchase ============================

test('J1-01 landing page serves 200 with the diagnostic form and CTA', async ({ page }) => {
  // Folds in 03-tests/e2e/smoke.spec.ts (title + CTA) as journey step 1.
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/DiagnosticPro/i);
  await expect(page.locator('text=/Pay|Checkout|Get Report|Start/i').first()).toBeVisible();
  await expect(page.locator('#diagnostic-form')).toBeAttached();
  ev('J1-01', { http: response?.status(), title: await page.title() });
});

test('J1-02 real form submit persists a pending submission', async ({ page }) => {
  // /equipment/automotive is a real production route that pre-selects the
  // equipment type (the landing grid tile does the same thing).
  await page.goto('/equipment/automotive', { waitUntil: 'domcontentloaded' });

  // make / model / year are Radix Selects (no native <select>, dangling labels)
  await page.getByText('Select manufacturer').click();
  await page.getByRole('option', { name: 'Toyota', exact: true }).click();
  await page.getByText('Select model', { exact: true }).click();
  await page.getByRole('option', { name: 'Camry', exact: true }).click();
  await page.getByText('Select year').click();
  await page.getByRole('option', { name: '2020', exact: true }).click();

  await page.locator('#description').fill(
    'Check engine light with rough idle and a single-cylinder misfire under load. ' +
    'Scanner shows P0301. Started two weeks ago, worse on cold mornings.'
  );

  // optional-details section (mileage + error codes) — richer real report
  await page.getByRole('button', { name: /Add Details/i }).click();
  await page.locator('#mileage').fill('84500');
  await page.locator('#error-codes').fill('P0301');

  await page.locator('#full-name').fill('Journey Probe');
  await page.locator('#email').fill(`journey+${RUN_EPOCH}@intentsolutions.io`);

  // "Review" mounts DiagnosticReview, whose effect POSTs /saveSubmission
  const [saveRes] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith('/saveSubmission') && r.request().method() === 'POST',
      { timeout: 30_000 },
    ),
    page.getByRole('button', { name: 'Review' }).click(),
  ]);
  expect(saveRes.status()).toBe(200);
  const saved = await saveRes.json();
  submissionId = saved.submissionId;
  expect(submissionId).toMatch(/^diag_\d{13}_[0-9a-f]{8}$/);

  // the row exists server-side as 'pending'
  const st = await page.request.post('/analysisStatus', { data: { submissionId } });
  expect(st.status()).toBe(200);
  expect((await st.json()).status).toBe('pending');
  ev('J1-02', { submissionId, http: saveRes.status(), dbStatus: 'pending' });
});

test('J1-03 pay CTA renders bound to the submission (client-reference-id)', async ({ page }) => {
  test.skip(!submissionId, 'no submission from J1-02');
  // Re-drive to the review state in this page context (serial but fresh page).
  await page.goto('/equipment/automotive', { waitUntil: 'domcontentloaded' });
  await page.getByText('Select manufacturer').click();
  await page.getByRole('option', { name: 'Toyota', exact: true }).click();
  await page.getByText('Select model', { exact: true }).click();
  await page.getByRole('option', { name: 'Camry', exact: true }).click();
  await page.getByText('Select year').click();
  await page.getByRole('option', { name: '2020', exact: true }).click();
  await page.locator('#description').fill('P0301 misfire journey probe — pay CTA render check.');
  await page.locator('#full-name').fill('Journey Probe');
  await page.locator('#email').fill(`journey+${RUN_EPOCH}@intentsolutions.io`);
  const [saveRes] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().endsWith('/saveSubmission') && r.request().method() === 'POST',
      { timeout: 30_000 },
    ),
    page.getByRole('button', { name: 'Review' }).click(),
  ]);
  const ctaSubmissionId = (await saveRes.json()).submissionId;

  const buyBtn = page.locator('stripe-buy-button');
  await expect(buyBtn).toBeAttached({ timeout: 30_000 });
  await expect(buyBtn).toHaveAttribute('client-reference-id', ctaSubmissionId, { timeout: 30_000 });
  const pk = (await buyBtn.getAttribute('publishable-key')) ?? '';
  const pkMode = pk.startsWith('pk_live_') ? 'live' : pk.startsWith('pk_test_') ? 'test' : 'unknown';
  // the web component upgraded (Stripe script loaded) — it renders an iframe
  await expect(buyBtn.locator('iframe')).toBeAttached({ timeout: 30_000 });
  ev('J1-03', { ctaSubmissionId, pkMode, buyButtonId: await buyBtn.getAttribute('buy-button-id') });
});

test('J1-04 server-created checkout session returns a Stripe-hosted URL', async ({ request }) => {
  test.skip(!submissionId, 'no submission from J1-02');
  // The locked checkout decision: /createCheckoutSession (server-side session)
  // replaces the dashboard-bound buy button. Same Stripe-hosted page, fully
  // API-scriptable. Creating an (unpaid) session is safe in any key mode.
  const res = await request.post('/createCheckoutSession', { data: { submissionId } });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.sessionId).toMatch(/^cs_(test|live)_/);
  expect(body.url).toContain('checkout.stripe.com');
  checkoutSessionId = body.sessionId;
  checkoutUrl = body.url;
  ev('J1-04', {
    sessionId: checkoutSessionId,
    mode: checkoutSessionId.startsWith('cs_test_') ? 'test' : 'live',
    http: res.status(),
  });
});

test('J1-05 hosted checkout accepts the 4242 test card and redirects to /success', async ({ page }) => {
  test.skip(!PAY_READY, PAY_BLOCKED_REASON);
  test.skip(!checkoutUrl, 'no checkout session from J1-04');
  test.setTimeout(180_000);
  // Hard refusal: never submit a card against a LIVE-mode session.
  expect(checkoutSessionId).toMatch(/^cs_test_/);

  await page.goto(checkoutUrl, { waitUntil: 'domcontentloaded' });
  // Selectors verified against the real hosted-checkout DOM (probe 2026-07-02):
  // direct inputs #email/#cardNumber/#cardExpiry/#cardCvc/#billingName/
  // #billingPostalCode, card accordion radio, Link enrollment checkbox.
  await page.locator('#email').fill(`journey+${RUN_EPOCH}@intentsolutions.io`);
  const cardRadio = page.locator('#payment-method-accordion-item-title-card');
  if ((await cardRadio.count()) && !(await cardRadio.isChecked())) await cardRadio.click();
  await page.locator('#cardNumber').fill('4242 4242 4242 4242');
  await page.locator('#cardExpiry').fill('12 / 34');
  await page.locator('#cardCvc').fill('123');
  await page.locator('#billingName').fill('Journey Probe');
  const zipField = page.locator('#billingPostalCode');
  if (await zipField.count()) await zipField.fill('30301');
  // Decline Link enrollment — it makes phoneNumber required and blocks submit.
  const linkPass = page.locator('#enableStripePass');
  if ((await linkPass.count()) && (await linkPass.isChecked())) await linkPass.uncheck();

  await page.locator('[data-testid="hosted-payment-submit-button"]').click();
  await page.waitForURL(/\/success\?session_id=cs_/, { timeout: 90_000 });
  const url = new URL(page.url());
  expect(url.searchParams.get('session_id')).toBe(checkoutSessionId);
  ev('J1-05', { redirectedTo: url.pathname + url.search });
});

test('J1-06 checkout.session.completed webhook flips the submission to paid + queues analysis', async ({ request }) => {
  test.skip(!PAY_READY, PAY_BLOCKED_REASON);
  test.skip(!checkoutSessionId.startsWith('cs_test_'), 'no completed test-mode payment');
  test.setTimeout(120_000);
  // The webhook (real signature verify against the test-mode whsec) marks the
  // row paid then immediately starts analysis — leaving 'pending' proves it fired.
  const reached = await pollStatus(request, submissionId, ['paid', 'processing', 'ready'], 90_000);
  ev('J1-06', { dbStatus: reached });
  expect(['paid', 'processing', 'ready']).toContain(reached);
});

test('J1-07 /checkout/session resolves the session back to the submission', async ({ request }) => {
  test.skip(!PAY_READY, PAY_BLOCKED_REASON);
  test.skip(!checkoutSessionId, 'no checkout session');
  const res = await request.get(`/checkout/session?id=${encodeURIComponent(checkoutSessionId)}`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.submissionId ?? body.client_reference_id).toBe(submissionId);
  ev('J1-07', { http: res.status(), resolved: body.submissionId ?? body.client_reference_id });
});

test('J1-08 real LLM analysis completes to ready', async ({ request }) => {
  test.skip(!PAY_READY, PAY_BLOCKED_REASON);
  test.skip(!submissionId, 'no submission');
  test.setTimeout(420_000);
  // Real LLM latency: a 2,000–2,500-word 15-section report takes 1–3 minutes.
  const reached = await pollStatus(request, submissionId, ['ready'], 360_000);
  expect(reached).toBe('ready');
  // DB-level structural checks (model='gpt-4o', framework v2.0, 15 sections,
  // detected_codes contains P0301) run via scripts/verify-live-analysis.sh —
  // the DB is not exposed over HTTP by design. This step records the id for it.
  ev('J1-08', { dbStatus: reached, verifyWith: `scripts/verify-live-analysis.sh ${submissionId}` });
});

test('J1-09 signed-url endpoint returns the download + view contract', async ({ request }) => {
  test.skip(!PAY_READY, PAY_BLOCKED_REASON);
  test.skip(!submissionId, 'no submission');
  const res = await request.get(`/reports/signed-url?submissionId=${encodeURIComponent(submissionId)}`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.downloadUrl).toContain('/reports/download/');
  expect(body.viewUrl).toContain('/view/');
  downloadUrl = body.downloadUrl;
  viewUrl = body.viewUrl;
  ev('J1-09', { http: res.status(), downloadUrl, viewUrl });
});

test('J1-10 /success auto-downloads the real PDF report', async ({ page }, testInfo) => {
  test.skip(!PAY_READY, PAY_BLOCKED_REASON);
  test.skip(!checkoutSessionId, 'no checkout session');
  test.setTimeout(180_000);
  // PaymentSuccess resolves session -> submission, polls signed-url, then fires
  // window.location.href = downloadUrl. Report is already ready (J1-08), so the
  // download starts on the first poll — well inside the UI's 30-attempt budget.
  const downloadPromise = page.waitForEvent('download', { timeout: 120_000 });
  await page.goto(`/success?session_id=${encodeURIComponent(checkoutSessionId)}`);
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(`diagnostic-${submissionId}.pdf`);
  const pdfPath = testInfo.outputPath(`journey-${submissionId}.pdf`);
  await download.saveAs(pdfPath);
  const buf = fs.readFileSync(pdfPath);
  expect(buf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  expect(buf.length).toBeGreaterThan(10_240);
  ev('J1-10', { filename: download.suggestedFilename(), pdfBytes: buf.length, savedTo: pdfPath });
});

test('J1-11 /view serves the report inline as PDF', async ({ request }) => {
  test.skip(!PAY_READY, PAY_BLOCKED_REASON);
  test.skip(!viewUrl, 'no viewUrl from J1-09');
  const res = await request.get(viewUrl);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('application/pdf');
  const body = await res.body();
  expect(body.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  ev('J1-11', { http: res.status(), contentType: res.headers()['content-type'], bytes: body.length });
});

// ======================= J2 — Whop member (no Stripe) ========================

test('J2-01 Whop member token verifies as an active membership', async ({ request }) => {
  test.skip(!WHOP_TOKEN, WHOP_BLOCKED_REASON);
  const res = await request.get('/api/auth/whop-verify', {
    headers: { 'x-whop-token': WHOP_TOKEN },
  });
  expect(res.status()).toBe(200);
  expect((await res.json()).isMember).toBe(true);
  ev('J2-01', { http: res.status(), isMember: true });
});

test('J2-02 member analysis runs free and delivers a real downloadable report', async ({ request }) => {
  test.skip(!WHOP_TOKEN || !WHOP_EMAIL, WHOP_BLOCKED_REASON);
  test.setTimeout(420_000);
  // Submission via the API contract J1-02 already proved through the UI —
  // the member-specific surface under test here is /api/whop/analyze.
  const save = await request.post('/saveSubmission', {
    data: {
      payload: {
        equipmentType: 'semi-trucks',
        make: 'Kenworth',
        model: 'T680',
        year: '2017',
        symptoms: 'Derate active, SPN 3216 FMI 4 aftertreatment NOx sensor',
        problemDescription: 'Power drops to 5 mph after ~20 minutes at highway speed.',
        email: WHOP_EMAIL,
      },
    },
  });
  expect(save.status()).toBe(200);
  whopSubmissionId = (await save.json()).submissionId;

  const analyze = await request.post('/api/whop/analyze', {
    headers: { 'x-whop-token': WHOP_TOKEN },
    data: { submissionId: whopSubmissionId },
  });
  expect(analyze.status()).toBe(200);
  expect((await analyze.json()).status).toBe('processing');

  const reached = await pollStatus(request, whopSubmissionId, ['ready'], 360_000);
  expect(reached).toBe('ready');

  const signed = await request.get(`/reports/signed-url?submissionId=${encodeURIComponent(whopSubmissionId)}`);
  expect(signed.status()).toBe(200);
  const { downloadUrl: memberDl } = await signed.json();
  const pdf = await request.get(memberDl);
  expect(pdf.status()).toBe(200);
  const body = await pdf.body();
  expect(body.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  expect(body.length).toBeGreaterThan(10_240);
  ev('J2-02', { whopSubmissionId, dbStatus: reached, pdfBytes: body.length });
});
