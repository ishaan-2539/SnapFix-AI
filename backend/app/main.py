from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routers import analytics, reports
from sqlalchemy import text
from app.core.database import get_db
from fastapi import Depends
from sqlalchemy.orm import Session
from app.core.database import Base, engine
from app.models import report_model  # ensures the Report model is registered

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="SnapFix AI API",
    description="Automated civic issue detection and municipal work order routing",
    version="1.0.0",
)

# Set up CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
# Mount local uploads directory for static image serving
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include Routers
app.include_router(reports.router, prefix=f"{settings.API_V1_STR}/reports", tags=["Reports"]) # (Wait, ensure reports is imported as a module)
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["Analytics"])


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API Engine",
        "docs": "/docs",
        "status": "online"
    }
@app.get("/health", tags=["Health"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint to verify API and Database connectivity."""
    try:
        # Quick ping to verify DB connection
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": str(e)}