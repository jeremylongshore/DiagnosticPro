"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.health = exports.api = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebase_functions_1 = require("firebase-functions");
const google_auth_library_1 = require("google-auth-library");
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
const CLOUD_RUN_URL = "https://fix-it-detective-backend-298932670545.us-central1.run.app";
// Create Google Auth client for service account authentication
const auth = new google_auth_library_1.GoogleAuth();
/**
 * Firebase Functions v2 proxy to forward requests to private Cloud Run service
 * Authenticates with service account and forwards Firebase ID tokens for user context
 */
exports.api = (0, https_1.onRequest)({
    cors: true, // Enable CORS for all origins during development
    region: "us-central1"
}, async (req, res) => {
    try {
        // Extract the path from the request (everything after /api)
        const path = req.url || "/";
        firebase_functions_1.logger.info(`Proxying request to Cloud Run: ${req.method} ${path}`, {
            url: req.url,
            method: req.method,
            headers: req.headers
        });
        // Get service account token for authenticating with Cloud Run
        const client = await auth.getIdTokenClient(CLOUD_RUN_URL);
        const serviceAccountToken = await client.idTokenProvider.fetchIdToken(CLOUD_RUN_URL);
        // Forward the Firebase ID token if present for user authentication
        const headers = {
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
            headers["Content-Type"] = req.headers["content-type"];
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
        }
        catch (_a) {
            res.send(responseData);
        }
    }
    catch (error) {
        firebase_functions_1.logger.error("Error proxying request to Cloud Run:", error);
        res.status(500).json({
            error: "Internal server error",
            message: error instanceof Error ? error.message : "Unknown error"
        });
    }
});
/**
 * Health check endpoint for the Functions proxy
 */
exports.health = (0, https_1.onRequest)({ region: "us-central1" }, async (req, res) => {
    res.json({
        status: "healthy",
        service: "firebase-functions-proxy",
        cloudRun: CLOUD_RUN_URL,
        timestamp: new Date().toISOString()
    });
});
//# sourceMappingURL=index.js.map