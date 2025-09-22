# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## DiagnosticPro AI Development - Product Requirements Hub

This directory contains comprehensive Product Requirements Documents (PRDs) for transforming DiagnosticPro from a $4.99 automotive diagnostic service into a **universal AI-powered equipment diagnostic platform** supporting everything from cell phones to spacecraft.

**Market Transformation**: $100B automotive → $500B+ universal equipment market  
**Core Innovation**: Industry-first video diagnostics with real-time quality validation  
**Technical Stack**: Multi-modal Vertex AI + React + TypeScript + Google Cloud Storage

## Directory Structure Overview

```
ai-dev-feature/
├── PRDs/                    # Product Requirements Documents (8 PRDs) - YOU ARE HERE
│   ├── 01-08 numbered PRDs  # Complete feature specifications
│   └── README.md           # Comprehensive project overview
├── ADRs/                   # Architecture Decision Records (7 ADRs)
├── tasks/                  # Implementation task breakdowns (568 total tasks)
└── specifications/         # Technical specifications
```

## Product Requirements Documents (PRDs)

### Core Platform PRDs

**01. Storage Infrastructure** (`01-prd-storage-infrastructure.md`)
- Hybrid Supabase + Google Cloud Storage + BigQuery architecture
- Enterprise-grade media storage with analytics integration
- Migration planning from existing Supabase infrastructure

**02. AI API Integration** (`02-prd-ai-api-integration.md`)
- Multi-modal Vertex AI processing pipeline
- Separate Vision, Speech-to-Text, Document AI with unified orchestration
- Cost optimization leveraging Google Cloud startup credits

**08. Dynamic Diagnostic Input** (`08-prd-dynamic-diagnostic-input.md`)
- Universal equipment-specific diagnostic forms
- Equipment taxonomy supporting vehicles, electronics, appliances, industrial, agricultural
- JSON-based conditional question logic with equipment intelligence

### Media Capture System PRDs

**03. File Upload** (`03-prd-file-upload.md`)
- Professional drag-and-drop interface with chunked uploads
- Progress tracking and enterprise-grade file handling

**04. Camera Capture** (`04-prd-camera-capture.md`)
- AI-powered real-time quality validation with improvement guidance
- Equipment-specific photo requirements and validation rules

**05. Voice Audio Recording** (`05-prd-voice-audio-recording.md`)
- Professional recording interface with noise detection
- Speech-to-text integration and audio quality validation

**06. Video with Audio Capture** (`06-prd-video-audio-capture.md`) ⭐ **COMPETITIVE MOAT**
- Industry-first video diagnostic capability with substantial technical complexity
- Loom-style professional interface with synchronized audio/video analysis
- Real-time quality validation preventing poor submissions

### User Experience PRD

**07. UI/UX Design System** (`07-prd-ui-ux-design-system.md`)
- Progressive disclosure design with trust-building elements
- Professional interface supporting premium pricing ($4.99-$49.99)

**Total Implementation Scope: 568 detailed sub-tasks across all PRDs**

## Key Architecture Innovations

### 1. Industry-First Video Diagnostics
- **Real-time quality validation** preventing poor submissions
- **Equipment-specific guidance** for diagnostic-quality footage
- **Synchronized audio analysis** for equipment sounds + narration
- **Professional interface** users understand (Loom-style)

### 2. Universal Equipment Intelligence
- **Dynamic form generation** based on equipment selection
- **Equipment-specific AI prompts** tailored to each domain
- **Conditional logic trees** routing questions based on symptoms
- **Professional diagnostic quality** across all equipment types

### 3. Multi-Modal AI Pipeline
```
User Input → Vertex AI (Vision + Speech + Document) → Unified Analysis → Equipment-Specific Context → Professional Report
```

### 4. Hybrid Storage Architecture
```
Supabase (metadata) → Google Cloud Storage (media) → BigQuery (analytics)
```

## Implementation Phases

**Phase 1: Storage Infrastructure and AI Integration**
- Core data pipeline and Vertex AI multi-modal processing
- Foundation for all media capture features

**Phase 2: Basic Media Capture**
- File upload and camera capture with quality validation
- Professional interface foundations

**Phase 3: Advanced Media Capture**
- Voice recording and video capture with competitive moat
- Industry-first video diagnostic capabilities

