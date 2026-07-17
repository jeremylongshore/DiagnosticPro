// Basic tests for new self-host logic (SQLite + DeepSeek era)
// Run with: cd 02-src/backend/services/backend && npm test

jest.mock('openai');
jest.mock('../config/secrets.js', () => ({ loadSecrets: jest.fn() }));

const { parseFullAnalysis, extractDiagnosticCodes } = require('../index.js');

describe('Analysis parsing (post-Firestore migration)', () => {
  test('parseFullAnalysis extracts sections from LLM output', () => {
    const sample = `
1. PRIMARY DIAGNOSIS
Root cause is X.

2. DIFFERENTIAL DIAGNOSIS
- Alt 1
- Alt 2
`;

    const result = parseFullAnalysis(sample);
    expect(result.primaryDiagnosis).toContain('Root cause is X');
    expect(result.differentialDiagnosis).toEqual(['Alt 1', 'Alt 2']);
  });

  test('extractDiagnosticCodes finds OBD-II and SPN codes', () => {
    const payload = {
      symptoms: 'P0171 and SPN 520198 FMI 7 code',
      errorCodes: 'check engine'
    };
    const codes = extractDiagnosticCodes(payload);
    expect(codes).toContain('P0171');
    expect(codes.some(c => c.includes('SPN520198'))).toBe(true);
  });

  test('parseFullAnalysis handles empty', () => {
    expect(parseFullAnalysis('')).toEqual({});
  });
});