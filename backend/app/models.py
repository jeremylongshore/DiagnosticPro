from enum import Enum

class Status(str, Enum):
    pending = "pending"
    processing = "processing"
    ready = "ready"
    failed = "failed"

# Firestore documents are stored as dictionaries - no SQLAlchemy models needed