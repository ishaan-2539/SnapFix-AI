import io
import os
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import Image as RLImage, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.models.report_model import Report


def generate_report_pdf(report: Report) -> bytes:
    """Generates an official municipal work order PDF for a given civic report."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    story = []
    styles = getSampleStyleSheet()

    # Safely extract attributes to satisfy Pylance / VS Code type checker
    report_id = str(getattr(report, "id", ""))
    category = str(getattr(report, "category", "")).title()
    status = str(getattr(report, "status", "OPEN"))
    severity_score = getattr(report, "severity_score", 0)
    priority_score = getattr(report, "priority_score", 0)
    upvotes = getattr(report, "upvotes", 1)
    latitude = float(getattr(report, "latitude", 0.0) or 0.0)
    longitude = float(getattr(report, "longitude", 0.0) or 0.0)
    summary = str(getattr(report, "summary", ""))
    image_url = str(getattr(report, "image_url", "") or "")

    # Custom Styling
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=10
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=15
    )
    heading_style = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#334155")
    )

    # 1. Header Banner
    story.append(Paragraph("SnapFix AI - Municipal Inspection & Work Order Report", title_style))
    story.append(Paragraph(f"Generated for Municipal Action | Report ID: #{report_id}", subtitle_style))
    story.append(Spacer(1, 10))

    # 2. Key Metrics Table
    maps_url = f"https://www.google.com/maps?q={latitude},{longitude}"
    
    table_data = [
        [
            Paragraph("<b>Category:</b>", body_style), Paragraph(category, body_style),
            Paragraph("<b>Status:</b>", body_style), Paragraph(status, body_style)
        ],
        [
            Paragraph("<b>Severity Score:</b>", body_style), Paragraph(f"{severity_score}/10", body_style),
            Paragraph("<b>Priority Score:</b>", body_style), Paragraph(str(priority_score), body_style)
        ],
        [
            Paragraph("<b>Community Upvotes:</b>", body_style), Paragraph(str(upvotes), body_style),
            Paragraph("<b>Coordinates:</b>", body_style), Paragraph(f"{latitude:.5f}, {longitude:.5f}", body_style)
        ]
    ]

    metric_table = Table(table_data, colWidths=[110, 160, 100, 170])
    metric_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    
    story.append(metric_table)
    story.append(Spacer(1, 15))

    # 3. AI Incident Summary
    story.append(Paragraph("AI Inspection Summary", heading_style))
    story.append(Paragraph(f"<b>Summary:</b> {summary}", body_style))
    story.append(Spacer(1, 15))

    # 4. Embedded Photo (If stored locally in /uploads)
    if image_url and image_url.startswith("/uploads/"):
        local_path = image_url.lstrip("/")
        if os.path.exists(local_path):
            story.append(Paragraph("Incident Evidence Photo", heading_style))
            # Scaled image thumbnail
            img = RLImage(local_path, width=400, height=250)
            story.append(img)
            story.append(Spacer(1, 15))

    # 5. Footer / Map Direct Link
    story.append(Paragraph(f"<b>Location Reference Link:</b> <a href='{maps_url}'>{maps_url}</a>", body_style))

    # Build PDF
    doc.build(story)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes