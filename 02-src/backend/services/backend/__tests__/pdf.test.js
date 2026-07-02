// P0 unit tests (REQ-005): reportPdfProduction.generateDiagnosticProPDF
// renders a real PDF file from a fixture analysis object — no HTTP, no DB.

const os = require('os');
const fs = require('fs');
const path = require('path');

const { generateDiagnosticProPDF } = require('../reportPdfProduction.js');

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'diagpro-pdf-'));

const submission = {
  id: 'diag_1730421300001_9f3ce210',
  make: 'Kenworth',
  model: 'T680',
  year: '2017',
  equipment_type: 'semi-trucks',
  serial_number: '1XKYDP9X4HJ481203',
  mileage_hours: '412350',
  full_name: 'Dana Dispatch',
  email: 'dispatch@kenworthfleet.com',
  phone: '956-555-0184',
  problem_description: 'Truck derates to 5 mph within 20 minutes of highway driving; DEF gauge reads full.',
  symptoms: ['Derate to 5 mph', 'DEF warning lamp', 'Regen never completes'],
  error_codes: ['SPN4364/FMI18', 'SPN3216/FMI4'],
  when_started: 'Two weeks ago after a DEF refill at a truck stop',
  urgency_level: 'high',
  shop_quote_amount: '4800',
  shop_recommendation: 'Replace the entire aftertreatment system'
};

const fullAnalysis = {
  fullAnalysis: '15-section source text used for parsing elsewhere.',
  primaryDiagnosis:
    'Failed NOx conversion efficiency traced to a contaminated DEF doser valve on the 2017 Kenworth T680 (Paccar MX-13). '
    + 'SPN 4364 FMI 18 indicates SCR conversion below threshold while SPN 3216 FMI 4 points to the outlet NOx sensor circuit. '
    + 'Confidence 88%. The derate pattern after 20 minutes matches a doser valve crystallized by off-spec DEF.',
  differentialDiagnosis: [
    'Contaminated or diluted DEF from the truck-stop refill crystallizing in the doser (most likely given onset timing)',
    'Outlet NOx sensor drift reporting false low conversion (SPN 3216 FMI 4 supports circuit-level involvement)',
    'SCR catalyst face-plugging from prior incomplete regens (least likely at 412,350 miles with clean regen history)'
  ],
  diagnosticVerification:
    'Pull a DEF sample and refractometer-test for 32.5% urea concentration. Command a stationary regen with Davie4 or '
    + 'Cummins INSITE-equivalent and log SCR inlet/outlet NOx counts. A healthy system shows over 90% conversion.',
  shopInterrogation: [
    'What was the measured DEF concentration and can I see the refractometer reading?',
    'What were the SCR inlet versus outlet NOx counts during the forced regen?',
    'Did you inspect the doser valve tip for urea crystallization before quoting a full aftertreatment replacement?'
  ],
  conversationScripting:
    'Open with: I have done some research and want to understand what the NOx conversion numbers showed before we '
    + 'replace a $4,800 aftertreatment system. Ask each verification question as curiosity, not accusation.',
  costBreakdown: [
    'DEF doser valve (Paccar MX-13): $310-$420 parts, 1.5-2.0 hours labor',
    'Outlet NOx sensor: $280-$390 parts, 0.5 hours labor',
    'Full aftertreatment replacement (the shop quote): $4,200-$5,500 — not justified by the current evidence'
  ],
  ripoffDetection: [
    'Quoting the entire aftertreatment system without documented NOx conversion data is a parts-cannon indicator',
    'Refusing to show the DEF concentration measurement is a red flag',
    'A $4,800 quote against a likely $600 doser-valve fix warrants a second opinion'
  ],
  authorizationGuide:
    'Approve the DEF sample test and forced regen with data logging immediately. Reject the full aftertreatment '
    + 'replacement until conversion data proves catalyst failure.',
  technicalEducation: [
    'The SCR system injects DEF ahead of the catalyst to convert NOx to nitrogen and water',
    'Off-spec DEF crystallizes at the doser tip, starving the catalyst and tripping SPN 4364',
    'Derate strategies protect emissions compliance, not the engine — the truck is drivable to a shop'
  ],
  oemPartsStrategy: [
    'Paccar doser valve part 2109693PE — verify against the chassis serial before ordering',
    'OEM NOx sensors only: aftermarket units are the top cause of repeat SPN 3216 comebacks'
  ],
  negotiationTactics: [
    'Ask the shop to price the doser valve repair separately from the catalyst replacement',
    'Request the diagnostic data in writing before authorizing anything over $1,000'
  ],
  likelyCausesRanked: [
    'Primary cause: crystallized DEF doser valve — 88% confidence',
    'Secondary cause: failed outlet NOx sensor — 30% confidence',
    'Tertiary cause: SCR catalyst face-plugging — 10% confidence'
  ],
  recommendations: [
    'Drain and refill DEF from a sealed OEM jug, not a bulk pump of unknown age',
    'Replace the doser valve and re-test conversion before any catalyst work',
    'Log a forced regen after repair to confirm SPN 4364 stays inactive'
  ],
  sourceVerification: [
    'Paccar service bulletin E197 — SCR conversion efficiency diagnostics for MX-13',
    'Cummins QuickServe aftertreatment troubleshooting tree for SPN 4364',
    'TMC RP 374 — DEF quality handling recommendations'
  ],
  nextStepsSummary: [
    'Get the DEF concentration tested before authorizing any repair',
    'Demand SCR inlet/outlet NOx data from the forced regen',
    'Authorize only the doser valve repair unless conversion data proves catalyst failure'
  ],
  detectedCodes: ['SPN4364/FMI18', 'SPN3216/FMI4']
};

afterAll(() => {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
});

async function renderToFile(sub, analysis, fileName) {
  const filePath = path.join(tmpRoot, fileName);
  const stream = await generateDiagnosticProPDF(sub, analysis, filePath);
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });
  return filePath;
}

describe('generateDiagnosticProPDF (REQ-005)', () => {
  test('renders a full 15-section analysis to a PDF over 10KB with a %PDF header', async () => {
    const filePath = await renderToFile(submission, fullAnalysis, 'full-report.pdf');

    expect(fs.existsSync(filePath)).toBe(true);
    const stat = fs.statSync(filePath);
    expect(stat.size).toBeGreaterThan(10240);

    const head = Buffer.alloc(5);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, head, 0, 5, 0);
    fs.closeSync(fd);
    expect(head.toString('ascii')).toBe('%PDF-');
  }, 30000);

  test('still produces a valid PDF when critical sections are missing (validator logs, does not block)', async () => {
    const sparseAnalysis = { fullAnalysis: 'Unstructured note: compressor short-cycles every 8 minutes.' };
    const sparseSubmission = {
      id: 'diag_1730421300002_5b6c7d8e',
      make: 'Trane',
      model: 'XR16',
      year: '2015',
      equipment_type: 'hvac',
      problem_description: 'Compressor hard-start then breaker trip.'
    };

    const filePath = await renderToFile(sparseSubmission, sparseAnalysis, 'sparse-report.pdf');

    expect(fs.existsSync(filePath)).toBe(true);
    const head = Buffer.alloc(5);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, head, 0, 5, 0);
    fs.closeSync(fd);
    expect(head.toString('ascii')).toBe('%PDF-');
    expect(fs.statSync(filePath).size).toBeGreaterThan(2048);
  }, 30000);
});
