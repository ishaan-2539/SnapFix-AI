# app/services/pdf_service.py
from datetime import datetime
from fpdf import FPDF
from fpdf.enums import XPos, YPos
from app.models.report_model import Report

class GrievancePDF(FPDF):
    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.cell(0, 10, "MUNICIPAL INFRASTRUCTURE GRIEVANCE NOTICE", border=0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.set_font("Helvetica", "I", 10)
        self.cell(0, 5, "Generated via CivicFix AI Platform", border=0, new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

def generate_report_pdf(report: Report) -> bytes:
    """
    Generates a formal administrative complaint document as PDF raw bytes.
    """
    pdf = GrievancePDF()
    pdf.add_page()
    pdf.set_font("Helvetica", size=11)

    # Safely extract values via getattr to bypass SQLAlchemy descriptor type warnings
    raw_id = getattr(report, "id", 0)
    report_id = int(raw_id) if raw_id is not None else 0

    raw_created_at = getattr(report, "created_at", None)
    if isinstance(raw_created_at, datetime):
        date_str = raw_created_at.strftime('%Y-%m-%d %H:%M:%S')
    else:
        date_str = str(raw_created_at or "N/A")

    raw_lat = getattr(report, "latitude", 0.0)
    lat = float(raw_lat) if raw_lat is not None else 0.0

    raw_lng = getattr(report, "longitude", 0.0)
    lng = float(raw_lng) if raw_lng is not None else 0.0

    category_str = str(getattr(report, "category", "General"))
    severity_val = str(getattr(report, "severity_score", "N/A"))
    summary_str = str(getattr(report, "summary", ""))

    # Incident Details Box
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, f"Complaint Reference Ticket #: CF-2026-{report_id:04d}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", size=10)
    pdf.cell(0, 6, f"Date Reported: {date_str}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 6, f"Target Department: {category_str}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 6, f"Severity Assessment: {severity_val} / 10", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 6, f"Location Coordinates: Lat {lat:.6f}, Long {lng:.6f}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(8)

    # Official Summary Section
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Official AI Incident Assessment:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font("Helvetica", size=10)
    pdf.multi_cell(0, 6, summary_str)
    pdf.ln(10)

    # Statutory Directive Text
    pdf.set_font("Helvetica", "I", 9)
    directive = (
        "Notice to Municipal Ward Authorities: The issue above has been flagged by automated citizen reporting "
        "and prioritized based on public safety risk factors. Prompt site inspection and repair dispatch are requested."
    )
    pdf.multi_cell(0, 5, directive)

    # Return raw PDF byte string
    return bytes(pdf.output())