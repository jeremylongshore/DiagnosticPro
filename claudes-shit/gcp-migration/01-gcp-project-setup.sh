#!/bin/bash
set -euo pipefail

# =============================================================================
# GCP Project Setup Script for DiagnosticPro Cloud Run Migration
# =============================================================================
# This script creates a new GCP project and sets up all necessary infrastructure
# for migrating the DiagnosticPro platform from Supabase to Google Cloud Run
#
# Created: 2025-09-17
# =============================================================================

# Configuration
PROJECT_ID="diagnosticpro-cloud-run"
PROJECT_NAME="DiagnosticPro Cloud Run Platform"
BILLING_ACCOUNT=""  # TODO: Set your billing account ID
REGION="us-central1"
ZONE="us-central1-a"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
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

# Progress tracking
TOTAL_STEPS=15
CURRENT_STEP=0

progress() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    echo -e "${BLUE}[Step $CURRENT_STEP/$TOTAL_STEPS] $1${NC}"
}

# Prerequisite checks
check_prerequisites() {
    progress "Checking prerequisites"

    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        error "gcloud CLI is not installed. Please install Google Cloud SDK first."
    fi

    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
        error "Not authenticated with gcloud. Run 'gcloud auth login' first."
    fi

    # Check billing account
    if [ -z "$BILLING_ACCOUNT" ]; then
        warn "Billing account not set. You'll need to link billing manually."
        echo "Available billing accounts:"
        gcloud billing accounts list --format="table(name,displayName,open)"
        echo ""
        read -p "Enter billing account ID (or press Enter to skip): " billing_input
        if [ -n "$billing_input" ]; then
            BILLING_ACCOUNT="$billing_input"
        fi
    fi

    log "Prerequisites check completed"
}

# Create GCP project
create_project() {
    progress "Creating GCP project: $PROJECT_ID"

    # Check if project already exists
    if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
        warn "Project $PROJECT_ID already exists. Continuing with existing project."
    else
        gcloud projects create "$PROJECT_ID" \
            --name="$PROJECT_NAME" \
            --set-as-default
        log "Project $PROJECT_ID created successfully"
    fi

    # Set as default project
    gcloud config set project "$PROJECT_ID"

    # Link billing account if provided
    if [ -n "$BILLING_ACCOUNT" ]; then
        gcloud billing projects link "$PROJECT_ID" \
            --billing-account="$BILLING_ACCOUNT"
        log "Billing account linked to project"
    else
        warn "No billing account linked. Please link billing manually in the console."
    fi
}

# Enable required APIs
enable_apis() {
    progress "Enabling required Google Cloud APIs"

    local apis=(
        "cloudbuild.googleapis.com"           # Cloud Build for CI/CD
        "run.googleapis.com"                  # Cloud Run for hosting
        "firestore.googleapis.com"            # Firestore database
        "storage-api.googleapis.com"          # Cloud Storage for reports
        "storage-component.googleapis.com"    # Storage component
        "cloudtasks.googleapis.com"           # Cloud Tasks for async processing
        "secretmanager.googleapis.com"        # Secret Manager for API keys
        "aiplatform.googleapis.com"           # Vertex AI for ML
        "logging.googleapis.com"              # Cloud Logging
        "monitoring.googleapis.com"           # Cloud Monitoring
        "cloudresourcemanager.googleapis.com" # Resource Manager
        "iam.googleapis.com"                  # IAM for service accounts
        "cloudscheduler.googleapis.com"       # Cloud Scheduler for cron jobs
        "gmail.googleapis.com"                # Gmail API for email
        "pubsub.googleapis.com"               # Pub/Sub for messaging
    )

    for api in "${apis[@]}"; do
        log "Enabling $api..."
        gcloud services enable "$api"
    done

    log "All APIs enabled successfully"
}

