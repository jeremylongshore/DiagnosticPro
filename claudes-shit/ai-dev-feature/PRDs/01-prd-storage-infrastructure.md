# PRD: Complete Google Cloud Migration & Infrastructure Setup

**Date**: 2025-09-10  
**Status**: Draft

## Introduction/Overview

Deploy the DiagnosticPro AI platform from GitHub to Google Cloud infrastructure, replacing Lovable hosting and Supabase entirely. This involves setting up CI/CD from the existing GitHub repository to deploy the React/TypeScript frontend and backend to Google Cloud, establishing fresh Cloud SQL PostgreSQL for new customer data, Google Cloud Storage for media files, and BigQuery for analytics - enabling complete shutdown of Lovable and Supabase services.

**IMPORTANT**: No data migration needed - Supabase contains no production data. This is a fresh deployment of code to new Google Cloud infrastructure.

**Key Business Outcome**: This work is the foundational step for launching the 'Video Diagnostic Analysis' feature, projected to unlock a new $250k ARR revenue stream by 2026 through premium diagnostic services.

## Goals

1. **GitHub to Google Cloud Deployment**: Set up CI/CD pipeline from GitHub repository to Google Cloud services
2. **Frontend Hosting**: Deploy React/TypeScript frontend to Google Cloud (Cloud Run or Firebase Hosting)
3. **Backend Infrastructure**: Deploy backend services from GitHub to Cloud Run functions/services
4. **Database Setup**: Establish fresh Cloud SQL PostgreSQL for new customer data (no migration needed)
5. **Media Storage**: Configure Google Cloud Storage for media files (images, videos, audio, documents)
6. **Analytics Platform**: Connect BigQuery for data analytics, reporting, and ML processing
7. **Comprehensive Testing**: Test all functionality thoroughly on Google Cloud before switching over completely
8. **Service Shutdown**: Safely shutdown Lovable hosting and Supabase services only after successful testing
9. **Cost Optimization**: Achieve at least 15% cost reduction compared to current Lovable + Supabase setup
10. **Performance & Security**: Implement enterprise-grade security and achieve 20% performance improvement

## User Stories

- **As a developer**, I want to deploy my GitHub code directly to Google Cloud with automated CI/CD
- **As a business owner**, I want to shut down Lovable and Supabase to reduce costs and complexity
- **As a platform administrator**, I want a complete Google Cloud infrastructure that scales with business growth
- **As a system architect**, I want clear data flow from GitHub deployment to production services
- **As a security officer**, I want enterprise-grade security across all Google Cloud services
- **As a product manager**, I want infrastructure that supports current operations and future media features

## Functional Requirements

1. **GitHub Repository Analysis & Deployment Setup**
   - System must analyze existing GitHub repository structure and dependencies
   - System must identify all frontend components, backend services, and configuration files
   - System must design CI/CD pipeline from GitHub to Google Cloud services
   - System must configure automated deployment triggers on GitHub commits/merges
   - System must establish staging and production deployment environments
   - System must implement automated testing and quality gates in deployment pipeline

2. **Data Flow Pipeline Design (Website Input → Storage → BigQuery)**
   - System must connect to existing BigQuery diagnostic data (DTC codes, solutions, costs)
   - System must design data flow: Website Forms → Cloud SQL (new customer data) → BigQuery (analytics)
   - System must design data flow: Media Upload → Cloud Storage → BigQuery (metadata)
   - System must establish real-time and batch data ingestion pipelines to BigQuery
   - System must implement data transformation and validation layers
   - System must configure proper data routing based on input type and business requirements

3. **Google Cloud Storage Setup for Media Files**
   - System must research Google Cloud Storage best practices for media files
   - System must design professional bucket structure for different media types
   - System must implement proper folder hierarchies and naming conventions
   - System must configure lifecycle policies for cost optimization
   - System must establish regional/multi-regional storage strategies
   - System must implement proper versioning and backup policies

4. **Website Input Data Routing & Processing**
   - System must map all website form inputs to appropriate storage destinations
   - System must design data classification: Operational Data (Cloud SQL) vs Analytical Data (BigQuery)
   - System must implement real-time data streaming for immediate analytics needs
   - System must establish batch processing for heavy analytical workloads
   - System must define data transformation rules for BigQuery schema compatibility
   - System must implement data validation and quality checks before BigQuery insertion
   - System must establish canonical method for linking media files to database records
   - System must configure proper data lineage tracking and audit trails

