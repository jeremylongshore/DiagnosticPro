// P0 unit tests: callLLM prompt contract + return shape. Mocks the `openai`
// module (the dependency), never callLLM itself. Also pins down
// extractDiagnosticCodes edge cases beyond analysis.test.js.

const os = require('os');
const fs = require('fs');
const path = require('path');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'diagpro-llm-'));
process.env.DB_PATH = path.join(tmpRoot, 'test.db');
process.env.REPORTS_DIR = path.join(tmpRoot, 'reports');

// Deterministic key resolution: no real provider keys
delete process.env.LLM_FRAMEWORK_VERSION;
delete process.env.OPENAI_API_KEY;
delete process.env.DEEPSEEK_API_KEY;
delete process.env.GROQ_API_KEY;
delete process.env.LLM_BASE_URL;
delete process.env.LLM_MODEL;
process.env.LLM_API_KEY = 'sk-unit-test-fake-key-not-real';

const mockCreate = jest.fn();
jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: (...args) => mockCreate(...args) } }
  }))
);

const OpenAI = require('openai');
const { callLLM, extractDiagnosticCodes } = require('../index.js');
const { closeDb } = require('../db');

afterAll(() => {
  closeDb();
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

beforeEach(() => {
  mockCreate.mockReset();
});

describe('callLLM with the OpenAI client mocked', () => {
  const semiPayload = {
    equipmentType: 'semi-trucks',
    make: 'Kenworth',
    model: 'T680',
    year: '2017',
    symptoms: 'Derate active, SPN 3216 FMI 4 on the dash',
    problemDescription: 'Power drops to 5 mph after 20 minutes on I-69C'
  };

  test('returns the model text verbatim with the fixed metadata shape', async () => {
    const modelText = '1. PRIMARY DIAGNOSIS\nOutlet NOx sensor circuit fault. Confidence 88%.';
    mockCreate.mockResolvedValue({ choices: [{ message: { content: modelText } }] });

    const result = await callLLM(semiPayload);

    expect(result.fullAnalysis).toBe(modelText);
    expect(result.summary).toBe('Comprehensive 15-section diagnostic analysis completed');
    expect(result.confidence).toBe(0.92);
    expect(result.detectedCodes).toEqual(['SPN3216/FMI4']);
  });

  test('sends the gpt-4o request with the documented sampling parameters', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'report' } }] });

    await callLLM(semiPayload);

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const req = mockCreate.mock.calls[0][0];
    expect(req.model).toBe('gpt-4o');
    expect(req.max_tokens).toBe(8192);
    expect(req.temperature).toBe(0.25);
    expect(req.messages).toHaveLength(2);
    expect(req.messages[0].role).toBe('system');
    expect(req.messages[1].role).toBe('user');
  });

  test('builds the semi-truck prompt frame and injects the extracted J1939 code', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'report' } }] });

    await callLLM(semiPayload);

    const prompt = mockCreate.mock.calls[0][0].messages[1].content;
    expect(prompt).toContain('Class 8 commercial vehicle technician');
    expect(prompt).toContain('Extracted Error Codes: SPN3216/FMI4');
    expect(prompt).toContain('Kenworth T680 2017');
  });

  test('falls back to the generic technician frame for an unknown equipment type', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'report' } }] });

    await callLLM({
      equipmentType: 'submarine',
      make: 'Electric Boat',
      model: 'NR-1',
      symptoms: 'Ballast pump chatter at depth'
    });

    const prompt = mockCreate.mock.calls[0][0].messages[1].content;
    expect(prompt).toContain('Approach this as an experienced technician diagnosing');
    expect(prompt).toContain('Extracted Error Codes: None auto-detected');
  });

  test('constructs the client against the default OpenAI base URL with the configured key', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'report' } }] });

    await callLLM(semiPayload);

    expect(OpenAI).toHaveBeenCalledWith({
      apiKey: 'sk-unit-test-fake-key-not-real',
      baseURL: 'https://api.openai.com/v1'
    });
  });

  test('returns an empty fullAnalysis when the provider sends no choices', async () => {
    mockCreate.mockResolvedValue({});

    const result = await callLLM(semiPayload);

    expect(result.fullAnalysis).toBe('');
    expect(result.confidence).toBe(0.92);
  });

  test('default framework v2.0 sends the original prompt with no exemplar', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'report' } }] });

    await callLLM(semiPayload);

    const req = mockCreate.mock.calls[0][0];
    expect(req.messages[0].content).toBe(
      "You are DiagnosticPro's MASTER TECHNICIAN. Output ONLY the requested 15-section report with no extra preamble or markdown wrappers beyond the numbered headings."
    );
    expect(req.messages[1].content).not.toContain('BEGIN EXEMPLAR');
    expect(req.messages[1].content).toContain('Return your response as a comprehensive diagnostic report');
  });

  test('LLM_FRAMEWORK_VERSION=v3.0 selects the v3-b few-shot prompt with all placeholders substituted', async () => {
    mockCreate.mockResolvedValue({ choices: [{ message: { content: 'report' } }] });
    process.env.LLM_FRAMEWORK_VERSION = 'v3.0';
    try {
      await callLLM(semiPayload);

      const req = mockCreate.mock.calls[0][0];
      // system carries the exemplar-handling contract
      expect(req.messages[0].content).toContain('REFERENCE EXEMPLAR');
      const user = req.messages[1].content;
      // the embedded exemplar + its anti-copy fencing are present
      expect(user).toContain('=== BEGIN EXEMPLAR');
      expect(user).toContain('=== END EXEMPLAR ===');
      // v3-only authoring rule 8 (dash bullets — parser protection)
      expect(user).toContain('use "-" dash bullets only');
      // preamble ban closing instruction
      expect(user).toContain('Begin your response with the line "1. PRIMARY DIAGNOSIS"');
      // placeholders substituted with the SAME context v2 uses
      expect(user).toContain('Class 8 commercial vehicle technician');   // {{DIAGNOSTIC_FRAME}}
      expect(user).toContain('Extracted Error Codes: SPN3216/FMI4');     // {{CUSTOMER_DATA_BLOCK}}
      expect(user).toContain('Kenworth T680 2017');
      expect(user).not.toMatch(/\{\{[A-Z_]+\}\}/);                        // nothing unresolved
      // the 15-section contract survives intact
      expect(user).toContain('15. NEXT STEPS SUMMARY');
    } finally {
      delete process.env.LLM_FRAMEWORK_VERSION;
    }
  });

  test('throws the no-key error when no provider key is configured at all', async () => {
    const savedKey = process.env.LLM_API_KEY;
    delete process.env.LLM_API_KEY;
    try {
      await expect(callLLM(semiPayload)).rejects.toThrow(
        'No LLM_API_KEY (or DEEPSEEK_API_KEY) configured'
      );
      expect(mockCreate).not.toHaveBeenCalled();
    } finally {
      process.env.LLM_API_KEY = savedKey;
    }
  });
});

describe('extractDiagnosticCodes edge cases', () => {
  test('normalizes equipment fault codes and blink codes', () => {
    const codes = extractDiagnosticCodes({
      symptoms: 'Display shows ERR-42, then flash code 3-2 on the hour meter',
      troubleshootingSteps: 'Cleared FAULT 118 twice, it returns after restart'
    });
    expect(codes).toContain('ERR-42');
    expect(codes).toContain('FLASH:3-2');
    expect(codes).toContain('FAULT118');
  });

  test('does not false-positive on model names like F-150 or the word E-mail', () => {
    const codes = extractDiagnosticCodes({
      symptoms: 'My F-150 stalls; send E-mail updates please',
      problemDescription: 'No warning lights on the dash'
    });
    expect(codes).toEqual([]);
  });

  test('recurses into nested objects and arrays for OBD-II codes', () => {
    const codes = extractDiagnosticCodes({
      errorCodes: { scanner: ['Stored: P0420', 'Pending: C0035'] },
      modifications: 'None'
    });
    expect(codes).toEqual(expect.arrayContaining(['P0420', 'C0035']));
    expect(codes).toHaveLength(2);
  });
});
