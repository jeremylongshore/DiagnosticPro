<!--
  OWNERSHIP BOUNDARY: This file is REBUILT by the rtm-builder-agent on every /audit-tests run.
  - The "MoSCoW" column is ENGINEER-OWNED once edited: any non-default tag you set here is
    preserved absolutely across rebuilds. An AI-proposed downgrade of a MUST is a CHALLENGE
    pattern and will be REFUSED by the escape scanner.
  - REQ IDs are stable: never renumber. New requirements get the next sequential ID.
  - Extraction-derived columns (Source, Coverage, Tests) are agent-owned and regenerate.
  Generated: 2026-07-01 · branch feat/self-host-migration · epic: dpro-685 (self-host migration)
-->

# Requirements Traceability Matrix — DiagnosticPro

Repo: `jeremylongshore/DiagnosticPro` · Self-host era (VPS + SQLite + OpenAI gpt-4o + Stripe + Whop).
GCP/Firestore/GCS requirements are `WON'T` — migrated away per epic hard constraint (no billing re-enable, ever).

**Coverage key:** ✓ Covered (≥1 test references the REQ) · ◐ Partial (client/unit layer only, server path untested) · ✗ Uncovered · — Excluded (WON'T)

## Revenue path (MUST)

| REQ ID | Requirement | MoSCoW | Source | Coverage | Tests |
|---|---|---|---|---|---|
| REQ-001 | Customer can submit a diagnostic (equipment type, symptoms, optional codes) and it persists with status `pending` | MUST | `index.js` `POST /saveSubmission`; README § How It Works | ✓ Covered | `02-src/frontend/src/src/components/__tests__/DiagnosticForm.test.tsx` (5 tests). Missing L3/L4: no backend test hits `/saveSubmission` |
| REQ-002 | Customer can pay $4.99 via Stripe Checkout (session create + post-redirect session confirm) | MUST | `index.js` `POST /createCheckoutSession`, `GET /checkout/session`; deployment-docs 0017/0049/0082 | ✗ Uncovered | — |
| REQ-003 | Stripe webhook is signature-verified (`constructEvent`); fails CLOSED in production when secret unset | MUST | `index.js` `POST /stripeWebhookForward` (L966–1013); deployment-docs 0088-STRIPE-WEBHOOK-VERIFICATION | ✗ Uncovered | — |
| REQ-004 | Paid submission gets AI analysis via OpenAI gpt-4o producing the 15-section framework (parse + diagnostic-code extraction) | MUST | `index.js` `POST /analyzeDiagnostic`, `parseFullAnalysis`, `extractDiagnosticCodes`; epic dpro-685 Phase 1; README § 15 Sections | ✓ Covered | `02-src/backend/services/backend/__tests__/analysis.test.js` (3 tests). L2 unit only — no route-level test |
| REQ-005 | Completed analysis renders as a professional PDF report (12–15 pages) stored on the VPS filesystem | MUST | `reportPdfProduction.js`; epic dpro-685.8; README § What You Get | ✗ Uncovered | — |
| REQ-006 | Customer can check analysis/report status and retrieve a download link for the finished PDF | MUST | `index.js` `POST /analysisStatus`, `GET /reports/download/:id`, `/reports/signed-url`, `/reports/status`, `POST /reports/ensure`, `POST /getDownloadUrl`, `GET /view/:id` | ✓ Covered | `02-src/frontend/src/src/services/__tests__/reports.test.ts` (1 test). Missing L3/L4: no backend test on download/status routes |
| REQ-007 | All submissions, analyses, and Whop users persist in SQLite (fresh start — no Firestore data rescue) | MUST | `db.js`; epic dpro-685 (SQLite fresh start) | ✓ Covered | `02-src/backend/services/backend/__tests__/db.test.js` (2 tests: schema + insert/query round-trip) |
| REQ-008 | Whop member can authenticate: OAuth code exchange + token verify | MUST | `index.js` `POST /api/auth/whop-exchange`, `GET /api/auth/whop-verify`; README $29/mo subscription | ✗ Uncovered | — |
| REQ-009 | Whop webhook is HMAC-SHA256 signature-verified (`verifyWhopWebhookSignature`) | MUST | `index.js` `POST /api/webhooks/whop` (L1685–1702) | ✗ Uncovered | — |
| REQ-010 | Valid Whop member can run analysis without a Stripe payment; non-members fall through to pay-per-use (`checkWhopMember` membership gate) | MUST | `index.js` `POST /api/whop/analyze`, `checkWhopMember` (L1705–1727) | ◐ Partial | `02-src/frontend/src/src/services/__tests__/api.test.ts` ("attaches x-whop-token if present") — client transport only. Server-side membership verification UNTESTED |

## Hardening & UX (SHOULD)

| REQ ID | Requirement | MoSCoW | Source | Coverage | Tests |
|---|---|---|---|---|---|
| REQ-011 | Backend exposes `/healthz` for smoke checks and Caddy/uptime monitoring | SHOULD | `index.js` `GET /healthz`; VPS deploy pattern | ✗ Uncovered | — |
| REQ-012 | Abuse rate limiting: submissions 10/min, analysis 5/min, general 60/min, returning `RATE_LIMITED` | SHOULD | `index.js` L229–231 (`express-rate-limit`) | ✗ Uncovered | — |
| REQ-013 | Honeypot field rejects bot form submissions | SHOULD | Directed requirement (audit brief) — **NOT IMPLEMENTED**: no honeypot code found in `02-src` | ✗ Uncovered | — (implementation gap, not just test gap) |
| REQ-014 | Diagnostic form renders all equipment types, supports selection, and submits only with required fields | SHOULD | Frontend `DiagnosticForm`/`Button` components | ✓ Covered | `DiagnosticForm.test.tsx` (5), `Button.test.tsx` (4) |
| REQ-015 | Customer contact input is validated (email + phone formats) client-side | SHOULD | Frontend `utils/validation` | ✓ Covered | `02-src/frontend/src/src/utils/__tests__/validation.test.ts` (4 tests) |
| REQ-016 | Landing page presents value proposition and a working primary CTA on live diagnosticpro.io | SHOULD | Frontend `Hero`; epic dpro-685.6 (E2E acceptance gate) | ✓ Covered | `Hero.test.tsx` (4 tests), `03-tests/e2e/smoke.spec.ts` (1 Playwright test, live) |
| REQ-017 | Finished report download link is delivered to the customer by email | SHOULD *(inferred — engineer review)* | README § How It Works step 5 — no email-sending code found in backend (no nodemailer/resend/smtp) | ✗ Uncovered | — (likely implementation gap; confirm intent) |

## Deferred (COULD)

| REQ ID | Requirement | MoSCoW | Source | Coverage | Tests |
|---|---|---|---|---|---|
| REQ-018 | LLM provider is switchable via OpenAI-compatible endpoint config (Groq / xAI / Ollama) with no code change | COULD | README § How It Works step 4 | ✗ Uncovered | — |
| REQ-019 | Mobile app shells (Capacitor, App Store submission) wrap the web product | COULD | `000-docs/077-079` mobile conversion docs (untracked WIP) | ✗ Uncovered | — |

## Excluded (WON'T)

| REQ ID | Requirement | MoSCoW | Source | Coverage | Tests |
|---|---|---|---|---|---|
| REQ-020 | GCP/Firestore/GCS/Vertex AI integration (Firebase Hosting, buckets, signed URLs, 266-table repair KB) | WON'T | Epic dpro-685 hard constraint 2026-06-30: migrated away, no billing re-enable, no data rescue | — Excluded | Legacy deployment-docs 0001–0118 describe the retired GCP era; do not resurrect |

## Orphaned tests

None — all 26 tests (20 frontend + 5 backend + 1 e2e) map to a REQ above.

## Coverage summary

| Tier | Total | Covered | Partial | Uncovered | Excluded |
|---|---|---|---|---|---|
| MUST | 10 | 4 | 1 | 5 | — |
| SHOULD | 7 | 3 | 0 | 4 | — |
| COULD | 2 | 0 | 0 | 2 | — |
| WON'T | 1 | — | — | — | 1 |
| **Total** | **20** | **7** | **1** | **11** | **1** |