5. **Existing BigQuery Schema Integration**
   - System must connect to existing BigQuery diagnostic data (no customer data migration needed)
   - System must map website form fields to existing BigQuery table structures
   - System must identify any schema modifications needed for new Google Cloud architecture
   - System must ensure data compatibility between new pipeline and existing analytical workflows
   - System must preserve existing analytical capabilities and reporting functionality

5. **Enterprise Security & Access Control**
   - System must verify IAM roles and permissions for Google Cloud Storage access
   - System must implement principle of least privilege for all service accounts
   - System must configure proper encryption at rest and in transit
   - System must establish audit logging for all storage operations
   - System must be architected to meet the specific, pre-defined compliance standards of HIPAA and GDPR

6. **Professional Development Environment**
   - System must establish separate development, staging, and production environments
   - System must implement proper CI/CD pipeline integration with storage systems
   - System must configure automated testing for storage operations
   - System must establish deployment procedures and rollback mechanisms
   - System must implement proper secret management and configuration

7. **Performance Optimization & Scaling**
   - System must leverage Google Cloud's auto-scaling infrastructure
   - System must configure appropriate storage classes for different use cases
   - System must implement CDN integration for optimal file delivery
   - System must establish query optimization strategies for BigQuery
   - System must configure appropriate retention and archival policies

8. **Enterprise Monitoring & Alerting**
   - System must configure Google Cloud's monitoring and alerting infrastructure
   - System must establish metrics for storage usage, performance, and costs
   - System must implement alerts for failed uploads, quota limits, and performance issues
   - System must create dashboards for operational visibility
   - System must establish SLA monitoring and reporting

9. **Frontend Hosting Migration**
   - System must migrate React/TypeScript application from Lovable to Google Cloud hosting
   - System must evaluate Cloud Run vs Firebase Hosting for optimal frontend deployment
   - System must implement CI/CD pipeline for automated deployments to Google Cloud
   - System must configure custom domain and SSL certificates for production deployment
   - System must ensure zero-downtime migration with proper DNS management

10. **Database & Functions Setup**
   - System must set up fresh Google Cloud SQL PostgreSQL instance for new customer data (no migration)
   - System must design and implement database schema for customer data, orders, and application state
   - System must implement Google Cloud Run functions for backend API and business logic
   - System must set up authentication using Firebase Auth or Google Cloud Identity
   - System must ensure secure API endpoints and proper database connections

11. **Complete Infrastructure Architecture**
   - System must design comprehensive Google Cloud stack: Cloud Run + Cloud SQL + Cloud Storage + BigQuery
   - System must implement proper networking, VPC, and security group configurations
   - System must establish monitoring, logging, and alerting across all Google Cloud services
   - System must configure backup and disaster recovery procedures for the entire stack
   - System must optimize costs across all Google Cloud services

12. **Comprehensive Testing & Validation**
   - System must implement parallel testing environment to validate all functionality before switchover
   - System must test all user flows: registration, payment processing, diagnostic submissions, report generation
   - System must validate all integrations: Stripe payments, OpenAI API, email delivery, PDF generation
   - System must perform load testing to ensure performance under production traffic
   - System must conduct security testing and vulnerability assessments
   - System must validate data integrity and consistency across all Google Cloud services
   - System must test rollback procedures and disaster recovery scenarios
   - System must obtain stakeholder sign-off on all testing results before service shutdown

13. **Comprehensive Documentation & Training**
   - System must document complete deployment process and rollback procedures
   - System must create operational runbooks for Google Cloud infrastructure management
   - System must establish coding standards and integration patterns for Google Cloud
   - System must document security procedures and access management across all services
   - System must create training materials and conduct team training on Google Cloud operations

## Non-Goals (Out of Scope)

- Implementation of actual media capture features (separate PRDs)
- User interface development for storage management
- Real-time media processing or transformation
- Advanced analytics or machine learning on stored media
- Third-party storage integration beyond Google Cloud
- Legacy system maintenance during migration period

## Design Considerations

- Follow Google Cloud Storage best practices and enterprise patterns
- Implement cost-effective storage strategies with appropriate lifecycle policies
- Design for horizontal scaling and high availability
- Consider regulatory compliance requirements for media storage
- Plan for global distribution and edge caching if needed
- Design storage structure to support future AI/ML processing requirements

## Technical Considerations

- Use Google Cloud Storage client libraries and recommended SDKs
- Implement proper error handling and retry mechanisms
- Configure appropriate CORS settings for web application integration
- Establish proper backup and disaster recovery procedures
- Consider data residency requirements for international users
- Implement proper monitoring and observability throughout the stack
- Plan for BigQuery slot management and query optimization

