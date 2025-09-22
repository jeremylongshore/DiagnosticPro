import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== EMAIL FUNCTION STARTED (Gmail SMTP v3) - NEW CODE DEPLOYED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let requestEmail = 'unknown';
  
  try {
    const requestBody = await req.json();
    console.log('Raw request body:', JSON.stringify(requestBody, null, 2));
    
    const { to, customerName, analysis, diagnosticData } = requestBody;
    
    console.log('Parsed request data:', {
      to: to,
      customerName: customerName,
      hasAnalysis: !!analysis,
      hasDiagnosticData: !!diagnosticData,
      diagnosticDataKeys: diagnosticData ? Object.keys(diagnosticData) : 'none'
    });
    
    requestEmail = to;
    
    // Use Gmail SMTP
    const gmailUser = Deno.env.get('GMAIL_USER') || 'reports@diagnosticpro.io';
    const gmailPassword = Deno.env.get('GMAIL_APP_PASSWORD');
    
    console.log('Gmail config:', {
      user: gmailUser,
      hasPassword: !!gmailPassword,
      passwordLength: gmailPassword ? gmailPassword.length : 0
    });
    
    if (!gmailPassword) {
      console.error('GMAIL_APP_PASSWORD not configured');
      throw new Error('GMAIL_APP_PASSWORD not configured');
    }

    // Generate simple text-based PDF content
    console.log('Creating simplified text report...');
    const textContent = generateSimplePdfText(diagnosticData, analysis, customerName);
    
    // Create HTML email content
    console.log('Creating HTML email content...');
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>DiagnosticPro AI Analysis Report</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb;">🔧 DiagnosticPro AI Analysis Report</h1>
      </div>
      
      <div style="margin-bottom: 20px;">
        <p>Hello ${customerName || 'Customer'},</p>
        <p>Your diagnostic analysis is complete! The detailed report is attached.</p>
      </div>
      
      <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="color: #1e40af; margin-top: 0;">📋 Vehicle Summary</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Vehicle:</strong> ${diagnosticData.make} ${diagnosticData.model} (${diagnosticData.year})</li>
          <li><strong>Report ID:</strong> ${diagnosticData.id?.slice(0, 8).toUpperCase() || 'N/A'}</li>
          ${diagnosticData.error_codes ? `<li><strong>Error Codes:</strong> ${diagnosticData.error_codes}</li>` : ''}
        </ul>
      </div>
      
      <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h3 style="color: #047857; margin-top: 0;">🎯 AI Analysis Summary</h3>
        <div style="white-space: pre-wrap; line-height: 1.6; font-size: 14px;">${analysis.substring(0, 500)}${analysis.length > 500 ? '...\n\nSee attached report for full analysis.' : ''}</div>
      </div>
      
      <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: #92400e; margin-top: 0;">💡 Important</h4>
        <p style="margin: 0; font-size: 14px;">This AI analysis should be verified by qualified technicians. See full report attachment for details.</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">© 2024 DiagnosticPro AI</p>
      </div>
    </body>
    </html>`;

    try {
      console.log('Creating SMTP client...');
      const client = new SMTPClient({
        connection: {
          hostname: "smtp.gmail.com",
          port: 587,
          tls: true,
          auth: {
            username: gmailUser,
            password: gmailPassword,
          },
        },
      });

      console.log('Sending email via Gmail SMTP...');
      
      await client.send({
        from: gmailUser,
        to: to,
        subject: `DiagnosticPro AI Report - ${diagnosticData.make} ${diagnosticData.model}`,
        content: htmlContent,
        html: htmlContent,
        attachments: [
          {
            filename: `diagnostic-report-${diagnosticData.id?.slice(0, 8) || 'report'}.txt`,
            content: textContent,
            contentType: "text/plain",
          },
        ],
      });

      await client.close();
      console.log('Email sent successfully via Gmail SMTP');
    } catch (smtpError) {
      console.error('SMTP Error details:', {
        message: smtpError.message,
        stack: smtpError.stack,
        name: smtpError.name
      });
      throw smtpError;
    }
    
    // Log email to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase
      .from('email_logs')
      .insert({
        to_email: to,
        subject: `DiagnosticPro AI Report - ${diagnosticData.make} ${diagnosticData.model}`,
        status: 'sent',
        message_id: `gmail-${Date.now()}`,
        submission_id: diagnosticData.id
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully via Gmail SMTP',
        provider: 'Gmail'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending email via Gmail:', error);
    
    // Log error to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      await supabase
        .from('email_logs')
        .insert({
          to_email: requestEmail,
          subject: `DiagnosticPro AI Report - Failed`,
          status: 'failed',
          error: error.message
        });
    } catch (logError) {
      console.error('Failed to log email error:', logError);
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to send diagnostic email via Gmail SMTP'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});

// Function to generate simple text-based PDF content
function generateSimplePdfText(diagnosticData: any, analysis: string, customerName: string): string {
  const reportId = diagnosticData.id?.slice(0, 8).toUpperCase() || 'N/A';
  const timestamp = new Date().toLocaleString();
  
  return `
DIAGNOSTICPRO AI - DIAGNOSTIC REPORT
=====================================

Report ID: ${reportId}
Generated: ${timestamp}
Customer: ${customerName || 'N/A'}

VEHICLE INFORMATION
===================
Make: ${diagnosticData.make || 'N/A'}
Model: ${diagnosticData.model || 'N/A'}  
Year: ${diagnosticData.year || 'N/A'}
Equipment Type: ${diagnosticData.equipment_type || 'N/A'}
Error Codes: ${diagnosticData.error_codes || 'None specified'}

SYMPTOMS REPORTED
=================
${diagnosticData.symptoms || 'No symptoms specified'}

AI ANALYSIS & RECOMMENDATIONS
=============================
${analysis}

IMPORTANT DISCLAIMER
====================
- This analysis is based on the information provided and AI processing
- Always verify diagnoses with physical inspection by qualified technicians  
- Get multiple quotes for expensive repairs
- Reference this report when discussing with service providers

© 2024 DiagnosticPro AI
For support: support@diagnosticpro.ai
  `.trim();
}