"""Normalize better-auth session tokens from cookies or query params."""

from urllib.parse import unquote


def normalize_session_token(raw: str | None) -> str | None:
    if not raw:
        return None
    token = unquote(raw)
    if "." in token:
        token = token.split(".")[0]
    return token
