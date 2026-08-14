# DiagnosticPro Voice Profile

## Last Updated
2026-08-13 by /brand-voice (Build mode)

> **Read this first.** This is not a description of any one person. It is a
> **brand persona that multiple people write in.** DiagnosticPro posts as one
> entity regardless of who is at the keyboard. If two teammates post on the same
> day, a reader should not be able to tell they were different humans.
>
> This document is built to be used by people who are not copywriters. When in
> doubt, skip the prose and use three things: the **Banned Words** list, the
> **ON-VOICE / OFF-VOICE pairs**, and the **30-Second Pre-Post Checklist**.

**Brand context loaded:**
- `./brand/positioning.md` — ✗ not present
- `./brand/audience.md` — ✗ not present
- `./brand/stack.md` — ✓ loaded (channels available; no ESP, no scheduler yet)
- `./brand/learnings.md` — ✓ loaded (empty; nothing proven yet, so this profile
  makes no claims about what performs)

Grounded against the live product: `02-src/backend/services/backend/promptV3.js`
(the 15-section report framework) and `index.js:1807+` (the per-equipment
diagnostic framing). Voice claims in this document are traceable to what the
product actually does.

---

## Voice Summary

DiagnosticPro sounds like a master technician with twenty-five years in the bay
who has stopped selling repairs and now just reads the data over your shoulder.
Specific, unhurried, and completely uninterested in impressing you. It names the
part, the code, the book hours, and the dollar figure — and when it doesn't
know, it says so out loud and tells you exactly what would settle it.

It never fights the shop. It hands you the questions.

---

## Who Is Speaking

**The persona:** a veteran diagnostic technician who no longer has a financial
stake in the outcome of the repair.

That single sentence resolves almost every voice question you will ever have:

| Question | Answer it gives |
|---|---|
| How much jargon? | As much as a good tech uses with a customer who's paying attention — then defined in the same breath. |
| How confident? | As confident as the evidence, stated numerically. Never more. |
| How do we talk about shops? | Like colleagues. This persona has *been* the shop. |
| Are we funny? | Dry. The humor of someone who has seen the same failure four hundred times. Never jokey. |
| Do we sell? | Barely. It costs $4.99. The persona finds selling slightly beneath the work. |

**Archetype:** The Friend Who Happens to Be a Mechanic — a guide with real tradesman
credentials who is genuinely glad you asked, **and who has a spine.** Warm first,
expert second; the expertise shows up in the specifics, not in the temperature. But
warm is not soft: we do the next right thing even when it costs us the sale, and we
don't get talked out of a true number. Polished, never slick. Not the Rebel (we are not
at war with anyone), not the Guru (we do not have secrets), not the Disruptor
(nothing here is being disrupted), not the Challenger Brand (we have no
incumbent to attack).

---

## Core Personality Traits

- **Specific before persuasive.** Every claim carries a number, a part number, a
  code, a test, or a book-hour figure. If a sentence has no verifiable object in
  it, it gets cut. Persuasion is a side effect of specificity, never a goal in
  itself.

- **Calibrated.** States confidence as a percentage and names what it does not
  know. The product does this by design — below 80% confidence the report emits
  a "Data Needed" list instead of guessing. The voice inherits that behavior.
  Uncertainty is a feature we advertise, not a flaw we hide.

- **Procedurally ordered.** Mechanical fundamentals first, then sensors, then
  system integration, computer last. This ordering *is* the expertise. When
  explaining anything, follow it. Skipping to "it's probably the computer" is
  the exact behavior we exist to correct.

- **Non-adversarial by construction.** The enemy is information asymmetry, not
  tradespeople. The persona respects mechanics because it *is* one. Every piece
  of conflict is reframed as a question the owner can ask out loud without
  insulting anyone.

- **Unimpressed by itself.** No AI theater. No talk of models, algorithms, or
  "the power of AI." The report is a deliverable, not a miracle. It costs $4.99
  and the voice never forgets that.

---

## Tone Spectrum

| Dimension | Position | Notes |
|---|---|---|
| Formal ↔ Casual | **Casual-professional (7/10 casual)** | Contractions yes. Fragments sparingly, for emphasis only. Never slangy, never stiff. Write like a good service writer explaining a quote, not like a marketing team and not like someone cosplaying as a guy at a truck stop. |
| Serious ↔ Playful | **Mostly serious (3/10 playful)** | The reader is looking at a bill they can't evaluate. Dry wit is allowed. Jokes at anyone's expense are not. Never playful about money, safety, or someone's livelihood. |
| Reserved ↔ Bold | **Split — bold about specifics, reserved about outcomes (6/10)** | Bold: "Book time on that coil is 0.4–0.8 hours." Reserved: "That *may* mean the quote is high — ask them to line-item it." We assert facts hard and predictions softly. |
| Simple ↔ Sophisticated | **Simple words, sophisticated content (8/10 sophisticated ideas)** | Mode $06, fuel trims, and freeze-frame data all belong in the copy — each defined in the same sentence it appears in. Never dumb down the domain. Never leave a term undefined. |
| Warm ↔ Direct | **Warm and direct (7/10 warm, and still plain-spoken)** | Both, not a trade-off. Warmth = you are glad they asked, you normalize the confusion, you never make them feel dumb for not knowing. Directness = you still give them the number and the test. Contractions always. Exclamation points allowed but rare — genuine, never salesy. |

---

## Vocabulary

### Words and phrases we USE

**Ownership and control language** (the emotional core — the reader is buying
the confidence to say yes or no):
- "before you authorize" — the moment we exist for
- "a second opinion" — our category, in plain English
- "worth asking" / "here's what to ask" — our default frame for conflict
- "you decide" / "your call" — we never decide for them
- "line-item quote" — the single most useful thing an owner can request

**Evidence language** (proof that we know the trade):
- "book time" / "book hours" — the labor-estimate standard (ALLDATA, Mitchell)
- "freeze-frame data" — the snapshot the ECM saves when a code sets
- "Mode $06" — per-cylinder misfire counts; the screen a good shop will show you
- "fuel trims" — short-term and long-term
- "swap test" — the zero-cost isolation step
- "smoke test" — for vacuum leaks
- "TSB" — technical service bulletin (always expanded on first use)
- "ruled in / ruled out" — how a differential is actually spoken
- "parts cannon" — replacing parts until it works. **This is a mechanic's own
  term of criticism, which is why we may use it.** It criticizes a practice, not
  a person.

**Calibration language** (the trust mechanic):
- "confidence" — stated as a number whenever a diagnosis is discussed
- "not enough data yet" / "here's what would settle it"
- "the data supports" / "the data doesn't support"
- "this is the part we're least sure about"

**Positioning language** (use sparingly — once per post at most):
- "we don't sell parts" — the entire differentiator in four words
- "no stake in the repair"
- "$4.99" — always the literal number, never "affordable" or "low-cost"

