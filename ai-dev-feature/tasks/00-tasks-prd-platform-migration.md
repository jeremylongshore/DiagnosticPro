# Task List: 2-Day Platform Migration (URGENT)

Based on PRD: `00-prd-platform-migration.md`  
**Deadline**: Friday 6PM  
**Timeline**: Thursday-Friday ONLY

## Priority Files to Create/Modify

- `config/firebase.config.js` - Firebase project and Firestore configuration
- `config/firestore.rules` - Firestore security rules for customer data
- `config/bigquery.config.js` - BigQuery connection for AI scraped data
- `config/vertex-ai.config.js` - Vertex AI API configuration for diagnostic analysis
- `config/email.config.js` - Email service configuration for report delivery
- `config/stripe.config.js` - Stripe API configuration for payments
- `scripts/deploy-firebase.js` - Automated deployment to Firebase Hosting
- `scripts/test-migration.js` - Complete system testing script
- `.github/workflows/deploy-firebase.yml` - GitHub Actions CI/CD pipeline
- `firestore/collections.js` - Firestore collections setup matching Supabase schema
  - diagnosticSubmissions (25+ fields with snake_case → camelCase conversion)
  - orders (payment tracking and Stripe integration)
  - emailLogs (email delivery tracking and status)
- `api/ai-analysis.js` - AI analysis workflow combining BigQuery + Vertex AI

## THURSDAY TASKS (CRITICAL - MUST COMPLETE)

### **Morning Block (9AM-12PM)**
- [ ] **T1.1** Set up Firebase project and enable Firestore + BigQuery APIs
- [ ] **T1.2** Configure billing and verify Google Cloud startup credits availability
- [ ] **T1.3** Create Firestore database and set up 3 collections matching Supabase schema:
  - diagnosticSubmissions (25+ fields, snake_case → camelCase conversion)
  - orders (payment tracking with Stripe integration)
  - emailLogs (email delivery tracking and status)
- [ ] **T1.4** Configure Firebase Auth for customer authentication
- [ ] **T1.5** Test connection to existing BigQuery scraped data (DTC codes, solutions)
- [ ] **T1.6** Configure Vertex AI API access for diagnostic analysis
- [ ] **T1.7** Deploy Google Secret Manager configuration:
  - Run automated secret deployment script
  - Configure service account permissions
  - Test secret access from Cloud Functions
- [ ] **T1.8** Verify Stripe API integration for payment processing

### **Afternoon Block (1PM-5PM)**  
- [ ] **T2.1** Implement Firestore document structure with field mappings:
  - Convert all snake_case fields to camelCase (analysis_status → analysisStatus)
  - Set up document references (orderId ↔ submissionId relationships)
  - Configure anonymous submission support (userId can be null)
- [ ] **T2.2** Configure Firestore security rules based on Supabase RLS policies:
  - Allow anonymous submissions for diagnosticSubmissions collection
  - Authenticated users can read/update their own data
  - System service account access for emailLogs collection
- [ ] **T2.3** Create GitHub Actions workflow for automated deployment to Firebase
- [ ] **T2.4** Convert 8 Supabase Edge Functions to Cloud Functions:
  - **analyze-diagnostic**: Convert OpenAI → Vertex AI, Supabase → Firestore
  - **stripe-webhook**: Convert crypto verification, database operations
  - **send-diagnostic-email**: Convert SMTP client, Secret Manager integration  
  - **generate-report-pdf**: Convert to Node.js runtime
  - **create-payment, manual-send-email, test-email, send-slack-notification**: Standard conversions
- [ ] **T2.5** Set up Firebase Hosting for React/TypeScript frontend deployment

### **Evening Block (6PM-9PM)**
- [ ] **T3.1** Deploy converted Cloud Functions and test individual function operations
- [ ] **T3.2** Test Firestore CRUD operations for all 3 collections:
  - Create/read diagnosticSubmissions with all 25+ fields
  - Test orders collection with Stripe payment integration
  - Verify emailLogs collection for delivery tracking
- [ ] **T3.3** Deploy React app to Firebase Hosting and verify basic page loading
- [ ] **T3.4** Test complete payment workflow:
  - Stripe checkout → webhook → database updates → AI trigger
- [ ] **T3.5** Test complete AI workflow with Vertex AI:
  - Pull customer data from Firestore diagnosticSubmissions collection
  - Access existing BigQuery scraped data (DTC codes, solutions, costs)
  - Generate report using Vertex AI (maintain 12-section format)
- [ ] **T3.6** Test email delivery and PDF download functionality:
  - Gmail SMTP with Secret Manager authentication
  - Mobile-compatible PDF downloads (existing excellent compatibility)
- [ ] **T3.7** Test complete end-to-end flow: Form → Payment → AI Analysis → Email → Download

### **Thursday EOD CHECKPOINT** ✅
- **Staging domain fully operational** with complete functionality
- All 8 Cloud Functions converted and deployed successfully
- Firestore collections working for customer data (diagnosticSubmissions, orders, emailLogs)
- Secret Manager configured and accessible
- **Core workflow functional on staging**: Payment → AI Analysis → Email → PDF Download
- **Ready for Friday live testing** with real customers and transactions

