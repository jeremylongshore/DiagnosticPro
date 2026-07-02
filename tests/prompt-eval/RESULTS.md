# DiagnosticPro Prompt Eval — RESULTS

**Date:** 2026-07-02 · **Baseline:** `v2` prompt on `gpt-4o` (the incumbent production framework, "15-Section Analysis Framework v2.0") · **Corpus:** 9 frozen cases (`live-1`, `mock-a`–`mock-h`) · **Rubric:** weighted per `rubric.md` (0–100 scale)

**Judges (blind A/B, deterministic balanced ordering):**

| Judge label | Model | Notes |
|---|---|---|
| `openai` | gpt-5.4 | Original judge; strict — penalizes fabricated specifics hard |
| `deepseek` | deepseek-chat | Second, independent-provider judge, added 2026-07-02. **The planned `anthropic` (claude-sonnet-5) judge could not run: the Anthropic API credit balance is exhausted** (same reason the claude-sonnet-5 generation grid is partial — v3-a has 5/9 cases, v3-b 6/9, v3-c 3/9, v3-d 0/9). |

Absolute scores are **not comparable across judges** (deepseek scores candidates ~5–25 pts more generously than gpt-5.4). Preference direction (win/tie/loss) and per-case margins are the cross-judge signals used below.

---

## 1. Score table — per (candidate × model) vs baseline `v2__gpt-4o`

All rows judged against the same `v2__gpt-4o` baseline outputs. "Agreement" = fraction of shared cases where both judges preferred the same side.

### Production-model rows (gpt-4o vs gpt-4o — pure prompt comparison; the ship decision)

| Candidate | Judge gpt-5.4: cand / base (W-L-T) | Judge deepseek: cand / base (W-L-T) | Judge agreement | Cases |
|---|---|---|---|---|
| **v3-b few-shot exemplar** | **64.7 / 53.3 (9-0-0)** | **68.5 / 57.7 (9-0-0)** | **1.00** | 9 |
| v3-d code-rigor + ripoff | 64.2 / 51.9 (7-2-0) | 71.6 / 56.1 (9-0-0) | 0.78 | 9 |
| v3-a chain-of-thought | 53.6 / 52.4 (5-4-0) | 64.7 / 60.5 (6-3-0) | 0.67 | 9 |
| v3-c self-critique | 53.1 / 50.6 (6-3-0) | 60.2 / 58.7 (4-4-1) | 0.56 | 9 |

### Cross-model rows (prompt + model change together — informational, not the ship decision)

| Candidate cell | Judge gpt-5.4: cand / base (W-L-T) | Judge deepseek: cand / base (W-L-T) | Agreement | Cases |
|---|---|---|---|---|
| v3-d × gpt-5.4 | 89.8 / 44.4 (9-0-0) | 94.7 / 48.1 (9-0-0) | 1.00 | 9 |
| v3-b × gpt-5.4 | 87.9 / 48.1 (9-0-0) | 91.4 / 45.4 (9-0-0) | 1.00 | 9 |
| v3-c × gpt-5.4 | 86.2 / 48.4 (9-0-0) | 91.8 / 47.7 (9-0-0) | 1.00 | 9 |
| v3-a × gpt-5.4 | 85.4 / 47.7 (9-0-0) | 91.2 / 45.6 (9-0-0) | 1.00 | 9 |
| v3-b × claude-sonnet-5 | 72.2 / 47.3 (6-0-0) | 90.0 / 45.5 (6-0-0) | 1.00 | 6 ⚠️ partial |
| v3-a × claude-sonnet-5 | 68.5 / 53.6 (4-1-0) | 91.9 / 48.4 (5-0-0) | 0.80 | 5 ⚠️ partial |
| v3-c × claude-sonnet-5 | 59.7 / 50.8 (2-1-0) | 86.5 / 50.3 (3-0-0) | 0.67 | 3 ⚠️ partial |

⚠️ claude-sonnet-5 cells are incomplete (Anthropic credits exhausted mid-run) **and** 5 of the 14 existing claude outputs hit the 8,192-token cap mid-report (`finish_reason: "length"` — a truncated customer report is a shipping defect regardless of judge score). Treat these rows as directional only.

