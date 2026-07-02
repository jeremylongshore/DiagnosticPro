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
- L3: Jest (frontend 6 suites; backend suites incl. route/webhook/migration/PDF tests), coverage floors above
- L4: backend route tests via supertest against a spawned server (TEST_MOCK_LLM)
- L6: Playwright (4 specs + full-flow paid-journey spec, PDF assertion unconditional)

## Frameworks

- Frontend: Jest + @testing-library/react; Playwright (chromium)
- Backend: Jest + supertest; better-sqlite3 in-tmp fixtures; TEST_MOCK_LLM=1 mock LLM path

## How to run

```bash
# frontend
cd 02-src/frontend && pnpm test && npx playwright test
# backend
cd 02-src/backend/services/backend && npx jest --coverage
# full local gate
make full-check
```

## Last audit

- 2026-07-01 — /audit-tests full 7-layer sweep on `feat/self-host-migration` (TEST_AUDIT.md at repo root). Grade D+ pre-remediation; revenue-path P0s remediated same day (see TEST_AUDIT.md § Handoff).

## Traceability

- `tests/RTM.md` — 20 REQs (10 MUST); rebuilt 2026-07-01
- `tests/PERSONAS.md` — 3 personas; retail-customer is the critical one
- `tests/JOURNEYS.md` — J1 retail purchase, J2 Whop member
