/**
 * Centralized API client using Firebase Functions proxy for private Cloud Run
 * Handles auth headers and proxy routing
 */
import { getIdToken } from "../integrations/firebase";
const EDGE = import.meta.env.VITE_EDGE_BASE; // Functions v2 proxy
const RUN = import.meta.env.VITE_API_BASE; // direct Cloud Run (may be blocked)
const BASE = EDGE ?? RUN; // prefer Functions while IAM is enforced
async function authHeader() {
    const token = await getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
}
/**
 * Make authenticated API request that returns JSON
 */
export async function api(path, init = {}) {
    if (!BASE)
        throw new Error("No API base configured");
    const headers = {
        "Content-Type": "application/json",
        ...(await authHeader()),
        ...(init.headers || {})
    };
    const res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: "omit" });
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`${res.status} ${errorText}`);
    }
    return (await res.json());
}
/**
 * Make authenticated API request that returns raw Response
 * Use when endpoint returns non-JSON or you just need the Response
 */
export async function apiRaw(path, init = {}) {
    if (!BASE)
        throw new Error("No API base configured");
    const headers = {
        ...(await authHeader()),
        ...(init.headers || {})
    };
    return fetch(`${BASE}${path}`, { ...init, headers, credentials: "omit" });
}
class ApiClient {
    async get(endpoint) {
        try {
            const data = await api(endpoint);
            return { data, status: 200 };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Unknown error',
                status: 500
            };
        }
    }
    async post(endpoint, data) {
        try {
            const result = await api(endpoint, {
                method: 'POST',
                body: data ? JSON.stringify(data) : undefined,
            });
            return { data: result, status: 200 };
        }
        catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Unknown error',
                status: 500
            };
        }
    }
    isUsingNewApi() {
        return !!BASE;
    }
    getBaseUrl() {
        return BASE || '';
    }
}
// Export singleton instance for backward compatibility
export const apiClient = new ApiClient();
