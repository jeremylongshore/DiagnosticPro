// T1/T2: evidence/vision.js — provider config, describeImages (deps-injected),
// applyVisionResults, evidenceFileReader. NO real network calls. The `openai`
// module boundary is mocked at construction time by passing our own `openai`
// stub to makeVisionProvider.

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  resolveVisionConfig,
  makeVisionProvider,
  describeImages,
  evidenceFileReader,
  applyVisionResults
} = require('../evidence/vision.js');

function makeStubOpenai(createMock) {
  return {
    chat: {
      completions: { create: createMock }
    }
  };
}

function makeStubOpenaiReturning(jsonString) {
  return makeStubOpenai(() => Promise.resolve({
    choices: [{ message: { content: jsonString } }]
  }));
}

describe('resolveVisionConfig', () => {
  test('uses VISION_* when set', () => {
    const cfg = resolveVisionConfig({
      VISION_API_KEY: 'vkey',
      VISION_BASE_URL: 'https://vision.example/v1',
      VISION_MODEL: 'gpt-4o-mini'
    });
    expect(cfg).toEqual({
      apiKey: 'vkey',
      baseURL: 'https://vision.example/v1',
      modelName: 'gpt-4o-mini'
    });
  });

  test('falls back to LLM_* when VISION_* is missing', () => {
    const cfg = resolveVisionConfig({
      LLM_API_KEY: 'lkey',
      LLM_BASE_URL: 'https://api.openai.com/v1',
      LLM_MODEL: 'gpt-5.4'
    });
    expect(cfg.apiKey).toBe('lkey');
    expect(cfg.baseURL).toBe('https://api.openai.com/v1');
    expect(cfg.modelName).toBe('gpt-5.4');
  });

  test('falls through to OPENAI_API_KEY last', () => {
    const cfg = resolveVisionConfig({ OPENAI_API_KEY: 'okey' });
    expect(cfg.apiKey).toBe('okey');
  });
});

describe('makeVisionProvider', () => {
  test('caption returns parsed {label, caption, ocr_text} on JSON content', async () => {
    const openai = makeStubOpenaiReturning(JSON.stringify({
      caption: 'OBD scanner shows P0301 cylinder 1 misfire.',
      ocr_text: 'P0301'
    }));
    const provider = makeVisionProvider({ openai, modelName: 'gpt-4o' });
    const item = await provider.caption(Buffer.from([1, 2, 3]), 'image/jpeg', 'dash.png');
    expect(item).toEqual({
      label: 'dash.png',
      caption: 'OBD scanner shows P0301 cylinder 1 misfire.',
      ocr_text: 'P0301'
    });
  });

  test('caption returns null when content is empty', async () => {
    const openai = makeStubOpenai(() => Promise.resolve({ choices: [{ message: { content: '' } }] }));
    const provider = makeVisionProvider({ openai, modelName: 'gpt-4o' });
    const item = await provider.caption(Buffer.from([1]), 'image/jpeg', 'x.png');
    expect(item).toBeNull();
  });

  test('caption returns null for empty buffer', async () => {
    const openai = makeStubOpenaiReturning('{}');
    const provider = makeVisionProvider({ openai, modelName: 'gpt-4o' });
    const item = await provider.caption(Buffer.alloc(0), 'image/jpeg', 'x.png');
    expect(item).toBeNull();
  });

  test('caption tolerates non-JSON response by trimming the raw text', async () => {
    const openai = makeStubOpenai(() => Promise.resolve({
      choices: [{ message: { content: '  A   dashboard   showing   check   engine   light  ' } }]
    }));
    const provider = makeVisionProvider({ openai, modelName: 'gpt-4o' });
    const item = await provider.caption(Buffer.from([1, 2]), 'image/jpeg', 'dash.jpg');
    expect(item.caption).toBe('A dashboard showing check engine light');
    expect(item.ocr_text).toBeNull();
  });

  test('rejects invalid client', () => {
    expect(() => makeVisionProvider({ openai: {}, modelName: 'x' })).toThrow();
  });

  test('retries with max_completion_tokens when openai returns 400 max_tokens', async () => {
    // First call: 400 with "max_tokens is not supported" -> retry with max_completion_tokens.
    // Second call: success.
    let calls = 0;
    const seenBodies = [];
    const stubCreate = async (body) => {
      calls += 1;
      seenBodies.push(body);
      if (calls === 1) {
        const err = new Error("400 Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.");
        err.status = 400;
        throw err;
      }
      return { choices: [{ message: { content: JSON.stringify({ caption: 'captured.', ocr_text: 'P0301' }) } }] };
    };
    const openai = { chat: { completions: { create: stubCreate } } };
    const provider = makeVisionProvider({ openai, modelName: 'gpt-4o' });
    const item = await provider.caption(Buffer.from([0xff, 0xd8]), 'image/jpeg', 'dash.jpg');
    expect(item?.caption).toBe('captured.');
    expect(calls).toBe(2);
    const secondBody = seenBodies[seenBodies.length - 1];
    expect(secondBody.max_completion_tokens).toBe(600);
    expect(secondBody.max_tokens).toBeUndefined();
  });

  test('retries the OTHER direction when openai 400s on max_completion_tokens', async () => {
    let calls = 0;
    const stubCreate = async (body) => {
      calls += 1;
      if (calls === 1) {
        const err = new Error("400 Unsupported parameter: 'max_completion_tokens' is not supported with this model.");
        err.status = 400;
        throw err;
      }
      return { choices: [{ message: { content: JSON.stringify({ caption: 'ok', ocr_text: null }) } }] };
    };
    const openai = { chat: { completions: { create: stubCreate } } };
    const provider = makeVisionProvider({ openai, modelName: 'gpt-5' });
    const item = await provider.caption(Buffer.from([0xff, 0xd8]), 'image/jpeg', 'x.jpg');
    expect(item?.caption).toBe('ok');
    expect(calls).toBe(2);
  });
});

