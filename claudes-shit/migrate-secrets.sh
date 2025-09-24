#!/bin/bash

# Migrate secrets from Supabase environment to Google Secret Manager
# This script extracts existing keys and updates GCP secrets automatically

set -e

export PATH="/home/jeremy/google-cloud-sdk/bin:$PATH"
PROJECT_ID="diagnostic-pro-prod"

echo "🔐 Migrating secrets from Supabase to Google Secret Manager"
echo "=========================================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "Please ensure you're in the project directory with your .env file"
    exit 1
fi

# Source the .env file to get current values
set -a  # automatically export all variables
source .env
set +a

echo "📋 Found environment variables, migrating to Secret Manager..."

# Function to update secret if environment variable exists
update_secret_from_env() {
    local SECRET_NAME=$1
    local ENV_VAR_NAME=$2
    local ENV_VALUE=${!ENV_VAR_NAME}  # Get value of variable named by ENV_VAR_NAME

    if [ -n "$ENV_VALUE" ] && [ "$ENV_VALUE" != "your-"* ] && [ "$ENV_VALUE" != "REPLACE" ]; then
        echo "✅ Updating $SECRET_NAME from $ENV_VAR_NAME"
        echo "$ENV_VALUE" | gcloud secrets versions add $SECRET_NAME --data-file=- --project=$PROJECT_ID
    else
        echo "⚠️  Skipping $SECRET_NAME - no valid value found in $ENV_VAR_NAME"
    fi
}

# Migrate Stripe keys
echo ""
echo "💳 Migrating Stripe keys..."
update_secret_from_env "stripe-secret-key" "STRIPE_SECRET_KEY"
update_secret_from_env "stripe-webhook-secret" "STRIPE_WEBHOOK_SECRET"

# Check for alternative Stripe env var names
if [ -z "$STRIPE_SECRET_KEY" ] && [ -n "$VITE_STRIPE_SECRET_KEY" ]; then
    update_secret_from_env "stripe-secret-key" "VITE_STRIPE_SECRET_KEY"
fi

# Migrate OpenAI key (will be replaced by Vertex AI but useful for transition)
echo ""
echo "🤖 Checking for OpenAI key..."
update_secret_from_env "openai-api-key" "OPENAI_API_KEY"

# Check for Supabase keys (for reference/transition)
echo ""
echo "📊 Checking Supabase configuration..."
if [ -n "$VITE_SUPABASE_URL" ]; then
    echo "📍 Found Supabase URL: $VITE_SUPABASE_URL"
fi

if [ -n "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
    echo "🔑 Found Supabase publishable key (anon key)"
fi

if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "🔐 Found Supabase service role key"
fi

# Check for Gmail/SMTP credentials
echo ""
echo "📧 Checking email configuration..."
if [ -n "$GMAIL_APP_PASSWORD" ]; then
    echo "📬 Found Gmail app password"
    echo "Note: Email delivery will be replaced by direct downloads in new architecture"
fi

# Firebase configuration
echo ""
echo "🔥 Checking Firebase configuration..."
if [ -n "$FIREBASE_CONFIG" ]; then
    echo "🔧 Found Firebase config"
fi

# Check for any other API keys
echo ""
echo "🔍 Checking for other API keys..."
env | grep -i "api.*key\|secret\|token" | grep -v "SUPABASE\|STRIPE\|OPENAI\|GMAIL" | head -5

echo ""
echo "✅ Secret migration complete!"
echo ""
echo "📝 Summary:"
echo "- Stripe keys: Migrated to Secret Manager"
echo "- OpenAI key: Available for transition period"
echo "- Supabase: Will be replaced by Firestore"
echo "- Email: Will be replaced by direct downloads"
echo ""
echo "🚀 Next steps:"
echo "1. Verify secrets: gcloud secrets list --project=$PROJECT_ID"
echo "2. Complete Cloud Run deployment"
echo "3. Update Stripe webhook to new Cloud Run URL"
echo "4. Test end-to-end flow with real keys"
echo ""
echo "🔗 Check deployment status:"
echo "gcloud builds list --limit=1 --project=$PROJECT_ID"