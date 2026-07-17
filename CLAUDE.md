# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Task Tracking (Beads / bd)

- Use `bd` for ALL tasks/issues (no markdown TODO lists).
- Start of session: `bd ready`
- Create work: `bd create "Title" -p 1 --description "Context + acceptance criteria"`
- Update status: `bd update <id> --status in_progress`
- Finish: `bd close <id> --reason "Done"`
- End of session: `bd sync` (flush/import/export + git sync)
- After upgrading `bd`, run: `bd info --whats-new`
- If `bd info` warns about hooks, run: `bd hooks install`

## What This Is

DiagnosticPro is a customer-facing equipment diagnostic platform. Customers submit a form describing their vehicle/equipment problem, pay $4.99 via Stripe (or free for Whop members), and receive a 2000+ word PDF report with a proprietary 15-section AI analysis via configurable OpenAI-compatible LLM (DeepSeek is the default; easily switch to Ollama or other /v1 endpoints for fully self-hosted on VPS). Production domain: `diagnosticpro.io`.

The app is being migrated to full self-host on the Intent Solutions production VPS (Stage D). Backend container behind Caddy; frontend static via Caddy or container. Current deploy, Caddy, host, and secret-boundary authority is `intent-solutions-io/intent-os/ops/` under D90. Firebase may remain for hosting/DB polling during hybrid phase; Vertex AI has been removed.

## Commands

All frontend commands run from `02-src/frontend/` (requires Node 20):

```bash
# Development (port 8080, not default 5173)
npm run dev

# Build
npm run build
npm run build:dev          # development mode build

# Tests (Jest + React Testing Library)
npm test                   # run all tests
npm test -- Button.test    # single test file
npm run test:watch         # watch mode
npm run test:coverage      # coverage report

# Lint & format
npm run lint
npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}"
npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"
npx tsc --noEmit           # type checking
```

Root-level Makefile (runs from repo root):

```bash
make full-check            # lint + typecheck + format + tests
make safe-commit           # full-check, then prints commit instructions
make dev                   # npm run dev
```

Backend (`02-src/backend/services/backend/`, Node >=18):

```bash
npm start                  # production
npm run dev                # nodemon
```

## Self-host on VPS (production target - rebuilt)
Backend + SQLite + local reports. No Firebase, no Vertex, no GCS in the main path.

**To get it live and taking customers:**

```bash
# 1. Backend deps
cd 02-src/backend/services/backend && npm install

# 2. Frontend build for same-origin (Caddy will proxy APIs)
cd 02-src/frontend && VITE_API_BASE= npm run build
```

# 3. On VPS
- Place repo at /srv/code/diagnostic-pro
- Materialize secrets (sops) — must include DEEPSEEK_API_KEY + Stripe + Whop
- docker compose up -d --build
- Configure Caddy (see below)
- systemctl reload caddy
- DNS: diagnosticpro.io A -> 167.86.106.29

**Caddy block** (put in /etc/caddy/sites/diagnosticpro.caddy or main file):
```
diagnosticpro.io {
    root * /srv/static/diagnosticpro
    file_server

    # Proxy API + report serving + webhooks to backend container
    reverse_proxy /healthz /saveSubmission /analyzeDiagnostic /reports/* /view/* /api/* /stripeWebhookForward 127.0.0.1:8089

    header {
        Strict-Transport-Security "max-age=31536000;"
    }
}
```

Copy the built `02-src/frontend/dist/*` to `/srv/static/diagnosticpro` on the VPS.

See docker-compose.yml for the self-contained setup (backend only; static via Caddy is preferred for prod).

Env (via sops):
- DB_PATH=/data/diagnosticpro.db
- REPORTS_DIR=/data/diagnosticpro/reports
- LLM_* for DeepSeek

This should be enough to take payments and deliver reports. Test the full form -> pay (Stripe test or Whop) -> analysis -> download flow.

Old Firebase hosting / Cloud Run is dead. This is the rebuilt self-hosted version.

Cloud Functions (`functions/`, Node 20):
```bash
npm run build              # tsc compile
npm run serve              # build + emulators
```

## Architecture Overview

### Three Codebases in One Repo (migrating to VPS self-host)

