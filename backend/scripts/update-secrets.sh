#!/bin/bash

# Update Google Secret Manager secrets with real values
# Run this after initial setup to replace placeholder values

set -e

PROJECT_ID=${PROJECT_ID:-"diagnostic-pro-prod"}

echo "🔐 Update Google Secret Manager secrets"
echo "========================================"
echo "Project: $PROJECT_ID"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: gcloud is not authenticated"
    echo "Run: gcloud auth login"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

echo "This script will help you update secrets with real values."
echo "Current secrets with placeholder values need to be updated:"
echo ""
echo "🔑 Required secrets to update:"
echo "1. stripe-secret-key"
echo "2. stripe-webhook-secret"
echo "3. vertex-ai-location"
echo "4. firebase-credentials"
echo ""

read -p "Continue with secret updates? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Secret update cancelled."
    exit 0
fi

# Function to update a secret from user input
update_secret() {
    local SECRET_NAME=$1
    local SECRET_DESCRIPTION=$2
    local SECRET_FORMAT=$3

    echo ""
    echo "Updating $SECRET_NAME..."
    echo "Description: $SECRET_DESCRIPTION"
    echo "Format: $SECRET_FORMAT"
    echo ""

    read -p "Enter the $SECRET_NAME: " -s SECRET_VALUE
    echo

    if [ -z "$SECRET_VALUE" ]; then
        echo "❌ Empty value provided. Skipping $SECRET_NAME."
        return
    fi

    echo "$SECRET_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$PROJECT_ID
    echo "✅ Updated $SECRET_NAME"
}

# Function to update a secret from file
update_secret_file() {
    local SECRET_NAME=$1
    local SECRET_DESCRIPTION=$2
    local FILE_EXAMPLE=$3

    echo ""
    echo "Updating $SECRET_NAME..."
    echo "Description: $SECRET_DESCRIPTION"
    echo "Example: $FILE_EXAMPLE"
    echo ""

    read -p "Enter the file path for $SECRET_NAME: " FILE_PATH

    if [ ! -f "$FILE_PATH" ]; then
        echo "❌ File not found: $FILE_PATH. Skipping $SECRET_NAME."
        return
    fi

    gcloud secrets versions add $SECRET_NAME --data-file="$FILE_PATH" --project=$PROJECT_ID
    echo "✅ Updated $SECRET_NAME from $FILE_PATH"
}

# Update secrets
echo "🔑 Updating secrets..."

# Stripe secret key
update_secret "stripe-secret-key" \
    "Your Stripe secret key from dashboard" \
    "sk_live_... or sk_test_..."

# Stripe webhook secret
update_secret "stripe-webhook-secret" \
    "Webhook signing secret from Stripe dashboard" \
    "whsec_..."

# Vertex AI location
update_secret "vertex-ai-location" \
    "Vertex AI region for Gemini" \
    "us-central1"

# Firebase credentials (file-based)
update_secret_file "firebase-credentials" \
    "Firebase service account JSON file" \
    "/path/to/service-account.json"

echo ""
echo "✅ Secret updates complete!"
echo ""
echo "🔍 Verify secrets were updated:"
echo "gcloud secrets versions list stripe-secret-key --project=$PROJECT_ID"
echo "gcloud secrets versions list stripe-webhook-secret --project=$PROJECT_ID"
echo "gcloud secrets versions list vertex-ai-location --project=$PROJECT_ID"
echo "gcloud secrets versions list firebase-credentials --project=$PROJECT_ID"
echo ""
echo "🚀 Redeploy Cloud Run service to use new secrets:"
echo "./scripts/deploy.sh"
echo ""
echo "⚠️  Important: Update your Stripe webhook endpoint to:"
SERVICE_URL=$(gcloud run services describe diagnosticpro-vertex-ai-backend \
    --region us-central1 \
    --project $PROJECT_ID \
    --format "value(status.url)" 2>/dev/null || echo "YOUR_SERVICE_URL")
echo "$SERVICE_URL/api/webhooks/stripe"