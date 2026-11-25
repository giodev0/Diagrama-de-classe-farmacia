from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/venda_db"
    JWT_SECRET: str = "troque-esta-chave"
    JWT_ALGORITHM: str = "HS256"
    PRODUTO_URL: str = "http://localhost:8002"
    ESTOQUE_URL: str = "http://localhost:8003"
    PAGAMENTO_URL: str = "http://localhost:3005"
    USAR_MOCKS: bool = True
    model_config = SettingsConfigDict(env_file=BASE_DIR / ".env")

settings = Settings()
