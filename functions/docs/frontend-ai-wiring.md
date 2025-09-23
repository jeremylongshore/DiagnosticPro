# Frontend AI wiring
- POST analysis: fetch(import.meta.env.VITE_ANALYZE_URL, { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ submissionId, diagnosticData }) })
- Get signed URL: use Firebase Functions callable `getDownloadUrl` in region us-east1
  ```ts
  import { getFunctions, httpsCallable } from "firebase/functions";
  const fn = httpsCallable(getFunctions(undefined, "us-east1"), "getDownloadUrl");
  const { data } = await fn({ submissionId });
  const url = (data as any).url;
  ```
