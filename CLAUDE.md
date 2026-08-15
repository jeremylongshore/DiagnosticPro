# CLAUDE.md

This file provides guidance for coding agents working in the DiagnosticPro
repository. The public setup and product overview live in [README.md](README.md);
this file records implementation and operational facts that agents need.

## Task tracking

Use `bd` for all task tracking. Run `bd prime` at the start of a session, then
create or claim a bead before changing files:

```bash
bd ready
bd create --title="..." --description="..." --type=task --priority=2
bd update <id> --claim
bd close <id> --reason="..."
bd dolt push
```

This installation does not provide a `bd sync` command; use `bd dolt push` for
the beads remote. Do not use markdown TODO lists or TodoWrite-style tracking.

## What this repository is

DiagnosticPro is a customer-facing equipment diagnostic application. The
current production path is:

```text
React/Vite form
  -> Express API
  -> SQLite pending submission
  -> Stripe Checkout ($4.99)
  -> verified Stripe webhook
  -> configurable OpenAI-compatible LLM
  -> validated 15-section analysis
  -> PDF on local persistent storage
  -> browser polling and download/view URL
```

The active deployment is self-hosted on the Intent Solutions VPS behind Caddy.
The main path does not use Firebase, Firestore, Google Cloud Storage, Cloud
Run, or Vertex AI. References to those systems in older changelog entries are
historical migration context, not current runtime dependencies.

The report prompt targets roughly 2,000–2,500 words in 15 sections. The model
defaults to `gpt-4o`, but `LLM_API_KEY`, `LLM_BASE_URL`, and `LLM_MODEL` are
environment-driven. The current frontend's primary paid path is Stripe;
Whop OAuth, membership, and webhook routes remain in the backend for a later or
separate membership surface.

## Runtime and package boundaries

- Frontend: Node 20 in CI, pnpm 10, React 18, TypeScript, Vite, Jest, and
  Playwright. Vite's development server is configured for port `8080`.
- Backend: Node `>=22` by package contract; CI and the production Docker image
  use Node 24. It is an Express service with better-sqlite3, Stripe, Multer,
  PDFKit, and the OpenAI-compatible client.
- Production backend: port `8080` inside Docker, published only as
  `127.0.0.1:8089`; Caddy is the public entry point.
- Storage: SQLite, generated reports, and private evidence uploads are on
  persistent Docker volumes. Evidence is not served as public static content.

## Commands

Run frontend commands from `02-src/frontend/`:

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm run build
pnpm run lint
npx tsc --noEmit
pnpm exec prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}"
pnpm run test:e2e
```

`pnpm run test:e2e` expects a built `dist/`; run `pnpm run build` first when
working outside CI. Live customer journeys are separate and require an
explicit deployed target:

```bash
PLAYWRIGHT_BASE_URL=https://test.diagnosticpro.io pnpm run test:live:test
```

Run backend commands from `02-src/backend/services/backend/`:

```bash
npm ci
npm start
npm run dev
npx jest --coverage
node --check index.js
```

The root Makefile contains convenience targets, but several still assume a
root-level `package.json`; the directory-specific commands above are the
reliable equivalents.

## Local configuration

Copy the root template and export it before starting the backend. The backend
does not load `.env` automatically:

```bash
cp .env.example .env
cd 02-src/backend/services/backend
set -a
. ../../../../.env
set +a
mkdir -p .data/reports .data/uploads
NODE_ENV=development \
PORT=8081 \
DB_PATH="$PWD/.data/diagnosticpro.db" \
REPORTS_DIR="$PWD/.data/reports" \
EVIDENCE_UPLOADS_DIR="$PWD/.data/uploads" \
npm run dev
```

For a frontend dev server calling that backend, use
`VITE_API_BASE=http://localhost:8081`. For a production-style build served by
Caddy, leave the API base empty so requests remain same-origin.

Required provider settings depend on the path under test:

