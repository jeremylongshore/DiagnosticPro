// Shared plumbing for run-bench.mjs / judge.mjs — env loading, model registry,
// OpenAI-compatible chat/completions caller, corpus + candidate loaders.
// SECURITY: key VALUES are never logged, printed, or written anywhere.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEquipmentPromptContext, buildCustomerDataBlock } from './prompt-v2.mjs';

export const EVAL_DIR = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export const CORPUS_DIR = path.join(EVAL_DIR, 'corpus');
export const CANDIDATES_DIR = path.join(EVAL_DIR, 'candidates');
export const OUTPUTS_DIR = path.join(EVAL_DIR, 'outputs');
export const SCORES_DIR = path.join(EVAL_DIR, 'scores');

const KEYS_FILE = process.env.EVAL_KEYS_FILE || '/dev/shm/dpro-eval-keys.env';

/** Parse the pre-staged tmpfs dotenv file into process.env (values never logged). */
export function loadKeys() {
  if (!fs.existsSync(KEYS_FILE)) {
    throw new Error(`keys file not found: ${KEYS_FILE} (set EVAL_KEYS_FILE?)`);
  }
  const text = fs.readFileSync(KEYS_FILE, 'utf8');
  for (const line of text.split('\n')) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[m[1]]) process.env[m[1]] = v;
  }
}

/**
 * Bench model registry (verified availability per bench-selection doc).
 * quirks:
 *  - claude-sonnet-5 rejects the `temperature` param (deprecated) -> omit it.
 *  - gpt-5.4 rejects `max_tokens` -> use `max_completion_tokens`.
 */
export const MODELS = {
  'gpt-4o': { baseUrl: 'https://api.openai.com/v1', keyEnvVar: 'OPENAI_API_KEY' },
  'gpt-5.4': {
    baseUrl: 'https://api.openai.com/v1',
    keyEnvVar: 'OPENAI_API_KEY',
    useMaxCompletionTokens: true,
  },
  'claude-sonnet-5': {
    baseUrl: 'https://api.anthropic.com/v1',
    keyEnvVar: 'ANTHROPIC_API_KEY',
    omitTemperature: true,
  },
  // Judge-only fallback (2026-07-02): Anthropic credit balance exhausted mid-eval,
  // so the second (independent) judge runs on DeepSeek's OpenAI-compatible API.
  'deepseek-chat': { baseUrl: 'https://api.deepseek.com/v1', keyEnvVar: 'DEEPSEEK_API_KEY' },
};

export function resolveModel(modelId) {
  const m = MODELS[modelId];
  if (!m) {
    throw new Error(
      `unknown model "${modelId}" — known: ${Object.keys(MODELS).join(', ')}`,
    );
  }
  const apiKey = process.env[m.keyEnvVar];
  if (!apiKey) throw new Error(`env var ${m.keyEnvVar} not set (loadKeys() first?)`);
  return { ...m, apiKey };
}

export const sanitizeModel = (m) => m.replace(/[^A-Za-z0-9._-]/g, '-');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * POST {baseUrl}/chat/completions (OpenAI-compatible). Retries once on 429/5xx
 * with backoff. Adapts params on 400s that name temperature/max_tokens.
 * Returns { text, usage, ms, finishReason, raw }.
 */
export async function chatCompletion(modelId, messages, opts = {}) {
  const { maxTokens = 8192, temperature = 0.25 } = opts;
  const cfg = resolveModel(modelId);

  const buildBody = (o) => {
    const body = { model: modelId, messages };
    if (!cfg.omitTemperature && !o.dropTemperature) body.temperature = temperature;
    if (cfg.useMaxCompletionTokens || o.useMaxCompletionTokens) {
      body.max_completion_tokens = maxTokens;
    } else {
      body.max_tokens = maxTokens;
    }
    return body;
  };

  const adapt = { dropTemperature: false, useMaxCompletionTokens: false };
  let retriedTransient = false;

  for (let attempt = 0; attempt < 4; attempt++) {
    const started = Date.now();
    const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify(buildBody(adapt)),
    });
    const ms = Date.now() - started;
    const textBody = await res.text();

    if (res.ok) {
      let data;
      try {
        data = JSON.parse(textBody);
      } catch {
        throw new Error(`non-JSON 200 response from ${modelId} (${textBody.slice(0, 200)})`);
      }
      const choice = data.choices?.[0] || {};
      return {
        text: choice.message?.content ?? '',
        usage: data.usage ?? null,
        ms,
        finishReason: choice.finish_reason ?? null,
        raw: data,
      };
    }

    // Param-shape 400s: adapt once per quirk and retry immediately.
    if (res.status === 400) {
      const low = textBody.toLowerCase();
      if (!adapt.dropTemperature && low.includes('temperature')) {
        adapt.dropTemperature = true;
        continue;
      }
      if (!adapt.useMaxCompletionTokens && low.includes('max_completion_tokens')) {
        adapt.useMaxCompletionTokens = true;
        continue;
      }
    }

    // Transient: retry once with backoff.
    if ((res.status === 429 || res.status >= 500) && !retriedTransient) {
      retriedTransient = true;
      const retryAfter = Number(res.headers.get('retry-after')) || 0;
      const waitMs = Math.max(retryAfter * 1000, 5000);
      console.error(`  [retry] ${modelId} HTTP ${res.status}; waiting ${waitMs}ms`);
      await sleep(waitMs);
      continue;
    }

    throw new Error(`${modelId} HTTP ${res.status}: ${textBody.slice(0, 400)}`);
  }
  throw new Error(`${modelId}: exhausted retries`);
}

