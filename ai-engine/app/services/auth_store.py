import base64
import hashlib
import hmac
import os
import secrets
import sqlite3
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Iterator

PBKDF2_ITERATIONS = 310_000
SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60


def _database_path() -> Path:
    configured = os.getenv("DISHA_AUTH_DATABASE")
    if configured:
        return Path(configured).expanduser()
    return Path.home() / ".disha" / "accounts.sqlite3"


def _hash_password(
    password: str,
    salt: bytes | None = None,
    iterations: int = PBKDF2_ITERATIONS,
) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, iterations
    )
    return "pbkdf2_sha256${}${}${}".format(
        iterations,
        base64.urlsafe_b64encode(salt).decode("ascii"),
        base64.urlsafe_b64encode(digest).decode("ascii"),
    )


def _verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, iterations, salt, expected = encoded.split("$")
        if algorithm != "pbkdf2_sha256":
            return False
        actual = _hash_password(
            password,
            base64.urlsafe_b64decode(salt.encode("ascii")),
            int(iterations),
        ).split("$")[-1]
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


class AuthStore:
    def __init__(self, path: Path | None = None):
        self.path = path or _database_path()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._initialize()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        return connection

    @contextmanager
    def _connection(self) -> Iterator[sqlite3.Connection]:
        connection = self._connect()
        try:
            with connection:
                yield connection
        finally:
            connection.close()

    def _initialize(self) -> None:
        with self._connection() as connection:
            connection.executescript(
                """
                CREATE TABLE IF NOT EXISTS accounts (
                    id INTEGER PRIMARY KEY,
                    name TEXT NOT NULL DEFAULT '',
                    email TEXT UNIQUE,
                    phone TEXT UNIQUE,
                    password_hash TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL,
                    CHECK (email IS NOT NULL OR phone IS NOT NULL)
                );
                CREATE TABLE IF NOT EXISTS auth_sessions (
                    token_hash TEXT PRIMARY KEY,
                    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
                    expires_at INTEGER NOT NULL,
                    created_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS auth_sessions_account_id
                    ON auth_sessions(account_id);
                CREATE TRIGGER IF NOT EXISTS accounts_updated_at
                AFTER UPDATE ON accounts
                FOR EACH ROW
                WHEN NEW.updated_at = OLD.updated_at
                BEGIN
                    UPDATE accounts
                    SET updated_at = unixepoch()
                    WHERE id = NEW.id;
                END;
                """
            )

    @staticmethod
    def _account_view(row: sqlite3.Row) -> dict[str, object]:
        return {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "phone": row["phone"],
        }

    def create_account(
        self, name: str, email: str | None, phone: str | None, password: str
    ) -> dict[str, object]:
        now = int(time.time())
        with self._connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO accounts (name, email, phone, password_hash, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (name.strip(), email, phone, _hash_password(password), now, now),
            )
            account = connection.execute(
                "SELECT id, name, email, phone FROM accounts WHERE id = ?",
                (cursor.lastrowid,),
            ).fetchone()
            return self._account_view(account)

    def authenticate(self, identifier: str, password: str) -> dict[str, object] | None:
        with self._connection() as connection:
            row = connection.execute(
                """
                SELECT id, name, email, phone, password_hash
                FROM accounts
                WHERE email = ? OR phone = ?
                """,
                (identifier, identifier),
            ).fetchone()
        if row is None or not _verify_password(password, row["password_hash"]):
            return None
        return self._account_view(row)

    def create_session(self, account_id: int) -> tuple[str, int]:
        token = secrets.token_urlsafe(32)
        now = int(time.time())
        expires_at = now + SESSION_LIFETIME_SECONDS
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        with self._connection() as connection:
            connection.execute(
                "DELETE FROM auth_sessions WHERE expires_at <= ?", (now,)
            )
            connection.execute(
                """
                INSERT INTO auth_sessions (token_hash, account_id, expires_at, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (token_hash, account_id, expires_at, now),
            )
        return token, expires_at

    def get_session_account(self, token: str) -> dict[str, object] | None:
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        with self._connection() as connection:
            row = connection.execute(
                """
                SELECT a.id, a.name, a.email, a.phone
                FROM auth_sessions s
                JOIN accounts a ON a.id = s.account_id
                WHERE s.token_hash = ? AND s.expires_at > ?
                """,
                (token_hash, int(time.time())),
            ).fetchone()
        return self._account_view(row) if row else None

    def delete_session(self, token: str) -> None:
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        with self._connection() as connection:
            connection.execute(
                "DELETE FROM auth_sessions WHERE token_hash = ?", (token_hash,)
            )
