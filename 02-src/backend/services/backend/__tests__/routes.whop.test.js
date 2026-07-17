// P0 route tests: Whop webhook signature verification, OAuth exchange/verify,
// and member-gated /api/whop/analyze. Whop API calls go through global fetch,
// which is mocked per test; webhook signatures are computed independently in
// the test with node:crypto (never by calling the code under test).

const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'diagpro-whop-'));
process.env.DB_PATH = path.join(tmpRoot, 'test.db');
process.env.REPORTS_DIR = path.join(tmpRoot, 'reports');
process.env.LLM_API_KEY = 'sk-unit-test-fake-key-not-real';
delete process.env.LLM_MODEL;
delete process.env.LLM_FRAMEWORK_VERSION;

// LLM isolated at the `openai` module boundary (no prod-code mock branch).
// The openai client never touches global.fetch here, so the per-test Whop
// fetch mocks below stay authoritative for Whop API traffic.
const mockLlmCreate = jest.fn(async () => ({
  choices: [{ message: { content: '1. PRIMARY DIAGNOSIS\nUnit-canned member-path report. Confidence 90%.\n\n15. NEXT STEPS SUMMARY\n- step' } }]
}));
jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: (...args) => mockLlmCreate(...args) } }
  }))
);

// Standard Webhooks secret: "whsec_" + base64(raw signing key)
const SIGNING_KEY = Buffer.from('diagpro-whop-unit-signing-key-2026');
const WEBHOOK_SECRET = `whsec_${SIGNING_KEY.toString('base64')}`;
process.env.WHOP_WEBHOOK_SECRET = WEBHOOK_SECRET;

const request = require('supertest');
const app = require('../index.js');
const { getDb, closeDb } = require('../db');

const db = getDb();

let fetchMock = jest.fn(async (url) => {
  throw new Error(`unexpected fetch in test: ${url}`);
});
global.fetch = (...args) => fetchMock(...args);

function jsonRes(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
    text: async () => JSON.stringify(data)
  };
}

function standardSign(webhookId, timestamp, body) {
  return crypto
    .createHmac('sha256', SIGNING_KEY)
    .update(`${webhookId}.${timestamp}.${body}`)
    .digest('base64');
}

function postWhopWebhook(body, headers) {
  let req = request(app).post('/api/webhooks/whop').set('Content-Type', 'application/json');
  for (const [k, v] of Object.entries(headers)) req = req.set(k, v);
  return req.send(body);
}

function insertWhopUser(id, isMember) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO whop_users (id, whop_id, username, email, is_member, created_at, updated_at)
    VALUES (?, ?, 'fleetdispatch', 'dispatch@kenworthfleet.com', ?, ?, ?)
  `).run(id, id, isMember ? 1 : 0, now, now);
}

function insertSubmission(id, status, payload) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO diagnostic_submissions (id, status, price_cents, payload, created_at, updated_at)
    VALUES (?, ?, 499, ?, ?, ?)
  `).run(id, status, JSON.stringify(payload), now, now);
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

