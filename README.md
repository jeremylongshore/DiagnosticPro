# DiagnosticPro AI - Professional Equipment Diagnostics Platform

⚠️ **URGENT MIGRATION**: Platform migrating from Lovable/Supabase to Google Cloud by Friday (2-day timeline)

AI-powered diagnostic analysis platform for vehicles, machinery, and equipment. Get professional-grade diagnostic reports with specific test values, root cause analysis, and repair recommendations.

## ⚡ Features

- **Multi-Equipment Support**: Vehicles, machinery, industrial equipment
- **AI Powered Analysis**: Vertex AI (replacing OpenAI GPT-4) with BigQuery integration
- **Specific Test Values**: PSI ranges, voltage specs, resistance readings  
- **PDF Report Generation**: Comprehensive diagnostic reports via email
- **Stripe Integration**: Secure payment processing ($29.99 per analysis)
- **Email Delivery**: Reports sent from reports@diagnosticpro.io

## 🛠️ Installation

```bash
# Clone the repository
git clone https://github.com/jeremylongshore/diagnosticpro-platform.git
cd diagnosticpro-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev
```

## ⚙️ Environment Variables (Migration Status)

### Legacy Configuration (Until Friday)
```bash
# Supabase (being shut down)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# OpenAI (being replaced)
OPENAI_API_KEY=your-openai-key
```

### Target Configuration (Friday Migration)
```bash
# Firebase/Google Cloud
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_API_KEY=your-api-key
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Vertex AI (replacing OpenAI)
VERTEX_AI_PROJECT_ID=your-project-id
VERTEX_AI_LOCATION=us-central1

# BigQuery (existing + new analytics)
BIGQUERY_PROJECT_ID=diagnostic-pro-start-up
BIGQUERY_DATASET=diagnosticpro_prod
```

### Unchanged Services
```bash
# Stripe (no changes)
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Email (Google Cloud email service)
GMAIL_APP_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
```

## 🏗️ Architecture (Migration Status)

### Current (Being Migrated FROM)
```
Lovable Hosting + Supabase + OpenAI
├── Frontend: Lovable hosting
├── Database: Supabase (3 tables)
├── AI: OpenAI GPT-4
└── Functions: Supabase Edge Functions
```

### Target (Migrating TO by Friday)
```
Google Cloud Stack
├── Frontend: Firebase Hosting
├── Database: Firestore (3 collections)
├── AI: Vertex AI + BigQuery integration
└── Functions: Google Cloud Functions
```

### Project Structure
```
fix-it-detective-ai/
├── src/                   # React/TypeScript frontend
├── ai-dev-feature/        # Migration documentation
│   ├── PRDs/             # Platform migration requirements
│   ├── ADRs/             # Architecture decisions
│   ├── tasks/            # Implementation tasks
│   └── specifications/   # Firestore schema mapping
└── supabase/             # Legacy (being shut down Friday)
```

## 🔄 Workflow (Post-Migration)

1. Customer submits equipment diagnostic form
2. Data saved to Firestore database (diagnosticSubmissions collection)
3. Stripe processes payment ($29.99) → orders collection
4. AI analyzes using Vertex AI + BigQuery diagnostic data
5. PDF report generated and saved to BigQuery for analytics
6. Report emailed to customer → emailLogs collection

### Migration Data Flow
```
Customer Form → Firestore Collections → Vertex AI Analysis → BigQuery Analytics
```

## 🧪 Testing

```bash
# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# All checks (pre-commit)
make safe-commit
```

## 🤖 AI Analysis Format

The AI provides 12-section comprehensive diagnostics:

1. Initial Assessment
2. Diagnostic Tests (with specific values)
3. Test Results Analysis
4. Component-Specific Checks  
5. Root Cause Analysis
6. Repair Recommendations
7. Priority & Safety Assessment
8. Cost Estimates
9. Preventive Maintenance
10. Technical Specifications
11. Parts & Tools Required
12. Professional vs DIY Assessment

## 🔒 Security (Migration Status)

### Current Security (Supabase)
- Row Level Security (RLS) enabled
- Service role authentication
- Customer PII protection

### Target Security (Firestore)
- Firestore security rules (replacing RLS)
- Firebase Auth service accounts
- Google Cloud IAM management
- Customer PII protection maintained
- Secure payment processing via Stripe (unchanged)

## 💻 Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and test
npm run dev

# Run all checks before commit
make safe-commit

# Commit changes
git commit -m "feat: your feature description"

# Push and create PR
git push origin feature/your-feature
```

## 📚 Documentation

- **CLAUDE.md**: AI assistant context and project guidelines
- **ai-dev-feature/PRDs/**: Product requirements documents (including migration PRD-00)
- **ai-dev-feature/ADRs/**: Architecture decision records (including migration ADR-000)
- **ai-dev-feature/tasks/**: Task tracking and planning (including migration timeline)
- **ai-dev-feature/specifications/**: Technical specifications (Firestore schema mapping)

## 🚀 Production Deployment (Migration Status)

### Current Deployment (Until Friday)
- **Hosting**: Lovable/Vercel (being shut down)
- **Database**: Supabase (being shut down)
- **Status**: Legacy system running until migration complete

### Target Deployment (Friday Migration)
- **Hosting**: Firebase Hosting
- **Database**: Firestore
- **Functions**: Google Cloud Functions  
- **AI**: Vertex AI integration
- **Analytics**: BigQuery

### Migration Timeline
- **Thursday**: Deploy infrastructure and test
- **Friday**: Production switchover and legacy shutdown

## 📋 Migration Documentation

Critical migration documents in `ai-dev-feature/`:
- **PRD-00**: Platform migration requirements
- **Tasks-00**: Hour-by-hour implementation breakdown
- **ADR-000**: Architecture decisions and rationale
- **Schema Mapping**: Firestore conversion specifications

## 🆘 Support

**Project Owner**: Jeremy Longshore  
**Email**: jeremylongshore@gmail.com  
**Repository**: https://github.com/jeremylongshore/fix-it-detective-ai

## 📄 License

[License Type] - See LICENSE file for details

---

**Migration Status**: Documentation updated for 2-day Google Cloud migration timeline (Thursday-Friday)