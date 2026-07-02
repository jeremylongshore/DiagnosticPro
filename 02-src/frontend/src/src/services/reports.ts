/**
 * Reports service - Direct download via GCS signed URLs
 */

export interface DiagnosticStatus {
  id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  gcsPath?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Download report by getting signed URL from Cloud Run backend
 */
export async function downloadReport(id: string): Promise<void> {
  const { getEnv } = await import('../lib/env');
  const apiBase = getEnv('VITE_API_GATEWAY_URL') || getEnv('VITE_API_BASE') || '';
  const url = apiBase 
    ? `${apiBase}/reports/signed-url?submissionId=${encodeURIComponent(id)}`
    : `/reports/signed-url?submissionId=${encodeURIComponent(id)}`;

  const headers: Record<string, string> = {};
  const apiKey = getEnv('VITE_API_KEY');
  if (apiKey) headers['x-api-key'] = apiKey;

  const response = await fetch(url, { method: 'GET', headers });

  if (!response.ok) {
    throw new Error('Report not ready yet');
  }

  const data = await response.json();

  if (!data.downloadUrl) {
    throw new Error('Download URL not available - report may still be processing');
  }

  window.location.href = data.downloadUrl;
}

/**
 * Get diagnostic status for polling - now via backend API (no direct Firestore)
 */
export async function getDiagnosticStatus(diagnosticId: string): Promise<{ data: DiagnosticStatus | null; status: number; error?: string }> {
  try {
    const { getEnv } = await import('../lib/env');
    // Empty base = same-origin relative path (self-host: Caddy proxies API paths)
    const apiBase = getEnv('VITE_API_GATEWAY_URL') || getEnv('VITE_API_BASE') || '';

    const response = await fetch(`${apiBase}/analysisStatus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submissionId: diagnosticId })
    });

    if (!response.ok) {
      return { data: null, status: response.status, error: 'Submission not found' };
    }

    const result = await response.json();
    const rawStatus = result.status || 'pending';
    const normalizedStatus = rawStatus === 'completed' ? 'ready' : rawStatus;

    return {
      data: {
        id: diagnosticId,
        status: normalizedStatus as DiagnosticStatus['status'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      status: 200
    };
  } catch (error) {
    console.error('Error getting diagnostic status from API:', error);
    return {
      data: null,
      status: 500,
      error: `Failed to get diagnostic status: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Poll diagnostic status until ready or failed
 */
export async function pollDiagnosticStatus(
  diagnosticId: string,
  onUpdate?: (status: DiagnosticStatus) => void,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<DiagnosticStatus | null> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await getDiagnosticStatus(diagnosticId);

      if (response.data) {
        onUpdate?.(response.data);

        if (response.data.status === 'ready' || response.data.status === 'failed') {
          return response.data;
        }
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;
    } catch (error) {
      console.error('Error polling diagnostic status:', error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  return null;
}
