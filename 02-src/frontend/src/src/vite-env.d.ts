/// <reference types="vite/client" />

// Debug breadcrumbs DiagnosticReview leaves on window after a successful save.
interface Window {
  __dp_lastPayload?: { reqId: string; submissionId: string; payloadKeys: string[]; ts: string };
  __dp_reqId?: string;
}
