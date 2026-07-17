// T1: evidence/sweeper.js — purgeOrphans (pure, deps-injected) +
// startSweeper (boot pass + interval, frozen-clock interactions).
// Mocking boundary: a fake better-sqlite3-shaped `db` + a tmp uploads dir
// for the real filesystem interactions.

const fs = require('fs');
const os = require('os');
const path = require('path');
const { purgeOrphans, startSweeper } = require('../evidence/sweeper.js');

function makeFakeDb({ submissions = [], evidence = [] } = {}) {
  const calls = [];
  const all = { submissions: submissions.slice(), evidence: evidence.slice() };
  function findPendingAll() {
    return all.submissions.filter((s) => s.status === 'pending').slice();
  }
  function findEvidenceFor(submissionId) {
    return all.evidence.filter((e) => e.submission_id === submissionId).slice();
  }
  return {
    _all: all,
    _calls: calls,
    prepare: (sql) => {
      calls.push(sql);
      return {
        all: (submissionId) => {
          if (sql.includes("WHERE status = 'pending'")) return findPendingAll();
          if (sql.includes('FROM evidence WHERE submission_id =')) return findEvidenceFor(submissionId);
          return [];
        },
        run: (...args) => {
          if (sql.startsWith('DELETE FROM evidence WHERE id')) {
            const id = args[0];
            all.evidence = all.evidence.filter((e) => e.id !== id);
            return { changes: 1 };
          }
          return { changes: 0 };
        }
      };
    }
  };
}

function writeUploads(uploadsDir, items) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  for (const item of items) {
    const full = path.join(uploadsDir, item.path);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, 'data');
  }
}

