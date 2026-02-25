from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str
    REDIS_URL: str | None = None


settings = Settings()

JWT_SECRET: str
JWT_ALG: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

FRONTEND_ORIGIN: str = "http://localhost:3000"
COOKIE_SECURE: bool = False
