# Changelog

All notable changes to DiagnosticPro will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.0] - 2026-03-27

### Added
- **Whop Membership Integration** - Hybrid monetization with $4.99 one-time + $29/mo PRO membership
  - OAuth PKCE authentication flow
  - Member verification and free diagnostic access
  - Webhook handling for membership status changes
- **Playwright E2E Test Suite** - 12 end-to-end tests covering critical user flows
- **Gemini PR Review Workflow** - Automated code review via GitHub Actions
- **GitHub Sponsors Funding** - Added funding.yml with GitHub Sponsors + Buy Me a Coffee
- **CODE_OF_CONDUCT.md** - Contributor Covenant v2.1 for community standards

### Fixed
- **PDF Ghost Pages** - Eliminated pdfkit auto-pagination creating 104 pages instead of 18
- **Security Audit** - Webhook signature verification, rate limiting, dead code removal
- **Markdown Heading Parser** - Handle `##` headings from Gemini 2.5 Flash responses
- **Gemini Model Upgrade** - Replaced deprecated `gemini-2.0-flash-exp` with `gemini-2.5-flash`
- **Payment API Key Handling** - Read Stripe key from env vars instead of hardcoded placeholder
- **Firebase Deployment** - Added missing env vars and Node 20 requirement for CLI
- **CI Pipeline** - Resolved pre-existing test failures, aligned Jest config with v2.1.0

### Changed
- **Firebase Hosting Deploy** - Added to CI/CD workflow for automatic frontend deployment

## [2.1.0] - 2026-02-25

### Added
- **Universal Equipment Support** - Expanded from automotive-only to 15 equipment categories:
  - Cars & SUVs, Gas Trucks, Diesel Trucks, Semi Trucks, Motorcycles, ATVs/UTVs
  - RVs, Marine/Boats, Farm & Ag, Compact Equipment, Lawn & Garden
  - Power Tools, HVAC, Golf Carts, Electronics
- **Equipment-Specific Form Fields** - Dynamic form rendering based on equipment type with type-specific fields, symptoms, and identifiers
- **Equipment-Specific AI Prompts** - Custom diagnostic context for each equipment type (replaces hardcoded Ford F-150 framing)
- **Expanded Error Code Extraction** - Support for J1939 SPN/FMI (semi trucks), manufacturer codes, and blink/flash codes
- **Equipment Landing Pages** - SEO-friendly routes at `/equipment/:slug` for each equipment type
- **Share with Mechanic** - One-click report sharing via Web Share API with clipboard fallback
- **Report Persistence** - localStorage saves last 10 report links for easy access
- **Google Secret Manager Integration** - Production secrets management with Workload Identity Federation
- **HUSTLE Light Theme** - Professional clean UI theme

### Fixed
- **Critical: Ford F-150 Hardcoding** - AI prompt no longer assumes all submissions are Ford F-150 crank/no-start cases
- **Section 15 Mismatch** - PDF generator now correctly uses `nextStepsSummary` matching prompt and parser
- **PDF Array Rendering** - `cleanSectionContent()` now preserves bullet list formatting
- **Stale Form Fields** - Equipment type changes now reset all dynamic fields
- **Async PDF Generation** - Added missing async/await to PDF generation promise

### Changed
- **Marketing Integrity Cleanup** - Removed fabricated statistics and fake testimonials
  - Replaced $600B/73%/3.2x stats with honest comparison scenarios
  - Replaced fake testimonials with illustrative report examples
  - Removed aerospace category and "cellphones to spaceships" claims
- **2-Step Form Flow** - Simplified initial form with collapsible detailed information section
- **Honest Value Proposition** - Hero section now accurately describes the $4.99 AI diagnostic service
- **Manufacturer Data** - Expanded to 1,400+ lines covering all 15 equipment categories

### Removed
- ~1,800 lines of dead code across frontend, backend, and functions
- Aerospace equipment category (not a realistic use case)
- Fabricated social proof ("trusted by repair shops nationwide")

### Security
- Implemented Google Secret Manager for production credentials
- Workload Identity Federation for secure GCP authentication
- Repository prepared for public release with secrets audit

## [2.0.0] - 2025-10-20

### 🎯 Major PDF Generation Overhaul

This release completely rebuilds the PDF generation system to fix critical issues affecting every customer report.