1. **Frontend** (`02-src/frontend/`) — React 18 + TypeScript + Vite, shadcn/ui + Tailwind CSS. Served statically via Caddy on VPS.
2. **Backend** (`02-src/backend/services/backend/`) — Express, single `index.js` (~2000 lines). Runs in Docker container on VPS behind Caddy (127.0.0.1 only). Uses DeepSeek by default for analysis.
3. **Cloud Functions** (legacy references only; removed from active paths) — was Firebase Functions.

### Critical: Double `src` Nesting

The frontend source lives at `02-src/frontend/src/src/`. Both Vite and Jest `@` aliases resolve to `./src/src`:

```
02-src/frontend/
├── src/
│   └── src/          ← actual source root (@ alias target)
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── config/
│       ├── hooks/
│       ├── integrations/
│       ├── lib/
│       └── data/
```

### Frontend Routes (App.tsx)

All page components are lazy-loaded via `React.lazy()`.

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Index | Landing page + 3-step form wizard (form → review → success) |
| `/report/:reportId` | Report | Polls Firestore for analysis status, offers PDF download |
| `/equipment/:equipmentSlug` | EquipmentLanding | SEO landing pages per equipment type |
| `/test-monitor` | TestMonitor | Internal ops dashboard |
| `/success`, `/payment-success` | PaymentSuccess | Post-payment polling for report URL |
| `/auth/callback` | AuthCallback | Whop OAuth PKCE callback handler |
| `/terms`, `/privacy` | Terms, Privacy | Legal pages |

### Frontend Services (`src/src/services/`)

- **`api.ts`** — Auth-aware fetch client. Prefers `VITE_EDGE_BASE` (Functions proxy) over `VITE_API_BASE` (Cloud Run direct). Attaches Firebase ID token.
- **`firestore.ts`** — Typed CRUD for Firestore collections: `diagnosticSubmissions`, `orders`, `emailLogs`.
- **`diagnostics.ts`** — Submission handler. Writes to Firestore via client SDK or Cloud Functions depending on config.
- **`reports.ts`** — Polls Firestore directly for status, reads `downloadUrl` field.

### Two Firebase Init Files

- `src/src/config/firebase.ts` — Has hardcoded fallback project values. Exports `db`, `auth`, `functions`.
- `src/src/integrations/firebase.ts` — Auth wrapper (`signIn`, `signUp`, `getIdToken`, etc.). Connects to emulators in dev mode.

### Whop Integration (`src/src/lib/`)

Whop membership ($29/mo or one-time plans) grants free diagnostics, bypassing Stripe payment.

- **`whop-auth.ts`** — OAuth PKCE flow, token exchange, membership verification, auth state management.
- **`whop-embed.ts`** — iframe detection for Whop app embed mode, `setupWhopEmbed()`.
- **`useWhopAuth.ts`** hook — React hook for auth state (localStorage: `whop_token`, `whop_user`, `whop_is_member`).
- **`WhopLoginButton.tsx`** — Login/logout + PRO badge display.

### Backend API Endpoints (Cloud Run `index.js`)

**Core endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/healthz` | Health check |
| POST | `/saveSubmission` | Save form data to Firestore (requires: `equipmentType`, `model`, `symptoms`) |
| POST | `/createCheckoutSession` | Stripe $4.99 checkout |
| POST | `/analyzeDiagnostic` | Trigger/re-trigger AI analysis |
| POST | `/analysisStatus` | Poll submission status |
| GET | `/view/:submissionId` | 302 redirect to signed PDF URL |
| GET | `/reports/signed-url` | Get download + view signed URLs |
| GET | `/reports/status` | Check GCS for PDF existence |
| POST | `/reports/ensure` | Idempotent requeue for failed reports |
| GET | `/checkout/session` | Retrieve Stripe session details |
| POST | `/getDownloadUrl` | Legacy: get download URL by submissionId |
| POST | `/stripeWebhookForward` | Stripe webhook receiver (triggers analysis pipeline) |

**Whop endpoints:**

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/whop-exchange` | OAuth code → token + membership check |
| GET | `/api/auth/whop-verify` | Verify active membership (`x-whop-token` header) |
| POST | `/api/webhooks/whop` | `membership.went_valid/invalid` webhook handler |
| POST | `/api/whop/analyze` | Member diagnostic submission (bypasses Stripe) |

### Production Flow

```
DiagnosticForm → DiagnosticReview (saves to Firestore via client SDK)
  → Stripe Buy Button ($4.99) OR Whop member free submit
  → Stripe webhook / Whop analyze endpoint
  → processAnalysis(): DeepSeek (OpenAI-compatible) → 15-section parse
  → generateDiagnosticProPDF() (pdfkit) → GCS upload
  → Firestore status → 'ready', downloadUrl set
  → Customer polls Report page → signed URL → PDF download
```

