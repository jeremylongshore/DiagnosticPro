#!/bin/bash

# Quick deployment script for DiagnosticPro Vertex AI backend
# Runs all setup steps in sequence

set -e

PROJECT_ID=${PROJECT_ID:-"diagnostic-pro-prod"}
REGION=${REGION:-"us-central1"}

echo "🚀 Quick Deploy: DiagnosticPro Vertex AI Backend"
echo "================================================"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: gcloud is not authenticated"
    echo "Run: gcloud auth login"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

echo "📋 Deployment Plan:"
echo "1. Setup Google Secret Manager secrets"
echo "2. Create Cloud SQL database"
echo "3. Create Cloud Storage bucket"
echo "4. Deploy to Cloud Run"
echo "5. Run database migrations"
echo ""

read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "Step 1/5: Setting up secrets..."
echo "================================"
./scripts/setup-secrets.sh

echo ""
echo "Step 2/5: Creating database..."
echo "=============================="
./scripts/setup-database.sh

echo ""
echo "Step 3/5: Creating storage bucket..."
echo "===================================="
./scripts/setup-gcs.sh

echo ""
echo "Step 4/5: Deploying to Cloud Run..."
echo "===================================="
./scripts/deploy.sh

echo ""
echo "Step 5/5: Running migrations..."
echo "==============================="
./scripts/run-migrations.sh

# Get service URL
SERVICE_URL=$(gcloud run services describe diagnosticpro-vertex-ai-backend \
    --region $REGION \
    --project $PROJECT_ID \
    --format "value(status.url)")

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "🧪 Test your deployment:"
echo "curl $SERVICE_URL/health"
echo ""
echo "📝 Next steps:"
echo "1. Update Stripe webhook URL:"
echo "   $SERVICE_URL/api/webhooks/stripe"
echo ""
echo "2. Update frontend environment:"
echo "   VITE_API_BASE_URL=$SERVICE_URL/api"
echo ""
echo "3. Update secrets with real values:"
echo "   ./scripts/update-secrets.sh"
echo ""
echo "4. Monitor logs:"
echo "   gcloud run services logs tail diagnosticpro-vertex-ai-backend --region $REGION"
echo ""
echo "🔐 Remember to update these secrets:"
echo "- stripe-secret-key (your actual Stripe key)"
echo "- stripe-webhook-secret (from Stripe dashboard)"
echo "- vertex-ai-location (us-central1 for Gemini)"
echo "- firebase-credentials (service account JSON)"