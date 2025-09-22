#!/bin/bash

set -e
export PATH=$PATH:~/google-cloud-sdk/bin

echo "🚀 Simple Firebase Hosting deployment test..."

ACCESS_TOKEN=$(gcloud auth print-access-token)
PROJECT_ID="diagnostic-pro-prod"
SITE_ID="diagnostic-pro-prod"

echo "📝 Creating new version..."

# Create a new version
VERSION_RESPONSE=$(curl -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/versions" \
    -d '{}')

echo "Version response: $VERSION_RESPONSE"

# Extract version ID
VERSION_ID=$(echo $VERSION_RESPONSE | grep -o '"name":"[^"]*' | cut -d'"' -f4 | cut -d'/' -f6)
echo "Version ID: $VERSION_ID"

# Get file hash
INDEX_HASH=$(sha256sum dist/index.html | cut -d' ' -f1)
echo "Index.html hash: $INDEX_HASH"

echo "📤 Uploading files..."

# Populate files (simplified approach)
POPULATE_RESPONSE=$(curl -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID:populateFiles" \
    -d "{\"files\":{\"/index.html\":\"$INDEX_HASH\"}}")

echo "Populate response: $POPULATE_RESPONSE"

# Upload the actual file content
echo "📤 Uploading index.html content..."
curl -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: text/html" \
    --data-binary "@dist/index.html" \
    "https://upload-firebasehosting.googleapis.com/upload/sites/$SITE_ID/versions/$VERSION_ID/files/%2Findex.html"

echo ""
echo "🔄 Finalizing version..."

# Finalize the version
curl -X PATCH \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID?updateMask=status" \
    -d '{"status": "FINALIZED"}'

echo ""
echo "🚀 Releasing version..."

# Release the version
curl -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/releases" \
    -d "{\"version\": \"projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID\"}"

echo ""
echo "✅ Simple deployment complete!"
echo "🌐 Site available at: https://diagnostic-pro-prod.web.app"