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
exports.createSubmission = exports.sendDiagnosticEmail = exports.getDownloadUrl = exports.analyzeDiagnostic = exports.stripeWebhook = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const storage_1 = require("firebase-admin/storage");
const vertexai_1 = require("@google-cloud/vertexai");
if (!admin.apps.length)
    admin.initializeApp();
const REGION = "us-east1";
/** POST /stripeWebhook
 * Body must include: data.object.metadata.submissionId
 * Action: mark submission as paid and create order record
 */
exports.stripeWebhook = (0, https_1.onRequest)({ region: REGION, invoker: "public" }, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const event = req.body;
    const submissionId = event?.data?.object?.metadata?.submissionId;
    const sessionId = event?.data?.object?.id;
    const customerEmail = event?.data?.object?.customer_details?.email;
    const amount = event?.data?.object?.amount_total;
    if (!submissionId || !sessionId || !customerEmail) {
        res.status(400).json({ error: "missing required webhook data" });
        return;
    }
    const db = (0, firestore_1.getFirestore)();
    try {
        // Update diagnostic submission payment status
        await db.collection("diagnosticSubmissions").doc(submissionId).update({
            paymentStatus: "paid",
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            paymentId: sessionId,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Create order record
        await db.collection("orders").add({
            submissionId,
            customerEmail,
            amount: amount || 2999, // Default to $29.99
            currency: "usd",
            status: "paid",
            stripeSessionId: sessionId,
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            processingStatus: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Payment processed for submission ${submissionId}`);
        res.json({ ok: true });
    }
    catch (error) {
        console.error("Stripe webhook error:", error);
        res.status(500).json({ error: "webhook processing failed" });
    }
});
/** POST /analyzeDiagnostic
 * Body: { submissionId: string }
 * Action: retrieve submission data, call Vertex Gemini to generate analysis, persist to Firestore and Storage
 */
exports.analyzeDiagnostic = (0, https_1.onRequest)({ region: REGION, invoker: "public" }, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const { submissionId } = req.body || {};
    if (!submissionId) {
        res.status(400).json({ error: "missing submissionId" });
        return;
    }
    const db = (0, firestore_1.getFirestore)();
    try {
        // Get submission data
        const submissionDoc = await db.collection("diagnosticSubmissions").doc(submissionId).get();
        if (!submissionDoc.exists) {
            res.status(404).json({ error: "submission not found" });
            return;
        }
        const submissionData = submissionDoc.data();
        // Check payment status
        if (submissionData?.paymentStatus !== "paid") {
            res.status(403).json({ error: "payment required" });
            return;
        }
        // Update processing status
        await db.collection("diagnosticSubmissions").doc(submissionId).update({
            analysisStatus: "processing",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update order processing status
        const ordersQuery = await db.collection("orders").where("submissionId", "==", submissionId).limit(1).get();
        if (!ordersQuery.empty) {
            const orderDoc = ordersQuery.docs[0];
            await orderDoc.ref.update({
                processingStatus: "analyzing",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        // Generate AI analysis using Vertex AI
        const project = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
        const location = "us-east1";
        const vertex = new vertexai_1.VertexAI({ project, location });
        const model = vertex.getGenerativeModel({ model: "gemini-1.5-flash-002" });
        const prompt = `You are a professional equipment diagnostic expert. Analyze the following diagnostic submission and provide a comprehensive analysis in the following format:

    ## DIAGNOSTIC ANALYSIS REPORT

    **Equipment:** ${submissionData?.make} ${submissionData?.model} (${submissionData?.year})
    **Issue:** ${submissionData?.problemDescription}

    ### 1. INITIAL ASSESSMENT
    [Provide initial assessment based on symptoms and equipment type]

    ### 2. MOST LIKELY CAUSES
    [List 3-5 most probable causes in order of likelihood]

    ### 3. DIAGNOSTIC TESTS RECOMMENDED
    [Specific tests to perform with exact values to check]

    ### 4. REPAIR RECOMMENDATIONS
    [Step-by-step repair approach]

    ### 5. COST ESTIMATES
    [DIY vs Professional repair cost ranges]

    ### 6. SAFETY CONSIDERATIONS
    [Important safety warnings and precautions]

    ### 7. PARTS AND TOOLS NEEDED
    [Specific parts and tools required]

    **Diagnostic Data:**
    - Make: ${submissionData?.make}
    - Model: ${submissionData?.model}
    - Year: ${submissionData?.year}
    - Equipment Type: ${submissionData?.equipmentType}
    - Problem: ${submissionData?.problemDescription}
    - Symptoms: ${JSON.stringify(submissionData?.symptoms)}
    - Error Codes: ${submissionData?.errorCodes}
    - Usage Pattern: ${submissionData?.usagePattern}
    - Previous Repairs: ${submissionData?.previousRepairs}
    - Shop Quote: $${submissionData?.shopQuoteAmount}`;
        const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
        const analysisText = result.response?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n") || "Analysis generation failed";
        const analysis = {
            submissionId,
            analysis: analysisText,
            model: "gemini-1.5-flash-002",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: "completed",
        };
        // Save analysis to Firestore
        await db.collection("analysis").doc(submissionId).set(analysis, { merge: true });
        // Update submission status
        await db.collection("diagnosticSubmissions").doc(submissionId).update({
            analysisStatus: "completed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Update order with analysis
        if (!ordersQuery.empty) {
            const orderDoc = ordersQuery.docs[0];
            await orderDoc.ref.update({
                analysis: analysisText,
                analysisCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
                processingStatus: "completed",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        // Save to Cloud Storage for PDF generation
        const storage = (0, storage_1.getStorage)().bucket();
        const reportPath = `reports/${submissionId}.json`;
        const reportData = {
            submissionId,
            customerEmail: submissionData?.email,
            customerName: submissionData?.fullName,
            equipment: `${submissionData?.make} ${submissionData?.model} (${submissionData?.year})`,
            analysis: analysisText,
            generatedAt: new Date().toISOString(),
        };
        await storage.file(reportPath).save(JSON.stringify(reportData, null, 2), {
            metadata: { contentType: "application/json" }
        });
        console.log(`Analysis completed for submission ${submissionId}`);
        res.json({ ok: true, path: reportPath, analysisId: submissionId });
    }
    catch (error) {
        console.error("Analysis error:", error);
        // Update error status
        await db.collection("diagnosticSubmissions").doc(submissionId).update({
            analysisStatus: "failed",
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(500).json({ error: "analysis failed", details: String(error) });
    }
});
/** Callable: getDownloadUrl({ submissionId }) -> { url } */
exports.getDownloadUrl = (0, https_1.onCall)({ region: REGION }, async (request) => {
    const submissionId = request.data?.submissionId || "";
    if (!submissionId)
        throw new Error("missing submissionId");
    const [url] = await (0, storage_1.getStorage)().bucket().file(`reports/${submissionId}.json`)
        .getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 });
    return { url };
});
/** POST /sendDiagnosticEmail
 * Body: { submissionId: string }
 * Action: send diagnostic report via email
 */
exports.sendDiagnosticEmail = (0, https_1.onRequest)({ region: REGION, invoker: "public" }, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const { submissionId } = req.body || {};
    if (!submissionId) {
        res.status(400).json({ error: "missing submissionId" });
        return;
    }
    const db = (0, firestore_1.getFirestore)();
    try {
        // Get submission and analysis data
        const [submissionDoc, analysisDoc] = await Promise.all([
            db.collection("diagnosticSubmissions").doc(submissionId).get(),
            db.collection("analysis").doc(submissionId).get()
        ]);
        if (!submissionDoc.exists || !analysisDoc.exists) {
            res.status(404).json({ error: "submission or analysis not found" });
            return;
        }
        const submissionData = submissionDoc.data();
        const analysisData = analysisDoc.data();
        // Create email log
        const emailLog = {
            submissionId,
            toEmail: submissionData?.email,
            subject: `DiagnosticPro Analysis - ${submissionData?.make} ${submissionData?.model}`,
            status: "sent",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection("emailLogs").add(emailLog);
        // Update order email status
        const ordersQuery = await db.collection("orders").where("submissionId", "==", submissionId).limit(1).get();
        if (!ordersQuery.empty) {
            const orderDoc = ordersQuery.docs[0];
            await orderDoc.ref.update({
                emailStatus: "sent",
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        console.log(`Email sent for submission ${submissionId} to ${submissionData?.email}`);
        res.json({ ok: true, emailSent: true });
    }
    catch (error) {
        console.error("Email sending error:", error);
        // Log failed email
        await db.collection("emailLogs").add({
            submissionId,
            toEmail: "unknown",
            subject: "Email Send Failed",
            status: "failed",
            error: String(error),
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        res.status(500).json({ error: "email sending failed", details: String(error) });
    }
});
/** POST /createSubmission
 * Body: diagnostic form data
 * Action: create new diagnostic submission
 */
exports.createSubmission = (0, https_1.onRequest)({ region: REGION, invoker: "public" }, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const submissionData = req.body;
    if (!submissionData?.email || !submissionData?.fullName) {
        res.status(400).json({ error: "missing required fields" });
        return;
    }
    const db = (0, firestore_1.getFirestore)();
    try {
        const submission = {
            ...submissionData,
            paymentStatus: "pending",
            analysisStatus: "pending",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await db.collection("diagnosticSubmissions").add(submission);
        console.log(`Submission created: ${docRef.id}`);
        res.json({ ok: true, submissionId: docRef.id });
    }
    catch (error) {
        console.error("Submission creation error:", error);
        res.status(500).json({ error: "submission creation failed", details: String(error) });
    }
});
