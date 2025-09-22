#!/bin/bash

set -e
export PATH=$PATH:~/google-cloud-sdk/bin

PROJECT_ID="diagnostic-pro-prod"
SITE_ID="diagnosticpro"
VERSION_ID="417694be2eba0847"

echo "🚀 Deploying to Firebase Hosting via API..."
echo "Project: $PROJECT_ID"
echo "Site: $SITE_ID"
echo "Version: $VERSION_ID"

# Get access token
ACCESS_TOKEN=$(gcloud auth print-access-token)

echo "📝 Creating file manifest..."

# Create file manifest
MANIFEST="{\"files\":{"

# Add all files to manifest
find dist -type f | while read file; do
    relative_path="${file#dist/}"
    if [[ "$relative_path" == "index.html" ]]; then
        relative_path="/index.html"
    else
        relative_path="/$relative_path"
    fi

    file_hash=$(sha256sum "$file" | cut -d' ' -f1)
    echo "Adding: $relative_path ($file_hash)"

    if [[ "$MANIFEST" == *"\"files\":{" ]]; then
        MANIFEST="$MANIFEST\"$relative_path\":\"$file_hash\""
    else
        MANIFEST="$MANIFEST,\"$relative_path\":\"$file_hash\""
    fi
done

MANIFEST="$MANIFEST}}"

echo "📤 Uploading file manifest..."

# Populate files
curl -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID:populateFiles" \
    -d "$MANIFEST"

echo ""
echo "📤 Uploading file contents..."

# Upload each file
find dist -type f | while read file; do
    relative_path="${file#dist/}"
    if [[ "$relative_path" == "index.html" ]]; then
        url_path="/index.html"
    else
        url_path="/$relative_path"
    fi

    # URL encode the path
    url_path=$(echo "$url_path" | sed 's/\//%2F/g')

    echo "Uploading content: $file -> $url_path"

    # Determine content type
    if [[ "$file" == *.html ]]; then
        content_type="text/html"
    elif [[ "$file" == *.js ]]; then
        content_type="application/javascript"
    elif [[ "$file" == *.css ]]; then
        content_type="text/css"
    elif [[ "$file" == *.jpg ]] || [[ "$file" == *.jpeg ]]; then
        content_type="image/jpeg"
    elif [[ "$file" == *.svg ]]; then
        content_type="image/svg+xml"
    elif [[ "$file" == *.ico ]]; then
        content_type="image/x-icon"
    else
        content_type="application/octet-stream"
    fi

    curl -X POST \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "X-Goog-User-Project: $PROJECT_ID" \
        -H "Content-Type: $content_type" \
        --data-binary "@$file" \
        "https://upload-firebasehosting.googleapis.com/upload/sites/$SITE_ID/versions/$VERSION_ID/files$url_path"

    echo ""
done

echo "🔧 Setting version configuration..."

# Update version config
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

# Finalize version
curl -X PATCH \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID?updateMask=status" \
    -d '{"status": "FINALIZED"}'

echo ""
echo "🚀 Releasing version..."

# Release version
curl -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/releases" \
    -d "{\"version\": \"projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID\"}"

echo ""
echo "✅ Deployment complete!"
echo "🌐 Site URL: https://diagnosticpro.web.app"
echo "🌐 Alt URL: https://diagnosticpro.firebaseapp.com"