# Create service accounts
create_service_accounts() {
    progress "Creating service accounts"

    # Main application service account
    local app_sa="diagnosticpro-app"
    local app_sa_email="${app_sa}@${PROJECT_ID}.iam.gserviceaccount.com"

    if ! gcloud iam service-accounts describe "$app_sa_email" &>/dev/null; then
        gcloud iam service-accounts create "$app_sa" \
            --display-name="DiagnosticPro Application Service Account" \
            --description="Service account for DiagnosticPro Cloud Run application"
        log "Created application service account: $app_sa_email"
    else
        warn "Service account $app_sa_email already exists"
    fi

    # Cloud Build service account
    local build_sa="diagnosticpro-build"
    local build_sa_email="${build_sa}@${PROJECT_ID}.iam.gserviceaccount.com"

    if ! gcloud iam service-accounts describe "$build_sa_email" &>/dev/null; then
        gcloud iam service-accounts create "$build_sa" \
            --display-name="DiagnosticPro Build Service Account" \
            --description="Service account for Cloud Build deployments"
        log "Created build service account: $build_sa_email"
    else
        warn "Service account $build_sa_email already exists"
    fi

    # Export service account emails for use in other scripts
    export DIAGNOSTICPRO_APP_SA="$app_sa_email"
    export DIAGNOSTICPRO_BUILD_SA="$build_sa_email"

    # Save to environment file
    cat > gcp-service-accounts.env << EOF
# DiagnosticPro Service Accounts
DIAGNOSTICPRO_APP_SA=$app_sa_email
DIAGNOSTICPRO_BUILD_SA=$build_sa_email
EOF

    log "Service accounts created and saved to gcp-service-accounts.env"
}

# Configure IAM roles
configure_iam() {
    progress "Configuring IAM roles"

    source gcp-service-accounts.env

    # Application service account roles
    local app_roles=(
        "roles/firestore.user"           # Firestore database access
        "roles/storage.objectAdmin"      # Storage bucket access
        "roles/cloudtasks.enqueuer"      # Cloud Tasks access
        "roles/secretmanager.secretAccessor" # Secret Manager access
        "roles/aiplatform.user"          # Vertex AI access
        "roles/logging.logWriter"        # Cloud Logging
        "roles/monitoring.metricWriter"  # Cloud Monitoring
        "roles/pubsub.publisher"         # Pub/Sub publishing
    )

    for role in "${app_roles[@]}"; do
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$DIAGNOSTICPRO_APP_SA" \
            --role="$role"
        log "Granted $role to application service account"
    done

    # Build service account roles
    local build_roles=(
        "roles/cloudbuild.builds.builder"  # Cloud Build
        "roles/run.admin"                  # Cloud Run deployment
        "roles/storage.admin"              # Storage admin for artifacts
        "roles/iam.serviceAccountUser"     # Service account impersonation
    )

    for role in "${build_roles[@]}"; do
        gcloud projects add-iam-policy-binding "$PROJECT_ID" \
            --member="serviceAccount:$DIAGNOSTICPRO_BUILD_SA" \
            --role="$role"
        log "Granted $role to build service account"
    done

    log "IAM roles configured successfully"
}

# Create Firestore database
create_firestore() {
    progress "Creating Firestore database"

    # Check if Firestore is already initialized
    if gcloud firestore databases describe --database="(default)" &>/dev/null; then
        warn "Firestore database already exists"
    else
        # Create Firestore database in native mode
        gcloud firestore databases create \
            --region="$REGION" \
            --database="(default)" \
            --type="firestore-native"
        log "Firestore database created in native mode"
    fi

    # Create composite indexes for common queries
    log "Setting up Firestore indexes..."
    # Note: Indexes will be created via firestore.indexes.json file
}

