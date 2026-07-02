# DiagnosticPro Prompt Eval — RESULTS

**Date:** 2026-07-02 (regenerated after grid completion) · **Baseline:** `v2` prompt on `gpt-4o` (the incumbent production framework, "15-Section Analysis Framework v2.0") · **Corpus:** 9 frozen cases (`live-1`, `mock-a`–`mock-h`) · **Rubric:** weighted per `rubric.md` (0–100 scale)

**Grid status:** COMPLETE for `gpt-4o`, `gpt-5.4`, and `deepseek-v4-pro` (4 candidates × 9 cases × 2 judges each). `deepseek-v4-pro` replaced the planned `claude-sonnet-5` model track after the Anthropic API credit balance was exhausted mid-run; the partial claude cells (14/36 outputs, 5 truncated at max_tokens) are **retired to Appendix A and excluded from the verdict**.

**Judges (blind A/B, deterministic balanced ordering):**

| Judge label | Model | Family | Notes |
|---|---|---|---|
| `openai` | gpt-5.4 | OpenAI | Original judge; strict — penalizes fabricated specifics and broken structure hard |
| `deepseek` | deepseek-chat | DeepSeek | Second, independent-provider judge added 2026-07-02 |

Absolute scores are **not comparable across judges** (the deepseek judge scores candidates ~5–25 pts more generously than gpt-5.4). Preference direction (win/tie/loss) and per-case margins are the cross-judge signals used below. Where the two judges *disagree on direction*, §2's judge-family rule decides which one to believe.

All numbers below are recomputed directly from `scores/*.jsonl` (dedupe by case, keep last record) and `outputs/*.json`. Do not cite earlier revisions of this file.

---

## 1. Score table — per (candidate × model) vs baseline `v2__gpt-4o`

All rows judged against the same `v2__gpt-4o` baseline outputs. "Agreement" = fraction of shared cases where both judges preferred the same side. Margin = mean(weighted candidate − weighted baseline).

### 1a. Production-model rows (gpt-4o vs gpt-4o — pure prompt comparison; the ship decision)

| Candidate | Judge gpt-5.4: cand / base (margin, W-L-T) | Judge deepseek: cand / base (margin, W-L-T) | Agreement | Cases |
|---|---|---|---|---|
| **v3-b few-shot exemplar** | **64.72 / 53.33 (+11.4, 9-0-0)** | **68.50 / 57.67 (+10.8, 9-0-0)** | **1.00** | 9 |
| v3-d code-rigor + ripoff | 64.22 / 51.94 (+12.3, 7-2-0) | 71.56 / 56.11 (+15.4, 9-0-0) | 0.78 | 9 |
| v3-a chain-of-thought | 53.56 / 52.44 (+1.1, 5-4-0) | 64.67 / 60.50 (+4.2, 6-3-0) | 0.67 | 9 |
| v3-c self-critique | 53.06 / 50.56 (+2.5, 6-3-0) | 60.22 / 58.72 (+1.5, 4-4-1) | 0.56 | 9 |

### 1b. gpt-5.4 rows (prompt + model change together)

| Candidate cell | Judge gpt-5.4: cand / base (margin, W-L-T) | Judge deepseek: cand / base (margin, W-L-T) | Agreement | Cases |
|---|---|---|---|---|
| v3-d × gpt-5.4 | 89.78 / 44.39 (+45.4, 9-0-0) | 94.72 / 48.06 (+46.7, 9-0-0) | 1.00 | 9 |
| v3-b × gpt-5.4 | 87.89 / 48.11 (+39.8, 9-0-0) | 91.39 / 45.39 (+46.0, 9-0-0) | 1.00 | 9 |
| v3-c × gpt-5.4 | 86.17 / 48.44 (+37.7, 9-0-0) | 91.83 / 47.72 (+44.1, 9-0-0) | 1.00 | 9 |
| v3-a × gpt-5.4 | 85.39 / 47.67 (+37.7, 9-0-0) | 91.22 / 45.61 (+45.6, 9-0-0) | 1.00 | 9 |

