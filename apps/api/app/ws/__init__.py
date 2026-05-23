"""WebSocket package for the API.

This package exposes the `manager` instance from `manager.py` so
`from app.ws.manager import manager` works as expected.
"""

from .manager import manager

__all__ = ["manager"]
