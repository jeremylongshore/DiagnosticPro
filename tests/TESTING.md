# TESTING.md — DiagnosticPro

<!-- Policy sections (Classification, Thresholds, Waived layers) are ENGINEER-OWNED.
     Defaults below were set 2026-07-01 during the self-host migration test-baseline
     pass (epic dpro-685, Phase 4) — review and re-pin via audit-harness init. -->

## Classification

- Repo type: two-surface product repo
  - `02-src/frontend` — frontend (React 18 + TS + Vite + shadcn), pnpm
  - `02-src/backend/services/backend` — api/service (Express + better-sqlite3, plain JS), npm
- Compliance overlay: none

## Thresholds

| Metric | Floor | Scope |
|---|---|---|
| coverage.line | 60 | backend (`02-src/backend/services/backend`) — initial floor; ratchet upward, never down |
| coverage.line | 12 | frontend — ratchet floor (current baseline 12.89%; raise as tests land, never lower) |
| crap.prod | 30 | both |
| crap.test | 15 | both |
| architecture violations | n/a | no arch rules declared yet |

## Waived layers

- L5-a11y — deferred (no axe infra; revisit post-cutover)
- L3-mutation — deferred (no Stryker baseline; revisit post-cutover)
- L4-contract — deferred (single first-party consumer)
- L7-UAT — deferred (solo operator; Playwright e2e is the acceptance surface for now)

## Installed gates

- L0: @intentsolutions/audit-harness@1.2.3 (frontend devDep + backend devDep)
- L1: root Makefile `full-check` + pre-commit harness gate (frontend `.harness-hash`)
- L2: ESLint + TypeScript (frontend); none declared (backend, plain JS)
- L3: Jest (frontend 8 suites / 41 tests incl. diagnostics/env/reports service units; backend 9 suites / 92 tests incl. route/webhook/migration/PDF), coverage floors above. Frontend ts-jest transpiles via `jest.import-meta-transform.cjs` (rewrites Vite `import.meta.env`; pins DOM lib + isolatedModules so local == CI).
- L4: backend route tests via supertest (LLM isolated at the `openai` module boundary with jest.mock — the TEST_MOCK_LLM prod-code branch was REMOVED 2026-07-01; no canned text can ever reach the analyses table)
- L6: Playwright — local plumbing specs (`e2e/`) + the **live customer-journey suite** (`02-src/frontend/e2e-live/journey.spec.ts`): one test per J1/J2 step against the deployed site, real Stripe hosted checkout (test mode when enabled), real gpt-4o. Per-run results land in `tests/live/JOURNEY-<epoch>.json`.

## Frameworks

- Frontend: Jest + @testing-library/react; Playwright (chromium)
- Backend: Jest + supertest; better-sqlite3 in-tmp fixtures; `openai` module mocked in unit suites (never a prod-code flag)

## How to run

```bash
# frontend
cd 02-src/frontend && pnpm test && npx playwright test
# backend
cd 02-src/backend/services/backend && npx jest --coverage
# full local gate
make full-check
# LIVE customer journey against the deployed site (writes tests/live/JOURNEY-*.json)
cd 02-src/frontend && pnpm run test:live
# DB-side structural verification of a live report (model attribution, sections)
scripts/verify-live-analysis.sh <submissionId>
```

## Live-journey gating (deliberate deferrals, not gaps)

- **Stripe 4242 payment steps (J1-05…J1-11)** — gated on `DPRO_STRIPE_TEST_MODE=1`,
  set only when the target backend runs test-mode keys (`sk_test`). The suite
  hard-refuses to submit a card against a `cs_live_` session. Blocked on the sk_test
  handoff (`/dev/shm/dpro-test-keys.env`).
- **Whop member steps (J2)** — gated on `DPRO_WHOP_TEST_TOKEN` + `DPRO_WHOP_TEST_EMAIL`.
  Whop webhook-secret wiring stays deferred per prior decision (401 fail-closed is safe).
- **Whop tokens at rest** — `whop_users.access_token`/`refresh_token` are plaintext in
  SQLite (flagged; encrypt-at-rest or drop if unused — not blocking).

## Last audit

- 2026-07-01 — /audit-tests full 7-layer sweep on `feat/self-host-migration` (TEST_AUDIT.md at repo root). Grade D+ pre-remediation; revenue-path P0s remediated same day (see TEST_AUDIT.md § Handoff).
- 2026-07-02 — /implement-tests follow-up: L3 frontend service units for the fixed money-adjacent files (diagnostics.ts 0→100%, env.ts 0→80%, reports.ts getDiagnosticStatus fully covered). Fixed the ts-jest DOM-lib gap that was failing frontend-test in CI. Hash manifest initialized.

## Traceability

- `tests/RTM.md` — 20 REQs (10 MUST); rebuilt 2026-07-01
- `tests/PERSONAS.md` — 3 personas; retail-customer is the critical one
- `tests/JOURNEYS.md` — J1 retail purchase, J2 Whop member
