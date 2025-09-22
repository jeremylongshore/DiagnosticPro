import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log('=== PDF GENERATION FUNCTION STARTED ===');
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId } = await req.json();
    
    if (!submissionId) {
      throw new Error('Submission ID is required');
    }

    console.log('Generating PDF for submission:', submissionId);

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the diagnostic submission
    const { data: submission, error: submissionError } = await supabase
      .from('diagnostic_submissions')
      .select('*')
      .eq('id', submissionId)
      .eq('payment_status', 'paid')
      .single();

    if (submissionError || !submission) {
      throw new Error('Diagnostic submission not found or not paid');
    }

    // Get the comprehensive AI analysis from orders table
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('submission_id', submissionId)
      .eq('status', 'paid')
      .single();

    if (orderError || !order) {
      console.warn('Order not found, generating basic report without AI analysis');
    }

    console.log('Found submission:', submission.id, 'for', submission.make, submission.model);

    // Generate PDF content
    const pdfContent = generatePdfContent(submission, order);

    console.log('Generated PDF content length:', pdfContent.length);

    // Use encodeURIComponent instead of btoa to handle UTF-8 characters properly
    // This fixes the InvalidCharacterError that occurs with special characters in AI analysis
    const downloadUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(pdfContent)}`;
    
    // Return download URL with proper UTF-8 encoding
    return new Response(JSON.stringify({ 
      downloadUrl: downloadUrl,
      filename: `diagnostic-report-${submission.make}-${submission.model}-${submission.id.slice(0,8)}.txt`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate PDF report'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generatePdfContent(submission: any, order: any): string {
  const currentDate = new Date().toLocaleDateString();
  
  return `
DIAGNOSTIC REPORT
================

Report Date: ${currentDate}
Report ID: ${submission.id}

EQUIPMENT INFORMATION
--------------------
Make: ${submission.make || 'N/A'}
Model: ${submission.model || 'N/A'}
Year: ${submission.year || 'N/A'}
Equipment Type: ${submission.equipment_type || 'N/A'}
Serial Number: ${submission.serial_number || 'N/A'}
Mileage/Hours: ${submission.mileage_hours || 'N/A'}

CUSTOMER INFORMATION
-------------------
Name: ${submission.full_name}
Email: ${submission.email}
Phone: ${submission.phone || 'N/A'}

PROBLEM DESCRIPTION
------------------
${submission.problem_description || 'No description provided'}

SYMPTOMS
--------
${submission.symptoms ? submission.symptoms.join('\n- ') : 'No symptoms listed'}

ERROR CODES
-----------
${submission.error_codes || 'No error codes reported'}

USAGE PATTERNS
--------------
When Started: ${submission.when_started || 'N/A'}
Frequency: ${submission.frequency || 'N/A'}
Usage Pattern: ${submission.usage_pattern || 'N/A'}

ENVIRONMENT & CONTEXT
--------------------
Location/Environment: ${submission.location_environment || 'N/A'}
Urgency Level: ${submission.urgency_level || 'N/A'}

MAINTENANCE HISTORY
------------------
Previous Repairs: ${submission.previous_repairs || 'No previous repairs listed'}
Modifications: ${submission.modifications || 'No modifications listed'}

TROUBLESHOOTING ATTEMPTED
------------------------
${submission.troubleshooting_steps || 'No troubleshooting steps documented'}

SHOP RECOMMENDATIONS
-------------------
${submission.shop_recommendation || 'No shop recommendations provided'}
Quoted Amount: ${submission.shop_quote_amount ? `$${submission.shop_quote_amount}` : 'No quote provided'}

COMPREHENSIVE AI ANALYSIS
=========================
${order?.analysis ? order.analysis : 'AI analysis is being processed. If you see this message, please contact support for immediate assistance.'}

DISCLAIMER
----------
This diagnostic report is based on the information provided and should be used as a guide only. 
Professional mechanical inspection and diagnosis are recommended before performing any repairs.
This report does not guarantee specific outcomes or repair costs.

Generated by DiagnosticPro AI
Report ID: ${submission.id}
Generated: ${currentDate}

© 2025 DiagnosticPro AI. All rights reserved.
`;
}