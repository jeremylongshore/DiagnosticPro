# Marketing Stack — DiagnosticPro

Detected 2026-08-13 by /start-here.

| Capability | Tool | Status |
|---|---|---|
| Image / video generation | Replicate | ✗ not connected (no REPLICATE_API_TOKEN) |
| Email ESP | — | ✗ not connected |
| Analytics | Umami (self-hosted, analytics.intentsolutions.io) | ✓ **LIVE on diagnosticpro.io** — website id 52a9058c-e734-4276-a188-8e30c87941f6 |
| Social scheduling | — | ✗ not connected |
| CRM | Twenty (self-hosted) | ✓ available via MCP |
| Membership / payments | Whop + Stripe | ✓ live in product |

## MCP servers available
umami · twenty · whop · plane · firecrawl · playwright

## Notes
- No `.env` at repo root; backend secrets are SOPS-encrypted and live on the VPS.
- **This repo is public.** Marketing copy here is fine by owner decision (2026-08-13).
  Do not put pricing strategy, unreleased positioning, or partner terms in it.
- Analytics is ALREADY INSTRUMENTED. Corrected 2026-08-13: an earlier scan claimed
  diagnosticpro.io had no Umami tag. That was wrong — the scan only grepped repo source
  (02-src/frontend/index.html, main.tsx) and the tag ships in the built dist. The served
  page carries:
      <script defer src="https://analytics.intentsolutions.io/script.js"
              data-website-id="52a9058c-e734-4276-a188-8e30c87941f6">
  So there IS a real traffic baseline to measure content against from day one. Verify
  claims about the LIVE site against the live site, not the repo.
- KNOWN ISSUE: the `umami` MCP read path returns 404 HTML for this website id (and
  get_websites fails the same way), so baseline numbers could not be pulled in-session.
  The collection side is fine; only the MCP query path is broken. Read the numbers from
  the Umami UI until that is fixed.
