/**
 * Health service - API health checks and status monitoring
 */
import { apiClient, type ApiResponse } from './api';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  version?: string;
  timestamp: string;
  services?: {
    database?: 'healthy' | 'unhealthy';
    ai?: 'healthy' | 'unhealthy';
    storage?: 'healthy' | 'unhealthy';
    payments?: 'healthy' | 'unhealthy';
  };
  api_type: 'legacy' | 'new';
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<ApiResponse<HealthStatus>> {
  if (!apiClient.isUsingNewApi()) {
    // Legacy health check - just check if Supabase is reachable
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
      );

      // Simple query to test connection
      const { error } = await supabase.from('diagnostic_submissions').select('id').limit(1);

      const status: HealthStatus = {
        status: error ? 'unhealthy' : 'healthy',
        timestamp: new Date().toISOString(),
        api_type: 'legacy',
        services: {
          database: error ? 'unhealthy' : 'healthy',
        },
      };

      return { data: status, status: 200 };
    } catch (error) {
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
  return apiClient.get<HealthStatus>('/healthz');
}

/**
 * Check if API is available
 */
export async function isApiAvailable(): Promise<boolean> {
  try {
    const response = await checkHealth();
    return response.data?.status === 'healthy';
  } catch {
    return false;
  }
}