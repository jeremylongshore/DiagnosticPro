/**
 * Reports service - Direct download via GCS signed URLs
 * No email delivery - direct download only
 */
import { api } from './api';

export interface ReportDownloadData {
  url: string;
}

export interface DiagnosticStatus {
  id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  gcsPath?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get signed URL for report download (Cloud Run API)
 */
export async function getReportUrl(id: string): Promise<{ url: string }> {
  return api<{ url: string }>(`/api/reports/${id}/url`);
}

/**
 * Download report by getting signed URL and navigating to it (Cloud Run API)
 */
export async function downloadReport(id: string): Promise<void> {
  // Prefer signed URL then navigate
  const { url } = await getReportUrl(id);
  window.location.href = url; // triggers browser download from GCS
}

/**
 * Get diagnostic status for polling
 */
export async function getDiagnosticStatus(diagnosticId: string): Promise<ApiResponse<DiagnosticStatus>> {
  if (!apiClient.isUsingNewApi()) {
    // Legacy fallback - check submission status
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );

      const { data, error } = await supabase
        .from('diagnostic_submissions')
        .select('*')
        .eq('id', diagnosticId)
        .single();

      if (error) throw error;

      // Map Supabase fields to new format
      return {
        data: {
          id: data.id,
          status: data.analysis_status === 'completed' ? 'ready' :
                 data.analysis_status === 'processing' ? 'processing' :
                 data.analysis_status === 'failed' ? 'failed' : 'pending',
          gcsPath: undefined, // Not available in legacy
          createdAt: data.created_at,
          updatedAt: data.updated_at
        },
        status: 200
      };
    } catch (error) {
      return {
        data: null,
        status: 500,
        error: `Failed to get diagnostic status: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Use FastAPI diagnostics endpoint
  return apiClient.get<DiagnosticStatus>(`/diagnostics/${diagnosticId}`);
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

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      attempts++;
    } catch (error) {
      console.error('Error polling diagnostic status:', error);
      attempts++;
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  }

  return null; // Timeout
}

/**
 * Renew signed URL (get fresh 15-minute URL)
 */
export async function renewReportUrl(diagnosticId: string): Promise<ApiResponse<ReportDownloadData>> {
  if (!apiClient.isUsingNewApi()) {
    // Legacy fallback uses same URL generation
    return getReportDownloadUrl(diagnosticId);
  }

  // Use FastAPI renew endpoint if available
  return apiClient.get<ReportDownloadData>(`/reports/${diagnosticId}/renew-url`);
}