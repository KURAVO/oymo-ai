import sqlite3

db = sqlite3.connect("data/oymo.db")
c = db.cursor()

c.execute("ALTER TABLE users ADD COLUMN telegram_id VARCHAR(50)")
c.execute(
    "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_telegram_id "
    "ON users (telegram_id)"
)
c.execute(
    "ALTER TABLE users ADD COLUMN subscription "
    "VARCHAR(20) NOT NULL DEFAULT 'free'"
)

db.commit()
db.close()

print("База OYMO обновлена")