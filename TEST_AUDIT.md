# TEST_AUDIT.md — diagnostic-pro (self-host migration tree)

**Date**: 2026-07-01
**Run by**: /audit-tests via audit-harness@1.2.3 (latest; no drift)
**Branch**: `feat/self-host-migration` (epic `dpro-685`)
**Scope**: full 7-layer sweep of both surfaces — `02-src/frontend` (React 18 + TS + Vite) and `02-src/backend/services/backend` (Express + SQLite + Stripe/Whop + OpenAI gpt-4o). Supersedes the stale 2026-06-21 pre-migration audit.

## Grade: D+ (48/100)

Tests that exist all pass, hygiene is clean — but **the revenue path is structurally untested**. Coverage is hollow where the money flows.

## Freshness

✓ audit-harness 1.2.3 installed (frontend) == npm latest. Backend has **no harness** (L0 gap).

## Classification

| Surface | Kind | Harness | Hash manifest |
|---|---|---|---|
| `02-src/frontend` | frontend (detected: package.json frontend-framework) | ✓ 1.2.3 | ✓ OK (verify exit 0) |
| `02-src/backend/services/backend` | api/service (Express) | ✗ absent | ✗ none |

No `tests/TESTING.md` exists → no engineer policy floors declared; defaults used. **Creating one is itself a P1 gap.**

## Deterministic gate results

| Gate | Result | Detail |
|---|---|---|
| Frontend unit (Jest) | ✓ PASS | 6 suites / 20 tests green |
| Backend unit (Jest) | ✓ PASS | 2 suites / 5 tests green (analysis parse + db schema) |
| Frontend coverage | ✗ **12.89% lines** (76/600 branches) | No floor declared; any sane floor fails |
| Backend coverage | ✗ **15.06% lines** (32/513 branches) | index.js (18 routes) essentially untouched |
| E2E (Playwright, 13 tests) | ⚠ env-blocked → re-run in flight | First run 13/13 failed on missing chromium binary (`npx playwright install` never run on this box); browser installed, re-run pending |
| CRAP score | ✓ pass (tool-limited) | complexity-report not installed → heuristic only |
| Mutation | ✗ not installed | No Stryker/mutmut baseline anywhere |
| harness scan (security/hygiene) | ✓ no FAIL | cve-osv, gitleaks, markdown, readme = ADVISORY |
| escape-scan (staged diff) | ✓ clean | REFUSE=0 CHALLENGE=0 FLAG=0 |
| Secrets in git | ✓ clean | only encrypted `.env.sops` committed in migration commits |

## RTM summary (tests/RTM.md — rebuilt this audit)

20 REQs: 10 MUST / 7 SHOULD / 2 COULD / 1 WON'T (all-GCP, excluded).

| Tier | Covered | Partial | Uncovered |
|---|---|---|---|
| MUST | 4 | 1 | **5** |
| SHOULD | 3 | — | 4 |
| COULD | 0 | — | 2 |

**Uncovered MUSTs (all P0, all revenue-path):**
- REQ-002 Stripe checkout session create + confirm (`/createCheckoutSession`, `/checkout/session`)
- REQ-003 Stripe webhook signature verification, fail-closed (`/stripeWebhookForward`)
- REQ-005 PDF report generation (`reportPdfProduction.js`)
- REQ-008 Whop OAuth exchange + verify
- REQ-009 Whop webhook HMAC-SHA256 verification
- REQ-010 (partial) server-side `checkWhopMember` membership gate

**Implementation gaps surfaced by RTM (not test gaps):**
- REQ-013: honeypot claimed in requirements — **no honeypot code exists** in 02-src
- REQ-017: README promises email delivery — **no email code exists** in backend (engineer decision: build or de-scope README claim)

## Personas (tests/PERSONAS.md)

| Persona | Flow coverage | Verdict |
|---|---|---|
| retail-customer (critical) | 4/5 (80%) | **P0 gap: the Stripe payment step** — the one e2e bypasses checkout via `analyzeDiagnostic {force:true}` |
| whop-member | 1/3 (33%) | flagged — OAuth flow + membership-bypass both untested |
| operator | 0/3 (0%) | flagged — no healthz/logs/restore tests |

## Journeys (tests/JOURNEYS.md)

2 journeys, 0 fully covered. **5 untested MUST steps (P0)**: J1 checkout create, J1 hosted payment, J1 webhook-marks-paid, J2 member analyze gate, J2 Whop webhook lifecycle. Plus 3 P1 partials: mocked-only analysis entry, backend `/view/:id` untested, **soft PDF-download assertion** (`if (await downloadLink.count() > 0)` — passes even when no link renders).

## Per-layer map

| Layer | Frontend | Backend |
|---|---|---|
| L1 hooks/CI | ◐ pre-commit harness gate wired (root make full-check) | ✗ |
| L2 static | ✓ TS + lint | ◐ plain JS, no lint config detected |
| L3 unit | ◐ present, 12.9% cov, no mutation | ◐ present, 15.1% cov, no mutation, **0/18 routes tested** |
| L4 integration | ✗ none (no supertest/route tests, no contract) | ✗ none |
| L5 system | ✗ no a11y (axe missing), no perf, no sec tests | ✗ |
| L6 E2E | ◐ 4 Playwright specs + smoke; env-blocked on this box until now; payment path bypassed | n/a |
| L7 acceptance | ✗ no features/*.feature, no UAT | ✗ |

## P0 gaps (block production-ready claim)

1. Backend route-level tests (supertest) for the 6 revenue MUSTs above — REQ-002/003/005/008/009/010
2. Stripe webhook signature + idempotency test (raw-body handling — note the dual `/stripeWebhookForward` registration needs a regression test)
3. Whop webhook HMAC verify test
4. Backend coverage floor: institute 60% initial floor (ratchet later); wire to CI
5. Install audit-harness in backend + root `tests/TESTING.md` with declared thresholds

## P1 gaps

6. Harden the soft PDF-download e2e assertion (unconditional)
7. `/healthz` smoke test (operator persona, cheapest win)
8. Rate-limit behavior tests (REQ-012)
9. Frontend a11y layer (axe) — required-advisory per profile
10. Mutation baseline (Stryker) on backend money-path modules
11. Whop OAuth callback route test + `/auth/callback` added to navigation spec
12. Decide REQ-013 (honeypot) + REQ-017 (email): implement or de-scope

## P2

13. Capacitor/mobile shells untracked in git (unrelated WIP — commit or stash)
14. complexity-report install for real CRAP numbers

## Escape-scan

Clean (exit 0). No policy tampering in pending diff.

## Handoff

P0+P1 gaps exist; branch is `feat/*` → **autonomous handoff to /implement-tests fires now** with the payload above (install_order: backend-harness+TESTING.md → L3 backend routes → L4 supertest integration → L6 e2e hardening → mutation baseline).
