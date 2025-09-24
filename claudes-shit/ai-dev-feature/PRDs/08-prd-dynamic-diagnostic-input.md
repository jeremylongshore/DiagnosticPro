# PRD: Dynamic Equipment-Specific Diagnostic Input System

**Date**: 2025-09-10  
**Status**: Draft

## Introduction/Overview

Transform the DiagnosticPro AI platform from car-focused diagnostics to **universal equipment diagnostics** with dynamic, equipment-specific data input forms. The system must intelligently adapt questions, fields, and media capture requirements based on equipment type - from cell phones to bulldozers, appliances to industrial machinery.

## Goals

1. Create universal equipment categorization system supporting all diagnostic scenarios
2. Implement dynamic form generation with equipment-specific question sets
3. Design intelligent question trees that adapt based on user responses
4. Establish equipment-specific media requirements and guidance
5. Build scalable system supporting infinite equipment types and categories
6. Maintain professional diagnostic quality across all equipment domains
7. Ensure seamless integration with existing AI analysis and media capture systems

## User Stories

- **As a homeowner with a broken refrigerator**, I want questions about cooling, electrical, and mechanical issues specific to appliances
- **As a construction worker with bulldozer problems**, I want questions about hydraulics, engine systems, and heavy machinery operations
- **As a tech repair shop**, I want detailed questions about device symptoms, error codes, and electronic diagnostics
- **As a facility manager**, I want equipment-specific questions for HVAC, industrial systems, and building equipment
- **As a farmer**, I want agricultural equipment questions covering tractors, harvesters, and irrigation systems
- **As a boat owner**, I want marine-specific questions about engines, electrical, and water-related issues

## Functional Requirements

### 1. Universal Equipment Categorization
- Hierarchical equipment taxonomy supporting all diagnostic scenarios:
  - **Vehicles**: Cars, trucks, motorcycles, boats, aircraft, heavy machinery
  - **Electronics**: Phones, computers, TVs, gaming systems, smart devices
  - **Appliances**: Kitchen, laundry, HVAC, water systems
  - **Industrial**: Manufacturing equipment, construction machinery, power tools
  - **Agricultural**: Tractors, harvesters, irrigation, livestock equipment
  - **Marine**: Boats, engines, navigation, safety equipment
- Dynamic subcategory expansion based on manufacturer and model data
- Equipment-specific terminology and diagnostic language

### 2. Dynamic Question Generation System
- Equipment-specific question sets with conditional logic trees
- Symptom-based question routing (electrical vs mechanical vs software issues)
- Manufacturer-specific questions when relevant (known common issues)
- Age/model-specific considerations affecting diagnostic approach
- Usage context questions (residential, commercial, industrial, emergency)

### 3. Adaptive Form Interface
- Progressive disclosure starting with equipment identification
- Smart question ordering based on diagnostic probability
- Skip logic preventing irrelevant questions
- Visual equipment selection with images and categories
- Search functionality for finding specific equipment types

### 4. Equipment-Specific Media Requirements
- Tailored media capture guidance per equipment type:
  - **Electronics**: Close-up photos of screens, error messages, ports
  - **Vehicles**: Engine bay, dashboard, under-vehicle shots
  - **Appliances**: Interior/exterior, control panels, connection points
  - **Industrial**: Safety considerations, operational state documentation
- Equipment-specific quality validation rules
- Context-aware recording instructions and safety warnings

### 5. Diagnostic Context Intelligence
- Equipment lifecycle considerations (new, aging, vintage)
- Environmental context (indoor, outdoor, industrial, residential)
- Usage intensity factors (daily use, seasonal, heavy-duty)
- Maintenance history relevance per equipment type
- Warranty and service consideration prompts

## Equipment Categories and Question Examples

### Electronics (Cell Phone)
```
Basic Info:
- Device manufacturer and model
- Operating system version
- Age of device
- Recent software updates

Symptoms:
- Screen issues (cracked, black, flickering, touch problems)
- Battery problems (won't charge, drains quickly, overheating)
- Performance issues (slow, freezing, app crashes)
- Connectivity problems (WiFi, cellular, Bluetooth)
- Audio/speaker problems
- Camera/photo issues

Context:
- Recent drops or water exposure
- Recent app installations
- Storage space availability
- Backup status
```

