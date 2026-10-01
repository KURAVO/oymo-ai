from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey
)

from backend.database import Base


class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    username = Column(
        String(100),
        unique=True,
        index=True,
        nullable=False
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    # Telegram
    telegram_id = Column(
        String(50),
        unique=True,
        index=True,
        nullable=True
    )

    # Подписка
    subscription = Column(
        String(20),
        nullable=False,
        default="free"
    )


class Chat(Base):

    __tablename__ = "chats"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    title = Column(
        String(200),
        nullable=False,
        default="Новый чат"
    )


class Message(Base):

    __tablename__ = "messages"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    chat_id = Column(
        Integer,
        ForeignKey("chats.id"),
        nullable=False,
        index=True
    )

    role = Column(
        String(20),
        nullable=False
    )

    content = Column(
        Text,
        nullable=False
    )


class File(Base):

    __tablename__ = "files"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    chat_id = Column(
        Integer,
        ForeignKey("chats.id"),
        nullable=False,
        index=True
    )

    filename = Column(
        String(255),
        nullable=False
    )

    filepath = Column(
        String(500),
        nullable=False
    )

    content_type = Column(
        String(100),
        nullable=True
    )