### Added
- **Root Cause Analysis Section** - Added as 15th critical section in diagnostic framework
- **PDF Validation System** - Comprehensive validation before customer delivery
  - Section presence validation
  - Content quality checks
  - Blank page detection
  - Excessive whitespace removal
- **Typography Manager** - Professional document formatting
  - Proper bullet point indentation with hanging text
  - Orphan/widow control
  - Controlled pagination
- **Diagnostic Report Contract** - Formal specification for AI responses

### Fixed
- **Critical: 2:1 Page Ratio Bug** - Reports were generating 36 pages instead of 12
  - Root cause: PDFKit auto-pagination was creating 2 blank pages per content page
  - Solution: Disabled auto-pagination with `continued: false` on all text calls
- **Missing Root Cause Analysis** - Section was not being generated or included
- **Typography Issues** - Improper bullet formatting and text wrapping
- **Excessive Blank Pages** - Eliminated 24 blank pages at end of reports

### Changed
- PDF generator moved from `reportPdf.js` to `reportPdfProduction.js`
- Implemented controlled page creation with `autoFirstPage: false`
- Reduced average PDF size from 36 pages to 12-15 pages

## [Unreleased] - Photo Upload System (Feature Branch)

**Branch**: `feature/photo-upload-identity-system`
**Status**: ⏸️ PAUSED - Infrastructure deployed, code rolled back
**Date**: 2025-10-14

## ⚠️ ROLLBACK SUMMARY

This release was developed (~5,000 lines of code) but **ROLLED BACK** due to undefined payment flow. All code preserved on feature branch. Infrastructure deployed to production but unused (costs $0).

### Infrastructure DEPLOYED (ACTIVE but unused)
- ✅ **GCS Buckets**: `gs://diagnostic-pro-prod-uploads`, `gs://dp-derived` with CORS
- ✅ **Pub/Sub**: Topics `dp-upload-events`, `dp-analysis`, `dp-analysis-dlq` + subscriptions
- ✅ **BigQuery**: 7 new tables in `diagnostic-pro-prod.diagnosticpro_prod`:
  - `customer_identity` - Deterministic SHA256-based customer IDs
  - `vehicle_identity` - VIN normalization and vehicle tracking
  - `submissions` - Enhanced diagnostics with identity graph
  - `assets` - Photo/document uploads (receipt, workorder, equipment)
  - `analyses` - Gemini Vision API results with JSON extraction
  - `symptoms` - Structured ML training data
  - `equipment_nft` - Future blockchain integration

### Backend Code (NOT DEPLOYED - on branch)
- ❌ `/upload-url` endpoint - Signed URL generation for direct GCS uploads
- ❌ Enhanced `/saveSubmission` - Identity tracking (customerId, vehicleId)
- ❌ `utils/identity.js` - Deterministic ID generation (SHA256 hashing)
- ❌ Cloud Functions:
  - `storage-handler` - Image normalization (JPEG, EXIF strip, resize, thumbnail)
  - `analysis-worker` - Gemini Vision API integration

### Frontend Code (NOT DEPLOYED - on branch)
- ❌ `PhotoUpload.tsx` - React component with camera capture + compression
- ❌ `photo-upload-vanilla.js` - Framework-free vanilla JS alternative
- ❌ Client-side compression: 2MB limit, 4096px max dimension

### Documentation Added
- `061-ref-opeyemi-devops-system-analysis.md` - DevOps architecture
- `062-ref-complete-implementation-guide.md` - Full specifications
- `063-log-implementation-ready-handoff.md` - Handoff docs
- `064-log-missing-code-implementation-complete.md` - Code completion
- `065-rpt-ultrathink-verification-report.md` - Verification (corrected)
- `066-anl-subagent-deployment-strategy.md` - Agent mapping (23/79)
- `067-log-photo-upload-rollback.md` - Complete rollback documentation
- `068-sum-deployment-status.md` - Quick status summary

### Security Features Implemented (not deployed)
- Magic byte validation (file-type library, not extensions)
- 15MB file size limit, 4096px max dimension
- EXIF metadata stripping for privacy
- Signed URLs with 10-minute expiry (PUT-only)
- Public Access Prevention on all GCS buckets
- CORS restricted to diagnosticpro.io + localhost

### Rollback Details
- **Date**: 2025-10-14T15:25:00Z
- **Rolled Back From**: Cloud Run revision `00043-rb8`
- **Rolled Back To**: Cloud Run revision `00041-pxk` (stable)
- **Reason**: Payment flow undefined - when/how do customers pay for photos?
- **Customer Impact**: NONE - website functioning normally
- **Data Loss**: NONE - no production data affected

