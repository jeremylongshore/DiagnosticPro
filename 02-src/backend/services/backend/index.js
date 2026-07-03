const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const stripe = require('stripe');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
// Using production-grade PDF generator with validation and proper pagination
const { generateDiagnosticProPDF } = require('./reportPdfProduction.js');
// Secrets from the process env (materialized from SOPS at deploy time; no GCP)
const { loadSecrets } = require('./config/secrets.js');
// OpenAI-compatible client. Default provider is OpenAI gpt-4o; Groq/Ollama/any /v1 via env.
const OpenAI = require('openai');

// Self-hosted SQLite (replaces Firestore)
const { getDb } = require('./db');

// Structured logging function
function logStructured(data) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    service: 'diagnosticpro-llm-backend',
    ...data
  }));
}

// Request ID middleware
function attachRequestId(req, res, next) {
  req.reqId = req.headers['x-request-id'] || crypto.randomUUID();
  next();
}

// Schema validation for /saveSubmission payload - FLEXIBLE VALIDATION
// Only validates required minimum fields, allows all other fields to pass through
function validateSubmissionPayload(payload) {
  const errors = [];

  // Required fields (minimum for AI analysis)
  const requiredFields = ['equipmentType', 'model'];

  // Check for required fields only - allow all other fields to pass through
  for (const field of requiredFields) {
    if (!payload[field] || typeof payload[field] !== 'string' || payload[field].trim() === '') {
      errors.push(`Field '${field}' is required and must be a non-empty string`);
    }
  }

  // The AI needs SOME symptom text, but in the real UI the symptom checkboxes
  // are optional (hidden behind "Add Details") while the always-visible
  // free-text is problemDescription. Requiring `symptoms` alone 400-rejected
  // every customer who only filled the description — the buy button never
  // rendered and the sale was lost (caught live by journey step J1-02).
  const hasText = (v) => typeof v === 'string' && v.trim() !== '';
  if (!hasText(payload.symptoms) && !hasText(payload.problemDescription)) {
    errors.push("Field 'symptoms' or 'problemDescription' is required and must be a non-empty string");
  }

  // NO FIELD RESTRICTIONS - Accept any additional fields from UI
  // This allows for future UI fields without backend changes

  // Only validate contact structure if present (optional field)
  if (payload.contact && (typeof payload.contact !== 'object' || Array.isArray(payload.contact))) {
    errors.push('Field \'contact\' must be an object if provided');
  }

  return errors;
}

const app = express();
const PORT = process.env.PORT || 8080;

// Parse LLM (DeepSeek etc.) free-form analysis into sectioned structure the PDF generator expects
function parseFullAnalysis(fullAnalysis = '') {
  if (typeof fullAnalysis !== 'string' || !fullAnalysis.trim()) {
    return {};
  }

  const normalized = fullAnalysis.replace(/\r\n/g, '\n').trim();
  const sectionConfigs = [
    { heading: '1. PRIMARY DIAGNOSIS', key: 'primaryDiagnosis', mode: 'string' },
    { heading: '2. DIFFERENTIAL DIAGNOSIS', key: 'differentialDiagnosis', mode: 'list' },
    { heading: '3. DIAGNOSTIC VERIFICATION', key: 'diagnosticVerification', mode: 'string' },
    { heading: '4. SHOP INTERROGATION', key: 'shopInterrogation', mode: 'list' },
    { heading: '5. CONVERSATION SCRIPTING', key: 'conversationScripting', mode: 'string' },
    { heading: '6. COST BREAKDOWN', key: 'costBreakdown', mode: 'list' },
    { heading: '7. RIPOFF DETECTION', key: 'ripoffDetection', mode: 'list' },
    { heading: '8. AUTHORIZATION GUIDE', key: 'authorizationGuide', mode: 'string' },
    { heading: '9. TECHNICAL EDUCATION', key: 'technicalEducation', mode: 'list' },
    { heading: '10. OEM PARTS STRATEGY', key: 'oemPartsStrategy', mode: 'list' },
    { heading: '11. NEGOTIATION TACTICS', key: 'negotiationTactics', mode: 'list' },
    { heading: '12. LIKELY CAUSES (RANKED)', key: 'likelyCausesRanked', mode: 'list' },
    { heading: '13. RECOMMENDATIONS', key: 'recommendations', mode: 'list' },
    { heading: '14. SOURCE VERIFICATION', key: 'sourceVerification', mode: 'list' },
    { heading: '15. NEXT STEPS SUMMARY', key: 'nextStepsSummary', mode: 'list' }
  ];

  const sections = {};
  // Match lines starting with: "## 1.", "### 1.", "**1.", "1." (with optional leading markdown)
  const rawSections = normalized.split(/\n(?=#{1,4}\s*\**\d{1,2}\.\s|\**\d{1,2}\.\s)/);

  const headingMap = new Map();
  for (const chunk of rawSections) {
    const lines = chunk.split('\n');
    while (lines.length && !lines[0].trim()) {
      lines.shift();
    }
    const headingLine = lines.shift();
    if (!headingLine) {
      continue; // Skip intro text
    }

    const headingNormalized = headingLine
      .replace(/^#{1,4}\s*/, '') // Strip markdown heading markers (##, ###, etc.)
      .replace(/^\**/, '')
      .replace(/\**$/, '')
      .trim();
    if (!/^\d{1,2}\./.test(headingNormalized)) {
      continue;
    }

    const cleanHeading = headingNormalized.replace(/\*/g, '').trim().toUpperCase();
    const content = lines.join('\n').trim();
    headingMap.set(cleanHeading, content);
  }

  const toList = (content) => {
    if (!content) return [];
    return content
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => line
        .replace(/^[-*•]+\s*/, '')
        .replace(/^\d+\.\s*/, '')
        .trim()
      )
      .filter(Boolean);
  };

  for (const section of sectionConfigs) {
    const key = section.heading.toUpperCase();
    const content = headingMap.get(key);
    if (!content) continue;

    if (section.mode === 'list') {
      const items = toList(content);
      if (items.length) {
        sections[section.key] = items;
      } else {
        sections[section.key] = [content];
      }
    } else {
      sections[section.key] = content;
    }
  }

  return sections;
}

function extractDiagnosticCodes(payload = {}) {
  const codes = new Set();

  // OBD-II codes: P0171, B1234, C0035, U0100
  const obdRegex = /\b([PpBbCcUu][0-9A-Fa-f]{4})\b/g;

  const collectFromValue = (value) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(collectFromValue);
      return;
    }
    if (typeof value === 'string') {
      // OBD-II codes
      const obdMatches = value.match(obdRegex);
      if (obdMatches) {
        obdMatches.forEach(code => codes.add(code.toUpperCase()));
      }
      // J1939 SPN/FMI: SPN 520198 FMI 7, SPN520198/FMI7
      // New regex per string to avoid lastIndex persistence with global flag
      const j1939Re = /\bSPN\s*(\d{1,6})\s*[\/\s]*FMI\s*(\d{1,2})\b/gi;
      let j1939Match;
      while ((j1939Match = j1939Re.exec(value)) !== null) {
        codes.add(`SPN${j1939Match[1]}/FMI${j1939Match[2]}`);
      }
      // Equipment-specific codes: ERR-42, Fault 123, Code 456, ALM-7
      // Require multi-char prefix or prefix+separator to avoid false positives from "E-mail", "F-150"
      const equipCodeRe = /\b(?:ERR|FAULT|CODE|ERROR|ALM)[-\s]?(\d{1,5})\b/gi;
      let equipMatch;
      while ((equipMatch = equipCodeRe.exec(value)) !== null) {
        codes.add(equipMatch[0].toUpperCase().replace(/\s+/g, ''));
      }
      // Blink/flash codes: "2 blinks then 5 blinks", "flash code 3-2"
      const blinkRe = /\b(?:blink|flash)\s*(?:code)?\s*(\d[\s\-,]*\d?)\b/gi;
      let blinkMatch;
      while ((blinkMatch = blinkRe.exec(value)) !== null) {
        codes.add(`FLASH:${blinkMatch[1].replace(/\s/g, '')}`);
      }
    } else if (typeof value === 'object') {
      Object.values(value).forEach(collectFromValue);
    }
  };

  collectFromValue(payload.errorCodes);
  collectFromValue(payload.modifications);
  collectFromValue(payload.symptoms);
  collectFromValue(payload.problemDescription);
  collectFromValue(payload.troubleshootingSteps);

  return Array.from(codes);
}

// Self-hosted reports: local FS is primary. GCS is optional legacy fallback only.
// Pure self-host: no REPORT_BUCKET requirement. Local FS only.
const REPORT_BUCKET = process.env.REPORT_BUCKET; // legacy only
const USE_GCS_REPORTS = false; // force local for perfect self-host

// GCS is fully removed for self-host. Local FS only.

// Initialize other services
let stripeClient; // Will be initialized after loading secrets
let secrets = {}; // Global secrets object

// SQLite DB (lazy init on first use)
const db = getDb();

// Whop integration constants
const WHOP_APP_ID = process.env.WHOP_APP_ID || 'app_NyelCJC762qXb6';
const WHOP_PRODUCT_ID = process.env.WHOP_PRODUCT_ID || 'prod_Esv4mwwm845xK';
const WHOP_REDIRECT_URI = 'https://diagnosticpro.io/auth/callback';

// Middleware
app.use(cors({
  origin: ['https://diagnosticpro.io', 'https://diagnostic-pro-prod.web.app', 'https://diagpro-gw-3tbssksx.uc.gateway.dev'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'x-dp-reqid', 'Authorization', 'x-whop-token']
}));

// Rate limiters
const submissionLimiter = rateLimit({ windowMs: 60000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many submissions, try again later', code: 'RATE_LIMITED' } });
const analysisLimiter = rateLimit({ windowMs: 60000, max: 5, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many analysis requests, try again later', code: 'RATE_LIMITED' } });
const generalLimiter = rateLimit({ windowMs: 60000, max: 60, standardHeaders: true, legacyHeaders: false });
app.use(generalLimiter);

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'diagnosticpro-llm-backend',
    version: '2.3.0'
  });
});

