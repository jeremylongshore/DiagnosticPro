# Incident: Cloud Build outage blocking Firebase Functions
Date: 2025-09-22
Project: diagnostic-pro-prod
Regions affected: us-central1, us-west1, us-east1
Actions:
- Deployed Functions v2 to us-east1 (attempted)
- If blocked, deployed Cloud Run fallback `analyze-run` (attempted)
- Frontend points to ANALYZE_URL (Functions or Cloud Run)
Revert Plan:
- When Cloud Build recovers, redeploy Functions
- Set frontend VITE_ANALYZE_URL back to Functions URL
- Remove cloudrun-analyze service and image
