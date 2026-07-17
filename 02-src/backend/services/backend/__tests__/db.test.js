// Tests for self-hosted SQLite layer (db.js) - part of /implement-tests

const { getDb, closeDb } = require('../db');

describe('SQLite DB layer (self-host migration)', () => {
  afterAll(() => {
    closeDb();
  });

  test('getDb initializes and creates tables', () => {
    const db = getDb();
    expect(db).toBeDefined();

    // Check tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map(t => t.name);
    expect(tableNames).toContain('diagnostic_submissions');
    expect(tableNames).toContain('analyses');
    expect(tableNames).toContain('whop_users');
  });

  test('can insert and query a submission', () => {
    const db = getDb();
    const now = new Date().toISOString();
    const testId = 'test_diag_' + Date.now();
    const stmt = db.prepare(`
      INSERT INTO diagnostic_submissions (id, status, payload, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(testId, 'pending', JSON.stringify({equipmentType: 'auto'}), now, now);

    const row = db.prepare('SELECT * FROM diagnostic_submissions WHERE id = ?').get(testId);
    expect(row).toBeDefined();
    expect(row.status).toBe('pending');
    expect(JSON.parse(row.payload).equipmentType).toBe('auto');
  });
});