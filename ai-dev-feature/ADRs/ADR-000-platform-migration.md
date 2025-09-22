# ADR-000: Emergency Platform Migration Architecture

**Date**: 2025-09-10  
**Status**: Accepted  
**Timeline**: URGENT (2 days - Thursday/Friday)

## Context

DiagnosticPro AI platform currently runs on Lovable hosting + Supabase and needs immediate deployment to Google Cloud infrastructure by Friday (2 days). This is an urgent timeline requiring conversion of 8 Supabase Edge Functions to Cloud Functions while maintaining business functionality.

## ✅ Code Analysis Complete

Analysis of existing GitHub codebase confirms this deployment is achievable:
- **8 Supabase Edge Functions** identified for conversion (Deno → Node.js)
- **PDF downloads already mobile-optimized** - no changes needed
- **Email functionality solid** - Gmail SMTP working, needs Secret Manager
- **Payment processing unchanged** - Stripe integration compatible

### Current Architecture
```
Lovable Hosting (Frontend)
    ↓
Supabase (Database + Auth + Edge Functions)
    ↓
BigQuery (Analytics - existing)
```

### Business Requirements
- **Deadline**: Friday 6PM (absolute)
- **Zero business disruption**: Payment processing must continue working
- **Cost reduction**: Lower monthly infrastructure costs
- **No data migration**: Supabase contains only test data
- **Existing functionality only**: No new features during migration

## Decision

Implement **minimal viable Google Cloud migration** with the following architecture:

### **Selected Google Cloud Stack**
```
Frontend: Firebase Hosting (React/TypeScript deployment)
Backend: Cloud Functions (API endpoints)
Database: Firestore (customer workflow: users, orders, diagnostics)
Auth: Firebase Auth (user authentication)
AI Data: BigQuery (existing scraped data: DTC codes, solutions, costs)
```

### **Key Architectural Decisions**

1. **Firebase Hosting over Cloud Run for Frontend**
   - **Reason**: Faster setup, automatic SSL, CDN included
   - **Trade-off**: Less flexible than containerized deployment
   - **Timeline**: Can deploy static build in 1 hour vs 4+ hours for Docker

2. **Firestore over Cloud SQL PostgreSQL**
   - **Reason**: No existing data to migrate, autoscaling, simpler setup
   - **Trade-off**: NoSQL vs SQL but customer workflow is simple CRUD
   - **Timeline**: 30 minutes setup vs 2+ hours for Cloud SQL

3. **Firebase Auth over Google Identity Platform**
   - **Reason**: Simpler setup, more documentation, faster integration
   - **Trade-off**: Vendor lock-in vs faster deployment
   - **Timeline**: Can integrate in 2 hours vs 6+ hours for custom auth

4. **BigQuery Integration for AI Data**
   - **Reason**: Existing scraped data (DTC codes, solutions, costs) already in BigQuery
   - **Trade-off**: No changes needed, AI pulls from BigQuery + Firestore
   - **Timeline**: Just connect, no migration required

5. **OpenAI → Vertex AI Migration**
   - **Reason**: Better integration with Google Cloud ecosystem
   - **Trade-off**: API syntax changes but prompt structure can be maintained
   - **Timeline**: Isolated function conversion, test in parallel

6. **Google Secret Manager for Environment Variables**
   - **Reason**: Secure, scalable secret management vs hardcoded env vars
   - **Trade-off**: Slightly more complex setup vs better security
   - **Timeline**: Automated deployment script available

## Consequences

### Positive
- **Extremely fast deployment**: Can complete migration in 2 days
- **Low risk**: No data migration, clean slate setup
- **Autoscaling**: Firestore scales automatically with customer growth
- **Cost effective**: Pay-per-use pricing, very affordable for startup
- **Google ecosystem**: Native BigQuery integration for AI data
- **Rollback ready**: Can revert to Lovable/Supabase easily

### Negative
- **Not optimized**: Quick migration, not best-in-class architecture
- **Firebase lock-in**: Harder to migrate away from Firebase later
- **Limited scalability**: May need re-architecture for high scale
- **Technical debt**: Will need optimization after migration
- **Learning curve**: Team needs to learn Firebase/Google Cloud

