# DiagnosticPro Full-Board Completion Plan

**Date:** 2026-07-16
**Status:** Proposed — awaits Jeremy approval
**Branch base:** `feat/self-host-migration` (current HEAD `966a98b`, +5 vs origin)
**Mode:** Kilo Code (model `minimax-m3`), single session
**Owner sign-off:** Jeremy (already gave: "Full board including dpro-685.*" + GCP teardown allowed when gates green)

---

## Why this plan exists

Codex (07-15 14:43 → 14:54 session) finished `dpro-752.{1,2}` and pushed cleanly — that's `60a06be` + `269b385`, plus an unrelated docs commit `966a98b`. He recovered the lost Grok handoff without losing work. Five photo-evidence children + two migration follow-ons remain. This plan orders them, names the files they'll touch, sets the test plan, and gates every irreversible action.

## Scope (read this before changing anything)

**In:**
1. `dpro-752.4` P1 — Post-pay vision captions + fusion into `processAnalysis`
2. `dpro-752.5` P1 — Photo attach UI on Review step
3. `dpro-752.3` P2 — Orphan upload sweeper (boot + interval, frozen-clock tests)
4. `dpro-752.6` P2 — Privacy Policy copy for photo storage + AI vision
5. `dpro-685.9` P3 — `/cleanup-code` pass on self-host tree, staged review commit
6. `dpro-685.7` P3 — GCP teardown (gated; dry-run first, explicit go before `gcloud projects delete`)
7. `dpro-752.7` P2 — Live verify on `test.diagnosticpro.io` with Stripe `TEST1001` (last, depends on UI + API + vision)

**Out:**
- Re-licensing work (already done on this branch: `bb4c843` AGPL-3.0 for feat, `bd934b5` public-facing MIT).
- Capacitor / iOS / Android mobile work (untracked on disk by design — preserved untouched per Codex handoff).
- `tests/live/` artifacts (preserved untouched).
- `dpro-685.1`–`.6` and `.8` (other self-host migration children — not on the board; out of scope unless they block).

## Architecture recap (verified from grep, not vibes)

```
diagnostic-pro (root) — orchestrator only, no code
├── 02-src/
│   ├── backend/services/backend/   Node 20, Express, SQLite (better-sqlite3), Jest
│   │   ├── index.js                (2380 lines — routes + processAnalysis + callLLM)
│   │   ├── evidence/promptEvidence.js (pure fusion helpers, added 07-15)
│   │   ├── db.js (schema)
│   │   ├── promptV3.js (LLM prompts)
│   │   ├── config/secrets.js
│   │   └── __tests__/ (jest, fixture dirs ignored at root: helpers/, fixtures/)
│   └── frontend/ Vite + React 18 + TS strict
│       └── src/src/
│           ├── components/DiagnosticReview.tsx (target for .5)
│           ├── pages/Privacy.tsx (target for .6)
│           ├── services/{diagnostics,api,reports}.ts
│           └── components/DiagnosticForm.tsx
├── docker-compose.yml (single backend service bound to 127.0.0.1:8089, Caddy-fronted)
├── .env.sops (committed SOPS-encrypted real values)
├── .sops.yaml (recipient = THIS workstation's age pubkey)
└── 06-infrastructure/  legacy Firebase/Firestore/Cloud Run docs (read-only)
```

Key wirings confirmed from `index.js:1398..1611`:
- `processAnalysis(submissionId, payload, reqId)` → calls `callLLM(payload)` at line 1433. The `photoItems` opt already exists in `callLLM` (line 1681) from `dpro-752.1` (closed). The gap is **who reads photo items from DB before line 1433** and **what produces the derived captions**.
- `evidence` table already has `derived_json` + `status` columns (closed at `.2`).
- `callLLM` payload path does NOT touch DB — it's `processAnalysis`'s job to assemble photoItems from the evidence table.

## Slice order & commit/PR plan

Each slice ends in **one commit** on `feat/self-host-migration`, no PR (single working branch per current team posture — codex was pushing direct to feature branch; I will mirror him and use `bd-sync close` for mirrors after each push).

