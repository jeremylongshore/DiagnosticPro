# DiagnosticPro Vertex AI Backend Deployment Guide

Complete deployment guide for the FastAPI backend to Google Cloud Run with Vertex AI Gemini integration.

## Prerequisites

1. **Google Cloud SDK** installed and authenticated
2. **Project setup** with billing enabled
3. **Required APIs** will be automatically enabled by scripts
4. **Stripe account** with webhook endpoint configured
5. **Vertex AI API** enabled for Gemini analysis
6. **Firebase project** with service account

## Quick Start (5 Commands)

```bash
# 1. Setup secrets in Google Secret Manager
./scripts/setup-secrets.sh

# 2. Create Cloud SQL database
./scripts/setup-database.sh

# 3. Create Cloud Storage bucket
./scripts/setup-gcs.sh

# 4. Deploy to Cloud Run
./scripts/deploy.sh

# 5. Run database migrations
./scripts/run-migrations.sh
```

## Detailed Setup

### 1. Environment Configuration

Set your project ID and region:

```bash
export PROJECT_ID="diagnostic-pro-prod"
export REGION="us-central1"
```

### 2. Secret Manager Setup

The `setup-secrets.sh` script creates all required secrets with placeholder values:

- `database-url` - Cloud SQL connection string
- `firebase-credentials` - Firebase service account JSON
- `stripe-secret-key` - Stripe secret key
- `stripe-webhook-secret` - Stripe webhook signing secret
- `vertex-ai-location` - Vertex AI region for Gemini analysis (us-central1)
- `gcs-bucket-name` - Cloud Storage bucket name
- `jwt-secret` - JWT signing secret (auto-generated)

**Update secrets with real values:**

```bash
# Stripe keys
echo "sk_live_your_actual_stripe_key" | gcloud secrets versions add stripe-secret-key --data-file=-
echo "whsec_your_webhook_secret" | gcloud secrets versions add stripe-webhook-secret --data-file=-

# Vertex AI location
echo "us-central1" | gcloud secrets versions add vertex-ai-location --data-file=-

# Firebase service account (download from Firebase Console)
gcloud secrets versions add firebase-credentials --data-file=path/to/service-account.json
```

### 3. Database Setup

The `setup-database.sh` script:

- Creates Cloud SQL PostgreSQL instance (db-f1-micro)
- Creates database and user with random password
- Updates `database-url` secret automatically
- Configures backup and maintenance windows

**Database specifications:**
- Instance: `diagnostic-db`
- Database: `diagnostic_db`
- User: `diagnostic_user`
- Version: PostgreSQL 15
- Tier: db-f1-micro (1 vCPU, 0.6GB RAM)
- Storage: 10GB SSD with auto-increase

### 4. Storage Setup

The `setup-gcs.sh` script:

- Creates private Cloud Storage bucket
- Sets 90-day lifecycle policy
- Configures CORS for frontend downloads
- Creates folder structure for reports
- Updates `gcs-bucket-name` secret

**Bucket configuration:**
- Name: `{PROJECT_ID}-diagnostic-reports`
- Access: Private (signed URLs only)
- Lifecycle: Delete after 90 days
- Structure: `reports/YYYY-MM-DD/diagnostic-{id}.pdf`

### 5. Cloud Run Deployment

The `deploy.sh` script uses Cloud Build to:

- Build Docker container from `backend/Dockerfile`
- Push to Container Registry
- Deploy to Cloud Run with secrets mounted as environment variables

**Cloud Run configuration:**
- Service: `diagnosticpro-vertex-ai-backend`
- Region: `us-central1`
- Memory: 2GB
- CPU: 2 vCPUs
- Min instances: 0 (scales to zero)
- Max instances: 10
- Timeout: 15 minutes
- Concurrency: 80 requests per instance

### 6. Database Migrations

After deployment, run Alembic migrations:

```bash
./scripts/run-migrations.sh
```

This connects to the Cloud SQL instance and creates all required tables:
- `diagnostics` - Customer diagnostic submissions
- `orders` - Payment tracking
- `email_logs` - Email delivery logs

## Verification

### Health Check

```bash
SERVICE_URL=$(gcloud run services describe diagnosticpro-vertex-ai-backend --region us-central1 --format "value(status.url)")
curl $SERVICE_URL/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "database": "connected",
  "storage": "accessible"
}
```

