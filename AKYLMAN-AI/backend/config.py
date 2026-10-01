import os
from dataclasses import dataclass


@dataclass
class Settings:
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    secret_key: str = os.getenv(
        "SECRET_KEY",
        "oymo-development-secret-key-change-before-production"
    )
    database_url: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./data/oymo.db"
    )


settings = Settings()