### Acceptable Trade-offs for Emergency Timeline
- **Performance**: Acceptable performance vs optimal performance
- **Scalability**: Current scale vs infinite scale capability
- **Cost optimization**: Good enough vs perfectly optimized
- **Architecture elegance**: Working system vs beautiful architecture

## Alternatives Considered

### Option 1: Full Cloud Run Architecture
- **Pros**: More flexible, better performance, less vendor lock-in
- **Cons**: Requires Docker containers, 3-4x more setup time
- **Rejection reason**: Cannot complete in 2-day timeline

### Option 2: Minimal VM Migration
- **Pros**: Fastest possible migration, lift-and-shift
- **Cons**: No cost reduction, no modern benefits
- **Rejection reason**: Doesn't achieve business goals

### Option 3: Delay Migration
- **Pros**: More time for proper architecture
- **Cons**: Misses Friday deadline, continues current costs
- **Rejection reason**: Business requirement is Friday deadline

## Implementation Strategy

### **Thursday Priority Order**
1. **Firestore Setup**: 3 collections (diagnosticSubmissions, orders, emailLogs) with schema mapping
2. **Secret Manager**: Deploy all environment variables with automated script
3. **Function Conversion**: Convert 8 Edge Functions to Cloud Functions
   - **analyze-diagnostic** (OpenAI → Vertex AI, database queries)
   - **stripe-webhook** (crypto verification, Firestore operations)
   - **send-diagnostic-email** (Secret Manager integration)
   - **generate-report-pdf** (Node.js runtime conversion)
   - **4 additional functions** (standard conversions)
4. **Frontend Deploy**: Firebase Hosting (React/TypeScript)
5. **Integration Testing**: End-to-end workflow validation

### **Friday Priority Order**
1. **Intensive Testing**: Payment → AI analysis → email → PDF download workflow
2. **Mobile Compatibility**: PDF downloads on iPhone/Android (existing compatibility excellent)
3. **Error Handling**: Payment failures, AI timeouts, email delivery issues
4. **Performance Testing**: Multiple concurrent users, load handling
5. **Production Deploy**: DNS switch and monitoring
6. **Legacy Shutdown**: Lovable and Supabase cancellation

### **Emergency Rollback Plan**
- Keep Lovable/Supabase running until Friday 4PM
- DNS can revert in under 5 minutes
- Database can be quickly switched back if needed
- Team available all Friday for emergency response

## Success Metrics

### **Thursday EOD (MUST ACHIEVE)**
- Application loads on Firebase Hosting staging URL
- All 8 Cloud Functions converted and deployed successfully
- Firestore collections working (diagnosticSubmissions, orders, emailLogs)
- Secret Manager configured and accessible from functions
- Core workflow operational: Payment → AI analysis → Email → PDF download

### **Friday 6PM (FINAL SUCCESS)**
- DNS pointing to Firebase Hosting production
- All business functionality working in production
- Payment processing successful (Stripe integration unchanged)
- Vertex AI generating reports using BigQuery + Firestore data
- PDF downloads working on mobile and desktop
- Email delivery functional with Secret Manager
- Lovable and Supabase services cancelled
- Cost reduction achieved with autoscaling Firestore

## Post-Migration Plan

### **Week 1 After Migration**
- Monitor performance and fix any issues
- Optimize costs and configurations
- Document new architecture for team
- Plan future optimizations

### **Month 1 After Migration**  
- Evaluate architecture performance
- Plan improvements and optimizations
- Consider migration to more optimal Google Cloud services
- Implement monitoring and alerting improvements

### **Future Architecture Evolution**
- This emergency migration creates foundation for PRDs 01-08
- Media storage features can be added using Cloud Storage
- Advanced AI features can leverage Vertex AI
- Platform can evolve to full Cloud Run architecture over time

## References

- [Platform Migration PRD](../PRDs/00-prd-platform-migration.md)
- [2-Day Migration Task List](../tasks/00-tasks-prd-platform-migration.md)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Cloud SQL PostgreSQL Setup](https://cloud.google.com/sql/docs/postgres)
- [Firebase Auth Integration](https://firebase.google.com/docs/auth)

---

**CRITICAL NOTE**: This ADR prioritizes speed and reliability over architectural perfection. The goal is working system by Friday, not perfect system. Optimization can happen after successful migration.