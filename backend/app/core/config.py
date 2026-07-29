from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "CivicFix AI"
    API_V1_STR: str = "/api/v1"
    GROQ_API_KEY: str
    DATABASE_URL: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings() # type: ignore[call-arg]