### Heavy Machinery (Bulldozer)
```
Basic Info:
- Manufacturer, model, year
- Engine type and specifications
- Operating hours
- Recent maintenance

Symptoms:
- Engine problems (won't start, overheating, loss of power)
- Hydraulic issues (slow operation, leaks, weak lift)
- Track/drivetrain problems (won't move, slipping, noise)
- Electrical issues (lights, instruments, starting system)
- Cooling system problems
- Fuel system issues

Context:
- Operating conditions (terrain, weather, load)
- Fluid levels and quality
- Recent repairs or parts replacement
- Safety system status
- Operational urgency
```

### Appliances (Refrigerator)
```
Basic Info:
- Brand, model, age
- Type (top freezer, side-by-side, French door)
- Energy rating and features

Symptoms:
- Temperature issues (too warm, too cold, inconsistent)
- Ice maker problems
- Water dispenser issues
- Noise problems (grinding, clicking, humming)
- Door seal issues
- Electrical problems

Context:
- Recent power outages
- Kitchen environment (hot, humid, ventilation)
- Usage patterns (family size, frequency)
- Recent cleaning or maintenance
- Energy consumption changes
```

## Technical Requirements

### 1. Dynamic Form Architecture
- JSON-based question configuration system
- Real-time form generation based on equipment selection
- Conditional logic engine for question routing
- Form state management with progress persistence
- Validation rules specific to equipment types

### 2. Equipment Database Integration
- Comprehensive equipment taxonomy with metadata
- Manufacturer and model databases with known issues
- Question template library for all equipment categories
- Diagnostic pattern recognition for common problems
- Integration with parts/service databases where applicable

### 3. AI Integration Enhancement
- Equipment-specific AI prompt engineering
- Contextual analysis based on equipment type
- Enhanced diagnostic accuracy through specialized knowledge
- Equipment-specific repair recommendations
- Integration with manufacturer documentation and manuals

## Non-Goals (Out of Scope)

- Real-time equipment database updates (static initial implementation)
- Equipment purchase recommendations or sales integration
- Direct manufacturer API integrations (initially)
- Complex CAD or technical drawing integration
- Real-time parts pricing or availability checking
- Multi-language equipment terminology (English first)

## Design Considerations

### Progressive Equipment Selection
```
1. Category Selection (Visual grid with icons)
2. Subcategory Refinement (Dropdown or search)
3. Manufacturer Selection (Popular brands first)
4. Model Identification (Search with suggestions)
5. Confirmation with equipment image
```

### Adaptive Question Flow
```
Equipment Type → Base Question Set → Symptom Routing → Detailed Questions → Media Requirements → Context Gathering
```

### Mobile-First Design
- Touch-friendly equipment selection
- Minimal typing with smart defaults
- Visual equipment identification aids
- Offline capability for field diagnostics

## Success Metrics

- Equipment category coverage > 95% of common diagnostic scenarios
- Question relevance score > 4.5/5 from users across all equipment types
- Diagnostic accuracy improvement > 30% with equipment-specific context
- User completion rate > 90% for appropriate equipment-specific forms
- Time to complete diagnostic input < 5 minutes for any equipment type
- Support ticket reduction > 60% related to irrelevant questions

## Implementation Phases

### Phase 1: Core Infrastructure
- Equipment taxonomy development
- Dynamic form generation system
- Basic question sets for major categories

### Phase 2: Equipment Specialization
- Detailed question sets for all equipment types
- Equipment-specific media requirements
- Conditional logic implementation

### Phase 3: Intelligence Enhancement
- AI prompt optimization per equipment type
- Equipment-specific diagnostic patterns
- Advanced question routing logic

### Phase 4: Advanced Features
- Manufacturer-specific known issues integration
- Equipment lifecycle considerations
- Advanced diagnostic context analysis

## Integration Requirements

- Seamless integration with existing media capture workflows
- Enhanced AI analysis with equipment-specific context
- Updated payment flow supporting varied complexity levels
- Equipment-specific result formatting and recommendations

## Open Questions

1. How should pricing vary based on equipment complexity (cell phone vs industrial machinery)?
2. Should there be different diagnostic depth levels (basic, professional, expert)?
3. How should the system handle vintage or uncommon equipment types?
4. Should equipment identification include barcode/QR code scanning?
5. How should safety warnings be integrated for dangerous equipment diagnostics?
6. Should the system suggest when professional service is required vs DIY diagnosis?