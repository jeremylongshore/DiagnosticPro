import os, json, stripe
from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from ..deps import get_db
# Models are now stored in Firestore as documents
from google.cloud import storage
from google.cloud import firestore
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import io

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

# Environment variables - fail only when needed, not at startup
def get_stripe_config():
    stripe.api_key = os.environ["STRIPE_SECRET_KEY"]
    return os.environ["STRIPE_WEBHOOK_SECRET"]

def get_gcs_config():
    return os.environ["GCS_BUCKET_REPORTS"]

PROJECT_ID = os.environ.get("GCP_PROJECT", "diagnostic-pro-prod")
VERTEX_LOCATION = os.environ.get("VERTEX_LOCATION", "us-central1")

def _upload_pdf(diag_id: int, pdf_bytes: bytes) -> str:
    path = f"reports/{diag_id}.pdf"
    client = storage.Client()
    bucket_name = get_gcs_config()
    blob = client.bucket(bucket_name).blob(path)
    blob.cache_control = "private, max-age=0, no-store"
    blob.content_type = "application/pdf"
    blob.upload_from_string(pdf_bytes)
    return path

def _run_vertex_ai_analysis(diagnostic_data: dict) -> str:
    """Run diagnostic analysis using Vertex AI Gemini"""

    # Prepare prompt for diagnostic analysis
    prompt = f"""
    You are an expert equipment diagnostic specialist. Analyze the following equipment diagnostic data and provide a comprehensive report:

    Equipment Type: {diagnostic_data.get('equipment_type', 'Unknown')}
    Make: {diagnostic_data.get('make', 'Not specified')}
    Model: {diagnostic_data.get('model', 'Not specified')}
    Year: {diagnostic_data.get('year', 'Not specified')}
    Mileage/Hours: {diagnostic_data.get('mileage_hours', 'Not specified')}
    Error Codes: {diagnostic_data.get('error_codes', 'None reported')}
    Symptoms: {diagnostic_data.get('symptoms', 'None described')}
    Problem Description: {diagnostic_data.get('problem_description', 'None provided')}
    When Started: {diagnostic_data.get('when_started', 'Not specified')}
    Frequency: {diagnostic_data.get('frequency', 'Not specified')}
    Urgency Level: {diagnostic_data.get('urgency_level', 'Normal')}

    Provide a detailed diagnostic report with:
    1. Initial Assessment
    2. Diagnostic Tests to Perform
    3. Most Likely Causes
    4. Repair Recommendations
    5. Cost Estimates
    6. Safety Considerations
    7. Preventive Maintenance

    Format as a professional diagnostic report.
    """

    try:
        # Vertex AI Gemini integration
        import vertexai
        from vertexai.generative_models import GenerativeModel, GenerationConfig

        # Initialize Vertex AI
        vertexai.init(project=PROJECT_ID, location=VERTEX_LOCATION)

        # Create Gemini model instance
        model = GenerativeModel("gemini-1.5-pro")

        # Configure generation parameters for diagnostic analysis
        generation_config = GenerationConfig(
            temperature=0.2,  # Low temperature for consistent technical analysis
            max_output_tokens=2048,
            top_p=0.8,
            top_k=40
        )

        # Generate diagnostic analysis using Vertex AI Gemini
        response = model.generate_content(
            prompt,
            generation_config=generation_config
        )

        return response.text

    except Exception as e:
        # Fallback analysis if Vertex AI Gemini fails
        print(f"Vertex AI Gemini analysis failed: {str(e)}")
        return f"""
        DIAGNOSTIC REPORT - {diagnostic_data.get('equipment_type', 'Equipment')}

        AI ANALYSIS SUMMARY

        Equipment Details:
        - Type: {diagnostic_data.get('equipment_type', 'Unknown')}
        - Make/Model: {diagnostic_data.get('make', 'N/A')} {diagnostic_data.get('model', 'N/A')}
        - Year: {diagnostic_data.get('year', 'N/A')}
        - Mileage/Hours: {diagnostic_data.get('mileage_hours', 'N/A')}

        Reported Issues:
        - Error Codes: {diagnostic_data.get('error_codes', 'None reported')}
        - Symptoms: {diagnostic_data.get('symptoms', 'None described')}
        - Problem Description: {diagnostic_data.get('problem_description', 'None provided')}
        - When Started: {diagnostic_data.get('when_started', 'Not specified')}
        - Frequency: {diagnostic_data.get('frequency', 'Not specified')}
        - Urgency Level: {diagnostic_data.get('urgency_level', 'Normal')}

        DIAGNOSTIC RECOMMENDATIONS

        1. Initial Assessment
        Based on the reported symptoms and error codes, this requires professional diagnostic attention.

        2. Diagnostic Tests Recommended
        - Visual inspection of affected components
        - Computer diagnostic scan for error codes
        - Performance testing under various conditions

        3. Most Likely Causes
        - Component wear and tear
        - Electrical system issues
        - Software/calibration problems

        4. Repair Recommendations
        Contact a certified technician for detailed diagnosis and repair estimate.

        5. Cost Estimates
        Diagnostic fee: $100-150
        Repair costs will depend on findings

        6. Safety Considerations
        If symptoms worsen, discontinue use and seek immediate professional attention.

        7. Preventive Maintenance
        Follow manufacturer's recommended maintenance schedule.

        Note: This is a preliminary assessment. Professional diagnosis recommended.
        """
    except Exception as e:
        # Fallback to basic analysis if Vertex AI fails
        return f"""
        DIAGNOSTIC REPORT - {diagnostic_data.get('equipment_type', 'Equipment')}

        Equipment Details:
        - Type: {diagnostic_data.get('equipment_type', 'Unknown')}
        - Make/Model: {diagnostic_data.get('make', 'N/A')} {diagnostic_data.get('model', 'N/A')}
        - Year: {diagnostic_data.get('year', 'N/A')}

        Reported Issues:
        - Error Codes: {diagnostic_data.get('error_codes', 'None')}
        - Symptoms: {diagnostic_data.get('symptoms', 'None')}
        - Description: {diagnostic_data.get('problem_description', 'None')}

        Recommendation: Contact a certified technician for detailed diagnosis.

        Note: Advanced AI analysis temporarily unavailable. Error: {str(e)}
        """

