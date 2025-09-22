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