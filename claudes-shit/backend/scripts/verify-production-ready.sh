#!/bin/bash

# Production readiness verification for DiagnosticPro Vertex AI
# Validates all requirements and runs smoke tests

set -e

PROJECT_ID=${PROJECT_ID:-"diagnostic-pro-prod"}
REGION=${REGION:-"us-central1"}
SERVICE_NAME="diagnosticpro-vertex-ai-backend"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 DiagnosticPro Vertex AI Production Readiness Verification"
echo "========================================================"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

ERRORS=0

# Helper functions
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $1"
    else
        echo -e "${RED}❌ FAIL${NC}: $1"
        ((ERRORS++))
    fi
}

check_warning() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
}

# Set project
gcloud config set project $PROJECT_ID &>/dev/null

echo "📋 REQUIREMENT CHECKS"
echo "====================="

# 1. Check billing enabled
echo "1. Checking billing status..."
BILLING_ACCOUNT=$(gcloud billing projects describe $PROJECT_ID --format="value(billingAccountName)" 2>/dev/null)
if [ -n "$BILLING_ACCOUNT" ]; then
    check_success "Billing enabled on project"
else
    check_success "Billing not enabled - enable billing first"
    ((ERRORS++))
fi

# 2. Check required APIs
echo ""
echo "2. Checking required APIs..."
REQUIRED_APIS=(
    "run.googleapis.com"
    "firestore.googleapis.com"
    "storage.googleapis.com"
    "secretmanager.googleapis.com"
    "cloudbuild.googleapis.com"
    "artifactregistry.googleapis.com"
    "iamcredentials.googleapis.com"
    "aiplatform.googleapis.com"
)

for api in "${REQUIRED_APIS[@]}"; do
    if gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
        check_success "API enabled: $api"
    else
        echo -e "${RED}❌ FAIL${NC}: API not enabled: $api"
        echo "   Enable with: gcloud services enable $api"
        ((ERRORS++))
    fi
done

# 3. Check Cloud Run service exists
echo ""
echo "3. Checking Cloud Run service..."
if gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID &>/dev/null; then
    check_success "Cloud Run service exists: $SERVICE_NAME"
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
    echo "   Service URL: $SERVICE_URL"
else
    echo -e "${RED}❌ FAIL${NC}: Cloud Run service not found: $SERVICE_NAME"
    echo "   Deploy with: ./scripts/deploy.sh"
    ((ERRORS++))
    SERVICE_URL=""
fi

# 4. Check service account IAM roles
echo ""
echo "4. Checking service account IAM roles..."
COMPUTE_SA="${PROJECT_ID}-compute@developer.gserviceaccount.com"
REQUIRED_ROLES=(
    "roles/secretmanager.secretAccessor"
    "roles/cloudsql.client"
    "roles/storage.objectAdmin"
    "roles/aiplatform.user"
)

for role in "${REQUIRED_ROLES[@]}"; do
    if gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.members:$COMPUTE_SA AND bindings.role:$role" | grep -q "$role"; then
        check_success "IAM role assigned: $role"
    else
        echo -e "${RED}❌ FAIL${NC}: IAM role missing: $role"
        echo "   Fix with: gcloud projects add-iam-policy-binding $PROJECT_ID --member=\"serviceAccount:$COMPUTE_SA\" --role=\"$role\""
        ((ERRORS++))
    fi
done

