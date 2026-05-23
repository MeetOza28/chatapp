from app.core.config import settings

_client = None

def _get_client():
    global _client
    if _client is None:
        from groq import AsyncGroq
        if not settings.GROQ_API_KEY:
            raise ValueError("GROQ_API_KEY not set in .env")
        _client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    return _client


async def get_ai_reply(user_message: str, context: list[dict]) -> str | None:
    if not settings.GROQ_API_KEY:
        print("[AI] GROQ_API_KEY not set")
        return None

    model = settings.GROQ_MODEL

    context_text = "\n".join([
        f"{m.get('sender_username', 'user')}: {m.get('content', '')}"
        for m in context[-10:]
    ]) or "No previous messages."

    system_prompt = (
        "You are a helpful AI assistant in a real-time chat room. "
        "Keep replies concise — 1-3 sentences max. "
        "Be friendly. Plain text only, no markdown.\n\n"
        f"Recent chat:\n{context_text}"
    )

    try:
        client   = _get_client()
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            max_tokens=256,
            temperature=0.7,
        )
        content = response.choices[0].message.content
        result  = content.strip() if content else None
        print(f"[AI] Groq reply: {result}")
        return result

    except Exception as e:
        print(f"[AI] Groq error: {e}")
        return None