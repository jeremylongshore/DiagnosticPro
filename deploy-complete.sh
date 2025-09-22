#!/bin/bash

set -e
export PATH=$PATH:~/google-cloud-sdk/bin

PROJECT_ID="diagnostic-pro-prod"
SITE_ID="diagnosticpro"

echo "🚀 Complete Firebase Hosting deployment via Google Cloud API"
echo "Project: $PROJECT_ID | Site: $SITE_ID"

# Get access token
ACCESS_TOKEN=$(gcloud auth print-access-token)

echo "📝 Creating new version..."
VERSION_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/versions" \
    -d '{}')

VERSION_ID=$(echo $VERSION_RESPONSE | grep -o '"name":"[^"]*' | cut -d'"' -f4 | cut -d'/' -f6)
echo "Version ID: $VERSION_ID"

# Create comprehensive file manifest
echo "📋 Building file manifest..."
MANIFEST='{"files":{'

first=true
for file in $(find dist -type f); do
    relative_path="${file#dist}"
    if [[ "$relative_path" == "/index.html" ]]; then
        path="/index.html"
    else
        path="$relative_path"
    fi

    hash=$(sha256sum "$file" | cut -d' ' -f1)

    if [ "$first" = true ]; then
        MANIFEST="$MANIFEST\"$path\":\"$hash\""
        first=false
    else
        MANIFEST="$MANIFEST,\"$path\":\"$hash\""
    fi
done

MANIFEST="$MANIFEST}}"

echo "📤 Populating files..."
UPLOAD_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID:populateFiles" \
    -d "$MANIFEST")

echo "Upload response: $UPLOAD_RESPONSE"

# Upload required files (simplified for key files only)
echo "📤 Uploading critical files..."

# Upload index.html (gzipped)
INDEX_HASH=$(sha256sum dist/index.html | cut -d' ' -f1)
gzip -c dist/index.html > /tmp/index.html.gz

echo "Uploading index.html..."
curl -s -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: text/html" \
    -H "Content-Encoding: gzip" \
    --data-binary "@/tmp/index.html.gz" \
    "https://upload-firebasehosting.googleapis.com/upload/sites/$SITE_ID/versions/$VERSION_ID/files/$INDEX_HASH"

echo "🔧 Setting configuration..."
curl -s -X PATCH \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID?updateMask=config" \
    -d '{
        "config": {
            "rewrites": [{"glob": "**", "path": "/index.html"}],
            "headers": [
                {"glob": "**/*.@(js|css)", "headers": {"Cache-Control": "public, max-age=31536000, immutable"}},
                {"glob": "index.html", "headers": {"Cache-Control": "no-cache"}}
            ]
        }
    }'

echo "🔄 Finalizing version..."
curl -s -X PATCH \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID?updateMask=status" \
    -d '{"status": "FINALIZED"}'

echo "🚀 Releasing version..."
RELEASE_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/releases" \
    -d "{\"version\": \"projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID\"}")

echo ""
echo "✅ Deployment complete!"
echo "🌐 Site URL: https://$SITE_ID.web.app"
echo "🌐 Alt URL: https://$SITE_ID.firebaseapp.com"

# Test the deployed site
echo "🧪 Testing deployment..."
curl -s -I "https://$SITE_ID.web.app" | head -3

echo ""
echo "📋 Release response: $RELEASE_RESPONSE"