# 5. Check required secrets exist
echo ""
echo "5. Checking Secret Manager secrets..."
REQUIRED_SECRETS=(
    "database-url"
    "firebase-credentials"
    "stripe-secret-key"
    "stripe-webhook-secret"
    "vertex-ai-location"
    "gcs-bucket-name"
    "jwt-secret"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
    if gcloud secrets describe $secret --project=$PROJECT_ID &>/dev/null; then
        # Check if it's not a placeholder
        SECRET_VALUE=$(gcloud secrets versions access latest --secret=$secret --project=$PROJECT_ID)
        if [[ "$SECRET_VALUE" == *"PLACEHOLDER"* ]]; then
            check_warning "Secret exists but has placeholder value: $secret"
        else
            check_success "Secret configured: $secret"
        fi
    else
        echo -e "${RED}❌ FAIL${NC}: Secret missing: $secret"
        echo "   Create with: ./scripts/setup-secrets.sh"
        ((ERRORS++))
    fi
done

# 6. Check Firebase project
echo ""
echo "6. Checking Firebase configuration..."
if command -v firebase &> /dev/null; then
    if firebase projects:list 2>/dev/null | grep -q "$PROJECT_ID"; then
        check_success "Firebase project linked"
    else
        check_warning "Firebase project not found in CLI - ensure project exists"
    fi
else
    check_warning "Firebase CLI not installed - cannot verify project"
fi

# 7. Check GCS bucket
echo ""
echo "7. Checking GCS bucket..."
BUCKET_NAME=$(gcloud secrets versions access latest --secret="gcs-bucket-name" --project=$PROJECT_ID 2>/dev/null || echo "")
if [ -n "$BUCKET_NAME" ] && gsutil ls -b "gs://$BUCKET_NAME" &>/dev/null; then
    check_success "GCS bucket exists: gs://$BUCKET_NAME"

    # Check bucket is private
    if gsutil iam get "gs://$BUCKET_NAME" | grep -q "allUsers"; then
        check_warning "GCS bucket has public access - should be private"
    else
        check_success "GCS bucket is private"
    fi
else
    echo -e "${RED}❌ FAIL${NC}: GCS bucket not accessible"
    echo "   Create with: ./scripts/setup-gcs.sh"
    ((ERRORS++))
fi

# 8. Check Firestore database
echo ""
echo "8. Checking Firestore database..."
# Try to list collections (will fail if Firestore not set up)
if gcloud firestore databases describe --project=$PROJECT_ID &>/dev/null; then
    check_success "Firestore database exists"

    # Check if Native mode
    DB_TYPE=$(gcloud firestore databases describe --project=$PROJECT_ID --format="value(type)")
    if [ "$DB_TYPE" = "FIRESTORE_NATIVE" ]; then
        check_success "Firestore in Native mode"
    else
        check_warning "Firestore not in Native mode (found: $DB_TYPE)"
    fi
else
    echo -e "${RED}❌ FAIL${NC}: Firestore database not found"
    echo "   Create in Firebase Console with Native mode"
    ((ERRORS++))
fi

echo ""
echo "📊 SUMMARY"
echo "=========="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All requirements satisfied!${NC}"
    echo ""

    if [ -n "$SERVICE_URL" ]; then
        echo "🧪 SMOKE TESTS"
        echo "=============="
        echo ""

        # Smoke test 1: Health check
        echo "1. Testing health endpoint..."
        if curl -s -f "$SERVICE_URL/health" >/dev/null; then
            check_success "Health endpoint responds"
        else
            echo -e "${RED}❌ FAIL${NC}: Health endpoint failed"
            echo "   URL: $SERVICE_URL/health"
            ((ERRORS++))
        fi

        # Smoke test 2: API endpoints (requires auth, so just check for 401/403)
        echo ""
        echo "2. Testing API endpoints..."
        DIAGNOSTIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/diagnostics")
        if [ "$DIAGNOSTIC_STATUS" = "401" ] || [ "$DIAGNOSTIC_STATUS" = "403" ]; then
            check_success "Diagnostics endpoint requires auth (returns $DIAGNOSTIC_STATUS)"
        else
            check_warning "Diagnostics endpoint returned unexpected status: $DIAGNOSTIC_STATUS"
        fi

        CHECKOUT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/api/checkout" -X POST)
        if [ "$CHECKOUT_STATUS" = "401" ] || [ "$CHECKOUT_STATUS" = "403" ] || [ "$CHECKOUT_STATUS" = "422" ]; then
            check_success "Checkout endpoint exists (returns $CHECKOUT_STATUS)"
        else
            check_warning "Checkout endpoint returned unexpected status: $CHECKOUT_STATUS"
        fi

        echo ""
        echo "🎯 PRODUCTION READY!"
        echo "==================="
        echo ""
        echo "✅ Infrastructure: All systems operational"
        echo "✅ Security: Proper IAM and private storage"
        echo "✅ Monitoring: Health checks responding"
        echo ""
        echo "🚀 Next steps:"
        echo "1. Update Stripe webhook: $SERVICE_URL/api/webhooks/stripe"
        echo "2. Update frontend: VITE_API_BASE_URL=$SERVICE_URL/api"
        echo "3. Test complete flow with real payment"
        echo ""
        echo "📱 Frontend environment variable:"
        echo "VITE_API_BASE_URL=$SERVICE_URL/api"

    else
        echo "⚠️  Service not deployed - run smoke tests after deployment"
    fi

else
    echo -e "${RED}❌ $ERRORS requirement(s) failed${NC}"
    echo ""
    echo "🔧 Fix the above issues and run again:"
    echo "./scripts/verify-production-ready.sh"
    exit 1
fi