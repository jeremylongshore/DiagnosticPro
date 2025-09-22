from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import diagnostics, reports, webhooks, checkout, analysis
import os

app = FastAPI(title="DiagnosticPro API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://api.diagnosticpro.io",
        "https://diagnosticpro.io",
        "https://www.diagnosticpro.io",
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000"   # Alternative dev port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "diagnosticpro-vertex-ai-backend",
        "version": "1.0.0",
        "ai_engine": "vertex_ai_gemini",
        "model": "gemini-1.5-pro",
        "storage": "gcs",
        "database": "firestore"
    }

# Legacy health check
@app.get("/healthz")
def healthz():
    return {"ok": True}

# Include API routes
app.include_router(diagnostics.router)
app.include_router(reports.router)
app.include_router(checkout.router)
app.include_router(analysis.router)

# Webhooks at root level (no /api prefix)
app.include_router(webhooks.router)