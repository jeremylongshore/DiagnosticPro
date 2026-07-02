// P0 route tests: report lifecycle (/saveSubmission -> /analyzeDiagnostic ->
// /getDownloadUrl -> download/view/status). Boots the exported express app
// in-process (index.js only listens under require.main). DB + reports are
// isolated to a per-suite tmp dir; env MUST be set before requiring index.js.
//
// The LLM is isolated at the `openai` MODULE boundary (jest.mock) — there is
// no mock branch in production code. callLLM runs its real code path against
// the mocked client.

const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'diagpro-reports-'));
process.env.DB_PATH = path.join(tmpRoot, 'test.db');
process.env.REPORTS_DIR = path.join(tmpRoot, 'reports');
process.env.LLM_API_KEY = 'sk-unit-test-fake-key-not-real';
delete process.env.LLM_MODEL;
delete process.env.LLM_FRAMEWORK_VERSION;

const CANNED_REPORT = Array.from({ length: 15 }, (_, i) => {
  const titles = [
    'PRIMARY DIAGNOSIS', 'DIFFERENTIAL DIAGNOSIS', 'DIAGNOSTIC VERIFICATION',
    'SHOP INTERROGATION', 'CONVERSATION SCRIPTING', 'COST BREAKDOWN',
    'RIPOFF DETECTION', 'AUTHORIZATION GUIDE', 'TECHNICAL EDUCATION',
    'OEM PARTS STRATEGY', 'NEGOTIATION TACTICS', 'LIKELY CAUSES (RANKED)',
    'RECOMMENDATIONS', 'SOURCE VERIFICATION', 'NEXT STEPS SUMMARY'
  ];
  return `${i + 1}. ${titles[i]}\nUnit-canned section body for ${titles[i].toLowerCase()}. Confidence 90%.`;
}).join('\n\n');

const mockCreate = jest.fn(async () => ({
  choices: [{ message: { content: CANNED_REPORT } }]
}));
jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: (...args) => mockCreate(...args) } }
  }))
);

const request = require('supertest');
const app = require('../index.js');
const { getDb, closeDb } = require('../db');

const db = getDb();

