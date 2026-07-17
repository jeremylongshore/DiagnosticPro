/**
 * Centralized API client.
 * Updated for self-host: relative URLs when no base (VPS + Caddy proxies
 * the API paths). For pure self-host the browser calls same-origin.
 */
import { getEnv } from '../lib/env';

const EDGE = getEnv('VITE_EDGE_BASE');
const RUN = getEnv('VITE_API_BASE');

// For pure self-host (Caddy serving static + proxying API), use relative URLs
const BASE = EDGE || RUN || '';

async function authHeader() {
  // Prefer whop token for self-hosted
  try {
    const whopToken = localStorage.getItem('whop_token');
    if (whopToken) return { 'x-whop-token': whopToken };
  } catch {}
  // fallback to api key if set (for some legacy paths)
  const apiKey = getEnv('VITE_API_KEY');
  return apiKey ? { 'x-api-key': apiKey } : {};
}

/**
 * Make authenticated API request that returns JSON
 */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeader()),
    ...(init.headers || {})
  };

  const url = BASE ? `${BASE}${path}` : path; // relative if no base
  const res = await fetch(url, { ...init, headers, credentials: "omit" });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`${res.status} ${errorText}`);
  }

  return (await res.json()) as T;
}

/**
 * Make authenticated API request that returns raw Response
 * Use when endpoint returns non-JSON or you just need the Response
 */
export async function apiRaw(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = {
    ...(await authHeader()),
    ...(init.headers || {})
  };

  const url = BASE ? `${BASE}${path}` : path;
  return fetch(url, { ...init, headers, credentials: "omit" });
}

// Legacy API client for backward compatibility
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const data = await api<T>(endpoint);
      return { data, status: 200 };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500
      };
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    try {
      const result = await api<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      });
      return { data: result, status: 200 };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 500
      };
    }
  }

  isUsingNewApi(): boolean {
    return !!BASE;
  }

  getBaseUrl(): string {
    return BASE || '';
  }
}

// Export singleton instance for backward compatibility
export const apiClient = new ApiClient();

// Export types
export type { ApiResponse };