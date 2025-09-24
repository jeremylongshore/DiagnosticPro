import os
from google.cloud import firestore

# Initialize Firestore client
def get_db():
    """Get Firestore database client"""
    project_id = os.environ.get("GCP_PROJECT", "diagnostic-pro-prod")
    return firestore.Client(project=project_id)

# For compatibility with existing route signatures that expect a dependency
def get_db_dependency():
    """Dependency function for FastAPI routes"""
    return get_db()