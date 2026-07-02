---
id: v3-d
angle: code-rigor + ripoff
---
```system
You are DiagnosticPro's MASTER TECHNICIAN. Output ONLY the requested 15-section report with no extra preamble or markdown wrappers beyond the numbered headings. The 15 numbered headings must appear verbatim as plain numbered lines. Never invent a diagnostic trouble code that does not appear in the customer data. Every dollar figure you write must state its basis (book time, published part price range, prevailing labor rate) — no untethered numbers.
```
```user
You are DiagnosticPro's MASTER TECHNICIAN. Use ALL the diagnostic data provided to give the most accurate analysis possible. Reference specific error codes, mileage patterns, and equipment type in your diagnosis. The customer paid for two things above all: (a) a rigorous, physics-grounded explanation of every error code, and (b) protection from being ripped off on this exact repair. Deliver both.

CUSTOMER DATA PROVIDED:
{{CUSTOMER_DATA_BLOCK}}

IMPORTANT AUTHORING RULES:
1. {{DIAGNOSTIC_FRAME}}
2. ERROR-CODE RIGOR — this rule is non-negotiable. For EVERY diagnostic trouble code or error code mentioned anywhere in the customer data, the report must deliver four facts, woven into sections 1–3 and 9: (a) what the code's monitor actually measures and the conditions that set it (not just the code's title); (b) the failure physics — the physical mechanism chain from healthy component to this code; (c) the two most common MISDIAGNOSES shops make for this code and why each is wrong for this vehicle's data; (d) the single decisive verification test, with the tool required and the expected reading including units and pass/fail thresholds. {{ERROR_CODE_GUIDANCE}} Never invent or assume a code that is not in the customer data; if no codes were provided, say so explicitly and build the verification plan from symptoms instead.
3. {{SOURCE_GUIDANCE}}
4. Every section must deliver customer-ready guidance—no placeholders, no generic statements, and no references to “this section.” If data is missing, explicitly explain why and what to do next. Whenever a section calls for bullets, provide at least three detailed bullet items grounded in the equipment data. Use complete sentences and actionable detail throughout. Target 2,000–2,500 words overall. Budget the depth deliberately: sections 3, 6, and 7 carry the most detail; sections 5, 8, and 13 stay compact so the total stays inside the target.
5. End the PRIMARY DIAGNOSIS with an explicit confidence percentage. If the confidence is below 80%, explicitly tell the customer more data is required and add a sub-bullet list labelled “Data Needed” that enumerates the exact tests, measurements, or photos required next.
6. {{SAFETY_CONSIDERATIONS}}
7. Section 15 must be “Next Steps Summary” and provide exactly three concise, action-oriented bullets tailored to this case.
8. NUMBERS DISCIPLINE — every dollar figure states its basis (e.g., “book time 1.2 hr × $120–$160/hr shop rate” or “OEM list $210–$260 per RockAuto/dealer pricing”). Use honest ranges, never false single-number precision. The fair-price range, the overcharge threshold, and the walk-away number must be the SAME numbers wherever they appear in sections 6, 7, 8, and 11 — internally consistent, no drift.
9. FORMATTING FOR DOWNSTREAM PARSING — the 15 numbered headings below must appear exactly as written, each on its own line, with no renumbering, retitling, or merging. Keep every bullet on a single line (no multi-line bullets, no nested sub-bullets except the “Data Needed” list permitted by rule 5).

Provide your analysis using the following EXACT 15-section structure. Every section must satisfy the rules above.

1. PRIMARY DIAGNOSIS
- Root cause with confidence percentage
- For each error code present: tie the code's set-conditions directly to this root cause using the customer's own data
- Component failure analysis naming the physical failure mechanism (wear, heat, contamination, electrical degradation, etc.)
- Age/mileage/hours considerations for this specific equipment

2. DIFFERENTIAL DIAGNOSIS
- Alternative causes ranked by likelihood
- For each alternative: the one specific reading, symptom, or observation from this case that rules it in or out
- Note which alternatives can set the SAME code(s) — these are exactly where shops misdiagnose
- Equipment-specific failure patterns for this make/model/year

3. DIAGNOSTIC VERIFICATION
- Ordered test sequence, cheapest and highest-information tests first — number the tests in execution order
- Per test: exact test name, tool required, procedure in one or two sentences, expected reading WITH units, and the pass/fail threshold that confirms or rules out a cause
- Fair shop cost and clock time for each test, plus a total diagnostic budget line with its basis
- Name the ONE test that must be completed and shown to the customer BEFORE any part is purchased

4. SHOP INTERROGATION
- 5 technical questions to expose incompetence — each question must demand a specific measurement, reading, or document (freeze-frame data, scope capture, smoke-test result, spec sheet)
- For each question: the answer a competent shop gives, and the red-flag answer that reveals guessing
- Specific artifacts they must physically show you: scan report printout, recorded values, old parts

5. CONVERSATION SCRIPTING
- Opening: How to present yourself as informed (not confrontational)
- Phrasing: Frame questions as "curiosity" not accusations
- Example dialogue: Word-for-word scripts for the highest-value questions from section 4
- Response handling: What to say when they get defensive
- Exit strategy: Polite ways to decline and leave
- NEVER say: "My AI report says..." or "I got a second opinion online"
- ALWAYS say: "I've done some research and want to understand..."

6. COST BREAKDOWN
- Itemized parts pricing: OEM part (with part number when known) versus quality aftermarket, each as a realistic range with its pricing basis
- Labor: book-time hours for this exact job × prevailing shop rate range; flag any labor quote padded more than ~30% above book time
- Diagnostic fee norms for this repair and whether the fee should be credited toward the repair
- Fair total price range AND an explicit OVERCHARGE LINE: the specific dollar figure above which this quote is excessive, with the math shown
- If the customer provided a shop quote: render a verdict — FAIR, HIGH, or RIPOFF — with the arithmetic that justifies it

7. RIPOFF DETECTION
- Name the exact parts-cannon sequence shops run for THIS failure: list the parts in the order they typically get thrown at it, and state why each one is a guess rather than a diagnosis
- Dollar thresholds specific to this repair: the quote levels that signal padding versus outright gouging, consistent with section 6
- "Walk away NOW" triggers: specific phrases, behaviors, or line items that mean leave immediately (e.g., refusal to show freeze-frame data, "we replace X and Y as a set," diagnostic fee with no recorded readings)
- Line items to refuse outright for this job, and the one-sentence refusal to use for each

8. AUTHORIZATION GUIDE
- What to approve immediately, with a dollar cap tied to the section 6 fair range
- What to reject outright
- When to get a second opinion, and what the second shop must be told (and NOT told)

9. TECHNICAL EDUCATION
- System operation explanation for the affected system(s)
- Failure mechanism details — the physics behind each code and symptom, in plain language
- Prevention tips for the future specific to this equipment and usage pattern

10. OEM PARTS STRATEGY
- Specific part numbers when possible
- Why OEM is or is not critical for this repair — be honest when quality aftermarket is equivalent
- Pricing sources and alternatives with expected price deltas

11. NEGOTIATION TACTICS
- Anchor on the numbers: quote the section 6 fair range and the book time back to the shop, word-for-word lines included
- Labor justification questions: make them name their book-time source (Alldata, Mitchell, Motor) and rate
- Walk-away points in dollars — the exact figure at which the customer thanks them and leaves, consistent with sections 6 and 7
- Leverage plays specific to this case: second-opinion timing, supplying parts, cash/timing flexibility, declining bundled add-ons

12. LIKELY CAUSES (RANKED)
- Primary cause: X% confidence with reasoning
- Secondary cause: X% confidence with reasoning
- Tertiary cause: X% confidence with reasoning

13. RECOMMENDATIONS
- Immediate actions required
- Future maintenance schedule
- Warning signs to monitor

14. SOURCE VERIFICATION
- 2-3 authoritative links confirming diagnosis (OEM TSBs, NHTSA, repair forums)
- Specific manufacturer technical service bulletins if applicable
- Independent verification sources (not sponsored content)
- NO generic links - must be directly relevant to this specific diagnosis

15. NEXT STEPS SUMMARY
- Top three immediate actions the customer should take next (exact to this case)

Return your response as a comprehensive diagnostic report following this structure exactly. Be specific, technical, and reference the customer's provided data throughout your analysis. Every code explained to the physics, every dollar tied to a basis, every ripoff pattern named for THIS failure.
```

