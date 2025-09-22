/**
 * Payment service - handles Stripe checkout with diagnostic_id correlation
 */
import { api } from './api';

export interface CheckoutSession {
  url: string;
}

export interface PaymentData {
  diagnosticId: number;
  successUrl: string;
  cancelUrl: string;
}

/**
 * Create Stripe checkout session (Cloud Run API)
 */
export async function createCheckoutSession(
  diagnosticId: string,
  successUrl: string,
  cancelUrl: string
): Promise<{ url: string }> {
  return api<{ url: string }>(`/api/checkout`, {
    method: "POST",
    body: JSON.stringify({
      diagnostic_id: diagnosticId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });
}

/**
 * Helper to create checkout session for diagnostic
 */
export async function createDiagnosticCheckout(diagnosticId: number): Promise<ApiResponse<CheckoutSession>> {
  const baseUrl = window.location.origin;

  return createCheckoutSession({
    diagnosticId,
    successUrl: `${baseUrl}/payment-success?diagnostic_id=${diagnosticId}`,
    cancelUrl: `${baseUrl}/payment-cancelled?diagnostic_id=${diagnosticId}`,
  });
}