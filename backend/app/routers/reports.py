import os
from uuid import uuid4
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.report_model import Report
from app.schemas.report_schema import ReportResponse
from app.services.ai_service import analyze_civic_image
from app.services.pdf_service import generate_report_pdf

router = APIRouter(prefix="/reports", tags=["Reports"])

# Directory to save uploaded image files locally for static serving
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    latitude: float = Form(...),
    longitude: float = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Core Phase 1 Pipeline:
    1. Reads uploaded photo bytes.
    2. Runs Gemini Vision API analysis.
    3. Saves image locally and creates a report record in Supabase.
    """
    contents = await file.read()
    mime_type = file.content_type or "image/jpeg"

    # 1. AI Analysis via Gemini
    ai_result = await analyze_civic_image(image_bytes=contents, mime_type=mime_type)

    # Save uploaded file locally
    filename_str = file.filename or "image.jpg"
    extension = filename_str.split(".")[-1] if "." in filename_str else "jpg"
    unique_filename = f"{uuid4().hex}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as f:
        f.write(contents)

    image_url = f"/uploads/{unique_filename}"

    # 2. Save record to Supabase database
    new_report = Report(
        image_url=image_url,
        latitude=latitude,
        longitude=longitude,
        category=ai_result.category,
        severity_score=ai_result.severity_score,
        summary=ai_result.summary,
        is_valid_civic_issue=ai_result.is_valid_civic_issue,
        upvotes=1,
        priority_score=float(ai_result.severity_score),
        status="OPEN"
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return new_report


@router.get("/{report_id}/pdf")
def download_report_pdf(report_id: int, db: Session = Depends(get_db)):
    """
    Generates and returns the official administrative grievance PDF.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    pdf_bytes = generate_report_pdf(report)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=grievance_report_{report_id}.pdf"}
    )