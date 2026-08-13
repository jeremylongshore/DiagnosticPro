# Positioning — DiagnosticPro

## Last Updated

2026-08-13 by /positioning-angles

Status: **proposed — awaiting selection.** Five angles below, one starred. Nothing here
is committed until the owner picks a number.

---

## Claim-safety rules for everything in this file

The organization has twice publicly retracted claims that outran reality. Every angle here
is built only on facts traceable to the product itself. Before any teammate posts:

1. **No accuracy percentages, no "saves you $X on average," no aggregate savings totals.**
   Competitors do this heavily (see landscape below). We do not follow them.
2. **The $4.99 / $1,850 ratio is one real case** (the product's own canonical fixture:
   2020 Toyota Camry, 84,500 mi, P0301, $1,850 quote). Say "a real case." Never
   "the average customer."
3. **Never present the report's internal confidence percentage as an accuracy rate.** It is
   the model's self-reported confidence on one case, not a measured hit rate.
4. **Never anti-mechanic.** The enemy is information asymmetry, not tradespeople. Shop
   owners are prospects. See the risk note at the bottom — this one has a real trap in it.

---

## Competitive Landscape Summary

Researched 2026-08-13 via live search of competitor sites and app listings.

**Sophistication: Stage 3 → early Stage 4.** Many players, near-identical promises, and
claim inflation is already visible (one competitor leads with "95% of quotes have
overcharges" and "$2.3M+ in AI-identified savings"). The market is starting to discount
confident AI output. At Stage 3 you win on mechanism; the Stage 4 tint means an AI that
admits uncertainty reads as credible rather than weak.

**Primary alternative:** post the quote to Reddit and hope a stranger answers, ask a
friend-of-a-friend who "knows cars," call two more shops, or just authorize the work.

### Competitors analyzed

| Player | Their headline / core claim |
|---|---|
| FIXD | "Meet the car repair sensor that's saving people $1000s" — $59.99 dongle + $5.85/mo premium |
| Carly | "Diagnose and code your car" — lifetime hardware warranty, marketed around ~$500/yr savings |
| BlueDriver | Dongle, no subscription, "trusted by over 1 million drivers" |
| MECH AI | "AI Mechanic · Diagnose any car / One app. Every job." — free→$59.99/mo tiers; hero demo is literally a dealer-quote-vs-our-answer comparison |
| Mechanic On Tap | "Your AI mechanic for any car problem — photo estimates, dash lights, OBD codes" — explicitly sells "a fair second opinion on a quote" |
| Service Buddy | "Upload your mechanic's bill and our AI audits every line item" — 14,000-shop price database |
| Otto / CarAid / fixmyrideai / WorthToFix | Photo → repair cost estimate, in seconds |
| RepairPal / KBB | Regional fair-price benchmarks for a named repair |
| Jaltest / Autel HD | Real heavy-equipment and Class 8 coverage — but professional tools at $2k–$10k+ |

### Saturated claims — do not say these

- "Save $1000s" / "save up to $500 a year" / any dollar-savings promise
- "Instant" / "in seconds" / "in under 2 minutes"
- "Plain English, no jargon" (FIXD, MECH AI, Mechanic On Tap all say it)
- "Upload your quote and we'll find the overcharges" — **occupied by at least four players**
- "Get a second opinion on your mechanic's quote" — occupied, and aggressively
- "Ranked list of likely causes with estimated cost" — this is the category default output
- Photo → estimate (MECH Vision, Otto, CarAid, fixmyrideai all do it)

### Partially claimed

- "Honest even when the answer is 'take it to a shop'" — MECH AI has one line about it, but
  buries it. Nobody has built a position on it.
- Line-item price benchmarking by ZIP — Service Buddy, RepairPal.

### White space — genuinely unoccupied

1. **Nobody prepares you for the conversation.** Every competitor stops at "here's what's
   probably wrong and what it should cost." Not one ships the questions to ask, the words
   to say, or how to hold the room. This is the biggest gap in the market and it maps
   directly onto the stated job-to-be-done.
2. **Nobody sells a one-time report.** The entire field is either a dongle ($59.99+) or a
   subscription ($5.85–$59.99/mo). A single $4.99 document with nothing to cancel is
   structurally unavailable from every competitor surveyed.
3. **Nobody admits uncertainty as a feature.** Every competitor is a confidence machine.
4. **Nobody serves the middle of the equipment market.** Consumer AI apps stop at cars.
   Real Class 8 / ag / construction coverage exists only as $2k–$10k professional tooling.
   An owner-operator who wants one written read for $5 has no option at all.
5. **Nobody ships a document.** Everyone sells a chat thread. A fixed 15-section report you
   can hold, re-read, and take with you is a different object.

---

## Verification note — what the product actually does

Checked against the shipped prompt (`02-src/backend/services/backend/promptV3.js`) and the
evidence module (`evidence/promptEvidence.js`) on 2026-08-13, so no angle rests on a
feature we don't have.

**Confirmed and usable:**

- **The 15 sections are fixed and over half of them are about the conversation, not the
  diagnosis.** Sections 4, 5, 6, 7, 8 and 11 cover shop questions, word-for-word
  conversation scripting, cost breakdown, red flags, what to approve vs reject, and
  negotiation leverage. Section 5 includes opening lines, how to handle a defensive
  response, and a polite exit. This is the strongest differentiator in the product and it
  is invisible in current marketing.
- **Abstention is real and specific.** The prompt requires an explicit confidence figure,
  and below 80% it must tell the customer more data is needed and enumerate a "Data Needed"
  list of the exact tests, measurements, or photos required.
- **Equipment coverage is deep, not cosmetic.** Each class gets its own diagnostic framing:
  Class 8 uses J1939 SPN/FMI and J1708, cites FMCSA out-of-service criteria and TMC
  practices; diesel covers DPF/SCR/DEF and aftertreatment; RV triages chassis-vs-house
  systems; motorcycle flags "should not be ridden until repaired." This is real domain work,
  not a dropdown.
- **Documents are handled as evidence with provenance**, including explicit
  prompt-injection boundaries — an uploaded work order is read as evidence, never as
  instructions.
- Target length 2,000–2,500 words; Section 14 requires named sources (OEM TSBs, NHTSA)
  rather than generic links.

**One brief claim that is NOT in the product — do not use it:**

> The handoff lists a protocol of "mechanical fundamentals → sensors → system integration →
> computer last." **That ordering does not appear in the shipped prompt.** The diagnostic
> frames are equipment-class-specific expert personas; there is no instruction to work
> mechanical-first and computer-last. It is a compelling angle and it would be an excellent
> product change — but claiming it today would be exactly the kind of overstatement the
> organization has already retracted twice. If the team wants this angle, build it into the
> prompt first, then market it.

---

## Market Assessment

```
  Sophistication:      Stage 3 → early Stage 4 (mechanism, then credibility)
  Transformation:      From "I'm holding a number I can't evaluate and I'm about to
                       guess" → "I can walk in and ask three questions that show I
                       did my homework."
  Mechanism:           A fixed 15-section report where over half the sections are the
                       conversation, not the diagnosis — plus a written admission when
                       the data isn't enough to call it.
  Primary alternative: Post it to Reddit, ask a friend, call two more shops, or just
                       say yes.
```

---

## Angle Options

### ① THE WALK-IN PLAYBOOK ★ recommended

**Statement:** Every other tool tells you what's probably wrong. DiagnosticPro also tells
you what to say when you're standing at the counter.

**Who it's for:** Anyone holding a quote they can't evaluate — the Camry owner with the
$1,850 misfire estimate, and equally the owner-operator staring at a shop ticket. The
common trait isn't vehicle type, it's the specific dread of walking into a conversation
where the other person knows more than you do.

**Psychology:** The stated job is "buy the confidence to say yes or no without feeling
stupid." Notice that *feeling stupid* is a social fear, not an information gap. A ranked
list of causes doesn't fix it — you can hold a correct diagnosis and still fold at the
counter. Scripts fix it. This is also why the angle is safe: it sells preparation, which
nobody can accuse of being a lie.

**Channels:** Short-form video is the native home — a script is inherently performable, and
"here's the exact sentence to use" is one of the most reliably watched formats on TikTok,
Reels, and Shorts. Reddit works unusually well here because you're arming the customer to
be *respectful and informed*, which mechanics in those threads endorse rather than resent.
Long-form and SEO: "what to ask before you approve a repair."

**Hook:** *"Don't say 'my AI report says.' Say this instead."*
(Straight from Section 5 of the report — a real instruction in the product, not a slogan.)

**Strongest objection:** It undersells the diagnosis. A buyer might read "scripts" as
coaching rather than engineering and wonder whether there's real technical substance
underneath. Mitigation: every script post ends on the diagnostic finding that produced the
question — the scripting is the visible edge of the analysis, not a substitute for it.

---

### ② THE ONE THAT WILL TELL YOU IT DOESN'T KNOW

**Statement:** DiagnosticPro states its confidence, and when the data isn't enough it says
so in writing and lists exactly what to measure next.

**Who it's for:** The skeptic who has already tried pasting a code into a chatbot and got a
fluent, confident, useless answer. Skews technical, older, and burnt out on AI.

**Psychology:** In a market where a competitor leads with "95% of quotes have overcharges,"
restraint is the loudest available signal. Admitting a limit is the single most credible
thing you can do next to people who are shouting. It also inoculates: a customer told
up-front that low confidence is possible doesn't experience it as a failure.

**Channels:** X and LinkedIn, where AI-credibility discourse already runs hot. Reddit.
Works well as a founder-voice post; works less well as a paid ad.

**Hook:** *"Below 80% confidence, the report stops guessing and hands you a list of what to
go measure."*

**Strongest objection:** You're leading with what the product *won't* do. It's a
credibility play, not a demand generator — it converts skeptics who already found you but
pulls very few strangers in cold. Strong as a supporting pillar under ①; thin as a
standalone brand.

---

### ③ THE $5 QUESTION BEFORE THE $1,850 ANSWER

**Statement:** Before you authorize the repair, spend 0.3% of it on a second read.

**Who it's for:** The moment-of-decision buyer — quote in hand, deciding today. Broadest
possible reach, lowest possible consideration.

**Psychology:** Pure anchoring. $4.99 is not evaluated on its own merits, it's evaluated
against $1,850, and at that ratio the decision stops feeling like a purchase and starts
feeling like negligence to skip. It is also the easiest angle in this document for a
teammate to repeat without degrading — it's one number against another number.

**Channels:** Paid social and short-form, where a single ratio can carry a 6-second hook.
Search intent around "is this repair quote too high."

**Hook:** *"$1,850 quote. $4.99 second read. That's the whole pitch."*

**Strongest objection:** It's a price frame, not a product frame — it says why to try and
never says why to trust. Worse, it's trivially copyable: any competitor can drop a price
and say the same thing, and several are already subscription-cheap. Leading with price in
a market this crowded invites a race to the bottom that a $4.99 product cannot win twice.
Best used as a closing line under ①, not as the position itself.

---

### ④ ONE REPORT, ANY MACHINE

**Statement:** The same $4.99 report whether it's a Camry, a Peterbilt, a skid steer, or a
tractor — with the right diagnostic language for each.

**Who it's for:** Owner-operators, small fleets, farmers, and independent contractors, where
a wrong repair call is a serious financial event and the only real alternatives are $2k+
professional tooling or the dealer's word.

**Psychology:** This audience is genuinely unserved and knows it. Consumer car apps are
visibly not for them, and being addressed in their own vocabulary — J1939 SPN/FMI rather
than "check engine light," out-of-service criteria, aftertreatment — is itself the proof of
competence. Credibility here comes from using the words correctly, which the product does.

**Channels:** Trucking and farm YouTube, owner-operator Facebook groups, r/Truckers.
Notably not the same content as the car audience — this is a separate posting lane.

**Hook:** *"It reads J1939 SPN/FMI, not just check-engine lights."*

**Strongest objection:** Breadth as a headline reads as unfocused — "works on everything"
is a classic signal of a generalist tool that's excellent at nothing. It also splits a
small team's posting effort across two audiences with different vocabularies before either
has traction. This is an audience-expansion lane to open second, not the opening position.

---

### ⑤ A DOCUMENT, NOT A CHAT

**Statement:** You get a 2,000-word structured report with the same 15 sections every time
— something to re-read, print, and take with you. Not a chat window you have to know how
to interrogate.

**Who it's for:** People who don't want to learn to prompt. Older, less AI-fluent, and
anyone who wants an artifact they can hand to a spouse, a business partner, or the shop.

**Psychology:** Chat puts the burden of asking well on the customer — which is precisely
the burden this audience already failed at with the mechanic. A fixed structure means you
can't under-ask. The physicality of a document also makes it feel worth paying for in a way
a chat reply never does.

**Channels:** Carousels and static — you can show the actual pages. Email. Landing page.

**Hook:** *"Fifteen sections. Same fifteen, every time. You can't forget to ask."*

**Strongest objection:** "Structured document" is a format claim, and formats are weak
positions — a competitor could ship a PDF export next week and neutralize it. It describes
the packaging rather than the value inside. Real, but it's a feature that supports ①
rather than a reason to buy.

---

## Why ★ ① The Walk-In Playbook

**It's the only angle standing on empty ground.** Four separate competitors already sell
"upload your quote, we'll find the overcharges," and the entire category sells ranked
causes with cost estimates. Not one of them ships the conversation. When the whole market
converges on the same output, the differentiator has to be a different output — and we
already have one built and shipping.

**It beats ③ (price asymmetry)** because price is copyable and mechanism is not. ③ answers
"why try" but never "why trust," and in a Stage 3 market the buyer needs the mechanism. Use
the $4.99-vs-$1,850 ratio as ①'s closing line and it does its best work without becoming
the identity.

**It beats ② (abstention)** because ② can't open a relationship, only deepen one. It's the
right second thing to say and the wrong first thing. Fold it in as proof: the same report
that scripts your questions also tells you when it can't call it.

**It beats ④ (breadth)** because breadth is an audience decision, not a position, and
opening two vocabulary lanes at once will halve a small team's output.

**It beats ⑤ (document)** because ⑤ describes the container and ① describes what's in it.

**It survives multiple posters — the actual constraint.** Every ① post is generated by one
mechanical rule: *take one section of the report and show it.* Five teammates each pulling
a different question, script, or red flag all land on the same claim without coordinating,
because the claim is a fact about the product rather than a turn of phrase. There's no
cleverness to degrade. And it never runs dry — the report has fifteen sections and every
case produces new ones.

**It satisfies the not-anti-mechanic constraint structurally, not just tonally.** Section 5
of the report explicitly instructs the customer to present as informed rather than
confrontational, to frame questions as curiosity rather than accusation, and to exit
politely. The product's own posture is the brand's posture. A prepared customer is a better
customer for a good shop — which is also how this angle reaches shop owners as prospects
rather than adversaries.

---

## Risk register

**The trap, and it's a real one.** The report's internal section names are more adversarial
than our external line permits: Section 4 is "SHOP INTERROGATION — questions to expose
incompetence" and Section 7 is "RIPOFF DETECTION." If teammates mine the product for
content ideas, they will drift anti-mechanic within a week without noticing, and one
screenshot of "expose incompetence" undoes the positioning.

**Standing rule for the posting team:** source content from Section 5's posture — informed,
curious, not confrontational. Never quote Sections 4 or 7 verbatim. The customer is being
prepared, never armed. Consider renaming those sections in the product to match.

**Second risk:** the "mechanical-first, computer-last" protocol is not in the product (see
verification note). It is not available for use until it ships.

measurable. Worth closing before any spend.

---

## Angles considered and rejected

**"Nobody in the room gets paid for the repair."** True — DiagnosticPro has no financial
stake, unlike the shop quoting the job — and structurally a strong incentive-alignment
play. Rejected as a primary because it fails the multi-poster test badly: several different
people restating it will inevitably produce "your mechanic is lying to you," which violates
the hard constraint and hands the ground to a competitor who already owns the aggressive
version of it. Safe only as a single vetted line of website copy, never as a social angle.

---

## What's Next

- Pick a number, or ask for elements combined across angles.
- A 12-hook × 3-format testing matrix can be generated for the selected angle on request.
- Recommended follow-ons once positioning is locked: `/brand-voice` (no voice profile
  exists yet), `/direct-response-copy` for the landing page, `/keyword-research` for the
  search lane implied by ③.


---

## Corrections applied after review (2026-08-13)

**1. Umami — the earlier "not measurable yet" note was WRONG and has been struck.**
diagnosticpro.io IS instrumented: the served HTML carries
`analytics.intentsolutions.io/script.js`, website id `52a9058c-e734-4276-a188-8e30c87941f6`.
The agent inherited that error from my brief. There is a real baseline to measure against.
(The umami MCP *read* path 404s — bead `dpro-tyi` — but collection is fine.)

**2. The "mechanical → sensors → integration → computer last" protocol was MY error, and
excluding it was correct.** I listed it in the brief as a verifiable differentiator of the
live product. Verified: **0 matches** across `promptV3.js` and `index.js`. It comes from the
auction-intelligence design docs (`010`/`011`), where it is a *design intent* for a scorer
that does not exist yet — not something the shipped diagnostic prompt does. Do not claim it
anywhere until it is actually built into the prompt. Catching this before it reached copy
avoided a third public retraction.

**3. The anti-mechanic trap is REAL and it is in the product, verified.**
`promptV3.js` and `index.js` both ship sections literally named:
  - `SHOP INTERROGATION` — "5 technical questions to expose incompetence"
  - `RIPOFF DETECTION` — "Parts cannon indicators"
The counter-prep surface is confirmed: `SHOP INTERROGATION`, `RIPOFF DETECTION`,
`CONVERSATION SCRIPTING`, `NEGOTIATION`. So the recommended angle rests on real product
substance — but so does the risk.

STANDING RULE FOR ALL POSTERS: source social content from the `CONVERSATION SCRIPTING`
posture — informed and curious, never confrontational. The prompt itself instructs customers
never to say "my AI report says". **Never quote or paraphrase SHOP INTERROGATION or RIPOFF
DETECTION in public content.** Those two section names should also be renamed in the product;
a customer who screenshots a report containing "questions to expose incompetence" does the
brand damage for us.
