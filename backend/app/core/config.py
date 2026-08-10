from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "SnapFix AI"
    API_V1_STR: str = "/api/v1"

    # Gemini Vision AI
    GEMINI_API_KEY: str = ""

    # Database
    DATABASE_URL: str = "sqlite:///./civic_sense.db"

    # Supabase Storage (persistent photo storage — survives Render restarts)
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_STORAGE_BUCKET: str = "report-images"

    class Config:
        env_file = ".env"


settings = Settings() # type: ignore[call-arg]