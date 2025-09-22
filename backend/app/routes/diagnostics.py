from fastapi import APIRouter, HTTPException
from ..deps import get_db

router = APIRouter(prefix="/api/diagnostics", tags=["diagnostics"])

@router.get("/{diagnostic_id}")
def get_status(diagnostic_id: int):
    # Get Firestore client
    db = get_db()

    # Get diagnostic document from Firestore
    diagnostic_ref = db.collection('diagnostics').document(str(diagnostic_id))
    diagnostic_doc = diagnostic_ref.get()

    if not diagnostic_doc.exists:
        raise HTTPException(404, "Not found")

    data = diagnostic_doc.to_dict()
    return {
        "id": data.get("id"),
        "status": data.get("status", "pending"),
        "user_id": data.get("user_id"),
        "gcs_path": data.get("gcs_path"),
        "created_at": data.get("created_at")
    }