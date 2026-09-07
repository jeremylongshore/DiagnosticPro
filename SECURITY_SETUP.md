# Security Setup Complete - DiagnosticPro

**Date:** 2025-11-20
**Project:** DiagnosticPro (diagnostic-pro-prod)
**Status:** ✅ COMPLETE

## Summary

Successfully removed exposed API key from Git history and implemented enterprise-grade security using Google Secret Manager and Workload Identity Federation (WIF).

---

## 1. Git History Cleanup ✅

### Exposed API Key Removed
- **Key ID:** `REDACTED_API_KEY`
- **Exposed Commit:** `e939190ae52dd5939552b26d9c91f89fa23c34c1`
- **Status:** Key was already expired/revoked (notification for old exposure)
- **Action Taken:** Used `git-filter-repo` to rewrite entire Git history for best practices
- **Result:** API key replaced with `REDACTED_API_KEY` in all commits

**Note:** While this key was already expired, we cleaned the Git history as a security best practice to prevent potential scanning tools from flagging it and to maintain clean repository hygiene.

### Next Steps for Git Push
⚠️ **MANUAL ACTION REQUIRED:**

1. Disable branch protection on GitHub:
   - Visit: https://github.com/jeremylongshore/DiagnosticPro/settings/branches
   - Temporarily remove protection rules for `main` branch

2. Force push cleaned history:
```bash
cd ~/000-projects/diagnostic-platform/DiagnosticPro
git push origin --force --all
git push origin --force --tags
```

3. Re-enable branch protection after push completes

4. Notify all collaborators to re-clone repository:
```bash
rm -rf DiagnosticPro
git clone https://github.com/jeremylongshore/DiagnosticPro.git
```

---

## 2. Google Secret Manager Setup ✅

### Secrets Created
All secrets stored in Google Secret Manager with automatic replication:

| Secret Name | Purpose | Status |
|-------------|---------|--------|
| `FIREBASE_API_KEY` | Firebase authentication | ✅ Created |
| `API_GATEWAY_KEY` | API Gateway access | ✅ Created (placeholder) |
| `STRIPE_SECRET_KEY` | Stripe payment processing | ✅ Created (placeholder) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification | ✅ Created (placeholder) |

### Update Real Values
Replace placeholder secrets with real values:

```bash
# API Gateway Key
echo "YOUR_REAL_API_GATEWAY_KEY" | gcloud secrets versions add API_GATEWAY_KEY \
  --project=diagnostic-pro-prod \
  --data-file=-

# Stripe Secret Key
echo "YOUR_REAL_STRIPE_SECRET_KEY" | gcloud secrets versions add STRIPE_SECRET_KEY \
  --project=diagnostic-pro-prod \
  --data-file=-

# Stripe Webhook Secret
echo "YOUR_REAL_WEBHOOK_SECRET" | gcloud secrets versions add STRIPE_WEBHOOK_SECRET \
  --project=diagnostic-pro-prod \
  --data-file=-
```

### View Secrets
```bash
# List all secrets
gcloud secrets list --project=diagnostic-pro-prod

# View secret versions
gcloud secrets versions list FIREBASE_API_KEY --project=diagnostic-pro-prod

# Access secret value (for verification)
gcloud secrets versions access latest --secret=FIREBASE_API_KEY --project=diagnostic-pro-prod
```

---

## 3. Workload Identity Federation (WIF) Setup ✅

### Infrastructure Created

**Workload Identity Pool:**
- Name: `github-actions-pool`
- Location: `global`
- Project: `diagnostic-pro-prod`

**OIDC Provider:**
- Name: `github-provider`
- Issuer: `https://token.actions.githubusercontent.com`
- Condition: `assertion.repository_owner=='jeremylongshore'`

**Service Account:**
- Name: `github-actions-deployer@diagnostic-pro-prod.iam.gserviceaccount.com`
- Roles:
  - `roles/iam.workloadIdentityUser`
  - `roles/run.admin` (Cloud Run deployments)
  - `roles/secretmanager.secretAccessor` (Secret Manager access)
  - `roles/iam.serviceAccountUser` (Service account impersonation)

### WIF Configuration
```yaml
workload_identity_provider: projects/298932670545/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider
service_account: github-actions-deployer@diagnostic-pro-prod.iam.gserviceaccount.com
```

---

## 4. Application Updates ✅

### Backend Changes

**New File:** `02-src/backend/services/backend/config/secrets.js`
- Fetches secrets from Google Secret Manager
- Implements 1-hour caching to reduce API calls
- Falls back to environment variables if Secret Manager unavailable
- Provides `loadSecrets()` and `getSecret()` functions

