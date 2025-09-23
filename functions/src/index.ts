import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { GoogleAuth } from "google-auth-library";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

const CLOUD_RUN_URL = "https://fix-it-detective-backend-298932670545.us-central1.run.app";

// Create Google Auth client for service account authentication
const auth = new GoogleAuth();

/**
 * Firebase Functions v2 proxy to forward requests to private Cloud Run service
 * Authenticates with service account and forwards Firebase ID tokens for user context
 */
export const api = onRequest(
  {
    cors: true, // Enable CORS for all origins during development
    region: "us-central1"
  },
  async (req, res) => {
    try {
      // Extract the path from the request (everything after /api)
      const path = req.url || "/";
      logger.info(`Proxying request to Cloud Run: ${req.method} ${path}`, {
        url: req.url,
        method: req.method,
        headers: req.headers
      });

      // Get service account token for authenticating with Cloud Run
      const client = await auth.getIdTokenClient(CLOUD_RUN_URL);
      const serviceAccountToken = await client.idTokenProvider.fetchIdToken(CLOUD_RUN_URL);

      // Forward the Firebase ID token if present for user authentication
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceAccountToken}`, // Service account for Cloud Run access
      };

      // Forward Firebase ID token as a custom header for user context
      const firebaseAuth = req.headers.authorization;
      if (firebaseAuth) {
        headers["X-Firebase-Auth"] = firebaseAuth;
      }

      // Forward other relevant headers
      if (req.headers["content-type"]) {
        headers["Content-Type"] = req.headers["content-type"] as string;
      }

      // Make request to Cloud Run
      const cloudRunResponse = await fetch(`${CLOUD_RUN_URL}${path}`, {
        method: req.method,
        headers,
        body: req.method !== "GET" && req.method !== "HEAD" ? JSON.stringify(req.body) : undefined,
      });

      // Forward response status
      res.status(cloudRunResponse.status);

      // Forward response headers (excluding some that could cause issues)
      const excludeHeaders = new Set([
        "content-encoding",
        "content-length",
        "transfer-encoding",
        "connection",
        "server"
      ]);

      cloudRunResponse.headers.forEach((value, key) => {
        if (!excludeHeaders.has(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      });

      // Forward response body
      const responseData = await cloudRunResponse.text();

      // Try to parse as JSON, otherwise send as text
      try {
        const jsonData = JSON.parse(responseData);
        res.json(jsonData);
      } catch {
        res.send(responseData);
      }

    } catch (error) {
      logger.error("Error proxying request to Cloud Run:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  }
);

/**
 * Analyze diagnostic data using Firebase Vertex AI
 * Replaces Supabase Edge Function with Firestore
 */
export const analyzeDiagnostic = onRequest(
  {
    cors: true,
    region: "us-central1",
    memory: "2GiB",
    timeoutSeconds: 540
  },
  async (req, res) => {
    logger.info('=== DIAGNOSTIC ANALYSIS FUNCTION STARTED ===');

    try {
      const { submissionId, diagnosticData } = req.body;
      logger.info('Received diagnostic analysis request:', { submissionId, hasData: !!diagnosticData });

      if (!submissionId || !diagnosticData) {
        throw new Error('submissionId and diagnosticData are required');
      }

      // Initialize Vertex AI via REST API
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'diagnostic-pro-prod';
      const location = 'us-central1';

      // Create Google Auth client for Vertex AI
      const authClient = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
      });

      logger.info('Vertex AI initialized, proceeding with analysis...');

      // Prepare comprehensive diagnostic prompt (same 12-section structure)
      const prompt = `You are DiagnosticPro's MASTER TECHNICIAN. Use ALL the diagnostic data provided to give the most accurate analysis possible.

CUSTOMER DATA PROVIDED:
- Vehicle: ${diagnosticData.make || 'Not specified'} ${diagnosticData.model || 'Not specified'} ${diagnosticData.year || 'Not specified'}
- Equipment Type: ${diagnosticData.equipmentType || 'Not specified'}
- Problem: ${diagnosticData.problemDescription || 'None provided'}
- Error Codes: ${diagnosticData.errorCodes || 'None provided'}
- Shop Quote: ${diagnosticData.shopQuoteAmount ? `$${diagnosticData.shopQuoteAmount}` : 'Not provided'}

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

      logger.info('Calling Vertex AI REST API...');

      // Get access token
      const accessToken = await authClient.getAccessToken();

      // Call Vertex AI Gemini API
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

      // Save to Firestore (orders collection)
      const db = admin.firestore();
      await db.collection('orders').doc(submissionId).update({
        analysisCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
        analysis: analysis,
        processingStatus: 'completed'
      });

      logger.info('Analysis saved to Firestore for submission:', submissionId);

      res.json({
        success: true,
        analysis,
        submissionId
      });

    } catch (error) {
      logger.error('Error in analyze-diagnostic:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Check Cloud Function logs for more information'
      });
    }
  }
);

/**
 * Health check endpoint for the Functions proxy
 */
export const health = onRequest(
  { region: "us-central1" },
  async (req, res) => {
    res.json({
      status: "healthy",
      service: "firebase-functions-proxy",
      cloudRun: CLOUD_RUN_URL,
      timestamp: new Date().toISOString()
    });
  }
);

// Export Stripe webhook
export { stripeWebhook } from './stripe-webhook';