---

## FRIDAY TASKS (TESTING & SWITCHOVER)

### **Morning Block (9AM-12PM) - INTENSIVE TESTING**
- [ ] **F1.1** Test complete diagnostic form submission and validation
- [ ] **F1.2** Test Stripe payment processing integration (CRITICAL):
  - Checkout session creation → webhook → database updates
  - Order tracking and status updates
  - Payment failure handling
- [ ] **F1.3** Test Vertex AI diagnostic analysis (CRITICAL):
  - Customer data extraction from Firestore
  - BigQuery scraped data integration
  - 12-section comprehensive report generation
  - Response time and quality validation
- [ ] **F1.4** Test email delivery system with Secret Manager:
  - Gmail SMTP authentication
  - PDF attachment generation and delivery
  - Email status logging to Firestore
- [ ] **F1.5** Test PDF download functionality:
  - Mobile device compatibility (iPhone, Android)
  - Desktop browser compatibility
  - Data URL and blob handling
- [ ] **F1.6** Test error scenarios and recovery:
  - Payment failures, AI timeouts, email delivery failures
  - Database connection issues, function timeouts
- [ ] **F1.7** Performance test under expected load:
  - Multiple concurrent users, payment processing
  - AI analysis queue handling

### **Afternoon Block (1PM-4PM) - LIVE TESTING & PRODUCTION DECISION**
- [ ] **F2.1** **Live testing on staging domain** with real customers:
  - Let staging domain handle real customer traffic
  - Monitor payment success rates, AI analysis quality
  - Track email delivery and PDF downloads
  - Validate mobile compatibility with real users
- [ ] **F2.2** **Go/No-Go decision at 2PM** based on staging performance:
  - Payment success rate >95%
  - AI analysis completion rate >90% 
  - Email delivery rate >95%
  - No critical errors or customer complaints
- [ ] **F2.3** **Production DNS switch** (only if staging validates successfully):
  - Point production domain to Firebase Hosting
  - Keep staging domain live as backup
- [ ] **F2.4** **Monitor both domains** for traffic and performance
- [ ] **F2.5** **Validate production domain** with test transactions

### **Evening Block (4PM-6PM) - SHUTDOWN LEGACY SYSTEMS**
- [ ] **F3.1** Verify Google Cloud system stable for 2+ hours
- [ ] **F3.2** Download any final data/logs from Lovable platform
- [ ] **F3.3** Cancel/shutdown Lovable hosting service
- [ ] **F3.4** Export any final data from Supabase (if needed)
- [ ] **F3.5** Cancel/shutdown Supabase service
- [ ] **F3.6** Document new Google Cloud infrastructure for team

### **Friday EOD SUCCESS METRICS** ✅
- DNS pointing to Google Cloud
- All functionality working in production
- Lovable and Supabase services shut down
- Cost reduction achieved
- Team trained on new infrastructure

---

## EMERGENCY ROLLBACK PROCEDURES

### **If Issues Arise Friday:**
- [ ] **R1** Immediately revert DNS to Lovable hosting
- [ ] **R2** Verify Lovable/Supabase still functional
- [ ] **R3** Communicate status to stakeholders
- [ ] **R4** Debug Google Cloud issues
- [ ] **R5** Plan retry strategy for following week

### **Critical Decision Points:**
- **10AM Friday**: If major issues found, consider delaying switchover
- **2PM Friday**: Point of no return for DNS switch
- **4PM Friday**: Last chance for easy rollback before shutdowns

---

## RISK MITIGATION CHECKLIST

### **High-Risk Components:**
- [ ] Firestore security rules and authentication
- [ ] Stripe webhook endpoints for payment processing  
- [ ] Vertex AI integration for diagnostic analysis (CRITICAL)
- [ ] Email delivery configuration (Gmail SMTP or alternative)
- [ ] BigQuery connection for AI scraped data access
- [ ] AI workflow: Customer data + BigQuery data → Vertex AI analysis → Report generation → Save to BigQuery
- [ ] SSL certificates and custom domain configuration

### **Pre-Deployment Verification:**
- [ ] All environment variables configured correctly
- [ ] All third-party API keys working in Google Cloud
- [ ] Database schema matches application requirements
- [ ] Authentication flow tested with multiple user types
- [ ] Payment processing tested with Stripe test mode

---

## TEAM COORDINATION

### **Thursday Communication:**
- **9AM**: Kick-off meeting and task assignment
- **12PM**: Morning progress check and blocker resolution
- **3PM**: Afternoon progress check
- **6PM**: Evening status and Thursday checkpoint verification

### **Friday Communication:**
- **9AM**: Testing phase kick-off
- **12PM**: Testing results review and go/no-go decision
- **2PM**: Production switchover initiation
- **4PM**: Legacy shutdown initiation  
- **6PM**: Migration completion confirmation

---

**CRITICAL SUCCESS FACTORS:**
1. **No scope creep** - Deploy existing functionality only
2. **Test everything** - Assume nothing works until verified
3. **Have rollback ready** - Keep Lovable/Supabase until 100% confident
4. **Communicate constantly** - Update status every 3 hours
5. **Focus on core business** - Payment processing and diagnostic workflow are priority #1