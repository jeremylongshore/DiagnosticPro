# DiagnosticPro Current Secrets Audit

**Audit Date:** 2025-09-17
**Purpose:** Document all secrets and API keys for GCP migration
**Status:** MIGRATION_PLANNING

---

## 🔍 Current Configuration Analysis

### Supabase Configuration
**Source:** `fix-it-detective-ai/.env`

```bash
# Supabase Project Details
VITE_SUPABASE_PROJECT_ID="jjxvrxehmawuyxltrvql"
VITE_SUPABASE_URL="https://jjxvrxehmawuyxltrvql.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqeHZyeGVobWF3dXl4bHRydnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNzUxNzMsImV4cCI6MjA3MDk1MTE3M30.lZVeWlfnHHcXUq-i3c6V23R_ibUZJpELPhU-7W6lR3Q"
```

### OpenAI Configuration
**Source:** `supabase/functions/analyze-diagnostic/index.ts` (lines 19-24)

```typescript
const openAIKey = Deno.env.get('OPENAI_API_KEY');
// Model: gpt-4.1-2025-04-14
// Usage: Diagnostic analysis (2500 words max)
```

### Stripe Configuration
**Source:** `supabase/functions/stripe-webhook/index.ts` (lines 19-22)

```typescript
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
// Also references: STRIPE_SECRET_KEY (implied but not in visible code)
```

---

## 🔐 Required Secrets for Migration

### 1. Payment Processing (CRITICAL)
| Secret | Current Location | Migration Target | Priority |
|--------|------------------|------------------|----------|
| `STRIPE_SECRET_KEY` | Supabase Edge Function | GCP Secret Manager | HIGH |
| `STRIPE_WEBHOOK_SECRET` | Supabase Edge Function | GCP Secret Manager | HIGH |

**Location to Find:**
- Supabase Dashboard → Edge Functions → Environment Variables
- Stripe Dashboard → API Keys section

### 2. AI/ML Services
| Secret | Current Location | Migration Target | Priority |
|--------|------------------|------------------|----------|
| `OPENAI_API_KEY` | Supabase Edge Function | GCP Secret Manager | MEDIUM |

**Migration Note:** Will transition to Vertex AI, but keep OpenAI key for gradual migration

### 3. Email Services
| Secret | Current Location | Migration Target | Priority |
|--------|------------------|------------------|----------|
| `GMAIL_APP_PASSWORD` | Likely in Supabase | GCP Secret Manager | HIGH |
| `SMTP_HOST` | Hardcoded: smtp.gmail.com | Environment Variable | LOW |
| `SMTP_PORT` | Hardcoded: 587 | Environment Variable | LOW |

### 4. Database Migration
| Secret | Current Location | Migration Target | Priority |
|--------|------------------|------------------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard | GCP Secret Manager | HIGH |
| `SUPABASE_URL` | Known (documented above) | Config | LOW |

---

## 🎯 Secret Extraction Plan

### Phase 1: Immediate Extraction (Required for Migration)
1. **Access Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/jjxvrxehmawuyxltrvql
   - Navigate to: Settings → API → Service Role Key
   - Extract: `SUPABASE_SERVICE_ROLE_KEY`

2. **Extract Edge Function Secrets**
   - Navigate to: Edge Functions → Environment Variables
   - Extract: `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
   - Extract: `GMAIL_APP_PASSWORD` (if configured)

3. **Verify Stripe Configuration**
   - Access Stripe Dashboard
   - Verify webhook endpoint configuration
   - Document current webhook URL for update

### Phase 2: Email Configuration Discovery
```bash
# Check email service configuration in codebase
grep -r "gmail\|smtp" supabase/functions/
grep -r "nodemailer" src/
```

### Phase 3: Validation
- Test each secret in isolation
- Verify API connectivity
- Document rate limits and quotas

---

## 🔄 Migration Strategy

### Database Migration
```bash
# Option 1: Direct Firestore Migration (No Data Loss)
# Since only test data exists, start fresh with Firestore

