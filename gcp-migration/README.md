# DiagnosticPro GCP Migration Suite

**🚀 Complete migration from Supabase/Lovable to Google Cloud Run**

This directory contains a comprehensive set of scripts and tools to migrate the DiagnosticPro platform to Google Cloud Platform with production-ready infrastructure, security, and monitoring.

---

## 📋 Quick Start

### One-Command Migration
```bash
# Run the master migration script
./00-MASTER-MIGRATION.sh
```

### Individual Phase Execution
```bash
# Phase 1: Infrastructure Setup
./01-gcp-project-setup.sh

# Phase 2: Secrets Migration
./02-secrets-migration.sh

# Phase 3: Firestore Setup
./04-firestore-setup.sh

# Phase 4: Cloud Run Deployment
./03-deploy-cloud-run.sh

# Phase 5: Validation & Testing
./05-validation-testing.sh
```

---

## 🎯 Migration Overview

### What This Migration Does

**FROM (Current):**
- Frontend: Lovable hosting
- Database: Supabase PostgreSQL
- Functions: Supabase Edge Functions (Deno)
- AI: OpenAI GPT-4
- Payment: Stripe
- Email: Gmail SMTP

**TO (Target):**
- Frontend: Cloud Run (containerized React app)
- Database: Firestore (native mode)
- Functions: Cloud Run endpoints (Node.js/Express)
- AI: Vertex AI (with OpenAI fallback)
- Payment: Stripe (unchanged)
- Email: Gmail API (enhanced)

### Key Benefits
- **Cost Efficiency:** Pay-only-for-what-you-use
- **Auto-scaling:** 0 to thousands of requests seamlessly
- **Security:** Enterprise-grade secret management
- **Reliability:** Google Cloud's 99.95% SLA
- **Performance:** Global CDN and optimized infrastructure
- **Monitoring:** Comprehensive logging and alerting

---

## 📁 File Structure

```
gcp-migration/
├── 00-MASTER-MIGRATION.sh           # 🎯 Main orchestration script
├── 01-gcp-project-setup.sh          # 🏗️  GCP project and infrastructure
├── 02-secrets-migration.sh          # 🔐 Secret Manager setup
├── 03-deploy-cloud-run.sh           # 🚀 Application deployment
├── 04-firestore-setup.sh            # 🔥 Database configuration
├── 05-validation-testing.sh         # 🧪 Comprehensive testing
├── README.md                        # 📖 This documentation
│
├── CURRENT_SECRETS_AUDIT.md         # 🔍 Secrets inventory
├── *_SUMMARY.md                     # 📋 Generated reports
├── *.env                           # ⚙️  Configuration files
├── *.yaml                          # 🔧 Infrastructure configs
└── *.js                            # 🛠️  Migration utilities
```

---

## ⏱️ Migration Timeline

### Total Time: 2-3 hours

| Phase | Duration | Description |
|-------|----------|-------------|
| **Phase 1** | 20-30 min | GCP project setup, APIs, IAM |
| **Phase 2** | 15-20 min | Secrets collection and storage |
| **Phase 3** | 15-20 min | Firestore database configuration |
| **Phase 4** | 30-45 min | Container build and deployment |
| **Phase 5** | 15-30 min | Validation and testing |
| **Manual** | 15-30 min | Stripe webhook update, final testing |

### Prerequisites Time: 30 minutes
- Gather Stripe API keys
- Extract Supabase secrets
- Prepare Gmail app password
- Review current system

---

## 🔧 Prerequisites

### Required Tools
```bash
# Google Cloud CLI
curl https://sdk.cloud.google.com | bash
gcloud auth login

# Docker
# Install via: https://docs.docker.com/get-docker/

# Node.js 18+
# Install via: https://nodejs.org/
```

### Required Credentials
1. **Stripe Dashboard Access**
   - Secret API key
   - Webhook secret
   - Webhook endpoint configuration

2. **Supabase Dashboard Access**
   - Service role key
   - OpenAI API key (from Edge Functions)
   - Current database schema