### 1c. deepseek-v4-pro rows (prompt + model change together)

| Candidate cell | Judge gpt-5.4 (CROSS-family): cand / base (margin, W-L-T) | Judge deepseek (SAME-family): cand / base (margin, W-L-T) | Agreement | Cases |
|---|---|---|---|---|
| v3-b × deepseek-v4-pro | 68.39 / 52.28 (+16.1, **8-1-0**) | 91.11 / 49.83 (+41.3, 9-0-0) | 0.89 | 9 |
| v3-d × deepseek-v4-pro | 62.61 / 50.56 (+12.1, **5-4-0**) | 91.50 / 47.11 (+44.4, 9-0-0) | 0.56 | 9 |
| v3-c × deepseek-v4-pro | 63.72 / 52.61 (+11.1, **4-5-0**) | 90.44 / 48.28 (+42.2, 9-0-0) | 0.44 | 9 |
| v3-a × deepseek-v4-pro | 60.44 / 53.33 (+7.1, **4-5-0**) | 89.56 / 47.17 (+42.4, 9-0-0) | 0.44 | 9 |

The two judge columns tell opposite stories on this model — that disagreement is the subject of §2.

### 1d. Per-axis means — v3-b × gpt-4o vs baseline (both judges)

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

## 2. Judge-family bias — same-family self-preference (critical)

The grid now contains a clean natural experiment: each generation model is judged by one **same-family** judge and one **cross-family** judge.

**On the deepseek-v4-pro cells, the judges split hard along family lines:**

| Candidate on deepseek-v4-pro | SAME-family judge (deepseek-chat) | CROSS-family judge (gpt-5.4) |
|---|---|---|
| v3-a | 9-0-0, +42.4 | **4-5-0, +7.1** |
| v3-b | 9-0-0, +41.3 | **8-1-0, +16.1** |
| v3-c | 9-0-0, +42.2 | **4-5-0, +11.1** |
| v3-d | 9-0-0, +44.4 | **5-4-0, +12.1** |

The deepseek-chat judge scores its own family's outputs as sweeping the baseline 36-0 with gpt-5.4-class margins (+41 to +44). The cross-family gpt-5.4 judge sees the same reports as roughly coin-flip vs the gpt-4o baseline for v3-a/c/d, with only v3-b clearly ahead. Judge agreement collapses to 0.44–0.56 on three of the four cells — the lowest anywhere in the complete grid.

**The truncated-output tiebreaker (concrete, checkable):** 8 of 36 deepseek-v4-pro outputs hit the 8,192-token cap (`finishReason: "length"`), two so badly that reasoning tokens ate the budget and the visible report is a stub (`v3-a/mock-g`: 832 words; `v3-d/mock-h`: 756 words). On those cases the gpt-5.4 judge prefers the baseline and says why — *"severely incomplete, breaks the required 15-section format"* (`v3-d/mock-h`) — while the deepseek-chat judge **still prefers the truncated deepseek output** on both. A judge that prefers a visibly incomplete customer report from its own family over a complete baseline report is exhibiting self-preference, not insight.

**Mirror check — this is not "gpt-5.4 judge is just harsh" and not "deepseek judge is just generous":** on the gpt-5.4 generation cells, the deepseek-chat judge is the *cross-family* judge — and there it fully agrees with the same-family gpt-5.4 judge: 9-0-0 on all four candidates with margins +44.1 to +46.7 (agreement 1.00 across all 36 shared cases). The deepseek judge is perfectly willing to crown another family's model when the outputs earn it. The 36-0 sweep it awards its own family, over the cross-family judge's objection, is the anomaly.

**Decision principle adopted for this and future evals:**

> **When the two judges disagree on direction, the cross-family judge (different provider family from the generation model) is authoritative. Same-family judgments count only when the cross-family judge concurs.**

