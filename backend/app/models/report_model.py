from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.core.database import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    
    # AI Extracted Fields
    category = Column(String, nullable=False, index=True)
    severity_score = Column(Integer, nullable=False)  # 1 to 10
    summary = Column(Text, nullable=False)
    is_valid_civic_issue = Column(Boolean, default=True)
    
    # System & Tracking Metadata
    upvotes = Column(Integer, default=1)
    priority_score = Column(Float, default=1.0)
    status = Column(String, default="OPEN", index=True)  # OPEN, IN_PROGRESS, RESOLVED
    created_at = Column(DateTime(timezone=True), server_default=func.now())