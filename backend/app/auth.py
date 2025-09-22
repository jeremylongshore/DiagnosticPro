import os
from fastapi import Depends, HTTPException, Header
from typing import Optional
import firebase_admin
from firebase_admin import auth as fb_auth, credentials

# One-time init
if not firebase_admin._apps:
    cred = credentials.ApplicationDefault()  # use Cloud Run default SA
    project_id = os.environ.get("FIREBASE_PROJECT_ID", "diagnostic-pro-prod")
    firebase_admin.initialize_app(cred, {"projectId": project_id})

def get_user(authorization: Optional[str] = Header(None), x_firebase_auth: Optional[str] = Header(None)) -> str:
    # Check for Firebase ID token in custom header (from Functions proxy)
    firebase_token = x_firebase_auth or authorization

    if not firebase_token:
        raise HTTPException(401, "Missing authentication token")

    # Extract token if it has Bearer prefix
    if firebase_token.startswith("Bearer "):
        token = firebase_token.split(" ", 1)[1]
    else:
        token = firebase_token

    try:
        decoded = fb_auth.verify_id_token(token, check_revoked=True)
        return decoded["uid"]  # user_id
    except Exception as e:
        raise HTTPException(401, f"Invalid token: {str(e)}")