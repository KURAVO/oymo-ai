import asyncio
import hashlib
import time
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.ai import oymo
from backend.cache import get_json, set_json
from backend.config import settings
from backend.schemas import ChatRequest, ChatResponse

APP_NAME = "OYMO AI"
APP_VERSION = "1.0.0"
MAX_HISTORY = 30

app = FastAPI(
    title="OYMO AI API",
    description="Единый AI API проекта OYMO",
    version=APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# HEALTH
# ---------------------------------------------------------


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": APP_NAME,
        "version": APP_VERSION,
        "founder": "Динар",
        "city": "Ош, Кыргызстан",
    }

# ---------------------------------------------------------
# STATUS
# ---------------------------------------------------------


@app.get("/api/v1/status")
async def status():
    return {
        "service": "OYMO",
        "version": APP_VERSION,
        "founder": "Динар",
        "city": "Ош, Кыргызстан",
        "ai": "OYMO AI",
        "cache": "Redis",
        "database": "Supabase",
        "support_tickets": False,
    }

# ---------------------------------------------------------
# ABOUT
# ---------------------------------------------------------


@app.get("/api/v1/about")
async def about():
    return {
        "name": "OYMO",
        "ai_name": "OYMO AI",
        "founder": "Динар",
        "location": "Ош, Кыргызстан",
        "version": "OYMO v1.0 by Dinar",
        "description": (
            "OYMO — единая AI-система для сайта, "
            "мобильного приложения и Telegram."
        ),
    }

# ---------------------------------------------------------
# SETTINGS
# ---------------------------------------------------------


@app.get("/api/v1/settings")
async def app_settings():
    return {
        "app_name": "OYMO",
        "version": "OYMO v1.0 by Dinar",
        "founder": "Динар",
        "privacy_url": "/privacy",
        "terms_url": "/terms",
        "support_tickets": False,
        "account_deletion": True,
    }

# ---------------------------------------------------------
# CACHE KEY
# ---------------------------------------------------------


def make_cache_key(message: str) -> str:
    normalized = message.strip().lower()

    digest = hashlib.sha256(
        normalized.encode("utf-8")
    ).hexdigest()

    return f"oymo:ai:{digest}"

# ---------------------------------------------------------
# AI
# ---------------------------------------------------------


async def call_oymo_ai(
    message: str,
    history: list[dict[str, Any]],
) -> str:

    return await asyncio.to_thread(
        oymo.generate_response,
        message,
        history,
    )

# ---------------------------------------------------------
# CHAT
# ---------------------------------------------------------


@app.post(
    "/api/v1/chat",
    response_model=ChatResponse,
)
async def chat(payload: ChatRequest):

    started = time.perf_counter()

    message = payload.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Сообщение не может быть пустым.",
        )

    # -----------------------------------------------------
    # CACHE
    # -----------------------------------------------------

    cache_key = make_cache_key(message)

    cached = await get_json(cache_key)

    if cached:
        return ChatResponse(
            answer=cached["answer"],
            cached=True,
        )

    # -----------------------------------------------------
    # HISTORY
    # -----------------------------------------------------

    history: list[dict[str, Any]] = []

    # История будет подключена к Supabase
    # на следующем этапе.

    # -----------------------------------------------------
    # AI REQUEST
    # -----------------------------------------------------

    try:

        answer = await asyncio.wait_for(
            call_oymo_ai(
                message=message,
                history=history,
            ),
            timeout=4.0,
        )

    except asyncio.TimeoutError:

        raise HTTPException(
            status_code=504,
            detail=(
                "OYMO AI не успел ответить "
                "в установленный лимит."
            ),
        )

    except Exception as error:

        print(
            "OYMO AI ERROR:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Ошибка OYMO AI.",
        )

    # -----------------------------------------------------
    # REDIS CACHE
    # -----------------------------------------------------

    await set_json(
        cache_key,
        {
            "answer": answer,
        },
        ttl=60,
    )

    # -----------------------------------------------------
    # PERFORMANCE
    # -----------------------------------------------------

    elapsed = time.perf_counter() - started

    print(
        f"OYMO REQUEST: {elapsed:.2f}s"
    )

    if elapsed >= 5:

        print(
            "OYMO WARNING: "
            f"slow request {elapsed:.2f}s"
        )

    return ChatResponse(
        answer=answer,
        cached=False,
    )

# ---------------------------------------------------------
# ROOT
# ---------------------------------------------------------


@app.get("/")
async def root():

    return {
        "name": "OYMO AI",
        "version": APP_VERSION,
        "founder": "Фархат",
        "location": "Бишкек, Кыргызстан",
        "status": "online",
    }
