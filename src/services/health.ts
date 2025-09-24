/**
 * Health service - API health checks and status monitoring
 * Migrated from Supabase to Firebase/Firestore
 */
import { apiClient, type ApiResponse } from './api';
import { checkFirestoreHealth } from './firestore';
import { isFirebaseConfigured } from '@/integrations/firebase';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  version?: string;
  timestamp: string;
  services?: {
    database?: 'healthy' | 'unhealthy';
    ai?: 'healthy' | 'unhealthy';
    storage?: 'healthy' | 'unhealthy';
    payments?: 'healthy' | 'unhealthy';
    firebase?: 'healthy' | 'unhealthy';
  };
  api_type: 'firestore' | 'cloud_functions';
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<ApiResponse<HealthStatus>> {
  if (!apiClient.isUsingNewApi()) {
    // Firestore health check
    try {
      const firestoreHealthy = await checkFirestoreHealth();
      const firebaseConfigured = isFirebaseConfigured();

      const status: HealthStatus = {
        status: firestoreHealthy && firebaseConfigured ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        api_type: 'firestore',
        version: 'firebase-v1',
        services: {
          database: firestoreHealthy ? 'healthy' : 'unhealthy',
          firebase: firebaseConfigured ? 'healthy' : 'unhealthy',
        },
      };

      return { data: status, status: 200 };
    } catch (error) {
      return {
        data: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          api_type: 'firestore',
          version: 'error',
        },
        status: 200,
      };
    }
  }

  // Use Cloud Functions health endpoint
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