Applied to this grid: gpt-4o cells → deepseek-chat is authoritative-on-disagreement (gpt-5.4 judge shares a family with gpt-4o — moot in practice, both judges agree on the v3-b verdict); gpt-5.4 cells → deepseek-chat authoritative (it concurs, 9-0 everywhere); deepseek-v4-pro cells → gpt-5.4 authoritative (it does NOT concur — its numbers stand as the verdict).

---

## 3. Verdict (under the cross-family rule)

### 3a. Prompt winner on the incumbent model — SHIP v3-b on gpt-4o (unchanged)

**v3-b (few-shot exemplar) is the only candidate that beats v2.0 consistently:**

- **18/18 blind judgments prefer v3-b over v2** on gpt-4o (9 cases × 2 judges, zero losses, zero ties; agreement 1.00). Every one of the 18 per-case margins is positive.
- **Margin vs judge noise:** on the v3-b cell the two judges disagree on a given case's margin by 5.3 pts on average (grid-wide across all gpt-4o cells: 7.1). v3-b's mean margin is **+11.4 (gpt-5.4 judge) / +10.8 (deepseek judge)** — roughly 2× the cross-judge noise, with direction unanimous. This is outside noise.
- **v3-d** has larger mean margins (+12.3 / +15.4) but **lost 2/9 cases under the strict judge** (mock-d, mock-g — fabricated specifics). Fails the "consistently" bar; it is the graft donor, not the winner.
- **v3-a and v3-c do not beat the baseline**: margins +1.1/+4.2 and +2.5/+1.5 are smaller than the judges' own disagreement, with 3–4 case losses each and agreement as low as 0.56. Within noise → no ship.

**Recommendation: ship v3-b behind the `LLM_FRAMEWORK_VERSION` env flag** (rollout ladder in §6).

### 3b. gpt-5.4 model swap — strong, cross-family-confirmed upgrade signal

Every v3 candidate on gpt-5.4 sweeps the baseline 9-0-0 under **both** judges, with margins +37.7 to +46.7. The self-judge caveat (gpt-5.4 judging gpt-5.4 outputs) is real but **mitigated by cross-family agreement**: the deepseek-chat judge — no family stake — independently scores these cells 9-0-0 with the *largest* margins in the grid (+44.1 to +46.7). Under the §2 rule this is a validated quality upgrade, pending the cost check (§5: ~3.6× cost, ~3× latency vs v2).

### 3c. deepseek-v4-pro — NOT a validated upgrade

Under the §2 rule the authoritative (cross-family, gpt-5.4) judge has deepseek-v4-pro at **coin-flip vs the gpt-4o baseline for v3-a (4-5), v3-c (4-5), and v3-d (5-4)**. Only **v3-b × deepseek-v4-pro clears (8-1-0, +16.1)** — consistent with v3-b being the strongest prompt, not with the model being a general upgrade. The same-family 36-0 sweep is discounted per §2.

Two output-level facts from `outputs/*.json` complete the picture:

- **Length:** deepseek-v4-pro is one of only two complete-grid models that produces full-length reports — mean 19,410 chars / ~3,118 words / 6,877 completion tokens (of which a mean 2,496 are hidden reasoning tokens). gpt-4o never reaches the report spec's 2,000-word floor (mean 1,115 words, max 1,457 across all 36 outputs — roughly half target). **Caveat on the "hits 2000–2500" framing: the raw data does not support calling deepseek-v4-pro a 2000–2500-band model — it overshoots, with only 1/36 outputs inside that band (median 3,277 words); gpt-5.4 also overshoots (mean 3,456, min 2,781). The only model actually centered in the band was the retired claude-sonnet-5 (7/14 in band, median 2,315).** The honest claim: deepseek-v4-pro clears the 2,000-word floor on 33/36 outputs; the 3 misses are truncation stubs.
- **Cost:** at the assumed $0.42/1M in + $1.25/1M out, a deepseek-v4-pro report costs **~$0.010** (v3-b cell: $0.0097) — cheaper than the v2 baseline itself ($0.016) and ~8× cheaper than gpt-5.4. Pricing plausibility: consistent with DeepSeek's published price points for prior generations (deepseek-chat $0.27/$1.10, deepseek-reasoner $0.55/$2.19 per 1M) — plausible for a "v4-pro" tier, but **verify against the live price sheet before budgeting**; the relative token counts in §5 are the durable numbers.
- **But:** 8/36 outputs truncated at the 8,192-token cap (reasoning tokens count against it), including two sub-900-word stubs. A truncation rate of 22% is a shipping defect at any price. Latency measurements for this model are unreliable (§5 caveat).

