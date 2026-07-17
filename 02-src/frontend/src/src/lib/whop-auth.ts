/**
 * Whop OAuth PKCE Authentication
 * Handles login, token exchange, membership verification, and auth state.
 */

// Constants — Vite injects these at build time via define plugin.
// Hardcoded defaults used as fallback (and in Jest where import.meta.env is unavailable).
const WHOP_APP_ID = 'app_NyelCJC762qXb6';
const REDIRECT_URI = 'https://diagnosticpro.io/auth/callback';
const API_BASE = ''; // same-origin for self-host, or set via env for dev

// ── Types ──────────────────────────────────────────

export interface WhopUser {
  id: string;
  username: string;
  name?: string;
  email: string;
}

export interface WhopAuthState {
  token: string;
  user: WhopUser;
  isMember: boolean;
}

// ── PKCE Helpers ───────────────────────────────────

async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ── OAuth Flow ─────────────────────────────────────

/** Redirect user to Whop OAuth consent screen */
export async function loginWithWhop(): Promise<void> {
  const verifier = await generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem('whop_code_verifier', verifier);

  // Generate random state for CSRF protection
  const stateArray = new Uint8Array(16);
  crypto.getRandomValues(stateArray);
  const state = Array.from(stateArray, (b) => b.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem('whop_oauth_state', state);

  const params = new URLSearchParams({
    client_id: WHOP_APP_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'openid profile email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });

  window.location.href = `https://whop.com/oauth?${params.toString()}`;
}

/** Exchange authorization code for token via backend */
export async function handleWhopCallback(code: string, returnedState?: string): Promise<WhopAuthState> {
  const codeVerifier = sessionStorage.getItem('whop_code_verifier');
  if (!codeVerifier) {
    throw new Error('Missing PKCE code verifier');
  }

  // Verify OAuth state to prevent CSRF
  const expectedState = sessionStorage.getItem('whop_oauth_state');
  if (!expectedState || expectedState !== returnedState) {
    sessionStorage.removeItem('whop_code_verifier');
    sessionStorage.removeItem('whop_oauth_state');
    throw new Error('OAuth state mismatch — possible CSRF attack');
  }

  const res = await fetch(`${API_BASE}/api/auth/whop-exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: codeVerifier }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token exchange failed: ${errText}`);
  }

  const data = await res.json();
  sessionStorage.removeItem('whop_code_verifier');
  sessionStorage.removeItem('whop_oauth_state');

  // Persist auth state
  localStorage.setItem('whop_token', data.token);
  localStorage.setItem('whop_user', JSON.stringify(data.user));
  localStorage.setItem('whop_is_member', String(data.isMember));

  return { token: data.token, user: data.user, isMember: data.isMember };
}

// ── Auth State ─────────────────────────────────────

/** Get stored auth state (returns null if not logged in) */
export function getWhopAuth(): WhopAuthState | null {
  const token = localStorage.getItem('whop_token');
  const userStr = localStorage.getItem('whop_user');
  const isMember = localStorage.getItem('whop_is_member') === 'true';
  if (!token || !userStr) return null;

  try {
    return { token, user: JSON.parse(userStr), isMember };
  } catch {
    return null;
  }
}

/** Verify membership is still active (call before each diagnostic) */
export async function verifyMembership(): Promise<boolean> {
  const token = localStorage.getItem('whop_token');
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/api/auth/whop-verify`, {
      headers: { 'x-whop-token': token },
    });
    const data = await res.json();
    localStorage.setItem('whop_is_member', String(data.isMember));
    return data.isMember;
  } catch {
    return false;
  }
}

/** Get auth headers for API calls */
export function getWhopHeaders(): Record<string, string> {
  const token = localStorage.getItem('whop_token');
  return token ? { 'x-whop-token': token } : {};
}

/** Log out and clear all Whop auth state */
export function logoutWhop(): void {
  localStorage.removeItem('whop_token');
  localStorage.removeItem('whop_user');
  localStorage.removeItem('whop_is_member');
}
