// Email service using Nodemailer instead of SendGrid
import nodemailer from "nodemailer";
import { apiClient } from "@/services/api";

// Email configuration
const EMAIL_CONFIG = {
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "diagnosticpro.ai@gmail.com",
    pass: process.env.GMAIL_APP_PASSWORD || "", // App-specific password required
  },
};

// Create reusable transporter
const transporter = nodemailer.createTransporter(EMAIL_CONFIG);

export interface DiagnosticEmailData {
  to: string;
  customerName: string;
  vehicle: string;
  year: string;
  make: string;
  model: string;
  issueDescription: string;
  errorCodes: string;
  diagnosticAnalysis: string;
  pdfBuffer?: Buffer;
  submissionId: string;
}

export async function sendDiagnosticEmail(data: DiagnosticEmailData): Promise<boolean> {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      line-height: 1.6; 
      color: #333; 
      margin: 0;
      padding: 0;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: white;
    }
    .header { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      padding: 40px 30px; 
      text-align: center;
    }
    .content { 
      padding: 30px;
    }
    .info-box { 
      background: #f8f9fa; 
      border-left: 4px solid #667eea; 
      padding: 20px; 
      margin: 20px 0; 
      border-radius: 5px;
    }
    .diagnostic-values { 
      background: #2d3748; 
      color: #48bb78; 
      padding: 15px; 
      border-radius: 5px; 
      font-family: 'Courier New', monospace; 
      margin: 20px 0;
      font-size: 13px;
      line-height: 1.8;
    }
    .button { 
      display: inline-block; 
      background: #667eea; 
      color: white !important; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 5px; 
      margin: 20px 0;
    }
    .footer { 
      background: #f8f9fa; 
      padding: 20px; 
      text-align: center; 
      font-size: 12px; 
      color: #666;
      border-top: 1px solid #e0e0e0;
    }
    h1 { 
      margin: 0; 
      font-size: 32px; 
      font-weight: 600;
    }
    h2 { 
      color: #667eea; 
      border-bottom: 2px solid #e0e0e0; 
      padding-bottom: 10px;
      margin-top: 30px;
    }
    ul li { 
      margin: 10px 0;
      padding-left: 5px;
    }
    .checkmark {
      color: #48bb78;
      font-weight: bold;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    td {
      padding: 8px 0;
      vertical-align: top;
    }
    .label {
      font-weight: 600;
      color: #667eea;
      width: 120px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔧 DiagnosticPro AI</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.95;">
        Professional Vehicle Diagnostic Report
      </p>
    </div>
    
    <div class="content">
      <p style="font-size: 16px;">Dear ${data.customerName},</p>
      
      <p>Thank you for using <strong>DiagnosticPro AI</strong>. Your comprehensive vehicle diagnostic analysis is ready.</p>
      
      <div class="info-box">
        <h3 style="margin-top: 0; color: #667eea;">📋 Vehicle Information</h3>
        <table>
          <tr>
            <td class="label">Vehicle:</td>
            <td>${data.year} ${data.make} ${data.model}</td>
          </tr>
          <tr>
            <td class="label">Error Codes:</td>
            <td>${data.errorCodes || "None reported"}</td>
          </tr>
          <tr>
            <td class="label">Issue:</td>
            <td>${data.issueDescription}</td>
          </tr>
          <tr>
            <td class="label">Report ID:</td>
            <td>#${data.submissionId.slice(0, 8).toUpperCase()}</td>
          </tr>
        </table>
      </div>
      
      <h2>🤖 AI Diagnostic Analysis</h2>
      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        ${data.diagnosticAnalysis.split("\n").slice(0, 5).join("<br>")}
        <p style="margin-top: 15px; font-style: italic; color: #718096;">
          [Complete analysis continues in attached PDF...]
        </p>
      </div>
      
      <h2>📊 What's Included in Your Report</h2>
      <ul style="list-style: none; padding: 0;">
        <li><span class="checkmark">✅</span> Root cause analysis with AI diagnostics</li>
        <li><span class="checkmark">✅</span> Specific test values (PSI, voltage, resistance)</li>
        <li><span class="checkmark">✅</span> Step-by-step repair procedures</li>
        <li><span class="checkmark">✅</span> Cost estimates for parts and labor</li>
        <li><span class="checkmark">✅</span> Safety warnings and precautions</li>
        <li><span class="checkmark">✅</span> Prevention tips for future issues</li>
        <li><span class="checkmark">✅</span> DIY vs professional repair guidance</li>
      </ul>
      
      <div class="diagnostic-values">
        <strong>🔬 Sample Diagnostic Test Values:</strong><br><br>
        • Compression Test: 180-210 PSI (±14 PSI variance)<br>
        • Fuel Pressure: 50-60 PSI at idle, 60-70 PSI at WOT<br>
        • Spark Plug Gap: 0.043 inches (wear limit: 0.050")<br>
        • Ignition Coil: Primary 0.5-1.0Ω, Secondary 6-12kΩ<br>
        • Battery Voltage: 12.6V engine off, 13.5-14.5V running<br>
        • O2 Sensor: 0.1-0.9V fluctuating (normal operation)<br>
        <br>
        <em style="color: #68d391;">Full specifications in attached PDF report</em>
      </div>
      
      <p style="background: #fef5e7; padding: 15px; border-left: 4px solid #f39c12; margin: 20px 0;">
        <strong>📎 Important:</strong> Your complete diagnostic report is attached as a PDF. 
        Please review it thoroughly for all test specifications and repair procedures.
      </p>
      
      <center>
        <a href="mailto:support@diagnosticpro.ai" class="button">Contact Support</a>
      </center>
      
      <p style="margin-top: 30px;">
        If you have any questions about your diagnostic report or need clarification on any recommendations, 
        our support team is available to assist you.
      </p>
      
      <p>
        Best regards,<br>
        <strong>The DiagnosticPro AI Team</strong><br>
        <em style="color: #718096;">Professional Automotive Diagnostics</em>
      </p>
    </div>
    
    <div class="footer">
      <p style="margin: 5px 0;">
        © 2024 DiagnosticPro AI - Professional Automotive Diagnostics
      </p>
      <p style="margin: 5px 0;">
        <a href="https://diagnosticpro.ai" style="color: #667eea; text-decoration: none;">
          www.diagnosticpro.ai
        </a>
      </p>
      <p style="margin: 10px 0 5px 0; font-size: 11px; color: #a0aec0;">
        This email was sent to ${data.to} regarding submission #${data.submissionId}
      </p>
    </div>
  </div>
</body>
</html>`;

    const mailOptions = {
      from: '"DiagnosticPro AI Reports" <reports@diagnosticpro.io>',
      to: data.to,
      subject: `DiagnosticPro AI Report - ${data.year} ${data.make} ${data.model}`,
      html: htmlContent,
      attachments: data.pdfBuffer
        ? [
            {
              filename: `diagnostic-report-${data.submissionId}.pdf`,
              content: data.pdfBuffer,
              contentType: "application/pdf",
            },
          ]
        : [],
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);

    // Log to API
    await apiClient.post('/email-logs', {
      toEmail: data.to,
      subject: mailOptions.subject,
      status: "sent",
      messageId: info.messageId,
      submissionId: data.submissionId,
    });

    return true;
  } catch (error) {
    console.error("Email send error:", error);

    // Log failure to API
    await apiClient.post('/email-logs', {
      toEmail: data.to,
      subject: `DiagnosticPro AI Report - ${data.vehicle}`,
      status: "failed",
      error: error.message,
      submissionId: data.submissionId,
    });

    return false;
  }
}

// Test email function
export async function sendTestEmail(to: string): Promise<boolean> {
  const testData: DiagnosticEmailData = {
    to,
    customerName: "Test Customer",
    vehicle: "2019 Honda Civic",
    year: "2019",
    make: "Honda",
    model: "Civic",
    issueDescription: "Engine misfire on cylinders 1 and 2",
    errorCodes: "P0301, P0302",
    diagnosticAnalysis: `Based on the error codes P0301 and P0302, your vehicle is experiencing misfires in cylinders 1 and 2.

Root Cause Analysis:
The most likely causes are faulty spark plugs or ignition coils in the affected cylinders.

Diagnostic Tests Required:
- Compression test: Expected 180-210 PSI per cylinder
- Spark plug inspection: Check for wear and deposits
- Ignition coil resistance: Primary 0.5-1.0Ω, Secondary 6-12kΩ

Recommended Repairs:
1. Replace spark plugs in cylinders 1 and 2
2. Test and potentially replace ignition coils
3. Clear error codes and test drive

Estimated Cost: $200-$400 including parts and labor`,
    submissionId: "test-" + Date.now(),
  };

  return sendDiagnosticEmail(testData);
}