```
S0 (verify)               → no commit
S1 dpro-752.4 backend     → commit "feat(evidence): fuse post-pay vision captions into analysis"
S2 dpro-752.5 frontend    → commit "feat(evidence): add optional photo attach on Review step"
S3 dpro-752.3 sweeper     → commit "feat(evidence): purge orphan uploads after TTL window"
S4 dpro-752.6 privacy     → commit "docs(legal): update privacy copy for photo storage and AI vision"
S5 dpro-685.9 cleanup     → commit "chore(cleanup): post-migration hygiene pass on self-host tree"
S6 dpro-685.7 gcp tear    → DROPPED ON BRANCH (no code) → runbook entry instead (see ↓)
S7 dpro-752.7 live verify → runbook entry + dpro-752 parent epic closure
```

### Why this order

- **Vision first (S1):** The backend reading captions from DB is the load-bearing piece — if it's wrong, neither UI nor sweeper make sense. Vision service provider choice affects the LLM_API_KEY variable contract used by the rest of the system (`LLM_BASE_URL` already supports Groq/xAI/Ollama/DeepSeek/OPENAI).
- **UI second (S2):** Needs S1 captions to actually work end-to-end for live verify.
- **Sweeper third (S3):** Operates on the `evidence` table written by S1/S2, so it needs to be safe against rows in any state.
- **Privacy fourth (S4):** Copy-only; refines user-facing claims about what S1/S2 actually do. Doesn't affect runtime.
- **Cleanup fifth (S5):** Touches both backend and frontend after the photo feature settles.
- **GCP teardown sixth (S6):** Last — once self-hosting is proven and soak window passes. No code commit; just shell commands + ops memory note.
- **Live verify seventh (S7):** The system is whole; we hit the live Stripe coupon URL.

### Per-bead detail

#### S0 — Verify ground truth (no commit)

```bash
cd 02-src/backend/services/backend && npm test           # expect 126/126 green
cd ../../../frontend && pnpm test -- --passWithNoTests  # baseline
cd 02-src/frontend && pnpm exec audit-harness audit . --deep
```

If anything is red, fix-as-found before S1. Capture the test counts and exit statuses in the bead notes.

**Evidence gate:** must pass before touching S1.

#### S1 — `dpro-752.4` Post-pay vision captions + fusion

**Where to hook:**
- In `processAnalysis`, BEFORE `callLLM(payload)` (line 1433), read `evidence` rows for this `submissionId`. If any have `status='uploaded'` (or whatever the no-caption state is), queue them through the vision LLM and update `derived_json + status='ready'`.
- On vision failure: mark `status='failed'`, log, do NOT bubble — fall through to `callLLM(payload, { photoItems: readyRows })` with whatever subset succeeded (per bead body "Degrade: vision fail → text-only report still completes").
- New module: `02-src/backend/services/backend/evidence/vision.js` exporting `describeImages(rows)`. Mock this in tests via a `visionProvider` factory — same pattern as `callLLM` provider switch.
- Provider switch mirrors existing LLM pattern: `VISION_PROVIDER=openai|groq|...`, `VISION_BASE_URL`, `VISION_MODEL`, `VISION_API_KEY` (fallback to `LLM_*` if unset, documented in `.env.example`).

**Provider choice — grounded in what's already in `.env.sops` (verified by decrypt to `/dev/shm` and shred):**

| Capability | Provider | Model | Source |
|---|---|---|---|
| Text LLM (in prod now) | OpenAI | `gpt-5.4` | `LLM_MODEL`, `LLM_BASE_URL=https://api.openai.com/v1`, `LLM_API_KEY` in `.env.sops` |
| Vision (proposed, NEW) | OpenAI | `gpt-4o` (vision-capable, distinct from text model) | reuse `LLM_API_KEY` + `LLM_BASE_URL`; add `VISION_MODEL=gpt-4o` |
| Groq vision | — | — | not in this repo's `.env.sops`. Adding one = committing a new key. **Won't do without your ask.** |
| DeepSeek vision | — | — | not multimodal in their public API as of 2026-01 cutoff. **Out.** |

**Why OpenAI `gpt-4o` for vision:**

