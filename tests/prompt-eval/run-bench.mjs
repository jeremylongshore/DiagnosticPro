#!/usr/bin/env node
// DiagnosticPro prompt-eval bench runner.
//
//   node run-bench.mjs --prompt <v2|v3-a|v3-b|v3-c|v3-d> --model <modelId>
//                      [--cases id1,id2] [--concurrency 3]
//
// Calls POST {baseUrl}/chat/completions (max_tokens 8192, temperature 0.25 —
// with per-model quirks handled in lib/common.mjs) and writes one JSON per cell:
//   outputs/<prompt>__<model-sanitized>__<case>.json
// Existing non-empty outputs are skipped (resumable). Keys are loaded from the
// pre-staged tmpfs dotenv (EVAL_KEYS_FILE, default /dev/shm/dpro-eval-keys.env)
// and never logged.
import fs from 'node:fs';
import path from 'node:path';
import {
  loadKeys, chatCompletion, loadCases, sanitizeModel,
  renderCandidate, OUTPUTS_DIR,
} from './lib/common.mjs';
import { SYSTEM_MESSAGE_V2, buildUserPromptV2 } from './lib/prompt-v2.mjs';

function parseArgs(argv) {
  const args = { concurrency: 3 };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--prompt') args.prompt = argv[++i];
    else if (a === '--model') args.model = argv[++i];
    else if (a === '--cases') args.cases = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--concurrency') args.concurrency = Number(argv[++i]) || 3;
    else if (a === '--help' || a === '-h') { args.help = true; }
    else throw new Error(`unknown arg: ${a}`);
  }
  return args;
}

function buildMessages(promptId, payload) {
  if (promptId === 'v2') {
    return [
      { role: 'system', content: SYSTEM_MESSAGE_V2 },
      { role: 'user', content: buildUserPromptV2(payload) },
    ];
  }
  const { system, user } = renderCandidate(promptId, payload);
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

async function runCell(promptId, modelId, kase) {
  const outFile = path.join(
    OUTPUTS_DIR,
    `${promptId}__${sanitizeModel(modelId)}__${kase.id}.json`,
  );
  if (fs.existsSync(outFile)) {
    try {
      const prev = JSON.parse(fs.readFileSync(outFile, 'utf8'));
      if (prev.text && prev.text.length > 0) {
        console.log(`SKIP  ${path.basename(outFile)} (exists, ${prev.text.length} chars)`);
        return { skipped: true };
      }
    } catch { /* unreadable -> rerun */ }
  }
  const messages = buildMessages(promptId, kase.payload);
  const r = await chatCompletion(modelId, messages, { maxTokens: 8192, temperature: 0.25 });
  const record = {
    prompt: promptId,
    model: modelId,
    case: kase.id,
    text: r.text,
    usage: r.usage,
    ms: r.ms,
    finishReason: r.finishReason,
    generatedAt: new Date().toISOString(),
  };
  fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(record, null, 2) + '\n');
  console.log(
    `OK    ${promptId} x ${modelId} x ${kase.id}: ${r.text.length} chars, ` +
    `${r.usage?.completion_tokens ?? '?'} out-tok, ${r.ms}ms, finish=${r.finishReason}`,
  );
  return { skipped: false, out: r.text.length };
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args.prompt || !args.model) {
    console.log('usage: node run-bench.mjs --prompt <v2|v3-a|v3-b|v3-c|v3-d> --model <modelId> [--cases id1,id2] [--concurrency 3]');
    process.exit(args.help ? 0 : 1);
  }
  loadKeys();
  const cases = loadCases(args.cases);
  console.log(`bench: prompt=${args.prompt} model=${args.model} cases=${cases.map((c) => c.id).join(',')} concurrency=${args.concurrency}`);

  const queue = [...cases];
  const results = [];
  const errors = [];
  const workers = Array.from({ length: Math.max(1, args.concurrency) }, async () => {
    while (queue.length) {
      const kase = queue.shift();
      try {
        results.push(await runCell(args.prompt, args.model, kase));
      } catch (err) {
        errors.push({ case: kase.id, error: String(err.message || err) });
        console.error(`FAIL  ${args.prompt} x ${args.model} x ${kase.id}: ${err.message}`);
      }
    }
  });
  await Promise.all(workers);

  const done = results.filter((r) => !r.skipped).length;
  const skipped = results.filter((r) => r.skipped).length;
  console.log(`summary: ${done} generated, ${skipped} skipped, ${errors.length} failed (prompt=${args.prompt}, model=${args.model})`);
  if (errors.length) process.exit(2);
}

// Run only when executed directly (keeps buildMessages importable for tests).
import { pathToFileURL } from 'node:url';
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => { console.error(err); process.exit(1); });
}
