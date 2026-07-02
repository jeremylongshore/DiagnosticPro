# JOURNEYS.md — revenue journey step coverage

> Declaration blocks (journey name, personas, trigger, critical flag, linked endpoints)
> are engineer-owned. The per-step **Status** column is observational — updated after
> each run of the live journey suite (`02-src/frontend/e2e-live/journey.spec.ts`,
> `pnpm run test:live`), whose machine-readable results land in
> `tests/live/JOURNEY-<epoch>.json`. Last live run: **JOURNEY-1782971805863**
> (2026-07-02, https://diagnosticpro.io, branch `feat/self-host-migration`).
>
> Legend: `✓ live` proven against the deployed site by its own test ·
> `⛔ gated` authored + deliberately blocked on a named credential/mode ·
> `✗` no test.

---

## J1 — retail purchase (`critical: true`)

- **Persona:** anonymous retail visitor paying $4.99 for a diagnostic report
- **Trigger:** organic/paid landing on diagnosticpro.io
- **Suite:** `e2e-live/journey.spec.ts` — one `test()` per step, serial, evidence per step.
  Payment steps run only against a **test-mode** target (`DPRO_STRIPE_TEST_MODE=1`,
  backend on `sk_test`); the suite hard-refuses to pay a `cs_live_` session.

| # | Step | Endpoint(s) | MoSCoW | Live test | Status |
|---|------|-------------|--------|-----------|--------|
| 1 | Land on site (200, form + CTA render) | `/` | SHOULD | J1-01 | ✓ live |
| 2 | Fill + submit the real form UI → pending row persisted | `POST /saveSubmission`, `POST /analysisStatus` | MUST | J1-02 | ✓ live |
| 3 | Pay CTA renders bound to the submission (`client-reference-id`) | Stripe buy-button web component | MUST | J1-03 | ✓ live |
| 4 | Server-created checkout session → Stripe-hosted URL | `POST /createCheckoutSession` | MUST | J1-04 | ✓ live |
| 5 | Customer pays 4242 on Stripe hosted checkout → `/success` redirect | Stripe-hosted checkout | MUST | J1-05 | ⛔ gated (sk_test handoff) |
| 6 | Webhook flips submission to paid + queues analysis | `POST /stripeWebhookForward` | MUST | J1-06 | ⛔ gated (sk_test handoff) |
| 7 | Session resolves back to submission | `GET /checkout/session` | MUST | J1-07 | ⛔ gated (sk_test handoff) |
| 8 | Real gpt-4o analysis completes to ready | LLM + `POST /analysisStatus` | MUST | J1-08 (+ `scripts/verify-live-analysis.sh` for DB-side structure/attribution) | ⛔ gated (sk_test handoff) |
| 9 | Signed-url returns download + view contract | `GET /reports/signed-url` | MUST | J1-09 | ⛔ gated (sk_test handoff) |
| 10 | `/success` auto-downloads the real PDF | `PaymentSuccess` → `GET /reports/download/:id` | MUST | J1-10 | ⛔ gated (sk_test handoff) |
| 11 | Report views inline as PDF | `GET /view/:id` | MUST | J1-11 | ⛔ gated (sk_test handoff) |

**J1 status:** 4/11 ✓ live · 7/11 authored + gated on the single `sk_test` handoff
(`/dev/shm/dpro-test-keys.env`). Zero steps untested-by-design.

## J2 — Whop member (`critical: true`)

- **Persona:** Whop community member with an active membership entitlement
- **Trigger:** member arrives from Whop with an auth code

| # | Step | Endpoint(s) | MoSCoW | Live test | Status |
|---|------|-------------|--------|-----------|--------|
| 1 | Member token verifies as active membership | `GET /api/auth/whop-verify` | SHOULD | J2-01 | ⛔ gated (`DPRO_WHOP_TEST_TOKEN`) |
| 2 | Member analysis runs free → real report → download | `POST /api/whop/analyze`, `GET /reports/signed-url` | MUST | J2-02 | ⛔ gated (`DPRO_WHOP_TEST_TOKEN` + `DPRO_WHOP_TEST_EMAIL`) |
| 3 | Whop webhook lifecycle (went valid/invalid) | `POST /api/webhooks/whop` | MUST | unit: `routes.whop.test.js` (signature schemes, entitlement flips, fail-closed) | ⚠ unit-only — live wiring deferred per prior decision (401 fail-closed) |

---

## Live finds fixed by this suite (run JOURNEY-1782971805863 + first red run)

| Found by | Defect | Fix |
|---|---|---|
| J1-02 (first red run) | Backend hard-required `symptoms`, but the real UI treats symptom checkboxes as optional (hidden behind "Add Details") → every description-only customer got a 400, **buy button never rendered, sale lost** | Validator now requires `symptoms` OR `problemDescription` (`index.js`), regression unit tests added |
| Journey trace | `PaymentSuccess` polled 30×1s then showed timeout — real gpt-4o takes 1–3 min, so every real paying customer hit the timeout screen | `MAX_ATTEMPTS` 30 → 240 |
| Dataset audit | `processAnalysis` INSERT-OR-REPLACE nulled `model`/`req_id`/`paid_via` on every run (first live report stored with `model=NULL`) | Attribution-preserving upsert + `framework_version` stamped; live row backfilled |

## Prior gap register (2026-07-01) — disposition

All 5 P0s from the 2026-07-01 audit are now either **proven live** (J1 steps 3–4),
**authored + gated on a named credential** (J1 5–11, J2 1–2), or **unit-covered with
live wiring deliberately deferred** (J2-3). The `TEST_MOCK_LLM` prod-code branch and
the `force:true` payment bypass in e2e are gone.
