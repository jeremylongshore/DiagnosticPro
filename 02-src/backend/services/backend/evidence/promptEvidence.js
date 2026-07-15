/**
 * Pure helpers for photo evidence → CUSTOMER_DATA_BLOCK fusion.
 * Used by callLLM (v3 {{CUSTOMER_DATA_BLOCK}} and v2 customer section).
 * No I/O, no Express, no LLM — unit-test friendly.
 */

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MiB
const DEFAULT_MAX_PHOTOS = 3;
const DEFAULT_ORPHAN_TTL_HOURS = 48;

/**
 * @param {Array<{ label?: string, caption?: string, ocr_text?: string|null }>} items
 * @returns {string} empty string if no usable items
 */
function formatPhotoEvidenceBlock(items) {
  if (!Array.isArray(items) || items.length === 0) return '';

  const lines = [];
  let n = 0;
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const caption = (item.caption || '').trim();
    if (!caption) continue;
    n += 1;
    const label = (item.label || '').trim();
    const head = label ? `Photo ${n} (${label})` : `Photo ${n}`;
    lines.push(`- ${head}: ${caption}`);
    const ocr = item.ocr_text != null ? String(item.ocr_text).trim() : '';
    if (ocr) {
      lines.push(`  OCR: ${ocr}`);
    }
  }
  if (lines.length === 0) return '';
  return ['PHOTO EVIDENCE:', ...lines].join('\n');
}

/**
 * @param {string} baseBlock
 * @param {string} photoBlock
 */
function appendEvidenceToCustomerBlock(baseBlock, photoBlock) {
  const base = (baseBlock || '').replace(/\s+$/u, '');
  const photo = (photoBlock || '').trim();
  if (!photo) return base;
  if (!base) return photo;
  return `${base}\n\n${photo}`;
}

/**
 * Same field list historically inlined in callLLM v2/v3.
 * @param {object} payload
 * @param {string[]} [detectedCodes]
 * @param {Array} [photoItems]
 */
function buildCustomerDataBlock(payload = {}, detectedCodes = [], photoItems = []) {
  const codes = Array.isArray(detectedCodes) ? detectedCodes : [];
  const base = [
    `- Vehicle: ${payload.make || 'N/A'} ${payload.model || 'N/A'} ${payload.year || 'N/A'}`,
    `- Equipment Type: ${payload.equipmentType || 'N/A'}`,
    `- Mileage/Hours: ${payload.mileageHours || 'N/A'}`,
    `- Serial Number: ${payload.serialNumber || 'N/A'}`,
    `- Problem: ${payload.problemDescription || 'N/A'}`,
    `- Symptoms: ${payload.symptoms || 'N/A'}`,
    `- Extracted Error Codes: ${codes.length ? codes.join(', ') : 'None auto-detected'}`,
    `- Raw Error/Code Text: ${payload.errorCodes || 'None provided'}`,
    `- When Started: ${payload.whenStarted || 'N/A'}`,
    `- Frequency: ${payload.frequency || 'N/A'}`,
    `- Urgency Level: ${payload.urgencyLevel || 'N/A'}`,
    `- Location/Environment: ${payload.locationEnvironment || 'N/A'}`,
    `- Usage Pattern: ${payload.usagePattern || 'N/A'}`,
    `- Previous Repairs: ${payload.previousRepairs || 'N/A'}`,
    `- Modifications: ${payload.modifications || 'N/A'}`,
    `- Troubleshooting Done: ${payload.troubleshootingSteps || 'N/A'}`,
    `- Shop Quote: ${payload.shopQuoteAmount || 'N/A'}`,
    `- Shop Recommendation: ${payload.shopRecommendation || 'N/A'}`
  ].join('\n');

  return appendEvidenceToCustomerBlock(base, formatPhotoEvidenceBlock(photoItems));
}

/**
 * @param {{ mime: string, bytes: number, existingCount?: number, maxBytes?: number, maxPhotos?: number }} opts
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validatePhotoUpload({
  mime,
  bytes,
  existingCount = 0,
  maxBytes = DEFAULT_MAX_BYTES,
  maxPhotos = DEFAULT_MAX_PHOTOS
}) {
  if (!mime || !ALLOWED_MIME.has(String(mime).toLowerCase())) {
    return { ok: false, error: 'unsupported_mime' };
  }
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) {
    return { ok: false, error: 'invalid_size' };
  }
  if (size > maxBytes) {
    return { ok: false, error: 'file_too_large' };
  }
  if (existingCount >= maxPhotos) {
    return { ok: false, error: 'too_many_photos' };
  }
  return { ok: true };
}

/**
 * @param {{ status?: string, created_at?: string }} submission
 * @param {Date|string|number} [now]
 * @param {number} [ttlHours]
 */
function isOrphanPending(submission, now = Date.now(), ttlHours = DEFAULT_ORPHAN_TTL_HOURS) {
  if (!submission || submission.status !== 'pending') return false;
  if (!submission.created_at) return false;
  const created = new Date(submission.created_at).getTime();
  if (!Number.isFinite(created)) return false;
  const nowMs = typeof now === 'number' ? now : new Date(now).getTime();
  const ageMs = nowMs - created;
  return ageMs > ttlHours * 60 * 60 * 1000;
}

module.exports = {
  formatPhotoEvidenceBlock,
  appendEvidenceToCustomerBlock,
  buildCustomerDataBlock,
  validatePhotoUpload,
  isOrphanPending,
  ALLOWED_MIME,
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_PHOTOS,
  DEFAULT_ORPHAN_TTL_HOURS
};
