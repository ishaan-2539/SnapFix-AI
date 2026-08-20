from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String, nullable=False)
    image_hash = Column(String, index=True, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    
    # AI Extracted Fields
    category = Column(String, nullable=False, index=True)

    # Visual severity determined by Gemini.
    # This is NOT the final contextual priority.
    severity_score = Column(Integer, nullable=False)

    summary = Column(Text, nullable=False)
    is_valid_civic_issue = Column(Boolean, default=True)

    # AI Forensic Telemetry
    ai_confidence = Column(Float, nullable=True)
    hazards = Column(Text, nullable=True)
    affected_users = Column(Text, nullable=True)
    repair_complexity = Column(String, nullable=True)
    recommended_action = Column(Text, nullable=True)
    
    # System & Tracking Metadata
    upvotes = Column(Integer, default=1)
    priority_score = Column(Float, nullable=False, default=0.0)

    # Deterministic contextual priority explanation.
    # Stored as JSON text for SQLite/PostgreSQL compatibility.
    priority_breakdown = Column(Text, nullable=True)

    status = Column(String, default="OPEN", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())