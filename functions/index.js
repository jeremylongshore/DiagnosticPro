import functions from "@google-cloud/functions-framework";

const RUN_BASE = process.env.RUN_BASE; // Cloud Run base URL
if (!RUN_BASE) throw new Error("RUN_BASE env var required");

const allowCORS = (req, res) => {
  res.set("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Authorization,Content-Type");
  res.set("Vary", "Origin");
};

functions.http("proxy", async (req, res) => {
  try {
    allowCORS(req, res);
    if (req.method === "OPTIONS") return res.status(204).end();

    const url = new URL(req.url, RUN_BASE);
    const headers = new Headers();
    if (req.headers.authorization) headers.set("authorization", req.headers.authorization);
    if (req.headers["content-type"]) headers.set("content-type", req.headers["content-type"]);

    const hasBody = !["GET","HEAD"].includes(req.method);
    const body = hasBody ? req.rawBody : undefined;

    const r = await fetch(url.toString(), {
      method: req.method,
      headers,
      body,
      redirect: "manual",
    });

    res.status(r.status);
    r.headers.forEach((v,k) => {
      if (k.toLowerCase() === "transfer-encoding") return;
      res.set(k,v);
    });

    const buf = Buffer.from(await r.arrayBuffer());
    return res.end(buf);
  } catch (e) {
    console.error(e);
    return res.status(502).json({ error: "proxy_failed", detail: String(e) });
  }
});