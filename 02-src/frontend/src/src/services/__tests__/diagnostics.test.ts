// Tests for diagnostics service (self-host, no Firebase)
// fetch is mocked; the real api() runs (it is a dependency, not under test).

import { submitDiagnosticForm, startAnalysis } from '../diagnostics';

describe('submitDiagnosticForm (self-host)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it('posts to same-origin /saveSubmission when no API base is configured', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ submissionId: 'sub_88af12' }),
    });

    await submitDiagnosticForm({ fullName: 'Marcus Reyes', email: 'marcus@fleetops.io' });

    expect(global.fetch).toHaveBeenCalledWith('/saveSubmission', expect.any(Object));
  });

  it('sends priceCents 499 and the mapped payload fields', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ submissionId: 'sub_88af12' }),
    });

    await submitDiagnosticForm({
      fullName: 'Marcus Reyes',
      email: 'marcus@fleetops.io',
      make: 'Cummins',
      model: 'ISX15',
      year: '2019',
      mileageHours: '412000',
      urgencyLevel: 'high',
      shopQuoteAmount: 4200,
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.priceCents).toBe(499);
    expect(body.payload.make).toBe('Cummins');
    expect(body.payload.model).toBe('ISX15');
    expect(body.payload.mileageHours).toBe('412000');
    expect(body.payload.urgencyLevel).toBe('high');
    expect(body.payload.shopQuoteAmount).toBe(4200);
  });

  it('returns success and the submissionId on a 2xx response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ submissionId: 'sub_88af12' }),
    });

    const result = await submitDiagnosticForm({ fullName: 'Marcus Reyes', email: 'marcus@fleetops.io' });

    expect(result).toEqual({ success: true, submissionId: 'sub_88af12' });
  });

  it('preserves an array of symptoms in the payload', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ submissionId: 'sub_88af12' }),
    });

    await submitDiagnosticForm({
      fullName: 'Marcus Reyes',
      email: 'marcus@fleetops.io',
      symptoms: ['loss of power', 'black exhaust smoke'],
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.payload.symptoms).toEqual(['loss of power', 'black exhaust smoke']);
  });

  it('wraps a single symptom string into a one-element array', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ submissionId: 'sub_88af12' }),
    });

    await submitDiagnosticForm({
      fullName: 'Marcus Reyes',
      email: 'marcus@fleetops.io',
      symptoms: 'loss of power' as unknown as string[],
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.payload.symptoms).toEqual(['loss of power']);
  });

  it('defaults symptoms to an empty array when none are provided', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ submissionId: 'sub_88af12' }),
    });

    await submitDiagnosticForm({ fullName: 'Marcus Reyes', email: 'marcus@fleetops.io' });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.payload.symptoms).toEqual([]);
  });

  it('returns success:false with the server error text on a non-2xx response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('database offline'),
    });

    const result = await submitDiagnosticForm({ fullName: 'Marcus Reyes', email: 'marcus@fleetops.io' });

    expect(result).toEqual({ success: false, error: 'database offline' });
  });
});

describe('startAnalysis (self-host, HTTP-2xx-is-success unless body says otherwise)', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('treats an ok:true processing body as generating and carries analysisId and path', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ok: true,
        analysisId: 'an_4b21c9',
        path: '/reports/download/an_4b21c9',
        status: 'processing',
      }),
    });

    const result = await startAnalysis('sub_88af12');

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('an_4b21c9');
    expect(result.data?.reportStatus).toBe('generating');
    expect(result.data?.reportUrl).toBe('/reports/download/an_4b21c9');
    expect(result.data?.analysisResult).toBe('Analysis in progress');
  });

  it('treats a 200 with status queued and no ok field as success (legacy backend shape)', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'queued' }),
    });

    const result = await startAnalysis('sub_88af12');

    expect(result.success).toBe(true);
    expect(result.data?.reportStatus).toBe('generating');
    expect(result.data?.id).toBe('sub_88af12');
  });

  it('treats a status ready body as a completed report', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ready' }),
    });

    const result = await startAnalysis('sub_88af12');

    expect(result.success).toBe(true);
    expect(result.data?.reportStatus).toBe('ready');
    expect(result.data?.analysisResult).toBe('Analysis completed successfully');
  });

  it('surfaces the message and fails when the body carries ok:false', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ ok: false, message: 'Submission not found' }),
    });

    const result = await startAnalysis('sub_88af12');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Submission not found');
    expect(result.data).toBeUndefined();
  });

  it('fails when the body status is error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'error' }),
    });

    const result = await startAnalysis('sub_88af12');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Analysis failed');
  });

  it('fails when the HTTP response is 500', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve('internal error'),
    });

    const result = await startAnalysis('sub_88af12');

    expect(result.success).toBe(false);
    expect(result.error).toBe('500 internal error');
  });
});
