"""Provider-agnostic LLM selection.

ClearPath already ships a ``GEMINI_API_KEY`` (see AGENTS.md), so the default
here is Gemini — no need to buy an OpenAI key. Override with ``GROWTH_OS_MODEL``.

Priority:
  1. ``GROWTH_OS_MODEL`` if set (e.g. "gemini/gemini-2.0-flash", "gpt-4o-mini",
     "groq/llama-3.3-70b-versatile").
  2. Gemini default when ``GEMINI_API_KEY`` is present.
  3. OpenAI default when ``OPENAI_API_KEY`` is present.
  4. ``None`` -> let CrewAI use its own default (keeps imports working with no key).
"""

from __future__ import annotations

import os
from functools import lru_cache


def _model_name() -> str | None:
    explicit = os.getenv("GROWTH_OS_MODEL")
    if explicit:
        return explicit
    if os.getenv("GEMINI_API_KEY"):
        return "gemini/gemini-2.0-flash"
    if os.getenv("OPENAI_API_KEY"):
        return "gpt-4o-mini"
    if os.getenv("GROQ_API_KEY"):
        return "groq/llama-3.3-70b-versatile"
    return None


@lru_cache(maxsize=1)
def default_llm():
    """Return a configured ``crewai.LLM`` or ``None`` (use CrewAI's default).

    Imported lazily so modules that only need tools/planning don't pay for it.
    """
    model = _model_name()
    if not model:
        return None
    try:
        from crewai import LLM
    except Exception:
        return None

    # Prefer CrewAI's native provider; if the optional native SDK isn't
    # installed (e.g. crewai[google-genai]), fall back to the bundled LiteLLM
    # path which supports the same "provider/model" strings.
    try:
        return LLM(model=model, temperature=0.7)
    except Exception:
        try:
            return LLM(model=model, temperature=0.7, is_litellm=True)
        except Exception:
            return None