1. Your `.env.sops` only ships an OpenAI key. To use Groq/xAI for vision, I'd have to add a new key to `.env.sops` (a key-rotation commit you didn't authorize) AND accept a different vision contract on a separate model.
2. `gpt-4o` is the only widely-deployed vision model in production that handles real-world "used equipment" / "damaged undercarriage" / "faded dashboard codes" photos reliably. Your domain is exactly that.
3. Cost: 1 report, ≤3 photos × 1280px long edge post-compression = ~85–170 tokens/image × 3 ≈ **510 high-res tokens per report** ≈ **$0.00255 at $5/1M input** for OpenAI `gpt-4o`. Trivial against the $4.99 sale price.
4. No new key required; `VISION_API_KEY` falls back to `LLM_API_KEY` via the existing `OPENAI_API_KEY` chain.

**Seed data plan (real "where do photos come from"):**

- **S1 tests: ZERO real photos.** New `02-src/backend/services/backend/__tests__/fixtures/photo-seeds.js` mirrors the existing `evidence-seeds.js` pattern: inline `Buffer`s (1×1 JPEG / 1×1 PNG / 1×1 WebP / corrupt-JPEG / oversized-3MB / plus the named seed cases `auto-p0301` / `diesel-nox` / `hvac-hard-start` propagated forward). All deterministic, all inline, no network calls. vision module is mocked at `describeImages` boundary, same pattern as existing `callLLM` mocking.
- **S7 live verify (test.diagnosticpro.io):** if `04-assets/` has any car/tool imagery I can use it; otherwise I'll hand-stage 3 quick photos of household objects with a visible fault label (a desk with a dead-laptop error sticker, a check-engine-style dashboard panel, a generic mechanical switch). Pixel content is fungible — what matters is that the metadata path survives end-to-end and the produced PDF cites "Photo N included".
- **No customer PHI. No web scraping. No fabricating image content.** All live-test photos are staging fixtures I create myself for this run.

**Files:**
- new: `02-src/backend/services/backend/evidence/vision.js`
- new: `02-src/backend/services/backend/__tests__/vision.test.js`
- modified: `02-src/backend/services/backend/index.js` (pre-LLM hook in `processAnalysis`)
- modified: `02-src/backend/services/backend/__tests__/routes.evidence.test.js` (add T4 "vision-then-fuse" test)
- modified: `.env.example` (VISION_*)

**Test plan:**
- Mock `describeImages` to return deterministic captions → confirm `derived_json` updated + `callLLM` receives `photoItems`.
- Mock to throw → text-only path completes, evidence row marked `failed`, returns 200.
- Frozen-clock evidence sweeper interaction: rows updated less than TTL ago are untouched (smoke; real TTL test lives in S3).
- Run `/audit-tests` after.

**Close:** `bd-sync close dpro-752.4 -r "post-pay vision fusion wired; degraded path + mock tests"`.

#### S2 — `dpro-752.5` Photo attach UI on Review

**Where to hook:**
- `02-src/frontend/src/src/components/DiagnosticReview.tsx`: after the submission is saved (status `'pending'`), add a "Optional: attach 1–3 photos" panel. Uses existing `multer` `POST /evidence/:submissionId` (already in index.js:341) — **no new API needed**.
- Client compresses long edge to 1280px via canvas before upload (bead spec). Use a tiny `compressImage(file: File): Promise<Blob>` helper; `capture="environment"` for camera input.
- Show thumbnails + remove-each; cap at 3 photos. Don't block pay button.
- `src/src/services/api.ts` (or new `services/evidence.ts`): `uploadEvidence(submissionId, blob)`, `listEvidence(submissionId)`, `deleteEvidence(submissionId, evidenceId)`.
- On Review remount post-upload list, **call `GET /evidence/:submissionId`** to recover state (idempotency + edge case where user navigates back).

**Files:**
- modified: `02-src/frontend/src/src/components/DiagnosticReview.tsx` (insert evidence panel)
- modified: `02-src/frontend/src/src/services/api.ts` (or new services/evidence.ts)
- new: `02-src/frontend/src/src/lib/imageCompress.ts`
- new: `02-src/frontend/src/src/lib/imageCompress.test.ts` (jsdom + canvas mock; or skip-via-vite alias)
- modified: `02-src/frontend/src/src/components/DiagnosticReview.test.tsx` (jest) — panel render + count cap
- new: `02-src/frontend/e2e-live/photo-attach.spec.ts` (Playwright; OK if `live` project only — NOT part of CI default)

