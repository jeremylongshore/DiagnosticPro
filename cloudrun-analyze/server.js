import express from "express";
const app = express();
app.use(express.json());
app.post("/analyzeDiagnostic", async (req, res) => {
  const { submissionId, diagnosticData } = req.body || {};
  if (!submissionId || !diagnosticData) return res.status(400).json({ error: "missing inputs" });
  // TEMP placeholder to keep UX unblocked
  res.json({ ok: true, path: `reports/${submissionId}.json`, temp: true });
});
app.listen(process.env.PORT || 8080);
