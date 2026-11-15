import os
import sqlite3
from contextlib import contextmanager

DB_PATH = os.getenv("DB_PATH", "cinematch.db")


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS watchlist (
                movie_id   INTEGER PRIMARY KEY,
                title      TEXT NOT NULL,
                poster_url TEXT,
                added_at   TEXT DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def add_to_watchlist(movie_id: int, title: str, poster_url: str | None) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO watchlist (movie_id, title, poster_url) VALUES (?, ?, ?)",
            (movie_id, title, poster_url),
        )


def get_watchlist() -> list[dict]:
    with get_conn() as conn:
        rows = conn.execute("SELECT * FROM watchlist ORDER BY added_at DESC").fetchall()
        return [dict(r) for r in rows]


def remove_from_watchlist(movie_id: int) -> bool:
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM watchlist WHERE movie_id = ?", (movie_id,))
        return cur.rowcount > 0
    