### Pending Decisions (BLOCKER)
1. **Payment Model**: Pay before upload? After upload? Tiered pricing? Free enhancement?
2. **Pricing**: Keep $4.99 or increase to $9.99/$14.99 with photos?
3. **UI/UX**: When does photo upload appear in customer flow?
4. **AI Costs**: Does Gemini Vision justify price increase?

### Total Code Written
- 27 files changed
- 10,524 insertions
- ~5,000 lines of production code
- ~5,500 lines of documentation

### To Resume This Feature
```bash
git checkout feature/photo-upload-identity-system
# Review 067-log-photo-upload-rollback.md
# Decide payment model
# Deploy to dev/staging first
```

---

# Release v1.1.0

**Release Date**: 2025-09-30
**Release Type**: Minor Release - PDF Enhancements & Infrastructure

## 🎯 Summary

This release includes major PDF format improvements, comprehensive infrastructure enhancements, and security upgrades that significantly improve the DiagnosticPro platform.

## 📄 NEW: Enhanced PDF Report Format

### ✨ Visual Improvements
- **Emoji Section Headers**: Each of the 14 sections now has distinctive emoji headers for better readability
- **IBM Plex Mono Font**: Professional monospaced font for technical content and code sections
- **Improved Layout**: Better spacing, typography, and visual hierarchy
- **Section Organization**: Clearer separation between diagnostic sections

### 🎯 Updated 14-Section Framework
- 🎯 **PRIMARY DIAGNOSIS** - Root cause with confidence percentage
- 🔍 **DIFFERENTIAL DIAGNOSIS** - Alternative causes ranked by likelihood
- ✅ **DIAGNOSTIC VERIFICATION** - Exact tests shops must perform
- ❓ **SHOP INTERROGATION** - 5 technical questions to expose incompetence
- 🗣️ **CONVERSATION SCRIPTING** - Word-for-word customer coaching
- 💸 **COST BREAKDOWN** - Fair pricing vs overcharge identification
- 🚩 **RIPOFF DETECTION** - Scam identification and protection
- ⚖️ **AUTHORIZATION GUIDE** - Approve/reject/second opinion recommendations
- 🔧 **TECHNICAL EDUCATION** - System operation and failure mechanisms
- 📦 **OEM PARTS STRATEGY** - Specific part numbers and sourcing
- 💬 **NEGOTIATION TACTICS** - Professional negotiation strategies
- 🔬 **LIKELY CAUSES** - Ranked confidence percentages
- 📊 **RECOMMENDATIONS** - Immediate actions and maintenance
- 🔗 **SOURCE VERIFICATION** - Authoritative links and TSB references

### 🛠️ Backend PDF Improvements
- **Error Handling**: Enhanced error handling in `reportPdf.js`
- **Module Support**: Added `.mjs` ES module compatibility
- **Font Management**: Improved font loading and fallback systems
- **Performance**: Optimized PDF generation speed and memory usage

## 🔒 Security & Infrastructure

### ✅ Repository Governance
- **CODEOWNERS**: Added comprehensive code review governance
- **Security Policy**: Added `SECURITY.md` with vulnerability reporting
- **Branch Protection**: Maintained security controls on main branch

### 🛠️ CI/CD Pipeline
- **GitHub Actions**: Implemented automated testing workflow
- **Quality Gates**: Code quality and security scanning
- **Development Standards**: Standardized development procedures

### 📚 Documentation Enhancements
- **Contributing Guide**: Comprehensive `CONTRIBUTING.md`
- **DevOps Setup**: Added deployment and maintenance procedures
- **Market Analysis**: Business opportunity documentation

## 🔧 Technical Improvements

### 🚀 Development Tools
- **Setup Scripts**: Automated bootstrap and verification scripts
- **Firebase Config**: Enhanced hosting and performance settings
- **Module Compatibility**: Better ES6+ and CommonJS support

### 📱 Infrastructure Updates
- **Cloud Run**: Improved backend configuration
- **Firebase**: Enhanced hosting and storage settings
- **API Gateway**: Maintained secure public endpoints

## 🔄 Migration & Compatibility

- ✅ All PDF reports now use enhanced format automatically
- ✅ Backwards compatible - no breaking changes
- ✅ Existing customer data preserved
- ✅ All 14 diagnostic sections maintained