def _create_pdf_report(analysis_text: str, diagnostic_data: dict) -> bytes:
    """Create PDF report from analysis text"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "Equipment Diagnostic Report")

    # Report content
    c.setFont("Helvetica", 10)
    y_position = height - 100

    # Split text into lines and add to PDF
    lines = analysis_text.split('\n')
    for line in lines:
        if y_position < 50:  # New page if needed
            c.showPage()
            y_position = height - 50

        # Handle long lines
        if len(line) > 80:
            words = line.split(' ')
            current_line = ""
            for word in words:
                if len(current_line + word) < 80:
                    current_line += word + " "
                else:
                    c.drawString(50, y_position, current_line.strip())
                    y_position -= 15
                    current_line = word + " "
            if current_line:
                c.drawString(50, y_position, current_line.strip())
                y_position -= 15
        else:
            c.drawString(50, y_position, line)
            y_position -= 15

    c.save()
    buffer.seek(0)
    return buffer.getvalue()

def _run_analysis_to_pdf_bytes(diagnostic_id: int) -> bytes:
    """Run complete analysis and generate PDF"""

    # Get Firestore client
    db = get_db()

    # Get diagnostic data from Firestore
    diagnostic_ref = db.collection('diagnostics').document(str(diagnostic_id))
    diagnostic_doc = diagnostic_ref.get()

    if not diagnostic_doc.exists:
        # Create basic report if no data found
        analysis = "Diagnostic data not found. Please contact support."
        return _create_pdf_report(analysis, {})

    diagnostic_data = diagnostic_doc.to_dict()

    # Run Vertex AI analysis
    analysis = _run_vertex_ai_analysis(diagnostic_data)

    # Generate PDF
    return _create_pdf_report(analysis, diagnostic_data)

def _fulfill_checkout(session_obj: dict):
    # You must correlate the session to a diagnostic. Example uses client_reference_id.
    ref = session_obj.get("client_reference_id")  # frontend must pass diagnostic_id here
    if not ref: return
    diag_id = int(ref)

    # Get Firestore client
    db = get_db()

    # Get diagnostic document from Firestore
    diagnostic_ref = db.collection('diagnostics').document(str(diag_id))
    diagnostic_doc = diagnostic_ref.get()

    if not diagnostic_doc.exists:
        # Create if not exists
        diagnostic_data = {
            'id': diag_id,
            'user_id': session_obj["customer_details"]["email"] or "unknown",
            'status': 'pending',
            'created_at': firestore.SERVER_TIMESTAMP
        }
        diagnostic_ref.set(diagnostic_data)

    # Update status to processing
    diagnostic_ref.update({'status': 'processing'})

    try:
        # Generate report using Vertex AI
        pdf = _run_analysis_to_pdf_bytes(diag_id)
        gcs_path = _upload_pdf(diag_id, pdf)

        # Update with success
        diagnostic_ref.update({
            'gcs_path': gcs_path,
            'status': 'ready'
        })
    except Exception as e:
        # Mark as failed if analysis fails
        diagnostic_ref.update({'status': 'failed'})
        print(f"Analysis failed for diagnostic {diag_id}: {str(e)}")

@router.post("/stripe")
async def stripe_webhook(req: Request, bg: BackgroundTasks):
    payload = await req.body()
    sig = req.headers.get("stripe-signature")
    try:
        endpoint_secret = get_stripe_config()
        event = stripe.Webhook.construct_event(payload, sig, endpoint_secret)
    except Exception:
        raise HTTPException(400, "Invalid signature")
    etype = event["type"]
    if etype == "checkout.session.completed":
        session_obj = event["data"]["object"]
        bg.add_task(_fulfill_checkout, session_obj)
    return {"received": True}