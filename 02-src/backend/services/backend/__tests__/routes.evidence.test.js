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
