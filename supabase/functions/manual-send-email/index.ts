import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Manual email send started');
    
    // Get the diagnostic submission
    const { data: submission, error: submissionError } = await supabase
      .from('diagnostic_submissions')
      .select('*')
      .eq('id', '36186b4b-df36-4a45-a616-7c84320b9a18')
      .single();

    if (submissionError || !submission) {
      console.error('Submission not found:', submissionError);
      throw new Error('Diagnostic submission not found');
    }

    console.log('Found submission for:', submission.email);

    // Call the send-diagnostic-email function
    const { data: emailResult, error: emailError } = await supabase.functions.invoke(
      'send-diagnostic-email',
      {
        body: {
          to: submission.email,
          customerName: submission.full_name,
          analysis: `Comprehensive AI diagnostic analysis for your ${submission.make} ${submission.model} (${submission.year})`,
          diagnosticData: {
            id: submission.id,
            make: submission.make,
            model: submission.model,
            year: submission.year,
            equipment_type: submission.equipment_type,
            error_codes: submission.error_codes,
            symptoms: submission.symptoms
          }
        }
      }
    );

    if (emailError) {
      console.error('Email send error:', emailError);
      throw emailError;
    }

    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );

  } catch (error: any) {
    console.error('Manual email send error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    );
  }
});