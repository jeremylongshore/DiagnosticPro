# ADR-002: AI Processing Pipeline Architecture

**Date**: 2025-09-10  
**Status**: Accepted

## Context

DiagnosticPro AI platform currently uses OpenAI GPT-4 for text-based diagnostic analysis ($4.99 service). The platform needs to expand to multi-modal AI analysis supporting:

- Image analysis (equipment photos, diagnostic codes, damage assessment)
- Video analysis (equipment operation, visual problems)
- Audio analysis (equipment sounds, speech-to-text transcription)
- Document analysis (manuals, warranty documents, reports)

Key requirements:
- Industry-leading diagnostic accuracy across all media types
- Cost optimization leveraging Google Cloud startup credits
- Pre-payment quality validation to ensure customer value
- Scalable architecture that maintains profitability
- Integration with existing GPT-4 workflow
- Separate API strategies for different media types

## Decision

Implement **multi-modal AI processing pipeline** using:

1. **Separate Vertex AI API integrations** for each media type:
   - **Vision API** for image and video frame analysis
   - **Speech-to-Text API** for audio transcription and sound analysis
   - **Document AI API** for text extraction from documents
   - **AutoML** for custom diagnostic models (future expansion)

2. **Unified analysis orchestration** combining all AI outputs with existing GPT-4

3. **Modular service architecture** allowing independent API updates and optimization

4. **Pre-payment validation** using AI confidence scoring across all media types

## Consequences

### Positive
- Leverages Google Cloud startup program credits for all AI processing
- Best-in-class AI capabilities for each specific media type
- Modular architecture allows independent optimization of each API
- Scales efficiently with usage-based pricing
- Industry-leading multi-modal diagnostic capabilities
- Maintains existing successful GPT-4 text analysis workflow
- Cost transparency across different AI service types

### Negative
- Increased complexity managing multiple AI APIs
- Potential for API rate limiting across different services
- Need for sophisticated orchestration logic
- Higher development effort for multi-API integration
- Risk of vendor lock-in to Google Cloud ecosystem

## Alternatives Considered

### Option 1: OpenAI Multimodal (GPT-4 Vision + Whisper)
- **Pros**: Unified platform, existing relationship, simpler integration
- **Cons**: Higher costs, no startup credits, limited document AI capabilities
- **Reason for rejection**: Cost optimization critical for startup phase

### Option 2: Single Unified AI Platform (Azure Cognitive Services)
- **Pros**: Unified billing and management, consistent API patterns
- **Cons**: No startup credits, potentially inferior individual service quality
- **Reason for rejection**: Google Cloud credits provide significant cost advantage

### Option 3: Mix of Best-of-Breed APIs (OpenAI + Google + AWS)
- **Pros**: Optimal capability for each service type
- **Cons**: Complex billing, no unified credits, integration complexity
- **Reason for rejection**: Cost management and architectural complexity

## Implementation

1. **Phase 1: API Research and Integration**
   - Research and document all Vertex AI capabilities
   - Design modular service architecture for each API
   - Implement authentication and cost tracking

2. **Phase 2: Individual API Services**
   - Implement Vision API service for image/video analysis
   - Implement Speech-to-Text service for audio processing
   - Implement Document AI service for text extraction
   - Create quality validation for each service

3. **Phase 3: Orchestration and Integration**
   - Build unified analysis orchestrator
   - Integrate with existing GPT-4 workflow
   - Implement pre-payment validation system

4. **Phase 4: Optimization and Monitoring**
   - Implement cost tracking and optimization
   - Add performance monitoring and alerting
   - Create analytics for AI analysis quality

## Implementation Details

### API Service Pattern
```
MediaAnalysisService {
  - authenticate()
  - validateInput()
  - processMedia()
  - validateOutput()
  - handleErrors()
  - trackCosts()
}
```

### Orchestration Flow
```
1. Media Upload → Quality Pre-validation
2. Route to appropriate AI API(s)
3. Process and validate results
4. Combine with user text input
5. Send unified data to GPT-4 for final analysis
6. Generate comprehensive diagnostic report
```

### Cost Management
- Track API usage per diagnostic session
- Implement budget alerts and quotas
- Optimize processing strategies for cost efficiency
- Plan pricing adjustments based on actual AI costs

## References

- [AI API Integration PRD](../tasks/prd-ai-api-integration.md)
- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Google Cloud Pricing Calculator](https://cloud.google.com/products/calculator)
- [Multi-modal AI Best Practices](https://cloud.google.com/ai/docs/concepts/multimodal)