# Create Cloud Storage buckets
create_storage() {
    progress "Creating Cloud Storage buckets"

    local report_bucket="${PROJECT_ID}-diagnostic-reports"
    local backup_bucket="${PROJECT_ID}-backups"

    # Create diagnostic reports bucket
    if ! gsutil ls -b "gs://$report_bucket" &>/dev/null; then
        gsutil mb -p "$PROJECT_ID" -c STANDARD -l "$REGION" "gs://$report_bucket"

        # Set bucket permissions
        gsutil iam ch "serviceAccount:$DIAGNOSTICPRO_APP_SA:objectAdmin" "gs://$report_bucket"

        # Set lifecycle policy (delete reports after 90 days)
        cat > lifecycle-policy.json << 'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 90}
      }
    ]
  }
}
EOF
        gsutil lifecycle set lifecycle-policy.json "gs://$report_bucket"
        rm lifecycle-policy.json

        log "Created diagnostic reports bucket: gs://$report_bucket"
    else
        warn "Bucket gs://$report_bucket already exists"
    fi

    # Create backups bucket
    if ! gsutil ls -b "gs://$backup_bucket" &>/dev/null; then
        gsutil mb -p "$PROJECT_ID" -c COLDLINE -l "$REGION" "gs://$backup_bucket"
        gsutil iam ch "serviceAccount:$DIAGNOSTICPRO_APP_SA:objectAdmin" "gs://$backup_bucket"
        log "Created backups bucket: gs://$backup_bucket"
    else
        warn "Bucket gs://$backup_bucket already exists"
    fi

    # Export bucket names
    export DIAGNOSTIC_REPORTS_BUCKET="$report_bucket"
    export BACKUPS_BUCKET="$backup_bucket"

    # Save to environment file
    cat >> gcp-service-accounts.env << EOF

# Storage Buckets
DIAGNOSTIC_REPORTS_BUCKET=$report_bucket
BACKUPS_BUCKET=$backup_bucket
EOF
}

# Create Cloud Tasks queue
create_cloud_tasks() {
    progress "Creating Cloud Tasks queue"

    local queue_name="diagnostic-processing"

    # Create queue if it doesn't exist
    if ! gcloud tasks queues describe "$queue_name" --location="$REGION" &>/dev/null; then
        gcloud tasks queues create "$queue_name" \
            --location="$REGION" \
            --max-concurrent-dispatches=10 \
            --max-dispatches-per-second=5
        log "Created Cloud Tasks queue: $queue_name"
    else
        warn "Cloud Tasks queue $queue_name already exists"
    fi

    export CLOUD_TASKS_QUEUE="$queue_name"
    cat >> gcp-service-accounts.env << EOF

# Cloud Tasks
CLOUD_TASKS_QUEUE=$queue_name
CLOUD_TASKS_LOCATION=$REGION
EOF
}

# Set up Secret Manager
create_secret_manager_secrets() {
    progress "Creating Secret Manager secrets placeholders"

    local secrets=(
        "stripe-secret-key"
        "stripe-webhook-secret"
        "openai-api-key"        # Will migrate to Vertex AI later
        "gmail-app-password"
        "supabase-service-key"  # For data migration
    )

    for secret in "${secrets[@]}"; do
        if ! gcloud secrets describe "$secret" &>/dev/null; then
            gcloud secrets create "$secret" \
                --replication-policy="automatic"

            # Grant access to application service account
            gcloud secrets add-iam-policy-binding "$secret" \
                --member="serviceAccount:$DIAGNOSTICPRO_APP_SA" \
                --role="roles/secretmanager.secretAccessor"

            log "Created secret: $secret"
        else
            warn "Secret $secret already exists"
        fi
    done

    log "Secret Manager secrets created (values need to be added manually)"
}

