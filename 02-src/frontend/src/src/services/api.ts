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
  } catch {
    // localStorage unavailable (private mode, blocked storage): fall back to the API key
  }
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