function binaryParser(res, cb) {
  const chunks = [];
  res.on('data', (c) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
}

function insertSubmission(id, status, payload) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO diagnostic_submissions (id, status, price_cents, payload, created_at, updated_at)
    VALUES (?, ?, 499, ?, ?, ?)
  `).run(id, status, JSON.stringify(payload), now, now);
}

async function pollUntilStatus(id, wanted, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const row = db.prepare('SELECT status FROM diagnostic_submissions WHERE id = ?').get(id);
    if (row && row.status === wanted) return row.status;
    await new Promise((r) => setTimeout(r, 100));
  }
  const row = db.prepare('SELECT status FROM diagnostic_submissions WHERE id = ?').get(id);
  throw new Error(`Timed out waiting for ${id} to reach '${wanted}' (last: ${row?.status})`);
}

afterAll(() => {
  closeDb();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('GET /healthz', () => {
  test('returns 200 with exact service identity payload', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ok',
      service: 'diagnosticpro-llm-backend',
      version: '2.3.0'
    });
  });
});

describe('POST /saveSubmission', () => {
  test('persists a valid submission as pending with price 499 and returns a diag_ id', async () => {
    const payload = {
      equipmentType: 'diesel-trucks',
      make: 'Kenworth',
      model: 'T680',
      year: '2017',
      symptoms: 'Derates to 5 mph with DEF warning, SPN 4364 FMI 18 active',
      mileageHours: '412350'
    };
    const res = await request(app).post('/saveSubmission').send({ payload });
    expect(res.status).toBe(200);
    expect(res.body.submissionId).toMatch(/^diag_\d{13}_[0-9a-f]{8}$/);

    const row = db.prepare('SELECT * FROM diagnostic_submissions WHERE id = ?').get(res.body.submissionId);
    expect(row.status).toBe('pending');
    expect(row.price_cents).toBe(499);
    expect(row.payload_key_count).toBe(6);
    expect(JSON.parse(row.payload).model).toBe('T680');
  });

  test('rejects a payload missing model with the exact validation error', async () => {
    const res = await request(app).post('/saveSubmission').send({
      payload: { equipmentType: 'marine', symptoms: 'Overheats at 3200 RPM under load' }
    });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: ["Field 'model' is required and must be a non-empty string"]
    });
  });

  test('accepts a description-only submission (real UI: symptom checkboxes are optional)', async () => {
    // Regression for the J1-02 live find: customers who fill only the
    // always-visible description (no symptom checkboxes) were 400-rejected.
    const res = await request(app).post('/saveSubmission').send({
      payload: {
        equipmentType: 'automotive',
        make: 'Toyota',
        model: 'Camry',
        year: '2020',
        symptoms: '',
        problemDescription: 'Check engine light with rough idle, single-cylinder misfire under load.'
      }
    });
    expect(res.status).toBe(200);
    expect(res.body.submissionId).toMatch(/^diag_\d{13}_[0-9a-f]{8}$/);
  });

  test('rejects a submission with neither symptoms nor problemDescription', async () => {
    const res = await request(app).post('/saveSubmission').send({
      payload: { equipmentType: 'automotive', model: 'Camry' }
    });
    expect(res.status).toBe(400);
    expect(res.body.details).toContain(
      "Field 'symptoms' or 'problemDescription' is required and must be a non-empty string"
    );
  });

  test('rejects a non-object contact field', async () => {
    const res = await request(app).post('/saveSubmission').send({
      payload: {
        equipmentType: 'hvac',
        model: 'XR16',
        symptoms: 'Compressor hard-start, breaker trips after 8 minutes',
        contact: 'call me after 5pm'
      }
    });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(res.body.details).toContain("Field 'contact' must be an object if provided");
  });
});

describe('POST /analysisStatus', () => {
  test('returns the stored status for a known submission', async () => {
    insertSubmission('diag_1730421000001_ab12cd34', 'pending', {
      equipmentType: 'automotive', model: 'Silverado 2500HD', symptoms: 'P0301 misfire'
    });
    const res = await request(app).post('/analysisStatus').send({ submissionId: 'diag_1730421000001_ab12cd34' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'pending' });
  });

  test('returns 404 for an unknown submission', async () => {
    const res = await request(app).post('/analysisStatus').send({ submissionId: 'diag_1730421000099_00000000' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Submission not found' });
  });
});

describe('POST /analyzeDiagnostic (mock LLM full run)', () => {
  let analyzedId;

  test('returns 404 for an unknown submission', async () => {
    const res = await request(app).post('/analyzeDiagnostic').send({ submissionId: 'diag_1730421000098_ffffffff' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Submission not found' });
  });

  test('runs analysis end-to-end and returns ok/analysisId/path/status/message', async () => {
    const save = await request(app).post('/saveSubmission').send({
      payload: {
        equipmentType: 'farm-ag',
        make: 'John Deere',
        model: 'S780',
        year: '2019',
        symptoms: 'Rotor loss under load, hydro pressure alarm ALM-114'
      }
    });
    analyzedId = save.body.submissionId;

    const res = await request(app).post('/analyzeDiagnostic').send({ submissionId: analyzedId });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      analysisId: analyzedId,
      path: `/reports/download/${analyzedId}`,
      status: 'processing',
      message: 'Analysis started'
    });

    // Route awaits processAnalysis, so by response time the record is terminal
    const sub = db.prepare('SELECT status, report_url FROM diagnostic_submissions WHERE id = ?').get(analyzedId);
    expect(sub.status).toBe('ready');
    expect(sub.report_url).toBe(`/reports/download/${analyzedId}`);

    const analysis = db.prepare(
      'SELECT status, report_path, model, framework_version, full_analysis FROM analyses WHERE id = ?'
    ).get(analyzedId);
    expect(analysis.status).toBe('ready');
    expect(analysis.report_path).toBe(`reports/${analyzedId}.pdf`);
    // Attribution survives the run (the old INSERT OR REPLACE nulled model)
    expect(analysis.model).toBe('gpt-4o');
    expect(analysis.framework_version).toBe('v2.0');
    expect(analysis.full_analysis).toBe(CANNED_REPORT);

    const pdfPath = path.join(process.env.REPORTS_DIR, `${analyzedId}.pdf`);
    expect(fs.existsSync(pdfPath)).toBe(true);
  }, 60000);

  test('repeat call is idempotent and reports Already processed', async () => {
    const res = await request(app).post('/analyzeDiagnostic').send({ submissionId: analyzedId });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      analysisId: analyzedId,
      path: `/reports/download/${analyzedId}`,
      status: 'ready',
      message: 'Already processed'
    });
  });

  test('GET /reports/download/:id streams the generated PDF as attachment', async () => {
    const res = await request(app)
      .get(`/reports/download/${analyzedId}`)
      .buffer(true)
      .parse(binaryParser);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toBe(`attachment; filename="diagnostic-${analyzedId}.pdf"`);
    expect(res.body.slice(0, 5).toString('ascii')).toBe('%PDF-');
    expect(res.body.length).toBeGreaterThan(10240);
  });

  test('GET /reports/download/:id returns 404 for a missing report', async () => {
    const res = await request(app).get('/reports/download/diag_1730421000097_eeeeeeee');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Report not found' });
  });

  test('POST /getDownloadUrl returns the exact local-URL contract', async () => {
    const res = await request(app).post('/getDownloadUrl').send({ submissionId: analyzedId });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      downloadUrl: `/reports/download/${analyzedId}`,
      viewUrl: `/view/${analyzedId}`,
      expiresInSeconds: 900,
      submissionId: analyzedId,
      reportPath: `reports/${analyzedId}.pdf`,
      local: true
    });
  });

  test('GET /reports/signed-url returns the 3600s local contract', async () => {
    const res = await request(app).get('/reports/signed-url').query({ submissionId: analyzedId });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      downloadUrl: `/reports/download/${analyzedId}`,
      viewUrl: `/view/${analyzedId}`,
      expiresInSeconds: 3600,
      local: true
    });
  });

  test('GET /view/:id streams the PDF inline and records the public view URL', async () => {
    const res = await request(app)
      .get(`/view/${analyzedId}`)
      .buffer(true)
      .parse(binaryParser);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toBe(`inline; filename="diagnostic-report-${analyzedId}.pdf"`);
    expect(res.body.slice(0, 5).toString('ascii')).toBe('%PDF-');

    const analysis = db.prepare('SELECT public_view_url FROM analyses WHERE id = ?').get(analyzedId);
    expect(analysis.public_view_url).toBe(`/view/${analyzedId}`);
  });

  test('GET /reports/status reports ready with download URLs once the PDF exists', async () => {
    const res = await request(app).get('/reports/status').query({ submissionId: analyzedId });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      status: 'ready',
      downloadUrl: `/reports/download/${analyzedId}`,
      viewUrl: `/reports/download/${analyzedId}`,
      local: true
    });
  });
});

describe('not-ready and error paths', () => {
  const pendingId = 'diag_1730421000002_ba98dc76';

  beforeAll(() => {
    insertSubmission(pendingId, 'pending', {
      equipmentType: 'motorcycles', model: 'Road Glide', symptoms: 'Stalls at idle when warm'
    });
  });

  test('POST /getDownloadUrl without submissionId returns 400', async () => {
    const res = await request(app).post('/getDownloadUrl').send({});
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'submissionId is required' });
  });

  test('POST /getDownloadUrl for a pending submission returns not-ready with status echoed', async () => {
    const res = await request(app).post('/getDownloadUrl').send({ submissionId: pendingId });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Report not ready yet', status: 'pending' });
  });

  test('POST /getDownloadUrl for ready submission missing its analysis row returns 404', async () => {
    const orphanId = 'diag_1730421000003_11aa22bb';
    insertSubmission(orphanId, 'ready', { equipmentType: 'rvs', model: 'Bounder 35K', symptoms: 'Onan genset ERR-42' });
    const res = await request(app).post('/getDownloadUrl').send({ submissionId: orphanId });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Analysis record not found' });
  });

  test('GET /view/:id for a pending submission returns not-ready', async () => {
    const res = await request(app).get(`/view/${pendingId}`);
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Report not ready yet', status: 'pending' });
  });

  test('GET /reports/status returns 202 processing when no PDF exists yet', async () => {
    const res = await request(app).get('/reports/status').query({ submissionId: pendingId });
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ status: 'processing', submissionStatus: 'pending' });
  });

  test('GET /reports/status returns 404 not_found for an unknown diag_ id', async () => {
    const res = await request(app).get('/reports/status').query({ submissionId: 'diag_1730421000096_dddddddd' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ status: 'not_found' });
  });

  test('GET /reports/status rejects ids without the diag_ prefix', async () => {
    const res = await request(app).get('/reports/status').query({ submissionId: 'sub-8842' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid submissionId', code: 'BAD_ID' });
  });
});

describe('POST /reports/ensure', () => {
  test('rejects ids without the diag_ prefix', async () => {
    const res = await request(app).post('/reports/ensure').send({ submissionId: 'order-4471' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid submissionId', code: 'BAD_ID' });
  });

  test('returns 404 NOT_FOUND for an unknown submission', async () => {
    const res = await request(app).post('/reports/ensure').send({ submissionId: 'diag_1730421000095_cccccccc' });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Submission not found', code: 'NOT_FOUND' });
  });

  test('answers ready immediately when the PDF already exists on disk', async () => {
    const existing = fs.readdirSync(process.env.REPORTS_DIR).find((f) => f.endsWith('.pdf'));
    const id = existing.replace(/\.pdf$/, '');
    const res = await request(app).post('/reports/ensure').send({ submissionId: id });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ready' });
  });

  test('requeues a failed submission, bumps retry_count and regenerates the report', async () => {
    const failedId = 'diag_1730421000004_77ee88ff';
    insertSubmission(failedId, 'failed', {
      equipmentType: 'compact-equipment',
      make: 'Bobcat',
      model: 'T650',
      symptoms: 'Hydraulic drive sluggish, flash code 3-2 on display'
    });

    const res = await request(app).post('/reports/ensure').send({ submissionId: failedId });
    expect(res.status).toBe(202);
    expect(res.body).toEqual({ status: 'processing' });

    await pollUntilStatus(failedId, 'ready');
    const row = db.prepare('SELECT retry_count FROM diagnostic_submissions WHERE id = ?').get(failedId);
    expect(row.retry_count).toBe(1);
    expect(fs.existsSync(path.join(process.env.REPORTS_DIR, `${failedId}.pdf`))).toBe(true);
  }, 60000);
});
