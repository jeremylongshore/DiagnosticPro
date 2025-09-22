#!/bin/bash

# Setup Google Secret Manager secrets for DiagnosticPro backend
# Run this script once before deploying to Cloud Run

set -e

PROJECT_ID=${PROJECT_ID:-"diagnostic-pro-prod"}
REGION=${REGION:-"us-central1"}

echo "🔒 Setting up Google Secret Manager secrets for project: $PROJECT_ID"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: gcloud is not authenticated"
    echo "Run: gcloud auth login"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📡 Enabling required APIs..."
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudsql.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable run.googleapis.com

# Create secrets with placeholder values
echo "🔐 Creating secrets..."

# Database URL for Cloud SQL
if ! gcloud secrets describe database-url --project=$PROJECT_ID &>/dev/null; then
    echo "Creating database-url secret..."
    echo "postgresql://user:password@/diagnostic_db?host=/cloudsql/$PROJECT_ID:$REGION:diagnostic-db" | \
    gcloud secrets create database-url --data-file=- --project=$PROJECT_ID
else
    echo "✅ database-url secret already exists"
fi

# Firebase credentials (service account JSON)
if ! gcloud secrets describe firebase-credentials --project=$PROJECT_ID &>/dev/null; then
    echo "Creating firebase-credentials secret..."
    echo "PLACEHOLDER_FIREBASE_SERVICE_ACCOUNT_JSON" | \
    gcloud secrets create firebase-credentials --data-file=- --project=$PROJECT_ID
    echo "⚠️  You need to update this with actual Firebase service account JSON"
else
    echo "✅ firebase-credentials secret already exists"
fi

# Stripe secret key
if ! gcloud secrets describe stripe-secret-key --project=$PROJECT_ID &>/dev/null; then
    echo "Creating stripe-secret-key secret..."
    echo "sk_test_PLACEHOLDER_STRIPE_SECRET_KEY" | \
    gcloud secrets create stripe-secret-key --data-file=- --project=$PROJECT_ID
    echo "⚠️  You need to update this with actual Stripe secret key"
else
    echo "✅ stripe-secret-key secret already exists"
fi

# Stripe webhook secret
if ! gcloud secrets describe stripe-webhook-secret --project=$PROJECT_ID &>/dev/null; then
    echo "Creating stripe-webhook-secret secret..."
    echo "whsec_PLACEHOLDER_WEBHOOK_SECRET" | \
    gcloud secrets create stripe-webhook-secret --data-file=- --project=$PROJECT_ID
    echo "⚠️  You need to update this with actual Stripe webhook secret"
else
    echo "✅ stripe-webhook-secret secret already exists"
fi

# Vertex AI credentials (uses Application Default Credentials)
# No secret needed - uses GCP service account authentication
echo "✅ Vertex AI Gemini authentication via Application Default Credentials"

# GCS bucket name for reports
if ! gcloud secrets describe gcs-bucket-name --project=$PROJECT_ID &>/dev/null; then
    echo "Creating gcs-bucket-name secret..."
    echo "$PROJECT_ID-diagnostic-reports" | \
    gcloud secrets create gcs-bucket-name --data-file=- --project=$PROJECT_ID
else
    echo "✅ gcs-bucket-name secret already exists"
fi

# JWT secret for session management
if ! gcloud secrets describe jwt-secret --project=$PROJECT_ID &>/dev/null; then
    echo "Creating jwt-secret secret..."
    openssl rand -base64 32 | \
    gcloud secrets create jwt-secret --data-file=- --project=$PROJECT_ID
else
    echo "✅ jwt-secret secret already exists"
fi

echo ""
echo "✅ Secret Manager setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update secrets with actual values:"
echo "   gcloud secrets versions add stripe-secret-key --data-file=stripe-key.txt"
echo "   gcloud secrets versions add stripe-webhook-secret --data-file=webhook-secret.txt"
echo "   # Vertex AI Gemini uses GCP service account - no API key needed"
echo "   gcloud secrets versions add firebase-credentials --data-file=service-account.json"
echo ""
echo "2. Create Cloud SQL database:"
echo "   ./scripts/setup-database.sh"
echo ""
echo "3. Create GCS bucket:"
echo "   gsutil mb gs://$PROJECT_ID-diagnostic-reports"
echo ""
echo "4. Deploy to Cloud Run:"
echo "   ./scripts/deploy.sh"