### PDF Generation

- **Production:** `02-src/backend/services/backend/reportPdfProduction.js` — Three classes: `PDFValidationSystem`, `TypographyManager`, `DiagnosticPDFGenerator`. Uses pdfkit with IBM Plex Mono fonts.
- **Functions fallback:** `functions/src/utils/pdf-generator.ts` — Simpler pdfkit generator.

### Firestore Collections

- `diagnosticSubmissions` — Status flow: `pending → processing → ready/failed`. Firestore rules allow public `create` only (no read/update from client).
- `orders` — Admin SDK only (all client ops denied).
- `emailLogs` — Admin SDK only.
- `analysis` — Stores parsed AI text and `reportPath`. Admin SDK only.
- `whopUsers` — Stores `whopId`, `username`, `email`, `isMember`, `membershipId`, access/refresh tokens, `lastVerified`.

### Overlapping Implementations

The Cloud Run backend and (legacy) Firebase Cloud Functions both implement Stripe webhooks and LLM analysis. They are alternative paths, not complementary:
- **Cloud Run** (`index.js`) — The primary production system with full endpoint set.
- **Functions** (`functions/src/index.ts`) — Has its own `stripeWebhook` export. Region: `us-east1`.

## CI/CD

`.github/workflows/deploy-cloudrun.yml` — Deploys **both** backend (Cloud Run) and frontend (Firebase Hosting) on push to `main` via Workload Identity Federation. Two independent jobs: `deploy-backend` and `deploy-frontend`. Frontend build copies `06-infrastructure/firebase/firebase.json` into `02-src/frontend/` before deploying.

`.github/workflows/ci.yml` — Three parallel jobs: frontend tests (Node 18), backend validation (loads `reportPdfProduction.js`), functions build (Node 18).

## Mobile (Capacitor)

Capacitor 8 configured for `io.diagnosticpro.app`. iOS and Android project dirs at `02-src/frontend/ios/` and `02-src/frontend/android/`. `webDir: 'dist'` wraps the Vite build output.

## Git Workflow

- Never commit directly to `main`. Always use feature branches.
- Run `make safe-commit` before committing (or `make full-check`).
- Pre-commit hook (`05-scripts/pre-commit-hooks.sh`, installed via `05-scripts/install-hooks.sh`) blocks `main`/`master` commits and runs lint, typecheck, format, and tests.

## Key File Paths

| What | Path |
|------|------|
| Frontend source root | `02-src/frontend/src/src/` |
| Frontend package.json | `02-src/frontend/package.json` |
| Vite config | `02-src/frontend/vite.config.ts` |
| Jest config | `02-src/frontend/jest.config.js` |
| Backend entry | `02-src/backend/services/backend/index.js` |
| Backend package.json | `02-src/backend/services/backend/package.json` |
| PDF generator (prod) | `02-src/backend/services/backend/reportPdfProduction.js` |
| Secrets config | `02-src/backend/services/backend/config/secrets.js` |
| Cloud Functions | `functions/src/index.ts` |
| Firebase config | `06-infrastructure/firebase/firebase.json` |
| Firestore rules | `06-infrastructure/firestore/firestore.rules` |
| Cloud Run Dockerfile | `06-infrastructure/cloudrun/Dockerfile` |
| Pre-commit hook | `05-scripts/pre-commit-hooks.sh` |
| CI/CD workflows | `.github/workflows/` |
| Flat docs directory | `01-docs/` (format: `NNN-abv-description.ext`) |


<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->
## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` to see full workflow context and commands.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --claim  # Claim work
bd close <id>         # Complete work
```

### Rules

- Use `bd` for ALL task tracking — do NOT use TodoWrite, TaskCreate, or markdown TODO lists
- Run `bd prime` for detailed command reference and session close protocol
- Use `bd remember` for persistent knowledge — do NOT use MEMORY.md files

**Architecture in one line:** issues live in a local Dolt DB; sync uses `refs/dolt/data` on your git remote; `.beads/issues.jsonl` is a passive export. See https://github.com/gastownhall/beads/blob/main/docs/SYNC_CONCEPTS.md for details and anti-patterns.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
<!-- END BEADS INTEGRATION -->