// Local reports download (self-host, replaces GCS signed URLs)
app.get('/reports/download/:submissionId', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const { submissionId } = req.params;
  const reportsDir = process.env.REPORTS_DIR || path.join(process.cwd(), 'reports');
  const filePath = path.join(reportsDir, `${submissionId}.pdf`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="diagnostic-${submissionId}.pdf"`);
  fs.createReadStream(filePath).pipe(res);
});

// Capture raw body for Stripe webhook signature verification
// Must be registered BEFORE express.json() middleware
app.post('/stripeWebhookForward', express.raw({ type: 'application/json' }), attachRequestId);

// Capture raw body for Whop webhook signature verification (HMAC must run
// over the exact bytes Whop sent, not a re-serialized JSON.stringify)
app.post('/api/webhooks/whop', express.raw({ type: 'application/json' }), attachRequestId);

app.use(express.json({ limit: '10mb' }));
app.use(attachRequestId);

// ENDPOINT: Save submission BEFORE payment
app.post('/saveSubmission', submissionLimiter, async (req, res) => {
  const phase = 'saveSubmission';
  let submissionId = null;

  try {
    const { payload } = req.body;

    // Validate payload schema
    const validationErrors = validateSubmissionPayload(payload);
    if (validationErrors.length > 0) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        error: { code: 'VALIDATION_ERROR', message: validationErrors.join('; '), validationErrors }
      });
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    // Generate submission ID
    submissionId = `diag_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // Prepare document for SQLite (replaces Firestore)
    const now = new Date().toISOString();
    const submissionPayload = {
      ...payload,
      make: payload.make || '',
      year: payload.year || '',
      notes: payload.notes || ''
    };

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO diagnostic_submissions
      (id, status, price_cents, payload, req_id, ui_version, payload_key_count, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      submissionId,
      'pending',
      499,
      JSON.stringify(submissionPayload),
      req.reqId,
      '1.0',
      Object.keys(payload).length,
      now,
      now
    );

    // Success logging
    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId,
      submissionId,
      payloadKeys: Object.keys(payload)
    });

    res.json({ submissionId });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    });
    res.status(500).json({
      error: 'Failed to save submission',
      code: 'INTERNAL_ERROR'
    });
  }
});

// ENDPOINT: Create Stripe checkout session for $4.99
app.post('/createCheckoutSession', async (req, res) => {
  const phase = 'createCheckoutSession';
  let submissionId = req.body.submissionId;

  try {
    if (!submissionId) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        error: { code: 'MISSING_SUBMISSION_ID', message: 'submissionId is required' }
      });
      return res.status(400).json({
        error: 'submissionId is required',
        code: 'MISSING_SUBMISSION_ID'
      });
    }

    // Verify submission exists and status is valid (SQLite)
    const row = db.prepare('SELECT * FROM diagnostic_submissions WHERE id = ?').get(submissionId);
    if (!row) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        submissionId,
        error: { code: 'SUBMISSION_NOT_FOUND', message: 'Submission not found' }
      });
      return res.status(404).json({
        error: 'Submission not found',
        code: 'SUBMISSION_NOT_FOUND'
      });
    }

    const submissionData = {
      ...row,
      payload: row.payload ? JSON.parse(row.payload) : {}
    };
    if (!['pending', 'failed'].includes(submissionData.status)) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        submissionId,
        error: { code: 'INVALID_STATUS', message: `Invalid submission status: ${submissionData.status}` }
      });
      return res.status(400).json({
        error: `Invalid submission status: ${submissionData.status}`,
        code: 'INVALID_STATUS'
      });
    }

    // Redirect base is env-driven so a test-mode deployment (e.g.
    // test.diagnosticpro.io with sk_test) sends payers back to ITSELF, never
    // to the live host. {CHECKOUT_SESSION_ID} is Stripe's literal template
    // token — the /success page resolves session -> submission via
    // GET /checkout/session (the same path the Buy Button flow exercises).
    const frontendBase = (process.env.FRONTEND_URL || 'https://diagnosticpro.io').replace(/\/+$/, '');
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'DiagnosticPro — Universal Equipment Diagnostic Report',
            description: 'Professional diagnostic analysis and repair recommendations'
          },
          unit_amount: 499 // $4.99 USD = 499 cents
        },
        quantity: 1
      }],
      mode: 'payment',
      client_reference_id: submissionId,
      success_url: `${frontendBase}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendBase}/cancel?submission_id=${submissionId}`,
      metadata: {
        submissionId: submissionId
      }
    });

    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId,
      submissionId,
      sessionId: session.id
    });

    res.json({ url: session.url, sessionId: session.id });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      error: {
        code: 'STRIPE_ERROR',
        message: error.message,
        type: error.type,
        statusCode: error.statusCode,
        rawError: error.raw ? error.raw.message : null
      }
    });
    res.status(500).json({
      error: 'Failed to create checkout session',
      code: 'STRIPE_ERROR',
      details: error.message
    });
  }
});

// ENDPOINT: Check analysis status
app.post('/analysisStatus', async (req, res) => {
  try {
    const { submissionId } = req.body;

    const row = db.prepare('SELECT status FROM diagnostic_submissions WHERE id = ?').get(submissionId);
    if (!row) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const status = row.status || 'pending';

    res.json({ status });

  } catch (error) {
    console.error('❌ Analysis status error:', error);
    res.status(500).json({ error: 'Failed to get analysis status' });
  }
});

