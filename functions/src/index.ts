import * as admin from "firebase-admin";
import { onRequest, onCall } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { VertexAI } from "@google-cloud/vertexai";

if (!admin.apps.length) admin.initializeApp();

const REGION = "us-east1";

/** POST /stripeWebhook
 * Body must include: data.object.metadata.submissionId
 * Action: mark submission as paid
 */
export const stripeWebhook = onRequest({ region: REGION, invoker: "public" }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  const submissionId = req.body?.data?.object?.metadata?.submissionId;
  if (!submissionId) {
    res.status(400).json({ error: "missing submissionId" });
    return;
  }
  const db = getFirestore();
  await db.collection("submissions").doc(submissionId).set(
    { status: "paid", updatedAt: Date.now() },
    { merge: true }
  );
  res.json({ ok: true });
});

/** POST /analyzeDiagnostic
 * Body: { submissionId: string, diagnosticData: { make: string, problemDescription: string, ... } }
 * Action: call Vertex Gemini to generate analysis, persist to Firestore and Storage
 */
export const analyzeDiagnostic = onRequest({ region: REGION, invoker: "public" }, async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  const { submissionId, diagnosticData } = req.body || {};
  if (!submissionId || !diagnosticData) {
    res.status(400).json({ error: "missing inputs" });
    return;
  }

  const db = getFirestore();
  const project = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  const location = "us-east1";
  const vertex = new VertexAI({ project, location });
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
  const text = result.response?.candidates?.[0]?.content?.parts?.map(p => (p as any).text || "").join("\n") || "No analysis";

  const analysis = {
    submissionId,
    summary: text,
    model: "gemini-1.5-flash-002",
    createdAt: Date.now()
  };

  await db.collection("analysis").doc(submissionId).set(analysis, { merge: true });

  const storage = getStorage().bucket();
  const path = `reports/${submissionId}.json`;
  await storage.file(path).save(JSON.stringify(analysis, null, 2), { contentType: "application/json" });

  res.json({ ok: true, path });
});

/** Callable: getDownloadUrl({ submissionId }) -> { url } */
export const getDownloadUrl = onCall({ region: REGION }, async (request) => {
  const submissionId = (request.data?.submissionId as string) || "";
  if (!submissionId) throw new Error("missing submissionId");
  const [url] = await getStorage().bucket().file(`reports/${submissionId}.json`)
    .getSignedUrl({ action: "read", expires: Date.now() + 15 * 60 * 1000 });
  return { url };
});