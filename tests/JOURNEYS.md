# JOURNEYS.md — revenue journey step coverage

> Declaration blocks (journey name, personas, trigger, critical flag, linked endpoints)
> are engineer-owned. The per-step **Test file / Status** columns are observational and
> rebuilt by the journey-mapper audit. Last audit: 2026-07-01 (branch `feat/self-host-migration`).
>
> No `RTM.md` exists in this repo; MoSCoW is derived from the audit directive:
> steps tied to **payment, webhook, or report delivery are MUST** (P0 if untested).
>
> Legend: `✓` ≥1 real test exercises the step · `⚠` mocked-only / partial / conditional · `✗` no test.

---

## J1 — retail purchase (`critical: true`)

- **Persona:** anonymous retail visitor paying $4.99–$29.99 for a diagnostic report
- **Trigger:** organic/paid landing on diagnosticpro site
- **Backend surface:** `/saveSubmission`, `/createCheckoutSession`, `/stripeWebhookForward`, `/analyzeDiagnostic`, `/analysisStatus`, `/view/:id`, `/getDownloadUrl`, `/reports/*`

| # | Step | Endpoint(s) | MoSCoW | Test file | Status |
|---|------|-------------|--------|-----------|--------|
| 1 | Land on site | `/` (frontend) | SHOULD | `02-src/frontend/e2e/landing.spec.ts`, `03-tests/e2e/smoke.spec.ts`, `02-src/frontend/src/src/components/__tests__/Hero.test.tsx` | ✓ |
| 2 | Fill + submit diagnostic form | `POST /saveSubmission` | SHOULD | `02-src/frontend/e2e/form-submission.spec.ts` (real POST, asserts `submissionId`), `02-src/frontend/src/src/components/__tests__/DiagnosticForm.test.tsx`, `02-src/frontend/src/src/utils/__tests__/validation.test.ts`, `02-src/backend/services/backend/__tests__/db.test.js` (SQLite insert/query) | ✓ |
| 3 | Create Stripe checkout session | `POST /createCheckoutSession` | MUST | — (also uncovered: `GET /checkout/session`) | ✗ |
| 4 | Customer pays (Stripe hosted checkout completes) | Stripe-hosted; `/success` redirect | MUST | — (`report-page.spec.ts` renders bare `/success` shell only, no payment state asserted) | ✗ |
| 5 | Webhook marks submission paid | `POST /stripeWebhookForward` | MUST | — (no signature-verification, idempotency, or paid-state test; e2e bypasses via `analyzeDiagnostic {force:true}`) | ✗ |
| 6 | AI analysis runs + status polls to ready | `POST /analyzeDiagnostic`, `POST /analysisStatus` | MUST | `02-src/frontend/e2e/form-submission.spec.ts` (TEST_MOCK_LLM + `force:true`, payment gate bypassed), `02-src/backend/services/backend/__tests__/analysis.test.js` (parse-only), `02-src/frontend/src/src/services/__tests__/reports.test.ts` (client → `/analysisStatus`, fetch mocked), `tests/{validate_schema,readiness_guard,confidence_guard,length_guard}.sh` (golden-fixture output guards) | ⚠ mocked-only |
| 7 | View report | `GET /view/:id` (backend HTML), `/report/:id` (frontend) | MUST | `02-src/frontend/e2e/report-page.spec.ts` (frontend `/report/:id` renders, body-length assert only), `form-submission.spec.ts` (text matches /ready\|download\|report/) — backend `GET /view/:id` itself has **no test** | ⚠ partial |
| 8 | Download PDF | `POST /getDownloadUrl`, `GET /reports/download/:id`, `/reports/{signed-url,status,ensure}` | MUST | `02-src/frontend/e2e/form-submission.spec.ts` — download click is **conditional** (`if (await downloadLink.count() > 0)`), so the assertion can silently never run; no direct test of `/getDownloadUrl` or any `/reports/*` route | ⚠ conditional/partial |

**J1 coverage:** 3/8 ✓ · 3/8 ⚠ · 2 hard-untested of 8 → **~37% fully covered** (critical journey requires 100%).

## J2 — Whop member (`critical: true`)

- **Persona:** Whop community member with an active membership entitlement
- **Trigger:** member arrives from Whop with an auth code
- **Backend surface:** `/api/auth/whop-exchange`, `/api/auth/whop-verify`, `/api/whop/analyze`, `/api/webhooks/whop`

| # | Step | Endpoint(s) | MoSCoW | Test file | Status |
|---|------|-------------|--------|-----------|--------|
| 1 | Whop auth exchange + verify | `POST /api/auth/whop-exchange`, `GET /api/auth/whop-verify` | SHOULD | — (`02-src/frontend/src/src/lib/whop-auth.ts` has no test) | ✗ |
| 2 | Member analyze | `POST /api/whop/analyze` (+ `checkWhopMember` middleware) | MUST | — endpoint never exercised. Adjacent only: `02-src/frontend/src/src/services/__tests__/api.test.ts` verifies the client attaches `x-whop-token` (mocked fetch) — does not hit the route or the membership gate | ✗ |
| 3 | Whop webhook lifecycle (membership went valid/invalid) | `POST /api/webhooks/whop` | MUST | — (no signature, event-type, or entitlement-flip test) | ✗ |

**J2 coverage:** 0/3 ✓ → **0% covered** (critical journey requires 100%).

---

## Gap register (audit 2026-07-01)

| Severity | Journey | Step | Gap |
|---|---|---|---|
| P0 | J1 | 3 | `POST /createCheckoutSession` untested (MUST — payment) |
| P0 | J1 | 4 | Stripe payment completion untested; e2e bypasses payment via `force:true` (MUST — payment) |
| P0 | J1 | 5 | `POST /stripeWebhookForward` untested — no signature/idempotency/paid-state coverage (MUST — webhook) |
| P0 | J2 | 2 | `POST /api/whop/analyze` + `checkWhopMember` gate untested (MUST — paid report generation) |
| P0 | J2 | 3 | `POST /api/webhooks/whop` untested (MUST — webhook) |
| P1 | J1 | 6 | Analysis path is mocked-only (TEST_MOCK_LLM) and enters via `force:true`, so the paid→analyze contract is never tested (advisory) |
| P1 | J1 | 7 | Backend `GET /view/:id` has no test; frontend `/report/:id` e2e asserts body length only (partial) |
| P1 | J1 | 8 | PDF download assertion is conditional in e2e — can pass with zero downloads; `/getDownloadUrl` + `/reports/*` have no direct tests (partial) |
| P1 | J2 | 1 | Whop auth exchange/verify untested (SHOULD) |

**Summary:** 2 journeys declared · 0 fully covered · 2 partial · **5 untested MUST steps (P0)** · 4 P1 gaps.
