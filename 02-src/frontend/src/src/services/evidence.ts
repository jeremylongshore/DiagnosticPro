/**
 * Evidence service for optional photo, work-order, and document attachments.
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
  kind: 'photo' | 'work_order' | 'document' | string;
  mime: string;
  bytes: number;
  sha256?: string;
  status: 'uploaded' | 'ready' | 'needs_ocr' | 'failed' | 'deleted' | string;
  original_name?: string;
  originalName?: string;
  textChars?: number;
  createdAt?: string;
  created_at?: string;
}

export type DocumentKind = 'work_order' | 'document';

export interface ListEvidenceResponse {
  evidence: EvidenceItem[];
}

interface RawApi {
  api: <T>(path: string, init?: RequestInit) => Promise<T>;
}

function authHeaders(evidenceToken = ''): Record<string, string> {
  const headers: Record<string, string> = {};
  let whopToken = '';
  try {
    whopToken = localStorage.getItem('whop_token') || '';
  } catch {
    // ignore localStorage access errors (SSR / private mode); fall through to env-key fallback.
  }
  if (whopToken) {
    headers['x-whop-token'] = whopToken;
  } else {
    const apiKey = getEnv('VITE_API_KEY');
    if (apiKey) headers['x-api-key'] = apiKey;
  }
  if (evidenceToken) headers['x-evidence-token'] = evidenceToken;
  return headers;
}

async function listEvidenceRaw(submissionId: string, evidenceToken = ''): Promise<ListEvidenceResponse> {
  const res = await fetch(`${BASE}/evidence/${encodeURIComponent(submissionId)}`, {
    method: 'GET',
    headers: { ...authHeaders(evidenceToken) },
    credentials: 'omit'
  });
  if (!res.ok) {
    throw new Error(`list evidence failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as ListEvidenceResponse;
}

async function uploadEvidenceRaw(submissionId: string, blob: Blob, filename: string, evidenceToken = ''): Promise<{ evidence: EvidenceItem }> {
  const form = new FormData();
  // The backend's multer is configured with field name 'photo'.
  form.append('photo', blob, filename);
  const res = await fetch(`${BASE}/evidence/${encodeURIComponent(submissionId)}`, {
    method: 'POST',
    headers: { ...authHeaders(evidenceToken) },
    body: form,
    credentials: 'omit'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`upload evidence failed: ${res.status} ${text}`);
  }
  return (await res.json()) as { evidence: EvidenceItem };
}

async function uploadDocumentRaw(
  submissionId: string,
  blob: Blob,
  filename: string,
  kind: DocumentKind,
  evidenceToken = ''
): Promise<{ evidence: EvidenceItem }> {
  const form = new FormData();
  form.append('document', blob, filename);
  form.append('kind', kind);
  const res = await fetch(`${BASE}/evidence/${encodeURIComponent(submissionId)}/document`, {
    method: 'POST',
    headers: { ...authHeaders(evidenceToken) },
    body: form,
    credentials: 'omit'
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`upload document failed: ${res.status} ${text}`);
  }
  return (await res.json()) as { evidence: EvidenceItem };
}

async function deleteEvidenceRaw(submissionId: string, evidenceId: string, evidenceToken = ''): Promise<void> {
  const res = await fetch(`${BASE}/evidence/${encodeURIComponent(submissionId)}/${encodeURIComponent(evidenceId)}`, {
    method: 'DELETE',
    headers: { ...authHeaders(evidenceToken) },
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
  list: (submissionId: string, evidenceToken?: string) => Promise<ListEvidenceResponse>;
  upload: (submissionId: string, blob: Blob, filename: string, evidenceToken?: string) => Promise<{ evidence: EvidenceItem }>;
  remove: (submissionId: string, evidenceId: string, evidenceToken?: string) => Promise<void>;
}

export interface DocumentEvidenceTransport {
  list: (submissionId: string, evidenceToken?: string) => Promise<ListEvidenceResponse>;
  upload: (submissionId: string, blob: Blob, filename: string, kind: DocumentKind, evidenceToken?: string) => Promise<{ evidence: EvidenceItem }>;
  remove: (submissionId: string, evidenceId: string, evidenceToken?: string) => Promise<void>;
}

export const defaultEvidenceTransport: EvidenceTransport = {
  list: listEvidenceRaw,
  upload: uploadEvidenceRaw,
  remove: deleteEvidenceRaw
};

export const defaultDocumentEvidenceTransport: DocumentEvidenceTransport = {
  list: listEvidenceRaw,
  upload: uploadDocumentRaw,
  remove: deleteEvidenceRaw
};

// Convenience exports — used by tests and components alike. Each takes an
// optional transport (defaults to the raw fetch impl).
export async function listEvidence(
  submissionId: string,
  transport: EvidenceTransport = defaultEvidenceTransport,
  evidenceToken = ''
): Promise<EvidenceItem[]> {
  const r = await transport.list(submissionId, evidenceToken);
  return (r.evidence || []).filter((e) => e.status !== 'deleted');
}

export async function listDocumentEvidence(
  submissionId: string,
  transport: DocumentEvidenceTransport = defaultDocumentEvidenceTransport,
  evidenceToken = ''
): Promise<EvidenceItem[]> {
  const r = await transport.list(submissionId, evidenceToken);
  return (r.evidence || []).filter(
    (e) => e.status !== 'deleted' && (e.kind === 'work_order' || e.kind === 'document')
  );
}

export async function uploadEvidence(
  submissionId: string,
  blob: Blob,
  filename: string,
  transport: EvidenceTransport = defaultEvidenceTransport,
  evidenceToken = ''
): Promise<EvidenceItem> {
  const r = await transport.upload(submissionId, blob, filename, evidenceToken);
  return r.evidence;
}

export async function uploadDocument(
  submissionId: string,
  blob: Blob,
  filename: string,
  kind: DocumentKind,
  transport: DocumentEvidenceTransport = defaultDocumentEvidenceTransport,
  evidenceToken = ''
): Promise<EvidenceItem> {
  const r = await transport.upload(submissionId, blob, filename, kind, evidenceToken);
  return r.evidence;
}

export async function deleteEvidence(
  submissionId: string,
  evidenceId: string,
  transport: Pick<EvidenceTransport, 'remove'> = defaultEvidenceTransport,
  evidenceToken = ''
): Promise<void> {
  return transport.remove(submissionId, evidenceId, evidenceToken);
}

// Re-export the raw transport so tests can mock the network layer explicitly.
export type { RawApi };
