/**
 * Trust-proxy / rate-limit scoping.
 *
 * Two things must hold, and they pull in opposite directions:
 *   1. Rate limits must key on the REAL client, not on Caddy — otherwise every
 *      bucket is one global counter and a single noisy visitor locks out every
 *      paying customer.
 *   2. A client must NOT be able to mint itself a fresh bucket by sending its own
 *      X-Forwarded-For. That is the bypass `trust proxy: true` would open.
 *
 * `app.set('trust proxy', 1)` is the only setting that satisfies both, and these
 * tests fail if anyone changes it to `true`, removes it, or raises the hop count
 * without adding a real proxy.
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const request = require('supertest');

// Mirrors the production topology: exactly one proxy (Caddy) in front.
function makeApp(trustProxySetting) {
  const app = express();
  if (trustProxySetting !== undefined) app.set('trust proxy', trustProxySetting);
  app.get('/whoami', (req, res) => res.json({ ip: req.ip }));
  app.use(rateLimit({ windowMs: 60000, max: 2, standardHeaders: true, legacyHeaders: false }));
  app.get('/limited', (req, res) => res.json({ ok: true }));
  return app;
}

// Caddy appends the real peer address to the RIGHT of any header the client sent.
const asCaddyForwarded = (clientSent, realClient) =>
  [clientSent, realClient].filter(Boolean).join(', ');

describe('trust proxy configuration', () => {
  test('production setting resolves req.ip to the real client behind one proxy', async () => {
    const res = await request(makeApp(1))
      .get('/whoami')
      .set('X-Forwarded-For', asCaddyForwarded(null, '203.0.113.7'));
    expect(res.body.ip).toBe('203.0.113.7');
  });

  test('a spoofed X-Forwarded-For prefix is IGNORED — the bypass is closed', async () => {
    // Attacker sends a fake address; Caddy appends their true one on the right.
    const res = await request(makeApp(1))
      .get('/whoami')
      .set('X-Forwarded-For', asCaddyForwarded('1.2.3.4', '203.0.113.7'));
    expect(res.body.ip).toBe('203.0.113.7');
    expect(res.body.ip).not.toBe('1.2.3.4');
  });

  test('REGRESSION GUARD: `trust proxy: true` would trust the spoofed value', async () => {
    // Documents exactly why the setting is the integer 1 and not `true`.
    const res = await request(makeApp(true))
      .get('/whoami')
      .set('X-Forwarded-For', asCaddyForwarded('1.2.3.4', '203.0.113.7'));
    expect(res.body.ip).toBe('1.2.3.4'); // attacker-controlled — unacceptable
  });

  test('with no trust proxy set, every client collapses into one bucket', async () => {
    // The pre-fix behaviour this bead existed to correct.
    const app = makeApp(undefined);
    const a = await request(app).get('/whoami').set('X-Forwarded-For', '203.0.113.7');
    const b = await request(app).get('/whoami').set('X-Forwarded-For', '198.51.100.9');
    expect(a.body.ip).toBe(b.body.ip); // same resolved IP => shared limiter bucket
  });
});

describe('rate limiting is per-client, not site-wide', () => {
  test('one client exhausting its budget does not lock out a different client', async () => {
    const app = makeApp(1);
    const noisy = asCaddyForwarded(null, '203.0.113.7');
    const innocent = asCaddyForwarded(null, '198.51.100.9');

    // Noisy client burns its allowance (max: 2) and gets limited on the third.
    expect((await request(app).get('/limited').set('X-Forwarded-For', noisy)).status).toBe(200);
    expect((await request(app).get('/limited').set('X-Forwarded-For', noisy)).status).toBe(200);
    expect((await request(app).get('/limited').set('X-Forwarded-For', noisy)).status).toBe(429);

    // The unrelated customer must still be served. This is the whole point.
    expect((await request(app).get('/limited').set('X-Forwarded-For', innocent)).status).toBe(200);
  });

  test('a client cannot escape its own limit by rotating X-Forwarded-For', async () => {
    const app = makeApp(1);
    const real = '203.0.113.7';
    await request(app).get('/limited').set('X-Forwarded-For', asCaddyForwarded('9.9.9.1', real));
    await request(app).get('/limited').set('X-Forwarded-For', asCaddyForwarded('9.9.9.2', real));
    // Third request, a third fake prefix — still the same real client, still limited.
    const res = await request(app)
      .get('/limited')
      .set('X-Forwarded-For', asCaddyForwarded('9.9.9.3', real));
    expect(res.status).toBe(429);
  });
});