3. **Gmail Configuration**
   - App password for SMTP
   - OR Gmail API credentials (preferred)

4. **Google Cloud Account**
   - Billing account linked
   - Project creation permissions
   - Appropriate IAM roles

---

## 💰 Cost Breakdown

### Estimated Monthly Costs

| Service | Usage | Cost |
|---------|-------|------|
| **Cloud Run** | 1M requests, 2GB RAM | $10-25 |
| **Firestore** | 100K reads, 10K writes | $5-10 |
| **Secret Manager** | 5 secrets, minimal access | $1 |
| **Cloud Storage** | 1GB reports, 1GB backups | $1-2 |
| **Cloud Tasks** | 10K tasks | $1 |
| **Total** | | **$18-39/month** |

### Cost Optimization Features
- **Scale-to-zero:** No charges when idle
- **Lifecycle policies:** Auto-delete old reports
- **Resource limits:** Prevent runaway costs
- **Billing alerts:** Notifications at $25 and $50

---

## 🚀 Deployment Architecture

### Infrastructure Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Load Balancer │────│   Cloud Run      │────│   Firestore     │
│   (HTTPS/HTTP2) │    │   (Auto-scaling) │    │   (NoSQL DB)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Secret Manager  │
                       │  (API Keys)      │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Cloud Storage   │
                       │  (Reports/Files) │
                       └──────────────────┘
```

### Security Model
- **Service Account:** Least-privilege access
- **Secrets:** Encrypted at rest, access logged
- **Network:** VPC-native with private IPs
- **Database:** Rule-based access control
- **HTTPS:** Enforced with automatic certificates

---

## 📋 Step-by-Step Instructions

### Option 1: Automated Migration (Recommended)

```bash
# 1. Clone/navigate to the migration directory
cd gcp-migration

# 2. Make scripts executable
chmod +x *.sh

# 3. Run the master migration script
./00-MASTER-MIGRATION.sh
```

The script will:
- Guide you through configuration
- Execute all phases automatically
- Handle errors and rollbacks
- Generate comprehensive reports

### Option 2: Manual Phase Execution

For more control or troubleshooting:

```bash
# Phase 1: Infrastructure
./01-gcp-project-setup.sh

# Phase 2: Secrets (interactive)
./02-secrets-migration.sh

# Phase 3: Database
./04-firestore-setup.sh

# Phase 4: Deployment
./03-deploy-cloud-run.sh

# Phase 5: Validation
./05-validation-testing.sh
```

---

## 🔐 Security Considerations

### Secrets Management
- **Never store secrets in code or environment variables**
- **All secrets encrypted at rest in Secret Manager**
- **Access logged and monitored**
- **Rotation plan included**

### Data Protection
- **Firestore security rules enforce access control**
- **Customer PII protected**
- **Payment data handled by Stripe (PCI compliant)**
- **Email delivery secured**

### Network Security
- **All traffic encrypted in transit (HTTPS)**
- **VPC-native networking**
- **Private IP addresses**
- **Cloud Armor available for DDoS protection**

---

## 🧪 Testing & Validation

### Automated Tests Include
- **Infrastructure validation**
- **Secret access verification**
- **Database connectivity**
- **API endpoint testing**
- **Performance benchmarking**
- **Security configuration**
- **Cost optimization checks**

### Manual Testing Required
1. **Update Stripe webhook URL**
2. **Complete payment flow test**
3. **Email delivery verification**
4. **AI analysis functionality**

---

## 🔍 Monitoring & Operations

### Health Monitoring
```bash
# Service health check
curl https://your-service-url/health

# Real-time logs
gcloud run services logs tail diagnosticpro-app

# Performance metrics
# Available in Cloud Console
```

### Cost Monitoring
- **Billing alerts configured**
- **Budget notifications**
- **Usage dashboards**
- **Cost optimization recommendations**

### Performance Monitoring
- **Uptime checks**
- **Response time tracking**
- **Error rate monitoring**
- **Custom business metrics**

---

## 🆘 Troubleshooting

### Common Issues

#### Migration Script Fails
```bash
# Check prerequisites
gcloud auth list
docker --version
node --version

