# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## DiagnosticPro AI Development Documentation Hub

This `ai-dev-feature` directory contains comprehensive architectural documentation for the DiagnosticPro platform migration and expansion from automotive diagnostics to universal equipment diagnostics. This is primarily a documentation repository with detailed PRDs, ADRs, and implementation tasks.

⚠️ **Current Priority**: Fresh Google Cloud deployment from GitHub (2-day deadline) - no data migration needed

## Key Commands

### Documentation Navigation
```bash
# Critical migration documents (CURRENT PRIORITY)
cat PRDs/00-prd-platform-migration.md          # Migration requirements
cat tasks/00-tasks-prd-platform-migration.md   # Hour-by-hour tasks
cat ADRs/ADR-000-platform-migration.md         # Architecture decisions
cat specifications/firestore-schema-mapping.md # Database schema design

# Architecture documentation
ls ADRs/                   # Architecture Decision Records (7 ADRs)
ls PRDs/                   # Product Requirements Documents (8 PRDs)  
ls tasks/                  # Implementation task breakdowns (568+ tasks)
ls specifications/         # Technical specifications

# Quick overview
cat README.md              # Project overview
cat PRDs/README.md         # Complete PRD documentation hub
```

### Development (Parent Directory)
```bash
# Navigate to main codebase (React/TypeScript application)
cd ..

# Development workflow
make dev                    # Start development server
make safe-commit           # Run all checks before committing (REQUIRED)
make install               # Install dependencies and setup hooks
make full-check           # Run lint, type-check, format, and tests

# Testing and quality
npm test                   # Run Jest tests
npm run test:watch        # Watch mode for development
npm run lint              # ESLint checks
npm run build             # Production build
npx tsc --noEmit          # TypeScript type checking
```

### Task Management
```bash
# Count total tasks across all PRDs
find tasks/ -name "*.md" -exec grep -c "^- \[ \]" {} + | awk '{sum+=$1} END{print "Total tasks: " sum}'

# View specific PRD tasks
cat tasks/00-tasks-prd-platform-migration.md   # Urgent migration tasks
cat tasks/06-tasks-prd-video-audio-capture.md  # Video diagnostic feature
cat tasks/08-tasks-prd-dynamic-diagnostic-input.md  # Universal equipment forms

# Check task completion status
grep -r "^\- \[x\]" tasks/ | wc -l             # Completed tasks
grep -r "^\- \[ \]" tasks/ | wc -l             # Pending tasks
```

## Project Architecture

### Documentation Structure
```
ai-dev-feature/
├── ADRs/                           # Architecture Decision Records (7 ADRs)
│   ├── ADR-000-platform-migration.md    # 🚨 URGENT: Migration architecture
│   ├── ADR-001-storage-architecture.md  # Hybrid storage strategy
│   ├── ADR-002-ai-processing-pipeline.md # Multi-modal AI system
│   ├── ADR-003-video-processing-strategy.md # Video diagnostic moat
│   ├── ADR-004-security-privacy-framework.md # Security guidelines
│   ├── ADR-005-development-environment-strategy.md # Dev workflow
│   ├── ADR-006-ui-ux-design-strategy.md # Professional interface design
│   └── ADR-007-universal-equipment-diagnostics.md # Equipment taxonomy
├── PRDs/                           # Product Requirements Documents (8 PRDs)
│   ├── 00-prd-platform-migration.md     # 🚨 URGENT: 2-day migration plan
│   ├── 01-prd-storage-infrastructure.md # Hybrid storage system
│   ├── 02-prd-ai-api-integration.md     # Multi-modal Vertex AI
│   ├── 03-prd-file-upload.md            # Professional file handling
│   ├── 04-prd-camera-capture.md         # AI-powered photo validation
│   ├── 05-prd-voice-audio-recording.md  # Speech processing
│   ├── 06-prd-video-audio-capture.md    # ⭐ Competitive moat feature
│   ├── 07-prd-ui-ux-design-system.md    # Professional interface
│   └── 08-prd-dynamic-diagnostic-input.md # Universal equipment forms
├── tasks/                          # Implementation task lists (568+ total)
│   ├── 00-tasks-prd-platform-migration.md  # 🚨 URGENT: Hour-by-hour breakdown
│   └── 01-08 corresponding task files    # Feature implementation tasks
├── specifications/                 # Technical specifications
│   ├── firestore-schema-mapping.md      # Database migration details
│   ├── firebase-deployment-analysis.md  # Deployment strategy
│   ├── google-secret-manager-setup.md   # Security configuration
│   ├── staging-domain-strategy.md       # Multi-domain testing
│   ├── TESTING_PLAN.md                  # Comprehensive testing strategy
│   └── STRIPE_WEBHOOK_SETUP.md          # Payment integration
└── Documents/                      # Additional resources and templates
```

