import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { submissionId, diagnosticData } = await req.json();
    console.log('Received diagnostic analysis request:', { submissionId, hasData: !!diagnosticData });
    
    // Get OpenAI API key from environment
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      console.error('OPENAI_API_KEY not found in environment variables');
      throw new Error('OPENAI_API_KEY is not configured in Edge Function secrets');
    }
    console.log('OpenAI API key found, proceeding with analysis...');

    // Prepare the comprehensive diagnostic prompt for $29.99 analysis
    const prompt = `You are DiagnosticPro's MASTER TECHNICIAN. Use ALL the diagnostic data provided to give the most accurate analysis possible. Reference specific error codes, mileage patterns, and equipment type in your diagnosis.

CUSTOMER DATA PROVIDED:
- Vehicle: ${diagnosticData.make || 'Not specified'} ${diagnosticData.model || 'Not specified'} ${diagnosticData.year || 'Not specified'}
- Equipment Type: ${diagnosticData.equipment_type || 'Not specified'}
- Mileage/Hours: ${diagnosticData.mileage_hours || 'Not specified'}
- Serial Number: ${diagnosticData.serial_number || 'Not specified'}
- Problem: ${diagnosticData.problem_description || 'None provided'}
- Symptoms: ${Array.isArray(diagnosticData.symptoms) ? diagnosticData.symptoms.join(', ') : diagnosticData.symptoms || 'None provided'}
- Error Codes: ${diagnosticData.error_codes || 'None provided'}
- When Started: ${diagnosticData.when_started || 'Not specified'}
- Frequency: ${diagnosticData.frequency || 'Not specified'}
- Urgency Level: ${diagnosticData.urgency_level || 'Normal'}
- Location/Environment: ${diagnosticData.location_environment || 'Not specified'}
- Usage Pattern: ${diagnosticData.usage_pattern || 'Not specified'}
- Previous Repairs: ${diagnosticData.previous_repairs || 'None'}
- Modifications: ${diagnosticData.modifications || 'None'}
- Troubleshooting Done: ${diagnosticData.troubleshooting_steps || 'None'}
- Shop Quote: ${diagnosticData.shop_quote_amount ? `$${diagnosticData.shop_quote_amount}` : 'Not provided'}
- Shop Recommendation: ${diagnosticData.shop_recommendation || 'None'}

📋 COMPREHENSIVE ANALYSIS (2500 words max):

🎯 1. PRIMARY DIAGNOSIS
- Root cause (confidence %)
- Reference specific error codes if provided
- Component failure analysis
- Age/mileage considerations

🔍 2. DIFFERENTIAL DIAGNOSIS
- Alternative causes ranked
- Why each ruled in/out
- Equipment-specific patterns

✅ 3. DIAGNOSTIC VERIFICATION
- Exact tests shop MUST perform
- Tools needed, expected readings
- Cost estimates for testing

❓ 4. SHOP INTERROGATION
- 5 technical questions to expose incompetence
- Specific data they must show you
- Red flag responses

💸 5. COST BREAKDOWN
- Fair parts pricing analysis
- Labor hour estimates
- Total price range
- Overcharge identification

🚩 6. RIPOFF DETECTION
- Parts cannon indicators
- Diagnostic shortcuts
- Price gouging red flags

⚖️ 7. AUTHORIZATION GUIDE
- Approve immediately
- Reject outright
- Get 2nd opinion

🔧 8. TECHNICAL EDUCATION
- System operation
- Failure mechanism
- Prevention tips

📦 9. OEM PARTS STRATEGY
- Specific part numbers
- Why OEM critical
- Pricing sources

💬 10. NEGOTIATION TACTICS
- Price comparisons
- Labor justification
- Warranty demands

🔍 11. QUALITY VERIFICATION
- Post-repair tests
- Monitoring schedule
- Return triggers

🕵️ 12. INSIDER INTELLIGENCE
- Known issues for this model
- TSB references
- Common shortcuts

BE RUTHLESSLY SPECIFIC. PROTECT THE CUSTOMER'S WALLET. DEMAND TECHNICAL PRECISION.`;

    console.log('Calling OpenAI API with diagnostic data...');

    // Call OpenAI API with correct parameters for GPT-4.1 model
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are DiagnosticPro\'s MASTER TECHNICIAN with 30+ years of experience across all equipment types. You have access to all service manuals, TSBs, and insider knowledge. You are ruthless in protecting customers from ripoffs and incompetent shops. Your analysis must be worth every penny of the $29.99 they paid. Always provide EXACT specifications, part numbers, and actionable intelligence. You call out shops that try to parts-cannon or overcharge customers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        // Use max_completion_tokens for GPT-4.1+ models, not max_tokens
        max_completion_tokens: 3000,
        // Temperature not supported in GPT-4.1+ models
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error details:', {
        status: openAIResponse.status,
        statusText: openAIResponse.statusText,
        error: errorText
      });
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    console.log('OpenAI API response received successfully');
    
    const aiResult = await openAIResponse.json();
    const analysis = aiResult.choices[0]?.message?.content;

    if (!analysis) {
      console.error('No analysis content in OpenAI response:', aiResult);
      throw new Error('No analysis generated');
    }

    console.log('Analysis generated successfully, length:', analysis.length);

    // If submissionId provided, update the database
    if (submissionId) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Store the comprehensive analysis in the database
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          analysis_completed_at: new Date().toISOString(),
          analysis: analysis,
          processing_status: 'completed'
        })
        .eq('submission_id', submissionId);

      if (updateError) {
        console.error('Failed to update order:', updateError);
      }
    }

    console.log('Diagnostic analysis completed successfully for submission:', submissionId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        submissionId 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-diagnostic:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check Edge Function logs for more information'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});