### Per-axis means — v3-b × gpt-4o vs baseline (both judges)

| Axis (weight) | gpt-5.4 judge: v3-b / v2 | deepseek judge: v3-b / v2 |
|---|---|---|
| diagnosticAccuracy (25) | 6.6 / 5.3 | 6.8 / 5.7 |
| codeCoverage (15) | 7.2 / 6.7 | 7.2 / 6.2 |
| actionability (15) | 5.6 / 4.9 | 6.9 / 6.0 |
| hallucinationRisk (15, higher=better) | **5.7 / 3.1** | **6.6 / 4.8** |
| ripoffDetection (10) | 6.0 / 4.9 | 6.0 / 5.0 |
| costRealism (10) | 6.0 / 5.0 | 6.2 / 5.3 |
| formatAdherence (10) | 8.7 / 8.1 | 8.3 / 7.7 |

v3-b beats the baseline on **every axis under both judges**; the single biggest gain is hallucination control (+2.6 and +1.8 on a 10-pt axis).

---

## 2. Beat-the-baseline verdict

**SHIP v3-b (few-shot exemplar) as the gpt-4o prompt.** It is the only candidate that beats v2.0 **consistently** under the plan's rule:

- **18/18 blind judgments prefer v3-b over v2** on gpt-4o (9 cases × 2 judges, zero losses, zero ties). Judge agreement 1.00.
- **Margin vs judge noise:** the two judges disagree on a given case's margin by ~5 pts on average (e.g. mock-a: +5.0 vs +18.5; mock-e: +10.0 vs +1.5). v3-b's mean margin is **+11.4 (gpt-5.4 judge) / +10.8 (deepseek)** — roughly 2× the cross-judge noise, and the per-case margin is positive in all 18 judgments. This is outside noise.
- **v3-d** has comparable mean margins (+12.3 / +15.4) but **lost 2/9 cases under the strict judge** (mock-d, mock-g — both dinged for "riskier fabricated specifics"). It fails the "consistently" bar; it is the graft donor, not the winner.
- **v3-a and v3-c do NOT beat the baseline** on gpt-4o in any defensible way: margins of +1.1/+4.2 (v3-a) and +2.5/+1.5 (v3-c) are *smaller than the judges' own disagreement*, with 3–4 case losses each and judge agreement as low as 0.56. Within noise → no ship.
- The gpt-5.4 and claude-sonnet-5 rows show a large uplift, but that conflates model quality with prompt quality and is not the question this eval answers (see §6 for the cost/latency reality; product constraint is OpenAI gpt-4o). If v2.0 had been the only prompt available, the honest headline would be "v2.0 stays" for a prompt-only decision — it isn't, because v3-b clears the bar cleanly.

---

## 3. Winner deep-dive — v3-b (few-shot exemplar)

**The angle that won:** a compressed REFERENCE EXEMPLAR embedded in the user prompt (a different vehicle/customer), explicitly scoped to calibrate *format, tone, per-section shape, and specificity only*, with a hard guardrail against copying its diagnosis/codes/part numbers/prices. The exemplar shows the model what a grounded, calibrated section looks like — and that turns out to fix exactly the axes v2.0 bleeds on.

**Per-axis:** wins all 7 axes under both judges (table above); no axis losses. The recurring judge rationale themes: (a) v2 fabricates TSB numbers and part numbers, v3-b doesn't; (b) v2 overcommits at high confidence while ignoring case history, v3-b integrates the evidence and states calibrated confidence with a "Data Needed" sub-list; (c) v3-b handles proprietary/no-code cases honestly.

### Excerpt contrasts (verbatim, same case)

**Contrast 1 — evidence integration + calibration (`mock-a`: 2018 Camry, P0301+P0171, coil replaced 10k mi ago, original plugs).**

v2 baseline ignores the repair history and overcommits:

> Root cause with confidence percentage: The primary diagnosis for the 2018 Toyota Camry is a faulty or failing Mass Air Flow (MAF) sensor, with a confidence level of 85%.

v3-b ties the misfire to the recently replaced coil, explains the misfire→lean causal chain, and calibrates:

