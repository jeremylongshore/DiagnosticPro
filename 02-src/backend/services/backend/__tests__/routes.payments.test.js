// P0 route tests: Stripe payment flow.
//
// Part 1 (in-process): /stripeWebhookForward via the dev unsigned path — with
// no STRIPE_WEBHOOK_SECRET and no initialized stripeClient (index.js only
// initializes it under require.main), the handler falls through to the
// dev/testing branch (index.js ~L1007) that JSON-parses the raw Buffer body.
// Also covers /createCheckoutSession + /checkout/session degradation when the
// Stripe client is absent.
//
// Part 2 (child process): spawns index.js with a preloaded fake `stripe`
// module (helpers/stripe-preload.js) so the checkout-session SUCCESS contract
// (line items -> amount_total 499, client_reference_id, session url) is tested
// over real HTTP.

const os = require('os');
const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'diagpro-payments-'));
process.env.DB_PATH = path.join(tmpRoot, 'test.db');
process.env.REPORTS_DIR = path.join(tmpRoot, 'reports');
process.env.TEST_MOCK_LLM = 'true';
delete process.env.STRIPE_WEBHOOK_SECRET;

const request = require('supertest');
const app = require('../index.js');
const { getDb, closeDb } = require('../db');

const db = getDb();

function insertSubmission(id, status, payload) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO diagnostic_submissions (id, status, price_cents, payload, created_at, updated_at)
    VALUES (?, ?, 499, ?, ?, ?)
  `).run(id, status, JSON.stringify(payload), now, now);
}

function postWebhook(event) {
  return request(app)
    .post('/stripeWebhookForward')
    .set('Content-Type', 'application/json')
    .send(typeof event === 'string' ? event : JSON.stringify(event));
}

async function pollUntilStatus(id, wanted, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const row = db.prepare('SELECT status FROM diagnostic_submissions WHERE id = ?').get(id);
    if (row && row.status === wanted) return row.status;
    await new Promise((r) => setTimeout(r, 100));
  }
  const row = db.prepare('SELECT status FROM diagnostic_submissions WHERE id = ?').get(id);
  throw new Error(`Timed out waiting for ${id} to reach '${wanted}' (last: ${row?.status})`);
}

afterAll(() => {
  closeDb();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('POST /stripeWebhookForward (dev unsigned path)', () => {
  const paidId = 'diag_1730421100001_5a6b7c8d';
  const sessionId = 'cs_test_a1B2c3D4e5F6';
  const completedEvent = {
    id: 'evt_1QxKenworth001',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: sessionId,
        client_reference_id: null,
        metadata: { submissionId: paidId },
        amount_total: 1299
      }
    }
  };

  beforeAll(() => {
    insertSubmission(paidId, 'pending', {
      equipmentType: 'diesel-trucks',
      make: 'Ram',
      model: '3500 Cummins',
      year: '2016',
      symptoms: 'White smoke on cold start, P2609 intake heater code'
    });
  });

  test('first delivery marks the submission paid with the session amount and queues analysis', async () => {
    const res = await postWebhook(completedEvent);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    const row = db.prepare(
      'SELECT stripe_session_id, amount_paid_cents, paid_at FROM diagnostic_submissions WHERE id = ?'
    ).get(paidId);
    expect(row.stripe_session_id).toBe(sessionId);
    expect(row.amount_paid_cents).toBe(1299);
    expect(row.paid_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    // Analysis was queued and (with the mock LLM) completes
    await pollUntilStatus(paidId, 'ready');
    const analysis = db.prepare('SELECT status, report_path FROM analyses WHERE id = ?').get(paidId);
    expect(analysis.status).toBe('ready');
    expect(analysis.report_path).toBe(`reports/${paidId}.pdf`);
  }, 60000);

  test('replayed delivery is acknowledged as duplicate and does not re-queue analysis', async () => {
    const before = db.prepare('SELECT status, updated_at FROM analyses WHERE id = ?').get(paidId);
    expect(before.status).toBe('ready');

    const res = await postWebhook(completedEvent);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true, duplicate: true });

    const after = db.prepare('SELECT status, updated_at FROM analyses WHERE id = ?').get(paidId);
    expect(after.status).toBe('ready');
    expect(after.updated_at).toBe(before.updated_at);

    const sub = db.prepare('SELECT status FROM diagnostic_submissions WHERE id = ?').get(paidId);
    expect(sub.status).toBe('ready');
  });

  test('completed session without any submissionId is rejected with MISSING_SUBMISSION_ID', async () => {
    const res = await postWebhook({
      id: 'evt_1QxNoSubmission',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_noSubRef01', metadata: {}, amount_total: 499 } }
    });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'No submissionId in metadata', code: 'MISSING_SUBMISSION_ID' });
  });

  test('non-JSON body is rejected with INVALID_BODY', async () => {
    const res = await postWebhook('{"id": "evt_truncated"');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid JSON body', code: 'INVALID_BODY' });
  });

  test('event without an id is rejected with INVALID_EVENT', async () => {
    const res = await postWebhook({ type: 'checkout.session.completed', data: { object: {} } });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid event data', code: 'INVALID_EVENT' });
  });

  test('unhandled event types are acknowledged without side effects', async () => {
    const res = await postWebhook({ id: 'evt_1QxInvoice77', type: 'invoice.paid', data: { object: {} } });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });
});

describe('checkout endpoints without an initialized Stripe client (test env degradation)', () => {
  test('POST /createCheckoutSession without submissionId returns MISSING_SUBMISSION_ID', async () => {
    const res = await request(app).post('/createCheckoutSession').send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'submissionId is required', code: 'MISSING_SUBMISSION_ID' });
  });

  test('POST /createCheckoutSession for an unknown submission returns SUBMISSION_NOT_FOUND', async () => {
    const res = await request(app).post('/createCheckoutSession').send({ submissionId: 'diag_1730421100099_00000000' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Submission not found', code: 'SUBMISSION_NOT_FOUND' });
  });

  test('POST /createCheckoutSession for an already-ready submission returns INVALID_STATUS', async () => {
    const readyId = 'diag_1730421100002_9e8d7c6b';
    insertSubmission(readyId, 'ready', { equipmentType: 'marine', model: 'F150 outboard', symptoms: 'Overheat alarm at 4000 RPM' });
    const res = await request(app).post('/createCheckoutSession').send({ submissionId: readyId });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid submission status: ready', code: 'INVALID_STATUS' });
  });

  test('POST /createCheckoutSession degrades to a 500 STRIPE_ERROR when the client is absent', async () => {
    const pendingId = 'diag_1730421100003_4f5e6d7c';
    insertSubmission(pendingId, 'pending', { equipmentType: 'golf-carts', model: 'TXT 48V', symptoms: 'No movement, solenoid clicks once' });
    const res = await request(app).post('/createCheckoutSession').send({ submissionId: pendingId });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to create checkout session');
    expect(res.body.code).toBe('STRIPE_ERROR');
  });

  test('GET /checkout/session without id returns 400', async () => {
    const res = await request(app).get('/checkout/session');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'session id query parameter required' });
  });

  test('GET /checkout/session rejects ids without the cs_ prefix', async () => {
    const res = await request(app).get('/checkout/session').query({ id: 'sess_8842abcd' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid session id' });
  });

  test('GET /checkout/session degrades to a 500 CHECKOUT_SESSION_ERROR when the client is absent', async () => {
    const res = await request(app).get('/checkout/session').query({ id: 'cs_test_unknownXyZ9' });
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to retrieve checkout session');
    expect(res.body.code).toBe('CHECKOUT_SESSION_ERROR');
  });
});

describe('checkout success contract (child process with fake stripe SDK)', () => {
  const backendDir = path.join(__dirname, '..');
  const preloadPath = path.join(__dirname, 'helpers', 'stripe-preload.js');
  const childTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'diagpro-stripe-child-'));
  let child;
  let baseUrl;

  function getFreePort() {
    return new Promise((resolve, reject) => {
      const srv = net.createServer();
      srv.once('error', reject);
      srv.listen(0, '127.0.0.1', () => {
        const port = srv.address().port;
        srv.close(() => resolve(port));
      });
    });
  }

  beforeAll(async () => {
    const port = await getFreePort();
    baseUrl = `http://127.0.0.1:${port}`;
    child = spawn(process.execPath, ['--require', preloadPath, 'index.js'], {
      cwd: backendDir,
      env: {
        ...process.env,
        PORT: String(port),
        DB_PATH: path.join(childTmp, 'child.db'),
        REPORTS_DIR: path.join(childTmp, 'reports'),
        NODE_ENV: 'test',
        TEST_MOCK_LLM: 'true',
        STRIPE_SECRET_KEY: 'sk_test_placeholder_preload_fake'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    const deadline = Date.now() + 20000;
    let lastErr;
    while (Date.now() < deadline) {
      try {
        const res = await request(baseUrl).get('/healthz');
        if (res.status === 200) return;
      } catch (err) {
        lastErr = err;
      }
      await new Promise((r) => setTimeout(r, 150));
    }
    throw new Error(`child backend never became healthy: ${lastErr}`);
  }, 30000);

  afterAll(async () => {
    if (child) {
      const exited = new Promise((resolve) => child.once('exit', resolve));
      child.kill('SIGTERM');
      await exited;
    }
    fs.rmSync(childTmp, { recursive: true, force: true });
  });

  let submissionId;
  let checkoutSessionId;

  test('POST /createCheckoutSession creates a $4.99 session with the submission as reference', async () => {
    const save = await request(baseUrl).post('/saveSubmission').send({
      payload: {
        equipmentType: 'hvac',
        make: 'Trane',
        model: 'XR16',
        year: '2015',
        symptoms: 'Compressor hard-start, breaker trips after 8 minutes'
      }
    });
    expect(save.status).toBe(200);
    submissionId = save.body.submissionId;

    const res = await request(baseUrl).post('/createCheckoutSession').send({ submissionId });
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toMatch(/^cs_test_fake\d{6}$/);
    expect(res.body.url).toBe(`https://checkout.stripe.com/c/pay/${res.body.sessionId}`);
    checkoutSessionId = res.body.sessionId;
  }, 15000);

  test('GET /checkout/session round-trips the created session: 499 cents, submission linked', async () => {
    const res = await request(baseUrl).get('/checkout/session').query({ id: checkoutSessionId });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: checkoutSessionId,
      status: 'open',
      payment_status: 'unpaid',
      submissionId,
      client_reference_id: submissionId,
      amount_total: 499
    });
  }, 15000);
});
