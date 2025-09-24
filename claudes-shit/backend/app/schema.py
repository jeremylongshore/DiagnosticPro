from pydantic import BaseModel
from typing import Optional, Literal

class DiagnosticOut(BaseModel):
    id: int
    user_id: str
    status: Literal["pending","processing","ready","failed"]
    gcs_path: Optional[str] = None
    class Config: from_attributes = True