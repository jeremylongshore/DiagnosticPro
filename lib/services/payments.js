/**
 * Payment service - handles Stripe checkout with diagnostic_id correlation
 */
import { api } from './api';
/**
 * Create Stripe checkout session (Cloud Run API)
 */
export async function createCheckoutSession(diagnosticId, successUrl, cancelUrl) {
    return api(`/api/checkout`, {
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
export async function createDiagnosticCheckout(diagnosticId) {
    const baseUrl = window.location.origin;
    return createCheckoutSession({
        diagnosticId,
        successUrl: `${baseUrl}/payment-success?diagnostic_id=${diagnosticId}`,
        cancelUrl: `${baseUrl}/payment-cancelled?diagnostic_id=${diagnosticId}`,
    });
}
