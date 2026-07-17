# 🔐 STRIPE WEBHOOK CONFIGURATION

**Date:** 2025-09-26
**Phase:** WEBHOOK SETUP
**File:** 0047-WEBHOOK-092625-STRIPE-CONFIGURATION.md
**Session:** Stripe Webhook Integration

---

## ✅ STRIPE WEBHOOK DETAILS (FROM YOUR DASHBOARD)

### Webhook Endpoint Configuration
- **Destination ID**: `we_1SB1XcJfyCDmId8XHqyfDiC8`
- **Endpoint URL**: `https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/webhook/stripe`
- **Description**: Cloud diagnosticpro
- **API Version**: 2025-06-30.basil
- **Listening to**: 4 events
- **Signing Secret**: `whsec_REDACTED-legacy-gcp-endpoint-2026-07-01`

---

## 🔧 BACKEND CONFIGURATION NEEDED

### Environment Variables for Backend Service
```bash
# Add to Cloud Run backend environment
STRIPE_WEBHOOK_SECRET=whsec_REDACTED-legacy-gcp-endpoint-2026-07-01
STRIPE_SECRET_KEY=sk_live_... # Your Stripe secret key
```

### Backend Webhook Handler Code
```javascript
// Backend webhook endpoint (index.js or similar)
app.post('/webhook/stripe', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = 'whsec_REDACTED-legacy-gcp-endpoint-2026-07-01';

  let event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;

      // Get the submissionId from client_reference_id
      const submissionId = session.client_reference_id;

      // Update Firestore
      await firestore.collection('diagnosticSubmissions').doc(submissionId).update({
        paymentStatus: 'completed',
        paymentIntentId: session.payment_intent,
        paidAt: new Date(),
        analysisStatus: 'processing'
      });

      // Trigger AI analysis
      await triggerVertexAIAnalysis(submissionId);

      break;

    case 'payment_intent.succeeded':
      // Handle successful payment
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});
```

---

## 🚨 CRITICAL PAYMENT FLOW FIX

The main issue is that the Stripe Buy Button needs to be configured correctly. Here are the options:

### Option 1: Create Payment Link in Stripe Dashboard
1. Go to: https://dashboard.stripe.com/payment-links/create
2. Set price: $4.99
3. Product name: "DiagnosticPro AI Analysis"
4. After payment behavior: Don't show confirmation page
5. Metadata: Add field `submission_id` (will be passed as client_reference_id)
6. Get the payment link URL

### Option 2: Use Stripe Checkout API
Replace the Buy Button with API-based checkout:

```javascript
// Frontend code to create checkout session
const createCheckoutSession = async () => {
  const response = await fetch('https://diagpro-gw-3tbssksx-3tbssksx.uc.gateway.dev/createCheckoutSession', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'REDACTED_API_KEY'
    },
    body: JSON.stringify({
      submissionId: submissionId,
      successUrl: window.location.origin + '/success',
      cancelUrl: window.location.origin + '/cancel'
    })
  });

  const { url } = await response.json();
  window.location.href = url;
};
```

---

## 📋 COMPLETE SETUP CHECKLIST

### Backend Service (Cloud Run)
- [ ] Add `STRIPE_WEBHOOK_SECRET` environment variable
- [ ] Add `STRIPE_SECRET_KEY` environment variable
- [ ] Deploy webhook handler code
- [ ] Ensure raw body parsing for webhook endpoint

### API Gateway
- [x] Webhook endpoint configured: `/webhook/stripe`
- [x] Public access allowed (no API key for webhooks)
- [x] Forwarding to backend service

### Frontend
- [ ] Replace hardcoded Buy Button with working solution
- [ ] Ensure submissionId is passed as client_reference_id
- [ ] Handle success/cancel redirects

### Stripe Dashboard
- [x] Webhook endpoint created
- [x] Webhook secret obtained
- [ ] Payment Link or Product created
- [ ] Test mode verified working before live

---

## 🔑 KEY POINTS

1. **Webhook Secret**: `whsec_REDACTED-legacy-gcp-endpoint-2026-07-01` - This MUST be used to verify webhooks
2. **Endpoint URL**: Already configured at API Gateway
3. **Events**: Make sure listening for `checkout.session.completed`
4. **Client Reference ID**: Pass submissionId to link payment to form data

---

## 🚀 IMMEDIATE NEXT STEPS

1. **Update backend** with webhook secret
2. **Create Payment Link** in Stripe Dashboard
3. **Replace Buy Button** in frontend code
4. **Test end-to-end** flow

---

**Status**: Webhook configured in Stripe, needs backend integration
**Priority**: CRITICAL - Blocking all payments