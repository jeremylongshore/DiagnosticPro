# PRD-00: Platform Migration - Lovable/Supabase to Google Cloud

**Date**: 2025-09-10  
**Status**: Active  
**Deadline**: Friday (2 days)

## Introduction/Overview

Deploy existing GitHub codebase to Firebase/Google Cloud infrastructure within 2 days (Thursday-Friday). Convert 8 Supabase Edge Functions to Google Cloud Functions, replace Supabase with Firestore for customer workflow data, migrate from OpenAI to Vertex AI, and safely shut down Lovable/Supabase services.

**Key Business Outcome**: Complete platform deployment by Friday to reduce costs and establish professional Google Cloud foundation for future development.

## ✅ Code Analysis Complete

**GOOD NEWS**: Analysis of existing GitHub code confirms this is a very achievable Friday deployment:
- **PDF downloads will work perfectly** - existing mobile compatibility is excellent
- **Email functionality will transfer cleanly** - Gmail SMTP already working
- **Payment processing unchanged** - Stripe integration is solid
- **Main conversion effort**: Database queries (Supabase → Firestore) and AI service (OpenAI → Vertex AI)

## Goals

1. **GitHub Deployment**: Deploy existing React/TypeScript code from GitHub to Google Cloud
2. **Database Setup**: Set up Firestore for customer workflow data (users, orders, diagnostics)
3. **BigQuery Connection**: Connect AI to existing BigQuery scraped diagnostic data (DTC codes, solutions, costs)
4. **Service Shutdown**: Safely shut down Lovable + Supabase after successful testing
5. **Cost Reduction**: Achieve lower infrastructure costs with autoscaling Firestore

## 2-Day Timeline with Staging Domain (SMART APPROACH)

### **Thursday: Setup & Staging Deployment**
- **Morning**: Set up Google Cloud project and Firestore database
- **Afternoon**: Configure customer workflow collections, convert 8 functions
- **Evening**: Deploy to staging domain, test core functionality

### **Friday: Live Testing & Production Switchover**
- **Morning**: Intensive testing on staging domain (real payments, real emails)
- **Early Afternoon**: Validate staging performance, fix any issues
- **Late Afternoon**: DNS switch to production domain  
- **Evening**: Monitor production, shut down legacy systems

## 🎯 **Multi-Domain Strategy Benefits**

### **Staging Domain Advantages**
- **Real-world testing** without affecting production users
- **Live payment testing** with actual Stripe processing
- **Email delivery validation** with real Gmail SMTP
- **Mobile compatibility testing** on actual devices
- **Performance validation** under realistic conditions
- **Safety net** - production domain stays on Lovable until 100% confident

## Technical Stack Decision

### **Simple Google Cloud Stack:**
```
Frontend: Firebase Hosting (React/TypeScript app)
Database: Firestore (customer workflow: users, orders, diagnostics)
AI Data: BigQuery (existing scraped data: DTC codes, solutions, costs)
Auth: Firebase Auth (user authentication)
Backend: Cloud Functions (API endpoints)
```

### **Data Flow:**
```
Customer Form → Firestore (customer data)
AI Analysis → BigQuery (scraped data) + Firestore (customer data) → Report
```

## Functional Requirements

### **1. GitHub Integration**
- Set up CI/CD pipeline from GitHub repository to Google Cloud
- Configure automated deployments on push to main branch
- Establish staging and production environments

### **2. Firestore Database Setup**
- Create 3 Firestore collections matching Supabase schema:
  - `diagnosticSubmissions` (customer diagnostic forms with 25+ fields)
  - `orders` (payment tracking with Stripe integration)
  - `emailLogs` (email delivery tracking and status)
- Convert snake_case fields to camelCase (analysisStatus, createdAt, etc.)
- Support anonymous submissions (userId can be null)
- Configure relationships: orders ↔ diagnosticSubmissions via document references
- Set up Firestore security rules for anonymous + authenticated access

### **3. Authentication Setup**
- Replace Supabase Auth with Firebase Auth or Google Identity
- Maintain existing user registration/login flows
- Configure secure authentication tokens

### **4. Application Deployment**
- Deploy React/TypeScript frontend to Google Cloud hosting
- Deploy backend APIs and Edge Function equivalents
- Configure environment variables and secrets

### **5. Function Conversion (8 Supabase Edge Functions → Cloud Functions)**
- **analyze-diagnostic**: Convert OpenAI → Vertex AI, Supabase → Firestore queries
- **stripe-webhook**: Convert crypto verification, database operations to Firestore  
- **send-diagnostic-email**: Convert SMTP client, Secret Manager integration
- **generate-report-pdf**: Convert to Node.js runtime if needed
- **create-payment, manual-send-email, test-email, send-slack-notification**: Standard conversions