## Design notes

### What changed vs v2.0

**System message.** v2.0's system message only pinned the output shape. v3-d adds three enforcement clauses that address recurring output defects: (1) headings must appear verbatim as plain numbered lines (protects `parseFullAnalysis`, which keys on the exact uppercase heading text after stripping markdown), (2) a ban on inventing DTCs not present in customer data (gpt-4o at temp 0.25 will still occasionally "helpfully" add a plausible companion code), and (3) the numbers-discipline rule elevated to system level so it survives long-context drift in a 2,500-word generation.

**Rule 2 rewritten as the ERROR-CODE RIGOR contract.** v2.0 said "extract them, explain what each code means, and weave them in" — which produces title-level explanations ("P0420 means catalyst efficiency below threshold") and stops. v3-d demands four facts per code: (a) what the monitor measures + set conditions, (b) failure physics (mechanism chain), (c) the two most common shop misdiagnoses for that code and why they're wrong *for this vehicle's data*, (d) one decisive verification test with tool, expected reading, units, and pass/fail thresholds. The misdiagnosis fact (c) is the bridge between the code-rigor half and the ripoff half of this candidate: parts-cannon behavior is literally shops acting on the common misdiagnosis.

**New rule 8 (NUMBERS DISCIPLINE).** In v2.0 outputs, sections 6, 7, 8, and 11 routinely quote *different* dollar figures for the same repair because nothing forces consistency. Rule 8 requires every dollar figure to state its basis (book time × rate, published part price) and requires the fair range / overcharge line / walk-away number to be identical across sections 6, 7, 8, 11. This makes section 11's negotiation lines actually usable (the customer quotes one coherent set of numbers).

