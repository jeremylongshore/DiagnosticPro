// T3: private photo evidence routes. Uses a real temporary SQLite database and
// uploads volume; no public file-serving route is ever exercised or created.

const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'diagpro-evidence-'));
process.env.DB_PATH = path.join(tmpRoot, 'test.db');
process.env.REPORTS_DIR = path.join(tmpRoot, 'reports');
process.env.EVIDENCE_UPLOADS_DIR = path.join(tmpRoot, 'uploads');
process.env.LLM_API_KEY = 'sk-unit-test-fake-key-not-real';

const request = require('supertest');
const app = require('../index.js');
const { getDb, closeDb } = require('../db');
const { tinyPngBuffer } = require('./fixtures/evidence-seeds');
const { DEFAULT_MAX_BYTES } = require('../evidence/promptEvidence');

const db = getDb();

async function createPendingSubmission() {
  const res = await request(app).post('/saveSubmission').send({
    payload: {
      equipmentType: 'automotive',
      make: 'Toyota',
      model: 'Camry',
      year: '2020',
      symptoms: 'Rough idle and P0301 single-cylinder misfire under load.'
    }
  });
  expect(res.status).toBe(200);
  return res.body.submissionId;
}

function attachPng(req, name = 'dash.png') {
  return req.attach('photo', tinyPngBuffer(), { filename: name, contentType: 'image/png' });
}