**Verdict: deepseek-v4-pro is a cost-play fallback only, only with v3-b, and only after fixing the token-budget/truncation problem — not a quality upgrade.**

### 3d. Cross-model ranking of best cells (cross-family judge only)

Ranked by the cross-family judge's W-L-T and margin (absolute scores mix two judge scales — treat W/L and margin direction as the robust signal):

| Rank | Cell | Cross-family judge | W-L-T | Margin | Cand mean |
|---|---|---|---|---|---|
| 1 | v3-d × gpt-5.4 | deepseek-chat | 9-0-0 | +46.7 | 94.72 |
| 2 | v3-b × gpt-5.4 | deepseek-chat | 9-0-0 | +46.0 | 91.39 |
| 3 | v3-a × gpt-5.4 | deepseek-chat | 9-0-0 | +45.6 | 91.22 |
| 4 | v3-c × gpt-5.4 | deepseek-chat | 9-0-0 | +44.1 | 91.83 |
| 5 | v3-d × gpt-4o | deepseek-chat | 9-0-0 | +15.4 | 71.56 |
| 6 | v3-b × gpt-4o | deepseek-chat | 9-0-0 | +10.8 | 68.50 |
| 7 | v3-b × deepseek-v4-pro | gpt-5.4 | 8-1-0 | +16.1 | 68.39 |
| — | all other deepseek-v4-pro and gpt-4o cells | — | ≤6-3 | ≤+12.1 | — |

(v3-d × gpt-4o outranks v3-b × gpt-4o on the cross-family judge alone, but loses 2 cases under the strict judge — the ship rule requires consistency across *both* judges, which only v3-b delivers on gpt-4o.)

---

## 4. Winner deep-dive and grafts — v3-b (few-shot exemplar)

**The angle that won:** a compressed REFERENCE EXEMPLAR embedded in the user prompt (a different vehicle/customer), explicitly scoped to calibrate *format, tone, per-section shape, and specificity only*, with a hard guardrail against copying its diagnosis/codes/part numbers/prices. It fixes exactly the axes v2.0 bleeds on. Recurring judge rationale themes: (a) v2 fabricates TSB numbers and part numbers, v3-b doesn't; (b) v2 overcommits at high confidence while ignoring case history, v3-b integrates evidence and states calibrated confidence with a "Data Needed" sub-list; (c) v3-b handles proprietary/no-code cases honestly.

