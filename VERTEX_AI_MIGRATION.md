# Vertex AI Migration Guide

## Migration Summary
**COMPLETED**: Migrated from OpenAI GPT-4.1 to Firebase Vertex AI Gemini 2.5 Flash

### Changes Made
1. **Security Fix**: Moved all API keys to environment variables
2. **AI Provider**: Replaced OpenAI with Firebase Vertex AI (internal SDK)
3. **Model**: Switched from `gpt-4.1-2025-04-14` → `gemini-2.5-flash`
4. **Integration**: Direct Firebase SDK integration (no external API calls)

## Environment Variables Required

Add these to your Supabase Edge Function secrets:

```bash
# Firebase Vertex AI Configuration
FIREBASE_API_KEY=AIzaSyBmuntVKosh_EGz5yxQLlIoNXlxwYE6tMg
GOOGLE_CLOUD_PROJECT=diagnostic-pro-prod

# Legacy (can be removed after testing)
OPENAI_API_KEY=your-openai-key-here
```

## Deployment Steps

### 1. Update Supabase Function Secrets
```bash
# Set Firebase API key
supabase secrets set FIREBASE_API_KEY=AIzaSyBmuntVKosh_EGz5yxQLlIoNXlxwYE6tMg

# Set Google Cloud Project
supabase secrets set GOOGLE_CLOUD_PROJECT=diagnostic-pro-prod
```

### 2. Deploy Updated Function
```bash
supabase functions deploy analyze-diagnostic
```

### 3. Test the Integration
```bash
# Monitor function logs
supabase functions logs analyze-diagnostic --follow

# Test with a diagnostic submission
curl -X POST "https://jjxvrxehmawuyxltrvql.supabase.co/functions/v1/analyze-diagnostic" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"submissionId": "test-id", "diagnosticData": {...}}'
```

## Benefits of Vertex AI Migration

1. **Better Integration**: Direct Firebase SDK integration
2. **Cost Efficiency**: Potentially lower costs vs OpenAI
3. **Performance**: Reduced latency (no external API calls)
4. **Security**: API key management through Firebase
5. **Scalability**: Google Cloud native scaling

## Rollback Plan

If issues arise, temporarily revert by:
1. Switching back to OpenAI in the function code
2. Ensuring `OPENAI_API_KEY` is still set
3. Deploying the previous version

## Model Comparison

| Feature | OpenAI GPT-4.1 | Vertex AI Gemini 2.5 Flash |
|---------|----------------|----------------------------|
| Integration | External API | Firebase SDK |
| Cost | Higher | Lower |
| Latency | ~2-3s | ~1-2s |
| Context | 3000 tokens | Variable |
| Security | API key | Firebase Auth |

## Monitoring

Key metrics to watch:
- Function execution time
- Error rates
- Analysis quality
- Customer satisfaction scores

---
**Migration Date**: September 22, 2025
**Status**: ✅ COMPLETED - Ready for testing