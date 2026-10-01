import json

from backend.config import settings

from redis.asyncio import Redis

from backend.config import settings

redis = Redis.from_url(
    settings.redis_url,
    encoding="utf-8",
    decode_responses=True,
    socket_connect_timeout=1,
    socket_timeout=1, ы
)


async def get_json(key: str):

    try:

        value = await redis.get(key)

        if not value:
            return None

        return json.loads(value)

    except Exception as error:

        print(
            "REDIS GET ERROR:",
            error,
        )

        return None


async def set_json(
    key: str,
    value,
    ttl: int=60,
):

    try:

        await redis.set(
            key,
            json.dumps(
                value,
                ensure_ascii=False,
            ),
            ex=ttl,
        )

    except Exception as error:

        print(
            "REDIS SET ERROR:",
            error,
        )
