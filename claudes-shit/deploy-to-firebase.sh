#!/bin/bash

set -e

export PATH=$PATH:~/google-cloud-sdk/bin

echo "🚀 Starting Firebase Hosting deployment via API..."

# Get access token
ACCESS_TOKEN=$(gcloud auth print-access-token)
PROJECT_ID="diagnostic-pro-prod"
SITE_ID="diagnostic-pro-prod"
VERSION_ID="0512777172b243bb"

echo "📝 Populating files in version $VERSION_ID..."

# Function to upload a file
upload_file() {
    local file_path="$1"
    local relative_path="${file_path#dist/}"

    echo "Uploading: $relative_path"

    # Get SHA256 hash
    local file_hash=$(sha256sum "$file_path" | cut -d' ' -f1)

    # Upload file content
    curl -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "X-Goog-User-Project: $PROJECT_ID" \
        -H "Content-Type: application/octet-stream" \
        --data-binary "@$file_path" \
        "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID:populateFiles" \
        -d "{\"files\": {\"/$relative_path\": \"$file_hash\"}}"
}

# Upload all files recursively
find dist -type f | while read file; do
    upload_file "$file"
done

echo "📋 Updating version config..."

# Update version with config
curl -X PATCH \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID?updateMask=config" \
    -d '{
        "config": {
            "rewrites": [
                {
                    "glob": "**",
                    "path": "/index.html"
                }
            ],
            "headers": [
                {
                    "glob": "**/*.@(js|css)",
                    "headers": {
                        "Cache-Control": "public, max-age=31536000, immutable"
                    }
                },
                {
                    "glob": "index.html",
                    "headers": {
                        "Cache-Control": "no-cache"
                    }
                }
            ]
        }
    }'

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
echo "🚀 Releasing version to live..."

# Release the version
curl -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/releases" \
    -d "{\"version\": \"projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID\"}"

echo ""
echo "✅ Deployment complete!"
echo "🌐 Site available at: https://diagnostic-pro-prod.web.app"
echo "🌐 Site available at: https://diagnostic-pro-prod.firebaseapp.com"