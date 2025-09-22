#!/bin/bash

# Run Alembic database migrations for DiagnosticPro
# This script connects to Cloud SQL and creates all required tables

set -e

PROJECT_ID=${PROJECT_ID:-"diagnostic-pro-prod"}
REGION=${REGION:-"us-central1"}
DB_INSTANCE="diagnostic-db"

echo "🗄️ Running database migrations"
echo "Project: $PROJECT_ID"
echo "Instance: $DB_INSTANCE"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: gcloud is not authenticated"
    echo "Run: gcloud auth login"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Get database URL from Secret Manager
echo "🔐 Getting database URL from Secret Manager..."
DATABASE_URL=$(gcloud secrets versions access latest --secret="database-url" --project=$PROJECT_ID)

# Export for Alembic
export DATABASE_URL

# Check if we're in the backend directory
if [ ! -f "alembic.ini" ]; then
    echo "❌ Error: alembic.ini not found. Please run from the backend directory."
    exit 1
fi

# Install dependencies if not already installed
if [ ! -d "venv" ]; then
    echo "🐍 Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Check if Cloud SQL proxy is needed for local development
if [[ "$DATABASE_URL" == *"/cloudsql/"* ]]; then
    echo "☁️ Using Cloud SQL proxy connection..."

    # Download and setup Cloud SQL proxy if not exists
    if [ ! -f "./cloud_sql_proxy" ]; then
        echo "📥 Downloading Cloud SQL proxy..."
        curl -o cloud_sql_proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.7.0/cloud-sql-proxy.linux.amd64
        chmod +x cloud_sql_proxy
    fi

    # Start Cloud SQL proxy in background
    CONNECTION_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE}"
    echo "🔗 Starting Cloud SQL proxy for $CONNECTION_NAME..."
    ./cloud_sql_proxy --unix-socket /tmp $CONNECTION_NAME &
    PROXY_PID=$!

    # Wait a moment for proxy to start
    sleep 3

    # Update DATABASE_URL for proxy connection
    export DATABASE_URL="postgresql://diagnostic_user:$(gcloud secrets versions access latest --secret="database-url" --project=$PROJECT_ID | cut -d':' -f3 | cut -d'@' -f1)@/diagnostic_db?host=/tmp/${CONNECTION_NAME}"
fi

# Run Alembic migrations
echo "🏗️ Running Alembic migrations..."

# Check if alembic directory exists
if [ ! -d "alembic" ]; then
    echo "📁 Initializing Alembic..."
    alembic init alembic

    # Update alembic.ini with our database URL
    sed -i "s|^sqlalchemy.url = .*|sqlalchemy.url = ${DATABASE_URL}|" alembic.ini
fi

# Check current revision
echo "📋 Current database revision:"
alembic current || echo "No revision found (new database)"

# Show pending migrations
echo "📋 Pending migrations:"
alembic show || echo "No migrations to show"

# Run migrations
echo "⬆️ Upgrading to latest revision..."
alembic upgrade head

# Show final state
echo "✅ Final database revision:"
alembic current

# Kill Cloud SQL proxy if we started it
if [ ! -z "$PROXY_PID" ]; then
    echo "🛑 Stopping Cloud SQL proxy..."
    kill $PROXY_PID 2>/dev/null || true
fi

echo ""
echo "✅ Database migrations complete!"
echo ""
echo "📝 Verification steps:"
echo "1. Check tables were created:"
echo "   gcloud sql connect $DB_INSTANCE --user=diagnostic_user"
echo "   \\dt"
echo ""
echo "2. Test the API endpoints:"
echo "   curl \$SERVICE_URL/health"
echo "   curl \$SERVICE_URL/api/diagnostics"
echo ""
echo "3. View migration history:"
echo "   alembic history"