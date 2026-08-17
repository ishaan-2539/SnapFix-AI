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
    SUPABASE_JWT_SECRET: str = ""

    # OpenStreetMap / Overpass Spatial Intelligence
    OVERPASS_API_URLS: list[str] = [
        "https://overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter",
    ]

    OVERPASS_SEARCH_RADIUS_METERS: int = 1000
    OVERPASS_CONNECT_TIMEOUT_SECONDS: float = 10.0
    OVERPASS_READ_TIMEOUT_SECONDS: float = 30.0
    class Config:
        env_file = ".env"


settings = Settings() # type: ignore[call-arg]