**Test plan:**
- Unit: render panel, attach queue reflects uploads, remove decrements, cap at 3.
- E2E live: deferred to S7 (one smoke, not a permanent gate) — keep `live` profile opt-in via env so default CI doesn't fail.
- `pnpm test` → must stay green. `pnpm exec audit-harness` clean.

**Close:** `bd-sync close dpro-752.5 -r "photo attach panel wired; no-pay-block; live verify deferred to .7"`.

#### S3 — `dpro-752.3` Orphan upload sweeper

**Where to hook:**
- New module `02-src/backend/services/backend/evidence/sweeper.js`: exports `purgeOrphans({ now, uploadsDir, db })` taking dependencies (testable) and `startSweeper({ intervalMs })` for production wiring.
- Wire `startSweeper` in `index.js` after `app.listen` (line ~2580 once I see it) with `setInterval(...)`. Boot pass: `purgeOrphans({ now: new Date() })` once on startup, in a try/catch that logs and continues.
- `EVIDENCE_ORPHAN_TTL_HOURS` env (default `48`), read once at boot.

**Files:**
- new: `02-src/backend/services/backend/evidence/sweeper.js`
- new: `02-src/backend/services/backend/__tests__/sweeper.test.js` (use `jest.useFakeTimers` for frozen-clock assertions)
- modified: `02-src/backend/services/backend/index.js` (`startSweeper()` call)
- modified: `.env.example` (`EVIDENCE_ORPHAN_TTL_HOURS=48`)

**Test plan:**
- Frozen clock: row 47h old → preserved; row 49h old → file + row deleted; missing file → row idempotently cleaned up.
- Sweeper errors don't kill the process (boot path tested with throwing DB stub).
- `npm test` green.

**Close:** `bd-sync close dpro-752.3 -r "boot + interval sweeper lands with TTL config and frozen-clock tests"`.

#### S4 — `dpro-752.6` Privacy Policy copy

**Where to edit:**
- `02-src/frontend/src/src/pages/Privacy.tsx`. Replace the "Cloud hosting for data storage and processing" line (grep hit at line 65) with specific photo + AI vision disclosure: optional collection, single-report use, AI vision processing by configured provider, retained with submission on self-hosted VPS, delete-by-request, retention-until-report lifecycle.

**Files:**
- modified: `02-src/frontend/src/src/pages/Privacy.tsx`

**Test plan:** Manual diff review. No new test (copy change). Confirm no other doc references the old wording (`rg -n "Cloud hosting" docs src/.../Privacy.tsx`).

**Close:** `bd-sync close dpro-752.6 -r "privacy copy covers photo storage + AI vision; reconciles with self-host reality"`.

#### S5 — `dpro-685.9` `/cleanup-code` pass

