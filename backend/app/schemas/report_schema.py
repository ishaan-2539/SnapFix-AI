from pydantic import BaseModel, Field, model_validator
from datetime import datetime
from typing import Literal , Any
import json

# 1. Gemini Vision Structured Output Schema
class AIReportAnalysis(BaseModel):
    is_valid_civic_issue: bool = Field(
        description=(
            "True if the image clearly depicts a public civic or infrastructure "
            "issue. False for selfies, pets, food, documents, indoor scenes, "
            "or unrelated content."
        )
    )

    category: str = Field(
        description=(
            "Primary civic issue category: Pothole, Trash/Garbage, Water Leak, "
            "Damaged Streetlight, Road Damage, Broken Sidewalk, or Other."
        )
    )

    base_severity: int = Field(
        ge=1,
        le=6,
        description=(
            "Visual severity only, from 1 to 6. This MUST represent the physical "
            "condition visible in the image and MUST NOT consider location, "
            "traffic, nearby schools, hospitals, report count, or other external context."
        )
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Model confidence in the visual classification."
    )

    hazards: list[str] = Field(
        default_factory=list,
        description=(
            "Specific visible hazards such as vehicle collision risk, "
            "pedestrian obstruction, exposed wiring, flooding, structural damage, "
            "blocked drainage, or visibility obstruction."
        )
    )

    affected_users: list[str] = Field(
        default_factory=list,
        description=(
            "Types of people or road users potentially affected, such as "
            "pedestrians, cyclists, motorists, children, elderly people, or residents."
        )
    )

    repair_complexity: str = Field(
        description="Estimated repair complexity: Minor, Moderate, or Major."
    )

    recommended_action: str = Field(
        description="Recommended immediate municipal action based only on the visible issue."
    )

    summary: str = Field(
        description="Concise 2-3 sentence formal municipal incident summary."
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
    priority_breakdown: dict[str, Any] | None = None
    status: str
    created_at: datetime

    # AI Forensic Telemetry
    ai_confidence: float | None = None
    hazards: list[str] = Field(default_factory=list)
    affected_users: list[str] = Field(default_factory=list)
    repair_complexity: str | None = None
    recommended_action: str | None = None

    @model_validator(mode="before")
    @classmethod
    def normalize_forensic_fields(cls, data):
        """
        Convert PostgreSQL TEXT fields containing JSON arrays
        into Python lists for the API response.
        """

        if not isinstance(data, dict):
            data = {
                "id": data.id,
                "image_url": data.image_url,
                "latitude": data.latitude,
                "longitude": data.longitude,
                "category": data.category,
                "severity_score": data.severity_score,
                "summary": data.summary,
                "is_valid_civic_issue": data.is_valid_civic_issue,
                "upvotes": data.upvotes,
                "priority_score": data.priority_score,
                "priority_breakdown": data.priority_breakdown,
                "status": data.status,
                "created_at": data.created_at,

                "ai_confidence": data.ai_confidence,
                "hazards": data.hazards,
                "affected_users": data.affected_users,
                "repair_complexity": data.repair_complexity,
                "recommended_action": data.recommended_action,
            }

        for field in ("hazards", "affected_users"):
            value = data.get(field)

            if isinstance(value, str):
                try:
                    data[field] = json.loads(value)
                except json.JSONDecodeError:
                    data[field] = []

            elif value is None:
                data[field] = []


        priority_breakdown = data.get("priority_breakdown")

        if isinstance(priority_breakdown, str):
            try:
                data["priority_breakdown"] = json.loads(priority_breakdown)
            except json.JSONDecodeError:
                data["priority_breakdown"] = None

        elif priority_breakdown is None:
            data["priority_breakdown"] = None

        return data

    class Config:
        from_attributes = True

class StatusUpdateRequest(BaseModel):
    status: Literal["OPEN", "IN_PROGRESS", "RESOLVED"]