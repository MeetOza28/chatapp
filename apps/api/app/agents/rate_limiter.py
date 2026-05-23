"""
Simple in-memory rate limiter for AI agent calls.

Limits: max 5 AI calls per room per 60 seconds.
Uses a plain dict — no Redis needed for this simple case.

Why in-memory instead of Redis?
  AI calls are expensive (cost money + take time).
  We want to limit them quickly before even calling the API.
  In-memory is faster and simpler for a demo project.
  In production you'd use Redis for multi-instance support.
"""

import time
from collections import defaultdict
from typing import Tuple

# room_id → list of timestamps when AI was called
_call_history: dict[str, list[float]] = defaultdict(list)

AI_RATE_LIMIT_CALLS  = 5    # max calls per window
AI_RATE_LIMIT_WINDOW = 60   # seconds


def check_ai_rate_limit(room_id: str) -> Tuple[bool, int]:
    """
    Check if a room is within the AI rate limit.

    Returns:
        (allowed: bool, remaining: int)
        allowed   = True if the call is within the limit
        remaining = how many calls are left in this window
    """
    now = time.time()
    window_start = now - AI_RATE_LIMIT_WINDOW

    # Remove old timestamps outside the window
    _call_history[room_id] = [
        t for t in _call_history[room_id]
        if t > window_start
    ]

    current_count = len(_call_history[room_id])

    if current_count >= AI_RATE_LIMIT_CALLS:
        return False, 0

    # Record this call
    _call_history[room_id].append(now)
    remaining = AI_RATE_LIMIT_CALLS - current_count - 1
    return True, remaining