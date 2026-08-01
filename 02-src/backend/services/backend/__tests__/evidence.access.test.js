const {
  EVIDENCE_TOKEN_BYTES,
  createEvidenceToken,
  hashEvidenceToken,
  isEvidenceTokenValid
} = require('../evidence/access');

describe('evidence access tokens', () => {
  test('creates high-entropy tokens and validates only the matching value', () => {
    const token = createEvidenceToken();
    const hash = hashEvidenceToken(token);

    expect(Buffer.byteLength(token, 'utf8')).toBeGreaterThan(EVIDENCE_TOKEN_BYTES);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(isEvidenceTokenValid(hash, token)).toBe(true);
    expect(isEvidenceTokenValid(hash, `${token}x`)).toBe(false);
    expect(isEvidenceTokenValid(hash, '')).toBe(false);
  });

  test('fails closed for malformed or missing stored hashes', () => {
    const token = createEvidenceToken();
    expect(isEvidenceTokenValid(null, token)).toBe(false);
    expect(isEvidenceTokenValid('not-a-hash', token)).toBe(false);
    expect(isEvidenceTokenValid('00', token)).toBe(false);
  });
});
