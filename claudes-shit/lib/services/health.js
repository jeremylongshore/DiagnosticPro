/**
 * Health service - API health checks and status monitoring
 */
import { apiClient } from './api';
/**
 * Check API health
 */
export async function checkHealth() {
    if (!apiClient.isUsingNewApi()) {
        // Legacy health check - just check if Supabase is reachable
        try {
            const { createClient } = await import('@supabase/supabase-js');
            const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
            // Simple query to test connection
            const { error } = await supabase.from('diagnostic_submissions').select('id').limit(1);
            const status = {
                status: error ? 'unhealthy' : 'healthy',
                timestamp: new Date().toISOString(),
                api_type: 'legacy',
                services: {
                    database: error ? 'unhealthy' : 'healthy',
                },
            };
            return { data: status, status: 200 };
        }
        catch (error) {
            return {
                data: {
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    api_type: 'legacy',
                },
                status: 200,
            };
        }
    }
    // Use new FastAPI health endpoint
    return apiClient.get('/healthz');
}
/**
 * Check if API is available
 */
export async function isApiAvailable() {
    try {
        const response = await checkHealth();
        return response.data?.status === 'healthy';
    }
    catch {
        return false;
    }
}
