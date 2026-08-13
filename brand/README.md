# Brand memory — DiagnosticPro

Built 2026-08-13 with the Vibe Marketing Skills suite (`/start-here`).

| File | Owner skill | Status |
|---|---|---|
| `voice-profile.md` | `/brand-voice` | **built** — awaiting owner calibration |
| `positioning.md` | `/positioning-angles` | **proposed** — 5 angles, awaiting selection |
| `stack.md` | `/start-here` | current |
| `assets.md` | all skills | empty |
| `learnings.md` | all skills | empty — nothing tested yet |

## Read this first if you are posting

1. `voice-profile.md` → **Calibration Samples** (3 short pieces). If your draft doesn't
   feel like those, fix the draft, not the profile.
2. `voice-profile.md` → the 30-second pre-post checklist.
3. Two hard rules, both verified against the shipped product:
   - **Never quote `SHOP INTERROGATION` or `RIPOFF DETECTION`** from a report. Those are
     real internal section names ("questions to expose incompetence", "parts cannon
     indicators") and they read as anti-mechanic in public. Source from
     `CONVERSATION SCRIPTING` instead — the product itself tells customers never to say
     "my AI report says". Rename tracked as bead `dpro-ebh`.
   - **Never claim the report works "mechanical-first."** That ordering is not in the
     shipped prompt (0 matches in `promptV3.js` / `index.js`). Use it to describe how
     diagnosis works, never what the report does. Tracked as `dpro-vth`.

## Why those two rules exist
Both were caught by review, not by luck. This estate has twice publicly retracted claims
that outran reality; "verify the claim against the shipped code before it reaches copy" is
the standing rule. Two independent agents found the anti-mechanic trap; the protocol error
originated in a brief written by Claude and was caught by the positioning agent refusing
to use it.
