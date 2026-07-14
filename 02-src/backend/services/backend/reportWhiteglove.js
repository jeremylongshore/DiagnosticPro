/**
 * Whiteglove-grade diagnostic PDF renderer.
 *
 * Matches /whiteglove-pdf standards (booktabs tables, titlesec spacing,
 * widow/orphan penalties, emoji strip, 11pt US Letter, 1in margins) by
 * building markdown from the analysis object and rendering via
 * pandoc + xelatex (or tectonic when PDF_ENGINE=tectonic).
 *
 * Runtime deps (in container or host): pandoc, xelatex|tectonic, python3.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync, execFileSync } = require('child_process');

const SECTION_ORDER = [
  ['primaryDiagnosis', '1. Primary Diagnosis'],
  ['differentialDiagnosis', '2. Differential Diagnosis'],
  ['diagnosticVerification', '3. Diagnostic Verification'],
  ['shopInterrogation', '4. Shop Interrogation'],
  ['conversationScripting', '5. Conversation Scripting'],
  ['costBreakdown', '6. Cost Breakdown'],
  ['ripoffDetection', '7. Ripoff Detection'],
  ['authorizationGuide', '8. Authorization Guide'],
  ['technicalEducation', '9. Technical Education'],
  ['oemPartsStrategy', '10. OEM Parts Strategy'],
  ['negotiationTactics', '11. Negotiation Tactics'],
  ['likelyCausesRanked', '12. Likely Causes (Ranked)'],
  ['recommendations', '13. Recommendations'],
  ['sourceVerification', '14. Source Verification'],
  ['nextStepsSummary', '15. Next Steps Summary'],
];

function which(cmd) {
  try {
    const out = execFileSync('sh', ['-c', `command -v ${cmd}`], { encoding: 'utf8' }).trim();
    return out || null;
  } catch {
    return null;
  }
}

function canRenderWhiteglove() {
  if (process.env.PDF_ENGINE === 'pdfkit') return false;
  if (!which('pandoc') || !which('python3')) return false;
  const engine = process.env.PDF_ENGINE || 'xelatex';
  if (engine === 'tectonic') return Boolean(which('tectonic'));
  return Boolean(which('xelatex'));
}

function escapeMd(s) {
  return String(s ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

function asBulletBlock(content) {
  if (Array.isArray(content)) {
    return content
      .map((item) => `- ${escapeMd(item).replace(/^\s*[-*•]\s*/, '')}`)
      .filter((line) => line.length > 2)
      .join('\n');
  }
  const text = escapeMd(content);
  if (!text) return '_No content provided._';
  // Already bullet-ish lines from the LLM
  if (/^[-*•]|\n[-*•]/.test(text) || /^\d+\./.test(text)) {
    return text
      .split('\n')
      .map((line) => {
        const t = line.trim();
        if (!t) return '';
        if (/^[-*•]/.test(t) || /^\d+\./.test(t)) return t.replace(/^[-*•]\s*/, '- ');
        return `- ${t}`;
      })
      .filter(Boolean)
      .join('\n');
  }
  return text;
}

function asNarrative(content) {
  if (Array.isArray(content)) return asBulletBlock(content);
  const text = escapeMd(content);
  return text || '_No content provided._';
}

function fieldRow(label, value) {
  const v = escapeMd(value);
  if (!v) return null;
  // Protect IDs / emails / serials so pandoc does not treat `_` as emphasis
  // (which produced "qa spacing kenworth" style broken text in the PDF).
  const needsCode = /[_@\\/]/.test(v) || /^diag_|^cs_|^sample_|^qa_/.test(v);
  const cell = needsCode
    ? `\`${v.replace(/`/g, "'")}\``
    : v.replace(/\|/g, '\\|');
  return `| ${label} | ${cell} |`;
}

/**
 * Build whiteglove-oriented markdown for one diagnostic report.
 */
