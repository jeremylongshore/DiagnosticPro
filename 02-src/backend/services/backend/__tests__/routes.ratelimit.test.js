// P0 route test (REQ-012): the /saveSubmission limiter allows 10 requests per
// minute per IP; the 11th gets 429 RATE_LIMITED. Lives in its own file so no
// other test spends the shared in-memory limiter budget for this app instance.

const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'diagpro-ratelimit-'));
process.env.DB_PATH = path.join(tmpRoot, 'test.db');
process.env.REPORTS_DIR = path.join(tmpRoot, 'reports');

const request = require('supertest');
const app = require('../index.js');
const { closeDb } = require('../db');

afterAll(() => {
  closeDb();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('POST /saveSubmission rate limiting', () => {
  test('accepts 10 submissions per minute from one IP, then rejects the 11th with RATE_LIMITED', async () => {
    for (let i = 1; i <= 10; i++) {
      const res = await request(app).post('/saveSubmission').send({
        payload: {
          equipmentType: 'marine',
          make: 'Yamaha',
          model: `F${140 + i} outboard`,
          symptoms: `Rough idle below 900 RPM, run ${i} of soak test`
        }
      });
      expect(res.status).toBe(200);
      expect(res.body.submissionId).toMatch(/^diag_\d{13}_[0-9a-f]{8}$/);
    }

    const blocked = await request(app).post('/saveSubmission').send({
      payload: {
        equipmentType: 'marine',
        make: 'Yamaha',
        model: 'F151 outboard',
        symptoms: 'Rough idle below 900 RPM, run 11 of soak test'
      }
    });
    expect(blocked.status).toBe(429);
    expect(blocked.body).toEqual({
      error: 'Too many submissions, try again later',
      code: 'RATE_LIMITED'
    });
  }, 30000);
});
