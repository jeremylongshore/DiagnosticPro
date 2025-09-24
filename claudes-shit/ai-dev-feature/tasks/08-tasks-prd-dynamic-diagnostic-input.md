# Task List: Dynamic Equipment-Specific Diagnostic Input System

Based on PRD: `prd-dynamic-diagnostic-input.md`

## Relevant Files

- `src/data/equipment-taxonomy.json` - Complete equipment categorization hierarchy
- `src/data/question-sets/` - Equipment-specific question configurations
- `src/components/EquipmentSelector/` - Dynamic equipment selection interface
- `src/components/DiagnosticForm/DynamicForm.tsx` - Dynamic form generation component
- `src/components/DiagnosticForm/QuestionEngine.tsx` - Conditional logic and question routing
- `src/components/DiagnosticForm/EquipmentWizard.tsx` - Progressive equipment identification
- `src/services/equipment-database.service.js` - Equipment data management and queries
- `src/services/question-generator.service.js` - Dynamic question generation logic
- `src/utils/equipment-classification.utils.js` - Equipment categorization utilities
- `src/utils/form-validation.utils.js` - Equipment-specific validation rules
- `src/hooks/useDynamicForm.ts` - Dynamic form state management
- `src/hooks/useEquipmentContext.ts` - Equipment-specific context management
- `data/equipment-categories/` - Detailed equipment category definitions
- `data/question-templates/` - Reusable question templates by equipment type
- `tests/equipment-selection/` - Equipment selection workflow testing
- `docs/equipment-taxonomy.md` - Complete equipment categorization documentation

### Notes

- Build on existing DiagnosticForm but make it completely dynamic
- Equipment taxonomy should be easily extensible for new categories
- Question generation must be fast and responsive for good UX
- Integration with existing media capture and AI analysis workflows
- All equipment types should have professional-quality question sets
- Run equipment-specific tests with `npm run test:equipment-types`

## Tasks

- [ ] 1.0 Universal Equipment Taxonomy Development
  - [ ] 1.1 Research and design comprehensive equipment categorization hierarchy
  - [ ] 1.2 Create detailed taxonomy for vehicles (cars, trucks, motorcycles, boats, aircraft, heavy machinery)
  - [ ] 1.3 Develop electronics categorization (phones, computers, TVs, gaming, smart devices)
  - [ ] 1.4 Build appliance categories (kitchen, laundry, HVAC, water systems)
  - [ ] 1.5 Design industrial equipment classification (manufacturing, construction, power tools)
  - [ ] 1.6 Create agricultural equipment taxonomy (tractors, harvesters, irrigation, livestock)
  - [ ] 1.7 Establish marine equipment categories (boats, engines, navigation, safety)
  - [ ] 1.8 Implement extensible taxonomy structure for future equipment additions

- [ ] 2.0 Equipment-Specific Question Set Development
  - [ ] 2.1 Create comprehensive question sets for automotive diagnostics
  - [ ] 2.2 Develop electronics diagnostic questions (phones, computers, devices)
  - [ ] 2.3 Build appliance diagnostic question templates (refrigerators, washers, HVAC)
  - [ ] 2.4 Design heavy machinery diagnostic questions (construction, industrial equipment)
  - [ ] 2.5 Create agricultural equipment diagnostic question sets
  - [ ] 2.6 Develop marine equipment diagnostic questions
  - [ ] 2.7 Build specialized question sets for emerging equipment categories
  - [ ] 2.8 Implement question validation and quality assurance for all equipment types

- [ ] 3.0 Dynamic Equipment Selection Interface
  - [ ] 3.1 Design visual equipment category selection with icons and imagery
  - [ ] 3.2 Create intelligent equipment search with autocomplete and suggestions
  - [ ] 3.3 Build progressive equipment identification wizard
  - [ ] 3.4 Implement manufacturer and model selection with popular brands prioritized
  - [ ] 3.5 Create equipment confirmation interface with visual verification
  - [ ] 3.6 Design mobile-optimized equipment selection for touch interfaces
  - [ ] 3.7 Add equipment identification assistance (barcode scanning, image recognition)

