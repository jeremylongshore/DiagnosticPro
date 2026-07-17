/**
 * Client-side image compression for evidence uploads.
 * Best-effort: tries canvas-based resize to `maxLongEdge` (default 1280 px);
 * falls back to the original blob if the runtime has no OffscreenCanvas/HTMLCanvas
 * (Node/jsdom tests). Never throws.
 */

export interface CompressOptions {
  maxLongEdge?: number;
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
  quality?: number;
}

const DEFAULT_MAX_LONG_EDGE = 1280;
const DEFAULT_MIME = 'image/jpeg' as const;
const DEFAULT_QUALITY = 0.82;

function isCanvasUsable(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext && c.getContext('2d'));
  } catch {
    return false;
  }
}

async function blobToImageBitmap(blob: Blob): Promise<HTMLImageElement | ImageBitmap | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob);
    } catch {
      // fall through to <img>
    }
  }
  if (typeof Image !== 'undefined') {
    return await new Promise<HTMLImageElement | null>((resolve) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });
  }
  return null;
}

/**
 * Compress a photo Blob. Returns a JPEG Blob (default) sized so its longest
 * edge <= maxLongEdge px. Always returns SOMETHING — the input blob if
 * canvas decoding isn't available.
 */
export async function compressImage(file: Blob | File, opts: CompressOptions = {}): Promise<Blob> {
  const maxLongEdge = opts.maxLongEdge ?? DEFAULT_MAX_LONG_EDGE;
  const mimeType = opts.mimeType ?? DEFAULT_MIME;
  const quality = opts.quality ?? DEFAULT_QUALITY;

  if (!isCanvasUsable()) return file;
  const img = await blobToImageBitmap(file);
  if (!img) return file;

  const w = (img as HTMLImageElement).naturalWidth ?? (img as ImageBitmap).width;
  const h = (img as HTMLImageElement).naturalHeight ?? (img as ImageBitmap).height;
  if (!w || !h) return file;

  const scale = Math.min(1, maxLongEdge / Math.max(w, h));
  const targetW = Math.max(1, Math.round(w * scale));
  const targetH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img as CanvasImageSource, 0, 0, targetW, targetH);

  return await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b || file), mimeType, quality);
  });
}

/**
 * Validates the file before compression/upload. Pure.
 */
export function validatePhotoFile(file: { type?: string; size?: number }): { ok: true } | { ok: false; error: string } {
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!file.type || !allowed.has(String(file.type).toLowerCase())) {
    return { ok: false, error: 'unsupported_mime' };
  }
  const size = Number(file.size);
  if (!Number.isFinite(size) || size <= 0) return { ok: false, error: 'invalid_size' };
  if (size > 2 * 1024 * 1024) return { ok: false, error: 'file_too_large' };
  return { ok: true };
}