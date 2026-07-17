/**
 * Photo vision: post-pay caption + OCR for diagnostic photo evidence.
 *
 * Provider switch mirrors the text-LLM pattern (LLM_API_KEY / LLM_BASE_URL /
 * LLM_MODEL). Falls back to LLM_* when VISION_* is unset so a single OpenAI key
 * covers both text and image. Defaults to gpt-4o because it is the only widely
 * deployed multimodal model that handles damaged-equipment photos reliably.
 *
 * PURE (deps-injected) for testability:
 *   describeImages({ rows, readFile, provider, modelName, now, log })
 *
 * Wiring in processAnalysis:
 *   1. read evidence rows WHERE status='uploaded' (mutually exclusive with vision)
 *   2. describeImages(...) — provider throws on a single image → that row goes to
 *      status='failed', remaining rows still fused (degrade, never bubble up).
 *   3. Update each evidence row to status='ready' + derived_json (or 'failed')
 *   4. callLLM(payload, { photoItems: readyRows })
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_VISION_PROVIDER = 'openai';
const DEFAULT_VISION_MODEL = 'gpt-4o';
const DEFAULT_VISION_BASE_URL = 'https://api.openai.com/v1';

function resolveVisionConfig(env = process.env, secrets = {}) {
  const apiKey = env.VISION_API_KEY
    || secrets.VISION_API_KEY
    || env.LLM_API_KEY
    || secrets.LLM_API_KEY
    || env.OPENAI_API_KEY
    || secrets.OPENAI_API_KEY;
  const baseURL = env.VISION_BASE_URL || secrets.VISION_BASE_URL || env.LLM_BASE_URL || secrets.LLM_BASE_URL || DEFAULT_VISION_BASE_URL;
  const modelName = env.VISION_MODEL || secrets.VISION_MODEL || env.LLM_MODEL || secrets.LLM_MODEL || DEFAULT_VISION_MODEL;
  return { apiKey, baseURL, modelName };
}

/**
 * Build a vision provider bound to a deps-injected OpenAI client. Pure.
 * Returns an object with `.caption(buffer, mime, name)` that returns
 * `{ label, caption, ocr_text } | null` (null = provider said "skip").
 *
 * @param {object} args
 * @param {object} args.openai  - injected openai-compatible client
 * @param {string} args.modelName
 * @param {(messages: any[]) => Promise<any>} [args.create]
 */
