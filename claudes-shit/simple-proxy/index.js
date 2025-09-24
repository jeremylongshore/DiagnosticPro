const functions = require('@google-cloud/functions-framework');
const { GoogleAuth } = require('google-auth-library');

const CLOUD_RUN_URL = 'https://fix-it-detective-backend-298932670545.us-central1.run.app';

// Register HTTP function
functions.http('proxy', async (req, res) => {
  try {
    // Enable CORS
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.status(200).send('');
      return;
    }

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