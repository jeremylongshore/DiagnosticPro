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

DiagnosticPro is a customer-facing equipment diagnostic platform. Customers submit a form describing their vehicle/equipment problem, pay $4.99 via Stripe (or free for Whop members), and receive a 2000+ word PDF report with a proprietary 15-section AI analysis (Vertex AI Gemini 2.5 Flash). Production domain: `diagnosticpro.io`. GCP project: `diagnostic-pro-prod`.

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

Deploy backend:
```bash
gcloud run deploy diagnosticpro-vertex-ai-backend \
  --source 02-src/backend/services/backend/ \
  --region us-central1 --project diagnostic-pro-prod
```

Firebase:
```bash
firebase deploy --only hosting     # frontend to diagnosticpro.io
firebase deploy --only functions   # Cloud Functions (us-east1, NOT us-central1)
firebase emulators:start           # local dev
```

Cloud Functions (`functions/`, Node 20):
```bash
npm run build              # tsc compile
npm run serve              # build + emulators
```

## Architecture Overview

### Three Codebases in One Repo

1. **Frontend** (`02-src/frontend/`) — React 18 + TypeScript + Vite, shadcn/ui + Tailwind CSS
2. **Backend** (`02-src/backend/services/backend/`) — Express on Cloud Run, single `index.js` entry (~2000 lines)
3. **Cloud Functions** (`functions/`) — Firebase Functions v2, TypeScript, region `us-east1`

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
  → processAnalysis(): Vertex AI Gemini 2.5 Flash → 15-section parse
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

The Cloud Run backend and Firebase Cloud Functions both implement Stripe webhooks and Vertex AI analysis. They are alternative paths, not complementary:
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
