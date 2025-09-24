// Cloud Run API client (replaces Supabase)
// DEPRECATED: Use the new services/api.ts, diagnostics.ts, payments.ts instead
import { isFeatureEnabled } from "@/config/feature-flags";
const CLOUD_RUN_URL = import.meta.env.VITE_API_BASE || "https://diagnostic-platform-123456-uc.a.run.app";
class CloudRunClient {
    baseUrl;
    constructor() {
        this.baseUrl = CLOUD_RUN_URL;
    }
    async request(endpoint, options = {}) {
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
        }
        catch (error) {
            console.error('Cloud Run request failed:', error);
            return { success: false, error: 'Network error' };
        }
    }
    // Diagnostic Submissions
    async createSubmission(submission) {
        return this.request('/api/submissions', {
            method: 'POST',
            body: JSON.stringify(submission),
        });
    }
    async getSubmission(id) {
        return this.request(`/api/submissions/${id}`);
    }
    // Orders
    async createOrder(order) {
        return this.request('/api/orders', {
            method: 'POST',
            body: JSON.stringify(order),
        });
    }
    async getOrder(id) {
        return this.request(`/api/orders/${id}`);
    }
    async getOrderBySessionId(sessionId) {
        return this.request(`/api/orders/session/${sessionId}`);
    }
    async updateOrder(id, updates) {
        return this.request(`/api/orders/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }
    // Health check
    async health() {
        return this.request('/health');
    }
}
// Create singleton instance
export const cloudRunClient = new CloudRunClient();
// Helper function to check if we should use Cloud Run
export const shouldUseCloudRun = () => {
    return !isFeatureEnabled('USE_SUPABASE');
};
