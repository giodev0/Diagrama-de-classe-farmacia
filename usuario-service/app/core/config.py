from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/usuario_db"
    JWT_SECRET: str = "troque-esta-chave"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60
    ADMIN_EMAIL: str = "email@exemplo.com"
    ADMIN_SENHA: str = "troque-esta-senha"
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")

settings = Settings()