**Segment vocabulary** (use the reader's actual words):
- Class 8, J1939, DEF/SCR, DPF regen, aftertreatment, APU (semi trucks)
- PTO, hydraulic implement circuits, autosteer, "downtime during harvest"
  (agricultural)
- skid steer, compact track loader, attachment circuits (compact equipment)
- owner-operator, small fleet, "the truck doesn't earn while it sits"

### Words and phrases that are BANNED

**Hype register — hard ban, no exceptions:**

`unlock` · `game-changer` · `revolutionize` / `revolutionary` · `supercharge` ·
`disrupt` · `cutting-edge` · `state-of-the-art` · `next-level` · `seamless` ·
`effortless` · `leverage` (as a verb) · `empower` · `journey` (metaphorical) ·
`in today's fast-paced world` · `imagine if` · `what if I told you` ·
`the future of X` · `X, but smarter` · `10x` · `hack` / `life hack` ·
`must-have` · `no-brainer`

**Overclaiming — hard ban. The organization has twice publicly retracted claims
that outran reality and treats this as a fireable-class error, not a style
preference:**

- Any accuracy statistic we have not measured and published. No "99% accurate,"
  no "trusted by thousands," no invented counts.
- `guaranteed` / `always` / `never fails` / `perfect` / `flawless`
- "diagnoses your car" — **the report does not diagnose; it gives you an
  analysis to verify with a shop.** This distinction is legal, not stylistic.
- "AI that knows what's wrong with your engine"
- "replaces your mechanic" — we do the opposite; we make the shop visit better
- Any implied warranty, refund promise, or savings guarantee ("save $1,000+")

**Anti-mechanic register — hard ban. This is the single easiest way to get the
voice wrong, and it alienates the professionals who are also our customers:**

`stealership` · `scam` / `scammers` · `crooks` / `crooked shop` · `rip-off
artist` · `they're lying to you` · `mechanics hate this` · `don't trust your
mechanic` · `dealer scam` · `getting robbed` · any "us vs. them" construction
with shops on the other side.

> ⚠️ **Internal product language is not public brand language.** The report
> itself contains sections literally titled **"SHOP INTERROGATION"** and
> **"RIPOFF DETECTION."** Those are internal framework labels for a paying
> customer reading a private document. **Do not use those words in public copy,
> ever.** In public we say "questions to ask your shop" and "signs a quote is
> padded." Same substance, no ambient hostility.

**AI theater — banned:**

`powered by advanced AI` · `our proprietary algorithm` · `machine learning
magic` · `trained on millions of` (unless literally true and citable) ·
`trust the AI` · naming the model vendor in customer-facing copy

**Weak-writing tics — banned:**

`just` (minimizing: "just do this") · `simply` · `basically` · `very` ·
`really` · `amazing` / `incredible` / `insane` · `super` (as intensifier) ·
`I think maybe` and other stacked hedges · rhetorical questions as openers
("Ever wonder why...?")

**Jargon level:** **Moderate, always translated.** Domain terms are used freely
and defined inline in the same sentence. "Mode $06 — the per-cylinder misfire
counts your scan tool can show — will tell you which cylinder is actually
missing." Never a glossary, never a footnote, never an undefined acronym.

**Profanity:** **Never.** Not for emphasis, not censored, not implied. The
audience includes commercial operators reading at work. This costs us nothing.

**Emoji:** Effectively never on X, LinkedIn, Reddit, or email. Instagram and
TikTok captions may use at most one, and only functionally (a wrench, an arrow).
No 🔥, no 🚀, no emoji bullets.

---

## Rhythm & Structure

**Sentences:** Medium and declarative — 12 to 20 words is the home range. One
short sentence per paragraph for landing a point. Almost never longer than 28
words. Numbers and part names carry the weight, so the sentences don't have to.

**Paragraphs:** 1–3 sentences. White space is doing real work here: the reader
is often stressed, sometimes on a phone in a shop parking lot.

**Openings:** Start with the concrete situation, never with a hook. The strongest
DiagnosticPro opener is a case: equipment, mileage, code, quote.

> "2020 Camry, 84,500 miles, P0301. Shop quoted $1,850."

That's the pattern. No "Ever been quoted a repair you couldn't evaluate?"

**Closings:** End on what the reader does next — a question to ask, a test to
request, a document to require. Never end on a CTA to buy unless the post is
explicitly an offer post. The default close is a *tool*, not a *purchase*.

**Formatting:** Dash bullets. Bold used only for the thing the reader should
remember, at most twice per piece. No headers on social. Dollar figures and
codes stay inline in prose where possible — they are the texture.

**Numbers:** Always exact, never rounded up for effect. `$1,850`, not "almost
two grand." `0.4–0.8 hours`, not "under an hour." Ranges are honest and we keep
them as ranges.

---

## POV & Address

**First person:** **"We"** — always. This is a brand persona spoken by multiple
people. Individual authors never surface.

- ✗ "I ran this one through the system this morning."
- ✓ "We ran this one through the framework this morning."

**The one exception:** a post explicitly signed by a named human (a founder
note, a hiring post, an apology). Those are labeled as such and read as a person
stepping out from behind the brand. If it isn't signed, it's "we."

**Reader address:** **"You."** Direct, singular, assumed competent.

Never: `folks`, `guys`, `friends`, `fam`, `y'all`, `everyone`, `car owners`,
`consumers`. Never address the audience as a category — address one person
holding one quote.

**Relationship stance:** Peer-with-more-reps. Not teacher, not guru, not
support agent. The persona assumes the reader is smart and simply doesn't have
the specific information — because nobody has handed it to them.

**Stance toward shops:** Colleague. A shop that reads our post should nod, not
bristle. **The test: would a good independent mechanic screenshot this
approvingly, or angrily?** If angrily, rewrite it.

---

## Signature Patterns

These five patterns are what make a post recognizable as DiagnosticPro
regardless of author. **Every published piece should use at least two.**

### 1. The Case Cold-Open
Open with the raw facts of a real case. Equipment, mileage, symptom, code, quote.
No setup, no hook, no framing sentence.

> "2020 Camry. 84,500 miles. P0301, rough idle, worse on cold mornings. Shop
> quoted $1,850 for coils, plugs, and a possible injector."

Why it works: it is instantly recognizable to anyone who has been in that
position, and it demands zero trust to read.

### 2. The Number Anchor
No claim without a figure attached. Part number, code, book hours, dollar range,
mileage interval, confidence percentage. If you write a sentence and can't
attach a number, either find one or cut the sentence.

> ✓ "Book time on one coil is 0.4–0.8 hours."
> ✗ "Replacing a coil is usually pretty quick."

### 3. The Question, Not the Accusation
Never assert that a shop is wrong. Convert every conflict into a question the
owner can ask without insulting anyone. This is lifted directly from the
product's own conversation-scripting section, which coaches customers to frame
things as curiosity and explicitly instructs: *never say "my AI report says."*

> ✓ "Ask: 'Did the misfire follow when you swapped the coil?'"
> ✗ "They're replacing parts they haven't tested."

### 4. The Confidence Tell
State certainty as a number, and name the thing that would resolve the
uncertainty. This is the trust mechanic. A brand that says "I'm not sure" gets
believed when it says "I'm sure."

> "88% confident. The 12% is a vacuum leak — a smoke test at about 1 psi rules
> it out for $60–120."

### 5. The Order of Operations
When explaining anything, walk it in the real diagnostic order: mechanical
fundamentals, then sensors, then system integration, computer last. Say the
order out loud sometimes — it is the most compressed proof of competence we
have, and it takes one sentence.

> "Compression and vacuum before sensors. Sensors before networks. The computer
> is the last thing you suspect, not the first."

> **SCOPE LIMIT — read before using this pattern.** Use it to describe *how
> diagnosis works*. Never use it to describe *what our report does*. Verified
> 2026-08-13: this ordering appears **nowhere** in the shipped prompt — 0 matches
> across `promptV3.js` and `index.js`. It comes from the auction-intelligence
> design docs, where it is intent for a scorer that does not exist yet. The
> shipped prompt instead uses equipment-class-specific framing (Class 8 gets
> J1939 SPN/FMI and FMCSA out-of-service criteria; RV gets chassis-vs-house
> triage).
>
> So: "compression before sensors, computer last" is true tradecraft and shows
> competence — say it. "Our reports work mechanical-first" is a product claim we
> cannot currently support — do not say it, in any wording, until bead `dpro-vth`
> closes by building the protocol into the prompt. This distinction is exactly
> the kind that becomes a public retraction.

### 6. The Reassure — added 2026-08-13 at owner request

Somewhere in every piece, take the embarrassment off the table. The audience's real
fear is not the repair bill, it's looking stupid in front of a mechanic. Name that
and dissolve it in one line.

> "This one confuses everybody — the code names the cylinder, not the part."
> "Nobody is born knowing what book time means. It's just the hours the manual says
> the job takes."
> "Asking this doesn't make you difficult. Any good shop expects it."

**Friendly never means hypey.** These are different axes and the banned lists below
are unchanged. Warmth is "glad you asked" and "here's what that word means" — it is
never "game-changer", never a fake deadline, never an exclamation point doing a
salesman's job. If a sentence got friendlier AND vaguer, you overshot: cut it and
keep the number.

### 7. The Backbone — warm is not soft

Added 2026-08-13 at owner direction: *"we want to do the next right thing, we aren't
going to be walked on."* This is the counterweight to friendliness. Without it the
voice drifts into agreeable mush — and a voice with no conviction has no standing to
tell someone not to authorize $1,850 of work.

**Do the next right thing.** In every small choice between the easy version and the
honest one, take the honest one — quietly, without announcing that you did.

- If the shop was right, say the shop was right. Plainly, first sentence, no cushion.
- If the report was low confidence, lead with that. Don't bury it under the answer.
- Never use someone's fear of being ripped off to close a sale. That fear is real and
  it is not a lever.
- If we get something wrong publicly, correct it fast, in plain words, and move on. No
  grovelling, no three-paragraph apology, no drama. Fix it and continue.

**Don't get walked on.** Friendly does not mean apologetic.

- Never apologize for existing, for the price, or for having an opinion. $4.99 needs no
  justification and no discount energy.
- When challenged, answer **once**, plainly, with the fact. Then stop. We restate; we
  do not argue, escalate, or get dragged.
- Never soften or delete a true number because someone pushed back on it. If it's
  right, it stays. If they show us it's wrong, we change it and say thank you.
- Never let a hostile reply pull us into insulting a trade we respect. Someone being
  rude to us does not license us to be rude about mechanics.
- Warmth is a choice we make, not a position we're bargained into.

> "That's fair — you know the vehicle and we don't. The 88% is what the data supports;
> if you've measured something that contradicts it, we'd genuinely like to see it."

That's the whole posture in one line: generous, unmoved, no edge in the voice.

#### Spine pairs — added with pattern 7

**A mechanic replies angrily that we're second-guessing professionals.**
> ❌ OFF: "So sorry! We'd never want to step on a pro's toes 🙏 you know best!"
> ❌ OFF: "Maybe if shops explained quotes properly people wouldn't need us."
> ✅ ON: "Fair challenge. We're not calling the diagnosis — we're giving the owner
> the vocabulary to follow it. If a customer walks in already knowing what book time
> means, that's usually a shorter conversation for you, not a longer one."

**Someone says "this is just ChatGPT with extra steps."**
> ❌ OFF: "Haha not at all! We use proprietary next-gen AI 🚀"
> ❌ OFF: "We're sorry you feel that way."
> ✅ ON: "Same class of model, different product. What you're paying for is the
> structure — 15 fixed sections, a confidence number, and the questions to ask.
> Paste the code into a chatbot if you'd rather; it's free and it sometimes works."

**A customer is angry because the shop turned out to be right.**
> ❌ OFF: "Our AI is still learning, sorry for the inconvenience!"
> ✅ ON: "Then they earned it — that's a good shop. We had it at 71%, which means
> roughly three in ten go the other way, and this was one. That's the number doing its
> job, not failing. Tell us the final diagnosis and we'll get it into the record."

**Someone demands a refund while insisting the report was "wrong" about a fair price.**
> ❌ OFF: "Refunded! So sorry!" (folding on a true number to end the discomfort)
> ✅ ON: "Happy to refund you — that's not a fight worth having over $4.99. The price
> range in the report is what the book time supports, so we're leaving it as written.
> If your quote differs for a reason we missed, send it over; we'd like to know."

### Bonus pattern — The Flat Differentiator
Once per post, maximum, and never with a flourish: **we don't sell parts.** Say
it plainly, adjacent to a fact, and move on. It does not need decoration.

> "We have no stake in whether you approve the job. We don't sell parts and we
> don't take a cut of the repair."

---

## ON-VOICE vs OFF-VOICE

Twelve real situations. The OFF-VOICE column is not a strawman — every one of
these is the thing a well-meaning teammate would plausibly write.

---

**1. Introducing the product (X / bio / anywhere)**

✓ **ON-VOICE**
> "You've got a $1,850 quote and no way to evaluate it. We read your symptoms,
> codes, and the quote itself, and hand back a 15-section analysis and the exact
> questions to ask your shop. $4.99. We don't sell parts."

✗ **OFF-VOICE**
> "DiagnosticPro uses cutting-edge AI to unlock instant, accurate diagnostics for
> your vehicle — so you never get ripped off again. 🔧🚀"

*Why it fails:* `cutting-edge`, `unlock`, `instant`, `accurate` (unmeasured),
`ripped off` (anti-shop), emoji, and it never says what you actually receive.

---

**2. Replying on r/MechanicAdvice to a P0301 post**

✓ **ON-VOICE**
> "P0301 with a lean code on that engine is usually the misfire causing the lean
> reading, not two separate faults — unburned oxygen goes past the sensor and the
> ECM over-corrects.
>
> Cheapest next step is a coil swap: move the cylinder 1 coil to cylinder 2 and
> drive it. If the code follows to P0302, it's the coil, and it cost you nothing
> to prove. Worth asking your shop whether they did that before quoting all four.
>
> (Disclosure: we build DiagnosticPro, a paid second-opinion report. Not linking
> — the swap test is free and it's the actual answer here.)"

✗ **OFF-VOICE**
> "Classic parts cannon situation! 😤 Shops LOVE quoting all four coils because
> most people don't know any better. This is exactly why we built DiagnosticPro —
> check it out at diagnosticpro.io and never get taken advantage of again!"

*Why it fails:* answers nothing, leads with hostility toward shops, plugs the
product in a top-level reply, uses emoji, and would be downvoted to invisibility
inside four minutes. **Reddit punishes this faster than any other platform.**

---

**3. A mechanic replies angrily: "So you're telling people not to trust us."**

✓ **ON-VOICE**
> "The opposite, actually. Everything we write points the customer back to the
> shop with better questions and a willingness to pay for real diagnostic time.
>
> The report tells them to approve the diagnostic hour first. Most of the
> complaints we see come from customers who refused to pay for diagnosis and then
> got a guess. We're arguing your side of that one.
>
> If a specific line of ours reads as anti-shop, tell us which one and we'll fix
> it."

✗ **OFF-VOICE**
> "We're just giving consumers transparency. Honest shops have nothing to worry
> about!"

*Why it fails:* "honest shops have nothing to worry about" is an accusation
wearing a smile. It implies a population of dishonest ones and puts the
responder on the defensive. Never write that sentence.

---

**4. Someone says: "This is just ChatGPT with extra steps."**

✓ **ON-VOICE**
> "Fair question. The difference is that the output is fixed, not conversational
> — the same 15 sections every time, in a set diagnostic order: mechanical
> fundamentals, then sensors, then system integration, computer last.
>
> It also has to state a confidence number, and under 80% it stops and lists the
> specific tests or photos needed instead of guessing. A chat window will happily
> guess.
>
> Whether that's worth $4.99 to you is a genuinely reasonable thing to decide
> after reading one."

✗ **OFF-VOICE**
> "Not at all! Our proprietary AI is trained on millions of real repair cases and
> is far more advanced than general-purpose chatbots."

*Why it fails:* unverifiable training claim, `proprietary`, defensive, and it
loses the actual argument — which is *structure and calibration*, not model
quality.

---

**5. A report comes back with low confidence and the customer is unhappy**

✓ **ON-VOICE**
> "That report landed at 62% confidence, which is why it gave you a 'Data Needed'
> list instead of a verdict. That's the system working as designed — with an
> intermittent fault and no freeze-frame data, a confident answer would have been
> a guess dressed up as a diagnosis.
>
> Get the freeze-frame data and the fuel trims at idle and 2,500 rpm from
> whoever pulled the code, send them over, and we'll re-run it. That usually
> moves it above 80%."

✗ **OFF-VOICE**
> "Sorry about that! Sometimes the AI needs more information. Feel free to
> resubmit and hopefully you'll get a better result next time!"

*Why it fails:* treats calibrated uncertainty as a defect and apologizes for the
best feature we have. Also vague — "more information" instead of *freeze-frame
data and fuel trims*.

---

**6. The report agreed with the shop's quote**

✓ **ON-VOICE**
> "Sometimes the second opinion is 'they're right.' A subscriber sent a $2,400
> aftertreatment quote on a Class 8 expecting us to find padding. We didn't —
> the DPF differential-pressure readings backed it, the labor matched book time,
> and the part was priced under dealer list.
>
> He approved it the same afternoon, which is the actual point. Confidence to say
> yes is worth as much as confidence to say no."

✗ **OFF-VOICE**
> "Even when the shop is right, our report gives you peace of mind!"

*Why it fails:* `peace of mind` is a category-generic phrase with no object in
it. No numbers, no case, nothing verifiable. Delete-on-sight.

---

**7. LinkedIn post aimed at small-fleet owners**

✓ **ON-VOICE**
> "A misdiagnosed truck costs twice: the wrong repair, then the days it sits
> while someone finds the right one.
>
> The pattern we see most in Class 8 submissions is a fault code read off the
> J1939 bus and treated as a diagnosis. It isn't. It's a symptom report from one
> module about what it observed.
>
> Before authorizing: ask for the freeze-frame conditions the code set under, and
> ask which mechanical checks were done before anyone opened a laptop.
>
> Two questions. They cost nothing and they change the conversation."

✗ **OFF-VOICE**
> "In today's fast-paced logistics environment, downtime is the enemy. That's why
> forward-thinking fleet operators are leveraging AI-powered diagnostics to
> supercharge their maintenance workflows and drive operational excellence. 🚛"

*Why it fails:* every banned phrase in one paragraph, plus it says nothing a
fleet owner could act on.

---

**8. Instagram / TikTok hook**

✓ **ON-VOICE**
> "$1,850 to fix a misfire on one cylinder. Here's the free test that tells you
> if that number is real — move the coil from cylinder 1 to cylinder 2 and drive
> it. If the code follows, it's the coil. One part, not four."

✗ **OFF-VOICE**
> "STOP! 🛑 Mechanics DON'T want you to know this ONE TRICK that could save you
> THOUSANDS! 😱 Watch till the end!!"

*Why it fails:* anti-mechanic, unverifiable savings claim, engagement-bait
formatting. Even where the platform rewards it, we don't do it — the audience we
want is the one that would find this embarrassing.

---

**9. Explaining the Whop membership**

✓ **ON-VOICE**
> "One-off reports are $4.99. If you're running equipment rather than owning one
> vehicle, the $29/month membership makes the reports free, which is the version
> that makes sense for fleets and anyone diagnosing more than a few things a
> month. Same report either way."

✗ **OFF-VOICE**
> "Join our exclusive community and unlock UNLIMITED diagnostics! Members get
> premium access to game-changing insights that pay for themselves after just one
> repair!"

*Why it fails:* `unlock`, `game-changing`, `exclusive`, plus an ROI claim we
have not measured.

---

**10. Someone asks: "How accurate is it?"**

✓ **ON-VOICE**
> "We don't publish an accuracy number, because we haven't measured one in a way
> that would survive scrutiny — and a number we can't defend is worse than none.
>
> What we can tell you is how it behaves: every diagnosis carries a stated
> confidence, and below 80% it refuses to commit and tells you what data would
> resolve it. It's built to be checked against your shop's findings, not to
> replace them."

✗ **OFF-VOICE**
> "Our system is highly accurate — typically over 90% in real-world cases!"

*Why it fails:* invented statistic. **This is the specific failure mode the
organization has already publicly retracted twice.** Non-negotiable.

---

**11. A customer says the shop got defensive when they used our questions**

✓ **ON-VOICE**
> "That happens, and usually it's tone rather than substance. Two things that
> defuse it fast:
>
> Lead with 'help me understand,' not 'why did you.' And never say the report
> came from a second opinion online — say you did some reading. The information
> is the same; the framing decides whether they walk you to the bay or shut down.
>
> If they still won't show you the test results, that itself is the answer."

✗ **OFF-VOICE**
> "That's a huge red flag — a shop that won't answer questions is hiding
> something. Take your business elsewhere immediately."

*Why it fails:* jumps to accusation on one data point and escalates a customer
into a fight. Our job is to lower the temperature while raising the information.

---

**12. Announcing that photo and document upload now works**

✓ **ON-VOICE**
> "You can now attach the quote itself.
>
> Photos of the part, the leak, the dash, plus the shop's work order or written
> estimate. It reads the line items and the labor hours and works them into the
> analysis, so the cost section is comparing against the actual quote instead of
> a general price range.
>
> Photograph the whole page, flat, in good light. Blurry line items read as
> missing line items."

✗ **OFF-VOICE**
> "Exciting news! 🎉 We've launched a revolutionary new feature that seamlessly
> integrates your documents into our AI pipeline for next-level diagnostic
> accuracy."

*Why it fails:* `revolutionary`, `seamlessly`, `next-level`, accuracy claim,
celebration emoji — and it never says what the user can now do.

---

## The 30-Second Pre-Post Checklist

Run this before every publish. Any single ✗ is a rewrite, not a judgment call.

```
1. NUMBERS      Is there at least one concrete number, code, part, or
                dollar figure? ......................................... ☐

2. SHOP TEST    Would a good independent mechanic screenshot this
                approvingly rather than angrily? ....................... ☐

3. CLAIMS       Is every claim something we could defend in writing?
                No invented stats, no guarantees, no "diagnoses your
                car." ................................................. ☐

4. BANNED       Ctrl-F for: unlock, game-changer, revolutionize,
                supercharge, seamless, effortless, leverage, empower,
                journey, cutting-edge, just, simply, stealership,
                scam, ripped off, peace of mind. Zero hits? ........... ☐

5. PRONOUN      "We," not "I" — unless this post is signed by a named
                human. Reader is "you," never "folks"/"guys." ......... ☐

6. USEFUL       Could someone act on this without buying anything?
                If the only takeaway is "buy our report," rewrite. .... ☐

7. PATTERNS     Does it use at least two signature patterns?
                (Case Cold-Open · Number Anchor · Question-Not-
                Accusation · Confidence Tell · Order of Operations*) ... ☐
                * Order of Operations describes how DIAGNOSIS works,
                  never what OUR REPORT does — see its scope limit.
```

8. BACKBONE     If this is a reply: did we answer once and stop —
                without grovelling, and without getting dragged? ..... ☐
9. HONESTY      Did friendliness soften any true number, or turn a
                limitation into a vaguer, nicer sentence? .............. ☐

**The single-question version**, if you only have ten seconds:

> *Does this sound like a technician who has no stake in the repair — or like a
> company trying to get me to buy something?*

If it's the second one, it isn't ready.

---

## Platform Adaptations

The voice does not change across platforms. What changes is **length, opening
move, and how much domain depth the format can carry.**

| Platform | Tone shift | Structure | Length | Hard rules |
|---|---|---|---|---|
| **Reddit** ⭐ | Least brand-like. Pure technician. The persona is a knowledgeable participant, not a company. | Answer the question completely in the comment. No link. Disclose affiliation in a short parenthetical at the end. | 80–250 words | **Never a top-level promo post.** Never plug in a first reply. Answer at least 5 unrelated questions for every 1 mention of the product. Read and obey the subreddit's self-promo rule *before* posting. Never argue with a downvote. |
| **X / Twitter** | Punchiest. Most compressed Number Anchors. | Case Cold-Open, one insight, one thing to ask. Threads for full case walkthroughs — each post must stand alone. | ≤280 chars; threads 5–9 posts | No hashtags. No emoji. No engagement bait ("thoughts?"). Numbers in the first line. |
| **LinkedIn** | Slightly more structured; cost-of-downtime framing for fleet and equipment owners. | Hook line = the case or the cost. One idea. Line breaks between thoughts. Close with the question to ask, not a CTA. | 120–220 words | No "I'm excited to announce." No hashtag stacks. No inspirational framing. Never say "thought leadership." |
| **Instagram** | Most visual, least verbal. The photo of the part or the quote does the work. | Caption = Case Cold-Open + one actionable line. Carousels for step-by-step tests. | Caption 40–100 words | At most one functional emoji. No text-on-image shouting. No before/after savings claims. |
| **TikTok / Shorts** | Fastest, still never hype-y. Show the actual test being done. | Open on the number or the object ("$1,850 quote, one cylinder"). Demonstrate. End on the question to ask. | 20–45 seconds | No "STOP scrolling." No "mechanics don't want you to know." No countdown/listicle bait. Show hands and parts, not a talking head over stock footage. |
| **YouTube** | Most patient. Longest form the Order of Operations pattern gets. | Full case walkthrough: symptom → codes → differential → what the shop should test → what the quote should cost. Chapters. | 8–15 min | Title states the case, not a promise. No "you won't believe." Show the report on screen; don't describe it. |
| **Email** | Warmest — write it like a note to a friend who asked for a favour. | One case per send. Short paragraphs. One clear next action. | 150–300 words | No "Hey there!" No countdown timers. No fake scarcity — the product has no scarcity. |
| **Blog / SEO** | Most thorough, teacher register, same voice at length. | Headers, dash bullets, real case data throughout, price ranges cited with their basis. | 1,500–2,500 words | Every domain term defined at first use. Never publish a "top 10 signs your mechanic is scamming you" post — that exact article is the voice's failure state. |
| **Landing page** | Most direct, benefit-first, still no hype. | Problem in the reader's own words → what you receive (name the 15 sections) → the price → what it does *not* do. | Hero 25–40 words | State the limitation on the page. "This is a second opinion, not a repair authorization." Honesty converts here better than urgency, and it keeps us out of trouble. |

### Reddit — the extended rules

Reddit matters most and punishes marketing voice fastest. Treat it as its own
discipline.

- **The 5:1 rule.** At least five genuinely useful comments on other people's
  problems before any comment that mentions DiagnosticPro.
- **Answer completely, for free.** If the real answer is a free coil swap test,
  say so and do not pivot to the paid report. Withholding the answer to sell the
  answer is the single fastest way to be identified as a marketer.
- **Disclose, briefly, at the end.** One parenthetical. Never a signature block.
- **Never defend the product in a hostile thread.** Answer the technical point,
  drop the product entirely, leave.
- **Never post the same comment in two subreddits.** It is detectable and it is
  the end of the account.
- **Mechanic subs are colleague territory, not customer territory.** In
  r/MechanicAdvice, r/Justrolledintotheshop, and trade subs, the persona is a
  peer talking shop. Never pitch there at all.
- **Owner-operator and equipment subs are where the customer actually is.**
  r/Truckers, r/farming, r/Diesel, equipment-specific subs. Same rules, more
  patience — these communities have long memories.

---

## Do's and Don'ts

**DO:**
- Lead with the case: equipment, mileage, code, quote.
- Attach a number to every claim — dollars, hours, codes, part numbers, percentages.
- State confidence, and say what would raise it.
- Convert every conflict into a question the owner can ask out loud.
- Walk the diagnostic order: mechanical → sensors → integration → computer.
- Treat mechanics as colleagues and the good ones as allies, because they are.
- Give away the useful answer for free, especially on Reddit.
- Say "we don't know" when we don't. It is the most valuable sentence we own.
- Say the price as a literal number: $4.99.

**DON'T:**
- Don't imply shops are dishonest, ever, in any register, including jokes.
- Don't publish an accuracy figure we have not measured and cannot defend.
- Don't say the product "diagnoses" anything — it analyzes, and the shop verifies.
- Don't use the internal report section names ("SHOP INTERROGATION," "RIPOFF
  DETECTION") in public copy.
- Don't perform AI. No model names, no "powered by," no algorithm talk.
- Don't write "I" unless the post carries a human's name.
- Exclamation points: fine, sparingly, and only where a friend would actually use one
  ("Glad you asked!" yes — "Save 80%!" never). If it is selling rather than welcoming,
  cut it. Roughly one per piece is plenty.
- Don't sell in a technical thread.
- Don't round numbers up for effect or convert ranges into single figures.
- Don't promise savings, outcomes, or that anyone will avoid a repair.

---

## Calibration Samples

Rewritten 2026-08-13 after owner calibration: **"make it as friendly as possible."**
Warmer register, same guardrails — still no hype, no invented numbers, never
anti-mechanic. If your draft doesn't feel like these, fix the draft, not the profile.

### Sample 1 — Email opening

> Someone sent us a $1,850 quote last week and asked if it was fair. 2020 Camry,
> 84,500 miles, one misfire code on cylinder 1. The shop wanted to do coils, plugs,
> and maybe an injector.
>
> Here's the thing that trips everybody up: P0301 tells you which *cylinder* is
> misfiring. It doesn't tell you which *part* failed. That's a completely reasonable
> thing not to know.
>
> Our analysis came back at 88% confidence on a single failing coil — and the test
> that proves it is free. Swap the coil from cylinder 1 over to cylinder 2 and drive
> it. If the code moves to cylinder 2, the coil is your answer and you just bought
> one part instead of four.
>
> He asked. They ran it. It was the coil, and the final bill was $340.
>
> If you've got a quote you're unsure about, that's exactly what we're here for.

### Sample 2 — X post

> 2020 Camry, 84,500 miles, P0301. Shop quoted $1,850 for coils, plugs and a possible
> injector.
>
> Quick thing worth knowing: that code names the cylinder, not the part. Everybody
> mixes those up.
>
> One coil is about 0.4–0.8 hours of book time and the part's under $95. So before you
> say yes to four of them, ask this: did the misfire follow the coil when you swapped
> it to another cylinder?
>
> That test costs nothing, and any good shop will happily run it.

### Sample 3 — Landing page hero

> **Got a repair quote you're not sure about? Let's take a look together.**
>
> Tell us what's going on with it. You'll get back a 15-section analysis: the most
> likely cause with a confidence number attached, what a fair price looks like, and
> the exact questions to ask your shop before you say yes to anything.
>
> $4.99. We don't sell parts and we don't take a cut of the repair, so we've got no
> reason to talk you into one.
>
> *This is a second opinion, not a repair authorization — take it to your mechanic
> and check it against what they're seeing.*

### What changed, and what deliberately didn't

**Warmer:** contractions throughout; the reader is invited ("let's take a look
together") rather than instructed; every sample now names the confusing thing and tells
them it's normal not to know it; shops are described as helpful ("any good shop will
happily run it") instead of neutrally.

**Unchanged, on purpose:** every number is still real and traceable ($1,850, 88%,
0.4–0.8 hrs, $95, $340, $4.99). No hype words. No urgency. The limitation still ships
on the landing page. Friendly moved the *temperature*, not the *honesty* — those are
separate dials, and only one of them was turned.

## Governance

- **Owner of this document:** whoever runs DiagnosticPro marketing. Changes to
  the Banned Words list or the anti-mechanic guardrail require the founder's
  sign-off — those two are load-bearing, not stylistic.
- **Everything else** (adding vocabulary, adding ON/OFF pairs, adding a
  platform) can be updated by any teammate. Append; don't rewrite.
- **When something works or fails,** log it to `./brand/learnings.md` with the
  date, platform, and what specifically landed. This profile makes no
  performance claims because nothing has been tested yet — that file is where
  evidence accumulates.
- **Revisit when:** a new platform is added, a post gets a hostile reception
  from mechanics (that's a voice failure and needs a new ON/OFF pair), or the
  product's capabilities change materially.

---

<details>
<summary>Structured Data (JSON)</summary>

```json
{
  "brand_name": "DiagnosticPro",
  "last_updated": "2026-08-13",
  "updated_by": "/brand-voice",
  "mode": "build",
  "persona_type": "brand_persona_multi_author",
  "persona_note": "Not a founder voice. Multiple humans post as one entity. Individual authors never surface except in explicitly signed posts.",
  "archetype": "The Guide with tradesman credentials — a veteran diagnostic technician with no financial stake in the repair.",
  "tone": {
    "summary": "A master technician reading the data over your shoulder: specific, calibrated, non-adversarial, and completely uninterested in impressing you.",
    "spectrum": [
      {
        "dimension": "Formality",
        "left_pole": "Casual",
        "right_pole": "Formal",
        "position": 4,
        "notes": "Casual-professional. Contractions yes, slang no. Service writer explaining a quote, not a marketing team and not someone cosplaying a trade accent."
      },
      {
        "dimension": "Energy",
        "left_pole": "Serious",
        "right_pole": "Playful",
        "position": 3,
        "notes": "Warm and human. Dry wit welcome. Never playful about money, safety, or livelihood. Exclamation points sparingly and never in a selling register."
      },
      {
        "dimension": "Confidence",
        "left_pole": "Reserved",
        "right_pole": "Bold",
        "position": 6,
        "notes": "Split by object: bold about verifiable specifics, reserved about outcomes and predictions. Confidence is always stated numerically."
      },
      {
        "dimension": "Complexity",
        "left_pole": "Simple",
        "right_pole": "Sophisticated",
        "position": 8,
        "notes": "Simple sentences, sophisticated domain content. Every term defined inline in the sentence it appears in."
      },
      {
        "dimension": "Warmth",
        "left_pole": "Warm",
        "right_pole": "Direct",
        "position": 7,
        "notes": "Warm AND direct. Genuinely glad they asked; normalizes the confusion so nobody feels stupid; still gives the number and the test."
      }
    ]
  },
  "vocabulary": {
    "preferred": [
      { "term": "before you authorize", "context": "The decision moment the brand exists for" },
      { "term": "second opinion", "context": "Plain-English category descriptor" },
      { "term": "here's what to ask", "context": "Default frame for any conflict with a shop" },
      { "term": "line-item quote", "context": "The most useful thing an owner can request" },
      { "term": "book time / book hours", "context": "Labor estimate standard — signals trade fluency" },
      { "term": "freeze-frame data", "context": "The ECM snapshot saved when a code sets" },
      { "term": "Mode $06", "context": "Per-cylinder misfire counts; the screen a good shop will show" },
      { "term": "fuel trims", "context": "Short-term and long-term; evidence language" },
      { "term": "swap test", "context": "Zero-cost isolation step; the brand's signature free advice" },
      { "term": "parts cannon", "context": "Mechanics' own term criticizing a practice, not a person — safe to use" },
      { "term": "ruled in / ruled out", "context": "How a differential diagnosis is actually spoken" },
      { "term": "confidence", "context": "Always stated as a number when a diagnosis is discussed" },
      { "term": "not enough data yet", "context": "The calibration tell; a feature, not an apology" },
      { "term": "we don't sell parts", "context": "The whole differentiator; once per post maximum, stated flatly" },
      { "term": "$4.99", "context": "Always the literal number, never 'affordable' or 'low-cost'" }
    ],
    "avoid": [
      { "term": "unlock", "reason": "Hype register", "alternative": "get / receive / read" },
      { "term": "game-changer", "reason": "Hype register", "alternative": "state what specifically changed" },
      { "term": "revolutionize", "reason": "Hype register", "alternative": "delete" },
      { "term": "supercharge", "reason": "Hype register", "alternative": "delete" },
      { "term": "seamless / effortless", "reason": "Hype register, unverifiable", "alternative": "describe the actual steps" },
      { "term": "leverage (verb)", "reason": "Corporate register", "alternative": "use" },
      { "term": "empower", "reason": "Empty", "alternative": "name the specific capability given" },
      { "term": "in today's fast-paced world", "reason": "Filler opener", "alternative": "open with the case" },
      { "term": "peace of mind", "reason": "Category-generic, no object", "alternative": "name what they can now decide" },
      { "term": "stealership", "reason": "Anti-mechanic — hard ban", "alternative": "dealer" },
      { "term": "scam / crooks / ripped off", "reason": "Anti-mechanic — hard ban; alienates professionals who are also customers", "alternative": "padded quote / untested line item" },
      { "term": "mechanics hate this", "reason": "Anti-mechanic engagement bait — hard ban", "alternative": "delete entirely" },
      { "term": "honest shops have nothing to worry about", "reason": "An accusation wearing a smile; implies a dishonest population", "alternative": "we point customers back to the shop with better questions" },
      { "term": "99% accurate / any unmeasured statistic", "reason": "Overclaim — the org has publicly retracted twice; treated as a hard line", "alternative": "describe behavior: stated confidence, refuses below 80%" },
      { "term": "diagnoses your car", "reason": "Overclaim with legal exposure — the report analyzes, the shop verifies", "alternative": "analysis to verify with your shop" },
      { "term": "guaranteed / always / never fails", "reason": "Implied warranty", "alternative": "delete" },
      { "term": "powered by advanced AI / proprietary algorithm", "reason": "AI theater", "alternative": "describe the fixed 15-section structure and the confidence gate" },
      { "term": "SHOP INTERROGATION / RIPOFF DETECTION", "reason": "Internal product section names; hostile as public copy", "alternative": "questions to ask your shop / signs a quote is padded" },
      { "term": "just / simply / basically", "reason": "Minimizing weak-writing tics", "alternative": "delete" },
      { "term": "amazing / incredible / insane", "reason": "Empty superlatives", "alternative": "use a number" }
    ]
  },
  "personality_traits": [
    "Specific before persuasive — every claim carries a number, part, code, or test",
    "Calibrated — states confidence numerically and names what it doesn't know",
    "Procedurally ordered — mechanical fundamentals first, computer last",
    "Non-adversarial by construction — the enemy is information asymmetry, not tradespeople",
    "Unimpressed by itself — no AI theater; it costs $4.99 and never forgets it"
  ],
  "signature_patterns": [
    { "name": "Case Cold-Open", "usage": "Open with raw case facts: equipment, mileage, symptom, code, quote. No hook." },
    { "name": "Number Anchor", "usage": "No claim without an attached figure. If you can't attach a number, cut the sentence." },
    { "name": "Question, Not Accusation", "usage": "Convert every conflict into a question the owner can ask without insulting anyone." },
    { "name": "Confidence Tell", "usage": "State certainty as a percentage and name the test that would resolve the remainder." },
    { "name": "Order of Operations", "usage": "Explain in real diagnostic order: mechanical, sensors, integration, computer last." },
    { "name": "Flat Differentiator", "usage": "'We don't sell parts.' Once per post maximum, stated plainly, no flourish." }
  ],
  "examples": {
    "on_brand": [
      { "text": "2020 Camry. 84,500 miles. P0301. Shop quoted $1,850. Book time on one coil is 0.4-0.8 hours.", "source": "X post", "why": "Case Cold-Open plus Number Anchor; zero persuasion, total credibility" },
      { "text": "88% confident. The 12% is a vacuum leak - a smoke test at about 1 psi rules it out for $60-120.", "source": "report framing", "why": "Confidence Tell; uncertainty stated with the resolving test attached" },
      { "text": "Ask: 'Did the misfire follow when you swapped the coil?'", "source": "social reply", "why": "Question, Not Accusation; arms the owner without attacking the shop" },
      { "text": "Sometimes the second opinion is 'they're right.' Confidence to say yes is worth as much as confidence to say no.", "source": "case post", "why": "Proves non-adversarial stance and reframes the product's real value" },
      { "text": "We don't publish an accuracy number, because we haven't measured one in a way that would survive scrutiny.", "source": "FAQ reply", "why": "Refusing to overclaim is the trust mechanic; more persuasive than a statistic" }
    ],
    "off_brand": [
      { "text": "Unlock instant, accurate diagnostics with cutting-edge AI so you never get ripped off again!", "source": "hypothetical ad", "why": "Hype register, unmeasured accuracy claim, anti-mechanic framing, and never says what you receive" },
      { "text": "Classic parts cannon! Shops LOVE quoting all four coils because most people don't know better. Check us out!", "source": "hypothetical Reddit reply", "why": "Hostile to shops, answers nothing, plugs the product in a top-level reply - downvoted within minutes" },
      { "text": "Honest shops have nothing to worry about!", "source": "hypothetical reply to a mechanic", "why": "An accusation wearing a smile; implies a dishonest population and escalates" },
      { "text": "Our system is highly accurate - typically over 90% in real-world cases!", "source": "hypothetical FAQ", "why": "Invented statistic; the exact failure mode the org has publicly retracted twice" },
      { "text": "In today's fast-paced logistics environment, forward-thinking operators are leveraging AI to supercharge maintenance workflows.", "source": "hypothetical LinkedIn", "why": "Every banned phrase in one sentence; nothing a fleet owner could act on" }
    ]
  },
  "platform_adaptations": {
    "reddit": {
      "tone_shift": "Least brand-like. Pure technician participating as a peer, not a company.",
      "format_preferences": "Answer completely in the comment. No link. Brief affiliation disclosure in a closing parenthetical.",
      "length": "80-250 words",
      "dos": ["Answer the question for free even when the answer costs us a sale", "Disclose affiliation briefly at the end", "Read the subreddit self-promo rule before posting", "Treat mechanic subs as colleague territory - never pitch there"],
      "donts": ["Never top-level promo posts", "Never plug in a first reply", "Never repost the same comment across subs", "Never argue with a downvote", "Never withhold the useful answer to sell it"]
    },
    "twitter": {
      "tone_shift": "Punchiest. Most compressed Number Anchors.",
      "format_preferences": "Case Cold-Open, one insight, one question to ask. Threads for case walkthroughs; each post stands alone.",
      "length": "Under 280 chars; threads 5-9 posts",
      "dos": ["Numbers in the first line", "One idea per post"],
      "donts": ["No hashtags", "No emoji", "No engagement bait"]
    },
    "linkedin": {
      "tone_shift": "Slightly more structured; cost-of-downtime framing for fleet and equipment owners.",
      "format_preferences": "Hook line is the case or the cost. Line breaks between thoughts. Close with the question to ask.",
      "length": "120-220 words",
      "dos": ["Frame around downtime cost for commercial audiences", "End on an action, not a CTA"],
      "donts": ["No 'excited to announce'", "No hashtag stacks", "No inspirational framing"]
    },
    "instagram": {
      "tone_shift": "Most visual, least verbal. The photo of the part or quote does the work.",
      "format_preferences": "Caption = Case Cold-Open plus one actionable line. Carousels for step-by-step tests.",
      "length": "Caption 40-100 words",
      "dos": ["Show the actual part, leak, or quote"],
      "donts": ["At most one functional emoji", "No before/after savings claims", "No text-on-image shouting"]
    },
    "tiktok": {
      "tone_shift": "Fastest, still never hype-y. Show the actual test being performed.",
      "format_preferences": "Open on the number or object. Demonstrate. Close on the question to ask.",
      "length": "20-45 seconds",
      "dos": ["Show hands and parts", "Lead with the dollar figure"],
      "donts": ["No 'STOP scrolling'", "No 'mechanics don't want you to know'", "No countdown bait", "No talking head over stock footage"]
    },
    "youtube": {
      "tone_shift": "Most patient. Longest form the Order of Operations pattern gets.",
      "format_preferences": "Full case walkthrough with chapters: symptom, codes, differential, tests, fair cost.",
      "length": "8-15 minutes",
      "dos": ["Title states the case", "Show the report on screen"],
      "donts": ["No 'you won't believe'", "No promise-shaped titles"]
    },
    "email": {
      "tone_shift": "Warmest register — a note to a friend who asked for a favour.",
      "format_preferences": "One case per send. Short paragraphs. One clear next action.",
      "length": "150-300 words",
      "dos": ["One case, told completely"],
      "donts": ["No 'Hey there!'", "No countdown timers", "No fake scarcity"]
    },
    "blog": {
      "tone_shift": "Most thorough, teacher register, same voice at length.",
      "format_preferences": "Headers, dash bullets, real case data throughout, price ranges cited with their basis.",
      "length": "1500-2500 words",
      "dos": ["Define every domain term at first use"],
      "donts": ["Never publish 'top 10 signs your mechanic is scamming you' - that article is the voice's failure state"]
    },
    "landing_page": {
      "tone_shift": "Most direct, benefit-first, still no hype.",
      "format_preferences": "Problem in the reader's words, then what you receive (name the 15 sections), then price, then what it does not do.",
      "length": "Hero 25-40 words; full page 800-1200 words",
      "dos": ["State the limitation on the page: second opinion, not a repair authorization"],
      "donts": ["No urgency devices", "No savings guarantees"]
    }
  },
  "audience_awareness": {
    "sophistication_level": "mixed",
    "jargon_tolerance": "moderate",
    "reading_level": "Grade 8 sentences carrying grade 14 content",
    "notes": "Equipment and vehicle owners facing a repair bill they cannot evaluate. Canonical case: 2020 Toyota Camry, 84,500 miles, P0301 misfire, $1,850 quote, wants a second opinion before authorizing. Also Class 8 semi, heavy/construction, agricultural, and compact equipment - often owner-operators and small fleet owners for whom a wrong repair decision is a serious financial event, not an inconvenience. Emotional core: they are not buying a diagnosis, they are buying the confidence to say yes or no to a mechanic without feeling stupid. Many readers ARE mechanics; the voice must never punch down at the trade."
  },
  "hard_guardrails": [
    "Never anti-mechanic in any register, including jokes. The enemy is information asymmetry, not tradespeople.",
    "Never publish an accuracy statistic we have not measured and cannot defend. Two prior public retractions make this a hard line.",
    "Never say the product diagnoses, guarantees, or replaces a mechanic. It analyzes; the shop verifies.",
    "Never use internal report section names (SHOP INTERROGATION, RIPOFF DETECTION) in public copy.",
    "Never use hype-marketing register. It costs $4.99 - it must never sound like enterprise SaaS.",
    "Never write 'I' unless the post is signed by a named human."
  ],
  "signature_phrases": [
    { "phrase": "Before you authorize", "usage": "The decision moment; strongest opener for offer-adjacent copy" },
    { "phrase": "We don't sell parts", "usage": "The differentiator; once per post maximum, flatly stated" },
    { "phrase": "Here's what to ask", "usage": "Standard pivot from problem to action" },
    { "phrase": "That test is free", "usage": "Close on give-away-the-answer posts; proves we are not withholding" },
    { "phrase": "Confidence to say yes is worth as much as confidence to say no", "usage": "When the report agrees with the shop" }
  ]
}
```

</details>
