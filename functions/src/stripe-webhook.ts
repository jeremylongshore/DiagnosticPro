import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

export const stripeWebhook = onRequest(
  {
    cors: false,
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 60
  },
  async (req, res) => {
    logger.info('=== STRIPE WEBHOOK RECEIVED ===');

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2025-08-27.basil'
    });

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!endpointSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured');
      res.status(500).json({ error: 'Webhook secret not configured' });
      return;
    }

    let event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        endpointSecret
      );
      logger.info('Stripe webhook verified:', event.type);
    } catch (err: any) {
      logger.error('Webhook signature verification failed:', err.message);
      res.status(400).json({ error: 'Webhook signature verification failed' });
      return;
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const submissionId = session.client_reference_id;

      logger.info('Payment successful for submission:', submissionId);

      if (!submissionId) {
        logger.error('No submission ID found in payment session');
        res.status(400).json({ error: 'No submission ID found' });
        return;
      }

      try {
        // Get the diagnostic submission from Firestore
        const db = admin.firestore();
        const submissionDoc = await db.collection('diagnosticSubmissions').doc(submissionId).get();

        if (!submissionDoc.exists) {
          logger.error('Diagnostic submission not found:', submissionId);
          res.status(404).json({ error: 'Submission not found' });
          return;
        }

        const submissionData = submissionDoc.data();

        // Update payment status
        await db.collection('diagnosticSubmissions').doc(submissionId).update({
          paymentStatus: 'completed',
          stripeSessionId: session.id,
          paidAt: admin.firestore.FieldValue.serverTimestamp()
        });

        logger.info('Payment status updated, triggering analysis...');

        // Import and use the Vertex AI analysis logic directly
        const { GoogleAuth } = require('google-auth-library');

        const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'diagnostic-pro-prod';
        const location = 'us-central1';

        // Create Google Auth client for Vertex AI
        const authClient = new GoogleAuth({
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        // Create the diagnostic prompt
        const prompt = `You are DiagnosticPro's MASTER TECHNICIAN. Use ALL the diagnostic data provided to give the most accurate analysis possible.

CUSTOMER DATA PROVIDED:
- Vehicle: ${submissionData?.make || 'Not specified'} ${submissionData?.model || 'Not specified'} ${submissionData?.year || 'Not specified'}
- Equipment Type: ${submissionData?.equipmentType || 'Not specified'}
- Problem: ${submissionData?.problemDescription || 'None provided'}
- Error Codes: ${submissionData?.errorCodes || 'None provided'}
- Shop Quote: ${submissionData?.shopQuoteAmount ? `$${submissionData.shopQuoteAmount}` : 'Not provided'}

📋 COMPREHENSIVE ANALYSIS (12 sections):
🎯 1. PRIMARY DIAGNOSIS - Root cause analysis
🔍 2. DIFFERENTIAL DIAGNOSIS - Alternative causes
✅ 3. DIAGNOSTIC VERIFICATION - Required tests
❓ 4. SHOP INTERROGATION - Questions to ask
💸 5. COST BREAKDOWN - Fair pricing analysis
🚩 6. RIPOFF DETECTION - Warning signs
⚖️ 7. AUTHORIZATION GUIDE - Approve/reject/second opinion
🔧 8. TECHNICAL EDUCATION - How systems work
📦 9. OEM PARTS STRATEGY - Specific part numbers
💬 10. NEGOTIATION TACTICS - Price comparisons
🔍 11. QUALITY VERIFICATION - Post-repair tests
🕵️ 12. INSIDER INTELLIGENCE - Known issues

BE RUTHLESSLY SPECIFIC. PROTECT THE CUSTOMER'S WALLET.`;

        const fullPrompt = `You are DiagnosticPro's MASTER TECHNICIAN with 30+ years experience. Your $29.99 analysis must be ruthlessly protective of customer wallets and expose incompetent shops.

${prompt}`;

        // Get access token and call Vertex AI
        const accessToken = await authClient.getAccessToken();

        const vertexResponse = await fetch(
          `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                role: 'user',
                parts: [{ text: fullPrompt }]
              }],
              generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.7
              }
            })
          }
        );

        if (!vertexResponse.ok) {
          const errorText = await vertexResponse.text();
          throw new Error(`Vertex AI API error: ${vertexResponse.status} - ${errorText}`);
        }

        const vertexResult = await vertexResponse.json();
        const analysis = vertexResult.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!analysis) {
          throw new Error('No analysis generated from Vertex AI');
        }

        logger.info('Analysis generated successfully, length:', analysis.length);

        // Generate PDF report and upload to Cloud Storage
        const { generatePDFReport } = require('./utils/pdf-generator');
        const pdfBuffer = await generatePDFReport({
          submissionData,
          analysis,
          submissionId
        });

        // Upload to Cloud Storage
        const bucket = admin.storage().bucket();
        const fileName = `reports/${submissionId}/diagnostic-report.pdf`;
        const file = bucket.file(fileName);

        await file.save(pdfBuffer, {
          metadata: {
            contentType: 'application/pdf',
            metadata: {
              submissionId: submissionId,
              createdAt: new Date().toISOString()
            }
          }
        });

        // Generate signed download URL (valid for 7 days)
        const [downloadUrl] = await file.getSignedUrl({
          action: 'read',
          expires: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        logger.info('PDF report uploaded to Cloud Storage:', fileName);

        // Save analysis and download URL to Firestore
        await db.collection('diagnosticSubmissions').doc(submissionId).update({
          analysisStatus: 'completed',
          analysis: analysis,
          downloadUrl: downloadUrl,
          reportPath: fileName,
          analysisCompletedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        logger.info('Analysis saved successfully to Firestore with download URL');

        res.status(200).json({
          success: true,
          message: 'Payment processed and analysis started',
          submissionId
        });

      } catch (error) {
        logger.error('Error processing payment webhook:', error);
        res.status(500).json({ error: 'Failed to process payment' });
      }
    } else {
      logger.info('Unhandled webhook event type:', event.type);
      res.status(200).json({ received: true });
    }
  }
);