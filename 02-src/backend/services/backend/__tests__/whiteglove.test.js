// Whiteglove markdown builder + optional live pandoc render.
const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  buildReportMarkdown,
  canRenderWhiteglove,
  generateWhiteglovePDF,
  SECTION_ORDER,
} = require('../reportWhiteglove.js');

const submission = {
  id: 'diag_1730421300001_9f3ce210',
  make: 'Kenworth',
  model: 'T680',
  year: '2017',
  equipment_type: 'semi-trucks',
  full_name: 'Dana Dispatch',
  email: 'dispatch@kenworthfleet.com',
  problem_description: 'Derate after 20 minutes; DEF gauge full.',
  symptoms: ['Derate to 5 mph', 'DEF warning lamp'],
  error_codes: ['SPN4364/FMI18', 'SPN3216/FMI4'],
  shop_quote_amount: '4800',
};

const analysis = {
  primaryDiagnosis: 'Contaminated DEF doser valve is the leading cause. Confidence 88%.',
  differentialDiagnosis: ['DEF contamination', 'Outlet NOx sensor drift'],
  nextStepsSummary: ['Test DEF concentration', 'Demand NOx conversion data'],
};

describe('whiteglove report markdown (REQ-005 alignment)', () => {
  test('emits all 15 section headings and the intake summary table', () => {
    const md = buildReportMarkdown(submission, analysis);
    expect(md).toContain('# DiagnosticPro Report');
    expect(md).toContain('| Field | Value |');
    expect(md).toContain('Kenworth');
    // No pandoc title metadata (would waste top-of-page space)
    expect(md.startsWith('%')).toBe(false);
    // Single caption convention for the intake table
    expect(md).toContain(': Equipment and intake fields provided with this submission.');
    // Submission IDs protected from underscore emphasis
    expect(md).toMatch(/`diag_1730421300001_9f3ce210`/);
    for (const [, title] of SECTION_ORDER) {
      expect(md).toContain(`## ${title}`);
    }
    // No emoji (would be stripped later; source should stay clean)
    expect(md).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
  });

  test('renders a real whiteglove PDF when pandoc+xelatex are available', async () => {
    if (!canRenderWhiteglove()) {
      console.warn('[skip] pandoc/xelatex not available — whiteglove render test skipped');
      return;
    }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dpro-wg-test-'));
    const out = path.join(dir, 'report.pdf');
    const rich = {
      ...analysis,
      diagnosticVerification: 'Refractometer DEF and log NOx during regen.',
      shopInterrogation: ['What was DEF concentration?'],
      conversationScripting: 'Ask for conversion data before authorizing catalyst work.',
      costBreakdown: ['Doser valve $310-$420'],
      ripoffDetection: ['Full aftertreatment quote without NOx data'],
      authorizationGuide: 'Approve diagnostics only until conversion is proven.',
      technicalEducation: ['SCR converts NOx with DEF'],
      oemPartsStrategy: ['OEM NOx sensors only'],
      negotiationTactics: ['Price doser separately from catalyst'],
      likelyCausesRanked: ['Doser valve — 88%'],
      recommendations: ['Replace doser and re-test'],
      sourceVerification: ['Paccar bulletin E197'],
    };
    const result = generateWhiteglovePDF(submission, rich, out);
    expect(result.bytes).toBeGreaterThan(8_000);
    const head = Buffer.alloc(5);
    const fd = fs.openSync(out, 'r');
    fs.readSync(fd, head, 0, 5, 0);
    fs.closeSync(fd);
    expect(head.toString('ascii')).toBe('%PDF-');
    fs.rmSync(dir, { recursive: true, force: true });
  }, 120_000);
});
