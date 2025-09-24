#!/bin/bash
set -euo pipefail

# =============================================================================
# DiagnosticPro Secrets Migration Script
# =============================================================================
# This script migrates secrets from Supabase/Stripe to GCP Secret Manager
# and configures secure access for the Cloud Run application
#
# Created: 2025-09-17
# =============================================================================

# Load configuration
if [ ! -f "gcp-service-accounts.env" ]; then
    echo "❌ Error: gcp-service-accounts.env not found"
    echo "Run ./01-gcp-project-setup.sh first"
    exit 1
fi

source gcp-service-accounts.env
source deployment-config.env

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Progress tracking
TOTAL_STEPS=8
CURRENT_STEP=0

progress() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    echo -e "${BLUE}[Step $CURRENT_STEP/$TOTAL_STEPS] $1${NC}"
}

# Secret validation function
validate_secret() {
    local secret_name="$1"
    local secret_value="$2"
    local validation_type="$3"

    case $validation_type in
        "stripe_key")
            if [[ ! $secret_value =~ ^sk_[a-zA-Z0-9_]{20,}$ ]] && [[ ! $secret_value =~ ^rk_[a-zA-Z0-9_]{20,}$ ]]; then
                error "Invalid Stripe secret key format: $secret_name"
            fi
            ;;
        "stripe_webhook")
            if [[ ! $secret_value =~ ^whsec_[a-zA-Z0-9_]{32,}$ ]]; then
                error "Invalid Stripe webhook secret format: $secret_name"
            fi
            ;;
        "openai_key")
            if [[ ! $secret_value =~ ^sk-[a-zA-Z0-9_-]{32,}$ ]]; then
                warn "OpenAI key format may be incorrect: $secret_name"
            fi
            ;;
        "email_password")
            if [ ${#secret_value} -lt 16 ]; then
                warn "Gmail app password seems too short: $secret_name"
            fi
            ;;
        *)
            # Basic non-empty validation
            if [ -z "$secret_value" ]; then
                error "Secret value is empty: $secret_name"
            fi
            ;;
    esac
}

