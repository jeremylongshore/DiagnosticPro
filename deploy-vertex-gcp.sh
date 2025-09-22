#!/bin/bash

# Vertex AI + Firestore + GCS deployment for Fix-It Detective AI
# Run this script from the project root directory

set -e

# Add gcloud to PATH
export PATH="/home/jeremy/google-cloud-sdk/bin:$PATH"

# 0) Vars
export PROJECT_ID="diagnostic-pro-prod"
export REGION="us-central1"
export RUN_SVC="fix-it-detective-backend"
export AR_REPO="containers"
export BUCKET="${PROJECT_ID}-diagnostic-reports"
export VERTEX_LOCATION="us-central1"

echo "🚀 Deploying Fix-It Detective AI with Vertex AI + Firestore + GCS"
echo "=================================================================="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $RUN_SVC"
echo "Bucket: $BUCKET"
echo ""

gcloud config set project $PROJECT_ID

# 1) Enable APIs
echo "📡 Enabling APIs..."
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com \
  secretmanager.googleapis.com firestore.googleapis.com storage.googleapis.com \
  iamcredentials.googleapis.com aiplatform.googleapis.com

# 2) Service account + IAM
echo "🔐 Creating service account and assigning IAM roles..."
gcloud iam service-accounts create ${RUN_SVC}-sa --display-name="${RUN_SVC} SA" || true

for ROLE in roles/secretmanager.secretAccessor roles/storage.objectAdmin roles/aiplatform.user; do
  echo "Assigning role: $ROLE"
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${RUN_SVC}-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
    --role="$ROLE"
done

# 3) Firestore (Native mode)
echo "🗄️ Creating Firestore database..."
gcloud firestore databases create --location=nam5 || true

# 4) GCS bucket
echo "☁️ Creating GCS bucket..."
gsutil mb -l $REGION gs://$BUCKET || true
gsutil lifecycle set <(printf '{"rule":[{"action":{"type":"Delete"},"condition":{"age":90}}]}') gs://$BUCKET

# 5) Secrets (create placeholders now)
echo "🔐 Creating secrets..."
echo "$BUCKET" | gcloud secrets create gcs-bucket-name --data-file=- || echo "Secret exists"
echo "$PROJECT_ID" | gcloud secrets create firebase-project-id --data-file=- || echo "Secret exists"
echo "sk_live_REPLACE" | gcloud secrets create stripe-secret-key --data-file=- || echo "Secret exists"
echo "whsec_REPLACE" | gcloud secrets create stripe-webhook-secret --data-file=- || echo "Secret exists"

# 6) Artifact Registry + build
echo "🏗️ Creating Artifact Registry and building image..."
gcloud artifacts repositories create $AR_REPO --repository-format=docker --location=$REGION --async || true

# Wait a moment for the repo to be ready
sleep 5

IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$AR_REPO/$RUN_SVC:$(date +%s)"
echo "Building image: $IMAGE"

# Change to backend directory for build
cd backend
gcloud builds submit --tag "$IMAGE"
cd ..

# 7) Deploy Cloud Run (Vertex + Firestore + GCS)
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $RUN_SVC \
  --image "$IMAGE" \
  --region $REGION \
  --allow-unauthenticated \
  --service-account ${RUN_SVC}-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --set-secrets STRIPE_SECRET_KEY=stripe-secret-key:latest,STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest,GCS_BUCKET_REPORTS=gcs-bucket-name:latest,FIREBASE_PROJECT_ID=firebase-project-id:latest \
  --set-env-vars GCP_PROJECT=$PROJECT_ID,VERTEX_LOCATION=$VERTEX_LOCATION \
  --cpu=2 --memory=2Gi --concurrency=80 --timeout=900

# 8) Firestore security rules
echo "📋 Creating Firestore security rules..."
cat > firestore.rules <<'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(uid) { return request.auth != null && request.auth.uid == uid; }

    match /diagnostics/{id} {
      allow read: if isOwner(resource.data.uid);
      allow create, update, delete: if false;
    }

    match /orders/{id} {
      allow read, write: if false;
    }
  }
}
EOF

echo "⚠️  Manual step required: Deploy Firestore rules"
echo "1. Install Firebase CLI: npm i -g firebase-tools"
echo "2. Login: firebase login --no-localhost"
echo "3. Use project: firebase use $PROJECT_ID"
echo "4. Deploy rules: firebase deploy --only firestore:rules"

# 9) Get service URL and update Stripe webhook
RUN_URL=$(gcloud run services describe $RUN_SVC --region $REGION --format='value(status.url)')
echo ""
echo "✅ Deployment complete!"
echo "======================"
echo ""
echo "🌐 Service URL: $RUN_URL"
echo ""
echo "📝 Next steps:"
echo "1. Update Stripe webhook endpoint to: ${RUN_URL}/webhooks/stripe"
echo "2. Update secrets with real values:"
echo "   echo 'sk_live_YOUR_ACTUAL_KEY' | gcloud secrets versions add stripe-secret-key --data-file=-"
echo "   echo 'whsec_YOUR_WEBHOOK_SECRET' | gcloud secrets versions add stripe-webhook-secret --data-file=-"
echo ""
echo "3. Deploy Firestore rules (see manual steps above)"
echo ""
echo "🧪 Test deployment:"
echo "curl -s ${RUN_URL}/healthz"
echo ""
echo "📱 Frontend environment variable:"
echo "VITE_API_BASE_URL=${RUN_URL}/api"