# Option 2: Supabase → Firestore ETL (If Production Data)
# Use Supabase service key to export data
# Transform to Firestore document format
# Import using Firestore Admin SDK
```

### API Keys Migration
```bash
# Store in GCP Secret Manager
gcloud secrets create stripe-secret-key --data-file=/path/to/stripe-key
gcloud secrets create stripe-webhook-secret --data-file=/path/to/webhook-secret
gcloud secrets create openai-api-key --data-file=/path/to/openai-key
gcloud secrets create gmail-app-password --data-file=/path/to/gmail-password
```

---

## 🚨 Security Considerations

### Current Security Model
- **Frontend:** Public Supabase keys (safe for client-side)
- **Backend:** Service role keys in Edge Functions
- **Payment:** Stripe webhook signatures for validation
- **Email:** Gmail app passwords (less secure than OAuth)

### Enhanced Security (Post-Migration)
- **Frontend:** Firebase Auth for user management
- **Backend:** GCP service account with least-privilege IAM
- **Payment:** Stripe webhook signatures + Cloud Tasks for reliability
- **Email:** Service account with Gmail API (more secure than SMTP)

### Zero-Trust Migration
1. **No Secret Reuse:** Generate new webhook secrets in Stripe
2. **Credential Rotation:** Plan for 90-day key rotation
3. **Access Logging:** Enable Secret Manager audit logs
4. **Principle of Least Privilege:** Minimal IAM roles

---

## 📋 Pre-Migration Checklist

### Supabase Dashboard Access
- [ ] Verify dashboard access to project `jjxvrxehmawuyxltrvql`
- [ ] Extract service role key
- [ ] Document all Edge Function environment variables
- [ ] Export current database schema
- [ ] Backup any production data

### Stripe Dashboard Access
- [ ] Verify Stripe account access
- [ ] Document current webhook configuration
- [ ] Extract API keys (test and live)
- [ ] Plan webhook URL update strategy

### Email Configuration
- [ ] Verify Gmail app password access
- [ ] Test current email functionality
- [ ] Plan migration to Gmail API (optional enhancement)

### Dependencies Audit
- [ ] Review all `package.json` dependencies
- [ ] Identify Supabase-specific packages for removal
- [ ] Plan Firebase SDK integration

---

## 🔧 Migration Commands Template

```bash
# Extract secrets from Supabase (manual)
echo "Visit: https://supabase.com/dashboard/project/jjxvrxehmawuyxltrvql/settings/api"
echo "Copy Service Role Key to clipboard"

# Store in GCP Secret Manager
echo "SERVICE_ROLE_KEY_HERE" | gcloud secrets create supabase-service-key --data-file=-

# Verify secret storage
gcloud secrets versions list supabase-service-key

# Test secret access from Cloud Run
gcloud secrets versions access latest --secret="supabase-service-key"
```

---

## 📊 Cost Comparison

### Current Costs (Supabase)
- Database: $0 (free tier)
- Edge Functions: $0 (free tier)
- Storage: $0 (minimal usage)
- **Total: $0/month**

### Projected Costs (GCP)
- Cloud Run: $5-20/month
- Firestore: $5-15/month
- Storage: $2-5/month
- Secret Manager: $1/month
- **Total: $13-41/month**

### Cost Optimization
- Use Cloud Run min instances = 0
- Implement Firestore query optimization
- Set up billing alerts at $25 and $50

---

## 🎯 Success Criteria

### Migration Complete When:
- [ ] All secrets stored in GCP Secret Manager
- [ ] Cloud Run service deployed and accessible
- [ ] Firestore database operational
- [ ] Payment processing functional
- [ ] Email delivery working
- [ ] Analytics data flowing to BigQuery
- [ ] Original Supabase project safely decommissioned

---

**Next Steps:**
1. Run `./02-secrets-migration.sh` to extract and store secrets
2. Execute manual secret extraction from Supabase dashboard
3. Validate all secrets before proceeding with deployment

---
*Generated: 2025-09-17*
*Part of DiagnosticPro GCP Migration Plan*