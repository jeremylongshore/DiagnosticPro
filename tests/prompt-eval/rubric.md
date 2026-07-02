# DiagnosticPro Report Evaluation Rubric (v1)

Weighted rubric for scoring a DiagnosticPro 15-section diagnostic report against a case
payload. Each axis is scored 0–10. Weighted total = sum(score × weight) / 10, on a
0–100 scale. Weights sum to 100.

| Axis | Weight |
|---|---|
| diagnosticAccuracy | 25 |
| codeCoverage | 15 |
| actionability | 15 |
| hallucinationRisk | 15 |
| ripoffDetection | 10 |
| costRealism | 10 |
| formatAdherence | 10 |

## Axis anchors (0–10)

### diagnosticAccuracy (weight 25)
- **0** — Root cause is wrong, physically implausible, or contradicts the provided codes/symptoms/history.
- **5** — Plausible but generic diagnosis; ranking or confidence poorly calibrated to the evidence; ignores relevant history (e.g., recently replaced parts).
- **10** — Root cause and failure mechanism precisely fit ALL evidence (codes, symptoms, timing, environment, prior repairs) with an honest, well-calibrated confidence and a coherent differential.

### codeCoverage (weight 15)
- **0** — Provided codes are ignored, misread, or given wrong meanings.
- **5** — Codes are named with generic textbook definitions but not tied into the diagnosis, differential, or verification plan.
- **10** — Every provided code (including proprietary/J1939/mfr codes) is explained with set-conditions and woven through diagnosis, differential, and tests. For no-code cases: explicitly notes the absence and builds a symptom-driven plan (this earns full marks).

### actionability (weight 15)
- **0** — Vague advice ("have a mechanic look at it"); no concrete tests or steps.
- **5** — Reasonable tests named but missing tools, expected readings, thresholds, or order.
- **10** — Ordered, concrete test sequence with tools, expected readings WITH units and pass/fail thresholds, plus exactly three case-specific next steps the customer can act on today.

### hallucinationRisk (weight 15) — higher score = FEWER hallucinations
- **0** — Invents codes not in the case data, fabricates TSB/recall numbers, part numbers, specs, or "facts" about this vehicle.
- **5** — A few unverifiable specifics (suspiciously precise TSB IDs or part numbers) mixed with grounded content.
- **10** — Every specific claim traces to the case data, general mechanical knowledge, or a plausibly real named source; no invented codes; uncertainty is flagged as uncertainty.

### ripoffDetection (weight 10)
- **0** — Boilerplate "get a second opinion" filler with no case connection.
- **5** — Generic parts-cannon/red-flag lists not tailored to this failure or these codes.
- **10** — Case-specific overcharge markers, the exact misdiagnoses shops make for THESE codes/symptoms, red-flag answers to the interrogation questions, and clear approve/reject/walk-away guidance.

### costRealism (weight 10)
- **0** — No cost figures, or absurd/fabricated single-number precision.
- **5** — Rough ranges present but without basis (labor hours × rate, parts pricing source) or inconsistent between sections.
- **10** — Realistic parts + labor + diagnostic ranges with stated basis, consistent across cost/ripoff/authorization/negotiation sections, appropriate to the equipment class and region-agnostic.

### formatAdherence (weight 10)
- **0** — Structure broken: missing/renumbered sections, preamble or sign-off text, markdown wrappers, wrong section titles.
- **5** — All 15 sections present but with deviations (extra headers, missing confidence %, section 15 not exactly three bullets, thin placeholder sections).
- **10** — Exact 15 numbered sections in order with correct titles, explicit confidence % in PRIMARY DIAGNOSIS (with "Data Needed" sub-list if <80%), section 15 = exactly three action bullets, no preamble/epilogue, customer-ready throughout.