describe('purgeOrphans', () => {
  test('removes file + row for orphans, leaves fresh rows alone', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dpro-sweep-'));
    const uploadsDir = path.join(tmp, 'uploads');
    const now = new Date('2026-07-17T00:00:00Z').getTime();
    writeUploads(uploadsDir, [
      { id: 'ev_old', path: 'sub_old/ev_a.png' },
      { id: 'ev_fresh', path: 'sub_fresh/ev_b.png' }
    ]);
    const db = makeFakeDb({
      submissions: [
        { id: 'sub_old', status: 'pending', created_at: new Date(now - 60 * 3600 * 1000).toISOString() }, // 60h ago
        { id: 'sub_fresh', status: 'pending', created_at: new Date(now - 1 * 3600 * 1000).toISOString() } // 1h ago
      ],
      evidence: [
        { id: 'ev_old', submission_id: 'sub_old', path: 'sub_old/ev_a.png', status: 'uploaded' },
        { id: 'ev_fresh', submission_id: 'sub_fresh', path: 'sub_fresh/ev_b.png', status: 'uploaded' }
      ]
    });
    const result = purgeOrphans({ db, uploadsDir, now, ttlHours: 48 });
    expect(result).toMatchObject({ scanned: 1, deletedRows: 1, deletedFiles: 1, errors: [] });
    expect(fs.existsSync(path.join(uploadsDir, 'sub_old/ev_a.png'))).toBe(false);
    expect(fs.existsSync(path.join(uploadsDir, 'sub_fresh/ev_b.png'))).toBe(true);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('treats missing file as not an error and still deletes the row', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dpro-sweep-'));
    const uploadsDir = path.join(tmp, 'uploads');
    const now = Date.now();
    const db = makeFakeDb({
      submissions: [
        { id: 'sub_x', status: 'pending', created_at: new Date(now - 72 * 3600 * 1000).toISOString() }
      ],
      evidence: [{ id: 'ev_x', submission_id: 'sub_x', path: 'never_existed.png', status: 'uploaded' }]
    });
    const result = purgeOrphans({ db, uploadsDir, now, ttlHours: 48 });
    expect(result.errors).toEqual([]);
    expect(result.deletedRows).toBe(1);
    expect(result.deletedFiles).toBe(0);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('ignores non-pending submissions entirely', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dpro-sweep-'));
    const uploadsDir = path.join(tmp, 'uploads');
    const now = Date.now();
    const db = makeFakeDb({
      submissions: [
        { id: 'sub_paid', status: 'paid', created_at: new Date(now - 200 * 3600 * 1000).toISOString() },
        { id: 'sub_ready', status: 'ready', created_at: new Date(now - 200 * 3600 * 1000).toISOString() }
      ],
      evidence: [
        { id: 'ev_paid', submission_id: 'sub_paid', path: 'p.png', status: 'ready' },
        { id: 'ev_ready', submission_id: 'sub_ready', path: 'r.png', status: 'ready' }
      ]
    });
    const result = purgeOrphans({ db, uploadsDir, now, ttlHours: 48 });
    expect(result.scanned).toBe(0);
    expect(result.deletedRows).toBe(0);
    expect(db._all.evidence).toHaveLength(2);
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('errors-out gracefully when db is missing or uploadsDir is undefined', () => {
    const noDb = purgeOrphans({ db: null, uploadsDir: '/tmp', now: Date.now() });
    expect(noDb.errors).toEqual([{ error: 'no_db' }]);
    const noDir = purgeOrphans({ db: makeFakeDb(), uploadsDir: null, now: Date.now() });
    expect(noDir.errors).toEqual([{ error: 'no_uploads_dir' }]);
  });

  test('isolates per-row failures into errors[] without aborting the batch', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dpro-sweep-'));
    const uploadsDir = path.join(tmp, 'uploads');
    const now = Date.now();
    const db = makeFakeDb({
      submissions: [
        { id: 'sub_o', status: 'pending', created_at: new Date(now - 100 * 3600 * 1000).toISOString() }
      ],
      evidence: [
        { id: 'ev_a', submission_id: 'sub_o', path: 'a.png', status: 'uploaded' },
        { id: 'ev_b', submission_id: 'sub_o', path: 'b.png', status: 'uploaded' }
      ]
    });
    // Stub prepare to throw on the unlink for ev_a only by intercepting.
    const origPrepare = db.prepare;
    let first = false;
    db.prepare = (sql) => {
      const stmt = origPrepare(sql);
      if (sql.startsWith('DELETE FROM evidence WHERE id')) {
        return {
          run: (id) => {
            if (id === 'ev_a' && !first) {
              first = true;
              throw new Error('disk full');
            }
            db._all.evidence = db._all.evidence.filter((e) => e.id !== id);
            return { changes: 1 };
          }
        };
      }
      return stmt;
    };
    const result = purgeOrphans({ db, uploadsDir, now, ttlHours: 48 });
    expect(result.errors).toEqual([{ submissionId: 'sub_o', evidenceId: 'ev_a', error: 'disk full' }]);
    expect(result.deletedRows).toBe(1); // ev_b succeeded
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});

describe('startSweeper', () => {
  test('runs once on construction (boot pass) and stops on demand', () => {
    jest.useFakeTimers();
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dpro-sweep-'));
    const uploadsDir = path.join(tmp, 'uploads');
    const now = Date.now();
    const db = makeFakeDb({
      submissions: [
        { id: 'sub_old', status: 'pending', created_at: new Date(now - 100 * 3600 * 1000).toISOString() }
      ],
      evidence: [{ id: 'ev_o', submission_id: 'sub_old', path: 'o.png', status: 'uploaded' }]
    });
    writeUploads(uploadsDir, [{ id: 'ev_o', path: 'o.png' }]);

    const log = jest.fn();
    const stop = startSweeper({ db, uploadsDir, now, ttlHours: 48, intervalMs: 1000, log });
    expect(db._all.evidence).toEqual([]);
    stop();
    jest.useRealTimers();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test('never throws even when the boot pass itself crashes', () => {
    const log = jest.fn();
    const badDb = { prepare: () => { throw new Error('boom'); } };
    expect(() => startSweeper({ db: badDb, uploadsDir: '/tmp', now: Date.now(), ttlHours: 48, log, intervalMs: 1000 })).not.toThrow();
    const errLog = log.mock.calls.find((c) => c[0]?.status === 'error');
    expect(errLog).toBeTruthy();
  });
});