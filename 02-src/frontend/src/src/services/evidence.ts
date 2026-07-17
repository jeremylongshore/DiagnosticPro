/**
 * Evidence service for the optional photo-attachment flow.
 * Mirrors the backend POST /evidence/:submissionId, GET /evidence/:submissionId,
 * DELETE /evidence/:submissionId/:evidenceId routes (02-src/backend/.../index.js).
 *
 * Uploads use FormData (multipart/form-data) -- do NOT set Content-Type
 * manually (the browser must add the boundary).
 */

import { getEnv } from '../lib/env';

const BASE = getEnv('VITE_EDGE_BASE') || getEnv('VITE_API_BASE') || '';

export interface EvidenceItem {
  id: string;
  kind: 'photo' | string;
  mime: string;
  bytes: number;
  sha256?: string;
  status: 'uploaded' | 'ready' | 'failed' | 'deleted';
  original_name?: string;
  created_at?: string;
}

export interface ListEvidenceResponse {
  evidence: EvidenceItem[];
}

interface RawApi {
  api: <T>(path: string, init?: RequestInit) => Promise<T>;
}

function authHeaders(): Record<string, string> {
  try {
    const whopToken = localStorage.getItem('whop_token');
    if (whopToken) return { 'x-whop-token': whopToken };
  } catch {
    // ignore localStorage access errors (SSR / private mode); fall through to env-key fallback.
  }
  const apiKey = getEnv('VITE_API_KEY');
  return apiKey ? { 'x-api-key': apiKey } : {};
}

async function listEvidenceRaw(submissionId: string): Promise<ListEvidenceResponse> {
  const res = await fetch(`${BASE}/evidence/${encodeURIComponent(submissionId)}`, {
    method: 'GET',
    headers: { ...authHeaders() },
    credentials: 'omit'
  });
  if (!res.ok) {
    throw new Error(`list evidence failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as ListEvidenceResponse;
}

async function uploadEvidenceRaw(submissionId: string, blob: Blob, filename: string): Promise<{ evidence: EvidenceItem }> {
  const form = new FormData();
  // The backend's multer is configured with field name 'photo'.
  form.append('photo', blob, filename);
  const res = await fetch(`${BASE}/evidence/${encodeURIComponent(submissionId)}`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: form,
    credentials: 'omit'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`upload evidence failed: ${res.status} ${text}`);
  }
  return (await res.json()) as { evidence: EvidenceItem };
}

async function deleteEvidenceRaw(submissionId: string, evidenceId: string): Promise<void> {
  const res = await fetch(`${BASE}/evidence/${encodeURIComponent(submissionId)}/${encodeURIComponent(evidenceId)}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
    credentials: 'omit'
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`delete evidence failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * Adapter form expected by PhotoAttachPanel: a tiny object so tests can swap
 * the network boundary without touching the component.
 */
export interface EvidenceTransport {
  list: (submissionId: string) => Promise<ListEvidenceResponse>;
  upload: (submissionId: string, blob: Blob, filename: string) => Promise<{ evidence: EvidenceItem }>;
  remove: (submissionId: string, evidenceId: string) => Promise<void>;
}

export const defaultEvidenceTransport: EvidenceTransport = {
  list: listEvidenceRaw,
  upload: uploadEvidenceRaw,
  remove: deleteEvidenceRaw
};

// Convenience exports — used by tests and components alike. Each takes an
// optional transport (defaults to the raw fetch impl).
export async function listEvidence(submissionId: string, transport: EvidenceTransport = defaultEvidenceTransport): Promise<EvidenceItem[]> {
  const r = await transport.list(submissionId);
  return (r.evidence || []).filter((e) => e.status !== 'deleted');
}

export async function uploadEvidence(
  submissionId: string,
  blob: Blob,
  filename: string,
  transport: EvidenceTransport = defaultEvidenceTransport
): Promise<EvidenceItem> {
  const r = await transport.upload(submissionId, blob, filename);
  return r.evidence;
}

export async function deleteEvidence(
  submissionId: string,
  evidenceId: string,
  transport: EvidenceTransport = defaultEvidenceTransport
): Promise<void> {
  return transport.remove(submissionId, evidenceId);
}

// Re-export the raw transport so tests can mock the network layer explicitly.
export type { RawApi };