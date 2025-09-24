# Google Secret Manager Setup for Firebase Deployment

**Date**: 2025-09-10  
**Purpose**: Configure Google Secret Manager for secure environment variable management

## Current Environment Variables (from .env)

Based on the existing Supabase setup, we need to migrate these to Google Secret Manager:

### Legacy Variables (Will be replaced)
```bash
VITE_SUPABASE_URL=https://jjxvrxehmawuyxltrvql.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-key
OPENAI_API_KEY=your-openai-key
```

### Unchanged Variables (Move to Secret Manager)
```bash
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
GMAIL_APP_PASSWORD=your-gmail-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

## Google Secret Manager Configuration

### 1. Enable Secret Manager API
```bash
gcloud services enable secretmanager.googleapis.com
```

### 2. Create Secrets for Unchanged Services

```bash
# Stripe secrets
gcloud secrets create stripe-secret-key --data-file=<(echo -n "your-stripe-secret-key")
gcloud secrets create stripe-webhook-secret --data-file=<(echo -n "your-webhook-secret")

# Email secrets
gcloud secrets create gmail-app-password --data-file=<(echo -n "your-gmail-app-password")
gcloud secrets create smtp-host --data-file=<(echo -n "smtp.gmail.com")
gcloud secrets create smtp-port --data-file=<(echo -n "587")

# Reports email
gcloud secrets create reports-email --data-file=<(echo -n "reports@diagnosticpro.io")
```

### 3. Create Firebase/Google Cloud Secrets

```bash
# Firebase configuration
gcloud secrets create firebase-project-id --data-file=<(echo -n "your-firebase-project-id")
gcloud secrets create firebase-api-key --data-file=<(echo -n "your-firebase-api-key")
gcloud secrets create firebase-auth-domain --data-file=<(echo -n "your-project.firebaseapp.com")

# Vertex AI configuration
gcloud secrets create vertex-ai-project-id --data-file=<(echo -n "your-project-id")
gcloud secrets create vertex-ai-location --data-file=<(echo -n "us-central1")

# BigQuery configuration
gcloud secrets create bigquery-project-id --data-file=<(echo -n "diagnostic-pro-start-up")
gcloud secrets create bigquery-dataset --data-file=<(echo -n "diagnosticpro_prod")
```

### 4. Service Account Permissions

```bash
# Create service account for Cloud Functions
gcloud iam service-accounts create diagnosticpro-functions \
    --description="Service account for DiagnosticPro Cloud Functions" \
    --display-name="DiagnosticPro Functions"

# Grant Secret Manager access
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:diagnosticpro-functions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

# Grant Firestore access
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:diagnosticpro-functions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/datastore.user"

# Grant Vertex AI access
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:diagnosticpro-functions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Grant BigQuery access
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:diagnosticpro-functions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/bigquery.dataEditor"
```

## Cloud Functions Environment Variables

### functions/analyze-diagnostic/.env (Cloud Functions)
```bash
# Access secrets in Cloud Functions
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
GMAIL_APP_PASSWORD=${GMAIL_APP_PASSWORD}
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
VERTEX_AI_PROJECT_ID=${VERTEX_AI_PROJECT_ID}
VERTEX_AI_LOCATION=${VERTEX_AI_LOCATION}
BIGQUERY_PROJECT_ID=${BIGQUERY_PROJECT_ID}
BIGQUERY_DATASET=${BIGQUERY_DATASET}
```

### Frontend Environment Variables (Public)
```javascript
// Firebase config (public - goes in frontend)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};
```

## Deployment Scripts

### deploy-secrets.sh
```bash
#!/bin/bash
# Deploy secrets to Google Secret Manager

echo "Deploying secrets to Google Secret Manager..."

# Check if gcloud is authenticated
gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -1

if [ $? -ne 0 ]; then
    echo "Please authenticate with gcloud first:"
    echo "gcloud auth login"
    exit 1
fi