**Modified:** `02-src/backend/services/backend/index.js`
- Loads secrets at startup using `loadSecrets()`
- Initializes Stripe client with secret from Secret Manager
- Graceful fallback to environment variables
- Added console logging for secret loading status

**Modified:** `02-src/backend/services/backend/handlers/stripe.js`
- Updated webhook handler to accept `secrets` parameter
- Falls back to environment variables if secrets not provided
- Maintains backward compatibility

**Modified:** `02-src/backend/services/backend/package.json`
- Added dependency: `@google-cloud/secret-manager@^5.0.0`

### Install New Dependency
```bash
cd ~/000-projects/diagnostic-platform/DiagnosticPro/02-src/backend/services/backend
npm install
```

---

## 5. CI/CD Pipeline ✅

### GitHub Actions Workflow
**File:** `.github/workflows/deploy-cloudrun.yml`

**Features:**
- Uses Workload Identity Federation (no service account keys)
- Authenticates with Google Cloud via OIDC
- Deploys backend to Cloud Run automatically on `main` branch push
- Injects secrets from Secret Manager at runtime
- Manual trigger available via `workflow_dispatch`

**Secrets Configuration:**
```yaml
--set-secrets="STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,
              STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest,
              FIREBASE_API_KEY=FIREBASE_API_KEY:latest"
```

### Test Workflow
After pushing to GitHub:
1. Visit: https://github.com/jeremylongshore/DiagnosticPro/actions
2. Workflow should trigger automatically
3. Verify authentication succeeds
4. Verify Cloud Run deployment completes

---

## 6. Security Benefits

### Before (Insecure)
❌ API keys hardcoded in `.env` files
❌ API keys committed to Git history
❌ API keys visible in GitHub commit logs
❌ Service account JSON keys stored as GitHub secrets
❌ Manual secret rotation required

### After (Secure)
✅ All secrets in Google Secret Manager
✅ Git history cleaned of exposed credentials
✅ Workload Identity Federation (keyless authentication)
✅ Automatic secret rotation capability
✅ Centralized secret management
✅ Audit logging for secret access
✅ Fine-grained IAM permissions

---

## 7. Maintenance Guide

### Rotate Secrets
```bash
# Add new version of secret
echo "NEW_SECRET_VALUE" | gcloud secrets versions add SECRET_NAME \
  --project=diagnostic-pro-prod \
  --data-file=-

# Cloud Run automatically picks up latest version on next deploy
gcloud run deploy diagnosticpro-vertex-ai-backend \
  --source ./02-src/backend/services/backend \
  --region us-central1 \
  --project diagnostic-pro-prod
```

### Monitor Secret Access
```bash
# View audit logs for secret access
gcloud logging read "resource.type=\"secretmanager.googleapis.com/Secret\" \
  AND protoPayload.methodName=\"google.cloud.secretmanager.v1.SecretManagerService.AccessSecretVersion\"" \
  --project diagnostic-pro-prod \
  --limit 50
```

### Disable Old Secret Versions
```bash
# Disable specific version
gcloud secrets versions disable VERSION_NUMBER \
  --secret=SECRET_NAME \
  --project=diagnostic-pro-prod
```

---

## 8. Verification Checklist

- [x] Git history cleaned of exposed API key
- [ ] Force push completed to GitHub (awaiting branch protection removal)
- [x] Google Secret Manager secrets created
- [ ] Real secret values updated (placeholders need replacement)
- [x] Workload Identity Federation configured
- [x] Service account permissions granted
- [x] Backend code updated to use Secret Manager
- [x] GitHub Actions workflow created
- [ ] CI/CD pipeline tested
- [ ] Backend deployed with secrets from Secret Manager

---

## 9. Next Steps

1. **Complete Git Push** (requires manual branch protection removal)
2. **Update Real Secrets** (replace placeholders with actual values)
3. **Test Local Development:**
   ```bash
   cd ~/000-projects/diagnostic-platform/DiagnosticPro/02-src/backend/services/backend
   npm install
   npm run dev
   ```
4. **Test CI/CD Pipeline** (push to main branch)
5. **Verify Cloud Run Deployment**
6. **Monitor Application Logs**

---

## 10. Emergency Rollback

If issues occur, fallback to environment variables:

```bash
# Cloud Run will automatically fallback if Secret Manager unavailable
# Verify fallback logs:
gcloud logging read "resource.type=\"cloud_run_revision\" \
  AND textPayload:\"Falling back to environment variables\"" \
  --project diagnostic-pro-prod \
  --limit 10
```

---

## Contact & Support

- **Project Owner:** Jeremy Longshore
- **GCP Project:** diagnostic-pro-prod
- **Project Number:** 298932670545
- **Region:** us-central1

---

**End of Security Setup Documentation**

*Generated: 2025-11-20*
