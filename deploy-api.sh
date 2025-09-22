#!/bin/bash

set -e
export PATH=$PATH:~/google-cloud-sdk/bin

PROJECT_ID="diagnostic-pro-prod"
SITE_ID="diagnostic-pro-prod"
VERSION_ID="6727a3783b95988c"

echo "🚀 Deploying to Firebase Hosting: $SITE_ID"

ACCESS_TOKEN=$(gcloud auth print-access-token)

# Simple approach: Just populate index.html for now
INDEX_HASH=$(sha256sum dist/index.html | cut -d' ' -f1)

echo "📤 Populating index.html..."
curl -s -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID:populateFiles" \
    -d "{\"files\":{\"/index.html\":\"$INDEX_HASH\"}}"

echo ""
echo "🔧 Setting config..."
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

echo ""
echo "🔄 Finalizing..."
curl -s -X PATCH \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID?updateMask=status" \
    -d '{"status": "FINALIZED"}'

echo ""
echo "🚀 Releasing..."
curl -s -X POST \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "X-Goog-User-Project: $PROJECT_ID" \
    -H "Content-Type: application/json" \
    "https://firebasehosting.googleapis.com/v1beta1/projects/$PROJECT_ID/sites/$SITE_ID/releases" \
    -d "{\"version\": \"projects/$PROJECT_ID/sites/$SITE_ID/versions/$VERSION_ID\"}"

echo ""
echo "✅ Deployed to: https://$SITE_ID.web.app"