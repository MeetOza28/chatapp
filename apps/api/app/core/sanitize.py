import re
import bleach

# ── Control character pattern ─────────────────────────────────
# Matches characters that have no business being in user text:
#   \x01-\x08  — non-printable control chars
#   \x0b       — vertical tab
#   \x0c       — form feed
#   \x0e-\x1f  — shift-out through unit separator
#   \x7f       — delete character
#
# NOTE: We intentionally write these as escaped strings (\\x0b etc.)
# rather than embedding literal bytes, so the source file stays
# valid UTF-8 and the regex pattern is portable.
_CONTROL_CHARS = re.compile(
    "[" +
    "\\x01-\\x08" +
    "\\x0b" +
    "\\x0c" +
    "\\x0e-\\x1f" +
    "\\x7f" +
    "]"
)

# Null byte gets its own pass — some attack vectors embed these
# to confuse parsers even when other control chars are stripped
_NULL_BYTE = re.compile("\\x00")


def clean_text(value: str) -> str:
    """
    Sanitize a user-supplied string before storing or broadcasting.

    Pipeline:
      1. Strip null bytes
      2. Strip remaining dangerous control characters
      3. Strip all HTML tags via bleach (prevents XSS in stored content)
      4. Strip leading/trailing whitespace

    Usage:
      content = clean_text(raw_input)
    """
    # 1. Remove null bytes
    value = _NULL_BYTE.sub("", value)

    # 2. Remove control characters
    value = _CONTROL_CHARS.sub("", value)

    # 3. Strip all HTML — tags=[] means nothing is allowed through
    #    strip=True removes the tags rather than escaping them
    value = bleach.clean(value, tags=[], strip=True)

    # 4. Trim surrounding whitespace
    return value.strip()


def clean_username(value: str) -> str:
    """
    Extra-strict sanitization for usernames.
    After clean_text(), keep only alphanumeric + underscore.
    """
    value = clean_text(value)
    return re.sub(r"[^a-zA-Z0-9_]", "", value)


def clean_room_name(value: str) -> str:
    """
    Sanitization for room names.
    After clean_text(), keep only alphanumeric + space + hyphen + underscore.
    """
    value = clean_text(value)
    return re.sub(r"[^a-zA-Z0-9_\- ]", "", value).strip()