afterAll(() => {
  closeDb();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('SQLite evidence schema', () => {
  test('creates the private evidence metadata table and lookup index', () => {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'evidence'").get();
    const index = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'idx_evidence_submission'").get();
    expect(table).toEqual({ name: 'evidence' });
    expect(index).toEqual({ name: 'idx_evidence_submission' });
  });
});

describe('POST /evidence/:submissionId', () => {
  test('stores a valid PNG privately and returns metadata without a file URL or path', async () => {
    const submissionId = await createPendingSubmission();
    const res = await attachPng(request(app).post(`/evidence/${submissionId}`));

    expect(res.status).toBe(201);
    expect(res.body.evidence).toMatchObject({ kind: 'photo', mime: 'image/png', status: 'uploaded' });
    expect(res.body.evidence.id).toMatch(/^ev_/);
    expect(res.body.evidence).not.toHaveProperty('path');
    expect(res.body.evidence).not.toHaveProperty('url');

    const row = db.prepare('SELECT * FROM evidence WHERE id = ?').get(res.body.evidence.id);
    expect(row.submission_id).toBe(submissionId);
    expect(row.path).toMatch(new RegExp(`^${submissionId}/ev_`));
    expect(row.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(fs.existsSync(path.join(process.env.EVIDENCE_UPLOADS_DIR, row.path))).toBe(true);
  });

  test('rejects a MIME type outside jpeg/png/webp', async () => {
    const submissionId = await createPendingSubmission();
    const res = await request(app)
      .post(`/evidence/${submissionId}`)
      .attach('photo', Buffer.from('not an image'), { filename: 'bad.gif', contentType: 'image/gif' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('UNSUPPORTED_MIME');
    expect(db.prepare('SELECT COUNT(*) AS count FROM evidence WHERE submission_id = ?').get(submissionId).count).toBe(0);
  });

  test('rejects a file larger than 2 MiB before it is written', async () => {
    const submissionId = await createPendingSubmission();
    const res = await request(app)
      .post(`/evidence/${submissionId}`)
      .attach('photo', Buffer.alloc(DEFAULT_MAX_BYTES + 1), { filename: 'large.png', contentType: 'image/png' });

    expect(res.status).toBe(413);
    expect(res.body.code).toBe('FILE_TOO_LARGE');
    expect(db.prepare('SELECT COUNT(*) AS count FROM evidence WHERE submission_id = ?').get(submissionId).count).toBe(0);
  });

  test('caps each pending submission at three photos', async () => {
    const submissionId = await createPendingSubmission();
    for (let i = 0; i < 3; i += 1) {
      const upload = await attachPng(request(app).post(`/evidence/${submissionId}`), `photo-${i}.png`);
      expect(upload.status).toBe(201);
    }
    const fourth = await attachPng(request(app).post(`/evidence/${submissionId}`), 'photo-4.png');
    expect(fourth.status).toBe(400);
    expect(fourth.body.code).toBe('TOO_MANY_PHOTOS');
  });
});

describe('GET and DELETE /evidence', () => {
  test('lists metadata only, then deletes the private file and marks it deleted', async () => {
    const submissionId = await createPendingSubmission();
    const upload = await attachPng(request(app).post(`/evidence/${submissionId}`));
    const evidenceId = upload.body.evidence.id;
    const row = db.prepare('SELECT path FROM evidence WHERE id = ?').get(evidenceId);
    const filePath = path.join(process.env.EVIDENCE_UPLOADS_DIR, row.path);

    const listed = await request(app).get(`/evidence/${submissionId}`);
    expect(listed.status).toBe(200);
    expect(listed.body.evidence).toHaveLength(1);
    expect(listed.body.evidence[0]).toEqual(expect.objectContaining({ id: evidenceId, mime: 'image/png' }));
    expect(listed.body.evidence[0]).not.toHaveProperty('path');
    expect(listed.body.evidence[0]).not.toHaveProperty('url');

    const deleted = await request(app).delete(`/evidence/${submissionId}/${evidenceId}`);
    expect(deleted.status).toBe(204);
    expect(fs.existsSync(filePath)).toBe(false);
    expect(db.prepare('SELECT status FROM evidence WHERE id = ?').get(evidenceId)).toEqual({ status: 'deleted' });

    const afterDelete = await request(app).get(`/evidence/${submissionId}`);
    expect(afterDelete.body.evidence).toEqual([]);
  });

  test('locks uploads and deletes after payment status changes', async () => {
    const submissionId = await createPendingSubmission();
    const upload = await attachPng(request(app).post(`/evidence/${submissionId}`));
    db.prepare("UPDATE diagnostic_submissions SET status = 'paid' WHERE id = ?").run(submissionId);

    const another = await attachPng(request(app).post(`/evidence/${submissionId}`), 'after-pay.png');
    expect(another.status).toBe(409);
    expect(another.body.code).toBe('EVIDENCE_LOCKED');

    const deleted = await request(app).delete(`/evidence/${submissionId}/${upload.body.evidence.id}`);
    expect(deleted.status).toBe(409);
    expect(deleted.body.code).toBe('EVIDENCE_LOCKED');
  });
});

// T4: post-pay vision-then-fuse.
// Mocks the `openai` module boundary (the same boundary all other suites mock)
// to return deterministic vision captions, then runs processAnalysis via the
// /analyzeDiagnostic route. Confirms:
//   (a) uploaded rows flip status -> ready with derived_json
//   (b) callLLM received photoItems (captured via the openai.chat mock body)
//   (c) vision-failed rows fall through with status='failed' and the text-only
//       path still completes.

const mockCaptureCreate = jest.fn();
jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: (...args) => mockCaptureCreate(...args) } }
  }))
);

// Default behavior: vision calls return a JSON caption; analysis calls return a
// canned 15-section report. The vision-failed test below overrides to inject a
// forced throw on the first call.
const DEFAULT_VISION_RESPONSE = JSON.stringify({
  caption: 'Coil-on-plug bank visible; P0301 highlighted on the OBD display.',
  ocr_text: 'P0301'
});
const DEFAULT_ANALYSIS_RESPONSE = '1. PRIMARY DIAGNOSIS\nP0301 cylinder 1 misfire, 88% confidence.\n2-15. Filler.';
function looksLikeVisionCall(body) {
  const msgs = body && body.messages;
  if (!Array.isArray(msgs)) return false;
  return msgs.some((m) => Array.isArray(m.content) && m.content.some((c) => c.type === 'image_url'));
}
mockCaptureCreate.mockImplementation((body) => {
  if (looksLikeVisionCall(body)) {
    return Promise.resolve({ choices: [{ message: { content: DEFAULT_VISION_RESPONSE } }] });
  }
  return Promise.resolve({ choices: [{ message: { content: DEFAULT_ANALYSIS_RESPONSE } }] });
});