function buildReportMarkdown(submission, analysis) {
  const id = submission?.id || 'unknown';
  const date = new Date().toISOString().slice(0, 10);
  const equip = [submission?.year, submission?.make, submission?.model]
    .filter(Boolean)
    .join(' ');

  const lines = [];
  // Do NOT use a leading "% title" line — pandoc treats it as document title
  // and burns half a page of empty space above the report body.
  lines.push(`# DiagnosticPro Report`);
  lines.push('');
  lines.push(`**Submission:** \`${id}\`  `);
  lines.push(`**Date:** ${date}  `);
  if (equip) lines.push(`**Equipment:** ${escapeMd(equip)}  `);
  lines.push('');
  lines.push('## Customer & equipment summary');
  lines.push('');
  // Single whiteglove caption (booktabs longtable). Do not also rely on the
  // preamble auto-"Table N." injector when an explicit caption is present —
  // that produced a doubled "Table 1." label on page 1.
  lines.push(': Equipment and intake fields provided with this submission.');
  lines.push('');
  lines.push('| Field | Value |');
  lines.push('| --- | --- |');

  const rows = [
    fieldRow('Submission ID', id),
    fieldRow('Customer', submission?.full_name),
    fieldRow('Email', submission?.email),
    fieldRow('Phone', submission?.phone),
    fieldRow('Equipment type', submission?.equipment_type),
    fieldRow('Make / model / year', equip),
    fieldRow('Serial', submission?.serial_number),
    fieldRow('Mileage / hours', submission?.mileage_hours),
    fieldRow('When started', submission?.when_started),
    fieldRow('Frequency', submission?.frequency),
    fieldRow('Urgency', submission?.urgency_level),
    fieldRow('Environment', submission?.location_environment),
    fieldRow('Usage', submission?.usage_pattern),
    fieldRow('Shop quote', submission?.shop_quote_amount),
    fieldRow('Shop recommendation', submission?.shop_recommendation),
  ].filter(Boolean);
  lines.push(...rows);
  lines.push('');

  if (submission?.problem_description) {
    lines.push('### Problem description');
    lines.push('');
    lines.push(asNarrative(submission.problem_description));
    lines.push('');
  }

  if (submission?.symptoms?.length) {
    lines.push('### Reported symptoms');
    lines.push('');
    lines.push(asBulletBlock(submission.symptoms));
    lines.push('');
  }

  if (submission?.error_codes?.length) {
    lines.push('### Error codes');
    lines.push('');
    lines.push(asBulletBlock(submission.error_codes));
    lines.push('');
  }

  if (submission?.previous_repairs) {
    lines.push('### Previous repairs');
    lines.push('');
    lines.push(asNarrative(submission.previous_repairs));
    lines.push('');
  }

  if (submission?.troubleshooting_steps) {
    lines.push('### Troubleshooting already attempted');
    lines.push('');
    lines.push(asNarrative(submission.troubleshooting_steps));
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## Comprehensive diagnostic analysis');
  lines.push('');
  lines.push(
    'The following fifteen sections are generated by DiagnosticPro from the intake data above. ' +
      'They are informational guidance for a second opinion — not a substitute for licensed professional diagnosis.',
  );
  lines.push('');

  for (const [key, title] of SECTION_ORDER) {
    const content = analysis?.[key];
    lines.push(`## ${title}`);
    lines.push('');
    const bulletKeys = new Set([
      'differentialDiagnosis',
      'shopInterrogation',
      'costBreakdown',
      'ripoffDetection',
      'technicalEducation',
      'oemPartsStrategy',
      'negotiationTactics',
      'likelyCausesRanked',
      'recommendations',
      'sourceVerification',
      'nextStepsSummary',
    ]);
    lines.push(bulletKeys.has(key) ? asBulletBlock(content) : asNarrative(content));
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('## Disclaimer');
  lines.push('');
  lines.push(
    'This report is generated by the DiagnosticPro AI platform, built by Intent Solutions. ' +
      'It is intended strictly for informational purposes and consumer protection guidance. ' +
      'It does not replace diagnosis or repair advice from a licensed professional. ' +
      'DiagnosticPro and Intent Solutions assume no liability for decisions made based on this report. ' +
      'Verify all findings with qualified technicians and follow manufacturer service procedures.',
  );
  lines.push('');
  lines.push(`© ${new Date().getFullYear()} Intent Solutions Inc. / DiagnosticPro. All rights reserved.`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Render markdown to PDF using pandoc + whiteglove header.
 * @returns {{ engine: string, bytes: number }}
 */
function renderWhiteglovePdf(markdown, filePath) {
  const here = __dirname;
  const header = path.join(here, 'latex', 'diagnostic-report.tex');
  const preprocess = path.join(here, 'scripts', 'whiteglove-preprocess.py');
  if (!fs.existsSync(header)) throw new Error(`whiteglove header missing: ${header}`);
  if (!fs.existsSync(preprocess)) throw new Error(`whiteglove preprocess missing: ${preprocess}`);

  const engine = process.env.PDF_ENGINE === 'tectonic' ? 'tectonic' : 'xelatex';
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dpro-wg-'));
  const rawMd = path.join(tmpDir, 'report.md');
  const cleanMd = path.join(tmpDir, 'report.clean.md');

  try {
    fs.writeFileSync(rawMd, markdown, 'utf8');

    const pre = spawnSync('python3', [preprocess, rawMd, cleanMd], { encoding: 'utf8' });
    if (pre.status !== 0) {
      throw new Error(`whiteglove preprocess failed: ${pre.stderr || pre.stdout}`);
    }

    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    const args = [
      cleanMd,
      '-o',
      filePath,
      `--pdf-engine=${engine}`,
      `--include-in-header=${header}`,
      `--resource-path=${path.join(here, 'latex')}`,
      '-V',
      'geometry:margin=1in',
      '-V',
      'documentclass=article',
      '-V',
      'fontsize=11pt',
    ];

    const run = spawnSync('pandoc', args, {
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
      env: process.env,
    });
    if (run.status !== 0) {
      throw new Error(`pandoc failed (${run.status}): ${run.stderr || run.stdout}`);
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).size < 1000) {
      throw new Error(`whiteglove PDF missing or too small: ${filePath}`);
    }
    return { engine: `pandoc+${engine}`, bytes: fs.statSync(filePath).size };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

/**
 * Build + render whiteglove PDF to filePath.
 */
function generateWhiteglovePDF(submission, analysis, filePath) {
  const md = buildReportMarkdown(submission, analysis);
  return renderWhiteglovePdf(md, filePath);
}

module.exports = {
  canRenderWhiteglove,
  buildReportMarkdown,
  renderWhiteglovePdf,
  generateWhiteglovePDF,
  SECTION_ORDER,
};
