const express = require('express');
const { GoogleAuth } = require('google-auth-library');

const app = express();
const port = process.env.PORT || 8080;
const CLOUD_RUN_URL = 'https://fix-it-detective-backend-298932670545.us-central1.run.app';

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'simple-proxy',
    target: CLOUD_RUN_URL,
    timestamp: new Date().toISOString()
  });
});

// Proxy all other requests
app.all('*', async (req, res) => {
  try {
    console.log(`Proxying: ${req.method} ${req.url}`);

    // Get service account token for Cloud Run authentication
    const auth = new GoogleAuth();
    const client = await auth.getIdTokenClient(CLOUD_RUN_URL);
    const headers = await client.getRequestHeaders();

    // Add Firebase ID token from request if present
    if (req.headers.authorization) {
      headers['X-Firebase-Auth'] = req.headers.authorization;
    }

    // Add content type
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    // Proxy request to Cloud Run
    const response = await fetch(`${CLOUD_RUN_URL}${req.url}`, {
      method: req.method,
      headers,
      body: req.method !== 'GET' && req.method !== 'HEAD' ?
        JSON.stringify(req.body) : undefined
    });

    console.log(`Response: ${response.status} ${response.statusText}`);

    // Forward response status
    res.status(response.status);

    // Forward response headers (except problematic ones)
    for (const [key, value] of response.headers.entries()) {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        res.set(key, value);
      }
    }

    // Forward response body
    const responseText = await response.text();
    res.send(responseText);

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Proxy error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(port, () => {
  console.log(`Simple proxy listening on port ${port}`);
  console.log(`Proxying to: ${CLOUD_RUN_URL}`);
});