#!/bin/bash

# Setup Cloud SQL PostgreSQL database for DiagnosticPro
# Creates database instance and runs Alembic migrations

set -e

PROJECT_ID=${PROJECT_ID:-"diagnostic-pro-prod"}
REGION=${REGION:-"us-central1"}
DB_INSTANCE="diagnostic-db"
DB_NAME="diagnostic_db"
DB_USER="diagnostic_user"

echo "🗄️ Setting up Cloud SQL PostgreSQL database"
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Instance: $DB_INSTANCE"

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: gcloud is not authenticated"
    echo "Run: gcloud auth login"
    exit 1
fi

# Set the project
gcloud config set project $PROJECT_ID

# Enable Cloud SQL API
echo "📡 Enabling Cloud SQL API..."
gcloud services enable sqladmin.googleapis.com

# Check if instance already exists
if gcloud sql instances describe $DB_INSTANCE --project=$PROJECT_ID &>/dev/null; then
    echo "✅ Database instance $DB_INSTANCE already exists"
else
    echo "🔨 Creating Cloud SQL PostgreSQL instance..."
    gcloud sql instances create $DB_INSTANCE \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --storage-type=SSD \
        --storage-size=10GB \
        --storage-auto-increase \
        --backup-start-time=03:00 \
        --maintenance-release-channel=production \
        --maintenance-window-day=SUN \
        --maintenance-window-hour=04 \
        --deletion-protection \
        --project=$PROJECT_ID

    echo "⏳ Waiting for instance to be ready..."
    gcloud sql instances patch $DB_INSTANCE \
        --database-flags=shared_preload_libraries=pg_stat_statements \
        --project=$PROJECT_ID
fi

# Generate random password
DB_PASSWORD=$(openssl rand -base64 24)

# Create database user
echo "👤 Creating database user..."
if ! gcloud sql users describe $DB_USER --instance=$DB_INSTANCE --project=$PROJECT_ID &>/dev/null; then
    gcloud sql users create $DB_USER \
        --instance=$DB_INSTANCE \
        --password=$DB_PASSWORD \
        --project=$PROJECT_ID
else
    echo "✅ Database user $DB_USER already exists"
    # Update password
    gcloud sql users set-password $DB_USER \
        --instance=$DB_INSTANCE \
        --password=$DB_PASSWORD \
        --project=$PROJECT_ID
fi

# Create database
echo "🗃️ Creating database..."
if ! gcloud sql databases describe $DB_NAME --instance=$DB_INSTANCE --project=$PROJECT_ID &>/dev/null; then
    gcloud sql databases create $DB_NAME \
        --instance=$DB_INSTANCE \
        --project=$PROJECT_ID
else
    echo "✅ Database $DB_NAME already exists"
fi

# Update the database URL secret
echo "🔐 Updating database-url secret..."
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${PROJECT_ID}:${REGION}:${DB_INSTANCE}"
echo "$DB_URL" | gcloud secrets versions add database-url --data-file=- --project=$PROJECT_ID

# Get connection name for Cloud Run
CONNECTION_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE}"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "📝 Database details:"
echo "Instance: $DB_INSTANCE"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Connection name: $CONNECTION_NAME"
echo ""
echo "🔗 To connect from Cloud Run, add this to your service configuration:"
echo "--add-cloudsql-instances=$CONNECTION_NAME"
echo ""
echo "📝 Next steps:"
echo "1. Run Alembic migrations:"
echo "   cd backend && alembic upgrade head"
echo ""
echo "2. Test connection locally:"
echo "   export DATABASE_URL=\"$DB_URL\""
echo "   python -c \"from app.database import engine; print('Connected to:', engine.url)\""