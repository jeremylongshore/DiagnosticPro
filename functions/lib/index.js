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
exports.getDownloadUrl = exports.analyzeDiagnostic = exports.stripeWebhook = void 0;
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
 * Action: mark submission as paid
 */
exports.stripeWebhook = (0, https_1.onRequest)({ region: REGION, invoker: "public" }, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const submissionId = req.body?.data?.object?.metadata?.submissionId;
    if (!submissionId) {
        res.status(400).json({ error: "missing submissionId" });
        return;
    }
    const db = (0, firestore_1.getFirestore)();
    await db.collection("submissions").doc(submissionId).set({ status: "paid", updatedAt: Date.now() }, { merge: true });
    res.json({ ok: true });
});
/** POST /analyzeDiagnostic
 * Body: { submissionId: string, diagnosticData: { make: string, problemDescription: string, ... } }
 * Action: call Vertex Gemini to generate analysis, persist to Firestore and Storage
 */
exports.analyzeDiagnostic = (0, https_1.onRequest)({ region: REGION, invoker: "public" }, async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    const { submissionId, diagnosticData } = req.body || {};
    if (!submissionId || !diagnosticData) {
        res.status(400).json({ error: "missing inputs" });
        return;
    }
    const db = (0, firestore_1.getFirestore)();
    const project = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
    const location = "us-east1";
    const vertex = new vertexai_1.VertexAI({ project, location });
    const model = vertex.getGenerativeModel({ model: "gemini-1.5-flash-002" });
    const prompt = [
        {
            role: "user",
            parts: [
                { text: `You are an automotive diagnostic assistant. Given vehicle info and a problem description, produce: 1) likely causes, 2) recommended tests with tools, 3) risk of misdiagnosis, 4) repair estimate range.` },
                { text: `Vehicle data: ${JSON.stringify(diagnosticData)}` }
            ]
        }
    ];
    const result = await model.generateContent({ contents: prompt });
    const text = result.response?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n") || "No analysis";
    const analysis = {
        submissionId,
        summary: text,
        model: "gemini-1.5-flash-002",
        createdAt: Date.now()
    };
    await db.collection("analysis").doc(submissionId).set(analysis, { merge: true });
    const storage = (0, storage_1.getStorage)().bucket();
    const path = `reports/${submissionId}.json`;
    await storage.file(path).save(JSON.stringify(analysis, null, 2), { contentType: "application/json" });
    res.json({ ok: true, path });
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
