/**
 * Diagnostics service - handles diagnostic submissions and analysis
 */
import { api } from './api';
// Mock API client for legacy compatibility
const apiClient = {
    isUsingNewApi: () => false,
    get: async (path) => {
        throw new Error('Legacy API not implemented');
    },
    post: async (path) => {
        throw new Error('Legacy API not implemented');
    }
};
/**
 * Create a new diagnostic submission (Cloud Run API)
 */
export async function createDiagnostic(form) {
    return api(`/api/diagnostics`, {
        method: "POST",
        body: JSON.stringify(form)
    });
}
/**
 * Get diagnostic by ID (Cloud Run API)
 */
export async function getDiagnostic(id) {
    return api(`/api/diagnostics/${id}`);
}
/**
 * Get all diagnostics for current user (Cloud Run API)
 */
export async function getDiagnostics() {
    return api(`/api/diagnostics`);
}
/**
 * Submit diagnostic (alias for createDiagnostic)
 */
export async function submitDiagnostic(form) {
    return createDiagnostic(form);
}
/**
 * Get diagnostic submission by ID (Legacy)
 */
export async function getDiagnosticLegacy(id) {
    if (!apiClient.isUsingNewApi()) {
        // Fallback to legacy Supabase
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
            const { data, error } = await supabase
                .from('diagnostic_submissions')
                .select('*')
                .eq('id', id)
                .single();
            if (error) {
                return { error: error.message, status: 404 };
            }
            return { data, status: 200 };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Legacy fetch failed',
                status: 500,
            };
        }
    }
    // Use new FastAPI endpoint
    return apiClient.get(`/diagnostics/${id}`);
}
/**
 * Start diagnostic analysis
 */
export async function startAnalysis(submissionId, diagnosticData) {
    if (!apiClient.isUsingNewApi()) {
        // Use Firebase Cloud Function instead of Supabase
        try {
            const { httpsCallable } = await import('firebase/functions');
            const { functions } = await import('../config/firebase');
            const analyzeDiagnostic = httpsCallable(functions, 'analyzeDiagnostic');
            const result = await analyzeDiagnostic({
                submissionId,
                diagnosticData: diagnosticData || {}
            });
            if (result.data && typeof result.data === 'object' && 'success' in result.data) {
                const response = result.data;
                if (response.success) {
                    return {
                        data: {
                            id: submissionId,
                            submissionId,
                            analysisResult: response.analysis,
                            confidence: 0.95,
                            recommendations: [],
                            createdAt: new Date().toISOString(),
                            reportStatus: 'ready'
                        },
                        success: true
                    };
                }
                else {
                    return {
                        error: response.error || 'Analysis failed',
                        success: false
                    };
                }
            }
            return {
                error: 'Invalid response from analysis function',
                success: false
            };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Firebase analysis failed',
                success: false
            };
        }
    }
    // Use new FastAPI endpoint
    return apiClient.post(`/diagnostics/${submissionId}/analyze`);
}
/**
 * Get analysis status and results
 */
export async function getAnalysis(submissionId) {
    if (!apiClient.isUsingNewApi()) {
        // For legacy, could check submission status
        return getDiagnostic(submissionId);
    }
    // Use new FastAPI endpoint
    return apiClient.get(`/diagnostics/${submissionId}/analysis`);
}
/**
 * Poll for analysis completion
 */
export async function pollAnalysisStatus(submissionId, onUpdate, maxAttempts = 30, interval = 2000) {
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
