# Firestore Migration Guide

## Migration Summary
**COMPLETED**: Migrated analyze-diagnostic function from Supabase to Firebase Firestore + Cloud Functions

### Key Changes
1. **Database**: Supabase PostgreSQL → Firebase Firestore
2. **Functions**: Supabase Edge Functions → Firebase Cloud Functions
3. **AI**: Still using Firebase Vertex AI Gemini 2.5 Flash
4. **Collections**: `orders` collection for storing analysis results

## New Architecture

### Before (Supabase)
```
Frontend → Supabase Edge Function → OpenAI API → PostgreSQL
```

### After (Firebase)
```
Frontend → Firebase Cloud Function → Vertex AI → Firestore
```

## Firestore Collections

### `orders` Collection
```typescript
{
  submissionId: string;           // Document ID
  analysisCompletedAt: Timestamp; // When analysis finished
  analysis: string;               // Full AI analysis text
  processingStatus: 'completed'; // Status indicator
  // ... other order fields
}
```

### `diagnosticSubmissions` Collection
```typescript
{
  make: string;
  model: string;
  year: string;
  equipmentType: string;
  problemDescription: string;
  errorCodes: string;
  shopQuoteAmount: number;
  // ... other diagnostic fields
}
```

## Deployment Steps

### 1. Install Dependencies
```bash
cd functions
npm install
```

### 2. Set Environment Variables
```bash
# Set Firebase API key for Vertex AI
firebase functions:config:set vertex.api_key="AIzaSyBmuntVKosh_EGz5yxQLlIoNXlxwYE6tMg"
firebase functions:config:set vertex.project_id="diagnostic-pro-prod"
```

### 3. Deploy Cloud Functions
```bash
# Build and deploy
npm run build
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:analyzeDiagnostic
```

### 4. Test the Function
```bash
# Get function URL
firebase functions:list

# Test endpoint
curl -X POST "https://us-central1-diagnostic-pro-prod.cloudfunctions.net/analyzeDiagnostic" \
  -H "Content-Type: application/json" \
  -d '{
    "submissionId": "test-123",
    "diagnosticData": {
      "make": "Toyota",
      "model": "Camry",
      "year": "2020",
      "problemDescription": "Engine rattling noise",
      "errorCodes": "P0301"
    }
  }'
```

## Frontend Integration Changes

### Before (Supabase)
```typescript
const { data, error } = await supabase.functions.invoke('analyze-diagnostic', {
  body: { submissionId, diagnosticData }
});
```

### After (Firebase)
```typescript
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

const analyzeDiagnostic = httpsCallable(functions, 'analyzeDiagnostic');
const result = await analyzeDiagnostic({ submissionId, diagnosticData });
```

## Security Rules

### Firestore Security Rules
Update `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Orders collection - users can read their own orders
    match /orders/{orderId} {
      allow read: if request.auth != null &&
                     resource.data.userId == request.auth.uid;
      allow write: if false; // Only Cloud Functions can write
    }

    // Diagnostic submissions
    match /diagnosticSubmissions/{submissionId} {
      allow read, write: if request.auth != null &&
                           resource.data.userId == request.auth.uid;
    }
  }
}
```

## Monitoring

### Cloud Function Logs
```bash
# View function logs
firebase functions:log --only analyzeDiagnostic

# Follow logs in real-time
firebase functions:log --only analyzeDiagnostic --follow
```

### Firestore Monitoring
- Check Firebase Console → Firestore → Usage tab
- Monitor read/write operations
- Check security rule evaluations

## Function URLs

After deployment, functions will be available at:
- `analyzeDiagnostic`: `https://us-central1-diagnostic-pro-prod.cloudfunctions.net/analyzeDiagnostic`
- `health`: `https://us-central1-diagnostic-pro-prod.cloudfunctions.net/health`

## Benefits of Migration

1. **Unified Platform**: Everything in Firebase ecosystem
2. **Better Integration**: Native Firestore + Cloud Functions
3. **Scalability**: Auto-scaling Cloud Functions
4. **Cost Efficiency**: Pay-per-use vs Supabase subscription
5. **Security**: Firebase security rules + IAM

## Migration Checklist

- [x] Create Firebase Cloud Functions
- [x] Migrate analyze-diagnostic function logic
- [x] Update database operations for Firestore
- [x] Configure TypeScript build
- [x] Update firebase.json configuration
- [ ] Deploy functions to production
- [ ] Test with real diagnostic data
- [ ] Update frontend to call Cloud Functions
- [ ] Remove Supabase dependencies

## Rollback Plan

If issues arise:
1. Keep Supabase Edge Functions temporarily
2. Switch frontend back to Supabase endpoints
3. Debug Firestore issues separately
4. Gradual migration approach

---
**Migration Date**: September 22, 2025
**Status**: ✅ Code Complete - Ready for deployment testing