describe('describeImages', () => {
  const tinyBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

  test('returns ok=true with derived item on success', async () => {
    const rows = [{ id: 'ev_1', path: 'anywhere', mime: 'image/png', original_name: 'a.png' }];
    const caption = jest.fn(async () => ({ label: 'a.png', caption: 'Coil pack close-up.', ocr_text: null }));
    const results = await describeImages({
      rows,
      readFile: () => tinyBuffer,
      caption,
      log: () => {}
    });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      row: rows[0],
      ok: true,
      derived: {
        label: 'a.png',
        caption: 'Coil pack close-up.',
        ocr_text: null
      }
    });
    expect(results[0].derived.derived_at).toMatch(/T/);
  });

  test('captures per-row failure without aborting the batch', async () => {
    const rows = [
      { id: 'ev_1', path: 'a', mime: 'image/png' },
      { id: 'ev_2', path: 'b', mime: 'image/jpeg' }
    ];
    const caption = jest.fn()
      .mockRejectedValueOnce(new Error('rate_limit'))
      .mockResolvedValueOnce({ label: 'b.jpg', caption: 'Belt visible.', ocr_text: null });
    const log = jest.fn();
    const results = await describeImages({
      rows,
      readFile: () => tinyBuffer,
      caption,
      log
    });
    expect(results[0]).toMatchObject({ ok: false, error: 'rate_limit' });
    expect(results[1].ok).toBe(true);
    expect(log).toHaveBeenCalledWith(expect.objectContaining({
      phase: 'evidenceVision',
      status: 'error',
      evidenceId: 'ev_1'
    }));
  });

  test('marks ok=false when buffer is empty', async () => {
    const rows = [{ id: 'ev_3', path: 'c', mime: 'image/png' }];
    const caption = jest.fn();
    const results = await describeImages({ rows, readFile: () => Buffer.alloc(0), caption });
    expect(results[0]).toMatchObject({ ok: false, error: 'empty_or_missing_file' });
    expect(caption).not.toHaveBeenCalled();
  });

  test('rejects rows missing required fields', async () => {
    const results = await describeImages({
      rows: [{ id: null, path: 'x' }, null, {}],
      readFile: () => tinyBuffer,
      caption: () => Promise.resolve({ caption: 'ok' })
    });
    expect(results.every((r) => !r.ok)).toBe(true);
  });

  test('treats null rows array as empty', async () => {
    const results = await describeImages({ rows: null, readFile: () => tinyBuffer, caption: () => {} });
    expect(results).toEqual([]);
  });

  test('flags no_caption when provider returns null', async () => {
    const rows = [{ id: 'ev_n', path: 'z', mime: 'image/png' }];
    const caption = async () => null;
    const results = await describeImages({ rows, readFile: () => tinyBuffer, caption });
    expect(results[0]).toMatchObject({ ok: false, error: 'no_caption' });
  });
});

describe('evidenceFileReader', () => {
  test('reads from absolute paths when given one', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dprov-'));
    const file = path.join(tmp, 'photo.png');
    fs.writeFileSync(file, 'data');
    const reader = evidenceFileReader();
    const row = { id: 'ev_x', path: file, mime: 'image/png' };
    expect(reader(row).toString()).toBe('data');
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('returns null for missing files (does not throw)', () => {
    const reader = evidenceFileReader('/tmp/nonexistent-dprov-dir');
    expect(reader({ id: 'y', path: 'missing.png', mime: 'image/png' })).toBeNull();
  });

  test('joins uploadsDir with relative paths', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dprov-'));
    const subdir = path.join(tmp, 'sub_xyz');
    fs.mkdirSync(subdir, { recursive: true });
    const file = path.join(subdir, 'ev_a.png');
    fs.writeFileSync(file, 'x');
    const reader = evidenceFileReader(tmp);
    expect(reader({ id: 'a', path: 'sub_xyz/ev_a.png', mime: 'image/png' }).toString()).toBe('x');
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});

describe('applyVisionResults', () => {
  function makeFakeDb() {
    const calls = [];
    const stmt = { run: (...args) => calls.push(args) };
    return {
      calls,
      prepare: () => stmt,
      _stmt: stmt
    };
  }
  test('writes status=ready with derived_json on success rows', () => {
    const db = makeFakeDb();
    const results = [
      { row: { id: 'ev_1' }, ok: true, derived: { label: 'a', caption: 'c', ocr_text: null } },
      { row: { id: 'ev_2' }, ok: false, error: 'rate_limit' }
    ];
    const touched = applyVisionResults({ results, db });
    expect(touched.sort()).toEqual(['ev_1', 'ev_2']);
    expect(db.calls).toHaveLength(2);
    expect(db.calls[0][0]).toBe('ready');
    expect(JSON.parse(db.calls[0][1])).toMatchObject({ caption: 'c' });
    expect(db.calls[1][0]).toBe('failed');
    expect(JSON.parse(db.calls[1][1])).toMatchObject({ error: 'rate_limit' });
  });

  test('no-op when db is missing the prepare method', () => {
    const touched = applyVisionResults({ results: [{ row: { id: 'x' }, ok: true, derived: {} }], db: {} });
    expect(touched).toEqual([]);
  });
});
