const express = require('express');
const cors = require('cors');
const { GoogleAuth } = require('google-auth-library');

const app = express();
const port = process.env.PORT || 8080;
const CLOUD_RUN_URL = 'https://fix-it-detective-backend-298932670545.us-central1.run.app';

// Enable CORS for all origins
app.use(cors());

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'fix-it-detective-proxy' });
});

// Proxy all API requests
app.all('/api/*', async (req, res) => {
  try {
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
        (typeof req.body === 'string' ? req.body : JSON.stringify(req.body)) :
        undefined
    });

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

// Catch all other routes
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

app.listen(port, () => {
  console.log(`Fix-It Detective Proxy listening on port ${port}`);
  console.log(`Proxying to: ${CLOUD_RUN_URL}`);
});