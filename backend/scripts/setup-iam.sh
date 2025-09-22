#!/bin/bash

# Setup IAM roles for Cloud Run service account
# Grants all required permissions for DiagnosticPro backend

set -e

PROJECT_ID=${PROJECT_ID:-"diagnostic-pro-prod"}

echo "🔐 Setting up IAM roles for Cloud Run service account"
echo "====================================================="
echo "Project: $PROJECT_ID"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: gcloud is not authenticated"
    echo "Run: gcloud auth login"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Get the default Compute Engine service account
COMPUTE_SA="${PROJECT_ID}-compute@developer.gserviceaccount.com"

echo "🤖 Service Account: $COMPUTE_SA"
echo ""

# Required IAM roles for the Cloud Run service
REQUIRED_ROLES=(
    "roles/secretmanager.secretAccessor"
    "roles/cloudsql.client"
    "roles/storage.objectAdmin"
    "roles/aiplatform.user"
    "roles/firestore.user"
    "roles/firebase.admin"
)

echo "📋 Granting required IAM roles..."

for role in "${REQUIRED_ROLES[@]}"; do
    echo "Granting $role..."

    # Check if role is already assigned
    if gcloud projects get-iam-policy $PROJECT_ID \
        --flatten="bindings[].members" \
        --format="table(bindings.role)" \
        --filter="bindings.members:$COMPUTE_SA AND bindings.role:$role" \
        | grep -q "$role"; then
        echo "✅ Already assigned: $role"
    else
        # Grant the role
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:$COMPUTE_SA" \
            --role="$role" \
            --quiet

        if [ $? -eq 0 ]; then
            echo "✅ Granted: $role"
        else
            echo "❌ Failed to grant: $role"
            exit 1
        fi
    fi
done

echo ""
echo "🔍 Verifying permissions..."

# Verify each role was granted
ALL_GRANTED=true
for role in "${REQUIRED_ROLES[@]}"; do
    if gcloud projects get-iam-policy $PROJECT_ID \
        --flatten="bindings[].members" \
        --format="table(bindings.role)" \
        --filter="bindings.members:$COMPUTE_SA AND bindings.role:$role" \
        | grep -q "$role"; then
        echo "✅ Verified: $role"
    else
        echo "❌ Missing: $role"
        ALL_GRANTED=false
    fi
done

if [ "$ALL_GRANTED" = true ]; then
    echo ""
    echo "✅ IAM setup complete!"
    echo ""
    echo "📝 Permissions granted to: $COMPUTE_SA"
    echo ""
    echo "🔐 Role summary:"
    echo "• secretmanager.secretAccessor - Access secrets for API keys, database URLs"
    echo "• cloudsql.client - Connect to Cloud SQL database"
    echo "• storage.objectAdmin - Read/write GCS bucket for reports"
    echo "• aiplatform.user - Access Vertex AI for diagnostic analysis"
    echo "• firestore.user - Read/write Firestore collections"
    echo "• firebase.admin - Verify Firebase ID tokens"
    echo ""
    echo "🚀 Cloud Run service can now access all required resources!"
else
    echo ""
    echo "❌ Some roles failed to assign. Check permissions and try again."
    exit 1
fi

echo ""
echo "🔄 Additional setup (if needed):"
echo ""
echo "1. Enable Application Default Credentials for Firebase Admin:"
echo "   gcloud auth application-default login"
echo ""
echo "2. Set up custom service account (optional):"
echo "   gcloud iam service-accounts create diagnosticpro-vertex-ai-sa"
echo "   # Then grant roles to the custom SA instead"
echo ""
echo "3. Verify Cloud Run deployment uses this service account:"
echo "   gcloud run services describe diagnosticpro-vertex-ai-backend --region us-central1"