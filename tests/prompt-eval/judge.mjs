#!/usr/bin/env node
// DiagnosticPro prompt-eval blind A/B judge.
//
//   node judge.mjs --candidate <prompt>__<model-sanitized>
//                  [--judge <openai|anthropic>] [--judge-model <id>]
//                  [--baseline v2__gpt-4o] [--cases id1,id2] [--dry-run]
//
// For each case it loads the candidate output and the BASELINE output
// (default v2__gpt-4o, the incumbent), assigns A/B order DETERMINISTICALLY from
// sha256(caseId + "|" + candidate) so runs are reproducible but balanced,
// embeds rubric.md verbatim in the judge prompt, and asks the judge for STRICT
// JSON scores. Results append to scores/<candidate>__<judge>.jsonl.
// --dry-run renders the judge prompt for a fabricated pair (no API call).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  loadKeys, chatCompletion, loadCases, EVAL_DIR, OUTPUTS_DIR, SCORES_DIR,
  RUBRIC_WEIGHTS, weightedTotal,
} from './lib/common.mjs';

const JUDGE_MODELS = {
  openai: 'gpt-5.4',        // "gpt-4o or better if listed" — gpt-5.4 is listed + verified
  anthropic: 'claude-sonnet-5', // via api.anthropic.com/v1 OpenAI-compat chat/completions
  deepseek: 'deepseek-chat', // fallback 2nd judge (Anthropic credits exhausted 2026-07-02)
};

function parseArgs(argv) {
  const args = { judge: 'openai', baseline: 'v2__gpt-4o', dryRun: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--candidate') args.candidate = argv[++i];
    else if (a === '--judge') args.judge = argv[++i];
    else if (a === '--judge-model') args.judgeModel = argv[++i];
    else if (a === '--baseline') args.baseline = argv[++i];
    else if (a === '--cases') args.cases = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--help' || a === '-h') args.help = true;
    else throw new Error(`unknown arg: ${a}`);
  }
  return args;
}

/** Deterministic, balanced A/B assignment: true => candidate is report A. */
export function candidateIsA(caseId, candidate) {
  const h = crypto.createHash('sha256').update(`${caseId}|${candidate}`).digest();
  return h[0] % 2 === 0;
}

function loadOutput(cell, caseId) {
  const f = path.join(OUTPUTS_DIR, `${cell}__${caseId}.json`);
  if (!fs.existsSync(f)) throw new Error(`missing output ${f} — run run-bench.mjs first`);
  const rec = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (!rec.text) throw new Error(`empty output text in ${f}`);
  return rec;
}

const JUDGE_SYSTEM =
  'You are a meticulous, impartial evaluation judge for equipment diagnostic reports. ' +
  'You compare two anonymized reports (A and B) for the same customer case against a ' +
  'weighted rubric. You never reward verbosity for its own sake, you penalize fabricated ' +
  'specifics harshly, and you respond with STRICT JSON only — no markdown, no commentary.';

function buildJudgePrompt(rubricText, kase, reportA, reportB) {
  const axes = Object.keys(RUBRIC_WEIGHTS);
  return `Evaluate two diagnostic reports produced for the SAME customer case. Score each report on every rubric axis from 0 to 10, then state which report is better overall under the rubric weights.

=== RUBRIC (verbatim) ===
${rubricText}
=== END RUBRIC ===

=== CASE PAYLOAD (what the customer submitted) ===
${JSON.stringify({ payload: kase.payload, expectedCodes: kase.meta?.expectedCodes ?? [], tags: kase.meta?.tags ?? [] }, null, 2)}
=== END CASE PAYLOAD ===

=== REPORT A ===
${reportA}
=== END REPORT A ===

=== REPORT B ===
${reportB}
=== END REPORT B ===

Scoring notes:
- "expectedCodes" above is the ground-truth code list for the codeCoverage axis.
- hallucinationRisk: HIGHER score means FEWER hallucinations.
- Judge each report on its own merits per axis; "preferred" is the overall weighted call ("tie" only if genuinely inseparable).

Respond with STRICT JSON, exactly this shape and nothing else:
{
  "scoresA": {${axes.map((a) => `"${a}": <0-10>`).join(', ')}},
  "scoresB": {${axes.map((a) => `"${a}": <0-10>`).join(', ')}},
  "preferred": "A" | "B" | "tie",
  "rationale": "<2-4 sentences>"
}`;
}

/** Defensive strict-JSON parse: strips fences, extracts first balanced object. */
export function parseJudgeJson(text) {
  let t = String(text).trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = t.indexOf('{');
  if (start === -1) throw new Error('no JSON object in judge response');
  let depth = 0, inStr = false, esc = false, end = -1;
  for (let i = start; i < t.length; i++) {
    const ch = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
    } else if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error('unbalanced JSON in judge response');
  const obj = JSON.parse(t.slice(start, end + 1));
  for (const side of ['scoresA', 'scoresB']) {
    if (typeof obj[side] !== 'object' || obj[side] === null) throw new Error(`missing ${side}`);
    for (const axis of Object.keys(RUBRIC_WEIGHTS)) {
      const v = Number(obj[side][axis]);
      if (!Number.isFinite(v)) throw new Error(`missing/NaN ${side}.${axis}`);
      obj[side][axis] = Math.max(0, Math.min(10, v));
    }
  }
  if (!['A', 'B', 'tie'].includes(obj.preferred)) obj.preferred = 'tie';
  if (typeof obj.rationale !== 'string') obj.rationale = '';
  return obj;
}

