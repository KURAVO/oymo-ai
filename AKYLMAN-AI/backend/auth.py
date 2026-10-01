from datetime import datetime, timedelta, timezone
import os

from dotenv import load_dotenv
from jose import jwt, JWTError
import bcrypt


# =========================
# ENV
# =========================

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY не найден в файле .env"
    )

if len(SECRET_KEY) < 32:
    raise RuntimeError(
        "JWT_SECRET_KEY должен содержать минимум 32 символа."
    )


# =========================
# JWT
# =========================

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


# =========================
# PASSWORD
# =========================

MAX_PASSWORD_BYTES = 72


def hash_password(password: str) -> str:

    password_bytes = password.encode("utf-8")

    if len(password_bytes) > MAX_PASSWORD_BYTES:
        raise ValueError(
            "Пароль слишком длинный. Максимум 72 байта."
        )

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed.decode("utf-8")


def verify_password(
    password: str,
    password_hash: str
) -> bool:

    password_bytes = password.encode("utf-8")

    if len(password_bytes) > MAX_PASSWORD_BYTES:
        return False

    try:

        return bcrypt.checkpw(
            password_bytes,
            password_hash.encode("utf-8")
        )

    except (
        ValueError,
        TypeError
    ):

        return False


# =========================
# TOKEN
# =========================

def create_access_token(
    user_id: int
) -> str:

    expire = (
        datetime.now(timezone.utc)
        + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )
    )

    payload = {
        "sub": str(user_id),
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# =========================
# ПРОВЕРКА TOKEN
# =========================

def get_user_id_from_token(
    token: str
):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            return None

        return int(user_id)

    except (
        JWTError,
        ValueError,
        TypeError
    ):

        return None