**Phase 4: Universal Equipment Intelligence**
- Dynamic equipment-specific forms and AI analysis
- Complete platform transformation to universal coverage

**Phase 5: Market Expansion and Optimization**
- Performance optimization and market-ready platform
- Competitive dominance through feature sophistication

## Equipment Categories Supported

**Universal Equipment Taxonomy:**
- **Vehicles**: Cars, trucks, motorcycles, boats, aircraft, spacecraft
- **Electronics**: Phones, computers, TVs, gaming systems, smart devices
- **Appliances**: Kitchen, laundry, HVAC, water systems
- **Industrial**: Manufacturing equipment, construction machinery, power tools
- **Agricultural**: Tractors, harvesters, irrigation, livestock equipment
- **Aerospace**: Spacecraft, satellites, navigation, propulsion systems

Each equipment type receives specialized AI analysis, diagnostic questions, and media requirements.

## Development Commands

### Working with PRDs
```bash
# Read specific PRD for feature context
cat 01-prd-storage-infrastructure.md
cat 06-prd-video-audio-capture.md

# Review implementation tasks
ls -la ../tasks/
cat ../tasks/06-tasks-prd-video-audio-capture.md

# Check architectural decisions
ls -la ../ADRs/
cat ../ADRs/ADR-003-video-processing-strategy.md
```

### Documentation Navigation
```bash
# Complete project overview
cat README.md

# Task breakdown by feature (568 total tasks)
find ../tasks/ -name "*.md" -exec wc -l {} + | sort -n

# Architecture decisions
find ../ADRs/ -name "*.md" -exec basename {} \;
```

## Technical Integration Context

### Parent Platform Integration
- **Main Project**: `/home/jeremy/projects/diagnostic-platform/fix-it-detective-ai/`
- **Current State**: $4.99 automotive diagnostic service (GPT-4 + Stripe + Supabase)
- **Target State**: Universal equipment platform with video diagnostics
- **Technology Migration**: Automotive-only → Universal equipment support

### Related Projects
- **Platform Schema**: `/schema/` (BigQuery schemas, 266 tables)
- **Data Collection**: `/scraper/` (YouTube/Reddit/GitHub data collection)
- **Content Curation**: `/rss_feeds/` (226 RSS feeds for diagnostic content)

## Competitive Positioning

### Why This Creates Competitive Moat
1. **Technical Complexity**: Real-time video quality analysis is extremely difficult to implement
2. **Professional UX**: Loom-quality interface requires extensive refinement and optimization
3. **AI Integration**: Multi-modal equipment-specific analysis needs sophisticated orchestration
4. **Performance Optimization**: Video processing and quality control require years of optimization

### Success Metrics
- **Equipment Category Coverage**: >95% of common diagnostic scenarios
- **Diagnostic Accuracy**: >30% improvement with equipment-specific context
- **User Completion Rate**: >90% across all equipment types
- **Time to Complete**: <5 minutes for any diagnostic input
- **Competitive Advantage**: First-mover in universal video diagnostics

## Development Guidelines

### When Implementing Features
1. **Reference PRDs First**: Read complete product requirements before coding
2. **Follow Phase Sequence**: Implement features in documented phase order
3. **Equipment Context**: Consider universal equipment support in all features
4. **Quality Standards**: Maintain professional development standards
5. **Integration Awareness**: Ensure compatibility with existing platform components

### Implementation Approach
1. **PRD → Tasks → Implementation**: Follow the structured development workflow
2. **Quality Gates**: Real-time validation and professional interfaces required
3. **Equipment-Specific**: All features must work across equipment types
4. **Security First**: Follow established security framework for data handling
5. **Test Comprehensively**: Validate functionality across equipment categories

## Status

**Documentation Phase: Complete ✅**
- All 8 PRDs specified with comprehensive requirements
- All 568 sub-tasks broken down with clear scope
- Complete architectural transformation planned and documented

**Ready for Implementation**
The comprehensive implementation roadmap is ready for execution starting with Phase 1: Storage Infrastructure and AI Integration.

---

*This PRD directory represents the complete product specification for transforming DiagnosticPro into the world's first universal AI-powered equipment diagnostic platform with industry-first video diagnostic capabilities.*