import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();
    
    if (!submissionId) {
      throw new Error('Submission ID is required');
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Initialize Supabase with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the diagnostic submission
    const { data: submission, error: submissionError } = await supabase
      .from('diagnostic_submissions')
      .select('*')
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      throw new Error('Diagnostic submission not found');
    }

    console.log('Creating payment for submission:', submissionId, 'Customer:', submission.email);

    // Check if customer already exists in Stripe
    const customers = await stripe.customers.list({ 
      email: submission.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : submission.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'AI Diagnostic Analysis',
              description: `Comprehensive diagnostic analysis for ${submission.make} ${submission.model}`,
            },
            unit_amount: 2999, // $29.99 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/report/${submissionId}`,
      cancel_url: `${req.headers.get('origin')}/?payment=cancelled`,
      metadata: {
        submission_id: submissionId,
        customer_name: submission.full_name,
        equipment: `${submission.make} ${submission.model}`
      }
    });

    console.log('Stripe session created:', session.id);

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        submission_id: submissionId,
        customer_email: submission.email,
        amount: 2999,
        currency: 'usd',
        status: 'pending',
        stripe_session_id: session.id
      }])
      .select()
      .single();

    if (orderError) {
      console.error('Failed to create order:', orderError);
      throw new Error('Failed to create order record');
    }

    console.log('Order created:', order.id);

    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id,
      orderId: order.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Payment creation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to create payment session'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});