function makeVisionProvider({ openai, modelName, create }) {
  if (!openai || typeof openai.chat?.completions?.create !== 'function') {
    throw new TypeError('vision provider requires an openai-compatible client');
  }
  // gpt-4o + newer models reject `max_tokens` and want `max_completion_tokens`;
  // older models reject the inverse. Mirror the adaptive wrapper used by the
  // text-LLM call (createChatCompletionAdaptive in index.js) so the vision
  // call survives a 400 by retrying once with the other shape.
  // Custom `create` callbacks receive the full request body so tests can
  // assert on shape; the default calls the openai-compatible client with the
  // body that the adaptive wrapper built (which is what carries either
  // max_tokens or max_completion_tokens on each retry).
  const doCreate = create || ((body) => openai.chat.completions.create(body));

  async function callWithAdaptiveShape(messages) {
    const usesMaxCompletion = /^(gpt-5|o\d)/i.test(modelName);
    const state = { maxCompletion: usesMaxCompletion };
    const build = () => {
      const body = { model: modelName, messages };
      if (state.maxCompletion) body.max_completion_tokens = 600;
      else body.max_tokens = 600;
      return body;
    };
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await doCreate(build());
      } catch (err) {
        const msg = String(err?.message || '').toLowerCase();
        const is400 = err?.status === 400 || err?.statusCode === 400;
        if (!is400) throw err;
        // A 400 mentioning EITHER token-name flips state and retries — most
        // real-world messages reference both ("Use 'max_completion_tokens'
        // instead") but some only reference the one we just sent.
        const mentionsEither = msg.includes('max_completion_tokens') || msg.includes('max_tokens');
        if (!mentionsEither) throw err;
        state.maxCompletion = !state.maxCompletion;
        continue;
      }
    }
    return doCreate(build());
  }

  async function caption(buffer, mime, name) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) return null;
    const dataUrl = `data:${mime || 'image/jpeg'};base64,${buffer.toString('base64')}`;
    const systemPrompt = [
      'You are a diagnostic photo captioner for DiagnosticPro.',
      'Given an equipment / vehicle / machinery photo, produce:',
      '1. A short caption (max 240 chars) describing what is visible.',
      '2. OCR text if any printed labels, codes, error stickers, gauges, or part numbers are visible; null otherwise.',
      'Do not diagnose. Do not speculate beyond what is visible.'
    ].join('\n');

    const resp = await callWithAdaptiveShape([
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Caption this ${name || 'photo'} for an equipment diagnostic report.` },
          { type: 'image_url', image_url: { url: dataUrl, detail: 'low' } }
        ]
      }
    ]);
    const text = resp?.choices?.[0]?.message?.content?.trim() || '';
    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        const caption = (parsed.caption || '').trim() || null;
        const ocr = parsed.ocr_text == null ? null : String(parsed.ocr_text).trim() || null;
        return caption ? { label: name || null, caption, ocr_text: ocr } : null;
      } catch (_e) {
        // fall through to plain-text parse
      }
    }
    const caption = text.replace(/\s+/g, ' ').slice(0, 600);
    return { label: name || null, caption, ocr_text: null };
  }

  return { caption };
}

/**
 * Run vision over an array of evidence rows. Returns an array of
 * { row, ok, derived, error } tuples. NEVER throws on per-row failure —
 * the caller decides how to treat partial success.
 *
 * @param {object} args
 * @param {Array<{ id: string, path: string, mime: string, original_name?: string }>} args.rows
 * @param {(row) => Buffer|null} [args.readFile] - default reads EVIDENCE_UPLOADS_DIR/row.path
 * @param {(buffer, mime, name) => Promise<{label, caption, ocr_text}|null>} [args.caption]
 * @param {(row) => void} [args.log]
 */
async function describeImages({ rows, readFile, caption, log }) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const out = [];
  for (const row of safeRows) {
    if (!row || !row.id || !row.path) {
      out.push({ row, ok: false, error: 'invalid_row' });
      continue;
    }
    try {
      const buffer = readFile ? readFile(row) : null;
      if (!buffer || buffer.length === 0) {
        out.push({ row, ok: false, error: 'empty_or_missing_file' });
        continue;
      }
      const item = await caption(buffer, row.mime || 'image/jpeg', row.original_name || row.id);
      if (!item || !item.caption) {
        out.push({ row, ok: false, error: 'no_caption' });
        continue;
      }
      out.push({
        row,
        ok: true,
        derived: {
          label: item.label || null,
          caption: item.caption,
          ocr_text: item.ocr_text || null,
          derived_at: new Date().toISOString()
        }
      });
    } catch (err) {
      if (log) log({ phase: 'evidenceVision', status: 'error', evidenceId: row.id, error: err?.message || String(err) });
      out.push({ row, ok: false, error: err?.message || 'vision_failed' });
    }
  }
  return out;
}

/**
 * Resolve evidence file paths against the configured uploads dir. Pure helper
 * for both prod (`fs.readFileSync`) and tests (in-memory Buffer).
 */
function evidenceFileReader(uploadsDir) {
  const root = uploadsDir || process.env.EVIDENCE_UPLOADS_DIR || path.join(process.cwd(), 'uploads');
  return (row) => {
    if (!row || !row.path) return null;
    const fullPath = path.isAbsolute(row.path) ? row.path : path.join(root, row.path);
    if (!fs.existsSync(fullPath)) return null;
    return fs.readFileSync(fullPath);
  };
}

/**
 * Persist per-row derived_json + status. Pure (deps: db).
 * @param {object} args
 * @param {Array<{ row, ok, derived, error }>} args.results
 * @param {{ prepare: Function }} args.db
 */
function applyVisionResults({ results, db }) {
  if (!db || typeof db.prepare !== 'function') return [];
  const update = db.prepare(`
    UPDATE evidence
    SET status = ?, derived_json = ?, updated_at = ?
    WHERE id = ?
  `);
  const touched = [];
  for (const r of results || []) {
    if (!r || !r.row || !r.row.id) continue;
    if (r.ok) {
      update.run('ready', JSON.stringify(r.derived || {}), new Date().toISOString(), r.row.id);
      touched.push(r.row.id);
    } else {
      update.run('failed', JSON.stringify({ error: r.error || 'vision_failed' }), new Date().toISOString(), r.row.id);
      touched.push(r.row.id);
    }
  }
  return touched;
}

module.exports = {
  resolveVisionConfig,
  makeVisionProvider,
  describeImages,
  evidenceFileReader,
  applyVisionResults,
  DEFAULT_VISION_MODEL,
  DEFAULT_VISION_BASE_URL,
  DEFAULT_VISION_PROVIDER
};
