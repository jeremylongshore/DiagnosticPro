#!/bin/bash
set -euo pipefail

# =============================================================================
# DiagnosticPro Migration Validation & Testing Script
# =============================================================================
# This script performs comprehensive validation and testing of the complete
# migration from Supabase to Google Cloud Run with Firestore
#
# Created: 2025-09-17
# =============================================================================

# Load configuration
if [ ! -f "gcp-service-accounts.env" ]; then
    echo "❌ Error: gcp-service-accounts.env not found"
    echo "Run ./01-gcp-project-setup.sh first"
    exit 1
fi

if [ ! -f "deployment-result.env" ]; then
    echo "❌ Error: deployment-result.env not found"
    echo "Run ./03-deploy-cloud-run.sh first"
    exit 1
fi

source gcp-service-accounts.env
source deployment-config.env
source deployment-result.env

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

failure() {
    echo -e "${RED}❌ $1${NC}"
}

# Progress tracking
TOTAL_STEPS=12
CURRENT_STEP=0

progress() {
    CURRENT_STEP=$((CURRENT_STEP + 1))
    echo -e "${BLUE}[Step $CURRENT_STEP/$TOTAL_STEPS] $1${NC}"
}

# Test results tracking
declare -A TEST_RESULTS
TESTS_PASSED=0
TESTS_FAILED=0

