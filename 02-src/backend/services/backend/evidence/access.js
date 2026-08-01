/**
 * Per-submission capability tokens for customer evidence routes.
 *
 * The browser receives the token once from /saveSubmission. Only its hash is
 * persisted, so a database read does not disclose a usable evidence token.
 */

const crypto = require('crypto');

const EVIDENCE_TOKEN_HEADER = 'x-evidence-token';
const EVIDENCE_TOKEN_BYTES = 32;

function createEvidenceToken() {
  return crypto.randomBytes(EVIDENCE_TOKEN_BYTES).toString('base64url');
}

function hashEvidenceToken(token) {
  return crypto.createHash('sha256').update(String(token || ''), 'utf8').digest('hex');
}

function isEvidenceTokenValid(storedHash, providedToken) {
  if (!storedHash || !providedToken) return false;
  const expected = Buffer.from(String(storedHash), 'hex');
  const actual = Buffer.from(hashEvidenceToken(String(providedToken).trim()), 'hex');
  if (expected.length !== actual.length || expected.length === 0) return false;
  return crypto.timingSafeEqual(expected, actual);
}

module.exports = {
  EVIDENCE_TOKEN_HEADER,
  EVIDENCE_TOKEN_BYTES,
  createEvidenceToken,
  hashEvidenceToken,
  isEvidenceTokenValid
};
