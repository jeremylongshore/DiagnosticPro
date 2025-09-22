import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET not configured');
    }

    // Verify webhook signature using Stripe's method
    if (!signature) {
      throw new Error('Missing Stripe signature');
    }

    // Import crypto for webhook verification
    const crypto = globalThis.crypto;
    const encoder = new TextEncoder();
    
    // Extract timestamp and signature from header
    const elements = signature.split(',');
    const timestamp = elements.find(el => el.includes('t='))?.split('=')[1];
    const sig = elements.find(el => el.includes('v1='))?.split('=')[1];
    
    if (!timestamp || !sig) {
      throw new Error('Invalid Stripe signature format');
    }
    
    // Create expected signature
    const payload = timestamp + '.' + body;
    const expectedSig = await crypto.subtle.importKey(
      'raw',
      encoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ).then(key => crypto.subtle.sign('HMAC', key, encoder.encode(payload)))
      .then(signature => Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0')).join(''));
    
    // Verify signature
    if (sig !== expectedSig) {
      throw new Error('Invalid Stripe webhook signature');
    }

    const event = JSON.parse(body);
    console.log('Received Stripe webhook:', event.type);

    // Handle the payment success event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Processing completed checkout session:', session.id);
      console.log('Session customer email:', session.customer_email || session.customer_details?.email);
      console.log('Session client_reference_id:', session.client_reference_id);
      
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const customerEmail = session.customer_email || session.customer_details?.email;
      if (!customerEmail) {
        throw new Error('No customer email found in session');
      }

      // Find order by client_reference_id (order ID) first, then fall back to other methods
      let order;
      
      if (session.client_reference_id) {
        // Buy Button workflow - find order by client_reference_id (submission ID)
        console.log('Looking for order by client_reference_id:', session.client_reference_id);
        const { data: orderByRef, error: refError } = await supabase
          .from('orders')
          .select('*')
          .eq('submission_id', session.client_reference_id)
          .maybeSingle();

        if (orderByRef) {
          // Update existing order with Stripe session ID and payment status
          const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({ 
              stripe_session_id: session.id,
              status: 'paid',
              processing_status: 'pending',
              paid_at: new Date().toISOString()
            })
            .eq('submission_id', session.client_reference_id)
            .select('*')
            .single();

          if (updateError) {
            console.error('Failed to update order by client_reference_id:', updateError);
            throw new Error('Failed to update order status');
          }
          order = updatedOrder;
          console.log('Updated order by client_reference_id:', order.id);
        }
      }

      if (!order) {
        // Fallback: try to find existing order by session ID (from create-payment function)
        const { data: existingOrder, error: orderFindError } = await supabase
          .from('orders')
          .select('*')
          .eq('stripe_session_id', session.id)
          .maybeSingle();

        if (existingOrder) {
          // Update existing order (from create-payment flow)
          const { data: updatedOrder, error: updateError } = await supabase
            .from('orders')
            .update({ 
              status: 'paid',
              processing_status: 'pending',
              paid_at: new Date().toISOString()
            })
            .eq('stripe_session_id', session.id)
            .select('*')
            .single();

          if (updateError) {
            console.error('Failed to update existing order:', updateError);
            throw new Error('Failed to update order status');
          }
          order = updatedOrder;
          console.log('Updated existing order:', order.id);
        } else {
        // Create new order for Buy Button payment (no existing order found)
        console.log('No existing order found, creating new order for Buy Button payment');
        
        // Find the most recent unpaid diagnostic submission for this email first
        const { data: recentSubmission, error: submissionFindError } = await supabase
          .from('diagnostic_submissions')
          .select('*')
          .eq('email', customerEmail)
          .eq('payment_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('Found recent submission:', recentSubmission?.id);

        const { data: newOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_email: customerEmail,
            amount: session.amount_total,
            currency: session.currency || 'usd',
            status: 'paid',
            processing_status: 'pending',
            stripe_session_id: session.id,
            paid_at: new Date().toISOString(),
            submission_id: recentSubmission?.id || null
          })
          .select('*')
          .single();

        if (orderError) {
          console.error('Failed to create order:', orderError);
          throw new Error('Failed to create order');
        }
        order = newOrder;
        console.log('Created new order for Buy Button payment:', order.id, 'linked to submission:', recentSubmission?.id);
        }
      }

      // Use the submission we found when creating the order, or find it via order link
      const submissionForAnalysis = order.submission_id ? 
        (await supabase
          .from('diagnostic_submissions')
          .select('*')
          .eq('id', order.submission_id)
          .maybeSingle()).data : null;

      if (submissionForAnalysis) {
        console.log('Found diagnostic submission for analysis:', submissionForAnalysis.id);
        
        // Update the submission with payment info if not already updated
        if (submissionForAnalysis.payment_status === 'pending') {
          const { error: updateError } = await supabase
            .from('diagnostic_submissions')
            .update({ 
              payment_status: 'paid',
              paid_at: new Date().toISOString(),
              payment_id: session.payment_intent || session.id,
              order_id: order.id,
              analysis_status: 'pending'
            })
            .eq('id', submissionForAnalysis.id);

          if (updateError) {
            console.error('Failed to update submission payment status:', updateError);
          } else {
            console.log('Diagnostic submission payment status updated');
          }
        }
        
        console.log('Triggering AI analysis for submission:', submissionForAnalysis.id);
        
        try {
          // Update order and submission status to processing
          await supabase
            .from('orders')
            .update({ 
              processing_status: 'processing',
              error_message: null
            })
            .eq('id', order.id);
            
          await supabase
            .from('diagnostic_submissions')
            .update({ analysis_status: 'processing' })
            .eq('id', submissionForAnalysis.id);
            
          console.log('Starting AI analysis...');
          const analysisResponse = await supabase.functions.invoke('analyze-diagnostic', {
            body: {
              submissionId: submissionForAnalysis.id,
              diagnosticData: submissionForAnalysis
            }
          });

          if (analysisResponse.error) {
            console.error('Analysis error:', analysisResponse.error);
            
          // Update statuses to failed
          await supabase
            .from('orders')
            .update({ 
              processing_status: 'failed',
              error_message: `Analysis failed: ${analysisResponse.error.message || 'Unknown error'}`
            })
            .eq('id', order.id);
            
          await supabase
            .from('diagnostic_submissions')
            .update({ analysis_status: 'failed' })
            .eq('id', submissionForAnalysis.id);
          } else {
            console.log('Analysis completed successfully');
            
            // Update analysis status to completed and set redirect ready
            await supabase
              .from('diagnostic_submissions')
              .update({ analysis_status: 'completed' })
              .eq('id', submissionForAnalysis.id);
              
            await supabase
              .from('orders')
              .update({ 
                processing_status: 'completed',
                redirect_ready: true,
                redirect_url: `/report/${submissionForAnalysis.id}`
              })
              .eq('id', order.id);
          }
        } catch (analysisError) {
          console.error('Failed to trigger analysis:', analysisError);
          
          // Update statuses to failed
          await supabase
            .from('orders')
            .update({ 
              processing_status: 'failed',
              error_message: `System error: ${analysisError.message || 'Unknown error'}`
            })
            .eq('id', order.id);
            
          await supabase
            .from('diagnostic_submissions')
            .update({ analysis_status: 'failed' })
            .eq('id', submissionForAnalysis.id);
        }
      } else {
        console.error('No diagnostic submission found for analysis');
      }

      // Send Slack notification
      try {
        await supabase.functions.invoke('send-slack-notification', {
          body: {
            message: `💰 Payment completed! ${customerEmail} paid $${(session.amount_total / 100).toFixed(2)} for diagnostic analysis. ${submissionForAnalysis ? 'Analysis will be available via download link.' : 'No diagnostic submission found.'}`,
            channel: '#sales'
          }
        });
      } catch (slackError) {
        console.error('Slack notification failed:', slackError);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check webhook logs for more information'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});