### **6. AI Integration & BigQuery**
- Replace OpenAI GPT-4 with Vertex AI Gemini for diagnostic analysis
- Connect AI to existing BigQuery scraped data (DTC codes, solutions, costs)
- AI workflow: Customer Firestore data + BigQuery diagnostic data → Vertex AI analysis → Report
- Save generated AI reports back to BigQuery for analytics and tracking
- Maintain existing diagnostic analysis quality and format (12-section comprehensive reports)

### **7. Testing & Validation**
- Test complete user journey: registration → payment → diagnostic → report
- Validate all integrations: Stripe, Vertex AI, email, BigQuery
- Test Firestore collections: create diagnosticSubmissions, orders, emailLogs
- Verify AI can access both Firestore customer data and BigQuery diagnostic data
- **Critical**: Test PDF downloads on mobile devices (excellent existing compatibility)
- Performance testing under expected load

## Non-Goals (Out of Scope)

- Data migration from Supabase (no important data exists)
- New feature development (use existing functionality)
- UI/UX changes (deploy existing interface)
- Advanced optimization (basic performance acceptable)
- Complex security audits (basic security sufficient for now)

## Success Metrics

- **Thursday EOD**: All functionality working on Google Cloud staging
- **Friday 12PM**: Production deployment complete
- **Friday 5PM**: Lovable + Supabase successfully shut down
- **Zero downtime**: Users experience no service interruption
- **Cost reduction**: Lower monthly infrastructure costs achieved

## Risk Mitigation

### **High-Risk Items & Solutions:**
1. **Function Conversion** - Database query syntax changes (Supabase → Firestore)
   - **Solution**: Create database abstraction layer for clean conversion
2. **AI Service Migration** - OpenAI GPT-4 → Vertex AI Gemini  
   - **Solution**: Test Vertex AI in isolation, keep existing prompt structure
3. **Stripe Webhook Crypto** - Different crypto handling (Deno → Node.js)
   - **Solution**: Use Node.js crypto module instead of Web Crypto API
4. **Secret Management** - Environment variables in new system
   - **Solution**: Google Secret Manager with automated deployment script

### **Staging to Production Promotion:**
- **Staging Domain**: Thorough testing with real transactions
- **Go/No-Go Decision**: Friday 2PM based on staging performance
- **Production Promotion**: DNS switch only after staging validation
- **Instant Rollback**: Production DNS can revert to Lovable in <5 minutes

### **Rollback Plan:**
- Keep Lovable/Supabase running until Friday 5PM
- Production domain points to Lovable until final switch
- Staging domain serves as production-ready validation
- **Rollback Triggers**: Payment failure >5%, AI analysis failure >10%, Email delivery failure >20%

## ✅ Architectural Decisions Made

1. **Frontend Hosting**: Firebase Hosting (faster deployment, automatic SSL/CDN)
2. **Database**: Firestore (autoscaling, no data migration needed)  
3. **AI Service**: Vertex AI Gemini (replaces OpenAI GPT-4)
4. **Secret Management**: Google Secret Manager (automated deployment)
5. **Functions Runtime**: Node.js Cloud Functions (convert from Deno Edge Functions)

## Critical Checkpoints

### **Thursday EOD Checkpoint (MUST ACHIEVE):**
- Google Cloud infrastructure deployed and running
- 8 Cloud Functions converted and deployed
- Firestore collections created and working
- Secret Manager configured
- **Application accessible on staging domain** with full functionality
- Core functions working: payment processing, AI analysis, email delivery
- **Staging domain ready for Friday live testing**

### **Friday Checkpoints:**
- **10AM**: Complete live testing on staging domain (real payments, real customers)
- **2PM**: Go/No-Go decision based on staging domain performance
- **3PM**: DNS switch production domain to Google Cloud (if staging successful)
- **4PM**: Monitor production traffic, keep staging domain live as backup
- **6PM**: Migration complete, both domains operational for redundancy

## 💡 **Keep Everything Live Strategy**

### **Staging Domain Benefits**
- **Live customer testing** with real transactions
- **Real payment processing** validation
- **Actual email delivery** testing
- **Mobile device compatibility** verification
- **Performance under load** validation
- **Backup domain** if production has issues

### **Production Domain Strategy**
- **Keep on Lovable** until staging proves 100% reliable
- **Quick DNS switch** when confident
- **Instant rollback** capability maintained
- **Zero customer impact** during transition

## Team Requirements (URGENT)

- **Thursday**: 6-8 hours development time (full day commitment)
- **Friday Morning**: 4 hours intensive testing
- **Friday Afternoon**: 4 hours deployment + monitoring
- **Emergency Contact**: Available all Friday for rollback if needed

---

*This PRD focuses exclusively on the 2-day URGENT migration timeline. Future media features and advanced functionality will be implemented using PRDs 01-08 after the basic platform migration is complete.*