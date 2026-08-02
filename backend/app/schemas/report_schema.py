from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal
# 1. Gemini Vision Structured Output Schema
class AIReportAnalysis(BaseModel):
    is_valid_civic_issue: bool = Field(
        description="True if the image clearly depicts a public infrastructure or civic defect (e.g. pothole, garbage dump, broken streetlight). False if it's a selfie, pet, food, or indoor photo."
    )
    category: str = Field(
        description="High-level civic department category: 'Roads & Footpaths', 'Waste Management', 'Water & Sewage', 'Electrical & Lighting', or 'Traffic & Signage'."
    )
    severity_score: int = Field(
        description="Integer from 1 (minor cosmetic issue) to 10 (immediate critical threat to public safety)."
    )
    summary: str = Field(
        description="Concise 2-3 sentence formal administrative description of the defect shown in the image."
    )

# 2. Endpoint JSON Response Schema
class ReportResponse(BaseModel):
    id: int
    image_url: str
    latitude: float
    longitude: float
    category: str
    severity_score: int
    summary: str
    is_valid_civic_issue: bool
    upvotes: int
    priority_score: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True  # Allows Pydantic to read SQLAlchemy ORM models directly

class StatusUpdateRequest(BaseModel):
    status: Literal["OPEN", "IN_PROGRESS", "RESOLVED"]