// ENDPOINT: Manual analyze diagnostic (idempotent)
app.post('/analyzeDiagnostic', analysisLimiter, async (req, res) => {
  try {
    const { submissionId, force } = req.body;

    const row = db.prepare('SELECT * FROM diagnostic_submissions WHERE id = ?').get(submissionId);
    if (!row) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = {
      ...row,
      payload: row.payload ? JSON.parse(row.payload) : {}
    };

    // Allow re-trigger if force=true or stuck for >10 minutes
    const stuckThreshold = 10 * 60 * 1000;
    const isStuck = submissionData.status === 'processing' &&
      submissionData.processing_started_at &&
      (Date.now() - new Date(submissionData.processing_started_at).getTime()) > stuckThreshold;

    if ((submissionData.status === 'processing' || submissionData.status === 'ready') && !force && !isStuck) {
      // ok/path/analysisId are the fields the frontend startAnalysis() checks;
      // status/message kept for backward compat
      return res.json({
        ok: true,
        analysisId: submissionId,
        path: submissionData.report_url || `/reports/download/${submissionId}`,
        status: submissionData.status,
        message: 'Already processed'
      });
    }

    // Start analysis
    await processAnalysis(submissionId, submissionData.payload);

    res.json({
      ok: true,
      analysisId: submissionId,
      path: `/reports/download/${submissionId}`,
      status: 'processing',
      message: 'Analysis started'
    });

  } catch (error) {
    console.error('❌ Analyze diagnostic error:', error);
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

// ENDPOINT: Stable view URL - streams PDF or redirects to signed URL
app.get('/view/:submissionId', async (req, res) => {
  const phase = 'stableViewUrl';
  const submissionId = req.params.submissionId;

  try {
    if (!submissionId) {
      return res.status(400).json({ error: 'submissionId is required' });
    }

    // Check if submission exists and is ready (SQLite)
    const subRow = db.prepare('SELECT status FROM diagnostic_submissions WHERE id = ?').get(submissionId);
    if (!subRow) {
      return res.status(404).json({ error: 'Submission not found' });
    }
    if (subRow.status !== 'ready') {
      return res.status(400).json({
        error: 'Report not ready yet',
        status: subRow.status
      });
    }

    // Check if analysis record exists
    const analysisRow = db.prepare('SELECT report_path FROM analyses WHERE id = ?').get(submissionId);
    if (!analysisRow) {
      return res.status(404).json({ error: 'Analysis record not found' });
    }

    // Serve local report directly (perfect self-host, no GCS)
    const fs = require('fs');
    const pathMod = require('path');
    const reportsDir = process.env.REPORTS_DIR || pathMod.join(process.cwd(), 'reports');
    const localPdf = pathMod.join(reportsDir, `${submissionId}.pdf`);

    if (!fs.existsSync(localPdf)) {
      return res.status(404).json({ error: 'Report file not found on disk' });
    }

    logStructured({
      phase: 'viewReport',
      status: 'ok',
      storage: 'local',
      submissionId
    });

    // Update analysis (SQLite)
    const updateStmt = db.prepare(`
      UPDATE analyses SET public_view_url = ?, last_viewed_at = ?, updated_at = ? WHERE id = ?
    `);
    updateStmt.run(`/view/${submissionId}`, new Date().toISOString(), new Date().toISOString(), submissionId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="diagnostic-report-${submissionId}.pdf"`);
    fs.createReadStream(localPdf).pipe(res);
    return;

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId || 'anonymous',
      submissionId,
      error: { code: 'STABLE_VIEW_ERROR', message: error.message }
    });
    res.status(500).json({
      error: 'Failed to load report view',
      code: 'STABLE_VIEW_ERROR'
    });
  }
});

// ENDPOINT: Get Checkout Session details (for Buy Button flow)
app.get('/checkout/session', async (req, res) => {
  const phase = 'getCheckoutSession';
  const sessionId = req.query.id;

  try {
    if (!sessionId) {
      return res.status(400).json({ error: 'session id query parameter required' });
    }

    if (!/^cs_/.test(sessionId)) {
      return res.status(400).json({ error: 'invalid session id' });
    }

    // Retrieve session from Stripe
    const session = await stripeClient.checkout.sessions.retrieve(sessionId);

    // Multiple fallback sources for submissionId
    const submissionId = session.client_reference_id ||
                        (session.metadata && session.metadata.submissionId) ||
                        null;

    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId,
      sessionId: session.id,
      clientReferenceId: session.client_reference_id,
      metadataSubmissionId: session.metadata?.submissionId,
      resolvedSubmissionId: submissionId
    });

    if (!submissionId) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        sessionId,
        error: { code: 'NO_SUBMISSION_ID', message: 'No submission ID found in session' }
      });
      return res.status(400).json({
        error: 'No submission ID associated with this session',
        code: 'NO_SUBMISSION_ID'
      });
    }

    // Return consistent response structure
    res.json({
      id: session.id,
      status: session.status,
      payment_status: session.payment_status,
      submissionId: submissionId,
      client_reference_id: submissionId,  // Alias for backward compatibility
      amount_total: session.amount_total,
      customer_email: session.customer_details?.email
    });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      sessionId,
      error: { code: 'CHECKOUT_SESSION_ERROR', message: error.message }
    });
    res.status(500).json({
      error: 'Failed to retrieve checkout session',
      code: 'CHECKOUT_SESSION_ERROR',
      message: error.message
    });
  }
});

// ENDPOINT: Get signed URLs (GET query param version for gateway)
app.get('/reports/signed-url', async (req, res) => {
  const phase = 'getSignedUrl';
  let submissionId = req.query.submissionId;

  try {
    if (!submissionId) {
      return res.status(400).json({ error: 'submissionId query parameter is required' });
    }

    // Check if submission exists and is ready (SQLite)
    const subRow = db.prepare('SELECT * FROM diagnostic_submissions WHERE id = ?').get(submissionId);
    if (!subRow) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = { ...subRow, payload: subRow.payload ? JSON.parse(subRow.payload) : {} };
    if (submissionData.status !== 'ready') {
      return res.status(400).json({
        error: 'Report not ready yet',
        status: submissionData.status
      });
    }

    // Check if analysis record exists
    const analysisRow = db.prepare('SELECT * FROM analyses WHERE id = ?').get(submissionId);
    if (!analysisRow) {
      return res.status(404).json({ error: 'Analysis record not found' });
    }

    const reportPath = analysisRow.report_path;

    // Prefer local file serving for self-host
    const fs = require('fs');
    const path = require('path');
    const reportsDir = process.env.REPORTS_DIR || path.join(process.cwd(), 'reports');
    const localFile = path.join(reportsDir, `${submissionId}.pdf`);

    const downloadUrl = `/reports/download/${submissionId}`;
    const viewUrl = `/view/${submissionId}`;  // uses the local serve we added

    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId,
      submissionId,
      storage: 'local'
    });

    res.json({
      downloadUrl,
      viewUrl,
      expiresInSeconds: 3600,
      local: true
    });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      error: { code: 'SIGNED_URL_ERROR', message: error.message }
    });
    res.status(500).json({
      error: 'Failed to generate signed URLs',
      code: 'SIGNED_URL_ERROR'
    });
  }
});

// ENDPOINT: Get report status (idempotent check)
app.get('/reports/status', async (req, res) => {
  const phase = 'reportStatus';
  const submissionId = String(req.query.submissionId || '');

  try {
    if (!submissionId || !submissionId.startsWith('diag_')) {
      return res.status(400).json({ error: 'Invalid submissionId', code: 'BAD_ID' });
    }

    // Prefer local FS (self-host)
    const fs = require('fs');
    const path = require('path');
    const reportsDir = process.env.REPORTS_DIR || path.join(process.cwd(), 'reports');
    const localFile = path.join(reportsDir, `${submissionId}.pdf`);

    if (fs.existsSync(localFile)) {
      const downloadUrl = `/reports/download/${submissionId}`;
      return res.json({ status: 'ready', downloadUrl, viewUrl: downloadUrl, local: true });
    }

    // Check DB status only
    const subRow = db.prepare('SELECT status FROM diagnostic_submissions WHERE id = ?').get(submissionId);
    if (subRow) {
      logStructured({
        phase,
        status: 'processing',
        reqId: req.reqId,
        submissionId,
        submissionStatus: subRow.status
      });
      return res.status(202).json({ status: 'processing', submissionStatus: subRow.status });
    }

    logStructured({
      phase,
      status: 'not_found',
      reqId: req.reqId,
      submissionId
    });

    return res.status(404).json({ status: 'not_found' });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      error: { code: 'STATUS_CHECK_ERROR', message: error.message }
    });
    res.status(500).json({ error: 'Failed to check status', code: 'STATUS_CHECK_ERROR' });
  }
});

// ENDPOINT: Ensure report generation (idempotent kick)
app.post('/reports/ensure', async (req, res) => {
  const phase = 'reportEnsure';
  const submissionId = String(req.body.submissionId || '');

  try {
    if (!submissionId || !submissionId.startsWith('diag_')) {
      return res.status(400).json({ error: 'Invalid submissionId', code: 'BAD_ID' });
    }

    // Check if PDF already exists
    // GCS removed - local FS only path
    const fs = require('fs');
    const path = require('path');
    const reportsDir = process.env.REPORTS_DIR || path.join(process.cwd(), 'reports');
    const localFile = path.join(reportsDir, `${submissionId}.pdf`);
    // local FS check (GCS removed)
    const fsCheck = require('fs');
    const pathCheck = require('path');
    const dir = process.env.REPORTS_DIR || pathCheck.join(process.cwd(), 'reports');
    const exists = fsCheck.existsSync(pathCheck.join(dir, `${submissionId}.pdf`));

    if (exists) {
      logStructured({
        phase,
        status: 'already_ready',
        reqId: req.reqId,
        submissionId
      });
      return res.json({ status: 'ready' });
    }

    // Get submission data for reprocessing
    // note: direct ref no longer used, using db.prepare
    const subRow = db.prepare('SELECT * FROM diagnostic_submissions WHERE id = ?').get(submissionId);

    if (!subRow) {
      return res.status(404).json({ error: 'Submission not found', code: 'NOT_FOUND' });
    }

    const submissionData = { ...subRow, payload: subRow.payload ? JSON.parse(subRow.payload) : {} };

    // Update status to requeued if failed
    if (submissionData.status === 'failed' || submissionData.status === 'error') {
      db.prepare(`
        UPDATE diagnostic_submissions SET status = 'requeued', updated_at = ?, retry_count = ? WHERE id = ?
      `).run(new Date().toISOString(), (submissionData.retry_count || 0) + 1, submissionId);

      logStructured({
        phase,
        status: 'requeued',
        reqId: req.reqId,
        submissionId,
        retryCount: (submissionData.retry_count || 0) + 1
      });

      // Trigger analysis asynchronously
      processAnalysis(submissionId, submissionData.payload, req.reqId).catch(error => {
        logStructured({
          phase: 'ensureAnalyze',
          status: 'error',
          reqId: req.reqId,
          submissionId,
          error: { code: 'ENSURE_ERROR', message: error.message }
        });
      });
    } else {
      logStructured({
        phase,
        status: 'already_processing',
        reqId: req.reqId,
        submissionId,
        currentStatus: submissionData.status
      });
    }

    return res.status(202).json({ status: 'processing' });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      error: { code: 'ENSURE_ERROR', message: error.message }
    });
    res.status(500).json({ error: 'Failed to ensure report', code: 'ENSURE_ERROR' });
  }
});

// ENDPOINT: Get signed download URL for completed PDF report (POST version for backward compat)
app.post('/getDownloadUrl', async (req, res) => {
  const phase = 'getDownloadUrl';
  let submissionId = req.body.submissionId;

  try {

    if (!submissionId) {
      return res.status(400).json({ error: 'submissionId is required' });
    }

    // Check if submission exists and is ready
    const subRow = db.prepare('SELECT * FROM diagnostic_submissions WHERE id = ?').get(submissionId);
    if (!subRow) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = subRow ? { ...subRow, payload: subRow.payload ? JSON.parse(subRow.payload) : {} } : {};
    if (submissionData.status !== 'ready') {
      return res.status(400).json({
        error: 'Report not ready yet',
        status: submissionData.status
      });
    }

    // Check if analysis record exists
    const analysisRow = db.prepare('SELECT report_path FROM analyses WHERE id = ?').get(submissionId);
    if (!analysisRow) {
      return res.status(404).json({ error: 'Analysis record not found' });
    }

    const reportPath = analysisRow.report_path; // Should be "reports/{submissionId}.pdf"

    if (!reportPath) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        submissionId,
        error: { code: 'MISSING_REPORT_PATH', message: 'Report path not found in analysis record' }
      });
      return res.status(404).json({
        error: 'Report path not found',
        code: 'MISSING_REPORT_PATH'
      });
    }

    // Self-host: local FS URLs served by this backend (GCS signed URLs removed)
    const downloadUrl = `/reports/download/${submissionId}`;
    const viewUrl = `/view/${submissionId}`;

    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId,
      submissionId,
      storage: 'local'
    });

    res.json({
      downloadUrl,
      viewUrl,
      expiresInSeconds: 900,
      submissionId,
      reportPath,
      local: true
    });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      error: { code: 'DOWNLOAD_URL_ERROR', message: error.message }
    });
    res.status(500).json({
      error: 'Failed to generate download URL',
      code: 'DOWNLOAD_URL_ERROR'
    });
  }
});

// ENDPOINT: Stripe webhook forward (signature-verified)
app.post('/stripeWebhookForward', async (req, res) => {
  const phase = 'stripeWebhook';
  let submissionId = null;
  let eventId = null;

  try {
    // Verify Stripe webhook signature
    const sig = req.headers['stripe-signature'];
    const webhookSecret = secrets.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
    let event;

    if (sig && webhookSecret && stripeClient) {
      try {
        event = stripeClient.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        logStructured({
          phase,
          status: 'error',
          reqId: req.reqId,
          error: { code: 'SIGNATURE_VERIFICATION_FAILED', message: err.message }
        });
        return res.status(400).json({
          error: 'Webhook signature verification failed',
          code: 'SIGNATURE_VERIFICATION_FAILED'
        });
      }
    } else if (process.env.NODE_ENV === 'production') {
      // Reject unverified webhooks in production
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        error: { code: 'SIGNATURE_VERIFICATION_DISABLED', message: 'Webhook secret not configured in production' }
      });
      return res.status(500).json({
        error: 'Webhook signature verification not configured',
        code: 'SIGNATURE_VERIFICATION_DISABLED'
      });
    } else {
      // Dev/testing fallback: parse raw Buffer body
      try {
        event = JSON.parse(req.body.toString());
        logStructured({
          phase,
          status: 'warning',
          reqId: req.reqId,
          message: 'Webhook received without signature verification (DEV ONLY)'
        });
      } catch (parseErr) {
        return res.status(400).json({ error: 'Invalid JSON body', code: 'INVALID_BODY' });
      }
    }

    if (!event || !event.id) {
      logStructured({
        phase,
        status: 'error',
        reqId: req.reqId,
        error: { code: 'INVALID_EVENT', message: 'Missing event data' },
        bodyKeys: Object.keys(req.body || {})
      });
      return res.status(400).json({
        error: 'Invalid event data',
        code: 'INVALID_EVENT'
      });
    }

    eventId = event.id;

    logStructured({
      phase: 'stripeWebhook',
      status: 'received',
      reqId: req.reqId,
      eventId: event.id,
      eventType: event.type
    });

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      // Check both metadata.submissionId and client_reference_id
      submissionId = session.metadata?.submissionId || session.client_reference_id;

      if (!submissionId) {
        logStructured({
          phase,
          status: 'error',
          reqId: req.reqId,
          eventId,
          error: { code: 'MISSING_SUBMISSION_ID', message: 'No submissionId in session metadata' }
        });
        return res.status(400).json({
          error: 'No submissionId in metadata',
          code: 'MISSING_SUBMISSION_ID'
        });
      }

      // Idempotency guard: Stripe can replay events. If this submission is
      // already paid (or further along) AND an analysis row exists, do NOT
      // reset it to 'queued' or re-run the LLM — just ACK the webhook.
      const existingSub = db.prepare('SELECT status FROM diagnostic_submissions WHERE id = ?').get(submissionId);
      const existingAnalysis = db.prepare('SELECT id FROM analyses WHERE id = ?').get(submissionId);
      if (existingSub && existingAnalysis && ['paid', 'processing', 'ready'].includes(existingSub.status)) {
        logStructured({
          phase,
          status: 'duplicate_ignored',
          reqId: req.reqId,
          submissionId,
          eventId,
          submissionStatus: existingSub.status,
          message: 'Replayed checkout.session.completed — already paid with analysis record, skipping re-queue'
        });
        return res.json({ received: true, duplicate: true });
      }

      // Update submission to paid (SQLite)
      const paidNow = new Date().toISOString();
      db.prepare(`
        UPDATE diagnostic_submissions SET status = 'paid', updated_at = ?, stripe_session_id = ?, paid_at = ?, amount_paid_cents = ? WHERE id = ?
      `).run(paidNow, session.id, paidNow, session.amount_total ?? 499, submissionId);

      // Create analysis record (upsert — never REPLACE, which nulls unnamed columns)
      db.prepare(`
        INSERT INTO analyses (id, submission_id, status, created_at, updated_at, model, req_id)
        VALUES (?, ?, 'queued', ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          status = 'queued',
          updated_at = excluded.updated_at,
          model = excluded.model,
          req_id = excluded.req_id
      `).run(submissionId, submissionId, paidNow, paidNow, process.env.LLM_MODEL || 'gpt-4o', req.reqId);

      logStructured({
        phase,
        status: 'ok',
        reqId: req.reqId,
        submissionId,
        eventId,
        sessionId: session.id
      });

      // Start analysis process (async)
      const subRow = db.prepare('SELECT * FROM diagnostic_submissions WHERE id = ?').get(submissionId);
      if (subRow) {
        const submissionData = { ...subRow, payload: subRow.payload ? JSON.parse(subRow.payload) : {} };
        processAnalysis(submissionId, submissionData.payload, req.reqId).catch(error => {
          logStructured({
            phase: 'queueAnalyze',
            status: 'error',
            reqId: req.reqId,
            submissionId,
            error: { code: 'ANALYSIS_QUEUE_ERROR', message: error.message }
          });
        });
      }
    } else {
      logStructured({
        phase,
        status: 'ignored',
        reqId: req.reqId,
        eventId,
        eventType: event.type,
        message: 'Event type not handled'
      });
    }

    res.json({ received: true });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      submissionId,
      eventId,
      error: { code: 'WEBHOOK_ERROR', message: error.message }
    });
    res.status(500).json({
      error: 'Webhook processing failed',
      code: 'WEBHOOK_ERROR'
    });
  }
});

// FUNCTION: Process AI analysis
async function processAnalysis(submissionId, payload, reqId) {
  try {
    logStructured({
      phase: 'runAnalyze',
      status: 'started',
      reqId,
      submissionId
    });

    // Update submission status to processing (SQLite)
    const procNow = new Date().toISOString();
    db.prepare(`
      UPDATE diagnostic_submissions SET status = 'processing', updated_at = ?, processing_started_at = ? WHERE id = ?
    `).run(procNow, procNow, submissionId);

    // Create-or-update the analysis record at run start WITHOUT clobbering
    // attribution. The old INSERT OR REPLACE deleted + reinserted the row,
    // nulling every unnamed column — it wiped `model`/`req_id`/`paid_via`
    // written at queue time on every stored report (dataset poison; the first
    // live paid report shipped with model=NULL because of it). The upsert
    // stamps the model actually about to be used + the framework version,
    // and leaves paid_via/created_at intact on existing rows.
    db.prepare(`
      INSERT INTO analyses (id, submission_id, status, created_at, updated_at, model, req_id, framework_version)
      VALUES (?, ?, 'running', ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status = 'running',
        updated_at = excluded.updated_at,
        model = excluded.model,
        req_id = COALESCE(analyses.req_id, excluded.req_id),
        framework_version = excluded.framework_version
    `).run(submissionId, submissionId, procNow, procNow,
           process.env.LLM_MODEL || 'gpt-4o', reqId || null, llmFrameworkVersion());

    // Call the LLM (OpenAI gpt-4o via the OpenAI-compatible client)
    const analysis = await callLLM(payload);

    // Generate PDF report AND upload to Cloud Storage (all in one)
    const reportData = await generatePDFReport(submissionId, analysis, payload);
    const parsedSectionsForStorage = parseFullAnalysis(analysis.fullAnalysis);

    logStructured({
      phase: 'saveReport',
      status: 'ok',
      bucket: REPORT_BUCKET,
      path: reportData.fileName,
      submissionId,
      size: reportData.buffer.length
    });

    // Update analysis to ready (SQLite)
    const readyNow = new Date().toISOString();
    db.prepare(`
      UPDATE analyses SET status = 'ready', updated_at = ?, report_path = ?, full_analysis = ?, sections = ?, detected_codes = ?
      WHERE id = ?
    `).run(readyNow, reportData.fileName, analysis.fullAnalysis, JSON.stringify(parsedSectionsForStorage), JSON.stringify(analysis.detectedCodes || []), submissionId);

    // Update submission to ready with report URL
    db.prepare(`
      UPDATE diagnostic_submissions SET status = 'ready', report_url = ?, updated_at = ?, completed_at = ?, analysis_summary = ?
      WHERE id = ?
    `).run(reportData.publicUrl, readyNow, readyNow, analysis.summary || null, submissionId);

    logStructured({
      phase: 'runAnalyze',
      status: 'ok',
      reqId,
      submissionId
    });

    logStructured({
      phase: 'writeReport',
      status: 'ok',
      reqId,
      submissionId,
      reportPath: reportData.fileName,
      reportSize: reportData.buffer.length
    });

  } catch (error) {
    logStructured({
      phase: 'runAnalyze',
      status: 'error',
      reqId,
      submissionId,
      error: { code: 'ANALYSIS_ERROR', message: error.message }
    });

    // Update submission to failed (SQLite)
    const failNow = new Date().toISOString();
    db.prepare(`
      UPDATE diagnostic_submissions SET status = 'failed', updated_at = ?, last_error = ?, error_at = ? WHERE id = ?
    `).run(failNow, error.message, failNow, submissionId);

    // Update analysis to failed
    db.prepare(`
      UPDATE analyses SET status = 'failed', updated_at = ?, last_error = ? WHERE id = ?
    `).run(failNow, error.message, submissionId);

    throw error;
  }
}

// FUNCTION: Get equipment-specific AI prompt context
function getEquipmentPromptContext(equipmentType, payload) {
  const make = payload.make || 'N/A';
  const model = payload.model || 'N/A';
  const year = payload.year || 'N/A';
  const desc = `${year} ${make} ${model}`.trim();

  const configs = {
    automotive: {
      diagnosticFrame: `Approach this as an experienced ASE-certified automotive technician diagnosing a ${desc}. Connect the provided data (including any DTCs hidden in free-text fields) to known failure patterns, common service bulletins, and real-world repair tactics. Reference specific manufacturer terminology, components, and diagnostic procedures for ${make} vehicles.`,
      errorCodeGuidance: 'Error codes follow OBD-II format (P/B/C/U + 4 digits). Cross-reference with manufacturer-specific enhanced codes if present.',
      sourceGuidance: `When citing technical guidance or TSBs, name the source (e.g., "${make} TSB XX-XX-XX") even if the customer must request or verify it. Never provide a generic "look up a TSB"; point to concrete documents, NHTSA recalls, forums, or OEM resources.`,
      safetyConsiderations: 'Flag any safety-critical issues (brakes, steering, fuel leaks, airbag codes) prominently at the top of the diagnosis with clear urgency warnings.'
    },
    'gas-trucks': {
      diagnosticFrame: `Approach this as an experienced truck technician diagnosing a ${desc} gas-powered truck. Consider towing capacity impact, payload stress, and truck-specific systems. Reference manufacturer-specific truck platforms, body-on-frame considerations, and common truck failure patterns for ${make}.`,
      errorCodeGuidance: 'Error codes follow OBD-II format (P/B/C/U + 4 digits). Pay special attention to transmission codes given towing stress and powertrain load patterns.',
      sourceGuidance: `When citing technical guidance or TSBs, name the source specifically for ${make} trucks. Reference NHTSA recalls, manufacturer service bulletins, and truck-specific forums.`,
      safetyConsiderations: 'Flag any safety-critical issues especially related to towing capacity, brake systems, suspension, and drivetrain. Trucks under load have amplified failure consequences.'
    },
    'diesel-trucks': {
      diagnosticFrame: `Approach this as an experienced diesel technician diagnosing a ${desc} diesel truck. Focus on diesel-specific systems: DEF/SCR aftertreatment, DPF regeneration, turbocharger, high-pressure fuel injection, EGR system, and diesel-specific failure modes for ${make}.`,
      errorCodeGuidance: 'Error codes follow OBD-II format plus diesel-specific codes. Pay special attention to aftertreatment codes (DPF, DEF, SCR), turbo boost codes, and fuel system codes.',
      sourceGuidance: `When citing technical guidance, reference ${make} diesel-specific TSBs, EPA emissions compliance bulletins, and diesel technician forums. Many diesel issues require specialized scan tools beyond standard OBD-II.`,
      safetyConsiderations: 'Flag diesel-specific hazards: high-pressure fuel injection (can penetrate skin), hot exhaust aftertreatment components, DEF chemical handling, and turbo failure debris risks.'
    },
    'semi-trucks': {
      diagnosticFrame: `Approach this as an experienced Class 8 commercial vehicle technician diagnosing a ${desc} semi truck. Consider engine make (Cummins/Detroit/Paccar/Volvo), J1939/J1708 diagnostic protocols, DOT compliance, and commercial vehicle-specific systems including air brakes, engine brakes, APU, and fleet maintenance intervals.`,
      errorCodeGuidance: 'Error codes use SAE J1939 SPN/FMI format (e.g., SPN 520198 FMI 7) and possibly legacy J1708/J1587 MID/PID/SID codes. These are NOT OBD-II format.',
      sourceGuidance: `Reference engine manufacturer (Cummins/Detroit/Paccar) service bulletins, FMCSA safety regulations, TMC recommended practices, and commercial vehicle repair databases. Include specific engine family and serial number range applicability when possible.`,
      safetyConsiderations: 'Commercial vehicle safety is paramount. Flag any FMCSA out-of-service criteria violations, air brake system issues, steering/suspension defects, or CDL-inspection-critical items. Note DOT compliance implications.'
    },
    motorcycles: {
      diagnosticFrame: `Approach this as an experienced motorcycle technician diagnosing a ${desc}. Consider motorcycle-specific systems: engine configuration, drive type (chain/belt/shaft), carburetor vs fuel injection, motorcycle-specific electrical systems, and ${make}-specific common issues.`,
      errorCodeGuidance: 'Motorcycle error codes vary by manufacturer. Some use OBD-II-like formats, others use manufacturer-specific flash codes or digital display codes. Reference the specific diagnostic system for this make.',
      sourceGuidance: `Reference ${make} service manuals, manufacturer technical bulletins, NHTSA motorcycle recalls, and reputable motorcycle forums. Include model-specific known issues.`,
      safetyConsiderations: 'Motorcycle safety is critical — riders have no crash protection. Flag any issues affecting brakes, tires, steering head bearings, throttle response, or lighting with maximum urgency. Note if the motorcycle should NOT be ridden until repaired.'
    },
    'atvs-utvs': {
      diagnosticFrame: `Approach this as an experienced powersports technician diagnosing a ${desc} ATV/UTV/side-by-side. Consider off-road-specific systems: 2WD/4WD engagement, differential locks, CVT transmission, suspension travel, and environmental exposure (mud, water, dust). Reference ${make}-specific common failure patterns.`,
      errorCodeGuidance: 'Error codes are manufacturer-specific. Some newer UTVs use OBD-like systems, but most use proprietary diagnostic codes displayed via dash indicators or flash codes.',
      sourceGuidance: `Reference ${make} powersports service manuals, manufacturer recalls, and powersports community forums. Note that off-road vehicles often have different maintenance schedules than on-road vehicles.`,
      safetyConsiderations: 'Flag any safety issues with roll cages, brakes, steering, throttle response, or fuel systems. Note if the vehicle should not be operated on trails until repaired. Consider rider safety equipment recommendations.'
    },
    rvs: {
      diagnosticFrame: `Approach this as an experienced RV technician diagnosing a ${desc}. RVs have TWO systems to consider: the chassis/drivetrain (automotive) and the house/coach systems (12V DC, 120V AC, propane, water, HVAC). Determine whether this is a chassis issue or house system issue and diagnose accordingly. Consider chassis make vs coach make if applicable.`,
      errorCodeGuidance: 'Chassis codes follow standard OBD-II format. House system errors are manufacturer-specific — Dometic, Norcold, Onan generators, and coach electrical systems have their own diagnostic codes.',
      sourceGuidance: `Reference chassis manufacturer TSBs, RV coach manufacturer bulletins, RVIA standards, and RV-specific forums. For generators, reference the generator manufacturer (Onan/Cummins) service documentation separately.`,
      safetyConsiderations: 'Flag propane system leaks, CO detector issues, electrical system hazards (shore power, inverter, battery), leveling jack failures, and any issue affecting the vehicle while driving. LP gas and electrical issues can be life-threatening in an enclosed space.'
    },
    marine: {
      diagnosticFrame: `Approach this as an experienced marine mechanic diagnosing a ${desc} marine vessel/engine. Reference marine-specific systems: raw water cooling, zinc anodes, fuel water separators, trim/tilt hydraulics, marine electrical (tinned wiring, isolation), and ${make}-specific service patterns. Consider saltwater vs freshwater usage.`,
      errorCodeGuidance: 'Marine error codes are manufacturer-specific (not OBD-II). Mercury uses DTC format, Yamaha uses flash codes, others have proprietary systems. Reference the specific manufacturer diagnostic protocol.',
      sourceGuidance: `Reference ${make} marine service manuals, ABYC standards, USCG safety regulations, manufacturer service bulletins, and reputable marine forums. Include winterization/decommissioning considerations if relevant.`,
      safetyConsiderations: 'Marine safety is critical — vessel seaworthiness affects lives. Flag any issue that could affect the vessel on water: fuel system leaks, cooling system failure (engine destruction risk), steering/trim failure, electrical fire risk, or bilge pump issues. Note if the vessel should NOT leave the dock until repaired.'
    },
    'farm-ag': {
      diagnosticFrame: `Approach this as an experienced agricultural equipment technician diagnosing a ${desc}. Consider ag-specific systems: PTO operation, hydraulic implement circuits, GPS/autosteer, grain handling, and seasonal urgency (downtime during harvest/planting costs thousands per day). Reference ${make}-specific diagnostic systems and common failure modes.`,
      errorCodeGuidance: 'Modern ag equipment uses CAN bus diagnostics with manufacturer-specific codes. John Deere uses Service ADVISOR, Case IH uses EST, etc. Codes may be in SPN/FMI format similar to J1939.',
      sourceGuidance: `Reference ${make} agricultural dealer service bulletins, equipment operator manuals, agricultural equipment forums, and implement manufacturer documentation. Note that many ag repairs require dealer-level diagnostic tools.`,
      safetyConsiderations: 'Flag PTO entanglement risks, hydraulic system pressures (can cause injection injuries), rollover risks, and chemical handling system failures. Agricultural equipment operates in remote areas — safety failures can be fatal with delayed emergency response.'
    },
    'compact-equipment': {
      diagnosticFrame: `Approach this as an experienced compact equipment technician diagnosing a ${desc}. Focus on hydraulic systems, track/wheel drive systems, attachment circuits, and engine performance under load. Reference ${make}-specific maintenance intervals and common failure patterns for compact excavators, skid steers, and compact track loaders.`,
      errorCodeGuidance: 'Error codes are manufacturer-specific. Bobcat, Kubota, Cat, and others use proprietary diagnostic systems. Some newer models support J1939-style codes.',
      sourceGuidance: `Reference ${make} dealer service documentation, equipment operator manuals, and construction equipment forums. Note warranty status and maintenance history requirements.`,
      safetyConsiderations: 'Flag hydraulic line failures (high-pressure injection injury risk), stability/tip-over concerns, ROPS integrity, and fall-from-height hazards. Compact equipment operates near workers — safety is critical.'
    },
    'lawn-garden': {
      diagnosticFrame: `Approach this as an experienced outdoor power equipment technician diagnosing a ${desc}. Consider engine type (gas/electric/battery), blade/deck systems, drive systems (self-propelled, hydrostatic, belt-drive), and seasonal storage issues. Reference ${make}-specific common problems.`,
      errorCodeGuidance: 'Most lawn and garden equipment does not have electronic diagnostic codes. Troubleshooting is symptom-based. Newer zero-turns and riding mowers may have basic electronic fault indicators.',
      sourceGuidance: `Reference ${make} operator manuals, small engine repair guides, and outdoor power equipment forums. Include engine manufacturer (Briggs & Stratton, Kohler, Honda, Kawasaki) specific references when applicable.`,
      safetyConsiderations: 'Flag blade brake/clutch failures, fuel system leaks, muffler/exhaust fire risks, and any issue with safety interlocks (seat switch, blade engagement). Lawn equipment injuries are common — emphasize proper safety procedures.'
    },
    'power-tools': {
      diagnosticFrame: `Approach this as an experienced power tool repair technician diagnosing a ${desc}. Consider power source (corded/battery/gas/pneumatic), motor type (brushed/brushless), battery health if applicable, and common wear patterns. Reference ${make}-specific common issues and recall history.`,
      errorCodeGuidance: 'Most power tools display simple LED fault indicators rather than coded errors. Battery-powered tools may show battery health codes. Reference the specific manufacturer indicator system.',
      sourceGuidance: `Reference ${make} product manuals, authorized service center documentation, and power tool repair communities. Note warranty status — many professional tools have extended warranties.`,
      safetyConsiderations: 'Flag any electrical safety issues (cord damage, grounding), guard/safety mechanism failures, battery swelling/overheating, and any issue that could cause the tool to unexpectedly activate or fail under load.'
    },
    hvac: {
      diagnosticFrame: `Approach this as a licensed HVAC technician diagnosing a ${desc} HVAC system. Consider refrigerant charge, airflow, electrical controls, gas/oil fuel systems, and ductwork. Factor in unit age, seasonal timing, and maintenance history. Reference ${make}-specific common issues and service bulletins.`,
      errorCodeGuidance: 'HVAC error codes are manufacturer-specific. Carrier, Trane, Lennox, etc. each have proprietary fault code systems displayed on control boards via LED blink codes or digital displays.',
      sourceGuidance: `Reference ${make} installation and service manuals, ASHRAE standards, AHRI ratings, manufacturer technical bulletins, and HVAC technician forums. Note that refrigerant work requires EPA Section 608 certification.`,
      safetyConsiderations: 'Flag gas leak risks (CO poisoning potential), electrical hazards (high voltage capacitors, contactors), refrigerant handling requirements (EPA Section 608), and any issue affecting indoor air quality. HVAC failures in extreme weather can be dangerous for vulnerable occupants.'
    },
    'golf-carts': {
      diagnosticFrame: `Approach this as an experienced golf cart/LSV technician diagnosing a ${desc}. Consider gas vs electric powertrain, battery condition and age (if electric), controller/solenoid systems, and usage environment. Reference ${make}-specific common problems.`,
      errorCodeGuidance: 'Electric golf carts may display controller fault codes (varies by manufacturer — Curtis, Navitas, etc.). Gas carts typically have no electronic diagnostics.',
      sourceGuidance: `Reference ${make} service manuals, golf cart community forums, and controller manufacturer documentation. Note that LSVs must meet additional road-legal safety requirements.`,
      safetyConsiderations: 'Flag battery acid/hydrogen gas hazards (electric), fuel system leaks (gas), brake system failures, and any issue affecting stability. Golf carts are often operated by less experienced drivers including youth.'
    },
    electronics: {
      diagnosticFrame: `Approach this as an experienced electronics repair technician diagnosing a ${desc}. Consider hardware vs software issues, warranty status, data preservation, and repair vs replacement economics. Reference ${make}-specific known issues, firmware bugs, and repair programs.`,
      errorCodeGuidance: 'Error codes and messages vary widely. Capture exact error text, error numbers, and any diagnostic logs. Reference manufacturer-specific error databases.',
      sourceGuidance: `Reference ${make} support documentation, known issues databases, firmware release notes, and repair community resources (iFixit, manufacturer forums). Check for active recall or repair programs.`,
      safetyConsiderations: 'Flag battery swelling/overheating risks, electrical shock hazards, and data loss risks. Recommend data backup before any repair attempt. Note that some repairs void manufacturer warranties.'
    }
  };

  const defaultConfig = {
    diagnosticFrame: `Approach this as an experienced technician diagnosing a ${desc}. Connect the provided data to known failure patterns and real-world repair tactics. Reference specific manufacturer terminology and diagnostic procedures.`,
    errorCodeGuidance: 'Extract and explain any error codes, fault indicators, or diagnostic messages found in the submission.',
    sourceGuidance: 'When citing technical guidance, name specific sources (manufacturer bulletins, standards, forums). Never provide generic "look up a bulletin" — point to concrete resources.',
    safetyConsiderations: 'Flag any safety-critical issues prominently at the top of the diagnosis with clear urgency warnings.'
  };

  return configs[equipmentType] || defaultConfig;
}

// Report framework version — SELECTS the prompt in callLLM and is stamped on
// every analyses row (dataset versioning), so attribution can never drift from
// the prompt actually used. Read live from env (not module-load) so a
// container env flip + restart is the entire rollout switch.
//   v2.0 (default) — the original 15-Section Analysis Framework prompt below.
//   v3.x           — candidate v3-b "few-shot exemplar" (promptV3.js), winner
//                    of the 2026-07-02 blind A/B eval (18/18 vs v2.0,
//                    +11.4/+10.8 weighted — tests/prompt-eval/RESULTS.md).
const { V3B_SYSTEM, V3B_USER_TEMPLATE } = require('./promptV3.js');
function llmFrameworkVersion() {
  return process.env.LLM_FRAMEWORK_VERSION || 'v2.0';
}

// Chat-completion call that adapts to per-model param quirks so LLM_MODEL is a
// pure config switch. Newer OpenAI models (gpt-5.x, o-series) reject `max_tokens`
// and require `max_completion_tokens`; some reasoning models also reject a
// non-default `temperature`. We pick the right shape by model family up front,
// then defensively retry once each on a param-shape 400 (either direction) —
// mirroring the eval harness (tests/prompt-eval/lib/common.mjs) so production
// sends the SAME request the judges scored. Any other error propagates.
async function createChatCompletionAdaptive(openai, { model, messages, maxTokens, temperature }) {
  const usesMaxCompletionTokens = /^(gpt-5|o\d)/i.test(model);
  const state = { maxCompletion: usesMaxCompletionTokens, dropTemp: false };

  const build = () => {
    const body = { model, messages };
    if (!state.dropTemp) body.temperature = temperature;
    if (state.maxCompletion) body.max_completion_tokens = maxTokens;
    else body.max_tokens = maxTokens;
    return body;
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await openai.chat.completions.create(build());
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase();
      const is400 = err?.status === 400 || err?.statusCode === 400;
      if (is400 && !state.maxCompletion && msg.includes('max_completion_tokens')) {
        state.maxCompletion = true;
        continue;
      }
      if (is400 && !state.dropTemp && msg.includes('temperature')) {
        state.dropTemp = true;
        continue;
      }
      throw err;
    }
  }
  // Final attempt with whatever adaptations stuck (let a real error surface).
  return openai.chat.completions.create(build());
}

// FUNCTION: Call the LLM (OpenAI gpt-4o via the OpenAI-compatible client).
// Provider is fully env-driven — LLM_BASE_URL / LLM_MODEL / LLM_API_KEY — so
// switching to Groq (fast/cheap), Ollama (fully local self-hosted), xAI Grok,
// vLLM, or any other /v1 chat-completions server is a config change, not code.
// Keeps the exact same 15-section prompt contract and return shape.
async function callLLM(payload) {
  // OpenAI gpt-4o is the default. Override via LLM_BASE_URL / LLM_MODEL / LLM_API_KEY.
  const apiKey = process.env.LLM_API_KEY || secrets.LLM_API_KEY ||
                 process.env.OPENAI_API_KEY || secrets.OPENAI_API_KEY ||
                 process.env.DEEPSEEK_API_KEY || secrets.DEEPSEEK_API_KEY ||
                 process.env.GROQ_API_KEY || secrets.GROQ_API_KEY;

  const baseURL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
  const modelName = process.env.LLM_MODEL || 'gpt-4o'; // OpenAI gpt-4o. Strong long-form structured diagnostic reports.

  const detectedCodes = extractDiagnosticCodes(payload);

  // No mock path. This function ALWAYS talks to the real provider — a canned
  // report must never be able to reach the analyses table (dataset poison).
  // Tests mock the `openai` module boundary in jest, never a prod-code branch.
  if (!apiKey) {
    throw new Error('No LLM_API_KEY (or DEEPSEEK_API_KEY) configured. Set via env or SOPS secrets for self-hosted / VPS deployment.');
  }

  const openai = new OpenAI({ apiKey, baseURL });

  // DiagnosticPro Proprietary 15-Section Analysis Framework v2.0
  const equipmentContext = getEquipmentPromptContext(payload.equipmentType, payload);
  const prompt = `You are DiagnosticPro's MASTER TECHNICIAN. Use ALL the diagnostic data provided to give the most accurate analysis possible. Reference specific error codes, mileage patterns, and equipment type in your diagnosis.

CUSTOMER DATA PROVIDED:
- Vehicle: ${payload.make || 'N/A'} ${payload.model || 'N/A'} ${payload.year || 'N/A'}
- Equipment Type: ${payload.equipmentType || 'N/A'}
- Mileage/Hours: ${payload.mileageHours || 'N/A'}
- Serial Number: ${payload.serialNumber || 'N/A'}
- Problem: ${payload.problemDescription || 'N/A'}
- Symptoms: ${payload.symptoms || 'N/A'}
- Extracted Error Codes: ${(extractDiagnosticCodes(payload).join(', ')) || 'None auto-detected'}
- Raw Error/Code Text: ${payload.errorCodes || 'None provided'}
- When Started: ${payload.whenStarted || 'N/A'}
- Frequency: ${payload.frequency || 'N/A'}
- Urgency Level: ${payload.urgencyLevel || 'N/A'}
- Location/Environment: ${payload.locationEnvironment || 'N/A'}
- Usage Pattern: ${payload.usagePattern || 'N/A'}
- Previous Repairs: ${payload.previousRepairs || 'N/A'}
- Modifications: ${payload.modifications || 'N/A'}
- Troubleshooting Done: ${payload.troubleshootingSteps || 'N/A'}
- Shop Quote: ${payload.shopQuoteAmount || 'N/A'}
- Shop Recommendation: ${payload.shopRecommendation || 'N/A'}

IMPORTANT AUTHORING RULES:
1. ${equipmentContext.diagnosticFrame}
2. If one or more diagnostic trouble codes or error codes are mentioned anywhere above, extract them, explain what each code means, and weave them into the diagnosis, differential, and verification plans. ${equipmentContext.errorCodeGuidance}
3. ${equipmentContext.sourceGuidance}
4. Every section must deliver customer-ready guidance—no placeholders, no generic statements, and no references to “this section.” If data is missing, explicitly explain why and what to do next. Whenever a section calls for bullets, provide at least three detailed bullet items grounded in the equipment data. Use complete sentences and actionable detail throughout. Target 2,000–2,500 words overall.
5. End the PRIMARY DIAGNOSIS with an explicit confidence percentage. If the confidence is below 80%, explicitly tell the customer more data is required and add a sub-bullet list labelled “Data Needed” that enumerates the exact tests, measurements, or photos required next.
6. ${equipmentContext.safetyConsiderations}
7. Section 15 must be “Next Steps Summary” and provide exactly three concise, action-oriented bullets tailored to this case.

Provide your analysis using the following EXACT 15-section structure. Every section must satisfy the rules above.

1. PRIMARY DIAGNOSIS
- Root cause with confidence percentage
- Reference specific error codes if provided
- Component failure analysis
- Age/mileage considerations

2. DIFFERENTIAL DIAGNOSIS
- Alternative causes ranked by likelihood
- Why each cause is ruled in or out
- Equipment-specific failure patterns

3. DIAGNOSTIC VERIFICATION
- Exact tests the shop MUST perform
- Tools needed and expected readings
- Cost estimates for testing procedures

4. SHOP INTERROGATION
- 5 technical questions to expose incompetence
- Specific data they must show you
- Red flag responses to watch for

5. CONVERSATION SCRIPTING
- Opening: How to present yourself as informed (not confrontational)
- Phrasing: Frame questions as "curiosity" not accusations
- Example dialogue: Word-for-word scripts for each question
- Body language: Professional demeanor tips
- Response handling: What to say when they get defensive
- Exit strategy: Polite ways to decline and leave
- NEVER say: "My AI report says..." or "I got a second opinion online"
- ALWAYS say: "I've done some research and want to understand..."

6. COST BREAKDOWN
- Fair parts pricing analysis
- Labor hour estimates
- Total price range
- Overcharge identification markers

7. RIPOFF DETECTION
- Parts cannon indicators
- Diagnostic shortcuts to watch for
- Price gouging red flags

8. AUTHORIZATION GUIDE
- What to approve immediately
- What to reject outright
- When to get a second opinion

9. TECHNICAL EDUCATION
- System operation explanation
- Failure mechanism details
- Prevention tips for future

10. OEM PARTS STRATEGY
- Specific part numbers when possible
- Why OEM is critical for this repair
- Pricing sources and alternatives

11. NEGOTIATION TACTICS
- Price comparison strategies
- Labor justification questions
- Walk-away points and leverage

12. LIKELY CAUSES (RANKED)
- Primary cause: X% confidence with reasoning
- Secondary cause: X% confidence with reasoning
- Tertiary cause: X% confidence with reasoning

13. RECOMMENDATIONS
- Immediate actions required
- Future maintenance schedule
- Warning signs to monitor

14. SOURCE VERIFICATION
- 2-3 authoritative links confirming diagnosis (OEM TSBs, NHTSA, repair forums)
- Specific manufacturer technical service bulletins if applicable
- Independent verification sources (not sponsored content)
- NO generic links - must be directly relevant to this specific diagnosis

15. NEXT STEPS SUMMARY
- Top three immediate actions the customer should take next (exact to this case)

Return your response as a comprehensive diagnostic report following this structure exactly. Be specific, technical, and reference the customer's provided data throughout your analysis.`;

  // Framework selection. v2.0 = the literal above (byte-frozen eval baseline —
  // do not edit it without re-benching). v3.x = candidate v3-b rendered with
  // the SAME substitutions the eval harness used (renderCandidate in
  // tests/prompt-eval/lib/common.mjs), so production output matches what the
  // judges scored.
  const frameworkVersion = llmFrameworkVersion();
  let systemContent = 'You are DiagnosticPro\'s MASTER TECHNICIAN. Output ONLY the requested 15-section report with no extra preamble or markdown wrappers beyond the numbered headings.';
  let userContent = prompt;
  if (frameworkVersion.startsWith('v3')) {
    const customerDataBlock = `- Vehicle: ${payload.make || 'N/A'} ${payload.model || 'N/A'} ${payload.year || 'N/A'}
- Equipment Type: ${payload.equipmentType || 'N/A'}
- Mileage/Hours: ${payload.mileageHours || 'N/A'}
- Serial Number: ${payload.serialNumber || 'N/A'}
- Problem: ${payload.problemDescription || 'N/A'}
- Symptoms: ${payload.symptoms || 'N/A'}
- Extracted Error Codes: ${(detectedCodes.join(', ')) || 'None auto-detected'}
- Raw Error/Code Text: ${payload.errorCodes || 'None provided'}
- When Started: ${payload.whenStarted || 'N/A'}
- Frequency: ${payload.frequency || 'N/A'}
- Urgency Level: ${payload.urgencyLevel || 'N/A'}
- Location/Environment: ${payload.locationEnvironment || 'N/A'}
- Usage Pattern: ${payload.usagePattern || 'N/A'}
- Previous Repairs: ${payload.previousRepairs || 'N/A'}
- Modifications: ${payload.modifications || 'N/A'}
- Troubleshooting Done: ${payload.troubleshootingSteps || 'N/A'}
- Shop Quote: ${payload.shopQuoteAmount || 'N/A'}
- Shop Recommendation: ${payload.shopRecommendation || 'N/A'}`;
    const subs = {
      '{{CUSTOMER_DATA_BLOCK}}': customerDataBlock,
      '{{DIAGNOSTIC_FRAME}}': equipmentContext.diagnosticFrame,
      '{{ERROR_CODE_GUIDANCE}}': equipmentContext.errorCodeGuidance,
      '{{SOURCE_GUIDANCE}}': equipmentContext.sourceGuidance,
      '{{SAFETY_CONSIDERATIONS}}': equipmentContext.safetyConsiderations
    };
    const render = (tpl) => Object.entries(subs).reduce((out, [k, v]) => out.split(k).join(v), tpl);
    systemContent = render(V3B_SYSTEM);
    userContent = render(V3B_USER_TEMPLATE);
  }

  const chat = await createChatCompletionAdaptive(openai, {
    model: modelName,
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent }
    ],
    maxTokens: 8192,
    temperature: 0.25
  });

  const text = chat.choices?.[0]?.message?.content || '';

  // Debug logging (provider agnostic)
  console.log(`LLM analysis (base=${baseURL}, model=${modelName}, framework=${frameworkVersion}) length=${text ? text.length : 0} chars`);

  // Return the full analysis text for PDF generation (exact same shape as before)
  return {
    fullAnalysis: text,
    summary: "Comprehensive 15-section diagnostic analysis completed",
    confidence: 0.92,
    root_causes: ["Detailed analysis provided in full report"],
    recommendations: ["See comprehensive analysis for all recommendations"],
    cost_ranges: [],
    red_flags: [],
    questions: [],
    parts_needed: [],
    labor_estimate: "See analysis",
    difficulty: "See analysis",
    tools_required: [],
    detectedCodes
  };
}

// FUNCTION: Generate PDF report using new clean PDF generator
async function generatePDFReport(submissionId, analysis, payload) {
  console.log(`Generating PDF for: ${submissionId} using new clean PDF generator`);

  // This function will now buffer the PDF in memory using the new generator
  const generatePdfBuffer = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const tempPath = `/tmp/report_${submissionId}.pdf`;

        // Transform payload to match new generator's expected format
        const detectedCodes = Array.isArray(analysis?.detectedCodes) && analysis.detectedCodes.length
          ? analysis.detectedCodes
          : extractDiagnosticCodes(payload);

        const submission = {
          id: submissionId,
          make: payload.make,
          model: payload.model,
          year: payload.year,
          equipment_type: payload.equipmentType,
          serial_number: payload.serialNumber,
          mileage_hours: payload.mileageHours,
          full_name: payload.fullName || 'Anonymous',
          email: payload.email || 'Not provided',
          phone: payload.phone || 'Not provided',
          problem_description: payload.problemDescription,
          symptoms: Array.isArray(payload.symptoms) ? payload.symptoms : (payload.symptoms ? [payload.symptoms] : []),
          error_codes: detectedCodes.length
            ? detectedCodes
            : (Array.isArray(payload.errorCodes) ? payload.errorCodes : (payload.errorCodes ? [payload.errorCodes] : [])),
          when_started: payload.whenStarted,
          frequency: payload.frequency,
          urgency_level: payload.urgencyLevel,
          location_environment: payload.locationEnvironment,
          usage_pattern: payload.usagePattern,
          previous_repairs: payload.previousRepairs,
          modifications: payload.modifications,
          troubleshooting_steps: payload.troubleshootingSteps,
          shop_quote_amount: payload.shopQuoteAmount,
          shop_recommendation: payload.shopRecommendation
        };

        // Enrich analysis with parsed section content if raw text is available
        const parsedSections = parseFullAnalysis(analysis?.fullAnalysis);
        const enrichedAnalysis = {
          ...analysis,
          ...parsedSections
        };

        // Use the new clean PDF generator (async function returns a stream)
        const stream = await generateDiagnosticProPDF(submission, enrichedAnalysis, tempPath);

        stream.on('finish', () => {
          // Read the generated file and return as buffer
          const fs = require('fs');
          const pdfData = fs.readFileSync(tempPath);
          // Clean up temp file
          fs.unlinkSync(tempPath);
          resolve(pdfData);
        });

        stream.on('error', reject);

      } catch (error) {
        reject(error);
      }
    });
  };

  try {
    // 1. Generate the PDF into a buffer
    const pdfBuffer = await generatePdfBuffer();
    console.log(`PDF buffered successfully for: ${submissionId}`);

    const fileName = `reports/${submissionId}.pdf`;

    // Pure local FS (perfect self-host)
    const fs = require('fs');
    const path = require('path');
    const reportsDir = process.env.REPORTS_DIR || path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    const localPath = path.join(reportsDir, `${submissionId}.pdf`);
    fs.writeFileSync(localPath, pdfBuffer);
    console.log(`PDF written locally: ${localPath}`);

    // public URL served by backend
    const publicUrl = `/reports/download/${submissionId}`;

    return {
      buffer: pdfBuffer,
      publicUrl,
      fileName
    };

  } catch (error) {
    console.error(`PDF generation or local write failed for ${submissionId}:`, error);
    throw error;
  }
}

// ──────────────────────────────────────────
// Whop OAuth + Membership Integration
// ──────────────────────────────────────────

// Fetch with timeout (15s default) to prevent hanging on Whop API
function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// Constant-time signature compare; length mismatch is a normal auth failure
// (return false → 401), never a thrown error (500)
function safeSignatureCompare(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// Verify Whop webhook signature over the RAW request body (Buffer).
// Primary scheme: Standard Webhooks (Whop follows it) — HMAC-SHA256 over
// "<webhook-id>.<webhook-timestamp>.<payload>", secret is base64 after the
// "whsec_" prefix, header "webhook-signature" holds "v1,<base64>" entries.
// Fallback: plain HMAC-SHA256 of the body (hex or base64) via
// whop-signature / x-whop-signature, so manual curl tests still work in dev.
function verifyWhopWebhookSignature(rawBody, headers) {
  const webhookSecret = secrets.WHOP_WEBHOOK_SECRET || process.env.WHOP_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logStructured({ phase: 'whopWebhook', status: 'warn', message: 'WHOP_WEBHOOK_SECRET not configured, skipping verification' });
    return false;
  }

  const bodyBuf = Buffer.isBuffer(rawBody)
    ? rawBody
    : Buffer.from(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody));

  const msgId = headers['webhook-id'];
  const msgTimestamp = headers['webhook-timestamp'];
  const msgSignature = headers['webhook-signature'];

  if (msgId && msgTimestamp && msgSignature) {
    // Standard Webhooks scheme
    const key = Buffer.from(webhookSecret.replace(/^whsec_/, ''), 'base64');
    const signedContent = `${msgId}.${msgTimestamp}.${bodyBuf.toString('utf8')}`;
    const expectedSig = crypto.createHmac('sha256', key).update(signedContent).digest('base64');
    // Header may hold multiple space-delimited signatures: "v1,<b64> v1,<b64>"
    return msgSignature.split(' ').some(entry => {
      const sig = entry.includes(',') ? entry.split(',')[1] : entry;
      return Boolean(sig) && safeSignatureCompare(sig, expectedSig);
    });
  }

  // Simple-HMAC fallback (dev / manual curl)
  const legacySig = headers['whop-signature'] || headers['x-whop-signature'];
  if (!legacySig) return false;
  const expectedHex = crypto.createHmac('sha256', webhookSecret).update(bodyBuf).digest('hex');
  const expectedB64 = crypto.createHmac('sha256', webhookSecret).update(bodyBuf).digest('base64');
  return safeSignatureCompare(legacySig, expectedHex) || safeSignatureCompare(legacySig, expectedB64);
}

// Middleware: optionally attach Whop membership status to request
async function checkWhopMember(req, res, next) {
  const whopToken = req.headers['x-whop-token'];
  if (!whopToken) {
    // No Whop token — fall through to normal Stripe pay-per-use flow
    req.isWhopMember = false;
    return next();
  }

  try {
    // Verify membership via Whop API
    const membershipRes = await fetchWithTimeout(
      `https://api.whop.com/api/v5/me/memberships?product_id=${WHOP_PRODUCT_ID}&valid=true`,
      { headers: { Authorization: `Bearer ${whopToken}` } }
    );

    if (!membershipRes.ok) {
      req.isWhopMember = false;
      return next();
    }

    const membershipData = await membershipRes.json();
    req.isWhopMember = Array.isArray(membershipData.data) && membershipData.data.length > 0;
    req.whopMembership = req.isWhopMember ? membershipData.data[0] : null;

    // Fetch user info for logging
    if (req.isWhopMember) {
      const userRes = await fetchWithTimeout('https://api.whop.com/api/v5/me', {
        headers: { Authorization: `Bearer ${whopToken}` }
      });
      if (userRes.ok) {
        req.whopUser = await userRes.json();
      }
    }
  } catch (error) {
    logStructured({
      phase: 'whopAuth',
      status: 'error',
      reqId: req.reqId,
      error: { code: 'WHOP_VERIFY_ERROR', message: error.message }
    });
    req.isWhopMember = false;
  }

  next();
}

// ENDPOINT: Exchange OAuth code for Whop access token + check membership
app.post('/api/auth/whop-exchange', async (req, res) => {
  const phase = 'whopExchange';

  try {
    const { code, code_verifier, state } = req.body;

    if (!code || !code_verifier) {
      return res.status(400).json({ error: 'Missing code or code_verifier' });
    }

    // Exchange authorization code for access token
    const tokenRes = await fetchWithTimeout('https://data.whop.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        code_verifier,
        client_id: WHOP_APP_ID,
        redirect_uri: WHOP_REDIRECT_URI
      })
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      logStructured({ phase, status: 'error', reqId: req.reqId, error: { code: 'TOKEN_EXCHANGE_FAILED', message: errText } });
      return res.status(401).json({ error: 'Authentication failed' });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // Fetch user info
    const userRes = await fetchWithTimeout('https://api.whop.com/api/v5/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userRes.ok) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    const user = await userRes.json();

    // Check active membership
    const membershipRes = await fetchWithTimeout(
      `https://api.whop.com/api/v5/me/memberships?product_id=${WHOP_PRODUCT_ID}&valid=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    let isMember = false;
    let membershipId = null;
    let membershipPlanId = null;

    if (membershipRes.ok) {
      const membershipData = await membershipRes.json();
      isMember = Array.isArray(membershipData.data) && membershipData.data.length > 0;
      membershipId = isMember ? membershipData.data[0].id : null;
      membershipPlanId = isMember ? membershipData.data[0].plan_id : null;
    }

    // Upsert to SQLite whop_users (replaces Firestore; no raw tokens stored)
    const whopUserId = user.id;
    const whopNow = new Date().toISOString();
    db.prepare(`
      INSERT OR REPLACE INTO whop_users (id, whop_id, username, email, is_member, membership_id, last_verified, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(whopUserId, whopUserId, user.username || '', user.email || '', isMember ? 1 : 0, membershipId, whopNow, whopNow);

    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId,
      whopUserId,
      isMember
    });

    res.json({
      success: true,
      token: accessToken,
      user: {
        id: whopUserId,
        username: user.username,
        name: user.name || '',
        email: user.email
      },
      isMember,
      membershipId,
      membershipPlan: membershipPlanId
    });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      error: { code: 'WHOP_EXCHANGE_ERROR', message: error.message }
    });
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// ENDPOINT: Verify Whop membership status (called before each diagnostic)
app.get('/api/auth/whop-verify', async (req, res) => {
  const token = req.headers['x-whop-token'];
  if (!token) {
    return res.json({ isMember: false });
  }

  try {
    const memberRes = await fetchWithTimeout(
      `https://api.whop.com/api/v5/me/memberships?product_id=${WHOP_PRODUCT_ID}&valid=true`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!memberRes.ok) {
      return res.json({ isMember: false });
    }
    const memberships = await memberRes.json();
    const isMember = Array.isArray(memberships.data) && memberships.data.length > 0;
    res.json({ isMember });
  } catch (error) {
    logStructured({ phase: 'whopVerify', status: 'error', error: { message: error.message } });
    res.json({ isMember: false });
  }
});

// ENDPOINT: Whop webhook handler for membership changes
app.post('/api/webhooks/whop', async (req, res) => {
  const phase = 'whopWebhook';

  try {
    // Verify webhook signature over the raw body bytes (express.raw route above)
    if (!verifyWhopWebhookSignature(req.body, req.headers)) {
      logStructured({ phase, status: 'rejected', reason: 'Invalid or missing webhook signature' });
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    // Parse the raw Buffer only after the signature checks out
    let event;
    try {
      event = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString('utf8')) : req.body;
    } catch (parseErr) {
      return res.status(400).json({ error: 'Invalid JSON body', code: 'INVALID_BODY' });
    }
    const { action, data } = event;

    logStructured({ phase, status: 'received', action, userId: data?.user_id });

    if (action === 'membership.went_valid' || action === 'membership.went_invalid') {
      const userId = data?.user_id;
      if (userId) {
        // Update whop user membership (SQLite)
        db.prepare(`
          UPDATE whop_users SET is_member = ?, last_verified = ?, updated_at = ? WHERE id = ?
        `).run(action === 'membership.went_valid' ? 1 : 0, new Date().toISOString(), new Date().toISOString(), userId);
      }
    }

    res.json({ received: true });
  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      error: { code: 'WHOP_WEBHOOK_ERROR', message: error.message }
    });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// ENDPOINT: Whop member submits diagnostic (skips Stripe payment)
app.post('/api/whop/analyze', checkWhopMember, async (req, res) => {
  const phase = 'whopAnalyze';

  try {
    if (!req.isWhopMember) {
      return res.status(403).json({ error: 'Active Whop membership required' });
    }

    const { submissionId } = req.body;

    if (!submissionId) {
      return res.status(400).json({ error: 'Missing submissionId' });
    }

    // note: direct ref no longer used, using db.prepare
    const subRow = db.prepare('SELECT * FROM diagnostic_submissions WHERE id = ?').get(submissionId);

    if (!subRow) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const submissionData = { ...subRow, payload: subRow.payload ? JSON.parse(subRow.payload) : {} };

    // Verify this submission belongs to the requesting member (match email)
    if (req.whopUser?.email && submissionData.payload?.email &&
        req.whopUser.email.toLowerCase() !== submissionData.payload.email.toLowerCase()) {
      return res.status(403).json({ error: 'Submission does not belong to this user' });
    }

    // Check if already processing or ready
    if (submissionData.status === 'processing' || submissionData.status === 'ready') {
      return res.json({ status: submissionData.status, message: 'Already processed' });
    }

    // Mark as paid via membership (SQLite)
    const paidNow = new Date().toISOString();
    db.prepare(`
      UPDATE diagnostic_submissions SET status = 'paid', updated_at = ?, paid_at = ?, paid_via = 'whop_membership',
      whop_user_id = ?, whop_membership_id = ?, used_with_membership = 1, charged = 0, amount_paid_cents = 0
      WHERE id = ?
    `).run(paidNow, paidNow, req.whopUser?.id || '', req.whopMembership?.id || '', submissionId);

    // Create analysis record (SQLite; upsert — never REPLACE, which nulls unnamed columns)
    const whopNow = new Date().toISOString();
    db.prepare(`
      INSERT INTO analyses (id, submission_id, status, created_at, updated_at, model, req_id, paid_via)
      VALUES (?, ?, 'queued', ?, ?, ?, ?, 'whop_membership')
      ON CONFLICT(id) DO UPDATE SET
        status = 'queued',
        updated_at = excluded.updated_at,
        model = excluded.model,
        req_id = excluded.req_id,
        paid_via = excluded.paid_via
    `).run(submissionId, submissionId, whopNow, whopNow, process.env.LLM_MODEL || 'gpt-4o', req.reqId);

    logStructured({
      phase,
      status: 'ok',
      reqId: req.reqId,
      submissionId,
      whopUserId: req.whopUser?.id
    });

    // Start analysis async (guard against missing payload)
    if (submissionData.payload) {
      processAnalysis(submissionId, submissionData.payload, req.reqId).catch(error => {
        logStructured({
          phase: 'whopAnalyzeQueue',
          status: 'error',
          reqId: req.reqId,
          submissionId,
          error: { code: 'ANALYSIS_QUEUE_ERROR', message: error.message }
        });
      });
    }

    res.json({ status: 'processing', message: 'Analysis started (membership)' });

  } catch (error) {
    logStructured({
      phase,
      status: 'error',
      reqId: req.reqId,
      error: { code: 'WHOP_ANALYZE_ERROR', message: error.message }
    });
    res.status(500).json({ error: 'Failed to start analysis' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server only when executed directly
if (require.main === module) {
  // Load secrets from Secret Manager before starting server
  (async () => {
    try {
      console.log('🔐 Loading secrets from environment (SOPS-materialized)...');
      secrets = await loadSecrets();

      // Initialize Stripe with secret from Secret Manager
      stripeClient = stripe(secrets.STRIPE_SECRET_KEY);

      console.log('✅ Secrets loaded successfully');

      app.listen(PORT, () => {
        console.log(`🚀 DiagnosticPro Backend running on port ${PORT} (self-hosted)`);
        console.log(`💰 Price: $4.99 USD (499 cents)`);
        console.log(`🗄️  DB: SQLite (better-sqlite3)`);
        console.log(`📄 Reports: local FS`);
        console.log('🔒 Secrets via SOPS/age');
        console.log('\nEndpoints:');
        console.log('  POST /saveSubmission');
        console.log('  POST /createCheckoutSession');
        console.log('  POST /analysisStatus');
        console.log('  POST /analyzeDiagnostic');
        console.log('  GET  /reports/download/:id');
        console.log('  POST /stripeWebhookForward (PRIVATE)');
        console.log('  POST /api/auth/whop-exchange');
        console.log('  GET  /api/auth/whop-verify');
        console.log('  POST /api/webhooks/whop');
        console.log('  POST /api/whop/analyze');
        console.log('  GET  /healthz');
      });
    } catch (error) {
      console.error('❌ Failed to load secrets:', error);
      console.error('Falling back to environment variables');

      // Fallback to environment variables
      stripeClient = stripe(process.env.STRIPE_SECRET_KEY);
      secrets = {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
        API_GATEWAY_KEY: process.env.API_GATEWAY_KEY || process.env.VITE_API_KEY,
        WHOP_API_KEY: process.env.WHOP_API_KEY,
        LLM_API_KEY: process.env.LLM_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.GROQ_API_KEY,
        DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
        GROQ_API_KEY: process.env.GROQ_API_KEY
      };

      app.listen(PORT, () => {
        console.log(`🚀 DiagnosticPro Backend running on port ${PORT} (using env vars)`);
      });
    }
  })();
}

module.exports = app;
module.exports.parseFullAnalysis = parseFullAnalysis;
module.exports.processAnalysis = processAnalysis;
module.exports.generatePDFReport = generatePDFReport;
module.exports.callLLM = callLLM;
module.exports.extractDiagnosticCodes = extractDiagnosticCodes;