### Database Connection

```bash
# Test database connection
curl $SERVICE_URL/api/diagnostics/1
```

### Storage Access

```bash
# Test GCS bucket access (will return 404 for non-existent file, but confirms access)
curl -I $SERVICE_URL/api/reports/1/download
```

## Frontend Integration

Update your frontend `.env` file:

```bash
# Get the Cloud Run service URL
SERVICE_URL=$(gcloud run services describe diagnosticpro-vertex-ai-backend --region us-central1 --format "value(status.url)")

# Update .env
echo "VITE_API_BASE_URL=$SERVICE_URL/api" >> .env
```

## Stripe Webhook Configuration

Update your Stripe webhook endpoint:

1. Go to Stripe Dashboard → Webhooks
2. Update endpoint URL to: `{SERVICE_URL}/api/webhooks/stripe`
3. Events to send: `checkout.session.completed`

## Monitoring & Debugging

### View Logs

```bash
# Real-time logs
gcloud run services logs tail diagnosticpro-vertex-ai-backend --region us-central1

# Recent logs
gcloud run services logs read diagnosticpro-vertex-ai-backend --region us-central1 --limit 100
```

### Service Status

```bash
# Service details
gcloud run services describe diagnosticpro-vertex-ai-backend --region us-central1

# List revisions
gcloud run revisions list --service diagnosticpro-vertex-ai-backend --region us-central1
```

### Database Access

```bash
# Connect to Cloud SQL
gcloud sql connect diagnostic-db --user=diagnostic_user

# Run SQL queries
gcloud sql instances describe diagnostic-db
```

## Troubleshooting

### Common Issues

1. **Secret access denied**
   ```bash
   # Grant Cloud Run service account access to secrets
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

2. **Database connection failed**
   ```bash
   # Check Cloud SQL proxy configuration
   gcloud sql instances describe diagnostic-db --format="value(connectionName)"
   ```

3. **Storage access denied**
   ```bash
   # Grant storage permissions
   gcloud projects add-iam-policy-binding $PROJECT_ID \
     --member="serviceAccount:$PROJECT_ID-compute@developer.gserviceaccount.com" \
     --role="roles/storage.objectAdmin"
   ```

4. **Deployment timeout**
   ```bash
   # Check build logs
   gcloud builds log $(gcloud builds list --limit=1 --format="value(id)")
   ```

### Log Analysis

Common log patterns to look for:

```bash
# Database connection errors
gcloud logs read "resource.type=cloud_run_revision AND textPayload:database" --limit 10

# Authentication errors
gcloud logs read "resource.type=cloud_run_revision AND textPayload:auth" --limit 10

# Stripe webhook errors
gcloud logs read "resource.type=cloud_run_revision AND textPayload:stripe" --limit 10
```

## Security Notes

- All secrets are stored in Google Secret Manager
- Database uses private IP with Cloud SQL proxy
- Storage bucket is private with signed URLs only
- Cloud Run service runs with minimal IAM permissions
- HTTPS enforced for all endpoints
- CORS configured for frontend domain only

## Cost Optimization

- Cloud Run scales to zero when not in use
- Cloud SQL uses smallest instance (db-f1-micro)
- Storage has 90-day lifecycle for automatic cleanup
- Container Registry images are cleaned up automatically

## Backup & Recovery

- Cloud SQL automated daily backups (retention: 7 days)
- Point-in-time recovery available
- Storage bucket versioning disabled (cost optimization)
- Database export to BigQuery for analytics

## Performance Monitoring

- Cloud Run automatic metrics in Cloud Monitoring
- Custom metrics: response time, error rate, throughput
- Alerts configured for high error rates
- Log-based metrics for business KPIs

---

## Files Created

This deployment creates the following infrastructure:

- **Cloud Run service**: `diagnosticpro-vertex-ai-backend`
- **Cloud SQL instance**: `diagnostic-db`
- **Cloud Storage bucket**: `{PROJECT_ID}-diagnostic-reports`
- **Secret Manager secrets**: 7 secrets for configuration
- **IAM bindings**: Service account permissions
- **Firewall rules**: Cloud SQL access (automatic)

Total estimated monthly cost: ~$10-30 (depending on usage)