# Create Cloud Run service placeholder
create_cloud_run_service() {
    progress "Creating Cloud Run service configuration"

    # Create a minimal Cloud Run service that can be updated later
    cat > cloud-run-service.yaml << EOF
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: diagnosticpro-app
  namespace: '$PROJECT_ID'
  labels:
    cloud.googleapis.com/location: $REGION
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/ingress-status: all
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: '10'
        autoscaling.knative.dev/minScale: '0'
        run.googleapis.com/cpu-throttling: 'true'
        run.googleapis.com/execution-environment: gen2
        run.googleapis.com/service-account: $DIAGNOSTICPRO_APP_SA
    spec:
      containerConcurrency: 80
      timeoutSeconds: 300
      containers:
      - image: gcr.io/cloudrun/hello
        ports:
        - name: http1
          containerPort: 8080
        env:
        - name: PROJECT_ID
          value: $PROJECT_ID
        - name: REGION
          value: $REGION
        resources:
          limits:
            cpu: 1000m
            memory: 2Gi
EOF

    log "Cloud Run service configuration saved to cloud-run-service.yaml"
}

# Set up monitoring and alerting
setup_monitoring() {
    progress "Setting up monitoring and alerting"

    # Create notification channel (email)
    # Note: This requires manual setup in the console for email verification

    # Create alerting policies for key metrics
    cat > monitoring-config.yaml << EOF
# Monitoring Configuration for DiagnosticPro
#
# Key metrics to monitor:
# - Cloud Run request latency
# - Error rates
# - Firestore operations
# - Storage bucket usage
# - Secret Manager access
# - Vertex AI API calls
#
# Set up alerts for:
# - 5xx error rate > 5%
# - Response time > 10 seconds
# - Storage costs > $100/month
# - Firestore read/write limits approaching
EOF

    log "Monitoring configuration template created"
}

# Create deployment configuration
create_deployment_config() {
    progress "Creating deployment configuration"

    cat > deployment-config.env << EOF
# DiagnosticPro Deployment Configuration
# Generated: $(date)

# Project Information
PROJECT_ID=$PROJECT_ID
REGION=$REGION
ZONE=$ZONE

# Application Configuration
APP_NAME=diagnosticpro-app
APP_PORT=8080
NODE_ENV=production

# Database Configuration
FIRESTORE_DATABASE=(default)

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
FROM_EMAIL=reports@diagnosticpro.io

# Pricing Configuration
DIAGNOSTIC_PRICE=2999  # $29.99 in cents

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SLACK_NOTIFICATIONS=false

# Performance Configuration
MAX_CONCURRENT_REQUESTS=80
REQUEST_TIMEOUT_SECONDS=300
AUTO_SCALING_MIN_INSTANCES=0
AUTO_SCALING_MAX_INSTANCES=10
EOF

    log "Deployment configuration saved to deployment-config.env"
}