### Main Application (Parent Directory)
- **Tech Stack**: React 18 + TypeScript + Vite + shadcn/ui
- **Current Backend**: Supabase (PostgreSQL + Edge Functions)
- **Target Backend**: Firebase Hosting + Firestore + Cloud Functions
- **AI**: OpenAI GPT-4 → Vertex AI migration
- **Payment**: Stripe (unchanged)

## Current Deployment Priority (2-Day Timeline)

### URGENT Tasks (Thursday-Friday)
1. **Fresh Deployment**: Deploy GitHub code to Google Cloud
2. **Function Conversion**: 8 Supabase Edge Functions → Cloud Functions
3. **Fresh Database**: New Firestore collections (no data migration)
4. **AI Service**: OpenAI → Vertex AI integration
5. **Testing**: End-to-end workflow validation

### Critical Files for Fresh Deployment
```bash
# Read these migration documents FIRST
PRDs/00-prd-platform-migration.md     # Complete migration plan
tasks/00-tasks-prd-platform-migration.md  # Hour-by-hour tasks
ADRs/ADR-000-platform-migration.md    # Architecture decisions
specifications/firestore-schema-mapping.md  # Fresh database schema design
specifications/firebase-deployment-analysis.md  # Deployment strategy
specifications/staging-domain-strategy.md  # Testing approach
```

## Documentation Patterns and Standards

### PRD Structure
Each PRD follows a consistent format:
- **Goals**: Clear business objectives
- **Technical Requirements**: Specific implementation needs
- **User Stories**: Functionality from user perspective
- **Acceptance Criteria**: Definition of done
- **Implementation Timeline**: Phase-based approach

### ADR Format
Architecture decisions include:
- **Context**: Problem being solved
- **Decision**: Chosen solution
- **Status**: Accepted/Proposed/Deprecated
- **Consequences**: Trade-offs and implications

### Task Organization
- **568+ total tasks** across all PRDs
- **Granular sub-tasks** with clear deliverables
- **Priority ordering** based on dependencies
- **Time estimates** for implementation planning

## Key Technical Context

### Universal Equipment Expansion
- **Current**: $4.99 automotive diagnostic service
- **Target**: Universal equipment diagnostic platform ($4.99-$49.99 pricing)
- **Market Expansion**: $100B automotive → $500B+ universal equipment
- **Equipment Types**: Vehicles, electronics, appliances, industrial, agricultural, aerospace

### Competitive Advantages
1. **Video Diagnostics**: Industry-first video analysis with quality validation
2. **Multi-Modal AI**: Vision + Speech + Document processing pipeline
3. **Professional Quality**: Enterprise-grade interfaces and validation
4. **Equipment Intelligence**: Dynamic forms based on equipment selection

### Implementation Phases
1. **Phase 0**: Fresh deployment (CURRENT - Thursday/Friday)
2. **Phase 1**: Storage infrastructure and AI integration
3. **Phase 2**: Basic media capture (file upload, camera)
4. **Phase 3**: Advanced media capture (voice, video diagnostics)
5. **Phase 4**: Universal equipment intelligence
6. **Phase 5**: Market expansion and optimization

## Development Guidelines

### Working with Documentation
1. **Start with PRDs**: Complete product requirements before implementation
2. **Review ADRs**: Understand architectural decisions for context
3. **Follow Task Lists**: Use granular sub-task breakdowns (568+ total tasks)
4. **Migration Priority**: Focus on PRD-00/Tasks-00/ADR-000 for immediate work

### Integration with Main Codebase
- **Main Project**: Parent directory contains React application
- **Makefile**: Use parent directory Makefile for development commands
- **Testing**: Jest tests with React Testing Library in parent directory
- **Build System**: Vite build system with TypeScript strict mode

### Documentation Navigation Tips
```bash
# Find all migration-related content
grep -r "migration\|Migration" . --include="*.md"

# Search for specific equipment types
grep -r "vehicle\|automotive\|electronics" PRDs/ --include="*.md"

# Find all urgent/priority items
grep -r "URGENT\|priority\|Priority" . --include="*.md"

# Count documentation scope
wc -l ADRs/*.md PRDs/*.md tasks/*.md | tail -1  # Total lines of documentation
```

## Project Context

This documentation hub serves the DiagnosticPro platform transformation:
- **Current**: $4.99 automotive diagnostic service
- **Target**: Universal equipment diagnostic platform ($4.99-$49.99 pricing)
- **Market Expansion**: $100B automotive → $500B+ universal equipment
- **Core Innovation**: Real-time video diagnostic quality validation

### Related Projects
Part of the broader DiagnosticPro platform ecosystem:
- `schema/`: BigQuery schemas (266 tables)
- `scraper/`: Data collection systems
- `rss_feeds/`: Content curation (226 feeds)

## Success Metrics
- **Equipment Coverage**: >95% of diagnostic scenarios
- **User Completion**: >90% across equipment types
- **Response Time**: <5 minutes for any diagnostic
- **Competitive Advantage**: First-mover in video diagnostics