#!/usr/bin/env bash
# Non-payment evidence smoke: create a pending submission, attach a work-order
# document, list it, prove the auth gate rejects a wrong token, delete it, and
# confirm the delete. Never pays, never triggers analysis, never calls the LLM.
#
# This is the acceptance test for dpro-a3h: test.diagnosticpro.io returned 404
# on POST /evidence/:id/document for three weeks while production returned 400,
# because the test container was created by hand and no deploy could update it.
#
# WHY IT REFUSES TO RUN AGAINST PRODUCTION
# index.js sets no `app.set('trust proxy', ...)`, so behind Caddy every
# express-rate-limit bucket keys on the proxy's address and is therefore GLOBAL,
# not per-client: submissionLimiter is 10/min site-wide (index.js:279) and
# evidenceLimiter is 30/min site-wide (index.js:281). One run against prod would
# burn a tenth of every real customer's submission budget for that minute, and
# it would write synthetic rows into the live database. Route presence on prod
# is proven non-destructively instead — see the hint printed below.
set -euo pipefail

BASE="${1:?usage: smoke-evidence.sh <base-url> [--keep]}"
KEEP="${2:-}"
BASE="${BASE%/}"

case "$BASE" in
  *//diagnosticpro.io|*//www.diagnosticpro.io)
    cat >&2 <<'REFUSE'
REFUSING: this script mutates data and shares a global rate-limit bucket with
real customers. Prove route presence on production non-destructively instead:

  curl -sS -o /dev/null -w '%{http_code} %{content_type}\n' \
    -X POST https://diagnosticpro.io/evidence/PROBE/document

  400 + application/json  => route present (rejects the probe payload)
  404 + text/html         => route ABSENT (the dpro-a3h bug)
REFUSE
    exit 64;;
esac

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
say() { printf '%-46s %s\n' "$1" "$2"; }
fail() { printf '\nFAIL: %s\n' "$1" >&2; exit 1; }

# --- 1. Create a pending submission -----------------------------------------
# validateSubmissionPayload requires equipmentType + model (index.js:64-80).
# equipmentType carries a greppable marker so these rows are identifiable later.
code=$(curl -sS -o "$TMP/save.json" -w '%{http_code}' \
  -X POST "$BASE/saveSubmission" -H 'Content-Type: application/json' \
  -d '{"payload":{"equipmentType":"smoke-test-dpro-a3h","model":"evidence-smoke","symptoms":"non-payment evidence smoke"}}')
[ "$code" = "200" ] || fail "/saveSubmission returned $code (expected 200). Body: $(head -c 300 "$TMP/save.json")"

SID=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["submissionId"])' "$TMP/save.json")
TOK=$(python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["evidenceToken"])' "$TMP/save.json")
[ -n "$SID" ] && [ -n "$TOK" ] || fail "no submissionId/evidenceToken in response"
say "1. submission created" "$SID"

# --- 2. Attach a work-order document ----------------------------------------
# Field name is `document` (documentUpload.single('document'), index.js:490);
# auth is the x-evidence-token header (evidence/access.js:10); text/plain is an
# accepted mime (evidence/documents.js:23).
printf 'WORK ORDER\nTechnician recorded P0301 cylinder 1 misfire.\nReplaced coil pack.\n' > "$TMP/wo.txt"
code=$(curl -sS -o "$TMP/up.json" -w '%{http_code}' \
  -X POST "$BASE/evidence/$SID/document" \
  -H "x-evidence-token: $TOK" \
  -F 'kind=work_order' -F "document=@$TMP/wo.txt;type=text/plain")
if [ "$code" = "404" ]; then
  fail "POST /evidence/:id/document returned 404 — the route is ABSENT on this host. This is the dpro-a3h bug."
fi
[ "$code" = "200" ] || [ "$code" = "201" ] || fail "document upload returned $code. Body: $(head -c 300 "$TMP/up.json")"
EVID=$(python3 -c '
import json,sys
d=json.load(open(sys.argv[1]))
print(d.get("evidenceId") or d.get("id") or (d.get("evidence") or {}).get("id") or "")' "$TMP/up.json")
say "2. document attached" "${EVID:-<id not in body>}"

# --- 3. List it back ---------------------------------------------------------
code=$(curl -sS -o "$TMP/list.json" -w '%{http_code}' \
  "$BASE/evidence/$SID" -H "x-evidence-token: $TOK")
[ "$code" = "200" ] || fail "GET /evidence/:id returned $code"
grep -q 'work_order' "$TMP/list.json" || fail "listing does not contain the work_order we just attached"
say "3. listed back" "work_order present"

# --- 4. The auth gate actually gates ----------------------------------------
# A wrong token must NOT be able to read another submission's evidence.
code=$(curl -sS -o /dev/null -w '%{http_code}' \
  "$BASE/evidence/$SID" -H "x-evidence-token: wrong-token-$$")
[ "$code" = "200" ] && fail "SECURITY: a wrong evidence token was accepted (got 200)"
say "4. auth gate rejects bad token" "$code"

# --- 5. Delete + confirm -----------------------------------------------------
if [ -n "$EVID" ] && [ "$KEEP" != "--keep" ]; then
  code=$(curl -sS -o /dev/null -w '%{http_code}' \
    -X DELETE "$BASE/evidence/$SID/$EVID" -H "x-evidence-token: $TOK")
  [ "$code" = "200" ] || [ "$code" = "204" ] || fail "DELETE returned $code"
  say "5. deleted" "$code"
  curl -sS "$BASE/evidence/$SID" -H "x-evidence-token: $TOK" -o "$TMP/after.json"
  say "6. delete confirmed" "$(grep -c 'work_order' "$TMP/after.json" || true) active work_order rows"
else
  say "5. delete" "skipped (--keep, or no evidence id in body)"
fi

echo
echo "PASS — evidence upload/list/auth/delete all work on $BASE"
echo "Submission $SID left pending and unpaid; the orphan sweeper"
echo "(EVIDENCE_ORPHAN_TTL_HOURS=48) reclaims it."