# Review logs
tail -f migration-*.log

# Re-run specific phase
./0X-phase-name.sh
```

#### Service Deployment Issues
```bash
# Check Cloud Run logs
gcloud run services logs tail diagnosticpro-app

# Common fixes:
# - Verify secret access permissions
# - Check environment variables
# - Validate Docker image build
```

#### Database Connection Problems
```bash
# Verify Firestore setup
gcloud firestore databases describe --database="(default)"

# Check security rules
# Review service account permissions
```

#### Payment Processing Issues
```bash
# Update Stripe webhook URL
# Test webhook delivery
# Verify Stripe secrets in Secret Manager
```

### Getting Help

1. **Check generated documentation**
   - Review all `*_SUMMARY.md` files
   - Read validation reports
   - Check error logs

2. **Use diagnostic commands**
   ```bash
   # Project status
   gcloud config get-value project

   # Service status
   gcloud run services list

   # Recent logs
   gcloud logging read "resource.type=cloud_run_revision" --limit=20
   ```

3. **Community resources**
   - Google Cloud documentation
   - Stack Overflow
   - GitHub issues

---

## 📈 Post-Migration Optimization

### Immediate (24 hours)
- [ ] Update Stripe webhook URL
- [ ] Test complete payment flow
- [ ] Monitor error rates
- [ ] Verify email delivery
- [ ] Check cost usage

### Short-term (1 week)
- [ ] Set up advanced monitoring
- [ ] Configure alerting policies
- [ ] Optimize performance settings
- [ ] Implement CI/CD pipeline
- [ ] Decommission Supabase

### Long-term (1 month)
- [ ] Analyze usage patterns
- [ ] Implement caching strategies
- [ ] Consider multi-region deployment
- [ ] Enhance security measures
- [ ] Plan feature enhancements

---

## 📞 Support

### Generated Documentation
All migration phases generate detailed documentation:
- `GCP_SETUP_SUMMARY.md` - Infrastructure overview
- `SECRETS_MIGRATION_SUMMARY.md` - Security configuration
- `FIRESTORE_SETUP_SUMMARY.md` - Database details
- `DEPLOYMENT_SUMMARY.md` - Service information
- `MIGRATION_VALIDATION_REPORT.md` - Test results
- `MIGRATION_COMPLETE_REPORT.md` - Final status

### Emergency Contacts
- **Google Cloud Support:** Available with paid support plans
- **Stripe Support:** Available through Stripe dashboard
- **Community:** Stack Overflow, GitHub discussions

---

## ✅ Success Checklist

### Pre-Migration
- [ ] All prerequisites installed
- [ ] Credentials gathered
- [ ] Current system documented
- [ ] Backup created

### Migration
- [ ] All phases completed successfully
- [ ] Validation tests passed
- [ ] Service responding to requests
- [ ] Documentation generated

### Post-Migration
- [ ] Stripe webhook updated
- [ ] Payment flow tested
- [ ] Email delivery verified
- [ ] Monitoring configured
- [ ] Team trained on new system

---

## 🎉 Migration Benefits Achieved

After completing this migration, you'll have:

✅ **Modern Infrastructure:** Cloud-native, auto-scaling platform
✅ **Enhanced Security:** Enterprise-grade secret management
✅ **Cost Efficiency:** Pay-only-for-what-you-use pricing
✅ **High Availability:** Google Cloud's 99.95% SLA
✅ **Better Performance:** Global CDN and optimized stack
✅ **Comprehensive Monitoring:** Full observability and alerting
✅ **Future-Ready:** Platform ready for growth and enhancement

---

**Ready to migrate? Run `./00-MASTER-MIGRATION.sh` to get started!**

*Generated: 2025-09-17*
*Version: 1.0*