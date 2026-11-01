import sqlite3

DB_PATH = "notes.db"


def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with db() as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id TEXT NOT NULL,
                author TEXT NOT NULL,
                subteam TEXT NOT NULL,
                feature TEXT NOT NULL DEFAULT '',
                text TEXT NOT NULL,
                shared INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'judge'
                    CHECK (role IN ('judge', 'admin')),
                subteam TEXT NOT NULL DEFAULT ''
            )"""
        )
