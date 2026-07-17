/**
 * Orphan photo-evidence sweeper.
 *
 * Boot pass + periodic interval: for each `pending` submission older than
 * EVIDENCE_ORPHAN_TTL_HOURS, delete every evidence row + private file under
 * the configured uploads dir. Pending = never paid within the TTL window.
 *
 * Pure (deps-injected). startSweeper wires the production interval.
 */

const fs = require('fs');
const path = require('path');
const { isOrphanPending, DEFAULT_ORPHAN_TTL_HOURS } = require('./promptEvidence');

const DEFAULT_INTERVAL_MS = 15 * 60 * 1000; // 15 min

/**
 * @param {object} args
 * @param {{ prepare: Function, transaction: Function }} args.db
 * @param {string} args.uploadsDir
 * @param {Date|string|number} [args.now]
 * @param {number} [args.ttlHours]
 * @param {(row) => string} [args.resolveFilePath] - default: path.join(uploadsDir, row.path)
 * @param {(msg: object) => void} [args.log]
 * @returns {{ scanned: number, deletedRows: number, deletedFiles: number, errors: Array }}
 */
function purgeOrphans({ db, uploadsDir, now = Date.now(), ttlHours = DEFAULT_ORPHAN_TTL_HOURS, resolveFilePath, log }) {
  const errors = [];
  let scanned = 0;
  let deletedRows = 0;
  let deletedFiles = 0;

  if (!db || typeof db.prepare !== 'function') {
    return { scanned, deletedRows, deletedFiles, errors: [{ error: 'no_db' }] };
  }
  if (!uploadsDir) {
    return { scanned, deletedRows, deletedFiles, errors: [{ error: 'no_uploads_dir' }] };
  }

  const resolvePath = resolveFilePath || ((row) => path.join(uploadsDir, row.path));

  // Find pending submissions older than TTL.
  const candidates = db.prepare(
    "SELECT id, status, created_at FROM diagnostic_submissions WHERE status = 'pending'"
  ).all();

  const orphanIds = [];
  for (const row of candidates) {
    if (isOrphanPending(row, now, ttlHours)) orphanIds.push(row.id);
  }

  for (const submissionId of orphanIds) {
    const evidenceRows = db.prepare(
      "SELECT id, path, status FROM evidence WHERE submission_id = ?"
    ).all(submissionId);
    scanned += evidenceRows.length;
    for (const ev of evidenceRows) {
      try {
        // Best-effort file delete; missing files are not an error.
        const filePath = resolvePath(ev);
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedFiles += 1;
        }
        db.prepare("DELETE FROM evidence WHERE id = ?").run(ev.id);
        deletedRows += 1;
      } catch (err) {
        errors.push({ submissionId, evidenceId: ev.id, error: err?.message || String(err) });
      }
    }
    if (log) {
      log({
        phase: 'evidenceSweep',
        status: 'ok',
        submissionId,
        deletedRows,
        deletedFiles
      });
    }
  }

  return { scanned, deletedRows, deletedFiles, errors };
}

/**
 * Wire a recurring interval. Returns a stop() function. Boot pass runs once
 * synchronously (catching errors silently — sweeps are best-effort and must
 * never crash the process).
 *
 * @param {object} args
 * @param {{ prepare: Function }} args.db
 * @param {string} args.uploadsDir
 * @param {number} [args.intervalMs]
 * @param {number} [args.ttlHours]
 * @param {(msg: object) => void} [args.log]
 */
function startSweeper({ db, uploadsDir, intervalMs = DEFAULT_INTERVAL_MS, ttlHours = DEFAULT_ORPHAN_TTL_HOURS, log }) {
  const safeRun = (now) => {
    try {
      const result = purgeOrphans({ db, uploadsDir, now, ttlHours, log });
      if (log && (result.deletedRows > 0 || result.errors.length > 0)) {
        log({
          phase: 'evidenceSweepCycle',
          status: result.errors.length ? 'partial' : 'ok',
          scanned: result.scanned,
          deletedRows: result.deletedRows,
          deletedFiles: result.deletedFiles,
          errors: result.errors.length
        });
      }
    } catch (err) {
      if (log) log({ phase: 'evidenceSweepCycle', status: 'error', error: err?.message || String(err) });
    }
  };
  // Boot pass: run once but never block startup.
  safeRun(new Date());
  const handle = setInterval(() => safeRun(new Date()), intervalMs);
  if (typeof handle.unref === 'function') handle.unref();
  return () => clearInterval(handle);
}

module.exports = {
  purgeOrphans,
  startSweeper,
  DEFAULT_INTERVAL_MS
};