async function judgeCase({ kase, candidate, baseline, judgeName, judgeModel, rubricText, dryRun }) {
  const isA = candidateIsA(kase.id, candidate);

  let candText, baseText;
  if (dryRun) {
    candText = '[FABRICATED CANDIDATE REPORT]\n1. PRIMARY DIAGNOSIS\n- Fabricated for --dry-run. Confidence: 90%\n...\n15. NEXT STEPS SUMMARY\n- a\n- b\n- c';
    baseText = '[FABRICATED BASELINE REPORT]\n1. PRIMARY DIAGNOSIS\n- Fabricated for --dry-run. Confidence: 85%\n...\n15. NEXT STEPS SUMMARY\n- x\n- y\n- z';
  } else {
    candText = loadOutput(candidate, kase.id).text;
    baseText = loadOutput(baseline, kase.id).text;
  }

  const reportA = isA ? candText : baseText;
  const reportB = isA ? baseText : candText;
  const prompt = buildJudgePrompt(rubricText, kase, reportA, reportB);

  if (dryRun) {
    console.log(`--- DRY RUN: case=${kase.id} candidate=${candidate} baseline=${baseline} candidateIs=${isA ? 'A' : 'B'} judge=${judgeName}/${judgeModel} ---`);
    console.log(`[system]\n${JUDGE_SYSTEM}\n`);
    console.log(`[user] (${prompt.length} chars)\n${prompt}`);
    return null;
  }

  const r = await chatCompletion(judgeModel, [
    { role: 'system', content: JUDGE_SYSTEM },
    { role: 'user', content: prompt },
  ], { maxTokens: 4096, temperature: 0 }); // headroom: claude judges spend thinking tokens inside max_tokens

  const parsed = parseJudgeJson(r.text);
  const scoresCandidate = isA ? parsed.scoresA : parsed.scoresB;
  const scoresBaseline = isA ? parsed.scoresB : parsed.scoresA;
  const preferred =
    parsed.preferred === 'tie' ? 'tie'
      : (parsed.preferred === 'A') === isA ? 'candidate' : 'baseline';

  return {
    ts: new Date().toISOString(),
    case: kase.id,
    candidate,
    baseline,
    judge: judgeName,
    judgeModel,
    candidateWasA: isA,
    scoresCandidate,
    scoresBaseline,
    weightedCandidate: weightedTotal(scoresCandidate),
    weightedBaseline: weightedTotal(scoresBaseline),
    preferred,
    rationale: parsed.rationale,
    usage: r.usage,
    ms: r.ms,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.candidate) {
    console.log('usage: node judge.mjs --candidate <prompt>__<model> [--judge openai|anthropic] [--judge-model <id>] [--baseline v2__gpt-4o] [--cases id1,id2] [--dry-run]');
    process.exit(args.help ? 0 : 1);
  }
  if (!JUDGE_MODELS[args.judge]) throw new Error(`unknown judge "${args.judge}" (openai|anthropic)`);
  const judgeModel = args.judgeModel || JUDGE_MODELS[args.judge];
  const rubricText = fs.readFileSync(path.join(EVAL_DIR, 'rubric.md'), 'utf8');

  if (!args.dryRun) loadKeys();
  let cases = loadCases(args.cases);
  if (args.dryRun) cases = cases.slice(0, 1); // one fabricated pair is enough

  fs.mkdirSync(SCORES_DIR, { recursive: true });
  const scoresFile = path.join(SCORES_DIR, `${args.candidate}__${args.judge}.jsonl`);
  let wins = 0, losses = 0, ties = 0, failed = 0;

  for (const kase of cases) {
    try {
      const rec = await judgeCase({
        kase,
        candidate: args.candidate,
        baseline: args.baseline,
        judgeName: args.judge,
        judgeModel,
        rubricText,
        dryRun: args.dryRun,
      });
      if (!rec) continue; // dry run
      fs.appendFileSync(scoresFile, JSON.stringify(rec) + '\n');
      if (rec.preferred === 'candidate') wins++;
      else if (rec.preferred === 'baseline') losses++;
      else ties++;
      console.log(
        `JUDGED ${kase.id}: candidate=${rec.weightedCandidate} baseline=${rec.weightedBaseline} preferred=${rec.preferred}`,
      );
    } catch (err) {
      failed++;
      console.error(`FAIL   ${kase.id}: ${err.message}`);
    }
  }

  if (!args.dryRun) {
    console.log(`summary: candidate=${args.candidate} vs ${args.baseline} judge=${args.judge}/${judgeModel} — W${wins}/L${losses}/T${ties}, ${failed} failed -> ${scoresFile}`);
    if (failed) process.exit(2);
  }
}

// Run only when executed directly (keeps parseJudgeJson/candidateIsA importable for tests).
import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
