/**
 * Work-order and document evidence helpers.
 *
 * Documents are parsed before they are included in an AI request. The parser
 * returns text plus provenance metadata; it never attempts to make a
 * diagnosis. Scanned PDFs are retained as `needs_ocr` evidence so the UI can
 * be honest about what the report did and did not use.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

const execFileAsync = promisify(execFile);

const DOCUMENT_MIME = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/json'
]);

const TEXT_MIME = new Set(['text/plain', 'text/csv', 'application/json']);
const DOCUMENT_KIND = new Set(['work_order', 'document']);

const EXTENSION_MIME = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
  '.json': 'application/json'
};

const DEFAULT_MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_DOCUMENTS = 5;
const DEFAULT_MAX_DOCUMENT_TEXT_CHARS = 24_000;

function normalizeDocumentKind(kind) {
  const normalized = String(kind || '').trim().toLowerCase();
  return DOCUMENT_KIND.has(normalized) ? normalized : null;
}

function isLikelyUtf8Text(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return false;
  if (buffer.includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the actual supported document type from a magic header, MIME, and
 * extension. Text formats do not have a reliable magic header, so they must
 * also be valid UTF-8 and have an allowed declaration or extension.
 */
function detectDocumentMime(buffer, declaredMime = '', originalName = '') {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return null;

  const declared = String(declaredMime || '').toLowerCase().split(';')[0].trim();
  const extension = path.extname(String(originalName || '')).toLowerCase();

  if (buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return 'application/pdf';
  }

  // DOCX is an OOXML ZIP. Mammoth performs the structural validation during
  // extraction; the PK header prevents arbitrary binary data being treated as
  // an office document based only on a filename.
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    (declared === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension === '.docx')
  ) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  const candidate = TEXT_MIME.has(declared) ? declared : EXTENSION_MIME[extension];
  if (TEXT_MIME.has(candidate) && isLikelyUtf8Text(buffer)) return candidate;
  return null;
}

function validateDocumentUpload({
  mime,
  bytes,
  existingCount = 0,
  maxBytes = DEFAULT_MAX_DOCUMENT_BYTES,
  maxDocuments = DEFAULT_MAX_DOCUMENTS
}) {
  if (!mime || !DOCUMENT_MIME.has(String(mime).toLowerCase())) {
    return { ok: false, error: 'unsupported_mime' };
  }
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, error: 'invalid_size' };
  }
  if (size > maxBytes) {
    return { ok: false, error: 'file_too_large' };
  }
  if (existingCount >= maxDocuments) {
    return { ok: false, error: 'too_many_documents' };
  }
  return { ok: true };
}

function normalizeExtractedText(value, maxChars = DEFAULT_MAX_DOCUMENT_TEXT_CHARS) {
  const normalized = String(value || '')
    .replace(/\u0000/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n\t]+/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
  return {
    text: normalized.slice(0, maxChars),
    truncated: normalized.length > maxChars,
    sourceChars: normalized.length
  };
}

async function extractPdfWithCommand(buffer) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'diagnosticpro-pdf-'));
  const sourcePath = path.join(tempDir, 'source.pdf');
  try {
    fs.writeFileSync(sourcePath, buffer, { mode: 0o600 });
    const textResult = await execFileAsync('pdftotext', ['-layout', sourcePath, '-'], {
      encoding: 'utf8',
      maxBuffer: 2 * 1024 * 1024
    });
    let pageCount = null;
    try {
      const infoResult = await execFileAsync('pdfinfo', [sourcePath], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024
      });
      const match = String(infoResult.stdout || '').match(/^Pages:\s+(\d+)$/m);
      if (match) pageCount = Number(match[1]);
    } catch {
      // Text extraction is still useful when pdfinfo is not installed.
    }
    return { text: textResult.stdout || '', pageCount, parser: 'pdftotext' };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function extractPdfText(buffer) {
  let pdfParseError = null;
  try {
    const pdf = new PDFParse({ data: buffer });
    try {
      const parsed = await pdf.getText();
      return {
        // pdf-parse adds a page delimiter even when a PDF contains no text
        // layer. Remove that bookkeeping before deciding whether OCR is
        // needed; otherwise scanned work orders would look "ready" with no
        // usable evidence.
        text: String(parsed?.text || '').replace(/\s*--\s*\d+\s+of\s+\d+\s*--\s*/g, '\n'),
        pageCount: Number.isFinite(parsed?.total) ? parsed.total : null,
        parser: 'pdf-text'
      };
    } finally {
      await pdf.destroy();
    }
  } catch (error) {
    pdfParseError = error;
  }

  try {
    return await extractPdfWithCommand(buffer);
  } catch (commandError) {
    const detail = [pdfParseError?.message, commandError?.message].filter(Boolean).join('; ');
    throw new Error(detail || 'PDF text extraction failed');
  }
}

/**
 * Extract text without interpreting it. The caller decides whether the
 * returned text is safe/useful enough to add to the diagnostic prompt.
 */
async function extractDocumentText(
  buffer,
  mime,
  originalName = '',
  { maxChars = DEFAULT_MAX_DOCUMENT_TEXT_CHARS } = {}
) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { ok: false, error: 'empty_document' };
  }

  try {
    let rawText = '';
    let parser = 'plain-text';
    let pageCount = null;
    let warningCount = 0;

    if (mime === 'application/pdf') {
      const parsed = await extractPdfText(buffer);
      rawText = parsed.text;
      pageCount = parsed.pageCount;
      parser = parsed.parser;
    } else if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const parsed = await mammoth.extractRawText({ buffer });
      rawText = parsed?.value || '';
      warningCount = Array.isArray(parsed?.messages) ? parsed.messages.length : 0;
      parser = 'docx-text';
    } else if (TEXT_MIME.has(mime)) {
      rawText = buffer.toString('utf8');
      parser = mime === 'application/json' ? 'json-text' : 'plain-text';
    } else {
      return { ok: false, error: 'unsupported_mime' };
    }

    const normalized = normalizeExtractedText(rawText, maxChars);
    if (!normalized.text) {
      if (mime === 'application/pdf') {
        return {
          ok: true,
          status: 'needs_ocr',
          text: '',
          parser,
          pageCount,
          warningCount,
          truncated: false,
          sourceChars: 0,
          reason: 'no_text_layer',
          originalName
        };
      }
      return { ok: false, error: 'empty_document' };
    }

    return {
      ok: true,
      status: 'ready',
      text: normalized.text,
      parser,
      pageCount,
      warningCount,
      truncated: normalized.truncated,
      sourceChars: normalized.sourceChars,
      originalName
    };
  } catch (error) {
    return {
      ok: false,
      error: 'document_parse_failed',
      detail: error?.message || String(error)
    };
  }
}

module.exports = {
  DOCUMENT_MIME,
  DOCUMENT_KIND,
  DEFAULT_MAX_DOCUMENT_BYTES,
  DEFAULT_MAX_DOCUMENTS,
  DEFAULT_MAX_DOCUMENT_TEXT_CHARS,
  normalizeDocumentKind,
  detectDocumentMime,
  validateDocumentUpload,
  normalizeExtractedText,
  extractDocumentText
};
