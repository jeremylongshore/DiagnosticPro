#!/bin/bash

# Setup Google Cloud Storage bucket for diagnostic reports
# Creates bucket with proper security and lifecycle policies

set -e

PROJECT_ID=${PROJECT_ID:-"diagnostic-pro-prod"}
BUCKET_NAME="${PROJECT_ID}-diagnostic-reports"
REGION=${REGION:-"us-central1"}

echo "☁️ Setting up Google Cloud Storage bucket for diagnostic reports"
echo "Project: $PROJECT_ID"
echo "Bucket: $BUCKET_NAME"
echo "Region: $REGION"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: gcloud is not authenticated"
    echo "Run: gcloud auth login"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable Cloud Storage API
echo "📡 Enabling Cloud Storage API..."
gcloud services enable storage.googleapis.com

# Check if bucket already exists
if gsutil ls -b gs://$BUCKET_NAME &>/dev/null; then
    echo "✅ Bucket gs://$BUCKET_NAME already exists"
else
    echo "🪣 Creating Cloud Storage bucket..."
    gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://$BUCKET_NAME
fi

# Set bucket permissions (private by default)
echo "🔒 Setting bucket permissions..."
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME 2>/dev/null || true
gsutil iam ch -d allUsers:objectViewer gs://$BUCKET_NAME

# Enable uniform bucket-level access
echo "🛡️ Enabling uniform bucket-level access..."
gsutil uniformbucketlevelaccess set on gs://$BUCKET_NAME

# Set lifecycle policy for automatic cleanup
echo "♻️ Setting lifecycle policy..."
cat > /tmp/lifecycle.json << EOF
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

gsutil lifecycle set /tmp/lifecycle.json gs://$BUCKET_NAME
rm /tmp/lifecycle.json

# Set CORS policy for frontend downloads
echo "🌐 Setting CORS policy..."
cat > /tmp/cors.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "responseHeader": ["Content-Type", "Content-Disposition"],
    "maxAgeSeconds": 3600
  }
]
EOF

gsutil cors set /tmp/cors.json gs://$BUCKET_NAME
rm /tmp/cors.json

# Create folder structure
echo "📁 Creating folder structure..."
echo "Reports will be stored in: reports/YYYY-MM-DD/"
gsutil -q stat gs://$BUCKET_NAME/reports/.gitkeep 2>/dev/null || echo "" | gsutil cp - gs://$BUCKET_NAME/reports/.gitkeep

# Update the bucket name secret
echo "🔐 Updating gcs-bucket-name secret..."
echo "$BUCKET_NAME" | gcloud secrets versions add gcs-bucket-name --data-file=- --project=$PROJECT_ID

echo ""
echo "✅ Cloud Storage setup complete!"
echo ""
echo "📝 Bucket details:"
echo "Name: $BUCKET_NAME"
echo "Region: $REGION"
echo "Access: Private with signed URLs"
echo "Lifecycle: Delete after 90 days"
echo ""
echo "🔗 Bucket URL: https://storage.googleapis.com/$BUCKET_NAME"
echo ""
echo "📝 Test commands:"
echo "gsutil ls gs://$BUCKET_NAME"
echo "gsutil cp test-file.pdf gs://$BUCKET_NAME/reports/test-file.pdf"