import { validatePhotoFile } from "../imageCompress";

describe('validatePhotoFile', () => {
  test('accepts jpeg/png/webp under 2 MiB', () => {
    expect(validatePhotoFile({ type: 'image/jpeg', size: 1024 })).toEqual({ ok: true });
    expect(validatePhotoFile({ type: 'image/png', size: 2 * 1024 * 1024 - 1 })).toEqual({ ok: true });
    expect(validatePhotoFile({ type: 'image/webp', size: 500_000 })).toEqual({ ok: true });
  });

  test('rejects unsupported mimes', () => {
    expect(validatePhotoFile({ type: 'image/gif', size: 1024 })).toMatchObject({ ok: false, error: 'unsupported_mime' });
    expect(validatePhotoFile({ type: '', size: 1024 })).toMatchObject({ ok: false, error: 'unsupported_mime' });
  });

  test('rejects oversize files (>= 2 MiB + 1)', () => {
    expect(validatePhotoFile({ type: 'image/png', size: 2 * 1024 * 1024 + 1 })).toMatchObject({ ok: false, error: 'file_too_large' });
  });

  test('rejects zero/negative size', () => {
    expect(validatePhotoFile({ type: 'image/png', size: 0 })).toMatchObject({ ok: false, error: 'invalid_size' });
    expect(validatePhotoFile({ type: 'image/png', size: -5 })).toMatchObject({ ok: false, error: 'invalid_size' });
    expect(validatePhotoFile({ type: 'image/png' })).toMatchObject({ ok: false, error: 'invalid_size' });
  });
});