## Data Requirements

- Comprehensive inventory of existing BigQuery schemas and relationships
- Documentation of all data transformation and processing requirements  
- Mapping of data relationships between Supabase and Google Cloud systems
- Definition of metadata schemas for all media types
- Specification of retention policies and archival requirements
- Documentation of access patterns and query requirements

**Data Flow Pipeline Requirements:**
- **Website Form Data**: Must be classified as operational (Cloud SQL) vs analytical (BigQuery)
- **Customer Input Pipeline**: Direct routing from form submission to existing BigQuery schemas
- **Media File Pipeline**: Cloud Storage → metadata extraction → BigQuery analytical tables
- **Real-time Analytics**: Streaming pipeline for immediate dashboard updates
- **Batch Processing**: Daily/hourly aggregation pipelines for reporting and ML

**Example Metadata Schemas:**
- **Images**: Must include height, width, format, file_size_bytes, capture_timestamp, equipment_type, diagnostic_session_id
- **Videos**: Must include duration_seconds, codec, bitrate, resolution, fps, audio_codec, file_size_bytes, equipment_type, diagnostic_session_id
- **Audio**: Must include duration_seconds, sample_rate, bitrate, format, noise_level_db, equipment_type, diagnostic_session_id
- **Documents**: Must include page_count, format, extracted_text_length, processing_status, equipment_type, diagnostic_session_id

## Acceptance Criteria

**Audit Completion:**
- Complete inventory of existing BigQuery infrastructure documented
- All gaps and requirements for media storage identified
- Current system capabilities and limitations clearly understood
- Performance baseline established for comparison

**Infrastructure Setup:**
- Professional Google Cloud Storage bucket structure implemented
- All security and access controls properly configured
- Development, staging, and production environments established
- A full migration test in the staging environment completes with zero data loss and is validated by a checksum comparison of 100% of files

**Documentation & Training:**
- Complete architecture documentation created and reviewed
- Operational procedures documented and tested
- Development team trained on new infrastructure
- Security procedures validated and approved

**Testing & Validation Complete:**
- All user flows tested and validated on Google Cloud infrastructure
- All integrations (Stripe, OpenAI, email, PDF) working correctly
- Load testing passes with performance targets met
- Security testing completed with no critical vulnerabilities
- Stakeholder sign-off obtained on all testing results

**Production Readiness:**
- Deployment strategy approved by stakeholders
- Google Cloud infrastructure tested and validated
- Rollback procedures verified and tested
- Operational procedures documented and confirmed

## Success Metrics

- GitHub to Google Cloud deployment pipeline setup completed within defined timeline
- All testing phases pass with 100% success rate before production switchover
- Infrastructure testing achieves 100% functionality validation across all services
- Performance testing shows 20% improvement over current Lovable + Supabase setup
- Security testing passes with zero critical vulnerabilities
- Cost optimization achieves at least 15% reduction in total infrastructure costs
- 99.95% uptime and functionality after switching from Lovable/Supabase to Google Cloud
- Complete shutdown of Lovable and Supabase services achieved with zero business disruption

## Research Requirements

**Google Cloud Storage Best Practices:**
- Enterprise bucket organization and naming conventions
- Optimal storage classes for different media types and access patterns
- Lifecycle management and cost optimization strategies
- Security and compliance configuration for sensitive data
- Integration patterns with BigQuery and other Google Cloud services
- CDN and global distribution strategies

**Integration Strategy Research:**
- Hybrid architecture patterns with Supabase and Google Cloud
- Data synchronization and consistency patterns across platforms
- API integration best practices for multi-platform operations
- Performance optimization for hybrid storage architectures

## Open Questions

1. **Data Flow Mapping**: What specific website form fields need to map to which existing BigQuery tables?
2. **Real-time vs Batch**: Which customer inputs require real-time streaming vs batch processing to BigQuery?
3. **Data Classification**: How should we classify which data goes to Cloud SQL (operational) vs BigQuery (analytical)?
4. **Schema Connection**: How to connect new Google Cloud deployment to existing BigQuery diagnostic data?
5. **Performance Requirements**: What are the latency requirements for data pipeline from website input to BigQuery?
6. **Data Volume**: What are the expected data volume growth patterns for capacity planning?
7. **Backup Strategy**: What backup frequency and testing schedule should be implemented for operational data?