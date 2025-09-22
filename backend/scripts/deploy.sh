#!/bin/bash

# Deploy DiagnosticPro backend to Cloud Run
# This script builds and deploys the FastAPI backend

set -e

PROJECT_ID=${PROJECT_ID:-"diagnostic-pro-prod"}
REGION=${REGION:-"us-central1"}
SERVICE_NAME="diagnosticpro-vertex-ai-backend"

echo "🚀 Deploying DiagnosticPro Vertex AI backend to Cloud Run"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

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
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
echo "🔨 Building and deploying with Cloud Build..."
gcloud builds submit --config cloudbuild.yaml \
    --project $PROJECT_ID \
    --region $REGION

# Get the service URL
echo "🌐 Getting service URL..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region $REGION \
    --project $PROJECT_ID \
    --format "value(status.url)")

echo ""
echo "✅ Deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📝 Next steps:"
echo "1. Test the health endpoint: curl $SERVICE_URL/health"
echo "2. Update Stripe webhook URL: $SERVICE_URL/api/webhooks/stripe"
echo "3. Update frontend .env with API_BASE_URL=$SERVICE_URL/api"
echo ""
echo "🔧 Useful commands:"
echo "- View logs: gcloud run services logs tail $SERVICE_NAME --region $REGION"
echo "- Check status: gcloud run services describe $SERVICE_NAME --region $REGION"
echo "- List revisions: gcloud run revisions list --service $SERVICE_NAME --region $REGION"