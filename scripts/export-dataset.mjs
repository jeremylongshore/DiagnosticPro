#!/usr/bin/env node
// export-dataset.mjs — dump the LLM-report dataset (analyses ⨝ diagnostic_submissions)
// to newline-delimited JSON for offline training/eval.
//
// One row per stored report: vehicle context (submission payload), detected codes,
// full report text, parsed sections, model + framework version attribution, dates.
//
// Usage:
//   node scripts/export-dataset.mjs [db-path] [out-path]
//     db-path   default: 02-src/backend/services/backend/diagnosticpro.db
//     out-path  default: reports-dataset.ndjson ("-" = stdout)
//
// On the VPS (live DB, via the transactional borg snapshot — never the hot WAL file):
//   docker exec diagnosticpro-backend node -e "require('better-sqlite3')('/data/diagnosticpro.db',{readonly:true}).backup('/data/diagnosticpro.snapshot.db')"
//   docker cp diagnosticpro-backend:/data/diagnosticpro.snapshot.db /tmp/dpro.db
//   node scripts/export-dataset.mjs /tmp/dpro.db reports-dataset.ndjson
//
// Runs on demand; intentionally NOT wired into CI.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backendDir = path.join(repoRoot, '02-src', 'backend', 'services', 'backend');

// better-sqlite3 lives in the backend's node_modules — resolve from there.
const require = createRequire(path.join(backendDir, 'package.json'));
const Database = require('better-sqlite3');

const dbPath = process.argv[2] || path.join(backendDir, 'diagnosticpro.db');
const outPath = process.argv[3] || path.join(repoRoot, 'reports-dataset.ndjson');

if (!fs.existsSync(dbPath)) {
  console.error(`export-dataset: DB not found at ${dbPath}`);
  process.exit(1);
}

const db = new Database(dbPath, { readonly: true });

const rows = db.prepare(`
  SELECT
    a.id,
    a.status               AS analysis_status,
    a.model,
    a.framework_version,
    a.paid_via             AS analysis_paid_via,
    a.detected_codes,
    a.sections,
    a.full_analysis,
    a.created_at           AS analysis_created_at,
    a.updated_at           AS analysis_updated_at,
    s.payload,
    s.status               AS submission_status,
    s.price_cents,
    s.amount_paid_cents,
    s.paid_via              AS submission_paid_via,
    s.used_with_membership,
    s.created_at            AS submitted_at,
    s.completed_at
  FROM analyses a
  JOIN diagnostic_submissions s ON s.id = a.submission_id
  ORDER BY a.created_at
`).all();

const parse = (text, fallback) => {
  if (text == null) return fallback;
  try { return JSON.parse(text); } catch { return fallback; }
};

const out = outPath === '-' ? process.stdout : fs.createWriteStream(outPath);
let exported = 0;
let skippedEmpty = 0;

for (const r of rows) {
  if (!r.full_analysis) { skippedEmpty += 1; continue; } // no report text -> not a dataset row
  const payload = parse(r.payload, {});
  out.write(JSON.stringify({
    id: r.id,
    // vehicle / equipment context
    equipment_type: payload.equipmentType ?? null,
    make: payload.make ?? null,
    model_name: payload.model ?? null,
    year: payload.year ?? null,
    mileage_hours: payload.mileageHours ?? null,
    problem_description: payload.problemDescription ?? null,
    symptoms: payload.symptoms ?? null,
    error_codes_raw: payload.errorCodes ?? null,
    urgency_level: payload.urgencyLevel ?? null,
    shop_quote_amount: payload.shopQuoteAmount ?? null,
    payload,                      // full original submission for anything above misses
    // report
    detected_codes: parse(r.detected_codes, []),
    sections: parse(r.sections, null),
    full_analysis: r.full_analysis,
    // attribution (the point of the Phase 4 fix)
    llm_model: r.model,
    framework_version: r.framework_version,
    paid_via: r.analysis_paid_via ?? r.submission_paid_via ?? 'stripe',
    // commerce + lifecycle
    price_cents: r.price_cents,
    amount_paid_cents: r.amount_paid_cents,
    used_with_membership: !!r.used_with_membership,
    analysis_status: r.analysis_status,
    submission_status: r.submission_status,
    submitted_at: r.submitted_at,
    completed_at: r.completed_at,
    analysis_created_at: r.analysis_created_at,
    analysis_updated_at: r.analysis_updated_at
  }) + '\n');
  exported += 1;
}

if (out !== process.stdout) out.end();
db.close();

console.error(`export-dataset: ${exported} report rows exported` +
  (skippedEmpty ? ` (${skippedEmpty} skipped: no full_analysis)` : '') +
  (outPath === '-' ? '' : ` -> ${outPath}`));
