// Cloud Run API client (replaces Supabase)
// DEPRECATED: Use the new services/api.ts, diagnostics.ts, payments.ts instead
import { isFeatureEnabled } from "@/config/feature-flags";
import { apiClient } from './api';

const CLOUD_RUN_URL = import.meta.env.VITE_API_BASE || "https://diagnostic-platform-123456-uc.a.run.app";

interface CloudRunResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface DiagnosticSubmission {
  id?: string;
  equipmentType: string;
  make: string;
  model: string;
  year: string;
  errorCodes: string;
  symptoms: string[];
  problemDescription: string;
  fullName: string;
  email: string;
  phone: string;
  status: 'draft' | 'paid' | 'processing' | 'ready';
  createdAt?: string;
  updatedAt?: string;
}

interface Order {
  id?: string;
  submissionId: string;
  stripeSessionId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  customerEmail: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  analysisCompletedAt?: string;
  reportUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

class CloudRunClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = CLOUD_RUN_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<CloudRunResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Request failed' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Cloud Run request failed:', error);
      return { success: false, error: 'Network error' };
    }
  }

  // Diagnostic Submissions
  async createSubmission(submission: Partial<DiagnosticSubmission>): Promise<CloudRunResponse<DiagnosticSubmission>> {
    return this.request<DiagnosticSubmission>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  }

  async getSubmission(id: string): Promise<CloudRunResponse<DiagnosticSubmission>> {
    return this.request<DiagnosticSubmission>(`/api/submissions/${id}`);
  }

  // Orders
  async createOrder(order: Partial<Order>): Promise<CloudRunResponse<Order>> {
    return this.request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async getOrder(id: string): Promise<CloudRunResponse<Order>> {
    return this.request<Order>(`/api/orders/${id}`);
  }

  async getOrderBySessionId(sessionId: string): Promise<CloudRunResponse<Order>> {
    return this.request<Order>(`/api/orders/session/${sessionId}`);
  }

  async updateOrder(id: string, updates: Partial<Order>): Promise<CloudRunResponse<Order>> {
    return this.request<Order>(`/api/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Health check
  async health(): Promise<CloudRunResponse<{ status: string }>> {
    return this.request<{ status: string }>('/health');
  }
}

// Create singleton instance
export const cloudRunClient = new CloudRunClient();

// Helper function to check if we should use Cloud Run
export const shouldUseCloudRun = (): boolean => {
  return !isFeatureEnabled('USE_SUPABASE');
};

export type { DiagnosticSubmission, Order, CloudRunResponse };