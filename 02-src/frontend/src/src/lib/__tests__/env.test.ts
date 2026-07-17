// Tests for getEnv (self-host safe env getter — never throws)

import { getEnv } from '../env';

describe('getEnv (self-host safe env getter)', () => {
  const TOUCHED = ['VITE_API_BASE', 'VITE_API_GATEWAY_URL', 'VITE_EDGE_BASE'];

  afterEach(() => {
    for (const key of TOUCHED) delete process.env[key];
  });

  it('returns the process.env value for a set key', () => {
    process.env.VITE_API_BASE = 'https://api.diagnosticpro.io';

    expect(getEnv('VITE_API_BASE')).toBe('https://api.diagnosticpro.io');
  });

  it('returns empty string for an unset key instead of throwing', () => {
    expect(getEnv('VITE_API_GATEWAY_URL')).toBe('');
  });

  it('never throws when the requested key is undefined', () => {
    expect(() => getEnv('VITE_EDGE_BASE')).not.toThrow();
  });

  it('returns the provided fallback for an unset key', () => {
    expect(getEnv('VITE_API_GATEWAY_URL', 'https://caddy.internal')).toBe('https://caddy.internal');
  });

  it('treats an empty-string env value as unset and returns the fallback', () => {
    process.env.VITE_API_BASE = '';

    expect(getEnv('VITE_API_BASE', 'https://caddy.internal')).toBe('https://caddy.internal');
  });
});
