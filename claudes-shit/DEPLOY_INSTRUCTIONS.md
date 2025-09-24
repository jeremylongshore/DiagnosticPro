# 🚀 Manual Deployment Instructions

Since Firebase CLI authentication requires interactive mode, please run these commands manually:

## Prerequisites
```bash
cd /home/jeremy/projects/diagnostic-platform/DiagnosticPro
```

## Step 1: Authenticate Firebase CLI
```bash
firebase login
```
(This will open a browser - sign in with your Google account)

## Step 2: Deploy Cloud Functions
```bash
# Build functions
cd functions && npm run build

# Deploy to production
cd .. && firebase deploy --only functions --project diagnostic-pro-prod
```

## Step 3: Test the analyzeDiagnostic Function
```bash
# Get the function URL and test
curl -X POST "https://us-central1-diagnostic-pro-prod.cloudfunctions.net/analyzeDiagnostic" \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": "test-123",
    "diagnosticData": {
      "make": "Toyota",
      "model": "Camry",
      "year": "2020",
      "problemDescription": "Engine rattling noise",
      "errorCodes": "P0301",
      "shopQuoteAmount": 1200
    }
  }'
```

## Step 4: Deploy Frontend (if test passes)
```bash
# Build frontend
npm run build

# Deploy hosting
firebase deploy --only hosting --project diagnostic-pro-prod
```

## Step 5: View Logs (if issues)
```bash
# View function logs
firebase functions:log --project diagnostic-pro-prod --only analyzeDiagnostic --limit 50
```

## Expected Results

### Successful Function Response:
```json
{
  "success": true,
  "analysis": "🎯 1. PRIMARY DIAGNOSIS...[full analysis]",
  "submissionId": "test-123"
}
```

### Function URLs After Deployment:
- `analyzeDiagnostic`: https://us-central1-diagnostic-pro-prod.cloudfunctions.net/analyzeDiagnostic
- `health`: https://us-central1-diagnostic-pro-prod.cloudfunctions.net/health

## Troubleshooting

### If you get authentication errors:
```bash
firebase login --reauth
```

### If function deployment fails:
```bash
# Check project access
firebase projects:list

# Ensure you're targeting the right project
firebase use diagnostic-pro-prod
```

### If Vertex AI errors occur:
```bash
# Check if Vertex AI API is enabled
gcloud services list --enabled --project diagnostic-pro-prod | grep aiplatform
```

## Next Steps After Successful Deployment

1. **Update Frontend**: Replace Supabase calls with Firebase Functions
2. **Test Full Flow**: Payment → Analysis → Email delivery
3. **Production Launch**: Point diagnosticpro.io to Firebase Hosting
4. **Cleanup**: Remove Supabase dependencies

---
**Status**: Ready for manual deployment
**Created**: September 22, 2025