# PERSONAS.md — diagnosticpro.io

Declared user personas and their key flows, with observational test-coverage
annotations maintained by the persona-coverage audit.

> **Ownership**: the persona declaration blocks (name, tier, permissions,
> key flows) are engineer-owned. The `Test coverage:` / `Coverage:` lines are
> observational and rewritten by each `/audit-tests` persona-coverage pass —
> do not hand-edit those lines.

Thresholds: `flow_coverage_min` not declared in `tests/TESTING.md` (file absent);
this audit ran with a caller-specified flag threshold of **50%**
(agent default is 80%).

---

## Persona: retail-customer

- Tier: anonymous / pay-per-report
- Critical: true
- Permissions: public pages, form submission, Stripe checkout, own report by submission ID
- Key flows: [browse-landing-pricing, submit-diagnostic-form, stripe-checkout-payment, ai-analysis-generation, view-download-pdf-report]

Test coverage:
- browse-landing-pricing: COVERED — `02-src/frontend/e2e/landing.spec.ts` (pricing), `02-src/frontend/e2e/navigation.spec.ts`, `03-tests/e2e/smoke.spec.ts` (prod CTA), `02-src/frontend/src/src/components/__tests__/Hero.test.tsx`
- submit-diagnostic-form: COVERED — `02-src/frontend/e2e/form-submission.spec.ts` (UI + `/saveSubmission`), `02-src/frontend/src/src/components/__tests__/DiagnosticForm.test.tsx`, `02-src/frontend/src/src/utils/__tests__/validation.test.ts`, `02-src/backend/services/backend/__tests__/db.test.js` (insert/query submission)
- stripe-checkout-payment: NOT COVERED — the e2e full-flow test explicitly bypasses Stripe ("since Stripe button hard in E2E") and jumps straight to `analyzeDiagnostic` with `force: true`. No test exercises checkout creation, payment success/cancel redirect, or the payment→analysis gate.
- ai-analysis-generation: COVERED — `02-src/frontend/e2e/form-submission.spec.ts` (`analyzeDiagnostic` + `analysisStatus` poll, mock LLM), `02-src/backend/services/backend/__tests__/analysis.test.js` (LLM output parsing, OBD-II/SPN code extraction)
- view-download-pdf-report: COVERED — `02-src/frontend/e2e/form-submission.spec.ts` (report page + conditional `.pdf` download assert), `02-src/frontend/e2e/report-page.spec.ts`, `02-src/frontend/src/src/services/__tests__/reports.test.ts`

Coverage: 4/5 (80%) — above 50% flag threshold. Critical persona: NOT at 100%; uncovered flow `stripe-checkout-payment` is the revenue path → P0 gap.

---

## Persona: whop-member

- Tier: authenticated subscriber (Whop OAuth / membership)
- Critical: false
- Permissions: everything retail-customer has, plus checkout-free analysis under active membership
- Key flows: [whop-oauth-login-callback, membership-token-on-api-requests, subscription-analysis-without-checkout]

Test coverage:
- whop-oauth-login-callback: NOT COVERED — no test touches `useWhopAuth.ts`, `lib/whop-auth.ts`, `AuthCallback.tsx`, or `WhopLoginButton.tsx`; `/auth/callback` is absent from `navigation.spec.ts` route list.
- membership-token-on-api-requests: COVERED — `02-src/frontend/src/src/services/__tests__/api.test.ts` ("attaches x-whop-token if present").
- subscription-analysis-without-checkout: NOT COVERED — no test verifies a valid membership bypasses the per-report payment gate. (`db.test.js` asserts the `whop_users` table exists — schema only, not the flow.)

Coverage: 1/3 (33%) — **BELOW 50% flag threshold**.

---

## Persona: operator

- Tier: internal (Jeremy) — SSH/tailnet, root on VPS
- Critical: false
- Permissions: service health endpoints, logs, backups/restore, deploys
- Key flows: [health-monitoring, read-logs, restore-from-backup]

Test coverage:
- health-monitoring: NOT COVERED — `api.test.ts` uses `/healthz` only as a fixture URL for the fetch wrapper (no server, nothing asserts health semantics); no e2e or smoke test hits a health endpoint.
- read-logs: NOT COVERED — no test.
- restore-from-backup: NOT COVERED — no test or scripted restore drill in-repo.

Coverage: 0/3 (0%) — **BELOW 50% flag threshold**.

---

## Audit summary (persona-coverage agent, 2026-07-01)

| Persona | Covered / Total | % | Flagged (<50%) |
|---|---|---|---|
| retail-customer (critical) | 4/5 | 80% | no — but critical persona misses 100% (stripe-checkout-payment) |
| whop-member | 1/3 | 33% | **yes** |
| operator | 0/3 | 0% | **yes** |

Notes:
- `tests/TESTING.md` does not exist — thresholds defaulted; declare `personas.flow_coverage_min` there to make this gate explicit.
- The AI-output quality guards (`tests/*_guard.sh` over `tests/golden/`, `tests/live/`, `tests/regress/`) strengthen `ai-analysis-generation` but are report-quality checks, not persona-flow tests.