const { getDb: getDbHandle } = require('../db');

function rewireEvidenceUploads() {
  // env var already set at file-top
  return getDbHandle();
}

describe('post-pay vision-then-fuse end-to-end', () => {
  let dbHandle;

  beforeAll(async () => {
    dbHandle = rewireEvidenceUploads();
  });

  beforeEach(() => {
    // Reset to the default vision=JSON caption, analysis=canned report.
    mockCaptureCreate.mockReset();
    mockCaptureCreate.mockImplementation((body) => {
      if (looksLikeVisionCall(body)) {
        return Promise.resolve({ choices: [{ message: { content: DEFAULT_VISION_RESPONSE } }] });
      }
      return Promise.resolve({ choices: [{ message: { content: DEFAULT_ANALYSIS_RESPONSE } }] });
    });
  });

  // The T4 tests drive the full /analyzeDiagnostic pipeline, which runs the
  // whiteglove PDF generator (pandoc + xelatex). Both calls are mocked at the
  // `openai` module boundary, so they take ~1s when load is light but can blow
  // past 5s on a busy machine. 30s is conservative but stable.
  jest.setTimeout(30000);

  test('captioned photo fuses into the analysis report (status=ready + photoItems seen by LLM)', async () => {
    const submissionId = await createPendingSubmission();
    const upload = await attachPng(request(app).post(`/evidence/${submissionId}`), 'dash.png');
    expect(upload.status).toBe(201);

    // Mark paid + queue analysis
    dbHandle.prepare("UPDATE diagnostic_submissions SET status = 'paid' WHERE id = ?").run(submissionId);
    const analyze = await request(app).post('/analyzeDiagnostic').send({ submissionId });
    expect(analyze.status).toBe(200);

    // The vision call comes FIRST; then the analysis call carries photoItems.
    // mockCaptureCreate is called once for vision + once for analysis; the analysis
    // call's messages array is the user prompt containing the customer data block
    // (which we expect to include the caption).
    const calls = mockCaptureCreate.mock.calls;
    expect(calls.length).toBeGreaterThanOrEqual(2);

    const visionCall = calls.find((c) => looksLikeVisionCall(c[0]));
    expect(visionCall).toBeTruthy();
    const analysisCall = calls.find((c) => !looksLikeVisionCall(c[0]));
    expect(analysisCall).toBeTruthy();

    const userMsg = analysisCall[0].messages.find((m) => m.role === 'user') || analysisCall[0].messages[analysisCall[0].messages.length - 1];
    const customerBlock = String(userMsg.content || '');

    const row = dbHandle.prepare('SELECT status, derived_json FROM evidence WHERE submission_id = ?').get(submissionId);
    expect(row.status).toBe('ready');
    const parsed = JSON.parse(row.derived_json);
    expect(parsed.caption).toBeTruthy();
    expect(customerBlock).toContain('PHOTO EVIDENCE');
  });

  test('vision-failed photo degrades to text-only report (status=failed, callLLM still called)', async () => {
    const submissionId = await createPendingSubmission();
    await attachPng(request(app).post(`/evidence/${submissionId}`), 'broken.png');
    dbHandle.prepare("UPDATE diagnostic_submissions SET status = 'paid' WHERE id = ?").run(submissionId);

    // First call (vision) throws; subsequent calls (analysis + retries) succeed.
    mockCaptureCreate.mockImplementationOnce(() => Promise.reject(new Error('forced_vision_failure')));

    const analyze = await request(app).post('/analyzeDiagnostic').send({ submissionId });
    expect(analyze.status).toBe(200);

    const row = dbHandle.prepare('SELECT status, derived_json FROM evidence WHERE submission_id = ?').get(submissionId);
    expect(row.status).toBe('failed');
    expect(JSON.parse(row.derived_json).error).toBe('forced_vision_failure');

    const subRow = dbHandle.prepare('SELECT status FROM diagnostic_submissions WHERE id = ?').get(submissionId);
    expect(['ready', 'processing']).toContain(subRow.status);
  });
});