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

describe('getDiagnosticStatus base + status handling (self-host)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    delete process.env.VITE_API_BASE;
    delete process.env.VITE_API_GATEWAY_URL;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('hits same-origin /analysisStatus when no API base is configured', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ready' })
    });

    const res = await getDiagnosticStatus('diag_9f0a2');

    expect(global.fetch).toHaveBeenCalledWith('/analysisStatus', expect.any(Object));
    expect(res.status).toBe(200);
    expect(res.data?.status).toBe('ready');
  });

  it('normalizes a completed backend status to ready', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'completed' })
    });

    const res = await getDiagnosticStatus('diag_9f0a2');

    expect(res.data?.status).toBe('ready');
  });

  it('returns null data with the upstream status code on a non-200 response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({})
    });

    const res = await getDiagnosticStatus('diag_missing');

    expect(res.data).toBeNull();
    expect(res.status).toBe(404);
    expect(res.error).toBe('Submission not found');
  });
});