/** Load frozen corpus cases; optional filter = array of case ids. */
export function loadCases(filterIds) {
  const files = fs.readdirSync(CORPUS_DIR).filter((f) => /^case-.*\.json$/.test(f)).sort();
  const cases = files.map((f) => JSON.parse(fs.readFileSync(path.join(CORPUS_DIR, f), 'utf8')));
  if (!filterIds || !filterIds.length) return cases;
  const want = new Set(filterIds);
  const got = cases.filter((c) => want.has(c.id));
  const missing = filterIds.filter((id) => !got.some((c) => c.id === id));
  if (missing.length) throw new Error(`unknown case ids: ${missing.join(', ')}`);
  return got;
}

/** Candidate prompt ids -> file paths (v3-a .. v3-d). */
export function candidateFile(promptId) {
  const files = fs.readdirSync(CANDIDATES_DIR).filter((f) => f.endsWith('.md'));
  const hit = files.find((f) => f.startsWith(`${promptId}-`) || f === `${promptId}.md`);
  if (!hit) throw new Error(`no candidate file for "${promptId}" in ${CANDIDATES_DIR}`);
  return path.join(CANDIDATES_DIR, hit);
}

/** Parse a candidate .md into { system, user } fenced templates. */
export function parseCandidate(promptId) {
  const raw = fs.readFileSync(candidateFile(promptId), 'utf8');
  const sys = /```system\n([\s\S]*?)\n```/.exec(raw);
  const usr = /```user\n([\s\S]*?)\n```/.exec(raw);
  if (!sys || !usr) throw new Error(`candidate ${promptId}: missing \`\`\`system or \`\`\`user block`);
  return { system: sys[1], user: usr[1] };
}

/** Render a candidate template pair for a case payload (same context pieces as v2). */
export function renderCandidate(promptId, payload) {
  const { system, user } = parseCandidate(promptId);
  const ctx = getEquipmentPromptContext(payload.equipmentType, payload);
  const subs = {
    '{{CUSTOMER_DATA_BLOCK}}': buildCustomerDataBlock(payload),
    '{{DIAGNOSTIC_FRAME}}': ctx.diagnosticFrame,
    '{{ERROR_CODE_GUIDANCE}}': ctx.errorCodeGuidance,
    '{{SOURCE_GUIDANCE}}': ctx.sourceGuidance,
    '{{SAFETY_CONSIDERATIONS}}': ctx.safetyConsiderations,
  };
  const render = (tpl) => {
    let out = tpl;
    for (const [k, v] of Object.entries(subs)) out = out.split(k).join(v);
    const leftover = out.match(/\{\{[A-Z_]+\}\}/g);
    if (leftover) throw new Error(`candidate ${promptId}: unresolved placeholders ${[...new Set(leftover)].join(', ')}`);
    return out;
  };
  return { system: render(system), user: render(user) };
}

/** Rubric axis weights — MUST stay in sync with rubric.md. */
export const RUBRIC_WEIGHTS = {
  diagnosticAccuracy: 25,
  codeCoverage: 15,
  actionability: 15,
  hallucinationRisk: 15,
  ripoffDetection: 10,
  costRealism: 10,
  formatAdherence: 10,
};

export function weightedTotal(scores) {
  let total = 0;
  for (const [axis, w] of Object.entries(RUBRIC_WEIGHTS)) {
    const s = Number(scores?.[axis]);
    if (!Number.isFinite(s)) return null;
    total += Math.max(0, Math.min(10, s)) * w;
  }
  return Math.round(total) / 10; // 0–100 scale
}
