import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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
    const { to } = await req.json();
    
    if (!to) {
      throw new Error('Email address is required');
    }
    
    console.log('Testing email send to:', to);
    
    // Get Resend API key from environment
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Initialize Resend client
    const resend = new Resend(resendApiKey);

    // Create test email content
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>DiagnosticPro AI - Email Test</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb;">🔧 DiagnosticPro AI</h1>
        <h2 style="color: #059669;">✅ Email Test Successful!</h2>
      </div>
      
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
        <h3 style="color: #047857; margin-top: 0;">Email System Working Perfectly</h3>
        <p>This test email confirms that your DiagnosticPro AI email system is properly configured and working with Resend.</p>
        <ul style="color: #374151;">
          <li>✅ Resend API connection established</li>
          <li>✅ Email delivery system operational</li>
          <li>✅ Ready to send diagnostic reports</li>
        </ul>
      </div>
      
      <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
        <h4 style="color: #1d4ed8; margin-top: 0;">📧 Test Details</h4>
        <p style="margin: 0; color: #374151; font-size: 14px;">
          <strong>Sent:</strong> ${new Date().toLocaleString()}<br>
          <strong>Service:</strong> Resend API<br>
          <strong>Status:</strong> Delivered
        </p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          © 2024 DiagnosticPro AI<br>
          Professional equipment diagnostics powered by AI
        </p>
      </div>
    </body>
    </html>`;

    console.log('Sending test email via Resend API...');
    
    // Send test email via Resend
    const result = await resend.emails.send({
      from: "DiagnosticPro AI Reports <reports@diagnosticpro.io>",
      to: [to],
      subject: "✅ DiagnosticPro AI - Email Test Successful",
      html: htmlContent,
    });

    console.log('Test email sent successfully:', {
      messageId: result?.data?.id || result?.id || 'No ID returned',
      success: true
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test email sent successfully',
        messageId: result?.data?.id || result?.id || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending test email:', error);

    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Failed to send test email'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});