**Signature contrast (fabricated specifics — the baseline's fatal habit):**

> v2: `Toyota TSB EG-0012-18: Addresses lean conditions and MAF sensor issues.` *(mock-a)* · `Cummins Technical Service Bulletin #TSB-123456` *(mock-c — literally "123456")*
>
> v3-b: `Toyota TSBs: Check for any applicable technical service bulletins related to ignition coil or misfire issues for the 2018 Camry.` *(mock-a)*

And on proprietary codes (`mock-c`, Cummins RS20A, ECU-1425): v2 asserts a meaning at 85% confidence; v3-b — `ECU-1425 is not a standard OBD-II code but is specific to Cummins generators… Confidence: 75%. More data is needed… Data Needed: Temperature readings from the generator during operation…`

**Graft opportunities (any graft = new candidate v3-b2, must re-run this bench):**

1. **v3-d's cost-basis arithmetic** — "every dollar figure states its basis (book time × rate, published part price range); no untethered numbers" + explicit OVERCHARGE LINE. Highest value; v3-b's cost sections are still range-without-basis.
2. **Extend v3-d's anti-invention rule to TSBs and part numbers** — v3-d bans invented DTCs but still fabricated `OEM ECU (Part No. 123456)`, which cost it mock-d/mock-g. One sentence defends v3-b's biggest win axis at its remaining weak spot.
3. **v3-a's hard output contract** (exact first characters, no nested numbered lists, end after third bullet) — cheapest formatAdherence merge.
4. **v3-c's verify-and-repair checklist — optional**; as a standalone angle it didn't clear noise.

---

## 5. Cost / latency / length per report (from `outputs/*.json` usage + ms)

**Per-model means over the 36 v3-candidate outputs per model** (like-for-like: same 4 prompts × 9 cases; claude is Appendix A):

| Model | n | mean chars | mean words | mean out tokens | mean in tokens | mean latency | truncated | mean est. cost/report |
|---|---|---|---|---|---|---|---|---|
| gpt-4o | 36 | 7,265 | 1,115 | 1,505 | 2,662 | 19.6 s | 0 | $0.022 |
| gpt-5.4 | 36 | 22,386 | 3,456 | 4,728 | 2,661 | 61.5 s | 0 | $0.078 |
| deepseek-v4-pro | 36 | 19,410 | 3,118 | 6,877 (≈2,496 reasoning) | 2,705 | 7.8 s † | **8** | **$0.010** |

† **deepseek-v4-pro latency is not trustworthy:** 15/36 recorded `ms` values are under 600 ms for 4,600–8,200-token completions (>10k tokens/sec — physically implausible; likely an instrumentation artifact or server-side cache in the bench runner). The 7.8 s mean is what the files say; treat deepseek latency as *unmeasured*, not as fast, until re-benched.

Word-target readout (report spec targets 2,000–2,500 words): gpt-4o **never reaches 2,000** (max 1,457); gpt-5.4 and deepseek-v4-pro **always clear 2,000 when not truncated** but overshoot the band (medians 3,452 / 3,277; ~0–1 of 36 outputs inside 2,000–2,500 for each). No complete-grid model actually sits in the band.

**Per-cell means** (pricing: gpt-4o $2.50/$10.00, gpt-5.4 $2.50/$15.00, deepseek-v4-pro $0.42/$1.25 per 1M in/out — third-party/vendor price points as of 2026-07, verify before budgeting):

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
| v3-a × deepseek-v4-pro | 9 | 2,696 | 6,304 | 1.0 s † | 1 | $0.009 |
| v3-b × deepseek-v4-pro | 9 | 3,612 | 6,583 | 1.2 s † | 1 | $0.010 |
| v3-c × deepseek-v4-pro | 9 | 2,157 | 7,046 | 11.8 s † | 2 | $0.010 |
| v3-d × deepseek-v4-pro | 9 | 2,357 | 7,575 | 17.3 s † | 4 | $0.011 |

**Shipping v3-b on gpt-4o costs ~$0.008 more per report than v2 (+50% relative, trivial absolute) at +6 s latency — for an 18/18 blind-judgment quality win.** The exemplar is the cost: ~2,300 extra input tokens per call. gpt-5.4 reports cost ~3.6× the winner and take ~3× as long. deepseek-v4-pro undercuts even the v2 baseline on cost while producing 3× the words — but 22% of its outputs truncate at the 8,192 cap (reasoning tokens eat the budget), and its latency numbers are unusable.

---

## 6. Rollout recommendation ladder (NOT implemented — plan only)

1. **Now — v3-b on gpt-4o (pure prompt swap).** Env flag `LLM_FRAMEWORK_VERSION` (`v2.0` default, `v3.0-b`) selecting the prompt template in `02-src/backend/services/backend/index.js` `callLLM`; stamp the flag value into the existing `framework_version` column on each `analyses` row (queryable cohorts, attributable rollback). Deploy flag-off; run the e2e-live journey suite with the flag on; promote only when green. Length guard: v3-b averages ~1,563 completion tokens vs v2's ~1,325 (max_tokens 8,192 — ample headroom). Rollback = flip the env var back.
2. **Next — v3-b on gpt-5.4 as the model-upgrade candidate, pending cost check.** Cross-family-confirmed 9-0-0 with the grid's biggest margins (§3b), but ~$0.079/report (~3.2× the v3-b/gpt-4o winner) and ~60 s latency (~3×). Evaluate as a separate flag value with its own e2e gate; ship only if report quality becomes the binding constraint and the unit economics absorb ~3× cost.
3. **Fallback only — deepseek-v4-pro with v3-b, as a cost play.** ~$0.010/report and full-length output, but the cross-family judge is ambivalent on the model overall (§3c: only the v3-b pairing clears, 8-1), 8/36 outputs truncated, and latency is unmeasured. Prerequisites before even a flagged trial: raise/segment the token budget so reasoning can't starve the report, re-bench latency with trustworthy timing, and re-run this bench on the fixed config.

---

## Appendix A — retired claude-sonnet-5 partial cells (excluded from verdict)

The claude-sonnet-5 generation track died mid-run when Anthropic API credits were exhausted; `deepseek-v4-pro` replaced it in the grid. What exists: **14/36 outputs** (v3-a 5/9, v3-b 6/9, v3-c 3/9, v3-d 0/9), **5 of 14 truncated** at the 8,192-token cap (`finish_reason: "length"`: v3-b 2, v3-c 3), judged only on the cases that existed. Numbers, for the record:

| Cell | Judge gpt-5.4: cand / base (margin, W-L-T) | Judge deepseek: cand / base (margin, W-L-T) | Agreement | Cases | Truncated |
|---|---|---|---|---|---|
| v3-b × claude-sonnet-5 | 72.17 / 47.25 (+24.9, 6-0-0) | 90.00 / 45.50 (+44.5, 6-0-0) | 1.00 | 6 of 9 | 2 |
| v3-a × claude-sonnet-5 | 68.50 / 53.60 (+14.9, 4-1-0) | 91.90 / 48.40 (+43.5, 5-0-0) | 0.80 | 5 of 9 | 0 |
| v3-c × claude-sonnet-5 | 59.67 / 50.83 (+8.8, 2-1-0) | 86.50 / 50.33 (+36.2, 3-0-0) | 0.67 | 3 of 9 | 3 |
| v3-d × claude-sonnet-5 | — | — | — | 0 of 9 | — |

Output stats (partial): mean 14,625 chars / 2,290 words / 7,845 completion tokens / 95.2 s / est. $0.132 per report ($3.00/$15.00 per 1M). Notably, it was the only model whose outputs actually centered in the 2,000–2,500-word band (7/14 in band, median 2,315).

**Why excluded:** (a) incomplete corpus — 14/36 cells, with one candidate entirely missing, so cell means are not comparable to the complete grid; (b) 5/14 outputs truncated mid-report — a truncated customer report is a shipping defect regardless of judge score; (c) case selection is not random (the run died in order), so the surviving cases skew the means. Directional read: quality signal was positive (both judges preferred it over baseline on 26/28 judgments) but at ~6× the winner's cost and ~5× its latency, with a 36% truncation rate. If Anthropic credits return, a clean 36-case re-run with a raised token cap would be needed before any claim.

---

## Appendix B — reproduction

- Aggregation is deterministic from `scores/*.jsonl` (dedupe by case, keep last record) + `outputs/*.json`; regenerated 2026-07-02 after the deepseek-v4-pro grid completed. No API calls were made for this regeneration.
- Judges: `node judge.mjs --candidate <cell> --judge {openai|deepseek}` (deepseek-chat added to `lib/common.mjs` MODELS + `judge.mjs` JUDGE_MODELS as the Anthropic-credit-exhaustion fallback).
- Machine-readable summary: `RESULTS.json` alongside this file.