describe('POST /api/webhooks/whop — Standard Webhooks scheme', () => {
  test('valid v1 signature on membership.went_valid flips the user to member', async () => {
    insertWhopUser('user_ohLK9v', false);
    const body = JSON.stringify({ action: 'membership.went_valid', data: { user_id: 'user_ohLK9v' } });
    const sig = standardSign('msg_2aXq7', '1751328000', body);

    const res = await postWhopWebhook(body, {
      'webhook-id': 'msg_2aXq7',
      'webhook-timestamp': '1751328000',
      'webhook-signature': `v1,${sig}`
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    const row = db.prepare('SELECT is_member, last_verified FROM whop_users WHERE id = ?').get('user_ohLK9v');
    expect(row.is_member).toBe(1);
    expect(row.last_verified).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('valid signature on membership.went_invalid flips the user off membership', async () => {
    insertWhopUser('user_pQ3zR8', true);
    const body = JSON.stringify({ action: 'membership.went_invalid', data: { user_id: 'user_pQ3zR8' } });
    const sig = standardSign('msg_9bYw3', '1751328060', body);

    const res = await postWhopWebhook(body, {
      'webhook-id': 'msg_9bYw3',
      'webhook-timestamp': '1751328060',
      'webhook-signature': `v1,${sig}`
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(db.prepare('SELECT is_member FROM whop_users WHERE id = ?').get('user_pQ3zR8').is_member).toBe(0);
  });

  test('accepts a multi-entry signature header where only the second entry matches', async () => {
    const body = JSON.stringify({ action: 'payment.succeeded', data: { user_id: 'user_ohLK9v' } });
    const good = standardSign('msg_multi1', '1751328120', body);
    const bogus = crypto.createHmac('sha256', SIGNING_KEY).update('unrelated-content').digest('base64');

    const res = await postWhopWebhook(body, {
      'webhook-id': 'msg_multi1',
      'webhook-timestamp': '1751328120',
      'webhook-signature': `v1,${bogus} v1,${good}`
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });

  test('rejects a tampered body signed for different content with 401', async () => {
    const signedBody = JSON.stringify({ action: 'membership.went_valid', data: { user_id: 'user_ohLK9v' } });
    const tamperedBody = JSON.stringify({ action: 'membership.went_valid', data: { user_id: 'user_attacker' } });
    const sig = standardSign('msg_tamper1', '1751328180', signedBody);

    const res = await postWhopWebhook(tamperedBody, {
      'webhook-id': 'msg_tamper1',
      'webhook-timestamp': '1751328180',
      'webhook-signature': `v1,${sig}`
    });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid webhook signature' });
  });

  test('rejects a request with no signature headers at all with 401', async () => {
    const res = await postWhopWebhook(JSON.stringify({ action: 'membership.went_valid', data: {} }), {});
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid webhook signature' });
  });

  test('valid signature over a non-JSON body returns 400 INVALID_BODY, not 401', async () => {
    const body = 'this is not json {{';
    const sig = standardSign('msg_notjson1', '1751328240', body);
    const res = await postWhopWebhook(body, {
      'webhook-id': 'msg_notjson1',
      'webhook-timestamp': '1751328240',
      'webhook-signature': `v1,${sig}`
    });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid JSON body', code: 'INVALID_BODY' });
  });

  test('rejects everything with 401 when WHOP_WEBHOOK_SECRET is unset', async () => {
    delete process.env.WHOP_WEBHOOK_SECRET;
    try {
      const body = JSON.stringify({ action: 'membership.went_valid', data: { user_id: 'user_ohLK9v' } });
      const sig = standardSign('msg_nosecret1', '1751328300', body);
      const res = await postWhopWebhook(body, {
        'webhook-id': 'msg_nosecret1',
        'webhook-timestamp': '1751328300',
        'webhook-signature': `v1,${sig}`
      });
      expect(res.status).toBe(401);
    } finally {
      process.env.WHOP_WEBHOOK_SECRET = WEBHOOK_SECRET;
    }
  });
});

describe('POST /api/webhooks/whop — legacy plain-HMAC fallback', () => {
  // Fallback keys off the FULL secret string (including the whsec_ prefix)
  test('accepts a hex HMAC of the raw body via whop-signature', async () => {
    const body = JSON.stringify({ action: 'payment.succeeded', data: { receipt_id: 'rec_88Hq2' } });
    const hexSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
    const res = await postWhopWebhook(body, { 'whop-signature': hexSig });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });

  test('accepts a base64 HMAC of the raw body via x-whop-signature', async () => {
    const body = JSON.stringify({ action: 'payment.succeeded', data: { receipt_id: 'rec_31Zt9' } });
    const b64Sig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('base64');
    const res = await postWhopWebhook(body, { 'x-whop-signature': b64Sig });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });

  test('length-mismatched signature is a 401 auth failure, never a 500', async () => {
    const body = JSON.stringify({ action: 'membership.went_valid', data: { user_id: 'user_ohLK9v' } });
    const res = await postWhopWebhook(body, { 'whop-signature': 'deadbeef' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid webhook signature' });
  });
});

describe('POST /api/auth/whop-exchange', () => {
  const whopUser = {
    id: 'user_ohLK9v',
    username: 'fleetdispatch',
    name: 'Dana Dispatch',
    email: 'dispatch@kenworthfleet.com'
  };

  test('rejects a request missing code_verifier with 400', async () => {
    const res = await request(app).post('/api/auth/whop-exchange').send({ code: 'authcode_x7Y2' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing code or code_verifier' });
  });

  test('failed token exchange returns 401 Authentication failed', async () => {
    fetchMock = jest.fn(async (url) => {
      if (String(url).includes('data.whop.com/oauth/token')) return jsonRes(400, { error: 'invalid_grant' });
      throw new Error(`unexpected fetch: ${url}`);
    });
    const res = await request(app)
      .post('/api/auth/whop-exchange')
      .send({ code: 'authcode_expired9', code_verifier: 'verifier_Lk3m' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication failed' });
  });

  test('successful exchange upserts the member into whop_users and returns membership details', async () => {
    fetchMock = jest.fn(async (url) => {
      const u = String(url);
      if (u.includes('data.whop.com/oauth/token')) return jsonRes(200, { access_token: 'whop_at_7HqPz' });
      if (u.includes('/me/memberships')) return jsonRes(200, { data: [{ id: 'mem_R7K2p', plan_id: 'plan_dp499' }] });
      if (u.endsWith('/me')) return jsonRes(200, whopUser);
      throw new Error(`unexpected fetch: ${u}`);
    });

    const res = await request(app)
      .post('/api/auth/whop-exchange')
      .send({ code: 'authcode_x7Y2', code_verifier: 'verifier_Lk3m' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      token: 'whop_at_7HqPz',
      user: {
        id: 'user_ohLK9v',
        username: 'fleetdispatch',
        name: 'Dana Dispatch',
        email: 'dispatch@kenworthfleet.com'
      },
      isMember: true,
      membershipId: 'mem_R7K2p',
      membershipPlan: 'plan_dp499'
    });

    const row = db.prepare('SELECT * FROM whop_users WHERE id = ?').get('user_ohLK9v');
    expect(row.is_member).toBe(1);
    expect(row.membership_id).toBe('mem_R7K2p');
    expect(row.email).toBe('dispatch@kenworthfleet.com');
  });

  test('exchange for a user without an active membership returns isMember false', async () => {
    fetchMock = jest.fn(async (url) => {
      const u = String(url);
      if (u.includes('data.whop.com/oauth/token')) return jsonRes(200, { access_token: 'whop_at_nonmem3' });
      if (u.includes('/me/memberships')) return jsonRes(200, { data: [] });
      if (u.endsWith('/me')) return jsonRes(200, { id: 'user_nOm3mb', username: 'windowshopper', email: 'tryout@rgvcitrus.com' });
      throw new Error(`unexpected fetch: ${u}`);
    });

    const res = await request(app)
      .post('/api/auth/whop-exchange')
      .send({ code: 'authcode_n0mem', code_verifier: 'verifier_Q9wd' });
    expect(res.status).toBe(200);
    expect(res.body.isMember).toBe(false);
    expect(res.body.membershipId).toBe(null);
    expect(db.prepare('SELECT is_member FROM whop_users WHERE id = ?').get('user_nOm3mb').is_member).toBe(0);
  });

  test('failed user-info fetch after token exchange returns 401', async () => {
    fetchMock = jest.fn(async (url) => {
      const u = String(url);
      if (u.includes('data.whop.com/oauth/token')) return jsonRes(200, { access_token: 'whop_at_badme1' });
      if (u.endsWith('/me')) return jsonRes(403, { error: 'forbidden' });
      throw new Error(`unexpected fetch: ${u}`);
    });
    const res = await request(app)
      .post('/api/auth/whop-exchange')
      .send({ code: 'authcode_badme', code_verifier: 'verifier_T4rp' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication failed' });
  });

  test('network failure during exchange returns 500 Authentication failed', async () => {
    fetchMock = jest.fn(async () => {
      throw new Error('getaddrinfo ENOTFOUND data.whop.com');
    });
    const res = await request(app)
      .post('/api/auth/whop-exchange')
      .send({ code: 'authcode_netdown', code_verifier: 'verifier_Zz1x' });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Authentication failed' });
  });
});

describe('GET /api/auth/whop-verify', () => {
  test('answers isMember false when no token header is sent', async () => {
    const res = await request(app).get('/api/auth/whop-verify');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isMember: false });
  });

  test('answers isMember true when Whop reports an active membership', async () => {
    fetchMock = jest.fn(async (url) => {
      if (String(url).includes('/me/memberships')) return jsonRes(200, { data: [{ id: 'mem_R7K2p' }] });
      throw new Error(`unexpected fetch: ${url}`);
    });
    const res = await request(app).get('/api/auth/whop-verify').set('x-whop-token', 'whop_at_7HqPz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isMember: true });
  });

  test('answers isMember false when the Whop API rejects the token', async () => {
    fetchMock = jest.fn(async () => jsonRes(401, { error: 'unauthorized' }));
    const res = await request(app).get('/api/auth/whop-verify').set('x-whop-token', 'whop_at_revoked2');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ isMember: false });
  });
});

describe('POST /api/whop/analyze (member-gated)', () => {
  function mockMemberFetch() {
    fetchMock = jest.fn(async (url) => {
      const u = String(url);
      if (u.includes('/me/memberships')) return jsonRes(200, { data: [{ id: 'mem_R7K2p', plan_id: 'plan_dp499' }] });
      if (u.endsWith('/me')) return jsonRes(200, { id: 'user_ohLK9v', username: 'fleetdispatch', email: 'dispatch@kenworthfleet.com' });
      throw new Error(`unexpected fetch: ${u}`);
    });
  }

  test('request without an x-whop-token is refused with 403', async () => {
    const res = await request(app).post('/api/whop/analyze').send({ submissionId: 'diag_1730421200001_ee44dd55' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Active Whop membership required' });
  });

  test('token the Whop API rejects is refused with 403', async () => {
    fetchMock = jest.fn(async () => jsonRes(401, { error: 'unauthorized' }));
    const res = await request(app)
      .post('/api/whop/analyze')
      .set('x-whop-token', 'whop_at_revoked2')
      .send({ submissionId: 'diag_1730421200001_ee44dd55' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Active Whop membership required' });
  });

  test('valid member without a submissionId gets 400', async () => {
    mockMemberFetch();
    const res = await request(app).post('/api/whop/analyze').set('x-whop-token', 'whop_at_7HqPz').send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Missing submissionId' });
  });

  test('valid member with an unknown submission gets 404', async () => {
    mockMemberFetch();
    const res = await request(app)
      .post('/api/whop/analyze')
      .set('x-whop-token', 'whop_at_7HqPz')
      .send({ submissionId: 'diag_1730421200098_00000000' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Submission not found' });
  });

  test('submission owned by a different email is refused with 403', async () => {
    mockMemberFetch();
    const otherId = 'diag_1730421200002_cc33bb22';
    insertSubmission(otherId, 'pending', {
      equipmentType: 'lawn-garden',
      model: 'Z930M',
      symptoms: 'PTO clutch will not engage',
      email: 'owner@rgvcitrus.com'
    });
    const res = await request(app)
      .post('/api/whop/analyze')
      .set('x-whop-token', 'whop_at_7HqPz')
      .send({ submissionId: otherId });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'Submission does not belong to this user' });
  });

  test('member analysis runs free of charge and records the membership on the submission', async () => {
    mockMemberFetch();
    const memberId = 'diag_1730421200003_aa22cc44';
    insertSubmission(memberId, 'pending', {
      equipmentType: 'semi-trucks',
      make: 'Kenworth',
      model: 'T680',
      year: '2017',
      symptoms: 'Derate, SPN 3216 FMI 4 aftertreatment sensor',
      email: 'Dispatch@KenworthFleet.com' // case differs on purpose: match must be case-insensitive
    });

    const res = await request(app)
      .post('/api/whop/analyze')
      .set('x-whop-token', 'whop_at_7HqPz')
      .send({ submissionId: memberId });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'processing', message: 'Analysis started (membership)' });

    await pollUntilStatus(memberId, 'ready');
    const row = db.prepare('SELECT * FROM diagnostic_submissions WHERE id = ?').get(memberId);
    expect(row.paid_via).toBe('whop_membership');
    expect(row.used_with_membership).toBe(1);
    expect(row.charged).toBe(0);
    expect(row.amount_paid_cents).toBe(0);
    expect(row.whop_user_id).toBe('user_ohLK9v');
    expect(row.whop_membership_id).toBe('mem_R7K2p');

    // processAnalysis upserts (never REPLACEs) the analyses row, so the
    // paid_via='whop_membership' + model attribution written at queue time
    // survive the run — the dataset row is fully attributed.
    const analysis = db.prepare(
      'SELECT paid_via, status, model, framework_version FROM analyses WHERE id = ?'
    ).get(memberId);
    expect(analysis.status).toBe('ready');
    expect(analysis.paid_via).toBe('whop_membership');
    expect(analysis.model).toBe('gpt-4o');
    expect(analysis.framework_version).toBe('v2.0');
  }, 60000);

  test('already-processed member submission is not re-run', async () => {
    mockMemberFetch();
    const res = await request(app)
      .post('/api/whop/analyze')
      .set('x-whop-token', 'whop_at_7HqPz')
      .send({ submissionId: 'diag_1730421200003_aa22cc44' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready', message: 'Already processed' });
  });
});
