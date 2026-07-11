"""Thin HTTP client for the ClearPath Trader (server.ts) JSON APIs.

These are plain functions with no CrewAI dependency so they can be unit-tested
directly against a running server. The CrewAI tool wrappers in ``tools.py``
call straight through to these.

Endpoints wired here (all defined in ``server.ts``):
  - GET  /api/semantic/content   -> full EEAT educational corpus (SEMANTIC_RECORDS)
  - GET  /api/semantic/faqs      -> site-wide FAQ list (GENERAL_FAQS)
  - POST /api/semantic/link      -> auto internal-links finance terms in text
  - GET  /api/news/search?q=     -> Gemini-grounded finance news + sentiment
  - GET  /api/fred/observations  -> macro series proxy
  - GET  /api/quote?symbol=      -> live/last quote for a symbol
"""

from __future__ import annotations

import json
from typing import Any

import requests

from .config import REQUEST_TIMEOUT_SECONDS, api_base


class ClearPathAPIError(RuntimeError):
    """Raised when a ClearPath API call fails."""


def _get(path: str, params: dict[str, Any] | None = None) -> Any:
    url = f"{api_base()}{path}"
    try:
        resp = requests.get(url, params=params, timeout=REQUEST_TIMEOUT_SECONDS)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:  # network / HTTP error
        raise ClearPathAPIError(f"GET {url} failed: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise ClearPathAPIError(f"GET {url} returned non-JSON body") from exc


def _post(path: str, payload: dict[str, Any]) -> Any:
    url = f"{api_base()}{path}"
    try:
        resp = requests.post(url, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as exc:
        raise ClearPathAPIError(f"POST {url} failed: {exc}") from exc
    except json.JSONDecodeError as exc:
        raise ClearPathAPIError(f"POST {url} returned non-JSON body") from exc


def get_semantic_content() -> dict[str, Any]:
    """Return the full semantic/educational record set keyed by topic id."""
    return _get("/api/semantic/content")


def get_faqs() -> list[dict[str, str]]:
    """Return the site-wide FAQ list."""
    return _get("/api/semantic/faqs")


def semantic_link(text: str) -> str:
    """Auto internal-link recognised finance terms in ``text``.

    Returns the linked HTML string (the ``linkedText`` field of the response).
    """
    data = _post("/api/semantic/link", {"text": text})
    return data.get("linkedText", text)


def search_news(query: str) -> dict[str, Any]:
    """Grounded finance-news search + sentiment for ``query``.

    Note: without ``GEMINI_API_KEY`` set on the server this returns clearly
    labelled ``demo: true`` data — safe to use, but never publish demo numbers.
    """
    return _get("/api/news/search", params={"q": query})


def get_fred_observations(series_id: str) -> dict[str, Any]:
    """Fetch a FRED macro series (e.g. ``CPIAUCSL``, ``FEDFUNDS``, ``M2SL``)."""
    return _get("/api/fred/observations", params={"series_id": series_id})


def get_quote(symbol: str) -> dict[str, Any]:
    """Fetch the latest quote for a symbol (e.g. ``EUR/USD``, ``XAU/USD``)."""
    return _get("/api/quote", params={"symbol": symbol})


def summarize_corpus(records: dict[str, Any]) -> list[dict[str, str]]:
    """Compress the semantic corpus into lightweight {id,title,summary,pages}.

    Keeps agent prompts small and cheap while preserving the internal-linking
    surface the content crew needs.
    """
    summary: list[dict[str, str]] = []
    for key, rec in (records or {}).items():
        if not isinstance(rec, dict):
            continue
        summary.append(
            {
                "id": rec.get("id", key),
                "title": rec.get("title", ""),
                "summary": rec.get("summary", ""),
                "keywords": ", ".join(rec.get("keywords", []) or []),
                "related_pages": ", ".join(rec.get("relatedPages", []) or []),
            }
        )
    return summary
