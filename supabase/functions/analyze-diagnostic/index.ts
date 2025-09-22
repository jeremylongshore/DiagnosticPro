import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { initializeApp } from "https://esm.sh/firebase@10.14.1/app";
import { getAI, getGenerativeModel, GoogleAIBackend } from "https://esm.sh/firebase@10.14.1/ai";

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
    
    // Initialize Firebase with Vertex AI
    const firebaseConfig = {
      projectId: Deno.env.get('GOOGLE_CLOUD_PROJECT') || 'diagnostic-pro-prod',
      apiKey: Deno.env.get('FIREBASE_API_KEY'),
    };

    if (!firebaseConfig.apiKey) {
      console.error('FIREBASE_API_KEY not found in environment variables');
      throw new Error('FIREBASE_API_KEY is not configured in Edge Function secrets');
    }

    const firebaseApp = initializeApp(firebaseConfig);
    const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });
    const model = getGenerativeModel(ai, { model: "gemini-2.5-flash" });

    console.log('Firebase Vertex AI initialized, proceeding with analysis...');

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

    console.log('Calling Firebase Vertex AI with diagnostic data...');

    // Create the full prompt with system context
    const fullPrompt = `You are DiagnosticPro's MASTER TECHNICIAN with 30+ years of experience across all equipment types. You have access to all service manuals, TSBs, and insider knowledge. You are ruthless in protecting customers from ripoffs and incompetent shops. Your analysis must be worth every penny of the $29.99 they paid. Always provide EXACT specifications, part numbers, and actionable intelligence. You call out shops that try to parts-cannon or overcharge customers.

${prompt}`;

    // Call Firebase Vertex AI Gemini model
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const analysis = response.text();

    console.log('Firebase Vertex AI response received successfully');

    if (!analysis) {
      console.error('No analysis content in Vertex AI response:', result);
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