- `LLM_API_KEY`, `LLM_BASE_URL`, and `LLM_MODEL` for real analysis;
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, and
  `STRIPE_WEBHOOK_SECRET` for Stripe Checkout and webhook handling;
- `WHOP_API_KEY`, `WHOP_WEBHOOK_SECRET`, `WHOP_APP_ID`, and
  `WHOP_PRODUCT_ID` for the retained Whop routes; and
- `EVIDENCE_UPLOADS_DIR`, `EVIDENCE_ORPHAN_TTL_HOURS`, `DB_PATH`, and
  `REPORTS_DIR` for self-hosted storage.

Never commit `.env` or plaintext credentials. Production secrets are provided
by the deployment boundary from the tracked SOPS-encrypted `.env.sops`.

## Docker and production deployment

`docker-compose.yml` defines two services from the same backend image:

- `backend` on `127.0.0.1:8089` with the production data volume;
- `backend-test` on `127.0.0.1:8093` with a separate test data volume and
  optional `.env.test`.

The image is built from Node 24 and includes the native build toolchain plus
the PDF/document tools used at runtime. The normal local parity check is:

```bash
docker compose up -d --build
docker compose ps
curl http://127.0.0.1:8089/healthz
docker compose logs -f backend
docker compose down
```

Pushing to `main` runs `.github/workflows/deploy.yml`. Its pre-deploy gate
builds the frontend and checks backend syntax. The reusable VPS workflow then
updates the checkout, runs the Docker deployment, builds the frontend, and
syncs `dist/` to the Caddy static root. Post-deploy checks verify production
health and test-surface revision/evidence-route parity. Deployment authority
and host-specific secrets live in the Intent Solutions `intent-os/ops/`
runbooks; do not recreate that authority in this repository.

## Frontend routes and source layout

The actual frontend source root is `02-src/frontend/src/src/`; the nested path
is intentional because both Vite and Jest alias `@` to it.

| Route                                   | Purpose                                              |
| --------------------------------------- | ---------------------------------------------------- |
| `/`                                     | Landing page and diagnostic form/review/success flow |
| `/equipment/:equipmentSlug`             | Equipment-specific landing page                      |
| `/success`, `/payment-success`          | Post-payment report polling and download             |
| `/report/:reportId`                     | Report status/download page                          |
| `/test-monitor`                         | Internal test monitor                                |
| `/auth/callback`                        | Retained Whop OAuth callback                         |
| `/terms`, `/privacy`, `/acceptable-use` | Legal pages                                          |

## Backend API and data contracts

Core routes in `02-src/backend/services/backend/index.js`:

| Method   | Path                                  | Contract                                                                   |
| -------- | ------------------------------------- | -------------------------------------------------------------------------- |
| `GET`    | `/healthz`                            | Returns `status`, service version, and build `gitSha`                      |
| `POST`   | `/saveSubmission`                     | Saves a pending submission and returns `submissionId` plus `evidenceToken` |
| `POST`   | `/evidence/:submissionId`             | Adds one private JPEG, PNG, or WebP photo                                  |
| `POST`   | `/evidence/:submissionId/document`    | Adds and parses one document                                               |
| `GET`    | `/evidence/:submissionId`             | Lists evidence metadata with `x-evidence-token`                            |
| `DELETE` | `/evidence/:submissionId/:evidenceId` | Deletes pending evidence                                                   |
| `POST`   | `/createCheckoutSession`              | Creates the $4.99 Stripe Checkout session                                  |
| `POST`   | `/stripeWebhookForward`               | Verifies Stripe events and queues paid analysis                            |
| `POST`   | `/analyzeDiagnostic`                  | Queues or re-triggers analysis                                             |
| `POST`   | `/analysisStatus`                     | Returns analysis status                                                    |
| `GET`    | `/reports/signed-url`                 | Returns local report URLs when ready                                       |
| `GET`    | `/reports/download/:submissionId`     | Streams a local PDF                                                        |
| `GET`    | `/view/:submissionId`                 | Resolves a report view request                                             |
| `POST`   | `/api/auth/whop-exchange`             | Retained Whop OAuth exchange                                               |
| `GET`    | `/api/auth/whop-verify`               | Retained Whop membership verification                                      |
| `POST`   | `/api/webhooks/whop`                  | Retained Whop webhook handler                                              |
| `POST`   | `/api/whop/analyze`                   | Retained member analysis path                                              |

