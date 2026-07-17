// P0 regression tests: migrateSchema (via getDb) must upgrade a live DB
// created from the OLD pre-payments schema — adding the Stripe/Whop columns
// without touching existing rows — and must be idempotent across boots.

const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'diagpro-migration-'));
const dbPath = path.join(tmpRoot, 'legacy.db');
process.env.DB_PATH = dbPath;

const Database = require('better-sqlite3');

// Build the OLD schema (no stripe_session_id / paid_at / whop_* columns on
// diagnostic_submissions; no model / req_id / paid_via on analyses; no
// whop_users table) with one live row, then boot db.js against it.
const legacy = new Database(dbPath);
legacy.exec(`
  CREATE TABLE diagnostic_submissions (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'pending',
    price_cents INTEGER DEFAULT 499,
    payload TEXT,
    req_id TEXT,
    ui_version TEXT,
    payload_key_count INTEGER,
    report_url TEXT,
    completed_at TEXT,
    analysis_summary TEXT,
    processing_started_at TEXT,
    last_error TEXT,
    error_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE analyses (
    id TEXT PRIMARY KEY,
    submission_id TEXT NOT NULL,
    status TEXT,
    full_analysis TEXT,
    sections TEXT,
    report_path TEXT,
    detected_codes TEXT,
    public_view_url TEXT,
    last_viewed_at TEXT,
    last_error TEXT,
    created_at TEXT,
    updated_at TEXT
  );
`);
legacy.prepare(`
  INSERT INTO diagnostic_submissions (id, status, payload, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?)
`).run(
  'diag_1699999990000_4e5f6a7b',
  'ready',
  JSON.stringify({ equipmentType: 'rvs', make: 'Fleetwood', model: 'Bounder 35K', symptoms: 'Onan genset ERR-42 under load' }),
  '2025-11-14T09:30:00.000Z',
  '2025-11-14T09:45:00.000Z'
);
legacy.close();

const { getDb, closeDb } = require('../db');

const NEW_SUBMISSION_COLUMNS = [
  'stripe_session_id',
  'paid_at',
  'amount_paid_cents',
  'retry_count',
  'paid_via',
  'whop_user_id',
  'whop_membership_id',
  'used_with_membership',
  'charged'
];
const NEW_ANALYSES_COLUMNS = ['model', 'req_id', 'paid_via'];

function columnNames(db, table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
}

afterAll(() => {
  closeDb();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

describe('migrateSchema against a legacy database', () => {
  test('adds every payment and Whop column to diagnostic_submissions', () => {
    const db = getDb();
    const cols = columnNames(db, 'diagnostic_submissions');
    for (const col of NEW_SUBMISSION_COLUMNS) {
      expect(cols).toContain(col);
    }
  });

  test('adds model, req_id and paid_via to analyses', () => {
    const db = getDb();
    const cols = columnNames(db, 'analyses');
    for (const col of NEW_ANALYSES_COLUMNS) {
      expect(cols).toContain(col);
    }
  });

  test('creates the whop_users table absent from the legacy schema', () => {
    const db = getDb();
    const table = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='whop_users'")
      .get();
    expect(table).toEqual({ name: 'whop_users' });
  });

  test('preserves legacy rows with the new columns defaulting to null', () => {
    const db = getDb();
    const row = db
      .prepare('SELECT * FROM diagnostic_submissions WHERE id = ?')
      .get('diag_1699999990000_4e5f6a7b');
    expect(row.status).toBe('ready');
    expect(JSON.parse(row.payload).model).toBe('Bounder 35K');
    expect(row.created_at).toBe('2025-11-14T09:30:00.000Z');
    expect(row.stripe_session_id).toBe(null);
    expect(row.paid_at).toBe(null);
    expect(row.whop_membership_id).toBe(null);
  });

  test('index.js webhook write path works against the migrated table', () => {
    const db = getDb();
    db.prepare(`
      UPDATE diagnostic_submissions
      SET status = 'paid', updated_at = ?, stripe_session_id = ?, paid_at = ?, amount_paid_cents = ?
      WHERE id = ?
    `).run('2026-07-01T12:00:00.000Z', 'cs_test_migr8Xy', '2026-07-01T12:00:00.000Z', 1299, 'diag_1699999990000_4e5f6a7b');

    const row = db
      .prepare('SELECT status, stripe_session_id, amount_paid_cents FROM diagnostic_submissions WHERE id = ?')
      .get('diag_1699999990000_4e5f6a7b');
    expect(row.status).toBe('paid');
    expect(row.stripe_session_id).toBe('cs_test_migr8Xy');
    expect(row.amount_paid_cents).toBe(1299);
  });

  test('second boot over the migrated file is idempotent', () => {
    const before = columnNames(getDb(), 'diagnostic_submissions');
    closeDb();

    const db2 = getDb(); // re-runs initSchema + migrateSchema on the same file
    const after = columnNames(db2, 'diagnostic_submissions');
    expect(after).toEqual(before);
    expect(after.filter((c) => c === 'stripe_session_id')).toHaveLength(1);
  });
});
