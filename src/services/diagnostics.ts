/**
 * Diagnostics service - handles diagnostic submissions and analysis
 * Migrated from Supabase to Firebase/Firestore
 */
import { api } from './api';
import { isFeatureEnabled } from '@/config/feature-flags';
import { firestoreServices, DiagnosticSubmission } from './firestore';

// API Response wrapper type
export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  error?: string;
  status?: number;
}

// Frontend form interface
export interface DiagnosticFormData {
  fullName: string;
  email: string;
  phone?: string;
  equipmentType?: string;
  make?: string;
  model?: string;
  year?: string;
  serialNumber?: string;
  problemDescription?: string;
  symptoms?: string[];
  errorCodes?: string;
  whenStarted?: string;
  frequency?: string;
  urgencyLevel?: string;
  troubleshootingSteps?: string;
  previousRepairs?: string;
  usagePattern?: string;
  locationEnvironment?: string;
  modifications?: string;
  mileageHours?: string;
  shopRecommendation?: string;
  shopQuoteAmount?: number;
}

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

interface SubmissionResponse {
  success: boolean;
  submissionId?: string;
  error?: string;
}

/**
 * Submit diagnostic form - primary entry point
 */
export async function submitDiagnosticForm(data: DiagnosticFormData): Promise<SubmissionResponse> {
  try {
    if (isFeatureEnabled('USE_NEW_API')) {
      // Use Firebase Cloud Functions
      const response = await api<{ ok: boolean; submissionId: string }>('/createSubmission', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      return {
        success: response.ok,
        submissionId: response.submissionId,
      };
    } else {
      // Use Firestore directly (preferred method)
      const submissionData: Omit<DiagnosticSubmission, 'id' | 'createdAt' | 'updatedAt'> = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        equipmentType: data.equipmentType,
        make: data.make,
        model: data.model,
        year: data.year,
        serialNumber: data.serialNumber,
        problemDescription: data.problemDescription,
        symptoms: data.symptoms,
        errorCodes: data.errorCodes,
        whenStarted: data.whenStarted,
        frequency: data.frequency,
        urgencyLevel: data.urgencyLevel,
        troubleshootingSteps: data.troubleshootingSteps,
        previousRepairs: data.previousRepairs,
        usagePattern: data.usagePattern,
        locationEnvironment: data.locationEnvironment,
        modifications: data.modifications,
        mileageHours: data.mileageHours,
        shopRecommendation: data.shopRecommendation,
        shopQuoteAmount: data.shopQuoteAmount,
        paymentStatus: 'pending',
        analysisStatus: 'pending'
      };

      const result = await firestoreServices.diagnosticSubmissions.create(submissionData);

      return {
        success: true,
        submissionId: result.id,
      };
    }
  } catch (error) {
    console.error('Diagnostic submission error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Check submission status
 */
export async function checkSubmissionStatus(submissionId: string) {
  try {
    if (isFeatureEnabled('USE_NEW_API')) {
      // Use Firebase Cloud Function
      return await api<{ paymentStatus: string; analysisStatus: string }>(`/submission-status/${submissionId}`);
    } else {
      // Use Firestore directly
      const submission = await firestoreServices.diagnosticSubmissions.getById(submissionId);

      if (!submission) {
        throw new Error('Submission not found');
      }

      return {
        paymentStatus: submission.paymentStatus || 'pending',
        analysisStatus: submission.analysisStatus || 'pending',
      };
    }
  } catch (error) {
    console.error('Status check error:', error);
    throw error;
  }
}

/**
 * Get submission by ID
 */
export async function getSubmissionById(submissionId: string): Promise<DiagnosticSubmission | null> {
  try {
    return await firestoreServices.diagnosticSubmissions.getById(submissionId);
  } catch (error) {
    console.error('Get submission error:', error);
    return null;
  }
}

/**
 * Legacy: Get diagnostic submission by ID
 */
export async function getDiagnosticLegacy(id: string): Promise<ApiResponse<DiagnosticSubmission>> {
  try {
    const submission = await getSubmissionById(id);

    if (!submission) {
      return {
        error: 'Submission not found',
        success: false,
        status: 404
      };
    }

    return {
      data: submission,
      success: true,
      status: 200
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      success: false,
      status: 500,
    };
  }
}

/**
 * Start diagnostic analysis
 */
export async function startAnalysis(
  submissionId: string,
  diagnosticData?: any
): Promise<ApiResponse<DiagnosticAnalysis>> {
  try {
    // Use Firebase Cloud Functions
    const response = await api<{ ok: boolean; path: string; analysisId: string }>('/analyzeDiagnostic', {
      method: 'POST',
      body: JSON.stringify({ submissionId }),
    });

    if (response.ok) {
      return {
        data: {
          id: response.analysisId,
          submissionId,
          analysisResult: 'Analysis completed successfully',
          confidence: 0.95,
          recommendations: [],
          createdAt: new Date().toISOString(),
          reportStatus: 'ready',
          reportUrl: response.path
        } as DiagnosticAnalysis,
        success: true
      };
    } else {
      return {
        error: 'Analysis failed',
        success: false
      };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Analysis failed',
      success: false
    };
  }
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
 * Get analysis status and results
 */
export async function getAnalysis(
  submissionId: string
): Promise<ApiResponse<DiagnosticAnalysis>> {
  try {
    const submission = await getSubmissionById(submissionId);

    if (!submission) {
      return {
        error: 'Submission not found',
        success: false,
        status: 404
      };
    }

    // Mock analysis data based on submission status
    const analysis: DiagnosticAnalysis = {
      id: submissionId,
      submissionId,
      analysisResult: submission.analysisStatus === 'completed' ? 'Analysis completed' : 'Analysis pending',
      confidence: 0.95,
      recommendations: [],
      createdAt: submission.createdAt as string || new Date().toISOString(),
      reportStatus: submission.analysisStatus === 'completed' ? 'ready' : 'pending'
    };

    return {
      data: analysis,
      success: true,
      status: 200
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to get analysis',
      success: false,
      status: 500
    };
  }
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

/**
 * Send diagnostic email
 */
export async function sendDiagnosticEmail(submissionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await api<{ ok: boolean; emailSent: boolean }>('/sendDiagnosticEmail', {
      method: 'POST',
      body: JSON.stringify({ submissionId }),
    });

    return {
      success: response.ok && response.emailSent
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email sending failed'
    };
  }
}