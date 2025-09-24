import os
from datetime import timedelta
from fastapi import APIRouter, HTTPException, Response
from google.cloud import storage
from ..deps import get_db

router = APIRouter(prefix="/api/reports", tags=["reports"])

def _signed_url(bucket: str, path: str, minutes: int = 15) -> str:
    client = storage.Client()
    blob = client.bucket(bucket).blob(path)
    return blob.generate_signed_url(
        version="v4",
        method="GET",
        expiration=timedelta(minutes=minutes),
        response_type="application/pdf",
        response_disposition=f'attachment; filename="{path.split("/")[-1]}"'
    )

def _get_owned_ready(diagnostic_id: int):
    db = get_db()
    diagnostic_ref = db.collection('diagnostics').document(str(diagnostic_id))
    diagnostic_doc = diagnostic_ref.get()

    if not diagnostic_doc.exists:
        raise HTTPException(404, "Not found")

    data = diagnostic_doc.to_dict()
    if data.get("status") != "ready" or not data.get("gcs_path"):
        raise HTTPException(409, "not ready")

    return data

@router.get("/{diagnostic_id}/url")
def get_report_url(diagnostic_id: int):
    d = _get_owned_ready(diagnostic_id)
    url = _signed_url(os.environ["GCS_BUCKET_REPORTS"], d["gcs_path"])
    return {"url": url}

@router.get("/{diagnostic_id}/download")
def download_report(diagnostic_id: int):
    d = _get_owned_ready(diagnostic_id)
    url = _signed_url(os.environ["GCS_BUCKET_REPORTS"], d["gcs_path"])
    return Response(status_code=307, headers={"Location": url})

@router.get("/{diagnostic_id}/renew-url")
def renew_url(diagnostic_id: int):
    d = _get_owned_ready(diagnostic_id)
    url = _signed_url(os.environ["GCS_BUCKET_REPORTS"], d["gcs_path"])
    return {"url": url}