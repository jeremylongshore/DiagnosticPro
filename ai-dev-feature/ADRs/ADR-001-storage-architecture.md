# ADR-001: Storage Architecture Decision

**Date**: 2025-09-10  
**Status**: Accepted

## Context

DiagnosticPro AI platform currently uses Supabase for data storage but needs to implement comprehensive media storage (images, video, audio, documents) for diagnostic analysis. The platform requires:

- Storage for large media files (50MB+ video files)
- Integration with AI processing pipeline using Vertex AI
- Scalable storage that grows with business (Google Cloud startup credits available)
- BigQuery integration for analytics (existing 266 production tables)
- Professional-grade performance and reliability
- Cost optimization for startup phase

Current limitations with Supabase-only approach:
- Limited media storage capabilities
- No direct integration with Google Cloud AI services
- Separate billing from AI processing costs
- Limited analytics integration with existing BigQuery infrastructure

## Decision

Implement **hybrid storage architecture** with:

1. **Google Cloud Storage (GCS)** for all media files (images, video, audio, documents)
2. **Fresh Firestore/Cloud SQL** for new customer data (no Supabase data migration)
3. **BigQuery** for media metadata and analytics integration with existing diagnostic data
4. **Data pipeline pattern**: New Customer Data → GCS → BigQuery

## Consequences

### Positive
- Seamless integration with Vertex AI APIs for media analysis
- Leverages Google Cloud startup program credits effectively
- Professional-grade media storage with enterprise features (CDN, tiered storage)
- Native BigQuery integration for analytics and reporting
- Cost optimization through unified Google Cloud billing
- Scalable storage architecture that grows with business
- Maintains existing Supabase workflow (minimal disruption)

### Negative
- Increased architectural complexity with multiple storage systems
- Additional integration work required between Supabase and GCS
- Potential data consistency challenges across systems
- Learning curve for team on Google Cloud Storage
- No migration needed (fresh deployment)

## Alternatives Considered

### Option 1: Supabase Storage Only
- **Pros**: Simple architecture, unified platform, no migration needed
- **Cons**: Limited media capabilities, no Vertex AI integration, separate from BigQuery analytics
- **Reason for rejection**: Insufficient for professional media diagnostic requirements

### Option 2: Full Migration to Google Cloud (Firestore/Cloud SQL)
- **Pros**: Unified Google Cloud ecosystem, optimal AI integration
- **Cons**: Major migration effort, disrupts working payment workflow, higher risk
- **Reason for rejection**: Too disruptive to existing successful systems

### Option 3: AWS S3 + separate AI services
- **Pros**: Industry standard storage, feature-rich
- **Cons**: No startup credits, separate from existing BigQuery, additional AI service costs
- **Reason for rejection**: Higher costs, fragmented ecosystem

## Implementation

1. **Phase 1: GCS Infrastructure Setup**
   - Create professional bucket structure for media types
   - Configure IAM, security, and access controls
   - Establish staging areas and processing pipelines

2. **Phase 2: Fresh Database Integration**
   - Add GCS URL references to new database tables
   - Create Cloud Functions for media upload/processing
   - Establish new diagnostic workflow

3. **Phase 3: BigQuery Integration**
   - Create media metadata tables in BigQuery
   - Establish data pipeline from GCS to BigQuery
   - Enable analytics and reporting capabilities

4. **Phase 4: Fresh Deployment Optimization**
   - No media migration needed (fresh deployment)
   - Optimize costs and performance
   - Monitor and tune the new architecture

## References

- [Storage Infrastructure PRD](../tasks/prd-storage-infrastructure.md)
- [Google Cloud Storage Best Practices](https://cloud.google.com/storage/docs/best-practices)
- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [BigQuery Integration Patterns](https://cloud.google.com/bigquery/docs/loading-data)