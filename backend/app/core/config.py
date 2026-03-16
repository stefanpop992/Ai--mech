from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    REDIS_URL: str | None = None

    SESSION_EXPIRE_DAYS: int = 30

    FRONTEND_ORIGIN: str = "http://localhost:3000"
    FRONTEND_URL: str = "http://localhost"
    COOKIE_SECURE: bool = False

    GEMINI_API_KEY: str

    RESEND_API_KEY: str = ""
    MAIL_FROM: str = "onboarding@resend.dev"


settings = Settings()