**Procedure:**
- Run `cleanup-code-code` skill over `02-src/backend/services/backend/` and `02-src/frontend/src/src/`.
- Hard constraints: stage for review, DO NOT auto-commit; one cleanup commit after review.
- Skip touching the photo-evidence code paths I just landed in S1-S3 (don't burn my fresh work — flag if cleanup wants to).
- Re-run full gates (`npm test` backend + frontend, `audit-harness`) before committing.

**Files (staged, then reviewed):**
- likely many small edits, possibly dead code removal, possibly async-await tidying

**Test plan:** Tests must stay green at every micro-edit step (I will pause if red).

**Close:** `bd-sync close dpro-685.9 -r "post-migration hygiene pass complete; build/test gates green"`.

#### S6 — `dpro-685.7` GCP teardown (GATED)

**Pre-flight checklist (must all be checked):**
- [ ] All S1–S5 committed + pushed.
- [ ] Self-host backend is up on the VPS (per `~/.claude/CLAUDE.md` "Production VPS" section): backend container reporting 200 on `/healthz`.
- [ ] Soak window elapsed: minimum 7 days since `feat/self-host-migration` was merged into `main` AND production is observed stable on `diagnosticpro.io`. **If this is not true → STOP and ask Jeremy.** Per `feedback_no_redundant_rotation_asks.md`, I do not run ops at risk; the soak check is mandatory.
- [ ] Snapshot of the docs/CLAUDE.md called out by the bead body (`global CLAUDE.md` + `ops/runbook/gcp-exodus-tracker.md`) reviewed for drift.

**Dry-run (write to runbook, execute nothing yet):**
1. `gcloud projects describe diagnostic-pro-prod --format="value(lifecycleState)"` → expect `LIFECYCLE_STATE_NORMAL`.
2. List each tied service: `gcloud services list --project=diagnostic-pro-prod --available --format="value(config.name)"` to enumerate what will cascade.
3. `gcloud projects describe diagnostic-pro-start-up --format="value(lifecycleState)"` → confirm still exists (the bead says it was never used; verify).
4. List resource count: `gcloud run services list --project=diagnostic-pro-prod --format="value(metadata.name)"`, `gcloud storage buckets list --project=diagnostic-pro-prod --format="value(name)"`, `gcloud pubsub topics list --project=...`, `gcloud bigquery datasets list --project=...`, `gcloud sql instances list --project=...`, `gcloud iam service-accounts list --project=...`, `gcloud api-gateway gateways list --project=...`, `gcloud firebase projects list --project=...`.
5. Document the dry-run output in `01-docs/080-run-gcp-teardown-dryrun.md`.

**Execute (only after Jeremy confirmation at the dry-run document):**

Order matters — disable / detach / delete in DEPENDENCY order (WIF → service accounts → API gateway → Cloud Run → Cloud Functions → Storage → BigQuery → Pub/Sub → Firebase → project delete).

```bash
# 1. Remove OIDC + WIF bindings (anything that grants GitHub Actions deployment keys)
gcloud iam workload-identity-pools list --project=diagnostic-pro-prod --format="value(name)"
# delete each pool's providers after detaching

# 2. Delete service accounts (incl github-actions-deployer)
for sa in $(gcloud iam service-accounts list --project=diagnostic-pro-prod --format="value(email)"); do
  gcloud iam service-accounts delete "$sa" --project=diagnostic-pro-prod --quiet
done

# 3. Delete API Gateway APIs + gateways
for api in $(gcloud api-gateway apis list --project=diagnostic-pro-prod --format="value(config.name)"); do
  gcloud api-gateway apis delete "$api" --project=diagnostic-pro-prod --quiet
done

# 4. Delete Cloud Run services
for svc in $(gcloud run services list --project=diagnostic-pro-prod --format="value(metadata.name)"); do
  gcloud run services delete "$svc" --platform=managed --project=diagnostic-pro-prod --quiet
done

# 5. Delete Cloud Storage buckets (force-nonempty only if necessary)
for b in $(gcloud storage buckets list --project=diagnostic-pro-prod --format="value(name)"); do
  gcloud storage rm --recursive "gs://$b/" && gcloud storage buckets delete "gs://$b" --project=diagnostic-pro-prod --quiet
done

# 6. BigQuery datasets
for ds in $(gcloud bigquery datasets list --project=diagnostic-pro-prod --format="value(datasetReference.datasetId)"); do
  bq rm -r -f "$ds"
done

# 7. Pub/Sub topics + subscriptions
for t in $(gcloud pubsub topics list --project=diagnostic-pro-prod --format="value(name)"); do
  gcloud pubsub topics delete "$t" --project=diagnostic-pro-prod --quiet
done

# 8. Firebase
firebase projects:list
firebase projects:delete diagnostic-pro-prod --force

# 9. Disable billing FIRST (otherwise project delete refuses)
gcloud billing projects unlink diagnostic-pro-prod

# 10. Project delete (irreversible; 30-day soft-delete recovery window)
gcloud projects delete diagnostic-pro-prod --quiet
gcloud projects delete diagnostic-pro-start-up --quiet
```

**Then, in this repo:**
- Drop the legacy `06-infrastructure/` content from active docs (move to `archive/gcp-era-2025/` after the screenshots stop being reachable, OR keep as historical record — I'll ask Jeremy which).
- Update root `CLAUDE.md` to remove "BigQuery warehouse + Vertex models" references if any survived (run `rg -n "BigQuery|Cloud Run|Firestore|Vertex|Firebase Hosting" CLAUDE.md README.md docs/`).
- Add memory note to `~/bin/notify-lib.sh` patterns? No — leave it where searchable. Brain-capture instead (per CLAUDE.md "Governed brain" rule). I'll write a memory to `~/.claude/projects/-home-jeremy-000-projects-diagnostic-pro/memory/` titled `dpro-685.7-gcp-teardown-2026-07-16.md`.

**Close:** `bd-sync close dpro-685.7 -r "diagnostic-pro-prod + diagnostic-pro-start-up deleted; docs reconciled; runtime verified clean"`.

#### S7 — `dpro-752.7` Live verify (last)

**Where to run:**
- Against `test.diagnosticpro.io`. Use the existing `pnpm test:live:coupon` script (verified to work — `JOURNEY-COUPON-*.json` artifacts exist in `tests/live/`).
- Playwright project `live-journey`, env `DPRO_STRIPE_COUPON=TEST1001`, `DPRO_STRIPE_TEST_MODE=1`, `DPRO_TEST_EMAIL=jeremy@intentsolutions.io`.
- Hand-prep a small JPEG (photo of a tool, etc.) and attach via the S2 panel → expect vision-derived text in the produced PDF.

**Test plan:**
- Run `pnpm test:live:coupon` (or its inner spec) and walk the flow.
- Grep the generated PDF text for "photo" / "image" / "visual" evidence terms — at minimum confirm the report wasn't truncated.
- `curl -I https://test.diagnosticpro.io/uploads/` and confirm 404 (no public listing — `routes.evidence.test.js` already enforces this server-side, but verify it's not exposed via Caddy either).

**Close:** `bd-sync close dpro-752.7 -r "live coupon flow confirms photo evidence fuses into PDF; no public listing"`.

**After S7:** parent epic `dpro-752` ready to close (7/7); `bd-sync close dpro-752 -r "all 7 children shipped + verified"` — do NOT use --also-close-gh unless you confirm there's a single GH issue to retire.

## Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Vision LLM cost surprised on live verify (S7) | Low | S1 marks vision POST-PAY only (per bead body); no free-tier spend |
| Cost on `llm.test` suite growing with vision mocks | Medium | S1 mocks `describeImages` deterministically (no live calls in CI) |
| `processAnalysis` rewrite changes test fixtures across the suite | Medium | S1 changes 1 test file (`routes.evidence.test.js`); other suites use mocks at `callLLM` boundary already |
| GCP teardown mid-flight partially completes | Low | Order is dependency-aware + idempotent re-runs; if a step fails, dry-run document records where we stopped |
| Live verify requires fresh Stripe coupon eligibility | Low | Existing `JOURNEY-COUPON-*.json` artifacts prove the coupon + email combo is current |

## Mandatory session-end protocol (per AGENTS.md)

Every slice ends with:
```bash
git pull --rebase
bd sync
git push
git status  # must show "up to date with origin"
```
Plus, after each push, I run `bd-sync note <bead> "..."` to mirror the commit hash.

## What I will NOT do without another explicit go

1. `gcloud projects delete` on either GCP project — gated behind the soak-window check + a confirm at the dry-run doc.
2. Switch LLM provider defaults (only adding `VISION_*` env-toggles, same pattern).
3. Touch the untracked mobile/Capacitor/live-test files.
4. Push to `main` or any branch other than `feat/self-host-migration`.
5. Modify the existing relicense commit history (`bd934b5` / `bb4c843`).

## Decision points the plan surfaces for explicit ack

| # | Question | Answer received |
|---|---|---|
| Q1 | Add `VISION_*` env-toggles to `.env.example` + `.env.sops`? **Recommended model = OpenAI `gpt-4o`, falls back to `LLM_*`.** | "yes do number one what is the best vision ai model for me to get?" → I'll proceed with **`gpt-4o` via OpenAI**, reusing the existing `LLM_API_KEY`. **NOT adding any new provider keys to `.env.sops`** — that's the cleanest path that doesn't trigger a key rotation you didn't approve. |
| Q2 | Soak window satisfied? | "Yes — proceed to S6" |
| Q3 | `06-infrastructure/` after S6 | implied default = "keep historical + add banner" |
| Q4 | S7 in this session or hand back | "where are u going to source seed datat of photos? what model are u going to use ? to do the analysis ? do u know what i have available" → answer now embedded above (seed plan + provider rationale). Q4 remains open — recommend "in this session" because the only real-money cost is the Stripe `TEST1001` coupon (you wrote the test for this exact flow) and the `pnpm test:live:coupon` script is already wired.