- [ ] 4.0 Dynamic Form Generation Engine
  - [ ] 4.1 Implement JSON-based question configuration system
  - [ ] 4.2 Create real-time form generation based on equipment selection
  - [ ] 4.3 Build conditional logic engine for question routing and skip logic
  - [ ] 4.4 Develop form state management with progress persistence
  - [ ] 4.5 Implement equipment-specific validation rules and constraints
  - [ ] 4.6 Create dynamic field types (text, dropdown, multi-select, range, boolean)
  - [ ] 4.7 Build form preview and testing system for quality assurance

- [ ] 5.0 Question Routing and Logic System
  - [ ] 5.1 Implement symptom-based question routing logic
  - [ ] 5.2 Create conditional question trees based on previous responses
  - [ ] 5.3 Build intelligent question ordering based on diagnostic probability
  - [ ] 5.4 Develop question relevance scoring and optimization
  - [ ] 5.5 Implement skip logic for irrelevant question branches
  - [ ] 5.6 Create question dependency management and validation
  - [ ] 5.7 Build adaptive questioning based on user expertise level

- [ ] 6.0 Equipment-Specific Media Requirements
  - [ ] 6.1 Define media capture requirements for each equipment category
  - [ ] 6.2 Create equipment-specific photo guidance and examples
  - [ ] 6.3 Develop safety warnings and considerations for dangerous equipment
  - [ ] 6.4 Build context-aware recording instructions per equipment type
  - [ ] 6.5 Implement equipment-specific quality validation rules
  - [ ] 6.6 Create media requirement communication and user guidance
  - [ ] 6.7 Design equipment-specific media organization and labeling

- [ ] 7.0 Diagnostic Context Intelligence
  - [ ] 7.1 Implement equipment lifecycle considerations (age, maintenance history)
  - [ ] 7.2 Create environmental context detection (indoor, outdoor, industrial)
  - [ ] 7.3 Build usage intensity and pattern analysis
  - [ ] 7.4 Develop warranty and service consideration prompts
  - [ ] 7.5 Implement manufacturer-specific known issue detection
  - [ ] 7.6 Create equipment complexity assessment for pricing considerations
  - [ ] 7.7 Build diagnostic urgency and safety assessment

- [ ] 8.0 Equipment Database and Data Management
  - [ ] 8.1 Create comprehensive equipment database with manufacturer information
  - [ ] 8.2 Build equipment model database with specifications and common issues
  - [ ] 8.3 Implement equipment data synchronization and update mechanisms
  - [ ] 8.4 Create equipment image library for visual identification
  - [ ] 8.5 Build equipment specification lookup and integration
  - [ ] 8.6 Implement equipment data validation and quality control
  - [ ] 8.7 Create equipment database search and query optimization

- [ ] 9.0 AI Integration and Enhancement
  - [ ] 9.1 Develop equipment-specific AI prompt engineering and optimization
  - [ ] 9.2 Create contextual analysis enhancement based on equipment type
  - [ ] 9.3 Build equipment-specific diagnostic pattern recognition
  - [ ] 9.4 Implement specialized AI knowledge for different equipment domains
  - [ ] 9.5 Create equipment-specific repair recommendation systems
  - [ ] 9.6 Build integration with manufacturer documentation and manuals
  - [ ] 9.7 Develop equipment-specific confidence scoring and validation

- [ ] 10.0 Testing, Integration and Quality Assurance
  - [ ] 10.1 Create comprehensive testing suite for all equipment categories
  - [ ] 10.2 Implement user acceptance testing with diverse equipment types
  - [ ] 10.3 Build integration testing with existing media capture and AI systems
  - [ ] 10.4 Create performance testing for dynamic form generation
  - [ ] 10.5 Implement equipment-specific diagnostic accuracy validation
  - [ ] 10.6 Build question quality assessment and continuous improvement
  - [ ] 10.7 Create equipment coverage analysis and gap identification