# Set project
PROJECT_ID="your-firebase-project-id"
gcloud config set project $PROJECT_ID

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create secrets (prompt for values)
echo "Creating Stripe secrets..."
read -s -p "Enter Stripe Secret Key: " STRIPE_SECRET
gcloud secrets create stripe-secret-key --data-file=<(echo -n "$STRIPE_SECRET")

read -s -p "Enter Stripe Webhook Secret: " STRIPE_WEBHOOK
gcloud secrets create stripe-webhook-secret --data-file=<(echo -n "$STRIPE_WEBHOOK")

echo "Creating email secrets..."
read -s -p "Enter Gmail App Password: " GMAIL_PASSWORD
gcloud secrets create gmail-app-password --data-file=<(echo -n "$GMAIL_PASSWORD")

echo "Secrets deployed successfully!"
```

### Access Secrets in Cloud Functions
```javascript
// functions/shared/secrets.js
const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

async function getSecret(secretName) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  
  try {
    const [version] = await client.accessSecretVersion({name});
    return version.payload.data.toString();
  } catch (error) {
    console.error(`Error accessing secret ${secretName}:`, error);
    throw error;
  }
}

module.exports = {
  getStripeSecretKey: () => getSecret('stripe-secret-key'),
  getStripeWebhookSecret: () => getSecret('stripe-webhook-secret'),
  getGmailAppPassword: () => getSecret('gmail-app-password'),
  getVertexAiProjectId: () => getSecret('vertex-ai-project-id'),
  getBigQueryProjectId: () => getSecret('bigquery-project-id'),
};
```

## Security Best Practices

### 1. Secret Rotation
```bash
# Update secret with new version
gcloud secrets versions add stripe-secret-key --data-file=<(echo -n "new-secret-value")

# Disable old version
gcloud secrets versions disable 1 --secret="stripe-secret-key"
```

### 2. Access Control
```bash
# Grant specific function access to specific secrets
gcloud secrets add-iam-policy-binding stripe-secret-key \
    --member="serviceAccount:diagnosticpro-functions@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### 3. Audit Logging
```bash
# Enable audit logs for Secret Manager
gcloud logging sinks create secret-manager-audit \
    bigquery.googleapis.com/projects/PROJECT_ID/datasets/audit_logs \
    --log-filter='protoPayload.serviceName="secretmanager.googleapis.com"'
```

## Integration with Firebase Functions

### functions/package.json
```json
{
  "dependencies": {
    "@google-cloud/secret-manager": "^5.0.0",
    "@google-cloud/firestore": "^7.0.0",
    "@google-cloud/aiplatform": "^3.0.0",
    "@google-cloud/bigquery": "^7.0.0",
    "stripe": "^latest",
    "nodemailer": "^latest"
  }
}
```

### functions/index.js
```javascript
const {getStripeSecretKey, getGmailAppPassword} = require('./shared/secrets');

exports.analyzeSubmission = async (req, res) => {
  // Access secrets at runtime
  const stripeKey = await getStripeSecretKey();
  const gmailPassword = await getGmailAppPassword();
  
  // Use secrets in function logic
  const stripe = require('stripe')(stripeKey);
  // ... rest of function
};
```

## Verification Commands

```bash
# List all secrets
gcloud secrets list

# Get secret versions
gcloud secrets versions list stripe-secret-key

# Test secret access
gcloud secrets versions access latest --secret="stripe-secret-key"

# Check IAM permissions
gcloud secrets get-iam-policy stripe-secret-key
```

## Deployment Checklist

- [ ] Enable Secret Manager API
- [ ] Create all required secrets
- [ ] Set up service account with proper permissions
- [ ] Test secret access from Cloud Functions
- [ ] Update function code to use Secret Manager
- [ ] Deploy and test end-to-end
- [ ] Remove any hardcoded secrets from code

---

**Next Steps**: Run the deployment script during Thursday morning setup to have all secrets ready for the Firebase deployment.

**Date**: 2025-09-10