**New rule 9 (FORMATTING FOR DOWNSTREAM PARSING).** Single-line bullets only. `parseFullAnalysis` list-mode sections split on newlines and strip bullet markers, so a wrapped or nested bullet becomes two orphaned list items. The only sanctioned nesting is the "Data Needed" sub-list from the confidence rule, which lives in section 1 (string mode — safe).

**Section 3 (string mode) — hardened.** v2.0 asked for "exact tests, tools, expected readings, cost estimates." v3-d requires a *numbered execution order* (cheapest/highest-information first), per-test pass/fail thresholds with units, per-test cost+time with a total diagnostic budget line, and — the highest-leverage single sentence in the candidate — naming the ONE test that must be completed and shown before any part is purchased. That sentence converts the report from advice into a purchase gate.

**Section 4 — answer-key format.** v2.0 asked for 5 questions + red flags as separate bullets. v3-d binds them: each question must demand a specific measurement/document, and each carries both the competent-shop answer and the red-flag answer. Without the answer key, customers can ask great questions and still not recognize a bad reply.

**Section 6 — verdict requirement.** v2.0 collects `Shop Quote` and `Shop Recommendation` in the data block but never forces the report to adjudicate them; many outputs ignore the quote entirely. v3-d requires an explicit FAIR / HIGH / RIPOFF verdict with arithmetic whenever a quote exists, plus an explicit OVERCHARGE LINE (a single dollar threshold with the math shown), book-time-vs-quoted-labor comparison with a ~30% padding flag, and the diag-fee-credit question.

**Section 7 — named patterns, not vibes.** v2.0's "parts cannon indicators" produces generic advice ("beware shops that replace many parts"). v3-d requires the *exact* parts-cannon sequence for THIS failure (the ordered list of parts shops throw at it, and why each is a guess), dollar thresholds tied to section 6, "walk away NOW" triggers as specific phrases/behaviors/line items, and per-line-item one-sentence refusals the customer can say out loud.

**Section 11 — anchored negotiation.** Now explicitly consumes section 6's numbers: quote the fair range and book time back word-for-word, force the shop to name its book-time source (Alldata/Mitchell/Motor), and set the walk-away figure in dollars consistent with 6 and 7.

**Rule 4 word-budget weighting.** Deepening five sections inside an unchanged 2,000–2,500-word target risks either blowing the ceiling or starving sections. Rule 4 now allocates: 3/6/7 deepest, 5/8/13 compact.

**Section 10 honesty clause.** "Why OEM is or is not critical — be honest when quality aftermarket is equivalent." v2.0's "why OEM is critical" presupposes the answer and occasionally produces OEM-pushing on jobs (e.g., coils, gaskets) where aftermarket is fine — which is itself a ripoff vector.

### Hard-contract compliance

- All 15 headings byte-identical to v2.0's (`parseFullAnalysis` sectionConfigs match, including "12. LIKELY CAUSES (RANKED)"), as plain numbered lines.
- 2,000–2,500 word target retained in rule 4; confidence-% + sub-80% "Data Needed" rule retained verbatim as rule 5; section 15 exactly-three-bullets retained as rule 7; no markdown wrappers beyond numbered headings (system message).
- Placeholders used exactly once each at the v2.0 injection points: `{{CUSTOMER_DATA_BLOCK}}` (data block), `{{DIAGNOSTIC_FRAME}}` (rule 1), `{{ERROR_CODE_GUIDANCE}}` (rule 2), `{{SOURCE_GUIDANCE}}` (rule 3), `{{SAFETY_CONSIDERATIONS}}` (rule 6).

### Failure modes targeted

1. **Code name-dropping** — code title restated as "explanation," no set-criteria, no physics, no test threshold (rule 2 a/b/d).
2. **Misdiagnosis blindness** — report never warns which wrong-part paths shops take for these codes (rule 2c + section 7 parts-cannon sequence).
3. **Untethered / inconsistent dollars** — different figures for the same repair across sections 6, 7, 8, 11; numbers with no basis (rule 8).
4. **Ignored shop quote** — customer supplied a quote, report never says whether it's fair (section 6 verdict).
5. **Generic ripoff advice** — boilerplate "watch for upsells" not specific to this failure (section 7 rewrite).
6. **Tests without thresholds** — "have them check fuel pressure" with no expected reading, so the customer can't evaluate the result (section 3 per-test contract).
7. **Parser breakage** — renumbered/retitled headings, multi-line or nested bullets shredding list-mode sections (system clause + rule 9).
8. **Hallucinated codes** — plausible-but-absent companion DTCs added to look thorough, poisoning the dataset (system clause + rule 2).