> Root cause: The primary issue appears to be a malfunctioning ignition coil on cylinder 1, which was replaced 10,000 miles ago. The error codes P0301 (cylinder 1 misfire) and P0171 (system too lean, bank 1) suggest that the misfire is causing unburned oxygen to enter the exhaust… Confidence: 75%. Further data is needed… Data Needed: Detailed misfire counts from the ECM…

**Contrast 2 — fabricated specifics (the baseline's fatal habit).**

v2 invents TSB IDs and part numbers across cases:

> Toyota TSB EG-0012-18: Addresses lean conditions and MAF sensor issues. *(mock-a)*
> Honda TSB 09-019: Addresses electrical issues related to alternator performance. *(mock-b)*
> Cummins Technical Service Bulletin #TSB-123456 (Cooling System Diagnostics) *(mock-c — literally "123456")*

v3-b, same sections:

> Toyota TSBs: Check for any applicable technical service bulletins related to ignition coil or misfire issues for the 2018 Camry. *(mock-a)*
> Honda TSBs related to electrical issues in the 2009 Civic — check with a Honda dealer for applicable bulletins. *(mock-b)*

This is the +2.6-point hallucinationRisk swing in one picture: v2's invented bulletin IDs look authoritative to a paying customer and are indefensible; v3-b routes the same intent through a verifiable action.

**Contrast 3 — proprietary-code honesty (`mock-c`: Cummins RS20A generator, ECU-1425).**

v2 asserts a meaning at 85% confidence:

> The error code ECU-1425 indicates an issue with the engine control unit related to temperature regulation. …Confidence: 85%.

v3-b flags the code class correctly and holds confidence honest:

> ECU-1425 is not a standard OBD-II code but is specific to Cummins generators, indicating an engine control unit (ECU) fault related to temperature or load management. …Confidence: 75%. More data is needed to confirm the exact component failure. Data Needed: Temperature readings from the generator during operation…

---

## 4. Graft opportunities (from runner-up candidates into v3-b)

1. **v3-d's cost-basis arithmetic (highest value).** v3-d's COST BREAKDOWN states its basis and draws an explicit line — `Labor: Book-time 2 hr × $120–$160/hr = $240–$320… Fair total price range: $740–$1,020. OVERCHARGE LINE: Above $1,020 is excessive` — exactly what the costRealism/ripoffDetection anchors ask for; v3-b's cost sections are still range-without-basis. Graft the v3-d system rule "Every dollar figure you write must state its basis (book time, published part price range, prevailing labor rate) — no untethered numbers."
2. **Extend v3-d's anti-invention rule to TSBs and part numbers.** v3-d bans invented *DTCs* but still fabricated `OEM ECU (Part No. 123456)` — which is what cost it mock-d/mock-g. Add one sentence to v3-b: never state a specific TSB number or OEM part number unless it appears in the customer data; otherwise describe how to look it up. This defends v3-b's biggest win axis (hallucinationRisk) at its remaining weak spot (Section 10/14 part references).
3. **v3-a's hard output contract.** The exact-first-characters / no-numbered-lists-inside-sections / end-after-third-bullet contract is the cleanest formatAdherence spec of the four; v3-b's format guardrail is looser. Cheap to merge into v3-b's system message.
4. **v3-c's silent verify-and-repair checklist — optional.** As a standalone angle it didn't clear noise (+2.5/+1.5), so don't expect much; if merged, keep it to 3–4 checklist items (confidence % present, exactly three bullets in §15, no invented identifiers) rather than the full checklist, to avoid burning output tokens.

Any grafted variant is a **new candidate (v3-b2)** and must re-run this bench against v3-b before shipping — grafts are hypotheses, not free wins.

---

## 5. Rollout plan (NOT implemented — plan only)

1. **Env flag:** introduce `LLM_FRAMEWORK_VERSION` (values: `v2.0` default, `v3.0-b`). In `02-src/backend/services/backend/index.js`, `callLLM` selects the system+user prompt template by this flag; the v3-b template is added alongside v2 (both render through the same `getEquipmentPromptContext` pieces — the bench already proved template parity via `{{CUSTOMER_DATA_BLOCK}}`/`{{DIAGNOSTIC_FRAME}}`/etc. substitution).
2. **Stamping:** write the active flag value into the `framework_version` column that already exists on each `analyses` row. No schema change. This makes before/after cohorts queryable and rollback attributable.
3. **Gate:** deploy with the flag **off** (`v2.0`). Run the e2e-live journey suite (the full paid-customer journey that is green on the test-mode twin) with `LLM_FRAMEWORK_VERSION=v3.0-b`. Promote — flip the env var in production — only after that suite passes with the flag on. Length guard note: v3-b outputs average ~1,563 completion tokens vs v2's ~1,325 (max_tokens 8192 — ample headroom), so `length_guard`/`page_estimator` should pass unchanged, but the suite is the arbiter.
4. **Rollback:** flip `LLM_FRAMEWORK_VERSION` back to `v2.0` and restart the service; `framework_version` stamps isolate affected reports.
5. **Out of scope for this flip:** model changes. gpt-5.4 is a genuinely stronger base (§1) but costs ~3.5× and ~3× the latency per report (§6); evaluate as a separate flag value (`model+prompt`) with its own e2e gate if report quality ever becomes the binding constraint.

---

## 6. Cost / latency per report (from `outputs/*.json` usage + ms)

Per-cell means over the 9-case corpus (claude cells partial). Pricing basis: gpt-4o $2.50/$10.00 per 1M in/out and gpt-5.4 $2.50/$15.00 per 1M in/out (third-party pricing aggregators, 2026-07 — OpenAI no longer lists gpt-4o on the official page; verify before budgeting); claude-sonnet-5 $3.00/$15.00 per 1M standard (Anthropic; intro $2.00/$10.00 through 2026-08-31 would give ~2/3 of the shown figure).

| Cell | n | mean in tok | mean out tok | mean latency | truncated | est. cost/report |
|---|---|---|---|---|---|---|
| v2 × gpt-4o (baseline) | 9 | 1,252 | 1,325 | 14.6 s | 0 | $0.016 |
| v3-c × gpt-4o | 9 | 2,120 | 1,361 | 15.8 s | 0 | $0.019 |
| v3-a × gpt-4o | 9 | 2,670 | 1,350 | 18.8 s | 0 | $0.020 |
| v3-d × gpt-4o | 9 | 2,322 | 1,745 | 22.9 s | 0 | $0.023 |
| **v3-b × gpt-4o (winner)** | 9 | 3,537 | 1,563 | 21.0 s | 0 | **$0.025** |
| v3-a × gpt-5.4 | 9 | 2,669 | 4,020 | 59.1 s | 0 | $0.067 |
| v3-c × gpt-5.4 | 9 | 2,119 | 4,532 | 59.4 s | 0 | $0.073 |
| v3-b × gpt-5.4 | 9 | 3,536 | 4,655 | 60.3 s | 0 | $0.079 |
| v3-d × gpt-5.4 | 9 | 2,321 | 5,706 | 67.4 s | 0 | $0.091 |
| v3-a × claude-sonnet-5 | 5 | 4,394 | 7,523 | 89.7 s | 1 | $0.126 |
| v3-c × claude-sonnet-5 | 3 | 3,618 | 8,192 | 99.5 s | 3 | $0.134 |
| v3-b × claude-sonnet-5 | 6 | 5,950 | 7,941 | 97.7 s | 1 | $0.137 |

**Shipping v3-b on gpt-4o costs ~$0.008 more per report than v2 (+50% relative, trivial absolute) at +6 s latency — for an 18/18 blind-judgment quality win.** The exemplar is the cost: ~2,300 extra input tokens per call. gpt-5.4 reports cost ~3.5× and take ~3× as long; claude-sonnet-5 ~6× cost, ~5× latency, and it blows through the 8,192-token cap on 5/14 reports.

---

## Appendix — reproduction

- Second-judge scores generated 2026-07-02 via `node judge.mjs --candidate <cell> --judge deepseek` (deepseek-chat added to `lib/common.mjs` MODELS + `judge.mjs` JUDGE_MODELS as an Anthropic-credit-exhaustion fallback). One transient judge-JSON parse failure (`v3-a__gpt-5.4` / `live-1`) succeeded on retry.
- Aggregation is deterministic from `scores/*.jsonl` (dedupe by case, keep last record).
- Machine-readable summary: `RESULTS.json` alongside this file.
