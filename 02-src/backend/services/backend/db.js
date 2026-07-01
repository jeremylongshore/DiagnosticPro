const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'diagnosticpro.db');

let db;

/**
 * Get singleton SQLite DB (braves-style).
 * Initializes schema on first access with WAL mode.
 */
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    console.log(`[db] SQLite initialized at ${DB_PATH}`);
  }
  return db;
}

function initSchema(db) {
  db.exec(`
    -- Main diagnostic submissions (flexible payload kept as JSON for compatibility)
    CREATE TABLE IF NOT EXISTS diagnostic_submissions (
      id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',
      price_cents INTEGER DEFAULT 499,
      payload TEXT,                 -- full original payload as JSON string
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

    CREATE INDEX IF NOT EXISTS idx_submissions_status ON diagnostic_submissions(status);
    CREATE INDEX IF NOT EXISTS idx_submissions_created ON diagnostic_submissions(created_at);
    CREATE INDEX IF NOT EXISTS idx_submissions_email ON diagnostic_submissions(json_extract(payload, '$.email'));

    -- Analysis results (linked by submission id)
    CREATE TABLE IF NOT EXISTS analyses (
      id TEXT PRIMARY KEY,           -- same as submission id
      submission_id TEXT NOT NULL,
      status TEXT,
      full_analysis TEXT,
      sections TEXT,                 -- parsed sections as JSON
      report_path TEXT,
      detected_codes TEXT,           -- JSON array
      public_view_url TEXT,
      last_viewed_at TEXT,
      last_error TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_analyses_submission ON analyses(submission_id);
    CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);

    -- Whop user records (tokens stored as in original; move to secrets rotation if needed)
    CREATE TABLE IF NOT EXISTS whop_users (
      id TEXT PRIMARY KEY,
      whop_id TEXT,
      username TEXT,
      email TEXT,
      is_member INTEGER DEFAULT 0,
      membership_id TEXT,
      access_token TEXT,
      refresh_token TEXT,
      last_verified TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_whop_email ON whop_users(email);
  `);
}

/**
 * Helper to run a transaction.
 * Usage: withTransaction(() => { ... })
 */
function withTransaction(fn) {
  const database = getDb();
  const transaction = database.transaction(fn);
  return transaction();
}

/**
 * Close DB (for tests/shutdown).
 */
function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  getDb,
  withTransaction,
  closeDb,
  DB_PATH
};