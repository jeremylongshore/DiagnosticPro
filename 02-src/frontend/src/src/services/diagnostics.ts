/**
 * Diagnostics service - handles diagnostic submissions and analysis
 */
import { api } from './api';

// Legacy type kept for compatibility (no longer used for writes)
export interface DiagnosticSubmission { /* see backend SQLite schema */ }

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

export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  error?: string;
  status?: number;
}

interface SubmissionResponse {
  success: boolean;
  submissionId?: string;
  error?: string;
}

/**
 * Submit diagnostic form - primary entry point (uses backend API, no direct Firestore)
 */
export async function submitDiagnosticForm(data: DiagnosticFormData): Promise<SubmissionResponse> {
  try {
    const apiBase = import.meta.env.VITE_API_GATEWAY_URL || import.meta.env.VITE_API_BASE;
    if (!apiBase) throw new Error('No API base configured');

    const payload = {
      equipmentType: data.equipmentType ?? "",
      make: data.make ?? "",
      model: data.model ?? "",
      year: data.year ?? "",
      mileageHours: data.mileageHours ?? "",
      serialNumber: data.serialNumber ?? "",
      errorCodes: data.errorCodes ?? "",
      symptoms: Array.isArray(data.symptoms) ? data.symptoms : (data.symptoms ? [data.symptoms] : []),
      whenStarted: data.whenStarted ?? "",
      frequency: data.frequency ?? "",
      urgencyLevel: data.urgencyLevel ?? "normal",
      locationEnvironment: data.locationEnvironment ?? "",
      usagePattern: data.usagePattern ?? "",
      problemDescription: data.problemDescription ?? "",
      previousRepairs: data.previousRepairs ?? "",
      modifications: data.modifications ?? "",
      troubleshootingSteps: data.troubleshootingSteps ?? "",
      shopQuoteAmount: data.shopQuoteAmount ?? "",
      shopRecommendation: data.shopRecommendation ?? "",
      fullName: data.fullName ?? "",
      email: data.email ?? "",
      phone: data.phone ?? ""
    };

    const response = await fetch(`${apiBase}/saveSubmission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, priceCents: 499 })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(err || 'Failed to save submission');
    }

    const result = await response.json();
    return { success: true, submissionId: result.submissionId };
  } catch (error) {
    console.error('Diagnostic submission error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
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