Evidence limits are three photos at 2 MiB each and five documents at 10 MiB
each. Documents are parsed before prompt construction; extracted text is
bounded. Scanned PDFs can be retained with `needs_ocr` status but are not
treated as understood evidence. The evidence token is scoped to a submission,
hashed at rest, and mutations are rejected after payment.

The SQLite schema and migrations are in `db.js`. Do not reintroduce Firestore
or GCS fields into the main flow without an explicit migration decision.

## CI and testing

`.github/workflows/ci.yml` is the authoritative CI definition:

- `frontend-test`: pnpm 10 + Node 20, frontend tests, production build, and
  advisory audit-harness run;
- `backend-test`: Node 24, npm install, Poppler, Jest coverage, and PDF loader
  smoke check;
- `e2e`: local backend boot, frontend build, and Playwright browser tests; and
- `live-journey`: manual or scheduled deployed-site journeys, with payment
  steps gated behind an explicitly configured Stripe test surface.

Do not describe the live journey as a local unit test. It can create real
submissions and must use the test target and test credentials.

## Security invariants

- Stripe and Whop webhook signatures must be verified in production.
- Caddy is the only public path to the backend; the Compose mapping binds to
  loopback.
- Keep `app.set('trust proxy', 1)` aligned with the single Caddy hop. Do not
  change it to `true` without a reviewed proxy topology change.
- Preserve the general, submission, analysis, and evidence rate limiters.
- Keep evidence outside static serving, validate file signatures, enforce size
  limits, hash stored bytes, and preserve the orphan sweeper.
- Do not log secrets, raw evidence tokens, payment credentials, or private file
  contents.
- Keep plaintext secrets out of commits and use `SECURITY.md` for reporting.

## Key paths

| What                     | Path                                                               |
| ------------------------ | ------------------------------------------------------------------ |
| Frontend source          | `02-src/frontend/src/src/`                                         |
| Frontend package/config  | `02-src/frontend/package.json`, `vite.config.ts`, `jest.config.js` |
| Backend entry            | `02-src/backend/services/backend/index.js`                         |
| Backend package          | `02-src/backend/services/backend/package.json`                     |
| SQLite schema            | `02-src/backend/services/backend/db.js`                            |
| Evidence handlers        | `02-src/backend/services/backend/evidence/`                        |
| Production PDF generator | `02-src/backend/services/backend/reportPdfProduction.js`           |
| Secret adapter           | `02-src/backend/services/backend/config/secrets.js`                |
| Compose services         | `docker-compose.yml`                                               |
| CI/deploy                | `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`         |
| Environment template     | `.env.example`                                                     |
| Public docs              | `README.md`, `01-docs/`, `docs/`                                   |

<!-- BEGIN BEADS INTEGRATION v:1 profile:minimal hash:7510c1e2 -->

## Beads Issue Tracker

This project uses **bd (beads)** for issue tracking. Run `bd prime` for workflow context.

### Quick Reference

```bash
bd ready
bd show <id>
bd update <id> --claim
bd close <id>
bd dolt push
```

### Rules

- Use `bd` for all task tracking; do not use TodoWrite, TaskCreate, or markdown TODO lists.
- Create or claim a bead before changing files.
- Use `bd remember` for durable project knowledge instead of MEMORY.md files.

## Session completion

Before ending work:

1. File beads for remaining work.
2. Run relevant quality gates.
3. Close completed beads and inspect `git status`.
4. Run `git pull --rebase`, `bd dolt push`, `git push`, and verify the branch is up to date.
5. Preserve unrelated user stashes and changes; do not reset or clean them destructively.
<!-- END BEADS INTEGRATION -->
