// Tests for API client (self-host, no Firebase)

import { api } from '../api';

describe('API client (VPS self-host)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    (process.env as any).VITE_API_BASE = '';
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('makes relative call when no BASE', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: true })
    });

    await api('/healthz');

    expect(global.fetch).toHaveBeenCalledWith('/healthz', expect.any(Object));
  });

  it('attaches x-whop-token if present', async () => {
    localStorage.setItem('whop_token', 'test-whop');
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    await api('/saveSubmission', { method: 'POST' });

    expect(global.fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      headers: expect.objectContaining({ 'x-whop-token': 'test-whop' })
    }));
    localStorage.removeItem('whop_token');
  });
});