# Generate setup summary
generate_summary() {
    progress "Generating setup summary"

    cat > GCP_SETUP_SUMMARY.md << EOF
# DiagnosticPro GCP Setup Summary

**Setup Date:** $(date)
**Project ID:** $PROJECT_ID
**Region:** $REGION

## 🎯 What Was Created

### Project & Billing
- ✅ GCP Project: $PROJECT_ID
- ⚠️  Billing Account: ${BILLING_ACCOUNT:-"NEEDS_MANUAL_SETUP"}

### APIs Enabled
- ✅ Cloud Run, Firestore, Storage, Tasks
- ✅ Secret Manager, Vertex AI, Logging
- ✅ Cloud Build, IAM, Scheduler

### Service Accounts
- ✅ Application SA: \`$DIAGNOSTICPRO_APP_SA\`
- ✅ Build SA: \`$DIAGNOSTICPRO_BUILD_SA\`

### Infrastructure
- ✅ Firestore Database (Native Mode)
- ✅ Storage Buckets: Reports & Backups
- ✅ Cloud Tasks Queue: diagnostic-processing
- ✅ Secret Manager: 5 secrets created (empty)

### Security & IAM
- ✅ Least-privilege IAM roles assigned
- ✅ Service account permissions configured
- ✅ Secret Manager access controls

## 🚧 Next Steps Required

### 1. Add Secrets (CRITICAL)
\`\`\`bash
# Run the secret migration script
./02-secrets-migration.sh
\`\`\`

### 2. Deploy Application
\`\`\`bash
# Build and deploy Cloud Run service
./03-deploy-cloud-run.sh
\`\`\`

### 3. Configure Domain (Optional)
\`\`\`bash
# Set up custom domain
gcloud run domain-mappings create --service=diagnosticpro-app --domain=app.diagnosticpro.io
\`\`\`

### 4. Set Up Monitoring
- Configure notification channels in Cloud Console
- Set up alerting policies for key metrics
- Enable log-based metrics

## 📁 Generated Files
- \`gcp-service-accounts.env\` - Service account details
- \`deployment-config.env\` - Application configuration
- \`cloud-run-service.yaml\` - Cloud Run service template
- \`monitoring-config.yaml\` - Monitoring setup guide

## 💰 Estimated Monthly Costs
- Cloud Run: $5-20 (based on traffic)
- Firestore: $5-15 (reads/writes)
- Storage: $2-5 (PDF reports)
- Secret Manager: $1
- **Total: $13-41/month**

## 🔗 Useful Commands
\`\`\`bash
# View project info
gcloud config get-value project

# Check service account
gcloud iam service-accounts list

# View Cloud Run services
gcloud run services list

# Check Firestore status
gcloud firestore databases describe --database="(default)"

# View storage buckets
gsutil ls

# Check secrets
gcloud secrets list
\`\`\`

## 🆘 Troubleshooting
- **Billing Issues:** Link billing account in Cloud Console
- **Permission Errors:** Verify service account roles
- **API Errors:** Ensure all APIs are enabled
- **Firestore Issues:** Check region and database mode

---
**Generated by:** DiagnosticPro GCP Setup Script
**Contact:** reports@diagnosticpro.io
EOF

    log "Setup summary saved to GCP_SETUP_SUMMARY.md"
}

# Cleanup function for errors
cleanup_on_error() {
    warn "Setup interrupted. Cleaning up resources..."
    # Add cleanup logic here if needed
    error "Setup failed. Check the logs above for details."
}

# Set trap for errors
trap cleanup_on_error ERR

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "  DiagnosticPro GCP Migration Setup"
    echo "=============================================="
    echo -e "${NC}"
    echo ""
    echo "This script will create a new GCP project and set up"
    echo "all necessary infrastructure for the Cloud Run migration."
    echo ""
    echo "Project ID: $PROJECT_ID"
    echo "Region: $REGION"
    echo ""
    read -p "Continue? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi

    echo ""
    log "Starting DiagnosticPro GCP setup..."

    # Execute setup steps
    check_prerequisites
    create_project
    enable_apis
    create_service_accounts
    configure_iam
    create_firestore
    create_storage
    create_cloud_tasks
    create_secret_manager_secrets
    create_cloud_run_service
    setup_monitoring
    create_deployment_config
    generate_summary

    echo ""
    echo -e "${GREEN}"
    echo "=============================================="
    echo "  ✅ GCP Setup Complete!"
    echo "=============================================="
    echo -e "${NC}"
    echo ""
    echo "📋 Summary:"
    echo "  • Project: $PROJECT_ID"
    echo "  • Region: $REGION"
    echo "  • Service Accounts: 2 created"
    echo "  • APIs: 15 enabled"
    echo "  • Infrastructure: Ready for deployment"
    echo ""
    echo "📖 Next Steps:"
    echo "  1. Review: GCP_SETUP_SUMMARY.md"
    echo "  2. Add secrets: ./02-secrets-migration.sh"
    echo "  3. Deploy app: ./03-deploy-cloud-run.sh"
    echo ""
    echo "🔗 Quick Links:"
    echo "  • Console: https://console.cloud.google.com/home/dashboard?project=$PROJECT_ID"
    echo "  • Firestore: https://console.cloud.google.com/firestore/data?project=$PROJECT_ID"
    echo "  • Cloud Run: https://console.cloud.google.com/run?project=$PROJECT_ID"
    echo ""
    log "Setup completed successfully! 🎉"
}

# Run main function
main "$@"