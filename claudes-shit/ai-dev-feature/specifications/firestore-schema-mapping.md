# Firestore Schema Design for Fresh Deployment

**Date**: 2025-09-10  
**Purpose**: Design fresh Firestore collections for new Google Cloud deployment (no data migration needed)

**IMPORTANT**: No migration from Supabase - this is a fresh database schema for new customer data only

## Fresh Firestore Collection Schema Design

### 1. diagnostic_submissions → diagnosticSubmissions Collection

```javascript
// Firestore Collection: diagnosticSubmissions
{
  id: string,                    // Document ID (auto-generated)
  analysisStatus: string | null,
  createdAt: timestamp,
  email: string,
  equipmentType: string | null,
  errorCodes: string | null,
  frequency: string | null,
  fullName: string,
  locationEnvironment: string | null,
  make: string | null,
  mileageHours: string | null,
  model: string | null,
  modifications: string | null,
  orderId: string | null,       // Reference to orders collection
  paidAt: timestamp | null,
  paymentId: string | null,
  paymentStatus: string | null,
  phone: string | null,
  previousRepairs: string | null,
  problemDescription: string | null,
  serialNumber: string | null,
  shopQuoteAmount: number | null,
  shopRecommendation: string | null,
  symptoms: string[] | null,
  troubleshootingSteps: string | null,
  updatedAt: timestamp,
  urgencyLevel: string | null,
  usagePattern: string | null,
  userId: string | null,
  whenStarted: string | null,
  year: string | null
}
```

### 2. orders → orders Collection

```javascript
// Firestore Collection: orders
{
  id: string,                    // Document ID (auto-generated)
  amount: number,
  analysis: string | null,
  analysisCompletedAt: timestamp | null,
  createdAt: timestamp,
  currency: string,
  customerEmail: string,
  emailStatus: string | null,
  errorMessage: string | null,
  paidAt: timestamp | null,
  processingStatus: string | null,
  redirectReady: boolean | null,
  redirectUrl: string | null,
  retryCount: number | null,
  status: string,
  stripeSessionId: string | null,
  submissionId: string | null,  // Reference to diagnosticSubmissions collection
  updatedAt: timestamp,
  userId: string | null
}
```

### 3. email_logs → emailLogs Collection

```javascript
// Firestore Collection: emailLogs
{
  id: string,                    // Document ID (auto-generated)
  createdAt: timestamp,
  error: string | null,
  messageId: string | null,
  status: string,
  subject: string,
  submissionId: string | null,  // Reference to diagnosticSubmissions collection
  toEmail: string
}
```

## Firestore Security Rules

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow anonymous submissions for diagnosticSubmissions
    match /diagnosticSubmissions/{submissionId} {
      allow create: if true; // Anonymous submissions allowed
      allow read, update: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.token.email_verified == true);
    }
    
    // Orders - authenticated users only
    match /orders/{orderId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
    
    // Email logs - system access only (via service account)
    match /emailLogs/{logId} {
      allow read, write: if request.auth.token.admin == true;
    }
  }
}
```

## Data Type Conversions

### Supabase → Firestore Type Mapping
- `string` → `string`
- `number` → `number`
- `boolean` → `boolean`
- `string | null` → `string | null`
- `string[]` → `array`
- `timestamp` → `timestamp` (Firestore native)
- PostgreSQL UUID → Firestore document ID (auto-generated)

### Field Name Conversions (snake_case → camelCase)
- `analysis_status` → `analysisStatus`
- `created_at` → `createdAt`
- `equipment_type` → `equipmentType`
- `error_codes` → `errorCodes`
- `full_name` → `fullName`
- `location_environment` → `locationEnvironment`
- `mileage_hours` → `mileageHours`
- `order_id` → `orderId`
- `paid_at` → `paidAt`
- `payment_id` → `paymentId`
- `payment_status` → `paymentStatus`
- `previous_repairs` → `previousRepairs`
- `problem_description` → `problemDescription`
- `serial_number` → `serialNumber`
- `shop_quote_amount` → `shopQuoteAmount`
- `shop_recommendation` → `shopRecommendation`
- `troubleshooting_steps` → `troubleshootingSteps`
- `updated_at` → `updatedAt`
- `urgency_level` → `urgencyLevel`
- `usage_pattern` → `usagePattern`
- `user_id` → `userId`
- `when_started` → `whenStarted`

## Collection Relationships

```javascript
// Reference structure for related documents
diagnosticSubmissions/{id}
├── orderId: reference to orders/{orderId}
└── userId: string (for authenticated users)

orders/{id}
├── submissionId: reference to diagnosticSubmissions/{submissionId}
└── userId: string

emailLogs/{id}
└── submissionId: reference to diagnosticSubmissions/{submissionId}
```

## Implementation Notes

### 1. Document References
- Use Firestore document references for relationships
- `orderId` in diagnosticSubmissions → reference to orders collection
- `submissionId` in orders → reference to diagnosticSubmissions collection

### 2. Anonymous Submissions
- Support anonymous users (userId can be null)
- Use email as secondary identifier for anonymous submissions

### 3. Timestamps
- Convert PostgreSQL timestamps to Firestore timestamps
- Use server timestamps for createdAt/updatedAt fields

### 4. Arrays
- `symptoms` field converts from PostgreSQL array to Firestore array
- Maintain same string array structure

### 5. Indexes
```javascript
// Firestore indexes needed
diagnosticSubmissions:
- email (for lookups)
- createdAt (for ordering)
- paymentStatus (for filtering)
- orderId (for relationships)

orders:
- customerEmail (for lookups)
- status (for filtering)
- createdAt (for ordering)
- stripeSessionId (for webhook processing)

emailLogs:
- toEmail (for tracking)
- status (for filtering)
- createdAt (for ordering)
```

## Fresh Deployment Strategy

### Phase 1: Fresh Collection Creation
1. Create new Firestore collections with proper structure
2. Set up security rules
3. Configure indexes

### Phase 2: New Code Development
1. Implement Firestore SDK for new database operations
2. Use camelCase field names from start
3. Build new query syntax and operations

### Phase 3: Testing
1. Test anonymous submissions with fresh data
2. Test authenticated user operations with new accounts
3. Verify relationships and references work correctly

---

**Next Steps**: 
1. Create Firestore project and enable APIs
2. Set up collections with this schema
3. Update application code to use Firestore SDK
4. Test complete workflow with new database

**Date**: 2025-09-10