const PDFDocument = require('pdfkit');
const {
  DEFAULT_MAX_DOCUMENT_BYTES,
  DEFAULT_MAX_DOCUMENTS,
  detectDocumentMime,
  validateDocumentUpload,
  extractDocumentText,
  normalizeExtractedText
} = require('../evidence/documents');

function makePdf(text) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.fontSize(12).text(text);
    doc.end();
  });
}

describe('document evidence helpers', () => {
  test('detects supported document types from signatures and extensions', () => {
    expect(detectDocumentMime(Buffer.from('%PDF-1.7\n'), 'application/octet-stream', 'order.bin')).toBe('application/pdf');
    expect(
      detectDocumentMime(
        Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00]),
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'order.docx'
      )
    ).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(detectDocumentMime(Buffer.from('WO-1042,P0301\n'), 'text/csv', 'order.csv')).toBe('text/csv');
    expect(detectDocumentMime(Buffer.from([0xff, 0xd8, 0xff]), 'image/jpeg', 'photo.jpg')).toBeNull();
  });

  test('validates size, MIME, and document count limits', () => {
    expect(validateDocumentUpload({
      mime: 'application/pdf',
      bytes: 1000,
      existingCount: 0
    })).toEqual({ ok: true });
    expect(validateDocumentUpload({
      mime: 'image/png',
      bytes: 1000,
      existingCount: 0
    })).toEqual({ ok: false, error: 'unsupported_mime' });
    expect(validateDocumentUpload({
      mime: 'application/pdf',
      bytes: DEFAULT_MAX_DOCUMENT_BYTES + 1,
      existingCount: 0
    })).toEqual({ ok: false, error: 'file_too_large' });
    expect(validateDocumentUpload({
      mime: 'application/pdf',
      bytes: 1000,
      existingCount: DEFAULT_MAX_DOCUMENTS
    })).toEqual({ ok: false, error: 'too_many_documents' });
  });

  test('extracts bounded text from plain text and PDF documents', async () => {
    const text = await extractDocumentText(
      Buffer.from('Work order WO-1042\nCode P0301\n'),
      'text/plain',
      'order.txt'
    );
    expect(text).toMatchObject({ ok: true, status: 'ready', parser: 'plain-text' });
    expect(text.text).toContain('WO-1042');

    const pdf = await extractDocumentText(await makePdf('Technician recorded P0301'), 'application/pdf', 'order.pdf');
    expect(pdf).toMatchObject({ ok: true, status: 'ready' });
    expect(['pdf-text', 'pdftotext']).toContain(pdf.parser);
    expect(pdf.text).toContain('P0301');
    expect(pdf.pageCount).toBe(1);
  });

  test('marks a PDF without a text layer as needing OCR', async () => {
    const scanned = await extractDocumentText(await makePdf(''), 'application/pdf', 'scanned-order.pdf');
    expect(scanned).toMatchObject({ ok: true, status: 'needs_ocr', reason: 'no_text_layer' });
    expect(scanned.text).toBe('');
  });

  test('normalizes control characters and enforces a text bound', () => {
    expect(normalizeExtractedText('a\u0000\r\nb\n\n\n\nc', 3)).toEqual({
      text: 'a\nb',
      truncated: true,
      sourceChars: 7
    });
  });
});
