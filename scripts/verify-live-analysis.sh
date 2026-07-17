#!/usr/bin/env bash
# verify-live-analysis.sh — DB-level structural verification of a live report.
# Companion to e2e-live/journey.spec.ts step J1-08 (the DB is not exposed over
# HTTP by design, so the journey suite records the submissionId and this script
# proves the stored dataset row from the VPS side).
#
# Usage: scripts/verify-live-analysis.sh <submissionId> [ssh-host]
#   ssh-host default: intentsolutions (tailnet)
#
# Asserts on the analyses row:
#   - status = ready
#   - model is non-null (e.g. gpt-4o)          <- Phase 4 attribution fix
#   - framework_version is non-null (v2.0+)
#   - full_analysis contains no mock text and >= 14 numbered sections
#   - detected_codes parsed & non-empty when the submission carried codes

set -euo pipefail

SUBMISSION_ID="${1:?usage: verify-live-analysis.sh <submissionId> [ssh-host]}"
HOST="${2:-intentsolutions}"

ssh "$HOST" docker exec diagnosticpro-backend node -e "'
const db = require(\"better-sqlite3\")(\"/data/diagnosticpro.db\", { readonly: true });
const row = db.prepare(
  \"SELECT a.status, a.model, a.framework_version, a.full_analysis, a.detected_codes, s.payload \" +
  \"FROM analyses a JOIN diagnostic_submissions s ON s.id = a.submission_id WHERE a.id = ?\"
).get(process.argv[1]);
if (!row) { console.error(\"FAIL: no analyses row for\", process.argv[1]); process.exit(1); }

const fails = [];
if (row.status !== \"ready\") fails.push(\"status=\" + row.status);
if (!row.model) fails.push(\"model is NULL (attribution clobber?)\");
if (!row.framework_version) fails.push(\"framework_version is NULL\");
const text = row.full_analysis || \"\";
if (/mock/i.test(text.slice(0, 2000))) fails.push(\"full_analysis smells like mock text\");
const sections = (text.match(/^\\s*\\d{1,2}\\.\\s+[A-Z]/gm) || []).length;
if (sections < 14) fails.push(\"only \" + sections + \" numbered sections (< 14)\");
let codes = [];
try { codes = JSON.parse(row.detected_codes || \"[]\"); } catch { fails.push(\"detected_codes not JSON\"); }
const payload = JSON.parse(row.payload || \"{}\");
if ((payload.errorCodes || \"\").trim() && codes.length === 0) fails.push(\"submission carried codes but detected_codes empty\");

console.log(JSON.stringify({
  submissionId: process.argv[1], status: row.status, model: row.model,
  framework_version: row.framework_version, sections, detected_codes: codes,
  reportChars: text.length
}, null, 2));
if (fails.length) { console.error(\"FAIL:\", fails.join(\"; \")); process.exit(1); }
console.log(\"PASS: real attributed report verified in the dataset\");
'" "$SUBMISSION_ID"