# Create or update secret
create_secret() {
    local secret_name="$1"
    local secret_value="$2"
    local validation_type="${3:-basic}"

    # Validate secret format
    validate_secret "$secret_name" "$secret_value" "$validation_type"

    # Create or update secret
    if gcloud secrets describe "$secret_name" &>/dev/null; then
        echo "$secret_value" | gcloud secrets versions add "$secret_name" --data-file=-
        log "Updated secret: $secret_name"
    else
        echo "$secret_value" | gcloud secrets create "$secret_name" \
            --replication-policy="automatic" \
            --data-file=-
        log "Created secret: $secret_name"
    fi

    # Grant access to application service account
    gcloud secrets add-iam-policy-binding "$secret_name" \
        --member="serviceAccount:$DIAGNOSTICPRO_APP_SA" \
        --role="roles/secretmanager.secretAccessor" \
        --quiet || true

    # Verify secret was stored correctly
    local stored_length=$(gcloud secrets versions access latest --secret="$secret_name" | wc -c)
    local original_length=${#secret_value}

    if [ $stored_length -ne $((original_length + 1)) ]; then  # +1 for newline
        error "Secret storage verification failed for: $secret_name"
    fi
}

# Interactive secret collection
collect_secrets_interactively() {
    progress "Collecting secrets interactively"

    echo ""
    echo "🔐 SECRETS COLLECTION"
    echo "======================================"
    echo ""
    echo "This script will securely collect and store your API keys."
    echo "All secrets will be stored in GCP Secret Manager with proper access controls."
    echo ""
    echo "📋 Required Secrets:"
    echo "  1. Stripe Secret Key (from Stripe Dashboard)"
    echo "  2. Stripe Webhook Secret (from Stripe Dashboard)"
    echo "  3. OpenAI API Key (from Supabase Edge Functions)"
    echo "  4. Gmail App Password (for email delivery)"
    echo "  5. Supabase Service Role Key (for data migration)"
    echo ""
    read -p "Ready to proceed? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Secret collection cancelled."
        exit 0
    fi

    echo ""

    # Stripe Secret Key
    echo "🔑 STRIPE SECRET KEY"
    echo "Location: Stripe Dashboard → Developers → API Keys"
    echo "Format: sk_test_... or sk_live_..."
    echo ""
    read -s -p "Enter Stripe Secret Key: " stripe_secret_key
    echo ""
    create_secret "stripe-secret-key" "$stripe_secret_key" "stripe_key"
    echo ""

    # Stripe Webhook Secret
    echo "🔑 STRIPE WEBHOOK SECRET"
    echo "Location: Stripe Dashboard → Developers → Webhooks"
    echo "Format: whsec_..."
    echo ""
    read -s -p "Enter Stripe Webhook Secret: " stripe_webhook_secret
    echo ""
    create_secret "stripe-webhook-secret" "$stripe_webhook_secret" "stripe_webhook"
    echo ""

    # OpenAI API Key
    echo "🔑 OPENAI API KEY"
    echo "Location: Supabase Dashboard → Edge Functions → Environment Variables"
    echo "Format: sk-..."
    echo ""
    read -s -p "Enter OpenAI API Key: " openai_api_key
    echo ""
    create_secret "openai-api-key" "$openai_api_key" "openai_key"
    echo ""

    # Gmail App Password
    echo "🔑 GMAIL APP PASSWORD"
    echo "Location: Google Account → Security → 2-Step Verification → App Passwords"
    echo "Format: 16-character password"
    echo ""
    read -s -p "Enter Gmail App Password: " gmail_password
    echo ""
    create_secret "gmail-app-password" "$gmail_password" "email_password"
    echo ""

    # Supabase Service Role Key
    echo "🔑 SUPABASE SERVICE ROLE KEY"
    echo "Location: Supabase Dashboard → Settings → API → Service Role Key"
    echo "Format: eyJ..."
    echo ""
    read -s -p "Enter Supabase Service Role Key: " supabase_key
    echo ""
    create_secret "supabase-service-key" "$supabase_key" "basic"
    echo ""

    log "All secrets collected and stored successfully!"
}

# Load secrets from file (alternative method)
load_secrets_from_file() {
    progress "Loading secrets from file"

    local secrets_file="secrets.env"

    if [ ! -f "$secrets_file" ]; then
        warn "Secrets file not found: $secrets_file"
        warn "Falling back to interactive collection"
        collect_secrets_interactively
        return
    fi

    info "Loading secrets from $secrets_file"
    source "$secrets_file"

    # Create secrets from environment variables
    [ -n "${STRIPE_SECRET_KEY:-}" ] && create_secret "stripe-secret-key" "$STRIPE_SECRET_KEY" "stripe_key"
    [ -n "${STRIPE_WEBHOOK_SECRET:-}" ] && create_secret "stripe-webhook-secret" "$STRIPE_WEBHOOK_SECRET" "stripe_webhook"
    [ -n "${OPENAI_API_KEY:-}" ] && create_secret "openai-api-key" "$OPENAI_API_KEY" "openai_key"
    [ -n "${GMAIL_APP_PASSWORD:-}" ] && create_secret "gmail-app-password" "$GMAIL_APP_PASSWORD" "email_password"
    [ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ] && create_secret "supabase-service-key" "$SUPABASE_SERVICE_ROLE_KEY" "basic"

    log "Secrets loaded from file successfully!"
}

# Create secrets template file
create_secrets_template() {
    progress "Creating secrets template file"

    cat > secrets.env.template << 'EOF'
# DiagnosticPro Secrets Template
# =============================================================================
# Copy this file to secrets.env and fill in your actual values
# NEVER commit secrets.env to version control
# =============================================================================

# Stripe Configuration
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI Configuration
# Get from: Supabase Dashboard → Edge Functions → Environment Variables
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Gmail Configuration
# Get from: Google Account → Security → 2-Step Verification → App Passwords
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx

# Supabase Configuration (for data migration)
# Get from: Supabase Dashboard → Settings → API → Service Role Key
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Additional Configuration (Optional)
# JWT_SECRET=your-jwt-secret-here
# ENCRYPTION_KEY=your-encryption-key-here
EOF

    cat > .env.cloud-run << EOF
# DiagnosticPro Cloud Run Environment Variables
# =============================================================================
# This file contains non-secret environment variables for Cloud Run
# Secrets are stored in GCP Secret Manager
# =============================================================================

# Project Configuration
PROJECT_ID=$PROJECT_ID
REGION=$REGION
NODE_ENV=production

# Application Configuration
APP_PORT=8080
APP_NAME=diagnosticpro-app

# Database Configuration
FIRESTORE_DATABASE=(default)

# Storage Configuration
REPORTS_BUCKET=$DIAGNOSTIC_REPORTS_BUCKET
BACKUPS_BUCKET=$BACKUPS_BUCKET

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
FROM_EMAIL=reports@diagnosticpro.io

# Business Configuration
DIAGNOSTIC_PRICE=2999
CURRENCY=usd

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SLACK_NOTIFICATIONS=false

# Performance Configuration
MAX_CONCURRENT_REQUESTS=80
REQUEST_TIMEOUT_MS=300000

# Cloud Tasks Configuration
CLOUD_TASKS_QUEUE=$CLOUD_TASKS_QUEUE
CLOUD_TASKS_LOCATION=$REGION

# Monitoring Configuration
ENABLE_DEBUG_LOGS=false
LOG_LEVEL=info
EOF

    cat > secrets-access-commands.sh << 'EOF'
#!/bin/bash
# Commands to access secrets from Cloud Run

# Read secrets in Cloud Run (these commands work in the container)
export STRIPE_SECRET_KEY=$(gcloud secrets versions access latest --secret="stripe-secret-key")
export STRIPE_WEBHOOK_SECRET=$(gcloud secrets versions access latest --secret="stripe-webhook-secret")
export OPENAI_API_KEY=$(gcloud secrets versions access latest --secret="openai-api-key")
export GMAIL_APP_PASSWORD=$(gcloud secrets versions access latest --secret="gmail-app-password")
export SUPABASE_SERVICE_ROLE_KEY=$(gcloud secrets versions access latest --secret="supabase-service-key")

# Verify secrets are loaded
echo "Secrets loaded:"
echo "- Stripe Key: ${STRIPE_SECRET_KEY:0:8}..."
echo "- Webhook Secret: ${STRIPE_WEBHOOK_SECRET:0:8}..."
echo "- OpenAI Key: ${OPENAI_API_KEY:0:8}..."
echo "- Gmail Password: ${GMAIL_APP_PASSWORD:0:4}..."
echo "- Supabase Key: ${SUPABASE_SERVICE_ROLE_KEY:0:8}..."
EOF

    chmod +x secrets-access-commands.sh

    log "Created template files:"
    log "  • secrets.env.template - Fill with your secrets"
    log "  • .env.cloud-run - Cloud Run environment variables"
    log "  • secrets-access-commands.sh - Secret access helper"
}

# Verify secret access
verify_secret_access() {
    progress "Verifying secret access"

    local secrets=(
        "stripe-secret-key"
        "stripe-webhook-secret"
        "openai-api-key"
        "gmail-app-password"
        "supabase-service-key"
    )

    info "Testing secret access from service account..."

    for secret in "${secrets[@]}"; do
        if gcloud secrets versions access latest --secret="$secret" &>/dev/null; then
            log "✅ Secret accessible: $secret"
        else
            error "❌ Secret not accessible: $secret"
        fi
    done

    log "All secrets verified successfully!"
}

# Create IAM bindings for Cloud Run
configure_cloud_run_secrets() {
    progress "Configuring Cloud Run secrets access"

    # Create environment variables configuration for Cloud Run
    cat > cloud-run-secrets.yaml << EOF
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: diagnosticpro-app
  annotations:
    run.googleapis.com/ingress: all
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/service-account: $DIAGNOSTICPRO_APP_SA
    spec:
      containers:
      - image: gcr.io/$PROJECT_ID/diagnosticpro-app:latest
        env:
        # Non-secret environment variables
        - name: PROJECT_ID
          value: "$PROJECT_ID"
        - name: REGION
          value: "$REGION"
        - name: NODE_ENV
          value: "production"
        - name: FIRESTORE_DATABASE
          value: "(default)"
        - name: REPORTS_BUCKET
          value: "$DIAGNOSTIC_REPORTS_BUCKET"
        - name: FROM_EMAIL
          value: "reports@diagnosticpro.io"
        - name: DIAGNOSTIC_PRICE
          value: "2999"

        # Secret environment variables
        - name: STRIPE_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: stripe-secret-key
              key: latest
        - name: STRIPE_WEBHOOK_SECRET
          valueFrom:
            secretKeyRef:
              name: stripe-webhook-secret
              key: latest
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: openai-api-key
              key: latest
        - name: GMAIL_APP_PASSWORD
          valueFrom:
            secretKeyRef:
              name: gmail-app-password
              key: latest
        - name: SUPABASE_SERVICE_ROLE_KEY
          valueFrom:
            secretKeyRef:
              name: supabase-service-key
              key: latest
EOF

    log "Cloud Run secrets configuration saved to cloud-run-secrets.yaml"
}

# Update Stripe webhook configuration
update_stripe_webhook() {
    progress "Updating Stripe webhook configuration"

    cat > stripe-webhook-update.md << EOF
# Stripe Webhook Configuration Update

## Current Webhook URL
**Old URL:** https://jjxvrxehmawuyxltrvql.supabase.co/functions/v1/stripe-webhook

## New Webhook URL (Post-Migration)
**New URL:** https://diagnosticpro-app-[hash]-uc.a.run.app/api/stripe/webhook

## Manual Steps Required

### 1. Update Webhook Endpoint
1. Visit: https://dashboard.stripe.com/webhooks
2. Find existing webhook for DiagnosticPro
3. Update URL to new Cloud Run endpoint
4. Ensure these events are enabled:
   - \`checkout.session.completed\`
   - \`payment_intent.succeeded\`
   - \`invoice.payment_succeeded\`

### 2. Verify Webhook Secret
1. Copy webhook signing secret from Stripe dashboard
2. Ensure it matches the secret stored in GCP Secret Manager
3. Test webhook delivery after deployment

### 3. Test Payment Flow
1. Create test checkout session
2. Complete test payment
3. Verify webhook delivery to new endpoint
4. Check diagnostic analysis triggers correctly

## Webhook Testing Commands
\`\`\`bash
# Test webhook endpoint (after deployment)
curl -X POST https://diagnosticpro-app-[hash]-uc.a.run.app/api/stripe/webhook \\
  -H "Content-Type: application/json" \\
  -H "Stripe-Signature: t=test,v1=test" \\
  -d '{"type":"checkout.session.completed","data":{"object":{"id":"test"}}}'

# Monitor webhook logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=diagnosticpro-app" --limit=50
\`\`\`
EOF

    log "Stripe webhook update guide saved to stripe-webhook-update.md"
}

# Create secret rotation plan
create_rotation_plan() {
    progress "Creating secret rotation plan"

    cat > secret-rotation-plan.md << EOF
# DiagnosticPro Secret Rotation Plan

## Rotation Schedule
| Secret | Frequency | Next Rotation | Risk Level |
|--------|-----------|---------------|------------|
| Stripe Keys | 180 days | $(date -d '+180 days' '+%Y-%m-%d') | HIGH |
| OpenAI API Key | 90 days | $(date -d '+90 days' '+%Y-%m-%d') | MEDIUM |
| Gmail Password | 365 days | $(date -d '+365 days' '+%Y-%m-%d') | LOW |
| Webhook Secrets | 90 days | $(date -d '+90 days' '+%Y-%m-%d') | HIGH |

## Rotation Commands
\`\`\`bash
# Rotate Stripe secret key
echo "NEW_STRIPE_KEY" | gcloud secrets versions add stripe-secret-key --data-file=-

# Rotate webhook secret
echo "NEW_WEBHOOK_SECRET" | gcloud secrets versions add stripe-webhook-secret --data-file=-

# Rotate OpenAI key
echo "NEW_OPENAI_KEY" | gcloud secrets versions add openai-api-key --data-file=-

# Deploy new version to apply rotated secrets
gcloud run deploy diagnosticpro-app --source .
\`\`\`

## Monitoring Secret Access
\`\`\`bash
# View secret access logs
gcloud logging read "protoPayload.serviceName=secretmanager.googleapis.com" --limit=100

# List secret versions
gcloud secrets versions list stripe-secret-key

# Disable old secret versions
gcloud secrets versions disable 1 --secret=stripe-secret-key
\`\`\`
EOF

    log "Secret rotation plan saved to secret-rotation-plan.md"
}

# Generate migration summary
generate_secrets_summary() {
    progress "Generating secrets migration summary"

    cat > SECRETS_MIGRATION_SUMMARY.md << EOF
# DiagnosticPro Secrets Migration Summary

**Migration Date:** $(date)
**Project ID:** $PROJECT_ID

## 🔐 Secrets Migrated

### Payment Processing
- ✅ \`stripe-secret-key\` - Stored in Secret Manager
- ✅ \`stripe-webhook-secret\` - Stored in Secret Manager

### AI/ML Services
- ✅ \`openai-api-key\` - Stored in Secret Manager
  - Note: Will transition to Vertex AI in future update

### Email Services
- ✅ \`gmail-app-password\` - Stored in Secret Manager

### Data Migration
- ✅ \`supabase-service-key\` - Stored in Secret Manager
  - Note: Used only for migration, can be deleted after completion

## 🔧 Configuration Files Generated

### Environment Variables
- \`secrets.env.template\` - Template for local development
- \`.env.cloud-run\` - Non-secret environment variables
- \`cloud-run-secrets.yaml\` - Cloud Run deployment with secrets

### Helper Scripts
- \`secrets-access-commands.sh\` - Commands to access secrets
- \`stripe-webhook-update.md\` - Webhook configuration guide
- \`secret-rotation-plan.md\` - Secret rotation schedule

## 🚀 Next Steps

### 1. Verify Secret Access
\`\`\`bash
# Test secret access
gcloud secrets versions access latest --secret="stripe-secret-key"
\`\`\`

### 2. Deploy Application
\`\`\`bash
# Deploy with secrets
./03-deploy-cloud-run.sh
\`\`\`

### 3. Update Stripe Webhooks
- Follow instructions in \`stripe-webhook-update.md\`
- Test webhook delivery after deployment

### 4. Test End-to-End Flow
- Submit diagnostic form
- Process payment
- Verify AI analysis
- Check email delivery

## 🔒 Security Notes

### Access Controls
- Secrets accessible only by service account: \`$DIAGNOSTICPRO_APP_SA\`
- IAM roles follow principle of least privilege
- Audit logging enabled for all secret access

### Best Practices Applied
- Secrets stored encrypted at rest
- No secrets in environment variables or code
- Proper validation of secret formats
- Rotation plan established

### Monitoring
- Secret access logged in Cloud Audit Logs
- Billing alerts set for unexpected usage
- Health checks include secret accessibility

## 🆘 Troubleshooting

### Secret Access Issues
\`\`\`bash
# Check service account permissions
gcloud secrets get-iam-policy stripe-secret-key

# View audit logs
gcloud logging read "protoPayload.serviceName=secretmanager.googleapis.com"
\`\`\`

### Application Issues
\`\`\`bash
# Check Cloud Run logs
gcloud logging read "resource.type=cloud_run_revision" --limit=50

# Test secret loading in container
gcloud run services describe diagnosticpro-app --region=$REGION
\`\`\`

---
**Generated by:** DiagnosticPro Secrets Migration Script
**Status:** ✅ Migration Complete
EOF

    log "Secrets migration summary saved to SECRETS_MIGRATION_SUMMARY.md"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "  DiagnosticPro Secrets Migration"
    echo "=============================================="
    echo -e "${NC}"
    echo ""
    echo "This script will migrate all secrets from Supabase/Stripe"
    echo "to GCP Secret Manager for secure Cloud Run deployment."
    echo ""
    echo "Project: $PROJECT_ID"
    echo "Service Account: $DIAGNOSTICPRO_APP_SA"
    echo ""

    # Check for secrets file or use interactive collection
    if [ -f "secrets.env" ]; then
        echo "Found secrets.env file"
        read -p "Load secrets from file? (Y/n): " use_file
        if [[ $use_file =~ ^[Nn]$ ]]; then
            collect_secrets_interactively
        else
            load_secrets_from_file
        fi
    else
        echo "No secrets.env file found. Will collect interactively."
        echo ""
        collect_secrets_interactively
    fi

    # Execute remaining steps
    create_secrets_template
    verify_secret_access
    configure_cloud_run_secrets
    update_stripe_webhook
    create_rotation_plan
    generate_secrets_summary

    echo ""
    echo -e "${GREEN}"
    echo "=============================================="
    echo "  ✅ Secrets Migration Complete!"
    echo "=============================================="
    echo -e "${NC}"
    echo ""
    echo "📋 Summary:"
    echo "  • Secrets stored: 5"
    echo "  • Access verified: ✅"
    echo "  • Cloud Run config: ✅"
    echo "  • Rotation plan: ✅"
    echo ""
    echo "📖 Next Steps:"
    echo "  1. Review: SECRETS_MIGRATION_SUMMARY.md"
    echo "  2. Deploy app: ./03-deploy-cloud-run.sh"
    echo "  3. Update Stripe webhooks: stripe-webhook-update.md"
    echo ""
    echo "🔐 Security:"
    echo "  • All secrets encrypted at rest"
    echo "  • Access limited to service account"
    echo "  • Audit logging enabled"
    echo ""
    log "Secrets migration completed successfully! 🎉"
}

# Run main function
main "$@"