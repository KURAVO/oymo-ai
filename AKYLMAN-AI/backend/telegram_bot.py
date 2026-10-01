import os
import asyncio

from dotenv import load_dotenv
from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
)
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    ContextTypes,
    CallbackQueryHandler,
    filters,
)
from sqlalchemy.orm import Session

from backend.ai import oymo
from backend.database import SessionLocal
from backend.database_models import User

load_dotenv()

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")

if not TELEGRAM_BOT_TOKEN:
    raise RuntimeError(
        "TELEGRAM_BOT_TOKEN не найден в файле .env"
    )

user_histories = {}

OFFICIAL_INFO = """🇰🇬 OYMO AI сейчас активно развивается.

Я был создан командой разработчиков проекта OYMO.

Я — продукт технологической экосистемы OYMO. Над моим развитием работает команда специалистов, которые стремятся сделать искусственный интеллект доступным, понятным и полезным для каждого пользователя.

Моя цель — быть вашим интеллектуальным помощником в решении различных задач: от простых вопросов до написания сложного программного кода.

🛠️ Сейчас в разработке:
• 🌐 Официальный сайт OYMO AI
• 📱 Мобильное приложение
• 🤖 Улучшение AI-модели и функций
• 🔐 Система аккаунтов и безопасность
• 🌍 Поддержка нескольких языков

👨‍💻 Разработчик: команда OYMO AI

📢 Следить за новостями и обновлениями можно через официальные каналы.

🚀 OYMO AI — технологический проект из Кыргызстана, который находится в активной разработке."""

PLANS = {
    "free": {
        "name": "🆓 Free",
        "price": "0 сом",
        "description": "Базовый доступ к OYMO AI.",
    },
    "plus": {
        "name": "⚡ Plus",
        "price": "299 сом/мес",
        "description": "Расширенные возможности OYMO AI.",
    },
    "pro": {
        "name": "🚀 Pro",
        "price": "699 сом/мес",
        "description": "Продвинутые функции и приоритет.",
    },
    "ultra": {
        "name": "👑 Ultra",
        "price": "1499 сом/мес",
        "description": "Максимальный доступ ко всем доступным функциям.",
    },
}


def official_keyboard():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "📢 Telegram",
                url="https://t.me/oymoai"
            ),
            InlineKeyboardButton(
                "📸 Instagram",
                url="https://www.instagram.com/oymoai/"
            ),
        ]
    ])


def plans_keyboard():
    return InlineKeyboardMarkup([
        [
            InlineKeyboardButton(
                "⚡ Plus",
                callback_data="plan_plus"
            ),
            InlineKeyboardButton(
                "🚀 Pro",
                callback_data="plan_pro"
            ),
        ],
        [
            InlineKeyboardButton(
                "👑 Ultra",
                callback_data="plan_ultra"
            ),
        ],
    ])


def get_or_create_user(telegram_user):
    db: Session = SessionLocal()

    try:
        telegram_id = str(telegram_user.id)

        user = (
            db.query(User)
            .filter(User.telegram_id == telegram_id)
            .first()
        )

        if user:
            return user.subscription

        username = (
            telegram_user.username
            or f"telegram_{telegram_id}"
        )

        # username должен быть уникальным
        existing_username = (
            db.query(User)
            .filter(User.username == username)
            .first()
        )

        if existing_username:
            username = f"telegram_{telegram_id}"

        user = User(
            username=username,
            password_hash="telegram_user",
            telegram_id=telegram_id,
            subscription="free",
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        return user.subscription

    finally:
        db.close()


async def start(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE
):
    if not update.effective_user:
        return

    get_or_create_user(update.effective_user)

    await update.message.reply_text(
        "👋 Привет! Я ОЮМО AI.\n\n"
        "🇰🇬 Искусственный интеллект, созданный в Кыргызстане.\n\n"
        "Я могу помочь тебе с вопросами, учёбой, текстами, "
        "программированием, идеями и другими задачами.\n\n"
        "💬 Напиши, что тебе нужно — начнём.",
        reply_markup=official_keyboard()
    )


async def subscription(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE
):
    if not update.effective_user:
        return

    current_plan = get_or_create_user(
        update.effective_user
    )

    plan = PLANS.get(
        current_plan,
        PLANS["free"]
    )

    text = (
        "💎 Ваша подписка OYMO AI\n\n"
        f"Текущий тариф: {plan['name']}\n"
        f"Цена: {plan['price']}\n\n"
        f"{plan['description']}\n\n"
        "Выберите тариф:"
    )

    await update.message.reply_text(
        text,
        reply_markup=plans_keyboard()
    )


async def plan_callback(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE
):
    query = update.callback_query

    if not query:
        return

    await query.answer()

    plan_id = query.data.replace(
        "plan_",
        ""
    )

    plan = PLANS.get(plan_id)

    if not plan:
        return

    await query.message.reply_text(
        f"{plan['name']}\n\n"
        f"Цена: {plan['price']}\n\n"
        f"{plan['description']}\n\n"
        "💳 Система оплаты OYMO AI сейчас находится "
        "в разработке.\n\n"
        "После подключения оплаты этот тариф можно "
        "будет активировать прямо здесь."
    )


async def handle_message(
    update: Update,
    context: ContextTypes.DEFAULT_TYPE
):
    if not update.message or not update.message.text:
        return

    telegram_user_id = update.effective_user.id
    user_message = update.message.text.strip()

    if not user_message:
        return

    get_or_create_user(
        update.effective_user
    )

    official_keywords = (
        "сайт",
        "приложение",
        "официальный сайт",
        "официальное приложение",
        "телеграм",
        "telegram",
        "инстаграм",
        "instagram",
        "канал",
        "новости",
        "обновления",
        "кто тебя создал",
        "кто создал",
        "кто разработчик",
        "разработчик",
        "о проекте",
        "что такое oymo",
    )

    message_lower = user_message.lower()

    if any(
        keyword in message_lower
        for keyword in official_keywords
    ):
        await update.message.reply_text(
            OFFICIAL_INFO,
            reply_markup=official_keyboard()
        )
        return

    history = user_histories.get(
        telegram_user_id,
        []
    )

    try:
        answer = await asyncio.to_thread(
            oymo.generate_response,
            user_message,
            history
        )

        history.append({
            "role": "user",
            "content": user_message
        })

        history.append({
            "role": "assistant",
            "content": answer
        })

        user_histories[
            telegram_user_id
        ] = history[-30:]

        await update.message.reply_text(
            answer
        )

    except Exception as error:
        print(
            "TELEGRAM ERROR:",
            error
        )

        await update.message.reply_text(
            "ОЮМО AI временно не может обработать запрос."
        )


def main():
    application = (
        Application.builder()
        .token(TELEGRAM_BOT_TOKEN)
        .build()
    )

    application.add_handler(
        CommandHandler(
            "start",
            start
        )
    )

    application.add_handler(
        CommandHandler(
            "subscription",
            subscription
        )
    )

    application.add_handler(
        CallbackQueryHandler(
            plan_callback,
            pattern="^plan_"
        )
    )

    application.add_handler(
        MessageHandler(
            filters.TEXT & ~filters.COMMAND,
            handle_message
        )
    )

    print(
        "OYMO AI TELEGRAM BOT: запущен"
    )

    application.run_polling()


if __name__ == "__main__":
    main()