## 📊 Release Metrics

| Improvement Type | Count |
|-----------------|-------|
| PDF Format Enhancements | 8 |
| Infrastructure Additions | 11 |
| Security Improvements | 4 |
| Documentation Updates | 6 |
| Backend Optimizations | 3 |

---

# Release v1.0.0

**Release Date**: 2025-09-30
**Release Type**: Major Release - AI Diagnostic Platform
**Total Improvements**: 25+ major features

## 🎯 Summary

This is the inaugural release of DiagnosticPro AI diagnostic platform featuring a proprietary 14-section analysis framework. The platform provides comprehensive equipment diagnostics with advanced AI analysis, customer conversation coaching, and professional report generation.

## 🔒 Security Features
- Secure Cloud Run backend with IAM authentication
- Firebase security rules for data protection
- Stripe payment integration with webhook validation
- Signed URL generation for secure file access
- Secret Manager integration for sensitive data

## 📚 Core Platform Features
- React 18 + TypeScript frontend with professional UI
- Firebase Hosting with custom domain (diagnosticpro.io)
- Firestore database with real-time capabilities
- Google Cloud Run scalable backend infrastructure
- Vertex AI Gemini 2.5 Flash integration

## 🧠 Proprietary AI Framework
- **14-Section Diagnostic Analysis**: Comprehensive analysis structure
- **Conversation Scripting**: Word-for-word customer coaching
- **Shop Interrogation**: Technical questions to expose incompetence
- **Ripoff Detection**: Scam identification and protection
- **Negotiation Tactics**: Professional negotiation strategies
- **Source Verification**: Authoritative links and TSB references
- **OEM Parts Strategy**: Specific part numbers and sourcing
- **Cost Breakdown**: Fair pricing analysis and overcharge detection

## 🏗️ Infrastructure
- Google Cloud Platform production deployment
- Cloud Storage with uniform bucket-level access
- API Gateway for secure public endpoints
- Firestore collections: diagnosticSubmissions, orders, emailLogs
- Professional PDF generation with PDFKit
- Email delivery system for report distribution

## 💻 Code Quality
- TypeScript strict mode with comprehensive type safety
- ESLint and Prettier for code consistency
- Component-based architecture with shadcn/ui
- Comprehensive error handling and logging
- Structured API responses with request tracing

## 👥 Customer Experience
- $4.99 affordable diagnostic pricing
- Professional PDF reports (2000+ words)
- Instant download after payment
- Mobile-optimized responsive design
- Comprehensive equipment coverage

## 📊 Technical Specifications

| Component | Technology | Status |
|-----------|------------|--------|
| Frontend | React 18 + TypeScript + Vite | ✅ Production |
| Backend | Node.js + Express + Cloud Run | ✅ Production |
| Database | Firestore + BigQuery | ✅ Production |
| AI Engine | Vertex AI Gemini 2.5 Flash | ✅ Production |
| Storage | Firebase Cloud Storage | ✅ Production |
| Payments | Stripe Checkout + Webhooks | ✅ Production |
| Domain | diagnosticpro.io | ✅ Production |

## 🔄 Migration Guide

This is the initial release - no migration required.

Key setup requirements:
- Google Cloud Platform project: diagnostic-pro-prod
- Firebase project configuration
- Stripe payment setup
- Domain configuration for diagnosticpro.io

## 👏 Contributors

- Complete platform architecture and development
- Proprietary AI framework design and implementation
- Production infrastructure deployment
- Security and compliance implementation

## 📝 Documentation

- Complete CLAUDE.md with platform architecture
- Comprehensive deployment documentation (116+ docs)
- API documentation and integration guides
- Security and compliance documentation

## 🚀 Production Deployment

**Live Platform**: https://diagnosticpro.io
**Backend API**: Cloud Run (private, API Gateway protected)
**Status**: ✅ FULLY OPERATIONAL

### Key Metrics
- End-to-end success rate: >95% target
- Response time: <30 seconds for AI analysis
- PDF generation: <5 seconds
- Customer satisfaction: >4.5/5 target

## 🔮 Future Roadmap

- File upload for diagnostic photos/videos
- Multi-equipment support expansion
- Advanced analytics and reporting
- Mobile app development
- API partnerships with repair shops

---

**Next Release**: v1.1.0 (planned for Q4 2025)
*Generated automatically by Release System*