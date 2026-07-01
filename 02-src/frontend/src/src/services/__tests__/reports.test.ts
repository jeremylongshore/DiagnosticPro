// Tests for reports service (self-host local + API)

import { getDiagnosticStatus } from '../reports';

describe('Reports service (self-host)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    process.env.VITE_API_BASE = 'http://localhost:8080';
  });

  it('getDiagnosticStatus uses backend API', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ready' })
    });

    const res = await getDiagnosticStatus('diag_test123');
    expect(res.data?.status).toBe('ready');
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/analysisStatus'), expect.anything());
  });
});