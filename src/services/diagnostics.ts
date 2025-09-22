/**
 * Diagnostics service - handles diagnostic submissions and analysis
 */
import { api } from './api';

// API Response wrapper type
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

// Mock API client for legacy compatibility
const apiClient = {
  isUsingNewApi: () => false,
  get: async <T>(path: string): Promise<ApiResponse<T>> => {
    throw new Error('Legacy API not implemented');
  },
  post: async <T>(path: string): Promise<ApiResponse<T>> => {
    throw new Error('Legacy API not implemented');
  }
};

// Cloud Run API interfaces
export interface DiagnosticForm {
  equipment_type: string;
  make: string;
  model: string;
  year: string;
  mileage_hours?: string;
  error_codes?: string;
  symptoms?: string;
  problem_description?: string;
  when_started?: string;
  frequency?: string;
  urgency_level?: string;
}

export interface Diagnostic {
  id: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  gcs_path?: string | null;
  created_at?: string;
  user_id?: string;
}

// Legacy interfaces for backward compatibility
export interface DiagnosticSubmission {
  id?: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  mileage?: number;
  problemDescription: string;
  symptomsObserved: string[];
  dtcCodes?: string[];
  customerEmail?: string;
  customerName?: string;
  createdAt?: string;
  analysisStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  reportUrl?: string;
}

export interface DiagnosticAnalysis {
  id: string;
  submissionId: string;
  analysisResult: string;
  confidence: number;
  recommendations: string[];
  estimatedCost?: {
    min: number;
    max: number;
    currency: string;
  };
  createdAt: string;
  reportStatus: 'pending' | 'generating' | 'ready' | 'failed';
  reportUrl?: string;
}

/**
 * Create a new diagnostic submission (Cloud Run API)
 */
export async function createDiagnostic(form: DiagnosticForm): Promise<{ id: string }> {
  return api<{ id: string }>(`/api/diagnostics`, {
    method: "POST",
    body: JSON.stringify(form)
  });
}

/**
 * Get diagnostic by ID (Cloud Run API)
 */
export async function getDiagnostic(id: string): Promise<Diagnostic> {
  return api<Diagnostic>(`/api/diagnostics/${id}`);
}

/**
 * Get all diagnostics for current user (Cloud Run API)
 */
export async function getDiagnostics(): Promise<Diagnostic[]> {
  return api<Diagnostic[]>(`/api/diagnostics`);
}

/**
 * Submit diagnostic (alias for createDiagnostic)
 */
export async function submitDiagnostic(form: DiagnosticForm): Promise<{ id: string }> {
  return createDiagnostic(form);
}

/**
 * Get diagnostic submission by ID (Legacy)
 */
export async function getDiagnosticLegacy(
  id: string
): Promise<ApiResponse<DiagnosticSubmission>> {
  if (!apiClient.isUsingNewApi()) {
    // Fallback to legacy Supabase
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );

      const { data, error } = await supabase
        .from('diagnostic_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { error: error.message, status: 404 };
      }

      return { data, status: 200 };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Legacy fetch failed',
        status: 500,
      };
    }
  }

  // Use new FastAPI endpoint
  return apiClient.get<DiagnosticSubmission>(`/diagnostics/${id}`);
}

/**
 * Start diagnostic analysis
 */
export async function startAnalysis(
  submissionId: string
): Promise<ApiResponse<DiagnosticAnalysis>> {
  if (!apiClient.isUsingNewApi()) {
    // Fallback to legacy Supabase function
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );

      const { data, error } = await supabase.functions.invoke('analyze-diagnostic', {
        body: { submissionId },
      });

      if (error) {
        return { error: error.message, status: 400 };
      }

      return { data, status: 200 };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Legacy analysis failed',
        status: 500,
      };
    }
  }

  // Use new FastAPI endpoint
  return apiClient.post<DiagnosticAnalysis>(`/diagnostics/${submissionId}/analyze`);
}

/**
 * Get analysis status and results
 */
export async function getAnalysis(
  submissionId: string
): Promise<ApiResponse<DiagnosticAnalysis>> {
  if (!apiClient.isUsingNewApi()) {
    // For legacy, could check submission status
    return getDiagnostic(submissionId) as Promise<ApiResponse<DiagnosticAnalysis>>;
  }

  // Use new FastAPI endpoint
  return apiClient.get<DiagnosticAnalysis>(`/diagnostics/${submissionId}/analysis`);
}

/**
 * Poll for analysis completion
 */
export async function pollAnalysisStatus(
  submissionId: string,
  onUpdate?: (analysis: DiagnosticAnalysis) => void,
  maxAttempts: number = 30,
  interval: number = 2000
): Promise<DiagnosticAnalysis | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await getAnalysis(submissionId);

    if (response.data) {
      onUpdate?.(response.data);

      if (response.data.reportStatus === 'ready' || response.data.reportStatus === 'failed') {
        return response.data;
      }
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  return null; // Timeout
}