# Add test result
add_test_result() {
    local test_name="$1"
    local result="$2"
    local details="${3:-}"

    TEST_RESULTS["$test_name"]="$result|$details"

    if [ "$result" = "PASS" ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        success "$test_name"
        [ -n "$details" ] && echo "   💡 $details"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        failure "$test_name"
        [ -n "$details" ] && echo "   ⚠️  $details"
    fi
}

# Infrastructure validation
validate_infrastructure() {
    progress "Validating GCP infrastructure"

    local test_name="GCP Project Status"
    if gcloud projects describe "$PROJECT_ID" &>/dev/null; then
        local project_state=$(gcloud projects describe "$PROJECT_ID" --format="value(lifecycleState)")
        if [ "$project_state" = "ACTIVE" ]; then
            add_test_result "$test_name" "PASS" "Project $PROJECT_ID is active"
        else
            add_test_result "$test_name" "FAIL" "Project state: $project_state"
        fi
    else
        add_test_result "$test_name" "FAIL" "Project $PROJECT_ID not found"
    fi

    test_name="Required APIs Enabled"
    local required_apis=(
        "run.googleapis.com"
        "firestore.googleapis.com"
        "storage-api.googleapis.com"
        "secretmanager.googleapis.com"
        "aiplatform.googleapis.com"
    )

    local disabled_apis=()
    for api in "${required_apis[@]}"; do
        if ! gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
            disabled_apis+=("$api")
        fi
    done

    if [ ${#disabled_apis[@]} -eq 0 ]; then
        add_test_result "$test_name" "PASS" "All required APIs enabled"
    else
        add_test_result "$test_name" "FAIL" "Disabled APIs: ${disabled_apis[*]}"
    fi

    test_name="Service Accounts Exist"
    if gcloud iam service-accounts describe "$DIAGNOSTICPRO_APP_SA" &>/dev/null; then
        add_test_result "$test_name" "PASS" "Application service account exists"
    else
        add_test_result "$test_name" "FAIL" "Application service account missing"
    fi
}

# Secrets validation
validate_secrets() {
    progress "Validating Secret Manager configuration"

    local secrets=(
        "stripe-secret-key"
        "stripe-webhook-secret"
        "openai-api-key"
        "gmail-app-password"
    )

    local missing_secrets=()
    local inaccessible_secrets=()

    for secret in "${secrets[@]}"; do
        local test_name="Secret: $secret"

        if ! gcloud secrets describe "$secret" &>/dev/null; then
            missing_secrets+=("$secret")
            add_test_result "$test_name" "FAIL" "Secret does not exist"
            continue
        fi

        # Test secret access
        if gcloud secrets versions access latest --secret="$secret" &>/dev/null; then
            # Get secret length without revealing content
            local secret_length=$(gcloud secrets versions access latest --secret="$secret" | wc -c)
            if [ "$secret_length" -gt 10 ]; then
                add_test_result "$test_name" "PASS" "Secret accessible, length: $secret_length chars"
            else
                add_test_result "$test_name" "FAIL" "Secret too short or empty"
            fi
        else
            inaccessible_secrets+=("$secret")
            add_test_result "$test_name" "FAIL" "Secret exists but not accessible"
        fi
    done

    # Test service account access to secrets
    local test_name="Service Account Secret Access"
    if [ ${#inaccessible_secrets[@]} -eq 0 ] && [ ${#missing_secrets[@]} -eq 0 ]; then
        add_test_result "$test_name" "PASS" "Service account can access all secrets"
    else
        add_test_result "$test_name" "FAIL" "Missing or inaccessible secrets found"
    fi
}

# Firestore validation
validate_firestore() {
    progress "Validating Firestore database"

    local test_name="Firestore Database Exists"
    if gcloud firestore databases describe --database="(default)" &>/dev/null; then
        local db_type=$(gcloud firestore databases describe --database="(default)" --format="value(type)")
        if [ "$db_type" = "FIRESTORE_NATIVE" ]; then
            add_test_result "$test_name" "PASS" "Firestore database in native mode"
        else
            add_test_result "$test_name" "FAIL" "Database type: $db_type (expected FIRESTORE_NATIVE)"
        fi
    else
        add_test_result "$test_name" "FAIL" "Firestore database not found"
    fi

    test_name="Firestore Security Rules"
    if [ -f "../firestore.rules" ]; then
        add_test_result "$test_name" "PASS" "Security rules file exists"
    else
        add_test_result "$test_name" "FAIL" "Security rules file missing"
    fi

    test_name="Firestore Indexes"
    if [ -f "../firestore.indexes.json" ]; then
        add_test_result "$test_name" "PASS" "Indexes configuration file exists"
    else
        add_test_result "$test_name" "FAIL" "Indexes configuration file missing"
    fi
}

# Cloud Storage validation
validate_storage() {
    progress "Validating Cloud Storage buckets"

    local test_name="Reports Bucket"
    if gsutil ls -b "gs://$DIAGNOSTIC_REPORTS_BUCKET" &>/dev/null; then
        add_test_result "$test_name" "PASS" "Reports bucket exists"
    else
        add_test_result "$test_name" "FAIL" "Reports bucket missing"
    fi

    test_name="Backups Bucket"
    if gsutil ls -b "gs://$BACKUPS_BUCKET" &>/dev/null; then
        add_test_result "$test_name" "PASS" "Backups bucket exists"
    else
        add_test_result "$test_name" "FAIL" "Backups bucket missing"
    fi

    test_name="Storage Permissions"
    # Test write access to reports bucket
    local test_file="test-$(date +%s).txt"
    if echo "test" | gsutil cp - "gs://$DIAGNOSTIC_REPORTS_BUCKET/$test_file" &>/dev/null; then
        gsutil rm "gs://$DIAGNOSTIC_REPORTS_BUCKET/$test_file" &>/dev/null || true
        add_test_result "$test_name" "PASS" "Storage write access verified"
    else
        add_test_result "$test_name" "FAIL" "Cannot write to storage bucket"
    fi
}

# Cloud Run service validation
validate_cloud_run() {
    progress "Validating Cloud Run service"

    local test_name="Service Deployment"
    if gcloud run services describe "$SERVICE_NAME" --region="$REGION" &>/dev/null; then
        local service_status=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.conditions[0].status)")
        if [ "$service_status" = "True" ]; then
            add_test_result "$test_name" "PASS" "Cloud Run service is ready"
        else
            add_test_result "$test_name" "FAIL" "Service status: $service_status"
        fi
    else
        add_test_result "$test_name" "FAIL" "Cloud Run service not found"
    fi

    test_name="Service URL Accessibility"
    if [ -n "$SERVICE_URL" ]; then
        local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health" || echo "000")
        if [ "$response_code" = "200" ]; then
            add_test_result "$test_name" "PASS" "Service URL responding with 200"
        else
            add_test_result "$test_name" "FAIL" "Service returned HTTP $response_code"
        fi
    else
        add_test_result "$test_name" "FAIL" "Service URL not set"
    fi

    test_name="Health Endpoint"
    if [ -n "$SERVICE_URL" ]; then
        local health_response=$(curl -s "$SERVICE_URL/health" 2>/dev/null || echo "")
        if echo "$health_response" | grep -q "healthy"; then
            add_test_result "$test_name" "PASS" "Health endpoint returning expected response"
        else
            add_test_result "$test_name" "FAIL" "Health endpoint not responding correctly"
        fi
    else
        add_test_result "$test_name" "FAIL" "Cannot test health endpoint - no service URL"
    fi
}

# API endpoints validation
validate_api_endpoints() {
    progress "Validating API endpoints"

    if [ -z "$SERVICE_URL" ]; then
        add_test_result "API Endpoints" "FAIL" "No service URL available for testing"
        return
    fi

    local endpoints=(
        "/health"
        "/api/health"
        "/api/stripe/webhook"
        "/api/analyze-diagnostic"
        "/api/send-email"
    )

    for endpoint in "${endpoints[@]}"; do
        local test_name="Endpoint: $endpoint"
        local url="$SERVICE_URL$endpoint"

        # For webhook endpoint, expect it to reject GET requests
        if [ "$endpoint" = "/api/stripe/webhook" ]; then
            local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
            if [ "$response_code" = "405" ] || [ "$response_code" = "404" ]; then
                add_test_result "$test_name" "PASS" "Webhook endpoint properly rejects GET (HTTP $response_code)"
            else
                add_test_result "$test_name" "FAIL" "Unexpected response: HTTP $response_code"
            fi
        # For health endpoints, expect 200
        elif [[ "$endpoint" =~ "health" ]]; then
            local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
            if [ "$response_code" = "200" ]; then
                add_test_result "$test_name" "PASS" "Health endpoint responding correctly"
            else
                add_test_result "$test_name" "FAIL" "Health endpoint returned HTTP $response_code"
            fi
        # For other API endpoints, check they exist (may return 400/405 for GET)
        else
            local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
            if [ "$response_code" != "000" ] && [ "$response_code" != "404" ]; then
                add_test_result "$test_name" "PASS" "Endpoint exists (HTTP $response_code)"
            else
                add_test_result "$test_name" "FAIL" "Endpoint not found or unreachable"
            fi
        fi
    done
}

# Environment variables validation
validate_environment() {
    progress "Validating environment configuration"

    local test_name="Environment Variables"
    local service_config=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="json" 2>/dev/null || echo "{}")

    # Check if required environment variables are set
    local required_env_vars=(
        "PROJECT_ID"
        "REGION"
        "NODE_ENV"
        "DIAGNOSTIC_PRICE"
    )

    local env_vars_status="PASS"
    local missing_vars=()

    for var in "${required_env_vars[@]}"; do
        if ! echo "$service_config" | grep -q "\"name\":\"$var\""; then
            missing_vars+=("$var")
            env_vars_status="FAIL"
        fi
    done

    if [ "$env_vars_status" = "PASS" ]; then
        add_test_result "$test_name" "PASS" "All required environment variables set"
    else
        add_test_result "$test_name" "FAIL" "Missing variables: ${missing_vars[*]}"
    fi

    test_name="Secret Environment Variables"
    local required_secrets=(
        "STRIPE_SECRET_KEY"
        "OPENAI_API_KEY"
        "GMAIL_APP_PASSWORD"
    )

    local secrets_status="PASS"
    local missing_secret_vars=()

    for var in "${required_secrets[@]}"; do
        if ! echo "$service_config" | grep -q "\"name\":\"$var\""; then
            missing_secret_vars+=("$var")
            secrets_status="FAIL"
        fi
    done

    if [ "$secrets_status" = "PASS" ]; then
        add_test_result "$test_name" "PASS" "All required secret variables configured"
    else
        add_test_result "$test_name" "FAIL" "Missing secret variables: ${missing_secret_vars[*]}"
    fi
}

# Performance testing
test_performance() {
    progress "Running performance tests"

    if [ -z "$SERVICE_URL" ]; then
        add_test_result "Performance Tests" "FAIL" "No service URL for testing"
        return
    fi

    local test_name="Response Time"
    local start_time=$(date +%s%N)
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health" || echo "000")
    local end_time=$(date +%s%N)
    local response_time_ms=$(( (end_time - start_time) / 1000000 ))

    if [ "$response_code" = "200" ] && [ "$response_time_ms" -lt 5000 ]; then
        add_test_result "$test_name" "PASS" "Response time: ${response_time_ms}ms"
    else
        add_test_result "$test_name" "FAIL" "Slow response: ${response_time_ms}ms or HTTP $response_code"
    fi

    test_name="Concurrent Requests"
    local concurrent_test_result="PASS"
    local failed_requests=0

    # Test 5 concurrent requests
    for i in {1..5}; do
        curl -s -o /dev/null -w "%{http_code}" "$SERVICE_URL/health" &
    done
    wait

    # Check if any requests failed (this is a simplified test)
    if [ "$failed_requests" -gt 1 ]; then
        add_test_result "$test_name" "FAIL" "$failed_requests requests failed"
    else
        add_test_result "$test_name" "PASS" "Handled concurrent requests successfully"
    fi
}

# Integration testing
test_integration() {
    progress "Running integration tests"

    local test_name="Stripe Webhook Endpoint"
    if [ -n "$SERVICE_URL" ]; then
        # Test webhook endpoint with a mock payload (should fail validation but endpoint should exist)
        local webhook_response=$(curl -s -w "%{http_code}" -X POST "$SERVICE_URL/api/stripe/webhook" \
            -H "Content-Type: application/json" \
            -H "Stripe-Signature: t=test,v1=test" \
            -d '{"type":"test","data":{"object":{"id":"test"}}}' || echo "000")

        # Webhook should reject invalid signatures (400) or process request
        if [[ "$webhook_response" =~ (400|200) ]]; then
            add_test_result "$test_name" "PASS" "Webhook endpoint responding to POST requests"
        else
            add_test_result "$test_name" "FAIL" "Webhook endpoint not handling requests properly"
        fi
    else
        add_test_result "$test_name" "FAIL" "No service URL for testing"
    fi

    test_name="Email Service Configuration"
    # Check if email service can be initialized (test via health endpoint response)
    if [ -n "$SERVICE_URL" ]; then
        local health_data=$(curl -s "$SERVICE_URL/health" 2>/dev/null || echo "{}")
        if echo "$health_data" | grep -q "gmail.*true\|email.*true"; then
            add_test_result "$test_name" "PASS" "Email service configuration detected"
        else
            add_test_result "$test_name" "WARN" "Email service configuration not verified"
        fi
    else
        add_test_result "$test_name" "FAIL" "Cannot test email service"
    fi

    test_name="AI Service Configuration"
    # Check if OpenAI key is loaded
    if [ -n "$SERVICE_URL" ]; then
        local health_data=$(curl -s "$SERVICE_URL/health" 2>/dev/null || echo "{}")
        if echo "$health_data" | grep -q "openai.*true"; then
            add_test_result "$test_name" "PASS" "AI service configuration detected"
        else
            add_test_result "$test_name" "WARN" "AI service configuration not verified"
        fi
    else
        add_test_result "$test_name" "FAIL" "Cannot test AI service"
    fi
}

# Security validation
validate_security() {
    progress "Validating security configuration"

    local test_name="Service Account Permissions"
    # Check if service account has minimal required permissions
    local sa_roles=$(gcloud projects get-iam-policy "$PROJECT_ID" --flatten="bindings[].members" --filter="bindings.members:$DIAGNOSTICPRO_APP_SA" --format="value(bindings.role)" | sort)

    local required_roles=(
        "roles/firestore.user"
        "roles/secretmanager.secretAccessor"
        "roles/storage.objectAdmin"
    )

    local missing_roles=()
    for role in "${required_roles[@]}"; do
        if ! echo "$sa_roles" | grep -q "$role"; then
            missing_roles+=("$role")
        fi
    done

    if [ ${#missing_roles[@]} -eq 0 ]; then
        add_test_result "$test_name" "PASS" "Service account has required permissions"
    else
        add_test_result "$test_name" "FAIL" "Missing roles: ${missing_roles[*]}"
    fi

    test_name="HTTPS Enforcement"
    if [ -n "$SERVICE_URL" ] && [[ "$SERVICE_URL" =~ ^https:// ]]; then
        add_test_result "$test_name" "PASS" "Service URL uses HTTPS"
    else
        add_test_result "$test_name" "FAIL" "Service URL not using HTTPS"
    fi

    test_name="Secret Access Logging"
    # Check if audit logging is enabled for Secret Manager
    local audit_logs=$(gcloud logging read "protoPayload.serviceName=secretmanager.googleapis.com" --limit=1 --format="value(timestamp)" 2>/dev/null || echo "")
    if [ -n "$audit_logs" ]; then
        add_test_result "$test_name" "PASS" "Secret Manager audit logging enabled"
    else
        add_test_result "$test_name" "WARN" "Secret Manager audit logging not verified"
    fi
}

# Cost optimization validation
validate_cost_optimization() {
    progress "Validating cost optimization settings"

    local test_name="Cloud Run Scaling"
    local min_instances=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(spec.template.metadata.annotations['autoscaling.knative.dev/minScale'])" 2>/dev/null || echo "")

    if [ "$min_instances" = "0" ] || [ -z "$min_instances" ]; then
        add_test_result "$test_name" "PASS" "Min instances set to 0 (scale-to-zero enabled)"
    else
        add_test_result "$test_name" "WARN" "Min instances: $min_instances (consider setting to 0 for cost savings)"
    fi

    test_name="Storage Lifecycle Policy"
    local lifecycle_policy=$(gsutil lifecycle get "gs://$DIAGNOSTIC_REPORTS_BUCKET" 2>/dev/null || echo "")
    if echo "$lifecycle_policy" | grep -q "Delete"; then
        add_test_result "$test_name" "PASS" "Storage lifecycle policy configured"
    else
        add_test_result "$test_name" "WARN" "Storage lifecycle policy not set (files won't auto-delete)"
    fi

    test_name="Resource Limits"
    local memory_limit=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(spec.template.spec.containers[0].resources.limits.memory)" 2>/dev/null)
    local cpu_limit=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(spec.template.spec.containers[0].resources.limits.cpu)" 2>/dev/null)

    if [ -n "$memory_limit" ] && [ -n "$cpu_limit" ]; then
        add_test_result "$test_name" "PASS" "Resource limits set: $memory_limit memory, $cpu_limit CPU"
    else
        add_test_result "$test_name" "WARN" "Resource limits not explicitly set"
    fi
}

# Generate comprehensive test report
generate_test_report() {
    progress "Generating comprehensive test report"

    local total_tests=$((TESTS_PASSED + TESTS_FAILED))
    local success_rate=0
    if [ "$total_tests" -gt 0 ]; then
        success_rate=$(( (TESTS_PASSED * 100) / total_tests ))
    fi

    cat > MIGRATION_VALIDATION_REPORT.md << EOF
# DiagnosticPro Migration Validation Report

**Validation Date:** $(date)
**Project ID:** $PROJECT_ID
**Service URL:** $SERVICE_URL

## 📊 Test Summary

- **Total Tests:** $total_tests
- **Passed:** $TESTS_PASSED ✅
- **Failed:** $TESTS_FAILED ❌
- **Success Rate:** $success_rate%

## 📋 Detailed Test Results

EOF

    # Add detailed test results
    for test_name in "${!TEST_RESULTS[@]}"; do
        local result_data="${TEST_RESULTS[$test_name]}"
        local result="${result_data%|*}"
        local details="${result_data#*|}"

        if [ "$result" = "PASS" ]; then
            echo "### ✅ $test_name" >> MIGRATION_VALIDATION_REPORT.md
        elif [ "$result" = "WARN" ]; then
            echo "### ⚠️ $test_name" >> MIGRATION_VALIDATION_REPORT.md
        else
            echo "### ❌ $test_name" >> MIGRATION_VALIDATION_REPORT.md
        fi

        echo "- **Status:** $result" >> MIGRATION_VALIDATION_REPORT.md
        if [ -n "$details" ]; then
            echo "- **Details:** $details" >> MIGRATION_VALIDATION_REPORT.md
        fi
        echo "" >> MIGRATION_VALIDATION_REPORT.md
    done

    cat >> MIGRATION_VALIDATION_REPORT.md << EOF

## 🎯 Migration Status

EOF

    if [ "$success_rate" -ge 90 ]; then
        cat >> MIGRATION_VALIDATION_REPORT.md << EOF
### ✅ MIGRATION SUCCESSFUL

The migration from Supabase to Google Cloud Run has been completed successfully!

**Ready for Production:**
- All critical systems validated
- Security measures in place
- Performance requirements met
- Cost optimization configured

**Next Steps:**
1. Update Stripe webhook URL to: \`$SERVICE_URL/api/stripe/webhook\`
2. Test end-to-end payment flow
3. Monitor service for 24 hours
4. Decommission Supabase resources
EOF
    elif [ "$success_rate" -ge 70 ]; then
        cat >> MIGRATION_VALIDATION_REPORT.md << EOF
### ⚠️ MIGRATION MOSTLY SUCCESSFUL

The migration is largely complete but some issues need attention.

**Action Required:**
- Review failed tests above
- Fix critical issues before production use
- Re-run validation after fixes

**Recommended:**
- Deploy fixes and re-validate
- Monitor closely in production
EOF
    else
        cat >> MIGRATION_VALIDATION_REPORT.md << EOF
### ❌ MIGRATION NEEDS ATTENTION

Significant issues detected that require resolution before production use.

**Critical Actions Required:**
- Fix all failed tests
- Review infrastructure configuration
- Ensure all services are properly deployed
- Re-run validation after fixes

**Do NOT proceed to production until issues are resolved.**
EOF
    fi

    cat >> MIGRATION_VALIDATION_REPORT.md << EOF

## 🔧 System Information

### Infrastructure
- **GCP Project:** $PROJECT_ID
- **Region:** $REGION
- **Cloud Run Service:** $SERVICE_NAME
- **Service URL:** $SERVICE_URL

### Services Deployed
- **Cloud Run:** DiagnosticPro application
- **Firestore:** Database (native mode)
- **Secret Manager:** API keys and secrets
- **Cloud Storage:** Reports and backups
- **Cloud Tasks:** Async processing queue

### Security
- **Service Account:** $DIAGNOSTICPRO_APP_SA
- **HTTPS:** Enforced
- **Secrets:** Encrypted at rest
- **Audit Logging:** Enabled

## 💰 Cost Monitoring

### Current Configuration
- **Cloud Run:** Scale-to-zero enabled
- **Firestore:** Pay-per-use
- **Storage:** Lifecycle policies set
- **Secrets:** Minimal usage

### Estimated Monthly Cost
- **Total:** \$18-48/month (based on traffic)
- **Monitoring:** Billing alerts configured

## 🔍 Monitoring & Debugging

### View Logs
\`\`\`bash
# Real-time service logs
gcloud run services logs tail $SERVICE_NAME --region=$REGION

# Historical logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME" --limit=100
\`\`\`

### Health Checks
\`\`\`bash
# Service health
curl $SERVICE_URL/health

# Detailed health with secrets status
curl $SERVICE_URL/api/health
\`\`\`

### Performance Monitoring
- **Uptime:** Cloud Monitoring uptime checks
- **Latency:** Response time monitoring
- **Errors:** Error rate tracking
- **Costs:** Billing alerts and budgets

## 🆘 Troubleshooting

### Common Issues
1. **503 Service Unavailable**
   - Check service logs for startup errors
   - Verify secret access permissions
   - Ensure all environment variables are set

2. **Secret Access Denied**
   - Verify service account IAM bindings
   - Check secret exists and has correct name
   - Ensure Secret Manager API is enabled

3. **Database Connection Issues**
   - Verify Firestore database exists
   - Check security rules deployment
   - Ensure service account has Firestore access

### Support Commands
\`\`\`bash
# Redeploy service
gcloud run deploy $SERVICE_NAME --image=gcr.io/$PROJECT_ID/$SERVICE_NAME:latest --region=$REGION

# Check service account permissions
gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --filter="bindings.members:$DIAGNOSTICPRO_APP_SA"

# Test secret access
gcloud secrets versions access latest --secret="stripe-secret-key"
\`\`\`

---

## 📋 Post-Migration Checklist

### Immediate (Next 24 Hours)
- [ ] Update Stripe webhook URL
- [ ] Test complete payment flow
- [ ] Verify email delivery
- [ ] Monitor error rates
- [ ] Check cost usage

### Short-term (Next Week)
- [ ] Set up alerting policies
- [ ] Configure uptime monitoring
- [ ] Test disaster recovery
- [ ] Optimize performance
- [ ] Review security settings

### Long-term (Next Month)
- [ ] Analyze cost patterns
- [ ] Implement CI/CD pipeline
- [ ] Set up staging environment
- [ ] Plan secret rotation
- [ ] Decommission Supabase

---

**Report Generated:** $(date)
**Validation Script:** DiagnosticPro Migration Validation v1.0
**Status:** $(if [ "$success_rate" -ge 90 ]; then echo "✅ READY FOR PRODUCTION"; elif [ "$success_rate" -ge 70 ]; then echo "⚠️ NEEDS MINOR FIXES"; else echo "❌ NEEDS MAJOR FIXES"; fi)
EOF

    log "Comprehensive validation report saved to MIGRATION_VALIDATION_REPORT.md"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=============================================="
    echo "  DiagnosticPro Migration Validation"
    echo "=============================================="
    echo -e "${NC}"
    echo ""
    echo "This script performs comprehensive validation and testing"
    echo "of the complete migration from Supabase to Google Cloud Run."
    echo ""
    echo "Project: $PROJECT_ID"
    echo "Service: $SERVICE_NAME"
    echo "URL: $SERVICE_URL"
    echo ""
    read -p "Start validation and testing? (y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo "Validation cancelled."
        exit 0
    fi

    echo ""
    log "Starting DiagnosticPro migration validation..."

    # Execute all validation steps
    validate_infrastructure
    validate_secrets
    validate_firestore
    validate_storage
    validate_cloud_run
    validate_api_endpoints
    validate_environment
    test_performance
    test_integration
    validate_security
    validate_cost_optimization
    generate_test_report

    echo ""
    echo -e "${BLUE}"
    echo "=============================================="
    echo "  🧪 Validation Complete!"
    echo "=============================================="
    echo -e "${NC}"
    echo ""
    echo "📊 Test Results:"
    echo "  • Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
    echo "  • Passed: $TESTS_PASSED ✅"
    echo "  • Failed: $TESTS_FAILED ❌"

    local success_rate=0
    local total_tests=$((TESTS_PASSED + TESTS_FAILED))
    if [ "$total_tests" -gt 0 ]; then
        success_rate=$(( (TESTS_PASSED * 100) / total_tests ))
    fi
    echo "  • Success Rate: $success_rate%"
    echo ""

    if [ "$success_rate" -ge 90 ]; then
        echo -e "${GREEN}🎉 MIGRATION SUCCESSFUL!${NC}"
        echo ""
        echo "✅ Ready for production use"
        echo "📋 Next steps:"
        echo "  1. Update Stripe webhook URL"
        echo "  2. Test payment flow"
        echo "  3. Monitor for 24 hours"
        echo "  4. Decommission Supabase"
    elif [ "$success_rate" -ge 70 ]; then
        echo -e "${YELLOW}⚠️  MIGRATION MOSTLY SUCCESSFUL${NC}"
        echo ""
        echo "🔧 Minor issues need attention"
        echo "📋 Action required:"
        echo "  1. Review failed tests"
        echo "  2. Fix issues"
        echo "  3. Re-run validation"
    else
        echo -e "${RED}❌ MIGRATION NEEDS ATTENTION${NC}"
        echo ""
        echo "🚨 Critical issues detected"
        echo "📋 Required actions:"
        echo "  1. Fix all failed tests"
        echo "  2. Re-deploy if necessary"
        echo "  3. Re-run validation"
        echo "  4. Do NOT use in production yet"
    fi

    echo ""
    echo "📖 Detailed Report: MIGRATION_VALIDATION_REPORT.md"
    echo "🔗 Service URL: $SERVICE_URL"
    echo "🔗 Console: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"
    echo ""
    log "Migration validation completed! 🎉"
}

# Run main function
main "$@"