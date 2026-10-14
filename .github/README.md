# GitHub Configuration

[![Intent Solutions: Claude Partner Network Select Services Partner](https://raw.githubusercontent.com/intent-solutions-io/.github/b82af5d3e7951d85e39ea9e65cc24ee8278722a7/assets/brand/claude-select-partner.svg)](https://intentsolutions.io/)

Intent Solutions is a Claude Partner Network Select Services Partner.

GitHub Actions workflows, automation scripts, and CI/CD pipelines for DiagnosticPro.

## Overview

This directory contains all GitHub Actions workflows and automation scripts for continuous integration, deployment, and security management.

---

## 📁 Structure

```
.github/
├── workflows/           # GitHub Actions workflow definitions
│   ├── ci.yml          # CI/CD pipeline (tests, builds, validation)
│   └── deploy-cloudrun.yml  # Cloud Run deployment with WIF
├── scripts/            # Automation scripts
├── ISSUE_TEMPLATE/     # Issue templates
├── CODEOWNERS          # Code ownership rules
└── README.md           # This file
```

---

## 🔄 Workflows

### 1. **CI/CD Pipeline** (`ci.yml`)

**Trigger:** Push or PR to `main` branch

**Jobs:**
- `frontend-test` - Test and build React frontend
  - Install dependencies
  - Run Jest tests
  - Build production bundle

- `backend-test` - Validate backend services
  - Install dependencies
  - Verify PDF generator
  - Check Node.js compatibility

- `firebase-functions-test` - Test Firebase Functions
  - Install dependencies
  - Build TypeScript functions
  - Verify deployment readiness

**Status:** ✅ Active

---

### 2. **Cloud Run Deployment** (`deploy-cloudrun.yml`)

**Trigger:**
- Push to `main` branch (automatic)
- Manual trigger via `workflow_dispatch`

**Authentication:** Workload Identity Federation (WIF) - Keyless authentication

**Configuration:**
```yaml
Workload Identity Provider:
  projects/298932670545/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider

Service Account:
  github-actions-deployer@diagnostic-pro-prod.iam.gserviceaccount.com

Permissions:
  - roles/run.admin
  - roles/secretmanager.secretAccessor
  - roles/iam.serviceAccountUser
```

**Deployment Steps:**
1. Authenticate to Google Cloud via OIDC (no keys required)
2. Set up Cloud SDK
3. Deploy backend to Cloud Run with:
   - Source: `./02-src/backend/services/backend`
   - Region: `us-central1`
   - Secrets from Google Secret Manager:
     - `STRIPE_SECRET_KEY`
     - `STRIPE_WEBHOOK_SECRET`
     - `FIREBASE_API_KEY`
   - Auto-scaling: 0-10 instances
   - Resources: 512Mi RAM, 1 CPU
   - Timeout: 540s

**Status:** ✅ Active

**Manual Trigger:**
```bash
# Via GitHub UI
1. Go to Actions tab
2. Select "Deploy to Cloud Run"
3. Click "Run workflow"

# Via GitHub CLI
gh workflow run deploy-cloudrun.yml
```

---

## 🔐 Security Architecture

### Workload Identity Federation (WIF)

**Why WIF?**
- ✅ No service account JSON keys in GitHub secrets
- ✅ Short-lived tokens (auto-expiring)
- ✅ Keyless authentication
- ✅ Fine-grained IAM permissions
- ✅ Audit logging

**Setup Details:**
- **Pool:** `github-actions-pool`
- **Provider:** `github-provider` (OIDC)
- **Issuer:** `https://token.actions.githubusercontent.com`
- **Condition:** `assertion.repository_owner=='jeremylongshore'`

**Service Account Roles:**
```
github-actions-deployer@diagnostic-pro-prod.iam.gserviceaccount.com
├── roles/iam.workloadIdentityUser
├── roles/run.admin
├── roles/secretmanager.secretAccessor
└── roles/iam.serviceAccountUser
```

### Google Secret Manager Integration

**Secrets Stored:**
- `FIREBASE_API_KEY` - Firebase authentication
- `API_GATEWAY_KEY` - API Gateway access
- `STRIPE_SECRET_KEY` - Stripe payment processing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification

**Runtime Injection:**
Secrets are injected into Cloud Run at deployment time using:
```yaml
--set-secrets="SECRET_NAME=SECRET_NAME:latest"
```

Backend application fetches secrets via `@google-cloud/secret-manager` SDK with 1-hour caching.

---

## 🛠️ Scripts

### Automation Scripts (`scripts/`)

Currently contains README placeholder for future automation scripts:
- Audit automation (planned)
- Maintenance automation (planned)
- Release automation (planned)

---

## 🚀 Usage

### Running CI Pipeline Locally

**Frontend Tests:**
```bash
cd 02-src/frontend
npm ci
npm test
npm run build
```

**Backend Validation:**
```bash
cd 02-src/backend/services/backend
npm ci
node -e "const {generateDiagnosticProPDF} = require('./reportPdfProduction.js'); console.log('PDF generator loaded');"
```

**Firebase Functions:**
```bash
cd functions
npm ci
npm run build
```

### Deploying to Cloud Run

**Automatic Deployment:**
Push to `main` branch triggers automatic deployment via GitHub Actions.

**Manual Deployment:**
```bash
# Using gcloud CLI
gcloud run deploy diagnosticpro-vertex-ai-backend \
  --source ./02-src/backend/services/backend \
  --region us-central1 \
  --project diagnostic-pro-prod \
  --set-secrets="STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest,FIREBASE_API_KEY=FIREBASE_API_KEY:latest"

# Or trigger GitHub Actions workflow
gh workflow run deploy-cloudrun.yml
```

---

## 📊 Monitoring

### Workflow Status
View workflow runs:
- **Web:** https://github.com/jeremylongshore/DiagnosticPro/actions
- **CLI:** `gh run list`

### Deployment Logs
```bash
# Cloud Run logs
gcloud logging read "resource.type=\"cloud_run_revision\" \
  AND resource.labels.service_name=\"diagnosticpro-vertex-ai-backend\"" \
  --project diagnostic-pro-prod \
  --limit 50

# GitHub Actions logs
gh run view <run-id> --log
```

### Secret Access Audit
```bash
# View secret access logs
gcloud logging read "resource.type=\"secretmanager.googleapis.com/Secret\" \
  AND protoPayload.methodName=\"google.cloud.secretmanager.v1.SecretManagerService.AccessSecretVersion\"" \
  --project diagnostic-pro-prod \
  --limit 50
```

---

## 🔧 Maintenance

### Updating Secrets
```bash
# Add new version of secret
echo "NEW_SECRET_VALUE" | gcloud secrets versions add SECRET_NAME \
  --project=diagnostic-pro-prod \
  --data-file=-

# Next deployment will automatically use latest version
```

### Rotating Service Account
```bash
# Create new service account
gcloud iam service-accounts create github-actions-deployer-v2 \
  --project=diagnostic-pro-prod

# Update WIF binding
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-deployer-v2@diagnostic-pro-prod.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/298932670545/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/jeremylongshore/DiagnosticPro"

# Update workflow file with new service account
```

### Disabling Workflow
```bash
# Disable workflow via GitHub UI
# Or add condition to workflow:
if: false  # Temporarily disable workflow
```

---

## 📖 Related Documentation

- [Security Setup Guide](../SECURITY_SETUP.md) - Complete security architecture
- [Security Quick Reference](../SECURITY_QUICK_REFERENCE.md) - Quick commands
- [Main README](../README.md) - Project overview
- [CLAUDE.md](../CLAUDE.md) - Development guidelines

---

## 🔍 Troubleshooting

### Workflow Fails on Authentication
**Issue:** `Error: google-github-actions/auth failed`

**Solution:**
1. Verify WIF configuration:
   ```bash
   gcloud iam workload-identity-pools describe github-actions-pool \
     --project=diagnostic-pro-prod \
     --location=global
   ```
2. Check service account permissions
3. Verify repository owner matches condition (`jeremylongshore`)

### Secret Not Found
**Issue:** `Failed to access secret: NOT_FOUND`

**Solution:**
1. Verify secret exists:
   ```bash
   gcloud secrets list --project=diagnostic-pro-prod
   ```
2. Check service account has `secretmanager.secretAccessor` role
3. Ensure secret name matches in deployment command

### Cloud Run Deployment Timeout
**Issue:** Deployment takes > 10 minutes

**Solution:**
1. Check Cloud Build logs
2. Verify source directory path is correct
3. Ensure `package.json` exists in source directory
4. Check for large files in source (use `.gcloudignore`)

---

## 🎯 Best Practices

1. **Never commit secrets** - Use Secret Manager
2. **Test locally first** - Run CI checks before pushing
3. **Use WIF** - Avoid service account keys
4. **Monitor deployments** - Check logs after each deploy
5. **Keep workflows simple** - One responsibility per workflow
6. **Version your workflows** - Use tagged actions (`@v4`)
7. **Document changes** - Update this README when adding workflows

---

## 📞 Support

- **GCP Console:** https://console.cloud.google.com/run?project=diagnostic-pro-prod
- **GitHub Actions:** https://github.com/jeremylongshore/DiagnosticPro/actions
- **Secret Manager:** https://console.cloud.google.com/security/secret-manager?project=diagnostic-pro-prod

---

**Last Updated:** 2025-11-20
**Maintained By:** Jeremy Longshore
**Project:** DiagnosticPro (diagnostic-pro-prod)
