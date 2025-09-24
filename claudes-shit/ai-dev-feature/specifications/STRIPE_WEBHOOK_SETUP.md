# Stripe Webhook Setup Guide

## CRITICAL: Your webhook is not receiving events from Stripe

### Step 1: Register Webhook Endpoint in Stripe Dashboard

1. Go to [Stripe Dashboard Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL to: `https://jjxvrxehmawuyxltrvql.supabase.co/functions/v1/stripe-webhook`
4. Select these events:
   - `checkout.session.completed`
5. Click "Add endpoint"

### Step 2: Get the Real Webhook Secret

1. After creating the endpoint, click on it
2. Click "Reveal" next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Update your STRIPE_WEBHOOK_SECRET in Supabase secrets with this value

### Step 3: Configure Your Buy Button/Checkout

Your Stripe Buy Button or Checkout needs to send webhook events to the endpoint above.

### Step 4: Test the Flow

1. Make a real payment through your Stripe integration
2. Check the webhook logs in Stripe dashboard
3. Verify the order processes correctly

## Current Issue
Orders are stuck at 'paid' status but never proceed to AI analysis because Stripe isn't sending webhook events to your endpoint.